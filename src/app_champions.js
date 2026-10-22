// Onglet Champions : styles d'entraînement inspirés de joueurs connus, briefing, sessions dédiées, rapport d'adaptation,
// défi mystère (identifier le style) et classement des gains fourni.
(function () {
  const X = window.__S52, CH = window.Champions;
  const { TS, HH, $, esc, fr, pct, sgn, state, Store, render, head, VIEWS, ACT } = X;
  const ch = { sub: 'styles', sel: null, fmt: 'hu', mode: 'exam', target: 50, guess: null, lvl: 'all', era: 'all' };
  const prog = () => state.progress.champs || (state.progress.champs = { by: {}, mystery: { n: 0, ok: 0 } });
  const styleOf = (id) => CH.STYLES.find((s) => s.id === id);
  const srcLinks = (st) => st.sources.map((k) => `<a href="${CH.SRC[k].u}" target="_blank" rel="noopener">${esc(CH.SRC[k].t)}</a>`).join(' · ');

  const DISCLAIMER = 'Styles d\'entraînement construits par SIGMA 52 à partir de descriptions publiques (livres, cours, interviews). Ce ne sont ni les joueurs eux-mêmes, ni leur stratégie réelle : ce sont des adversaires-types pour apprendre à t\'adapter.';
  const SUBS = [['styles', 'Adversaires'], ['formats', 'Types de partie'], ['mystery', 'Défi mystère'], ['money', 'Classement des gains']];
  VIEWS.champions = () => head('Champions', 'Affronte les grands styles de jeu et apprends à t\'y adapter. ' + DISCLAIMER) +
    `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${ch.sub === k}" data-act="chsub" data-s="${k}">${l}</button>`).join('')}</div>` +
    (ch.sub === 'styles' ? stylesHTML() : ch.sub === 'formats' ? formatsHTML() : ch.sub === 'mystery' ? mysteryHTML() : moneyHTML());
  ACT.chsub = (t) => { ch.sub = t.dataset.s; render(); };

  function card(st) {
    const r = prog().by[st.id];
    return `<button class="champ${ch.sel === st.id ? ' on' : ''}" data-act="chsel" data-id="${st.id}">
      <span class="eyebrow">${beaten(st.id) ? '✓ ' : ''}${esc(st.level)}${st.format === 'hu' ? ' · tête-à-tête' : ''}</span><h3>${esc(st.name)}</h3><span class="note">Inspiré de ${esc(st.inspired)}</span>
      <span>${esc(st.tagline)}</span>${r ? `<span class="note mono">${r.hands} mains · ${sgn(r.bb, 0)} bb</span>` : ''}</button>`;
  }
  function statsTable(st) {
    if (!st.stats) return '';
    const S = st.stats;
    return `<div class="tw"><table class="t"><thead><tr><th>VPIP</th><th>PFR</th><th>3-bet</th><th>C-bet flop</th><th>Fold to c-bet</th></tr></thead><tbody><tr>${[S.vpip, S.pfr, S.three, S.cbet, S.ftc].map((v) => `<td class="mono">${v} %</td>`).join('')}</tr></tbody></table></div>
      <p class="note">Repères mesurés par SIGMA 52 sur 1 500 à 2 000 mains simulées${st.format === 'hu' ? ' en tête-à-tête' : ' à 6 joueurs'}. Le bot élargit ses ranges en tête-à-tête.</p>`;
  }
  function briefing(st) {
    const fmts = st.format === 'live' ? [['live', 'Table live, 200 bb']] : st.format === 'hu' ? [['hu', 'Tête-à-tête 100 bb']] : [['hu', 'Tête-à-tête 100 bb'], ['six', 'Table à 6 avec lui'], ['legends', 'Table des légendes (5 styles)']];
    if (!fmts.some(([k]) => k === ch.fmt)) ch.fmt = fmts[0][0];
    return `<section class="panel brief"><span class="eyebrow">Briefing · inspiré de ${esc(st.inspired)} (${esc(st.flag)})</span><h2>${esc(st.name)}</h2><p>${esc(st.tagline)}</p>
      <div class="grid2"><div><h3>Ce que disent les sources</h3><ul>${st.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><p class="note">Sources : ${srcLinks(st)}</p></div>
      <div><h3>Ce que fait ce bot</h3><ul>${st.traits.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>${statsTable(st)}</div></div>
      <div class="warnbox"><strong>Comment t'adapter</strong><ul>${st.adapt.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
      <div class="row"><span class="note">Format :</span>${fmts.map(([k, l]) => `<button class="chip" aria-pressed="${ch.fmt === k}" data-act="chfmt" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Durée :</span>${[25, 50, 100].map((n) => `<button class="chip" aria-pressed="${ch.target === n}" data-act="chtarget" data-v="${n}">${n} mains</button>`).join('')}</div>
      <div class="row"><span class="note">Coach :</span>${[['exam', 'Examen (après la main)'], ['live', 'En direct'], ['free', 'Sans aide']].map(([k, l]) => `<button class="chip" aria-pressed="${ch.mode === k}" data-act="chmode" data-v="${k}">${l}</button>`).join('')}</div>
      <p class="note">Le coach estime les ranges de ces styles à partir du profil le plus proche : ses conseils sont plus approximatifs qu'aux tables normales. Le rapport de fin de session compare ce que tu as observé au style réel du bot.</p>
      <div class="row"><button class="btn primary" data-act="chplay">Jouer</button><button class="btn" data-act="openmod" data-id="styles">Module : affronter les grands styles</button></div></section>`;
  }
  // Parcours des champions : du plus abordable au plus difficile ; un style est « battu » avec un résultat positif sur 50 mains ou plus.
  const LVL = ['Moyen', 'Difficile', 'Très difficile'];
  const beaten = (id) => { const r = prog().by[id]; return !!r && r.hands >= 50 && r.bb > 0; };
  function ladderHTML() {
    const pool = CH.STYLES.filter((s) => s.profile).slice().sort((a, b) => LVL.indexOf(a.level) - LVL.indexOf(b.level)), n = pool.filter((s) => beaten(s.id)).length, next = pool.find((s) => !beaten(s.id));
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Parcours des champions</span><h2>${n}/${pool.length} styles battus</h2></div>${next ? `<button class="btn primary" data-act="chsel" data-id="${next.id}">Prochain : ${esc(next.name)}</button>` : ''}</div>
      <div class="pbar"><i style="width:${Math.round((n / pool.length) * 100)}%"></i></div>
      <p class="note">Ordre conseillé : niveau Moyen, puis Difficile, puis Très difficile. Un style compte comme battu avec un résultat positif sur au moins 50 mains (examen ou sans aide).</p></section>`;
  }
  function stylesHTML() {
    const st = styleOf(ch.sel), list = CH.STYLES.filter((s) => (ch.lvl === 'all' || s.level === ch.lvl) && (ch.era === 'all' || s.era === ch.era));
    const chips = `<div class="row"><span class="note">Niveau :</span>${[['all', 'Tous']].concat(LVL.map((l) => [l, l])).map(([k, l]) => `<button class="chip" aria-pressed="${ch.lvl === k}" data-act="chlvl" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Époque :</span>${[['all', 'Toutes'], ['classique', 'Classiques'], ['moderne', 'Modernes']].map(([k, l]) => `<button class="chip" aria-pressed="${ch.era === k}" data-act="chera" data-v="${k}">${l}</button>`).join('')}<span class="note">${list.length} adversaire${list.length > 1 ? 's' : ''}</span></div>`;
    return ladderHTML() + chips + `<div class="champs">${list.map((x) => card(x)).join('')}</div>${st ? briefing(st) : '<p class="note">Choisis un adversaire pour lire son briefing.</p>'}`;
  }
  ACT.chlvl = (t) => { ch.lvl = t.dataset.v; render(); };
  ACT.chera = (t) => { ch.era = t.dataset.v; render(); };
  ACT.chsel = (t) => { ch.sel = t.dataset.id; render(); setTimeout(() => $('.brief')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  ACT.chfmt = (t) => { ch.fmt = t.dataset.v; render(); };
  ACT.chtarget = (t) => { ch.target = +t.dataset.v; render(); };
  ACT.chmode = (t) => { ch.mode = t.dataset.v; render(); };
  ACT.chplay = () => {
    const st = styleOf(ch.sel); if (!st) return;
    const lineup = ch.fmt === 'legends' ? CH.LEGENDS.slice() : CH.lineupFor(st, ch.fmt === 'six' ? 'six' : 'hu');
    X.startCash({ lineup, stackBB: st.format === 'live' ? 200 : 100, mode: ch.mode, target: ch.target, objectives: [], champ: { id: st.id, profile: st.profile, legends: ch.fmt === 'legends' } });
  };

  // ---- Types de partie : profondeur, structure, composition de la table ----
  const fm = { id: 'cash100', arch: 'mix', mode: 'exam', target: 50 };
  const K = window.Course;
  function formatsHTML() {
    const F = CH.FORMATS.find((f) => f.id === fm.id) || CH.FORMATS[0], fixed = !!F.lineup, rec = state.progress.formats?.[F.id];
    const modBtn = (id) => { const m = K.MODULES.find((x) => x.id === id); return m ? `<button class="btn small" data-act="openmod" data-id="${id}">Module : ${esc(m.title)}</button>` : ''; };
    const arch = F.kind === 'mtt' ? CH.ARCH[fm.arch].slice(0, F.players - 1) : F.lineup || CH.ARCH[fm.arch];
    return `<div class="champs">${CH.FORMATS.map((f) => `<button class="champ${f.id === F.id ? ' on' : ''}" data-act="fmsel" data-id="${f.id}"><span class="eyebrow">${f.kind === 'mtt' ? 'Tournoi' : 'Cash'}</span><h3>${esc(f.name)}</h3><span>${esc(f.desc)}</span></button>`).join('')}</div>
      <section class="panel brief"><span class="eyebrow">${F.kind === 'mtt' ? `Tournoi · ${F.players} joueurs · ${fr(F.stack, 0)} jetons` : `Cash · ${F.stackBB} bb · recave automatique`}</span><h2>${esc(F.name)}</h2><p>${esc(F.desc)}</p>
      <div class="warnbox"><strong>Ce qui change</strong><ul>${F.keys.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>
      ${fixed ? `<p class="note">Table imposée : ${arch.map((p) => esc(window.TableSim.PROFILES[p].label)).join(', ')}.</p>` : `<div class="row"><span class="note">Table :</span>${Object.keys(CH.ARCH).map((k) => `<button class="chip" aria-pressed="${fm.arch === k}" data-act="fmarch" data-v="${k}">${esc(CH.ARCH_LABEL[k])}</button>`).join('')}</div><p class="note">Adversaires : ${arch.map((p) => esc(window.TableSim.PROFILES[p].label)).join(', ')}.</p>`}
      ${F.kind === 'cash' ? `<div class="row"><span class="note">Durée :</span>${[25, 50, 100].map((n) => `<button class="chip" aria-pressed="${fm.target === n}" data-act="fmtarget" data-v="${n}">${n} mains</button>`).join('')}</div>` : ''}
      <div class="row"><span class="note">Coach :</span>${[['exam', 'Examen (après la main)'], ['live', 'En direct'], ['free', 'Sans aide']].map(([k, l]) => `<button class="chip" aria-pressed="${fm.mode === k}" data-act="fmmode" data-v="${k}">${l}</button>`).join('')}</div>
      ${rec ? `<p class="note mono">Parties : ${rec.games} · victoires : ${rec.places[1] || 0}</p>` : ''}
      <div class="row"><button class="btn primary" data-act="fmplay">Jouer</button>${F.mods.map(modBtn).join('')}</div></section>`;
  }
  ACT.fmsel = (t) => { fm.id = t.dataset.id; render(); };
  ACT.fmarch = (t) => { fm.arch = t.dataset.v; render(); };
  ACT.fmtarget = (t) => { fm.target = +t.dataset.v; render(); };
  ACT.fmmode = (t) => { fm.mode = t.dataset.v; render(); };
  ACT.fmplay = () => {
    const F = CH.FORMATS.find((f) => f.id === fm.id);
    if (F.kind === 'mtt') {
      const lineup = CH.ARCH[fm.arch].slice(0, F.players - 1);
      X.startTourney({ id: F.id, title: F.id === 'ft' ? 'la table finale' : F.id === 'expresso' ? 'l\'Expresso' : 'le Sit & Go', lineup, stack: F.stack, levels: F.levels.slice(F.start || 0), hpl: F.hpl, mode: fm.mode });
    } else X.startCash({ lineup: F.lineup || CH.ARCH[fm.arch], stackBB: F.stackBB, mode: fm.mode, target: fm.target, objectives: [] });
  };

  // ---- Défi mystère : identifier le style à partir de ce qu'on observe ----
  function mysteryHTML() {
    const m = prog().mystery;
    return `<section class="panel"><h2>Qui est en face ?</h2><p>Tu joues 60 mains en tête-à-tête contre un style tiré au hasard, nom caché, sans coach. À la fin, tu dis lequel c'était. C'est l'exercice de profilage qu'on fait à chaque nouvelle table : VPIP, agressivité, c-bet, réaction à tes mises.</p>
      <p class="note">${m.n ? `${m.ok} bonne${m.ok > 1 ? 's' : ''} identification${m.ok > 1 ? 's' : ''} sur ${m.n}.` : 'Pas encore de défi joué.'}</p>
      <div class="row"><button class="btn primary" data-act="chmyst">Lancer un défi</button></div></section>`;
  }
  ACT.chmyst = () => {
    const pool = CH.STYLES.filter((s) => s.profile), st = pool[Math.floor(Math.random() * pool.length)];
    ch.guess = null;
    X.startCash({ lineup: [st.profile], stackBB: 100, mode: 'free', target: 60, champ: { id: st.id, profile: st.profile, hidden: true } });
  };

  // ---- Classement ----
  function moneyHTML() {
    return `<section class="panel"><h2>Gains en tournois live : les 40 premiers</h2>
      <p class="note">Classement des gains bruts en tournois live (Hendon Mob), relevé fourni le 19/10/2026. Ce sont des gains, pas des bénéfices : les buy-ins (souvent 25 000 à 250 000 $ en high roller), les parts vendues à des investisseurs et les pertes en cash game ne sont pas déduits. Un gros total montre le volume joué à très haute limite, pas l'argent réellement gagné.</p>
      <div class="tw"><table class="t"><thead><tr><th class="n">#</th><th>Joueur</th><th>Pays</th><th class="n">Gains bruts</th><th>Style d'entraînement</th></tr></thead><tbody>
      ${CH.MONEY.map(([n, c, v], i) => { const sid = CH.STYLE_OF[n]; return `<tr><td class="n mono">${i + 1}</td><td>${esc(n)}</td><td>${esc(c)}</td><td class="n mono">${fr(v, 0)} $</td><td>${sid ? `<button class="btn small" data-act="chgo" data-id="${sid}">${esc(styleOf(sid).name)}</button>` : '<span class="note">—</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="note">Seuls les joueurs dont le style est décrit publiquement (livres, cours, interviews) ont un style d'entraînement. Aucun profil n'est inventé pour les autres.</p></section>`;
  }
  X.champSelect = (id) => { ch.sub = 'styles'; ch.sel = id; };
  ACT.chgo = (t) => { ch.sub = 'styles'; ch.sel = t.dataset.id; render(); };

  // ---- Bandeau pendant la session et rapport de fin ----
  X.champBanner = (g) => {
    const c = g.champ, st = styleOf(c.id);
    if (c.hidden) return `<div class="warnbox"><strong>Défi mystère :</strong> observe ses ouvertures, ses 3-bets, ses c-bets et sa réaction à tes mises. Tu devras l'identifier à la fin.</div>`;
    if (c.legends) return `<details class="panel"><summary><strong>Table des légendes :</strong> cinq styles autour de toi. Rappels d'adaptation</summary>${CH.LEGENDS.map((id) => { const s = styleOf(id); return `<p><strong>${esc(s.name)}</strong> : ${esc(s.adapt[0])}</p>`; }).join('')}</details>`;
    return `<details class="panel"><summary><strong>Contre ${esc(st.name)}</strong> (inspiré de ${esc(st.inspired)}) · rappels</summary><ul>${st.adapt.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></details>`;
  };
  function observed(g) {
    const a = HH.analyze(g.tb.history.join('\n\n')), out = {};
    for (const o of a.opponents) out[o.name] = { hands: o.hands, vpip: o.vpip / o.hands, pfr: o.pfr / o.hands, three: o.threeOpp ? o.three / o.threeOpp : null, cbet: o.cbetOpp ? o.cbet / o.cbetOpp : null, ftc: o.ftcOpp ? o.ftc / o.ftcOpp : null, n3: o.threeOpp, nc: o.cbetOpp, nf: o.ftcOpp, net: o.net };
    return out;
  }
  X.champReport = (g) => {
    const c = g.champ, t = g.tb, obs = observed(g), P = prog();
    if (!g.recorded) {
      g.recorded = true;
      const key = c.legends ? 'legends' : c.id, r = P.by[key] || (P.by[key] = { sessions: 0, hands: 0, bb: 0 });
      r.sessions++; r.hands += t.session.hands; r.bb += t.session.net; X.award?.('champ', null, true); Store.save('progress');
    }
    const champs = t.players.filter((p, i) => i > 0 && TS.PROFILES[p.profile]?.like);
    const se = (p, n) => (n ? Math.sqrt(p * (1 - p) / n) : null);
    const rows = champs.map((p) => {
      const o = obs[p.name] || {}, st = CH.STYLES.find((s) => s.profile === p.profile), S = st?.stats;
      const cell = (v, n, ref) => (v === null || v === undefined ? '<td class="mono">–</td>' : `<td class="mono">${pct(v)}${n ? ` <span class="note">±${fr(2 * se(v, n) * 100, 0)}</span>` : ''}${ref !== undefined && !c.hidden ? `<br><span class="note">repère ${ref} %</span>` : ''}</td>`);
      return `<tr><td>${esc(c.hidden ? 'Mystère' : p.name)}</td><td class="mono">${o.hands || 0}</td>${cell(o.vpip, o.hands, S?.vpip)}${cell(o.pfr, o.hands, S?.pfr)}${cell(o.three, o.n3, S?.three)}${cell(o.cbet, o.nc, S?.cbet)}${cell(o.ftc, o.nf, S?.ftc)}</tr>`;
    }).join('');
    const ho = t.heroObs, foldRate = ho.faced ? ho.folds / ho.faced : null;
    const adaptive = champs.some((p) => TS.PROFILES[p.profile].adapt);
    let guess = '';
    if (c.hidden) {
      const st = styleOf(c.id);
      if (ch.guess === null) guess = `<h3>Alors, qui était-ce ?</h3><div class="row">${CH.STYLES.filter((s) => s.profile).map((s) => `<button class="btn" data-act="chguess" data-id="${s.id}">${esc(s.name)}</button>`).join('')}</div>`;
      else guess = `<div class="verdict ${ch.guess === c.id ? 'good' : 'bad'}"><b>${ch.guess === c.id ? 'Bien vu.' : 'Raté.'}</b><span>C'était ${esc(st.name)} (inspiré de ${esc(st.inspired)}). ${esc(st.tagline)}</span></div>`;
    }
    return `<section class="panel" style="border-color:var(--gold)"><span class="eyebrow">Rapport d'adaptation</span><h2>${c.hidden ? 'Profil observé' : 'Ce que tu as vu, comparé au style réel'}</h2>
      <div class="tw"><table class="t"><thead><tr><th>Adversaire</th><th>Mains</th><th>VPIP</th><th>PFR</th><th>3-bet</th><th>C-bet</th><th>Fold to c-bet</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">± = intervalle approximatif à 95 % (deux erreurs types). Sur 50 mains, seules VPIP et PFR sont à peu près lisibles : c'est normal, et c'est la leçon.</p>
      ${foldRate !== null ? `<p>Face à ses mises après le flop, tu as couché <strong>${pct(foldRate)}</strong> du temps (${ho.folds} sur ${ho.faced}).${adaptive ? (foldRate > 0.45 && ho.faced >= 12 ? ' Au-delà de 45 %, les styles lecteurs augmentent leurs bluffs : c\'est ce qui s\'est passé.' : ' Sous 45 %, les styles lecteurs n\'ont pas pu augmenter leurs bluffs.') : ''}</p>` : ''}
      ${guess}</section>`;
  };
  ACT.chguess = (t) => {
    const g = X.getCash(); if (!g?.champ?.hidden || ch.guess !== null) return;
    ch.guess = t.dataset.id; const m = prog().mystery; m.n++; if (ch.guess === g.champ.id) m.ok++; Store.save('progress'); render();
  };
})();
