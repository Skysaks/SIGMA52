// Construit la matrice d'équité préflop 169 x 169 (classe contre classe, moyenne sur les combinaisons compatibles).
// Usage : node tools/build_matrix.js [iterations par paire]  → src/matrix.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os'), fs = require('fs'), path = require('path');
const E = require('../src/engine.js');
const N = 169, ITER = +(process.argv[2] || 40000);
if (isMainThread) {
  const pairs = []; for (let i = 0; i < N; i++) for (let j = i; j < N; j++) pairs.push([i, j]);
  const W = Math.max(1, os.cpus().length), chunks = Array.from({ length: W }, () => []);
  pairs.forEach((p, k) => chunks[k % W].push(p));
  const out = new Float64Array(N * N); let done = 0; const t0 = Date.now();
  chunks.forEach((chunk, w) => {
    const wk = new Worker(__filename, { workerData: { chunk, seed: 1000 + w, iter: ITER } });
    wk.on('message', (m) => {
      for (const [i, j, e] of m) { out[i * N + j] = e; out[j * N + i] = 1 - e; }
      if (++done === W) {
        const u16 = new Uint16Array(N * N); for (let k = 0; k < N * N; k++) u16[k] = Math.round(out[k] * 65535);
        const b64 = Buffer.from(u16.buffer).toString('base64');
        fs.writeFileSync(path.join(__dirname, '../src/matrix.js'),
          `// Matrice d'équité préflop 169 x 169, générée par tools/build_matrix.js (${ITER} tirages par paire, erreur type ≈ ${(50 / Math.sqrt(ITER)).toFixed(2)} pt).\n` +
          `// Index : ordre Engine.ALL169. Valeur = équité de la ligne contre la colonne (uint16 / 65535).\n` +
          `(function (root) { const B = '${b64}';\n  const api = { N: 169, ITER: ${ITER}, B64: B };\n  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Matrix = api;\n})(typeof window !== 'undefined' ? window : globalThis);\n`);
        console.log('matrice écrite en', ((Date.now() - t0) / 1000).toFixed(0), 's');
      }
    });
  });
} else {
  const { chunk, seed, iter } = workerData, R = E.rng(seed), res = [];
  const combos = E.ALL169.map((h) => E.combos(h));
  for (const [i, j] of chunk) {
    const pairs = [];
    for (const a of combos[i]) for (const b of combos[j]) if (a[0] !== b[0] && a[0] !== b[1] && a[1] !== b[0] && a[1] !== b[1]) pairs.push([a, b]);
    let eq = 0; const used = new Uint8Array(52), board = new Array(5);
    for (let it = 0; it < iter; it++) {
      const [a, b] = pairs[(R() * pairs.length) | 0];
      used.fill(0); used[a[0]] = used[a[1]] = used[b[0]] = used[b[1]] = 1;
      for (let k = 0; k < 5;) { const c = (R() * 52) | 0; if (!used[c]) { used[c] = 1; board[k++] = c; } }
      const x = E.evaluate([a[0], a[1], ...board]), y = E.evaluate([b[0], b[1], ...board]);
      eq += x > y ? 1 : x === y ? 0.5 : 0;
    }
    res.push([i, j, eq / iter]);
  }
  parentPort.postMessage(res);
}
