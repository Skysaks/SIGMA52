// Tests du moteur blackjack : node test/bj.test.js
// Probabilités du croupier contre un calcul indépendant, stratégie de base 6 jeux connue, cohérence calcul exact / simulation,
// indices et données précalculées.
const BJ = require('../src/bj_engine.js'), D = require('../src/bj_data.js'), K = require('../src/bj_course.js'), CT = require('../src/bj_counts.js');
const assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('croupier : sabot quasi infini = calcul indépendant sans retrait', () => {
  const ind = (up) => { const p = (r) => (r === 10 ? 4 / 13 : 1 / 13); let bust = 0;
    (function rec(sum, ace, pr) { const tt = ace && sum + 10 <= 21 ? sum + 10 : sum; if (sum > 21) { bust += pr; return; } if (tt >= 17) return; for (let r = 1; r <= 10; r++) rec(sum + r, ace || r === 1, pr * p(r)); })(up, up === 1, 1); return bust; };
  const c = BJ.Calc({ decks: 4000, peek: false }), s = BJ.shoeOf(4000);
  for (const u of [2, 3, 4, 5, 6, 7, 8, 9]) { const x = s.slice(); x[u]--; assert(Math.abs(c.dealerDist(x, u)[5] - ind(u)) < 2e-4, 'up ' + u); }
});
t('croupier : la distribution somme à 1', () => {
  for (const peek of [true, false]) { const c = BJ.Calc({ decks: 6, peek }), s = BJ.shoeOf(6); for (const u of BJ.UPS) { const x = s.slice(); x[u]--; const d = c.dealerDist(x, u); assert(Math.abs(d.reduce((a, b) => a + b, 0) - 1) < 1e-9); } }
});
t('stratégie de base 6 jeux S17 DAS : cases de référence', () => {
  const T = D.presets.strip.table, c = (row, up) => T[row][up].c;
  assert.strictEqual(c('h16', 10), 'Rh'); assert.strictEqual(c('h16', 7), 'H'); assert.strictEqual(c('h12', 2), 'H'); assert.strictEqual(c('h12', 4), 'S');
  assert.strictEqual(c('h11', 10), 'Dh'); assert.strictEqual(c('h11', 1), 'H'); assert.strictEqual(c('h9', 2), 'H'); assert.strictEqual(c('h9', 3), 'Dh');
  assert.strictEqual(c('s7', 2), 'S'); assert.strictEqual(c('s7', 3), 'Ds'); assert.strictEqual(c('s7', 9), 'H'); assert.strictEqual(c('s2', 4), 'H');
  assert.strictEqual(c('p8', 10), 'P'); assert.strictEqual(c('p9', 7), 'S'); assert.strictEqual(c('p4', 5), 'P'); assert.strictEqual(c('p10', 6), 'S'); assert.strictEqual(c('p5', 9), 'Dh');
});
t('jeu européen : 11 et 8,8 contre 10 se tirent', () => {
  const T = D.presets.europe.table; assert.strictEqual(T.h11[10].c, 'H'); assert.strictEqual(T.p8[10].c, 'H'); assert.strictEqual(T.p1[1].c, 'H');
});
t('croupier tire soft 17 : A,8 contre 6 et 11 contre As se doublent', () => {
  const T = D.presets.h17.table; assert.strictEqual(T.s8[6].c, 'Ds'); assert.strictEqual(T.h11[1].c, 'Dh');
});
t('avantage de la maison : ordre des jeux et coût des règles', () => {
  const e = (k) => D.presets[k].edge;
  assert(e('strip') < e('h17') && e('h17') < e('europe') && e('europe') < e('sixcinq'));
  const cost = Object.fromEntries(D.ruleCosts.rows);
  assert(cost['Blackjack payé 6:5'] > 1.2e-2 && cost['Croupier tire sur soft 17'] > 0 && cost['1 jeu'] < 0 && cost['Re-split des as autorisé'] < 0);
});
t('simulation ≈ calcul exact (jeu sans carte cachée, 1,5 M mains)', () => {
  const r = D.presets.europe.rules, table = Object.fromEntries(Object.entries(D.presets.europe.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))]));
  let u = 0, b = 0; for (let k = 0; k < 3; k++) { const s = BJ.simulate({ rules: r, table, hands: 500000, seed: 101 + k }); u += s.units; b += s.avgBet * s.hands; }
  const sim = -u / b; assert(Math.abs(sim - D.presets.europe.edge) < 0.0025, sim + ' vs ' + D.presets.europe.edge);
});
t('indices : assurance vers +3, 16 contre 10 entre 0 et +2, 15 contre 10 vers +4', () => {
  const I = D.presets.strip.indices, f = (row, up, act) => I.find((d) => d.row === row && d.up === up && d.act === act);
  assert.strictEqual(D.presets.strip.insurance.index, 3);
  assert(f('h16', 10, 'stand').index >= 0 && f('h16', 10, 'stand').index <= 2);
  assert.strictEqual(f('h15', 10, 'stand').index, 4);
  assert.strictEqual(f('h14', 10, 'surrender').index, 3);
});
t('avantage par true count croissant', () => {
  for (const k of Object.keys(D.presets)) { const e = D.presets[k].edgeByTC; for (let i = 1; i < e.length; i++) assert(e[i][1] > e[i - 1][1], k); }
});
t('true count : sabot moyen équilibré', () => {
  const s = BJ.shoeAtTC(3, 2), rc = [2, 3, 4, 5, 6].reduce((a, r) => a + (12 - s[r]), 0) - ((48 - s[10]) + (12 - s[1]));
  assert(Math.abs(BJ.total(s) - 156) < 1e-9); assert(Math.abs(rc - 6) < 1e-9, rc);
});
t('cours : 29 modules en 7 parties, quiz bien formés', () => {
  assert.strictEqual(K.MODULES.length, 29); assert(K.MODULES.every((m) => K.PARTS.includes(m.part)));
  for (const m of K.MODULES) for (const q of m.quiz) assert(q.ok >= 0 && q.ok < q.opts.length && q.why, m.id);
});
t('systèmes : équilibre et déséquilibre connus', () => {
  const b = CT.byId; assert(b.hilo.balanced && b.zen.balanced && b.halves.balanced && b.omega2.balanced && b.hiopt2.balanced && b.uapc.balanced && b.silverfox.balanced && b.tencount.balanced);
  assert.strictEqual(b.ko.imb, 4); assert.strictEqual(b.red7.imb, 2); assert.strictEqual(b.uss.imb, 4);
  assert.strictEqual(CT.irc(b.ko, 6), -20); assert.strictEqual(CT.irc(b.red7, 6), -12);
  let s7 = 0; for (let c = 0; c < 52; c++) s7 += CT.tagOfCard(b.red7, c); assert.strictEqual(s7, 2);
});
t('sabot moyen : le modèle général redonne le Hi-Lo', () => {
  for (const tc of [-3, 2, 5]) { const a = BJ.shoeAtTC(3, tc), b = BJ.shoeAtTC(3, tc, BJ.HILO); for (let r = 1; r <= 10; r++) assert(Math.abs(a[r] - b[r]) < 1e-9); }
});
t('corrélations proches des valeurs de référence (Hi-Lo BC ≈ 0,97, IC ≈ 0,76 ; Ten Count IC = 1)', () => {
  const C = D.counts.strip.systems;
  assert(Math.abs(C.hilo.bc - 0.97) < 0.02, C.hilo.bc); assert(Math.abs(C.hilo.ic - 0.76) < 0.01); assert(Math.abs(C.tencount.ic - 1) < 1e-9);
  assert(C.halves.bc > C.hilo.bc && C.hiopt1.ic > C.hilo.ic && C.hiopt1.bcAce > C.hiopt1.bc);
});
t('effets de retrait : 5 le plus favorable au joueur, 10 et as défavorables, moyenne pondérée ≈ 0', () => {
  for (const k of ['europe', 'strip']) { const e = D.counts[k].eor.eor; const mx = Math.max(...e.slice(1)); assert.strictEqual(e[5], mx); assert(e[10] < 0 && e[1] < 0);
    const s = e.reduce((a, x, r) => a + (r ? CT.W[r] * x : 0), 0); assert(Math.abs(s / 52) < 0.0005, s); }
});
console.log(n, 'tests');
