// Cours — modules ajoutés : tête-à-tête, profondeur de tapis, Omaha pot-limit, décider vite à la table, partie maison.
(function (root) {
  function register(K) {
    K.mod({
      id: 'hu', level: 3, title: 'Le tête-à-tête : jouer à deux', drill: 'pushfold',
      goals: ['Ouvrir et défendre aux bonnes fréquences quand il ne reste qu\'un adversaire', 'Comprendre pourquoi les mains moyennes prennent de la valeur', 'Gérer la variance et l\'adaptation constante'],
      sections: [
        ['Pourquoi tout change à deux', `<p>À deux joueurs, le bouton est aussi la petite blinde et parle en premier préflop, puis en dernier après le flop. Tu paies une blinde à chaque main : attendre une bonne main coûte 1,5 bb toutes les deux mains. Conséquence : les ranges s'élargissent énormément.</p>
          <ul><li>Au bouton, un joueur solide ouvre environ <strong>75 à 85 %</strong> des mains à 100 bb (la table de SIGMA 52 utilise 76 %).</li>
          <li>En grosse blinde, face à une ouverture à 2 à 2,5 bb, tu reçois une cote de 2,3 à 3 contre 1 (25 à 30 % d'équité requise) : tu défends (call ou 3-bet) <strong>la majorité de tes mains</strong>, autour de 60 à 70 % selon la taille.</li>
          <li>Une paire faible, une hauteur as, une hauteur roi gagnent souvent l'abattage : elles valent beaucoup plus qu'à 6.</li></ul>`],
        ['Le plan préflop', `<table class="t"><thead><tr><th>Situation</th><th>Défaut solide</th></tr></thead><tbody>
          <tr><td>Bouton, premier à parler</td><td>Relance 2 à 2,5 bb avec presque tout ; limp seulement si tu as un plan de limp mixte travaillé</td></tr>
          <tr><td>Grosse blinde face à 2,5 bb</td><td>3-bet valeur (paires moyennes et hautes, as forts) + 3-bet bluff à bloqueurs (A5s, K4s) ; call large ; couche le bas de gamme dépareillé (72o, 83o, 92o…)</td></tr>
          <tr><td>Bouton face à un 3-bet</td><td>4-bet valeur et quelques bluffs à as ; call en position avec les mains jouables ; couche le reste</td></tr>
          <tr><td>Sous 15 bb</td><td>Tapis ou couché : l'outil Tapis ou couché et le solveur de Nash donnent la range exacte</td></tr></tbody></table>`],
        ['Après le flop', `<ul><li>Le relanceur préflop mise souvent, mais petit (25 à 33 % du pot) : à deux, sa range touche le flop aussi peu que celle du défenseur.</li>
          <li>La grosse blinde doit check-raise une partie de ses mains (deux paires, brelans, tirages forts) : sinon le bouton mise gratuitement.</li>
          <li>Les paires moyennes jouent pour un pot moyen : à deux, la deuxième paire est souvent la meilleure main, mais pas pour trois mises.</li></ul>`],
        ['Adaptation et variance', `<p>À deux, tout ce que fait l'adversaire te concerne : chaque déviation est exploitable. Un adversaire qui couche plus de 50 % face aux mises au flop se fait miser avec toute ta range ; un adversaire qui paie tout ne reçoit plus de bluffs. La variance est énorme : prévois plus de caves que pour le 6-max (module Bankroll) et note tes sessions dans le Journal.</p>`],
      ],
      mistakes: ['Jouer à deux comme à six : trop serré, les blindes te mangent', 'Payer trop de 3-bets hors de position sans plan', 'Ne jamais check-raise en grosse blinde', 'Garder la même stratégie face à un adversaire qui a clairement changé'],
      keys: ['Bouton : 75 à 85 % d\'ouvertures', 'Grosse blinde : défendre la majorité des mains', 'Petites c-bets, check-raises fréquents', 'Sous 15 bb : tapis ou couché'],
      quiz: [
        ['Tête-à-tête, 100 bb, tu as K7o au bouton. Défaut ?', ['Relancer', 'Coucher', 'Limper systématiquement'], 0, 'K7o est largement dans les 75 à 85 % d\'ouvertures.'],
        ['En grosse blinde face à 2,5 bb, quelle proportion de mains défends-tu environ ?', ['20 %', 'La majorité (60 à 70 %)', '100 %'], 1, 'La cote de 2,3 à 3 contre 1 et la range large du bouton justifient une défense large.'],
        ['Après le flop à deux, la deuxième paire est…', ['Souvent la meilleure main, à jouer pour un pot moyen', 'Toujours à coucher', 'Une main pour faire tapis'], 0, 'Les ranges sont larges : une paire vaut beaucoup, mais pas trois mises.'],
        ['L\'adversaire couche 60 % face aux c-bets. Ajustement ?', ['Miser beaucoup plus souvent', 'Miser moins souvent', 'Ne rien changer'], 0, 'Un bluff à 33 % du pot n\'a besoin que de 25 % de couchers.'],
      ],
    });

    K.mod({
      id: 'profondeur', level: 3, title: 'Adapter son jeu à la profondeur : 40, 100, 200 bb', drill: 'rfi',
      goals: ['Savoir quelles mains gagnent et perdent de la valeur selon les tapis', 'Planifier une main avec le SPR', 'Éviter les gros pots avec les mains dominées en tapis profonds'],
      sections: [
        ['Le principe', `<p>La profondeur (tapis effectif en grosses blindes) décide de ce que tu peux gagner après le flop. Plus les tapis sont profonds, plus les mains qui font <strong>des mains très fortes mais rarement</strong> (petites paires, assorties connectées) gagnent de la valeur grâce aux cotes implicites. Plus ils sont courts, plus les mains qui gagnent <strong>souvent un peu</strong> (hauteur as, paires moyennes, AK, AQ) dominent.</p>`],
        ['Tableau de bord', `<table class="t"><thead><tr><th></th><th>40 bb</th><th>100 bb</th><th>200 bb</th></tr></thead><tbody>
          <tr><td>SPR typique d'un pot relancé</td><td>≈ 7, ≈ 1,5 en pot 3-bet</td><td>≈ 18, ≈ 5 en pot 3-bet</td><td>≈ 36, ≈ 10 en pot 3-bet</td></tr>
          <tr><td>Montent en valeur</td><td>AK, AQ, AJ, KQ, paires moyennes</td><td>Référence</td><td>22 à 99, assorties connectées, Axs</td></tr>
          <tr><td>Baissent</td><td>Petites paires (pas de cotes pour le set), connecteurs</td><td>—</td><td>AJo, KQo, KJo (dominées dans les gros pots)</td></tr>
          <tr><td>3-bet</td><td>Souvent 3-bet/tapis</td><td>3-bet/call ou 3-bet/fold</td><td>Plus large en position, plus de 4-bets valeur serrées</td></tr>
          <tr><td>Une paire</td><td>Souvent assez pour le tapis</td><td>Selon la texture et l'adversaire</td><td>Rarement assez pour 200 bb</td></tr></tbody></table>
          <p>Les SPR sont des ordres de grandeur pour une ouverture à 2,5 bb payée par une blinde (pot ≈ 5,5 bb) et un 3-bet à 9 bb payé (pot ≈ 19 bb) : SPR = tapis restant ÷ pot.</p>`],
        ['La règle des petites paires', `<p>Avec une petite paire, tu touches un brelan au flop une fois sur 8,5 environ (11,8 %). Pour qu'un call préflop rapporte grâce au brelan seul, il faut pouvoir gagner environ <strong>15 à 20 fois la mise</strong> payée quand tu touches. À 40 bb, l'adversaire n'a souvent pas assez derrière ; à 200 bb, si.</p>`],
        ['Tapis profonds : le piège de la domination', `<p>À 200 bb, quand un adversaire prudent met tout son tapis, il a rarement une seule paire. AK sur un board A-8-3 est une excellente main pour deux mises, mauvaise pour quatre. Réserve les tapis aux deux paires et mieux, sauf lecture contraire (joueur qui surestime ses mains).</p>`],
      ],
      mistakes: ['Payer des relances avec des petites paires à 40 bb pour « toucher le brelan »', 'Engager 200 bb avec top paire bon kicker contre un joueur serré', 'Jouer 3-bet/call à 40 bb au lieu de 3-bet/tapis', 'Ignorer la profondeur du plus petit tapis de la main (c\'est le tapis effectif qui compte)'],
      keys: ['Tapis courts : mains à haute carte et tapis préflop', 'Tapis profonds : cotes implicites et prudence avec les mains dominées', 'SPR = plan de la main', 'Toujours raisonner en tapis effectif'],
      quiz: [
        ['Tu joues 40 bb. Quelle main perd le plus de valeur par rapport à 100 bb ?', ['AQo', '33', 'KK'], 1, 'Sans cotes implicites, une petite paire ne gagne pas assez quand elle touche.'],
        ['200 bb, board A-8-3 dépareillé, un joueur serré relance ta mise au turn puis met tapis river. Tu as AK. Défaut ?', ['Payer', 'Coucher le plus souvent', 'Relancer'], 1, 'À 200 bb, un joueur serré qui met tout a rarement une seule paire.'],
        ['Ce qui détermine la profondeur réelle d\'une main…', ['Le plus gros tapis de la table', 'Le tapis effectif (le plus petit des joueurs impliqués)', 'Ton tapis seul'], 1, 'On ne peut perdre ou gagner que le plus petit des deux tapis.'],
      ],
    });

    K.mod({
      id: 'omaha', level: 3, title: 'Omaha pot-limit (PLO) : les bases', drill: 'outs',
      goals: ['Connaître les règles qui piègent les débutants', 'Choisir les mains de départ qui jouent bien', 'Calculer une relance pot-limit et lire le board'],
      sections: [
        ['Les règles', `<ul><li>Chaque joueur reçoit <strong>4 cartes</strong>. Pour former ta main, tu utilises <strong>exactement 2</strong> cartes de ta main et <strong>exactement 3</strong> du board. Avec un seul cœur en main et quatre cœurs au board, tu n'as <strong>pas</strong> de couleur. Avec AAAK en main, tu ne fais au mieux que la paire d'as plus le board.</li>
          <li><strong>Pot-limit</strong> : la mise maximale est la taille du pot. Pour relancer au maximum, le croupier compte : tu suis la mise, puis tu relances du montant du pot ainsi obtenu. Pot de 10, mise de 10 face à toi : tu suis 10 (pot 30), tu relances de 30, soit <strong>40 au total</strong>. L'outil Omaha fait le calcul.</li></ul>`],
        ['Pourquoi les équités sont serrées', `<p>Avec 4 cartes, chaque joueur a 6 combinaisons de deux cartes : les mains se rapprochent. Calculs SIGMA 52 (outil Omaha) :</p>
          <table class="t"><thead><tr><th>Affrontement préflop</th><th class="n">Équité</th></tr></thead><tbody>
          <tr><td>As-As-Roi-Roi double assortie contre une main aléatoire</td><td class="n">≈ 71 %</td></tr>
          <tr><td>As-As-Roi-Roi double assortie contre Valet-10-9-8 double assortie</td><td class="n">≈ 61 %</td></tr>
          <tr><td>Paire d'as « sèche » (A-A-7-2 dépareillée) contre une main aléatoire</td><td class="n">≈ 61 %</td></tr>
          <tr><td>A-A-7-2 dépareillée contre Valet-10-9-8 double assortie</td><td class="n">≈ 50 % (54 % contre la version simple assortie)</td></tr></tbody></table>
          <p>À comparer au hold'em, où AA domine KK à 82 %. Conséquence : en PLO, la main de départ est un avantage modeste ; c'est le jeu après le flop qui fait la différence.</p>`],
        ['Bonnes mains de départ', `<ul><li><strong>Coordonnées</strong> : les 4 cartes travaillent ensemble (paires hautes, cartes connectées, couleurs). Ex. AAKK, AAJT, KQJT, JT98.</li>
          <li><strong>Double assortie</strong> &gt; simple assortie &gt; dépareillée. Les couleurs à l'as (« nut flush ») valent bien plus que les petites couleurs, souvent battues par une couleur supérieure.</li>
          <li>À éviter : trois ou quatre cartes de la même couleur (des outs perdus), brelan en main (une carte inutile), cartes éloignées sans lien (« danglers »), petites paires sans connexion.</li></ul>`],
        ['Jouer après le flop', `<ul><li><strong>Joue les nuts et les tirages aux nuts</strong>. Une deuxième couleur ou une suite basse perdent souvent de gros pots.</li>
          <li>Board apparié : un full est probable chez quelqu'un. Board à trois cartes d'une couleur : la couleur max est souvent présente dès qu'il y a plusieurs joueurs.</li>
          <li>Les tirages ont souvent 13 à 20 outs (« wraps » : 4 cartes qui encadrent le board). Un brelan max au flop n'est pas toujours favori : sur K♥8♥3♣, K♠K♦7♣2♦ a ≈ 69 % contre A♥5♥Q♠J♦ (couleur max seule) ; sur K♥T♥9♣, il tombe à ≈ 36 % contre A♥Q♥J♠8♠ (couleur max et wrap). Vérifie tes propres spots dans l'outil Omaha.</li>
          <li>Les variances sont plus fortes qu'en hold'em : prévois une bankroll nettement plus large qu'en no-limit.</li></ul>`],
      ],
      mistakes: ['Utiliser une seule carte de sa main (ou trois) dans sa combinaison', 'Surestimer AA sèche préflop', 'Payer avec une couleur ou une suite qui ne sont pas les meilleures', 'Jouer trop de mains : quatre cartes donnent l\'impression que tout est jouable'],
      keys: ['2 cartes de la main + 3 du board, toujours', 'Équités serrées : l\'avantage préflop est faible', 'Mains coordonnées, double assorties, couleurs à l\'as', 'Jouer les nuts et les tirages aux nuts'],
      quiz: [
        ['Board : Qh Jh 9h 3h 4s. Tu as Ah Ks 7d 2c. Ta main ?', ['Couleur max', 'Hauteur as, pas de couleur', 'Suite'], 1, 'Il faut deux cœurs en main pour faire couleur en Omaha.'],
        ['Pot de 10, l\'adversaire mise 10. Relance maximale (total) ?', ['20', '30', '40'], 2, 'Tu suis 10 (pot 30) puis tu relances de 30 : 40 au total.'],
        ['Quelle main de départ est la plus faible ?', ['KQJT double assortie', 'AAKK double assortie', '7-7-7-2 avec trois piques'], 2, 'Brelan en main et trois cartes de la même couleur : des cartes perdues.'],
        ['AA sèche contre JT98 double assortie avant le flop : équité environ ?', ['80 %', '65 %', '50 %'], 2, 'En PLO, les mains coordonnées rattrapent facilement une paire seule.'],
      ],
    });

    K.mod({
      id: 'eclair', level: 5, title: 'Décider vite à la table : la méthode en dix secondes', drill: 'odds',
      goals: ['Prendre une décision solide en quelques secondes sans calcul compliqué', 'Mémoriser les chiffres utiles', 'Utiliser l\'outil Table live dans les parties amicales, et savoir où il est interdit'],
      sections: [
        ['La séquence', `<ol><li><strong>Préflop</strong> : position + main → ta chart (ouvrir, 3-bet ou coucher). Sous 15 bb : tapis ou couché.</li>
          <li><strong>Après le flop, avant de miser</strong> : « suis-je devant sa range ? » Si oui, mise pour la valeur ; si non et que tu as un gros tirage, semi-bluff ; sinon check.</li>
          <li><strong>Face à une mise</strong> : cote = mise ÷ (pot + mise). Compare à ton équité (outs × 2 par carte, × 4 sur deux cartes).</li>
          <li><strong>À plusieurs</strong> : resserre tout ; un adversaire de plus = moins de bluffs, plus de valeur requise.</li>
          <li><strong>Type d'adversaire</strong> : contre un joueur qui paie tout, pas de bluff et plus de valeur ; contre un joueur serré, crédite ses grosses mises.</li></ol>`],
        ['Les chiffres à connaître par cœur', `<table class="t"><thead><tr><th>Mise adverse</th><th class="n">Équité requise</th><th class="n">Outs ≈ sur une carte</th></tr></thead><tbody>
          <tr><td>1/3 du pot</td><td class="n">20 %</td><td class="n">9 à 10</td></tr>
          <tr><td>1/2 pot</td><td class="n">25 %</td><td class="n">12</td></tr>
          <tr><td>2/3 du pot</td><td class="n">28,6 %</td><td class="n">13 à 14</td></tr>
          <tr><td>Pot</td><td class="n">33,3 %</td><td class="n">16</td></tr></tbody></table><p class="note">Outs nécessaires = équité requise × 46 ou 47 cartes inconnues (sans cotes implicites).</p>
          <p>Tirage couleur : 9 outs, ≈ 19 % sur une carte, 35 % sur deux. Suite deux bouts : 8 outs, 17 % et 31,5 %. Ventrale : 4 outs, 8,5 % et 16,5 %. Les cotes implicites (ce que tu gagneras en plus quand tu touches) permettent de payer un peu plus que la cote directe, surtout contre un joueur qui paie.</p>`],
        ['L\'outil Table live', `<p>Dans <em>Jouer › Table live</em> : tu tapes tes deux cartes (rang puis couleur, ou au clavier : <span class="mono">a s k h</span>), puis le board au fil de la main, et l'outil donne une décision avec ton équité contre une range estimée en une à quelques dizaines de millisecondes. Le mode discret assombrit l'écran et n'affiche que la décision. Le minuteur de blindes et la préparation de la partie (structure, jetons, places) sont dans le même onglet.</p>
          <div class="warnbox"><strong>Où c'est autorisé</strong> : uniquement dans une partie privée, sans argent ou avec l'accord explicite de tous les joueurs. Toute aide en temps réel est <strong>interdite</strong> en ligne, en casino, en club et en tournoi : exclusion, gains confisqués. Annonce l'outil à tes amis avant la partie ; mieux encore, mettez-le à disposition de tous.</div>`],
        ['S\'en passer progressivement', `<p>Le but est d'automatiser la méthode. Après chaque partie, compare tes décisions instinctives avec celles de l'outil, puis repasse les mains douteuses au Solveur. Quand tu tombes d'accord avec l'outil neuf fois sur dix sans le regarder, joue sans.</p>`],
      ],
      mistakes: ['Chercher la décision parfaite et ralentir la partie', 'Payer une mise sur un tirage sans comparer la cote', 'Bluffer à plusieurs adversaires', 'Utiliser une aide en temps réel ailleurs que dans une partie privée consentie'],
      keys: ['Chart préflop, puis « devant ou derrière sa range ? »', 'Cote = mise ÷ (pot + mise)', 'Outs × 2 par carte, × 4 sur deux cartes', 'Aide en temps réel : parties privées consenties uniquement'],
      quiz: [
        ['L\'adversaire mise la moitié du pot. Équité requise ?', ['20 %', '25 %', '33 %'], 1, 'Mise ÷ (pot + mise) = 0,5 ÷ 2 = 25 %.'],
        ['Tirage couleur au turn, mise du pot. Sans cotes implicites, tu…', ['Paies', 'Couches'], 1, 'Environ 19 % pour 33 % requis.'],
        ['Tu peux utiliser l\'outil Table live…', ['Dans un tournoi de casino si tu es discret', 'Dans une partie entre amis qui sont d\'accord', 'En ligne sur un deuxième écran'], 1, 'Partout ailleurs, l\'aide en temps réel est interdite.'],
        ['Trois adversaires dans le coup, tu as un tirage ventral sans rien d\'autre. Défaut ?', ['Semi-bluff', 'Check, et payer seulement si la cote le permet', 'Tapis'], 1, 'Pas de bluff à plusieurs, et 4 outs ne justifient pas d\'investir.'],
      ],
    });

    K.mod({
      id: 'home', level: 5, title: 'La partie maison : organiser et gagner entre amis', drill: 'situations',
      goals: ['Monter une partie de jetons claire et agréable', 'Choisir une structure et répartir les jetons', 'Battre une table d\'amis sans gâcher l\'ambiance'],
      sections: [
        ['Le cadre en France', `<p>Une partie entre amis <strong>sans argent</strong> (jetons sans valeur, lots symboliques) ne pose pas de problème. Dès qu'il y a de l'argent en jeu, la loi encadre strictement les jeux de hasard : l'organisation de jeux d'argent ouverts au public est interdite hors établissements autorisés. Reste dans le cadre privé, sans prélèvement, et en cas de doute, joue pour des jetons ou des points.</p>`],
        ['Préparer', `<ul><li><strong>Tapis de départ</strong> : 100 à 200 grosses blindes de départ (ex. 10 000 jetons avec blindes 25/50).</li>
          <li><strong>Jetons</strong> : 3 ou 4 valeurs suffisent ; il faut assez de petites valeurs pour les blindes et la monnaie. L'outil <em>Préparer la partie</em> répartit selon ton stock et signale s'il manque des jetons.</li>
          <li><strong>Blindes</strong> : niveaux de 15 à 20 minutes ; dans la structure proposée par l'outil, la grosse blinde finale vaut environ un quinzième des jetons en jeu, ce qui termine une partie à 6 en 3 heures environ. Le minuteur plein écran affiche le niveau et sonne au changement.</li>
          <li><strong>Règles annoncées avant</strong> : relance minimale = la relance précédente ; carte exposée ; « verbal engage » ; qui distribue ; recave ou non.</li></ul>`],
        ['Gagner contre des amis', `<table class="t"><thead><tr><th>Ce qu'on observe</th><th>Ajustement</th></tr></thead><tbody>
          <tr><td>Beaucoup de limps et de calls</td><td>Isole en relançant plus gros : 4 bb + 1 par limper, valeur grosse</td></tr>
          <tr><td>Personne ne se couche</td><td>Zéro bluff, mise trois rues avec tes bonnes mains</td></tr>
          <tr><td>Un ami très serré</td><td>Vole ses blindes, couche face à ses grosses relances</td></tr>
          <tr><td>Pots à 4 ou 5 joueurs</td><td>Mains qui font les nuts (assorties à l'as, paires pour le brelan) ; méfiance avec une paire</td></tr>
          <tr><td>Fin de partie, blindes hautes</td><td>Tapis ou couché sous 15 bb ; le plus gros tapis met la pression</td></tr></tbody></table>`],
        ['L\'ambiance compte', `<p>Une partie entre amis doit rester un plaisir : explique les règles aux débutants, évite le jeu lent, ne commente pas les erreurs des autres. Si tu utilises l'outil Table live, dis-le et propose-le à tout le monde ; le mode discret limite la gêne à la table.</p>`],
      ],
      mistakes: ['Pas assez de petits jetons pour faire la monnaie', 'Blindes trop lentes : la partie dure toute la nuit', 'Bluffer des amis qui paient tout', 'Utiliser un outil d\'aide sans prévenir les autres'],
      keys: ['Jetons sans valeur : cadre privé', '100 à 200 bb de départ, niveaux de 15 à 20 min', 'Isoler gros, valeur grosse, peu de bluffs', 'Transparence sur les outils'],
      quiz: [
        ['Trois amis limpent devant toi au bouton avec AQo. Taille ?', ['2,5 bb', '7 bb (4 + 1 par limper)', 'Limp aussi'], 1, 'Il faut isoler : ils paient presque autant une petite relance.'],
        ['La table paie tout jusqu\'à la river. Ajustement principal ?', ['Plus de bluffs', 'Plus de valeur, moins de bluffs'], 1, 'On ne bluffe pas un joueur qui ne se couche pas.'],
        ['Pour une partie d\'environ 3 h à 6 joueurs, la grosse blinde finale vaut environ…', ['Un quinzième des jetons en jeu', 'La moitié des jetons en jeu', 'Le tapis de départ'], 0, 'Assez haute pour forcer la fin, sans transformer tout en loterie trop tôt.'],
      ],
    });

    K.extend('eclair', { sections: [['Comment la Table live raisonne', `<ol><li><strong>Sa range de départ</strong> vient de son action avant le flop (ouverture, call, 3-bet) et de son type, à partir des charts.</li>
      <li><strong>Chaque action la met à jour</strong> : un modèle appris sur plusieurs millions de mains simulées donne, pour chaque type, la probabilité de checker, miser petit, moyen ou gros, payer ou relancer avec chaque catégorie de main. Une relance rend sa range bien plus forte ; un check répété la rend plus faible.</li>
      <li><strong>Ton équité</strong> est calculée main par main contre cette range (exacte au turn et à la river).</li>
      <li><strong>Chaque option est chiffrée</strong> : EV de check, des mises de 33 % à l'overbet, du call, de la relance et du tapis, avec la part de sa range qui se couche. La meilleure est affichée ; si deux options sont proches, l'outil le dit.</li></ol>
      <p>C'est un modèle d'exploitation sur la rue en cours, pas un solveur : il ne planifie pas les rues suivantes. Pour l'étude, envoie le spot au Solveur depuis la Table live.</p>`]], quiz: [
      ['L\'adversaire relance ta mise au flop. Que fait la Table live de sa range ?', ['Elle la renforce : moins de mains faibles, plus de brelans et de deux paires', 'Elle ne change rien'], 0, 'Chaque action pèse sur la probabilité de chaque catégorie de main.'],
    ] });

    // Styles ajoutés dans l'onglet Champions : quiz complémentaires du module « Affronter les grands styles ».
    K.extend('styles', { quiz: [
      ['Un adversaire mise au flop plus de 90 % du temps après avoir relancé. Ajustement ?', ['Défendre plus large et check-raise les boards bas', 'Coucher plus souvent'], 0, 'Sa range de mise est très large : elle contient beaucoup de mains faibles.'],
      ['Un joueur de tournoi méthodique a un M de 4. Sa stratégie la plus probable ?', ['Petites relances et calls', 'Tapis ou couché'], 1, 'Zone rouge d\'Harrington : tapis ou couché.'],
    ] });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
