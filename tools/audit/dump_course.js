// Exporte tout le texte du cours (modules, exercices, quiz, examens, situations, lexique) en texte brut, un bloc par module,
// pour la relecture et les vérifications automatiques. Usage : node tools/audit/dump_course.js > course.txt
const K = require('../../src/course.js');
const strip = (h) => String(h).replace(/<details class="exo"><summary>/g, '\n[EXO] ').replace(/<\/summary>/g, '\n  → ').replace(/<li>/g, '\n • ').replace(/<tr>/g, '\n | ').replace(/<\/t[dh]>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
for (const m of K.MODULES) {
  console.log(`\n=== ${m.id} · N${m.level} · ${m.title}`);
  console.log('OBJ: ' + m.goals.join(' / '));
  for (const [h, html] of m.sections) console.log(`\n## ${h}\n${strip(html)}`);
  console.log('\nERREURS: ' + m.mistakes.join(' / ')); console.log('CLÉS: ' + m.keys.join(' / '));
  m.quiz.forEach((q, i) => console.log(`Q${i + 1}. ${q.q} [${q.opts.map((o, j) => (j === q.ok ? '*' : '') + o).join(' | ')}] — ${q.why}`));
}
if (process.argv.includes('--extra')) {
  console.log('\n=== SITUATIONS'); K.SITUATIONS.forEach((s, i) => console.log(`S${i + 1}. ${JSON.stringify(s)}`));
  console.log('\n=== LEXIQUE'); K.GLOSSARY.forEach(([a, b]) => console.log(`${a} : ${b}`));
}
