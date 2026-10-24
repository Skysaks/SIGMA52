// Tests du cœur de calcul en fil séparé, du chasseur tapis/couché et de la banque de quiz : node test/review.test.js
const E = require('../src/engine.js'), T = require('../src/table.js'), R = require('../src/review.js'), SV = require('../src/solver.js');
const HH = require('../src/hh.js'), PF = require('../src/postflop.js'), { core } = require('../src/pf_worker.js'), Q = require('../src/handquiz_data.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const ta = async (name, fn) => { await fn(); n++; console.log('ok', name); };

(async () => {
  await ta('cœur du solveur : résolution par tranches, nœud, ranges, libération', () => new Promise((resolve, reject) => {
    const got = {};
    const h = core((m) => {
      if (m.rid === 4) { assert(/introuvable/.test(m.error || '')); return resolve(); }
      if (m.error) return reject(new Error(m.error));
      if (m.done) { got.done = m; h({ cmd: 'node', id: 1, rid: 2, path: [], combos: { 0: 0, 1: 0 } }); h({ cmd: 'ranges', id: 1, rid: 3, path: [] }); }
      if (m.rid === 2) got.node = m.node;
      if (m.rid === 3) {
        got.ranges = m.ranges;
        assert(got.done.ex <= 0.5 && got.done.hands[0].length > 0);
        assert(got.node.t === 'act' && got.node.acts.length >= 2 && Math.abs(got.node.combo[0].strat.reduce((a, b) => a + b, 0) - 1) < 1e-6);
        // L'EV de la main au nœud = somme des EV d'action pondérées par sa stratégie.
        const c = got.node.combo[0], mix = c.strat.reduce((a, s, i) => a + s * c.ev[i], 0);
        assert(Math.abs(mix - got.node.ev[0]) < 0.05, mix + ' / ' + got.node.ev[0]);
        assert(got.ranges[0].length === got.done.hands[0].length);
        h({ cmd: 'free', id: 1 }); h({ cmd: 'node', id: 1, rid: 4, path: [] });
      }
    });
    h({ cmd: 'solve', id: 1, cfg: { board: 'Ks7d2c5h9c', pot: 10, stack: 50, ranges: ['AA, KK, 77, 55, AK, KQ, 98s', 'QQ-88, AQ, KJ, QJs, T9s, 76s'], sizes: { river: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }] }, maxRaises: 1 }, pct: 0.5, maxMs: 20000 });
  }));

  // Tournois simulés (Expresso) : historiques au format tournoi.
  const L = [[10, 20], [15, 30], [20, 40], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200], [150, 300]];
  const parts = [], rnd = E.rng(11);
  for (let g = 0; g < 15; g++) { const tb = new T.Table({ random: rnd, lineup: ['reg', 'station'], stack: 500, rebuy: false, levels: L, handsPerLevel: 6 }); for (let h = 0; h < 80 && !tb.over; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } } parts.push(tb.exportHH()); }
  const text = parts.join('\n\n\n');
  t('historiques de tournoi reconnus (en-tête Tournament, blindes du niveau)', () => {
    const h = HH.parseHand(HH.split(text)[20]); assert(h.tournament && h.bb >= 20 && h.bb % 10 === 0);
  });
  t('tapis ou couché : spots trouvés, EV cohérentes, pertes positives', () => {
    const r = R.pushFoldReview(text);
    assert(r.tournamentHands > 150 && r.spots.length > 30, JSON.stringify([r.tournamentHands, r.spots.length]));
    r.spots.forEach((s) => { assert(s.loss >= 0 && Number.isFinite(s.loss)); assert(s.best === (s.kind === 'open' ? (s.evs.push > 0 ? 'push' : 'fold') : s.evs.call > 0 ? 'call' : 'fold')); });
    console.log(`    ${r.spots.length} décisions, ${r.errs.length} erreurs du bot régulier, ${r.lossBB.toFixed(2)} bb`);
  });
  t('tapis ou couché : en tête-à-tête SB, EV = solveur de Nash exact', () => {
    const r = R.pushFoldReview(text), hu = r.spots.find((s) => s.kind === 'open' && /Nash exact/.test(s.how));
    assert(hu, 'aucun spot tête-à-tête');
    const ev = SV.solveChip(Math.max(1, Math.min(25, Math.round(hu.S * 2) / 2))).evPush[SV.idx(hu.hand)];
    assert(Math.abs(ev - hu.evs.push) < 0.6, ev + ' / ' + hu.evs.push); // antes et tapis effectif arrondi
  });
  t('tapis ou couché : payer avec AA est toujours juste, se coucher avec AA est une erreur', () => {
    const r = R.pushFoldReview(text); const aa = r.spots.filter((s) => s.hand === 'AA');
    aa.forEach((s) => assert(s.best !== 'fold'));
  });
  t('familles de fuites', () => {
    assert.strictEqual(R.leakFamily('f', 'c', true), 'Couché alors qu\'il fallait continuer');
    assert.strictEqual(R.leakFamily('c', 'f', true), 'Payé alors qu\'il fallait se coucher');
    assert(/passif/.test(R.leakFamily('x', 'b', false)) && /Mise de trop/.test(R.leakFamily('b', 'x', false)) && /taille/.test(R.leakFamily('b', 'a', false)));
  });
  t('banque de quiz : champs complets et réponse nette', () => {
    assert(Q.length >= 5);
    for (const q of Q) {
      assert(q.o.length === q.e.length && q.e.length === q.f.length && q.o.length >= 2);
      const cards = E.parseCards(q.b + q.h); assert(new Set(cards).size === cards.length && cards.length >= 5);
      const best = q.e.reduce((b, x, i) => (x > q.e[b] + 1e-9 || (Math.abs(x - q.e[b]) <= 1e-9 && q.f[i] > q.f[b]) ? i : b), 0); assert(q.f[best] >= 0.49, JSON.stringify(q));
      assert(Math.abs(q.f.reduce((a, b) => a + b, 0) - 1) < 0.05);
    }
  });
  console.log(n + ' tests réussis');
})().catch((e) => { console.error(e); process.exit(1); });
