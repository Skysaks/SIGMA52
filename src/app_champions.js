// Onglet Champions : profils d'adversaires (archétypes), briefing, sessions dédiées, rapport d'adaptation, atlas des profils mesurés,
// exercice « reconnaître un profil » à partir de statistiques bruitées par la taille d'échantillon, et défi mystère.
(function () {
  const X = window.__S52, CH = window.Champions;
  const { TS, HH, $, esc, fr, pct, sgn, state, Store, render, head, VIEWS, ACT } = X;
  const ch = { sub: 'styles', sel: null, fmt: 'hu', mode: 'exam', target: 50, guess: null, lvl: 'all', fam: 'all', sort: 'hero', reco: null, recoN: 300 };
  // Anciens identifiants (versions précédentes) → profils actuels : la progression enregistrée est conservée.
  const OLD = { ivey: 'predateur', negreanu: 'small_ball', hellmuth: 'lecteur_serre', chidwick: 'equilibre', mizrachi: 'lag_imprevisible', antonius: 'presseur_hu', brunson: 'barreleur', harrington: 'tournoi_methodique', dwan: 'ultra_lag', hansen: 'joueur_flops', blom: 'suragressif', polk: 'specialiste_hu', seidel: 'patient', selbst: 'trois_bet', ungar: 'lecteur_agressif', obrestad: 'positionnel', ferguson: 'analyste', moneymaker: 'amateur_audacieux', elky: 'volume', matusow: 'volcan', sklansky: 'theoricien', esfandiari: 'bouton', cates: 'defenseur', adelstein: 'cash_live', caro: 'image_folle', koon: 'solveur', reese: 'cash_complet', live: 'partie_live' };
  const prog = () => {
    const P = state.progress.champs || (state.progress.champs = { by: {}, mystery: { n: 0, ok: 0 } });
    if (!P.v2) { for (const [o, n] of Object.entries(OLD)) if (P.by[o]) { const a = P.by[o], b = P.by[n] || { sessions: 0, hands: 0, bb: 0 }; P.by[n] = { sessions: a.sessions + b.sessions, hands: a.hands + b.hands, bb: a.bb + b.bb }; delete P.by[o]; } P.v2 = true; P.reco = P.reco || { n: 0, ok: 0 }; }
    return P;
  };
  const styleOf = (id) => CH.STYLES.find((s) => s.id === id);
  const P100 = (v) => (v === null || v === undefined ? '–' : fr(v * 100, 0) + ' %');
  const DISCLAIMER = 'Profils d\'adversaires construits par SIGMA 52 : des archétypes, pas des joueurs réels. Leurs statistiques sont mesurées sur les bots eux-mêmes.';
  const SUBS = [['styles', 'Adversaires'], ['atlas', 'Atlas des profils'], ['reco', 'Reconnaître un profil'], ['formats', 'Types de partie'], ['mystery', 'Défi mystère']];
  VIEWS.champions = () => head('Champions', 'Affronte les grands styles de jeu, apprends à les reconnaître et à t\'y adapter. ' + DISCLAIMER) +
    `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${ch.sub === k}" data-act="chsub" data-s="${k}">${l}</button>`).join('')}</div>` +
    (ch.sub === 'styles' ? stylesHTML() : ch.sub === 'atlas' ? atlasHTML() : ch.sub === 'reco' ? recoHTML() : ch.sub === 'formats' ? formatsHTML() : mysteryHTML());
  ACT.chsub = (t) => { ch.sub = t.dataset.s; render(); };

  function card(st) {
    const r = prog().by[st.id];
    return `<button class="champ${ch.sel === st.id ? ' on' : ''}" data-act="chsel" data-id="${st.id}">
      <span class="eyebrow">${beaten(st.id) ? '✓ ' : ''}${esc(st.level)} · ${esc(st.family)}${st.format === 'hu' ? ' · tête-à-tête' : ''}</span><h3>${esc(st.name)}</h3>
      <span>${esc(st.tagline)}</span>${r ? `<span class="note mono">${r.hands} mains · ${sgn(r.bb, 0)} bb</span>` : ''}</button>`;
  }
  // Statistiques mesurées (tools/measure_champions.js) : table à 6 et tête-à-tête, avec le nombre d'occasions.
  function statsTable(st) {
    const S = st.stats; if (!S) return '';
    const row = (l, m) => `<tr><td>${l}</td><td class="mono">${P100(m.vpip)}</td><td class="mono">${P100(m.pfr)}</td><td class="mono">${P100(m.three)}</td><td class="mono">${P100(m.cbet)}</td><td class="mono">${P100(m.ftc)}</td><td class="mono">${P100(m.wtsd)}</td><td class="mono">${m.af ?? '–'}</td></tr>`;
    const se = 100 / Math.sqrt(S.hu.heroHands / 100);
    return `<div class="tw"><table class="t"><thead><tr><th></th><th>VPIP</th><th>PFR</th><th>3-bet</th><th>C-bet</th><th>Fold c-bet</th><th>Abattage</th><th>AF</th></tr></thead><tbody>${st.format !== 'hu' ? row('Table à 6', S.six) : ''}${row('Tête-à-tête', S.hu)}</tbody></table></div>
      <p class="note">Mesuré sur ${fr(S.hu.n, 0)} mains simulées en tête-à-tête${st.format !== 'hu' ? ` et ${fr(S.six.n, 0)} à 6` : ''}. Abattage : part des flops vus qui vont à l'abattage. AF : (mises + relances) ÷ calls après le flop. Un héros régulier (bot) fait <strong>${sgn(S.hu.hero, 1)} bb/100</strong> contre lui en tête-à-tête (± ${fr(2 * se, 0)} à 95 %, écart-type supposé de 100 bb/100) : c'est ce chiffre qui fixe le niveau.</p>`;
  }
  function briefing(st) {
    const fmts = st.format === 'live' ? [['live', 'Table live, 200 bb']] : st.format === 'hu' ? [['hu', 'Tête-à-tête 100 bb']] : [['hu', 'Tête-à-tête 100 bb'], ['six', 'Table à 6 avec lui'], ['legends', 'Table des 5 profils les plus difficiles']];
    if (!fmts.some(([k]) => k === ch.fmt)) ch.fmt = fmts[0][0];
    return `<section class="panel brief"><span class="eyebrow">Briefing · ${esc(st.family)} · ${esc(st.level)}</span><h2>${esc(st.name)}</h2><p>${esc(st.tagline)}</p>
      <div class="grid2"><div><h3>Comment le reconnaître</h3><ul>${st.spot.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
      <div><h3>Ce que fait ce bot</h3><ul>${st.traits.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div></div>
      ${statsTable(st)}
      <div class="warnbox"><strong>Comment t'adapter</strong><ul>${st.adapt.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
      <div class="row"><span class="note">Format :</span>${fmts.map(([k, l]) => `<button class="chip" aria-pressed="${ch.fmt === k}" data-act="chfmt" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Durée :</span>${[25, 50, 100].map((n) => `<button class="chip" aria-pressed="${ch.target === n}" data-act="chtarget" data-v="${n}">${n} mains</button>`).join('')}</div>
      <div class="row"><span class="note">Coach :</span>${[['exam', 'Examen (après la main)'], ['live', 'En direct'], ['free', 'Sans aide']].map(([k, l]) => `<button class="chip" aria-pressed="${ch.mode === k}" data-act="chmode" data-v="${k}">${l}</button>`).join('')}</div>
      <p class="note">Le coach estime les ranges de ces profils à partir du profil de base le plus proche : ses conseils sont plus approximatifs qu'aux tables normales. Le rapport de fin de session compare ce que tu as observé aux statistiques mesurées du profil.</p>
      <div class="row"><button class="btn primary" data-act="chplay">Jouer</button><button class="btn" data-act="openmod" data-id="styles">Module : affronter les grands styles</button></div></section>`;
  }
  // Parcours : du plus abordable au plus difficile (niveau mesuré) ; un profil est « battu » avec un résultat positif sur 50 mains ou plus.
  const LVL = CH.LEVELS;
  const beaten = (id) => { const r = prog().by[id]; return !!r && r.hands >= 50 && r.bb > 0; };
  const byDifficulty = (a, b) => (b.stats?.hu.hero ?? 0) - (a.stats?.hu.hero ?? 0);
  function ladderHTML() {
    const pool = CH.STYLES.filter((s) => s.profile).slice().sort(byDifficulty), n = pool.filter((s) => beaten(s.id)).length, next = pool.find((s) => !beaten(s.id));
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Parcours des profils</span><h2>${n}/${pool.length} profils battus</h2></div>${next ? `<button class="btn primary" data-act="chsel" data-id="${next.id}">Prochain : ${esc(next.name)}</button>` : ''}</div>
      <div class="pbar"><i style="width:${Math.round((n / pool.length) * 100)}%"></i></div>
      <p class="note">Ordre : du profil le plus battu par un héros régulier au moins battu (mesure en tête-à-tête). Un profil compte comme battu avec un résultat positif sur au moins 50 mains (examen ou sans aide).</p></section>`;
  }
  function stylesHTML() {
    const st = styleOf(ch.sel), list = CH.STYLES.filter((s) => (ch.lvl === 'all' || s.level === ch.lvl) && (ch.fam === 'all' || s.family === ch.fam));
    const chips = `<div class="row"><span class="note">Niveau :</span>${[['all', 'Tous']].concat(LVL.map((l) => [l, l])).map(([k, l]) => `<button class="chip" aria-pressed="${ch.lvl === k}" data-act="chlvl" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="row"><span class="note">Famille :</span>${[['all', 'Toutes']].concat(CH.FAMILIES.map((f) => [f, f])).map(([k, l]) => `<button class="chip" aria-pressed="${ch.fam === k}" data-act="chfam" data-v="${k}">${l}</button>`).join('')}<span class="note">${list.length} adversaire${list.length > 1 ? 's' : ''}</span></div>`;
    return ladderHTML() + chips + `<div class="champs">${list.map((x) => card(x)).join('')}</div>${st ? briefing(st) : '<p class="note">Choisis un adversaire pour lire son briefing.</p>'}`;
  }
  ACT.chlvl = (t) => { ch.lvl = t.dataset.v; render(); };
  ACT.chfam = (t) => { ch.fam = t.dataset.v; render(); };
  ACT.chsel = (t) => { ch.sel = t.dataset.id; ch.sub = 'styles'; render(); setTimeout(() => $('.brief')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  ACT.chfmt = (t) => { ch.fmt = t.dataset.v; render(); };
  ACT.chtarget = (t) => { ch.target = +t.dataset.v; render(); };
  ACT.chmode = (t) => { ch.mode = t.dataset.v; render(); };
  ACT.chplay = () => {
    const st = styleOf(ch.sel); if (!st) return;
    const lineup = ch.fmt === 'legends' ? CH.LEGENDS.slice() : CH.lineupFor(st, ch.fmt === 'six' ? 'six' : 'hu');
    X.startCash({ lineup, stackBB: st.format === 'live' ? 200 : 100, mode: ch.mode, target: ch.target, objectives: [], champ: { id: st.id, profile: st.profile, legends: ch.fmt === 'legends' } });
  };

  // ---- Atlas : tous les profils mesurés, comparables d'un coup d'œil ----
  const COLS = [['hero', 'Héros régulier (bb/100, tête-à-tête)'], ['vpip', 'VPIP'], ['pfr', 'PFR'], ['three', '3-bet'], ['cbet', 'C-bet'], ['ftc', 'Fold c-bet'], ['wtsd', 'Abattage'], ['af', 'AF']];
  function atlasHTML() {
    const pool = CH.STYLES.filter((s) => s.stats), val = (s, k) => (k === 'hero' ? s.stats.hu.hero : (s.format === 'hu' ? s.stats.hu : s.stats.six)[k] ?? -1);
    const rows = pool.slice().sort((a, b) => (ch.sort === 'hero' ? val(a, 'hero') - val(b, 'hero') : val(b, ch.sort) - val(a, ch.sort)));
    const base = ['reg', 'station', 'nit', 'maniaque'].map((k) => [k, window.ChampStats?.stats?.[k]]).filter(([, v]) => v);
    return `<section class="panel"><h2>Atlas des profils</h2><p class="note">Statistiques mesurées à la table à 6 (en tête-à-tête pour les profils de tête-à-tête). Trie par colonne pour voir ce qui distingue chaque famille : c'est la grille de lecture d'une vraie table.</p>
      <div class="row"><span class="note">Trier par :</span>${COLS.map(([k, l]) => `<button class="chip" aria-pressed="${ch.sort === k}" data-act="chsort" data-v="${k}">${esc(l.split(' (')[0])}</button>`).join('')}</div>
      <div class="tw"><table class="t"><thead><tr><th>Profil</th><th>Famille</th>${COLS.map(([k, l]) => `<th class="n">${esc(k === 'hero' ? 'Héros' : l)}</th>`).join('')}</tr></thead><tbody>
      ${rows.map((s) => { const m = s.format === 'hu' ? s.stats.hu : s.stats.six; return `<tr><td><button class="btn small" data-act="chsel" data-id="${s.id}">${esc(s.name)}</button></td><td>${esc(s.family)}</td><td class="n mono">${sgn(s.stats.hu.hero, 0)}</td>${['vpip', 'pfr', 'three', 'cbet', 'ftc', 'wtsd'].map((k) => `<td class="n mono">${P100(m[k])}</td>`).join('')}<td class="n mono">${m.af ?? '–'}</td></tr>`; }).join('')}
      ${base.map(([k, v]) => `<tr class="note"><td>${esc(TS.PROFILES[k].label)} (base)</td><td>Référence</td><td class="n mono">${sgn(v.hu.hero, 0)}</td>${['vpip', 'pfr', 'three', 'cbet', 'ftc', 'wtsd'].map((q) => `<td class="n mono">${P100(v.six[q])}</td>`).join('')}<td class="n mono">${v.six.af ?? '–'}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Héros : résultat d'un bot régulier contre le profil en tête-à-tête, en bb/100 ; plus il est bas, plus le profil est difficile. Les mesures sont celles des bots de SIGMA 52 : elles décrivent ces adversaires d'entraînement, pas une population réelle.</p></section>`;
  }
  ACT.chsort = (t) => { ch.sort = t.dataset.v; render(); };

  // ---- Reconnaître un profil : statistiques observées sur N mains (bruit d'échantillonnage réel), quatre choix ----
  const binom = (n, p) => { let k = 0; if (n > 400) { const m = n * p, sd = Math.sqrt(n * p * (1 - p)); let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); k = Math.round(m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)); return Math.max(0, Math.min(n, k)); } for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; };
  function recoNew() {
    const pool = CH.STYLES.filter((s) => s.stats && s.format !== 'hu' && s.format !== 'live'), truth = pool[Math.floor(Math.random() * pool.length)], M = truth.stats.six, N = ch.recoN;
    const opp = (k) => Math.max(1, Math.round(N * ({ vpip: 1, pfr: 1, three: (M.n3 || 1) / M.n, cbet: (M.nc || 1) / M.n, ftc: (M.nf || 1) / M.n, wtsd: (M.vpip || 0.2) * 0.8 })[k]));
    const obs = {}; for (const k of ['vpip', 'pfr', 'three', 'cbet', 'ftc', 'wtsd']) { const n = opp(k); obs[k] = { v: M[k] === null ? null : binom(n, M[k]) / n, n }; }
    obs.pfr.v = Math.min(obs.pfr.v, obs.vpip.v);
    // Trois leurres : un de la même famille si possible, deux autres au hasard.
    const others = pool.filter((s) => s.id !== truth.id).sort(() => Math.random() - 0.5), same = others.find((s) => s.family === truth.family);
    const opts = [truth, ...(same ? [same] : []), ...others.filter((s) => s !== same)].slice(0, 4).sort(() => Math.random() - 0.5);
    ch.reco = { id: truth.id, obs, opts: opts.map((s) => s.id), ans: null };
  }
  function recoHTML() {
    const R = prog().reco || { n: 0, ok: 0 };
    if (!ch.reco) return `<section class="panel"><h2>Reconnaître un profil</h2><p>Tu vois les statistiques d'un adversaire observé sur un nombre de mains donné, avec le bruit réel d'un petit échantillon. Choisis le profil. C'est la lecture que tu fais d'un HUD ou de tes notes, et la leçon porte autant sur la taille d'échantillon que sur les profils.</p>
      <div class="row"><span class="note">Mains observées :</span>${[100, 300, 1000].map((n) => `<button class="chip" aria-pressed="${ch.recoN === n}" data-act="chrecon" data-v="${n}">${n}</button>`).join('')}</div>
      <p class="note">${R.n ? `${R.ok} bonne${R.ok > 1 ? 's' : ''} réponse${R.ok > 1 ? 's' : ''} sur ${R.n}.` : 'Pas encore de réponse.'}</p><div class="row"><button class="btn primary" data-act="chreco">Commencer</button></div></section>`;
    const r = ch.reco, truth = styleOf(r.id), lab = { vpip: 'VPIP', pfr: 'PFR', three: '3-bet', cbet: 'C-bet', ftc: 'Fold c-bet', wtsd: 'Abattage' };
    const cell = (k) => { const o = r.obs[k]; if (o.v === null) return '–'; const se = Math.sqrt(Math.max(o.v * (1 - o.v), 0.01) / o.n); return `${P100(o.v)} <span class="note">±${fr(2 * se * 100, 0)} · ${o.n} occ.</span>`; };
    let after = '';
    if (r.ans) {
      const ok = r.ans === r.id, cmp = r.opts.map((id) => styleOf(id));
      after = `<div class="verdict ${ok ? 'good' : 'bad'}"><b>${ok ? 'Bien lu.' : 'Raté.'}</b><span>C'était ${esc(truth.name)} (${esc(truth.family)}). ${esc(truth.tagline)}</span></div>
        <div class="tw"><table class="t"><thead><tr><th>Profil</th>${Object.values(lab).map((l) => `<th class="n">${l}</th>`).join('')}</tr></thead><tbody>
        <tr><td><strong>Observé (${ch.recoN} mains)</strong></td>${Object.keys(lab).map((k) => `<td class="n mono">${P100(r.obs[k].v)}</td>`).join('')}</tr>
        ${cmp.map((s) => `<tr${s.id === r.id ? ' style="font-weight:700"' : ''}><td>${esc(s.name)}</td>${Object.keys(lab).map((k) => `<td class="n mono">${P100(s.stats.six[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="note">Valeurs vraies mesurées sur ${fr(window.ChampStats?.hands || 0, 0)} mains. Sur ${ch.recoN} mains, VPIP et PFR sont fiables à quelques points ; 3-bet, c-bet et fold to c-bet le deviennent bien plus tard, faute d'occasions.</p>
        <div class="row"><button class="btn primary" data-act="chreco">Suivant</button><button class="btn" data-act="chsel" data-id="${truth.id}">Voir le briefing</button></div>`;
    }
    return `<section class="panel"><span class="eyebrow">Reconnaître un profil · ${ch.recoN} mains observées · ${R.ok}/${R.n}</span><h2>Qui est-ce ?</h2>
      <div class="tw"><table class="t"><tbody>${Object.entries(lab).map(([k, l]) => `<tr><td>${l}</td><td class="mono">${cell(k)}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">± = intervalle approximatif à 95 % ; « occ. » = nombre d'occasions de faire l'action sur l'échantillon.</p>
      ${r.ans ? after : `<div class="row">${r.opts.map((id) => `<button class="btn" data-act="chrecoans" data-id="${id}">${esc(styleOf(id).name)}</button>`).join('')}</div>`}</section>`;
  }
  ACT.chrecon = (t) => { ch.recoN = +t.dataset.v; render(); };
  ACT.chreco = () => { recoNew(); render(); };
  ACT.chrecoans = (t) => { if (!ch.reco || ch.reco.ans) return; ch.reco.ans = t.dataset.id; const R = prog().reco || (prog().reco = { n: 0, ok: 0 }); R.n++; if (t.dataset.id === ch.reco.id) R.ok++; Store.save('progress'); render(); };

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

  // ---- Défi mystère : identifier le profil à partir de ce qu'on observe ----
  function mysteryHTML() {
    const m = prog().mystery;
    return `<section class="panel"><h2>Qui est en face ?</h2><p>Tu joues 60 mains en tête-à-tête contre un profil tiré au hasard, nom caché, sans coach. À la fin, tu dis lequel c'était. C'est l'exercice de profilage qu'on fait à chaque nouvelle table : VPIP, agressivité, c-bet, réaction à tes mises.</p>
      <p class="note">${m.n ? `${m.ok} bonne${m.ok > 1 ? 's' : ''} identification${m.ok > 1 ? 's' : ''} sur ${m.n}.` : 'Pas encore de défi joué.'}</p>
      <div class="row"><button class="btn primary" data-act="chmyst">Lancer un défi</button></div></section>`;
  }
  ACT.chmyst = () => {
    const pool = CH.STYLES.filter((s) => s.profile), st = pool[Math.floor(Math.random() * pool.length)];
    ch.guess = null;
    X.startCash({ lineup: [st.profile], stackBB: 100, mode: 'free', target: 60, champ: { id: st.id, profile: st.profile, hidden: true } });
  };
  X.champSelect = (id) => { ch.sub = 'styles'; ch.sel = id; };
  ACT.chgo = (t) => { ch.sub = 'styles'; ch.sel = t.dataset.id; render(); };

  // ---- Bandeau pendant la session et rapport de fin ----
  X.champBanner = (g) => {
    const c = g.champ, st = styleOf(c.id);
    if (c.hidden) return `<div class="warnbox"><strong>Défi mystère :</strong> observe ses ouvertures, ses 3-bets, ses c-bets et sa réaction à tes mises. Tu devras l'identifier à la fin.</div>`;
    if (c.legends) return `<details class="panel"><summary><strong>Table des cinq profils les plus difficiles</strong> · rappels d'adaptation</summary>${CH.LEGENDS.map((id) => { const s = styleOf(id); return `<p><strong>${esc(s.name)}</strong> : ${esc(s.adapt[0])}</p>`; }).join('')}</details>`;
    return `<details class="panel"><summary><strong>Contre ${esc(st.name)}</strong> · rappels</summary><ul>${st.adapt.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></details>`;
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
      const o = obs[p.name] || {}, st = CH.STYLES.find((s) => s.profile === p.profile), M = st?.stats ? (t.players.length === 2 ? st.stats.hu : st.stats.six) : null, R = (v) => (v === null || v === undefined ? undefined : Math.round(v * 100)), S = M ? { vpip: R(M.vpip), pfr: R(M.pfr), three: R(M.three), cbet: R(M.cbet), ftc: R(M.ftc) } : null;
      const cell = (v, n, ref) => (v === null || v === undefined ? '<td class="mono">–</td>' : `<td class="mono">${pct(v)}${n ? ` <span class="note">±${fr(2 * se(v, n) * 100, 0)}</span>` : ''}${ref !== undefined && !c.hidden ? `<br><span class="note">repère ${ref} %</span>` : ''}</td>`);
      return `<tr><td>${esc(c.hidden ? 'Mystère' : p.name)}</td><td class="mono">${o.hands || 0}</td>${cell(o.vpip, o.hands, S?.vpip)}${cell(o.pfr, o.hands, S?.pfr)}${cell(o.three, o.n3, S?.three)}${cell(o.cbet, o.nc, S?.cbet)}${cell(o.ftc, o.nf, S?.ftc)}</tr>`;
    }).join('');
    const ho = t.heroObs, foldRate = ho.faced ? ho.folds / ho.faced : null;
    const adaptive = champs.some((p) => TS.PROFILES[p.profile].adapt);
    let guess = '';
    if (c.hidden) {
      const st = styleOf(c.id);
      if (ch.guess === null) guess = `<h3>Alors, qui était-ce ?</h3><div class="row">${CH.STYLES.filter((s) => s.profile).map((s) => `<button class="btn" data-act="chguess" data-id="${s.id}">${esc(s.name)}</button>`).join('')}</div>`;
      else guess = `<div class="verdict ${ch.guess === c.id ? 'good' : 'bad'}"><b>${ch.guess === c.id ? 'Bien vu.' : 'Raté.'}</b><span>C'était ${esc(st.name)} (${esc(st.family)}). ${esc(st.tagline)}</span></div>`;
    }
    return `<section class="panel" style="border-color:var(--gold)"><span class="eyebrow">Rapport d'adaptation</span><h2>${c.hidden ? 'Profil observé' : 'Ce que tu as vu, comparé au profil mesuré'}</h2>
      <div class="tw"><table class="t"><thead><tr><th>Adversaire</th><th>Mains</th><th>VPIP</th><th>PFR</th><th>3-bet</th><th>C-bet</th><th>Fold to c-bet</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">± = intervalle approximatif à 95 % (deux erreurs types). Sur 50 mains, seules VPIP et PFR sont à peu près lisibles : c'est normal, et c'est la leçon.</p>
      ${foldRate !== null ? `<p>Face à ses mises après le flop, tu as couché <strong>${pct(foldRate)}</strong> du temps (${ho.folds} sur ${ho.faced}).${adaptive ? (foldRate > 0.45 && ho.faced >= 12 ? ' Au-delà de 45 %, les profils lecteurs augmentent leurs bluffs : c\'est ce qui s\'est passé.' : ' Sous 45 %, les profils lecteurs n\'ont pas pu augmenter leurs bluffs.') : ''}</p>` : ''}
      ${guess}</section>`;
  };
  ACT.chguess = (t) => {
    const g = X.getCash(); if (!g?.champ?.hidden || ch.guess !== null) return;
    ch.guess = t.dataset.id; const m = prog().mystery; m.n++; if (ch.guess === g.champ.id) m.ok++; Store.save('progress'); render();
  };
})();
