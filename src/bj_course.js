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

  const BJCourse = { MODULES, rowLabel, upName, ACTFR, fr, pc, sg };
  if (typeof module !== 'undefined' && module.exports) module.exports = BJCourse; else root.BJCourse = BJCourse;
})(typeof window !== 'undefined' ? window : globalThis);
