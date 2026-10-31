// Cours — Niveau 2 : Joueur gagnant. Objectif : battre durablement les micro-limites en exploitant les erreurs des récréatifs.
(function (root) {
  function register(K) {
    K.mod({
      id: 'preflop2', level: 2, title: 'Préflop complet : 3-bet, 4-bet, blindes', minutes: 18, drill: 'rfi',
      goals: ['Construire une range de 3-bet adaptée à l\'adversaire', 'Défendre correctement la grosse et la petite blinde', 'Répondre à un 3-bet et à un squeeze'],
      sections: [
        ['Face à une ouverture : trois choix', `<ul>
          <li><strong>3-bet</strong> (sur-relance) : pour la valeur avec le haut de ta range, pour le bluff avec des mains qui ont des bloqueurs et de la jouabilité.</li>
          <li><strong>Call</strong> : surtout en position, avec des mains qui jouent bien postflop (paires moyennes, assorties).</li>
          <li><strong>Fold</strong> : tout le reste. Hors de position (hors BB), préfère 3-bet ou fold à call.</li></ul>
          <p>La force de l'ouverture dépend de sa position : un open UTG (≈ 16 % des mains) est bien plus fort qu'un open BTN (≈ 44 %). Ajuste ta réponse à la position de l'ouvreur, pas seulement à ta main.</p>`],
        ['Construire le 3-bet', `<table class="t"><thead><tr><th>Contre</th><th>Valeur</th><th>Bluffs possibles</th></tr></thead><tbody>
          <tr><td>Ouverture UTG</td><td>QQ+, AK</td><td>Presque aucun en micro-limites</td></tr>
          <tr><td>Ouverture CO/BTN</td><td>TT+, AQ+, KQs</td><td>A5s-A2s, KJs, QJs, 76s</td></tr>
          <tr><td>Fish qui paie tout</td><td>Plus large : 99+, AJ+, KQ</td><td>Aucun</td></tr></tbody></table>
          <p>Taille : environ 3 fois l'ouverture en position, 4 fois hors de position. Contre un limper puis un ouvreur, ajoute 1 ouverture par joueur entré.</p>
          <p>Pourquoi A5s en bluff : l'As bloque les AA et AK adverses, la main peut faire une couleur ou une roue, et elle domine rarement mal quand elle est payée.</p>`],
        ['Défendre la grosse blinde', `<p>La BB a déjà payé 1 bb. Contre une ouverture à 2,5 bb, elle paie 1,5 bb pour un pot final de 5,5 bb (2,5 + 2,5 + la petite blinde morte) : il lui faut environ 27 % d'équité. Contre le bouton, la défense est donc large (assorties, connecteurs, As faibles, broadways), et se resserre contre UTG. Une main qui a 35 % d'équité mais réalise mal (ex. dépareillée sans connexion) doit parfois être couchée : hors de position, tu n'encaisses pas toute ton équité.</p>`],
        ['La petite blinde', `<p>La SB est la pire position : hors de position contre tout le monde après le flop. Face à une ouverture, joue surtout <strong>3-bet ou fold</strong>, peu de calls (un call laisse la BB entrer à bon prix et tu joues le pot à trois hors de position). Premier à entrer, relance à 3 bb plutôt que de compléter.</p>`],
        ['Face à un 3-bet', `<ul>
          <li><strong>4-bet pour la valeur</strong> : QQ+, AK (contre un 3-bet large, aussi JJ et AQs).</li>
          <li><strong>Call</strong> en position : JJ-77, AQs, AJs, KQs, assorties connectées.</li>
          <li>Contre un joueur qui ne 3-bet que 2 à 3 % : couche AQ, JJ et TT sans regret. Sa range est QQ+ et AK.</li>
          <li>4-bet : environ 2,2 à 2,5 fois le 3-bet. À 100 bb, un 4-bet engage souvent le reste du tapis.</li></ul>`],
        ['Le squeeze', `<p>Une ouverture, un ou plusieurs calls, puis tu 3-bettes : c'est un <strong>squeeze</strong>. Les callers ont montré une range plafonnée (sans les meilleures mains), l'ouvreur est coincé entre eux. Taille : 3-bet normal + 1 ouverture par caller. En micro-limites, squeeze surtout pour la valeur : les fish qui ont payé paient encore.</p>`],
        ['Exemple de main', `<p>NL10. Le CO (régulier, ouvre 28 %) relance à 2,5 bb. Tu as A♦ 4♦ au bouton. Call ? Fold ? Ta main bloque ses As forts, joue bien en position et ne te fait pas perdre gros si elle est payée. 3-bet à 7,5 bb : il couche beaucoup, et s'il paie tu as position et initiative. Contre un fish au CO qui ne couche jamais, la même main se joue en call : pas de bluff contre lui.</p>`],
      ],
      mistakes: ['Payer des 3-bets hors de position avec des mains dominées (AJo, KQo)', 'Défendre la SB comme la BB', 'Bluffer en 3-bet contre des joueurs qui ne se couchent jamais'],
      keys: ['3-bet ou fold hors de position, call surtout en position', 'BB : défense large contre le bouton, ≈ 27 % d\'équité requise', 'Contre un 3-bet serré, couche les mains moyennes'],
      quiz: [
        ["L'UTG (régulier) ouvre, tu as A♠ J♦ au CO. Meilleure action par défaut ?", ['3-bet', 'Call', 'Fold'], 2, "AJo est dominée par une range UTG (AQ, AK). Elle joue mal en call et ne peut pas 3-bet pour la valeur."],
        ["Un fish ouvre à 3 bb au CO, tu as A♥ Q♣ au bouton. Plan ?", ['3-bet pour la valeur', '3-bet bluff', 'Fold'], 0, "Contre une range large qui paie, AQ est une main de valeur."],
        ["Taille de 3-bet hors de position contre une ouverture à 2,5 bb ?", ['5 bb', '10 bb', '20 bb'], 1, "Environ 4 fois l'ouverture hors de position."],
        ["Ouverture UTG, call HJ, call CO. Tu squeezes au bouton. Taille ?", ['7,5 bb', '12,5 bb', '25 bb'], 1, "3-bet en position 7,5 bb + 2,5 bb par caller = 12,5 bb."],
      ],
    });

    K.mod({
      id: 'postflop', level: 2, title: 'Postflop : textures et continuation bet', minutes: 16, drill: 'tirage',
      goals: ['Lire une texture et savoir à qui elle profite', 'Choisir entre petite mise, grosse mise et check', 'Jouer les pots à plusieurs'],
      sections: [
        ['Lire la texture', `<table class="t"><thead><tr><th>Texture</th><th>Exemple</th><th>Favorise</th></tr></thead><tbody>
          <tr><td>Sèche, haute</td><td>K♠ 7♦ 2♣</td><td>Le relanceur préflop (plus de rois, d'As, de grosses paires)</td></tr>
          <tr><td>Connectée, deux couleurs</td><td>9♥ 8♥ 7♣</td><td>Le défenseur (98, T9, 65, petites paires)</td></tr>
          <tr><td>Pairée</td><td>Q♣ Q♦ 5♠</td><td>Celui qui a plus de dames et de paires hautes</td></tr>
          <tr><td>Monocolore</td><td>A♥ 9♥ 4♥</td><td>Celui qui a plus d'As de cœur et de couleurs</td></tr></tbody></table>
          <p>Avant chaque décision, demande-toi : <strong>à qui ce board profite-t-il</strong> ? L'outil Board de SIGMA 52 te montre combien de combinaisons d'une range touchent chaque flop.</p>`],
        ['Le continuation bet', `<ul>
          <li><strong>Board sec qui te favorise</strong> : petite mise (25-33 % du pot) avec presque toute ta range. L'adversaire rate le flop deux fois sur trois.</li>
          <li><strong>Board humide qui favorise l'adversaire</strong> : check plus souvent, mise plus gros (60-75 %) tes mains fortes et tes bons tirages.</li>
          <li><strong>Contre un fish</strong> : moins de c-bets en bluff (il paie avec n'importe quelle paire), plus de grosses mises de valeur.</li></ul>`],
        ['Pourquoi tu mises', `<p>Une mise a une de ces deux raisons :</p><ul><li><strong>Valeur</strong> : être payé par pire.</li><li><strong>Bluff</strong> : faire coucher mieux.</li></ul>
          <p>« Pour voir où j'en suis » n'est pas une raison : les mains pires se couchent, les meilleures continuent, et tu n'apprends rien d'utile. La protection (refuser une carte gratuite à un tirage) s'ajoute à la valeur, elle ne la remplace pas.</p>`],
        ['Pots à plusieurs', `<p>Contre deux adversaires ou plus, la probabilité que quelqu'un ait touché grimpe. Mise seulement avec une vraie main ou un gros tirage. Les bluffs purs perdent leur rentabilité, la top paire faible perd de sa valeur.</p>`],
        ['Exemple de main', `<p>Tu ouvres BTN avec A♣ T♦, la BB paie. Flop K♠ 7♦ 2♣ (pot 5,5 bb). Ta range a tous les AK, KQ, KJ ; celle de la BB très peu (elle aurait 3-bet AK). Petite mise de 1,8 bb : elle doit défendre souvent avec des mains faibles, tu gagnes le pot immédiatement souvent, et AT a encore des outs (As, éventuellement Dame-Valet pour la suite).</p>`],
      ],
      mistakes: ['C-bet automatique sur tous les boards', 'Miser « pour savoir » avec une main moyenne', 'Bluffer dans les pots à trois joueurs ou plus'],
      keys: ['Board sec favorable : petite mise fréquente', 'Board humide défavorable : check plus, mise gros quand tu mises', 'Chaque mise est de la valeur ou un bluff'],
      quiz: [
        ["Tu ouvres UTG, la BB paie. Flop 8♥ 7♥ 6♣. Plan par défaut ?", ['Petite mise toute la range', 'Checker souvent, miser gros tes meilleures mains et tirages', 'Tapis'], 1, "Board très connecté qui favorise la défense de la BB."],
        ["Tu as A♥ K♣ sur Q♠ 9♦ 4♣ contre deux adversaires. Action ?", ['Mise en bluff', 'Check'], 1, "Multiway, sans paire ni tirage fort : le bluff est trop souvent payé."],
        ["Raison valable de miser avec une main moyenne ?", ['Savoir où on en est', 'Être payé par pire'], 1, "Une mise sert à la valeur ou au bluff, jamais à « s'informer »."],
      ],
    });

    K.mod({
      id: 'turnriver', level: 2, title: 'Turn et river : barrels, valeur, bluff-catch', minutes: 18, drill: 'tirage',
      goals: ['Décider d\'un deuxième et troisième barrel', 'Faire de la value fine', 'Payer ou se coucher avec un bluff-catcher'],
      sections: [
        ['Le plan de main', `<p>Au flop, décide déjà : combien de rues de valeur ma main mérite-t-elle (0, 1, 2, 3) ? Quelles turns me font abandonner ? Un plan évite les décisions improvisées sous pression à la river, celles qui coûtent le plus cher.</p>`],
        ['Deuxième barrel', `<p>Continue à miser au turn quand :</p><ul><li>la carte améliore ta range plus que la sienne (overcard pour le relanceur, carte de couleur quand tu as l'As de la couleur) ;</li><li>ta main a pris de l'équité (tirage) ;</li><li>l'adversaire fold trop face aux deuxièmes mises (stat « fold to turn c-bet » élevée).</li></ul>
          <p>Arrête quand la turn complète les tirages de sa range de call et que tu n'as rien.</p>`],
        ['La river : polarisée', `<p>À la river, il n'y a plus de tirage : les mains sont soit gagnantes, soit perdantes. Mise <strong>gros</strong> avec tes très bonnes mains et tes bluffs ; <strong>check</strong> les mains moyennes, qui gagnent souvent à l'abattage mais ne sont payées que par mieux.</p>
          <p class="formula">Bluffs dans une range de mise équilibrée = B ÷ (P + 2B)</p>
          <p>Mise pot : 1 bluff pour 2 mains de valeur (33 %). Mise demi-pot : 1 pour 3 (25 %). Contre les micro-limites, qui paient trop, réduis fortement cette part de bluffs.</p>`],
        ['La value fine', `<p>Contre un fish, mise même la deuxième paire bon kicker à la river : il paie avec pire (paire plus faible, As haut, tirage raté qui « voit »). Contre un régulier, la même mise n'est payée que par mieux. La value fine se décide selon <strong>ce qui paie</strong>, pas selon la force absolue de ta main.</p>`],
        ['Le bluff-catcher', `<p>Un bluff-catcher bat seulement les bluffs. Il se paie selon la fréquence de bluff de l'adversaire, jamais selon sa « force ». Contre une mise pot, il te faut 33 % : si l'adversaire bluffe moins d'une fois sur trois, couche-toi. Les joueurs passifs bluffent rarement gros à la river : contre eux, couche tes bluff-catchers.</p>`],
        ['Exemple de main', `<p>Board final K♦ 9♣ 5♠ 2♥ 9♦. Tu as K♣ J♠ (top paire, kicker moyen). Un fish a payé flop et turn. Mise ⅔ du pot : il paie avec un roi plus faible (K8, K7), une petite paire (66, 77, 88) ou un As haut. Un régulier qui a payé deux fois a surtout des rois mieux accompagnés, des 9 et des fulls : contre lui, check.</p>`],
      ],
      mistakes: ['Barreler sur une turn qui complète la range adverse', 'Payer la river « pour voir » contre un joueur passif', 'Checker la river avec la deuxième paire contre un fish qui paie'],
      keys: ['Un plan dès le flop', 'River : gros avec valeur et bluffs, check les mains moyennes', 'Bluff-catcher : payer selon la fréquence de bluff adverse'],
      quiz: [
        ["River, mise de l'adversaire : pot. Équité requise pour payer ?", ['25 %', '33 %', '50 %'], 1, "1 ÷ (1 + 1 + 1) = 33 %."],
        ["Un joueur passif, qui a payé flop et turn, mise gros à la river. Tu as top paire. Par défaut ?", ['Payer', 'Se coucher'], 1, "Les joueurs passifs bluffent rarement gros à la river."],
        ["Mise demi-pot à la river, proportion de bluffs d'équilibre ?", ['25 %', '33 %', '50 %'], 0, "0,5 ÷ (1 + 2 × 0,5) = 25 %."],
        ["Avec la deuxième paire bon kicker contre un fish qui a payé deux rues, à la river…", ['Check', 'Mise pour la valeur'], 1, "Il paie avec des mains pires."],
      ],
    });

    K.mod({
      id: 'maths2', level: 2, title: 'Maths avancées : combos, bloqueurs, cotes implicites, SPR', minutes: 18, drill: 'outs',
      goals: ['Compter les combinaisons d\'une range', 'Utiliser les bloqueurs', 'Calculer des cotes implicites et la fold equity', 'Planifier avec le SPR'],
      sections: [
        ['Combinatoire', `<ul>
          <li>Paire servie : 6 combinaisons. Main assortie : 4. Dépareillée : 12. Exemple : AK = 16 combos (4 s + 12 o).</li>
          <li>Une carte visible retire des combos : un As au flop laisse 3 combos de AA ; avec un As en main en plus, il n'en reste qu'1.</li>
          <li>Exemple : l'adversaire représente AA, KK ou AK sur A-7-2. AA : 3 combos, KK : 6, AK : 12. Il a AK la majorité du temps.</li></ul>`],
        ['Bloqueurs', `<p>Une carte dans ta main empêche l'adversaire de l'avoir. Bluffer avec l'As de la couleur sur un board à 3 cartes d'une couleur retire ses couleurs à l'As. Payer avec un 9 sur un board où 9-8 fait la suite réduit ses combinaisons de suite. Les bloqueurs servent à choisir tes bluffs et tes calls limites, pas à justifier n'importe quoi.</p>`],
        ['Cotes implicites et inverses', `<p class="formula">Gain futur nécessaire ≈ mise à payer ÷ probabilité de toucher − pot final actuel</p>
          <p>Turn : tu paies 4 € dans un pot final de 16 € avec 19,6 % de toucher ta couleur. Il faut 4 ÷ 0,196 ≈ 20,4 € de pot total en moyenne quand tu touches : il manque 4,4 € à gagner à la river. Contre un fish qui paie, c'est faisable ; contre un régulier, non.</p>
          <p>Les <strong>cotes implicites inverses</strong> sont l'inverse : quand tu touches une main qui perd quand même (petite couleur contre plus haute couleur, suite par le bas). Méfiance avec les tirages non max.</p>`],
        ['Fold equity', `<p class="formula">EV d'une mise = fold % × pot + (1 − fold %) × (équité × pot final − mise)</p>
          <p>Un semi-bluff avec tirage couleur gagne de deux façons : l'adversaire se couche, ou tu touches. C'est pourquoi un tirage se joue souvent agressivement, sauf contre un fish qui ne se couche jamais : contre lui, la fold equity vaut zéro.</p>`],
        ['SPR', `<p class="formula">SPR = tapis effectif ÷ pot au flop</p>
          <table class="t"><thead><tr><th>SPR</th><th>Situation typique</th><th>Main suffisante pour le tapis</th></tr></thead><tbody>
          <tr><td>Moins de 3</td><td>Pot 3-bet ou 4-bet</td><td>Top paire bon kicker, overpair</td></tr>
          <tr><td>4 à 10</td><td>Pot relancé simple</td><td>Deux paires ou mieux, souvent</td></tr>
          <tr><td>Plus de 10</td><td>Pot limpé, tapis profonds</td><td>Mains très fortes ; une paire ne vaut pas un tapis</td></tr></tbody></table>
          <p>Le SPR se décide préflop : 3-bet une main qui veut aller à tapis sur un flop favorable (QQ, AK), call avec une main qui veut un SPR élevé (petite paire qui cherche un brelan).</p>`],
      ],
      mistakes: ['Oublier qu\'une carte du board retire des combos', 'Suivre des tirages non max avec de grosses cotes implicites inverses', 'Semi-bluffer un fish qui ne se couche jamais'],
      keys: ['6 / 4 / 12 combos', 'Cotes implicites : ce qu\'il faut gagner en plus quand tu touches', 'SPR bas = top paire suffit, SPR haut = il faut plus'],
      quiz: [
        ["Board A♠ 7♦ 2♣, tu as A♥ K♥. Combos de AA restants chez l'adversaire ?", ['3', '1', '6'], 1, "Deux As sont visibles pour toi : il n'en reste que 2, soit 1 combinaison."],
        ["Pot de 10 au flop, tapis effectif 25. SPR ?", ['2,5', '10', '35'], 0, "25 ÷ 10 = 2,5 : une top paire forte peut aller à tapis."],
        ["Pourquoi le semi-bluff perd de sa valeur contre un fish passif ?", ['Il n\'a jamais de tirage', 'Il ne se couche presque jamais'], 1, "La fold equity disparaît ; seule reste l'équité du tirage."],
      ],
    });

    K.mod({
      id: 'fish', level: 2, title: 'Exploiter les fish', minutes: 16, drill: 'situations',
      goals: ['Reconnaître chaque type de récréatif', 'Adapter tailles et fréquences pour maximiser ce qu\'ils perdent', 'Les garder à la table'],
      sections: [
        ['Pourquoi c\'est le cœur du jeu', `<p>Ton gain est la somme des erreurs adverses, moins le rake. En micro-limites, l'essentiel de cet argent vient de quelques joueurs récréatifs. Le bilan ANJ 2025 compte 2,5 millions de comptes actifs (+16,5 %), une dépense moyenne en baisse (213 € par compte) et 1,38 million de joueurs qui jouent aussi aux paris sportifs ; la croissance vient des Sit&Go et des tournois. Beaucoup de nouveaux joueurs, petits budgets, formats rapides : ce sont eux qu'il faut savoir exploiter.</p>`],
        ['Profils et stats', `<table class="t"><thead><tr><th>Profil</th><th>VPIP / PFR</th><th>Comment il perd</th></tr></thead><tbody>
          <tr><td>Fish passif (calling station)</td><td>40+ / moins de 10</td><td>Paie trop, bluffe rarement</td></tr>
          <tr><td>Récréatif agressif</td><td>35+ / 15-25</td><td>Mise trop avec des mains faibles, puis paie</td></tr>
          <tr><td>Maniaque</td><td>50+ / 35+</td><td>Relance et bluffe sans retenue</td></tr>
          <tr><td>Nit</td><td>moins de 15 / moins de 12</td><td>Trop serré, se couche trop</td></tr>
          <tr><td>Régulier solide</td><td>20-28 / 17-24</td><td>Peu d'erreurs : évite-le</td></tr></tbody></table>
          <p>VPIP : % des mains où il met de l'argent volontairement. PFR : % où il relance préflop. Un grand écart VPIP − PFR signale un joueur qui suit beaucoup : la cible principale.</p>`],
        ['Plan contre la calling station', `<ul>
          <li>Value bet <strong>gros</strong> (70-100 % du pot) et sur 3 rues avec top paire bon kicker ou mieux.</li>
          <li>Value fine à la river avec deuxième paire.</li>
          <li>Zéro bluff, zéro semi-bluff « pour le faire coucher ».</li>
          <li>Ses rares grosses mises ou relances sont de la valeur : couche tes mains moyennes.</li>
          <li>Isole ses limps préflop avec une range de valeur.</li></ul>`],
        ['Plan contre le maniaque', `<p>Laisse-le s'enferrer : check tes mains fortes pour qu'il mise, paie plus large (deuxième paire, top paire faible), ne bluffe pas. 4-bet pour la valeur plus large préflop (TT+, AQ+). Réduis ton nombre de tables : la variance grimpe.</p>`],
        ['Plan contre le nit', `<p>Vole ses blindes en permanence, c-bet ses checks. Quand il relance ou sur-relance, couche tout sauf le très haut de ta range. Pas de value fine : il ne paie qu'avec mieux.</p>`],
        ['Sièges et ambiance', `<p>Assieds-toi à la <strong>gauche</strong> du fish : il parle avant toi sur la plupart des coups, tu as la position sur le joueur qui te rapporte le plus. Ne commente jamais son jeu : un fish qui s'amuse reste et recave. Un fish vexé quitte la table ou se met à progresser.</p>`],
        ['Exemple de main', `<p>Un fish (VPIP 55, PFR 5) limpe, tu isoles avec K♥ Q♥ à 4,5 bb, il paie. Flop Q♣ 8♦ 3♠. Mise 75 % : il paie avec n'importe quelle paire et des As hauts. Turn 2♥ : mise 75 % encore. River 7♣ : mise 75 %. Contre un régulier, tu aurais misé deux rues sur trois ; contre lui, trois rues rapportent le plus.</p>`],
      ],
      mistakes: ['Bluffer une calling station', 'Miser petit « pour être payé » alors qu\'il paierait gros', 'Payer les relances river d\'un joueur passif', 'Se moquer d\'un fish dans le chat'],
      keys: ['Ton gain vient de quelques joueurs : identifie-les', 'Calling station : valeur grosse, zéro bluff', 'Assieds-toi à sa gauche et sois aimable'],
      quiz: [
        ["HUD : VPIP 48 / PFR 6 sur 200 mains. Contre lui, à la river avec top paire ?", ['Petite mise', 'Grosse mise', 'Check'], 1, "Une calling station paie les grosses mises avec pire."],
        ["Le même joueur relance ta mise à la turn. Tu as top paire. Par défaut ?", ['Payer', 'Relancer', 'Se coucher'], 2, "Un joueur passif qui relance tard a presque toujours mieux."],
        ["Où t'asseoir face au fish ?", ['À sa droite', 'À sa gauche'], 1, "Il parle avant toi : tu as la position sur lui."],
        ["Contre un maniaque, tu as top paire au flop. Plan ?", ['Relancer pour protéger', 'Payer et le laisser bluffer'], 1, "Relancer fait coucher ses bluffs, les mains que tu veux voir continuer."],
      ],
    });

    K.mod({
      id: 'adversaires', level: 2, title: 'Lire les adversaires : stats, lignes, timing', minutes: 13, drill: 'situations',
      goals: ['Interpréter les stats essentielles', 'Reconnaître les lignes d\'action typiques', 'Utiliser le timing et les tailles de mise'],
      sections: [
        ['Les stats qui comptent', `<table class="t"><thead><tr><th>Stat</th><th>Ce qu'elle mesure</th><th>Repère 6-max</th></tr></thead><tbody>
          <tr><td>VPIP / PFR</td><td>Largeur et agressivité préflop</td><td>22-28 / 17-23</td></tr>
          <tr><td>3-bet</td><td>Fréquence de sur-relance</td><td>6-10 %</td></tr>
          <tr><td>Fold to 3-bet</td><td>Se couche après avoir ouvert</td><td>Au-dessus de 60 % : 3-bette-le plus</td></tr>
          <tr><td>C-bet flop</td><td>Mise après avoir relancé</td><td>Au-dessus de 75 % : il bluffe beaucoup</td></tr>
          <tr><td>WTSD</td><td>Va à l'abattage après le flop</td><td>Au-dessus de 32 % : il paie trop</td></tr>
          <tr><td>Agression (AF)</td><td>Mises et relances ÷ calls postflop</td><td>Sous 1 : passif</td></tr></tbody></table>
          <p>Sous 100 mains, une stat est un indice, pas une preuve : VPIP et PFR se stabilisent vite, les stats postflop beaucoup plus lentement.</p>`],
        ['Les lignes typiques en micro-limites', `<ul>
          <li><strong>Check-raise flop d'un passif</strong> : brelan ou deux paires, rarement un bluff.</li>
          <li><strong>Mise minimum (donk) d'un fish</strong> : souvent une main faible ou un tirage qui veut voir la suite pas cher. Relance tes mains de valeur.</li>
          <li><strong>Check-call, check-call, puis grosse mise river</strong> : main faite (souvent la couleur ou la suite qui vient de rentrer).</li>
          <li><strong>Overbet d'un joueur prudent</strong> : très fort.</li></ul>`],
        ['Tailles de mise et timing', `<p>Chez les récréatifs, la taille de mise suit souvent la force : petite = faible ou tirage, grosse = fort. Le timing aussi : une décision instantanée signale souvent une main simple (fold ou call facile), une longue réflexion puis une grosse mise, souvent de la force chez un joueur peu expérimenté. Note ce que tu observes, confirme sur plusieurs mains.</p>`],
        ['En jeu physique', `<p>Les tells existent mais sont peu fiables. Les plus utiles : un joueur qui regarde ses jetons après avoir vu le flop (il a souvent touché), le changement soudain de comportement. Le meilleur tell reste la taille de mise. Toi : même routine à chaque décision, même temps, même geste.</p>`],
      ],
      mistakes: ['Conclure sur 20 mains', 'Croire que toutes les petites mises sont faibles chez un régulier', 'Jouer contre ton image fantasmée de l\'adversaire plutôt que ses actions'],
      keys: ['VPIP − PFR élevé = joueur qui paie', 'Chez les récréatifs, taille de mise ≈ force', 'Un passif qui relance tard est fort'],
      quiz: [
        ["Fold to 3-bet à 75 % sur 400 mains. Ajustement ?", ['3-bet plus souvent en bluff contre lui', 'Ne plus jamais le 3-bet'], 0, "Il abandonne trop face aux 3-bets : ils deviennent rentables même avec des bluffs."],
        ["Un fish mise le minimum dans ton pot relancé. Tu as top paire bon kicker. Plan ?", ['Relancer pour la valeur', 'Se coucher'], 0, "Sa mise minimum est souvent faible : relance pour faire payer ses paires et tirages."],
      ],
    });

    K.mod({
      id: 'mental', level: 2, title: 'Mental et tilt', minutes: 12, drill: 'situations',
      goals: ['Reconnaître son propre tilt avant qu\'il coûte', 'Écrire et appliquer des règles d\'arrêt', 'Séparer résultats et décisions'],
      sections: [
        ['Les formes du tilt', `<ul>
          <li><strong>Injustice</strong> : « il n'aurait jamais dû payer ». C'est pourtant parce qu'il paie que tu gagnes.</li>
          <li><strong>Revanche</strong> : jouer contre un joueur précis plutôt que ses cartes.</li>
          <li><strong>Perte</strong> : vouloir se refaire dans la session, monter de limite.</li>
          <li><strong>Euphorie</strong> : après un gros gain, élargir ses ranges sans raison.</li>
          <li><strong>Fatigue et ennui</strong> : calls « pour voir », décisions lentes ou bâclées.</li></ul>`],
        ['Ton profil de tilt', `<p>Note dans le Journal ton tilt ressenti (0 à 3) à chaque session. Après 20 sessions, regarde : quand arrive-t-il ? Après une perte précise ? Après une heure ? Contre un type de joueur ? Ton plan anti-tilt vise ce déclencheur-là.</p>`],
        ['Règles d\'arrêt (écrites avant de jouer)', `<ul><li>3 caves perdues dans la session → stop.</li><li>Un coup ressenti comme injuste → pause de 10 minutes minimum.</li><li>Durée maximale fixée à l'avance.</li><li>Jamais monter de limite pour se refaire.</li></ul>
          <p>Le journal applique ces règles : il affiche l'alerte dès que tu saisis la perte.</p>`],
        ['Pensée d\'EV', `<p>Après chaque gros coup, une seule question : <strong>la décision était-elle bonne avec l'information que j'avais ?</strong> Si oui, le résultat est de la variance. Si non, note la main pour l'étudier. Les meilleurs joueurs pensent en milliers de mains, pas en sessions.</p>`],
      ],
      mistakes: ['Continuer à jouer « jusqu\'à revenir à zéro »', 'Juger sa session à son résultat', 'Ignorer la fatigue'],
      keys: ['Identifie ton déclencheur de tilt', 'Règles d\'arrêt écrites avant de jouer', 'Bonne décision + mauvais résultat = variance'],
      quiz: [
        ["Tu perds un gros pot sur un tirage adverse à 20 %. Ta prochaine action ?", ['Monter de limite pour se refaire', 'Vérifier ta décision et faire une pause', 'Jouer plus agressif'], 1, "Le call adverse était une erreur de sa part ; ta seule question est la qualité de ta décision."],
        ["Tu as perdu 3 caves, tu te sens bien. Tu…", ['Continues', 'Appliques la règle et t\'arrêtes'], 1, "La règle est écrite pour les moments où on croit aller bien."],
      ],
    });

    K.mod({
      id: 'formats', level: 2, title: 'Formats : cash, Sit&Go, Expresso, tournois', minutes: 12, drill: 'pushfold',
      goals: ['Comparer les formats sur le rake, la variance et la difficulté', 'Choisir un format principal', 'Connaître les spécificités de chacun'],
      sections: [
        ['Ce que dit le marché', `<p>En 2025, selon l'ANJ, les Sit&Go (dont les Expresso) représentent 68 % du produit brut du poker en ligne en France, les tournois 13 % environ, et le cash game 19 % seulement, en recul de 6,5 % sur l'année. La croissance vient des formats rapides : Sit&Go et tournois.</p>`],
        ['Comparatif', `<table class="t"><thead><tr><th>Format</th><th>Variance</th><th>Profondeur</th><th>Pour apprendre</th></tr></thead><tbody>
          <tr><td>Cash game</td><td>Moyenne</td><td>100 bb constante</td><td>Le meilleur : décisions comparables, winrate mesurable</td></tr>
          <tr><td>Expresso / Spin</td><td>Extrême (multiplicateur tiré au sort)</td><td>Courte, push/fold</td><td>Rapide à apprendre, edge difficile à cause du rake intégré</td></tr>
          <tr><td>Sit&Go classique</td><td>Moyenne</td><td>Décroissante</td><td>Bon pour l'ICM</td></tr>
          <tr><td>Tournois (MTT)</td><td>Très forte</td><td>Décroissante</td><td>Gains concentrés sur quelques grosses places</td></tr></tbody></table>`],
        ['Recommandation pour démarrer', `<p>Cash game 6-max en priorité pour construire les fondamentaux et mesurer ta progression. Expresso en second format si tu maîtrises le push/fold (Spots → Tapis ou couché à 90 %). Tournois pour le plaisir et l'expérience de l'ICM, avec une bankroll séparée.</p>`],
      ],
      mistakes: ['Choisir un format pour son jackpot plutôt que pour son edge', 'Mélanger les bankrolls de formats différents', 'Juger un format sur 50 parties'],
      keys: ['Sit&Go et Expresso dominent le marché français', 'Le cash est le meilleur format pour apprendre', 'Une bankroll par format'],
      quiz: [
        ["Selon l'ANJ, quel segment pèse le plus dans le poker en ligne français en 2025 ?", ['Cash game', 'Sit&Go (Expresso inclus)', 'Tournois'], 1, "68 % du produit brut des jeux du poker."],
        ["Pourquoi le cash game est-il le meilleur format pour apprendre ?", ['Moins de rake', 'Profondeur constante et winrate mesurable', 'Pas de variance'], 1, "Les décisions se comparent d'une session à l'autre."],
      ],
    });

    K.mod({
      id: 'live', level: 2, title: 'Le poker en jeu physique', minutes: 10, drill: 'situations',
      goals: ['Connaître les règles et usages d\'une salle', 'Ajuster sa stratégie au live', 'Gérer une session longue'],
      sections: [
        ['Où jouer', `<p>En France, le poker en dur se joue dans les casinos autorisés et, à Paris, dans les clubs de jeux. Les festivals (circuits des rooms, étapes internationales) attirent beaucoup de récréatifs. Pièce d'identité obligatoire, et l'interdiction de jeu ANJ s'y applique aussi.</p>`],
        ['Règles de salle à connaître', `<ul><li>Annonce verbale qui engage : ce que tu dis vaut action.</li><li>Une action hors tour peut être maintenue ou annulée selon la règle de la salle : ne parle jamais avant ton tour.</li><li>Cartes et jetons visibles, jetons de plus grosse valeur à l'avant.</li><li>Pas de téléphone pendant une main. Aucune appli d'aide à la table : c'est la même règle qu'en ligne, et les festivals disqualifient.</li></ul>`],
        ['Ajustements stratégiques', `<ul><li>Moins de mains par heure (25-35 contre 60+ en ligne par table) : chaque erreur adverse vaut plus, chaque table se choisit avec soin.</li><li>Ouvertures plus grosses (souvent 3-5 bb et plus), pots plus souvent multiway : plus de valeur, moins de bluffs.</li><li>Les récréatifs paient encore plus qu'en ligne : la value bet est reine.</li></ul>`],
        ['Gestion de la session', `<p>Fixe ta durée, mange et bois de l'eau, pause toutes les deux heures. La fatigue live est plus lente à repérer qu'en ligne. Saisis ta session dans le Journal en sortant, avec 2 mains à revoir.</p>`],
      ],
      mistakes: ['Annoncer une action hors tour', 'Bluffer autant qu\'en ligne contre des tables multiway', 'Jouer 10 heures d\'affilée'],
      keys: ['Ce que tu annonces t\'engage', 'Plus de valeur, moins de bluffs', 'Aucune aide électronique à la table'],
      quiz: [
        ["En live, tu dis « je paie » puis tu poses deux fois la mise. Ce qui compte ?", ['Les jetons posés', 'L\'annonce'], 1, "L'annonce verbale engage."],
        ["Ajustement principal en live contre des récréatifs ?", ['Plus de bluffs', 'Plus de value bets'], 1, "Ils paient encore plus qu'en ligne."],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
