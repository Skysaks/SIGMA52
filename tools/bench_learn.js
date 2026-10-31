// Banc d'essai de l'apprentissage (v14) : le moteur joue sans connaître le type de ses adversaires (tous « normal »),
// avec ou sans apprentissage (réactions à ses mises, abattages, VPIP/PFR), comparé au moteur qui connaît les vrais types.
// Usage : node tools/bench_learn.js [mains] [graine]
const E = require('../src/engine.js'), TS = require('../src/table.js'), L = require('../src/live.js');
const HANDS = +(process.argv[2] || 3000), SEED = +(process.argv[3] || 1);
function track(tb, mem) {
  const board = tb.board, endIn = tb.players.filter((p) => p.inHand && !p.out).length;
  tb.players.forEach((p, j) => {
    if (j === 0 || p.out) return;
    const vs = (mem.vs[j] = mem.vs[j] || { n: 0, v: 0, r: 0 }); vs.n++;
    const pre = p.acts.filter((a) => a.street === 'pre');
    if (pre.some((a) => a.final === 'call' || a.final === 'raise')) vs.v++; if (pre.some((a) => a.final === 'raise')) vs.r++;
    const pl = (mem.pl[j] = mem.pl[j] || { face: [0, 0, 0], bets: [0, 0], calls: [0, 0], sd: 0 });
    tb.seq.forEach((x, k) => {
      if (x.i !== 0 || x.final !== 'raise' || x.street === 'pre') return;
      const nx = tb.seq.slice(k + 1).find((y) => y.i === j && y.street === x.street);
      if (nx) pl.face[nx.final === 'fold' ? 0 : nx.final === 'call' ? 1 : nx.final === 'raise' ? 2 : 1]++;
    });
    if (p.inHand && endIn >= 2 && board.length === 5 && tb.players[0].inHand) {
      const hist = p.acts.filter((a) => a.street !== 'pre').map((a) => ({ street: a.street, a: a.final === 'raise' ? (a.toCall > 0 ? 'raise' : 'bet') : a.final === 'call' ? 'call' : 'check' }));
      L.learnShowdown(pl, p.cards, board, hist);
    }
  });
}
function run(lineup, mode, seed) {
  const tb = new TS.Table({ lineup, random: E.rng(seed) }), mem = { pl: {}, vs: {} };
  for (let h = 0; h < HANDS; h++) {
    tb.newHand(); let g = 0;
    while (!tb.done && g++ < 150) {
      if (tb.toAct === 0 && !tb.players[0].out) {
        const o = L.fromTable(tb, 0);
        if (mode !== 'connu') o.type = 'normal';
        if (mode === 'apprend' && o.vi) { o.pl = mem.pl[o.vi]; const v = mem.vs[o.vi]; if (v && v.n >= 15) o.vstats = { n: v.n, vpip: v.v / v.n, pfr: v.r / v.n }; }
        let r = null; try { r = L.decide(o); } catch (e) { r = null; }
        if (!L.applyDecision(tb, r)) tb.autoHero('reg');
      } else tb.runBots();
    }
    track(tb, mem);
  }
  return +((tb.session.net / tb.session.hands) * 100).toFixed(1);
}
const LINEUPS = { mixte: ['station', 'reg', 'maniaque', 'station', 'nit'], fish: ['station', 'station', 'action', 'reg', 'station'], agressive: ['maniaque', 'lag_imprevisible', 'reg', 'maniaque', 'reg'] };
const out = {};
for (const [k, lu] of Object.entries(LINEUPS)) { out[k] = { aveugle: run(lu, 'aveugle', SEED), apprend: run(lu, 'apprend', SEED), connu: run(lu, 'connu', SEED) }; console.log(k, JSON.stringify(out[k])); }
console.log(JSON.stringify(out));
