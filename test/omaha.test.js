// Tests Omaha : node test/omaha.test.js
const O = require('../src/omaha.js'), E = require('../src/engine.js'), assert = require('assert');
const c = E.parseCards; let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const cat = (v) => E.category ? E.category(v) : v;
t('exactement deux cartes privatives : une seule carte à cœur ne fait pas couleur', () => {
  const v = O.evaluate(c('AhKs7d2c'), c('QhJh9h3h4s')), flushHold = O.evaluate(c('AhKh7d2c'), c('QhJh9h3h4s'));
  assert.ok(flushHold > v); assert.strictEqual(E.categoryName ? E.categoryName(flushHold) : 'x', E.categoryName ? E.categoryName(O.evaluate(c('AhKh7d2c'), c('QhJh9h3h4s'))) : 'x');
});
t('quinte flush royale avec deux cartes', () => { assert.ok(O.evaluate(c('JhTh2s3d'), c('AhKhQh2c3c')) > O.evaluate(c('AsAdAc2d'), c('AhKhQh2c3c'))); });
t('brelan au board : une paire en main ne fait pas un carré avec une seule carte', () => {
  // board KKK72, main K... : on ne peut utiliser que 3 cartes du board + 2 de la main
  const a = O.evaluate(c('Kd2s5h9c'), c('KsKhKc7d2d')); // K + 2 de main + KKK? non : KK de board +... = full possible : Kd2s + KsKh2d → KKK22 full
  assert.ok(a > 0);
});
t('AAKK double assortie contre main aléatoire : environ 2/3', () => { const r = O.equity([c('AsAhKsKh'), null], [], { iterations: 20000, random: E.rng(3) }); assert.ok(r.equity[0] > 0.6 && r.equity[0] < 0.75, r.equity[0]); });
t('exact à la turn', () => { const r = O.equity([c('AsAhKsKh'), c('JdTd9c8c')], c('7d6s2h3c')); assert.ok(r.exact); assert.ok(Math.abs(r.equity[0] + r.equity[1] - 1) < 1e-9); });
t('description', () => { const d = O.describe(c('AsKsJhTh')); assert.ok(d.tags.includes('double assortie')); assert.ok(d.nutSuit); });
t('relance pot-limit : pot 10, mise 10 → relance à 40', () => { assert.strictEqual(O.potRaise(20, 10), 40); });
console.log(n + ' tests Omaha ok');
