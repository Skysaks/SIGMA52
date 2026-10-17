// Interface NUTS : onglets, stockage (db privé par utilisateur, sinon navigateur), vues.
(function () {
  const E = window.Engine, C = window.Charts, K = window.Course, S = window.Spots;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fr = (x, d = 2) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = (x) => (x < 0 ? '−' : '') + fr(Math.abs(x)) + ' €';
  const pct = (x, d = 0) => fr(x * 100, d) + ' %';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const rand = Math.random;

  // ---------- Stockage ----------
  const DEF = {
    progress: { stats: {}, streak: 0, best: 0, read: {}, daily: { date: '', done: 0, ok: 0 } },
    settings: { bankroll0: 0, biRule: 40 },
    journal: { sessions: [] },
  };
  const state = JSON.parse(JSON.stringify(DEF));
  const Store = {
    db: null, uid: null, timers: {}, mode: 'local',
    async init() {
      for (const k of Object.keys(DEF)) { try { const v = localStorage.getItem('nuts.' + k); if (v) Object.assign(state[k], JSON.parse(v)); } catch (e) { /* stockage indisponible */ } }
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
      try { localStorage.setItem('nuts.' + k, JSON.stringify(state[k])); } catch (e) { /* ignoré */ }
      if (!this.db) return;
      clearTimeout(this.timers[k]);
      this.timers[k] = setTimeout(async () => {
        try { await this.db.doc(`data/users/${this.uid}/${k}`).set(JSON.parse(JSON.stringify(state[k]))); setSaveState(); }
        catch (e) { setSaveState('Sauvegarde en ligne impossible : données gardées sur cet appareil'); }
      }, 500);
    },
  };
  function setSaveState(msg) {
    $('#saveState').textContent = msg || (Store.mode === 'db' ? '' : 'Données sur cet appareil uniquement');
  }

  // ---------- Rendu commun ----------
  const SUITCLS = ['s', 'h', 'd', 'c'];
  const cardHTML = (c, sm) => `<span class="cd ${SUITCLS[c & 3]}${sm ? ' sm' : ''}" aria-label="${E.cardStr(c)}">${E.RANKS[c >> 2].replace('T', '10')}<i>${E.SUIT_SYM[E.SUITS[c & 3]]}</i></span>`;
  const cardsHTML = (cs, sm) => `<div class="cards">${cs.map((c) => cardHTML(c, sm)).join('')}</div>`;
  const statOf = (t) => state.progress.stats[t] || { ok: 0, n: 0 };
  const totalStat = () => Object.values(state.progress.stats).reduce((a, s) => ({ ok: a.ok + s.ok, n: a.n + s.n }), { ok: 0, n: 0 });

  const TABS = [['jour', 'Aujourd\'hui'], ['cours', 'Cours A-Z'], ['spots', 'Spots'], ['equite', 'Équité'], ['ranges', 'Ranges'], ['journal', 'Journal']];
  let tab = (location.hash || '').slice(1);
  if (!TABS.some(([k]) => k === tab)) tab = 'jour';
  function go(t) { tab = t; try { history.replaceState(null, '', '#' + t); } catch (e) { /* ignoré */ } render(); window.scrollTo(0, 0); }
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${k === tab}" data-tab="${k}">${l}</button>`).join('');
  }
  const VIEWS = {};
  function render() { renderTabs(); $('#view').innerHTML = VIEWS[tab](); AFTER[tab]?.(); }
  const AFTER = {};

  // ---------- Bankroll ----------
  const bbOf = (stake) => { const m = /^NL\s*(\d+)$/i.exec(stake || ''); return m ? +m[1] / 100 : null; };
  const buyIn = (s) => { const bb = bbOf(s.stake); return bb ? bb * 100 : (+String(s.stake).replace(',', '.') || 0); };
  function journalStats() {
    const ss = state.journal.sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
    const total = ss.reduce((a, s) => a + s.result, 0), mins = ss.reduce((a, s) => a + (s.minutes || 0), 0);
    let bbWon = 0, hands = 0;
    ss.forEach((s) => { const bb = bbOf(s.stake); if (s.format === 'Cash' && bb && s.hands) { bbWon += s.result / bb; hands += s.hands; } });
    const wr = hands ? bbWon / hands * 100 : null, ci = hands ? 1.96 * 90 / Math.sqrt(hands / 100) : null;
    const sd = new Date(Date.now() - 30 * 864e5), since = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
    return { ss, total, mins, bank: (+state.settings.bankroll0 || 0) + total, wr, ci, hands, last30: ss.filter((s) => s.date >= since).reduce((a, s) => a + s.result, 0) };
  }
  function maxStake(bank) { const ok = [2, 5, 10, 25, 50, 100, 200].filter((x) => x * (+state.settings.biRule || 40) <= bank); return ok.length ? 'NL' + ok[ok.length - 1] : null; }

  // ---------- Aujourd'hui ----------
  VIEWS.jour = () => {
    const js = journalStats(), ts = totalStat(), d = state.progress.daily.date === today() ? state.progress.daily : { done: 0, ok: 0 };
    const nextMod = K.MODULES.find((m) => !state.progress.read[m.id]);
    const read = K.MODULES.filter((m) => state.progress.read[m.id]).length;
    const ms = maxStake(js.bank);
    return `
    <section style="display:grid;gap:8px"><span class="eyebrow">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      <h1>Ta séance d'aujourd'hui</h1>
      <p class="lead">10 spots, un module, puis la checklist avant de jouer. Tout se fait hors table.</p></section>
    <div class="warnbox"><strong>Règle de fair-play.</strong> Ferme cette page avant d'ouvrir une table et ne la rouvre qu'après la session. Une aide consultée pendant une main est sanctionnée par les rooms (fermeture du compte, solde confisqué).</div>
    <div class="stats">
      <div class="stat"><span>Spots réussis</span><b>${ts.n ? pct(ts.ok / ts.n) : '—'}</b><span>${ts.n} réponses</span></div>
      <div class="stat"><span>Série en cours</span><b>${state.progress.streak}</b><span>record ${state.progress.best}</span></div>
      <div class="stat"><span>Cours lu</span><b>${read}/${K.MODULES.length}</b><span>modules</span></div>
      <div class="stat"><span>Bankroll</span><b>${state.settings.bankroll0 || js.ss.length ? eur(js.bank) : '—'}</b><span>${js.ss.length ? '30 j : ' + eur(js.last30) : 'à renseigner dans Journal'}</span></div>
    </div>
    <div class="grid2">
      <section class="panel"><span class="eyebrow">Entraînement du jour</span><h2>${d.done >= 10 ? 'Fait : ' + d.ok + '/10' : d.done + '/10 spots'}</h2>
        <div class="meter"><i style="width:${Math.min(100, d.done * 10)}%"></i></div>
        <p class="note">Le mix choisit plus souvent les types où tu te trompes le plus.</p>
        <div class="row"><button class="btn primary" data-act="daily">${d.done ? 'Continuer' : 'Commencer'}</button></div></section>
      <section class="panel"><span class="eyebrow">Cours</span><h2>${nextMod ? esc(nextMod.title) : 'Cours terminé'}</h2>
        <p class="note">${nextMod ? 'Lecture : ' + nextMod.minutes + ' min. Puis l\'exercice lié.' : 'Relis les modules où tes spots sont les plus faibles.'}</p>
        <div class="row"><button class="btn" data-act="openmod" data-id="${nextMod ? nextMod.id : K.MODULES[0].id}">${nextMod ? 'Lire' : 'Revoir le cours'}</button></div></section>
    </div>
    <section class="panel"><span class="eyebrow">Points faibles</span><h2>Réussite par type de spot</h2>
      ${Object.entries(S.TYPES).map(([k, l]) => { const s = statOf(k), r = s.n ? s.ok / s.n : 0; return `<div class="typerow"><span>${l}</span><div class="meter"><i style="width:${r * 100}%"></i></div><span class="mono">${s.n ? pct(r) : '—'}</span></div>`; }).join('')}
      <p class="note">Objectif avant de jouer en argent réel : 90 % en Ouverture et en Cotes du pot.</p></section>
    <section class="panel"><span class="eyebrow">Avant de lancer une session</span><h2>Checklist anti-tilt</h2>
      ${['Je suis reposé, calme, sans perte récente qui me travaille.', 'J\'ai fait mes 10 spots du jour.', ms ? `Ma bankroll permet la limite que je vais jouer (maximum : ${ms}).` : 'Ma bankroll permet la limite que je vais jouer (renseigne-la dans Journal).', 'Mon stop-loss est fixé : 3 caves perdues, j\'arrête.', 'NUTS sera fermé pendant toute la session.']
        .map((t, i) => `<label class="check"><input type="checkbox" id="ck${i}" data-act="check"><span>${t}</span></label>`).join('')}
      <p id="ckDone" class="pill good" hidden>Prêt. Ferme NUTS, ouvre la room, une seule chose à travailler.</p></section>`;
  };

  // ---------- Cours ----------
  let openMod = null;
  VIEWS.cours = () => {
    if (openMod) {
      const m = K.MODULES.find((x) => x.id === openMod), i = K.MODULES.indexOf(m), nxt = K.MODULES[i + 1];
      return `<div class="row"><button class="btn small" data-act="closemod">← Tous les modules</button><span class="eyebrow">Module ${i + 1} sur ${K.MODULES.length} · ${m.minutes} min</span></div>
      <article class="panel prose"><h1>${esc(m.title)}</h1>
        ${m.sections.map(([h, html]) => `<section><h2>${h}</h2><div class="prose tw">${html}</div></section>`).join('')}</article>
      <div class="row"><button class="btn primary" data-act="readmod" data-id="${m.id}">${state.progress.read[m.id] ? 'Lu ✓' : 'Marquer comme lu'}</button>
        <button class="btn" data-act="drill" data-type="${m.drill}">S'entraîner : ${S.TYPES[m.drill]}</button>
        ${nxt ? `<button class="btn" data-act="openmod" data-id="${nxt.id}">Module suivant →</button>` : ''}</div>`;
    }
    return `<section style="display:grid;gap:8px"><h1>Cours A-Z</h1><p class="lead">Dans l'ordre. Chaque module se termine par un exercice dans Spots. Total : ${K.MODULES.reduce((a, m) => a + m.minutes, 0)} minutes de lecture.</p></section>
      <div class="modlist">${K.MODULES.map((m, i) => `<button class="mod${state.progress.read[m.id] ? ' done' : ''}" data-act="openmod" data-id="${m.id}"><span class="n">${state.progress.read[m.id] ? '✓' : String(i + 1).padStart(2, '0')}</span><span><h3>${esc(m.title)}</h3><span class="note">${m.sections.map((s) => s[0]).join(' · ')}</span></span><span class="note mono">${m.minutes} min</span></button>`).join('')}</div>`;
  };
  AFTER.cours = () => {
    const tb = $('#rfi-pct'); if (tb) tb.innerHTML = C.POS.map((p) => `<tr><td>${C.RFI[p].label}</td><td>${fr(E.rangePct(E.parseRange(C.RFI[p].range)), 0)} %</td></tr>`).join('') + '<tr><td>BB</td><td>Défend selon l\'ouverture adverse</td></tr>';
  };

  // ---------- Spots ----------
  let spotMode = 'mix', sitCat = '', spot = null, answered = null, daily = false;
  function newSpot() {
    spot = spotMode === 'mix' ? S.mix(rand, state.progress.stats) : spotMode === 'situations' ? S.GEN.situations(rand, sitCat) : S.GEN[spotMode](rand);
    answered = null;
  }
  function answer(i) {
    if (answered !== null || !spot) return;
    answered = i;
    const ok = Array.isArray(spot.ok) ? spot.ok.includes(i) : spot.ok === i, p = state.progress;
    const st = p.stats[spot.type] || (p.stats[spot.type] = { ok: 0, n: 0 });
    st.n++; if (ok) st.ok++;
    p.streak = ok ? p.streak + 1 : 0; p.best = Math.max(p.best, p.streak);
    if (daily) { if (p.daily.date !== today()) p.daily = { date: today(), done: 0, ok: 0 }; p.daily.done++; if (ok) p.daily.ok++; if (p.daily.done >= 10) daily = false; }
    Store.save('progress'); render();
  }
  VIEWS.spots = () => {
    if (!spot) newSpot();
    const cats = [...new Set(K.SITUATIONS.map((s) => s.cat))];
    const ok = answered !== null && (spot.ok === answered);
    const st = statOf(spot.type), d = state.progress.daily;
    const visual = spot.hands
      ? `<div class="felt"><span class="eyebrow">Board</span>${cardsHTML(spot.board)}${spot.hands.map((h, i) => `<div class="row"><span class="mono" style="width:80px">Joueur ${i + 1}</span>${cardsHTML(h, true)}</div>`).join('')}</div>`
      : spot.cards || spot.board ? `<div class="felt">${spot.board ? `<span class="eyebrow">Board</span>${cardsHTML(spot.board)}` : ''}${spot.cards ? `<span class="eyebrow">Ta main</span>${cardsHTML(spot.cards)}` : ''}</div>` : '';
    return `<section style="display:grid;gap:8px"><h1>Spots</h1><p class="lead">Une décision, une correction immédiate. Raccourcis : touches 1 à 4 pour répondre, Entrée pour la suite.</p></section>
      <div class="row" role="group" aria-label="Type de spot">${[['mix', 'Mix'], ...Object.entries(S.TYPES)].map(([k, l]) => `<button class="chip" aria-pressed="${spotMode === k}" data-act="mode" data-mode="${k}">${l}</button>`).join('')}</div>
      ${spotMode === 'situations' ? `<label class="f" style="max-width:260px">Catégorie<select id="sitcat" data-act="sitcat"><option value="">Toutes</option>${cats.map((c) => `<option ${c === sitCat ? 'selected' : ''}>${c}</option>`).join('')}</select></label>` : ''}
      ${daily ? `<div class="row"><span class="pill">Entraînement du jour · ${d.date === today() ? d.done : 0}/10</span></div>` : ''}
      <section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">${esc(spot.title)}</span><span class="note mono">${st.n ? pct(st.ok / st.n) + ' sur ' + st.n : 'premier essai'} · série ${state.progress.streak}</span></div>
        <p style="font-size:17px">${spot.prompt}</p>${visual}
        <div class="opts">${spot.opts.map((o, i) => `<button class="opt${answered !== null && i === spot.ok ? ' ok' : ''}${answered === i && i !== spot.ok ? ' ko' : ''}" data-act="ans" data-i="${i}" ${answered !== null ? 'disabled' : ''}><span class="mono note">${i + 1}</span> ${esc(o)}</button>`).join('')}</div>
        ${answered !== null ? `<div class="verdict ${ok ? 'good' : 'bad'}"><b>${ok ? 'Juste.' : 'Non : ' + esc(spot.opts[spot.ok]) + '.'}</b>${esc(spot.why)}</div>
        <div class="row"><button class="btn primary" data-act="next" id="nextBtn">Spot suivant</button>${spot.type === 'tirage' || spot.type === 'meilleure' ? '<button class="btn" data-act="toEq">Analyser dans Équité</button>' : ''}</div>` : ''}
      </section>`;
  };
  document.addEventListener('keydown', (e) => {
    if (tab !== 'spots' || e.target.closest('input,select,textarea')) return;
    if (/^[1-4]$/.test(e.key) && answered === null && spot && +e.key <= spot.opts.length) answer(+e.key - 1);
    else if (e.key === 'Enter' && answered !== null) { newSpot(); render(); }
  });

  // ---------- Équité ----------
  const eqIn = { p: ['AhKh', 'QcQs', '', ''], board: '2h7hJd' };
  let eqOut = null;
  function parsePlayer(s) {
    s = (s || '').trim(); if (!s) return null;
    if (/^([2-9TJQKA][shdc]){2}$/i.test(s.replace(/\s/g, ''))) return { hand: E.parseCards(s), label: s };
    return { combos: E.rangeCombos(s), label: s };
  }
  function runEquity() {
    try {
      const board = E.parseCards(eqIn.board);
      const ps = eqIn.p.map(parsePlayer).map((p, i) => p && { ...p, idx: i }).filter(Boolean);
      if (ps.length < 2) throw new Error('Il faut au moins deux joueurs.');
      if (board.length > 5 || board.length === 1 || board.length === 2) throw new Error('Le board fait 0, 3, 4 ou 5 cartes.');
      const all = [...board, ...ps.flatMap((p) => p.hand || [])];
      if (new Set(all).size !== all.length) throw new Error('Une carte apparaît deux fois.');
      const t0 = performance.now(), r = E.equity(ps, board, { iterations: 60000 });
      let outs = null;
      if (ps.length === 2 && ps[0].hand && ps[1].hand && (board.length === 3 || board.length === 4)) outs = E.outs(ps[0].hand, ps[1].hand, board);
      eqOut = { ps, r, ms: performance.now() - t0, outs, board };
    } catch (e) { eqOut = { err: e.message }; }
  }
  VIEWS.equite = () => {
    if (!eqOut) runEquity();
    const ex = [['AA contre KK', ['AsAh', 'KdKc', '', ''], ''], ['Tirage couleur contre top paire', ['AhKh', 'QcQs', '', ''], '2h7hJd'], ['AK contre une range de 3-bet', ['AdKc', 'QQ+, AK', '', ''], ''], ['Paire de 5 contre 3 joueurs', ['5s5c', 'random', 'random', 'random'], '']];
    let res = '';
    if (eqOut?.err) res = `<p class="pill bad">${esc(eqOut.err)}</p>`;
    else if (eqOut) {
      res = eqOut.ps.map((p, i) => `<div class="eqrow"><div style="display:grid;gap:4px;min-width:0"><span class="note">Joueur ${p.idx + 1} · ${p.hand ? '' : 'range ' + E.rangePct(E.parseRange(p.label)).toFixed(1).replace('.', ',') + ' % · '}${esc(p.label)}</span><div class="eqbar"><i style="width:${eqOut.r.equity[i] * 100}%"></i></div></div><b class="mono" style="font-size:18px;text-align:right">${pct(eqOut.r.equity[i], 1)}</b></div>`).join('')
        + `<p class="note">${eqOut.r.exact ? 'Calcul exact' : 'Monte-Carlo'} sur ${eqOut.r.n.toLocaleString('fr-FR')} ${eqOut.r.exact ? 'tirages' : 'simulations'} en ${Math.round(eqOut.ms)} ms. Égalités : ${eqOut.r.tie.map((x) => pct(x, 1)).join(' / ')}.</p>`
        + (eqOut.outs ? `<div class="felt"><span class="eyebrow">Outs du joueur 1 à la prochaine carte : ${eqOut.outs.length} sur ${52 - 4 - eqOut.board.length}</span>${eqOut.outs.length ? cardsHTML(eqOut.outs, true) : '<p class="note">Aucune carte ne le fait passer devant.</p>'}</div>` : '');
    }
    return `<section style="display:grid;gap:8px"><h1>Calculateur d'équité</h1><p class="lead">Pour revoir tes mains après la session. Une main se note <span class="mono">AhKh</span> (h cœur, d carreau, c trèfle, s pique, T pour le 10). Une range se note <span class="mono">22+, A2s+, KQo, 76s-54s</span> ou <span class="mono">random</span>.</p></section>
      <section class="panel"><div class="form">
        ${eqIn.p.map((v, i) => `<label class="f">Joueur ${i + 1}${i === 0 ? ' (toi)' : ''}<input id="eqp${i}" data-eq="${i}" value="${esc(v)}" placeholder="${i < 2 ? 'main ou range' : 'facultatif'}" autocomplete="off" spellcheck="false"></label>`).join('')}
        <label class="f">Board (0, 3, 4 ou 5 cartes)<input id="eqb" data-eq="b" value="${esc(eqIn.board)}" placeholder="2h7hJd" autocomplete="off" spellcheck="false"></label></div>
        <div class="row"><button class="btn primary" data-act="calc">Calculer</button>${ex.map(([l], i) => `<button class="btn small" data-act="eqex" data-i="${i}">${l}</button>`).join('')}</div>
        ${res}</section>`;
  };
  const EQEX = [[['AsAh', 'KdKc', '', ''], ''], [['AhKh', 'QcQs', '', ''], '2h7hJd'], [['AdKc', 'QQ+, AK', '', ''], ''], [['5s5c', 'random', 'random', 'random'], '']];

  // ---------- Ranges ----------
  let rPos = 'BTN', custom = null;
  VIEWS.ranges = () => {
    const set = custom || E.parseRange(C.RFI[rPos].range);
    const cells = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) { const h = E.handName(i, j); cells.push(`<button class="rc${set.has(h) ? ' on' : ''}" data-act="cell" data-h="${h}" aria-pressed="${set.has(h)}" aria-label="${h}">${h}</button>`); }
    return `<section style="display:grid;gap:8px"><h1>Ranges d'ouverture</h1><p class="lead">Premier à entrer dans le coup, 6-max, 100 bb. Point de départ standard, à élargir contre des blindes faibles et à resserrer contre des joueurs agressifs. Clique une case pour créer ta propre range.</p></section>
      <div class="row">${C.POS.map((p) => `<button class="chip" aria-pressed="${p === rPos && !custom}" data-act="pos" data-p="${p}">${p}</button>`).join('')}${custom ? '<span class="pill">Range perso</span>' : ''}</div>
      <section class="panel"><div class="row" style="justify-content:space-between"><h2>${custom ? 'Range perso' : C.RFI[rPos].label}</h2><b class="mono" style="font-size:20px">${fr(E.rangePct(set), 1)} %</b></div>
        <div class="rgrid" role="group" aria-label="Grille des 169 mains">${cells.join('')}</div>
        <p class="note">Diagonale : paires. Au-dessus : mains assorties (s). En dessous : dépareillées (o). Taille d'ouverture : ${C.RFI[rPos].size}.</p>
        <p class="mono note" style="word-break:break-word">${esc([...set].join(', '))}</p>
        <div class="row"><button class="btn" data-act="r2eq">Utiliser comme range adverse dans Équité</button>${custom ? '<button class="btn" data-act="rreset">Revenir à la range standard</button>' : ''}<button class="btn" data-act="drill" data-type="rfi">S'entraîner aux ouvertures</button></div></section>`;
  };

  // ---------- Journal ----------
  const ROOMS = ['Winamax', 'PokerStars.fr', 'Betclic', 'PMU', 'Casino', 'Autre'], FORMATS = ['Cash', 'MTT', 'Expresso', 'Sit&Go'];
  let jMsg = '', confirmDel = null, sim = { wr: 5, sd: 90, hands: 50000, bi: 40, seed: 1 };
  VIEWS.journal = () => {
    const js = journalStats(), ms = maxStake(js.bank);
    const rows = js.ss.slice().reverse().map((s) => `<tr><td class="mono">${s.date.split('-').reverse().join('/')}</td><td>${esc(s.room)}</td><td>${esc(s.format)} ${esc(s.stake)}</td><td class="mono" style="color:var(${s.result >= 0 ? '--good' : '--bad'})">${eur(s.result)}</td><td class="mono">${s.hands || '—'}</td><td>${'●'.repeat(s.tilt || 0) || '—'}</td><td class="note">${esc(s.notes)}</td><td><button class="btn small" data-act="${confirmDel === s.id ? 'delok' : 'del'}" data-id="${s.id}">${confirmDel === s.id ? 'Confirmer' : 'Supprimer'}</button></td></tr>`).join('');
    return `<section style="display:grid;gap:8px"><h1>Journal</h1><p class="lead">Saisis chaque session juste après l'avoir jouée. Le journal applique ton stop-loss et dit quelle limite ta bankroll autorise.</p></section>
      <div class="stats">
        <div class="stat"><span>Bankroll</span><b>${eur(js.bank)}</b><span>départ ${eur(+state.settings.bankroll0 || 0)}</span></div>
        <div class="stat"><span>Résultat total</span><b style="color:var(${js.total >= 0 ? '--good' : '--bad'})">${eur(js.total)}</b><span>${js.ss.length} sessions</span></div>
        <div class="stat"><span>Par heure</span><b>${js.mins ? eur(js.total / js.mins * 60) : '—'}</b><span>${Math.round(js.mins / 60)} h jouées</span></div>
        <div class="stat"><span>Winrate cash</span><b>${js.wr !== null ? fr(js.wr, 1) : '—'}</b><span>${js.wr !== null ? `bb/100 · ±${fr(js.ci, 1)} (95 %) sur ${js.hands.toLocaleString('fr-FR')} mains` : 'renseigne les mains jouées'}</span></div>
        <div class="stat"><span>Limite max</span><b>${ms || '—'}</b><span>règle des ${state.settings.biRule} caves</span></div>
      </div>
      ${js.wr !== null ? `<p class="note">L'intervalle suppose un écart-type de 90 bb/100, valeur courante en 6-max. Tant qu'il contient 0, le résultat ne prouve rien.</p>` : ''}
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
      ${rows ? `<section class="panel"><span class="eyebrow">Sessions</span><div class="tw"><table class="t"><thead><tr><th>Date</th><th>Room</th><th>Jeu</th><th>Résultat</th><th>Mains</th><th>Tilt</th><th>Note</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>` : ''}
      <section class="panel"><span class="eyebrow">Réglages</span><div class="form">
        <label class="f">Bankroll de départ (€)<input id="sbank" data-set="bankroll0" inputmode="decimal" value="${state.settings.bankroll0 || ''}" placeholder="200"></label>
        <label class="f">Règle de caves (cash)<input id="sbi" data-set="biRule" inputmode="numeric" value="${state.settings.biRule}"></label></div>
        <details><summary class="note" style="cursor:pointer">Sauvegarde manuelle (copier / coller)</summary><div style="display:grid;gap:8px;margin-top:10px">
          <textarea id="jexport" rows="4" class="mono" style="width:100%;font-size:12px;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px" aria-label="Données du journal"></textarea>
          <div class="row"><button class="btn small" data-act="exp">Afficher et copier mes données</button><button class="btn small" data-act="imp">Importer le texte collé</button></div></div></details></section>
      <section class="panel"><span class="eyebrow">Simulateur de variance</span><h2>À quoi ressemblent ${sim.hands.toLocaleString('fr-FR')} mains</h2>
        <div class="form">
          <label class="f">Vrai winrate (bb/100)<input id="vwr" data-sim="wr" inputmode="decimal" value="${sim.wr}"></label>
          <label class="f">Écart-type (bb/100)<input id="vsd" data-sim="sd" inputmode="decimal" value="${sim.sd}"></label>
          <label class="f">Mains<input id="vh" data-sim="hands" inputmode="numeric" value="${sim.hands}"></label>
          <label class="f">Bankroll (caves)<input id="vbi" data-sim="bi" inputmode="numeric" value="${sim.bi}"></label></div>
        <canvas id="simc" height="240" aria-label="Trajectoires simulées"></canvas><div id="simstats" class="stats"></div>
        <div class="row"><button class="btn" data-act="resim">Relancer 30 trajectoires</button></div>
        <p class="note">Chaque courbe est un joueur au même niveau réel. Les écarts entre elles, c'est la chance. Risque de ruine : formule exp(−2 × winrate × bankroll ÷ écart-type²).</p></section>`;
  };
  function drawLines(cv, series, opts = {}) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.height / (cv._dpr || 1);
    cv._dpr = dpr; cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px'; const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const cs = getComputedStyle(document.documentElement), col = (v) => cs.getPropertyValue(v).trim();
    const all = series.flatMap((s) => s.pts), z = opts.zero !== false ? [0] : [];
    let ymin = Math.min(...z, ...all, opts.floor ?? all[0]), ymax = Math.max(...z, ...all);
    if (ymax - ymin < 1e-9) { ymin -= 1; ymax += 1; } else if (opts.zero === false) { const m = (ymax - ymin) * 0.1; ymin -= m; ymax += m; }
    const pad = { l: 56, r: 10, t: 10, b: 22 }, n = Math.max(...series.map((s) => s.pts.length)) - 1 || 1;
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
    const gauss = () => { let u = 0, v = 0; while (!u) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    let losers = 0, dds = [];
    for (let p = 0; p < 30; p++) {
      const pts = [0]; let x = 0, peak = 0, dd = 0;
      for (let s = 0; s < steps; s++) { x += sim.wr + sim.sd * gauss(); pts.push(x); peak = Math.max(peak, x); dd = Math.max(dd, peak - x); }
      if (x < 0) losers++; dds.push(dd); paths.push(pts.filter((_, i) => i % Math.ceil(steps / 300) === 0 || i === steps));
    }
    dds.sort((a, b) => a - b);
    const ror = sim.wr > 0 ? Math.exp(-2 * sim.wr * sim.bi * 100 / (sim.sd * sim.sd)) : 1;
    return { paths, losers, ddMed: dds[15] / 100, ror };
  }
  AFTER.journal = () => {
    const js = journalStats();
    const bc = $('#bankc');
    if (bc) { let b = +state.settings.bankroll0 || 0; const pts = [b, ...js.ss.map((s) => (b += s.result))]; drawLines(bc, [{ pts }], { zero: false, fmt: (v) => fr(v, 0) + ' €' }); }
    const r = runSim(), sc = $('#simc');
    drawLines(sc, r.paths.map((pts, i) => ({ pts, color: i === 0 ? '--accent' : '--muted', alpha: i === 0 ? 1 : 0.35, width: i === 0 ? 2.5 : 1 })), { floor: -sim.bi * 100, fmt: (v) => fr(v / 100, 0) + ' c', xlabel: 'mains →' });
    $('#simstats').innerHTML = `<div class="stat"><span>Trajectoires perdantes</span><b>${r.losers}/30</b><span>avec un vrai winrate de ${fr(sim.wr, 1)}</span></div>
      <div class="stat"><span>Pire chute (médiane)</span><b>${fr(r.ddMed, 1)} caves</b><span>du sommet au creux</span></div>
      <div class="stat"><span>Risque de ruine</span><b>${sim.wr > 0 ? pct(r.ror, r.ror < 0.01 ? 2 : 0) : '100 %'}</b><span>bankroll de ${sim.bi} caves</span></div>`;
  };

  // ---------- Événements ----------
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab],[data-act]'); if (!t) return;
    if (t.dataset.tab) return go(t.dataset.tab);
    const a = t.dataset.act;
    if (a === 'check') { const all = [...document.querySelectorAll('[data-act=check]')].every((c) => c.checked); $('#ckDone').hidden = !all; return; }
    if (a === 'daily') { daily = true; spotMode = 'mix'; spot = null; return go('spots'); }
    if (a === 'openmod') { openMod = t.dataset.id; return go('cours'); }
    if (a === 'closemod') { openMod = null; return render(); }
    if (a === 'readmod') { state.progress.read[t.dataset.id] = true; Store.save('progress'); return render(); }
    if (a === 'drill') { spotMode = t.dataset.type; daily = false; spot = null; return go('spots'); }
    if (a === 'mode') { spotMode = t.dataset.mode; daily = false; spot = null; return render(); }
    if (a === 'ans') return answer(+t.dataset.i);
    if (a === 'next') { newSpot(); render(); $('.opt')?.focus(); return; }
    if (a === 'toEq') {
      if (spot.hands) { eqIn.p = spot.hands.map((h) => h.map(E.cardStr).join('')).concat(['']); eqIn.board = spot.board.slice(0, 3).map(E.cardStr).join(''); }
      else { eqIn.p = [spot.cards.map(E.cardStr).join(''), '', '', '']; eqIn.board = spot.board.map(E.cardStr).join(''); const v = S.villainRange(spot.board).filter((c) => !spot.cards.includes(c[0]) && !spot.cards.includes(c[1])); eqIn.p[1] = [...new Set(v.map((c) => E.abstractOf(c[0], c[1])))].join(', '); }
      eqOut = null; return go('equite');
    }
    if (a === 'calc') { runEquity(); return render(); }
    if (a === 'eqex') { const [p, b] = EQEX[+t.dataset.i]; eqIn.p = p.slice(); eqIn.board = b; runEquity(); return render(); }
    if (a === 'pos') { rPos = t.dataset.p; custom = null; return render(); }
    if (a === 'cell') { if (!custom) custom = new Set(E.parseRange(C.RFI[rPos].range)); const h = t.dataset.h; custom.has(h) ? custom.delete(h) : custom.add(h); return render(); }
    if (a === 'rreset') { custom = null; return render(); }
    if (a === 'r2eq') { eqIn.p[1] = [...(custom || E.parseRange(C.RFI[rPos].range))].join(', '); eqIn.board = ''; eqOut = null; return go('equite'); }
    if (a === 'del') { confirmDel = t.dataset.id; return render(); }
    if (a === 'delok') { state.journal.sessions = state.journal.sessions.filter((s) => s.id !== t.dataset.id); confirmDel = null; jMsg = 'Session supprimée.'; Store.save('journal'); return render(); }
    if (a === 'resim') { sim.seed++; return AFTER.journal(); }
    if (a === 'exp') {
      const ta = $('#jexport'); ta.value = JSON.stringify({ settings: state.settings, journal: state.journal, progress: state.progress });
      ta.select(); try { await navigator.clipboard.writeText(ta.value); jMsg = 'Données copiées. Colle-les dans un fichier pour les garder.'; } catch (err) { jMsg = 'Copie automatique refusée : le texte est sélectionné, copie-le à la main.'; }
      const keep = ta.value; render(); $('#jexport').value = keep; $('details').open = true; return;
    }
    if (a === 'imp') {
      try { const d = JSON.parse($('#jexport').value); if (!Array.isArray(d.journal?.sessions)) throw new Error();
        Object.assign(state.settings, d.settings || {}); state.journal.sessions = d.journal.sessions; if (d.progress) Object.assign(state.progress, d.progress);
        ['settings', 'journal', 'progress'].forEach((k) => Store.save(k)); jMsg = d.journal.sessions.length + ' sessions importées.';
      } catch (err) { jMsg = 'Texte illisible : colle exactement le texte copié depuis « Afficher et copier mes données ».'; }
      return render();
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'sitcat') { sitCat = t.value; spot = null; render(); }
    if (t.dataset.set) { state.settings[t.dataset.set] = +String(t.value).replace(',', '.') || 0; Store.save('settings'); render(); }
    if (t.dataset.sim) { sim[t.dataset.sim] = Math.max(t.dataset.sim === 'hands' ? 100 : t.dataset.sim === 'sd' ? 1 : -50, +String(t.value).replace(',', '.') || 0); render(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.eq) return;
    if (t.dataset.eq === 'b') eqIn.board = t.value; else eqIn.p[+t.dataset.eq] = t.value;
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'jform') return;
    e.preventDefault();
    const f = new FormData(e.target), num = (k) => +String(f.get(k) || '').replace(/\s/g, '').replace(',', '.').replace('−', '-');
    const s = { id: 's' + Date.now().toString(36), date: f.get('date'), room: f.get('room'), format: f.get('format'), stake: String(f.get('stake')).trim().toUpperCase().replace(/\s/g, ''), result: num('result'), hands: num('hands') || 0, minutes: num('minutes') || 0, tilt: +f.get('tilt'), notes: String(f.get('notes') || '').slice(0, 200) };
    if (!Number.isFinite(s.result)) { jMsg = 'Résultat illisible : écris par exemple −4,20 ou 12.'; return render(); }
    state.journal.sessions.push(s); Store.save('journal');
    const bi = buyIn(s), lost = bi ? -s.result / bi : 0;
    const ms = maxStake(journalStats().bank), bb = bbOf(s.stake);
    jMsg = lost >= 3 ? `<strong>Stop-loss atteint :</strong> ${fr(lost, 1)} caves perdues. Fin de session, pas de retour aux tables aujourd'hui.`
      : s.tilt >= 2 ? '<strong>Tilt noté.</strong> Pause d\'au moins 30 minutes avant toute nouvelle session, et relis le module Mental.'
      : bb && ms && bb * 100 > bbOf(ms) * 100 ? `<strong>Attention :</strong> ta bankroll autorise au plus ${ms}. Redescends de limite.`
      : 'Session enregistrée.';
    render();
  });

  // ---------- Démarrage ----------
  render();
  Store.init().then(render);
})();
