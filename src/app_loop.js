// La boucle SIGMA 52 : jouer → importer → revoir au solveur → corriger ses vraies erreurs → vérifier.
// Une seule carte en tête d'Aujourd'hui : l'état de chaque étape et LA prochaine action, déduite des données.
(function () {
  const X = window.__S52, { esc, fr, pct, state, ACT, VIEWS, today, go } = X;
  const days = (d) => (d ? Math.round((Date.parse(today()) - Date.parse(d)) / 864e5) : null);
  const ago = (d) => { const n = days(d); return n === null ? 'jamais' : n <= 0 ? "aujourd'hui" : n === 1 ? 'hier' : `il y a ${n} j`; };
  function loopState() {
    const js = X.journalStats(), ss = js.ss, lastPlay = ss.length ? ss[ss.length - 1].date : null;
    const imp = state.notes.lastImport, lastImp = imp?.at || null;
    const H = (state.progress.evHist || []).filter((r) => r.real && r.n), last = H[H.length - 1] || null, prev = H[H.length - 2] || null;
    const real = X.realDue?.() || [], dueNow = real.filter((r) => r.due <= today()).length;
    const proven = js.wr !== null && js.ci !== null && js.wr - js.ci > 0;
    return { js, lastPlay, imp, lastImp, H, last, prev, real, dueNow, proven, played14: ss.filter((s) => days(s.date) <= 14).length };
  }
  function next(L) {
    if (L.dueNow) return { t: `Rejoue tes ${L.dueNow} vraie${L.dueNow > 1 ? 's' : ''} erreur${L.dueNow > 1 ? 's' : ''} du jour`, why: 'Tes propres décisions coûteuses, mêmes cartes, même ligne : c\'est l\'entraînement qui se transfère le mieux à la table.', act: 'realdrill', btn: 'Rejouer' };
    const R = X.rvState?.(); if (R && R.running) return { t: `Revue EV en cours : ${R.done}/${R.total} mains`, why: 'Tes dernières mains sont recalculées au solveur en arrière-plan ; tes erreurs coûteuses arriveront ici dès la fin.', act: 'loopreview', btn: 'Voir la revue' };
    if (L.lastImp && (!L.last || L.lastImp > L.last.date)) return { t: 'Lance la revue EV de tes dernières mains', why: `Mains importées ${ago(L.lastImp)} mais pas encore revues au solveur : c'est la revue qui trouve tes erreurs les plus chères.`, act: 'loopreview', btn: 'Revue EV' };
    if (L.lastPlay && (!L.lastImp || L.lastPlay > L.lastImp)) return { t: 'Importe les mains de ta dernière session', why: `Session jouée ${ago(L.lastPlay)}, mains pas encore importées : sans import, la boucle s'arrête.`, act: 'loopimport', btn: 'Importer' };
    if (!L.lastPlay || days(L.lastPlay) > 7) return { t: 'Joue une session (checklist d\'abord)', why: L.lastPlay ? `Dernière session ${ago(L.lastPlay)} : l'étude sans jeu réel ne se mesure pas.` : 'Aucune session au Journal : la boucle commence par du jeu réel, même court, à une limite couverte par ta bankroll.', act: 'loopplay', btn: 'Préparer la session' };
    return { t: 'Plan du jour : 10 exercices tirés de tes fuites', why: 'Rien d\'urgent dans la boucle : on consolide.', act: 'loopplan', btn: 'Commencer' };
  }
  function cardHTML() {
    const L = loopState(), N = next(L), js = L.js;
    const step = (n, label, val, sub, ok) => `<div class="loopstep${ok ? ' ok' : ''}"><span class="eyebrow">${n} · ${label}</span><b>${val}</b><span class="note">${sub}</span></div>`;
    const trend = L.last && L.prev ? (L.last.pctDec < L.prev.pctDec * 0.85 ? ' · en baisse' : L.last.pctDec > L.prev.pctDec * 1.15 ? ' · en hausse' : ' · stable') : '';
    return `<section class="panel loop"><span class="eyebrow">Ta boucle</span><h2>${esc(N.t)}</h2><p class="note">${esc(N.why)}</p>
      <div class="row"><button class="btn primary" data-act="${N.act}">${N.btn}</button></div>
      <div class="loopsteps">
        ${step(1, 'Jouer', ago(L.lastPlay), `${L.played14} session${L.played14 > 1 ? 's' : ''} sur 14 jours`, L.lastPlay && days(L.lastPlay) <= 7)}
        ${step(2, 'Importer', ago(L.lastImp), L.imp ? `${L.imp.hands} mains` : 'historiques de la room', L.lastImp && (!L.lastPlay || L.lastImp >= L.lastPlay))}
        ${step(3, 'Revoir', L.last ? fr(L.last.pctDec * 100, 2) + ' %' : '—', L.last ? `du pot perdu par décision${trend}` : 'revue EV au solveur', L.last && (!L.lastImp || L.last.date >= L.lastImp))}
        ${step(4, 'Corriger', String(L.real.length), L.real.length ? `vraies erreurs en révision, ${L.dueNow} aujourd'hui` : 'erreurs réelles à rejouer', L.real.length && !L.dueNow)}
        ${step(5, 'Vérifier', js.wr === null ? '—' : `${js.wr >= 0 ? '+' : '−'}${fr(Math.abs(js.wr), 1)}`, js.wr === null ? 'bb/100 sur tes sessions cash' : `bb/100 ± ${fr(js.ci, 1)} · ${L.proven ? 'gain prouvé à 95 %' : 'pas encore prouvé'} (${js.hands} mains)${(() => { const R = stakeRule(); return R.v === 'none' ? '' : ' · limite : ' + { up: 'monter', stay: 'rester', down: 'descendre' }[R.v]; })()}`, L.proven)}
      </div></section>`;
  }
  // Règle de montée de limite : bankroll (règle de caves), indicateur avancé (revues EV) et résultat réel (borne haute de l'intervalle).
  const LIM = [2, 5, 10, 25, 50, 100, 200];
  function curStake(js) {
    if (/^NL\d+$/.test(state.settings.proStake || '')) return +state.settings.proStake.slice(2);
    const n = {}; js.ss.filter((x) => x.format === 'Cash' && /^NL\d+$/.test(x.stake)).slice(-30).forEach((x) => (n[x.stake] = (n[x.stake] || 0) + (x.hands || 1)));
    const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0]; return top ? +top[0].slice(2) : null;
  }
  function stakeRule() {
    const L = loopState(), js = L.js, cur = curStake(js), rule = +state.settings.biRule || 40;
    if (!cur) return { v: 'none' };
    const i = LIM.indexOf(cur), next = i >= 0 && i < LIM.length - 1 ? LIM[i + 1] : null, prev = i > 0 ? LIM[i - 1] : null;
    const cav = (x) => js.bank / x; // caves de 100 bb = x €
    const H = L.H.slice(-3), trendOk = H.length >= 3 && H[2].pctDec <= H[0].pctDec, levelOk = H.length && H[H.length - 1].pctDec < 0.02;
    const notLosing = js.wr === null || js.ci === null || js.wr + js.ci > 0, provenLosing = js.wr !== null && js.ci !== null && js.wr + js.ci < 0;
    const conds = [
      [`Bankroll ≥ ${rule} caves de NL${next || cur}`, next ? cav(next) >= rule : false, next ? `${fr(cav(next), 1)} caves` : 'limite maximale du tableau'],
      ['Trois revues EV, la dernière pas plus haute que la première', trendOk, H.length >= 3 ? `${fr(H[0].pctDec * 100, 2)} % → ${fr(H[2].pctDec * 100, 2)} %` : `${H.length}/3 revues`],
      ['Dernière revue sous 2 % du pot perdu par décision', !!levelOk, H.length ? `${fr(H[H.length - 1].pctDec * 100, 2)} %` : 'aucune revue'],
      ['Résultat réel pas prouvé perdant (borne haute > 0)', notLosing, js.wr === null ? 'pas de session cash' : `${fr(js.wr, 1)} ± ${fr(js.ci, 1)} bb/100`],
    ];
    let v = 'stay';
    if (cav(cur) < rule * 0.75 || (provenLosing && js.hands >= 20000)) v = prev ? 'down' : 'stay';
    else if (next && conds.every((c) => c[1])) v = 'up';
    return { v, cur, next, prev, conds, rule, bankCav: cav(cur) };
  }
  function stakeHTML() {
    const R = stakeRule();
    if (R.v === 'none') return `<section class="panel"><span class="eyebrow">Limite : monter, rester, descendre</span><p class="note">Renseigne tes sessions cash au Journal (limite NL2 à NL200) ou ta limite dans les réglages de Carrière pour obtenir un verdict.</p></section>`;
    const V = { up: ['good', `Monter à NL${R.next}`, 'Tous les critères sont réunis. Monte par paliers : quelques sessions à la nouvelle limite, retour à la précédente si la bankroll repasse sous la règle.'], stay: ['acc', `Rester à NL${R.cur}`, 'Au moins un critère manque : continue la boucle à cette limite.'], down: ['bad', `Descendre à NL${R.prev}`, `Bankroll sous ${Math.round(R.rule * 0.75)} caves de NL${R.cur}${''} ou résultat prouvé perdant sur plus de 20 000 mains : redescendre protège la bankroll.`] }[R.v];
    return `<section class="panel loop"><span class="eyebrow">Limite : monter, rester, descendre</span><h2><span class="pill ${V[0]}">${V[1]}</span></h2><p class="note">${V[2]}</p>
      <div class="tw"><table class="t"><thead><tr><th>Critère pour monter</th><th>Valeur</th><th>État</th></tr></thead><tbody>${R.conds.map((c) => `<tr><td>${esc(c[0])}</td><td>${esc(c[2])}</td><td>${c[1] ? '<span class="pill good">oui</span>' : '<span class="pill bad">non</span>'}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Bankroll : ${fr(R.bankCav, 1)} caves de NL${R.cur} (règle des ${R.rule} caves, réglable au Journal). La preuve statistique complète d'un winrate demande des centaines de milliers de mains : la règle s'appuie donc sur la bankroll et sur l'indicateur avancé (revues EV de tes vraies mains), et ne bloque que si le résultat réel est prouvé perdant.</p></section>`;
  }
  X.stakeRule = stakeRule;
  const baseCar = VIEWS.carriere;
  if (baseCar) VIEWS.carriere = () => { const h = baseCar(), i = h.indexOf('</section>'); return i >= 0 ? h.slice(0, i + 10) + stakeHTML() + h.slice(i + 10) : stakeHTML() + h; };
  X.loopCard = cardHTML; X.loopState = loopState;
  ACT.loopreview = () => { X.setAnSub?.('review'); go('analyse'); };
  ACT.loopimport = () => { X.setAnSub?.('import'); go('analyse'); };
  ACT.loopplay = () => go('journal');
  ACT.loopplan = () => (ACT.planstart ? ACT.planstart({ dataset: { n: '10' } }) : go('spots'));
  // Accueil : la boucle juste sous le titre ; l'entraînement du jour en double du plan du jour disparaît (le mode reste dans Spots).
  const baseJour = VIEWS.jour;
  VIEWS.jour = () => {
    let h = baseJour();
    h = h.replace(/<section class="panel"><span class="eyebrow">2 · Entraînement du jour<\/span>[\s\S]*?<\/section>\s*/, '').replace('<span class="eyebrow">3 · Cours', '<span class="eyebrow">2 · Cours')
      .replace(/<div class="grid3">(\s*<section class="panel"><span class="eyebrow">1 · Révisions)/, '<div class="grid2">$1');
    const t = h.indexOf("<h1>Ta séance d'aujourd'hui</h1>"), e = t >= 0 ? h.indexOf('</section>', t) : -1;
    return e >= 0 ? h.slice(0, e + 10) + cardHTML() + h.slice(e + 10) : cardHTML() + h;
  };
  // Studio (contenus pour réseaux sociaux) : hors du menu principal tant que la vente est en pause ; il reste dans la recherche (Ctrl+K).
  { const g = X.GROUPS.find((x) => x[0] === 'suivre'); if (g) { const i = g[2].indexOf('studio'); if (i >= 0) g[2].splice(i, 1); } }
})();
