// Entraînement du modèle postflop de la Table live : on fait jouer des tables de bots profilés (table.js) de tailles
// et de profondeurs variées, et on compte pour chaque type d'adversaire ce qu'il fait selon sa main :
// P(action | catégorie de main, rue, face à une mise ou non, taille de la mise affrontée, pot à 2 ou à plusieurs, en position ou non).
// Écrit src/live_model.js. Usage : node tools/train_live.js [mains par type]
const E = require('../src/engine.js'), TS = require('../src/table.js'), B = require('../src/board.js'), fs = require('fs'), path = require('path');
const HANDS = +(process.argv[2] || 120000);
// Type de la Table live -> profil de bot simulé
const MAP = { serre: 'nit', normal: 'reg', large: 'mizrachi', fish: 'station', maniaque: 'maniaque', action: 'action' };
const STREETS = ['flop', 'turn', 'river'];
const BUCKETS = ['Monstre (suite ou mieux)', 'Brelan ou deux paires', 'Top paire ou overpair', 'Paire moyenne', 'Petite paire', 'Gros tirage', 'Petit tirage', 'Rien'];
function bucket(cards, board) {
  const k = B.classify(cards, board), m = k.made;
  if (m <= 4) return 0; if (m <= 7) return 1; if (m <= 9) return 2; if (m === 10) return 3; if (m === 11) return 4;
  if (board.length < 5 && k.draws.some((d) => d <= 1)) return 5; if (board.length < 5 && k.draws.length) return 6; return 7;
}
const sizeClass = (f) => (f < 0.45 ? 0 : f < 0.85 ? 1 : 2);
// Configurations : taille de table x profondeur (en bb). Les adversaires du type étudié sont mêlés à des réguliers et des fish.
const CONFIGS = [];
for (const n of [2, 4, 6, 9]) for (const bb of [40, 100, 200]) CONFIGS.push({ n, bb });
const mk = () => [0, 1].map(() => [0, 1, 2].map(() => [0, 1].map(() => [0, 1].map(() => BUCKETS.map(() => [0, 0, 0, 0])))));
const model = { version: 2, buckets: BUCKETS, streets: STREETS, types: Object.keys(MAP), hands: HANDS, configs: CONFIGS, post: {}, post2: {} };
const t0 = Date.now();
let seed = 1;
for (const [type, prof] of Object.entries(MAP)) {
  // post[street][facing][sizeClass][mw][ip][bucket][action]
  const post = STREETS.map(mk); let obs = 0;
  for (const cf of CONFIGS) {
    const others = ['reg', 'station', 'reg', 'nit', 'station', 'maniaque', 'reg', 'station'];
    const lineup = Array.from({ length: cf.n - 1 }, (_, k) => (k % 2 === 0 ? prof : others[k % others.length]));
    const tb = new TS.Table({ lineup, stack: cf.bb * 0.1, random: E.rng(seed++ * 7919 + 13) });
    const orig = tb.act.bind(tb);
    tb.act = (kind, to = 0) => {
      const i = tb.toAct, p = tb.players[i];
      if (i > 0 && p.profile === prof && tb.street !== 'pre') {
        const L = tb.legal(), k = kind === 'raise' && L.maxTo <= tb.cur + 1e-9 ? 'call' : kind === 'fold' && L.canCheck ? 'check' : kind;
        const s = STREETS.indexOf(tb.street), b = bucket(p.cards, tb.board), facing = L.toCall > 1e-9 ? 1 : 0;
        const inHand = tb.players.map((q, j) => [q, j]).filter(([q]) => q.inHand && !q.out);
        const mw = inHand.length > 2 ? 1 : 0;
        const order = tb.seatOrder(tb.button).filter((j) => tb.players[j].inHand), ip = order[order.length - 1] === i ? 1 : 0;
        let a, sc = 0;
        if (!facing) { const pot = tb.pot, size = k === 'raise' ? (Math.max(L.minTo, Math.min(to, L.maxTo)) - p.put) / Math.max(pot, 1e-9) : 0; a = k === 'raise' ? 1 + sizeClass(size) : 0; }
        else { const potBefore = tb.pot - L.toCall; sc = sizeClass(L.toCall / Math.max(potBefore, 1e-9)); a = k === 'raise' ? 2 : k === 'call' ? 1 : 0; }
        post[s][facing][sc][mw][ip][b][a]++; obs++;
      }
      return orig(kind, to);
    };
    const nh = Math.round(HANDS / CONFIGS.length);
    for (let h = 0; h < nh; h++) { tb.newHand(); let g = 0; while (!tb.done && g++ < 200) { if (tb.toAct === 0) tb.autoHero('reg'); else tb.runBots(); } }
  }
  const cell = (row, facing) => { const r = facing ? row.slice(0, 3) : row, n = r.reduce((x, y) => x + y, 0); return { n, p: r.map((x) => +((x + 0.5) / (n + 0.5 * r.length)).toFixed(3)) }; };
  model.post2[type] = post.map((F) => F.map((S, facing) => S.map((M) => M.map((I) => I.map((Bk) => Bk.map((row) => cell(row, facing)))))));
  // Version agrégée (toutes positions, tous nombres de joueurs) pour le repli
  model.post[type] = post.map((F, si) => F.map((S, facing) => S.map((_, sc) => BUCKETS.map((__, b) => { const row = [0, 0, 0, 0]; for (const mw of [0, 1]) for (const ip of [0, 1]) S[sc][mw][ip][b].forEach((x, k) => (row[k] += x)); return cell(row, facing); }))));
  console.log(type, prof, HANDS, 'mains', obs, 'décisions observées', Math.round((Date.now() - t0) / 1000) + ' s');
}
fs.writeFileSync(path.join(__dirname, '../src/live_model.js'), `// Généré par tools/train_live.js le ${new Date().toISOString().slice(0, 10)} : ${HANDS} mains simulées par type d'adversaire, tables de 2 à 9 joueurs, 40 à 200 bb.\n(function (root) { const M = ${JSON.stringify(model)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.LiveModel = M; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('ok', Math.round((Date.now() - t0) / 1000) + ' s');
