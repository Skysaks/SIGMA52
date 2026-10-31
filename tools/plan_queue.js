// Planificateur des calculs GitHub (bibliothèque de flops et modèle de la Table live), dans un budget de minutes.
// Lit tools/library_queue.json (budget, paliers, ordre), l'état de la bibliothèque (tools/data/lib_*.json), le coût mesuré par flop
// (tools/data/library_cost.json) et les minutes déjà consommées ce mois (tools/data/actions_usage.json, tenu par tools/record_run.js).
// Répartit le budget du lancement : d'abord l'entraînement de la Table live (part fixe), puis la bibliothèque, palier par palier
// (tous les scénarios à 91 flops, puis 182, 364, 728, puis les 1 755 flops distincts) dans l'ordre de priorité.
// Usage : node tools/plan_queue.js [--dry]   (écrit dans $GITHUB_OUTPUT : matrix, live, job_minutes, maxit, target, sample, budget)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), DATA = path.join(__dirname, 'data');
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const Q = rd(path.join(__dirname, 'library_queue.json'), {});
const usage = rd(path.join(DATA, 'actions_usage.json'), {}), cost = rd(path.join(DATA, 'library_cost.json'), {});
const month = new Date().toISOString().slice(0, 7), used = usage[month]?.minutes || 0;
const TOTAL = 1755, JOB = Q.job_minutes || 90, OVER = 3; // minutes facturées en plus du calcul par job (démarrage, dépôt)
const remaining = Math.max(0, (Q.monthly_minutes ?? 1500) - used - (Q.reserve_minutes ?? 60));
let budget = Math.min(Q.run_minutes ?? 600, remaining);
const plan = { month, used, remaining, budget, live: 0, liveHands: 0, matrix: [], notes: [] };

// Ordre : celui de la file, sinon scénarios étendus prioritaires, les 16 de base, puis le reste des étendus.
const ids = JSON.parse(require('child_process').execFileSync('node', [path.join(__dirname, 'build_aggregate.js'), '0', '0', '', 'srp-BTN-BB'], { env: { ...process.env, LISTSCENS: '1' } }).toString().trim().split('\n').pop());
const SX = require('../src/scen_ext.js'), EXT = new Map(SX.build(require('../src/preflop_data.js')).map((s) => [s.id, s]));
const order = (Q.order && Q.order.length ? Q.order : [...ids.filter((i) => EXT.get(i)?.prio === 1), ...ids.filter((i) => !EXT.has(i)), ...ids.filter((i) => EXT.get(i)?.prio === 2), ...ids.filter((i) => EXT.get(i)?.prio === 3)]).filter((i) => ids.includes(i) && !(Q.skip || []).includes(i));
const done = Object.fromEntries(ids.map((i) => [i, (rd(path.join(DATA, 'lib_' + i + '.json'), { flops: [] }).flops || []).length]));
// Secondes d'un flop sur un cœur : mesure si elle existe, sinon estimation par type de pot et profondeur.
const secOf = (id) => {
  if (cost[id]?.sec) return cost[id].sec;
  const [kind] = id.split('-'), deep = /-150$/.test(id), short = /-(40|60|t40)$/.test(id);
  const base = kind === '4bp' ? 15 : kind === '3bp' ? 50 : kind === 'limp' ? 200 : /srp-SB-BB/.test(id) ? 300 : 110;
  return base * (deep ? 2 : short ? 0.7 : 1);
};

// 1) Table live : une part fixe du lancement si le budget le permet.
const L = Q.live || {};
if (L.minutes > 0 && budget >= L.minutes + 2 * JOB) {
  const jm = Math.min(JOB, L.job_minutes || 60), jobs = Math.max(1, Math.floor(L.minutes / (jm + OVER)));
  plan.live = jobs; plan.liveMinutes = jm;
  plan.liveHands = Math.floor((jm * 60 * (L.hands_per_sec ?? 800) * 0.8) / 6); // mains par type et par cœur (6 types d'adversaires)
  budget -= jobs * (jm + OVER);
}
// 2) Bibliothèque : paliers successifs, ordre de priorité, jobs de JOB minutes à 2 cœurs.
const LEVELS = Q.levels || [91, 182, 364, 728, TOTAL];
const alloc = new Map(); const virt = { ...done };
for (const lvl of LEVELS) {
  for (const id of order) {
    const goal = Math.min(lvl, TOTAL), need = goal - virt[id]; if (need <= 0) continue;
    const sec = secOf(id), perJob = Math.max(1, Math.floor((JOB * 60 * 2) / (sec * 1.15)));
    let jobs = Math.ceil(need / perJob), mins = jobs * OVER + Math.ceil((need * sec) / 120);
    if (mins > budget) { jobs = Math.floor(budget / (JOB + OVER)); if (jobs < 1) continue; mins = jobs * (JOB + OVER); }
    const got = Math.min(need, jobs * perJob);
    const a = alloc.get(id) || { jobs: 0, nf: 0 }; a.jobs += jobs; a.nf = Math.max(a.nf, lvl >= TOTAL ? 4000 : lvl); alloc.set(id, a);
    virt[id] += got; budget -= mins;
    if (budget < OVER + 5) break;
  }
  if (budget < OVER + 5) break;
}
for (const [id, a] of alloc) for (let k = 0; k < a.jobs; k++) plan.matrix.push({ scen: id, k, n: a.jobs, nf: a.nf });
if (plan.matrix.length > 250) { plan.matrix = plan.matrix.slice(0, 250); plan.notes.push('matrice tronquée à 250 jobs'); }
plan.after = virt; plan.left = budget;
const out = { matrix: JSON.stringify(plan.matrix.length ? plan.matrix : [{ scen: 'none', k: 0, n: 0, nf: 0 }]), has_lib: plan.matrix.length ? 'true' : 'false', live: JSON.stringify(Array.from({ length: plan.live }, (_, i) => i)), has_live: plan.live ? 'true' : 'false', live_hands: plan.liveHands, live_minutes: plan.liveMinutes || 0,
  job_minutes: JOB, maxit: Q.maxit || 180, target: Q.target || 0.5, sample: Q.sample || '16x10', budget: Math.round(plan.budget) };
if (process.env.GITHUB_OUTPUT && !process.argv.includes('--dry')) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(out).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
const tot = (o) => Object.values(o).reduce((a, b) => a + b, 0);
console.log(`Mois ${month} : ${used} min consommées, ${remaining} disponibles, budget du lancement ${plan.budget} min.`);
console.log(`Table live : ${plan.live} job(s) de ${plan.liveMinutes || 0} min, ${plan.liveHands} mains par type et par cœur.`);
console.log(`Bibliothèque : ${plan.matrix.length} job(s) de ${JOB} min max sur ${alloc.size} scénario(s) ; flops ${tot(done)} → ${tot(virt)} (estimation).`);
for (const [id, a] of alloc) console.log(`  ${id} : ${a.jobs} job(s), ${done[id]} → ${virt[id]} flops, ${secOf(id)} s/flop`);
if (process.argv.includes('--json')) console.log(JSON.stringify(plan));
