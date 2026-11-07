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
  // Ranges de l'adversaire ajustées à ses statistiques importées (dès 30 mains) : un joueur qui paie beaucoup préflop
  // a une range de call bien plus large que la chart ; un joueur très serré ouvre moins large. Sinon : ranges des charts.
  const topHands = (lo, hi) => { const pp = window.TableSim?.preflopPct?.(); if (!pp) return null; const L = E.ALL169.filter((x, i) => pp[i] >= lo && pp[i] < hi); return L.length ? L.join(', ') : null; };
  function adjustRanges(h, s) {
    const vil = s.oop === h.hero ? s.ip : s.oop, vi = s.oop === h.hero ? 1 : 0, o = (X.getAnRes?.()?.opponents || []).find((x) => x.name === vil);
    if (!o || o.hands < 30) return { ranges: s.ranges, adj: null };
    const vpip = o.vpip / o.hands, pfr = o.pfr / o.hands, three = o.threeOpp >= 10 ? o.three / o.threeOpp : 0.06;
    const single = /ouvre, .* paie$/.test(s.desc || ''), opener = single && (s.desc || '').startsWith(vi === 0 ? s.posO : s.posI);
    const ranges = s.ranges.slice(); let adj = null;
    if (single && !opener && vpip >= 0.32) { const r = topHands(Math.min(0.2, three), Math.min(0.85, vpip * 1.1)); if (r) { ranges[vi] = r; adj = `range de call élargie à ses stats (VPIP ${Math.round(vpip * 100)} %, ${o.hands} mains)`; } }
    else if (single && opener && pfr <= 0.1) { const r = topHands(0, Math.max(0.06, pfr * 1.6)); if (r) { ranges[vi] = r; adj = `range d'ouverture resserrée à ses stats (PFR ${Math.round(pfr * 100)} %, ${o.hands} mains)`; } }
    return { ranges, adj };
  }
  async function reviewOne(c) {
    const S = X.SOLVER, { h, s } = c, heroP = s.oop === h.hero ? 0 : 1, A = adjustRanges(h, s);
    const ranges = A.ranges.map((r) => PF.parseWeighted(r, s.board));
    if (!ranges[heroP].some((x) => same(x, h.heroCards[0], h.heroCards[1]))) ranges[heroP].push([h.heroCards[0], h.heroCards[1], 1]);
    const sizes = S.mergeExtraInto(S.presetSizes('fast', s.agg, s.board.length), s.extra);
    const cfg = { board: s.board, pot: s.pot, stack: s.stack, ranges, sizes, maxRaises: Math.max(1, s.maxR), sample: s.board.length === 3 ? { turn: 8, river: 6 } : null, include: s.runout };
    const job = POOL.solve(cfg, { pct: 1.5, maxMs: 20000 });
    try {
      await job.ready;
      const hi = job.hands[heroP].findIndex((x) => same(x, h.heroCards[0], h.heroCards[1])), path = [], line = [];
      for (const it of s.seq) {
        const n = await job.node(path, { [heroP]: hi });
        if (it.card) { if (n.t === 'chance') { const c = h.board[{ turn: 3, river: 4 }[it.street]]; if (c === undefined || !n.cards.includes(c)) break; path.push(c); line.push(STREET[it.street] + ' ' + E.cardStr(c)); } continue; }
        if (n.t !== 'act' || n.p !== it.p) break;
        const want = { folds: ['f'], checks: ['x'], calls: ['c'], bets: ['b', 'a'], raises: ['r', 'a'] }[it.type]; if (!want) continue;
        let a = -1, bd = Infinity;
        n.acts.forEach((x, i) => { if (!want.includes(x.k)) return; const d = it.type === 'bets' || it.type === 'raises' ? Math.abs(x.to - it.to) + (it.allin && x.k === 'a' ? -0.5 : 0) : 0; if (d < bd) { bd = d; a = i; } });
        if (a < 0) break;
        if (it.p === heroP && n.combo[heroP]) {
          const ev = n.combo[heroP].ev, best = ev.indexOf(Math.max(...ev)), loss = Math.max(0, ev[best] - ev[a]);
          const facing = n.acts.some((x) => x.k === 'f');
          rv.decisions.push({ id: h.id, date: h.date || '', site: h.site, raw: h.raw, cards: h.heroCards, street: it.street, board: n.board, chosen: n.acts[a].label, best: n.acts[best].label, freq: n.combo[heroP].strat[a], loss, lossPct: loss / n.pot, pot: n.pot, stack: n.stack ?? null, fam: R.leakFamily(n.acts[a].k, n.acts[best].k, facing), pos: heroP ? s.posI : s.posO, vpos: heroP ? s.posO : s.posI, desc: s.desc,
            acts: n.acts.map((x) => x.label), evs: ev.slice(), strat: Array.from(n.combo[heroP].strat), ci: a, bi: best, line: line.slice(), adj: A.adj });
        }
        line.push((it.p === heroP ? 'Toi' : 'Lui') + ' : ' + n.acts[a].label);
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
    const D = rv.decisions, lossBB = D.reduce((a, d) => a + d.loss, 0), real = X.lastAnKind === 'real';
    const rec = { date: new Date().toISOString().slice(0, 10), hands: rv.done, n: D.length, lossBB, fams, real,
      pctDec: D.length ? D.reduce((a, d) => a + d.lossPct, 0) / D.length : 0, okRate: D.length ? D.filter((d) => d.lossPct <= 0.02 || d.freq >= 0.25).length / D.length : 0,
      from: D.reduce((m, d) => (d.date && (!m || d.date < m) ? d.date : m), ''), to: D.reduce((m, d) => (d.date && d.date > m ? d.date : m), '') };
    state.progress.evReview = rec;
    if (real && D.length) { const H = state.progress.evHist || (state.progress.evHist = []); H.push(rec); if (H.length > 60) H.shift(); rv.added = addReal(D); }
    X.award?.('solve', null, true); Store.save('progress'); render();
  }
  ACT.rvstart = () => {
    rv.auto = false; const text = X.lastAnText; if (!text) { rv.err = 'Analyse d\'abord des historiques (onglet Import et statistiques).'; render(); return; }
    rv.err = ''; rv.text = text; rv.list = candidates(text).slice(0, rv.n || 1e9); rv.idx = 0; rv.active = 0; rv.decisions = []; rv.done = 0; rv.skipped = 0;
    if (!rv.list.length) { rv.err = 'Aucune main à deux joueurs après le flop avec une décision de ta part dans ces historiques.'; render(); return; }
    rv.running = true; render(); pumpQueue();
  };
  // Revue automatique à l'import de mains réelles : les 30 plus gros pots à deux après le flop, en arrière-plan.
  X.onRealImport = (text) => {
    if (rv.running || state.settings.autoReview === false || !text) return;
    rv.err = ''; rv.text = text; rv.list = candidates(text).slice(0, 30); rv.idx = 0; rv.active = 0; rv.decisions = []; rv.done = 0; rv.skipped = 0; rv.added = 0; rv.auto = true;
    if (!rv.list.length) return;
    rv.running = true; pumpQueue();
  };
  X.rvState = () => ({ running: rv.running, done: rv.done + rv.skipped, total: rv.list.length, auto: !!rv.auto });
  ACT.rvauto = () => { state.settings.autoReview = state.settings.autoReview === false; Store.save('settings'); render(); };
  ACT.rvstop = () => { rv.running = false; rv.list = rv.list.slice(0, rv.idx); render(); };
  ACT.rvn = (t) => { rv.n = +t.dataset.v; render(); };
  ACT.rvreplay = (t) => { const d = rv.decisions[+t.dataset.i]; if (d) X.openReplay(d.raw); };
  ACT.pfreplay = (t) => { const d = pfCache.res?.errs[+t.dataset.i]; if (d) X.openReplay(d.raw); };

  const cardsTxt = (cs) => `<span class="row" style="gap:2px;display:inline-flex">${cs.map((c) => cardHTML(c, true)).join('')}</span>`;
  // Tes vraies erreurs (mains réelles, plus de 2 % du pot perdus) deviennent des spots en révision espacée,
  // en tête du plan du jour : on s'entraîne sur ses propres situations, pas sur des situations génériques.
  function realSpot(d) {
    const cs = (c) => E.cardStr(c), sid = 'real:' + (d.site || '') + ':' + d.id + ':' + d.street + ':' + d.board.length + ':' + (d.line || []).length;
    return { type: 'handquiz', sid, title: 'Ta vraie main · ' + STREET[d.street] + (d.date ? ' · ' + d.date.split('-').reverse().join('/') : ''),
      prompt: `${esc(d.desc || '')}. Tu es <strong>${esc(d.pos)}</strong> contre ${esc(d.vpos || 'ton adversaire')}, pot ${fr(d.pot, 1)} bb${d.stack != null ? `, tapis ${fr(d.stack, 1)} bb` : ''}. ${d.line && d.line.length ? 'Ligne : ' + esc(d.line.join(' · ')) + '. ' : ''}Que joues-tu ?`,
      cards: d.cards.slice(), board: d.board.slice(), opts: d.acts.slice(), ok: d.bi,
      why: `Tu avais joué « ${esc(d.chosen)} » (−${fr(d.loss, 2)} bb, ${fr(d.lossPct * 100, 1)} % du pot). Solveur avec ta main exacte : ${d.acts.map((o, k) => `${esc(o)} ${Math.round(d.strat[k] * 100)} % (EV ${fr(d.evs[k], 2)} bb)`).join(' · ')}. ${d.adj ? 'Adversaire : ' + esc(d.adj) + '.' : 'Ranges préflop estimées depuis les positions : relis la main si l\'adversaire était très atypique.'}` };
  }
  function addReal(D) {
    const seen = new Set(state.progress.realSeen || []); let n = 0;
    for (const d of D.slice().sort((a, b) => b.loss - a.loss)) {
      if (!d.acts || d.lossPct < 0.02 || d.freq >= 0.25) continue;
      const sp = realSpot(d); if (seen.has(sp.sid)) continue; seen.add(sp.sid); n++;
      X.logMistake?.({ src: 'Main réelle', label: `${STREET[d.street]} · ${d.board.map(E.cardStr).join(' ')} · ${d.fam}`, lossBB: d.loss, lossPct: d.lossPct, g: X.SCALE ? X.SCALE.pct(d.lossPct, d.freq) : 2, go: 'analyse', spot: sp });
    }
    state.progress.realSeen = [...seen].slice(-2000);
    return n;
  }
  X.realDue = () => state.progress.review.filter((r) => r.spot && String(r.spot.sid || '').startsWith('real:')).sort((a, b) => a.due.localeCompare(b.due));
  // Évolution : chaque revue de mains réelles est gardée ; on compare la dernière à la précédente, famille par famille.
  function trendHTML() {
    const H = (state.progress.evHist || []).filter((r) => r.real && r.n);
    if (!H.length) return '';
    const last = H[H.length - 1], prev = H[H.length - 2], max = Math.max(...H.map((r) => r.pctDec), 0.0001);
    const fam = prev ? [...new Set([...Object.keys(last.fams), ...Object.keys(prev.fams)])].map((f) => [f, (prev.fams[f] || 0) / Math.max(1, prev.hands), (last.fams[f] || 0) / Math.max(1, last.hands)]).sort((a, b) => b[2] - a[2]) : [];
    const arrow = (a, b) => (b < a * 0.85 ? '<span class="pill good">en baisse</span>' : b > a * 1.15 ? '<span class="pill bad">en hausse</span>' : '<span class="pill">stable</span>');
    return `<section class="panel"><span class="eyebrow">Évolution sur tes vraies mains</span><h2>${H.length} revue${H.length > 1 ? 's' : ''} : ${fr(last.pctDec * 100, 2)} % du pot perdu par décision${prev ? ' ' + arrow(prev.pctDec, last.pctDec) : ''}</h2>
      <div class="tw"><table class="t"><thead><tr><th>Revue</th><th>Mains jouées</th><th class="n">Mains</th><th class="n">Décisions</th><th class="n">% du pot perdu par décision</th><th class="n">Décisions correctes</th></tr></thead><tbody>
      ${H.slice(-8).reverse().map((r) => `<tr><td>${r.date}</td><td>${r.from ? r.from + (r.to && r.to !== r.from ? ' → ' + r.to : '') : '—'}</td><td class="n">${r.hands}</td><td class="n">${r.n}</td><td class="n"><span class="row" style="gap:6px;justify-content:flex-end"><span class="meter" style="width:70px"><i style="width:${(r.pctDec / max) * 100}%"></i></span>${fr(r.pctDec * 100, 2)} %</span></td><td class="n">${pct(r.okRate || 0)}</td></tr>`).join('')}</tbody></table></div>
      ${fam.length ? `<h3>Famille par famille (bb perdus par main revue)</h3><div class="tw"><table class="t"><thead><tr><th>Fuite</th><th class="n">Avant</th><th class="n">Dernière</th><th>Tendance</th></tr></thead><tbody>${fam.slice(0, 8).map(([f, a, b]) => `<tr><td>${esc(f)}</td><td class="n">${fr(a, 3)}</td><td class="n">${fr(b, 3)}</td><td>${arrow(a, b)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Une deuxième revue sur de nouvelles mains montrera si tes fuites baissent.</p>'}
      <p class="note">Indicateur principal : % du pot perdu par décision, peu sensible à la taille des pots revus. Compare des revues de taille proche (20 mains ou plus) : sur quelques dizaines de décisions, l'écart d'une revue à l'autre reste très bruité.</p></section>`;
  }
  function realHTML() {
    const due = X.realDue(), now = due.filter((r) => r.due <= X.today()).length;
    if (!due.length && !rv.added) return '';
    return `<section class="panel"><span class="eyebrow">Tes vraies erreurs</span><h2>${due.length} décision${due.length > 1 ? 's' : ''} de tes mains réelles en révision${now ? ` · ${now} à revoir aujourd'hui` : ''}</h2>
      <p class="note">${rv.added ? `${rv.added} nouvelle${rv.added > 1 ? 's' : ''} erreur${rv.added > 1 ? 's' : ''} ajoutée${rv.added > 1 ? 's' : ''} par cette revue. ` : ''}Chaque décision qui t'a coûté plus de 2 % du pot revient en spot (même board, même ligne, ta main), en tête du plan du jour, jusqu'à ce que tu la joues juste de façon durable.</p>
      <div class="row"><button class="btn primary" data-act="realdrill" ${due.length ? '' : 'disabled'}>Rejouer mes vraies erreurs</button></div></section>`;
  }
  function postflopHTML() {
    const total = rv.list.length, D = rv.decisions, lossBB = D.reduce((a, d) => a + d.loss, 0), prev = state.progress.evReview;
    const fams = {}; D.forEach((d) => { if (d.lossPct <= 0.005) return; const f = fams[d.fam] || (fams[d.fam] = { n: 0, loss: 0 }); f.n++; f.loss += d.loss; });
    const famRows = Object.entries(fams).sort((a, b) => b[1].loss - a[1].loss);
    const byStreet = ['flop', 'turn', 'river'].map((st) => { const l = D.filter((d) => d.street === st); return [st, l.length, l.reduce((a, d) => a + d.loss, 0)]; });
    const top = D.map((d, i) => ({ ...d, i })).filter((d) => d.lossPct > 0.005).sort((a, b) => b.loss - a.loss).slice(0, 20);
    const head = `<section class="panel"><span class="eyebrow">Revue postflop au solveur</span><h2>Chaque décision de tes mains recalculée, classée par EV perdue</h2>
      <p class="note">Pour chaque main à deux joueurs après le flop : ranges préflop estimées depuis les positions (et, dès 30 mains observées, ajustées aux statistiques de l'adversaire : un joueur qui paie beaucoup a une range de call plus large, un joueur très serré ouvre moins large), tailles réellement jouées ajoutées à l'arbre, résolution, puis ta décision comparée à la meilleure action pour ta main exacte. Environ 10 s par main, calculées dans un fil séparé.</p>
      <div class="row"><span class="note">Mains (les plus gros pots d'abord) :</span>${[[5, '5'], [20, '20'], [50, '50'], [0, 'Toutes']].map(([k, l]) => `<button class="chip" aria-pressed="${rv.n === k}" data-act="rvn" data-v="${k}">${l}</button>`).join('')}</div>
      <label class="row note" style="gap:6px"><input type="checkbox" data-act="rvauto" ${state.settings.autoReview === false ? '' : 'checked'}> Revue automatique des 30 plus gros pots à chaque import de mains réelles</label>
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
          <span class="note">${esc(d.pos)} · ${esc(d.desc)}${d.adj ? ' · ' + esc(d.adj) : ''} · tu as joué « ${esc(d.chosen)} » (solveur : ${pct(d.freq)} avec ta main), meilleure action « ${esc(d.best)} » · ${esc(d.fam)}</span><div class="row"><button class="btn small" data-act="rvreplay" data-i="${d.i}">Rejouer la main</button></div></div>`).join('') || '<p class="note">Aucune décision au-dessus de 0,5 % du pot perdu.</p>'}</div>
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
  X.reviewHTML = () => realHTML() + postflopHTML() + trendHTML() + pushFoldHTML();
  X.realSpot = realSpot; X.addReal = addReal;
})();
