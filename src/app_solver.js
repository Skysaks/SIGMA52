// Onglet Solveur : préparation d'un spot (ranges, board, tailles), résolution CFR par tranches, navigation dans l'arbre,
// grille 13 × 13 par action, ta main, rapport par catégorie, re-résolution exacte d'un turn ou d'une river, import depuis le replayer.
(function () {
  const X = window.__S52, PF = window.Postflop;
  const { E, C, B, HH, $, esc, fr, pct, state, render, go, head, cardHTML, cardsHTML, grid169, VIEWS, ACT, ONCHANGE, ONINPUT, ONKEY } = X;

  // ---------------- Scénarios préflop (6-max, 100 bb, ouverture 2,5 bb, SB 3 bb) ----------------
  const ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN']; // ordre de parole après le flop
  // Range de l'ouvreur qui paie un 3-bet (point de départ ; ses 4-bets QQ+/AK sont retirés).
  const CALL3 = {
    UTG: 'JJ-99, AQs-AJs, KQs, AQo',
    HJ: 'JJ-88, AQs-ATs, KQs, KJs, QJs, JTs, AQo',
    CO: 'JJ-66, AQs-A9s, KQs-KTs, QJs, QTs, JTs, T9s, 98s, AQo, AJo, KQo',
    BTN: 'JJ-55, AQs-A6s, KQs-K9s, QJs-Q9s, JTs, J9s, T9s, 98s, 87s, 76s, AQo-ATo, KQo, KJo',
    SB: 'JJ-66, AQs-A8s, KQs-KTs, QJs, QTs, JTs, T9s, 98s, 87s, AQo, AJo, KQo',
  };
  const LIMP = '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K7o+, Q8o+, J8o+, T8o+, 98o';
  function scenarios() {
    const L = [];
    const srp = [['UTG', 'BB'], ['HJ', 'BB'], ['CO', 'BB'], ['BTN', 'BB'], ['SB', 'BB'], ['UTG', 'BTN'], ['HJ', 'BTN'], ['CO', 'BTN'], ['HJ', 'CO']];
    for (const [x, y] of srp) {
      const o = x === 'SB' ? 3 : 2.5, inHand = [x, y];
      const pot = 2 * o + (inHand.includes('SB') ? 0 : 0.5) + (inHand.includes('BB') ? 0 : 1);
      L.push({ id: `srp-${x}-${y}`, label: `${x} ouvre, ${y} paie`, type: 'Pot simple', agg: x, a: x, b: y, ra: C.RFI[x].range, rb: C.FACING[x][y].call, pot, stack: 100 - o });
    }
    const tbp = [['BTN', 'BB'], ['BTN', 'SB'], ['CO', 'BTN'], ['CO', 'BB'], ['HJ', 'BTN'], ['UTG', 'BTN'], ['SB', 'BB']];
    for (const [x, y] of tbp) {
      const o = x === 'SB' ? 3 : 2.5, yIP = ORDER.indexOf(y) > ORDER.indexOf(x), size = yIP ? 3 * o : (x === 'SB' ? 3 * o : 4 * o), inHand = [x, y];
      const pot = 2 * size + (inHand.includes('SB') ? 0 : 0.5) + (inHand.includes('BB') ? 0 : 1);
      L.push({ id: `3bp-${x}-${y}`, label: `${x} ouvre, ${y} 3-bet, ${x} paie`, type: 'Pot 3-bet', agg: y, a: x, b: y, ra: CALL3[x], rb: C.FACING[x][y].threebet, pot, stack: 100 - size });
    }
    return L;
  }
  const SCEN = scenarios();
  // Situations étendues (pots 4-bet, autres profondeurs, tournoi) : ranges pondérées du solveur préflop (src/scen_ext.js).
  if (window.ScenExt && window.PreflopData) for (const x of window.ScenExt.build(window.PreflopData)) SCEN.push({ id: x.id, label: x.label.replace(/^[^·]+· /, ''), type: x.type, agg: x.agg, a: x.a, b: x.b, ra: x.ra, rb: x.rb, pot: x.pot, stack: x.stack, ext: true, note: x.note });
  const SCTYPES = [...new Set(SCEN.map((s) => s.type))];
  // OOP = celui qui parle en premier après le flop.
  const seatsOf = (sc) => (ORDER.indexOf(sc.a) < ORDER.indexOf(sc.b) ? [[sc.a, sc.ra], [sc.b, sc.rb]] : [[sc.b, sc.rb], [sc.a, sc.ra]]);

  // ---------------- Tailles de mise ----------------
  const PRESETS = {
    fast: { label: 'Rapide', note: '1 taille par rue, une relance', maxRaises: 1,
      flop: { agg: [33], defIP: [50], defOOP: [], raise: [60] }, turn: { agg: [75], defIP: [75], defOOP: [75], raise: [60] }, river: { agg: [75], defIP: [75], defOOP: [75], raise: [60] } },
    std: { label: 'Standard', note: '2 tailles, relances', maxRaises: 2,
      flop: { agg: [33, 75], defIP: [50], defOOP: [], raise: [60] }, turn: { agg: [50, 100], defIP: [66], defOOP: [66], raise: [60] }, river: { agg: [50, 100], defIP: [66], defOOP: [66], raise: [60, 'a'] } },
    fine: { label: 'Détaillé', note: '3 tailles, overbet, tapis', maxRaises: 2,
      flop: { agg: [25, 50, 100], defIP: [33, 75], defOOP: [33], raise: [60, 'a'] }, turn: { agg: [33, 75, 125], defIP: [50, 100], defOOP: [50], raise: [60, 'a'] }, river: { agg: [33, 75, 150, 'a'], defIP: [50, 100, 'a'], defOOP: [50, 'a'], raise: [60, 'a'] } },
  };
  const ST = ['flop', 'turn', 'river'];
  // Solve depuis le flop : le turn et la river sont simplifiés (une taille de 75 % pour les deux joueurs, sans relance),
  // sinon l'arbre ne tient ni en mémoire ni en temps dans un navigateur. Le détail se retrouve en re-résolvant le turn.
  function presetSizes(key, aggIdx, boardLen = E.parseCards(sv?.board || '').length) {
    const P = PRESETS[key], out = {};
    for (const st of ST) {
      if (boardLen === 3 && st !== 'flop') { out[st] = [0, 1].map(() => ({ bet: '75', raise: '' })); continue; }
      out[st] = [0, 1].map((p) => ({ bet: (p === aggIdx ? P[st].agg : p === 1 ? P[st].defIP : P[st].defOOP).join(' '), raise: P[st].raise.join(' ') }));
    }
    return out;
  }
  // Tirages du flop : représentants d'orbites de couleurs (sur un flop bicolore ou monocolore, chaque tirage couvre aussi ses cartes symétriques).
  const SAMPLES = { fast: { turn: 12, river: 8, label: 'Rapide (12 turns × 8 rivers)' }, std: { turn: 16, river: 10, label: 'Standard (16 × 10)' }, fine: { turn: 24, river: 16, label: 'Fin (24 × 16)' }, exact: { exact: true, label: 'Exact (toutes les cartes)' } };
  const EXACT_MB = 400;
  const ACC = { fast: { pct: 1, label: '1 % du pot' }, std: { pct: 0.5, label: '0,5 % du pot' }, fine: { pct: 0.3, label: '0,3 % du pot' } };

  // ---------------- État ----------------
  const sv = {
    sub: 'solve', scen: 'srp-BTN-BB', names: ['BB', 'BTN'], r: ['', ''], board: 'Ks7d2c', pot: 5.5, stack: 97.5, preset: 'std', sizes: null, maxRaises: 2,
    acc: 'fast', sample: 'std', hero: '', maxSec: 300, err: '', note: '',
    game: null, running: false, path: [], info: null, ex: null, t0: 0, elapsed: 0, lastEx: 0, cell: null, view: 'strat', paint: -1, brush: 1, target: null, showSizes: false,
  };
  function applyScenario(id) {
    const sc = SCEN.find((s) => s.id === id); if (!sc) return;
    const [o, i] = seatsOf(sc);
    sv.scen = id; sv.agg = sc.agg === o[0] ? 0 : 1; sv.names = [o[0], i[0]]; sv.r = [o[1], i[1]]; sv.pot = sc.pot; sv.stack = sc.stack;
    sv.sizes = presetSizes(sv.preset, sc.agg === o[0] ? 0 : 1, E.parseCards(sv.board).length); sv.sizesCustom = false; sv.maxRaises = PRESETS[sv.preset].maxRaises; sv.note = sc.ext ? `Ranges pondérées du solveur préflop (${sc.note}). Pot ${String(sc.pot).replace('.', ',')} bb, tapis ${String(sc.stack).replace('.', ',')} bb.` : '';
  }
  applyScenario(sv.scen);
  const aggIdx = () => sv.agg ?? 1;

  // ---------------- Couleurs des actions ----------------
  function actClasses(node) {
    const bets = node.acts.map((a, i) => [a, i]).filter(([a]) => a.k === 'b' || a.k === 'r');
    return node.acts.map((a, i) => a.k === 'f' ? 'f' : a.k === 'x' || a.k === 'c' ? 'x' : a.k === 'a' ? 'a' : 'b' + Math.min(3, 1 + bets.findIndex(([, j]) => j === i) + (bets.length === 1 ? 1 : 0)));
  }
  const grad = (parts) => { let acc = 0; const seg = parts.filter(([, f]) => f > 0.001).map(([c, f]) => { const s = `var(--act-${c}) ${fr(acc * 100, 1).replace(',', '.')}% ${fr((acc += f) * 100, 1).replace(',', '.')}%`; return s; }); return seg.length ? `linear-gradient(90deg, ${seg.join(', ')})` : ''; };

  // ---------------- Lancement ----------------
  function buildCfg() {
    const board = E.parseCards(sv.board);
    if (board.length < 3 || board.length > 5) throw new Error('Le board fait 3 (flop), 4 (turn) ou 5 cartes (river).');
    if (new Set(board).size !== board.length) throw new Error('Une carte du board apparaît deux fois.');
    const pot = +String(sv.pot).replace(',', '.'), stack = +String(sv.stack).replace(',', '.');
    if (!(pot > 0)) throw new Error('Pot invalide.'); if (!(stack >= 0)) throw new Error('Tapis invalide.');
    const sizes = {}; for (const st of ST) sizes[st] = sv.sizes[st].map((x) => ({ bet: x.bet, raise: x.raise }));
    const rp = +String(sv.rakePct ?? 0).replace(',', '.') || 0, rc = +String(sv.rakeCap ?? 3).replace(',', '.') || 0;
    let icm = null;
    if (sv.icmOn) {
      const nums = (x) => String(x || '').replace(/,/g, '.').split(/[\s;]+/).filter(Boolean).map(Number);
      const others = nums(sv.icmOthers), pay = nums(sv.icmPay ?? '50 30 20'), own = nums(sv.icmOwn);
      if (!others.length || others.some((x) => !(x > 0))) throw new Error('ICM : indique le tapis (bb) de chaque autre joueur encore en jeu, séparés par des espaces.');
      if (!pay.length || pay.some((x) => !(x >= 0))) throw new Error('ICM : indique les prix (1er, 2e, …) séparés par des espaces.');
      if (others.length + 2 > 9) throw new Error('ICM : neuf joueurs au plus.');
      const st = own.length === 2 ? own : [stack, stack];
      if (st.some((x) => x < stack - 1e-9)) throw new Error('ICM : le tapis derrière chaque joueur ne peut pas être inférieur au tapis effectif.');
      icm = { stacks: [st[0], st[1], ...others], seats: [0, 1], payouts: pay };
    }
    return { icm, rake: rp > 0 ? { pct: rp / 100, cap: rc > 0 ? rc : Infinity } : null, board, pot, stack, ranges: sv.r.slice(), sizes, maxRaises: sv.maxRaises, sample: board.length === 3 && !SAMPLES[sv.sample].exact ? SAMPLES[sv.sample] : null, include: sv.include || null };
  }
  function estimateText() {
    try {
      const cfg = buildCfg(), key = JSON.stringify({ ...cfg, ranges: null });
      const est = sv.estKey === key ? sv.est : PF.estimate(cfg); sv.estKey = key; sv.est = est; if (est.error) return esc(est.error);
      const N = [0, 1].map((p) => (Array.isArray(cfg.ranges[p]) ? cfg.ranges[p].length : PF.parseWeighted(cfg.ranges[p], cfg.board).length));
      const mb = (est.cells[0] * N[0] + est.cells[1] * N[1]) * 8 / 1048576;
      const work = est.nodes * (N[0] + N[1]) / 2 / 2e4; // ms par itération, mesuré (Node, portable récent)
      const its = { fast: 90, std: 150, fine: 220 }[sv.acc], sec = Math.max(1, Math.round(work * its / 1000 * 1.5));
      sv.estMb = mb;
      return `Arbre : ${fr(est.acts, 0)} nœuds de décision · ${N[0]} et ${N[1]} combos · mémoire ≈ ${fr(mb, 0)} Mo · durée estimée ≈ ${sec < 60 ? sec + ' s' : Math.round(sec / 60) + ' min'}${est.approx ? ' · <strong>flop approché</strong> (échantillon de tirages)' : ''}${mb > 700 ? ' · <strong style="color:var(--bad)">trop gros : réduis les tailles</strong>' : ''}${cfg.board.length === 3 && SAMPLES[sv.sample].exact && mb > EXACT_MB ? ` · <strong style="color:var(--bad)">flop exact refusé au-delà de ${EXACT_MB} Mo : réduis les tailles ou choisis Fin</strong>` : ''}`;
    } catch (e) { sv.estMb = 0; return esc(e.message); }
  }
  function start() {
    try {
      const cfg = buildCfg();
      estimateText(); if (sv.estMb > 700) throw new Error('Arbre trop gros pour le navigateur : choisis des tailles « Rapide » ou un board plus avancé (turn, river).');
      if (cfg.board.length === 3 && SAMPLES[sv.sample].exact && sv.estMb > EXACT_MB) throw new Error(`Flop exact : l'arbre dépasse ${EXACT_MB} Mo. Réduis les tailles (préréglage Rapide) ou choisis le tirage Fin.`);
      // Avec des verrous conservés, on désactive l'isomorphisme : un verrou posé sur une carte ne doit pas s'appliquer à ses cartes symétriques.
      sv.game = PF.create({ ...cfg, iso: !(sv.keepLocks && sv.locks?.length) });
      stabStop(); sv.stabCfg = cfg.sample ? cfg : null; sv.prof = null; sv.profBase = null; sv.profRes = ''; sv.profTarget = 0; if (sv.simp?.job) try { sv.simp.job.free(); } catch (e) { /* libéré */ } sv.simp = null;
      if (!sv.keepLocks) { sv.locks = []; sv.play = null; sv.lockRes = null; sv.lockBase = null; } sv.keepLocks = false;
      for (const l of sv.locks || []) { try { sv.game.lock(l.path, l.strat); } catch (e) { /* chemin absent */ } }
      sv.err = ''; sv.path = []; sv.info = null; sv.ex = null; sv.cell = null; sv.running = true; sv.t0 = performance.now(); sv.elapsed = 0; sv.lastEx = 0;
      sv.heroCombo = parseHero();
      render(); setTimeout(chunk, 30);
    } catch (e) { sv.err = e.message; sv.running = false; render(); }
  }
  function parseHero() {
    const c = E.parseCards(sv.hero || ''); return c.length === 2 && c[0] !== c[1] ? c : null;
  }
  function chunk() {
    if (!sv.running || !sv.game) return;
    const g = sv.game, t0 = performance.now();
    do g.iterate(1); while (performance.now() - t0 < 110);
    sv.elapsed = (performance.now() - sv.t0) / 1000;
    const it = g.stats().iterations, target = ACC[sv.acc].pct;
    if (it - sv.lastEx >= Math.max(10, Math.round(it * 0.15)) || sv.elapsed > sv.maxSec) { sv.ex = g.exploitability(); sv.lastEx = it; }
    // Avec un verrou, le joueur verrouillé ne s'adapte plus : l'exploitabilité ne descend pas, on s'arrête au nombre d'itérations du solve d'équilibre.
    const done = sv.profTarget ? it >= sv.profTarget || sv.elapsed > sv.maxSec : sv.locks?.length ? it >= Math.max(150, sv.baseIts || 200) || sv.elapsed > sv.maxSec : (sv.ex && sv.ex.pct <= target) || sv.elapsed > sv.maxSec;
    const pr = $('#svprog');
    if (pr) pr.innerHTML = progressHTML();
    if (done) { if (!sv.ex || sv.lastEx !== it) sv.ex = g.exploitability(); finish(); return; }
    setTimeout(chunk, 0);
  }
  function finish() {
    sv.running = false;
    if (sv.profTarget) { sv.profTarget = 0; profReport(); refreshInfo(); render(); return; }
    if (!sv.locks?.length && !sv.prof) sv.baseIts = sv.game.stats().iterations;
    state.progress.solves = (state.progress.solves || 0) + 1; X.award?.('solve', null, true); X.Store.save('progress');
    if (sv.target) { try { sv.path = sv.target.seq ? pathFor(sv.game, sv.target.seq) : (sv.target.path || []).slice(); } catch (e) { sv.path = []; } }
    lockReport(); refreshInfo(); stabStart(); render();
  }
  // ---- Profils de joueurs appliqués à tout l'arbre (exploitation) ----
  const PROFS = { gto: { label: 'Équilibre', pr: null }, station: { label: 'Calling station', pr: { fp: 0.4, ap: 0.3 }, note: 'se couche 40 % moins, mise et relance 30 % moins' }, nit: { label: 'Nit', pr: { pf: 0.3, ap: 0.3 }, note: 'paie 30 % moins face aux mises, mise 30 % moins' }, maniaque: { label: 'Maniaque', pr: { pa: 0.35, fp: 0.2 }, note: 'check et paie 35 % moins (au profit de mises et relances), se couche 20 % moins' } };
  function profHTML() {
    const g = sv.game; if (!g || sv.running) return '';
    const cur = sv.prof || { p: -1, id: 'gto' };
    const row = (p) => `<div class="row"><span class="note">${nm(p)} joue comme :</span>${Object.entries(PROFS).map(([k, v]) => `<button class="chip" data-act="svprof" data-p="${p}" data-v="${k}" aria-pressed="${(cur.p === p && cur.id === k) || (k === 'gto' && cur.p !== p)}">${esc(v.label)}</button>`).join('')}</div>`;
    return `<section class="panel"><h2>Exploiter un profil</h2><p class="note">La stratégie d'équilibre du joueur choisi est déformée sur tout l'arbre (un seul profil à la fois), puis l'autre joueur recalcule sa meilleure réponse. Les verrous manuels restent prioritaires.</p>${row(0)}${row(1)}
      ${sv.profRes ? `<p>${sv.profRes}</p>` : ''}</section>`;
  }
  ACT.svprof = (t) => {
    const g = sv.game; if (!g || sv.running) return;
    const p = +t.dataset.p, id = t.dataset.v, P = PROFS[id];
    if (!sv.profBase) sv.profBase = g.info([]).evMean.slice();
    if (sv.prof && sv.prof.p !== p) g.applyProfile(sv.prof.p, null);
    const k = g.applyProfile(p, P.pr);
    sv.prof = P.pr ? { p, id, k } : null; sv.profRes = '';
    sv.profTarget = g.stats().iterations + Math.max(120, Math.round((sv.baseIts || 200) * 0.6));
    sv.running = true; sv.t0 = performance.now(); sv.elapsed = 0; render(); setTimeout(chunk, 30);
  };
  function profReport() {
    const g = sv.game, r = g.info([]), b = sv.profBase; if (!b) return;
    if (!sv.prof) { sv.profRes = 'Retour à l\'équilibre.'; sv.profBase = null; return; }
    const p = sv.prof.p, o = 1 - p, P = PROFS[sv.prof.id], gain = r.evMean[o] - b[o];
    sv.profRes = `<strong>${nm(p)} en ${esc(P.label.toLowerCase())}</strong> (${esc(P.note)}, ${sv.prof.k} nœuds) : ${nm(o)} gagne ${gain >= 0 ? '+' : '−'}${fr(Math.abs(gain), 2)} bb sur le spot (${fr(Math.abs(gain) / g.P0 * 100, 1)} % du pot de départ) en s'adaptant. Navigue dans l'arbre : les nœuds de ${nm(o)} montrent sa meilleure réponse.`;
  }
  // ---- Simplification : une seule taille de mise sur la rue du spot, coût en EV ----
  // Le joueur choisi ne garde qu'une taille (l'autre joueur garde tout et s'adapte) ; second solve sur un autre fil, même précision.
  function simpOptions() {
    const g = sv.game; if (!g) return [];
    const st = ST[g.board.length - 3], out = [];
    for (let p = 0; p < 2; p++) { const L = String(g.cfg.sizes?.[st]?.[p]?.bet ?? '').split(/[\s,]+/).filter(Boolean); if (L.length >= 2) out.push({ p, st, sizes: L }); }
    return out;
  }
  function simpHTML() {
    const opts = simpOptions(); if (!opts.length || sv.running) return '';
    const S = sv.simp;
    let res = '';
    if (S && S.state === 'run') res = `<p class="note">Solve simplifié en cours (${nm(S.p)} : ${S.size === 'a' ? 'tapis' : S.size + ' %'} seulement)…</p>`;
    else if (S && S.state === 'done') {
      const full = sv.game.info([]).evMean, d = full[S.p] - S.ev[S.p];
      res = `<p><strong>${nm(S.p)} avec une seule taille (${S.size === 'a' ? 'tapis' : S.size + ' %'})</strong> : ${d <= 0.005 ? 'aucun coût mesurable' : `coût ${fr(d, 2)} bb, soit ${fr((d / sv.game.P0) * 100, 2)} % du pot de départ`} (EV ${fr(S.ev[S.p], 2)} bb contre ${fr(full[S.p], 2)} bb avec toutes les tailles ; exploitabilité du solve simplifié ${fr(S.ex, 2)} %). Racine : ${S.root.acts.map((a, k) => `${esc(a.label.toLowerCase())} ${pct(S.root.freq[k], 0)}`).join(' · ')}.</p>
        <p class="note">${d < 0.02 * sv.game.P0 ? 'Moins de 2 % du pot : la stratégie à une taille est une simplification raisonnable pour jouer.' : 'Coût notable : la seconde taille sert vraiment ici.'}</p>`;
    } else if (S && S.state === 'error') res = '<p class="note">Solve simplifié impossible.</p>';
    return `<section class="panel"><h2>Simplifier : une seule taille</h2><p class="note">Combien coûte de ne garder qu'une taille de mise sur cette rue ? L'adversaire garde ses options et s'adapte.</p>
      ${opts.map((o) => `<div class="row"><span class="note">${nm(o.p)} :</span>${o.sizes.map((z) => `<button class="chip" data-act="svsimp" data-p="${o.p}" data-v="${esc(z)}" aria-pressed="${S && S.p === o.p && S.size === z}">${z === 'a' ? 'Tapis seulement' : esc(z) + ' % seulement'}</button>`).join('')}</div>`).join('')}${res}</section>`;
  }
  ACT.svsimp = (t) => {
    const g = sv.game; if (!g || !window.PFPool) return;
    const p = +t.dataset.p, size = t.dataset.v, st = ST[g.board.length - 3];
    if (sv.simp?.job) try { sv.simp.job.free(); } catch (e) { /* déjà libéré */ }
    const sizes = JSON.parse(JSON.stringify(g.cfg.sizes)); sizes[st][p].bet = size;
    const cfg = { ...g.cfg, sizes, ranges: g.cfg.ranges, profiles: null }, job = window.PFPool.solve(cfg, { pct: ACC[sv.acc].pct, maxMs: Math.min(240000, Math.max(20000, sv.elapsed * 1500)) });
    const S = sv.simp = { p, size, job, state: 'run' }; render();
    job.ready.then(() => job.node([], {})).then((n) => { if (sv.simp !== S) return; S.state = 'done'; S.ev = n.evMean; S.ex = job.ex; S.root = { acts: n.acts, freq: n.freq }; if (X.svSub() === 'solve') render(); }).catch(() => { if (sv.simp === S) { S.state = 'error'; render(); } });
  };
  // ---- Bibliothèque de flops résolus hors ligne : réponse instantanée pour les scénarios standards ----
  const PERM4 = []; (function gen(a, l) { if (!l.length) { PERM4.push(a); return; } l.forEach((x, i) => gen([...a, x], l.filter((_, j) => j !== i))); })([], [0, 1, 2, 3]);
  const canonFlop = (cards) => PERM4.map((sg) => cards.map((c) => (c & ~3) | sg[c & 3]).sort((a, b) => b - a).join('.')).sort()[0];
  const suitPat = (cards) => { const n = new Set(cards.map((c) => c & 3)).size; return n === 1 ? 'mono' : n === 2 ? 'bi' : 'rainbow'; };
  const pairPat = (cards) => new Set(cards.map((c) => c >> 2)).size;
  let libIdx = null;
  function libFind(scen, cards) {
    const L = window.FlopLibrary; if (!L || cards.length !== 3) return null;
    if (!libIdx) libIdx = new Map((L.scenarios || []).map((x) => [x.id, x.flops.map((f) => { const c = E.parseCards(f.b); return { f, c, canon: canonFlop(c), sp: suitPat(c), pp: pairPat(c), r: c.map((y) => y >> 2).sort((a, b) => b - a) }; })]));
    const list = libIdx.get(scen); if (!list?.length) return null;
    const cn = canonFlop(cards), exact = list.find((x) => x.canon === cn); if (exact) return { ...exact, exact: true };
    // Sinon : même structure de couleurs et d'appariement, hauteurs les plus proches (la plus haute carte compte double).
    const r = cards.map((y) => y >> 2).sort((a, b) => b - a), sp = suitPat(cards), pp = pairPat(cards);
    let best = null, bd = Infinity;
    for (const x of list) { if (x.sp !== sp || x.pp !== pp) continue; const d = 2 * Math.abs(x.r[0] - r[0]) + Math.abs(x.r[1] - r[1]) + Math.abs(x.r[2] - r[2]); if (d < bd) { bd = d; best = x; } }
    if (best) return { ...best, exact: false, dist: bd };
    // Aucune texture identique résolue (scénario encore partiel) : flop le plus proche avec pénalité de texture, signalé comme tel.
    const SPD = { mono: { bi: 6, rainbow: 10 }, bi: { mono: 6, rainbow: 4 }, rainbow: { mono: 10, bi: 4 } };
    for (const x of list) { const d = 2 * Math.abs(x.r[0] - r[0]) + Math.abs(x.r[1] - r[1]) + Math.abs(x.r[2] - r[2]) + (x.sp === sp ? 0 : SPD[sp][x.sp]) + (x.pp === pp ? 0 : 8); if (d < bd) { bd = d; best = x; } }
    return best ? { ...best, exact: false, relaxed: true, dist: bd } : null;
  }
  const LIBK = { x: 'x', c: 'x', f: 'f', a: 'a' };
  function libGrid(n, alph) {
    const A = n.act.length, val = (a, i) => { const ch = n.s[a][i]; return ch === '.' ? null : alph.indexOf(ch) / 63; };
    const bets = n.k.map((k, a) => [k, a]).filter(([k]) => k === 'b' || k === 'r'), cls = n.k.map((k, a) => LIBK[k] || 'b' + Math.min(3, 1 + bets.findIndex(([, j]) => j === a) + (bets.length === 1 ? 1 : 0)));
    const tot = new Array(A).fill(0); let W = 0;
    const html = grid169((h) => { const i = E.ALL169.indexOf(h), f = n.act.map((_, a) => val(a, i)); if (f[0] === null) return `<span class="rc" title="${h} : absente">${h}</span>`; const w = E.combos(h).length; W += w; f.forEach((v, a) => (tot[a] += w * v)); return `<span class="rc" style="background:${grad(f.map((v, a) => [cls[a], v]))}" title="${h} : ${n.act.map((l, a) => `${l} ${Math.round(f[a] * 100)} %`).join(', ')}">${h}</span>`; });
    return { html, freq: tot.map((t) => t / (W || 1)), cls };
  }
  function libHTML() {
    const cards = E.parseCards(sv.board), sc = SCEN.find((x) => x.id === sv.scen); if (cards.length !== 3 || !sc) return '';
    const L = window.FlopLibrary, m = libFind(sv.scen, cards); if (!m) return '';
    const [o, i] = seatsOf(sc), dflt = sv.r[0] === o[1] && sv.r[1] === i[1];
    const which = sv.libNode === 'n2' ? 'n2' : 'n1', n = m.f[which], G = libGrid(n, L.alph);
    const sc0 = L.scenarios.find((x) => x.id === sv.scen);
    const title = which === 'n1' ? (sc0.actor === 'ip' ? `${sv.names[1]} après le check` : `${sv.names[0]} premier à parler`) : 'Réponse à la petite mise';
    return `<details class="panel" ${sv.libOpen !== false ? 'open' : ''}><summary data-act="svlibtog"><strong>Bibliothèque : réponse immédiate</strong> <span class="note">${m.exact ? 'flop identique (à l\'isomorphisme de couleurs près)' : `flop le plus proche : <span class="mono">${esc(m.f.b)}</span>, ${m.relaxed ? '<strong>texture différente</strong>' : 'même texture'}`}</span></summary>
      <p class="note">Solve hors ligne (tirages ${esc(sc0.sample)}, exploitabilité ${fr(m.f.ex, 2)} % du pot), ranges et tailles par défaut du scénario : flop 33 % et 75 %, turn et river à 75 %.${dflt ? '' : ' <strong>Tes ranges diffèrent des ranges par défaut : lance un solve pour ton spot exact.</strong>'}${m.exact ? '' : m.relaxed ? ' Aucun flop de cette texture n\'est encore résolu pour ce scénario : tendance très approximative, lance un solve pour ton flop.' : ' Flop voisin : à lire comme une tendance.'}</p>
      <div class="row"><button class="chip" data-act="svlibn" data-v="n1" aria-pressed="${which === 'n1'}">${esc(sc0.actor === 'ip' ? 'Après le check' : 'Premier à parler')}</button><button class="chip" data-act="svlibn" data-v="n2" aria-pressed="${which === 'n2'}">Réponse à la petite mise</button></div>
      <p class="note"><strong>${esc(title)}</strong> : ${n.act.map((l, a) => `<i class="mini-sw" style="background:var(--act-${G.cls[a]})"></i> ${esc(l)} ${pct(G.freq[a], 0)}`).join(' · ')}</p>
      ${G.html}</details>`;
  }
  ACT.svlibn = (t) => { sv.libNode = t.dataset.v; render(); };
  ACT.svlibtog = (t, e) => { e?.preventDefault?.(); sv.libOpen = sv.libOpen === false; render(); };
  // ---- Stabilité d'un flop échantillonné : second solve indépendant (autre tirage de turns et rivers) sur un autre fil ----
  // L'exploitabilité affichée est mesurée dans l'arbre échantillonné ; l'écart entre deux tirages mesure l'erreur due à l'échantillon.
  function stabStop() { if (sv.stab?.job) try { sv.stab.job.free(); } catch (e) { /* déjà libéré */ } sv.stab = null; }
  function stabStart() {
    if (!sv.stabCfg || sv.locks?.length || !window.PFPool) return;
    const cfg = { ...sv.stabCfg, seed: 1009 }, job = window.PFPool.solve(cfg, { pct: ACC[sv.acc].pct, maxMs: Math.min(240000, Math.max(20000, sv.elapsed * 1500)) });
    sv.stab = { job, state: 'run', cache: new Map() };
    job.ready.then(() => { if (sv.stab?.job === job) { sv.stab.state = 'done'; sv.stab.ex = job.ex; if (X.svSub() === 'solve') render(); } }).catch(() => { if (sv.stab?.job === job) sv.stab.state = 'error'; });
  }
  // Chemin restreint aux nœuds du flop (avant la première carte) : seul endroit où les deux tirages ont le même arbre.
  const flopPath = () => { const g = sv.game; let node = g.root; for (const x of sv.path) { if (node.t !== PF.ACT) return null; node = node.ch[x]; } return node.t === PF.ACT ? sv.path : null; };
  function stabHTML(r) {
    const st = sv.stab; if (!st || !sv.game.stats().approx) return '';
    if (st.state === 'run') return '<p class="note">Contrôle de stabilité : second tirage de turns et rivers en cours sur un autre fil…</p>';
    if (st.state !== 'done') return '';
    const fp = flopPath(); if (!fp) return '<p class="note">Contrôle de stabilité : disponible sur les nœuds du flop.</p>';
    const k = fp.join(','), c = st.cache.get(k);
    if (!c) { st.cache.set(k, { wait: true }); st.job.node(fp, {}).then((n) => { st.cache.set(k, n); if (X.svSub() === 'solve') render(); }).catch(() => st.cache.set(k, { err: true })); return '<p class="note">Contrôle de stabilité : lecture du second tirage…</p>'; }
    if (c.wait || c.err || !c.freq) return '';
    const d = Math.max(...r.freq.map((f, a) => Math.abs(f - (c.freq[a] ?? 0)))), avg = r.freq.map((f, a) => (f + (c.freq[a] ?? 0)) / 2);
    const verdict = d <= 0.03 ? ['good', 'stable'] : d <= 0.07 ? ['warn', 'à lire en tendance'] : ['bad', 'instable : choisis Fin ou Exact'];
    return `<p class="note"><span class="pill ${verdict[0]}">Stabilité : ${verdict[1]}</span> second tirage indépendant (exploitabilité ${fr(st.ex ?? 0, 2)} %) : écart maximal ${fr(d * 100, 1)} points sur les fréquences de ce nœud. Moyenne des deux tirages : ${r.node.acts.map((_, a) => `${esc(sv.game.label(r.node, a).toLowerCase())} ${pct(avg[a], 0)}`).join(' · ')}.</p>`;
  }
  function refreshInfo() { if (!sv.game) return; try { sv.info = sv.game.info(sv.path); } catch (e) { sv.path = []; sv.info = sv.game.info([]); } }
  const progressHTML = () => {
    const g = sv.game; if (!g) return '';
    const st = g.stats(), target = ACC[sv.acc].pct, ex = sv.ex ? sv.ex.pct : null;
    const prog = ex === null ? 0.05 : Math.max(0.05, Math.min(1, Math.log(Math.max(ex, target) / 40) / Math.log(target / 40)));
    return `<div class="row" style="justify-content:space-between"><span class="eyebrow">${sv.running ? 'Résolution en cours' : 'Résolu'}</span><span class="note mono">${st.iterations} itérations · ${fr(sv.elapsed, 1)} s${ex !== null ? ` · exploitabilité ${fr(ex, 2)} % du pot` : ''}</span></div>
      <div class="pbar" aria-hidden="true"><i style="width:${Math.round(prog * 100)}%"></i></div>`;
  };

  // ---------------- Vue ----------------
  const SUBS = [['solve', 'Résoudre un spot'], ['preflop', 'Préflop'], ['agg', 'Rapport agrégé'], ['three', 'À trois joueurs'], ['plo', 'PLO'], ['train', 'Entraîneur'], ['help', 'Mode d\'emploi']];
  VIEWS.solveur = () => head('Solveur', 'Calcule l\'équilibre (GTO) d\'un spot à deux joueurs après le flop : quelle action, à quelle fréquence, avec quelle main. Outil d\'étude hors table : l\'utiliser pendant une main en cours est de l\'aide en temps réel, interdite par toutes les rooms.') +
    `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${sv.sub === k}" data-act="svsub" data-s="${k}">${l}</button>`).join('')}</div>` +
    (sv.sub === 'solve' ? solveHTML() : sv.sub === 'preflop' ? preflopHTML() : sv.sub === 'plo' ? X.ploHTML() : sv.sub === 'three' ? X.threeHTML() : sv.sub === 'agg' ? aggHTML() : sv.sub === 'train' ? X.trainerHTML() : helpHTML());
  ACT.svsub = (t) => { sv.sub = t.dataset.s; render(); };
  X.svSub = () => sv.sub;

  function rangeStat(txt) {
    try { const h = Array.isArray(txt) ? txt : PF.parseWeighted(txt); const w = h.reduce((a, x) => a + x[2], 0); return `${fr(w, w % 1 ? 1 : 0)} combos · ${fr(w / 1326 * 100, 1)} %`; } catch (e) { return `<span style="color:var(--bad)">${esc(e.message)}</span>`; }
  }
  function solveHTML() {
    const sc = SCEN.find((s) => s.id === sv.scen), g = sv.game;
    const scOpts = SCTYPES.map((t) => `<optgroup label="${t}">${SCEN.filter((s) => s.type === t).map((s) => `<option value="${s.id}"${s.id === sv.scen ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</optgroup>`).join('') + `<option value="custom"${!sc ? ' selected' : ''}>Personnalisé / main importée</option>`;
    const sizeRows = ST.map((st) => `<tr><th>${st}</th>${[0, 1].map((p) => `<td><input class="mono" data-svsz="${st}.${p}.bet" value="${esc(sv.sizes[st][p].bet)}" aria-label="Mises ${st} ${sv.names[p]}" placeholder="aucune"></td><td><input class="mono" data-svsz="${st}.${p}.raise" value="${esc(sv.sizes[st][p].raise)}" aria-label="Relances ${st} ${sv.names[p]}" placeholder="aucune"></td>`).join('')}</tr>`).join('');
    const setup = `<section class="panel">
      <div class="form">
        <label class="f" style="grid-column:1/-1">Scénario préflop<select data-svf="scen">${scOpts}</select></label>
        <label class="f">Board (flop, turn ou river)<input data-svf="board" value="${esc(sv.board)}" spellcheck="false" autocomplete="off" placeholder="Ks7d2c"></label>
        <label class="f">Pot au début de la rue (bb)<input data-svf="pot" inputmode="decimal" value="${esc(sv.pot)}"></label>
        <label class="f">Tapis effectif restant (bb)<input data-svf="stack" inputmode="decimal" value="${esc(sv.stack)}"></label>
        <label class="f">Rake (% du pot, 0 = sans)<input data-svf="rakePct" inputmode="decimal" value="${esc(sv.rakePct ?? '0')}"></label>
        <label class="f">Plafond du rake (bb)<input data-svf="rakeCap" inputmode="decimal" value="${esc(sv.rakeCap ?? '3')}"></label>
        ${sv.icmOn ? `<label class="f">ICM : tapis des autres joueurs (bb)<input class="mono" data-svf="icmOthers" value="${esc(sv.icmOthers ?? '')}" placeholder="12 8 5" spellcheck="false"></label>
        <label class="f">ICM : prix (1er, 2e, …)<input class="mono" data-svf="icmPay" value="${esc(sv.icmPay ?? '50 30 20')}" placeholder="50 30 20" spellcheck="false"></label>
        <label class="f">ICM : tapis derrière ${esc(sv.names[0])} / ${esc(sv.names[1])} (bb, vide = tapis effectif)<input class="mono" data-svf="icmOwn" value="${esc(sv.icmOwn ?? '')}" placeholder="25 40" spellcheck="false"></label>` : ''}
        <label class="f">Ta main (facultatif)<input data-svf="hero" value="${esc(sv.hero)}" placeholder="AhKd" spellcheck="false" autocomplete="off"></label>
      </div>
      <div class="row"><button class="btn small" data-act="svrand" data-n="3">Flop au hasard</button><button class="btn small" data-act="svrand" data-n="4">Turn au hasard</button><button class="btn small" data-act="svrand" data-n="5">River au hasard</button></div>
      ${[0, 1].map((p) => `<label class="f">Range ${p ? 'IP (parle en dernier)' : 'OOP (parle en premier)'} · ${esc(sv.names[p])} · <span class="mono">${rangeStat(sv.r[p])}</span>
        <textarea class="mono" rows="${sv.r[p].length > 400 ? 5 : 2}" data-svr="${p}" spellcheck="false" style="font-size:13px">${esc(sv.r[p])}</textarea></label>
        <div class="row"><button class="btn small" data-act="svpaint" data-p="${p}" aria-pressed="${sv.paint === p}">${sv.paint === p ? 'Fermer la grille' : 'Modifier sur la grille'}</button><span class="note">Poids : <span class="mono">KK:0.5</span> ou <span class="mono">AKs:25%</span> ; combos exacts : <span class="mono">AhKh</span></span></div>
        ${sv.paint === p ? painterHTML(p) : ''}`).join('')}
      ${sv.note ? `<p class="note" style="color:var(--warn)">${esc(sv.note)}</p>` : ''}
      <div class="row"><span class="note">Tailles :</span>${Object.entries(PRESETS).map(([k, v]) => `<button class="chip" aria-pressed="${sv.preset === k}" data-act="svpreset" data-v="${k}" title="${v.note}">${v.label}</button>`).join('')}<button class="btn small" data-act="svsizes">${sv.showSizes ? 'Masquer le détail' : 'Détail des tailles'}</button></div>
      ${sv.showSizes ? `<div class="tw"><table class="t sizes"><thead><tr><th>Rue</th><th>Mises ${esc(sv.names[0])}</th><th>Relances ${esc(sv.names[0])}</th><th>Mises ${esc(sv.names[1])}</th><th>Relances ${esc(sv.names[1])}</th></tr></thead><tbody>${sizeRows}</tbody></table></div>
        ${E.parseCards(sv.board).length === 3 ? '<p class="note">Solve depuis le flop : turn et river réduits à une mise de 75 % sans relance pour tenir dans le navigateur. Pour le détail d\'un turn, résous le flop puis « Re-résoudre exactement d\'ici ».</p>' : ''}
        <p class="note">En % du pot, séparées par des espaces ; <span class="mono">a</span> = tapis. Une relance de 60 % = relancer de 60 % du pot après avoir payé. Relances maximum par rue : <input class="mono" data-svf="maxRaises" value="${sv.maxRaises}" style="width:3em" aria-label="Relances maximum par rue">. Une mise qui engage plus de 67 % du tapis restant devient un tapis.</p>` : ''}
      <div class="row"><span class="note">Format :</span><button class="chip" data-act="svicm" aria-pressed="${!sv.icmOn}" data-v="0">Jetons (cash)</button><button class="chip" data-act="svicm" aria-pressed="${!!sv.icmOn}" data-v="1">Tournoi (ICM)</button></div>
      <div class="row"><span class="note">Précision :</span>${Object.entries(ACC).map(([k, v]) => `<button class="chip" aria-pressed="${sv.acc === k}" data-act="svacc" data-v="${k}">${v.label}</button>`).join('')}</div>
      ${E.parseCards(sv.board).length === 3 ? `<div class="row"><span class="note">Tirages du flop :</span>${Object.entries(SAMPLES).map(([k, v]) => `<button class="chip" aria-pressed="${sv.sample === k}" data-act="svsample" data-v="${k}">${v.label}</button>`).join('')}</div>` : ''}
      <p class="note" id="svest">${estimateText()}</p>
      ${sv.err ? `<p class="pill bad" style="white-space:normal">${esc(sv.err)}</p>` : ''}
      <div class="row">${sv.running ? '<button class="btn" data-act="svstop">Arrêter et voir le résultat</button>' : '<button class="btn primary" data-act="svgo">Résoudre</button>'}${g && !sv.running ? '<button class="btn small" data-act="svreset">Nouveau spot</button>' : ''}</div>
    </section>`;
    const prog = g ? `<section class="panel" id="svprog">${progressHTML()}</section>` : '';
    return (g && !sv.running && sv.info ? resultHTML() + prog + `<details class="panel"${sv.setupOpen ? ' open' : ''}><summary data-act="svsetup"><strong>Modifier le spot</strong></summary>${setup}</details>` : setup + (sv.running ? '' : libHTML()) + prog);
  }

  // Peintre de range sur la grille 13 × 13 (poids par classe de mains).
  function classWeights(p) {
    let h = []; try { h = PF.parseWeighted(sv.r[p]); } catch (e) { /* range illisible : grille vide */ }
    const m = new Map(); for (const [a, b, w] of h) { const k = E.abstractOf(a, b), x = m.get(k) || [0, 0]; x[0] += w; x[1]++; m.set(k, x); }
    const out = new Map(); for (const [k, [s]] of m) out.set(k, s / E.combos(k).length); return out;
  }
  function painterHTML(p) {
    const w = classWeights(p);
    return `<div class="painter"><div class="row"><span class="note">Pinceau :</span>${[1, 0.75, 0.5, 0.25, 0].map((b) => `<button class="chip" aria-pressed="${sv.brush === b}" data-act="svbrush" data-v="${b}">${b ? Math.round(b * 100) + ' %' : 'Gomme'}</button>`).join('')}<button class="btn small" data-act="svclear" data-p="${p}">Vider</button></div>
      ${grid169((h) => { const f = w.get(h) || 0; return `<button class="rc${f ? ' on' : ''}" data-act="svcell" data-p="${p}" data-h="${h}" ${f && f < 1 ? `style="background:color-mix(in srgb, var(--accent) ${Math.round(30 + 70 * f)}%, var(--sunk))"` : ''} title="${h} : ${Math.round(f * 100)} %">${h}</button>`; })}</div>`;
  }
  function setClassWeight(p, h, wt) {
    const w = classWeights(p); if (wt > 0) w.set(h, wt); else w.delete(h);
    const toks = []; for (const k of E.ALL169) if (w.has(k)) { const x = w.get(k); toks.push(x >= 0.999 ? k : `${k}:${+x.toFixed(3)}`); }
    sv.r[p] = toks.join(', ');
  }

  // ---------------- Résultats ----------------
  const nm = (p) => esc(sv.names[p]);
  function crumbs() {
    const g = sv.game; let node = g.root; const out = [`<button class="chip" data-act="svpath" data-k="0">${cardsHTML(g.board.slice(0, 3), true).replace('class="cards"', 'class="cards mini"')}${g.board.length > 3 ? ' ' + g.board.slice(3).map((c) => cardHTML(c, true)).join('') : ''}</button>`];
    sv.path.forEach((x, i) => {
      let txt;
      if (node.t === PF.ACT) { txt = `${nm(node.p)} : ${esc(g.label(node, x))}`; node = node.ch[x]; }
      else if (node.t === PF.CHANCE) { txt = `${node.board.length === 3 ? 'Turn' : 'River'} ${cardHTML(x, true)}`; node = node.ch[node.cards.indexOf(x)]; }
      out.push(`<button class="chip" data-act="svpath" data-k="${i + 1}">${txt}</button>`);
    });
    return `<div class="crumbs">${out.join('<span aria-hidden="true">›</span>')}</div>`;
  }
  function resultHTML() {
    const g = sv.game, r = sv.info, node = r.node, st = g.stats();
    const smp = g.cfg.sample || {};
    const approx = st.approx ? `<p class="note" style="color:var(--warn)">Flop approché : turns et rivers échantillonnés (${smp.turn} × ${smp.river}${g.sym ? ', cartes symétriques couvertes en plus' : ''}). L'exploitabilité est mesurée dans cet échantillon. Pour un turn ou une river précis, utilise « Re-résoudre exactement d'ici ».</p>${node.t === PF.ACT ? stabHTML(r) : ''}` : '';
    const top = `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">${r.board.length === 3 ? 'Flop' : r.board.length === 4 ? 'Turn' : 'River'} · pot ${fr(r.pot, 1)} bb · tapis ${fr(g.S - Math.max(r.C[0], r.C[1]), 1)} bb</span><span class="note mono">exploitabilité ${sv.ex ? fr(sv.ex.pct, 2) : '?'} % du pot</span></div>
      ${crumbs()}
      <div class="felt"><div class="row" style="justify-content:center;gap:16px">${cardsHTML(r.board)}</div>
      <div class="stats svs">${[0, 1].map((p) => `<div class="stat${node.t === PF.ACT && node.p === p ? ' hero' : ''}"><span>${nm(p)} · ${p ? 'IP' : 'OOP'}</span><b>${isFinite(r.eqMean[p]) ? pct(r.eqMean[p], 1) : '–'}</b><span>équité · EV ${isFinite(r.evMean[p]) ? fr(r.evMean[p], 2) + (g.icm ? ' bb ICM' : ' bb') : '–'}</span></div>`).join('')}</div></div>${approx}${g.icm ? `<p class="note">Tournoi : les gains sont des variations d'équité ICM (Malmuth-Harville) converties en bb équivalents (1 bb ICM = ${fr(1 / g.icm.K, 3)} unité de prix), comptées depuis l'issue où ${nm(0)} ou ${nm(1)} abandonne le pot. La somme des EV n'est plus égale au pot : une partie de l'équité part vers les autres joueurs.</p>` : ''}</section>`;
    let body = '';
    if (node.t === PF.ACT) body = actHTML(r);
    else if (node.t === PF.CHANCE) body = chanceHTML(node);
    else body = `<section class="panel"><h2>${node.t === PF.FOLD ? `${nm(1 - node.winner)} se couche : ${nm(node.winner)} remporte le pot` : 'Abattage'}</h2><p>Fin de la branche. Pot final ${fr(r.pot, 1)} bb. Reviens en arrière avec le fil d'Ariane.</p></section>`;
    return top + body + profHTML() + simpHTML();
  }
  function chanceHTML(node) {
    const g = sv.game, full = node.cards.length === 52 - node.board.length;
    const cell = (c) => `<button class="cardpick" data-act="svcard" data-c="${c}" aria-label="${E.cardStr(c)}">${cardHTML(c, true)}</button>`;
    const bySuit = [3, 2, 1, 0].map((s) => node.cards.filter((c) => (c & 3) === s).sort((a, b) => b - a));
    return `<section class="panel"><h2>Choisis la ${node.board.length === 3 ? 'turn' : 'river'}</h2>${full ? '' : `<p class="note">Solve approché : seules ${node.cards.length} cartes ont été calculées (échantillon représentatif de rangs et de couleurs).</p>`}
      ${bySuit.map((l) => l.length ? `<div class="cards picks">${l.map(cell).join('')}</div>` : '').join('')}
      ${g.cfg.include ? `<p class="note">Carte réelle de la main : ${g.cfg.include.filter((c) => node.cards.includes(c)).map((c) => cardHTML(c, true)).join(' ')}</p>` : ''}</section>`;
  }
  function actHTML(r) {
    const g = sv.game, node = r.node, p = node.p, n = g.N[p], A = node.acts.length, cls = actClasses(node), hands = g.hands[p], reach = r.reach[p];
    // Agrégat par classe de mains.
    const agg = new Map();
    for (let i = 0; i < n; i++) {
      const h = E.abstractOf(hands[i][0], hands[i][1]); let x = agg.get(h); if (!x) agg.set(h, x = { m: 0, f: new Array(A).fill(0), eq: 0, ev: 0, n: 0 });
      x.n++; const w = reach[i]; if (w <= 0) continue; x.m += w;
      for (let a = 0; a < A; a++) x.f[a] += w * r.strategy[a * n + i];
      if (isFinite(r.eq[p][i])) x.eq += w * r.eq[p][i]; if (isFinite(r.ev[p][i])) x.ev += w * r.ev[p][i];
    }
    const totalMass = reach.reduce((a, b) => a + b, 0);
    let evMin = Infinity, evMax = -Infinity; for (const x of agg.values()) if (x.m > 0) { const v = x.ev / x.m; evMin = Math.min(evMin, v); evMax = Math.max(evMax, v); }
    const cellHTML = (h) => {
      const x = agg.get(h), on = x && x.m > 1e-9, full = E.combos(h).length;
      if (!on) return `<button class="rc sv off" data-act="svhand" data-h="${h}" disabled>${h}</button>`;
      let bg, light = false;
      if (sv.view === 'strat') bg = grad(node.acts.map((_, a) => [cls[a], x.f[a] / x.m]));
      else if (sv.view === 'eq') { const v = x.eq / x.m; bg = `color-mix(in srgb, var(--act-x) ${Math.round(v * 100)}%, var(--act-f))`; }
      else { const v = (x.ev / x.m - evMin) / Math.max(1e-9, evMax - evMin); bg = `color-mix(in srgb, var(--accent) ${Math.round(15 + v * 85)}%, var(--sunk))`; light = v < 0.45; }
      const op = Math.max(0.35, Math.min(1, x.m / full));
      return `<button class="rc sv${sv.cell === h ? ' sel' : ''}${light ? ' lt' : ''}" data-act="svhand" data-h="${h}" style="background:${bg};opacity:${op.toFixed(2)}" title="${h}">${h}</button>`;
    };
    const freqBar = `<div class="sbar">${node.acts.map((_, a) => r.freq[a] > 0.001 ? `<i style="width:${(r.freq[a] * 100).toFixed(2)}%;background:var(--act-${cls[a]})"></i>` : '').join('')}</div>`;
    const btns = node.acts.map((_, a) => `<button class="btn actb" data-act="svact" data-a="${a}"><i class="sw" style="background:var(--act-${cls[a]})"></i>${esc(g.label(node, a))} <span class="mono">${pct(r.freq[a], 1)}</span></button>`).join('');
    const resolve = node.board.length > g.board.length && node.bets[0] === 0 && node.bets[1] === 0 && node.p === 0 && (g.stats().approx || node.board.length === 5 && g.board.length === 4)
      ? `<button class="btn" data-act="svresolve">Re-résoudre exactement d'ici</button>` : '';
    return `<section class="panel"><div class="row" style="justify-content:space-between"><h2>${nm(p)} parle · ${fr(totalMass, 1)} combos</h2>${resolve}</div>
      ${freqBar}<div class="row actrow">${btns}</div>
      <div class="row"><span class="note">Grille :</span>${[['strat', 'Stratégie'], ['eq', 'Équité'], ['ev', 'EV']].map(([k, l]) => `<button class="chip" aria-pressed="${sv.view === k}" data-act="svview" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="svgrid">${grid169(cellHTML)}</div>
      <p class="note">Couleur = mélange d'actions de la classe de mains, pondéré par les combos encore présents ; une case pâle = peu de combos de cette main arrivent ici. Clique une case pour le détail par combo.</p>
      ${sv.cell ? comboHTML(r, sv.cell) : ''}</section>
      ${heroHTML(r)}${categoryHTML(r)}${playHTML(r)}${lockHTML(r)}`;
  }
  // ---------------- Node locking : imposer la stratégie d'un joueur à ce nœud et recalculer la meilleure réponse ----------------
  const BUCKETS = [['Mains fortes', 0.66, 1.01], ['Mains moyennes', 0.4, 0.66], ['Mains faibles', -1, 0.4]];
  const pathKey = (p) => JSON.stringify(p);
  function lockPreset(node, k) {
    const acts = node.acts, aggr = acts.map((a, i) => ['b', 'r', 'a'].includes(a.k) ? i : -1).filter((i) => i >= 0), pass = acts.findIndex((a) => a.k === 'x' || a.k === 'c'), fold = acts.findIndex((a) => a.k === 'f');
    const R = (a, f) => ({ a, f });
    if (k === 'nobluff') return [R(-1, 100), R(-1, 100), R(pass >= 0 ? pass : fold, 100)];
    if (k === 'station') return [R(-1, 100), R(pass, 100), R(pass, 100)];
    if (k === 'nit') return [R(-1, 100), R(fold >= 0 ? fold : pass, 100), R(fold >= 0 ? fold : pass, 100)];
    if (k === 'always') return [R(aggr[0] ?? pass, 100), R(aggr[0] ?? pass, 100), R(aggr[0] ?? pass, 100)];
    if (k === 'never') return [R(pass >= 0 ? pass : fold, 100), R(pass >= 0 ? pass : fold, 100), R(pass >= 0 ? pass : fold, 100)];
    return [R(-1, 100), R(-1, 100), R(-1, 100)];
  }
  function buildLock(r, rules) {
    const g = sv.game, node = r.node, p = node.p, n = g.N[p], A = node.acts.length, out = new Float64Array(A * n);
    for (let i = 0; i < n; i++) {
      const e = isFinite(r.eq[p][i]) ? r.eq[p][i] : 0.5, b = BUCKETS.findIndex(([, lo, hi]) => e >= lo && e < hi), rule = rules[b < 0 ? 2 : b];
      if (rule.a < 0) { for (let a = 0; a < A; a++) out[a * n + i] = r.strategy[a * n + i]; continue; }
      const f = Math.max(0, Math.min(1, rule.f / 100)); let rest = 0;
      for (let a = 0; a < A; a++) if (a !== rule.a) rest += r.strategy[a * n + i];
      for (let a = 0; a < A; a++) out[a * n + i] = a === rule.a ? f : (1 - f) * (rest > 1e-9 ? r.strategy[a * n + i] / rest : 1 / (A - 1));
    }
    return out;
  }
  function lockHTML(r) {
    const g = sv.game, node = r.node; if (!g || sv.running) return '';
    const key = pathKey(sv.path), locked = (sv.locks || []).find((l) => l.key === key), ed = sv.lockEd && sv.lockEd.key === key ? sv.lockEd : null;
    const res = sv.lockRes;
    const resHTML = res ? `<div class="advice"><div class="good"><strong>Exploitation chiffrée :</strong> ${res.lines.map(esc).join(' ')}</div></div>` : '';
    const list = (sv.locks || []).length ? `<p class="note">${sv.locks.length} nœud${sv.locks.length > 1 ? 's' : ''} verrouillé${sv.locks.length > 1 ? 's' : ''} : ${sv.locks.map((l) => esc(l.label)).join(' · ')}. <button class="btn small" data-act="lkclear">Retirer les verrous et revenir à l'équilibre</button></p>` : '';
    if (!ed) return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Node locking${locked ? ' · nœud verrouillé' : ''}</span><p class="note" style="margin:4px 0 0">Impose ce que ${esc(nm(node.p))} joue vraiment ici (« il ne bluffe jamais », « il paie tout »), puis recalcule la meilleure réponse de l'autre joueur et chiffre l'exploitation.</p></div><button class="btn" data-act="lkedit">${locked ? 'Modifier le verrou' : 'Verrouiller ce nœud'}</button></div>${resHTML}${list}</section>`;
    const opt = (b, rule) => `<select data-lk="${b}" aria-label="Action ${BUCKETS[b][0]}"><option value="-1"${rule.a < 0 ? ' selected' : ''}>Comme le solveur</option>${node.acts.map((_, a) => `<option value="${a}"${rule.a === a ? ' selected' : ''}>${esc(g.label(node, a))}</option>`).join('')}</select>`;
    return `<section class="panel" style="border-color:var(--accent)"><span class="eyebrow">Node locking · ${esc(nm(node.p))}</span><h2>Ce qu'il joue vraiment ici</h2>
      <div class="row"><span class="note">Profils rapides :</span>${[['nobluff', 'Ne bluffe jamais'], ['station', 'Ne se couche jamais'], ['nit', 'Se couche trop'], ['always', 'Mise toujours'], ['never', 'Ne mise jamais'], ['gto', 'Comme le solveur']].map(([k, l]) => `<button class="chip" data-act="lkpreset" data-k="${k}">${l}</button>`).join('')}</div>
      <div style="display:grid;gap:8px">${BUCKETS.map(([l, lo, hi], b) => `<div class="row" style="align-items:center"><span style="min-width:140px">${l} <span class="note">(équité ${lo < 0 ? '< 40 %' : hi > 1 ? '≥ 66 %' : '40-66 %'})</span></span>${opt(b, ed.rules[b])}<label class="f" style="flex-direction:row;align-items:center;gap:6px"><input type="number" min="0" max="100" step="5" value="${ed.rules[b].f}" data-lkf="${b}" style="width:72px" ${ed.rules[b].a < 0 ? 'disabled' : ''}> %</label></div>`).join('')}</div>
      <p class="note">Le pourcentage est la fréquence de l'action choisie dans la catégorie ; le reste suit les proportions du solveur. Équité de chaque main contre la range adverse à ce nœud.</p>
      <div class="row"><button class="btn primary" data-act="lkgo">Verrouiller et recalculer</button><button class="btn" data-act="lkcancel">Annuler</button></div></section>`;
  }
  ACT.lkedit = () => { const key = pathKey(sv.path), l = (sv.locks || []).find((x) => x.key === key); sv.lockEd = { key, rules: l?.rules ? JSON.parse(JSON.stringify(l.rules)) : lockPreset(sv.info.node, 'gto') }; render(); };
  ACT.lkcancel = () => { sv.lockEd = null; render(); };
  ACT.lkpreset = (t) => { sv.lockEd.rules = lockPreset(sv.info.node, t.dataset.k); render(); };
  ONCHANGE.push((t) => {
    if (t.dataset.lk !== undefined && sv.lockEd) { sv.lockEd.rules[+t.dataset.lk].a = +t.value; render(); return true; }
    if (t.dataset.lkf !== undefined && sv.lockEd) { sv.lockEd.rules[+t.dataset.lkf].f = Math.max(0, Math.min(100, +t.value || 0)); return true; }
  });
  ACT.lkgo = () => {
    const r = sv.info, g = sv.game, node = r.node, p = node.p, o = 1 - p;
    const strat = buildLock(r, sv.lockEd.rules), key = sv.lockEd.key;
    // Référence avant verrou : EV moyennes à la racine et au nœud, pour chiffrer le gain de l'exploitant.
    const root = g.info([]);
    if (!sv.lockBase) sv.lockBase = { root: root.evMean.slice(), node: {} };
    sv.lockBase.node[key] = r.evMean.slice();
    const label = `${nm(p)} · ${node.board.map(E.cardStr).join('')} · ${sv.lockEd.rules.map((x, b) => (x.a < 0 ? null : `${BUCKETS[b][0].toLowerCase()} : ${g.label(node, x.a).toLowerCase()} ${x.f} %`)).filter(Boolean).join(', ') || 'stratégie du solveur'}`;
    sv.locks = (sv.locks || []).filter((l) => l.key !== key).concat({ key, path: sv.path.slice(), strat: Array.from(strat), rules: sv.lockEd.rules, label, p, o });
    sv.lockEd = null; sv.lockPending = { key, p, o }; sv.keepLocks = true;
    sv.pendingTarget = { path: sv.path.slice() }; sv.target = sv.pendingTarget; sv.pendingTarget = null;
    start();
  };
  ACT.lkclear = () => { sv.play = null; sv.locks = []; sv.lockRes = null; sv.lockBase = null; sv.keepLocks = true; sv.target = { path: sv.path.slice() }; start(); };
  // Appelé à la fin d'une résolution avec verrous : comparaison avant/après.
  function lockReport() {
    const lp = sv.lockPending; sv.lockPending = null; if (!lp || !sv.lockBase) return;
    try {
      const root = sv.game.info([]), at = sv.game.info(sv.locks.find((l) => l.key === lp.key).path), b = sv.lockBase;
      const gainRoot = root.evMean[lp.o] - b.root[lp.o], gainNode = at.evMean[lp.o] - (b.node[lp.key] || at.evMean)[lp.o];
      if (lp.play && sv.play) {
        const cost = (b.node[lp.key] || at.evMean)[lp.p] - at.evMean[lp.p], costR = b.root[lp.p] - root.evMean[lp.p], rel = cost / Math.max(1e-9, sv.play.pot), ok = rel < 0.02;
        sv.play.res = { ok, lines: [`Coût de la fiche pour ${nm(lp.p)} : ${fr(Math.max(0, cost), 2)} bb à ce nœud (${pct(Math.max(0, rel), 1)} du pot) et ${fr(Math.max(0, costR), 2)} bb sur l'ensemble du spot, une fois que ${nm(lp.o)} a adapté sa stratégie.`, ok ? 'Moins de 2 % du pot : fiche jouable telle quelle.' : 'Coût notable : garde un mélange pour les catégories à faible accord, ou ajoute une seconde règle.', 'Retire le verrou pour revenir à l\'équilibre.'] };
        return;
      }
      sv.lockRes = { lines: [`${nm(lp.o)} gagne ${gainNode >= 0 ? '+' : '−'}${fr(Math.abs(gainNode), 2)} bb en moyenne à ce nœud et ${gainRoot >= 0 ? '+' : '−'}${fr(Math.abs(gainRoot), 2)} bb sur l'ensemble du spot (pot de départ ${fr(sv.game.P0, 1)} bb) en adaptant sa stratégie.`, 'Navigue dans l\'arbre : les nœuds de l\'exploitant montrent maintenant sa meilleure réponse au verrou.'] };
    } catch (e) { sv.lockRes = null; }
  }
  const evTxt = (v) => (isFinite(v) ? fr(v, 2) + ' bb' : '–');
  function comboHTML(r, h) {
    const g = sv.game, node = r.node, p = node.p, n = g.N[p], cls = actClasses(node), rows = [];
    g.hands[p].forEach(([a, b], i) => {
      if (E.abstractOf(a, b) !== h || r.reach[p][i] <= 1e-9) return;
      const best = Math.max(...r.actEv.map((v) => v[i]));
      rows.push(`<tr><td>${cardHTML(a, true)}${cardHTML(b, true)}</td><td class="n mono">${fr(r.reach[p][i], 2)}</td><td class="n mono">${isFinite(r.eq[p][i]) ? pct(r.eq[p][i], 1) : '–'}</td><td class="n mono">${evTxt(r.ev[p][i])}</td>
        ${node.acts.map((_, ai) => { const f = r.strategy[ai * n + i], v = r.actEv[ai][i]; return `<td class="n"><span class="mini-sw" style="background:var(--act-${cls[ai]})"></span><span class="mono">${pct(f, 0)}</span><br><span class="note mono${Math.abs(v - best) < 1e-6 ? ' bestev' : ''}">${evTxt(v)}</span></td>`; }).join('')}</tr>`);
    });
    return `<div class="tw"><table class="t combos"><thead><tr><th>Combo ${esc(h)}</th><th class="n">Poids</th><th class="n">Équité</th><th class="n">EV</th>${node.acts.map((_, a) => `<th class="n">${esc(g.label(node, a))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>
      <p class="note">Sous chaque fréquence : l'EV de l'action (en bb, part du pot récupérée moins ce que tu remets). Une main qui mélange deux actions a des EV presque égales : les deux sont correctes.</p>`;
  }
  function heroHTML(r) {
    const hc = sv.heroCombo, g = sv.game; if (!hc) return '';
    const key = (a, b) => (a > b ? a * 52 + b : b * 52 + a), k = key(hc[0], hc[1]);
    const node = r.node, out = [];
    for (let p = 0; p < 2; p++) {
      const i = g.hands[p].findIndex(([a, b]) => key(a, b) === k); if (i < 0) continue;
      if (r.reach[p][i] <= 1e-9) { out.push(`<p>${cardHTML(hc[0], true)}${cardHTML(hc[1], true)} n'arrive pas à ce nœud dans la stratégie d'équilibre de ${nm(p)} (le solveur l'a jouée autrement avant, ou une carte du board la bloque).</p>`); continue; }
      let line = `<p>${cardHTML(hc[0], true)}${cardHTML(hc[1], true)} chez ${nm(p)} : équité ${pct(r.eq[p][i], 1)}, EV ${evTxt(r.ev[p][i])}.</p>`;
      if (node.t === PF.ACT && node.p === p) {
        const n = g.N[p], fr_ = node.acts.map((_, a) => r.strategy[a * n + i]), evs = r.actEv.map((v) => v[i]), best = Math.max(...evs), bi = evs.indexOf(best);
        const main = node.acts.map((_, a) => a).filter((a) => fr_[a] >= 0.05).sort((a, b) => fr_[b] - fr_[a]);
        line += `<div class="advice">${node.acts.map((_, a) => `<div class="${a === bi ? 'good' : best - evs[a] > 0.05 * r.pot ? 'bad' : 'warn'}"><strong>${esc(g.label(node, a))}</strong> · fréquence ${pct(fr_[a], 0)} · EV ${evTxt(evs[a])}${a === bi ? ' · meilleure EV' : ` · perte ${fr(best - evs[a], 2)} bb (${pct((best - evs[a]) / r.pot, 1)} du pot)`}</div>`).join('')}</div>
          <p>${main.length > 1 ? `Main mixte : le solveur alterne ${main.map((a) => esc(g.label(node, a).toLowerCase())).join(' et ')}. Les EV sont proches, les deux sont acceptables ; contre un adversaire réel, choisis celle qui exploite sa faiblesse.` : `Action pure : ${esc(g.label(node, main[0] ?? bi).toLowerCase())}.`}</p>`;
      }
      out.push(line);
    }
    return out.length ? `<section class="panel"><h2>Ta main</h2>${out.join('')}</section>` : `<section class="panel"><h2>Ta main</h2><p>${cardHTML(hc[0], true)}${cardHTML(hc[1], true)} n'est dans aucune des deux ranges (ou est bloquée par le board). Ajoute-la à ta range pour l'étudier.</p></section>`;
  }
  // Rapport par catégorie de main (main faite + tirage).
  const catName = (a, b, board) => { const c = B.classify([a, b], board); return { name: B.MADE[c.made] + (c.draws.length && c.made >= 7 ? ' + tirage' : ''), order: c.made * 2 + (c.draws.length ? 0 : 1) }; };
  // Stratégie jouable : une seule action par catégorie (l'action majoritaire du solveur), verrouillée puis re-résolue.
  function playable(r) {
    const g = sv.game, node = r.node, p = node.p, n = g.N[p], A = node.acts.length, cats = new Map(), of = new Array(n);
    let tot = 0;
    g.hands[p].forEach(([a, b], i) => {
      const w = r.reach[p][i], c = catName(a, b, node.board); of[i] = c.name; if (w <= 1e-9) return;
      let x = cats.get(c.name); if (!x) cats.set(c.name, x = { m: 0, f: new Array(A).fill(0), order: c.order });
      x.m += w; tot += w; for (let k = 0; k < A; k++) x.f[k] += w * r.strategy[k * n + i];
    });
    const pickA = new Map([...cats].map(([nm_, x]) => [nm_, x.f.indexOf(Math.max(...x.f))]));
    const strat = new Float64Array(A * n);
    for (let i = 0; i < n; i++) { const a = pickA.get(of[i]); if (a === undefined) { for (let k = 0; k < A; k++) strat[k * n + i] = r.strategy[k * n + i]; } else strat[a * n + i] = 1; }
    const sheet = [...cats].sort((a, b) => a[1].order - b[1].order).map(([name, x]) => ({ name, share: x.m / tot, act: g.label(node, pickA.get(name)), agree: x.f[pickA.get(name)] / x.m }));
    return { strat, sheet };
  }
  function playHTML(r) {
    const g = sv.game; if (!g || sv.running) return '';
    const key = pathKey(sv.path), P = sv.play && sv.play.key === key ? sv.play : null;
    const sheet = P ? P.sheet : playable(r).sheet;
    const rows = sheet.map((x) => `<tr><td>${esc(x.name)}</td><td class="n mono">${pct(x.share, 0)}</td><td><strong>${esc(x.act)}</strong></td><td class="n mono">${pct(x.agree, 0)}</td></tr>`).join('');
    const res = P && P.res ? `<div class="advice"><div class="${P.res.ok ? 'good' : 'warn'}">${P.res.lines.map(esc).join(' ')}</div></div>` : P ? '<p class="note">Re-résolution en cours…</p>' : '';
    return `<section class="panel"><span class="eyebrow">Stratégie jouable</span><h2>Une action par catégorie</h2>
      <p class="note">Le solveur mélange ; à la table, une règle simple par catégorie se retient. La fiche ci-dessous garde l'action majoritaire du solveur pour chaque catégorie. « Accord » = part de la catégorie que le solveur joue déjà ainsi.</p>
      <div class="tw"><table class="t"><thead><tr><th>Catégorie</th><th class="n">Part</th><th>Règle</th><th class="n">Accord</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="row"><button class="btn" data-act="svplay">Mesurer le coût : verrouiller la fiche et laisser ${esc(nm(1 - r.node.p))} s'adapter</button></div>${res}</section>`;
  }
  ACT.svplay = () => {
    const r = sv.info, g = sv.game; if (!r || !g) return;
    const node = r.node, p = node.p, o = 1 - p, key = pathKey(sv.path), { strat, sheet } = playable(r);
    const root = g.info([]);
    if (!sv.lockBase) sv.lockBase = { root: root.evMean.slice(), node: {} };
    sv.lockBase.node[key] = r.evMean.slice();
    sv.locks = (sv.locks || []).filter((l) => l.key !== key).concat({ key, path: sv.path.slice(), strat: Array.from(strat), rules: null, label: `${nm(p)} · fiche jouable`, p, o });
    sv.play = { key, sheet, pot: r.pot, p }; sv.lockPending = { key, p, o, play: true }; sv.keepLocks = true;
    sv.target = { path: sv.path.slice() }; start();
  };
  function categoryHTML(r) {
    const g = sv.game, node = r.node, p = node.p, n = g.N[p], A = node.acts.length, cls = actClasses(node), cats = new Map();
    let tot = 0;
    g.hands[p].forEach(([a, b], i) => {
      const w = r.reach[p][i]; if (w <= 1e-9) return;
      const c = B.classify([a, b], node.board), name = B.MADE[c.made] + (c.draws.length && c.made >= 7 ? ' + tirage' : '');
      let x = cats.get(name); if (!x) cats.set(name, x = { m: 0, f: new Array(A).fill(0), eq: 0, order: c.made * 2 + (c.draws.length ? 0 : 1) });
      x.m += w; tot += w; for (let k = 0; k < A; k++) x.f[k] += w * r.strategy[k * n + i]; if (isFinite(r.eq[p][i])) x.eq += w * r.eq[p][i];
    });
    const rows = [...cats].sort((a, b) => a[1].order - b[1].order).map(([name, x]) => `<tr><td>${esc(name)}</td><td class="n mono">${pct(x.m / tot, 1)}</td><td class="n mono">${pct(x.eq / x.m, 0)}</td><td style="min-width:140px"><div class="sbar small">${x.f.map((f, k) => f / x.m > 0.001 ? `<i style="width:${(f / x.m * 100).toFixed(2)}%;background:var(--act-${cls[k]})" title="${esc(g.label(node, k))} ${pct(f / x.m, 0)}"></i>` : '').join('')}</div></td></tr>`).join('');
    return `<section class="panel"><h2>Stratégie par catégorie de main</h2><div class="tw"><table class="t"><thead><tr><th>Catégorie</th><th class="n">Part</th><th class="n">Équité</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="legend">${node.acts.map((_, a) => `<span><i style="background:var(--act-${cls[a]})"></i>${esc(g.label(node, a))}</span>`).join('')}</div></section>`;
  }

  // ---------------- Actions ----------------
  // Le nœud cible d'une main importée ne vaut que pour son board : un board modifié entre-temps l'annule.
  ACT.svgo = () => { const pt = sv.pendingTarget; sv.target = pt && (!pt.board || pt.board === sv.board) ? pt : null; sv.pendingTarget = null; start(); };
  ACT.svstop = () => { sv.running = false; if (sv.game) { sv.ex = sv.game.exploitability(); finish(); } };
  ACT.svsetup = (t, e) => { e.preventDefault(); sv.setupOpen = !sv.setupOpen; render(); };
  ACT.svreset = () => { stabStop(); sv.game = null; sv.info = null; sv.path = []; sv.target = null; render(); };
  ACT.svpath = (t) => { sv.path = sv.path.slice(0, +t.dataset.k); sv.cell = null; refreshInfo(); render(); };
  ACT.svact = (t) => { sv.path.push(+t.dataset.a); sv.cell = null; refreshInfo(); render(); };
  ACT.svcard = (t) => { sv.path.push(+t.dataset.c); sv.cell = null; refreshInfo(); render(); };
  ACT.svhand = (t) => { sv.cell = sv.cell === t.dataset.h ? null : t.dataset.h; render(); };
  ACT.svview = (t) => { sv.view = t.dataset.v; render(); };
  ACT.svpreset = (t) => { sv.preset = t.dataset.v; sv.sizes = presetSizes(sv.preset, aggIdx()); sv.sizesCustom = false; sv.maxRaises = PRESETS[sv.preset].maxRaises; if (sv.extraSizes) mergeExtra(); render(); };
  ACT.svsizes = () => { sv.showSizes = !sv.showSizes; render(); };
  ACT.svacc = (t) => { sv.acc = t.dataset.v; render(); };
  ACT.svicm = (t) => { sv.icmOn = t.dataset.v === '1'; render(); };
  ACT.svsample = (t) => { sv.sample = t.dataset.v; render(); };
  ACT.svpaint = (t) => { const p = +t.dataset.p; sv.paint = sv.paint === p ? -1 : p; render(); };
  ACT.svbrush = (t) => { sv.brush = +t.dataset.v; render(); };
  ACT.svcell = (t) => { const p = +t.dataset.p, h = t.dataset.h, cur = classWeights(p).get(h) || 0; setClassWeight(p, h, Math.abs(cur - sv.brush) < 1e-6 ? 0 : sv.brush); render(); };
  ACT.svclear = (t) => { sv.r[+t.dataset.p] = ''; render(); };
  ACT.svrand = (t) => {
    const n = +t.dataset.n, deck = [...Array(52).keys()];
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const prevLen = E.parseCards(sv.board || '').length;
    sv.board = deck.slice(0, n).map(E.cardStr).join(''); sv.include = null;
    if (!sv.sizesCustom && (n === 3 || prevLen === 3) && n !== prevLen) sv.sizes = presetSizes(sv.preset, aggIdx(), n);
    render();
  };
  ACT.svresolve = () => {
    const g = sv.game, r = sv.info, node = r.node;
    const toArr = (p) => { const mx = Math.max(...r.reach[p]); return g.hands[p].map(([a, b], i) => [a, b, r.reach[p][i] / mx]).filter((x) => x[2] > 1e-4); };
    sv.r = [PF.rangeText(toArr(0)), PF.rangeText(toArr(1))]; sv.board = node.board.map(E.cardStr).join(''); sv.pot = +(r.pot).toFixed(2); sv.stack = +(g.S - node.C[0]).toFixed(2);
    sv.scen = 'custom'; sv.include = g.cfg.include;
    if (!sv.sizesCustom) { sv.sizes = presetSizes(sv.preset, aggIdx(), node.board.length); sv.maxRaises = PRESETS[sv.preset].maxRaises; if (sv.extraSizes) mergeExtra(); }
    sv.note = 'Ranges reprises du solve précédent au nœud choisi (poids = fréquence avec laquelle chaque combo arrive ici).';
    sv.target = null; start();
  };
  ONCHANGE.push((t) => {
    if (t.dataset.svf) {
      const k = t.dataset.svf;
      if (k === 'scen') { if (t.value !== 'custom') { sv.include = null; sv.extraSizes = null; applyScenario(t.value); } else sv.scen = 'custom'; render(); return true; }
      if (k === 'maxRaises') { sv.maxRaises = Math.max(0, Math.min(4, Math.round(+t.value) || 0)); render(); return true; }
      const prevLen = E.parseCards(sv.board || '').length;
      sv[k] = t.value.trim();
      if (k === 'board') { sv.include = null; let len = 0; try { len = E.parseCards(sv.board).length; } catch (e) { /* board en cours de saisie */ } if (len !== prevLen && !sv.sizesCustom && (len === 3 || prevLen === 3)) { sv.sizes = presetSizes(sv.preset, aggIdx(), len); if (sv.extraSizes) mergeExtra(); } }
      if (k === 'hero') { sv.heroCombo = parseHero(); if (sv.game && !sv.running) { render(); return true; } }
      const est = $('#svest'); if (est) est.innerHTML = estimateText(); else render();
      if (k === 'board') render();
      return true;
    }
    if (t.dataset.svr !== undefined) { sv.r[+t.dataset.svr] = t.value; render(); return true; }
    if (t.dataset.svsz) { const [st, p, kind] = t.dataset.svsz.split('.'); sv.sizes[st][+p][kind] = t.value; sv.sizesCustom = true; const est = $('#svest'); if (est) est.innerHTML = estimateText(); return true; }
  });

  // ---------------- Retravailler une main du replayer ----------------
  const chartPos = (p) => (['UTG', 'UTG+1', 'UTG+2', 'LJ', 'MP', 'EP'].includes(p) ? 'UTG' : p);
  function handToSpot(h, k) {
    const pos = HH.positions(h), bb = h.bb || 1, players = h.seats.map((s) => s.name);
    const put = {}, stacks = {}, streetPut = {}, folded = new Set();
    h.seats.forEach((s) => { stacks[s.name] = s.stack; put[s.name] = 0; });
    const order = { pre: 0, flop: 1, turn: 2, river: 3 }, starts = {}, acts = [];
    let street = 'pre', stepIdx = 0; const pre = [];
    let cut = Infinity; // index d'action (dans h.actions filtrées) avant lequel on s'arrête
    const fil = h.actions.filter((a) => a.p in put);
    // Étape k du replayer : 0 = début, 1..n = actions, puis board complet et fin.
    if (k >= 1 && k <= fil.length) cut = k - 1;
    fil.forEach((a, idx) => {
      if (a.street !== street) {
        street = a.street; for (const p of players) streetPut[p] = 0;
        if (!starts[street]) starts[street] = { pot: Object.values(put).reduce((x, y) => x + y, 0) / bb, alive: players.filter((p) => !folded.has(p)), stacks: { ...stacks }, idx };
      }
      let add = 0;
      if (a.type === 'post') { add = a.amt; streetPut[a.p] = (streetPut[a.p] || 0) + (a.kind === 'ante' ? 0 : a.amt); }
      else if (a.type === 'folds') folded.add(a.p);
      else if (a.type === 'calls' || a.type === 'bets') add = a.amt;
      else if (a.type === 'raises') add = (a.to || a.amt) - (streetPut[a.p] || 0);
      if (a.type !== 'post' && add) streetPut[a.p] = (streetPut[a.p] || 0) + add;
      put[a.p] += add; stacks[a.p] -= add;
      if (a.street === 'pre') pre.push(a); else acts.push({ ...a, idx, to: streetPut[a.p] / bb });
    });
    // Rue de départ : la première rue après le flop où il ne reste que deux joueurs.
    const startSt = ['flop', 'turn', 'river'].find((s) => starts[s] && starts[s].alive.length === 2);
    if (!startSt) return { err: 'Le solveur traite les pots à deux joueurs : cette main reste multiway, ou s\'arrête avant le flop.' };
    const S0 = starts[startSt], [pA, pB] = S0.alive;
    const ia = ORDER.indexOf(chartPos(pos[pA])), ib = ORDER.indexOf(chartPos(pos[pB]));
    const oop = ia <= ib ? pA : pB, ip = oop === pA ? pB : pA;
    // Ranges préflop estimées.
    const raises = pre.filter((a) => a.type === 'raises' || a.type === 'bets');
    const P = (n) => chartPos(pos[n]);
    let rng = {}, desc;
    if (!raises.length) { rng[oop] = LIMP; rng[ip] = LIMP; desc = 'pot limpé'; }
    else if (raises.length === 1) {
      const x = raises[0].p, y = x === oop ? ip : oop, X_ = P(x), Y_ = P(y);
      rng[x] = C.RFI[X_]?.range || 'TT+, AQ+, KQs'; rng[y] = C.FACING[X_]?.[Y_]?.call || 'TT-22, AJs-A2s, KTs+, QTs+, JTs, T9s, 98s, AQo, KQo';
      desc = `${X_} ouvre, ${Y_} paie`;
    } else if (raises.length === 2) {
      const x = raises[0].p, y = raises[1].p, X_ = P(x), Y_ = P(y);
      if ([x, y].every((n) => n === oop || n === ip)) { rng[x] = CALL3[X_] || CALL3.CO; rng[y] = C.FACING[X_]?.[Y_]?.threebet || 'TT+, AQ+, A5s-A4s'; desc = `${X_} ouvre, ${Y_} 3-bet, ${X_} paie`; }
      else { const y2 = y === oop || y === ip ? y : (raises[1].p); rng[y2] = 'TT+, AQ+, A5s-A4s, KQs'; rng[y2 === oop ? ip : oop] = 'JJ-77, AQs-ATs, KQs, QJs, JTs, AQo'; desc = 'pot 3-bet (squeeze ou caller)'; }
    } else { const last = raises[raises.length - 1].p; rng[last] = 'QQ+, AKs, AKo, A5s'; rng[last === oop ? ip : oop] = 'QQ-JJ, AKs, AKo, AQs'; desc = 'pot 4-bet'; }
    const lastR = raises.length ? raises[raises.length - 1].p : null, agg = lastR === oop ? 0 : 1;
    // Tailles réelles converties en % du pot pour qu'elles existent dans l'arbre.
    const extra = { flop: [{ bet: [], raise: [] }, { bet: [], raise: [] }], turn: [{ bet: [], raise: [] }, { bet: [], raise: [] }], river: [{ bet: [], raise: [] }, { bet: [], raise: [] }] };
    const seq = [];
    let potNow = S0.pot, C2 = { [oop]: 0, [ip]: 0 }, bets = { [oop]: 0, [ip]: 0 }, curSt = null, maxR = 0, nr = 0;
    for (const a of acts) {
      if (order[a.street] < order[startSt] || ![oop, ip].includes(a.p)) continue;
      if (a.street !== curSt) { curSt = a.street; potNow += 0; bets = { [oop]: 0, [ip]: 0 }; nr = 0; seq.push({ card: true, street: a.street }); }
      const p = a.p === oop ? 0 : 1, o = a.p === oop ? ip : oop, pot = S0.pot + C2[oop] + C2[ip];
      if (a.idx < cut) {
        if (a.type === 'bets') extra[a.street][p].bet.push(Math.round(((a.to - bets[a.p]) / pot) * 1000) / 10);
        if (a.type === 'raises') { const toCall = bets[o] - bets[a.p]; extra[a.street][p].raise.push(Math.round(((a.to - bets[o]) / (pot + toCall)) * 1000) / 10); nr++; maxR = Math.max(maxR, nr); }
        seq.push({ p, type: a.type, to: a.to, allin: !!a.allin, street: a.street });
      }
      C2[a.p] += a.to - bets[a.p]; bets[a.p] = a.to;
    }
    const board = h.board.slice(0, { flop: 3, turn: 4, river: 5 }[startSt]);
    const stack = Math.min(S0.stacks[oop], S0.stacks[ip]) / bb;
    return { oop, ip, posO: P(oop), posI: P(ip), ranges: [rng[oop], rng[ip]], desc, board, runout: h.board.slice(board.length), pot: Math.round(S0.pot * 100) / 100, stack: Math.round(stack * 100) / 100, extra, seq, maxR, hero: h.hero, heroCards: h.heroCards, startSt, agg };
  }
  function mergeExtra() {
    const ex = sv.extraSizes; if (!ex) return;
    for (const st of ST) for (let p = 0; p < 2; p++) for (const kind of ['bet', 'raise']) {
      const cur = String(sv.sizes[st][p][kind] || '').split(/\s+/).filter(Boolean);
      for (const v of ex[st][p][kind]) if (!cur.some((c) => c !== 'a' && Math.abs(+c - v) < 1.5)) cur.push(String(v));
      sv.sizes[st][p][kind] = cur.join(' ');
    }
  }
  // Chemin dans l'arbre qui suit les actions réelles (taille la plus proche).
  function pathFor(g, seq) {
    const path = []; let node = g.root, si = 0;
    const realCards = g.cfg.include || [];
    for (const s of seq) {
      if (s.card) { if (node.t === PF.CHANCE) { const c = realCards.find((x) => node.cards.includes(x) && !node.board.includes(x)); if (c === undefined) break; path.push(c); node = node.ch[node.cards.indexOf(c)]; } continue; }
      if (node.t !== PF.ACT || node.p !== s.p) break;
      const want = { folds: ['f'], checks: ['x'], calls: ['c'], bets: ['b', 'a'], raises: ['r', 'a'] }[s.type]; if (!want) continue;
      let best = -1, bd = Infinity;
      node.acts.forEach((a, i) => { if (!want.includes(a.k)) return; const d = (s.type === 'bets' || s.type === 'raises') ? Math.abs(a.to - s.to) + (s.allin && a.k === 'a' ? -0.5 : 0) : 0; if (d < bd) { bd = d; best = i; } });
      if (best < 0) break; path.push(best); node = node.ch[best]; si++;
    }
    return path;
  }
  ACT.rp2solver = () => {
    const rp = X.getReplay && X.getReplay(); if (!rp) return;
    const s = handToSpot(rp.h, rp.k);
    if (s.err) { X.libMsg = s.err; sv.err = s.err; sv.sub = 'solve'; go('solveur'); return; }
    sv.sub = 'solve'; sv.scen = 'custom'; sv.names = [s.posO + (s.oop === s.hero ? ' (toi)' : ''), s.posI + (s.ip === s.hero ? ' (toi)' : '')];
    sv.r = s.ranges.slice(); sv.board = s.board.map(E.cardStr).join(''); sv.pot = s.pot; sv.stack = s.stack; sv.include = s.runout.length ? s.runout : null;
    sv.agg = s.agg; sv.preset = 'fast'; sv.sizes = presetSizes('fast', s.agg, s.board.length); sv.sizesCustom = false; sv.maxRaises = Math.max(1, s.maxR); sv.extraSizes = s.extra; mergeExtra();
    sv.hero = s.heroCards ? s.heroCards.map(E.cardStr).join('') : ''; sv.heroCombo = parseHero();
    sv.note = `Main importée : ${s.desc}, solve à partir du ${s.startSt}. Ranges préflop estimées à partir des positions : vérifie-les. Les tailles réellement jouées ont été ajoutées à l'arbre ; après la résolution, le solveur s'ouvre au moment de la décision.`;
    sv.game = null; sv.info = null; sv.path = []; sv.err = '';
    sv.pendingTarget = { seq: s.seq, board: sv.board };
    go('solveur');
  };

  // ---------------- Mode d'emploi ----------------
  function helpHTML() {
    return `<section class="panel prose"><h2>Ce que fait le solveur</h2>
      <p>Il cherche l'<strong>équilibre de Nash</strong> d'un spot à deux joueurs : une paire de stratégies où aucun des deux ne gagne à changer seul. Algorithme : <em>Discounted CFR</em> (Brown et Sandholm, 2019), le même principe que PioSolver, GTO+ ou GTO Wizard. À chaque itération, chaque combo augmente la fréquence des actions qui auraient rapporté plus ; la moyenne des stratégies converge vers l'équilibre.</p>
      <p>L'<strong>exploitabilité</strong> mesure ce qu'un adversaire parfait gagnerait contre la solution, en % du pot. Sous 0,5 % du pot, la solution est exploitable pour l'étude ; les solveurs commerciaux visent 0,3 à 0,5 %.</p>
      <h2>Exact ou approché</h2>
      <ul><li><strong>River</strong> : exact, en une seconde environ.</li><li><strong>Turn</strong> : exact (les 46 rivers sont calculées), de quelques secondes à une minute selon les tailles.</li>
      <li><strong>Flop</strong> : un arbre complet ne tient pas dans un navigateur. Le solveur calcule un échantillon représentatif de turns et de rivers. La stratégie du flop est fiable en tendance ; pour un turn précis, ouvre la branche puis « Re-résoudre exactement d'ici » : les ranges arrivent pondérées par le solve du flop, et le turn est recalculé en entier.</li></ul>
      <h2>Ce que le solveur ne sait pas</h2>
      <ul><li>Il ne connaît que les ranges et les tailles que tu lui donnes. Ranges fausses = réponse fausse.</li><li>Cet onglet est à deux joueurs. Les pots à trois ont leur onglet « À trois joueurs » (simplifié : une taille de mise par rue), l'Omaha l'onglet « PLO ».</li><li>Il ignore le rake (léger biais : en vrai, payer est un peu moins rentable).</li><li>Il suppose un adversaire parfait. Contre un fish, la meilleure action s'écarte de l'équilibre : le module Élite « Exploitation » explique comment.</li></ul>
      <h2>Méthode pour retravailler une main</h2>
      <ol><li>Dans Analyse › Replayer, place-toi sur ta décision et clique « Retravailler au solveur ».</li><li>Vérifie les ranges préflop proposées, puis résous.</li><li>Le solveur s'ouvre au nœud de ta décision. Lis « Ta main » : fréquences, EV de chaque action, perte en % du pot.</li><li>Ne retiens pas « le solveur mise 62 % » : retiens <em>pourquoi</em>. Regarde quelles catégories misent, quelles mains servent de bluffs, quels bloqueurs elles ont.</li><li>Note la leçon dans ta bibliothèque (étiquette « à revoir »).</li></ol></section>`;
  }


  // ---------------- Rapport agrégé (précalculé par tools/build_aggregate.js) ----------------
  const ag = { group: 'high', sort: 'w', sc: 'srp-BTN-BB' };
  // ---------------- Préflop : ranges calculées par le solveur préflop simplifié (tools/build_preflop.js) ----------------
  const pf = { fmt: 'cash', id: 'cash100', key: 'rfi:CO', cell: null, cmp: null };
  const PFCAT = [['rfi', 'Ouverture'], ['vo', 'Face à une ouverture'], ['vsh', 'Face à un tapis d\'ouverture'], ['v3', 'Face à un 3-bet'], ['v3a', 'Face à un 3-bet tapis'], ['v4', 'Face à un 4-bet'], ['v4a', 'Face à un 4-bet tapis'], ['v5', 'Face à un 5-bet tapis'], ['sq', 'Squeeze'], ['sqv', 'Ouvreur face au squeeze'], ['sqc', 'Caller face au squeeze'], ['sqo', 'Squeezer face au tapis de l\'ouvreur'], ['sqa', 'Squeezer face au tapis du caller'], ['lp', 'Grosse blinde face au limp'], ['lpr', 'Petite blinde face à l\'isolation'], ['lps', 'Petite blinde face au tapis après limp'], ['lpa', 'Grosse blinde face au tapis après limp']];
  const PFK = { f: 'f', c: 'x', x: 'x', r: 'b2', a: 'a' };
  function pfDecode(D, node) { return node.f.map((str) => Float64Array.from(str, (ch) => D.alph.indexOf(ch) / 63)); }
  // Perte d'EV (bb) de chaque action par rapport à la meilleure, pour une classe de mains (stockée par tools/build_preflop.js).
  const pfLoss = (D, node, i) => (node.l ? node.l.map((str) => (D.alph.indexOf(str[i]) / 63) ** 2 * (D.lossMax || 10)) : null);
  X.pfLoss = pfLoss;
  function preflopHTML() {
    const D = window.PreflopData; if (!D) return '<section class="panel"><p>Données préflop absentes.</p></section>';
    const cfgs = D.configs.filter((c) => c.fmt === pf.fmt), cfg = cfgs.find((c) => c.id === pf.id) || cfgs[0]; pf.id = cfg.id;
    const node = cfg.nodes.find((n) => n.key === pf.key) || cfg.nodes.find((n) => n.key.startsWith('rfi:')); pf.key = node.key;
    const F = pfDecode(D, node), W = E.ALL169.map((h) => E.combos(h).length), tot = node.acts.map((_, a) => F[a].reduce((s, x, i) => s + x * W[i], 0) / 1326);
    const cls = node.acts.map((a) => PFK[a.k] || 'b2');
    const cell = (h) => { const i = E.ALL169.indexOf(h), bg = grad(node.acts.map((_, a) => [cls[a], F[a][i]])); return `<button class="rc sv${pf.cell === h ? ' sel' : ''}" data-act="pflcell" data-h="${h}" style="background:${bg}" title="${h} : ${node.acts.map((a, k) => `${a.l} ${Math.round(F[k][i] * 100)} %`).join(', ')}">${h}</button>`; };
    // Comparaison avec les tableaux de référence (cash 100 bb, ouvertures et réponses à une ouverture).
    let cmp = '';
    const [kind, o, q] = node.key.split(':');
    const play = (i) => 1 - F[0][i];
    if (cfg.fmt !== 'cash') { /* les tableaux de référence sont des ranges cash */ }
    else if (kind === 'rfi' && C.RFI[o]) { const ref = E.parseRange(C.RFI[o].range); const more = E.ALL169.filter((h, i) => play(i) >= 0.5 && !ref.has(h)), less = E.ALL169.filter((h, i) => play(i) < 0.5 && ref.has(h)); cmp = [more, less]; }
    else if (kind === 'vo' && C.FACING[o]?.[q]) { const f = C.FACING[o][q], ref = new Set([...E.parseRange(f.call), ...E.parseRange(f.threebet)]); const more = E.ALL169.filter((h, i) => play(i) >= 0.5 && !ref.has(h)), less = E.ALL169.filter((h, i) => play(i) < 0.5 && ref.has(h)); cmp = [more, less]; }
    const opts = PFCAT.map(([k, l]) => { const L = cfg.nodes.filter((n) => n.key.split(':')[0] === k); return L.length ? `<optgroup label="${l}">${L.map((n) => `<option value="${n.key}"${n.key === node.key ? ' selected' : ''}>${esc(n.label)}</option>`).join('')}</optgroup>` : ''; }).join('');
    const sel = pf.cell ? E.ALL169.indexOf(pf.cell) : -1;
    if (pf.cmp) return compareHTML(D, cfg, cfgs, node);
    return `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Ranges préflop calculées par le solveur</span><span class="row"><button class="btn small" data-act="pfcmp" data-v="pos">Comparer les positions</button><button class="btn small" data-act="pfcmp" data-v="depth">Comparer les profondeurs</button></span></div><h2>${esc(cfg.label)} · ${esc(node.label)}</h2>
      <div class="row"><span class="note">Format :</span>${[['cash', 'Cash'], ['mtt', 'Tournoi (ante de grosse blinde)']].map(([k, l]) => `<button class="chip" aria-pressed="${pf.fmt === k}" data-act="pffmt" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Profondeur :</span>${cfgs.map((c) => `<button class="chip" aria-pressed="${c.id === cfg.id}" data-act="pfid" data-v="${c.id}">${c.stack} bb</button>`).join('')}</div>
      <label class="f">Situation<select data-pfsel="1">${opts}</select></label>
      <div class="sbar">${node.acts.map((_, a) => tot[a] > 0.001 ? `<i style="width:${(tot[a] * 100).toFixed(2)}%;background:var(--act-${cls[a]})"></i>` : '').join('')}</div>
      <div class="row">${node.acts.map((a, k) => `<span class="pill"><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--act-${cls[k]});margin-right:6px"></i>${esc(a.l)} ${pct(tot[k], 1)}</span>`).join('')}</div>
      <div class="svgrid">${grid169(cell)}</div>
      ${sel >= 0 ? `<p><strong class="mono">${pf.cell}</strong> : ${node.acts.map((a, k) => `${esc(a.l.toLowerCase())} ${pct(F[k][sel], 0)}`).join(' · ')}</p>${(() => { const L = pfLoss(D, node, sel); return L ? `<p class="note">Coût de chaque action face à la meilleure : ${node.acts.map((a, k) => `${esc(a.l.toLowerCase())} ${L[k] < 0.005 ? '0' : '−' + fr(L[k], 2)} bb`).join(' · ')}.</p>` : ''; })()}` : '<p class="note">Touche une main pour ses fréquences exactes.</p>'}
      ${cmp ? `<p class="note"><strong>Par rapport au tableau de référence (cash 100 bb) :</strong> joue en plus ${cmp[0].length ? cmp[0].join(' ') : 'rien'} ; laisse de côté ${cmp[1].length ? cmp[1].join(' ') : 'rien'}.</p>` : ''}
      <p class="note">Modèle simplifié, à lire comme une tendance : six joueurs à tapis égaux, ouverture ${String(cfg.open).replace('.', ',')} bb, 3-bet 3 fois (4 fois depuis les blindes), squeezes, limp de la petite blinde (la grosse blinde check ou isole), et pot à trois quand la grosse blinde paie derrière un call (part de chacun ∝ produit de ses équités contre les deux ranges, normalisée : approximation). Seule la grosse blinde peut sur-payer. Après le flop, la valeur d'un pot payé est l'équité réalisée : 100 % en position, 72 % hors de position en pot simple (82 % en 3-bet, 90 % au-delà), modulée par la jouabilité de la main (paires et assorties connectées réalisent mieux). Tapis : équité exacte avec les blocages. Validé à 10 bb sans ante : la petite blinde pousse 58,9 % des mains contre 58,4 % pour l'équilibre tête-à-tête exact.</p></section>`;
  }
  // Comparateur côte à côte : la même situation pour toutes les positions, ou la même position à toutes les profondeurs.
  function miniGrid(D, node, hl) {
    const F = pfDecode(D, node), cls = node.acts.map((a) => PFK[a.k] || 'b2'), W = E.ALL169.map((h) => E.combos(h).length);
    const play = E.ALL169.reduce((s, h, i) => s + (1 - F[0][i]) * W[i], 0) / 1326;
    const cells = E.ALL169.map((h, i) => `<span title="${h} : ${node.acts.map((a, k) => `${a.l} ${Math.round(F[k][i] * 100)} %`).join(', ')}" style="aspect-ratio:1;background:${grad(node.acts.map((_, a) => [cls[a], F[a][i]])) || 'var(--sunk)'}${hl === h ? ';outline:2px solid var(--ink)' : ''}"></span>`).join('');
    return { html: `<div style="display:grid;grid-template-columns:repeat(13,1fr);gap:1px;background:var(--line);border:1px solid var(--line)">${cells}</div>`, play };
  }
  function compareHTML(D, cfg, cfgs, node) {
    const [kind, o, q] = node.key.split(':');
    let items;
    if (pf.cmp === 'pos') {
      // Même type de situation : on fait varier la position du joueur qui décide, le reste fixé quand c'est possible.
      const same = cfg.nodes.filter((n) => { const [k, a, b] = n.key.split(':'); return k === kind && (kind === 'rfi' || (kind === 'vo' ? a === o : b === q)); });
      items = (same.length > 1 ? same : cfg.nodes.filter((n) => n.key.split(':')[0] === kind)).map((n) => ({ n, title: n.label }));
    } else items = cfgs.map((c) => ({ n: c.nodes.find((x) => x.key === node.key), title: `${c.stack} bb` })).filter((x) => x.n);
    const blocks = items.map(({ n, title }) => { const g = miniGrid(D, n, pf.cell); return `<div style="display:grid;gap:4px;align-content:start"><button class="chip" data-act="pfpick" data-k="${n.key}" style="justify-self:start" ${n.key === node.key && pf.cmp === 'pos' ? 'aria-pressed="true"' : ''}>${esc(title)}</button>${g.html}<span class="note mono">joue ${pct(g.play, 1)}</span></div>`; }).join('');
    const legend = node.acts.map((a) => `<span><i style="background:var(--act-${PFK[a.k] || 'b2'})"></i>${esc(a.l)}</span>`).join('');
    return `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Comparateur · ${esc(cfg.label)}</span><button class="btn small" data-act="pfcmp" data-v="">← Retour à une range</button></div>
      <h2>${pf.cmp === 'pos' ? 'Toutes les positions' : 'Toutes les profondeurs'} · ${esc(PFCAT.find(([k]) => k === kind)?.[1] || kind)}</h2>
      <div class="row"><span class="note">Comparer :</span><button class="chip" aria-pressed="${pf.cmp === 'pos'}" data-act="pfcmp" data-v="pos">Positions (${esc(cfg.label)})</button><button class="chip" aria-pressed="${pf.cmp === 'depth'}" data-act="pfcmp" data-v="depth">Profondeurs (${esc(node.label)})</button>${[['cash', 'Cash'], ['mtt', 'Tournoi']].map(([k, l]) => `<button class="chip" aria-pressed="${pf.fmt === k}" data-act="pffmt" data-v="${k}">${l}</button>`).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px">${blocks}</div>
      <div class="legend">${legend}</div>
      <label class="f" style="max-width:220px">Repérer une main<input data-pfhl="1" value="${esc(pf.cell || '')}" placeholder="A5s" spellcheck="false" autocomplete="off"></label>
      <p class="note">Lecture : chaque grille est la matrice 13 × 13 (paires sur la diagonale, assorties au-dessus). La couleur suit les fréquences de chaque action. Clique un titre pour ouvrir cette range en grand.</p></section>`;
  }
  ACT.pfcmp = (t) => { pf.cmp = t.dataset.v || null; render(); };
  ACT.pfpick = (t) => { pf.key = t.dataset.k; pf.cmp = null; render(); };
  ACT.pffmt = (t) => { pf.fmt = t.dataset.v; pf.id = t.dataset.v === 'cash' ? 'cash100' : 'mtt20'; pf.cell = null; render(); };
  ACT.pfid = (t) => { pf.id = t.dataset.v; render(); };
  ACT.pflcell = (t) => { pf.cell = pf.cell === t.dataset.h ? null : t.dataset.h; render(); };
  ONCHANGE.push((t) => { if (t.dataset.pfhl) { const v = t.value.trim().toUpperCase().replace(/S$/, 's').replace(/O$/, 'o'); pf.cell = E.ALL169.includes(v) ? v : null; render(); return true; } });
  ONCHANGE.push((t) => { if (t.dataset.pfsel) { pf.key = t.value; pf.cell = null; render(); return true; } });

  // ---------------- Rapport agrégé à la demande : échantillon stratifié de flops résolus dans les fils de calcul ----------------
  let FLOPS = null;
  function flopSet() {
    if (FLOPS) return FLOPS;
    const canon = (cards) => { let best = null; for (const pm of PERMS) { const k = cards.map((c) => (c & ~3) | pm[c & 3]).sort((a, b) => b - a).join(','); if (best === null || k < best) best = k; } return best; };
    const PERMS = []; const pp = (a, l) => { if (!l.length) PERMS.push(a); l.forEach((x, i) => pp([...a, x], l.filter((_, j) => j !== i))); }; pp([], [0, 1, 2, 3]);
    const map = new Map();
    for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++) { const k = canon([a, b, c]); map.set(k, (map.get(k) || 0) + 1); }
    const hiName = (r) => (r === 12 ? 'A' : r === 11 ? 'K' : r === 10 ? 'Q' : r === 9 ? 'J' : r === 8 ? 'T' : '9-');
    FLOPS = [...map].map(([k, w]) => {
      const cards = k.split(',').map(Number), r = cards.map((c) => c >> 2).sort((x, y) => y - x), ns = new Set(cards.map((c) => c & 3)).size, u = [...new Set(r)], span = u[0] - u[u.length - 1];
      const t = { high: hiName(r[0]), paired: r[0] === r[1] || r[1] === r[2] ? (r[0] === r[2] ? 'brelan' : 'pairé') : 'non pairé', suits: ns === 1 ? 'monochrome' : ns === 2 ? 'deux couleurs' : 'arc-en-ciel', conn: u.length === 3 && (span <= 4 || (r[0] === 12 && r[2] <= 3 && r[1] <= 3)) ? 'connecté' : 'sec' };
      return { cards, w, t };
    });
    return FLOPS;
  }
  function stratified(NF, seed) {
    const groups = new Map(); for (const f of flopSet()) { const g = `${f.t.high}|${f.t.suits}|${f.t.paired === 'non pairé' ? 'np' : 'p'}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(f); }
    const R = E.rng(seed), pick = [];
    // Quotas au plus fort reste : exactement NF flops, répartis selon le poids réel de chaque groupe (hauteur × couleurs × paire).
    const G = [...groups.values()].map((L) => { const w = L.reduce((x, f) => x + f.w, 0), e = (w / 22100) * NF; return { L, w, q: Math.floor(e), r: e - Math.floor(e) }; });
    let left = NF - G.reduce((x, g) => x + g.q, 0); G.slice().sort((x, y) => y.r - x.r).forEach((g) => { if (left > 0) { g.q++; left--; } });
    for (const g of G) { if (!g.q) continue; const M = g.L.slice().sort(() => R() - 0.5), q = Math.min(g.q, M.length); for (let i = 0; i < q; i++) pick.push({ ...M[i], gw: g.w / q }); }
    return pick;
  }
  const FLOPSIZES = { std: ['33 75', 'Mises 33 % et 75 %'], small: ['25 50', 'Mises 25 % et 50 %'], big: ['50 100', 'Mises 50 % et 100 %'], over: ['33 125', 'Mise 33 % et overbet 125 %'] };
  const od = { scen: 'srp-CO-BB', n: 24, size: 'std', depth: 100, running: false, done: 0, total: 0, flops: [], err: '', count: 0 };
  function odStart() {
    const sc = SCEN.find((x) => x.id === od.scen); if (!sc || !window.PFPool) return;
    const [o, i] = seatsOf(sc), agg = sc.agg === o[0] ? 0 : 1, actor = agg === 1 ? 'ip' : 'oop', inv = 100 - sc.stack, stack = od.depth - inv;
    const fsz = FLOPSIZES[od.size][0];
    const sizes = { flop: [0, 1].map((p) => ({ bet: p === agg ? fsz : p === 1 ? '50' : '', raise: '60' })), turn: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }], river: [{ bet: '75', raise: '' }, { bet: '75', raise: '' }] };
    const pick = stratified(od.n, 52 + od.count);
    Object.assign(od, { running: true, done: 0, total: pick.length, flops: [], err: '', meta: { sc, o, i, actor, stack, sizes } });
    const par = Math.max(1, window.PFPool.workers()); let next = 0;
    const one = async (f) => {
      const job = window.PFPool.solve({ board: f.cards, pot: sc.pot, stack, ranges: [o[1], i[1]], sizes, maxRaises: 1, sample: { turn: 8, river: 6 } }, { pct: 1.2, maxMs: 25000 });
      try { await job.ready; const a = await job.aggregate(actor); od.flops.push({ b: f.cards.map(E.cardStr).join(''), w: f.gw, t: f.t, ...a, ex: +(job.ex ?? 0).toFixed(2) }); } catch (e) { od.err = e.message; } finally { job.free(); }
    };
    const pump = () => { while (od.running && next < pick.length && (next - od.done) < par) { const f = pick[next++]; one(f).then(() => { od.done++; if (od.done >= pick.length) odFinish(); else { pump(); if (X.getTab() === 'solveur' && sv.sub === 'agg') render(); } }); } };
    pump(); render();
  }
  function odFinish() {
    od.running = false; if (!od.flops.length) { render(); return; }
    const m = od.meta, D0 = window.AggregateData; od.count++;
    const id = 'od' + od.count, spot = `${m.sc.label}, ${od.depth} bb · ${FLOPSIZES[od.size][1].toLowerCase()} (à la demande)`;
    const actorName = m.actor === 'ip' ? m.i[0] : m.o[0], resp = m.actor === 'ip' ? m.o[0] : m.i[0];
    const D = { id, scen: m.sc.id, spot, title: m.actor === 'ip' ? `que fait ${actorName} quand ${resp} check ?` : `que fait ${actorName} (agresseur hors de position) au flop ?`, actor: m.actor, actorName, resp, cats: ['Deux paires et mieux', 'Top paire, overpair', 'Paire moyenne ou faible', 'Tirage', 'Rien'], flops: od.flops.filter((f) => f.bb), total: flopSet().length, built: new Date().toISOString().slice(0, 10), sizesTxt: FLOPSIZES[od.size][1].toLowerCase(), custom: true };
    if (D0) { D0.scenarios = D0.scenarios || [D0]; D0.scenarios.push(D); } else window.AggregateData = { ...D, scenarios: [D] };
    ag.sc = id; state.progress.solves = (state.progress.solves || 0) + od.flops.length; X.award?.('solve', null, true); X.Store.save('progress'); render();
  }
  ACT.odgo = () => odStart();
  ACT.odstop = () => { od.running = false; od.total = od.done; odFinish(); };
  ACT.odn = (t) => { od.n = +t.dataset.v; render(); };
  ACT.odsize = (t) => { od.size = t.dataset.v; render(); };
  ACT.oddepth = (t) => { od.depth = +t.dataset.v; render(); };
  ONCHANGE.push((t) => { if (t.dataset.od === 'scen') { od.scen = t.value; render(); return true; } });
  function onDemandHTML() {
    const pool = window.PFPool, w = pool ? pool.workers() : 0, est = Math.ceil((od.n * 11) / Math.max(1, w || 1) / 60);
    return `<section class="panel"><span class="eyebrow">Rapport à la demande</span><h2>Ton spot, tes tailles, ta profondeur</h2>
      <label class="f">Spot préflop<select data-od="scen">${SCTYPES.map((t) => `<optgroup label="${t}">${SCEN.filter((x) => x.type === t).map((x) => `<option value="${x.id}"${x.id === od.scen ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <div class="row"><span class="note">Tailles de l'agresseur au flop :</span>${Object.entries(FLOPSIZES).map(([k, [, l]]) => `<button class="chip" aria-pressed="${od.size === k}" data-act="odsize" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Profondeur :</span>${[40, 100, 150].map((d) => `<button class="chip" aria-pressed="${od.depth === d}" data-act="oddepth" data-v="${d}">${d} bb</button>`).join('')}<span class="note">Flops :</span>${[12, 24, 48].map((n) => `<button class="chip" aria-pressed="${od.n === n}" data-act="odn" data-v="${n}">${n}</button>`).join('')}</div>
      <div class="row">${od.running ? '<button class="btn" data-act="odstop">Arrêter et afficher</button>' : '<button class="btn primary" data-act="odgo">Calculer le rapport</button>'}<span class="note">≈ ${est} min avec ${w || 1} fil${w > 1 ? 's' : ''} de calcul (environ 11 s par flop et par fil).</span></div>
      ${od.total ? `<div class="pbar"><i style="width:${Math.round((od.done / od.total) * 100)}%"></i></div><p class="note mono">${od.done}/${od.total} flops résolus${od.running ? ' · calcul en cours…' : ''}</p>` : ''}${od.err ? `<p class="note">Un flop n'a pas pu être résolu : ${esc(od.err)}</p>` : ''}</section>`;
  }
  function aggHTML() {
    const D0 = window.AggregateData, SCs = D0 ? D0.scenarios || [D0] : [], D = SCs.find((x) => x.id === ag.sc) || SCs[0];
    if (!D || !D.flops.length) return onDemandHTML() + '<section class="panel"><p>Rapport agrégé indisponible.</p></section>';
    const F = D.flops, nA = F[0].act.length;
    const avg = (L, fn) => { const tw = L.reduce((a, f) => a + f.w, 0); return L.reduce((a, f) => a + f.w * fn(f), 0) / (tw || 1); };
    const freqRow = (L) => F[0].act.map((_, a) => avg(L, (f) => f.f[a]));
    const key = { high: (f) => f.t.high, suits: (f) => f.t.suits, paired: (f) => f.t.paired, conn: (f) => f.t.conn }[ag.group];
    const groups = {}; F.forEach((f) => (groups[key(f)] = groups[key(f)] || []).push(f));
    const order = { high: ['A', 'K', 'Q', 'J', 'T', '9-'], suits: ['arc-en-ciel', 'deux couleurs', 'monochrome'], paired: ['non pairé', 'pairé', 'brelan'], conn: ['sec', 'connecté'] }[ag.group];
    const labels = F[0].act.map((l) => l.replace(/Miser [\d,]+ \((\d+) %\)/, 'Mise $1 %'));
    const bar = (fr0) => `<span class="aggbar">${fr0.map((x, a) => `<i class="a${a}" style="width:${(x * 100).toFixed(1)}%" title="${labels[a]} ${pct(x, 0)}"></i>`).join('')}</span>`;
    const tot = freqRow(F), cov = (L) => L.reduce((a, f) => a + f.w, 0) / F.reduce((a, f) => a + f.w, 0);
    const grow = (name, L) => { const fr0 = freqRow(L), bet = 1 - fr0[0], d = bet - (1 - tot[0]); return `<tr><td>${esc(name)}</td><td class="n mono">${pct(cov(L), 0)}</td><td>${bar(fr0)}</td>${fr0.map((x) => `<td class="n mono">${pct(x, 0)}</td>`).join('')}<td class="n mono">${d >= 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(0)}</td><td class="n mono">${pct(avg(L, (f) => f.eq), 0)}</td></tr>`; };
    const catRows = D.cats.map((c, i) => `<tr><td>${esc(c)}</td><td class="n mono">${pct(avg(F, (f) => f.cat[i][0]), 0)}</td><td class="n mono">${pct(avg(F.filter((f) => f.cat[i][1] !== null), (f) => f.cat[i][1]), 0)}</td></tr>`).join('');
    const bbAct = F[0].bb.act.map((l) => l.replace(/\s*(à\s*)?[\d,]+.*$/, '')), bbRow = bbAct.map((_, a) => avg(F, (f) => f.bb.f[a] ?? 0));
    const list = F.slice().sort((a, b) => (ag.sort === 'bet' ? (1 - b.f[0]) - (1 - a.f[0]) : ag.sort === 'eq' ? b.eq - a.eq : b.w - a.w)).map((f) => `<tr><td><button class="btn small mono" data-act="agload" data-b="${f.b}">${f.b.replace(/(..)/g, '$1 ').trim()}</button></td><td class="note tx">${esc([f.t.suits, f.t.paired, f.t.conn].join(', '))}</td><td class="tb">${bar(f.f)}</td>${f.f.map((x) => `<td class="n mono">${pct(x, 0)}</td>`).join('')}<td class="n mono">${pct(f.eq, 0)}</td></tr>`).join('');
    const actor = D.actorName ? 'de ' + D.actorName : D.actor === 'oop' ? 'du 3-bettor' : 'de l\'ouvreur', resp = D.resp || 'BB', small = (F[0].act[1] || '').replace(/^Miser [\d,]+ \((\d+) %\).*$/, '$1 %');
    const scRow = SCs.length > 1 ? `<div class="row"><span class="note">Scénario :</span>${SCs.map((x) => `<button class="chip" aria-pressed="${x.id === D.id}" data-act="agsc" data-v="${x.id}">${esc(x.spot)}</button>`).join('')}</div>` : '';
    return onDemandHTML() + `<section class="panel">${scRow}<span class="eyebrow">${esc(D.spot)} · ${F.length} flops résolus sur ${D.total} distincts · pondérés par fréquence</span><h2>Rapport agrégé : ${esc(D.title || 'que fait le bouton quand la grosse blinde check ?')}</h2>
      <p class="note">Chaque flop d'un échantillon stratifié (hauteur, couleurs, paires) a été résolu par le solveur SIGMA 52 (${esc(D.sizesTxt || 'tailles 33 % et 75 %')} au flop, turn et river simplifiés à 75 %, précision ≈ 1 % du pot). La moyenne pondère chaque flop par le nombre de flops réels qu'il représente.</p>
      <div class="stats"><div class="stat hero"><span>Mise ${actor} (moyenne)</span><b>${pct(1 - tot[0], 0)}</b><span>${labels.slice(1).map((l, a) => `${l.toLowerCase()} ${pct(tot[a + 1], 0)}`).join(' · ')}</span></div>
        <div class="stat"><span>Équité ${actor}</span><b>${pct(avg(F, (f) => f.eq), 0)}</b><span>contre la range adverse</span></div>
        <div class="stat"><span>${esc(resp)} face à ${esc(small || '33 %')}</span><b>${pct(bbRow[0], 0)}</b><span>${bbAct.map((l, a) => `${l.toLowerCase()} ${pct(bbRow[a], 0)}`).join(' · ')}</span></div></div>
      <div class="row"><span class="note">Grouper par :</span>${[['high', 'Hauteur'], ['suits', 'Couleurs'], ['paired', 'Paires'], ['conn', 'Connexion']].map(([k, l]) => `<button class="chip" aria-pressed="${ag.group === k}" data-act="aggroup" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="tw"><table class="t"><thead><tr><th>Groupe</th><th class="n">Part</th><th>Stratégie</th>${labels.map((l) => `<th class="n">${esc(l)}</th>`).join('')}<th class="n">Mise vs moy. (pts)</th><th class="n">Équité</th></tr></thead><tbody>${grow('Tous les flops', F)}${order.filter((g) => groups[g]).map((g) => grow(g, groups[g])).join('')}</tbody></table></div>
      <h3>Avec quoi il mise</h3><div class="tw"><table class="t"><thead><tr><th>Catégorie de main ${actor}</th><th class="n">Part de sa range</th><th class="n">Fréquence de mise</th></tr></thead><tbody>${catRows}</tbody></table></div>
      <h3>Flop par flop</h3><div class="row"><span class="note">Trier par :</span>${[['w', 'Poids'], ['bet', 'Fréquence de mise'], ['eq', 'Équité']].map(([k, l]) => `<button class="chip" aria-pressed="${ag.sort === k}" data-act="agsort" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="tw"><table class="t aggtbl"><thead><tr><th>Flop</th><th class="tx">Texture</th><th class="tb">Stratégie</th>${labels.map((l) => `<th class="n">${esc(l)}</th>`).join('')}<th class="n">Équité</th></tr></thead><tbody>${list}</tbody></table></div>
      <p class="note">Touche un flop pour le charger dans « Résoudre un spot » et voir la stratégie main par main. Limites : deux tailles au flop, turn et river simplifiés, échantillon de flops ; les tendances par texture sont robustes, une fréquence isolée l'est moins.</p></section>`;
  }
  ACT.aggroup = (t) => { ag.group = t.dataset.v; render(); };
  ACT.agsc = (t) => { ag.sc = t.dataset.v; render(); };
  ACT.agsort = (t) => { ag.sort = t.dataset.v; render(); };
  ACT.agload = (t) => { sv.sub = 'solve'; sv.board = t.dataset.b; sv.preset = 'std'; sv.include = null; sv.extraSizes = null; { const D0 = window.AggregateData, Dx = D0 && (D0.scenarios || [D0]).find((x) => x.id === ag.sc); applyScenario(Dx?.scen || (SCEN.some((x) => x.id === ag.sc) ? ag.sc : 'srp-BTN-BB')); } sv.game = null; sv.info = null; sv.path = []; sv.err = ''; sv.note = 'Flop du rapport agrégé : lance la résolution pour le détail main par main.'; render(); };
  // Partagé avec les mains notées et la revue EV.
  X.SOLVER = { SCEN, ORDER, PRESETS, SAMPLES, seatsOf, presetSizes, handToSpot, pathFor, mergeExtraInto: (sizes, ex) => { for (const st of ST) for (let p = 0; p < 2; p++) for (const kind of ['bet', 'raise']) { const cur = String(sizes[st][p][kind] || '').split(/\s+/).filter(Boolean); for (const v of ex[st][p][kind]) if (!cur.some((c) => c !== 'a' && Math.abs(+c - v) < 1.5)) cur.push(String(v)); sizes[st][p][kind] = cur.join(' '); } return sizes; } };
  X.solverState = sv;
  X.solverStart = start;
  // Spot envoyé par un autre onglet (Table live) : ranges, board, pot, tapis, main du héros.
  X.solverLoad = (o) => {
    const bl = E.parseCards(o.board).length;
    sv.sub = 'solve'; sv.scen = 'custom'; sv.names = o.names.slice(); sv.r = o.ranges.slice(); sv.board = o.board; sv.pot = o.pot; sv.stack = o.stack; sv.include = null;
    sv.agg = 1; sv.preset = 'fast'; sv.sizes = presetSizes('fast', 1, bl); sv.sizesCustom = false; sv.maxRaises = 1; sv.extraSizes = null;
    sv.hero = o.hero || ''; sv.heroCombo = parseHero(); sv.note = o.note || ''; sv.game = null; sv.info = null; sv.path = []; sv.err = ''; sv.setupOpen = true;
    go('solveur');
  };
  X.trainerHTML = X.trainerHTML || (() => '<section class="panel"><p>Entraîneur en préparation.</p></section>');
})();
