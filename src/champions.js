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
      stats: { vpip: 26, pfr: 19, three: 10, cbet: 63, ftc: 11 } },
    { id: 'negreanu', profile: 'negreanu', name: 'Le small ball', inspired: 'Daniel Negreanu', flag: 'Canada', level: 'Difficile', format: 'hu6',
      tagline: 'Petits pots, petites mises, beaucoup de mains en position : il te grignote.',
      facts: ['Power Hold\'em Strategy (2008) présente le « small ball » : faire grossir son tapis sans prendre de gros risques, en exploitant la position, la texture du board et les adversaires prévisibles ; « jouer la main de l\'adversaire plutôt que la sienne ».', 'Son cours MasterClass, lancé en juin 2018, vise les joueurs intermédiaires : tournois, tells, cash et jeu en ligne.'],
      sources: ['negBook', 'negMC'],
      traits: ['Petites ouvertures (2,2 bb) et beaucoup de calls en position', 'Petites mises fréquentes (25 à 40 % du pot au flop)', 'Évite les gros pots sans main forte : couche plus souvent face aux grosses mises'],
      adapt: ['Relance ses petites mises : sa range de mise est large', 'Bluffe gros plutôt que petit : il couche davantage face aux mises de plus de 75 % du pot', 'Mise gros pour la valeur avec tes mains fortes : il paiera les petites mises, pas forcément les grosses', 'Évite les petits pots marginaux hors de position, son terrain favori'],
      stats: { vpip: 29, pfr: 15, three: 5, cbet: 69, ftc: 33 } },
    { id: 'hellmuth', profile: 'hellmuth', name: 'Le lecteur adaptatif', inspired: 'Phil Hellmuth', flag: 'États-Unis', level: 'Difficile', format: 'hu6',
      tagline: 'Serré, orienté valeur, et il s\'ajuste à ce que tu montres.',
      facts: ['Play Poker Like the Pros classe les adversaires en cinq « animaux » (souris, lion, chacal, éléphant, aigle) et conseille aux débutants de ne jouer que dix mains : AA, KK, QQ, AK, JJ, TT, 99, 88, AQ, 77.', 'En interview (2015), il résume le poker à « lire les gens » et dit pouvoir jouer le plus ou le moins de mains de la table selon les adversaires.'],
      sources: ['helBook', 'helInt'],
      traits: ['Range préflop serrée (environ 17 % des mains)', 'Valeur avant tout, peu de bluffs', 'S\'adapte fortement à toi : il vole davantage si tu couches trop'],
      adapt: ['Sois imprévisible : mélange tes lignes, sinon il s\'ajuste', 'Vole ses blindes : il défend serré', 'Respecte ses grosses mises : elles contiennent peu de bluffs', 'Ne deviens pas le joueur qui « couche tout » face aux mises : il le repère'],
      stats: { vpip: 17, pfr: 12, three: 4, cbet: 57, ftc: 13 } },
    { id: 'chidwick', profile: 'chidwick', name: 'Le GTO moderne', inspired: 'Stephen Chidwick', flag: 'Angleterre', level: 'Très difficile', format: 'hu6',
      tagline: 'Proche de l\'équilibre : peu de failles, des check-raises et des grosses mises au turn.',
      facts: ['Card Player (2019) : il étudie avec des solveurs pour comprendre le raisonnement derrière leurs résultats, et voit l\'équilibre comme le moyen de repérer précisément les erreurs adverses.', 'Il recommande les coups qui mettent l\'adversaire mal à l\'aise : petits check-raises sur boards secs, grosses mises au turn quand la range adverse est faible.', 'Premier d\'un sondage de Card Player auprès des joueurs sur le meilleur joueur du circuit.'],
      sources: ['chid'],
      traits: ['Environ 20 % de mains jouées, c-bet très fréquent', 'Check-raises au flop avec mains fortes et tirages', 'Overbets occasionnels au turn et à la river'],
      adapt: ['Pas d\'exploit évident : joue ta base solide (charts, solveur)', 'Ne surpaie pas ses check-raises avec des mains faibles', 'Garde dans ta range des mains capables de payer ses grosses mises turn', 'Dans une vraie partie, la meilleure stratégie contre lui est de choisir une autre table'],
      stats: { vpip: 20, pfr: 14, three: 5, cbet: 78, ftc: 19 } },
    { id: 'mizrachi', profile: 'mizrachi', name: 'Le loose-agressif atypique', inspired: 'Michael Mizrachi', flag: 'États-Unis', level: 'Moyen', format: 'hu6',
      tagline: 'Joue beaucoup de mains, mise souvent, overbette et ne lâche rien au flop.',
      facts: ['PokerNews (2016) : style loose-agressif ; il joue une large range sans range fixe, utilise beaucoup d\'overbets et accepte de jouer environ 25 % de son tapis sur des coups à pile ou face, plus solide une fois tombé à la moitié de son tapis.', 'Il conseille lui-même aux débutants de ne pas copier son style et de s\'en tenir aux mains fortes.'],
      sources: ['miz'],
      traits: ['Joue environ un tiers des mains', 'C-bet presque systématique, overbets fréquents', 'Couche très rarement face aux c-bets'],
      adapt: ['Ne bluffe pas au flop : il ne couche presque jamais', 'Laisse-le miser : check-call avec tes mains moyennes-fortes', 'Paie ses overbets plus large : ils contiennent beaucoup d\'air', 'Isole-le avec des mains fortes, évite les mains dominées'],
      stats: { vpip: 34, pfr: 22, three: 9, cbet: 90, ftc: 7 } },
    { id: 'antonius', profile: 'antonius', name: 'La pression en tête-à-tête', inspired: 'Patrik Antonius', flag: 'Finlande', level: 'Très difficile', format: 'hu',
      tagline: 'Tête-à-tête à haute pression : relances constantes, mises lourdes, sang-froid.',
      facts: ['Card Player (2006) : jeu agressif à très haute limite, souvent en tête-à-tête ; il considère la qualité de ses lectures comme sa principale force ; décrit comme insensible à l\'adversité comme à la chance ; préfère peu de tables, dans des parties difficiles, pour rester concentré à 100 %.'],
      sources: ['anto'],
      traits: ['Relance la majorité de ses boutons en tête-à-tête, 3-bets fréquents', 'Mises de 2/3 du pot au pot, overbets', 'Bluffe plus si tu couches trop'],
      adapt: ['Défends ta grosse blinde large (call ou 3-bet) : en tête-à-tête, les ranges sont très larges', 'Ne couche pas plus d\'environ la moitié face à ses mises', '3-bet ses ouvertures larges avec tes mains fortes et quelques bluffs à bloqueurs', 'Reste calme : la variance du tête-à-tête est énorme'],
      stats: { vpip: 41, pfr: 34, three: 19, cbet: 65, ftc: 47 } },
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

  const api = { SRC, STYLES, MONEY, STYLE_OF, LEGENDS, lineupFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Champions = api;
})(typeof window !== 'undefined' ? window : globalThis);
