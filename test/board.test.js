const E = require('../src/engine.js'), B = require('../src/board.js'), assert = require('assert');
const C = E.parseCards, k = (h, b) => B.MADE[B.classify(C(h), C(b)).made], d = (h, b) => B.classify(C(h), C(b)).draws.map((x) => B.DRAWS[x]);
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('mains faites', () => {
  assert.strictEqual(k('AsKd', 'Kh7c2d'), 'Top paire');
  assert.strictEqual(k('QsQd', 'Jh7c2d'), 'Overpair');
  assert.strictEqual(k('7s8d', 'Kh7c2d'), 'Paire moyenne');
  assert.strictEqual(k('2s3d', 'Kh7c2d'), 'Petite paire');
  assert.strictEqual(k('7s7d', 'Kh7c2d'), 'Brelan (set)');
  assert.strictEqual(k('Ks2d', 'Kh7c2d'), 'Double paire');
  assert.strictEqual(k('AsQd', 'Kh7c7d'), 'Rien');
  assert.strictEqual(k('As7d', 'Kh7c7d'), 'Brelan (trips)');
  assert.strictEqual(k('QsQd', 'Jh7c7d'), 'Overpair');
  assert.strictEqual(k('AsKd', 'Kh7c7d'), 'Top paire');
  assert.strictEqual(k('5s6d', '7h8c9d'), 'Suite');
});
t('tirages', () => {
  assert.deepStrictEqual(d('AhKh', '2h7h9d'), ['Tirage couleur', 'Deux overcards']);
  assert.deepStrictEqual(d('8c9d', '6h7sKd'), ['Suite deux bouts']);
  assert.deepStrictEqual(d('AsKd', '2h7c9d'), ['Deux overcards']);
  assert.deepStrictEqual(d('Ts9s', 'Js8s2d'), ['Tirage couleur', 'Suite deux bouts']);
});
t('analyse de range : somme = total', () => {
  const r = B.analyze(E.parseRange('22+, A2s+, KTs+, ATo+'), C('Kh7c2d'));
  assert.strictEqual(r.made.reduce((a, b) => a + b, 0), r.total);
  assert(r.made[5] > 0 && r.made[9] > 0);
});
console.log(n, 'tests passés');
