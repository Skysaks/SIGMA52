// Cours — méthode express, décision, mental, discipline, objectifs (salaire, loisir, analyse), jeu responsable, variantes.
(function (root) {
  function register(K) {
    K.mod({
      id: 'sprint', level: 1, title: 'Méthode express : les premiers résultats en 30 jours', drill: 'rfi',
      goals: ['Corriger d\'abord les quelques fuites qui coûtent le plus', 'Suivre une routine courte, tenable chaque jour', 'Savoir mesurer un progrès réel sans attendre des mois de résultats'],
      sections: [
        ['Le principe : corriger les grosses fuites d\'abord', `<p>Un débutant perd surtout à cause de quelques erreurs répétées : trop de mains jouées avant le flop (limps, calls), des calls sans la cote après le flop, des bluffs contre des joueurs qui paient tout, et une bankroll ou un mental qui lâchent. Corriger ces points rapporte plus vite que n'importe quelle technique avancée. Tout le reste vient après.</p>`],
        ['Les 7 règles qui rapportent tout de suite', `<ol><li>Avant le flop, tu suis ta chart : relance ou couche, <strong>jamais de limp</strong> en premier.</li>
          <li>Face à une relance, tu 3-bettes pour la valeur tes meilleures mains, tu paies seulement les mains qui jouent bien en position, tu couches le reste.</li>
          <li>Après le flop, tu mises petit sur les boards secs qui favorisent ta range, tu checkes plus souvent sur ceux qui favorisent l'adversaire.</li>
          <li>Contre un joueur qui paie tout : valeur grosse et répétée, <strong>zéro bluff</strong>.</li>
          <li>Un joueur passif qui relance au turn ou à la river a presque toujours mieux qu'une paire : couche ta paire.</li>
          <li>Tu paies une mise seulement si ton équité dépasse la cote : 25 % contre une demi-pot, 33 % contre le pot.</li>
          <li>Bankroll d'au moins 40 caves pour ta limite, et arrêt de la session après 3 caves perdues.</li></ol>`],
        ['Le programme de 30 jours', `<table class="t"><thead><tr><th>Semaine</th><th>Objectif</th><th>Validation</th></tr></thead><tbody>
          <tr><td>1</td><td>Préflop : charts d'ouverture et réponse à une relance</td><td>90 % de réussite en Ouverture sur 30 spots</td></tr>
          <tr><td>2</td><td>Maths : cotes, outs, règle des 2 et 4</td><td>90 % en Cotes du pot, 85 % en Outs</td></tr>
          <tr><td>3</td><td>Exploiter les fish, contrôler les pots</td><td>500 mains au simulateur avec le coach, bilan sans catégorie rouge</td></tr>
          <tr><td>4</td><td>Jouer en réel à petite limite, revue chaque jour</td><td>10 sessions saisies au Journal, 3 mains revues par session</td></tr></tbody></table>
          <p><strong>Routine quotidienne de 45 minutes</strong> : 10 minutes de révisions et 10 spots du jour, 15 minutes de cours (un module, son quiz), 20 minutes de simulateur ou de revue de mains. La régularité compte plus que la durée : 45 minutes chaque jour valent mieux que 5 heures le dimanche.</p>`],
        ['Ce que 30 jours permettent, et ce qu\'ils ne permettent pas', `<p>En 30 jours de routine, tu corriges les fuites qui coûtent le plus : c'est le premier palier, souvent suffisant pour ne plus perdre contre des joueurs loisir. Ce n'est pas assez pour maîtriser le jeu. L'apprentissage complet de SIGMA 52 représente plus de 150 heures (lecture, exercices, entraînement, révisions, pratique), et le jeu réel demande des dizaines de milliers de mains avant de savoir si tu gagnes vraiment. Compte 6 à 12 mois pour devenir un gagnant solide en petites limites, à condition de garder la routine. Un humain apprend par répétition espacée et par la pratique : relire ne suffit pas, il faut refaire, se tromper, revoir.</p>`],
        ['Mesurer ce qui progresse vraiment', `<p>Tes gains sur quelques milliers de mains ne disent presque rien : la variance les écrase (module « Penser en paris »). Mesure plutôt :</p>
          <ul><li>ta réussite aux spots par type (objectif : 90 % sur l'ouverture, les cotes et le tapis ou couché) ;</li>
          <li>tes statistiques de jeu : en 6-max, un VPIP autour de 22 à 26 % et un PFR proche (écart de moins de 5 points) ;</li>
          <li>les erreurs de ton bilan au simulateur, catégorie par catégorie ;</li>
          <li>la qualité de tes sessions : règles d'arrêt respectées, mains revues.</li></ul>`],
      ],
      mistakes: ['Vouloir apprendre les techniques avancées avant d\'avoir corrigé le préflop', 'Juger son niveau sur les gains d\'une semaine', 'Étudier par à-coups au lieu d\'une routine courte quotidienne', 'Jouer au-dessus de sa bankroll pour « accélérer »'],
      keys: ['Corriger d\'abord les grosses fuites', '7 règles simples appliquées tout de suite', '45 minutes par jour, tous les jours', 'Mesurer les décisions, pas les gains de court terme'],
      quiz: [
        ['Tu es premier à parler avec une main hors de ta chart. Tu…', ['Limpes pour voir le flop', 'Couches', 'Relances petit'], 1, 'Pas de limp en premier : relance si c\'est dans la chart, sinon couche.'],
        ['Contre un joueur qui paie tout, la règle est…', ['Bluffer plus', 'Valeur grosse, zéro bluff'], 1, 'Il ne se couche pas : tes bluffs perdent, ta valeur rapporte.'],
        ['Quel indicateur montre ton progrès au bout de 30 jours ?', ['Ton gain du mois', 'Ta réussite aux spots et la qualité de tes sessions'], 1, 'Sur 30 jours, les gains sont dominés par la variance.'],
        ['Un joueur passif relance ta mise à la river. Tu as top paire. Défaut ?', ['Payer', 'Coucher'], 1, 'Chez un passif, une relance river est presque toujours forte.'],
      ],
    });

    K.mod({
      id: 'decision', level: 2, title: 'Penser en paris : juger tes décisions, pas tes résultats', drill: 'odds',
      goals: ['Séparer la qualité d\'une décision de son résultat', 'Savoir combien de mains il faut pour connaître son vrai niveau', 'Tenir un journal de décisions qui fait progresser'],
      sections: [
        ['Le piège du résultat', `<p>Annie Duke, ancienne joueuse professionnelle, appelle <em>resulting</em> la tendance à juger une décision à son résultat. Au poker, une bonne décision perd souvent (tu paies avec 80 % d'équité et tu perds une fois sur cinq), et une mauvaise décision gagne parfois. Celui qui juge au résultat apprend les mauvaises leçons : il arrête de payer avec la bonne cote après deux bad beats, il garde un bluff perdant parce qu'il est passé une fois.</p>`],
        ['La méthode', `<ol><li><strong>Chaque décision est un pari</strong> : quelle était ta croyance (sa range), ton estimation (ton équité, sa fréquence de couchers), ton choix ?</li>
          <li><strong>Après la main, sépare chance et décision</strong> : la carte du river ne change rien à la qualité du call au turn.</li>
          <li><strong>Calibre-toi</strong> : quand tu dis « il bluffe une fois sur trois », vérifie dans tes historiques et ajuste.</li>
          <li><strong>Cherche la vérité plutôt que l'excuse</strong> : discute tes mains avec des joueurs qui osent te contredire.</li></ol>`],
        ['Combien de mains pour connaître ton niveau', `<p>Avec un écart-type typique de 90 bb/100 en cash 6-max, l'intervalle de confiance à 95 % de ton winrate vaut environ ± 1,96 × 90 ÷ √(mains ÷ 100) :</p>
          <table class="t"><thead><tr><th>Mains jouées</th><th class="n">Intervalle à 95 %</th></tr></thead><tbody>
          <tr><td>10 000</td><td class="n">± 17,6 bb/100</td></tr><tr><td>50 000</td><td class="n">± 7,9 bb/100</td></tr><tr><td>100 000</td><td class="n">± 5,6 bb/100</td></tr><tr><td>300 000</td><td class="n">± 3,2 bb/100</td></tr></tbody></table>
          <p>Un joueur à +4 bb/100 peut donc être négatif sur 50 000 mains. Avant ce volume, juge-toi sur tes décisions (spots, revues, bilans du simulateur), pas sur ton compteur.</p>`],
        ['Le journal de décisions', `<p>Après chaque session, note trois mains : la décision, ta lecture, ce que tu aurais fait autrement, et si l'erreur vient de la stratégie, de la lecture ou du mental. Une fois par semaine, regroupe : une erreur qui revient trois fois devient ton chantier de la semaine (un module, des spots ciblés, une règle écrite).</p>`],
      ],
      mistakes: ['Changer de stratégie après une série de pertes', 'Garder une mauvaise habitude parce qu\'elle a payé une fois', 'Conclure sur 10 000 mains', 'Revoir seulement les mains perdues'],
      keys: ['Une décision se juge à son EV, pas à son résultat', 'Il faut des dizaines de milliers de mains pour mesurer un winrate', 'Journal : trois mains par session, une synthèse par semaine', 'Chercher la contradiction, pas la confirmation'],
      quiz: [
        ['Tu paies un tapis avec 80 % d\'équité et tu perds. La décision était…', ['Mauvaise', 'Bonne'], 1, 'Tu gagnes 80 % du temps : c\'est une bonne décision, perdue par la chance.'],
        ['Sur 10 000 mains, ton winrate mesuré est +10 bb/100. Ton vrai winrate est…', ['Sûrement autour de +10', 'Quelque part entre environ −8 et +28'], 1, 'L\'intervalle à 95 % vaut environ ± 17,6 bb/100 sur 10 000 mains.'],
        ['Quelles mains revoir en priorité ?', ['Les gros pots perdus', 'Les décisions difficiles, gagnées ou perdues'], 1, 'Le résultat ne dit pas si la décision était bonne.'],
      ],
    });

    K.mod({
      id: 'tilt2', level: 2, title: 'Protocole anti-tilt : les 7 tilts et le plan en temps réel', drill: 'situations',
      goals: ['Reconnaître ton type de tilt avant qu\'il coûte cher', 'Avoir un plan écrit à appliquer pendant la session', 'Traiter la cause après la session, pas seulement le symptôme'],
      sections: [
        ['Les 7 tilts', `<p>Jared Tendler, coach mental de joueurs professionnels, distingue sept formes de tilt :</p>
          <table class="t"><thead><tr><th>Tilt</th><th>Déclencheur</th><th>Signe typique</th></tr></thead><tbody>
          <tr><td>Running bad</td><td>Une longue série de mauvaises cartes</td><td>Tout devient irritant, le jeu se dérègle peu à peu</td></tr>
          <tr><td>Injustice</td><td>Bad beats, coolers</td><td>« C'est injuste », envie de jouer pour rétablir l'équilibre</td></tr>
          <tr><td>Détester perdre</td><td>Chaque perte</td><td>Impossible de quitter une session perdante</td></tr>
          <tr><td>Erreur</td><td>Tes propres fautes</td><td>Colère contre soi, perfectionnisme</td></tr>
          <tr><td>Dû</td><td>Croire mériter de gagner</td><td>Frustration quand « un moins bon » gagne</td></tr>
          <tr><td>Revanche</td><td>Un adversaire agressif ou méprisant</td><td>Jouer contre lui plutôt que contre sa range</td></tr>
          <tr><td>Désespoir</td><td>Vouloir se refaire</td><td>Sessions marathon, montée de limite, jeu forcé</td></tr></tbody></table>`],
        ['Le plan en temps réel', `<ol><li><strong>Repère les premiers signaux</strong> : chaleur, mâchoire serrée, décisions plus rapides, pensées du type « il me doit ».</li>
          <li><strong>Script de remise à zéro</strong> (écrit avant la session, lu dès le premier signal) : une respiration lente, puis une phrase qui corrige ta croyance (« je suis payé à long terme pour cette décision »), puis une seule consigne simple pour la main suivante.</li>
          <li><strong>Règles d'arrêt automatiques</strong> : deux décisions émotionnelles repérées, pause de 10 minutes ; trois, fin de session ; stop-loss de 3 caves dans tous les cas.</li></ol>`],
        ['Après la session : traiter la cause', `<p>Le tilt est le symptôme d'une croyance ou d'un manque (attentes irréalistes, besoin d'avoir raison, peur de perdre l'argent). Pour chaque épisode, écris : le problème, pourquoi il est logique que tu l'aies, ce qui cloche dans ce raisonnement, la correction, et pourquoi cette correction est juste. Tendler propose ce type de fiche (« mental hand history »). Relis-la avant les sessions suivantes jusqu'à ce que le déclencheur ne t'atteigne plus.</p>`],
        ['Ce qui aide vraiment', `<ul><li>Dormir assez, ne pas jouer fatigué, affamé ou après de l'alcool.</li><li>Des sessions plus courtes quand tu sors d'un downswing.</li><li>Comprendre la variance en chiffres (simulateur de variance du Journal) : un downswing de 20 caves arrive aussi aux gagnants.</li></ul>`],
      ],
      mistakes: ['Croire qu\'on « contrôle » le tilt sans plan écrit', 'Continuer de jouer pour se refaire', 'Analyser une main de tilt à chaud plutôt qu\'à froid', 'Ignorer les signes physiques'],
      keys: ['7 tilts : running bad, injustice, détester perdre, erreur, dû, revanche, désespoir', 'Signaux précoces, script, règles d\'arrêt', 'Traiter la croyance après la session', 'Sommeil et durée de session'],
      quiz: [
        ['Tu montes de limite pour te refaire après une grosse perte. Quel tilt ?', ['Désespoir', 'Erreur'], 0, 'Vouloir se refaire mène aux marathons et aux montées de limite.'],
        ['Tu repères deux décisions émotionnelles dans la session. Règle ?', ['Continuer en se concentrant', 'Pause de 10 minutes'], 1, 'Les règles d\'arrêt s\'appliquent sans négociation.'],
        ['Quand analyser un épisode de tilt ?', ['À chaud, pendant la session', 'Après la session, à froid'], 1, 'À chaud, le jugement est biaisé.'],
      ],
    });

    K.mod({
      id: 'discipline', level: 2, title: 'Discipline et routines : le système qui protège tes gains', drill: 'situations',
      goals: ['Installer une routine avant, pendant et après chaque session', 'Écrire ses règles une fois pour ne plus les négocier', 'Choisir ses tables et ses horaires comme un professionnel'],
      sections: [
        ['Avant la session (10 minutes)', `<ul><li>État : reposé, calme, pas de perte qui te travaille (checklist d'Aujourd'hui).</li><li>Un seul objectif technique (ex. « défendre la grosse blinde selon la chart »).</li><li>Relire son script anti-tilt et ses règles d'arrêt.</li><li>Téléphone en silencieux, pas d'alcool, eau à portée.</li></ul>`],
        ['Pendant la session', `<ul><li>Sélection de table : pars quand le joueur faible part.</li><li>Pause de 5 minutes toutes les 60 à 90 minutes.</li><li>Arrêt si : stop-loss atteint, fatigue, deux décisions émotionnelles, ou objectif de durée atteint.</li><li>Note en un mot les mains à revoir (sans les analyser pendant le jeu).</li></ul>`],
        ['Après la session (10 minutes)', `<ul><li>Saisis la session dans le Journal (durée, résultat, état mental).</li><li>Revois 3 mains notées, sépare chance et décision.</li><li>Une phrase : ce que tu as bien fait, ce que tu corriges demain.</li></ul>`],
        ['Les règles écrites', `<table class="t"><thead><tr><th>Règle</th><th>Exemple</th></tr></thead><tbody>
          <tr><td>Bankroll</td><td>40 caves minimum pour la limite jouée ; descente si moins de 30</td></tr>
          <tr><td>Stop-loss</td><td>3 caves par session</td></tr>
          <tr><td>Montée</td><td>Essai de la limite supérieure à 50 caves, retour si la bankroll repasse sous 40</td></tr>
          <tr><td>Volume</td><td>Objectif hebdomadaire en heures, pas en résultat</td></tr>
          <tr><td>Étude</td><td>Au moins 1 heure d'étude pour 4 heures de jeu</td></tr></tbody></table>
          <p>Une règle écrite avant de jouer se respecte ; une règle décidée pendant la session se négocie.</p>`],
      ],
      mistakes: ['Jouer sans objectif de session', 'Rester à une table devenue difficile', 'Saisir ses sessions « plus tard »', 'Fixer ses objectifs en argent plutôt qu\'en heures et en qualité'],
      keys: ['10 minutes avant, 10 minutes après', 'Pauses régulières', 'Règles écrites : bankroll, stop-loss, montée, volume, étude', 'Objectifs en heures et en qualité'],
      quiz: [
        ['Le joueur faible de ta table s\'en va. Tu…', ['Restes, tu es bien installé', 'Cherches une autre table'], 1, 'La qualité de la table fait une grosse part de ton winrate.'],
        ['Un bon objectif hebdomadaire est…', ['Gagner 500 €', 'Jouer 10 heures en respectant ses règles et revoir 30 mains'], 1, 'Tu contrôles le volume et la qualité, pas le résultat.'],
        ['Quand fixer son stop-loss ?', ['Avant la session', 'Quand on commence à perdre'], 0, 'Fixé avant, il ne se négocie pas.'],
      ],
    });

    K.mod({
      id: 'loisir', level: 2, title: 'Gagner sans y passer sa vie : le plan du joueur loisir', drill: 'rfi',
      goals: ['Être gagnant avec 3 à 5 heures par semaine', 'Choisir des parties où un jeu simple suffit', 'Garder le poker comme un plaisir, dans un budget'],
      sections: [
        ['Le budget loisir', `<p>Joue avec un argent dont la perte ne change rien à ta vie : c'est ton budget de loisir, séparé du reste. Fixe-le par mois. Tu le recharges seulement s'il te reste du plaisir et si tes règles sont respectées.</p>`],
        ['Choisir les bonnes parties', `<ul><li><strong>Parties faibles</strong> : petites limites live, parties entre amis, horaires du soir et du week-end en ligne.</li><li>Évite les formats où les réguliers dominent (petits cash games en ligne en semaine la journée) si ton temps d'étude est limité.</li><li>Les formats très rapides (type Expresso) ont une variance énorme : amusants, mais un budget fondra vite en mauvaise série.</li></ul>`],
        ['Un jeu simple qui gagne', `<p>Le module « Méthode express » suffit à battre la majorité des parties loisir : charts, pas de limp, valeur grosse contre ceux qui paient, peu de bluffs, couches quand un joueur passif relance. Ajoute la position (joue plus de mains au bouton) et la sélection de table.</p>`],
        ['Ton rythme', `<table class="t"><tbody><tr><td>Par semaine</td><td>2 à 3 sessions de 1 h 30, plus 2 séances de 20 minutes dans SIGMA 52 (spots du jour et une main revue)</td></tr><tr><td>Par mois</td><td>Bilan au Journal : budget, heures, plaisir</td></tr><tr><td>Signal d'arrêt</td><td>Le jeu n'est plus un plaisir, ou tu dépasses ton budget : pause, et relis le module « Jeu responsable »</td></tr></tbody></table>`],
      ],
      mistakes: ['Mélanger budget de loisir et argent du quotidien', 'Jouer les parties les plus difficiles par fierté', 'Compliquer son jeu avec des bluffs sophistiqués contre des joueurs qui paient', 'Recharger le budget pour se refaire'],
      keys: ['Budget mensuel séparé', 'Parties faibles et horaires choisis', 'Jeu simple de la Méthode express', '2 à 3 sessions par semaine, 20 minutes d\'étude'],
      quiz: [
        ['Où un joueur loisir gagne-t-il le plus facilement ?', ['Petites limites live et parties amicales', 'Cash en ligne en semaine en journée'], 0, 'Les réguliers sont plus nombreux en ligne aux heures creuses.'],
        ['Ton budget du mois est épuisé. Tu…', ['Recharges pour te refaire', 'Attends le mois suivant'], 1, 'Recharger pour se refaire est un signal de jeu problématique.'],
        ['Contre une table loisir, ta meilleure arme est…', ['Les gros bluffs', 'La valeur et la sélection de table'], 1, 'Ils paient trop : la valeur rapporte, les bluffs coûtent.'],
      ],
    });

    K.mod({
      id: 'salaire', level: 6, title: 'Remplacer son salaire : le calcul honnête', drill: 'odds',
      goals: ['Traduire un salaire visé en limite, volume et winrate nécessaires', 'Mesurer la variance mensuelle d\'un revenu de poker', 'Savoir quand, et à quelles conditions, quitter son emploi'],
      sections: [
        ['Le calcul en trois lignes', `<p><strong>Revenu par heure = winrate (bb/100) × mains par heure ÷ 100 × valeur de la grosse blinde.</strong> Exemple chiffré, hypothèses à adapter à ton cas : un régulier solide à +4 bb/100 après rake, 4 tables en ligne, environ 300 mains par heure.</p>
          <table class="t"><thead><tr><th>Limite</th><th class="n">Grosse blinde</th><th class="n">€ par heure</th><th class="n">€ par mois (120 h)</th></tr></thead><tbody>
          <tr><td>NL50</td><td class="n">0,50 €</td><td class="n">6</td><td class="n">720</td></tr>
          <tr><td>NL100</td><td class="n">1 €</td><td class="n">12</td><td class="n">1 440</td></tr>
          <tr><td>NL200</td><td class="n">2 €</td><td class="n">24</td><td class="n">2 880</td></tr></tbody></table>
          <p>Ajoute la fidélité (rakeback) de ta room, retire l'impôt et les cotisations. Pour remplacer un salaire moyen, il faut donc être nettement gagnant à des limites où les réguliers sont plus forts.</p>`],
        ['La variance d\'un mois', `<p>À NL200, 120 heures représentent environ 36 000 mains. Avec un écart-type de 90 bb/100 : espérance 1 440 bb (2 880 €), écart-type ≈ 90 × √360 ≈ 1 707 bb (≈ 3 400 €). Un mois négatif arrive environ <strong>une fois sur cinq</strong>, et des séries de deux ou trois mois négatifs arrivent. D'où la réserve de vie séparée de la bankroll.</p>`],
        ['Les conditions avant de quitter ton emploi', `<ol><li>Au moins 100 000 mains (ou 1 000 heures de live) avec un winrate dont la borne basse de l'intervalle reste positive.</li>
          <li>Bankroll de 50 à 100 caves pour la limite qui paie ton objectif, <strong>en plus</strong> d'une réserve de 6 à 12 mois de dépenses.</li>
          <li>Six mois en semi-pro (poker + emploi réduit) en tenant le volume et la routine.</li>
          <li>Statut fiscal clarifié : en France, le Conseil d'État (21 juin 2018) juge imposables en BNC les gains de poker d'un joueur qui joue par habitude, avec un savoir-faire qui réduit l'aléa, et pour qui c'est une source de revenus significative. Fais-toi accompagner par un comptable (module « Fiscalité »).</li>
          <li>Un plan B écrit : à quelles conditions tu reprends un emploi.</li></ol>`],
        ['Ce qu\'on oublie', `<ul><li>Pas de cotisations retraite ni de congés payés automatiques, une couverture santé à organiser.</li><li>Les parties se durcissent avec le temps : ton winrate d'aujourd'hui n'est pas garanti.</li><li>L'isolement et l'usure mentale (module « Durer »).</li><li>Une voie plus solide pour beaucoup : un revenu principal et le poker comme complément régulier.</li></ul>`],
      ],
      mistakes: ['Calculer son revenu sur un mois chanceux', 'Mélanger bankroll et argent pour vivre', 'Quitter son emploi avant 100 000 mains de preuve', 'Ignorer impôts, cotisations, retraite et santé'],
      keys: ['€/h = winrate × mains/h ÷ 100 × grosse blinde', 'Un mois sur cinq négatif même pour un bon régulier', 'Bankroll et réserve de vie séparées', 'Semi-pro avant pro, statut fiscal clarifié'],
      quiz: [
        ['+4 bb/100, 300 mains par heure, NL100 (grosse blinde 1 €). Revenu horaire ?', ['4 €', '12 €', '40 €'], 1, '4 × 300 ÷ 100 = 12 bb par heure, soit 12 €.'],
        ['Que faut-il en plus de la bankroll avant de devenir pro ?', ['Rien', 'Une réserve de 6 à 12 mois de dépenses'], 1, 'Les mois négatifs sont fréquents : on ne vit pas sur la bankroll.'],
        ['En France, quand les gains de poker sont-ils imposables (BNC) selon le Conseil d\'État en 2018 ?', ['Jamais', 'Pratique habituelle, savoir-faire, revenus significatifs'], 1, 'Les trois conditions réunies.'],
        ['Un bon régulier a-t-il des mois négatifs ?', ['Non', 'Oui, environ un sur cinq dans l\'exemple NL200'], 1, 'L\'écart-type mensuel dépasse l\'espérance.'],
      ],
    });

    K.mod({
      id: 'analyste', level: 4, title: 'Méthode d\'analyste : de l\'intuition à la preuve', drill: 'mdf',
      goals: ['Transformer une intuition en hypothèse testable', 'Connaître la taille d\'échantillon nécessaire pour chaque statistique', 'Organiser son étude avec le solveur, la base de données et le simulateur'],
      sections: [
        ['Le cycle', `<ol><li><strong>Question</strong> : « Est-ce que je paie trop au river contre les petites mises ? »</li><li><strong>Données</strong> : filtre tes historiques (Analyse) sur ce spot, compte les cas et les résultats à l'abattage.</li><li><strong>Référence</strong> : résous un spot type au Solveur, ou ouvre le Rapport agrégé pour la tendance par texture.</li><li><strong>Règle</strong> : écris une règle simple (« contre une mise de 33 % à la river d'un joueur passif, je paie seulement avec top paire et mieux »).</li><li><strong>Test</strong> : applique-la au simulateur et dans tes sessions, puis remesure.</li></ol>`],
        ['Combien d\'observations', `<p>Pour une fréquence (fold to c-bet, 3-bet…), l'erreur à 95 % vaut environ ± 1,96 × √(p × (1 − p) ÷ n) :</p>
          <table class="t"><thead><tr><th>Observations</th><th class="n">Erreur pour p = 50 %</th><th class="n">Erreur pour p = 10 %</th></tr></thead><tbody>
          <tr><td>30</td><td class="n">± 18 points</td><td class="n">± 11 points</td></tr><tr><td>100</td><td class="n">± 10 points</td><td class="n">± 6 points</td></tr><tr><td>400</td><td class="n">± 5 points</td><td class="n">± 3 points</td></tr></tbody></table>
          <p>Un 3-bet de 12 % mesuré sur 30 occasions peut cacher un vrai 3-bet de 5 % comme de 20 %. Lis le VPIP vite, le 3-bet et le fold to c-bet lentement.</p>`],
        ['Les outils et leur rôle', `<table class="t"><thead><tr><th>Question</th><th>Outil SIGMA 52</th></tr></thead><tbody>
          <tr><td>Que joue l'équilibre sur ce spot ?</td><td>Solveur (river et turn exacts, flop approché)</td></tr>
          <tr><td>Quelle tendance par texture ?</td><td>Solveur › Rapport agrégé</td></tr>
          <tr><td>Que joue ma range sur ce board ?</td><td>Outils › Board, Distribution</td></tr>
          <tr><td>Où je perds de l'argent ?</td><td>Analyse (fuites préflop, résultat par position, adversaires)</td></tr>
          <tr><td>Ma règle tient-elle ?</td><td>Simulateur (bilan par catégorie), Entraîneur river</td></tr></tbody></table>`],
        ['Le piège de l\'analyste', `<p>Trop d'étude sans jeu, ou une étude sans conclusion. Chaque séance doit finir par une règle écrite ou une décision. Ratio de départ : une heure d'étude pour trois à quatre heures de jeu, plus d'étude après un changement de limite.</p>`],
      ],
      mistakes: ['Conclure sur 30 observations', 'Étudier un spot qui n\'arrive presque jamais', 'Copier une fréquence de solveur sans comprendre pourquoi', 'Finir une séance d\'étude sans règle écrite'],
      keys: ['Question → données → référence → règle → test', 'Erreur ≈ 1,96 × √(p(1 − p) ÷ n)', 'Chaque outil répond à une question', 'Une séance = une règle'],
      quiz: [
        ['Fold to c-bet mesuré à 60 % sur 30 occasions. Erreur à 95 % environ ?', ['± 3 points', '± 18 points'], 1, '1,96 × √(0,6 × 0,4 ÷ 30) ≈ 0,175.'],
        ['Quelle statistique devient fiable le plus vite ?', ['Le VPIP', 'Le 3-bet'], 0, 'Le VPIP s\'observe à chaque main, le 3-bet rarement.'],
        ['Une séance d\'étude réussie se termine par…', ['Une règle écrite', 'Un nouveau spot à étudier'], 0, 'Sans conclusion, l\'étude ne change pas ton jeu.'],
      ],
    });

    K.mod({
      id: 'responsable', level: 1, title: 'Jeu responsable : limites, signaux d\'alerte, aide', drill: 'situations',
      goals: ['Fixer des limites avant de jouer', 'Reconnaître les signaux d\'un jeu qui devient un problème', 'Savoir où trouver de l\'aide en France'],
      sections: [
        ['Fixer ses limites', `<ul><li>Un budget mensuel de jeu séparé, et des limites de dépôt et de mise dans ta room (les sites agréés en France te demandent de les fixer).</li><li>Une durée maximale de session.</li><li>Des jours sans poker chaque semaine.</li></ul>`],
        ['Les signaux d\'alerte', `<ul><li>Jouer pour se refaire, augmenter les mises pour récupérer.</li><li>Jouer de l'argent nécessaire au quotidien, emprunter pour jouer.</li><li>Mentir sur le temps ou l'argent joués.</li><li>Irritabilité quand on ne joue pas, sommeil qui se dégrade, pensées tournées vers le jeu.</li></ul><p>Un seul de ces signes mérite une pause et une discussion avec un proche ou un professionnel.</p>`],
        ['Où trouver de l\'aide', `<ul><li><strong>Joueurs Info Service</strong> : 09 74 75 13 13, appel non surtaxé, 7 jours sur 7 de 8 h à 2 h, et joueurs-info-service.fr.</li><li><strong>Interdiction volontaire de jeux</strong> auprès de l'ANJ (interdictiondejeux.anj.fr) : au moins 3 ans, renouvelée tacitement, elle couvre casinos, clubs de jeux, jeux FDJ et PMU avec compte joueur, paris et sites de poker agréés.</li><li>Ton médecin traitant peut t'orienter vers une consultation spécialisée.</li></ul>`],
      ],
      mistakes: ['Attendre une grosse perte pour fixer des limites', 'Croire qu\'un joueur technique ne peut pas avoir un problème de jeu', 'Cacher ses pertes à ses proches', 'Jouer pour échapper au stress'],
      keys: ['Budget, limites de dépôt et de mise, durée', 'Se refaire et emprunter sont des signaux forts', 'Joueurs Info Service : 09 74 75 13 13', 'Interdiction volontaire : ANJ, au moins 3 ans'],
      quiz: [
        ['Lequel est un signal d\'alerte ?', ['Jouer pour se refaire', 'Faire une pause après une session'], 0, 'Chasser ses pertes est un signe classique de jeu problématique.'],
        ['Durée minimale de l\'interdiction volontaire de jeux ?', ['6 mois', '3 ans'], 1, 'Elle est valable au moins 3 ans.'],
        ['Numéro de Joueurs Info Service ?', ['09 74 75 13 13', '08 00 00 00 00'], 0, '09 74 75 13 13, non surtaxé.'],
      ],
    });


    K.mod({
      id: 'stud', level: 3, title: 'Stud à 7 cartes et Razz : les bases', drill: 'outs',
      goals: ['Connaître le déroulé du stud et ce qui change sans board commun', 'Utiliser les cartes visibles et les cartes mortes', 'Jouer le Razz, la version basse'],
      sections: [
        ['Le déroulé', `<p>Pas de board commun : chaque joueur reçoit 7 cartes, dont 4 visibles (3e à 6e rue) et 3 cachées (deux au départ, la dernière à la 7e rue). Pas de blindes : une ante et un « bring-in » payé par la carte visible la plus faible (au stud haut). Ensuite, la main visible la plus forte parle en premier. La meilleure main de 5 cartes parmi 7 gagne.</p>`],
        ['Les cartes mortes', `<p>Les cartes visibles des joueurs couchés sont <strong>mortes</strong> : elles ne viendront plus. Si tu as trois cœurs et que quatre cœurs sont visibles ailleurs, ton tirage couleur est très affaibli. Le stud récompense la mémoire : retiens les cartes couchées. L'outil Variantes prend les cartes mortes en compte.</p>
          <p>Ordres de grandeur (moteur SIGMA 52, cartes connues seulement) : As-As-Roi contre Roi-Roi-Dame en début de main ≈ 67 % ; As-Roi-Dame de cœur (trois à la couleur) contre une paire de valets ≈ 49 %.</p>`],
        ['Le Razz', `<p>Même déroulé, mais la main la plus basse gagne : l'as est bas, suites et couleurs ne comptent pas, les paires sont mauvaises. La meilleure main est A-2-3-4-5. Au Razz, c'est la carte visible la plus <strong>haute</strong> qui paie le bring-in. Une bonne main de départ : trois cartes basses différentes (A-2-3 contre 7-8-9 ≈ 66 %, moteur SIGMA 52).</p>`],
      ],
      mistakes: ['Oublier les cartes mortes dans le calcul de ses outs', 'Payer avec un tirage dont les outs sont déjà sortis', 'Au Razz, garder une main qui s\'apparie', 'Jouer trop de mains de départ par ennui (pas de position fixe comme au hold\'em)'],
      keys: ['7 cartes, 4 visibles, 3 cachées', 'Cartes mortes = outs perdus', 'Razz : A-2-3-4-5, paires mauvaises', 'Vérifier dans l\'outil Variantes'],
      quiz: [
        ['Tu as trois cœurs en 3e rue, quatre cœurs sont visibles chez les joueurs couchés. Ton tirage couleur…', ['Est plus fort', 'Est très affaibli'], 1, 'Il ne reste que 6 cœurs au lieu de 10.'],
        ['Au Razz, quelle main est la meilleure ?', ['A-2-3-4-5', '2-3-4-5-7'], 0, 'La roue est la meilleure main basse.'],
        ['Au Razz, qui paie le bring-in ?', ['La carte visible la plus basse', 'La carte visible la plus haute'], 1, 'L\'inverse du stud haut, puisque bas = fort.'],
      ],
    });

    K.mod({
      id: 'variantes2', level: 3, title: 'Short Deck, Omaha 5 cartes, Omaha Hi-Lo', drill: 'outs',
      goals: ['Connaître les règles qui changent tout dans chaque variante', 'Ajuster la valeur des mains de départ', 'Utiliser l\'outil Variantes pour vérifier une intuition'],
      sections: [
        ['Short Deck (6+)', `<ul><li>36 cartes : les 2 à 5 sont retirées. Dans la version la plus jouée (Triton), <strong>la couleur bat le full</strong> et <strong>le brelan bat la suite</strong> ; l'as fait aussi la suite basse A-6-7-8-9.</li>
          <li>Les équités se resserrent : As-As contre Roi-Roi vaut environ 74,5 % (calcul SIGMA 52, moyenne sur les couleurs, contre 82 % en hold'em), As-Roi assorti contre Dame-Dame est presque à pile ou face (≈ 52 %).</li>
          <li>Les suites sont plus fréquentes, les couleurs plus rares : les connecteurs gagnent en valeur, les petites couleurs perdent.</li></ul>`],
        ['Omaha 5 cartes', `<ul><li>5 cartes en main, toujours exactement 2 utilisées. Les mains sont plus fortes : les nuts arrivent plus souvent à l'abattage.</li>
          <li>As-As-Roi-Roi-Dame double assortie fait environ 63 % contre une main aléatoire (calcul SIGMA 52).</li>
          <li>Joue encore plus pour les nuts : une deuxième couleur ou un brelan inférieur perdent de gros pots.</li></ul>`],
        ['Omaha Hi-Lo (8 or better)', `<ul><li>La moitié du pot va à la meilleure main basse : 5 rangs différents, 8 ou moins, l'as compte pour 1, toujours avec 2 cartes de la main et 3 du board. Sans trois cartes basses différentes au board, pas de main basse : la main haute prend tout.</li>
          <li>Le but est de <strong>rafler les deux moitiés</strong> (scoop). As-2 avec des cartes qui jouent pour le haut est la base ; As-2-3-Roi double assorti fait environ 63 % contre une main aléatoire (60 % en simple assorti) (calcul SIGMA 52).</li>
          <li>Attention au partage en quatre : deux joueurs avec la même basse ne récupèrent chacun qu'un quart du pot.</li></ul>`],
      ],
      mistakes: ['Oublier qu\'en Short Deck la couleur bat le full', 'Jouer en Omaha 5 cartes des deuxièmes nuts comme des nuts', 'En Hi-Lo, payer avec une basse qui n\'est pas la meilleure', 'Transposer les ranges de hold\'em sans ajuster'],
      keys: ['Short Deck : couleur > full, brelan > suite, A-6-7-8-9', 'Omaha 5 : mains plus fortes, nuts obligatoires', 'Hi-Lo : 8 or better, viser le scoop', 'Vérifier dans l\'outil Variantes'],
      quiz: [
        ['En Short Deck (règles Triton), qu\'est-ce qui gagne ?', ['Full contre couleur : le full', 'Full contre couleur : la couleur'], 1, 'Les couleurs sont plus rares avec 36 cartes : elles battent le full.'],
        ['Hi-Lo : board K-Q-9-5-2. Y a-t-il une main basse possible ?', ['Oui', 'Non'], 1, 'Il faut trois cartes de rangs différents de 8 ou moins au board : ici seulement 5 et 2.'],
        ['En Omaha 5 cartes, une main qui fait les deuxièmes nuts à la river contre une grosse mise est…', ['Souvent battue', 'Presque toujours devant'], 0, 'Avec 5 cartes par joueur, les nuts sont fréquentes.'],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
