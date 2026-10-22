# SIGMA 52

Labo de poker personnel, utilisé **hors table** : avant et après les sessions, jamais pendant une main.
σ pour l'écart-type, qui gouverne la variance ; 52 pour les cartes.

© Florian Iglesias – All rights reserved

## Contenu

| Onglet | Rôle |
|---|---|
| Aujourd'hui | **Accueil guidé** (objectif, test de niveau), **prochaine étape du parcours**, série quotidienne. Programme de 17 semaines (tâches cochées automatiquement depuis la progression, bouton « Y aller »), révisions dues, 10 spots du jour, prochain module, maîtrise par type, dernière analyse, checklist anti-tilt |
| Parcours | 6 parcours par objectif (gagner en jouant pour le plaisir, remplacer son salaire, analyser, parties entre amis et live, tournois, variantes) : la suite d'étapes la plus courte, validées automatiquement (quiz, spots, mains, outils). **Test de niveau** de 24 questions (4 par niveau, des Fondations au Professionnel, surtout des mises en situation) qui indique où commencer ; **examens des 6 niveaux** (20 questions tirées au hasard : 12 mises en situation propres aux examens sur une banque de 90, 8 questions des quiz du niveau ; validé à 16/20, renvoi vers les modules à relire) |
| Cours | 70 modules en 6 niveaux, **≈ 92 h d'apprentissage réel** (lecture, exercices corrigés, 30 spots par module, révisions, mise en pratique), soit environ 4 mois (123 jours) à 45 min par jour ; horizon réaliste de 6 à 12 mois avec le jeu réel. **Révision espacée** : les questions des modules maîtrisés reviennent à 1, 3, 7, 21 et 60 jours, deux erreurs font repasser le module à valider. Contenu : Fondations (dont **méthode express 30 jours**, jeu responsable), Joueur gagnant (dont **penser en paris**, **protocole anti-tilt**, **discipline et routines**, joueur loisir), Avancé (dont tête-à-tête, profondeur 40/100/200 bb, **Omaha pot-limit**), **Élite** (champions : ce qu'ils enseignent, affronter les grands styles ; solveurs, MDF, bloqueurs, avantage de range, jeu hors de position, turn/river avancés, profondeurs, exploitation de population, statistiques, ICM/PKO, performance), **Tables physiques** (accès aux salles en France, règles TDA, stratégie live, tells, gestion de table, tournois live, **décider vite à la table**, **partie maison**), Professionnel (dont **remplacer son salaire : le calcul honnête**). Avancé : Short Deck, Omaha 5 cartes, Omaha Hi-Lo, **Stud et Razz** ; Élite : **méthode d'analyste**. **200 exercices corrigés** (chaque module en a au moins trois), 400 questions de quiz (maîtrise à 80 %, ordre des réponses mélangé), exercice lié par module, lexique de 60 termes |
| Spots | 11 types d'exercices corrigés : ouverture, face à une ouverture (3-bet / call / fold), MDF et ratios, combos et bloqueurs, primes PKO, cotes du pot, tirage au turn (équité exacte contre une range), tapis ou couché (Nash, noté en perte d'EV), outs, meilleure main, 100 situations (règles, préflop, maths, postflop, fish, tournoi, mental, légal, live, Omaha, textures, tirages, blindes, bankroll). Répétition espacée des erreurs |
| Simulateur | **Table cash + coach** : préparation (type de table, 25/50/100 mains ou illimité, objectif de session, modules à relire), coach en direct, en examen ou absent ; le coach estime la range de chaque adversaire, donne équité, cote requise et raison ; chaque décision est notée, bilan de session par catégorie (ouverture, isolation, défense, cotes, valeur, bluff, tapis/couché). **Mains guidées** : 13 scénarios pas à pas (isolation, nit à la river, set-mining, squeeze, 3-bet, semi-bluff, multiway, valeur fine, Expresso, bulle ICM…) corrigés par l'équité réelle ou le solveur. **Expresso** : Sit&Go 3 joueurs, 500 jetons, blindes croissantes, push/fold sous 15 bb |
| Champions | **22 adversaires-types** inspirés de descriptions publiques (Ivey, Negreanu, Hellmuth, Chidwick, Mizrachi, Antonius, Brunson, Harrington, Dwan, Hansen, Blom, Polk, Seidel, Selbst, Ungar, Obrestad, Ferguson, Moneymaker, ElkY, Matusow, les principes de The Theory of Poker, partie live à gros enjeux), filtres par niveau et par époque, **parcours des champions** (du niveau Moyen au Très difficile, style battu avec un résultat positif sur 50 mains). Nouveaux comportements de bot : **tilt** (12 mains plus larges et plus agressives après un pot perdu de 25 bb), **jeu de position**, **piège** avec les mains très fortes : briefing sourcé, tête-à-tête, table à 6 ou table des légendes, rapport d'adaptation (stats observées ± intervalle, comparées au style réel), défi mystère (identifier un style caché), classement des gains bruts fourni (Hendon Mob, 40 premiers). **Types de partie** : cash 100 bb, cash court 40 bb, cash profond 200 bb, partie maison, tête-à-tête, Sit & Go 6 joueurs, table finale, Expresso, avec 10 compositions de table (mixte, fish, réguliers, agressive, légendes, classiques, agressifs modernes, vieille école, table avec un joueur qui tilte, **difficile** : trois sièges joués par le moteur de la Table live) |
| Table live | **Pour les parties amicales consenties uniquement.** **Décision éclair v2** : hold'em, Omaha PLO ou bomb pot ; tables de 2 à 10 joueurs, straddle, ante, mode tournoi avec ICM ; saisie en grille 52 cartes (une touche par carte) ou valeur + couleur, au clavier. Avant le flop : charts étendues au full ring, push/fold de Nash, équité contre la range de l'adversaire (matrice tête-à-tête, table multiway précalculée), 3-bet bluff à bloqueurs. Après le flop : range adverse pondérée main par main et mise à jour rue par rue selon ses actions (modèle appris sur 7,8 millions de mains simulées, 15,8 millions de décisions : tables de 2 à 9 joueurs, 25 à 200 bb, 6 types d'adversaires, selon le pot à deux ou à plusieurs et la position), équité exacte au turn et à la river, **EV chiffrée de chaque option** (check, mises de 33 % à l'overbet, call, relance, tapis) avec la part de sa range qui se couche, grille de sa range, « ce qu'il a » et ton équité contre chaque catégorie, envoi du spot au solveur. 2 à 70 ms par décision. **Joueurs** : VPIP, PFR, type automatique, notes, tapis. **Soirée** : journal des décisions, export CSV, renvoi au solveur. **Entraînement** : spots chronométrés (8 s) corrigés par le moteur. Mode discret, vibration de la décision, écran allumé ; minuteur de blindes plein écran lié à la décision ; structure, jetons, places |
| Studio | Visuels et vidéos (Short 9:16, portrait 4:5, post 1:1, YouTube 16:9) à partir d'une main jouée (adversaires anonymisés), d'un quiz, d'une leçon, du solveur, d'un champion ou du bilan ; ambiances, accroche, signature, légende avec hashtags, message de prévention ; export PNG et vidéo |
| Solveur | **Solveur postflop** (Discounted CFR, deux joueurs, rake en % plafonné) : river et turn exacts, flop approché par échantillon de tirages ; 16 scénarios préflop (pots simples et 3-bet), peintre de range pondérée, tailles configurables, estimation de l'arbre, exploitabilité, grille 13 × 13 par action, EV et équité par combo, « Ta main » (EV et perte de chaque action), rapport par catégorie, re-résolution exacte d'un turn ou d'une river à partir des ranges du solve précédent, import d'une main du replayer avec ses tailles réelles. **Rapport agrégé** : BTN contre BB sur un échantillon stratifié de flops résolus à l'avance, regroupé par texture, avec quoi il mise, réponse de BB. **Entraîneur** : décisions river tirées de mains complètes, notées en perte d'EV |
| Outils | Rangés par catégorie. **Atlas préflop** (les 169 mains, ou les 81 du Short Deck, dans chaque situation : 2 à 10 joueurs, position, ouverture, limp, relance, 3-bet, type d'adversaire, tapis de 8 à 100 bb, ante, straddle ; décision et explication du moteur), **Variantes** (équité hold'em, Short Deck, Omaha 4 et 5 cartes, Omaha Hi-Lo, Stud à 7 cartes et Razz avec cartes mortes, avec la part des pots raflés), Équité, Board, Push/Fold & ICM, Ranges, **Calculs** (MDF, alpha, taille géométrique, SPR, cotes implicites, coût du rake), **Bloqueurs** (combos retirés par tes cartes), **PKO** (valeur d'une prime, range de call avec et sans prime), **Distribution** (courbe d'équité combo par combo de deux ranges sur un board : avantage de range et de nuts), **Deal ICM** (répartition d'un accord en table finale, ICM contre jetons), **Mémo** (fiche de préparation à relire avant la session, pas pendant), **Omaha** (équité PLO 2 à 4 mains, profil de main, relance pot-limit), **Probabilités** (les chiffres à connaître), **Partie maison** |
| Analyse | Import d'historiques Winamax ou PokerStars : bb/100, EV des all-in, VPIP/PFR/3-bet/WTSD, résultat par position, fuites préflop, profil et plan d'exploitation par adversaire, plus gros pots, fiches cumulées, c-bet flop et fold to c-bet (toi et adversaires). **Replayer** pas à pas avec équité à chaque étape (flèches du clavier). **Bibliothèque** de 120 mains avec étiquettes et notes |
| Journal | Sessions, bankroll, winrate avec intervalle de confiance (écart-type estimé sur tes propres sessions dès 15 sessions et 10 000 mains), stop-loss, limite autorisée, simulateur de variance et risque de ruine |
| Profil | **Score SIGMA** sur 1 000 (préflop, maths, théorie, pratique, mental et discipline) avec le point le plus faible à travailler, 20 badges, régularité sur 28 jours, **export et import d'une sauvegarde** de toutes les données |

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
src/live_model.js modèle appris (tools/train_live.js, lots cumulés par tools/merge_live.js dans tools/data/live_counts.json) ; src/exams.js banque des examens de niveau ; src/course_deep*.js exercices corrigés ; src/live_multi.js équité préflop multiway (tools/build_multi.js) ; src/aggregate_data.js rapport agrégé (tools/build_aggregate.js)
src/omaha.js      évaluateur et équité Omaha ; src/course_ultimate.js modules tête-à-tête, profondeur, Omaha, décision rapide, partie maison
src/variants.js   Short Deck, Omaha 4 et 5 cartes, Hi-Lo : évaluateurs et équité ; src/variants_data.js, variants_q.js tables précalculées (tools/build_variants.js, build_variants_q.js)
src/tracks.js     parcours et test de niveau ; src/app_tracks.js onglets Parcours et Profil ; src/course_paths.js 9 modules (méthode express, mental, discipline, objectifs, variantes) ; src/app_tools2.js Atlas préflop et Variantes
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
node tools/train_live.js 1000000 fish,serre,normal 1001 lotA.json   # lot d'entraînement (~1 h par lot de 3 types)
node tools/train_live.js 1000000 action,maniaque,large 5001 lotB.json
node tools/merge_live.js lotA.json lotB.json   # cumule les lots au modèle existant
node tools/build_multi.js 8000      # ~1 min, équité préflop multiway
node tools/build_aggregate.js 90 90 # ~1 h, rapport agrégé
node tools/bench_live.js 4000 7     # ~5 min, banc d'essai du moteur live
for t in engine solver postflop board spots table course guided hh live omaha variants coach; do   # coach : ~4 min
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
- Coach : ranges estimées calibrées à 99 % sur les vraies mains des bots ; un joueur qui suit le coach gagne entre ~114 et ~239 bb/100 selon les tirages (le coach calcule ses équités par Monte-Carlo non fixé ; 3 000 mains), contre ~−5 pour un bot régulier, mêmes cartes, même table ; en Expresso, 42 à 47 % de premières places selon les tirages, contre 37 % pour un bot régulier (250 parties) : avantage faible, proche de la marge d'erreur.
- Mains guidées : la meilleure option de chaque étape « cotes » correspond bien à équité ≥ cote requise ; les étapes Nash et ICM sont relues dans le solveur.
- Expresso : 3 000 parties sans blocage (régression du joueur à tapis sur une blinde).
- Table : 1 500 mains simulées sans perte de jetons ; l'historique exporté, relu par l'importeur, redonne les mêmes gains et classe correctement les 5 profils de bots.

- Table live : AA relance partout, 72o se couche UTG, K9o se couche UTG et ouvre au bouton, AK 3-bette face à une relance, brelan mise, rien face à une mise pot à la river se couche ; décision en moins de 100 ms ; jetons répartis sans dépasser le stock, manque signalé.
- Table live : le moteur joue la place du héros contre les bots (4 000 mains par table, mêmes cartes) et gagne nettement plus qu'un bot régulier : table mixte +379 contre +100 bb/100, table de fish +409 contre +113, table de réguliers +97 contre −12, table agressive +235 contre +62 (modèle v5 : 7,8 millions de mains, 15,8 millions de décisions, tables de 2 à 9 joueurs et 25 à 200 bb, quatre politiques de héros et trois compositions de table ; v4 : +376, +396, +121, +168). **Table difficile** (trois sièges joués par le moteur lui-même) : +20 contre +1 bb/100 : face à sa propre stratégie, l'avantage est faible, ce qui est attendu et montre que les gros écarts viennent de l'exploitation des bots. Les bots sont des caricatures exploitables : ces écarts mesurent la cohérence du moteur, pas un winrate réel. Une relance adverse fait baisser l'équité estimée (range renforcée) ; la meilleure option est toujours celle de plus forte EV estimée ; 22 tests.
- Rapport agrégé : 91 flops résolus (55 min de calcul), exploitabilité de 0,8 à 1,4 % du pot ; le bouton mise 47 % des flops en moyenne quand BB check, davantage sur les boards pairés (56 %), moins sur les monochromes (41 %).
- Évaluateur réécrit sans allocation : identique à l'ancien sur 3 millions de mains tirées au hasard, environ deux fois plus rapide.
- Variantes : en Short Deck la couleur bat le full, le brelan bat la suite, A-6-7-8-9 est la suite la plus basse ; Omaha 5 cartes impose 2 + 3 ; Hi-Lo partage le pot (une même main peut rafler les deux moitiés) ; équités exactes à la turn pour les cinq jeux (somme = 100 %). As-As contre Roi-Roi en Short Deck : ≈ 75 %.
- Toutes les mains de départ : les 16 432 classes de mains PLO (270 725 combinaisons) évaluées à 3 000 tirages chacune contre une main aléatoire, les 81 mains de Short Deck contre 1, 2 et 3 adversaires (20 000 tirages), quantiles d'équité Omaha 5 cartes et Hi-Lo ; l'Atlas couvre les 169 mains de hold'em dans chaque situation préflop.
- Omaha : un seul cœur en main ne fait jamais couleur ; équités exactes à la turn (somme = 100 %) ; AAKK double assortie ≈ 71 % contre une main aléatoire, ≈ 61 % contre JT98 double assortie.
- Examens : banque de 90 mises en situation (15 par niveau en moyenne), chaque réponse chiffrée recalculée (cotes, combos, MDF, tailles géométriques, ICM exact, erreurs types, staking, fiscalité selon le module) ; ordre des réponses mélangé de façon stable dans les 400 questions de quiz et les examens (la bonne réponse n'est plus surtout la première).
- 12 nouveaux styles Champions mesurés sur 2 000 mains chacun : du plus serré (style Seidel, VPIP 14 %) au plus large (style Blom, VPIP 45 %) ; le style Matusow passe environ 23 % des mains en tilt sur 3 000 mains.
- Styles Brunson, Harrington, Dwan mesurés sur 2 000 mains (c-bet 95 %, VPIP 15 %, fold to c-bet 32 % respectivement ; statistiques des 9 styles remesurées après le passage des bots à la relance de valeur).

## Limites connues

### Corrigé en v11
- Check estimé sans la suite : le check hors de position compte maintenant la mise adverse probable et ta réponse (suivre ou se coucher selon ton équité contre sa range de mise).
- Historique des rues passées en tailles moyennes : la taille de chaque mise passée se choisit (petite, moyenne, grosse).
- Range préflop du relanceur supposée générique : la position du relanceur se saisit et sa range d'ouverture réelle est utilisée (chart face à une ouverture par position).
- Modèle identique pour tous les joueurs d'un type : l'agressivité observée (mises et suivis notés à la table, dès 10 actions) ajuste ses probabilités de mise.
- Overbet conseillé avec des mains moyennes : réservé aux mains polarisées (très fortes ou bluffs).
- Omaha 5 cartes et Hi-Lo : score de main recalibré par régression sur 12 000 mains (corrélation de rang avec l'équité 0,63 → 0,81 en PLO5, 0,30 → 0,80 en Hi-Lo).
- Stud et Razz absents : équité avec cartes mortes et module de cours.
- Bots qui ne relancent presque jamais leurs monstres : ils relancent maintenant brelans et mieux ; modèle réentraîné. Table « difficile » avec des sièges joués par le moteur.
- Solveur sans rake : rake en % du pot avec plafond, prélevé sur le gagnant.
- Écart-type du journal fixé à 90 bb/100 : estimé sur tes sessions quand il y a assez de données.
- Durée des cours sous-estimée (≈ 6 h de lecture affichées) : temps d'apprentissage réel affiché (≈ 82 h), exercices corrigés supplémentaires sur 15 modules, révision espacée, encadré de mise en pratique, horizon réaliste.

### Ajouté en v12
- Modèle de la Table live entraîné sur 4,3 fois plus de mains (7,8 millions), avec plus de tailles de table (2, 3, 4, 5, 6, 8, 9), de profondeurs (25 à 200 bb), de politiques de héros et de compositions de table ; entraînement par lots cumulables.
- 12 nouveaux styles Champions sourcés, comportements de tilt, de position et de piège.
- Examens des 6 niveaux et test de niveau sur les 6 niveaux ; 200 exercices corrigés ; réponses mélangées.

### Reste structurel
- Table live : modèle d'exploitation sur une rue avec anticipation de la mise suivante, pas un arbre complet. Le modèle postflop est appris sur des bots profilés : il décrit des archétypes, pas tes amis (l'agressivité observée corrige en partie).
- Omaha, Stud, Razz : outils d'équité et cours ; pas de solveur ni de table simulée.
- Réglages testés au banc d'essai : pénaliser les calls préflop des mains dépareillées fait perdre 50 à 80 bb/100 contre les bots (testé à deux intensités) ; le réglage le plus rentable a été gardé. Contre des réguliers humains, il peut payer un peu trop large face aux relances : l'Atlas préflop permet de le vérifier situation par situation.
- Ranges préflop (ouverture, défense, call de 3-bet) : point de départ standard, pas une sortie de solveur. Repères en tête-à-tête approximatifs.
- Styles Champions : paramètres choisis par SIGMA 52 à partir de descriptions publiques (livres, cours, interviews), pas la stratégie réelle des joueurs ; aucun style n'est créé pour un joueur sans description publique.
- Les bots restent exploitables, même la table difficile : les bb/100 du simulateur ne se transposent pas en room.
- Solveur : deux joueurs ; flop approché (échantillon de turns et de rivers, une taille sur turn et river) ; 20 à 60 s pour un flop dans le navigateur. Push/fold : duel SB contre BB.
- Le parseur a été testé sur des historiques Winamax de 2013 et sur ceux de la table ; un format récent différent demandera un ajustement.
- Structure Expresso inspirée du format, pas la grille officielle.
- Studio : vidéo en WebM (MP4 si le navigateur le permet) ; vérifier le message de prévention en vigueur avant toute publication commerciale.
- Les cours ne remplacent pas le volume de jeu : 92 h d'étude rendent compétent sur le papier, la régularité des résultats demande plusieurs dizaines de milliers de mains et une analyse suivie.
