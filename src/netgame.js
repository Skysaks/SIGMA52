// Moteur de partie entre amis (jetons sans valeur) : hold'em no-limit de 2 à 9 joueurs humains, côté hôte.
// L'état est un objet JSON (sérialisable) ; publicView() en retire les cartes cachées pour la diffusion.
// Règles : blindes, relance minimale, tapis, pots annexes, abattage ; même logique que la table d'entraînement.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const STREETS = ['pre', 'flop', 'turn', 'river'];
  function create(o = {}) {
    return { sb: +o.sb || 1, bb: +o.bb || 2, seats: [], button: -1, handNo: 0, street: 'pre', board: [], deck: [], cur: 0, minRaise: 0, toAct: -1, acted: [], done: true, log: [], seq: 0, show: null, last: null };
  }
  // Siège : { id (pair réseau), name, stack }. Un joueur à 0 jeton ne reçoit pas de cartes.
  function sit(G, i, id, name, stack) { G.seats[i] = { id, name: String(name || 'Joueur').slice(0, 20), stack: +stack || 0, cards: [], inHand: false, allin: false, put: 0, total: 0 }; }
  function leave(G, i) { const p = G.seats[i]; if (!p) return; if (!G.done && p.inHand) foldOut(G, i); G.seats[i] = null; }
  const live = (G) => G.seats.map((p, i) => (p && p.stack > 1e-9 ? i : -1)).filter((i) => i >= 0);
  const n = (G) => G.seats.length;
  function nextFrom(G, from, test) { const N = n(G); for (let k = 1; k <= N; k++) { const i = (from + k + N) % N; if (G.seats[i] && test(G.seats[i], i)) return i; } return -1; }
  const canAct = (p) => p && p.inHand && !p.allin && p.stack > 1e-9;
  function shuffled(rand) { const d = [...Array(52).keys()]; for (let i = 51; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }
  function startHand(G, rand = Math.random) {
    const players = G.seats.map((p, i) => (p && p.stack > 1e-9 ? i : -1)).filter((i) => i >= 0);
    if (players.length < 2) throw new Error('Il faut au moins deux joueurs avec des jetons');
    G.handNo++; G.seq++; G.done = false; G.street = 'pre'; G.board = []; G.show = null; G.last = null; G.log = [];
    G.deck = shuffled(rand);
    G.seats.forEach((p) => { if (!p) return; Object.assign(p, { cards: [], inHand: p.stack > 1e-9, allin: false, put: 0, total: 0 }); });
    for (const i of players) G.seats[i].cards = [G.deck.pop(), G.deck.pop()];
    G.button = nextFrom(G, G.button < 0 ? -1 : G.button, (p) => p.inHand);
    const sbi = players.length === 2 ? G.button : nextFrom(G, G.button, (p) => p.inHand), bbi = nextFrom(G, sbi, (p) => p.inHand);
    post(G, sbi, G.sb); post(G, bbi, G.bb);
    G.cur = G.bb; G.minRaise = G.bb; G.acted = []; G.sbi = sbi; G.bbi = bbi;
    G.toAct = nextFrom(G, bbi, canAct);
    G.log.push(`Main ${G.handNo} : blindes ${G.sb}/${G.bb}`);
    if (roundOver(G)) nextStreet(G);
    return G;
  }
  function post(G, i, amt) { const p = G.seats[i], a = Math.min(amt, p.stack); p.stack = r2(p.stack - a); p.put += a; p.total += a; if (p.stack <= 1e-9) p.allin = true; }
  const alive = (G) => G.seats.filter((p) => p && p.inHand);
  const pot = (G) => G.seats.reduce((a, p) => a + (p ? p.total : 0), 0);
  function legal(G) {
    const p = G.seats[G.toAct]; if (!p || G.done) return null;
    const toCall = Math.min(G.cur - p.put, p.stack), maxTo = p.put + p.stack;
    return { seat: G.toAct, toCall, canCheck: toCall <= 1e-9, minTo: Math.min(G.cur + G.minRaise, maxTo), maxTo, canRaise: maxTo > G.cur + 1e-9, pot: pot(G) };
  }
  function roundOver(G) {
    if (alive(G).length <= 1) return true;
    const act = G.seats.map((p, i) => (canAct(p) ? i : -1)).filter((i) => i >= 0);
    if (!act.length) return true;
    if (act.length === 1 && G.seats[act[0]].put >= G.cur - 1e-9) return G.acted.includes(act[0]) || alive(G).every((p) => p.allin || p === G.seats[act[0]]);
    return act.every((i) => G.acted.includes(i) && G.seats[i].put >= G.cur - 1e-9);
  }
  function foldOut(G, i) { G.seats[i].inHand = false; }
  // Action du joueur au siège i. type : fold | check | call | raise (to = mise totale de la rue). Lève une erreur si illégale.
  function act(G, i, type, to = 0) {
    if (G.done) throw new Error('Main terminée');
    if (i !== G.toAct) throw new Error('Ce n\'est pas ton tour');
    const p = G.seats[i], L = legal(G);
    if (type === 'raise' && !L.canRaise) type = 'call';
    if (type === 'fold' && L.canCheck) type = 'check';
    if (type === 'check' && !L.canCheck) throw new Error('Impossible de checker : il y a une mise');
    if (type === 'fold') { foldOut(G, i); G.log.push(`${p.name} se couche`); }
    else if (type === 'check') G.log.push(`${p.name} checke`);
    else if (type === 'call') { const a = L.toCall; p.stack = r2(p.stack - a); p.put = r2(p.put + a); p.total += a; if (p.stack <= 1e-9) p.allin = true; G.log.push(`${p.name} suit ${fmt(a)}${p.allin ? ' (tapis)' : ''}`); }
    else if (type === 'raise') {
      to = Math.round(Math.max(L.minTo, Math.min(+to || 0, L.maxTo)) * 100) / 100;
      const add = to - p.put, wasBet = G.cur <= 1e-9;
      if (to - G.cur >= G.minRaise - 1e-9) G.minRaise = to - G.cur;
      p.stack = r2(p.stack - add); p.put = to; p.total = r2(p.total + add); if (p.stack <= 1e-9) p.allin = true;
      G.log.push(`${p.name} ${wasBet ? 'mise' : 'relance à'} ${fmt(to)}${p.allin ? ' (tapis)' : ''}`);
      if (to > G.cur + 1e-9) { G.cur = to; G.acted = []; }
    } else throw new Error('Action inconnue');
    G.acted.push(i); G.seq++; G.last = { seat: i, type };
    if (roundOver(G)) nextStreet(G); else G.toAct = nextFrom(G, i, canAct);
    return G;
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  const fmt = (x) => (Math.round(x * 100) / 100).toLocaleString('fr-FR');
  function nextStreet(G) {
    if (alive(G).length <= 1) return finish(G);
    G.seats.forEach((p) => p && (p.put = 0)); G.cur = 0; G.minRaise = G.bb; G.acted = [];
    const k = STREETS.indexOf(G.street);
    if (k === 3) return finish(G);
    G.street = STREETS[k + 1];
    const add = G.street === 'flop' ? 3 : 1; for (let j = 0; j < add; j++) G.board.push(G.deck.pop());
    if (G.seats.filter(canAct).length <= 1) return nextStreet(G);
    G.toAct = nextFrom(G, G.button, canAct);
    if (G.toAct < 0) return nextStreet(G);
  }
  function finish(G) {
    G.done = true; G.toAct = -1; G.seq++;
    const al = alive(G), N = n(G), win = new Array(N).fill(0);
    if (al.length === 1) { const w = G.seats.indexOf(al[0]); win[w] = pot(G); G.show = null; }
    else {
      while (G.board.length < 5) G.board.push(G.deck.pop());
      const vals = G.seats.map((p) => (p && p.inHand ? E.evaluate([...p.cards, ...G.board]) : -1));
      const totals = [...new Set(G.seats.map((p) => (p ? p.total : 0)))].sort((a, b) => a - b); let prev = 0;
      for (const lvl of totals) {
        if (lvl <= prev) continue;
        const contrib = G.seats.reduce((a, p) => a + (p ? Math.min(Math.max(p.total - prev, 0), lvl - prev) : 0), 0);
        const elig = G.seats.map((p, i) => (p && p.inHand && p.total >= lvl - 1e-9 ? i : -1)).filter((i) => i >= 0);
        if (elig.length) {
          const best = Math.max(...elig.map((i) => vals[i])), ws = elig.filter((i) => vals[i] === best), c = Math.round(contrib * 100), q = Math.floor(c / ws.length);
          ws.forEach((i, k) => (win[i] += (q + (k === 0 ? c - q * ws.length : 0)) / 100));
        } else { const top = G.seats.map((p, i) => (p && p.total >= lvl - 1e-9 ? i : -1)).filter((i) => i >= 0); top.forEach((i) => (win[i] += contrib / top.length)); }
        prev = lvl;
      }
      G.show = G.seats.map((p, i) => (p && p.inHand ? { i, cards: p.cards.slice(), cat: E.categoryName(vals[i]) } : null)).filter(Boolean);
    }
    G.result = win.map((w, i) => (G.seats[i] ? Math.round((w - G.seats[i].total) * 100) / 100 : 0));
    win.forEach((w, i) => { if (w > 0 && G.seats[i]) { G.seats[i].stack = Math.round((G.seats[i].stack + w) * 100) / 100; G.log.push(`${G.seats[i].name} remporte ${fmt(w)}`); } });
    G.potFinal = pot(G);
  }
  // Vue publique (diffusée à tous) : aucune carte cachée, sauf à l'abattage. Compacte (limite des messages : 4 Ko).
  function publicView(G) {
    return { v: 1, h: G.handNo, q: G.seq, sb: G.sb, bb: G.bb, st: G.street, b: G.board.slice(), btn: G.button, ta: G.toAct, cur: G.cur, mr: G.minRaise, d: G.done, pot: pot(G),
      s: G.seats.map((p) => (p ? [p.id, p.name, p.stack, p.put, p.inHand ? 1 : 0, p.allin ? 1 : 0, p.total] : null)),
      sh: G.show, r: G.done ? G.result : null, lg: G.log.slice(-6) };
  }
  const api = { create, sit, leave, startHand, act, legal, publicView, pot, live };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NetGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
