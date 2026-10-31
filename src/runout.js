// Cartes du turn : équité exacte d'une range contre une autre pour chaque carte du turn (énumération complète des rivers).
// Sert l'outil « Cartes du turn » et le module du même nom. Les ranges sont des ensembles de mains (E.parseRange), sans poids.
(function (root) {
  const E = root.Engine || (typeof require !== 'undefined' ? require('./engine.js') : null);

  // Équité exacte sur un board de 4 ou 5 cartes : chaque paire de combos compatibles, chaque river possible.
  function exactRvR(A, B, board) {
    const dead = new Set(board), ca = E.rangeCombos(A, [...dead]), cb = E.rangeCombos(B, [...dead]);
    const na = ca.length, nb = cb.length, winA = new Float64Array(na), cntA = new Float64Array(na), winB = new Float64Array(nb), cntB = new Float64Array(nb);
    const rivers = [];
    if (board.length === 5) rivers.push(null); else for (let c = 0; c < 52; c++) if (!dead.has(c)) rivers.push(c);
    const va = new Float64Array(na), vb = new Float64Array(nb);
    for (const r of rivers) {
      const full = r === null ? board : [...board, r];
      for (let i = 0; i < na; i++) { const h = ca[i]; va[i] = h[0] === r || h[1] === r ? -1 : E.evaluate([h[0], h[1], ...full]); }
      for (let j = 0; j < nb; j++) { const h = cb[j]; vb[j] = h[0] === r || h[1] === r ? -1 : E.evaluate([h[0], h[1], ...full]); }
      for (let i = 0; i < na; i++) {
        const x = va[i]; if (x < 0) continue; const a0 = ca[i][0], a1 = ca[i][1];
        for (let j = 0; j < nb; j++) {
          const y = vb[j]; if (y < 0) continue; const b = cb[j];
          if (b[0] === a0 || b[0] === a1 || b[1] === a0 || b[1] === a1) continue;
          const w = x > y ? 1 : x === y ? 0.5 : 0;
          winA[i] += w; cntA[i]++; winB[j] += 1 - w; cntB[j]++;
        }
      }
    }
    let wa = 0, ta = 0; for (let i = 0; i < na; i++) { wa += winA[i]; ta += cntA[i]; }
    const perA = Array.from(winA, (w, i) => (cntA[i] ? w / cntA[i] : 0)), perB = Array.from(winB, (w, j) => (cntB[j] ? w / cntB[j] : 0));
    return { eqA: ta ? wa / ta : 0, wins: wa, pairs: ta, perA, perB, nA: na, nB: nb };
  }
  const share = (v, t) => (v.length ? v.filter((x) => x >= t).length / v.length : 0);

  // Rapport du turn : une ligne par carte possible, et l'équité du flop qui en découle (exacte, par agrégation).
  // Asynchrone par tranches pour laisser respirer l'interface ; onStep(fait, total) facultatif.
  async function turnReport(A, B, flop, onStep, opts = {}) {
    const dead = new Set(flop), out = [], nuts = opts.nuts ?? 0.8;
    let W = 0, T = 0; const cards = []; for (let c = 0; c < 52; c++) if (!dead.has(c)) cards.push(c);
    for (let k = 0; k < cards.length; k++) {
      const c = cards[k], r = exactRvR(A, B, [...flop, c]);
      W += r.wins; T += r.pairs;
      out.push({ card: c, eqA: r.eqA, nutsA: share(r.perA, nuts), nutsB: share(r.perB, nuts), nA: r.nA, nB: r.nB, pairs: r.pairs });
      if (onStep) onStep(k + 1, cards.length);
      if (opts.yield !== false && typeof setTimeout !== 'undefined' && k % 2 === 1) await new Promise((res) => setTimeout(res, 0));
    }
    return { flopEq: T ? W / T : 0, turns: out };
  }

  // Famille d'une carte du turn par rapport au flop : surcarte, carte qui paire le board, couleur (2e ou 3e carte), carte basse connectée.
  function turnFamily(flop, c) {
    const r = c >> 2, s = c & 3, fr = flop.map((x) => x >> 2), fs = flop.map((x) => x & 3);
    const sameSuit = fs.filter((x) => x === s).length, hi = Math.max(...fr);
    const tags = [];
    if (fr.includes(r)) tags.push('paire le board');
    else if (r > hi) tags.push('surcarte');
    else if (r < Math.min(...fr)) tags.push('sous le board'); else tags.push('carte moyenne');
    if (sameSuit === 2) tags.push('3e carte de la couleur'); else if (sameSuit === 1 && new Set(fs).size === 3) tags.push('tirage couleur possible');
    const rs = [...new Set([...fr, r])].sort((a, b) => a - b); let best = 0;
    for (let lo = -1; lo <= 12; lo++) { const n = rs.filter((x) => (x === 12 && lo === -1) || (x >= lo && x <= lo + 4)).length; best = Math.max(best, n); }
    if (best >= 3 && !fr.includes(r)) { const before = (() => { const q = [...new Set(fr)].sort((a, b) => a - b); let m = 0; for (let lo = -1; lo <= 12; lo++) m = Math.max(m, q.filter((x) => (x === 12 && lo === -1) || (x >= lo && x <= lo + 4)).length); return m; })(); if (best > before) tags.push('connecte (suites)'); }
    return tags;
  }

  const api = { exactRvR, turnReport, turnFamily };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Runout = api;
})(typeof window !== 'undefined' ? window : globalThis);
