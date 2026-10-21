// Tests des variantes : node test/variants.test.js
const V = require('../src/variants.js'), E = require('../src/engine.js'), assert = require('assert');
const c = E.parseCards; let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const cat = (v) => V.SD_CAT[Math.floor(v / 1048576)];
t('Short Deck : la couleur bat le full', () => { const fl = V.evalSD(c('AhKh9h7h6h')), fu = V.evalSD(c('AsAdAc6s6d')); assert.ok(fl > fu); assert.strictEqual(cat(fl), 'Couleur'); assert.strictEqual(cat(fu), 'Full'); });
t('Short Deck : le brelan bat la suite', () => { assert.ok(V.evalSD(c('6s6d6cKhAd')) > V.evalSD(c('TsJdQcKhAd'))); });
t('Short Deck : A-6-7-8-9 est une suite, la plus basse', () => { const w = V.evalSD(c('As6d7c8h9d')); assert.strictEqual(cat(w), 'Suite'); assert.ok(w < V.evalSD(c('6d7c8h9dTs'))); });
t('Short Deck : jeu de 36 cartes', () => { assert.strictEqual(V.deckOf('sd').length, 36); assert.ok(V.deckOf('sd').every((x) => (x >> 2) >= 4)); });
t('Omaha 5 cartes : 2 + 3 obligatoires', () => { assert.ok(V.evalOmaha(c('AhKh2c3d4s'), c('QhJh9h8s7d')) > V.evalOmaha(c('AhKs2c3d4s'), c('QhJh9h8s7d'))); });
t('Hi-Lo : meilleure basse A-2 sur 3-4-5, et pas de basse sans 3 petites cartes au board', () => {
  assert.ok(V.lowOmaha(c('As2dKcQh'), c('3h4s5cKdQs')) >= 0);
  assert.ok(V.lowOmaha(c('As2dKcQh'), c('3h4s5cKdQs')) < V.lowOmaha(c('As3dKcQh'), c('2h4s6cKdQs')));
  assert.strictEqual(V.lowOmaha(c('As2dKcQh'), c('3h9sTcKdQs')), -1);
});
t('Hi-Lo : la même main peut rafler les deux moitiés', () => { const r = V.equity('plo8', [c('As2d3c4h'), c('KsKdQcQh')], c('5h6s8cJdKh')); assert.ok(r.equity[0] > 0.45 && r.equity[0] < 0.55); });
t('équités : somme = 1, exacte à la turn', () => { for (const g of ['nlh', 'sd', 'plo', 'plo5', 'plo8']) { const h = g === 'plo5' ? [c('AsKsQhJh2c'), c('9d8d7c6c3s')] : g === 'nlh' || g === 'sd' ? [c('AsKs'), c('9d9c')] : [c('AsKsQhJh'), c('9d8d7c6c')]; const r = V.equity(g, h, c('Th7s6hQd')); assert.ok(r.exact); assert.ok(Math.abs(r.equity[0] + r.equity[1] - 1) < 1e-9, g); } });
t('forme canonique : même main à couleurs permutées', () => { assert.strictEqual(V.canon(c('AsKsQhJh')), V.canon(c('AdKdQcJc'))); assert.notStrictEqual(V.canon(c('AsKsQhJh')), V.canon(c('AsKhQsJh'))); });
console.log(n + ' tests variantes ok');
