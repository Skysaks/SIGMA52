// File de lots d'entraînement reprenable : chaque lot (type, mains, graine) écrit un fichier de comptes dans DIR.
// Plusieurs pilotes peuvent tourner en parallèle (verrou par lot) ; un pilote s'arrête de lui-même après MAXMIN minutes
// sans entamer de nouveau lot, pour pouvoir être relancé. Usage : node tools/train_jobs.js DIR [MAXMIN]
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const DIR = process.argv[2], MAXMIN = +(process.argv[3] || 85), t0 = Date.now();
if (!DIR) { console.error('usage : node tools/train_jobs.js DIR [MAXMIN]'); process.exit(1); }
fs.mkdirSync(DIR, { recursive: true });
// 4,2 millions de mains de plus par type (12,6 M -> 37,8 M au total), en lots de 700 000.
const TYPES = ['fish', 'action', 'maniaque', 'normal', 'large', 'serre'];
const JOBS = [];
for (let k = 0; k < 6; k++) for (const t of TYPES) JOBS.push({ id: `${t}-${k}`, type: t, hands: 700000, seed: 10001 + 1000 * k + TYPES.indexOf(t) * 97 });
for (const j of JOBS) {
  if ((Date.now() - t0) / 60000 > MAXMIN) { console.log('pause : durée maximale atteinte'); break; }
  const out = path.join(DIR, j.id + '.json'), lock = out + '.lock';
  if (fs.existsSync(out)) continue;
  try { fs.writeFileSync(lock, String(Date.now()), { flag: 'wx' }); }
  catch (e) { const age = (Date.now() - +fs.readFileSync(lock, 'utf8')) / 60000; if (age < 70) continue; fs.writeFileSync(lock, String(Date.now())); }
  const s = Date.now();
  const r = spawnSync('node', [path.join(__dirname, 'train_live.js'), String(j.hands), j.type, String(j.seed), out + '.tmp'], { stdio: 'inherit' });
  if (r.status === 0 && fs.existsSync(out + '.tmp')) { fs.renameSync(out + '.tmp', out); console.log('lot', j.id, 'ok', Math.round((Date.now() - s) / 1000) + ' s'); }
  try { fs.unlinkSync(lock); } catch (e) { /* déjà retiré */ }
}
const done = JOBS.filter((j) => fs.existsSync(path.join(DIR, j.id + '.json'))).length;
console.log(`lots terminés : ${done}/${JOBS.length}`);
