// Examens de niveau : banque de questions propres aux examens (mises en situation, distinctes des quiz de modules).
// Un examen = 12 questions de cette banque + 8 questions des quiz du niveau, tirées au hasard ; validé à 80 %.
// Équités citées : moteur SIGMA 52 ; ICM : calcul exact du moteur.
(function (root) {
  // Même mélange stable des réponses que les quiz des modules (la bonne réponse n'est pas toujours la première).
  const hash = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return x >>> 0; };
  const mix = (q, opts, ok) => {
    const idx = opts.map((_, i) => i); let x = hash(q) || 1;
    for (let i = idx.length - 1; i > 0; i--) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; const j = x % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return { opts: idx.map((i) => opts[i]), ok: idx.indexOf(ok) };
  };
  const Q = (level, mod, q, opts, ok, why) => ({ level, mod, q, ...mix(q, opts, ok), why });
  const BANK = [
    // ---- Niveau 1 : Fondations
    Q(1, 'positions', 'Table à 6, tout le monde se couche jusqu\'à toi au CO. Tu as A♦9♠. Que fais-tu ?', ['Relancer', 'Payer la grosse blinde', 'Coucher'], 0, 'A9o fait partie de la range d\'ouverture du CO ; premier à entrer, on relance ou on se couche.'),
    Q(1, 'positions', 'Qui parle en dernier après le flop à 6 joueurs ?', ['Le bouton', 'La grosse blinde', 'UTG'], 0, 'Le bouton garde la position sur toute la main après le flop.'),
    Q(1, 'regles', 'Blindes 1/2, UTG relance à 5. Relance minimum suivante ?', ['8', '10', '7'], 0, 'La relance précédente est de 3 (de 2 à 5) : 5 + 3 = 8.'),
    Q(1, 'regles', 'Board 7♣7♦7♥7♠2♣. Tu as A♥3♦, ton adversaire K♣K♦. Résultat ?', ['Tu gagnes (carré de 7, kicker as)', 'Il gagne', 'Partage'], 0, 'Tout le monde a le carré de 7 ; le kicker décide : as contre roi.'),
    Q(1, 'mains', 'Board A♠K♠7♠2♦2♣. Quelle main bat une couleur ?', ['Un full (ex. A-A-A-2-2 ou 2-2-2-A-A)', 'Une suite', 'Deux paires'], 0, 'Le board est pairé : full et carré battent la couleur.'),
    Q(1, 'mains', 'Probabilité de toucher un brelan ou mieux au flop avec une paire en main ?', ['≈ 12 %', '≈ 25 %', '≈ 5 %'], 0, '1 − C(48,3) ÷ C(50,3) ≈ 11,8 %.'),
    Q(1, 'preflop', 'Un joueur limpe, tu es au bouton avec K♠Q♦. Le bon choix ?', ['Relancer pour isoler (≈ 5 bb)', 'Limper derrière', 'Coucher'], 0, 'On isole les limpers en position avec une main qui les domine.'),
    Q(1, 'preflop', 'A♥K♦ contre Q♠Q♣ à tapis préflop. Qui est favori ?', ['QQ, ≈ 57 %', 'AK, ≈ 57 %', 'Exactement 50/50'], 0, 'Moteur SIGMA 52 : QQ 57,5 %, AKo 42,5 %.'),
    Q(1, 'maths', 'Le pot fait 60, il mise 30. Équité requise pour payer ?', ['25 %', '33 %', '50 %'], 0, '30 ÷ (60 + 30 + 30) = 25 %.'),
    Q(1, 'maths', 'Tirage couleur au flop, deux cartes à venir, sans être relancé : chance de toucher ?', ['≈ 35 %', '≈ 19 %', '≈ 50 %'], 0, 'Règle des 4 : 9 × 4 ≈ 36 % ; exact : 35 %.'),
    Q(1, 'bankroll', 'Bankroll de 400 €, règle de 40 caves en cash. Limite maximale ?', ['NL10 (cave 10 €)', 'NL25', 'NL50'], 0, '400 ÷ 40 = 10 € par cave.'),
    Q(1, 'cadre', 'Une chart préflop ouverte dans un onglet pendant ta session PokerStars est…', ['Interdite', 'Autorisée si tu ne la regardes pas', 'Autorisée'], 0, 'PokerStars interdit même une chart préflop ouverte pendant le jeu.'),
    Q(1, 'responsable', 'Tu augmentes tes mises pour récupérer une perte. C\'est…', ['Un signal d\'alerte', 'Une stratégie de bankroll', 'Normal en fin de mois'], 0, 'Jouer pour se refaire est le signal le plus classique.'),
    Q(1, 'sprint', 'Contre un joueur passif qui relance la river, avec top paire, le réflexe par défaut est…', ['Coucher', 'Relancer', 'Payer toujours'], 0, 'Une relance river d\'un passif est presque toujours de la valeur.'),
    Q(1, 'online', 'Deux tables : l\'une avec trois joueurs à VPIP 45 %, l\'autre avec cinq réguliers serrés. Tu choisis…', ['La première', 'La seconde', 'Peu importe'], 0, 'Les joueurs très larges font l\'essentiel des gains.'),
    // ---- Niveau 2 : Joueur gagnant
    Q(2, 'maths2', 'Tu tiens A♠K♣, board A♦9♥4♣. Combos de AK restants pour l\'adversaire ?', ['6', '9', '12'], 0, '2 as restants × 3 rois restants = 6.'),
    Q(2, 'maths2', 'Pot 50, tapis effectifs 200 au flop. SPR ?', ['4', '2', '8'], 0, '200 ÷ 50.'),
    Q(2, 'preflop2', 'Le CO ouvre, tu es au bouton avec A♠5♠. Option souvent la plus rentable ?', ['3-bet (bluff à bloqueur, jouable)', 'Payer à chaque fois', 'Coucher'], 0, 'A5s bloque AA et AK, joue bien après le flop : 3-bet classique en position.'),
    Q(2, 'postflop', 'Tu relances au bouton, BB paie. Flop K♦7♣2♠, BB checke. Taille de c-bet la plus courante ?', ['Petite (≈ 1/3 du pot)', 'Overbet', 'Pas de mise'], 0, 'Board sec et haut qui favorise ta range : petite mise fréquente.'),
    Q(2, 'postflop', 'Contre une calling station, avec top paire bon kicker sur un board sec…', ['Mise trois rues', 'Check pour piéger', 'Mise le flop puis check'], 0, 'Elle paie : la valeur se prend en misant.'),
    Q(2, 'turnriver', 'River, tu as une paire moyenne et il checke. Tu mises pour la valeur si…', ['Des mains moins bonnes paient', 'Tu veux qu\'il couche', 'Le pot est gros'], 0, 'Une mise de valeur doit être payée par moins bon.'),
    Q(3, 'multiway', 'Pot à 4 joueurs, flop A♥8♥4♣. Tu as A♣T♦. Ta main vaut…', ['Moins qu\'en tête-à-tête : prudence', 'Plus qu\'en tête-à-tête', 'Pareil'], 0, 'À plusieurs, quelqu\'un a souvent mieux ou un tirage : la valeur requise monte.'),
    Q(2, 'adversaires', 'VPIP 50 / PFR 5. Plan ?', ['Valeur, pas de bluff, isole-le', 'Bluffe-le souvent', 'Évite-le'], 0, 'Fish passif : il paie, il ne couche pas.'),
    Q(2, 'fish', 'Tu as raté ton tirage à la river contre un joueur qui paie tout. Tu…', ['Abandonnes', 'Bluffes gros', 'Bluffes petit'], 0, 'On ne bluffe pas un joueur qui ne couche pas.'),
    Q(2, 'mental', 'Après deux bad beats, tu sens la colère monter. La règle ?', ['Pause, et arrêt si une décision émotionnelle suit', 'Jouer plus de mains pour te refaire', 'Changer de limite vers le haut'], 0, 'Le protocole anti-tilt s\'applique avant l\'erreur.'),
    Q(2, 'decision', 'Tu paies tapis avec QQ contre AK préflop et perds. La décision était…', ['Probablement bonne', 'Mauvaise puisqu\'elle a perdu', 'Impossible à juger'], 0, 'QQ est favorite (≈ 57 %) : on juge la décision, pas l\'issue.'),
    Q(2, 'discipline', 'Ta règle : stop-loss de 3 caves. Tu es à −3 caves sur une table très faible. Tu…', ['T\'arrêtes', 'Continues une heure', 'Doubles la limite'], 0, 'Une règle fixée avant la session ne se renégocie pas.'),
    Q(2, 'live', 'Partie live 1/2 € : deux limpers, tu relances avec AQ. Taille adaptée ?', ['≈ 7 bb', '≈ 2,5 bb', '≈ 20 bb'], 0, '4 à 5 bb + 1 par limper : les joueurs live paient beaucoup.'),
    Q(2, 'formats', 'Le format le plus utile pour mesurer ta progression ?', ['Cash game', 'Expresso', 'Gros tournois'], 0, 'Décisions comparables, winrate lisible plus vite.'),
    Q(2, 'tilt2', 'Après une grosse série gagnante, tu joues plus large « parce que tu es chaud ». C\'est…', ['Un tilt de confiance', 'Une adaptation correcte', 'De la gestion de bankroll'], 0, 'Les résultats récents ne changent pas les cotes.'),
    // ---- Niveau 3 : Avancé
    Q(3, 'theorie', 'River, tu mises la moitié du pot. Proportion de bluffs d\'équilibre ?', ['25 %', '33 %', '50 %'], 0, 'B ÷ (P + 2B) = 0,5 ÷ 2.'),
    Q(3, 'theorie', 'Ton adversaire couche 80 % face aux mises river. Meilleure réponse ?', ['Bluffer plus que l\'équilibre', 'Rester exactement à l\'équilibre', 'Ne plus bluffer'], 0, 'Contre une fuite stable, l\'exploitation rapporte plus.'),
    Q(3, 'ranges', 'UTG ouvre, tu paies au bouton. Flop A♠K♦7♣. Qui a l\'avantage de range ?', ['UTG', 'Toi', 'Personne'], 0, 'UTG a beaucoup plus d\'AK, AA, KK, AQ.'),
    Q(3, 'icm', 'Trois joueurs, prix 50/30/20, tapis 5 000 / 3 000 / 2 000. Le gros tapis vaut en ICM…', ['≈ 38 % du prize pool', '50 %', '≈ 25 %'], 0, 'Calcul exact : 38,4 %. Les jetons valent moins que leur part en ICM.'),
    Q(3, 'icm', 'Bulle, tapis moyen, le gros tapis pousse. Par rapport au cash, ton call doit être…', ['Plus serré', 'Plus large', 'Identique'], 0, 'La prime de risque ICM augmente l\'équité requise.'),
    Q(3, 'hu', 'Tête-à-tête, le bouton relance à 2,5 bb. Équité requise en grosse blinde pour payer ?', ['30 %', '40 %', '20 %'], 0, '1,5 ÷ 5 = 30 %.'),
    Q(3, 'profondeur', 'Tapis de 40 bb, quelles mains perdent le plus de valeur ?', ['Assorties connectées et petites paires', 'Paires hautes', 'AK'], 0, 'Moins de cotes implicites à 40 bb.'),
    Q(3, 'omaha', 'PLO, board K♥8♥3♣2♥. Tu as A♥Q♠J♠T♦. As-tu une couleur ?', ['Non', 'Oui, à l\'as', 'Oui, sans l\'as'], 0, 'Il faut exactement deux cartes de la main : un seul cœur ne suffit pas.'),
    Q(3, 'omaha', 'PLO : pot 100, mise de 50. Relance pot maximale ?', ['À 250', 'À 200', 'À 150'], 0, 'Call de 50 (pot 200), puis relance de 200.'),
    Q(3, 'variantes2', 'Short Deck : couleur contre full ?', ['La couleur gagne', 'Le full gagne', 'Partage'], 0, 'Avec 36 cartes, la couleur est plus rare.'),
    Q(3, 'stud', 'Stud : tu as 3 cœurs, 3 cœurs sont visibles chez des joueurs couchés. Tes outs couleur ?', ['7', '10', '9'], 0, '13 − 3 − 3.'),
    Q(3, 'mtt', 'Tournoi, 12 bb au bouton, tout le monde se couche. Ton jeu ?', ['Tapis ou couché', 'Relance à 2,5 bb', 'Limp'], 0, 'Sous 15 bb, on joue push/fold.'),
    Q(3, 'sizing', 'Un adversaire paie toutes les petites mises mais couche face aux grosses. Avec une main forte, tu mises…', ['Petit à moyen, sur plusieurs rues', 'Toujours très gros', 'Pas du tout'], 0, 'Choisis la plus grosse taille que ses mains moins bonnes paient encore.'),
    Q(3, 'lecture', 'Un joueur passif check-raise la turn sur un board sec. Sa range ?', ['Très forte', 'Surtout des bluffs', 'Des tirages'], 0, 'Les check-raises turn des passifs sont rarement des bluffs.'),
    Q(3, 'expresso', 'Expresso, tête-à-tête final à 10 bb au bouton. Tu pousses…', ['Une très large part des mains', 'Seulement les paires', 'Seulement AK et AA'], 0, 'À 10 bb en tête-à-tête, l\'équilibre pousse environ 58 % des mains.'),
    // ---- Niveau 4 : Élite
    Q(4, 'mdf', 'Il mise 2/3 du pot. MDF ?', ['60 %', '40 %', '67 %'], 0, 'P ÷ (P + B) = 1 ÷ 1,667.'),
    Q(4, 'mdf', 'Tu mises 75 % du pot à la river avec 14 combos de valeur. Bluffs d\'équilibre ?', ['6', '14', '3'], 0, '30 % de bluffs : 20 combos au total.'),
    Q(4, 'mdf', 'Pot 20, tapis 80, deux rues. Taille géométrique ?', ['100 % du pot', '50 %', '150 %'], 0, '((1 + 8)^(1/2) − 1) ÷ 2 = 1.'),
    Q(4, 'bloqueurs', 'River, couleur possible. Meilleur bluff ?', ['L\'as de la couleur sans paire', 'Une paire moyenne', 'Deux cartes basses sans rapport'], 0, 'L\'as bloque les couleurs à l\'as et une partie des calls.'),
    Q(4, 'bloqueurs', 'Comme bluff-catcher, tu préfères bloquer…', ['Sa valeur', 'Ses bluffs', 'Rien'], 0, 'Bloquer sa valeur augmente la part de bluffs restants.'),
    Q(4, 'avantage', 'BTN contre BB, flop K♠K♦4♣. Stratégie du bouton ?', ['Petite mise très fréquente', 'Overbet polarisé', 'Check systématique'], 0, 'Avantage de range net, peu de mains fortes chez BB.'),
    Q(4, 'oopplay', 'BB, flop 8♠7♠3♦, petite c-bet. Tu as 9♠6♠. Ligne fréquente ?', ['Check-raise', 'Coucher', 'Call puis coucher au turn'], 0, 'Gros tirage, board qui favorise ta range.'),
    Q(4, 'barrels', 'L\'overbet turn demande…', ['Avantage de nuts et range adverse plafonnée', 'Un board pairé', 'Une main moyenne'], 0, 'Sans avantage de nuts, il se fait exploiter.'),
    Q(4, 'deep', 'Call de 6 bb pour toucher un brelan. Gain moyen nécessaire quand tu touches ?', ['≈ 45 bb', '≈ 12 bb', '≈ 150 bb'], 0, '≈ 7,5 fois le call.'),
    Q(4, 'exploitpop', 'Fold to c-bet de 50 % sur 30 occasions. Conclusion ?', ['Très incertain (±18 points à 95 %)', 'Fuite certaine', 'Exact à 1 point près'], 0, 'Erreur type ≈ 9,1 points.'),
    Q(4, 'hud', 'WTSD 38 % et W$SD 44 %. Lecture ?', ['Il paie trop', 'Il bluffe trop', 'Il est très serré'], 0, 'Trop d\'abattages perdants.'),
    Q(4, 'icm2', 'PKO : quelle partie de la prime compte dans la décision immédiate ?', ['La part encaissée tout de suite', 'La prime entière', 'Aucune'], 0, 'L\'autre moitié s\'ajoute à ta propre prime.'),
    Q(4, 'solveurs', 'Ton adversaire ne bluffe jamais la river. L\'outil du solveur pour en tirer la meilleure réponse ?', ['Le node locking', 'Plus de tailles de mise', 'Un flop aléatoire'], 0, 'On verrouille sa stratégie et on recalcule.'),
    Q(4, 'perf', 'Une semaine à −10 caves sans erreur identifiée. Tu…', ['Revois les mains clés et ne changes que ce qui est prouvé', 'Changes toute ta stratégie', 'Montes de limite'], 0, 'La variance domine sur de petits échantillons.'),
    Q(4, 'analyste', 'Fold to 3-bet de 70 % sur 80 occasions. Intervalle à 95 % environ ?', ['60 à 80 %', '69 à 71 %', '40 à 100 %'], 0, 'Erreur type ≈ 5,1 points.'),
    // ---- Niveau 5 : Tables physiques
    Q(5, 'live_regles', 'Face à une mise de 40, tu poses un seul jeton de 100 sans rien dire. C\'est…', ['Un call', 'Une relance à 100', 'Une relance minimum'], 0, 'Sans annonce, un seul gros jeton est un call.'),
    Q(5, 'live_regles', 'Mise de 20, relance à 60. Relance minimum suivante ?', ['100', '80', '120'], 0, 'La relance précédente est de 40.'),
    Q(5, 'live_regles', 'Un fold hors tour est…', ['Définitif', 'Annulé', 'Pénalisé mais rejouable'], 0, 'Règle TDA.'),
    Q(5, 'live_debut', 'Tu arrives au casino. Pour jouer en cash, tu t\'inscris…', ['Sur la liste d\'attente auprès du floor', 'Directement à une table libre', 'À la caisse uniquement'], 0, 'Le floor gère les places.'),
    Q(5, 'live_strat', 'Un joueur passif live mise pot à la river. Avec top paire bon kicker, par défaut…', ['Tu couches', 'Tu relances', 'Tu paies toujours'], 0, 'Les grosses mises des passifs live sont presque toujours de la force.'),
    Q(5, 'live_strat', '+10 bb/100 en live à 30 mains par heure. Taux horaire ?', ['3 bb par heure', '10 bb par heure', '30 bb par heure'], 0, '10 × 30 ÷ 100.'),
    Q(5, 'live_tells', 'Selon l\'étude de Slepian et al. (2013), on lit mieux la force d\'une main en regardant…', ['Les bras et le geste de mise', 'Le visage', 'Les yeux'], 0, 'Le visage donnait des résultats pires que le hasard.'),
    Q(5, 'live_tells', 'Ta lecture de range est claire, mais un tell semble la contredire. Tu…', ['Suis la range', 'Suis le tell', 'Joues à pile ou face'], 0, 'Un tell ajuste une décision serrée, il ne renverse pas une lecture claire.'),
    Q(5, 'live_mtt', 'ROI de +20 % sur des tournois à 300 € avec 150 € de frais par tournoi. ROI réel ?', ['≈ −20 %', '≈ +20 %', '≈ 0 %'], 0, '60 € de gain moyen − 150 € de frais, sur 450 €.'),
    Q(5, 'deep', 'Straddle à 2 bb, tapis de 100 bb. Profondeur effective ?', ['50 straddles', '100 straddles', '200 straddles'], 0, 'Le straddle double les blindes.'),
    Q(5, 'eclair', 'Il mise 1/3 du pot. Équité requise ?', ['20 %', '25 %', '33 %'], 0, '1/3 ÷ (1 + 2/3).'),
    Q(5, 'eclair', 'Suite par les deux bouts au turn : chance de toucher à la river ?', ['≈ 17 %', '≈ 31 %', '≈ 9 %'], 0, '8 outs × 2.'),
    Q(5, 'home', 'Partie entre amis où personne ne se couche. Ton ajustement principal ?', ['Zéro bluff, valeur grosse', 'Bluffs fréquents', 'Jouer très peu de mains'], 0, 'On ne bluffe pas une table qui paie tout.'),
    Q(5, 'live_table', 'Un litige sur le montant d\'une mise. Tu…', ['Appelles le floor', 'Négocies avec le joueur', 'Fais voter la table'], 0, 'La décision appartient au floor.'),
    Q(5, 'live_tells', 'Un call instantané au flop indique souvent…', ['Une main plafonnée (paire, tirage)', 'Un brelan', 'Un bluff'], 0, 'Un brelan aurait souvent réfléchi à relancer.'),
    // ---- Niveau 6 : Professionnel
    Q(6, 'economie', '+4 bb/100, 300 mains par heure, NL100. Taux horaire ?', ['12 €', '4 €', '30 €'], 0, '4 × 300 ÷ 100 × 1 €.'),
    Q(6, 'economie', 'Winrate +4 bb/100, rake payé 10 bb/100. Tu bats tes adversaires de…', ['14 bb/100', '4 bb/100', '6 bb/100'], 0, 'Le rake prend plus que toi.'),
    Q(6, 'salaire', 'À NL200, 36 000 mains par mois, écart-type 90 bb/100. Écart-type du résultat mensuel ?', ['≈ 1 700 bb', '≈ 170 bb', '≈ 17 000 bb'], 0, '90 × √360.'),
    Q(6, 'salaire', 'Objectif : 2 000 € par mois en 120 heures. Taux horaire nécessaire ?', ['≈ 16,7 €', '≈ 8 €', '≈ 30 €'], 0, '2 000 ÷ 120.'),
    Q(6, 'staking', 'Markup de 1,2. L\'acheteur gagne si le ROI du joueur dépasse…', ['20 %', '12 %', '2 %'], 0, 'Il paie 120 pour 100 d\'action.'),
    Q(6, 'staking', 'Makeup 10 000 €, accord 50/50, le joueur gagne 25 000 €. Part du joueur ?', ['7 500 €', '12 500 €', '15 000 €'], 0, 'Les 10 000 premiers remboursent le makeup ; 15 000 partagés.'),
    Q(6, 'fiscal', 'Recettes de 20 000 € en micro-BNC (abattement 34 %). Montant imposable ?', ['13 200 €', '20 000 €', '6 800 €'], 0, '20 000 × 0,66.'),
    Q(6, 'fiscal', 'Frais réels à 45 % des recettes. Régime à étudier ?', ['Déclaration contrôlée', 'Micro-BNC', 'Aucun'], 0, 'Les frais réels dépassent l\'abattement forfaitaire.'),
    Q(6, 'carriere', 'Dépenses de 2 000 € par mois. Fonds de vie conseillé avant de passer pro ?', ['12 000 à 24 000 €', '2 000 €', '100 000 €'], 0, '6 à 12 mois de dépenses.'),
    Q(6, 'carriere', 'La voie la plus solide selon le module ?', ['Semi-pro avec un autre revenu', 'Pro à temps plein tout de suite', 'Arrêter les études'], 0, 'Moins de pression financière, de meilleures décisions.'),
    Q(6, 'marche', 'Part du cash game dans le produit brut du poker en ligne en France en 2025 (ANJ) ?', ['≈ 19 %', '≈ 68 %', '≈ 50 %'], 0, '100 M€ sur 525 M€.'),
    Q(6, 'business', 'Promouvoir une room sur un réseau social exige notamment…', ['L\'exclusion des mineurs activée et la mention -18 ans', 'Seulement un code promo', 'Rien de particulier'], 0, 'Loi du 9 juin 2023 sur l\'influence commerciale.'),
    Q(6, 'integrite', 'Échanger ses cartes par message avec un ami à la même table en ligne est…', ['De la collusion', 'Autorisé entre amis', 'Toléré en micro-limites'], 0, 'Sanctionné par la fermeture des comptes.'),
    Q(6, 'longevite', 'Signal d\'alerte le plus grave ?', ['Jouer l\'argent du quotidien', 'Faire une pause par semaine', 'Étudier le dimanche'], 0, 'Puiser dans l\'argent du quotidien.'),
    Q(6, 'progression', 'Critère pour quitter l\'étape 2 du plan de progression ?', ['Winrate positif sur 30 000 mains et bankroll pour NL10', '5 000 mains gagnantes', 'Un gros tournoi gagné'], 0, 'D\'après le tableau du module.'),
    // ---- v13 : questions des nouveaux modules
    Q(1, 'notation', 'Que désigne « ATs+ » ?', ['ATs, AJs, AQs, AKs', 'Tous les as', 'AT dépareillé et mieux'], 0, 'Le + monte jusqu\'à AKs, assorties seulement.'),
    Q(1, 'notation', 'Combien de combinaisons contient « KQ » sans précision ?', ['16', '12', '4'], 0, '4 assorties + 12 dépareillées.'),
    Q(1, 'probas', 'Sur 1 000 mains, combien de fois reçois-tu AA en moyenne ?', ['≈ 4,5', '≈ 17', '≈ 1'], 0, '1 main sur 221.'),
    Q(1, 'probas', 'Avec deux cartes assorties, probabilité de flopper un tirage couleur (deux de ta couleur) ?', ['≈ 11 %', '≈ 35 %', '≈ 1 %'], 0, 'C(11,2) × 39 ÷ C(50,3) ≈ 10,9 %.'),
    Q(1, 'probas', 'Tu as KK. Probabilité qu\'un adversaire précis ait AA ?', ['≈ 0,5 %', '≈ 5 %', '≈ 12 %'], 0, '6 ÷ 1 225.'),
    Q(2, 'textures', 'Ouvreur en position, flop A♥8♣3♦ arc-en-ciel. Plan le plus courant ?', ['Petite c-bet fréquente', 'Check systématique', 'Overbet'], 0, 'Board à l\'as qui favorise l\'ouvreur.'),
    Q(2, 'textures', 'Flop 8♥7♥6♣ : qui a l\'avantage de nuts en général ?', ['Le défenseur en grosse blinde', 'L\'ouvreur UTG', 'Personne'], 0, 'Suites et deux paires dans sa range.'),
    Q(2, 'tirages', 'A♥5♥ sur K♥8♥2♣ contre K♠Q♦ : équité ?', ['≈ 46 %', '≈ 20 %', '≈ 70 %'], 0, 'Moteur SIGMA 52 : 45,9 %.'),
    Q(2, 'tirages', 'Contre un joueur qui ne couche jamais, avec un tirage, l\'option préférée est souvent…', ['Payer', 'Semi-bluffer', 'Overbet'], 0, 'Pas de fold equity.'),
    Q(2, 'blindes', 'BB face à une ouverture à 2,5 bb : équité brute requise ?', ['30 %', '25 %', '40 %'], 0, '1,5 bb pour un pot de 5 bb.'),
    Q(2, 'blindes', 'En petite blinde face à une ouverture du CO, avec A♦J♣ ?', ['3-bet', 'Payer', 'Limp'], 0, '3-bet ou couché depuis la SB.'),
    Q(2, 'biais', '« J\'ai déjà mis la moitié de mon tapis, je dois payer. » Quel biais ?', ['Coût irrécupérable', 'Main chaude', 'Disponibilité'], 0, 'Seuls le prix et l\'équité actuels comptent.'),
    Q(2, 'biais', 'Tu montes de deux limites après six sessions gagnantes. Biais ?', ['Excès de confiance', 'Aversion à la perte', 'Ancrage'], 0, 'Six sessions ne mesurent pas un winrate.'),
    Q(3, 'pots3bet', 'SPR d\'un pot 3-bet en position à 100 bb (3-bet à 9 bb payé) ?', ['≈ 4,5', '≈ 12', '≈ 1,5'], 0, 'Pot ≈ 19,5 bb, ≈ 91 bb derrière.'),
    Q(3, 'pots3bet', 'Ton 3-bet est payé, flop K♦7♣2♥. C-bet typique ?', ['Petite (≈ 33 %) et fréquente', 'Grosse et rare', 'Check systématique'], 0, 'Avantage de range du 3-bettor.'),
    Q(3, 'tapiscourts', '18 bb en grosse blinde, le CO ouvre large à 2,2 bb, tu as A♦9♣. Plan ?', ['Tapis (resteal)', 'Call', 'Couché'], 0, 'Le call joue mal à 18 bb hors de position.'),
    Q(3, 'tapiscourts', 'Avec 9 bb au bouton, tout le monde se couche, tu as K♥8♦. ?', ['Tapis', 'Ouvrir à 2,5 bb', 'Coucher'], 0, 'Push/fold sous 12 bb.'),
    Q(3, 'satellites', 'Satellite, ta place est quasi assurée. Un tapis moyen pousse, tu as KK. ?', ['Coucher peut être correct', 'Payer toujours', 'Relancer'], 0, 'Gagner ne rapporte rien de plus.'),
    Q(3, 'satellites', 'Gros tapis à la bulle d\'un satellite : ta cible ?', ['Les tapis moyens', 'Les petits tapis', 'Personne'], 0, 'Ils ne peuvent pas payer.'),
    Q(3, 'plo2', 'PLO : J-T-7-6 sur 9-8-2. Outs pour une suite ?', ['20', '8', '12'], 0, 'Q, J, T, 7, 6, 5.'),
    Q(3, 'plo2', 'PLO : un brelan sur T♠9♠8♦ est…', ['Vulnérable', 'Les nuts', 'Imbattable'], 0, 'Suites possibles, tirages.'),
    Q(4, 'bluffcatch', 'Il mise le pot. Sa range : 10 combos de valeur, 4 de bluff. Tu paies ?', ['Non, de peu', 'Oui, largement', 'Toujours'], 0, '29 % de bluffs pour 33 % requis.'),
    Q(4, 'bluffcatch', 'Valeur 15, bluffs 20, mise de 75 % du pot. Décision à l\'équilibre ?', ['Payer', 'Coucher', 'Relancer'], 0, '57 % de bluffs pour 30 % requis… si ces bluffs existent vraiment.'),
    Q(4, 'polaris', 'Range fusionnée à la river : taille adaptée ?', ['Petite à moyenne', 'Overbet', 'Tapis'], 0, 'Être payé par moins bon.'),
    Q(4, 'polaris', 'Il a payé deux rues sans relancer sur un board dangereux : sa range est…', ['Plafonnée', 'Polarisée', 'Pleine de nuts'], 0, 'Il aurait relancé ses meilleures mains.'),
    Q(4, 'etudes', 'JJ sur A♠8♦3♣ contre une range UTG qui continue (TT+, AQ+, AJs, KQs) ?', ['≈ 24 %', '≈ 50 %', '≈ 65 %'], 0, 'Moteur SIGMA 52 : 23,5 %.'),
    Q(4, 'etudes', '8♠8♦ sur 9♣8♥4♥ contre A♥9♥ ?', ['≈ 70 %', '≈ 50 %', '≈ 90 %'], 0, 'Moteur SIGMA 52 : 70,2 %.'),
    Q(5, 'notes_live', '+120 € en 5 heures à 1/2 €. Résultat en bb par heure ?', ['12', '24', '60'], 0, '60 bb ÷ 5 h.'),
    Q(5, 'notes_live', 'Quand prendre une note sur une main en live ?', ['Après la main, hors action', 'Pendant la main', 'Le lendemain seulement'], 0, 'Aucun appareil pendant une main.'),
    Q(6, 'histoire', 'Quelle IA a battu des pros à six joueurs en 2019 ?', ['Pluribus', 'Libratus', 'Cepheus'], 0, 'Carnegie Mellon et Facebook.'),
    Q(6, 'histoire', 'Algorithme commun aux solveurs modernes ?', ['CFR (minimisation du regret)', 'Tirage aléatoire', 'Règles écrites à la main'], 0, 'Base de Libratus, Pluribus et des solveurs.'),
    Q(6, 'bankroll2', '4 bb/100, écart-type 90, 30 caves. Risque de ruine approximatif ?', ['≈ 5 %', '≈ 0,1 %', '≈ 30 %'], 0, 'e^(−2 × 4 × 3 000 ÷ 8 100).'),
    Q(6, 'bankroll2', 'Bankroll de 2 600 € en NL50 : peux-tu tenter NL100 (essai à 50 caves) ?', ['Non, il faut 5 000 €', 'Oui', 'Oui, avec 10 caves'], 0, '50 caves de 100 €.'),
    Q(3, 'shortdeck2', 'Short Deck : outs d\'un tirage couleur au flop ?', ['5', '9', '8'], 0, '9 cartes par couleur moins 4 visibles.'),
    Q(3, 'limit', 'Limit, pot de 40 à la river, mise de 4. Équité requise ?', ['≈ 8 %', '≈ 25 %', '≈ 33 %'], 0, '4 ÷ 48.'),
    Q(2, 'tailles', 'Tu 3-bettes depuis la BB face à une ouverture de 2,5 bb. Taille courante ?', ['≈ 10 bb', '≈ 5 bb', '≈ 25 bb'], 0, 'Environ 4 fois hors de position.'),
    Q(2, 'variance', 'Joueur à +4 bb/100 (écart-type 90) : chance d\'être perdant sur 10 000 mains ?', ['≈ 33 %', '≈ 3 %', '≈ 70 %'], 0, '400 bb attendus, 900 bb d\'écart-type.'),
    Q(3, 'ev', 'Pot 80, bluff de 60, il couche 45 %. EV ?', ['≈ +3', '≈ −11', '≈ +36'], 0, '36 − 33.'),
    Q(3, 'hu_final', 'Tête-à-tête final, 1 000 / 600 €, tu as 60 % des jetons. Partage au prorata ?', ['840 €', '960 €', '800 €'], 0, '600 + 0,6 × 400.'),
  ];

  // Tirage sans remise.
  const pick = (arr, n, rand) => { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out; };
  // Examen d'un niveau : 12 questions de la banque + 8 des quiz de modules du niveau.
  function examQuestions(K, level, rand = Math.random) {
    const bank = BANK.filter((q) => q.level === level);
    const quiz = K.MODULES.filter((m) => m.level === level).flatMap((m) => m.quiz.map((q) => ({ ...q, level, mod: m.id })));
    return pick(pick(bank, 12, rand).concat(pick(quiz, 20 - Math.min(12, bank.length), rand)), 20, rand);
  }
  const PASS = 0.8;
  // Test de positionnement : 4 questions par niveau (3 de la banque, 1 de quiz), 24 au total.
  function placementQuestions(K, rand = Math.random) {
    const out = [];
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const quiz = K.MODULES.filter((m) => m.level === level).flatMap((m) => m.quiz.map((q) => ({ ...q, level, mod: m.id })));
      out.push(...pick(BANK.filter((q) => q.level === level), 3, rand), ...pick(quiz, 1, rand));
    }
    return out;
  }
  // Niveau conseillé : le premier niveau avec moins de 3 bonnes réponses sur 4 ; 7 = tout validé.
  function placementLevel(answers) {
    for (const level of [1, 2, 3, 4, 5, 6]) { const a = answers.filter((x) => x.level === level); if (a.length && a.filter((x) => x.ok).length < Math.ceil(a.length * 0.75)) return level; }
    return 7;
  }
  const api = { BANK, PASS, examQuestions, placementQuestions, placementLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Exams = api;
})(typeof window !== 'undefined' ? window : globalThis);
