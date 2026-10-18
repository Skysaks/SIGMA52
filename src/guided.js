// Mains guidées : des mains scénarisées, décision par décision, avec explication de chaque option.
// L'équité du héros contre la range adverse et les cotes sont recalculées à l'affichage (jamais écrites en dur).
// Option : [libellé, note (2 = meilleure, 1 = défendable, 0 = erreur), explication]. Pot et mises en bb.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const Solver = root.Solver || require('./solver.js');
  const N = { pre: 0, flop: 3, turn: 4, river: 5 };

  const S = [
    {
      id: 'iso3', level: 2, lesson: 'fish', title: 'Isoler le fish et prendre trois rues de valeur',
      intro: 'NL10, 6-max, 100 bb. Gégé31 est un fish passif (VPIP 55, PFR 5) : il limpe beaucoup et paie trop.',
      hero: 'KcQd', pos: 'CO', villain: { name: 'Gégé31', profile: 'Fish passif', pos: 'UTG' }, board: 'Qh8c3s2d7c',
      steps: [
        { street: 'pre', story: 'Gégé31 limpe UTG, le HJ se couche. Tu as K♣ Q♦ au cutoff.', pot: 2.5, toCall: 1, range: '22+, A2+, K2+, Q2s+, J7s+, T7s+, 97s+, 86s+, 76s, 65s, Q8o+, J9o+, T9o, 98o',
          options: [['Limper derrière', 0, 'Tu laisses les blindes entrer à bas prix et tu abandonnes l\'initiative : le pot devient multiway et KQ perd beaucoup de valeur.'],
            ['Isoler à 5,5 bb', 2, '3,5 bb + 1 par limper + 1 contre un fish. Tu joues seul contre la range la plus faible de la table, en position.'],
            ['Se coucher', 0, 'KQo domine une grosse partie de la range de limp d\'un fish. Coucher cette main abandonne de la valeur.']] },
        { street: 'flop', story: 'Les blindes passent, Gégé31 paie. Pot 12,5 bb. Flop Q♥ 8♣ 3♠ : top paire, kicker roi. Il checke.', pot: 12.5, toCall: 0, range: '22+, A2+, K2+, Q2s+, J7s+, T7s+, 97s+, 86s+, 76s, 65s, Q8o+, J9o+, T9o, 98o',
          options: [['Check', 0, 'Il paierait une mise avec toutes ses dames moins bonnes, ses 8, ses paires et ses tirages. Checker lui offre une carte gratuite.'],
            ['Miser 4 bb (⅓ du pot)', 1, 'La direction est bonne, mais la taille est trop petite contre un joueur qui paie gros avec pire.'],
            ['Miser 9 bb (¾ du pot)', 2, 'Grosse mise de valeur : une calling station paie avec Qx plus faible, 8x, 33-77 et des tirages ventraux.']] },
        { street: 'turn', story: 'Il paie. Pot 30,5 bb. Turn 2♦, rien ne change. Il checke encore.', pot: 30.5, toCall: 0, range: 'A8s, A3s, K8s, Q2s+, J8s, T8s, 98s, 87s, 86s, 88, 77, 66, 55, 44, 33, A8o, K8o, Q8o+, J8o, T8o, 98o, 87o, JTs, JTo, T9s, 54s, 65s, 76s, 97s',
          options: [['Check', 0, 'Ses mains moins bonnes paient encore une mise : checker laisse de l\'argent sur la table.'],
            ['Miser 22 bb (≈ 70 % du pot)', 2, 'Deuxième grosse mise : il paie avec ses 8, ses dames faibles et ses petites paires. Tu prépares un tapis à la river.'],
            ['Tapis (88,5 bb)', 1, 'Pas absurde contre un fish, mais une mise de cette taille fait coucher une partie des 8 et des petites paires qui auraient payé 22 bb.']] },
        { street: 'river', story: 'Il paie. Pot 74,5 bb, il te reste 63,5 bb. River 7♣. Il checke.', pot: 74.5, toCall: 0, range: 'Q2s+, Q8o+, A8s, K8s, J8s, T8s, 98s, 87s, 88, 77, 66, 55, 44, 33, A8o, K8o, J8o, T8o, 98o, 87o, 76s, 97s',
          options: [['Check', 0, 'Il a payé deux grosses mises avec des mains moins bonnes que la tienne : il en paiera une troisième.'],
            ['Miser 45 bb (≈ 60 % du pot)', 2, 'Troisième rue de valeur, à une taille qu\'il paie avec ses 8 et ses dames faibles. Contre un régulier, tu aurais misé deux rues ; contre lui, trois rapportent le plus.'],
            ['Tapis (63,5 bb)', 1, 'Défendable contre une calling station, qui paie souvent quand même. La mise un peu plus petite garde plus de calls.']] },
      ],
      outro: 'Contre un fish passif : isoler préflop, puis value bet gros sur chaque rue avec une main qui bat sa range de call. Zéro bluff, maximum de valeur.',
    },
    {
      id: 'nitriver', level: 2, lesson: 'turnriver', title: 'Le nit qui check-relance la river',
      intro: 'NL25, 100 bb. Roc_Solide est un nit (VPIP 12) : très serré, il ne bluffe presque jamais.',
      hero: 'AdKc', pos: 'BTN', villain: { name: 'Roc_Solide', profile: 'Nit', pos: 'BB' }, board: 'Ks9d4c2h9c',
      steps: [
        { street: 'pre', story: 'Tout le monde passe jusqu\'à toi. Tu as A♦ K♣ au bouton.', pot: 1.5, toCall: 0, range: 'random',
          options: [['Ouvrir à 2,5 bb', 2, 'Main premium, premier à entrer : relance standard.'], ['Limper', 0, 'Jamais en premier : tu perds l\'initiative et la valeur.'], ['Tapis', 0, 'Seules les mains qui te battent ou te tiennent tête paient. Tu gaspilles la valeur d\'AK.']] },
        { street: 'flop', story: 'Roc_Solide paie en grosse blinde. Pot 5,5 bb. Flop K♠ 9♦ 4♣ : top paire top kicker. Il checke.', pot: 5.5, toCall: 0, range: '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo',
          options: [['Miser 2 bb', 2, 'Board sec, avantage de range pour toi : petite mise. Il paie avec ses rois plus faibles, ses 9 et ses paires.'],
            ['Miser 5 bb', 1, 'Correct pour la valeur, mais un nit ne paie qu\'avec des mains qui ont accroché : la petite mise garde plus de calls.'],
            ['Check', 0, 'Tu as la meilleure main possible ou presque : checker abandonne une rue de valeur.']] },
        { street: 'river', story: 'Il paie le flop et la turn 2♥ (tu as misé 6 bb). Pot 21,5 bb. River 9♣. Tu mises 7 bb, Roc_Solide check-relance à 25 bb. Il te reste à payer 18 bb.', pot: 53.5, toCall: 18, odds: true, range: '99, 44, 22, KK, K9s, K9o, A9s, Q9s, J9s, T9s, 98s',
          options: [['Payer', 0, 'Un nit ne check-relance pas la river en bluff. Sa range est faite de 9, de fulls et de rois mieux… ou de KK. Ta top paire ne bat presque rien.'],
            ['Se coucher', 2, 'Le profil décide : chez un nit, une relance tardive signifie la force. Compare ton équité réelle aux cotes ci-dessous.'],
            ['Sur-relancer à tapis', 0, 'Seules les mains qui te battent paient. La pire option.']] },
      ],
      outro: 'Les cotes ne suffisent pas : il faut les comparer à l\'équité contre la vraie range de l\'adversaire. Contre un nit, une relance river est presque toujours de la valeur.',
    },
    {
      id: 'setmine', level: 2, lesson: 'maths2', title: 'Petite paire : set mining et cotes implicites',
      intro: 'NL10, 100 bb. GrindZ (régulier) ouvre UTG.',
      hero: '5c5h', pos: 'BTN', villain: { name: 'GrindZ', profile: 'Régulier', pos: 'UTG' }, board: 'Jd5s2cQh8d',
      steps: [
        { street: 'pre', story: 'GrindZ ouvre à 2,5 bb UTG, tout le monde se couche jusqu\'à toi. Tu as 5♣ 5♥ au bouton.', pot: 4, toCall: 2.5, range: '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo',
          options: [['Payer', 2, 'Tu touches un brelan 1 fois sur 8,5 environ. Avec 100 bb derrière et la position, quand tu touches tu peux gagner un gros pot contre ses overpairs et ses As forts.'],
            ['3-bet à 7,5 bb', 0, 'Contre une range UTG solide, 55 ne se 3-bette pas pour la valeur, et en bluff il garde peu d\'équité quand on le paie.'],
            ['Se coucher', 1, 'Pas une grosse erreur, mais en position avec des tapis profonds, le call est rentable.']] },
        { street: 'flop', story: 'Les blindes passent. Pot 6,5 bb. Flop J♦ 5♠ 2♣ : brelan caché. GrindZ mise 3 bb.', pot: 9.5, toCall: 3, range: 'AA, KK, QQ, JJ, TT, 99, AJs, KJs, QJs, JTs, AJo, AK, AQ, KQ',
          options: [['Relancer à 10 bb', 2, 'Il a beaucoup d\'overpairs et de valets qui paient. Relancer construit le pot pour prendre son tapis sur trois rues.'],
            ['Payer', 1, 'Défendable sur un board sec, mais tu laisses passer l\'occasion de grossir le pot contre ses mains fortes.'],
            ['Se coucher', 0, 'Tu as presque la meilleure main possible.']] },
      ],
      outro: 'Une petite paire se joue pour toucher un brelan et gagner gros. Cela demande des tapis profonds et un adversaire capable de payer : 15 à 20 fois la mise préflop en gains possibles.',
    },
    {
      id: 'nobluff', level: 2, lesson: 'fish', title: 'Pas de bluff contre la calling station',
      intro: 'NL10, 100 bb. Mimi_Lol est une calling station (VPIP 52, PFR 6) en grosse blinde.',
      hero: 'AhQh', pos: 'BTN', villain: { name: 'Mimi_Lol', profile: 'Fish passif', pos: 'BB' }, board: '9s7s3d2cAc',
      steps: [
        { street: 'flop', story: 'Tu ouvres au bouton, Mimi_Lol paie. Pot 5,5 bb. Flop 9♠ 7♠ 3♦ : tu n\'as rien, deux overcards. Elle checke.', pot: 5.5, toCall: 0, range: '22+, A2+, K2+, Q2+, J2s+, J7o+, T5s+, T7o+, 95s+, 97o+, 85s+, 87o, 74s+, 64s+, 53s+, 43s',
          options: [['Continuation bet 2 bb', 0, 'Elle paie avec n\'importe quelle paire, tirage ou même As haut : ta fold equity est presque nulle.'],
            ['Check', 2, 'Tu prends une carte gratuite pour toucher un As ou une dame. Contre elle, on mise pour la valeur, pas pour la faire coucher.'],
            ['Miser 5 bb', 0, 'Encore plus cher pour le même résultat : elle paie.']] },
        { street: 'turn', story: 'Turn 2♣. Elle checke encore. Pot 5,5 bb.', pot: 5.5, toCall: 0, range: '22+, A2+, K2+, Q2+, J2s+, J7o+, T5s+, T7o+, 95s+, 97o+, 85s+, 87o, 74s+, 64s+, 53s+, 43s',
          options: [['Bluffer 4 bb', 0, 'Même raisonnement : elle ne se couche pas avec ses paires.'], ['Check', 2, 'Deuxième carte gratuite. Tu ne paies rien pour tes 6 outs.']] },
        { street: 'river', story: 'River A♣ : top paire, kicker dame. Elle checke. Pot 5,5 bb.', pot: 5.5, toCall: 0, range: '22+, A2+, K9+, Q9+, J9+, T9, 98, 97, 87, 76, 75, 65, 54, 53, 43, 33, 77, 99, K7s, Q7s, J7s, T7s, 73s, 93s, 83s',
          options: [['Check', 0, 'Ta main bat la plupart de ses mains qui paient : il faut miser.'], ['Miser 2 bb', 1, 'Bonne idée, taille trop petite contre une station.'], ['Miser 4 bb (≈ 75 % du pot)', 2, 'Elle paie avec ses As plus faibles, ses 9, ses 7 et ses paires : grosse value bet.']] },
      ],
      outro: 'Contre une calling station : aucun bluff, cartes gratuites quand tu rates, grosses mises quand tu touches. C\'est la même main, jouée selon le profil.',
    },
    {
      id: 'maniac', level: 2, lesson: 'fish', title: 'Payer le maniaque',
      intro: 'NL25, 100 bb. AllinKevin est un maniaque (VPIP 50, PFR 38) : il relance et bluffe sans retenue.',
      hero: 'KhJh', pos: 'BB', villain: { name: 'AllinKevin', profile: 'Maniaque', pos: 'BTN' }, board: 'Jc6d2s9d3c',
      steps: [
        { street: 'flop', story: 'AllinKevin ouvre à 3,5 bb au bouton, tu paies en grosse blinde. Pot 7,5 bb. Flop J♣ 6♦ 2♠ : top paire, kicker roi. Tu checkes, il mise 6 bb.', pot: 13.5, toCall: 6, odds: true, range: '22+, A2+, K2+, Q2+, J4s+, J7o+, T5s+, T7o+, 95s+, 97o+, 85s+, 87o, 74s+, 64s+, 53s+, 43s',
          options: [['Se coucher', 0, 'Contre lui, top paire est une très bonne main : sa range de mise est pleine de bluffs.'],
            ['Payer', 2, 'Tu gardes ses bluffs dans sa range pour les rues suivantes. Relancer ferait coucher les mains que tu veux voir continuer à miser.'],
            ['Relancer à 20 bb', 1, 'Pour la valeur, ce n\'est pas faux, mais tu fais coucher ses bluffs et tu ne restes payé que par mieux.']] },
        { street: 'turn', story: 'Turn 9♦. Tu checkes, il mise 15 bb dans un pot de 19,5 bb.', pot: 34.5, toCall: 15, odds: true, range: '22+, A2+, K2+, Q2+, J4s+, J7o+, T5s+, T7o+, 95s+, 97o+, 85s+, 87o, 74s+, 64s+, 53s+, 43s',
          options: [['Se coucher', 0, 'Le 9 ne change presque rien à sa range : il continue de miser n\'importe quoi.'], ['Payer', 2, 'Compare ton équité contre sa range aux cotes : le call reste rentable.'], ['Tapis', 1, 'Tu gagnes contre ses semi-bluffs, mais tu perds la valeur de ses bluffs purs à la river.']] },
        { street: 'river', story: 'River 3♣. Tu checkes, il mise 40 bb dans un pot de 49,5 bb.', pot: 89.5, toCall: 40, odds: true, range: '22+, A2+, K2+, Q2+, J4s+, J7o+, T5s+, T7o+, 95s+, 97o+, 85s+, 87o, 74s+, 64s+, 53s+, 43s',
          options: [['Se coucher', 0, 'Contre un maniaque qui mise trois rues avec une range très large, top paire est largement assez forte pour payer.'], ['Payer', 2, 'Bluff-catcher contre un joueur qui bluffe beaucoup trop : call.']] },
      ],
      outro: 'Contre un maniaque : check, laisse-le miser, paie plus large que d\'habitude. Ta patience transforme ses bluffs en gains.',
    },
    {
      id: 'cbetdry', level: 2, lesson: 'postflop', title: 'Le continuation bet sur board sec',
      intro: 'NL25, 100 bb. GrindZ, régulier, défend sa grosse blinde.',
      hero: 'AcTd', pos: 'CO', villain: { name: 'GrindZ', profile: 'Régulier', pos: 'BB' }, board: 'Ks7d2c5hJs',
      steps: [
        { street: 'flop', story: 'Tu ouvres au cutoff, GrindZ paie en grosse blinde. Pot 5,5 bb. Flop K♠ 7♦ 2♣. Tu as A♣ T♦ (rien, mais un As). Il checke.', pot: 5.5, toCall: 0, range: 'TT-22, AJs-A2s, K7s+, Q8s+, J8s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, AJo-A8o, KTo+, QTo+, JTo',
          options: [['Miser 2 bb (⅓ du pot)', 2, 'Board sec qui favorise ta range (plus de rois, d\'AA, de KK). Il rate souvent : une petite mise gagne le pot souvent, à faible risque.'],
            ['Miser 5 bb', 1, 'Fonctionne aussi, mais risque plus pour le même nombre de couchers sur ce board.'],
            ['Check', 1, 'Pas une erreur grave, mais tu renonces à exploiter ton avantage de range.']] },
        { street: 'turn', story: 'Il paie. Pot 9,5 bb. Turn 5♥. Il checke.', pot: 9.5, toCall: 0, range: '99-22, A7s, A2s, K7s+, KTo+, K2s+, 87s, 76s, 75s, 65s, 64s, 54s, A7o, Q7s, J7s, T7s, 97s',
          options: [['Miser 6 bb', 1, 'Un deuxième barrel peut fonctionner, mais sa range de call au flop contient beaucoup de rois et de 7 qui ne se couchent plus.'],
            ['Check', 2, 'Sa range s\'est renforcée en payant. Avec un As haut, check : tu as encore de l\'équité et tu évites de payer cher contre ses paires.']] },
      ],
      outro: 'Le c-bet dépend du board : petit et fréquent quand le board te favorise. Au turn, ne continue que si la carte améliore ta range ou si l\'adversaire abandonne trop.',
    },
    {
      id: 'semibluff', level: 3, lesson: 'maths2', title: 'Semi-bluff avec un tirage couleur',
      intro: 'NL25, 100 bb. Reg_6max, régulier solide, défend la grosse blinde.',
      hero: 'QhJh', pos: 'BTN', villain: { name: 'Reg_6max', profile: 'Régulier', pos: 'BB' }, board: '9h4h2cKs7d',
      steps: [
        { street: 'flop', story: 'Tu ouvres au bouton, il paie. Pot 5,5 bb. Flop 9♥ 4♥ 2♣ : tirage couleur, deux overcards. Il checke.', pot: 5.5, toCall: 0, range: '99-22, ATs-A2s, K2s+, Q5s+, J7s+, T7s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, ATo-A2o, KJo-K8o, Q9o+, J9o+, T9o, 98o',
          options: [['Miser 3 bb', 2, 'Semi-bluff : tu gagnes de deux façons, s\'il se couche tout de suite ou si tu touches ta couleur ou une overcard.'], ['Check', 1, 'Défendable pour voir une carte gratuite, mais tu renonces à la fold equity.'], ['Tapis', 0, 'Seules ses meilleures mains paient : tu risques 100 bb pour gagner 5,5 bb.']] },
        { street: 'turn', story: 'Il paie. Pot 11,5 bb. Turn K♠ : overcard pour toi, pas de cœur. Il checke.', pot: 11.5, toCall: 0, range: '99-22, A9s, A4s, A2s, K9s, K4s, Q9s, J9s, T9s, 98s, 97s, 96s, 87s, 86s, 76s, 75s, 65s, 64s, 54s, 53s, A9o, K9o, Q9o, J9o, T9o, 98o, A5s, A3s, ATs, A8s, K8s, 87s',
          options: [['Miser 8 bb', 2, 'Le roi fait peur à ses 9 et à ses petites paires. Tu as encore 9 outs de couleur plus des outs de quinte : deuxième semi-bluff.'], ['Check', 1, 'Prendre la river gratuitement est correct, mais tu laisses passer une bonne carte de barrel.']] },
      ],
      outro: 'Un tirage se joue souvent agressivement contre un joueur qui sait se coucher : fold equity plus équité. Contre une calling station, le même tirage se joue en check-call.',
    },
    {
      id: 'multiway', level: 2, lesson: 'multiway', title: 'Top paire faible dans un pot à quatre',
      intro: 'NL10. Trois joueurs ont limpé, tu checkes en grosse blinde avec K♦ 6♣.',
      hero: 'Kd6c', pos: 'BB', villain: { name: 'Roc_Solide', profile: 'Nit', pos: 'BTN' }, board: 'Kc8d3h',
      steps: [
        { street: 'flop', story: 'Pot 4,5 bb, quatre joueurs. Flop K♣ 8♦ 3♥ : top paire, kicker 6. Tu parles en premier.', pot: 4.5, toCall: 0, range: 'random',
          options: [['Miser 2,5 bb', 2, 'Valeur contre les rois plus faibles, les 8 et les tirages des limpers, qui paient souvent.'], ['Check', 1, 'Raisonnable : à quatre, ta main n\'est pas énorme et tu contrôles le pot.'], ['Tapis', 0, 'Seules les mains qui te battent paient.']] },
        { street: 'flop', story: 'Deux joueurs paient, puis Roc_Solide, le nit, relance à 12 bb. Il te reste 9,5 bb à payer pour un pot de 21,5 bb.', pot: 21.5, toCall: 9.5, odds: true, range: 'KK, 88, 33, AK, KQ, K8s, K3s',
          options: [['Payer', 0, 'Un nit qui relance dans un pot à quatre a presque toujours mieux : brelan, deux paires ou un roi mieux accompagné.'], ['Se coucher', 2, 'Ton kicker 6 perd contre toute sa range de valeur. Compare l\'équité aux cotes.'], ['Tapis', 0, 'Seules les mains qui te battent paient.']] },
      ],
      outro: 'À plusieurs, une top paire faible est une main de contrôle du pot. Face à une relance d\'un joueur serré, elle se couche.',
    },
    {
      id: 'thinvalue', level: 2, lesson: 'turnriver', title: 'Valeur fine à la river contre un fish',
      intro: 'NL10. Ton adversaire, ChanceuxDu82, est une calling station.',
      hero: 'QsJs', pos: 'CO', villain: { name: 'ChanceuxDu82', profile: 'Fish passif', pos: 'BB' }, board: 'KdJc5h3s2d',
      steps: [
        { street: 'river', story: 'Tu as misé flop et turn, il a payé deux fois. Board K♦ J♣ 5♥ 3♠ 2♦ : tu as la deuxième paire, kicker dame. Pot 20 bb, il checke.', pot: 20, toCall: 0, range: 'J9s+, J9o+, JTs, T9s, 55, 44, 66, 77, 88, 99, TT, A5s, 65s, 54s, 43s, A3s, A2s, Q5s, K5s, KTo, K9o, K8o, K7o, K6o, A5o, J8o, J7s, 76s, 86s, 98s',
          options: [['Check', 0, 'Il a payé deux mises avec beaucoup de mains moins bonnes que la tienne : checker les laisse filer.'], ['Miser 10 bb (½ pot)', 2, 'Il paie avec ses valets plus faibles, ses petites paires et ses tirages ratés qui veulent voir. Les rois paieraient de toute façon.'], ['Tapis', 0, 'Seuls les rois et mieux paient une mise aussi grosse.']] },
      ],
      outro: 'La valeur fine se décide selon ce qui paie, pas selon la force absolue de ta main. Contre un fish, la deuxième paire mise à la river.',
    },
    {
      id: 'squeeze', level: 3, lesson: 'preflop2', title: 'Le squeeze pour la valeur',
      intro: 'NL25. GrindZ (régulier) ouvre UTG, Mimi_Lol (fish passif) paie au HJ.',
      hero: 'QsQc', pos: 'BTN', villain: { name: 'GrindZ', profile: 'Régulier', pos: 'UTG' }, board: '',
      steps: [
        { street: 'pre', story: 'Ouverture à 2,5 bb UTG, call du fish au HJ, le cutoff se couche. Tu as Q♠ Q♣ au bouton.', pot: 6.5, toCall: 2.5, range: '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo',
          options: [['Payer', 1, 'Défendable, mais tu laisses les blindes entrer à bas prix et le pot devient multiway avec ta grosse paire.'], ['Squeeze à 12,5 bb', 2, '3-bet en position (7,5 bb) + 2,5 bb par caller. Le fish paie souvent avec des mains dominées, et l\'ouvreur est coincé.'], ['Tapis 100 bb', 0, 'Seuls AA, KK et AK paient : tu gaspilles la valeur de QQ.']] },
      ],
      outro: 'Le squeeze punit les callers, dont la range ne contient pas les meilleures mains. En micro-limites, squeeze surtout pour la valeur : les fish qui ont payé paient encore.',
    },
    {
      id: 'expresso', level: 3, lesson: 'expresso', title: 'Expresso : tapis ou couché en tête-à-tête',
      intro: 'Expresso, tête-à-tête, le gagnant prend tout. Les jetons valent donc leur poids en argent : l\'équilibre de Nash en jetons s\'applique. Le solveur calcule la réponse.',
      hero: '9s5s', pos: 'SB', villain: { name: 'Turbo_Raz', profile: 'Régulier', pos: 'BB' }, board: '',
      steps: [
        { street: 'pre', kind: 'nash', S: 9, role: 'sb', hand: '95s', story: 'Tapis effectif 9 bb. Tu es petite blinde (et bouton) avec 9♠ 5♠.', pot: 1.5, toCall: 0.5,
          options: [['Tapis', 'nash', 'À 9 bb, l\'équilibre pousse très large depuis la SB : une main assortie connectée gagne assez souvent quand elle est payée, et souvent sans être payée.'], ['Se coucher', 'nash', 'Coucher la SB coûte 0,5 bb à chaque fois : à cette profondeur, c\'est trop serré.']] },
        { street: 'pre', kind: 'nash', S: 9, role: 'bb', hand: 'J7s', story: 'Main suivante : Turbo_Raz fait tapis de la SB, 9 bb effectifs. Tu as J♠ 7♠ en grosse blinde.', pot: 10, toCall: 8,
          options: [['Payer', 'nash', 'Payer demande plus d\'équité que pousser : tu ne gagnes rien quand il se couche.'], ['Se coucher', 'nash', 'Le solveur chiffre la différence : payer avec J7s est légèrement perdant à cette profondeur.']] },
      ],
      outro: 'Celui qui pousse peut être plus large que celui qui paie. Entraîne-toi dans Spots → Tapis ou couché, puis vérifie dans Outils → Push/Fold.',
    },
    {
      id: 'bubble', level: 3, lesson: 'icm', title: 'Bulle de Sit&Go : l\'ICM change le call',
      intro: 'Sit&Go, 3 joueurs restants, 2 places payées (65 % / 35 %). Tapis : J1 12 bb, J2 8 bb (petite blinde), toi J3 20 bb en grosse blinde.',
      hero: 'Ks8d', pos: 'BB', villain: { name: 'J2', profile: 'Régulier', pos: 'SB' }, board: '',
      steps: [
        { street: 'pre', kind: 'icm', stacks: [12, 8, 20], sb: 1, bb: 2, payouts: [65, 35], hand: 'K8o', story: 'J1 se couche, J2 fait tapis pour 8 bb. Tu as K♠ 8♦. En jetons, ce call est rentable. Et en argent ?', pot: 9, toCall: 7,
          options: [['Payer', 'icm', 'En jetons, K8o bat assez souvent la large range de tapis de J2. Mais perdre te ferait passer de gros tapis à tapis moyen sur la bulle.'], ['Se coucher', 'icm', 'L\'ICM pénalise le risque : les jetons que tu perds valent plus que ceux que tu gagnes. Le solveur ICM le chiffre ci-dessous.']] },
      ],
      outro: 'Près de l\'argent, l\'ICM resserre les calls. En Expresso (une seule place payée), cet effet disparaît.',
    },
    {
      id: 'vsthreebet', level: 2, lesson: 'preflop2', title: 'AQ face au 3-bet d\'un nit',
      intro: 'NL25, 100 bb. PapyNit (VPIP 12, 3-bet 2 %) est en petite blinde.',
      hero: 'AdQd', pos: 'CO', villain: { name: 'PapyNit', profile: 'Nit', pos: 'SB' }, board: '',
      steps: [
        { street: 'pre', story: 'Tu ouvres à 2,5 bb au cutoff, PapyNit sur-relance à 11 bb depuis la petite blinde. Il te reste 8,5 bb à payer pour un pot de 14,5 bb.', pot: 14.5, toCall: 8.5, odds: true, range: 'QQ+, AKs, AKo',
          options: [['4-bet à 25 bb', 0, 'Il ne paie ou ne relance qu\'avec QQ+ et AK : ta main est dominée par toute sa range.'], ['Payer', 1, 'Défendable avec la position, mais AQ domine rarement sa range et tu joues souvent dominé.'], ['Se coucher', 2, 'Contre un 3-bet à 2 %, AQs est derrière toute la range. Compare son équité aux cotes ci-dessous.']] },
      ],
      outro: 'Une main forte dans l\'absolu peut être faible contre une range précise. Le profil de l\'adversaire décide.',
    },
  ];

  const pct1 = (x) => (x * 100).toFixed(1).replace('.', ',') + ' %';

  // Calculs d'une étape : board visible, équité contre la range, cotes, ou solution Nash / ICM.
  function stepInfo(sc, k, opts = {}) {
    const st = sc.steps[k], hero = E.parseCards(sc.hero), board = E.parseCards(sc.board).slice(0, N[st.street]);
    const info = { board, hero, need: st.toCall > 0 ? st.toCall / (st.pot + st.toCall) : 0 };
    if (st.kind === 'nash') {
      const sol = Solver.solveChip(st.S), i = Solver.idx(st.hand), push = st.role === 'sb';
      const ev = push ? sol.evPush[i] : sol.evCall[i];
      info.best = ev > 0 ? 0 : 1; info.ev = ev; info.nash = { pushPct: sol.pushPct, callPct: sol.callPct };
      info.line = `Solveur : à ${st.S} bb, la SB pousse ${pct1(sol.pushPct)} des mains et la BB paie ${pct1(sol.callPct)}. ${push ? 'Pousser' : 'Payer'} ${st.hand} vaut ${ev >= 0 ? '+' : '−'}${Math.abs(ev).toFixed(2).replace('.', ',')} bb par rapport à se coucher.`;
    } else if (st.kind === 'icm') {
      const o = Solver.icmOutcomes(st.stacks, st.sb, st.bb, st.payouts), sol = Solver.solveOutcomes(o.V), i = Solver.idx(st.hand);
      const chip = Solver.solveChip(Math.min(st.stacks[st.sb], st.stacks[st.bb]));
      info.best = sol.evCall[i] > 0 ? 0 : 1; info.ev = sol.evCall[i];
      info.line = `En jetons, payer ${st.hand} vaut ${chip.evCall[i] >= 0 ? '+' : '−'}${Math.abs(chip.evCall[i]).toFixed(2).replace('.', ',')} bb. En ICM, payer vaut ${sol.evCall[i] >= 0 ? '+' : '−'}${Math.abs(sol.evCall[i]).toFixed(2).replace('.', ',')} point de % du prize pool. La BB paie ${pct1(chip.callPct)} des mains en jetons, ${pct1(sol.callPct)} en ICM.`;
    } else {
      const combos = E.rangeCombos(st.range, [...hero, ...board]);
      const r = E.equity([{ hand: hero }, { combos }], board, { iterations: opts.iterations || 20000 });
      info.eq = r.equity[0]; info.combos = combos.length;
      info.line = `Ton équité contre sa range (${combos.length} combinaisons) : ${pct1(info.eq)}.` + (st.toCall > 0 ? ` Il te faut ${pct1(info.need)} pour payer (${String(st.toCall).replace('.', ',')} bb dans un pot final de ${String(st.pot + st.toCall).replace('.', ',')} bb).` : '');
    }
    return info;
  }
  // Note d'une option : 2/1/0, ou calculée par le solveur pour les étapes Nash et ICM.
  function optionGrade(sc, k, oi, info) {
    const o = sc.steps[k].options[oi];
    if (o[1] === 'nash' || o[1] === 'icm') return oi === info.best ? 2 : 0;
    return o[1];
  }

  const api = { SCENARIOS: S, stepInfo, optionGrade };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Guided = api;
})(typeof window !== 'undefined' ? window : globalThis);
