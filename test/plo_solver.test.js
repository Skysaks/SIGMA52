// Tests du solveur PLO : node test/plo_solver.test.js
const E = require('../src/engine.js'), O = require('../src/omaha.js'), PS = require('../src/plo_solver.js'), L = require('../src/live.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const rank = (h) => { const x = L.ploTable(h); return x ? x.pct : null; };
// Équité exacte par force brute : chaque main contre la range adverse (cartes partagées exclues), tous les tirages restants.
function brute(board, mine, opp) {
  const out = [];
  for (const h of mine) {
    let num = 0, den = 0;
    const deck = []; for (let c = 0; c < 52; c++) if (!board.includes(c) && !h.slice(0, 4).includes(c)) deck.push(c);
    for (const o of opp) {
      const oc = o.slice(0, 4); if (oc.some((c) => h.slice(0, 4).includes(c))) continue;
      const runs = board.length === 5 ? [[]] : deck.filter((c) => !oc.includes(c)).map((c) => [c]);
      for (const r of runs) { const b = board.concat(r), a = O.evaluate(h.slice(0, 4), b), v = O.evaluate(oc, b); num += a > v ? 1 : a === v ? 0.5 : 0; den++; }
    }
    out.push(den ? num / den : NaN);
  }
  return out;
}
t('inclusion-exclusion : équités river et turn identiques à la force brute (mains qui se recoupent)', () => {
  for (const bs of ['Ks7d2c5h9s', 'Ah8h3d3c']) {
    const board = E.parseCards(bs);
    // Petites ranges concentrées sur peu de cartes pour forcer les recoupements (1, 2, 3 cartes et mains identiques).
    const pool = E.parseCards('AsAdKhKdQsQhJdJcTsTh9d9c8s8h'), R = E.rng(5), mk = () => { const h = new Set(); while (h.size < 4) h.add(pool[Math.floor(R() * pool.length)]); return [...h, 1]; };
    const r0 = Array.from({ length: 40 }, mk), r1 = Array.from({ length: 40 }, mk).concat([r0[0].slice()]);
    const g = PS.create({ board, pot: 10, stack: 0, ranges: [r0, r1] }), inf = g.info([]);
    const b = brute(board, g.hands[0], g.hands[1]);
    let worst = 0; b.forEach((x, i) => { if (isFinite(x)) worst = Math.max(worst, Math.abs(x - inf.eq[0][i])); });
    assert(worst < 1e-9, bs + ' écart ' + worst);
  }
});
t('river : équilibre atteint, EV des deux joueurs = pot de départ, valeur > bluff', () => {
  const board = E.parseCards('Ks7d2c5h9s');
  const g = PS.create({ board, pot: 10, stack: 50, ranges: [PS.sampleRange(rank, 0, 0.5, 300, board, 3), PS.sampleRange(rank, 0, 0.4, 300, board, 4)] });
  g.iterate(200); const ex = g.exploitability();
  assert(ex.pct < 0.5, 'exploitabilité ' + ex.pct);
  const r = g.info([]); assert(Math.abs(r.evMean[0] + r.evMean[1] - 10) < 0.3, r.evMean);
  // IP après check : la mise vient des mains fortes et des mains les plus faibles (polarisée), pas des mains moyennes.
  const r1 = g.info([0]), n1 = g.N[1], bet = r1.node.acts.findIndex((a) => a.k !== 'x'), eq = r1.eq[1];
  const idx = [...Array(n1).keys()].filter((i) => isFinite(eq[i])).sort((a, b) => eq[b] - eq[a]), q = Math.floor(idx.length / 5);
  const freq = (l) => l.reduce((s, i) => s + r1.strategy[bet * n1 + i], 0) / l.length;
  const top = freq(idx.slice(0, q)), mid = freq(idx.slice(2 * q, 3 * q));
  assert(top > 0.6 && top > mid + 0.3, `haut ${top} milieu ${mid}`);
});
t('pot-limit : aucune mise ni relance au-delà du pot', () => {
  const board = E.parseCards('Ks7d2c5h9s');
  const g = PS.create({ board, pot: 10, stack: 500, sizes: { river: [{ bet: [150, 'a'], raise: [] }, { bet: [66], raise: [200, 'a'] }] }, maxRaises: 2, ranges: [PS.sampleRange(rank, 0, 0.5, 40, board, 3), PS.sampleRange(rank, 0, 0.5, 40, board, 4)] });
  for (const nd of g.nodes) if (nd.t === PS.ACT) for (const a of nd.acts) {
    const o = 1 - nd.p, toCall = nd.bets[o] - nd.bets[nd.p];
    if (a.k === 'b' || (a.k === 'a' && toCall === 0)) assert(a.to - nd.bets[nd.p] <= nd.pot + 1e-6, 'mise ' + a.to + ' pot ' + nd.pot);
    if (a.k === 'r' || (a.k === 'a' && toCall > 0)) assert(a.to <= nd.bets[o] + nd.pot + toCall + 1e-6, 'relance');
  }
  const lab = g.label(g.root, g.root.acts.length - 1); assert(/pot/.test(lab), lab);
});
t('échantillon de range : rangs respectés, cartes mortes exclues, main imposée incluse', () => {
  const dead = E.parseCards('Ks7d2c'), must = E.parseCards('AsAhJdTd'), r = PS.sampleRange(rank, 0.1, 0.3, 120, dead, 9, [must]);
  assert(r.length === 120 && r.every((h) => !h.slice(0, 4).some((c) => dead.includes(c))));
  assert(r.slice(1).every((h) => { const x = rank(h.slice(0, 4)); return x >= 0.1 && x <= 0.3; }));
  assert.deepStrictEqual(r[0].slice(0, 4), must);
});
console.log(n + ' tests réussis');
