// Mains de légende : node test/legends.test.js
const L = require('../src/legends.js'), E = require('../src/engine.js'), O = require('../src/omaha.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('cartes cohérentes (aucun doublon) et options valides', () => {
  for (const l of L.LEGENDS) {
    const all = E.parseCards([l.heroCards, ...l.vill.map((v) => v.cards), l.board, l.runout].join(''));
    assert.strictEqual(new Set(all).size, all.length, l.id); assert(l.pro >= 0 && l.pro < l.options.length && l.src.startsWith('https://'));
  }
});
t('résultats racontés = moteur sur le board complet', () => {
  const win = (id) => { const l = L.LEGENDS.find((x) => x.id === id), b = E.parseCards(l.board + l.runout), h = E.parseCards(l.heroCards), v = E.parseCards(l.vill[0].cards); return l.game === 'plo' ? O.evaluate(h, b) - O.evaluate(v, b) : E.evaluate([...h, ...b]) - E.evaluate([...v, ...b]); };
  assert(win('brunson76') > 0); assert(win('dwan') < 0); assert(win('antonius09') > 0);
  const g = L.LEGENDS.find((x) => x.id === 'gold06'), b = E.parseCards(g.board + g.runout), w = E.evaluate([...E.parseCards(g.heroCards), ...b]), gold = E.evaluate([...E.parseCards(g.vill[0].cards), ...b]), bing = E.evaluate([...E.parseCards(g.vill[1].cards), ...b]);
  assert(w > gold && gold > bing, 'Wasicka aurait gagné, Gold bat Binger');
});
t('analyses du moteur', () => {
  const A = Object.fromEntries(L.LEGENDS.map((l) => [l.id, L.analyze(l)]));
  assert(A.brunson76.best === 'fold' && A.hansen.best === 'call' && A.hachem.best === 'call' && A.antonius09.best === 'call');
  assert(A.moneymaker03.showdown < 0.2 && A.moneymaker03.foldNeeded > 0.5);
  assert(A.gold06.icmCall > A.gold06.icmFold && A.gold06.icmFold > 4e6 && A.gold06.icmCall < 12e6);
  assert(A.hachem.eqActual > 0.7 && A.dwan.eqActual === 0);
});
console.log(n + ' tests réussis');
