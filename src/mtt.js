// Tournoi simulé de 100 joueurs (accéléré) : la table du héros est jouée main par main par le moteur de table ;
// les autres tables sont simulées par un modèle statistique (vols de blindes, tapis entre deux joueurs dont la fréquence
// augmente quand les tapis raccourcissent). Équilibrage : les places libres de la table du héros sont reprises par le reste du field.
(function (root) {
  const LEVELS = [[50, 100], [75, 150], [100, 200], [150, 300], [200, 400], [300, 600], [400, 800], [500, 1000], [700, 1400], [1000, 2000], [1500, 3000], [2000, 4000], [3000, 6000], [4000, 8000], [6000, 12000], [8000, 16000], [10000, 20000], [15000, 30000], [20000, 40000], [30000, 60000], [50000, 100000]];
  // 15 places payées sur 100 (en % de la dotation).
  const PAYOUTS = [25, 16, 11.5, 8.5, 6.8, 5.5, 4.2, 4.2, 4.2, 3.2, 3.2, 3.2, 1.5, 1.5, 1.5];
  const MIXES = { standard: ['reg', 'reg', 'station', 'nit', 'maniaque', 'reg', 'station', 'harrington'], fish: ['station', 'station', 'reg', 'moneymaker', 'maniaque', 'station', 'nit', 'reg'], regs: ['reg', 'reg', 'reg', 'nit', 'reg', 'maniaque', 'chidwick', 'station'] };
  function createField(o) {
    const P = { n: 100, stack: 10000, buyin: 10, mix: 'standard', ...o }, r = P.random || Math.random, mix = MIXES[P.mix] || MIXES.standard;
    const pool = [];
    for (let i = 1; i < P.n; i++) pool.push({ id: i, name: 'Joueur ' + i, profile: mix[Math.floor(r() * mix.length)], stack: P.stack });
    return { P, pool, busted: [], prize: P.n * P.buyin, r, hands: 0 };
  }
  const prizeOf = (F, place) => (place <= PAYOUTS.length ? (F.prize * PAYOUTS[place - 1]) / 100 : 0);
  // Une main sur chaque autre table (groupes de 6 joueurs) : vol de blindes, et parfois un tapis entre deux joueurs.
  function stepField(F, bb, aliveTotal) {
    const r = F.r, pl = F.pool.filter((p) => p.stack > 0 && !p.seated);
    for (let k = pl.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [pl[k], pl[j]] = [pl[j], pl[k]]; }
    const out = [];
    for (let g = 0; g < pl.length; g += 6) {
      const t = pl.slice(g, g + 6); if (t.length < 2) continue;
      const [sbp, bbp] = [t[0], t[1]], w = t[Math.floor(r() * t.length)];
      const a = Math.min(sbp.stack, bb / 2), b = Math.min(bbp.stack, bb); sbp.stack -= a; bbp.stack -= b; w.stack += a + b;
      const avgBB = t.reduce((s, p) => s + p.stack, 0) / t.length / bb, q = Math.min(0.35, 1.1 / Math.max(3, avgBB));
      if (r() < q) {
        const x = t[Math.floor(r() * t.length)]; let y = t[Math.floor(r() * t.length)]; if (y === x) y = t[(t.indexOf(x) + 1) % t.length];
        if (x.stack > 0 && y.stack > 0) { const amt = Math.min(x.stack, y.stack), [win, lose] = r() < 0.5 ? [x, y] : [y, x]; win.stack += amt; lose.stack -= amt; if (lose.stack <= 1e-9) out.push(lose); }
      }
    }
    // Éliminés de la main : le plus petit tapis de départ sort en premier (place la plus basse).
    let alive = aliveTotal;
    for (const p of out) { p.stack = 0; F.busted.push({ id: p.id, name: p.name, place: alive }); alive--; }
    F.hands++;
    return out.length;
  }
  // Joueurs à faire asseoir à la table du héros : on prend au hasard dans le reste du field.
  function draw(F) { const pl = F.pool.filter((p) => p.stack > 0 && !p.seated); if (!pl.length) return null; const p = pl[Math.floor(F.r() * pl.length)]; p.seated = true; return p; }
  const alivePool = (F) => F.pool.filter((p) => p.stack > 0 && !p.seated).length;
  // Partie complète : table du héros (moteur de table) + reste du field (modèle). opts : mix, hpl (mains par niveau), random.
  function createGame(TS, o = {}) {
    const F = createField(o), r = F.r;
    const tb = new TS.Table({ lineup: ['reg', 'reg', 'reg', 'reg', 'reg'], stack: F.P.stack, rebuy: false, levels: LEVELS, handsPerLevel: o.hpl || 8, random: o.random });
    const seat = []; // seat[i] = joueur du field assis au siège i (i >= 1)
    const sit = (i) => { const p = draw(F); if (!p) return false; const t = tb.players[i]; Object.assign(t, { name: p.name, profile: p.profile, stack: p.stack, out: false, cards: [], inHand: false, acts: [] }); seat[i] = p; return true; };
    for (let i = 1; i < tb.n; i++) sit(i);
    const aliveTotal = () => alivePool(F) + tb.players.filter((p) => !p.out && p.stack > 0).length;
    const G = { F, tb, over: false, place: null, prize: 0, hands: 0,
      prepare() {
        // Sièges libérés à la table du héros : un joueur du field vient s'asseoir.
        for (let i = 1; i < tb.n; i++) if (tb.players[i].out) { if (seat[i]) seat[i] = null; sit(i); }
        tb.over = false;
      },
      after() {
        G.hands++;
        // Éliminés à la table du héros (le moteur les a marqués « out »).
        const outNow = []; for (let i = 1; i < tb.n; i++) { const p = seat[i]; if (p && tb.players[i].out && p.stack > 0) { p.stack = 0; outNow.push(p); } else if (p) p.stack = tb.players[i].stack; }
        let alive = aliveTotal() + outNow.length + (tb.players[0].out ? 1 : 0);
        for (const p of outNow) { F.busted.push({ id: p.id, name: p.name, place: alive }); alive--; }
        if (tb.players[0].out) { G.over = true; G.place = alive; G.prize = prizeOf(F, G.place); return; }
        stepField(F, tb.bb, aliveTotal());
        if (aliveTotal() <= 1) { G.over = true; G.place = 1; G.prize = prizeOf(F, 1); }
      },
      status() {
        const all = F.pool.filter((p) => p.stack > 0).map((p) => p.stack), heroS = tb.players[0].stack; all.push(heroS);
        const n = all.length, tot = all.reduce((a, b) => a + b, 0), rank = all.filter((x) => x > heroS).length + 1;
        return { left: n, avg: tot / n, rank, heroS, paid: PAYOUTS.length, bubble: n > PAYOUTS.length && n <= PAYOUTS.length + 5, itm: n <= PAYOUTS.length, finalTable: n <= 6, level: Math.min(LEVELS.length, Math.floor((tb.handNo - 1) / tb.handsPerLevel) + 1), max: Math.max(...all) };
      },
    };
    return G;
  }
  const api = { LEVELS, PAYOUTS, MIXES, createField, stepField, prizeOf, draw, alivePool, createGame };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MTT = api;
})(typeof window !== 'undefined' ? window : globalThis);
