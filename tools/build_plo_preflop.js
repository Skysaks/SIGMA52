// Solveur préflop PLO 6-max simplifié : les 16 432 classes de mains (270 725 mains) regroupées en 120 paquets
// (structure de couleurs × 40 tranches d'équité contre une main au hasard), matrice d'équité paquet contre paquet par Monte-Carlo,
// puis le même CFR+ vectorisé que le Hold'em (tools/build_preflop.js) avec des tailles pot-limit.
// Usage : node tools/build_plo_preflop.js [itérations] [tirages par paire]   -> src/plo_preflop_data.js
const E = require('../src/engine.js'), O = require('../src/omaha.js'), VV = require('../src/variants.js'), VD = require('../src/variants_data.js');
const PF = require('./build_preflop.js'), fs = require('fs'), path = require('path');
const ITER = +(process.argv[2]) || 500, K = +(process.argv[3]) || 400, RO = (process.argv[4] || '0.85,0.9,0.95').split(',').map(Number), PLAYS = (process.argv[5] || '1.06,1,0.93').split(',').map(Number);
const { keys, eq, w } = VD.plo, NC = keys.length, TOT = w.reduce((a, b) => a + b, 0);
const R = E.rng(52);
const find = (k) => { let lo = 0, hi = NC - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (keys[m] < k) lo = m + 1; else hi = m; } return keys[lo] === k ? lo : -1; };
const deal = (n, dead) => { const out = []; while (out.length < n) { const c = (R() * 52) | 0; if (!dead.has(c) && !out.includes(c)) out.push(c); } return out; };
const CACHE = path.join(__dirname, 'data/plo_eqm.json');
let bucketOf, bw, EQM, NB;
const B_EQ = 40, S_N = 3;
if (fs.existsSync(CACHE) && !process.env.FRESH) {
  const c = JSON.parse(fs.readFileSync(CACHE, 'utf8')); NB = c.nb; bucketOf = Uint8Array.from(c.bucketOf); bw = Float64Array.from(c.bw); EQM = Float64Array.from(c.eqm); console.log('matrice reprise du cache');
} else {
// 1. Représentants : mains tirées au hasard, rangées par classe.
const rep = new Array(NC).fill(null), pools = new Map();
const struct = (h) => { const s = [0, 0, 0, 0]; h.forEach((c) => s[c & 3]++); const v = s.sort((a, b) => b - a); return v[0] === 2 && v[1] === 2 ? 0 : v[0] === 2 ? 1 : 2; }; // 0 double assortie, 1 assortie, 2 autre
const SAMPLE = 900000;
const hands = [];
for (let k = 0; k < SAMPLE; k++) { const h = deal(4, new Set()), ci = find(VV.canon(h)); if (ci < 0) continue; if (!rep[ci]) rep[ci] = h; hands.push([h, ci]); }
// 2. Paquets : par structure, 40 tranches d'équité de même poids.
NB = B_EQ * S_N; bucketOf = new Uint8Array(NC); bw = new Float64Array(NB);
const classStruct = Array.from({ length: NC }, (_, i) => (rep[i] ? struct(rep[i]) : 2));
for (let s = 0; s < S_N; s++) {
  const idx = [...Array(NC).keys()].filter((i) => classStruct[i] === s).sort((a, b) => eq[a] - eq[b]), tw = idx.reduce((a, i) => a + w[i], 0);
  let cum = 0; for (const i of idx) { const b = Math.min(B_EQ - 1, Math.floor(((cum + w[i] / 2) / tw) * B_EQ)); bucketOf[i] = s * B_EQ + b; bw[s * B_EQ + b] += w[i]; cum += w[i]; }
}
for (const [h, ci] of hands) { const b = bucketOf[ci]; let p = pools.get(b); if (!p) pools.set(b, (p = [])); if (p.length < 4000) p.push(h); }
// 3. Matrice d'équité paquet contre paquet (Monte-Carlo, K tirages par paire, board complet).
EQM = new Float64Array(NB * NB); const t0 = Date.now();
for (let a = 0; a < NB; a++) for (let b = a; b < NB; b++) {
  const pa = pools.get(a), pb = pools.get(b); if (!pa || !pb) { EQM[a * NB + b] = EQM[b * NB + a] = 0.5; continue; }
  let s = 0, n = 0;
  for (let k = 0; k < K; k++) {
    const h1 = pa[(R() * pa.length) | 0], h2 = pb[(R() * pb.length) | 0]; if (h1.some((c) => h2.includes(c))) { k--; if (++n > K * 20) break; continue; }
    const bd = deal(5, new Set([...h1, ...h2])), v1 = O.evaluate(h1, bd), v2 = O.evaluate(h2, bd); s += v1 > v2 ? 1 : v1 === v2 ? 0.5 : 0;
  }
  const e = s / K; EQM[a * NB + b] = e; EQM[b * NB + a] = 1 - e;
}
console.log('matrice', NB, 'paquets', Math.round((Date.now() - t0) / 1000), 's');
fs.writeFileSync(CACHE, JSON.stringify({ nb: NB, bucketOf: Array.from(bucketOf), bw: Array.from(bw), eqm: Array.from(EQM, (x) => +x.toFixed(4)) }));
}
// 4. Réalisation d'équité : la structure de couleurs et le haut de la tranche jouent mieux après le flop (hypothèse de modèle).
// Hors de position : 85 % en pot simple, 90 % en 3-bet, 95 % au-delà (les équités PLO sont serrées : avec les 72 % du Hold'em, le bouton ouvrait 73 % et UTG 10 %).
const PLAY = Array.from({ length: NB }, (_, b) => PLAYS[Math.floor(b / B_EQ)] + 0.04 * ((b % B_EQ) / (B_EQ - 1) - 0.5));
PF.useGame({ N: NB, EQ: EQM, W: Array.from(bw), TOT, CW: null, PLAY });
PF.setIter(ITER);
// Tailles pot-limit : ouverture au pot 3,5 bb (3 bb depuis SB), 3-bet au pot ≈ 3,4 × en position, 3,2 × depuis les blindes, 4-bet au pot ≈ 3,1 ×.
const CONFIGS = [
  { id: 'plo100', ro: RO, fmt: 'cash', label: 'PLO cash 100 bb', stack: 100, open: 3.5, openSB: 3, iso: 3, threeIP: 3.4, threeOOP: 3.2, four: 3.1, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
  { id: 'plo40', ro: RO, fmt: 'cash', label: 'PLO cash 40 bb', stack: 40, open: 3.5, openSB: 3, iso: 3, threeIP: 3.4, threeOOP: 3.2, four: 3.1, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
];
const out = [];
for (const cfg of CONFIGS) {
  const t1 = Date.now(), T = PF.solve(cfg);
  const nodes = T.nodes.map((n) => { const av = PF.avgOf(n), L = PF.lossOf(n); return { key: n.key, label: n.label, p: PF.POS[n.p], acts: n.acts.map((a) => ({ k: a.k, l: a.l })), f: av.map(PF.enc), ...(L ? { l: L } : {}) }; });
  const rfi = nodes.filter((n) => n.key.startsWith('rfi:')).map((n) => { const f = n.f.map((s) => [...s].map((c) => PF.ALPH.indexOf(c) / 63)); const open = f.slice(1).reduce((acc, arr) => acc + arr.reduce((s, x, i) => s + x * bw[i], 0), 0) / TOT; return `${n.p} ${(open * 100).toFixed(1)} %`; });
  console.log(cfg.id, nodes.length, 'nœuds', Math.round((Date.now() - t1) / 1000) + ' s', 'ouvertures :', rfi.join(' · '));
  out.push({ id: cfg.id, fmt: cfg.fmt, label: cfg.label, stack: cfg.stack, open: cfg.open, nodes });
}
const map = String.fromCharCode(...Array.from(bucketOf, (b) => 161 + b));
const info = Array.from({ length: NB }, (_, b) => ({ s: Math.floor(b / B_EQ), w: Math.round(bw[b]) }));
fs.writeFileSync(path.join(__dirname, '../src/plo_preflop_data.js'), `// Généré par tools/build_plo_preflop.js (${ITER} itérations CFR+, ${K} tirages par paire de paquets). Ne pas éditer à la main.\n(function (root) { const D = ${JSON.stringify({ alph: PF.ALPH, lossMax: PF.LOSS_MAX, nb: NB, map, info, configs: out })};\n  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.PLOPreflopData = D; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('src/plo_preflop_data.js écrit');
