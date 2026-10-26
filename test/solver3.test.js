// Tests du solveur à trois joueurs : node test/solver3.test.js
const E = require('../src/engine.js'), S3 = require('../src/solver3.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const R3 = ['22-TT, A2s-AJs, K6s-KJs, Q8s-QJs, J8s+, T8s+, 97s+, 86s+, 75s+, 64s+, 54s, A9o-AJo, KTo-KQo, QTo+, JTo', '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A9o+, KTo+, QTo+, JTo', '22-JJ, A9s-AQs, KTs-KQs, QTs+, JTs, T9s, 98s, 87s, 76s, 65s, AQo, KQo'];
t('arbre : tours de mise corrects (check à trois, mise puis deux réponses, relance qui rouvre le tour)', () => {
  const g = S3.create({ board: 'Ks7d2c5h9s', pot: 8, stack: 50, ranges: R3, sizes: { river: { bet: [66], raise: ['a'] } } });
  const r = g.root, x = r.acts.findIndex((a) => a.k === 'x');
  const n1 = r.ch[x], n2 = n1.ch[n1.acts.findIndex((a) => a.k === 'x')], end = n2.ch[n2.acts.findIndex((a) => a.k === 'x')];
  assert(n1.p === 1 && n2.p === 2 && end.t === S3.TERM && end.show);
  const b = r.ch[r.acts.findIndex((a) => a.k === 'b')]; assert(b.p === 1 && b.acts.map((a) => a.k).join('') === 'fca');
  const call = b.ch[1]; assert(call.p === 2, 'après mise + call, le 3e joueur parle');
  const shove = call.ch[call.acts.findIndex((a) => a.k === 'a')]; assert(shove.p === 0, 'la relance rouvre le tour au miseur');
  const folds = b.ch[0].ch[0]; assert(folds.t === S3.TERM && !folds.show && folds.live.filter(Boolean).length === 1, 'deux folds : pot gagné');
});
t('river : convergence, EV cohérentes, mises multiway peu bluffées', () => {
  const g = S3.create({ board: 'Ks7d2c5h9s', pot: 8, stack: 97.5, ranges: R3 });
  g.iterate(150); const ex = g.exploitability(); assert(ex.maxPct < 1.5, JSON.stringify(ex));
  const r = g.info([]), sum = r.evMean.reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 8) < 0.5, 'somme des EV ' + sum); // approximation d'indépendance entre adversaires : quelques %
  // BTN après deux checks : ses mises viennent surtout des mains fortes.
  const r2 = g.info([0, 0]), p = 2, nn = g.N[p], bi = r2.node.acts.findIndex((a) => a.k === 'b');
  let hi = 0, hw = 0, lo = 0, lw = 0;
  for (let i = 0; i < nn; i++) { const w = r2.reach[p][i], e = r2.eq[p][i], f = r2.strategy[bi * nn + i]; if (!(w > 0) || !isFinite(e)) continue; if (e > 0.7) { hi += w * f; hw += w; } else if (e > 0.25 && e < 0.5) { lo += w * f; lw += w; } }
  assert(hi / hw > 0.5 && lo / lw < 0.2, `forte ${hi / hw} moyenne ${lo / lw}`);
});
t('turn échantillonné : résout et garde des valeurs finies', () => {
  const g = S3.create({ board: 'Ks7d2c5h', pot: 8, stack: 97.5, ranges: R3, sample: { river: 6 } });
  g.iterate(30); const r = g.info([]); assert(r.evMean.every(isFinite) && g.stats().approx);
});
t('blocages à trois : masse jointe exacte (comparée à l\'énumération des triplets)', () => {
  const g = S3.create({ board: 'Ks7d2c5h9s', pot: 8, stack: 20, ranges: ['AA, KQs, QJs, AhQd:0.5', 'AQs, QJs, JTs, AA:0.7', 'AJs, QQ, JTs, AsJd'] });
  let mx = 0, gap = 0;
  for (let p = 0; p < 3; p++) {
    const [j, k] = [0, 1, 2].filter((q) => q !== p), A = g.jointMass(p), H = g.hands;
    H[p].forEach(([a, b], i) => {
      let ex = 0, ind = 0, mj = 0, mk = 0;
      for (const x of H[j]) { if ([x[0], x[1]].some((c) => c === a || c === b)) continue; mj += x[2]; for (const y of H[k]) { if ([y[0], y[1]].some((c) => c === a || c === b || c === x[0] || c === x[1])) continue; ex += x[2] * y[2]; } }
      for (const y of H[k]) if (![y[0], y[1]].some((c) => c === a || c === b)) mk += y[2];
      ind = mj * mk; mx = Math.max(mx, Math.abs(A[i] - ex)); gap = Math.max(gap, Math.abs(ind - ex));
    });
  }
  assert(mx < 1e-9, 'écart ' + mx); assert(gap > 0.01, 'le cas teste bien des blocages mutuels');
});
console.log(n + ' tests réussis');
