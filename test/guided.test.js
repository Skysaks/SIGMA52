// Tests des mains guidées : node test/guided.test.js
const E = require('../src/engine.js'), G = require('../src/guided.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('scénarios bien formés, cartes cohérentes', () => {
  const ids = new Set();
  for (const sc of G.SCENARIOS) {
    assert(!ids.has(sc.id)); ids.add(sc.id);
    const cards = [...E.parseCards(sc.hero), ...E.parseCards(sc.board)];
    assert.strictEqual(new Set(cards).size, cards.length, sc.id + ' : carte en double');
    sc.steps.forEach((st, k) => {
      assert(st.options.length >= 2 && st.story, sc.id + k);
      const info = G.stepInfo(sc, k, { iterations: 4000 });
      const grades = st.options.map((o, oi) => G.optionGrade(sc, k, oi, info));
      assert(grades.includes(2), sc.id + ' étape ' + k + ' sans meilleure option');
    });
  }
});
t('étapes de cotes : la meilleure option suit l\'équité contre la range', () => {
  for (const sc of G.SCENARIOS) sc.steps.forEach((st, k) => {
    if (!st.odds) return;
    const info = G.stepInfo(sc, k, { iterations: 40000 });
    const best = st.options[st.options.findIndex((o) => o[1] === 2)][0];
    const callBest = /^Payer/.test(best);
    console.log(`    ${sc.id} ${st.street} : équité ${(info.eq * 100).toFixed(1)} % · requis ${(info.need * 100).toFixed(1)} % · meilleure option « ${best} »`);
    assert.strictEqual(callBest, info.eq >= info.need, sc.id + ' ' + st.street);
  });
});
t('étapes Nash et ICM : explications cohérentes avec le solveur', () => {
  const ex = G.SCENARIOS.find((s) => s.id === 'expresso'), bu = G.SCENARIOS.find((s) => s.id === 'bubble');
  assert.strictEqual(G.stepInfo(ex, 0).best, 0); // 95s : tapis
  assert.strictEqual(G.stepInfo(ex, 1).best, 1); // J7s : fold
  assert.strictEqual(G.stepInfo(bu, 0).best, 1); // K8o : fold en ICM
});
console.log(n, 'tests passés');
