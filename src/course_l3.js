// Cours — Niveau 3 : Avancé. Objectif : penser en ranges, comprendre l'équilibre pour mieux s'en écarter, maîtriser les formats à tapis courts.
(function (root) {
  function register(K) {
    K.mod({
      id: 'theorie', level: 3, title: 'Théorie des jeux appliquée', minutes: 18, drill: 'pushfold',
      goals: ['Comprendre ce qu\'est un équilibre et ce qu\'il garantit', 'Utiliser l\'indifférence, la MDF et le ratio de bluffs', 'Savoir quand s\'écarter de l\'équilibre pour exploiter'],
      sections: [
        ['L\'équilibre de Nash', `<p>Une stratégie d'équilibre (souvent appelée « GTO ») est une stratégie qu'aucun adversaire ne peut exploiter : même s'il la connaît, sa meilleure réponse ne lui rapporte rien de plus. Elle garantit de ne pas perdre contre un adversaire parfait, au rake près. Elle ne garantit <strong>pas</strong> de gagner le maximum contre un adversaire faible.</p>
          <p>Le solveur push/fold de SIGMA 52 calcule un vrai équilibre : à 10 bb en tête-à-tête, la SB pousse 58,4 % des mains et la BB paie 37,4 %. Aucune des deux ne peut gagner plus en changeant seule de stratégie.</p>`],
        ['L\'indifférence', `<p>À l'équilibre, un joueur mixe ses décisions limites parce qu'il y est <strong>indifférent</strong> : les deux options rapportent autant. Le bluffeur choisit sa fréquence de bluff pour rendre le payeur indifférent entre payer et se coucher ; le payeur choisit sa fréquence de call pour rendre le bluffeur indifférent entre bluffer et checker.</p>
          <p class="formula">Bluffs dans la range de mise = B ÷ (P + 2B)  ·  Défense minimale (MDF) = P ÷ (P + B)</p>
          <table class="t"><thead><tr><th>Mise</th><th>Part de bluffs (river)</th><th>Défense minimale</th></tr></thead><tbody>
          <tr><td>⅓ pot</td><td>20 %</td><td>75 %</td></tr><tr><td>½ pot</td><td>25 %</td><td>67 %</td></tr><tr><td>Pot</td><td>33 %</td><td>50 %</td></tr><tr><td>2 × pot</td><td>40 %</td><td>33 %</td></tr></tbody></table>`],
        ['Équilibre contre exploitation', `<p>L'équilibre est une <strong>référence</strong> : il dit ce qu'est une stratégie non exploitable. L'exploitation consiste à s'en écarter là où l'adversaire s'en écarte :</p>
          <ul><li>il paie trop → tu mises plus gros pour la valeur, tu bluffes moins ;</li><li>il se couche trop → tu bluffes plus, tu prends moins de valeur fine ;</li><li>il bluffe trop → tu paies plus large.</li></ul>
          <p>Contre les joueurs de micro-limites, qui s'écartent énormément de l'équilibre, l'exploitation rapporte bien plus. Contre des réguliers solides, l'équilibre te protège. Un joueur complet connaît l'équilibre pour savoir <strong>de combien</strong> l'adversaire s'en écarte.</p>`],
        ['Ce que les solveurs changent', `<p>Les solveurs calculent des stratégies d'équilibre approchées pour des arbres de jeu simplifiés (tailles de mise limitées, ranges fixées). Ils ont montré : des mises petites et fréquentes sur les boards favorables, des stratégies mixtes, l'importance des bloqueurs. Ils s'utilisent <strong>hors session</strong> pour étudier : pendant le jeu, c'est de la triche (RTA).</p>`],
      ],
      mistakes: ['Chercher à jouer « GTO » contre des fish', 'Appliquer la MDF contre un joueur qui ne bluffe jamais', 'Croire qu\'un équilibre gagne le maximum'],
      keys: ['L\'équilibre protège, l\'exploitation rapporte', 'Bluffs = B ÷ (P + 2B), MDF = P ÷ (P + B)', 'Les solveurs, c\'est pour étudier, jamais pendant le jeu'],
      quiz: [
        ["Mise de 2 fois le pot à la river. Part de bluffs d'équilibre ?", ['20 %', '33 %', '40 %'], 2, "2 ÷ (1 + 4) = 40 %."],
        ["L'adversaire ne bluffe jamais à la river. Contre une mise pot, tu défends…", ['50 % (MDF)', 'Bien moins que la MDF'], 1, "La MDF suppose un bluffeur à l'équilibre. Contre un joueur qui ne bluffe pas, couche tout ce qui ne bat pas sa valeur."],
        ["À quoi sert l'équilibre contre des récréatifs ?", ['À jouer comme lui', 'À mesurer leurs écarts pour les exploiter'], 1, "C'est la référence qui chiffre leurs erreurs."],
      ],
    });

    K.mod({
      id: 'ranges', level: 3, title: 'Penser en ranges', minutes: 16, drill: 'tirage',
      goals: ['Remplacer « il a quoi ? » par « quelle range a-t-il ? »', 'Distinguer avantage de range et avantage de nuts', 'Reconnaître une range polarisée, condensée ou plafonnée'],
      sections: [
        ['Une range, pas une main', `<p>Personne ne peut deviner une main exacte. On raisonne sur la <strong>range</strong> : l'ensemble des mains qu'un joueur peut avoir après ses actions, chacune avec son nombre de combinaisons. Ta décision doit être bonne contre cette range entière, pas contre la main que tu crains.</p>`],
        ['Avantage de range et avantage de nuts', `<p><strong>Avantage de range</strong> : ta range a plus d'équité moyenne que la sienne sur ce board. <strong>Avantage de nuts</strong> : ta range contient plus de mains très fortes. Ils ne coïncident pas toujours.</p>
          <ul><li>BTN contre BB sur K-7-2 arc-en-ciel : le bouton a les deux (plus de rois, d'AA, d'AK). Petites mises fréquentes.</li>
          <li>BTN contre BB sur 7-6-5 deux couleurs : la BB a plus de suites et de deux paires (avantage de nuts), le bouton plus d'overpairs. Le bouton checke beaucoup.</li></ul>
          <p>L'outil Board te donne la répartition de chaque range : compare deux positions sur le même flop.</p>`],
        ['Formes de ranges', `<table class="t"><thead><tr><th>Forme</th><th>Contenu</th><th>Typique de</th></tr></thead><tbody>
          <tr><td>Polarisée</td><td>Très fort + bluffs, peu de moyen</td><td>Grosse mise river, 3-bet light</td></tr>
          <tr><td>Linéaire</td><td>Les meilleures mains d'abord, en continu</td><td>Ouverture préflop, value contre un fish</td></tr>
          <tr><td>Condensée</td><td>Surtout des mains moyennes</td><td>Call préflop, check-call</td></tr>
          <tr><td>Plafonnée</td><td>Sans les nuts</td><td>Joueur qui a seulement suivi alors qu'il aurait relancé ses nuts</td></tr></tbody></table>
          <p>Une range plafonnée se met sous pression avec de grosses mises : elle ne peut pas avoir les meilleures mains.</p>`],
        ['Exemple', `<p>Le CO ouvre, tu paies au bouton avec 9♠ 8♠, la BB passe. Flop A♦ K♣ 4♥. Le CO a tous les AA, KK, AK ; toi presque jamais (tu les aurais 3-bettés). Il a l'avantage de range et de nuts : sa petite mise te met en difficulté, et ta main n'a ni paire ni tirage. Fold sans regret.</p>`],
      ],
      mistakes: ['Mettre l\'adversaire sur une seule main', 'Ignorer ce que ses actions passées ont retiré de sa range', 'Bluffer une range non plafonnée avec une grosse mise'],
      keys: ['Raisonne contre la range entière', 'Avantage de nuts → grosses mises ; avantage de range → petites mises fréquentes', 'Range plafonnée = cible des grosses mises'],
      quiz: [
        ["Le relanceur préflop sur Q-7-2 arc-en-ciel a typiquement…", ['L\'avantage de range', 'Le désavantage'], 0, "Plus de dames fortes, d'AA, de KK dans sa range."],
        ["Une range qui ne contient que des mains très fortes et des bluffs est…", ['Condensée', 'Polarisée', 'Linéaire'], 1, "Deux pôles, peu de mains moyennes."],
        ["Pourquoi viser une range plafonnée avec une grosse mise ?", ['Elle ne contient pas les meilleures mains', 'Elle bluffe beaucoup'], 0, "Elle ne peut pas répondre par une relance de nuts."],
      ],
    });

    K.mod({
      id: 'sizing', level: 3, title: 'Tailles de mise', minutes: 15, drill: 'situations',
      goals: ['Choisir une taille selon la range et l\'objectif', 'Calculer une mise géométrique', 'Utiliser overbet, block bet et donk bet à bon escient'],
      sections: [
        ['Le principe', `<p>La taille de mise dépend de ta <strong>range</strong>, pas seulement de ta main. Petite mise : beaucoup de mains, avantage de range, l'adversaire doit défendre large (MDF élevée). Grosse mise : range polarisée, avantage de nuts, elle met la pression sur les mains moyennes.</p>
          <p>Contre des récréatifs, simplifie : <strong>la taille qu'ils paient avec pire</strong>. Une calling station paie 75-100 % du pot avec une deuxième paire : c'est ta taille de valeur.</p>`],
        ['La mise géométrique', `<p class="formula">Fraction du pot par rue = ((1 + 2 × tapis ÷ pot)^(1 ÷ rues) − 1) ÷ 2</p>
          <p>Elle répartit le tapis pour qu'il soit entièrement engagé à la river en misant la même fraction du pot à chaque rue. Pot relancé simple (6,5 bb) avec 97,5 bb de tapis et 3 rues : environ 107 % du pot à chaque rue. Moralité : pour mettre 100 bb en jeu en trois mises, il faut des mises de la taille du pot, pas des tiers.</p>`],
        ['Overbet, block bet, donk', `<ul>
          <li><strong>Overbet</strong> (plus que le pot) : avantage de nuts net et adversaire plafonné. Exemple : river qui complète une couleur que seul ton profil peut avoir.</li>
          <li><strong>Block bet</strong> (petite mise hors de position) : fixer le prix de la river avec une main moyenne, plutôt que de faire face à une grosse mise. Contre les régulièrs agressifs, ils relancent ; contre un fish, c'est souvent juste une value bet trop petite.</li>
          <li><strong>Donk bet</strong> (miser dans le relanceur, hors de position) : utile quand la carte favorise nettement ta range (turn qui complète tes suites). Chez un récréatif, c'est souvent une main moyenne ou un tirage.</li></ul>`],
        ['Exemple', `<p>Tu as 8♥ 8♣ sur 8♠ 6♦ 2♣ (pot relancé simple, 97,5 bb derrière) contre une calling station. Mise géométrique : environ 7 bb au flop, 22 bb au turn, 69 bb à la river : tout le tapis sans jamais miser plus que le pot. Trois petites mises de 33 % n'auraient engagé que 20 bb.</p>`],
      ],
      mistakes: ['Une seule taille de mise pour tout', 'Value bet petit contre un joueur qui paie gros', 'Overbet avec une range qui n\'a pas les nuts'],
      keys: ['Petite mise = range large ; grosse mise = range polarisée', 'Pour un tapis en 3 rues : environ des mises pot', 'Contre un fish : la taille qu\'il paie avec pire'],
      quiz: [
        ["Pot 20 bb, tapis 90 bb, deux rues pour tout engager. Mise géométrique ?", ['≈ 50 % du pot', '≈ 108 % du pot', '≈ 300 % du pot'], 1, "((1 + 2 × 4,5)^(1/2) − 1) ÷ 2 = (√10 − 1) ÷ 2 ≈ 1,08, soit environ 108 % du pot à chaque rue."],

        ["Quand l'overbet est-il justifié ?", ['Toujours avec une main forte', 'Avantage de nuts et adversaire plafonné'], 1, "Il demande une range polarisée vers les nuts face à une range qui ne peut pas les avoir."],
        ["Contre une calling station, ta taille de valeur ?", ['La plus petite possible', 'La plus grosse qu\'il paie avec pire'], 1, "Il paie gros : ne laisse pas d'argent sur la table."],
      ],
    });

    K.mod({
      id: 'lecture', level: 3, title: 'Lecture de mains pas à pas', minutes: 16, drill: 'situations',
      goals: ['Appliquer une méthode de lecture en 4 étapes', 'Réduire une range rue par rue', 'Prendre une décision chiffrée à la river'],
      sections: [
        ['La méthode en 4 étapes', `<ol><li><strong>Range préflop</strong> : position + action + profil. Un fish qui limpe : très large. Un régulier qui ouvre UTG : environ 16 %.</li>
          <li><strong>Flop</strong> : retire ce qu'il aurait joué autrement (un régulier relance ses sets, un fish les paie souvent).</li>
          <li><strong>Turn</strong> : même travail, avec la carte qui change les tirages.</li>
          <li><strong>River</strong> : compte les combos de valeur et de bluff restants, compare à tes cotes.</li></ol>`],
        ['Main complète', `<p>NL25. Un régulier UTG ouvre, tu paies au bouton avec A♥ J♥. Flop J♣ 8♦ 3♠ : il mise 33 %, tu paies. Turn 2♥ : il mise 66 %, tu paies. River K♦ : il mise 100 %.</p>
          <ul><li><strong>Préflop</strong> : range UTG ≈ 22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo.</li>
          <li><strong>Flop + turn</strong> (deux mises) : surtout valeur (JJ, 88, 33, AA-QQ, AJ, KJs, QJs) et quelques tirages (T9s, QTs).</li>
          <li><strong>River K</strong> : sa valeur gagne AK (12 combos moins ceux qui auraient checké), KK (3 après blocage), KJ, AA, QQ. Ses bluffs : T9s et QTs ratés, environ 8 combos, contre plus de 20 combos de valeur.</li>
          <li>Il te faut 33 %. Ses bluffs pèsent moins d'un tiers de sa range de mise, et un régulier UTG ne bluffe pas tous ses tirages ratés : <strong>fold</strong>.</li></ul>`],
        ['Les raccourcis qui trompent', `<ul><li>« Il ne peut pas avoir ça » : vérifie avec les combos, pas avec l'intuition.</li><li>« Il me bluffe toujours » : sur combien de mains l'as-tu vu ?</li><li>« Mon As bloque » : un bloqueur change quelques combos, pas une décision entière.</li></ul>`],
      ],
      mistakes: ['Partir d\'une range préflop trop large ou trop serrée', 'Oublier de retirer les mains qu\'il aurait jouées autrement', 'Payer « parce que ça pourrait être un bluff »'],
      keys: ['Range préflop, puis retirer rue par rue', 'Compter valeur et bluffs à la river', 'Comparer à l\'équité requise'],
      quiz: [
        ["River, il te faut 33 %. Tu comptes 18 combos de valeur et 4 de bluff. Décision ?", ['Payer', 'Se coucher'], 1, "4 ÷ 22 = 18 % de bluffs, sous les 33 % requis."],
        ["Première étape de la lecture ?", ['Le flop', 'La range préflop selon position, action et profil'], 1, "Tout part de là."],
      ],
    });

    K.mod({
      id: 'multiway', level: 3, title: 'Pots 3-bet et pots multiway', minutes: 12, drill: 'situations',
      goals: ['Jouer les SPR bas des pots 3-bet', 'Ajuster ses ranges à plusieurs adversaires'],
      sections: [
        ['Pots 3-bet', `<p>SPR souvent entre 3 et 5 : top paire bon kicker et overpairs veulent aller à tapis. Le 3-bettor a l'avantage de range sur les boards hauts (A, K) ; le caller sur les boards moyens connectés. Petites c-bets fréquentes sur A-K-x pour le 3-bettor, check plus fréquent sur 8-7-6.</p>`],
        ['Pots à 3 joueurs ou plus', `<ul><li>Chaque adversaire supplémentaire réduit fortement tes chances qu'aucun n'ait touché : les bluffs deviennent rares.</li><li>La valeur demande plus : top paire faible = main de contrôle du pot.</li><li>Les tirages nuts (couleur à l'As) gagnent en valeur : ils sont payés par plusieurs joueurs.</li><li>Joueur au milieu (pris entre deux) : sois encore plus serré.</li></ul>`],
      ],
      mistakes: ['Jouer un pot 3-bet comme un pot simple', 'C-bet automatique à quatre joueurs'],
      keys: ['Pot 3-bet = SPR bas = top paire forte va à tapis', 'Multiway : moins de bluffs, plus de valeur sérieuse'],
      quiz: [
        ["Pot 3-bet, SPR 3, tu as A♠ K♣ sur K♥ 8♦ 3♣. Plan ?", ['Contrôle du pot', 'Préparer le tapis'], 1, "À SPR 3, top paire top kicker est une main de tapis."],
        ["Quatre joueurs voient le flop. Ton bluff doit…", ['Être aussi fréquent qu\'en tête-à-tête', 'Devenir rare'], 1, "La probabilité qu'un des trois ait touché est élevée."],
      ],
    });

    K.mod({
      id: 'icm', level: 3, title: 'Tapis courts : Nash, ICM, bulle, primes', minutes: 18, drill: 'pushfold',
      goals: ['Jouer le tapis ou couché à l\'équilibre', 'Intégrer l\'ICM près de l\'argent', 'Convertir une prime de PKO en équité'],
      sections: [
        ['Pourquoi tapis ou couché', `<p>Sous 12 à 15 bb, une relance normale engage déjà un tiers du tapis : se coucher ensuite coûte trop cher. Le tapis direct maximise la fold equity et retire à l'adversaire le jeu postflop.</p>`],
        ['L\'équilibre de Nash', `<table class="t"><thead><tr><th>Tapis effectif</th><th>SB pousse</th><th>BB paie</th></tr></thead><tbody>
          <tr><td>5 bb</td><td>71,6 %</td><td>62,2 %</td></tr><tr><td>10 bb</td><td>58,4 %</td><td>37,4 %</td></tr><tr><td>15 bb</td><td>45,6 %</td><td>28,6 %</td></tr><tr><td>20 bb</td><td>40,3 %</td><td>21,7 %</td></tr></tbody></table>
          <p class="note">Tête-à-tête, sans ante, calculé par le solveur de SIGMA 52. La valeur à 10 bb correspond à la référence publiée.</p>
          <p>Principe : <strong>celui qui pousse est plus large que celui qui paie</strong>, car il gagne aussi quand l'adversaire se couche. Les antes élargissent les deux.</p>`],
        ['L\'ICM', `<p>En tournoi avec plusieurs places payées, doubler ton tapis ne double pas tes gains, mais le perdre les annule. Le modèle ICM (Malmuth-Harville) convertit les tapis en part du prize pool. Conséquence : près de la bulle et en table finale, on paie et on pousse moins large qu'à l'équilibre en jetons. Le <strong>risk premium</strong> est l'équité supplémentaire qu'il te faut pour risquer ton tapis.</p>
          <p>Dans Outils → Push/Fold & ICM, avec 3 joueurs à 12, 8 et 20 bb, la BB paie 45 % des mains si le gagnant prend tout, mais nettement moins avec 2 places payées (65/35). <strong>Expresso</strong> : le gagnant prend tout, l'ICM égale les jetons, l'équilibre en jetons s'applique.</p>`],
        ['La bulle', `<p>Juste avant les places payées, les tapis moyens subissent la plus forte pression ICM. Le gros tapis peut pousser très large : les autres ne peuvent pas payer sans risquer l'élimination. Le petit tapis peut parfois se coucher pour entrer dans l'argent, mais il ne doit pas attendre d'être à 2 bb.</p>`],
        ['Primes progressives (PKO)', `<p>Dans un tournoi à primes, éliminer un joueur rapporte de l'argent tout de suite (souvent la moitié de sa prime ; l'autre moitié s'ajoute à ta propre prime). Une prime réduit l'équité dont tu as besoin pour payer.</p>
          <p class="formula">Valeur d'1 € de prime en jetons (début de tournoi) ≈ tapis de départ ÷ part du buy-in qui va au prize pool</p>
          <p>Exemple : buy-in 10 € dont 5 € de prize pool et 5 € de prime, tapis de départ 10 000. 1 € ≈ 2 000 jetons. Un adversaire couvert pousse 5 000 jetons, pot avant ton call 5 300. Sans prime, il te faut 5 000 ÷ 10 300 ≈ 48,5 %. Avec la moitié de sa prime (2,5 € ≈ 5 000 jetons) : 5 000 ÷ 15 300 ≈ 32,7 %. Tu paies beaucoup plus large.</p>`],
      ],
      mistakes: ['Relancer 2,5 bb puis se coucher à 10 bb', 'Payer un tapis à la bulle comme en cash', 'Ignorer la prime en PKO'],
      keys: ['Sous 12-15 bb : tapis ou couché', 'Pousser est plus large que payer', 'ICM : près de l\'argent, moins de calls ; Expresso : équilibre en jetons', 'Une prime réduit l\'équité requise'],
      quiz: [
        ["Expresso, le gagnant prend tout. L'ICM…", ['Resserre fortement les calls', 'Égale les jetons : rien ne change'], 1, "Avec une seule place payée, l'équité ICM est la part de jetons."],
        ["À 10 bb en tête-à-tête, la SB pousse environ…", ['30 %', '58 %', '90 %'], 1, "58,4 % à l'équilibre."],
        ["En PKO, la prime de l'adversaire couvert rend ton call…", ['Plus serré', 'Plus large'], 1, "Elle ajoute de la valeur au pot que tu peux gagner."],
      ],
    });

    K.mod({
      id: 'expresso', level: 3, title: 'Expresso et Spin : stratégie à 3', minutes: 12, drill: 'pushfold',
      goals: ['Comprendre l\'économie du format', 'Jouer les phases à 3 et en tête-à-tête', 'Savoir pourquoi la variance est extrême'],
      sections: [
        ['L\'économie du format', `<p>Trois joueurs, tapis courts, niveaux rapides, gain multiplié tiré au sort avant la partie. Le rake est intégré dans la grille des multiplicateurs : le prize pool moyen est inférieur à la somme des buy-ins. Ton edge doit couvrir ce prélèvement. En 2025, selon l'ANJ, les Sit&Go (dont ces formats) pèsent 68 % du poker en ligne français : c'est là que sont les récréatifs venus des paris sportifs.</p>`],
        ['La partie à 3', `<ul><li>Profondeur de départ courte : le jeu postflop compte peu, le préflop décide presque tout.</li><li>Bouton : ouvre large, en mini-relance ou tapis selon la profondeur.</li><li>SB contre BB : c'est le duel du solveur push/fold. Entraîne-toi jusqu'à 90 %.</li><li>Contre les récréatifs qui paient trop : pousse moins de bluffs, élargis tes calls de valeur.</li></ul>`],
        ['Le tête-à-tête', `<p>Le bouton est la SB. Sous 12 bb, joue les tableaux de Nash (Outils → Push/Fold, mode en jetons). Au-dessus, relances petites et beaucoup de flops : l'adversaire récréatif joue mal postflop, profite-en.</p>`],
        ['La variance', `<p>Le multiplicateur rend chaque résultat très dispersé : la plupart des parties rapportent le petit multiplicateur, quelques-unes beaucoup plus. Il faut des milliers de parties pour juger un résultat. Bankroll : au moins 100 buy-ins, et une échelle de limites prudente.</p>`],
      ],
      mistakes: ['Jouer pour le jackpot au lieu de l\'EV', 'Appliquer l\'ICM des Sit&Go classiques', 'Juger son niveau sur 200 parties'],
      keys: ['Le préflop décide presque tout', 'Gagnant-prend-tout : équilibre en jetons', 'Variance extrême : bankroll large'],
      quiz: [
        ["Pourquoi l'edge doit-il être large en Expresso ?", ['Les joueurs sont forts', 'Le rake est intégré dans les multiplicateurs'], 1, "Le prize pool moyen est inférieur aux buy-ins."],
        ["Tête-à-tête à 9 bb. Outil de référence ?", ['Le tableau Nash en jetons', 'L\'ICM à deux places'], 0, "Une seule place est payée : jetons et argent coïncident."],
      ],
    });

    K.mod({
      id: 'mtt', level: 3, title: 'Tournois multi-tables', minutes: 13, drill: 'pushfold',
      goals: ['Adapter son jeu aux phases d\'un MTT', 'Gérer re-entries et late registration', 'Négocier un deal en table finale'],
      sections: [
        ['Les phases', `<table class="t"><thead><tr><th>Phase</th><th>Profondeur</th><th>Priorité</th></tr></thead><tbody>
          <tr><td>Début</td><td>100 bb et plus</td><td>Jouer comme en cash, exploiter les récréatifs, éviter les gros coups marginaux</td></tr>
          <tr><td>Milieu</td><td>20-50 bb</td><td>Voler les blindes et antes, 3-bet tapis sur les vols</td></tr>
          <tr><td>Bulle</td><td>Variable</td><td>Pression ICM : attaque les tapis moyens si tu es gros, serre si tu es moyen</td></tr>
          <tr><td>Table finale</td><td>Souvent courte</td><td>ICM maximal : chaque place compte</td></tr></tbody></table>`],
        ['Re-entry et late reg', `<p>Arriver tard réduit le temps de jeu profond mais aussi la variance de début. Chaque re-entry est un nouveau buy-in : compte-le dans ta bankroll et dans ton ROI.</p>`],
        ['Deals', `<p>En table finale, un deal répartit le prize pool restant. Deux méthodes : <strong>chip chop</strong> (au prorata des jetons, favorise les gros tapis) et <strong>ICM</strong> (selon l'équité ICM, plus juste pour les petits). Calcule l'ICM de chacun dans Outils avant d'accepter.</p>`],
        ['La mesure', `<p class="formula">ROI = (gains − buy-ins) ÷ buy-ins</p><p>Le ROI en tournoi est très dispersé : il faut plusieurs centaines à milliers de tournois pour qu'il ait un sens.</p>`],
      ],
      mistakes: ['Jouer trop serré en début de tournoi', 'Accepter un chip chop quand on est petit tapis', 'Oublier les re-entries dans le ROI'],
      keys: ['Chaque phase a sa priorité', 'Chip chop favorise les gros tapis, ICM est plus juste', 'ROI fiable seulement sur gros volume'],
      quiz: [
        ["Petit tapis en table finale, deal proposé en chip chop. Pour toi ?", ['Favorable', 'Défavorable par rapport à l\'ICM'], 1, "Le chip chop donne moins que l'ICM aux petits tapis."],
      ],
    });

    K.mod({
      id: 'etude', level: 3, title: 'Étudier comme un pro', minutes: 14, drill: 'situations',
      goals: ['Construire une routine d\'étude efficace', 'Analyser sa base de mains', 'Utiliser les outils d\'étude sans enfreindre les règles'],
      sections: [
        ['Le ratio jeu / étude', `<p>Au début, une heure d'étude pour deux à trois heures de jeu. L'étude sans jeu ne se teste pas ; le jeu sans étude répète les mêmes erreurs.</p>`],
        ['Revue de mains', `<ol><li>Importe tes historiques dans Analyse.</li><li>Filtre les plus gros pots perdus et gagnés, et tes fuites préflop.</li><li>Pour chaque main : écris ta lecture rue par rue, puis vérifie les combos et l'équité dans Outils.</li><li>Une leçon par main, notée dans le Journal.</li></ol>`],
        ['Base de données et tendances', `<p>Avec assez de mains, ta base montre ce que fait la population de ta limite (fréquences de c-bet, de fold, de bluff river). L'exploitation la plus rentable cible les écarts de toute la population, pas d'un seul joueur.</p>`],
        ['Solveurs, coaching, groupes', `<p>Les solveurs et bibliothèques de solutions (GTO Wizard et autres) servent hors session. Un coach ou un groupe d'étude accélère tout : partager quelques mains pour en discuter est courant ; échanger ou vendre des bases complètes est interdit par les rooms.</p>`],
      ],
      mistakes: ['Étudier des spots qu\'on ne rencontre jamais', 'Revoir seulement les mains perdues', 'Ouvrir un outil d\'étude avec une table active'],
      keys: ['Une heure d\'étude pour deux à trois de jeu', 'Une leçon écrite par main revue', 'Population d\'abord, individus ensuite'],
      quiz: [
        ["Quelles mains revoir en priorité ?", ['Uniquement les pots perdus', 'Les gros pots gagnés et perdus, et les fuites répétées'], 1, "Les gains aussi cachent des erreurs."],
        ["Échanger ta base de mains complète avec un ami pour enrichir vos stats est…", ['Autorisé', 'Interdit'], 1, "Le data mining sur des mains non jouées est interdit."],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
