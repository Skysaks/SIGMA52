// Variantes : Short Deck (6+), Omaha 4 et 5 cartes, Omaha Hi-Lo 8 or better. Évaluation et équité Monte-Carlo ou exacte.
// Short Deck (règles Triton, les plus jouées) : 36 cartes (6 à As), la couleur bat le full, le brelan bat la suite,
// l'as fait la suite basse A-6-7-8-9. Omaha : exactement 2 cartes de la main et 3 du board. Hi-Lo : la moitié du pot à la
// meilleure main basse de 5 rangs différents, 8 ou moins (as bas), formée elle aussi avec 2 cartes privatives + 3 du board.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const P5 = 1048576, P4 = 65536, P3 = 4096, P2 = 256;
  const CNT = new Int8Array(13), SM = new Int32Array(4), SC = new Int8Array(4);
  function top(m, n) { let v = 0, k = 0; for (let r = 12; r >= 0 && k < n; r--) if (m & (1 << r)) { v = v * 16 + r; k++; } for (; k < 5; k++) v *= 16; return v; }
  // Suite en Short Deck : 5 rangs consécutifs parmi 6..A (index 4..12), ou A-6-7-8-9.
  function sdStraight(m) { for (let hi = 12; hi >= 8; hi--) if (((m >> (hi - 4)) & 31) === 31) return hi; if ((m & 0x10f0) === 0x10f0) return 7; return -1; }
  // Valeur d'une main Short Deck de 5 à 7 cartes (catégories : 0 hauteur, 1 paire, 2 deux paires, 3 suite, 4 brelan, 5 full, 6 couleur, 7 carré, 8 quinte flush)
  function evalSD(cards) {
    CNT.fill(0); SM[0] = SM[1] = SM[2] = SM[3] = 0; SC[0] = SC[1] = SC[2] = SC[3] = 0; let mask = 0;
    for (let i = 0; i < cards.length; i++) { const c = cards[i], r = c >> 2, s = c & 3; CNT[r]++; mask |= 1 << r; SM[s] |= 1 << r; SC[s]++; }
    let flushS = -1; for (let s = 0; s < 4; s++) if (SC[s] >= 5) flushS = s;
    if (flushS >= 0) { const sf = sdStraight(SM[flushS]); if (sf >= 0) return 8 * P5 + sf * P4; }
    let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
    for (let r = 12; r >= 0; r--) { const n = CNT[r]; if (n === 4) { if (q < 0) q = r; } else if (n === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; } else if (n === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; } }
    if (q >= 0) { let k = 0; for (let r = 12; r >= 0; r--) if (r !== q && (mask & (1 << r))) { k = r; break; } return 7 * P5 + q * P4 + k * P3; }
    if (flushS >= 0) return 6 * P5 + top(SM[flushS], 5);
    if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return 5 * P5 + t1 * P4 + (t2 >= 0 ? Math.max(t2, p1) : p1) * P3;
    if (t1 >= 0) return 4 * P5 + t1 * P4 + top(mask & ~(1 << t1), 2) / 16;
    const st = sdStraight(mask); if (st >= 0) return 3 * P5 + st * P4;
    if (p2 >= 0) { let k = 0; for (let r = 12; r >= 0; r--) if (r !== p1 && r !== p2 && (mask & (1 << r))) { k = r; break; } return 2 * P5 + p1 * P4 + p2 * P3 + k * P2; }
    if (p1 >= 0) return 1 * P5 + p1 * P4 + top(mask & ~(1 << p1), 3) / 16;
    return top(mask, 5);
  }
  const SD_CAT = ['Hauteur', 'Paire', 'Double paire', 'Suite', 'Brelan', 'Full', 'Couleur', 'Carré', 'Quinte flush'];
  // Combinaisons d'indices
  const choose = (n, k) => { const out = [], cur = []; (function rec(s) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < n; i++) { cur.push(i); rec(i + 1); cur.pop(); } })(0); return out; };
  const HOLE2 = { 4: choose(4, 2), 5: choose(5, 2), 6: choose(6, 2) }, BOARD3 = { 3: choose(3, 3), 4: choose(4, 3), 5: choose(5, 3) };
  const five = [0, 0, 0, 0, 0];
  // Omaha (N cartes) : meilleure main haute avec exactement 2 + 3.
  function evalOmaha(hole, board) {
    let best = -1; const H = HOLE2[hole.length], Bd = BOARD3[board.length];
    for (const [i, j] of H) { five[0] = hole[i]; five[1] = hole[j]; for (const [a, b, c] of Bd) { five[2] = board[a]; five[3] = board[b]; five[4] = board[c]; const v = E.evaluate(five); if (v > best) best = v; } }
    return best;
  }
  // Main basse 8 or better (as = 1) avec 2 + 3 : plus petite valeur = meilleure ; -1 si aucune.
  const lowRank = (c) => { const r = c >> 2; return r === 12 ? 1 : r + 2; };
  function lowOmaha(hole, board) {
    const bl = board.map(lowRank).filter((x) => x <= 8); if (new Set(bl).size < 3) return -1;
    const hl = hole.map(lowRank); let best = -1;
    for (const [i, j] of HOLE2[hole.length]) {
      const a = hl[i], b = hl[j]; if (a > 8 || b > 8 || a === b) continue;
      for (const [x, y, z] of BOARD3[board.length]) {
        const r = [a, b, lowRank(board[x]), lowRank(board[y]), lowRank(board[z])]; if (r.some((v) => v > 8) || new Set(r).size < 5) continue;
        r.sort((u, v) => v - u); const val = r.reduce((s, v) => s * 16 + v, 0);
        if (best < 0 || val < best) best = val;
      }
    }
    return best;
  }
  const evalNLH = (hole, board) => E.evaluate([...hole, ...board]);
  const evalSDh = (hole, board) => evalSD([...hole, ...board]);
  const GAMES = {
    nlh: { label: 'Hold\'em', hole: 2, deck: 52, hi: evalNLH, cat: (v) => E.CAT_FR[E.category(v)] },
    sd: { label: 'Short Deck (6+)', hole: 2, deck: 36, hi: evalSDh, cat: (v) => SD_CAT[Math.floor(v / P5)] },
    plo: { label: 'Omaha PLO (4 cartes)', hole: 4, deck: 52, hi: evalOmaha, cat: (v) => E.CAT_FR[E.category(v)] },
    plo5: { label: 'Omaha 5 cartes', hole: 5, deck: 52, hi: evalOmaha, cat: (v) => E.CAT_FR[E.category(v)] },
    plo8: { label: 'Omaha Hi-Lo 8', hole: 4, deck: 52, hi: evalOmaha, lo: lowOmaha, cat: (v) => E.CAT_FR[E.category(v)] },
  };
  const deckOf = (g) => { const d = []; for (let c = 0; c < 52; c++) if (GAMES[g].deck === 52 || (c >> 2) >= 4) d.push(c); return d; };
  // Partage du pot (hi et éventuellement lo) entre les mains ; renvoie la part de chaque main.
  function shares(G, hands, board) {
    const n = hands.length, hv = hands.map((h) => G.hi(h, board)), out = new Array(n).fill(0);
    const split = (vals, better, part) => { let best = null; vals.forEach((v) => { if (v < 0) return; if (best === null || better(v, best)) best = v; }); if (best === null) return false; const w = vals.map((v) => v === best); const k = w.filter(Boolean).length; w.forEach((x, i) => { if (x) out[i] += part / k; }); return true; };
    if (G.lo) { const lv = hands.map((h) => G.lo(h, board)); const hasLo = lv.some((v) => v >= 0); split(hv, (a, b) => a > b, hasLo ? 0.5 : 1); if (hasLo) split(lv, (a, b) => a < b, 0.5); }
    else split(hv, (a, b) => a > b, 1);
    return out;
  }
  // Équité : hands = mains (null = aléatoire), board partiel. Exacte s'il reste 0 à 2 cartes et que toutes les mains sont connues.
  function equity(game, hands, board = [], opts = {}) {
    const G = GAMES[game], rand = opts.random || Math.random, n = hands.length;
    const known = new Set(board); hands.forEach((h) => h && h.forEach((c) => known.add(c)));
    const deck = deckOf(game).filter((c) => !known.has(c)), need = 5 - board.length, rs = hands.filter((h) => !h).length * G.hole;
    const eq = new Array(n).fill(0), scoop = new Array(n).fill(0); let total = 0;
    const add = (hs, bd) => { const s = shares(G, hs, bd); s.forEach((x, i) => { eq[i] += x; if (x > 0.999) scoop[i]++; }); total++; };
    if (!rs && need <= 2) {
      if (need === 0) add(hands, board);
      else if (need === 1) for (const c of deck) add(hands, [...board, c]);
      else for (let a = 0; a < deck.length; a++) for (let b = a + 1; b < deck.length; b++) add(hands, [...board, deck[a], deck[b]]);
    } else {
      const d = deck.slice(), m = need + rs, it = opts.iterations || 4000;
      for (let t = 0; t < it; t++) {
        for (let k = 0; k < m; k++) { const j = k + Math.floor(rand() * (d.length - k)); const x = d[k]; d[k] = d[j]; d[j] = x; }
        let p = 0; const hs = hands.map((h) => h || d.slice(p, (p += G.hole)));
        add(hs, board.concat(d.slice(p, p + need)));
      }
    }
    return { equity: eq.map((x) => x / total), scoop: scoop.map((x) => x / total), samples: total, exact: !rs && need <= 2 };
  }
  // Forme canonique d'une main (permutation des couleurs) : sert aux tables précalculées.
  const PERMS = []; (function p(a, l) { if (!l.length) { PERMS.push(a); return; } l.forEach((x, i) => p([...a, x], l.filter((_, j) => j !== i))); })([], [0, 1, 2, 3]);
  function canon(cards) {
    let best = null;
    for (const pm of PERMS) { const k = cards.map((c) => (c & ~3) | pm[c & 3]).sort((a, b) => b - a); let v = 0; for (const c of k) v = v * 64 + c; if (best === null || v < best) best = v; }
    return best;
  }
  const api = { GAMES, SD_CAT, evalSD, evalOmaha, lowOmaha, equity, deckOf, canon, shares };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Variants = api;
})(typeof window !== 'undefined' ? window : globalThis);
