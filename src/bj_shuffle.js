// Suivi de mélange (shuffle tracking) et séquençage des as de SIGMA 52.
// Modèle de mélange manuel de casino : la pile à mélanger est un tableau (index 0 = dessus). Opérations :
// riffle (modèle Gilbert-Shannon-Reeds : coupe binomiale, chaque carte tombe du paquet gauche ou droit avec une probabilité
// proportionnelle à sa taille), strip (paquets pris dessus et empilés : leur ordre s'inverse), cut, et « zones » (la pile est
// partagée en piles, on prend une poignée sur chacune, on la mélange, on la pose sur la pile finale).
// Le joueur connaît le compte de chaque segment de la défausse ; la carte de mélange (map) dit où chaque segment risque de finir ;
// on en déduit la richesse attendue de chaque zone du nouveau sabot et l'endroit où couper.
(function (root) {
  'use strict';
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (rnd) => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  const binom = (n, rnd) => { let k = 0; for (let i = 0; i < n; i++) if (rnd() < 0.5) k++; return k; };
  function riffle(a, rnd) {
    const k = binom(a.length, rnd), L = a.slice(0, k), Rr = a.slice(k), out = new Array(a.length);
    let i = L.length, j = Rr.length, o = a.length;
    while (i || j) { if (rnd() * (i + j) < i) out[--o] = L[--i]; else out[--o] = Rr[--j]; }
    return out;
  }
  function strip(a, rnd, mn = 5, mx = 12) {
    const out = []; let p = 0; const packs = [];
    while (p < a.length) { const n = mn + Math.floor(rnd() * (mx - mn + 1)); packs.push(a.slice(p, p + n)); p += n; }
    for (let i = packs.length - 1; i >= 0; i--) out.push(...packs[i]);
    return out;
  }
  function cut(a, rnd) { const k = Math.max(1, Math.min(a.length - 1, Math.round(a.length / 2 + gauss(rnd) * a.length / 10))); return a.slice(k).concat(a.slice(0, k)); }
  // Partage en n piles à peu près égales (prises successives sur le dessus).
  function piles(a, n, rnd) { const out = []; let p = 0; for (let i = 0; i < n; i++) { const left = a.length - p, sz = i === n - 1 ? left : Math.max(1, Math.round(left / (n - i) + gauss(rnd) * 6)); out.push(a.slice(p, p + sz)); p += sz; } return out; }
  // Une passe en zones : piles, poignées de taille ~grab (écart-type sd) prises sur 2 piles à la fois, opérations, pile finale.
  function zonePass(a, rnd, o) {
    const P = piles(a, o.piles || 2, rnd), outPacks = [];
    let i = 0;
    while (P.some((x) => x.length)) {
      const A = P[i % P.length], B = P[(i + 1) % P.length]; i++;
      const g1 = Math.max(4, Math.round(o.grab + gauss(rnd) * (o.sd || 4))), g2 = Math.max(4, Math.round(o.grab + gauss(rnd) * (o.sd || 4)));
      let pk = A.splice(0, g1); if (B !== A) pk = pk.concat(B.splice(0, g2));
      if (!pk.length) continue;
      for (const op of o.ops) pk = op === 'riffle' ? riffle(pk, rnd) : op === 'strip' ? strip(pk, rnd, o.stripMin, o.stripMax) : pk;
      outPacks.push(pk);
    }
    const out = []; for (let k = outPacks.length - 1; k >= 0; k--) out.push(...outPacks[k]);
    return out;
  }
  const PROCS = {
    aleatoire: { label: 'Mélange parfait (machine à lots, ou mélange très soigné)', passes: [], random: true, note: 'Référence : aucune information ne survit. Rien à suivre.' },
    zone2rs: { label: '2 piles, poignées d\'un demi-paquet, riffle-strip-riffle', passes: [{ piles: 2, grab: 26, sd: 4, ops: ['riffle', 'strip', 'riffle'] }], note: 'Procédure manuelle courante en sabot : modérément suivable.' },
    zone2r: { label: '2 piles, poignées d\'un paquet, un seul riffle', passes: [{ piles: 2, grab: 52, sd: 6, ops: ['riffle'] }], note: 'Mélange paresseux : les segments survivent presque intacts.' },
    zone2rr: { label: '2 piles, poignées d\'un paquet, deux riffles', passes: [{ piles: 2, grab: 52, sd: 6, ops: ['riffle', 'riffle'] }], note: 'Deux riffles : les cartes se mêlent dans la poignée, mais la poignée reste à sa place.' },
    zone3: { label: '3 piles, poignées d\'un demi-paquet, riffle-strip-riffle', passes: [{ piles: 3, grab: 26, sd: 4, ops: ['riffle', 'strip', 'riffle'] }], note: 'Trois piles : les zones se mélangent davantage entre elles.' },
    double: { label: 'Deux passes 2 piles riffle-strip-riffle', passes: [{ piles: 2, grab: 26, sd: 4, ops: ['riffle', 'strip', 'riffle'] }, { piles: 2, grab: 26, sd: 4, ops: ['riffle', 'riffle'] }], note: 'Deux passes complètes : beaucoup plus difficile à suivre.' },
  };
  function shuffleStack(a, proc, rnd) {
    if (proc.random) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
    let b = a; for (const p of proc.passes) b = zonePass(b, rnd, p);
    return b;
  }
  // Carte de mélange : M[f][s] = probabilité qu'une carte de la zone finale f vienne du segment d'origine s (zones de seg cartes).
  function shuffleMap(proc, n, seg, trials = 400, seed = 11) {
    const rnd = rng(seed), S = Math.ceil(n / seg), M = Array.from({ length: S }, () => new Float64Array(S)), lab = Array.from({ length: n }, (_, i) => i);
    for (let t = 0; t < trials; t++) { const out = shuffleStack(lab, proc, rnd); for (let f = 0; f < n; f++) M[Math.floor(f / seg)][Math.floor(out[f] / seg)] += 1; }
    for (const row of M) { let s = 0; for (const x of row) s += x; for (let i = 0; i < row.length; i++) row[i] /= s || 1; }
    return M;
  }
  // Prédiction de la richesse de chaque zone finale : moyenne pondérée des comptes par carte des segments d'origine.
  function predict(M, segAvg) { return M.map((row) => row.reduce((a, p, s) => a + p * segAvg[s], 0)); }
  // Un sabot joué puis mélangé : piles d'origine, comptes par segment, ordre final.
  // tags : valeur de comptage par rang (index 1..10) ; unplayedTop : les cartes non jouées sont posées sur la défausse.
  function dealAndShuffle(decks, pen, proc, rnd, tags, unplayedTop = true) {
    const n = decks * 52, shoe = []; for (let d = 0; d < decks; d++) for (let r = 1; r <= 13; r++) for (let k = 0; k < 4; k++) shoe.push(r >= 10 ? 10 : r);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [shoe[i], shoe[j]] = [shoe[j], shoe[i]]; }
    const played = Math.floor(n * pen), discards = shoe.slice(0, played).reverse(), rest = shoe.slice(played);
    const stack = unplayedTop ? rest.concat(discards) : discards.concat(rest);
    return { stack, out: shuffleStack(stack, proc, rnd), played, n, unplayed: unplayedTop ? n - played : 0 };
  }
  // Valeur du suivi : on coupe pour mettre en tête de sabot la zone prédite la plus riche (K cartes), et on compare au hasard.
  function trackingStudy(o) {
    const decks = o.decks || 6, pen = o.pen || 0.75, proc = PROCS[o.proc] || o.procObj, seg = o.seg || 52, K = o.K || 104, trials = o.trials || 2000, rnd = rng(o.seed || 5);
    const tags = o.tags || [0, -1, 1, 1, 1, 1, 1, 0, 0, 0, -1], n = decks * 52, M = shuffleMap(proc, n, seg, o.mapTrials || 300, (o.seed || 5) + 1);
    const S = Math.ceil(n / seg); let sumT = 0, sumR = 0, sumO = 0, sumT2 = 0, hit = 0, hitR = 0, sxy = 0, sxx = 0, syy = 0, sx = 0, sy = 0, cnt = 0;
    const tcOf = (arr, start) => { let s = 0; for (let i = 0; i < K; i++) s += tags[arr[(start + i) % n]]; return -s / (K / 52); };
    for (let t = 0; t < trials; t++) {
      const { stack, out, unplayed } = dealAndShuffle(decks, pen, proc, rnd, tags);
      // Ce que sait le joueur : le compte de chaque segment de la défausse ; pour les cartes non jouées, seulement leur total.
      let um = 0; for (let i = 0; i < unplayed; i++) um += tags[stack[i]]; um /= Math.max(1, unplayed);
      const known = (i) => (i < unplayed ? um : tags[stack[i]]);
      const segAvg = []; for (let s = 0; s < S; s++) { let a = 0, c = 0; for (let i = s * seg; i < Math.min(n, (s + 1) * seg); i++) { a += known(i); c++; } segAvg.push(a / c); }
      const pr = predict(M, segAvg);
      // Coupe : départ à une frontière de zone ; richesse prédite des K premières cartes (somme des zones couvertes).
      let best = 0, bestV = Infinity; const zK = Math.round(K / seg);
      for (let z = 0; z < S; z++) { let v = 0; for (let q = 0; q < zK; q++) v += pr[(z + q) % S]; if (v < bestV) { bestV = v; best = z; } }
      const tTrack = tcOf(out, best * seg), tRand = tcOf(out, Math.floor(rnd() * n));
      let tOr = -Infinity; for (let z = 0; z < S; z++) tOr = Math.max(tOr, tcOf(out, z * seg));
      sumT += tTrack; sumT2 += tTrack * tTrack; sumR += tRand; sumO += tOr; if (tTrack >= 2) hit++; if (tRand >= 2) hitR++;
      for (let z = 0; z < S; z++) { const x = -pr.slice(z, z + zK).concat(pr.slice(0, Math.max(0, z + zK - S))).reduce((a, b) => a + b, 0) * seg / (K / 52), y = tcOf(out, z * seg); sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; cnt++; }
    }
    const corr = (cnt * sxy - sx * sy) / Math.sqrt((cnt * sxx - sx * sx) * (cnt * syy - sy * sy));
    return { tcTrack: sumT / trials, tcRand: sumR / trials, tcOracle: sumO / trials, sdTrack: Math.sqrt(Math.max(0, sumT2 / trials - (sumT / trials) ** 2)), pHi: hit / trials, pHiRand: hitR / trials, corr, K, seg, trials };
  }
  // Séquençage des as : probabilité que l'as suive sa carte clé de d positions après le mélange (d = 1..5), contre 1/13 au hasard.
  function aceSeqStudy(o) {
    const decks = o.decks || 6, pen = o.pen || 0.75, proc = PROCS[o.proc] || o.procObj, trials = o.trials || 1500, rnd = rng(o.seed || 9), n = decks * 52;
    const hits = [0, 0, 0, 0, 0, 0]; let total = 0;
    for (let t = 0; t < trials; t++) {
      const lab = Array.from({ length: n }, (_, i) => i), ranks = []; for (let d = 0; d < decks; d++) for (let r = 1; r <= 13; r++) for (let k = 0; k < 4; k++) ranks.push(r >= 10 ? 10 : r);
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ranks[i], ranks[j]] = [ranks[j], ranks[i]]; }
      const out = shuffleStack(lab, proc, rnd), posOf = new Int32Array(n); out.forEach((c, i) => { posOf[c] = i; });
      const played = Math.floor(n * pen);
      // Dans la pile d'origine, la carte clé est celle juste au-dessus de l'as (vue juste avant lui).
      for (let i = 1; i < played; i++) if (ranks[i] === 1) { const kp = posOf[i - 1], ap = posOf[i]; total++; const d = ap - kp; if (d >= 1 && d <= 5) hits[d]++; }
    }
    // p : l'as suivi ; pAny : n'importe quel as à cette place (les autres as restent répartis au hasard, environ 1/13).
    const p = hits.slice(1).map((h) => h / total);
    return { p, pAny: p.map((x) => x + (1 - x) / 13), base: 1 / 13, total };
  }
  const Shuffle = { PROCS, riffle, strip, cut, zonePass, shuffleStack, shuffleMap, predict, dealAndShuffle, trackingStudy, aceSeqStudy, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = Shuffle; else root.BJShuffle = Shuffle;
})(typeof window !== 'undefined' ? window : globalThis);
