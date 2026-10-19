// Tests de l'outil Table live : node test/live.test.js
const L = require('../src/live.js'), E = require('../src/engine.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const c = (s) => E.parseCards(s);
const base = { pos: 'CO', nOpp: 1, type: 'normal', pre: 'open', bb: 100, iterations: 1500 };
const D = (o) => L.decide({ ...base, ...o });

t('préflop : AA relance partout, 72o se couche UTG', () => {
  for (const pos of L.POSITIONS) if (pos !== 'BB') assert.strictEqual(D({ hero: c('AsAh'), board: [], pos }).action, 'RELANCE');
  assert.strictEqual(D({ hero: c('7c2d'), board: [], pos: 'UTG' }).action, 'COUCHE');
});
t('préflop : ouverture plus large au bouton qu\'UTG', () => {
  assert.strictEqual(D({ hero: c('Ks9d'), board: [], pos: 'UTG' }).action, 'COUCHE');
  assert.strictEqual(D({ hero: c('Ks9d'), board: [], pos: 'BTN' }).action, 'RELANCE');
});
t('préflop : tapis court via push/fold', () => {
  const r = D({ hero: c('As7d'), board: [], pos: 'BTN', stackBB: 8 });
  assert.strictEqual(r.action, 'TAPIS');
});
t('préflop : face à une relance, AK 3-bet, 94o se couche', () => {
  assert.strictEqual(D({ hero: c('AsKd'), board: [], pos: 'BTN', pre: 'raise', raiseBB: 3 }).action, 'RELANCE');
  assert.strictEqual(D({ hero: c('9s4d'), board: [], pos: 'BTN', pre: 'raise', raiseBB: 3 }).action, 'COUCHE');
});
t('postflop : brelan mise, tirage suit avec la bonne cote', () => {
  assert.strictEqual(D({ hero: c('7s7d'), board: c('Th7h2c'), pot: 10 }).action, 'MISE');
  const r = D({ hero: c('9h8h'), board: c('Th7h2c'), pot: 7, toCall: 5 });
  assert.ok(['SUIS', 'RELANCE', 'TAPIS'].includes(r.action), r.action);
  assert.ok(r.outs >= 12, 'outs ' + r.outs);
});
t('postflop : rien sur la river face à une grosse mise → couche', () => {
  const r = D({ hero: c('4s3s'), board: c('AhKd9c8h2d'), pot: 10, toCall: 10 });
  assert.strictEqual(r.action, 'COUCHE');
});
t('postflop : sans pot saisi, la taille est en % du pot', () => {
  const r = D({ hero: c('AsAd'), board: c('Kh7c2d') });
  assert.strictEqual(r.action, 'MISE'); assert.ok(/^\d+ % du pot$/.test(r.size), r.size);
});
t('vitesse : moins de 100 ms par décision', () => {
  const t0 = Date.now(); for (let i = 0; i < 10; i++) D({ hero: c('AhQh'), board: c('Jh8c3h'), pot: 12, toCall: 6, nOpp: 2 });
  assert.ok((Date.now() - t0) / 10 < 100);
});
t('structure : blindes croissantes, ante tardive', () => {
  const s = L.structure({ stack: 10000, players: 6, hours: 3, levelMin: 20 });
  const lv = s.levels || s; assert.ok(lv.length >= 6);
  for (let i = 1; i < lv.length; i++) assert.ok(lv[i].bb > lv[i - 1].bb);
});
t('jetons : total = tapis, stock respecté', () => {
  const r = L.chips({ stack: 10000, players: 6, denoms: [25, 100, 500, 1000], counts: [300, 300, 100, 50] });
  assert.strictEqual(r.rows.reduce((a, x) => a + x.total, 0) + r.rest, 10000);
  r.rows.forEach((x) => assert.ok(x.have === null || x.need <= x.have, JSON.stringify(x)));
});
t('jetons : stock insuffisant signalé', () => {
  const r = L.chips({ stack: 10000, players: 6, denoms: [25, 100, 500, 1000], counts: [100, 100, 50, 20] });
  assert.ok(r.short && r.rest > 0); r.rows.forEach((x) => assert.ok(x.need <= x.have));
  const ok = L.chips({ stack: 10000, players: 6, denoms: [25, 100, 500, 1000], counts: [300, 300, 100, 50] });
  assert.ok(!ok.short); assert.strictEqual(ok.rest, 0);
});
t('places', () => { [2, 5, 8, 12, 30].forEach((k) => assert.strictEqual(L.payouts(k).reduce((a, b) => a + b, 0), 100)); });
console.log(n + ' tests live ok');
