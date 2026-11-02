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

// Mode « systems » : ne recalcule que la partie systèmes de comptage et la fusionne aux données existantes.
const ONLY_SYS = process.argv[2] === 'systems';
const out = ONLY_SYS ? require('../src/bj_data.js') : { built: new Date().toISOString().slice(0, 10), presets: {}, ruleCosts: null };
out.built = new Date().toISOString().slice(0, 10);
if (!ONLY_SYS) for (const [k, P] of Object.entries(BJ.PRESETS)) out.presets[k] = presetData(k, P);

// Coût de chaque règle par rapport au sabot de 6 jeux « Strip » (positif = la règle coûte au joueur).
const baseR = BJ.R(BJ.PRESETS.strip.r), baseE = out.presets.strip.edge;
const VAR = [
  ['Croupier tire sur soft 17', { h17: true }], ['Pas de double après split', { das: false }], ['Double sur 9, 10, 11 seulement', { double: '9-11' }],
  ['Double sur 10, 11 seulement', { double: '10-11' }], ['Pas de re-split (2 mains max)', { maxHands: 2 }], ['Re-split des as autorisé', { rsa: true }],
  ['Pas d\'abandon', { surrender: false }], ['Sans carte cachée (européen), toutes mises perdues, sans abandon', { peek: false, surrender: false }],
  ['Sans carte cachée, mise initiale seule perdue (OBO), sans abandon', { peek: false, obo: true, surrender: false }], ['Blackjack payé 6:5', { bj: 1.2 }],
  ['1 jeu', { decks: 1 }], ['2 jeux', { decks: 2 }], ['4 jeux', { decks: 4 }], ['8 jeux', { decks: 8 }],
];
if (!ONLY_SYS) {
  out.ruleCosts = { base: BJ.PRESETS.strip.label, baseEdge: baseE, rows: [] };
  for (const [label, ch] of VAR) {
    const r = Object.assign({}, baseR, ch), e = BJ.houseEdge(r);
    out.ruleCosts.rows.push([label, r4(e - baseE)]); console.log('règle', label, ((e - baseE) * 100).toFixed(3));
  }
}

