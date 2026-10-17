// Cours A-Z. Chaque module : id, titre, durée de lecture estimée, sections HTML, exercice lié.
(function (root) {
  const M = [];
  const mod = (id, title, minutes, drill, sections) => M.push({ id, title, minutes, drill, sections });

  mod('cadre', 'Le cadre : légal, interdit, fiscal', 8, 'regles', [
    ['Où jouer', `<p>En France, le poker en ligne n'est légal que chez les opérateurs agréés par l'<strong>ANJ</strong> (Autorité nationale des jeux) : PokerStars.fr, Winamax, Betclic, PMU et quelques autres. Vérifie l'agrément sur anj.fr avant d'ouvrir un compte. Un site hors liste ne te protège pas : gains bloqués, aucun recours.</p>
      <p>PokerStars.fr partage ses tables avec l'Espagne et le Portugal. Winamax aussi. Plus de joueurs veut dire plus de tables et plus de récréatifs.</p>`],
    ['Ce qui te fait bannir', `<p>Règle simple : <strong>pendant une main, toi seul décides</strong>. Tout ce qui t'aide pendant le jeu est sanctionné par la fermeture du compte et, chez la plupart des rooms, la confiscation du solde.</p>
      <ul>
        <li><strong>RTA</strong> (assistance en temps réel) : solveur, tableau de ranges, appli ou IA consultés pendant que tu joues. PokerStars interdit même les charts préflop ouverts pendant le jeu.</li>
        <li><strong>Aide extérieure</strong> : un ami qui regarde ton écran et te conseille, un groupe Discord pendant une session.</li>
        <li><strong>Collusion</strong> : partager ses cartes ou jouer « en équipe » contre un tiers.</li>
        <li><strong>Multi-comptes</strong> et prêt de compte.</li>
        <li><strong>Bots</strong> et scripts qui cliquent à ta place.</li>
        <li><strong>Achat de bases de mains</strong> que tu n'as pas jouées (data mining).</li>
      </ul>
      <p><strong>Autorisé</strong> : le HUD intégré de Winamax, les trackers que la room autorise (sa boutique VIP en liste), l'étude avant et après les sessions. Cette appli s'utilise hors session uniquement : ferme-la avant de t'asseoir.</p>
      <p>Les HUD « dynamiques », qui changent selon le board, sont interdits sur Winamax. En cas de doute sur un logiciel, demande au support <em>avant</em> de l'installer et garde la réponse écrite.</p>`],
    ['Fiscalité', `<p>Principe : les gains de jeu d'un joueur occasionnel ne sont pas imposables. Exception poker : le Conseil d'État (2018) impose en <strong>BNC</strong> les gains tirés d'une pratique habituelle, quand le savoir-faire maîtrise l'aléa et que les revenus sont significatifs, même si tu as un autre métier. Si le poker devient une source de revenus régulière, parle à un comptable. Je ne suis pas conseiller fiscal : ceci est le principe, pas un avis sur ton cas.</p>`],
    ['Jeu responsable', `<p>Fixe dans le client de la room des plafonds de dépôt et de perte <em>avant</em> la première session. En général, une baisse s'applique tout de suite et une hausse avec un délai : c'est voulu. Joueurs Info Service : 09 74 75 13 13 (appel non surtaxé).</p>`],
  ]);

  mod('regles', 'Règles du Hold\'em No Limit', 10, 'regles', [
    ['Une main, du début à la fin', `<ol>
        <li><strong>Blindes</strong> : la petite blinde (SB) et la grosse blinde (BB) mettent une mise forcée. On parle des limites par la BB : NL10 = blindes 0,05/0,10 €, tapis de départ 10 € (100 bb).</li>
        <li><strong>Préflop</strong> : chacun reçoit 2 cartes. On parle dans l'ordre, à gauche de la BB (UTG). La BB parle en dernier.</li>
        <li><strong>Flop</strong> : 3 cartes communes. À partir d'ici, on parle à gauche du bouton : le bouton parle en dernier jusqu'à la fin.</li>
        <li><strong>Turn</strong> : 4e carte. <strong>River</strong> : 5e carte.</li>
        <li><strong>Abattage</strong> : meilleure combinaison de 5 cartes parmi les 7 (tes 2 + les 5 du board). Tu peux utiliser 0, 1 ou 2 de tes cartes.</li>
      </ol>`],
    ['Les actions', `<ul>
        <li><strong>Parole (check)</strong> : possible seulement si personne n'a misé dans le tour.</li>
        <li><strong>Miser</strong>, <strong>suivre (call)</strong>, <strong>relancer (raise)</strong>, <strong>se coucher (fold)</strong>, <strong>tapis (all-in)</strong>.</li>
        <li><strong>Relance minimale</strong> : l'augmentation doit être au moins égale à la dernière mise ou relance du tour. Blindes 0,05/0,10, ouverture à 0,30 (augmentation de 0,20) : la sur-relance minimale est 0,50.</li>
        <li>En No Limit, tu peux miser tout ton tapis à tout moment. Tu ne peux jamais perdre plus que ce que tu as sur la table.</li>
      </ul>`],
    ['Tapis et pots annexes', `<p>Un joueur à tapis ne peut gagner sur chaque adversaire que ce qu'il a misé. Exemple : A a 20 €, B et C ont 50 €. Tous à tapis. Pot principal = 3 × 20 = 60 € (A, B, C en lice). Pot annexe = 2 × 30 = 60 € (B et C seulement). Si A a la meilleure main, il prend 60 € ; le pot annexe va au meilleur entre B et C.</p>`],
    ['Égalités et kickers', `<ul>
        <li>À combinaison égale, les cartes restantes (kickers) départagent, toujours dans la limite de 5 cartes.</li>
        <li>Si le board forme la meilleure main pour tous (quinte au board par exemple), on partage.</li>
        <li>Les couleurs (pique, cœur…) n'ont aucune valeur entre elles. Deux couleurs se départagent par la plus haute carte.</li>
        <li>L'As compte en haut (10-V-D-R-A) et en bas (A-2-3-4-5, la « roue », plus petite suite).</li>
      </ul>`],
    ['Étiquette en jeu physique', `<p>Annonce ton action à voix haute avant de pousser les jetons : une « mise en plusieurs fois » (string bet) est refusée. Un seul jeton plus gros que la mise, posé sans annonce, vaut un simple call. Garde tes cartes visibles sur la table, ne commente jamais une main en cours, ne montre pas tes cartes à un joueur couché. Téléphone hors de la table pendant les mains : la plupart des casinos l'imposent.</p>`],
  ]);

  mod('mains', 'Classement des mains', 5, 'meilleure', [
    ['Du plus fort au plus faible', `<table class="t"><thead><tr><th>Combinaison</th><th>Exemple</th><th>Fréquence sur 7 cartes</th></tr></thead><tbody>
      <tr><td>Quinte flush</td><td>9♥ 8♥ 7♥ 6♥ 5♥</td><td>0,03 %</td></tr>
      <tr><td>Carré</td><td>K♠ K♥ K♦ K♣ 4♦</td><td>0,17 %</td></tr>
      <tr><td>Full</td><td>Q♠ Q♥ Q♦ 7♣ 7♦</td><td>2,6 %</td></tr>
      <tr><td>Couleur</td><td>A♦ J♦ 8♦ 5♦ 2♦</td><td>3,0 %</td></tr>
      <tr><td>Suite</td><td>T♠ 9♥ 8♦ 7♣ 6♠</td><td>4,6 %</td></tr>
      <tr><td>Brelan</td><td>7♠ 7♥ 7♦ K♣ 2♠</td><td>4,8 %</td></tr>
      <tr><td>Double paire</td><td>A♠ A♥ 9♦ 9♣ 3♠</td><td>23,5 %</td></tr>
      <tr><td>Paire</td><td>J♠ J♥ A♦ 8♣ 4♠</td><td>43,8 %</td></tr>
      <tr><td>Hauteur</td><td>A♠ Q♥ 9♦ 6♣ 3♠</td><td>17,4 %</td></tr></tbody></table>
      <p class="note">Fréquences : probabilité que 7 cartes au hasard donnent au mieux cette combinaison.</p>`],
    ['Les pièges classiques', `<ul>
        <li>Board A-A-K-K-5, tu as D-V, l'adversaire 7-2 : tu gagnes (AAKK + D contre AAKK + 5).</li>
        <li>Board avec 4 cœurs : un seul cœur en main suffit pour la couleur. Le plus haut cœur gagne.</li>
        <li>Brelan avec une paire servie (« set ») contre brelan avec paire au board (« trips ») : même combinaison, mais le set est bien plus caché et le kicker du trips compte.</li>
        <li>Suite au board : tu ne gagnes que si tu l'améliores avec une carte au-dessus.</li>
      </ul>`],
  ]);

  mod('positions', 'Positions : l\'avantage d\'information', 6, 'rfi', [
    ['Les 6 sièges', `<p>Dans l'ordre de parole préflop : <strong>UTG</strong>, <strong>HJ</strong>, <strong>CO</strong>, <strong>BTN</strong> (bouton), <strong>SB</strong>, <strong>BB</strong>. Après le flop, le bouton parle en dernier.</p>
      <p>Parler après l'adversaire, c'est voir ce qu'il fait avant de décider. Tu contrôles la taille du pot, tu bluffes mieux, tu prends plus de valeur. Conséquence directe : plus tu es proche du bouton, plus tu peux jouer de mains.</p>
      <p>Les blindes perdent de l'argent sur le long terme chez presque tous les joueurs (mise forcée + hors de position). L'objectif y est de perdre <em>moins</em>.</p>`],
    ['Largeur d\'ouverture typique', `<table class="t"><thead><tr><th>Position</th><th>% des mains ouvertes</th></tr></thead><tbody id="rfi-pct"></tbody></table>
      <p>Les ranges exactes sont dans l'onglet Ranges. Entraîne-toi dans Spots → Ouverture jusqu'à 90 % de réussite.</p>`],
  ]);

  mod('preflop', 'Préflop : ouvrir, isoler, 3-bet, défendre', 14, 'rfi', [
    ['Ouvrir (premier à entrer)', `<ul>
        <li>Personne n'est entré avant toi : <strong>relance ou couche-toi</strong>. On ne « limpe » pas (suivre la BB) en premier : tu abandonnes l'initiative et les blindes gratuites.</li>
        <li>Taille : 2 à 2,5 bb en ligne, 3 bb depuis la SB. Toujours la même taille, quelle que soit ta main, pour ne rien révéler.</li>
      </ul>`],
    ['Isoler les limpers', `<p>Un ou plusieurs joueurs ont limpé : c'est souvent un fish. Relance pour l'isoler et jouer le coup seul contre lui, en position si possible.</p>
      <p class="formula">Taille d'isolation ≈ 3,5 bb + 1 bb par limper (plus gros contre un fish qui paie tout)</p>
      <p>Range d'isolation : plus serrée que ton ouverture depuis la même position, orientée vers les mains qui font des paires fortes (As-Roi, As-Dame, paires, broadways). Les petites mains assorties perdent de la valeur multiway.</p>`],
    ['Faire face à une ouverture', `<ul>
        <li><strong>3-bet pour la valeur</strong> : QQ+, AK, et contre une ouverture tardive aussi JJ, TT, AQ. Taille ≈ 3 fois l'ouverture en position, 4 fois hors de position.</li>
        <li><strong>3-bet bluff</strong> : quelques mains bloqueuses (A5s-A2s, KJs) contre les joueurs qui ouvrent large et se couchent trop. Contre un fish qui paie tout : zéro bluff, 3-bet uniquement la valeur, mais plus large.</li>
        <li><strong>Suivre (call)</strong> : en position avec paires et assorties jouables. Hors de position (sauf BB), préfère 3-bet ou fold.</li>
        <li>Plus l'ouverture vient de loin (UTG), plus sa range est forte : serre-toi.</li>
      </ul>`],
    ['Défendre la grosse blinde', `<p>Tu as déjà 1 bb dans le pot. Contre une ouverture à 2,5 bb, tu paies 1,5 bb pour un pot de 5 bb : il te faut environ 23 % d'équité. Tu défends donc large contre le bouton (beaucoup d'assorties, connecteurs, As faibles), plus serré contre UTG.</p>`],
    ['Contre un 3-bet', `<p>Tu as ouvert et quelqu'un sur-relance. Continue avec le haut de ta range (4-bet QQ+/AK, call JJ-99, AQs, assorties fortes en position). Le reste se couche. Contre un joueur passif qui ne 3-bet qu'avec QQ+/AK : couche même AQ et JJ sans regret.</p>`],
    ['Tournoi : pousser ou se coucher', `<p>À 12 bb ou moins, relancer puis se coucher coûte trop cher : on joue tapis ou fold. Ordre de grandeur pour pousser seul au bouton à 10 bb : environ 40 % des mains (paires, la plupart des As, rois assortis, broadways). Plus le tapis est court, plus on pousse large. Les antes élargissent encore.</p>`],
  ]);

  mod('maths', 'Les maths qui décident', 16, 'odds', [
    ['Cotes du pot', `<p>Tu dois payer une mise : combien de fois dois-tu gagner pour que ce soit rentable ?</p>
      <p class="formula">Équité requise = mise à payer ÷ (pot final après ton call)</p>
      <p>Pot 100, l'adversaire mise 50 : tu paies 50 pour un pot final de 200 → 25 %. Retiens les tailles courantes :</p>
      <table class="t"><thead><tr><th>Mise adverse</th><th>Équité requise</th></tr></thead><tbody>
      <tr><td>¼ du pot</td><td>16,7 %</td></tr><tr><td>⅓ du pot</td><td>20 %</td></tr><tr><td>½ pot</td><td>25 %</td></tr>
      <tr><td>⅔ du pot</td><td>28,6 %</td></tr><tr><td>¾ du pot</td><td>30 %</td></tr><tr><td>Pot</td><td>33,3 %</td></tr><tr><td>2 × pot</td><td>40 %</td></tr></tbody></table>`],
    ['Outs et règle du 2 et 4', `<p>Un <strong>out</strong> est une carte qui te donne la meilleure main. Approximation : outs × 2 ≈ % pour une carte ; outs × 4 ≈ % pour deux cartes (flop jusqu'à la river, si tu vas jusqu'au bout).</p>
      <table class="t"><thead><tr><th>Tirage</th><th>Outs</th><th>1 carte</th><th>2 cartes</th></tr></thead><tbody>
      <tr><td>Couleur</td><td>9</td><td>19,1 %</td><td>35,0 %</td></tr>
      <tr><td>Suite par les deux bouts</td><td>8</td><td>17,0 %</td><td>31,5 %</td></tr>
      <tr><td>Couleur + suite par les deux bouts</td><td>15</td><td>31,9 %</td><td>54,1 %</td></tr>
      <tr><td>Ventrale (gutshot)</td><td>4</td><td>8,5 %</td><td>16,5 %</td></tr>
      <tr><td>Deux overcards</td><td>6</td><td>12,8 %</td><td>24,1 %</td></tr></tbody></table>
      <p class="note">Valeurs exactes pour 47 cartes inconnues (flop vers turn) et 2 cartes à venir. Attention aux outs « sales » : un cœur qui donne aussi un full à l'adversaire n'est pas un vrai out.</p>`],
    ['Cotes implicites', `<p>Ce que tu gagneras en plus <em>après</em> avoir touché. Avec 5-5, tu touches un brelan au flop 11,8 % du temps (environ 1 fois sur 8,5). Pour suivre une relance juste pour le brelan, il faut pouvoir gagner environ 15 à 20 fois la mise payée : tapis profonds et adversaire capable de payer. Les fish paient : c'est là que les cotes implicites deviennent énormes.</p>`],
    ['Bluff et défense minimale', `<p class="formula">Un bluff de taille B dans un pot P est rentable si l'adversaire se couche plus de B ÷ (P + B)</p>
      <p>Mise ¾ pot → il doit se coucher plus de 43 %. Mise pot → plus de 50 %.</p>
      <p class="formula">Défense minimale (MDF) = P ÷ (P + B)</p>
      <p>Contre une mise pot, un joueur doit continuer avec 50 % de sa range pour que tout bluff ne soit pas rentable. Contre un fish qui ne bluffe jamais, ignore la MDF : couche plus.</p>`],
    ['Espérance (EV)', `<p class="formula">EV = Σ (probabilité × gain) − Σ (probabilité × perte)</p>
      <p>Une décision se juge à son EV, pas au résultat de la main. Payer avec 40 % d'équité quand il en faut 25 % est un bon call même si tu perds le coup. Le journal sépare résultat et décision pour cette raison.</p>`],
    ['Combinatoire', `<ul>
        <li>Paire servie (AA) : 6 combinaisons. Main assortie (AKs) : 4. Dépareillée (AKo) : 12. Total AK : 16.</li>
        <li>Une carte au board divise : un As au flop, il ne reste que 3 combos de AA.</li>
        <li><strong>Bloqueurs</strong> : avoir l'As de pique sur un board à 3 piques empêche l'adversaire d'avoir la couleur max. Utile pour choisir ses bluffs.</li>
      </ul>`],
    ['SPR', `<p class="formula">SPR = tapis effectif ÷ pot au flop</p>
      <p>SPR bas (moins de 3) : une top paire peut aller à tapis. SPR haut (plus de 10) : une paire ne vaut pas un tapis, il faut deux paires ou mieux. Le SPR se décide préflop : 3-bet = SPR bas.</p>`],
  ]);

  mod('postflop', 'Postflop : textures, tailles, plan de main', 16, 'tirage', [
    ['Lire la texture', `<ul>
        <li><strong>Sec</strong> (K♠ 7♦ 2♣) : peu de tirages, favorise celui qui a relancé préflop (plus de rois, d'As).</li>
        <li><strong>Connecté et deux couleurs</strong> (9♥ 8♥ 7♣) : beaucoup de tirages, favorise le défenseur de la BB (plus de 98, T9, 65…).</li>
        <li><strong>Paire au board</strong> : moins de combinaisons de brelan, les bluffs crédibles changent.</li>
      </ul>
      <p>Question avant chaque mise : à qui ce board profite-t-il ?</p>`],
    ['Continuation bet', `<ul>
        <li>Board sec qui te favorise : mise petite (25-33 % du pot) avec presque toute ta range.</li>
        <li>Board humide qui favorise l'adversaire : checke plus souvent ; mise plus gros (60-75 %) avec tes mains fortes et tes bons tirages.</li>
        <li>Multiway (3 joueurs ou plus) : mise seulement avec une vraie main ou un gros tirage.</li>
      </ul>`],
    ['Pourquoi tu mises', `<p>Une mise a toujours une de ces deux raisons :</p>
      <ul><li><strong>Valeur</strong> : être payé par pire.</li><li><strong>Bluff</strong> : faire coucher mieux.</li></ul>
      <p>« Pour voir où j'en suis » n'est pas une raison : pire se couche, mieux continue. La protection (empêcher un tirage gratuit) s'ajoute à la valeur, elle ne la remplace pas.</p>`],
    ['Turn et river', `<ul>
        <li><strong>Deuxième barrel</strong> : continue sur les turns qui améliorent ta range ou ton tirage (overcards, carte de couleur si tu as l'As).</li>
        <li><strong>River polarisée</strong> : grosse mise avec les très bonnes mains et les bluffs ; check avec les mains moyennes, qui gagnent souvent à l'abattage.</li>
        <li><strong>Value fine</strong> : contre un fish, mise même la deuxième paire bon kicker. Il paie avec pire.</li>
        <li><strong>Bluff-catcher</strong> : main qui ne bat que des bluffs. Paie selon la fréquence de bluff de l'adversaire, pas selon la force de ta main.</li>
      </ul>`],
    ['Le plan de main', `<p>Au flop, décide déjà : combien de rues de valeur ma main mérite-t-elle ? Quelles turns me font abandonner ? Un plan évite les décisions prises sous pression à la river.</p>`],
  ]);

  mod('fish', 'Les adversaires et les fish', 14, 'situations', [
    ['Reconnaître un profil', `<p>Avec le HUD autorisé de la room : <strong>VPIP</strong> = % de mains où il met de l'argent volontairement ; <strong>PFR</strong> = % où il relance préflop.</p>
      <table class="t"><thead><tr><th>Profil</th><th>VPIP / PFR</th><th>Comment il perd</th></tr></thead><tbody>
      <tr><td>Fish passif (calling station)</td><td>40+ / moins de 10</td><td>Paie trop, ne bluffe presque jamais</td></tr>
      <tr><td>Maniaque</td><td>50+ / 35+</td><td>Relance et bluffe sans retenue</td></tr>
      <tr><td>Nit (roc)</td><td>moins de 15 / moins de 12</td><td>Trop serré, se couche trop</td></tr>
      <tr><td>Régulier solide</td><td>20-28 / 17-24</td><td>Peu d'erreurs : évite-le</td></tr></tbody></table>
      <p>Sans HUD : un joueur qui limpe, paie des relances avec n'importe quoi et montre des mains improbables à l'abattage est un fish. Prends des notes sur lui.</p>`],
    ['Exploiter le fish passif', `<ul>
        <li><strong>Mise ta valeur, gros</strong> : 70-100 % du pot. Il paie avec top paire petit kicker, deuxième paire, tirages ratés.</li>
        <li><strong>Zéro bluff</strong> : il ne se couche pas. Un bluff contre lui est un don.</li>
        <li><strong>Crois ses grosses mises</strong> : un joueur passif qui mise gros ou relance à la turn ou river a presque toujours une main forte. Couche tes mains moyennes.</li>
        <li><strong>Isole-le</strong> préflop et joue-le en position. Assieds-toi à sa gauche : il parle avant toi.</li>
      </ul>`],
    ['Exploiter le maniaque', `<p>Laisse-le bluffer : checke tes mains fortes, paie plus large (deuxième paire, top paire), ne bluffe pas contre lui. La variance monte : réduis le nombre de tables.</p>`],
    ['Exploiter le nit', `<p>Vole ses blindes en permanence. Quand il relance ou sur-relance, couche tout sauf le très haut de ta range. Il ne paie pas assez pour faire de la value fine.</p>`],
    ['Garder le fish à la table', `<p>Ne commente jamais son jeu, n'écris rien dans le chat, ne le traite pas mal après un coup chanceux. Un fish qui s'amuse reste et recave. Désactive le chat si tu sens que tu vas craquer.</p>`],
    ['Choisir ses tables', `<p>Ta source de gains, ce sont les erreurs des autres. Une table avec deux fish vaut plus que dix heures d'étude. Ouvre les tables où le VPIP moyen est élevé, quitte celles qui ne comptent que des réguliers.</p>`],
  ]);

  mod('formats', 'Formats : cash, tournois, Expresso', 12, 'situations', [
    ['Cash game', `<p>Jetons = argent. Tu arrives et repars quand tu veux, tu recaves à 100 bb. Meilleur format pour apprendre : profondeur constante, décisions comparables, mesure du winrate en bb/100.</p>`],
    ['Tournois (MTT)', `<ul>
        <li>Les blindes montent : la profondeur change en permanence. Au-dessus de 40 bb on joue comme en cash ; entre 15 et 40 bb, moins de calls et plus de 3-bet tapis ; sous 12 bb, pousser ou se coucher.</li>
        <li><strong>ICM</strong> : les jetons perdus coûtent plus en € que les jetons gagnés n'en rapportent. Près de la bulle et en table finale, couche des mains que tu paierais en cash, surtout face au gros tapis.</li>
        <li>Variance énorme : la plupart du gain vient de rares grosses places.</li>
      </ul>`],
    ['Expresso / Spin', `<p>3 joueurs, tapis courts, gain multiplié tiré au sort au départ. La plupart des décisions se résument à tapis ou fold : apprends les tableaux de push/fold hors session. Le multiplicateur rend la variance extrême. Le rake est inclus dans la structure des multiplicateurs : ton edge doit être large pour gagner.</p>`],
    ['Jeu physique', `<p>Plus lent (25 à 35 mains par heure contre 60+ en ligne par table), adversaires souvent plus faibles, pas de HUD : tes notes sont dans ta tête. Les tells existent mais restent peu fiables : le meilleur tell reste la taille des mises et le timing.</p>`],
  ]);

  mod('bankroll', 'Bankroll, variance, rake', 10, 'situations', [
    ['Combien de caves', `<table class="t"><thead><tr><th>Format</th><th>Repère prudent</th></tr></thead><tbody>
      <tr><td>Cash 6-max</td><td>40 caves (40 × 10 € pour la NL10)</td></tr>
      <tr><td>MTT</td><td>150-200 buy-ins</td></tr>
      <tr><td>Expresso</td><td>100+ buy-ins</td></tr></tbody></table>
      <p>Descends de limite dès que tu passes sous le seuil. Remonter tarde, descendre jamais. Ces repères sont des règles de prudence usuelles, pas des vérités : plus tu es joueur de variance (tournois), plus il faut de marge.</p>`],
    ['La variance en chiffres', `<p>En cash 6-max, l'écart-type tourne souvent autour de 80 à 100 bb/100. Avec 90 et un vrai winrate de +5 bb/100, après 50 000 mains ton résultat observé peut se situer n'importe où entre environ −3 et +13 bb/100 (intervalle à 95 %). Des downswings de 20 à 30 caves arrivent à des joueurs gagnants. Le simulateur de l'onglet Journal te le montre sur des courbes.</p>`],
    ['Le rake', `<p>La room prélève un pourcentage de chaque pot (plafonné). En micro-limites, il peut représenter plus que le gain d'un bon joueur. Conséquences : évite les pots inutiles à plusieurs joueurs, compare le rakeback des rooms, monte de limite dès que ta bankroll le permet (le rake pèse moins en proportion).</p>`],
  ]);

  mod('mental', 'Mental et tilt', 8, 'situations', [
    ['Les formes du tilt', `<ul>
        <li><strong>Injustice</strong> : « il n'aurait jamais dû payer ». Il a payé, et c'est pour ça que tu gagnes à long terme.</li>
        <li><strong>Revanche</strong> : jouer contre un joueur précis au lieu de jouer ses cartes.</li>
        <li><strong>Perte</strong> : vouloir se refaire, monter de limite.</li>
        <li><strong>Euphorie</strong> : après un gros gain, jouer des mains qu'on ne joue pas.</li>
        <li><strong>Fatigue</strong> : décisions lentes, calls « pour voir ».</li>
      </ul>`],
    ['Règles d\'arrêt (à écrire avant de jouer)', `<ul>
        <li>Stop-loss : 3 caves perdues dans la session → stop.</li>
        <li>Un coup ressenti comme injuste → pause de 10 minutes minimum.</li>
        <li>Durée maximale fixée à l'avance.</li>
        <li>Jamais monter de limite pour se refaire.</li>
      </ul>
      <p>Le journal applique ces règles : il t'affiche l'alerte dès que tu saisis la perte.</p>`],
    ['Routine', `<ol><li>Avant : 10 minutes de Spots du jour, checklist anti-tilt, objectif de session (une seule chose à travailler).</li>
      <li>Pendant : uniquement la room. Cette appli fermée.</li>
      <li>Après : saisie dans le journal, 3 mains notées à revoir dans l'outil d'équité.</li></ol>`],
  ]);

  mod('progression', 'Plan de progression', 6, 'situations', [
    ['Les étapes', `<ol>
      <li><strong>Semaines 1-2</strong> : modules 1 à 5, Spots → Ouverture à 90 %, Spots → Cotes du pot à 90 %. Jeu en freerolls ou micro-limites seulement.</li>
      <li><strong>Semaines 3-6</strong> : NL2 ou NL5 cash, 2 tables maximum. Après chaque session, revue de 3 mains.</li>
      <li><strong>Ensuite</strong> : monter d'une limite seulement si (1) la bankroll le permet et (2) le winrate est positif sur au moins 30 000 mains.</li></ol>
      <p>Mesure ta progression sur les décisions (taux de réussite aux Spots, qualité des revues), pas sur l'argent des 1 000 dernières mains.</p>`],
  ]);

  // Mise en situation : QCM écrits à la main, vérifiés. cat ∈ Règles, Préflop, Maths, Postflop, Fish, Tournoi, Mental, Légal.
  const S = [
    ['Règles', 'Blindes 0,05/0,10. UTG ouvre à 0,30. Quelle est la sur-relance minimale ?', ['0,40', '0,50', '0,60'], 1, 'L\'augmentation doit égaler la dernière : 0,30 − 0,10 = 0,20. Donc 0,30 + 0,20 = 0,50.'],
    ['Règles', 'Board A♠ A♦ K♣ K♥ 5♠. Tu as D♥ V♣, l\'adversaire 7♦ 2♦. Résultat ?', ['Partage', 'Tu gagnes', 'Il gagne'], 1, 'Vous avez tous deux AAKK ; ton kicker Dame bat son 5 (qui vient du board).'],
    ['Règles', 'Board 9♠ 9♥ 9♦ 9♣ 2♠. Tu as R♠ 3♦, l\'adversaire D♥ D♣. Résultat ?', ['Partage', 'Tu gagnes', 'Il gagne'], 1, 'Carré de 9 pour les deux. Cinquième carte : ton Roi bat sa Dame. Sa paire ne compte pas, la main fait 5 cartes.'],
    ['Règles', 'Board 5♣ 6♦ 7♠ 8♥ 9♣. Tu as A♠ A♥, l\'adversaire 2♣ 3♦. Résultat ?', ['Partage', 'Tu gagnes', 'Il gagne'], 0, 'Le board fait la suite au 9 pour tous. Tes As ne l\'améliorent pas : partage.'],
    ['Règles', 'A (20 €), B et C (50 € chacun) sont à tapis. A a la meilleure main. Combien gagne-t-il ?', ['60 €', '120 €', '150 €'], 0, 'A ne peut prendre que 20 € à chaque joueur : 3 × 20 = 60 €. Les 60 € du pot annexe se jouent entre B et C.'],
    ['Règles', 'Board A♥ K♥ 7♥ 4♥ 9♣. Tu as 2♥ D♠, l\'adversaire 5♥ 5♣. Résultat ?', ['Tu gagnes', 'Il gagne', 'Partage'], 1, 'Couleur pour les deux : A-K-7-5-4 contre A-K-7-4-2. Son 5♥ bat ton 2♥.'],
    ['Règles', 'Deux suites : A-2-3-4-5 contre 2-3-4-5-6. Laquelle gagne ?', ['A-2-3-4-5', '2-3-4-5-6', 'Partage'], 1, 'Dans la roue, l\'As compte comme 1. La suite au 6 est plus haute.'],
    ['Préflop', 'Bouton, tout le monde a passé, tu as R♠ 7♠. Action ?', ['Ouvrir à 2,5 bb', 'Limper', 'Se coucher'], 0, 'K7s est dans la range d\'ouverture au bouton (K2s+). On ne limpe jamais en premier.'],
    ['Préflop', 'UTG, tu as R♦ V♣ (KJo). Action ?', ['Ouvrir', 'Se coucher'], 1, 'Depuis UTG, cinq joueurs parlent après toi. KJo est dominée par AJ, AK, KQ : hors range (AJo+, KQo).'],
    ['Préflop', 'NL10. Un fish limpe. Tu as A♣ V♦ au cutoff. Action ?', ['Limper derrière', 'Relancer à 2 bb', 'Relancer à ~4,5 bb', 'Se coucher'], 2, 'Isole le fish avec une taille qui lui fait payer trop cher : 3,5 bb + 1 par limper, voire plus contre un joueur qui paie tout.'],
    ['Préflop', 'Grosse blinde. Le bouton ouvre à 2,5 bb, la SB se couche. Tu as 9♥ 7♥. Action ?', ['Se coucher', 'Suivre', 'Tapis'], 1, 'Tu paies 1,5 bb pour un pot de 5 bb (~23 % d\'équité requise). 97s a assez d\'équité et de jouabilité contre une range de bouton large.'],
    ['Préflop', 'Bouton, tu as D♠ D♦. Le cutoff ouvre à 2,5 bb. Action ?', ['Suivre', '3-bet à ~7,5 bb', 'Tapis 100 bb'], 1, 'QQ est une main de valeur : 3-bet environ 3 fois l\'ouverture en position. Le tapis direct ne fait payer que les mains qui te battent.'],
    ['Préflop', 'Grosse blinde, tout le monde limpe, tu as 7♣ 2♦. Action ?', ['Se coucher', 'Checker', 'Relancer'], 1, 'Voir le flop est gratuit. Se coucher sans mise à payer est une erreur pure.'],
    ['Préflop', 'Tu ouvres UTG avec A♦ D♦. Un joueur passif (VPIP 25, 3-bet 2 %) te sur-relance. Action par défaut ?', ['4-bet', 'Suivre ou se coucher, sans 4-bet', 'Tapis'], 1, 'Un 3-bet à 2 % ne contient presque que QQ+ et AK. AQs est dominée : pas de 4-bet bluff contre une range aussi forte.'],
    ['Maths', 'Pot 100, l\'adversaire mise 50. Quelle équité te faut-il pour suivre ?', ['33 %', '25 %', '50 %'], 1, '50 ÷ (100 + 50 + 50) = 25 %.'],
    ['Maths', 'Tirage couleur au flop, sans autre out. Chances de toucher d\'ici la river ?', ['~19 %', '~35 %', '~50 %'], 1, '9 outs, deux cartes : 35 % (règle du 4 : 36 %). Une seule carte : ~19 %.'],
    ['Maths', 'Tu mises ¾ du pot en bluff. À partir de quel % de couchers le bluff est-il rentable ?', ['30 %', '43 %', '75 %'], 1, '75 ÷ (100 + 75) = 42,9 %.'],
    ['Maths', 'Un As est au flop. Combien de combinaisons de AA reste-t-il ?', ['6', '3', '1'], 1, '4 As au départ, un au board : C(3,2) = 3 combinaisons.'],
    ['Maths', 'Tu suis préflop avec 5-5 pour toucher un brelan. Probabilité au flop ?', ['~6 %', '~12 %', '~25 %'], 1, '11,8 %, environ 1 fois sur 8,5. Il faut donc de gros gains implicites pour suivre une relance.'],
    ['Maths', 'L\'adversaire mise la taille du pot. Défense minimale théorique ?', ['33 %', '50 %', '67 %'], 1, 'MDF = P ÷ (P + B) = 100 ÷ 200 = 50 %. À ajuster : contre un joueur qui ne bluffe jamais, couche plus.'],
    ['Postflop', 'Tu ouvres au bouton, la BB paie. Flop R♠ 7♦ 2♣. Plan par défaut ?', ['Petite mise avec presque toute ta range', 'Check toute ta range', 'Grosse mise uniquement avec un roi'], 0, 'Board sec qui favorise ta range (plus de rois, d\'As, de paires hautes). Une petite mise (~33 %) suffit.'],
    ['Postflop', 'Tu ouvres UTG, la BB paie. Flop 9♥ 8♥ 7♣. Plan par défaut ?', ['Petite mise avec toute ta range', 'Checker souvent, miser gros tes meilleures mains et tirages', 'Tapis'], 1, 'Board connecté qui favorise la BB (98, T9, 65, 77…). Une mise automatique perd de l\'argent.'],
    ['Postflop', 'River sans danger. Tu as top paire bon kicker contre un fish passif qui a payé flop et turn. Action ?', ['Check', 'Petite mise', 'Grosse mise (70-100 % du pot)'], 2, 'Il paie avec pire bien trop souvent. La taille de mise est le levier principal contre lui.'],
    ['Postflop', 'River ratée, tu n\'as rien. L\'adversaire est une calling station qui a payé flop et turn. Action ?', ['Bluffer gros', 'Abandonner (check)', 'Petit bluff'], 1, 'Il ne se couche pas. Ton bluff n\'a pas de fold equity : check et passe.'],
    ['Postflop', 'Un nit (VPIP 12) check-relance la river. Tu as top paire. Action ?', ['Payer', 'Se coucher', 'Sur-relancer'], 1, 'Un nit ne check-relance pas la river en bluff. Ta top paire ne bat presque rien de sa range.'],
    ['Postflop', 'Tu as un brelan sur un board avec tirages couleur et suite, contre un fish. Action ?', ['Slowplay', 'Grosse mise', 'Mise minimum'], 1, 'Valeur et protection : il paiera avec ses tirages et ses paires. Le slowplay lui donne des cartes gratuites.'],
    ['Fish', 'HUD : VPIP 52 / PFR 4. Quel profil ?', ['Régulier', 'Fish passif', 'Maniaque'], 1, 'Joue une main sur deux, ne relance presque jamais : il paie. Value bet gros, zéro bluff.'],
    ['Fish', 'Où t\'asseoir par rapport au fish ?', ['À sa droite', 'À sa gauche', 'En face'], 1, 'À sa gauche, tu parles après lui sur la plupart des coups : position maximale contre le joueur qui te rapporte le plus.'],
    ['Fish', 'Un fish passif mise gros à la river après avoir checké-payé. Tu as deuxième paire. Action ?', ['Payer', 'Se coucher', 'Relancer'], 1, 'Les joueurs passifs bluffent rarement gros à la river. Sa grosse mise est presque toujours de la valeur.'],
    ['Fish', 'Un fish te bat avec un call absurde. Que fais-tu ?', ['Lui expliquer son erreur dans le chat', 'Rien, ou « bien joué »', 'Quitter la table'], 1, 'Il doit rester et recaver. Chaque commentaire le pousse à progresser ou à partir.'],
    ['Fish', 'Contre un maniaque qui mise chaque street, tu as top paire au flop. Plan ?', ['Relancer tout de suite', 'Payer et le laisser bluffer', 'Se coucher'], 1, 'Laisse-le miser avec ses bluffs. Relancer ne fait coucher que ses mains les plus faibles, celles que tu veux voir continuer.'],
    ['Tournoi', 'Bulle d\'un tournoi. Tu as 15 bb en BB, le chip leader fait tapis du bouton. Tu as A♣ V♦. Par rapport au cash ?', ['Payer plus souvent', 'Se coucher plus souvent', 'Aucune différence'], 1, 'ICM : perdre ton tapis te sort sans gain, doubler ne double pas ta part du prize pool. Couche des mains rentables en jetons.'],
    ['Tournoi', 'Tournoi, 8 bb, tu es SB, tous ont passé. Tu as A♦ 4♣. Action ?', ['Limper', 'Tapis', 'Se coucher'], 1, 'À 8 bb, A4o est un tapis rentable depuis la SB contre la seule BB.'],
    ['Tournoi', 'Les antes arrivent. Effet sur tes vols de blindes ?', ['Voler moins', 'Voler plus', 'Aucun'], 1, 'Le pot de départ grossit : chaque vol rapporte plus pour le même risque.'],
    ['Mental', 'Tu viens de perdre 3 caves dans la session et tu es énervé. Que fais-tu ?', ['Monter de limite pour se refaire', 'Continuer', 'Arrêter la session'], 2, 'Stop-loss atteint. Le tilt coûte plus que n\'importe quelle mauvaise main.'],
    ['Mental', 'Bankroll 250 €, règle des 40 caves en cash. Limite maximale ?', ['NL5', 'NL10', 'NL25'], 0, 'NL5 : 40 × 5 € = 200 €. NL10 demanderait 400 €.'],
    ['Mental', 'Après 5 000 mains à +10 bb/100, tu sais que tu es gagnant ?', ['Oui', 'Non'], 1, 'Avec un écart-type de ~90 bb/100, l\'intervalle à 95 % sur 5 000 mains fait environ ±25 bb/100. Rien n\'est prouvé.'],
    ['Légal', 'Un ami regarde ton écran et te conseille pendant la main. C\'est…', ['Autorisé', 'Interdit'], 1, 'Aide extérieure pendant le jeu : sanction possible jusqu\'à la fermeture du compte.'],
    ['Légal', 'Tu veux vérifier un spot dans un solveur entre deux mains, tables ouvertes. C\'est…', ['Autorisé', 'Interdit'], 1, 'PokerStars interdit solveurs et charts pendant le jeu ; les autres rooms sanctionnent le RTA. Note la main et étudie après la session.'],
    ['Légal', 'Utiliser le HUD intégré de Winamax pendant le jeu. C\'est…', ['Autorisé', 'Interdit'], 0, 'Le HUD intégré est fourni par la room. Les HUD dynamiques de logiciels tiers, eux, sont interdits chez Winamax.'],
  ].map(([cat, q, opts, ok, why], i) => ({ id: 's' + i, cat, q, opts, ok, why }));

  const api = { MODULES: M, SITUATIONS: S };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Course = api;
})(typeof window !== 'undefined' ? window : globalThis);
