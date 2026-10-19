// Rapport agrégé (inspiré des « aggregated reports ») : BTN ouvre, BB paie, 100 bb. Résout un échantillon stratifié de flops
// avec le solveur SIGMA 52 et écrit src/aggregate_data.js. Usage : node tools/build_aggregate.js [nombre de flops] [secondes max par flop]
const E = require('../src/engine.js'), C = require('../src/charts.js'), PF = require('../src/postflop.js'), B = require('../src/board.js');
const fs = require('fs'), path = require('path');
const NF = +(process.argv[2] || 48), MAXS = +(process.argv[3] || 90), ONLY = process.argv[4] || '';
// ---- Les 1 755 flops stratégiquement distincts et leur poids ----
function canon(cards) {
  // forme canonique par permutation des couleurs
  let best = null;
  const perms = []; const p = (a, l) => { if (!l.length) perms.push(a); l.forEach((x, i) => p([...a, x], l.filter((_, j) => j !== i))); }; p([], [0, 1, 2, 3]);
  for (const pm of perms) { const k = cards.map((c) => (c & ~3) | pm[c & 3]).sort((a, b) => b - a).join(','); if (best === null || k < best) best = k; }
  return best;
}
const map = new Map();
for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++) { const k = canon([a, b, c]); map.set(k, (map.get(k) || 0) + 1); }
const flops = [...map].map(([k, w]) => ({ cards: k.split(',').map(Number), w }));
const hiName = (r) => (r === 12 ? 'A' : r === 11 ? 'K' : r === 10 ? 'Q' : r === 9 ? 'J' : r === 8 ? 'T' : '9-');
function tags(cards) {
  const r = cards.map((c) => c >> 2).sort((a, b) => b - a), s = new Set(cards.map((c) => c & 3)).size;
  const paired = r[0] === r[1] || r[1] === r[2] ? (r[0] === r[2] ? 'brelan' : 'pairé') : 'non pairé';
  const suits = s === 1 ? 'monochrome' : s === 2 ? 'deux couleurs' : 'arc-en-ciel';
  const u = [...new Set(r)], span = u[0] - u[u.length - 1], conn = u.length === 3 && (span <= 4 || (r[0] === 12 && r[2] <= 3 && r[1] <= 3)) ? 'connecté' : 'sec';
  return { high: hiName(r[0]), paired, suits, conn };
}
flops.forEach((f) => (f.tags = tags(f.cards)));
// ---- Échantillon stratifié : groupes hauteur × couleurs × pairé, quota ∝ poids ----
const groups = new Map();
for (const f of flops) { const g = `${f.tags.high}|${f.tags.suits}|${f.tags.paired === 'non pairé' ? 'np' : 'p'}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(f); }
const total = 22100, gl = [...groups].map(([g, L]) => ({ g, L, w: L.reduce((a, f) => a + f.w, 0) }));
gl.forEach((x) => (x.q = Math.max(1, Math.round((x.w / total) * NF))));
let rng = E.rng(52); const pick = [];
for (const x of gl) { const L = x.L.slice().sort(() => rng() - 0.5); for (let i = 0; i < Math.min(x.q, L.length); i++) pick.push({ ...L[i], gw: x.w / Math.min(x.q, L.length) }); }
console.log(flops.length, 'flops distincts ;', pick.length, 'résolus');
// ---- Spot ----
const ra = C.FACING.BTN.BB.call, rb = C.RFI.BTN.range; // OOP = BB (paie), IP = BTN (ouvre)
const sizes = { flop: [{ bet: '', raise: '60' }, { bet: '33 75', raise: '60' }], turn: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }], river: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }] };
const CATS = ['Deux paires et mieux', 'Top paire, overpair', 'Paire moyenne ou faible', 'Tirage', 'Rien'];
const catOf = (h, board) => { const k = B.classify(h, board); return k.made <= 7 ? 0 : k.made <= 9 ? 1 : k.made <= 11 ? 2 : k.draws.some((d) => d <= 1) ? 3 : 4; };
const out = [];
const t00 = Date.now();
for (const f of pick) {
  const board = f.cards.slice(), str = board.map(E.cardStr).join('');
  if (ONLY && ONLY !== '1' && str !== ONLY) continue;
  const g = PF.create({ board, pot: 5.5, stack: 97.5, ranges: [ra, rb], sizes, maxRaises: 1, sample: { turn: 8, river: 6 } });
  const t0 = Date.now(); let ex = null, it = 0;
  while (true) { g.iterate(1); it++; if (it % 15 === 0) { ex = g.exploitability(); if (ex.pct <= 1 || (Date.now() - t0) / 1000 > MAXS) break; } }
  // nœud BTN après le check de BB
  const root = g.info([]), ck = root.node.acts.findIndex((a) => a.k === 'x');
  const n1 = g.info([ck]), labels = n1.node.acts.map((_, a) => g.label(n1.node, a));
  const p = n1.node.p, H = g.hands[p], n = H.length, sg = n1.strategy, reach = n1.reach[p];
  const byCat = CATS.map(() => ({ w: 0, bet: 0 }));
  for (let i = 0; i < n; i++) { const c = catOf([H[i][0], H[i][1]], board), w = reach[i]; byCat[c].w += w; let b = 0; for (let a = 0; a < labels.length; a++) if (n1.node.acts[a].k !== 'x') b += sg[a * n + i]; byCat[c].bet += w * b; }
  const tw = byCat.reduce((a, x) => a + x.w, 0);
  // réponse de BB à la petite mise
  const small = n1.node.acts.findIndex((a) => a.k !== 'x');
  const n2 = g.info([ck, small]), l2 = n2.node.acts.map((_, a) => g.label(n2.node, a));
  out.push({ b: str, w: f.gw, t: f.tags, act: labels, f: n1.freq.map((x) => +x.toFixed(3)), eq: +n1.eqMean[1].toFixed(3), ev: +((n1.evMean[1]) / 5.5).toFixed(3),
    cat: byCat.map((x) => [+(x.w / tw).toFixed(3), x.w > 0 ? +(x.bet / x.w).toFixed(3) : null]), bb: { act: l2, f: n2.freq.map((x) => +x.toFixed(3)) }, ex: +ex.pct.toFixed(2), it, s: Math.round((Date.now() - t0) / 1000) });
  console.log(out.length + '/' + pick.length, str, labels.join('/'), n1.freq.map((x) => (x * 100).toFixed(0)).join('/'), 'expl', ex.pct.toFixed(2) + '%', it + ' it', Math.round((Date.now() - t0) / 1000) + ' s');
  if (ONLY === '1') break;
  if (!ONLY) fs.writeFileSync(path.join(__dirname, '../src/aggregate_data.js'), '// Généré par tools/build_aggregate.js : BTN ouvre 2,5 bb, BB paie, 100 bb, flop 33 % / 75 %, turn et river simplifiés à 75 %.\n(function (root) { const D = ' + JSON.stringify({ spot: 'BTN contre BB, pot simple, 100 bb', cats: CATS, flops: out, total: flops.length, built: new Date().toISOString().slice(0, 10) }) + ";\n  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.AggregateData = D; })(typeof window !== 'undefined' ? window : globalThis);\n");
}
console.log('total', Math.round((Date.now() - t00) / 1000), 's');
