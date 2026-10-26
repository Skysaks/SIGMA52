// FSRS-5 (Free Spaced Repetition Scheduler, modèle à trois composantes : récupérabilité, stabilité, difficulté),
// paramètres par défaut publiés par le projet open-spaced-repetition. Notes : 1 = raté, 2 = difficile, 3 = bien, 4 = facile.
(function (root) {
  const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
  const DECAY = -0.5, FACTOR = 19 / 81, DAY = 864e5;
  const clampD = (d) => Math.min(10, Math.max(1, d));
  // Probabilité de se souvenir après t jours pour une stabilité S (en jours).
  const retrievability = (t, s) => Math.pow(1 + (FACTOR * t) / s, DECAY);
  // Intervalle (jours) pour lequel la probabilité de rappel retombe à r.
  const interval = (s, r) => (s / FACTOR) * (Math.pow(r, 1 / DECAY) - 1);
  const initS = (g) => W[g - 1];
  const initD = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
  function nextD(d, g) { const d1 = d + (-W[6] * (g - 3) * (10 - d)) / 9; return clampD(W[7] * initD(4) + (1 - W[7]) * d1); }
  function recallS(s, d, r, g) { return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1)); }
  function forgetS(s, d, r) { return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14])); }
  // Carte : { s, d, last (horodatage ms), reps, lapses }.
  function init(g, now = Date.now()) { return { s: initS(g), d: initD(g), last: now, reps: 1, lapses: g === 1 ? 1 : 0 }; }
  // Reprise d'un ancien élément à intervalle fixe : stabilité ≈ intervalle, difficulté moyenne.
  function fromInterval(iv, now = Date.now()) { return { s: Math.max(0.5, iv), d: 5, last: now - iv * DAY, reps: 1, lapses: 0 }; }
  function review(c, g, now = Date.now()) {
    const t = Math.max(0, (now - c.last) / DAY), r = retrievability(t, c.s);
    let s;
    if (t < 1) s = c.s * Math.exp(W[17] * (g - 3 + W[18])); // révision dans la même journée
    else s = g === 1 ? forgetS(c.s, c.d, r) : recallS(c.s, c.d, r, g);
    return { s: Math.max(0.1, s), d: nextD(c.d, g), last: now, reps: c.reps + 1, lapses: c.lapses + (g === 1 ? 1 : 0) };
  }
  // Date d'échéance (ms) pour une rétention cible ; au moins un jour plus tard.
  const dueAt = (c, ret = 0.9) => c.last + Math.max(1, Math.round(interval(c.s, ret))) * DAY;
  const recallNow = (c, now = Date.now()) => retrievability(Math.max(0, (now - c.last) / DAY), c.s);
  const api = { W, init, fromInterval, review, dueAt, interval, retrievability, recallNow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FSRS = api;
})(typeof window !== 'undefined' ? window : globalThis);
