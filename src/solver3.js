// Solveur à trois joueurs SIGMA 52 (Hold'em, après le flop) — CFR vectorisé par main, mises simplifiées.
// Simplification assumée : les cartes d'une main sont retirées exactement de chacune des deux ranges adverses,
// mais les deux adversaires sont supposés indépendants entre eux (leurs blockers mutuels sont ignorés).
// C'est l'approximation habituelle des solveurs multiway rapides : l'erreur est faible devant celle des ranges.
// En jeu à trois, CFR ne garantit plus un équilibre de Nash : on mesure la qualité par le gain maximal
// qu'un joueur obtiendrait en déviant seul (meilleure réponse contre les deux autres), en % du pot.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const PF = root.Postflop || require('./postflop.js');
  const ACT = 0, CHANCE = 1, TERM = 2, NP = 3;
  const STREET = ['flop', 'turn', 'river'];
  const keyOf = (a, b) => (a > b ? a * 52 + b : b * 52 + a);
  const DEFAULT_SIZES = { flop: { bet: [33], raise: [] }, turn: { bet: [66], raise: [] }, river: { bet: [66], raise: ['a'] } };

  function create(cfg) {
    const board = (Array.isArray(cfg.board) ? cfg.board : E.parseCards(cfg.board)).slice();
    if (board.length < 3 || board.length > 5) throw new Error('Board de 3 à 5 cartes');
    if (new Set(board).size !== board.length) throw new Error('Carte du board en double');
    const P0 = +cfg.pot, S = +cfg.stack; if (!(P0 > 0)) throw new Error('Pot invalide'); if (!(S > 0)) throw new Error('Tapis invalide');
    const thr = cfg.allinThreshold ?? 0.67, maxRaises = cfg.maxRaises ?? 1, sample = cfg.sample || null;
    const sizes = {}; for (const st of STREET) { const s = cfg.sizes?.[st] || DEFAULT_SIZES[st]; sizes[st] = { bet: PF.parseSizes(s.bet), raise: PF.parseSizes(s.raise) }; }
    const hands = [0, 1, 2].map((p) => { const r = cfg.ranges[p]; return Array.isArray(r) ? r.filter(([a, b]) => !board.includes(a) && !board.includes(b)) : PF.parseWeighted(r, board); });
    if (hands.some((h) => !h.length)) throw new Error('Range vide après retrait des cartes du board');
    const N = hands.map((l) => l.length), c1 = hands.map((l) => Uint8Array.from(l, (x) => x[0])), c2 = hands.map((l) => Uint8Array.from(l, (x) => x[1])), w0 = hands.map((l) => Float64Array.from(l, (x) => x[2]));
    // same[p][o][i] : index de la même main chez o.
    const same = [0, 1, 2].map((p) => [0, 1, 2].map((o) => { if (o === p) return null; const idx = new Map(); hands[o].forEach(([a, b], i) => idx.set(keyOf(a, b), i)); return Int32Array.from(hands[p], ([a, b]) => idx.get(keyOf(a, b)) ?? -1); }));
    const withCard = [0, 1, 2].map((p) => { const l = Array.from({ length: 52 }, () => []); hands[p].forEach(([a, b], i) => { l[a].push(i); l[b].push(i); }); return l.map((x) => Int32Array.from(x)); });

    const boards = [], boardId = new Map();
    function boardOf(cards) {
      const k = cards.slice().sort((a, b) => a - b).join('.'); if (boardId.has(k)) return boardId.get(k);
      const str = [], ord = [];
      for (let p = 0; p < NP; p++) { const s = new Int32Array(N[p]); for (let i = 0; i < N[p]; i++) { const a = c1[p][i], b = c2[p][i]; s[i] = cards.includes(a) || cards.includes(b) ? -1 : E.evaluate([a, b, ...cards]); } str.push(s); ord.push(Int32Array.from([...Array(N[p]).keys()].sort((x, y) => s[x] - s[y]))); }
      boards.push({ cards: cards.slice(), str, ord }); boardId.set(k, boards.length - 1); return boards.length - 1;
    }
    const nextCards = new Map();
    function dealCards(cur) {
      const k = cur.slice().sort((a, b) => a - b).join('.'); if (nextCards.has(k)) return nextCards.get(k);
      const deck = []; for (let c = 51; c >= 0; c--) if (!cur.includes(c)) deck.push(c);
      let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
      const cards = PF.sampleCards(deck, cur, cur.length === 3 ? sample?.turn : sample?.river, (h >>> 0) ^ (cfg.seed || 7), cfg.include || []);
      const D = deck.length, set = new Set(cards);
      const w = [0, 1, 2].map((p) => { const out = new Float64Array(N[p]); for (let i = 0; i < N[p]; i++) { const n = cards.length - (set.has(c1[p][i]) ? 1 : 0) - (set.has(c2[p][i]) ? 1 : 0); out[i] = n > 0 ? (D - 2) / ((D - 6) * n) : 0; } return out; });
      const r = { cards, w, exact: cards.length === deck.length }; nextCards.set(k, r); return r;
    }

    // ---- Arbre : tour de mise à trois (ordre de parole 0, 1, 2) ----
    const nodes = []; let approx = false;
    const mk = (n) => { n.id = nodes.length; nodes.push(n); return n; };
    const r2 = (x) => Math.round(x * 100) / 100;
    const nextOf = (st, p) => { for (let d = 1; d <= NP; d++) { const q = (p + d) % NP; if (st.live[q]) return q; } return -1; };
    // st : { p, street, cards, C, bets, live, pend, nr }
    function actNode(st) {
      const { p, street, cards, C, bets } = st, pot = P0 + C[0] + C[1] + C[2], left = S - C[p], top = Math.max(...bets), toCall = top - bets[p];
      const acts = [], push = (a) => { if (!acts.some((x) => x.k === a.k && Math.abs(x.to - a.to) < 1e-6)) acts.push(a); };
      const sz = sizes[STREET[street]];
      if (toCall <= 1e-9) {
        push({ k: 'x', to: bets[p] });
        if (left > 1e-9) for (const s of sz.bet) { let amt = s === 'a' ? left : Math.max(Math.min(1, left), r2((s / 100) * pot)); if (amt >= thr * left || amt > left) amt = left; push({ k: amt >= left - 1e-9 ? 'a' : 'b', to: bets[p] + amt }); }
      } else {
        push({ k: 'f', to: bets[p] }); push({ k: 'c', to: Math.min(top, bets[p] + left) });
        const others = [0, 1, 2].some((q) => q !== p && st.live[q] && S - C[q] > 1e-9);
        if (st.nr < maxRaises && others && left > toCall + 1e-9) for (const s of sz.raise) {
          let to = s === 'a' ? bets[p] + left : r2(top + (s / 100) * (pot + toCall)); to = Math.max(to, top + toCall);
          if (to - bets[p] >= thr * left || to - bets[p] > left) to = bets[p] + left;
          push({ k: to - bets[p] >= left - 1e-9 ? 'a' : 'r', to });
        }
      }
      const rank = { f: 0, x: 1, c: 2, b: 3, r: 3, a: 4 }; acts.sort((a, b) => rank[a.k] - rank[b.k] || a.to - b.to);
      const node = mk({ t: ACT, p, street, board: cards, C: C.slice(), bets: bets.slice(), live: st.live.slice(), pot, acts, ch: [] });
      for (const a of acts) node.ch.push(after(st, a));
      node.reg = new Float32Array(acts.length * N[p]); node.sum = new Float32Array(acts.length * N[p]);
      return node;
    }
    // Tour de mise : pend[q] = q doit encore parler avant la clôture du tour (remis à tous les autres après une mise ou relance).
    const canBet = (C, live, q) => live[q] && S - C[q] > 1e-9;
    function after(st, a) {
      const p = st.p, C = st.C.slice(), bets = st.bets.slice(), live = st.live.slice(), pend = st.pend.slice(), top0 = Math.max(...st.bets); let nr = st.nr;
      pend[p] = false;
      if (a.k === 'f') live[p] = false;
      else {
        C[p] += a.to - bets[p]; bets[p] = a.to;
        if (a.to > top0 + 1e-9) { if (top0 > 1e-9) nr++; for (let q = 0; q < NP; q++) if (q !== p) pend[q] = canBet(C, live, q); }
      }
      if (live.filter(Boolean).length === 1) return mk({ t: TERM, C, live, board: st.cards, show: false });
      for (let d = 1; d < NP; d++) { const q = (p + d) % NP; if (pend[q] && canBet(C, live, q)) return actNode({ p: q, street: st.street, cards: st.cards, C, bets, live, pend, nr }); }
      return endStreet(st, C, live);
    }
    function endStreet(st, C, live) {
      if (st.street === 2) return mk({ t: TERM, C, live, board: st.cards, show: true, bid: boardOf(st.cards) });
      const allin = [0, 1, 2].filter((q) => canBet(C, live, q)).length <= 1;
      return chanceNode(st.cards, C, live, allin);
    }
    function chanceNode(cur, C, live, allin) {
      const d = dealCards(cur); if (!d.exact) approx = true;
      const node = mk({ t: CHANCE, board: cur, C: C.slice(), live: live.slice(), cards: d.cards, w: d.w, ch: [] });
      for (const k of d.cards) {
        const nb = [...cur, k];
        if (allin) node.ch.push(nb.length === 5 ? mk({ t: TERM, C: C.slice(), live: live.slice(), board: nb, show: true, bid: boardOf(nb) }) : chanceNode(nb, C, live, true));
        else { const pend = [0, 1, 2].map((q) => canBet(C, live, q)), p = pend.indexOf(true); node.ch.push(actNode({ p, street: nb.length - 3, cards: nb, C: C.slice(), bets: [0, 0, 0], live: live.slice(), pend, nr: 0 })); }
      }
      return node;
    }
    const rootNode = actNode({ p: 0, street: board.length - 3, cards: board, C: [0, 0, 0], bets: [0, 0, 0], live: [true, true, true], pend: [true, true, true], nr: 0 });

    // ---- Valeurs terminales ----
    const pool = [[], [], []], get = (p) => pool[p].pop() || new Float64Array(N[p]), rel = (p, b) => pool[p].push(b);
    const cardTot = new Float64Array(52);
    function compat(p, o, ro, out) {
      let tot = 0; cardTot.fill(0);
      for (let j = 0; j < N[o]; j++) { const r = ro[j]; if (r) { tot += r; cardTot[c1[o][j]] += r; cardTot[c2[o][j]] += r; } }
      const sm = same[p][o];
      for (let i = 0; i < N[p]; i++) out[i] = tot - cardTot[c1[p][i]] - cardTot[c2[p][i]] + (sm[i] >= 0 ? ro[sm[i]] : 0);
      return out;
    }
    // Masse adverse strictement plus faible (low) et strictement plus forte (high), cartes partagées retirées.
    function sweep(bid, p, o, ro, low, high) {
      const B = boards[bid], op = B.ord[p], oo = B.ord[o], sp = B.str[p], so = B.str[o], np = N[p], no = N[o];
      let cum = 0, j = 0; cardTot.fill(0);
      for (let ii = 0; ii < np; ii++) { const i = op[ii], s = sp[i]; while (j < no && so[oo[j]] < s) { const jj = oo[j], r = ro[jj]; if (r) { cum += r; cardTot[c1[o][jj]] += r; cardTot[c2[o][jj]] += r; } j++; } low[i] = cum - cardTot[c1[p][i]] - cardTot[c2[p][i]]; }
      cum = 0; j = no - 1; cardTot.fill(0);
      for (let ii = np - 1; ii >= 0; ii--) { const i = op[ii], s = sp[i]; while (j >= 0 && so[oo[j]] > s) { const jj = oo[j], r = ro[jj]; if (r) { cum += r; cardTot[c1[o][jj]] += r; cardTot[c2[o][jj]] += r; } j--; } high[i] = cum - cardTot[c1[p][i]] - cardTot[c2[p][i]]; }
    }
    function termVal(node, p, R) {
      const [j, k] = [0, 1, 2].filter((q) => q !== p), C = node.C, pot = P0 + C[0] + C[1] + C[2], cp = C[p], out = get(p);
      const Mj = compat(p, j, R[j], get(p)), Mk = compat(p, k, R[k], get(p));
      if (!node.live[p]) { for (let i = 0; i < N[p]; i++) out[i] = -cp * Mj[i] * Mk[i]; }
      else if (!node.show) { const v = pot - cp; for (let i = 0; i < N[p]; i++) out[i] = v * Mj[i] * Mk[i]; }
      else {
        const opp = [j, k].filter((q) => node.live[q]);
        if (opp.length === 1) {
          const o = opp[0], f = o === j ? Mk : Mj, M = o === j ? Mj : Mk, lo = get(p), hi = get(p);
          sweep(node.bid, p, o, R[o], lo, hi);
          for (let i = 0; i < N[p]; i++) { const t = M[i] - lo[i] - hi[i]; out[i] = f[i] * ((pot - cp) * lo[i] + (pot / 2 - cp) * t - cp * hi[i]); }
          rel(p, lo); rel(p, hi);
        } else {
          const lj = get(p), hj = get(p), lk = get(p), hk = get(p);
          sweep(node.bid, p, j, R[j], lj, hj); sweep(node.bid, p, k, R[k], lk, hk);
          for (let i = 0; i < N[p]; i++) {
            const tj = Mj[i] - lj[i] - hj[i], tk = Mk[i] - lk[i] - hk[i];
            const win = lj[i] * lk[i], tie2 = tj * lk[i] + lj[i] * tk, tie3 = tj * tk, all = Mj[i] * Mk[i];
            out[i] = (pot - cp) * win + (pot / 2 - cp) * tie2 + (pot / 3 - cp) * tie3 - cp * (all - win - tie2 - tie3);
          }
          rel(p, lj); rel(p, hj); rel(p, lk); rel(p, hk);
        }
      }
      rel(p, Mj); rel(p, Mk); return out;
    }

    const tmp = N.map((n) => new Float64Array(n));
    function current(node, out) {
      const n = N[node.p], A = node.acts.length, reg = node.reg, s = tmp[node.p]; s.fill(0);
      for (let a = 0; a < A; a++) for (let i = 0; i < n; i++) { const r = reg[a * n + i]; if (r > 0) s[i] += r; }
      for (let a = 0; a < A; a++) for (let i = 0; i < n; i++) { const r = reg[a * n + i]; out[a * n + i] = s[i] > 0 ? (r > 0 ? r / s[i] : 0) : 1 / A; }
      return out;
    }
    function average(node, out) {
      const n = N[node.p], A = node.acts.length;
      for (let i = 0; i < n; i++) { let s = 0; for (let a = 0; a < A; a++) s += node.sum[a * n + i]; if (s > 0) for (let a = 0; a < A; a++) out[a * n + i] = node.sum[a * n + i] / s; else return current(node, out); }
      return out;
    }
    const strat = new Map(), sbuf = (node) => { let b = strat.get(node.id); if (!b) strat.set(node.id, b = new Float64Array(node.acts.length * N[node.p])); return b; };
    function maskCopy(q, src, k) { const b = get(q); b.set(src); for (const i of withCard[q][k]) b[i] = 0; return b; }
    let it = 0, dPos = 1, dNeg = 1, dSum = 1;
    // mode : 0 = CFR, 1 = meilleure réponse de p, 2 = évaluation (stratégies moyennes).
    function walk(node, p, R, mode) {
      if (node.t === TERM) return termVal(node, p, R);
      if (node.t === CHANCE) {
        const out = get(p); out.fill(0); const w = node.w[p];
        for (let ci = 0; ci < node.cards.length; ci++) {
          const k = node.cards[ci], R2 = R.map((r, q) => maskCopy(q, r, k)), v = walk(node.ch[ci], p, R2, mode);
          for (const i of withCard[p][k]) v[i] = 0;
          for (let i = 0; i < N[p]; i++) out[i] += v[i] * w[i];
          rel(p, v); R2.forEach((b, q) => rel(q, b));
        }
        return out;
      }
      const q = node.p, A = node.acts.length, n = N[q], sg = mode === 0 ? current(node, sbuf(node)) : average(node, sbuf(node));
      if (q === p) {
        const out = get(p); out.fill(mode === 1 ? -Infinity : 0); const vals = mode === 0 ? [] : null;
        for (let a = 0; a < A; a++) {
          const rp = get(p); for (let i = 0; i < n; i++) rp[i] = R[p][i] * sg[a * n + i];
          const R2 = R.slice(); R2[p] = rp; const v = walk(node.ch[a], p, R2, mode); rel(p, rp);
          if (mode === 1) { for (let i = 0; i < n; i++) if (v[i] > out[i]) out[i] = v[i]; rel(p, v); }
          else { for (let i = 0; i < n; i++) out[i] += sg[a * n + i] * v[i]; if (vals) vals.push(v); else rel(p, v); }
        }
        if (mode === 0) for (let a = 0; a < A; a++) { const v = vals[a], b = a * n; for (let i = 0; i < n; i++) { const r = node.reg[b + i]; node.reg[b + i] = (r > 0 ? r * dPos : r * dNeg) + v[i] - out[i]; node.sum[b + i] = node.sum[b + i] * dSum + R[p][i] * sg[b + i]; } rel(p, v); }
        return out;
      }
      const out = get(p); out.fill(0);
      for (let a = 0; a < A; a++) {
        const rq = get(q); let any = false; for (let i = 0; i < n; i++) { const r = R[q][i] * sg[a * n + i]; rq[i] = r; if (r) any = true; }
        if (any || mode !== 0) { const R2 = R.slice(); R2[q] = rq; const v = walk(node.ch[a], p, R2, mode); for (let i = 0; i < N[p]; i++) out[i] += v[i]; rel(p, v); }
        rel(q, rq);
      }
      return out;
    }
    function iterate(k = 1) {
      for (let s = 0; s < k; s++) {
        it++; const ta = Math.pow(it, 1.5), tb = Math.pow(it, 0.5); dPos = ta / (ta + 1); dNeg = tb / (tb + 1); dSum = Math.pow(it / (it + 1), 2);
        for (let p = 0; p < NP; p++) rel(p, walk(rootNode, p, w0, 0));
      }
      return it;
    }
    // Valeur moyenne en jetons (part du pot de départ, mises de p rendues) pour une stratégie / meilleure réponse.
    function mean(p, v, R) {
      const [j, k] = [0, 1, 2].filter((q) => q !== p), Mj = compat(p, j, R[j], get(p)), Mk = compat(p, k, R[k], get(p)); let num = 0, den = 0;
      for (let i = 0; i < N[p]; i++) { num += R[p][i] * v[i]; den += R[p][i] * Mj[i] * Mk[i]; }
      rel(p, Mj); rel(p, Mk); return den > 0 ? num / den : 0;
    }
    // Gain d'une déviation unilatérale : pour chaque joueur, meilleure réponse − valeur actuelle ; on rapporte la moyenne et le maximum.
    function exploitability() {
      const gains = [];
      for (let p = 0; p < NP; p++) { const b = walk(rootNode, p, w0, 1), e = walk(rootNode, p, w0, 2); gains.push(mean(p, b, w0) - mean(p, e, w0)); rel(p, b); rel(p, e); }
      const avg = gains.reduce((a, x) => a + x, 0) / NP, mx = Math.max(...gains);
      return { gains, chips: avg, pct: (avg / P0) * 100, maxPct: (mx / P0) * 100 };
    }
    function locate(path) {
      let node = rootNode; const R = w0.map((r) => r.slice());
      for (const x of path) {
        if (node.t === ACT) { const n = N[node.p], sg = average(node, new Float64Array(node.acts.length * n)); for (let i = 0; i < n; i++) R[node.p][i] *= sg[x * n + i]; node = node.ch[x]; }
        else if (node.t === CHANCE) { const ci = node.cards.indexOf(x); if (ci < 0) throw new Error('Carte absente de l\'arbre'); for (let q = 0; q < NP; q++) for (const i of withCard[q][x]) R[q][i] = 0; node = node.ch[ci]; }
        else break;
      }
      return { node, reach: R };
    }
    // Équité à l'abattage immédiat (river) ou moyenne sur les cartes restantes de l'arbre : part de pot gagnée contre les deux autres.
    function equityVec(cards, p, R) {
      const [j, k] = [0, 1, 2].filter((q) => q !== p);
      if (cards.length === 5) {
        const bid = boardOf(cards), Mj = compat(p, j, R[j], new Float64Array(N[p])), Mk = compat(p, k, R[k], new Float64Array(N[p])), lj = get(p), hj = get(p), lk = get(p), hk = get(p), num = new Float64Array(N[p]), den = new Float64Array(N[p]);
        sweep(bid, p, j, R[j], lj, hj); sweep(bid, p, k, R[k], lk, hk);
        for (let i = 0; i < N[p]; i++) { const tj = Mj[i] - lj[i] - hj[i], tk = Mk[i] - lk[i] - hk[i]; num[i] = lj[i] * lk[i] + (tj * lk[i] + lj[i] * tk) / 2 + tj * tk / 3; den[i] = Mj[i] * Mk[i]; }
        rel(p, lj); rel(p, hj); rel(p, lk); rel(p, hk); return { num, den };
      }
      const d = dealCards(cards), num = new Float64Array(N[p]), den = new Float64Array(N[p]);
      for (const c of d.cards) {
        const R2 = R.map((r, q) => maskCopy(q, r, c)), r = equityVec([...cards, c], p, R2), bl = new Set(withCard[p][c]);
        for (let i = 0; i < N[p]; i++) if (!bl.has(i)) { num[i] += r.num[i] * d.w[p][i]; den[i] += r.den[i] * d.w[p][i]; }
        R2.forEach((b, q) => rel(q, b));
      }
      return { num, den };
    }
    function info(path = []) {
      const { node, reach } = locate(path), res = { node, reach, t: node.t, pot: P0 + node.C[0] + node.C[1] + node.C[2], C: node.C.slice(), board: node.board, ev: [], eq: [], evMean: [], eqMean: [] };
      for (let p = 0; p < NP; p++) {
        const [j, k] = [0, 1, 2].filter((q) => q !== p), Mj = compat(p, j, reach[j], new Float64Array(N[p])), Mk = compat(p, k, reach[k], new Float64Array(N[p]));
        const v = walk(node, p, reach, 2), ev = new Float64Array(N[p]); let num = 0, den = 0;
        for (let i = 0; i < N[p]; i++) { const m = Mj[i] * Mk[i]; ev[i] = m > 1e-12 ? v[i] / m + node.C[p] : NaN; num += reach[p][i] * v[i]; den += reach[p][i] * m; }
        rel(p, v);
        const eqr = equityVec(node.board, p, reach), eq = new Float64Array(N[p]); let en = 0, ed = 0;
        for (let i = 0; i < N[p]; i++) { eq[i] = eqr.den[i] > 1e-12 ? eqr.num[i] / eqr.den[i] : NaN; en += reach[p][i] * eqr.num[i]; ed += reach[p][i] * eqr.den[i]; }
        res.ev.push(ev); res.eq.push(eq); res.evMean.push(den > 0 ? num / den + node.C[p] : NaN); res.eqMean.push(ed > 0 ? en / ed : NaN);
      }
      if (node.t === ACT) {
        const p = node.p, n = N[p], A = node.acts.length, sg = average(node, new Float64Array(A * n));
        res.strategy = sg;
        res.freq = node.acts.map((_, a) => { let s = 0, t = 0; for (let i = 0; i < n; i++) { s += reach[p][i] * sg[a * n + i]; t += reach[p][i]; } return t > 0 ? s / t : 0; });
        const [j, k] = [0, 1, 2].filter((q) => q !== p), Mj = compat(p, j, reach[j], new Float64Array(n)), Mk = compat(p, k, reach[k], new Float64Array(n));
        res.actEv = node.acts.map((_, a) => { const R2 = reach.slice(), v = walk(node.ch[a], p, R2, 2), out = new Float64Array(n); for (let i = 0; i < n; i++) { const m = Mj[i] * Mk[i]; out[i] = m > 1e-12 ? v[i] / m + node.C[p] : NaN; } rel(p, v); return out; });
      }
      return res;
    }
    function label(node, a) {
      const x = node.acts[a], add = x.to - node.bets[node.p], f = (v) => (Math.round(v * 10) / 10).toLocaleString('fr-FR');
      if (x.k === 'x') return 'Check'; if (x.k === 'f') return 'Se coucher'; if (x.k === 'c') return `Suivre ${f(add)}`; if (x.k === 'a') return `Tapis ${f(x.to)}`;
      if (x.k === 'b') return `Miser ${f(add)} (${Math.round((add / node.pot) * 100)} %)`; return `Relancer à ${f(x.to)}`;
    }
    const stats = () => { let acts = 0; for (const n of nodes) if (n.t === ACT) acts++; return { nodes: nodes.length, acts, boards: boards.length, approx, iterations: it }; };
    return { game: '3way', cfg, board, P0, S, N, hands, w0, root: rootNode, nodes, iterate, exploitability, info, label, locate, stats };
  }
  const api = { create, DEFAULT_SIZES, ACT, CHANCE, TERM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Solver3 = api;
})(typeof window !== 'undefined' ? window : globalThis);
