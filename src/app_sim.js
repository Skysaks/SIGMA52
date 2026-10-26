// Vues ajoutées à SIGMA 52 : Simulateur (table avec coach, préparation et bilan, mains guidées, Expresso),
// Analyse (replayer, bibliothèque), Outils (distribution d'équité, deal ICM, mémo), Programme de progression.
(function () {
  const X = window.__S52, Co = window.Coach, G = window.Guided, P = window.Plan;
  const { E, C, K, S, SV, B, HH, TS, $, esc, fr, sgn, pct, today, state, Store, render, go, head, cardHTML, backHTML, cardsHTML, VIEWS, TOOLVIEWS, TOOLS, ACT, ONCHANGE, ONINPUT, ONKEY, LINEUPS } = X;
  const save = (k) => Store.save(k);
  const fbb = (x, t) => fr(x / t.bb, 1);

  // ================= Simulateur =================
  let sub = 'table';
  const SUBS = [['table', 'Table cash + coach'], ['practice', 'Mains notées (EV)'], ['guided', 'Mains guidées'], ['legends', 'Mains de légende'], ['expresso', 'Expresso et Spin'], ['mtt', 'Tournoi 100 joueurs']];
  VIEWS.sim = () => head('Simulateur', 'S\'entraîner en conditions de jeu, avec un coach qui explique chaque décision. C\'est un simulateur : l\'aide y est permise. En room, rien de tout ça n\'est autorisé.') +
    `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${sub === k}" data-act="simsub" data-s="${k}">${l}</button>`).join('')}</div>` + SIMVIEWS[sub]();
  ACT.simsub = (t) => { sub = t.dataset.s; render(); };
  const SIMVIEWS = {};
  SIMVIEWS.practice = () => (X.practiceHTML ? X.practiceHTML() : '');
  SIMVIEWS.legends = () => (X.legendsHTML ? X.legendsHTML() : '');
  // ---- Tournoi de 100 joueurs ----
  let mt = null; const mprep = { mix: 'standard', mode: 'live' };
  SIMVIEWS.mtt = () => {
    const MT = window.MTT, R = state.progress.mtt;
    const rec = R ? `<div class="stats"><div class="stat hero"><span>Tournois joués</span><b>${R.games}</b><span>${R.itm} dans l'argent · ${R.wins} victoire${R.wins > 1 ? 's' : ''}</span></div><div class="stat"><span>Gains simulés</span><b>${fr(R.prizes, 0)} €</b><span>pour ${fr(R.games * 10, 0)} € de buy-ins · ROI ${R.games ? pct(R.prizes / (R.games * 10) - 1, 0) : '—'}</span></div><div class="stat"><span>Meilleure place</span><b>${R.best ?? '—'}</b><span>sur 100</span></div></div>` : '';
    if (!mt) return `<section class="panel"><span class="eyebrow">Tournoi simulé · 100 joueurs · buy-in 10 € · 15 places payées</span><h2>Du début à la table finale, en accéléré</h2>
      <p class="note">Tu joues ta table main par main ; les 16 autres tables avancent en même temps (modèle statistique : vols de blindes et tapis de plus en plus fréquents quand les tapis raccourcissent). Les places libres de ta table sont reprises par des joueurs du field, avec leur tapis. 10 000 jetons, niveau toutes les 8 mains de ta table, ${MT.LEVELS.length} niveaux de 50/100 à 50 000/100 000.</p>
      <div class="row"><span class="note">Field :</span>${[['standard', 'Standard'], ['fish', 'Beaucoup de joueurs loisir'], ['regs', 'Beaucoup de réguliers']].map(([k, l]) => `<button class="chip" aria-pressed="${mprep.mix === k}" data-act="mtmix" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Coach :</span>${[['live', 'En direct'], ['exam', 'Examen'], ['free', 'Sans aide']].map(([k, l]) => `<button class="chip" aria-pressed="${mprep.mode === k}" data-act="mtmode" data-v="${k}">${l}</button>`).join('')}</div>
      <p class="note">Gains : ${MT.PAYOUTS.slice(0, 6).map((x, i) => `${i === 0 ? '1er' : i + 1 + 'e'} ${fr(x * 10, 0)} €`).join(' · ')} · 7e à 9e 42 € · 10e à 12e 32 € · 13e à 15e 15 €.</p>
      <div class="row"><button class="btn primary" data-act="mtstart">Lancer le tournoi</button><button class="btn small" data-act="openmod" data-id="icm">Module ICM et bulle</button></div></section>${rec}`;
    const g = mt, t = g.tb, G = g.game, st = G.status(), L = !t.done && t.toAct === 0 && !t.players[0].out ? t.legal() : null, handDec = g.decisions.filter((d) => d.hand === t.handNo);
    const nextPay = st.left > MT.PAYOUTS.length ? `bulle à ${MT.PAYOUTS.length + 1} joueurs` : st.left > 1 ? `prochain palier : ${fr(MT.prizeOf(G.F, st.left - 1) , 0)} € à la ${st.left - 1}e place` : '';
    let out = `<div class="stats"><div class="stat hero"><span>Joueurs restants</span><b>${st.left}/100</b><span>${nextPay}</span></div>
      <div class="stat"><span>Ton tapis</span><b>${Math.round(st.heroS).toLocaleString('fr-FR')}</b><span>${fr(st.heroS / t.bb, 1)} bb · rang ${st.rank}/${st.left}</span></div>
      <div class="stat"><span>Niveau ${st.level}</span><b>${t.sb.toLocaleString('fr-FR')}/${t.bb.toLocaleString('fr-FR')}</b><span>tapis moyen ${fr(st.avg / t.bb, 1)} bb</span></div></div>
      ${st.bubble ? `<div class="warnbox"><strong>Bulle :</strong> ${st.left - MT.PAYOUTS.length} joueur${st.left - MT.PAYOUTS.length > 1 ? 's' : ''} avant l'argent. Les tapis moyens appuient sur les petits ; le gros tapis vole ; les petits tapis survivent si possible (ICM).</div>` : ''}
      ${st.finalTable ? '<div class="warnbox"><strong>Table finale.</strong> Les écarts de gains sont maximaux : relis tes ranges de tapis ou couché et pense ICM.</div>' : ''}
      <div class="row"><span class="pill acc">Main ${G.hands + (t.done ? 0 : 1)}</span><span class="pill">${{ live: 'Coach en direct', exam: 'Mode examen', free: 'Sans aide' }[g.mode]}</span><button class="btn small" data-act="mtauto" ${G.over ? 'disabled' : ''}>10 mains en automatique (coach)</button><button class="btn small" data-act="mtquit" style="margin-left:auto">Abandonner</button></div>
      ${tableHTML(t, { chips: true, showProfiles: true })}`;
    if (L) out += `<section class="panel"><span class="eyebrow">À toi · ${TS.posName(t, 0)} · ${E.abstractOf(t.players[0].cards[0], t.players[0].cards[1])} · ${fr(t.effStack(0) / t.bb, 1)} bb effectifs</span>${actionsHTML(t)}</section>` + (g.mode === 'live' ? coachHTML(adviceFor(g), t) : '');
    if (t.done) {
      out += `<section class="panel"><div class="row" style="justify-content:space-between"><h2>${G.over ? (G.place === 1 ? 'Victoire : tu remportes le tournoi' : `Éliminé à la ${G.place}e place`) + (G.prize ? ` · ${fr(G.prize, 0)} €` : ' · hors de l\'argent') : 'Fin de la main'}</h2><div class="row"><button class="btn small" data-act="libtable">Sauvegarder la main</button>${G.over ? '<button class="btn primary" data-act="mtnew">Nouveau tournoi</button>' : '<button class="btn primary" data-act="mtnext">Main suivante <span style="opacity:.7">Entrée</span></button>'}</div></div>${decisionsHTML(handDec, g.mode)}${G.over ? `<h3>Ton tournoi</h3>${catTable(g.decisions)}<p class="note">${G.hands} mains jouées à ta table. Buy-in 10 € : ${G.prize ? 'résultat net ' + (G.prize >= 10 ? '+' : '−') + fr(Math.abs(G.prize - 10), 0) + ' €' : 'perte de 10 €'}. Un tournoi isolé est surtout de la variance : regarde le taux de décisions justes.</p>` : ''}</section>`;
    }
    return out + rec;
  };
  ACT.mtmix = (t) => { mprep.mix = t.dataset.v; render(); };
  ACT.mtmode = (t) => { mprep.mode = t.dataset.v; render(); };
  ACT.mtstart = () => { const game = window.MTT.createGame(TS, { mix: mprep.mix }); mt = { kind: 'mtt', tb: game.tb, game, mode: mprep.mode, decisions: [], adv: null, objectives: new Set() }; nextHand(mt); };
  ACT.mtnext = () => { if (mt && !mt.game.over) nextHand(mt); };
  ACT.mtnew = () => { mt = null; render(); };
  ACT.mtquit = () => { mt = null; render(); };
  ACT.mtauto = () => {
    if (!mt) return; const g = mt, t = g.tb; let n = 0, guard = 0;
    while (n < 10 && !g.game.over && guard++ < 4000) {
      if (t.done) { nextHand(g); n++; continue; }
      if (t.toAct === 0 && !t.players[0].out) { const a = adviceFor(g); const L = t.legal(); const type = a.rec === 'fold' && L.canCheck ? 'check' : a.rec === 'check' && !L.canCheck ? 'fold' : a.rec; t.act(type, type === 'raise' ? Math.max(L.minTo, Math.min(L.maxTo, a.to || L.minTo)) : undefined); g.adv = null; t.runBots(); if (t.done) afterHand(g); }
      else { t.runBots(); if (t.done) afterHand(g); }
    }
    render();
  };
  X.getSimSub = () => sub; X.setSimSub = (v) => { sub = v; };

  // ---- Rendu commun d'une table (cash 6 joueurs ou Expresso 3 joueurs) ----
  function tableHTML(t, o = {}) {
    const n = t.n, fmt = o.chips ? (x) => `${fr(x, 0)} <span class="note" style="color:inherit;opacity:.75">(${fbb(x, t)} bb)</span>` : (x) => fbb(x, t) + ' bb';
    const seat = (i) => {
      const p = t.players[i], showCards = i === 0 || (t.done && p.inHand && t.alive().length > 1);
      if (p.out) return `<div class="seat out" style="grid-area:s${i}"><span class="nm">${esc(p.name)}</span><span class="pf">Éliminé</span></div>`;
      const last = p.acts.length ? p.acts[p.acts.length - 1] : null, lastTxt = last ? { fold: 'Couché', check: 'Parole', call: 'Suit', raise: 'Mise / relance' }[last.final] : '';
      return `<div class="seat${t.toAct === i && !t.done ? ' turn' : ''}${p.inHand ? '' : ' out'}" style="grid-area:s${i}">${t.button === i ? '<span class="dealer">D</span>' : ''}
        <span class="nm">${esc(p.name)}</span><span class="pf">${p.profile && o.showProfiles ? TS.PROFILES[p.profile].label : TS.posName(t, i)}</span>
        <div class="cards">${p.inHand || showCards ? (showCards ? p.cards.map((c) => cardHTML(c, true)).join('') : backHTML(true) + backHTML(true)) : ''}</div>
        <span class="stk">${fmt(p.stack)}${p.allin ? ' · tapis' : ''}</span>${p.put > 0 && !t.done ? `<span class="bet">${o.chips ? fr(p.put, 0) : fbb(p.put, t)}</span>` : ''}<span class="last">${lastTxt}</span></div>`;
    };
    return `<div class="pokertable${n === 3 ? ' pt3' : ''}">${t.players.map((_, i) => seat(i)).join('')}
      <div class="mid">${t.board.length ? cardsHTML(t.board) : '<span style="opacity:.7">Préflop</span>'}<span class="pot">Pot ${o.chips ? fr(t.pot, 0) + ' · ' : ''}${fbb(t.pot, t)} bb</span></div></div>`;
  }
  let raiseTo = null;
  function actionsHTML(t) {
    const L = t.legal(), pot = L.pot;
    const sizes = t.street === 'pre'
      ? [['2,5 bb', t.bb * 2.5], ['3 bb', t.bb * 3], ['Isoler', t.bb * (3.5 + t.limpers())], ['3 × la relance', t.cur * 3]].filter(([, v]) => v > t.cur + 1e-9)
      : [['⅓ pot', pot / 3], ['½ pot', pot / 2], ['¾ pot', pot * 0.75], ['Pot', pot]].map(([l, v]) => [l, t.cur + Math.max(v, t.minRaise)]);
    const valid = sizes.filter(([, v]) => v >= L.minTo - 1e-9 && v < L.maxTo).slice(0, 4), canRaise = L.maxTo > t.cur + 1e-9;
    return `<div class="actions">${L.canCheck ? '' : '<button class="btn" data-act="hfold">Se coucher <span class="note">F</span></button>'}
      <button class="btn primary" data-act="hcall">${L.canCheck ? 'Parole' : 'Suivre ' + fbb(L.toCall, t) + ' bb'} <span style="opacity:.7">C</span></button>
      ${canRaise ? valid.map(([l, v]) => `<button class="btn" data-act="hraise" data-to="${v}">${l} · ${fbb(v, t)}</button>`).join('') + `<button class="btn" data-act="hraise" data-to="${L.maxTo}">Tapis ${fbb(L.maxTo, t)}</button>` : ''}</div>
      ${canRaise ? `<div class="row"><label class="f" style="flex:1;min-width:200px">Montant libre : <span class="mono" id="rtv">${fbb(raiseTo || L.minTo, t)} bb</span><input type="range" id="rto" min="${L.minTo}" max="${L.maxTo}" step="${t.bb / 2}" value="${raiseTo || L.minTo}"></label><button class="btn" data-act="hraisefree">Miser ce montant</button></div>` : ''}`;
  }
  const REC_FR = (a, t) => a.rec === 'raise' ? (t.street === 'pre' && a.to >= t.legal().maxTo - 1e-9 ? 'Tapis' : (t.cur > 0 ? 'Relancer' : 'Miser') + (a.to ? ` à ${fbb(a.to, t)} bb` : '')) : a.rec === 'call' ? 'Suivre' : a.rec === 'check' ? 'Parole' : 'Se coucher';
  function coachHTML(a, t) {
    return `<section class="panel coach"><div class="row" style="justify-content:space-between"><span class="eyebrow">Coach</span>${a.eq !== null && a.eq !== undefined ? `<span class="note mono">Équité ${pct(a.eq, 1)}${a.need ? ` · requise ${pct(a.need, 1)}` : ''}</span>` : ''}</div>
      <h2>Conseil : ${REC_FR(a, t)}</h2><div class="advice">${a.why.map((w) => `<div>${esc(w)}</div>`).join('')}</div>
      ${a.ranges.length ? `<details><summary class="note">Ranges estimées des adversaires</summary><div class="tw"><table class="t"><thead><tr><th>Joueur</th><th>Profil</th><th class="n">Combos</th><th>Mains typiques</th></tr></thead><tbody>${a.ranges.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.label}</td><td class="n">${r.n}</td><td class="mono note">${esc(r.desc)}</td></tr>`).join('')}</tbody></table></div>
        <p class="note">Estimation à partir du profil et des actions de la main. Contre de vrais joueurs, les profils restent des approximations.</p></details>` : ''}</section>`;
  }
  // Conseiller par main : sur demande, l'action recommandée pour chacune des 169 mains au même moment de la main.
  let ra = null;
  const RA_COL = { raise: '--act-b2', call: '--act-x', check: '--act-x', fold: '--act-f' };
  const raKey = (t) => t.handNo + ':' + t.seq.length + ':' + t.street;
  function rangeAdvHTML(g) {
    const t = g.tb;
    if (!ra || ra.key !== raKey(t)) return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Conseiller par main</span><p class="note" style="margin:4px 0 0">Ce que le coach ferait ici avec chaque main de ta range, contre les mêmes adversaires.</p></div><button class="btn" data-act="rangeadv">Voir toute ma range</button></div></section>`;
    const r = ra.res, name = { raise: t.cur > 0 ? 'Relancer' : 'Miser', call: 'Suivre', check: 'Parole', fold: 'Se coucher' };
    const acts = ['raise', r.canCheck ? 'check' : 'call', ...(r.canCheck ? [] : ['fold'])];
    const grid = X.grid169((h) => {
      const c = r.cells[h];
      if (!c) return `<span class="rc sv off" aria-label="${h} impossible">${h}</span>`;
      const tip = `${h} : ${name[c.rec]}${c.eq !== null ? ' · équité ' + pct(c.eq, 0) : ''}${c.inR ? '' : ' · hors de ta range'}`;
      return `<span class="rc sv${h === r.mine ? ' sel' : ''}" style="background:var(${RA_COL[c.rec]});${c.inR ? '' : 'opacity:.3;'}" title="${tip}" aria-label="${tip}">${h}</span>`;
    });
    const bars = acts.map((a) => { const f = r.nIn ? r.tot[a] / r.nIn : 0; return `<div class="typerow"><span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(${RA_COL[a]});margin-right:6px"></i>${name[a]}</span><div class="meter"><i style="width:${f * 100}%;background:var(${RA_COL[a]})"></i></div><span class="mono">${pct(f)}</span></div>`; }).join('');
    const mineC = r.cells[r.mine];
    return `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Conseiller par main · ${esc(r.label)}</span><button class="btn small" data-act="rangeadvclose">Masquer</button></div>
      <div class="grid2"><div>${grid}</div><div style="display:grid;gap:8px;align-content:start"><p>Ta main <strong class="mono">${r.mine}</strong> : <strong>${mineC ? name[mineC.rec] : '—'}</strong>${mineC && !mineC.inR ? ' (elle n\'est pas dans ta range estimée)' : ''}.</p>${bars}
        <p class="note">Répartition sur les ${r.nIn} combinaisons de ta range estimée (${esc(r.label)}). Les mains hors de cette range sont pâles. Survole une case pour l'équité.</p>
        <p class="note">Le coach donne une seule action par main (pas de fréquences mixtes comme un solveur) : c'est un repère d'exploitation contre ces profils, pas un équilibre.</p></div></div></section>`;
  }
  ACT.rangeadv = () => { const g = cur(); if (!g?.tb) return; ra = { key: raKey(g.tb), res: Co.rangeAdvice(g.tb) }; render(); };
  ACT.rangeadvclose = () => { ra = null; render(); };

  // Décision du héros : conseil calculé avant, puis noté.
  function decide(g, type, to) {
    const t = g.tb; if (!t || t.done || t.toAct !== 0) return;
    if (g.mode !== 'free') {
      const a = adviceFor(g);
      if (a) {
        const gr = Co.grade(a, type, to, t), hero = t.players[0];
        const sev = Co.severity ? Co.severity(a, type, gr) : (gr.ok ? null : 'petite');
        g.decisions.push({ hand: t.handNo, street: t.street, pos: a.pos, cards: hero.cards.slice(), board: t.board.slice(), act: type, rec: a.rec, recTxt: REC_FR(a, t), ok: gr.ok, note: gr.note, cats: a.cats, why: a.why, eq: a.eq, need: a.need, sev });
        if (g.mode === 'errors' && sev === 'grave') g.stopErr = g.decisions[g.decisions.length - 1];
        X.logDay?.('dec', { ok: gr.ok, sev });
        const cs = state.progress.coach;
        a.cats.forEach((c) => { const x = cs[c] || (cs[c] = { ok: 0, n: 0 }); x.n++; if (gr.ok) x.ok++; });
        X.award?.('decision', { cats: a.cats, ok: gr.ok, champ: g.champ });
      }
    }
    t.act(type, to); t.runBots(); raiseTo = null; g.adv = null;
    if (t.done) afterHand(g);
    render();
  }
  function adviceFor(g) {
    const t = g.tb, key = t.handNo + ':' + t.seq.length + ':' + t.street;
    if (g.adv && g.adv.key === key) return g.adv.a;
    const a = (g.kind === 'xp' || g.kind === 'mtt' ? Co.pushFoldAdvice(t) : null) || Co.advise(t);
    g.adv = { key, a }; return a;
  }
  function afterHand(g) {
    if (g.kind === 'mtt' && !g.counted) { g.game.after(); if (g.game.over) { g.counted = true; const M = state.progress.mtt || (state.progress.mtt = { games: 0, itm: 0, wins: 0, prizes: 0, best: null }); M.games++; if (g.game.prize > 0) M.itm++; if (g.game.place === 1) M.wins++; M.prizes += g.game.prize; M.best = M.best ? Math.min(M.best, g.game.place) : g.game.place; X.award?.('champ', null, true); } }
    if (g.kind === 'cash') { state.progress.tableHands = (state.progress.tableHands || 0) + 1; X.award?.('hand', null, true); }
    if (g.kind === 'xp' && g.tb.over && !g.counted && g.fmt && g.fmt !== 'expresso') {
      g.counted = true; const F = state.progress.formats || (state.progress.formats = {}), e = F[g.fmt] || (F[g.fmt] = { games: 0, places: [] });
      e.games++; e.places[g.tb.place] = (e.places[g.tb.place] || 0) + 1;
    }
    if (g.kind === 'xp' && g.tb.over && !g.counted) {
      g.counted = true; const e = state.progress.expresso; e.games = (e.games || 0) + 1; e.places = e.places || [0, 0, 0, 0]; e.places[g.tb.place] = (e.places[g.tb.place] || 0) + 1;
      if (g.spin && PR) { const S = spinStats(), won = PR.spinPrize(g.spin.mult, g.tb.place); S.games++; S.spent += 5; S.won += won; S.mults[g.spin.mult] = (S.mults[g.spin.mult] || 0) + 1; g.spin.won = won; }
    }
    save('progress');
  }
  const cur = () => (sub === 'expresso' ? xp : sub === 'mtt' ? mt : cash);
  ACT.hfold = () => decide(cur(), 'fold');
  ACT.hcall = () => { const t = cur().tb, L = t.legal(); decide(cur(), L.canCheck ? 'check' : 'call'); };
  ACT.hraise = (el) => decide(cur(), 'raise', +el.dataset.to);
  ACT.hraisefree = () => decide(cur(), 'raise', +($('#rto')?.value || 0));
  ONINPUT.push((t) => { if (t.id === 'rto') { raiseTo = +t.value; const g = cur(); $('#rtv').textContent = fbb(raiseTo, g.tb) + ' bb'; return true; } });
  ONKEY.push((e, tab) => {
    if (tab !== 'sim' || !['table', 'expresso', 'mtt'].includes(sub)) return;
    const g = cur(); if (!g || !g.tb) return;
    const t = g.tb;
    if (!t.done && t.toAct === 0) { const L = t.legal(); if (e.key === 'f' && !L.canCheck) { decide(g, 'fold'); return true; } if (e.key === 'c') { decide(g, L.canCheck ? 'check' : 'call'); return true; } }
    else if (t.done && e.key === 'Enter' && !(g.kind === 'xp' && t.over) && !(g.kind === 'mtt' && g.game.over) && !sessionDone()) { nextHand(g); return true; }
  });
  function nextHand(g) { if (g.kind === 'mtt') { if (g.game.over) return render(); g.game.prepare(); } g.tb.newHand(); g.tb.runBots(); g.adv = null; if (g.tb.done) afterHand(g); render(); }

  function decisionsHTML(list, mode) {
    if (!list.length) return '';
    return `<div class="tw"><table class="t"><thead><tr><th>Rue</th><th>Ta décision</th><th>Conseil</th><th></th></tr></thead><tbody>${list.map((d) => `<tr><td>${{ pre: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River' }[d.street]}${d.board.length ? ' ' + d.board.map(E.cardStr).join(' ') : ''}</td><td>${Co.ACT_FR[d.act]}</td><td>${esc(d.recTxt)}</td><td><span class="pill ${d.ok ? 'good' : 'bad'}">${d.ok ? 'Juste' : 'À revoir'}</span></td></tr>
      ${!d.ok || mode === 'exam' ? `<tr><td colspan="4" class="note">${esc([d.note, ...d.why].filter(Boolean).join(' '))}</td></tr>` : ''}`).join('')}</tbody></table></div>`;
  }

  // ---- Table cash : préparation, jeu avec coach, bilan ----
  const OBJ_MOD = { rfi: 'preflop', iso: 'fish', pfdef: 'preflop2', odds: 'maths', value: 'fish', nobluff: 'fish', bluff: 'postflop' };
  const prep = { lineup: 'fish', target: 50, mode: 'live', objectives: new Set(['rfi', 'odds', 'value']), straddle: false, ante: 0, bomb: 0, clock: 0 };
  let cash = null, showProfiles = false;
  const sessionDone = () => sub === 'table' && cash && cash.target && cash.tb.done && cash.tb.session.hands >= cash.target;
  SIMVIEWS.table = () => {
    if (!cash) {
      return `<section class="panel"><span class="eyebrow">Préparer la session</span><h2>Choisis ta table, tes objectifs et le niveau d'aide</h2>
        <div class="row"><span class="note">Table :</span>${Object.entries({ fish: 'Riche en fish', equilibree: 'Équilibrée', regs: 'Réguliers' }).map(([k, l]) => `<button class="chip" aria-pressed="${prep.lineup === k}" data-act="prepl" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Durée :</span>${[[25, '25 mains'], [50, '50 mains'], [100, '100 mains'], [0, 'Illimitée']].map(([k, l]) => `<button class="chip" aria-pressed="${prep.target === k}" data-act="prept" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Coach :</span>${[['live', 'En direct (conseil avant chaque décision)'], ['errors', 'Seulement en cas d\'erreur (une erreur grave arrête la main)'], ['exam', 'Examen (correction après la main)'], ['free', 'Sans aide']].map(([k, l]) => `<button class="chip" aria-pressed="${prep.mode === k}" data-act="prepm" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Règles live :</span><button class="chip" aria-pressed="${prep.straddle}" data-act="prepx" data-k="straddle">Straddle (UTG met 2 bb)</button>${[[0, 'Sans ante'], [0.1, 'Ante 0,1 bb'], [0.25, 'Ante 0,25 bb']].map(([v, l]) => `<button class="chip" aria-pressed="${prep.ante === v}" data-act="prepa" data-v="${v}">${l}</button>`).join('')}${[[0, 'Pas de bomb pot'], [5, 'Bomb pot toutes les 5 mains'], [10, 'Toutes les 10']].map(([v, l]) => `<button class="chip" aria-pressed="${prep.bomb === v}" data-act="prepb" data-v="${v}">${l}</button>`).join('')}</div>
        ${prep.straddle || prep.ante || prep.bomb ? '<p class="note">Bomb pot : chacun met 2 bb, pas de tour préflop, le flop arrive tout de suite (pot multiway gonflé : joue plus serré sans les tirages faibles). Straddle : le préflop se joue à 2 bb, les ranges d\'ouverture se resserrent. Ante : plus d\'argent mort, les vols deviennent rentables plus large.</p>' : ''}
        <div class="row"><span class="note">Chrono par décision :</span>${[[0, 'Sans'], [20, '20 s'], [10, '10 s']].map(([v, l]) => `<button class="chip" aria-pressed="${prep.clock === v}" data-act="prepc" data-v="${v}">${l}</button>`).join('')}<span class="note">Temps écoulé : check si possible, sinon couché (comme en ligne).</span></div>
        <div><span class="note">Objectifs suivis :</span><div class="row" style="margin-top:6px">${Object.entries(Co.CATS).filter(([k]) => k !== 'pushfold').map(([k, l]) => `<button class="chip" aria-pressed="${prep.objectives.has(k)}" data-act="prepo" data-v="${k}">${l}</button>`).join('')}</div></div>
        <div class="warnbox"><strong>Avant de jouer, relis :</strong> ${[...new Set([...prep.objectives].map((o) => OBJ_MOD[o]).filter(Boolean))].map((id) => { const m = K.MODULES.find((x) => x.id === id); return m ? `<button class="btn small" data-act="openmod" data-id="${id}">${esc(m.title)}</button>` : ''; }).join(' ') || '—'}</div>
        <div class="row"><button class="btn primary" data-act="cashstart">Lancer la session</button></div></section>
        ${coachStatsHTML()}`;
    }
    const t = cash.tb, L = !t.done && t.toAct === 0 ? t.legal() : null;
    const handDec = cash.decisions.filter((d) => d.hand === t.handNo);
    let out = `<div class="row"><span class="pill acc">${cash.target ? `Main ${Math.min(t.session.hands + (t.done ? 0 : 1), cash.target)}/${cash.target}` : `Main ${t.session.hands + (t.done ? 0 : 1)}`}</span>${t.bomb ? '<span class="pill bad">Bomb pot</span>' : t.straddled >= 0 ? '<span class="pill">Straddle</span>' : ''}<span class="pill">${{ live: 'Coach en direct', errors: 'Coach sur erreur', exam: 'Mode examen', free: 'Sans aide' }[cash.mode]}</span>
      <label class="check"><input type="checkbox" id="showprof" data-act="showprof" ${showProfiles ? 'checked' : ''}><span class="note">Profils visibles</span></label><button class="btn small" data-act="cashstop" style="margin-left:auto">Terminer la session</button></div>
      ${cash.champ && X.champBanner ? X.champBanner(cash) : ''}${cash.stopErr ? stopErrHTML(cash.stopErr) : ''}${tableHTML(t, { showProfiles: showProfiles && !cash.champ?.hidden })}`;
    if (L) { armClock(cash); out += `<section class="panel"><span class="eyebrow">À toi · ${TS.posName(t, 0)} · ${E.abstractOf(t.players[0].cards[0], t.players[0].cards[1])}</span>${cash.clock ? ` <span class="pill bad mono" id="simclock">${Math.max(0, Math.ceil((cash.clockEnd - Date.now()) / 1000))} s</span>` : ''}${actionsHTML(t)}</section>`; }
    if (L) out += '' + (cash.mode === 'live' ? coachHTML(adviceFor(cash), t) + rangeAdvHTML(cash) : '');
    if (t.done && t.notes) {
      const n = t.notes, finished = sessionDone();
      out += `<section class="panel"><div class="row" style="justify-content:space-between"><h2>Débrief : ${n.net >= 0 ? '+' : '−'}${fr(Math.abs(n.net), 1)} bb</h2><div class="row"><button class="btn small" data-act="libtable">Sauvegarder la main</button><button class="btn small" data-act="rptable">Rejouer</button>${finished ? '' : '<button class="btn primary" data-act="cashnext">Main suivante <span style="opacity:.7">Entrée</span></button>'}</div></div>
        ${decisionsHTML(handDec, cash.mode)}
        <div class="advice">${n.advice.map((a) => `<div class="${a.k}">${esc(a.t)}</div>`).join('')}</div>
        ${n.reveal.length ? `<div class="tw"><table class="t"><thead><tr><th>Joueur</th><th>Profil</th><th>Cartes</th><th class="n">Résultat</th></tr></thead><tbody>${n.reveal.map((r) => `<tr><td>${esc(r.name)}</td><td>${cash && cash.champ?.hidden && r.profile === cash.champ.profile ? '?' : TS.PROFILES[r.profile].label}</td><td>${cardsHTML(r.cards, true)}</td><td class="n">${sgn(r.net / t.bb)} bb</td></tr>`).join('')}</tbody></table></div>` : ''}</section>`;
      if (finished) out += (cash.champ && X.champReport ? X.champReport(cash) : '') + bilanHTML(cash);
    }
    out += `<div class="stats"><div class="stat hero"><span>Session</span><b>${sgn(t.session.net, 1)} bb</b><span>${t.session.hands} mains</span></div>
      <div class="stat"><span>Décisions justes</span><b>${cash.decisions.length ? pct(cash.decisions.filter((d) => d.ok).length / cash.decisions.length) : '—'}</b><span>${cash.decisions.length} décisions notées</span></div>
      <div class="stat"><span>Historique</span><b>${t.history.length}</b><span>mains exportables vers Analyse</span></div></div>
      <div class="row"><button class="btn" data-act="tb2an" ${t.history.length ? '' : 'disabled'}>Analyser ces mains</button></div>`;
    return out;
  };
  // Mode « n'interromps qu'en cas d'erreur » : arrêt sur une erreur grave, avec la correction ; les petites attendent le bilan.
  function stopErrHTML(d) {
    return `<section class="panel" style="border-color:var(--bad)"><span class="eyebrow" style="color:var(--bad)">Erreur grave · ${{ pre: 'préflop', flop: 'flop', turn: 'turn', river: 'river' }[d.street]}</span>
      <h2>Tu as choisi « ${Co.ACT_FR[d.act]} », le coach : ${esc(d.recTxt)}</h2>${d.eq !== null && d.eq !== undefined ? `<p class="note mono">Équité ${pct(d.eq, 1)}${d.need ? ` · cote requise ${pct(d.need, 1)}` : ''}</p>` : ''}
      <div class="advice">${[d.note, ...d.why].filter(Boolean).map((w) => `<div>${esc(w)}</div>`).join('')}</div><div class="row"><button class="btn primary" data-act="stoperrok">Compris, continuer</button></div></section>`;
  }
  ACT.stoperrok = () => { if (cash) cash.stopErr = null; render(); };
  // Chrono de décision au simulateur : la même pression qu'en ligne.
  let clockInt = null;
  function armClock(g) {
    if (!g.clock) return; const key = g.tb.handNo + ':' + g.tb.seq.length;
    if (g.clockKey === key) return; g.clockKey = key; g.clockEnd = Date.now() + g.clock * 1000;
    if (clockInt) clearInterval(clockInt);
    clockInt = setInterval(() => {
      const el = $('#simclock'), t = g.tb;
      if (X.getTab() !== 'sim' || sub !== 'table' || t.done || t.toAct !== 0 || g.clockKey !== t.handNo + ':' + t.seq.length) { clearInterval(clockInt); clockInt = null; return; }
      const left = Math.max(0, Math.ceil((g.clockEnd - Date.now()) / 1000)); if (el) el.textContent = left + ' s';
      if (left <= 0) { clearInterval(clockInt); clockInt = null; g.timeouts = (g.timeouts || 0) + 1; decide(g, t.legal().canCheck ? 'check' : 'fold'); }
    }, 250);
  }
  function catTable(decisions, highlight) {
    const by = {}; decisions.forEach((d) => d.cats.forEach((c) => { const x = by[c] || (by[c] = { ok: 0, n: 0 }); x.n++; if (d.ok) x.ok++; }));
    const rows = Object.entries(Co.CATS).filter(([k]) => by[k]);
    return rows.length ? `<div class="tw"><table class="t"><thead><tr><th>Objectif</th><th class="n">Décisions</th><th class="n">Justes</th></tr></thead><tbody>${rows.map(([k, l]) => `<tr${highlight && highlight.has(k) ? ' style="font-weight:600"' : ''}><td>${l}${highlight && highlight.has(k) ? ' ★' : ''}</td><td class="n">${by[k].n}</td><td class="n" style="color:var(${by[k].ok / by[k].n >= 0.8 ? '--good' : '--bad'})">${pct(by[k].ok / by[k].n)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Aucune décision notée.</p>';
  }
  function bilanHTML(g) {
    const d = g.decisions, ok = d.filter((x) => x.ok).length, miss = d.filter((x) => !x.ok).sort((a, b) => (a.sev === 'grave' ? 0 : 1) - (b.sev === 'grave' ? 0 : 1)).slice(0, 14);
    const nG = d.filter((x) => x.sev === 'grave').length, nP = d.filter((x) => x.sev === 'petite').length;
    return `<section class="panel" style="border-color:var(--accent)"><span class="eyebrow">Bilan de session</span><h2>${g.tb.session.hands} mains · ${sgn(g.tb.session.net, 1)} bb · ${d.length ? pct(ok / d.length) : '—'} de décisions justes</h2>
      ${catTable(d, g.objectives)}${nG + nP ? `<p><strong style="color:var(--bad)">${nG} erreur${nG > 1 ? 's' : ''} grave${nG > 1 ? 's' : ''}</strong> (écart net d'équité, bluff contre un joueur qui paie, valeur manquée) · <strong>${nP} petite${nP > 1 ? 's' : ''}</strong> (limp, taille, décision serrée). Les graves d'abord.</p>` : ''}
      ${miss.length ? `<h3>Décisions à revoir</h3><div class="tw"><table class="t"><tbody>${miss.map((m) => `<tr><td class="mono">${m.sev === 'grave' ? '<span class="pill bad">grave</span> ' : m.sev === 'petite' ? '<span class="pill">petite</span> ' : ''}Main ${m.hand}</td><td>${m.pos} · ${m.cards.map(E.cardStr).join(' ')}${m.board.length ? ' · ' + m.board.map(E.cardStr).join(' ') : ''}</td><td>Tu as choisi « ${Co.ACT_FR[m.act]} », conseil « ${esc(m.recTxt)} »</td></tr><tr><td colspan="3" class="note">${esc([m.note, ...m.why].filter(Boolean).join(' '))}</td></tr>`).join('')}</tbody></table></div>` : '<p>Aucune erreur sur cette session.</p>'}
      <p class="note">Le résultat en bb sur ${g.tb.session.hands} mains est surtout de la variance. Juge la session sur le taux de décisions justes.</p>
      <div class="row"><button class="btn primary" data-act="cashnew">Nouvelle session</button><button class="btn" data-act="tb2an">Analyser ces mains</button></div></section>`;
  }
  function coachStatsHTML() {
    const cs = state.progress.coach || {}, rows = Object.entries(Co.CATS).filter(([k]) => cs[k]);
    return `<section class="panel"><span class="eyebrow">Historique du coach</span><h2>${state.progress.tableHands || 0} mains jouées au simulateur</h2>
      ${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>Objectif</th><th class="n">Décisions</th><th class="n">Justes</th></tr></thead><tbody>${rows.map(([k, l]) => `<tr><td>${l}</td><td class="n">${cs[k].n}</td><td class="n">${pct(cs[k].ok / cs[k].n)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Lance une session avec le coach : tes décisions seront notées par objectif.</p>'}</section>`;
  }
  ACT.prepl = (t) => { prep.lineup = t.dataset.v; render(); };
  ACT.prepx = () => { prep.straddle = !prep.straddle; render(); };
  ACT.prepc = (t) => { prep.clock = +t.dataset.v; render(); };
  ACT.prepa = (t) => { prep.ante = +t.dataset.v; render(); };
  ACT.prepb = (t) => { prep.bomb = +t.dataset.v; render(); };
  ACT.prept = (t) => { prep.target = +t.dataset.v; render(); };
  ACT.prepm = (t) => { prep.mode = t.dataset.v; render(); };
  ACT.prepo = (t) => { const v = t.dataset.v; prep.objectives.has(v) ? prep.objectives.delete(v) : prep.objectives.add(v); render(); };
  ACT.cashstart = () => {
    cash = { clock: prep.clock, kind: 'cash', tb: new TS.Table({ lineup: LINEUPS[prep.lineup], straddle: prep.straddle, anteBB: prep.ante, bombEvery: prep.bomb }), mode: prep.mode, target: prep.target, objectives: new Set(prep.objectives), decisions: [], adv: null };
    nextHand(cash);
  };
  ACT.cashnext = () => { if (!sessionDone()) nextHand(cash); };
  // Session lancée depuis l'onglet Champions : adversaires, profondeur et mode imposés.
  X.startCash = (o) => {
    const tb = new TS.Table({ lineup: o.lineup, stack: o.stackBB ? o.stackBB * 0.1 : undefined });
    if (o.champ?.hidden) tb.players.forEach((p, i) => { if (i > 0 && p.profile === o.champ.profile) p.name = 'Mystère'; });
    cash = { kind: 'cash', tb, mode: o.mode || 'exam', target: o.target ?? 50, objectives: new Set(o.objectives || []), decisions: [], adv: null, champ: o.champ || null };
    sub = 'table'; tb.newHand(); tb.runBots(); if (tb.done) afterHand(cash); X.go('sim');
  };
  X.getCash = () => cash;
  ACT.cashstop = () => { if (cash) cash.target = cash.tb.done ? cash.tb.session.hands : Math.max(1, cash.tb.session.hands); if (cash && !cash.tb.done) { cash = null; } render(); };
  ACT.cashnew = () => { cash = null; render(); };
  ACT.showprof = (t) => { showProfiles = t.checked; render(); };
  ACT.tb2an = () => { const g = sub === 'expresso' ? xp : cash; if (!g) return; X.runAnalysis(g.tb.exportHH(), 'table'); anSub = 'import'; go('analyse'); };
  ACT.libtable = () => { const g = cur(); addToLibrary(g.tb.history[g.tb.history.length - 1], g.kind === 'xp' ? 'Expresso simulé' : 'Simulateur', g.decisions.some((d) => d.hand === g.tb.handNo && !d.ok) ? ['erreur'] : []); render(); };
  ACT.rptable = () => { const g = cur(); openReplay(g.tb.history[g.tb.history.length - 1]); };

  // ---- Expresso ----
  const XP_LEVELS = [[10, 20], [15, 30], [20, 40], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200], [150, 300], [200, 400]];
  const XP_LINEUPS = { mix: ['reg', 'station'], agressifs: ['maniaque', 'reg'], serres: ['nit', 'reg'] };
  const xprep = { lineup: 'mix', mode: 'live', fmt: 'spin', p1: 40, p2: 30, n: 500 };
  const PR = window.Pro;
  const spinStats = () => state.progress.spin || (state.progress.spin = { games: 0, spent: 0, won: 0, mults: {} });
  let xp = null;
  SIMVIEWS.expresso = () => {
    const e = state.progress.expresso || { games: 0, places: [0, 0, 0, 0] };
    const record = `<div class="stats"><div class="stat hero"><span>Parties simulées</span><b>${e.games || 0}</b><span>1er : ${e.places?.[1] || 0} · 2e : ${e.places?.[2] || 0} · 3e : ${e.places?.[3] || 0}</span></div>
      <div class="stat"><span>Taux de victoire</span><b>${e.games ? pct((e.places?.[1] || 0) / e.games) : '—'}</b><span>33 % = niveau égal à 3 joueurs</span></div></div>`;
    if (!xp) {
      return `<section class="panel"><span class="eyebrow">Expresso simulé</span><h2>3 joueurs, 500 jetons, blindes qui montent toutes les 6 mains</h2>
        <p class="note">Structure hyper-turbo inspirée du format, pas la structure officielle d'une room. Le gagnant prend tout : l'équilibre en jetons s'applique. Sous 15 bb, le coach utilise le solveur de Nash en tête-à-tête et une estimation à 3 joueurs.</p>
        <div class="row"><span class="note">Adversaires :</span>${Object.entries({ mix: 'Régulier + fish', agressifs: 'Maniaque + régulier', serres: 'Nit + régulier' }).map(([k, l]) => `<button class="chip" aria-pressed="${xprep.lineup === k}" data-act="xpl" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Coach :</span>${[['live', 'En direct'], ['exam', 'Examen'], ['free', 'Sans aide']].map(([k, l]) => `<button class="chip" aria-pressed="${xprep.mode === k}" data-act="xpm" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Format :</span>${[['spin', 'Spin & Go (multiplicateur tiré au sort, 5 €)'], ['classic', 'Gagnant prend tout, sans tirage']].map(([k, l]) => `<button class="chip" aria-pressed="${xprep.fmt === k}" data-act="xpfmt" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="warnbox">Avant de jouer : <button class="btn small" data-act="openmod" data-id="expresso">Module Expresso</button> <button class="btn small" data-act="openmod" data-id="icm">Module Tapis courts</button> <button class="btn small" data-act="drill" data-type="pushfold">Spots tapis ou couché</button></div>
        <div class="row"><button class="btn primary" data-act="xpstart">Lancer une partie</button></div></section>${record}${spinHTML()}`;
    }
    const t = xp.tb, L = !t.done && t.toAct === 0 && !t.players[0].out ? t.legal() : null, handDec = xp.decisions.filter((d) => d.hand === t.handNo);
    let out = (xp.spin ? `<div class="warnbox" style="text-align:center"><span class="eyebrow">Multiplicateur tiré</span><div style="font:800 34px var(--f-display);color:var(--accent)">×${xp.spin.mult.toLocaleString('fr-FR')}</div><span class="note">${xp.spin.mult > 20 ? `Prix de ${fr(xp.spin.mult * 5, 0)} € partagé : 80 % au 1er, 12 % au 2e, 8 % au 3e` : `Le vainqueur gagne ${fr(xp.spin.mult * 5, 0)} € (mise 5 €)`}</span></div>` : '') + `<div class="row"><span class="pill acc">Main ${t.handNo} · blindes ${t.sb}/${t.bb}</span><span class="pill">${t.active().length} joueurs</span>${xp.fmt && xp.fmt !== 'expresso' ? `<span class="pill">${esc(xp.name)}</span>` : ''}<button class="btn small" data-act="xpquit" style="margin-left:auto">Abandonner la partie</button></div>${tableHTML(t, { chips: true, showProfiles: true })}`;
    if (L) out += `<section class="panel"><span class="eyebrow">À toi · ${TS.posName(t, 0)} · ${E.abstractOf(t.players[0].cards[0], t.players[0].cards[1])} · ${fr(t.effStack(0) / t.bb, 1)} bb effectifs</span>${actionsHTML(t)}</section>` + (xp.mode === 'live' ? coachHTML(adviceFor(xp), t) : '');
    if (t.done) {
      out += `<section class="panel"><div class="row" style="justify-content:space-between"><h2>${t.over ? (t.place === 1 ? `Victoire : tu remportes ${xp.name || 'l\'Expresso'}` : `Partie terminée : ${t.place}e place`) + (xp.spin && xp.spin.won !== undefined ? ` · ${xp.spin.won > 0 ? '+' + fr(xp.spin.won, 0) + ' €' : '0 €'} (mise 5 €)` : '') : 'Fin de la main'}</h2><div class="row"><button class="btn small" data-act="libtable">Sauvegarder la main</button><button class="btn small" data-act="rptable">Rejouer</button>${t.over ? '<button class="btn primary" data-act="xpnew">Nouvelle partie</button>' : '<button class="btn primary" data-act="xpnext">Main suivante <span style="opacity:.7">Entrée</span></button>'}</div></div>
        ${decisionsHTML(handDec, xp.mode)}${t.over ? `<h3>Ta partie</h3>${catTable(xp.decisions)}` : ''}</section>`;
    }
    return out + (xp.fmt === 'expresso' ? record : '');
  };
  ACT.xpl = (t) => { xprep.lineup = t.dataset.v; render(); };
  ACT.xpm = (t) => { xprep.mode = t.dataset.v; render(); };
  ACT.xpstart = () => {
    xp = { kind: 'xp', fmt: 'expresso', name: 'l\'Expresso', tb: new TS.Table({ lineup: XP_LINEUPS[xprep.lineup], stack: 500, rebuy: false, levels: XP_LEVELS, handsPerLevel: 6 }), mode: xprep.mode, decisions: [], adv: null };
    if (xprep.fmt === 'spin' && PR) xp.spin = { mult: PR.spinDraw() };
    nextHand(xp);
  };
  ACT.xpfmt = (t) => { xprep.fmt = t.dataset.v; render(); };
  ONCHANGE.push((t) => { if (t.dataset.spn) { xprep[t.dataset.spn] = Math.max(0, +String(t.value).replace(',', '.') || 0); render(); return true; } });
  function spinHTML() {
    if (!PR) return '';
    const S = spinStats(), n = Math.min(5000, Math.max(10, Math.round(xprep.n))), p1 = Math.min(1, xprep.p1 / 100), p2 = Math.min(1 - p1, xprep.p2 / 100), sim = PR.spinSim(p1, p2, n, 1500);
    const ev = (() => { let e = 0; for (const [m, f] of PR.SPIN.rows) e += (f / PR.SPIN.total) * (PR.spinPrize(m, 1) * p1 + PR.spinPrize(m, 2) * p2 + PR.spinPrize(m, 3) * (1 - p1 - p2)); return e / 5 - 1; })();
    const be = 1 / (3 * (1 - PR.spinRake()));
    return `<section class="panel"><span class="eyebrow">Spin & Go · tes résultats simulés et la variance réelle du format</span>
      <div class="stats"><div class="stat hero"><span>Spins joués</span><b>${S.games}</b><span>${fr(S.spent, 0)} € misés · ${fr(S.won, 0)} € gagnés</span></div>
        <div class="stat"><span>ROI simulé</span><b>${S.spent ? pct(S.won / S.spent - 1, 1) : '—'}</b><span>sur tes parties de SIGMA 52</span></div>
        <div class="stat"><span>Rake implicite</span><b>${pct(PR.spinRake(), 1)}</b><span>de la table de multiplicateurs</span></div></div>
      <h3>Ce que donnent ${n.toLocaleString('fr-FR')} parties</h3>
      <div class="form"><label class="f">Tu finis 1er (%)<input data-spn="p1" inputmode="decimal" value="${xprep.p1}"></label><label class="f">Tu finis 2e (%)<input data-spn="p2" inputmode="decimal" value="${xprep.p2}"></label><label class="f">Nombre de parties<input data-spn="n" inputmode="numeric" value="${n}"></label></div>
      <div class="stats"><div class="stat"><span>ROI attendu</span><b style="color:var(${ev >= 0 ? '--good' : '--bad'})">${pct(ev, 1)}</b><span>en moyenne, jackpots compris</span></div>
        <div class="stat"><span>ROI médian sur ${n.toLocaleString('fr-FR')} parties</span><b>${pct(sim.p50, 1)}</b><span>10 % des cas sous ${pct(sim.p10, 0)}, 10 % au-dessus de ${pct(sim.p90, 0)}</span></div>
        <div class="stat"><span>Sessions gagnantes</span><b>${pct(sim.pWin, 0)}</b><span>part des séries de ${n.toLocaleString('fr-FR')} parties qui finissent en positif</span></div></div>
      <p class="note">Seuil de rentabilité : environ ${pct(be, 1)} de victoires (hors 2e place, qui ne paie qu'aux gros multiplicateurs). Le ROI moyen inclut des jackpots très rares : le ROI médian est ce que vit la plupart des joueurs. Table de l'Expresso à 5 € publiée par CardPlayer France (×2 dans 59 % des parties, ×200 000 deux fois sur dix millions).</p>
      ${Object.keys(S.mults).length ? `<p class="note">Tes tirages : ${Object.entries(S.mults).sort((a, b) => +a[0] - +b[0]).map(([m, c]) => `×${(+m).toLocaleString('fr-FR')} : ${c}`).join(' · ')}</p>` : ''}</section>`;
  }
  // Tournoi lancé depuis Champions › Types de partie : Sit & Go, table finale, Expresso, avec la table choisie.
  X.startTourney = (o) => {
    xp = { kind: 'xp', fmt: o.id, name: o.title || 'le tournoi', tb: new TS.Table({ lineup: o.lineup, stack: o.stack, rebuy: false, levels: o.levels, handsPerLevel: o.hpl || 6 }), mode: o.mode || 'live', decisions: [], adv: null };
    sub = 'expresso'; xp.tb.newHand(); xp.tb.runBots(); if (xp.tb.done) afterHand(xp); X.go('sim');
  };
  ACT.xpnext = () => { if (xp && !xp.tb.over) { nextHand(xp); while (xp.tb.done && xp.tb.players[0].out === true && !xp.tb.over) nextHand(xp); } };
  ACT.xpnew = () => { const f = xp?.fmt; xp = null; if (f && f !== 'expresso') X.go('champions'); else render(); };
  ACT.xpquit = () => { xp = null; render(); };

  // ---- Mains guidées ----
  let gd = null; // { id, k, ans: {}, info: {} }
  SIMVIEWS.guided = () => {
    if (!gd) {
      return `<p class="lead">Des mains réelles de micro-limites, rejouées décision par décision. À chaque étape : choisis, puis lis l'explication de chaque option, avec ton équité réelle contre la range adverse.</p>` +
        K.LEVELS.filter((L) => G.SCENARIOS.some((s) => s.level === L.n)).map((L) => `<section style="display:grid;gap:8px"><div><span class="eyebrow">Niveau ${L.n}</span><h2>${L.title}</h2></div><div class="modlist">${G.SCENARIOS.filter((s) => s.level === L.n).map((s) => { const sc = state.progress.guided?.[s.id]; return `<button class="mod${sc >= 0.75 ? ' done' : ''}" data-act="gdopen" data-id="${s.id}"><span class="n">${sc >= 0.75 ? '✓' : s.steps.length}</span><span><h3>${esc(s.title)}</h3><span class="note">${esc(s.intro)}</span></span><span class="note mono" style="text-align:right">${s.steps.length} décision${s.steps.length > 1 ? 's' : ''}${sc !== undefined ? '<br>' + pct(sc) : ''}</span></button>`; }).join('')}</div></section>`).join('');
    }
    const sc = G.SCENARIOS.find((s) => s.id === gd.id), k = gd.k, st = sc.steps[k];
    if (k >= sc.steps.length) {
      const pts = sc.steps.reduce((a, _, i) => a + G.optionGrade(sc, i, gd.ans[i], gd.info[i]), 0), score = pts / (2 * sc.steps.length);
      return `<div class="row"><button class="btn small" data-act="gdclose">← Toutes les mains guidées</button></div>
        <section class="panel"><span class="eyebrow">Fin de la main</span><h2>${esc(sc.title)} : ${pct(score)}</h2><p>${esc(sc.outro)}</p>
        <div class="row"><button class="btn" data-act="gdopen" data-id="${sc.id}">Rejouer cette main</button>${sc.lesson ? `<button class="btn" data-act="openmod" data-id="${sc.lesson}">Module lié</button>` : ''}<button class="btn primary" data-act="gdnextsc">Main guidée suivante</button></div></section>`;
    }
    if (!gd.info[k]) gd.info[k] = G.stepInfo(sc, k);
    const info = gd.info[k], a = gd.ans[k];
    const opts = st.options.map((o, oi) => {
      const grd = G.optionGrade(sc, k, oi, info);
      return `<button class="opt${a !== undefined ? (grd === 2 ? ' ok' : grd === 0 && oi === a ? ' ko' : '') : ''}" data-act="gdans" data-i="${oi}" ${a !== undefined ? 'disabled' : ''}>${esc(o[0])}${a !== undefined ? ` <span class="pill ${grd === 2 ? 'good' : grd === 1 ? '' : 'bad'}">${['Erreur', 'Défendable', 'Meilleure'][grd]}</span>` : ''}</button>`;
    }).join('');
    return `<div class="row"><button class="btn small" data-act="gdclose">← Toutes les mains guidées</button><span class="eyebrow">${esc(sc.title)} · décision ${k + 1} sur ${sc.steps.length}</span></div>
      ${k === 0 ? `<p class="lead">${esc(sc.intro)}</p>` : ''}
      <div class="row"><span class="note">Aide :</span>${[['steps', 'Étapes données'], ['hints', 'Indice sur demande'], ['none', 'Question seule']].map(([v, l]) => `<button class="chip" aria-pressed="${gdLevel() === v}" data-act="gdlvl" data-v="${v}">${l}</button>`).join('')}<span class="note">${gdAuto() !== gdLevel() ? `Niveau conseillé d'après tes résultats : ${{ steps: 'étapes données', hints: 'indice sur demande', none: 'question seule' }[gdAuto()]}.` : ''}</span></div>
      <div class="felt"><div class="row" style="justify-content:space-between"><span class="eyebrow">${{ pre: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River' }[st.street]} · pot ${String(st.pot).replace('.', ',')} bb${st.toCall ? ` · à payer ${String(st.toCall).replace('.', ',')} bb` : ''}</span><span class="pill">${esc(sc.villain.name)} · ${esc(sc.villain.profile)} · ${esc(sc.villain.pos)}</span></div>
        ${info.board.length ? cardsHTML(info.board) : ''}<span class="eyebrow">Ta main · ${esc(sc.pos)}</span>${cardsHTML(info.hero)}</div>
      <section class="panel"><p style="font-size:17px">${esc(st.story)}</p>
        ${a === undefined && (gdLevel() === 'steps' || (gdLevel() === 'hints' && gd.hint === k)) ? `<div class="advice"><div><strong>${gdLevel() === 'steps' ? 'Raisonne en trois étapes' : 'Indice'}.</strong> ${gdLevel() === 'steps' ? `1. Quelle range pour ${esc(sc.villain.name)} (${esc(sc.villain.profile)}, ${esc(sc.villain.pos)}) avec cette action ? 2. Les chiffres : ` : ''}${esc(/^(Solveur|En jetons)/.test(info.line) ? 'Tapis ou couché : ta main est-elle dans la range de Nash à ce tapis ? Si des places payées sont en jeu, l\'ICM resserre les calls.' : info.line)}${gdLevel() === 'steps' ? ' 3. Compare ton équité à la cote, puis demande-toi ce que paie ce profil.' : ''}</div></div>` : ''}
        ${a === undefined && gdLevel() === 'hints' && gd.hint !== k ? '<div class="row"><button class="btn small" data-act="gdhint">Voir un indice</button></div>' : ''}
        <div class="opts">${opts}</div>
        ${a !== undefined ? `<div class="verdict ${G.optionGrade(sc, k, a, info) === 2 ? 'good' : G.optionGrade(sc, k, a, info) === 1 ? '' : 'bad'}" style="background:var(--sunk)"><b>${esc(info.line)}</b></div>
          <div class="advice">${st.options.map((o, oi) => { const grd = G.optionGrade(sc, k, oi, info); return `<div class="${grd === 2 ? 'good' : grd === 1 ? 'warn' : 'bad'}"><strong>${esc(o[0])}</strong> : ${esc(o[2])}</div>`; }).join('')}</div>
          <div class="row"><button class="btn primary" data-act="gdnext">${k + 1 < sc.steps.length ? 'Décision suivante' : 'Voir le bilan'}</button></div>` : ''}</section>`;
  };
  // Aide qui s'estompe : étapes données, puis indice sur demande, puis question seule, selon tes scores aux mains guidées.
  const gdLevel = () => state.settings.gdLevel || gdAuto();
  function gdAuto() { const v = Object.values(state.progress.guided || {}); if (v.length < 3) return 'steps'; const m = v.reduce((a, b) => a + b, 0) / v.length; return m >= 0.9 ? 'none' : m >= 0.75 ? 'hints' : 'steps'; }
  ACT.gdlvl = (t) => { state.settings.gdLevel = t.dataset.v; save('settings'); render(); };
  ACT.gdhint = () => { gd.hint = gd.k; gd.hints = (gd.hints || 0) + 1; render(); };
  ACT.gdopen = (t) => { gd = { id: t.dataset.id, k: 0, ans: {}, info: {} }; sub = 'guided'; go('sim'); };
  ACT.gdclose = () => { gd = null; render(); };
  ACT.gdans = (t) => {
    gd.ans[gd.k] = +t.dataset.i;
    const sc = G.SCENARIOS.find((s) => s.id === gd.id);
    if (Object.keys(gd.ans).length === sc.steps.length) {
      const score = sc.steps.reduce((a, _, i) => a + G.optionGrade(sc, i, gd.ans[i], gd.info[i] || (gd.info[i] = G.stepInfo(sc, i))), 0) / (2 * sc.steps.length);
      state.progress.guided = state.progress.guided || {}; state.progress.guided[sc.id] = Math.max(state.progress.guided[sc.id] || 0, score); save('progress');
    }
    render();
  };
  ACT.gdnext = () => { gd.k++; render(); window.scrollTo(0, 0); };
  ACT.gdnextsc = () => { const i = G.SCENARIOS.findIndex((s) => s.id === gd.id), nx = G.SCENARIOS[(i + 1) % G.SCENARIOS.length]; gd = { id: nx.id, k: 0, ans: {}, info: {} }; render(); window.scrollTo(0, 0); };
  ONKEY.push((e, tab) => {
    if (tab !== 'sim' || sub !== 'guided' || !gd) return;
    const sc = G.SCENARIOS.find((s) => s.id === gd.id); if (gd.k >= sc.steps.length) return;
    if (/^[1-4]$/.test(e.key) && gd.ans[gd.k] === undefined && +e.key <= sc.steps[gd.k].options.length) { ACT.gdans({ dataset: { i: +e.key - 1 } }); return true; }
    if (e.key === 'Enter' && gd.ans[gd.k] !== undefined) { ACT.gdnext(); return true; }
  });

  // ================= Analyse : replayer et bibliothèque =================
  let anSub = 'import', rp = null; // rp = { raw, h, steps, k }
  X.getReplay = () => rp; X.setAnSub = (v) => { anSub = v; }; X.openReplay = (raw) => openReplay(raw);
  const baseAnalyse = VIEWS.analyse;
  VIEWS.analyse = () => {
    const tabs = `<div class="subtabs" role="tablist">${[['import', 'Import et statistiques'], ['review', 'Revue EV'], ['leaks', 'Population et fuites'], ['replay', 'Replayer'], ['library', `Bibliothèque (${state.library.hands.length})`]].map(([k, l]) => `<button class="chip" aria-pressed="${anSub === k}" data-act="ansub" data-s="${k}">${l}</button>`).join('')}</div>`;
    if (anSub === 'import') return baseAnalyse().replace('</section>', '</section>' + tabs);
    return head('Analyse de tes mains', 'Après la session : rejoue tes mains rue par rue, garde les plus instructives dans ta bibliothèque.') + tabs + (anSub === 'replay' ? replayHTML() : anSub === 'review' ? (X.reviewHTML ? X.reviewHTML() : '') : anSub === 'leaks' ? (X.leaksHTML ? X.leaksHTML() : '') : libraryHTML());
  };
  ACT.ansub = (t) => { anSub = t.dataset.s; render(); };
  function openReplay(raw) {
    const h = HH.parseHand(raw); if (!h.seats.length) return;
    rp = { raw, h, ...HH.replay(h), k: 0 }; anSub = 'replay'; go('analyse');
  }
  function replayHTML() {
    if (!rp) return `<section class="panel"><p>Choisis une main : bouton « Rejouer » dans le débrief du simulateur, sur les plus gros pots d'une analyse, dans ta bibliothèque, ou colle une main ci-dessous.</p>
      <textarea id="rptext" class="f mono" rows="8" style="font-size:12px" placeholder="Winamax Poker - CashGame - HandId: #…"></textarea><div class="row"><button class="btn primary" data-act="rppaste">Rejouer cette main</button></div></section>`;
    const st = rp.steps[rp.k], h = rp.h, bb = h.bb || 1;
    const seats = rp.seats.map((name) => {
      const folded = !st.alive.includes(name), cards = rp.known[name], eq = st.eq?.[name];
      return `<div class="rpseat${folded ? ' out' : ''}${st.who === name ? ' turn' : ''}"><span class="nm">${esc(name)}${name === rp.hero && !/^toi$/i.test(name) ? ' (toi)' : ''}</span>
        <div class="cards">${cards ? cards.map((c) => cardHTML(c, true)).join('') : backHTML(true) + backHTML(true)}</div><span class="stk">${fr(st.stacks[name] / bb, 1)} bb</span>${eq !== undefined ? `<span class="bet">${pct(eq, 0)}</span>` : ''}</div>`;
    }).join('');
    return `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Main ${esc(h.id)} · ${esc(h.site)} · blindes ${h.sb}/${h.bb}</span><div class="row"><button class="btn small" data-act="rp2solver" title="Ouvre le solveur au moment de la décision affichée">Retravailler au solveur</button><button class="btn small" data-act="librp">Sauvegarder</button><button class="btn small" data-act="rpclose">Autre main</button></div></div>
      <div class="felt"><div class="rpseats">${seats}</div><div class="row" style="justify-content:center;gap:16px">${st.board.length ? cardsHTML(st.board) : '<span style="opacity:.7">Préflop</span>'}<span class="pot" style="font:700 14px var(--f-display)">Pot ${fr(st.pot / bb, 1)} bb</span></div></div>
      <p style="font-size:17px"><strong>${rp.k + 1}/${rp.steps.length}</strong> · ${esc(st.text)}</p>
      <div class="row"><button class="btn" data-act="rpgo" data-k="0">⏮ Début</button><button class="btn" data-act="rpgo" data-k="${rp.k - 1}" ${rp.k ? '' : 'disabled'}>◀ Précédent</button><button class="btn primary" data-act="rpgo" data-k="${rp.k + 1}" ${rp.k < rp.steps.length - 1 ? '' : 'disabled'}>Suivant ▶</button><button class="btn" data-act="rpgo" data-k="${rp.steps.length - 1}">Fin ⏭</button><span class="note">Flèches ← → du clavier</span></div>
      <p class="note">Les pourcentages sont les équités de chaque joueur dont les cartes sont connues (toi, et ceux qui ont montré), calculées à chaque étape.</p>
      <details><summary class="note">Toutes les actions</summary><ol class="note" style="margin:8px 0 0;padding-left:1.4em">${rp.steps.map((s, i) => `<li${i === rp.k ? ' style="font-weight:600;color:var(--ink)"' : ''}>${esc(s.text)}</li>`).join('')}</ol></details></section>`;
  }
  ACT.rpgo = (t) => { rp.k = Math.max(0, Math.min(rp.steps.length - 1, +t.dataset.k)); render(); };
  ACT.rpclose = () => { rp = null; render(); };
  ACT.rppaste = () => { const v = $('#rptext').value, parts = HH.split(v); if (parts.length) openReplay(parts[0]); };
  ACT.rppot = (t) => { const r = X.getAnRes(); if (r) openReplay(r.pots[+t.dataset.i].hand.raw); };
  ONKEY.push((e, tab) => {
    if (tab !== 'analyse' || anSub !== 'replay' || !rp) return;
    if (e.key === 'ArrowRight') { rp.k = Math.min(rp.steps.length - 1, rp.k + 1); render(); return true; }
    if (e.key === 'ArrowLeft') { rp.k = Math.max(0, rp.k - 1); render(); return true; }
  });

  // Bibliothèque de mains (120 mains maximum, stockées à part)
  const TAGS = ['erreur', 'à revoir', 'value', 'bluff', 'hero call', 'préflop', 'tapis court', 'bien jouée'];
  let libFilter = '', libDel = null;
  function addToLibrary(raw, source, tags = []) {
    if (!raw) return;
    const h = HH.parseHand(raw), a = HH.analyzeHand(h);
    const id = 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    state.library.hands.unshift({ id, raw, source, tags, note: '', date: today(), cards: h.heroCards ? h.heroCards.map(E.cardStr).join(' ') : '', net: h.hero && a.net[h.hero] !== undefined ? a.net[h.hero] / (h.bb || 1) : 0 });
    if (state.library.hands.length > 120) state.library.hands.length = 120;
    save('library'); X.libMsg = 'Main ajoutée à ta bibliothèque.';
  }
  ACT.librp = () => { addToLibrary(rp.raw, 'Replayer'); render(); };
  ACT.libpot = (t) => { const r = X.getAnRes(); if (r) { addToLibrary(r.pots[+t.dataset.i].hand.raw, r.kind === 'real' ? 'Mes historiques' : 'Analyse'); render(); } };
  function libraryHTML() {
    const list = state.library.hands.filter((m) => !libFilter || m.tags.includes(libFilter));
    return `${X.libMsg ? `<div class="warnbox" role="status">${esc(X.libMsg)}</div>` : ''}
      <div class="row"><span class="note">Filtre :</span><button class="chip" aria-pressed="${!libFilter}" data-act="libf" data-v="">Toutes</button>${TAGS.map((tg) => `<button class="chip" aria-pressed="${libFilter === tg}" data-act="libf" data-v="${tg}">${tg}</button>`).join('')}</div>
      ${list.length ? list.map((m) => `<section class="panel" style="gap:8px"><div class="row" style="justify-content:space-between"><span><strong class="mono">${esc(m.cards || '—')}</strong> · <span class="mono" style="color:var(${m.net >= 0 ? '--good' : '--bad'})">${sgn(m.net, 1)} bb</span> · <span class="note">${esc(m.source)} · ${m.date.split('-').reverse().join('/')}</span></span>
        <div class="row"><button class="btn small" data-act="librep" data-id="${m.id}">Rejouer</button><button class="btn small" data-act="${libDel === m.id ? 'libdelok' : 'libdel'}" data-id="${m.id}">${libDel === m.id ? 'Confirmer la suppression' : 'Supprimer'}</button></div></div>
        <div class="row">${TAGS.map((tg) => `<button class="chip" style="font-size:12px;padding:3px 9px" aria-pressed="${m.tags.includes(tg)}" data-act="libtag" data-id="${m.id}" data-v="${tg}">${tg}</button>`).join('')}</div>
        <label class="f">Note<input id="libn_${m.id}" data-libnote="${m.id}" value="${esc(m.note)}" maxlength="240" placeholder="La leçon de cette main"></label></section>`).join('')
        : `<section class="panel"><p class="note">${state.library.hands.length ? 'Aucune main avec cette étiquette.' : 'Ta bibliothèque est vide. Sauvegarde une main depuis le débrief du simulateur, le replayer ou les plus gros pots d\'une analyse.'}</p></section>`}`;
  }
  ACT.libf = (t) => { libFilter = t.dataset.v; render(); };
  ACT.librep = (t) => { const m = state.library.hands.find((x) => x.id === t.dataset.id); if (m) openReplay(m.raw); };
  ACT.libtag = (t) => { const m = state.library.hands.find((x) => x.id === t.dataset.id), v = t.dataset.v; if (!m) return; m.tags = m.tags.includes(v) ? m.tags.filter((x) => x !== v) : [...m.tags, v]; save('library'); render(); };
  ACT.libdel = (t) => { libDel = t.dataset.id; render(); };
  ACT.libdelok = (t) => { state.library.hands = state.library.hands.filter((x) => x.id !== t.dataset.id); libDel = null; X.libMsg = 'Main supprimée.'; save('library'); render(); };
  ONCHANGE.push((t) => { if (t.dataset.libnote) { const m = state.library.hands.find((x) => x.id === t.dataset.libnote); if (m) { m.note = t.value.slice(0, 240); save('library'); } return true; } });

  // ================= Outils : distribution d'équité, deal ICM, mémo =================
  TOOLS.push(['dist', 'Distribution'], ['deal', 'Deal ICM'], ['memo', 'Mémo']);
  const ds = { a: C.RFI.CO.range, b: C.FACING.CO.BB.call, board: 'Kh7c2d', res: null, err: '' };
  TOOLVIEWS.dist = () => {
    const r = ds.res;
    return `<section class="panel"><p class="note">Équité de chaque combinaison d'une range contre l'autre sur un board. La courbe montre qui a l'avantage de range (équité moyenne) et l'avantage de nuts (part des mains au-dessus de 80 %).</p>
      <div class="form"><label class="f" style="grid-column:1/-1">Range A<input id="dsa" data-ds="a" value="${esc(ds.a)}" spellcheck="false"></label><label class="f" style="grid-column:1/-1">Range B<input id="dsb" data-ds="b" value="${esc(ds.b)}" spellcheck="false"></label><label class="f">Board (3 à 5 cartes)<input id="dsboard" data-ds="board" value="${esc(ds.board)}" spellcheck="false"></label></div>
      <div class="row"><button class="btn primary" data-act="dscalc">Calculer</button><button class="btn small" data-act="dsex" data-a="CO" data-b="BB">Ouverture CO contre défense BB</button><button class="btn small" data-act="dsex" data-a="UTG" data-b="BTN">Ouverture UTG contre call BTN</button></div>
      ${ds.err ? `<p class="pill bad" style="white-space:normal">${esc(ds.err)}</p>` : ''}</section>
      ${r ? `<div class="stats"><div class="stat hero"><span>Équité moyenne A</span><b>${pct(r.avgA, 1)}</b><span>${r.nA} combos · ${pct(r.nutsA)} au-dessus de 80 %</span></div><div class="stat"><span>Équité moyenne B</span><b>${pct(r.avgB, 1)}</b><span>${r.nB} combos · ${pct(r.nutsB)} au-dessus de 80 %</span></div></div>
        <section class="panel"><h2>Distribution</h2><canvas id="dscanvas" height="240" aria-label="Distribution d'équité"></canvas><div class="legend"><span><i style="background:var(--accent)"></i>Range A</span><span><i style="background:var(--muted)"></i>Range B</span></div>
        <p class="note">Axe horizontal : combinaisons classées de la plus forte à la plus faible (en % de la range). Axe vertical : équité. Estimation Monte-Carlo sur un échantillon de 140 combinaisons par range au plus.</p></section>` : ''}`;
  };
  X.AFTER.outils = () => {
    const cv = $('#dscanvas'); if (!cv || !ds.res) return;
    const resample = (v) => Array.from({ length: 101 }, (_, i) => v[Math.min(v.length - 1, Math.round(i / 100 * (v.length - 1)))] * 100);
    X.drawLines(cv, [{ pts: resample(ds.res.a), color: '--accent' }, { pts: resample(ds.res.b), color: '--muted', width: 2 }], { fmt: (v) => fr(v, 0) + ' %', xlabel: 'part de la range →' });
  };
  ACT.dscalc = () => {
    try {
      const board = E.parseCards(ds.board); if (board.length < 3 || board.length > 5) throw new Error('Le board fait 3 à 5 cartes.');
      if (new Set(board).size !== board.length) throw new Error('Une carte apparaît deux fois.');
      ds.res = B.equityDistribution(E.parseRange(ds.a), E.parseRange(ds.b), board); ds.err = '';
    } catch (e) { ds.err = e.message; ds.res = null; }
    render();
  };
  ACT.dsex = (t) => { ds.a = C.RFI[t.dataset.a].range; ds.b = C.FACING[t.dataset.a][t.dataset.b].call; ACT.dscalc(); };
  ONCHANGE.push((t) => { if (t.dataset.ds) { ds[t.dataset.ds] = t.value; return true; } });

  const dl = { stacks: '45000, 30000, 15000, 10000', prizes: '400, 250, 150, 100', res: null, err: '' };
  TOOLVIEWS.deal = () => {
    let res = '';
    try {
      const st = dl.stacks.split(/[;\s,]+/).map(Number).filter((x) => x > 0), pr = dl.prizes.split(/[;\s,]+/).map(Number).filter((x) => x > 0);
      if (st.length < 2) throw new Error('Indique au moins deux tapis.');
      if (pr.length < st.length) throw new Error(`Il faut un gain par joueur restant (${st.length}).`);
      const d = SV.deal(st, pr);
      res = `<section class="panel"><h2>Répartition proposée</h2><div class="tw"><table class="t"><thead><tr><th>Joueur</th><th class="n">Tapis</th><th class="n">Jetons</th><th class="n">Deal ICM</th><th class="n">Chip chop</th><th class="n">Écart</th></tr></thead><tbody>${d.map((x, i) => `<tr><td>J${i + 1}</td><td class="n">${fr(x.stack, 0)}</td><td class="n">${pct(x.share, 1)}</td><td class="n">${fr(x.icm)} €</td><td class="n">${fr(x.chip)} €</td><td class="n" style="color:var(${x.diff >= 0 ? '--good' : '--bad'})">${x.diff >= 0 ? '+' : '−'}${fr(Math.abs(x.diff))} €</td></tr>`).join('')}</tbody></table></div>
        <p class="note">Chip chop : chacun reçoit le dernier gain restant, puis le reste au prorata des jetons. Il favorise les gros tapis. Le deal ICM (Malmuth-Harville) est plus juste pour les petits. Petit tapis : refuse un chip chop, demande l'ICM.</p></section>`;
    } catch (e) { res = `<p class="pill bad" style="white-space:normal">${esc(e.message)}</p>`; }
    return `<section class="panel"><p class="note">Table finale : compare un partage ICM et un chip chop avant d'accepter un deal.</p><div class="form">
      <label class="f" style="grid-column:1/-1">Tapis des joueurs restants (jetons)<input id="dls" data-dl="stacks" value="${esc(dl.stacks)}"></label>
      <label class="f" style="grid-column:1/-1">Gains restants par place (€), du 1er au dernier<input id="dlp" data-dl="prizes" value="${esc(dl.prizes)}"></label></div></section>${res}`;
  };
  ONCHANGE.push((t) => { if (t.dataset.dl) { dl[t.dataset.dl] = t.value; render(); return true; } });

  TOOLVIEWS.memo = () => {
    const nash = [3, 5, 7, 10, 12, 15, 20].map((s) => { const r = SV.solveChip(s); return `<tr><td>${s} bb</td><td class="n">${pct(r.pushPct, 1)}</td><td class="n">${pct(r.callPct, 1)}</td></tr>`; }).join('');
    return `<div class="warnbox"><strong>Pour étudier, jamais pendant une session.</strong> Consulter cette fiche pendant une main est de l'aide en temps réel : interdit par toutes les rooms.</div>
      <div class="grid2"><section class="panel"><h2>Cotes du pot</h2><table class="t"><tbody>${[['¼ pot', '16,7 %'], ['⅓ pot', '20 %'], ['½ pot', '25 %'], ['⅔ pot', '28,6 %'], ['¾ pot', '30 %'], ['Pot', '33,3 %'], ['2 × pot', '40 %']].map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join('')}</tbody></table><p class="note">Équité requise = mise ÷ pot final.</p></section>
      <section class="panel"><h2>Outs</h2><table class="t"><thead><tr><th>Tirage</th><th class="n">Outs</th><th class="n">1 carte</th><th class="n">2 cartes</th></tr></thead><tbody>${[['Couleur', 9, '19,1', '35,0'], ['Suite deux bouts', 8, '17,0', '31,5'], ['Couleur + suite', 15, '31,9', '54,1'], ['Ventrale', 4, '8,5', '16,5'], ['Deux overcards', 6, '12,8', '24,1']].map(([a, o, x, y]) => `<tr><td>${a}</td><td class="n">${o}</td><td class="n">${x} %</td><td class="n">${y} %</td></tr>`).join('')}</tbody></table></section>
      <section class="panel"><h2>Ouvertures (premier à entrer)</h2><table class="t"><tbody>${C.POS.map((p) => `<tr><td>${C.RFI[p].label}</td><td class="n">${fr(E.rangePct(E.parseRange(C.RFI[p].range)), 0)} %</td></tr>`).join('')}</tbody></table></section>
      <section class="panel"><h2>Nash tête-à-tête</h2><table class="t"><thead><tr><th>Tapis</th><th class="n">SB pousse</th><th class="n">BB paie</th></tr></thead><tbody>${nash}</tbody></table></section></div>
      <section class="panel"><h2>Plans d'exploitation</h2><div class="tw"><table class="t"><tbody>${['station', 'maniaque', 'nit', 'reg'].map((k) => `<tr><td style="min-width:130px"><strong>${{ station: 'Fish passif', maniaque: 'Maniaque', nit: 'Nit', reg: 'Régulier' }[k]}</strong></td><td>${HH.EXPLOIT[k].map(esc).join(' ')}</td></tr>`).join('')}</tbody></table></div></section>`;
  };

  // ================= Aujourd'hui : programme de progression =================
  let showWeeks = false;
  const baseJour = VIEWS.jour;
  VIEWS.jour = () => {
    const weeks = P.weekStatus(state, K, S), curW = weeks.find((w) => !w.done) || weeks[weeks.length - 1];
    const taskBtn = (task) => `<div class="check" style="align-items:center"><span class="pill ${task.done ? 'good' : ''}" style="min-width:26px;text-align:center">${task.done ? '✓' : pct(task.progress)}</span><span style="flex:1">${esc(task.label)}</span>${task.done || !task.go ? '' : `<button class="btn small" data-act="plango" data-g="${esc(JSON.stringify(task.go))}">Y aller</button>`}</div>`;
    const panel = `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Programme · semaine ${curW.n} sur ${weeks.length}</span><span class="note mono">${weeks.filter((w) => w.done).length}/${weeks.length} semaines validées</span></div>
      <h2>${esc(curW.title)}</h2><p class="note">${esc(curW.why)}</p><div class="meter"><i style="width:${curW.progress * 100}%"></i></div>
      <div style="display:grid;gap:8px">${curW.tasks.map(taskBtn).join('')}</div>
      <div class="row"><button class="btn small" data-act="weeks">${showWeeks ? 'Masquer le programme' : `Voir les ${weeks.length} semaines`}</button></div>
      ${showWeeks ? `<div class="tw"><table class="t"><tbody>${weeks.map((w) => `<tr><td class="mono">S${w.n}</td><td>${esc(w.title)}</td><td class="n">${w.done ? '<span class="pill good">validée</span>' : pct(w.progress)}</td></tr>`).join('')}</tbody></table></div>` : ''}</section>`;
    return baseJour().replace('<div class="grid3">', panel + '<div class="grid3">');
  };
  ACT.weeks = () => { showWeeks = !showWeeks; render(); };
  ACT.plango = (t) => {
    const [k, v] = JSON.parse(t.dataset.g);
    if (k === 'mod') { X.setOpenMod(v); go('cours'); }
    else if (k === 'spot') { X.setSpotMode(v); go('spots'); }
    else if (k === 'guided') { gd = { id: v, k: 0, ans: {}, info: {} }; sub = 'guided'; go('sim'); }
    else if (k === 'sim') { sub = v; go('sim'); }
    else if (k === 'tab') go(v);
    else if (k === 'trainer') { X.solverState.sub = 'train'; go('solveur'); }
  };

  })();
