// Analyse de board : comment une range touche un board (main faite + tirages), combinaison par combinaison.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const MADE = ['Quinte flush', 'Carré', 'Full', 'Couleur', 'Suite', 'Brelan (set)', 'Brelan (trips)', 'Double paire', 'Overpair', 'Top paire', 'Paire moyenne', 'Petite paire', 'Rien'];
  const DRAWS = ['Tirage couleur', 'Suite deux bouts', 'Ventrale', 'Deux overcards'];
  const hasStraight = (m) => { for (let hi = 12; hi >= 4; hi--) if (((m >> (hi - 4)) & 31) === 31) return true; return (m & 0b1000000001111) === 0b1000000001111; };

  // Catégorie précise d'une main sur un board (3 à 5 cartes), du point de vue des cartes privées.
  function classify(hole, board) {
    const v = E.evaluate([...hole, ...board]), cat = E.category(v), br = board.map((c) => c >> 2), hr = hole.map((c) => c >> 2);
    const top = Math.max(...br), sorted = [...new Set(br)].sort((a, b) => b - a);
    let made;
    if (cat === 8) made = 0; else if (cat === 7) made = 1; else if (cat === 6) made = 2; else if (cat === 5) made = 3; else if (cat === 4) made = 4;
    else {
      const pocket = hr[0] === hr[1], hits = [...new Set(hr.filter((r) => br.includes(r)))];
      const pairClass = (r) => (pocket && r === hr[0] && !br.includes(r)) ? (r > top ? 8 : r > sorted[sorted.length - 1] ? 10 : 11) : r === top ? 9 : r === sorted[1] ? 10 : 11;
      if (cat === 3) made = pocket && br.includes(hr[0]) ? 5 : hits.length ? 6 : 12;
      else if (cat === 2 && !pocket && hits.length === 2) made = 7;
      else if (pocket && !br.includes(hr[0])) made = pairClass(hr[0]); // paire servie, éventuelle paire du board partagée
      else if (hits.length === 1) made = pairClass(hits[0]);
      else made = 12; // seul le board fait la main
    }
    const draws = [];
    if (board.length < 5 && made > 3) {
      for (let s = 0; s < 4; s++) if ([...hole, ...board].filter((c) => (c & 3) === s).length === 4 && hole.some((c) => (c & 3) === s)) draws.push(0);
      if (made > 4) {
        const m = [...hole, ...board].reduce((a, c) => a | (1 << (c >> 2)), 0), bm = board.reduce((a, c) => a | (1 << (c >> 2)), 0);
        let outs = 0; for (let r = 0; r < 13; r++) if (!(m & (1 << r)) && hasStraight(m | (1 << r)) && !hasStraight(bm | (1 << r))) outs++;
        if (outs >= 2) draws.push(1); else if (outs === 1) draws.push(2);
      }
      if (made === 12 && hr[0] > top && hr[1] > top) draws.push(3);
    }
    return { made, draws };
  }

  // Répartition d'une range (Set de mains abstraites) sur un board. Retourne combos par catégorie et la liste des mains.
  function analyze(range, board, dead = []) {
    const combos = E.rangeCombos(range, [...board, ...dead]);
    const made = new Array(MADE.length).fill(0), draws = new Array(DRAWS.length).fill(0), byMade = MADE.map(() => new Map());
    let comboDraw = 0;
    for (const c of combos) {
      const k = classify(c, board); made[k.made]++;
      const h = E.abstractOf(c[0], c[1]); byMade[k.made].set(h, (byMade[k.made].get(h) || 0) + 1);
      if (k.draws.length) comboDraw++; k.draws.forEach((d) => draws[d]++);
    }
    return { total: combos.length, made, draws, comboDraw, byMade };
  }

  // Texture : description factuelle d'un flop.
  function texture(board) {
    const suits = board.slice(0, 3).map((c) => c & 3), ranks = board.slice(0, 3).map((c) => c >> 2).sort((a, b) => b - a);
    const ns = new Set(suits).size, paired = new Set(ranks).size < 3, span = ranks[0] - ranks[2];
    const tags = [ns === 1 ? 'monocolore' : ns === 2 ? 'deux couleurs' : 'arc-en-ciel'];
    if (paired) tags.push('pairé');
    if (!paired && span <= 4) tags.push('connecté'); else if (!paired && span >= 8) tags.push('sec');
    if (ranks[0] >= 9) tags.push('haut (' + E.RANKS[ranks[0]] + ')'); else tags.push('bas');
    return tags;
  }

  // Distribution d'équité : équité de chaque combinaison d'une range contre l'autre range, sur un board donné.
  function equityDistribution(rangeA, rangeB, board, opts = {}) {
    const R = opts.random || Math.random, it = opts.iterations || 250, maxN = opts.max || 140;
    const ca = E.rangeCombos(rangeA, board), cb = E.rangeCombos(rangeB, board);
    const sample = (arr) => { if (arr.length <= maxN) return arr; const out = [], step = arr.length / maxN; for (let k = 0; k < maxN; k++) out.push(arr[Math.floor(k * step)]); return out; };
    const side = (mine, theirs) => sample(mine).map((c) => {
      const opp = theirs.filter((x) => x[0] !== c[0] && x[0] !== c[1] && x[1] !== c[0] && x[1] !== c[1]);
      return opp.length ? E.equity([{ hand: c }, { combos: opp }], board, { iterations: it, random: R }).equity[0] : 0.5;
    }).sort((x, y) => y - x);
    const a = side(ca, cb), b = side(cb, ca), avg = (v) => v.reduce((x, y) => x + y, 0) / (v.length || 1);
    const nuts = (v) => v.filter((x) => x > 0.8).length / (v.length || 1);
    return { a, b, avgA: avg(a), avgB: avg(b), nutsA: nuts(a), nutsB: nuts(b), nA: ca.length, nB: cb.length };
  }

  const api = { MADE, DRAWS, classify, analyze, texture, equityDistribution };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Board = api;
})(typeof window !== 'undefined' ? window : globalThis);
