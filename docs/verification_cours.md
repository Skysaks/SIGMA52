# Vérification du cours (31/10/2026)

Relecture complète des modules, exercices, quiz, examens et situations. Méthode :
- **Calculs** : chaque égalité écrite en clair est recalculée (`tools/audit/check_arith.py`) ; équités, combinaisons, ICM et Nash recalculés avec le moteur.
- **Faits externes** (règles, droit, fiscalité, rooms, histoire, études) : vérifiés aux sources, corrigés ou nuancés quand une source manque.
- **Stratégie** : affirmations confrontées au solveur et à la théorie établie ; les absolus faux sont nuancés.

## Corrections

| Module | Avant | Après | Justification |
|---|---|---|---|
| maths2 (tirage couleur arrière) | 10 × 9 ÷ (47 × 46 ÷ 2) ≈ 4,2 % | (10 × 9 ÷ 2) ÷ (47 × 46 ÷ 2) = 45 ÷ 1 081 ≈ 4,2 % | Formule fausse (elle donne 8,3 %), résultat juste |
| cadre, live_table, online2, situations, examen N1 | « PokerStars interdit même un chart préflop ouvert » ; « HUD intégré de Winamax » | PokerStars tolère des charts simples d'ouverture (relance ou couche, sans fréquences, 9 grilles max), interdit les charts face à une relance ou avec fréquences ; Winamax autorise les logiciels de suivi alimentés par tes propres mains et les tableaux de mains de départ, interdit solveurs, calculateurs d'ICM et d'équité, ranges dynamiques, fonctions dynamiques de Hand2Note | Règlement poker Winamax (winamax.fr/cgu-poker) ; PokerNews, février 2019 (règles PokerStars). Aucune source pour un « HUD intégré » Winamax |
| cadre | Liquidité partagée « Winamax, PMU et partypoker avec l'Espagne » au présent | Cadre légal depuis 2018 ; PokerStars avec l'Espagne et le Portugal, Winamax avec l'Espagne ; offre à vérifier dans le lobby | Focus Gaming News (entrée de Winamax), PokerNews juin 2018 (partypoker FR-ES) : la présence actuelle de partypoker en France n'est pas confirmée |
| cadre | Question en double (HUD Winamax, deux fois) | Remplacée par une question sur les calculateurs d'ICM (interdits chez Winamax) | Règlement poker Winamax |
| preflop | Isolation « 6 bb (4 bb + 1 par limper) » dans l'exercice, « 3,5 bb + 1 » dans le cours | 5,5 bb (3,5 + 1 par limper), cohérent avec le module | Incohérence interne |
| preflop, decision, examen N1 | QQ contre AKo : 57,5 % / 42,5 % | ≈ 57 % / 43 % | Matrice préflop : 57,0 % en moyenne ; énumération exacte Q♠Q♥ contre A♣K♦ : 57,16 % |
| preflop | AKo contre 87s : 59 % / 41 % | 58,5 % / 41,5 % | Matrice préflop : 58,5 % |
| sprint | « L'apprentissage complet représente environ 80 heures » | plus de 150 heures | Total actuel du cours (≈ 152 h, calcul du module Cours) |
| bankroll | Baisse de 20 caves dans 46 % des cas, 30 caves dans 10 % | 44 % et 12 % (4 000 trajectoires) | Simulation recalculée : +5 bb/100, écart-type 90, 100 000 mains |
| responsable | Interdiction volontaire « au moins 3 ans » | au moins 3 ans, renouvelée tacitement | FDJ, page Interdiction volontaire de jeux (renvoi ANJ) |
| preflop2, situations | Grosse blinde contre une ouverture à 2,5 bb : « 1,5 bb pour un pot de 5 bb, environ 23 % » | 1,5 bb pour un pot final de 5,5 bb : ≈ 27 % | 1,5 ÷ (2,5 + 2,5 + 0,5) = 27,3 % |
| fish | « Le rapport ANJ 2025 montre que les nouveaux joueurs arrivent surtout des paris sportifs » | Chiffres du bilan ANJ 2025 (2,5 M de comptes, +16,5 %, 213 € de dépense moyenne, 1,38 M de joueurs poker et paris, croissance par Sit&Go et tournois) | Le bilan ne dit pas que les nouveaux joueurs viennent « surtout » des paris sportifs |
| online2 | Fast-fold « Go Fast chez Winamax » | Zoom chez PokerStars ; vérifie l'offre de ta room | Winamax a lancé puis retiré Go Fast en juillet 2014 (pokerfuse, 30/07/2014) |
| formats, marche | « Les nouveaux joueurs, venus des paris sportifs » | Chiffres du bilan ANJ 2025 sans causalité inventée | Le bilan donne le nombre de joueurs poker et paris, pas l'origine des nouveaux joueurs |
| blindes | Grosse blinde : « 1,5 bb pour un pot de 5 bb : 30 % » ; « 1 bb pour 4 bb : 25 % » | 27 % (pot final 5,5 bb) ; 22 % (pot final 4,5 bb) | La petite blinde morte entre dans le pot : 1,5 ÷ 5,5 et 1 ÷ 4,5 |
| tilt2 | Exercice : « pause de 5 minutes » ; « tilt de méritocratie » | pause de 10 minutes (règle du module) ; tilt du « dû » (vocabulaire du tableau) | Incohérences internes |
| sizing | Mise géométrique « sans jamais miser plus que le pot » ; trois mises d'un tiers « 20 bb » | 107 % du pot à chaque rue (à peine plus que le pot) ; trois mises d'un tiers ≈ 12 bb | (1 + 2 × 97,5 ÷ 6,5)^(1/3) = 3,14 → 107 % ; 2,1 + 3,6 + 5,9 ≈ 11,6 bb |
| lecture | River K : « AK (12 combos …) » | AK : 9 combos | Le héros tient un as et le board un roi : 3 × 3 = 9 |
| icm | Bulle : jetons 44 %, ICM 76 %, facteur 3,2 | Héros en grosse blinde (50/100) : jetons 44 %, ICM ≈ 72 %, facteur ≈ 2,6 | Les 76 % correspondaient à un tapis sans blindes (qui demanderait 50 % en jetons) : chiffres rendus cohérents, ICM de Malmuth-Harville recalculé |
| expresso | « c'est là que sont les récréatifs venus des paris sportifs » | « le format qui attire le plus de joueurs loisir » | Causalité non établie par l'ANJ |
| omaha | A-A-7-2 contre « Valet-10-9-8 assortie » ≈ 50 % | double assortie ≈ 50 % (54 % contre la simple assortie) | Moteur Omaha : 49,8 % et 53,7 % |
| omaha | « brelan de rois contre tirage couleur max : ≈ 55 % » | Deux exemples calculés : ≈ 69 % contre la couleur max seule, ≈ 36 % contre couleur max + wrap | Le chiffre unique dépendait entièrement des mains ; moteur Omaha |
| variantes2 | Short Deck AA contre KK ≈ 75 % ; Hi-Lo A-2-3-K assorti ≈ 63 % | ≈ 74 % ; 63 % en double assorti (60 % en simple assorti) | Moteur Variantes : 74,2 % ; 62,7 % / 60,2 % |
| pots3bet, examen N3 | SPR d'un pot 3-bet en position ≈ 4,5 | ≈ 4,7 | 91 ÷ 19,5 = 4,67 (valeur déjà donnée par le module multiway) |
| bloqueurs | Tenir un roi sur K-9-4 « retire un quart des combos de top paire » | un tiers (il reste 2 rois sur 3) | 3 rois disponibles avant ta carte, 2 après |
| caller_ip | J♠T♠ sur K♥7♠3♠ : « tirage couleur et deux backdoors » | tirage couleur plus un tirage suite par la porte de derrière | Le tirage couleur est déjà formé ; un seul backdoor (suite) |
| icm2 | PKO : part encaissée d'une prime ≈ 25 % du tapis de départ ; exemple à 31 % | ≈ la moitié du tapis de départ ; exemple : 2 600 ÷ (2 600 + 3 300 + 5 000) ≈ 24 % | Prime encaissée = buy-in ÷ 4 ; jetons par euro = tapis ÷ (buy-in ÷ 2) : buy-in ÷ 4 × 2 × tapis ÷ buy-in = tapis ÷ 2. Cohérent avec l'exemple du module icm (2,5 € ≈ 5 000 jetons) |
| barrels | Turn 6♠ « complète des tirages » ; turn 2♠ classée « brique » | 6♠ : donne des deux paires et de nouveaux tirages ; question passée à 2♥ (vraie brique) | Une deuxième carte de pique crée un tirage couleur, elle ne complète rien |
| hud | « HUD tiers en temps réel : à considérer comme interdit ou restreint » | Dépend de la room (Winamax autorise un logiciel de suivi alimenté par tes mains) | Règlement poker Winamax |
| ante_straddle | Ouvertures à 2,5–3 straddles | 2,5 à 4 straddles selon la table (cohérent avec le module deep) | Incohérence interne |
| etudes (main 1) | K♥J♥ sur K♦7♣2♠ : 85,2 % contre « une range de défense BB large » (267 combos) | 83,0 % contre la défense de la BB face au CO (254 combos) | Calcul exact, ranges actuelles de l'onglet Ranges (la range citée n'existait plus) |
| etudes (main 2), examen N4 | JJ sur A♠8♦3♣ : 23,5 % | 23,6 % | Énumération exacte (51 combos) |
| pots4bet | A♥K♦ contre QQ+, AKs 33,4 % ; QQ+, AK 38,9 % ; JJ+, AK, A5s, A4s 45,2 % | 33,2 % ; 38,8 % ; 45,0 % | Énumération exacte préflop (1,7 million de boards par combo) ; les valeurs précédentes venaient d’un Monte-Carlo. AK reste juste au-dessus des 38,7 % requis |
| champions | Sections par joueur réel (classement Hendon Mob, Ivey, Negreanu, Hellmuth, Chidwick, Mizrachi, Antonius, YoH ViraL) | Sections par profil (prédateur polyvalent, small-baller, lecteur serré, équilibré moderne, LAG imprévisible, presseur de tête-à-tête) + statistiques mesurées | Demande de l'utilisateur : profils sans noms. Les leçons tirées des sources publiques (MasterClass, *Power Hold'em Strategy*, *Play Poker Like the Pros*, Card Player, PokerNews) sont conservées sans attribution nominative ; la section YoH ViraL (parcours, pas un style) est retirée |
| champions | « Douze styles de plus (inspiré de …) » avec noms | « Douze profils de plus » sans noms ; seuil « battu sur 50 mains » qualifié de repère, pas de preuve | Sur 50 mains, l'écart type d'un résultat dépasse 100 bb/100 |
| styles | Noms d'anciens styles (Agresseur complet, GTO moderne, Parrain agressif…) ; « comparé au style réel » | Noms des profils actuels ; comparaison aux statistiques mesurées | Cohérence avec l'onglet Champions |
| turncard | Board 9♥8♥6♣ : dame 51,0 %, 10 48,1 % (nuts BB ≈ 17 %), 7 47,5 % (≈ 20 %) | 50,9 % ; 48,0 % (≈ 18 %) ; 47,3 % (≈ 21 %), turn à trèfle précisé | Recalcul exact (outil Cartes du turn, ranges actuelles) |
| turncard | Exercice A♠K♦ : « sur un as ou une dame, tu aurais touché ta paire » | sur un as (52,1 %) ; sur un roi, paire mais range quasi inchangée (50,4 %) | Une dame ne donne pas de paire à AK |
| eclair | Outs nécessaires sur une carte : 10 / 12 à 13 / 14 / 17 | 9 à 10 / 12 / 13 à 14 / 16 (avec la formule) | Équité requise × 46 ou 47 cartes : 9,4 ; 11,8 ; 13,4 ; 15,7 |
| live_regles | TDA « révisées tous les deux ans » ; règle des 50 % formulée sur « la relance minimum » | sommets réguliers (2024, juillet 2026) ; 50 % de la dernière mise ou relance, au-delà du call | Sommets 2019, 2022, 2024, 2026 ; règle TDA des 50 %. Les règles 2026 citées (tapis « tout ou rien », lunettes connectées interdites, piles de 20) sont confirmées (PokerNews, juillet 2026) |
| marche, fish (examen) | Clé « Les nouveaux joueurs viennent des paris sportifs » et question associée | Clé et question sur « plus de comptes, dépense moyenne en baisse » | Le bilan ANJ 2025 donne 1,38 million de joueurs poker et paris, pas l'origine des nouveaux joueurs |
| integrite | « PokerStars annonce détecter plus de 95 % des cas de façon proactive » | ≈ 89 % des bots et ≈ 90 % des cas de collusion par alerte automatique (déclaration au régulateur de Pennsylvanie, 2018) | Card Player, « PokerStars To Pennsylvania: System Can Detect 90 Percent Of Bots Proactively » |
| examen N2, deep2 (blindes) | BB face à 2,5 bb : 30 % (« pot de 5 bb ») | ≈ 27 % (pot final 5,5 bb) | Même correction que les modules blindes et preflop2 |
| situations | Solveur entre deux mains : « PokerStars interdit solveurs et charts » | solveurs interdits partout ; PokerStars tolère des charts préflop simples | Règles PokerStars 2019 sur les outils tiers |
| situations | BB face à une ouverture à 2 bb : 25 % requis | ≈ 22 % (1 ÷ 4,5) | Petite blinde morte comprise |
| push/fold (niveau 3) | Tableau HU : 5 bb, BB paie 62,2 % ; 15 bb, SB pousse 45,6 % | 62,1 % ; 45,7 % | Recalcul du solveur push/fold (62,14 % ; 45,65 %) |
| niveau 1 (matchs préflop) | AKo contre 87s : 58,5 % / 41,5 % | 58,8 % / 41,2 % | Moyenne exacte sur les 48 combinaisons de couleurs (énumération complète) |
| deep2 (exercice préflop) | AKs contre 77 : 47,9 % / 52,1 % | 47,7 % / 52,3 % | Énumération exacte, moyenne sur les 24 combinaisons |
| Short Deck (deux modules) | AA contre KK ≈ 75 % dans un module, ≈ 74 % dans l'autre | ≈ 74,5 % partout | Moyenne sur les 36 combinaisons de couleurs (74,2 % à 75,0 % selon les couleurs) |

Depuis la v28, `test/claims.test.js` recalcule à chaque test les chiffres clés ci-dessus (équités, push/fold, ICM, cartes du turn, résultats mesurés des Champions) et vérifie que le texte du cours les contient encore : un changement de ranges ou de moteur qui rendrait le cours faux fait échouer les tests.
