// Après un lancement GitHub : additionne les minutes facturées des jobs (fichiers run_*.json déposés par chaque job) dans
// tools/data/actions_usage.json (par mois), et met à jour le coût mesuré d'un flop par scénario (tools/data/library_cost.json,
// moyenne glissante des secondes par flop des nouveaux flops). Usage : node tools/record_run.js <dossier des run_*.json> [minutes en plus]
const fs = require('fs'), path = require('path');
const DATA = path.join(__dirname, 'data'), dir = process.argv[2] || DATA, extra = +(process.argv[3] || 0);
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const usage = rd(path.join(DATA, 'actions_usage.json'), {}), cost = rd(path.join(DATA, 'library_cost.json'), {});
const month = new Date().toISOString().slice(0, 7);
let mins = extra, jobs = 0; const sec = {};
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => /^run_.*\.json$/.test(x)) : []) {
  const r = rd(path.join(dir, f), null); if (!r) continue;
  mins += Math.ceil(r.seconds / 60); jobs++;
  for (const [id, v] of Object.entries(r.flops || {})) { const s = (sec[id] ||= { n: 0, t: 0 }); s.n += v.n; s.t += v.t; }
  fs.unlinkSync(path.join(dir, f));
}
const u = (usage[month] ||= { minutes: 0, runs: 0 }); u.minutes += mins; u.runs++;
for (const [id, s] of Object.entries(sec)) { if (!s.n) continue; const m = s.t / s.n, c = cost[id]; cost[id] = { sec: Math.round(c ? 0.5 * c.sec + 0.5 * m : m), n: (c?.n || 0) + s.n }; }
fs.writeFileSync(path.join(DATA, 'actions_usage.json'), JSON.stringify(usage, null, 1));
fs.writeFileSync(path.join(DATA, 'library_cost.json'), JSON.stringify(cost, null, 1));
console.log(`${jobs} job(s), ${mins} min facturées ce lancement ; ${month} : ${u.minutes} min au total.`);
