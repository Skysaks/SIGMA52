// Analyse › Revue EV : chaque décision postflop de tes historiques recalculée au solveur et classée par EV perdue,
// familles de fuites, et chasseur d'erreurs tapis ou couché sur tes tournois.
(function () {
  const X = window.__S52, E = window.Engine, PF = window.Postflop, POOL = window.PFPool, HH = window.HH, R = window.Review;
  const { esc, fr, pct, state, Store, render, ACT, cardHTML } = X;
  const STREET = { flop: 'Flop', turn: 'Turn', river: 'River' };
  const same = (x, a, b) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a);
  const rv = { n: 20, running: false, list: [], idx: 0, active: 0, decisions: [], done: 0, skipped: 0, text: null, err: '' };
  let pfCache = { text: null, res: null };

  function candidates(text) {
    const S = X.SOLVER, out = [];
    for (const raw of HH.split(text)) {
      const h = HH.parseHand(raw); if (!h.hero || !h.heroCards || !(h.bb > 0) || h.board.length < 3) continue;
      if (!h.actions.some((a) => a.p === h.hero && a.street !== 'pre' && a.street !== 'sd' && a.type !== 'post')) continue;
      const s = S.handToSpot(h, 0); if (s.err || (s.oop !== h.hero && s.ip !== h.hero)) continue;
      const a = HH.analyzeHand(h), pot = Object.values(a.put).reduce((x, y) => x + y, 0) / h.bb;
      out.push({ h, s, pot });
    }
    return out.sort((x, y) => y.pot - x.pot);
  }
  async function reviewOne(c) {
    const S = X.SOLVER, { h, s } = c, heroP = s.oop === h.hero ? 0 : 1;
    const ranges = s.ranges.map((r) => PF.parseWeighted(r, s.board));
    if (!ranges[heroP].some((x) => same(x, h.heroCards[0], h.heroCards[1]))) ranges[heroP].push([h.heroCards[0], h.heroCards[1], 1]);
    const sizes = S.mergeExtraInto(S.presetSizes('fast', s.agg, s.board.length), s.extra);
    const cfg = { board: s.board, pot: s.pot, stack: s.stack, ranges, sizes, maxRaises: Math.max(1, s.maxR), sample: s.board.length === 3 ? S.SAMPLES.fast : null, include: s.runout };
    const job = POOL.solve(cfg, { pct: 1.5, maxMs: 20000 });
    try {
      await job.ready;
      const hi = job.hands[heroP].findIndex((x) => same(x, h.heroCards[0], h.heroCards[1])), path = [];
      for (const it of s.seq) {
        const n = await job.node(path, { [heroP]: hi });
        if (it.card) { if (n.t === 'chance') { const c = h.board[{ turn: 3, river: 4 }[it.street]]; if (c === undefined || !n.cards.includes(c)) break; path.push(c); } continue; }
        if (n.t !== 'act' || n.p !== it.p) break;
        const want = { folds: ['f'], checks: ['x'], calls: ['c'], bets: ['b', 'a'], raises: ['r', 'a'] }[it.type]; if (!want) continue;
        let a = -1, bd = Infinity;
        n.acts.forEach((x, i) => { if (!want.includes(x.k)) return; const d = it.type === 'bets' || it.type === 'raises' ? Math.abs(x.to - it.to) + (it.allin && x.k === 'a' ? -0.5 : 0) : 0; if (d < bd) { bd = d; a = i; } });
        if (a < 0) break;
        if (it.p === heroP && n.combo[heroP]) {
          const ev = n.combo[heroP].ev, best = ev.indexOf(Math.max(...ev)), loss = Math.max(0, ev[best] - ev[a]);
          const facing = n.acts.some((x) => x.k === 'f');
          rv.decisions.push({ id: h.id, raw: h.raw, cards: h.heroCards, street: it.street, board: n.board, chosen: n.acts[a].label, best: n.acts[best].label, freq: n.combo[heroP].strat[a], loss, lossPct: loss / n.pot, pot: n.pot, fam: R.leakFamily(n.acts[a].k, n.acts[best].k, facing), pos: heroP ? s.posI : s.posO, desc: s.desc });
        }
        path.push(a);
      }
      rv.done++;
    } catch (e) { rv.skipped++; }
    finally { job.free(); }
  }
  function pumpQueue() {
    const par = Math.max(1, POOL.workers());
    while (rv.running && rv.active < par && rv.idx < rv.list.length) {
      const c = rv.list[rv.idx++]; rv.active++;
      reviewOne(c).then(() => { rv.active--; if (X.getTab() === 'analyse') render(); if (rv.idx >= rv.list.length && !rv.active) finish(); else pumpQueue(); });
    }
  }
  function finish() {
    rv.running = false;
    const fams = {}; rv.decisions.forEach((d) => { if (d.lossPct > 0.005) fams[d.fam] = (fams[d.fam] || 0) + d.loss; });
    state.progress.evReview = { date: new Date().toISOString().slice(0, 10), hands: rv.done, n: rv.decisions.length, lossBB: rv.decisions.reduce((a, d) => a + d.loss, 0), fams };
    X.award?.('solve', null, true); Store.save('progress'); render();
  }
  ACT.rvstart = () => {
    const text = X.lastAnText; if (!text) { rv.err = 'Analyse d\'abord des historiques (onglet Import et statistiques).'; render(); return; }
    rv.err = ''; rv.text = text; rv.list = candidates(text).slice(0, rv.n || 1e9); rv.idx = 0; rv.active = 0; rv.decisions = []; rv.done = 0; rv.skipped = 0;
    if (!rv.list.length) { rv.err = 'Aucune main à deux joueurs après le flop avec une décision de ta part dans ces historiques.'; render(); return; }
    rv.running = true; render(); pumpQueue();
  };
  ACT.rvstop = () => { rv.running = false; rv.list = rv.list.slice(0, rv.idx); render(); };
  ACT.rvn = (t) => { rv.n = +t.dataset.v; render(); };
  ACT.rvreplay = (t) => { const d = rv.decisions[+t.dataset.i]; if (d) X.openReplay(d.raw); };
  ACT.pfreplay = (t) => { const d = pfCache.res?.errs[+t.dataset.i]; if (d) X.openReplay(d.raw); };

  const cardsTxt = (cs) => `<span class="row" style="gap:2px;display:inline-flex">${cs.map((c) => cardHTML(c, true)).join('')}</span>`;
  function postflopHTML() {
    const total = rv.list.length, D = rv.decisions, lossBB = D.reduce((a, d) => a + d.loss, 0), prev = state.progress.evReview;
    const fams = {}; D.forEach((d) => { if (d.lossPct <= 0.005) return; const f = fams[d.fam] || (fams[d.fam] = { n: 0, loss: 0 }); f.n++; f.loss += d.loss; });
    const famRows = Object.entries(fams).sort((a, b) => b[1].loss - a[1].loss);
    const byStreet = ['flop', 'turn', 'river'].map((st) => { const l = D.filter((d) => d.street === st); return [st, l.length, l.reduce((a, d) => a + d.loss, 0)]; });
    const top = D.map((d, i) => ({ ...d, i })).filter((d) => d.lossPct > 0.005).sort((a, b) => b.loss - a.loss).slice(0, 20);
    const head = `<section class="panel"><span class="eyebrow">Revue postflop au solveur</span><h2>Chaque décision de tes mains recalculée, classée par EV perdue</h2>
      <p class="note">Pour chaque main à deux joueurs après le flop : ranges préflop estimées depuis les positions, tailles réellement jouées ajoutées à l'arbre, résolution, puis ta décision comparée à la meilleure action pour ta main exacte. Environ 10 s par main, calculées dans un fil séparé.</p>
      <div class="row"><span class="note">Mains (les plus gros pots d'abord) :</span>${[[5, '5'], [20, '20'], [50, '50'], [0, 'Toutes']].map(([k, l]) => `<button class="chip" aria-pressed="${rv.n === k}" data-act="rvn" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row">${rv.running ? '<button class="btn" data-act="rvstop">Arrêter</button>' : `<button class="btn primary" data-act="rvstart">${X.lastAnText ? 'Lancer la revue' : 'Lancer la revue (analyse d\'abord des mains)'}</button>`}${X.lastAnKind === 'sample' ? '<span class="note">Données : exemple simulé (mains d\'un bot).</span>' : ''}</div>
      ${rv.err ? `<p class="pill bad" style="white-space:normal">${esc(rv.err)}</p>` : ''}
      ${total ? `<div class="pbar"><i style="width:${Math.round(((rv.done + rv.skipped) / total) * 100)}%"></i></div><p class="note mono">${rv.done + rv.skipped}/${total} mains · ${D.length} décisions notées${rv.skipped ? ` · ${rv.skipped} main${rv.skipped > 1 ? 's' : ''} non calculable${rv.skipped > 1 ? 's' : ''}` : ''}${rv.running ? ' · calcul en cours…' : ''}</p>` : prev ? `<p class="note">Dernière revue (${prev.date}) : ${prev.hands} mains, ${prev.n} décisions, ${fr(prev.lossBB, 1)} bb d'EV perdue.</p>` : ''}</section>`;
    if (!D.length) return head;
    return head + `<div class="stats"><div class="stat hero"><span>EV perdue</span><b>${fr(lossBB, 1)} bb</b><span>${fr(lossBB / Math.max(1, rv.done), 2)} bb par main revue</span></div>
        <div class="stat"><span>Décisions sans erreur</span><b>${pct(D.filter((d) => d.lossPct <= 0.02 || d.freq >= 0.25).length / D.length)}</b><span>meilleures ou correctes</span></div>
        ${byStreet.map(([st, n, l]) => `<div class="stat"><span>${STREET[st]}</span><b>${fr(l, 1)} bb</b><span>${n} décision${n > 1 ? 's' : ''}</span></div>`).join('')}</div>
      ${famRows.length ? `<section class="panel"><h2>À travailler en premier</h2>${famRows.map(([f, x], k) => `<div class="typerow"><span>${k + 1}. ${esc(f)}</span><div class="meter"><i style="width:${(x.loss / famRows[0][1].loss) * 100}%;background:var(${k === 0 ? '--bad' : '--accent'})"></i></div><span class="mono">${fr(x.loss, 1)} bb · ${x.n}</span></div>`).join('')}
        <p class="note">EV perdue cumulée par famille d'erreur (décisions qui coûtent plus de 0,5 % du pot). La première ligne est ta fuite la plus chère sur cet échantillon.</p></section>` : ''}
      <section class="panel"><h2>Les décisions les plus chères</h2><div style="display:grid">${top.map((d) => `<div style="display:grid;gap:4px;padding:9px 0;border-top:1px solid var(--line)"><div class="row" style="justify-content:space-between;gap:8px"><span class="row" style="gap:8px;align-items:center">${cardsTxt(d.cards)}<strong>${STREET[d.street]}</strong>${cardsTxt(d.board)}</span><span class="pill bad">−${fr(d.loss, 2)} bb · ${fr(d.lossPct * 100, 1)} % du pot</span></div>
          <span class="note">${esc(d.pos)} · ${esc(d.desc)} · tu as joué « ${esc(d.chosen)} » (solveur : ${pct(d.freq)} avec ta main), meilleure action « ${esc(d.best)} » · ${esc(d.fam)}</span><div class="row"><button class="btn small" data-act="rvreplay" data-i="${d.i}">Rejouer la main</button></div></div>`).join('') || '<p class="note">Aucune décision au-dessus de 0,5 % du pot perdu.</p>'}</div>
        <p class="note">Ranges préflop estimées depuis les positions : un adversaire réel peut jouer très différemment. Une décision « chère » contre l'équilibre peut être une bonne exploitation d'un joueur précis : relis la main avant de conclure.</p></section>`;
  }
  function pushFoldHTML() {
    const text = X.lastAnText; if (!text) return '';
    if (pfCache.text !== text) pfCache = { text, res: R.pushFoldReview(text) };
    const r = pfCache.res;
    if (!r.tournamentHands) return `<section class="panel"><span class="eyebrow">Tapis ou couché</span><p class="note">Aucune main de tournoi dans ces historiques. Le chasseur d'erreurs tapis ou couché s'applique aux tournois et Expresso (tapis de 20 bb ou moins).</p></section>`;
    return `<section class="panel"><span class="eyebrow">Tapis ou couché · tournois</span><h2>${r.errs.length} erreur${r.errs.length > 1 ? 's' : ''} sur ${r.spots.length} décisions à 20 bb ou moins · ${fr(r.lossBB, 1)} bb perdus</h2>
      ${r.errs.length ? `<div style="display:grid">${r.errs.slice(0, 25).map((s, i) => `<div style="display:grid;gap:4px;padding:9px 0;border-top:1px solid var(--line)"><div class="row" style="justify-content:space-between"><span><strong class="mono">${s.hand}</strong> · ${esc(s.pos)} · ${fr(s.S, 1)} bb${s.kind === 'call' ? ` · face au tapis de ${esc(s.vs)}` : ' · premier à parler'}</span><span class="pill bad">−${fr(s.loss, 2)} bb</span></div>
        <span class="note">Tu as choisi « ${{ push: 'tapis', fold: 'se coucher', call: 'payer' }[s.chosen]} », il fallait « ${{ push: 'tapis', fold: 'se coucher', call: 'payer' }[s.best]} ». ${s.kind === 'call' ? `Équité ${pct(s.eq, 0)} contre sa range, il en fallait ${pct(s.need, 0)}. ` : `EV du tapis : ${s.evs.push >= 0 ? '+' : '−'}${fr(Math.abs(s.evs.push), 2)} bb par rapport à se coucher. `}${esc(s.how)}.</span>
        <div class="row"><button class="btn small" data-act="pfreplay" data-i="${i}">Rejouer la main</button></div></div>`).join('')}</div>` : '<p>Aucune erreur de tapis ou couché : toutes tes décisions sont conformes à l\'équilibre (en jetons).</p>'}
      <p class="note">Calcul en jetons (chipEV) : près de la bulle ou en table finale, l'ICM resserre les calls ; utilise alors Outils › Push/Fold & ICM. À plusieurs joueurs, les ranges de call et de tapis sont estimées à partir de l'équilibre tête-à-tête.</p></section>`;
  }
  X.reviewHTML = () => postflopHTML() + pushFoldHTML();
})();
