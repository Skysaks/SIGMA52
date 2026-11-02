// Moteur blackjack de SIGMA 52 : probabilités exactes du croupier et EV de chaque décision pour une composition de sabot donnée.
// Rangs : 1 = as, 2..9, 10 = toutes les figures et les dix. Un sabot est un tableau de 11 nombres (index 0 inutilisé) ;
// les comptes peuvent être fractionnaires (sabot moyen à un true count donné).
// Approximations documentées : la carte cachée du croupier est tirée après les cartes du joueur (conditionnement « pas de blackjack »
// appliqué au tirage de la carte cachée) ; les re-splits sont comptés main par main ; une main splittée ignore les cartes de sa voisine.
(function (root) {
  'use strict';
  const RULES = {
    decks: 6, h17: false, das: true, double: 'any', maxHands: 4, rsa: false, hsa: false,
    surrender: false, peek: true, obo: false, bj: 1.5,
  };
  const PRESETS = {
    europe: { label: 'Europe, sans carte cachée', note: 'Règles européennes courantes : le croupier prend sa 2e carte après les joueurs. À vérifier sur la table.', r: { decks: 6, h17: false, das: true, double: '9-11', maxHands: 3, rsa: false, peek: false, obo: false, surrender: false, bj: 1.5 } },
    strip: { label: 'Las Vegas Strip, sabot de 6', note: 'Sabot de 6 jeux, croupier reste sur soft 17, double après split, abandon.', r: { decks: 6, h17: false, das: true, double: 'any', maxHands: 4, rsa: false, peek: true, obo: false, surrender: true, bj: 1.5 } },
    h17: { label: 'Sabot de 6, croupier tire soft 17', note: 'Variante courante : le croupier tire sur soft 17.', r: { decks: 6, h17: true, das: true, double: 'any', maxHands: 4, rsa: false, peek: true, obo: false, surrender: true, bj: 1.5 } },
    deux: { label: 'Double jeu (2 paquets), distribué à la main', note: 'Pitch game : 2 paquets, croupier tire soft 17.', r: { decks: 2, h17: true, das: true, double: 'any', maxHands: 4, rsa: false, peek: true, obo: false, surrender: false, bj: 1.5 } },
    sixcinq: { label: 'Blackjack payé 6:5 (à fuir)', note: 'Le blackjack payé 6 pour 5 au lieu de 3 pour 2.', r: { decks: 6, h17: true, das: true, double: 'any', maxHands: 4, rsa: false, peek: true, obo: false, surrender: false, bj: 1.2 } },
  };
  const R = (o) => Object.assign({}, RULES, o || {});
  const shoeOf = (decks) => { const s = new Array(11).fill(0); for (let r = 1; r <= 9; r++) s[r] = 4 * decks; s[10] = 16 * decks; return s; };
  const total = (s) => { let n = 0; for (let r = 1; r <= 10; r++) n += s[r]; return n; };
  const hv = (sum, ace) => (ace && sum + 10 <= 21 ? sum + 10 : sum);
  const isSoft = (sum, ace) => ace && sum + 10 <= 21;
  const key = (s) => { let k = ''; for (let r = 1; r <= 10; r++) k += (s[r] % 1 ? s[r].toFixed(4) : s[r]) + ','; return k; };

  // Sabot moyen à un true count Hi-Lo donné. Les cartes basses (2-6) et hautes (10-A) sont aussi nombreuses : un running count RC
  // correspond en moyenne à RC/2 basses en moins et RC/2 hautes en plus dans le reste du sabot, réparties uniformément par rang.
  function shoeAtTC(decksLeft, tc) {
    const s = shoeOf(decksLeft), h = tc * decksLeft / 2;
    for (let r = 2; r <= 6; r++) s[r] -= h / 5;
    s[10] += h * 4 / 5; s[1] += h / 5;
    return s;
  }

  // ---------- Croupier ----------
  // Distribution finale : [17, 18, 19, 20, 21, crevé, blackjack]. Avec peek, la carte cachée exclut le blackjack (distribution conditionnelle).
  // Mémoïsation : une composition est codée par les cartes retirées du sabot de base (entiers < 32 par rang, base 32).
  const P32 = [0, 1]; for (let r = 2; r <= 10; r++) P32[r] = P32[r - 1] * 32;
  // fast : le croupier tire dans le sabot tel qu'il était au moment de la décision (les cartes tirées ensuite par le joueur sont ignorées
  // pour le croupier). Écart d'EV de l'ordre du millième de mise en sabot ; sert aux calculs à la volée dans le navigateur.
  function Calc(rules, base0, fast) {
    const rl = R(rules), base = base0 || shoeOf(rl.decks), DMEMO = new Map(), PMEMO = new Map();
    let root = null, rootK = 0;
    const dd = (shoe, up) => dealerDist(fast && root ? root : shoe, up);
    const enc = (s) => { let k = 0; for (let r = 1; r <= 10; r++) k += Math.round(base[r] - s[r]) * P32[r]; return k; };
    const sub = (M, p) => { let m = M.get(p); if (!m) { m = new Map(); M.set(p, m); } return m; };
    function dealerDist(shoe, up) {
      const DM = sub(DMEMO, up), k = enc(shoe);
      let d = DM.get(k); if (d) return d;
      d = [0, 0, 0, 0, 0, 0, 0];
      const s = shoe.slice(); let N = total(s);
      const bjRank = up === 1 ? 10 : up === 10 ? 1 : 0;
      (function rec(sum, ace, n, prob) {
        const t = hv(sum, ace);
        if (n === 2 && t === 21) { d[6] += prob; return; }
        if (sum > 21) { d[5] += prob; return; }
        if (t >= 17 && !(t === 17 && rl.h17 && isSoft(sum, ace))) { d[t - 17] += prob; return; }
        let den = N; const cond = n === 1 && rl.peek && bjRank;
        if (cond) den -= s[bjRank];
        if (den <= 0) return;
        for (let r = 1; r <= 10; r++) {
          if (cond && r === bjRank) continue;
          const c = s[r]; if (c <= 0) continue;
          s[r] -= 1; N -= 1;
          rec(sum + r, ace || r === 1, n + 1, prob * c / den);
          s[r] += 1; N += 1;
        }
      })(up, up === 1, 1, 1);
      DM.set(k, d); return d;
    }
    // EV de rester avec un total t, mise m ; lostBJ : ce qui est perdu contre un blackjack du croupier (jeu sans carte cachée).
    function standEV(t, d, m, lostBJ) {
      if (t > 21) return -m;
      let ev = d[5] * m - d[6] * lostBJ;
      for (let f = 17; f <= 21; f++) ev += d[f - 17] * (t > f ? m : t < f ? -m : 0);
      return ev;
    }
    // Rester ou tirer (sans double), décisions suivantes optimales selon la composition.
    function node(shoe, up, sum, ace, lostBJ) {
      const PM = sub(PMEMO, (sum * 64 + (ace ? 32 : 0) + up + lostBJ * 1000) + (fast ? '|' + rootK : '')), k = enc(shoe);
      let v = PM.get(k); if (v) return v;
      const t = hv(sum, ace), d = dd(shoe, up), st = standEV(t, d, 1, lostBJ);
      let hit = -1;
      if (t < 21) {
        hit = 0; const N = total(shoe);
        for (let r = 1; r <= 10; r++) {
          const c = shoe[r]; if (c <= 0) continue;
          const p = c / N;
          if (sum + r > 21) { hit -= p; continue; }
          shoe[r] -= 1; const nx = node(shoe, up, sum + r, ace || r === 1, lostBJ); shoe[r] += 1;
          hit += p * Math.max(nx.stand, nx.hit);
        }
      }
      v = { stand: st, hit }; PM.set(k, v); return v;
    }
    function doubleEV(shoe, up, sum, ace, lostBJ2) {
      const N = total(shoe); let ev = 0;
      for (let r = 1; r <= 10; r++) {
        const c = shoe[r]; if (c <= 0) continue;
        const p = c / N;
        if (sum + r > 21) { ev -= 2 * p; continue; }
        shoe[r] -= 1; ev += p * standEV(hv(sum + r, ace || r === 1), dd(shoe, up), 2, lostBJ2); shoe[r] += 1;
      }
      return ev;
    }
    const canDouble = (t, soft, afterSplit) => {
      if (afterSplit && !rl.das) return false;
      if (rl.double === 'any') return true;
      if (soft) return false;
      return rl.double === '9-11' ? t >= 9 && t <= 11 : t >= 10 && t <= 11;
    };
    // Une main issue d'un split : première carte P, on tire la deuxième. Renvoie [EV si la 2e carte n'est pas P, EV de P+P joué sans split, prob. de P].
    function splitParts(shoe, up, P, lostBJ, lostBJ2) {
      const N = total(shoe); let a = 0, pP = 0, b = 0;
      for (let r = 1; r <= 10; r++) {
        const c = shoe[r]; if (c <= 0) continue;
        const p = c / N; shoe[r] -= 1;
        const sum = P + r, ace = P === 1 || r === 1, t = hv(sum, ace);
        let ev;
        if (P === 1 && !rl.hsa) ev = standEV(t, dd(shoe, up), 1, lostBJ);
        else {
          const n = node(shoe, up, sum, ace, lostBJ); ev = Math.max(n.stand, n.hit);
          if (canDouble(t, isSoft(sum, ace), true)) ev = Math.max(ev, doubleEV(shoe, up, sum, ace, lostBJ2));
        }
        if (r === P) { pP = p; b = ev; } else a += p * ev;
        shoe[r] += 1;
      }
      return { a, b, pP };
    }
    // shoe : cartes restantes, les deux cartes de la paire déjà retirées.
    function splitEV(shoe, up, P) {
      const s = shoe.slice();
      const lostBJ = rl.peek ? 0 : rl.obo ? 0.5 : 1, lostBJ2 = rl.peek ? 0 : rl.obo ? 0.5 : 2;
      const { a, b, pP } = splitParts(s, up, P, lostBJ, lostBJ2);
      const canRe = P !== 1 || rl.rsa;
      const V0 = a + pP * b;
      const V = (k) => (k <= 0 || !canRe ? V0 : a + pP * Math.max(b, 2 * V(k - 1)));
      const h = rl.maxHands;
      return h >= 4 ? 2 * V(1) : h === 3 ? V(1) + V0 : 2 * V0;
    }
    // Toutes les options d'une main de deux cartes c1, c2 contre la carte visible up. shoe : cartes restantes (c1, c2, up déjà retirées).
    // Renvoie les EV conditionnelles (peek : sachant que le croupier n'a pas blackjack) et la probabilité de blackjack du croupier.
    function actions(shoe, up, c1, c2) {
      if (fast) { root = shoe.slice(); rootK = enc(root); }
      const sum = c1 + c2, ace = c1 === 1 || c2 === 1, t = hv(sum, ace), soft = isSoft(sum, ace);
      const lostBJ = rl.peek ? 0 : 1, lostBJ2 = rl.peek ? 0 : rl.obo ? 1 : 2;
      const n = node(shoe, up, sum, ace, lostBJ), out = { stand: n.stand, hit: n.hit };
      if (canDouble(t, soft, false)) out.double = doubleEV(shoe, up, sum, ace, lostBJ2);
      if (c1 === c2 && rl.maxHands >= 2) { const sp = splitEV(shoe, up, c1); if (sp !== null) out.split = sp; }
      if (rl.surrender && rl.peek) out.surrender = -0.5;
      return out;
    }
    const pBJ = (shoe, up) => { const N = total(shoe); return up === 1 ? shoe[10] / N : up === 10 ? shoe[1] / N : 0; };
    return { rules: rl, base, dealerDist, standEV, node, actions, splitEV, pBJ, canDouble, clear() { DMEMO.clear(); PMEMO.clear(); }, size: () => [...DMEMO.values(), ...PMEMO.values()].reduce((a, m) => a + m.size, 0) };
  }

  // ---------- Stratégie de base (dépendante du total) ----------
  const UPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
  const ROWS = [];
  for (let t = 5; t <= 19; t++) ROWS.push({ id: 'h' + t, kind: 'hard', label: String(t), t });
  for (let x = 2; x <= 9; x++) ROWS.push({ id: 's' + x, kind: 'soft', label: 'A,' + x, x });
  for (const p of [2, 3, 4, 5, 6, 7, 8, 9, 10, 1]) ROWS.push({ id: 'p' + p, kind: 'pair', label: p === 1 ? 'A,A' : p === 10 ? '10,10' : p + ',' + p, p });
  // Combinaisons de deux cartes (non ordonnées) qui forment chaque ligne.
  function combosOf(row) {
    const out = [];
    if (row.kind === 'pair') return [[row.p, row.p]];
    if (row.kind === 'soft') return [[1, row.x]];
    for (let a = 2; a <= 10; a++) for (let b = a + 1; b <= 10; b++) if (a + b === row.t) out.push([a, b]);
    return out;
  }
  const ACTS = ['stand', 'hit', 'double', 'split', 'surrender'];
  const CODE = { stand: 'S', hit: 'H', double: 'D', split: 'P', surrender: 'R' };
  const NAME = { stand: 'Rester', hit: 'Tirer', double: 'Doubler', split: 'Séparer', surrender: 'Abandonner' };
  // EV moyenne de chaque action sur les combinaisons de la ligne, pondérée par leur probabilité d'être servies.
  function rowEV(calc, base, row, up) {
    const acc = {}; let wsum = 0;
    for (const [a, b] of combosOf(row)) {
      const s = base.slice(); s[up] -= 1;
      const N = total(s); let w = s[a] / N; s[a] -= 1; w *= s[b] / (N - 1); if (a !== b) w *= 2; s[b] -= 1;
      if (w <= 0 || s[a] < 0 || s[b] < 0) continue;
      const ev = calc.actions(s, up, a, b);
      for (const k of Object.keys(ev)) acc[k] = (acc[k] || 0) + w * ev[k];
      wsum += w;
    }
    for (const k of Object.keys(acc)) acc[k] /= wsum;
    return acc;
  }
  // Code d'affichage : action, puis repli si l'action n'est pas permise (double après tirage, abandon refusé).
  function decide(ev) {
    const order = Object.keys(ev).sort((x, y) => ev[y] - ev[x]), best = order[0];
    const basic = ev.stand >= ev.hit ? 'stand' : 'hit';
    let code = CODE[best];
    if (best === 'double') code = 'D' + (ev.stand >= ev.hit ? 's' : 'h');
    if (best === 'surrender') { const alt = Object.keys(ev).filter((k) => k !== 'surrender').sort((x, y) => ev[y] - ev[x])[0]; code = 'R' + CODE[alt].toLowerCase(); }
    if (best === 'split') code = 'P';
    return { best, code, basic, order };
  }
  function strategy(rules, opt = {}) {
    const calc = Calc(rules, opt.shoe, opt.fast), base = calc.base, table = {};
    for (const row of ROWS) {
      table[row.id] = {};
      for (const up of UPS) { const ev = rowEV(calc, base, row, up); table[row.id][up] = { ev, ...decide(ev) }; }
      if (opt.onRow) opt.onRow(row);
    }
    return { rules: calc.rules, table, calc };
  }

  // ---------- Avantage de la maison (joueur appliquant la stratégie de base du tableau) ----------
  function rowIdOf(a, b) {
    if (a === b) return 'p' + a;
    if (a === 1 || b === 1) return 's' + (a === 1 ? b : a);
    return 'h' + Math.min(19, a + b);
  }
  // Valeur d'une main de deux cartes jouée selon la décision du tableau (avec ses replis), sur une composition précise.
  function valueByTable(ev, st) {
    for (const k of st.order) if (ev[k] !== undefined) return ev[k];
    return Math.max(ev.stand, ev.hit);
  }
  function houseEdge(rules, opt = {}) {
    const strat = opt.strat || strategy(rules), calc = strat.calc, rl = calc.rules, base = opt.shoe || shoeOf(rl.decks);
    let ev = 0;
    const N0 = total(base);
    for (const up of UPS) {
      const pu = base[up] / N0, s1 = base.slice(); s1[up] -= 1;
      const N1 = total(s1);
      for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) {
        let w = s1[a] / N1; const s2 = s1.slice(); s2[a] -= 1; w *= s2[b] / (N1 - 1); if (a !== b) w *= 2; s2[b] -= 1;
        if (w <= 0) continue;
        const pbj = calc.pBJ(s2, up), natural = (a === 1 && b === 10);
        let v;
        if (natural) v = (1 - pbj) * rl.bj;
        else {
          const acts = calc.actions(s2, up, a, b), st = strat.table[rowIdOf(a, b)][up];
          const cond = opt.optimal ? Math.max(...Object.values(acts)) : valueByTable(acts, st);
          v = rl.peek ? pbj * -1 + (1 - pbj) * cond : cond;
        }
        ev += pu * w * v;
      }
    }
    return -ev;
  }

  // ---------- Assurance ----------
  const insuranceEV = (shoe) => { const N = total(shoe), p = shoe[10] / N; return 0.5 * (3 * p - 1); };

  // ---------- Comptage Hi-Lo ----------
  const HILO = [0, -1, 1, 1, 1, 1, 1, 0, 0, 0, -1];
  // Rang d'une carte réelle (0..51) : rang 0..12 = 2..A.
  const rankOfCard = (c) => { const r = c % 13; return r === 12 ? 1 : r >= 8 ? 10 : r + 2; };

  // Index de déviation : plus petit true count à partir duquel l'action alternative devient meilleure (ou plus grand en dessous duquel).
  function indexFor(rules, rowId, up, actA, actB, opt = {}) {
    const dl = opt.decksLeft || Math.max(1, R(rules).decks / 2), lo = opt.lo ?? -12, hi = opt.hi ?? 14;
    const row = ROWS.find((r) => r.id === rowId), diff = (tc) => {
      const s = shoeAtTC(dl, tc), calc = Calc(rules, s, opt.fast), ev = rowEV(calc, s, row, up);
      return (ev[actB] ?? -9) - (ev[actA] ?? -9);
    };
    const pts = []; for (let tc = lo; tc <= hi; tc++) pts.push([tc, diff(tc)]);
    for (let i = 1; i < pts.length; i++) {
      const [t0, d0] = pts[i - 1], [t1, d1] = pts[i];
      if ((d0 < 0) !== (d1 < 0)) { const x = t0 + (0 - d0) * (t1 - t0) / (d1 - d0); return { index: x, rising: d1 > d0, pts }; }
    }
    return { index: null, rising: null, pts };
  }
  const insuranceIndex = (decksLeft) => { for (let tc = -5; tc <= 10; tc += 0.05) { if (insuranceEV(shoeAtTC(decksLeft, tc)) >= 0) return Math.round(tc * 100) / 100; } return null; };

  // ---------- Simulation de sabot (Monte-Carlo) ----------
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Joue des mains avec un tableau de stratégie, des indices et une rampe de mises. Renvoie la série des résultats en unités.
  function simulate(cfg) {
    const rl = R(cfg.rules), rnd = rng(cfg.seed || 7), table = cfg.table, devs = cfg.devs || [], ramp = cfg.ramp || ((tc) => 1);
    const nCards = rl.decks * 52, cut = Math.floor(nCards * (cfg.pen || 0.75)), others = cfg.others || 0;
    const deck = []; for (let d = 0; d < rl.decks; d++) for (let c = 0; c < 52; c++) deck.push(rankOfCard(c));
    let pos = nCards, rc = 0;
    const shuffle = () => { for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; } pos = 0; rc = 0; };
    const draw = () => { const c = deck[pos++]; rc += HILO[c]; return c; };
    const dev = {}; for (const d of devs) (dev[d.row + '|' + d.up] ||= []).push(d);
    const actOf = (rowId, up, tc, avail) => {
      const st = table[rowId][up]; let order = st.order.slice();
      const ds = dev[rowId + '|' + up];
      if (ds && cfg.useIndices) for (const d of ds) { const on = d.dir > 0 ? tc >= d.index : tc < d.index; if (on) order = [d.act].concat(order.filter((x) => x !== d.act)); }
      for (const k of order) if (avail[k]) return k;
      return 'stand';
    };
    const hardRow = (t) => 'h' + Math.max(5, Math.min(19, t));
    let hands = 0, units = 0, sumBet = 0, sum2 = 0; const tcHist = {};
    const res = new Float64Array(cfg.hands);
    while (hands < cfg.hands) {
      if (pos >= cut || pos === nCards) shuffle();
      const decksLeft = Math.max(0.5, (nCards - pos) / 52), tcRaw = rc / decksLeft, tc = Math.trunc(tcRaw);
      const bet = ramp(tc); tcHist[tc] = (tcHist[tc] || 0) + 1;
      const p1 = draw(), up = draw(), p2 = draw(); const hole = rl.peek ? draw() : 0;
      for (let o = 0; o < others; o++) { draw(); draw(); if (rnd() < 0.5) draw(); }
      let result = 0;
      // Assurance avec les indices : prise à TC ≥ index.
      let ins = 0;
      if (up === 1 && cfg.useIndices && cfg.insIndex != null && tcRaw >= cfg.insIndex) ins = bet / 2;
      const dBJ = rl.peek ? ((up === 1 && hole === 10) || (up === 10 && hole === 1)) : false;
      const pBJ = (p1 === 1 && p2 === 10) || (p1 === 10 && p2 === 1);
      if (ins) result += dBJ ? 2 * ins : -ins;
      if (rl.peek && dBJ) { result += pBJ ? 0 : -bet; }
      else if (pBJ) {
        let hole2 = hole; if (!rl.peek) hole2 = draw();
        const dn = (up === 1 && hole2 === 10) || (up === 10 && hole2 === 1);
        result += dn ? 0 : rl.bj * bet;
      } else {
        // Joue les mains du joueur.
        const handsP = [{ cards: [p1, p2], bet, split: false, done: false, isAces: false }];
        let nH = 1;
        for (let i = 0; i < handsP.length; i++) {
          const h = handsP[i];
          while (!h.done) {
            const cs = h.cards, sum = cs.reduce((a, b) => a + b, 0), ace = cs.includes(1), t = hv(sum, ace);
            if (t >= 21) { h.done = true; break; }
            if (h.isAces && !rl.hsa) { if (cs.length === 2) { h.done = true; break; } }
            const two = cs.length === 2, soft = isSoft(sum, ace);
            const isPair = two && cs[0] === cs[1];
            const rowId = isPair ? 'p' + cs[0] : soft ? 's' + Math.min(9, t - 11) : hardRow(t);
            const effRow = rowId;
            const tcNow = Math.trunc(rc / Math.max(0.5, (nCards - pos) / 52));
            let act = 'stand';
            if (effRow && table[effRow]) {
              const okDouble = two && (rl.double === 'any' ? true : !soft && (rl.double === '9-11' ? t >= 9 && t <= 11 : t >= 10 && t <= 11)) && (!h.split || rl.das);
              const okSplit = isPair && nH < rl.maxHands && (cs[0] !== 1 || !h.split || rl.rsa);
              const okSur = two && !h.split && rl.surrender && rl.peek;
              act = actOf(effRow, up, tcNow, { stand: true, hit: true, double: okDouble, split: okSplit, surrender: okSur });
              if (soft && !two && (act === 'stand' || act === 'hit')) { /* soft multi-cartes : la ligne soft s'applique */ }
            } else if (soft && t < 20) act = 'hit';
            if (act === 'stand') h.done = true;
            else if (act === 'hit') cs.push(draw());
            else if (act === 'double') { h.bet *= 2; cs.push(draw()); h.done = true; h.doubled = true; }
            else if (act === 'surrender') { h.surr = true; h.done = true; }
            else if (act === 'split') {
              const P = cs[0]; nH++;
              const nh = { cards: [P, draw()], bet: h.bet, split: true, done: false, isAces: P === 1 };
              h.cards = [P, draw()]; h.split = true; h.isAces = P === 1;
              handsP.push(nh);
            }
          }
        }
        // Croupier.
        const live = handsP.filter((h) => !h.surr && hv(h.cards.reduce((a, b) => a + b, 0), h.cards.includes(1)) <= 21);
        const dc = [up, rl.peek ? hole : draw()];
        const dn2 = !rl.peek && ((up === 1 && dc[1] === 10) || (up === 10 && dc[1] === 1));
        if (!dn2 && live.length) {
          for (;;) { const s = dc.reduce((a, b) => a + b, 0), a = dc.includes(1), t = hv(s, a); if (t > 17 || (t === 17 && !(rl.h17 && isSoft(s, a)))) break; dc.push(draw()); }
        }
        const ds = dc.reduce((a, b) => a + b, 0), dt = hv(ds, dc.includes(1));
        let obPaid = false;
        for (const h of handsP) {
          if (h.surr) { result -= h.bet / 2; continue; }
          const t = hv(h.cards.reduce((a, b) => a + b, 0), h.cards.includes(1));
          if (t > 21) { result -= h.bet; continue; }
          if (dn2) { if (rl.obo) { if (!obPaid) { result -= bet; obPaid = true; } } else result -= h.bet; continue; }
          if (dt > 21 || t > dt) result += h.bet; else if (t < dt) result -= h.bet;
        }
      }
      res[hands] = result; units += result; sumBet += bet; sum2 += result * result; hands++;
    }
    const mean = units / hands, sd = Math.sqrt(Math.max(0, sum2 / hands - mean * mean));
    return { hands, units, mean, sd, avgBet: sumBet / hands, edge: units / sumBet, res, tcHist };
  }

  // Risque de ruine (approximation diffusion) : exp(−2 · μ · B / σ²) avec μ, σ par main en unités.
  const riskOfRuin = (mu, sd, bank) => (mu <= 0 ? 1 : Math.exp(-2 * mu * bank / (sd * sd)));

  const BJ = { RULES, PRESETS, R, shoeOf, shoeAtTC, total, hv, isSoft, Calc, UPS, ROWS, combosOf, ACTS, CODE, NAME, rowEV, decide, strategy, rowIdOf, houseEdge, insuranceEV, insuranceIndex, HILO, rankOfCard, indexFor, rng, simulate, riskOfRuin };
  if (typeof module !== 'undefined' && module.exports) module.exports = BJ; else root.BJ = BJ;
})(typeof window !== 'undefined' ? window : globalThis);
