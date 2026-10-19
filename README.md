# SIGMA 52

Labo de poker personnel, utilisé **hors table** : avant et après les sessions, jamais pendant une main.
σ pour l'écart-type, qui gouverne la variance ; 52 pour les cartes.

© Florian Iglesias – All rights reserved

## Contenu

| Onglet | Rôle |
|---|---|
| Aujourd'hui | Programme de 17 semaines (tâches cochées automatiquement depuis la progression, bouton « Y aller »), révisions dues, 10 spots du jour, prochain module, maîtrise par type, dernière analyse, checklist anti-tilt |
| Cours | 60 modules en 6 niveaux : Fondations, Joueur gagnant, Avancé (dont tête-à-tête, profondeur 40/100/200 bb, **Omaha pot-limit**), **Élite** (champions : ce qu'ils enseignent, affronter les grands styles ; solveurs, MDF, bloqueurs, avantage de range, jeu hors de position, turn/river avancés, profondeurs, exploitation de population, statistiques, ICM/PKO, performance), **Tables physiques** (accès aux salles en France, règles TDA, stratégie live, tells, gestion de table, tournois live, **décider vite à la table**, **partie maison**), Professionnel. 234 questions de quiz (maîtrise à 80 %), exercice lié par module, lexique de 60 termes |
| Spots | 11 types d'exercices corrigés : ouverture, face à une ouverture (3-bet / call / fold), MDF et ratios, combos et bloqueurs, primes PKO, cotes du pot, tirage au turn (équité exacte contre une range), tapis ou couché (Nash, noté en perte d'EV), outs, meilleure main, 40 situations. Répétition espacée des erreurs |
| Simulateur | **Table cash + coach** : préparation (type de table, 25/50/100 mains ou illimité, objectif de session, modules à relire), coach en direct, en examen ou absent ; le coach estime la range de chaque adversaire, donne équité, cote requise et raison ; chaque décision est notée, bilan de session par catégorie (ouverture, isolation, défense, cotes, valeur, bluff, tapis/couché). **Mains guidées** : 13 scénarios pas à pas (isolation, nit à la river, set-mining, squeeze, 3-bet, semi-bluff, multiway, valeur fine, Expresso, bulle ICM…) corrigés par l'équité réelle ou le solveur. **Expresso** : Sit&Go 3 joueurs, 500 jetons, blindes croissantes, push/fold sous 15 bb |
| Champions | Dix adversaires-types inspirés de descriptions publiques (Ivey, Negreanu, Hellmuth, Chidwick, Mizrachi, Antonius, Brunson, Harrington, Dwan, partie live à gros enjeux) : briefing sourcé, tête-à-tête, table à 6 ou table des légendes, rapport d'adaptation (stats observées ± intervalle, comparées au style réel), défi mystère (identifier un style caché), classement des gains bruts fourni (Hendon Mob, 40 premiers). **Types de partie** : cash 100 bb, cash court 40 bb, cash profond 200 bb, partie maison, tête-à-tête, Sit & Go 6 joueurs, table finale, Expresso, avec 6 compositions de table (mixte, fish, réguliers, agressive, légendes, classiques) |
| Table live | **Pour les parties amicales consenties uniquement.** **Décision éclair v2** : hold'em, Omaha PLO ou bomb pot ; tables de 2 à 10 joueurs, straddle, ante, mode tournoi avec ICM ; saisie en grille 52 cartes (une touche par carte) ou valeur + couleur, au clavier. Avant le flop : charts étendues au full ring, push/fold de Nash, équité contre la range de l'adversaire (matrice tête-à-tête, table multiway précalculée), 3-bet bluff à bloqueurs. Après le flop : range adverse pondérée main par main et mise à jour rue par rue selon ses actions (modèle appris sur 300 000 mains simulées), équité exacte au turn et à la river, **EV chiffrée de chaque option** (check, mises de 33 % à l'overbet, call, relance, tapis) avec la part de sa range qui se couche, grille de sa range, « ce qu'il a » et ton équité contre chaque catégorie, envoi du spot au solveur. 2 à 70 ms par décision. **Joueurs** : VPIP, PFR, type automatique, notes, tapis. **Soirée** : journal des décisions, export CSV, renvoi au solveur. **Entraînement** : spots chronométrés (8 s) corrigés par le moteur. Mode discret, vibration de la décision, écran allumé ; minuteur de blindes plein écran lié à la décision ; structure, jetons, places |
| Studio | Visuels et vidéos (Short 9:16, portrait 4:5, post 1:1, YouTube 16:9) à partir d'une main jouée (adversaires anonymisés), d'un quiz, d'une leçon, du solveur, d'un champion ou du bilan ; ambiances, accroche, signature, légende avec hashtags, message de prévention ; export PNG et vidéo |
| Solveur | **Solveur postflop** (Discounted CFR, deux joueurs) : river et turn exacts, flop approché par échantillon de tirages ; 16 scénarios préflop (pots simples et 3-bet), peintre de range pondérée, tailles configurables, estimation de l'arbre, exploitabilité, grille 13 × 13 par action, EV et équité par combo, « Ta main » (EV et perte de chaque action), rapport par catégorie, re-résolution exacte d'un turn ou d'une river à partir des ranges du solve précédent, import d'une main du replayer avec ses tailles réelles. **Rapport agrégé** : BTN contre BB sur un échantillon stratifié de flops résolus à l'avance, regroupé par texture, avec quoi il mise, réponse de BB. **Entraîneur** : décisions river tirées de mains complètes, notées en perte d'EV |
| Outils | Équité, Board, Push/Fold & ICM, Ranges, **Calculs** (MDF, alpha, taille géométrique, SPR, cotes implicites, coût du rake), **Bloqueurs** (combos retirés par tes cartes), **PKO** (valeur d'une prime, range de call avec et sans prime), **Distribution** (courbe d'équité combo par combo de deux ranges sur un board : avantage de range et de nuts), **Deal ICM** (répartition d'un accord en table finale, ICM contre jetons), **Mémo** (fiche de préparation à relire avant la session, pas pendant), **Omaha** (équité PLO 2 à 4 mains, profil de main, relance pot-limit), **Probabilités** (les chiffres à connaître), **Partie maison** |
| Analyse | Import d'historiques Winamax ou PokerStars : bb/100, EV des all-in, VPIP/PFR/3-bet/WTSD, résultat par position, fuites préflop, profil et plan d'exploitation par adversaire, plus gros pots, fiches cumulées, c-bet flop et fold to c-bet (toi et adversaires). **Replayer** pas à pas avec équité à chaque étape (flèches du clavier). **Bibliothèque** de 120 mains avec étiquettes et notes |
| Journal | Sessions, bankroll, winrate avec intervalle de confiance, stop-loss, limite autorisée, simulateur de variance et risque de ruine |

Navigation par espaces (Aujourd'hui, Apprendre, Jouer, Étudier, Suivre) avec barre du bas sur mobile, recherche globale (Ctrl+K ou /), thème automatique, clair ou sombre, aide des raccourcis (?).

## Règle de fair-play

Les rooms sanctionnent l'aide en temps réel (RTA) : fermeture du compte, solde confisqué. SIGMA 52 ne lit aucune table et se ferme avant chaque session. L'aide n'existe que dans la table d'entraînement, qui est un simulateur, et dans la Table live, réservée aux parties privées sans argent ou avec l'accord de tous les joueurs (consentement demandé à l'ouverture). Toute aide en temps réel reste interdite en ligne, en casino, en club et en tournoi. L'analyse ne porte que sur les mains jouées par l'utilisateur.

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
src/course_elite.js, course_champions.js, course_live.js, course_extra.js  niveaux Élite et Tables physiques, compléments
src/charts.js     ranges d'ouverture par position
src/course.js     noyau du cours, lexique, banque de situations
src/course_l1-4.js  les 4 niveaux du cours
src/spots.js      générateur d'exercices
src/app.js        interface et stockage
src/app_sim.js    simulateur, replayer, bibliothèque, nouveaux outils, programme
src/champions.js  styles d'entraînement (sources), classement fourni ; src/app_champions.js onglet Champions
src/app_studio.js Studio de contenus ; src/app_ui.js recherche globale, thème, raccourcis
src/app_solver.js onglet Solveur ; src/app_trainer.js entraîneur ; src/app_tools.js outils Calculs, Bloqueurs, PKO, Omaha, Probabilités
src/live.js       moteur de la Table live v2 (préflop, range pondérée, équité, EV, Omaha, ICM, structure, jetons, places) ; src/app_live.js onglet Table live
src/live_model.js modèle appris (tools/train_live.js) ; src/live_multi.js équité préflop multiway (tools/build_multi.js) ; src/aggregate_data.js rapport agrégé (tools/build_aggregate.js)
src/omaha.js      évaluateur et équité Omaha ; src/course_ultimate.js modules tête-à-tête, profondeur, Omaha, décision rapide, partie maison
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
node tools/train_live.js 60000      # ~25 min, modèle de la Table live
node tools/build_multi.js 8000      # ~1 min, équité préflop multiway
node tools/build_aggregate.js 90 90 # ~1 h, rapport agrégé
node tools/bench_live.js 4000 7     # ~5 min, banc d'essai du moteur live
for t in engine solver postflop board spots table course guided hh live omaha coach; do   # coach : ~4 min
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
- Coach : ranges estimées calibrées à 99 % sur les vraies mains des bots ; un joueur qui suit le coach gagne ~189 bb/100 contre ~50 pour un bot régulier, mêmes cartes, même table ; en Expresso, 41 à 47 % de premières places selon les tirages, contre 40 % pour un bot régulier (250 parties) : avantage faible, dans la marge d'erreur.
- Mains guidées : la meilleure option de chaque étape « cotes » correspond bien à équité ≥ cote requise ; les étapes Nash et ICM sont relues dans le solveur.
- Expresso : 3 000 parties sans blocage (régression du joueur à tapis sur une blinde).
- Table : 1 500 mains simulées sans perte de jetons ; l'historique exporté, relu par l'importeur, redonne les mêmes gains et classe correctement les 5 profils de bots.

- Table live : AA relance partout, 72o se couche UTG, K9o se couche UTG et ouvre au bouton, AK 3-bette face à une relance, brelan mise, rien face à une mise pot à la river se couche ; décision en moins de 100 ms ; jetons répartis sans dépasser le stock, manque signalé.
- Table live v2 : le moteur joue la place du héros contre les bots (4 000 mains par table, mêmes cartes) et gagne nettement plus qu'un bot régulier : table mixte +375 contre +97 bb/100, table de fish +400 contre +126, table de réguliers +106 contre −26, table agressive +173 contre +49. Les bots sont des caricatures exploitables : ces écarts mesurent la cohérence du moteur, pas un winrate réel. Une relance adverse fait baisser l'équité estimée (range renforcée) ; la meilleure option est toujours celle de plus forte EV estimée ; 21 tests.
- Rapport agrégé : 91 flops résolus (55 min de calcul), exploitabilité de 0,8 à 1,4 % du pot ; le bouton mise 47 % des flops en moyenne quand BB check, davantage sur les boards pairés (56 %), moins sur les monochromes (41 %).
- Évaluateur réécrit sans allocation : identique à l'ancien sur 3 millions de mains tirées au hasard, environ deux fois plus rapide.
- Omaha : un seul cœur en main ne fait jamais couleur ; équités exactes à la turn (somme = 100 %) ; AAKK double assortie ≈ 71 % contre une main aléatoire, ≈ 61 % contre JT98 double assortie.
- Styles Brunson, Harrington, Dwan mesurés sur 2 000 mains (c-bet 96 %, VPIP 15 %, fold to c-bet 25 % respectivement).

## Limites connues

- Table live : modèle d'exploitation sur la rue en cours (il ne planifie pas les rues suivantes ; le check est estimé sans les mises adverses qui suivraient). Le modèle postflop est appris sur des bots profilés, mélangé à des probabilités de référence : il décrit des archétypes, pas tes amis. Les ranges préflop viennent des charts adaptées au type. L'historique des rues passées est saisi en cinq lignes types, avec des tailles moyennes supposées. Omaha : estimation simplifiée (score de main, filtres d'action).
- Omaha : outil d'équité et cours de base ; pas de solveur ni de table simulée en PLO.
- Ranges préflop (ouverture, défense, call de 3-bet) : point de départ standard, pas une sortie de solveur.
- Styles Champions : paramètres choisis par SIGMA 52 à partir de descriptions publiques (livres, cours, interviews), pas la stratégie réelle des joueurs ; aucun style n'est créé pour un joueur sans description publique. Le coach estime ces styles par le profil le plus proche (conseils plus approximatifs).
- Repères préflop en tête-à-tête (ouverture ~76 %, défense ~68 %) : approximatifs.
- Studio : vidéo en WebM (MP4 si le navigateur le permet) ; vérifier le message de prévention en vigueur avant toute publication commerciale.
- Les bots sont très exploitables : les bb/100 du simulateur ne se transposent pas en room.
- Structure Expresso inspirée du format, pas la grille officielle.
- Solveur : deux joueurs seulement ; le rake est ignoré ; le flop est approché (échantillon de turns et de rivers, turn et river simplifiés à une taille) ; un solve de flop prend 20 à 60 s dans le navigateur.
- La table, le coach et le débrief reposent sur des règles d'exploitation, pas sur l'équilibre.
- Le solveur push/fold traite le duel SB contre BB, les autres joueurs couchés.
- Le parseur a été testé sur des historiques Winamax de 2013 et sur ceux de la table ; un format récent différent demandera un ajustement.
- Le winrate du journal suppose un écart-type de 90 bb/100.
