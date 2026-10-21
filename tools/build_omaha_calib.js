// Calibration du score des mains d'Omaha 5 cartes et Hi-Lo : régression linéaire de l'équité (contre une main aléatoire)
// sur des caractéristiques simples de la main. Écrit src/omaha_calib.js. Usage : node tools/build_omaha_calib.js [mains] [tirages]
const V = require('../src/variants.js'), E = require('../src/engine.js'), fs = require('fs'), path = require('path');
const NH = +(process.argv[2] || 12000), IT = +(process.argv[3] || 250), R = E.rng(2027);
function feats(h, game) {
  const r = h.map((c) => c >> 2), s = h.map((c) => c & 3), cnt = {}, bs = [0, 0, 0, 0]; r.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1)); s.forEach((x) => bs[x]++);
  const pairs = Object.entries(cnt).filter(([, v]) => v === 2).map(([k]) => +k), trips = Object.values(cnt).some((v) => v >= 3) ? 1 : 0;
  const suited2 = bs.filter((x) => x === 2).length, suited3 = bs.filter((x) => x >= 3).length;
  const nutSuit = [0, 1, 2, 3].some((su) => bs[su] >= 2 && h.some((c) => (c & 3) === su && (c >> 2) === 12)) ? 1 : 0;
  const kSuit = [0, 1, 2, 3].some((su) => bs[su] >= 2 && h.some((c) => (c & 3) === su && (c >> 2) === 11)) ? 1 : 0;
  const u = [...new Set(r)].sort((a, b) => b - a); let conn = 0; for (let i = 0; i + 1 < u.length; i++) { const g = u[i] - u[i + 1]; if (g <= 3) conn += 4 - g; }
  const high = r.filter((x) => x >= 8).length, aces = cnt[12] || 0;
  const pairSum = pairs.reduce((a, x) => a + x + 2, 0);
  const lowR = new Set(r.map((x) => (x === 12 ? 1 : x + 2)).filter((x) => x <= 8));
  const f = [1, pairSum, pairs.length, trips, suited2, suited3, nutSuit, kSuit, conn, high, aces > 0 ? 1 : 0];
  if (game === 'plo8') f.push(lowR.has(1) && lowR.has(2) ? 1 : 0, lowR.has(1) && lowR.has(3) ? 1 : 0, lowR.size, lowR.has(1) ? 1 : 0);
  return f;
}
function solve(X, y) { // moindres carrés (équations normales, petite régularisation)
  const k = X[0].length, A = Array.from({ length: k }, () => new Float64Array(k)), b = new Float64Array(k);
  for (let i = 0; i < X.length; i++) for (let a = 0; a < k; a++) { b[a] += X[i][a] * y[i]; for (let c = 0; c < k; c++) A[a][c] += X[i][a] * X[i][c]; }
  for (let a = 0; a < k; a++) A[a][a] += 1e-6;
  for (let i = 0; i < k; i++) { let p = i; for (let r2 = i + 1; r2 < k; r2++) if (Math.abs(A[r2][i]) > Math.abs(A[p][i])) p = r2; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]]; for (let r2 = i + 1; r2 < k; r2++) { const f = A[r2][i] / A[i][i]; for (let c = i; c < k; c++) A[r2][c] -= f * A[i][c]; b[r2] -= f * b[i]; } }
  const w = new Array(k).fill(0); for (let i = k - 1; i >= 0; i--) { let s2 = b[i]; for (let c = i + 1; c < k; c++) s2 -= A[i][c] * w[c]; w[i] = s2 / A[i][i]; } return w;
}
const out = {};
for (const game of ['plo5', 'plo8']) {
  const nH = V.GAMES[game].hole, X = [], y = [];
  for (let s = 0; s < NH; s++) { const d = new Set(); while (d.size < nH) d.add(Math.floor(R() * 52)); const h = [...d]; X.push(feats(h, game)); y.push(V.equity(game, [h, null], [], { iterations: IT, random: R }).equity[0]); }
  const cut = Math.floor(NH * 0.8), w = solve(X.slice(0, cut), y.slice(0, cut));
  const pred = X.map((f) => f.reduce((a, x, i) => a + x * w[i], 0)), test = pred.slice(cut).map((p, i) => [p, y[cut + i]]);
  const my = test.reduce((a, t) => a + t[1], 0) / test.length, ssr = test.reduce((a, t) => a + (t[1] - t[0]) ** 2, 0), sst = test.reduce((a, t) => a + (t[1] - my) ** 2, 0);
  // corrélation de rang (Spearman) sur l'échantillon de test
  const rank = (arr) => { const o = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]), r = new Array(arr.length); o.forEach(([, i], k) => (r[i] = k)); return r; };
  const ra = rank(test.map((t) => t[0])), rb = rank(test.map((t) => t[1])), n = test.length, d2 = ra.reduce((a, x, i) => a + (x - rb[i]) ** 2, 0);
  const q = pred.slice().sort((a, b) => b - a), Q = Array.from({ length: 101 }, (_, p) => +q[Math.min(q.length - 1, Math.floor((p / 100) * q.length))].toFixed(4));
  out[game] = { w: w.map((x) => +x.toFixed(5)), q: Q, r2: +(1 - ssr / sst).toFixed(3), spearman: +(1 - (6 * d2) / (n * (n * n - 1))).toFixed(3), n: NH, it: IT };
  console.log(game, 'R²', out[game].r2, 'Spearman', out[game].spearman);
}
fs.writeFileSync(path.join(__dirname, '../src/omaha_calib.js'), `// Généré par tools/build_omaha_calib.js : régression de l'équité (contre une main aléatoire) sur les caractéristiques de la main, ${NH} mains, ${IT} tirages.\n(function (root) { const C = ${JSON.stringify(out)};\n  C.feats = ${feats.toString()};\n  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.OmahaCalib = C; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('ok');
