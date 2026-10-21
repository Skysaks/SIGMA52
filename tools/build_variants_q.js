// Quantiles d'équité (contre une main aléatoire) des mains d'Omaha Hi-Lo : servent à classer une main de départ.
// Écrit src/variants_q.js. Usage : node tools/build_variants_q.js [mains] [tirages]
const V = require('../src/variants.js'), E = require('../src/engine.js'), fs = require('fs'), path = require('path');
const NH = +(process.argv[2] || 2500), IT = +(process.argv[3] || 300), R = E.rng(808);
const q = [];
for (let s = 0; s < NH; s++) { const d = new Set(); while (d.size < 4) d.add(Math.floor(R() * 52)); q.push(V.equity('plo8', [[...d], null], [], { iterations: IT, random: R }).equity[0]); }
q.sort((a, b) => b - a);
const Q = Array.from({ length: 101 }, (_, p) => Math.round(q[Math.min(q.length - 1, Math.floor((p / 100) * q.length))] * 1000));
fs.writeFileSync(path.join(__dirname, '../src/variants_q.js'), `// Généré par tools/build_variants_q.js (${NH} mains, ${IT} tirages) : quantiles d'équité Omaha Hi-Lo contre une main aléatoire (×1000, du meilleur au moins bon).\n(function (root) { const Q = { plo8q: ${JSON.stringify(Q)} };\n  if (typeof module !== 'undefined' && module.exports) module.exports = Q; else root.VariantsQ = Q; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('ok', Q.slice(0, 5), Q[50], Q[100]);
