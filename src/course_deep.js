// Cours — approfondissement : exercices corrigés et exemples commentés pour les modules clés.
// Tous les chiffres d'équité viennent du moteur SIGMA 52 (Monte-Carlo, ± 0,5 point) ou d'un calcul exact indiqué.
(function (root) {
  // Exercice : question, puis réponse dépliable (se lit après avoir répondu de tête).
  const ex = (items) => items.map(([q, a], i) => `<details class="exo"><summary><strong>Exercice ${i + 1}.</strong> ${q}</summary><p>${a}</p></details>`).join('');
  function register(K) {
    const add = (id, x) => { if (K.MODULES.some((m) => m.id === id)) K.extend(id, x); };

    add('positions', { sections: [['Exercices corrigés', ex([
      ['Table à 6, tout le monde se couche jusqu\'à toi. Tu as K♠J♦ en UTG. Que fais-tu ?', 'Tu te couches. KJo n\'est pas dans la range d\'ouverture UTG (environ 16 % des mains) : avec 5 joueurs derrière, il est souvent dominé par AJ, KQ, AK. Il entre dans la range dès le HJ.'],
      ['Même main, K♠J♦, au bouton. Et Q♥T♦ au HJ ?', 'KJo s\'ouvre au bouton sans hésiter (la range du bouton fait environ 44 %). QTo au HJ : couche ; il ne s\'ouvre qu\'à partir du CO.'],
      ['Pourquoi ouvrir 2♣2♦ en UTG mais pas A♠9♦ ?', 'Une petite paire fait un brelan une fois sur 8,5 au flop et gagne de gros pots ; A9o fait souvent une paire d\'as dominée par AJ, AQ, AK qui paient ta relance. Au CO et au bouton, avec moins de joueurs derrière, A9o devient rentable.'],
    ])]], quiz: [
      ['Tu as A9o au CO, personne n\'a ouvert. Défaut ?', ['Relancer', 'Coucher'], 0, 'A9o fait partie de la range d\'ouverture du CO.'],
      ['Pourquoi la même main vaut plus au bouton ?', ['Tu parles en dernier après le flop sur tout le reste de la main', 'Le bouton reçoit de meilleures cartes'], 0, 'La position donne l\'information et le contrôle de la taille du pot.'],
    ] });

    add('maths', { sections: [['Exercices corrigés', ex([
      ['Le pot fait 100, l\'adversaire mise 50. Quelle équité te faut-il pour payer ?', 'Tu paies 50 pour un pot final de 200 : 50 ÷ 200 = <strong>25 %</strong>.'],
      ['Turn, tu as un tirage couleur seul (9 outs), il mise 50 dans 100. Tu paies ?', 'Il reste 46 cartes : 9 ÷ 46 = 19,6 %, sous les 25 % requis. Sans cotes implicites, tu te couches. Pour que le call devienne rentable, il faudrait gagner en moyenne environ 55 de plus à la river quand tu touches : 0,196 × (150 + X) = 0,804 × 50, soit X ≈ 55.'],
      ['Flop T♥7♥2♣, tu as 9♥8♥ (couleur + suite par les deux bouts) contre A♠T♦. Qui est devant ?', 'Toi : environ <strong>57 %</strong> contre 43 % (moteur SIGMA 52). Avec 15 outs et deux cartes à venir, un gros tirage est favori contre une top paire : tu peux relancer ou mettre tapis.'],
      ['Ventrale au turn (4 outs), il mise un tiers du pot. Tu paies ?', 'Il te faut 20 % ; tu as 4 ÷ 46 ≈ 8,7 %. Couche, sauf cotes implicites énormes.'],
    ])]], quiz: [
      ['Il mise le pot. Équité requise ?', ['25 %', '33 %', '50 %'], 1, 'Mise ÷ (pot + 2 × mise) = 1 ÷ 3.'],
      ['Tirage couleur au turn, une seule carte à venir. Probabilité de toucher ?', ['≈ 19,6 %', '≈ 35 %'], 0, '9 ÷ 46.'],
    ] });

    add('postflop', { sections: [['Exercices corrigés', ex([
      ['Tu ouvres au bouton, la grosse blinde paie. Flop K♦8♠3♣, elle checke. Tu as K♥J♥. Que fais-tu ?', 'Tu mises pour la valeur. Contre une range de défense typique de BB, K♥J♥ a environ <strong>85 %</strong> d\'équité sur ce board (moteur SIGMA 52) ; les deux paires, paires moyennes et as hauteur paient une petite mise. Taille : un tiers du pot, sur un board sec qui favorise ta range.'],
      ['Même situation, flop 8♥7♥6♣ et tu as A♠K♣. Mises-tu ?', 'Plutôt check. Ce board touche la range de la grosse blinde (connecteurs, petites paires, deux paires) bien plus que la tienne ; AK n\'a que deux overcards. Le Rapport agrégé du Solveur montre que le bouton checke beaucoup plus sur les boards bas et connectés que sur les boards hauts et secs.'],
      ['Flop 9♣8♦2♥, tu as J♣T♣ et l\'adversaire a mis une grosse mise. Tu sais qu\'il a souvent une overpair comme Q♠Q♥. Ton équité ?', 'Environ <strong>27 %</strong> (moteur SIGMA 52) : 6 outs propres pour la suite (les 7 et deux dames), plus la couleur par la porte de derrière. Face à une mise de 75 % du pot (30 % requis), c\'est juste en dessous : le call se justifie par les cotes implicites si les tapis sont profonds.'],
    ])]], quiz: [
      ['Board 8-7-6 deux couleurs, tu as AK après avoir relancé préflop. Défaut ?', ['C-bet gros', 'Check plus souvent'], 1, 'Le board favorise la range de l\'adversaire.'],
      ['Board K-8-3 sec, tu as top paire bon kicker. Taille de c-bet ?', ['Petite (un tiers du pot)', 'Overbet'], 0, 'Board sec qui favorise ta range : une petite mise suffit et se fait payer par beaucoup de mains.'],
    ] });

    add('multiway', { sections: [['Exemples commentés', `<p><strong>Top paire, faible kicker, à trois.</strong> Board K♦7♠2♥, tu as K♣4♥ contre deux joueurs qui ont payé avant le flop (ranges de call typiques). Ton équité tombe à environ <strong>63 %</strong> à trois, contre environ 80 % en tête-à-tête (moteur SIGMA 52). Avec A♠K♣ sur le même board, tu restes à 78 % à trois. Conclusion : la top paire faible kicker se joue pour un petit pot à plusieurs ; la top paire bon kicker peut miser pour la valeur.</p>
      <p><strong>Pot 3-bet.</strong> Tu 3-bettes au bouton à 9 bb, le CO paie : pot ≈ 19,5 bb, tapis restants ≈ 91 bb, SPR ≈ 4,7. Avec une overpair, tu es prêt à mettre tapis sur la plupart des boards : un SPR sous 5 engage les mains fortes.</p>`], ['Exercices corrigés', ex([
      ['Pot à 4 joueurs, tu as un tirage couleur max (as assorti). Le premier mise, deux paient. Tu paies ?', 'Oui, presque toujours : à plusieurs, ton tirage aux nuts sera payé par plusieurs joueurs quand il touche, et la cote directe est excellente (le pot a grossi avant ton call).'],
      ['Tu as top paire faible kicker à 4 joueurs ; le flop est checké jusqu\'à toi. Mise ou check ?', 'Check le plus souvent, ou petite mise pour protéger contre les tirages. À 4, au moins un joueur a souvent mieux ou un tirage fort.'],
      ['Pot de 12 bb au flop à quatre. Le premier mise 6 bb, le suivant paie, à toi. Quelle équité te faut-il pour payer ?', 'Pot final si tu paies : 12 + 6 + 6 + 6 = 30 bb, pour un call de 6 : <strong>6 ÷ 30 = 20 %</strong>, contre 25 % en tête-à-tête (6 ÷ 24). Chaque call devant toi améliore ta cote : c\'est pour cela que les tirages aux nuts se paient à plusieurs.'],
    ])]], quiz: [
      ['À trois joueurs, la valeur d\'une top paire faible kicker…', ['Augmente', 'Baisse nettement'], 1, 'Plus d\'adversaires = plus de chances que quelqu\'un ait mieux.'],
      ['SPR d\'environ 4 en pot 3-bet avec une overpair : plan par défaut ?', ['Contrôler le pot', 'Être prêt à mettre tapis'], 1, 'Sous 5 de SPR, une overpair s\'engage sur la plupart des boards.'],
    ] });

    add('adversaires', { sections: [['Exemples commentés', `<table class="t"><thead><tr><th>Stats (VPIP / PFR, 100 mains)</th><th>Lecture</th><th>Ajustement</th></tr></thead><tbody>
      <tr><td>45 / 8</td><td>Joue beaucoup, relance peu : fish passif</td><td>Valeur grosse, pas de bluff, isole-le en position</td></tr>
      <tr><td>22 / 19</td><td>Régulier solide</td><td>Joue ta stratégie de base, évite les pots marginaux hors position</td></tr>
      <tr><td>12 / 10</td><td>Nit</td><td>Vole ses blindes, couche face à ses grosses mises</td></tr>
      <tr><td>38 / 30</td><td>Très agressif</td><td>Élargis tes calls avec des mains moyennes, piège avec tes mains fortes</td></tr></tbody></table>
      <p>Sur 100 mains, l'erreur sur un VPIP de 25 % reste d'environ ± 8 points : confirme ta lecture avec les lignes (qui relance, qui paie tout, quelles mains arrivent à l'abattage).</p>`], ['Exercices corrigés', ex([
      ['Un joueur montre 7♣2♦ après avoir payé une relance et deux mises. Que notes-tu ?', 'Joueur très large qui paie trop : il entre dans la catégorie fish. Ajustement : plus de valeur, plus grosse, et aucun bluff contre lui.'],
      ['Un joueur à 12/10 relance la river après avoir payé le flop et le turn. Tu as top paire. Couche ou paie ?', 'Couche. Chez un nit, une relance river est très forte : deux paires, brelan ou mieux.'],
      ['Après 40 mains, un joueur affiche 15 % de 3-bet. Tu l\'étiquettes « agressif » ?', 'Pas encore. Sur 40 mains, il n\'a eu qu\'une dizaine d\'occasions de 3-better : 15 % correspond à un ou deux 3-bets, ce qui peut arriver à un joueur serré qui a reçu QQ et AK. Une stat de 3-bet demande plusieurs centaines de mains ; d\'ici là, fie-toi aux mains montrées et aux lignes.'],
    ])]], quiz: [
      ['VPIP 45, PFR 8 sur 200 mains. Profil le plus probable ?', ['Nit', 'Fish passif'], 1, 'Il joue presque une main sur deux et relance très peu.'],
      ['Contre un joueur 38/30, avec une main moyenne face à une mise…', ['Paie plus souvent', 'Couche systématiquement'], 0, 'Sa range de mise contient beaucoup de bluffs.'],
    ] });

    add('bankroll', { sections: [['Exemples commentés', `<p><strong>Les downswings arrivent aussi aux gagnants.</strong> Simulation SIGMA 52 : un joueur gagnant à +5 bb/100 avec un écart-type de 90 bb/100 qui joue 100 000 mains traverse, à un moment ou un autre, une baisse d'au moins <strong>20 caves</strong> dans environ 44 % des cas, et d'au moins <strong>30 caves</strong> dans environ 12 % des cas (4 000 trajectoires simulées). C'est la raison des 40 caves minimum.</p>
      <p><strong>Exemple</strong> : à NL10 (cave de 10 €), 40 caves = 400 €. Une baisse de 20 caves (200 €) laisse 200 € : tu redescends à NL5 jusqu'à revenir au-dessus de 40 caves de NL10.</p>`], ['Exercices corrigés', ex([
      ['Tu as 600 €. Quelle limite maximale avec la règle des 40 caves ?', 'NL10 (40 × 10 € = 400 €). NL25 demanderait 1 000 €.'],
      ['Tu viens de perdre 15 caves à NL10 en une semaine en appliquant tes règles. Que conclure ?', 'Rien sur ton niveau : c\'est dans la variance normale d\'un gagnant. Vérifie tes décisions (revues, spots), respecte tes règles de descente si la bankroll passe sous le seuil.'],
      ['Tu as 1 100 € et tu joues NL25 (40 caves = 1 000 €). Tu perds 250 €. Que fais-tu ?', 'Il te reste 850 €, sous les 1 000 € exigés : tu <strong>redescends à NL10</strong> (850 € = 85 caves de NL10) et tu remontes quand la bankroll repasse au-dessus de 1 000 €. Redescendre n\'est pas un échec : c\'est ce qui rend la ruine presque impossible.'],
    ])]], quiz: [
      ['Un gagnant à +5 bb/100 peut-il perdre 20 caves d\'affilée ?', ['Non, c\'est la preuve qu\'il perd', 'Oui, c\'est fréquent sur 100 000 mains'], 1, 'Environ une chance sur deux sur 100 000 mains dans la simulation.'],
      ['Bankroll de 1 000 €, règle des 40 caves. Limite maximale ?', ['NL25', 'NL50'], 0, '40 × 25 € = 1 000 €.'],
    ] });

    add('preflop2', { sections: [['Exercices corrigés', ex([
      ['Le CO ouvre à 2,5 bb, tu es au bouton avec T♠T♦. 3-bet ou call ?', 'Les deux se défendent ; la chart SIGMA 52 face au CO met TT dans les calls au bouton (le 3-bet valeur commence à JJ). Ton équité contre une range d\'ouverture du CO est d\'environ <strong>65 %</strong> (moteur) : tu es largement devant, mais un 3-bet ferait coucher les mains que tu domines et payer celles qui te dominent.'],
      ['Le CO ouvre à 2,5 bb, le bouton paie, tu es en grosse blinde avec A♠Q♠. Que fais-tu et à combien ?', 'Squeeze pour la valeur : environ 4 × 2,5 + 2,5 = 12,5 bb (4 fois hors de position, plus une ouverture par caller). Tu prends l\'initiative avec une main qui domine leurs ranges de call.'],
      ['Ton ouverture UTG se fait 3-better par le bouton. Tu as A♥Q♦. Défaut ?', 'Souvent couche contre un 3-bet d\'un joueur serré ; call possible contre un joueur agressif. S\'il ne 3-bette qu\'avec QQ+ et AK, même A-K n\'a qu\'environ 39 % contre sa range (moteur SIGMA 52) ; A-Q fait encore moins, hors de position.'],
    ])]], quiz: [
      ['CO ouvre 2,5 bb, bouton paie, tu es BB avec AQs. Taille de squeeze ?', ['≈ 7 bb', '≈ 12,5 bb'], 1, '4 × 2,5 + 2,5 par caller.'],
      ['Face à un 3-bet d\'un nit, AQo hors de position…', ['Se couche le plus souvent', 'Se 4-bette'], 0, 'Sa range de 3-bet domine AQ.'],
    ] });

    add('lecture', { sections: [['Exercices corrigés', ex([
      ['River, il mise le pot. Tu comptes 12 combos de valeur et 6 de bluff dans sa range. Tu paies avec un bluff-catcher ?', 'Il te faut 33 %. Ses bluffs font 6 ÷ 18 = 33 % : le call est indifférent. Avec 4 combos de bluff seulement (25 %), couche ; avec 8 (40 %), paie.'],
      ['Combien de combos de K-Q reste-t-il s\'il y a un roi au board et que tu tiens une dame ?', 'Rois restants : 3 ; dames restantes : 3. Il reste 3 × 3 = <strong>9 combos de K-Q</strong> (assortis compris), au lieu de 16 sans carte retirée. Tes cartes et le board retirent des combos : c\'est l\'effet de blocage.'],
      ['Un régulier a payé ton ouverture au bouton sans 3-better. Sa range contient-elle beaucoup de A-A et de K-K ?', 'Très peu : la plupart des réguliers 3-bettent ces mains. Sa range de call est <strong>plafonnée</strong> (pas ou peu de mains premium). Retire ces combos de ta lecture dès le préflop : sur un board bas, ses mains les plus fortes sont surtout des brelans et des deux paires, pas des overpairs.'],
    ])]], quiz: [
      ['Mise du pot à la river, 10 combos de valeur et 2 de bluff. Avec un bluff-catcher…', ['Paie', 'Couche'], 1, '2 ÷ 12 ≈ 17 % de bluffs, il en faut 33 %.'],
    ] });

    add('sizing', { sections: [['Exercices corrigés', ex([
      ['Pot de 20 au turn, tapis effectif 50. Quelle taille pour être à tapis en deux mises égales (turn et river) ?', 'Mise géométrique : f = (√(1 + 2 × 50 ÷ 20) − 1) ÷ 2 = (√6 − 1) ÷ 2 ≈ <strong>72 % du pot</strong>. Turn : 14,5 dans 20 ; river : 35,5 dans 49 ; total 50. L\'outil Calculs le fait pour toi.'],
      ['Pourquoi miser petit (25 à 33 %) sur un board sec qui favorise ta range ?', 'Ta range entière a l\'avantage : une petite mise fait déjà payer ou coucher les mains faibles adverses et coûte peu quand tu es battu. Les grosses mises servent quand ta range est polarisée (très fort ou bluff).'],
      ['Pot de 10 bb à la river, tu as les nuts. Il paie 60 % du temps une mise de moitié du pot, 35 % du temps une mise du pot. Quelle taille ?', 'Gain moyen : moitié du pot, 0,60 × 5 = 3 bb ; pot, 0,35 × 10 = <strong>3,5 bb</strong>. La grosse mise rapporte plus, même payée moins souvent. Compare toujours fréquence de call × taille, pas la fréquence seule.'],
    ])]], quiz: [
      ['Pot 20, tapis 50, deux rues. Taille géométrique ?', ['≈ 50 %', '≈ 72 %', '≈ 100 %'], 1, '(√6 − 1) ÷ 2 ≈ 0,72.'],
    ] });

    add('icm', { sections: [['Exemples commentés', `<p><strong>La bulle en chiffres.</strong> 4 joueurs, 3 payés (50 / 30 / 20 %). Tapis : toi 1 000, un adversaire 1 000, le chip leader 3 000, un petit tapis 300. Le chip leader te met tapis ; tu es en grosse blinde (blindes 50/100, la petite blinde s'est couchée) avec A♠J♦. En jetons, il te faudrait 44 % d'équité (900 à payer pour un pot de 2 050) ; avec l'ICM, il en faut environ <strong>72 %</strong> (facteur de bulle ≈ 2,6, calcul SIGMA 52 de Malmuth-Harville). Contre une range de tapis normale, A-J n'a qu'environ 62 % : <strong>couche</strong>, alors que c'est un call évident en cash game.</p>
      <p>La raison : perdre t'élimine avant le petit tapis qui est presque mort, gagner ne double pas ta part du prize pool.</p>`], ['Exercices corrigés', ex([
      ['Tu es le chip leader à la bulle. Qui attaquer en priorité ?', 'Les tapis moyens : ils risquent le plus (le petit tapis va probablement sauter) et doivent se coucher souvent. Évite de mettre tapis sur le petit tapis avec des mains faibles quand un call ne lui coûte rien.'],
      ['Même main, A♠J♦, mais une seule place payée (le gagnant prend tout). ICM ou jetons ?', 'Jetons : avec une seule place payée, l\'ICM retombe exactement sur l\'équilibre en jetons. Le call redevient rentable avec 62 % contre 44 % requis.'],
      ['Trois joueurs, tapis 5 000, 3 000 et 2 000, prix 50 / 30 / 20 %. Le chip leader a 50 % des jetons : vaut-il 50 % du prize pool ?', 'Non. ICM (Malmuth-Harville, calcul SIGMA 52) : <strong>38,4 %</strong> pour le chip leader, 32,8 % pour le moyen tapis, 28,9 % pour le petit. Les jetons du gros tapis valent moins chacun, ceux du petit tapis plus : c\'est ce qui rend les gros tapis agressifs et les moyens prudents.'],
    ])]], quiz: [
      ['À la bulle, le facteur de bulle fait que…', ['Il faut plus d\'équité pour payer un tapis', 'Il faut moins d\'équité'], 0, 'Perdre coûte plus que gagner ne rapporte.'],
      ['Une seule place payée : l\'ICM…', ['Retombe sur le calcul en jetons', 'Exige encore plus d\'équité'], 0, 'Avec un seul prix, la valeur des jetons est linéaire.'],
    ] });

    add('mental', { sections: [['Exemple commenté', `<p><strong>Une session qui dérape.</strong> 21 h : tu perds un gros pot sur un tirage adverse au river (bad beat). 21 h 10 : tu paies une relance au turn avec une paire moyenne « pour voir s'il bluffe encore ». 21 h 25 : tu ouvres 9♦5♦ au HJ, hors de ta chart. À ce moment, trois signaux sont réunis : une perte ressentie comme injuste, un call contre ta lecture, une ouverture hors range. Ta règle s'applique : pause de 10 minutes, relecture de ton script, et fin de session si un nouveau signal arrive. Le lendemain, à froid, tu analyses le bad beat (décision correcte ?) et la relance payée (erreur de lecture causée par la frustration).</p>`], ['Exercices corrigés', ex([
      ['Après un gain de 5 caves, tu commences à jouer des mains hors range « parce que tu es en forme ». Quel tilt ?', 'L\'euphorie : tu crois que la chance est une compétence du moment. Même règle que pour le tilt de perte : retour à la chart, ou fin de session.'],
      ['Écris ta règle d\'arrêt la plus utile pour toi.', 'Exemple : « 3 caves perdues, ou 2 décisions émotionnelles repérées, ou 2 heures de jeu : j\'arrête ». La bonne règle est celle que tu appliques sans négocier ; écris-la dans le Journal.'],
      ['Tu es en gain de 4 caves après 1 h 50, mais tu sens la fatigue (lectures moins nettes, réponses plus lentes). Tu continues « tant que ça tourne » ?', 'Non. Le gain ne dit rien de la qualité de tes prochaines décisions ; la fatigue, si. Applique ta règle d\'arrêt (durée ou signaux), note la session et arrête : finir sur une bonne décision vaut mieux que rendre les gains en jouant fatigué.'],
    ])]], quiz: [
      ['Trois signaux de tilt en 25 minutes. Règle ?', ['Continuer en se concentrant', 'Pause, puis fin de session au signal suivant'], 1, 'Les règles écrites s\'appliquent sans négociation.'],
    ] });

    add('mtt', { sections: [['Exercices corrigés', ex([
      ['Tu as 25 bb au milieu d\'un tournoi, le bouton ouvre souvent. Tu es en grosse blinde avec A♦T♣. Plan ?', 'Le 3-bet tapis (resteal) est une arme centrale entre 15 et 25 bb : il gagne les blindes, les antes et la relance quand le bouton se couche, et A-T a une bonne équité quand il paie.'],
      ['Ton ROI sur 80 tournois est de +60 %. Que peux-tu en conclure ?', 'Presque rien : en tournoi, la dispersion des résultats est énorme. Il faut plusieurs centaines à milliers de tournois pour qu\'un ROI ait un sens. Juge tes décisions (spots, ICM, revues) en attendant.'],
      ['Blindes 100/200, ante de grosse blinde 200 : le pot fait 500 avant toi. Tu as 2 400 jetons (12 bb) au bouton. Un tapis en bluff pur doit faire coucher les blindes combien de fois ?', 'Risque ÷ (risque + gain) = 2 400 ÷ (2 400 + 500) ≈ <strong>83 %</strong>. Mais tu n\'es jamais en bluff pur : quand on te paie, tu as souvent 30 à 45 % d\'équité. C\'est pourquoi les ranges de tapis à 12 bb sont larges (voir Outils › Push/Fold).'],
    ])]], quiz: [
      ['80 tournois à +60 % de ROI. Conclusion ?', ['Je suis un gros gagnant', 'Échantillon trop petit'], 1, 'Le ROI en tournoi demande des centaines à des milliers de parties.'],
    ] });

    add('expresso', { sections: [['Exercices corrigés', ex([
      ['Tête-à-tête, 10 bb, tu es au bouton (petite blinde). Quelle part des mains pousses-tu à l\'équilibre ?', 'Environ <strong>58 %</strong> des mains (solveur push/fold SIGMA 52, valeur publiée de référence). Vérifie main par main dans Outils › Push/Fold.'],
      ['Un récréatif paie tous tes tapis avec n\'importe quel as. Ajustement ?', 'Pousse moins de mains faibles (elles n\'ont plus de fold equity) et élargis tes tapis de valeur et tes calls avec les mains qui battent « n\'importe quel as ».'],
      ['Tête-à-tête, la petite blinde a 5 bb. Quelle part des mains pousse-t-elle à l\'équilibre, et que paie la grosse blinde ?', 'Solveur push/fold SIGMA 52 (jetons, sans ante) : la SB pousse environ <strong>72 %</strong> des mains, la BB paie environ <strong>62 %</strong>. Plus le tapis baisse, plus les deux ranges s\'élargissent : à 5 bb, presque toute main avec un as ou une paire paie.'],
    ])]], quiz: [
      ['Tête-à-tête à 10 bb, la SB pousse environ…', ['25 % des mains', '58 % des mains'], 1, 'Valeur d\'équilibre du push/fold à 10 bb.'],
    ] });

    add('fish', { sections: [['Exercices corrigés', ex([
      ['Un joueur qui paie tout. Tu as top paire bon kicker sur un board sec. Plan de mise ?', 'Mise sur les trois rues, plutôt gros (deux tiers du pot ou plus) : il paie avec toute paire et beaucoup de hauteurs. Ne checke pas pour « piéger » : il ne misera pas pour toi.'],
      ['Tu as raté ton tirage à la river contre ce même joueur. Bluff ?', 'Non. Il ne se couche pas : abandonne le pot. C\'est l\'erreur la plus coûteuse contre les fish.'],
      ['Un fish limpe en UTG, tout le monde se couche jusqu\'à toi au bouton avec A♦J♣. Que fais-tu ?', 'Isole : relance à environ 4 à 5 bb (une ouverture normale plus 1 bb par limper). Tu joues le pot en position contre la range la plus faible de la table, avec une main qui domine ses as et ses figures. Limper derrière lui laisserait entrer les blindes à bas prix.'],
    ])]], quiz: [
      ['Contre un fish qui paie tout, avec top paire bon kicker…', ['Mise trois rues', 'Check pour piéger'], 0, 'Il paie : la valeur se prend en misant.'],
    ] });

    add('turnriver', { sections: [['Exercices corrigés', ex([
      ['Tu as misé le flop K♠7♦2♣ avec A♥Q♥, il a payé. Turn A♣. Deuxième mise ?', 'Oui : tu viens de toucher top paire, et l\'as améliore ta range de relanceur bien plus que la sienne. Mise pour la valeur et pour faire payer les rois.'],
      ['River, tu as une paire moyenne, il checke. Mise de valeur fine ou check ?', 'Pose-toi la question : quelles mains moins bonnes paient ? S\'il paie avec des paires plus faibles, une petite mise de valeur rapporte ; s\'il ne paie qu\'avec mieux, check.'],
      ['Pot de 30 bb à la river, tu bluffes 20 bb. Quelle part du temps doit-il se coucher pour que le bluff soit rentable ?', 'Risque ÷ (risque + gain) = 20 ÷ (20 + 30) = <strong>40 %</strong>. S\'il se couche plus souvent que 40 %, le bluff rapporte, même s\'il échoue plus d\'une fois sur deux.'],
    ])]], quiz: [
      ['La valeur fine à la river se justifie si…', ['Des mains moins bonnes paient', 'Tu veux le faire coucher'], 0, 'Une mise de valeur doit être payée par moins bon.'],
    ] });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
