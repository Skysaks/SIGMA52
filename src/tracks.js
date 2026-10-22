// Parcours par objectif : la suite d'étapes la plus courte vers un résultat concret, construite sur les modules,
// exercices et outils de SIGMA 52. Chaque étape se valide toute seule (mêmes règles que le programme de 17 semaines).
(function (root) {
  const TRACKS = [
    { id: 'gagner', title: 'Gagner vite, en jouant pour le plaisir', who: 'Tu joues quelques heures par semaine et tu veux devenir gagnant sans y passer ta vie.', promise: 'En 4 à 6 semaines : préflop solide, maths de base, jeu exploitant contre les joueurs faibles, budget et règles en place.',
      steps: [['test'], ['mod', 'sprint'], ['mod', 'positions'], ['mod', 'preflop'], ['spot', 'rfi', 0.85, 30], ['mod', 'probas'], ['mod', 'maths'], ['spot', 'odds', 0.85, 30], ['mod', 'fish'], ['mod', 'blindes'], ['mod', 'textures'], ['mod', 'loisir'], ['mod', 'responsable'], ['table', 300], ['mod', 'biais'], ['mod', 'mental'], ['journal', 3]] },
    { id: 'salaire', title: 'Remplacer son salaire', who: 'Tu vises un revenu régulier du poker, à terme à la place ou à côté d\'un emploi.', promise: 'Une méthode de régulier : préflop complet, postflop, exploitation, mental et discipline de pro, économie et fiscalité, preuve par le volume.',
      steps: [['test'], ['mod', 'sprint'], ['mod', 'bankroll'], ['bankroll'], ['mod', 'preflop2'], ['spot', 'vsopen', 0.8, 30], ['mod', 'postflop'], ['mod', 'textures'], ['mod', 'tirages'], ['mod', 'blindes'], ['mod', 'tailles'], ['mod', 'turnriver'], ['mod', 'fish'], ['mod', 'adversaires'], ['mod', 'decision'], ['mod', 'variance'], ['mod', 'biais'], ['mod', 'pots3bet'], ['mod', 'ev'], ['mod', 'tilt2'], ['mod', 'discipline'], ['mod', 'maths2'], ['mod', 'theorie'], ['mod', 'solveurs'], ['mod', 'mdf'], ['mod', 'exploitpop'], ['mod', 'economie'], ['mod', 'bankroll2'], ['mod', 'carriere'], ['mod', 'fiscal'], ['mod', 'salaire'], ['import'], ['table', 1000], ['journal', 10]] },
    { id: 'analyste', title: 'Analyser et comprendre le jeu en profondeur', who: 'Tu aimes comprendre pourquoi : ranges, équilibre, solveur, données.', promise: 'La boîte à outils de l\'analyste : théorie, solveur, rapport agrégé, méthode d\'étude par hypothèses, mesure statistique.',
      steps: [['test'], ['mod', 'sprint'], ['mod', 'theorie'], ['mod', 'ranges'], ['mod', 'maths2'], ['mod', 'decision'], ['mod', 'analyste'], ['mod', 'solveurs'], ['mod', 'mdf'], ['spot', 'mdf', 0.8, 30], ['mod', 'bloqueurs'], ['spot', 'combos', 0.8, 30], ['mod', 'avantage'], ['mod', 'polaris'], ['mod', 'bluffcatch'], ['mod', 'etudes'], ['visit', 'agg', 'Lire le rapport agrégé du solveur', ['agg', 1]], ['solver', 10], ['trainer', 60], ['import'], ['mod', 'etude']] },
    { id: 'amis', title: 'Dominer les parties entre amis et en live', who: 'Tu joues surtout en physique : parties maison, clubs, casinos.', promise: 'Décider vite à la table, lire les joueurs, organiser la partie, et t\'entraîner à te passer de l\'outil.',
      steps: [['test'], ['mod', 'sprint'], ['mod', 'eclair'], ['mod', 'home'], ['mod', 'fish'], ['mod', 'multiway'], ['mod', 'live_debut'], ['mod', 'live_strat'], ['mod', 'live_tells'], ['mod', 'notes_live'], ['drill', 10], ['mod', 'tilt2'], ['mod', 'responsable']] },
    { id: 'tournois', title: 'Gagner en tournois et Sit & Go', who: 'Tu joues des tournois, des Sit & Go ou des Expresso.', promise: 'Tapis courts, ICM, bulles, primes : les décisions qui font les places payées.',
      steps: [['test'], ['mod', 'sprint'], ['mod', 'formats'], ['mod', 'icm'], ['spot', 'pushfold', 0.85, 30], ['mod', 'expresso'], ['expresso', 10], ['mod', 'mtt'], ['mod', 'tapiscourts'], ['mod', 'satellites'], ['mod', 'hu_final'], ['mod', 'icm2'], ['spot', 'bounty', 0.8, 20], ['mod', 'perf'], ['mod', 'discipline']] },
    { id: 'variantes', title: 'Omaha et autres variantes', who: 'Tu veux jouer PLO, Omaha 5 cartes, Hi-Lo ou Short Deck.', promise: 'Les règles qui piègent, les mains qui gagnent, et les outils pour vérifier.',
      steps: [['test'], ['mod', 'sprint'], ['mod', 'omaha'], ['mod', 'plo2'], ['mod', 'variantes2'], ['mod', 'shortdeck2'], ['mod', 'stud'], ['mod', 'limit'], ['visit', 'variantes', 'Calculer quelques équités dans l\'outil Variantes', ['tool', 'variantes']], ['mod', 'profondeur'], ['mod', 'hu']] },
  ];
  // Test de niveau : 3 questions tirées des quiz de chaque niveau 1 à 4 (12 questions).
  function placementQuestions(K, rand = Math.random) {
    const out = [];
    for (const lvl of [1, 2, 3, 4]) {
      const pool = K.MODULES.filter((m) => m.level === lvl).flatMap((m) => m.quiz.map((q) => ({ ...q, mod: m.id, level: lvl })));
      for (let i = 0; i < 3 && pool.length; i++) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
    return out;
  }
  // Niveau conseillé : le premier niveau où tu fais moins de 2 bonnes réponses sur 3.
  function placementLevel(answers) {
    for (const lvl of [1, 2, 3, 4]) { const a = answers.filter((x) => x.level === lvl); if (a.filter((x) => x.ok).length < 2) return lvl; }
    return 5;
  }
  const api = { TRACKS, placementQuestions, placementLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Tracks = api;
})(typeof window !== 'undefined' ? window : globalThis);
