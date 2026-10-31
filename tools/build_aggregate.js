// Rapport agrégé (inspiré des « aggregated reports ») : résout un échantillon stratifié de flops avec le solveur SIGMA 52
// pour un scénario, écrit tools/data/agg_<scénario>.json, puis assemble src/aggregate_data.js avec tous les scénarios calculés.
// Usage : node tools/build_aggregate.js [nombre de flops] [secondes max par flop] [flop unique|''] [scénario]
// Scénarios : srp-BTN-BB (défaut), srp-UTG-BB, 3bp-BTN-BB.
const E = require('../src/engine.js'), C = require('../src/charts.js'), PF = require('../src/postflop.js'), B = require('../src/board.js');
const fs = require('fs'), path = require('path');
const NF = +(process.argv[2] || 48), MAXS = +(process.argv[3] || 90), ONLY = process.argv[4] || '', SCID = process.argv[5] || 'srp-BTN-BB';
// Échantillon de turns × rivers (ex. 24x16) ; au-delà de 8x6, les stratégies par classe de mains sont aussi enregistrées (bibliothèque de flops).
const SMP = (process.argv[6] || '8x6').split('x').map(Number), LIB = SMP[0] > 8, TARGET = +(process.argv[7] || 1);
const ALPH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
function classStrat(g, info) { const node = info.node, p = node.p, H = g.hands[p], n = H.length, A = node.acts.length, acc = new Map(); for (let i = 0; i < n; i++) { const w = info.reach[p][i]; if (w <= 0) continue; const h = E.abstractOf(H[i][0], H[i][1]); let x = acc.get(h); if (!x) acc.set(h, x = { w: 0, f: new Array(A).fill(0) }); x.w += w; for (let a = 0; a < A; a++) x.f[a] += w * info.strategy[a * n + i]; } return { act: node.acts.map((_, a) => g.label(node, a)), k: node.acts.map((a) => a.k), s: node.acts.map((_, a) => E.ALL169.map((h) => { const x = acc.get(h); return x ? ALPH[Math.round((x.f[a] / x.w) * 63)] : '.'; }).join('')) }; }
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
let rng = E.rng(52); const pick0 = [];
for (const x of gl) { const L = x.L.slice().sort(() => rng() - 0.5), sel = []; for (let i = 0; i < Math.min(x.q, L.length); i++) sel.push({ ...L[i], gw: x.w / Math.min(x.q, L.length) }); pick0.push(sel); }
// Ordre tourniquet : un flop de chaque groupe de texture, puis le deuxième, etc. Un calcul interrompu couvre déjà toutes les textures.
// (Les listes mélangées ne dépendent pas du nombre de flops demandé : passer de 45 à 90 flops réutilise tous les flops déjà résolus.)
const pick = []; for (let r = 0; pick0.some((sel) => sel.length > r); r++) for (const sel of pick0.slice().sort((a, b) => b.length - a.length)) if (sel[r]) pick.push(sel[r]);
// Parts : SHARD=k/N ne résout qu'un flop sur N (calcul réparti sur plusieurs cœurs ou machines), écrit lib_<scénario>.part<k>.json.
if (process.env.PRINTPICK) { console.log(JSON.stringify(pick.map((f) => f.cards.map(E.cardStr).join('') + '|' + f.tags.high + '|' + f.tags.suits + '|' + f.tags.paired))); process.exit(0); }
const [SHK, SHN] = (process.env.SHARD || '0/1').split('/').map(Number), MAXIT = +(process.env.MAXIT || 0);
console.log(flops.length, 'flops distincts ;', pick.length, 'résolus');
// ---- Spot ----
const CALL3_BTN = 'JJ-55, AQs-A6s, KQs-K9s, QJs-Q9s, JTs, J9s, T9s, 98s, 87s, 76s, AQo-ATo, KQo, KJo';
const SCENS = {
  'srp-BTN-BB': { spot: 'BTN contre BB, pot simple, 100 bb', title: 'que fait le bouton quand la grosse blinde check ?', actor: 'ip', oop: C.FACING.BTN.BB.call, ipr: C.RFI.BTN.range, pot: 5.5, stack: 97.5, resp: 'BB' },
  'srp-UTG-BB': { spot: 'UTG contre BB, pot simple, 100 bb', title: 'que fait UTG quand la grosse blinde check ?', actor: 'ip', oop: C.FACING.UTG.BB.call, ipr: C.RFI.UTG.range, pot: 5.5, stack: 97.5, resp: 'BB' },
  '3bp-BTN-BB': { spot: 'BB 3-bet contre BTN, pot 3-bet, 100 bb', title: 'que fait la grosse blinde (3-bettor, hors de position) au flop ?', actor: 'oop', oop: C.FACING.BTN.BB.threebet, ipr: CALL3_BTN, pot: 20.5, stack: 90, resp: 'BTN' },
};
// Les 16 scénarios du Solveur (mêmes ranges et tailles que l'onglet) : ceux qui ne sont pas définis ci-dessus sont générés.
(function addAll() {
  const ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
  const CALL3 = { UTG: 'JJ-99, AQs-AJs, KQs, AQo', HJ: 'JJ-88, AQs-ATs, KQs, KJs, QJs, JTs, AQo', CO: 'JJ-66, AQs-A9s, KQs-KTs, QJs, QTs, JTs, T9s, 98s, AQo, AJo, KQo', BTN: CALL3_BTN, SB: 'JJ-66, AQs-A8s, KQs-KTs, QJs, QTs, JTs, T9s, 98s, 87s, AQo, AJo, KQo' };
  const mk = (id, x, y, agg, ra, rb, pot, stack, spot) => { if (SCENS[id]) return; const xOOP = ORDER.indexOf(x) < ORDER.indexOf(y), [oN, oR, iN, iR] = xOOP ? [x, ra, y, rb] : [y, rb, x, ra]; const aggOOP = agg === oN; SCENS[id] = { spot, title: aggOOP ? `que fait ${agg} (agresseur, hors de position) au flop ?` : `que fait ${agg} quand ${oN} check ?`, actor: aggOOP ? 'oop' : 'ip', oop: oR, ipr: iR, pot, stack, resp: aggOOP ? iN : oN }; };
  for (const [x, y] of [['UTG', 'BB'], ['HJ', 'BB'], ['CO', 'BB'], ['BTN', 'BB'], ['SB', 'BB'], ['UTG', 'BTN'], ['HJ', 'BTN'], ['CO', 'BTN'], ['HJ', 'CO']]) {
    const o = x === 'SB' ? 3 : 2.5, inH = [x, y], pot = 2 * o + (inH.includes('SB') ? 0 : 0.5) + (inH.includes('BB') ? 0 : 1);
    mk(`srp-${x}-${y}`, x, y, x, C.RFI[x].range, C.FACING[x][y].call, pot, 100 - o, `${x} contre ${y}, pot simple, 100 bb`);
  }
  for (const [x, y] of [['BTN', 'BB'], ['BTN', 'SB'], ['CO', 'BTN'], ['CO', 'BB'], ['HJ', 'BTN'], ['UTG', 'BTN'], ['SB', 'BB']]) {
    const o = x === 'SB' ? 3 : 2.5, yIP = ORDER.indexOf(y) > ORDER.indexOf(x), size = yIP ? 3 * o : x === 'SB' ? 3 * o : 4 * o, inH = [x, y], pot = 2 * size + (inH.includes('SB') ? 0 : 0.5) + (inH.includes('BB') ? 0 : 1);
    mk(`3bp-${x}-${y}`, x, y, y, CALL3[x], C.FACING[x][y].threebet, pot, 100 - size, `${y} 3-bet contre ${x}, pot 3-bet, 100 bb`);
  }
})();
const SC = SCENS[SCID]; if (!SC) { console.error('scénario inconnu', SCID); process.exit(1); }
const ra = SC.oop, rb = SC.ipr; // index 0 = hors de position, 1 = en position
const sizes = { flop: [{ bet: SC.actor === 'oop' ? '33 75' : '', raise: '60' }, { bet: '33 75', raise: '60' }], turn: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }], river: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }] };
const CATS = ['Deux paires et mieux', 'Top paire, overpair', 'Paire moyenne ou faible', 'Tirage', 'Rien'];
const catOf = (h, board) => { const k = B.classify(h, board); return k.made <= 7 ? 0 : k.made <= 9 ? 1 : k.made <= 11 ? 2 : k.draws.some((d) => d <= 1) ? 3 : 4; };
const out = [];
// Reprise : une bibliothèque interrompue repart des flops déjà résolus.
const OUTF = path.join(__dirname, 'data/' + (LIB ? 'lib_' : 'agg_') + SCID + (SHN > 1 ? '.part' + SHK : '') + '.json');
const readLib = (f) => { if (!fs.existsSync(f)) return []; const prev = JSON.parse(fs.readFileSync(f, 'utf8')); return prev.sample === SMP.join('x') ? prev.flops : []; };
if (LIB && !ONLY) out.push(...readLib(OUTF));
// Flops déjà résolus ailleurs (fichier principal ou autres parts) : sautés, jamais recalculés.
const done = new Set(out.map((f) => f.b));
if (LIB && !ONLY) for (const f of [path.join(__dirname, 'data/lib_' + SCID + '.json'), ...fs.readdirSync(path.join(__dirname, 'data')).filter((x) => x.startsWith('lib_' + SCID + '.part')).map((x) => path.join(__dirname, 'data', x))]) if (f !== OUTF) for (const x of readLib(f)) done.add(x.b);
const t00 = Date.now();
for (const [pi, f] of pick.entries()) {
  if (pi % SHN !== SHK) continue;
  const board = f.cards.slice(), str = board.map(E.cardStr).join('');
  if (ONLY && ONLY !== '1' && str !== ONLY) continue;
  if (done.has(str)) continue;
  const g = PF.create({ board, pot: SC.pot, stack: SC.stack, ranges: [ra, rb], sizes, maxRaises: 1, sample: { turn: SMP[0], river: SMP[1] } });
  const t0 = Date.now(); let ex = null, it = 0;
  while (true) { g.iterate(1); it++; if (it % 15 === 0) { ex = g.exploitability(); if (ex.pct <= TARGET || (MAXIT ? it >= MAXIT : (Date.now() - t0) / 1000 > MAXS)) break; } }
  // Nœud étudié : le joueur en position après le check (pot simple), ou le premier à parler (3-bettor hors de position).
  const root = g.info([]), ck = root.node.acts.findIndex((a) => a.k === 'x');
  const path1 = SC.actor === 'ip' ? [ck] : [];
  const n1 = g.info(path1), labels = n1.node.acts.map((_, a) => g.label(n1.node, a));
  const p = n1.node.p, H = g.hands[p], n = H.length, sg = n1.strategy, reach = n1.reach[p];
  const byCat = CATS.map(() => ({ w: 0, bet: 0 }));
  for (let i = 0; i < n; i++) { const c = catOf([H[i][0], H[i][1]], board), w = reach[i]; byCat[c].w += w; let b = 0; for (let a = 0; a < labels.length; a++) if (n1.node.acts[a].k !== 'x') b += sg[a * n + i]; byCat[c].bet += w * b; }
  const tw = byCat.reduce((a, x) => a + x.w, 0);
  // réponse de BB à la petite mise
  const small = n1.node.acts.findIndex((a) => a.k !== 'x');
  const n2 = g.info([...path1, small]), l2 = n2.node.acts.map((_, a) => g.label(n2.node, a));
  out.push({ b: str, w: f.gw, t: f.tags, act: labels, f: n1.freq.map((x) => +x.toFixed(3)), eq: +n1.eqMean[p].toFixed(3), ev: +((n1.evMean[p]) / SC.pot).toFixed(3),
    cat: byCat.map((x) => [+(x.w / tw).toFixed(3), x.w > 0 ? +(x.bet / x.w).toFixed(3) : null]), bb: { act: l2, f: n2.freq.map((x) => +x.toFixed(3)) }, ex: +ex.pct.toFixed(2), it, s: Math.round((Date.now() - t0) / 1000), ...(LIB ? { lib: { n1: classStrat(g, n1), n2: classStrat(g, n2) } } : {}) });
  console.log(out.length + '/' + pick.length, str, labels.join('/'), n1.freq.map((x) => (x * 100).toFixed(0)).join('/'), 'expl', ex.pct.toFixed(2) + '%', it + ' it', Math.round((Date.now() - t0) / 1000) + ' s');
  if (ONLY === '1') break;
  if (!ONLY) { fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true }); fs.writeFileSync(OUTF, JSON.stringify({ id: SCID, spot: SC.spot, title: SC.title, actor: SC.actor, resp: SC.resp, cats: CATS, flops: out, total: flops.length, sample: SMP.join('x'), built: new Date().toISOString().slice(0, 10) })); if (!LIB) assemble(); else if (SHN === 1) assembleLib(); }
}
console.log('total', Math.round((Date.now() - t00) / 1000), 's');

