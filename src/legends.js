// Mains de légende : des coups célèbres et documentés, rejoués au moment de la décision clé.
// Tu décides à la place du joueur, puis tu compares au choix réel et au moteur (équité contre la main réelle et contre une range
// plausible, cotes du pot, ICM). Quand la source ne donne pas les couleurs, elles sont reconstituées sans changer le coup (signalé).
(function (root) {
  const E = root.Engine || require('./engine.js');
  const O = root.Omaha || require('./omaha.js');
  const SV = root.Solver || require('./solver.js');
  const PF = root.Postflop || require('./postflop.js');
  const C = (s) => E.parseCards(s);
  const LEGENDS = [
    { id: 'brunson76', title: 'Le 10-2 de Doyle Brunson', event: 'WSOP 1976, tournoi principal, tête-à-tête final', game: 'nlh', hero: 'Doyle Brunson', heroCards: 'Ts2s',
      vill: [{ name: 'Jesse Alto', cards: 'AhJd' }], board: 'AcJhTd', runout: '2cTh', reconstructed: 'Couleurs de l\'as-valet d\'Alto et du board non précisées par la source : reconstituées.',
      story: ['Brunson paie une relance préflop avec 10♠ 2♠.', 'Flop A-J-10 : Alto mise le montant du pot.'],
      pot: 200, toCall: 100, unit: 'pot', stackNote: 'Montants non publiés : le pot avant la mise vaut 100 et Alto mise 100.',
      options: [['fold', 'Se coucher'], ['call', 'Payer'], ['allin', 'Tapis']], pro: 2, proText: 'Brunson part à tapis, Alto paie avec deux paires as-valet.',
      outcome: 'Turn 2, river 10 : Brunson touche un full et gagne le titre (220 000 $).',
      range: 'AJ, AT, JT, AK, AQ, AA, JJ, TT, KQ, KJs, QJs, A9s', rangeNote: 'Range plausible d\'une mise du pot sur A-J-10 : deux paires, brelans, tops paires solides, quinte KQ.',
      lesson: 'Le coup qui a donné son nom à la main « 10-2 » est une mauvaise décision qui a bien fini : une paire de 10 face à une grosse mise sur un board aussi coordonné est très loin derrière. On retient le résultat d\'une main de légende, on étudie la décision.',
      src: 'https://www.pokernews.com/news/2017/02/five-most-historic-poker-hands-27011.htm' },
    { id: 'ungar97', title: 'Stu Ungar, troisième titre', event: 'WSOP 1997, tournoi principal, dernière main', game: 'nlh', hero: 'Stu Ungar', heroCards: 'As4d',
      vill: [{ name: 'John Strzemp', cards: 'Ac8h' }], board: 'Ad5h3c', runout: '', riverNote: 'Turn non précisé par la source ; la river est un 2.', reconstructed: 'Couleurs non précisées par la source : reconstituées.',
      story: ['Ungar (environ 2 000 000) relance à 40 000 au bouton, Strzemp (environ 800 000) paie.', 'Flop A-5-3 : Strzemp mise 120 000.'],
      pot: 200000, toCall: 120000, unit: '$', stackNote: 'Pot avant la mise ≈ 80 000 (blindes non publiées, ignorées).',
      options: [['fold', 'Se coucher'], ['call', 'Payer'], ['allin', 'Tapis']], pro: 2, proText: 'Ungar relance à tapis, Strzemp paie avec A-8.',
      outcome: 'Un 2 tombe à la river : Ungar fait la quinte as-cinq et remporte son troisième titre.',
      range: 'A2s-AKs, A2o-AKo, 55, 33, 42s, 42o, 54s, 64s', rangeNote: 'Range plausible d\'une mise au flop A-5-3 : surtout un as, quelques brelans et quintes.',
      lesson: 'As faible + tirage à la quinte ventrale contre un adversaire qui mise : sur le papier, Ungar est derrière les as plus forts et ne gagne qu\'en touchant. Son tapis exploitait sa pile (deux fois plus de jetons) et la peur d\'un adversaire de finir sur un coup de dés ; la river a fait le reste.',
      src: 'https://www.cardplayer.com/cardplayer-poker-magazines/28-diego-cordovez-15-6/articles/12433-final-hand-of-the-39-97-world-series-of-poker' },
    { id: 'moon09', title: 'Darvin Moon face au tapis de Joe Cada', event: 'WSOP 2009, tournoi principal, dernière main', game: 'nlh', hero: 'Darvin Moon', heroCards: 'QdJd',
      vill: [{ name: 'Joe Cada', cards: '9c9d' }], board: '', runout: '8c2c7sKh7c',
      story: ['Blindes 1 000 000 / 2 000 000, ante 300 000. Cada relance à 3 millions au bouton, Moon sur-relance à 8 millions avec Q♦ J♦.', 'Cada part à tapis. Moon doit payer ses 67 derniers millions.'],
      pot: 83600000, toCall: 67000000, unit: 'jetons', stackNote: 'Montants reconstitués depuis la source : Moon paie « ses 67 derniers millions » après sa relance à 8 millions ; Cada le couvre. Pot avant le paiement : antes, relance de Moon, tapis de Cada limité au tapis de Moon.',
      options: [['fold', 'Se coucher'], ['call', 'Payer']], pro: 1, proText: 'Moon paie avec dame-valet assortis ; Cada montre 9♣ 9♦.',
      outcome: 'Flop 8♣ 7♠ 2♣, turn K♥, river 7♣ : la paire de 9 tient, Cada remporte le titre (8 547 042 $), Moon finit deuxième (5 182 928 $).',
      range: '22+, A2s+, A7o+, K9s+, KTo+, QTs+, QJo, JTs, T9s', rangeNote: 'Range plausible d\'un tapis en tête-à-tête sur une sur-relance : paires, as, gros rois, quelques connecteurs.',
      lesson: 'Payer demande environ 44 % d\'équité. Contre la paire de 9 réelle, dame-valet assortis en a 47 % : le paiement était bon contre cette main précise. Mais face à une range réaliste de tapis sur une sur-relance (paires, as, gros rois), dame-valet tombe autour de 42 % : un fold de peu. Les décisions de tapis en tête-à-tête se jouent à quelques points d\'équité ; ce qui tranche, c\'est la range qu\'on prête à l\'adversaire, pas la main qu\'il montre ensuite.',
      src: 'https://www.cardplayer.com/cardplayer-poker-magazines/65767-joseph-cada-22-24/articles/18892-joseph-cada-wins-2009-world-series-of-poker-main-event' },
    { id: 'moneymaker03', title: 'Le bluff de Moneymaker', event: 'WSOP 2003, tournoi principal, tête-à-tête final', game: 'nlh', hero: 'Chris Moneymaker', heroCards: 'Ks7h',
      vill: [{ name: 'Sammy Farha', cards: 'Qs9h' }], board: '9s2d6s8s3h', runout: '', type: 'bluff',
      story: ['Blindes 20 000 / 40 000, ante 5 000. Moneymaker relance à 100 000 au bouton avec K♠ 7♥, Farha paie.', 'Flop 9♠ 2♦ 6♠ : check, check.', 'Turn 8♠ : Farha mise 300 000 dans 210 000, Moneymaker relance à 800 000, Farha paie.', 'River 3♥ : Farha checke.'],
      pot: 1810000, toCall: 0, shove: 2800000, unit: 'jetons', stackNote: 'Tapis restant de Farha estimé à environ 2,8 millions (3,7 millions au début du tête-à-tête selon la source, moins ses mises).',
      options: [['check', 'Check'], ['half', 'Miser la moitié du pot'], ['allin', 'Tapis']], pro: 2, proText: 'Moneymaker part à tapis avec hauteur roi. Farha se couche avec sa paire de 9 en lui disant : « Tu as dû rater ton tirage couleur, hein ? »',
      outcome: 'Farha se couche : Moneymaker remporte le pot sans abattage et gagne le tournoi quelques mains plus tard.',
      range: '99, 88, 66, 22, A9s, A9o, K9o, Q9s, Q9o, J9s, J9o, T9s, T9o, 98s, 98o, 97s, 87s, 86s, T7o, 75o, JhTh, JcTc, JdTd, QhJh, QcJc, QdJd', rangeNote: 'Range plausible de Farha après mise-paie au turn puis check river : surtout des paires de 9, quelques deux paires, brelans et quintes, et des tirages à la quinte ratés (valet-dix, dame-valet).',
      lesson: 'Avec hauteur roi, Moneymaker ne gagne presque jamais à l\'abattage : checker abandonne le pot. Son tapis raconte une histoire cohérente (relance au turn sur le troisième pique) et un joueur avec une paire moyenne ne peut pas payer un tapis de cette taille. Un bluff se justifie quand ta main ne gagne pas à l\'abattage, que ta ligne représente des mains fortes et que la mise met l\'adversaire en face d\'une décision pour son tournoi.',
      src: 'https://www.pokernews.com/strategy/analyzing-moneymaker-bluff-of-the-century-against-farha-35218.htm' },
    { id: 'hansen', title: 'Les carrés cachés de Gus Hansen', event: 'High Stakes Poker (télévision), cash 300 / 600, ante 100', game: 'nlh', hero: 'Daniel Negreanu', heroCards: '6s6h',
      vill: [{ name: 'Gus Hansen', cards: '5d5c' }], board: '9c6d5h5s8s', runout: '',
      story: ['Hansen relance à 2 100 sous le pistolet, Negreanu sur-relance à 5 000 avec 6♠ 6♥, Hansen paie. Tapis effectifs 285 000.', 'Flop 9♣ 6♦ 5♥ : Hansen checke, Negreanu mise 8 000, Hansen relance à 26 000, Negreanu paie.', 'Turn 5♠ : Hansen mise 24 000, Negreanu paie.', 'River 8♠ : Hansen checke, Negreanu mise 65 000, Hansen part à tapis (232 000 au total).'],
      pot: 408700, toCall: 167000, unit: '$', options: [['fold', 'Se coucher'], ['call', 'Payer']], pro: 1, proText: 'Negreanu paie avec son full aux 6 par les 5.',
      outcome: 'Hansen montre 5♦ 5♣ : carré de 5. Il remporte 575 700 $.',
      range: '55, 99, 98s, 87s, 76s, 76o, 74s, 65s, A5s, 97s', rangeNote: 'Range plausible de Hansen après relance au flop, mise au turn et tapis à la river : brelans et carrés, quintes, quelques deux paires et bluffs.',
      lesson: 'Un full contre une ligne qui ressemble à des quintes et à des deux paires : payer est correct, et le carré caché de Hansen est un cooler. Le bon réflexe n\'est pas « il a forcément le carré » mais : combien de combinaisons battent ma main, combien je bats, et quelle cote me donne le pot.',
      src: 'https://www.pokernews.com/news/2017/02/five-most-historic-poker-hands-27011.htm' },
    { id: 'gold06', title: 'Le fold de Wasicka', event: 'WSOP 2006, tournoi principal, à trois joueurs', game: 'nlh', hero: 'Paul Wasicka', heroCards: '8s7s', type: 'icm',
      vill: [{ name: 'Jamie Gold', cards: '4s3c' }, { name: 'Michael Binger', cards: 'AhTh' }], board: '6sTc5s', runout: '7cQs',
      story: ['Blindes 200 000 / 400 000, ante 50 000. Tapis : Gold 63 425 000 (bouton), Wasicka 13 325 000 (petite blinde), Binger 12 650 000 (grosse blinde). Gains : 12 M$, 6,1 M$, 4,1 M$.', 'Gold limpe, Wasicka complète avec 8♠ 7♠, Binger relance à 1 500 000, Gold et Wasicka paient : pot 4 650 000.', 'Flop 6♠ 10♣ 5♠ : Wasicka checke, Binger mise 3 500 000, Gold part à tapis.'],
      pot: 19925000, toCall: 11775000, unit: 'jetons', stackNote: 'Wasicka a 11 775 000 derrière. Pot compté avec la part du tapis de Gold qui le couvre (4 650 000 + 3 500 000 de Binger + 11 775 000 de Gold) ; Binger, qui a déjà misé, peut encore payer.',
      stacks: { gold: 61875000, wasicka: 11775000, binger: 11100000, pot0: 4650000 }, payouts: [12000000, 6102499, 4123310],
      options: [['fold', 'Se coucher'], ['call', 'Payer le tapis']], pro: 0, proText: 'Wasicka se couche après une longue réflexion. Binger paie le tapis de Gold.',
      outcome: 'Turn 7♣, river Q♠ : Gold fait la quinte au turn et élimine Binger. En payant, Wasicka aurait fait couleur à la river et remporté le pot à trois.',
      lesson: 'Le réflexe ICM dit « à trois, avec 6 M$ entre la 3e et la 2e place, laisse Binger sauter ». Le calcul dit autre chose ici : Binger (as-dix) était devant Gold, donc se coucher le laissait souvent doubler et faisait de Wasicka le plus petit tapis, alors que gagner le coup lui assurait la 2e place. En jetons comme en dollars, payer était le meilleur choix avec ces cartes. L\'ICM ne dit pas toujours de se coucher : il dit de compter, dans chaque issue, qui saute et qui double.',
      src: 'https://www.pokernews.com/strategy/hand-histories-gold-wasicka-binger-three-handed-at-the-2006-22481.htm' },
    { id: 'dwan', title: 'Le plus gros pot télévisé : Dwan contre Ivey', event: 'Full Tilt Million Dollar Cash Game (télévision), à trois joueurs', game: 'nlh', hero: 'Phil Ivey', heroCards: 'Ac2d',
      vill: [{ name: 'Tom Dwan', cards: '7h6h' }], board: 'Jc3d5c4h', runout: 'Jh',
      story: ['Dwan ouvre au bouton avec 7♥ 6♥, Ivey sur-relance à 23 000 de la petite blinde avec A♣ 2♦, Antonius se couche, Dwan paie.', 'Flop J♣ 3♦ 5♣ : Ivey mise 35 000 dans 49 500, Dwan paie.', 'Turn 4♥ : Ivey mise 90 000, Dwan relance à 232 600.'],
      pot: 442100, toCall: 142600, unit: '$', options: [['fold', 'Se coucher'], ['call', 'Payer'], ['allin', 'Tapis']], pro: 2, proText: 'Ivey part à tapis avec sa quinte à l\'as, Dwan paie instantanément.',
      outcome: 'Dwan a la quinte à 7 : Ivey est mort, quelle que soit la river (valet). Pot de 1 108 500 $.',
      range: '76s, 76o, 62s, A2s, A2o, 55, 44, 33, JJ, 54s, 65s, KcQc, KcTc, QcTc, Tc9c, 9c8c, 8c7c', rangeNote: 'Range plausible d\'une relance au turn sur J-3-5-4 : quintes à 7, quintes à l\'as, brelans, tirages couleur avec cartes hautes.',
      lesson: 'La quinte à l\'as sur J-3-5-4 est la plus petite des quintes possibles : contre une relance, la question est de savoir combien de 6-7 il y a dans sa range face aux brelans et aux tirages. Ivey n\'a rien fait d\'aberrant ; le board a créé un cooler à plus d\'un million.',
      src: 'https://www.pokernews.com/news/2017/02/five-most-historic-poker-hands-27011.htm' },
    { id: 'hachem', title: 'Le fold de Joe Hachem', event: 'WPT World Championship, Bellagio, jour 1 (blindes 100 / 200)', game: 'nlh', hero: 'Joe Hachem', heroCards: '5d3c',
      vill: [{ name: 'Jordan Morgan', cards: 'AhAc' }], board: 'As7d6c4h', runout: '', riverNote: 'La river n\'a jamais été distribuée : la caméra a montré qu\'elle aurait pairé le board.', reconstructed: 'Couleurs non précisées par la source : board reconstitué sans couleur possible.',
      story: ['Tapis profonds (≈ 250 blindes). Morgan relance à 700, trois joueurs paient dont Hachem au bouton avec 5-3.', 'Flop A-7-4 : check général.', 'Turn 6 : Morgan mise 2 000, Hachem relance à 7 000, Morgan 12 000, Hachem 22 000, Morgan relance de 27 000 : Hachem est à tapis s\'il paie.'],
      pot: 74000, toCall: 27000, unit: 'jetons', options: [['fold', 'Se coucher'], ['call', 'Payer']], pro: 0, proText: 'Hachem se couche avec la deuxième meilleure quinte et montre sa main : « Tu as 8-5, gamin ? »',
      outcome: 'Morgan montre une paire d\'as (brelan). Hachem aurait été largement devant ; la river aurait pourtant pairé le board.',
      range: '85s, 85o, AA, 77, 66, 44, 53s, 53o', rangeNote: 'Range plausible d\'un 5-bet tapis au turn : la quinte max (8-5), les brelans, la même quinte.',
      lesson: 'Face à la seule main qui le bat (8-5), à la même quinte et aux brelans, Hachem a nettement plus d\'équité que la cote n\'en demande (27 000 pour gagner 101 000). Se coucher la deuxième meilleure main possible n\'est juste que si l\'adversaire n\'a quasiment que la meilleure : lis la range entière, pas la pire main possible.',
      src: 'https://www.pokerprofessor.com/strategy/hand-analysis-joe-hachem-makes-worst-fold' },
    { id: 'antonius09', title: 'Antonius contre Isildur1 en PLO', event: 'En ligne, 21 novembre 2009, pot-limit Omaha 500 / 1 000', game: 'plo', hero: 'Patrik Antonius', heroCards: 'AhKhKs3s',
      vill: [{ name: 'Viktor « Isildur1 » Blom', cards: '9s8h7d6d' }], board: '4s5c2h', runout: '5h9c',
      story: ['Blom relance à 3 000, Antonius sur-relance à 9 000, Blom 27 000, Antonius 81 000, Blom paie : pot 162 000.', 'Flop 4♠ 5♣ 2♥ : Blom checke, Antonius mise 91 000, Blom relance à 435 000.'],
      pot: 688000, toCall: 344000, unit: '$', options: [['fold', 'Se coucher'], ['call', 'Payer'], ['raise', 'Relancer (pot)']], pro: 2, proText: 'Antonius relance à 870 000, Blom paie ses 162 474 restants.',
      outcome: 'Turn 5♥, river 9♣ : la quinte à l\'as d\'Antonius tient. Pot de 1 356 946 $, record en ligne.',
      lesson: 'En Omaha, une quinte faite peut être en danger contre un gros tirage : Blom avait un wrap. Antonius a la quinte max du moment et des tirages secondaires (couleur à cœur) : il reste favori, et relancer pour mettre les tapis au milieu est la meilleure option.',
      src: 'https://www.pokernews.com/news/2017/02/five-most-historic-poker-hands-27011.htm' },
  ];

  // Analyse du moteur au moment de la décision.
  function analyze(L) {
    const hero = C(L.heroCards), board = C(L.board), vill = L.vill.map((v) => C(v.cards)), out = {};
    if (L.game === 'plo') {
      const r = O.equity([hero, ...vill], board, { iterations: 20000 }); out.eqActual = r.equity[0];
    } else {
      const r = E.equity([{ hand: hero }, ...vill.map((h) => ({ hand: h }))], board, { iterations: 30000 }); out.eqActual = r.equity[0];
      if (L.range) {
        const dead = [...hero, ...board], combos = PF.parseWeighted(L.range, dead).map(([a, b]) => [a, b]);
        if (combos.length) { out.eqRange = E.equity([{ hand: hero }, { combos }], board, { iterations: 30000 }).equity[0]; out.rangeCombos = combos.length; }
      }
    }
    if (L.toCall > 0) { out.need = L.toCall / (L.pot + L.toCall); const e = out.eqRange ?? out.eqActual; out.evCall = e * (L.pot + L.toCall) - L.toCall; out.best = out.evCall > 0 ? 'call' : 'fold'; }
    if (L.type === 'bluff') { out.foldNeeded = L.shove / (L.pot + L.shove); out.foldNeededHalf = (L.pot / 2) / (L.pot * 1.5); out.showdown = out.eqRange; }
    if (L.type === 'icm') Object.assign(out, icmGold(L));
    return out;
  }
  // Coup Gold-Wasicka-Binger : valeur en dollars (ICM) de se coucher et de payer, en parcourant les 903 turn-river possibles.
  function icmGold(L) {
    const s = L.stacks, pay = L.payouts, hero = C(L.heroCards), gold = C(L.vill[0].cards), bing = C(L.vill[1].cards), board = C(L.board);
    const used = new Set([...hero, ...gold, ...bing, ...board]), deck = []; for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
    const ev = (h, bd) => E.evaluate([...h, ...bd]);
    // Places et gains : stacks [Gold, Wasicka, Binger] ; un joueur à 0 est éliminé (le plus gros tapis de départ finit devant).
    const dollars = (st, startOrder) => {
      const alive = st.map((x, i) => [x, i]).filter(([x]) => x > 0), dead = st.map((x, i) => [x, i]).filter(([x]) => x <= 0).sort((a, b) => startOrder[b[1]] - startOrder[a[1]]);
      const res = [0, 0, 0]; const icmPay = pay.slice(0, alive.length), vals = SV.icm(alive.map(([x]) => x), icmPay);
      alive.forEach(([, i], k) => (res[i] = vals[k])); dead.forEach(([, i], k) => (res[i] = pay[alive.length + k])); return res;
    };
    const start = [s.gold, s.wasicka, s.binger];
    let fold = 0, call = 0, n = 0;
    for (let a = 0; a < deck.length; a++) for (let b = a + 1; b < deck.length; b++) {
      const bd = [...board, deck[a], deck[b]], vg = ev(gold, bd), vw = ev(hero, bd), vb = ev(bing, bd); n++;
      // Se coucher : Binger (11 100 000) contre Gold.
      const potF = s.pot0 + 2 * s.binger; let stF;
      if (vb > vg) stF = [s.gold - s.binger, s.wasicka, potF]; else if (vb < vg) stF = [s.gold - s.binger + potF, s.wasicka, 0]; else stF = [s.gold + s.pot0 / 2, s.wasicka, s.binger + s.pot0 / 2];
      fold += dollars(stF, start)[1];
      // Payer : pot principal à trois (Binger couvert), pot annexe Wasicka-Gold.
      const main = s.pot0 + 3 * s.binger, side = 2 * (s.wasicka - s.binger), best = Math.max(vg, vw, vb), w = [vg, vw, vb].map((v) => (v === best ? 1 : 0)), nw = w[0] + w[1] + w[2];
      const st = [s.gold - s.wasicka, 0, 0];
      st[0] += (main * w[0]) / nw; st[1] += (main * w[1]) / nw; st[2] += (main * w[2]) / nw;
      if (vw > vg) st[1] += side; else if (vw < vg) st[0] += side; else { st[0] += side / 2; st[1] += side / 2; }
      call += dollars(st, start)[1];
    }
    return { icmFold: fold / n, icmCall: call / n, best: call > fold ? 'call' : 'fold', eq3: E.equity([{ hand: hero }, { hand: gold }, { hand: bing }], board, { iterations: 40000 }).equity[0] };
  }
  const api = { LEGENDS, analyze };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Legends = api;
})(typeof window !== 'undefined' ? window : globalThis);
