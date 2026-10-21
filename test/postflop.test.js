// Tests du solveur postflop : jeux jouets à solution connue, cohérence des EV, équité, convergence.
const assert = require('assert');
const PF = require('../src/postflop.js'), E = require('../src/engine.js'), C = require('../src/charts.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };
const close = (a, b, eps, m) => assert(Math.abs(a - b) <= eps, `${m} : ${a} au lieu de ${b} ± ${eps}`);

// Jeu polarisé : IP a des sets ou de l'air, OOP que des bluff-catchers. Équilibre : bluffs = B/(P+2B) de la range de mise, OOP paie P/(P+B).
function polar(betPct) {
  const g = PF.create({ board: 'AsKd7c2h3s', pot: 10, stack: 100, ranges: ['KQo, KJo', '77, 22:0.5, Q9o, J9o, T9o, 98o:0.5'],
    sizes: { river: [{ bet: [], raise: [] }, { bet: [betPct], raise: [] }] }, maxRaises: 0 });
  g.iterate(1500);
  const r1 = g.info([0]), n1 = g.N[1]; let val = 0, bl = 0;
  g.hands[1].forEach(([a, b], i) => { const m = r1.reach[1][i] * r1.strategy[n1 + i]; if (a >> 2 === b >> 2) val += m; else bl += m; });
  const r2 = g.info([0, 1]);
  return { g, bluffShare: bl / (val + bl), call: r2.freq[1], ex: g.exploitability().pct };
}
t('jeu polarisé, mise pot : 1/3 de bluffs, OOP paie 50 %', () => {
  const r = polar(100); close(r.bluffShare, 1 / 3, 0.02, 'part de bluffs'); close(r.call, 0.5, 0.03, 'fréquence de call'); assert(r.ex < 0.2, 'exploitabilité ' + r.ex);
});
t('jeu polarisé, mise demi-pot : 1/4 de bluffs, OOP paie 2/3', () => {
  const r = polar(50); close(r.bluffShare, 0.25, 0.02, 'part de bluffs'); close(r.call, 2 / 3, 0.03, 'fréquence de call');
});
t('la somme des EV des deux ranges égale le pot, à chaque nœud', () => {
  const { g } = polar(100);
  for (const path of [[], [0], [0, 1], [0, 1, 1]]) { const r = g.info(path); close(r.evMean[0] + r.evMean[1], r.pot, 1e-6, 'somme des EV ' + path); }
});
t('équité du solveur = équité exacte du moteur (river et turn)', () => {
  for (const board of ['Ks7d2c9h4s', 'Ks7d2c9h']) {
    const g = PF.create({ board, pot: 10, stack: 50, ranges: ['AhKh', 'QQ, 77, AJs, T9s'], maxRaises: 0 });
    const r = g.info([]);
    // Référence exacte : moyenne, combo par combo, de l'équité énumérée sur toutes les rivers restantes.
    const hero = E.parseCards('AhKh'), bd = E.parseCards(board), combos = E.rangeCombos('QQ, 77, AJs, T9s', [...bd, ...hero]);
    let num = 0, den = 0;
    for (const c of combos) { const used = new Set([...bd, ...hero, ...c]), rivers = bd.length === 5 ? [null] : [...Array(52).keys()].filter((x) => !used.has(x)); for (const rv of rivers) { const b = rv === null ? bd : [...bd, rv], a = E.evaluate([...hero, ...b]), v = E.evaluate([...c, ...b]); num += a > v ? 1 : a === v ? 0.5 : 0; den++; } }
    close(r.eqMean[0], num / den, 0.002, 'équité ' + board);
  }
});
t('parseur de ranges pondérées', () => {
  const h = PF.parseWeighted('AA, KK:0.5, AKs:25%, AhKh:1, QQ:0', E.parseCards('As2c3d'));
  assert.equal(h.filter(([a, b]) => a >> 2 === 12 && b >> 2 === 12).length, 3, 'AA sans As');
  assert(h.every(([a, b, w]) => (a >> 2 === 11 && b >> 2 === 11 ? w === 0.5 : true)));
  assert.equal(h.find(([a, b]) => E.cardStr(a) + E.cardStr(b) === 'AhKh' || E.cardStr(b) + E.cardStr(a) === 'AhKh')[2], 1);
  assert(!h.some(([a, b]) => a >> 2 === 10 && b >> 2 === 10), 'QQ:0 retire');
  assert.equal(PF.rangeText(PF.parseWeighted('KK:0.5, AKs')), 'AKs, KK:0.5');
});
t('river réelle (BTN contre BB) : exploitabilité < 0,5 % du pot', () => {
  const g = PF.create({ board: 'Ks7d2c9h4s', pot: 5.5, stack: 97.5, ranges: [C.FACING.BTN.BB.call, C.RFI.BTN.range],
    sizes: { river: [{ bet: [50, 100], raise: [100] }, { bet: [50, 100, 'a'], raise: [100] }] } });
  let ex = 100; for (let k = 0; k < 12 && ex > 0.5; k++) { g.iterate(25); ex = g.exploitability().pct; }
  assert(ex <= 0.5, 'exploitabilité ' + ex);
  const r = g.info([]); close(r.evMean[0] + r.evMean[1], 5.5, 1e-6, 'EV');
});
t('turn : convergence et cohérence', () => {
  const g = PF.create({ board: 'Qh8s3d5c', pot: 20, stack: 40, ranges: ['QQ, 88, 55, AQs, KQs, QJs, JTs, T9s, 97s', 'AA-99, AQ, KQ, A8s'],
    sizes: { turn: [{ bet: [], raise: [] }, { bet: [75], raise: [] }], river: [{ bet: [75], raise: [] }, { bet: [75], raise: ['a'] }] } });
  let ex = 100; for (let k = 0; k < 16 && ex > 1; k++) { g.iterate(25); ex = g.exploitability().pct; }
  assert(ex <= 1, 'exploitabilité ' + ex);
  const r = g.info([]); close(r.evMean[0] + r.evMean[1], 20, 1e-6, 'EV');
  // Chemin vers une river : check, check, carte.
  const r3 = g.info([0, 0, E.card('2h')]); assert.equal(r3.board.length, 5);
});
t('tapis effectif nul : abattage direct, EV = équité × pot', () => {
  const g = PF.create({ board: 'Ks7d2c', pot: 10, stack: 0, ranges: ['AA', 'KQs'] });
  const r = g.info([]); close(r.evMean[0], 10 * r.eqMean[0], 1e-6, 'EV');
});
t('flop échantillonné : arbre approché signalé, EV cohérentes', () => {
  const g = PF.create({ board: 'Ks7d2c', pot: 5.5, stack: 20, ranges: ['22+, A2s+, KTs+, QJs, ATo+, KJo+', '22+, A2s+, K9s+, Q9s+, J9s+, T9s, A9o+, KTo+'],
    sizes: { flop: [{ bet: [], raise: [] }, { bet: [50], raise: [] }], turn: [{ bet: [], raise: [] }, { bet: [75], raise: [] }], river: [{ bet: [], raise: [] }, { bet: [75], raise: [] }] }, sample: { turn: 6, river: 4 }, maxRaises: 0 });
  assert(g.stats().approx);
  g.iterate(60); const r = g.info([]); close(r.evMean[0] + r.evMean[1], 5.5, 0.05, 'EV');
});
t('rake : la somme des EV égale le pot moins le rake moyen, et le rake réduit les EV', () => {
  const base = { board: 'Ks7d2c9h4s', pot: 20, stack: 0, ranges: ['AA, KK', 'QQ, JJ'] };
  const a = PF.create(base).info([]), b = PF.create({ ...base, rake: { pct: 0.05, cap: 3 } }).info([]);
  close(b.evMean[0] + b.evMean[1], 20 - 1, 1e-6, 'EV avec rake');
  assert(b.evMean[0] < a.evMean[0]);
});
console.log(n, 'tests passés');
