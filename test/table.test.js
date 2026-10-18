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

// Mode tournoi (Expresso) : 3 joueurs, 500 jetons, blindes croissantes, élimination.
const LEVELS = [[10, 20], [15, 30], [20, 40], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200], [150, 300]];
t('300 parties Expresso : jetons conservés, partie terminée, places cohérentes', () => {
  const R = E.rng(31); const places = { 1: 0, 2: 0, 3: 0 }; let hands = 0, huBlindsOk = 0, huChecked = 0;
  for (let g = 0; g < 300; g++) {
    const tb = new T.Table({ random: R, lineup: ['reg', 'station'], stack: 500, rebuy: false, levels: LEVELS, handsPerLevel: 6, unit: 'jetons' });
    let guard = 0;
    while (!tb.over && guard++ < 400) {
      tb.newHand(); hands++;
      if (tb.active().length === 2) { huChecked++; if (tb.sbi === tb.button) huBlindsOk++; }
      let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); }
      assert(tb.done);
      const total = tb.players.reduce((a, p) => a + p.stack, 0);
      assert(Math.abs(total - 1500) < 1e-6, 'jetons ' + total);
    }
    assert(tb.over, 'partie non terminée');
    places[tb.place]++;
    const winners = tb.players.filter((p) => !p.out); if (tb.place === 1) assert.strictEqual(winners.length, 1);
  }
  assert.strictEqual(huBlindsOk, huChecked, 'en tête-à-tête le bouton doit être petite blinde');
  console.log(`    places du héros (bot régulier) : 1er ${places[1]}, 2e ${places[2]}, 3e ${places[3]} · ${(hands / 300).toFixed(1)} mains par partie`);
});
t('3 000 parties Expresso au hasard : jamais de main bloquée (blinde qui met à tapis)', () => {
  const R = E.rng(5); let stuck = 0;
  for (let g = 0; g < 3000; g++) {
    const tb = new T.Table({ random: R, lineup: ['reg', 'station'], stack: 500, rebuy: false, levels: LEVELS, handsPerLevel: 6 });
    let guard = 0;
    while (!tb.over && guard++ < 500) {
      tb.newHand(); tb.runBots(); let k = 0;
      while (!tb.done && k++ < 100) { if (tb.toAct !== 0) { stuck++; break; } const L = tb.legal(); if (R() < 0.5 && L.maxTo > tb.cur) tb.act('raise', L.maxTo); else tb.act(L.canCheck ? 'check' : 'call'); tb.runBots(); }
      if (!tb.done) stuck++;
    }
    assert(tb.over);
  }
  assert.strictEqual(stuck, 0);
});
console.log(n, 'tests passés au total');
