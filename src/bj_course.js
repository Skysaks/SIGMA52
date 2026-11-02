// Cours de blackjack de SIGMA 52 : 18 modules, du cadre légal au comptage Hi-Lo, aux déviations et à la gestion du capital.
// Les chiffres (avantage de la maison, coût des règles, indices, avantage par true count, probabilités du croupier) ne sont pas écrits
// à la main : ils sont lus dans src/bj_data.js (précalculé par tools/build_bj.js) ou calculés par src/bj_engine.js au moment de l'affichage.
(function (root) {
  'use strict';
  const fr = (x, d = 2) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pc = (x, d = 2) => fr(x * 100, d) + ' %';
  const sg = (x, d = 2) => (x < 0 ? '−' : '+') + fr(Math.abs(x * 100), d) + ' %';
  const UPL = { 1: 'As', 10: '10' };
  const upName = (u) => UPL[u] || String(u);
  const ACTFR = { stand: 'rester', hit: 'tirer', double: 'doubler', split: 'séparer', surrender: 'abandonner' };
  const rowLabel = (id) => (id[0] === 'h' ? 'Dur ' + id.slice(1) : id[0] === 's' ? 'A,' + id.slice(1) : id === 'p1' ? 'A,A' : id.slice(1) + ',' + id.slice(1));

  // Tableau des probabilités finales du croupier (sabot de 6 jeux, croupier reste sur soft 17, avec peek), calculé à l'affichage.
  function dealerTable(X) {
    const BJ = X.BJ, c = BJ.Calc({ decks: 6, h17: false, peek: true }), s0 = BJ.shoeOf(6);
    const rows = BJ.UPS.map((u) => { const s = s0.slice(); s[u] -= 1; return [u, c.dealerDist(s, u)]; });
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Carte visible</th><th class="n">17</th><th class="n">18</th><th class="n">19</th><th class="n">20</th><th class="n">21</th><th class="n">Crève</th></tr></thead><tbody>${rows.map(([u, d]) => `<tr><td>${upName(u)}</td>${d.slice(0, 6).map((p, i) => `<td class="n"${i === 5 ? ' style="font-weight:600"' : ''}>${pc(p, 1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="note">Calcul exact de SIGMA 52 : sabot de 6 jeux, croupier reste sur soft 17. Pour le 10 et l'as, probabilités sachant que le croupier n'a pas blackjack (il a vérifié sa carte cachée).</p>`;
  }
  function ruleCostTable(X) {
    const R = X.D.ruleCosts;
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Changement de règle</th><th class="n">Effet sur l'avantage de la maison</th></tr></thead><tbody>${R.rows.map(([l, d]) => `<tr><td>${l}</td><td class="n" style="color:var(${d > 0 ? '--bad' : '--good'})">${sg(d)}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Référence : ${R.base}, avantage de la maison ${pc(R.baseEdge)}. Chaque ligne change une seule règle ; positif = la règle coûte au joueur. Calcul exact du moteur SIGMA 52 avec la stratégie de base adaptée à chaque jeu de règles.</p>`;
  }
  function presetEdges(X) {
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Jeu de règles</th><th class="n">Avantage de la maison</th></tr></thead><tbody>${Object.values(X.D.presets).map((p) => `<tr><td>${p.label}</td><td class="n">${pc(p.edge)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function tcTable(X, key) {
    const P = X.D.presets[key || 'strip'];
    return `<div class="tw"><table class="t bjt"><thead><tr><th>True count</th>${P.edgeByTC.map(([t]) => `<th class="n">${t > 0 ? '+' + t : t}</th>`).join('')}</tr></thead><tbody><tr><td>Avantage du joueur</td>${P.edgeByTC.map(([, e]) => `<td class="n" style="color:var(${e > 0 ? '--good' : '--bad'})">${sg(e, 1)}</td>`).join('')}</tr></tbody></table></div>
      <p class="note">${P.label}. Calcul SIGMA 52 : composition moyenne du sabot à chaque true count, jeu optimal selon la composition (ce que les indices approchent), assurance prise quand elle est rentable. Ordre de grandeur, pas une promesse : la composition réelle varie autour de cette moyenne.</p>`;
  }
  const slope = (X, key) => { const t = X.D.presets[key || 'strip'].edgeByTC, a = t.find((x) => x[0] === 0)[1], b = t.find((x) => x[0] === 4)[1]; return (b - a) / 4; };
  const zeroTC = (X, key) => { const t = X.D.presets[key || 'strip'].edgeByTC; for (let i = 1; i < t.length; i++) if (t[i - 1][1] < 0 && t[i][1] >= 0) return t[i - 1][0] + (0 - t[i - 1][1]) / (t[i][1] - t[i - 1][1]); return null; };
  function indexTable(X, key, set) {
    const P = X.D.presets[key || 'strip'], L = P.indices.filter((d) => !set || d.set === set);
    const cond = (d) => (d.dir > 0 ? 'TC ≥ ' : 'TC < ') + (d.index > 0 ? '+' + d.index : d.index);
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Main</th><th>Contre</th><th>Stratégie de base</th><th>Déviation</th><th>Quand</th></tr></thead><tbody>${L.map((d) => `<tr><td>${rowLabel(d.row)}</td><td>${upName(d.up)}</td><td>${ACTFR[d.basic]}</td><td><strong>${ACTFR[d.act]}</strong></td><td class="mono">${cond(d)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  const MODULES = [
    {
      id: 'cadre', title: 'Le cadre : légal, réaliste, hors table', minutes: 12,
      goals: ['Savoir où et comment le blackjack se joue légalement depuis la France', 'Distinguer compter (légal) et tricher (aide extérieure)', 'Fixer un objectif réaliste pour ce module de SIGMA 52'],
      sections: [
        ['Où jouer', () => `<p>En France, l'ANJ délivre des agréments en ligne pour trois activités seulement : le poker, les paris sportifs et les paris hippiques. Les jeux de casino en ligne, blackjack compris, ne font pas partie de l'offre autorisée. Un site de blackjack accessible depuis la France est donc un opérateur sans agrément. Le blackjack réel se joue en <strong>casino terrestre</strong>.</p>
          <p>Ce statut peut évoluer : un débat sur une ouverture encadrée existe. Avant toute décision, vérifie la situation sur le site de l'ANJ.</p>`],
        ['Compter n\'est pas tricher', () => `<p>Compter les cartes, c'est mémoriser ce qui est sorti et en tirer des décisions. Cela se fait de tête, avec les informations visibles par tous. Ce n'est pas une fraude.</p>
          <p>Un casino reste en revanche libre de te refuser une mise, de te limiter ou de te demander de quitter la table. La frontière nette, c'est <strong>l'aide extérieure</strong> : appareil, application, complice, notes consultées pendant la main. SIGMA 52 ne s'ouvre jamais au casino.</p>`],
        ['Ce que tu peux attendre', (X) => `<p>Avec une stratégie de base parfaite, le blackjack reste un jeu à espérance négative : ${pc(X.D.presets.strip.edge)} pour la maison avec des règles favorables, ${pc(X.D.presets.europe.edge)} avec les règles européennes typiques (calculs SIGMA 52). Seul le comptage, avec un écart de mises, peut renverser cet avantage, et de peu.</p>
          <p>L'objectif de cette partie de SIGMA 52 est donc la <strong>maîtrise</strong> : zéro erreur de stratégie, un compte juste et rapide, des décisions de mise disciplinées. Les gains éventuels viennent ensuite, et ils sont incertains.</p>`],
        ['Jeu responsable', () => `<p>Une perte au blackjack se rattrape mal : la variance est forte et l'avantage, s'il existe, est faible. Ne joue qu'un capital dédié et que tu peux perdre en entier. L'ANJ gère un dispositif d'interdiction volontaire de jeux pour qui veut se protéger.</p>`],
      ],
      mistakes: ['Jouer sur un site sans agrément ANJ en pensant que c\'est équivalent', 'Croire que la stratégie de base suffit à gagner', 'Emporter une aide écrite ou électronique à la table'],
      keys: ['En France, blackjack réel = casino terrestre', 'Compter de tête est légal ; le casino peut te refuser', 'Stratégie de base seule = perte lente ; comptage + écart de mises = petit avantage'],
      quiz: [
        { q: 'Quels jeux d\'argent en ligne l\'ANJ autorise-t-elle ?', opts: ['Poker, paris sportifs, paris hippiques', 'Tous les jeux de casino', 'Blackjack et roulette uniquement', 'Aucun'], ok: 0, why: 'Les jeux de casino en ligne, dont le blackjack, ne font pas partie de l\'offre agréée.' },
        { q: 'Compter les cartes de tête au casino est :', opts: ['Un délit', 'Légal, mais le casino peut te refuser ou te limiter', 'Autorisé avec une application', 'Interdit seulement en sabot'], ok: 1, why: 'Le comptage utilise l\'information visible par tous. Le casino garde la liberté de refuser un joueur.' },
        { q: 'Avec une stratégie de base parfaite et des règles courantes, le joueur :', opts: ['Gagne à long terme', 'Est à égalité', 'Perd lentement', 'Perd plus vite qu\'à la roulette'], ok: 2, why: 'La stratégie de base réduit l\'avantage de la maison sans l\'annuler.' },
        { q: 'Ce qui est clairement à proscrire à la table :', opts: ['Mémoriser la stratégie de base', 'Compter de tête', 'Consulter une application pendant la main', 'Varier ses mises'], ok: 2, why: 'L\'aide extérieure pendant le jeu est la frontière nette.' },
      ],
    },
    {
      id: 'regles', title: 'Règles et déroulé d\'une main', minutes: 14,
      goals: ['Connaître la valeur des cartes et les totaux durs et souples', 'Savoir comment joue le croupier', 'Distinguer jeu avec carte cachée (peek) et sans carte cachée (européen)'],
      sections: [
        ['Valeurs', () => `<p>Les cartes de 2 à 9 valent leur chiffre. Le 10, le valet, la dame et le roi valent 10. L'as vaut 1 ou 11. Un total est <strong>souple</strong> (soft) quand il contient un as compté 11 : A,6 = soft 17. Il est <strong>dur</strong> (hard) sinon : 10,7 = dur 17, et A,6,10 = dur 17 aussi.</p>
          <p>Un <strong>blackjack</strong> est un as et une carte de valeur 10 servis d'entrée. Il bat un 21 en trois cartes et se paie 3 pour 2 sur une bonne table.</p>`],
        ['Ordre du jeu', () => `<ol><li>Mise, puis deux cartes par joueur, une ou deux pour le croupier.</li><li>Chaque joueur décide : <strong>rester</strong>, <strong>tirer</strong>, <strong>doubler</strong> (une seule carte de plus, mise doublée), <strong>séparer</strong> une paire (deux mains), parfois <strong>abandonner</strong> (récupérer la moitié de la mise).</li><li>Le croupier joue ensuite selon une règle fixe : il tire jusqu'à 16 et reste à 17. Selon la table, il reste ou tire sur soft 17.</li></ol>
          <p>Le croupier ne choisit rien. C'est ce qui rend le jeu calculable.</p>`],
        ['Avec ou sans carte cachée', () => `<p><strong>Avec carte cachée (peek)</strong> : le croupier prend deux cartes. S'il montre un as ou un 10, il vérifie s'il a blackjack avant que tu joues. Tu ne perds jamais un double ou un split contre un blackjack.</p>
          <p><strong>Sans carte cachée (règle européenne)</strong> : le croupier ne prend sa deuxième carte qu'après les joueurs. S'il fait blackjack, tu perds aussi les mises ajoutées en doublant ou en séparant, sauf règle « mise initiale seulement » (OBO). C'est pourquoi on double et on sépare moins contre un as ou un 10 dans ce jeu.</p>`],
        ['Assurance', () => `<p>Quand le croupier montre un as, on te propose une assurance : une mise de la moitié de la tienne, payée 2 pour 1 si le croupier a blackjack. Elle n'est rentable que si plus d'un tiers des cartes restantes valent 10. Sans compter, ce n'est jamais le cas en moyenne (4 cartes sur 13).</p>`],
      ],
      mistakes: ['Confondre soft 17 et dur 17', 'Doubler contre un as en jeu européen comme en jeu avec peek', 'Prendre l\'assurance « pour protéger un 20 »'],
      keys: ['Soft = un as compté 11', 'Le croupier tire jusqu\'à 16, reste à 17 (ou tire soft 17 selon la table)', 'Sans carte cachée, un blackjack du croupier coûte aussi tes doubles et splits'],
      quiz: [
        { q: 'A,6 est :', opts: ['Dur 7', 'Soft 17', 'Dur 17', 'Un blackjack'], ok: 1, why: 'L\'as compté 11 fait un total souple.' },
        { q: 'A,6,10 est :', opts: ['Soft 17', 'Dur 17', 'Dur 27, crevé', 'Soft 27'], ok: 1, why: 'L\'as repasse à 1 : 1 + 6 + 10 = 17, total dur.' },
        { q: 'Dans le jeu européen sans carte cachée, si le croupier fait blackjack :', opts: ['Tu ne perds que ta mise initiale, toujours', 'Tu perds aussi tes doubles et splits, sauf règle OBO', 'La main est annulée', 'Tu gagnes si tu as 21'], ok: 1, why: 'Sans peek, le croupier découvre son blackjack après les joueurs ; les mises ajoutées sont perdues, sauf règle OBO.' },
        { q: 'L\'assurance est rentable quand :', opts: ['Tu as 20', 'Plus d\'un tiers des cartes restantes valent 10', 'Le croupier a été chanceux', 'Toujours en sabot de 6 jeux'], ok: 1, why: 'Elle paie 2 pour 1 : il faut une probabilité de blackjack supérieure à 1/3.' },
      ],
    },
    {
      id: 'tables', title: 'Lire une table : ce que coûte chaque règle', minutes: 12,
      goals: ['Lire la pancarte d\'une table et la convertir en avantage de la maison', 'Savoir quelles règles fuir', 'Repérer ce qui rend le comptage impossible'],
      sections: [
        ['Coût de chaque règle', (X) => ruleCostTable(X)],
        ['Les jeux prédéfinis de SIGMA 52', (X) => presetEdges(X) + '<p class="note">Les règles d\'une table changent d\'un casino à l\'autre : vérifie la pancarte ou demande au croupier, puis entre-les dans Stratégie pour obtenir l\'avantage exact et la stratégie adaptée.</p>'],
        ['Ce qui tue le comptage', () => `<ul><li><strong>Mélangeur continu</strong> : les cartes jouées retournent dans la machine à chaque main. Le sabot ne s'appauvrit jamais, le compte reste à zéro.</li><li><strong>Faible pénétration</strong> : le croupier mélange tôt (moins des deux tiers du sabot distribués). Les comptes élevés deviennent rares.</li><li><strong>Blackjack payé 6:5</strong> : le coût dépasse ce que le comptage rapporte.</li><li><strong>Mises plafonnées ou écart de mises refusé</strong> : sans variation de mise, compter ne sert qu'aux déviations.</li></ul>`],
      ],
      mistakes: ['Ignorer la ligne « blackjack paie 6:5 »', 'Compter à une table avec mélangeur continu', 'Supposer que toutes les tables d\'un casino ont les mêmes règles'],
      keys: ['Le paiement du blackjack est la règle la plus chère', 'Tirer sur soft 17, pas de double après split, double limité : chaque règle coûte', 'Mélangeur continu = comptage inutile'],
      quiz: [
        { q: 'La règle la plus coûteuse pour le joueur dans le tableau :', opts: ['Croupier tire soft 17', 'Blackjack payé 6:5', 'Pas de re-split', '8 jeux au lieu de 6'], ok: 1, why: 'Le paiement 6:5 retire une part du gain de chaque blackjack.' },
        { q: 'Avec un mélangeur continu, le comptage :', opts: ['Rapporte plus', 'Ne sert à rien', 'Marche avec un compte plus fin', 'Marche seulement en début de sabot'], ok: 1, why: 'Les cartes reviennent dans la machine : le sabot ne s\'appauvrit pas.' },
        { q: 'Moins de jeux de cartes dans le sabot, c\'est en général :', opts: ['Meilleur pour le joueur', 'Pire pour le joueur', 'Sans effet', 'Interdit en France'], ok: 0, why: 'Le tableau du coût des règles le montre : 1 ou 2 jeux réduisent l\'avantage de la maison.' },
        { q: 'La pénétration désigne :', opts: ['Le nombre de joueurs', 'La part du sabot distribuée avant le mélange', 'La mise maximale', 'L\'avantage du joueur'], ok: 1, why: 'Plus elle est profonde, plus les comptes extrêmes apparaissent.' },
      ],
    },
    {
      id: 'croupier', title: 'Le croupier : d\'où vient la stratégie', minutes: 10,
      goals: ['Connaître la probabilité que le croupier crève selon sa carte visible', 'Comprendre pourquoi on reste sur 12-16 contre 2-6 et pas contre 7-As'],
      sections: [
        ['Le croupier, carte par carte', (X) => dealerTable(X)],
        ['Cartes faibles, cartes fortes', () => `<p>Contre un 4, un 5 ou un 6, le croupier crève très souvent : il doit tirer avec un total raide. Tu n'as pas besoin de risquer de crever toi-même. Contre un 7, un 8, un 9, un 10 ou un as, il finit le plus souvent entre 17 et 21 : un 12 à 16 perd presque toujours s'il reste, il faut tirer.</p>
          <p>Le 2 et le 3 sont entre les deux, d'où les cas limites du dur 12 contre 2 et 3.</p>`],
        ['La logique en une phrase', () => `<p>On cherche le total qui gagne le plus souvent <strong>contre la distribution finale du croupier</strong>. La stratégie de base n'est que ce calcul, fait pour chaque main et chaque carte visible.</p>`],
      ],
      mistakes: ['Croire que le croupier « doit » faire une main après plusieurs crevés', 'Penser que 16 contre 7 « a des chances »'],
      keys: ['Crevé du croupier : maximal contre 4, 5, 6', 'Contre 7 à As, le croupier fait le plus souvent 17-21'],
      quiz: [
        { q: 'Contre quelle carte visible le croupier crève-t-il le plus souvent ?', opts: ['2', '5 ou 6', '7', 'As'], ok: 1, why: 'Voir le tableau : le pic est sur 5 et 6.' },
        { q: 'Pourquoi rester sur dur 13 contre 6 ?', opts: ['Le croupier crève souvent avec un 6', 'Parce que 13 est un bon total', 'Pour ne pas énerver la table', 'Parce que le sabot est chaud'], ok: 0, why: 'Le risque de crever soi-même ne vaut pas le coup quand le croupier crève souvent.' },
        { q: 'Contre un 10, le croupier finit le plus souvent :', opts: ['Crevé', 'Entre 17 et 21', 'À 17 exactement', 'Avec un blackjack'], ok: 1, why: 'Avec une carte visible forte, il atteint 17 ou plus dans la grande majorité des cas.' },
      ],
    },
    {
      id: 'dures', title: 'Stratégie de base : mains dures', minutes: 15,
      goals: ['Appliquer sans hésiter la stratégie des totaux durs', 'Retenir les cas limites (12 contre 2 et 3, 9 et 10 contre fortes, 11 contre As)'],
      sections: [
        ['Les règles (sabot, croupier reste sur soft 17)', () => `<ul><li><strong>8 ou moins</strong> : tirer.</li><li><strong>9</strong> : doubler contre 3 à 6, sinon tirer.</li><li><strong>10</strong> : doubler contre 2 à 9, sinon tirer.</li><li><strong>11</strong> : doubler contre 2 à 10 ; contre un as, selon les règles (voir Stratégie).</li><li><strong>12</strong> : rester contre 4 à 6, sinon tirer.</li><li><strong>13 à 16</strong> : rester contre 2 à 6, sinon tirer (ou abandonner 15 et 16 contre les cartes fortes quand l'abandon existe).</li><li><strong>17 et plus</strong> : rester.</li></ul>
          <p class="note">Ces règles valent pour le sabot de 6 jeux avec peek. Les autres jeux de règles changent quelques cases : l'onglet Stratégie affiche le tableau exact et l'EV de chaque action.</p>`],
        ['Comment les retenir', () => `<p>Retiens la frontière <strong>2-6 / 7-As</strong> pour 13 à 16, et les deux exceptions du 12 (on tire contre 2 et 3). Pour les doubles, pense « 11 presque toujours, 10 sauf contre 10 et As, 9 contre 3 à 6 ».</p>`],
        ['Jeu européen sans carte cachée : ce qui change', () => `<p>Sans carte cachée, un blackjack du croupier emporte aussi la mise doublée. Contre un 10 ou un as, on évite donc d'ajouter de l'argent : <strong>11 contre 10 et contre As : tirer</strong> (au lieu de doubler). Le reste des mains dures ne change pas. Si la table limite le double à 9, 10, 11, les doubles sur mains souples disparaissent : A,7 contre 3 à 6 devient « rester ».</p>`],
      ],
      mistakes: ['Rester sur 12 contre 2 ou 3', 'Ne pas doubler 11 contre 10', 'Rester sur 16 contre 7 « par peur »'],
      keys: ['13-16 : rester contre 2-6, tirer contre 7-As', '12 : rester seulement contre 4-6', 'Doubles : 9 (3-6), 10 (2-9), 11 (2-10)'],
      quiz: [
        { q: 'Dur 12 contre 3 :', opts: ['Rester', 'Tirer', 'Doubler', 'Abandonner'], ok: 1, why: 'Le 12 ne reste que contre 4, 5, 6.' },
        { q: 'Dur 10 contre 9 :', opts: ['Tirer', 'Rester', 'Doubler', 'Séparer'], ok: 2, why: '10 se double contre 2 à 9.' },
        { q: 'Dur 16 contre 7 (sans abandon) :', opts: ['Rester', 'Tirer', 'Doubler', 'Ça dépend du nombre de cartes'], ok: 1, why: 'Contre 7, le croupier finit trop souvent à 17 ou plus.' },
        { q: 'Dur 9 contre 2 (stratégie de base, sabot) :', opts: ['Doubler', 'Tirer', 'Rester', 'Abandonner'], ok: 1, why: '9 ne se double que contre 3 à 6 en stratégie de base ; c\'est une déviation à compte positif.' },
      ],
    },
    {
      id: 'souples', title: 'Stratégie de base : mains souples', minutes: 12,
      goals: ['Jouer les mains A,2 à A,9', 'Comprendre pourquoi on double souvent les mains souples contre 4-6'],
      sections: [
        ['Les règles (sabot, croupier reste sur soft 17)', () => `<ul><li><strong>A,2 et A,3</strong> : doubler contre 5 et 6, sinon tirer.</li><li><strong>A,4 et A,5</strong> : doubler contre 4 à 6, sinon tirer.</li><li><strong>A,6</strong> : doubler contre 3 à 6, sinon tirer.</li><li><strong>A,7</strong> : doubler contre 3 à 6 (rester si le double est interdit), rester contre 2, 7, 8, tirer contre 9, 10, As.</li><li><strong>A,8 et A,9</strong> : rester (A,8 se double contre 6 quand le croupier tire soft 17).</li></ul>`],
        ['Pourquoi doubler une main souple', () => `<p>Une main souple ne peut pas crever avec une carte. Contre un croupier faible, une carte de plus améliore souvent ta main sans risque ; doubler met plus d'argent au moment où tu es favori.</p>`],
        ['Le piège de A,7', () => `<p>Soft 18 paraît bon. Contre 9, 10 ou As, c'est faible : le croupier finit souvent à 19 ou 20. On tire, et l'as te protège d'un crevé immédiat.</p>`],
      ],
      mistakes: ['Rester sur A,7 contre 10', 'Ne jamais doubler les mains souples', 'Tirer sur A,8 contre 6 par habitude'],
      keys: ['Mains souples : on double contre le croupier faible', 'A,7 : rester contre 2, 7, 8 ; tirer contre 9, 10, As', 'A,8 et A,9 : rester'],
      quiz: [
        { q: 'A,7 contre 10 :', opts: ['Rester', 'Tirer', 'Doubler', 'Abandonner'], ok: 1, why: 'Soft 18 perd trop souvent contre un 10 ; l\'as protège du crevé.' },
        { q: 'A,4 contre 5 :', opts: ['Tirer', 'Doubler', 'Rester', 'Séparer'], ok: 1, why: 'A,4 et A,5 se doublent contre 4 à 6.' },
        { q: 'A,2 contre 4 :', opts: ['Doubler', 'Tirer', 'Rester', 'Abandonner'], ok: 1, why: 'A,2 et A,3 ne se doublent que contre 5 et 6.' },
        { q: 'Pourquoi une main souple ne crève-t-elle pas en tirant une carte ?', opts: ['L\'as repasse à 1 si besoin', 'Le croupier l\'interdit', 'Parce que le total est bas', 'Elle peut crever'], ok: 0, why: 'L\'as compté 11 peut redevenir 1.' },
      ],
    },
    {
      id: 'paires', title: 'Stratégie de base : les paires', minutes: 12,
      goals: ['Savoir quelles paires séparer et contre quoi', 'Comprendre l\'effet du double après split'],
      sections: [
        ['Les règles (sabot, double après split autorisé)', () => `<ul><li><strong>A,A et 8,8</strong> : toujours séparer.</li><li><strong>10,10</strong> : jamais (20 est trop fort).</li><li><strong>5,5</strong> : jamais séparer, joue-la comme un 10 dur.</li><li><strong>2,2 et 3,3</strong> : séparer contre 2 à 7.</li><li><strong>4,4</strong> : séparer contre 5 et 6, sinon tirer.</li><li><strong>6,6</strong> : séparer contre 2 à 6.</li><li><strong>7,7</strong> : séparer contre 2 à 7.</li><li><strong>9,9</strong> : séparer contre 2 à 6, 8 et 9 ; rester contre 7, 10, As.</li></ul>
          <p class="note">Sans double après split, les petites paires se séparent moins souvent. L'onglet Stratégie affiche le tableau exact pour tes règles.</p>`],
        ['Pourquoi 8,8 contre 10', () => `<p>16 est le pire total. Deux mains qui partent de 8 perdent aussi en moyenne contre un 10, mais moins que le 16. Séparer, c'est choisir la perte la plus faible.</p>`],
        ['Jeu européen sans carte cachée', () => `<p>Un blackjack du croupier emporte les deux mains séparées. D'où trois changements : <strong>8,8 contre 10 et contre As : tirer</strong> ; <strong>A,A contre As : tirer</strong>. Le reste du tableau des paires ne change pas.</p>`],
      ],
      mistakes: ['Séparer les 10', 'Ne pas séparer 8,8 contre 10 ou As', 'Séparer 5,5'],
      keys: ['Toujours : A,A et 8,8 (sauf jeu européen contre 10 et As) ; jamais : 10,10 et 5,5', '9,9 : rester contre 7, 10, As'],
      quiz: [
        { q: '9,9 contre 7 :', opts: ['Séparer', 'Rester', 'Tirer', 'Doubler'], ok: 1, why: '18 bat le 17 probable du croupier.' },
        { q: '5,5 contre 6 :', opts: ['Séparer', 'Doubler', 'Rester', 'Tirer'], ok: 1, why: '5,5 se joue comme un 10 dur.' },
        { q: '8,8 contre As, jeu avec carte cachée, croupier reste sur soft 17 :', opts: ['Séparer', 'Tirer', 'Rester', 'Abandonner'], ok: 0, why: 'Séparer réduit la perte par rapport au 16.' },
        { q: '8,8 contre 10, jeu européen sans carte cachée :', opts: ['Séparer', 'Tirer', 'Rester', 'Doubler'], ok: 1, why: 'Un blackjack du croupier emporterait les deux mains : on tire.' },
        { q: '4,4 contre 5, double après split autorisé :', opts: ['Tirer', 'Séparer', 'Doubler', 'Rester'], ok: 1, why: 'Avec le double après split, on sépare 4,4 contre 5 et 6.' },
      ],
    },
    {
      id: 'abandon', title: 'Abandon, assurance, even money', minutes: 10,
      goals: ['Savoir quand abandonner', 'Refuser l\'assurance et l\'even money sans comptage'],
      sections: [
        ['Abandon tardif', () => `<p>Quand il existe, l'abandon rend la moitié de la mise. On l'utilise quand la main perd plus de 50 % en moyenne : <strong>16 contre 9, 10 et As</strong>, <strong>15 contre 10</strong>. Quand le croupier tire sur soft 17, on abandonne aussi <strong>15 contre As, 17 contre As et 8,8 contre As</strong>. Le tableau Stratégie affiche les cas exacts pour tes règles.</p>`],
        ['Assurance et even money', () => `<p>L'even money est l'assurance proposée quand tu as blackjack contre un as : tu prends 1 pour 1 tout de suite. C'est exactement la même mise qu'une assurance, avec la même espérance négative tant que les 10 ne dépassent pas un tiers du sabot. Sans compter : jamais.</p>`],
      ],
      mistakes: ['Abandonner 16 contre 7', 'Prendre l\'even money « parce que c\'est sûr »'],
      keys: ['Abandon : 16 contre 9-10-As, 15 contre 10', 'Assurance et even money : non, sauf compte élevé (indice d\'assurance)'],
      quiz: [
        { q: 'L\'even money est :', opts: ['Une bonne affaire', 'Une assurance déguisée', 'Un bonus du casino', 'Obligatoire'], ok: 1, why: 'Même mise, même espérance qu\'une assurance.' },
        { q: '16 contre 10, abandon permis :', opts: ['Abandonner', 'Rester', 'Tirer', 'Doubler'], ok: 0, why: 'La main perd plus de la moitié du temps.' },
        { q: 'Abandonner 16 contre 6 :', opts: ['Bonne idée', 'Erreur : on reste', 'Indifférent', 'Seulement en jeu européen'], ok: 1, why: 'Contre 6, le croupier crève souvent : 16 reste.' },
      ],
    },
    {
      id: 'memoriser', title: 'Mémoriser la stratégie à 100 %', minutes: 10,
      goals: ['Construire une routine d\'apprentissage par blocs', 'Atteindre zéro erreur et une décision instantanée'],
      sections: [
        ['Méthode', () => `<ol><li>Apprends dans cet ordre : dures, souples, paires, abandon.</li><li>Un bloc par jour dans l'Entraîneur, mode « par bloc », jusqu'à 100 % sur 50 mains.</li><li>Puis le mode « faiblesses » : les cases où tu te trompes reviennent plus souvent.</li><li>Ajoute le chrono : une décision en moins de 2 secondes. Au casino, l'hésitation coûte autant que l'erreur.</li><li>Chaque erreur entre dans les Révisions espacées.</li></ol>`],
        ['Critère de passage', () => `<p>SIGMA 52 considère la stratégie maîtrisée quand tu as répondu juste à <strong>chaque case du tableau</strong> au moins trois fois de suite et que tu dépasses 98 % sur tes 200 dernières décisions. Seuil fixé par SIGMA 52 pour l'entraînement ; ce n'est pas une norme externe.</p>`],
      ],
      mistakes: ['Passer au comptage avant 100 % en stratégie de base', 'S\'entraîner sans chrono'],
      keys: ['Ordre : dures, souples, paires, abandon', 'Critère : toutes les cases, 3 fois de suite, et 98 % sur 200'],
      quiz: [
        { q: 'Quand commencer le comptage ?', opts: ['Tout de suite', 'Après 100 % en stratégie de base', 'Après le premier gain', 'Jamais'], ok: 1, why: 'Une erreur de stratégie coûte plus que ce que le compte rapporte.' },
        { q: 'Pourquoi un chrono ?', opts: ['Pour le plaisir', 'Le compte et la discrétion exigent des décisions instantanées', 'Le casino chronomètre', 'Inutile'], ok: 1, why: 'Hésiter perturbe le compte et attire l\'attention.' },
      ],
    },
    {
      id: 'pourquoi', title: 'Pourquoi compter : l\'effet de retrait', minutes: 12,
      goals: ['Comprendre pourquoi les 10 et les as restants favorisent le joueur', 'Relier composition du sabot et avantage'],
      sections: [
        ['Ce que change un sabot riche en 10 et as', () => `<ul><li>Les <strong>blackjacks</strong> sont plus fréquents. Les deux camps en reçoivent autant, mais le tien paie 3 pour 2, celui du croupier 1 pour 1.</li><li>Tes <strong>doubles</strong> sur 10 et 11 réussissent plus souvent.</li><li>Le croupier, obligé de tirer sur 12 à 16, <strong>crève plus</strong>.</li><li>L'<strong>assurance</strong> devient rentable au-delà d'un tiers de 10.</li></ul>
          <p>À l'inverse, un sabot riche en petites cartes aide le croupier.</p>`],
        ['De la théorie au chiffre', (X) => tcTable(X, 'strip') + `<p>Environ <strong>${fr(slope(X) * 100, 2)} point d'avantage par true count</strong> dans ce jeu, et l'avantage passe au joueur vers un true count de ${fr(zeroTC(X) ?? 1, 1)}.</p>`],
        ['Ce que le compte ne fait pas', () => `<p>Il ne prédit pas la prochaine carte. Il donne une probabilité un peu meilleure sur beaucoup de mains. L'avantage n'apparaît qu'en moyenne, sur des milliers de mains.</p>`],
      ],
      mistakes: ['Croire que le compte annonce la carte suivante', 'Penser qu\'un compte positif garantit de gagner la main'],
      keys: ['10 et as restants = blackjacks payés 3:2, doubles, croupier qui crève', 'Avantage ≈ proportionnel au true count'],
      quiz: [
        { q: 'Pourquoi les blackjacks plus fréquents favorisent-ils le joueur ?', opts: ['Le croupier n\'en reçoit pas', 'Le joueur est payé 3:2, le croupier 1:1', 'Ils sont plus fréquents pour le joueur seulement', 'Ils ne le favorisent pas'], ok: 1, why: 'Fréquence égale, paiement asymétrique.' },
        { q: 'Un sabot riche en petites cartes favorise :', opts: ['Le joueur', 'Le croupier', 'Personne', 'Le joueur en troisième base'], ok: 1, why: 'Le croupier crève moins et tes doubles réussissent moins.' },
        { q: 'Un true count élevé garantit :', opts: ['De gagner la main', 'Une espérance meilleure sur la main', 'Un blackjack', 'Un crevé du croupier'], ok: 1, why: 'C\'est une probabilité, pas une certitude.' },
      ],
    },
    {
      id: 'hilo', title: 'Le Hi-Lo : running count', minutes: 14,
      goals: ['Appliquer les valeurs Hi-Lo sans réfléchir', 'Tenir le compte d\'une table entière, vite'],
      sections: [
        ['Les valeurs', () => `<div class="tw"><table class="t bjt"><thead><tr><th>Cartes</th><th>Valeur</th></tr></thead><tbody><tr><td>2, 3, 4, 5, 6</td><td class="mono">+1</td></tr><tr><td>7, 8, 9</td><td class="mono">0</td></tr><tr><td>10, V, D, R, As</td><td class="mono">−1</td></tr></tbody></table></div>
          <p>Le compte démarre à 0 après le mélange. Il est <strong>équilibré</strong> : un paquet complet compté donne 0. Le <strong>running count</strong> (RC) est la somme de toutes les cartes vues depuis le mélange.</p>`],
        ['Compter vite', () => `<ul><li><strong>Par paires</strong> : un 10 et un 5 s'annulent, ne compte rien.</li><li><strong>Par mains</strong> : regarde une main entière et ajoute son total (10,6 = 0 ; 5,4 = +2).</li><li>Compte aussi les cartes du croupier et des autres joueurs, et celles brûlées si elles sont montrées.</li></ul>`],
        ['Objectif d\'entraînement', () => `<p>Dans Comptage, l'exercice « Paquet chrono » fait défiler 51 cartes : tu dois deviner la dernière (le compte final l'indique). Objectif SIGMA 52 : moins de 30 secondes sans erreur, trois fois de suite, avant de passer au true count.</p>`],
      ],
      mistakes: ['Oublier les cartes du croupier', 'Recommencer à 0 en cours de sabot', 'Compter les 7, 8, 9'],
      keys: ['2-6 = +1 ; 7-9 = 0 ; 10-As = −1', 'Un paquet complet = 0', 'Annule par paires ou par mains'],
      quiz: [
        { q: 'Valeur Hi-Lo d\'un as :', opts: ['+1', '0', '−1', '+11'], ok: 2, why: 'Les cartes hautes (10 à As) valent −1.' },
        { q: 'Cartes vues : 5, 10, 3, K, 6, 9. Running count ?', opts: ['+1', '0', '+2', '−1'], ok: 0, why: '+1 −1 +1 −1 +1 +0 = +1.' },
        { q: 'On a compté 51 cartes d\'un paquet, RC = −1. La dernière carte est :', opts: ['Basse (2-6)', 'Neutre (7-9)', 'Haute (10-As)', 'Impossible à dire'], ok: 0, why: 'Le paquet complet vaut 0 : la dernière carte vaut +1, donc basse.' },
        { q: 'Une main 10,6 vaut :', opts: ['+1', '0', '−1', '+2'], ok: 1, why: '−1 + 1 = 0.' },
      ],
    },
    {
      id: 'truecount', title: 'True count et estimation des paquets', minutes: 14,
      goals: ['Convertir le running count en true count', 'Estimer les paquets restants à un demi-paquet près'],
      sections: [
        ['Pourquoi diviser', () => `<p>Un RC de +6 n'a pas le même sens avec 5 paquets restants qu'avec 1. Le <strong>true count</strong> (TC) ramène le compte à un paquet : <strong>TC = RC ÷ paquets restants</strong>.</p>
          <p>Exemple : RC +9, 3 paquets restants : TC +3. SIGMA 52 tronque vers zéro : +2,8 devient +2 ; −1,5 devient −1. Garde la même convention partout.</p>`],
        ['Estimer les paquets restants', () => `<p>Regarde le <strong>bac à défausse</strong> : sa hauteur dit combien de paquets sont sortis. Paquets restants = paquets du sabot − paquets défaussés. Entraîne-toi à reconnaître 1, 1,5, 2… paquets à vue dans l'exercice « Bac à défausse ».</p>`],
        ['Le TC et ton avantage', (X) => `<p>Dans le jeu « ${X.D.presets.strip.label} », l'avantage gagne environ ${fr(slope(X) * 100, 2)} point par TC (calcul SIGMA 52). Le TC sert à deux choses : <strong>miser</strong> plus quand il est positif, et <strong>dévier</strong> de la stratégie de base aux indices.</p>`],
      ],
      mistakes: ['Diviser par les paquets joués au lieu des paquets restants', 'Utiliser le RC pour miser en sabot', 'Changer de convention d\'arrondi'],
      keys: ['TC = RC ÷ paquets restants', 'Paquets restants = total − défausse', 'Troncature vers zéro'],
      quiz: [
        { q: 'RC +10, 2 paquets restants. TC ?', opts: ['+2', '+5', '+20', '+8'], ok: 1, why: '10 ÷ 2 = 5.' },
        { q: 'Sabot de 6, 4 paquets en défausse, RC +6. TC ?', opts: ['+1', '+1,5 → +1', '+3', '+6'], ok: 2, why: '2 paquets restants : 6 ÷ 2 = 3.' },
        { q: 'RC −5, 2 paquets restants, troncature vers zéro :', opts: ['−3', '−2', '−2,5 → −3', '0'], ok: 1, why: '−2,5 tronqué vers zéro donne −2.' },
      ],
    },
    {
      id: 'indices', title: 'Déviations : Illustrious 18 et Fab 4', minutes: 18,
      goals: ['Connaître les déviations qui rapportent le plus', 'Savoir d\'où viennent les indices de SIGMA 52'],
      sections: [
        ['Le principe', () => `<p>La stratégie de base est optimale pour un sabot moyen. Quand le TC s'écarte, certaines décisions changent : c'est un <strong>indice</strong>. « 16 contre 10 : rester à TC ≥ i » veut dire : rester si le TC atteint i, tirer en dessous. Les plus rentables ont été regroupés sous les noms <strong>Illustrious 18</strong> (jeu courant) et <strong>Fab 4</strong> (abandons).</p>`],
        ['Illustrious 18 (calcul SIGMA 52)', (X) => indexTable(X, 'strip', 'I18') + `<p>Assurance : la prendre à <strong>TC ≥ +${X.D.presets.strip.insurance.index}</strong> (seuil exact ${fr(X.D.presets.strip.insurance.exact, 2)}).</p>`],
        ['Fab 4 (abandons)', (X) => indexTable(X, 'strip', 'Fab4')],
        ['D\'où viennent ces nombres', () => `<p>SIGMA 52 calcule chaque indice : composition moyenne du sabot à chaque true count (à mi-sabot), EV exacte des deux actions, et TC où elles s'égalisent, arrondi à l'entier. Les tables publiées par les auteurs de référence peuvent différer d'un point sur certaines mains (méthode de simulation, profondeur, mains de plus de deux cartes). L'écart d'EV autour d'un indice est faible : se tromper d'un point coûte peu, oublier l'indice coûte plus.</p>`],
        ['Ordre d\'apprentissage', () => `<ol><li>Assurance (le plus rentable en sabot).</li><li>16 contre 10, 15 contre 10, 12 contre 3 et 2.</li><li>Les doubles (10 contre 10, 11 contre As, 9 contre 2 et 7, 10 contre As).</li><li>Les 10,10 contre 5 et 6 : très rentables, mais très visibles.</li><li>Le reste, puis les abandons.</li></ol>`],
      ],
      mistakes: ['Appliquer l\'indice avec le RC au lieu du TC', 'Séparer les 10 à chaque compte positif', 'Apprendre 100 indices avant de maîtriser les 18 premiers'],
      keys: ['Indice = TC où la décision change', 'Assurance à TC élevé (voir tableau)', 'Les 18 premiers apportent l\'essentiel'],
      quiz: [
        { q: 'Un indice « rester à TC ≥ +4 » signifie :', opts: ['Rester si le RC vaut 4', 'Rester si le TC atteint +4, tirer sinon', 'Toujours rester', 'Miser 4 unités'], ok: 1, why: 'L\'indice s\'applique au true count.' },
        { q: 'Les indices de SIGMA 52 sont :', opts: ['Copiés d\'un livre', 'Calculés par le moteur, à ±1 des tables publiées', 'Approximatifs à 5 points', 'Valables sans compter'], ok: 1, why: 'Le moteur les calcule ; les tables de référence peuvent différer d\'un point.' },
        { q: 'L\'assurance devient rentable :', opts: ['À TC négatif', 'Quand le TC dépasse l\'indice d\'assurance', 'Avec un 20', 'Jamais'], ok: 1, why: 'Elle dépend de la proportion de 10 restants.' },
      ],
    },
    {
      id: 'mises', title: 'Écart de mises, rampe et Kelly', minutes: 16,
      goals: ['Construire une rampe de mises à partir du true count', 'Comprendre le critère de Kelly'],
      sections: [
        ['Pourquoi varier la mise', (X) => `<p>L'avantage n'apparaît qu'à TC positif (vers +${fr(zeroTC(X) ?? 1, 1)} dans le jeu « ${X.D.presets.strip.label} »). Miser pareil partout revient à jouer à perte. On mise <strong>le minimum</strong> à TC neutre ou négatif, et davantage quand le TC monte. L'écart entre la plus petite et la plus grande mise s'appelle l'<strong>écart de mises</strong> (1-8, 1-12…).</p>`],
        ['Kelly', () => `<p>Le critère de Kelly mise une fraction de la bankroll égale à <strong>avantage ÷ variance</strong>. Au blackjack, la variance d'une main vaut environ 1,3 mise² (doubles et splits compris ; la simulation de SIGMA 52 mesure un écart-type d'environ 1,15 mise). À +1 % d'avantage, Kelly mise environ 0,8 % de la bankroll.</p>
          <p>Kelly entier est très volatil. Beaucoup jouent une <strong>fraction</strong> (moitié ou quart) : un peu moins de gain moyen, beaucoup moins de risque.</p>`],
        ['Construire sa rampe', () => `<p>Dans l'onglet Bankroll, entre ton capital, ton unité et ta rampe. La simulation mesure l'EV par heure, l'écart-type, le risque de ruine et le nombre de mains nécessaires pour que l'EV dépasse la chance. Ajuste jusqu'à un risque que tu acceptes.</p>`],
        ['Le wonging', () => `<p>Observer une table sans jouer, entrer quand le compte monte, sortir quand il baisse : c'est le <strong>wonging</strong>. Très efficace, très repérable, et souvent limité par une règle « pas d'entrée en cours de sabot ».</p>`],
      ],
      mistakes: ['Miser gros à TC négatif « pour se refaire »', 'Kelly entier sur un petit capital', 'Une rampe que le casino repère en trois mains'],
      keys: ['Mise minimum tant que le TC est ≤ 0', 'Kelly : fraction = avantage ÷ variance (≈ 1,3)', 'Une fraction de Kelly réduit fortement le risque'],
      quiz: [
        { q: 'Kelly à +1 % d\'avantage, variance 1,3 :', opts: ['≈ 0,8 % de la bankroll', '1 % de la bankroll', '10 % de la bankroll', '1,3 % de la bankroll'], ok: 0, why: '0,01 ÷ 1,3 ≈ 0,77 %.' },
        { q: 'À TC −2, on mise :', opts: ['Le maximum', 'Le minimum (ou on quitte la table)', 'Comme d\'habitude', 'Le double'], ok: 1, why: 'L\'avantage est à la maison.' },
        { q: 'Le demi-Kelly :', opts: ['Divise le gain moyen par deux et le risque par deux', 'Réduit un peu le gain moyen et beaucoup le risque', 'Augmente le risque', 'Est interdit'], ok: 1, why: 'La croissance baisse peu, la volatilité beaucoup.' },
      ],
    },
    {
      id: 'variance', title: 'Variance, risque de ruine, N0', minutes: 14,
      goals: ['Mesurer combien de mains il faut pour que l\'avantage se voie', 'Dimensionner sa bankroll'],
      sections: [
        ['L\'ordre de grandeur', () => `<p>Un compteur gagne souvent de l'ordre d'une fraction d'unité par 100 mains, avec un écart-type de dizaines d'unités sur ces 100 mains. Il faut donc des <strong>dizaines de milliers de mains</strong> pour que l'espérance dépasse la chance. L'onglet Bankroll calcule tes valeurs exactes pour ta rampe.</p>`],
        ['N0', () => `<p><strong>N0</strong> = (écart-type ÷ espérance)² par main : le nombre de mains après lequel l'espérance cumulée égale un écart-type. Avant N0, tu peux perdre sans rien avoir fait de faux.</p>`],
        ['Risque de ruine', () => `<p>Probabilité de perdre toute la bankroll avant de doubler, ou pour toujours. Approximation : RoR ≈ exp(−2 × espérance × bankroll ÷ variance), en unités par main. SIGMA 52 l'estime aussi par simulation.</p>`],
      ],
      mistakes: ['Juger sa méthode sur 10 séances', 'Jouer avec une bankroll de 50 grosses mises', 'Confondre un mauvais résultat et une mauvaise décision'],
      keys: ['N0 = (σ ÷ μ)²', 'RoR ≈ exp(−2 μ B ÷ σ²)', 'Le résultat d\'une séance ne prouve rien'],
      quiz: [
        { q: 'μ = 0,02 unité/main, σ = 3 unités/main. N0 ?', opts: ['150', '22 500', '2 250', '450'], ok: 1, why: '(3 ÷ 0,02)² = 150² = 22 500 mains.' },
        { q: 'Doubler la bankroll (même rampe) :', opts: ['Divise le risque de ruine par deux', 'Élève le risque de ruine au carré (le réduit fortement)', 'Ne change rien', 'Double le risque'], ok: 1, why: 'exp(−2μ·2B/σ²) = (exp(−2μB/σ²))².' },
        { q: 'Après 20 séances perdantes avec zéro erreur :', opts: ['La méthode ne marche pas', 'C\'est compatible avec la variance ; vérifier les décisions, pas le résultat', 'Il faut miser plus', 'Changer de compte'], ok: 1, why: 'Bien en dessous de N0, le résultat ne prouve rien.' },
      ],
    },
    {
      id: 'discretion', title: 'Contre-mesures et discrétion', minutes: 12,
      goals: ['Reconnaître ce que surveille un casino', 'Évaluer le coût du jeu de couverture'],
      sections: [
        ['Ce qui attire l\'attention', () => `<ul><li>Un écart de mises brutal et corrélé au compte.</li><li>Des déviations visibles (séparer des 10, rester sur 16 contre 10 puis tirer la main suivante).</li><li>Entrer et sortir des tables au gré du compte.</li><li>Ne regarder que les cartes, sans parler, sans boire.</li><li>Des séances longues au même endroit.</li></ul>`],
        ['Les réponses du casino', () => `<p>Mélange plus tôt, mise à plat imposée, mise maximale réduite, refus de mise, demande de quitter le jeu. Ces réponses sont légales pour l'établissement.</p>`],
        ['Le prix de la couverture', () => `<p>Chaque geste de couverture coûte : ne pas séparer des 10 à +5, garder une mise moyenne à TC négatif, ne pas assurer. Compte ce coût dans la simulation (rampe plus douce, indices désactivés). Si la couverture mange tout l'avantage, il n'y a plus rien à jouer.</p>`],
      ],
      mistakes: ['Passer de 1 à 12 unités d\'une main à l\'autre', 'Séparer des 10 à chaque compte positif', 'Revenir au même casino chaque soir'],
      keys: ['La rampe est ce qui se voit le plus', 'Toute couverture a un coût : à simuler', 'Le casino a le droit de refuser'],
      quiz: [
        { q: 'Le signal le plus visible d\'un compteur :', opts: ['Il boit un soda', 'Une mise qui suit le compte', 'Il joue au premier siège', 'Il parle peu'], ok: 1, why: 'L\'écart de mises corrélé au compte est ce qui est surveillé en premier.' },
        { q: 'Réaction légale d\'un casino :', opts: ['Confisquer les gains', 'Mélanger plus tôt ou limiter la mise', 'Porter plainte pour comptage', 'Changer les règles en cours de main'], ok: 1, why: 'Il peut adapter le jeu ou refuser le joueur.' },
      ],
    },
    {
      id: 'session', title: 'Conduire une séance', minutes: 10,
      goals: ['Préparer, jouer et clôturer une séance réelle', 'Tenir un journal qui sert à progresser'],
      sections: [
        ['Avant', () => `<ul><li>Entraînement du jour fait : 50 décisions et un paquet chrono sans erreur.</li><li>Règles de la table vérifiées (pancarte) et stratégie adaptée revue.</li><li>Capital de séance fixé ; rampe décidée à l'avance.</li><li>Reposé, sans alcool, sans enjeu émotionnel.</li></ul>`],
        ['Pendant', () => `<p>Ton seul travail : décision juste, compte juste, mise juste. Si tu perds le compte, mise le minimum jusqu'au mélange. Fatigué ou agacé : tu pars. Aucune notation, aucun appareil.</p>`],
        ['Après', () => `<p>Note la séance dans le Journal : durée, mains estimées, unité, résultat, TC maximal, signes d'attention. Compare à l'espérance simulée : un écart dans la bande d'un écart-type est normal.</p>`],
      ],
      mistakes: ['Continuer après avoir perdu le compte', 'Augmenter l\'unité après une perte', 'Ne pas noter la séance'],
      keys: ['Compte perdu = mise minimum', 'Juger les décisions, pas le résultat', 'Journal après chaque séance'],
      quiz: [
        { q: 'Tu perds le compte en milieu de sabot :', opts: ['Tu estimes au hasard', 'Mise minimum jusqu\'au mélange', 'Tu recommences à 0', 'Tu mises le maximum'], ok: 1, why: 'Sans compte fiable, tu n\'as pas d\'avantage.' },
        { q: 'Après une séance perdante :', opts: ['Augmenter l\'unité', 'Noter, comparer à l\'espérance, vérifier les décisions', 'Changer de méthode', 'Arrêter le comptage'], ok: 1, why: 'Le résultat d\'une séance est dominé par la variance.' },
      ],
    },
    {
      id: 'mythes', title: 'Mythes et systèmes perdants', minutes: 10,
      goals: ['Démonter les systèmes de mise et les croyances courantes'],
      sections: [
        ['Les progressions (Martingale et autres)', () => `<p>Doubler après chaque perte ne change pas l'espérance d'une main : la somme de mises à espérance négative reste négative. La Martingale transforme beaucoup de petits gains en une rare perte énorme, dès qu'on atteint la mise maximale ou le bout du capital.</p>`],
        ['« Le mauvais joueur fait perdre la table »', () => `<p>Les choix d'un voisin changent les cartes que tu reçois, mais pas leur distribution moyenne : il te prend autant de mauvaises cartes que de bonnes. Sur la durée, son jeu ne change pas ton espérance.</p>`],
        ['Séries, intuition, mises annexes', () => `<p>Les cartes n'ont pas de mémoire au-delà de ce que le compte mesure. Les mises annexes (paires, 21+3…) ont en général un avantage de la maison bien plus élevé que le jeu principal : à éviter.</p>`],
      ],
      mistakes: ['Utiliser une progression de mises', 'Suivre une « série »', 'Jouer les mises annexes'],
      keys: ['Aucun système de mise ne change l\'espérance', 'Les voisins ne changent pas ton espérance', 'Seul le compte change la composition connue'],
      quiz: [
        { q: 'La Martingale :', opts: ['Garantit un gain', 'Change la fréquence des résultats, pas l\'espérance', 'Est interdite', 'Fonctionne en sabot de 6'], ok: 1, why: 'L\'espérance d\'une suite de mises négatives reste négative.' },
        { q: 'Un joueur qui tire sur 12 contre 6 :', opts: ['Vole la carte du croupier', 'Ne change pas ton espérance en moyenne', 'Te fait perdre à coup sûr', 'Augmente ton avantage'], ok: 1, why: 'Il prend autant de bonnes que de mauvaises cartes en moyenne.' },
      ],
    },
  ];
  // ---------- Compléments : systèmes de comptage, mathématiques, au-delà du comptage ----------
  const CNT = (X, key) => X.D.counts && X.D.counts[key || 'europe'];
  const fx = (x, d = 2) => fr(x, d);
  function sysTags(X) {
    const S = X.CT.SYSTEMS, cols = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'], idx = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const v = (x) => (x === 0 ? '0' : (x > 0 ? '+' : '−') + fr(Math.abs(x), x % 1 ? 1 : 0));
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Système</th>${cols.map((c) => `<th class="n">${c}</th>`).join('')}<th>Niveau</th><th>Équilibré</th></tr></thead><tbody>${S.map((s) => `<tr><td><strong>${s.name}</strong></td>${idx.map((r) => `<td class="n">${s.red7 && r === 7 ? '+1 r / 0 n' : v(s.t[r])}</td>`).join('')}<td class="n">${s.level}</td><td>${s.balanced ? 'oui' : 'non (' + (s.imb > 0 ? '+' : '') + fx(s.imb, 0) + ' / paquet)'}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Red Seven : 7 rouge +1, 7 noir 0. Wong Halves s'écrit souvent ×2 (2, 7 : +1 ; 3, 4, 6 : +2 ; 5 : +3 ; 9 : −1 ; 10, As : −2), d'où « niveau 3 ».</p>`;
  }
  function corrTable(X, key) {
    const C = CNT(X, key); if (!C) return '<p class="note">Données de comparaison indisponibles.</p>';
    const S = X.CT.SYSTEMS;
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Système</th><th class="n">BC</th><th class="n">BC avec as à part</th><th class="n">IC</th><th class="n">Eff. de jeu*</th></tr></thead><tbody>${S.map((s) => { const r = C.systems[s.id]; return `<tr><td>${s.name}</td><td class="n">${fx(r.bc)}</td><td class="n">${r.bcAce ? fx(r.bcAce) + ' (as ' + (r.aceVal > 0 ? '+' : '') + fx(r.aceVal, 1) + ')' : '—'}</td><td class="n">${fx(r.ic)}</td><td class="n">${fx(r.pe)}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="note">Calculs SIGMA 52 pour « ${X.D.presets[key || 'europe'].label} », à partir des effets de retrait de son moteur (un paquet). *Efficacité de jeu au sens de SIGMA 52 : moyenne des |corrélations| avec l'effet de retrait de chaque décision d'indice (Illustrious 18 et Fab 4). Ce n'est pas la PE publiée par Griffin, qui pondère chaque décision par son gain : ordre de grandeur comparable, valeurs différentes.</p>`;
  }
  function simTable(X, key) {
    const C = CNT(X, key); if (!C) return '';
    const rows = X.CT.SYSTEMS.map((s) => [s.name, C.systems[s.id].sim]).concat([['Hi-Lo + indices et assurance', C.systems.hiloIdx ? C.systems.hiloIdx.sim : C.hiloIdx?.sim]]).filter((r) => r[1]);
    const ref = C.systems.hilo.sim, sc = (m) => 1e6 * m.mu * m.mu / (m.sd * m.sd);
    rows.sort((a, b) => b[1].mu - a[1].mu);
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Système</th><th class="n">Gain / 100 mains</th><th class="n">Écart-type / 100</th><th class="n">Mise moyenne</th><th class="n">SCORE relatif</th></tr></thead><tbody>${rows.map(([n, m]) => `<tr><td>${n}</td><td class="n">${fx(m.mu * 100)} u</td><td class="n">${fx(m.sd * 10, 1)} u</td><td class="n">${fx(m.avgBet)} u</td><td class="n">${m.mu > 0 ? fx(sc(m) / sc(ref) * 100, 0) : '—'}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Simulation SIGMA 52 : ${(ref.hands / 1e6).toFixed(0)} millions de mains par système, ${X.D.presets[key || 'europe'].label}, pénétration 75 %, 2 autres joueurs. Même rampe pour tous (mise de 1 unité par 0,1 point d'avantage estimé par le système, de 1 à 12 unités), stratégie de base sans indices sauf la dernière ligne. Comptes déséquilibrés convertis idéalement en compte équilibré : leur résultat est un plafond. SCORE relatif : Hi-Lo = 100. Les différences de quelques points sont dans le bruit de la simulation.</p>`;
  }
  function eorTable(X, key) {
    const C = CNT(X, key); if (!C) return '';
    const e = C.eor.eor, cols = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    return `<div class="tw"><table class="t bjt"><thead><tr><th></th>${cols.map((c) => `<th class="n">${c}</th>`).join('')}</tr></thead><tbody><tr><td>Effet</td>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => `<td class="n" style="color:var(${e[r] > 0 ? '--good' : '--bad'})">${sg(e[r], 2)}</td>`).join('')}</tr></tbody></table></div>
      <p class="note">Variation de l'avantage du joueur quand on retire une seule carte de ce rang d'un paquet de 52, règles « ${X.D.presets[key || 'europe'].label} » sur un paquet, jeu optimal (calcul exact SIGMA 52). Avantage du paquet complet : ${sg(C.eor.edge0, 2)}.</p>`;
  }
  function pBJ(decks) { const N = 52 * decks; return 2 * (4 * decks / N) * (16 * decks / (N - 1)); }
  function bustTable(X) {
    const s = X.BJ.shoeOf(6), N = X.BJ.total(s);
    const pb = (t) => { let p = 0; for (let r = 1; r <= 10; r++) if (t + r > 21) p += s[r] / N; return p; };
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Total dur</th>${[12, 13, 14, 15, 16, 17, 18, 19, 20].map((t) => `<th class="n">${t}</th>`).join('')}</tr></thead><tbody><tr><td>Crève en tirant</td>${[12, 13, 14, 15, 16, 17, 18, 19, 20].map((t) => `<td class="n">${pc(pb(t), 0)}</td>`).join('')}</tr></tbody></table></div><p class="note">Sabot de 6 jeux complet : proportion des cartes qui font dépasser 21.</p>`;
  }
  function outcomeStats(X) {
    const BJ = X.BJ, P = X.D.presets.europe, table = Object.fromEntries(Object.entries(P.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))]));
    const s = BJ.simulate({ rules: P.rules, table, hands: 200000, seed: 4242 });
    let w = 0, l = 0, p = 0; const big = {}; for (const x of s.res) { if (x > 0) w++; else if (x < 0) l++; else p++; const k = Math.max(-4, Math.min(4, Math.round(x))); big[k] = (big[k] || 0) + 1; }
    const n = s.res.length;
    return { w: w / n, l: l / n, p: p / n, mean: s.mean, sd: s.sd, big, n };
  }
  const NORM = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), q = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - q : q; };

  const MORE = [
    {
      id: 'systemes', part: 'Systèmes', title: 'Panorama des systèmes de comptage', minutes: 16,
      goals: ['Connaître les grands systèmes et leurs valeurs', 'Comprendre niveau, équilibre et compte de côté'],
      sections: [
        ['Les valeurs de chaque système', (X) => sysTags(X)],
        ['Trois propriétés', () => `<ul><li><strong>Niveau</strong> : la plus grande valeur absolue. Niveau 1 (±1) se tient vite ; niveaux 2 et 3 collent mieux aux effets de retrait réels, au prix d'erreurs plus fréquentes.</li><li><strong>Équilibre</strong> : un paquet complet donne 0. Un compte équilibré se divise par les paquets restants (true count). Un compte déséquilibré (KO, Red Seven, Uston SS) se joue au running count, avec un point de départ choisi pour éviter la division.</li><li><strong>Compte de côté</strong> : certains systèmes laissent l'as à 0 (meilleur pour jouer) et comptent les as à part pour ajuster la mise.</li></ul>`],
        ['Ce que tous partagent', () => `<p>Tous donnent une valeur positive aux petites cartes (surtout 4, 5, 6) et négative aux 10. Ils diffèrent sur les cartes ambiguës : le 2, le 7, le 9 et l'as. C'est là que se joue l'écart entre systèmes, et il est faible.</p>`],
      ],
      mistakes: ['Changer de système avant d\'en maîtriser un', 'Diviser un compte déséquilibré par les paquets restants comme un Hi-Lo'],
      keys: ['Niveau = finesse contre vitesse', 'Équilibré → true count ; déséquilibré → running count et point de départ', 'L\'as : dans le compte (mise) ou à part (jeu)'],
      quiz: [
        { q: 'Un compte déséquilibré :', opts: ['Donne 0 sur un paquet complet', 'Se joue au running count avec un départ fixé', 'Est toujours plus précis', 'Interdit l\'assurance'], ok: 1, why: 'Le départ (IRC) compense le déséquilibre pour éviter la conversion.' },
        { q: 'Le niveau d\'un système est :', opts: ['Le nombre de paquets', 'La plus grande valeur absolue attribuée à une carte', 'Son avantage', 'Le nombre d\'indices'], ok: 1, why: 'Hi-Lo niveau 1, Hi-Opt II niveau 2, Uston APC niveau 3.' },
        { q: 'Pourquoi Hi-Opt laisse-t-il l\'as à 0 ?', opts: ['Par erreur', 'L\'as aide la mise mais gêne les décisions de jeu : on le compte à part', 'L\'as est neutre au blackjack', 'Pour aller plus vite'], ok: 1, why: 'L\'as compte beaucoup pour l\'avantage (blackjacks), peu pour la plupart des décisions de jeu.' },
      ],
    },
    {
      id: 'desequilibres', part: 'Systèmes', title: 'Comptes déséquilibrés : KO, Red Seven, Uston SS', minutes: 12,
      goals: ['Tenir un compte déséquilibré', 'Comprendre le départ (IRC) et le pivot'],
      sections: [
        ['Le principe', () => `<p>Un compte déséquilibré monte en moyenne au fil du sabot. Le KO ajoute +4 par paquet joué ; le Red Seven +2. On part donc d'une valeur négative qui dépend du nombre de paquets : <strong>KO : 4 − 4 × paquets</strong> (−20 en 6 jeux), <strong>Red Seven : −2 × paquets</strong> (−12 en 6 jeux).</p>
          <p>Le running count porte alors à la fois l'information de composition et celle de profondeur. Les auteurs choisissent le départ pour qu'un running count donné, le <strong>pivot</strong>, corresponde à peu près au même avantage à toute profondeur. Au pivot et au-dessus, on augmente la mise.</p>`],
        ['Ce qu\'on gagne, ce qu\'on perd', () => `<p>On gagne la division. On perd un peu de précision loin du pivot : le running count seul ne dit pas exactement l'avantage à TC élevé ou bas. Pour les décisions de jeu, les auteurs proposent des indices simplifiés exprimés en running count.</p>
          <p class="note">Dans SIGMA 52, les comptes déséquilibrés servent aux exercices de comptage et aux comparaisons. La table d'entraînement note la rampe et les indices avec les comptes équilibrés.</p>`],
      ],
      mistakes: ['Oublier le départ négatif au mélange', 'Comparer un RC KO à un indice Hi-Lo'],
      keys: ['KO : départ 4 − 4D, +4 par paquet en moyenne', 'Red Seven : départ −2D', 'Pas de division, un peu moins de précision'],
      quiz: [
        { q: 'Départ du KO en sabot de 6 jeux :', opts: ['0', '−20', '−24', '+4'], ok: 1, why: '4 − 4 × 6 = −20.' },
        { q: 'Pourquoi le KO n\'a-t-il pas besoin de true count ?', opts: ['Il est plus précis', 'Son déséquilibre et son départ intègrent la profondeur', 'Il ne sert qu\'en un jeu', 'Il compte les as à part'], ok: 1, why: 'Le running count monte avec la profondeur, ce qui remplace en partie la division.' },
      ],
    },
    {
      id: 'multiniveaux', part: 'Systèmes', title: 'Niveaux 2 et 3, comptes de côté', minutes: 14,
      goals: ['Tenir un compte de niveau 2', 'Utiliser un compte des as pour la mise'],
      sections: [
        ['Niveau 2 en pratique', () => `<p>Avec Hi-Opt II, Omega II ou Zen, le 4, le 5 et le 6 valent +2, les 10 −2. Les paires s'annulent moins souvent, le running count grimpe plus vite, le true count se calcule pareil. Les indices sont exprimés dans l'unité du système : un indice Hi-Opt II ne se compare pas directement à un indice Hi-Lo.</p>`],
        ['Le compte des as', (X) => { const C = CNT(X); const r = C && C.systems.hiopt2; return `<p>On compte les as vus à part. Chaque paquet joué devrait en avoir montré 4 : l'écart <strong>as vus − 4 × paquets joués</strong> dit si le reste du sabot est riche (écart négatif) ou pauvre (écart positif) en as. Pour la mise seulement, on ajoute au running count v × (as vus − 4 × paquets joués), avec v la valeur d'as ci-dessous (négative : un as sorti fait baisser le compte), puis on divise par les paquets restants comme d'habitude.</p>${r ? `<p>Calcul SIGMA 52 (jeu européen) : pour Hi-Opt II, la valeur d'as qui maximise la corrélation de mise est ${r.aceVal > 0 ? '+' : ''}${fx(r.aceVal, 1)} par as en défaut, et la BC passe de ${fx(r.bc)} à ${fx(r.bcAce)}.</p>` : ''}`; }],
        ['Le vrai coût', () => `<p>Chaque niveau et chaque compte de côté ajoutent des erreurs. Une erreur de compte coûte bien plus que l'écart de précision entre deux systèmes : SIGMA 52 recommande un compte de niveau 1 tant que le paquet chrono ne passe pas sous 25 secondes sans erreur.</p>`],
      ],
      mistakes: ['Appliquer l\'ajustement des as aux décisions de jeu', 'Passer au niveau 2 sans maîtriser le niveau 1'],
      keys: ['Niveau 2 = indices dans l\'unité du système', 'Compte des as : mise seulement', 'La précision gagnée est petite, les erreurs coûtent cher'],
      quiz: [
        { q: 'L\'ajustement des as sert à :', opts: ['Jouer les mains', 'Miser', 'Décider l\'assurance seulement', 'Rien'], ok: 1, why: 'L\'as compte pour l\'avantage global (blackjacks), pas pour la plupart des décisions.' },
        { q: 'Un indice Hi-Opt II de +6 correspond à :', opts: ['Hi-Lo +6', 'Une valeur dans l\'unité Hi-Opt II, différente du Hi-Lo', 'Rien', 'Un running count'], ok: 1, why: 'Chaque système a son échelle.' },
      ],
    },
    {
      id: 'choisir', part: 'Systèmes', title: 'Choisir son système : corrélations et simulations', minutes: 16,
      goals: ['Lire BC, IC et efficacité de jeu', 'Juger un système sur des simulations à rampe identique'],
      sections: [
        ['Trois corrélations', () => `<ul><li><strong>BC (betting correlation)</strong> : corrélation entre les valeurs du compte et l'effet de retrait de chaque carte sur l'avantage. Elle mesure la qualité de la mise.</li><li><strong>IC (insurance correlation)</strong> : corrélation avec la seule chose qui compte pour l'assurance, la proportion de 10.</li><li><strong>Efficacité de jeu</strong> : qualité des décisions d'indice.</li></ul>
          <div class="formula">BC = Σ nᵣ (tᵣ − t̄)(eᵣ − ē) ÷ √(Σ nᵣ (tᵣ − t̄)² × Σ nᵣ (eᵣ − ē)²)</div><p class="note">nᵣ : cartes du rang par paquet (16 pour les 10), tᵣ : valeur du compte, eᵣ : effet de retrait.</p>`],
        ['Les chiffres pour ton jeu', (X) => corrTable(X, 'europe')],
        ['Simulation à rampe identique', (X) => simTable(X, 'europe')],
        ['Conclusion', () => `<p>En sabot, la mise fait l'essentiel du gain et les systèmes simples en captent la plus grande part. L'écart entre Hi-Lo et les meilleurs comptes de niveau 2 ou 3 reste petit devant le coût d'une seule erreur de compte par sabot. Le choix raisonnable : Hi-Lo et ses indices, puis éventuellement un niveau 2 si tu vises le sabot à long terme et que tes exercices le supportent.</p>`],
      ],
      mistakes: ['Choisir sur la BC seule', 'Comparer des systèmes avec des rampes différentes'],
      keys: ['BC : mise ; IC : assurance ; efficacité de jeu : indices', 'En sabot, la mise domine', 'Simplicité et exactitude avant finesse'],
      quiz: [
        { q: 'Quel compte a une IC de 1 ?', opts: ['Hi-Lo', 'Ten Count', 'Zen', 'KO'], ok: 1, why: 'Il ne distingue que 10 et non-10 : exactement ce que l\'assurance demande.' },
        { q: 'En sabot de 6 jeux, la majeure partie du gain d\'un compteur vient :', opts: ['Des indices', 'De l\'écart de mises', 'De l\'assurance', 'Des abandons'], ok: 1, why: 'Voir la ligne Hi-Lo avec et sans indices dans la simulation.' },
        { q: 'Pour comparer deux systèmes, il faut :', opts: ['Les mêmes règles et la même rampe', 'Le même nombre de joueurs seulement', 'Leur BC uniquement', 'Leur niveau'], ok: 0, why: 'Sinon on compare des rampes, pas des comptes.' },
      ],
    },
    {
      id: 'probas', part: 'Mathématiques', title: 'Probabilités de base du blackjack', minutes: 14,
      goals: ['Calculer la probabilité d\'un blackjack', 'Comprendre le tirage sans remise'],
      sections: [
        ['Blackjack servi', () => `<p>Il faut un as et une carte de 10, dans un ordre ou dans l'autre :</p><div class="formula">P(BJ) = 2 × (as ÷ N) × (dix ÷ (N − 1))</div>
          <p>Un paquet : 2 × 4/52 × 16/51 = <strong>${pc(pBJ(1))}</strong>. Six paquets : <strong>${pc(pBJ(6))}</strong>. Environ un blackjack toutes les ${Math.round(1 / pBJ(6))} mains.</p>`],
        ['Sans remise', () => `<p>Chaque carte sortie change les probabilités des suivantes : c'est ce qui rend le comptage possible. Avec 6 paquets, un as en moins fait passer la proportion d'as de 24/312 à 23/311 : l'effet d'une carte est petit, mais il s'accumule sur un sabot.</p>`],
        ['Crever en tirant', (X) => bustTable(X)],
        ['Le croupier', (X) => dealerTable(X)],
      ],
      mistakes: ['Oublier le facteur 2 (deux ordres)', 'Raisonner comme si le sabot était infini en un jeu'],
      keys: ['P(BJ) ≈ 4,8 %', 'Sans remise : chaque carte change la suite', 'Crever en tirant 16 : plus d\'une fois sur deux'],
      quiz: [
        { q: 'P(blackjack) en un paquet :', opts: ['4/52', '2 × 4/52 × 16/51', '16/52', '1/21'], ok: 1, why: 'As puis 10, ou 10 puis as.' },
        { q: 'En tirant sur un 16 dur, tu crèves avec :', opts: ['Un 5 ou moins', 'Un 6 ou plus', 'Un 10 seulement', 'Un as'], ok: 1, why: '16 + 6 = 22.' },
      ],
    },
    {
      id: 'esperance', part: 'Mathématiques', title: 'Espérance et variance d\'une main', minutes: 16,
      goals: ['Lire l\'espérance et l\'écart-type d\'une main', 'Calculer la probabilité d\'être gagnant après N mains'],
      sections: [
        ['Distribution d\'une main', (X) => { const o = outcomeStats(X); return `<p>Simulation de ${(o.n / 1000).toFixed(0)} 000 mains, jeu européen, stratégie de base, mise de 1 :</p><div class="stats"><div class="stat"><span>Gagnées</span><b>${pc(o.w)}</b></div><div class="stat"><span>Perdues</span><b>${pc(o.l)}</b></div><div class="stat"><span>Égalités</span><b>${pc(o.p)}</b></div><div class="stat"><span>Espérance</span><b>${sg(o.mean)}</b></div><div class="stat"><span>Écart-type</span><b>${fx(o.sd)}</b></div></div>
          <p>On perd plus souvent qu'on ne gagne ; le blackjack payé 3:2 et les doubles compensent presque. La variance dépasse 1 (${fx(o.sd * o.sd)}) parce que doubles et splits engagent parfois 2 mises ou plus.</p>`; }],
        ['N mains', () => `<p>Sur N mains indépendantes : espérance N × μ, écart-type σ × √N. L'espérance grandit comme N, l'écart-type comme √N : l'avantage finit par dominer, mais lentement.</p><div class="formula">P(gagnant après N mains) ≈ Φ(μ √N ÷ σ)</div>
          <p>Exemple : avantage +1 % par mise (μ = 0,01), σ = 1,15. Après 1 000 mains : Φ(0,01 × 31,6 ÷ 1,15) = ${pc(NORM(0.01 * Math.sqrt(1000) / 1.15), 0)}. Après 100 000 mains : ${pc(NORM(0.01 * Math.sqrt(100000) / 1.15), 0)}.</p>`],
      ],
      mistakes: ['Croire que gagner plus de mains qu\'on n\'en perd est nécessaire', 'Juger un avantage de 1 % sur 1 000 mains'],
      keys: ['σ ≈ 1,15 mise par main', 'Espérance ∝ N, écart-type ∝ √N', 'P(gagnant) ≈ Φ(μ√N/σ)'],
      quiz: [
        { q: 'Sur 10 000 mains, l\'écart-type du résultat vaut :', opts: ['σ × 10 000', 'σ × 100', 'σ', 'σ ÷ 100'], ok: 1, why: '√10 000 = 100.' },
        { q: 'Pourquoi la variance d\'une main dépasse-t-elle 1 ?', opts: ['Le blackjack paie 3:2 et doubles/splits engagent plus d\'une mise', 'Le croupier triche', 'Les égalités', 'Elle ne dépasse pas 1'], ok: 0, why: 'Les résultats possibles vont au-delà de ±1 mise.' },
      ],
    },
    {
      id: 'retrait', part: 'Mathématiques', title: 'Effets de retrait et estimation linéaire', minutes: 14,
      goals: ['Lire les effets de retrait (EOR)', 'Estimer l\'avantage d\'un sabot à partir des cartes sorties'],
      sections: [
        ['Effets de retrait', (X) => eorTable(X, 'europe') + `<p>Le 5 est la carte la plus favorable au croupier : la retirer aide le joueur plus que toute autre. Les 10 et l'as sont les cartes du joueur. En moyenne pondérée par le nombre de cartes, les effets se compensent presque exactement : retirer une carte au hasard ne change presque rien.</p>`],
        ['Estimation linéaire', () => `<div class="formula">avantage ≈ avantage de départ + (52 ÷ cartes restantes) × Σ EORᵣ × déficitᵣ</div><p>Le déficit d'un rang est ce qui manque par rapport à une composition proportionnelle. Tout système de comptage est une approximation de cette formule avec des valeurs entières : plus ses valeurs sont proches des EOR (à un facteur près), meilleure est sa BC.</p><p class="note">L'onglet Maths compare l'estimation linéaire au calcul exact pour une composition que tu choisis.</p>`],
      ],
      mistakes: ['Lire un EOR comme un effet par sabot (il est par paquet)', 'Oublier que l\'effet d\'une carte diminue quand le sabot est grand'],
      keys: ['EOR du 5 : le plus fort ; 10 et as : négatifs', 'Un compte imite les EOR avec des entiers', 'Effet ∝ 1 ÷ cartes restantes'],
      quiz: [
        { q: 'Retirer un 5 du sabot :', opts: ['Aide le croupier', 'Aide le joueur', 'Ne change rien', 'Aide seulement l\'assurance'], ok: 1, why: 'Le 5 améliore les mains raides du croupier.' },
        { q: 'L\'effet d\'une carte retirée est plus grand :', opts: ['En début de sabot de 8 jeux', 'Quand il reste peu de cartes', 'Toujours égal', 'En jeu européen seulement'], ok: 1, why: 'Il est proportionnel à 1 ÷ cartes restantes.' },
      ],
    },
    {
      id: 'kellymaths', part: 'Mathématiques', title: 'Kelly : pourquoi miser avantage ÷ variance', minutes: 16,
      goals: ['Dériver le critère de Kelly', 'Comprendre le Kelly fractionnaire'],
      sections: [
        ['Dérivation', () => `<p>On cherche la fraction f de la bankroll qui maximise la croissance à long terme, soit l'espérance du logarithme du capital. Pour un pari de résultat X (espérance μ, variance σ², petits) :</p>
          <div class="formula">E[ln(1 + fX)] ≈ f μ − f² σ² ÷ 2</div><p>La dérivée s'annule pour <strong>f* = μ ÷ σ²</strong>. Le taux de croissance obtenu vaut μ² ÷ (2σ²) par main.</p>`],
        ['Kelly fractionnaire', () => `<p>Miser c × f* donne une croissance c(2 − c) fois celle de Kelly, et une volatilité c fois plus petite. Demi-Kelly : <strong>75 % de la croissance</strong>, moitié de la volatilité. Deux fois Kelly : croissance nulle. Au-delà : ruine à long terme.</p>
          <p>Avec Kelly entier, la probabilité de voir un jour sa bankroll tomber à une fraction x de sa valeur vaut x : une chance sur deux de la voir divisée par deux. En demi-Kelly, cette probabilité devient x³ (une chance sur huit).</p>`],
        ['Au blackjack', () => `<p>μ dépend du true count, σ² ≈ 1,3 : la mise optimale à chaque TC vaut avantage(TC) ÷ 1,3 × bankroll. C'est ce que calcule le bouton demi-Kelly de l'onglet Bankroll. Les contraintes (mise minimum de la table, discrétion) imposent ensuite une rampe plus plate.</p>`],
      ],
      mistakes: ['Miser Kelly entier', 'Oublier de recalculer les mises quand la bankroll change'],
      keys: ['f* = μ ÷ σ²', 'Demi-Kelly : 75 % de la croissance, moitié du risque', 'Kelly entier : 50 % de chances de perdre la moitié un jour'],
      quiz: [
        { q: 'Croissance relative du demi-Kelly :', opts: ['50 %', '75 %', '100 %', '25 %'], ok: 1, why: 'c(2 − c) avec c = 0,5.' },
        { q: 'Miser 2 × Kelly :', opts: ['Double la croissance', 'Donne une croissance nulle', 'Est optimal', 'Divise le risque'], ok: 1, why: 'c(2 − c) = 0 pour c = 2.' },
        { q: 'Kelly entier, probabilité de voir un jour la bankroll divisée par 2 :', opts: ['1/8', '1/2', '1/4', 'Presque nulle'], ok: 1, why: 'P = x avec x = 1/2.' },
      ],
    },
    {
      id: 'ruinemaths', part: 'Mathématiques', title: 'Risque de ruine, N0, DI, SCORE', minutes: 16,
      goals: ['Calculer un risque de ruine', 'Comparer des jeux avec N0, DI et SCORE'],
      sections: [
        ['Risque de ruine', () => `<p>Si chaque main rapporte en moyenne μ unités avec un écart-type σ, et que l'on joue indéfiniment avec une bankroll B (en unités), l'approximation de diffusion donne :</p><div class="formula">RoR = exp(−2 μ B ÷ σ²)</div><p>Doubler la bankroll élève le risque au carré : 10 % devient 1 %. Avec μ en hausse ou σ en baisse, le risque fond aussi.</p>`],
        ['N0', () => `<div class="formula">N0 = σ² ÷ μ²</div><p>Le nombre de mains après lequel l'espérance cumulée égale un écart-type. En dessous, la chance domine le résultat.</p>`],
        ['DI et SCORE', () => `<p><strong>DI</strong> (desirability index) = 1 000 × gain par 100 mains ÷ écart-type par 100 mains. <strong>SCORE</strong> = DI² ÷ 100 : le gain par 100 mains d'un joueur misant Kelly avec 10 000 de bankroll. Les deux ne dépendent pas de la taille de l'unité : ils servent à comparer des jeux, des rampes, des systèmes.</p><div class="formula">N0 = 10⁸ ÷ DI²</div><p class="note">L'onglet Bankroll calcule ces trois valeurs pour ta rampe.</p>`],
        ['Carte de coupe et pénétration', () => `<p>Plus le croupier coupe profond, plus les true counts extrêmes sont fréquents et plus l'écart de mises rapporte : la pénétration est souvent le premier critère d'une bonne table. À l'inverse, la carte de coupe elle-même coûte un peu au joueur (les sabots riches en petites cartes durent plus de mains). Dans les tests de SIGMA 52, la simulation avec carte de coupe donne un avantage de la maison supérieur de 0,01 à 0,05 point au calcul exact sur sabot neuf (effet de la carte de coupe et des mains de trois cartes jouées au tableau, mêlés).</p>`],
      ],
      mistakes: ['Croire qu\'un RoR de 5 % est négligeable', 'Comparer deux rampes par leur seul gain horaire'],
      keys: ['RoR = exp(−2μB/σ²)', 'N0 = σ²/μ²', 'SCORE = DI²/100, indépendant de l\'unité'],
      quiz: [
        { q: 'RoR de 10 %. Avec une bankroll doublée (même rampe) :', opts: ['5 %', '1 %', '20 %', '10 %'], ok: 1, why: '0,1² = 0,01.' },
        { q: 'μ = 0,03 u/main, σ = 3 u/main. N0 ?', opts: ['100', '10 000', '1 000', '300'], ok: 1, why: '(3 ÷ 0,03)² = 100² = 10 000.' },
        { q: 'Le SCORE sert à :', opts: ['Classer des joueurs', 'Comparer des jeux et des rampes indépendamment de l\'unité', 'Calculer un indice', 'Estimer la pénétration'], ok: 1, why: 'Il est normalisé à une bankroll et à Kelly.' },
      ],
    },
    {
      id: 'audela', part: 'Pratique', title: 'Au-delà du comptage : les autres techniques connues', minutes: 16,
      goals: ['Connaître les techniques d\'avantage hors comptage', 'Mesurer leur légalité et leur réalisme'],
      sections: [
        ['Ce qui existe', () => `<ul><li><strong>Suivi de mélange (shuffle tracking)</strong> : repérer un groupe de cartes riche en 10 et as dans la défausse, le suivre à travers un mélange imparfait, couper pour le placer en jeu. Exige un mélange prévisible et beaucoup d'entraînement.</li><li><strong>Séquençage des as</strong> : mémoriser la carte qui précède un as pour le voir revenir après un mélange imparfait. Même principe, encore plus fragile.</li><li><strong>Carte cachée vue (hole carding)</strong> : voir la carte cachée d'un croupier qui la montre par maladresse. Le statut juridique dépend du pays et des moyens ; un appareil ou un complice en fait clairement une fraude.</li><li><strong>Signes involontaires du croupier</strong> : déduire sa carte cachée de son comportement au moment du peek. Rare avec les machines de vérification.</li><li><strong>Wonging</strong> : n'entrer qu'à compte favorable (voir le module sur les mises).</li><li><strong>Jeu en équipe</strong> : des compteurs à mise minimale appellent un gros joueur aux tables chaudes. Puissant, très surveillé.</li><li><strong>Comptes pour mises annexes</strong> : certaines mises annexes deviennent favorables selon la composition ; demande un compte dédié.</li></ul>`],
        ['Ce qui ne marche pas', () => `<p>Systèmes de mise (Martingale…), lecture de « séries », mélangeurs continus (aucune technique de composition n'y fonctionne), et tout ce qui demande un appareil : interdit, détecté, et pénalement risqué.</p>`],
        ['Cadre', () => `<p>SIGMA 52 n'entraîne que le comptage, la stratégie et la gestion du capital. Les autres techniques sont décrites pour savoir ce qu'elles sont et ce qu'un casino surveille, pas comme un programme.</p>`],
      ],
      mistakes: ['Croire qu\'un mélangeur continu se suit', 'Utiliser un appareil « juste pour vérifier »'],
      keys: ['Suivi de mélange, séquençage, carte cachée vue, équipe : techniques réelles, rares et surveillées', 'Mélangeur continu : rien ne marche', 'Appareil = fraude'],
      quiz: [
        { q: 'Le suivi de mélange exploite :', opts: ['Un mélange imparfait', 'Un mélangeur continu', 'Les séries', 'La Martingale'], ok: 0, why: 'Il faut que des groupes de cartes survivent au mélange.' },
        { q: 'Avec un mélangeur continu :', opts: ['Le suivi de mélange marche', 'Aucune technique de composition ne marche', 'Le KO marche mieux', 'Le séquençage des as marche'], ok: 1, why: 'Les cartes jouées repartent dans la machine à chaque main.' },
      ],
    },
    {
      id: 'histoire', part: 'Pratique', title: 'Brève histoire du blackjack mathématique', minutes: 8,
      goals: ['Situer les grandes étapes'],
      sections: [
        ['Repères', () => `<ul><li><strong>1956</strong> : Baldwin, Cantey, Maisel et McDermott publient une stratégie de base calculée à la main dans le Journal of the American Statistical Association.</li><li><strong>1962</strong> : Edward Thorp, <em>Beat the Dealer</em>, montre par ordinateur que la composition du sabot change l'avantage et que l'on peut compter (Ten Count).</li><li><strong>1963</strong> : Harvey Dubner présente le Hi-Lo.</li><li><strong>Années 1970</strong> : Stanford Wong (<em>Professional Blackjack</em>, Halves, wonging), Ken Uston et ses équipes.</li><li><strong>1979</strong> : Peter Griffin, <em>The Theory of Blackjack</em> : effets de retrait, corrélations, fondements mathématiques du comptage.</li><li><strong>1998</strong> : Vancura et Fuchs, <em>Knock-Out Blackjack</em>, le compte déséquilibré KO.</li><li>Ensuite : sabots plus grands, pénétration réduite, mélangeurs continus, paiement 6:5 ; la simulation sur ordinateur devient l'outil de référence.</li></ul>`],
      ],
      mistakes: [],
      keys: ['1956 : stratégie de base', '1962 : Thorp, le comptage', '1979 : Griffin, la théorie'],
      quiz: [
        { q: 'Qui a montré en 1962 qu\'on peut battre le blackjack en comptant ?', opts: ['Peter Griffin', 'Edward Thorp', 'Ken Uston', 'Stanford Wong'], ok: 1, why: '« Beat the Dealer », 1962.' },
      ],
    },
  ];
  // ---------- Techniques avancées : indices prudents, indices par simulation, rampe optimale ----------
  function advTable(X, key) {
    const A = X.D.adv && X.D.adv[key || 'strip'], P = X.D.presets[key || 'strip']; if (!A) return '';
    const f = (L, d) => L.find((x) => x.row === d.row && x.up === d.up && x.act === d.act && x.basic === d.basic);
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Main</th><th>Contre</th><th>Déviation</th><th class="n">EV max</th><th class="n">Prudent</th><th class="n">Simulation (95 %)</th></tr></thead><tbody>${P.indices.filter((d) => d.set !== 'plus').map((d) => { const r = f(A.ra, d), sm = f(A.sim, d); return `<tr><td>${rowLabel(d.row)}</td><td>${upName(d.up)}</td><td>${ACTFR[d.act]}</td><td class="n">${fx(d.exact, 1)}</td><td class="n">${r ? fx(r.exact, 1) : '—'}</td><td class="n">${sm ? fx(sm.exact, 1) + ' ± ' + fx(1.96 * sm.se, 1) : '—'}</td></tr>`; }).join('')}</tbody></table></div><p class="note">${P.label}. Calculs SIGMA 52 ; « — » : pas de croisement entre −8 et +10.</p>`;
  }
  const ADV = [
    {
      id: 'prudents', part: 'Mathématiques', title: 'Indices prudents et indices par simulation', minutes: 16,
      goals: ['Comprendre pourquoi la variance d\'une action compte quand on mise gros', 'Savoir d\'où viennent les indices et quelle est leur précision'],
      sections: [
        ['La variance des actions', (X) => { const BJ = X.BJ, c = BJ.Calc({ decks: 6 }), sh = BJ.shoeOf(6), m = BJ.rowMoments(c, sh, BJ.ROWS.find((r) => r.id === 'h10'), 10); return `<p>Doubler engage deux mises : la variance d'un double est environ quatre fois celle d'un « tirer ». Exemple, 10 dur contre 10, sabot de 6 jeux complet : tirer, EV ${sg(m.ev.hit)} et variance ${fx(m.var.hit)} ; doubler, EV ${sg(m.ev.double)} et variance ${fx(m.var.double)}.</p><p>Quand ta mise est grosse par rapport à ta bankroll (c'est le cas aux comptes élevés si tu mises selon Kelly), une action plus risquée doit rapporter assez d'espérance pour payer ce risque.</p>`; }],
        ['L\'indice prudent', () => `<p>Un parieur Kelly maximise l'espérance du logarithme de sa bankroll. Pour une mise b et une bankroll B, l'équivalent certain d'une action vaut environ b × EV − b² × Variance ÷ (2B). L'action B est préférable à A si :</p><div class="formula">ΔEV > (b ÷ B) × ΔVariance ÷ 2</div><p>Avec un demi-Kelly, b ÷ B = ½ × avantage(TC) ÷ 1,33. À compte négatif, la mise est minimale : l'indice prudent égale l'indice EV. À compte élevé, les doubles et les splits sortent plus tard, les « rester » un peu plus tôt. C'est l'idée des indices dits risk-averse popularisés par Don Schlesinger.</p>`],
        ['Modèle contre simulation', (X) => `<p>Les indices EV de SIGMA 52 viennent d'un sabot moyen au true count donné. Pour les vérifier, SIGMA 52 tire 300 000 sabots réels épuisés à des profondeurs aléatoires, calcule l'EV exacte des deux actions sur des centaines de compositions autour de l'indice, et ajuste une droite ΔEV = a + b × TC : l'indice est le TC où elle s'annule, avec son intervalle de confiance.</p>${advTable(X, 'strip')}<p>La plupart des indices du modèle tombent dans l'intervalle de la simulation. Les écarts rappellent qu'un indice est une moyenne : près de l'indice, les deux actions valent presque la même chose, et une erreur d'un point coûte peu.</p>`],
      ],
      mistakes: ['Appliquer un indice EV max avec une mise énorme sans y penser', 'Croire qu\'un indice est exact au dixième'],
      keys: ['Doubler = environ 4 fois la variance de tirer', 'Indice prudent : ΔEV > (b/B) × ΔVar ÷ 2', 'Les indices sont des moyennes, à ±1 point près'],
      quiz: [
        { q: 'Pourquoi l\'indice prudent de 10 contre 10 (double) est-il plus élevé que l\'indice EV ?', opts: ['Le double augmente fortement la variance, à payer quand la mise est grosse', 'Parce que le croupier a un 10', 'C\'est une erreur de calcul', 'Parce que le sabot est grand'], ok: 0, why: 'L\'équivalent certain pénalise la variance supplémentaire.' },
        { q: 'À compte négatif, l\'indice prudent :', opts: ['Est très différent', 'Égale l\'indice EV (mise minimale)', 'N\'existe pas', 'Est toujours 0'], ok: 1, why: 'Avec une mise minimale, le terme de risque est négligeable.' },
      ],
    },
    {
      id: 'rampeopt', part: 'Argent', title: 'Rampe optimale, wonging et ruine sur une durée', minutes: 16,
      goals: ['Calculer la meilleure mise à chaque true count', 'Mesurer l\'apport du wonging', 'Estimer le risque sur une période donnée'],
      sections: [
        ['La meilleure mise à chaque TC', () => `<p>À chaque true count, la simulation mesure l'avantage μ(TC) et la variance v(TC) d'une main. La mise de Kelly fractionnaire y vaut :</p><div class="formula">mise(TC) = c × bankroll × μ(TC) ÷ v(TC), bornée entre 1 unité et ton écart maximal</div><p>Chaque TC est indépendant : borner chaque mise donne la meilleure rampe possible sous la contrainte. C'est ce que fait l'optimiseur de l'onglet Bankroll.</p>`],
        ['Wonging', () => `<p>Ne jouer qu'à partir d'un TC d'entrée supprime les mains perdantes : l'espérance par main jouée grimpe. Le prix : il faut observer plusieurs tables, entrer et sortir, ce qui se remarque, et beaucoup de casinos l'interdisent (« pas d'entrée en cours de sabot »). L'optimiseur compare les deux.</p>`],
        ['Ruine sur une durée', () => `<p>Le risque de ruine « sans fin » répond à : vais-je un jour tout perdre ? Sur une période T (un voyage, une saison), on modélise la bankroll comme un mouvement brownien de dérive μ et d'écart-type σ par heure :</p><div class="formula">P(ruine avant T) = Φ((−B − μT) ÷ σ√T) + e^(−2μB/σ²) × Φ((−B + μT) ÷ σ√T)</div><p>Elle est toujours inférieure au risque sans fin et monte avec la durée. P(perdant après T) = Φ(−μT ÷ σ√T) dit ce que la plupart des joueurs ressentent vraiment : la fréquence des périodes perdantes.</p>`],
      ],
      mistakes: ['Choisir une rampe à l\'instinct', 'Confondre ruine sur un voyage et ruine définitive'],
      keys: ['mise(TC) = c × B × μ(TC) ÷ v(TC), bornée', 'Wonging : plus d\'espérance par main jouée, plus visible', 'Ruine sur T heures < ruine sans fin'],
      quiz: [
        { q: 'À un TC où l\'avantage est négatif, la mise optimale est :', opts: ['La mise maximale', 'La mise minimale (ou ne pas jouer en wonging)', 'Kelly', 'Le double de la précédente'], ok: 1, why: 'μ ≤ 0 : Kelly ne mise rien, la table impose le minimum.' },
        { q: 'Le risque de ruine sur 100 heures est :', opts: ['Supérieur au risque sans fin', 'Inférieur ou égal au risque sans fin', 'Toujours nul', 'Égal à P(perdant)'], ok: 1, why: 'On ne peut pas être ruiné avant T plus souvent qu\'un jour ou l\'autre.' },
      ],
    },
  ];
  // ---------- Techniques de pointe : suivi de mélange, séquençage, carte cachée, plusieurs mains, équipe, simulations ----------
  const PL = (X, k) => (X.D.tech && X.D.tech[k]) || null;
  const TECH = [
    {
      id: 'suivi', part: 'Pratique', title: 'Suivi de mélange : principe, carte de mélange, coupe', minutes: 18,
      goals: ['Comprendre pourquoi un mélange manuel laisse de l\'information', 'Lire une carte de mélange', 'Savoir où couper'],
      sections: [
        ['Le principe', () => `<p>Un mélange manuel de casino ne mélange pas tout le sabot : le croupier prend des poignées dans des piles, les riffle, les strippe, les empile. Une poignée riche en 10 et en as reste, en grande partie, dans une même zone du nouveau sabot. Celui qui a compté chaque segment de la défausse sait donc, à peu près, où sont les zones riches.</p>`],
        ['Ce que fait chaque geste', () => `<ul><li><strong>Riffle</strong> : intercale deux paquets. Les cartes restent dans la même poignée ; l'ordre relatif de chaque moitié est conservé.</li><li><strong>Strip</strong> : prend de petits paquets sur le dessus et les empile : inverse l'ordre des paquets, pas leur contenu.</li><li><strong>Piles et poignées</strong> : décident quelles zones se mêlent entre elles. Plus les poignées sont grosses et les piles nombreuses, plus l'information se dilue.</li><li><strong>Passes</strong> : chaque passe complète supplémentaire réduit fortement ce qui reste à suivre.</li></ul>`],
        ['La carte de mélange', () => `<p>On simule des milliers de fois la procédure de ta table sur des cartes numérotées : on obtient, pour chaque zone du nouveau sabot, la part de cartes venant de chaque segment d'origine. Multipliée par le compte de chaque segment, elle donne la richesse attendue de chaque zone. C'est le principe des logiciels professionnels de suivi.</p>`],
        ['Ce que ça rapporte (simulation SIGMA 52)', (X) => { const T = PL(X, 'track'); if (!T) return ''; const r = (k) => T[k] && T[k][52]; return `<p>Sabot de 6 jeux à 75 %, segments d'un paquet, 2 paquets joués en tête après la coupe :</p><ul>${['zone2r', 'zone2rs', 'zone3', 'double', 'aleatoire'].filter(r).map((k) => `<li>${X.Shuffle ? X.Shuffle.PROCS[k].label : k} : true count moyen du début ${fx(r(k).tcTrack, 1)} (hasard ${fx(r(k).tcRand, 1)}), corrélation ${fx(r(k).corr, 2)}.</li>`).join('')}</ul><p>Contre un mélange paresseux, couper au bon endroit place régulièrement un début de sabot à true count +2 ou +3 : un avantage de plus d'un point dès les premières mains, quand un compteur ordinaire est à zéro.</p>`; }],
        ['La pratique', () => `<ol><li>Observer la procédure exacte du croupier (piles, taille des poignées, riffles, strips) sur plusieurs sabots.</li><li>La reproduire dans Techniques, procédure personnalisée, et vérifier la corrélation : sous 0,3, rien à gagner.</li><li>Compter la défausse par segments (un paquet chacun, au début).</li><li>Obtenir la coupe, ou repérer où tombe la zone riche si un autre joueur coupe.</li><li>Miser sur la zone riche en début de sabot, puis reprendre le comptage normal.</li></ol><p class="note">Les casinos répondent par des mélanges plus complets, des machines, ou en coupant eux-mêmes.</p>`],
      ],
      mistakes: ['Suivre un mélange sans l\'avoir cartographié', 'Suivre trop de segments et perdre le compte', 'Croire qu\'une machine à mélanger se suit'],
      keys: ['Riffle et strip conservent les poignées', 'Carte de mélange = où finit chaque segment', 'Corrélation faible = rien à suivre'],
      quiz: [
        { q: 'Un riffle entre deux paquets :', opts: ['Mélange tout le sabot', 'Garde les cartes dans la poignée, intercalées', 'Inverse l\'ordre des cartes', 'Détruit l\'information'], ok: 1, why: 'Les cartes restent dans la même poignée.' },
        { q: 'Une deuxième passe complète de mélange :', opts: ['Ne change rien', 'Réduit fortement l\'information suivable', 'Double l\'avantage', 'Facilite la coupe'], ok: 1, why: 'Voir la ligne « deux passes » dans la simulation.' },
      ],
    },
    {
      id: 'sequencage', part: 'Pratique', title: 'Séquençage des as et cartes clés', minutes: 12,
      goals: ['Comprendre le séquençage', 'Chiffrer la valeur d\'un as en première carte'],
      sections: [
        ['Le principe', () => `<p>Pendant le jeu, on retient la carte vue juste avant chaque as (la carte clé). Après un mélange imparfait, l'ordre local survit souvent : quand la carte clé réapparaît, l'as a une forte chance d'arriver une ou deux cartes plus tard.</p>`],
        ['Ce que vaut un as', (X) => { const F = PL(X, 'first'); if (!F) return ''; const e = F.europe; return `<p>Calcul exact (jeu européen) : avec un as en première carte, l'espérance de la main est de <strong>${sg(e[1], 1)}</strong>. Un 10 : ${sg(e[10], 1)}. Un 5 : ${sg(e[5], 1)}. Savoir qu'un as va tomber sur sa main, c'est donc miser gros sur une main très favorable.</p>`; }],
        ['Les limites', () => `<p>Il faut savoir quelle main recevra la carte : compter les cartes qui sortiront avant, parfois ouvrir ou fermer une main pour « prendre » l'as. Un seul riffle supplémentaire, ou un strip, peut casser la séquence. C'est une technique très exigeante, rarement praticable seul.</p>`],
      ],
      mistakes: ['Retenir trop de cartes clés', 'Miser sur une séquence après un mélange complet'],
      keys: ['Carte clé = la carte avant l\'as', 'As en première carte : main très favorable', 'Fragile face au moindre mélange'],
      quiz: [{ q: 'Une carte clé est :', opts: ['Un as', 'La carte vue juste avant un as', 'La carte de coupe', 'Le dernier 10'], ok: 1, why: 'Elle annonce l\'as après le mélange.' }],
    },
    {
      id: 'cartecachee', part: 'Pratique', title: 'La carte cachée : ce que vaut l\'information', minutes: 12,
      goals: ['Chiffrer la valeur de chaque niveau d\'information sur la carte du croupier', 'Connaître le cadre légal'],
      sections: [
        ['Les chiffres', (X) => { const H = PL(X, 'hole'); if (!H) return ''; const r = (k) => `<li>${X.D.presets[k].label} : sans information ${sg(H[k].none)} ; « 10 ou pas » ${sg(H[k].ten)} ; petite, moyenne, haute ${sg(H[k].three)} ; carte exacte <strong>${sg(H[k].full)}</strong>.</li>`; return `<ul>${r('europe')}${r('strip')}</ul><p class="note">Calcul exact SIGMA 52 : à chaque niveau, toutes les décisions tiennent compte de l'information, y compris après un tirage.</p>`; }],
        ['Comment jouer en connaissant la carte', () => `<p>Les décisions changent radicalement : on reste sur 12 contre un croupier qui a 16, on double des totaux faibles contre un croupier qui doit crever, on tire sur 17 quand le croupier a 20. Même une information partielle (« c'est un 10 ou pas ») vaut plusieurs points d'avantage.</p>`],
        ['Cadre', () => `<p>Une carte montrée par un croupier maladroit, vue depuis sa place sans aide, a un statut juridique qui varie selon les pays. Un appareil, un complice dans le personnel ou tout geste pour provoquer l'exposition en font une fraude. Les casinos s'en protègent avec des machines de vérification du blackjack et le jeu sans carte cachée.</p>`],
      ],
      mistakes: ['Jouer la stratégie de base en connaissant la carte cachée', 'Confondre observation et fraude'],
      keys: ['Carte exacte : de l\'ordre de +10 % d\'avantage', '« 10 ou pas » vaut déjà plusieurs points', 'Appareil ou complice = fraude'],
      quiz: [{ q: 'L\'information « la carte cachée est un 10 ou non » :', opts: ['Ne vaut rien', 'Vaut plusieurs points d\'avantage', 'Vaut autant que la carte exacte', 'Est interdite partout'], ok: 1, why: 'Voir le tableau : elle fait passer le jeu nettement en positif.' }],
    },
    {
      id: 'plusieursmains', part: 'Argent', title: 'Jouer plusieurs mains', minutes: 10,
      goals: ['Comprendre la corrélation entre deux mains', 'Savoir quand jouer deux mains'],
      sections: [
        ['Corrélation', () => `<p>Deux mains contre le même croupier gagnent et perdent souvent ensemble : leur corrélation est positive : SIGMA 52 mesure environ +0,37 sur des centaines de millions de tours (valeur souvent arrondie à 0,5 dans les livres). La variance de deux mains de m unités vaut 2 × v × m² × (1 + ρ) : moins qu'une seule main de 2m (4 × v × m²).</p>`],
        ['Quand', () => `<p>À compte élevé, Kelly demande une grosse mise ; la table plafonne la mise par main. Jouer deux mains permet d'engager plus pour un risque moindre, et de voir plus de cartes favorables. À compte neutre ou négatif, deux mains doublent les pertes. L'optimiseur de l'onglet Bankroll choisit une ou deux mains à chaque true count à partir des simulations de référence.</p>`],
      ],
      mistakes: ['Jouer deux mains à compte négatif', 'Ignorer que deux mains mangent plus de cartes (le sabot dure moins de tours)'],
      keys: ['ρ ≈ +0,37 entre deux mains (mesuré)', '2 mains de m < 1 main de 2m en risque', 'Deux mains seulement à compte favorable'],
      quiz: [{ q: 'Deux mains de 5 unités, comparées à une main de 10 :', opts: ['Même risque', 'Moins de risque', 'Plus de risque', 'Moins d\'espérance à avantage égal'], ok: 1, why: '2 × 25 × (1 + ρ) < 100 tant que ρ < 1.' }],
    },
    {
      id: 'equipe', part: 'Pratique', title: 'Jeu en équipe : compteurs et gros joueur', minutes: 10,
      goals: ['Comprendre le modèle compteurs + gros joueur', 'Évaluer son espérance'],
      sections: [
        ['Le modèle', () => `<p>Des compteurs jouent la mise minimale à plusieurs tables. Quand l'une devient favorable, ils appellent par un signal discret un gros joueur, qui arrive et mise gros sans écart de mises visible. Il ne joue qu'aux comptes favorables : c'est du wonging réparti sur plusieurs tables.</p>`],
        ['L\'espérance', () => `<p>Elle dépend de la part des tours au-dessus du TC d'appel, du nombre de tables surveillées et de la mise du gros joueur. Le calculateur de l'onglet Techniques l'évalue à partir des simulations de référence.</p>`],
        ['Les risques', () => `<p>Signaux repérés, partage des gains, confiance, coordination. Les équipes célèbres ont été exclues de nombreux casinos.</p>`],
      ],
      mistakes: ['Sous-estimer le temps de déplacement entre les tables', 'Oublier l\'espérance négative des compteurs à mise minimale'],
      keys: ['Le gros joueur ne joue que les tables chaudes', 'Plus de tables surveillées = plus de tours favorables'],
      quiz: [{ q: 'Le gros joueur d\'une équipe :', opts: ['Compte lui-même tout le sabot', 'Ne joue qu\'aux tables appelées, à compte favorable', 'Mise le minimum', 'Change de système'], ok: 1, why: 'Il n\'a pas d\'écart de mises visible.' }],
    },
    {
      id: 'simulations', part: 'Mathématiques', title: 'Lire une simulation : précision, SCORE, référence', minutes: 12,
      goals: ['Savoir combien de mains il faut', 'Lire les résultats du Simulateur'],
      sections: [
        ['Précision', () => `<p>L'erreur type d'un avantage simulé vaut σ ÷ √N, avec σ ≈ 1,15 par main. Pour un avantage à ±0,01 point (95 %), il faut environ (1,96 × 1,15 ÷ 0,0001)² ≈ 500 millions de mains. D'où les simulations de référence de SIGMA 52 : des milliards de mains au total.</p>`],
        ['Ce qu\'on mesure', () => `<p>Par true count : la fréquence, l'avantage et la variance d'une main à mise fixe. De là se calculent la meilleure rampe, le SCORE, N0 et le risque de ruine de n'importe quelle rampe, sans relancer de simulation.</p>`],
        ['Ta propre simulation', () => `<p>L'onglet Simulateur lance des simulations sur tous les cœurs de ton appareil (système, pénétration, joueurs, deux mains, indices, wonging). Quelques dizaines de millions de mains suffisent pour comparer des configurations à quelques centièmes de point près.</p>`],
      ],
      mistakes: ['Conclure sur 100 000 mains simulées', 'Comparer des simulations aux rampes différentes'],
      keys: ['Erreur ∝ 1 ÷ √N', '≈ 500 M de mains pour ±0,01 point', 'Mesurer par TC, puis calculer les rampes'],
      quiz: [{ q: 'Pour diviser l\'erreur d\'une simulation par 10, il faut :', opts: ['10 fois plus de mains', '100 fois plus de mains', '2 fois plus', 'Une autre rampe'], ok: 1, why: 'Erreur ∝ 1/√N.' }],
    },
  ];
  const REAL = [{
    id: 'tablereelle', part: 'Pratique', title: 'Avant de compter : cette table est-elle comptable ?', minutes: 10,
    goals: ['Reconnaître un mélangeur continu', 'Estimer la pénétration', 'Lire les règles qui changent tout'],
    sections: [
      ['Le type de mélange décide de tout', () => `<ul><li><strong>Mélangeur continu (CSM)</strong> : les cartes jouées repartent dans la machine à chaque tour, souvent sous tes yeux. Le compte ne se forme jamais : compter ne rapporte rien. Seule la stratégie de base limite la perte.</li><li><strong>Machine à mélanger par sabot</strong> : un sabot complet est mélangé pendant que l'autre est joué. Le comptage fonctionne normalement ; le suivi de mélange, non.</li><li><strong>Mélange à la main</strong> : comptage normal, suivi de mélange parfois possible.</li></ul>`],
      ['La pénétration', () => `<p>C'est la part du sabot distribuée avant le mélange. Regarde où le croupier place la carte de coupe, ou la hauteur de la défausse au moment du mélange : un tiers du sabot non joué, c'est 67 % ; un quart, 75 %. Les simulations de SIGMA 52 montrent que le comptage dépend surtout de ce chiffre : sur le jeu européen, passer de 75 % à 83 % multiplie le SCORE par près de quatre.</p>`],
      ['Les règles qui comptent', (X) => { const P = X.D.presets, rc = Object.fromEntries((X.D.ruleCosts?.rows || []).map(([l, v]) => [l, v])), g = (k) => (rc[k] !== undefined ? fr(rc[k] * 100, 2) + ' point' : '—'); return `<ul><li>Blackjack payé 6:5 : ${g('Blackjack payé 6:5')} de plus pour la maison. Rédhibitoire.</li><li>Croupier qui tire sur soft 17 : ${g('Croupier tire sur soft 17')}.</li><li>Jeu sans carte cachée, toutes mises perdues : ${g('Sans carte cachée (européen), toutes mises perdues, sans abandon')}.</li><li>Double limité à 9, 10, 11 : ${g('Double sur 9, 10, 11 seulement')}.</li></ul><p>Jeu européen courant : ${pc(P.europe.edge, 2)} pour la maison avec une stratégie parfaite ; sabot de 6 « Strip » : ${pc(P.strip.edge, 2)}.</p>`; }],
      ['La méthode', () => `<ol><li>Relève, sans rien noter à la table : type de mélange, règles affichées, mise minimale et maximale, nombre de joueurs.</li><li>Observe deux ou trois mélanges pour estimer la pénétration.</li><li>Entre la table dans <strong>Mes tables</strong> : verdict, gain par heure en théorie et avec ton niveau mesuré.</li><li>Ne compte que là où le verdict est « À compter ». Ailleurs : stratégie de base, mise minimale, ou pas de jeu.</li></ol>`],
    ],
    mistakes: ['Compter à une table à mélangeur continu', 'Ignorer la pénétration', 'Jouer une table 6:5'],
    keys: ['Mélangeur continu = compter ne sert à rien', 'La pénétration fait le gain', 'Relever, puis décider dans Mes tables'],
    quiz: [
      { q: 'À une table avec mélangeur continu, le comptage :', opts: ['Rapporte un peu', 'Ne rapporte rien', 'Rapporte plus', 'Est interdit'], ok: 1, why: 'Les cartes reviennent dans la machine à chaque tour : le compte reste à zéro.' },
      { q: 'Un quart du sabot n\'est jamais joué : la pénétration est de', opts: ['25 %', '50 %', '75 %', '100 %'], ok: 2, why: 'Trois quarts du sabot sont distribués avant le mélange.' },
    ],
  }];
  // Rangement par parties et insertion des compléments à leur place logique.
  const PART = { cadre: 'Bases', regles: 'Bases', tables: 'Bases', croupier: 'Bases', dures: 'Stratégie', souples: 'Stratégie', paires: 'Stratégie', abandon: 'Stratégie', memoriser: 'Stratégie', pourquoi: 'Comptage', hilo: 'Comptage', truecount: 'Comptage', indices: 'Comptage', mises: 'Argent', variance: 'Argent', discretion: 'Pratique', session: 'Pratique', mythes: 'Pratique' };
  for (const m of MODULES) m.part = PART[m.id] || 'Pratique';
  const insAfter = (id, ms) => { const i = MODULES.findIndex((m) => m.id === id); MODULES.splice(i + 1, 0, ...ms); };
  const get = (id) => MORE.find((m) => m.id === id);
  insAfter('indices', ['systemes', 'desequilibres', 'multiniveaux', 'choisir'].map(get));
  insAfter('variance', ['probas', 'esperance', 'retrait', 'kellymaths', 'ruinemaths'].map(get));
  insAfter('mythes', ['audela', 'histoire'].map(get));
  insAfter('ruinemaths', [ADV[0]]);
  insAfter('variance', [ADV[1]]);
  insAfter('rampeopt', [TECH[3]]);
  insAfter('prudents', [TECH[5]]);
  insAfter('session', [REAL[0]]);
  insAfter('audela', [TECH[0], TECH[1], TECH[2], TECH[4]]);
  const PARTS = ['Bases', 'Stratégie', 'Comptage', 'Systèmes', 'Argent', 'Mathématiques', 'Pratique'];
  for (const id of ['variance', 'mises']) { const m = MODULES.find((x) => x.id === id); m.part = 'Argent'; }

  const BJCourse = { MODULES, PARTS, rowLabel, upName, ACTFR, fr, pc, sg };
  if (typeof module !== 'undefined' && module.exports) module.exports = BJCourse; else root.BJCourse = BJCourse;
})(typeof window !== 'undefined' ? window : globalThis);
