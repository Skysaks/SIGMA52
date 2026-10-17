// Simulation de 1 500 mains : conservation des jetons, fin de chaque main, historique relu par l'importeur.
const E = require('../src/engine.js'), T = require('../src/table.js'), H = require('../src/hh.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('1 500 mains sans fuite de jetons', () => {
  const R = E.rng(17), tb = new T.Table({ random: R });
  for (let h = 0; h < 1500; h++) {
    tb.newHand(); const before = tb.players.reduce((a, p) => a + p.start, 0);
    let guard = 0;
    while (!tb.done && guard++ < 500) {
      tb.runBots(); if (tb.done) break;
      const L = tb.legal(), x = R();
      if (x < 0.25) tb.act('fold'); else if (x < 0.7) tb.act(L.canCheck ? 'check' : 'call'); else tb.act('raise', L.minTo + R() * L.pot);
    }
    assert(tb.done, 'main non terminée ' + h);
    const after = tb.players.reduce((a, p) => a + p.stack, 0);
    assert(Math.abs(before - after) < 1e-6, `main ${h} : ${before} -> ${after}`);
    assert(tb.board.length === 5 || tb.alive().length === 1);
  }
  global.tb = tb;
});
t('historique exporté relu : mêmes gains que le moteur', () => {
  const text = global.tb.exportHH(), res = H.analyze(text);
  assert.strictEqual(res.hero, 'Toi'); assert.strictEqual(res.hands, 300);
  const hands = H.split(text).map(H.parseHand);
  let maxErr = 0;
  for (const h of hands) { const a = H.analyzeHand(h); maxErr = Math.max(maxErr, Math.abs(Object.values(a.net).reduce((x, y) => x + y, 0))); }
  assert(maxErr < 1e-6, 'somme des gains ' + maxErr);
  console.log('    profils détectés :', res.opponents.map((o) => o.name + '=' + o.profile.key + ' (VPIP ' + Math.round(o.vpip / o.hands * 100) + ')').join(', '));
});
console.log(n, 'tests passés');
