// Tables des variantes : équité de chacune des 16 432 classes de mains PLO (4 cartes) contre une main aléatoire,
// quantiles d'équité des mains d'Omaha 5 cartes, équité des 81 mains de Short Deck contre 1, 2 et 3 mains aléatoires.
// Écrit src/variants_data.js. Usage : node tools/build_variants.js [tirages PLO par classe]
const V = require('../src/variants.js'), E = require('../src/engine.js'), fs = require('fs'), path = require('path');
const IT = +(process.argv[2] || 500), R = E.rng(4242), t0 = Date.now();
// ---- PLO 4 cartes : toutes les classes ----
const classes = new Map();
for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++) for (let d = c + 1; d < 52; d++) {
  const k = V.canon([a, b, c, d]); const e = classes.get(k); if (e) e.n++; else classes.set(k, { n: 1, h: [a, b, c, d] });
}
console.log('PLO : classes', classes.size);
const keys = [...classes.keys()].sort((x, y) => x - y), eqP = [], wP = [];
let i = 0;
for (const k of keys) {
  const { n, h } = classes.get(k);
  const r = V.equity('plo', [h, null], [], { iterations: IT, random: R });
  eqP.push(Math.round(r.equity[0] * 1000)); wP.push(n);
  if (++i % 2000 === 0) console.log(i, Math.round((Date.now() - t0) / 1000) + ' s');
}
// ---- Omaha 5 cartes : quantiles ----
const q5 = [];
for (let s = 0; s < 2500; s++) { const d = new Set(); while (d.size < 5) d.add(Math.floor(R() * 52)); q5.push(V.equity('plo5', [[...d], null], [], { iterations: 300, random: R }).equity[0]); }
q5.sort((a, b) => b - a); const Q5 = Array.from({ length: 101 }, (_, p) => Math.round(q5[Math.min(q5.length - 1, Math.floor((p / 100) * q5.length))] * 1000));
console.log('PLO5 ok', Math.round((Date.now() - t0) / 1000) + ' s');
// ---- Short Deck : 81 mains ----
const RK = 'AKQJT9876'.split(''), SD = [];
for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) {
  const name = x === y ? RK[x] + RK[x] : x < y ? RK[x] + RK[y] + 's' : RK[y] + RK[x] + 'o';
  const r1 = E.RANKS.indexOf(name[0]), r2 = E.RANKS.indexOf(name[1]), hand = name.length === 2 ? [r1 * 4, r2 * 4 + 1] : name[2] === 's' ? [r1 * 4, r2 * 4] : [r1 * 4, r2 * 4 + 1];
  const eqs = [1, 2, 3].map((k) => Math.round(V.equity('sd', [hand, ...Array(k).fill(null)], [], { iterations: 20000, random: R }).equity[0] * 1000));
  SD.push([name, ...eqs]);
}
console.log('Short Deck ok', Math.round((Date.now() - t0) / 1000) + ' s');
fs.writeFileSync(path.join(__dirname, '../src/variants_data.js'), `// Généré par tools/build_variants.js le ${new Date().toISOString().slice(0, 10)} (${IT} tirages par classe PLO, 20 000 par main de Short Deck).\n(function (root) { const D = ${JSON.stringify({ plo: { keys, eq: eqP, w: wP, it: IT }, plo5q: Q5, sd: SD })};\n  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.VariantsData = D; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('ok', Math.round((Date.now() - t0) / 1000) + ' s');
