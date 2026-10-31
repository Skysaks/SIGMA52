// Cours — exercices corrigés, niveaux 4 à 6 (modules qui n'en avaient pas).
// Les chiffres reprennent les formules et les données des modules ; ICM : calcul exact du moteur (Malmuth-Harville).
(function (root) {
  const ex = (items) => items.map(([q, a], i) => `<details class="exo"><summary><strong>Exercice ${i + 1}.</strong> ${q}</summary><p>${a}</p></details>`).join('');
  function register(K) {
    const add = (id, x) => { if (K.MODULES.some((m) => m.id === id)) K.extend(id, x); };

    // ---------------- Niveau 4 ----------------
    add('solveurs', { sections: [['Exercices corrigés', ex([
      ["Le solveur mise 33 % du pot avec 90 % de sa range sur A♠7♦2♣ (BTN contre BB). Que retiens-tu pour ta session ?", "Une règle simple : sur un board sec à l'as, le relanceur en position peut miser petit et très souvent, parce qu'il a l'avantage de range. Tu ne retiens pas la fréquence exacte, tu retiens la logique et la taille."],
      ["Ton arbre de solve contient 6 tailles par rue et met 2 heures à calculer. Que changes-tu ?", "Réduis les tailles (une ou deux par rue). Chaque taille multiplie l'arbre ; l'écart d'EV entre une et six tailles est souvent faible, et tu apprends mieux avec une stratégie simple."],
      ["Ton adversaire ne bluffe jamais la river. Comment le traduire au solveur ?", "Par le node locking : tu verrouilles sa stratégie river (zéro bluff) et tu laisses le solveur recalculer ta meilleure réponse. Il couchera la plupart de tes bluff-catchers."],
    ])]], quiz: [
      ["Un solveur calcule…", ['Un équilibre pour l\'arbre et les ranges donnés', 'La stratégie de ton adversaire réel'], 0, "Il dépend entièrement de ce que tu lui donnes."],
      ["Lire une solution commence par…", ['La stratégie globale de la range (fréquences, tailles)', 'Ta main seule'], 0, "La range d'abord, la main ensuite."],
    ] });

    add('mdf', { sections: [['Exercices corrigés', ex([
      ["Il mise 2/3 du pot. Alpha, MDF et équité requise pour payer ?", "Alpha = 0,667 ÷ 1,667 = <strong>40 %</strong>. MDF = <strong>60 %</strong>. Équité requise = 0,667 ÷ 2,333 ≈ <strong>28,6 %</strong>."],
      ["River, tu mises 75 % du pot avec 14 combos de valeur. Combien de bluffs pour une range équilibrée ?", "La part de bluffs d'équilibre est de 30 % : 14 ÷ 0,7 = 20 combos au total, donc <strong>6 bluffs</strong>."],
      ["Pot 20 bb, tapis 80 bb, deux rues à jouer. Quelle taille géométrique pour mettre tout le tapis ?", "f = ((1 + 2 × 80 ÷ 20)^(1/2) − 1) ÷ 2 = (√9 − 1) ÷ 2 = <strong>100 % du pot</strong> à chaque rue (20 → 60 → 180 après les deux calls, tapis engagés)."],
    ])]], quiz: [
      ["Face à une mise de 2 fois le pot, la MDF vaut…", ['33,3 %', '50 %', '66,7 %'], 0, "P ÷ (P + B) = 1 ÷ 3."],
      ["La MDF s'applique à…", ['Une range entière', 'Une main seule'], 0, "Une main se décide à l'équité requise."],
    ] });

    add('bloqueurs', { sections: [['Exercices corrigés', ex([
      ["River, board K♥9♥5♠2♣7♥ (couleur possible). Pour bluffer, préfères-tu A♥Q♣ ou Q♣J♣ ?", "A♥Q♣ : l'as de cœur bloque toutes les couleurs à l'as (les nuts) et une partie des couleurs qu'il paierait. Q♣J♣ ne bloque rien d'utile."],
      ["Tu as A♠K♦ sur A♣8♦3♥. Combien de combos de AK reste-t-il à l'adversaire ? Et de AA ?", "AK : 2 as restants × 3 rois restants = <strong>6</strong>. AA : 2 as restants → <strong>1</strong> combo."],
      ["Comme bluff-catcher, faut-il bloquer ses bluffs ou sa valeur ?", "Sa <strong>valeur</strong>. Un bluff-catcher qui bloque ses mains fortes rend ses bluffs proportionnellement plus fréquents ; bloquer ses bluffs fait l'inverse."],
    ])]], quiz: [
      ["Combos de AA quand tu tiens un as ?", ['3', '6', '1'], 0, "C(3,2) = 3."],
      ["Le meilleur bluff river a souvent…", ['Aucune valeur à l\'abattage et de bons bloqueurs', 'Une paire moyenne'], 0, "Une paire moyenne préfère l'abattage."],
    ] });

    add('avantage', { sections: [['Exercices corrigés', ex([
      ["BTN contre BB, pot simple. Flop K♠K♦4♣. Stratégie du bouton ?", "Mise petite et très fréquente : le bouton a plus de Kx forts et de surpaires, le board touche peu la range de BB. Petite taille, car BB ne peut presque rien avoir de très fort."],
      ["Même spot, flop 9♥8♥7♣. Le bouton mise-t-il souvent ?", "Moins souvent, et plutôt plus gros quand il mise : BB a beaucoup de deux paires, suites et tirages. L'avantage de nuts est partagé ou du côté de BB."],
      ["En session, comment simplifier en deux règles ?", "Board haut et sec qui favorise ta range : petite mise fréquente. Board bas et connecté qui touche sa range : check plus souvent, mise plus grosse et polarisée quand tu mises."],
    ])]], quiz: [
      ["L'avantage de range justifie…", ['Des mises fréquentes et petites', 'Des overbets systématiques'], 0, "L'overbet demande l'avantage de nuts."],
      ["En pot 3-bet, la range du 3-bettor est…", ['Plus forte : il mise plus souvent sur la plupart des boards', 'Plus faible'], 0, "L'avantage de range grandit en pot 3-bet."],
    ] });

    add('oopplay', { sections: [['Exercices corrigés', ex([
      ["Tu es BB, flop 8♠7♠3♦, le bouton c-bette 33 %. Tu as 9♠6♠. Que fais-tu ?", "Check-raise souvent : suite par les deux bouts et tirage couleur, beaucoup d'équité, et le board favorise ta range. Le check-raise gagne le pot tout de suite ou construit un pot quand tu touches."],
      ["Même board, tu as 8♣5♣ (top paire, kicker faible). Check-raise ?", "Plutôt call : ta main a de la valeur à l'abattage mais ne supporte pas bien une 3-bet. Check-raise avec les mains très fortes et les gros tirages, call avec les mains moyennes."],
      ["Le relanceur check derrière au flop. Turn brique. Que fais-tu hors de position ?", "Probe bet : il a montré de la faiblesse, sa range est plafonnée. Mise une taille moyenne avec ta valeur et tes tirages, et quelques mains sans abattage."],
    ])]], quiz: [
      ["Un donk bet est…", ['Une mise hors de position avant le relanceur', 'Une relance à la river'], 0, "Utile surtout quand la carte change l'avantage de ton côté."],
      ["Hors de position, on réalise…", ['Moins bien son équité', 'Mieux son équité'], 0, "D'où une défense plus serrée hors de position."],
    ] });

    add('barrels', { sections: [['Exercices corrigés', ex([
      ["Tu as misé le flop 9♣7♦3♠ avec A♥Q♥, il a payé. Turn A♠. Deuxième mise ?", "Oui : l'as améliore ta range de relanceur bien plus que la sienne (il a souvent 9x, 7x, tirages). Tu as top paire : mise pour la valeur et la protection."],
      ["Flop K♠8♦3♣, turn 6♠ (deuxième pique). Tu as A♦Q♦ sans rien. Deuxième barrel ?", "Faible candidat : le 6♠ donne des deux paires (8-6, 6-3) et de nouveaux tirages (couleur pique, suites) à la range qui a payé, et tu n'as ni tirage ni bloqueur utile. Préfère abandonner, ou choisis un deuxième barrel avec un pique (tirage couleur)."],
      ["River, tu as une deuxième paire contre une calling station qui paie toute paire. Valeur fine ?", "Oui, mise pour la valeur, même assez gros : elle paie avec des paires plus faibles. Contre un nit, la même main checkerait."],
    ])]], quiz: [
      ["L'overbet demande…", ['Avantage de nuts et range adverse plafonnée', 'Juste un board effrayant'], 0, "Sans avantage de nuts, l'overbet se fait exploiter."],
      ["En petites limites, une relance river adverse est…", ['Presque toujours de la valeur', 'Souvent un bluff'], 0, "Coucher les bluff-catchers est souvent correct."],
    ] });

    add('deep', { sections: [['Exercices corrigés', ex([
      ["Tu paies une relance de 6 bb avec 4♦4♣ pour toucher un brelan. Combien faut-il gagner en moyenne quand tu touches, et quel tapis effectif minimum ?", "Environ 7,5 fois le call : <strong>≈ 45 bb</strong> en moyenne. La règle pratique demande un tapis effectif de 15 à 20 fois le call, soit <strong>90 à 120 bb</strong>."],
      ["Pot 4-bet à 100 bb : 4-bet à 22 bb payé. SPR au flop ?", "Pot ≈ 45 bb, tapis ≈ 78 bb : SPR ≈ <strong>1,7</strong>. Avec une surpaire, pas de contrôle du pot : la main va à tapis."],
      ["Partie live à 100 bb avec un straddle à 2 bb. Profondeur effective ?", "100 ÷ 2 = <strong>50 straddles</strong> : joue comme à 50 bb, plus serré, et ouvre à 3 ou 4 fois le straddle."],
    ])]], quiz: [
      ["SPR de 12 en pot simple : top paire…", ['Contrôle la taille du pot', 'Va à tapis automatiquement'], 0, "Il faut deux paires et mieux pour engager 100 bb dans la plupart des cas."],
      ["Tapis profonds : quelles mains perdent de la valeur ?", ['Les mains dominées (AJo, KQo)', 'Les petites paires'], 0, "Elles font des top paires qui perdent de gros pots."],
    ] });

    add('exploitpop', { sections: [['Exercices corrigés', ex([
      ["Un adversaire affiche 60 % de fold to c-bet sur 50 occasions. Quelle est l'incertitude ?", "Erreur type = √(0,6 × 0,4 ÷ 50) ≈ <strong>6,9 points</strong> ; à 95 %, l'intervalle va d'environ 46 % à 74 %. L'écart est probable mais pas encore sûr : exploite modérément."],
      ["La population de ta limite relance la river presque uniquement pour la valeur. Ton exploit ?", "Couche tes bluff-catchers face aux relances river, même avec une main correcte. C'est l'un des exploits les plus rentables des petites limites."],
      ["Tu bluffes beaucoup un nit depuis une heure. Un régulier attentif est à la table. Risque ?", "Il peut s'adapter à ton image (payer plus large contre toi). Contre les réguliers attentifs, reviens près de l'équilibre ; exploite fort surtout les récréatifs."],
    ])]], quiz: [
      ["Contre un joueur qui paie trop, l'exploit est…", ['Valeur plus grosse et plus fine, zéro bluff river', 'Plus de bluffs'], 0, "On ne bluffe pas un joueur qui ne couche pas."],
      ["Une statistique river se stabilise…", ['Lentement (milliers de mains)', 'En 100 mains'], 0, "Peu d'occasions par main."],
    ] });

    add('hud', { sections: [['Exercices corrigés', ex([
      ["VPIP 48 / PFR 7 sur 300 mains. Profil et plan ?", "Fish passif (écart VPIP − PFR de 41 points). Plan : isole-le en position, valeur grosse sur trois rues, pas de bluff."],
      ["WTSD 38 % et W$SD 44 %. Que lis-tu ?", "Il va trop souvent à l'abattage et y perd souvent : il paie trop. Mise pour la valeur plus fine et ne le bluffe pas à la river."],
      ["Écris une note correcte sur un joueur qui a relancé la river avec une deuxième paire.", "« 12/10 : relance river avec 2e paire (K-9 sur K-9-5-2-7) face à une mise de 1/2 pot. » Un fait daté et vérifiable, pas une étiquette (« bluffeur »)."],
    ])]], quiz: [
      ["Écart VPIP − PFR de plus de 15 points signale…", ['Un joueur qui paie trop préflop', 'Un joueur très agressif'], 0, "La cible prioritaire."],
      ["En France, un HUD tiers pendant le jeu…", ['Dépend de la room : vérifie son règlement', 'Est toujours autorisé', 'Est toujours interdit'], 0, "Winamax autorise un logiciel de suivi alimenté par tes propres mains, d'autres rooms interdisent tout HUD tiers ; les règles changent."],
    ] });

    add('icm2', { sections: [['Exercices corrigés', ex([
      ["Trois joueurs, prix 50/30/20, tapis 5 000 / 3 000 / 2 000. Quelle part du prize pool vaut chaque tapis en ICM ?", "Moteur SIGMA 52 : <strong>38,4 % / 32,8 % / 28,9 %</strong>. Le gros tapis possède 50 % des jetons mais seulement 38,4 % de la valeur : en ICM, les jetons gagnés valent moins que les jetons perdus."],
      ["Tapis moyen, tu reçois un tapis du gros tapis, juste avant la bulle. Tu as A♠J♦. Pourquoi le call est-il plus serré qu'en cash ?", "La prime de risque : perdre te sort sans gain, doubler te rapporte moins en valeur. Dans le tableau du module, un tapis moyen qui paie le gros doit avoir environ 72 % d'équité au lieu de 50 %."],
      ["PKO, tapis de départ 10 000 : la part encaissée d'une prime de départ vaut ≈ 5 000 jetons. Un joueur à 2 800 pousse, tu as 11 500 en BB. Pourquoi élargir ton call ?", "Tu gagnes le pot et environ 5 000 jetons d'équivalent prime (il te faut ≈ 24 % au lieu de 44 %) : l'équité requise baisse nettement. La prime compte comme de l'argent mort dans le pot."],
    ])]], quiz: [
      ["Dans un chip chop, qui est avantagé par rapport à l'ICM ?", ['Les gros tapis', 'Les petits tapis'], 0, "Le partage au prorata des jetons ignore la prime de risque."],
      ["En satellite à places égales, une fois ta place quasi acquise…", ['Coucher AA peut être correct', 'Il faut tout jouer'], 0, "La prime de risque devient extrême."],
    ] });

    add('perf', { sections: [['Exercices corrigés', ex([
      ["Comment reconnaître ton C-game en session ?", "Décisions automatiques ou émotionnelles, calls « pour voir », impatience. Écris tes 3 signes personnels avant la session ; s'ils apparaissent, pause ou arrêt."],
      ["Tu joues 6 heures d'affilée. Où se trouvent tes erreurs ?", "Souvent dans la dernière partie : la fatigue coûte des bb/100 avant d'être ressentie. Compare ton winrate et tes erreurs notées par heure de session dans le Journal."],
      ["Après une semaine à −10 caves, tu veux changer toute ta stratégie. Bonne idée ?", "Non, sauf erreur identifiée. Revois les mains clés, sépare variance et erreurs ; ne change que ce que la revue montre."],
    ])]], quiz: [
      ["Le A-game se protège par…", ['Une routine de session fixe', 'Plus de tables'], 0, "La routine réduit la part émotionnelle."],
      ["Une mauvaise semaine prouve…", ['Peu de choses sur ton niveau', 'Que ta stratégie est fausse'], 0, "La variance domine sur de petits échantillons."],
    ] });

    add('champions', { sections: [['Exercices corrigés', ex([
      ["Un joueur a 60 millions de gains bruts en tournois live. Peut-on dire qu'il est le plus rentable ?", "Non : les gains bruts ne déduisent ni les buy-ins, ni les parts vendues, ni les frais. Un gros volume de high rollers fait monter les gains bruts sans prouver le profit."],
      ["Quelle idée du small-baller peux-tu appliquer en NL10 ?", "Jouer plus de petits pots en position et éviter les gros pots marginaux hors de position. Pas besoin d'un niveau de lecture d'élite pour appliquer ce principe."],
      ["Quelle leçon de l'équilibré moderne appliquer à ton niveau ?", "Partir d'une stratégie solide par défaut (charts, tailles simples), puis dévier seulement face à un écart mesuré de l'adversaire."],
    ])]], quiz: [
      ["Un classement des gains bruts mesure…", ['Les gains en tournois, sans les coûts', 'Le profit net'], 0, "Buy-ins non déduits."],
      ["Ce qui se transpose le mieux à ton niveau…", ['Les principes (position, discipline, sélection)', 'Les bluffs spectaculaires'], 0, "Les principes, pas les coups d'éclat."],
    ] });

    add('champions', { sections: [['Douze profils de plus : ce que chacun t\'apprend', `<p>Chaque profil de l'onglet Champions sert à travailler une compétence précise. Ce sont des archétypes, pas des portraits de joueurs réels.</p>
      <div class="tw"><table class="t"><thead><tr><th>Profil</th><th>Ce qu'il fait</th><th>Ce qu'il t'apprend</th></tr></thead><tbody>
      <tr><td>Le joueur de flops</td><td>Voit beaucoup de flops, ne limpe pas, paie en position</td><td>Value-bet plus fin, ne pas bluffer sur une seule rue</td></tr>
      <tr><td>Le suragressif</td><td>3-bets, overbets, relances-bluffs</td><td>Payer avec les bons bluff-catchers, 4-bet pour la valeur</td></tr>
      <tr><td>Le spécialiste du tête-à-tête</td><td>Petites mises au flop, grosses ensuite, check-raises</td><td>Défendre face aux petites mises, lire une ligne sur trois rues</td></tr>
      <tr><td>Le patient piégeur</td><td>Serré, réfléchi, pièges occasionnels</td><td>Voler un joueur serré, respecter ses relances</td></tr>
      <tr><td>Le 3-betteur sans peur</td><td>Squeezes, 3-bets, tapis préflop</td><td>Ouvrir moins large devant lui, payer ses 3-bets avec les mains fortes</td></tr>
      <tr><td>Le lecteur agressif</td><td>Large, bluffs bien placés, lit vite tes habitudes</td><td>Changer de rythme, ne pas devenir prévisible</td></tr>
      <tr><td>Le joueur de position</td><td>Très large au bouton, serré en début de parole</td><td>Jouer la position, 3-better les ouvertures de bouton</td></tr>
      <tr><td>L'analyste</td><td>Tailles variées, bluffs mesurés</td><td>Jouer solide quand il n'y a pas de faille à exploiter</td></tr>
      <tr><td>L'amateur audacieux</td><td>Large, paie beaucoup, gros bluffs parfois</td><td>Value-bet gros, payer ses overbets avec les mains fortes</td></tr>
      <tr><td>Le régulier de volume</td><td>Agressif, plus large en position</td><td>Défendre face aux c-bets fréquents, 4-bet la valeur</td></tr>
      <tr><td>Le volcan</td><td>Solide, puis 12 mains en tilt après un gros pot perdu</td><td>Repérer le tilt adverse, et ne pas le reproduire</td></tr>
      <tr><td>Le théoricien serré</td><td>Serré, valeur, semi-bluffs, pièges</td><td>Penser en ranges, bluffer les boards qui ratent sa range</td></tr>
      </tbody></table></div>
      <p>Parcours conseillé dans l'onglet Champions : du profil le plus facile au plus difficile, classés selon le résultat mesuré d'un héros régulier en tête-à-tête. Un profil compte comme battu avec un résultat positif sur au moins 50 mains : c'est un repère de progression, pas une preuve (sur 50 mains, l'écart type d'un résultat dépasse 100 bb/100).</p>`]] });

    add('styles', { sections: [['Exercices corrigés', ex([
      ["En 50 mains, un adversaire affiche VPIP 40 / PFR 32 et 3-bet 15 %. Contre-stratégie ?", "Agressif large : paie plus large face à ses mises, 4-bet tes mains fortes pour la valeur, piège plutôt que bluffer. (Attention : 50 mains, ce sont des repères, pas des certitudes.)"],
      ["Un adversaire change de comportement après un gros pot perdu (plus de mains, plus de mises). Que fais-tu ?", "C'est probablement du tilt : élargis ta valeur et tes calls contre lui, réduis tes bluffs. Dans SIGMA 52, le profil « Le volcan » reproduit ce schéma."],
      ["Contre un joueur plus fort que toi, quelle stratégie ?", "Réduis ta variance face à lui : joue serré et solide, évite les gros pots marginaux, change de table si possible. La sélection de table est un choix stratégique."],
    ])]], quiz: [
      ["Contre un adversaire qui s'adapte à toi…", ['Reste proche de l\'équilibre et varie tes lignes', 'Garde un exploit fixe'], 0, "Un exploit fixe se fait contre-exploiter."],
      ["Le style qui couche beaucoup face au c-bet appelle…", ['Plus de c-bets', 'Moins de c-bets'], 0, "Il abandonne trop."],
    ] });

    add('analyste', { sections: [['Exercices corrigés', ex([
      ["Hypothèse : « je perds de l'argent en défendant ma grosse blinde ». Comment la tester ?", "Filtre tes mains de BB dans l'Analyse : résultat par main défendue, comparé aux repères. Regarde les spots perdants (défense trop large hors de position contre UTG ?), corrige un point, puis mesure à nouveau sur un nouvel échantillon."],
      ["Ton fold to 3-bet est de 70 % sur 80 occasions. Fuite certaine ?", "Probable, pas certaine : erreur type ≈ √(0,7 × 0,3 ÷ 80) ≈ 5,1 points. L'intervalle à 95 % va d'environ 60 % à 80 % : au-dessus des repères (45-60 %), donc à corriger."],
      ["Le piège de l'analyste ?", "Accumuler des analyses sans changer de jeu, ou tirer une conclusion d'un échantillon trop petit. Une hypothèse, un test, une décision."],
    ])]], quiz: [
      ["Une hypothèse se juge sur…", ['Un nouvel échantillon après correction', 'Une seule session'], 0, "Il faut mesurer avant et après."],
      ["L'outil pour chiffrer une fuite préflop dans SIGMA 52 ?", ['Analyse (import d\'historiques)', 'Studio'], 0, "L'Analyse classe tes résultats par position et action."],
    ] });

    // ---------------- Niveau 5 ----------------
    add('live_debut', { sections: [['Exercices corrigés', ex([
      ["Tu arrives au casino pour jouer en cash 1/2 €. Les étapes ?", "Pièce d'identité à l'entrée, inscription sur la liste d'attente auprès du floor, achat de la cave (maximum si ta bankroll le permet), placement par le floor, puis attendre ou poster la grosse blinde selon la règle de la salle."],
      ["La salle prend un pourcentage plafonné par pot. Pourquoi est-ce important pour ton résultat ?", "Sur des pots moyens de 30 à 60 €, quelques euros par pot représentent une part bien plus grande de tes gains qu'en ligne : il faut un écart de niveau net avec la table pour être gagnant."],
      ["Ta table est pleine de réguliers silencieux. Que peux-tu faire ?", "Demander un changement de table (« table change ») : c'est un outil normal de sélection, pas une impolitesse."],
    ])]], quiz: [
      ["Le pourboire au croupier est…", ['Un usage, pas une obligation', 'Obligatoire'], 0, "Compte-le dans ton Journal : il pèse sur le résultat."],
      ["Pour éviter les litiges, la meilleure habitude est…", ['Annoncer ses actions à voix haute', 'Jeter ses jetons dans le pot'], 0, "L'annonce verbale engage et clarifie."],
    ] });

    add('live_regles', { sections: [['Exercices corrigés', ex([
      ["Face à une mise de 40, tu poses un seul jeton de 100 sans rien dire. Qu'as-tu fait ?", "Un <strong>call</strong>. Pour relancer avec un seul gros jeton, il faut annoncer « relance » avant qu'il touche la table."],
      ["Mise de 20, relance à 60. Quel est le minimum pour relancer à nouveau ?", "La relance précédente est de 40 : il faut relancer à <strong>100</strong> minimum."],
      ["Tu annonces « je suis » puis poses par erreur des jetons pour une relance. Que compte ?", "L'annonce verbale à ton tour : « je suis » = call. Le surplus te revient."],
    ])]], quiz: [
      ["Un fold hors tour est…", ['Définitif', 'Annulable'], 0, "Il est toujours définitif."],
      ["À l'abattage, une main jetée dans les cartes mortes est…", ['Perdue', 'Récupérable si elle est meilleure'], 0, "Montre tes deux cartes avant de lâcher la main."],
    ] });

    add('live_strat', { sections: [['Exercices corrigés', ex([
      ["Deux limpers, tu es au CO avec K♠Q♠. Taille d'isolation en live ?", "Environ 5 bb + 1 par limper, soit <strong>7 bb</strong> : les joueurs live paient presque autant une grosse relance qu'une petite, tu prends plus de valeur."],
      ["Un joueur passif live, jusque-là silencieux, mise pot à la river. Tu as top paire bon kicker. Décision par défaut ?", "Couche, sauf lecture contraire : les grosses mises des passifs live sont presque toujours de la force."],
      ["Tu gagnes +10 bb/100 en live à 30 mains par heure, partie 2/5 €. Taux horaire avant rake et pourboires ?", "10 × 30 ÷ 100 = <strong>3 bb par heure</strong>, soit 15 € par heure à 2/5 €."],
    ])]], quiz: [
      ["Pot multiway live : on c-bette…", ['Seulement avec une vraie main ou un gros tirage', 'Avec toute sa range'], 0, "À plusieurs, quelqu'un a touché."],
      ["Place idéale à une table live…", ['Le joueur faible à ta droite', 'Le joueur agressif à ta droite'], 0, "Tu parles après le joueur faible."],
    ] });

    add('live_tells', { sections: [['Exercices corrigés', ex([
      ["Qu'a montré l'étude de Slepian et al. (2013) ?", "Des observateurs novices jugeaient la force des mains de pros <strong>moins bien que le hasard</strong> en regardant le visage, et <strong>mieux que le hasard</strong> en regardant les bras et le geste de mise. Regarde le geste, pas le visage."],
      ["Un joueur paie instantanément au flop. Que t'apprend ce timing ?", "Souvent une main plafonnée (paire, tirage) : avec un brelan, il aurait souvent réfléchi à relancer. C'est un indice, pas une preuve."],
      ["Ta lecture de range dit « il a la couleur », mais il semble nerveux. Tu paies ?", "Non. Un tell ajuste une décision serrée ; il ne renverse jamais une lecture de range claire."],
    ])]], quiz: [
      ["Un tell, c'est…", ['Un écart par rapport à la référence du joueur', 'Un geste isolé'], 0, "Il faut connaître sa référence."],
      ["Pour ne rien donner toi-même…", ['La même routine à chaque décision', 'Des lunettes noires suffisent'], 0, "La routine plutôt que le camouflage."],
    ] });

    add('live_table', { sections: [['Exercices corrigés', ex([
      ["Un joueur conteste le montant d'une mise. Comment réagir ?", "Calmement : « Floor, s'il vous plaît ». Le floor décide ; ne règle pas le litige avec le joueur."],
      ["Tu remarques deux joueurs qui semblent se faire des signes. Que fais-tu ?", "Tu le signales discrètement au floor. La collusion est sanctionnée, mais ce n'est pas à toi d'accuser à la table."],
      ["Tu gagnes 800 € dans la soirée. Une précaution ?", "Change tes jetons à la caisse, ne compte pas ton argent à la table, et quitte la salle sans afficher tes gains."],
    ])]], quiz: [
      ["Ton image à la table sert à…", ['Ajuster tes bluffs et ta valeur', 'Rien'], 0, "Une image serrée rend tes bluffs crédibles."],
      ["Un litige se règle par…", ['Le floor', 'Un vote de la table'], 0, "La décision appartient au floor."],
    ] });

    add('live_mtt', { sections: [['Exercices corrigés', ex([
      ["Tournoi live : niveaux de 40 minutes, 30 mains par heure. Combien de mains par niveau ?", "40 ÷ 60 × 30 = <strong>20 mains</strong> environ : un niveau passe vite, chaque vol de blindes compte."],
      ["ROI de +20 % sur des tournois à 300 € avec 150 € de frais de déplacement par tournoi. Résultat réel ?", "Gain moyen : 60 € par tournoi ; coût réel : 450 €. ROI réel = 60 − 150 = −90 € sur 450, soit environ <strong>−20 %</strong>. Les frais changent tout."],
      ["Festival : combien de buy-ins prévoir pour une catégorie à 200 € ?", "50 à 100 buy-ins (10 000 à 20 000 €), davantage pour les gros champs. Sinon, joue des satellites ou une catégorie inférieure."],
    ])]], quiz: [
      ["Une réentrée compte dans ton ROI…", ['Comme un nouveau buy-in', 'Pas du tout'], 0, "Chaque réentrée est un coût."],
      ["L'ante de grosse blinde…", ['Augmente le pot et pousse à voler plus large', 'Ne change rien'], 0, "Plus d'argent mort au milieu."],
    ] });

    add('eclair', { sections: [['Exercices corrigés', ex([
      ["Il mise 1/3 du pot, tu as un tirage couleur au flop (deux cartes à venir). Tu paies ?", "Équité requise : 20 %. Tirage couleur : environ 35 % sur deux cartes (9 × 4 ≈ 36 %). Tu paies largement, et un semi-bluff est possible."],
      ["Turn, il mise le pot. Tu as une suite par les deux bouts (8 outs). Tu paies ?", "Équité requise : 33,3 %. Tu as environ 17 % (8 × 2). Couche, sauf cotes implicites énormes."],
      ["Préflop, tu as 12 bb au bouton, tout le monde se couche. La séquence dit ?", "Sous 15 bb : tapis ou couché. Consulte ta chart de push (Outils › Push/Fold)."],
    ])]], quiz: [
      ["Équité requise face à une mise de la moitié du pot ?", ['25 %', '33 %'], 0, "0,5 ÷ (1 + 2 × 0,5)."],
      ["Ventrale au turn, une carte à venir : environ…", ['8,5 %', '17 %'], 0, "4 outs × 2."],
    ] });

    add('home', { sections: [['Exercices corrigés', ex([
      ["Six joueurs, 3 heures de partie. Quelle structure ?", "Tapis de 100 à 200 bb (ex. 10 000 jetons, blindes 25/50), niveaux de 15 à 20 minutes. L'outil Préparer la partie calcule la structure et la répartition des jetons."],
      ["Personne ne se couche à ta table d'amis. Ta stratégie ?", "Zéro bluff, valeur grosse sur trois rues avec tes bonnes mains, isole les limpers en relançant plus gros (4 bb + 1 par limper)."],
      ["Un ami débutant ralentit la partie. Comment le gérer ?", "Explique-lui les règles et l'ordre de parole avant la partie, sans commenter ses erreurs pendant. L'ambiance compte : une partie entre amis doit rester un plaisir."],
    ])]], quiz: [
      ["Une partie entre amis sans argent…", ['Ne pose pas de problème légal', 'Est interdite'], 0, "C'est l'argent en jeu qui change le cadre."],
      ["Utiliser la Table live à une partie entre amis…", ['Seulement en le disant et avec l\'accord de tous', 'En cachette'], 0, "C'est la règle de fair-play de SIGMA 52."],
    ] });

    // ---------------- Niveau 6 ----------------
    add('marche', { sections: [['Exercices corrigés', ex([
      ["Selon l'ANJ, combien pèse le cash game dans le produit brut du poker en ligne en 2025 ?", "Environ <strong>100 M€ sur 525 M€</strong>, soit 19 %, contre 27 % en 2020 : un format en recul."],
      ["Plus de comptes, dépense moyenne en baisse : qu'en déduire pour toi ?", "Des récréatifs plus nombreux mais à petit budget, attirés surtout par les formats rapides (Sit&Go, tournois). Les parties faibles se trouvent plutôt en Sit&Go et à petites limites."],
      ["Comment choisir une room ?", "Trois critères : le nombre de récréatifs à ta limite et dans ton format, le coût réel (rake moins fidélité), les règles logicielles (outils autorisés)."],
    ])]], quiz: [
      ["Le produit brut des jeux, c'est…", ['Mises moins gains reversés (surtout rake et frais)', 'Le total des mises'], 0, "Ce que les opérateurs gardent."],
      ["La liquidité partagée depuis 2018 se fait avec…", ['L\'Espagne (et le Portugal pour PokerStars)', 'L\'Allemagne'], 0, "D'après le module."],
    ] });

    add('economie', { sections: [['Exercices corrigés', ex([
      ["Winrate +4 bb/100, 300 mains par heure, NL50. Taux horaire ?", "4 × 300 ÷ 100 × 0,50 € = <strong>6 € par heure</strong>, avant fidélité."],
      ["Tu gagnes 4 bb/100 et paies 10 bb/100 de rake. De combien bats-tu tes adversaires ?", "<strong>14 bb/100</strong> : le rake prend plus que toi. Compare les rooms sur le coût net (rake moins fidélité)."],
      ["À 4 tables, ton winrate est de 5 bb/100 (300 mains/h) ; à 8 tables, 2 bb/100 (550 mains/h). Lequel est meilleur ?", "4 tables : 5 × 300 = 1 500 ; 8 tables : 2 × 550 = 1 100 (en bb/100 × mains). Reste à 4 tables."],
    ])]], quiz: [
      ["Pour qu'un winrate de 4 bb/100 soit distinct de zéro (écart-type 90) il faut environ…", ['195 000 mains', '20 000 mains'], 0, "D'après le module."],
      ["Le rakeback, c'est…", ['La part du rake rendue par la fidélité', 'Un bonus de dépôt'], 0, "Une part importante du revenu des gros volumes."],
    ] });

    add('carriere', { sections: [['Exercices corrigés', ex([
      ["Tes dépenses sont de 2 000 € par mois. Quel fonds de vie séparé avant de passer pro ?", "6 à 12 mois : <strong>12 000 à 24 000 €</strong>, en plus de la bankroll de jeu. Un downswing ne doit jamais t'obliger à retirer de la bankroll."],
      ["Pourquoi la voie semi-pro est-elle la plus solide ?", "Un autre revenu supprime la pression de payer un loyer avec le poker, qui dégrade les décisions. Tu progresses avec 10 à 20 heures par semaine sans risque vital."],
      ["Quels revenus annexes un pro combine-t-il souvent ?", "Gains de jeu, fidélité de la room, staking, coaching, contenu. La part du jeu pur est souvent plus faible qu'on l'imagine."],
    ])]], quiz: [
      ["Bankroll d'un pro en cash, d'après le module…", ['50 à 100 caves', '10 caves'], 0, "Plus large que pour un amateur."],
      ["Avant de passer pro, une routine à temps plein « à blanc » pendant…", ['Au moins trois mois', 'Une semaine'], 0, "En gardant un autre revenu."],
    ] });

    add('staking', { sections: [['Exercices corrigés', ex([
      ["Un joueur vend son action à 1,1. Son ROI attendu est de 15 %. L'achat est-il rentable ?", "Pour 110 € payés, l'acheteur récupère en moyenne 115 € : <strong>+5 €, soit ≈ +4,5 %</strong>. Rentable, mais seulement si le ROI de 15 % est vérifié sur un long historique."],
      ["Makeup de 10 000 €, accord à 50/50. Le joueur gagne 25 000 €. Qui touche quoi ?", "Les 10 000 premiers remboursent le makeup au backer. Il reste 15 000 € partagés : 7 500 € chacun. Total backer : 17 500 €, joueur : 7 500 €."],
      ["Quels points doit contenir un contrat de staking ?", "Périmètre, pourcentage et markup avec un exemple chiffré, règle du makeup en fin de période, conditions de sortie, rythme de reporting et de paiement, jeu hors accord. Tout par écrit."],
    ])]], quiz: [
      ["À un markup de 1,3, l'acheteur gagne si le ROI du joueur dépasse…", ['30 %', '13 %'], 0, "Il paie 130 pour 100 d'action."],
      ["Un joueur très en makeup…", ['Risque de perdre sa motivation', 'Joue toujours mieux'], 0, "Première source de conflits."],
    ] });

    add('business', { sections: [['Exercices corrigés', ex([
      ["Tu veux vendre du coaching. Comment le présenter honnêtement ?", "Sur la progression mesurable de l'élève (fuites corrigées, taux de réussite aux exercices), avec tes résultats vérifiables. Jamais sur une promesse de gains."],
      ["Tu streams tes sessions en ligne. Quelle précaution ?", "Un délai de diffusion : sans délai, tu exposes tes cartes et ta stratégie aux joueurs de la table."],
      ["Une room te propose de la promouvoir sur un réseau social. Que faut-il vérifier ?", "Que la plateforme permet d'exclure les mineurs et que l'exclusion est activée, que la mention d'interdiction aux moins de 18 ans est visible pendant toute la promotion, que la room est agréée, et que le contrat prévoit ces règles."],
    ])]], quiz: [
      ["La publicité pour un site non agréé est…", ['Interdite', 'Autorisée avec mention'], 0, "D'après le module."],
      ["Les rooms recrutent leurs ambassadeurs surtout pour…", ['Leur visibilité et leur image', 'Leur seul niveau de jeu'], 0, "Audience et régularité comptent."],
    ] });

    add('fiscal', { sections: [['Exercices corrigés', ex([
      ["Recettes 2026 de 20 000 € en micro-BNC. Montant imposable ?", "Abattement forfaitaire de 34 % : 20 000 × 0,66 = <strong>13 200 €</strong>, avant cotisations sociales. Valide avec un expert-comptable."],
      ["Tes frais réels (formation, logiciels, déplacements) font 45 % de tes recettes. Quel régime étudier ?", "La déclaration contrôlée (formulaire 2035), qui déduit les frais réels : elle devient intéressante quand les frais dépassent l'abattement de 34 %."],
      ["Quelles preuves garder dès le premier euro ?", "Historique des dépôts et retraits de chaque room, journal des sessions, factures de formation, logiciels et déplacements. La preuve des pertes compte autant que celle des gains."],
    ])]], quiz: [
      ["Seuil micro-BNC pour les recettes 2026, d'après le module ?", ['83 600 €', '30 000 €'], 0, "Il était de 77 700 € pour 2023 à 2025."],
      ["Les gains d'un joueur occasionnel sont…", ['En principe non imposables', 'Toujours imposables'], 0, "La pratique habituelle change la situation."],
    ] });

    add('integrite', { sections: [['Exercices corrigés', ex([
      ["Un ami te propose de vous signaler vos cartes par message quand vous êtes à la même table. Que réponds-tu ?", "Non : c'est de la collusion, sanctionnée par la fermeture des comptes et souvent la confiscation des soldes. Les rooms analysent ces schémas."],
      ["Tu soupçonnes un bot à ta table (temps de réaction identiques, 24 h sur 24). Que fais-tu ?", "Tu le signales au support avec les numéros de mains. Ne l'accuse pas dans le chat."],
      ["Ton compte a été piraté. Quelles protections auraient aidé ?", "Double authentification, mot de passe unique, aucun partage de compte. Préviens immédiatement le support."],
    ])]], quiz: [
      ["Le chip dumping, c'est…", ['Perdre volontairement des jetons à un complice', 'Jouer très serré'], 0, "Une forme de triche."],
      ["Ouvrir un solveur entre deux mains, tables ouvertes…", ['Est interdit', 'Est autorisé'], 0, "C'est de l'aide en temps réel."],
    ] });

    add('longevite', { sections: [['Exercices corrigés', ex([
      ["Écris une semaine type soutenable pour un semi-pro.", "Horaires fixes, 4 sessions de 2 à 3 heures, une pause toutes les 60 à 90 minutes, 2 séances d'étude, au moins un jour sans jeu, activité physique régulière."],
      ["Tu joues pour fuir une difficulté personnelle. Signal ?", "Oui, c'est un signal d'alerte : stop, et parles-en. Joueurs Info Service : 09 74 75 13 13 ; l'auto-exclusion ANJ couvre toutes les rooms."],
      ["Comment préparer une sortie du poker ?", "Documenter tes compétences (décision sous incertitude, probabilités, gestion du risque, discipline) avec tes méthodes, résultats et contenus, pour qu'elles comptent dans une autre activité."],
    ])]], quiz: [
      ["Mentir sur ses résultats ou son temps de jeu est…", ['Un signal d\'alerte', 'Sans importance'], 0, "D'après le module."],
      ["La fatigue coûte des bb/100…", ['Avant d\'être ressentie', 'Seulement quand on la sent'], 0, "D'où les horaires fixes."],
    ] });

    add('progression', { sections: [['Exercices corrigés', ex([
      ["Tu es à l'étape 2 avec un winrate positif sur 12 000 mains. Peux-tu passer à l'étape 3 ?", "Pas encore : le critère est un winrate positif sur <strong>30 000 mains</strong> et une bankroll suffisante pour NL10."],
      ["Quel indicateur montre ta progression le plus tôt ?", "La qualité des décisions (Spots, fuites préflop, revues), mesurée chaque semaine. L'argent se juge sur de grands échantillons."],
      ["Étape 4 (semi-pro) : quel critère ?", "Un winrate prouvé statistiquement à une limite qui couvre tes dépenses."],
    ])]], quiz: [
      ["Critère de l'étape 1 dans les Spots ?", ['90 % en Ouverture, Cotes et Tapis ou couché', '50 % partout'], 0, "D'après le tableau du module."],
      ["L'argent se mesure…", ['Sur de grands échantillons', 'Chaque semaine'], 0, "La variance domine à court terme."],
    ] });

    add('salaire', { sections: [['Exercices corrigés', ex([
      ["Objectif : 2 000 € par mois en 120 heures. Quel taux horaire, et quelle limite à +4 bb/100 et 300 mains par heure ?", "2 000 ÷ 120 ≈ <strong>16,7 € par heure</strong>. À NL100 : 12 €/h ; à NL200 : 24 €/h. Il faut donc battre NL200 (ou NL100 avec la fidélité), avant impôts et cotisations."],
      ["À NL200, sur un mois de 36 000 mains (écart-type 90 bb/100), quel écart-type du résultat ?", "90 × √360 ≈ <strong>1 707 bb</strong>, soit environ 3 400 € : plus que l'espérance (2 880 €). Un mois négatif arrive environ une fois sur cinq."],
      ["Quelles conditions avant de quitter ton emploi ?", "100 000 mains au moins avec une borne basse d'intervalle positive, bankroll de 50 à 100 caves, réserve de 6 à 12 mois, six mois de semi-pro tenus, statut fiscal clarifié, plan B écrit."],
    ])]], quiz: [
      ["Revenu par heure = …", ['winrate × mains par heure ÷ 100 × valeur de la bb', 'winrate × nombre de tables'], 0, "La formule du module."],
      ["Ce qu'on oublie souvent…", ['Retraite, congés et couverture santé à organiser', 'Le rake'], 0, "Pas de protections automatiques."],
    ] });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
