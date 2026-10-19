// Cours — Niveau 4 (Élite), modules Champions : ce que les grands joueurs enseignent publiquement, et comment affronter les grands styles.
// Seules des sources publiques sont utilisées (livres, cours, interviews, fiches) ; aucune citation n'est inventée.
(function (root) {
  function register(K) {
    K.mod({
      id: 'champions', level: 4, title: 'Apprendre des champions : ce qu\'ils enseignent vraiment', drill: 'situations',
      goals: ['Savoir ce que des joueurs de premier plan enseignent publiquement', 'Distinguer ce qui se transpose aux petites limites de ce qui ne se transpose pas', 'Lire un classement des gains sans contresens'],
      sections: [
        ['Lire un classement des gains', `<p>Le classement de la Hendon Mob additionne les <strong>gains bruts en tournois live</strong>. En juillet 2026, Bryn Kenney est devenu le premier joueur à dépasser 90 millions de dollars de gains (PokerNews). Ces totaux ne déduisent ni les buy-ins (souvent 25 000 à 250 000 $ en high roller), ni les parts vendues à des investisseurs, ni les résultats en cash game. Un gros total prouve un volume énorme à très haute limite et un haut niveau ; il ne dit pas combien le joueur a réellement gagné.</p>
          <p>Leçon pour toi : juge un joueur, et toi-même, sur un bénéfice net mesuré sur un gros échantillon (Journal), jamais sur des gains bruts ou un coup d'éclat.</p>`],
        ['Phil Ivey : l\'agresseur complet', `<p>Son cours MasterClass compte 11 modules : préflop et défense des blindes, tailles de mise, bluff, jeu postflop, tapis profonds (plus de 100 bb), mental (tilt, confiance, mettre l'adversaire sous pression) et tells physiques (critique Blackrain79, 2019).</p>
          <ul><li><strong>Ce qui se transpose</strong> : la taille de mise comme outil (valeur et pression), la position comme base du choix des mains, le jeu profond.</li>
          <li><strong>Ce qui ne se transpose pas tel quel</strong> : les grands bluffs à haute limite visent des adversaires capables de coucher de bonnes mains. Aux petites limites, la population paie trop : la valeur rapporte plus que le bluff (module Exploitation).</li></ul>`],
        ['Daniel Negreanu : le small ball', `<p><em>Power Hold'em Strategy</em> (2008) présente le small ball : faire grossir son tapis sans prendre de gros risques, en exploitant la position, la texture et les adversaires prévisibles, et en jouant « la main de l'adversaire plutôt que la sienne » (critique PokerNews, 2008). Le style accepte de perdre plus de petits pots pour éviter les gros pots marginaux. Son cours MasterClass, lancé en juin 2018, vise les joueurs intermédiaires : tournois, tells, cash et jeu en ligne.</p>
          <ul><li><strong>Ce qui se transpose</strong> : contrôler la taille du pot avec les mains moyennes, lire la range adverse plutôt que sa propre main, utiliser la position.</li>
          <li><strong>Prolongement moderne</strong> : les solveurs confirment l'intérêt des petites mises fréquentes sur les boards où l'on a l'avantage de range (module Avantage de range).</li>
          <li><strong>Limite</strong> : beaucoup de mains jouées demande une excellente lecture postflop ; sans elle, c'est une fuite.</li></ul>`],
        ['Phil Hellmuth : classer, lire, s\'adapter', `<p><em>Play Poker Like the Pros</em> classe les adversaires en cinq « animaux » : la souris (très serrée), le lion (solide, difficile à bluffer), le chacal (maniaque), l'éléphant (calling station) et l'aigle (joueur de classe mondiale). Pour les débutants, il conseille de ne jouer que dix mains : AA, KK, QQ, AK, JJ, TT, 99, 88, AQ, 77 (80 combinaisons, environ 6 % des mains). En interview (PokerNews, 2015), il résume le poker à « lire les gens » et dit pouvoir jouer le plus ou le moins de mains de la table selon les adversaires.</p>
          <ul><li><strong>Ce qui se transpose</strong> : classer vite chaque adversaire (c'est le rôle des profils de SIGMA 52) et changer de plan selon le profil.</li>
          <li><strong>Limite</strong> : les dix mains sont un point de départ de débutant, trop serré pour gagner en 6-max ; les lectures sans données sont peu fiables (module Tells).</li></ul>`],
        ['Stephen Chidwick : l\'équilibre comme base', `<p>Card Player (2019) le décrit étudiant avec des solveurs pour comprendre le raisonnement derrière leurs résultats ; il voit l'équilibre comme le moyen de repérer précisément les erreurs adverses, pas comme une fin. Il recommande les coups qui mettent l'adversaire mal à l'aise (petits check-raises sur boards secs, grosses mises au turn quand la range adverse est faible), note en session les mains dont il doute pour les revoir, et cite l'exercice physique comme ce qui aide le plus son jeu.</p>
          <ul><li><strong>Ce qui se transpose</strong> : la routine « noter, revoir au solveur, tirer une règle » (onglet Solveur), et l'hygiène de vie.</li>
          <li><strong>Limite</strong> : jouer l'équilibre pur contre des fish laisse de l'argent sur la table.</li></ul>`],
        ['Michael Mizrachi : l\'exception', `<p>PokerNews (2016) décrit un style loose-agressif inhabituel : large range sans range fixe, beaucoup d'overbets, prêt à jouer environ un quart de son tapis sur des coups à pile ou face. Lui-même conseille aux débutants de <strong>ne pas copier</strong> son style et de s'en tenir aux mains fortes.</p>
          <p>Leçon : les styles extrêmes reposent sur un niveau postflop et une lecture d'élite. Ce qui marche pour un champion de tournoi peut ruiner un joueur de micro-limites.</p>`],
        ['Patrik Antonius : sang-froid et sélection', `<p>Card Player (2006) le décrit agressif à très haute limite, souvent en tête-à-tête, insensible à l'adversité comme à la chance, et préférant jouer peu de tables dans des parties difficiles pour rester concentré à 100 %. Il considère la qualité de ses lectures comme sa principale force.</p>
          <p>Leçon : la stabilité émotionnelle et la concentration sont des compétences de jeu, au même titre que la technique (module Performance).</p>`],
        ['YoH ViraL : un parcours français', `<p>Johan Guilbert, alias YoH ViraL, né en 1989 à Sarreguemines, a commencé à plein temps vers 2010, surtout en cash game, avant de rejoindre les high rollers ; deuxième de la WSOP Europe Main Event 2021 (près de 800 000 €), premier bracelet WSOP en 2025 (WSOP Paradise, 1 534 645 $). Il est aussi vlogueur et joue dans des parties diffusées comme Hustler Casino Live (Wikipédia, PokerNews).</p>
          <p>Leçon : le cash game comme socle, la montée progressive de limite, et le contenu comme revenu annexe (module Revenus annexes). Aucune description publique détaillée de son style de jeu n'existe : SIGMA 52 n'en invente pas.</p>`],
        ['Ce qui se transpose à ton niveau', `<table class="t"><thead><tr><th>Idée de champion</th><th>Aux petites limites</th></tr></thead><tbody>
          <tr><td>Agressivité et grands bluffs (Ivey)</td><td>Agressivité oui, grands bluffs contre les fish non</td></tr>
          <tr><td>Small ball (Negreanu)</td><td>Contrôle du pot avec les mains moyennes : oui ; jouer beaucoup de mains : seulement avec un bon postflop</td></tr>
          <tr><td>Classer les adversaires (Hellmuth)</td><td>Oui, c'est la base de l'exploitation</td></tr>
          <tr><td>Étude au solveur (Chidwick)</td><td>Oui, après la session, jamais pendant</td></tr>
          <tr><td>LAG extrême (Mizrachi)</td><td>Non : lui-même le déconseille</td></tr>
          <tr><td>Sang-froid, sélection des parties (Antonius)</td><td>Oui, dès la première session</td></tr></tbody></table>`],
      ],
      mistakes: ['Lire un classement de gains bruts comme un classement de bénéfices', 'Copier un style de champion sans son niveau postflop', 'Appliquer à des fish des bluffs pensés pour des professionnels', 'Croire qu\'une stratégie publique décrit tout le jeu d\'un joueur'],
      keys: ['Gains bruts ≠ bénéfices', 'Ivey : taille de mise et position comme armes', 'Negreanu : petits pots, lire la range adverse', 'Hellmuth : classer les adversaires et s\'adapter', 'Chidwick : l\'équilibre sert à repérer les erreurs adverses'],
      quiz: [
        ['Un joueur affiche 50 millions de gains en tournois live. On peut en conclure…', ['Qu\'il a gagné 50 millions', 'Qu\'il a joué énormément à très haute limite, sans connaître son bénéfice'], 1, 'Les buy-ins, les parts vendues et le cash game ne sont pas déduits.'],
        ['Principe central du small ball selon Power Hold\'em Strategy ?', ['Jouer de gros pots avec les nuts uniquement', 'Faire grossir son tapis sans prendre de gros risques, en exploitant position et adversaires'], 1, 'Petits pots, position, lecture de la range adverse.'],
        ['Dans le classement de Hellmuth, l\'« éléphant » est…', ['Un maniaque', 'Une calling station', 'Un joueur très serré'], 1, 'Il paie presque tout et se bluffe très mal.'],
        ['Les dix mains de départ de Hellmuth représentent environ…', ['6 % des mains', '15 % des mains', '25 % des mains'], 0, '8 paires × 6 + AK 16 + AQ 16 = 80 combinaisons sur 1 326.'],
        ['Selon Card Player, comment Chidwick voit-il l\'équilibre (GTO) ?', ['Comme une fin en soi', 'Comme le moyen de repérer précisément les erreurs adverses'], 1, 'L\'équilibre est la référence qui révèle les écarts à exploiter.'],
        ['Que conseille Mizrachi aux débutants ?', ['Copier son style', 'Ne pas copier son style et jouer des mains fortes'], 1, 'Son style suppose un niveau d\'élite.'],
      ],
    });

    K.mod({
      id: 'styles', level: 4, title: 'Affronter les grands styles : repérer et contrer', drill: 'situations',
      goals: ['Reconnaître un style en quelques dizaines de mains', 'Appliquer le contre adapté à chaque style', 'Jouer contre des adversaires qui s\'adaptent à toi'],
      sections: [
        ['Ce qu\'on lit en 50 mains', `<p>Sur 50 mains, l'erreur type d'un VPIP de 25 % vaut environ 6 points : l'intervalle à 95 % va d'environ 13 à 37 %. Le VPIP et le PFR donnent une première idée ; le 3-bet, la c-bet et le fold to c-bet restent illisibles (trop peu d'occasions). Complète avec les <strong>lignes</strong> et les <strong>tailles</strong> : petites mises répétées, overbets, relances river, mains montrées à l'abattage.</p>`],
        ['Les grands styles et leur contre', `<table class="t"><thead><tr><th>Style</th><th>Signes</th><th>Contre</th></tr></thead><tbody>
          <tr><td>Agresseur complet</td><td>Ouvre et 3-bette souvent, grosses mises, overbets</td><td>Ne pas trop coucher ; payer ses overbets avec les meilleurs bluff-catchers ; 4-bet valeur plus large</td></tr>
          <tr><td>Small ball</td><td>Petites ouvertures, beaucoup de calls en position, petites mises</td><td>Relancer ses petites mises ; bluffer gros plutôt que petit ; éviter les petits pots marginaux hors de position</td></tr>
          <tr><td>Lecteur adaptatif</td><td>Serré, valeur, change de plan selon toi</td><td>Mélanger ses lignes ; voler ses blindes ; respecter ses grosses mises</td></tr>
          <tr><td>GTO moderne</td><td>Peu de failles, check-raises, grosses mises turn</td><td>Jouer sa base solide ; ne pas surpayer ; dans la vraie vie, choisir une autre table</td></tr>
          <tr><td>LAG atypique</td><td>Joue beaucoup, c-bet presque toujours, couche rarement</td><td>Zéro bluff au flop ; check-call ; payer plus large ses overbets</td></tr>
          <tr><td>Pression tête-à-tête</td><td>Relance presque tous ses boutons, 3-bet fréquent</td><td>Défendre large la grosse blinde ; 3-bet valeur et bloqueurs ; garder son calme</td></tr>
          <tr><td>Parrain agressif</td><td>C-bet presque systématique, grosses mises, semi-bluffs à tapis</td><td>Défendre plus large au flop ; check-raise les boards bas ; respecter ses rares 3-bets</td></tr>
          <tr><td>Joueur de tournoi méthodique</td><td>Serré, discipliné, joue selon son tapis (M)</td><td>Voler ses blindes ; respecter ses relances ; anticiper son tapis ou couché quand son M est bas</td></tr>
          <tr><td>Ultra-agressif opaque</td><td>Large, 3-bets, overbets, relances-bluffs, couche rarement</td><td>Payer plus large avec les bons bluff-catchers ; moins de c-bets bluff ; piéger avec les mains fortes</td></tr>
          <tr><td>Joueurs d'action live</td><td>Ouvertures à 4 bb, beaucoup de calls, pots à plusieurs</td><td>Valeur grosse, bluffs rares, isolation en position</td></tr></tbody></table>`],
        ['Contre un adversaire qui s\'adapte', `<p>Certains adversaires mesurent tes tendances. Exemple dans SIGMA 52 : les styles « lecteurs » augmentent leurs bluffs dès que tu couches plus de 45 % du temps face à leurs mises (après une douzaine de mises affrontées). Contre eux :</p>
          <ol><li>Reste proche de ta défense d'équilibre (MDF) tant que tu n'as pas de preuve d'un écart.</li><li>Mélange tes lignes : check-raises, calls lents, mises de tailles variées avec des mains de forces différentes.</li><li>Quand il s'ajuste, ajuste-toi en retour : s'il bluffe plus, paie plus.</li></ol>`],
        ['Contre plus fort que toi', `<ul><li>En cash, la meilleure décision est de <strong>changer de table</strong> : ton winrate vient des joueurs plus faibles que toi.</li>
          <li>En tournoi, tu ne choisis pas : réduis les pots marginaux hors de position, joue en position, garde tes grosses mises pour les mains fortes.</li>
          <li>Ne cherche pas à « montrer » que tu es bon : la variance de quelques mains ne prouve rien.</li></ul>`],
        ['S\'entraîner', `<p>Onglet <strong>Champions</strong> : chaque style a un briefing (sources, ce que fait le bot, comment t'adapter) et un rapport de fin de session qui compare ce que tu as observé au style réel. Le <strong>défi mystère</strong> te fait affronter un style caché pendant 60 mains : à toi de l'identifier.</p>`],
      ],
      mistakes: ['Conclure sur le 3-bet d\'un joueur après 50 mains', 'Bluffer petit contre un joueur small ball qui paie les petites mises', 'Rester à la table d\'un joueur plus fort par orgueil', 'Devenir prévisible contre un adversaire qui s\'adapte'],
      keys: ['50 mains : VPIP/PFR lisibles, le reste non', 'Chaque style a son contre', 'Contre un adaptatif : rester équilibré et mélanger ses lignes', 'Contre plus fort : changer de table'],
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
