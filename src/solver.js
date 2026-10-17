// Solveur : équilibre de Nash tapis/couché en tête-à-tête (SB contre BB), en jetons (chipEV) ou en argent (ICM).
// Repose sur la matrice d'équité préflop 169 x 169 et sur le nombre de combinaisons compatibles entre classes (effet de blocage).
(function (root) {
  const E = root.Engine || require('./engine.js');
  const M = root.Matrix || require('./matrix.js');
  const N = 169;
  let EQ = null, CNT = null, W = null;

  function init() {
    if (EQ) return;
    const bin = typeof atob === 'function' ? Uint8Array.from(atob(M.B64), (c) => c.charCodeAt(0)) : new Uint8Array(Buffer.from(M.B64, 'base64'));
    const u16 = new Uint16Array(bin.buffer, bin.byteOffset, N * N);
    EQ = new Float64Array(N * N); for (let k = 0; k < N * N; k++) EQ[k] = u16[k] / 65535;
    const combos = E.ALL169.map((h) => E.combos(h));
    W = combos.map((c) => c.length);
    CNT = new Float64Array(N * N); // combinaisons concrètes compatibles (paires de mains disjointes)
    for (let i = 0; i < N; i++) for (let j = i; j < N; j++) {
      let n = 0;
      for (const a of combos[i]) for (const b of combos[j]) if (a[0] !== b[0] && a[0] !== b[1] && a[1] !== b[0] && a[1] !== b[1]) n++;
      CNT[i * N + j] = CNT[j * N + i] = n;
    }
  }
  const eq = (i, j) => (init(), EQ[i * N + j]);
  const idx = (h) => E.ALL169.indexOf(h);

  // Équité d'une main contre une range pondérée (vecteur de 169 fréquences), avec effet de blocage.
  function eqVsRange(i, freq) {
    init(); let num = 0, den = 0;
    for (let j = 0; j < N; j++) { const w = CNT[i * N + j] * freq[j]; num += w * EQ[i * N + j]; den += w; }
    return den ? num / den : 0.5;
  }
  // Équité préflop range contre range (fréquences par classe).
  function rangeVsRange(fa, fb) {
    init(); let num = 0, den = 0;
    for (let i = 0; i < N; i++) if (fa[i]) for (let j = 0; j < N; j++) if (fb[j]) { const w = CNT[i * N + j] * fa[i] * fb[j]; num += w * EQ[i * N + j]; den += w; }
    return den ? num / den : 0.5;
  }
  const setToFreq = (set) => E.ALL169.map((h) => (set.has(h) ? 1 : 0));

  // ICM Malmuth-Harville : valeur en argent de chaque tapis. stacks[], payouts[] (1er, 2e, ...).
  function icm(stacks, payouts) {
    const n = stacks.length, val = new Array(n).fill(0), full = (1 << n) - 1;
    const prob = new Map([[0, 1]]); // ensemble des joueurs déjà classés (places 1..k) -> probabilité
    const order = [...Array(full + 1).keys()].sort((a, b) => popcount(a) - popcount(b));
    for (const mask of order) {
      const p = prob.get(mask); if (!p) continue;
      const k = popcount(mask); if (k >= payouts.length || k >= n) continue;
      let rest = 0; for (let i = 0; i < n; i++) if (!(mask & (1 << i)) && stacks[i] > 0) rest += stacks[i];
      if (!rest) continue;
      for (let i = 0; i < n; i++) if (!(mask & (1 << i)) && stacks[i] > 0) {
        const q = p * stacks[i] / rest; val[i] += q * payouts[k];
        const m2 = mask | (1 << i); prob.set(m2, (prob.get(m2) || 0) + q);
      }
    }
    return val;
  }
  function popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

  // Jeu tapis/couché SB contre BB. Les valeurs d'issue (fold, vol, gain, perte) sont fournies pour chaque joueur,
  // ce qui couvre le cas en jetons comme le cas ICM. Renvoie fréquences de tapis (SB) et de call (BB) par classe.
  function solveOutcomes(V, iters = 400) {
    init();
    const push = new Float64Array(N).fill(1), call = new Float64Array(N).fill(0.5);
    const avgP = new Float64Array(N), avgC = new Float64Array(N);
    const evP = new Float64Array(N), evC = new Float64Array(N);
    for (let t = 1; t <= iters; t++) {
      // Meilleure réponse de la SB à la stratégie moyenne actuelle de la BB.
      const cs = t === 1 ? call : avgC;
      for (let i = 0; i < N; i++) {
        let den = 0, ev = 0;
        for (let j = 0; j < N; j++) {
          const w = CNT[i * N + j]; if (!w) continue; den += w;
          const c = cs[j], e = EQ[i * N + j];
          ev += w * ((1 - c) * V.sb.steal + c * (e * V.sb.win + (1 - e) * V.sb.lose));
        }
        evP[i] = ev / den - V.sb.fold; push[i] = evP[i] > 0 ? 1 : 0;
      }
      for (let i = 0; i < N; i++) avgP[i] += (push[i] - avgP[i]) / t;
      // Meilleure réponse de la BB à la stratégie moyenne de la SB.
      for (let j = 0; j < N; j++) {
        let den = 0, e = 0;
        for (let i = 0; i < N; i++) { const w = CNT[j * N + i] * avgP[i]; if (!w) continue; den += w; e += w * EQ[j * N + i]; }
        if (!den) { evC[j] = -1; call[j] = 0; continue; }
        e /= den; evC[j] = e * V.bb.win + (1 - e) * V.bb.lose - V.bb.fold; call[j] = evC[j] > 0 ? 1 : 0;
      }
      for (let j = 0; j < N; j++) avgC[j] += (call[j] - avgC[j]) / t;
    }
    // EV finales contre les stratégies moyennes (pour noter les erreurs en perte d'EV).
    for (let i = 0; i < N; i++) {
      let den = 0, ev = 0;
      for (let j = 0; j < N; j++) { const w = CNT[i * N + j]; if (!w) continue; den += w; const c = avgC[j], e = EQ[i * N + j]; ev += w * ((1 - c) * V.sb.steal + c * (e * V.sb.win + (1 - e) * V.sb.lose)); }
      evP[i] = ev / den - V.sb.fold;
    }
    for (let j = 0; j < N; j++) {
      let den = 0, e = 0;
      for (let i = 0; i < N; i++) { const w = CNT[j * N + i] * avgP[i]; if (!w) continue; den += w; e += w * EQ[j * N + i]; }
      evC[j] = den ? (e / den) * V.bb.win + (1 - e / den) * V.bb.lose - V.bb.fold : -1;
    }
    // Nettoyage : les fréquences sous 2 % ou au-dessus de 98 % viennent des premières itérations, pas de l'équilibre.
    const clean = (f) => Array.from(f, (x) => (x < 0.02 ? 0 : x > 0.98 ? 1 : x));
    const pct = (f) => f.reduce((a, x, i) => a + x * W[i], 0) / 1326;
    const P = clean(avgP), Cc = clean(avgC);
    return { push: P, call: Cc, evPush: Array.from(evP), evCall: Array.from(evC), pushPct: pct(P), callPct: pct(Cc) };
  }

  // Cas en jetons : tapis effectif S (en bb), ante par joueur a (en bb). Valeurs = tapis final de chacun, en bb.
  function chipOutcomes(S, a = 0) {
    return {
      sb: { fold: S - 0.5 - a, steal: S + 1 + a, win: 2 * S, lose: 0 },
      bb: { fold: S - 1 - a, win: 2 * S, lose: 0 },
    };
  }
  function solveChip(S, a = 0) { return solveOutcomes(chipOutcomes(S, a)); }

  // Cas ICM : stacks de tous les joueurs (en bb, blindes non postées), indices de la SB et de la BB, payouts.
  // Les autres joueurs se sont couchés ; leurs antes restent au pot.
  function icmOutcomes(stacks, sb, bb, payouts, ante = 0) {
    const n = stacks.length, base = stacks.map((s) => s - ante), dead = ante * n;
    const after = (f) => { const s = base.slice(); f(s); return icm(s, payouts); };
    const E2 = Math.min(stacks[sb], stacks[bb]) - ante; // part de chaque tapis engagée en cas de call
    const vFold = after((s) => { s[sb] -= 0.5; s[bb] += 0.5 + dead; });
    const vSteal = after((s) => { s[bb] -= 1; s[sb] += 1 + dead; });
    const vWin = after((s) => { s[sb] += E2 + dead; s[bb] -= E2; });
    const vLose = after((s) => { s[sb] -= E2; s[bb] += E2 + dead; });
    return {
      V: { sb: { fold: vFold[sb], steal: vSteal[sb], win: vWin[sb], lose: vLose[sb] }, bb: { fold: vSteal[bb], win: vLose[bb], lose: vWin[bb] } },
      chips: { fold: vFold, steal: vSteal, win: vWin, lose: vLose },
    };
  }

  const api = { init, eq, idx, eqVsRange, rangeVsRange, setToFreq, icm, solveOutcomes, chipOutcomes, solveChip, icmOutcomes, get W() { init(); return W; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Solver = api;
})(typeof window !== 'undefined' ? window : globalThis);