// ---------- Systèmes de comptage ----------
// Pour les jeux « europe » et « strip » : effets de retrait (EOR, un paquet), EOR de chaque décision d'indice, corrélations
// de chaque système (BC, IC, efficacité de jeu), indices et assurance par système équilibré, avantage par true count,
// et simulation de comparaison à rampe identique (mise proportionnelle à l'avantage estimé, 1 à 12 unités, sans indices).
const CT = require('../src/bj_counts.js');
function eors(rules) {
  const r1 = Object.assign({}, rules, { decks: 1 }), full = BJ.shoeOf(1);
  const edgeOf = (sh) => -BJ.houseEdge(r1, { strat: BJ.strategy(r1, { shoe: sh }), shoe: sh, optimal: true });
  const e0 = edgeOf(full), e = [0];
  for (let r = 1; r <= 10; r++) { const sh = full.slice(); sh[r] -= 1; e.push(r4(edgeOf(sh) - e0)); }
  const dec = [];
  for (const [i, [row, up, A, B]] of CAND.entries()) {
    if (i >= 21) break;
    const g = (sh) => { const calc = BJ.Calc(r1, sh); const ev = BJ.rowEV(calc, sh, BJ.ROWS.find((x) => x.id === row), up); return ev[A] !== undefined && ev[B] !== undefined ? ev[B] - ev[A] : null; };
    const g0 = g(full); if (g0 === null) continue;
    const v = [0]; for (let r = 1; r <= 10; r++) { const sh = full.slice(); sh[r] -= 1; v.push(r4(g(sh) - g0)); }
    dec.push({ row, up, A, B, eor: v });
  }
  return { edge0: r4(e0), eor: e, dec };
}
const scaleOf = (t) => { let a = 0, b = 0; for (let r = 1; r <= 10; r++) { a += CT.W[r] * t[r] ** 2; b += CT.W[r] * BJ.HILO[r] ** 2; } let m = 0; for (let r = 1; r <= 10; r++) m += CT.W[r] * t[r]; m /= 52; a -= 52 * m * m; return Math.sqrt(a / b); };
function sysData(key, rules) {
  const t0 = Date.now(), E = eors(rules), dl = Math.max(1, rules.decks / 2), res = {};
  const st = BJ.strategy(rules), table = Object.fromEntries(Object.entries(st.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.order }]))]));
  const P = out.presets[key];
  for (const S of CT.SYSTEMS) {
    const t = S.t, sc = scaleOf(t), r = { bc: r4(CT.bc(t, E.eor)), ic: r4(CT.ic(t)), pe: r4(CT.pe(t, E.dec)), scale: Math.round(sc * 100) / 100 };
    if (S.ace) { const a = CT.bcAce(t, E.eor); r.bcAce = r4(a.bc); r.aceVal = a.v; }
    // Avantage par true count du système (sabot moyen à mi-sabot, jeu optimal, assurance quand rentable).
    const step = Math.max(1, Math.round(sc)), tcs = [];
    for (let k = -4; k <= 8; k++) {
      const tc = k * step, sh = BJ.shoeAtTC(dl, tc, t), s2 = BJ.strategy(rules, { shoe: sh, fast: true });
      let e = -BJ.houseEdge(rules, { strat: s2, shoe: sh, optimal: true }); const ins = BJ.insuranceEV(sh); if (ins > 0) e += (sh[1] / BJ.total(sh)) * ins;
      tcs.push([tc, r4(e)]);
    }
    r.edgeByTC = tcs;
    if (S.balanced && S.id !== 'tencount' && S.id !== 'acefive') {
      const ins = BJ.insuranceIndex(dl, t); r.insurance = { exact: ins, index: ins === null ? null : Math.round(ins) };
      r.indices = [];
      for (const [i, [row, up, A, B]] of CAND.entries()) {
        if (i >= 21) break;
        const x = BJ.indexFor(rules, row, up, A, B, { decksLeft: dl, lo: -8 * step, hi: 10 * step, step, tags: t, fast: S.id !== 'hilo' });
        if (x.index === null) continue;
        const at0 = x.pts.find((p) => p[0] === 0)[1], basicB = at0 > 0, idx = Math.round(x.index);
        let act, dir; if (x.rising) { if (basicB) { act = A; dir = -1; } else { act = B; dir = 1; } } else { if (basicB) { act = A; dir = 1; } else { act = B; dir = -1; } }
        r.indices.push({ row, up, act, basic: act === A ? B : A, dir, index: idx, exact: Math.round(x.index * 100) / 100, set: catOf(i) });
      }
    }
    // Simulation de comparaison.
    const adv = (tc) => { if (tc <= tcs[0][0]) return tcs[0][1]; for (let k = 1; k < tcs.length; k++) if (tc <= tcs[k][0]) { const [a, ea] = tcs[k - 1], [b, eb] = tcs[k]; return ea + (eb - ea) * (tc - a) / (b - a); } return tcs[tcs.length - 1][1]; };
    const ramp = (tc) => Math.max(1, Math.min(12, Math.round(adv(tc) * 1000)));
    const cardTag = (c) => CT.tagOfCard(S, ((c % 13) << 2) | (Math.floor(c / 13) % 4));
    let u = 0, bsum = 0, s2sum = 0, n = 0;
    for (let k = 0; k < 4; k++) { const sim = BJ.simulate({ rules, table, hands: 1500000, seed: 7000 + k, pen: 0.75, others: 2, ramp, rampRaw: true, cardTag, imb: S.imb }); u += sim.units; bsum += sim.avgBet * sim.hands; n += sim.hands; for (let i = 0; i < sim.res.length; i++) s2sum += sim.res[i] * sim.res[i]; }
    const mu = u / n, sd = Math.sqrt(s2sum / n - mu * mu);
    r.sim = { mu: Math.round(mu * 1e5) / 1e5, sd: Math.round(sd * 1e4) / 1e4, avgBet: Math.round(bsum / n * 1000) / 1000, hands: n };
    res[S.id] = r;
    console.log(key, S.id, 'BC', r.bc, 'IC', r.ic, 'PE~', r.pe, 'u/100', (mu * 100).toFixed(2), 'sd', sd.toFixed(2), r.indices ? r.indices.length + ' indices' : '', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  }
  // Hi-Lo avec indices et assurance : valeur ajoutée des déviations.
  const S = CT.byId.hilo, tcs = res.hilo.edgeByTC, adv = (tc) => { if (tc <= tcs[0][0]) return tcs[0][1]; for (let k = 1; k < tcs.length; k++) if (tc <= tcs[k][0]) { const [a, ea] = tcs[k - 1], [b, eb] = tcs[k]; return ea + (eb - ea) * (tc - a) / (b - a); } return tcs[tcs.length - 1][1]; };
  let u = 0, bsum = 0, s2sum = 0, n = 0;
  for (let k = 0; k < 4; k++) { const sim = BJ.simulate({ rules, table, hands: 1500000, seed: 7000 + k, pen: 0.75, others: 2, ramp: (tc) => Math.max(1, Math.min(12, Math.round(adv(tc) * 1000))), rampRaw: true, devs: P.indices, useIndices: true, insIndex: P.insurance.index }); u += sim.units; bsum += sim.avgBet * sim.hands; n += sim.hands; for (let i = 0; i < sim.res.length; i++) s2sum += sim.res[i] * sim.res[i]; }
  const mu = u / n; res.hiloIdx = { sim: { mu: Math.round(mu * 1e5) / 1e5, sd: Math.round(Math.sqrt(s2sum / n - mu * mu) * 1e4) / 1e4, avgBet: Math.round(bsum / n * 1000) / 1000, hands: n } };
  void S;
  return { eor: E, systems: res };
}
out.counts = {};
for (const key of ['europe', 'strip']) out.counts[key] = sysData(key, out.presets[key].rules);
const js = '// Généré par tools/build_bj.js le ' + out.built + ' : ne pas modifier à la main.\n(function (root) {\n  const D = ' + JSON.stringify(out) + ';\n  if (typeof module !== \'undefined\' && module.exports) module.exports = D; else root.BJDATA = D;\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'bj_data.js'), js);
console.log('src/bj_data.js', js.length, 'octets');
