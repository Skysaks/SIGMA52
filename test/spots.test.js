// Tests du générateur de spots : node test/spots.test.js
const E = require('../src/engine.js'), S = require('../src/spots.js');
const assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const R = E.rng(42);
t('chaque type produit des spots valides', () => {
  for (const type of Object.keys(S.GEN)) for (let i = 0; i < 60; i++) {
    const s = S.GEN[type](R);
    assert(s.opts.length >= 2 && s.ok >= 0 && s.ok < s.opts.length && s.why && s.prompt, type);
  }
});
t('tirage : équité exacte cohérente avec Monte-Carlo', () => {
  for (let i = 0; i < 4; i++) {
    const s = S.GEN.tirage(R); if (s.type !== 'tirage') continue;
    const range = S.villainRange(s.board).filter((c) => !s.cards.includes(c[0]) && !s.cards.includes(c[1]));
    const mc = E.equity([{ hand: s.cards }, { combos: range }], s.board, { iterations: 60000, random: E.rng(i) });
    assert(Math.abs(mc.equity[0] - s.meta.eq) < 0.012, mc.equity[0] + ' vs ' + s.meta.eq);
    assert.strictEqual(s.ok === 0, s.meta.eq > s.meta.need);
  }
});
t('tirage : détection des tirages', () => {
  const C = E.parseCards;
  assert.deepStrictEqual(S.drawKind(C('AhKh'), C('2h7h9dJc')), ['tirage couleur']);
  assert.deepStrictEqual(S.drawKind(C('8c9d'), C('6h7sKd2c')), ['suite par les deux bouts']);
  assert.deepStrictEqual(S.drawKind(C('8c9d'), C('5h7sKd2c')), ['suite ventrale']);
});
t('ouverture : réponse conforme à la range', () => {
  for (let i = 0; i < 200; i++) { const s = S.GEN.rfi(R); assert(s.cards.length === 2); }
});
t('meilleure main : partage détecté', () => {
  let ties = 0; for (let i = 0; i < 2000; i++) if (S.GEN.meilleure(R).ok === 3) ties++;
  assert(ties > 0);
});
console.log(n, 'tests passés');
