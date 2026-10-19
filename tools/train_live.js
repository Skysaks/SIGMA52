// Entraînement du modèle de la Table live : on fait jouer des tables de bots profilés (table.js) et on compte,
// pour chaque type d'adversaire, ce qu'il fait selon sa main.
//  - Préflop : fréquence de chaque action par main (169) et par situation (personne n'a ouvert, face à une ouverture, face à un 3-bet).
//  - Après le flop : P(action | catégorie de main, rue, face à une mise ou non, taille de la mise affrontée).
// Écrit src/live_model.js. Usage : node tools/train_live.js [mains par type]
const E = require('../src/engine.js'), TS = require('../src/table.js'), B = require('../src/board.js'), fs = require('fs'), path = require('path');
const HANDS = +(process.argv[2] || 30000);
// Type de la Table live -> profil de bot simulé
const MAP = { serre: 'nit', normal: 'reg', large: 'mizrachi', fish: 'station', maniaque: 'maniaque' };
const STREETS = ['flop', 'turn', 'river'];
// Catégories de force (point de vue du joueur qui agit)
const BUCKETS = ['Monstre (suite ou mieux)', 'Brelan ou deux paires', 'Top paire ou overpair', 'Paire moyenne', 'Petite paire', 'Gros tirage', 'Petit tirage', 'Rien'];
function bucket(cards, board) {
  const k = B.classify(cards, board), m = k.made;
  if (m <= 4) return 0; if (m <= 7) return 1; if (m <= 9) return 2; if (m === 10) return 3; if (m === 11) return 4;
  if (board.length < 5 && k.draws.some((d) => d <= 1)) return 5; if (board.length < 5 && k.draws.length) return 6; return 7;
}
// Classe de taille (part du pot) : petite < 45 %, moyenne < 85 %, grosse au-delà
const sizeClass = (f) => (f < 0.45 ? 0 : f < 0.85 ? 1 : 2);
// Actions : sans mise à payer -> 0 check, 1 petite mise, 2 moyenne, 3 grosse ; face à une mise -> 0 couche, 1 suit, 2 relance
const PRE = ['open', 'limp', 'foldFirst', 'callOpen', 'threeBet', 'foldOpen', 'call3', 'fourBet', 'fold3'];

const model = { buckets: BUCKETS, streets: STREETS, types: Object.keys(MAP), hands: HANDS, pre: {}, post: {} };
const t0 = Date.now();
for (const [type, prof] of Object.entries(MAP)) {
  const pre = PRE.reduce((o, k) => ((o[k] = new Float64Array(169)), o), {}), opp = { first: new Float64Array(169), open: new Float64Array(169), three: new Float64Array(169) };
  // post[street][facing 0/1][sizeClass 0..2 (0 si pas de mise)][bucket][action]
  const post = STREETS.map(() => [0, 1].map(() => [0, 1, 2].map(() => BUCKETS.map(() => [0, 0, 0, 0]))));
  const tb = new TS.Table({ lineup: [prof, prof, prof, 'reg', 'station'], random: E.rng(Object.keys(MAP).indexOf(type) * 7919 + 13) });
  const orig = tb.act.bind(tb);
  tb.act = (kind, to = 0) => {
    const i = tb.toAct, p = tb.players[i];
    if (i > 0 && p.profile === prof && i <= 3) {
      const L = tb.legal(), h = E.ALL169.indexOf(E.abstractOf(p.cards[0], p.cards[1]));
      const k = kind === 'raise' && L.maxTo <= tb.cur + 1e-9 ? 'call' : kind === 'fold' && L.canCheck ? 'check' : kind;
      if (tb.street === 'pre') {
        const first = !p.acts.some((a) => a.street === 'pre' && (a.final === 'call' || a.final === 'raise' || a.final === 'check'));
        if (first) {
          if (tb.raises <= 1) { if (L.toCall > 0 || !L.canCheck) { opp.first[h]++; if (k === 'raise') pre.open[h]++; else if (k === 'call') pre.limp[h]++; else pre.foldFirst[h]++; } }
          else if (tb.raises === 2) { opp.open[h]++; if (k === 'raise') pre.threeBet[h]++; else if (k === 'call') pre.callOpen[h]++; else pre.foldOpen[h]++; }
        } else if (tb.raises === 3 && p.acts.some((a) => a.street === 'pre' && a.final === 'raise')) { opp.three[h]++; if (k === 'raise') pre.fourBet[h]++; else if (k === 'call') pre.call3[h]++; else pre.fold3[h]++; }
      } else {
        const s = STREETS.indexOf(tb.street), b = bucket(p.cards, tb.board), facing = L.toCall > 1e-9 ? 1 : 0;
        if (!facing) {
          const pot = tb.pot, size = k === 'raise' ? (Math.max(L.minTo, Math.min(to, L.maxTo)) - p.put) / Math.max(pot, 1e-9) : 0;
          post[s][0][0][b][k === 'raise' ? 1 + sizeClass(size) : 0]++;
        } else {
          const potBefore = tb.pot - L.toCall, sc = sizeClass(L.toCall / Math.max(potBefore, 1e-9));
          post[s][1][sc][b][k === 'raise' ? 2 : k === 'call' ? 1 : 0]++;
        }
      }
    }
    return orig(kind, to);
  };
  for (let h = 0; h < HANDS; h++) { tb.newHand(); let g = 0; while (!tb.done && g++ < 120) { if (tb.toAct === 0) tb.autoHero('reg'); else tb.runBots(); } }
  // Préflop : fréquences lissées vers la moyenne du type (8 observations fictives)
  const smooth = (num, den) => { const tot = num.reduce((a, b) => a + b, 0), all = den.reduce((a, b) => a + b, 0), g = all ? tot / all : 0; return [...num].map((x, i) => +(((x + 8 * g) / (den[i] + 8))).toFixed(3)); };
  model.pre[type] = {
    open: smooth(pre.open, opp.first), limp: smooth(pre.limp, opp.first), callOpen: smooth(pre.callOpen, opp.open), threeBet: smooth(pre.threeBet, opp.open),
    call3: smooth(pre.call3, opp.three), fourBet: smooth(pre.fourBet, opp.three), n: { first: opp.first.reduce((a, b) => a + b, 0), open: opp.open.reduce((a, b) => a + b, 0), three: opp.three.reduce((a, b) => a + b, 0) },
  };
  // Postflop : probabilités lissées (Laplace, 0,5 par action)
  model.post[type] = post.map((F) => F.map((S, facing) => S.map((Bk) => Bk.map((row) => { const r = facing ? row.slice(0, 3) : row, n = r.reduce((x, y) => x + y, 0); return { n, p: r.map((x) => +((x + 0.5) / (n + 0.5 * r.length)).toFixed(3)) }; }))));
  console.log(type, prof, HANDS, 'mains', Math.round((Date.now() - t0) / 1000) + ' s', 'ouvertures observées', model.pre[type].n.first);
}
fs.writeFileSync(path.join(__dirname, '../src/live_model.js'), `// Généré par tools/train_live.js le ${new Date().toISOString().slice(0, 10)} : ${HANDS} mains simulées par type d'adversaire.\n(function (root) { const M = ${JSON.stringify(model)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.LiveModel = M; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('ok', Math.round((Date.now() - t0) / 1000) + ' s');
