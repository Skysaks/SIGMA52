// Interface SIGMA 52 : onglets, stockage (espace privé de la page, sinon navigateur), vues.
(function () {
  const E = window.Engine, C = window.Charts, K = window.Course, S = window.Spots, SV = window.Solver, B = window.Board, HH = window.HH, TS = window.TableSim;
  // Points d'extension pour app_sim.js : actions, écouteurs et vues supplémentaires.
  const ACT = {}, ONCHANGE = [], ONINPUT = [], ONKEY = [];
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fr = (x, d = 2) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = (x) => (x < 0 ? '−' : '') + fr(Math.abs(x)) + ' €';
  const sgn = (x, d = 1) => (x < 0 ? '−' : '+') + fr(Math.abs(x), d);
  const pct = (x, d = 0) => fr(x * 100, d) + ' %';
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  const addDays = (n) => ymd(new Date(Date.now() + n * 864e5));
  const rand = Math.random;

  // ---------- Stockage ----------
  const DEF = {
    progress: { stats: {}, hist: {}, streak: 0, best: 0, read: {}, quiz: {}, daily: { date: '', done: 0, ok: 0 }, review: [], guided: {}, tableHands: 0, coach: {}, expresso: { games: 0, places: [0, 0, 0, 0] }, solves: 0, trainer: { n: 0, ok: 0, loss: 0, hist: [] } },
    settings: { bankroll0: 0, biRule: 40 },
    journal: { sessions: [] },
    notes: { opponents: {}, lastImport: null },
    library: { hands: [] },
  };
  const state = JSON.parse(JSON.stringify(DEF));
  const Store = {
    db: null, uid: null, timers: {}, mode: 'local',
    async init() {
      for (const k of Object.keys(DEF)) { try { const v = localStorage.getItem('sigma52.' + k) || localStorage.getItem('nuts.' + k); if (v) Object.assign(state[k], JSON.parse(v)); } catch (e) { /* stockage indisponible */ } }
      try {
        const [db, user] = await Promise.all([window.claude?.use?.('db'), window.claude?.use?.('user')]);
        const uid = user ? await user.id() : null;
        if (db && uid) {
          this.db = db; this.uid = uid; this.mode = 'db';
          for (const k of Object.keys(DEF)) {
            const snap = await db.doc(`data/users/${uid}/${k}`).get();
            if (snap.exists) Object.assign(state[k], JSON.parse(JSON.stringify(snap.data())));
            else if (JSON.stringify(state[k]) !== JSON.stringify(DEF[k])) await db.doc(`data/users/${uid}/${k}`).set(state[k]);
          }
        }
      } catch (e) { this.mode = 'local'; }
      setSaveState();
    },
    save(k) {
      try { localStorage.setItem('sigma52.' + k, JSON.stringify(state[k])); } catch (e) { /* ignoré */ }
      if (!this.db) return;
      clearTimeout(this.timers[k]);
      this.timers[k] = setTimeout(async () => {
        try { await this.db.doc(`data/users/${this.uid}/${k}`).set(JSON.parse(JSON.stringify(state[k]))); setSaveState(); }
        catch (e) { setSaveState('Sauvegarde en ligne impossible : données gardées sur cet appareil'); }
      }, 600);
    },
  };
  function setSaveState(msg) { $('#saveState').textContent = msg || (Store.mode === 'db' ? '' : 'Données sur cet appareil uniquement'); }

  // ---------- Rendu commun ----------
  const SUITCLS = ['s', 'h', 'd', 'c'];
  const cardHTML = (c, sm) => `<span class="cd ${SUITCLS[c & 3]}${sm ? ' sm' : ''}" aria-label="${E.cardStr(c)}">${E.RANKS[c >> 2].replace('T', '10')}<i>${E.SUIT_SYM[E.SUITS[c & 3]]}</i></span>`;
  const backHTML = (sm) => `<span class="cd back${sm ? ' sm' : ''}" aria-label="carte cachée"></span>`;
  const cardsHTML = (cs, sm) => `<div class="cards">${cs.map((c) => cardHTML(c, sm)).join('')}</div>`;
  const statOf = (t) => state.progress.stats[t] || { ok: 0, n: 0 };
  const mastery = (t) => { const h = state.progress.hist[t] || []; return h.length ? h.reduce((a, b) => a + b, 0) / h.length : null; };
  const totalStat = () => Object.values(state.progress.stats).reduce((a, s) => ({ ok: a.ok + s.ok, n: a.n + s.n }), { ok: 0, n: 0 });
  const dueReviews = () => state.progress.review.filter((r) => r.due <= today());
  const head = (title, lead) => `<section style="display:grid;gap:8px"><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</section>`;
  // Couleur de chaleur pour les grilles (fréquence 0..1) : du fond vers le bordeaux.
  const heat = (f) => (f <= 0.001 ? '' : `style="background:color-mix(in srgb, var(--accent) ${Math.round(25 + 75 * f)}%, var(--sunk));color:${f >= 0.5 ? 'var(--accent-ink)' : 'var(--ink)'}"`);
  function grid169(cellFn) {
    const cells = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) { const h = E.handName(i, j); cells.push(cellFn(h, E.ALL169.indexOf(h))); }
    return `<div class="rgrid" role="group" aria-label="Grille des 169 mains">${cells.join('')}</div>`;
  }

  const TABS = [['jour', 'Aujourd\'hui'], ['cours', 'Cours'], ['spots', 'Spots'], ['sim', 'Simulateur'], ['solveur', 'Solveur'], ['outils', 'Outils'], ['analyse', 'Analyse'], ['journal', 'Journal']];
  let tab = (location.hash || '').slice(1);
  if (!TABS.some(([k]) => k === tab)) tab = 'jour';
  function go(t) { tab = t; try { history.replaceState(null, '', '#' + t); } catch (e) { /* ignoré */ } render(); window.scrollTo(0, 0); }
  function renderTabs() {
    const due = dueReviews().length;
    $('#tabs').innerHTML = TABS.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${k === tab}" data-tab="${k}">${l}${k === 'spots' && due ? `<span class="badge">${due}</span>` : ''}</button>`).join('');
  }
  const VIEWS = {}, AFTER = {};
  function render() { renderTabs(); $('#view').innerHTML = VIEWS[tab](); AFTER[tab]?.(); }

  // ---------- Bankroll ----------
  const bbOf = (stake) => { const m = /^NL\s*(\d+)$/i.exec(stake || ''); return m ? +m[1] / 100 : null; };
  const buyIn = (s) => { const bb = bbOf(s.stake); return bb ? bb * 100 : (+String(s.stake).replace(',', '.') || 0); };
  function journalStats() {
    const ss = state.journal.sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
    const total = ss.reduce((a, s) => a + s.result, 0), mins = ss.reduce((a, s) => a + (s.minutes || 0), 0);
    let bbWon = 0, hands = 0;
    ss.forEach((s) => { const bb = bbOf(s.stake); if (s.format === 'Cash' && bb && s.hands) { bbWon += s.result / bb; hands += s.hands; } });
    const wr = hands ? bbWon / hands * 100 : null, ci = hands ? 1.96 * 90 / Math.sqrt(hands / 100) : null, since = addDays(-30);
    return { ss, total, mins, bank: (+state.settings.bankroll0 || 0) + total, wr, ci, hands, last30: ss.filter((s) => s.date >= since).reduce((a, s) => a + s.result, 0) };
  }
  function maxStake(bank) { const ok = [2, 5, 10, 25, 50, 100, 200].filter((x) => x * (+state.settings.biRule || 40) <= bank); return ok.length ? 'NL' + ok[ok.length - 1] : null; }

  // ---------- Aujourd'hui ----------
  VIEWS.jour = () => {
    const js = journalStats(), ts = totalStat(), d = state.progress.daily.date === today() ? state.progress.daily : { done: 0, ok: 0 };
    const nextMod = K.MODULES.find((m) => !((state.progress.quiz || {})[m.id] >= 0.8)), read = K.MODULES.filter((m) => (state.progress.quiz || {})[m.id] >= 0.8).length;
    const ms = maxStake(js.bank), due = dueReviews().length, li = state.notes.lastImport;
    return `<section style="display:grid;gap:8px"><span class="eyebrow">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      <h1>Ta séance d'aujourd'hui</h1><p class="lead">Révisions, 10 spots, un module, une session à la table d'entraînement. Puis la checklist avant de jouer en room.</p></section>
    <div class="warnbox"><strong>Fair-play.</strong> SIGMA 52 se ferme avant d'ouvrir une table et ne se rouvre qu'après la session. Toute aide consultée pendant une main est sanctionnée par les rooms : fermeture du compte et solde confisqué.</div>
    <div class="stats">
      <div class="stat hero"><span>Spots réussis</span><b>${ts.n ? pct(ts.ok / ts.n) : '—'}</b><span>${ts.n} réponses · série ${state.progress.streak}</span></div>
      <div class="stat"><span>Révisions dues</span><b>${due}</b><span>${state.progress.review.length} erreurs suivies</span></div>
      <div class="stat"><span>Cours maîtrisé</span><b>${read}/${K.MODULES.length}</b><span>modules à 80 % au quiz</span></div>
      <div class="stat"><span>Bankroll</span><b>${state.settings.bankroll0 || js.ss.length ? eur(js.bank) : '—'}</b><span>${js.ss.length ? '30 j : ' + eur(js.last30) : 'à renseigner dans Journal'}</span></div>
    </div>
    <div class="grid3">
      <section class="panel"><span class="eyebrow">1 · Révisions</span><h2>${due ? due + ' erreur' + (due > 1 ? 's' : '') + ' à revoir' : 'Rien à revoir'}</h2>
        <p class="note">Chaque erreur revient après 1, 3, 7 puis 18 jours, jusqu'à ce que tu la réussisses.</p>
        <div class="row"><button class="btn${due ? ' primary' : ''}" data-act="review" ${due ? '' : 'disabled'}>Réviser</button></div></section>
      <section class="panel"><span class="eyebrow">2 · Entraînement du jour</span><h2>${d.done >= 10 ? 'Fait : ' + d.ok + '/10' : d.done + '/10 spots'}</h2>
        <div class="meter"><i style="width:${Math.min(100, d.done * 10)}%"></i></div>
        <p class="note">Le mix tire plus souvent tes types de spots les plus faibles.</p>
        <div class="row"><button class="btn primary" data-act="daily">${d.done ? 'Continuer' : 'Commencer'}</button></div></section>
      <section class="panel"><span class="eyebrow">3 · Cours${nextMod ? ' · niveau ' + nextMod.level : ''}</span><h2>${nextMod ? esc(nextMod.title) : 'Cours maîtrisé'}</h2>
        <p class="note">${nextMod ? nextMod.minutes + ' min, puis le quiz et l\'exercice lié.' : 'Relis les modules liés à tes spots faibles.'}</p>
        <div class="row"><button class="btn" data-act="openmod" data-id="${nextMod ? nextMod.id : K.MODULES[0].id}">${nextMod ? 'Lire' : 'Revoir'}</button></div></section>
    </div>
    <div class="grid2">
      <section class="panel"><span class="eyebrow">Maîtrise</span><h2>Tes 30 dernières réponses par type</h2>
        ${Object.entries(S.TYPES).map(([k, l]) => { const m = mastery(k); return `<div class="typerow"><span>${l}</span><div class="meter"><i style="width:${(m || 0) * 100}%;background:var(${m === null ? '--muted' : m >= 0.9 ? '--good' : m >= 0.7 ? '--accent' : '--bad'})"></i></div><span class="mono">${m === null ? '—' : pct(m)}</span></div>`; }).join('')}
        <p class="note">Seuil avant de jouer en argent réel : 90 % en Ouverture, Cotes du pot et Tapis ou couché.</p></section>
      <section class="panel"><span class="eyebrow">Dernière analyse</span>${li ? `<h2>${li.hands} mains · ${sgn(li.bb100)} bb/100</h2>
        <p class="note">Du ${esc(li.from || '?')} au ${esc(li.to || '?')} · EV des all-in : ${sgn(li.ev100)} bb/100 · ${li.leaks} fuites préflop repérées.</p>` : '<h2>Aucun historique importé</h2><p class="note">Après une session, colle tes historiques dans Analyse : fuites préflop, chance aux all-in, profil de chaque adversaire.</p>'}
        <div class="row"><button class="btn" data-tab="analyse">Ouvrir Analyse</button><button class="btn" data-tab="sim">Simulateur</button></div></section>
    </div>
    <section class="panel"><span class="eyebrow">Avant de lancer une session en room</span><h2>Checklist anti-tilt</h2>
      ${['Je suis reposé, calme, sans perte récente qui me travaille.', 'J\'ai fait mes révisions et mes 10 spots du jour.', ms ? `Ma bankroll permet la limite que je vais jouer (maximum : ${ms}).` : 'Ma bankroll permet la limite que je vais jouer (renseigne-la dans Journal).', 'Mon stop-loss est fixé : 3 caves perdues, j\'arrête.', 'SIGMA 52 sera fermé pendant toute la session.']
        .map((t, i) => `<label class="check"><input type="checkbox" id="ck${i}" data-act="check"><span>${t}</span></label>`).join('')}
      <p id="ckDone" class="pill good" hidden>Prêt. Ferme SIGMA 52, ouvre la room, une seule chose à travailler.</p></section>`;
  };

  // ---------- Cours ----------
  let openMod = null, qAns = {}, showGloss = false;
  const quizScore = (id) => state.progress.quiz?.[id];
  const mastered = (m) => (quizScore(m.id) ?? 0) >= 0.8;
  function quizAnswer(m, qi, i) {
    if (qAns[qi] !== undefined) return;
    qAns[qi] = i;
    const q = m.quiz[qi], ok = q.ok === i, p = state.progress;
    // Une erreur de quiz rejoint les révisions espacées, comme une erreur de Spots.
    if (!ok) {
      const key = 'quiz:' + m.id + ':' + qi, idx = p.review.findIndex((r) => r.key === key);
      const item = { key, spot: { type: 'situations', title: 'Quiz · ' + m.title, prompt: esc(q.q), opts: q.opts, ok: q.ok, why: q.why, sid: key }, iv: 1, due: addDays(1) };
      if (idx >= 0) p.review[idx] = item; else p.review.push(item);
    }
    if (Object.keys(qAns).length === m.quiz.length) {
      const sc = m.quiz.filter((qq, k) => qAns[k] === qq.ok).length / m.quiz.length;
      p.quiz = p.quiz || {}; p.quiz[m.id] = Math.max(p.quiz[m.id] || 0, sc); p.read[m.id] = true;
    }
    Store.save('progress'); render();
  }
  VIEWS.cours = () => {
    if (openMod) {
      const m = K.MODULES.find((x) => x.id === openMod), i = K.MODULES.indexOf(m), nxt = K.MODULES[i + 1], L = K.LEVELS[m.level - 1];
      const done = Object.keys(qAns).length === m.quiz.length, right = m.quiz.filter((q, k) => qAns[k] === q.ok).length;
      const quiz = m.quiz.map((q, qi) => {
        const a = qAns[qi];
        return `<div class="panel" style="gap:10px"><p><strong>${qi + 1}.</strong> ${esc(q.q)}</p><div class="opts">${q.opts.map((o, oi) => `<button class="opt${a !== undefined && oi === q.ok ? ' ok' : ''}${a === oi && oi !== q.ok ? ' ko' : ''}" data-act="qans" data-q="${qi}" data-i="${oi}" ${a !== undefined ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
          ${a !== undefined ? `<div class="verdict ${a === q.ok ? 'good' : 'bad'}"><b>${a === q.ok ? 'Juste.' : 'Non : ' + esc(q.opts[q.ok]) + '.'}</b><span>${esc(q.why)}</span></div>` : ''}</div>`;
      }).join('');
      return `<div class="row"><button class="btn small" data-act="closemod">← Tous les modules</button><span class="eyebrow">Niveau ${m.level} · ${L.title} · module ${i + 1} sur ${K.MODULES.length} · ${m.minutes} min</span></div>
      <article class="panel prose"><h1>${esc(m.title)}</h1>
        <div class="warnbox"><strong>À la fin de ce module, tu sauras :</strong><ul>${m.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>
        ${m.sections.map(([h, html]) => `<section><h2>${h}</h2><div class="prose tw">${html}</div></section>`).join('')}
        <div class="grid2"><section class="panel" style="background:var(--bad-bg);border-color:transparent"><h3>Erreurs fréquentes</h3><ul>${m.mistakes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
          <section class="panel" style="background:var(--good-bg);border-color:transparent"><h3>À retenir</h3><ul>${m.keys.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section></div></article>
      <section style="display:grid;gap:10px"><div class="row" style="justify-content:space-between"><h2>Quiz du module</h2>${quizScore(m.id) !== undefined ? `<span class="pill ${mastered(m) ? 'good' : ''}">Meilleur score : ${pct(quizScore(m.id))}</span>` : ''}</div>${quiz}
        ${done ? `<div class="verdict ${right / m.quiz.length >= 0.8 ? 'good' : 'bad'}"><b>${right}/${m.quiz.length} · ${right / m.quiz.length >= 0.8 ? 'Module maîtrisé.' : 'Seuil de maîtrise : 80 %. Relis les sections concernées puis recommence.'}</b>${right < m.quiz.length ? '<span>Tes erreurs reviennent demain dans les Révisions.</span>' : ''}</div><div class="row"><button class="btn" data-act="qreset">Recommencer le quiz</button></div>` : ''}</section>
      <div class="row"><button class="btn" data-act="drill" data-type="${m.drill}">S'entraîner : ${S.TYPES[m.drill]}</button>
        ${nxt ? `<button class="btn primary" data-act="openmod" data-id="${nxt.id}">Module suivant →</button>` : ''}</div>`;
    }
    const total = K.MODULES.length, nM = K.MODULES.filter(mastered).length;
    return head('Cours', `De débutant à professionnel, en ${K.LEVELS.length} niveaux et ${total} modules. Chaque module : objectifs, cours, erreurs fréquentes, points à retenir, quiz noté et exercice lié. Un module est maîtrisé à 80 % au quiz.`) +
      `<div class="stats"><div class="stat hero"><span>Modules maîtrisés</span><b>${nM}/${total}</b><span>quiz réussis à 80 % ou plus</span></div>${K.LEVELS.map((L) => { const ms = K.MODULES.filter((m) => m.level === L.n); return `<div class="stat"><span>Niveau ${L.n} · ${L.title}</span><b>${ms.filter(mastered).length}/${ms.length}</b><span>${ms.reduce((a, m) => a + m.minutes, 0)} min</span></div>`; }).join('')}</div>
      ${K.LEVELS.map((L) => `<section style="display:grid;gap:8px"><div><span class="eyebrow">Niveau ${L.n}</span><h2>${L.title} · ${L.sub}</h2></div><div class="modlist">${K.MODULES.filter((m) => m.level === L.n).map((m) => { const sc = quizScore(m.id), i = K.MODULES.indexOf(m); return `<button class="mod${mastered(m) ? ' done' : ''}" data-act="openmod" data-id="${m.id}"><span class="n">${mastered(m) ? '✓' : String(i + 1).padStart(2, '0')}</span><span><h3>${esc(m.title)}</h3><span class="note">${m.sections.map((x) => x[0]).join(' · ')}</span></span><span class="note mono" style="text-align:right">${m.minutes} min${sc !== undefined ? '<br>quiz ' + pct(sc) : ''}</span></button>`; }).join('')}</div></section>`).join('')}
      <section class="panel"><div class="row" style="justify-content:space-between"><h2>Lexique</h2><button class="btn small" data-act="gloss">${showGloss ? 'Masquer' : 'Afficher les ' + K.GLOSSARY.length + ' termes'}</button></div>
        ${showGloss ? `<div class="tw"><table class="t"><tbody>${K.GLOSSARY.map(([w, d]) => `<tr><td style="min-width:120px"><strong>${esc(w)}</strong></td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Les termes des tables et des contenus de poker, en français et en anglais.</p>'}</section>`;
  };
  AFTER.cours = () => {
    const tb0 = $('#rfi-pct'); if (tb0) tb0.innerHTML = C.POS.map((p) => `<tr><td>${C.RFI[p].label}</td><td>${fr(E.rangePct(E.parseRange(C.RFI[p].range)), 0)} %</td></tr>`).join('') + '<tr><td>BB</td><td>Défend selon l\'ouverture adverse</td></tr>';
  };

  // ---------- Spots ----------
  let spotMode = 'mix', sitCat = '', spot = null, answered = null, daily = false, reviewItem = null;
  const spotKey = (s) => s.type + ':' + (s.sid || s.prompt.replace(/<[^>]+>/g, '') + (s.cards || []).join('-') + (s.board || []).join('-'));
  function newSpot() {
    answered = null; reviewItem = null;
    if (spotMode === 'review') {
      const due = dueReviews(); if (!due.length) { spotMode = 'mix'; return newSpot(); }
      reviewItem = due[0]; spot = reviewItem.spot; return;
    }
    spot = spotMode === 'mix' ? S.mix(rand, state.progress.stats) : spotMode === 'situations' ? S.GEN.situations(rand, sitCat) : S.GEN[spotMode](rand);
  }
  function answer(i) {
    if (answered !== null || !spot) return;
    answered = i;
    const ok = spot.ok === i, p = state.progress;
    const st = p.stats[spot.type] || (p.stats[spot.type] = { ok: 0, n: 0 });
    st.n++; if (ok) st.ok++;
    const h = p.hist[spot.type] || (p.hist[spot.type] = []); h.push(ok ? 1 : 0); if (h.length > 30) h.shift();
    p.streak = ok ? p.streak + 1 : 0; p.best = Math.max(p.best, p.streak);
    if (daily) { if (p.daily.date !== today()) p.daily = { date: today(), done: 0, ok: 0 }; p.daily.done++; if (ok) p.daily.ok++; if (p.daily.done >= 10) daily = false; }
    // Répétition espacée : une erreur entre dans la file ; une réussite en révision espace la suivante (1, 3, 7, 18, 45 jours).
    const key = spotKey(spot), idx = p.review.findIndex((r) => r.key === key);
    if (!ok) { const item = { key, spot: JSON.parse(JSON.stringify(spot)), iv: 1, due: addDays(1) }; if (idx >= 0) p.review[idx] = item; else p.review.push(item); if (p.review.length > 150) p.review.shift(); }
    else if (idx >= 0) { const r = p.review[idx]; r.iv = r.iv === 1 ? 3 : Math.round(r.iv * 2.5); r.due = addDays(r.iv); if (r.iv > 40) p.review.splice(idx, 1); }
    Store.save('progress'); render();
  }
  VIEWS.spots = () => {
    if (!spot) newSpot();
    const cats = [...new Set(K.SITUATIONS.map((s) => s.cat))], ok = answered !== null && spot.ok === answered;
    const st = statOf(spot.type), d = state.progress.daily, due = dueReviews().length;
    const visual = spot.hands
      ? `<div class="felt"><span class="eyebrow">Board</span>${cardsHTML(spot.board)}${spot.hands.map((h, i) => `<div class="row"><span class="mono" style="width:80px">Joueur ${i + 1}</span>${cardsHTML(h, true)}</div>`).join('')}</div>`
      : spot.cards || spot.board ? `<div class="felt">${spot.board ? `<span class="eyebrow">Board</span>${cardsHTML(spot.board)}` : ''}${spot.cards ? `<span class="eyebrow">Ta main</span>${cardsHTML(spot.cards)}` : ''}${spot.vil ? `<span class="eyebrow">Adversaire</span>${cardsHTML(spot.vil, true)}` : ''}</div>` : '';
    let evLine = '';
    if (answered !== null && spot.ev) {
      if (spot.ev.unit === 'bb') evLine = ok ? `<span class="pill good">Meilleure décision · écart ${fr(Math.abs(spot.ev.diff), 2)} bb</span>` : `<span class="pill bad">Perte d'EV : ${fr(Math.abs(spot.ev.diff), 2)} bb</span>`;
      else if (spot.ev.call !== undefined) evLine = `<span class="pill ${spot.ev.call >= 0 ? 'good' : 'bad'}">EV du call : ${spot.ev.call >= 0 ? '+' : '−'}${fr(Math.abs(spot.ev.call))} €</span>`;
    }
    return head('Spots', 'Une décision, une correction immédiate, chiffrée en EV quand c\'est calculable. Touches 1 à 4 pour répondre, Entrée pour la suite.') +
      `<div class="row" role="group" aria-label="Type de spot">${[['mix', 'Mix'], ...Object.entries(S.TYPES)].map(([k, l]) => `<button class="chip" aria-pressed="${spotMode === k}" data-act="mode" data-mode="${k}">${l}</button>`).join('')}
        <button class="chip" aria-pressed="${spotMode === 'review'}" data-act="mode" data-mode="review" ${due ? '' : 'disabled'}>Révisions (${due})</button></div>
      ${spotMode === 'situations' ? `<label class="f" style="max-width:260px">Catégorie<select id="sitcat"><option value="">Toutes</option>${cats.map((c) => `<option ${c === sitCat ? 'selected' : ''}>${c}</option>`).join('')}</select></label>` : ''}
      ${daily ? `<div class="row"><span class="pill acc">Entraînement du jour · ${d.date === today() ? d.done : 0}/10</span></div>` : ''}
      ${reviewItem ? `<div class="row"><span class="pill acc">Révision · intervalle actuel ${reviewItem.iv} j</span></div>` : ''}
      <section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">${esc(spot.title)}</span><span class="note mono">${st.n ? pct(st.ok / st.n) + ' sur ' + st.n : 'premier essai'} · série ${state.progress.streak}</span></div>
        <p style="font-size:17px">${spot.prompt}</p>${visual}
        <div class="opts">${spot.opts.map((o, i) => `<button class="opt${answered !== null && i === spot.ok ? ' ok' : ''}${answered === i && i !== spot.ok ? ' ko' : ''}" data-act="ans" data-i="${i}" ${answered !== null ? 'disabled' : ''}><span class="mono note">${i + 1}</span> ${esc(o)}</button>`).join('')}</div>
        ${answered !== null ? `<div class="verdict ${ok ? 'good' : 'bad'}"><b>${ok ? 'Juste.' : 'Non : ' + esc(spot.opts[spot.ok]) + '.'}</b>${evLine ? `<div>${evLine}</div>` : ''}<span>${esc(spot.why)}</span>${!ok ? '<span class="note">Ajouté à tes révisions : il revient demain.</span>' : ''}</div>
        <div class="row"><button class="btn primary" data-act="next">Spot suivant</button>${['tirage', 'meilleure', 'outs'].includes(spot.type) ? '<button class="btn" data-act="toEq">Analyser dans Équité</button>' : ''}${spot.type === 'pushfold' ? '<button class="btn" data-act="toPF">Voir le tableau Nash</button>' : ''}</div>` : ''}
      </section>`;
  };

  const LINEUPS = { equilibree: ['station', 'reg', 'maniaque', 'station', 'nit'], fish: ['station', 'station', 'reg', 'station', 'maniaque'], regs: ['reg', 'reg', 'nit', 'reg', 'maniaque'] };

  // ---------- Outils ----------
  let tool = 'equite';
  const TOOLS = [['equite', 'Équité'], ['board', 'Board'], ['pushfold', 'Push/Fold & ICM'], ['ranges', 'Ranges']];
  const TOOLVIEWS = {};
  VIEWS.outils = () => head('Outils', 'Pour étudier hors session : équité exacte, lecture de board, solveur tapis/couché avec ICM, ranges d\'ouverture.') +
    `<div class="subtabs" role="tablist">${TOOLS.map(([k, l]) => `<button class="chip" aria-pressed="${tool === k}" data-act="tool" data-t="${k}">${l}</button>`).join('')}</div>` + TOOLVIEWS[tool]();

  // Équité
  const eqIn = { p: ['AhKh', 'QcQs', '', ''], board: '2h7hJd' };
  let eqOut = null;
  function parsePlayer(s) {
    s = (s || '').trim(); if (!s) return null;
    if (/^([2-9TJQKA][shdc]){2}$/i.test(s.replace(/\s/g, ''))) return { hand: E.parseCards(s), label: s };
    return { combos: E.rangeCombos(s), label: s, set: E.parseRange(s) };
  }
  function runEquity() {
    try {
      const board = E.parseCards(eqIn.board);
      const ps = eqIn.p.map(parsePlayer).map((p, i) => p && { ...p, idx: i }).filter(Boolean);
      if (ps.length < 2) throw new Error('Il faut au moins deux joueurs.');
      if (board.length > 5 || board.length === 1 || board.length === 2) throw new Error('Le board fait 0, 3, 4 ou 5 cartes.');
      const all = [...board, ...ps.flatMap((p) => p.hand || [])];
      if (new Set(all).size !== all.length) throw new Error('Une carte apparaît deux fois.');
      const t0 = performance.now(), r = E.equity(ps, board, { iterations: 80000 });
      let outs = null, matrix = null;
      if (ps.length === 2 && ps[0].hand && ps[1].hand && (board.length === 3 || board.length === 4)) outs = E.outs(ps[0].hand, ps[1].hand, board);
      if (ps.length === 2 && !board.length && (ps[0].set || ps[1].set)) {
        const f = (p) => SV.setToFreq(p.set || new Set([E.abstractOf(p.hand[0], p.hand[1])]));
        matrix = SV.rangeVsRange(f(ps[0]), f(ps[1]));
      }
      eqOut = { ps, r, ms: performance.now() - t0, outs, board, matrix };
    } catch (e) { eqOut = { err: e.message }; }
  }
  const EQEX = [['AA contre KK', ['AsAh', 'KdKc', '', ''], ''], ['Tirage couleur contre top paire', ['AhKh', 'QcQs', '', ''], '2h7hJd'], ['AK contre une range de 3-bet', ['AdKc', 'QQ+, AK', '', ''], ''], ['Ouverture UTG contre BTN', [C.RFI.UTG.range, C.RFI.BTN.range, '', ''], ''], ['Paire de 5 contre 3 joueurs', ['5s5c', 'random', 'random', 'random'], '']];
  TOOLVIEWS.equite = () => {
    if (!eqOut) runEquity();
    let res = '';
    if (eqOut?.err) res = `<p class="pill bad" style="white-space:normal">${esc(eqOut.err)}</p>`;
    else if (eqOut) {
      res = eqOut.ps.map((p, i) => `<div class="eqrow"><div style="display:grid;gap:4px;min-width:0"><span class="note" style="overflow-wrap:anywhere">Joueur ${p.idx + 1} · ${p.hand ? '' : 'range ' + fr(E.rangePct(p.set), 1) + ' % · '}${esc(p.label.length > 60 ? p.label.slice(0, 60) + '…' : p.label)}</span><div class="eqbar"><i style="width:${eqOut.r.equity[i] * 100}%"></i></div></div><b class="mono" style="font-size:18px;text-align:right">${pct(eqOut.r.equity[i], 1)}</b></div>`).join('')
        + `<p class="note">${eqOut.r.exact ? 'Calcul exact' : 'Monte-Carlo'} sur ${eqOut.r.n.toLocaleString('fr-FR')} ${eqOut.r.exact ? 'tirages' : 'simulations'} en ${Math.round(eqOut.ms)} ms.${eqOut.matrix !== null ? ` Matrice préflop (50 000 tirages par paire de mains, effet de blocage inclus) : ${pct(eqOut.matrix, 1)} pour le joueur 1.` : ''}</p>`
        + (eqOut.outs ? `<div class="felt"><span class="eyebrow">Outs du joueur 1 à la prochaine carte : ${eqOut.outs.length} sur ${52 - 4 - eqOut.board.length}</span>${eqOut.outs.length ? cardsHTML(eqOut.outs, true) : '<p>Aucune carte ne le fait passer devant.</p>'}</div>` : '');
    }
    return `<section class="panel"><p class="note">Main : <span class="mono">AhKh</span> (h cœur, d carreau, c trèfle, s pique, T = 10). Range : <span class="mono">22+, A2s+, KQo, 76s-54s</span> ou <span class="mono">random</span>.</p><div class="form">
        ${eqIn.p.map((v, i) => `<label class="f">Joueur ${i + 1}${i === 0 ? ' (toi)' : ''}<input id="eqp${i}" data-eq="${i}" value="${esc(v)}" placeholder="${i < 2 ? 'main ou range' : 'facultatif'}" autocomplete="off" spellcheck="false"></label>`).join('')}
        <label class="f">Board (0, 3, 4 ou 5 cartes)<input id="eqb" data-eq="b" value="${esc(eqIn.board)}" placeholder="2h7hJd" autocomplete="off" spellcheck="false"></label></div>
        <div class="row"><button class="btn primary" data-act="calc">Calculer</button>${EQEX.map(([l], i) => `<button class="btn small" data-act="eqex" data-i="${i}">${l}</button>`).join('')}</div>${res}</section>`;
  };

  // Board
  const bdIn = { range: C.RFI.BTN.range, board: 'Kh7c2d', label: 'BTN' };
  TOOLVIEWS.board = () => {
    let out = '';
    try {
      const board = E.parseCards(bdIn.board); if (board.length < 3 || board.length > 5) throw new Error('Le board fait 3 à 5 cartes.');
      if (new Set(board).size !== board.length) throw new Error('Une carte apparaît deux fois.');
      const a = B.analyze(E.parseRange(bdIn.range), board);
      const row = (l, n) => `<div class="hbar"><span>${l}</span><div class="eqbar"><i style="width:${a.total ? n / a.total * 100 : 0}%"></i></div><span class="mono">${pct(a.total ? n / a.total : 0, 1)} · ${n}</span></div>`;
      const madeRows = B.MADE.map((l, k) => a.made[k] ? row(l, a.made[k]) + `<p class="note mono" style="overflow-wrap:anywhere;margin-top:-6px">${[...a.byMade[k].entries()].sort((x, y) => y[1] - x[1]).slice(0, 14).map(([h, c]) => h + '×' + c).join('  ')}</p>` : '').join('');
      const pairPlus = a.made.slice(0, 12).reduce((x, y) => x + y, 0);
      out = `<div class="felt"><span class="eyebrow">${B.texture(board).join(' · ')}</span>${cardsHTML(board)}</div>
        <div class="stats"><div class="stat hero"><span>Paire ou mieux</span><b>${pct(pairPlus / a.total, 0)}</b><span>${pairPlus} combos sur ${a.total}</span></div>
          <div class="stat"><span>Avec un tirage</span><b>${pct(a.comboDraw / a.total, 0)}</b><span>${a.comboDraw} combos</span></div>
          <div class="stat"><span>Rien</span><b>${pct(a.made[12] / a.total, 0)}</b><span>ni paire ni main faite avec tes cartes</span></div></div>
        <section class="panel"><h2>Mains faites</h2>${madeRows}</section>
        ${board.length < 5 ? `<section class="panel"><h2>Tirages</h2>${B.DRAWS.map((l, k) => row(l, a.draws[k])).join('')}<p class="note">Une main peut cumuler plusieurs tirages.</p></section>` : ''}`;
    } catch (e) { out = `<p class="pill bad" style="white-space:normal">${esc(e.message)}</p>`; }
    return `<section class="panel"><p class="note">Comment une range touche un board : la base pour choisir ta taille de mise et tes bluffs.</p>
      <div class="row">${C.POS.map((p) => `<button class="chip" aria-pressed="${bdIn.label === p}" data-act="bdpos" data-p="${p}">Ouverture ${p}</button>`).join('')}</div>
      <div class="form"><label class="f" style="grid-column:1/-1">Range<input id="bdr" data-bd="range" value="${esc(bdIn.range)}" spellcheck="false"></label><label class="f">Board<input id="bdb" data-bd="board" value="${esc(bdIn.board)}" spellcheck="false"></label></div>
      <div class="row">${['Kh7c2d', '9h8h7c', 'As5s5d', 'QhJhTd', '2c2d2h', 'Ah9s4d6c'].map((b) => `<button class="btn small" data-act="bdex" data-b="${b}">${b}</button>`).join('')}</div></section>${out}`;
  };

  // Push/Fold & ICM
  const pf = { S: 10, ante: 0, view: 'push', icm: false, n: 3, stacks: [12, 8, 20], payouts: '50, 30, 20', sb: 1, bb: 2, sol: null, icmVals: null, err: null };
  const PAYPRESETS = [['Expresso (le gagnant prend tout)', '100'], ['Sit&Go 6 joueurs 65/35', '65, 35'], ['Sit&Go 9 joueurs 50/30/20', '50, 30, 20'], ['Table finale 30/20/14/10/8/6', '30, 20, 14, 10, 8, 6']];
  function solvePF() {
    if (!pf.icm) { pf.sol = SV.solveChip(pf.S, pf.ante); pf.icmVals = null; pf.err = null; return; }
    try {
      const st = pf.stacks.slice(0, pf.n).map(Number), pay = pf.payouts.split(/[;\s,]+/).map((x) => +x).filter((x) => x > 0);
      if (st.some((x) => !(x > 1))) throw new Error('Chaque tapis doit dépasser 1 bb.');
      if (pf.sb === pf.bb || pf.sb >= pf.n || pf.bb >= pf.n) throw new Error('Choisis deux joueurs différents pour la SB et la BB.');
      if (!pay.length) throw new Error('Indique au moins un gain.');
      const o = SV.icmOutcomes(st, pf.sb, pf.bb, pay, pf.ante);
      pf.sol = SV.solveOutcomes(o.V); pf.chip = SV.solveChip(Math.min(st[pf.sb], st[pf.bb]), pf.ante);
      pf.icmVals = { now: SV.icm(st, pay), st, pay, eff: Math.min(st[pf.sb], st[pf.bb]), total: pay.reduce((a, b) => a + b, 0) }; pf.err = null;
    } catch (e) { pf.err = e.message; pf.sol = null; }
  }
  TOOLVIEWS.pushfold = () => {
    if (!pf.sol && !pf.err) solvePF();
    const sol = pf.sol, freq = sol ? (pf.view === 'push' ? sol.push : sol.call) : null, iv = pf.icmVals;
    const g = sol ? grid169((h, i) => `<button class="rc${freq[i] > 0.001 ? ' heat' : ''}" ${heat(freq[i])} data-act="pfcell" data-h="${h}" aria-label="${h} ${Math.round(freq[i] * 100)} %">${h}</button>`) : '';
    const icmBlock = `<div class="form">
        <label class="f">Joueurs<select id="pfn" data-pf="n">${[2, 3, 4, 5, 6].map((n) => `<option ${n === pf.n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        ${Array.from({ length: pf.n }, (_, i) => `<label class="f">Tapis J${i + 1} (bb)<input id="pfs${i}" data-pfs="${i}" inputmode="decimal" value="${pf.stacks[i] ?? 10}"></label>`).join('')}
        <label class="f">Petite blinde<select id="pfsb" data-pf="sb">${Array.from({ length: pf.n }, (_, i) => `<option value="${i}" ${i === pf.sb ? 'selected' : ''}>J${i + 1}</option>`).join('')}</select></label>
        <label class="f">Grosse blinde<select id="pfbb" data-pf="bb">${Array.from({ length: pf.n }, (_, i) => `<option value="${i}" ${i === pf.bb ? 'selected' : ''}>J${i + 1}</option>`).join('')}</select></label>
        <label class="f" style="grid-column:1/-1">Gains par place (% du prize pool)<input id="pfpay" data-pf="payouts" value="${esc(pf.payouts)}"></label></div>
      <div class="row">${PAYPRESETS.map(([l, v]) => `<button class="btn small" data-act="pfpreset" data-v="${v}">${l}</button>`).join('')}</div>`;
    return `<section class="panel"><div class="row"><button class="chip" aria-pressed="${!pf.icm}" data-act="pfmode" data-m="chip">En jetons (cash, Expresso)</button><button class="chip" aria-pressed="${pf.icm}" data-act="pfmode" data-m="icm">ICM (Sit&Go, tournoi)</button></div>
      ${pf.icm ? icmBlock : `<label class="f">Tapis effectif : <b class="mono" id="pfsv">${pf.S} bb</b><input type="range" id="pfS" min="1" max="25" step="0.5" value="${pf.S}" data-pf="S"></label>`}
      <label class="check"><input type="checkbox" id="pfante" data-act="pfante" ${pf.ante ? 'checked' : ''}><span>Antes de 12,5 % de la BB par joueur</span></label>
      ${pf.err ? `<p class="pill bad" style="white-space:normal">${esc(pf.err)}</p>` : ''}</section>
      ${sol ? `<div class="stats"><div class="stat hero"><span>La SB pousse</span><b>${pct(sol.pushPct, 1)}</b><span>des mains</span></div><div class="stat"><span>La BB paie</span><b>${pct(sol.callPct, 1)}</b><span>des mains</span></div>
        ${iv ? `<div class="stat"><span>Effet de l'ICM</span><b>${sgn((sol.callPct - pf.chip.callPct) * 100, 1)} pts</b><span>sur les calls de la BB. En jetons, à ${fr(iv.eff, 1)} bb : tapis ${pct(pf.chip.pushPct, 1)}, call ${pct(pf.chip.callPct, 1)}</span></div>` : ''}</div>
      <section class="panel"><div class="row"><button class="chip" aria-pressed="${pf.view === 'push'}" data-act="pfview" data-v="push">Tapis de la SB</button><button class="chip" aria-pressed="${pf.view === 'call'}" data-act="pfview" data-v="call">Call de la BB</button></div>
        ${g}<div class="legend"><span><i style="background:var(--accent)"></i>toujours</span><span><i style="background:color-mix(in srgb, var(--accent) 55%, var(--sunk))"></i>mixte</span><span><i style="background:var(--sunk)"></i>jamais</span></div>
        <p class="note" id="pfdetail">Clique une main pour voir son EV. Solveur : meilleures réponses itérées (400 passes) sur la matrice préflop, effet de blocage inclus. Contrôle : à 10 bb en jetons, la SB pousse 58,4 % des mains, comme la référence publiée.</p></section>
      ${iv ? `<section class="panel"><h2>Équité ICM actuelle</h2><div class="tw"><table class="t"><thead><tr><th>Joueur</th><th class="n">Tapis</th><th class="n">Part des jetons</th><th class="n">Équité ICM</th></tr></thead><tbody>${iv.st.map((s, i) => `<tr><td>J${i + 1}${i === pf.sb ? ' (SB)' : i === pf.bb ? ' (BB)' : ''}</td><td class="n">${fr(s, 1)} bb</td><td class="n">${pct(s / iv.st.reduce((a, b) => a + b, 0), 1)}</td><td class="n">${pct(iv.now[i] / iv.total, 1)}</td></tr>`).join('')}</tbody></table></div>
        <p class="note">Modèle de Malmuth-Harville. Avec une seule place payée, l'équité ICM égale la part de jetons : l'ICM ne change rien en Expresso.</p></section>` : ''}` : ''}`;
  };

  // Ranges
  let rPos = 'BTN', custom = null;
  TOOLVIEWS.ranges = () => {
    const set = custom || E.parseRange(C.RFI[rPos].range);
    return `<section class="panel"><div class="row">${C.POS.map((p) => `<button class="chip" aria-pressed="${p === rPos && !custom}" data-act="pos" data-p="${p}">${p}</button>`).join('')}${custom ? '<span class="pill acc">Range perso</span>' : ''}</div>
      <div class="row" style="justify-content:space-between"><h2>${custom ? 'Range perso' : C.RFI[rPos].label}</h2><b class="mono" style="font-size:20px">${fr(E.rangePct(set), 1)} %</b></div>
      ${grid169((h) => `<button class="rc${set.has(h) ? ' on' : ''}" data-act="cell" data-h="${h}" aria-pressed="${set.has(h)}" aria-label="${h}">${h}</button>`)}
      <p class="note">Premier à entrer, 6-max, 100 bb. Diagonale : paires. Au-dessus : assorties (s). En dessous : dépareillées (o). Ouverture : ${C.RFI[rPos].size}. Clique une case pour créer ta range.</p>
      <p class="mono note" style="overflow-wrap:anywhere">${esc([...set].join(', '))}</p>
      <div class="row"><button class="btn" data-act="r2eq">Envoyer vers Équité</button><button class="btn" data-act="r2bd">Envoyer vers Board</button>${custom ? '<button class="btn" data-act="rreset">Revenir au standard</button>' : ''}<button class="btn" data-act="drill" data-type="rfi">S'entraîner</button></div></section>`;
  };

  // ---------- Analyse ----------
  let anText = '', anRes = null, anOpen = null, anErr = '';
  // kind : 'real' (tes mains, enregistrées), 'table' (table d'entraînement), 'sample' (exemple simulé). Seules les vraies mains alimentent tes fiches.
  function runAnalysis(text, kind) {
    try {
      const r = HH.analyze(text);
      if (!r.hands) throw new Error('Aucune main reconnue. Colle le texte brut des historiques Winamax ou PokerStars (une main commence par « Winamax Poker - » ou « PokerStars Hand »).');
      if (!r.hero) throw new Error('Mains reconnues, mais aucune ligne « Dealt to … » : impossible de savoir qui tu es.');
      const me = r.me;
      r.ev100 = me.hands ? (me.netBB - me.allins.reduce((a, x) => a + x.luck / x.bb, 0)) / me.hands * 100 : 0;
      r.kind = kind; anRes = r; anErr = ''; anOpen = null;
      if (kind === 'real') {
        state.notes.lastImport = { hands: r.hands, bb100: me.hands ? me.netBB / me.hands * 100 : 0, ev100: r.ev100, from: r.from, to: r.to, leaks: r.leaks.limps.length + r.leaks.tooLoose.length + r.leaks.tooTight.length, at: today() };
        for (const o of r.opponents) {
          const prev = state.notes.opponents[o.name] || { hands: 0, vpip: 0, pfr: 0, aggr: 0, calls: 0, sd: 0, sawFlop: 0 };
          state.notes.opponents[o.name] = { hands: prev.hands + o.hands, vpip: prev.vpip + o.vpip, pfr: prev.pfr + o.pfr, aggr: prev.aggr + o.aggr, calls: prev.calls + o.calls, sd: prev.sd + o.sd, sawFlop: prev.sawFlop + o.sawFlop, at: today() };
        }
        const names = Object.keys(state.notes.opponents);
        if (names.length > 400) names.sort((a, b) => state.notes.opponents[a].hands - state.notes.opponents[b].hands).slice(0, names.length - 400).forEach((n) => delete state.notes.opponents[n]);
        Store.save('notes');
      }
    } catch (e) { anErr = e.message; anRes = null; }
  }
  const rate = (a, b) => (b ? pct(a / b, 0) : '—');
  VIEWS.analyse = () => {
    let res = '';
    if (anRes) {
      const r = anRes, me = r.me, bb100 = me.hands ? me.netBB / me.hands * 100 : 0;
      const posOrder = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      const leakRow = (l, arr, why) => `<tr><td>${l}</td><td class="n">${arr.length}</td><td class="note">${arr.slice(0, 6).map((x) => x.hand + ' ' + x.pos).join(', ')}${arr.length > 6 ? '…' : ''}</td><td class="note">${why}</td></tr>`;
      res = `${r.kind === 'sample' ? '<div class="warnbox"><strong>Exemple simulé</strong> : 300 mains jouées automatiquement par un bot régulier à la table d\'entraînement. Ce ne sont pas tes mains.</div>' : r.kind === 'table' ? '<div class="warnbox"><strong>Mains de la table d\'entraînement</strong> : elles n\'alimentent pas tes fiches adversaires.</div>' : ''}
      <div class="stats"><div class="stat hero"><span>Résultat</span><b>${sgn(bb100, 1)}</b><span>bb/100 sur ${me.hands} mains (${esc(r.hero)})</span></div>
        <div class="stat"><span>EV des all-in</span><b>${sgn(r.ev100, 1)}</b><span>bb/100 si chaque all-in avait rapporté son équité · ${me.allins.length} all-in</span></div>
        <div class="stat"><span>VPIP / PFR</span><b>${rate(me.vpip, me.hands)} / ${rate(me.pfr, me.hands)}</b><span>repère 6-max : 22-28 / 17-23</span></div>
        <div class="stat"><span>3-bet</span><b>${rate(me.three, me.threeOpp)}</b><span>repère : 6-10 %</span></div>
        <div class="stat"><span>Abattage</span><b>${rate(me.sd, me.sawFlop)}</b><span>WTSD · gagné à l'abattage ${rate(me.wsd, me.sd)}</span></div>
        <div class="stat"><span>C-bet flop</span><b>${rate(me.cbet, me.cbetOpp)}</b><span>sur ${me.cbetOpp} occasions · fold face au c-bet ${rate(me.ftc, me.ftcOpp)}</span></div></div>
      <p class="note">Écart entre résultat et EV des all-in = ta chance sur les tapis : ${sgn(bb100 - r.ev100, 1)} bb/100 sur cet échantillon.</p>
      <section class="panel"><h2>Résultat par position</h2><div class="tw"><table class="t"><thead><tr><th>Position</th><th class="n">Mains</th><th class="n">bb gagnées</th><th class="n">bb/100</th></tr></thead><tbody>
        ${posOrder.filter((p) => me.byPos[p]).map((p) => { const x = me.byPos[p]; return `<tr><td>${p}</td><td class="n">${x.hands}</td><td class="n">${sgn(x.bb, 1)}</td><td class="n" style="color:var(${x.bb >= 0 ? '--good' : '--bad'})">${sgn(x.bb / x.hands * 100, 0)}</td></tr>`; }).join('')}</tbody></table></div>
        <p class="note">Les blindes perdent chez presque tous les joueurs. Le bouton et le cutoff doivent être tes positions les plus gagnantes.</p></section>
      <section class="panel"><h2>Fuites préflop, quand tu entres en premier</h2><div class="tw"><table class="t"><thead><tr><th>Fuite</th><th class="n">Cas</th><th>Exemples</th><th>Pourquoi</th></tr></thead><tbody>
        ${leakRow('Limp en premier', r.leaks.limps, 'Relance ou couche-toi : le limp abandonne l\'initiative.')}
        ${leakRow('Ouverture hors range', r.leaks.tooLoose, 'Trop large pour la position, sauf blindes très faibles.')}
        ${leakRow('Fold d\'une main de la range', r.leaks.tooTight, 'Tu laisses passer des ouvertures rentables.')}</tbody></table></div></section>
      <section class="panel"><h2>Adversaires et plan d'exploitation</h2><div class="tw"><table class="t"><thead><tr><th>Joueur</th><th class="n">Mains</th><th class="n">VPIP</th><th class="n">PFR</th><th class="n">Agress.</th><th class="n">C-bet</th><th class="n">Fold c-bet</th><th>Profil</th><th class="n">Perte (bb)</th></tr></thead><tbody>
        ${r.opponents.slice(0, 25).map((o) => `<tr><td><button class="btn small" data-act="opp" data-n="${esc(o.name)}">${esc(o.name)}</button></td><td class="n">${o.hands}</td><td class="n">${rate(o.vpip, o.hands)}</td><td class="n">${rate(o.pfr, o.hands)}</td><td class="n">${o.calls ? fr(o.aggr / o.calls, 1) : '—'}</td><td class="n">${rate(o.cbet, o.cbetOpp)}</td><td class="n">${rate(o.ftc, o.ftcOpp)}</td><td><span class="pill ${o.profile.key === 'station' || o.profile.key === 'recreatif' ? 'good' : o.profile.key === 'reg' ? 'bad' : ''}">${o.profile.label}</span></td><td class="n">${sgn(-o.net, 1)}</td></tr>
          ${anOpen === o.name ? `<tr><td colspan="9"><div class="advice">${HH.EXPLOIT[o.profile.key].map((t) => `<div>${esc(t)}</div>`).join('')}</div></td></tr>` : ''}`).join('')}</tbody></table></div>
        <p class="note">Clique un joueur pour son plan d'exploitation. « Perte » : ce qu'il a perdu à la table, toutes mains confondues. Profil fiable à partir d'une cinquantaine de mains.</p></section>
      <section class="panel"><h2>Plus gros pots</h2>${r.pots.map((p, i) => `<details><summary><span class="mono">${sgn(p.bb, 1)} bb</span> · main ${esc(p.id)}${p.hand.heroCards ? ' · ' + p.hand.heroCards.map(E.cardStr).join(' ') : ''}</summary><div class="row" style="margin:8px 0"><button class="btn small" data-act="rppot" data-i="${i}">Rejouer pas à pas</button><button class="btn small" data-act="libpot" data-i="${i}">Sauvegarder dans la bibliothèque</button></div><pre class="hh">${esc(p.hand.raw)}</pre></details>`).join('')}</section>`;
    }
    const known = Object.entries(state.notes.opponents).filter(([, o]) => o.hands >= 15).sort((a, b) => b[1].hands - a[1].hands).slice(0, 30);
    return head('Analyse de tes mains', 'Après la session, colle tes historiques Winamax ou PokerStars : résultat, chance aux all-in, fuites préflop, profil de chaque adversaire. Uniquement tes propres mains : analyser des mains achetées ou partagées est interdit par les rooms.') +
      `<section class="panel"><label class="f">Historiques (texte brut)<textarea id="antext" class="f mono" rows="7" style="font-size:12px" placeholder="Winamax Poker - CashGame - HandId: #…">${esc(anText)}</textarea></label>
        <div class="row"><button class="btn primary" data-act="analyze">Analyser</button><label class="btn" for="anfile">Charger des fichiers .txt</label><input type="file" id="anfile" accept=".txt,text/plain" multiple hidden>
        <button class="btn" data-act="ansample">Exemple : 300 mains simulées</button></div>
        <p class="note">Winamax enregistre tes historiques dans le dossier « history » de son répertoire d'installation. Parseur testé sur des historiques Winamax et sur ceux de la table d'entraînement. Si un fichier récent ne passe pas, envoie-moi une main d'exemple : le parseur s'ajuste.</p>
        ${anErr ? `<p class="pill bad" style="white-space:normal">${esc(anErr)}</p>` : ''}</section>${res}
      ${known.length ? `<section class="panel"><h2>Fiches adversaires cumulées</h2><div class="tw"><table class="t"><thead><tr><th>Joueur</th><th class="n">Mains</th><th class="n">VPIP</th><th class="n">PFR</th><th>Profil</th></tr></thead><tbody>${known.map(([n, o]) => `<tr><td>${esc(n)}</td><td class="n">${o.hands}</td><td class="n">${rate(o.vpip, o.hands)}</td><td class="n">${rate(o.pfr, o.hands)}</td><td>${HH.profileOf(o).label}</td></tr>`).join('')}</tbody></table></div><p class="note">Cumul de tous tes imports. Relis-les avant une session, jamais pendant.</p></section>` : ''}`;
  };

  // ---------- Journal ----------
  const ROOMS = ['Winamax', 'PokerStars.fr', 'Betclic', 'PMU', 'Casino', 'Autre'], FORMATS = ['Cash', 'MTT', 'Expresso', 'Sit&Go'];
  let jMsg = '', confirmDel = null;
  const sim = { wr: 5, sd: 90, hands: 50000, bi: 40, seed: 1 };
  VIEWS.journal = () => {
    const js = journalStats(), ms = maxStake(js.bank);
    const rows = js.ss.slice().reverse().map((s) => `<tr><td class="mono">${s.date.split('-').reverse().join('/')}</td><td>${esc(s.room)}</td><td>${esc(s.format)} ${esc(s.stake)}</td><td class="n" style="color:var(${s.result >= 0 ? '--good' : '--bad'})">${eur(s.result)}</td><td class="n">${s.hands || '—'}</td><td>${'●'.repeat(s.tilt || 0) || '—'}</td><td class="note">${esc(s.notes)}</td><td><button class="btn small" data-act="${confirmDel === s.id ? 'delok' : 'del'}" data-id="${s.id}">${confirmDel === s.id ? 'Confirmer' : 'Supprimer'}</button></td></tr>`).join('');
    return head('Journal', 'Chaque session juste après l\'avoir jouée. Le journal applique ton stop-loss et dit quelle limite ta bankroll autorise.') +
      `<div class="stats">
        <div class="stat hero"><span>Bankroll</span><b>${eur(js.bank)}</b><span>départ ${eur(+state.settings.bankroll0 || 0)}</span></div>
        <div class="stat"><span>Résultat total</span><b style="color:var(${js.total >= 0 ? '--good' : '--bad'})">${eur(js.total)}</b><span>${js.ss.length} sessions</span></div>
        <div class="stat"><span>Par heure</span><b>${js.mins ? eur(js.total / js.mins * 60) : '—'}</b><span>${Math.round(js.mins / 60)} h jouées</span></div>
        <div class="stat"><span>Winrate cash</span><b>${js.wr !== null ? fr(js.wr, 1) : '—'}</b><span>${js.wr !== null ? `bb/100 · ±${fr(js.ci, 1)} (95 %) sur ${js.hands.toLocaleString('fr-FR')} mains` : 'renseigne les mains jouées'}</span></div>
        <div class="stat"><span>Limite max</span><b>${ms || '—'}</b><span>règle des ${state.settings.biRule} caves</span></div></div>
      ${js.wr !== null ? '<p class="note">Intervalle calculé avec un écart-type de 90 bb/100, valeur courante en 6-max. Tant qu\'il contient 0, le résultat ne prouve rien.</p>' : ''}
      ${jMsg ? `<div class="warnbox" role="alert">${jMsg}</div>` : ''}
      <section class="panel"><span class="eyebrow">Nouvelle session</span><form id="jform" class="form">
        <label class="f">Date<input id="jdate" name="date" type="date" value="${today()}" required></label>
        <label class="f">Room<select id="jroom" name="room">${ROOMS.map((r) => `<option>${r}</option>`).join('')}</select></label>
        <label class="f">Format<select id="jformat" name="format">${FORMATS.map((r) => `<option>${r}</option>`).join('')}</select></label>
        <label class="f">Limite (NL10) ou buy-in (€)<input id="jstake" name="stake" value="NL5" required></label>
        <label class="f">Résultat net (€)<input id="jres" name="result" inputmode="decimal" placeholder="−4,20" required></label>
        <label class="f">Mains jouées (cash)<input id="jhands" name="hands" inputmode="numeric" placeholder="600"></label>
        <label class="f">Durée (min)<input id="jmin" name="minutes" inputmode="numeric" placeholder="60"></label>
        <label class="f">Tilt ressenti<select id="jtilt" name="tilt"><option value="0">Aucun</option><option value="1">Léger</option><option value="2">Net</option><option value="3">Fort</option></select></label>
        <label class="f" style="grid-column:1/-1">Note (une main à revoir, une leçon)<input id="jnotes" name="notes" maxlength="200"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary" type="submit">Enregistrer la session</button></div></form></section>
      <section class="panel"><span class="eyebrow">Courbe</span><h2>Bankroll</h2>${js.ss.length ? '<canvas id="bankc" height="220" aria-label="Courbe de bankroll"></canvas>' : '<p class="note">Aucune session pour l\'instant. Renseigne ta bankroll de départ ci-dessous, puis ta première session : la courbe apparaîtra ici.</p>'}</section>
      ${rows ? `<section class="panel"><span class="eyebrow">Sessions</span><div class="tw"><table class="t"><thead><tr><th>Date</th><th>Room</th><th>Jeu</th><th class="n">Résultat</th><th class="n">Mains</th><th>Tilt</th><th>Note</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>` : ''}
      <section class="panel"><span class="eyebrow">Réglages</span><div class="form">
        <label class="f">Bankroll de départ (€)<input id="sbank" data-set="bankroll0" inputmode="decimal" value="${state.settings.bankroll0 || ''}" placeholder="200"></label>
        <label class="f">Règle de caves (cash)<input id="sbi" data-set="biRule" inputmode="numeric" value="${state.settings.biRule}"></label></div>
        <details><summary class="note">Sauvegarde manuelle (copier / coller)</summary><div style="display:grid;gap:8px;margin-top:10px">
          <textarea id="jexport" rows="4" class="f mono" style="font-size:12px" aria-label="Données"></textarea>
          <div class="row"><button class="btn small" data-act="exp">Afficher et copier mes données</button><button class="btn small" data-act="imp">Importer le texte collé</button></div></div></details></section>
      <section class="panel"><span class="eyebrow">Simulateur de variance</span><h2>À quoi ressemblent ${sim.hands.toLocaleString('fr-FR')} mains</h2>
        <div class="form">
          <label class="f">Vrai winrate (bb/100)<input id="vwr" data-sim="wr" inputmode="decimal" value="${sim.wr}"></label>
          <label class="f">Écart-type (bb/100)<input id="vsd" data-sim="sd" inputmode="decimal" value="${sim.sd}"></label>
          <label class="f">Mains<input id="vh" data-sim="hands" inputmode="numeric" value="${sim.hands}"></label>
          <label class="f">Bankroll (caves)<input id="vbi" data-sim="bi" inputmode="numeric" value="${sim.bi}"></label></div>
        <canvas id="simc" height="240" aria-label="Trajectoires simulées"></canvas><div id="simstats" class="stats"></div>
        <div class="row"><button class="btn" data-act="resim">Relancer 30 trajectoires</button></div>
        <p class="note">Chaque courbe est un joueur au même niveau réel ; les écarts entre elles viennent de la chance. Risque de ruine : exp(−2 × winrate × bankroll ÷ écart-type²).</p></section>`;
  };
  function drawLines(cv, series, opts = {}) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.height / (cv._dpr || 1);
    cv._dpr = dpr; cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px'; const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const cs = getComputedStyle(document.documentElement), col = (v) => cs.getPropertyValue(v).trim();
    const all = series.flatMap((s) => s.pts), z = opts.zero !== false ? [0] : [];
    let ymin = Math.min(...z, ...all, opts.floor ?? all[0]), ymax = Math.max(...z, ...all);
    if (ymax - ymin < 1e-9) { ymin -= 1; ymax += 1; } else if (opts.zero === false) { const m = (ymax - ymin) * 0.1; ymin -= m; ymax += m; }
    const pad = { l: 60, r: 10, t: 10, b: 22 }, n = Math.max(...series.map((s) => s.pts.length)) - 1 || 1;
    const X = (i) => pad.l + (w - pad.l - pad.r) * i / n, Y = (v) => pad.t + (h - pad.t - pad.b) * (1 - (v - ymin) / ((ymax - ymin) || 1));
    g.font = '11px ' + col('--f-mono'); g.fillStyle = col('--muted'); g.strokeStyle = col('--line'); g.lineWidth = 1;
    for (let k = 0; k <= 4; k++) { const v = ymin + (ymax - ymin) * k / 4, y = Y(v); g.beginPath(); g.moveTo(pad.l, y); g.lineTo(w - pad.r, y); g.stroke(); g.fillText((opts.fmt || ((x) => fr(x, 0)))(v), 4, y + 4); }
    if (opts.zero !== false) { g.strokeStyle = col('--muted'); g.beginPath(); g.moveTo(pad.l, Y(0)); g.lineTo(w - pad.r, Y(0)); g.stroke(); }
    if (opts.floor !== undefined) { g.strokeStyle = col('--bad'); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(pad.l, Y(opts.floor)); g.lineTo(w - pad.r, Y(opts.floor)); g.stroke(); g.setLineDash([]); }
    series.forEach((s) => { g.strokeStyle = col(s.color || '--accent'); g.globalAlpha = s.alpha ?? 1; g.lineWidth = s.width || 2; g.beginPath(); s.pts.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.stroke(); });
    g.globalAlpha = 1;
    if (opts.xlabel) { g.fillStyle = col('--muted'); g.fillText(opts.xlabel, w - pad.r - g.measureText(opts.xlabel).width, h - 6); }
  }
  function runSim() {
    const R = E.rng(sim.seed), steps = Math.max(1, Math.round(sim.hands / 100)), paths = [];
    const gauss = () => { let u = 0; while (!u) u = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * R()); };
    let losers = 0; const dds = [];
    for (let p = 0; p < 30; p++) {
      const pts = [0]; let x = 0, peak = 0, dd = 0;
      for (let s = 0; s < steps; s++) { x += sim.wr + sim.sd * gauss(); pts.push(x); peak = Math.max(peak, x); dd = Math.max(dd, peak - x); }
      if (x < 0) losers++; dds.push(dd); paths.push(pts.filter((_, i) => i % Math.ceil(steps / 300) === 0 || i === steps));
    }
    dds.sort((a, b) => a - b);
    return { paths, losers, ddMed: dds[15] / 100, ror: sim.wr > 0 ? Math.exp(-2 * sim.wr * sim.bi * 100 / (sim.sd * sim.sd)) : 1 };
  }
  AFTER.journal = () => {
    const js = journalStats(), bc = $('#bankc');
    if (bc) { let b = +state.settings.bankroll0 || 0; const pts = [b, ...js.ss.map((s) => (b += s.result))]; drawLines(bc, [{ pts }], { zero: false, fmt: (v) => fr(v, 0) + ' €' }); }
    const r = runSim();
    drawLines($('#simc'), r.paths.map((pts, i) => ({ pts, color: i === 0 ? '--accent' : '--muted', alpha: i === 0 ? 1 : 0.35, width: i === 0 ? 2.5 : 1 })), { floor: -sim.bi * 100, fmt: (v) => fr(v / 100, 0) + ' c', xlabel: 'mains →' });
    $('#simstats').innerHTML = `<div class="stat"><span>Trajectoires perdantes</span><b>${r.losers}/30</b><span>avec un vrai winrate de ${fr(sim.wr, 1)}</span></div>
      <div class="stat"><span>Pire chute (médiane)</span><b>${fr(r.ddMed, 1)} caves</b><span>du sommet au creux</span></div>
      <div class="stat"><span>Risque de ruine</span><b>${sim.wr > 0 ? pct(r.ror, r.ror < 0.01 ? 2 : 0) : '100 %'}</b><span>bankroll de ${sim.bi} caves</span></div>`;
  };

  // ---------- Événements ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,select,textarea')) return;
    if (tab === 'spots') {
      if (/^[1-4]$/.test(e.key) && answered === null && spot && +e.key <= spot.opts.length) answer(+e.key - 1);
      else if (e.key === 'Enter' && answered !== null) { newSpot(); render(); }
    }
    for (const f of ONKEY) if (f(e, tab) === true) return;
  });
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab],[data-act]'); if (!t || t.disabled) return;
    if (t.dataset.tab) return go(t.dataset.tab);
    const a = t.dataset.act;
    if (ACT[a]) return ACT[a](t, e);
    if (a === 'check') { $('#ckDone').hidden = ![...document.querySelectorAll('[data-act=check]')].every((c) => c.checked); return; }
    if (a === 'daily') { daily = true; spotMode = 'mix'; spot = null; return go('spots'); }
    if (a === 'review') { daily = false; spotMode = 'review'; spot = null; return go('spots'); }
    if (a === 'openmod') { openMod = t.dataset.id; qAns = {}; return go('cours'); }
    if (a === 'closemod') { openMod = null; return render(); }
    if (a === 'qans') { return quizAnswer(K.MODULES.find((m) => m.id === openMod), +t.dataset.q, +t.dataset.i); }
    if (a === 'qreset') { qAns = {}; return render(); }
    if (a === 'gloss') { showGloss = !showGloss; return render(); }
    if (a === 'drill') { spotMode = t.dataset.type; daily = false; spot = null; return go('spots'); }
    if (a === 'mode') { spotMode = t.dataset.mode; daily = false; spot = null; return render(); }
    if (a === 'ans') return answer(+t.dataset.i);
    if (a === 'next') { newSpot(); render(); $('.opt')?.focus(); return; }
    if (a === 'toEq') {
      if (spot.hands) { eqIn.p = spot.hands.map((h) => h.map(E.cardStr).join('')).concat(['']); eqIn.board = spot.board.slice(0, 3).map(E.cardStr).join(''); }
      else if (spot.vil) { eqIn.p = [spot.cards.map(E.cardStr).join(''), spot.vil.map(E.cardStr).join(''), '', '']; eqIn.board = spot.board.map(E.cardStr).join(''); }
      else { eqIn.p = [spot.cards.map(E.cardStr).join(''), '', '', '']; eqIn.board = spot.board.map(E.cardStr).join(''); const v = S.villainRange(spot.board).filter((c) => !spot.cards.includes(c[0]) && !spot.cards.includes(c[1])); eqIn.p[1] = [...new Set(v.map((c) => E.abstractOf(c[0], c[1])))].join(', '); }
      eqOut = null; tool = 'equite'; return go('outils');
    }
    if (a === 'toPF') { const m = spot.title.match(/(\d+) bb/); pf.icm = false; pf.S = m ? +m[1] : 10; pf.view = /grosse blinde/.test(spot.prompt) ? 'call' : 'push'; pf.sol = null; tool = 'pushfold'; return go('outils'); }
    // Outils
    if (a === 'tool') { tool = t.dataset.t; return render(); }
    if (a === 'calc') { runEquity(); return render(); }
    if (a === 'eqex') { const [, p, b] = EQEX[+t.dataset.i]; eqIn.p = p.slice(); eqIn.board = b; runEquity(); return render(); }
    if (a === 'bdpos') { bdIn.label = t.dataset.p; bdIn.range = C.RFI[t.dataset.p].range; return render(); }
    if (a === 'bdex') { bdIn.board = t.dataset.b; return render(); }
    if (a === 'pfmode') { pf.icm = t.dataset.m === 'icm'; pf.sol = null; pf.err = null; return render(); }
    if (a === 'pfview') { pf.view = t.dataset.v; return render(); }
    if (a === 'pfante') { pf.ante = t.checked ? 0.125 : 0; pf.sol = null; return render(); }
    if (a === 'pfpreset') { pf.payouts = t.dataset.v; pf.sol = null; pf.err = null; return render(); }
    if (a === 'pfcell') {
      const i = E.ALL169.indexOf(t.dataset.h), s = pf.sol, isPush = pf.view === 'push', ev = isPush ? s.evPush[i] : s.evCall[i], f = isPush ? s.push[i] : s.call[i];
      const val = pf.icm ? `${ev >= 0 ? '+' : '−'}${fr(Math.abs(ev) / pf.icmVals.total * 100, 2)} % du prize pool` : `${ev >= 0 ? '+' : '−'}${fr(Math.abs(ev), 2)} bb`;
      $('#pfdetail').textContent = `${t.dataset.h} : ${isPush ? 'tapis' : 'call'} ${f > 0.95 ? 'toujours' : f < 0.05 ? 'jamais' : 'mixte (' + Math.round(f * 100) + ' %)'}. ${isPush ? 'Pousser' : 'Payer'} vaut ${val} par rapport à se coucher.`;
      return;
    }
    if (a === 'pos') { rPos = t.dataset.p; custom = null; return render(); }
    if (a === 'cell') { if (!custom) custom = new Set(E.parseRange(C.RFI[rPos].range)); const h = t.dataset.h; custom.has(h) ? custom.delete(h) : custom.add(h); return render(); }
    if (a === 'rreset') { custom = null; return render(); }
    if (a === 'r2eq') { eqIn.p[1] = [...(custom || E.parseRange(C.RFI[rPos].range))].join(', '); eqIn.board = ''; eqOut = null; tool = 'equite'; return render(); }
    if (a === 'r2bd') { bdIn.range = [...(custom || E.parseRange(C.RFI[rPos].range))].join(', '); bdIn.label = custom ? '' : rPos; tool = 'board'; return render(); }
    // Analyse
    if (a === 'analyze') { anText = $('#antext').value; runAnalysis(anText, 'real'); return render(); }
    if (a === 'ansample') {
      const sim2 = new TS.Table({ lineup: LINEUPS.equilibree });
      for (let h = 0; h < 300; h++) { sim2.newHand(); let g = 0; while (!sim2.done && g++ < 300) { sim2.runBots(); if (!sim2.done) sim2.autoHero('reg'); } }
      anText = ''; runAnalysis(sim2.exportHH(), 'sample'); return render();
    }
    if (a === 'opp') { anOpen = anOpen === t.dataset.n ? null : t.dataset.n; return render(); }
    // Journal
    if (a === 'del') { confirmDel = t.dataset.id; return render(); }
    if (a === 'delok') { state.journal.sessions = state.journal.sessions.filter((s) => s.id !== t.dataset.id); confirmDel = null; jMsg = 'Session supprimée.'; Store.save('journal'); return render(); }
    if (a === 'resim') { sim.seed++; return AFTER.journal(); }
    if (a === 'exp') {
      const ta = $('#jexport'); ta.value = JSON.stringify({ settings: state.settings, journal: state.journal, progress: state.progress, notes: state.notes, library: state.library });
      ta.select(); try { await navigator.clipboard.writeText(ta.value); jMsg = 'Données copiées. Colle-les dans un fichier pour les garder.'; } catch (err) { jMsg = 'Copie automatique refusée : le texte est sélectionné, copie-le à la main.'; }
      const keep = ta.value; render(); $('#jexport').value = keep; $('#jexport').closest('details').open = true; return;
    }
    if (a === 'imp') {
      try { const d = JSON.parse($('#jexport').value); if (!Array.isArray(d.journal?.sessions)) throw new Error();
        Object.assign(state.settings, d.settings || {}); state.journal.sessions = d.journal.sessions; if (d.progress) Object.assign(state.progress, d.progress); if (d.notes) Object.assign(state.notes, d.notes); if (d.library) Object.assign(state.library, d.library);
        ['settings', 'journal', 'progress', 'notes', 'library'].forEach((k) => Store.save(k)); jMsg = d.journal.sessions.length + ' sessions importées.';
      } catch (err) { jMsg = 'Texte illisible : colle exactement le texte copié depuis « Afficher et copier mes données ».'; }
      return render();
    }
  });
  document.addEventListener('change', async (e) => {
    const t = e.target;
    for (const f of ONCHANGE) if (f(t) === true) return;
    if (t.id === 'sitcat') { sitCat = t.value; spot = null; render(); }
    if (t.dataset.set) { state.settings[t.dataset.set] = +String(t.value).replace(',', '.') || 0; Store.save('settings'); render(); }
    if (t.dataset.sim) { sim[t.dataset.sim] = Math.max(t.dataset.sim === 'hands' ? 100 : t.dataset.sim === 'sd' ? 1 : -50, +String(t.value).replace(',', '.') || 0); render(); }
    if (t.dataset.pf) {
      const k = t.dataset.pf; pf[k] = k === 'payouts' ? t.value : +t.value;
      if (k === 'n') { while (pf.stacks.length < pf.n) pf.stacks.push(10); if (pf.sb >= pf.n) pf.sb = 0; if (pf.bb >= pf.n) pf.bb = 1; }
      pf.sol = null; pf.err = null; render();
    }
    if (t.dataset.pfs !== undefined) { pf.stacks[+t.dataset.pfs] = +String(t.value).replace(',', '.') || 0; pf.sol = null; pf.err = null; render(); }
    if (t.dataset.bd) { bdIn[t.dataset.bd] = t.value; if (t.dataset.bd === 'range') bdIn.label = ''; render(); }
    if (t.id === 'anfile' && t.files.length) { const texts = await Promise.all([...t.files].map((f) => f.text())); anText = texts.join('\n\n'); runAnalysis(anText, 'real'); render(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    for (const f of ONINPUT) if (f(t) === true) return;
    if (t.dataset.eq) { if (t.dataset.eq === 'b') eqIn.board = t.value; else eqIn.p[+t.dataset.eq] = t.value; }
    if (t.id === 'pfS') $('#pfsv').textContent = t.value + ' bb';
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'jform') return;
    e.preventDefault();
    const f = new FormData(e.target), num = (k) => +String(f.get(k) || '').replace(/\s/g, '').replace(',', '.').replace('−', '-');
    const s = { id: 's' + Date.now().toString(36), date: f.get('date'), room: f.get('room'), format: f.get('format'), stake: String(f.get('stake')).trim().toUpperCase().replace(/\s/g, ''), result: num('result'), hands: num('hands') || 0, minutes: num('minutes') || 0, tilt: +f.get('tilt'), notes: String(f.get('notes') || '').slice(0, 200) };
    if (!Number.isFinite(s.result)) { jMsg = 'Résultat illisible : écris par exemple −4,20 ou 12.'; return render(); }
    state.journal.sessions.push(s); Store.save('journal');
    const bi = buyIn(s), lost = bi ? -s.result / bi : 0, ms = maxStake(journalStats().bank), bb = bbOf(s.stake);
    jMsg = lost >= 3 ? `<strong>Stop-loss atteint :</strong> ${fr(lost, 1)} caves perdues. Fin de session, pas de retour aux tables aujourd'hui.`
      : s.tilt >= 2 ? '<strong>Tilt noté.</strong> Pause d\'au moins 30 minutes avant toute nouvelle session, et relis le module Mental.'
      : bb && ms && bb > bbOf(ms) ? `<strong>Attention :</strong> ta bankroll autorise au plus ${ms}. Redescends de limite.`
      : 'Session enregistrée.';
    render();
  });

  // ---------- Extension et démarrage ----------
  window.__S52 = {
    E, C, K, S, SV, B, HH, TS, $, esc, fr, eur, sgn, pct, today, addDays, rand, state, Store, render, go, head, heat, grid169,
    cardHTML, backHTML, cardsHTML, mastery, drawLines, getAnRes: () => anRes, VIEWS, AFTER, TOOLVIEWS, TOOLS, ACT, ONCHANGE, ONINPUT, ONKEY, LINEUPS, runAnalysis,
    getTab: () => tab, setTool: (k) => { tool = k; }, setOpenMod: (id) => { openMod = id; qAns = {}; }, setSpotMode: (m) => { spotMode = m; daily = false; spot = null; },
    start() { render(); Store.init().then(render); },
  };
})();
