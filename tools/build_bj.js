// Précalcule les données blackjack de SIGMA 52 (src/bj_data.js) avec le moteur exact src/bj_engine.js.
// Pour chaque jeu de règles prédéfini : tableau de stratégie de base avec l'EV de chaque action, avantage de la maison,
// indices de déviation Hi-Lo calculés, indice d'assurance, avantage du joueur par true count. Puis le coût de chaque règle.
// Usage : node tools/build_bj.js   (quelques minutes)
const fs = require('fs'), path = require('path');
const BJ = require('../src/bj_engine.js');
const r4 = (x) => Math.round(x * 1e4) / 1e4;

// Déviations candidates : ligne, carte du croupier, action A, action B. Illustrious 18, Fab 4 (abandons) et quelques doubles.
const CAND = [
  ['h16', 10, 'hit', 'stand'], ['h15', 10, 'hit', 'stand'], ['p10', 5, 'stand', 'split'], ['p10', 6, 'stand', 'split'], ['h10', 10, 'hit', 'double'],
  ['h12', 3, 'hit', 'stand'], ['h12', 2, 'hit', 'stand'], ['h11', 1, 'hit', 'double'], ['h9', 2, 'hit', 'double'], ['h10', 1, 'hit', 'double'],
  ['h9', 7, 'hit', 'double'], ['h16', 9, 'hit', 'stand'], ['h13', 2, 'hit', 'stand'], ['h12', 4, 'hit', 'stand'], ['h12', 5, 'hit', 'stand'],
  ['h12', 6, 'hit', 'stand'], ['h13', 3, 'hit', 'stand'],
  ['h14', 10, 'hit', 'surrender'], ['h15', 10, 'hit', 'surrender'], ['h15', 9, 'hit', 'surrender'], ['h15', 1, 'hit', 'surrender'],
  ['h8', 5, 'hit', 'double'], ['h8', 6, 'hit', 'double'], ['s8', 4, 'stand', 'double'], ['s8', 5, 'stand', 'double'], ['s8', 6, 'stand', 'double'],
  ['s9', 6, 'stand', 'double'], ['h11', 10, 'hit', 'double'], ['h10', 9, 'hit', 'double'], ['h9', 3, 'hit', 'double'], ['p9', 7, 'stand', 'split'],
  ['h16', 1, 'hit', 'stand'], ['h14', 10, 'hit', 'stand'],
];
// Catégorie de chaque candidat selon sa position dans la liste : 17 premiers = Illustrious 18 (le 18e est l'assurance), 4 suivants = Fab 4.
const catOf = (i) => (i < 17 ? 'I18' : i < 21 ? 'Fab4' : 'plus');

function indices(rules) {
  const dl = Math.max(1, rules.decks / 2), out = [];
  for (const [i, [row, up, A, B]] of CAND.entries()) {
    const x = BJ.indexFor(rules, row, up, A, B, { decksLeft: dl, lo: -8, hi: 10 });
    if (x.index === null) continue;
    const at0 = x.pts.find((p) => p[0] === 0)[1], basicB = at0 > 0, idx = Math.round(x.index);
    if (idx < -6 || idx > 8) continue;
    // rising : B devient meilleure quand le compte monte.
    let act, dir;
    if (x.rising) { if (basicB) { act = A; dir = -1; } else { act = B; dir = 1; } }
    else { if (basicB) { act = A; dir = 1; } else { act = B; dir = -1; } }
    const basic = act === A ? B : A;
    out.push({ row, up, act, basic, dir, index: idx, exact: Math.round(x.index * 100) / 100, set: catOf(i) });
  }
  return out;
}

function edgeByTC(rules, insIdx) {
  const dl = Math.max(1, rules.decks / 2), out = [];
  for (let tc = -4; tc <= 8; tc++) {
    const s = BJ.shoeAtTC(dl, tc), st = BJ.strategy(rules, { shoe: s, fast: true });
    let e = -BJ.houseEdge(rules, { strat: st, shoe: s, optimal: true });
    // Assurance prise quand elle est rentable (as visible : probabilité 1/13 environ).
    const ins = BJ.insuranceEV(s); if (insIdx !== null && tc >= insIdx && ins > 0) e += (s[1] / BJ.total(s)) * ins;
    out.push([tc, r4(e)]);
  }
  return out;
}

function presetData(key, P) {
  const t0 = Date.now(), rules = BJ.R(P.r), st = BJ.strategy(rules), edge = BJ.houseEdge(rules, { strat: st });
  const table = {};
  for (const row of BJ.ROWS) { table[row.id] = {}; for (const up of BJ.UPS) { const c = st.table[row.id][up]; table[row.id][up] = { c: c.code, o: c.order, ev: Object.fromEntries(Object.entries(c.ev).map(([k, v]) => [k, r4(v)])) }; } }
  const ins = BJ.insuranceIndex(Math.max(1, rules.decks / 2)), insIdx = ins === null ? null : Math.round(ins);
  const idx = indices(rules), tcs = edgeByTC(rules, insIdx);
  console.log(key, 'edge', (edge * 100).toFixed(3), '%', idx.length, 'indices', ((Date.now() - t0) / 1000).toFixed(1), 's');
  return { label: P.label, note: P.note, rules, edge: r4(edge), table, indices: idx, insurance: { exact: ins, index: insIdx }, edgeByTC: tcs };
}

const out = { built: new Date().toISOString().slice(0, 10), presets: {}, ruleCosts: null };
for (const [k, P] of Object.entries(BJ.PRESETS)) out.presets[k] = presetData(k, P);

// Coût de chaque règle par rapport au sabot de 6 jeux « Strip » (positif = la règle coûte au joueur).
const baseR = BJ.R(BJ.PRESETS.strip.r), baseE = out.presets.strip.edge;
const VAR = [
  ['Croupier tire sur soft 17', { h17: true }], ['Pas de double après split', { das: false }], ['Double sur 9, 10, 11 seulement', { double: '9-11' }],
  ['Double sur 10, 11 seulement', { double: '10-11' }], ['Pas de re-split (2 mains max)', { maxHands: 2 }], ['Re-split des as autorisé', { rsa: true }],
  ['Pas d\'abandon', { surrender: false }], ['Sans carte cachée (européen), toutes mises perdues, sans abandon', { peek: false, surrender: false }],
  ['Sans carte cachée, mise initiale seule perdue (OBO), sans abandon', { peek: false, obo: true, surrender: false }], ['Blackjack payé 6:5', { bj: 1.2 }],
  ['1 jeu', { decks: 1 }], ['2 jeux', { decks: 2 }], ['4 jeux', { decks: 4 }], ['8 jeux', { decks: 8 }],
];
out.ruleCosts = { base: BJ.PRESETS.strip.label, baseEdge: baseE, rows: [] };
for (const [label, ch] of VAR) {
  const r = Object.assign({}, baseR, ch), e = BJ.houseEdge(r);
  out.ruleCosts.rows.push([label, r4(e - baseE)]); console.log('règle', label, ((e - baseE) * 100).toFixed(3));
}
const js = '// Généré par tools/build_bj.js le ' + out.built + ' : ne pas modifier à la main.\n(function (root) {\n  const D = ' + JSON.stringify(out) + ';\n  if (typeof module !== \'undefined\' && module.exports) module.exports = D; else root.BJDATA = D;\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'bj_data.js'), js);
console.log('src/bj_data.js', js.length, 'octets');
