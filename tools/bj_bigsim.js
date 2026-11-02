// Grandes simulations blackjack de SIGMA 52 (ordre de grandeur CVData : des milliards de mains), réparties sur tous les cœurs.
// Chaque tâche cumule, par true count, le nombre de mains, la somme et la somme des carrés des résultats (mise de 1 par main),
// ce qui suffit pour calculer avantage, variance, rampe optimale, SCORE, N0 et risque de ruine de n'importe quelle rampe.
// Reprenable : les résultats s'ajoutent à tools/data/bj_sims.json ; relancer ajoute des mains.
// Usage : node tools/bj_bigsim.js [millions_de_mains_par_tâche_unité=100] [filtre : sous-chaîne, ou re:expression]
// Systèmes autres que Hi-Lo : statistiques rangées par TC équivalent Hi-Lo (TC du système ÷ son échelle), pour comparer à résolution égale.
const fs = require('fs'), path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const OUT = path.join(__dirname, 'data', 'bj_sims.json');

function jobs() {
  const CT = require('../src/bj_counts.js'), list = [];
  for (const key of ['europe', 'strip']) {
    for (const pen of [0.67, 0.75, 0.83]) list.push({ id: `${key}|hilo|${pen}|1|none`, key, sys: 'hilo', pen, spots: 1, cover: 'none', w: 3 });
    list.push({ id: `${key}|hilo|0.75|2|none`, key, sys: 'hilo', pen: 0.75, spots: 2, cover: 'none', w: 2 });
    for (const cover of ['no1010', 'noins', 'basic']) // basic : aucun indice de jeu, assurance conservée
      list.push({ id: `${key}|hilo|0.75|1|${cover}`, key, sys: 'hilo', pen: 0.75, spots: 1, cover, w: 3 });
    for (const S of CT.SYSTEMS) if (S.id !== 'hilo') list.push({ id: `${key}|${S.id}|0.75|1|none`, key, sys: S.id, pen: 0.75, spots: 1, cover: 'none', w: 1 });
  }
  // Autres jeux de règles : Hi-Lo seul, trois pénétrations (référence pour « Mes tables »).
  for (const key of ['h17', 'deux', 'sixcinq']) for (const pen of [0.67, 0.75, 0.83]) list.push({ id: `${key}|hilo|${pen}|1|none`, key, sys: 'hilo', pen, spots: 1, cover: 'none', w: 1 });
  return list;
}

function runChunk(job, hands, seed) {
  const BJ = require('../src/bj_engine.js'), D = require('../src/bj_data.js'), CT = require('../src/bj_counts.js');
  const P = D.presets[job.key], S = CT.byId[job.sys];
  const table = Object.fromEntries(Object.entries(P.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))]));
  let devs = [], ins = null;
  if (job.sys === 'hilo') { devs = P.indices; ins = P.insurance.index; }
  else { const C = D.counts?.[job.key]?.systems?.[job.sys]; if (C && C.indices) { devs = C.indices; ins = C.insurance?.index ?? null; } }
  if (job.cover === 'no1010') devs = devs.filter((d) => !(d.row === 'p10' && d.act === 'split'));
  if (job.cover === 'noins') ins = null;
  if (job.cover === 'basic') { devs = []; }
  const cardTag = job.sys === 'hilo' ? undefined : (c) => CT.tagOfCard(S, ((c % 13) << 2) | (Math.floor(c / 13) % 4));
  const r = BJ.simulate({ rules: P.rules, table, devs, useIndices: devs.length > 0 || ins !== null, insIndex: ins, ramp: () => 1, hands, seed, pen: job.pen, others: 2, buckets: true, noRes: true, cardTag, imb: S.imb, spots: () => job.spots, bucketDiv: job.sys === 'hilo' ? 1 : (D.counts?.[job.key]?.systems?.[job.sys]?.scale || 1) });
  return { buckets: r.buckets, buckets2: r.buckets2, hands: r.hands, rounds: r.rounds };
}

if (!isMainThread) {
  const { job, hands, seed } = workerData;
  parentPort.postMessage(runChunk(job, hands, seed));
} else {
  const unitM = +(process.argv[2] || 100), filt = process.argv[3] || '', CHUNK = 5e6;
  const data = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { jobs: {} };
  const todo = [];
  for (const j of jobs()) if (!filt || (filt.startsWith('re:') ? new RegExp(filt.slice(3)).test(j.id) : j.id.includes(filt))) { const target = Math.round(unitM * 1e6 * j.w); for (let h = 0; h < target; h += CHUNK) todo.push({ job: j, hands: Math.min(CHUNK, target - h) }); }
  const ncpu = require('os').cpus().length, t0 = Date.now(); let done = 0, handsDone = 0, next = 0, active = 0;
  const save = () => { data.updated = new Date().toISOString(); fs.writeFileSync(OUT, JSON.stringify(data)); };
  const merge = (job, r) => {
    const J = (data.jobs[job.id] ||= { ...job, hands: 0, rounds: 0, b1: {}, b2: {} });
    J.hands += r.hands; J.rounds += r.rounds;
    for (const [B, src] of [[J.b1, r.buckets], [J.b2, r.buckets2]]) for (const [tc, q] of Object.entries(src || {})) { const a = (B[tc] ||= [0, 0, 0]); a[0] += q[0]; a[1] += q[1]; a[2] += q[2]; }
  };
  const launch = () => {
    if (next >= todo.length) { if (!active) { save(); console.log('terminé', (handsDone / 1e9).toFixed(2), 'milliard de mains en', ((Date.now() - t0) / 60000).toFixed(1), 'min'); } return; }
    const t = todo[next++]; active++;
    const w = new Worker(__filename, { workerData: { job: t.job, hands: t.hands, seed: (Date.now() ^ (next * 2654435761)) >>> 0 } });
    w.on('message', (r) => { merge(t.job, r); handsDone += r.hands; done++; if (done % 10 === 0) { save(); console.log(done + '/' + todo.length, (handsDone / 1e9).toFixed(2) + ' Md', ((Date.now() - t0) / 60000).toFixed(1) + ' min'); } });
    w.on('exit', () => { active--; launch(); });
    w.on('error', (e) => { console.error(e); });
  };
  console.log(todo.length, 'blocs de', CHUNK / 1e6, 'M mains sur', ncpu, 'cœurs');
  for (let i = 0; i < ncpu; i++) launch();
}
