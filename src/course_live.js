// Cours — Niveau 5 : Tables physiques. Du premier passage au casino au jeu live régulier : accès et usages en France,
// règles et procédures (base TDA), stratégie live, tells, gestion de la table et sécurité, tournois et festivals.
(function (root) {
  function register(K) {
    K.mod({
      id: 'live_debut', level: 5, title: 'Premier passage en casino ou en club', drill: 'situations',
      goals: ['Savoir où et comment jouer légalement au poker en salle en France', 'Connaître le déroulé : inscription, cave, jetons, rake, pourboire', 'Éviter les erreurs de débutant qui coûtent de l\'argent ou de la crédibilité'],
      sections: [
        ['Où jouer', `<ul><li><strong>Casinos</strong> : de nombreux casinos (groupes Barrière, Partouche, JOA, Tranchant et indépendants) ont une salle de poker : cash game le soir et tournois réguliers. L'offre varie beaucoup : vérifie le site ou appelle.</li>
          <li><strong>Clubs de jeux parisiens</strong> : sept établissements à Paris. Après huit ans d'expérimentation et une fermeture temporaire début 2025, leur statut a été rendu définitif par la loi de finances 2026.</li>
          <li><strong>Festivals</strong> : étapes de circuits (EPT Paris, organisé en février 2026 au Palais des Congrès ; circuits des opérateurs et des groupes de casinos) avec des tournois de tous buy-ins.</li>
          <li><strong>Parties privées avec mise d'argent</strong> : hors cadre légal en France. Ne joue que dans des établissements autorisés.</li></ul>`],
        ['Conditions d\'accès', `<ul><li>Majorité (18 ans) et pièce d'identité en cours de validité : l'accès aux salles de jeux est contrôlé.</li>
          <li><strong>Interdiction volontaire de jeux</strong> : gérée par l'ANJ (service en ligne), valable au moins trois ans, elle interdit l'accès aux casinos, aux clubs et aux sites agréés. C'est l'outil à connaître pour toi ou pour un proche en difficulté.</li>
          <li>Tenue correcte ; certaines salles exigent une inscription préalable ou une carte de fidélité.</li></ul>`],
        ['Déroulé d\'une session de cash game', `<ol><li><strong>Inscription</strong> sur la liste d'attente auprès du responsable de salle (le « floor ») pour la limite voulue (par exemple 1/2 € ou 2/5 €).</li>
          <li><strong>Cave</strong> : tu achètes des jetons à la caisse ou à la table, entre un minimum et un maximum affichés. Achète la cave maximale si ta bankroll le permet : tu joues plus profond contre des joueurs plus faibles.</li>
          <li><strong>Placement</strong> : le floor t'attribue une place. Tu peux demander un changement de place ou de table (« seat change », « table change ») ; c'est un outil de sélection de table, pas une impolitesse.</li>
          <li><strong>Blindes</strong> : en arrivant, tu attends la grosse blinde ou tu la postes selon la règle de la salle.</li>
          <li><strong>Fin</strong> : tu quittes entre deux mains et changes tes jetons à la caisse.</li></ol>`],
        ['Rake et pourboire', `<p>La salle se rémunère soit par un <strong>prélèvement sur chaque pot</strong> (en général un pourcentage plafonné), soit par une <strong>location de place</strong> à l'heure. Demande la règle avant de t'asseoir : elle change ton winrate réel. Le <strong>pourboire</strong> au croupier quand tu gagnes un pot est un usage courant, pas une obligation ; il pèse aussi sur ton résultat (compte-le dans le Journal).</p>
          <p>Ordre de grandeur : en live, 25 à 35 mains par heure. Un prélèvement de quelques euros par pot sur des pots moyens de 30 à 60 € représente une part bien plus grande de tes gains qu'en ligne : il faut un écart de niveau plus net pour gagner.</p>`],
        ['Les gestes de base', `<ul><li>Annonce tes actions à voix haute (« Parole », « Je suis », « Relance à 15 ») : c'est la façon la plus sûre de ne pas créer de litige.</li>
          <li>Pose tes jetons en <strong>un seul geste</strong>, devant toi, sans les jeter dans le pot.</li>
          <li>Garde tes cartes sur la table, protégées par un jeton (« card protector »).</li>
          <li>Garde tes jetons visibles, les plus grosses valeurs devant.</li>
          <li>Téléphone hors de la table pendant une main.</li></ul>`],
        ['Ce qui change pour toi', `<p>Pas de calcul instantané, pas de HUD, pas d'historique automatique : prends une note après chaque main importante (téléphone, en pause ou après la session) et saisis la session dans le Journal avec ta durée, pour suivre ton taux horaire.</p>`],
      ],
      mistakes: ['S\'asseoir sans demander le mode de rake', 'Jeter ses jetons dans le pot (risque de « splash » et de litige)', 'Acheter la cave minimale par prudence alors que la bankroll permet le maximum', 'Oublier le pourboire et le rake dans le calcul de son résultat'],
      keys: ['18 ans, pièce d\'identité, établissement autorisé', 'Interdiction volontaire de jeux : ANJ, 3 ans minimum', 'Annoncer ses actions à voix haute', 'Rake + pourboire : à intégrer au taux horaire'],
      quiz: [
        ['Qui gère l\'interdiction volontaire de jeux en France ?', ['La préfecture', 'L\'ANJ', 'Chaque casino'], 1, 'Service en ligne de l\'ANJ, valable au moins trois ans, pour casinos, clubs et sites agréés.'],
        ['Une partie privée entre amis avec mise d\'argent réelle est…', ['Légale', 'Hors cadre légal en France'], 1, 'Seuls les établissements autorisés peuvent organiser des jeux d\'argent.'],
        ['Le moyen le plus sûr d\'éviter un litige sur ton action ?', ['Annoncer à voix haute', 'Pousser les jetons rapidement'], 0, 'Une annonce verbale à ton tour engage et ne laisse pas de doute.'],
        ['Combien de mains par heure en cash live, environ ?', ['30', '100', '300'], 0, '25 à 35 mains par heure : dix à vingt fois moins qu\'en ligne multi-table.'],
        ['Demander un changement de table, c\'est…', ['Impoli', 'Un outil normal de sélection de table'], 1, 'Les salles le prévoient ; la sélection de table est ta principale source de gains.'],
      ],
    });

    K.mod({
      id: 'live_regles', level: 5, title: 'Règles et procédure en salle : ce qui engage, ce qui coûte', drill: 'situations',
      goals: ['Connaître les règles de procédure qui créent le plus de litiges', 'Ne jamais perdre un pot sur une erreur de procédure', 'Savoir appeler le floor et faire valoir ses droits'],
      sections: [
        ['Le cadre', `<p>Les tournois suivent en général les règles de la <strong>Poker TDA</strong> (Tournament Directors Association), révisées tous les deux ans (édition 2024, sommet de 2026). Le cash game suit les règles maison, presque toujours proches. En cas de doute, la décision appartient au floor : demande-le calmement (« Floor, s'il vous plaît »).</p>`],
        ['Ce qui engage', `<ul><li><strong>Annonce verbale à ton tour</strong> : elle engage. « Je suis » = call, même si tu poses un autre montant.</li>
          <li><strong>Action hors tour</strong> : elle peut te pénaliser ; elle t'engage si l'action qui te revient n'a pas changé. Un check, un call ou un fold devant toi ne change pas l'action ; une mise ou une relance la change. Un fold hors tour est toujours définitif.</li>
          <li><strong>Jetons lâchés dans le pot à ton tour</strong> : ils y restent.</li></ul>`],
        ['Miser sans se tromper', `<table class="t"><thead><tr><th>Situation</th><th>Règle (base TDA)</th></tr></thead><tbody>
          <tr><td>Un seul gros jeton face à une mise, sans annonce</td><td>C'est un <strong>call</strong>. Pour relancer, annonce « relance » avant que le jeton touche la table.</td></tr>
          <tr><td>Plusieurs jetons face à une mise, sans annonce</td><td>Call si retirer un seul jeton laisse moins que le montant à payer.</td></tr>
          <tr><td>Relance en plusieurs allers-retours (« string bet »)</td><td>Interdite : seul le premier mouvement compte (souvent un call).</td></tr>
          <tr><td>Montant de relance minimum</td><td>Au moins la plus grosse mise ou relance précédente du tour. Si tu mets au moins 50 % de la relance minimum, tu dois compléter au minimum.</td></tr>
          <tr><td>Tapis court qui ne fait pas une relance complète</td><td>Il ne rouvre pas les relances pour les joueurs qui ont déjà agi.</td></tr>
          <tr><td>Tapis (règles 2026)</td><td>Tous tes jetons ou aucun : pas de jeton gardé derrière ; dis au croupier si tu n'es pas à tapis.</td></tr></tbody></table>
          <p>Méthode infaillible : annonce le montant (« relance à 40 ») puis pose les jetons.</p>`],
        ['L\'abattage', `<ul><li>Les cartes parlent : la meilleure main gagne, quoi que dise le joueur (une annonce volontairement fausse peut être sanctionnée).</li>
          <li>Pour gagner, montre tes <strong>deux cartes</strong> face visible.</li>
          <li>Ordre : le dernier joueur agressif de la dernière rue montre en premier ; sans mise à la river, le premier joueur à parler.</li>
          <li>À tapis, toutes les mains sont retournées une fois les mises terminées.</li>
          <li>Ne jette jamais ta main avant que le pot soit poussé vers toi : une main jetée dans les cartes mortes est perdue.</li></ul>`],
        ['Cartes, données et appareils', `<ul><li>Protège tes cartes (jeton dessus) : une main mélangée par erreur par le croupier est perdue pour toi.</li>
          <li>Carte exposée par le croupier : règles de « misdeal » (nouvelle donne) si l'action n'a pas significativement commencé.</li>
          <li>Pas de téléphone posé sur la table, aucun appareil pendant une main, aucun tableau ni application de stratégie à table (règles TDA 2024). Les lunettes connectées sont interdites (2026).</li>
          <li>Le floor peut te demander d'enlever lunettes de soleil, capuche ou ce qui gêne ton identification (TDA 2024).</li>
          <li>Garde des piles de 20 jetons, les grosses valeurs visibles (règle depuis 2026 quand c'est possible).</li></ul>`],
        ['Temps et éthique', `<ul><li><strong>Demander la pendule</strong> (« clock ») sur un joueur trop lent : le floor lui accorde un temps limité, puis la main est morte.</li>
          <li><strong>Un joueur par main</strong> : interdit de montrer ses cartes à un autre joueur ou de discuter de stratégie pendant une main.</li>
          <li><strong>Soft play</strong> (jouer mollement contre un ami) et <strong>collusion</strong> : pénalités pouvant aller à la disqualification et à la confiscation des jetons.</li></ul>`],
      ],
      mistakes: ['Poser un gros jeton en pensant relancer sans l\'annoncer', 'Jeter sa main avant d\'avoir reçu le pot', 'Relancer en plusieurs gestes', 'Consulter une application de stratégie à table'],
      keys: ['Annonce verbale à ton tour = engagement', 'Gros jeton sans annonce = call', 'Montrer les deux cartes pour gagner', 'Floor en cas de litige, calmement'],
      quiz: [
        ['Face à une mise de 15, tu poses un jeton de 100 sans rien dire. Résultat ?', ['Relance à 100', 'Call de 15'], 1, 'Règle du jeton unique : sans annonce, c\'est un call.'],
        ['Mise de 20, relance à 50 (relance de 30). Relance minimum suivante ?', ['À 70', 'À 80', 'À 100'], 1, 'Il faut relancer d\'au moins 30 : 50 + 30 = 80.'],
        ['Un joueur à tapis court ajoute moins qu\'une relance complète. Les joueurs qui ont déjà agi peuvent-ils relancer ?', ['Oui', 'Non'], 1, 'Un tapis incomplet ne rouvre pas les relances.'],
        ['River sans mise, abattage. Qui montre en premier ?', ['Le dernier agresseur du turn', 'Le premier joueur à parler'], 1, 'Sans mise à la dernière rue, l\'ordre suit la parole.'],
        ['Tu tiens la meilleure main mais tu la jettes face cachée avant d\'avoir montré. Le pot ?', ['Reste à toi', 'Est perdu pour toi'], 1, 'Une main jetée dans les cartes mortes ne peut plus gagner.'],
        ['Consulter une appli de stratégie entre deux mains à table en tournoi ?', ['Autorisé', 'Interdit'], 1, 'TDA 2024 : aucun outil de stratégie à table.'],
      ],
    });

    K.mod({
      id: 'live_strat', level: 5, title: 'Stratégie live : battre les tables physiques', drill: 'rfi',
      goals: ['Adapter tailles et ranges à une population live', 'Exploiter les tendances des joueurs récréatifs en salle', 'Gérer variance, rake et taux horaire en live'],
      sections: [
        ['La population live', `<p>En petites limites live, les joueurs sont en majorité récréatifs : beaucoup de limps et d'ouvertures larges, des pots à plusieurs, une agression postflop faible et des grosses mises qui signifient presque toujours de la force. Les joueurs jouent moins de mains par heure et paient plus souvent « pour voir ».</p>`],
        ['Préflop', `<ul><li><strong>Ouvertures plus grosses</strong> : 4 à 6 bb, plus 1 bb par limper. Les joueurs paient presque autant à 5 bb qu'à 2,5 bb : tu prends plus de valeur avec tes bonnes mains.</li>
          <li><strong>Isole les limpers faibles</strong> en position avec une range orientée valeur (paires, broadways, As assortis).</li>
          <li><strong>3-bet surtout pour la valeur</strong> et plus gros (4-5 fois l'ouverture), car les calls sont nombreux.</li>
          <li><strong>Moins de mains spéculatives hors de position</strong> : les pots multiway hors de position sont chers.</li></ul>`],
        ['Postflop', `<ul><li>Mise de valeur plus grosse et plus fine : les joueurs paient avec des paires moyennes.</li>
          <li>Peu de bluffs, surtout en multiway et à la river contre les joueurs qui « ne couchent pas ».</li>
          <li>Face à une relance ou une grosse mise turn/river d'un joueur passif : couche les mains moyennes sans regret.</li>
          <li>Pots multiway : c-bet seulement avec une vraie main ou un gros tirage.</li></ul>`],
        ['Tapis profonds et straddles', `<p>Les tables live sont souvent profondes (150-300 bb) et les straddles fréquents. Profond : valorise les paires et les assorties connectées, joue serré avec les mains dominées. Straddle : la profondeur effective est divisée par deux, resserre tes ranges.</p>`],
        ['Taux horaire et variance', `<p>À 30 mains par heure, 1 000 heures ne font que 30 000 mains : la variance se mesure en mois. On compte le résultat en <strong>bb par heure</strong>. Exemple : un joueur à +10 bb/100 en live ferait environ +3 bb par heure avant rake et pourboires. Le rake par pot pèse plus qu'en ligne ; il faut un écart de niveau net avec la table.</p>
          <p>Bankroll : prévois au moins 20 à 30 caves maximum pour la limite, davantage si tu joues des tables profondes ou si tu n'as pas d'autre revenu.</p>`],
        ['Sélection de table et de place', `<ul><li>Observe une orbite : nombre de limps, taille des pots, joueurs qui boivent ou s'amusent.</li>
          <li>Place idéale : le joueur faible à ta droite (tu parles après lui), le joueur agressif à ta gauche.</li>
          <li>Demande un changement de table dès que la tienne devient trop solide.</li></ul>`],
      ],
      mistakes: ['Ouvrir à 2,5 bb comme en ligne face à des joueurs qui paient tout', 'Bluffer en multiway contre des joueurs récréatifs', 'Juger ses résultats live sur 50 heures', 'Rester à une table de réguliers par habitude'],
      keys: ['Ouvertures 4-6 bb + 1 par limper', 'Valeur grosse, bluffs rares', 'Résultat en bb/heure, variance en mois', 'La sélection de table fait le winrate'],
      quiz: [
        ['Trois limpers devant toi au bouton avec AQo. Taille d\'isolation live ?', ['3 bb', 'Environ 8 bb', '20 bb'], 1, '5 bb + 1 bb par limper ≈ 8 bb.'],
        ['Un joueur passif relance ta mise turn. Tu as top paire bon kicker. Par défaut ?', ['Couche', 'Relance'], 0, 'Les relances turn des passifs sont de la valeur forte.'],
        ['Winrate de 10 bb/100 en live : combien de bb par heure environ ?', ['1', '3', '10'], 1, '30 mains/h × 10/100 = 3 bb/h.'],
        ['Où veux-tu le joueur le plus faible de la table ?', ['À ta droite', 'À ta gauche'], 0, 'Tu parles après lui : tu isoles et tu as la position.'],
      ],
    });

    K.mod({
      id: 'live_tells', level: 5, title: 'Tells : ce que la recherche dit, ce qui sert vraiment', drill: 'situations',
      goals: ['Distinguer les tells fiables des mythes', 'Observer avec une méthode (référence de base, timing, contexte)', 'Contrôler tes propres signaux'],
      sections: [
        ['Ce que dit la recherche', `<p>Une étude publiée dans <em>Psychological Science</em> (Slepian, Young, Rutchick et Ambady, 2013) a montré à des observateurs novices des extraits de deux secondes de mises de joueurs professionnels des WSOP. Résultats : en regardant <strong>seulement le visage</strong>, ils jugeaient la force de la main <strong>moins bien que le hasard</strong> (les pros contrôlent leur visage) ; en regardant <strong>seulement les bras</strong>, ils faisaient <strong>mieux que le hasard</strong>. La fluidité et la confiance du geste de mise étaient liées à la qualité de la main.</p>
          <p>Leçon : regarde les mains et le geste de mise, pas le visage.</p>`],
        ['Les familles de tells', `<p>Zachary Elwood (<em>Reading Poker Tells</em>) distingue trois moments :</p>
          <ul><li><strong>En attendant d'agir</strong> : un joueur qui prépare ses jetons avant son tour a souvent envie de jouer ; un joueur qui regarde ailleurs avec une main moyenne attend souvent la suite.</li>
          <li><strong>Au moment de miser</strong> : geste fluide et assuré, souvent fort ; geste hésitant ou exagéré, à interpréter selon sa référence.</li>
          <li><strong>Après la mise</strong> : un joueur qui se fige et évite tout mouvement bluffe souvent ; un joueur détendu qui parle volontiers a souvent une main forte.</li></ul>
          <p>Le principe ancien de Mike Caro (« faible signifie fort, fort signifie faible ») s'applique aux joueurs qui <em>jouent la comédie</em> : celui qui soupire avant de miser cherche à paraître faible.</p>`],
        ['La méthode', `<ol><li><strong>Référence</strong> : observe comment chaque joueur se comporte quand il ne joue pas, puis quand il montre une main forte ou un bluff.</li>
          <li><strong>Écart</strong> : un tell est un changement par rapport à sa référence, pas un geste isolé.</li>
          <li><strong>Timing</strong> : un call instantané au flop plafonne souvent la main (pas de set qui aurait réfléchi à relancer) ; une longue réflexion puis une grosse mise est souvent forte chez les joueurs récréatifs.</li>
          <li><strong>Poids</strong> : un tell ajuste une décision serrée ; il ne renverse jamais une lecture de range claire.</li></ol>`],
        ['Les tells verbaux', `<p>Les phrases spontanées en cours de main sont souvent plus fiables que les gestes : un joueur qui cherche à engager la conversation est souvent à l'aise (main forte) ; un joueur qui répond par monosyllabes après avoir misé gros est souvent tendu. Ne pose pas de question pour provoquer un tell si la salle l'interdit en coup à plusieurs.</p>`],
        ['Tes propres signaux', `<ul><li>Même routine à chaque décision : regarder ses cartes une seule fois, compter jusqu'à trois, annoncer, poser les jetons.</li>
          <li>Même posture, que tu sois fort ou faible ; pas de conversation pendant les mains importantes.</li>
          <li>Les lunettes et capuches peuvent être refusées (identification, TDA 2024) : mise sur la routine plutôt que sur le camouflage.</li></ul>`],
      ],
      mistakes: ['Lire le visage plutôt que les mains', 'Prendre un geste isolé pour un tell sans référence', 'Laisser un tell contredire une lecture de range évidente', 'Changer de rythme selon la force de sa main'],
      keys: ['Bras et gestes > visage (Slepian et al., 2013)', 'Un tell = un écart par rapport à la référence', 'Le timing est le tell le plus fréquent', 'Ta routine identique est ta meilleure protection'],
      quiz: [
        ['Selon l\'étude de 2013, quelle partie du corps renseignait le mieux sur la force de la main ?', ['Le visage', 'Les bras'], 1, 'Avec le visage seul, les observateurs faisaient pire que le hasard.'],
        ['Un joueur se fige complètement après une grosse mise river. Lecture fréquente ?', ['Main très forte', 'Bluff possible'], 1, 'L\'immobilité après la mise est un signe de tension fréquent chez les bluffeurs.'],
        ['Un tell doit…', ['Renverser ta lecture de range', 'Ajuster une décision serrée'], 1, 'La range d\'abord, le tell ensuite.'],
        ['Meilleure protection contre tes propres tells ?', ['Des lunettes noires', 'Une routine identique à chaque décision'], 1, 'Un comportement constant ne transmet rien.'],
      ],
    });

    K.mod({
      id: 'live_table', level: 5, title: 'Gérer la table : image, parole, litiges, sécurité, triche', drill: 'situations',
      goals: ['Utiliser son image et la conversation sans enfreindre les règles', 'Gérer un litige avec un croupier ou un joueur', 'Repérer et signaler la triche en salle'],
      sections: [
        ['Image et conversation', `<ul><li>Les joueurs récréatifs restent et paient plus à une table agréable : sois courtois, ne commente jamais leurs erreurs.</li>
          <li>Ne donne pas de leçon de stratégie : un fish corrigé devient moins rentable.</li>
          <li>Parler de sa main pendant un coup à plusieurs, ou montrer ses cartes à un joueur, est interdit (« un joueur par main »). En tête-à-tête, les règles de la salle peuvent tolérer la conversation, mais la mise en scène (« je n'ai rien ») ne doit pas tromper sur l'action.</li></ul>`],
        ['Litiges', `<ol><li>Arrête l'action (« Floor ») avant que le coup continue : une contestation tardive est rarement recevable.</li>
          <li>Expose les faits sans t'énerver ; le croupier n'est pas ton adversaire.</li>
          <li>Accepte la décision du floor, puis fais une réclamation écrite à la direction si nécessaire.</li></ol>`],
        ['Argent et sécurité', `<ul><li>Ne transporte que la bankroll prévue pour la session ; pas de sortie en affichant tes gains.</li>
          <li>Changes tes jetons à la caisse ; demande un justificatif si tu as besoin de tracer tes gains.</li>
          <li>Ne prête pas d'argent à table et ne joue pas « à crédit ».</li></ul>`],
        ['Triche en salle', `<ul><li><strong>Collusion</strong> : deux joueurs qui se relancent pour piéger un troisième, ne s'attaquent jamais, ou se « passent » des jetons (chip dumping).</li>
          <li><strong>Cartes marquées, faux mélange</strong> : rares dans les salles contrôlées par caméras, plus probables dans les parties non autorisées (une raison de plus de les éviter).</li>
          <li><strong>Angle shooting</strong> : gestes ambigus pour provoquer une erreur (faire semblant de payer, cacher de gros jetons). Annonce toujours tes actions et demande le montant exact (« Combien ? ») avant de décider.</li></ul>
          <p>En cas de doute : signale au floor ou à la direction, discrètement, avec des faits datés.</p>`],
        ['Gestion de session live', `<p>Fixe heure de fin et stop-loss avant de t'asseoir ; l'alcool et la fatigue de fin de nuit sont les deux pires ennemis du winrate live. Note la session (durée, résultat, rake estimé, pourboires) dans le Journal.</p>`],
      ],
      mistakes: ['Expliquer à un fish pourquoi il a mal joué', 'Contester une décision après la fin du coup', 'Décider face à une mise sans en connaître le montant exact', 'Jouer dans une partie non autorisée'],
      keys: ['Table agréable = fish qui restent', 'Floor tout de suite, calmement', 'Toujours connaître le montant exact avant d\'agir', 'Collusion et angle shooting : signaler avec des faits'],
      quiz: [
        ['Un joueur faible vient de payer trois rues avec rien et gagne. Ta réaction ?', ['Lui expliquer son erreur', 'Rien, rester aimable'], 1, 'Il doit continuer à jouer ainsi, à ta table.'],
        ['Face à une mise dont tu ne vois pas le montant, tu…', ['Paies au jugé', 'Demandes « Combien ? » au croupier'], 1, 'Tu as droit au montant exact avant d\'agir.'],
        ['Deux joueurs ne se misent jamais dessus et relancent toujours quand tu es dans le coup. Que faire ?', ['Rien', 'Prévenir discrètement le floor avec des faits'], 1, 'Comportement typique de collusion.'],
      ],
    });

    K.mod({
      id: 'live_mtt', level: 5, title: 'Tournois live et festivals : structure, rythme, budget', drill: 'pushfold',
      goals: ['Lire une structure de tournoi et en déduire la stratégie', 'Gérer le rythme d\'un tournoi live sur plusieurs jours', 'Budgéter un festival (buy-ins, frais, voyage)'],
      sections: [
        ['Lire la structure', `<ul><li><strong>Tapis de départ en grosses blindes</strong> : 100 bb et plus = beaucoup de jeu postflop ; 30 bb = jeu proche du push/fold rapidement.</li>
          <li><strong>Durée des niveaux</strong> : 40 à 60 minutes en live (contre 5 à 10 en ligne). À 30 mains par heure, un niveau de 40 minutes = environ 20 mains.</li>
          <li><strong>Ante de grosse blinde</strong> : un seul joueur paie l'ante pour toute la table ; elle augmente le pot et pousse à voler plus large.</li>
          <li><strong>Inscriptions tardives et réentrées</strong> : elles gonflent le prize pool, mais chaque réentrée est un nouveau buy-in pour ton ROI.</li></ul>`],
        ['Rythme et énergie', `<p>Un tournoi live peut durer 10 à 14 heures par jour. Mange et bois de l'eau aux pauses, évite l'alcool, garde une routine de décision. Les erreurs de fin de journée (fatigue) coûtent autant que les bad beats.</p>`],
        ['Bulle et table finale', `<p>Les principes ICM du module Tournois avancés s'appliquent : le gros tapis attaque, les tapis moyens se serrent. En table finale, un deal ICM se discute avec l'organisateur et les joueurs ; vérifie les chiffres avec l'outil Deal ICM avant d'accepter.</p>`],
        ['Budget de festival', `<table class="t"><thead><tr><th>Poste</th><th>À prévoir</th></tr></thead><tbody>
          <tr><td>Buy-ins et réentrées</td><td>Bankroll tournoi : 50 à 100 buy-ins pour la catégorie visée, davantage pour les gros champs</td></tr>
          <tr><td>Voyage, hôtel, repas</td><td>À ajouter au coût de chaque tournoi dans ton ROI réel</td></tr>
          <tr><td>Satellites</td><td>Un moyen d'accéder à des buy-ins élevés ; joue-les avec la stratégie satellite (ICM extrême à la bulle)</td></tr></tbody></table>
          <p>Un ROI live de +20 % sur des tournois à 300 € avec 150 € de frais de déplacement par tournoi devient presque nul : compte toujours les frais.</p>`],
        ['Gains et formalités', `<p>Les gains de jeu des joueurs non professionnels ne sont en principe pas imposés en France ; la situation change pour un joueur dont c'est l'activité habituelle (module Fiscalité). À l'étranger, des retenues peuvent s'appliquer selon les pays : renseigne-toi avant de partir. Garde une trace écrite de tes résultats.</p>`],
      ],
      mistakes: ['Jouer un tournoi à 30 bb de départ comme un tournoi profond', 'Oublier les frais de voyage dans le ROI', 'Réentrer sans limite fixée à l\'avance', 'Accepter un deal sans calcul ICM'],
      keys: ['Tapis de départ en bb = type de tournoi', 'Niveau live de 40 min ≈ 20 mains', 'ROI réel = après frais', 'Deal : calcul ICM d\'abord'],
      quiz: [
        ['Niveaux de 40 minutes à 30 mains par heure : combien de mains par niveau ?', ['Environ 20', 'Environ 60'], 0, '40/60 × 30 = 20 mains.'],
        ['Tournoi à 300 €, ROI +20 %, 150 € de frais par tournoi. Gain moyen réel ?', ['+60 €', '−90 €', '0 €'], 1, '+60 € de gain moyen − 150 € de frais = −90 € par tournoi.'],
        ['Ante de grosse blinde : effet stratégique ?', ['Plus de vols préflop', 'Moins de vols'], 0, 'Plus d\'argent mort au milieu : voler devient plus rentable.'],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
