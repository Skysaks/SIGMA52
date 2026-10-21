// Champions : styles d'entraînement inspirés de descriptions publiques de joueurs connus, et classement des gains fourni.
// Les paramètres des bots (table.js) sont des choix de SIGMA 52 à partir de ces descriptions : ce n'est pas la stratégie réelle des joueurs.
(function (root) {
  const SRC = {
    iveyRev: { t: 'Blackrain79, critique du cours MasterClass de Phil Ivey (2019)', u: 'https://www.blackrain79.com/2019/06/phil-ivey-masterclass-review.html' },
    iveyMC: { t: 'MasterClass, Phil Ivey Teaches Poker Strategy', u: 'https://www.masterclass.com/classes/phil-ivey-teaches-poker-strategy/chapters/deepstack-play' },
    negBook: { t: 'PokerNews, critique de Power Hold\'em Strategy (2008)', u: 'https://www.pokernews.com/news/2008/09/book-review-daniel-negreanu-power-holdem-strategy-5579.htm' },
    negMC: { t: 'PokerNews, Negreanu rejoint MasterClass (juin 2018)', u: 'https://www.pokernews.com/news/2018/06/daniel-negreanu-joins-masterclass-as-poker-instructor-31111.htm' },
    helBook: { t: 'Résumé de Play Poker Like the Pros (Hellmuth)', u: 'https://manassaloi.com/booksummaries/2017/05/13/play-poker-like-pros-hellmuth.html' },
    helInt: { t: 'PokerNews, interview de Phil Hellmuth (2015)', u: 'https://www.pokernews.com/strategy/interview-phil-hellmuth-part-1-21048.htm' },
    chid: { t: 'Card Player, Stephen Chidwick : The Player\'s Choice of Champion (2019)', u: 'https://www.cardplayer.com/?p=1038623' },
    miz: { t: 'PokerNews, la stratégie de Michael Mizrachi (2016)', u: 'https://www.pokernews.com/strategy/michael-mizrachi-poker-strategy-25107.htm' },
    anto: { t: 'Card Player, The Finnish Hihhuli Takes on the World (2006)', u: 'https://www.cardplayer.com/cardplayer-poker-magazines/65637-patrik-antonius-3-2/articles/16176-the-finnish-hihhuli-takes-on-the-world' },
    brun1: { t: 'Poker1 (Mike Caro), Brunson : the advantages of aggressive play', u: 'https://www.poker1.com/?p=11760' },
    brun2: { t: 'Poker Academy, Super/System (1979) face à la stratégie moderne', u: 'https://poker.academy/blog/post/doyle-brunsons-super-system-1979-vs-modern-poker-strategy-2025' },
    harr1: { t: 'PokerListings, le système de zones de Dan Harrington', u: 'https://www.pokerlistings.com/poker-strategies/tournament-nl-holdem/tournament-nolimit-holdem-harringtons-zone-system' },
    harr2: { t: 'Wikipédia, M-ratio', u: 'https://en.wikipedia.org/wiki/M-ratio' },
    dwan1: { t: 'Wikipédia, Tom Dwan', u: 'https://en.wikipedia.org/wiki/Tom_Dwan' },
    dwan2: { t: 'PokerListings, Tom Dwan, Profit Maximization Artist', u: 'https://www.pokerlistings.com/hand-analysis/tom-dwan-profit-maximization-artist' },
    holz: { t: 'Card Player, interview de Fedor Holz', u: 'https://www.cardplayer.com/?p=1037852' },
    yohW: { t: 'Wikipédia, Johan Guilbert', u: 'https://en.wikipedia.org/wiki/Johan_Guilbert' },
    yohPN: { t: 'PokerNews, fiche Johan Guilbert', u: 'https://www.pokernews.com/poker-players/johan-guilbert/' },
  };
  // stats = repères mesurés par SIGMA 52 sur 1 500 à 2 000 mains simulées (VPIP, PFR, 3-bet, c-bet flop, fold to c-bet, en %).
  const STYLES = [
    { id: 'ivey', profile: 'ivey', name: 'L\'agresseur complet', inspired: 'Phil Ivey', flag: 'États-Unis', level: 'Très difficile', format: 'hu6',
      tagline: 'Pression constante, overbets, et il bluffe plus si tu abandonnes trop.',
      facts: ['Son cours MasterClass compte 11 modules : préflop et défense des blindes, tailles de mise, bluff, jeu postflop, tapis profonds (plus de 100 bb), mental (tilt, confiance, mettre l\'adversaire sous pression) et tells physiques.', 'La critique le décrit calme à la table, avec un regard réputé et un historique de bluffs très agressifs à haute limite.'],
      sources: ['iveyRev', 'iveyMC'],
      traits: ['Ouvre et 3-bette souvent ; c-bet fréquent', 'Mises de 60 à 100 % du pot, overbets au turn et à la river', 'Relances-bluffs occasionnelles', 'Lit tes tendances : après une douzaine de mises affrontées, il bluffe plus si tu couches plus de 45 % du temps'],
      adapt: ['Ne couche pas trop face à ses mises : c\'est exactement ce qu\'il exploite', 'Face à ses overbets river, paie avec tes meilleurs bluff-catchers (ceux qui bloquent sa valeur)', '4-bet pour la valeur un peu plus large contre ses 3-bets fréquents', 'Garde des mains fortes dans ta range de check pour le piéger'],
      stats: { vpip: 26, pfr: 18, three: 9, cbet: 48, ftc: 7 } },
    { id: 'negreanu', profile: 'negreanu', name: 'Le small ball', inspired: 'Daniel Negreanu', flag: 'Canada', level: 'Difficile', format: 'hu6',
      tagline: 'Petits pots, petites mises, beaucoup de mains en position : il te grignote.',
      facts: ['Power Hold\'em Strategy (2008) présente le « small ball » : faire grossir son tapis sans prendre de gros risques, en exploitant la position, la texture du board et les adversaires prévisibles ; « jouer la main de l\'adversaire plutôt que la sienne ».', 'Son cours MasterClass, lancé en juin 2018, vise les joueurs intermédiaires : tournois, tells, cash et jeu en ligne.'],
      sources: ['negBook', 'negMC'],
      traits: ['Petites ouvertures (2,2 bb) et beaucoup de calls en position', 'Petites mises fréquentes (25 à 40 % du pot au flop)', 'Évite les gros pots sans main forte : couche plus souvent face aux grosses mises'],
      adapt: ['Relance ses petites mises : sa range de mise est large', 'Bluffe gros plutôt que petit : il couche davantage face aux mises de plus de 75 % du pot', 'Mise gros pour la valeur avec tes mains fortes : il paiera les petites mises, pas forcément les grosses', 'Évite les petits pots marginaux hors de position, son terrain favori'],
      stats: { vpip: 27, pfr: 14, three: 5, cbet: 72, ftc: 29 } },
    { id: 'hellmuth', profile: 'hellmuth', name: 'Le lecteur adaptatif', inspired: 'Phil Hellmuth', flag: 'États-Unis', level: 'Difficile', format: 'hu6',
      tagline: 'Serré, orienté valeur, et il s\'ajuste à ce que tu montres.',
      facts: ['Play Poker Like the Pros classe les adversaires en cinq « animaux » (souris, lion, chacal, éléphant, aigle) et conseille aux débutants de ne jouer que dix mains : AA, KK, QQ, AK, JJ, TT, 99, 88, AQ, 77.', 'En interview (2015), il résume le poker à « lire les gens » et dit pouvoir jouer le plus ou le moins de mains de la table selon les adversaires.'],
      sources: ['helBook', 'helInt'],
      traits: ['Range préflop serrée (environ 17 % des mains)', 'Valeur avant tout, peu de bluffs', 'S\'adapte fortement à toi : il vole davantage si tu couches trop'],
      adapt: ['Sois imprévisible : mélange tes lignes, sinon il s\'ajuste', 'Vole ses blindes : il défend serré', 'Respecte ses grosses mises : elles contiennent peu de bluffs', 'Ne deviens pas le joueur qui « couche tout » face aux mises : il le repère'],
      stats: { vpip: 18, pfr: 12, three: 5, cbet: 61, ftc: 16 } },
    { id: 'chidwick', profile: 'chidwick', name: 'Le GTO moderne', inspired: 'Stephen Chidwick', flag: 'Angleterre', level: 'Très difficile', format: 'hu6',
      tagline: 'Proche de l\'équilibre : peu de failles, des check-raises et des grosses mises au turn.',
      facts: ['Card Player (2019) : il étudie avec des solveurs pour comprendre le raisonnement derrière leurs résultats, et voit l\'équilibre comme le moyen de repérer précisément les erreurs adverses.', 'Il recommande les coups qui mettent l\'adversaire mal à l\'aise : petits check-raises sur boards secs, grosses mises au turn quand la range adverse est faible.', 'Premier d\'un sondage de Card Player auprès des joueurs sur le meilleur joueur du circuit.'],
      sources: ['chid'],
      traits: ['Environ 20 % de mains jouées, c-bet très fréquent', 'Check-raises au flop avec mains fortes et tirages', 'Overbets occasionnels au turn et à la river'],
      adapt: ['Pas d\'exploit évident : joue ta base solide (charts, solveur)', 'Ne surpaie pas ses check-raises avec des mains faibles', 'Garde dans ta range des mains capables de payer ses grosses mises turn', 'Dans une vraie partie, la meilleure stratégie contre lui est de choisir une autre table'],
      stats: { vpip: 20, pfr: 15, three: 4, cbet: 78, ftc: 10 } },
    { id: 'mizrachi', profile: 'mizrachi', name: 'Le loose-agressif atypique', inspired: 'Michael Mizrachi', flag: 'États-Unis', level: 'Moyen', format: 'hu6',
      tagline: 'Joue beaucoup de mains, mise souvent, overbette et ne lâche rien au flop.',
      facts: ['PokerNews (2016) : style loose-agressif ; il joue une large range sans range fixe, utilise beaucoup d\'overbets et accepte de jouer environ 25 % de son tapis sur des coups à pile ou face, plus solide une fois tombé à la moitié de son tapis.', 'Il conseille lui-même aux débutants de ne pas copier son style et de s\'en tenir aux mains fortes.'],
      sources: ['miz'],
      traits: ['Joue environ un tiers des mains', 'C-bet presque systématique, overbets fréquents', 'Couche très rarement face aux c-bets'],
      adapt: ['Ne bluffe pas au flop : il ne couche presque jamais', 'Laisse-le miser : check-call avec tes mains moyennes-fortes', 'Paie ses overbets plus large : ils contiennent beaucoup d\'air', 'Isole-le avec des mains fortes, évite les mains dominées'],
      stats: { vpip: 36, pfr: 23, three: 12, cbet: 83, ftc: 10 } },
    { id: 'antonius', profile: 'antonius', name: 'La pression en tête-à-tête', inspired: 'Patrik Antonius', flag: 'Finlande', level: 'Très difficile', format: 'hu',
      tagline: 'Tête-à-tête à haute pression : relances constantes, mises lourdes, sang-froid.',
      facts: ['Card Player (2006) : jeu agressif à très haute limite, souvent en tête-à-tête ; il considère la qualité de ses lectures comme sa principale force ; décrit comme insensible à l\'adversité comme à la chance ; préfère peu de tables, dans des parties difficiles, pour rester concentré à 100 %.'],
      sources: ['anto'],
      traits: ['Relance la majorité de ses boutons en tête-à-tête, 3-bets fréquents', 'Mises de 2/3 du pot au pot, overbets', 'Bluffe plus si tu couches trop'],
      adapt: ['Défends ta grosse blinde large (call ou 3-bet) : en tête-à-tête, les ranges sont très larges', 'Ne couche pas plus d\'environ la moitié face à ses mises', '3-bet ses ouvertures larges avec tes mains fortes et quelques bluffs à bloqueurs', 'Reste calme : la variance du tête-à-tête est énorme'],
      stats: { vpip: 40, pfr: 33, three: 22, cbet: 68, ftc: 18 } },
    { id: 'brunson', profile: 'brunson', name: 'Le parrain agressif', inspired: 'Doyle Brunson', flag: 'États-Unis', level: 'Difficile', format: 'hu6',
      tagline: 'Il mise presque chaque flop et ramasse une montagne de petits pots.',
      facts: ['Super/System (1979) : « il faut être agressif pour exceller ». Brunson ramasse « beaucoup de petits pots, des tonnes », ce qui finance les gros pots perdus ; il réserve ses plus grosses mises aux mains très fortes ou aux tirages (semi-bluff à tapis avec une ventrale en exemple).', 'Le livre préconise de miser au flop presque à chaque fois après avoir relancé (environ 90 %). Un solveur moderne le fait autour de 63 % en moyenne, beaucoup moins sur les boards qui favorisent le défenseur.'],
      sources: ['brun1', 'brun2'],
      traits: ['C-bet presque systématique (plus de 90 % mesuré)', 'Grosses mises (75 % du pot au pot)', 'Tapis en semi-bluff de temps en temps', 'Peu de 3-bets préflop (fidèle au livre : surtout AA et KK)'],
      adapt: ['Défends plus large face au c-bet : sa range de mise est très large', 'Check-raise les boards qui favorisent ta range (bas, connectés)', 'Paie plus léger face aux grosses mises au flop, moins à la river', 'Ses 3-bets sont forts : couche tes mains moyennes'],
      stats: { vpip: 28, pfr: 18, three: 5, cbet: 95, ftc: 24 } },
    { id: 'harrington', profile: 'harrington', name: 'Le joueur de tournoi méthodique', inspired: 'Dan Harrington', flag: 'États-Unis', level: 'Moyen', format: 'hu6',
      tagline: 'Serré-agressif, discipliné, et tout son jeu dépend de son tapis (le « M »).',
      facts: ['Harrington on Hold\'em définit M = tapis ÷ (blindes + antes) et cinq zones : verte (M ≥ 20, tout le jeu est possible), jaune (10 à 20, s\'ouvrir, les petites paires et assorties perdent de la valeur), orange (6 à 10, entrer avec des mains fortes, éviter les calls marginaux), rouge (1 à 5, tapis ou couché), morte (moins de 1).', 'Il recommande d\'adapter son style à la table : jouer serré quand les autres jouent large, et l\'inverse.'],
      sources: ['harr1', 'harr2'],
      traits: ['Range serrée (15 % de VPIP), ouvertures à 3 bb', 'Mise de continuation fréquente, tailles moyennes', 'Couche facilement face à la pression (fold to c-bet élevé)'],
      adapt: ['Vole ses blindes souvent : il défend peu', 'Ses relances et 3-bets sont fortes : respecte-les', 'Bluffe-le aux tours suivants quand il check : il abandonne beaucoup', 'En tournoi, calcule ton propre M : la zone dicte ta stratégie autant que la sienne'],
      stats: { vpip: 15, pfr: 11, three: 2, cbet: 87, ftc: 32 } },
    { id: 'dwan', profile: 'dwan', name: 'L\'ultra-agressif opaque', inspired: 'Tom Dwan', flag: 'États-Unis', level: 'Très difficile', format: 'hu6',
      tagline: 'Grosses mises, gros bluffs, il construit les pots tôt pour finir à tapis.',
      facts: ['Joueur de cash « durrrr » en ligne à très haute limite (hold\'em et PLO), puis Macau et Manille. Phil Galfond lui prête « le plus de pensées par minute » qu\'il connaisse. Son bluff avec 7-2 à High Stakes Poker (2009) est resté célèbre.', 'PokerListings le décrit « ultra-agressif et opaque » : mises tôt dans la main pour grossir le pot, avec des tapis profonds (300 bb) qui changent les décisions.'],
      sources: ['dwan1', 'dwan2'],
      traits: ['Très large et très agressif, 3-bets fréquents', 'Overbets au turn et à la river', 'Relances-bluffs, il bluffe plus si tu couches trop', 'Taux de fold to c-bet très bas : il défend et contre-attaque'],
      adapt: ['Élargis tes calls avec les bluff-catchers qui bloquent sa valeur', 'Ne bluffe pas en c-bet systématique : il défend', 'Piège avec tes mains fortes : laisse-le miser', 'Variance énorme : joue des tapis plus courts si tu es mal à l\'aise'],
      stats: { vpip: 32, pfr: 22, three: 10, cbet: 72, ftc: 32 } },
    { id: 'live', profile: null, name: 'La partie live à gros enjeux', inspired: 'type de partie fréquentée par YoH ViraL', flag: 'France', level: 'Moyen', format: 'live',
      tagline: 'Tapis profonds, joueurs d\'action, un pro à la table : la partie des diffusions live.',
      facts: ['Johan Guilbert, alias YoH ViraL, né en 1989 à Sarreguemines : joueur de cash game devenu régulier des high rollers et vlogueur. PokerNews le cite dans des parties diffusées comme Hustler Casino Live et Live at the Bike.', 'Premier bracelet WSOP en 2025 (WSOP Paradise, GGMillion$ Single Day Turbo, 1 534 645 $) ; deuxième de la WSOP Europe Main Event 2021 (près de 800 000 €).', 'Aucune description publique détaillée de son style de jeu n\'a été trouvée : SIGMA 52 reproduit le type de partie, pas son jeu.'],
      sources: ['yohW', 'yohPN'],
      traits: ['Tapis de 200 bb', 'Joueurs d\'action : ouvertures à 4 bb, beaucoup de calls, pots à plusieurs', 'Un pro de cash live solide à la table'],
      adapt: ['Valeur grosse, bluffs rares contre les joueurs d\'action', 'Isole-les en position avec une range orientée valeur', 'Respecte les relances du pro', 'Profond : valorise paires et assorties connectées, méfie-toi des mains dominées'],
      stats: null },
  ];
  // Formats proposés : tête-à-tête contre le style, ou table à six avec lui (+ réguliers et un fish).
  const lineupFor = (st, fmt) => st.id === 'live' ? ['action', 'action', 'prolive', 'station', 'action'] : fmt === 'hu' ? [st.profile] : [st.profile, 'reg', 'station', 'reg', 'nit'];
  const LEGENDS = ['ivey', 'negreanu', 'hellmuth', 'chidwick', 'mizrachi'];
  const CLASSICS = ['brunson', 'harrington', 'dwan', 'antonius', 'ivey'];
  // Types de partie : profondeur, structure et composition de table. Les tournois utilisent le moteur Expresso généralisé.
  const ARCH = { mix: ['station', 'reg', 'maniaque', 'station', 'nit'], fish: ['station', 'action', 'station', 'reg', 'station'], regs: ['reg', 'chidwick', 'reg', 'harrington', 'nit'], agressifs: ['maniaque', 'dwan', 'mizrachi', 'reg', 'brunson'], legendes: ['ivey', 'negreanu', 'hellmuth', 'chidwick', 'mizrachi'], classiques: ['brunson', 'harrington', 'dwan', 'antonius', 'ivey'], sigma: ['sigma', 'sigma', 'reg', 'sigma', 'nit'] };
  const ARCH_LABEL = { mix: 'Table mixte (2 fish, régulier, maniaque, nit)', fish: 'Table de fish', regs: 'Table de réguliers', agressifs: 'Table agressive', legendes: 'Légendes', classiques: 'Classiques (Brunson, Harrington, Dwan…)', sigma: 'Table difficile (moteur SIGMA)' };
  const lv = (a) => a.map((x) => [x / 2, x]);
  const FORMATS = [
    { id: 'cash100', kind: 'cash', name: 'Cash 100 bb', stackBB: 100, desc: 'La référence du cash en ligne à 6 joueurs.', keys: ['Ouvertures selon les charts, 3-bet polarisé en position', 'SPR moyen : top paire bon kicker se joue souvent pour un pot moyen'], mods: ['positions', 'postflop'] },
    { id: 'short', kind: 'cash', name: 'Cash court 40 bb', stackBB: 40, desc: 'Tapis courts : moins de jeu postflop, plus de tapis préflop.', keys: ['Préfère les mains à haute carte (AQ, KQ, paires moyennes) aux connecteurs : moins de cotes implicites', '3-bet souvent tapis (3-bet/shove) au lieu de 3-bet/call', 'SPR bas : top paire = tapis la plupart du temps'], mods: ['preflop2', 'sizing'] },
    { id: 'deep', kind: 'cash', name: 'Cash profond 200 bb', stackBB: 200, desc: 'Tapis profonds : cotes implicites, jeu à plusieurs rues, gros pots.', keys: ['Les assorties connectées et petites paires gagnent en valeur (cotes implicites)', 'Méfie-toi des mains dominées (AJ, KQ) dans les gros pots', 'Une paire seule ne suffit pas pour mettre 200 bb'], mods: ['deep', 'barrels'] },
    { id: 'home', kind: 'cash', name: 'Partie maison', stackBB: 100, lineup: ['action', 'station', 'action', 'station', 'reg'], desc: 'Entre amis : ouvertures grosses, beaucoup de calls, pots à plusieurs.', keys: ['Isole les joueurs faibles en position, relance plus gros (4 bb + 1 par limper)', 'Peu de bluffs : on paie trop souvent', 'Valeur grosse et sur trois rues avec les mains fortes'], mods: ['home', 'live_strat'] },
    { id: 'hu', kind: 'cash', name: 'Tête-à-tête 100 bb', stackBB: 100, lineup: ['reg'], desc: 'Un seul adversaire : ranges très larges, agressivité maximale.', keys: ['Ouvre 75 à 85 % des mains au bouton', 'Défends ta grosse blinde très large', 'Paires faibles et hauteur as valent beaucoup plus qu\'à 6'], mods: ['hu'] },
    { id: 'sng6', kind: 'mtt', name: 'Sit & Go 6 joueurs', players: 6, stack: 1500, levels: lv([20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1000]), hpl: 8, desc: '1 500 jetons, blindes toutes les 8 mains, éliminations jusqu\'au dernier.', keys: ['Début : serré, les blindes ne valent rien', 'Milieu (M 6 à 10) : vole les blindes, tapis ou couché sous 15 bb', 'Bulle et fin : pression sur les tapis moyens, l\'ICM punit les calls larges'], mods: ['icm', 'icm2'] },
    { id: 'ft', kind: 'mtt', name: 'Table finale', players: 6, stack: 2500, start: 4, levels: lv([100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000]), hpl: 6, desc: '6 joueurs, environ 25 bb, blindes rapides : chaque place compte.', keys: ['Les petits tapis subissent l\'ICM : ne paie pas un tapis avec une main moyenne', 'Le gros tapis met la pression aux tapis moyens', 'Repère qui joue pour monter de place et qui joue pour gagner'], mods: ['icm2', 'perf'] },
    { id: 'expresso', kind: 'mtt', name: 'Expresso 3 joueurs', players: 3, stack: 500, levels: lv([20, 30, 40, 60, 80, 100, 120, 160, 200, 300, 400]), hpl: 6, desc: '500 jetons, hyper-turbo, le gagnant prend tout.', keys: ['Tapis ou couché très tôt', 'Tête-à-tête final : ouvre presque tout au bouton'], mods: ['expresso'] },
  ];

  // Classement fourni par l'utilisateur (gains bruts en tournois live, Hendon Mob, relevé du 19/10/2026). Gains bruts : buy-ins non déduits.
  const MONEY = [
    ['Bryn Kenney', 'États-Unis', 90849210], ['Stephen Chidwick', 'Angleterre', 79927052], ['Jason Koon', 'États-Unis', 77032156], ['Adrian Mateos', 'Espagne', 70372453],
    ['Mikita Bodyakovsky', 'Biélorussie', 69466521], ['Isaac Haxton', 'États-Unis', 66813452], ['Justin Bonomo', 'États-Unis', 65611097], ['Dan Smith', 'États-Unis', 61356629],
    ['Daniel Negreanu', 'Canada', 60677067], ['William Alex Foxen', 'États-Unis', 59912863], ['Phil Ivey', 'États-Unis', 56074163], ['Daniel Dvoress', 'Canada', 55680885],
    ['David Peters', 'États-Unis', 50948797], ['Fedor Holz', 'Allemagne', 50681510], ['Seth Davies', 'États-Unis', 49921615], ['Erik Seidel', 'États-Unis', 49303841],
    ['Christoph Vogelsang', 'Allemagne', 47381847], ['Steve O\'Dwyer', 'États-Unis', 47031130], ['Nick Petrangelo', 'États-Unis', 46230972], ['Daniel Chi Tang', 'Hong Kong', 45284335],
    ['Cary Katz', 'États-Unis', 43375118], ['Aleksejs Ponakovs', 'Lettonie', 42771607], ['Sean Winter', 'États-Unis', 41502887], ['Punnat Punsri', 'Thaïlande', 39460464],
    ['Sam Greenwood', 'Canada', 39409853], ['Ben Heath', 'Angleterre', 39237318], ['Benjamin Tollerene', 'États-Unis', 38882118], ['Paul Phua', 'Malaisie', 38879290],
    ['Michael Watson', 'Canada', 38780706], ['Jake Schindler', 'États-Unis', 36817582], ['Artur Martirosyan', 'Russie', 35780116], ['Patrik Antonius', 'Finlande', 34848696],
    ['Jesse Lonis', 'États-Unis', 33978205], ['Matthias Eibinger', 'Autriche', 33873729], ['Sam Soverel', 'États-Unis', 33182102], ['Phil Hellmuth Jr', 'États-Unis', 31641595],
    ['Elton Tsang', 'Hong Kong', 31479299], ['Nick Schulman', 'États-Unis', 31472564], ['Michael Mizrachi', 'États-Unis', 30699393], ['Jean-Noel Thorel', 'France', 30558278],
  ];
  const STYLE_OF = { 'Stephen Chidwick': 'chidwick', 'Daniel Negreanu': 'negreanu', 'Phil Ivey': 'ivey', 'Patrik Antonius': 'antonius', 'Phil Hellmuth Jr': 'hellmuth', 'Michael Mizrachi': 'mizrachi' };
  const NOTES = { 'Fedor Holz': 'Interview Card Player : gère moins de 2 % de sa bankroll par tournoi, préfère les tournois au cash (« pas assez patient »), apprend en groupe avec des amis. Pas de description publique de son style de jeu : pas de bot.' };

  const api = { NOTES, SRC, STYLES, MONEY, STYLE_OF, LEGENDS, CLASSICS, ARCH, ARCH_LABEL, FORMATS, lineupFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Champions = api;
})(typeof window !== 'undefined' ? window : globalThis);
