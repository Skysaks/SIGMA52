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
  const SAMPLES = { fast: { turn: 8, river: 6, label: 'Rapide (8 turns × 6 rivers)' }, std: { turn: 12, river: 8, label: 'Standard (12 × 8)' }, fine: { turn: 16, river: 10, label: 'Fin (16 × 10)' } };
  const ACC = { fast: { pct: 1, label: '1 % du pot' }, std: { pct: 0.5, label: '0,5 % du pot' }, fine: { pct: 0.3, label: '0,3 % du pot' } };

  // ---------------- État ----------------
  const sv = {
    sub: 'solve', scen: 'srp-BTN-BB', names: ['BB', 'BTN'], r: ['', ''], board: 'Ks7d2c', pot: 5.5, stack: 97.5, preset: 'std', sizes: null, maxRaises: 2,
    acc: 'fast', sample: 'fast', hero: '', maxSec: 300, err: '', note: '',
    game: null, running: false, path: [], info: null, ex: null, t0: 0, elapsed: 0, lastEx: 0, cell: null, view: 'strat', paint: -1, brush: 1, target: null, showSizes: false,
  };
  function applyScenario(id) {
    const sc = SCEN.find((s) => s.id === id); if (!sc) return;
    const [o, i] = seatsOf(sc);
    sv.scen = id; sv.agg = sc.agg === o[0] ? 0 : 1; sv.names = [o[0], i[0]]; sv.r = [o[1], i[1]]; sv.pot = sc.pot; sv.stack = sc.stack;
    sv.sizes = presetSizes(sv.preset, sc.agg === o[0] ? 0 : 1, E.parseCards(sv.board).length); sv.sizesCustom = false; sv.maxRaises = PRESETS[sv.preset].maxRaises; sv.note = '';
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
    return { board, pot, stack, ranges: sv.r.slice(), sizes, maxRaises: sv.maxRaises, sample: board.length === 3 ? SAMPLES[sv.sample] : null, include: sv.include || null };
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
      return `Arbre : ${fr(est.acts, 0)} nœuds de décision · ${N[0]} et ${N[1]} combos · mémoire ≈ ${fr(mb, 0)} Mo · durée estimée ≈ ${sec < 60 ? sec + ' s' : Math.round(sec / 60) + ' min'}${est.approx ? ' · <strong>flop approché</strong> (échantillon de tirages)' : ''}${mb > 700 ? ' · <strong style="color:var(--bad)">trop gros : réduis les tailles</strong>' : ''}`;
    } catch (e) { sv.estMb = 0; return esc(e.message); }
  }
  function start() {
    try {
      const cfg = buildCfg();
      estimateText(); if (sv.estMb > 700) throw new Error('Arbre trop gros pour le navigateur : choisis des tailles « Rapide » ou un board plus avancé (turn, river).');
      sv.game = PF.create(cfg); sv.err = ''; sv.path = []; sv.info = null; sv.ex = null; sv.cell = null; sv.running = true; sv.t0 = performance.now(); sv.elapsed = 0; sv.lastEx = 0;
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
    const done = (sv.ex && sv.ex.pct <= target) || sv.elapsed > sv.maxSec;
    const pr = $('#svprog');
    if (pr) pr.innerHTML = progressHTML();
    if (done) { if (!sv.ex || sv.lastEx !== it) sv.ex = g.exploitability(); finish(); return; }
    setTimeout(chunk, 0);
  }
  function finish() {
    sv.running = false;
    state.progress.solves = (state.progress.solves || 0) + 1; X.Store.save('progress');
    if (sv.target) { try { sv.path = sv.target.seq ? pathFor(sv.game, sv.target.seq) : (sv.target.path || []).slice(); } catch (e) { sv.path = []; } }
    refreshInfo(); render();
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
  const SUBS = [['solve', 'Résoudre un spot'], ['agg', 'Rapport agrégé'], ['train', 'Entraîneur'], ['help', 'Mode d\'emploi']];
  VIEWS.solveur = () => head('Solveur', 'Calcule l\'équilibre (GTO) d\'un spot à deux joueurs après le flop : quelle action, à quelle fréquence, avec quelle main. Outil d\'étude hors table : l\'utiliser pendant une main en cours est de l\'aide en temps réel, interdite par toutes les rooms.') +
    `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${sv.sub === k}" data-act="svsub" data-s="${k}">${l}</button>`).join('')}</div>` +
    (sv.sub === 'solve' ? solveHTML() : sv.sub === 'agg' ? aggHTML() : sv.sub === 'train' ? X.trainerHTML() : helpHTML());
  ACT.svsub = (t) => { sv.sub = t.dataset.s; render(); };

  function rangeStat(txt) {
    try { const h = Array.isArray(txt) ? txt : PF.parseWeighted(txt); const w = h.reduce((a, x) => a + x[2], 0); return `${fr(w, w % 1 ? 1 : 0)} combos · ${fr(w / 1326 * 100, 1)} %`; } catch (e) { return `<span style="color:var(--bad)">${esc(e.message)}</span>`; }
  }
  function solveHTML() {
    const sc = SCEN.find((s) => s.id === sv.scen), g = sv.game;
    const scOpts = ['Pot simple', 'Pot 3-bet'].map((t) => `<optgroup label="${t}">${SCEN.filter((s) => s.type === t).map((s) => `<option value="${s.id}"${s.id === sv.scen ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</optgroup>`).join('') + `<option value="custom"${!sc ? ' selected' : ''}>Personnalisé / main importée</option>`;
    const sizeRows = ST.map((st) => `<tr><th>${st}</th>${[0, 1].map((p) => `<td><input class="mono" data-svsz="${st}.${p}.bet" value="${esc(sv.sizes[st][p].bet)}" aria-label="Mises ${st} ${sv.names[p]}" placeholder="aucune"></td><td><input class="mono" data-svsz="${st}.${p}.raise" value="${esc(sv.sizes[st][p].raise)}" aria-label="Relances ${st} ${sv.names[p]}" placeholder="aucune"></td>`).join('')}</tr>`).join('');
    const setup = `<section class="panel">
      <div class="form">
        <label class="f" style="grid-column:1/-1">Scénario préflop<select data-svf="scen">${scOpts}</select></label>
        <label class="f">Board (flop, turn ou river)<input data-svf="board" value="${esc(sv.board)}" spellcheck="false" autocomplete="off" placeholder="Ks7d2c"></label>
        <label class="f">Pot au début de la rue (bb)<input data-svf="pot" inputmode="decimal" value="${esc(sv.pot)}"></label>
        <label class="f">Tapis effectif restant (bb)<input data-svf="stack" inputmode="decimal" value="${esc(sv.stack)}"></label>
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
      <div class="row"><span class="note">Précision :</span>${Object.entries(ACC).map(([k, v]) => `<button class="chip" aria-pressed="${sv.acc === k}" data-act="svacc" data-v="${k}">${v.label}</button>`).join('')}</div>
      ${E.parseCards(sv.board).length === 3 ? `<div class="row"><span class="note">Tirages du flop :</span>${Object.entries(SAMPLES).map(([k, v]) => `<button class="chip" aria-pressed="${sv.sample === k}" data-act="svsample" data-v="${k}">${v.label}</button>`).join('')}</div>` : ''}
      <p class="note" id="svest">${estimateText()}</p>
      ${sv.err ? `<p class="pill bad" style="white-space:normal">${esc(sv.err)}</p>` : ''}
      <div class="row">${sv.running ? '<button class="btn" data-act="svstop">Arrêter et voir le résultat</button>' : '<button class="btn primary" data-act="svgo">Résoudre</button>'}${g && !sv.running ? '<button class="btn small" data-act="svreset">Nouveau spot</button>' : ''}</div>
    </section>`;
    const prog = g ? `<section class="panel" id="svprog">${progressHTML()}</section>` : '';
    return (g && !sv.running && sv.info ? resultHTML() + prog + `<details class="panel"${sv.setupOpen ? ' open' : ''}><summary data-act="svsetup"><strong>Modifier le spot</strong></summary>${setup}</details>` : setup + prog);
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
    const approx = st.approx ? `<p class="note" style="color:var(--warn)">Flop approché : turns et rivers échantillonnés (${SAMPLES[sv.sample].turn} × ${SAMPLES[sv.sample].river}). Les fréquences du flop sont une bonne indication ; pour un turn ou une river précis, utilise « Re-résoudre exactement d'ici ».</p>` : '';
    const top = `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">${r.board.length === 3 ? 'Flop' : r.board.length === 4 ? 'Turn' : 'River'} · pot ${fr(r.pot, 1)} bb · tapis ${fr(g.S - Math.max(r.C[0], r.C[1]), 1)} bb</span><span class="note mono">exploitabilité ${sv.ex ? fr(sv.ex.pct, 2) : '?'} % du pot</span></div>
      ${crumbs()}
      <div class="felt"><div class="row" style="justify-content:center;gap:16px">${cardsHTML(r.board)}</div>
      <div class="stats svs">${[0, 1].map((p) => `<div class="stat${node.t === PF.ACT && node.p === p ? ' hero' : ''}"><span>${nm(p)} · ${p ? 'IP' : 'OOP'}</span><b>${isFinite(r.eqMean[p]) ? pct(r.eqMean[p], 1) : '–'}</b><span>équité · EV ${isFinite(r.evMean[p]) ? fr(r.evMean[p], 2) + ' bb' : '–'}</span></div>`).join('')}</div></div>${approx}</section>`;
    let body = '';
    if (node.t === PF.ACT) body = actHTML(r);
    else if (node.t === PF.CHANCE) body = chanceHTML(node);
    else body = `<section class="panel"><h2>${node.t === PF.FOLD ? `${nm(1 - node.winner)} se couche : ${nm(node.winner)} remporte le pot` : 'Abattage'}</h2><p>Fin de la branche. Pot final ${fr(r.pot, 1)} bb. Reviens en arrière avec le fil d'Ariane.</p></section>`;
    return top + body;
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
      ${heroHTML(r)}${categoryHTML(r)}`;
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
  ACT.svgo = () => { sv.target = sv.pendingTarget || null; sv.pendingTarget = null; start(); };
  ACT.svstop = () => { sv.running = false; if (sv.game) { sv.ex = sv.game.exploitability(); finish(); } };
  ACT.svsetup = (t, e) => { e.preventDefault(); sv.setupOpen = !sv.setupOpen; render(); };
  ACT.svreset = () => { sv.game = null; sv.info = null; sv.path = []; sv.target = null; render(); };
  ACT.svpath = (t) => { sv.path = sv.path.slice(0, +t.dataset.k); sv.cell = null; refreshInfo(); render(); };
  ACT.svact = (t) => { sv.path.push(+t.dataset.a); sv.cell = null; refreshInfo(); render(); };
  ACT.svcard = (t) => { sv.path.push(+t.dataset.c); sv.cell = null; refreshInfo(); render(); };
  ACT.svhand = (t) => { sv.cell = sv.cell === t.dataset.h ? null : t.dataset.h; render(); };
  ACT.svview = (t) => { sv.view = t.dataset.v; render(); };
  ACT.svpreset = (t) => { sv.preset = t.dataset.v; sv.sizes = presetSizes(sv.preset, aggIdx()); sv.sizesCustom = false; sv.maxRaises = PRESETS[sv.preset].maxRaises; if (sv.extraSizes) mergeExtra(); render(); };
  ACT.svsizes = () => { sv.showSizes = !sv.showSizes; render(); };
  ACT.svacc = (t) => { sv.acc = t.dataset.v; render(); };
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
    sv.pendingTarget = { seq: s.seq };
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
      <ul><li>Il ne connaît que les ranges et les tailles que tu lui donnes. Ranges fausses = réponse fausse.</li><li>Il ne joue pas de pots à trois joueurs ou plus.</li><li>Il ignore le rake (léger biais : en vrai, payer est un peu moins rentable).</li><li>Il suppose un adversaire parfait. Contre un fish, la meilleure action s'écarte de l'équilibre : le module Élite « Exploitation » explique comment.</li></ul>
      <h2>Méthode pour retravailler une main</h2>
      <ol><li>Dans Analyse › Replayer, place-toi sur ta décision et clique « Retravailler au solveur ».</li><li>Vérifie les ranges préflop proposées, puis résous.</li><li>Le solveur s'ouvre au nœud de ta décision. Lis « Ta main » : fréquences, EV de chaque action, perte en % du pot.</li><li>Ne retiens pas « le solveur mise 62 % » : retiens <em>pourquoi</em>. Regarde quelles catégories misent, quelles mains servent de bluffs, quels bloqueurs elles ont.</li><li>Note la leçon dans ta bibliothèque (étiquette « à revoir »).</li></ol></section>`;
  }


  // ---------------- Rapport agrégé (précalculé par tools/build_aggregate.js) ----------------
  const ag = { group: 'high', sort: 'w' };
  function aggHTML() {
    const D = window.AggregateData;
    if (!D || !D.flops.length) return '<section class="panel"><p>Rapport agrégé indisponible.</p></section>';
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
    return `<section class="panel"><span class="eyebrow">${esc(D.spot)} · ${F.length} flops résolus sur ${D.total} distincts · pondérés par fréquence</span><h2>Rapport agrégé : que fait le bouton quand la grosse blinde check ?</h2>
      <p class="note">Chaque flop d'un échantillon stratifié (hauteur, couleurs, paires) a été résolu par le solveur SIGMA 52 (tailles 33 % et 75 % au flop, turn et river simplifiés à 75 %, précision ≈ 1 % du pot). La moyenne pondère chaque flop par le nombre de flops réels qu'il représente.</p>
      <div class="stats"><div class="stat hero"><span>Mise du bouton (moyenne)</span><b>${pct(1 - tot[0], 0)}</b><span>${labels.slice(1).map((l, a) => `${l.toLowerCase()} ${pct(tot[a + 1], 0)}`).join(' · ')}</span></div>
        <div class="stat"><span>Équité du bouton</span><b>${pct(avg(F, (f) => f.eq), 0)}</b><span>contre la range de défense de BB</span></div>
        <div class="stat"><span>BB face à 33 %</span><b>${pct(bbRow[0], 0)}</b><span>${bbAct.map((l, a) => `${l.toLowerCase()} ${pct(bbRow[a], 0)}`).join(' · ')}</span></div></div>
      <div class="row"><span class="note">Grouper par :</span>${[['high', 'Hauteur'], ['suits', 'Couleurs'], ['paired', 'Paires'], ['conn', 'Connexion']].map(([k, l]) => `<button class="chip" aria-pressed="${ag.group === k}" data-act="aggroup" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="tw"><table class="t"><thead><tr><th>Groupe</th><th class="n">Part</th><th>Stratégie</th>${labels.map((l) => `<th class="n">${esc(l)}</th>`).join('')}<th class="n">Mise vs moy. (pts)</th><th class="n">Équité</th></tr></thead><tbody>${grow('Tous les flops', F)}${order.filter((g) => groups[g]).map((g) => grow(g, groups[g])).join('')}</tbody></table></div>
      <h3>Avec quoi il mise</h3><div class="tw"><table class="t"><thead><tr><th>Catégorie de main du bouton</th><th class="n">Part de sa range</th><th class="n">Fréquence de mise</th></tr></thead><tbody>${catRows}</tbody></table></div>
      <h3>Flop par flop</h3><div class="row"><span class="note">Trier par :</span>${[['w', 'Poids'], ['bet', 'Fréquence de mise'], ['eq', 'Équité']].map(([k, l]) => `<button class="chip" aria-pressed="${ag.sort === k}" data-act="agsort" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="tw"><table class="t aggtbl"><thead><tr><th>Flop</th><th class="tx">Texture</th><th class="tb">Stratégie</th>${labels.map((l) => `<th class="n">${esc(l)}</th>`).join('')}<th class="n">Équité</th></tr></thead><tbody>${list}</tbody></table></div>
      <p class="note">Touche un flop pour le charger dans « Résoudre un spot » et voir la stratégie main par main. Limites : deux tailles au flop, turn et river simplifiés, échantillon de flops ; les tendances par texture sont robustes, une fréquence isolée l'est moins.</p></section>`;
  }
  ACT.aggroup = (t) => { ag.group = t.dataset.v; render(); };
  ACT.agsort = (t) => { ag.sort = t.dataset.v; render(); };
  ACT.agload = (t) => { sv.sub = 'solve'; sv.board = t.dataset.b; sv.preset = 'std'; sv.include = null; sv.extraSizes = null; applyScenario('srp-BTN-BB'); sv.game = null; sv.info = null; sv.path = []; sv.err = ''; sv.note = 'Flop du rapport agrégé : lance la résolution pour le détail main par main.'; render(); };
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
