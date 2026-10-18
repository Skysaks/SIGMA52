// Moteur SIGMA 52 : cartes, évaluateur 7 cartes, ranges, équité Monte-Carlo / exacte.
// Carte = entier 0..51 : rang = c >> 2 (0 = 2 ... 12 = As), couleur = c & 3.
(function (root) {
  const RANKS = '23456789TJQKA';
  const SUITS = 'shdc'; // pique, coeur, carreau, trèfle
  const SUIT_SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const CAT_FR = ['Hauteur', 'Paire', 'Double paire', 'Brelan', 'Suite', 'Couleur', 'Full', 'Carré', 'Quinte flush'];

  const card = (s) => {
    const r = RANKS.indexOf(s[0].toUpperCase()), u = SUITS.indexOf(s[1].toLowerCase());
    if (r < 0 || u < 0) throw new Error('Carte invalide : ' + s);
    return (r << 2) | u;
  };
  const cardStr = (c) => RANKS[c >> 2] + SUITS[c & 3];
  const parseCards = (str) => (str || '').replace(/[\s,]+/g, '').match(/.{2}/g)?.map(card) || [];

  // Plus haute suite contenue dans un masque de rangs (bit i = rang i). -1 si aucune.
  function straightHigh(m) {
    for (let hi = 12; hi >= 4; hi--) if (((m >> (hi - 4)) & 31) === 31) return hi;
    if ((m & 0b1000000001111) === 0b1000000001111) return 3; // roue A-2-3-4-5
    return -1;
  }
  const topBits = (m, n) => { const out = []; for (let r = 12; r >= 0 && out.length < n; r--) if (m & (1 << r)) out.push(r); return out; };
  const pack = (cat, ks) => { let v = cat; for (let i = 0; i < 5; i++) v = v * 16 + (ks[i] ?? 0); return v; };

  // Valeur d'une main de 5 à 7 cartes : plus grand = meilleur. Catégorie = Math.floor(v / 16**5).
  function evaluate(cards) {
    const cnt = new Array(13).fill(0), suitMask = [0, 0, 0, 0], suitCnt = [0, 0, 0, 0];
    let mask = 0;
    for (const c of cards) { const r = c >> 2, s = c & 3; cnt[r]++; mask |= 1 << r; suitMask[s] |= 1 << r; suitCnt[s]++; }
    for (let s = 0; s < 4; s++) if (suitCnt[s] >= 5) {
      const sf = straightHigh(suitMask[s]);
      if (sf >= 0) return pack(8, [sf]);
      return pack(5, topBits(suitMask[s], 5));
    }
    const quads = [], trips = [], pairs = [];
    for (let r = 12; r >= 0; r--) { if (cnt[r] === 4) quads.push(r); else if (cnt[r] === 3) trips.push(r); else if (cnt[r] === 2) pairs.push(r); }
    if (quads.length) return pack(7, [quads[0], topBits(mask & ~(1 << quads[0]), 1)[0]]);
    if (trips.length && (trips.length > 1 || pairs.length)) return pack(6, [trips[0], trips.length > 1 ? Math.max(trips[1], pairs[0] ?? -1) : pairs[0]]);
    const st = straightHigh(mask);
    if (st >= 0) return pack(4, [st]);
    if (trips.length) return pack(3, [trips[0], ...topBits(mask & ~(1 << trips[0]), 2)]);
    if (pairs.length >= 2) return pack(2, [pairs[0], pairs[1], topBits(mask & ~(1 << pairs[0]) & ~(1 << pairs[1]), 1)[0]]);
    if (pairs.length) return pack(1, [pairs[0], ...topBits(mask & ~(1 << pairs[0]), 3)]);
    return pack(0, topBits(mask, 5));
  }
  const category = (v) => Math.floor(v / 1048576);
  const categoryName = (v) => CAT_FR[category(v)];

  // ---- Ranges ----
  // Les 169 mains de départ, grille 13x13 : diagonale = paires, haut-droite = assorties (s), bas-gauche = dépareillées (o).
  function handName(i, j) { // i, j = index ligne/colonne, 0 = As
    const a = 12 - i, b = 12 - j;
    if (i === j) return RANKS[a] + RANKS[a];
    return i < j ? RANKS[a] + RANKS[b] + 's' : RANKS[b] + RANKS[a] + 'o';
  }
  const ALL169 = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) ALL169.push(handName(i, j));

  // Combos concrets d'une main abstraite ("AKs" -> 4, "AKo" -> 12, "QQ" -> 6, "AK" -> 16).
  function combos(h) {
    const a = RANKS.indexOf(h[0]), b = RANKS.indexOf(h[1]), out = [];
    if (a < 0 || b < 0) throw new Error('Main invalide : ' + h);
    for (let s1 = 0; s1 < 4; s1++) for (let s2 = 0; s2 < 4; s2++) {
      if (a === b && s2 <= s1) continue;
      if (h[2] === 's' && s1 !== s2) continue;
      if (h[2] === 'o' && s1 === s2) continue;
      out.push([(a << 2) | s1, (b << 2) | s2]);
    }
    return out;
  }

  // Parse "22+, A2s+, KTs+, QJo, 76s-54s, AKo, random" -> Set de mains abstraites.
  function parseRange(str) {
    const set = new Set();
    for (let tok of (str || '').split(/[\s,]+/).filter(Boolean)) {
      tok = tok.trim();
      if (/^(random|any|100%)$/i.test(tok)) { ALL169.forEach((h) => set.add(h)); continue; }
      tok = tok.replace(/[2-9tjqka]/gi, (c) => c.toUpperCase()).replace(/[SO]/g, (c) => c.toLowerCase());
      const m = tok.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)(\+?)(?:-([2-9TJQKA])([2-9TJQKA])([so]?))?$/);
      if (!m) throw new Error('Range illisible : ' + tok);
      let [, r1, r2, sfx, plus, e1, e2] = m;
      let a = RANKS.indexOf(r1), b = RANKS.indexOf(r2);
      if (b > a) [a, b] = [b, a];
      const add = (x, y) => {
        if (x === y) set.add(RANKS[x] + RANKS[x]);
        else if (sfx) set.add(RANKS[x] + RANKS[y] + sfx);
        else { set.add(RANKS[x] + RANKS[y] + 's'); set.add(RANKS[x] + RANKS[y] + 'o'); }
      };
      if (a === b) { // paires
        const lo = e1 ? Math.min(a, RANKS.indexOf(e1)) : a, hi = plus ? 12 : e1 ? Math.max(a, RANKS.indexOf(e1)) : a;
        for (let r = lo; r <= hi; r++) add(r, r);
      } else if (plus) { for (let y = b; y < a; y++) add(a, y); }
      else if (e1) {
        let x2 = RANKS.indexOf(e1), y2 = RANKS.indexOf(e2); if (y2 > x2) [x2, y2] = [y2, x2];
        if (x2 === a) for (let y = Math.min(b, y2); y <= Math.max(b, y2); y++) add(a, y); // A5s-A2s : kicker variable
        else for (let d = Math.min(0, y2 - b); d <= Math.max(0, y2 - b); d++) add(a + d, b + d); // 76s-54s : bande de connecteurs
      }
      else add(a, b);
    }
    return set;
  }
  // Range -> liste de combos, sans les cartes mortes.
  function rangeCombos(range, dead = []) {
    const d = new Set(dead), out = [];
    for (const h of (range instanceof Set ? range : parseRange(range))) for (const c of combos(h)) if (!d.has(c[0]) && !d.has(c[1])) out.push(c);
    return out;
  }
  const rangePct = (set) => [...set].reduce((n, h) => n + combos(h).length, 0) / 1326 * 100;

  // Classement d'une main abstraite dans un ensemble (pour savoir si "KTo" est dans "KTo+", etc.)
  const inRange = (hand, set) => set.has(hand);
  function abstractOf(c1, c2) {
    let a = c1 >> 2, b = c2 >> 2;
    if (a === b) return RANKS[a] + RANKS[a];
    const suited = (c1 & 3) === (c2 & 3);
    if (b > a) [a, b] = [b, a];
    return RANKS[a] + RANKS[b] + (suited ? 's' : 'o');
  }

  // ---- Équité ----
  // Générateur pseudo-aléatoire reproductible (mulberry32) pour des tests stables.
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

  // players : tableau de { hand: [c1,c2] } ou { combos: [[c1,c2],...] }. board : 0 à 5 cartes.
  // Retour : { equity: [..], win: [..], tie: [..], n, exact }.
  function equity(players, board = [], opts = {}) {
    const n = players.length, iters = opts.iterations || 50000, rand = opts.random || Math.random;
    const known = new Set(board); players.forEach((p) => p.hand && p.hand.forEach((c) => known.add(c)));
    const fixed = players.every((p) => p.hand);
    const eq = new Array(n).fill(0), win = new Array(n).fill(0), tie = new Array(n).fill(0);
    const need = 5 - board.length;
    let total = 0;
    const score = (hands, full) => {
      let best = -1, winners = [];
      for (let i = 0; i < n; i++) { const v = evaluate([hands[i][0], hands[i][1], ...full]); if (v > best) { best = v; winners = [i]; } else if (v === best) winners.push(i); }
      for (const w of winners) { eq[w] += 1 / winners.length; if (winners.length === 1) win[w]++; else tie[w]++; }
      total++;
    };
    // Exact si mains connues et peu de tirages restants (flop ou plus tard).
    if (fixed && need <= 2) {
      const deck = []; for (let c = 0; c < 52; c++) if (!known.has(c)) deck.push(c);
      const hands = players.map((p) => p.hand);
      if (need === 0) score(hands, board);
      else if (need === 1) for (const c of deck) score(hands, [...board, c]);
      else for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) score(hands, [...board, deck[i], deck[j]]);
      return { equity: eq.map((x) => x / total), win: win.map((x) => x / total), tie: tie.map((x) => x / total), n: total, exact: true };
    }
    const pools = players.map((p) => p.hand ? null : p.combos.filter((c) => !known.has(c[0]) && !known.has(c[1])));
    if (pools.some((p) => p && !p.length)) throw new Error('Range vide après retrait des cartes connues');
    const used = new Uint8Array(52);
    for (let it = 0; it < iters; it++) {
      used.fill(0); known.forEach((c) => (used[c] = 1));
      const hands = []; let ok = true;
      for (let i = 0; i < n; i++) {
        if (players[i].hand) { hands.push(players[i].hand); continue; }
        let tries = 0, h;
        do { h = pools[i][(rand() * pools[i].length) | 0]; } while ((used[h[0]] || used[h[1]]) && ++tries < 50);
        if (used[h[0]] || used[h[1]]) { ok = false; break; }
        used[h[0]] = used[h[1]] = 1; hands.push(h);
      }
      if (!ok) continue;
      const full = board.slice();
      while (full.length < 5) { const c = (rand() * 52) | 0; if (!used[c]) { used[c] = 1; full.push(c); } }
      score(hands, full);
    }
    return { equity: eq.map((x) => x / total), win: win.map((x) => x / total), tie: tie.map((x) => x / total), n: total, exact: false };
  }

  // Outs : cartes du talon qui font passer la main du héros devant celle (connue) de l'adversaire à la prochaine carte.
  function outs(hero, villain, board) {
    const known = new Set([...hero, ...villain, ...board]), res = [];
    for (let c = 0; c < 52; c++) if (!known.has(c)) {
      const b = [...board, c];
      if (evaluate([...hero, ...b]) > evaluate([...villain, ...b])) res.push(c);
    }
    return res;
  }

  const api = { RANKS, SUITS, SUIT_SYM, CAT_FR, card, cardStr, parseCards, evaluate, category, categoryName, handName, ALL169, combos, parseRange, rangeCombos, rangePct, inRange, abstractOf, equity, outs, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
