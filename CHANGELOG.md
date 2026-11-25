# Journal des modifications

Versions du labo, de la plus récente à la plus ancienne. Les limites qui restent sont décrites dans le [README](README.md#limites-connues).

## v28

### Ajouté

- **Concept** : SIGMA 52 devient un système de montée de limites fondé sur la preuve, organisé autour d'une boucle (jouer, importer, revoir, corriger ses vraies erreurs, vérifier) ; carte « Ta boucle » en tête d'Aujourd'hui, entraînement du jour en double retiré, Studio hors du menu (recherche), ligue et XP en option.
- Revue EV automatique à l'import, ranges adverses ajustées aux statistiques importées, historique des revues, vraies erreurs en révision espacée.
- Données compressées (page de 12,8 à 5,7 Mo) ; `test/claims.test.js` recalcule 34 chiffres du cours (8 corrigés : équités préflop exactes au lieu de Monte-Carlo, arrondis du push/fold).

## v24

### Ajouté

- Champions sans noms de joueurs : 28 profils (archétypes), statistiques mesurées (150 000 mains en tête-à-tête, 30 000 à 6), niveau déduit du résultat mesuré, Atlas des profils, Reconnaître un profil ; modules de cours « Les grands profils » et « Affronter les grands profils » réécrits.
- Vérification complète du cours (modules, exercices, quiz, examens, situations) : chiffres recalculés au moteur, faits externes vérifiés, corrections listées dans `docs/verification_cours.md`.
- Bibliothèque : 2 438 flops résolus sur 26 situations après le calcul GitHub du 31/10/2026.

## v23

### Ajouté

- Solveur : **18 situations étendues** (pots 4-bet, cash 40, 60 et 150 bb, tournoi 40 bb avec ante), ranges pondérées du solveur préflop, bibliothèque dès que les flops sont calculés.
- Calculs GitHub automatiques chaque nuit dans un budget de minutes (bibliothèque palier par palier jusqu'aux 1 755 flops, entraînement de la Table live), minutes consommées et coût par flop suivis dans le dépôt.

## v22

### Ajouté

- Bibliothèque de flops complète : les 16 scénarios (pots simples et 3-bet), 91 flops chacun, 1 456 flops, calculés sur GitHub Actions le 31/10/2026 (13 jobs en parallèle, environ 4 heures de temps réel).
- 9 modules de plus (114) : petites mises (range bet, block bet), face au check-raise, blind contre blind après le flop, cash avec ante, straddle ou bomb pot, protection et déni d'équité, re-entry et add-on, jeux à tirage (2-7 Triple Draw, Badugi), lire la carte du turn, jeux-jouets (AKQ, river clairvoyante) ; chiffres calculés au moteur (équités exactes de ranges, probabilités exactes) ; intégrés aux parcours et à la Carte 360.
- Un troisième exercice corrigé pour les 11 modules qui n'en avaient que deux (bankroll, turn et river, fish, adversaires, mental, tailles, lecture, multiway, ICM, Expresso, tournois) : 343 exercices.
- Outils : **Cartes du turn** (src/runout.js, calcul exact par énumération des rivers), **Dessine la range**, **Re-entry et add-on**.

## v21

### Ajouté

- **Carte 360** du Cours : 11 domaines (cadre, préflop, après le flop, maths et théorie, lecture et exploitation, formats, tournois, variantes, live, mental, métier), chaque module classé, progression par domaine, liens vers les entraînements.
- 13 modules de plus (105) : fast-fold, choix des tables, squeeze et cold-call, réalisation d'équité, jouer en position comme caller, pots multiway après le flop, tables à 3-4 joueurs, pots 4-bet, overbets et tailles géométriques, construire ses ranges, jouer contre les réguliers, lecture bayésienne, rake et stratégie ; intégrés aux parcours.
- Bibliothèque : calcul réparti (parts), ordre tourniquet par texture, arrêt par nombre d'itérations (indépendant de la machine), calcul sur GitHub Actions ; flop voisin de texture différente proposé et signalé quand la texture n'est pas encore résolue.

## v20

### Ajouté

- Onglet **Débuter** : la roadmap de lancement intégrée (programme de 12 semaines, carnet de décisions en 6 questions avec FSRS, capital, maths, bilan, ressources, import des sauvegardes Performance Lab et Decision Lab).
- Échelle d'erreur commune (Parfait, Correct, Erreur, Gaffe : seuils en % du pot et en bb) sur spots, quiz, entraîneur et simulateurs ; journal des erreurs et « tes 3 erreurs les plus chères de la semaine » dans le bilan et le plan du jour ; échauffement de 5 spots avant session.
- Drills « même main, quatre adversaires » (station, nit, régulier, maniaque : EV modélisées, hypothèses affichées) ; pression ICM (facteur de bulle) dans les tournois simulés et l'Expresso.
- Solveur : **stratégie jouable** (une action par catégorie de main, verrouillée puis re-résolue : coût mesuré) ; **rapport agrégé PLO** à la demande (14 flops, par texture et par catégorie de main) ; bibliothèque de flops étendue de 3 à 7 scénarios (BTN, UTG, CO et HJ contre BB ; 3-bet BTN contre BB et SB, CO contre BTN ; 515 flops), les 9 autres restent à calculer avec la commande reprenable.
- Défis : **série** jusqu'à la première erreur, record de la semaine partagé entre amis. Entre amis : **étude en direct** (salle, votes cachés puis révélés, spot du solveur partagé).
- Analyse : archives **.zip PokerCraft** et **résumés de tournoi** GGPoker et Winamax lus et ajoutés au Journal. Main de légende Cada–Moon (WSOP 2009). **Copie hors ligne** téléchargeable.
- Bots : moins d'abattages (WTSD du régulier ramené à 30 %, mises de « stab » au turn et à la river). Relecture des explications par Claude : désactivée par défaut (elle utilise le quota du spectateur).
- Expresso : avec le bot régulier renforcé, le héros guidé par le conseil tapis/couché gagne 37,6 % des parties contre 37,2 % pour le bot régulier (4 × 250 parties, 33,3 % = niveau égal) : le conseil bat le niveau égal, il ne bat plus nettement le bot régulier.
- Validation externe contre TexasSolver sur 20 spots (14 rivers, 6 turns) : écart moyen des fréquences agrégées 1,7 point à la racine, 2,3 après check, 1,0 face à la mise ; écart maximal 9,7 points ; distance main par main (variation totale) 4 à 6 %.

## v19

### Ajouté

- Apprentissage : FSRS sur toutes les révisions, contrôle de rétention mensuel, explication avant correction (relue par Claude ou auto-évaluée), plan du jour mélangé et piloté par les fuites, chrono, confiance et calibration, Elo par exercice et carte de compétences, mains guidées à aide dégressive, bilan de la semaine.
- Moteur : bots recalibrés, bibliothèque de flops, tirages plus fins et flop exact, isomorphisme de couleurs, contrôle de stabilité, PLO stratifié, solveur préflop PLO, blocages exacts à trois, limp de SB et pot à trois préflop, coach noté en EV, profils sur tout l'arbre (Hold'em et PLO), verrou PLO, simplification à une taille, ICM postflop.

## v18

### Ajouté

- Défis (charts à débloquer, défi du jour commun, spot de la semaine), onglet Entre amis (parties en ligne en jetons sans valeur, classement partagé et ligue d'amis, groupe d'étude).
- Simulateur : straddle, ante, bomb pot ; coach « seulement en cas d'erreur » (graves et petites séparées), aussi dans les mains notées.
- Solveur : comparateur de ranges côte à côte. Analyse : population et carte des fuites. Mental : routine guidée, check-in après session. Carrière : staking, festival. Journal : session live.

## v17

### Ajouté

- Solveur : **node locking**, **rapport agrégé à la demande**, **ranges préflop calculées**, **solveur à trois joueurs** et **solveur PLO** (onglets du Solveur).
- Simulateur : **Spin & Go**, **mains de légende**, **tournoi de 100 joueurs**.
- Analyse : import **GGPoker**. Studio : **vidéos animées des modules**.

## v16

### Ajouté

- Moteur d'EV : **mains complètes notées** contre le solveur (Simulateur › Mains notées), **quiz instantanés** en mains complètes, **revue EV** de tes historiques et **chasseur tapis ou couché** (Analyse › Revue EV).
- Calcul du solveur dans des **fils séparés** (Web Workers, un par cœur disponible moins un) : l'interface reste fluide, la main suivante se calcule pendant la main en cours.
- Les mains de tournoi simulées (Expresso, tournois) s'exportent au format tournoi.

## v15

### Ajouté

- Onglet **Carrière** (critères de passage pro, simulateur de carrière sur 12 mois) et onglet **Mental** (check-in, carte de tilt, fiches de correction, coût du tilt).
- **Elo**, **ligue de la semaine** et **médailles de série** (Profil, Aujourd'hui), alimentés par les spots, le simulateur, les modules, les examens, les Champions, le solveur, l'entraîneur river et les révisions.
- Simulateur : **conseiller par main**, l'action du coach pour les 169 mains au même moment de la main, sur ta range préflop estimée.
- Analyse : **indice de chance** (tapis, mains premium reçues, sets floppés, en écart-types et percentiles) et **courbe ajustée** de la chance aux tapis.

## v14

### Ajouté

- Table live : modèle par **texture de board** (sec, connecté, pairé, trois cartes d'une couleur) ; **apprentissage des vrais joueurs** (réactions à tes mises, abattages, VPIP/PFR réels dès 15 mains, estimation bayésienne tirée vers le type) ; **plan sur les rues suivantes** (taille géométrique, contrôle du pot, abandon de bluff) ; **décision préparée s'il relance** ; **cartes à venir** (celles qui t'aident, celles qui te font peur) ; taille effective de la range adverse.
- Simulateur d'entraînement réécrit sans allocation (résultats identiques, ≈ 3 fois plus rapide) ; entraînement en lots reprenables (tools/train_jobs.js) ; modèle triplé à 37,8 millions de mains.
- Rapport agrégé du solveur : trois scénarios (BTN contre BB, UTG contre BB, pot 3-bet BB contre BTN).

## v13

### Ajouté

- 22 modules de plus (92), 266 exercices corrigés, 510 questions de quiz, 129 questions d'examen, 100 situations, lexique de 100 termes ; nouveaux modules intégrés aux parcours.
- 6 styles Champions sourcés de plus (28 adversaires) ; joueurs écartés faute de description publique de leur style : Linus Loeliger, Phil Galfond, Sammy Farha, Johnny Chan, Maria Konnikova, Greg Raymer, Phil Laak, Fabrice Soulier, Justin Bonomo, Kristen Foxen, Bryn Kenney, Fedor Holz, Jennifer Harman.

## v12

### Ajouté

- Modèle de la Table live entraîné sur 4,3 fois plus de mains (7,8 millions, puis 12,6 millions en v13), avec plus de tailles de table (2, 3, 4, 5, 6, 8, 9), de profondeurs (25 à 200 bb), de politiques de héros et de compositions de table ; entraînement par lots cumulables.
- 12 nouveaux styles Champions sourcés, comportements de tilt, de position et de piège.
- Examens des 6 niveaux et test de niveau sur les 6 niveaux ; 200 exercices corrigés ; réponses mélangées.

## v11

### Corrigé

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
