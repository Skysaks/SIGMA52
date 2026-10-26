// Onglet Débuter : feuille de route du débutant (reprise du « Poker Performance Lab » et du « Poker Decision Lab » de Florian),
// branchée sur SIGMA 52 : programme de 12 semaines validé en partie automatiquement, carnet de décisions en 6 questions avec révision FSRS,
// capital et garde-fous calculés sur le Journal, maths utiles, bilan et test de sortie, ressources, import des sauvegardes JSON existantes.
(function () {
  const X = window.__S52, E = window.Engine, FS = window.FSRS;
  const { $, esc, fr, eur, pct, today, state, Store, render, go, head, VIEWS, ACT, ONCHANGE, ONINPUT, TABS, GROUPS } = X;
  TABS.push(['debuter', 'Débuter']);
  GROUPS.find((g) => g[0] === 'apprendre')[2].unshift('debuter');
  const D = () => {
    const d = state.debuter || (state.debuter = {});
    d.checks = d.checks || []; d.notes = d.notes || {}; d.carnet = d.carnet || []; d.pre = d.pre || {}; d.post = d.post || {}; d.exit = d.exit || {};
    d.risk = { budget: 0, limit: 0, caves: 50, stake: 'NL2', time: 1.5, ...(d.risk || {}) };
    d.math = { pot: 10, bet: 5, eq: 30, wr: 5, hands: 20000, sd: 80, ...(d.math || {}) };
    return d;
  };
  const save = () => Store.save('debuter');
  let sub = 'start', revShow = false, cMsg = '', impMsg = '';
  const SUBS = [['start', 'Démarrer'], ['prog', '12 semaines'], ['carnet', 'Carnet de décisions'], ['capital', 'Capital et garde-fous'], ['maths', 'Maths utiles'], ['bilan', 'Bilan et test de sortie'], ['res', 'Ressources et import']];
  const stat = (t) => state.progress.stats?.[t] || { ok: 0, n: 0 };
  const rate = (t) => { const s = stat(t); return s.n ? s.ok / s.n : null; };
  const link = (label, v) => `<button class="btn small" data-act="dbgo" data-v="${esc(v)}">${esc(label)}</button>`;
  const ext = (label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

  // ---------------- Démarrer ----------------
  const ROOMS = [
    ['PokerStars.fr', 'École intégrée en français, barème de rake consultable', 'Rake et outils autorisés (règles strictes, voir plus bas)', 'https://www.pokerstars.fr'],
    ['Winamax', 'Interface francophone, cash game, Expresso et tournois', 'Rake effectif et historiques de mains', 'https://www.winamax.fr'],
    ['Betclic', 'Autre site agréé, pour comparer', 'Tables NL2 disponibles aux heures où tu joues', 'https://www.betclic.fr'],
    ['PMU', 'Autre site agréé', 'Conditions concrètes et formats proposés', 'https://www.pmu.fr'],
  ];
  const RAKE = [['NL2', '0,01/0,02 €', '6 %', '0,25 €'], ['NL5', '0,02/0,05 €', '6 %', '0,70 €'], ['NL10', '0,05/0,10 €', '6 %', '1,25 €'], ['NL25', '0,10/0,25 €', '5,75 %', '2,85 €']];
  const PRE = ['Budget entièrement perdable défini', 'Plafonds de dépôt et de perte configurés chez l\'opérateur', 'Durée de session fixée', 'Aucun besoin de « se refaire »', 'Un objectif technique précis', 'SIGMA 52, solveurs et assistants fermés avant d\'ouvrir la room'];
  const POST = ['Heure de début et de fin notées', 'Limite, mains et résultat net dans le Journal', 'État mental consigné', 'Trois décisions à revoir ajoutées au carnet', 'Stop respecté en cas de limite atteinte ou de tilt', 'Une correction prévue pour la prochaine session'];
  function checklist(kind, items) {
    const d = D(), day = d[kind][today()] || [];
    return `<div style="display:grid;gap:6px">${items.map((t, i) => `<label class="check"><input type="checkbox" data-act="dbck" data-k="${kind}" data-i="${i}" ${day.includes(i) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div><p class="note">${day.length}/${items.length} aujourd'hui.</p>`;
  }
  function startHTML() {
    return `<section class="panel"><span class="eyebrow">Méthode · mesure · discipline</span><h2>Transformer une pratique occasionnelle en compétence documentée</h2>
      <p>Ce parcours sert à apprendre, à mesurer, puis à vérifier si un avantage net après rake existe vraiment, sans confondre progrès technique et promesse de revenu. Profil : règles connues, pratique occasionnelle. Format : hold'em No Limit 6-max, 100 bb. Horizon : 12 semaines.</p>
      <div class="grid3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        <div class="panel"><strong>1. Apprendre</strong><span class="note">Ranges préflop, cotes, valeur, bluffs, décisions postflop et revue. Exercices et mains annotées.</span></div>
        <div class="panel"><strong>2. Mesurer</strong><span class="note">Winrate net, heures, discipline, coûts. La variance est une incertitude statistique, pas un verdict.</span></div>
        <div class="panel"><strong>3. Protéger</strong><span class="note">Départ gratuit. Argent réel seulement avec un budget entièrement perdable. Aucune obligation de dépôt ni de montée.</span></div></div>
      <div class="advice"><div><strong>Les 48 premières heures.</strong> Jour 1 : lire le module Positions et noter les 6 positions. Jour 2 : 20 décisions d'ouverture en expliquant chacune ; pas d'argent réel. Le premier indicateur de succès est la qualité des explications, pas le gain.</div></div>
      <div class="row">${link('Jour 1 : module Positions', 'mod:positions')}${link('Jour 2 : 20 ouvertures expliquées', 'spots:rfi:explain')}</div>
      <p class="note"><strong>Doctrine :</strong> une bankroll « technique » de 50 caves n'est pas un budget disponible. Le budget de loisir et la limite de pertes priment toujours. Ce parcours n'est ni une promesse de profit ni une façon de financer des dépenses.</p></section>
    <section class="panel"><span class="eyebrow">Marché français</span><h2>Choisir une seule room agréée</h2>
      <p>Compare PokerStars.fr et Winamax sur la NL2 classique (rake effectif, historiques de mains, outils autorisés), puis n'en garde qu'une. Avant tout dépôt, vérifie que le site figure sur la ${ext('liste des opérateurs agréés de l\'ANJ', 'https://anj.fr/offre-de-jeu-et-marche/operateurs-agrees')}.</p>
      <div class="tw"><table class="t"><thead><tr><th>Room</th><th>Atout à examiner</th><th>À contrôler</th></tr></thead><tbody>${ROOMS.map(([n, a, c, u]) => `<tr><td>${ext(n, u)}</td><td>${esc(a)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table></div>
      <h3>PokerStars.fr : rake du No Limit classique (hors Zoom, tables de 6 joueurs ou plus)</h3>
      <div class="tw"><table class="t"><thead><tr><th>Limite</th><th>Blindes</th><th class="n">Rake</th><th class="n">Plafond</th></tr></thead><tbody>${RAKE.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n">${r[2]}</td><td class="n">${r[3]}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Relevé du 25/10/2026 (ton guide Poker Performance Lab) ; à revérifier sur le ${ext('barème officiel', 'https://www.pokerstars.fr/poker/room/rake/')}. Ce n'est pas un rake payé par joueur à chaque main. Le marché : 525 M€ de produit des jeux en 2025 (+6,5 %), 2,5 millions de comptes actifs (${ext('ANJ', 'https://anj.fr/sites/default/files/2026-04/Bilan%20%C3%A9conomique%202025.pdf')}) ; la croissance du marché ne prouve aucune rentabilité individuelle.</p></section>
    <section class="panel" style="border-color:var(--bad)"><span class="eyebrow">Règle de conformité</span><h2>Ferme SIGMA 52 avant d'ouvrir le logiciel d'une room</h2>
      <p>PokerStars interdit, <strong>dès que son logiciel est ouvert</strong>, les simulateurs range contre range, les programmes ICM et d'équilibre de Nash et les tableaux de référence au-delà des décisions de base (${ext('PokerNews, politique de 2019', 'https://www.pokernews.com/news/2019/02/pokerstars-bans-seating-scripts-restricts-hand-range-charts-33487.htm')}). GGPoker interdit les HUD tiers tant que son client tourne (${ext('DeucesCracked, 2026', 'https://www.deucescracked.com/blog/best-poker-hud-software-2026-pokerstars-vs-ggpoker-compliance')}). Toute aide en temps réel est interdite partout. Vérifie la ${ext('liste des outils de PokerStars', 'https://www.pokerstars.fr/poker/room/prohibited/')} et celle de ta room avant d'installer quoi que ce soit.</p></section>
    <div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
      <section class="panel"><span class="eyebrow">Avant une partie réelle</span>${checklist('pre', PRE)}</section>
      <section class="panel"><span class="eyebrow">Après une session</span>${checklist('post', POST)}${link('Ouvrir le Journal', 'tab:journal')}</section></div>`;
  }

  // ---------------- Programme de 12 semaines ----------------
  // auto : validation calculée depuis SIGMA 52 (null = case à cocher).
  const WEEKS = [
    { t: 'Positions et décisions d\'ouverture', s: 'Six positions, mains de départ, principe de position', go: [['Module Positions', 'mod:positions'], ['Module Préflop de base', 'mod:preflop'], ['Spots : ouverture', 'spots:rfi']],
      tasks: [['Étudier les positions UTG, HJ, CO, BTN, SB, BB', () => !!state.progress.read?.positions], ['Faire 50 décisions d\'ouverture commentées', () => stat('rfi').n >= 50], ['Écrire cinq erreurs préflop à éviter (notes de la semaine)', null]] },
    { t: 'Ouverture et discipline préflop', s: 'Ranges BTN, CO, UTG, plan avant de miser', go: [['Spots : ouverture', 'spots:rfi'], ['Atlas préflop', 'tool:atlas']],
      tasks: [['Faire 50 nouvelles décisions d\'ouverture', () => stat('rfi').n >= 100], ['Revoir les écarts avec la référence 6-max 100 bb', null], ['Atteindre 85 % sur 100 spots de référence', () => stat('rfi').n >= 100 && rate('rfi') >= 0.85]] },
    { t: 'Défense face aux relances', s: 'Call, 3-bet ou fold ; BB contre BTN et CO', go: [['Module Préflop complet', 'mod:preflop2'], ['Module Jouer les blindes', 'mod:blindes'], ['Spots : face à une ouverture', 'spots:vsopen']],
      tasks: [['Étudier la défense BB contre BTN', () => !!state.progress.read?.blindes], ['Revoir 15 spots de 3-bet', () => stat('vsopen').n >= 15], ['Résoudre 10 exercices de cotes du pot', () => stat('odds').n >= 10]] },
    { t: 'Équité, cotes, cotes implicites', s: 'Le socle mathématique', go: [['Module Les maths de base', 'mod:maths'], ['Spots : cotes du pot', 'spots:odds'], ['Maths utiles', 'sub:maths']],
      tasks: [['Résoudre 20 calculs de cotes (objectif 18/20)', () => stat('odds').n >= 20 && rate('odds') >= 0.9], ['Expliquer l\'équité réalisée et les cotes implicites', () => !!state.progress.read?.maths2], ['Revoir 10 situations de call difficiles', null]] },
    { t: 'Textures de flop', s: 'Boards secs ou dynamiques, avantage de range', go: [['Module Textures', 'mod:textures'], ['Outil Board', 'tool:board']],
      tasks: [['Classer 20 flops par texture', null], ['Expliquer l\'avantage de range sur 10 boards', () => !!state.progress.read?.textures], ['Revoir 5 décisions postflop dans le carnet', () => D().carnet.filter((c) => c.street !== 'Préflop').length >= 5]] },
    { t: 'Valeur et continuation bet', s: 'Pourquoi miser, pourquoi checker', go: [['Module Postflop', 'mod:postflop'], ['Solveur', 'tab:solveur']],
      tasks: [['Différencier valeur, bluff et protection', () => !!state.progress.read?.postflop], ['Étudier 10 spots de c-bet en position (Solveur ou bibliothèque)', () => (state.progress.solves || 0) >= 10], ['Revoir 10 spots avec une ligne alternative', null]] },
    { t: 'Turn : la deuxième rue', s: 'Cartes qui changent tout, plans sur plusieurs rues', go: [['Module Turn et river', 'mod:turnriver'], ['Solveur', 'tab:solveur']],
      tasks: [['Comparer 10 turns sur une même texture de flop', null], ['Définir un plan face à relance, call, fold', null], ['Revoir 5 gros pots, gagnés ou perdus', () => D().carnet.length >= 10]] },
    { t: 'River : valeur et bluff-catch', s: 'Répartir les mains moins bonnes et meilleures', go: [['Module Bluff-catching', 'mod:bluffcatch'], ['Entraîneur river', 'solver:train']],
      tasks: [['Analyser 10 mises river', () => (state.progress.trainer?.n || 0) >= 10], ['Analyser 10 calls river', () => (state.progress.trainer?.n || 0) >= 20], ['Repérer les bluffs sans cible crédible', null]] },
    { t: 'Lire les profils sans surinterpréter', s: 'Tendances, taille des échantillons', go: [['Module Lire les adversaires', 'mod:adversaires'], ['Analyse', 'tab:analyse']],
      tasks: [['Classer 15 mains par profil probable', null], ['Noter les preuves et la taille de l\'échantillon', null], ['Éviter 5 adaptations fondées sur trop peu de mains', null]] },
    { t: 'GTO et adaptations, hors session', s: 'Référence théorique contre hypothèses observées', go: [['Module Les solveurs', 'mod:solveurs'], ['Solveur (profils)', 'tab:solveur']],
      tasks: [['Comparer 10 décisions à un outil d\'étude autorisé', () => (state.progress.solves || 0) >= 20], ['Documenter 3 adaptations exploitantes justifiées', null], ['Lire la politique d\'outils de ta room', null]] },
    { t: 'Audit statistique et habitudes', s: 'Journal de session, taux d\'erreurs', go: [['Carnet : révisions', 'sub:carnet'], ['Journal', 'tab:journal']],
      tasks: [['Corriger 10 décisions anciennes sans voir la réponse', () => D().carnet.reduce((a, c) => a + (c.reviews || 0), 0) >= 10], ['Auditer temps, discipline et coûts', null], ['Classer les 3 erreurs prioritaires', null]] },
    { t: 'Examen et décision', s: 'Conclure sur la compétence, pas sur les gains', go: [['Bilan et test de sortie', 'sub:bilan']],
      tasks: [['Refaire le quiz préflop de 100 spots', null], ['Comparer les scores des semaines 1 et 12', () => !!D().base && !!D().exit.done], ['Rédiger le bilan : continuer, étudier ou arrêter', () => !!D().exit.decision]] },
  ];
  const done = (w, t) => { const f = WEEKS[w].tasks[t][1]; return (f && f()) || D().checks.includes(`${w}-${t}`); };
  const progressAll = () => { let n = 0; WEEKS.forEach((w, i) => w.tasks.forEach((_, j) => { if (done(i, j)) n++; })); return n; };
  function progHTML() {
    const n = progressAll();
    return `<section class="panel"><span class="eyebrow">Programme</span><h2>Douze semaines de technique mesurable</h2>
      <p>Un concept, une décision, une correction, une révision. Les compétences d'abord, sans objectif de gains. Cadence de référence par semaine : cours 2 h, pratique gratuite ou très encadrée 1 h 30, revue 1 h 30, exercices 1 h.</p>
      <div class="pbar" aria-label="Progression"><i style="width:${Math.round((n / 36) * 100)}%"></i></div><p class="note">${n}/36 tâches. Les tâches marquées « auto » se valident seules depuis tes exercices SIGMA 52.</p></section>
      ${WEEKS.map((w, i) => { const k = w.tasks.filter((_, j) => done(i, j)).length; return `<details class="panel"${k < 3 && WEEKS.slice(0, i).every((_, a) => WEEKS[a].tasks.every((__, b) => done(a, b))) ? ' open' : ''}><summary><strong>S${i + 1} · ${esc(w.t)}</strong> <span class="pill ${k === 3 ? 'good' : ''}">${k}/3</span></summary>
        <p class="note">${esc(w.s)}</p>
        <div style="display:grid;gap:6px">${w.tasks.map(([t, f], j) => { const auto = f && f(); return `<label class="check"><input type="checkbox" data-act="dbtask" data-v="${i}-${j}" ${done(i, j) ? 'checked' : ''} ${auto ? 'disabled' : ''}><span>${esc(t)}${f ? ` <span class="pill">${auto ? 'auto : fait' : 'auto'}</span>` : ''}</span></label>`; }).join('')}</div>
        <div class="row">${w.go.map(([l, v]) => link(l, v)).join('')}</div>
        <label class="f">Notes et erreurs à retravailler<textarea rows="2" data-dbnote="${i}" maxlength="1500">${esc(D().notes[i] || '')}</textarea></label></details>`; }).join('')}`;
  }

  // ---------------- Carnet de décisions ----------------
  const CATS = ['Range d\'ouverture', 'Défense préflop', '3-bet / 4-bet', 'C-bet / taille', 'Value bet', 'Bluff / semi-bluff', 'Call / cotes', 'Jeu à la river', 'Jeu hors de position', 'Autre'];
  const Q6 = [['situation', 'Situation', 'Positions, tapis effectifs, blindes, action et tailles exactes.'], ['ranges', 'Ranges de départ', 'Mains plausibles des deux joueurs avant la décision.'], ['objectif', 'Objectif', 'Valeur, bluff, contrôle du pot, réalisation d\'équité ou abandon.'], ['prix', 'Prix', 'Cotes du pot, équité, SPR, rake, mises futures.'], ['alternatives', 'Alternatives', 'Ce que donnent check, call, mise, fold et les autres tailles.'], ['correctif', 'Correctif', 'Une règle à tester sur 10 spots semblables.']];
  const retention = () => +state.settings.retention || 0.9;
  const carnetDue = () => D().carnet.filter((c) => (c.due || c.date) <= today()).sort((a, b) => (a.due || a.date).localeCompare(b.due || b.date));
  X.carnetDue = () => carnetDue().length;
  function carnetHTML() {
    const d = D(), due = carnetDue(), h = due[0];
    const flagged = d.carnet.filter((c) => c.flag === 'yes'), cats = {};
    for (const c of flagged) { const x = cats[c.category] || (cats[c.category] = { n: 0, w: 0 }); x.n++; x.w += +c.severity || 1; }
    const rows = Object.entries(cats).sort((a, b) => b[1].w - a[1].w), mx = Math.max(1, ...rows.map((r) => r[1].w));
    const review = h ? `<section class="panel" style="border-color:var(--accent)"><span class="eyebrow">Révision · ${due.length} main${due.length > 1 ? 's' : ''} à revoir</span>
        <p class="note">${esc(h.date)} · ${esc(h.pos)} · ${esc(h.street)} · ${esc(h.category)}</p><h3>Quelle décision retiendrais-tu, et pourquoi ?</h3><p style="white-space:pre-wrap">${esc(h.situation || '')}</p>
        ${revShow ? `<div class="advice"><div><strong>Correctif noté :</strong> ${esc(h.correctif || 'aucun')}</div>${h.prix ? `<div><strong>Prix :</strong> ${esc(h.prix)}</div>` : ''}${h.source ? `<div class="note">Source : ${esc(h.source)}</div>` : ''}</div>
          <div class="row"><button class="btn" data-act="dbrev" data-g="1">À retravailler</button><button class="btn" data-act="dbrev" data-g="3">Retrouvé</button><button class="btn primary" data-act="dbrev" data-g="4">Évident</button></div>`
        : '<div class="row"><button class="btn" data-act="dbshow">Afficher mon correctif</button></div>'}</section>` : `<p class="note">${d.carnet.length ? 'Aucune main à revoir aujourd\'hui : les prochaines révisions sont programmées (FSRS).' : 'Ajoute une main pour démarrer les révisions.'}</p>`;
    return `<section class="panel"><span class="eyebrow">Revue d'une main</span><h2>Analyser une décision, hors session</h2>
      <p class="note">La ligne de référence vient de ton étude après coup, jamais d'un conseil pendant le jeu. Pas de pseudo ni de donnée personnelle sur les autres joueurs.</p>
      ${cMsg ? `<div class="advice" role="status"><div class="good">${esc(cMsg)}</div></div>` : ''}
      <form id="dbform" class="form">
        <label class="f">Date<input type="date" name="date" value="${today()}" required></label>
        <label class="f">Position<select name="pos">${['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map((p) => `<option${p === 'BTN' ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
        <label class="f">Rue<select name="street">${['Préflop', 'Flop', 'Turn', 'River'].map((p) => `<option>${p}</option>`).join('')}</select></label>
        <label class="f">Catégorie<select name="category">${CATS.map((p) => `<option>${esc(p)}</option>`).join('')}</select></label>
        <label class="f">Diagnostic après analyse<select name="flag"><option value="yes">Erreur identifiée</option><option value="uncertain">Encore incertaine</option><option value="no">Décision justifiée</option></select></label>
        <label class="f">Gravité estimée<select name="severity"><option value="1">1 — faible</option><option value="2" selected>2 — modérée</option><option value="3">3 — forte</option></select></label>
        ${Q6.map(([k, l, ph]) => `<label class="f" style="grid-column:1/-1">${esc(l)}<textarea name="${k}" rows="2" maxlength="2000" placeholder="${esc(ph)}"${k === 'situation' ? ' required' : ''}></textarea></label>`).join('')}
        <label class="f" style="grid-column:1/-1">Source et degré de certitude<input name="source" maxlength="400" placeholder="Cours, solveur hors session, coach, hypothèse personnelle…"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary" type="submit">Enregistrer et programmer la révision</button></div></form></section>
      ${review}
      <section class="panel"><span class="eyebrow">Diagnostic</span><h2>Où mettre tes prochaines heures d'étude</h2>
        ${rows.length ? rows.map(([c, v]) => `<div class="typerow"><span>${esc(c)}</span><div class="meter"><i style="width:${(100 * v.w) / mx}%"></i></div><span class="mono">${v.n} × · ${v.w}</span></div>`).join('') : '<p class="note">Les erreurs classées par thème apparaîtront ici.</p>'}
        <p class="note">Priorité = somme des gravités que tu as déclarées sur les mains marquées « erreur ». Un ordre d'étude subjectif, pas une perte d'EV : pour l'EV chiffrée, retravaille la main au Solveur ou dans la Revue EV. ${d.carnet.length && d.carnet.length < 30 ? 'Moins de 30 mains : repère des thèmes, pas des fréquences.' : ''}</p></section>
      <section class="panel"><span class="eyebrow">Historique</span>${d.carnet.length ? `<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Position</th><th>Rue</th><th>Catégorie</th><th>Diagnostic</th><th>Révision</th><th></th></tr></thead><tbody>${d.carnet.slice().reverse().map((c) => `<tr><td class="mono">${esc(c.date)}</td><td>${esc(c.pos)}</td><td>${esc(c.street)}</td><td>${esc(c.category)}</td><td><span class="pill ${c.flag === 'yes' ? 'bad' : c.flag === 'no' ? 'good' : ''}">${c.flag === 'yes' ? 'Erreur' : c.flag === 'no' ? 'Justifiée' : 'Incertaine'}</span></td><td class="mono">${esc(c.due || '')}</td><td><button class="btn small" data-act="dbdel" data-id="${esc(c.id)}">Supprimer</button></td></tr>`).join('')}</tbody></table></div>
        <div class="row"><button class="btn small" data-act="dbcsv">Exporter le carnet (CSV)</button></div>` : '<p class="note">Aucune main pour le moment.</p>'}</section>`;
  }
  function addCarnet(c) {
    const now = Date.now(), f = FS.init(c.flag === 'yes' ? 1 : c.flag === 'uncertain' ? 2 : 3, now);
    const e = { id: 'c' + now.toString(36) + Math.floor(Math.random() * 1e4), reviews: 0, f, due: X.addDays ? X.addDays(1) : today(), ...c };
    D().carnet.push(e); return e;
  }
  document.addEventListener('submit', (ev) => {
    if (ev.target.id !== 'dbform') return;
    ev.preventDefault();
    const f = new FormData(ev.target), g = (k) => String(f.get(k) || '').trim();
    if (g('situation').length < 10) { cMsg = 'Décris la situation plus précisément.'; return render(); }
    addCarnet({ date: g('date') || today(), pos: g('pos'), street: g('street'), category: g('category'), flag: g('flag'), severity: +g('severity') || 2, ...Object.fromEntries(Q6.map(([k]) => [k, g(k).slice(0, 2000)])), source: g('source').slice(0, 400) });
    save(); cMsg = 'Main enregistrée : première révision demain.'; render();
  });
  ACT.dbshow = () => { revShow = true; render(); };
  ACT.dbrev = (t) => {
    const h = carnetDue()[0]; if (!h) return;
    const g = +t.dataset.g, now = Date.now(), c = h.f || FS.init(3, now - 864e5);
    h.f = FS.review(c, g, now); h.reviews = (h.reviews || 0) + 1; h.last = today();
    h.due = new Date(FS.dueAt(h.f, retention())).toISOString().slice(0, 10);
    X.logDay?.('rev', { ok: g >= 3 });
    revShow = false; save(); render();
  };
  ACT.dbdel = (t) => { const d = D(); d.carnet = d.carnet.filter((c) => c.id !== t.dataset.id); save(); render(); };
  async function saveFile(filename, data, type) {
    try { const dl = window.claude?.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename, data }); return; } } catch (e) { if (e && e.code === 'declined') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = filename; a.click();
  }
  const csvCell = (x) => { let v = String(x ?? ''); if (/^\s*[+=@-]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  ACT.dbcsv = () => { const cols = ['date', 'pos', 'street', 'category', 'flag', 'severity', ...Q6.map(([k]) => k), 'source', 'due', 'reviews']; saveFile(`carnet-decisions-${today()}.csv`, '﻿' + [cols.join(';'), ...D().carnet.map((c) => cols.map((k) => csvCell(c[k])).join(';'))].join('\r\n'), 'text/csv'); };

  // ---------------- Capital et garde-fous ----------------
  const LIMITS = ['NL2', 'NL5', 'NL10', 'NL20', 'NL25', 'NL50', 'NL100', 'NL200'];
  const caveOf = (st) => (+String(st).replace(/\D/g, '') || 2);
  function capitalHTML() {
    const r = D().risk, js = X.journalStats(), net = js.total, need = r.caves * caveOf(r.stake);
    let st, cls;
    if (!(r.budget > 0)) { st = 'Aucun budget déclaré : formation gratuite uniquement. Les chiffres ci-dessous sont informatifs.'; cls = 'warn'; }
    else if (!(r.limit > 0)) { st = 'Plafond de perte à 0 € : aucun jeu en argent réel.'; cls = 'warn'; }
    else if (r.limit > r.budget) { st = 'Le plafond de perte dépasse le budget : à corriger avant toute partie réelle.'; cls = 'bad'; }
    else if (net <= -r.limit) { st = `STOP : les pertes du Journal (${eur(net)}) atteignent le plafond de l'expérience. Suspendre les parties réelles.`; cls = 'bad'; }
    else if (r.budget < need) { st = `Le budget ne couvre pas ${r.caves} caves de ${r.stake} (${eur(need)}). Ne pas redéposer pour compenser : rester à une limite plus basse ou en jeu gratuit.`; cls = 'warn'; }
    else { st = 'Ratio théorique couvert. Cela ne valide ni la compétence, ni le fait de pouvoir perdre cette somme. Aucune montée de limite automatique.'; cls = 'good'; }
    const num = (k, l, v, ph) => `<label class="f">${l}<input data-dbrisk="${k}" inputmode="decimal" value="${esc(v)}" placeholder="${ph}"></label>`;
    return `<section class="panel"><span class="eyebrow">Capital et protection</span><h2>Bankroll : une simulation, pas une autorisation de jouer</h2>
      <p>Une cave vaut ici 100 grosses blindes (NL2 = 2 €). Les 50 caves sont un ratio d'illustration, pas une garantie contre la ruine. Ce capital ne doit jamais être atteint en redéposant pour récupérer des pertes.</p>
      <div class="form">${num('budget', 'Budget de loisir réellement perdable (€)', r.budget || '', '100')}${num('limit', 'Plafond de perte de l\'expérience (€)', r.limit || '', '20')}
        <label class="f">Caves de référence<select data-dbrisk="caves">${[[30, '30 — standard, moins protecteur'], [50, '50 — prudent en cash game'], [75, '75 — très prudent'], [100, '100 — très prudent']].map(([v, l]) => `<option value="${v}"${+r.caves === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="f">Limite visée<select data-dbrisk="stake">${LIMITS.map((l) => `<option${r.stake === l ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        ${num('time', 'Jeu réel maximum par semaine (heures)', r.time, '1,5')}</div>
      <div class="stats"><div class="stat"><span>Capital requis</span><b>${eur(need)}</b><span>${r.caves} caves de ${r.stake}</span></div><div class="stat"><span>Solde d'arrêt</span><b>${r.budget > 0 ? eur(Math.max(0, r.budget - r.limit)) : '—'}</b><span>budget − plafond</span></div><div class="stat"><span>Résultat du Journal</span><b style="color:var(${net >= 0 ? '--good' : '--bad'})">${eur(net)}</b><span>${js.ss.length} sessions</span></div></div>
      <div class="advice" role="status"><div class="${cls}">${esc(st)}</div></div>
      <p class="note">Ce module signale un dépassement mais ne bloque aucun dépôt : fixe les vrais plafonds chez l'opérateur (${ext('limites de jeu, ANJ', 'https://anj.fr/foire-aux-questions/gestion-du-compte-joueur/quest-ce-que-les-limites-de-jeux-dargent-comment-les')}). Le Journal n'est pas un relevé bancaire : les données de la room font foi.</p></section>
    <section class="panel"><span class="eyebrow">Garde-fous recommandés</span><ul>
      <li><strong>Départ :</strong> 0 € en jeu réel pendant les fondamentaux (semaines 1 à 4).</li>
      <li><strong>Hypothèse de travail :</strong> si et seulement si 100 € sont entièrement perdables, limiter l'expérience à 20 € de perte, deux caves par session, 1 h 30 de jeu réel par semaine.</li>
      <li><strong>Rechargements :</strong> aucun pendant les 12 semaines ; si le budget ne suffit plus, on revient au jeu gratuit.</li>
      <li><strong>Montée de limite :</strong> interdite pendant ce premier cycle ; un ratio de caves ne suffit pas.</li>
      <li><strong>Arrêt immédiat</strong> en cas de plafond atteint, de fatigue, de tilt ou d'envie de se refaire.</li></ul></section>
    <section class="panel"><span class="eyebrow">Référentiel</span><div class="tw"><table class="t"><thead><tr><th>Limite</th><th class="n">Cave (100 bb)</th><th class="n">50 caves</th><th class="n">Seuil de repli (40 caves)</th></tr></thead><tbody>${LIMITS.map((l) => { const c = caveOf(l); return `<tr><td>${l}</td><td class="n">${eur(c)}</td><td class="n">${eur(50 * c)}</td><td class="n">${eur(40 * c)}</td></tr>`; }).join('')}</tbody></table></div>
      <h3>Ne pas mélanger les formats</h3><div class="tw"><table class="t"><thead><tr><th>Format</th><th>Ratio prudent</th><th>Pourquoi</th></tr></thead><tbody>
        <tr><td>Cash game</td><td>50 caves</td><td>Blindes fixes, sorties libres</td></tr><tr><td>Sit&Go classique</td><td>75 à 100 inscriptions</td><td>Places payées, tapis qui changent</td></tr>
        <tr><td>Tournoi, petit field</td><td>100 à 150 inscriptions</td><td>Gains plus inégaux</td></tr><tr><td>Tournoi, grand field</td><td>150 à 300 inscriptions</td><td>Très forte variance, longue durée</td></tr>
        <tr><td>Spin / Expresso</td><td>150 à 300 inscriptions et plus</td><td>Gains très dispersés (multiplicateurs)</td></tr></tbody></table></div>
      <p class="note">Heuristiques d'étude sans garantie, très sensibles au format, au field, à la structure, au rake et au niveau réel. Pour les Expresso, voir aussi le simulateur de variance du Simulateur.</p></section>`;
  }

  // ---------------- Maths utiles ----------------
  function mathsHTML() {
    const m = D().math, odds = m.bet > 0 ? (100 * m.bet) / (m.pot + 2 * m.bet) : 0, ci = (1.96 * m.sd) / Math.sqrt(Math.max(1, m.hands) / 100);
    const inp = (k, l, v) => `<label class="f">${l}<input data-dbmath="${k}" inputmode="decimal" value="${esc(v)}"></label>`;
    return `<section class="panel"><span class="eyebrow">Cotes du pot</span><h2>Équité nécessaire = call ÷ (pot avant la mise + mise + call)</h2>
      <div class="form">${inp('pot', 'Pot avant la mise (€)', m.pot)}${inp('bet', 'Mise à payer (€)', m.bet)}${inp('eq', 'Ton équité estimée (%)', m.eq)}</div>
      <p><strong>Équité minimale : ${fr(odds, 1)} %.</strong> ${m.eq >= odds ? 'Ton équité dépasse le seuil direct.' : 'Ton équité est sous le seuil direct.'} <span class="note">Exemple terminal, hors rake et sans mises futures ; cotes implicites et équité réalisée peuvent changer la décision.</span></p></section>
    <section class="panel"><span class="eyebrow">Résultat et incertitude</span><h2>bb/100 = (gain net ÷ valeur d'une bb) × 100 ÷ mains</h2>
      <p class="note">Sépare les résultats par limite et par format : 3 bb/100 en NL2 ne s'additionnent pas avec 3 bb/100 en NL10. Rendement horaire réel = (résultat net − coûts d'étude et logiciels) ÷ (heures jouées + heures d'étude).</p>
      <div class="form">${inp('wr', 'Winrate observé (bb/100)', m.wr)}${inp('hands', 'Nombre de mains', m.hands)}${inp('sd', 'Écart-type supposé (bb/100)', m.sd)}</div>
      <p><strong>Intervalle à 95 % : [${fr(m.wr - ci, 1)} ; ${fr(m.wr + ci, 1)}] bb/100.</strong> ${m.wr - ci <= 0 ? 'Il contient 0 : le résultat ne prouve pas un avantage.' : 'Il exclut 0 dans ce modèle simplifié.'}</p>
      <div class="tw"><table class="t"><thead><tr><th>Mains</th>${[5000, 20000, 50000, 100000, 150000, 250000].map((n) => `<th class="n">${(n / 1000).toLocaleString('fr-FR')} k</th>`).join('')}</tr></thead><tbody><tr><td>Marge ± (bb/100)</td>${[5000, 20000, 50000, 100000, 150000, 250000].map((n) => `<td class="n">${fr((1.96 * m.sd) / Math.sqrt(n / 100), 1)}</td>`).join('')}</tr></tbody></table></div>
      <p class="note">Marge = 1,96 × écart-type ÷ √(mains ÷ 100), à variance fixe. On ne peut en déduire ni une probabilité de devenir pro, ni un nombre de mains garantissant un winrate positif.</p></section>
    <section class="panel"><span class="eyebrow">Raisonnement économique</span><h2>Ce que rapporterait un +5 bb/100 (exemple fictif)</h2>
      <div class="tw"><table class="t"><thead><tr><th>Limite</th><th class="n">Gain horaire à 75 mains/h</th><th class="n">À 300 mains/h (4 tables)</th></tr></thead><tbody>${['NL2', 'NL5', 'NL10', 'NL25', 'NL50'].map((l) => { const bb = caveOf(l) / 100; return `<tr><td>${l}</td><td class="n">${fr(0.05 * 75 * bb, 3)} €/h</td><td class="n">${fr(0.05 * 300 * bb, 2)} €/h</td></tr>`; }).join('')}</tbody></table></div>
      <p class="note">(5 bb ÷ 100 mains) × mains par heure × valeur de la bb. Suppose un avantage réel après rake, non démontré ; avant coûts, variance, fiscalité et valeur de ton temps. Rester plusieurs mois en NL2 peut être un choix d'apprentissage rationnel, pas un moyen de gagner un revenu : le projet doit être réduit ou arrêté si sa valeur pédagogique et personnelle ne justifie plus le temps passé.</p></section>
    <section class="panel"><span class="eyebrow">Trois réflexes de base</span>${quizHTML()}</section>`;
  }
  const QUIZ = [
    ['Au bouton, Q♠ J♠, 100 bb, tout le monde s\'est couché. Action de référence ?', ['Se coucher', 'Relancer', 'Limper'], 1, 'QJs fait partie des ranges d\'ouverture 6-max 100 bb au bouton.'],
    ['Pot de 12 €, l\'adversaire mise 6 €. Quelle équité directe faut-il pour payer ?', ['25 %', '33,3 %', '50 %'], 0, 'Tu paies 6 € pour un pot final de 24 € : 6 ÷ 24 = 25 %.'],
    ['Une carte à venir, 9 outs sur 46 (≈ 19,6 %). Call de 5 € pour un pot final de 20 €, aucune mise future. Conclusion ?', ['Call rentable', 'Call non justifié par les cotes directes', 'Toujours relancer'], 1, '19,6 % < 25 % requis : fold, sauf valeur future ou autre façon de gagner.'],
  ];
  let qa = [null, null, null], qShow = false;
  const quizHTML = () => `${QUIZ.map(([q, o, a, why], i) => `<div style="display:grid;gap:6px"><strong>${i + 1}. ${esc(q)}</strong><div class="row">${o.map((x, k) => `<button class="chip" data-act="dbq" data-i="${i}" data-k="${k}" aria-pressed="${qa[i] === k}">${esc(x)}</button>`).join('')}</div>${qShow ? `<div class="advice"><div class="${qa[i] === a ? 'good' : 'bad'}">${qa[i] === a ? 'Juste.' : 'Faux.'} ${esc(why)}</div></div>` : ''}</div>`).join('')}
    <div class="row"><button class="btn primary" data-act="dbqok" ${qa.includes(null) ? 'disabled' : ''}>Corriger</button>${qShow ? `<span class="note">Score : ${qa.filter((x, i) => x === QUIZ[i][2]).length}/3. Pour t'entraîner vraiment : ${link('Spots : ouverture', 'spots:rfi')} ${link('Spots : cotes', 'spots:odds')}</span>` : ''}</div>`;
  ACT.dbq = (t) => { qa[+t.dataset.i] = +t.dataset.k; qShow = false; render(); };
  ACT.dbqok = () => { qShow = true; D().quiz = { date: today(), score: qa.filter((x, i) => x === QUIZ[i][2]).length }; save(); render(); };

  // ---------------- Bilan et test de sortie ----------------
  function scores() {
    const d = D(), last10 = d.carnet.slice(-10), complete = last10.filter((c) => Q6.every(([k]) => String(c[k] || '').trim().length >= 3)).length;
    const ss = state.journal.sessions, conf = ss.filter((s) => { const bi = X.bbOf(s.stake) ? X.bbOf(s.stake) * 100 : 0; return (s.tilt || 0) < 2 && (!bi || s.result > -2 * bi); });
    return { rfi: rate('rfi'), rfiN: stat('rfi').n, odds: rate('odds'), oddsN: stat('odds').n, reviews: d.carnet.length ? complete : null, disc: ss.length ? conf.length / ss.length : null, sN: ss.length };
  }
  function bilanHTML() {
    const d = D(), s = scores(), b = d.base;
    const row = (l, v, thr, txt, fmtV, baseV) => { const okv = v !== null && v >= thr; return `<tr><td>${l}</td><td class="n">${v === null ? '—' : fmtV(v)}</td><td class="n">${fmtV(thr)}</td><td>${v === null ? '<span class="pill">pas de données</span>' : `<span class="pill ${okv ? 'good' : 'bad'}">${okv ? 'atteint' : 'pas encore'}</span>`}</td><td class="note">${txt}${baseV !== undefined && baseV !== null ? ` · semaine 1 : ${fmtV(baseV)}` : ''}</td></tr>`; };
    const P = (x) => pct(x, 0), N = (x) => `${x}/10`;
    const steps = [['Refaire 100 spots d\'ouverture et 20 exercices de cotes', s.rfiN >= 100 && s.oddsN >= 20], ['Annoter 30 mains difficiles sans regarder le résultat d\'abord', d.carnet.length >= 30], ['Analyser la discipline et la stabilité émotionnelle (Mental, check-in)', (state.mental?.checkins || []).length >= 5], ['Chiffrer le coût total du cycle (heures, logiciels), sans surinterpréter les gains', !!d.exit.cost], ['Décider : continuer l\'étude, rester au niveau, ou arrêter', !!d.exit.decision]];
    return `<section class="panel"><span class="eyebrow">Tableau de bord</span><h2>Évaluer sans surinterpréter</h2>
      <p class="note">Technique : des scores élevés sont des indicateurs d'apprentissage, pas des preuves de rentabilité. Finances : résultats nets après rake et coûts, séparés par limite. Discipline : un plafond dépassé ou une envie persistante de se refaire impose l'arrêt du jeu réel, même avec un bon bilan technique.</p>
      <div class="tw"><table class="t"><thead><tr><th>Axe</th><th class="n">Ton score</th><th class="n">Seuil</th><th></th><th>Calcul</th></tr></thead><tbody>
        ${row('Ouvertures (RFI)', s.rfi, 0.85, `spots « ouverture » (${s.rfiN})`, P, b?.rfi)}
        ${row('Cotes du pot', s.odds, 0.9, `spots « cotes » (${s.oddsN})`, P, b?.odds)}
        ${row('Revues structurées', s.reviews, 8, '10 dernières mains du carnet avec les 6 questions remplies', N, b?.reviews)}
        ${row('Discipline', s.disc, 1, `sessions du Journal sans tilt net et sans perte de plus de 2 caves (${s.sN})`, P, b?.disc)}
      </tbody></table></div>
      <div class="row">${b ? `<span class="note">Point de départ enregistré le ${esc(b.date)}.</span>` : '<button class="btn small" data-act="dbbase">Enregistrer mon point de départ (semaine 1)</button>'}</div>
      <p class="note"><strong>Pas de montée automatique en NL5 :</strong> capital, technique et risque se vérifient séparément, sur une période bien plus longue.</p></section>
    <section class="panel"><span class="eyebrow">Test de sortie à 12 semaines</span><ol>${steps.map(([t, ok]) => `<li>${esc(t)} ${ok ? '<span class="pill good">fait</span>' : ''}</li>`).join('')}</ol>
      <label class="f">Coût total du cycle (heures d'étude, logiciels, pertes)<input data-dbexit="cost" value="${esc(d.exit.cost || '')}" placeholder="ex. 70 h d'étude, 0 € de logiciels, −12 € joués"></label>
      <div class="row"><span class="note">Décision :</span>${[['continuer', 'Continuer l\'étude'], ['rester', 'Rester au niveau'], ['arreter', 'Arrêter']].map(([k, l]) => `<button class="chip" data-act="dbdec" data-v="${k}" aria-pressed="${d.exit.decision === k}">${l}</button>`).join('')}</div>
      ${d.exit.decision ? `<p class="note">Décision enregistrée le ${esc(d.exit.date || '')}.</p>` : ''}</section>`;
  }
  ACT.dbbase = () => { const s = scores(); D().base = { date: today(), rfi: s.rfi, odds: s.odds, reviews: s.reviews, disc: s.disc }; save(); render(); };
  ACT.dbdec = (t) => { const d = D(); d.exit.decision = t.dataset.v; d.exit.date = today(); d.exit.done = true; save(); render(); };

  // ---------------- Ressources et import ----------------
  const LINKS = [
    ['Régulation', 'ANJ — opérateurs agréés', 'https://anj.fr/offre-de-jeu-et-marche/operateurs-agrees'], ['Protection', 'ANJ — limites de jeu', 'https://anj.fr/foire-aux-questions/gestion-du-compte-joueur/quest-ce-que-les-limites-de-jeux-dargent-comment-les'],
    ['Marché', 'ANJ — bilan 2025', 'https://anj.fr/bilan-2025-du-marche-des-jeux-dargent'], ['Marché', 'ANJ — premier semestre 2026', 'https://anj.fr/bilan-du-marche-des-jeux-dargent-au-1er-semestre-2026'],
    ['Tarifs', 'PokerStars.fr — rake officiel', 'https://www.pokerstars.fr/poker/room/rake/'], ['Conformité', 'PokerStars.fr — outils interdits', 'https://www.pokerstars.fr/poker/room/prohibited/'],
    ['Historiques', 'PokerStars.fr — enregistrer ses historiques', 'https://www.pokerstars.fr/help/articles/save-hand-histories/'], ['Formation', 'PokerStars Learn — cours cash game', 'https://www.pokerstars.fr/poker/learn/course/cash-games-course/'],
    ['Formation', 'Kill Tilt — les bases du poker', 'https://www.killtilt.fr/les-bases-du-poker/'], ['Formation', 'Upswing Poker — ressources gratuites', 'https://upswingpoker.com/free-resources/'],
    ['Analyse', 'GTO Wizard', 'https://gtowizard.com/'], ['Suivi', 'PokerTracker', 'https://www.pokertracker.com/'],
    ['Fiscalité', 'Conseil d\'État, 21 juin 2018 — poker et BNC', 'https://www.conseil-etat.fr/fr/arianeweb/CE/analyse/2018-06-21/412124'],
    ['Prévention', 'Joueurs Info Service', 'https://www.joueurs-info-service.fr/'], ['Prévention', 'EVALUJEU', 'https://www.evalujeu.fr/'],
  ];
  function resHTML() {
    return `<section class="panel"><span class="eyebrow">Bibliothèque</span><h2>Liens directs</h2><p class="note">Les offres, les politiques d'outils et les barèmes changent : vérifie la date de chaque page.</p>
      <div class="tw"><table class="t"><tbody>${LINKS.map(([k, l, u]) => `<tr><td class="note">${esc(k)}</td><td>${ext(l, u)}</td></tr>`).join('')}</tbody></table></div>
      <div class="row">${link('Lexique (100 termes)', 'tab:cours')}${link('Module Jeu responsable', 'mod:responsable')}${link('Module Le cadre : légal, interdit, fiscal', 'mod:cadre')}</div>
      <div class="row"><button class="btn" data-act="offline">Télécharger SIGMA 52 pour le hors-ligne</button></div><p class="note" id="offmsg"></p></section>
    <section class="panel" style="border-color:var(--bad)"><span class="eyebrow">Santé et protection</span><p>Le poker comporte un risque de pertes et d'addiction. En cas de difficulté : ${ext('Joueurs Info Service', 'https://www.joueurs-info-service.fr/')} ou ${ext('EVALUJEU', 'https://www.evalujeu.fr/')}. Jeu réservé aux majeurs. Une pratique professionnelle éventuelle peut relever des BNC sous conditions (Conseil d'État, 21 juin 2018).</p></section>
    <section class="panel"><span class="eyebrow">Import</span><h2>Reprendre tes données du Performance Lab et du Decision Lab</h2>
      <p class="note">Sauvegardes JSON de tes deux applications : les sessions vont dans le Journal (les parties en argent fictif sont ignorées), les cases cochées et notes du programme de 12 semaines sont reprises, les mains du Decision Lab entrent dans le carnet avec leur révision. Rien n'est envoyé ailleurs que dans ta sauvegarde SIGMA 52.</p>
      <label class="btn">Importer un fichier JSON<input type="file" id="dbimport" accept=".json,application/json" style="display:none"></label>
      ${impMsg ? `<div class="advice" role="status"><div class="${/illisible|aucune/i.test(impMsg) ? 'bad' : 'good'}">${esc(impMsg)}</div></div>` : ''}</section>`;
  }
  function importLab(json) {
    const d = D(); let s = 0, c = 0, h = 0;
    if (Array.isArray(json.sessions)) {
      const have = new Set(state.journal.sessions.map((x) => x.date + '|' + x.result + '|' + x.hands));
      for (const x of json.sessions) {
        if (!x || x.format === 'play' || !Number.isFinite(+x.net)) continue;
        const ses = { id: 's' + Date.now().toString(36) + (s + c), date: String(x.date || today()).slice(0, 10), room: x.room === 'PokerStars' ? 'PokerStars.fr' : ['Winamax', 'Betclic', 'PMU'].includes(x.room) ? x.room : 'Autre', format: x.format === 'cash' ? 'Cash' : x.format === 'mtt' ? 'MTT' : x.format === 'spin' ? 'Expresso' : 'Cash', stake: x.format === 'cash' && +x.stake > 0 ? 'NL' + Math.round(+x.stake) : String(x.stake || ''), result: +x.net, hands: +x.hands || 0, minutes: +x.minutes || 0, tilt: x.mental === 'tilt' ? 2 : 0, trigger: '', notes: String(x.note || '').slice(0, 200) };
        const k = ses.date + '|' + ses.result + '|' + ses.hands; if (have.has(k)) continue; have.add(k);
        state.journal.sessions.push(ses); s++;
      }
      Store.save('journal');
    }
    if (Array.isArray(json.checks)) { for (const k of json.checks) if (/^\d+-\d$/.test(k) && !d.checks.includes(k)) { d.checks.push(k); c++; } }
    if (json.notes && typeof json.notes === 'object') for (const [k, v] of Object.entries(json.notes)) if (/^\d+$/.test(k) && v && !d.notes[k]) d.notes[k] = String(v).slice(0, 1500);
    if (Array.isArray(json.hands)) {
      const have = new Set(d.carnet.map((x) => x.imported).filter(Boolean));
      for (const x of json.hands) {
        if (!x || !x.context || have.has(x.id)) continue;
        const e = addCarnet({ imported: x.id, date: String(x.date || today()).slice(0, 10), pos: x.pos || 'BTN', street: x.street || 'Préflop', category: x.category || 'Autre', flag: ['yes', 'no', 'uncertain'].includes(x.flag) ? x.flag : 'uncertain', severity: +x.severity || 2, situation: String(x.context).slice(0, 2000), correctif: String(x.lesson || '').slice(0, 2000), source: String(x.evidence || '').slice(0, 400) });
        e.due = String(x.due || today()).slice(0, 10); e.reviews = +x.reviews || 0; h++;
      }
    }
    if (json.risk && typeof json.risk === 'object') { const r = d.risk; if (+json.risk.budget > 0 && !(r.budget > 0)) r.budget = +json.risk.budget; if (+json.risk.limit > 0 && !(r.limit > 0)) r.limit = +json.risk.limit; }
    if (+json.budget > 0 && !(d.risk.budget > 0)) d.risk.budget = +json.budget;
    if (+json.maxLoss > 0 && !(d.risk.limit > 0)) d.risk.limit = +json.maxLoss;
    save();
    if (!s && !c && !h && !Array.isArray(json.sessions) && !Array.isArray(json.hands)) return 'Aucune donnée reconnue dans ce fichier (attendu : sauvegarde JSON du Performance Lab ou du Decision Lab).';
    return `${s} session${s > 1 ? 's' : ''} ajoutée${s > 1 ? 's' : ''} au Journal, ${c} tâche${c > 1 ? 's' : ''} du programme, ${h} main${h > 1 ? 's' : ''} au carnet.`;
  }
  X.importLab = importLab;
  ONCHANGE.push((t) => {
    if (t.id === 'dbimport' && t.files?.length) { t.files[0].text().then((txt) => { try { impMsg = importLab(JSON.parse(txt)); } catch (e) { impMsg = 'Fichier illisible : ' + e.message; } render(); }); return true; }
    if (t.dataset.dbrisk) { const r = D().risk, k = t.dataset.dbrisk; r[k] = k === 'stake' ? t.value : Math.max(0, +String(t.value).replace(',', '.') || 0); save(); render(); return true; }
    if (t.dataset.dbmath) { D().math[t.dataset.dbmath] = +String(t.value).replace(',', '.') || 0; save(); render(); return true; }
    if (t.dataset.dbexit) { D().exit[t.dataset.dbexit] = t.value.slice(0, 300); save(); render(); return true; }
  });
  ONINPUT.push((t) => { if (t.dataset.dbnote !== undefined) { D().notes[t.dataset.dbnote] = t.value.slice(0, 1500); save(); return true; } });
  ACT.dbtask = (t) => { const d = D(), k = t.dataset.v; d.checks = d.checks.includes(k) ? d.checks.filter((x) => x !== k) : [...d.checks, k]; save(); render(); };
  ACT.dbck = (t) => { const d = D(), day = d[t.dataset.k][today()] || (d[t.dataset.k][today()] = []), i = +t.dataset.i; d[t.dataset.k][today()] = day.includes(i) ? day.filter((x) => x !== i) : [...day, i]; save(); render(); };
  ACT.dbsub = (t) => { sub = t.dataset.v; cMsg = ''; render(); };
  ACT.dbgo = (t) => {
    const [kind, a, b] = t.dataset.v.split(':');
    if (kind === 'sub') { sub = a; return render(); }
    if (kind === 'mod') { X.setOpenMod(a); return go('cours'); }
    if (kind === 'spots') { if (b === 'explain') { const tr = state.settings.train || (state.settings.train = { conf: false, timer: 0, explain: false }); tr.explain = true; Store.save('settings'); } X.setSpotMode(a); return go('spots'); }
    if (kind === 'tool') { X.setTool(a); return go('outils'); }
    if (kind === 'solver') { go('solveur'); return; }
    go(a);
  };
  VIEWS.debuter = () => {
    const due = carnetDue().length;
    return head('Débuter', 'La feuille de route du débutant : 12 semaines pour apprendre, mesurer et se protéger, avec un carnet de décisions et des garde-fous calculés sur ton Journal.') +
      `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${sub === k}" data-act="dbsub" data-v="${k}">${l}${k === 'carnet' && due ? ` (${due})` : ''}${k === 'prog' ? ` (${progressAll()}/36)` : ''}</button>`).join('')}</div>` +
      (sub === 'start' ? startHTML() : sub === 'prog' ? progHTML() : sub === 'carnet' ? carnetHTML() : sub === 'capital' ? capitalHTML() : sub === 'maths' ? mathsHTML() : sub === 'bilan' ? bilanHTML() : resHTML());
  };
  // Aujourd'hui : rappel des mains du carnet à revoir et de la semaine en cours.
  const baseJour = VIEWS.jour;
  VIEWS.jour = () => {
    const h = baseJour(), due = carnetDue().length, n = progressAll();
    const fresh = Object.values(state.progress.stats || {}).reduce((a, x) => a + (x.n || 0), 0) < 300;
    if (!due && (n >= 36 || (n === 0 && !fresh))) return h;
    const wk = WEEKS.findIndex((_, i) => WEEKS[i].tasks.some((__, j) => !done(i, j)));
    const card = `<section class="panel"><span class="eyebrow">Débuter</span><div class="row" style="justify-content:space-between"><span>${n ? `Semaine ${wk + 1} du programme débutant : ${esc(WEEKS[wk].t)} (${n}/36 tâches).` : 'Nouveau au poker ? Le programme débutant de 12 semaines commence par 48 heures sans argent réel.'}${due ? ` ${due} main${due > 1 ? 's' : ''} du carnet à revoir.` : ''}</span><span class="row">${due ? '<button class="btn small" data-act="dbgo" data-v="sub:carnet:x" data-tab="debuter">Revoir</button>' : ''}<button class="btn small" data-act="dbopen">Ouvrir</button></span></div></section>`;
    const i = h.indexOf('<section'); return i >= 0 ? h.slice(0, i) + card + h.slice(i) : h + card;
  };
  ACT.dbopen = () => go('debuter');
  const prevGo = ACT.dbgo;
  ACT.dbgo = (t) => { if (t.dataset.tab === 'debuter') { sub = 'carnet'; return go('debuter'); } return prevGo(t); };
})();
