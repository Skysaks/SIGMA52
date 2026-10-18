// Tests du coach : node test/coach.test.js
const E = require('../src/engine.js'), T = require('../src/table.js'), Co = require('../src/coach.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const HANDS = +(process.env.HANDS || 1500);
function play(policy, seed) {
  const R = E.rng(seed), tb = new T.Table({ random: R }); let hits = 0, checks = 0, decisions = 0;
  for (let h = 0; h < HANDS; h++) {
    tb.newHand(); let g = 0;
    while (!tb.done && g++ < 300) {
      tb.runBots(); if (tb.done) break;
      if (policy === 'coach') {
        const adv = Co.advise(tb, { iterations: 600 }); decisions++;
        // Calibration : la vraie main de chaque adversaire est-elle dans sa range estimée ?
        for (let i = 1; i < 6; i++) if (tb.players[i].inHand) {
          const r = Co.villainRange(tb, i), c = tb.players[i].cards; checks++;
          if (r.combos.some((x) => (x[0] === c[0] && x[1] === c[1]) || (x[0] === c[1] && x[1] === c[0]))) hits++;
        }
        tb.act(adv.rec === 'fold' && tb.legal().canCheck ? 'check' : adv.rec, adv.to);
      } else tb.autoHero('reg');
    }
  }
  return { bb100: tb.session.net / tb.session.hands * 100, calib: hits / checks, decisions };
}
t(`héros guidé par le coach contre bot régulier (${HANDS} mains × 2 tables)`, () => {
  const c1 = play('coach', 101), c2 = play('coach', 202), r1 = play('reg', 101), r2 = play('reg', 202);
  const coach = (c1.bb100 + c2.bb100) / 2, reg = (r1.bb100 + r2.bb100) / 2;
  console.log(`    coach ${coach.toFixed(1)} bb/100 · bot régulier ${reg.toFixed(1)} bb/100 · calibration des ranges ${(100 * (c1.calib + c2.calib) / 2).toFixed(1)} % · ${c1.decisions + c2.decisions} décisions`);
  assert(c1.calib > 0.8 && c2.calib > 0.8, 'ranges mal calibrées');
  assert(coach > 0, 'le coach perd contre la table');
});
t('préflop : recommandations conformes aux charts', () => {
  const tb = new T.Table({ random: E.rng(5) }); let k = 0;
  for (let h = 0; h < 400; h++) {
    tb.newHand(); tb.runBots(); if (tb.done || tb.street !== 'pre') continue;
    const a = Co.advise(tb, { iterations: 200 });
    if (a.cats.includes('rfi')) { k++; const inR = E.parseRange(require('../src/charts.js').RFI[a.pos].range).has(a.hand); assert.strictEqual(a.rec === 'raise', inR, a.hand + ' ' + a.pos); }
    assert(a.why.length >= 1 && ['fold', 'check', 'call', 'raise'].includes(a.rec));
  }
  assert(k > 20);
});
console.log(n, 'tests passés');
t('Expresso : un héros guidé par le conseil tapis/couché finit plus souvent 1er qu\'un bot régulier', () => {
  const LEVELS = [[10, 20], [15, 30], [20, 40], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200], [150, 300]];
  const run = (useCoach, seed) => {
    const R = E.rng(seed); let wins = 0;
    for (let g = 0; g < 250; g++) {
      const tb = new T.Table({ random: R, lineup: ['reg', 'station'], stack: 500, rebuy: false, levels: LEVELS, handsPerLevel: 6 });
      let guard = 0;
      while (!tb.over && guard++ < 400) {
        tb.newHand(); let k = 0;
        while (!tb.done && k++ < 300) {
          tb.runBots(); if (tb.done) break;
          if (useCoach) { const a = Co.pushFoldAdvice(tb) || Co.advise(tb, { iterations: 300 }); tb.act(a.rec === 'fold' && tb.legal().canCheck ? 'check' : a.rec, a.to); }
          else tb.autoHero('reg');
        }
      }
      if (tb.place === 1) wins++;
    }
    return wins / 250;
  };
  const c = run(true, 77), r = run(false, 77);
  console.log(`    1re place : héros guidé ${(c * 100).toFixed(1)} % · bot régulier ${(r * 100).toFixed(1)} % (33,3 % = niveau égal)`);
  assert(c > r && c > 0.36);
});
console.log(n, 'tests passés au total');
