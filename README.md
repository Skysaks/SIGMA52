# SIGMA 52

Labo de poker personnel, utilisé **hors table** : avant et après les sessions, jamais pendant une main.
σ pour l'écart-type, qui gouverne la variance ; 52 pour les cartes.

© Florian Iglesias – All rights reserved

## Contenu

| Onglet | Rôle |
|---|---|
| Aujourd'hui | Programme de 12 semaines (tâches cochées automatiquement depuis la progression, bouton « Y aller »), révisions dues, 10 spots du jour, prochain module, maîtrise par type, dernière analyse, checklist anti-tilt |
| Cours | 35 modules en 4 niveaux (Fondations, Joueur gagnant, Avancé, Professionnel). Chaque module : objectifs, cours, erreurs fréquentes, points à retenir, quiz noté (92 questions au total, maîtrise à 80 %), exercice lié. Les erreurs de quiz rejoignent les révisions espacées. Lexique de 60 termes |
| Spots | 8 types d'exercices corrigés : ouverture, face à une ouverture (3-bet / call / fold), cotes du pot, tirage au turn (équité exacte contre une range), tapis ou couché (Nash, noté en perte d'EV), outs, meilleure main, 40 situations. Répétition espacée des erreurs |
| Simulateur | **Table cash + coach** : préparation (type de table, 25/50/100 mains ou illimité, objectif de session, modules à relire), coach en direct, en examen ou absent ; le coach estime la range de chaque adversaire, donne équité, cote requise et raison ; chaque décision est notée, bilan de session par catégorie (ouverture, isolation, défense, cotes, valeur, bluff, tapis/couché). **Mains guidées** : 13 scénarios pas à pas (isolation, nit à la river, set-mining, squeeze, 3-bet, semi-bluff, multiway, valeur fine, Expresso, bulle ICM…) corrigés par l'équité réelle ou le solveur. **Expresso** : Sit&Go 3 joueurs, 500 jetons, blindes croissantes, push/fold sous 15 bb |
| Outils | Équité, Board, Push/Fold & ICM, Ranges, **Distribution** (courbe d'équité combo par combo de deux ranges sur un board : avantage de range et de nuts), **Deal ICM** (répartition d'un accord en table finale, ICM contre jetons), **Mémo** (fiche de préparation à relire avant la session, pas pendant) |
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
src/plan.js       programme de 12 semaines
src/charts.js     ranges d'ouverture par position
src/course.js     noyau du cours, lexique, banque de situations
src/course_l1-4.js  les 4 niveaux du cours
src/spots.js      générateur d'exercices
src/app.js        interface et stockage
src/app_sim.js    simulateur, replayer, bibliothèque, nouveaux outils, programme
src/template.html styles et squelette
tools/            génération de la matrice préflop
founder/          étude des outils concurrents
test/             tests du moteur, du solveur, du board, des spots, de la table et de l'interface
```

## Construire et tester

```bash
node tools/build_matrix.js 50000   # ~4 min sur 2 cœurs, seulement si le moteur change
./build.sh                         # écrit sigma52.html
for t in engine solver board spots table course guided hh coach; do   # coach : ~4 min
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
- Coach : ranges estimées calibrées à 99 % sur les vraies mains des bots ; un joueur qui suit le coach gagne ~189 bb/100 contre ~50 pour un bot régulier, mêmes cartes, même table ; en Expresso, 44,5 % de premières places contre 32 % (250 parties).
- Mains guidées : la meilleure option de chaque étape « cotes » correspond bien à équité ≥ cote requise ; les étapes Nash et ICM sont relues dans le solveur.
- Expresso : 3 000 parties sans blocage (régression du joueur à tapis sur une blinde).
- Table : 1 500 mains simulées sans perte de jetons ; l'historique exporté, relu par l'importeur, redonne les mêmes gains et classe correctement les 5 profils de bots.

## Limites connues

- Ranges d'ouverture : point de départ standard, pas une sortie de solveur.
- Les bots sont très exploitables : les bb/100 du simulateur ne se transposent pas en room.
- Structure Expresso inspirée du format, pas la grille officielle.
- Pas de solveur postflop : la table, le coach et le débrief reposent sur des règles d'exploitation, pas sur l'équilibre.
- Le solveur push/fold traite le duel SB contre BB, les autres joueurs couchés.
- Le parseur a été testé sur des historiques Winamax de 2013 et sur ceux de la table ; un format récent différent demandera un ajustement.
- Le winrate du journal suppose un écart-type de 90 bb/100.
