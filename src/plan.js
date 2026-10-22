// Programme de 17 semaines : de débutant à joueur complet, jusqu'aux techniques Élite, au live et au métier. Chaque tâche se coche toute seule à partir de ta progression.
// Types de tâches : mod (module maîtrisé au quiz), spot (maîtrise sur les 30 dernières réponses), guided (main guidée réussie),
// table (mains jouées au simulateur), expresso (parties jouées), journal (sessions saisies), bankroll (bankroll renseignée), import (historique analysé),
// solver (spots résolus au solveur), trainer (décisions river notées par l'entraîneur solveur).
(function (root) {
  const W = [
    { title: 'Le cadre et les règles', why: 'Jouer légalement, sans erreur de règle ni de lecture de main.', tasks: [['mod', 'cadre'], ['mod', 'sprint'], ['mod', 'regles'], ['mod', 'mains'], ['mod', 'notation'], ['spot', 'meilleure', 0.8, 20], ['bankroll']] },
    { title: 'Positions et ouvertures', why: 'La première source de gains : ouvrir les bonnes mains aux bonnes positions.', tasks: [['mod', 'positions'], ['mod', 'preflop'], ['spot', 'rfi', 0.85, 30], ['table', 50]] },
    { title: 'Les maths de base', why: 'Payer ou se coucher selon les cotes, plus jamais au feeling.', tasks: [['mod', 'maths'], ['mod', 'probas'], ['spot', 'odds', 0.85, 30], ['spot', 'outs', 0.7, 20], ['guided', 'nitriver']] },
    { title: 'Bankroll et jeu en ligne', why: 'Protéger ton capital et installer une routine.', tasks: [['mod', 'bankroll'], ['mod', 'responsable'], ['mod', 'online'], ['mod', 'online2'], ['mod', 'live'], ['table', 150], ['journal', 1]] },
    { title: 'Préflop complet', why: '3-bet, défense des blindes, squeeze : la moitié des erreurs des micro-limites.', tasks: [['mod', 'preflop2'], ['mod', 'blindes'], ['mod', 'tailles'], ['spot', 'vsopen', 0.8, 30], ['guided', 'squeeze'], ['guided', 'vsthreebet']] },
    { title: 'Postflop', why: 'Textures, continuation bet, plan de main sur trois rues.', tasks: [['mod', 'postflop'], ['mod', 'textures'], ['mod', 'tirages'], ['mod', 'turnriver'], ['spot', 'tirage', 0.7, 20], ['guided', 'cbetdry'], ['guided', 'thinvalue']] },
    { title: 'Exploiter les fish', why: 'Ton argent vient d\'eux : valeur grosse, zéro bluff, isolation.', tasks: [['mod', 'fish'], ['mod', 'adversaires'], ['guided', 'iso3'], ['guided', 'nobluff'], ['guided', 'maniac'], ['table', 300]] },
    { title: 'Maths avancées et mental', why: 'Combos, cotes implicites, SPR, et la discipline qui protège tout le reste.', tasks: [['mod', 'maths2'], ['mod', 'mental'], ['mod', 'tilt2'], ['mod', 'biais'], ['mod', 'variance'], ['mod', 'discipline'], ['mod', 'decision'], ['spot', 'outs', 0.85, 30], ['guided', 'setmine'], ['journal', 3]] },
    { title: 'Formats et tapis courts', why: 'Le format le plus joué en France : Sit&Go et Expresso.', tasks: [['mod', 'formats'], ['mod', 'icm'], ['mod', 'expresso'], ['mod', 'hu'], ['mod', 'tapiscourts'], ['mod', 'hu_final'], ['spot', 'pushfold', 0.85, 30], ['guided', 'expresso'], ['guided', 'bubble'], ['expresso', 10]] },
    { title: 'Théorie, ranges, tailles', why: 'Penser en ranges et connaître l\'équilibre pour mieux s\'en écarter.', tasks: [['mod', 'theorie'], ['mod', 'ranges'], ['mod', 'sizing'], ['mod', 'ev'], ['mod', 'pots3bet'], ['guided', 'semibluff'], ['guided', 'multiway']] },
    { title: 'Lecture de mains et étude', why: 'Analyser tes propres mains comme un pro.', tasks: [['mod', 'lecture'], ['mod', 'multiway'], ['mod', 'mtt'], ['mod', 'etude'], ['mod', 'omaha'], ['mod', 'plo2'], ['mod', 'variantes2'], ['mod', 'shortdeck2'], ['mod', 'stud'], ['mod', 'limit'], ['import']] },
    { title: 'Solveurs et défense minimale', why: 'Comprendre l\'équilibre pour savoir quand et comment s\'en écarter.', tasks: [['mod', 'solveurs'], ['mod', 'analyste'], ['mod', 'mdf'], ['mod', 'bluffcatch'], ['spot', 'mdf', 0.8, 30], ['solver', 3]] },
    { title: 'Bloqueurs et stratégie de flop', why: 'Choisir ses bluffs, sa taille de c-bet et sa défense hors de position.', tasks: [['mod', 'bloqueurs'], ['mod', 'avantage'], ['mod', 'oopplay'], ['mod', 'polaris'], ['spot', 'combos', 0.8, 30], ['solver', 8]] },
    { title: 'Turn, river, profondeur, exploitation', why: 'Les décisions qui pèsent le plus lourd en bb, et comment exploiter la population.', tasks: [['mod', 'barrels'], ['mod', 'deep'], ['mod', 'profondeur'], ['mod', 'etudes'], ['mod', 'exploitpop'], ['mod', 'hud'], ['mod', 'styles'], ['trainer', 30], ['champ', 2]] },
    { title: 'Tables physiques', why: 'Jouer en casino ou en club sans erreur de procédure, avec une stratégie live.', tasks: [['mod', 'eclair'], ['mod', 'home'], ['mod', 'live_debut'], ['mod', 'notes_live'], ['mod', 'live_regles'], ['mod', 'live_strat'], ['mod', 'live_tells'], ['mod', 'live_table'], ['mod', 'live_mtt']] },
    { title: 'Tournois avancés et performance', why: 'Prime de risque ICM, PKO, et le mental qui protège ton winrate.', tasks: [['mod', 'icm2'], ['mod', 'satellites'], ['mod', 'perf'], ['mod', 'champions'], ['spot', 'bounty', 0.8, 20], ['trainer', 60], ['champ', 5], ['journal', 10]] },
    { title: 'Le métier', why: 'Économie du joueur, carrière, fiscalité : décider lucidement.', tasks: [['mod', 'marche'], ['mod', 'histoire'], ['mod', 'economie'], ['mod', 'bankroll2'], ['mod', 'salaire'], ['mod', 'carriere'], ['mod', 'staking'], ['mod', 'business'], ['mod', 'fiscal'], ['mod', 'integrite'], ['mod', 'longevite'], ['mod', 'progression']] },
  ];

  // État d'une tâche à partir de l'état de l'application : { done, label, progress (0..1), go (onglet / action) }.
  function taskStatus(task, st, K, S) {
    const [kind, a, b, c] = task, p = st.progress;
    if (kind === 'mod') { const m = K.MODULES.find((x) => x.id === a), sc = p.quiz?.[a] ?? 0; return { done: sc >= 0.8, label: `Module « ${m ? m.title : a} » maîtrisé (quiz ≥ 80 %)`, progress: Math.min(1, sc / 0.8), go: ['mod', a] }; }
    if (kind === 'spot') { const h = p.hist?.[a] || [], m = h.length ? h.reduce((x, y) => x + y, 0) / h.length : 0; return { done: h.length >= c && m >= b, label: `Spots « ${S.TYPES[a]} » : ${Math.round(b * 100)} % sur au moins ${c} réponses`, progress: Math.min(1, (h.length / c) * Math.min(1, m / b)), go: ['spot', a] }; }
    if (kind === 'guided') { const sc = p.guided?.[a] ?? 0; return { done: sc >= 0.75, label: `Main guidée « ${(root.Guided || require('./guided.js')).SCENARIOS.find((x) => x.id === a)?.title || a} » réussie`, progress: Math.min(1, sc / 0.75), go: ['guided', a] }; }
    if (kind === 'table') { const n = p.tableHands || 0; return { done: n >= a, label: `${a} mains au simulateur (cumul)`, progress: Math.min(1, n / a), go: ['sim', 'table'] }; }
    if (kind === 'expresso') { const n = p.expresso?.games || 0; return { done: n >= a, label: `${a} parties d'Expresso simulées`, progress: Math.min(1, n / a), go: ['sim', 'expresso'] }; }
    if (kind === 'journal') { const n = st.journal.sessions.length; return { done: n >= a, label: `${a} session${a > 1 ? 's' : ''} réelle${a > 1 ? 's' : ''} saisie${a > 1 ? 's' : ''} dans le Journal`, progress: Math.min(1, n / a), go: ['tab', 'journal'] }; }
    if (kind === 'bankroll') { const ok = +st.settings.bankroll0 > 0; return { done: ok, label: 'Bankroll de départ renseignée dans le Journal', progress: ok ? 1 : 0, go: ['tab', 'journal'] }; }
    if (kind === 'solver') { const n = p.solves || 0; return { done: n >= a, label: `${a} spots résolus et étudiés au solveur (cumul)`, progress: Math.min(1, n / a), go: ['tab', 'solveur'] }; }
    if (kind === 'trainer') { const n = p.trainer?.n || 0; return { done: n >= a, label: `${a} décisions river notées par l'entraîneur solveur (cumul)`, progress: Math.min(1, n / a), go: ['trainer', 1] }; }
    if (kind === 'champ') { const n = Object.values(p.champs?.by || {}).reduce((x, y) => x + y.sessions, 0); return { done: n >= a, label: `${a} sessions complètes contre les styles Champions`, progress: Math.min(1, n / a), go: ['tab', 'champions'] }; }
    if (kind === 'test') { const ok = !!p.placement; return { done: ok, label: 'Test de niveau passé', progress: ok ? 1 : 0, go: ['tab', 'parcours'] }; }
    if (kind === 'drill') { let best = 0; try { best = +JSON.parse(localStorage.getItem('sigma52.live.drillBest') || '0'); } catch (e) { best = 0; } return { done: best >= a, label: `Série de ${a} bonnes réponses à l'entraînement éclair (Table live)`, progress: Math.min(1, best / a), go: ['live', 'drill'] }; }
    if (kind === 'visit') { const ok = !!p.seen?.[a]; return { done: ok, label: b || 'Découvrir ' + a, progress: ok ? 1 : 0, go: c || ['tab', a] }; }
    if (kind === 'import') { const ok = !!st.notes.lastImport; return { done: ok, label: 'Tes historiques analysés au moins une fois', progress: ok ? 1 : 0, go: ['tab', 'analyse'] }; }
    return { done: false, label: kind, progress: 0, go: null };
  }
  function weekStatus(st, K, S) {
    return W.map((w, i) => { const tasks = w.tasks.map((t) => taskStatus(t, st, K, S)); return { n: i + 1, ...w, tasks, done: tasks.every((t) => t.done), progress: tasks.reduce((a, t) => a + t.progress, 0) / tasks.length }; });
  }
  const api = { WEEKS: W, taskStatus, weekStatus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Plan = api;
})(typeof window !== 'undefined' ? window : globalThis);
