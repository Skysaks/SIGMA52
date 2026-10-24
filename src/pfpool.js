// Pool de calcul du solveur : Web Workers (fils séparés) quand le navigateur les autorise, sinon calcul sur le fil principal par tranches.
// solve(cfg, opts) -> tâche { ready, node(path, combos), ranges(path), free() }. L'état d'une résolution reste dans le worker qui l'a calculée.
(function (root) {
  let workers = null, local = null, nextId = 1, nextRid = 1, mode = 'init';
  const jobs = new Map(), reqs = new Map();
  function recv(m, w) {
    if (m.pong) { if (w) w.ok = true; return; }
    if (m.rid) { const r = reqs.get(m.rid); if (!r) return; reqs.delete(m.rid); if (m.error) r.reject(new Error(m.error)); else r.resolve(m.node || m.ranges || m.agg); return; }
    const j = jobs.get(m.id); if (!j) return;
    if (m.error) { j.state = 'error'; j._rej(new Error(m.error)); return; }
    if (m.progress !== undefined) { j.ex = m.progress; j.its = m.its; j.ms = m.ms; j.onProgress?.(j); return; }
    if (m.done) { Object.assign(j, { state: 'done', ex: m.ex, its: m.its, ms: m.ms, hands: m.hands, approx: m.approx }); j._res(j); }
  }
  function localCore() { if (!local) local = root.PFCore.core((m) => setTimeout(() => recv(m, null), 0)); return local; }
  function fallback(w) {
    // Worker refusé (politique de sécurité de la page) : ses tâches repartent sur le fil principal.
    if (workers) workers = workers.filter((x) => x !== w);
    try { w.terminate(); } catch (e) { /* déjà arrêté */ }
    if (!workers || !workers.length) mode = 'local';
    for (const j of jobs.values()) if (j.w === w) { j.w = null; if (j.state === 'run') send(j, { cmd: 'solve', id: j.id, cfg: j.cfg, pct: j.pct, maxMs: j.maxMs }); }
  }
  function init() {
    if (workers) return;
    workers = [];
    const el = typeof document !== 'undefined' && document.getElementById('pfsrc');
    const n = Math.max(1, Math.min(3, ((typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2) - 1));
    if (el && typeof Worker !== 'undefined' && typeof Blob !== 'undefined') {
      let url = null; try { url = URL.createObjectURL(new Blob([el.textContent], { type: 'text/javascript' })); } catch (e) { url = null; }
      for (let i = 0; url && i < n; i++) {
        try {
          const w = new Worker(url); w.ok = false; w.load = 0;
          w.onmessage = (e) => recv(e.data, w); w.onerror = () => { if (!w.ok) fallback(w); };
          w.postMessage({ cmd: 'ping' }); setTimeout(() => { if (!w.ok) fallback(w); }, 2500);
          workers.push(w);
        } catch (e) { break; }
      }
    }
    mode = workers.length ? 'worker' : 'local';
  }
  function pick() { if (!workers.length) return null; return workers.reduce((a, b) => (b.load < a.load ? b : a)); }
  function send(j, m) {
    if (!j.w && mode === 'worker') { j.w = pick(); if (j.w) j.w.load++; }
    if (j.w) j.w.postMessage(m); else localCore()(m);
  }
  function req(j, m) { return new Promise((resolve, reject) => { const rid = nextRid++; reqs.set(rid, { resolve, reject }); send(j, { ...m, id: j.id, rid }); }); }
  function solve(cfg, opts = {}) {
    init();
    const j = { id: nextId++, cfg, pct: opts.pct ?? 1, maxMs: opts.maxMs ?? 25000, state: 'run', onProgress: opts.onProgress, w: null };
    j.ready = new Promise((res, rej) => { j._res = res; j._rej = rej; });
    j.ready.catch(() => {});
    j.node = (path, combos) => req(j, { cmd: 'node', path, combos });
    j.ranges = (path) => req(j, { cmd: 'ranges', path });
    j.aggregate = (actor) => req(j, { cmd: 'aggregate', actor });
    j.free = () => { if (j.state === 'freed') return; send(j, { cmd: 'free', id: j.id }); if (j.w) j.w.load = Math.max(0, j.w.load - 1); j.state = 'freed'; jobs.delete(j.id); };
    jobs.set(j.id, j); send(j, { cmd: 'solve', id: j.id, cfg, pct: j.pct, maxMs: j.maxMs });
    return j;
  }
  const api = { solve, mode: () => (init(), mode), workers: () => (workers ? workers.length : 0) };
  root.PFPool = api;
})(typeof window !== 'undefined' ? window : globalThis);
