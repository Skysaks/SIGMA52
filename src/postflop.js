// Solveur postflop SIGMA 52 — Discounted CFR (Brown & Sandholm 2019) vectorisé par main, deux joueurs, arbre de mises configurable.
// River : exact. Turn : exact (les 46 rivers). Flop : exact possible mais lourd ; par défaut, échantillon stratifié de turns et de rivers (approché).
// Convention de gain : le pot de départ est mort. À l'abattage, le gagnant reçoit pot de départ + mise adverse, le perdant perd sa mise.
// EV affichée = part du pot de départ que la main récupère en moyenne (somme des EV des deux ranges = pot de départ).
(function (root) {
  const E = root.Engine || require('./engine.js');
  const OOP = 0, IP = 1;
  const ACT = 0, CHANCE = 1, FOLD = 2, SHOW = 3;
  const STREET = ['flop', 'turn', 'river'];

  // ---- Ranges pondérées : "AA, KK:0.5, AKs:50%, AhKh, 76s-54s:0.25" ----
  const keyOf = (a, b) => (a > b ? a * 52 + b : b * 52 + a);
  function parseWeighted(str, dead = []) {
    const d = new Set(dead), map = new Map();
    for (const raw of String(str || '').split(/[\s,;]+/).filter(Boolean)) {
      let tok = raw, w = 1;
      const m = raw.match(/^(.+?)[:@]([\d.]+)(%?)$/);
      if (m) { tok = m[1]; w = +m[2]; if (m[3] || w > 1) w /= 100; }
      if (!(w >= 0 && w <= 1)) throw new Error('Poids illisible : ' + raw);
      let list;
      if (/^[2-9tjqka][shdc][2-9tjqka][shdc]$/i.test(tok)) { const [a, b] = E.parseCards(tok); if (a === b) throw new Error('Combo illisible : ' + raw); list = [[a, b]]; }
      else list = [...E.parseRange(tok)].flatMap((h) => E.combos(h));
      for (const [a, b] of list) { if (d.has(a) || d.has(b)) continue; if (w > 0) map.set(keyOf(a, b), w); else map.delete(keyOf(a, b)); }
    }
    return [...map].map(([k, w]) => [Math.floor(k / 52), k % 52, w]);
  }
  // Range pondérée -> texte compact (mains abstraites quand tous les combos ont le même poids).
  function rangeText(hands) {
    const by = new Map();
    for (const [a, b, w] of hands) { const h = E.abstractOf(a, b); if (!by.has(h)) by.set(h, []); by.get(h).push([a, b, w]); }
    const out = [];
    for (const h of E.ALL169) {
      const l = by.get(h); if (!l) continue;
      const full = E.combos(h).length, w0 = l[0][2];
      if (l.length === full && l.every((x) => Math.abs(x[2] - w0) < 1e-9)) out.push(w0 === 1 ? h : `${h}:${+w0.toFixed(3)}`);
      else for (const [a, b, w] of l) out.push(E.cardStr(a) + E.cardStr(b) + (w === 1 ? '' : ':' + +w.toFixed(3)));
    }
    return out.join(', ');
  }

  // ---- Tailles : "33 75 a" (en % du pot ; a = tapis) ----
  const parseSizes = (s) => (Array.isArray(s) ? s : String(s || '').split(/[\s,;]+/).filter(Boolean)).map((x) => (/^(a|ai|allin|tapis)$/i.test(String(x)) ? 'a' : +String(x).replace('%', ''))).filter((x) => x === 'a' || x > 0);
  const DEFAULT_SIZES = {
    flop: [{ bet: [], raise: [] }, { bet: [33, 75], raise: [] }],
    turn: [{ bet: [], raise: [] }, { bet: [66], raise: [] }],
    river: [{ bet: [], raise: [] }, { bet: [66], raise: [] }],
  };

  // Rand reproductible.
  const rng = E.rng;
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Échantillon stratifié de cartes : une par rang tant que possible, couleurs tournantes en commençant par celles du board.
  function sampleCards(deck, board, k, seed, must = []) {
    if (!k || k >= deck.length) return deck.slice();
    const R = rng(seed), suitCnt = [0, 0, 0, 0]; board.forEach((c) => suitCnt[c & 3]++);
    const suitOrder = [0, 1, 2, 3].sort((a, b) => suitCnt[b] - suitCnt[a] || a - b);
    const ranks = [...new Set(deck.map((c) => c >> 2))].sort((a, b) => b - a);
    // Mélange léger des rangs pour ne pas toujours garder les mêmes quand k < 13.
    for (let i = ranks.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ranks[i], ranks[j]] = [ranks[j], ranks[i]]; }
    const pick = must.filter((c) => deck.includes(c)), used = new Set(pick); let turn = 0;
    while (pick.length < k) {
      let added = false;
      for (const r of ranks) {
        if (pick.length >= k) break;
        for (let t = 0; t < 4; t++) {
          const s = suitOrder[(turn + t) % 4], c = (r << 2) | s;
          if (!used.has(c) && deck.includes(c)) { pick.push(c); used.add(c); added = true; turn++; break; }
        }
      }
      if (!added) break;
    }
    return pick.sort((a, b) => b - a);
  }

  // =====================================================================================
  function create(cfg) {
    const board = (Array.isArray(cfg.board) ? cfg.board : E.parseCards(cfg.board)).slice();
    if (board.length < 3 || board.length > 5) throw new Error('Board de 3 à 5 cartes');
    if (new Set(board).size !== board.length) throw new Error('Carte du board en double');
    const P0 = +cfg.pot, S = +cfg.stack;
    // Rake : part du pot final, plafonnée (cfg.rake = { pct: 0.05, cap: 3 } en jetons) ; prélevé sur le pot gagné.
    const RK = cfg.rake && +cfg.rake.pct > 0 ? { pct: +cfg.rake.pct, cap: +cfg.rake.cap > 0 ? +cfg.rake.cap : Infinity } : null;
    const rakeOf = (C) => (RK ? Math.min(RK.cap, RK.pct * (P0 + C[0] + C[1])) : 0);
    // ICM (tournoi) : cfg.icm = { stacks: tapis de tous les joueurs au début de la rue (jetons derrière), seats: [siège OOP, siège IP], payouts }.
    // Les gains d'une issue deviennent la variation d'équité ICM (Malmuth-Harville), exprimée en jetons équivalents
    // (× jetons totaux / prix totaux) et comptée depuis l'issue « je perds le pot sans rien remettre ».
    const IC = cfg.icm && cfg.icm.payouts?.length && cfg.icm.stacks?.length && cfg.icm.seats ? cfg.icm : null;
    let icmK = 1, icmBase = null;
    const icmEq = (st) => { const n = st.length, pay = IC.payouts, val = new Array(n).fill(0), prob = new Map([[0, 1]]); const pc = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; }; const order = [...Array(1 << n).keys()].sort((a, b) => pc(a) - pc(b)); for (const mask of order) { const pr = prob.get(mask); if (!pr) continue; const k = pc(mask); if (k >= pay.length || k >= n) continue; let rest = 0; for (let i = 0; i < n; i++) if (!(mask & (1 << i)) && st[i] > 0) rest += st[i]; if (!rest) continue; for (let i = 0; i < n; i++) if (!(mask & (1 << i)) && st[i] > 0) { const q = (pr * st[i]) / rest; val[i] += q * pay[k]; const m2 = mask | (1 << i); prob.set(m2, (prob.get(m2) || 0) + q); } } return val; };
    const icmU = (p, mine, his) => { const st = IC.stacks.slice(); st[IC.seats[p]] = Math.max(0, mine); st[IC.seats[1 - p]] = Math.max(0, his); return icmEq(st)[IC.seats[p]] * icmK; };
    if (IC) { const tot = IC.stacks.reduce((a, b) => a + b, 0) + P0, pz = IC.payouts.reduce((a, b) => a + b, 0); icmK = pz > 0 ? tot / pz : 1; icmBase = [0, 1].map((p) => icmU(p, IC.stacks[IC.seats[p]], IC.stacks[IC.seats[1 - p]] + P0)); }
    // Valeurs d'une issue terminale pour p : [gagne, perd, partage], en ICM.
    function icmVals(node, p) {
      if (!node.iv) node.iv = [];
      if (node.iv[p]) return node.iv[p];
      const o = 1 - p, sp = IC.stacks[IC.seats[p]], so = IC.stacks[IC.seats[o]], C = node.C, rk = rakeOf(C), b = icmBase[p];
      return (node.iv[p] = [icmU(p, sp + P0 + C[o] - rk, so - C[o]) - b, icmU(p, sp - C[p], so + P0 + C[p] - rk) - b, icmU(p, sp - C[p] + (P0 + C[0] + C[1] - rk) / 2, so - C[o] + (P0 + C[0] + C[1] - rk) / 2) - b]);
    }
    if (!(P0 > 0)) throw new Error('Pot invalide');
    if (!(S >= 0)) throw new Error('Tapis invalide');
    const thr = cfg.allinThreshold ?? 0.67;          // une mise qui engage ≥ 67 % du tapis restant devient un tapis
    const maxRaises = cfg.maxRaises ?? 2;
    const sizes = {};
    for (const st of STREET) sizes[st] = [0, 1].map((p) => { const s = cfg.sizes?.[st]?.[p] || DEFAULT_SIZES[st][p]; return { bet: parseSizes(s.bet), raise: parseSizes(s.raise) }; });
    const sample = cfg.sample || null;                // { turn: k, river: k } : échantillon de cartes pour les solves flop
    const hands = [0, 1].map((p) => { const r = cfg.ranges[p]; return Array.isArray(r) ? r.filter(([a, b]) => !board.includes(a) && !board.includes(b)) : parseWeighted(r, board); });
    if (!hands[0].length || !hands[1].length) throw new Error('Range vide après retrait des cartes du board');
    const N = [hands[0].length, hands[1].length];
    const c1 = hands.map((l) => Uint8Array.from(l, (x) => x[0])), c2 = hands.map((l) => Uint8Array.from(l, (x) => x[1]));
    const w0 = hands.map((l) => Float64Array.from(l, (x) => x[2]));
    // Même combo chez l'adversaire (pour l'inclusion-exclusion des cartes).
    const same = [0, 1].map((p) => { const o = 1 - p, idx = new Map(); hands[o].forEach(([a, b], i) => idx.set(keyOf(a, b), i)); return Int32Array.from(hands[p], ([a, b]) => idx.get(keyOf(a, b)) ?? -1); });
    // Mains contenant la carte k.
    const withCard = [0, 1].map((p) => { const l = Array.from({ length: 52 }, () => []); hands[p].forEach(([a, b], i) => { l[a].push(i); l[b].push(i); }); return l.map((x) => Int32Array.from(x)); });

    // ---- Isomorphisme de couleurs : permutations σ des couleurs qui laissent les deux ranges inchangées (poids compris). ----
    // À un nœud de hasard, les cartes images l'une de l'autre par une σ qui fixe le board donnent des sous-arbres identiques
    // à une permutation des mains près : on ne calcule que le représentant de chaque orbite (exact, pas une approximation).
    const PERMS = []; (function gen(a, l) { if (!l.length) { PERMS.push(a); return; } l.forEach((x, i) => gen([...a, x], l.filter((_, j) => j !== i))); })([], [0, 1, 2, 3]);
    const sc = (c, sg) => (c & ~3) | sg[c & 3];
    const handIdx = [0, 1].map((p) => { const m = new Map(); hands[p].forEach(([a, b], i) => m.set(keyOf(a, b), i)); return m; });
    const SYM = cfg.iso === false || cfg.include ? [] : PERMS.slice(1).map((sg) => {
      const hp = [0, 1].map((p) => { const out = new Int32Array(N[p]); for (let i = 0; i < N[p]; i++) { const [a, b, w] = hands[p][i], j = handIdx[p].get(keyOf(sc(a, sg), sc(b, sg))); if (j === undefined || Math.abs(hands[p][j][2] - w) > 1e-9) return null; out[i] = j; } return out; });
      return hp[0] && hp[1] ? { sg, hp, inv: sg.map((_, s2) => sg.indexOf(s2)) } : null;
    }).filter(Boolean);
    const stab = (cards) => { const set = new Set(cards); return SYM.filter((x) => cards.every((c) => set.has(sc(c, x.sg)))); };
    // ---- Boards de river : forces des mains ----
    const boards = [], boardId = new Map();
    function boardOf(cards) {
      const k = cards.slice().sort((a, b) => a - b).join('.');
      if (boardId.has(k)) return boardId.get(k);
      const id = boards.length, str = [], ord = [];
      for (let p = 0; p < 2; p++) {
        const s = new Int32Array(N[p]);
        for (let i = 0; i < N[p]; i++) { const a = c1[p][i], b = c2[p][i]; s[i] = cards.includes(a) || cards.includes(b) ? -1 : E.evaluate([a, b, ...cards]); }
        str.push(s); ord.push(Int32Array.from([...Array(N[p]).keys()].sort((x, y) => s[x] - s[y])));
      }
      // Tableaux triés par force : force, cartes et index, pour des balayages sans double indirection.
      const ss = [0, 1].map((p) => Int32Array.from(ord[p], (i) => str[p][i]));
      const s1 = [0, 1].map((p) => Uint8Array.from(ord[p], (i) => c1[p][i])), s2 = [0, 1].map((p) => Uint8Array.from(ord[p], (i) => c2[p][i]));
      boards.push({ cards: cards.slice(), str, ord, ss, s1, s2 }); boardId.set(k, id); return id;
    }
    // Cartes distribuées après un board donné (identiques pour tous les nœuds de hasard de ce board).
    const nextCards = new Map();
    function dealCards(cur) {
      const k = cur.slice().sort((a, b) => a - b).join('.');
      if (nextCards.has(k)) return nextCards.get(k);
      const deck = []; for (let c = 51; c >= 0; c--) if (!cur.includes(c)) deck.push(c);
      const kk = cur.length === 3 ? sample?.turn : sample?.river;
      // Orbites des cartes sous les permutations qui fixent ce board ; l'échantillon porte sur les représentants (couverture plus large à coût égal).
      const st = stab(cur), orbit = new Map(), repsOf = [];
      for (const c of deck) { if (orbit.has(c)) continue; const g = { k: c, mem: [] }; orbit.set(c, g); repsOf.push(c); for (const x of st) { const m = sc(c, x.sg); if (!orbit.has(m)) { orbit.set(m, g); g.mem.push({ k: m, hp: x.hp }); } } }
      const pickR = st.length ? sampleCards(repsOf, cur, kk, hashStr(k) ^ (cfg.seed || 7), (cfg.include || []).map((c) => orbit.get(c)?.k).filter((c) => c !== undefined)) : sampleCards(deck, cur, kk, hashStr(k) ^ (cfg.seed || 7), cfg.include || []);
      const groups = pickR.map((c) => orbit.get(c) || { k: c, mem: [] }), cards = groups.flatMap((g) => [g.k, ...g.mem.map((m) => m.k)]).sort((a, b) => b - a);
      // Poids par main : exact si toutes les cartes sont distribuées, normalisé par main sinon.
      const D = deck.length, w = [0, 1].map((p) => {
        const out = new Float64Array(N[p]), set = new Set(cards);
        for (let i = 0; i < N[p]; i++) { const inS = (set.has(c1[p][i]) ? 1 : 0) + (set.has(c2[p][i]) ? 1 : 0), n = cards.length - inS; out[i] = n > 0 ? (D - 2) / ((D - 4) * n) : 0; }
        return out;
      });
      const r = { cards, groups, w, exact: cards.length === deck.length }; nextCards.set(k, r); return r;
    }

    // ---- Construction de l'arbre ----
    const nodes = [];
    let approx = false;
    function mk(n) { n.id = nodes.length; nodes.push(n); return n; }
    const r2 = (x) => Math.round(x * 100) / 100;
    function actNode(st) {
      const { p, street, cards, C, bets, nr } = st, o = 1 - p;
      const pot = P0 + C[0] + C[1], left = S - C[p], toCall = bets[o] - bets[p];
      const acts = [];
      const push = (a) => { if (!acts.some((x) => x.k === a.k && Math.abs(x.to - a.to) < 1e-6)) acts.push(a); };
      const sz = sizes[STREET[street]][p];
      if (toCall <= 1e-9) {
        push({ k: 'x', to: bets[p] });
        if (left > 1e-9) for (const s of sz.bet) {
          let amt = s === 'a' ? left : Math.max(Math.min(1, left), r2((s / 100) * pot));
          if (amt >= thr * left || amt > left) amt = left;
          push({ k: amt >= left - 1e-9 ? 'a' : 'b', to: bets[p] + amt, pct: s === 'a' ? null : s });
        }
      } else {
        push({ k: 'f', to: bets[p] });
        push({ k: 'c', to: Math.min(bets[o], bets[p] + left) });
        const oLeft = S - C[o];
        if (nr < maxRaises && oLeft > 1e-9 && left > toCall + 1e-9) for (const s of sz.raise) {
          let to = s === 'a' ? bets[p] + left : r2(bets[o] + (s / 100) * (pot + toCall));
          to = Math.max(to, bets[o] + toCall);
          if (to - bets[p] >= thr * left || to - bets[p] > left) to = bets[p] + left;
          push({ k: to - bets[p] >= left - 1e-9 ? 'a' : 'r', to, pct: s === 'a' ? null : s });
        }
      }
      // Tri : passif d'abord, puis par montant.
      const rank = { f: 0, x: 1, c: 2, b: 3, r: 3, a: 4 };
      acts.sort((a, b) => rank[a.k] - rank[b.k] || a.to - b.to);
      const node = mk({ t: ACT, p, street, board: cards, C: C.slice(), bets: bets.slice(), pot, acts, ch: [] });
      for (const a of acts) node.ch.push(after(st, a));
      node.reg = new Float32Array(acts.length * N[p]); node.sum = new Float32Array(acts.length * N[p]);
      return node;
    }
    function after(st, a) {
      const { p, street, cards, C, bets, nr } = st, o = 1 - p;
      if (a.k === 'f') return mk({ t: FOLD, winner: o, C: C.slice(), board: cards });
      if (a.k === 'x') {
        if (p === OOP) return actNode({ ...st, p: IP });
        return endStreet(st, C);
      }
      const C2 = C.slice(), b2 = bets.slice(); C2[p] += a.to - bets[p]; b2[p] = a.to;
      if (a.k === 'c') return endStreet(st, C2);
      return actNode({ p: o, street, cards, C: C2, bets: b2, nr: a.k === 'b' || (a.k === 'a' && bets[o] === 0) ? nr : nr + 1 });
    }
    function endStreet(st, C) {
      if (st.street === 2) return mk({ t: SHOW, C: C.slice(), bid: boardOf(st.cards), board: st.cards });
      const allin = S - C[0] <= 1e-9 || S - C[1] <= 1e-9;
      return chanceNode(st.cards, C, allin);
    }
    function chanceNode(cur, C, allin) {
      const d = dealCards(cur); if (!d.exact) approx = true;
      const node = mk({ t: CHANCE, board: cur, C: C.slice(), cards: d.cards, w: d.w, ch: [], street: cur.length - 2, grp: [] });
      const childOf = new Map();
      for (const g of d.groups) {
        const nb = [...cur, g.k];
        const child = allin ? (nb.length === 5 ? mk({ t: SHOW, C: C.slice(), bid: boardOf(nb), board: nb }) : chanceNode(nb, C, true)) : actNode({ p: OOP, street: nb.length - 3, cards: nb, C: C.slice(), bets: [0, 0], nr: 0 });
        childOf.set(g.k, child); for (const m of g.mem) childOf.set(m.k, child);
        node.grp.push({ k: g.k, mem: g.mem });
      }
      node.ch = node.cards.map((c) => childOf.get(c));
      // Carte membre d'une orbite -> représentant et permutation des mains (pour la navigation).
      node.alias = new Map(); for (const g of d.groups) for (const m of g.mem) { const x = SYM.find((y) => y.hp === m.hp); node.alias.set(m.k, { rep: g.k, sym: x }); }
      return node;
    }
    const rootNode = S <= 1e-9
      ? (board.length === 5 ? mk({ t: SHOW, C: [0, 0], bid: boardOf(board), board }) : chanceNode(board, [0, 0], true))
      : actNode({ p: OOP, street: board.length - 3, cards: board, C: [0, 0], bets: [0, 0], nr: 0 });

    // ---- Tampons réutilisables ----
    const pool = [[], []];
    const get = (p) => pool[p].pop() || new Float64Array(N[p]);
    const rel = (p, b) => pool[p].push(b);
    const cardBuf = new Float64Array(52), cardTot = new Float64Array(52);

    // Somme de la reach adverse compatible avec chaque main de p.
    function compat(p, ro, out) {
      const o = 1 - p; let tot = 0; cardTot.fill(0);
      for (let j = 0; j < N[o]; j++) { const r = ro[j]; if (r) { tot += r; cardTot[c1[o][j]] += r; cardTot[c2[o][j]] += r; } }
      const sm = same[p], a1 = c1[p], a2 = c2[p];
      for (let i = 0; i < N[p]; i++) out[i] = tot - cardTot[a1[i]] - cardTot[a2[i]] + (sm[i] >= 0 ? ro[sm[i]] : 0);
      return out;
    }
    function foldVal(node, p, ro) {
      const out = compat(p, ro, get(p)), v = IC ? icmVals(node, p)[node.winner === p ? 0 : 1] : node.winner === p ? P0 + node.C[1 - p] - rakeOf(node.C) : -node.C[p];
      for (let i = 0; i < N[p]; i++) out[i] *= v;
      return out;
    }
    // Abattage : masse adverse battue / gagnante / à égalité, avec retrait des cartes partagées.
    function showMass(node, p, ro, win, lose) {
      const o = 1 - p, B = boards[node.bid], op = B.ord[p], oo = B.ord[o], sp = B.ss[p], so = B.ss[o];
      const a1 = B.s1[p], a2 = B.s2[p], b1 = B.s1[o], b2 = B.s2[o], np = N[p], no = N[o], cb = cardBuf;
      // Les mains adverses de force -1 (bloquées par le board) sont en tête de tri et ont une reach nulle.
      let cum = 0, j = 0; cb.fill(0);
      for (let i = 0; i < np; i++) {
        const s = sp[i];
        while (j < no && so[j] < s) { const r = ro[oo[j]]; if (r !== 0) { cum += r; cb[b1[j]] += r; cb[b2[j]] += r; } j++; }
        win[op[i]] = cum - cb[a1[i]] - cb[a2[i]];
      }
      cum = 0; j = no - 1; cb.fill(0);
      for (let i = np - 1; i >= 0; i--) {
        const s = sp[i];
        while (j >= 0 && so[j] > s) { const r = ro[oo[j]]; if (r !== 0) { cum += r; cb[b1[j]] += r; cb[b2[j]] += r; } j--; }
        lose[op[i]] = cum - cb[a1[i]] - cb[a2[i]];
      }
    }
    function showVal(node, p, ro) {
      const rk = rakeOf(node.C), out = compat(p, ro, get(p)), win = get(p), lose = get(p), c = node.C[p], iv = IC ? icmVals(node, p) : null, vw = iv ? iv[0] : P0 + c - rk, vl = iv ? iv[1] : -c, vt = iv ? iv[2] : (P0 - rk) / 2;
      showMass(node, p, ro, win, lose);
      for (let i = 0; i < N[p]; i++) out[i] = vw * win[i] + vl * lose[i] + vt * (out[i] - win[i] - lose[i]);
      rel(p, win); rel(p, lose);
      return out;
    }
    // Stratégie courante (regret matching) ou moyenne.
    const tmpS = [new Float64Array(N[0]), new Float64Array(N[1])];
    function current(node, out) {
      const n = N[node.p], A = node.acts.length, reg = node.reg;
      if (node.lock) { out.set(node.lock); return out; }
      const s = tmpS[node.p]; s.fill(0);
      for (let a = 0; a < A; a++) { const b = a * n; for (let i = 0; i < n; i++) { const r = reg[b + i]; if (r > 0) s[i] += r; } }
      const u = 1 / A;
      for (let a = 0; a < A; a++) { const b = a * n; for (let i = 0; i < n; i++) { const r = reg[b + i], t = s[i]; out[b + i] = t > 0 ? (r > 0 ? r / t : 0) : u; } }
      return out;
    }
    // Profil de joueur sur tout l'arbre : à partir de la stratégie moyenne actuelle (l'équilibre), chaque nœud du joueur profilé
    // est figé sur une version déformée par des transferts de probabilité entre types d'action, main par main :
    // fp = part du couché transférée au passif (check / call), pf = passif -> couché, pa = passif -> agressif (mise, relance),
    // ap = agressif -> passif. La masse reçue se répartit au prorata des actions déjà jouées du groupe (la plus petite mise sinon).
    // L'autre joueur continue d'apprendre : sa stratégie moyenne repart de zéro (regrets conservés) pour refléter la meilleure réponse.
    // (Déformer la stratégie en cours d'apprentissage ne servirait à rien : le regret matching compenserait la déformation.)
    const grpOf = (a) => (a.k === 'f' ? 0 : a.k === 'x' || a.k === 'c' ? 1 : 2);
    function deform(node, out, pr) {
      const n = N[node.p], A = node.acts.length, G = node.acts.map(grpOf), first = [0, 1, 2].map((g) => G.indexOf(g));
      const moves = [[0, 1, pr.fp || 0], [1, 0, pr.pf || 0], [1, 2, pr.pa || 0], [2, 1, pr.ap || 0]].filter(([x, y, t]) => t > 0 && first[x] >= 0 && first[y] >= 0);
      if (!moves.length) return false;
      const m = new Float64Array(3), d = new Float64Array(3);
      for (let i = 0; i < n; i++) {
        m.fill(0); for (let a = 0; a < A; a++) m[G[a]] += out[a * n + i];
        d.fill(0); for (const [x, y, t] of moves) { const v = m[x] * t; d[x] -= v; d[y] += v; }
        for (let g = 0; g < 3; g++) {
          if (first[g] < 0 || d[g] === 0) continue;
          if (m[g] > 1e-12) { const f = (m[g] + d[g]) / m[g]; for (let a = 0; a < A; a++) if (G[a] === g) out[a * n + i] *= f; }
          else out[first[g] * n + i] += d[g];
        }
      }
      return true;
    }
    function applyProfile(p, pr) {
      let k = 0;
      for (const node of nodes) {
        if (node.t !== ACT) continue;
        if (node.p === p) {
          if (node.lock && !node.profLock) continue; // verrou manuel prioritaire
          if (node.profLock) { node.lock = null; node.profLock = false; }
          if (!pr) continue;
          const out = average(node, new Float64Array(node.acts.length * N[p]));
          if (deform(node, out, pr)) { node.lock = out; node.profLock = true; k++; }
        } else if (pr) node.sum.fill(0);
      }
      return k;
    }
    function average(node, out) {
      const n = N[node.p], A = node.acts.length;
      if (node.lock) { out.set(node.lock); return out; }
      for (let i = 0; i < n; i++) {
        let s = 0; for (let a = 0; a < A; a++) s += node.sum[a * n + i];
        if (s > 0) for (let a = 0; a < A; a++) out[a * n + i] = node.sum[a * n + i] / s;
        else return current(node, out); // nœud jamais visité : stratégie courante
      }
      return out;
    }
    const strat = new Map(); // tampons de stratégie par nœud
    const sbuf = (node) => { let b = strat.get(node.id); if (!b) { b = new Float32Array(node.acts.length * N[node.p]); strat.set(node.id, b); } return b; };

    function maskCopy(p, src, k) { const b = get(p); b.set(src); const l = withCard[p][k]; for (let i = 0; i < l.length; i++) b[l[i]] = 0; return b; }

    // Parcours générique. mode : 0 = CFR (mise à jour), 1 = meilleure réponse, 2 = évaluation des stratégies moyennes.
    let it = 0, dPos = 1, dNeg = 1, dSum = 1;
    function walk(node, p, rp, ro, mode) {
      const o = 1 - p;
      if (node.t === FOLD) return foldVal(node, p, ro);
      if (node.t === SHOW) return showVal(node, p, ro);
      if (node.t === CHANCE) {
        const out = get(p); out.fill(0);
        const w = node.w[p], np = N[p];
        for (const g of node.grp) {
          const k = g.k, rp2 = maskCopy(p, rp, k), ro2 = maskCopy(o, ro, k);
          const v = walk(node.ch[node.cards.indexOf(k)], p, rp2, ro2, mode);
          const l = withCard[p][k]; for (let i = 0; i < l.length; i++) v[l[i]] = 0;
          for (let i = 0; i < np; i++) out[i] += v[i] * w[i];
          // Membres de l'orbite : même sous-arbre, mains permutées (v_m(σ(i)) = v_rep(i)).
          for (const m of g.mem) { const hp = m.hp[p]; for (let i = 0; i < np; i++) { const j = hp[i]; out[j] += v[i] * w[j]; } }
          rel(p, v); rel(p, rp2); rel(o, ro2);
        }
        return out;
      }
      const q = node.p, A = node.acts.length, n = N[q];
      const sg = mode === 0 ? current(node, sbuf(node)) : average(node, sbuf(node));
      if (q === p) {
        const out = get(p); out.fill(mode === 1 ? -Infinity : 0);
        const vals = mode === 0 ? [] : null;
        for (let a = 0; a < A; a++) {
          const rp2 = get(p); for (let i = 0; i < n; i++) rp2[i] = rp[i] * sg[a * n + i];
          const v = walk(node.ch[a], p, rp2, ro, mode);
          rel(p, rp2);
          if (mode === 1) { for (let i = 0; i < n; i++) if (v[i] > out[i]) out[i] = v[i]; rel(p, v); }
          else { for (let i = 0; i < n; i++) out[i] += sg[a * n + i] * v[i]; if (vals) vals.push(v); else rel(p, v); }
        }
        if (mode === 0 && !node.lock) {
          const reg = node.reg, sum = node.sum, dp = dPos, dn = dNeg, ds = dSum;
          for (let a = 0; a < A; a++) {
            const v = vals[a], base = a * n;
            for (let i = 0; i < n; i++) {
              const r = reg[base + i];
              reg[base + i] = (r > 0 ? r * dp : r * dn) + v[i] - out[i];
              sum[base + i] = sum[base + i] * ds + rp[i] * sg[base + i];
            }
            rel(p, v);
          }
        } else if (vals) vals.forEach((v) => rel(p, v));
        return out;
      }
      // Nœud adverse : la reach adverse est découpée par action.
      const sgo = sg;
      const out = get(p); out.fill(0);
      for (let a = 0; a < A; a++) {
        const ro2 = get(o); let any = false;
        for (let i = 0; i < n; i++) { const r = ro[i] * sgo[a * n + i]; ro2[i] = r; if (r) any = true; }
        if (any || mode !== 0) { const v = walk(node.ch[a], p, rp, ro2, mode); for (let i = 0; i < N[p]; i++) out[i] += v[i]; rel(p, v); }
        rel(o, ro2);
      }
      return out;
    }

    const ALPHA = 1.5, BETA = 0.5, GAMMA = 3;
    function iterate(k = 1) {
      for (let s = 0; s < k; s++) {
        it++;
        const ta = Math.pow(it, ALPHA), tb = Math.pow(it, BETA);
        dPos = ta / (ta + 1); dNeg = tb / (tb + 1); dSum = Math.pow(it / (it + 1), GAMMA);
        for (let p = 0; p < 2; p++) { const v = walk(rootNode, p, w0[p], w0[1 - p], 0); rel(p, v); }
      }
      return it;
    }
    // Valeur moyenne (en jetons) d'un vecteur de valeurs contrefactuelles pour p, avec ses reach.
    function meanValue(p, v, rp, ro) {
      const cm = compat(p, ro, get(p)); let num = 0, den = 0;
      for (let i = 0; i < N[p]; i++) { num += rp[i] * v[i]; den += rp[i] * cm[i]; }
      rel(p, cm); return den > 0 ? num / den : 0;
    }
    // Exploitabilité : gain moyen de deux meilleures réponses au-delà du pot, en % du pot de départ.
    function exploitability() {
      let tot = 0; const br = [];
      for (let p = 0; p < 2; p++) { const v = walk(rootNode, p, w0[p], w0[1 - p], 1); br.push(meanValue(p, v, w0[p], w0[1 - p])); rel(p, v); }
      // Jeu à somme constante (sans rake ni ICM) : la somme des valeurs vaut le pot. Sinon (rake, ICM), on mesure
      // directement le gain de chaque meilleure réponse face à la valeur des stratégies moyennes.
      if (!RK && !IC) tot = (br[0] + br[1] - P0) / 2;
      else { for (let p = 0; p < 2; p++) { const v = walk(rootNode, p, w0[p], w0[1 - p], 2); tot += (br[p] - meanValue(p, v, w0[p], w0[1 - p])) / 2; rel(p, v); } }
      return { chips: tot, pct: (tot / P0) * 100, br };
    }

    // ---- Lecture d'un nœud : chemin = liste d'indices (actions ou cartes) ----
    // Navigation : un chemin qui passe par une carte membre d'une orbite descend dans le sous-arbre du représentant ;
    // pm[p][i] = indice réel de la main i du repère représentant, sg = permutation des couleurs repère -> réel.
    function locate(path) {
      let node = rootNode; const rch = [w0[0].slice(), w0[1].slice()]; const steps = [];
      let pm = null, sgm = [0, 1, 2, 3];
      for (const x0 of path) {
        if (node.t === ACT) {
          const sg = average(node, new Float64Array(node.acts.length * N[node.p])), n = N[node.p];
          for (let i = 0; i < n; i++) rch[node.p][i] *= sg[x0 * n + i];
          steps.push({ node, a: x0 }); node = node.ch[x0];
        } else if (node.t === CHANCE) {
          const x = sc(x0, sgm.map((_, s2) => sgm.indexOf(s2))); // carte réelle -> repère courant
          const ci = node.cards.indexOf(x); if (ci < 0) throw new Error('Carte absente de l\'arbre');
          for (let p = 0; p < 2; p++) for (const i of withCard[p][x]) rch[p][i] = 0;
          const al = node.alias.get(x);
          if (al) {
            // Passage au repère du représentant : main i du repère représentant = main hp[i] du repère courant.
            const hp = al.sym.hp, old = [rch[0].slice(), rch[1].slice()];
            for (let p = 0; p < 2; p++) for (let i = 0; i < N[p]; i++) rch[p][i] = old[p][hp[p][i]];
            const prev = pm || [Int32Array.from({ length: N[0] }, (_, i) => i), Int32Array.from({ length: N[1] }, (_, i) => i)];
            pm = [0, 1].map((p) => Int32Array.from({ length: N[p] }, (_, i) => prev[p][hp[p][i]]));
            sgm = sgm.map((_, s2) => sgm[al.sym.sg[s2]]);
          }
          steps.push({ node, a: ci }); node = node.ch[ci];
        } else break;
      }
      return { node, reach: rch, steps, pm, sgm };
    }
    const toReal = (arr, pmp, n, A = 1) => { if (!pmp) return arr; const out = new arr.constructor(arr.length); for (let a = 0; a < A; a++) for (let i = 0; i < n; i++) out[a * n + pmp[i]] = arr[a * n + i]; return out; };
    // Équité (abattage sans autres mises) de chaque main de p contre la reach adverse, en parcourant les cartes restantes de l'arbre.
    function equityVec(cards, p, ro) {
      const o = 1 - p;
      if (cards.length === 5) {
        const id = boardOf(cards), out = compat(p, ro, new Float64Array(N[p])), win = get(p), lose = get(p);
        showMass({ bid: id }, p, ro, win, lose);
        const tot = new Float64Array(N[p]);
        for (let i = 0; i < N[p]; i++) { const all = out[i]; tot[i] = all; out[i] = win[i] + 0.5 * (all - win[i] - lose[i]); }
        rel(p, win); rel(p, lose);
        return { num: out, den: tot };
      }
      const d = dealCards(cards), num = new Float64Array(N[p]), den = new Float64Array(N[p]);
      for (const k of d.cards) {
        const ro2 = maskCopy(o, ro, k), r = equityVec([...cards, k], p, ro2);
        const l = new Set(withCard[p][k]);
        for (let i = 0; i < N[p]; i++) if (!l.has(i)) { num[i] += r.num[i] * d.w[p][i]; den[i] += r.den[i] * d.w[p][i]; }
        rel(o, ro2);
      }
      return { num, den };
    }
    function info(path = []) {
      const L = locate(path), res0 = infoRaw(L);
      if (!L.pm) return res0;
      // Retour au repère réel : mains réindexées, board et cartes du nœud remis dans leurs vraies couleurs.
      const { pm, sgm } = L, n0 = N[0], n1 = N[1], mapC = (c) => sc(c, sgm);
      const node = Object.create(L.node); node.board = L.node.board.map(mapC); if (L.node.cards) node.cards = L.node.cards.map(mapC).sort((a, b) => b - a);
      const r = { ...res0, node, board: node.board, reach: [toReal(res0.reach[0], pm[0], n0), toReal(res0.reach[1], pm[1], n1)], ev: [toReal(res0.ev[0], pm[0], n0), toReal(res0.ev[1], pm[1], n1)], eq: [toReal(res0.eq[0], pm[0], n0), toReal(res0.eq[1], pm[1], n1)] };
      if (res0.strategy) { const p = L.node.p, A = L.node.acts.length; r.strategy = toReal(res0.strategy, pm[p], N[p], A); r.actEv = res0.actEv.map((v) => toReal(v, pm[p], N[p])); }
      return r;
    }
    function infoRaw(Lc) {
      const { node, reach, steps } = Lc;
      const res = { node, steps, reach, t: node.t, pot: P0 + node.C[0] + node.C[1], C: node.C.slice(), board: node.board };
      // EV et équité par main pour les deux joueurs (stratégies moyennes à partir de ce nœud).
      res.ev = []; res.eq = []; res.evMean = []; res.eqMean = []; res.mass = [];
      for (let p = 0; p < 2; p++) {
        const o = 1 - p, cm = compat(p, reach[o], new Float64Array(N[p]));
        let v;
        if (node.t === FOLD || node.t === SHOW || node.t === CHANCE || node.t === ACT) v = walk(node, p, reach[p], reach[o], 2);
        const ev = new Float64Array(N[p]); let num = 0, den = 0;
        for (let i = 0; i < N[p]; i++) { ev[i] = cm[i] > 1e-12 ? v[i] / cm[i] + node.C[p] : NaN; num += reach[p][i] * v[i]; den += reach[p][i] * cm[i]; }
        rel(p, v);
        const eqr = equityVec(node.board, p, reach[o]), eq = new Float64Array(N[p]); let en = 0, ed = 0;
        for (let i = 0; i < N[p]; i++) { eq[i] = eqr.den[i] > 1e-12 ? eqr.num[i] / eqr.den[i] : NaN; en += reach[p][i] * eqr.num[i]; ed += reach[p][i] * eqr.den[i]; }
        res.ev.push(ev); res.eq.push(eq); res.evMean.push(den > 0 ? num / den + node.C[p] : NaN); res.eqMean.push(ed > 0 ? en / ed : NaN);
        res.mass.push(reach[p].reduce((a, b) => a + b, 0));
      }
      if (node.t === ACT) {
        const p = node.p, n = N[p], A = node.acts.length, sg = average(node, new Float64Array(A * n));
        res.strategy = sg;
        // EV de chaque action par main (en jetons, depuis ce nœud ; même convention que ev).
        res.actEv = node.acts.map((_, a) => {
          const v = walk(node.ch[a], p, reach[p], reach[1 - p], 2), cm = compat(p, reach[1 - p], new Float64Array(n)), out = new Float64Array(n);
          for (let i = 0; i < n; i++) out[i] = cm[i] > 1e-12 ? v[i] / cm[i] + node.C[p] : NaN;
          rel(p, v); return out;
        });
        // Fréquences globales pondérées par la reach.
        res.freq = node.acts.map((_, a) => { let s = 0, t = 0; for (let i = 0; i < n; i++) { s += reach[p][i] * sg[a * n + i]; t += reach[p][i]; } return t > 0 ? s / t : 0; });
      }
      return res;
    }
    // Libellé d'une action en français.
    function label(node, a) {
      const x = node.acts[a], add = x.to - node.bets[node.p], f = (v) => (Math.round(v * 10) / 10).toLocaleString('fr-FR');
      if (x.k === 'x') return 'Check';
      if (x.k === 'f') return 'Se coucher';
      if (x.k === 'c') return `Suivre ${f(add)}`;
      if (x.k === 'a') return `Tapis ${f(x.to)}`;
      if (x.k === 'b') return `Miser ${f(add)} (${Math.round((add / node.pot) * 100)} %)`;
      return `Relancer à ${f(x.to)}`;
    }
    function lock(path, strat) {
      const { node, pm } = locate(path); if (node.t !== ACT) throw new Error('Pas un nœud de décision');
      if (!strat) { node.lock = null; return; }
      const n = N[node.p], A = node.acts.length, out = new Float64Array(A * n);
      for (let a = 0; a < A; a++) for (let i = 0; i < n; i++) out[a * n + i] = strat[a * n + (pm ? pm[node.p][i] : i)];
      node.lock = out;
      return { shared: !!pm }; // passage par une carte symétrique : le verrou vaut aussi pour les cartes de la même orbite
    }
    const stats = () => {
      let acts = 0, mem = 0; const cells = [0, 0]; for (const n of nodes) if (n.t === ACT) { acts++; mem += n.reg.length * 8; cells[n.p] += n.acts.length; }
      return { nodes: nodes.length, acts, cells, boards: boards.length, mb: mem / 1048576, approx, iterations: it };
    };
    return { cfg, board, P0, S, N, hands, w0, root: rootNode, nodes, iterate, exploitability, info, label, locate, lock, applyProfile, stats, OOP, IP, sym: SYM.length, icm: IC ? { K: icmK, base: icmBase } : null };
  }

  // Estimation de la taille de l'arbre avant de le construire (nœuds de décision et mémoire), sans évaluer de mains.
  function estimate(cfg) {
    try {
      const g = create({ ...cfg, ranges: ['72o, 62o, 52o, 42o, 32o', '72o, 62o, 52o, 42o, 32o'] });
      const st = g.stats(); return { nodes: st.nodes, acts: st.acts, cells: st.cells, boards: st.boards, approx: st.approx };
    } catch (e) { return { error: e.message }; }
  }

  const api = { create, estimate, parseWeighted, rangeText, parseSizes, sampleCards, DEFAULT_SIZES, ACT, CHANCE, FOLD, SHOW };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Postflop = api;
})(typeof window !== 'undefined' ? window : globalThis);
