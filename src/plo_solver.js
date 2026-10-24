// Solveur PLO SIGMA 52 — Discounted CFR à deux joueurs, mains de 4 cartes, mises pot-limit.
// Même convention que le solveur Hold'em (postflop.js) : pot de départ mort, EV en jetons, exploitabilité en % du pot.
// Différence clé : une range PLO compte 270 725 mains possibles. On résout sur un échantillon de mains (quelques centaines par joueur),
// tiré dans la range par rang préflop ; les cartes partagées sont retirées exactement par inclusion-exclusion
// (cartes seules, paires et triplets de cartes, main identique), ce qui garde des abattages en O(n log n).
(function (root) {
  const E = root.Engine || require('./engine.js');
  const O = root.Omaha || require('./omaha.js');
  const PF = root.Postflop || require('./postflop.js');
  const OOP = 0, IP = 1, ACT = 0, CHANCE = 1, FOLD = 2, SHOW = 3, K = 4;
  const STREET = ['flop', 'turn', 'river'];
  const DEFAULT_SIZES = { flop: [{ bet: [50], raise: [] }, { bet: [50, 100], raise: [100] }], turn: [{ bet: [66], raise: [] }, { bet: [66], raise: [100] }], river: [{ bet: [66], raise: [] }, { bet: [66], raise: [100] }] };
  const handKey = (h) => h.slice(0, K).sort((a, b) => a - b).join('.');
  const P2 = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]], P3 = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];

  function create(cfg) {
    const board = (Array.isArray(cfg.board) ? cfg.board : E.parseCards(cfg.board)).slice();
    if (board.length < 3 || board.length > 5) throw new Error('Board de 3 à 5 cartes');
    if (new Set(board).size !== board.length) throw new Error('Carte du board en double');
    const P0 = +cfg.pot, S = +cfg.stack;
    if (!(P0 > 0)) throw new Error('Pot invalide');
    if (!(S >= 0)) throw new Error('Tapis invalide');
    const thr = cfg.allinThreshold ?? 0.67, maxRaises = cfg.maxRaises ?? 1, sample = cfg.sample || null;
    // Pot-limit : aucune mise au-delà du pot (100 %), « p » = pot.
    const lim = (l) => PF.parseSizes(l).map((x) => (x === 'a' ? 'a' : Math.min(100, x)));
    const sizes = {};
    for (const st of STREET) sizes[st] = [0, 1].map((p) => { const s = cfg.sizes?.[st]?.[p] || DEFAULT_SIZES[st][p]; return { bet: lim(s.bet), raise: lim(s.raise) }; });
    const hands = [0, 1].map((p) => {
      const seen = new Set();
      return cfg.ranges[p].map((h) => { const c = h.slice(0, K), w = h.length > K ? +h[K] : 1; return [...c, w]; })
        .filter((h) => { const k = handKey(h); if (seen.has(k) || new Set(h.slice(0, K)).size < K || h.slice(0, K).some((c) => board.includes(c))) return false; seen.add(k); return h[K] > 0; });
    });
    if (!hands[0].length || !hands[1].length) throw new Error('Range vide après retrait des cartes du board');
    const N = [hands[0].length, hands[1].length];
    const cards = hands.map((l) => { const a = new Uint8Array(l.length * K); l.forEach((h, i) => { const s = h.slice(0, K).sort((x, y) => x - y); for (let k = 0; k < K; k++) a[i * K + k] = s[k]; }); return a; });
    // Index des paires (52²) et triplets (52³) de cartes de chaque main, triés.
    const pairs = cards.map((a, p) => { const o = new Int32Array(N[p] * 6); for (let i = 0; i < N[p]; i++) P2.forEach(([x, y], t) => { o[i * 6 + t] = a[i * K + x] * 52 + a[i * K + y]; }); return o; });
    const trips = cards.map((a, p) => { const o = new Int32Array(N[p] * 4); for (let i = 0; i < N[p]; i++) P3.forEach(([x, y, z], t) => { o[i * 4 + t] = (a[i * K + x] * 52 + a[i * K + y]) * 52 + a[i * K + z]; }); return o; });
    const w0 = hands.map((l) => Float64Array.from(l, (h) => h[K]));
    const same = [0, 1].map((p) => { const idx = new Map(); hands[1 - p].forEach((h, i) => idx.set(handKey(h), i)); return Int32Array.from(hands[p], (h) => idx.get(handKey(h)) ?? -1); });
    const withCard = [0, 1].map((p) => { const l = Array.from({ length: 52 }, () => []); for (let i = 0; i < N[p]; i++) for (let k = 0; k < K; k++) l[cards[p][i * K + k]].push(i); return l.map((x) => Int32Array.from(x)); });
    const holeOf = (p, i) => Array.from(cards[p].subarray(i * K, i * K + K));

    // ---- Tables d'inclusion-exclusion ----
    const T1 = new Float64Array(52), T2 = new Float64Array(52 * 52), T3 = new Float64Array(52 * 52 * 52);
    function add(p, j, r) { const a = cards[p], pr = pairs[p], tr = trips[p]; for (let k = 0; k < K; k++) T1[a[j * K + k]] += r; for (let t = 0; t < 6; t++) T2[pr[j * 6 + t]] += r; for (let t = 0; t < 4; t++) T3[tr[j * 4 + t]] += r; }
    function clear(p, j) { const a = cards[p], pr = pairs[p], tr = trips[p]; for (let k = 0; k < K; k++) T1[a[j * K + k]] = 0; for (let t = 0; t < 6; t++) T2[pr[j * 6 + t]] = 0; for (let t = 0; t < 4; t++) T3[tr[j * 4 + t]] = 0; }
    // Masse adverse insérée qui partage au moins une carte avec la main i de p (hors main identique).
    function shared(p, i) { const a = cards[p], pr = pairs[p], tr = trips[p]; let s = 0; for (let k = 0; k < K; k++) s += T1[a[i * K + k]]; for (let t = 0; t < 6; t++) s -= T2[pr[i * 6 + t]]; for (let t = 0; t < 4; t++) s += T3[tr[i * 4 + t]]; return s; }

    // ---- Boards de river ----
    const boards = [], boardId = new Map();
    function boardOf(bc) {
      const k = bc.slice().sort((a, b) => a - b).join('.');
      if (boardId.has(k)) return boardId.get(k);
      const id = boards.length, str = [], ord = [];
      for (let p = 0; p < 2; p++) {
        const s = new Int32Array(N[p]);
        for (let i = 0; i < N[p]; i++) { const h = holeOf(p, i); s[i] = h.some((c) => bc.includes(c)) ? -1 : O.evaluate(h, bc); }
        str.push(s); ord.push(Int32Array.from([...Array(N[p]).keys()].sort((x, y) => s[x] - s[y])));
      }
      boards.push({ cards: bc.slice(), str, ord }); boardId.set(k, id); return id;
    }
    const nextCards = new Map();
    function dealCards(cur) {
      const k = cur.slice().sort((a, b) => a - b).join('.');
      if (nextCards.has(k)) return nextCards.get(k);
      const deck = []; for (let c = 51; c >= 0; c--) if (!cur.includes(c)) deck.push(c);
      const kk = cur.length === 3 ? sample?.turn : sample?.river;
      let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
      const dc = PF.sampleCards(deck, cur, kk, (h >>> 0) ^ (cfg.seed || 7), cfg.include || []);
      // Une paire de mains disjointes laisse D − 8 cartes possibles : poids par main normalisé sur les cartes tirées qu'elle ne bloque pas.
      const D = deck.length, set = new Set(dc), w = [0, 1].map((p) => {
        const out = new Float64Array(N[p]);
        for (let i = 0; i < N[p]; i++) { let inS = 0; for (let q = 0; q < K; q++) if (set.has(cards[p][i * K + q])) inS++; const n = dc.length - inS; out[i] = n > 0 ? (D - K) / ((D - 2 * K) * n) : 0; }
        return out;
      });
      const r = { cards: dc, w, exact: dc.length === deck.length }; nextCards.set(k, r); return r;
    }

    // ---- Arbre (pot-limit) ----
    const nodes = []; let approx = false;
    const mk = (n) => { n.id = nodes.length; nodes.push(n); return n; };
    const r2 = (x) => Math.round(x * 100) / 100;
    function actNode(st) {
      const { p, street, cards: bc, C, bets, nr } = st, o = 1 - p, pot = P0 + C[0] + C[1], left = S - C[p], toCall = bets[o] - bets[p];
      const acts = [], push = (a) => { if (!acts.some((x) => x.k === a.k && Math.abs(x.to - a.to) < 1e-6)) acts.push(a); };
      const sz = sizes[STREET[street]][p];
      if (toCall <= 1e-9) {
        push({ k: 'x', to: bets[p] });
        if (left > 1e-9) for (const s of sz.bet) {
          let amt = s === 'a' ? Math.min(left, pot) : Math.max(Math.min(1, left), r2((s / 100) * pot));
          if (amt >= thr * left || amt > left) amt = left;
          amt = Math.min(amt, pot, left);
          push({ k: amt >= left - 1e-9 ? 'a' : 'b', to: bets[p] + amt, pct: Math.round((amt / pot) * 100) });
        }
      } else {
        push({ k: 'f', to: bets[p] }); push({ k: 'c', to: Math.min(bets[o], bets[p] + left) });
        const oLeft = S - C[o];
        if (nr < maxRaises && oLeft > 1e-9 && left > toCall + 1e-9) for (const s of sz.raise) {
          const potMax = bets[o] + (pot + toCall); // relance du pot : payer, puis relancer de la taille du pot obtenu
          let to = s === 'a' ? potMax : r2(bets[o] + (s / 100) * (pot + toCall));
          to = Math.min(Math.max(to, bets[o] + toCall), potMax);
          if (to - bets[p] >= thr * left || to - bets[p] > left) to = bets[p] + left;
          push({ k: to - bets[p] >= left - 1e-9 ? 'a' : 'r', to });
        }
      }
      const rank = { f: 0, x: 1, c: 2, b: 3, r: 3, a: 4 };
      acts.sort((a, b) => rank[a.k] - rank[b.k] || a.to - b.to);
      const node = mk({ t: ACT, p, street, board: bc, C: C.slice(), bets: bets.slice(), pot, acts, ch: [] });
      for (const a of acts) node.ch.push(after(st, a));
      node.reg = new Float32Array(acts.length * N[p]); node.sum = new Float32Array(acts.length * N[p]);
      return node;
    }
    function after(st, a) {
      const { p, street, cards: bc, C, bets, nr } = st, o = 1 - p;
      if (a.k === 'f') return mk({ t: FOLD, winner: o, C: C.slice(), board: bc });
      if (a.k === 'x') return p === OOP ? actNode({ ...st, p: IP }) : endStreet(st, C);
      const C2 = C.slice(), b2 = bets.slice(); C2[p] += a.to - bets[p]; b2[p] = a.to;
      if (a.k === 'c') return endStreet(st, C2);
      return actNode({ p: o, street, cards: bc, C: C2, bets: b2, nr: a.k === 'b' || (a.k === 'a' && bets[o] === 0) ? nr : nr + 1 });
    }
    function endStreet(st, C) {
      if (st.street === 2) return mk({ t: SHOW, C: C.slice(), bid: boardOf(st.cards), board: st.cards });
      return chanceNode(st.cards, C, S - C[0] <= 1e-9 || S - C[1] <= 1e-9);
    }
    function chanceNode(cur, C, allin) {
      const d = dealCards(cur); if (!d.exact) approx = true;
      const node = mk({ t: CHANCE, board: cur, C: C.slice(), cards: d.cards, w: d.w, ch: [], street: cur.length - 2 });
      for (const k of d.cards) {
        const nb = [...cur, k];
        if (allin) node.ch.push(nb.length === 5 ? mk({ t: SHOW, C: C.slice(), bid: boardOf(nb), board: nb }) : chanceNode(nb, C, true));
        else node.ch.push(actNode({ p: OOP, street: nb.length - 3, cards: nb, C: C.slice(), bets: [0, 0], nr: 0 }));
      }
      return node;
    }
    const rootNode = S <= 1e-9 ? (board.length === 5 ? mk({ t: SHOW, C: [0, 0], bid: boardOf(board), board }) : chanceNode(board, [0, 0], true))
      : actNode({ p: OOP, street: board.length - 3, cards: board, C: [0, 0], bets: [0, 0], nr: 0 });

    const pool = [[], []], get = (p) => pool[p].pop() || new Float64Array(N[p]), rel = (p, b) => pool[p].push(b);
    function compat(p, ro, out) {
      const o = 1 - p; let tot = 0;
      for (let j = 0; j < N[o]; j++) { const r = ro[j]; if (r) { tot += r; add(o, j, r); } }
      const sm = same[p];
      for (let i = 0; i < N[p]; i++) out[i] = tot - shared(p, i) + (sm[i] >= 0 ? ro[sm[i]] : 0);
      for (let j = 0; j < N[o]; j++) if (ro[j]) clear(o, j);
      return out;
    }
    // Les mains identiques chez l'adversaire ont la même force : jamais comptées comme battues ni gagnantes, pas de correction.
    function showMass(node, p, ro, win, lose) {
      const o = 1 - p, B = boards[node.bid], op = B.ord[p], oo = B.ord[o], sp = B.str[p], so = B.str[o], np = N[p], no = N[o];
      let cum = 0, j = 0;
      for (let ii = 0; ii < np; ii++) {
        const i = op[ii], s = sp[i];
        while (j < no && so[oo[j]] < s) { const jj = oo[j], r = ro[jj]; if (r !== 0) { cum += r; add(o, jj, r); } j++; }
        win[i] = cum - shared(p, i);
      }
      for (let q = 0; q < j; q++) if (ro[oo[q]]) clear(o, oo[q]);
      cum = 0; j = no - 1; const lo = j;
      for (let ii = np - 1; ii >= 0; ii--) {
        const i = op[ii], s = sp[i];
        while (j >= 0 && so[oo[j]] > s) { const jj = oo[j], r = ro[jj]; if (r !== 0) { cum += r; add(o, jj, r); } j--; }
        lose[i] = cum - shared(p, i);
      }
      for (let q = lo; q > j; q--) if (ro[oo[q]]) clear(o, oo[q]);
    }
    function foldVal(node, p, ro) { const out = compat(p, ro, get(p)), v = node.winner === p ? P0 + node.C[1 - p] : -node.C[p]; for (let i = 0; i < N[p]; i++) out[i] *= v; return out; }
    function showVal(node, p, ro) {
      const out = compat(p, ro, get(p)), win = get(p), lose = get(p), c = node.C[p], vw = P0 + c, vl = -c, vt = P0 / 2;
      showMass(node, p, ro, win, lose);
      for (let i = 0; i < N[p]; i++) out[i] = vw * win[i] + vl * lose[i] + vt * (out[i] - win[i] - lose[i]);
      rel(p, win); rel(p, lose); return out;
    }
    const tmpS = [new Float64Array(N[0]), new Float64Array(N[1])];
    function current(node, out) {
      const n = N[node.p], A = node.acts.length, reg = node.reg, s = tmpS[node.p]; s.fill(0);
      for (let a = 0; a < A; a++) { const b = a * n; for (let i = 0; i < n; i++) { const r = reg[b + i]; if (r > 0) s[i] += r; } }
      const u = 1 / A;
      for (let a = 0; a < A; a++) { const b = a * n; for (let i = 0; i < n; i++) { const r = reg[b + i], t = s[i]; out[b + i] = t > 0 ? (r > 0 ? r / t : 0) : u; } }
      return out;
    }
    function average(node, out) {
      const n = N[node.p], A = node.acts.length;
      for (let i = 0; i < n; i++) { let s = 0; for (let a = 0; a < A; a++) s += node.sum[a * n + i]; if (s > 0) for (let a = 0; a < A; a++) out[a * n + i] = node.sum[a * n + i] / s; else return current(node, out); }
      return out;
    }
    const strat = new Map(), sbuf = (node) => { let b = strat.get(node.id); if (!b) { b = new Float64Array(node.acts.length * N[node.p]); strat.set(node.id, b); } return b; };
    function maskCopy(p, src, k) { const b = get(p); b.set(src); const l = withCard[p][k]; for (let i = 0; i < l.length; i++) b[l[i]] = 0; return b; }
    let it = 0, dPos = 1, dNeg = 1, dSum = 1;
    function walk(node, p, rp, ro, mode) {
      const o = 1 - p;
      if (node.t === FOLD) return foldVal(node, p, ro);
      if (node.t === SHOW) return showVal(node, p, ro);
      if (node.t === CHANCE) {
        const out = get(p); out.fill(0); const w = node.w[p];
        for (let ci = 0; ci < node.cards.length; ci++) {
          const k = node.cards[ci], rp2 = maskCopy(p, rp, k), ro2 = maskCopy(o, ro, k), v = walk(node.ch[ci], p, rp2, ro2, mode);
          const l = withCard[p][k]; for (let i = 0; i < l.length; i++) v[l[i]] = 0;
          for (let i = 0; i < N[p]; i++) out[i] += v[i] * w[i];
          rel(p, v); rel(p, rp2); rel(o, ro2);
        }
        return out;
      }
      const q = node.p, A = node.acts.length, n = N[q], sg = mode === 0 ? current(node, sbuf(node)) : average(node, sbuf(node));
      if (q === p) {
        const out = get(p); out.fill(mode === 1 ? -Infinity : 0); const vals = mode === 0 ? [] : null;
        for (let a = 0; a < A; a++) {
          const rp2 = get(p); for (let i = 0; i < n; i++) rp2[i] = rp[i] * sg[a * n + i];
          const v = walk(node.ch[a], p, rp2, ro, mode); rel(p, rp2);
          if (mode === 1) { for (let i = 0; i < n; i++) if (v[i] > out[i]) out[i] = v[i]; rel(p, v); }
          else { for (let i = 0; i < n; i++) out[i] += sg[a * n + i] * v[i]; if (vals) vals.push(v); else rel(p, v); }
        }
        if (mode === 0) {
          const reg = node.reg, sum = node.sum;
          for (let a = 0; a < A; a++) { const v = vals[a], b = a * n; for (let i = 0; i < n; i++) { const r = reg[b + i]; reg[b + i] = (r > 0 ? r * dPos : r * dNeg) + v[i] - out[i]; sum[b + i] = sum[b + i] * dSum + rp[i] * sg[b + i]; } rel(p, v); }
        }
        return out;
      }
      const out = get(p); out.fill(0);
      for (let a = 0; a < A; a++) {
        const ro2 = get(o); let any = false;
        for (let i = 0; i < n; i++) { const r = ro[i] * sg[a * n + i]; ro2[i] = r; if (r) any = true; }
        if (any || mode !== 0) { const v = walk(node.ch[a], p, rp, ro2, mode); for (let i = 0; i < N[p]; i++) out[i] += v[i]; rel(p, v); }
        rel(o, ro2);
      }
      return out;
    }
    function iterate(k = 1) {
      for (let s = 0; s < k; s++) {
        it++; const ta = Math.pow(it, 1.5), tb = Math.pow(it, 0.5);
        dPos = ta / (ta + 1); dNeg = tb / (tb + 1); dSum = Math.pow(it / (it + 1), 3);
        for (let p = 0; p < 2; p++) rel(p, walk(rootNode, p, w0[p], w0[1 - p], 0));
      }
      return it;
    }
    function meanValue(p, v, rp, ro) { const cm = compat(p, ro, get(p)); let num = 0, den = 0; for (let i = 0; i < N[p]; i++) { num += rp[i] * v[i]; den += rp[i] * cm[i]; } rel(p, cm); return den > 0 ? num / den : 0; }
    function exploitability() {
      const br = []; for (let p = 0; p < 2; p++) { const v = walk(rootNode, p, w0[p], w0[1 - p], 1); br.push(meanValue(p, v, w0[p], w0[1 - p])); rel(p, v); }
      const tot = (br[0] + br[1] - P0) / 2; return { chips: tot, pct: (tot / P0) * 100, br };
    }
    function locate(path) {
      let node = rootNode; const rch = [w0[0].slice(), w0[1].slice()], steps = [];
      for (const x of path) {
        if (node.t === ACT) { const n = N[node.p], sg = average(node, new Float64Array(node.acts.length * n)); for (let i = 0; i < n; i++) rch[node.p][i] *= sg[x * n + i]; steps.push({ node, a: x }); node = node.ch[x]; }
        else if (node.t === CHANCE) { const ci = node.cards.indexOf(x); if (ci < 0) throw new Error('Carte absente de l\'arbre'); for (let p = 0; p < 2; p++) for (const i of withCard[p][x]) rch[p][i] = 0; steps.push({ node, a: ci }); node = node.ch[ci]; }
        else break;
      }
      return { node, reach: rch, steps };
    }
    function equityVec(bc, p, ro) {
      const o = 1 - p;
      if (bc.length === 5) {
        const out = compat(p, ro, new Float64Array(N[p])), win = get(p), lose = get(p), tot = new Float64Array(N[p]);
        showMass({ bid: boardOf(bc) }, p, ro, win, lose);
        for (let i = 0; i < N[p]; i++) { tot[i] = out[i]; out[i] = win[i] + 0.5 * (out[i] - win[i] - lose[i]); }
        rel(p, win); rel(p, lose); return { num: out, den: tot };
      }
      const d = dealCards(bc), num = new Float64Array(N[p]), den = new Float64Array(N[p]);
      for (const k of d.cards) {
        const ro2 = maskCopy(o, ro, k), r = equityVec([...bc, k], p, ro2), l = new Set(withCard[p][k]);
        for (let i = 0; i < N[p]; i++) if (!l.has(i)) { num[i] += r.num[i] * d.w[p][i]; den[i] += r.den[i] * d.w[p][i]; }
        rel(o, ro2);
      }
      return { num, den };
    }
    function info(path = []) {
      const { node, reach, steps } = locate(path);
      const res = { node, steps, reach, t: node.t, pot: P0 + node.C[0] + node.C[1], C: node.C.slice(), board: node.board, ev: [], eq: [], evMean: [], eqMean: [] };
      for (let p = 0; p < 2; p++) {
        const o = 1 - p, cm = compat(p, reach[o], new Float64Array(N[p])), v = walk(node, p, reach[p], reach[o], 2), ev = new Float64Array(N[p]); let num = 0, den = 0;
        for (let i = 0; i < N[p]; i++) { ev[i] = cm[i] > 1e-12 ? v[i] / cm[i] + node.C[p] : NaN; num += reach[p][i] * v[i]; den += reach[p][i] * cm[i]; }
        rel(p, v);
        const eqr = (path.length && node.board.length < 5 && N[p] * N[o] > 3e5) ? null : equityVec(node.board, p, reach[o]), eq = new Float64Array(N[p]).fill(NaN); let en = 0, ed = 0;
        if (eqr) for (let i = 0; i < N[p]; i++) { eq[i] = eqr.den[i] > 1e-12 ? eqr.num[i] / eqr.den[i] : NaN; en += reach[p][i] * eqr.num[i]; ed += reach[p][i] * eqr.den[i]; }
        res.ev.push(ev); res.eq.push(eq); res.evMean.push(den > 0 ? num / den + node.C[p] : NaN); res.eqMean.push(ed > 0 ? en / ed : NaN);
      }
      if (node.t === ACT) {
        const p = node.p, n = N[p], A = node.acts.length, sg = average(node, new Float64Array(A * n));
        res.strategy = sg;
        res.actEv = node.acts.map((_, a) => { const v = walk(node.ch[a], p, reach[p], reach[1 - p], 2), cm = compat(p, reach[1 - p], new Float64Array(n)), out = new Float64Array(n); for (let i = 0; i < n; i++) out[i] = cm[i] > 1e-12 ? v[i] / cm[i] + node.C[p] : NaN; rel(p, v); return out; });
        res.freq = node.acts.map((_, a) => { let s = 0, t = 0; for (let i = 0; i < n; i++) { s += reach[p][i] * sg[a * n + i]; t += reach[p][i]; } return t > 0 ? s / t : 0; });
      }
      return res;
    }
    function label(node, a) {
      const x = node.acts[a], add = x.to - node.bets[node.p], f = (v) => (Math.round(v * 10) / 10).toLocaleString('fr-FR');
      if (x.k === 'x') return 'Check'; if (x.k === 'f') return 'Se coucher'; if (x.k === 'c') return `Suivre ${f(add)}`;
      const potMax = node.bets[1 - node.p] - node.bets[node.p] > 0 ? node.bets[1 - node.p] + node.pot + (node.bets[1 - node.p] - node.bets[node.p]) : node.bets[node.p] + node.pot;
      const isPot = Math.abs(x.to - potMax) < 0.02;
      if (x.k === 'a') return `Tapis ${f(x.to)}${isPot ? ' (pot)' : ''}`;
      if (x.k === 'b') return isPot ? `Miser le pot (${f(add)})` : `Miser ${f(add)} (${Math.round((add / node.pot) * 100)} %)`;
      return isPot ? `Relancer le pot (à ${f(x.to)})` : `Relancer à ${f(x.to)}`;
    }
    const stats = () => { let acts = 0, mem = 0; for (const n of nodes) if (n.t === ACT) { acts++; mem += n.reg.length * 8; } return { nodes: nodes.length, acts, boards: boards.length, mb: mem / 1048576, approx, iterations: it }; };
    return { game: 'plo', cfg, board, P0, S, N, hands, holeOf, w0, root: rootNode, nodes, iterate, exploitability, info, label, locate, stats, OOP, IP };
  }

  // ---- Ranges PLO : échantillon de mains tirées par rang préflop ----
  // rank(h) -> rang préflop entre 0 (meilleure main) et 1 ; la range garde les mains de rang dans [lo, hi].
  function sampleRange(rank, lo, hi, n, dead = [], seed = 1, must = []) {
    const R = E.rng(seed), d = new Set(dead), deck = []; for (let c = 0; c < 52; c++) if (!d.has(c)) deck.push(c);
    const out = [], seen = new Set();
    for (const h of must) { if (h && h.length === K && !h.some((c) => d.has(c))) { const k = handKey(h); if (!seen.has(k)) { seen.add(k); out.push([...h, 1]); } } }
    let tries = 0;
    while (out.length < n && tries++ < n * 400) {
      for (let k = 0; k < K; k++) { const j = k + Math.floor(R() * (deck.length - k)); const t = deck[k]; deck[k] = deck[j]; deck[j] = t; }
      const h = deck.slice(0, K), key = handKey(h); if (seen.has(key)) continue;
      const r = rank(h); if (r === null || r < lo || r > hi) continue;
      seen.add(key); out.push([...h, 1]);
    }
    return out;
  }
  // Catégorie de la main faite (pour les résumés).
  function madeCat(h, bc) {
    const v = O.evaluate(h, bc), c = E.category(v);
    return c >= 4 ? 0 : c === 3 ? 1 : c === 2 ? 2 : c === 1 ? 3 : 4; // 0 = quinte et mieux, 1 = brelan, 2 = deux paires, 3 = une paire, 4 = hauteur
  }
  // Tirages en Omaha : couleur (avec 2 cartes de la couleur en main) et quinte (au moins 8 outs approchés).
  function draws(h, bc) {
    if (bc.length >= 5) return { flush: false, nutFlush: false, wrap: false };
    const bs = [0, 0, 0, 0]; bc.forEach((c) => bs[c & 3]++);
    let flush = false, nutFlush = false;
    for (let s = 0; s < 4; s++) if (bs[s] === 2) {
      const mine = h.filter((c) => (c & 3) === s).map((c) => c >> 2); if (mine.length >= 2) { flush = true; const used = new Set(bc.filter((c) => (c & 3) === s).map((c) => c >> 2)); let top = 12; while (used.has(top)) top--; if (mine.includes(top)) nutFlush = true; }
    }
    // Outs de quinte : cartes qui donnent une quinte en combinant 2 cartes privatives et 3 du board.
    const cur = O.evaluate(h, bc), hadStraight = E.category(cur) >= 4; let outs = 0;
    if (!hadStraight) for (let r = 0; r < 13; r++) { const alt = [0, 1, 2, 3].map((s) => r << 2 | s).find((x) => !h.includes(x) && !bc.includes(x)); if (alt === undefined) continue; if (E.category(O.evaluate(h, [...bc, alt])) === 4) outs += 4 - [0, 1, 2, 3].filter((s) => h.includes(r << 2 | s) || bc.includes(r << 2 | s)).length; }
    return { flush, nutFlush, wrap: outs >= 8, straightOuts: outs };
  }
  const CATS = ['Quinte et mieux', 'Brelan', 'Deux paires', 'Une paire', 'Rien'];
  const api = { create, sampleRange, madeCat, draws, CATS, DEFAULT_SIZES, handKey, ACT, CHANCE, FOLD, SHOW, K };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PLOSolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
