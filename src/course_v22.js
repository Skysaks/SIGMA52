// Cours — modules v22 : les derniers manques face aux formations du marché.
// Niveau 2 : petites mises. Niveau 3 : face au check-raise, blind contre blind après le flop, cash avec ante ou straddle,
// protection et déni d'équité, re-entry et add-on, jeux à tirage. Niveau 4 : lire la carte du turn, jeux-jouets.
// Chiffres : équités exactes du moteur SIGMA 52 (src/runout.js, toutes les rivers énumérées) avec les charts de référence
// (ouverture BTN contre défense BB, ouverture SB contre défense BB) ; probabilités de tirage et jeux-jouets : calcul exact.
(function (root) {
  const ex = (items) => items.map(([q, a], i) => `<details class="exo"><summary><strong>Exercice ${i + 1}.</strong> ${q}</summary><p>${a}</p></details>`).join('');
  function register(K) {
    // Lexique : termes introduits par ces modules, insérés dans l'ordre alphabétique.
    if (K.GLOSSARY && !K.GLOSSARY.some((g) => g[0] === 'Block bet')) {
      K.GLOSSARY.push(
        ['Add-on', "Dernier rachat de jetons à la fin de la période de rebuy d'un tournoi."],
        ['Badugi', "Jeu à tirage à 4 cartes : on cherche 4 cartes de couleurs et de rangs différents, as bas."],
        ['Block bet', "Petite mise (20 à 30 % du pot) faite hors de position pour fixer soi-même le prix, souvent à la river."],
        ['Bomb pot', "Coup où tout le monde mise une somme fixe avant de passer directement au flop."],
        ["Déni d'équité", "Gain obtenu quand une main qui avait de l'équité se couche face à une mise."],
        ['Indifférence', "À l'équilibre, état où deux actions d'une main mixte ont la même EV : c'est pourquoi les solveurs mélangent."],
        ['Lowball (2-7)', "Famille de jeux où la main la plus basse gagne ; en 2-7, l'as est haut et suites et couleurs comptent contre soi."],
        ['Pat (servi)', "Jeux à tirage : main qui ne tire plus aucune carte."],
        ['Range bet', "Miser avec toute sa range, en général petit, quand on a l'avantage de range sur un board statique."],
        ['Re-entry', "Nouvelle inscription au même tournoi après élimination, pendant les inscriptions tardives."],
        ['Snow', "Jeux à tirage : rester servi avec une main médiocre pour représenter une main faite."],
      );
      K.GLOSSARY.sort((a, b) => a[0].localeCompare(b[0], 'fr'));
    }
    // ================= Niveau 2 =================
    K.mod({
      id: 'petitesmises', level: 2, title: "Les petites mises : range bet, mise d'un tiers, block bet", drill: 'mdf',
      goals: ["Savoir ce qu'une petite mise demande à l'adversaire", "Reconnaître les boards où miser petit avec toute sa range", "Utiliser le block bet hors de position sans se faire exploiter"],
      sections: [
        ["Ce qu'une petite mise demande", `<p>Une mise fixe la cote de l'adversaire et sa défense minimale (MDF) :</p>
          <table class="t"><thead><tr><th>Mise</th><th class="n">Équité requise pour payer</th><th class="n">Défense minimale</th></tr></thead><tbody>
          <tr><td>25 % du pot</td><td class="n">16,7 %</td><td class="n">80 %</td></tr><tr><td>33 % du pot</td><td class="n">20 %</td><td class="n">75 %</td></tr>
          <tr><td>50 % du pot</td><td class="n">25 %</td><td class="n">67 %</td></tr><tr><td>Pot</td><td class="n">33,3 %</td><td class="n">50 %</td></tr></tbody></table>
          <p>Une petite mise oblige l'adversaire à continuer avec presque tout. Elle ne cherche pas à faire coucher les bonnes mains : elle fait payer les mauvaises, retire un peu d'équité aux mains qui abandonnent et coûte peu quand tu es battu.</p>`],
        ["Le range bet : miser petit avec toute sa range", `<p>Quand ta range domine celle de l'adversaire et que le board change peu d'une carte à l'autre, une mise d'un quart à un tiers du pot avec toute ta range est une stratégie simple et proche de l'équilibre.</p>
          <p><strong>Exemple calculé</strong> : ouverture du bouton contre défense de la grosse blinde, flop K♠7♦2♣. Équité exacte du bouton : <strong>52,7 %</strong>, et elle reste entre 51,3 % et 53,8 % quelle que soit la carte du turn. Board sec, statique, favorable au relanceur (plus de rois forts) : petite mise fréquente.</p>
          <p><strong>Contre-exemple</strong> : même situation sur 9♥8♥6♣. Équité du bouton : <strong>49,9 %</strong>. Plus d'avantage de range, beaucoup de mains fortes chez la grosse blinde (suites, deux paires, brelans) : on mise moins souvent, et plus gros avec une range plus polarisée.</p>`],
        ["Le block bet hors de position", `<p>À la river, hors de position, avec une main moyenne qui veut voir l'abattage, une petite mise (20 à 30 % du pot) fixe toi-même le prix. Si tu checkes, l'adversaire en position peut miser gros et te poser une décision difficile ; avec un block bet, il paie avec ses mains moins bonnes et ne relance qu'avec ses mains fortes ou ses bluffs.</p>
          <ul><li><strong>Contre un joueur passif</strong> : le block bet rapporte (il paie avec pire, il relance rarement en bluff).</li>
          <li><strong>Contre un régulier agressif</strong> : prudence, une petite mise hors de position appelle des relances en bluff. Mélange-la avec des mains fortes, sinon elle annonce une main moyenne.</li></ul>`],
        ["Quand ne pas miser petit", `<ul><li><strong>Range polarisée</strong> (très fort ou bluff) : la grosse mise rapporte plus (module Ranges polarisées).</li>
          <li><strong>Board humide avec beaucoup de tirages</strong> : une petite mise donne une très bonne cote aux tirages (module Protection).</li>
          <li><strong>Contre une calling station</strong> avec une main de valeur : elle paie gros comme petit, mise gros.</li>
          <li><strong>Profondeur faible</strong> : à SPR bas, deux grosses mises mettent tapis plus simplement.</li></ul>`],
        ["Exercices corrigés", ex([
          ["Tu mises 2 bb dans un pot de 6 bb. Quelle équité faut-il à l'adversaire pour payer, et quelle part de sa range doit continuer pour que ton bluff ne gagne pas automatiquement ?", "Équité : 2 ÷ (6 + 2 + 2) = <strong>20 %</strong>. Défense minimale : 6 ÷ (6 + 2) = <strong>75 %</strong>. Une petite mise fait continuer presque toute sa range : elle sert à la valeur fine et au déni d'équité, pas à faire coucher."],
          ["River, pot de 12 bb, tu es hors de position avec une paire moyenne. Tu mises 3 bb. Quelle cote reçoit l'adversaire, et pourquoi c'est utile contre un joueur passif ?", "Il paie 3 pour un pot final de 18 : <strong>16,7 %</strong>. Il paiera avec beaucoup de mains moins bonnes et ne relancera presque qu'avec mieux : tu gagnes de la valeur et tu évites une grosse mise de sa part quand tu checkes."],
          ["Bouton contre grosse blinde : sur quel flop mises-tu petit avec toute ta range, K♠7♦2♣ ou 9♥8♥6♣ ?", "K♠7♦2♣ : le bouton y a 52,7 % d'équité et un board statique (de 51,3 % à 53,8 % selon le turn). Sur 9♥8♥6♣, il n'a que 49,9 % et la grosse blinde a plus de mains très fortes : on mise moins souvent, plus gros, avec une range sélectionnée."],
        ])],
      ],
      mistakes: ["Miser petit sur un board humide avec une main vulnérable", "Miser petit avec une range polarisée", "Utiliser le block bet uniquement avec des mains moyennes contre un joueur qui relance", "Croire qu'une petite mise doit faire coucher"],
      keys: ["⅓ pot : 20 % requis, 75 % de défense", "Range bet : avantage de range + board statique", "Block bet : fixer le prix hors de position, surtout contre les passifs", "Polarisé ou board humide : mise plus grosse"],
      quiz: [
        ["Mise d'un tiers du pot : équité requise pour payer ?", ["20 %", "33 %", "25 %", "10 %"], 0, "1 ÷ (3 + 1 + 1) = 20 %."],
        ["Défense minimale face à une mise d'un quart du pot ?", ["80 %", "50 %", "67 %", "60 %"], 0, "Pot ÷ (pot + mise) = 4 ÷ 5."],
        ["Le range bet à petite taille convient surtout…", ["Sur un board sec et statique où ta range domine", "Sur un board très connecté", "Avec une range polarisée", "Contre une calling station avec les nuts"], 0, "Avantage de range et peu de changements d'une carte à l'autre."],
        ["Un block bet sert à…", ["Fixer toi-même un petit prix hors de position avec une main moyenne", "Faire coucher les nuts", "Bluffer un joueur qui ne se couche jamais", "Mettre tapis plus vite"], 0, "Tu évites une grosse mise adverse et tu fais payer pire."],
        ["Contre une calling station, avec une main de valeur…", ["Mise gros", "Mise petit pour qu'elle paie", "Checke", "Block bet"], 0, "Elle paie gros comme petit : la grosse mise rapporte plus."],
      ],
    });

    // ================= Niveau 3 =================
    K.mod({
      id: 'face_xr', level: 3, title: "Face au check-raise : payer, relancer, abandonner", drill: 'mdf',
      goals: ["Lire ce que représente un check-raise au flop", "Calculer la cote et la défense face à la relance", "Choisir les mains qui continuent, et le plan au turn"],
      sections: [
        ["Ce que dit un check-raise", `<p>Quand tu as relancé avant le flop et misé au flop, un check-raise de l'adversaire est en général <strong>polarisé</strong> : mains très fortes (deux paires, brelans, suites) et tirages ou bluffs, avec peu de mains moyennes (celles-ci paient ou se couchent). Ta réponse dépend donc de deux choses : ta cote, et la part de ta main contre les deux moitiés de sa range.</p>`],
        ["La cote et la défense", `<p><strong>Exemple</strong> : pot de 5,5 bb (ouverture du bouton, call de la grosse blinde). Tu mises 1,8 bb (un tiers), la grosse blinde relance à 6 bb.</p>
          <ul><li>Pour payer : 4,2 bb dans un pot final de 17,5 bb, soit <strong>24 %</strong> d'équité requise.</li>
          <li>Sa relance risque 6 bb pour gagner 7,3 bb (le pot et ta mise) : elle est rentable en bluff pur si tu te couches plus de 6 ÷ 13,3 = <strong>45 %</strong> du temps. Tu dois donc continuer avec environ <strong>55 %</strong> des mains avec lesquelles tu as misé.</li></ul>
          <p>Ce chiffre est un repère, pas une obligation : si ta mise d'un tiers contenait toute ta range, beaucoup de mains sans équité se couchent sans regret. Aux micro-limites, les check-raises sont souvent moins bluffés que l'équilibre : on peut se coucher davantage, sauf contre un joueur repéré comme agressif.</p>`],
        ["Qui continue", `<table class="t"><thead><tr><th>Catégorie</th><th>Plan par défaut</th></tr></thead><tbody>
          <tr><td>Nuts et quasi-nuts (brelan, deux paires hautes)</td><td>Relance (3-bet) pour la valeur, ou call pour garder ses bluffs</td></tr>
          <tr><td>Top paire bon kicker, overpair</td><td>Call, puis on réévalue au turn</td></tr>
          <tr><td>Gros tirages (couleur max, tirage + overcards)</td><td>Call, parfois 3-bet en semi-bluff</td></tr>
          <tr><td>Paire moyenne, petit tirage</td><td>Selon la cote et l'adversaire : souvent fold contre un joueur serré</td></tr>
          <tr><td>Hauteur sans tirage</td><td>Fold</td></tr></tbody></table>`],
        ["Au turn, après avoir payé", `<ul><li>L'adversaire mise souvent à nouveau : ses mains fortes pour la valeur, ses tirages pour la fold equity.</li>
          <li>Une carte qui complète les tirages <strong>réduit</strong> la part de bluffs de sa range ; une carte blanche la laisse intacte.</li>
          <li>Avec une main moyenne, prévois avant de payer au flop ce que tu feras au turn : payer le flop pour te coucher au turn sur une carte blanche est la ligne la plus chère.</li></ul>`],
        ["Exercices corrigés", ex([
          ["Pot 6 bb, tu mises 3 bb, il relance à 10 bb. Quelle équité te faut-il pour payer ?", "Tu paies 7 bb pour un pot final de 6 + 3 + 10 + 7 = 26 bb : <strong>27 %</strong>. Plus la relance est grosse par rapport à ta mise, plus ta cote se dégrade."],
          ["Bouton contre grosse blinde sur K♠7♦2♣ : tu as misé un tiers avec A♦Q♣, check-raise. Que fais-tu ?", "Fold le plus souvent : hauteur as sans tirage (board arc-en-ciel, aucune quinte possible avec A-Q), et ses relances contiennent beaucoup de rois et de brelans. Tes mains qui continuent sont les rois, les overpairs, les brelans ; tu ne défends pas « au minimum » avec des mains à 20 % d'équité contre sa range de relance."],
          ["Sur 9♥8♥6♣, tu as A♥K♥ et la grosse blinde relance ta mise. Plan ?", "Continue : tirage couleur max plus deux overcards, beaucoup d'équité même contre ses mains fortes. Call, ou 3-bet en semi-bluff si tu veux lui faire coucher ses tirages plus faibles et ses paires. C'est le type de main qui protège ta range de continuation."],
        ])],
      ],
      mistakes: ["Payer au flop sans plan pour le turn", "Défendre la MDF avec des mains sans équité", "Ne jamais relancer avec les nuts (range de continuation trop faible et lisible)", "Ignorer que la population micro-limites bluffe peu ses check-raises au turn et à la river"],
      keys: ["Check-raise = range polarisée", "Exemple : 4,2 bb à payer dans 17,5 bb, 24 %", "Défense ≈ 1 − risque ÷ (risque + gain) de sa relance, à ajuster par la population", "Continuer : valeur, gros tirages ; abandonner : hauteur sèche"],
      quiz: [
        ["Un check-raise au flop est en général…", ["Polarisé : mains fortes et tirages ou bluffs", "Composé de mains moyennes", "Toujours un bluff", "Toujours les nuts"], 0, "Les mains moyennes paient ou se couchent ; la relance regroupe les extrêmes."],
        ["Pot 5,5 bb, mise 1,8 bb, relance à 6 bb. Équité requise pour payer ?", ["≈ 24 %", "≈ 33 %", "≈ 45 %", "≈ 12 %"], 0, "4,2 ÷ 17,5."],
        ["Avec un tirage couleur max et deux overcards face au check-raise…", ["Continue (call ou 3-bet)", "Fold", "Toujours tapis", "Fold sauf aux nuts"], 0, "Grosse équité contre toute sa range."],
        ["Une carte du turn qui complète les tirages…", ["Réduit la part de bluffs de sa range", "Augmente ses bluffs", "Ne change rien", "Rend tes mains moyennes plus fortes"], 0, "Ses tirages sont devenus des mains faites : moins de bluffs."],
        ["Aux micro-limites, face aux check-raises au turn et à la river…", ["On peut se coucher un peu plus que l'équilibre", "Il faut payer plus", "Il faut relancer en bluff", "Il faut tout payer"], 0, "Ces lignes sont souvent sous-bluffées par la population (vérifie dans Analyse › Population)."],
      ],
    });

    K.mod({
      id: 'bvb_post', level: 3, title: "Blind contre blind après le flop", drill: 'situations',
      goals: ["Comprendre pourquoi les pots entre blindes se jouent avec des ranges très larges", "Choisir quand la petite blinde mise et quand elle checke", "Jouer la grosse blinde en position contre une petite blinde qui checke"],
      sections: [
        ["Deux ranges larges, une position", `<p>Quand tout le monde se couche jusqu'à la petite blinde, elle ouvre large (chart SIGMA 52 : <strong>39,7 %</strong> des mains à 3 bb) et la grosse blinde défend large (<strong>41,2 %</strong> en call). Pot au flop : 6 bb, tapis restants 97 bb, SPR ≈ 16. La grosse blinde a l'avantage de la position pendant tout le coup : la petite blinde parle la première à chaque rue.</p>`],
        ["Quels flops favorisent qui", `<p>Équité exacte de la petite blinde (ouverture contre défense de la grosse blinde) :</p>
          <table class="t"><thead><tr><th>Flop</th><th class="n">Équité SB</th><th>Lecture</th></tr></thead><tbody>
          <tr><td>A♥9♥3♣</td><td class="n">60,1 %</td><td>Plus d'as forts chez la SB (la BB 3-bette souvent ses meilleurs as) : mise fréquente</td></tr>
          <tr><td>K♠7♦2♣</td><td class="n">55,7 %</td><td>Avantage net : petite mise fréquente</td></tr>
          <tr><td>8♠6♦4♣</td><td class="n">49,4 %</td><td>Plus d'avantage : la SB checke beaucoup</td></tr></tbody></table>
          <p>La règle générale tient : les flops hauts favorisent celui qui a relancé, les flops bas et connectés neutralisent cet avantage.</p>`],
        ["La petite blinde : miser ou checker", `<ul><li>Sur les flops hauts et secs : petite mise (un tiers) avec une grande partie de la range.</li>
          <li>Sur les flops bas et connectés : beaucoup de checks, <strong>avec des mains fortes dans les checks</strong> (overpairs, deux paires), sinon la grosse blinde attaque chaque check sans risque.</li>
          <li>Hors de position, préfère les mains qui réalisent bien leur équité (paires, tirages forts) pour continuer ; les hauteurs faibles abandonnent vite.</li></ul>`],
        ["La grosse blinde : profiter de la position", `<ul><li>Quand la petite blinde checke, mise souvent petit : sa range de check est plus faible et elle doit défendre hors de position.</li>
          <li>Face à une petite mise de la SB, défends large (20 % requis face à un tiers du pot) ; relance avec tes mains fortes et tes meilleurs tirages, surtout sur les flops bas qui t'avantagent.</li>
          <li>En pot limpé (la SB complète), relance tes bonnes mains avant le flop et mise petit après le flop sur les boards qui te conviennent.</li></ul>
          <p>Les tendances de ta population (fold de la SB au flop, c-bet de la SB) se mesurent dans <strong>Analyse › Population et fuites</strong> : appuie tes ajustements sur tes mains, pas sur une impression.</p>`],
        ["Exercices corrigés", ex([
          ["La SB mise 2 bb dans le pot de 6 bb. Quelle équité faut-il à la BB pour payer ?", "2 ÷ (6 + 2 + 2) = <strong>20 %</strong>. Avec des ranges aussi larges, la BB continue avec la majorité de ses mains, d'autant qu'elle est en position."],
          ["SB contre BB : sur quel flop la SB mise-t-elle le plus souvent, K♠7♦2♣ ou 8♠6♦4♣ ?", "K♠7♦2♣ : 55,7 % d'équité exacte pour la SB, contre 49,4 % sur 8♠6♦4♣. Sur le flop bas et connecté, la SB checke beaucoup et protège ses checks avec des mains fortes."],
          ["Tu es en BB avec 7♣5♣ sur 8♠6♦4♣, la SB checke. Plan ?", "Tu as la quinte max (4-5-6-7-8) : mise pour la valeur, et plutôt gros sur ce board où beaucoup de mains de la SB (overpairs, paires, tirages) paient. La position et la force de ta main te permettent de construire le pot sur trois rues."],
        ])],
      ],
      mistakes: ["Jouer la SB comme une ouverture du bouton (elle est hors de position)", "Ne mettre que des mains faibles dans les checks de la SB", "Laisser la BB prendre chaque check sans défendre", "Surdéfendre la SB avec des hauteurs faibles hors de position"],
      keys: ["SB 39,7 % contre BB 41,2 % : deux ranges larges", "Flops hauts : avantage SB ; bas et connectés : neutres", "Checks de la SB protégés par des mains fortes", "BB : attaquer les checks, défendre large en position"],
      quiz: [
        ["Dans un pot blind contre blind, qui a la position après le flop ?", ["La grosse blinde", "La petite blinde", "Celui qui a relancé", "Ça dépend du flop"], 0, "La SB parle la première à chaque rue après le flop."],
        ["Équité de la SB sur K♠7♦2♣ contre la défense BB ?", ["≈ 56 %", "≈ 45 %", "≈ 50 %", "≈ 70 %"], 0, "55,7 % exact."],
        ["Sur 8♠6♦4♣, la SB…", ["Checke beaucoup, avec des mains fortes dans ses checks", "Mise toute sa range", "Se couche", "Fait tapis"], 0, "Elle n'a plus d'avantage de range."],
        ["La SB checke, la BB a une main moyenne. Par défaut…", ["Mise petit souvent", "Checke toujours", "Fait tapis", "Se couche"], 0, "La range de check de la SB est plus faible."],
        ["Où vérifier les tendances BvB de ta population ?", ["Analyse › Population et fuites", "Studio", "Mental", "Débuter"], 0, "Sur tes propres mains importées."],
      ],
    });

    K.mod({
      id: 'ante_straddle', level: 3, title: "Cash avec ante, straddle ou bomb pot", drill: 'odds',
      goals: ["Calculer ce que l'ante change au prix d'un vol", "Rejouer les positions et la profondeur avec un straddle", "Savoir aborder un bomb pot"],
      sections: [
        ["L'ante grossit le pot avant ton action", `<p>Sans ante, en 6-max, le pot avant ton ouverture vaut 1,5 bb (les blindes). Une ouverture à 2,5 bb en vol pur doit faire coucher tout le monde <strong>62,5 %</strong> du temps (2,5 ÷ (2,5 + 1,5)).</p>
          <p>Avec une ante de 0,2 bb par joueur à six, le pot vaut 1,5 + 1,2 = 2,7 bb : le même vol n'a plus besoin que de <strong>48,1 %</strong> de folds (2,5 ÷ 5,2). Conséquences :</p>
          <ul><li>On <strong>ouvre plus large</strong> à toutes les positions, surtout au bouton et au cutoff.</li>
          <li>Les blindes <strong>défendent plus large</strong> : le pot leur offre une meilleure cote.</li>
          <li>Les petites ouvertures (2 à 2,3 bb) gagnent en intérêt : le pot est déjà gros, il n'est pas nécessaire de risquer plus.</li></ul>`],
        ["Le straddle : une blinde de plus", `<p>Un straddle est une mise à l'aveugle (en général 2 bb) posée avant la distribution, souvent par le joueur sous le pistolet. Il devient la nouvelle grosse blinde : il parle en dernier avant le flop, le joueur suivant ouvre la parole.</p>
          <ul><li><strong>La profondeur se compte en straddles</strong> : 100 bb de tapis avec un straddle de 2 bb, c'est un tapis de 50 straddles. Joue comme à 50 bb : moins de mains spéculatives, plus de 3-bets et de tapis.</li>
          <li>Les ouvertures se font à 2,5 à 3 straddles (5 à 6 bb).</li>
          <li>Le straddler paie cher sa position : poser un straddle volontaire est en moyenne perdant, sauf s'il fait jouer la table plus mal.</li></ul>`],
        ["Le bomb pot", `<p>Tout le monde met une somme fixe (par exemple 2 bb), on passe directement au flop. Pas de préflop : chacun a une main au hasard, le pot est gros et multiway. Conséquences : les ranges sont toutes égales au départ, la valeur se prend avec des mains réellement fortes (deux paires et mieux souvent battues à six), les tirages aux nuts valent cher. Le Simulateur propose straddle, ante et bomb pot pour t'y entraîner.</p>`],
        ["Exercices corrigés", ex([
          ["8 joueurs, blindes 1/2 bb, ante de 0,25 bb par joueur. Ton ouverture à 3 bb en vol pur doit faire coucher tout le monde combien de fois ?", "Pot avant ton action : 1,5 + 8 × 0,25 = 3,5 bb. Seuil : 3 ÷ (3 + 3,5) = <strong>46,2 %</strong>, contre 66,7 % sans ante (3 ÷ 4,5)."],
          ["Tapis de 100 bb, straddle de 2 bb. À quelle profondeur joues-tu réellement ?", "<strong>50 straddles</strong> : la profondeur effective est divisée par deux. Moins de set-mining et de connecteurs assortis, plus de 3-bets qui engagent le tapis."],
          ["Bomb pot à 6 joueurs, tu as top paire faible kicker au flop. Plan ?", "Prudence : à six, avec des mains au hasard, une top paire faible est souvent battue ou en danger. Contrôle le pot ; garde la grosse valeur pour les deux paires solides et mieux, et les tirages aux nuts."],
        ])],
      ],
      mistakes: ["Garder sa chart sans ante dans une partie avec ante", "Compter la profondeur en bb au lieu de straddles", "Poser des straddles volontaires « pour l'action »", "Surjouer une paire dans un bomb pot à six"],
      keys: ["Ante : pot plus gros, vols et défenses plus larges", "0,2 bb d'ante à 6 : vol à 2,5 bb rentable dès 48 % de folds", "Straddle : profondeur divisée, comptée en straddles", "Bomb pot : multiway, mains au hasard, valeur réelle seulement"],
      quiz: [
        ["Sans ante, une ouverture à 2,5 bb en vol pur doit réussir…", ["62,5 % du temps", "40 % du temps", "50 % du temps", "80 % du temps"], 0, "2,5 ÷ (2,5 + 1,5)."],
        ["Avec une ante, les blindes…", ["Défendent plus large", "Défendent moins", "Ne changent rien", "Ne défendent plus"], 0, "Le pot leur offre une meilleure cote."],
        ["100 bb avec un straddle de 2 bb : profondeur effective ?", ["50 straddles", "100 straddles", "200 straddles", "25 straddles"], 0, "100 ÷ 2."],
        ["Dans une partie avec straddle, qui parle en dernier avant le flop ?", ["Le straddler", "Le bouton", "La grosse blinde", "La petite blinde"], 0, "Le straddle est la dernière blinde."],
        ["Dans un bomb pot à six, la valeur se prend surtout avec…", ["Deux paires solides et mieux, et les tirages aux nuts", "Toute top paire", "Les hauteurs as", "Les petites paires"], 0, "À six, mains au hasard : il faut une vraie main."],
      ],
    });

    K.mod({
      id: 'protection', level: 3, title: "Protection et déni d'équité", drill: 'outs',
      goals: ["Mesurer ce qu'on gagne quand une main avec de l'équité se couche", "Distinguer protéger une main et payer pour se faire relancer", "Choisir la taille qui fait payer les tirages au mauvais prix"],
      sections: [
        ["Le déni d'équité", `<p>Quand ton adversaire a de l'équité et se couche, sa part du pot te revient. <strong>Exemple calculé</strong> : T♠T♦ contre A♣K♦ sur 9♥5♥3♣. Équité exacte de T-T : <strong>74,4 %</strong> ; A-K garde 25,6 % grâce à ses six outs (et quelques runners). Pot de 10 bb : à l'abattage, T-T « possède » 7,4 bb en moyenne ; si A-K se couche, il en prend 10. La mise qui fait coucher A-K rapporte 2,6 bb de plus que le check.</p>
          <p>Si tu checkes et qu'il checke derrière, il voit le turn gratuitement : une de ses six cartes tombe <strong>13,3 %</strong> du temps (6 ÷ 45).</p>`],
        ["Protéger, ce n'est pas se faire relancer", `<p>La protection a du sens contre les mains qui ont de l'équité <strong>et se couchent</strong>. Contre un gros tirage, c'est différent : T-T contre A♥K♥ sur le même board n'a plus que <strong>44,9 %</strong> (tirage couleur max plus deux overcards). Contre 7♥6♥ (couleur et quinte par les deux bouts), 43,7 %. Ces mains ne se couchent pas, elles relancent souvent : miser « pour protéger » ne les élimine pas, cela grossit un pot où tu es légèrement derrière.</p>
          <p>Contre Q♣J♣ (deux overcards, pas de tirage couleur), T-T a 70,3 % : là, faire coucher Q-J vaut de l'argent.</p>`],
        ["Qui a besoin de protection", `<ul><li><strong>Les mains moyennes vulnérables</strong> (overpair basse, top paire faible kicker sur un board humide) : elles gagnent le plus à faire coucher les overcards et les petits tirages.</li>
          <li><strong>Les nuts</strong> n'ont pas besoin de protection : elles veulent être payées.</li>
          <li><strong>Les mains très faibles</strong> ne protègent rien : elles bluffent ou abandonnent.</li></ul>`],
        ["La bonne taille", `<p>Contre un tirage couleur (environ 35 % d'équité sur deux cartes, 19 % sur une), une mise d'un tiers du pot lui donne 20 % de cote requise sur une rue : il paie avec raison. Une mise de deux tiers lui demande 28,6 %, il paie une carte au mauvais prix. Sur un board humide, une main vulnérable mise <strong>plus gros</strong>, sans aller jusqu'à la taille qui ne fait payer que les tirages forts et les mains qui la battent.</p>`],
        ["Exercices corrigés", ex([
          ["Pot 10 bb, T♠T♦ contre A♣K♦ sur 9♥5♥3♣ (74,4 %). Combien gagnes-tu en moyenne si A-K se couche plutôt que d'aller à l'abattage ?", "Abattage : 0,744 × 10 = 7,44 bb ; s'il se couche : 10 bb. Gain : <strong>2,56 bb</strong>. C'est la valeur du déni d'équité."],
          ["Turn J♠ sur 9♥5♥3♣, toujours T-T contre A♣K♦. Équité de T-T ?", "<strong>86,4 %</strong> : il reste une carte, A-K a 6 outs sur 44 (13,6 %). Chaque carte blanche augmente ta part, mais lui offrir le turn gratuitement lui donnait 13,3 % de chances de te dépasser."],
          ["Tirage couleur sur une carte : environ 19 % d'équité. Mise d'un tiers ou de deux tiers pour le faire payer au mauvais prix ?", "Un tiers lui demande 20 % : quasi indifférent. Deux tiers lui demande 28,6 % : il paie au mauvais prix (hors cotes implicites). Avec une main vulnérable sur board humide, choisis la taille plus grosse."],
        ])],
      ],
      mistakes: ["« Protéger » contre des tirages qui ont plus d'équité que toi", "Miser trop petit sur un board humide avec une main vulnérable", "Ralentir avec une main moyenne et offrir des cartes gratuites", "Vouloir protéger les nuts au lieu de les faire payer"],
      keys: ["Déni d'équité : sa part du pot te revient s'il se couche", "T-T contre A-K sur 9-5-3 : 74,4 %, contre A♥K♥ : 44,9 %", "Protection = mains moyennes vulnérables", "Board humide : taille plus grosse pour faire payer cher"],
      quiz: [
        ["T♠T♦ contre A♣K♦ sur 9♥5♥3♣ : équité de T-T ?", ["≈ 74 %", "≈ 50 %", "≈ 90 %", "≈ 60 %"], 0, "74,4 % exact."],
        ["Pot 10 bb, ton équité 74 %. Si l'adversaire se couche, tu gagnes en moyenne…", ["≈ 2,6 bb de plus qu'à l'abattage", "Rien", "10 bb de plus", "7,4 bb de moins"], 0, "10 − 7,4."],
        ["Contre A♥K♥ sur 9♥5♥3♣, T-T…", ["Est légèrement derrière (≈ 45 %)", "Est très devant", "N'a aucune chance", "Est à égalité parfaite"], 0, "Tirage couleur max + deux overcards : 44,9 % pour T-T."],
        ["Quelle main a le plus besoin de protection ?", ["Une overpair basse sur board humide", "La quinte max", "Une hauteur sept", "Un brelan max sur board sec"], 0, "Main moyenne vulnérable."],
        ["Mise de deux tiers du pot : cote requise pour l'adversaire ?", ["28,6 %", "20 %", "40 %", "16,7 %"], 0, "2 ÷ (3 + 2 + 2) = 2 ÷ 7."],
      ],
    });

    K.mod({
      id: 'reentry', level: 3, title: "Tournois : inscription tardive, re-entry, rebuy, add-on", drill: 'situations',
      goals: ["Évaluer une règle de re-entry en coût moyen et en gain attendu", "Décider d'une inscription tardive selon le tapis et la structure", "Savoir quand prendre un add-on"],
      sections: [
        ["Re-entry : juger par entrée", `<p>Si ton ROI par entrée est positif, chaque nouvelle entrée a la même espérance que la première. Ce qui change : la <strong>dépense engagée</strong> et la variance. Avec un risque p de sortir avant la fin des inscriptions et un maximum de k entrées, le nombre moyen d'entrées vaut 1 + p + p² + … (k termes).</p>
          <p><strong>Exemple</strong> : buy-in 20 € + 2 € de rake, ROI de 15 % par entrée, 40 % de risque de sortir pendant les inscriptions, 3 entrées maximum. Entrées moyennes : 1 + 0,4 + 0,16 = <strong>1,56</strong> ; dépense moyenne : 34,32 € ; gain attendu : <strong>+5,15 €</strong>. Dépense maximale : 66 €, c'est elle qui compte dans ta bankroll. L'outil <strong>Outils › Re-entry et add-on</strong> fait le calcul pour ta règle.</p>`],
        ["Quand ne pas re-entrer", `<ul><li><strong>Sous le coup du tilt</strong> : ton ROI de la nouvelle entrée n'est plus celui de tes statistiques.</li>
          <li><strong>Hors de ta bankroll</strong> : 3 entrées d'un tournoi à 22 € te font jouer, pour la bankroll, un tournoi à 66 €.</li>
          <li><strong>Tapis de départ très court en fin d'inscription</strong> : une entrée tardive à 15 bb a moins de marge de jeu (voir ci-dessous).</li></ul>`],
        ["L'inscription tardive", `<p>S'inscrire tard évite les premiers niveaux, où les erreurs des joueurs faibles rapportent pourtant aux bons joueurs, et fait démarrer avec moins de blindes. Règle pratique : arriver tard est raisonnable tant que tu démarres avec une profondeur de jeu confortable (40 bb et plus) ; à 15 à 20 bb, tu joues surtout tapis ou couché, avec moins d'avantage. L'effet exact sur le ROI dépend de la structure et du champ : traite tout chiffre précis comme une hypothèse.</p>`],
        ["Rebuy et add-on", `<p>Dans un tournoi à rebuy, on peut racheter des jetons pendant une période ; l'add-on est un dernier rachat à la fin de cette période. Compare le prix des jetons :</p>
          <ul><li>Inscription : 20 € pour 20 000 jetons, soit 1 000 jetons par euro.</li>
          <li>Add-on : 20 € pour 30 000 jetons, soit 1 500 jetons par euro : <strong>50 % moins cher</strong>.</li></ul>
          <p>Quand l'add-on vend les jetons moins cher que l'inscription, prends-le dès que tu es gagnant dans ce tournoi, surtout avec un tapis court ou moyen. Pendant la période de rebuy, beaucoup de joueurs jouent très large : resserre tes ranges de call et fais payer la valeur.</p>`],
        ["Exercices corrigés", ex([
          ["Risque de sortir pendant les inscriptions : 50 %. Maximum 2 entrées. Combien d'entrées en moyenne ?", "1 + 0,5 = <strong>1,5 entrée</strong>. Avec 3 entrées maximum : 1 + 0,5 + 0,25 = 1,75."],
          ["Inscription 10 € pour 10 000 jetons, add-on 10 € pour 10 000 jetons. Le prix des jetons est-il meilleur ?", "Identique (1 000 jetons par euro). Prends l'add-on si tu es gagnant dans ce tournoi et que ton tapis n'est pas énorme : tu achètes des jetons au même prix que l'entrée, à un moment où le champ s'est réduit."],
          ["Tu as perdu deux entrées sur des bad beats et tu veux la troisième « pour te refaire ». Que dit la règle ?", "Ton ROI dans cet état n'est plus celui de tes statistiques, et la dépense dépasse peut-être ta règle de bankroll. Fixe ton nombre d'entrées avant le tournoi et tiens-le."],
        ])],
      ],
      mistakes: ["Compter un tournoi à re-entry comme un seul buy-in dans sa bankroll", "Re-entrer sous le coup du tilt", "S'inscrire au dernier moment avec un tapis de 12 bb par habitude", "Refuser un add-on qui vend les jetons moins cher"],
      keys: ["Entrées moyennes = 1 + p + p² + …", "Gain attendu = dépense moyenne × ROI", "Bankroll : la dépense maximale compte", "Add-on : compare les jetons par euro"],
      quiz: [
        ["Risque de sortie 40 %, 3 entrées max : entrées moyennes ?", ["1,56", "3", "1,4", "2,2"], 0, "1 + 0,4 + 0,16."],
        ["Dans ta règle de bankroll, un tournoi à 22 € joué jusqu'à 3 entrées compte comme…", ["Un tournoi à 66 €", "Un tournoi à 22 €", "Un tournoi à 34 €", "Rien de plus"], 0, "La dépense maximale."],
        ["Inscription 1 000 jetons par euro, add-on 1 500 jetons par euro. L'add-on…", ["Vend les jetons moins cher : à prendre si tu es gagnant", "Est à éviter", "Est toujours perdant", "Ne compte pas"], 0, "Jetons 50 % moins chers."],
        ["Une inscription tardive à 15 bb…", ["Réduit ta marge de jeu (surtout tapis ou couché)", "Augmente toujours ton ROI", "Est interdite", "Ne change rien"], 0, "Moins de profondeur, moins d'avantage."],
        ["Re-entrer après deux bad beats « pour te refaire » est…", ["Une décision émotionnelle à éviter", "Toujours rentable", "Obligatoire", "Neutre"], 0, "Ton ROI dans cet état n'est pas ton ROI moyen."],
      ],
    });

    K.mod({
      id: 'tirage_jeux', level: 3, title: "Les jeux à tirage : 2-7 Triple Draw, Badugi, 5 cartes", drill: 'situations',
      goals: ["Connaître les règles et les classements des jeux à tirage", "Calculer ses chances de compléter une main en un, deux ou trois tirages", "Appliquer les principes de base : position, mains servies, bluff au tirage"],
      sections: [
        ["Les règles", `<ul><li><strong>2-7 Triple Draw</strong> (lowball) : 5 cartes, trois tirages, la main la plus basse gagne. L'as est haut, les suites et les couleurs comptent contre toi : la meilleure main est 7-5-4-3-2 non assortie. Se joue surtout en limit (petites mises aux deux premiers tours, grosses ensuite).</li>
          <li><strong>Badugi</strong> : 4 cartes, trois tirages. On cherche quatre cartes de <strong>couleurs et de rangs différents</strong> ; l'as est bas. Meilleure main : A-2-3-4 de quatre couleurs. Une main de quatre cartes valides (« badugi ») bat toute main de trois.</li>
          <li><strong>5 cartes tirage</strong> (hi) : un seul tirage, main la plus haute. Rare en ligne, encore jouée en partie maison.</li></ul>
          <p>Ces jeux font partie des formats mixtes (8-Game) ; l'offre est rare chez les rooms agréées en France : vérifie le lobby de ta room.</p>`],
        ["Compter ses chances", `<p>Calcul exact sur les cartes non vues (sans tenir compte des cartes jetées par les autres) :</p>
          <table class="t"><thead><tr><th>Main</th><th class="n">Outs</th><th class="n">1 tirage</th><th class="n">2 tirages</th><th class="n">3 tirages</th></tr></thead><tbody>
          <tr><td>2-7 : 2-3-4-7, tire une carte pour un 7 bas (un 5 ou un 6)</td><td class="n">8 / 47</td><td class="n">17,0 %</td><td class="n">31,5 %</td><td class="n">43,6 %</td></tr>
          <tr><td>2-7 : même main, un 8 bas accepté (5, 6 ou 8)</td><td class="n">12 / 47</td><td class="n">25,5 %</td><td class="n">45,0 %</td><td class="n">59,6 %</td></tr>
          <tr><td>Badugi : A♠2♥3♦ + une carte inutile, cherche un trèfle de 4 à K</td><td class="n">10 / 48</td><td class="n">20,8 %</td><td class="n">37,7 %</td><td class="n">51,2 %</td></tr></tbody></table>
          <p>Formule : 1 − (non-outs ÷ cartes) × (non-outs − 1 ÷ cartes − 1) × … autant de facteurs que de tirages restants.</p>`],
        ["Principes de base", `<ul><li><strong>La position compte encore plus</strong> : tu vois combien de cartes l'adversaire tire avant de décider.</li>
          <li><strong>Une main servie (« pat »)</strong> qui ne tire plus est forte au premier tirage ; une main qui tire deux cartes au dernier tour est très faible.</li>
          <li><strong>Le bluff du « snow »</strong> : rester servi avec une main médiocre pour représenter une main faite. À utiliser rarement, contre des adversaires qui tirent encore plusieurs cartes.</li>
          <li><strong>Démarrer avec des cartes basses et fluides</strong> en 2-7 (2, 3, 4, 5, 7), sans paires ni cartes qui font suite ensemble ; en Badugi, les cartes basses de couleurs différentes.</li></ul>`],
        ["Exercices corrigés", ex([
          ["2-7, tu tiens 2-3-4-7 et tu tires une carte, deux tirages restants. Chances d'un 7 bas ?", "8 outs (quatre 5 et quatre 6) sur 47 : 1 − (39 ÷ 47) × (38 ÷ 46) = <strong>31,5 %</strong>."],
          ["Badugi, tu as A♠2♥3♦ et une carte inutile, trois tirages. Chances de compléter ?", "10 outs (les trèfles de 4 à K) sur 48 : 1 − (38 ÷ 48) × (37 ÷ 47) × (36 ÷ 46) = <strong>51,2 %</strong>."],
          ["2-7 : pourquoi 3-4-5-6-7 n'est-elle pas une bonne main ?", "C'est une <strong>suite</strong> : en 2-7, les suites comptent contre toi, et cette main vaut moins que la plus haute des mains sans paire. La bonne main basse évite les rangs consécutifs et les couleurs."],
        ])],
      ],
      mistakes: ["Jouer l'as comme carte basse en 2-7", "Garder une suite ou une couleur en 2-7", "Tirer deux cartes au dernier tour comme si la main était encore vivante", "Bluffer en restant servi contre un adversaire qui est déjà servi"],
      keys: ["2-7 : as haut, suites et couleurs contre toi, meilleure main 7-5-4-3-2", "Badugi : 4 couleurs et 4 rangs différents, as bas", "Chances = 1 − produit des probabilités de rater", "Position : voir les tirages adverses avant de décider"],
      quiz: [
        ["En 2-7 Triple Draw, la meilleure main est…", ["7-5-4-3-2 non assortie", "A-2-3-4-5", "2-3-4-5-6", "A-K-Q-J-T"], 0, "As haut, suites et couleurs comptent contre toi."],
        ["En Badugi, une main de quatre cartes valides…", ["Bat toute main de trois cartes", "Perd contre trois cartes basses", "N'existe pas", "Vaut une paire"], 0, "Le nombre de cartes valides passe avant les rangs."],
        ["8 outs sur 47, un seul tirage :", ["≈ 17 %", "≈ 31 %", "≈ 44 %", "≈ 8 %"], 0, "8 ÷ 47."],
        ["Badugi, 10 outs sur 48, trois tirages :", ["≈ 51 %", "≈ 21 %", "≈ 38 %", "≈ 75 %"], 0, "1 − (38/48)(37/47)(36/46)."],
        ["Le « snow » consiste à…", ["Rester servi avec une main médiocre pour représenter une main faite", "Tirer cinq cartes", "Se coucher au premier tirage", "Jouer sans regarder"], 0, "Un bluff propre aux jeux à tirage."],
      ],
    });

    // ================= Niveau 4 =================
    K.mod({
      id: 'turncard', level: 4, title: "Lire la carte du turn : qui elle aide, que faire", drill: 'situations',
      goals: ["Classer une carte du turn : surcarte, carte qui paire, carte qui connecte, carte de couleur", "Mesurer le déplacement d'équité et de nuts entre les deux ranges", "Décider de continuer ou de ralentir selon la carte et ta main"],
      sections: [
        ["Pourquoi le turn décide", `<p>Au turn, le pot est déjà gros et une carte peut faire basculer l'avantage. Deux questions avant de miser à nouveau : <strong>la carte aide-t-elle ma range ou la sienne ?</strong> et <strong>qui a gagné des mains très fortes (des nuts) ?</strong> L'outil <strong>Outils › Cartes du turn</strong> calcule l'équité exacte des deux ranges pour chacun des 49 turns.</p>`],
        ["Un board statique", `<p>Ouverture du bouton contre défense de la grosse blinde, flop K♠7♦2♣. Équité exacte du bouton au flop : <strong>52,7 %</strong>. Quel que soit le turn, elle reste entre <strong>51,3 %</strong> (un 9) et <strong>53,8 %</strong> (un as). Sur un tel board, la carte change peu l'avantage : ta décision au turn dépend surtout de ta main (valeur, tirage, abattage), pas de la carte.</p>`],
        ["Un board dynamique", `<p>Même situation sur 9♥8♥6♣ : <strong>49,9 %</strong> pour le bouton au flop.</p>
          <table class="t"><thead><tr><th>Turn</th><th class="n">Équité du bouton</th><th class="n">Part de nuts de la BB</th><th>Lecture</th></tr></thead><tbody>
          <tr><td>As</td><td class="n">52,1 %</td><td class="n">≈ 12 %</td><td>Surcarte : le relanceur a plus d'as forts</td></tr>
          <tr><td>Dame</td><td class="n">51,0 %</td><td class="n">≈ 11 %</td><td>Surcarte : avantage au relanceur</td></tr>
          <tr><td>2, 3, 4</td><td class="n">≈ 50 %</td><td class="n">≈ 9 %</td><td>Cartes blanches : peu de changement</td></tr>
          <tr><td>10</td><td class="n">48,1 %</td><td class="n">≈ 17 %</td><td>Complète des suites : avantage au défenseur</td></tr>
          <tr><td>7</td><td class="n">47,5 %</td><td class="n">≈ 20 %</td><td>Complète beaucoup de suites : le défenseur double sa part de nuts</td></tr></tbody></table>
          <p>Part de nuts : combos de la range au-dessus de 80 % d'équité. Le joueur dont cette part monte peut miser gros ; celui qui la perd ralentit.</p>`],
        ["La méthode en quatre questions", `<ol><li><strong>Famille de la carte</strong> : surcarte, carte qui paire le board, carte qui connecte, carte de couleur, carte blanche.</li>
          <li><strong>Équité</strong> : qui gagne des points ? (outil Cartes du turn)</li>
          <li><strong>Nuts</strong> : qui gagne des mains très fortes ?</li>
          <li><strong>Ta main</strong> : est-elle de la valeur, un tirage qui veut de la fold equity, ou une main d'abattage ? Une main d'abattage checke sur les cartes qui aident l'adversaire ; un bon tirage peut continuer ; la valeur forte continue sur presque toutes les cartes.</li></ol>`],
        ["Exercices corrigés", ex([
          ["Bouton contre grosse blinde, flop 9♥8♥6♣, tu as misé avec A♠K♦ (deux overcards). Turn 7♣. Deuxième mise ?", "Plutôt check. Le 7 est la pire carte pour ta range (47,5 % d'équité, part de nuts de la BB ≈ 20 %), et ta main n'a que six outs pour une paire qui ne gagnera pas toujours. Sur un as ou une dame, tu aurais touché ta paire et ta range aurait progressé."],
          ["Sur K♠7♦2♣, ton équité de range varie de 51,3 % à 53,8 % selon le turn. Qu'en déduis-tu pour ta stratégie ?", "Le board est <strong>statique</strong> : la carte du turn change peu de choses, ta décision repose sur ta main. Valeur et bons tirages continuent, les mains sans équité abandonnent la plupart du temps."],
          ["Turn qui paire le board (7♣ sur K♠7♦2♣). Qui gagne des nuts ?", "Les deux un peu : les 7 deviennent des brelans, les paires de rois des doubles paires. Calcul exact : la part de nuts du bouton passe à environ 24 % et celle de la BB à environ 20 à 23 % selon la couleur du 7. Les cartes qui pairent le board rapprochent souvent les deux ranges au sommet : prudence avec les mains moyennes, valeur avec les mains fortes."],
        ])],
      ],
      mistakes: ["Rebarreler par habitude sur une carte qui complète les tirages adverses", "Ralentir sur une surcarte qui aide ta range", "Oublier la part de nuts et ne regarder que l'équité moyenne", "Décider sur la carte sans se demander quel rôle joue sa propre main"],
      keys: ["Surcartes : souvent pour le relanceur", "Cartes qui connectent : souvent pour le défenseur", "Board statique : la main décide ; dynamique : la carte compte", "Outil : Outils › Cartes du turn"],
      quiz: [
        ["Sur K♠7♦2♣, l'équité du bouton varie selon le turn de…", ["≈ 51 % à 54 %", "≈ 30 % à 70 %", "≈ 45 % à 60 %", "Exactement 52 % partout"], 0, "51,3 % à 53,8 % : board statique."],
        ["Sur 9♥8♥6♣, quel turn aide le plus la grosse blinde ?", ["Le 7", "L'as", "La dame", "Le 2"], 0, "47,5 % pour le bouton, part de nuts de la BB ≈ 20 %."],
        ["Une surcarte au turn aide en général…", ["Le relanceur préflop", "Le défenseur", "Personne", "Celui qui a checké"], 0, "Sa range contient plus de cartes hautes."],
        ["La part de nuts sert à…", ["Savoir qui peut miser gros", "Calculer le rake", "Compter les outs", "Choisir la position"], 0, "Le joueur qui a plus de mains très fortes peut polariser."],
        ["Sur un board statique, ta décision au turn dépend surtout…", ["De ta main", "De la couleur de la carte", "Du rang de la carte", "Du hasard"], 0, "La carte change peu l'équilibre des ranges."],
      ],
    });

    K.mod({
      id: 'jouets', level: 4, title: "Les jeux-jouets : jeu AKQ et river clairvoyante", drill: 'mdf',
      goals: ["Résoudre deux jeux simplifiés qui expliquent les fréquences des solveurs", "Retrouver les formules de bluff et de défense à partir de l'indifférence", "Savoir comment exploiter un adversaire qui s'en écarte"],
      sections: [
        ["Pourquoi des jeux simplifiés", `<p>Les solveurs donnent des fréquences, pas des raisons. Deux petits jeux, résolus à la main, montrent d'où viennent ces fréquences. Ils viennent de la théorie des jeux appliquée au poker (Chen et Ankenman, <em>The Mathematics of Poker</em>, 2006).</p>`],
        ["La river clairvoyante", `<p>Le joueur qui mise a soit les nuts, soit rien (range parfaitement polarisée) ; celui qui paie n'a que des bluff-catchers. Mise B dans un pot P. À l'équilibre :</p>
          <ul><li>Part de bluffs dans la range de mise : <strong>B ÷ (P + 2B)</strong>.</li>
          <li>Fréquence de call : <strong>P ÷ (P + B)</strong>.</li></ul>
          <table class="t"><thead><tr><th>Mise</th><th class="n">Bluffs dans la mise</th><th class="n">Call</th></tr></thead><tbody>
          <tr><td>Moitié du pot</td><td class="n">25 %</td><td class="n">67 %</td></tr><tr><td>Pot</td><td class="n">33 %</td><td class="n">50 %</td></tr><tr><td>Deux fois le pot</td><td class="n">40 %</td><td class="n">33 %</td></tr></tbody></table>
          <p>Avec une range parfaitement polarisée, le joueur qui mise gagne d'autant plus que la mise est grosse : sa valeur rapporte P + B × P ÷ (P + B), ses bluffs sont indifférents. C'est la raison des overbets avec les ranges polarisées.</p>`],
        ["Le jeu AKQ", `<p>Trois cartes : as, roi, dame. Chaque joueur en reçoit une. X checke ; Y peut miser 1 dans un pot de P ; X paie ou se couche.</p>
          <ul><li>Y mise toujours l'as, checke le roi (il ne fait payer que l'as et fait coucher la dame) et <strong>bluffe la dame</strong> avec la fréquence 1 ÷ (P + 1).</li>
          <li>X paie toujours avec l'as, se couche avec la dame et <strong>paie avec le roi</strong> avec la fréquence (P − 1) ÷ (P + 1).</li></ul>
          <p>Avec un pot de 2 (mise de moitié du pot) : Y bluffe la dame <strong>1 fois sur 3</strong>, X paie le roi <strong>1 fois sur 3</strong>. À ces fréquences, ni le call du roi ni le bluff de la dame ne gagnent ou ne perdent : c'est l'indifférence.</p>`],
        ["Ce qu'on en retient à la table", `<ul><li><strong>Indifférence</strong> : à l'équilibre, les mains mixtes (le roi qui paie parfois, la dame qui bluffe parfois) ont la même EV quelle que soit l'action. C'est pourquoi le solveur mélange.</li>
          <li><strong>Exploitation</strong> : si l'adversaire paie le roi moins souvent que (P − 1) ÷ (P + 1), bluffe toutes tes dames ; s'il paie plus souvent, ne bluffe plus.</li>
          <li><strong>Les bluffs viennent du bas de la range</strong> : la dame bluffe, le roi checke. Le roi a de la valeur à l'abattage, la dame n'en a aucune.</li></ul>`],
        ["Exercices corrigés", ex([
          ["River clairvoyante, mise des trois quarts du pot (P = 4, B = 3). Part de bluffs et fréquence de call ?", "Bluffs : 3 ÷ (4 + 6) = <strong>30 %</strong> de la range de mise. Call : 4 ÷ 7 ≈ <strong>57 %</strong>."],
          ["Jeu AKQ avec un pot de 4 (mise d'un quart du pot). À quelle fréquence Y bluffe-t-il la dame, et X paie-t-il le roi ?", "Bluff : 1 ÷ 5 = <strong>20 %</strong>. Call du roi : 3 ÷ 5 = <strong>60 %</strong>. Petite mise : peu de bluffs, défense large."],
          ["Ton adversaire ne paie jamais la river avec ses bluff-catchers. Que fais-tu de tes mains sans valeur ?", "Tu bluffes avec <strong>toutes</strong> : sa défense est sous la fréquence d'équilibre, chaque bluff rapporte. C'est la logique du node locking du Solveur."],
        ])],
      ],
      mistakes: ["Retenir les fréquences sans comprendre l'indifférence", "Bluffer avec des mains qui ont de la valeur à l'abattage", "Appliquer l'équilibre contre un joueur qui s'en écarte nettement", "Croire qu'un overbet est toujours meilleur, même avec une range non polarisée"],
      keys: ["Bluffs = B ÷ (P + 2B) de la range de mise", "Call = P ÷ (P + B)", "AKQ, pot 2 : bluff dame 1/3, call roi 1/3", "Écart de l'adversaire → exploitation maximale"],
      quiz: [
        ["River clairvoyante, mise du pot : part de bluffs dans la mise ?", ["33 %", "50 %", "25 %", "40 %"], 0, "1 ÷ (1 + 2)."],
        ["River clairvoyante, mise de deux fois le pot : fréquence de call ?", ["33 %", "50 %", "67 %", "20 %"], 0, "1 ÷ (1 + 2)."],
        ["Jeu AKQ, pot de 2 : Y bluffe la dame…", ["1 fois sur 3", "Toujours", "Jamais", "1 fois sur 2"], 0, "1 ÷ (P + 1)."],
        ["Dans le jeu AKQ, Y mise-t-il le roi ?", ["Non : il ne ferait payer que l'as et coucher la dame", "Oui, toujours", "Une fois sur deux", "Seulement en position"], 0, "Le roi a de la valeur à l'abattage, pas à la mise."],
        ["L'adversaire paie le roi plus souvent que l'équilibre. Ajustement ?", ["Ne plus bluffer", "Bluffer plus", "Miser le roi", "Checker l'as"], 0, "Ses calls rendent tes bluffs perdants."],
      ],
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
