// Cours — Niveau 4 : Élite. Les techniques de haut niveau : solveurs, MDF, bloqueurs, avantage de range, jeu hors de position,
// turn et river avancés, profondeurs de tapis, exploitation de population, statistiques, tournois avancés, performance mentale.
// Chaque chiffre est soit une formule (vérifiable à la main), soit calculé par le moteur ou le solveur de SIGMA 52.
(function (root) {
  function register(K) {
    K.mod({
      id: 'solveurs', level: 4, title: 'Les solveurs : comment ils calculent, comment étudier avec', drill: 'mdf',
      goals: ['Savoir ce qu\'un solveur calcule et ce qu\'il ne sait pas', 'Lire une solution : fréquences, catégories, combos, EV', 'Étudier avec une méthode qui produit des règles simples, pas des fréquences apprises par cœur'],
      sections: [
        ['Ce que calcule un solveur', `<p>Un solveur reçoit <strong>deux ranges</strong>, un <strong>board</strong>, un <strong>pot</strong>, des <strong>tapis</strong> et un <strong>arbre de mises</strong> (les tailles autorisées à chaque rue). Il renvoie, pour chaque combo, une stratégie souvent mixte (par exemple 60 % mise, 40 % check). L'ensemble forme un <strong>équilibre de Nash</strong> : aucun des deux joueurs ne gagne à changer seul sa stratégie.</p>
          <ul><li><strong>EV</strong> : part du pot qu'un combo récupère en moyenne, moins ce qu'il remet. À l'équilibre, deux actions jouées toutes les deux par un même combo ont la même EV.</li>
          <li><strong>Équité</strong> : part du pot gagnée si toutes les cartes sont distribuées sans autre mise.</li>
          <li><strong>Réalisation d'équité</strong> (EQR) = EV ÷ (équité × pot). Une main en position, avec de bons tirages, réalise souvent plus de 100 % ; une main faible hors de position, souvent moins de 70 %.</li></ul>`],
        ['Comment il calcule', `<p>Les solveurs modernes utilisent une famille d'algorithmes appelée <strong>CFR</strong> (Counterfactual Regret Minimization). À chaque itération, chaque combo, à chaque décision, mesure ce que chaque action aurait rapporté par rapport à sa stratégie actuelle : c'est le <em>regret</em>. Il augmente la fréquence des actions à regret positif. La <strong>moyenne</strong> des stratégies successives converge vers l'équilibre.</p>
          <p>La qualité se mesure par l'<strong>exploitabilité</strong> : ce que gagnerait un adversaire parfait contre la solution, en % du pot. Les outils commerciaux visent 0,3 à 0,5 % du pot. Le solveur de SIGMA 52 utilise <em>Discounted CFR</em> (Brown et Sandholm, 2019), qui pondère davantage les itérations récentes et converge plus vite.</p>`],
        ['Pourquoi l\'arbre explose', `<p>Chaque taille de mise ajoutée multiplie les branches. Et chaque carte à venir multiplie tout l'arbre : 46 rivers possibles après un turn, 47 × 46 = 2 162 couples turn-river après un flop. Un solve de flop complet demande des gigaoctets de mémoire. Les praticiens réduisent l'arbre : 1 à 3 tailles par rue, relances limitées, et regroupent les cartes équivalentes.</p>
          <p>Dans SIGMA 52 : river et turn sont exacts ; au flop, le solveur calcule un échantillon représentatif de turns et de rivers. La stratégie du flop reste fiable en tendance ; pour un turn précis, re-résous-le exactement depuis le nœud.</p>`],
        ['Lire une solution, dans cet ordre', `<ol><li><strong>Fréquences globales</strong> : qui mise, combien, à quelle taille. Sur K♠ 7♦ 2♣, le relanceur préflop mise souvent petit avec une grande partie de sa range ; sur 9♥ 8♥ 7♣, il checke beaucoup plus.</li>
          <li><strong>Par catégorie</strong> : quelles mains faites misent, lesquelles checkent, quels tirages servent de semi-bluffs. C'est là que se trouvent les règles transposables.</li>
          <li><strong>Par combo</strong> : pourquoi A♠5♠ mise et A♦5♣ checke ? Presque toujours une histoire de tirage arrière (backdoor) ou de bloqueur.</li>
          <li><strong>Perte d'EV</strong> : une erreur se mesure en bb ou en % du pot. Une action qui perd 0,1 % du pot est une simplification acceptable ; une action qui perd 5 % du pot est une fuite.</li></ol>`],
        ['Méthode d\'étude', `<ol><li>Écris ta décision et ta raison <em>avant</em> de regarder la solution.</li>
          <li>Regarde l'agrégat sur plusieurs boards de la même famille (par exemple les flops K-x-x secs), pas un seul.</li>
          <li>Tire une règle courte : « Sur flop haut et sec, en position, mise petite avec presque toute la range ».</li>
          <li>Mesure la perte d'EV de ta règle simplifiée par rapport à la solution. Si elle coûte moins de 1 % du pot, garde-la.</li>
          <li>Applique la règle en session, puis vérifie tes mains réelles au replayer et au solveur.</li>
          <li>Contre un adversaire qui s'écarte de l'équilibre, la règle devient un point de départ, pas une obligation (module Exploitation).</li></ol>`],
        ['Ce que le solveur ne sait pas', `<ul><li><strong>Ranges fausses, réponse fausse</strong> : un solve contre une range de défense de BB irréaliste n'apprend rien.</li>
          <li><strong>Le rake</strong> : la plupart des solves l'ignorent. En micro-limites, payer et jouer des petits pots coûte plus cher que dans le solve.</li>
          <li><strong>Les pots à trois</strong> : les solveurs grand public traitent deux joueurs. En multiway, joue plus serré et plus « valeur ».</li>
          <li><strong>Les tailles absentes de l'arbre</strong> : si l'adversaire mise 40 % et que l'arbre ne contient que 33 % et 75 %, l'analyse est approximative.</li>
          <li><strong>Les humains</strong> : l'équilibre suppose un adversaire parfait. La population des petites limites ne l'est pas.</li></ul>`],
        ['Node locking : exploiter avec un solveur', `<p>Le <em>node locking</em> fige la stratégie d'un joueur à un nœud (« il ne bluffe jamais à la river ») et recalcule la meilleure réponse de l'autre. Résultat typique : si l'adversaire mise river uniquement pour la valeur, la réponse optimale est de coucher presque tous les bluff-catchers. C'est la version chiffrée de l'exploitation. Règle de prudence : ne verrouille que des tendances mesurées sur un échantillon suffisant.</p>`],
      ],
      mistakes: ['Apprendre des fréquences par cœur au lieu de comprendre pourquoi', 'Étudier avec des ranges de départ irréalistes', 'Appliquer une stratégie d\'équilibre contre un joueur qui ne bluffe jamais', 'Utiliser un solveur ou des tableaux pendant une session : interdit'],
      keys: ['Équilibre = personne ne gagne à dévier seul', 'Mains mixtes = EV égales : les deux actions sont correctes', 'Une erreur se mesure en perte d\'EV (bb ou % du pot)', 'Le solveur sert à construire des règles simples, puis à les exploiter'],
      quiz: [
        ['Un combo mise 50 % et checke 50 % à l\'équilibre. Que sait-on de ses deux EV ?', ['Miser rapporte plus', 'Les deux EV sont égales', 'Checker rapporte plus'], 1, 'À l\'équilibre, un combo ne mélange deux actions que si elles ont la même EV : il est indifférent.'],
        ['Que mesure l\'exploitabilité ?', ['Le gain d\'un adversaire parfait contre la solution', 'Le gain moyen de la solution contre un fish', 'Le temps de calcul'], 0, 'C\'est la distance à l\'équilibre, en % du pot : plus elle est basse, plus la solution est précise.'],
        ['Pourquoi un solve de flop est-il beaucoup plus lourd qu\'un solve de river ?', ['Les ranges sont plus larges', 'Il faut calculer les 2 162 couples turn-river possibles', 'Le pot est plus petit'], 1, 'Chaque carte à venir multiplie l\'arbre entier.'],
        ['Tu simplifies une stratégie : ta version perd 0,2 % du pot par rapport à la solution. Verdict ?', ['Simplification acceptable', 'Fuite grave'], 0, 'Une perte de quelques dixièmes de % du pot est négligeable devant les erreurs adverses à exploiter.'],
        ['Ton adversaire ne bluffe jamais à la river. Le node locking dira de…', ['Payer plus souvent', 'Coucher presque tous les bluff-catchers', 'Relancer en bluff'], 1, 'Sans bluffs dans sa range de mise, une main qui ne bat que des bluffs ne gagne jamais.'],
        ['L\'EQR d\'une main faible hors de position est souvent…', ['Supérieure à 100 %', 'Inférieure à 100 %'], 1, 'Hors de position, on encaisse rarement toute son équité : on se couche avant l\'abattage ou on paie des mises sans initiative.'],
      ],
    });

    K.mod({
      id: 'mdf', level: 4, title: 'Défense minimale, alpha et ratio valeur/bluff', drill: 'mdf',
      goals: ['Calculer en tête la fréquence de défense et de bluff pour n\'importe quelle taille', 'Construire une range de mise river équilibrée', 'Savoir quand ces chiffres s\'appliquent et quand les ignorer'],
      sections: [
        ['Trois formules', `<p>Pot <strong>P</strong>, mise <strong>B</strong>.</p>
          <ul><li><strong>Alpha</strong> = B ÷ (P + B) : fréquence de couchers qui rend un bluff pur rentable.</li>
          <li><strong>MDF</strong> (défense minimale) = P ÷ (P + B) = 1 − alpha : part de sa range à continuer pour que l'adversaire ne gagne pas en bluffant avec deux cartes quelconques.</li>
          <li><strong>Équité requise pour payer</strong> = B ÷ (P + 2B). À la river, c'est aussi la <strong>part de bluffs</strong> d'une range de mise équilibrée : le défenseur devient indifférent entre payer et coucher.</li></ul>`],
        ['La table à connaître', `<table class="t"><thead><tr><th>Mise</th><th class="n">Alpha</th><th class="n">MDF</th><th class="n">Équité pour payer</th><th class="n">Valeur : bluff (river)</th></tr></thead><tbody>
          <tr><td>25 % du pot</td><td class="n">20 %</td><td class="n">80 %</td><td class="n">16,7 %</td><td class="n">5 : 1</td></tr>
          <tr><td>33 %</td><td class="n">24,8 %</td><td class="n">75,2 %</td><td class="n">19,9 %</td><td class="n">4 : 1</td></tr>
          <tr><td>50 %</td><td class="n">33,3 %</td><td class="n">66,7 %</td><td class="n">25 %</td><td class="n">3 : 1</td></tr>
          <tr><td>75 %</td><td class="n">42,9 %</td><td class="n">57,1 %</td><td class="n">30 %</td><td class="n">2,33 : 1</td></tr>
          <tr><td>100 %</td><td class="n">50 %</td><td class="n">50 %</td><td class="n">33,3 %</td><td class="n">2 : 1</td></tr>
          <tr><td>150 %</td><td class="n">60 %</td><td class="n">40 %</td><td class="n">37,5 %</td><td class="n">1,67 : 1</td></tr>
          <tr><td>200 %</td><td class="n">66,7 %</td><td class="n">33,3 %</td><td class="n">40 %</td><td class="n">1,5 : 1</td></tr></tbody></table>
          <p>Plus la mise est grosse, plus la range de mise peut contenir de bluffs, et moins le défenseur doit défendre.</p>`],
        ['Construire une range de mise river', `<p>Exemple : pot 100, tu mises 75. Ta range de mise doit contenir environ 30 % de bluffs. Si tu as 14 combos de valeur, prends 6 bluffs (14 ÷ 0,7 = 20 combos au total ; 20 − 14 = 6). Choisis les bluffs parmi les mains qui n'ont aucune valeur à l'abattage et qui ont les meilleurs bloqueurs (module Bloqueurs).</p>
          <p>Vérification par le solveur de SIGMA 52, jeu jouet : sets contre bluff-catchers, mise pot. Le solveur bluffe avec 1/3 de sa range de mise et le défenseur paie 50 %. Avec une demi-mise : 1/4 de bluffs, défense 2/3.</p>`],
        ['Sur plusieurs rues', `<p>Au flop et au turn, les « bluffs » sont des semi-bluffs qui peuvent toucher. La proportion de bluffs est donc plus élevée qu'à la river. Ordre de grandeur couramment observé dans les solves : environ 2 bluffs pour 1 valeur au flop, 1 pour 1 au turn, 1 pour 2 à la river avec une mise pot. Ce sont des repères, pas des lois : la texture et les tailles les déplacent.</p>
          <p><strong>Taille géométrique</strong> : pour mettre tout le tapis en <em>n</em> mises égales (en % du pot), f = ((1 + 2S ÷ P)<sup>1/n</sup> − 1) ÷ 2. Pot 20, tapis 50, deux rues : f ≈ 72 % du pot à chaque rue. Pot simple à 100 bb (pot 5,5, tapis 97,5), trois rues : f ≈ 116 %. C'est pourquoi les pots simples profonds ne finissent pas tous à tapis : il faudrait des overbets.</p>`],
        ['Quand la MDF ne s\'applique pas', `<ul><li><strong>Contre un joueur qui ne bluffe pas assez</strong> (la majorité des micro-limites à la river), défendre la MDF perd de l'argent : couche davantage.</li>
          <li><strong>Au flop</strong>, ta range a de l'équité : tu peux défendre moins que la MDF si tu réalises mal ton équité, ou plus si l'adversaire mise trop souvent.</li>
          <li><strong>Avec une range plafonnée</strong> (sans mains fortes), défendre la MDF peut être impossible sans payer des mains qui n'ont aucune chance.</li>
          <li>La MDF concerne une <strong>range</strong>, jamais une main seule. Une main seule se décide à l'équité requise et à la composition de la range adverse.</li></ul>`],
        ['Exemple chiffré', `<p>River, pot 40 bb. Il mise 30 bb (75 %). Tu as 50 combos de bluff-catchers et 10 combos qui battent tout. La MDF dit 57 % de 60 combos, soit 34 combos à défendre : tes 10 nuts plus 24 bluff-catchers. Mais tes statistiques (ou ta base de mains) montrent que ce joueur, sur cette ligne, est en bluff 15 % du temps alors que l'équilibre en demande 30 %. Il te faut 30 % d'équité : chaque call perd. Tu couches tous les bluff-catchers et ne paies qu'avec les mains qui battent aussi une partie de sa valeur.</p>`],
      ],
      mistakes: ['Défendre la MDF contre une population qui sous-bluffe', 'Appliquer la MDF à une main au lieu d\'une range', 'Bluffer river avec des mains qui ont de la valeur à l\'abattage', 'Choisir ses bluffs au hasard plutôt que par bloqueurs'],
      keys: ['Alpha = B/(P+B), MDF = P/(P+B)', 'Équité requise = part de bluffs à l\'équilibre = B/(P+2B)', 'Mise pot à la river : 2 valeurs pour 1 bluff', 'La MDF est un repère d\'équilibre ; l\'exploitation passe avant'],
      quiz: [
        ['Pot 60, mise 30. Équité requise pour payer ?', ['20 %', '25 %', '33 %'], 1, 'B/(P+2B) = 30/120 = 25 %.'],
        ['Mise de 2 fois le pot à la river. Part de bluffs à l\'équilibre ?', ['20 %', '33 %', '40 %'], 2, '2/(1+4) = 40 %.'],
        ['MDF face à une mise d\'un tiers du pot ?', ['50 %', '66 %', '75 %'], 2, 'P/(P+B) = 1/1,33 ≈ 75 %.'],
        ['Tu as 12 combos de valeur, tu mises le pot à la river. Combien de bluffs ?', ['4', '6', '12'], 1, 'Bluffs = 1/3 de la range de mise : 12 valeurs + 6 bluffs = 18, dont 6 bluffs.'],
        ['Contre un joueur qui ne bluffe presque jamais la river, la MDF…', ['Doit être respectée', 'Doit être ignorée : couche plus'], 1, 'La MDF protège contre un bluffeur parfait. Contre un sous-bluffeur, payer perd.'],
        ['Pot 20, tapis 50, deux rues. Taille géométrique par rue ?', ['Environ 50 %', 'Environ 72 %', 'Environ 125 %'], 1, '((1 + 2 × 50/20)^(1/2) − 1)/2 = (√6 − 1)/2 ≈ 0,72.'],
      ],
    });

    K.mod({
      id: 'bloqueurs', level: 4, title: 'Combinatoire et bloqueurs : choisir ses bluffs et ses calls', drill: 'combos',
      goals: ['Compter les combos d\'une range en tenant compte du board et de tes cartes', 'Choisir les bluffs qui bloquent les calls et débloquent les couchers', 'Choisir les bluff-catchers qui bloquent la valeur adverse'],
      sections: [
        ['Compter vite', `<table class="t"><thead><tr><th>Main</th><th class="n">Combos sans carte visible</th><th>Avec une carte du board ou de ta main</th></tr></thead><tbody>
          <tr><td>Paire servie (ex. 77)</td><td class="n">6</td><td>Un 7 visible : 3 combos. Deux 7 visibles : 1 combo.</td></tr>
          <tr><td>Non appariée (ex. AK)</td><td class="n">16 (4 assorties, 12 dépareillées)</td><td>Un As visible : 3 × 4 = 12. Un As et un Roi visibles : 3 × 3 = 9.</td></tr>
          <tr><td>Assortie précise (ex. AKs)</td><td class="n">4</td><td>Un As visible : 3 combos.</td></tr></tbody></table>
          <p>Exemple : board K♠ 9♦ 4♣, tu tiens A♥ K♦. Combien de AK chez l'adversaire ? As restants : 3. Rois restants : 4 − 1 (board) − 1 (ta main) = 2. Donc 3 × 2 = <strong>6 combos</strong> au lieu de 16.</p>`],
        ['Qu\'est-ce qu\'un bloqueur', `<p>Une carte que tu tiens ne peut pas être dans la main adverse. Elle retire donc des combos à sa range. L'effet est fort quand la catégorie est petite : tenir l'As de la couleur sur un board à trois cœurs retire <em>toutes</em> les couleurs max adverses ; tenir un Roi sur K-9-4 retire un tiers des combos de top paire adverses (il ne reste que 2 rois sur 3).</p>
          <p>Les bloqueurs comptent surtout à la river, quand les ranges sont étroites et que les décisions sont binaires. Au flop, l'équité et la jouabilité pèsent plus.</p>`],
        ['Choisir ses bluffs', `<p>Un bon bluff river :</p><ol><li>n'a <strong>aucune valeur à l'abattage</strong> (sinon, checke et gagne parfois) ;</li>
          <li><strong>bloque les mains qui paient</strong> (ex. tenir une Dame quand l'adversaire paie avec ses Dames) ;</li>
          <li><strong>ne bloque pas les mains qui couchent</strong> (ex. ne pas tenir les cartes de ses tirages ratés : ce sont elles qui se couchent).</li></ol>
          <p>Exemple : board Q♠ J♦ 7♣ 3♥ 2♠, tu as tout raté. Avec A♦ 5♦ (sans valeur), tu ne bloques rien d'utile. Avec K♣ T♣ (tirage par les deux bouts raté), tu retires une partie de ses KQ et QT, des paires de Dames qui paient souvent. Le solveur préfère généralement bluffer avec les mains qui retirent des calls.</p>`],
        ['Choisir ses bluff-catchers', `<p>Face à une grosse mise river, entre deux mains de même force, paie avec celle qui <strong>bloque sa valeur</strong> et <strong>ne bloque pas ses bluffs</strong>.</p>
          <p>Board A♠ 8♥ 5♥ K♣ 2♦ : le tirage couleur cœur du flop a raté. Tu as une paire de 8, avec deux versions possibles : 8♠ 7♥ ou 8♠ 7♣. Le 7♥ retire une partie de ses tirages cœur ratés (7♥6♥, 7♥4♥…), c'est-à-dire de ses bluffs : c'est le <em>moins</em> bon call. Le 7♣ ne bloque aucun de ses bluffs à cœur.</p>`],
        ['Compter une range river complète', `<p>Pour décider un call difficile, compte : <strong>combos de valeur</strong> qu'il mise ainsi, <strong>combos de bluff</strong> qu'il mise ainsi. Puis compare au besoin d'équité.</p>
          <p>Exemple : pot 100, il mise 100. Il te faut 33 %. Tu estimes sa valeur à 18 combos (deux paires et mieux, moins tes bloqueurs) et ses bluffs à 6 combos (tirages ratés). Tu gagnes 6/24 = 25 % : couche. S'il avait 10 bluffs : 10/28 = 36 % : paie. Une seule carte de ta main qui retire 3 combos de valeur peut faire basculer la décision.</p>`],
        ['Dans SIGMA 52', `<p>Le solveur montre l'EV de chaque combo : compare deux combos de la même main (A♠5♠ et A♦5♣) et cherche la carte qui explique l'écart. L'exercice « Combos » des Spots entraîne le comptage rapide.</p>`],
      ],
      mistakes: ['Choisir un bluff qui bloque les mains qui se couchent', 'Payer avec une main qui bloque les bluffs adverses', 'Compter 16 combos de AK alors qu\'un As et un Roi sont visibles', 'Raisonner sur une main au lieu de compter la range'],
      keys: ['Paire : 6, non appariée : 16 (4 + 12)', 'Une carte visible : paire 3, non appariée 12', 'Bluff : bloque ses calls, débloque ses couchers', 'Bluff-catcher : bloque sa valeur, débloque ses bluffs'],
      quiz: [
        ['Board 9♣ 6♦ 2♠. Combos de 99 chez l\'adversaire ?', ['1', '3', '6'], 1, 'Un 9 est au board : il reste 3 cartes de 9, donc 3 combos.'],
        ['Board A♦ 7♣ 3♠, tu as A♣ Q♥. Combos de AQ adverses ?', ['6', '8', '16'], 0, 'As restants : 2 (board et ta main). Dames restantes : 3. 2 × 3 = 6.'],
        ['Meilleur bluff river parmi deux mains sans valeur ?', ['Celle qui bloque ses tirages ratés', 'Celle qui bloque ses mains moyennes qui paient'], 1, 'On veut retirer des calls, pas des couchers.'],
        ['Meilleur bluff-catcher entre deux mains de même force ?', ['Celle qui bloque ses bluffs', 'Celle qui bloque sa valeur'], 1, 'Moins de valeur adverse, plus de bluffs relatifs : ton call gagne plus souvent.'],
        ['Il mise le pot river. 15 combos de valeur, 9 de bluff. Tu paies ?', ['Oui : 37,5 % > 33 %', 'Non'], 0, '9/24 = 37,5 % de bluffs, il faut 33 % : call rentable.'],
      ],
    });

    K.mod({
      id: 'avantage', level: 4, title: 'Avantage de range et de nuts : choisir sa stratégie de flop', drill: 'tirage',
      goals: ['Distinguer avantage de range et avantage de nuts', 'Savoir quand miser petit avec toute sa range et quand polariser', 'Adapter le plan aux familles de flops'],
      sections: [
        ['Deux avantages différents', `<ul><li><strong>Avantage de range</strong> : ta range a plus d'équité moyenne que celle de l'adversaire.</li>
          <li><strong>Avantage de nuts</strong> : ta range contient plus de mains très fortes (sets, deux paires, suites) que la sienne.</li></ul>
          <p>Les deux ne vont pas toujours ensemble. Sur 7♠ 6♦ 5♣, le défenseur BB a plus de suites et de deux paires (avantage de nuts) même si le relanceur a les surpaires. L'outil Distribution (onglet Outils) montre les deux sur la même courbe.</p>`],
        ['La règle qui en découle', `<table class="t"><thead><tr><th>Situation</th><th>Stratégie typique</th><th>Pourquoi</th></tr></thead><tbody>
          <tr><td>Avantage de range et de nuts, board sec (A-8-3r, K-7-2r)</td><td>Petite mise (25-33 %) avec une très grande partie de la range</td><td>L'adversaire a peu de mains qui continuent ; une petite mise suffit à lui faire jeter ses airs, et coûte peu quand il a mieux</td></tr>
          <tr><td>Avantage de nuts, board dynamique (Q-J-8 deux couleurs)</td><td>Mise plus grosse (66-100 %), plus de checks</td><td>Les mains fortes veulent grossir le pot avant les cartes dangereuses ; les mains moyennes préfèrent checker</td></tr>
          <tr><td>Avantage au défenseur (8-7-6, 6-5-4)</td><td>Beaucoup de checks, mise polarisée</td><td>Le relanceur ne peut pas miser souvent sans être relancé</td></tr>
          <tr><td>Board apparié (Q-Q-5, 7-7-2)</td><td>Petite mise très fréquente</td><td>Peu de mains touchent ; la range du relanceur a plus de grosses paires</td></tr>
          <tr><td>Board monotone (K♥ 8♥ 3♥)</td><td>Petite mise, fréquence plus basse</td><td>L'équité se répartit selon les cœurs ; personne ne veut grossir le pot sans la couleur</td></tr></tbody></table>`],
        ['Position et type de pot', `<ul><li><strong>Relanceur hors de position</strong> (SB contre BB, UTG contre BB) : il checke plus souvent qu'en position, même avec l'avantage de range, pour protéger sa range de check.</li>
          <li><strong>Pots 3-bet</strong> : le 3-betteur a un gros avantage de range (paires hautes, As forts). Les mises sont plus fréquentes et plus petites, car le SPR bas (≈ 4) fait que deux mises suffisent pour aller à tapis.</li>
          <li><strong>Contre une range de défense large</strong> (BB contre BTN), l'avantage du relanceur sur les flops hauts est maximal.</li></ul>`],
        ['Exemple au solveur', `<p>Lance le solveur sur « BTN ouvre, BB paie », flop K♠ 7♦ 2♣ : le bouton mise le plus souvent, surtout petit. Puis compare avec 8♥ 7♥ 6♣ : la fréquence de mise chute et la grosse taille apparaît. Le rapport « Stratégie par catégorie » montre quelles mains changent de comportement : sur le board connecté, les paires moyennes du bouton passent de mise à check.</p>`],
        ['Simplifier en session', `<ol><li>Qui a l'avantage de range ? (flop haut = relanceur ; flop bas connecté = défenseur)</li>
          <li>Qui a l'avantage de nuts ? (sets et suites possibles dans quelle range ?)</li>
          <li>Board sec + avantage : petite mise fréquente. Board dynamique : polarise, checke plus.</li>
          <li>Contre un fish qui paie trop : moins de bluffs, mises plus grosses pour la valeur, quelle que soit la règle.</li></ol>`],
      ],
      mistakes: ['C-bet automatiquement à la même taille sur tous les flops', 'Miser petit sur un board où le défenseur a l\'avantage de nuts', 'Oublier que le relanceur hors de position doit checker plus', 'Appliquer ces règles d\'équilibre contre une calling station'],
      keys: ['Avantage de range ≠ avantage de nuts', 'Board sec et avantage : petite mise fréquente', 'Board dynamique : polariser et checker plus', 'Pots 3-bet : mises fréquentes et petites (SPR bas)'],
      quiz: [
        ['BTN contre BB, flop A♠ 8♦ 3♣. Stratégie typique du bouton ?', ['Petite mise avec une grande partie de sa range', 'Check presque toujours', 'Overbet polarisé'], 0, 'Avantage de range et de nuts sur un board sec : petite mise fréquente.'],
        ['UTG contre BB, flop 7♠ 6♦ 5♣. Qui a l\'avantage de nuts ?', ['UTG', 'BB'], 1, 'La BB défend beaucoup de connecteurs et petites paires : plus de suites et de deux paires.'],
        ['Pourquoi les pots 3-bet favorisent les petites mises fréquentes ?', ['Le SPR bas : deux mises suffisent pour le tapis', 'Le rake est plus faible'], 0, 'Avec un SPR d\'environ 4, une petite mise au flop prépare le tapis aux rues suivantes.'],
        ['Board monotone K♥ 8♥ 3♥. Tendance au solveur ?', ['Grosses mises fréquentes', 'Petites mises, fréquence plus basse'], 1, 'Sans le cœur, personne ne veut gonfler le pot ; la petite mise protège et prend les airs.'],
        ['Le relanceur est hors de position (SB contre BB). Par rapport au même spot en position, il…', ['Mise plus souvent', 'Checke plus souvent'], 1, 'Hors de position, il doit protéger sa range de check et réalise moins bien son équité.'],
      ],
    });

    K.mod({
      id: 'oopplay', level: 4, title: 'Jouer hors de position : check-raise, donk, probe, défense', drill: 'tirage',
      goals: ['Construire une range de check-raise (valeur + semi-bluffs)', 'Savoir quand miser en premier (donk, probe)', 'Défendre face aux continuation bets sans trop coucher'],
      sections: [
        ['Le problème hors de position', `<p>Tu parles en premier à chaque rue : l'adversaire décide avec plus d'information. Tu réalises moins ton équité. Conséquence : ta stratégie de base est de <strong>checker</strong> beaucoup, et de rendre ces checks dangereux par des check-raises et des check-calls solides.</p>`],
        ['Le check-raise', `<p>Valeur : sets, deux paires, parfois top paire bon kicker sur boards dynamiques. Semi-bluffs : tirages couleur, tirages par les deux bouts, ventrales avec overcards, tirages arrière (backdoor) avec une paire.</p>
          <p>Taille courante : 3 à 4 fois la mise adverse face à une petite c-bet. Fréquence : plus haute sur les boards bas et connectés (avantage de nuts du défenseur), très basse sur A-K-x secs.</p>
          <p>Le bon semi-bluff de check-raise a deux façons de gagner : l'adversaire se couche, ou tu touches. Un air total sans tirage est un mauvais candidat, sauf contre un joueur qui couche trop.</p>`],
        ['Défendre face à une c-bet', `<ul><li>Petite c-bet (33 %) : défends large (MDF ≈ 75 %), y compris overcards avec tirage arrière.</li>
          <li>Grosse c-bet (75 % et plus) : défends plus serré, garde les mains qui ont de l'équité ou une paire.</li>
          <li>Statistique utile : un adversaire qui c-bet plus de 75 % des flops mise souvent sans rien ; relève tes check-raises et tes calls.</li></ul>`],
        ['Donk bet et probe bet', `<ul><li><strong>Donk bet</strong> (mise en premier dans le relanceur) : au flop, rare chez les bons joueurs, sauf sur boards très favorables au défenseur (bas, connectés). Au turn, utile quand la carte avantage nettement ta range (une carte qui complète des suites que lui n'a presque pas).</li>
          <li><strong>Probe bet</strong> : le relanceur a checké le flop derrière, tu mises au turn. Sa range de check est plafonnée (sans les mains fortes qu'il aurait misées) : mise souvent, de taille moyenne.</li>
          <li><strong>Block bet</strong> river : petite mise (20-33 %) avec une main moyenne pour fixer le prix et éviter une grosse mise adverse.</li></ul>`],
        ['Côté relanceur en position', `<ul><li><strong>Delayed c-bet</strong> : tu checkes le flop, tu mises le turn quand la défense a checké deux fois.</li>
          <li><strong>Float</strong> : payer une mise hors position de l'adversaire avec l'intention de prendre le pot plus tard s'il abandonne.</li></ul>`],
        ['À tester au solveur', `<p>Scénario « BTN ouvre, BB paie », flop 7♠ 6♦ 5♣ : regarde la réponse de la BB à une petite mise du bouton. Puis flop A♠ K♦ 2♣ : la fréquence de check-raise s'effondre. Le rapport par catégorie montre quels tirages servent de semi-bluffs.</p>`],
      ],
      mistakes: ['Miser en premier « pour voir où on en est »', 'Check-raiser des airs sans équité', 'Jeter trop de mains face aux petites c-bets', 'Oublier de miser au turn quand le relanceur a checké le flop'],
      keys: ['Hors de position : beaucoup de checks, rendus dangereux par les check-raises', 'Check-raise = valeur forte + tirages', 'Probe bet après un check du relanceur au flop', 'Petite c-bet = défense large'],
      quiz: [
        ['Meilleur candidat de semi-bluff en check-raise ?', ['Air total sans tirage', 'Tirage couleur avec overcard', 'Top paire faible kicker'], 1, 'Deux façons de gagner : fold equity et équité.'],
        ['Le BTN a checké le flop derrière. Tu es BB, turn neutre. Ligne souvent rentable ?', ['Probe bet', 'Check-fold systématique'], 0, 'Sa range de check est plafonnée.'],
        ['Face à une c-bet d\'un tiers du pot, la défense doit être…', ['Large', 'Très serrée'], 0, 'MDF ≈ 75 % : il gagne trop si tu couches souvent.'],
        ['Sur quel flop le check-raise de la BB est-il le plus fréquent ?', ['A♠ K♦ 2♣', '7♠ 6♦ 5♣'], 1, 'Boards bas connectés : avantage de nuts du défenseur.'],
        ['Block bet river : avec quelle main ?', ['Main moyenne qui veut un abattage bon marché', 'Les nuts'], 0, 'On fixe le prix ; les nuts veulent une grosse mise.'],
      ],
    });

    K.mod({
      id: 'barrels', level: 4, title: 'Turn et river avancés : barrels, overbets, valeur fine', drill: 'tirage',
      goals: ['Classer les cartes de turn et de river selon à qui elles profitent', 'Utiliser l\'overbet et le block bet', 'Prendre de la valeur fine sans se faire relancer'],
      sections: [
        ['Classer la carte du turn', `<table class="t"><thead><tr><th>Carte</th><th>Profite à</th><th>Exemple</th></tr></thead><tbody>
          <tr><td>Overcard haute (A, K)</td><td>Souvent le relanceur préflop</td><td>Flop 9-7-3, turn As</td></tr>
          <tr><td>Carte qui complète tirages</td><td>Celui qui a le plus de tirages (souvent le défenseur)</td><td>Troisième carte d'une couleur, quatrième carte d'une suite</td></tr>
          <tr><td>Carte qui apparie le board</td><td>Celui qui a plus de brelans (souvent le défenseur sur cartes basses)</td><td>Flop K-7-2, turn 7</td></tr>
          <tr><td>Brique</td><td>Celui qui menait au flop</td><td>Flop K-7-2, turn 3 dépareillé</td></tr></tbody></table>
          <p>Le deuxième barrel est fort quand la carte améliore ta range, ou bloque/complète tes tirages. Il est faible quand elle complète ses tirages et pas les tiens.</p>`],
        ['L\'overbet', `<p>Mise plus grosse que le pot (125-200 %). Conditions : avantage de nuts net et range adverse <strong>plafonnée</strong> (il a payé deux rues sans relancer, donc il a rarement les nuts). Tu mises gros avec les nuts et des bluffs bien choisis ; les mains moyennes checkent.</p>
          <p>Exemple : tu as relancé préflop, misé le flop K♠ 8♦ 3♣, il a payé. Turn A♥. Tu as plus de AK, AA, KK ; lui a surtout des Kx moyens et des 8x. Overbet polarisé : AK et sets pour la valeur, tirages arrière ratés pour les bluffs.</p>`],
        ['La valeur fine', `<p>Une mise de valeur est rentable si, quand il paie, tu gagnes plus d'une fois sur deux. Compte les mains moins bonnes qui paient contre les mains meilleures qui paient (ou relancent). Contre un fish qui paie avec n'importe quelle paire, la deuxième paire peut miser pour la valeur ; contre un nit, même une top paire moyenne doit parfois checker.</p>
          <p>Taille : choisis la mise la plus grosse que ses mains moins bonnes paient encore. Contre une calling station, plus gros que d'habitude ; contre un joueur qui raisonne, une taille moyenne.</p>`],
        ['Le triple barrel bluff', `<p>À la river, bluffe avec les mains qui ont raté et qui bloquent ses calls. Ne bluffe pas : avec une main qui gagne parfois à l'abattage ; contre un joueur qui a payé deux rues et ne couche jamais ; quand la carte river complète ses tirages et pas les tiens (ta range n'est plus crédible).</p>`],
        ['Relances river', `<p>À la river, une relance ne sert jamais à « voir où on en est » : elle n'appelle que des mains meilleures. Relance pour la valeur seulement si ses mains moins bonnes paient encore la relance. Dans les petites limites, une relance river adverse est très majoritairement de la valeur : coucher les bluff-catchers est souvent correct.</p>`],
      ],
      mistakes: ['Barrel le turn sur une carte qui complète les tirages adverses', 'Overbet sans avantage de nuts', 'Miser river pour la « valeur » avec une main que seules les meilleures paient', 'Payer les relances river des joueurs passifs'],
      keys: ['Le turn change les avantages : reclasse la carte', 'Overbet = nuts + range adverse plafonnée', 'Valeur : gagner plus d\'une fois sur deux quand il paie', 'Relance river = valeur dans les petites limites'],
      quiz: [
        ['Flop 9♥ 7♥ 3♣, turn 2♥. À qui profite la carte ?', ['Celui qui a le plus de tirages couleur', 'Celui qui a le plus d\'As'], 0, 'La troisième carte à cœur complète les couleurs.'],
        ['Condition principale d\'un overbet ?', ['Range adverse plafonnée et avantage de nuts', 'Main moyenne à protéger'], 0, 'On polarise : nuts et bluffs, les mains moyennes checkent.'],
        ['Mise de valeur river : quand est-elle rentable ?', ['Quand tu gagnes plus de 50 % du temps quand il paie', 'Quand tu as top paire'], 0, 'Seules les mains qui paient comptent.'],
        ['Un joueur passif relance ta mise river. Tu as top paire. Par défaut ?', ['Payer', 'Coucher'], 1, 'Les relances river des passifs sont presque toujours de la valeur.'],
        ['Flop K♠ 8♦ 3♣ misé et payé, turn 2♥. Classification ?', ['Brique', 'Carte qui complète tout'], 0, 'Elle ne change presque rien : avantage au joueur qui menait.'],
      ],
    });

    K.mod({
      id: 'deep', level: 4, title: 'Profondeurs de tapis : tapis courts, 100 bb, 200 bb et plus', drill: 'outs',
      goals: ['Relier la profondeur au choix des mains préflop', 'Planifier avec le SPR', 'Jouer les pots 4-bet et les tapis profonds'],
      sections: [
        ['Le SPR fixe l\'engagement', `<table class="t"><thead><tr><th>SPR au flop</th><th>Situation typique</th><th>Main qui peut aller à tapis</th></tr></thead><tbody>
          <tr><td>Moins de 2</td><td>Pot 4-bet, tapis courts</td><td>Top paire, surpaire, gros tirages</td></tr>
          <tr><td>2 à 6</td><td>Pot 3-bet à 100 bb</td><td>Top paire bon kicker, surpaires, deux paires</td></tr>
          <tr><td>6 à 15</td><td>Pot simple à 100 bb</td><td>Deux paires et mieux, surpaires fortes selon l'adversaire</td></tr>
          <tr><td>Plus de 15</td><td>Pot simple à 200 bb et plus</td><td>Sets, suites, couleurs ; top paire contrôle le pot</td></tr></tbody></table>`],
        ['Tapis profonds (150-300 bb)', `<ul><li>Les mains qui font des <strong>nuts cachées</strong> gagnent de la valeur : petites paires (set-mining), assorties connectées, As assortis.</li>
          <li>Les mains dominées perdent de la valeur : AJo, KQo, KJ hors de position font des top paires qui perdent de gros pots.</li>
          <li><strong>Set-mining</strong> : une paire touche un brelan ou mieux au flop 11,8 % du temps (environ 1 fois sur 8,5). Pour payer une relance uniquement pour le set, il faut que le gain moyen quand tu touches couvre environ 7,5 fois le prix du call. Règle pratique : tapis effectifs ≥ 15 à 20 fois la mise à payer.</li>
          <li>Le 4-bet bluff devient plus risqué (il peut 5-bet) et le call en position plus attractif.</li></ul>`],
        ['Pots 4-bet', `<p>À 100 bb, un 4-bet à ~22 bb payé donne un pot d'environ 45 bb pour ~78 bb derrière : SPR ≈ 1,7. Les ranges sont serrées (QQ+, AK, quelques bluffs à As faible). Au flop, petite mise (25-33 %) très fréquente : la plupart des mains vont à tapis de toute façon. Ne joue pas de « contrôle du pot » avec une surpaire.</p>`],
        ['Tapis courts en cash (20-40 bb)', `<p>Le jeu se rapproche du push/fold : moins de mains spéculatives, plus de 3-bet tapis. Contre un short-stack qui pousse souvent, élargis tes calls selon les cotes (outil Push/Fold). Toi-même, avec 40 bb, évite les mains qui ont besoin de cotes implicites.</p>`],
        ['Le straddle (live)', `<p>Une mise aveugle volontaire, souvent 2 bb, avant la distribution. Elle double les blindes et divise la profondeur effective par deux : 100 bb deviennent 50 straddles. Joue plus serré qu'à 100 bb face à un straddle, et souviens-toi que les ouvertures montent (souvent 3-4 fois le straddle).</p>`],
      ],
      mistakes: ['Jouer KQo comme à 100 bb quand les tapis font 250 bb', 'Set-miner avec des tapis trop courts', 'Ralentir une surpaire dans un pot 4-bet', 'Oublier que le straddle divise la profondeur effective'],
      keys: ['SPR bas : engage-toi tôt avec top paire', 'Profond : nuts cachées et position gagnent de la valeur', 'Set au flop : 11,8 %', 'Pot 4-bet : SPR ≈ 1,7, petite mise et tapis'],
      quiz: [
        ['Probabilité de toucher un set au flop avec une paire servie ?', ['5,9 %', '11,8 %', '19 %'], 1, '1 − (48/50 × 47/49 × 46/48) ≈ 11,8 %.'],
        ['Pot 3-bet à 100 bb, SPR ≈ 4. Surpaire QQ sur flop 8-5-2. Plan ?', ['Engager le tapis', 'Contrôler le pot et coucher sur relance'], 0, 'SPR bas : une surpaire est une main de tapis.'],
        ['Tapis de 250 bb. Quelle main perd le plus de valeur ?', ['76s', 'KJo'], 1, 'Les mains dominées font des top paires qui perdent de gros pots.'],
        ['Straddle à 2 bb, tapis de 100 bb. Profondeur effective en straddles ?', ['100', '50'], 1, '100 bb / 2 = 50 straddles.'],
        ['Pot 4-bet, flop sec, tu as AK sans paire. Plan typique ?', ['Petite mise', 'Check-fold'], 0, 'Range forte et SPR très bas : petite mise fréquente.'],
      ],
    });

    K.mod({
      id: 'exploitpop', level: 4, title: 'Exploitation avancée et tendances de population', drill: 'situations',
      goals: ['Passer d\'une base d\'équilibre à un écart rentable', 'Connaître les tendances fréquentes des petites limites et les vérifier', 'Mesurer la fiabilité d\'une statistique selon l\'échantillon'],
      sections: [
        ['La méthode', `<ol><li>Partir de l'équilibre (solveur, charts).</li><li>Identifier un écart adverse <strong>mesuré</strong> (statistique, ligne répétée, montrée à l'abattage).</li>
          <li>Dévier dans le sens qui punit cet écart : il couche trop → bluffe plus ; il paie trop → mise plus gros pour la valeur, bluffe moins ; il ne bluffe pas → couche tes bluff-catchers.</li>
          <li>Dévier fort quand l'écart est sûr, légèrement quand il est incertain.</li></ol>
          <p>Le node locking (module Solveurs) chiffre la meilleure réponse à un écart donné.</p>`],
        ['Tendances souvent observées en petites limites', `<p>Les coachs qui analysent de grandes bases de mains rapportent régulièrement ces tendances. Elles varient selon les rooms et les limites : vérifie-les sur tes propres mains (onglet Analyse).</p>
          <ul><li>Les relances river et les check-raises turn-river sont <strong>rarement des bluffs</strong>.</li>
          <li>Beaucoup de joueurs <strong>couchent trop face aux 3-bets</strong> (fold to 3-bet élevé).</li>
          <li>Les c-bets en <strong>multiway</strong> sont presque toujours fortes.</li>
          <li>Les joueurs récréatifs paient trop au flop et couchent trop face aux grosses mises river quand ils n'ont rien de fait.</li>
          <li>Les grosses mises des joueurs passifs signifient de la force ; les petites mises sont souvent des mains moyennes.</li></ul>`],
        ['Combien de mains pour croire une statistique', `<p>Une statistique est une fréquence observée. Son erreur type vaut √(p × (1 − p) ÷ n), où n est le nombre d'<em>occasions</em> (pas de mains jouées).</p>
          <table class="t"><thead><tr><th>Statistique</th><th class="n">Valeur</th><th class="n">Occasions</th><th class="n">Erreur type</th></tr></thead><tbody>
          <tr><td>VPIP</td><td class="n">25 %</td><td class="n">100</td><td class="n">± 4,3 pts</td></tr>
          <tr><td>VPIP</td><td class="n">25 %</td><td class="n">500</td><td class="n">± 1,9 pt</td></tr>
          <tr><td>3-bet</td><td class="n">6 %</td><td class="n">300</td><td class="n">± 1,4 pt</td></tr>
          <tr><td>Fold to c-bet</td><td class="n">50 %</td><td class="n">30</td><td class="n">± 9,1 pts</td></tr>
          <tr><td>Fold to c-bet</td><td class="n">50 %</td><td class="n">200</td><td class="n">± 3,5 pts</td></tr></tbody></table>
          <p>À 95 %, l'intervalle fait environ deux erreurs types de chaque côté. Un fold to c-bet de 50 % sur 30 occasions est donc compatible avec 32 % comme avec 68 %. Les statistiques préflop se stabilisent vite ; les statistiques river demandent des milliers de mains.</p>`],
        ['Exploits qui rapportent le plus', `<table class="t"><thead><tr><th>Écart adverse</th><th>Exploit</th></tr></thead><tbody>
          <tr><td>Paie trop (calling station)</td><td>Mises de valeur plus grosses et plus fines ; zéro bluff river</td></tr>
          <tr><td>Couche trop (nit)</td><td>Vols, c-bets, 3-bets en bluff ; couche face à ses relances</td></tr>
          <tr><td>Bluffe trop (maniaque)</td><td>Paie plus large, laisse-le miser, piège avec les mains fortes</td></tr>
          <tr><td>Ne bluffe jamais la river</td><td>Couche les bluff-catchers face à ses grosses mises</td></tr>
          <tr><td>Couche trop face aux 3-bets</td><td>3-bet plus de bluffs contre ses ouvertures</td></tr></tbody></table>`],
        ['Le risque', `<p>Un exploit t'expose : en bluffant plus contre un nit, tu deviens exploitable par un joueur qui s'adapte. Contre les réguliers attentifs, reste proche de l'équilibre ; contre les récréatifs, exploite fort. Revois tes hypothèses quand l'adversaire change de comportement (tilt, fin de session).</p>`],
      ],
      mistakes: ['Conclure sur 30 mains', 'Exploiter un régulier qui s\'adapte comme un fish', 'Payer les relances river « parce que l\'équilibre l\'exige »', 'Confondre mains jouées et occasions d\'une statistique'],
      keys: ['Équilibre d\'abord, écart mesuré ensuite', 'Erreur type = √(p(1−p)/n)', 'Petites limites : relances river ≈ valeur', 'Exploite fort les récréatifs, légèrement les réguliers'],
      quiz: [
        ['Fold to c-bet de 70 % sur 20 occasions. Fiabilité ?', ['Très fiable', 'Faible : erreur type ≈ 10 points'], 1, '√(0,7 × 0,3 / 20) ≈ 0,10.'],
        ['Un joueur couche 80 % face aux 3-bets. Exploit ?', ['3-bet plus de bluffs contre lui', 'Ne jamais 3-bet'], 0, 'Chaque 3-bet en bluff gagne immédiatement souvent.'],
        ['En multiway, un joueur passif mise au flop. Lecture par défaut ?', ['Main forte', 'Bluff'], 0, 'Les c-bets et mises multiway sont rarement des bluffs.'],
        ['Contre une calling station, à la river avec deuxième paire après check-check au turn ?', ['Mise de valeur', 'Check'], 0, 'Elle paie avec pire : la valeur fine devient rentable.'],
        ['Pourquoi ne pas exploiter fort un régulier attentif ?', ['Il s\'adapte et te punit', 'C\'est interdit'], 0, 'Un exploit t\'éloigne de l\'équilibre : un joueur qui s\'adapte en profite.'],
      ],
    });

    K.mod({
      id: 'hud', level: 4, title: 'Statistiques et profils : lire un adversaire en chiffres', drill: 'situations',
      goals: ['Connaître les statistiques utiles et leurs valeurs typiques', 'Classer un adversaire en profil à partir de quelques chiffres', 'Savoir ce qui est autorisé selon la room'],
      sections: [
        ['Les statistiques de base', `<table class="t"><thead><tr><th>Statistique</th><th>Définition</th><th>Régulier 6-max typique</th></tr></thead><tbody>
          <tr><td>VPIP</td><td>Mains où il met de l'argent volontairement préflop</td><td>22-27 %</td></tr>
          <tr><td>PFR</td><td>Mains relancées préflop</td><td>18-23 %</td></tr>
          <tr><td>3-bet</td><td>Sur-relances quand il en a l'occasion</td><td>6-10 %</td></tr>
          <tr><td>Fold to 3-bet</td><td>Couchers face à un 3-bet après avoir ouvert</td><td>45-60 %</td></tr>
          <tr><td>C-bet flop</td><td>Mises au flop comme relanceur préflop</td><td>50-70 %</td></tr>
          <tr><td>Fold to c-bet</td><td>Couchers face à une c-bet</td><td>40-55 %</td></tr>
          <tr><td>WTSD</td><td>Abattages quand il voit le flop</td><td>25-30 %</td></tr>
          <tr><td>W$SD</td><td>Abattages gagnés</td><td>50-55 %</td></tr></tbody></table>
          <p>Ces fourchettes sont des ordres de grandeur pour le 6-max en ligne ; elles varient selon la limite et la room.</p>`],
        ['Profils en deux chiffres', `<table class="t"><thead><tr><th>VPIP / PFR</th><th>Profil</th><th>Plan</th></tr></thead><tbody>
          <tr><td>45 / 8</td><td>Fish passif (calling station)</td><td>Valeur, pas de bluff, isole-le</td></tr>
          <tr><td>60 / 35</td><td>Maniaque</td><td>Paie plus large, piège</td></tr>
          <tr><td>14 / 11</td><td>Nit</td><td>Vole-le, respecte ses relances</td></tr>
          <tr><td>24 / 20</td><td>Régulier solide</td><td>Équilibre, évite les gros pots marginaux</td></tr>
          <tr><td>32 / 26</td><td>Régulier agressif</td><td>3-bet en valeur plus large, piège plus souvent</td></tr></tbody></table>
          <p>Un grand écart VPIP − PFR (plus de 15 points) signale un joueur qui paie trop préflop : la cible prioritaire.</p>`],
        ['Combiner les chiffres', `<ul><li>WTSD élevé (plus de 33 %) + W$SD bas (moins de 48 %) : va trop à l'abattage avec des mains faibles. Valeur fine.</li>
          <li>WTSD bas + fold to c-bet élevé : abandonne trop. Mise souvent.</li>
          <li>C-bet flop élevé (> 75 %) + c-bet turn bas : abandonne après le flop. Paie le flop, joue le turn.</li>
          <li>Agression postflop très faible : ses mises sont fortes.</li></ul>`],
        ['Ce qui est autorisé (France)', `<p>Les règles changent d'une room à l'autre. Winamax autorise les logiciels de suivi alimentés par les mains que tu as toi-même jouées (HUD classique), mais interdit solveurs, calculateurs d'ICM et d'équité, logiciels de ranges dynamiques et certaines fonctions dynamiques de Hand2Note ; PokerStars publie une liste d'outils autorisés et ne tolère que des charts simples d'ouverture ; d'autres rooms interdisent tout HUD tiers. Les listes changent : vérifie la page officielle de ta room et, en cas de doute, demande par écrit au support.</p>
          <p>Toujours possible : prendre des notes et des couleurs dans le client, analyser tes historiques <em>après</em> la session (onglet Analyse de SIGMA 52).</p>`],
        ['Système de notes', `<ul><li>Une couleur par profil : rouge = fish passif, orange = maniaque, bleu = nit, gris = régulier.</li>
          <li>Une note = un fait daté et vérifiable : « 03/10 : relance river avec 2e paire », pas « bluffeur ».</li>
          <li>Après la session, convertis les faits en profil, pas pendant la main.</li></ul>`],
      ],
      mistakes: ['Juger un joueur sur 20 mains', 'Utiliser un logiciel interdit par la room', 'Écrire des notes vagues (« bluffeur ») au lieu de faits', 'Oublier que les statistiques varient selon la position'],
      keys: ['VPIP/PFR suffisent à classer la plupart des joueurs', 'Gros écart VPIP − PFR = cible prioritaire', 'WTSD élevé + W$SD bas = valeur fine', 'HUD tiers : vérifier la règle de la room'],
      quiz: [
        ['VPIP 48, PFR 6. Profil ?', ['Nit', 'Fish passif', 'Régulier'], 1, 'Joue presque une main sur deux, relance rarement.'],
        ['WTSD 38 %, W$SD 44 %. Exploit ?', ['Bluffer plus', 'Miser plus pour la valeur, moins bluffer'], 1, 'Il va trop à l\'abattage avec des mains faibles.'],
        ['C-bet flop 85 %, c-bet turn 30 %. Plan ?', ['Payer plus au flop et jouer au turn', 'Coucher au flop'], 0, 'Il mise le flop avec trop de mains et abandonne ensuite.'],
        ['Note la plus utile ?', ['« Bluffeur »', '« 03/10 : relance river avec deuxième paire, 2 fois le pot »'], 1, 'Un fait daté et précis.'],
      ],
    });

    K.mod({
      id: 'icm2', level: 4, title: 'Tournois avancés : prime de risque ICM, PKO, tables finales', drill: 'pushfold',
      goals: ['Chiffrer la prime de risque ICM d\'un call', 'Convertir une prime de PKO en jetons et ajuster les cotes', 'Jouer les dynamiques de table finale et de satellite'],
      sections: [
        ['La prime de risque', `<p>En ICM, perdre des jetons coûte plus que n'en gagner ne rapporte. L'équité requise pour payer un tapis augmente : c'est la <strong>prime de risque</strong>.</p>
          <p>Calculs SIGMA 52 (ICM, 4 joueurs, 3 places payées 50/30/20, call de tapis sans argent mort) :</p>
          <table class="t"><thead><tr><th>Situation</th><th class="n">Équité requise (jetons)</th><th class="n">Équité requise (ICM)</th></tr></thead><tbody>
          <tr><td>Tapis égaux 3 000 contre 3 000 (autres 2 000 et 2 000)</td><td class="n">50 %</td><td class="n">68,8 %</td></tr>
          <tr><td>Gros tapis 5 000 qui paie le plus petit (1 000)</td><td class="n">50 %</td><td class="n">52,3 %</td></tr>
          <tr><td>Tapis moyen 2 000 qui paie le gros (5 000)</td><td class="n">50 %</td><td class="n">72,4 %</td></tr>
          <tr><td>Petit tapis 1 000 qui paie le gros</td><td class="n">50 %</td><td class="n">63,4 %</td></tr></tbody></table>
          <p>Leçon : le gros tapis peut attaquer, les tapis moyens doivent se serrer énormément face à lui, et le plus petit tapis a parfois une prime plus faible que les moyens (il bénéficie qu'un autre saute).</p>`],
        ['Bulle et pression', `<p>Le gros tapis ouvre et pousse très large contre les tapis moyens qui ne peuvent pas payer. Les tapis moyens jouent serré entre eux et volent le petit tapis. En satellite (places toutes égales), la prime devient extrême : une fois ta place quasiment acquise, coucher AA peut être correct.</p>`],
        ['PKO : valeur d\'une prime', `<p>Dans un PKO standard, la moitié du buy-in va au prize pool et la moitié aux primes. Quand tu élimines un joueur, tu encaisses la moitié de sa prime ; l'autre moitié s'ajoute à la tienne. Seule la part encaissée tout de suite compte dans les décisions immédiates.</p>
          <p><strong>Jetons par euro</strong> = jetons en jeu ÷ prize pool régulier restant. Au début, la part encaissée d'une prime de départ vaut un quart du buy-in, soit environ <strong>la moitié du tapis de départ</strong> en jetons (le prize pool régulier ne reçoit que la moitié du buy-in : 1 € de prime vaut deux fois plus de jetons que le tapis n'en coûte).</p>
          <p>Exemple : blindes 100/200, tapis de départ 10 000, part encaissée de la prime ≈ 5 000 jetons. Le bouton pousse 2 800, tu es BB avec 11 500 et tu le couvres. Sans prime : 2 600 à payer pour 2 800 + 500 de blindes et antes, il faut 2 600 ÷ (2 600 + 3 300) ≈ 44 %. Avec la prime (≈ 5 000 jetons) : 2 600 ÷ (2 600 + 3 300 + 5 000) ≈ 24 %. Une grande partie des mains devient un call. Plus le tapis adverse est court, plus la prime pèse.</p>`],
        ['Table finale et deals', `<ul><li>Les écarts de gains entre places sont maximaux : la prime de risque monte.</li>
          <li>Un deal ICM partage selon l'équité de chaque tapis (outil Deal ICM) ; un « chip chop » partage au prorata des jetons et avantage les gros tapis.</li>
          <li>Garde une part en jeu pour la victoire si les écarts de niveau sont nets en ta faveur.</li></ul>`],
        ['Méthode d\'étude', `<p>Outil Push/Fold & ICM : compare les ranges de tapis en jetons et en ICM pour la même structure. Note les mains qui changent de décision : c'est ta zone d'erreur probable en tournoi.</p>`],
      ],
      mistakes: ['Payer à 50 % d\'équité sur la bulle', 'Oublier la prime en PKO quand on couvre un tapis court', 'Compter toute la prime adverse au lieu de la part encaissée', 'Accepter un chip chop avec un petit tapis'],
      keys: ['ICM : équité requise > 50 % pour un call à tapis', 'Le gros tapis attaque, les moyens se serrent', 'PKO : part encaissée d\'une prime ≈ la moitié du tapis de départ au début', 'Deal ICM ≠ chip chop'],
      quiz: [
        ['Tapis égaux sur la bulle (4 joueurs, 3 payés). Équité requise pour payer un tapis ?', ['50 %', 'Environ 69 %'], 1, 'Calcul ICM SIGMA 52 : 68,8 %.'],
        ['Qui a la plus faible prime de risque ?', ['Le gros tapis qui paie un petit', 'Le tapis moyen qui paie le gros'], 0, 'Il risque une petite partie de son tapis.'],
        ['PKO standard, début de tournoi. La part encaissée d\'une prime vaut environ…', ['10 % du tapis de départ', 'La moitié du tapis de départ', '100 % du tapis de départ'], 1, 'Un quart du buy-in est encaissé ; le prize pool régulier ne reçoit que la moitié du buy-in, donc ce quart vaut la moitié du tapis de départ en jetons.'],
        ['Satellite, ta place est presque acquise. Tu reçois AA face à un tapis. Décision possible ?', ['Toujours payer', 'Coucher peut être correct'], 1, 'Toutes les places valent pareil : risquer sa place ne rapporte rien.'],
        ['Chip chop : qui avantage-t-il ?', ['Les gros tapis', 'Les petits tapis'], 0, 'Il partage au prorata des jetons, alors que l\'ICM valorise plus les petits tapis.'],
      ],
    });

    K.mod({
      id: 'perf', level: 4, title: 'Performance : A-game, tilt avancé, routine de pro', drill: 'situations',
      goals: ['Reconnaître ton niveau de jeu en cours de session', 'Identifier ton type de tilt et ses déclencheurs', 'Installer une routine avant, pendant et après la session'],
      sections: [
        ['A-game, B-game, C-game', `<p>Le modèle popularisé par Jared Tendler (<em>The Mental Game of Poker</em>, 2011) : ton niveau varie entre ton meilleur jeu (A), ton jeu moyen (B) et ton pire jeu (C). Progresser, c'est surtout <strong>relever le C-game</strong> : les erreurs du C-game coûtent bien plus que ce que le A-game gagne en plus.</p>
          <p>Exercice : écris trois listes. A-game : ce que tu fais quand tu joues bien (décisions calmes, lectures précises). C-game : signes concrets (payer « pour voir », ouvrir plus de tables, jouer plus vite). Relis la liste C avant chaque session.</p>`],
        ['Les types de tilt', `<ul><li><strong>Injustice</strong> : bad beats, « je ne gagne jamais les all-in ».</li><li><strong>Haine de perdre</strong> : impossibilité de finir une session en perte.</li>
          <li><strong>Tilt d'erreur</strong> : colère contre soi après une faute.</li><li><strong>Droit acquis</strong> : « je suis meilleur que lui, je dois gagner ».</li><li><strong>Revanche</strong> : jouer contre un joueur précis.</li></ul>
          <p>Chaque type a ses déclencheurs. Note-les dans le Journal (champ tilt) : au bout de 20 sessions, le schéma apparaît.</p>`],
        ['Routine de session', `<ol><li><strong>Avant</strong> (10 min) : objectif de processus (« isoler tous les limpers fish »), relire la liste C-game, vérifier stop-loss et durée.</li>
          <li><strong>Pendant</strong> : pause de 5 minutes par heure ; un signe du C-game = pause ; stop-loss atteint = arrêt.</li>
          <li><strong>Après</strong> (15 min) : saisir la session, marquer 3 mains à revoir, une phrase sur l'état mental. Étudier le lendemain, à froid.</li></ol>`],
        ['Volume et fatigue', `<p>La qualité des décisions baisse avec la fatigue et le nombre de tables. Augmente le nombre de tables seulement si ton winrate tient sur un échantillon suffisant. En live, l'alcool et les sessions de nuit sont les deux premières sources de C-game.</p>`],
        ['Variance et jugement', `<p>Avec un écart-type d'environ 90 bb/100, même 50 000 mains laissent une incertitude de ±8 bb/100 (intervalle à 95 %). Juge tes décisions (au replayer et au solveur), pas tes résultats de la semaine.</p>`],
      ],
      mistakes: ['Jouer en sachant qu\'on est en C-game', 'Augmenter le volume pendant un downswing pour se refaire', 'Juger son niveau sur une semaine', 'Étudier à chaud juste après une grosse perte'],
      keys: ['Relever le C-game rapporte plus que perfectionner le A-game', 'Connaître son type de tilt et ses déclencheurs', 'Routine avant, pendant, après', 'Juger les décisions, pas les résultats'],
      quiz: [
        ['Le levier le plus rentable pour progresser selon le modèle A/B/C ?', ['Perfectionner le A-game', 'Relever le C-game'], 1, 'Les pires erreurs coûtent le plus.'],
        ['Tu viens de faire une erreur et tu t\'en veux. Type de tilt ?', ['Tilt d\'erreur', 'Injustice'], 0, 'Colère contre soi-même après une faute.'],
        ['Signe de C-game observé en cours de session. Action ?', ['Continuer pour se refaire', 'Pause, et arrêt si ça persiste'], 1, 'Le C-game coûte plus que la session ne rapporte.'],
        ['50 000 mains à +5 bb/100 : tu es certainement gagnant ?', ['Oui', 'Non : l\'intervalle reste d\'environ ±8 bb/100'], 1, '1,96 × 90 / √500 ≈ 7,9 bb/100.'],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
