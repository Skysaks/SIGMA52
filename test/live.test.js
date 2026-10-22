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
t('v2 : positions de 2 à 10 joueurs', () => { for (let n = 2; n <= 10; n++) { const P = L.positions(n); assert.strictEqual(P.length, n); assert.strictEqual(P[P.length - 1], 'BB'); } });
t('v2 : UTG à 9 joueurs plus serré qu\'UTG à 6', () => {
  assert.strictEqual(D({ hero: c('2h2d'), board: [], players: 6, pos: 'UTG' }).action, 'RELANCE');
  assert.strictEqual(D({ hero: c('2h2d'), board: [], players: 9, pos: 'UTG' }).action, 'COUCHE');
});
t('v2 : équité multiway précalculée (AA contre 4 mains aléatoires ≈ 56 %)', () => {
  const M = require('../src/live_multi.js'), E2 = require('../src/engine.js'), i = (E2.ALL169.indexOf('AA') * M.KS.length + M.KS.indexOf(4)) * M.XS.length + M.XS.indexOf(1);
  assert.ok(Math.abs(M.data[i] / 1000 - 0.56) < 0.02, M.data[i]);
});
t('v2 : modèle appris chargé et range mise à jour par les actions (une relance renforce sa range)', () => {
  const base = { hero: c('KsQd'), board: c('Kh8c3d'), pot: 10, toCall: 6, stack: 90, type: 'normal' };
  const bet = D(base), raise = D({ ...base, raised: true, toCall: 18 });
  assert.ok(raise.eq < bet.eq - 0.03, bet.eq + ' / ' + raise.eq);
});
t('v2 : options chiffrées, la décision est la meilleure EV', () => {
  const r = D({ hero: c('AsKd'), board: c('Kh7c2d'), pot: 10, stack: 90 });
  assert.ok(r.options.length >= 4); assert.strictEqual(r.options[0].act, r.action);
  r.options.forEach((o, i) => i && assert.ok(o.ev <= r.options[0].ev + 1e-9));
});
t('v2 : river, nuts face à une mise → relance ou tapis ; bluff impossible contre un fish', () => {
  assert.ok(['RELANCE', 'TAPIS'].includes(D({ hero: c('AhJh'), board: c('Kh9h4d2s7h'), pot: 20, toCall: 20, stack: 80 }).action));
  const r = D({ hero: c('4s3s'), board: c('AhKd9c8h2d'), pot: 20, stack: 90, type: 'serre', history: [{ street: 'flop', a: 'check' }, { street: 'turn', a: 'check' }] });
  assert.ok(['CHECK', 'MISE'].includes(r.action));
});
t('v2 : Omaha et bomb pot', () => {
  const p = D({ game: 'plo', hero: c('AsAhKsKh'), board: [], pos: 'CO', pre: 'open' }); assert.strictEqual(p.action, 'RELANCE');
  const q = D({ game: 'plo', hero: c('7c2d5h9s'), board: [], pos: 'UTG', players: 9, pre: 'open' }); assert.strictEqual(q.action, 'COUCHE');
  assert.strictEqual(D({ game: 'bomb', hero: c('AhKh'), board: [] }).action, 'ATTENDS');
  assert.ok(D({ game: 'bomb', hero: c('AhKh'), board: c('Kd7c2h'), pot: 30 }).eq > 0.3);
});
t('v3 : variantes dans la Table live (Short Deck, Omaha 5, Hi-Lo)', () => {
  assert.strictEqual(D({ game: 'sd', hero: c('AsKs'), board: [], pos: 'CO', pre: 'open' }).action, 'RELANCE');
  assert.strictEqual(D({ game: 'sd', hero: c('7s6d'), board: [], pos: 'UTG', pre: 'open' }).action, 'COUCHE');
  assert.strictEqual(D({ game: 'sd', hero: c('As2s'), board: [] }).action, '?');
  assert.strictEqual(D({ game: 'plo5', hero: c('AsAhKsKhQd'), board: [], pos: 'CO', pre: 'open' }).action, 'RELANCE');
  assert.ok(D({ game: 'plo8', hero: c('As2s3hKh'), board: c('4c5d9h'), pot: 20, toCall: 10 }).eq > 0.4);
  const t = L.ploTable(c('AsAhKsKh')); assert.ok(t && t.pct < 0.01, JSON.stringify(t));
});
t('v2 : ICM, payer un tapis demande plus d\'équité près de la bulle', () => {
  const chip = D({ hero: c('AsJd'), board: [], pos: 'BB', pre: 'raise', stackBB: 10, raiseBB: 10, type: 'normal' });
  const icm = D({ hero: c('AsJd'), board: [], pos: 'BB', pre: 'raise', stackBB: 10, raiseBB: 10, type: 'normal', icm: { stacks: [1000, 1000, 3000, 300], payouts: [50, 30, 20], villain: 2 } });
  assert.ok(icm.need > chip.need + 0.03, chip.need + ' / ' + icm.need);
});
t('v2 : vitesse, flop tête-à-tête < 150 ms', () => { const t0 = Date.now(); for (let i = 0; i < 10; i++) D({ hero: c('AhQh'), board: c('Jh8c3h'), pot: 12, toCall: 6 }); assert.ok((Date.now() - t0) / 10 < 150); });
t('v14 : texture du board, apprentissage d\'un joueur, plan multi-rues', () => {
  assert.strictEqual(L.texture(c('Ks7d2c')), 0); assert.strictEqual(L.texture(c('9h8c7d')), 1); assert.strictEqual(L.texture(c('KsKd4c')), 2); assert.strictEqual(L.texture(c('Qs8s3s')), 3);
  // Abattage : il a misé flop et turn avec rien -> deux mises dont deux « rien ».
  const pl = L.learnShowdown({}, c('4d3c'), c('As9h7cKdQs'), [{ street: 'flop', a: 'bet', size: 0.6 }, { street: 'turn', a: 'bet', size: 0.6 }]);
  assert.deepStrictEqual(pl.bets, [2, 2]); assert.strictEqual(pl.sd, 1);
  // Un joueur qui bluffe beaucoup : face à sa mise river, ton bluff-catcher a plus d'équité qu'avec son type seul.
  const spot = { hero: c('KhJc'), board: c('Kd8s4c7h2d'), pot: 40, toCall: 30, history: [{ street: 'flop', a: 'bet', size: 0.6 }, { street: 'turn', a: 'check' }] };
  const plain = D(spot), bluffer = D({ ...spot, pl: { bets: [12, 9], calls: [0, 0], sd: 6 } }), honest = D({ ...spot, pl: { bets: [12, 0], calls: [0, 0], sd: 6 } });
  assert.ok(bluffer.eq > plain.eq + 0.02 && honest.eq < plain.eq - 0.01, plain.eq + ' / ' + bluffer.eq + ' / ' + honest.eq);
  // Un joueur qui couche beaucoup face aux mises : un bluff devient plus rentable.
  const sb = { hero: c('6c5c'), board: c('AsKd9h'), pot: 20, toCall: 0, ip: true };
  const fo = D({ ...sb, pl: { face: [18, 2, 0] } }), ca = D({ ...sb, pl: { face: [1, 19, 0] } });
  const evb = (r) => Math.max(...r.options.filter((x) => x.act === 'MISE').map((x) => x.ev));
  assert.ok(evb(fo) > evb(ca), evb(fo) + ' / ' + evb(ca));
  // Main très forte au flop : plan de valeur avec une taille géométrique.
  const v = D({ hero: c('7h7d'), board: c('7c8s2d'), pot: 10, stack: 100, toCall: 0, ip: true });
  assert.ok(v.plan && v.plan.kind === 'valeur' && v.plan.geo > 0.3 && v.plan.geo < 1.2, JSON.stringify(v.plan));
  assert.ok(v.effCombos > 10);
});
console.log(n + ' tests live ok');
