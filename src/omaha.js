// Omaha (PLO) : évaluation avec exactement 2 cartes privatives + 3 cartes du board, équité Monte-Carlo ou exacte,
// description d'une main de départ et taille maximale d'une relance pot-limit.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const P2 = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const B3 = []; for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) for (let c = b + 1; c < 5; c++) B3.push([a, b, c]);
  const five = [0, 0, 0, 0, 0];

  // Meilleure main de 5 cartes : 2 des 4 cartes privatives + 3 des 5 cartes du board (60 combinaisons).
  function evaluate(hole, board) {
    let best = -1;
    const bs = board.length === 5 ? B3 : B3.filter((t) => t.every((i) => i < board.length));
    for (const [i, j] of P2) {
      five[0] = hole[i]; five[1] = hole[j];
      for (const [a, b, c] of bs) { five[2] = board[a]; five[3] = board[b]; five[4] = board[c]; const v = E.evaluate(five); if (v > best) best = v; }
    }
    return best;
  }

  // Équité : hands = tableau de mains de 4 cartes (ou null = main aléatoire), board de 0 à 5 cartes.
  function equity(hands, board = [], opts = {}) {
    const n = hands.length, rand = opts.random || Math.random, iters = opts.iterations || 6000;
    const known = new Set(board); hands.forEach((h) => h && h.forEach((c) => known.add(c)));
    const deck = []; for (let c = 0; c < 52; c++) if (!known.has(c)) deck.push(c);
    const eq = new Array(n).fill(0), win = new Array(n).fill(0), tie = new Array(n).fill(0), need = 5 - board.length;
    const randomSlots = hands.filter((h) => !h).length * 4;
    // Exact quand il ne reste qu'une ou deux cartes à tirer et que toutes les mains sont connues.
    const exact = !randomSlots && need <= 2;
    const vals = new Array(n); let total = 0;
    const score = (bd, hs) => {
      let best = -1, cnt = 0;
      for (let k = 0; k < n; k++) { vals[k] = evaluate(hs[k], bd); if (vals[k] > best) { best = vals[k]; cnt = 1; } else if (vals[k] === best) cnt++; }
      for (let k = 0; k < n; k++) if (vals[k] === best) { eq[k] += 1 / cnt; if (cnt === 1) win[k]++; else tie[k]++; }
      total++;
    };
    if (exact) {
      if (need === 0) score(board, hands);
      else if (need === 1) for (const c of deck) score([...board, c], hands);
      else for (let a = 0; a < deck.length; a++) for (let b = a + 1; b < deck.length; b++) score([...board, deck[a], deck[b]], hands);
    } else {
      const d = deck.slice(), m = need + randomSlots;
      for (let it = 0; it < iters; it++) {
        for (let k = 0; k < m; k++) { const j = k + Math.floor(rand() * (d.length - k)); const t = d[k]; d[k] = d[j]; d[j] = t; }
        let p = 0; const hs = hands.map((h) => h || [d[p++], d[p++], d[p++], d[p++]]);
        const bd = board.concat(d.slice(p, p + need));
        score(bd, hs);
      }
    }
    return { equity: eq.map((x) => x / total), win: win.map((x) => x / total), tie: tie.map((x) => x / total), samples: total, exact };
  }

  // Description d'une main de départ : couleurs, connexion, paires, as assorti.
  function describe(hole) {
    const r = hole.map((c) => c >> 2), s = hole.map((c) => c & 3);
    const bySuit = [0, 0, 0, 0]; s.forEach((x) => bySuit[x]++);
    const suitedPairs = bySuit.filter((x) => x >= 2).length, maxSuit = Math.max(...bySuit);
    const cnt = {}; r.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
    const pairs = Object.entries(cnt).filter(([, v]) => v >= 2).map(([k]) => +k), trips = Object.values(cnt).some((v) => v >= 3);
    const u = [...new Set(r)].sort((a, b) => b - a), span = u[0] - u[u.length - 1];
    const nutSuit = [0, 1, 2, 3].some((x) => bySuit[x] >= 2 && hole.some((c) => (c & 3) === x && (c >> 2) === 12));
    const tags = [];
    if (suitedPairs === 2) tags.push('double assortie'); else if (maxSuit === 2) tags.push('simple assortie'); else if (maxSuit >= 3) tags.push(maxSuit === 4 ? 'quatre de la même couleur (mauvais)' : 'trois de la même couleur (une carte perdue)'); else tags.push('dépareillée (rainbow)');
    if (nutSuit) tags.push('as assorti (tirage couleur max)');
    if (trips) tags.push('brelan en main (mauvais : une carte perdue)'); else if (pairs.length === 2) tags.push('deux paires en main'); else if (pairs.length === 1) tags.push('une paire');
    if (u.length === 4 && span <= 4) tags.push('très connectée (4 cartes dans 5 rangs)'); else if (u.length >= 3 && span <= 5) tags.push('connectée');
    else if (span >= 9 && !pairs.length) tags.push('cartes éloignées (« danglers »)');
    return { tags, suitedPairs, maxSuit, pairs, connected: u.length >= 3 && span <= 5, nutSuit };
  }

  // Pot-limit : relance maximale = pot + mise à payer + (mise à payer), soit « relance du pot ».
  // Retourne le montant total de la relance (ta mise finale sur cette rue).
  function potRaise(pot, toCall, alreadyIn = 0) {
    // pot = tout ce qui est au milieu, mise adverse comprise ; toCall = ce qu'il te manque pour suivre.
    return alreadyIn + toCall + (pot + toCall);
  }

  const api = { evaluate, equity, describe, potRaise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Omaha = api;
})(typeof window !== 'undefined' ? window : globalThis);
