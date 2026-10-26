// Solveur › PLO (deux joueurs, mains de 4 cartes) et Solveur › À trois joueurs (Hold'em multiway simplifié).
// Les deux solves tournent sur le fil principal par tranches (l'interface reste utilisable) et partagent le même explorateur d'arbre.
(function () {
  const X = window.__S52, E = window.Engine, B = window.Board, PS = window.PLOSolver, S3 = window.Solver3;
  const { $, esc, fr, pct, state, render, cardHTML, cardsHTML, grid169, ACT, ONCHANGE } = X;
  const prog = () => state.progress.multi || (state.progress.multi = { plo: { n: 0, ok: 0 }, three: { n: 0, ok: 0 } });

  // ---------------- Réglages ----------------
  // Ranges PLO par défaut : fréquences du solveur préflop PLO (tools/build_plo_preflop.js, 120 paquets de mains), action par action.
  const PPD = () => window.PLOPreflopData || null;
  const PLO_SRC = { srp: [['vo:BTN:BB', 'c'], ['rfi:BTN', 'r']], '3bp': [['vo:BTN:BB', 'r'], ['v3:BTN:BB', 'c']] };
  function ploFreq(pre, p) {
    const D = PPD(); if (!D) return null; const c = D.configs.find((x) => x.id === 'plo100'), [key, k] = PLO_SRC[pre][p], n = c?.nodes.find((x) => x.key === key); if (!n) return null;
    const a = n.acts.findIndex((x) => x.k === k); if (a < 0) return null;
    const f = Float64Array.from(n.f[a], (ch) => D.alph.indexOf(ch) / 63), W = D.info.map((x) => x.w), T = W.reduce((x, y) => x + y, 0);
    return { f, pct: f.reduce((s, x, i) => s + x * W[i], 0) / T, accept: (h) => { const t = window.Live?.ploTable(h); return t ? f[D.map.charCodeAt(t.idx) - 161] : 0; } };
  }
  const PLO_PRE = {
    srp: { label: 'Pot relancé · BTN contre BB', names: ['BB', 'BTN'], pot: 7.5, stack: 96.5, lo: [0.08, 0], hi: [0.6, 0.45], note: 'BTN relance le pot (3,5 bb), BB paie. BTN : 45 % meilleures mains ; BB : 8 à 60 % (le top 8 % sur-relance).' },
    '3bp': { label: 'Pot 3-bet · BB contre BTN', names: ['BB', 'BTN'], pot: 22.5, stack: 89, lo: [0, 0.03], hi: [0.12, 0.35], note: 'BB sur-relance le pot (11 bb), BTN paie. BB : 12 % meilleures mains ; BTN : 3 à 35 % (le top 3 %, AAxx, 4-bet).' },
  };
  const THREE_PRE = {
    co: { label: 'CO ouvre, BTN et BB paient', names: ['BB', 'CO', 'BTN'], pot: 8, stack: 97.5, r: ['22-TT, A2s-AJs, K6s-KJs, Q8s-QJs, J8s+, T8s+, 97s+, 86s+, 75s+, 64s+, 54s, A9o-AJo, KTo-KQo, QTo+, JTo', '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A9o+, KTo+, QTo+, JTo', '22-JJ, A9s-AQs, KTs-KQs, QTs+, JTs, T9s, 98s, 87s, 76s, 65s, AQo, KQo'] },
    utg: { label: 'UTG ouvre, BTN et BB paient', names: ['BB', 'UTG', 'BTN'], pot: 8, stack: 97.5, r: ['22-JJ, A2s-AQs, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, ATo-AQo, KJo+, QJo', '22+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, AJo+, KQo', '22-QQ, ATs-AQs, KTs+, QTs+, JTs, T9s, 98s, 87s, AQo'] },
  };
  const pl = { board: 'Kh8s4c2d', pre: 'srp', q: 'std', src: 'solver', sizes: 'simple', hero: '', lo: PLO_PRE.srp.lo.slice(), hi: PLO_PRE.srp.hi.slice() };
  const th = { board: 'Ks7d2c5h', pre: 'co', sizes: 'simple', river: 'fast', hero: '', r: THREE_PRE.co.r.slice() };
  const run = { plo: null, three: null }; // résolution en cours ou terminée, par outil

  // Mains par range selon la rue : la river est rapide (800 par défaut), le turn calcule toutes les rivers, le flop échantillonne turns et rivers.
  const PLO_Q = ['fast', 'std', 'fine'], PLO_N = { 3: [100, 150, 200], 4: [150, 300, 450], 5: [400, 800, 1200] };
  const ploRanges = (board, n, salt, hero) => [0, 1].map((p) => { const fq = pl.src === 'solver' ? ploFreq(pl.pre, p) : null; return fq ? PS.sampleRange(rankPLO, 0, 1, n, board, 11 + p * 7 + salt, hero.length ? [hero] : [], { board, accept: fq.accept }) : PS.sampleRange(rankPLO, +pl.lo[p], +pl.hi[p], n, board, 11 + p * 7 + salt, hero.length ? [hero] : [], { board }); });
  const rankPLO = (h) => { const t = window.Live?.ploTable(h); return t ? t.pct : null; };
  function ploCfg() {
    const board = E.parseCards(pl.board);
    if (board.length < 3 || board.length > 5 || new Set(board).size !== board.length) throw new Error('Le board fait 3, 4 ou 5 cartes différentes.');
    const P = PLO_PRE[pl.pre], hero = E.parseCards(pl.hero || '');
    if (hero.length && (hero.length !== 4 || new Set(hero).size !== 4 || hero.some((c) => board.includes(c)))) throw new Error('Ta main PLO : 4 cartes différentes, absentes du board (ex. AsAhJdTd).');
    const flop = board.length === 3, n = PLO_N[board.length][PLO_Q.indexOf(pl.q)];
    const ranges = ploRanges(board, n, 0, hero);
    const rich = pl.sizes === 'riche';
    const sizes = flop
      ? { flop: [{ bet: rich ? [33, 66] : [50], raise: [] }, { bet: rich ? [33, 66, 100] : [50, 100], raise: [100] }], turn: [{ bet: [66], raise: [] }, { bet: [66], raise: [] }], river: [{ bet: [66], raise: [] }, { bet: [66], raise: [] }] }
      : { flop: PS.DEFAULT_SIZES.flop, turn: [{ bet: rich ? [50, 100] : [66], raise: [] }, { bet: rich ? [50, 100] : [66], raise: [100] }], river: [{ bet: rich ? [50, 100] : [66], raise: [] }, { bet: rich ? [33, 66, 100] : [66], raise: [100] }] };
    return { board, pot: P.pot, stack: P.stack, ranges, sizes, maxRaises: 1, sample: flop ? { turn: 6, river: 5 } : null, hero: hero.length ? hero : null };
  }
  function threeCfg() {
    const board = E.parseCards(th.board);
    if (board.length < 3 || board.length > 5 || new Set(board).size !== board.length) throw new Error('Le board fait 3, 4 ou 5 cartes différentes.');
    const P = THREE_PRE[th.pre], hero = E.parseCards(th.hero || '');
    if (hero.length && (hero.length !== 2 || hero[0] === hero[1] || hero.some((c) => board.includes(c)))) throw new Error('Ta main : 2 cartes absentes du board (ex. AhKd).');
    const raise = th.sizes === 'raise';
    const sizes = { flop: { bet: [33], raise: raise ? ['a'] : [] }, turn: { bet: [66], raise: raise ? ['a'] : [] }, river: { bet: [66], raise: raise ? ['a'] : [] } };
    const sample = board.length === 3 ? { turn: 6, river: 5 } : board.length === 4 && th.river === 'fast' ? { river: 12 } : null;
    return { board, pot: P.pot, stack: P.stack, ranges: th.r.slice(), sizes, maxRaises: 1, sample, hero: hero.length ? hero : null };
  }

  // ---------------- Résolution par tranches ----------------
  function start(kind) {
    const R = run[kind] = { kind, err: '', running: true, path: [], info: null, ex: null, t0: performance.now(), elapsed: 0, lastEx: 0, quiz: null, filter: null, more: false, cell: null };
    try {
      const cfg = kind === 'plo' ? ploCfg() : threeCfg();
      R.cfg = cfg; R.names = (kind === 'plo' ? PLO_PRE[pl.pre] : THREE_PRE[th.pre]).names;
      R.g = kind === 'plo' ? PS.create(cfg) : S3.create(cfg);
      R.maxSec = cfg.board.length === 3 ? 90 : 60; R.target = kind === 'plo' ? 0.5 : 1;
      if (R.g.stats().acts > 60000) throw new Error('Arbre trop gros pour le navigateur : choisis un turn ou une river, ou les tailles simples.');
    } catch (e) { R.err = e.message; R.running = false; R.g = null; }
    render(); if (R.g) setTimeout(() => chunk(R), 30);
  }
  const quality = (R) => (R.ex ? (R.kind === 'plo' ? R.ex.pct : R.ex.maxPct) : null);
  function chunk(R) {
    if (!R.running || run[R.kind] !== R) return;
    const g = R.g, t0 = performance.now();
    do g.iterate(1); while (performance.now() - t0 < 110);
    R.elapsed = (performance.now() - R.t0) / 1000;
    const it = g.stats().iterations;
    if (it - R.lastEx >= Math.max(10, Math.round(it * 0.2)) || R.elapsed > R.maxSec) { R.ex = g.exploitability(); R.lastEx = it; }
    const el = $('#mxprog'); if (el) el.innerHTML = progressHTML(R);
    if (R.fixedIt ? it >= R.fixedIt || R.elapsed > R.maxSec : (R.ex && quality(R) <= R.target) || R.elapsed > R.maxSec) { finish(R); return; }
    setTimeout(() => chunk(R), 0);
  }
  function finish(R) {
    R.running = false; if (R.lastEx !== R.g.stats().iterations) R.ex = R.g.exploitability();
    if (R.fixedIt) { R.fixedIt = 0; exReport(R); refresh(R); render(); return; }
    R.baseIts = R.g.stats().iterations;
    state.progress.solves = (state.progress.solves || 0) + 1; X.award?.('solve', null, true); X.Store.save('progress');
    refresh(R); render();
    if (R.kind === 'plo' && R.cfg.board.length === 4 && !R.second) setTimeout(() => second(R), 60);
  }
  // PLO au turn : second tirage indépendant des ranges, résolu par tranches ; les fréquences des nœuds du turn sont moyennées.
  function second(R) {
    if (run.plo !== R) return;
    const hero = R.cfg.hero || [], cfg = { ...R.cfg, ranges: ploRanges(R.cfg.board, R.cfg.ranges[0].length, 101, hero) };
    const S2 = R.second = { g: PS.create(cfg), it: 0, done: false, t0: performance.now() };
    const step = () => {
      if (run.plo !== R || R.second !== S2) return;
      const t = performance.now(); do { S2.g.iterate(1); S2.it++; } while (performance.now() - t < 90);
      if (S2.it % 30 < 3 || performance.now() - S2.t0 > R.maxSec * 1000) { S2.ex = S2.g.exploitability(); if (S2.ex.pct <= R.target || performance.now() - S2.t0 > R.maxSec * 1000) { S2.done = true; if (X.svSub?.() === 'plo') render(); return; } }
      setTimeout(step, 0);
    };
    setTimeout(step, 0);
  }
  // ---- PLO : verrou d'un nœud et profils sur tout l'arbre (exploitation) ----
  const PROFS = { gto: { label: 'Équilibre', pr: null }, station: { label: 'Calling station', pr: { fp: 0.4, ap: 0.3 } }, nit: { label: 'Nit', pr: { pf: 0.3, ap: 0.3 } }, maniaque: { label: 'Maniaque', pr: { pa: 0.35, fp: 0.2 } } };
  function rerun(R) { R.fixedIt = R.g.stats().iterations + Math.max(100, Math.round((R.baseIts || 150) * 0.6)); R.running = true; R.t0 = performance.now(); R.elapsed = 0; render(); setTimeout(() => chunk(R), 30); }
  function exBase(R) { if (!R.exBase) R.exBase = R.g.info([]).evMean.slice(); }
  function exReport(R) {
    const b = R.exBase; if (!b) return; const r = R.g.info([]);
    const who = R.prof ? R.prof.p : R.locks?.length ? R.locks[R.locks.length - 1].p : null; if (who === null) { R.exRes = 'Retour à l\'équilibre.'; R.exBase = null; return; }
    const o = 1 - who, gain = r.evMean[o] - b[o];
    R.exRes = `${esc(R.names[o])} gagne ${gain >= 0 ? '+' : '−'}${fr(Math.abs(gain), 2)} bb sur le spot (${fr((Math.abs(gain) / R.g.P0) * 100, 1)} % du pot de départ) en s'adaptant${R.prof ? ` à ${esc(R.names[who])} en ${esc(PROFS[R.prof.id].label.toLowerCase())}` : ' au verrou'}.`;
  }
  function exploitHTML(R, r) {
    if (R.kind !== 'plo' || R.running) return '';
    const node = r.node, isA = isAct(node), cur = R.prof || { p: -1, id: 'gto' };
    const row = (p) => `<div class="row"><span class="note">${esc(R.names[p])} joue comme :</span>${Object.entries(PROFS).map(([k, v]) => `<button class="chip" data-act="plprof" data-p="${p}" data-v="${k}" aria-pressed="${(cur.p === p && cur.id === k) || (k === 'gto' && cur.p !== p)}">${esc(v.label)}</button>`).join('')}</div>`;
    const lk = isA ? `<div class="row"><span class="note">Verrouiller ce nœud (${esc(R.names[node.p])}) :</span>${node.acts.map((_, a) => `<button class="chip" data-act="pllock" data-a="${a}" data-m="never">Jamais « ${esc(R.g.label(node, a).toLowerCase())} »</button>`).join('')}${node.acts.map((_, a) => `<button class="chip" data-act="pllock" data-a="${a}" data-m="always">Toujours « ${esc(R.g.label(node, a).toLowerCase())} »</button>`).join('')}</div>` : '';
    return `<section class="panel"><h2>Exploiter</h2><p class="note">Profil : la stratégie d'équilibre du joueur est déformée sur tout l'arbre, l'autre recalcule sa meilleure réponse. Verrou : ce nœud seulement, à partir de la stratégie d'équilibre.</p>${row(0)}${row(1)}${lk}${R.locks?.length ? `<p class="note">${R.locks.length} verrou${R.locks.length > 1 ? 's' : ''} posé${R.locks.length > 1 ? 's' : ''}. <button class="btn small" data-act="plunlock">Retirer les verrous</button></p>` : ''}${R.exRes ? `<p>${R.exRes}</p>` : ''}</section>`;
  }
  ACT.plprof = (t) => {
    const R = run.plo; if (!R?.g || R.running) return;
    const p = +t.dataset.p, id = t.dataset.v; exBase(R);
    if (R.prof && R.prof.p !== p) R.g.applyProfile(R.prof.p, null);
    R.g.applyProfile(p, PROFS[id].pr); R.prof = PROFS[id].pr ? { p, id } : null; R.exRes = ''; rerun(R);
  };
  ACT.pllock = (t) => {
    const R = run.plo; if (!R?.g || R.running) return;
    const r = R.g.info(R.path), node = r.node; if (!isAct(node)) return;
    const a0 = +t.dataset.a, n = R.g.N[node.p], A = node.acts.length, sg = Float64Array.from(r.strategy);
    for (let i = 0; i < n; i++) {
      if (t.dataset.m === 'always') { for (let a = 0; a < A; a++) sg[a * n + i] = a === a0 ? 1 : 0; continue; }
      const rest = 1 - sg[a0 * n + i]; sg[a0 * n + i] = 0;
      for (let a = 0; a < A; a++) if (a !== a0) sg[a * n + i] = rest > 1e-9 ? sg[a * n + i] / rest : 1 / (A - 1);
    }
    exBase(R); R.g.lock(R.path, sg); (R.locks = R.locks || []).push({ path: R.path.slice(), p: node.p });
    for (const nd of R.g.nodes) if (nd.t === 0 && nd.p !== node.p) nd.sum.fill(0);
    R.exRes = ''; rerun(R);
  };
  ACT.plunlock = () => { const R = run.plo; if (!R?.g || R.running) return; for (const l of R.locks || []) R.g.lock(l.path, null); R.locks = []; if (R.prof) { R.g.applyProfile(R.prof.p, null); R.prof = null; } rerun(R); };
  // Nœud du turn (avant la carte river) : même arbre d'actions dans les deux tirages.
  function secondHTML(R, r) {
    const S2 = R.second; if (!S2 || R.kind !== 'plo') return '';
    if (!S2.done) return '<p class="note">Second tirage des ranges en cours (moyenne de deux échantillons au turn)…</p>';
    let node = R.g.root; for (const x of R.path) { if (!isAct(node)) return '<p class="note">Moyenne des deux tirages : disponible sur les nœuds du turn.</p>'; node = node.ch[x]; }
    let r2; try { r2 = S2.g.info(R.path); } catch (e) { return ''; }
    const avg = r.freq.map((f, a) => (f + r2.freq[a]) / 2), d = Math.max(...r.freq.map((f, a) => Math.abs(f - r2.freq[a])));
    return `<p class="note"><span class="pill ${d <= 0.04 ? 'good' : d <= 0.08 ? 'warn' : 'bad'}">Deux tirages : écart ${fr(d * 100, 1)} points</span> moyenne retenue : ${r.node.acts.map((_, a) => `${esc(R.g.label(r.node, a).toLowerCase())} ${pct(avg[a], 0)}`).join(' · ')} (second tirage : exploitabilité ${fr(S2.ex.pct, 2)} %).</p>`;
  }
  function refresh(R) { try { R.info = R.g.info(R.path); } catch (e) { R.path = []; R.info = R.g.info([]); } R.quiz = null; }
  function progressHTML(R) {
    const st = R.g.stats(), q = quality(R), p = q === null ? 0.05 : Math.max(0.05, Math.min(1, Math.log(Math.max(q, R.target) / 40) / Math.log(R.target / 40)));
    const lab = R.kind === 'plo' ? 'exploitabilité' : 'gain max d\'une déviation';
    return `<div class="row" style="justify-content:space-between"><span class="eyebrow">${R.running ? 'Résolution en cours' : 'Résolu'}</span><span class="note mono">${st.iterations} itérations · ${fr(R.elapsed, 1)} s${q !== null ? ` · ${lab} ${fr(q, 2)} % du pot` : ''}</span></div><div class="pbar" aria-hidden="true"><i style="width:${Math.round(p * 100)}%"></i></div>`;
  }

  // ---------------- Couleurs et libellés ----------------
  function actClasses(node) {
    const bets = node.acts.map((a, i) => [a, i]).filter(([a]) => a.k === 'b' || a.k === 'r');
    return node.acts.map((a, i) => (a.k === 'f' ? 'f' : a.k === 'x' || a.k === 'c' ? 'x' : a.k === 'a' ? 'a' : 'b' + Math.min(3, 1 + bets.findIndex(([, j]) => j === i) + (bets.length === 1 ? 1 : 0))));
  }
  const grad = (parts) => { let acc = 0; const seg = parts.filter(([, f]) => f > 0.001).map(([c, f]) => `var(--act-${c}) ${(acc * 100).toFixed(1)}% ${((acc += f) * 100).toFixed(1)}%`); return seg.length ? `linear-gradient(90deg, ${seg.join(', ')})` : ''; };
  const bar = (node, f, cls, small) => `<div class="sbar${small ? ' small' : ''}">${f.map((x, a) => (x > 0.001 ? `<i style="width:${(x * 100).toFixed(2)}%;background:var(--act-${cls[a]})" title="${esc(lab(node, a))} ${pct(x, 0)}"></i>` : '')).join('')}</div>`;
  let curR = null; const lab = (node, a) => curR.g.label(node, a);
  const evTxt = (v) => (isFinite(v) ? fr(v, 2) + ' bb' : '–');
  const isAct = (node) => node.t === 0, isChance = (node) => node.t === 1;
  const handOf = (R, p, i) => (R.kind === 'plo' ? R.g.holeOf(p, i).sort((a, b) => b - a) : R.g.hands[p][i].slice(0, 2));
  const handHTML = (cs) => cs.map((c) => cardHTML(c, true)).join('');

  // Catégories de main (PLO : main faite + tirages ; Hold'em : classement du module Board).
  const catCache = new Map();
  function catOf(R, p, i, board) {
    const k = R.kind + p + ':' + i + ':' + board.join('.'); if (catCache.has(k)) return catCache.get(k);
    let out;
    if (R.kind === 'plo') {
      const h = R.g.holeOf(p, i), m = PS.madeCat(h, board), d = PS.draws(h, board);
      const dr = m >= 2 ? (d.nutFlush ? ' + tirage couleur max' : d.flush ? ' + tirage couleur' : d.wrap ? ' + tirage quinte (wrap)' : '') : '';
      out = { name: PS.CATS[m] + dr, order: m * 4 + (d.nutFlush ? 0 : d.flush ? 1 : d.wrap ? 2 : 3) };
    } else {
      const [a, b] = R.g.hands[p][i], c = B.classify([a, b], board);
      out = { name: B.MADE[c.made] + (c.draws.length && c.made >= 7 ? ' + tirage' : ''), order: c.made * 2 + (c.draws.length ? 0 : 1) };
    }
    if (catCache.size > 20000) catCache.clear(); catCache.set(k, out); return out;
  }

  // ---------------- Explorateur ----------------
  function crumbs(R) {
    const g = R.g; let node = g.root;
    const out = [`<button class="chip" data-act="mxpath" data-k="0">${g.board.map((c) => cardHTML(c, true)).join('')}</button>`];
    R.path.forEach((x, i) => {
      let txt;
      if (isAct(node)) { txt = `${esc(R.names[node.p])} : ${esc(g.label(node, x))}`; node = node.ch[x]; }
      else if (isChance(node)) { txt = `${node.board.length === 3 ? 'Turn' : 'River'} ${cardHTML(x, true)}`; node = node.ch[node.cards.indexOf(x)]; }
      out.push(`<button class="chip" data-act="mxpath" data-k="${i + 1}">${txt}</button>`);
    });
    return `<div class="crumbs">${out.join('<span aria-hidden="true">›</span>')}</div>`;
  }
  function resultHTML(R) {
    const g = R.g, r = R.info, node = r.node, np = R.kind === 'plo' ? 2 : 3;
    const live = node.live || [true, true, true];
    const st = g.stats(), q = quality(R);
    const top = `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">${r.board.length === 3 ? 'Flop' : r.board.length === 4 ? 'Turn' : 'River'} · pot ${fr(r.pot, 1)} bb · tapis ${fr(g.S - Math.max(...r.C), 1)} bb</span><span class="note mono">${R.kind === 'plo' ? 'exploitabilité' : 'déviation max'} ${q !== null ? fr(q, 2) : '?'} % du pot</span></div>
      ${crumbs(R)}
      <div class="felt"><div class="row" style="justify-content:center">${cardsHTML(r.board)}</div>
      <div class="stats svs">${Array.from({ length: np }, (_, p) => `<div class="stat${isAct(node) && node.p === p ? ' hero' : ''}"${live[p] ? '' : ' style="opacity:.45"'}><span>${esc(R.names[p])}${live[p] ? '' : ' · couché'}</span><b>${live[p] && isFinite(r.eqMean[p]) ? pct(r.eqMean[p], 1) : '–'}</b><span>équité · EV ${isFinite(r.evMean[p]) ? fr(r.evMean[p], 2) + ' bb' : '–'}</span></div>`).join('')}</div></div>
      ${st.approx ? `<p class="note" style="color:var(--warn)">Approché : ${g.board.length === 3 ? `${R.cfg.sample.turn} turns × ${R.cfg.sample.river} rivers échantillonnés` : `${R.cfg.sample.river} rivers échantillonnées sur 48`}. Les fréquences sont une indication ; pour un spot précis, résous depuis la rue suivante.</p>` : ''}
      ${R.kind === 'plo' ? `<p class="note">Ranges : ${g.N[0]} et ${g.N[1]} mains tirées au hasard dans la range (rang préflop exact). Chaque main représente environ ${fr(rangeSize(0) / g.N[0], 0)} et ${fr(rangeSize(1) / g.N[1], 0)} mains réelles : une main précise peut manquer, d'où « Ta main », toujours incluse.</p>` : ''}</section>`;
    let body;
    if (isAct(node)) body = actHTML(R, r).replace('</section>', secondHTML(R, r) + '</section>');
    else if (isChance(node)) {
      const bySuit = [3, 2, 1, 0].map((s) => node.cards.filter((c) => (c & 3) === s).sort((a, b) => b - a));
      body = `<section class="panel"><h2>Choisis la ${node.board.length === 3 ? 'turn' : 'river'}</h2>${bySuit.map((l) => (l.length ? `<div class="cards picks">${l.map((c) => `<button class="cardpick" data-act="mxcard" data-c="${c}" aria-label="${E.cardStr(c)}">${cardHTML(c, true)}</button>`).join('')}</div>` : '')).join('')}</section>`;
    } else {
      const w = live.map((x, p) => (x ? p : -1)).filter((p) => p >= 0);
      body = `<section class="panel"><h2>${node.t === 2 && R.kind === 'plo' ? `${esc(R.names[1 - node.winner])} se couche : ${esc(R.names[node.winner])} remporte le pot` : node.show === false ? `${esc(R.names[w[0]])} remporte le pot` : 'Abattage'}</h2><p>Fin de la branche, pot final ${fr(r.pot, 1)} bb. Reviens en arrière avec le fil d'Ariane.</p></section>`;
    }
    return top + body + exploitHTML(R, r);
  }
  const rangeSize = (p) => 270725 * Math.max(0.001, pl.hi[p] - pl.lo[p]);
  function actHTML(R, r) {
    curR = R;
    const g = R.g, node = r.node, p = node.p, n = g.N[p], A = node.acts.length, cls = actClasses(node), reach = r.reach[p], tot = reach.reduce((a, b) => a + b, 0);
    const btns = node.acts.map((_, a) => `<button class="btn actb" data-act="mxact" data-a="${a}"><i class="sw" style="background:var(--act-${cls[a]})"></i>${esc(g.label(node, a))} <span class="mono">${pct(r.freq[a], 1)}</span></button>`).join('');
    // Catégories.
    const cats = new Map();
    for (let i = 0; i < n; i++) {
      const w = reach[i]; if (w <= 1e-9) continue;
      const c = catOf(R, p, i, node.board); let x = cats.get(c.name); if (!x) cats.set(c.name, x = { m: 0, f: new Array(A).fill(0), eq: 0, em: 0, order: c.order });
      x.m += w; for (let a = 0; a < A; a++) x.f[a] += w * r.strategy[a * n + i]; if (isFinite(r.eq[p][i])) { x.eq += w * r.eq[p][i]; x.em += w; }
    }
    const catRows = [...cats].sort((a, b) => a[1].order - b[1].order).map(([name, x]) => `<tr${R.kind === 'plo' ? ` style="cursor:pointer" data-act="mxfilter" data-v="${esc(name)}" aria-pressed="${R.filter === name}"` : ''}><td>${esc(name)}${R.filter === name ? ' ✓' : ''}</td><td class="n mono">${pct(x.m / tot, 1)}</td><td class="n mono">${x.em ? pct(x.eq / x.em, 0) : '–'}</td><td style="min-width:140px">${bar(node, x.f.map((f) => f / x.m), cls, true)}</td></tr>`).join('');
    let detail = '';
    if (R.kind === 'three') {
      // Grille 13 × 13 de la stratégie du joueur qui parle.
      const agg = new Map();
      for (let i = 0; i < n; i++) { const [a, b] = g.hands[p][i], h = E.abstractOf(a, b); let x = agg.get(h); if (!x) agg.set(h, x = { m: 0, f: new Array(A).fill(0) }); const w = reach[i]; if (w <= 0) continue; x.m += w; for (let k = 0; k < A; k++) x.f[k] += w * r.strategy[k * n + i]; }
      const cell = (h) => { const x = agg.get(h); if (!x || x.m <= 1e-9) return `<button class="rc sv off" disabled>${h}</button>`; const op = Math.max(0.35, Math.min(1, x.m / E.combos(h).length)); return `<button class="rc sv${R.cell === h ? ' sel' : ''}" data-act="mxcell" data-h="${h}" style="background:${grad(node.acts.map((_, k) => [cls[k], x.f[k] / x.m]))};opacity:${op.toFixed(2)}" title="${h}">${h}</button>`; };
      detail = `<div class="svgrid">${grid169(cell)}</div><p class="note">Couleur = mélange d'actions de la classe ; case pâle = peu de combos arrivent ici. Clique une case pour le détail.</p>${R.cell ? comboTable(R, r, (i) => E.abstractOf(...g.hands[p][i].slice(0, 2)) === R.cell) : ''}`;
    } else {
      const idx = []; for (let i = 0; i < n; i++) if (reach[i] > 1e-6 && (!R.filter || catOf(R, p, i, node.board).name === R.filter)) idx.push(i);
      idx.sort((a, b) => (r.ev[p][b] || -1e9) - (r.ev[p][a] || -1e9));
      const shown = R.more ? idx : idx.slice(0, 30);
      detail = `<h3 style="margin:8px 0 0">Mains de la range${R.filter ? ` · ${esc(R.filter)}` : ''} (${idx.length}), par EV décroissante</h3>${comboTable(R, r, null, shown)}
        ${idx.length > 30 ? `<button class="btn small" data-act="mxmore">${R.more ? 'Afficher moins' : `Afficher les ${idx.length} mains`}</button>` : ''}${R.filter ? '<button class="btn small" data-act="mxfilter" data-v="">Toutes les catégories</button>' : ''}`;
    }
    return `<section class="panel"><h2>${esc(R.names[p])} parle</h2>${bar(node, r.freq, cls)}<div class="row actrow">${btns}</div>
        <div class="row"><button class="btn" data-act="mxquiz">${R.quiz ? 'Autre main' : 'Entraîne-toi sur ce nœud'}</button><span class="note">Une main tirée dans la range de ${esc(R.names[p])} : choisis l'action, le solveur corrige.</span></div>
        ${R.quiz ? quizHTML(R, r) : ''}</section>
      ${heroHTML(R, r)}
      <section class="panel"><h2>Stratégie par catégorie de main</h2><div class="tw"><table class="t"><thead><tr><th>Catégorie</th><th class="n">Part</th><th class="n">Équité</th><th>Actions</th></tr></thead><tbody>${catRows}</tbody></table></div>
        <div class="legend">${node.acts.map((_, a) => `<span><i style="background:var(--act-${cls[a]})"></i>${esc(g.label(node, a))}</span>`).join('')}</div>${R.kind === 'plo' ? '<p class="note">Clique une catégorie pour filtrer la liste des mains.</p>' : ''}
        ${detail}</section>`;
  }
  function comboTable(R, r, test, list) {
    const g = R.g, node = r.node, p = node.p, n = g.N[p], cls = actClasses(node);
    const ids = list || [...Array(n).keys()].filter((i) => r.reach[p][i] > 1e-9 && test(i));
    const rows = ids.map((i) => {
      const best = Math.max(...r.actEv.map((v) => v[i]));
      return `<tr><td style="white-space:nowrap">${handHTML(handOf(R, p, i))}</td><td class="n mono">${isFinite(r.eq[p][i]) ? pct(r.eq[p][i], 0) : '–'}</td><td class="n mono">${evTxt(r.ev[p][i])}</td>${node.acts.map((_, a) => { const f = r.strategy[a * n + i], v = r.actEv[a][i]; return `<td class="n"><span class="mini-sw" style="background:var(--act-${cls[a]})"></span><span class="mono">${pct(f, 0)}</span><br><span class="note mono${Math.abs(v - best) < 1e-6 ? ' bestev' : ''}">${evTxt(v)}</span></td>`; }).join('')}</tr>`;
    }).join('');
    return `<div class="tw"><table class="t combos"><thead><tr><th>Main</th><th class="n">Équité</th><th class="n">EV</th>${node.acts.map((_, a) => `<th class="n">${esc(g.label(node, a))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function heroIndex(R, p) {
    const h = R.cfg.hero; if (!h) return -1; const k = h.slice().sort((a, b) => a - b).join('.');
    for (let i = 0; i < R.g.N[p]; i++) if (handOf(R, p, i).slice().sort((a, b) => a - b).join('.') === k) return i;
    return -1;
  }
  function heroHTML(R, r) {
    if (!R.cfg.hero) return '';
    const node = r.node, out = [];
    for (let p = 0; p < R.g.N.length; p++) {
      const i = heroIndex(R, p); if (i < 0) continue;
      if (r.reach[p][i] <= 1e-9) { out.push(`<p>${handHTML(R.cfg.hero)} chez ${esc(R.names[p])} n'arrive pas à ce nœud : le solveur l'a jouée autrement avant.</p>`); continue; }
      let line = `<p>${handHTML(R.cfg.hero)} chez ${esc(R.names[p])} : équité ${pct(r.eq[p][i], 1)}, EV ${evTxt(r.ev[p][i])}.</p>`;
      if (node.p === p) {
        const n = R.g.N[p], evs = r.actEv.map((v) => v[i]), best = Math.max(...evs), bi = evs.indexOf(best);
        line += `<div class="advice">${node.acts.map((_, a) => `<div class="${a === bi ? 'good' : best - evs[a] > 0.05 * r.pot ? 'bad' : 'warn'}"><strong>${esc(R.g.label(node, a))}</strong> · fréquence ${pct(r.strategy[a * n + i], 0)} · EV ${evTxt(evs[a])}${a === bi ? ' · meilleure EV' : ` · perte ${fr(best - evs[a], 2)} bb`}</div>`).join('')}</div>`;
      }
      out.push(line);
    }
    return `<section class="panel"><h2>Ta main</h2>${out.join('') || `<p>${handHTML(R.cfg.hero)} n'est dans aucune range de ce spot (ou une carte du board la bloque).</p>`}</section>`;
  }
  // ---------------- Entraîneur ----------------
  function drawQuiz(R) {
    const r = R.info, p = r.node.p, reach = r.reach[p], tot = reach.reduce((a, b) => a + b, 0); let x = Math.random() * tot, i = 0;
    for (; i < reach.length - 1; i++) { x -= reach[i]; if (x <= 0) break; }
    R.quiz = { i, ans: null };
  }
  function quizHTML(R, r) {
    const z = R.quiz, node = r.node, p = node.p, n = R.g.N[p], i = z.i, cls = actClasses(node);
    const head = `<div class="row" style="gap:14px;align-items:center"><span class="cards">${handOf(R, p, i).map((c) => cardHTML(c)).join('')}</span><span class="note">${esc(R.names[p])} · board ${handHTML(node.board)} · pot ${fr(r.pot, 1)} bb</span></div>`;
    if (z.ans === null) return `<div class="advice">${head}<div class="opts">${node.acts.map((_, a) => `<button class="opt" data-act="mxans" data-a="${a}">${esc(R.g.label(node, a))}</button>`).join('')}</div></div>`;
    const evs = r.actEv.map((v) => v[i]), best = Math.max(...evs), loss = best - evs[z.ans], f = r.strategy[z.ans * n + i], ok = f >= 0.15 || loss <= 0.01 * r.pot;
    return `<div class="advice">${head}<div class="${ok ? 'good' : 'bad'}"><strong>${ok ? 'Correct' : 'À revoir'}.</strong> Tu as choisi ${esc(R.g.label(node, z.ans).toLowerCase())} : le solveur la joue ${pct(f, 0)} du temps${loss > 1e-6 ? `, perte ${fr(loss, 2)} bb (${pct(loss / r.pot, 1)} du pot)` : ', meilleure EV'}.</div>
      ${bar(node, node.acts.map((_, a) => r.strategy[a * n + i]), cls)}<div class="note">${node.acts.map((_, a) => `${esc(R.g.label(node, a))} ${pct(r.strategy[a * n + i], 0)} · EV ${evTxt(evs[a])}`).join(' · ')}</div>
      <div class="note">Score ${R.kind === 'plo' ? 'PLO' : 'à trois'} : ${prog()[R.kind].ok} / ${prog()[R.kind].n}.</div></div>`;
  }

  // ---------------- Vues ----------------
  const errHTML = (R) => (R && R.err ? `<p class="pill bad" style="white-space:normal">${esc(R.err)}</p>` : '');
  function wrap(kind, setup) {
    const R = run[kind];
    const progress = R && R.g ? `<section class="panel" id="mxprog">${progressHTML(R)}</section>` : '';
    const btn = R && R.running ? `<button class="btn" data-act="mxstop" data-k="${kind}">Arrêter et voir le résultat</button>` : `<button class="btn primary" data-act="mxgo" data-k="${kind}">Résoudre</button>`;
    const box = `<section class="panel">${setup}${errHTML(R)}<div class="row">${btn}</div></section>`;
    if (R && R.g && !R.running && R.info) return resultHTML(R) + progress + `<details class="panel"${R.open ? ' open' : ''}><summary data-act="mxsetup" data-k="${kind}"><strong>Modifier le spot</strong></summary>${box}</details>`;
    return box + progress;
  }
  X.ploHTML = () => {
    const P = PLO_PRE[pl.pre];
    const setup = `<p class="lead">Équilibre d'un spot d'Omaha pot-limit à deux joueurs après le flop. Les ranges PLO comptent des dizaines de milliers de mains : le solveur en tire un échantillon par rang préflop exact, puis calcule l'équilibre exact sur cet échantillon (cartes partagées retirées exactement).</p>
      <div class="row"><span class="note">Spot :</span>${Object.entries(PLO_PRE).map(([k, v]) => `<button class="chip" aria-pressed="${pl.pre === k}" data-act="plpre" data-v="${k}">${esc(v.label)}</button>`).join('')}</div>
      <p class="note">${pl.src === 'solver' ? '' : esc(P.note) + ' '}Pot ${fr(P.pot, 1)} bb, tapis ${fr(P.stack, 1)} bb.</p>
      <div class="form">
        <label class="f">Board (flop, turn ou river)<input data-plf="board" value="${esc(pl.board)}" spellcheck="false" autocomplete="off"></label>
        <label class="f">Ta main (facultatif, 4 cartes)<input data-plf="hero" value="${esc(pl.hero)}" placeholder="AsAhJdTd" spellcheck="false" autocomplete="off"></label>
      </div>
      <div class="row"><span class="note">Ranges :</span><button class="chip" aria-pressed="${pl.src === 'solver'}" data-act="plsrc" data-v="solver">Solveur préflop PLO</button><button class="chip" aria-pressed="${pl.src !== 'solver'}" data-act="plsrc" data-v="window">Fenêtre de rang (manuel)</button></div>
      ${pl.src === 'solver' ? `<p class="note">${[0, 1].map((p) => { const fq = ploFreq(pl.pre, p); return fq ? `${esc(P.names[p])} : ${PLO_SRC[pl.pre][p][1] === 'r' ? (PLO_SRC[pl.pre][p][0].startsWith('rfi') ? 'ouvre' : 'sur-relance') : 'paie'} ${pct(fq.pct, 0)} des mains` : ''; }).join(' · ')}. Modèle : 6-max, 100 bb, tailles au pot, 120 paquets de mains (structure de couleurs × équité), réalisation hors de position 85 % ; ses défenses sont larges, la fenêtre manuelle permet de resserrer.</p>` : ''}
      <div class="form"${pl.src === 'solver' ? ' hidden' : ''}>
        ${[0, 1].map((p) => `<label class="f">Range ${esc(P.names[p])} (${p ? 'IP' : 'OOP'}) : rang préflop de … à … %<span class="row" style="gap:6px"><input data-plf="lo${p}" inputmode="decimal" value="${fr(pl.lo[p] * 100, 0)}" style="width:5em" aria-label="Rang minimum ${esc(P.names[p])}"><input data-plf="hi${p}" inputmode="decimal" value="${fr(pl.hi[p] * 100, 0)}" style="width:5em" aria-label="Rang maximum ${esc(P.names[p])}"></span></label>`).join('')}
      </div>
      <div class="row"><button class="btn small" data-act="plrand" data-n="3">Flop au hasard</button><button class="btn small" data-act="plrand" data-n="4">Turn au hasard</button><button class="btn small" data-act="plrand" data-n="5">River au hasard</button></div>
      <div class="row"><span class="note">Mains par range :</span>${PLO_Q.map((q, i) => { const N = PLO_N[Math.min(5, Math.max(3, E.parseCards(pl.board).length))][i]; return `<button class="chip" aria-pressed="${pl.q === q}" data-act="pln" data-v="${q}">${['Rapide', 'Standard', 'Précis'][i]} (${N})</button>`; }).join('')}</div>
      <div class="row"><span class="note">Tailles :</span><button class="chip" aria-pressed="${pl.sizes === 'simple'}" data-act="plsz" data-v="simple">Simples (⅔ pot, relance du pot)</button><button class="chip" aria-pressed="${pl.sizes === 'riche'}" data-act="plsz" data-v="riche">Riches (½, pot, ⅓)</button></div>
      <p class="note">${E.parseCards(pl.board).length === 3 ? 'Depuis le flop : 6 turns × 5 rivers échantillonnés, une seule taille au turn et à la river. Compte 30 à 90 s.' : E.parseCards(pl.board).length === 4 ? 'Turn exact (toutes les rivers) : 5 à 40 s, puis un second tirage des ranges est résolu et moyenné avec le premier.' : 'River : moins d\'une seconde.'} Échantillon stratifié : les proportions de mains faites et de tirages sur ce board sont tenues exactement.}</p>`;
    return wrap('plo', setup);
  };
  X.threeHTML = () => {
    const P = THREE_PRE[th.pre], nb = E.parseCards(th.board).length;
    const setup = `<p class="lead">Pot à trois joueurs après le flop (Hold'em). Ordre de parole : ${P.names.map(esc).join(', puis ')}. Simplifications : une taille de mise par rue. Blocages : la masse jointe des deux adversaires est exacte (cartes de ta main et cartes communes entre eux retirées) ; la répartition gagne / partage / perd à l'abattage reste approchée.</p>
      <div class="row"><span class="note">Spot :</span>${Object.entries(THREE_PRE).map(([k, v]) => `<button class="chip" aria-pressed="${th.pre === k}" data-act="thpre" data-v="${k}">${esc(v.label)}</button>`).join('')}</div>
      <p class="note">Pot ${fr(P.pot, 1)} bb, tapis ${fr(P.stack, 1)} bb.</p>
      <div class="form">
        <label class="f">Board (flop, turn ou river)<input data-thf="board" value="${esc(th.board)}" spellcheck="false" autocomplete="off"></label>
        <label class="f">Ta main (facultatif)<input data-thf="hero" value="${esc(th.hero)}" placeholder="AhKd" spellcheck="false" autocomplete="off"></label>
      </div>
      ${[0, 1, 2].map((p) => `<label class="f">Range ${esc(P.names[p])}<textarea class="mono" rows="2" data-thr="${p}" spellcheck="false" style="font-size:13px">${esc(th.r[p])}</textarea></label>`).join('')}
      <div class="row"><button class="btn small" data-act="thrand" data-n="3">Flop au hasard</button><button class="btn small" data-act="thrand" data-n="4">Turn au hasard</button><button class="btn small" data-act="thrand" data-n="5">River au hasard</button></div>
      <div class="row"><span class="note">Mises :</span><button class="chip" aria-pressed="${th.sizes === 'simple'}" data-act="thsz" data-v="simple">⅓ pot au flop, ⅔ ensuite</button><button class="chip" aria-pressed="${th.sizes === 'raise'}" data-act="thsz" data-v="raise">+ relance à tapis</button></div>
      ${nb === 4 ? `<div class="row"><span class="note">Rivers :</span><button class="chip" aria-pressed="${th.river === 'fast'}" data-act="thriv" data-v="fast">12 échantillonnées (≈ 5 s)</button><button class="chip" aria-pressed="${th.river === 'exact'}" data-act="thriv" data-v="exact">Toutes (≈ 1 à 2 min)</button></div>` : ''}
      <p class="note">${nb === 3 ? 'Depuis le flop : 6 turns × 5 rivers échantillonnés, environ une minute.' : nb === 5 ? 'River : moins d\'une seconde.' : ''} Qualité : à trois, on mesure ce qu'un joueur gagnerait en changeant seul de stratégie (sous 1 % du pot : solide pour l'étude).</p>`;
    return wrap('three', setup);
  };

  // ---------------- Actions ----------------
  const RR = (t) => run[t.dataset.k];
  ACT.mxgo = (t) => start(t.dataset.k);
  ACT.mxsetup = (t, e) => { e.preventDefault(); const R = RR(t); if (R) { R.open = !R.open; render(); } };
  ACT.mxstop = (t) => { const R = RR(t); if (R && R.running) finish(R); };
  const cur = () => { const s = X.svSub?.(); return run[s === 'three' ? 'three' : 'plo']; };
  ACT.mxpath = (t) => { const R = cur(); if (!R) return; R.path = R.path.slice(0, +t.dataset.k); R.cell = null; R.filter = null; refresh(R); render(); };
  ACT.mxact = (t) => { const R = cur(); R.path.push(+t.dataset.a); R.cell = null; R.filter = null; refresh(R); render(); };
  ACT.mxcard = (t) => { const R = cur(); R.path.push(+t.dataset.c); refresh(R); render(); };
  ACT.mxcell = (t) => { const R = cur(); R.cell = R.cell === t.dataset.h ? null : t.dataset.h; render(); };
  ACT.mxfilter = (t) => { const R = cur(); R.filter = t.dataset.v && R.filter !== t.dataset.v ? t.dataset.v : null; R.more = false; render(); };
  ACT.mxmore = () => { const R = cur(); R.more = !R.more; render(); };
  ACT.mxquiz = () => { const R = cur(); drawQuiz(R); render(); };
  ACT.mxans = (t) => {
    const R = cur(), r = R.info, node = r.node, n = R.g.N[node.p], i = R.quiz.i, a = +t.dataset.a;
    R.quiz.ans = a; const evs = r.actEv.map((v) => v[i]), loss = Math.max(...evs) - evs[a], ok = r.strategy[a * n + i] >= 0.15 || loss <= 0.01 * r.pot;
    const P = prog()[R.kind]; P.n++; if (ok) P.ok++; X.Store.save('progress'); render();
  };
  const randBoard = (n) => { const d = E.shuffle ? E.shuffle([...Array(52).keys()]) : [...Array(52).keys()].sort(() => Math.random() - 0.5); return d.slice(0, n).map((c) => E.cardStr(c)).join(''); };
  ACT.plpre = (t) => { pl.pre = t.dataset.v; pl.lo = PLO_PRE[pl.pre].lo.slice(); pl.hi = PLO_PRE[pl.pre].hi.slice(); render(); };
  ACT.pln = (t) => { pl.q = t.dataset.v; render(); };
  ACT.plsrc = (t) => { pl.src = t.dataset.v; render(); };
  ACT.plsz = (t) => { pl.sizes = t.dataset.v; render(); };
  ACT.plrand = (t) => { pl.board = randBoard(+t.dataset.n); render(); };
  ACT.thpre = (t) => { th.pre = t.dataset.v; th.r = THREE_PRE[th.pre].r.slice(); render(); };
  ACT.thsz = (t) => { th.sizes = t.dataset.v; render(); };
  ACT.thriv = (t) => { th.river = t.dataset.v; render(); };
  ACT.thrand = (t) => { th.board = randBoard(+t.dataset.n); render(); };
  ONCHANGE.push((t) => {
    if (t.dataset.plf) { const k = t.dataset.plf, v = t.value.trim(); if (/^(lo|hi)\d$/.test(k)) { const x = Math.max(0, Math.min(100, +v.replace(',', '.') || 0)) / 100; pl[k.slice(0, 2)][+k[2]] = x; } else pl[k] = v; render(); return true; }
    if (t.dataset.thf) { th[t.dataset.thf] = t.value.trim(); render(); return true; }
    if (t.dataset.thr) { th.r[+t.dataset.thr] = t.value; return true; }
  });
  X.MULTI = { pl, th, run, PLO_PRE, THREE_PRE, start };
})();
