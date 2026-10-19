// Tests du cours : node test/course.test.js
const K = require('../src/course.js'), S = require('../src/spots.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('structure des modules', () => {
  const ids = new Set();
  for (const m of K.MODULES) {
    assert(!ids.has(m.id), 'id en double ' + m.id); ids.add(m.id);
    assert([1, 2, 3, 4, 5, 6].includes(m.level), m.id);
    assert(S.TYPES[m.drill], 'exercice inconnu ' + m.id + ' ' + m.drill);
    assert(m.goals.length >= 2 && m.sections.length >= 2 && m.mistakes.length >= 2 && m.keys.length >= 2, m.id);
    assert(m.quiz.length >= 1, m.id);
    m.quiz.forEach((q) => assert(q.ok >= 0 && q.ok < q.opts.length && q.why && q.q, m.id + ' : ' + q.q));
    m.sections.forEach(([h, html]) => { assert(h && html); const open = (html.match(/<(table|ul|ol|p|tr|td|th)\b/g) || []).length, close = (html.match(/<\/(table|ul|ol|p|tr|td|th)>/g) || []).length; assert.strictEqual(open, close, m.id + ' / ' + h + ' : balises ' + open + '≠' + close); });
  }
});
t('six niveaux remplis, dans l\'ordre', () => {
  [1, 2, 3, 4, 5, 6].forEach((l) => assert(K.MODULES.filter((m) => m.level === l).length >= 5, 'niveau ' + l));
  K.MODULES.forEach((m, i) => assert(i === 0 || K.MODULES[i - 1].level <= m.level, 'ordre ' + m.id));
  assert(K.MODULES.every((m) => m.quiz.length >= 3), 'au moins 3 questions par module : ' + K.MODULES.filter((m) => m.quiz.length < 3).map((m) => m.id));
});
const words = K.MODULES.reduce((a, m) => a + m.sections.map((s) => s[1]).join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length, 0);
console.log(`   ${K.MODULES.length} modules, ${K.MODULES.reduce((a, m) => a + m.quiz.length, 0)} questions de quiz, ${words} mots, ${K.MODULES.reduce((a, m) => a + m.minutes, 0)} min de lecture`);
console.log(n, 'tests passés');
