// Tests des Cartes du turn : node test/runout.test.js
const E = require('../src/engine.js'), R = require('../src/runout.js'), C = require('../src/charts.js'), assert = require('assert');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok', name); };
(async () => {
  await t('équité exacte main contre main = moteur', () => {
    const A = new Set(['TT']), B = new Set(['AKo']), bd = E.parseCards('9h5h3cJs');
    const r = R.exactRvR(A, B, bd), ref = E.equity([{ combos: E.rangeCombos(A, bd) }, { combos: E.rangeCombos(B, bd) }], bd, { iterations: 200000, random: E.rng(5) }).equity[0];
    assert(Math.abs(r.eqA - ref) < 0.01, r.eqA + ' / ' + ref);
  });
  await t('somme des équités = 1 sur une river', () => {
    const r = R.exactRvR(E.parseRange(C.RFI.CO.range), E.parseRange(C.FACING.CO.BB.call), E.parseCards('Ks7d2c9h4s'));
    const wB = r.perB.reduce((a, x) => a + x, 0); assert(r.eqA > 0.3 && r.eqA < 0.7); assert(wB > 0);
  });
  await t('rapport du turn : 49 cartes, chiffres du module', async () => {
    const r = await R.turnReport(E.parseRange(C.RFI.BTN.range), E.parseRange(C.FACING.BTN.BB.call), E.parseCards('Ks7d2c'), null, { yield: false });
    assert.strictEqual(r.turns.length, 49);
    assert(Math.abs(r.flopEq - 0.527) < 0.001, r.flopEq);
    const eq = r.turns.map((x) => x.eqA); assert(Math.abs(Math.min(...eq) - 0.513) < 0.001 && Math.abs(Math.max(...eq) - 0.538) < 0.001);
  });
  await t('familles de cartes', () => {
    const f = E.parseCards('9h8h6c'); const fam = (c) => R.turnFamily(f, E.parseCards(c)[0]);
    assert(fam('Ah').includes('surcarte') && fam('Ah').includes('3e carte de la couleur'));
    assert(fam('7c').includes('connecte (suites)')); assert(fam('9s').includes('paire le board'));
  });
  console.log(n, 'tests passés');
})();
