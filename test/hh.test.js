// Tests de l'import d'historiques : node test/hh.test.js
const E = require('../src/engine.js'), H = require('../src/hh.js'), T = require('../src/table.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const R = E.rng(9), tb = new T.Table({ random: R });
for (let h = 0; h < 400; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } }
const text = tb.exportHH();
t('stats de continuation bet calculées et plausibles', () => {
  const r = H.analyze(text);
  assert(r.me.cbetOpp > 10 && r.me.cbet <= r.me.cbetOpp && r.me.ftc <= r.me.ftcOpp);
  r.opponents.forEach((o) => assert(o.cbet <= o.cbetOpp && o.ftc <= o.ftcOpp));
  console.log('    héros c-bet ' + Math.round(r.me.cbet / r.me.cbetOpp * 100) + ' % · ' + r.opponents.map((o) => o.name + ' c-bet ' + (o.cbetOpp ? Math.round(o.cbet / o.cbetOpp * 100) : '—') + ' % / fold to c-bet ' + (o.ftcOpp ? Math.round(o.ftc / o.ftcOpp * 100) : '—') + ' %').join(' · '));
});
t('replayer : tapis finaux = résultat du moteur, pot cohérent', () => {
  const hands = H.split(text).slice(-200);
  for (const txt of hands) {
    const h = H.parseHand(txt), rp = H.replay(h), last = rp.steps[rp.steps.length - 1], a = H.analyzeHand(h);
    for (const s of h.seats) assert(Math.abs(last.stacks[s.name] - (s.stack + a.net[s.name])) < 1e-6, s.name);
    rp.steps.forEach((st) => assert(st.pot >= 0 && st.board.length <= 5));
  }
});
console.log(n, 'tests passés');
