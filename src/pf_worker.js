// Cœur de calcul du solveur postflop, partagé : dans un Web Worker (fil séparé, l'interface reste fluide)
// ou sur le fil principal en repli (navigateur sans Worker). Messages : solve, node, ranges, free.
// La résolution avance par tranches de ~40 ms : entre deux tranches, les requêtes « node » d'une main déjà résolue passent.
(function (root) {
  const PF = root.Postflop || require('./postflop.js');
  const B = root.Board || require('./board.js');
  const CATS = ['Deux paires et mieux', 'Top paire, overpair', 'Paire moyenne ou faible', 'Tirage', 'Rien'];
  const catOf = (h, board) => { const k = B.classify(h, board); return k.made <= 7 ? 0 : k.made <= 9 ? 1 : k.made <= 11 ? 2 : k.draws.some((d) => d <= 1) ? 3 : 4; };
  // Résumé d'un flop pour le rapport agrégé (même calcul que tools/build_aggregate.js).
  function aggregate(g, actor) {
    const root0 = g.info([]), ck = root0.node.acts.findIndex((a) => a.k === 'x'), path1 = actor === 'ip' ? [ck] : [];
    const n1 = g.info(path1), labels = n1.node.acts.map((_, a) => g.label(n1.node, a)), p = n1.node.p, H = g.hands[p], n = H.length, sg = n1.strategy, reach = n1.reach[p];
    const byCat = CATS.map(() => ({ w: 0, bet: 0 }));
    for (let i = 0; i < n; i++) { const c = catOf([H[i][0], H[i][1]], g.board), w = reach[i]; byCat[c].w += w; let b = 0; for (let a = 0; a < labels.length; a++) if (n1.node.acts[a].k !== 'x') b += sg[a * n + i]; byCat[c].bet += w * b; }
    const tw = byCat.reduce((a, x) => a + x.w, 0), small = n1.node.acts.findIndex((a) => a.k !== 'x');
    let bb = null; if (small >= 0) { const n2 = g.info([...path1, small]); bb = { act: n2.node.acts.map((_, a) => g.label(n2.node, a)), f: n2.freq.map((x) => +x.toFixed(3)) }; }
    return { act: labels, f: n1.freq.map((x) => +x.toFixed(3)), eq: +n1.eqMean[p].toFixed(3), ev: +(n1.evMean[p] / g.P0).toFixed(3), cat: byCat.map((x) => [+(x.w / (tw || 1)).toFixed(3), x.w > 0 ? +(x.bet / x.w).toFixed(3) : null]), bb };
  }
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const T = ['act', 'chance', 'fold', 'show'];
  function core(post) {
    const games = new Map(), queue = [], dropped = new Set();
    let busy = false;
    function nodeInfo(g, path, combos) {
      const r = g.info(path), node = r.node, out = { t: T[node.t], p: node.p, pot: r.pot, C: r.C, board: r.board.slice(), street: r.board.length, evMean: Array.from(r.evMean) };
      if (node.t === PF.FOLD) out.winner = node.winner;
      if (node.t === PF.CHANCE) out.cards = node.cards.slice();
      if (node.t === PF.ACT) {
        const n = g.N[node.p], A = node.acts.length;
        out.acts = node.acts.map((a, i) => ({ k: a.k, to: a.to, add: a.to - node.bets[node.p], label: g.label(node, i) }));
        out.freq = r.freq;
        out.combo = {};
        for (const [p, i] of Object.entries(combos || {})) {
          if (i < 0 || +p !== node.p) continue;
          out.combo[p] = { strat: Array.from({ length: A }, (_, a) => r.strategy[a * n + i]), ev: r.actEv.map((v) => v[i]) };
        }
      }
      out.ev = {}; for (const [p, i] of Object.entries(combos || {})) if (i >= 0) out.ev[p] = r.ev[+p][i];
      return out;
    }
    // Ranges pondérées par la fréquence d'arrivée au nœud (pour re-résoudre exactement la rue suivante).
    function rangesAt(g, path) {
      const r = g.info(path);
      return [0, 1].map((p) => { const mx = Math.max(1e-12, ...r.reach[p]); return g.hands[p].map(([a, b], i) => [a, b, r.reach[p][i] / mx]).filter((x) => x[2] > 1e-4); });
    }
    function pump() {
      if (busy) return;
      let m; while ((m = queue.shift()) && dropped.has(m.id)) dropped.delete(m.id);
      if (!m) return;
      busy = true;
      let g; try { g = PF.create(m.cfg); } catch (e) { busy = false; post({ id: m.id, error: e.message }); return pump(); }
      const st = { m, g, t0: now(), it: 0, lastEx: 0, ex: null };
      step(st);
    }
    function step(st) {
      const { m, g } = st;
      if (dropped.has(m.id)) { dropped.delete(m.id); busy = false; return pump(); }
      try {
        const t = now(); do { g.iterate(1); st.it++; } while (now() - t < 40);
        const el = now() - st.t0;
        if (st.it - st.lastEx >= Math.max(10, Math.round(st.it * 0.12)) || el > m.maxMs) { st.ex = g.exploitability().pct; st.lastEx = st.it; post({ id: m.id, progress: st.ex, its: st.it, ms: el }); }
        if ((st.ex !== null && st.ex <= m.pct) || el > m.maxMs) {
          games.set(m.id, g); busy = false;
          post({ id: m.id, done: true, ex: st.ex, its: st.it, ms: now() - st.t0, hands: g.hands.map((l) => l.map(([a, b]) => [a, b])), approx: g.stats().approx });
          return pump();
        }
      } catch (e) { busy = false; post({ id: m.id, error: e.message }); return pump(); }
      setTimeout(() => step(st), 0);
    }
    return function handle(m) {
      try {
        if (m.cmd === 'ping') { post({ pong: true }); return; }
        if (m.cmd === 'solve') { queue.push(m); pump(); return; }
        if (m.cmd === 'free') { games.delete(m.id); dropped.add(m.id); return; }
        const g = games.get(m.id); if (!g) { post({ id: m.id, rid: m.rid, error: 'Calcul introuvable (libéré ou pas encore terminé)' }); return; }
        if (m.cmd === 'node') post({ id: m.id, rid: m.rid, node: nodeInfo(g, m.path, m.combos) });
        else if (m.cmd === 'ranges') post({ id: m.id, rid: m.rid, ranges: rangesAt(g, m.path) });
        else if (m.cmd === 'aggregate') post({ id: m.id, rid: m.rid, agg: aggregate(g, m.actor) });
      } catch (e) { post({ id: m.id, rid: m.rid, error: e.message }); }
    };
  }
  const api = { core };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PFCore = api;
  // Dans un Web Worker : brancher le cœur sur les messages.
  if (typeof WorkerGlobalScope !== 'undefined' && root instanceof WorkerGlobalScope) { const h = core((x) => root.postMessage(x)); root.onmessage = (e) => h(e.data); }
})(typeof window !== 'undefined' ? window : globalThis);
