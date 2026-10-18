// Cours — Niveau 1 : Fondations. Objectif : connaître le jeu, son cadre et ses maths de base, ne plus faire d'erreurs grossières.
(function (root) {
  function register(K) {
    K.mod({
      id: 'cadre', level: 1, title: 'Le cadre : légal, interdit, fiscal', minutes: 10, drill: 'situations',
      goals: ['Savoir où jouer légalement en France et pourquoi', 'Connaître précisément ce qui fait fermer un compte', 'Comprendre quand les gains deviennent imposables'],
      sections: [
        ['Où jouer', `<p>En France, le poker en ligne n'est légal que chez les opérateurs agréés par l'<strong>ANJ</strong> (Autorité nationale des jeux) : PokerStars.fr, Winamax, Betclic, PMU, et quelques autres. La liste à jour est sur anj.fr. Un site hors liste ne te protège pas : gains bloqués, aucun recours, et l'ANJ fait bloquer ces sites.</p>
          <p>Depuis 2018, certaines rooms partagent leurs tables avec d'autres pays : PokerStars avec l'Espagne et le Portugal, Winamax, PMU et partypoker avec l'Espagne. Plus de joueurs veut dire plus de tables ouvertes à toute heure, donc plus de récréatifs à trouver.</p>`],
        ['La règle d\'or du fair-play', `<p><strong>Pendant une main, toi seul décides.</strong> Tout ce qui t'aide pendant le jeu est sanctionné : fermeture du compte et, chez la plupart des rooms, confiscation du solde. Ces règles sont appliquées : GGPoker a déjà banni des dizaines de comptes et confisqué plus d'un million de dollars pour aide en temps réel.</p>
          <table class="t"><thead><tr><th>Interdit</th><th>Pourquoi c'est sanctionné</th></tr></thead><tbody>
          <tr><td>Solveur, tableau de ranges, appli ou IA consultés pendant le jeu (RTA)</td><td>Avantage déloyal. PokerStars interdit même un chart préflop ouvert</td></tr>
          <tr><td>Conseils d'une autre personne pendant une main</td><td>Aide extérieure</td></tr>
          <tr><td>Échanger ses cartes ou jouer « en équipe »</td><td>Collusion</td></tr>
          <tr><td>Plusieurs comptes, prêter le sien</td><td>Fraude à l'identité</td></tr>
          <tr><td>Bot, script qui clique à ta place</td><td>Jeu automatisé</td></tr>
          <tr><td>Acheter des bases de mains jouées par d'autres</td><td>Data mining</td></tr></tbody></table>
          <p><strong>Autorisé</strong> : le HUD intégré de Winamax, les logiciels que la room liste comme autorisés, toute étude avant ou après la session. Les HUD « dynamiques », qui changent selon le board, sont interdits sur Winamax. Doute sur un logiciel ? Demande au support avant de l'installer et garde la réponse écrite.</p>`],
        ['La fiscalité', `<p>Principe : les gains de jeu d'un joueur occasionnel ne sont pas imposables, car ils dépendent du hasard. Le poker fait exception : pour le Conseil d'État (2018), les gains tirés d'une pratique <strong>habituelle</strong>, où le savoir-faire maîtrise l'aléa et qui rapporte des revenus significatifs, sont imposables en bénéfices non commerciaux (BNC), même si tu as un autre métier. Le module « Fiscalité et statut du pro » du niveau 4 détaille la suite.</p>`],
        ['Jeu responsable', `<p>Avant la première session, fixe dans le client des plafonds de dépôt et de perte. En général une baisse s'applique tout de suite et une hausse avec un délai : c'est voulu, pour te protéger d'un soir de tilt. Joueurs Info Service : 09 74 75 13 13, appel non surtaxé. L'auto-exclusion se demande auprès de l'ANJ et couvre tous les opérateurs.</p>`],
      ],
      mistakes: ['Jouer sur un site non agréé « parce que le bonus est meilleur »', 'Garder un tableau de ranges ouvert « juste pour vérifier »', 'Croire qu\'un HUD tiers est autorisé partout parce qu\'il l\'est sur une room'],
      keys: ['Uniquement les rooms agréées ANJ', 'Rien d\'autre que toi pendant une main', 'Les gains habituels et significatifs deviennent imposables en BNC'],
      quiz: [
        ["Tu veux vérifier un spot dans un solveur pendant qu'une table est ouverte. C'est…", ['Autorisé si tu ne joues pas la main en cours', 'Interdit'], 1, "Les rooms sanctionnent l'aide pendant le jeu, et PokerStars interdit même d'avoir un solveur ou un chart ouvert avec le client. Note la main, étudie après."],
        ["Un site non agréé propose un meilleur bonus. Le risque principal ?", ['Le rake est plus élevé', 'Aucun recours si tes gains sont bloqués', 'Les joueurs y sont plus forts'], 1, "Hors agrément ANJ, rien ne garantit le paiement de tes gains."],
        ["Le HUD intégré de Winamax pendant le jeu est…", ['Autorisé', 'Interdit'], 0, "Il est fourni par la room elle-même. Ce sont les HUD dynamiques de logiciels tiers qui sont interdits."],
        ["Selon le Conseil d'État, les gains de poker sont imposables quand…", ['Tu gagnes plus de 1 000 € dans l\'année', 'La pratique est habituelle, maîtrisée et rapporte des revenus significatifs', 'Tu joues en tournoi'], 1, "Le critère est l'habitude, le savoir-faire et l'importance des revenus, pas un montant fixe."],
      ],
    });

    K.mod({
      id: 'regles', level: 1, title: 'Règles complètes du Hold\'em No Limit', minutes: 14, drill: 'situations',
      goals: ['Dérouler une main sans hésiter, y compris en tête-à-tête', 'Connaître les relances minimales et les tapis incomplets', 'Calculer un pot annexe'],
      sections: [
        ['Une main, du début à la fin', `<ol>
          <li><strong>Blindes</strong> : la petite blinde (SB) et la grosse blinde (BB) misent avant de voir leurs cartes. Les limites se nomment par la BB : NL10 = blindes 0,05/0,10 €, tapis normal 10 € (100 bb). En tournoi s'ajoute souvent une <strong>ante</strong> payée par chacun ou par la seule BB.</li>
          <li><strong>Préflop</strong> : 2 cartes privées. Le joueur à gauche de la BB (UTG) parle en premier, la BB en dernier.</li>
          <li><strong>Flop</strong> (3 cartes communes), <strong>turn</strong> (4e), <strong>river</strong> (5e). À partir du flop, le premier joueur encore en jeu à gauche du bouton parle d'abord ; le bouton parle en dernier.</li>
          <li><strong>Abattage</strong> : meilleure combinaison de 5 cartes parmi les 7. Tu peux utiliser 0, 1 ou 2 de tes cartes.</li></ol>`],
        ['Tête-à-tête : l\'exception', `<p>À deux joueurs, le bouton est aussi la petite blinde. Il parle <strong>en premier préflop</strong> et <strong>en dernier après le flop</strong>. C'est la situation de toutes les fins de Sit&Go et d'Expresso.</p>`],
        ['Les actions et leurs règles', `<ul>
          <li><strong>Check</strong> (parole) : seulement si personne n'a misé dans le tour.</li>
          <li><strong>Relance minimale</strong> : l'augmentation doit égaler au moins la dernière mise ou relance du tour. Blindes 0,05/0,10, ouverture à 0,30 (augmentation de 0,20) : la sur-relance minimale est 0,50.</li>
          <li><strong>Tapis incomplet</strong> : un joueur qui fait tapis pour moins qu'une relance complète ne rouvre pas les enchères pour ceux qui ont déjà parlé. Ils peuvent seulement suivre ou se coucher.</li>
          <li>En No Limit, tu peux miser tout ton tapis à tout moment, mais tu ne peux jamais perdre plus que ce qui est devant toi.</li></ul>`],
        ['Tapis et pots annexes', `<p>Un joueur à tapis ne gagne sur chaque adversaire que ce qu'il a lui-même misé. Exemple : A a 20 €, B et C ont 50 € et 80 €. Tous à tapis.</p>
          <ul><li>Pot principal : 3 × 20 = 60 € (A, B, C en lice).</li><li>Pot annexe : 2 × 30 = 60 € (B et C seulement).</li><li>Les 30 € que C a en trop lui sont rendus : personne ne peut les suivre.</li></ul>
          <p>Si A a la meilleure main, il prend 60 €. Le pot annexe va au meilleur des deux autres.</p>`],
        ['Abattage et cas particuliers', `<ul>
          <li>Quand la river a été misée et suivie, le dernier joueur à avoir misé ou relancé montre en premier. En ligne, c'est automatique.</li>
          <li>Égalité parfaite : on partage, au centime près ; le jeton indivisible va selon la règle de la room.</li>
          <li>Une main jetée face cachée dans les cartes mortes est perdue, même si elle était gagnante. En live, ne lâche jamais tes cartes avant d'avoir vu le pot attribué.</li>
          <li>Les couleurs (pique, cœur…) n'ont aucun rang entre elles.</li></ul>`],
        ['Étiquette', `<p>En ligne : pas de commentaire sur le jeu des autres dans le chat. En live : annonce ton action avant de bouger les jetons (une mise « en plusieurs fois » est refusée), un seul gros jeton posé sans annonce vaut un call, cartes visibles sur la table, ne parle jamais d'une main en cours.</p>`],
      ],
      mistakes: ['Oublier qu\'en tête-à-tête le bouton parle en premier préflop', 'Relancer d\'un montant inférieur à la relance minimale', 'Jeter sa main en live avant l\'attribution du pot'],
      keys: ['Relance minimale = au moins la dernière augmentation', 'Un tapis incomplet ne rouvre pas les enchères', 'Chacun ne gagne sur un adversaire que ce qu\'il a misé'],
      quiz: [
        ["Blindes 1/2. Le premier relance à 6, le suivant sur-relance à 16. Relance minimale suivante ?", ['26', '22', '32'], 0, "Dernière augmentation : 16 − 6 = 10. Minimum : 16 + 10 = 26."],
        ["Tête-à-tête. Qui parle en premier au flop ?", ['Le bouton (petite blinde)', 'La grosse blinde'], 1, "Le bouton parle en premier préflop, mais en dernier après le flop."],
        ["A (30 €) est à tapis contre B (100 €) et C (100 €), qui vont aussi à tapis. Taille du pot principal ?", ['90 €', '230 €', '60 €'], 0, "3 × 30 = 90 € ; le reste (2 × 70 = 140 €) forme le pot annexe entre B et C."],
        ["Un joueur fait tapis pour 1,5 fois la mise précédente, sous la relance minimale. Celui qui avait misé peut-il sur-relancer ?", ['Oui', 'Non, seulement suivre ou se coucher'], 1, "Un tapis incomplet ne rouvre pas les enchères pour les joueurs qui ont déjà agi."],
      ],
    });

    K.mod({
      id: 'mains', level: 1, title: 'Classement des mains et lecture du board', minutes: 8, drill: 'meilleure',
      goals: ['Classer n\'importe quelle main sans réfléchir', 'Repérer la meilleure main possible sur un board (les nuts)', 'Éviter les pièges de kicker et de board'],
      sections: [
        ['Du plus fort au plus faible', `<table class="t"><thead><tr><th>Combinaison</th><th>Exemple</th><th>Fréquence sur 7 cartes</th></tr></thead><tbody>
          <tr><td>Quinte flush</td><td>9♥ 8♥ 7♥ 6♥ 5♥</td><td>0,03 %</td></tr><tr><td>Carré</td><td>K♠ K♥ K♦ K♣ 4♦</td><td>0,17 %</td></tr>
          <tr><td>Full</td><td>Q♠ Q♥ Q♦ 7♣ 7♦</td><td>2,6 %</td></tr><tr><td>Couleur</td><td>A♦ J♦ 8♦ 5♦ 2♦</td><td>3,0 %</td></tr>
          <tr><td>Suite</td><td>T♠ 9♥ 8♦ 7♣ 6♠</td><td>4,6 %</td></tr><tr><td>Brelan</td><td>7♠ 7♥ 7♦ K♣ 2♠</td><td>4,8 %</td></tr>
          <tr><td>Double paire</td><td>A♠ A♥ 9♦ 9♣ 3♠</td><td>23,5 %</td></tr><tr><td>Paire</td><td>J♠ J♥ A♦ 8♣ 4♠</td><td>43,8 %</td></tr>
          <tr><td>Hauteur</td><td>A♠ Q♥ 9♦ 6♣ 3♠</td><td>17,4 %</td></tr></tbody></table>
          <p class="note">Probabilité que 7 cartes au hasard donnent au mieux cette combinaison (recalculé sur 400 000 tirages).</p>`],
        ['Trouver les nuts', `<p>Les <strong>nuts</strong> sont la meilleure main possible sur un board donné. Méthode, dans l'ordre : y a-t-il une paire au board (full et carré possibles) ? Trois cartes d'une même couleur (couleur possible) ? Trois cartes dans un intervalle de cinq (suite possible) ? Sinon, le brelan max est les nuts.</p>
          <p>Board K♠ 9♠ 4♦ 2♠ 7♥ : pas de paire, trois piques. Les nuts sont la couleur à l'As (A♠ avec n'importe quel pique). Board 8♥ 7♣ 6♦ K♠ K♦ : paire de rois, donc carré de rois puis full aux rois en tête.</p>`],
        ['Les pièges classiques', `<ul>
          <li>Board A-A-K-K-5, tu as D-V, l'adversaire 7-2 : tu gagnes, ta Dame bat son 5 en cinquième carte.</li>
          <li>Board avec 4 cœurs : un seul cœur en main suffit. Le plus haut cœur de chacun départage.</li>
          <li>Suite au board : tu ne gagnes que si tu la prolonges vers le haut.</li>
          <li><strong>Set</strong> (paire servie + une carte du board) et <strong>trips</strong> (une carte en main + paire au board) sont deux brelans. Le trips est visible et son kicker compte.</li>
          <li>La roue A-2-3-4-5 est la plus petite suite ; l'As n'y vaut que 1.</li></ul>`],
        ['Tes chances au flop', `<table class="t"><thead><tr><th>Ta main</th><th>Ce qui arrive au flop</th><th>Fréquence</th></tr></thead><tbody>
          <tr><td>Paire servie</td><td>Brelan ou mieux</td><td>11,8 % (≈ 1 fois sur 8,5)</td></tr>
          <tr><td>Deux cartes assorties</td><td>Tirage couleur</td><td>10,9 %</td></tr>
          <tr><td>Deux cartes assorties</td><td>Couleur faite</td><td>0,8 %</td></tr>
          <tr><td>A-K</td><td>Au moins un As ou un Roi</td><td>32,4 %</td></tr></tbody></table>
          <p>Conséquence : la plupart du temps, tu ne touches rien. Le poker se gagne en jouant bien ces 2 flops sur 3.</p>`],
      ],
      mistakes: ['Surestimer une couleur basse sur un board à 4 cartes de la couleur', 'Oublier la paire du board qui rend le full possible', 'Croire qu\'une paire servie touche souvent un brelan'],
      keys: ['Paire au board = full possible ; trois de la même couleur = couleur possible', 'Le kicker départage dans la limite de 5 cartes', 'Une paire servie touche le brelan 1 fois sur 8,5'],
      quiz: [
        ["Board J♣ T♣ 9♦ 2♣ 2♥. Les nuts ?", ['Couleur à l\'As', 'Carré de 2', 'Quinte flush'], 1, "Paire de 2 au board : 2♠ 2♦ en main font un carré, qui bat tout. Aucune quinte flush n'est possible : il faudrait un 9♣ au board ou trois trèfles en main."],
        ["Tu as 7♠ 7♦, board 7♣ K♥ 2♠. Tu as…", ['Un set', 'Des trips'], 0, "Paire servie + une carte du board : set, très caché."],
        ["Board 5♠ 6♦ 7♥ 8♣ 9♠. Tu as A♠ A♥, l'adversaire T♣ 2♦. Résultat ?", ['Partage', 'L\'adversaire gagne', 'Tu gagnes'], 1, "Son 10 prolonge la suite : 6-7-8-9-T bat 5-6-7-8-9."],
        ["Fréquence d'un brelan ou mieux au flop avec une paire servie ?", ['≈ 6 %', '≈ 12 %', '≈ 25 %'], 1, "11,8 %, environ 1 fois sur 8,5."],
      ],
    });

    K.mod({
      id: 'positions', level: 1, title: 'Positions et initiative', minutes: 8, drill: 'rfi',
      goals: ['Nommer les 6 positions et l\'ordre de parole', 'Comprendre pourquoi parler en dernier rapporte', 'Savoir ce qu\'est l\'initiative'],
      sections: [
        ['Les 6 sièges', `<p>Dans l'ordre de parole préflop : <strong>UTG</strong> (sous le pistolet), <strong>HJ</strong> (hijack), <strong>CO</strong> (cutoff), <strong>BTN</strong> (bouton), <strong>SB</strong>, <strong>BB</strong>. Après le flop, la SB parle en premier et le bouton en dernier.</p>
          <table class="t"><thead><tr><th>Position</th><th>Mains ouvertes (premier à entrer)</th></tr></thead><tbody id="rfi-pct"></tbody></table>`],
        ['Pourquoi la position rapporte', `<p>Parler après l'adversaire, c'est voir son action avant de décider. Concrètement, en position :</p>
          <ul><li>tu prends une carte gratuite quand il checke et que tu tires ;</li><li>tu contrôles la taille du pot avec une main moyenne ;</li><li>tes bluffs sont plus crédibles et mieux ciblés (il a montré de la faiblesse) ;</li><li>tu extrais plus de valeur, car tu sais déjà s'il a misé.</li></ul>
          <p>Dans presque toutes les bases de données de joueurs gagnants, le bouton est la position la plus rentable et les blindes les seules perdantes. Les blindes perdent parce qu'elles paient une mise forcée et jouent hors de position : l'objectif y est de perdre moins.</p>`],
        ['L\'initiative', `<p>Le dernier joueur à avoir relancé préflop a l'<strong>initiative</strong>. Sa range est plus forte que celle de celui qui a suivi, et l'adversaire s'attend à ce qu'il mise au flop : c'est le « continuation bet ». Initiative + position est la combinaison la plus rentable du poker.</p>`],
        ['Exemple', `<p>Tu as K♥ J♥. Si tu es UTG, cinq joueurs parlent derrière toi : souvent quelqu'un a mieux (AK, AJ, KQ), et tu joueras hors de position. Au bouton, seuls les blindes restent : la même main devient une ouverture évidente, avec la position garantie après le flop.</p>`],
      ],
      mistakes: ['Jouer les mêmes mains à toutes les positions', 'Défendre la grosse blinde comme si elle avait la position', 'Payer des relances hors de position avec des mains moyennes'],
      keys: ['Plus près du bouton = plus de mains jouables', 'Les blindes perdent chez presque tous les joueurs', 'Initiative + position = situation la plus rentable'],
      quiz: [
        ["Qui parle en dernier au flop à 6 joueurs ?", ['La grosse blinde', 'Le bouton', 'UTG'], 1, "Après le flop, le bouton parle toujours en dernier."],
        ["Pourquoi ouvrir plus large au bouton qu'UTG ?", ['Les blindes sont plus faibles', 'Moins de joueurs derrière et la position garantie après le flop', 'Le rake est plus bas'], 1, "Deux joueurs seulement peuvent réagir, et tu joueras en position."],
        ["Qui a l'initiative après : le CO relance, le BTN suit, les blindes se couchent ?", ['Le BTN', 'Le CO'], 1, "Le dernier relanceur préflop a l'initiative, même s'il parle en premier au flop."],
      ],
    });

    K.mod({
      id: 'preflop', level: 1, title: 'Préflop de base : ouvrir, isoler, ne jamais limper', minutes: 12, drill: 'rfi',
      goals: ['Appliquer des ranges d\'ouverture par position', 'Choisir la bonne taille de relance', 'Savoir isoler un limper'],
      sections: [
        ['Premier à entrer : relance ou couche-toi', `<p>Si personne n'est entré avant toi, deux options seulement : <strong>relancer</strong> ou <strong>se coucher</strong>. Le limp (suivre la BB) abandonne l'initiative, invite les blindes à voir un flop bon marché et rend ta main lisible. Taille standard : 2 à 2,5 bb en ligne, 3 bb depuis la SB. Toujours la même taille, quelle que soit ta main.</p>
          <p>Les ranges de l'onglet Outils → Ranges sont ton point de départ : environ 16 % des mains UTG, 20 % HJ, 28 % CO, 44 % BTN, 40 % SB.</p>`],
        ['Ce qui rend une main jouable', `<ul>
          <li><strong>Force brute</strong> : paires et As forts gagnent sans toucher.</li>
          <li><strong>Jouabilité</strong> : les assorties et connectées (T9s, 87s) font des couleurs et des suites cachées, faciles à jouer.</li>
          <li><strong>Domination</strong> : A7o perd gros contre AK, AQ, AJ. Les As faibles dépareillés sont des pièges hors du bouton.</li></ul>
          <p>À éviter loin du bouton : les mains dépareillées non connectées (K8o, Q7o, J6o), même si elles « ont l'air jolies ».</p>`],
        ['Isoler les limpers', `<p>Un ou plusieurs joueurs ont limpé : en micro-limites, c'est souvent un fish. Relance pour jouer seul contre lui, idéalement en position.</p>
          <p class="formula">Taille d'isolation ≈ 3,5 bb + 1 bb par limper (plus gros contre un fish qui paie tout)</p>
          <p>Range : plus serrée que ton ouverture, orientée vers les mains qui font de grosses paires (As forts, broadways, paires). Les petites assorties perdent de la valeur quand le pot devient multiway.</p>`],
        ['Les matchs préflop à connaître', `<table class="t"><thead><tr><th>Situation</th><th>Exemple</th><th>Équité</th></tr></thead><tbody>
          <tr><td>Paire contre deux cartes supérieures</td><td>QQ contre AKo</td><td>57 % / 43 %</td></tr>
          <tr><td>Paire contre paire inférieure</td><td>JJ contre 55</td><td>80 % / 20 %</td></tr>
          <tr><td>Main dominée</td><td>AKo contre AQo</td><td>74 % / 26 %</td></tr>
          <tr><td>Deux hautes contre deux basses</td><td>AKo contre 87s</td><td>59 % / 41 %</td></tr>
          <tr><td>Petite paire contre deux hautes</td><td>22 contre AKo</td><td>53 % / 47 %</td></tr>
          <tr><td>AA contre la pire main</td><td>AA contre 72o</td><td>88 % / 12 %</td></tr></tbody></table>
          <p class="note">Valeurs de la matrice préflop de SIGMA 52 (moyenne sur les couleurs, effet de blocage inclus).</p>`],
        ['Exemple', `<p>NL10, deux joueurs limpent, tu as A♠ Q♦ au cutoff. Relance à 3,5 + 2 = 5,5 bb, soit 0,55 €. Si un seul limper paie, tu joues un pot de 12 bb en position avec la meilleure range. Un limp derrière aurait créé un pot à 5 joueurs où AQ gagne bien moins souvent.</p>`],
      ],
      mistakes: ['Limper en premier « pour voir le flop »', 'Varier la taille d\'ouverture selon sa main', 'Ouvrir A7o UTG et payer ensuite les relances'],
      keys: ['Premier à entrer : relance ou fold', 'Isolation : 3,5 bb + 1 par limper', 'Une main dominée perd trois fois sur quatre'],
      quiz: [
        ["Tout le monde passe, tu es HJ avec Q♣ 8♦. Action ?", ['Ouvrir', 'Limper', 'Se coucher'], 2, "Q8o est hors de la range HJ (QJo est la plus faible dame dépareillée ouverte)."],
        ["Un joueur limpe. Tu isoles au bouton. Taille standard ?", ['2 bb', '4,5 bb', '10 bb'], 1, "3,5 bb + 1 bb par limper = 4,5 bb."],
        ["AKo contre AQo à tapis préflop : équité de AK ?", ['≈ 55 %', '≈ 74 %', '≈ 90 %'], 1, "La Dame est dominée : environ 74 % pour AK."],
        ["Pourquoi ouvrir à la même taille avec AA et 76s ?", ['Pour ne pas donner d\'information sur sa main', 'Parce que c\'est la règle de la room'], 0, "Une taille qui varie selon la force de la main se lit très vite."],
      ],
    });

    K.mod({
      id: 'maths', level: 1, title: 'Les maths de base : cotes, outs, EV', minutes: 16, drill: 'odds',
      goals: ['Calculer l\'équité requise pour suivre', 'Compter ses outs et estimer ses chances', 'Juger une décision par son EV, pas par son résultat'],
      sections: [
        ['Cotes du pot', `<p class="formula">Équité requise = mise à payer ÷ pot final après ton call</p>
          <p>Pot 100, l'adversaire mise 50 : tu paies 50 pour un pot final de 200 → 25 %. À connaître par cœur :</p>
          <table class="t"><thead><tr><th>Mise adverse</th><th>Équité requise</th></tr></thead><tbody>
          <tr><td>¼ du pot</td><td>16,7 %</td></tr><tr><td>⅓ du pot</td><td>20 %</td></tr><tr><td>½ pot</td><td>25 %</td></tr><tr><td>⅔ du pot</td><td>28,6 %</td></tr><tr><td>¾ du pot</td><td>30 %</td></tr><tr><td>Pot</td><td>33,3 %</td></tr><tr><td>2 × pot</td><td>40 %</td></tr></tbody></table>`],
        ['Outs et règle du 2 et 4', `<p>Un <strong>out</strong> est une carte qui te donne la meilleure main. Approximation : outs × 2 ≈ % pour la prochaine carte ; outs × 4 ≈ % d'ici la river si tu vois les deux cartes.</p>
          <table class="t"><thead><tr><th>Tirage</th><th>Outs</th><th>Prochaine carte</th><th>Flop → river</th></tr></thead><tbody>
          <tr><td>Couleur</td><td>9</td><td>19,1 %</td><td>35,0 %</td></tr><tr><td>Suite par les deux bouts</td><td>8</td><td>17,0 %</td><td>31,5 %</td></tr>
          <tr><td>Couleur + suite deux bouts</td><td>15</td><td>31,9 %</td><td>54,1 %</td></tr><tr><td>Ventrale</td><td>4</td><td>8,5 %</td><td>16,5 %</td></tr>
          <tr><td>Deux overcards</td><td>6</td><td>12,8 %</td><td>24,1 %</td></tr></tbody></table>
          <p class="note">Calcul exact : 47 cartes inconnues au flop. Attention aux outs « sales » : un cœur qui te donne la couleur mais pairie le board peut offrir un full à l'adversaire.</p>`],
        ['EV : juger une décision', `<p class="formula">EV = Σ (probabilité × gain) − Σ (probabilité × perte)</p>
          <p>Exemple : pot 60, l'adversaire mise 30, tu as 30 % d'équité. Call : 30 % × 90 − 70 % × 30 = 27 − 21 = +6. Le call gagne 6 en moyenne, même si tu perds le coup 7 fois sur 10.</p>
          <p>Le résultat d'une main ne dit presque rien de la qualité de la décision. C'est la différence entre un joueur qui progresse et un joueur qui s'énerve.</p>`],
        ['Exemple chiffré', `<p>Turn, tu as A♥ 5♥ sur K♥ 9♥ 3♣ 8♠. Pot 8 €, l'adversaire mise 4 €. Tu as 9 outs de couleur sur 46 cartes : 19,6 %. Il te faut 4 ÷ 16 = 25 %. Sans gains supplémentaires à la river, le call perd de l'argent. Il devient rentable seulement si tu es sûr d'être payé assez à la river quand tu touches (module « Maths avancées » du niveau 2).</p>`],
      ],
      mistakes: ['Diviser par le pot avant ta mise (on oublie ton propre call)', 'Compter des outs qui donnent la main à l\'adversaire', 'Juger un call bon ou mauvais selon qu\'il a gagné'],
      keys: ['Équité requise = mise ÷ pot final', 'Outs × 2 pour une carte, × 4 pour deux', 'Seule l\'EV juge une décision'],
      quiz: [
        ["Pot 80, l'adversaire mise 40. Équité requise ?", ['33 %', '25 %', '50 %'], 1, "40 ÷ (80 + 40 + 40) = 25 %."],
        ["Tirage couleur au turn, une carte à venir. Chances de toucher ?", ['≈ 35 %', '≈ 20 %', '≈ 9 %'], 1, "9 outs sur 46 cartes : 19,6 %."],
        ["Tu as 35 % d'équité, il te faut 28,6 %. Tu perds le coup. Le call était…", ['Bon', 'Mauvais'], 0, "Il avait une EV positive ; le résultat d'une main isolée n'y change rien."],
        ["Tu as 8 outs au flop et tu iras jusqu'à la river. Estimation rapide ?", ['16 %', '32 %', '48 %'], 1, "Règle du 4 : 8 × 4 = 32 % (valeur exacte 31,5 %)."],
      ],
    });

    K.mod({
      id: 'bankroll', level: 1, title: 'Bankroll, variance, choix de la limite', minutes: 12, drill: 'situations',
      goals: ['Dimensionner sa bankroll selon le format', 'Comprendre l\'ampleur de la variance', 'Savoir quand monter et descendre de limite'],
      sections: [
        ['Combien de caves', `<table class="t"><thead><tr><th>Format</th><th>Repère prudent</th></tr></thead><tbody>
          <tr><td>Cash 6-max</td><td>40 caves (400 € pour la NL10)</td></tr><tr><td>Tournois (MTT)</td><td>150 à 200 buy-ins</td></tr><tr><td>Expresso / Spin</td><td>100 buy-ins et plus</td></tr></tbody></table>
          <p>Ce sont des règles de prudence courantes, pas des lois. Plus le format est variable (tournois, Expresso), plus il faut de marge. La bankroll est de l'argent dédié au poker, jamais l'argent du loyer.</p>`],
        ['La variance en chiffres', `<p>En cash 6-max, l'écart-type tourne souvent autour de 80 à 100 bb pour 100 mains. Avec 90 et un vrai winrate de +5 bb/100 :</p>
          <ul><li>après 5 000 mains, ton résultat observé peut se situer entre environ −20 et +30 bb/100 (intervalle à 95 %) ;</li><li>après 50 000 mains, entre environ −3 et +13 bb/100.</li></ul>
          <p>Des chutes de 20 à 30 caves arrivent à des joueurs gagnants. Le simulateur de l'onglet Journal te le montre sur 30 trajectoires.</p>`],
        ['Monter et descendre', `<ul>
          <li><strong>Descendre</strong> dès que la bankroll passe sous le seuil de la limite. Sans discuter.</li>
          <li><strong>Monter</strong> quand tu as les caves de la limite supérieure et un résultat positif sur un échantillon sérieux (au moins 30 000 mains en cash).</li>
          <li><strong>Shot</strong> : tenter la limite supérieure avec une partie fixée à l'avance (par exemple 3 caves), et redescendre si elle est perdue.</li></ul>`],
        ['Le rake', `<p>La room prélève un pourcentage de chaque pot (de l'ordre de 5 %, plafonné par main ; consulte le barème de ta room). En micro-limites, il peut dépasser le gain d'un bon joueur. Conséquences : évite les pots multiway sans main, compare les programmes de fidélité, monte de limite dès que la bankroll le permet (le rake pèse moins en proportion).</p>`],
      ],
      mistakes: ['Jouer sa bankroll entière sur une limite « pour aller plus vite »', 'Refuser de descendre après une mauvaise série', 'Conclure qu\'on est gagnant après quelques milliers de mains'],
      keys: ['40 caves en cash, beaucoup plus en tournoi', 'La variance est énorme à court terme', 'Descendre vite, monter lentement'],
      quiz: [
        ["Bankroll 300 €, règle des 40 caves. Limite maximale en cash ?", ['NL5', 'NL10', 'NL25'], 0, "NL5 : 40 × 5 € = 200 €. NL10 demanderait 400 €."],
        ["Après 5 000 mains à −8 bb/100, tu es forcément perdant ?", ['Oui', 'Non'], 1, "L'intervalle à 95 % fait environ ±25 bb/100 sur 5 000 mains."],
        ["Ta bankroll passe sous 40 caves de ta limite. Tu…", ['Continues, ça va remonter', 'Descends d\'une limite'], 1, "La règle protège ta bankroll de la ruine."],
      ],
    });

    K.mod({
      id: 'online', level: 1, title: 'Jouer en ligne : client, tables, routine', minutes: 9, drill: 'situations',
      goals: ['Configurer le client pour jouer sans erreur de clic', 'Choisir ses tables', 'Construire une routine de session'],
      sections: [
        ['Régler le client', `<ul>
          <li><strong>Jeu 4 couleurs</strong> : pique noir, cœur rouge, carreau bleu, trèfle vert. Fini les couleurs ratées.</li>
          <li><strong>Boutons de mise préréglés</strong> : 2,5 bb préflop, ⅓, ½, ¾ du pot postflop. Moins de clics, moins d'erreurs.</li>
          <li><strong>Notes sur les joueurs</strong> : une ligne courte et factuelle (« paie 3 rues avec 2e paire »), une couleur par profil.</li>
          <li>Désactive le chat si tu sens que tu vas répondre.</li></ul>`],
        ['Combien de tables', `<p>Commence à 1 ou 2 tables. Monte seulement si ton taux de réussite aux Spots et ta qualité de jeu ne baissent pas. Plus de tables augmente le volume mais réduit l'attention portée aux fish, qui est ta source de gains.</p>`],
        ['Choisir ses tables', `<p>Tes gains viennent des erreurs des autres. Avant de t'asseoir : regarde le nombre de joueurs qui voient le flop (affiché dans le lobby de la plupart des rooms), repère les joueurs que tes notes classent en fish, quitte une table qui ne compte plus que des réguliers.</p>`],
        ['La routine', `<ol><li><strong>Avant</strong> : révisions et 10 spots dans SIGMA 52, checklist anti-tilt, objectif unique de session.</li>
          <li><strong>Pendant</strong> : la room seule. SIGMA 52 fermé. Pauses toutes les heures.</li>
          <li><strong>Après</strong> : session dans le Journal, historiques dans Analyse, 3 mains à revoir dans l'outil d'équité.</li></ol>`],
      ],
      mistakes: ['Multiplier les tables trop tôt', 'Rester sur une table sans fish', 'Jouer fatigué ou distrait'],
      keys: ['Jeu 4 couleurs et boutons préréglés', 'La sélection de tables vaut des heures d\'étude', 'Avant, pendant, après : une routine fixe'],
      quiz: [
        ["Ta table ne compte plus que des réguliers. Meilleure décision ?", ['Rester pour progresser', 'Changer de table'], 1, "Ton gain vient des erreurs adverses ; une table de réguliers rapporte surtout au rake."],
        ["Quand ajouter une table ?", ['Dès que tu t\'ennuies', 'Quand ta qualité de décision reste stable'], 1, "Le volume ne vaut rien s'il fait baisser ton winrate."],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
