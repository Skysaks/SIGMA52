# NUTS

Labo de poker personnel, utilisé **hors table** : avant et après les sessions, jamais pendant une main.

© Florian Iglesias – All rights reserved

## Contenu

| Onglet | Rôle |
|---|---|
| Aujourd'hui | Séance du jour : 10 spots, prochain module, checklist anti-tilt avant session |
| Cours A-Z | 12 modules : cadre légal et interdits, règles, mains, positions, préflop, maths, postflop, adversaires et fish, formats, bankroll, mental, plan de progression |
| Spots | Exercices corrigés : ouverture (ranges RFI), cotes du pot, tirage au turn (équité exacte contre une range), meilleure main, 40 situations écrites |
| Équité | Calculateur main contre main ou range, exact quand le board laisse 2 cartes ou moins, Monte-Carlo sinon ; outs à la prochaine carte |
| Ranges | Grille 13×13 des ouvertures 6-max 100 bb par position, éditable, envoyable vers l'équité |
| Journal | Sessions, bankroll, €/h, winrate cash en bb/100 avec intervalle de confiance, stop-loss, limite autorisée, simulateur de variance et risque de ruine |

## Règle de fair-play

Toutes les rooms sanctionnent l'aide en temps réel (RTA) : fermeture du compte, solde confisqué. NUTS ne lit aucune table, n'a aucun mode « en jeu » et se ferme avant chaque session.

## Structure

```
src/engine.js     évaluateur 7 cartes, ranges, équité exacte et Monte-Carlo, outs
src/charts.js     ranges d'ouverture par position
src/course.js     cours A-Z et banque de situations
src/spots.js      générateur d'exercices
src/app.js        interface et stockage
src/template.html styles et squelette
build.sh          assemble nuts.html (page autonome)
test/             tests du moteur, du contenu, des spots et de l'interface
```

## Construire et tester

```bash
./build.sh
node test/engine.test.js
node test/spots.test.js
NODE_PATH=$(npm root -g) node test/ui.test.js   # Playwright, 1280 px et 390 px
```

## Validation du moteur

- Évaluateur comparé à un évaluateur naïf (meilleure combinaison de 5 parmi 7) sur 50 000 mains : 0 écart.
- AsAh contre KdKc : 81,26 % par énumération exacte des 1 712 304 boards ; le Monte-Carlo retombe dessus à ±0,5 point.
- Fréquences des combinaisons sur 7 cartes recalculées (400 000 tirages) contre les chiffres du cours.
- Équité exacte des spots « tirage » recoupée par Monte-Carlo.

## Limites connues

- Les ranges d'ouverture sont un point de départ standard, pas une sortie de solveur.
- Le winrate du journal suppose un écart-type de 90 bb/100.
- Pas d'import d'historiques de mains en V1.
