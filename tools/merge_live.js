// Fusionne les entraînements de la Table live : comptes bruts cumulés (tools/data/live_counts.json, ou reconstruits depuis
// src/live_model.js la première fois) + fichiers de comptes produits par train_live.js. Réécrit src/live_model.js.
// Usage : node tools/merge_live.js shardA.json [shardB.json ...]
const fs = require('fs'), path = require('path');
const CUM = path.join(__dirname, 'data/live_counts.json'), OUT = path.join(__dirname, '../src/live_model.js');
const old = require(OUT);
const map4 = (A, f) => A.map((F, s) => F.map((S, fa) => S.map((M, sc) => M.map((I, mw) => I.map((Bk, ip) => Bk.map((c, b) => f(c, s, fa, sc, mw, ip, b)))))));
let cum;
if (fs.existsSync(CUM)) cum = JSON.parse(fs.readFileSync(CUM, 'utf8'));
else {
  // Reconstruction : p = (x + 0,5) / (n + 0,5 k)  =>  x = p (n + 0,5 k) - 0,5
  cum = { hands: {}, raw: {} };
  for (const t of old.types) {
    cum.hands[t] = old.hands;
    cum.raw[t] = map4(old.post2[t], (c, s, fa) => { const k = fa ? 3 : 4, row = c.p.map((p) => Math.max(0, Math.round(p * (c.n + 0.5 * k) - 0.5))); return fa ? row.concat([0]) : row; });
  }
}
for (const f of process.argv.slice(2)) {
  const sh = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [t, post] of Object.entries(sh.raw)) {
    cum.hands[t] = (cum.hands[t] || 0) + sh.hands;
    cum.raw[t] = cum.raw[t] ? map4(cum.raw[t], (row, s, fa, sc, mw, ip, b) => row.map((x, k) => x + post[s][fa][sc][mw][ip][b][k])) : post;
  }
}
const cell = (row, facing) => { const r = facing ? row.slice(0, 3) : row, n = r.reduce((x, y) => x + y, 0); return { n, p: r.map((x) => +((x + 0.5) / (n + 0.5 * r.length)).toFixed(3)) }; };
const model = { ...old, post: {}, post2: {} };
let obs = 0;
for (const t of old.types) {
  const post = cum.raw[t];
  model.post2[t] = post.map((F) => F.map((S, facing) => S.map((M) => M.map((I) => I.map((Bk) => Bk.map((row) => cell(row, facing)))))));
  model.post[t] = post.map((F) => F.map((S, facing) => S.map((_, sc) => old.buckets.map((__, b) => { const row = [0, 0, 0, 0]; for (const mw of [0, 1]) for (const ip of [0, 1]) S[sc][mw][ip][b].forEach((x, k) => (row[k] += x)); return cell(row, facing); }))));
  map4(post, (row) => { obs += row.reduce((x, y) => x + y, 0); });
}
const total = Object.values(cum.hands).reduce((a, b) => a + b, 0);
model.hands = Math.round(total / old.types.length); model.handsTotal = total; model.decisions = obs; model.handsByType = cum.hands;
fs.mkdirSync(path.dirname(CUM), { recursive: true });
fs.writeFileSync(CUM, JSON.stringify(cum));
fs.writeFileSync(OUT, `// Généré par tools/train_live.js + tools/merge_live.js le ${new Date().toISOString().slice(0, 10)} : ${total} mains simulées au total (${old.types.length} types d'adversaires), tables de 2 à 9 joueurs, 25 à 200 bb, ${obs} décisions observées.\n(function (root) { const M = ${JSON.stringify(model)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.LiveModel = M; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('fusion ok', total, 'mains', obs, 'décisions', JSON.stringify(cum.hands));
