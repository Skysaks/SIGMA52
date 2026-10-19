# SIGMA 52

Labo de poker personnel, utilisé **hors table** : avant et après les sessions, jamais pendant une main.
σ pour l'écart-type, qui gouverne la variance ; 52 pour les cartes.

© Florian Iglesias – All rights reserved

## Contenu

| Onglet | Rôle |
|---|---|
| Aujourd'hui | Programme de 17 semaines (tâches cochées automatiquement depuis la progression, bouton « Y aller »), révisions dues, 10 spots du jour, prochain module, maîtrise par type, dernière analyse, checklist anti-tilt |
| Cours | 53 modules en 6 niveaux : Fondations, Joueur gagnant, Avancé, **Élite** (solveurs, MDF, bloqueurs, avantage de range, jeu hors de position, turn/river avancés, profondeurs, exploitation de population, statistiques, ICM/PKO, performance), **Tables physiques** (accès aux salles en France, règles TDA, stratégie live, tells, gestion de table, tournois live), Professionnel. 203 questions de quiz (maîtrise à 80 %), exercice lié par module, lexique de 60 termes |
| Spots | 11 types d'exercices corrigés : ouverture, face à une ouverture (3-bet / call / fold), MDF et ratios, combos et bloqueurs, primes PKO, cotes du pot, tirage au turn (équité exacte contre une range), tapis ou couché (Nash, noté en perte d'EV), outs, meilleure main, 40 situations. Répétition espacée des erreurs |
| Simulateur | **Table cash + coach** : préparation (type de table, 25/50/100 mains ou illimité, objectif de session, modules à relire), coach en direct, en examen ou absent ; le coach estime la range de chaque adversaire, donne équité, cote requise et raison ; chaque décision est notée, bilan de session par catégorie (ouverture, isolation, défense, cotes, valeur, bluff, tapis/couché). **Mains guidées** : 13 scénarios pas à pas (isolation, nit à la river, set-mining, squeeze, 3-bet, semi-bluff, multiway, valeur fine, Expresso, bulle ICM…) corrigés par l'équité réelle ou le solveur. **Expresso** : Sit&Go 3 joueurs, 500 jetons, blindes croissantes, push/fold sous 15 bb |
| Solveur | **Solveur postflop** (Discounted CFR, deux joueurs) : river et turn exacts, flop approché par échantillon de tirages ; 16 scénarios préflop (pots simples et 3-bet), peintre de range pondérée, tailles configurables, estimation de l'arbre, exploitabilité, grille 13 × 13 par action, EV et équité par combo, « Ta main » (EV et perte de chaque action), rapport par catégorie, re-résolution exacte d'un turn ou d'une river à partir des ranges du solve précédent, import d'une main du replayer avec ses tailles réelles. **Entraîneur** : décisions river tirées de mains complètes, notées en perte d'EV |
| Outils | Équité, Board, Push/Fold & ICM, Ranges, **Calculs** (MDF, alpha, taille géométrique, SPR, cotes implicites, coût du rake), **Bloqueurs** (combos retirés par tes cartes), **PKO** (valeur d'une prime, range de call avec et sans prime), **Distribution** (courbe d'équité combo par combo de deux ranges sur un board : avantage de range et de nuts), **Deal ICM** (répartition d'un accord en table finale, ICM contre jetons), **Mémo** (fiche de préparation à relire avant la session, pas pendant) |
| Analyse | Import d'historiques Winamax ou PokerStars : bb/100, EV des all-in, VPIP/PFR/3-bet/WTSD, résultat par position, fuites préflop, profil et plan d'exploitation par adversaire, plus gros pots, fiches cumulées, c-bet flop et fold to c-bet (toi et adversaires). **Replayer** pas à pas avec équité à chaque étape (flèches du clavier). **Bibliothèque** de 120 mains avec étiquettes et notes |
| Journal | Sessions, bankroll, winrate avec intervalle de confiance, stop-loss, limite autorisée, simulateur de variance et risque de ruine |

## Règle de fair-play

Les rooms sanctionnent l'aide en temps réel (RTA) : fermeture du compte, solde confisqué. SIGMA 52 ne lit aucune table et se ferme avant chaque session. L'aide n'existe que dans la table d'entraînement, qui est un simulateur. L'analyse ne porte que sur les mains jouées par l'utilisateur.

## Structure

```
src/engine.js     évaluateur 7 cartes, ranges, équité exacte et Monte-Carlo, outs
src/matrix.js     matrice d'équité préflop 169 × 169 (générée par tools/build_matrix.js)
src/solver.js     équilibre de Nash tapis/couché (jetons et ICM), ICM Malmuth-Harville
src/board.js      répartition d'une range sur un board, textures
src/hh.js         parseur d'historiques, statistiques, fuites, EV des all-in, profils
src/table.js      table 2 à 6 joueurs contre bots profilés, mode tournoi, export Winamax, débrief
src/coach.js      ranges estimées des adversaires, conseil expliqué, notation des décisions
src/guided.js     13 mains guidées
src/plan.js       programme de 17 semaines
src/postflop.js   solveur postflop CFR (arbre, regrets, exploitabilité, EV et équité par combo)
src/trainer_spots.js  situations de l'entraîneur (générées par tools/build_trainer.js)
src/course_elite.js, course_live.js, course_extra.js  niveaux Élite et Tables physiques, compléments
src/charts.js     ranges d'ouverture par position
src/course.js     noyau du cours, lexique, banque de situations
src/course_l1-4.js  les 4 niveaux du cours
src/spots.js      générateur d'exercices
src/app.js        interface et stockage
src/app_sim.js    simulateur, replayer, bibliothèque, nouveaux outils, programme
src/app_solver.js onglet Solveur ; src/app_trainer.js entraîneur ; src/app_tools.js outils Calculs, Bloqueurs, PKO
src/template.html styles et squelette
tools/            génération de la matrice préflop
founder/          étude des outils concurrents
test/             tests du moteur, du solveur, du board, des spots, de la table et de l'interface
```

## Construire et tester

```bash
node tools/build_matrix.js 50000   # ~4 min sur 2 cœurs, seulement si le moteur change
./build.sh                         # écrit sigma52.html
node tools/build_trainer.js 30      # ~30 min, régénère les spots de l'entraîneur
for t in engine solver postflop board spots table course guided hh coach; do   # coach : ~4 min
  node test/$t.test.js; done
NODE_PATH=$(npm root -g) node test/ui.test.js   # Playwright, 1280 px et 390 px
```

## Validation

- Évaluateur comparé à un évaluateur naïf sur 50 000 mains : 0 écart.
- AsAh contre KdKc : 81,26 % par énumération exacte des 1 712 304 boards.
- Matrice préflop : AA contre KK 81,9 %, AKs contre QQ 46,2 %, 22 contre AKo 52,6 %.
- Solveur : à 10 bb en tête-à-tête, la SB pousse 58,4 % des mains, valeur publiée de référence. Avec une seule place payée, l'ICM retombe exactement sur l'équilibre en jetons.
- Parseur : sur des historiques Winamax réels, la somme des gains de tous les joueurs égale moins le rake.
- Cours : chaque probabilité citée est recalculée par le moteur ; structure, balises et quiz de chaque module vérifiés par test.
- Solveur postflop : jeu polarisé à solution connue (mise pot : 1/3 de bluffs, défense 50 % ; demi-pot : 1/4 de bluffs, défense 2/3) retrouvé à ±2 points ; somme des EV des deux ranges = pot à chaque nœud ; équité identique à l'énumération exacte du moteur ; exploitabilité < 0,5 % du pot sur une river réelle BTN contre BB.
- Coach : ranges estimées calibrées à 99 % sur les vraies mains des bots ; un joueur qui suit le coach gagne ~189 bb/100 contre ~50 pour un bot régulier, mêmes cartes, même table ; en Expresso, 44,5 % de premières places contre 32 % (250 parties).
- Mains guidées : la meilleure option de chaque étape « cotes » correspond bien à équité ≥ cote requise ; les étapes Nash et ICM sont relues dans le solveur.
- Expresso : 3 000 parties sans blocage (régression du joueur à tapis sur une blinde).
- Table : 1 500 mains simulées sans perte de jetons ; l'historique exporté, relu par l'importeur, redonne les mêmes gains et classe correctement les 5 profils de bots.

## Limites connues

- Ranges préflop (ouverture, défense, call de 3-bet) : point de départ standard, pas une sortie de solveur.
- Les bots sont très exploitables : les bb/100 du simulateur ne se transposent pas en room.
- Structure Expresso inspirée du format, pas la grille officielle.
- Solveur : deux joueurs seulement ; le rake est ignoré ; le flop est approché (échantillon de turns et de rivers, turn et river simplifiés à une taille) ; un solve de flop prend 20 à 60 s dans le navigateur.
- La table, le coach et le débrief reposent sur des règles d'exploitation, pas sur l'équilibre.
- Le solveur push/fold traite le duel SB contre BB, les autres joueurs couchés.
- Le parseur a été testé sur des historiques Winamax de 2013 et sur ceux de la table ; un format récent différent demandera un ajustement.
- Le winrate du journal suppose un écart-type de 90 bb/100.
