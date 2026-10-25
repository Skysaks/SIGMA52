// Tests du moteur de partie entre amis : node test/netgame.test.js
const NG = require('../src/netgame.js'), E = require('../src/engine.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('3 000 mains au hasard (2 à 9 joueurs) : jetons conservés, mains toujours terminées, vue publique < 4 Ko', () => {
  const R = E.rng(11);
  for (let g = 0; g < 60; g++) {
    const np = 2 + (g % 8), G = NG.create({ sb: 1, bb: 2 });
    for (let i = 0; i < np; i++) NG.sit(G, i, 'p' + i, 'Joueur ' + i, 50 + Math.floor(R() * 300));
    const total = G.seats.reduce((a, p) => a + p.stack, 0);
    for (let h = 0; h < 50; h++) {
      if (NG.live(G).filter((i) => G.seats[i].stack > 0).length < 2) break;
      NG.startHand(G, R); let k = 0;
      while (!G.done && k++ < 400) {
        const L = NG.legal(G), x = R();
        if (x < 0.15 && !L.canCheck) NG.act(G, L.seat, 'fold');
        else if (x < 0.7) NG.act(G, L.seat, L.canCheck ? 'check' : 'call');
        else NG.act(G, L.seat, 'raise', L.minTo + R() * (L.maxTo - L.minTo) * (x > 0.95 ? 1 : 0.3));
      }
      assert(G.done, 'main bloquée');
      const sum = G.seats.reduce((a, p) => a + p.stack, 0); assert(Math.abs(sum - total) < 0.011, `jetons ${sum} vs ${total}`);
      assert(JSON.stringify(NG.publicView(G)).length < 3500);
      assert(G.result.reduce((a, b) => a + b, 0) < 0.011 && G.result.reduce((a, b) => a + b, 0) > -0.011);
    }
  }
});
t('règles : tour de parole, blindes en tête-à-tête, action hors tour refusée, vue publique sans cartes cachées', () => {
  const G = NG.create({ sb: 1, bb: 2 }); NG.sit(G, 0, 'a', 'A', 100); NG.sit(G, 1, 'b', 'B', 100);
  NG.startHand(G, E.rng(3));
  assert.strictEqual(G.toAct, G.button, 'en tête-à-tête, le bouton (petite blinde) parle en premier préflop');
  assert.throws(() => NG.act(G, 1 - G.toAct, 'call'));
  const pv = JSON.stringify(NG.publicView(G)); assert(!pv.includes('"cards"') && !/"deck"/.test(pv));
  NG.act(G, G.toAct, 'call'); NG.act(G, G.toAct, 'check'); assert.strictEqual(G.street, 'flop');
  assert.strictEqual(G.toAct, 1 - G.button, 'après le flop, la grosse blinde parle en premier');
});
console.log(n + ' tests réussis');
