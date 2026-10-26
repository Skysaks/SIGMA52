// Validation externe : compare le solveur postflop de SIGMA 52 à TexasSolver (open source, AGPL v3, usage personnel)
// sur 20 spots (14 rivers, 6 turns), mêmes ranges, mêmes tailles, même précision visée.
// Usage : node tools/compare_texassolver.js <chemin de console_solver> <dossier de travail>
// Écrit tools/data/validation_texassolver.json (le binaire n'est pas fourni : compiler la branche « console » du dépôt).
const E = require('../src/engine.js'), C = require('../src/charts.js'), PF = require('../src/postflop.js');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const BIN = process.argv[2], WD = process.argv[3] || '/tmp/ts-compare';
if (!BIN) { console.error('chemin du binaire console_solver manquant'); process.exit(1); }
fs.mkdirSync(WD, { recursive: true });
const classes = (r) => [...E.parseRange(r)].join(',');
const CALL3_BTN = 'JJ-55, AQs-A6s, KQs-K9s, QJs-Q9s, JTs, J9s, T9s, 98s, 87s, 76s, AQo-ATo, KQo, KJo';
const R = {
  'BTN-BB': [C.FACING.BTN.BB.call, C.RFI.BTN.range], 'CO-BB': [C.FACING.CO.BB.call, C.RFI.CO.range], 'UTG-BB': [C.FACING.UTG.BB.call, C.RFI.UTG.range],
  '3bp-BTN-BB': [C.FACING.BTN.BB.threebet, CALL3_BTN], 'SB-BB': [C.RFI.SB.range, C.FACING.SB.BB.call],
};
// [ranges, board, pot, stack] — pots pairs et tapis profonds : TexasSolver arrondit les mises à l'unité et convertit en tapis selon sa propre règle ;
// on choisit des spots où les deux arbres sont identiques.
const SPOTS = [
  ['BTN-BB', 'Ks7d2c9h4s', 20, 87], ['BTN-BB', 'Ah8c3d5s2h', 20, 87], ['BTN-BB', 'QhJh4c8d2s', 30, 82], ['BTN-BB', '9s8s6dKcKd', 20, 87],
  ['BTN-BB', 'Tc7c3hAs6d', 16, 90], ['CO-BB', 'KdQs5h3c2d', 20, 87], ['CO-BB', '7h6h2dJcAs', 25, 85], ['UTG-BB', 'AsKd8h4c3s', 20, 87],
  ['UTG-BB', '5c5d9sTh2c', 20, 87], ['3bp-BTN-BB', 'Kh9d4s2c7h', 46, 130], ['3bp-BTN-BB', 'Qs8s3d4hAc', 46, 130], ['SB-BB', 'Jd6c2sJh3d', 12, 94],
  ['SB-BB', 'Ac9c5d8h4s', 12, 94], ['BTN-BB', '4h4d4cKs9s', 20, 87],
  ['BTN-BB', 'Ks7d2c9h', 12, 92], ['BTN-BB', 'Qh9h5c2d', 12, 92], ['CO-BB', 'Ad7s3cTh', 12, 92], ['UTG-BB', 'Js8s4d2h', 12, 92],
  ['3bp-BTN-BB', 'Kd8c3s6h', 32, 85], ['SB-BB', '8d7d2cQs', 8, 95],
];
const SIZES = [50, 100];
function tsInput(sp, file) {
  const [rk, board, pot, stack] = sp, [oop, ip] = R[rk], cards = E.parseCards(board).map(E.cardStr), turn = cards.length === 4;
  const L = [`set_pot ${pot}`, `set_effective_stack ${stack}`, `set_board ${cards.join(',')}`, `set_range_ip ${classes(ip)}`, `set_range_oop ${classes(oop)}`];
  for (const p of ['oop', 'ip']) for (const st of turn ? ['turn', 'river'] : ['river']) L.push(`set_bet_sizes ${p},${st},bet,${(turn ? [75] : SIZES).join(',')}`);
  L.push('set_allin_threshold 0.67', 'build_tree', 'set_thread_num 2', 'set_accuracy 0.3', 'set_max_iteration 1000', 'set_print_interval 100', 'set_use_isomorphism 1', 'start_solve', 'set_dump_rounds 1', `dump_result ${file}`);
  return L.join('\n') + '\n';
}
function sigma(sp) {
  const [rk, board, pot, stack] = sp, [oop, ip] = R[rk], turn = E.parseCards(board).length === 4;
  const sz = turn ? { turn: [{ bet: [75], raise: [] }, { bet: [75], raise: [] }], river: [{ bet: [75], raise: [] }, { bet: [75], raise: [] }] } : { river: [{ bet: SIZES, raise: [] }, { bet: SIZES, raise: [] }] };
  const g = PF.create({ board, pot, stack, ranges: [oop, ip], sizes: sz, maxRaises: 0 });
  const t0 = Date.now(); let ex = 100; while (ex > 0.1 && g.stats().iterations < 3000) { g.iterate(25); ex = g.exploitability().pct; }
  return { g, ex, ms: Date.now() - t0 };
}
const key = (a, b) => (a > b ? `${a}-${b}` : `${b}-${a}`);
// Fréquences agrégées et écart moyen main par main entre les deux solveurs, à un nœud donné.
function compareNode(g, path, tsNode, p, weights) {
  const r = g.info(path), node = r.node, n = g.N[p], A = node.acts.length;
  const tsActs = tsNode.actions, tsS = tsNode.strategy.strategy;
  // Correspondance des actions par type et montant ajouté.
  const amount = (a) => a.to - node.bets[p];
  const map = node.acts.map((a) => tsActs.findIndex((t) => { const [k, v] = t.split(' '); if (a.k === 'x') return k === 'CHECK'; if (a.k === 'c') return k === 'CALL'; if (a.k === 'f') return k === 'FOLD'; return (k === 'BET' || k === 'RAISE' || k === 'ALLIN') && Math.abs(+v - amount(a)) < 0.6; }));
  if (map.some((i) => i < 0)) return { error: 'actions non appariées : ' + node.acts.map((a) => g.label(node, a.k === undefined ? 0 : node.acts.indexOf(a))).join('/') + ' vs ' + tsActs.join('/') };
  const aggS = new Array(A).fill(0), aggT = new Array(A).fill(0); let W = 0, tv = 0;
  for (let i = 0; i < n; i++) {
    const [c1, c2] = g.hands[p][i], ts = tsS[E.cardStr(c1) + E.cardStr(c2)] || tsS[E.cardStr(c2) + E.cardStr(c1)];
    const w = weights ? weights(i) : g.hands[p][i][2]; if (!ts || !(w > 0)) continue;
    let d = 0; for (let a = 0; a < A; a++) { const s = r.strategy[a * n + i], t = ts[map[a]]; aggS[a] += w * s; aggT[a] += w * t; d += Math.abs(s - t); }
    tv += (w * d) / 2; W += w;
  }
  return { acts: node.acts.map((_, a) => g.label(node, a)), sigma: aggS.map((x) => +(x / W).toFixed(4)), texas: aggT.map((x) => +(x / W).toFixed(4)), maxAggDiff: +Math.max(...aggS.map((x, a) => Math.abs(x - aggT[a]) / W)).toFixed(4), comboTV: +(tv / W).toFixed(4) };
}
const out = [];
SPOTS.forEach((sp, k) => {
  const file = path.join(WD, `s${k}.json`), inp = path.join(WD, `s${k}.txt`);
  fs.writeFileSync(inp, tsInput(sp, file));
  const t0 = Date.now(); const log = execFileSync(BIN, ['-i', inp], { cwd: path.dirname(BIN), maxBuffer: 1 << 26 }).toString(); const tsMs = Date.now() - t0;
  const tsEx = +((log.match(/Total exploitability ([\d.]+)/g) || []).pop() || '').replace(/[^\d.]/g, '');
  const T = JSON.parse(fs.readFileSync(file, 'utf8')), S = sigma(sp), g = S.g;
  const root = compareNode(g, [], T, 0, null);
  const ck = g.root.acts.findIndex((a) => a.k === 'x');
  const ipNode = compareNode(g, [ck], T.childrens.CHECK, 1, null);
  // OOP face à la plus petite mise d'IP après check : pondération par la fréquence de check de chaque solveur (on prend celle de SIGMA 52).
  const r0 = g.info([]), n0 = g.N[0];
  const ipActs = g.info([ck]).node.acts, b = ipActs.findIndex((a) => a.k === 'b');
  const tsB = Object.keys(T.childrens.CHECK.childrens).filter((x) => x.startsWith('BET')).sort((x, y) => +x.split(' ')[1] - +y.split(' ')[1])[0];
  const facing = compareNode(g, [ck, b], T.childrens.CHECK.childrens[tsB], 0, (i) => g.hands[0][i][2] * r0.strategy[ck * n0 + i]);
  const row = { spot: `${sp[0]} ${sp[1]}`, street: sp[1].length === 8 ? 'turn' : 'river', pot: sp[2], stack: sp[3], sigmaEx: +S.ex.toFixed(3), texasEx: tsEx, sigmaMs: S.ms, texasMs: tsMs, root, ipAfterCheck: ipNode, oopFacingBet: facing };
  out.push(row);
  console.log(k + 1, row.spot, 'expl', row.sigmaEx, '/', row.texasEx, '| racine écart max', root.maxAggDiff, 'TV', root.comboTV, '| IP', ipNode.maxAggDiff, ipNode.comboTV, '| face mise', facing.maxAggDiff, facing.comboTV);
  fs.writeFileSync(path.join(__dirname, 'data/validation_texassolver.json'), JSON.stringify({ built: new Date().toISOString().slice(0, 10), tool: 'TexasSolver (branche console, AGPL v3)', spots: out }, null, 1));
});
const ok = out.filter((r) => !r.root.error && !r.ipAfterCheck.error && !r.oopFacingBet.error), avg = (f) => ok.reduce((a, r) => a + f(r), 0) / ok.length;
console.log('moyennes : écart agrégé max racine', avg((r) => r.root.maxAggDiff).toFixed(4), 'IP', avg((r) => r.ipAfterCheck.maxAggDiff).toFixed(4), 'face', avg((r) => r.oopFacingBet.maxAggDiff).toFixed(4), '| TV combo', avg((r) => r.root.comboTV).toFixed(4), avg((r) => r.ipAfterCheck.comboTV).toFixed(4), avg((r) => r.oopFacingBet.comboTV).toFixed(4));
