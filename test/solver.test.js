// Tests du solveur : node test/solver.test.js
const S = require('../src/solver.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const close = (a, b, e, m) => assert(Math.abs(a - b) < e, `${m} : ${a} vs ${b}`);
t('matrice préflop : équités connues', () => {
  close(S.eq(S.idx('AA'), S.idx('KK')), 0.8195, 0.004, 'AA/KK');
  close(S.eq(S.idx('AKs'), S.idx('QQ')), 0.46, 0.006, 'AKs/QQ');
  close(S.eq(S.idx('22'), S.idx('AKo')), 0.527, 0.006, '22/AKo');
  close(S.eq(S.idx('KK'), S.idx('AA')) + S.eq(S.idx('AA'), S.idx('KK')), 1, 1e-4, 'symétrie');
});
t('Nash tête-à-tête 10 bb = référence publiée (58,4 % de tapis)', () => {
  const r = S.solveChip(10); close(r.pushPct, 0.584, 0.006, 'tapis'); assert(r.callPct > 0.33 && r.callPct < 0.42, r.callPct);
  assert(r.push[S.idx('A2o')] > 0.99 && r.push[S.idx('96s')] > 0.95 && r.push[S.idx('72o')] < 0.01);
});
t('plus le tapis est court, plus on pousse large', () => {
  let prev = 1; for (const s of [3, 5, 8, 12, 16, 20, 25]) { const p = S.solveChip(s).pushPct; assert(p < prev + 1e-9, s); prev = p; }
});
t('ICM : somme = prize pool, gagnant-prend-tout = part des jetons', () => {
  const v = S.icm([50, 30, 20], [50, 30, 20]); close(v.reduce((a, b) => a + b, 0), 100, 1e-9, 'somme');
  S.icm([50, 30, 20], [100]).forEach((x, i) => close(x, [50, 30, 20][i], 1e-9, 'WTA'));
});
t('ICM gagnant-prend-tout = équilibre en jetons', () => {
  const o = S.icmOutcomes([12, 8, 20], 1, 2, [100]), a = S.solveOutcomes(o.V), b = S.solveChip(8);
  close(a.pushPct, b.pushPct, 0.006, 'tapis'); close(a.callPct, b.callPct, 0.006, 'call');
});
t('ICM à deux places payées : la BB paie moins large', () => {
  const o = S.icmOutcomes([12, 8, 20], 1, 2, [65, 35]), a = S.solveOutcomes(o.V), b = S.solveChip(8);
  assert(a.callPct < b.callPct - 0.05, a.callPct + ' vs ' + b.callPct);
});
console.log(n, 'tests passés');
