// Génère les spots de l'entraîneur river : flop résolu (approché) -> ligne jouée selon l'équilibre -> turn re-résolu exactement
// -> ligne -> river choisie au hasard. Sortie : src/trainer_spots.js (ranges compressées, 1 caractère base64 par combo, poids sur 63).
// Usage : node tools/build_trainer.js 30   (≈ 20 s par spot)
const PF = require('../src/postflop.js'), E = require('../src/engine.js'), C = require('../src/charts.js');
const fs = require('fs');
const N = +process.argv[2] || 30, seed = +process.argv[3] || 52;
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
const pickW = (items, w) => { let t = w.reduce((a, b) => a + b, 0), x = R() * t; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; };
const seatsOf = (sc) => (ORDER.indexOf(sc.a) < ORDER.indexOf(sc.b) ? [[sc.a, sc.ra], [sc.b, sc.rb]] : [[sc.b, sc.rb], [sc.a, sc.ra]]);
const STREET_FR = { 3: 'Flop', 4: 'Turn' };
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const cidx = (a, b) => { if (a < b) [a, b] = [b, a]; return a * (a - 1) / 2 + b; };
function enc(g, p, reach) {
  const out = new Array(1326).fill('A'), mx = Math.max(...reach);
  g.hands[p].forEach(([a, b], i) => { const q = Math.round(reach[i] / mx * 63); out[cidx(a, b)] = B64[q]; });
  return out.join('');
}
// Joue une rue en suivant les fréquences agrégées de l'équilibre, sans fold. Retourne le chemin et le texte.
function playStreet(g, path, names) {
  const txt = [];
  for (let k = 0; k < 8; k++) {
    const r = g.info(path), node = r.node;
    if (node.t !== PF.ACT) break;
    const ok = node.acts.map((a, i) => i).filter((i) => node.acts[i].k !== 'f');
    const i = pickW(ok, ok.map((i) => (r.freq[i] + 1e-6) * (node.acts[i].k === 'x' ? 0.6 : 1)));
    txt.push(`${names[node.p]} ${g.label(node, i).toLowerCase()}`); path.push(i);
    const nx = g.info(path).node; if (nx.t !== PF.ACT) return { path, txt, node: nx };
  }
  return { path, txt, node: g.info(path).node };
}
function solve(g, target, max) { let ex = 100; for (let k = 0; k < max / 10 && ex > target; k++) { g.iterate(10); ex = g.exploitability().pct; } return ex; }
const spots = [];
const flopSizes = (agg) => ({ flop: [0, 1].map((p) => ({ bet: p === agg ? [33, 75] : p === 1 ? [50] : [], raise: [60] })), turn: [0, 1].map(() => ({ bet: [75], raise: [] })), river: [0, 1].map(() => ({ bet: [75], raise: [] })) });
const turnSizes = (agg) => ({ turn: [0, 1].map((p) => ({ bet: p === agg ? [50, 100] : [66], raise: [60] })), river: [0, 1].map((p) => ({ bet: p === agg ? [50, 100] : [66], raise: [60] })) });
let tries = 0;
while (spots.length < N && tries++ < N * 3) {
  const t0 = Date.now();
  const sc = pickW(SC, SC.map((s) => s.w)), [o, i] = seatsOf(sc), names = [o[0], i[0]], agg = sc.agg === o[0] ? 0 : 1;
  const deck = [...Array(52).keys()]; for (let k = 51; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [deck[k], deck[j]] = [deck[j], deck[k]]; }
  const flop = deck.slice(0, 3);
  const g1 = PF.create({ board: flop, pot: sc.pot, stack: sc.stack, ranges: [o[1], i[1]], sizes: flopSizes(agg), maxRaises: 1, sample: { turn: 8, river: 6 } });
  solve(g1, 1.5, 120);
  const l1 = playStreet(g1, [], names); if (l1.node.t !== PF.CHANCE) continue;
  const turn = l1.node.cards[Math.floor(R() * l1.node.cards.length)]; l1.path.push(turn);
  const r1 = g1.info(l1.path), n1 = r1.node; if (n1.t !== PF.ACT) continue;
  const arr = (g, r, p) => { const mx = Math.max(...r.reach[p]); return g.hands[p].map(([a, b], k) => [a, b, r.reach[p][k] / mx]).filter((x) => x[2] > 0.01); };
  const pot2 = r1.pot, st2 = sc.stack - n1.C[0];
  if (st2 < 4) continue;
  const g2 = PF.create({ board: n1.board, pot: pot2, stack: st2, ranges: [arr(g1, r1, 0), arr(g1, r1, 1)], sizes: turnSizes(agg), maxRaises: 2 });
  solve(g2, 0.6, 200);
  const l2 = playStreet(g2, [], names); if (l2.node.t !== PF.CHANCE) continue;
  const river = l2.node.cards[Math.floor(R() * l2.node.cards.length)]; l2.path.push(river);
  const r2 = g2.info(l2.path), n2 = r2.node; if (n2.t !== PF.ACT) continue;
  const st3 = st2 - n2.C[0]; if (st3 < 2) continue;
  spots.push({ sc: sc.label, names, agg, line: [`Flop ${flop.map(E.cardStr).join(' ')} : ${l1.txt.join(', ')}`, `Turn ${E.cardStr(turn)} : ${l2.txt.join(', ')}`].join(' · '),
    board: [...flop, turn, river].map(E.cardStr).join(''), pot: +r2.pot.toFixed(2), stack: +st3.toFixed(2), r: [enc(g2, 0, r2.reach[0]), enc(g2, 1, r2.reach[1])] });
  console.log(spots.length, sc.label, spots[spots.length - 1].board, spots[spots.length - 1].line, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
}
const js = `// Spots de l'entraîneur river, générés par tools/build_trainer.js (flop approché -> turn exact -> river). Ne pas éditer à la main.
(function (root) {
  const SPOTS = ${JSON.stringify(spots)};
  const B64 = '${B64}';
  // Décode une range : 1326 caractères, un par combo (index c1*(c1-1)/2+c2, c1>c2), poids sur 63.
  function decode(s) { const out = []; let k = 0; for (let a = 1; a < 52; a++) for (let b = 0; b < a; b++) { const q = B64.indexOf(s[k++]); if (q > 0) out.push([a, b, q / 63]); } return out; }
  const api = { SPOTS, decode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TrainerSpots = api;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(__dirname + '/../src/trainer_spots.js', js);
console.log('écrit', spots.length, 'spots,', js.length, 'octets');
