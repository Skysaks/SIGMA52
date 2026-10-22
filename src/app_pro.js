// Carrière (critères de passage pro, simulateur de carrière sur 12 mois), Mental (check-in, carte de tilt, fiches de correction,
// coût du tilt), Elo et ligue de la semaine (Profil, Aujourd'hui). Les gains d'XP et d'Elo arrivent par X.award().
(function () {
  const X = window.__S52, PR = window.Pro, CH = window.Champions, S = window.Spots;
  const { $, esc, fr, eur, sgn, pct, state, Store, render, go, head, VIEWS, AFTER, ACT, ONCHANGE, drawLines } = X;
  const prog = () => state.progress;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const num = (v) => { const x = +String(v ?? '').replace(/\s/g, '').replace(',', '.').replace('−', '-'); return Number.isFinite(x) ? x : 0; };
  const mental = () => { const m = state.mental; m.triggers = m.triggers || []; m.custom = m.custom || []; m.fiches = m.fiches || {}; m.zones = m.zones || {}; m.checkins = m.checkins || []; m.stop = m.stop || 'net'; return m; };

  // ================= Elo, ligue, XP =================
  const elo = () => prog().elo || (prog().elo = { r: 1000, n: 0, hist: [] });
  function league() {
    const L = prog().league || (prog().league = { week: '', div: 0, xp: 0, hist: [] });
    const res = PR.leagueRoll(L);
    if (res) L.notice = { ...res, week: L.hist[L.hist.length - 1]?.week };
    return L;
  }
  const levelOf = (champ) => { if (!champ) return null; if (champ.legends) return 'Difficile'; return CH?.STYLES?.find((s) => s.id === champ.id)?.level || null; };
  X.award = (kind, d, noSave) => {
    const L = league(), x = PR.XP, day = today(); d = d || {};
    let xp = 0;
    if (kind === 'spot') { xp = x.spot + (d.ok ? x.spotOk : 0); PR.eloUpdate(elo(), PR.SPOT_D[d.type] ?? 1200, d.ok ? 1 : 0, day); }
    else if (kind === 'decision') { xp = x.decision + (d.ok ? x.decisionOk : 0); const c = d.cats?.[0]; if (c) PR.eloUpdate(elo(), (PR.DEC_D[c] ?? 1200) + (PR.LEVEL_BONUS[levelOf(d.champ)] || 0), d.ok ? 1 : 0, day); }
    else xp = x[kind] || 0;
    L.xp = (L.xp || 0) + xp;
    if (!noSave) Store.save('progress');
    return xp;
  };
  const DIV_COL = ['#A8714A', '#9AA3AD', '#C9A227', '#5FA3A8', '#7C6CD6'];
  const divBadge = (div) => `<span class="pill" style="border-color:${DIV_COL[div]};color:${DIV_COL[div]};font-weight:600">${PR.DIVS[div]}</span>`;
  function weekEnds() { const d = new Date(), left = (1 - PR.weekFrac(d)) * 168; return left >= 24 ? `${Math.floor(left / 24)} j ${Math.round(left % 24)} h` : `${Math.max(1, Math.round(left))} h`; }
  function noticeHTML(L) {
    const n = L.notice; if (!n) return '';
    const txt = n.move > 0 ? `montée en ${PR.DIVS[n.to]}` : n.move < 0 ? `descente en ${PR.DIVS[n.to]}` : `maintien en ${PR.DIVS[n.to]}`;
    return `<div class="warnbox" role="status"><strong>Semaine terminée :</strong> ${n.rank}<sup>e</sup> sur ${PR.SIZE}, ${txt}. <button class="btn small" data-act="lgok">OK</button></div>`;
  }
  ACT.lgok = () => { delete league().notice; Store.save('progress'); render(); };
  function leagueHTML(full) {
    const L = league(), st = PR.standings(L), me = st.find((r) => r.me), top = L.div < PR.DIVS.length - 1, bottom = L.div > 0;
    const rows = st.map((r) => {
      const zone = top && r.rank <= PR.PROMOTE ? 'var(--good-bg)' : bottom && r.rank > PR.SIZE - PR.DEMOTE ? 'var(--bad-bg)' : '';
      return `<tr style="${zone ? 'background:' + zone + ';' : ''}${r.me ? 'font-weight:700' : ''}"><td class="n mono">${r.rank}</td><td>${esc(r.name)}${r.me ? '' : ' <span class="note">(simulé)</span>'}</td><td class="n mono">${r.xp}</td></tr>`;
    }).join('');
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Ligue de la semaine · se termine dans ${weekEnds()}</span><h2 style="margin-top:4px">${divBadge(L.div)} ${me.rank}<sup>e</sup> sur ${PR.SIZE} · ${L.xp || 0} XP</h2></div></div>
      ${noticeHTML(L)}
      <p class="note">Les ${PR.PROMOTE} premiers montent${top ? '' : ' (tu es dans la division la plus haute)'}, les ${PR.DEMOTE} derniers descendent${bottom ? '' : ' (le Bronze ne descend pas)'}. Les autres joueurs sont simulés : leur XP suit une progression réaliste de la semaine. La ligue entre amis réels viendra avec les parties en ligne.</p>
      ${full ? `<div class="tw"><table class="t"><thead><tr><th class="n">#</th><th>Joueur</th><th class="n">XP</th></tr></thead><tbody>${rows}</tbody></table></div>
      <details><summary class="note">Gagner de l'XP</summary><p class="note">Spot 10 XP (+5 si juste) · décision notée au simulateur 4 (+2) · main jouée 1 · module validé 40 · examen réussi 120 · session Champions 30 · spot résolu au solveur 15 · entraîneur river 8 · révision 3.</p></details>
      ${L.hist?.length ? `<p class="note">Semaines passées : ${L.hist.slice(-8).map((h) => `${PR.DIVS[h.div]} ${h.rank}<sup>e</sup>${h.move > 0 ? ' ↑' : h.move < 0 ? ' ↓' : ''}`).join(' · ')}</p>` : ''}` : ''}</section>`;
  }
  function eloHTML() {
    const E = elo(), hist = prog().hist || {}, types = S?.TYPES || {};
    const rows = Object.entries(types).filter(([k]) => (hist[k] || []).length >= 10).map(([k, l]) => {
      const h = hist[k], acc = Math.min(0.97, Math.max(0.03, h.reduce((a, b) => a + b, 0) / h.length)), d = PR.SPOT_D[k] ?? 1200;
      return { l, acc, lvl: Math.round(d + 400 * Math.log10(acc / (1 - acc))) };
    }).sort((a, b) => a.lvl - b.lvl);
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Classement Elo${E.n < 30 ? ' · provisoire' : ''}</span><h2 style="margin-top:4px">${Math.round(E.r)} · ${PR.eloTitle(E.r)}</h2></div><span class="note mono">record ${Math.round(E.best || E.r)} · ${E.n} résultats</span></div>
      ${(E.hist || []).length >= 2 ? '<canvas id="eloc" height="150" aria-label="Évolution de ton Elo"></canvas>' : ''}
      <p class="note">Chaque spot et chaque décision notée au simulateur est un match contre une difficulté fixe : tu gagnes plus de points sur les exercices difficiles (combinaisons, bounty, situations) et sur les décisions face aux champions difficiles. À l'équilibre, ton Elo reflète ton taux de réussite. Paliers : 1 000 Amateur, 1 200 Régulier, 1 400 Fort, 1 600 Expert, 1 800 Élite.</p>
      ${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>Exercice</th><th class="n">Réussite</th><th class="n">Niveau équivalent</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.l)}</td><td class="n">${pct(r.acc)}</td><td class="n mono">${r.lvl}</td></tr>`).join('')}</tbody></table></div><p class="note">Du plus faible au plus fort, sur tes 30 dernières réponses : le haut du tableau est ce qui freine ton Elo.</p>` : ''}</section>`;
  }
  function medalHTML() {
    const s = X.streak ? X.streak() : 0, m = PR.medalOf(s);
    const col = { Bronze: DIV_COL[0], Argent: DIV_COL[1], Or: DIV_COL[2] };
    return `<span class="pill" ${m.got ? `style="border-color:${col[m.got]};color:${col[m.got]};font-weight:600"` : ''}>Série ${s} j${m.got ? ' · médaille ' + m.got : ''}</span>${m.next ? `<span class="note">${m.next.name} dans ${m.next.left} jour${m.next.left > 1 ? 's' : ''}</span>` : ''}`;
  }
  const baseProfil = VIEWS.profil;
  VIEWS.profil = () => {
    const html = baseProfil();
    const add = `<section class="panel"><div class="row">${medalHTML()}</div><p class="note">Médailles de série : Bronze à 7 jours d'affilée, Argent à 30, Or à 100. Un jour compte dès que tu enregistres une progression.</p></section>` + leagueHTML(true) + eloHTML();
    return html.replace('<section class="panel"><h2>Détail du score</h2>', add + '<section class="panel"><h2>Détail du score</h2>');
  };
  AFTER.profil = () => { const cv = $('#eloc'), h = elo().hist || []; if (cv && h.length >= 2) drawLines(cv, [{ pts: h.map((x) => x[1]) }], { zero: false, fmt: (v) => fr(v, 0) }); };
  const baseJour = VIEWS.jour;
  VIEWS.jour = () => {
    const html = baseJour(), L = league(), st = PR.standings(L), me = st.find((r) => r.me), E = elo(), ci = mental().checkins.find((c) => c.date === today());
    const card = `${noticeHTML(L)}<section class="panel"><div class="row" style="justify-content:space-between;align-items:center"><div class="row" style="gap:10px;align-items:center">${divBadge(L.div)}<strong>${me.rank}<sup>e</sup>/${PR.SIZE}</strong><span class="note mono">${L.xp || 0} XP</span><span class="note">·</span><strong>Elo ${Math.round(E.r)}</strong><span class="note">${PR.eloTitle(E.r)}</span>${medalHTML()}</div>
      <div class="row"><button class="btn small${ci ? '' : ' primary'}" data-tab="mental">${ci ? 'Check-in : ' + { go: 'feu vert', short: 'session courte', stop: 'pas de session' }[ci.level] : 'Check-in avant session'}</button><button class="btn small" data-tab="profil">Classement</button></div></div></section>`;
    return html.replace('<div class="warnbox"><strong>Fair-play.</strong>', card + '<div class="warnbox"><strong>Fair-play.</strong>');
  };

  // ================= Carrière =================
  let csim = null, simCache = null;
  function commonStake(ss) {
    const n = {}; ss.filter((s) => s.format === 'Cash' && /^NL\d+$/.test(s.stake)).slice(-30).forEach((s) => (n[s.stake] = (n[s.stake] || 0) + (s.hands || 1)));
    return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }
  function stakeName() { const js = X.journalStats(); return state.settings.proStake || commonStake(js.ss) || 'NL10'; }
  function simDefaults() {
    const js = X.journalStats();
    return { bank: Math.max(0, Math.round(js.bank)) || 1000, stake: PR.stakeIndex(stakeName()), wr: js.wr !== null ? Math.round(js.wr * 10) / 10 : 3, sd: Math.round(js.sd), rule: +state.settings.biRule || 40, down: 25, drop: 1.5 };
  }
  function runSim() {
    csim = csim || simDefaults();
    const st = state.settings, P = { ...csim, hoursMonth: num(st.hoursMonth), handsHour: num(st.handsHour), expenses: num(st.expenses), target: num(st.target), paths: 2000, seed: 11 };
    const key = JSON.stringify(P);
    if (!simCache || simCache.key !== key) simCache = { key, res: PR.careerSim(P) };
    return simCache.res;
  }
  const STATUS = { ok: ['good', 'Atteint'], near: ['', 'Proche'], no: ['bad', 'Pas encore'], na: ['', 'À renseigner'] };
  function fmtCrit(c) {
    const v = c.val; if (v === null || v === undefined) return '—';
    switch (c.k) {
      case 'volume': return Math.round(v).toLocaleString('fr-FR') + ' mains';
      case 'proof': return sgn(v, 1) + ' bb/100';
      case 'hourly': return eur(v) + '/h';
      case 'caves': return fr(v, 0) + ' caves';
      case 'ror': return pct(v, v < 0.01 ? 2 : 1);
      case 'fund': return fr(v, 1) + ' mois';
      case 'hours': return fr(v, 0) + ' h';
      case 'tilt': return pct(v);
      case 'study': return v + '/6';
      case 'sim': return 'ruine ' + pct(v, 1);
      default: return String(v);
    }
  }
  VIEWS.carriere = () => {
    const js = X.journalStats(), st = state.settings, name = stakeName(), bbv = PR.STAKES[PR.stakeIndex(name)][1], sim = runSim();
    const exams = Object.values(prog().exams || {}).filter((r) => r.passed).length;
    const C = PR.proCriteria({ hands: js.hands, wr: js.wr, ci: js.ci, sd: js.sd, bank: js.bank, bbValue: bbv, handsHour: num(st.handsHour), hoursMonth: num(st.hoursMonth), target: num(st.target), expenses: num(st.expenses), savings: num(st.savings), hours: js.mins / 60, sessions: js.ss, exams, sim });
    const verdict = { ready: ['good', 'Critères réunis'], close: ['acc', 'En approche'], not: ['bad', 'Pas encore prêt'] }[C.verdict];
    const vtxt = C.verdict === 'ready' ? 'Tous les critères sont réunis. Un passage pro se tente d\'abord en essai de 3 mois, avec une règle de retour écrite à l\'avance (par exemple : winrate sous la borne basse ou bankroll sous 30 caves).'
      : C.verdict === 'close' ? `${C.ok} critères sur ${C.n}, et aucun critère bloquant ne manque. Comble les derniers avant de quitter un revenu stable.`
      : `${C.ok} critère${C.ok > 1 ? 's' : ''} sur ${C.n}. Les critères bloquants (★) passent en premier : sans eux, vivre du poker revient à parier son loyer sur la variance.`;
    const todo = C.list.filter((c) => c.st !== 'ok').sort((a, b) => b.critical - a.critical);
    const field = (k, l, ph) => `<label class="f">${l}<input id="pf_${k}" data-pset="${k}" inputmode="decimal" value="${st[k] || ''}" placeholder="${ph}"></label>`;
    const sfield = (k, l) => `<label class="f">${l}<input id="cs_${k}" data-csim="${k}" inputmode="decimal" value="${csim[k]}"></label>`;
    const endRows = sim.stakesEnd.map((f, i) => [PR.STAKES[i][0], f]).filter(([, f]) => f >= 0.005).concat(sim.pRuin >= 0.005 ? [['Ruiné', sim.pRuin]] : []);
    return head('Carrière', 'Les critères pour vivre du poker, calculés depuis ton Journal, et 2 000 carrières simulées sur 12 mois avec tes chiffres.') + `
      <section class="panel"><span class="eyebrow">Ta situation</span><div class="form">
        ${field('expenses', 'Dépenses mensuelles (€)', '1 500')}${field('savings', 'Fonds de vie hors bankroll (€)', '9 000')}${field('target', 'Revenu mensuel visé (€)', '2 000')}
        ${field('hoursMonth', 'Heures de jeu par mois', '120')}${field('handsHour', 'Mains par heure (toutes tables)', '300')}
        <label class="f">Limite visée<select id="pf_stake" data-pset="proStake"><option value="">Auto (${esc(commonStake(js.ss) || 'NL10')})</option>${PR.STAKES.map(([n]) => `<option${st.proStake === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <p class="note">Bankroll, winrate, écart-type et heures viennent de ton Journal (${js.ss.length} sessions, ${js.hands.toLocaleString('fr-FR')} mains cash). Mains par heure : environ 75 par table en ligne en 6 joueurs, 30 en live.</p></section>
      <section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Passage pro · ${name}</span><h2 style="margin-top:4px">${C.ok}/${C.n} critère${C.ok > 1 ? 's' : ''}</h2></div><span class="pill ${verdict[0]}">${verdict[1]}</span></div>
        <div class="meter"><i style="width:${C.ok / C.n * 100}%"></i></div><p>${vtxt}</p>
        <div style="display:grid">${C.list.map((c) => `<div style="display:grid;gap:2px;padding:9px 0;border-top:1px solid var(--line)"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;gap:10px"><strong>${esc(c.label)}${c.critical ? ' ★' : ''}</strong><span class="pill ${STATUS[c.st][0]}" style="white-space:nowrap">${STATUS[c.st][1]}</span></div><span class="note"><span class="mono" style="color:var(--ink)">${fmtCrit(c)}</span> · repère : ${esc(c.need)}</span></div>`).join('')}</div>
        ${todo.length ? `<h3>Le plus court chemin</h3><ol class="note" style="margin:0;padding-left:1.3em;display:grid;gap:6px">${todo.map((c) => `<li><strong style="color:var(--ink)">${esc(c.label)}</strong> : ${esc(c.tip)}</li>`).join('')}</ol>` : ''}
        <p class="note">★ critère bloquant. Ces repères sont des conventions prudentes de joueurs professionnels, pas des garanties : un winrate passé peut baisser quand le jeu se durcit.</p></section>
      <section class="panel"><span class="eyebrow">Simulateur de carrière · 12 mois · 2 000 trajectoires</span><h2>${pct(1 - sim.pRuin, 1)} de carrières sans ruine, objectif atteint ${pct(sim.pTarget)}</h2>
        <div class="form">${sfield('bank', 'Bankroll de départ (€)')}${sfield('wr', 'Winrate (bb/100)')}${sfield('sd', 'Écart-type (bb/100)')}
          <label class="f">Limite de départ<select id="cs_stake" data-csim="stake">${PR.STAKES.map(([n], i) => `<option value="${i}"${+csim.stake === i ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
          ${sfield('rule', 'Monter à (caves de la limite suivante)')}${sfield('down', 'Redescendre sous (caves)')}${sfield('drop', 'Winrate perdu par limite montée (bb/100)')}</div>
        <div class="row"><button class="btn small" data-act="csreset">Reprendre mes chiffres du Journal</button></div>
        <div class="stats">
          <div class="stat"><span>Risque de ruine</span><b style="color:var(${sim.pRuin > 0.15 ? '--bad' : sim.pRuin > 0.05 ? '--warn' : '--good'})">${pct(sim.pRuin, 1)}</b><span>bankroll sous 20 € avant 12 mois</span></div>
          <div class="stat"><span>Gain mensuel médian</span><b>${eur(sim.income.p50)}</b><span>10 % des cas sous ${eur(sim.income.p10)}, 10 % au-dessus de ${eur(sim.income.p90)}</span></div>
          <div class="stat"><span>Objectif ${eur(num(st.target))}/mois</span><b>${pct(sim.pTarget)}</b><span>des carrières l'atteignent en moyenne</span></div>
          <div class="stat"><span>Bankroll à 12 mois</span><b>${eur(sim.final.p50)}</b><span>après retraits · ${eur(sim.final.p10)} à ${eur(sim.final.p90)}</span></div>
          <div class="stat"><span>Mois perdants</span><b>${fr(sim.losingMonths, 1)}</b><span>sur 12 en moyenne</span></div></div>
        <canvas id="carc" height="240" aria-label="Évolution de la bankroll simulée, du mois 0 au mois 12"></canvas>
        <p class="note">Ligne épaisse : trajectoire médiane. Bandes : 25-75 % et 10-90 % des carrières, du mois 0 au mois 12, dépenses (${eur(num(st.expenses))}) retirées chaque mois. ${sim.handsMonth.toLocaleString('fr-FR')} mains par mois.</p>
        <h3>Limite jouée au bout de 12 mois</h3>${endRows.map(([n, f]) => `<div class="typerow"><span>${n}</span><div class="meter"><i style="width:${f * 100}%;${n === 'Ruiné' ? 'background:var(--bad)' : ''}"></i></div><span class="mono">${pct(f)}</span></div>`).join('')}
        <p class="note">Modèle : 4 blocs de mains par mois, gain tiré selon ton winrate et ton écart-type, montée dès que la bankroll couvre la règle de caves de la limite suivante, descente sous le seuil. Le winrate baisse quand tu montes (adversaires plus forts). Ce n'est pas une prévision : c'est la dispersion que ta variance rend possible.</p></section>`;
  };
  AFTER.carriere = () => {
    const cv = $('#carc'); if (!cv || !simCache) return;
    const f = simCache.res.fan, line = (q, o) => ({ pts: f.map((x) => x[q]), ...o });
    drawLines(cv, [line(0, { alpha: 0.35, width: 1 }), line(4, { alpha: 0.35, width: 1 }), line(1, { alpha: 0.6, width: 1.5 }), line(3, { alpha: 0.6, width: 1.5 }), line(2, { width: 3 })], { fmt: (v) => fr(v, 0) + ' €' });
  };
  ACT.csreset = () => { csim = simDefaults(); render(); };
  ONCHANGE.push((t) => {
    if (t.dataset.pset) { const k = t.dataset.pset; state.settings[k] = k === 'proStake' ? t.value : num(t.value); Store.save('settings'); if (k === 'proStake') csim = null; render(); return true; }
    if (t.dataset.csim) { csim = csim || simDefaults(); csim[t.dataset.csim] = num(t.value); render(); return true; }
  });

  // ================= Mental =================
  const preset = (id) => PR.TRIGGERS.find((x) => x.id === id);
  X.tiltTriggers = () => { const m = mental(); return [...m.triggers.map((id) => preset(id)).filter(Boolean).map((x) => ({ id: x.id, label: x.label })), ...m.custom]; };
  const trigLabel = (id) => preset(id)?.label || mental().custom.find((c) => c.id === id)?.label || id;
  const fiche = (id) => { const m = mental(), p = preset(id); return [0, 1, 2, 3, 4].map((k) => m.fiches[id]?.[k] ?? p?.fiche[k] ?? ''); };
  const zone = (z) => { const m = mental(), d = PR.ZONES.find((x) => x.id === z); return { signs: m.zones[z]?.signs ?? d.signs, resp: m.zones[z]?.resp ?? d.resp }; };
  const ci = { sleep: 0, energy: 0, calm: 0, focus: 0, money: false };
  const CI_Q = [['sleep', 'Sommeil', 'mauvais', 'excellent'], ['energy', 'Énergie', 'à plat', 'en forme'], ['calm', 'Calme', 'énervé', 'serein'], ['focus', 'Concentration', 'dispersé', 'focalisé']];
  const CI_LV = { go: ['good', 'Feu vert', 'Session normale : durée prévue à l\'avance, stop-loss à 3 caves, SIGMA 52 fermé pendant le jeu.'], short: ['acc', 'Session courte', '45 minutes au plus, une table de moins que d\'habitude, stop-loss à 2 caves.'], stop: ['bad', 'Pas de session aujourd\'hui', 'Travail hors table à la place : 20 minutes de spots, une main à revoir au solveur ou un module.'] };
  function costHTML() {
    const ss = state.journal.sessions;
    if (ss.length < 3) return '<p class="note">Note le tilt ressenti et le déclencheur à chaque session dans le Journal : dès quelques sessions, ce tableau montre ce que le tilt te coûte.</p>';
    const grp = (keyFn, labels) => {
      const g = {}; ss.forEach((s) => { const k = keyFn(s); if (k === null) return; const x = g[k] || (g[k] = { n: 0, res: 0, bb: 0, hands: 0 }); x.n++; x.res += s.result; const bb = X.bbOf(s.stake); if (s.format === 'Cash' && bb && s.hands) { x.bb += s.result / bb; x.hands += s.hands; } });
      return Object.entries(g).map(([k, x]) => `<tr><td>${esc(labels(k))}</td><td class="n">${x.n}</td><td class="n" style="color:var(${x.res >= 0 ? '--good' : '--bad'})">${eur(x.res / x.n)}</td><td class="n">${x.hands ? sgn(x.bb / x.hands * 100, 1) : '—'}</td></tr>`).join('');
    };
    const head2 = '<thead><tr><th></th><th class="n">Sessions</th><th class="n">Moyenne</th><th class="n">bb/100</th></tr></thead>';
    const byTrig = grp((s) => s.trigger || null, trigLabel);
    return `<div class="grid2"><div class="tw"><table class="t">${head2}<tbody>${grp((s) => String(s.tilt || 0), (k) => ['Sans tilt', 'Tilt léger', 'Tilt net', 'Tilt fort'][+k])}</tbody></table></div>
      ${byTrig ? `<div class="tw"><table class="t">${head2}<tbody>${byTrig}</tbody></table></div>` : '<p class="note">Aucun déclencheur noté pour l\'instant : choisis-le dans le Journal à chaque session.</p>'}</div>
      <p class="note">Résultat moyen par session et winrate cash selon le tilt noté. Sur peu de sessions, la variance domine : regarde la tendance, pas les centimes.</p>`;
  }
  const openF = new Set();
  document.addEventListener('toggle', (e) => { const d = e.target; if (d?.dataset?.fid) { if (d.open) openF.add(d.dataset.fid); else openF.delete(d.dataset.fid); } }, true);
  function cardInner() {
    const sel = X.tiltTriggers(), m = mental();
    return (sel.map((x) => `<div><strong>${esc(x.label)}</strong> → ${esc(fiche(x.id)[3])}</div>`).join('') || '<div>Choisis au moins un déclencheur.</div>') +
      PR.ZONES.map((z) => `<div><strong>Tilt ${z.label.toLowerCase()}</strong> : ${esc(zone(z.id).signs)} → ${esc(zone(z.id).resp)}</div>`).join('') +
      `<div><strong>Règle d'arrêt</strong> : fin de session dès le tilt ${m.stop === 'fort' ? 'fort' : 'net'}.</div>`;
  }
  VIEWS.mental = () => {
    const m = mental(), sel = X.tiltTriggers(), done = CI_Q.every(([k]) => ci[k] > 0), res = done ? PR.checkin(ci, state.journal.sessions, today()) : null, todayCi = m.checkins.find((c) => c.date === today());
    const ciRow = ([k, l, lo, hi]) => `<div style="display:grid;gap:4px"><span>${l} <span class="note">(1 = ${lo}, 5 = ${hi})</span></span><div class="row">${[1, 2, 3, 4, 5].map((v) => `<button class="chip" style="min-width:44px" aria-pressed="${ci[k] === v}" data-act="cisel" data-k="${k}" data-v="${v}" aria-label="${l} ${v} sur 5">${v}</button>`).join('')}</div></div>`;
    const ficheHTML = (x) => { const f = fiche(x.id); return `<details class="panel" data-fid="${esc(x.id)}"${openF.has(x.id) ? ' open' : ''}><summary><strong>${esc(x.label)}</strong>${f[3] ? ` · <span class="note">${esc(f[3])}</span>` : ' · <span class="note">fiche à écrire</span>'}</summary>
      <div style="display:grid;gap:8px;margin-top:10px">${PR.FICHE_STEPS.map((stp, k) => `<label class="f">${k + 1}. ${stp}<textarea rows="3" data-fiche="${esc(x.id)}:${k}" maxlength="400">${esc(f[k])}</textarea></label>`).join('')}
      <div class="row">${preset(x.id) ? `<button class="btn small" data-act="ficreset" data-id="${esc(x.id)}">Revenir au texte proposé</button>` : ''}<button class="btn small" data-act="trigdel" data-id="${esc(x.id)}">Retirer ce déclencheur</button></div></div></details>`; };
    const hist = m.checkins.slice(-14);
    return head('Mental', 'Le check-in avant de jouer, ta carte de tilt et ce que le tilt te coûte. À préparer à froid : pendant une session, on ne fait qu\'appliquer.') + `
      <section class="panel"><span class="eyebrow">Check-in avant session${todayCi ? ' · fait aujourd\'hui' : ''}</span><h2>Es-tu en état de jouer ?</h2>
        ${CI_Q.map(ciRow).join('')}
        <label class="check"><input type="checkbox" data-act="cimoney" ${ci.money ? 'checked' : ''}><span>J'ai besoin de gagner aujourd'hui (loyer, perte à rattraper, objectif)</span></label>
        ${res ? `<div class="warnbox" style="border-color:var(--${CI_LV[res.level][0] === 'good' ? 'good' : CI_LV[res.level][0] === 'bad' ? 'bad' : 'accent'})"><strong>${CI_LV[res.level][1]}</strong> (${res.score}/20). ${CI_LV[res.level][2]}${res.reasons.length ? '<br>' + res.reasons.map(esc).join('<br>') : ''}${m.triggers.length || m.custom.length ? `<br><span class="note">Relis ta carte ci-dessous avant de lancer la session.</span>` : ''}</div>
          <div class="row"><button class="btn primary" data-act="cisave">Enregistrer le check-in</button></div>` : '<p class="note">Réponds aux quatre questions : le verdict apparaît ici.</p>'}
        ${hist.length ? `<div class="row" style="gap:4px;align-items:center"><span class="note">14 derniers :</span>${hist.map((c) => `<span title="${c.date} · ${c.score}/20" style="width:14px;height:14px;border-radius:3px;display:inline-block;background:var(--${c.level === 'go' ? 'good' : c.level === 'stop' ? 'bad' : 'warn'})"></span>`).join('')}</div>` : ''}</section>
      <section class="panel"><span class="eyebrow">Ma carte de tilt · 1. Déclencheurs</span><h2>Qu'est-ce qui te fait sortir de ton jeu ?</h2>
        <div class="row">${PR.TRIGGERS.map((x) => `<button class="chip" aria-pressed="${m.triggers.includes(x.id)}" data-act="trigtog" data-id="${x.id}">${esc(x.label)}</button>`).join('')}${m.custom.map((c) => `<button class="chip" aria-pressed="true" data-act="trigdel" data-id="${esc(c.id)}">${esc(c.label)} ×</button>`).join('')}</div>
        <div class="row"><label class="f" style="flex:1;min-width:200px">Autre déclencheur<input id="newtrig" maxlength="60" placeholder="Ex. : jouer après le travail"></label><button class="btn" data-act="trigadd">Ajouter</button></div>
        <p class="note">Pour chaque déclencheur, une fiche de correction en 5 étapes (méthode de Jared Tendler, The Mental Game of Poker). Les textes proposés sont un point de départ : réécris-les avec tes mots, c'est ce qui les rend efficaces.</p></section>
      ${sel.length ? `<div style="display:grid;gap:10px">${sel.map(ficheHTML).join('')}</div>` : ''}
      <section class="panel"><span class="eyebrow">2. Mes niveaux de tilt</span><h2>Ce que je remarque, ce que je fais</h2>
        <div class="grid3">${PR.ZONES.map((z) => { const v = zone(z.id); return `<div style="display:grid;gap:8px;align-content:start"><h3>${z.label}</h3><label class="f">Signes<textarea rows="3" data-zone="${z.id}:signs" maxlength="300">${esc(v.signs)}</textarea></label><label class="f">Réponse<textarea rows="3" data-zone="${z.id}:resp" maxlength="300">${esc(v.resp)}</textarea></label></div>`; }).join('')}</div>
        <div class="row"><span class="note">J'arrête la session dès le tilt :</span>${[['net', 'Net'], ['fort', 'Fort']].map(([k, l]) => `<button class="chip" aria-pressed="${m.stop === k}" data-act="tiltstop" data-v="${k}">${l}</button>`).join('')}</div></section>
      <section class="panel"><span class="eyebrow">3. Ma carte en bref · à relire avant chaque session</span>
        <div class="advice" id="tiltcard">${cardInner()}</div>
        <div class="row"><button class="btn small" data-act="tiltcopy">Copier ma carte</button><span class="note" id="tiltmsg"></span></div></section>
      <section class="panel"><span class="eyebrow">4. Ce que le tilt te coûte</span><h2>Résultats selon le tilt noté au Journal</h2>${costHTML()}
        <div class="row"><button class="btn" data-tab="journal">Ouvrir le Journal</button><button class="btn" data-act="openmod" data-id="tilt2">Module Tilt</button><button class="btn" data-act="openmod" data-id="mental">Module Mental</button></div></section>`;
  };
  ACT.cisel = (t) => { ci[t.dataset.k] = +t.dataset.v; render(); };
  ACT.cimoney = (t) => { ci.money = t.checked; render(); };
  ACT.cisave = () => {
    const r = PR.checkin(ci, state.journal.sessions, today()), m = mental();
    m.checkins = m.checkins.filter((c) => c.date !== today()).concat({ date: today(), score: r.score, level: r.level }).slice(-60);
    Store.save('mental'); render();
  };
  ACT.trigtog = (t) => { const m = mental(), id = t.dataset.id; m.triggers = m.triggers.includes(id) ? m.triggers.filter((x) => x !== id) : [...m.triggers, id]; Store.save('mental'); render(); };
  ACT.trigadd = () => { const v = ($('#newtrig')?.value || '').trim().slice(0, 60); if (!v) return; const m = mental(); m.custom.push({ id: 'c' + Date.now().toString(36), label: v }); Store.save('mental'); render(); };
  ACT.trigdel = (t) => { const m = mental(), id = t.dataset.id; m.triggers = m.triggers.filter((x) => x !== id); m.custom = m.custom.filter((c) => c.id !== id); Store.save('mental'); render(); };
  ACT.ficreset = (t) => { delete mental().fiches[t.dataset.id]; Store.save('mental'); render(); };
  ACT.tiltstop = (t) => { mental().stop = t.dataset.v; Store.save('mental'); render(); };
  ACT.tiltcopy = async () => {
    const txt = ($('#tiltcard')?.innerText || '').trim(), msg = $('#tiltmsg');
    try { await navigator.clipboard.writeText('Ma carte de tilt\n' + txt); if (msg) msg.textContent = 'Copiée.'; } catch (e) { if (msg) msg.textContent = 'Copie impossible ici : sélectionne le texte à la main.'; }
  };
  ONCHANGE.push((t) => {
    if (t.dataset.fiche) { const [id, k] = t.dataset.fiche.split(':'), m = mental(); m.fiches[id] = fiche(id); m.fiches[id][+k] = t.value.slice(0, 400); Store.save('mental'); const el = $('#tiltcard'); if (el) el.innerHTML = cardInner(); return true; }
    if (t.dataset.zone) { const [z, k] = t.dataset.zone.split(':'), m = mental(); m.zones[z] = zone(z); m.zones[z][k] = t.value.slice(0, 300); Store.save('mental'); const el = $('#tiltcard'); if (el) el.innerHTML = cardInner(); return true; }
  });
})();
