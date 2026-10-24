// Banque de quiz en mains complètes : flop résolu (approché, turn et river à 75 %), ligne jouée selon l'équilibre,
// et à chaque décision une ou deux mains tirées parmi celles qui arrivent réellement à ce nœud. On garde les décisions nettes :
// écart d'EV entre la meilleure et la pire action d'au moins 3 % du pot et meilleure action jouée au moins 50 % du temps.
// Usage : node tools/build_handquiz.js N graine sortie.json   puis   node tools/build_handquiz.js merge a.json b.json ...
const PF = require('../src/postflop.js'), E = require('../src/engine.js'), C = require('../src/charts.js');
const fs = require('fs'), path = require('path');
if (process.argv[2] === 'merge') {
  const all = process.argv.slice(3).flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
  const seen = new Set(), out = all.filter((q) => { const k = q.b + q.h + q.l; if (seen.has(k)) return false; seen.add(k); return true; });
  fs.writeFileSync(path.join(__dirname, '../src/handquiz_data.js'), `// Généré par tools/build_handquiz.js : ${out.length} quiz en mains complètes corrigés par le solveur. Ne pas éditer à la main.\n(function (root) { const Q = ${JSON.stringify(out)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = Q; else root.HandQuiz = Q; })(typeof window !== 'undefined' ? window : globalThis);\n`);
  console.log('banque', out.length, 'quiz'); process.exit(0);
}
const N = +process.argv[2] || 50, seed = +process.argv[3] || 7, OUT = process.argv[4] || 'handquiz.json';
const R = E.rng(seed);
const ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
const CALL3 = { BTN: 'JJ-55, AQs-A6s, KQs-K9s, QJs-Q9s, JTs, J9s, T9s, 98s, 87s, 76s, AQo-ATo, KQo, KJo', CO: 'JJ-66, AQs-A9s, KQs-KTs, QJs, QTs, JTs, T9s, 98s, AQo, AJo, KQo' };
const SC = [
  { label: 'BTN ouvre, BB paie', a: 'BTN', b: 'BB', ra: C.RFI.BTN.range, rb: C.FACING.BTN.BB.call, pot: 5.5, stack: 97.5, agg: 'BTN', w: 4 },
  { label: 'CO ouvre, BB paie', a: 'CO', b: 'BB', ra: C.RFI.CO.range, rb: C.FACING.CO.BB.call, pot: 5.5, stack: 97.5, agg: 'CO', w: 2 },
  { label: 'UTG ouvre, BB paie', a: 'UTG', b: 'BB', ra: C.RFI.UTG.range, rb: C.FACING.UTG.BB.call, pot: 5.5, stack: 97.5, agg: 'UTG', w: 1 },
  { label: 'SB ouvre, BB paie', a: 'SB', b: 'BB', ra: C.RFI.SB.range, rb: C.FACING.SB.BB.call, pot: 6, stack: 97, agg: 'SB', w: 2 },
  { label: 'CO ouvre, BTN paie', a: 'CO', b: 'BTN', ra: C.RFI.CO.range, rb: C.FACING.CO.BTN.call, pot: 6.5, stack: 97.5, agg: 'CO', w: 2 },
  { label: 'BTN ouvre, BB 3-bet, BTN paie', a: 'BTN', b: 'BB', ra: CALL3.BTN, rb: C.FACING.BTN.BB.threebet, pot: 20.5, stack: 90, agg: 'BB', w: 1 },
  { label: 'CO ouvre, BTN 3-bet, CO paie', a: 'CO', b: 'BTN', ra: CALL3.CO, rb: C.FACING.CO.BTN.threebet, pot: 16.5, stack: 92.5, agg: 'BTN', w: 1 },
];
const pickW = (items, w) => { const t = w.reduce((a, b) => a + b, 0); let x = R() * t; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; };
const seatsOf = (sc) => (ORDER.indexOf(sc.a) < ORDER.indexOf(sc.b) ? [[sc.a, sc.ra], [sc.b, sc.rb]] : [[sc.b, sc.rb], [sc.a, sc.ra]]);
const r2 = (x) => Math.round(x * 100) / 100;
const out = [];
const t0 = Date.now();
while (out.length < N) {
  const sc = pickW(SC, SC.map((s) => s.w)), [o, i] = seatsOf(sc), names = [o[0], i[0]], agg = sc.agg === o[0] ? 0 : 1;
  const deck = []; for (let c = 0; c < 52; c++) deck.push(c);
  for (let k = 51; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [deck[k], deck[j]] = [deck[j], deck[k]]; }
  const board = deck.slice(0, 5);
  const sz = (st, p) => (st === 'flop' ? { bet: p === agg ? '33' : p === 1 ? '50' : '', raise: '60' } : { bet: '75', raise: '60' });
  const sizes = {}; for (const st of ['flop', 'turn', 'river']) sizes[st] = [0, 1].map((p) => sz(st, p));
  let g;
  try { g = PF.create({ board: board.slice(0, 3), pot: sc.pot, stack: sc.stack, ranges: [o[1], i[1]], sizes, maxRaises: 1, sample: { turn: 8, river: 6 }, include: board.slice(3) }); } catch (e) { continue; }
  for (let it = 1; it <= 300; it++) { g.iterate(1); if (it % 20 === 0 && g.exploitability().pct <= 1) break; }
  const pathA = [], line = []; let got = 0;
  for (let step = 0; step < 14 && got < 8; step++) {
    const r = g.info(pathA), node = r.node;
    if (node.t === PF.CHANCE) { const c = board[node.board.length]; if (!node.cards.includes(c)) break; pathA.push(c); line.push(`${node.board.length === 3 ? 'Turn' : 'River'} ${E.cardStr(c)}`); continue; }
    if (node.t !== PF.ACT) break;
    const p = node.p, n = g.N[p], A = node.acts.length;
    // Une ou deux mains réellement présentes à ce nœud (tirées selon leur fréquence d'arrivée).
    const idx = []; for (let k = 0; k < n; k++) if (r.reach[p][k] > 1e-3) idx.push(k);
    for (let tries = 0, kept = 0; tries < 6 && kept < 2 && idx.length; tries++) {
      const k = pickW(idx, idx.map((x) => r.reach[p][x]));
      const ev = r.actEv.map((v) => v[k]), st = node.acts.map((_, a) => r.strategy[a * n + k]);
      if (ev.some((x) => !Number.isFinite(x))) continue;
      const best = ev.indexOf(Math.max(...ev)), spread = (Math.max(...ev) - Math.min(...ev)) / r.pot;
      if (spread < 0.03 || st[best] < 0.5 || A < 2) continue;
      const [a, b] = g.hands[p][k];
      out.push({ s: sc.label, n: names, p, h: E.cardStr(a) + E.cardStr(b), b: node.board.map(E.cardStr).join(''), l: line.join(' · '), pot: r2(r.pot), st: r2(g.S - node.C[p]), o: node.acts.map((_, x) => g.label(node, x)), e: ev.map((x) => Math.round(x * 1000) / 1000), f: st.map(r2) });
      kept++; got++;
    }
    // Ligne suivante : action tirée selon les fréquences globales, sans fold (pour continuer la main).
    const ok = node.acts.map((_, x) => x).filter((x) => node.acts[x].k !== 'f');
    const a = pickW(ok, ok.map((x) => r.freq[x] + 1e-6));
    line.push(`${names[p]} : ${g.label(node, a)}`); pathA.push(a);
  }
  process.stdout.write(`\r${out.length}/${N} quiz · ${Math.round((Date.now() - t0) / 1000)} s`);
  fs.writeFileSync(OUT, JSON.stringify(out));
}
console.log('\nfini', out.length);
