// Systèmes de comptage de SIGMA 52 : valeurs de chaque carte, propriétés, et mathématiques de comparaison.
// Index des rangs : 1 = as, 2..9, 10 = toutes les cartes de valeur 10. Red Seven : le 7 rouge vaut +1, le 7 noir 0
// (dans les calculs par composition, le 7 compte pour sa moyenne +0,5).
// Les corrélations (BC, IC) et l'efficacité de jeu sont calculées par SIGMA 52 à partir des effets de retrait de son moteur ;
// elles peuvent différer de quelques centièmes des valeurs publiées par d'autres sources.
(function (root) {
  'use strict';
  //            idx: 0  A   2   3   4   5    6   7    8   9   10
  const SYSTEMS = [
    { id: 'hilo', name: 'Hi-Lo', t: [0, -1, 1, 1, 1, 1, 1, 0, 0, 0, -1], who: 'Harvey Dubner (1963), popularisé par Stanford Wong', note: 'Le standard : équilibré, niveau 1, le plus documenté (indices, simulations, livres).' },
    { id: 'ko', name: 'KO (Knock-Out)', t: [0, -1, 1, 1, 1, 1, 1, 1, 0, 0, -1], who: 'Olaf Vancura et Ken Fuchs (1998)', note: 'Hi-Lo avec le 7 à +1 : déséquilibré (+4 par paquet). Se joue au running count, sans conversion en true count : départ à 4 − 4 × paquets.' },
    { id: 'red7', name: 'Red Seven', t: [0, -1, 1, 1, 1, 1, 1, 0.5, 0, 0, -1], red7: true, who: 'Arnold Snyder (1983)', note: 'Hi-Lo avec les 7 rouges à +1 : déséquilibré (+2 par paquet). Départ à −2 × paquets ; se joue au running count.' },
    { id: 'hiopt1', name: 'Hi-Opt I', t: [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, -1], ace: true, who: 'Lance Humble et Carl Cooper', note: 'Ni le 2 ni l\'as ne comptent : meilleur pour jouer, moins bon pour miser. Se complète d\'un compte des as à part pour les mises.' },
    { id: 'hiopt2', name: 'Hi-Opt II', t: [0, 0, 1, 1, 2, 2, 1, 1, 0, 0, -2], ace: true, who: 'Lance Humble et Carl Cooper', note: 'Niveau 2, as neutre, compte des as à part. Très bon pour jouer, plus lent à tenir.' },
    { id: 'omega2', name: 'Omega II', t: [0, 0, 1, 1, 2, 2, 2, 1, 0, -1, -2], ace: true, who: 'Bryce Carlson', note: 'Niveau 2, as neutre (compte des as conseillé), le 9 à −1.' },
    { id: 'zen', name: 'Zen Count', t: [0, -1, 1, 1, 2, 2, 2, 1, 0, 0, -2], who: 'Arnold Snyder', note: 'Niveau 2 avec l\'as à −1 : bon compromis mise et jeu sans compte à part.' },
    { id: 'halves', name: 'Wong Halves', t: [0, -1, 0.5, 1, 1, 1.5, 1, 0.5, 0, -0.5, -1], who: 'Stanford Wong', note: 'Valeurs en demi-points (niveau 3 une fois doublées) : la meilleure corrélation de mise des comptes courants, la plus exigeante.' },
    { id: 'silverfox', name: 'Silver Fox', t: [0, -1, 1, 1, 1, 1, 1, 1, 0, -1, -1], who: '', note: 'Niveau 1, équilibré : le 7 à +1 compensé par le 9 à −1.' },
    { id: 'uplus', name: 'Uston +/−', t: [0, -1, 0, 1, 1, 1, 1, 1, 0, 0, -1], who: 'Ken Uston', note: 'Niveau 1, équilibré : le 2 ne compte pas, le 7 compte.' },
    { id: 'uapc', name: 'Uston APC', t: [0, 0, 1, 2, 2, 3, 2, 2, 1, -1, -3], ace: true, who: 'Ken Uston', note: 'Advanced Point Count, niveau 3, as neutre avec compte des as à part.' },
    { id: 'uss', name: 'Uston SS', t: [0, -2, 2, 2, 2, 3, 2, 1, 0, -1, -2], who: 'Ken Uston', note: 'Niveau 3, déséquilibré (+4 par paquet) : se joue au running count.' },
    { id: 'acefive', name: 'Ace-Five', t: [0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0], who: '', note: 'Le plus simple : +1 par 5, −1 par as. Ne sert qu\'à miser, et mal ; utile pour comprendre.' },
    { id: 'tencount', name: 'Ten Count', t: [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, -9], who: 'Edward Thorp (1962), écrit en points', note: 'Le compte historique de « Beat the Dealer » : rapport cartes non-10 / 10, ici en points (+4 / −9). Parfait pour l\'assurance, faible pour le reste.' },
  ];
  const W = [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 16]; // cartes par paquet
  const byId = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));
  const imbalance = (t) => { let s = 0; for (let r = 1; r <= 10; r++) s += W[r] * t[r]; return Math.round(s * 1000) / 1000; };
  const level = (t) => { let m = 0; for (let r = 1; r <= 10; r++) m = Math.max(m, Math.abs(t[r])); return t.some((x) => x % 1) ? m * 2 : m; };
  for (const s of SYSTEMS) { s.imb = imbalance(s.t); s.balanced = Math.abs(s.imb) < 1e-9; s.level = level(s.t); }
  // Valeur d'une carte réelle (0..51, rang c >> 2 : 0 = 2 … 12 = As ; couleur c & 3 : 1 = cœur, 2 = carreau).
  function tagOfCard(sys, c) {
    const r = c >> 2, v = r <= 7 ? r + 2 : r <= 11 ? 10 : 1;
    if (sys.red7 && v === 7) return ((c & 3) === 1 || (c & 3) === 2) ? 1 : 0;
    return sys.t[v];
  }
  // Running count de départ des comptes déséquilibrés (convention des auteurs) : KO 4 − 4D, Red Seven −2D, Uston SS −4D.
  const irc = (sys, decks) => (sys.balanced ? 0 : sys.id === 'ko' ? 4 - 4 * decks : -sys.imb * decks);

  // Corrélation pondérée par le nombre de cartes de chaque rang.
  function corr(a, b) {
    let sw = 0, ma = 0, mb = 0; for (let r = 1; r <= 10; r++) { sw += W[r]; ma += W[r] * a[r]; mb += W[r] * b[r]; }
    ma /= sw; mb /= sw;
    let c = 0, va = 0, vb = 0; for (let r = 1; r <= 10; r++) { const x = a[r] - ma, y = b[r] - mb; c += W[r] * x * y; va += W[r] * x * x; vb += W[r] * y * y; }
    return va && vb ? c / Math.sqrt(va * vb) : 0;
  }
  // Betting Correlation : corrélation entre les valeurs du compte et les effets de retrait sur l'avantage.
  const bc = (t, eor) => corr(t, eor);
  // Insurance Correlation : corrélation avec l'effet sur l'assurance (seule compte la proportion de 10).
  const INS = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
  const ic = (t) => corr(t, INS);
  // Efficacité de jeu (définition SIGMA 52) : moyenne des |corrélations| avec les effets de retrait de chaque décision d'indice.
  const pe = (t, decEors) => (decEors.length ? decEors.reduce((a, d) => a + Math.abs(corr(t, d.eor)), 0) / decEors.length : 0);
  // BC avec un compte des as tenu à part : valeur de l'as choisie pour maximiser la corrélation de mise.
  function bcAce(t, eor) { let best = { v: t[1], bc: bc(t, eor) }; for (let v = -4; v <= 4; v += 0.05) { const u = t.slice(); u[1] = v; const x = bc(u, eor); if (x > best.bc) best = { v: Math.round(v * 100) / 100, bc: x }; } return best; }
  // Avantage estimé par la méthode linéaire : avantage de départ + Σ effet de retrait × déficit de chaque rang (ramené à 52 cartes).
  function linearEdge(edge0, eor, shoe, base) {
    let R = 0, B = 0; for (let r = 1; r <= 10; r++) { R += shoe[r]; B += base[r]; }
    let d = 0; for (let r = 1; r <= 10; r++) d += eor[r] * (base[r] * R / B - shoe[r]);
    return edge0 + d * 52 / R;
  }

  const Counts = { SYSTEMS, byId, W, imbalance, level, tagOfCard, irc, corr, bc, ic, pe, bcAce, INS, linearEdge };
  if (typeof module !== 'undefined' && module.exports) module.exports = Counts; else root.BJCounts = Counts;
})(typeof window !== 'undefined' ? window : globalThis);
