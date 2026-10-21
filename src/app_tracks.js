// Parcours par objectif, test de niveau, accueil guidé, série quotidienne, Score SIGMA, badges, sauvegarde des données.
(function () {
  const X = window.__S52, T = window.Tracks, P = window.Plan, K = window.Course, S = window.Spots;
  const { $, esc, pct, state, Store, render, head, VIEWS, ACT, ONKEY } = X;
  const go = X.go;
  const today = () => new Date().toISOString().slice(0, 10);
  const prog = () => state.progress;

  // ---------------- Série quotidienne : un jour compte dès qu'on enregistre une progression ----------------
  const baseSave = Store.save.bind(Store);
  Store.save = (k) => {
    if (k === 'progress') { const p = prog(); p.days = p.days || []; const d = today(); if (p.days[p.days.length - 1] !== d) { p.days.push(d); if (p.days.length > 400) p.days = p.days.slice(-400); } }
    return baseSave(k);
  };
  function streak() {
    const days = new Set(prog().days || []); let n = 0; const d = new Date();
    if (!days.has(today())) d.setDate(d.getDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const seen = (k) => { const p = prog(); p.seen = p.seen || {}; if (!p.seen[k]) { p.seen[k] = today(); Store.save('progress'); } };
  X.markSeen = seen;

  // ---------------- Parcours ----------------
  const trackOf = (id) => T.TRACKS.find((t) => t.id === id);
  function trackStatus(t) {
    const steps = t.steps.map((s) => P.taskStatus(s, state, K, S));
    const done = steps.filter((s) => s.done).length, next = steps.find((s) => !s.done);
    return { steps, done, next, pct: done / steps.length };
  }
  const stepBtn = (s, i) => `<div class="tstep${s.done ? ' done' : ''}"><span class="tn">${s.done ? '✓' : i + 1}</span><span class="tl">${esc(s.label)}</span>${s.done ? '' : `<span class="mono note">${pct(s.progress, 0)}</span>`}${s.done || !s.go ? '' : `<button class="btn small" data-act="plango" data-g="${esc(JSON.stringify(s.go))}">Y aller</button>`}</div>`;
  let showAll = false;
  ACT.trall = () => { showAll = !showAll; render(); };
  let pl = null; // test de niveau en cours : { qs, i, ans: [] }
  VIEWS.parcours = () => {
    const p = prog(), cur = p.track ? trackOf(p.track) : null;
    let out = head('Parcours', 'Choisis ton objectif : SIGMA 52 te donne le chemin le plus court, étape par étape, et coche chaque étape tout seul.');
    if (pl) return out + placementHTML();
    const lvl = p.placement ? p.placement.level : null;
    out += `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Test de niveau · 12 questions · 3 minutes</span><h2>${lvl ? (lvl >= 5 ? 'Niveau conseillé : Tables physiques et Professionnel' : 'Niveau conseillé : ' + K.LEVELS[lvl - 1].title) : 'Où commencer ?'}</h2></div><button class="btn${lvl ? '' : ' primary'}" data-act="plstart">${lvl ? 'Refaire le test' : 'Faire le test'}</button></div>
      ${lvl ? `<p class="note">Résultat du ${esc(p.placement.date)} : ${p.placement.score}/12. Les modules des niveaux inférieurs : lis seulement le résumé et passe directement leur quiz pour les valider.</p>` : '<p class="note">Trois questions par niveau, de Fondations à Élite. Le test indique où commencer pour ne pas perdre de temps sur ce que tu sais déjà.</p>'}</section>`;
    out += `<div class="tracks">${T.TRACKS.map((t) => { const st = trackStatus(t); return `<button class="track${p.track === t.id ? ' on' : ''}" data-act="trsel" data-id="${t.id}"><span class="eyebrow">${st.done}/${t.steps.length} étapes</span><h3>${esc(t.title)}</h3><span class="note">${esc(t.who)}</span><div class="meter"><i style="width:${st.pct * 100}%"></i></div></button>`; }).join('')}</div>`;
    if (cur) {
      const st = trackStatus(cur);
      out += `<section class="panel"><span class="eyebrow">Ton parcours · ${st.done}/${cur.steps.length} étapes</span><h2>${esc(cur.title)}</h2><p>${esc(cur.promise)}</p>
        <div class="meter"><i style="width:${st.pct * 100}%"></i></div>
        <div class="tsteps">${(showAll ? st.steps.map((x, i) => [x, i]) : st.steps.map((x, i) => [x, i]).filter(([x]) => !x.done).slice(0, 6)).map(([x, i]) => stepBtn(x, i)).join('')}</div>
        <div class="row"><button class="btn small" data-act="trall">${showAll ? 'Voir seulement les prochaines étapes' : `Voir les ${cur.steps.length} étapes (${st.done} faite${st.done > 1 ? 's' : ''})`}</button></div>
        <p class="note">Rythme conseillé : 45 minutes par jour (méthode express). Les étapes se valident d'elles-mêmes : quiz à 80 %, réussite aux spots, mains jouées, outils utilisés.</p></section>`;
    }
    return out;
  };
  ACT.trsel = (t) => { const p = prog(); p.track = t.dataset.id; p.onboard = true; Store.save('progress'); render(); };
  // ---- Test de niveau ----
  function placementHTML() {
    const q = pl.qs[pl.i], a = pl.ans[pl.i];
    if (!q) {
      const lvl = T.placementLevel(pl.ans), score = pl.ans.filter((x) => x.ok).length;
      return `<section class="panel"><span class="eyebrow">Test terminé · ${score}/12</span><h2>Niveau conseillé : ${lvl >= 5 ? 'Tables physiques et Professionnel' : esc(K.LEVELS[lvl - 1].title)}</h2>
        <div class="tw"><table class="t"><thead><tr><th>Niveau</th><th class="n">Bonnes réponses</th></tr></thead><tbody>${[1, 2, 3, 4].map((l) => `<tr><td>${esc(K.LEVELS[l - 1].title)}</td><td class="n mono">${pl.ans.filter((x) => x.level === l && x.ok).length}/3</td></tr>`).join('')}</tbody></table></div>
        <p>Commence ton parcours par les étapes de ce niveau. Pour les niveaux en dessous, passe directement les quiz pour valider ce que tu sais déjà.</p>
        <div class="row"><button class="btn primary" data-act="plsave">Enregistrer et choisir mon parcours</button></div></section>`;
    }
    return `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Question ${pl.i + 1} sur ${pl.qs.length} · ${esc(K.LEVELS[q.level - 1].title)}</span><button class="btn small" data-act="plquit">Abandonner</button></div>
      <div class="meter"><i style="width:${(pl.i / pl.qs.length) * 100}%"></i></div><h2>${esc(q.q)}</h2>
      <div class="opts">${q.opts.map((o, i) => `<button class="opt${a ? (i === q.ok ? ' ok' : a.i === i ? ' ko' : '') : ''}" data-act="plans" data-i="${i}" ${a ? 'disabled' : ''}><span class="mono note">${i + 1}</span> ${esc(o)}</button>`).join('')}</div>
      ${a ? `<div class="verdict ${a.ok ? 'good' : 'bad'}"><p><strong>${a.ok ? 'Juste.' : 'Pas tout à fait.'}</strong> ${esc(q.why)}</p></div><div class="row"><button class="btn primary" data-act="plnext">Suivante <span style="opacity:.7">Entrée</span></button></div>` : '<p class="note">Touches 1 à 3 pour répondre.</p>'}</section>`;
  }
  ACT.plstart = () => { pl = { qs: T.placementQuestions(K), i: 0, ans: [] }; go('parcours'); };
  ACT.plquit = () => { pl = null; render(); };
  ACT.plans = (t) => { const q = pl.qs[pl.i]; if (pl.ans[pl.i]) return; const i = +t.dataset.i; pl.ans[pl.i] = { i, ok: i === q.ok, level: q.level }; render(); };
  ACT.plnext = () => { pl.i++; render(); };
  ACT.plsave = () => { const p = prog(); p.placement = { level: T.placementLevel(pl.ans), score: pl.ans.filter((x) => x.ok).length, date: today() }; p.onboard = true; pl = null; Store.save('progress'); render(); };
  ONKEY.push((e, tab) => {
    if (tab !== 'parcours' || !pl) return;
    if (/^[1-4]$/.test(e.key) && pl.qs[pl.i] && !pl.ans[pl.i] && +e.key <= pl.qs[pl.i].opts.length) { ACT.plans({ dataset: { i: +e.key - 1 } }); return true; }
    if (e.key === 'Enter' && pl.ans[pl.i]) { ACT.plnext(); return true; }
  });
  // Raccourcis de navigation supplémentaires pour les étapes
  const basePlango = ACT.plango;
  ACT.plango = (t) => {
    const [k, v] = JSON.parse(t.dataset.g);
    if (k === 'live') { if (X.liveState) X.liveState.sub = v; go('live'); return; }
    if (k === 'agg') { X.solverState.sub = 'agg'; seen('agg'); go('solveur'); return; }
    if (k === 'tool') { X.setTool(v); seen(v); go('outils'); return; }
    return basePlango(t);
  };

  // ---------------- Accueil : objectif, prochaine étape, série ----------------
  const baseJour = VIEWS.jour;
  VIEWS.jour = () => {
    const p = prog(), html = baseJour(), s = streak(), cur = p.track ? trackOf(p.track) : null;
    let top = '';
    if (!p.onboard && !cur) {
      top = `<section class="panel welcome"><span class="eyebrow">Bienvenue</span><h2>Quel est ton objectif ?</h2><p>SIGMA 52 adapte ton chemin : choisis un parcours, puis fais le test de niveau pour ne pas réapprendre ce que tu sais.</p>
        <div class="tracks">${T.TRACKS.map((t) => `<button class="track" data-act="trsel" data-id="${t.id}"><h3>${esc(t.title)}</h3><span class="note">${esc(t.who)}</span></button>`).join('')}</div>
        <div class="row"><button class="btn" data-act="plstart">Faire d'abord le test de niveau</button><button class="btn small" data-act="onbskip">Plus tard</button></div></section>`;
    } else if (cur) {
      const st = trackStatus(cur), next = st.next;
      top = `<section class="panel nextstep"><div class="row" style="justify-content:space-between"><span class="eyebrow">Parcours · ${esc(cur.title)} · ${st.done}/${cur.steps.length}</span><span class="pill ${s >= 3 ? 'good' : ''}">${s ? `Série : ${s} jour${s > 1 ? 's' : ''}` : 'Commence ta série aujourd\'hui'}</span></div>
        <h2>${next ? 'Prochaine étape : ' + esc(next.label) : 'Parcours terminé'}</h2><div class="meter"><i style="width:${st.pct * 100}%"></i></div>
        <div class="row">${next && next.go ? `<button class="btn primary" data-act="plango" data-g="${esc(JSON.stringify(next.go))}">Y aller</button>` : ''}<button class="btn" data-tab="parcours">Voir le parcours</button><button class="btn" data-tab="profil">Score et badges</button></div></section>`;
    }
    return html.replace('<div class="warnbox"><strong>Fair-play.</strong>', top + '<div class="warnbox"><strong>Fair-play.</strong>');
  };
  ACT.onbskip = () => { prog().onboard = true; Store.save('progress'); render(); };

  // ---------------- Score SIGMA et badges ----------------
  const mast = (t) => { const h = prog().hist?.[t] || []; return h.length >= 10 ? h.reduce((a, b) => a + b, 0) / h.length : (h.length ? (h.reduce((a, b) => a + b, 0) / h.length) * (h.length / 10) : 0); };
  const quizOk = (ids) => ids.filter((id) => (prog().quiz?.[id] ?? 0) >= 0.8).length / ids.length;
  const lvlMods = (l) => K.MODULES.filter((m) => m.level === l).map((m) => m.id);
  function score() {
    const p = prog(), log = (x, k) => Math.min(1, Math.log10(1 + x) / Math.log10(1 + k));
    const parts = [
      { k: 'Préflop', max: 250, v: (mast('rfi') + mast('vsopen') + mast('pushfold')) / 3, tip: 'Spots Ouverture, Face à une ouverture, Tapis ou couché', go: ['spot', 'rfi'] },
      { k: 'Maths', max: 200, v: (mast('odds') + mast('outs') + mast('tirage') + mast('mdf') + mast('combos')) / 5, tip: 'Spots Cotes, Outs, Tirages, MDF, Combos', go: ['spot', 'odds'] },
      { k: 'Théorie et stratégie', max: 250, v: (quizOk(lvlMods(2)) + quizOk(lvlMods(3)) + quizOk(lvlMods(4)) + log(p.solves || 0, 30) + log(p.trainer?.n || 0, 200)) / 5, tip: 'Modules des niveaux 2 à 4, solveur, entraîneur river', go: ['tab', 'cours'] },
      { k: 'Pratique', max: 150, v: (log(p.tableHands || 0, 3000) + log(Object.values(p.champs?.by || {}).reduce((a, b) => a + (b.sessions || 0), 0), 20) + log(p.expresso?.games || 0, 50)) / 3, tip: 'Mains au simulateur, sessions Champions, Expresso', go: ['sim', 'table'] },
      { k: 'Mental et discipline', max: 150, v: (quizOk(['mental', 'tilt2', 'discipline', 'decision', 'responsable', 'perf']) + log(state.journal.sessions.length, 30) + Math.min(1, streak() / 14)) / 3, tip: 'Modules mental, tilt, discipline, décision ; Journal ; série quotidienne', go: ['mod', 'tilt2'] },
    ];
    parts.forEach((x) => (x.pts = Math.round(x.v * x.max)));
    return { total: parts.reduce((a, x) => a + x.pts, 0), parts };
  }
  const BADGES = [
    ['Premier pas', 'Répondre à un premier spot', () => Object.values(prog().stats || {}).some((s) => s.n > 0)],
    ['Test passé', 'Faire le test de niveau', () => !!prog().placement],
    ['Trois jours', 'Série de 3 jours', () => streak() >= 3],
    ['Une semaine', 'Série de 7 jours', () => streak() >= 7],
    ['Un mois', 'Série de 30 jours', () => streak() >= 30],
    ['Préflop solide', 'Ouverture à 90 % sur 30 spots', () => (prog().hist?.rfi || []).length >= 30 && mast('rfi') >= 0.9],
    ['Calculateur', 'Cotes du pot à 90 % sur 30 spots', () => (prog().hist?.odds || []).length >= 30 && mast('odds') >= 0.9],
    ['Tapis ou couché', 'Push/fold à 90 % sur 30 spots', () => (prog().hist?.pushfold || []).length >= 30 && mast('pushfold') >= 0.9],
    ['Fondations', 'Tous les modules du niveau 1', () => quizOk(lvlMods(1)) === 1],
    ['Joueur gagnant', 'Tous les modules du niveau 2', () => quizOk(lvlMods(2)) === 1],
    ['Avancé', 'Tous les modules du niveau 3', () => quizOk(lvlMods(3)) === 1],
    ['Élite', 'Tous les modules du niveau 4', () => quizOk(lvlMods(4)) === 1],
    ['Mental d\'acier', 'Modules mental, tilt, discipline, décision', () => quizOk(['mental', 'tilt2', 'discipline', 'decision']) === 1],
    ['Grinder', '1 000 mains au simulateur', () => (prog().tableHands || 0) >= 1000],
    ['Solveur', '10 spots résolus', () => (prog().solves || 0) >= 10],
    ['Analyste', 'Historiques analysés', () => !!state.notes.lastImport],
    ['Champion', '5 sessions Champions', () => Object.values(prog().champs?.by || {}).reduce((a, b) => a + (b.sessions || 0), 0) >= 5],
    ['Expresso', 'Gagner un Expresso simulé', () => (prog().expresso?.places?.[1] || 0) >= 1],
    ['Sang-froid', 'Série de 10 à l\'entraînement éclair', () => { try { return +JSON.parse(localStorage.getItem('sigma52.live.drillBest') || '0') >= 10; } catch (e) { return false; } }],
    ['Parcours bouclé', 'Terminer un parcours', () => T.TRACKS.some((t) => trackStatus(t).next === undefined)],
  ];
  VIEWS.profil = () => {
    const sc = score(), s = streak(), got = BADGES.filter((b) => b[2]()), days = prog().days || [];
    const weakest = sc.parts.slice().sort((a, b) => a.pts / a.max - b.pts / b.max)[0];
    const last28 = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return d.toISOString().slice(0, 10); });
    return head('Profil', 'Ton score, tes badges, ta régularité et tes données.') + `
      <div class="stats"><div class="stat hero"><span>Score SIGMA</span><b>${sc.total}</b><span>sur 1 000</span></div>
        <div class="stat"><span>Série</span><b>${s} jour${s > 1 ? 's' : ''}</b><span>${days.length} jour${days.length > 1 ? 's' : ''} actif${days.length > 1 ? 's' : ''} au total</span></div>
        <div class="stat"><span>Badges</span><b>${got.length}/${BADGES.length}</b><span>${got.length ? esc(got[got.length - 1][0]) : 'aucun encore'}</span></div></div>
      <section class="panel"><h2>Détail du score</h2>
        ${sc.parts.map((x) => `<div class="typerow"><span>${esc(x.k)}</span><div class="meter"><i style="width:${(x.pts / x.max) * 100}%"></i></div><span class="mono">${x.pts}/${x.max}</span></div>`).join('')}
        <p class="note">Le score mesure ta maîtrise dans SIGMA 52 (exercices, cours, pratique, discipline), pas tes gains. Point le plus faible : <strong>${esc(weakest.k)}</strong> (${esc(weakest.tip)}).</p>
        <div class="row"><button class="btn primary" data-act="plango" data-g="${esc(JSON.stringify(weakest.go))}">Travailler ce point</button></div></section>
      <section class="panel"><h2>Régularité (28 derniers jours)</h2><div class="cal">${last28.map((d) => `<span class="${days.includes(d) ? 'on' : ''}" title="${d}"></span>`).join('')}</div></section>
      <section class="panel"><h2>Badges</h2><div class="badges">${BADGES.map(([n, d, f]) => { const ok = f(); return `<div class="bdg${ok ? ' on' : ''}"><b>${esc(n)}</b><span>${esc(d)}</span></div>`; }).join('')}</div></section>
      <section class="panel"><h2>Mes données</h2><p class="note">${Store.mode === 'db' ? 'Ta progression est enregistrée en ligne avec ton compte et sur cet appareil.' : 'Ta progression est enregistrée sur cet appareil.'} Exporte une sauvegarde pour la garder ou la transférer sur un autre appareil.</p>
        <div class="row"><button class="btn" data-act="dataexp">Exporter une sauvegarde (JSON)</button><label class="btn">Importer une sauvegarde<input type="file" accept=".json,application/json" data-imp="1" hidden></label><button class="btn small" data-act="onbreset">Revoir l'accueil guidé</button></div>
        <p class="note" id="datamsg"></p></section>`;
  };
  ACT.onbreset = () => { const p = prog(); p.onboard = false; p.track = null; Store.save('progress'); go('jour'); };
  ACT.dataexp = async () => {
    const all = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('sigma52.')) all[k] = localStorage.getItem(k); }
    for (const k of Object.keys(state)) all['sigma52.' + k] = JSON.stringify(state[k]);
    const data = JSON.stringify({ app: 'SIGMA 52', version: 10, date: new Date().toISOString(), data: all }), filename = 'sigma52-sauvegarde-' + today() + '.json';
    try { const d = window.claude && (await window.claude.use('downloads')); if (d) { await d.save({ filename, data }); return; } } catch (e) { if (e && e.code === 'declined') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  };
  document.addEventListener('change', async (e) => {
    const inp = e.target.closest && e.target.closest("[data-imp]"); if (!inp || !inp.files?.[0]) return;
    const msg = $('#datamsg');
    try {
      const j = JSON.parse(await inp.files[0].text()); if (j.app !== 'SIGMA 52' || !j.data) throw new Error('Ce fichier n\'est pas une sauvegarde SIGMA 52.');
      for (const [k, v] of Object.entries(j.data)) if (k.startsWith('sigma52.')) localStorage.setItem(k, v);
      for (const k of Object.keys(state)) if (j.data['sigma52.' + k]) { Object.keys(state[k]).forEach((x) => delete state[k][x]); Object.assign(state[k], JSON.parse(j.data['sigma52.' + k])); Store.save(k); }
      if (msg) msg.textContent = 'Sauvegarde importée. Rechargement…'; setTimeout(() => location.reload(), 1500);
    } catch (err) { if (msg) msg.textContent = err.message; }
  });
})();
