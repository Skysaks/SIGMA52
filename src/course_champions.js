// Cours — Niveau 4 (Élite), modules Champions : les grands profils (archétypes, sans noms de joueurs) et comment les affronter.
// Les descriptions s'appuient sur des sources publiques (voir docs/verification_cours.md) ; les statistiques citées sont mesurées sur les bots.
(function (root) {
  function register(K) {
    K.mod({
      id: 'champions', level: 4, title: 'Les grands profils : ce qu\'ils enseignent vraiment', drill: 'situations',
      goals: ['Connaître les grands profils de joueurs forts et la leçon que chacun enseigne', 'Distinguer ce qui se transpose aux petites limites de ce qui ne se transpose pas', 'Lire un classement des gains sans contresens'],
      sections: [
        ['Pourquoi des profils et pas des noms', `<p>Les profils de l'onglet Champions sont des <strong>archétypes</strong> : chacun résume une manière de jouer qu'on retrouve chez des joueurs forts, sans prétendre copier une personne. Le jeu réel d'un joueur change d'une année à l'autre et n'est jamais entièrement public ; un archétype, lui, est défini précisément, et ses statistiques sont <strong>mesurées</strong> sur les bots de SIGMA 52 (section « Ce que disent les mesures »).</p>`],
        ['Lire un classement des gains', `<p>Les classements de gains en tournois live additionnent des <strong>gains bruts</strong>. En juillet 2026, le premier de ce classement est devenu le premier joueur à dépasser 90 millions de dollars de gains (PokerNews). Ces totaux ne déduisent ni les buy-ins (souvent 25 000 à 250 000 $ en high roller), ni les parts vendues à des investisseurs, ni les résultats en cash game. Un gros total prouve un volume énorme à très haute limite et un haut niveau ; il ne dit pas combien le joueur a réellement gagné.</p>
          <p>Leçon pour toi : juge un joueur, et toi-même, sur un bénéfice net mesuré sur un gros échantillon (Journal), jamais sur des gains bruts ou un coup d'éclat.</p>`],
        ['Le prédateur polyvalent : la taille de mise comme arme', `<p>Ouvre et 3-bette souvent, mise de 60 à 100 % du pot, overbette au turn et à la river, et bluffe davantage dès que tu abandonnes trop. Ce profil se retrouve chez les joueurs complets de très haute limite : préflop solide, gros jeu postflop, tapis profonds, pression mentale.</p>
          <ul><li><strong>Ce qui se transpose</strong> : la taille de mise comme outil (valeur et pression), la position comme base du choix des mains, le jeu profond.</li>
          <li><strong>Ce qui ne se transpose pas tel quel</strong> : les grands bluffs visent des adversaires capables de coucher de bonnes mains. Aux petites limites, la population paie trop : la valeur rapporte plus que le bluff (module Exploitation).</li></ul>`],
        ['Le small-baller : petits pots, lecture de la range adverse', `<p>Petites ouvertures (2,2 bb), beaucoup de calls en position, petites mises fréquentes (25 à 40 % du pot au flop). Le principe : faire grossir son tapis sans prendre de gros risques, en exploitant la position, la texture et les adversaires prévisibles, et en jouant la main de l'adversaire plutôt que la sienne. Le style accepte de perdre plus de petits pots pour éviter les gros pots marginaux.</p>
          <ul><li><strong>Ce qui se transpose</strong> : contrôler la taille du pot avec les mains moyennes, lire la range adverse plutôt que sa propre main, utiliser la position.</li>
          <li><strong>Prolongement moderne</strong> : les solveurs confirment l'intérêt des petites mises fréquentes sur les boards où l'on a l'avantage de range (module Avantage de range).</li>
          <li><strong>Limite</strong> : beaucoup de mains jouées demande une excellente lecture postflop ; sans elle, c'est une fuite.</li></ul>`],
        ['Le lecteur serré : classer, lire, s\'adapter', `<p>Range serrée, valeur avant tout, et un ajustement fort à ce que tu montres. Ce profil repose sur une idée simple : classer vite chaque adversaire. Une classification grand public en cinq « animaux » l'illustre : la souris (très serrée), le lion (solide, difficile à bluffer), le chacal (maniaque), l'éléphant (calling station) et l'aigle (joueur de classe mondiale). Le même type d'ouvrage conseille aux débutants de ne jouer que dix mains : AA, KK, QQ, AK, JJ, TT, 99, 88, AQ, 77 (80 combinaisons, environ 6 % des mains).</p>
          <ul><li><strong>Ce qui se transpose</strong> : classer vite chaque adversaire (c'est le rôle des profils de SIGMA 52) et changer de plan selon le profil.</li>
          <li><strong>Limite</strong> : les dix mains sont un point de départ de débutant, trop serré pour gagner en 6-max ; les lectures sans données sont peu fiables (module Tells).</li></ul>`],
        ['L\'équilibré moderne : l\'équilibre comme base', `<p>Proche de l'équilibre : peu de failles, des check-raises au flop avec mains fortes et tirages, des grosses mises au turn. Les joueurs de ce profil étudient au solveur pour comprendre le raisonnement derrière les résultats, et voient l'équilibre comme le moyen de repérer précisément les erreurs adverses, pas comme une fin. Leurs coups préférés mettent l'adversaire mal à l'aise : petits check-raises sur boards secs, grosses mises au turn quand la range adverse est faible.</p>
          <ul><li><strong>Ce qui se transpose</strong> : la routine « noter en session les mains douteuses, les revoir au solveur, en tirer une règle » (onglet Solveur), et l'hygiène de vie (sommeil, exercice).</li>
          <li><strong>Limite</strong> : jouer l'équilibre pur contre des fish laisse de l'argent sur la table.</li></ul>`],
        ['Le LAG imprévisible : l\'exception à ne pas copier', `<p>Joue beaucoup de mains, c-bette presque toujours, overbette souvent et ne lâche presque rien au flop. Chez les meilleurs, ce style s'appuie sur une lecture et un niveau postflop d'élite, et accepte de mettre une grosse part du tapis sur des coups à pile ou face. Les joueurs qui gagnent ainsi conseillent eux-mêmes aux débutants de <strong>ne pas copier</strong> ce style et de s'en tenir aux mains fortes.</p>
          <p>Leçon : ce qui marche pour un champion de tournoi peut ruiner un joueur de micro-limites. Dans SIGMA 52, apprends plutôt à le <strong>battre</strong> : zéro bluff au flop, check-call, valeur plus fine.</p>`],
        ['Le presseur de tête-à-tête : sang-froid et sélection', `<p>Relance la majorité de ses boutons, 3-bette souvent, mise de 2/3 du pot au pot. Les joueurs de ce profil, à très haute limite et souvent en tête-à-tête, ont deux points communs : une insensibilité apparente à la chance comme à l'adversité, et peu de tables à la fois pour rester concentrés à 100 %.</p>
          <p>Leçon : la stabilité émotionnelle et la concentration sont des compétences de jeu, au même titre que la technique (module Performance).</p>`],
        ['Ce que disent les mesures', `<p>Chaque profil a été joué <strong>150 000 mains en tête-à-tête</strong> contre un héros régulier (un bot solide, pas un solveur) et 30 000 mains à 6. Résultat du héros, en bb/100 (± 5 environ à 95 %) :</p>
          <table class="t"><thead><tr><th>Profil</th><th class="n">Héros régulier</th><th>Niveau</th></tr></thead><tbody>
          <tr><td>Presseur de tête-à-tête</td><td class="n">−23</td><td>Très difficile</td></tr>
          <tr><td>Voleur de bouton</td><td class="n">−14</td><td>Très difficile</td></tr>
          <tr><td>Prédateur polyvalent</td><td class="n">−13</td><td>Très difficile</td></tr>
          <tr><td>Équilibré moderne</td><td class="n">−10</td><td>Très difficile</td></tr>
          <tr><td>Small-baller</td><td class="n">−7</td><td>Très difficile</td></tr>
          <tr><td>LAG imprévisible, lecteur serré, barreleur</td><td class="n">≈ 0</td><td>Difficile</td></tr>
          <tr><td>Ultra-agressif opaque</td><td class="n">+13</td><td>Moyen</td></tr>
          <tr><td>Amateur audacieux, image folle</td><td class="n">+20 à +22</td><td>Moyen</td></tr>
          <tr><td>Repère : calling station</td><td class="n">+67</td><td>–</td></tr></tbody></table>
          <p>Trois leçons. 1) Les profils qui battent le régulier combinent <strong>agression et position</strong> (presseur, voleur de bouton, prédateur) : ils prennent les petits pots que le régulier abandonne. 2) L'agression sans discipline se paie : l'ultra-agressif bluffe trop et perd nettement. 3) Les profils « loisir » (amateur audacieux, image folle) paient trop et perdent le plus, comme dans la vraie vie.</p>
          <p>Limite : ce sont des bots contre un bot. Un humain s'adapte, se fatigue et tilte ; ces chiffres classent les profils entre eux, ils ne prédisent pas ton propre résultat.</p>`],
        ['Ce qui se transpose à ton niveau', `<table class="t"><thead><tr><th>Profil</th><th>Aux petites limites</th></tr></thead><tbody>
          <tr><td>Prédateur polyvalent : agressivité, grands bluffs</td><td>Agressivité oui, grands bluffs contre les fish non</td></tr>
          <tr><td>Small-baller : petits pots</td><td>Contrôle du pot avec les mains moyennes : oui ; jouer beaucoup de mains : seulement avec un bon postflop</td></tr>
          <tr><td>Lecteur serré : classer les adversaires</td><td>Oui, c'est la base de l'exploitation</td></tr>
          <tr><td>Équilibré moderne : étude au solveur</td><td>Oui, après la session, jamais pendant</td></tr>
          <tr><td>LAG imprévisible : style extrême</td><td>Non : ceux qui le pratiquent le déconseillent</td></tr>
          <tr><td>Presseur de tête-à-tête : sang-froid, sélection</td><td>Oui, dès la première session</td></tr></tbody></table>`],
      ],
      mistakes: ['Lire un classement de gains bruts comme un classement de bénéfices', 'Copier un style de champion sans son niveau postflop', 'Appliquer à des fish des bluffs pensés pour des professionnels', 'Croire qu\'un profil décrit tout le jeu d\'une personne réelle'],
      keys: ['Gains bruts ≠ bénéfices', 'Prédateur : taille de mise et position comme armes', 'Small-baller : petits pots, lire la range adverse', 'Lecteur serré : classer les adversaires et s\'adapter', 'Équilibré moderne : l\'équilibre sert à repérer les erreurs adverses'],
      quiz: [
        ['Un joueur affiche 50 millions de gains en tournois live. On peut en conclure…', ['Qu\'il a gagné 50 millions', 'Qu\'il a joué énormément à très haute limite, sans connaître son bénéfice'], 1, 'Les buy-ins, les parts vendues et le cash game ne sont pas déduits.'],
        ['Principe central du small ball ?', ['Jouer de gros pots avec les nuts uniquement', 'Faire grossir son tapis sans prendre de gros risques, en exploitant position et adversaires'], 1, 'Petits pots, position, lecture de la range adverse.'],
        ['Dans la classification en cinq animaux, l\'« éléphant » est…', ['Un maniaque', 'Une calling station', 'Un joueur très serré'], 1, 'Il paie presque tout et se bluffe très mal.'],
        ['Les dix mains de départ « débutant » (AA à 77, AK, AQ) représentent environ…', ['6 % des mains', '15 % des mains', '25 % des mains'], 0, '8 paires × 6 + AK 16 + AQ 16 = 80 combinaisons sur 1 326.'],
        ['Pour l\'équilibré moderne, l\'équilibre (GTO) est…', ['Une fin en soi', 'Le moyen de repérer précisément les erreurs adverses'], 1, 'L\'équilibre est la référence qui révèle les écarts à exploiter.'],
        ['Face au LAG imprévisible, que faire aux petites limites ?', ['Copier son style', 'Le battre : moins de bluffs au flop, check-call, valeur'], 1, 'Son style suppose un niveau d\'élite ; ses failles se punissent par la valeur.'],        ['Dans les mesures de SIGMA 52, quel profil bat le plus nettement le héros régulier en tête-à-tête ?', ['L\'ultra-agressif opaque', 'Le presseur de tête-à-tête', 'L\'image folle'], 1, '−23 bb/100 pour le héros : agression et position. L\'ultra-agressif, lui, bluffe trop et perd (+13 pour le héros).'],
      ],
    });

    K.mod({
      id: 'styles', level: 4, title: 'Affronter les grands profils : repérer et contrer', drill: 'situations',
      goals: ['Reconnaître un style en quelques dizaines de mains', 'Appliquer le contre adapté à chaque style', 'Jouer contre des adversaires qui s\'adaptent à toi'],
      sections: [
        ['Ce qu\'on lit en 50 mains', `<p>Sur 50 mains, l'erreur type d'un VPIP de 25 % vaut environ 6 points : l'intervalle à 95 % va d'environ 13 à 37 %. Le VPIP et le PFR donnent une première idée ; le 3-bet, la c-bet et le fold to c-bet restent illisibles (trop peu d'occasions). Complète avec les <strong>lignes</strong> et les <strong>tailles</strong> : petites mises répétées, overbets, relances river, mains montrées à l'abattage.</p>`],
        ['Les grands profils et leur contre', `<table class="t"><thead><tr><th>Profil</th><th>Signes</th><th>Contre</th></tr></thead><tbody>
          <tr><td>Prédateur polyvalent</td><td>Ouvre et 3-bette souvent, grosses mises, overbets</td><td>Ne pas trop coucher ; payer ses overbets avec les meilleurs bluff-catchers ; 4-bet valeur plus large</td></tr>
          <tr><td>Small-baller</td><td>Petites ouvertures, beaucoup de calls en position, petites mises</td><td>Relancer ses petites mises ; bluffer gros plutôt que petit ; éviter les petits pots marginaux hors de position</td></tr>
          <tr><td>Lecteur serré</td><td>Serré, valeur, change de plan selon toi</td><td>Mélanger ses lignes ; voler ses blindes ; respecter ses grosses mises</td></tr>
          <tr><td>Équilibré moderne</td><td>Peu de failles, check-raises, grosses mises turn</td><td>Jouer sa base solide ; ne pas surpayer ; dans la vraie vie, choisir une autre table</td></tr>
          <tr><td>LAG imprévisible</td><td>Joue beaucoup, c-bet presque toujours, couche rarement</td><td>Zéro bluff au flop ; check-call ; payer plus large ses overbets</td></tr>
          <tr><td>Presseur de tête-à-tête</td><td>Relance presque tous ses boutons, 3-bet fréquent</td><td>Défendre large la grosse blinde ; 3-bet valeur et bloqueurs ; garder son calme</td></tr>
          <tr><td>Barreleur à l'ancienne</td><td>C-bet presque systématique, grosses mises, semi-bluffs à tapis</td><td>Défendre plus large au flop ; check-raise les boards bas ; respecter ses rares 3-bets</td></tr>
          <tr><td>Méthodique de tournoi</td><td>Serré, discipliné, joue selon son tapis (M)</td><td>Voler ses blindes ; respecter ses relances ; anticiper son tapis ou couché quand son M est bas</td></tr>
          <tr><td>Ultra-agressif opaque</td><td>Large, 3-bets, overbets, relances-bluffs, couche rarement</td><td>Payer plus large avec les bons bluff-catchers ; moins de c-bets bluff ; piéger avec les mains fortes</td></tr>
          <tr><td>Joueurs d'action live</td><td>Ouvertures à 4 bb, beaucoup de calls, pots à plusieurs</td><td>Valeur grosse, bluffs rares, isolation en position</td></tr></tbody></table>
          <p>Les 28 profils et leurs statistiques mesurées sont dans l'onglet Champions → Atlas des profils.</p>`],
        ['Contre un adversaire qui s\'adapte', `<p>Certains adversaires mesurent tes tendances. Exemple dans SIGMA 52 : les profils qui « lisent » augmentent leurs bluffs dès que tu couches plus de 45 % du temps face à leurs mises (après une douzaine de mises affrontées). Contre eux :</p>
          <ol><li>Reste proche de ta défense d'équilibre (MDF) tant que tu n'as pas de preuve d'un écart.</li><li>Mélange tes lignes : check-raises, calls lents, mises de tailles variées avec des mains de forces différentes.</li><li>Quand il s'ajuste, ajuste-toi en retour : s'il bluffe plus, paie plus.</li></ol>`],
        ['Contre plus fort que toi', `<ul><li>En cash, la meilleure décision est de <strong>changer de table</strong> : ton winrate vient des joueurs plus faibles que toi.</li>
          <li>En tournoi, tu ne choisis pas : réduis les pots marginaux hors de position, joue en position, garde tes grosses mises pour les mains fortes.</li>
          <li>Ne cherche pas à « montrer » que tu es bon : la variance de quelques mains ne prouve rien.</li></ul>`],
        ['S\'entraîner', `<p>Onglet <strong>Champions</strong> : chaque profil a un briefing (comment le reconnaître, ce que fait le bot, comment t'adapter) et un rapport de fin de session qui compare ce que tu as observé à ses statistiques <strong>mesurées</strong> sur des dizaines de milliers de mains. <strong>Reconnaître un profil</strong> t'entraîne à identifier un profil à partir de ses statistiques sur 100, 300 ou 1 000 mains, bruit d'échantillon compris. Le <strong>défi mystère</strong> te fait affronter un profil caché pendant 60 mains : à toi de l'identifier.</p>`],
      ],
      mistakes: ['Conclure sur le 3-bet d\'un joueur après 50 mains', 'Bluffer petit contre un joueur small ball qui paie les petites mises', 'Rester à la table d\'un joueur plus fort par orgueil', 'Devenir prévisible contre un adversaire qui s\'adapte'],
      keys: ['50 mains : VPIP/PFR lisibles, le reste non', 'Chaque profil a son contre', 'Contre un adaptatif : rester équilibré et mélanger ses lignes', 'Contre plus fort : changer de table'],
      quiz: [
        ['Après 50 mains, quelle statistique est la plus fiable ?', ['3-bet', 'VPIP', 'Fold to c-bet'], 1, 'C\'est celle qui a le plus d\'occasions : une par main.'],
        ['Contre un joueur small ball qui mise petit très souvent, l\'exploit principal ?', ['Relancer ses petites mises', 'Coucher plus souvent'], 0, 'Sa range de petites mises est large et faible.'],
        ['Contre un LAG qui ne couche presque jamais face aux c-bets ?', ['C-bet bluff plus souvent', 'Ne plus bluffer au flop, miser pour la valeur'], 1, 'Un bluff ne marche que s\'il couche.'],
        ['Un adversaire bluffe plus depuis que tu couches beaucoup. Ta réponse ?', ['Coucher encore plus', 'Payer plus souvent, revenir vers la MDF'], 1, 'Il exploite tes couchers : corrige l\'écart.'],
        ['En cash, face à un joueur nettement plus fort, la meilleure décision ?', ['Rester pour progresser', 'Changer de table'], 1, 'Ton argent vient des joueurs plus faibles ; étudie contre les forts hors table.'],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