// Assemble src/aggregate_data.js : un scénario par fichier tools/data/agg_*.json (le scénario historique est repris du fichier existant).
function assemble() {
  const dir = path.join(__dirname, 'data'), list = [];
  const order = Object.keys(SCENS);
  for (const id of order) { const f = path.join(dir, 'agg_' + id + '.json'); if (fs.existsSync(f)) list.push(JSON.parse(fs.readFileSync(f, 'utf8'))); }
  const out = path.join(__dirname, '../src/aggregate_data.js');
  if (!list.some((x) => x.id === 'srp-BTN-BB') && fs.existsSync(out)) {
    delete require.cache[require.resolve(out)]; const old = require(out);
    const base = old.scenarios ? old.scenarios.find((x) => x.id === 'srp-BTN-BB') : { id: 'srp-BTN-BB', spot: old.spot, title: SCENS['srp-BTN-BB'].title, actor: 'ip', resp: 'BB', cats: old.cats, flops: old.flops, total: old.total, built: old.built };
    if (base) list.unshift(base);
  }
  list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const D = { ...list[0], scenarios: list };
  fs.writeFileSync(out, '// Généré par tools/build_aggregate.js : rapports agrégés (flop 33 % / 75 %, turn et river simplifiés à 75 %).\n(function (root) { const D = ' + JSON.stringify(D) + ";\n  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.AggregateData = D; })(typeof window !== 'undefined' ? window : globalThis);\n");
}
// Bibliothèque : stratégies par classe de mains (nœud étudié et réponse à la petite mise) ; le rapport agrégé est reconstruit avec ces solves plus précis.
// Fusionne les parts (lib_<scénario>.part<k>.json) dans lib_<scénario>.json, sans doublon, puis les supprime.
function mergeParts() {
  const dir = path.join(__dirname, 'data');
  for (const id of Object.keys(SCENS)) {
    const parts = fs.readdirSync(dir).filter((x) => x.startsWith('lib_' + id + '.part') && x.endsWith('.json')); if (!parts.length) continue;
    const main = path.join(dir, 'lib_' + id + '.json'), base = fs.existsSync(main) ? JSON.parse(fs.readFileSync(main, 'utf8')) : null, seen = new Set(), flops = [];
    let meta = base;
    for (const f of [main, ...parts.map((x) => path.join(dir, x))]) { if (!fs.existsSync(f)) continue; const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (!meta) meta = j; if (j.sample !== meta.sample) continue; for (const x of j.flops) if (!seen.has(x.b)) { seen.add(x.b); flops.push(x); } }
    fs.writeFileSync(main, JSON.stringify({ ...meta, flops, built: new Date().toISOString().slice(0, 10) }));
    for (const x of parts) fs.unlinkSync(path.join(dir, x));
    console.log('fusion', id, flops.length, 'flops');
  }
}
function assembleLib() {
  mergeParts();
  const dir = path.join(__dirname, 'data'), list = [];
  // Un scénario n'entre dans la bibliothèque qu'à partir de 15 flops (l'ordre tourniquet couvre alors chaque grande famille de texture).
  for (const id of Object.keys(SCENS)) { const f = path.join(dir, 'lib_' + id + '.json'); if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.flops.length >= 15) list.push(j); } }
  const L = { alph: ALPH, scenarios: list.map((x) => ({ id: x.id, sample: x.sample, actor: x.actor, flops: x.flops.map((f) => ({ b: f.b, ex: f.ex, n1: f.lib.n1, n2: f.lib.n2 })) })) };
  fs.writeFileSync(path.join(__dirname, '../src/flop_library.js'), '// Généré par tools/build_aggregate.js : bibliothèque de flops résolus hors ligne (stratégies par classe de mains).\n(function (root) { const L = ' + JSON.stringify(L) + ";\n  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.FlopLibrary = L; })(typeof window !== 'undefined' ? window : globalThis);\n");
  // Rapport agrégé reconstruit à partir des solves de la bibliothèque (mêmes champs, précision supérieure).
  if (ONLY !== 'assemblelib') return; // le rapport agrégé n'est reconstruit qu'une fois la bibliothèque complète
  for (const x of list) { const y = { ...x, flops: x.flops.map(({ lib, ...r }) => r) }; fs.writeFileSync(path.join(dir, 'agg_' + x.id + '.json'), JSON.stringify(y)); }
  assemble();
}
if (ONLY === 'assemble') assemble();
if (ONLY === 'assemblelib') assembleLib();
if (ONLY === 'merge') mergeParts();
