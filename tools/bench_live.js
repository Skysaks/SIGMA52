// Banc d'essai : le moteur de la Table live joue la place du héros contre les bots de table.js.
// Compare son gain (bb/100) à celui d'un bot régulier placé sur le même siège avec les mêmes cartes (même graine).
// Usage : node tools/bench_live.js [mains par table] [graine]
const E = require('../src/engine.js'), TS = require('../src/table.js'), L = require('../src/live.js');
const HANDS = +(process.argv[2] || 1500), SEED = +(process.argv[3] || 1);
const TYPE = { nit: 'serre', reg: 'normal', station: 'fish', maniaque: 'maniaque', mizrachi: 'large', action: 'fish', prolive: 'normal' };
const ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
const typeOf = (tb, i) => TYPE[tb.players[i].profile] || TYPE[TS.kindOf(TS.PROFILES[tb.players[i].profile] || {}, tb.players[i].profile)] || 'normal';
function inputs(tb) {
  const L0 = tb.legal(), me = tb.players[0], bb = tb.bb, pos = TS.posName(tb, 0);
  const opps = tb.players.map((p, i) => [p, i]).filter(([p, i]) => i > 0 && p.inHand && !p.out);
  const pre = tb.seq.filter((x) => x.street === 'pre');
  const aggr = [...tb.seq].reverse().find((x) => x.final === 'raise' && x.i !== 0);
  const vi = aggr ? aggr.i : opps.length ? opps[0][1] : 1;
  const o = { hero: me.cards, board: tb.board.slice(), players: tb.active().length, pos, nOpp: Math.max(1, opps.length), type: typeOf(tb, vi), stackBB: tb.effStack(0) / bb, runouts: 40, iterations: 500 };
  if (tb.street === 'pre') {
    const before = pre.filter((x) => x.i !== 0), raises = before.filter((x) => x.final === 'raise').length, heroRaised = pre.some((x) => x.i === 0 && x.final === 'raise');
    const calls = before.filter((x) => x.final === 'call').length;
    if (heroRaised) { o.pre = 'threebet'; o.raiseBB = tb.cur / bb; o.openBB = me.put / bb; }
    else if (raises === 0) { o.pre = calls ? 'limp' : 'open'; o.limpers = calls; }
    else { const lastR = before.map((x, k) => [x, k]).filter(([x]) => x.final === 'raise').pop()[1]; const after = before.slice(lastR + 1).filter((x) => x.final === 'call').length; o.pre = after ? 'raisecall' : 'raise'; o.callers = after; o.raiseBB = tb.cur / bb; }
    return o;
  }
  const v = tb.players[vi], vpreAct = v.acts.filter((a) => a.street === 'pre' && (a.final === 'raise' || a.final === 'call'));
  const vRaised = vpreAct.some((a) => a.final === 'raise'), heroPreRaise = me.acts.some((a) => a.street === 'pre' && a.final === 'raise');
  o.vpre = vRaised ? (heroPreRaise ? 'threebet' : 'raise') : vpreAct.length ? (heroPreRaise ? 'call' : 'limp') : 'call';
  o.pot = (L0.pot - L0.toCall) / bb; o.toCall = L0.toCall / bb; o.stack = me.stack / bb;
  o.ip = ORDER.indexOf(pos) > ORDER.indexOf(TS.posName(tb, vi));
  o.raised = L0.toCall > 0 && me.put > 0;
  const hist = [];
  for (const a of v.acts) {
    if (a.street === 'pre' || a.street === tb.street) continue;
    if (a.final === 'check') hist.push({ street: a.street, a: 'check' });
    else if (a.final === 'call') hist.push({ street: a.street, a: 'call', size: a.toCall / Math.max(1e-9, a.pot - a.toCall) });
    else if (a.final === 'raise') hist.push({ street: a.street, a: a.toCall > 0 ? 'raise' : 'bet', size: a.size });
  }
  o.history = hist;
  return o;
}
function liveAct(tb) {
  const L0 = tb.legal(), bb = tb.bb, o = inputs(tb); let r = null;
  try { r = L.decide(o); } catch (e) { r = null; }
  if (!r) return tb.act(L0.canCheck ? 'check' : 'fold');
  const a = r.action;
  if (a === 'COUCHE') return tb.act(L0.canCheck ? 'check' : 'fold');
  if (a === 'CHECK') return tb.act(L0.canCheck ? 'check' : 'fold');
  if (a === 'SUIS') return tb.act(L0.canCheck ? 'check' : 'call');
  if (a === 'TAPIS') return tb.act('raise', L0.maxTo);
  if (tb.street === 'pre') { const x = parseFloat(String(r.size).replace(',', '.')); return tb.act('raise', (isFinite(x) ? x : 3) * bb); }
  const amt = (r.amount || 0) * bb;
  return tb.act('raise', L0.toCall > 0 ? tb.cur + Math.max(amt - L0.toCall, tb.minRaise) : Math.max(amt, bb));
}
function run(lineup, policy, seed) {
  const tb = new TS.Table({ lineup, random: E.rng(seed) }); let dec = 0; const t0 = Date.now();
  for (let h = 0; h < HANDS; h++) { tb.newHand(); let g = 0; while (!tb.done && g++ < 150) { if (tb.toAct === 0 && !tb.players[0].out) { dec++; if (policy === 'live') { if (!L.actTable(tb, 0)) tb.autoHero('reg'); } else tb.autoHero(policy); } else tb.runBots(); } }
  return { bb100: (tb.session.net / tb.session.hands) * 100, dec, ms: (Date.now() - t0) / Math.max(1, dec) };
}
const LINEUPS = { mixte: ['station', 'reg', 'maniaque', 'station', 'nit'], fish: ['station', 'station', 'action', 'reg', 'station'], reguliers: ['reg', 'reg', 'nit', 'reg', 'prolive'], agressive: ['maniaque', 'mizrachi', 'reg', 'maniaque', 'reg'], difficile: ['sigma', 'sigma', 'reg', 'sigma', 'nit'] };
const out = {};
for (const [k, lu] of Object.entries(LINEUPS)) {
  const a = run(lu, 'live', SEED), b = run(lu, 'reg', SEED);
  out[k] = { live: +a.bb100.toFixed(1), reg: +b.bb100.toFixed(1), msParDecision: +a.ms.toFixed(1) };
  console.log(k, JSON.stringify(out[k]));
}
console.log(JSON.stringify(out));
