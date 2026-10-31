// Cours — modules « 360 » (v21) : les manques du catalogue comblés.
// Niveau 2 : fast-fold, choix des tables, squeeze et cold-call. Niveau 3 : réalisation d'équité, jouer en position comme caller,
// pots multiway après le flop, tables à 3-4 joueurs. Niveau 4 : pots 4-bet, overbets et tailles géométriques, construire ses ranges,
// jouer contre les réguliers, lecture bayésienne, le rake et la stratégie.
// Équités : moteur SIGMA 52 (120 000 tirages, ± 0,3 point) contre la range d'ouverture BTN de l'onglet Ranges. Les taux de réalisation
// d'équité cités sont des ordres de grandeur pédagogiques (ils dépendent de l'arbre et des adversaires), signalés comme tels.
(function (root) {
  const ex = (items) => items.map(([q, a], i) => `<details class="exo"><summary><strong>Exercice ${i + 1}.</strong> ${q}</summary><p>${a}</p></details>`).join('');
  function register(K) {
    // ================= Niveau 2 =================
    K.mod({
      id: 'rapide', level: 2, title: 'Le fast-fold : jouer vite sans jouer mal', drill: 'rfi',
      goals: ["Savoir ce qui change quand on change de table à chaque main", "Ajuster ses ouvertures, ses vols et ses 3-bets à une population plus serrée", "Tenir le rythme sans laisser filer la qualité des décisions"],
      sections: [
        ["Ce qui change vraiment", `<p>En fast-fold (Zoom chez PokerStars ; vérifie l'offre de ta room), tu quittes la table dès que tu te couches et tu reçois une nouvelle main à une autre table. Trois conséquences :</p>
          <ul><li><strong>Tu ne lis plus les individus</strong>, tu joues contre une population : tu croises rarement deux fois le même joueur dans la même session.</li>
          <li><strong>La population est plus serrée avant le flop</strong> : chacun peut attendre une bonne main sans « perdre son temps », et les joueurs les plus loisirs préfèrent souvent les tables classiques.</li>
          <li><strong>Le volume explose</strong> : beaucoup plus de mains par heure. Une erreur répétée coûte donc plus vite, et la fatigue arrive plus tôt.</li></ul>`],
        ["Avant le flop", `<p>Ta chart d'ouverture reste la base. Les ajustements de population habituels :</p>
          <ul><li><strong>Vole davantage</strong> depuis le bouton et le cutoff quand les blindes défendent peu : plus les joueurs derrière sont serrés, plus une ouverture rapporte par les folds.</li>
          <li><strong>Respecte les ouvertures des premières positions</strong> : dans un pool serré, une ouverture UTG est rarement légère. Tes 3-bets bluffs doivent alors viser surtout les ouvertures tardives.</li>
          <li><strong>Face à une 3-bet, couche un peu plus</strong> qu'aux tables classiques si la population 3-bette peu : une 3-bet rare est une 3-bet forte.</li></ul>
          <p>Ces tendances se vérifient avec tes propres données (onglet Analyse) : un pool n'est pas l'autre, et les tendances changent avec la limite.</p>`],
        ["Après le flop", `<p>Sans lecture individuelle, joue contre les <strong>tendances de population</strong> : aux micro-limites, les grosses mises de river sont souvent sous-bluffées, les check-raises du flop sont plus souvent forts qu'à l'équilibre, et beaucoup de joueurs abandonnent le pot au turn après avoir payé le flop. Conséquences pratiques : couche plus de bluff-catchers face aux grosses mises river d'inconnus, mise plus souvent le turn quand l'adversaire a payé le flop puis checke.</p>`],
        ["Le rythme et la fatigue", `<p>Fixe la session en <strong>nombre de mains ou en temps</strong>, pas en résultat, et prévois une pause courte toutes les 45 à 60 minutes. En fast-fold, le bouton « fold rapide » pousse à jouer en pilote automatique : si tu te surprends à ne plus savoir ce que l'adversaire a ouvert, arrête la table. Commence par une seule table de fast-fold : elle vaut déjà plusieurs tables classiques en volume.</p>`],
        ["Exercices corrigés", ex([
          ["Tu es au bouton en fast-fold, tout le monde passe jusqu'à toi, les blindes sont des inconnus. Tu as K♦8♣. Ouverture ou fold ?", "Ouverture : K8o est dans la range d'ouverture du bouton, et un pool serré en défense rend le vol encore plus rentable. Prépare-toi à miser petit sur les flops secs à la hauteur."],
          ["Un inconnu UTG ouvre, tu as A♠5♠ au BTN. 3-bet bluff ?", "Plutôt non dans un pool serré : l'ouverture UTG est forte et la 3-bet bluff sera souvent payée ou sur-relancée. A5s se joue mieux en 3-bet contre les ouvertures tardives (CO, BTN). Contre UTG, payer ou se coucher selon tes ranges."],
          ["Tu as joué 900 mains en 1 h 20 et tu viens de perdre deux gros pots. Que fais-tu ?", "Pause, puis check-in mental (onglet Mental). Le volume du fast-fold amplifie le tilt : mieux vaut arrêter la session que d'enchaîner 300 mains de moindre qualité."],
        ])],
      ],
      mistakes: ["Jouer le fast-fold en multi-tables dès le début", "Garder des 3-bets bluffs contre des ouvertures UTG d'un pool serré", "Payer les grosses mises river d'inconnus avec des mains moyennes", "Fixer la fin de session sur un résultat"],
      keys: ["Population, pas individus", "Plus de vols depuis le bouton, plus de respect pour les premières positions", "Session limitée en mains ou en temps, pauses régulières", "Vérifier les tendances avec ses propres mains"],
      quiz: [
        ["En fast-fold, ton principal outil de lecture est…", ["Les tendances de population", "Les notes sur chaque adversaire", "Les tells de timing", "Ton image à la table"], 0, "Tu croises rarement deux fois le même joueur : tu joues contre le pool."],
        ["Face à une population plus serrée en défense des blindes, tu…", ["Voles davantage depuis le bouton", "Ouvres moins depuis le bouton", "Limpes au bouton", "Ne changes rien"], 0, "Plus les joueurs derrière couchent souvent, plus une ouverture rapporte par les folds."],
        ["Une 3-bet bluff rapporte surtout contre…", ["Les ouvertures tardives (CO, BTN)", "Les ouvertures UTG d'un pool serré", "Les limps", "Les tapis courts"], 0, "Les ouvertures tardives sont plus larges, donc plus souvent couchées face à une 3-bet."],
        ["Le premier risque spécifique du fast-fold est…", ["Le pilote automatique et la fatigue", "Le manque de mains", "Le rake plus faible", "L'absence de position"], 0, "Le volume pousse à décider sans réfléchir."],
        ["Pour fixer la fin d'une session, on utilise…", ["Un nombre de mains ou une durée", "Un objectif de gain", "Une perte à récupérer", "L'humeur du moment"], 0, "Le résultat n'est pas sous ton contrôle, le temps et le volume le sont."],
      ],
    });

    K.mod({
      id: 'selection', level: 2, title: 'Choisir ses tables : la compétence la plus rentable', drill: 'situations',
      goals: ["Comprendre pourquoi ton gain dépend surtout de l'écart de niveau à la table", "Repérer une bonne table et un joueur faible en quelques minutes", "Savoir quand changer de place ou quitter une table"],
      sections: [
        ["Ton gain vient de l'écart, pas de ton niveau absolu", `<p>Tu ne gagnes pas contre le poker, tu gagnes contre les joueurs assis avec toi. Un joueur moyen à une table de joueurs faibles gagne plus qu'un très bon joueur à une table de très bons joueurs, qui paie surtout le rake. Choisir ses tables n'est pas de la lâcheté : c'est la partie la plus simple et la plus rentable du métier.</p>`],
        ["Repérer une bonne table", `<ul><li><strong>Le lobby</strong> : si ton client affiche la taille moyenne des pots ou la part de joueurs qui voient le flop, préfère les tables où ces chiffres sont élevés pour la limite.</li>
          <li><strong>Les premières minutes</strong> : beaucoup de limps, de calls préflop, de pots à plusieurs, de mains montrées à l'abattage sans logique ? Bonne table.</li>
          <li><strong>Les horaires</strong> : les joueurs loisirs jouent plutôt le soir et le week-end. C'est une tendance, à vérifier dans tes propres sessions (Journal).</li></ul>`],
        ["Les signes d'un joueur faible", `<ul><li>Il limpe en premier, souvent, puis paie les relances.</li><li>Il paie beaucoup de relances préflop et va très souvent à l'abattage.</li><li>Il mise le minimum ou des tailles sans logique (la moitié du pot avec les nuts, le pot avec rien).</li><li>Il montre des mains qui n'auraient pas dû arriver jusque-là.</li></ul>
          <p>Note ce que tu vois dans les notes du client (autorisées) : une étiquette de couleur suffit pour le retrouver demain.</p>`],
        ["Où s'asseoir", `<p>Assieds-toi <strong>à la gauche</strong> du joueur faible : tu parles après lui sur la plupart des mains, tu isoles ses limps en position et tu profites de ses erreurs avant les autres. À l'inverse, évite d'avoir à ta gauche un régulier agressif qui 3-bette souvent : il te prend la position et l'initiative.</p>`],
        ["Quand quitter la table", `<ul><li>Le joueur faible est parti et il ne reste que des réguliers.</li><li>Tu n'arrives plus à te concentrer, ou tu joues pour te refaire contre un joueur précis.</li><li>Tu ne sais plus dire, à chaque main, quelle est la range de l'ouvreur.</li></ul>
          <p>Une table qui ne te rapporte plus rien n'est pas une table que « tu dois » battre.</p>`],
        ["Exercices corrigés", ex([
          ["Deux tables NL10 : l'une affiche 15 % de joueurs au flop, l'autre 38 %. Laquelle ?", "La seconde : 38 % de joueurs au flop signifie beaucoup de calls préflop et de pots à plusieurs, signe de joueurs loisirs. À la première, la table est serrée, probablement remplie de réguliers."],
          ["Le joueur qui limpait toutes ses mains vient de partir. Il reste cinq réguliers. Que fais-tu ?", "Tu quittes la table (ou tu cherches une autre table avec un joueur faible). Rester revient à jouer pour le rake."],
          ["Un joueur faible est assis deux places à ta droite. Une place se libère à sa gauche directe. Tu bouges ?", "Oui, si ta room le permet sans frais : à sa gauche directe, tu parles juste après lui sur presque toutes les mains et tu isoles ses limps en position."],
        ])],
      ],
      mistakes: ["Rester à une table de réguliers par ego", "Juger une table sur une seule main", "S'asseoir à la droite des joueurs faibles", "Ne pas noter les joueurs faibles rencontrés"],
      keys: ["Le gain vient de l'écart de niveau", "Repérer : limps, calls, pots à plusieurs, tailles sans logique", "S'asseoir à la gauche du joueur faible", "Quitter quand la table ne rapporte plus"],
      quiz: [
        ["Ton gain à une table dépend surtout…", ["De l'écart de niveau avec les autres joueurs", "De ton niveau absolu", "De la limite jouée", "De ta chance"], 0, "On gagne contre les joueurs présents, pas contre le jeu."],
        ["La meilleure place par rapport à un joueur faible est…", ["À sa gauche", "À sa droite", "En face", "Aucune importance"], 0, "Tu parles après lui sur la plupart des mains."],
        ["Un signe fort de joueur faible est…", ["Il limpe en premier puis paie les relances", "Il ouvre souvent au bouton", "Il 3-bette ses meilleures mains", "Il mise petit sur les boards secs"], 0, "Le limp puis call est une erreur coûteuse et typique."],
        ["Le joueur faible part, il ne reste que des réguliers. Tu…", ["Quittes ou changes de table", "Restes pour prouver ton niveau", "Montes de limite", "Joues plus de mains"], 0, "Sans joueur faible, l'argent part surtout au rake."],
        ["Les notes sur les adversaires dans le client sont…", ["Autorisées et utiles", "Interdites", "Inutiles en ligne", "Réservées aux pros"], 0, "Les notes manuelles du client sont autorisées par les rooms."],
      ],
    });

    K.mod({
      id: 'squeeze', level: 2, title: 'Squeeze et cold-call : les pots à plusieurs avant le flop', drill: 'vsopen',
      goals: ["Savoir quand sur-relancer après une ouverture et un call (squeeze)", "Choisir les bonnes tailles selon la position", "Savoir quand payer une ouverture (cold-call) et quand l'éviter"],
      sections: [
        ["Définitions", `<p><strong>Squeeze</strong> : 3-bet après une ouverture <em>et</em> au moins un call. <strong>Cold-call</strong> : payer une relance sans avoir encore mis d'argent volontairement dans le pot (par exemple payer l'ouverture du CO depuis le bouton). <strong>Overcall</strong> : payer après qu'un autre joueur a déjà payé.</p>`],
        ["Pourquoi le squeeze rapporte", `<p>Deux raisons. D'abord l'<strong>argent mort</strong> : l'ouverture et le call sont déjà dans le pot, et tu les remportes souvent sans voir le flop. Ensuite, la range du joueur qui a payé est <strong>plafonnée</strong> : avec ses meilleures mains, il aurait souvent 3-betté lui-même. Il couche donc beaucoup face au squeeze.</p>
          <p>Exemple : CO ouvre à 2,5 bb, BTN paie, tu squeezes depuis la BB à 12,5 bb. Tu risques 11,5 bb de plus pour un pot de 6,5 bb. Un squeeze bluff est rentable immédiatement si tout le monde se couche plus de 11,5 ÷ (11,5 + 6,5) ≈ <strong>64 %</strong> du temps, sans compter l'équité de ta main quand tu es payé.</p>`],
        ["Les tailles", `<p>Règle simple : <strong>la taille d'une 3-bet normale, plus une ouverture par joueur qui a payé</strong>.</p>
          <div class="tw"><table class="t"><thead><tr><th>Position du squeeze</th><th>3-bet normale</th><th>Squeeze avec 1 caller (ouverture 2,5 bb)</th></tr></thead><tbody>
          <tr><td>En position (BTN)</td><td>3 × l'ouverture</td><td>7,5 + 2,5 = 10 bb</td></tr>
          <tr><td>Hors de position (blindes)</td><td>4 × l'ouverture</td><td>10 + 2,5 = 12,5 bb</td></tr></tbody></table></div>
          <p>Hors de position, la taille plus grosse compense le désavantage de position et décourage les calls.</p>`],
        ["Quelles mains squeezer", `<ul><li><strong>Valeur</strong> : QQ+, AK, et JJ ou AQs selon l'ouvreur.</li>
          <li><strong>Bluffs</strong> : des mains avec un bloqueur et de la jouabilité si tu es payé, comme A5s-A2s, KJs, QJs. L'as bloque AA et AK, la couleur donne de l'équité.</li>
          <li><strong>Contre une ouverture UTG</strong>, resserre : son range est fort, l'argent mort ne suffit plus à rendre les bluffs rentables.</li></ul>`],
        ["Le cold-call", `<ul><li>Il se justifie <strong>en position</strong>, avec des mains qui jouent bien multiway : paires moyennes et petites (pour toucher un brelan), assorties connectées, broadways assortis.</li>
          <li>Depuis la <strong>SB</strong>, évite le cold-call : tu seras hors de position contre deux joueurs, et la BB peut squeezer derrière toi. La SB joue surtout en <strong>3-bet ou fold</strong>.</li>
          <li>Face à un squeeze, le joueur qui a cold-callé couche la majorité de sa range : c'est le prix du call.</li></ul>`],
        ["Face au squeeze", `<p>Tu as ouvert, un joueur a payé, un troisième squeeze : tu es pris en sandwich. Le joueur qui a payé peut encore jouer après toi. Paie donc moins qu'en face d'une 3-bet simple : <strong>4-bet ou fold</strong> devient la norme, en gardant quelques calls en position avec des mains fortes et jouables (TT, AQs).</p>`],
        ["Exercices corrigés", ex([
          ["CO ouvre 2,5 bb, BTN paie, tu es en SB avec A♣4♣. Que fais-tu, à quelle taille ?", "Squeeze à environ 12,5 bb (4 × 2,5 + 2,5). A4s bloque AA et AK et garde de l'équité quand il est payé. Le cold-call depuis la SB est à éviter."],
          ["Tu squeezes à 12 bb depuis la BB après une ouverture à 2,5 bb et un call. Quel taux de fold global te rend rentable immédiatement ?", "Tu risques 11 bb de plus (12 − 1 déjà posé) pour un pot de 6,5 bb : 11 ÷ (11 + 6,5) ≈ <strong>63 %</strong>."],
          ["UTG ouvre, MP paie, tu es au bouton avec 7♠7♥. Squeeze ou call ?", "Plutôt call : contre une ouverture UTG forte, 77 ne squeeze pas pour la valeur et bluffe mal. En position, 77 joue bien en multiway pour toucher un brelan (environ 12 % au flop)."],
        ])],
      ],
      mistakes: ["Squeezer à la taille d'une 3-bet normale", "Cold-caller depuis la SB", "Squeezer en bluff contre une ouverture UTG", "Payer un squeeze avec une main moyenne en étant pris en sandwich"],
      keys: ["Argent mort + range plafonnée du caller = squeeze rentable", "Taille : 3-bet normale + une ouverture par caller", "Bluffs : bloqueurs et jouabilité (A5s-A2s, KJs)", "SB : 3-bet ou fold"],
      quiz: [
        ["Un squeeze est…", ["Une 3-bet après une ouverture et au moins un call", "Une 4-bet", "Un call après une 3-bet", "Une relance du flop"], 0, "C'est la 3-bet en présence d'un caller."],
        ["La taille d'un squeeze depuis la BB après une ouverture à 2,5 bb et un call est d'environ…", ["12,5 bb", "7,5 bb", "5 bb", "25 bb"], 0, "4 × 2,5 + 2,5 = 12,5 bb."],
        ["La range du joueur qui a payé l'ouverture est dite…", ["Plafonnée", "Polarisée", "Nutted", "Infinie"], 0, "Ses meilleures mains auraient souvent 3-betté."],
        ["Depuis la SB face à une ouverture, la stratégie de base est…", ["3-bet ou fold", "Cold-call", "Limp", "Toujours payer"], 0, "Hors de position avec la BB derrière, le call est coûteux."],
        ["Un bon squeeze bluff a…", ["Un bloqueur et de la jouabilité", "Aucune équité", "Une paire de 2", "Une main dépareillée faible"], 0, "Ex. A5s : bloque AA et AK, garde de l'équité."],
      ],
    });

    // ================= Niveau 3 =================
    K.mod({
      id: 'realisation', level: 3, title: "La réalisation d'équité : pourquoi 65s se défend mieux que K7o", drill: 'vsopen',
      goals: ["Comprendre la différence entre l'équité brute et l'équité réalisée", "Savoir ce qui fait réaliser plus ou moins son équité", "Corriger le calcul de cote du pot par la réalisation d'équité"],
      sections: [
        ["Équité brute, équité réalisée", `<p>L'<strong>équité brute</strong> est la part du pot que ta main gagnerait si les cartes étaient tirées jusqu'à la river sans plus aucune mise. Mais il y aura des mises : parfois tu te coucheras avec la meilleure main, parfois tu gagneras un gros pot avec une main cachée. L'<strong>équité réalisée</strong> est la part du pot que tu récupères vraiment en jouant la main. Le rapport entre les deux est la <strong>réalisation d'équité</strong> (EQR).</p>
          <p>Une EQR de 100 % : tu récupères exactement ton équité. En dessous, la main « perd » de son équité en route ; au-dessus, elle en gagne (elle gagne plus de pots, ou de plus gros, que son équité brute ne le laisse croire).</p>`],
        ["Ce qui fait réaliser son équité", `<ul><li><strong>La position</strong> : parler en dernier permet de voir gratuitement des cartes, de contrôler la taille du pot et de bluffer au bon moment. En position, l'EQR monte ; hors de position, elle baisse.</li>
          <li><strong>L'initiative</strong> : le relanceur préflop réalise mieux son équité que le caller.</li>
          <li><strong>La jouabilité</strong> : les mains assorties et connectées touchent des tirages et des mains fortes cachées ; les mains dépareillées non connectées touchent surtout des paires faibles, difficiles à jouer.</li>
          <li><strong>Le potentiel de nuts</strong> : un tirage couleur à l'as ou une suite haute gagne de gros pots ; une petite paire dominée en perd.</li>
          <li><strong>La profondeur</strong> : avec des tapis profonds, la position et la jouabilité pèsent plus.</li></ul>`],
        ["L'exemple de la grosse blinde", `<p>BTN ouvre à 2,5 bb, tu es en BB. Tu paies 1,5 bb pour un pot final de 5,5 bb : la cote demande <strong>1,5 ÷ 5,5 ≈ 27 %</strong> d'équité si tu réalisais 100 %. Contre la range d'ouverture du bouton, le moteur donne :</p>
          <div class="tw"><table class="t"><thead><tr><th>Main</th><th class="n">Équité brute</th><th>Jouabilité</th></tr></thead><tbody>
          <tr><td>A2o</td><td class="n">46,7 %</td><td>Moyenne : as faible souvent dominé</td></tr>
          <tr><td>22</td><td class="n">46,5 %</td><td>Particulière : touche un brelan 12 % du temps, sinon souvent abandonnée</td></tr>
          <tr><td>Q9o</td><td class="n">43,8 %</td><td>Moyenne</td></tr>
          <tr><td>K7o</td><td class="n">43,6 %</td><td>Faible : paires dominées, peu de tirages</td></tr>
          <tr><td>6♠5♠</td><td class="n">38,7 %</td><td>Forte : tirages, suites et couleurs cachées</td></tr>
          <tr><td>J4o</td><td class="n">35,9 %</td><td>Très faible</td></tr></tbody></table></div>
          <p>Hors de position, une EQR de l'ordre de 60 % pour J4o (ordre de grandeur) ramène son équité utile vers 22 % : sous les 27 %, fold. 6♠5♠ a moins d'équité brute que K7o, mais il la réalise bien mieux : il se défend avec plus de profit.</p>`],
        ["Corriger la cote du pot", `<p>La règle pratique : <strong>équité requise ÷ EQR = équité brute nécessaire</strong>. Avec 27 % requis et une EQR estimée à 70 %, il te faut 27 ÷ 0,7 ≈ <strong>39 %</strong> d'équité brute. Avec une EQR de 90 % (main jouable, en position), 30 % suffisent.</p>
          <p>Tu n'as pas besoin de chiffres exacts : retiens le sens. Hors de position, avec une main peu jouable, exige plus d'équité brute ; en position, avec une main assortie et connectée, tu peux payer avec moins.</p>`],
        ["Au-delà du préflop", `<p>La même logique vaut après le flop : un tirage couleur au roi en position réalise très bien son équité (il voit la river souvent, gagne de gros pots) ; une paire faible hors de position face à un adversaire agressif la réalise mal (elle se couchera souvent au turn). C'est pourquoi le solveur couche parfois des mains qui ont « la cote » et en paie d'autres qui ne l'ont pas.</p>`],
        ["Exercices corrigés", ex([
          ["Cote requise 25 %, EQR estimée 80 %. Quelle équité brute te faut-il ?", "25 ÷ 0,8 = <strong>31,25 %</strong>."],
          ["Tu hésites en BB contre le bouton entre K6o (43 % d'équité brute environ) et 7♥6♥ (40 % environ). Laquelle défendre en priorité ?", "7♥6♥ : moins d'équité brute, mais une bien meilleure réalisation (tirages, mains fortes cachées). K6o touche surtout des paires de rois dominées ou des paires de 6 faibles."],
          ["Pourquoi un tirage couleur à l'as peut-il réaliser plus de 100 % de son équité ?", "Quand il touche, il a les nuts et gagne souvent un gros pot (l'adversaire paie avec une couleur plus faible ou une grosse main) ; quand il rate, il perd peu. Il récupère plus que sa part brute."],
        ])],
      ],
      mistakes: ["Défendre toutes les mains qui « ont la cote » brute hors de position", "Préférer K7o à 65s en défense parce que l'équité brute est plus élevée", "Oublier que le relanceur en position réalise mieux son équité", "Croire que l'EQR est une valeur fixe par main"],
      keys: ["Équité réalisée = équité brute × réalisation d'équité", "Position, initiative, jouabilité, potentiel de nuts", "Équité brute nécessaire = équité requise ÷ EQR", "Hors de position, exige plus ; en position, défends plus large"],
      quiz: [
        ["La réalisation d'équité (EQR) est…", ["Le rapport entre l'équité réalisée et l'équité brute", "L'équité contre une seule main", "La cote du pot", "Le taux de victoire à l'abattage"], 0, "Elle mesure la part de l'équité brute que tu récupères vraiment."],
        ["Qu'est-ce qui augmente l'EQR ?", ["La position et la jouabilité", "Être hors de position", "Une main dépareillée", "Un tapis court face à un agresseur"], 0, "Parler en dernier et toucher des mains fortes cachées."],
        ["Cote requise 27 %, EQR 70 %. Équité brute nécessaire ?", ["Environ 39 %", "27 %", "19 %", "70 %"], 0, "27 ÷ 0,7 ≈ 38,6 %."],
        ["Contre l'ouverture du bouton, 65s a moins d'équité brute que K7o. En BB, …", ["65s se défend mieux grâce à sa jouabilité", "K7o se défend toujours mieux", "Les deux se couchent", "Les deux se 3-bettent toujours"], 0, "La réalisation compense l'écart d'équité brute."],
        ["Une main peut réaliser plus de 100 % de son équité quand…", ["Elle gagne de gros pots quand elle touche et perd peu sinon", "Elle est hors de position", "Elle est dominée", "Le tapis est très court"], 0, "Ex. tirage couleur max en position."],
      ],
    });

    K.mod({
      id: 'caller_ip', level: 3, title: 'Jouer en position après avoir payé : float, relance, check derrière', drill: 'situations',
      goals: ["Connaître la forme de ta range quand tu as payé en position", "Choisir entre payer, relancer et se coucher face au c-bet", "Savoir quoi faire quand le relanceur checke"],
      sections: [
        ["Ta range de caller en position", `<p>Quand tu paies une ouverture au bouton (ou une 3-bet en position), ta range est <strong>condensée</strong> : tu as 3-betté une partie de tes meilleures mains (AA, KK, AK souvent), et couché les plus faibles. Il te reste surtout des paires moyennes, des broadways et des assorties connectées. Conséquence : tu as moins de « nuts » que le relanceur sur beaucoup de flops hauts, mais plus de mains moyennes et de tirages.</p>`],
        ["Face au c-bet : défendre assez", `<p>Face à une mise d'un tiers du pot, l'alpha vaut 0,33 ÷ 1,33 = <strong>25 %</strong> : tu dois continuer avec environ <strong>75 %</strong> de ta range pour ne pas lui offrir des bluffs gratuits. Face à 75 % du pot, alpha = 0,75 ÷ 1,75 ≈ 43 %, défense minimale ≈ 57 %. Contre un adversaire qui bluffe peu, défends moins ; contre un c-bet automatique, défends plus.</p>`],
        ["Payer (float), relancer ou se coucher", `<ul><li><strong>Payer</strong> : paires moyennes, tirages, et mains avec des backdoors et des overcards (le « float »), qui comptent gagner le pot plus tard quand il abandonne.</li>
          <li><strong>Relancer</strong> : valeur (doubles paires, brelans, top paire forte sur boards dangereux) et semi-bluffs avec de l'équité (tirages couleur, tirages suite par les deux bouts). Taille habituelle : environ 3 fois sa mise.</li>
          <li><strong>Se coucher</strong> : les mains sans paire, sans tirage et sans backdoor.</li></ul>
          <p>Relancer avec tes tirages plutôt que tes mains moyennes : les tirages ont de l'équité si tu es payé, les mains moyennes préfèrent arriver à l'abattage pas cher.</p>`],
        ["Quand il checke", `<ul><li><strong>Au flop</strong> : sa range qui checke est souvent faible (il aurait misé ses bonnes mains sur les boards favorables). Mise souvent, petit, avec les mains qui profitent d'un fold ou d'un call d'une main plus faible.</li>
          <li><strong>Check derrière</strong> : avec les mains moyennes qui veulent aller à l'abattage (troisième paire, as haut sur board sec) et quelques mains fortes pour protéger ta range de checks.</li>
          <li><strong>Au turn, après flop misé-payé, il checke</strong> : il abandonne souvent. Mise avec tes floats qui ont gardé de l'équité ou un bloqueur ; checke derrière avec tes mains d'abattage.</li></ul>`],
        ["Le plan sur trois rues", `<p>Avant de payer le flop, demande-toi : « Sur quelles turns je continue, sur lesquelles je mise s'il checke, sur lesquelles j'abandonne ? ». Un float sans plan devient un call perdu.</p>`],
        ["Exercices corrigés", ex([
          ["BTN contre BB qui a 3-betté, tu as payé avec J♠T♠. Flop K♥7♠3♠, il mise un tiers du pot. Ton plan ?", "Payer : tirage couleur, plus un tirage suite par la porte de derrière. Relancer est possible en semi-bluff, mais avec un tiers du pot, payer garde ses bluffs dans sa range. Sur une turn pique, tu as une couleur ; sur un Q ou un 9, tu gagnes un tirage suite."],
          ["Il mise un tiers du pot. Quelle part de ta range dois-tu continuer pour ne pas le laisser bluffer gratuitement ?", "Alpha = 0,33 ÷ 1,33 ≈ 25 % : continue avec environ <strong>75 %</strong> de ta range."],
          ["Flop Q♦8♣3♥, il checke. Tu as 6♣6♦. Mise ou check ?", "Check derrière le plus souvent : 66 a de la valeur d'abattage, une mise fait coucher les mains plus faibles et payer les plus fortes. Exception : contre un joueur qui abandonne tout au turn, une petite mise de protection se défend."],
        ])],
      ],
      mistakes: ["Payer le flop sans plan pour les rues suivantes", "Relancer les mains moyennes plutôt que les tirages", "Ne jamais miser quand le relanceur checke", "Se coucher trop face aux petits c-bets"],
      keys: ["Range condensée : mains moyennes et tirages", "Petit c-bet : défends environ 75 % de ta range", "Relance : valeur et semi-bluffs avec équité", "Il checke : sa range est souvent faible, mise souvent et petit"],
      quiz: [
        ["En position après avoir payé une ouverture, ta range est plutôt…", ["Condensée (mains moyennes, tirages)", "Polarisée (nuts et air)", "Pleine de AA", "Aléatoire"], 0, "Tes meilleures mains ont souvent été 3-bettées."],
        ["Face à un c-bet d'un tiers du pot, la défense minimale est d'environ…", ["75 %", "50 %", "25 %", "33 %"], 0, "Alpha = 25 %, défense = 75 %."],
        ["Pour relancer un c-bet en semi-bluff, on préfère…", ["Les tirages avec de l'équité", "Les mains moyennes", "Les mains sans rien", "Les paires faibles"], 0, "Ils ont de l'équité quand ils sont payés."],
        ["Le relanceur checke le flop. Sa range est souvent…", ["Plus faible que sa range de mise", "Plus forte", "Identique", "Composée de nuts"], 0, "Il mise ses bonnes mains sur les flops favorables."],
        ["Un float, c'est…", ["Payer le flop avec peu de main pour gagner le pot plus tard", "Relancer à tapis", "Checker avec les nuts", "Se coucher au turn"], 0, "On paie avec l'intention de prendre le pot quand il abandonne."],
      ],
    });

    K.mod({
      id: 'multiway_post', level: 3, title: 'Les pots à trois et plus après le flop', drill: 'odds',
      goals: ["Comprendre pourquoi les bluffs rapportent moins à plusieurs", "Resserrer ses mises de valeur et ses calls", "Calculer la défense nécessaire quand plusieurs joueurs font face à une mise"],
      sections: [
        ["Ce qui change à plusieurs", `<ul><li><strong>Quelqu'un a souvent touché</strong> : plus il y a de joueurs, plus la probabilité qu'une main forte soit en face augmente.</li>
          <li><strong>Les bluffs doivent faire coucher tout le monde</strong> : si chacun de deux adversaires couche la moitié du temps (indépendamment), tous deux ne couchent que 0,5 × 0,5 = <strong>25 %</strong> du temps.</li>
          <li><strong>Les mains moyennes perdent de la valeur</strong> : une top paire petit kicker, solide en tête-à-tête, devient fragile face à trois ranges.</li>
          <li><strong>Les tirages aux nuts gagnent de la valeur</strong> : ils gagnent souvent un gros pot, payés par plusieurs joueurs.</li></ul>`],
        ["Miser moins souvent, plus fort", `<p>Le c-bet à plusieurs se fait <strong>moins souvent</strong> qu'en tête-à-tête, surtout avec des mains qui ne veulent pas être payées par plusieurs mains meilleures. Mise tes mains fortes et tes tirages forts ; checke beaucoup de mains moyennes et d'air. La « protection » d'une main moyenne est souvent un mythe : tu fais coucher les mains que tu bats et payer celles qui te battent.</p>`],
        ["Défendre à plusieurs : la défense se partage", `<p>Face à une mise du pot, la défense minimale est de 50 % en tête-à-tête. À deux défenseurs, il suffit que <strong>l'un des deux</strong> continue assez souvent. Si chacun défend la même part <em>d</em>, les deux couchent (1 − d)² du temps ; pour que ce soit 50 %, d = 1 − √0,5 ≈ <strong>29 %</strong>. Chacun peut donc défendre bien moins que 50 % : défendre comme en tête-à-tête à plusieurs, c'est payer trop.</p>`],
        ["Position et sandwich", `<p>Le joueur entre le parieur et un autre joueur encore à parler est <strong>pris en sandwich</strong> : s'il paie, il peut subir une relance derrière. Il doit resserrer ses calls (mains qui supportent une relance ou très bonnes cotes implicites). Le dernier à parler, lui, peut payer plus large : il clôture l'action.</p>`],
        ["Exercices corrigés", ex([
          ["Tu bluffes contre deux adversaires qui couchent chacun 60 % du temps, indépendamment. Probabilité que tous deux couchent ?", "0,6 × 0,6 = <strong>36 %</strong>. Pour une mise de la moitié du pot (il faut 33 % de folds), c'est à peine rentable ; pour une mise du pot (50 %), non."],
          ["Flop à quatre joueurs, tu as A♣J♦ sur J♥8♥6♣. Mise ou check ?", "Mise possible pour la valeur et la protection contre les tirages, mais avec prudence : à quatre, les doubles paires, brelans et suites sont nombreux. Prépare-toi à ralentir face à une relance."],
          ["Mise de 75 % du pot, deux défenseurs. Quelle part chacun doit-il défendre si la défense est partagée également ?", "Alpha = 0,75 ÷ 1,75 ≈ 43 % : les deux doivent coucher au plus 43 % ensemble. (1 − d)² = 0,43 → d ≈ 1 − 0,656 ≈ <strong>34 %</strong> chacun."],
        ])],
      ],
      mistakes: ["C-better à plusieurs comme en tête-à-tête", "Bluffer contre trois joueurs", "Payer comme si chacun devait défendre 50 % face à une mise du pot", "Surestimer la top paire petit kicker"],
      keys: ["Les folds se multiplient : bluffs moins rentables", "Mains fortes et tirages aux nuts gagnent de la valeur", "Défense partagée : chacun défend moins qu'en tête-à-tête", "Le joueur pris en sandwich resserre"],
      quiz: [
        ["Deux adversaires couchent chacun 50 % du temps. Ton bluff fait coucher tout le monde…", ["25 % du temps", "50 % du temps", "75 % du temps", "100 % du temps"], 0, "0,5 × 0,5 = 0,25."],
        ["À plusieurs, une top paire petit kicker…", ["Perd de la valeur", "Gagne de la valeur", "Devient les nuts", "Se joue toujours à tapis"], 0, "Plus de chances qu'une main meilleure soit en face."],
        ["Face à une mise du pot et deux défenseurs, chacun peut défendre environ…", ["29 %", "50 %", "75 %", "10 %"], 0, "1 − √0,5 ≈ 29 %."],
        ["Le joueur pris en sandwich doit…", ["Resserrer ses calls", "Payer plus large", "Toujours relancer", "Toujours se coucher"], 0, "Il peut subir une relance derrière lui."],
        ["Les tirages aux nuts, à plusieurs…", ["Gagnent de la valeur", "Perdent toute valeur", "Se couchent", "Ne changent pas"], 0, "Ils gagnent de gros pots payés par plusieurs joueurs."],
      ],
    });

    K.mod({
      id: 'shorthanded', level: 3, title: 'Tables à 3 et 4 joueurs : élargir sans exploser', drill: 'rfi',
      goals: ["Adapter tes ranges quand la table se vide", "Savoir quelle chart utiliser selon le nombre de joueurs", "Gérer les blindes qui reviennent beaucoup plus souvent"],
      sections: [
        ["Pourquoi les ranges s'élargissent", `<p>Une main ouvre avec profit quand les joueurs derrière ont peu de chances d'avoir mieux. À six joueurs, l'UTG a cinq joueurs derrière lui ; à quatre, le premier à parler n'en a que trois : c'est la situation du cutoff à six. Moins il reste de joueurs à parler, plus la range d'ouverture s'élargit.</p>`],
        ["Quelle chart utiliser", `<div class="tw"><table class="t"><thead><tr><th>Joueurs à la table</th><th>Premier à parler</th><th>Chart à utiliser</th></tr></thead><tbody>
          <tr><td>6</td><td>UTG</td><td>UTG</td></tr><tr><td>5</td><td>HJ</td><td>HJ</td></tr><tr><td>4</td><td>CO</td><td>CO</td></tr><tr><td>3</td><td>BTN</td><td>BTN</td></tr><tr><td>2</td><td>SB (bouton)</td><td>Tête-à-tête (module dédié)</td></tr></tbody></table></div>
          <p>Règle : <strong>utilise la chart de la position qui a le même nombre de joueurs derrière toi</strong>.</p>`],
        ["Les blindes reviennent plus vite", `<p>À trois joueurs, tu es dans les blindes deux mains sur trois. Tu ne peux pas te contenter d'attendre de bonnes mains : défendre et 3-better plus souvent devient indispensable, sinon les blindes te coûtent une part énorme de ton tapis. Les mains moyennes (paires, as dépareillés, rois assortis) prennent beaucoup de valeur.</p>`],
        ["Après le flop", `<p>Ranges plus larges = mains plus faibles en moyenne. Top paire devient une main forte, deuxième paire une main d'abattage fréquente, et les bluffs doivent rester crédibles. Les adversaires réguliers à 3-4 joueurs sont souvent agressifs : n'abandonne pas tes mains moyennes trop vite face aux petites mises.</p>`],
        ["Exercices corrigés", ex([
          ["Cash game 6-max, deux joueurs sont partis : vous êtes quatre. Tu es premier à parler avec K♣T♦. Ouverture ?", "Utilise la chart du CO : KTo y figure (pas dans la chart UTG). Ouverture."],
          ["À trois joueurs, pourquoi ne pas jouer serré dans les blindes ?", "Tu es en blinde deux mains sur trois : jouer serré te ferait perdre tes blindes en continu face aux vols."],
          ["À quatre joueurs, un adversaire ouvre en premier. Sa range est-elle plutôt forte ou large ?", "Plutôt large : c'est l'équivalent d'une ouverture du CO à six. Adapte tes 3-bets et tes défenses en conséquence."],
        ])],
      ],
      mistakes: ["Garder la chart UTG à quatre joueurs", "Abandonner trop souvent ses blindes à trois", "Surestimer la force d'une ouverture en premier à table courte", "Bluffer sans crédibilité parce que « tout le monde joue large »"],
      keys: ["Même nombre de joueurs derrière toi = même chart", "À 4 : chart CO ; à 3 : chart BTN", "Les blindes reviennent souvent : défendre et 3-better plus", "Top paire devient une main forte"],
      quiz: [
        ["À quatre joueurs, le premier à parler utilise la chart…", ["CO", "UTG", "BB", "Tête-à-tête"], 0, "Trois joueurs derrière lui, comme le CO à six."],
        ["À trois joueurs, tu es dans les blindes…", ["Deux mains sur trois", "Une main sur six", "Jamais", "Une main sur deux"], 0, "SB et BB sur trois positions."],
        ["La règle pour choisir sa chart à table courte :", ["Même nombre de joueurs derrière soi", "Toujours la chart UTG", "Toujours la chart BTN", "Jouer seulement les paires"], 0, "Le nombre de joueurs à parler compte."],
        ["À table courte, une top paire est…", ["Une main forte", "Une main faible", "Un bluff", "À coucher"], 0, "Les ranges sont plus larges."],
        ["Une ouverture en premier à quatre joueurs est plutôt…", ["Large", "Très serrée", "Toujours AA-KK", "Un limp"], 0, "Équivalente à une ouverture du CO."],
      ],
    });

    // ================= Niveau 4 =================
    K.mod({
      id: 'pots4bet', level: 4, title: 'Les pots 4-bet : petites profondeurs, grosses décisions', drill: 'combos',
      goals: ["Construire une range de 4-bet (valeur et bluffs) et choisir sa taille", "Calculer le SPR d'un pot 4-bet et en déduire ta limite d'engagement", "Décider face à une 5-bet à tapis"],
      sections: [
        ["La 4-bet avant le flop", `<p><strong>Tailles</strong> : en position, environ 2,2 à 2,5 fois la 3-bet ; hors de position, 2,5 à 3 fois. À 100 bb, une 4-bet engage déjà près d'un quart du tapis.</p>
          <p><strong>Range</strong> : valeur (QQ+, AK, parfois JJ selon l'adversaire) et bluffs choisis pour leurs <strong>bloqueurs</strong> : A5s-A4s bloquent AA et AK et gardent de l'équité ; K5s ou Q5s parfois. Contre un 3-bettor serré, réduis les bluffs ; contre un 3-bettor très large, augmente-les.</p>`],
        ["Calculer le SPR", `<p>Exemple à 100 bb : CO ouvre 2,5 bb, BTN 3-bette à 7,5 bb, CO 4-bette à 18 bb, BTN paie. Pot = 18 + 18 + 0,5 + 1 = <strong>37,5 bb</strong>, tapis restants = 82 bb. SPR = 82 ÷ 37,5 ≈ <strong>2,2</strong>.</p>
          <p>Avec un SPR proche de 2, une <strong>top paire bon kicker ou mieux est engagée</strong> : tu ne te couches pas pour le reste du tapis. Les décisions difficiles concernent les mains moyennes (paires sous la top paire, overcards).</p>`],
        ["Après le flop : petit et souvent", `<p>Ranges serrées et SPR bas : le 4-bettor mise souvent <strong>petit</strong> (environ un tiers du pot) au flop. La petite mise suffit pour engager le tapis sur trois rues, protège contre les overcards et garde les bluffs dans la range adverse. Sur les flops bas (8-5-2), le caller de la 4-bet a plus de paires moyennes : le 4-bettor checke plus souvent.</p>`],
        ["Face à une 5-bet à tapis", `<p>Tu 4-bettes à 22 bb, l'adversaire part à tapis à 100 bb (blindes hors du coup). Pot final si tu paies : 100 + 100 + 1,5 = 201,5 bb ; tu paies 78 bb. Il te faut 78 ÷ 201,5 ≈ <strong>38,7 %</strong> d'équité.</p>
          <div class="tw"><table class="t"><thead><tr><th>A♥K♦ contre…</th><th class="n">Équité</th></tr></thead><tbody>
          <tr><td>QQ+, AKs</td><td class="n">33,3 %</td></tr><tr><td>QQ+, AK</td><td class="n">38,9 %</td></tr><tr><td>JJ+, AK, A5s, A4s</td><td class="n">45,2 %</td></tr></tbody></table></div>
          <p>Contre une range de 5-bet très serrée, AK est juste à l'équilibre ; dès que l'adversaire y met des bluffs ou JJ, le call devient clair. <strong>Tes bluffs de 4-bet, eux, se couchent</strong> face à la 5-bet : c'est leur rôle.</p>`],
        ["Exercices corrigés", ex([
          ["BTN ouvre 2,5 bb, BB 3-bette à 11 bb, BTN 4-bette à 25 bb, BB paie. Pot et SPR à 100 bb ?", "Pot = 25 + 25 = <strong>50 bb</strong> (la SB a couché ses 0,5 bb : pot 50,5). Tapis restants 75 bb. SPR ≈ 75 ÷ 50,5 ≈ <strong>1,5</strong>."],
          ["Pourquoi A5s plutôt que K9o en 4-bet bluff ?", "A5s bloque AA et AK (les mains qui continuent le plus), garde de l'équité (couleur, suite 5-4-3-2-A) et se couche sans regret face à la 5-bet. K9o ne bloque presque rien et joue mal."],
          ["SPR 2, flop A♠8♦3♣, tu as K♠K♥ après ta 4-bet. Il checke. Ton plan ?", "Mise petite : beaucoup de mains de sa range (QQ, JJ, AQ, AJ) restent dans le coup face à un tiers du pot. Face à un check-raise à tapis, l'as est souvent là : décision serrée, mais KK reste une main d'abattage contre des paires inférieures."],
        ])],
      ],
      mistakes: ["4-better bluff des mains sans bloqueur", "Se coucher avec une top paire bon kicker à SPR 2", "Miser gros au flop alors qu'un tiers du pot suffit", "Payer une 5-bet avec ses bluffs de 4-bet"],
      keys: ["Taille : 2,2-2,5× en position, 2,5-3× hors de position", "Bluffs avec bloqueurs : A5s-A4s", "SPR ≈ 2 : top paire bon kicker engagée", "Face à une 5-bet : AK paie contre une range qui contient plus que QQ+ et AK"],
      quiz: [
        ["Un bon 4-bet bluff est…", ["A5s", "K9o", "72o", "J4s"], 0, "Bloqueur d'as et équité."],
        ["SPR = 82 ÷ 37,5. Valeur arrondie ?", ["2,2", "1,0", "4,5", "0,5"], 0, "82 ÷ 37,5 ≈ 2,19."],
        ["À SPR 2, une top paire bon kicker est…", ["Engagée pour le tapis", "À coucher face à toute mise", "Un bluff", "À checker-coucher"], 0, "Le tapis est trop court pour la coucher."],
        ["Face à une 5-bet tapis, il faut environ 38,7 %. AK contre QQ+, AK a…", ["38,9 %", "25 %", "55 %", "70 %"], 0, "Juste à l'équilibre."],
        ["Au flop d'un pot 4-bet, le 4-bettor mise souvent…", ["Petit (environ un tiers du pot)", "Tapis", "Deux fois le pot", "Jamais"], 0, "Le SPR bas permet d'engager le tapis avec de petites mises."],
      ],
    });

    K.mod({
      id: 'overbets', level: 4, title: 'Overbets et tailles géométriques', drill: 'mdf',
      goals: ["Savoir quand miser plus que le pot", "Calculer la taille qui met tout le tapis en un nombre donné de rues", "Défendre correctement face à un overbet"],
      sections: [
        ["Quand l'overbet est la bonne taille", `<p>Un overbet (mise supérieure au pot) se justifie quand <strong>trois conditions</strong> sont réunies :</p>
          <ol><li>Tu as un <strong>avantage de nuts</strong> : beaucoup plus de mains très fortes que l'adversaire sur ce board.</li>
          <li>La range adverse est <strong>plafonnée</strong> : sa ligne a exclu ses meilleures mains (il aurait relancé, ou 3-betté avant le flop).</li>
          <li>Ta range de mise est <strong>polarisée</strong> : des mains très fortes et des bluffs, pas de mains moyennes.</li></ol>
          <p>Exemple classique : turn qui complète une suite que ta range a beaucoup plus souvent que la sienne, après qu'il a payé le flop.</p>`],
        ["Les chiffres de l'overbet", `<div class="tw"><table class="t"><thead><tr><th>Taille</th><th class="n">Alpha (folds requis)</th><th class="n">Défense minimale</th><th class="n">Équité pour payer</th></tr></thead><tbody>
          <tr><td>Pot (100 %)</td><td class="n">50 %</td><td class="n">50 %</td><td class="n">33,3 %</td></tr>
          <tr><td>150 % du pot</td><td class="n">60 %</td><td class="n">40 %</td><td class="n">37,5 %</td></tr>
          <tr><td>200 % du pot</td><td class="n">66,7 %</td><td class="n">33,3 %</td><td class="n">40 %</td></tr></tbody></table></div>
          <p>Plus la mise grossit, plus la défense nécessaire baisse, mais plus chaque call doit avoir d'équité. Les bluffs d'overbet doivent donc faire coucher beaucoup ; la valeur doit battre les mains qui paient.</p>`],
        ["Les tailles géométriques", `<p>Pour mettre tout le tapis en <em>n</em> rues avec la même fraction <em>f</em> du pot à chaque rue : (1 + 2f)ⁿ = (P + 2S) ÷ P, où P est le pot et S le tapis restant.</p>
          <ul><li>Pot 20 bb, tapis 80 bb : (20 + 160) ÷ 20 = 9. En deux rues : 1 + 2f = 3, donc <strong>f = 100 %</strong> du pot à chaque rue. En trois rues : 9^(1/3) ≈ 2,08, donc <strong>f ≈ 54 %</strong>.</li></ul>
          <p>La taille géométrique maximise la taille du pot final pour une main de valeur tout en gardant la même fraction à chaque rue : c'est la référence pour une range polarisée qui veut tout mettre à la river.</p>`],
        ["Face à un overbet", `<p>Défends moins (la défense minimale baisse), mais choisis bien tes calls : tes meilleures mains moyennes et surtout celles qui <strong>bloquent ses mains de valeur</strong> sans bloquer ses bluffs. Contre un joueur qui n'overbette jamais en bluff, couche presque tout sauf les nuts. Le Solveur et le node locking permettent de mesurer ce que te coûte chaque hypothèse.</p>`],
        ["Exercices corrigés", ex([
          ["Il mise 150 % du pot à la river. Quelle équité te faut-il pour payer ?", "1,5 ÷ (1 + 1,5 + 1,5) = 1,5 ÷ 4 = <strong>37,5 %</strong>."],
          ["Pot 30 bb au flop, tapis 120 bb. Fraction géométrique pour être à tapis à la river (trois rues) ?", "(30 + 240) ÷ 30 = 9 ; 9^(1/3) ≈ 2,08 ; f ≈ (2,08 − 1) ÷ 2 ≈ <strong>54 %</strong> du pot à chaque rue."],
          ["Turn : la carte complète une suite que tu as souvent, lui presque jamais, il a payé le flop et checke. Taille ?", "Overbet (125 à 200 % du pot) avec tes suites, tes mains les plus fortes et des bluffs bien choisis : avantage de nuts, range adverse plafonnée."],
        ])],
      ],
      mistakes: ["Overbetter avec des mains moyennes", "Overbetter sans avantage de nuts", "Payer un overbet avec une main qui bloque ses bluffs", "Défendre autant face à un overbet que face à une demi-mise"],
      keys: ["Overbet : avantage de nuts + range adverse plafonnée + range polarisée", "150 % du pot : il faut 37,5 % pour payer", "Géométrique : (1 + 2f)ⁿ = (P + 2S) ÷ P", "Face à l'overbet : moins de calls, mieux choisis"],
      quiz: [
        ["Un overbet suppose surtout…", ["Un avantage de nuts", "Une main moyenne", "Être hors de position sans initiative", "Un tirage faible"], 0, "Tu dois avoir beaucoup plus de mains très fortes."],
        ["Face à une mise de 200 % du pot, l'équité nécessaire pour payer est…", ["40 %", "33,3 %", "50 %", "25 %"], 0, "2 ÷ (1 + 2 + 2) = 40 %."],
        ["Pot 20 bb, tapis 80 bb, deux rues : fraction géométrique ?", ["100 % du pot", "33 % du pot", "54 % du pot", "200 % du pot"], 0, "(1 + 2f)² = 9, donc f = 1."],
        ["La range adverse est plafonnée quand…", ["Sa ligne a exclu ses meilleures mains", "Il a 3-betté", "Il a relancé le flop", "Il a les nuts"], 0, "Il aurait joué autrement ses meilleures mains."],
        ["Face à un overbet, la défense minimale…", ["Baisse", "Augmente", "Reste à 50 %", "Disparaît"], 0, "Plus la mise est grosse, plus alpha monte."],
      ],
    });

    K.mod({
      id: 'construire', level: 4, title: 'Construire ses propres ranges préflop', drill: 'rfi',
      goals: ["Comprendre d'où viennent les charts et pourquoi elles ne sont pas sacrées", "Adapter une range au rake, aux adversaires et aux tailles", "Tester une modification sans se raconter d'histoires"],
      sections: [
        ["D'où viennent les charts", `<p>Les charts de SIGMA 52 (onglet Ranges, Atlas préflop, solveur préflop) sont des points de départ calculés pour des hypothèses précises : 6 joueurs, 100 bb, tailles standard, adversaires qui jouent eux aussi une stratégie solide. Dès qu'une hypothèse change, la range optimale change. Une chart est une carte, pas le terrain.</p>`],
        ["Les ajustements qui comptent", `<ul><li><strong>Le rake</strong> : plus il est élevé, plus il faut resserrer, surtout les calls et les mains marginales (module « Le rake et la stratégie »).</li>
          <li><strong>Les joueurs derrière toi</strong> : une BB qui défend peu et ne 3-bette jamais permet d'ouvrir plus large au bouton ; un 3-bettor agressif au bouton oblige à resserrer au CO et à préparer des 4-bets.</li>
          <li><strong>La profondeur</strong> : à 200 bb, les mains à potentiel de nuts (assorties, paires) gagnent ; les mains dominées (KJo, QTo) perdent.</li>
          <li><strong>Ta taille d'ouverture</strong> : ouvrir plus petit permet d'ouvrir un peu plus large, ouvrir plus gros oblige à resserrer.</li></ul>`],
        ["La méthode en quatre étapes", `<ol><li><strong>Pars de la chart</strong> de la position et de la profondeur.</li>
          <li><strong>Identifie une hypothèse fausse</strong> (« les blindes de mon pool défendent beaucoup moins que l'équilibre ») et vérifie-la avec tes données (onglet Analyse : fuites préflop, profils).</li>
          <li><strong>Modifie peu de mains à la fois</strong>, celles qui sont à la frontière (EV proche de zéro dans le solveur préflop).</li>
          <li><strong>Mesure</strong> sur un échantillon suffisant : le résultat d'une semaine ne prouve rien, la fréquence de vols réussis ou de 3-bets payées, si.</li></ol>`],
        ["Les mains de frontière", `<p>Les mains au bord de la range (K9o au CO, 87s en UTG) ont une EV proche de zéro : les jouer ou non change peu ton résultat. Les décisions qui coûtent cher sont ailleurs : limps, calls dominés, mains jouées hors de position sans plan. Avant de peaufiner ta frontière, corrige les grosses fuites.</p>`],
        ["Exercices corrigés", ex([
          ["Ton pool de BB défend très peu face aux ouvertures du bouton. Que changes-tu ?", "Tu élargis l'ouverture du bouton avec les mains de frontière (K7o, Q7o, J5s…) : chaque fold de la BB rapporte 1,5 bb. Tu vérifies ensuite ton taux de vol réussi."],
          ["Le joueur au bouton 3-bette très souvent tes ouvertures du CO. Deux ajustements ?", "Resserre légèrement ton ouverture du CO (retire les mains qui jouent mal face à une 3-bet) et ajoute des 4-bets (valeur QQ+, AK, et quelques bluffs A5s-A4s) ou des calls en position avec des mains jouables."],
          ["Tu joues à 200 bb. Quelles mains gagnent de la valeur, lesquelles en perdent ?", "Gagnent : paires, assorties connectées, as assortis (potentiel de nuts). Perdent : mains dépareillées dominées (KJo, QTo, ATo) qui gagnent de petits pots et en perdent de gros."],
        ])],
      ],
      mistakes: ["Traiter une chart comme une vérité absolue", "Changer beaucoup de mains à la fois", "Juger une modification sur le résultat d'une semaine", "Peaufiner la frontière en gardant des limps et des calls dominés"],
      keys: ["Une chart = des hypothèses ; si elles changent, la range change", "Rake, joueurs derrière, profondeur, taille d'ouverture", "Modifier peu de mains, celles de la frontière", "Mesurer avec des fréquences, pas des résultats"],
      quiz: [
        ["Une chart préflop est…", ["Un point de départ calculé sous des hypothèses", "Une vérité absolue", "Valable à toutes les profondeurs", "Interdite par les rooms"], 0, "Elle dépend des hypothèses de calcul."],
        ["Une BB qui défend peu face au bouton permet…", ["D'ouvrir plus large au bouton", "D'ouvrir plus serré", "De limper", "De ne jamais voler"], 0, "Chaque fold rapporte les blindes."],
        ["À 200 bb, perdent de la valeur…", ["Les mains dépareillées dominées", "Les paires", "Les assorties connectées", "Les as assortis"], 0, "Elles gagnent de petits pots et en perdent de gros."],
        ["Pour tester une modification de range, on mesure…", ["Des fréquences sur un échantillon suffisant", "Le résultat de la semaine", "Son ressenti", "Le nombre de bad beats"], 0, "Les fréquences convergent bien plus vite que les résultats."],
        ["Les mains de frontière ont…", ["Une EV proche de zéro", "Une EV très positive", "Une EV très négative", "Toujours raison"], 0, "Les jouer ou non change peu."],
      ],
    });

    K.mod({
      id: 'regs', level: 4, title: 'Jouer contre les réguliers', drill: 'situations',
      goals: ["Reconnaître un régulier et ses tendances", "Exploiter les fuites typiques des réguliers des petites limites", "Savoir éviter les confrontations qui coûtent sans rapporter"],
      sections: [
        ["Reconnaître un régulier", `<p>Un régulier joue beaucoup de mains au total, souvent sur plusieurs tables, avec des fréquences « raisonnables » : il ouvre selon sa position, 3-bette, mise souvent le flop. Tes notes et tes analyses d'historiques (onglet Analyse) te montrent qui revient tous les jours.</p>`],
        ["D'où vient l'argent contre eux", `<p>Contre un régulier, l'écart est petit : tu gagnes peu par main, et la variance est forte. Les gains viennent de leurs <strong>fuites de fréquence</strong>, pas d'erreurs grossières. Les plus courantes aux petites limites (à vérifier dans tes données) :</p>
          <ul><li><strong>Trop de folds face aux 3-bets</strong> : 3-bette davantage ses ouvertures tardives, avec des bluffs à bloqueurs.</li>
          <li><strong>C-bet automatique</strong> sur tous les flops : défends plus, relance plus souvent en semi-bluff sur les flops qui te favorisent.</li>
          <li><strong>Pas assez de bluffs à la river</strong> : couche davantage de bluff-catchers face à ses grosses mises river.</li>
          <li><strong>Abandon au turn</strong> après un c-bet payé : mise quand il checke le turn.</li></ul>`],
        ["Méta-jeu : il s'adapte aussi", `<p>Un régulier te note, lui aussi. Si tu 3-bettes chaque ouverture, il finira par 4-better ou payer plus. Ajuste par petites touches, observe sa réaction, reviens vers une stratégie solide s'il s'adapte. L'exploitation la plus rentable est celle qu'il ne remarque pas.</p>`],
        ["Éviter ce qui ne rapporte pas", `<ul><li>Les guerres d'ego (3-bet, 4-bet, 5-bet bluffs répétés contre le même joueur) : beaucoup de variance, peu d'espérance.</li>
          <li>Les tables où il n'y a que des réguliers : le rake prend l'essentiel (module « Choisir ses tables »).</li>
          <li>Les spots marginaux hors de position contre le meilleur joueur de la table.</li></ul>
          <p>Le but n'est pas de « battre » le régulier, c'est de lui prendre ce qu'il donne et de jouer les gros pots contre les joueurs faibles.</p>`],
        ["Exercices corrigés", ex([
          ["Un régulier couche environ 70 % de ses ouvertures du bouton face à une 3-bet. Tu es en SB avec K♠J♠. Que fais-tu ?", "3-bet : avec autant de folds, la 3-bet rapporte immédiatement, et KJs joue bien quand elle est payée. Sur la durée, observe s'il commence à 4-better."],
          ["Il mise gros à la river sur une carte neutre après check-call turn. Ton historique montre qu'il bluffe très peu dans ce spot. Tu as une top paire faible.", "Fold : la cote demande une part de bluffs que ce joueur n'atteint pas. Le node locking du Solveur te permet de chiffrer l'écart."],
          ["Il te 3-bette trois fois de suite. Tu as A♦5♦. Que fais-tu ?", "4-bet bluff possible, une fois : A5s bloque AA et AK. Mais n'entre pas dans une guerre répétée : si cela devient récurrent, change de table ou reviens à une stratégie proche de l'équilibre."],
        ])],
      ],
      mistakes: ["Chercher à battre le meilleur joueur de la table", "Exploiter trop fort et trop vite (il s'adapte)", "Se baser sur une impression sans données", "Rester à une table sans joueur faible"],
      keys: ["Contre les réguliers : petites fuites de fréquence", "3-bets contre les folds excessifs, folds contre les sous-bluffeurs", "Ajuster par petites touches, observer la réaction", "Les gros pots se jouent contre les joueurs faibles"],
      quiz: [
        ["Contre un régulier, les gains viennent surtout…", ["De ses fuites de fréquence", "De ses erreurs grossières", "Du hasard", "Des tells"], 0, "L'écart est petit et vient des fréquences."],
        ["Un régulier couche trop face aux 3-bets. Tu…", ["3-bettes davantage", "3-bettes moins", "Limpes", "Ne changes rien"], 0, "Chaque fold rapporte."],
        ["Un régulier sous-bluffe à la river. Face à sa grosse mise, tu…", ["Couches plus de bluff-catchers", "Paies tout", "Relances tout", "Ne changes rien"], 0, "Moins de bluffs = moins de calls rentables."],
        ["Le méta-jeu signifie que…", ["Il s'adapte à toi aussi", "Les règles changent", "Le rake change", "Les cartes sont truquées"], 0, "Il te note et ajuste."],
        ["Les guerres d'ego répétées contre un régulier…", ["Coûtent en variance pour peu d'espérance", "Sont toujours rentables", "Sont interdites", "Améliorent ton image"], 0, "Beaucoup de risque, peu de gain."],
      ],
    });

    K.mod({
      id: 'bayes', level: 4, title: 'Penser en probabilités : mettre à jour une range', drill: 'situations',
      goals: ["Comprendre la logique de mise à jour (Bayes) appliquée au poker", "Compter les combinaisons de valeur et de bluff d'une ligne", "Éviter de sur-réagir à une seule observation"],
      sections: [
        ["L'idée", `<p>Avant une action, tu as une idée de la range adverse (l'<strong>a priori</strong>). Chaque action est une information : certaines mains la font souvent, d'autres rarement. Après l'action, la range se resserre vers les mains qui la font le plus souvent (l'<strong>a posteriori</strong>). Formellement : poids après ∝ poids avant × probabilité que la main fasse cette action.</p>`],
        ["Compter une ligne de river", `<p>Exemple : avant la river, la range de l'adversaire contient <strong>40 combos de valeur</strong> et <strong>20 combos d'air</strong>. Il mise 75 % du pot avec toute sa valeur et 30 % de son air.</p>
          <ul><li>Mains qui misent : 40 de valeur + 20 × 0,3 = 6 bluffs = 46 combos.</li>
          <li>Part de bluffs dans la mise : 6 ÷ 46 ≈ <strong>13 %</strong>.</li>
          <li>Pour payer 75 % du pot, il te faut 0,75 ÷ 2,5 = <strong>30 %</strong> de bluffs : fold.</li></ul>
          <p>S'il bluffait 75 % de son air : 15 bluffs sur 55 mises, soit 27 %. Toujours un fold de peu. Ce qui décide, ce n'est pas « il pourrait bluffer », c'est <strong>combien</strong> de bluffs restent après l'action.</p>`],
        ["Les tells et le timing sont des rapports de vraisemblance", `<p>Une observation n'a de valeur que si elle est <strong>plus fréquente</strong> avec un type de main qu'avec l'autre. Un joueur qui mise vite ? Si c'est aussi fréquent avec ses bluffs qu'avec sa valeur, l'information est nulle. Si un tell est deux fois plus fréquent avec la valeur, il double le rapport valeur/bluff : utile, mais rarement décisif seul.</p>`],
        ["Échantillons : ne pas sur-réagir", `<p>Une statistique sur 20 mains est très bruitée. Les fréquences préflop (VPIP, PFR) se stabilisent assez vite ; les fréquences de river, observées rarement, demandent des centaines de mains. Mélange ton a priori (tendances de population) avec ce que tu observes, et donne plus de poids à l'observation à mesure que l'échantillon grandit.</p>`],
        ["Exercices corrigés", ex([
          ["Range river : 30 combos de valeur, 30 d'air. Il mise le pot avec toute sa valeur et la moitié de son air. Part de bluffs ? Faut-il payer avec un bluff-catcher ?", "Mises : 30 + 15 = 45 ; bluffs 15 ÷ 45 ≈ <strong>33 %</strong>. Face à une mise du pot, il faut 33,3 % : pile à l'équilibre, la décision est neutre."],
          ["Un adversaire a 3-betté 2 fois sur 10 mains. Est-ce un 3-bettor agressif ?", "On ne peut pas le dire : 10 mains, c'est trop peu. Garde ton a priori de population et accumule des observations."],
          ["Il prend 15 secondes avant de miser gros à la river, aussi bien avec ses bluffs que sa valeur. Que vaut ce tell ?", "Rien : un tell aussi fréquent avec les deux types de mains n'apporte aucune information."],
        ])],
      ],
      mistakes: ["Payer parce qu'il « pourrait » bluffer", "Tirer une conclusion d'une statistique sur 20 mains", "Surestimer un tell observé une fois", "Oublier que chaque action resserre la range"],
      keys: ["Poids après ∝ poids avant × probabilité de l'action", "Compter valeur et bluffs qui font la ligne", "Un tell vaut par son rapport de vraisemblance", "Petits échantillons : rester proche de l'a priori"],
      quiz: [
        ["Après une action, la range adverse…", ["Se resserre vers les mains qui font cette action", "Reste identique", "S'élargit toujours", "Devient aléatoire"], 0, "C'est la mise à jour bayésienne."],
        ["40 valeur, 20 air, mise avec toute la valeur et 30 % de l'air. Part de bluffs ?", ["Environ 13 %", "33 %", "50 %", "30 %"], 0, "6 ÷ 46 ≈ 13 %."],
        ["Un tell n'a de valeur que s'il est…", ["Plus fréquent avec un type de main qu'avec l'autre", "Spectaculaire", "Observé une fois", "Verbal"], 0, "Rapport de vraisemblance."],
        ["Une statistique de river sur 15 mains est…", ["Très peu fiable", "Fiable", "Exacte", "Inutile à vie"], 0, "Échantillon trop petit."],
        ["Face à une mise de 75 % du pot, la part de bluffs nécessaire pour payer est…", ["30 %", "43 %", "13 %", "50 %"], 0, "0,75 ÷ 2,5 = 30 %."],
      ],
    });

    K.mod({
      id: 'rake', level: 4, title: 'Le rake et la stratégie', drill: 'rfi',
      goals: ["Savoir comment le rake est prélevé et combien il coûte", "Comprendre pourquoi un rake élevé resserre les ranges", "Intégrer rake et programmes de fidélité dans ton calcul de gain"],
      sections: [
        ["Comment le rake est prélevé", `<p>En cash game, la room prélève un <strong>pourcentage du pot</strong>, avec un <strong>plafond</strong> par main. Dans la plupart des rooms, une main qui s'arrête avant le flop n'est pas rakée (« no flop, no drop ») : vérifie le barème exact de ta room (section Débuter, tableau du rake). En tournoi, le rake est inclus dans le buy-in (la partie après le « + »).</p>`],
        ["Combien il coûte", `<p>Ordre de grandeur : rake payé pour 100 mains ≈ (pots gagnés après le flop pour 100 mains) × (pot moyen) × (taux). Exemple : 15 pots gagnés après le flop pour 100 mains, pot moyen de 12 bb, rake de 5 % sans atteindre le plafond : 15 × 12 × 0,05 = <strong>9 bb pour 100 mains</strong>. C'est souvent plus que le winrate d'un bon joueur aux micro-limites : le rake est ton premier adversaire.</p>`],
        ["Pourquoi le rake resserre les ranges", `<ul><li>Les <strong>petits pots joués après le flop</strong> sont les plus rakés en proportion (le plafond n'est pas atteint) : les calls marginaux qui mènent à ces pots perdent de la valeur.</li>
          <li>La <strong>BB défend moins large</strong>, la SB joue davantage en 3-bet ou fold, les cold-calls diminuent.</li>
          <li>Les pots gagnés <strong>avant le flop</strong> ne sont pas rakés : vols et 3-bets qui font coucher gagnent relativement de la valeur.</li></ul>
          <p>Le Solveur de SIGMA 52 accepte un rake : compare une solution avec et sans pour voir l'effet sur ton spot.</p>`],
        ["Fidélité et rakeback", `<p>Les programmes de fidélité rendent une partie du rake. Compte-les dans ton gain horaire, mais <strong>ne choisis jamais un volume ou une limite pour le programme</strong> : jouer plus de tables pour un palier de fidélité fait souvent perdre plus en qualité de jeu que le palier ne rapporte.</p>`],
        ["Exercices corrigés", ex([
          ["18 pots gagnés après le flop pour 100 mains, pot moyen 10 bb, rake 5 % sans plafond atteint. Rake pour 100 mains ?", "18 × 10 × 0,05 = <strong>9 bb pour 100 mains</strong>."],
          ["Pourquoi le rake pèse-t-il plus sur les calls préflop de la BB que sur les vols du bouton ?", "Le call de la BB mène à un pot vu au flop, donc raké ; un vol réussi gagne le pot avant le flop, sans rake."],
          ["Ton winrate avant rake est de 7 bb pour 100 mains et tu paies 9 bb de rake pour 100 mains, avec 30 % de rakeback. Résultat net ?", "Après rake : 7 − 9 = −2 bb/100 ; rakeback : 9 × 0,3 = 2,7 bb/100 ; net ≈ <strong>+0,7 bb/100</strong>. Le rake et le rakeback décident de ton résultat aux micro-limites."],
        ])],
      ],
      mistakes: ["Ignorer le rake dans le calcul de son winrate", "Défendre la BB comme dans une solution sans rake", "Multiplier les tables pour un palier de fidélité", "Croire qu'un pot gagné avant le flop est raké partout (vérifier le barème)"],
      keys: ["Rake = % du pot plafonné ; souvent pas de rake sans flop", "Rake pour 100 mains ≈ pots gagnés × pot moyen × taux", "Rake élevé : moins de calls, plus de 3-bet ou fold", "Fidélité : un bonus, jamais une raison de jouer plus"],
      quiz: [
        ["Le rake de cash game est en général…", ["Un pourcentage du pot plafonné", "Un montant fixe par heure", "Prélevé sur les perdants seulement", "Inexistant en ligne"], 0, "Pourcentage du pot avec plafond."],
        ["15 pots gagnés pour 100 mains, pot moyen 12 bb, 5 % : rake pour 100 mains ?", ["9 bb", "0,9 bb", "60 bb", "5 bb"], 0, "15 × 12 × 0,05 = 9."],
        ["Un rake élevé pousse la BB à…", ["Défendre moins large", "Défendre plus large", "Limper", "Ne rien changer"], 0, "Les calls qui mènent à de petits pots rakés perdent de la valeur."],
        ["Les pots gagnés avant le flop sont souvent…", ["Non rakés", "Rakés double", "Interdits", "Rakés au maximum"], 0, "« No flop, no drop » dans la plupart des rooms."],
        ["Un programme de fidélité doit…", ["Être compté dans le gain, pas dicter le volume", "Dicter ta limite", "Être ignoré", "Remplacer le winrate"], 0, "Jouer plus pour un palier coûte souvent plus qu'il ne rapporte."],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
