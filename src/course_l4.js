// Cours — Niveau 4 : Professionnel. Objectif : comprendre le métier, son économie et le marché, décider lucidement d'en faire (ou non) une activité.
(function (root) {
  function register(K) {
    K.mod({
      id: 'marche', level: 6, title: 'Le marché français du poker', minutes: 12, drill: 'situations',
      goals: ['Connaître la taille et la structure du marché', 'Comprendre d\'où viennent les joueurs récréatifs', 'En tirer un choix de format et de room'],
      sections: [
        ['Les chiffres 2025 (ANJ)', `<table class="t"><thead><tr><th>Indicateur</th><th>2025</th><th>Évolution</th></tr></thead><tbody>
          <tr><td>Produit brut des jeux du poker en ligne</td><td>525 M€</td><td>+6,5 %</td></tr>
          <tr><td>Sit&Go (dont Expresso)</td><td>358 M€ (68 %)</td><td>+8,8 %</td></tr>
          <tr><td>Tournois (MTT)</td><td>68 M€</td><td>+18,5 %</td></tr>
          <tr><td>Cash game</td><td>100 M€ (19 %, contre 27 % en 2020)</td><td>−6,5 %</td></tr>
          <tr><td>Comptes joueurs actifs</td><td>2,5 millions</td><td>+16,5 %</td></tr>
          <tr><td>Joueurs uniques</td><td>1,9 million</td><td>+15,1 %</td></tr>
          <tr><td>Dépense moyenne par compte</td><td>213 €</td><td>−8,6 %</td></tr></tbody></table>
          <p class="note">Le produit brut des jeux est ce que les opérateurs gardent : mises moins gains reversés, donc essentiellement le rake et les frais de tournoi.</p>`],
        ['Ce que ces chiffres disent', `<ul>
          <li><strong>Plus de joueurs, qui dépensent moins</strong> : 2,5 millions de comptes actifs (+16,5 %) pour une dépense moyenne en baisse (213 €), dont 1,38 million qui jouent aussi aux paris sportifs ; la croissance passe par les formats rapides. Beaucoup de récréatifs à petit budget.</li>
          <li><strong>Le cash game recule</strong> : moins de tables, et une part croissante de réguliers. Le cash reste le meilleur format pour apprendre, mais pas forcément le plus riche en fish.</li>
          <li><strong>Les Sit&Go dominent</strong> : c'est là que se concentre l'argent récréatif, mais aussi le rake intégré aux multiplicateurs.</li></ul>`],
        ['Les rooms et la liquidité', `<p>Le marché est concentré sur quelques opérateurs agréés : PokerStars.fr, Winamax, Betclic, PMU, et d'autres plus petits. Depuis 2018, la liquidité est partagée avec l'Espagne (et le Portugal pour PokerStars) : plus de tables, plus de joueurs à toute heure. Le choix d'une room se fait sur trois critères : le nombre de récréatifs à ta limite et dans ton format, le coût réel (rake moins fidélité), les règles logicielles.</p>`],
      ],
      mistakes: ['Choisir sa room pour un bonus d\'inscription', 'Ignorer que le cash rétrécit', 'Confondre chiffre d\'affaires du marché et argent gagnable'],
      keys: ['Poker en ligne français : 525 M€ de produit brut en 2025', 'Sit&Go 68 %, cash 19 % et en recul', 'Plus de comptes, dépense moyenne en baisse : des récréatifs à petit budget'],
      quiz: [
        ["Part du cash game dans le produit brut du poker en ligne français en 2025 ?", ['19 %', '45 %', '68 %'], 0, "100 M€ sur 525 M€, contre 27 % en 2020."],
        ["Que montre le bilan ANJ 2025 sur les joueurs de poker ?", ['Moins de joueurs, qui dépensent plus', 'Plus de joueurs, qui dépensent moins en moyenne'], 1, "2,5 millions de comptes actifs (+16,5 %), dépense moyenne de 213 € (en baisse). Le bilan ne dit pas d'où viennent les nouveaux joueurs."],
        ["Le produit brut des jeux du poker correspond surtout à…", ['Les gains des joueurs', 'Le rake et les frais de tournoi'], 1, "C'est ce que gardent les opérateurs."],
      ],
    });

    K.mod({
      id: 'economie', level: 6, title: 'Économie du joueur : taux horaire, rake, volume', minutes: 14, drill: 'situations',
      goals: ['Calculer un taux horaire réaliste', 'Mesurer le poids du rake et de la fidélité', 'Comprendre pourquoi la limite compte plus que le winrate'],
      sections: [
        ['Du winrate au taux horaire', `<p class="formula">Taux horaire = winrate (bb/100) × mains par heure ÷ 100 × valeur de la bb</p>
          <p>Hypothèse : 4 bb/100 de winrate, 4 tables, 75 mains par table et par heure (300 mains par heure).</p>
          <table class="t"><thead><tr><th>Limite</th><th>Valeur de la bb</th><th>Taux horaire</th></tr></thead><tbody>
          <tr><td>NL10</td><td>0,10 €</td><td>1,20 €</td></tr><tr><td>NL25</td><td>0,25 €</td><td>3 €</td></tr><tr><td>NL50</td><td>0,50 €</td><td>6 €</td></tr>
          <tr><td>NL100</td><td>1 €</td><td>12 €</td></tr><tr><td>NL200</td><td>2 €</td><td>24 €</td></tr><tr><td>NL500</td><td>5 €</td><td>60 €</td></tr></tbody></table>
          <p>Lecture lucide : vivre du cash demande de battre au minimum les limites moyennes, où le niveau monte et le winrate baisse. En micro-limites, le poker est un apprentissage, pas un salaire.</p>`],
        ['Le rake et la fidélité', `<p>Le rake se mesure en bb/100 comme ton winrate. Un joueur qui paie 10 bb/100 de rake et gagne 4 bb/100 a battu ses adversaires de 14 bb/100 : le rake prend plus que lui. Les programmes de fidélité rendent une partie de ce rake (le « rakeback ») ; chez un grinder à gros volume, ce retour représente souvent une part importante du revenu. Compare les rooms sur le coût net : rake payé moins fidélité reçue.</p>`],
        ['Volume et qualité', `<p>Ajouter des tables augmente les mains par heure mais réduit le winrate. L'optimum est le nombre de tables où <strong>winrate × volume</strong> est maximal, mesuré sur ta propre base. Au-delà, chaque table de plus fait perdre de l'argent.</p>`],
        ['Le coût de la variance', `<p>Un taux horaire moyen cache des mois négatifs. Avec un écart-type de 90 bb/100, il faut environ <strong>195 000 mains</strong> pour qu'un winrate de 4 bb/100 soit statistiquement distinct de zéro (intervalle à 95 %). À 300 mains par heure, c'est plus de 600 heures de jeu.</p>`],
      ],
      mistakes: ['Calculer son revenu sur ses meilleures semaines', 'Ignorer le rake dans l\'analyse de sa rentabilité', 'Multiplier les tables jusqu\'à faire baisser son gain total'],
      keys: ['Taux horaire = winrate × volume × valeur de la bb', 'Le rake se compare au winrate en bb/100', '≈ 195 000 mains pour prouver 4 bb/100'],
      quiz: [
        ["5 bb/100, 300 mains/heure, NL50. Taux horaire ?", ['3 €', '7,50 €', '15 €'], 1, "5 × 300 ÷ 100 = 15 bb/h × 0,50 € = 7,50 €."],
        ["Tu gagnes 3 bb/100 et paies 9 bb/100 de rake. Ton edge sur tes adversaires ?", ['3 bb/100', '12 bb/100', '−6 bb/100'], 1, "Tu bats les joueurs de 12 bb/100 ; le rake en prend 9."],
        ["Pourquoi le poker en micro-limites n'est-il pas un salaire ?", ['Parce que c\'est illégal', 'Parce que la valeur de la bb rend le taux horaire très faible'], 1, "À NL10, même un bon winrate rapporte environ 1 € de l'heure."],
      ],
    });

    K.mod({
      id: 'carriere', level: 6, title: 'Devenir pro : prérequis et plan', minutes: 14, drill: 'situations',
      goals: ['Savoir quels critères chiffrés justifient de passer pro', 'Dimensionner bankroll et fonds de vie', 'Choisir entre pro, semi-pro et loisir sérieux'],
      sections: [
        ['Les critères avant de franchir le pas', `<ol>
          <li><strong>Un winrate prouvé</strong> sur un gros échantillon (voir le module Économie : ≈ 195 000 mains pour 4 bb/100) à une limite qui couvre tes dépenses.</li>
          <li><strong>Une bankroll de jeu</strong> confortable pour cette limite, plus large que pour un amateur (50 à 100 caves en cash).</li>
          <li><strong>Un fonds de vie séparé</strong> de 6 à 12 mois de dépenses : un downswing ne doit jamais t'obliger à retirer de la bankroll.</li>
          <li><strong>Une routine tenue</strong> pendant au moins trois mois à temps plein « à blanc », en gardant un autre revenu.</li></ol>
          <p class="note">Ces seuils sont des règles de prudence courantes, pas des normes officielles.</p>`],
        ['Semi-pro : la voie la plus solide', `<p>Garder une activité principale et jouer 10 à 20 heures par semaine permet de progresser sans pression financière. La pression d'un loyer à payer avec le poker dégrade les décisions : on joue moins bien quand on doit gagner.</p>`],
        ['Les revenus d\'un pro', `<p>Rarement un seul : gains de jeu, fidélité de la room, staking (module suivant), coaching, contenu. La part du jeu pur est souvent plus faible qu'on l'imagine.</p>`],
        ['Ce que le marché dit de la suite', `<p>Le cash game français recule et se « régularise ». Les places de pro se jouent de plus en plus dans les formats rapides et les tournois, où la variance est plus forte, ou à l'international en live. Un plan de carrière doit intégrer cette évolution.</p>`],
      ],
      mistakes: ['Passer pro après un gros gain en tournoi', 'Vivre sur sa bankroll', 'Abandonner toute autre compétence professionnelle'],
      keys: ['Winrate prouvé, bankroll, fonds de vie, routine', 'Semi-pro d\'abord', 'Plusieurs sources de revenus'],
      quiz: [
        ["Tu viens de gagner un gros tournoi. Bon moment pour passer pro ?", ['Oui', 'Non, un gain isolé ne prouve pas un edge'], 1, "Un tournoi est un tirage de variance ; seul un gros échantillon prouve un winrate."],
        ["Le fonds de vie sert à…", ['Monter de limite', 'Payer tes dépenses sans toucher à la bankroll'], 1, "La bankroll ne doit jamais financer le loyer."],
      ],
    });

    K.mod({
      id: 'staking', level: 6, title: 'Staking, backing, markup, makeup', minutes: 12, drill: 'situations',
      goals: ['Comprendre un contrat de staking', 'Calculer si un markup est rentable', 'Éviter les pièges du makeup'],
      sections: [
        ['Le principe', `<p>Un <strong>backer</strong> finance tout ou partie des buy-ins d'un joueur contre une part des gains. Le joueur apporte son talent et son temps, le backer le capital et le risque de perte. Les accords vont d'un tournoi isolé à des centaines sur une année.</p>`],
        ['Vendre de l\'action et le markup', `<p>Le <strong>markup</strong> est le prix payé au-dessus de la valeur faciale d'une part. À 1,2, un acheteur paie 120 € pour 100 € d'action : il ne gagne que si le ROI du joueur dépasse 20 %. Un joueur à 15 % de ROI vendu à 1,3 est une mauvaise affaire pour l'acheteur, quel que soit le résultat. Méfiance face à un markup supérieur à 1,3 sans historique vérifié.</p>`],
        ['Le makeup', `<p>Le <strong>makeup</strong> est le déficit cumulé : le joueur doit rembourser les pertes avant de toucher sa part des gains. Exemple : le backer finance 30 000 € sans aucun gain. Si le joueur gagne ensuite 50 000 €, les 30 000 premiers remboursent le backer, et seuls les 20 000 restants sont partagés selon le pourcentage. Un joueur très en makeup perd sa motivation : c'est la première source de conflits.</p>`],
        ['Un bon contrat', `<ul><li>Périmètre : quels tournois ou limites sont couverts.</li><li>Pourcentage et markup écrits, avec un exemple chiffré.</li><li>Sort du makeup en fin de période et selon les formats.</li><li>Conditions de sortie des deux côtés.</li><li>Rythme de reporting et de paiement.</li><li>Jeu hors accord : autorisé ou non.</li></ul>
          <p>Tout par écrit, avant le premier euro.</p>`],
      ],
      mistakes: ['Acheter de l\'action au markup sans connaître le ROI réel', 'Accepter un deal sans clause de fin de makeup', 'Tout négocier à l\'oral'],
      keys: ['Markup : rentable seulement si ROI > markup − 1', 'Makeup : les pertes se remboursent avant tout partage', 'Contrat écrit avec exemple chiffré'],
      quiz: [
        ["Markup 1,15. ROI minimum du joueur pour que l'acheteur soit gagnant ?", ['1,15 %', '15 %', '115 %'], 1, "Il faut que le ROI dépasse 15 %."],
        ["Makeup de 10 000 €, puis le joueur gagne 6 000 €. Combien est partagé ?", ['6 000 €', '0 €'], 1, "Les 6 000 € réduisent le makeup à 4 000 € ; rien n'est partagé."],
      ],
    });

    K.mod({
      id: 'business', level: 6, title: 'Revenus annexes : coaching, contenu, sponsoring', minutes: 11, drill: 'situations',
      goals: ['Évaluer les activités qui complètent les gains de jeu', 'Connaître les règles françaises sur la promotion des jeux d\'argent'],
      sections: [
        ['Coaching', `<p>Vendre ce que tu sais à des joueurs de limites inférieures. Prérequis : des résultats vérifiables et une méthode. Un coaching sérieux se vend sur la progression mesurable de l'élève (taux de réussite, fuites corrigées), pas sur une promesse de gains.</p>`],
        ['Contenu et streaming', `<p>Vidéos d'analyse, stream de sessions (avec un délai, pour ne pas révéler tes cartes en direct), articles, podcasts. Le contenu construit une audience et des revenus réguliers, moins variables que le jeu. Attention : un stream sans délai expose ta stratégie et tes cartes.</p>`],
        ['Sponsoring et rooms', `<p>Les rooms recrutent des joueurs ambassadeurs pour leur visibilité, pas seulement pour leur niveau. Audience, image et régularité comptent autant que les résultats.</p>`],
        ['Le cadre légal de la promotion', `<p>En France, la loi du 9 juin 2023 sur l'influence commerciale encadre strictement la promotion des jeux d'argent : elle n'est permise que sur des plateformes capables d'exclure les mineurs, avec cette exclusion activée, et avec une mention d'interdiction aux moins de 18 ans visible pendant toute la promotion. Le contrat avec l'opérateur doit le prévoir. La publicité pour un site non agréé est interdite.</p>`],
      ],
      mistakes: ['Promettre des gains à ses élèves', 'Streamer sans délai', 'Promouvoir une room sans respecter les règles de la loi influenceurs'],
      keys: ['Coaching sur la progression mesurable', 'Contenu = revenu plus stable que le jeu', 'Promotion des jeux : audience majeure obligatoire'],
      quiz: [
        ["Pour promouvoir une room sur un réseau social, il faut notamment…", ['Que la plateforme exclue les mineurs et une mention d\'interdiction aux moins de 18 ans', 'Seulement un lien d\'affiliation'], 0, "Conditions de la loi du 9 juin 2023."],
        ["Pourquoi streamer avec un délai ?", ['Pour la qualité vidéo', 'Pour ne pas révéler ses cartes en direct aux adversaires'], 1, "Sans délai, un adversaire peut regarder ton stream pendant la main."],
      ],
    });

    K.mod({
      id: 'fiscal', level: 6, title: 'Fiscalité et statut du pro en France', minutes: 10, drill: 'situations',
      goals: ['Savoir quand les gains deviennent imposables', 'Connaître le régime BNC et ses seuils', 'Organiser sa comptabilité dès le départ'],
      sections: [
        ['Le principe', `<p>Les gains d'un joueur occasionnel ne sont pas imposables. Depuis la décision du Conseil d'État de 2018, les gains tirés de la pratique <strong>habituelle</strong> d'un jeu opposant des joueurs, où le savoir-faire maîtrise l'aléa et qui rapporte des revenus significatifs, sont imposables en <strong>bénéfices non commerciaux (BNC)</strong>, même si tu exerces une autre activité. Des cours administratives ont déjà requalifié des joueurs réguliers en ligne.</p>`],
        ['Les régimes', `<ul><li><strong>Micro-BNC</strong> : pour les recettes de 2026, applicable jusqu'à 83 600 € ; un abattement forfaitaire de 34 % représente les frais. Le seuil était de 77 700 € pour les revenus 2023 à 2025.</li>
          <li><strong>Déclaration contrôlée</strong> : au-delà, ou sur option, tu déclares tes recettes et tes frais réels (formulaire 2035), utile si tes frais dépassent 34 %.</li>
          <li>Une activité professionnelle déclarée entraîne aussi des cotisations sociales d'indépendant.</li></ul>
          <p class="note">Ces règles évoluent et dépendent de ta situation. Je ne suis pas conseiller fiscal : valide avec un expert-comptable avant de passer pro.</p>`],
        ['La comptabilité dès le premier euro', `<p>Garde l'historique des dépôts et retraits de chaque room, ton journal de sessions (onglet Journal), les factures de formation, logiciels et déplacements. En cas de contrôle, la preuve des pertes compte autant que celle des gains.</p>`],
      ],
      mistakes: ['Croire que les gains de poker ne sont jamais imposables', 'Ne garder aucune trace de ses pertes', 'Passer pro sans avis d\'un expert-comptable'],
      keys: ['Pratique habituelle et revenus significatifs = BNC', 'Micro-BNC jusqu\'à 83 600 € (revenus 2026), abattement 34 %', 'Traçabilité complète dès le début'],
      quiz: [
        ["Un joueur régulier qui tire des revenus significatifs du poker en ligne est imposé en…", ['Salaires', 'BNC', 'Rien du tout'], 1, "Bénéfices non commerciaux, selon le Conseil d'État."],
        ["Abattement forfaitaire du micro-BNC ?", ['10 %', '34 %', '50 %'], 1, "34 % des recettes, minimum 305 €."],
      ],
    });

    K.mod({
      id: 'integrite', level: 6, title: 'Intégrité : triche, détection, protection', minutes: 9, drill: 'situations',
      goals: ['Reconnaître les formes de triche', 'Savoir comment les rooms détectent', 'Protéger son compte et sa réputation'],
      sections: [
        ['Les formes de triche', `<ul><li><strong>RTA</strong> : solveur ou IA consultés pendant la main.</li><li><strong>Collusion</strong> : partage d'informations entre joueurs d'une même table.</li><li><strong>Chip dumping</strong> : perdre volontairement des jetons à un complice.</li><li><strong>Bots</strong> et <strong>multi-comptes</strong>.</li></ul>`],
        ['La détection', `<p>Les rooms analysent les décisions (proximité anormale avec les solutions de solveur, temps de réaction), les appareils et les connexions. PokerStars a indiqué au régulateur de Pennsylvanie (2018) détecter environ 89 % des bots par ses propres systèmes et repérer environ 90 % des cas de collusion par alerte automatique ; GGPoker publie des bilans de comptes fermés et de sommes redistribuées aux victimes. Une suspicion suffit souvent à suspendre un compte le temps de l'enquête.</p>`],
        ['Te protéger', `<ul><li>Double authentification sur ton compte, mot de passe unique.</li><li>Jamais de partage de compte, même pour « une session ».</li><li>Ferme tout outil d'étude avant d'ouvrir le client.</li><li>Signale au support un comportement suspect avec les numéros de mains.</li></ul>`],
      ],
      mistakes: ['Laisser un proche jouer sur son compte', 'Garder un outil d\'étude ouvert « en arrière-plan »'],
      keys: ['RTA, collusion, chip dumping, bots, multi-comptes', 'Détection par les décisions et les appareils', 'Compte personnel et sécurisé'],
      quiz: [
        ["Un ami joue une session sur ton compte pendant tes vacances. C'est…", ['Toléré', 'Une violation qui peut fermer le compte'], 1, "Un compte est strictement personnel."],
      ],
    });

    K.mod({
      id: 'longevite', level: 6, title: 'Durer : santé, routine, sortie', minutes: 9, drill: 'situations',
      goals: ['Construire une routine soutenable', 'Repérer les signaux d\'un jeu qui devient problématique', 'Préparer l\'après'],
      sections: [
        ['La routine soutenable', `<p>Horaires fixes, sommeil régulier, activité physique, pauses programmées, jours sans jeu. Le poker est un sport de décisions : la fatigue et l'isolement coûtent des bb/100 bien avant d'être ressentis.</p>`],
        ['Les signaux d\'alerte', `<ul><li>Jouer pour se refaire ou pour fuir quelque chose.</li><li>Dépasser régulièrement ses règles d'arrêt.</li><li>Mentir sur ses résultats ou son temps de jeu.</li><li>Puiser dans l'argent du quotidien.</li></ul>
          <p>Si un de ces signaux apparaît : stop, et parle-en. Joueurs Info Service : 09 74 75 13 13. L'auto-exclusion ANJ couvre toutes les rooms.</p>`],
        ['Préparer la sortie', `<p>Les compétences du poker se transfèrent : décision sous incertitude, probabilités, gestion du risque, discipline, lecture des comportements. Documente-les (résultats, méthodes, contenus) pour qu'elles comptent dans une autre activité.</p>`],
      ],
      mistakes: ['Sacrifier le sommeil au volume', 'Ignorer les signaux d\'alerte parce qu\'on est « pro »'],
      keys: ['Routine fixe et jours sans jeu', 'Les signaux d\'alerte valent pour les pros aussi', 'Les compétences se transfèrent'],
      quiz: [
        ["Tu dépasses régulièrement ton stop-loss. Signal ?", ['Normal en downswing', 'Alerte : jeu qui échappe au contrôle'], 1, "C'est un des premiers signaux d'un jeu problématique."],
      ],
    });

    K.mod({
      id: 'progression', level: 6, title: 'Plan de progression : de débutant à pro', minutes: 8, drill: 'situations',
      goals: ['Suivre des étapes mesurables', 'Savoir à quel moment passer à l\'étape suivante'],
      sections: [
        ['Les étapes', `<table class="t"><thead><tr><th>Étape</th><th>Contenu</th><th>Critère de passage</th></tr></thead><tbody>
          <tr><td>1. Fondations</td><td>Niveau 1 du cours, Spots de base, jeu en freerolls ou NL2</td><td>90 % en Ouverture, Cotes du pot et Tapis ou couché</td></tr>
          <tr><td>2. Joueur gagnant</td><td>Niveau 2, NL2-NL5, 1-2 tables, revue de 3 mains par session</td><td>Winrate positif sur 30 000 mains, bankroll pour NL10</td></tr>
          <tr><td>3. Avancé</td><td>Niveau 3, NL10-NL25, analyse des historiques chaque semaine</td><td>Winrate positif sur 100 000 mains, aucune fuite préflop récurrente</td></tr>
          <tr><td>4. Semi-pro</td><td>Niveau 4, NL50+ ou formats rapides, 10-20 h par semaine</td><td>Winrate prouvé statistiquement à une limite qui couvre tes dépenses</td></tr>
          <tr><td>5. Pro</td><td>Activité déclarée, plusieurs sources de revenus</td><td>Bankroll + 6 à 12 mois de fonds de vie, routine tenue 3 mois</td></tr></tbody></table>`],
        ['Mesurer ce qui compte', `<p>Mesure tes <strong>décisions</strong> (Spots, fuites préflop, revues) chaque semaine, et ton <strong>argent</strong> seulement sur de grands échantillons. La progression se voit d'abord dans la qualité des décisions, ensuite dans les résultats.</p>`],
      ],
      mistakes: ['Sauter une étape parce que les résultats sont bons sur peu de mains', 'Mesurer sa progression à l\'argent de la semaine'],
      keys: ['Cinq étapes, chacune avec un critère chiffré', 'Décisions chaque semaine, argent sur gros volume'],
      quiz: [
        ["Critère pour quitter l'étape 2 ?", ['Une bonne semaine', 'Winrate positif sur 30 000 mains et bankroll pour la limite suivante'], 1, "Un critère chiffré, pas une impression."],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
