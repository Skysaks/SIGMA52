// Cours — modules complémentaires (v13) : notation, probabilités, textures, tirages, blindes, biais cognitifs,
// pots 3-bet, tournois à tapis courts, satellites, PLO après le flop, bluff-catching, ranges polarisées et fusionnées,
// études de cas, notes de session live, histoire du jeu et de l'IA, bankroll avancée.
// Équités : moteur SIGMA 52 (150 000 tirages, ± 0,3 point). Probabilités : calcul combinatoire exact.
(function (root) {
  const ex = (items) => items.map(([q, a], i) => `<details class="exo"><summary><strong>Exercice ${i + 1}.</strong> ${q}</summary><p>${a}</p></details>`).join('');
  function register(K) {
    // ================= Niveau 1 =================
    K.mod({
      id: 'notation', level: 1, title: 'Lire et raconter une main : notation et vocabulaire', drill: 'situations',
      goals: ['Lire une main racontée dans un livre, un forum ou un historique', 'Noter une main proprement pour la revoir', 'Connaître les abréviations courantes'],
      sections: [
        ['La notation des cartes', `<p>Une carte s'écrit <strong>rang + couleur</strong> : A, K, Q, J, T (dix), 9 à 2 ; s (pique), h (cœur), d (carreau), c (trèfle). A♠K♠ s'écrit AsKs. Une main sans couleurs précises s'écrit avec <strong>s</strong> (assortie, suited) ou <strong>o</strong> (dépareillée, offsuit) : AKs, AKo. « AK » seul désigne les deux.</p>
          <p>Une range s'écrit en raccourcis : <strong>TT+</strong> = TT, JJ, QQ, KK, AA ; <strong>ATs+</strong> = ATs, AJs, AQs, AKs ; <strong>A2s-A5s</strong> = A2s à A5s. C'est la notation utilisée dans l'outil Ranges et l'Atlas préflop.</p>`],
        ['Raconter une main dans l\'ordre', `<ol><li>Format, limite, tapis effectifs (« NL10, 100 bb effectifs »).</li><li>Positions et action préflop (« CO ouvre 2,5 bb, je paie au BTN avec 9♠8♠ »).</li><li>Chaque rue : board, taille du pot, actions et montants, en bb ou en % du pot.</li><li>Ce que tu savais de l'adversaire (profil, statistiques, notes).</li><li>Ta question précise (« call ou fold river ? »).</li></ol>
          <p>Écrire les montants <strong>en bb</strong> et en <strong>% du pot</strong> rend la main comparable à n'importe quelle limite.</p>`],
        ['Abréviations courantes', `<div class="tw"><table class="t"><thead><tr><th>Abréviation</th><th>Sens</th></tr></thead><tbody>
          <tr><td>RFI</td><td>Ouverture en premier (raise first in)</td></tr><tr><td>SRP</td><td>Pot simple relancé (single raised pot)</td></tr><tr><td>3BP / 4BP</td><td>Pot 3-bet / 4-bet</td></tr>
          <tr><td>IP / OOP</td><td>En position / hors de position</td></tr><tr><td>CB</td><td>Mise de continuation</td></tr><tr><td>XR</td><td>Check-raise</td></tr><tr><td>X/F, X/C</td><td>Check puis coucher, check puis payer</td></tr>
          <tr><td>BDFD</td><td>Tirage couleur arrière (deux cartes de la couleur à venir)</td></tr><tr><td>OESD</td><td>Tirage suite par les deux bouts</td></tr><tr><td>TPTK</td><td>Top paire, meilleur kicker</td></tr><tr><td>SPR</td><td>Rapport tapis / pot</td></tr>
          </tbody></table></div>`],
        ['Exercices corrigés', ex([
          ["Écris la range « toutes les paires de 8 à l'as, et AK assorti ou non » en notation courte.", "<strong>88+, AK</strong>."],
          ["Combien de mains contient la notation « KTs+ » ?", "KTs, KJs, KQs : 3 mains, soit 12 combinaisons (4 par main assortie)."],
          ["Réécris proprement : « j'avais AK, il relance, je paie, flop roi, il mise, je relance ».", "« NL10, 100 bb. HJ ouvre 2,5 bb, je paie au BTN avec A♣K♦. Flop K♠7♦2♥ (pot 6 bb), HJ mise 2 bb (33 %), je relance à 7 bb. » Positions, montants et board précis rendent la main analysable."],
        ])],
      ],
      mistakes: ['Raconter une main sans les tapis ni les positions', 'Donner les montants en euros sans la limite', 'Confondre AKs (4 combos) et AK (16 combos)'],
      keys: ['Rang + couleur, s pour assortie, o pour dépareillée', 'Montants en bb et en % du pot', 'Une main racontée finit par une question précise'],
      quiz: [
        ['Que signifie « 99+ » ?', ['99, TT, JJ, QQ, KK, AA', '99 seulement', 'Toutes les paires sauf 99'], 0, 'Le + inclut toutes les paires au-dessus.'],
        ['« OOP » veut dire…', ['Hors de position', 'Sans relance préflop', 'Tapis'], 0, 'Out of position.'],
        ['AKo représente combien de combinaisons ?', ['12', '16', '4'], 0, '16 AK moins 4 assortis.'],
        ['Pourquoi noter les mises en % du pot ?', ['Pour comparer les situations quelle que soit la limite', 'Pour cacher les montants', 'C\'est obligatoire en ligne'], 0, 'Une mise de 2/3 du pot se raisonne pareil en NL2 et en NL200.'],
        ['« XR » signifie…', ['Check-raise', 'Relance à tapis', 'Pas de relance'], 0, 'Check puis relance.'],
      ],
    });

    K.mod({
      id: 'probas', level: 1, title: 'Les probabilités à connaître par cœur', drill: 'outs',
      goals: ['Savoir à quelle fréquence arrivent les mains de départ', 'Connaître les chances au flop', 'Estimer vite ses chances avec les outs'],
      sections: [
        ['Avant le flop', `<div class="tw"><table class="t"><thead><tr><th>Événement</th><th class="n">Probabilité</th><th>Soit environ</th></tr></thead><tbody>
          <tr><td>Recevoir une paire</td><td class="n mono">5,9 %</td><td>1 main sur 17</td></tr>
          <tr><td>Recevoir AA (ou une paire précise)</td><td class="n mono">0,45 %</td><td>1 main sur 221</td></tr>
          <tr><td>Recevoir deux cartes assorties</td><td class="n mono">23,5 %</td><td>presque 1 sur 4</td></tr>
          <tr><td>Un adversaire précis a AA quand tu as KK</td><td class="n mono">0,49 %</td><td>1 sur 204</td></tr>
          <tr><td>Un des 8 adversaires a AA quand tu as KK</td><td class="n mono">≈ 3,9 %</td><td>1 sur 26</td></tr>
          </tbody></table></div>`],
        ['Au flop', `<div class="tw"><table class="t"><thead><tr><th>Avec…</th><th>Tu touches…</th><th class="n">Probabilité</th></tr></thead><tbody>
          <tr><td>Une paire en main</td><td>Brelan ou mieux</td><td class="n mono">11,8 %</td></tr>
          <tr><td>Deux cartes non appariées</td><td>Au moins une paire avec une de tes cartes</td><td class="n mono">32,4 %</td></tr>
          <tr><td>Deux cartes assorties</td><td>Couleur faite</td><td class="n mono">0,84 %</td></tr>
          <tr><td>Deux cartes assorties</td><td>Tirage couleur (exactement 2 de ta couleur)</td><td class="n mono">10,9 %</td></tr>
          </tbody></table></div>
          <p>Leçon : deux fois sur trois, une main non appariée rate complètement le flop. C'est pour cela que l'initiative (la relance préflop) gagne tant de pots sans abattage.</p>`],
        ['Les outs en deux règles', `<p><strong>Règle de 2 et de 4</strong> : outs × 2 ≈ chances sur une carte ; outs × 4 ≈ chances sur deux cartes (au flop, si tu vas jusqu'à la river). Au-delà de 8 outs, la règle de 4 surestime un peu : 15 outs × 4 = 60 %, la vraie valeur est 54 %.</p>
          <p>Tirage couleur arrière (trois cartes de la couleur au flop, il en faut deux de plus) : 10 × 9 ÷ (47 × 46 ÷ 2) ≈ <strong>4,2 %</strong>. Petit, mais il ajoute de l'équité à une mise de continuation.</p>`],
        ['Exercices corrigés', ex([
          ["Sur 1 000 mains, combien de fois reçois-tu une paire, en moyenne ? Et AA ?", "Paire : 1 000 × 5,9 % ≈ <strong>59</strong>. AA : 1 000 ÷ 221 ≈ <strong>4,5</strong>."],
          ["Tu as 7♣6♣. Probabilité de flopper une couleur ? Un tirage couleur ?", "Couleur : <strong>0,84 %</strong>. Tirage couleur : <strong>10,9 %</strong>. Les assorties gagnent surtout par les tirages et les paires, rarement par la couleur au flop."],
          ["Flop, tu as un tirage couleur et deux overcards (15 outs). Tes chances jusqu'à la river ?", "Règle de 4 : 60 %, valeur réelle ≈ <strong>54 %</strong> (1 − 32 ÷ 47 × 31 ÷ 46). Tu es favori contre une paire."],
        ])],
      ],
      mistakes: ['Croire qu\'une paire de départ « touche souvent » le brelan (une fois sur 8,5)', 'Utiliser la règle de 4 quand l\'adversaire peut miser au turn', 'Surestimer les gros tirages avec la règle de 4'],
      keys: ['Paire : 1 main sur 17 ; AA : 1 sur 221', 'Une main non appariée rate le flop deux fois sur trois', 'Outs × 2 sur une carte, × 4 sur deux'],
      quiz: [
        ['Probabilité de recevoir une paire ?', ['≈ 5,9 %', '≈ 12 %', '≈ 2 %'], 0, '78 combinaisons de paires sur 1 326.'],
        ['Avec une paire en main, brelan ou mieux au flop ?', ['≈ 11,8 %', '≈ 25 %', '≈ 5 %'], 0, '1 − C(48,3) ÷ C(50,3).'],
        ['Avec deux cartes non appariées, au moins une paire au flop ?', ['≈ 32 %', '≈ 50 %', '≈ 15 %'], 0, '1 − C(44,3) ÷ C(50,3).'],
        ['15 outs au flop jusqu\'à la river ?', ['≈ 54 %', '≈ 60 %', '≈ 30 %'], 0, 'La règle de 4 surestime les gros tirages.'],
        ['Tirage couleur arrière au flop ?', ['≈ 4 %', '≈ 19 %', '≈ 35 %'], 0, 'Il faut deux cartes de la couleur.'],
      ],
    });

    // ================= Niveau 2 =================
    K.mod({
      id: 'textures', level: 2, title: 'Les textures de board : huit familles et leur plan', drill: 'situations',
      goals: ['Classer un flop en quelques secondes', 'Savoir qui il favorise', 'Choisir fréquence et taille de c-bet par famille'],
      sections: [
        ['Les questions à se poser', `<ol><li><strong>Hauteur</strong> : cartes hautes (A, K, Q) ou basses ?</li><li><strong>Couleurs</strong> : arc-en-ciel, deux d'une couleur, monochrome ?</li><li><strong>Connexion</strong> : cartes éloignées ou proches (suites possibles) ?</li><li><strong>Paire</strong> au board ?</li></ol>
          <p>Ces quatre réponses disent qui a l'avantage de range, qui a l'avantage de nuts, et donc quelle taille de mise convient.</p>`],
        ['Les huit familles', `<div class="tw"><table class="t"><thead><tr><th>Famille</th><th>Exemple</th><th>Favorise souvent</th><th>Plan du relanceur en position</th></tr></thead><tbody>
          <tr><td>Haut et sec</td><td>K♠7♦2♣</td><td>Le relanceur</td><td>Petite mise (25-33 %), très fréquente</td></tr>
          <tr><td>As haut</td><td>A♥8♣3♦</td><td>Le relanceur</td><td>Petite mise fréquente</td></tr>
          <tr><td>Deux cartes hautes</td><td>K♦Q♣5♠</td><td>Le relanceur, mais le défenseur touche aussi</td><td>Mise moyenne, un peu moins souvent</td></tr>
          <tr><td>Bas et connecté</td><td>7♥6♦5♣</td><td>Le défenseur (deux paires, suites)</td><td>Check souvent ; mise plus grosse et polarisée quand tu mises</td></tr>
          <tr><td>Moyen avec tirages</td><td>J♥T♥4♣</td><td>Partagé</td><td>Mise moyenne avec valeur et tirages, check le reste</td></tr>
          <tr><td>Monochrome</td><td>Q♠8♠3♠</td><td>Celui qui a la plus grosse carte de la couleur</td><td>Petite mise, peu de bluffs sans la couleur</td></tr>
          <tr><td>Pairé haut</td><td>K♣K♦4♥</td><td>Le relanceur</td><td>Petite mise très fréquente</td></tr>
          <tr><td>Pairé bas</td><td>5♠5♦2♣</td><td>Partagé (le défenseur a plus de 5x)</td><td>Petite mise, souvent</td></tr>
          </tbody></table></div>
          <p>Ce sont des tendances de solveur en pot simple (vérifie-les dans le Rapport agrégé du Solveur), pas des règles absolues : en multiway et contre des joueurs qui paient tout, mise surtout pour la valeur.</p>`],
        ['Turn et river : la texture change', `<p>Une carte qui complète des tirages (troisième carte d'une couleur, quatrième carte d'une suite) favorise celui qui a le plus de tirages : souvent le défenseur. Une carte haute (A, K) favorise souvent le relanceur préflop. Reclasse le board à chaque rue avant de décider.</p>`],
        ['Exercices corrigés', ex([
          ["Tu as ouvert au CO, la BB paie. Flop Q♣7♦2♠. Classe-le et donne ton plan.", "Haut et sec : il favorise ta range (plus de dames fortes, de surpaires). <strong>Petite mise fréquente</strong> (≈ 33 %), même avec des hauteurs."],
          ["Même spot, flop 9♥8♥6♣. Plan avec A♠K♦ ?", "Bas, connecté, avec tirage couleur : il touche la range de BB. <strong>Check</strong> le plus souvent avec AK sans cœur ; garde tes mises pour tes mains fortes et tes gros tirages."],
          ["Flop A♠J♠4♦, turn 3♠. Qui en profite ?", "Le joueur qui a le plus de piques forts. Si tu as relancé préflop avec beaucoup d'As assortis, tu as souvent l'As de pique ou le Roi ; sans pique, ralentis."],
        ])],
      ],
      mistakes: ['Miser gros sur un board sec qui ne touche personne', 'C-better automatiquement les boards bas connectés', 'Oublier de reclasser le board au turn'],
      keys: ['Hauteur, couleurs, connexion, paire', 'Board sec et haut : petite mise fréquente', 'Board bas et connecté : check plus souvent, mise polarisée'],
      quiz: [
        ['Flop K♠7♦2♣ pour le relanceur en position ?', ['Petite mise fréquente', 'Check systématique', 'Overbet'], 0, 'Avantage de range net.'],
        ['Flop 7♥6♦5♣ favorise souvent…', ['Le défenseur en grosse blinde', 'Le relanceur UTG', 'Personne'], 0, 'Deux paires et suites dans sa range.'],
        ['Sur un flop monochrome, sans la couleur, tu bluffes…', ['Peu', 'Beaucoup', 'Toujours gros'], 0, 'Les mains de la couleur paient ou relancent.'],
        ['Une quatrième carte de suite au turn favorise souvent…', ['Celui qui a le plus de tirages', 'Toujours le relanceur', 'Personne'], 0, 'Elle complète des tirages.'],
        ['Contre un joueur qui paie tout, la texture compte…', ['Moins : mise surtout pour la valeur', 'Plus que la main', 'Pour bluffer plus'], 0, 'L\'exploitation prime.'],
      ],
    });

    K.mod({
      id: 'tirages', level: 2, title: 'Jouer ses tirages : semi-bluff, gros tirages, cotes implicites', drill: 'tirage',
      goals: ['Choisir entre payer, relancer et se coucher avec un tirage', 'Reconnaître les gros tirages qui aiment le tapis', 'Utiliser les cotes implicites sans s\'en servir d\'excuse'],
      sections: [
        ['Pourquoi semi-bluffer', `<p>Un semi-bluff gagne de deux façons : l'adversaire se couche tout de suite (fold equity), ou tu touches ton tirage. Payer ne gagne que de la seconde façon. Avec un tirage, <strong>miser ou relancer</strong> est donc souvent meilleur que payer, surtout en position de relanceur ou contre un joueur qui couche.</p>
          <p>Exemple (moteur SIGMA 52) : sur K♥8♥2♣, A♥5♥ (tirage couleur à l'as) a <strong>45,9 %</strong> contre K♠Q♦. Si l'adversaire couche une fois sur trois face à une relance, le semi-bluff rapporte nettement plus que le call.</p>`],
        ['Les gros tirages', `<p>Tirage couleur + suite, tirage couleur + paire, tirage couleur à l'as + overcard : 12 à 15 outs. Ces mains sont souvent <strong>à égalité ou favorites</strong> contre une top paire. Exemple : 9♥8♥ sur 7♥6♥2♣ a encore <strong>42,1 %</strong> contre un brelan de 7. Contre une simple paire, elle est largement devant : tu peux mettre ton tapis.</p>`],
        ['Cotes implicites et inverses', `<p>Les cotes implicites (ce que tu gagnes en plus quand tu touches) justifient de payer un peu au-delà de la cote directe, <strong>si</strong> l'adversaire paiera quand tu toucheras, et <strong>si</strong> ton tirage fait les nuts. Les cotes inverses : toucher une couleur basse ou une suite par le bas peut te coûter un gros pot contre mieux.</p>
          <p>Contre un joueur serré qui ne paie pas quand la couleur arrive, les cotes implicites sont faibles : couche les petits tirages face aux grosses mises.</p>`],
        ['Exercices corrigés', ex([
          ["Flop K♥8♥2♣, tu as A♥5♥, il mise la moitié du pot. Payer ou relancer ?", "Les deux se défendent ; la relance est souvent meilleure : tu as ≈ 46 % contre une top paire et de la fold equity contre ses mains moyennes. Contre un joueur qui ne couche jamais, paie et prends tes cotes implicites."],
          ["Turn, tu as une ventrale vers la suite basse (4 outs), il mise le pot. Tu paies pour les cotes implicites ?", "Non : 8,7 % pour 33 % requis, et la suite touchée peut perdre contre une suite plus haute. Couche."],
          ["Flop 7♥6♥2♣, tu as 9♥8♥ contre un joueur qui a relancé tapis. Tu paies ?", "Oui : tu as au minimum ≈ 42 % même contre un brelan, et bien plus contre une surpaire. Un gros tirage aime le tapis."],
        ])],
      ],
      mistakes: ['Payer passivement tous ses tirages', 'Compter les cotes implicites contre un joueur qui ne paie pas', 'Courir après des tirages qui ne font pas les nuts'],
      keys: ['Semi-bluff : deux façons de gagner', 'Gros tirage = souvent favori contre une paire', 'Cotes implicites seulement si on te paiera'],
      quiz: [
        ['Un semi-bluff gagne…', ['Par fold equity ou en touchant', 'Seulement en touchant', 'Seulement si l\'adversaire bluffe'], 0, 'Deux sources d\'EV.'],
        ['9♥8♥ sur 7♥6♥2♣ contre un brelan de 7 ?', ['≈ 42 %', '≈ 10 %', '≈ 70 %'], 0, 'Moteur SIGMA 52 : 42,1 %.'],
        ['Les cotes implicites sont faibles contre…', ['Un joueur serré qui ne paie pas', 'Une calling station', 'Un maniaque'], 0, 'Il ne paiera pas quand tu touches.'],
        ['Les cotes inverses viennent surtout…', ['Des tirages qui ne font pas les nuts', 'Des tirages couleur à l\'as', 'Des brelans'], 0, 'Tu peux toucher et perdre.'],
        ['Contre un joueur qui ne couche jamais, avec un tirage…', ['Paie plutôt que de semi-bluffer', 'Relance toujours', 'Couche toujours'], 0, 'Pas de fold equity.'],
      ],
    });

    K.mod({
      id: 'blindes', level: 2, title: 'Jouer les blindes : défendre sans saigner', drill: 'vsopen',
      goals: ['Savoir pourquoi les blindes perdent de l\'argent (et combien c\'est normal)', 'Défendre la grosse blinde selon la cote', 'Jouer la petite blinde en 3-bet ou couché'],
      sections: [
        ['Les blindes perdent : c\'est normal', `<p>Tu paies une mise forcée hors de position : même un excellent joueur perd de l'argent depuis les blindes. L'objectif est de perdre <strong>moins</strong> que les autres, pas de gagner. Dans l'Analyse, compare ton résultat en BB et SB aux autres positions : c'est souvent là que se cache la plus grosse fuite.</p>`],
        ['La grosse blinde : la cote d\'abord', `<p>Face à une ouverture à 2,5 bb, tu paies 1,5 bb pour un pot de 5 bb : il te faut <strong>30 %</strong> d'équité brute. Face à 2 bb (min-relance), 1 bb pour 4 bb : <strong>25 %</strong>. La défense s'élargit donc quand la relance est petite et que l'ouvreur est en position tardive (range large).</p>
          <p>Réduis tes calls face aux grosses ouvertures (3-4 bb, fréquentes en live) et face à UTG : le prix monte et la range adverse est plus forte.</p>`],
        ['La petite blinde : 3-bet ou couché', `<p>Hors de position contre l'ouvreur <strong>et</strong> avec la grosse blinde derrière, payer depuis la SB invite la BB à squeezer ou à entrer à bon prix. La stratégie simple et solide : <strong>3-bet ou couché</strong> depuis la SB (avec quelques calls pour les joueurs avancés). Taille : environ 4 fois l'ouverture hors de position.</p>`],
        ['Après le flop en grosse blinde', `<p>Tu défends une range large et faible : tu rates souvent. Check-fold sans honte quand tu n'as rien, check-call avec paires et tirages, check-raise tes deux paires, brelans et gros tirages sur les boards qui te favorisent (module Jouer hors de position).</p>`],
        ['Exercices corrigés', ex([
          ["Le bouton ouvre à 2 bb, tu es BB avec K♣6♦. Défendre ?", "Oui : il te faut 25 % d'équité, K6o en a bien plus contre une range de bouton large. Défends, mais joue prudemment après le flop sans paire."],
          ["UTG ouvre à 3 bb en live, tu es BB avec Q♠9♦. Défendre ?", "Plutôt couché : il te faut 2 ÷ 6,5 ≈ 31 % contre une range forte qui domine Q9 (AQ, KQ, QJ). Hors de position, la main réalise mal son équité."],
          ["Le CO ouvre, tu es SB avec A♦J♣. Que fais-tu ?", "3-bet (≈ 4 fois l'ouverture). AJo domine une partie de sa range ; payer hors de position avec la BB derrière est la pire option."],
        ])],
      ],
      mistakes: ['Vouloir « gagner » depuis les blindes', 'Payer depuis la SB par habitude', 'Défendre la BB face aux grosses relances comme face aux petites'],
      keys: ['Perdre moins depuis les blindes', 'BB : la cote fixe la défense', 'SB : 3-bet ou couché'],
      quiz: [
        ['Équité requise en BB face à une ouverture à 2 bb ?', ['25 %', '33 %', '40 %'], 0, '1 bb pour un pot de 4 bb.'],
        ['Stratégie simple en petite blinde face à une ouverture ?', ['3-bet ou couché', 'Payer souvent', 'Limp'], 0, 'Payer invite la BB.'],
        ['Les blindes sont…', ['Des positions perdantes pour tout le monde', 'Les plus rentables', 'Neutres'], 0, 'Mise forcée hors de position.'],
        ['Face à une ouverture UTG à 3 bb, ta défense BB…', ['Se resserre', 'S\'élargit', 'Ne change pas'], 0, 'Prix plus élevé, range plus forte.'],
        ['En BB après le flop sans rien…', ['Check-fold sans honte', 'Donk-bet toujours', 'Check-raise toujours'], 0, 'Ta range est large et rate souvent.'],
      ],
    });

    K.mod({
      id: 'biais', level: 2, title: 'Les biais cognitifs qui coûtent de l\'argent', drill: 'situations',
      goals: ['Reconnaître les biais les plus coûteux à la table', 'Les relier à des décisions précises', 'Mettre en place un garde-fou pour chacun'],
      sections: [
        ['Pourquoi le poker les amplifie', `<p>Le poker mélange hasard à court terme et habileté à long terme, avec des résultats immédiats et visibles. C'est le terrain idéal pour les raccourcis mentaux : on tire des conclusions de quelques mains, on se souvient des coups marquants, on cherche des schémas dans le hasard.</p>`],
        ['Les sept biais à surveiller', `<div class="tw"><table class="t"><thead><tr><th>Biais</th><th>À la table</th><th>Garde-fou</th></tr></thead><tbody>
          <tr><td>Erreur du joueur</td><td>« Il a perdu 5 fois, il va gagner maintenant »</td><td>Chaque main est indépendante : la cote ne change pas</td></tr>
          <tr><td>Main chaude</td><td>« Je suis chaud, je joue plus de mains »</td><td>Tes ranges ne dépendent pas des résultats récents</td></tr>
          <tr><td>Résultat (resulting)</td><td>Juger un call par la river</td><td>Journal de décisions : juger avec l'information du moment</td></tr>
          <tr><td>Coût irrécupérable</td><td>« J'ai déjà mis beaucoup, je paie »</td><td>Seul compte ce qu'il reste à miser contre ce qu'on peut gagner</td></tr>
          <tr><td>Confirmation</td><td>Ne retenir que les bluffs d'un adversaire « bluffeur »</td><td>Notes datées et factuelles, statistiques sur échantillon</td></tr>
          <tr><td>Disponibilité</td><td>Surestimer les bad beats dont on se souvient</td><td>Compter : équité All-in EV dans l'Analyse</td></tr>
          <tr><td>Excès de confiance</td><td>Monter de limite après une bonne semaine</td><td>Règles de bankroll écrites</td></tr>
          </tbody></table></div>`],
        ['Le coût irrécupérable, cas fréquent', `<p>Ce que tu as déjà mis dans le pot ne t'appartient plus : il fait partie du pot. La question est toujours « mon équité suffit-elle pour le prix à payer maintenant ? ». Un gros pot améliore la cote, ce qui est une vraie raison de payer ; « j'ai déjà trop investi » n'en est pas une.</p>`],
        ['Exercices corrigés', ex([
          ["« Il a montré deux bluffs ce soir, c'est un bluffeur. » Quel biais, et que faire ?", "Biais de confirmation et petit échantillon. Note les faits datés, compte aussi ses mains fortes montrées, et attends un échantillon suffisant avant de payer plus large."],
          ["Tu as payé le flop et le turn avec un tirage raté. River, il mise, tu n'as que hauteur roi. « Je ne peux pas lâcher maintenant. » Réponse ?", "Coût irrécupérable. Hauteur roi ne bat aucun bluff qui a une paire ; si tu ne bats que des bluffs qu'il n'a pas, couche."],
          ["Après 6 sessions gagnantes, tu veux monter de deux limites. Biais ?", "Excès de confiance et main chaude. 6 sessions ne mesurent pas ton winrate ; suis la règle de montée (bankroll) et un essai encadré."],
        ])],
      ],
      mistakes: ['Expliquer le hasard par des « séries »', 'Payer pour « protéger » ce qu\'on a déjà mis', 'Retenir seulement les mains qui confirment une idée'],
      keys: ['Chaque main est indépendante', 'L\'argent déjà misé appartient au pot', 'Des faits datés, pas des impressions'],
      quiz: [
        ['« J\'ai déjà mis beaucoup, je dois payer » est…', ['Le biais du coût irrécupérable', 'Une bonne raison', 'De la gestion de bankroll'], 0, 'Seuls comptent le prix et l\'équité actuels.'],
        ['Après 5 pertes de suite, tes chances au prochain all-in…', ['Ne changent pas', 'Augmentent', 'Baissent'], 0, 'Les mains sont indépendantes.'],
        ['Juger un call par la carte de la river, c\'est…', ['Le « resulting »', 'La bonne méthode', 'De la variance'], 0, 'On juge avec l\'information du moment.'],
        ['Le garde-fou contre l\'excès de confiance ?', ['Des règles de bankroll écrites', 'Jouer plus', 'Changer de room'], 0, 'Une règle écrite avant ne se renégocie pas.'],
        ['Surestimer les bad beats dont on se souvient, c\'est…', ['Le biais de disponibilité', 'La réalité', 'Du tilt de confiance'], 0, 'Compte l\'All-in EV.'],
      ],
    });

    // ================= Niveau 3 =================
    K.mod({
      id: 'pots3bet', level: 3, title: 'Les pots 3-bet : relanceur et défenseur', drill: 'vsopen',
      goals: ['Comprendre le SPR d\'un pot 3-bet', 'Jouer en relanceur : petite c-bet fréquente', 'Défendre sans payer trop large'],
      sections: [
        ['Un pot plus gros, des tapis plus courts', `<p>À 100 bb, une ouverture à 2,5 bb, un 3-bet à 9 bb en position et un call donnent un pot d'environ 19,5 bb pour ≈ 91 bb derrière : <strong>SPR ≈ 4,5</strong>. Une top paire bon kicker et une surpaire sont presque toujours prêtes pour le tapis. Hors de position, le 3-bet est plus gros (≈ 11-12 bb) et le SPR plus bas.</p>`],
        ['En relanceur (3-bettor)', `<p>Ta range est plus forte que celle du défenseur sur la plupart des flops, surtout hauts : <strong>petite c-bet (25-33 %) très fréquente</strong>. Sur les boards bas et connectés (7-6-5), le défenseur a plus de deux paires et de suites : mise moins souvent. Avec une surpaire, pas de contrôle de pot : vise le tapis en trois rues ou moins.</p>`],
        ['En défenseur', `<p>Paie un 3-bet avec des mains qui jouent bien après le flop et ne sont pas dominées : paires moyennes, assorties fortes (AQs, KQs, JTs). Couche les mains dépareillées dominées (AJo, KQo hors de position contre un 3-bettor serré). Face à un 3-bettor très agressif, ajoute des 4-bets (valeur et quelques bluffs à bloqueurs, A5s).</p>`],
        ['Exercices corrigés', ex([
          ["Tu as 3-bet au bouton avec A♠K♠, le CO paie. Flop K♦7♣2♥. Plan ?", "Petite c-bet (≈ 33 %) avec ta range, AK compris : SPR ≈ 4,5, tu vises le tapis en trois rues avec top paire meilleur kicker."],
          ["Tu ouvres au CO avec A♥Q♦, le bouton 3-bet. Sa range est QQ+, AK, A5s-A4s, KQs. Ton équité ?", "Moteur SIGMA 52 : <strong>36,4 %</strong> (33 combos). Hors de position, contre une range aussi forte, AQo se couche souvent, ou paie seulement contre un 3-bettor plus large."],
          ["Pot 3-bet, flop 7♥6♥5♠, tu es le 3-bettor avec A♣A♦. Mises-tu ?", "Plutôt check ou petite mise selon l'adversaire : le board touche la range du défenseur (suites, deux paires). Tu gardes une main forte dans ta range de check et évites de te faire relancer hors de prix."],
        ])],
      ],
      mistakes: ['Contrôler le pot avec une surpaire à SPR 4', 'Payer les 3-bets avec AJo, KQo hors de position', 'C-better automatiquement les boards bas connectés'],
      keys: ['SPR ≈ 4-5 : une paire forte va à tapis', 'Relanceur : petite c-bet fréquente', 'Défense : mains jouables, pas dominées'],
      quiz: [
        ['SPR typique d\'un pot 3-bet en position à 100 bb ?', ['≈ 4,5', '≈ 12', '≈ 1'], 0, 'Pot ≈ 19,5 bb, ≈ 91 bb derrière.'],
        ['En 3-bettor sur un flop haut, la c-bet est…', ['Petite et fréquente', 'Grosse et rare', 'Toujours un overbet'], 0, 'Avantage de range.'],
        ['AQo contre QQ+, AK, A5s-A4s, KQs ?', ['≈ 36 %', '≈ 55 %', '≈ 20 %'], 0, 'Moteur SIGMA 52 : 36,4 %.'],
        ['Face à un 3-bettor très agressif, tu ajoutes…', ['Des 4-bets', 'Plus de folds', 'Des limps'], 0, 'Valeur plus large et quelques bluffs à bloqueurs.'],
        ['Une main à éviter en défense de 3-bet hors de position ?', ['KQo contre un 3-bettor serré', 'JJ', 'AKs'], 0, 'Souvent dominée.'],
      ],
    });

    K.mod({
      id: 'tapiscourts', level: 3, title: 'Tournois de 10 à 25 bb : resteal, 3-bet tapis, reshove', drill: 'pushfold',
      goals: ['Jouer la zone de 10 à 25 bb, où se décident les tournois', 'Choisir entre ouvrir, ouvrir-pousser et tapis direct', 'Utiliser la fold equity des autres tapis'],
      sections: [
        ['Trois zones', `<div class="tw"><table class="t"><thead><tr><th>Tapis</th><th>Ouverture</th><th>Face à une ouverture</th></tr></thead><tbody>
          <tr><td>Moins de 12 bb</td><td>Tapis ou couché (outil Push/Fold)</td><td>Tapis ou couché</td></tr>
          <tr><td>12 à 20 bb</td><td>Petite ouverture (2 à 2,2 bb) avec les mains qui supportent un tapis ; tapis direct avec les mains moyennes qui jouent mal</td><td>3-bet tapis (resteal) avec une range plus large que les mains « premium »</td></tr>
          <tr><td>20 à 25 bb</td><td>Ouverture normale, 3-bet/tapis possible</td><td>3-bet/tapis ou 3-bet petit, peu de calls hors de position</td></tr>
          </tbody></table></div>`],
        ['Le resteal', `<p>Un joueur en position tardive ouvre large (vol) ; tu as 15 à 20 bb en blinde : <strong>tapis</strong> avec une range qui inclut les As moyens, les paires et les broadways. Tu gagnes souvent le pot sans abattage (ouverture + blindes + antes, ≈ 4 à 5 bb), et quand on te paie, tu as souvent 30 à 50 % d'équité.</p>`],
        ['La fold equity se calcule', `<p>EV d'un tapis = P(couchent) × pot actuel + P(paient) × (équité × pot final − mise). Plus le pot est gros par rapport à ton tapis (antes, ouverture), plus le tapis rapporte. C'est pourquoi on pousse plus large avec les antes. L'outil Push/Fold & ICM donne les ranges ; l'ICM les resserre près des places payées.</p>`],
        ['Exercices corrigés', ex([
          ["10 bb au bouton, tout le monde se couche. Tu as K♥8♦. Que fais-tu ?", "Tapis : à 10 bb, K8o est largement dans la range de push du bouton (vérifie dans l'outil Push/Fold). Ouvrir petit puis coucher face à un tapis gâcherait ton équité."],
          ["18 bb en grosse blinde, le CO (large) ouvre à 2,2 bb. Tu as A♦9♣. Plan ?", "Resteal à tapis : tu gagnes ≈ 5 bb sans abattage souvent, et A9 garde une bonne équité quand on paie. Payer hors de position avec 18 bb est la pire option."],
          ["Près de la bulle, 15 bb, un gros tapis pousse. Tu as A♠J♦. Pourquoi coucher peut être correct ?", "L'ICM augmente l'équité requise : perdre t'élimine sans gain, doubler rapporte moins en valeur. Vérifie la range ICM dans l'outil."],
        ])],
      ],
      mistakes: ['Ouvrir puis coucher face au tapis avec 12 bb', 'Payer hors de position avec 15-20 bb', 'Ignorer les antes dans la taille du pot'],
      keys: ['Moins de 12 bb : tapis ou couché', '15-20 bb : resteal contre les vols', 'Les antes élargissent les tapis'],
      quiz: [
        ['Avec 10 bb, la stratégie standard est…', ['Tapis ou couché', 'Limp', 'Ouvrir à 3 bb'], 0, 'Sous 12 bb, push/fold.'],
        ['Le resteal, c\'est…', ['Un 3-bet tapis contre un vol', 'Un limp-call', 'Une c-bet'], 0, 'On reprend le vol.'],
        ['Les antes rendent les tapis…', ['Plus rentables', 'Moins rentables', 'Identiques'], 0, 'Plus d\'argent mort.'],
        ['Près de la bulle, un call de tapis doit être…', ['Plus serré', 'Plus large', 'Identique'], 0, 'Prime de risque ICM.'],
        ['18 bb hors de position face à une ouverture…', ['Tapis ou couché, rarement call', 'Toujours call', 'Toujours couché'], 0, 'Le call joue mal à ce tapis.'],
      ],
    });

    K.mod({
      id: 'satellites', level: 3, title: 'Satellites : la stratégie la plus différente du poker', drill: 'pushfold',
      goals: ['Comprendre pourquoi les jetons perdent leur valeur une fois la place acquise', 'Jouer la bulle d\'un satellite', 'Savoir quand coucher une main très forte'],
      sections: [
        ['Le principe', `<p>Dans un satellite, toutes les places payées gagnent le même prix (un ticket). Le vainqueur ne gagne rien de plus que le dernier qualifié. Conséquence : un jeton de plus ne vaut <strong>presque rien</strong> pour un joueur déjà qualifié, et chaque jeton perdu peut tout coûter. C'est l'ICM poussé à l'extrême.</p>`],
        ['Avant la bulle', `<p>Accumule normalement, un peu plus prudemment qu'en tournoi classique. L'objectif n'est pas de finir premier, mais d'avoir assez de jetons pour être en sécurité à l'approche de la bulle.</p>`],
        ['À la bulle', `<p>Calcule ta situation : combien de places restent, combien de joueurs, où se trouvent les petits tapis. Si ta place est presque sûre (les petits tapis seront éliminés avant toi), <strong>couche presque tout</strong>, même AA face à un tapis qui pourrait t'éliminer. Les gros tapis attaquent les tapis moyens, qui ne peuvent pas payer. Les petits tapis doivent pousser pour survivre.</p>`],
        ['Exercices corrigés', ex([
          ["Satellite, 10 places, 11 joueurs restants. Tu es 3e avec 25 bb, deux joueurs ont moins de 3 bb. Un tapis moyen pousse, tu as K♠K♦. Que fais-tu ?", "Souvent <strong>couché</strong>. Tu es quasi qualifié en attendant l'élimination d'un petit tapis ; payer et perdre peut te coûter le ticket, gagner ne rapporte rien de plus."],
          ["Même satellite, tu as 2 bb. Plan ?", "Pousse dès que possible avec une main correcte : il te faut doubler, et les gros tapis ne te paieront qu'avec des mains fortes."],
          ["Tu es le plus gros tapis, deux tapis moyens se protègent. Ton plan ?", "Ouvre très large contre eux : ils ne peuvent pas payer sans risquer leur place. Évite de payer les tapis des petits joueurs avec des mains marginales qui te mettraient en danger."],
        ])],
      ],
      mistakes: ['Jouer pour gagner le satellite plutôt que pour la place', 'Payer un tapis quand on est déjà qualifié', 'Oublier de compter les places restantes'],
      keys: ['Toutes les places valent le même prix', 'Qualifié = coucher presque tout', 'Gros tapis : attaquer les tapis moyens'],
      quiz: [
        ['Dans un satellite, le premier gagne…', ['La même chose que le dernier qualifié', 'Plus de tickets', 'Le prize pool'], 0, 'Un ticket chacun.'],
        ['Quasi qualifié, face à un tapis, avec AA…', ['Coucher peut être correct', 'Payer toujours', 'Relancer'], 0, 'Gagner ne rapporte rien, perdre coûte tout.'],
        ['Le gros tapis à la bulle…', ['Attaque les tapis moyens', 'Se couche', 'Paie tout'], 0, 'Ils ne peuvent pas payer.'],
        ['Avec 2 bb, tu…', ['Pousses vite', 'Attends AA', 'Limpes'], 0, 'Il faut doubler.'],
        ['L\'ICM d\'un satellite est…', ['Extrême', 'Nul', 'Identique au cash'], 0, 'Les jetons au-delà de la place ne valent presque rien.'],
      ],
    });

    K.mod({
      id: 'plo2', level: 3, title: 'PLO après le flop : wraps, nuts et bloqueurs', drill: 'outs',
      goals: ['Compter les outs d\'un wrap', 'Jouer pour les nuts plutôt que pour une main moyenne', 'Utiliser les bloqueurs en Omaha'],
      sections: [
        ['Les wraps', `<p>En Omaha, quatre cartes en main créent des tirages suite énormes. Exemple classique : J-T-7-6 sur un flop 9-8-2 : les Q, J, T, 7, 6 et 5 complètent une suite, soit <strong>20 outs</strong> (3 J, 3 T, 3 7, 3 6, 4 Q, 4 5). Un wrap de 20 outs est souvent favori contre un brelan sans tirage. Les outs « propres » (qui font les nuts) valent plus que ceux qui font une suite battable.</p>`],
        ['Jouer pour les nuts', `<p>Avec quatre cartes chacun, quelqu'un a souvent la meilleure main possible. Un brelan sur un board connecté et assorti, une couleur non max ou une suite par le bas perdent de gros pots. Règle de base : on met son tapis avec <strong>les nuts ou un tirage aux nuts</strong>, rarement avec une main moyenne. Le pot-limit limite les mises : on peut voir les rues suivantes moins cher qu'en no-limit.</p>`],
        ['Les bloqueurs en PLO', `<p>Tenir l'as de la couleur bloque la couleur max : il rend crédible un bluff quand la couleur arrive, et dit que l'adversaire ne peut pas avoir les nuts couleur. De même, tenir deux cartes de la suite nuts réduit ses combinaisons. Les bluffs PLO se choisissent surtout avec ces cartes.</p>`],
        ['Exercices corrigés', ex([
          ["Flop 9♦8♣2♥, tu as J♠T♥7♦6♣. Combien d'outs pour une suite ?", "<strong>20</strong> : Q (4), J (3), T (3), 7 (3), 6 (3), 5 (4)."],
          ["Board final K♥9♥4♥2♣7♠, tu as A♥Q♠J♦T♣ (un seul cœur, rien à l'abattage). L'adversaire checke. Bluffer ?", "Bon candidat : tu ne peux pas avoir la couleur (un seul cœur), mais tu bloques la couleur max ; ta mise représente bien une couleur que l'adversaire ne peut pas avoir à l'as. Contre un joueur qui paie avec n'importe quelle couleur, abstiens-toi."],
          ["Flop T♠9♠8♦, tu as un brelan de 8 (8♥8♣ A♦3♣). Mettre ton tapis ?", "Prudence : board très connecté avec tirage couleur, le brelan n'est pas les nuts (suites déjà possibles) et a beaucoup de cartes contre lui. Contrôle le pot sauf lecture claire."],
        ])],
      ],
      mistakes: ['Jouer un brelan comme les nuts sur un board connecté', 'Compter des outs qui font une suite battable', 'Bluffer sans bloqueur pertinent'],
      keys: ['Un wrap peut faire 20 outs', 'Tapis avec les nuts ou un tirage aux nuts', 'L\'as de la couleur est le bloqueur clé'],
      quiz: [
        ['J-T-7-6 sur 9-8-2 : combien d\'outs ?', ['20', '8', '13'], 0, 'Q, J, T, 7, 6, 5.'],
        ['En PLO, on met son tapis surtout avec…', ['Les nuts ou un tirage aux nuts', 'Toute top paire', 'Un brelan sur n\'importe quel board'], 0, 'Quelqu\'un a souvent mieux.'],
        ['Le bloqueur le plus utile quand la couleur arrive ?', ['L\'as de la couleur', 'Une paire basse', 'Un roi d\'une autre couleur'], 0, 'Il bloque la couleur max.'],
        ['Combien de cartes de la main utilise-t-on ?', ['Exactement deux', 'Une ou deux', 'Jusqu\'à quatre'], 0, 'Règle de l\'Omaha.'],
        ['Un brelan sur T♠9♠8♦ en PLO est…', ['Vulnérable', 'Les nuts', 'Imbattable'], 0, 'Suites possibles et tirages.'],
      ],
    });

    // ================= Niveau 4 =================
    K.mod({
      id: 'bluffcatch', level: 4, title: 'Bluff-catching à la river : la méthode complète', drill: 'mdf',
      goals: ['Construire la range adverse à la river', 'Compter valeur et bluffs combo par combo', 'Décider avec la cote, puis ajuster au profil'],
      sections: [
        ['La méthode en quatre étapes', `<ol><li>Range adverse à la river : reconstruis-la rue par rue (préflop, flop, turn).</li><li>Sépare <strong>valeur</strong> (mains qui te battent) et <strong>bluffs</strong> (mains que tu bats). Les mains moyennes checkent souvent : elles sortent de sa range de mise.</li><li>Compte les combos de chaque groupe, en retirant tes bloqueurs.</li><li>Compare la part de bluffs à l'équité requise : B ÷ (P + 2B).</li></ol>`],
        ['Exemple chiffré', `<p>River, pot 100, il mise 75 : il te faut 75 ÷ 250 = <strong>30 %</strong>. Sa range de mise : sets (9 combos), deux paires (6), tirages couleur ratés (12), tirages suite ratés (8). Valeur = 15, bluffs = 20 : bluffs = 20 ÷ 35 = <strong>57 %</strong>. Tu paies largement… si ces tirages ratés bluffent vraiment. Contre un joueur qui abandonne ses tirages ratés (fréquent en petites limites), retire-les : la décision s'inverse.</p>`],
        ['Les ajustements', `<ul><li><strong>Profil</strong> : un passif bluffe peu à la river ; un agressif bluffe plus. La population des petites limites bluffe moins qu'à l'équilibre.</li><li><strong>Taille</strong> : une très grosse mise d'un joueur récréatif est souvent la valeur.</li><li><strong>Bloqueurs</strong> : préfère payer avec des mains qui bloquent sa valeur et ne bloquent pas ses bluffs.</li></ul>`],
        ['Exercices corrigés', ex([
          ["Il mise le pot. Sa range : 10 combos de valeur, 4 de bluff. Tu paies ?", "Il te faut 33 % ; il bluffe 4 ÷ 14 ≈ 29 %. Couche (de peu). Si un de tes bloqueurs retire 3 combos de valeur, 4 ÷ 11 ≈ 36 % : paie."],
          ["Il mise un tiers du pot à la river. Équité requise ?", "1/3 ÷ (1 + 2/3) = <strong>20 %</strong>. Les petites mises se paient très large : il suffit d'un bluff pour quatre mains de valeur."],
          ["Joueur passif, ligne check-call, check-call, puis grosse mise river. Ton bluff-catcher ?", "Couche le plus souvent : un passif qui se réveille à la river avec une grosse mise a presque toujours de la valeur."],
        ])],
      ],
      mistakes: ['Payer « pour voir »', 'Compter les mains moyennes dans sa range de mise', 'Oublier ses propres bloqueurs'],
      keys: ['Valeur contre bluffs, combo par combo', 'Comparer à B ÷ (P + 2B)', 'Le profil passe avant l\'équilibre'],
      quiz: [
        ['Mise de 75 dans 100 : équité requise ?', ['30 %', '43 %', '25 %'], 0, '75 ÷ 250.'],
        ['Valeur 15 combos, bluffs 20 : part de bluffs ?', ['≈ 57 %', '≈ 43 %', '≈ 75 %'], 0, '20 ÷ 35.'],
        ['Un bon bluff-catcher bloque…', ['Sa valeur', 'Ses bluffs', 'Rien'], 0, 'Il rend ses bluffs plus probables.'],
        ['Un passif qui mise gros à la river a souvent…', ['De la valeur', 'Un bluff', 'Un tirage'], 0, 'Tendance de population.'],
        ['Mise d\'un tiers du pot : équité requise ?', ['20 %', '33 %', '25 %'], 0, 'B ÷ (P + 2B).'],
      ],
    });

    K.mod({
      id: 'polaris', level: 4, title: 'Ranges polarisées, fusionnées, plafonnées : choisir sa taille', drill: 'mdf',
      goals: ['Reconnaître la forme de sa range et de celle de l\'adversaire', 'Relier la forme à la taille de mise', 'Attaquer une range plafonnée'],
      sections: [
        ['Trois formes', `<div class="tw"><table class="t"><thead><tr><th>Forme</th><th>Contenu</th><th>Taille typique</th></tr></thead><tbody>
          <tr><td>Polarisée</td><td>Mains très fortes et bluffs, pas de mains moyennes</td><td>Grosse : 75 % à overbet</td></tr>
          <tr><td>Fusionnée (linéaire)</td><td>Mains fortes et moyennes, peu de bluffs</td><td>Petite à moyenne : 25 à 50 %</td></tr>
          <tr><td>Plafonnée (condensée)</td><td>Surtout des mains moyennes, peu de nuts</td><td>Souvent check ou petite mise ; elle subit la pression</td></tr>
          </tbody></table></div>`],
        ['Pourquoi la taille suit la forme', `<p>Une grosse mise fait coucher les mains moyennes et ne se fait payer que par mieux… ou par des bluff-catchers : elle convient quand tu as les nuts ou rien. Une petite mise se fait payer par beaucoup de mains moins bonnes : elle convient à une range fusionnée qui veut de la valeur fine et protéger ses mains moyennes.</p>`],
        ['Attaquer une range plafonnée', `<p>Quand l'adversaire a payé deux rues sans relancer sur un board qui permettait des mains fortes, sa range est souvent plafonnée (il aurait relancé ses meilleures mains). C'est le moment des <strong>overbets polarisés</strong> : il ne peut pas payer souvent avec des mains moyennes. Condition : ta range doit contenir des nuts qu'il n'a pas.</p>`],
        ['Exercices corrigés', ex([
          ["Flop K♠8♦3♣, turn A♥. Tu as misé le flop, il a payé. Ta range contient AK, AA, KK ; la sienne surtout Kx et 8x. Taille au turn ?", "Overbet polarisé (125-150 %) avec AK, sets et des bluffs choisis : il a une range plafonnée qui ne peut pas payer souvent."],
          ["River sur un board sec, tu as top paire kicker moyen contre un joueur qui paie avec toute paire. Taille ?", "Petite à moyenne (33-50 %) : range fusionnée, tu veux être payé par les paires moins bonnes."],
          ["Il check-raise le flop puis mise gros à chaque rue. Forme de sa range ?", "Polarisée : mains très fortes et semi-bluffs. Ton bluff-catcher doit bloquer sa valeur et battre ses tirages ratés."],
        ])],
      ],
      mistakes: ['Overbetter une range fusionnée', 'Miser petit avec une range polarisée', 'Attaquer une range qui n\'est pas plafonnée'],
      keys: ['Polarisée : grosse mise', 'Fusionnée : petite mise', 'Range plafonnée : overbet si tu as les nuts'],
      quiz: [
        ['Une range polarisée contient…', ['Des nuts et des bluffs', 'Surtout des mains moyennes', 'Seulement des tirages'], 0, 'Pas de mains moyennes.'],
        ['Taille adaptée à une range fusionnée ?', ['Petite à moyenne', 'Overbet', 'Tapis'], 0, 'On veut être payé par moins bon.'],
        ['Une range plafonnée…', ['Contient peu de mains très fortes', 'Contient les nuts', 'Ne contient que des bluffs'], 0, 'Il aurait relancé ses meilleures mains.'],
        ['Condition pour l\'overbet ?', ['Avoir des nuts qu\'il n\'a pas', 'Avoir une main moyenne', 'Être hors de position'], 0, 'Avantage de nuts.'],
        ['Check-raise flop puis grosses mises : sa range est…', ['Polarisée', 'Fusionnée', 'Plafonnée'], 0, 'Valeur forte et semi-bluffs.'],
      ],
    });

    K.mod({
      id: 'etudes', level: 4, title: 'Études de cas : huit mains commentées de bout en bout', drill: 'situations',
      goals: ['Appliquer toute la méthode sur des mains complètes', 'Chiffrer chaque décision', 'Repérer les erreurs fréquentes en situation'],
      sections: [
        ['Main 1 : la c-bet de valeur', `<p>NL25, 100 bb. Tu ouvres au CO avec K♥J♥, la BB paie. Flop K♦7♣2♠ (pot 5,5 bb). Contre une range de défense BB large, K♥J♥ a <strong>85,2 %</strong> (moteur SIGMA 52, 267 combos). Mise 1/3 du pot : les paires de 7, les as hauteur et les Kx plus faibles paient. Turn 4♥ : continue (≈ 50-66 %). River brique : troisième mise de valeur, plus petite si l'adversaire est passif et serré.</p>`],
        ['Main 2 : la surpaire qui doit ralentir', `<p>NL50. UTG ouvre, tu paies au CO avec J♣J♦. Flop A♠8♦3♣, UTG mise. Contre une range d'ouverture UTG serrée qui continue (TT+, AQ+, AJs, KQs), JJ n'a que <strong>23,5 %</strong>. Paie une fois si l'adversaire bluffe assez, couche face à une deuxième grosse mise d'un joueur serré.</p>`],
        ['Main 3 : le gros tirage', `<p>Tu as 9♥8♥ sur 7♥6♥2♣ contre un tapis : même contre un brelan, <strong>42,1 %</strong>. Contre une surpaire, bien plus. C'est un call de tapis presque automatique.</p>`],
        ['Main 4 : AQ face au 3-bet', `<p>Tu ouvres au CO avec A♥Q♦, le bouton 3-bet, sa range est QQ+, AK, A5s-A4s, KQs : <strong>36,4 %</strong>. Hors de position contre une range aussi serrée, le fold est correct ; contre un 3-bettor large, le call ou le 4-bet redeviennent bons.</p>`],
        ['Main 5 : le brelan contre le tirage', `<p>8♠8♦ sur 9♣8♥4♥ contre A♥9♥ (paire + tirage couleur à l'as) : <strong>70,2 %</strong> pour le brelan. Mise grosse au flop : son tirage paie, et le turn peut te coûter cher.</p>`],
        ['Mains 6 à 8 : les erreurs classiques', `<ul><li><strong>Le bluff contre une station</strong> : tu tires trois balles avec un tirage raté contre un joueur qui paie tout. Résultat prévisible : il paie avec deuxième paire. Contre lui, abandonne à la river.</li><li><strong>La relance river d'un passif</strong> : tu as top paire, un joueur qui n'a jamais relancé relance la river. Couche : en petites limites, c'est presque toujours la valeur.</li><li><strong>Le call de tapis à la bulle</strong> : tapis moyen, tu paies le tapis du chip leader avec A♠J♦. En cash, call correct ; en ICM, souvent fold (module Tournois avancés).</li></ul>`],
        ['Exercices corrigés', ex([
          ["Refais la main 2 avec un adversaire maniaque qui mise tous les flops. Que change-t-il ?", "Sa range de mise contient beaucoup plus de mains que tu bats : JJ devient un bluff-catcher correct ; paie plus loin, surtout si les cartes suivantes ne sont pas des as."],
          ["Main 5 : turn 2♥ (couleur possible). Que fais-tu ?", "Ton brelan a encore des outs (full) mais n'est plus devant contre A♥9♥. Ralentis ; contre une grosse mise, paie avec tes cotes vers le full plutôt que de relancer."],
          ["Quelle main de ces huit se joue différemment en tournoi qu'en cash ?", "La main 8 : la prime de risque ICM rend le call de tapis plus serré à la bulle."],
        ])],
      ],
      mistakes: ['Juger une main sans range adverse', 'Ne pas chiffrer l\'équité', 'Appliquer une ligne contre tous les profils'],
      keys: ['Une main = une suite de décisions chiffrées', 'Le profil adverse change la meilleure ligne', 'Cash et tournoi ne se jouent pas pareil près de la bulle'],
      quiz: [
        ['K♥J♥ sur K♦7♣2♠ contre une range de défense BB large ?', ['≈ 85 %', '≈ 55 %', '≈ 40 %'], 0, 'Moteur SIGMA 52 : 85,2 %.'],
        ['JJ sur A♠8♦3♣ contre une range UTG qui continue ?', ['≈ 24 %', '≈ 50 %', '≈ 70 %'], 0, 'Moteur SIGMA 52 : 23,5 %.'],
        ['88 sur 9♣8♥4♥ contre A♥9♥ ?', ['≈ 70 %', '≈ 50 %', '≈ 90 %'], 0, 'Moteur SIGMA 52 : 70,2 %.'],
        ['Contre une station, avec un tirage raté à la river…', ['Abandonne', 'Bluffe gros', 'Bluffe petit'], 0, 'Elle paie.'],
        ['Quelle main change en ICM ?', ['Le call de tapis à la bulle', 'La c-bet de valeur', 'Le gros tirage'], 0, 'Prime de risque.'],
      ],
    });

    // ================= Niveau 5 =================
    K.mod({
      id: 'notes_live', level: 5, title: 'Noter et revoir ses sessions live', drill: 'situations',
      goals: ['Prendre des notes utiles sans gêner la partie', 'Transformer une session live en données', 'Revoir ses mains live comme en ligne'],
      sections: [
        ['Pendant la session', `<p>Pas d'historique automatique en live : tu notes. Après une main importante (pas pendant), en quelques mots sur ton téléphone, hors de la table si la salle l'exige : « BTN, AQo, 3-bet joueur 4 (large), flop A72, check-call deux rues, il montre A5 ». Note aussi les mains montrées par les adversaires : ce sont tes meilleures informations sur eux.</p>
          <p>Respecte la règle de la salle sur les téléphones : aucun appareil sur la table ni pendant une main (règles TDA).</p>`],
        ['Après la session', `<ol><li>Saisis la session dans le Journal : durée, résultat, limite, état mental.</li><li>Réécris tes 3 mains clés au format complet (module « Lire et raconter une main »).</li><li>Revois-les : équité dans les Outils, situation dans le Solveur si elle se prête à deux joueurs.</li><li>Mets à jour tes fiches adversaires (réguliers de la salle).</li></ol>`],
        ['Mesurer le live', `<p>Le résultat live se mesure en <strong>bb par heure</strong> sur des centaines d'heures. Compte aussi le rake par pot, les pourboires et les frais de déplacement : ce sont des coûts réels, souvent oubliés.</p>`],
        ['Exercices corrigés', ex([
          ["Écris une note utile sur un adversaire qui a montré 7-2 assorti après une relance au bouton.", "« 15/10, joueur siège 6 : relance BTN avec 7♦2♦ et c-bet flop, abandonne au turn. » Un fait daté et précis, pas « fou »."],
          ["Session de 5 heures en 1/2 €, +120 €. Résultat en bb par heure ?", "120 € = 60 bb ; 60 ÷ 5 = <strong>12 bb par heure</strong>. Un seul chiffre ne dit rien : c'est la moyenne sur des centaines d'heures qui compte."],
          ["Pourquoi revoir aussi les mains gagnées ?", "Une main gagnée peut cacher une erreur (mauvaise taille, valeur manquée). Les gains aussi se revoient."],
        ])],
      ],
      mistakes: ['Noter pendant une main', 'Ne garder que le résultat de la soirée', 'Oublier rake, pourboires et frais'],
      keys: ['Notes brèves, après la main, faits datés', '3 mains clés réécrites par session', 'bb par heure sur des centaines d\'heures'],
      quiz: [
        ['Quand noter une main en live ?', ['Après la main, hors action', 'Pendant la main', 'Jamais'], 0, 'Aucun appareil pendant une main.'],
        ['+120 € en 5 h à 1/2 € : bb par heure ?', ['12', '24', '6'], 0, '60 bb sur 5 h.'],
        ['La meilleure information sur un adversaire live ?', ['Les mains qu\'il montre', 'Sa tenue', 'Ce qu\'il dit de lui'], 0, 'Des faits vérifiés.'],
        ['Le résultat live se mesure en…', ['bb par heure', 'bb par 100 mains', 'Euros par soirée'], 0, 'Peu de mains par heure.'],
        ['Les coûts souvent oubliés ?', ['Rake, pourboires et frais', 'La cave', 'Les jetons'], 0, 'Ils pèsent sur le résultat.'],
      ],
    });

    // ================= Niveau 6 =================
    K.mod({
      id: 'histoire', level: 6, title: 'Histoire du poker et de l\'IA : ce qui a façonné le jeu moderne', drill: 'situations',
      goals: ['Connaître les grandes étapes du poker moderne', 'Comprendre ce que l\'IA a changé', 'Situer les outils d\'aujourd\'hui (solveurs, RTA) dans cette histoire'],
      sections: [
        ['Du saloon à la télévision', `<ul><li><strong>1970</strong> : première World Series of Poker au Binion's Horseshoe de Las Vegas.</li><li><strong>1979</strong> : Super/System de Doyle Brunson, premier grand livre de stratégie écrit par un champion.</li><li><strong>Années 1990-2000</strong> : premières salles en ligne, puis caméras sous la table qui montrent les cartes à la télévision.</li><li><strong>2003</strong> : Chris Moneymaker, qualifié en ligne, gagne le Main Event : l'« effet Moneymaker » attire des millions de joueurs.</li><li><strong>2011</strong> : le « Black Friday » aux États-Unis ferme l'accès de plusieurs grandes rooms aux joueurs américains.</li></ul>`],
        ['L\'arrivée de l\'IA', `<ul><li><strong>2015</strong> : l'équipe de l'université de l'Alberta publie Cepheus, qui résout essentiellement le tête-à-tête limit hold'em.</li><li><strong>2017</strong> : Libratus (Carnegie Mellon) bat des professionnels en tête-à-tête no-limit sur environ 120 000 mains.</li><li><strong>2019</strong> : Pluribus (Carnegie Mellon et Facebook) bat des professionnels à six joueurs.</li></ul>
          <p>Ces programmes reposent sur la minimisation du regret (CFR), la même famille d'algorithmes que le solveur de SIGMA 52 (Discounted CFR).</p>`],
        ['Ce que cela a changé', `<p>Les solveurs ont rendu publiques des stratégies proches de l'équilibre : petites c-bets fréquentes, overbets, check-raises plus nombreux, ranges mixtes. Le niveau moyen des réguliers a monté. En retour, l'aide en temps réel (RTA) est devenue la principale menace pour l'intégrité du jeu en ligne, et les rooms investissent dans sa détection. D'où la règle de SIGMA 52 : on étudie avant et après, jamais pendant.</p>`],
        ['Exercices corrigés', ex([
          ["Quel algorithme partagent Libratus, Pluribus et le solveur de SIGMA 52 ?", "La minimisation du regret contrefactuel (CFR), dans des variantes différentes."],
          ["Pourquoi l'« effet Moneymaker » a-t-il changé le marché ?", "Un amateur qualifié en ligne pour une petite somme a gagné le titre le plus prestigieux : des millions de nouveaux joueurs se sont inscrits en ligne, ce qui a rendu les parties plus faibles et plus nombreuses pendant des années."],
          ["Quelle conséquence des solveurs pour un joueur de petites limites aujourd'hui ?", "Les réguliers jouent mieux qu'il y a quinze ans ; l'avantage vient davantage de l'exploitation des récréatifs et de la sélection de table que de « coups » inconnus des autres."],
        ])],
      ],
      mistakes: ['Croire que l\'IA a « résolu » tout le poker', 'Confondre étude au solveur et aide en temps réel', 'Ignorer que le niveau moyen a monté'],
      keys: ['1970 WSOP, 2003 Moneymaker, 2011 Black Friday', '2015 Cepheus, 2017 Libratus, 2019 Pluribus', 'CFR : la base des solveurs'],
      quiz: [
        ['Pluribus (2019) a battu des pros…', ['À six joueurs', 'Uniquement en tête-à-tête', 'En Omaha'], 0, 'Première IA à le faire en partie à plusieurs.'],
        ['Libratus jouait…', ['Du no-limit en tête-à-tête', 'Du limit à six', 'Du Stud'], 0, '2017, Carnegie Mellon.'],
        ['Le Main Event 2003 a été gagné par…', ['Un amateur qualifié en ligne', 'Un pro de cash', 'Une IA'], 0, 'Chris Moneymaker.'],
        ['La famille d\'algorithmes des solveurs ?', ['CFR (minimisation du regret)', 'Réseaux de neurones seuls', 'Tirages au hasard'], 0, 'SIGMA 52 utilise Discounted CFR.'],
        ['Cepheus (2015) a essentiellement résolu…', ['Le tête-à-tête limit hold\'em', 'Le no-limit à six', 'Le PLO'], 0, 'Université de l\'Alberta.'],
      ],
    });

    K.mod({
      id: 'bankroll2', level: 6, title: 'Bankroll avancée : risque de ruine et montées de limite', drill: 'situations',
      goals: ['Chiffrer le risque de ruine', 'Construire un plan de montée par essais', 'Adapter la bankroll au format et au statut'],
      sections: [
        ['Le risque de ruine', `<p>Une approximation courante en cash : <strong>risque de ruine ≈ e<sup>−2 × winrate × bankroll ÷ écart-type²</sup></strong>, avec winrate et écart-type en bb/100 et la bankroll en bb. Avec 4 bb/100 et un écart-type de 90 bb/100 :</p>
          <div class="tw"><table class="t"><thead><tr><th>Bankroll</th><th class="n">Risque de ruine</th></tr></thead><tbody>
          <tr><td>20 caves (2 000 bb)</td><td class="n mono">≈ 13,9 %</td></tr><tr><td>30 caves (3 000 bb)</td><td class="n mono">≈ 5,2 %</td></tr><tr><td>40 caves (4 000 bb)</td><td class="n mono">≈ 1,9 %</td></tr></tbody></table></div>
          <p>Avec un winrate de 2 bb/100, 40 caves donnent ≈ 13,9 % : la bankroll nécessaire dépend surtout de ton winrate réel, qui est incertain. D'où la marge des règles de prudence. Cette formule suppose un winrate connu et constant : c'est un ordre de grandeur, pas une garantie.</p>`],
        ['Monter par essais', `<p>Plan type : à 50 caves de la limite supérieure, essai de 5 caves. Si tu perds les 5, retour à la limite inférieure, sans drame. Si tu gagnes, tu continues tant que la bankroll reste au-dessus de 40 caves de la nouvelle limite. L'essai est décidé <strong>avant</strong> de s'asseoir.</p>`],
        ['Selon le format et le statut', `<ul><li>Tournois : 100 buy-ins et plus, la variance est bien plus forte qu'en cash.</li><li>Expresso et Spins : variance extrême, prévois large.</li><li>Professionnel : bankroll de jeu <strong>séparée</strong> d'un fonds de vie de 6 à 12 mois (module Devenir pro).</li></ul>`],
        ['Exercices corrigés', ex([
          ["Winrate 4 bb/100, écart-type 90, bankroll 30 caves. Risque de ruine ?", "e<sup>−2 × 4 × 3 000 ÷ 8 100</sup> ≈ <strong>5,2 %</strong>."],
          ["Même joueur, winrate en réalité 2 bb/100. Et à 40 caves ?", "≈ <strong>13,9 %</strong> : diviser le winrate par deux multiplie fortement le risque. Prévois plus large tant que ton winrate n'est pas mesuré."],
          ["Bankroll de 2 600 € en NL50. Plan de montée vers NL100 ?", "NL100 demande 50 caves de 100 € pour un essai, soit 5 000 €. Reste en NL50 (52 caves) jusqu'à 5 000 €, puis essai de 5 caves (500 €) en NL100."],
        ])],
      ],
      mistakes: ['Croire qu\'un risque de ruine faible est garanti', 'Monter sans règle de retour', 'Mélanger bankroll et argent de vie'],
      keys: ['RoR ≈ e^(−2 × wr × BR ÷ σ²)', 'Essai de montée décidé avant la session', 'Bankroll séparée du fonds de vie'],
      quiz: [
        ['4 bb/100, écart-type 90, 40 caves : risque de ruine ?', ['≈ 2 %', '≈ 14 %', '≈ 0 %'], 0, 'e^(−2 × 4 × 4 000 ÷ 8 100).'],
        ['Si le winrate est divisé par deux, le risque de ruine…', ['Augmente fortement', 'Baisse', 'Ne change pas'], 0, 'Il dépend exponentiellement du winrate.'],
        ['Un essai de montée se décide…', ['Avant la session', 'Après une bonne main', 'Pendant un tilt'], 0, 'Règle écrite.'],
        ['Les tournois demandent…', ['Plus de buy-ins que le cash', 'Moins', 'Autant'], 0, 'Variance plus forte.'],
        ['La formule de risque de ruine suppose…', ['Un winrate connu et constant', 'Aucune variance', 'Des tournois'], 0, 'C\'est un ordre de grandeur.'],
      ],
    });


    K.mod({
      id: 'shortdeck2', level: 3, title: 'Short Deck : la stratégie, pas seulement les règles', drill: 'outs',
      goals: ['Comprendre ce que 36 cartes changent aux probabilités', 'Ajuster ses mains de départ', 'Jouer les tirages en Short Deck'],
      sections: [
        ['Ce que 36 cartes changent', `<p>Sans les 2, 3, 4 et 5, il reste 9 cartes par couleur. Les paires arrivent plus souvent : <strong>8,6 %</strong> des mains de départ (54 ÷ 630) au lieu de 5,9 %. Une paire en main fait un brelan ou mieux au flop <strong>17,1 %</strong> du temps (1 − C(32,3) ÷ C(34,3)) au lieu de 11,8 %. Les équités préflop sont plus serrées : AA contre KK ≈ 75 % au lieu de 82 %.</p>`],
        ['Les tirages', `<p>Un tirage couleur n'a plus que <strong>5 outs</strong> (9 cartes par couleur, 4 visibles) : c'est pourquoi la couleur bat le full (règles Triton). Un tirage suite par les deux bouts garde 8 outs : <strong>les suites sont plus faciles que les couleurs</strong>. Les connecteurs prennent de la valeur, les petites assorties en perdent.</p>`],
        ['Ajustements pratiques', `<ul><li>Les mains connectées (JT, T9, 98) et les broadways gagnent en valeur.</li><li>Le brelan bat la suite (règles Triton) : un set reste fort même sur un board connecté.</li><li>Format souvent en antes seulement (pas de blindes) : beaucoup d'argent mort, on joue plus de mains.</li><li>Vérifie les règles de la table : certaines variantes inversent brelan et suite.</li></ul>`],
        ['Exercices corrigés', ex([
          ["Short Deck, tirage couleur au flop. Combien d'outs ?", "<strong>5</strong> : 9 cartes par couleur moins les 4 visibles."],
          ["Short Deck, tirage suite par les deux bouts. Combien d'outs ?", "<strong>8</strong>, comme au hold'em : la suite est plus facile à toucher que la couleur."],
          ["Short Deck, probabilité de flopper un brelan ou mieux avec une paire ?", "≈ <strong>17,1 %</strong>, contre 11,8 % au hold'em."],
        ])],
      ],
      mistakes: ['Surestimer les tirages couleur', 'Jouer les règles hold\'em du classement', 'Oublier l\'argent mort des antes'],
      keys: ['36 cartes : plus de paires, plus de sets', 'Tirage couleur = 5 outs, suite = 8 outs', 'Couleur > full, brelan > suite (Triton)'],
      quiz: [
        ['Outs d\'un tirage couleur en Short Deck ?', ['5', '9', '8'], 0, '9 cartes par couleur.'],
        ['Probabilité de recevoir une paire en Short Deck ?', ['≈ 8,6 %', '≈ 5,9 %', '≈ 15 %'], 0, '54 ÷ 630.'],
        ['En règles Triton, le brelan bat…', ['La suite', 'La couleur', 'Le full'], 0, 'Le brelan devient plus rare que la suite.'],
        ['Quelles mains gagnent en valeur ?', ['Les connecteurs et broadways', 'Les petites assorties', 'Les mains à 2-5'], 0, 'Les suites sont plus faciles.'],
        ['Brelan ou mieux au flop avec une paire ?', ['≈ 17 %', '≈ 12 %', '≈ 25 %'], 0, '1 − C(32,3) ÷ C(34,3).'],
      ],
    });

    K.mod({
      id: 'limit', level: 3, title: 'Limit hold\'em et jeux mixtes (HORSE)', drill: 'odds',
      goals: ['Comprendre la structure des mises en limit', 'Savoir pourquoi on paie plus large en limit', 'Connaître les jeux d\'une rotation HORSE'],
      sections: [
        ['La structure', `<p>En limit, les mises sont fixes : une <strong>petite mise</strong> (small bet) préflop et au flop, une <strong>grosse mise</strong> (big bet, le double) au turn et à la river, avec en général un maximum de quatre mises par tour. En 2/4 €, on mise et relance par 2 € préflop et au flop, par 4 € ensuite.</p>`],
        ['Ce qui change', `<ul><li>Les pots offrent presque toujours de grosses cotes : à la river, payer une mise dans un gros pot demande souvent moins de 15 % d'équité. On couche beaucoup moins souvent qu'en no-limit.</li><li>Le bluff pur réussit moins : la mise est petite par rapport au pot.</li><li>Les erreurs coûtent une mise, pas un tapis : la variance est plus faible, l'avantage aussi se gagne mise par mise (valeur fine, protection).</li></ul>`],
        ['Les jeux mixtes', `<p>Une rotation <strong>HORSE</strong> enchaîne Hold'em, Omaha Hi-Lo, Razz, Stud à 7 cartes et Stud Hi-Lo (huit ou mieux), en limit. Les joueurs complets gagnent en exploitant les adversaires faibles dans les jeux qu'ils connaissent mal. Les modules Omaha, Stud et Razz, et l'outil Variantes, couvrent les bases.</p>`],
        ['Exercices corrigés', ex([
          ["Limit 2/4 €, pot de 40 € à la river, il mise 4 €. Équité requise ?", "4 ÷ (40 + 4 + 4) ≈ <strong>8,3 %</strong> : tu paies avec presque tout ce qui bat un bluff."],
          ["Pourquoi le bluff pur est-il moins rentable en limit ?", "La mise est fixe et petite par rapport au pot : l'adversaire a presque toujours la cote pour payer."],
          ["Quels jeux composent HORSE ?", "Hold'em, Omaha Hi-Lo, Razz, Stud, Stud Hi-Lo (huit ou mieux)."],
        ])],
      ],
      mistakes: ['Coucher en limit comme en no-limit', 'Bluffer souvent dans les gros pots limit', 'Jouer une rotation mixte sans connaître chaque jeu'],
      keys: ['Petite mise puis grosse mise (double)', 'Grosses cotes : on paie plus large', 'HORSE = Hold\'em, Omaha Hi-Lo, Razz, Stud, Stud Hi-Lo'],
      quiz: [
        ['En limit 2/4, la mise au turn est de…', ['4', '2', 'Libre'], 0, 'Grosse mise au turn et à la river.'],
        ['Pot de 40 à la river, mise de 4 : équité requise ?', ['≈ 8 %', '≈ 25 %', '≈ 33 %'], 0, '4 ÷ 48.'],
        ['Le « R » de HORSE est…', ['Le Razz', 'Le Rake', 'La River'], 0, 'Stud joué pour la main la plus basse.'],
        ['En limit, le bluff pur est…', ['Moins rentable qu\'en no-limit', 'Plus rentable', 'Interdit'], 0, 'Mise petite par rapport au pot.'],
        ['Une erreur en limit coûte en général…', ['Une mise', 'Un tapis', 'Rien'], 0, 'Les mises sont plafonnées.'],
      ],
    });

    // ================= 60 situations supplémentaires pour l'exercice « 40 situations » (devenu 100) =================
    const base = K.SITUATIONS.length;
    K.SITUATIONS.push(...[
      ['Règles', 'Blindes 1/2. UTG relance à 6, le joueur suivant relance à 16. Relance minimum suivante ?', ['26', '22', '32'], 0, 'La dernière augmentation est de 10 : 16 + 10 = 26.'],
      ['Règles', 'Tête-à-tête : qui poste la petite blinde ?', ['Le bouton', 'L\'autre joueur', 'Les deux à tour de rôle hors bouton'], 0, 'En tête-à-tête, le bouton est la petite blinde.'],
      ['Règles', 'Board A♣A♦K♥K♠2♣. Tu as Q♥J♥, l\'adversaire 3♦4♦. Résultat ?', ['Tu gagnes avec la dame', 'Partage', 'Il gagne'], 0, 'Deux paires du board, ta dame est le meilleur kicker.'],
      ['Règles', 'À l\'abattage, sans mise à la river, qui montre en premier ?', ['Le premier joueur à parler', 'Le dernier à parler', 'Celui qui a le plus gros tapis'], 0, 'Sans agresseur à la dernière rue.'],
      ['Règles', 'En live, tu poses un seul jeton de 100 face à une mise de 25 sans rien dire. C\'est…', ['Un call', 'Une relance à 100', 'Une relance minimum'], 0, 'Sans annonce, un gros jeton seul est un call.'],
      ['Règles', 'Un tapis court à 30 relance à tapis une mise de 20 (relance incomplète). Le premier miseur peut-il relancer ?', ['Non, l\'action n\'est pas rouverte pour lui', 'Oui, toujours', 'Seulement en cash'], 0, 'Une relance incomplète ne rouvre pas l\'action.'],
      ['Préflop', '6 joueurs, tout le monde se couche jusqu\'à toi au bouton avec Q♦9♣. ?', ['Relancer', 'Coucher', 'Limp'], 0, 'Q9o est dans la range du bouton.'],
      ['Préflop', 'UTG avec A♥T♦ à 6 joueurs, tout le monde s\'est couché avant toi (personne). ?', ['Coucher le plus souvent', 'Relancer toujours', 'Limp'], 0, 'ATo est hors de la range UTG standard.'],
      ['Préflop', 'Deux limpers, tu as A♠K♦ au CO. Taille de relance en ligne ?', ['≈ 5 bb', '≈ 2 bb', 'Tapis'], 0, '3 bb + 1 par limper environ.'],
      ['Préflop', 'Le bouton ouvre, tu es SB avec 7♠7♦. Option simple et solide ?', ['3-bet ou couché, plutôt 3-bet', 'Payer', 'Limp'], 0, 'Depuis la SB, on évite de payer.'],
      ['Préflop', 'Le HJ ouvre, le CO paie, tu as A♠Q♠ au bouton. ?', ['Squeeze (3-bet)', 'Payer seulement', 'Coucher'], 0, 'Main forte, argent mort : squeeze.'],
      ['Préflop', 'Face à un 3-bet d\'un joueur très serré, tu as A♦J♣ en position. ?', ['Coucher le plus souvent', '4-bet', 'Tapis'], 0, 'Sa range domine AJo.'],
      ['Préflop', 'Tu as 5♣5♦, une relance de 3 bb, tapis effectifs 30 bb. Payer pour le set ?', ['Non : tapis trop courts', 'Oui, toujours', 'Oui si assortie'], 0, 'Il faut ≈ 15 à 20 fois la mise à payer.'],
      ['Maths', 'Pot 80, il mise 40. Équité requise ?', ['25 %', '33 %', '20 %'], 0, '40 ÷ 160.'],
      ['Maths', 'Il mise 2 fois le pot. Équité requise ?', ['40 %', '50 %', '33 %'], 0, '2 ÷ (1 + 4).'],
      ['Maths', 'Tirage couleur + ventrale au flop (12 outs) jusqu\'à la river ?', ['≈ 45 %', '≈ 24 %', '≈ 60 %'], 0, '1 − (35 ÷ 47 × 34 ÷ 46) ≈ 45 %.'],
      ['Maths', 'Combos de AK si tu tiens un roi ?', ['12', '16', '9'], 0, '4 as × 3 rois.'],
      ['Maths', 'MDF face à une mise de la moitié du pot ?', ['67 %', '50 %', '33 %'], 0, '1 ÷ 1,5.'],
      ['Maths', 'Tu bluffes la moitié du pot à la river. Il doit se coucher combien de fois pour que ce soit rentable ?', ['Plus de 33 %', 'Plus de 50 %', 'Plus de 25 %'], 0, 'Alpha = 0,5 ÷ 1,5.'],
      ['Maths', 'Deux overcards au flop contre une paire (6 outs) jusqu\'à la river ?', ['≈ 24 %', '≈ 12 %', '≈ 35 %'], 0, '1 − (41 ÷ 47 × 40 ÷ 46).'],
      ['Postflop', 'Tu ouvres au bouton, BB paie. Flop A♠7♦2♣, BB checke. Taille la plus courante ?', ['≈ 1/3 du pot', 'Pot', 'Pas de mise'], 0, 'Board sec à l\'as : petite mise fréquente.'],
      ['Postflop', 'Turn : troisième cœur, tu as top paire sans cœur, le joueur passif relance. ?', ['Coucher souvent', 'Relancer', 'Payer toujours'], 0, 'Une relance passive sur une carte de couleur est forte.'],
      ['Postflop', 'River, tu as la deuxième paire contre un nit qui checke. Valeur fine ?', ['Plutôt check', 'Grosse mise', 'Tapis'], 0, 'Un nit paie rarement avec moins bon.'],
      ['Postflop', 'Pot multiway à 4, flop J♥T♥4♣, tu as A♣J♦. ?', ['Mise moyenne ou check, prudence', 'Overbet', 'Bluff-raise'], 0, 'À plusieurs, top paire bon kicker vaut moins.'],
      ['Postflop', 'Tu as relancé préflop, flop 9♠8♠7♦, tu as A♥K♣. ?', ['Check souvent', 'C-bet toujours', 'Overbet'], 0, 'Board qui touche la range adverse.'],
      ['Postflop', 'Il check-raise le flop puis mise gros au turn et à la river. Sa range est…', ['Polarisée', 'Fusionnée', 'Faible'], 0, 'Valeur forte et semi-bluffs.'],
      ['Fish', 'Un fish limpe, tu as K♣Q♦ au bouton. ?', ['Relancer pour l\'isoler', 'Limp derrière', 'Coucher'], 0, 'Isoler en position avec une main qui le domine.'],
      ['Fish', 'Un fish paie toutes tes mises. Tu as un tirage raté à la river. ?', ['Abandonner', 'Bluffer gros', 'Bluffer petit'], 0, 'Il ne couche pas.'],
      ['Fish', 'Un fish mise gros à la river après avoir payé deux rues. Tu as top paire. ?', ['Prudence : souvent de la valeur', 'Relancer', 'Payer toujours'], 0, 'Les grosses mises des passifs sont fortes.'],
      ['Fish', 'Contre un fish, avec top paire bon kicker, combien de rues de valeur ?', ['Trois si les cartes le permettent', 'Une', 'Aucune'], 0, 'Il paie avec beaucoup de mains moins bonnes.'],
      ['Tournoi', '10 bb au bouton, tout le monde se couche, tu as A♦4♣. ?', ['Tapis', 'Ouvrir à 2 bb', 'Coucher'], 0, 'Largement dans la range de push.'],
      ['Tournoi', 'Bulle, tapis moyen, le chip leader pousse. Tu as A♠Q♦. Par rapport au cash, ton call est…', ['Plus serré', 'Plus large', 'Identique'], 0, 'Prime de risque ICM.'],
      ['Tournoi', 'Satellite, ta place est assurée sauf catastrophe. Tu reçois AA face à un tapis. ?', ['Coucher peut être correct', 'Payer', 'Relancer'], 0, 'Gagner ne rapporte rien de plus.'],
      ['Tournoi', 'PKO : la prime d\'un joueur que tu peux éliminer…', ['Élargit ton call', 'Resserre ton call', 'Ne change rien'], 0, 'Elle s\'ajoute au pot.'],
      ['Tournoi', '18 bb en BB, le CO ouvre large. Tu as K♠J♦. Option la plus solide ?', ['Tapis (resteal) ou couché', 'Call', 'Min-raise'], 0, 'Le call joue mal à 18 bb.'],
      ['Mental', 'Tu viens de perdre un gros pot sur un bad beat. Première chose à faire ?', ['Pause courte et routine', 'Monter de limite', 'Jouer plus de mains'], 0, 'Protocole anti-tilt.'],
      ['Mental', '« Il a perdu cinq fois, il va gagner » : c\'est…', ['L\'erreur du joueur', 'Une loi statistique', 'De la variance positive'], 0, 'Les mains sont indépendantes.'],
      ['Mental', 'Tu as déjà mis la moitié de ton tapis, tu as hauteur roi à la river face à une mise. ?', ['Décider à la cote, sans compter ce qui est déjà misé', 'Payer pour protéger', 'Relancer'], 0, 'Coût irrécupérable.'],
      ['Mental', 'Après une bonne semaine, tu veux monter de deux limites. ?', ['Suivre la règle de bankroll', 'Monter tout de suite', 'Doubler les tables'], 0, 'Excès de confiance.'],
      ['Légal', 'Solveur ouvert sur un écran pendant que tu joues en ligne ?', ['Interdit', 'Autorisé si tu ne le regardes pas', 'Autorisé'], 0, 'Aide en temps réel.'],
      ['Légal', 'Prêter ton compte à un ami pour une session ?', ['Interdit', 'Autorisé une fois', 'Autorisé entre amis'], 0, 'Partage de compte.'],
      ['Légal', 'Une partie privée entre amis avec des jetons sans valeur ?', ['Pas de problème légal', 'Interdite', 'Soumise à agrément'], 0, 'C\'est l\'argent en jeu qui change le cadre.'],
      ['Live', 'Partie live 1/2 €, trois limpers, tu as A♣Q♣ au bouton. Taille d\'isolation ?', ['≈ 8 bb', '≈ 2,5 bb', 'Tapis'], 0, '4 à 5 bb + 1 par limper.'],
      ['Live', 'Un joueur paie instantanément au flop. Sa main est souvent…', ['Plafonnée (paire, tirage)', 'Un brelan', 'Un bluff'], 0, 'Un brelan aurait réfléchi à relancer.'],
      ['Live', 'Litige sur le montant d\'une mise. ?', ['Appeler le floor', 'Discuter avec le joueur', 'Faire voter'], 0, 'Le floor décide.'],
      ['Live', 'Straddle à 2 bb, tapis de 100 bb. Profondeur effective ?', ['50 straddles', '100', '200'], 0, 'Les blindes doublent.'],
      ['Omaha', 'PLO : tu as un seul pique, le board a trois piques. Couleur ?', ['Non', 'Oui', 'Seulement à l\'as'], 0, 'Deux cartes de la main exactement.'],
      ['Omaha', 'PLO : pot 60, mise de 20. Relance pot maximale à… ?', ['120', '80', '100'], 0, 'Call 20 (pot 100), relance de 100 : total 120.'],
      ['Omaha', 'PLO : J-T-7-6 sur 9-8-2. Outs pour une suite ?', ['20', '8', '13'], 0, 'Q, J, T, 7, 6, 5.'],
      ['Omaha', 'Hi-Lo : basse qualifiée ?', ['5 rangs différents de 8 ou moins', 'N\'importe quelle main basse', 'Seulement A-2-3-4-5'], 0, '« 8 or better ».'],
      ['Textures', 'Flop K♣K♦4♥, ouvreur en position. ?', ['Petite mise fréquente', 'Overbet', 'Check toujours'], 0, 'Pairé haut : avantage de l\'ouvreur.'],
      ['Textures', 'Flop monochrome Q♠8♠3♠, tu n\'as aucun pique. Bluff ?', ['Rarement', 'Souvent', 'Toujours gros'], 0, 'Les piques paient ou relancent.'],
      ['Textures', 'Turn As sur 9-7-3 : qui en profite souvent ?', ['Le relanceur préflop', 'Le défenseur', 'Personne'], 0, 'Plus d\'as forts dans sa range.'],
      ['Tirages', 'A♥5♥ sur K♥8♥2♣ contre K♠Q♦ : ton équité ?', ['≈ 46 %', '≈ 20 %', '≈ 75 %'], 0, 'Moteur SIGMA 52 : 45,9 %.'],
      ['Tirages', 'Tirage couleur au turn, mise du pot. ?', ['Coucher sans cotes implicites', 'Payer toujours', 'Relancer'], 0, '19,6 % pour 33 % requis.'],
      ['Tirages', '9♥8♥ sur 7♥6♥2♣, il pousse. ?', ['Payer : gros tirage', 'Coucher', 'Ça dépend du kicker'], 0, '≈ 42 % même contre un brelan.'],
      ['Blindes', 'BB, ouverture à 2 bb du bouton, tu as J♣4♦. ?', ['Défense possible : 25 % requis', 'Toujours coucher', 'Tapis'], 0, 'Petite relance, range de bouton large.'],
      ['Blindes', 'BB face à UTG 3 bb en live, tu as Q♠9♦. ?', ['Coucher le plus souvent', 'Payer toujours', '3-bet'], 0, 'Prix élevé, range forte qui domine.'],
      ['Bankroll', 'NL25, bankroll 500 €. Règle de 40 caves ?', ['Descendre en NL10', 'Rester', 'Monter'], 0, '500 ÷ 25 = 20 caves.'],
      ['Bankroll', '4 bb/100, écart-type 90, 40 caves : risque de ruine ?', ['≈ 2 %', '≈ 20 %', '0 %'], 0, 'e^(−2 × 4 × 4 000 ÷ 8 100).'],
    ].map(([cat, q, opts, ok, why], i) => { const m = K.mix ? K.mix(q, opts, ok) : { opts, ok }; return { id: 's' + (base + i), cat, q, opts: m.opts, ok: m.ok, why }; }));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
