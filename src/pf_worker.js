// Cœur de calcul du solveur postflop, partagé : dans un Web Worker (fil séparé, l'interface reste fluide)
// ou sur le fil principal en repli (navigateur sans Worker). Messages : solve, node, ranges, free.
// La résolution avance par tranches de ~40 ms : entre deux tranches, les requêtes « node » d'une main déjà résolue passent.
(function (root) {
  const PF = root.Postflop || require('./postflop.js');
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const T = ['act', 'chance', 'fold', 'show'];
  function core(post) {
    const games = new Map(), queue = [], dropped = new Set();
    let busy = false;
    function nodeInfo(g, path, combos) {
      const r = g.info(path), node = r.node, out = { t: T[node.t], p: node.p, pot: r.pot, C: r.C, board: node.board.slice(), street: node.board.length };
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
      } catch (e) { post({ id: m.id, rid: m.rid, error: e.message }); }
    };
  }
  const api = { core };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PFCore = api;
  // Dans un Web Worker : brancher le cœur sur les messages.
  if (typeof WorkerGlobalScope !== 'undefined' && root instanceof WorkerGlobalScope) { const h = core((x) => root.postMessage(x)); root.onmessage = (e) => h(e.data); }
})(typeof window !== 'undefined' ? window : globalThis);
