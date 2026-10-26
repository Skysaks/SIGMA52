// Tests de la vague 4 : isomorphisme de couleurs, profils, ICM postflop, échantillon PLO stratifié, préflop (limp, pot à trois, EV),
// notation du coach en EV, FSRS.  node test/wave4.test.js
const assert = require('assert');
const PF = require('../src/postflop.js'), C = require('../src/charts.js'), E = require('../src/engine.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };
const R2 = [C.FACING.BTN.BB.call, C.RFI.BTN.range];
const sz = { flop: [{ bet: [33], raise: [] }, { bet: [33], raise: [] }], turn: [{ bet: [75], raise: [] }, { bet: [75], raise: [] }], river: [{ bet: [75], raise: [] }, { bet: [75], raise: [] }] };
t('isomorphisme de couleurs : turn exact identique avec et sans, cartes symétriques comprises', () => {
  const mk = (iso) => { const g = PF.create({ board: 'Qh8h3h5c', pot: 5.5, stack: 97.5, iso, ranges: R2, sizes: sz, maxRaises: 1 }); g.iterate(30); return g; };
  const a = mk(true), b = mk(false); assert(a.sym > 0 && b.sym === 0);
  const cards = a.info([0, 0]).node.cards; let mx = 0;
  for (const k of cards) { const x = a.info([0, 0, k]), y = b.info([0, 0, k]); assert.strictEqual(x.board.join(), y.board.join()); for (let p = 0; p < 2; p++) for (let i = 0; i < x.ev[p].length; i++) mx = Math.max(mx, Math.abs(x.ev[p][i] - y.ev[p][i])); for (let i = 0; i < (x.strategy || []).length; i++) mx = Math.max(mx, Math.abs(x.strategy[i] - y.strategy[i])); }
  assert(mx < 1e-4, 'écart ' + mx);
});
t('profil sur tout l\'arbre : contre une calling station, le miseur gagne plus et l\'adversaire se couche moins', () => {
  const g = PF.create({ board: 'Ks7d2c9h4s', pot: 5.5, stack: 97.5, ranges: R2, sizes: { river: [{ bet: [50], raise: [] }, { bet: [50, 100], raise: [100] }] } });
  g.iterate(250); const ev0 = g.info([]).evMean[1], b = g.info([0]).node.acts.findIndex((a) => a.k === 'b'), f0 = g.info([0, b]).freq[0];
  assert(g.applyProfile(0, { fp: 0.4, ap: 0.3 }) > 0); g.iterate(250);
  const ev1 = g.info([]).evMean[1], f1 = g.info([0, b]).freq[0];
  assert(ev1 > ev0 + 0.1, `EV ${ev0} -> ${ev1}`); assert(f1 < f0 - 0.1, `couché ${f0} -> ${f1}`);
  g.applyProfile(0, null); assert(!g.nodes.some((x) => x.profLock));
});
t('ICM : à la bulle, tapis et calls plus serrés qu\'en jetons ; exploitabilité mesurée correctement', () => {
  const base = { board: 'Ks7d2c9h4s', pot: 6, stack: 20, ranges: R2, sizes: { river: [{ bet: [], raise: [] }, { bet: ['a'], raise: [] }] } };
  const run = (icm) => { const g = PF.create({ ...base, icm }); g.iterate(300); return { g, shove: g.info([0]).freq[1], call: g.info([0, 1]).freq[1], ex: g.exploitability().pct }; };
  const c = run(null), i = run({ stacks: [20, 20, 5, 5], seats: [0, 1], payouts: [50, 30, 20] });
  assert(i.call < c.call - 0.05 && i.shove < c.shove, JSON.stringify([c.shove, c.call, i.shove, i.call]));
  assert(i.ex >= 0 && i.ex < 0.5, 'exploitabilité ICM ' + i.ex);
});
t('PLO : échantillon stratifié et range pondérée', () => {
  global.Engine = E; const Live = require('../src/live.js'), PS = require('../src/plo_solver.js');
  const rank = (h) => { const x = Live.ploTable(h); return x ? x.pct : null; }, board = E.parseCards('Kh8s4c2d7h');
  const r = PS.sampleRange(rank, 0.08, 0.6, 300, board, 5, [], { board }); assert.strictEqual(r.length, 300);
  assert(r.every((h) => !h.slice(0, 4).some((c) => board.includes(c))));
  const keys = new Set(r.map((h) => PS.handKey(h.slice(0, 4)))); assert.strictEqual(keys.size, 300);
  const half = PS.sampleRange(rank, 0, 1, 200, board, 9, [], { board, accept: (h) => (h.some((c) => c >> 2 === 12) ? 1 : 0) });
  assert(half.every((h) => h.slice(0, 4).some((c) => c >> 2 === 12)), 'acceptation respectée');
});
t('préflop : limp de SB, pot à trois et pertes d\'EV présents et cohérents', () => {
  const D = require('../src/preflop_data.js'), c = D.configs.find((x) => x.id === 'cash100');
  for (const k of ['lp:SB', 'lpr:SB']) assert(c.nodes.some((x) => x.key === k), k);
  const sq = c.nodes.find((x) => x.key === 'sq:BTN:SB:BB'); assert(sq.acts.some((a) => a.l.includes('trois')));
  const vo = c.nodes.find((x) => x.key === 'vo:BTN:BB'), i = E.ALL169.indexOf('AA'), L = vo.l.map((s) => (D.alph.indexOf(s[i]) / 63) ** 2 * D.lossMax);
  assert(Math.min(...L) === 0 && L[0] > 3, 'AA : se coucher coûte cher ' + L);
  const P = require('../src/plo_preflop_data.js'); assert.strictEqual(P.map.length, 16432); assert(P.configs[0].nodes.some((x) => x.key === 'rfi:BTN'));
});
t('coach : notation en EV (préflop par les ranges calculées, river par un solve)', () => {
  const TS = require('../src/table.js'), Co = require('../src/coach.js');
  let pre = 0, riv = 0;
  for (let h = 0; h < 150 && (pre < 5 || riv < 1); h++) {
    const tb = new TS.Table({ random: E.rng(300 + h), lineup: ['reg', 'reg', 'station', 'nit', 'maniaque'] }); tb.newHand(); tb.runBots();
    let guard = 0;
    while (!tb.done && guard++ < 40) {
      if (tb.toAct !== 0) { tb.runBots(); continue; }
      const a = Co.advise(tb, { iterations: 150, fast: true }), type = a.rec === 'fold' && tb.legal().canCheck ? 'check' : a.rec, gr = Co.grade(a, type, a.to, tb);
      if (gr.ev) { if (tb.street === 'pre') pre++; else riv++; assert(gr.evLoss >= 0 && /bb|meilleure/.test(gr.note)); }
      tb.act(type, a.to); tb.runBots();
    }
  }
  assert(pre >= 5 && riv >= 1, `préflop ${pre}, river ${riv}`);
});
t('FSRS : un rappel réussi allonge l\'intervalle, un oubli le raccourcit', () => {
  const F = require('../src/fsrs.js'), now = Date.parse('2026-01-01'), c = F.init(3, now), D = 864e5;
  const ok = F.review(c, 3, now + 3 * D), ko = F.review(c, 1, now + 3 * D);
  assert(ok.s > c.s && ko.s < ok.s && F.dueAt(ok) > F.dueAt(ko)); assert(Math.abs(F.retrievability(F.interval(10, 0.9), 10) - 0.9) < 1e-9);
});
console.log(n + ' tests réussis');
