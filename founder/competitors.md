# SIGMA 52 face aux outils existants

Usage personnel : la question n'est pas « qui vendre » mais « qu'est-ce qui marche ailleurs, et qu'est-ce qui manque pour un joueur francophone qui veut battre les fish en micro-limites ».

## Le paysage

| Outil | Type | Prix comparable | Ce qu'il fait |
|---|---|---|---|
| GTO Wizard | Direct | 49 à 279 $/mois | Solutions pré-calculées, trainer noté en EV, analyse d'historiques |
| Postflop+ | Direct | Gratuit, puis 14,99 $/mois | Exercices de solveur, EV par action |
| PokerTrainer | Direct | Gratuit limité, puis 14,99 $/mois | 5 types d'exercices de base |
| Poker Skill | Direct | Gratuit | Leçons guidées, puzzle du jour, IA |
| DTO | Direct | dès 9,99 $/mois | Scénarios GTO notés |
| Poker Builder | Direct (FR) | Gratuit | Ranges, équité, tracker de sessions |
| ICMIZER 3 | Indirect | dès 8,33 $ | Push/fold Nash, ICM, erreurs dans les historiques |
| Hand2Note | Indirect | 0 à 49 $/mois | Tracker, HUD dynamique |
| PokerTracker 4 | Indirect | Licence unique | Tracker, HUD |
| PokerCoaching | Indirect | dès 49 $/mois | Vidéos, quiz |

Fourchette pour un outil d'entraînement complet : de 0 à 279 $ par mois. Médiane des abonnements listés : environ 15 $ par mois.

## Carte de positionnement

- Axe 1 : niveau visé (débutant → joueur qui pense déjà en solveur).
- Axe 2 : orientation (exploiter les erreurs des adversaires → jouer l'équilibre).
- GTO Wizard, Postflop+ et DTO sont en haut à droite : avancé, équilibre.
- PokerTrainer, Poker Skill et Poker Builder sont en bas, côté débutant, sans travail sur l'exploitation.
- Le coin « débutant + exploitation des fish » est presque vide.

## Ce que les joueurs reprochent

1. **Trop avancé pour débuter** (thème récurrent). Selon Poker Skill, GTO Wizard suppose qu'on maîtrise déjà ranges et fréquences et ne convient pas aux débutants ; Postflop+ note sans expliquer le raisonnement. Sur Pokerchipforum, un joueur juge GTO Wizard devenu « the industry standard » tout en ne le recommandant pas aux débutants.
2. **Le GTO n'est pas la meilleure arme en micro-limites**. Sur Pokerchipforum, un joueur estime qu'entre NL25 et NL500 il vaut mieux jouer de façon exploitante. Thème mince : moins de trois avis.
3. **Explications absentes ou partielles** : PokerTrainer n'explique par défaut qu'après une erreur, Postflop+ n'explique pas du tout.
4. **Prix** : l'essentiel de GTO Wizard est dans les offres payantes.
5. **Règles des rooms** : les HUD dynamiques de Hand2Note sont limités ou interdits sur plusieurs rooms, et Winamax interdit les HUD dynamiques.

## Ce que SIGMA 52 reprend

- Le trainer noté en EV de GTO Wizard : spots Tapis ou couché notés en perte d'EV, calls notés en EV en euros.
- Le push/fold Nash et l'ICM d'ICMIZER, recalculés dans le navigateur. Validation : 58,4 % de tapis à 10 bb, la valeur publiée.
- L'analyse d'historiques des trackers, sans HUD : rien ne tourne pendant le jeu.
- La lecture de board façon Flopzilla : répartition d'une range en mains faites et tirages.
- Le puzzle du jour de Poker Skill, devenu 10 spots du jour qui ciblent les points faibles.

## Le manque comblé

Aucun outil listé ne réunit, en français, gratuitement :

1. un cours de A à Z ;
2. un entraînement à **exploiter** les fish (table contre bots profilés, avec débrief) ;
3. un profil et un plan d'exploitation par adversaire, tirés de tes propres historiques ;
4. la répétition espacée de tes erreurs.

C'est la cible de SIGMA 52.

## Menace

Rien à craindre commercialement : l'outil est personnel. Le risque est ailleurs. Si l'adversaire en face utilise GTO Wizard, il aura une stratégie d'équilibre solide. SIGMA 52 ne remplace pas un solveur postflop complet. Contre des réguliers, il faudra un jour passer par ce type d'outil (Starter à 49 $/mois).

## Version 8 bis : fonctions reprises des outils du marché (octobre 2026)

Étude des fonctions publiques (pages produit, guides, fiches d'applications), sans décompilation ni copie de données : les licences de ces outils l'interdisent et ce n'est pas nécessaire.

| Fonction observée | Outil | Ce que SIGMA 52 en fait |
|---|---|---|
| Rapports agrégés : un spot préflop résolu sur un échantillon de flops, moyenne pondérée, regroupement par texture (hauteur, couleurs, paires, connexion) | GTO Wizard | Solveur › Rapport agrégé : BTN contre BB, échantillon stratifié de 91 flops résolus par le solveur SIGMA 52, groupes par texture, « avec quoi il mise » par catégorie de main, réponse de BB, chargement d'un flop dans le solveur |
| Répartition d'une range sur un board, probabilités d'adversaire, équité contre une range | Flopzilla | Table live : sa range estimée en grille 13 × 13 et « ce qu'il a » par catégorie, avec ton équité contre chacune |
| Prise de notes rapide sur les adversaires, suivi de session, export | GrindStack, Poler | Table live › Joueurs (VPIP, PFR, type automatique, notes) et › Soirée (journal des décisions, export CSV, renvoi au solveur) |
| Entraînement préflop chronométré | Applications de type Preflop Trainer | Table live › Entraînement : spots tirés au hasard, 8 secondes, corrigés par le moteur, meilleure série |
| Push/fold et ICM | ICMIZER | Table live en mode tournoi : équité requise pour payer un tapis selon l'ICM des tapis saisis |

Sources : [Poker Academy, guide des rapports agrégés](https://poker.academy/blog/post/aggregated-reports-guide) · [PokerNews, rapports agrégés personnalisables de GTO Wizard (2025)](https://www.pokernews.com/news/2025/06/gto-wizard-customizable-aggregated-reports-48758.htm) · [The Poker Bank, utiliser Flopzilla](https://thepokerbank.com/videos/splitsuit/using-flopzilla) · [GrindStack, App Store](https://apps.apple.com/qa/app/grindstack-live-poker-notes/id6744820078) · [Poler, App Store](https://apps.apple.com/us/app/poler-poker-bankroll-tracker/id828305743)
