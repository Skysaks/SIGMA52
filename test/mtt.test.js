// Tournoi de 100 joueurs : node test/mtt.test.js
const M = require('../src/mtt.js'), T = require('../src/table.js'), E = require('../src/engine.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('dotation : 15 places payées, 100 % redistribué', () => { assert.strictEqual(M.PAYOUTS.length, 15); assert(Math.abs(M.PAYOUTS.reduce((a, b) => a + b, 0) - 100) < 1e-9); });
t('tournois complets : fin garantie, places cohérentes, jetons conservés', () => {
  let itm = 0;
  for (let s = 1; s <= 12; s++) {
    const G = M.createGame(T, { random: E.rng(s) }); let guard = 0;
    const total0 = G.F.pool.reduce((a, p) => a + p.stack, 0) + G.tb.players[0].stack;
    while (!G.over && guard++ < 4000) {
      G.prepare(); const tb = G.tb; tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } G.after();
      if (!G.over) { const tot = G.F.pool.filter((p) => !p.seated).reduce((a, p) => a + p.stack, 0) + tb.players.filter((p) => !p.out).reduce((a, p) => a + p.stack, 0); assert(Math.abs(tot - total0) < 1, `jetons ${tot} / ${total0}`); }
    }
    assert(G.over && G.place >= 1 && G.place <= 100, JSON.stringify([s, G.place, guard]));
    const places = G.F.busted.map((b) => b.place); assert.strictEqual(new Set(places).size, places.length, 'places en double');
    if (G.prize > 0) itm++;
  }
  console.log(`    ${itm}/12 dans l'argent pour un bot régulier`);
});
console.log(n + ' tests réussis');
