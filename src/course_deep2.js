// Cours — exercices corrigés, niveaux 1 à 3 (modules qui n'en avaient pas).
// Équités : moteur SIGMA 52 (200 000 tirages, ± 0,3 point). Probabilités : calcul exact indiqué.
(function (root) {
  const ex = (items) => items.map(([q, a], i) => `<details class="exo"><summary><strong>Exercice ${i + 1}.</strong> ${q}</summary><p>${a}</p></details>`).join('');
  function register(K) {
    const add = (id, x) => { if (K.MODULES.some((m) => m.id === id)) K.extend(id, x); };

    // ---------------- Niveau 1 ----------------
    add('cadre', { sections: [['Exercices corrigés', ex([
      ["Un site inconnu propose un bonus de 500 % aux joueurs français. Il n'apparaît pas sur la liste de l'ANJ. Tu t'inscris ?", "Non. Hors liste, tes gains ne sont pas protégés et tu n'as aucun recours en cas de litige ou de compte bloqué. Le bonus ne compense pas un risque de perte totale du solde."],
      ["Pendant une session, tu gardes ouverte une chart préflop dans un onglet de ton navigateur « juste pour vérifier ». Risque ?", "Ça dépend de la room et de la chart : PokerStars ne tolère que des charts simples d'ouverture (relance ou couche, sans fréquences, neuf grilles au plus) et interdit celles qui disent quoi faire face à une relance ; Winamax autorise les tableaux de mains de départ mais interdit les ranges dynamiques. Le plus sûr reste de fermer tout outil d'étude avant d'ouvrir le client : « rien d'autre que le client pendant le jeu »."],
      ["Tu joues chaque soir, tu gagnes régulièrement et tu as un emploi à côté. Tes gains sont-ils forcément non imposables ?", "Non. Depuis la décision du Conseil d'État de 2018, une pratique habituelle, où le savoir-faire maîtrise l'aléa et qui rapporte des revenus significatifs, peut être imposée en BNC même avec un autre métier. Garde tes historiques et vois le module Fiscalité."],
    ])]], quiz: [
      ["Chez Winamax, un calculateur d'ICM ouvert pendant un tournoi est…", ['Interdit', 'Autorisé'], 0, "Le règlement poker de Winamax interdit explicitement les calculateurs d'ICM et d'équité pendant le jeu."],
      ["Baisser ta limite de dépôt s'applique…", ['Tout de suite', 'Après un délai'], 0, "Une baisse s'applique immédiatement ; une hausse demande un délai, pour te protéger."],
    ] });

    add('regles', { sections: [['Exercices corrigés', ex([
      ["Blindes 1/2. UTG relance à 6, le joueur suivant veut relancer. Quel est le montant minimum ?", "La relance précédente est de 4 (de 2 à 6) : il doit relancer d'au moins 4, donc à <strong>10</strong> minimum."],
      ["Tête-à-tête : qui parle en premier avant le flop, et après ?", "Le bouton est la petite blinde : il parle <strong>en premier avant le flop</strong> et <strong>en dernier après</strong>."],
      ["A a 50 jetons, B 200, C 200. A part à tapis, B et C paient puis misent encore entre eux. Comment se forment les pots ?", "Pot principal : 3 × 50 = 150, que les trois peuvent gagner. Pot annexe : ce que B et C misent au-delà de 50, que seuls B et C peuvent gagner. A ne peut jamais gagner plus de 50 par adversaire."],
    ])]], quiz: [
      ["Board A♠K♠Q♠J♠T♥, tu as 2♣3♦, ton adversaire 4♥5♥. Résultat ?", ['Partage', 'Tu perds', 'Tu gagnes'], 0, "Le board donne une suite à l'as pour tout le monde : partage."],
      ["Qui montre en premier à l'abattage après une mise river payée ?", ['Le joueur qui a misé', 'Le joueur qui a payé'], 0, "Le dernier agresseur de la dernière rue montre en premier."],
    ] });

    add('mains', { sections: [['Exercices corrigés', ex([
      ["Board K♥Q♥7♣4♥2♦. Quelle est la meilleure main possible (les nuts) ?", "La couleur à l'as : A♥ + un autre cœur. Pas de paire au board, donc pas de full ni de carré ; pas de quinte flush possible avec ces cœurs (K-Q-7-4)."],
      ["Board 9♠9♦5♣5♥2♠. Tu as A♣3♦, ton adversaire K♠K♦. Qui gagne ?", "Lui. Il a trois paires possibles (K-K, 9-9, 5-5) et garde les deux meilleures : <strong>rois et 9</strong>, avec un 5 en kicker. Toi : 9 et 5 avec un as. Rois et 9 battent 9 et 5."],
      ["Au flop, tu as une paire en main (7♣7♦). Probabilité de toucher un brelan ou mieux au flop ?", "1 − C(48,3) ÷ C(50,3) = 1 − 17 296 ÷ 19 600 ≈ <strong>11,8 %</strong>, environ une fois sur 8,5."],
    ])]], quiz: [
      ["Brelan contre suite : qui gagne en hold'em ?", ['La suite', 'Le brelan'], 0, "La suite bat le brelan (en Short Deck, c'est l'inverse)."],
      ["Board A♠A♦A♣K♥K♠ : tu as Q♥Q♦. Ta main ?", ['Full aux as par les rois, comme tout le monde', 'Full aux as par les dames'], 0, "Le board fait déjà A-A-A-K-K ; tes dames ne jouent pas."],
    ] });

    add('preflop', { sections: [['Exercices corrigés', ex([
      ["Deux joueurs limpent, tu es au bouton avec A♠J♦. Que fais-tu ?", "Tu isoles : relance à environ <strong>5,5 bb</strong> (3,5 bb + 1 par limper). AJ domine les mains que les limpers jouent, et la position te donne l'avantage dans le pot."],
      ["AKo contre QQ, tout à tapis préflop. Qui est favori ?", "QQ, environ <strong>57 %</strong> contre 43 % pour AKo (moteur SIGMA 52, moyenne sur les couleurs). Une paire contre deux overcards est un « coin flip » légèrement en faveur de la paire."],
      ["Pourquoi limper 8♥7♥ en début de parole est-il une erreur, même si la main est jouable ?", "Le limp n'a ni fold equity ni initiative : tu invites les joueurs derrière à relancer ou à entrer à bas prix, et tu joues un pot multiway hors de position. Soit la main est dans ta range d'ouverture et tu relances, soit tu couches."],
    ])]], quiz: [
      ["AKs contre 77 à tapis préflop ?", ['≈ 48 % pour AKs', '≈ 65 % pour AKs'], 0, "Moteur SIGMA 52 : AKs 47,9 %, 77 52,1 %."],
      ["Premier à entrer, ta main n'est pas dans ta range d'ouverture. Tu…", ['Te couches', 'Limpes'], 0, "Premier à entrer : relance ou couche-toi."],
    ] });

    add('online', { sections: [['Exercices corrigés', ex([
      ["Tu débutes. Combien de tables ouvrir ?", "Une ou deux. Le nombre de tables se monte seulement si ton taux de bonnes décisions (Spots, revue de mains) reste stable : plus de tables réduit le temps de réflexion par décision."],
      ["Deux tables NL5 : l'une a 3 joueurs à VPIP supérieur à 40 %, l'autre 5 réguliers serrés. Laquelle ?", "La première. Les joueurs très larges paient trop et font l'essentiel de tes gains ; une table de réguliers te coûte surtout du rake."],
      ["Tu viens de perdre trois caves, il est 2 h du matin. Ta routine dit ?", "Stop. Le stop-loss et la fatigue sont deux raisons d'arrêter ; tu notes les mains à revoir et tu les analyses demain, au calme."],
    ])]], quiz: [
      ["Plus de tables, c'est…", ['Plus de mains, mais souvent un winrate plus bas', 'Toujours plus rentable'], 0, "L'optimum se mesure : winrate × volume."],
      ["Le critère n°1 pour choisir une table ?", ['La présence de joueurs faibles', 'Le nombre de places libres'], 0, "La sélection de table rapporte souvent plus que n'importe quelle technique."],
    ] });

    add('sprint', { sections: [['Exercices corrigés', ex([
      ["Jour 3 du programme. Tu as limpé quatre fois hier. Quelle règle as-tu cassée et que fais-tu aujourd'hui ?", "La règle « premier à entrer : relance ou couche ». Aujourd'hui, objectif unique de session : zéro limp. Note chaque main où tu as hésité et vérifie-la dans l'Atlas préflop."],
      ["Un passif qui ne relance jamais te relance à la river. Tu as top paire. Que dit la méthode express ?", "Couche, sauf main très forte. Contre un joueur passif, une relance river est presque toujours de la valeur : ta top paire est battue la plupart du temps."],
      ["Au bout de 30 jours, tu es à −2 caves sur 4 000 mains. Le programme a-t-il échoué ?", "Impossible à dire sur 4 000 mains : l'écart-type d'un winrate est énorme sur un tel échantillon. Juge les décisions (taux de réussite aux Spots, fuites corrigées dans l'Analyse), pas le résultat."],
    ])]], quiz: [
      ["Après 30 jours, ce qui doit avoir progressé à coup sûr, c'est…", ['Tes décisions mesurées (Spots, fuites)', 'Ton résultat en argent'], 0, "Le résultat demande des dizaines de milliers de mains pour être lisible."],
      ["Contre un joueur qui paie tout, la règle express est…", ['Valeur grosse, peu de bluffs', 'Beaucoup de bluffs'], 0, "On ne bluffe pas un joueur qui ne se couche pas."],
    ] });

    add('responsable', { sections: [['Exercices corrigés', ex([
      ["Tu as perdu ton budget du mois le 12. Tu proposes de « prendre un peu sur le mois prochain ». Lecture ?", "C'est le signal « jouer pour se refaire » : le budget est épuisé, tu arrêtes jusqu'au mois suivant. Si l'envie persiste, parles-en ; Joueurs Info Service : 09 74 75 13 13."],
      ["Un ami cache à sa compagne le temps qu'il passe à jouer. Que peux-tu lui dire ?", "Que le mensonge sur le temps ou l'argent joués est un signal d'alerte reconnu, et qu'une pause et une discussion avec un proche ou un professionnel valent mieux que d'attendre. L'interdiction volontaire de jeux (ANJ, au moins 3 ans) existe s'il le souhaite."],
      ["Quelles limites fixer avant ta première session ?", "Un budget mensuel séparé, des limites de dépôt et de mise dans la room, une durée maximale de session et des jours sans poker dans la semaine."],
    ])]], quiz: [
      ["L'interdiction volontaire de jeux ANJ couvre…", ['Casinos, clubs et sites agréés', 'Seulement les sites en ligne'], 0, "Elle couvre aussi casinos, clubs, jeux FDJ et PMU avec compte."],
      ["Tu es irritable quand tu ne joues pas. C'est…", ['Un signal d\'alerte', 'Normal pour un joueur sérieux'], 0, "Irritabilité et pensées tournées vers le jeu sont des signaux reconnus."],
    ] });

    // ---------------- Niveau 2 ----------------
    add('maths2', { sections: [['Exercices corrigés', ex([
      ["Combien de combinaisons de AK au total ? Et s'il y a un as au board ?", "16 au total (4 × 4). Avec un as au board, il reste 3 as : 3 × 4 = <strong>12</strong>."],
      ["Ton adversaire peut avoir KK, AK ou QQ. Tu as A♠Q♦, board 7♣3♦2♥. Combien de combos de chaque ?", "KK : 6 (aucun roi visible). AK : 3 as restants × 4 rois = 12. QQ : 3 dames restantes → 3 combos. Ton as et ta dame bloquent AK et QQ."],
      ["Pot 100, tapis effectifs 400 au flop. SPR, et que veut-il dire pour une top paire ?", "SPR = 400 ÷ 100 = <strong>4</strong>. Avec un SPR de 4, une top paire bon kicker est généralement prête à mettre son tapis ; à SPR 10 et plus, elle préfère contrôler la taille du pot."],
    ])]], quiz: [
      ["Combos d'une paire précise (ex. JJ) sans carte visible ?", ['6', '4', '12'], 0, "C(4,2) = 6."],
      ["Combos d'une main assortie précise (ex. AKs) ?", ['4', '12', '16'], 0, "Une par couleur."],
    ] });

    add('formats', { sections: [['Exercices corrigés', ex([
      ["Tu as 6 heures par semaine et tu veux mesurer ta progression. Quel format principal ?", "Le cash game 6-max : chaque main est comparable aux autres, et ton winrate devient lisible plus vite que tes résultats en tournoi."],
      ["Pourquoi l'Expresso est-il difficile à battre malgré des adversaires faibles ?", "Le rake est intégré au multiplicateur tiré au sort, et la variance est extrême : il faut un écart de niveau net en push/fold pour couvrir le coût."],
      ["Selon l'ANJ, quelle part du produit brut du poker en ligne vient du cash game en 2025 ?", "Environ <strong>19 %</strong>, contre 68 % pour les Sit&Go (dont Expresso) et environ 13 % pour les tournois."],
    ])]], quiz: [
      ["Le format le plus utile pour apprendre l'ICM ?", ['Sit&Go classique', 'Cash game'], 0, "Les tapis décroissent et les places payées comptent."],
      ["En MTT, les gains sont…", ['Concentrés sur quelques grosses places', 'Réguliers'], 0, "D'où une variance très forte."],
    ] });

    add('live', { sections: [['Exercices corrigés', ex([
      ["Partie 1/2 € en casino : trois joueurs limpent, tu es au bouton avec A♦Q♠. Quelle taille de relance ?", "Plus grosse qu'en ligne : environ 4 bb + 1 bb par limper, soit <strong>7 bb (14 €)</strong>. Les joueurs live paient beaucoup ; une petite relance invite tout le monde."],
      ["Tu joues 30 mains par heure en live. Combien d'heures pour 30 000 mains ?", "30 000 ÷ 30 = <strong>1 000 heures</strong>. Un winrate live se mesure sur des années : suis plutôt ton taux horaire et tes décisions."],
      ["Un joueur passif live relance à la turn. Lecture par défaut ?", "Main forte. La population live passive relance rarement en bluff : sans lecture contraire, couche tes mains moyennes."],
    ])]], quiz: [
      ["En live, on joue environ…", ['25 à 35 mains par heure', '75 mains par heure'], 0, "Une table en ligne va deux à trois fois plus vite."],
      ["Contre une table live passive, la valeur se prend…", ['Plus gros', 'Plus petit'], 0, "Ils paient trop : mises de valeur plus grosses."],
    ] });

    add('online2', { sections: [['Exercices corrigés', ex([
      ["Tu veux passer de 4 à 8 tables. Comment savoir si c'est rentable ?", "Mesure sur ta base : winrate × mains par heure à 4 tables, puis à 6 et 8 sur des échantillons comparables. Si le winrate chute plus vite que le volume ne monte, reste à 4."],
      ["Un logiciel qui affiche en direct la range conseillée selon ta position est-il autorisé ?", "Non : c'est une aide en temps réel, interdite par toutes les rooms. Seuls les outils listés comme autorisés par la room sont utilisables pendant le jeu."],
      ["Ton ami te demande ton mot de passe pour « jouer une session à ta place ». Réponse ?", "Non : partager son compte est interdit (fraude à l'identité) et peut entraîner la fermeture du compte et la confiscation du solde."],
    ])]], quiz: [
      ["Une base de mains achetée à un tiers…", ['Est interdite (data mining)', 'Est autorisée'], 0, "Les rooms l'interdisent."],
      ["La double authentification sert à…", ['Protéger ton compte et ton solde', 'Jouer plus de tables'], 0, "Sécurité de base."],
    ] });

    add('decision', { sections: [['Exercices corrigés', ex([
      ["Tu paies un tapis avec QQ contre AKo préflop et tu perds. Bonne ou mauvaise décision ?", "Probablement bonne : QQ a environ 57 % contre AKo. Juge la décision avec la range de l'adversaire et la cote, pas avec la carte de la river."],
      ["Tu bluffes la river, il se couche. Ton bluff était-il bon ?", "On ne sait pas encore. Il faut estimer combien de fois il se couche dans ce spot et comparer à la cote du bluff : misé un pot, le bluff doit réussir plus d'une fois sur deux."],
      ["Combien de mains faut-il pour qu'un winrate de 4 bb/100 soit distinct de zéro avec un écart-type de 90 bb/100 ?", "Environ <strong>195 000 mains</strong> (intervalle à 95 %). Avant, c'est surtout la qualité des décisions qui renseigne sur ton niveau."],
    ])]], quiz: [
      ["Le « piège du résultat », c'est…", ['Juger une décision par son issue', 'Ne pas noter ses mains'], 0, "Une bonne décision peut perdre, une mauvaise peut gagner."],
      ["Dans le journal de décisions, on note…", ['Les informations disponibles au moment de décider', 'Seulement le résultat'], 0, "C'est ce qui permet de juger la décision."],
    ] });

    add('tilt2', { sections: [['Exercices corrigés', ex([
      ["Après un bad beat, tu relances trois mains de suite hors range. Que fais-tu maintenant ?", "Applique le plan en temps réel : pause de 10 minutes, respiration, relis ton script. Si deux décisions émotionnelles se sont déjà produites, la session s'arrête."],
      ["Tu gagnes 5 caves en une heure et commences à jouer plus de mains « parce que tu es chaud ». Est-ce du tilt ?", "Oui : le tilt de confiance (ou de gagnant) existe. Les résultats récents ne changent pas les cotes ; reviens à tes ranges."],
      ["Après la session, comment traiter la cause d'un tilt du « dû » (« je mérite de gagner ») ?", "Écris la croyance, puis la correction : sur une main, le meilleur joueur perd souvent ; sur un grand échantillon, la qualité des décisions finit par compter. Relis-la avant la session suivante."],
    ])]], quiz: [
      ["Deux décisions émotionnelles dans une session…", ['Stop', 'Continuer en se concentrant'], 0, "C'est une règle d'arrêt."],
      ["Le tilt de gagnant…", ['Existe', 'N\'existe pas'], 0, "L'excès de confiance déforme aussi les décisions."],
    ] });

    add('discipline', { sections: [['Exercices corrigés', ex([
      ["Ta bankroll est de 1 200 € et tu joues NL25 (cave 25 €). Ta règle dit 40 caves minimum. Que fais-tu ?", "1 200 ÷ 25 = 48 caves : tu restes en NL25. Sous 30 caves (750 €), la règle impose de redescendre en NL10."],
      ["Tu atteins ton stop-loss de 3 caves, mais la table est « très bonne ». Tu continues ?", "Non. Une règle décidée avant la session ne se renégocie pas pendant ; la table sera encore là un autre jour."],
      ["Écris un objectif de semaine correct et un objectif à éviter.", "Correct : « 10 heures de jeu, 3 mains revues par session, 2 heures d'étude ». À éviter : « gagner 300 € », qui dépend de la variance et pousse à forcer."],
    ])]], quiz: [
      ["Bankroll sous le seuil de descente…", ['Tu descends de limite', 'Tu joues plus pour te refaire'], 0, "C'est la règle qui protège la bankroll."],
      ["Ratio d'étude conseillé dans le module…", ['Au moins 1 h pour 4 h de jeu', 'Pas d\'étude, seulement du volume'], 0, "Le volume sans étude répète les erreurs."],
    ] });

    add('loisir', { sections: [['Exercices corrigés', ex([
      ["Budget loisir : 100 € par mois. À quelle limite jouer en cash ?", "Le budget est de l'argent de loisir, mais pour jouer un mois sans tout perdre en une soirée, vise au moins 20 caves : NL2 ou NL5 (cave de 2 ou 5 €)."],
      ["Tu as 2 soirées par semaine. Quelle partie choisir ?", "Les horaires du soir et du week-end, où les récréatifs sont plus nombreux, en cash à petite limite ou en tournois à petit buy-in. Évite les tables pleines de réguliers en semaine la journée."],
      ["Le jeu ne t'amuse plus depuis trois semaines et tu joues « pour récupérer ». Que dit le plan ?", "Pause, et relis le module « Jeu responsable ». Le plan du joueur loisir s'arrête quand le plaisir disparaît ou que le budget est dépassé."],
    ])]], quiz: [
      ["Le module qui suffit pour battre la plupart des parties loisir ?", ['Méthode express', 'Solveurs'], 0, "Charts, pas de limp, valeur grosse, peu de bluffs."],
      ["Un format très rapide pour un petit budget…", ['Variance énorme : amusant mais risqué', 'Le plus sûr'], 0, "Le budget peut fondre en une mauvaise série."],
    ] });

    // ---------------- Niveau 3 ----------------
    add('theorie', { sections: [['Exercices corrigés', ex([
      ["River, pot 100, tu mises 100 avec une range polarisée. Quelle proportion de bluffs rend l'adversaire indifférent entre payer et se coucher ?", "Il paie 100 pour gagner 200 : il lui faut 33 % d'équité. Ta range doit contenir <strong>1/3 de bluffs</strong> et 2/3 de valeur."],
      ["Face à ta mise pot, quelle fréquence de défense rend tes bluffs indifférents ?", "Ton bluff risque 100 pour gagner 100 : il est rentable si l'adversaire couche plus de 50 %. Il doit donc défendre <strong>50 %</strong> de sa range (MDF)."],
      ["Ton adversaire couche 80 % face aux mises river. Que fais-tu, équilibre ou exploitation ?", "Exploitation : bluffe plus que la proportion d'équilibre. L'équilibre protège contre un adversaire qui s'adapte ; contre une fuite claire et stable, l'exploitation rapporte plus."],
    ])]], quiz: [
      ["Mise de la moitié du pot à la river : proportion de bluffs d'équilibre ?", ['25 %', '33 %', '50 %'], 0, "b ÷ (p + 2b) = 50 ÷ 200."],
      ["Une stratégie d'équilibre garantit…", ['De ne pas être exploitée', 'De gagner le maximum contre tout le monde'], 0, "Elle ne maximise pas contre un joueur faible."],
    ] });

    add('ranges', { sections: [['Exercices corrigés', ex([
      ["UTG ouvre, tu paies au bouton. Flop A♠K♦7♣. Qui a l'avantage de range ?", "UTG : sa range contient beaucoup plus d'AK, AA, KK, AQ que la tienne (qui a souvent 3-bet ces mains). Il peut miser souvent et petit."],
      ["Même spot, flop 7♥6♥5♣. Et maintenant ?", "Ta range de call au bouton contient plus de connecteurs, petites paires et assorties (98, 76s, 55, 66) : l'avantage de nuts est plutôt de ton côté ; UTG doit miser moins souvent."],
      ["Comment décrire une range « condensée » face à une relance ?", "Beaucoup de mains moyennes, peu de nuts et peu d'air : typiquement la range d'un joueur qui paie une relance sans 3-bet (paires moyennes, as moyens assortis, broadways)."],
    ])]], quiz: [
      ["L'avantage de nuts appartient à…", ['Celui qui a le plus de mains très fortes sur ce board', 'Celui qui a relancé préflop'], 0, "Il dépend du board, pas seulement de l'initiative."],
      ["Une range polarisée contient…", ['Des mains très fortes et des bluffs', 'Surtout des mains moyennes'], 0, "Les mains moyennes en sont exclues."],
    ] });

    add('etude', { sections: [['Exercices corrigés', ex([
      ["Tu as joué 10 heures cette semaine. Combien d'heures d'étude selon le ratio du module ?", "Au début, une heure d'étude pour deux à trois heures de jeu : entre <strong>3 h 20 et 5 h</strong>."],
      ["Tu as perdu un gros pot. Quand l'analyser ?", "Après la session, au calme : écris ta lecture rue par rue, puis vérifie combos et équités dans les Outils. Pendant la session, note seulement un mot pour la retrouver."],
      ["Ta base montre que la population de ta limite couche 65 % face au c-bet flop. Que changes-tu ?", "Tu c-bettes plus souvent, surtout avec des mains qui n'ont pas d'abattage. Un écart de population se joue contre tout le monde, pas contre un seul joueur."],
    ])]], quiz: [
      ["Partager quelques mains avec un groupe d'étude…", ['Autorisé et courant', 'Interdit'], 0, "Ce qui est interdit, c'est l'échange ou la vente de bases complètes."],
      ["Une leçon par main revue, notée…", ['Dans le Journal', 'Nulle part'], 0, "Écrire fixe la leçon."],
    ] });

    add('hu', { sections: [['Exercices corrigés', ex([
      ["En tête-à-tête, tu es au bouton avec K♣4♦. Ouvrir ?", "Oui. Au bouton en tête-à-tête, on ouvre environ 75 à 85 % des mains : K4o est largement dans la range."],
      ["Tu es en grosse blinde, il relance à 2,5 bb. Quelle équité te faut-il pour payer ?", "Tu paies 1,5 bb pour un pot final de 5,5 bb (la petite blinde couchée reste dans le pot) : 1,5 ÷ 5,5 ≈ <strong>27 %</strong> (sans compter la position). D'où une défense très large."],
      ["Tu perds 8 caves en un soir de tête-à-tête. Signe que tu joues mal ?", "Pas forcément : la variance du tête-à-tête est énorme. Revois les mains clés (gros pots, tapis), juge les décisions, et protège-toi avec des sessions plus courtes ou des tapis plus courts."],
    ])]], quiz: [
      ["En tête-à-tête, une paire de 4 vaut…", ['Beaucoup plus qu\'à 6', 'Pareil qu\'à 6'], 0, "Contre une seule range large, les petites paires gagnent souvent."],
      ["Après le flop, le bouton parle…", ['En dernier', 'En premier'], 0, "Le bouton a la position après le flop."],
    ] });

    add('profondeur', { sections: [['Exercices corrigés', ex([
      ["Tapis de 40 bb. Tu ouvres, on te relance. Tu as A♠Q♦. Que faire ?", "Souvent tapis (3-bet/shove si tu relances, ou tapis face au 3-bet). À 40 bb, le SPR après un 3-bet payé est trop bas pour jouer AQ en pot moyen."],
      ["Tapis de 200 bb, tu as 5♠5♦ face à une relance. Le set-mining est-il plus rentable qu'à 100 bb ?", "Oui. Tu touches un brelan au flop environ 11,8 % du temps ; plus les tapis sont profonds, plus tu peux gagner quand tu touches, donc plus le call est rentable."],
      ["Tapis de 200 bb, tu as K♦J♣ (dépareillé) face à une relance UTG. Tu paies ?", "Plutôt non : KJo est souvent dominé (AK, KQ, AJ) et, profond, une paire de rois avec un kicker faible peut coûter un tapis entier."],
    ])]], quiz: [
      ["Plus les tapis sont profonds, plus les mains…", ['Spéculatives gagnent en valeur', 'Dominées gagnent en valeur'], 0, "Cotes implicites plus fortes."],
      ["SPR bas (1 à 3) : top paire est…", ['Souvent prête pour le tapis', 'À contrôler à tout prix'], 0, "Peu de jetons derrière : l'engagement est quasi automatique."],
    ] });

    add('omaha', { sections: [['Exercices corrigés', ex([
      ["PLO, board K♥8♥3♣2♥. Tu as A♥Q♠J♠T♦. As-tu une couleur ?", "Non. En Omaha, il faut <strong>exactement deux cartes de la main</strong> : tu n'as qu'un cœur (A♥), donc pas de couleur."],
      ["Pot 100 en PLO, l'adversaire mise 50. Quelle est ta relance maximale (relance pot) ?", "Tu paies d'abord 50 (pot = 200), puis tu relances de 200 : relance totale à <strong>250</strong>."],
      ["Pourquoi les équités préflop sont-elles plus serrées en PLO qu'en hold'em ?", "Chaque joueur a six combinaisons de deux cartes : même la meilleure main de départ n'est qu'environ 60/40 contre une bonne main. Les décisions se jouent surtout après le flop."],
    ])]], quiz: [
      ["En PLO, une bonne main de départ est…", ['Coordonnée : paires, cartes connectées, assorties', 'Quatre cartes hautes dépareillées'], 0, "Les mains qui travaillent ensemble font les nuts."],
      ["Board sans paire en PLO : un brelan est…", ['Souvent vulnérable', 'Presque imbattable'], 0, "Suites et couleurs sont bien plus fréquentes qu'en hold'em."],
    ] });

    add('stud', { sections: [['Exercices corrigés', ex([
      ["Stud : tu as 3 cœurs (deux cachés, un visible). Trois cœurs sont visibles chez les adversaires couchés. Tes outs couleur ?", "13 cœurs − 3 à toi − 3 morts = <strong>7 outs</strong> au lieu de 10. Les cartes mortes changent tout en Stud."],
      ["Razz : quelle est la meilleure main possible ?", "A-2-3-4-5 (la « roue ») : as bas, suites et couleurs ne comptent pas."],
      ["Razz : tu as A-2-3 en main, ton adversaire montre un K visible en 3e rue. Qui commence en meilleure position ?", "Toi : un roi visible est une très mauvaise carte en Razz. Une main de trois cartes basses est un bon départ."],
    ])]], quiz: [
      ["En Razz, une paire est…", ['Mauvaise', 'Bonne'], 0, "Les paires comptent comme des cartes hautes."],
      ["Les cartes visibles des joueurs couchés…", ['Réduisent tes outs', 'N\'ont aucune importance'], 0, "Ce sont des cartes mortes."],
    ] });

    add('variantes2', { sections: [['Exercices corrigés', ex([
      ["Short Deck : tu as une couleur, ton adversaire un full. Qui gagne ?", "Toi : en Short Deck (règles Triton), <strong>la couleur bat le full</strong>, car elle est plus rare avec 36 cartes."],
      ["Omaha 5 cartes : combien de cartes de ta main utilises-tu ?", "Exactement deux, comme en Omaha 4 cartes, avec trois cartes du board."],
      ["Omaha Hi-Lo : board 2♠5♦8♣K♥K♦. Tu as A♣3♥Q♦Q♠. Qu'as-tu en bas ?", "Une basse 8-5-3-2-A (avec A et 3 de ta main, et 2-5-8 du board) : elle qualifie (5 rangs différents, tous 8 ou moins). En haut, tu as deux paires rois et dames."],
    ])]], quiz: [
      ["En Short Deck, A-6-7-8-9 est…", ['Une suite', 'Rien'], 0, "L'as joue bas sous le 6."],
      ["En Hi-Lo, la basse doit être…", ['8 ou moins, 5 rangs différents', 'Quelconque'], 0, "« 8 or better »."],
    ] });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
