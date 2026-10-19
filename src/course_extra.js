// Cours — compléments : module « Jouer en ligne en pro » (niveau 2) et approfondissement des modules courts
// (questions de quiz supplémentaires, renvois vers les niveaux Élite et Tables physiques).
(function (root) {
  function register(K) {
    K.mod({
      id: 'online2', level: 2, title: 'Jouer en ligne en pro : poste, multi-table, outils autorisés', drill: 'rfi',
      goals: ['Installer un poste de jeu qui évite les erreurs de clic et de temps', 'Augmenter le volume sans perdre en qualité', 'Savoir exactement ce qui est autorisé et ce qui fait fermer un compte'],
      sections: [
        ['Le poste de jeu', `<ul><li>Un écran assez grand pour voir chaque table sans chevauchement (ou deux écrans) ; tables en mosaïque, jamais en cascade.</li>
          <li>Boutons de mise préréglés : 33, 50, 75 et 100 % du pot au flop ; ouverture à 2,5 bb ; 3-bet à 3 fois en position et 4 fois hors de position.</li>
          <li>Alerte sonore quand c'est à toi, réserve de temps (« time bank ») réservée aux grosses décisions.</li>
          <li>Connexion stable, notifications du téléphone et de l'ordinateur coupées.</li></ul>`],
        ['Combien de tables', `<ol><li>Commence à 2 tables ; passe à 3 puis 4 quand ton winrate se maintient sur au moins 20 000 mains et que tu ne rates plus de décisions par manque de temps.</li>
          <li>Chaque table ajoutée baisse un peu ton winrate par main : le bon nombre maximise <em>winrate × mains par heure</em>, pas les mains.</li>
          <li>Le format rapide (« fast-fold » : Go Fast chez Winamax, Zoom chez PokerStars) te change de table à chaque coucher : beaucoup de mains, peu d'informations sur chaque adversaire. Les tables classiques permettent d'exploiter un fish identifié.</li></ul>`],
        ['Sélection de table et horaires', `<ul><li>Les récréatifs jouent surtout le soir et le week-end : concentre ton volume sur ces créneaux.</li>
          <li>Repère les tables avec un gros pot moyen et un pourcentage élevé de joueurs au flop ; quitte une table quand le fish qui la rendait rentable s'en va.</li>
          <li>Place-toi à gauche des joueurs faibles quand le client permet de choisir sa place.</li></ul>`],
        ['Ce qui est autorisé, ce qui est interdit', `<table class="t"><thead><tr><th>Outil</th><th>Statut sur le marché français</th></tr></thead><tbody>
          <tr><td>Aide en temps réel (solveur, tableau, programme ou personne qui conseille pendant la main)</td><td><strong>Interdit</strong> partout : fermeture de compte, gains confisqués</td></tr>
          <tr><td>HUD tiers en temps réel</td><td>Interdit ou très restreint (Winamax interdit les HUD dynamiques de logiciels tiers ; PokerStars publie une liste limitée) : vérifie la page officielle de ta room</td></tr>
          <tr><td>Statistiques et notes intégrées au client</td><td>Autorisées (fournies par la room)</td></tr>
          <tr><td>Analyse de tes historiques après la session</td><td>Autorisée : c'est le rôle de l'onglet Analyse</td></tr>
          <tr><td>Prêter son compte, jouer sur celui d'un autre</td><td>Interdit</td></tr>
          <tr><td>Scripts qui s'inscrivent ou s'assoient automatiquement</td><td>Généralement interdits : vérifie les conditions de la room</td></tr></tbody></table>
          <p>Règle simple : SIGMA 52 se ferme quand tu ouvres le client de jeu. En cas de doute sur un logiciel, demande par écrit au support et garde la réponse.</p>`],
        ['Sécurité du compte', `<ul><li>Active la double authentification si ta room la propose ; mot de passe unique dans un gestionnaire.</li>
          <li>Ne joue jamais depuis l'ordinateur ou le compte de quelqu'un d'autre.</li>
          <li>Retire régulièrement l'argent qui dépasse ta bankroll de jeu.</li></ul>`],
        ['Données et suivi', `<p>Active l'enregistrement des historiques de mains dans le client. Après chaque session : importe-les dans Analyse, marque les mains à revoir, envoie les plus importantes au Replayer puis au Solveur, et saisis la session dans le Journal. Le rake reversé par les programmes de fidélité fait partie de ton taux horaire : note-le.</p>`],
      ],
      mistakes: ['Ajouter des tables tant que le winrate n\'est pas stable', 'Installer un HUD ou un outil sans vérifier la règle de la room', 'Laisser SIGMA 52 ou un solveur ouvert pendant la session', 'Jouer aux heures où il n\'y a que des réguliers'],
      keys: ['Winrate × mains par heure, pas les mains seules', 'Aide en temps réel = interdite partout', 'HUD tiers : vérifier la page officielle', 'Historiques activés, analyse après la session'],
      quiz: [
        ['Quand passer de 2 à 3 tables ?', ['Quand le winrate tient sur ≥ 20 000 mains sans décisions précipitées', 'Après une bonne soirée'], 0, 'Le volume ne vaut que si la qualité suit.'],
        ['Un ami te conseille par message pendant que tu joues. C\'est…', ['Autorisé entre amis', 'De l\'aide en temps réel, interdite'], 1, 'Toute aide extérieure pendant le jeu est sanctionnée.'],
        ['Format qui te donne le moins d\'informations sur chaque adversaire ?', ['Tables classiques', 'Fast-fold (Go Fast, Zoom)'], 1, 'Tu changes d\'adversaires à chaque main.'],
        ['Statistiques intégrées au client de la room : utilisation pendant le jeu ?', ['Autorisée', 'Interdite'], 0, 'Elles sont fournies par la room elle-même.'],
      ],
    });

    // Compléments : renvois et quiz supplémentaires pour les modules courts.
    const more = {
      online: { quiz: [
        ['Tu peux enregistrer les historiques de mains dans le client. Tu…', ['Les gardes et les analyses après la session', 'Les désactives'], 0, 'Sans historique, pas d\'analyse ni de replayer.'],
        ['Fast-fold : principal changement ?', ['Nouvelle table et nouveaux adversaires à chaque coucher', 'Blindes plus petites'], 0, 'Plus de mains par heure, moins d\'informations par adversaire.'],
      ], sections: [['Pour aller plus loin', '<p>Le module « Jouer en ligne en pro » (niveau 2) détaille le poste de jeu, le multi-table, les horaires et la liste de ce qui est autorisé ou interdit.</p>']] },
      live: { quiz: [
        ['Façon la plus sûre de relancer en salle ?', ['Annoncer « relance à X » puis poser les jetons', 'Poser les jetons en deux fois'], 0, 'L\'annonce engage ; deux gestes = string bet.'],
        ['Taille d\'ouverture en live petites limites contre des joueurs qui paient beaucoup ?', ['2 bb', '4 à 6 bb'], 1, 'Ils paient presque autant : prends plus de valeur.'],
      ], sections: [['Pour aller plus loin', '<p>Le niveau 5 « Tables physiques » couvre l\'accès aux salles en France, les règles de procédure TDA, la stratégie live, les tells, la gestion de table et les festivals.</p>']] },
      adversaires: { quiz: [
        ['VPIP 50 / PFR 5 sur 300 mains. Profil ?', ['Fish passif', 'Nit'], 0, 'Il joue une main sur deux et relance rarement.'],
        ['Un call instantané au flop indique souvent…', ['Une main plafonnée (pas les nuts)', 'Les nuts'], 0, 'Avec un set, il aurait souvent réfléchi à relancer.'],
      ] },
      mental: { quiz: [
        ['Une règle d\'arrêt efficace est…', ['Écrite avant de jouer', 'Décidée selon les sensations du moment'], 0, 'En session, le jugement est biaisé par le résultat.'],
        ['Après un bad beat, la bonne question ?', ['Ma décision était-elle +EV ?', 'Pourquoi ça m\'arrive toujours ?'], 0, 'Juger la décision, pas le résultat.'],
      ] },
      formats: { quiz: [
        ['Format le plus volatil ?', ['Cash game 6-max', 'Expresso / Spin'], 1, 'Multiplicateur aléatoire et parties courtes : variance énorme.'],
      ] },
      lecture: { quiz: [
        ['À chaque action adverse, sa range…', ['Se resserre ou se polarise selon la ligne', 'Reste la même'], 0, 'Chaque action retire des mains de sa range.'],
        ['Il mise le pot river. Tu comptes 10 combos de valeur et 10 de bluff. Décision ?', ['Payer', 'Coucher'], 0, '50 % de bluffs, il en faut 33 %.'],
      ] },
      multiway: { quiz: [
        ['Pot à 4 joueurs, top paire faible kicker. Plan par défaut ?', ['Contrôler le pot', 'Engager le tapis'], 0, 'En multiway, quelqu\'un a souvent mieux.'],
        ['En multiway, ta range de mise doit être…', ['Plus forte qu\'en tête-à-tête', 'Plus large'], 0, 'Plusieurs adversaires = plus de chances qu\'un paie avec mieux.'],
      ] },
      expresso: { quiz: [
        ['À 3 joueurs, ta range d\'ouverture au bouton est…', ['Plus large qu\'en 6-max', 'Plus serrée qu\'en 6-max'], 0, 'Moins de joueurs derrière : mains plus fortes relativement.'],
      ] },
      mtt: { quiz: [
        ['Réentrée : effet sur ton ROI ?', ['Chaque réentrée est un buy-in de plus', 'Aucun'], 0, 'Le ROI se calcule sur la somme réellement investie.'],
        ['Sur la bulle, le gros tapis doit…', ['Attaquer les tapis moyens', 'Attendre les mains premium'], 0, 'Les tapis moyens ne peuvent pas payer sans prime de risque élevée.'],
      ], sections: [['Pour aller plus loin', '<p>Le module Élite « Tournois avancés » chiffre la prime de risque ICM et la valeur des primes en PKO.</p>']] },
      etude: { quiz: [
        ['Quand étudier une grosse perte ?', ['À froid, le lendemain', 'Tout de suite, à chaud'], 0, 'L\'émotion biaise l\'analyse.'],
      ], sections: [['Pour aller plus loin', '<p>Le module Élite « Les solveurs » donne une méthode d\'étude en six étapes, à appliquer avec l\'onglet Solveur.</p>']] },
      carriere: { quiz: [
        ['Critère le plus solide avant de passer pro ?', ['Winrate positif sur un gros échantillon et fonds de vie', 'Une très bonne semaine'], 0, 'Un critère chiffré, pas une impression.'],
      ] },
      staking: { quiz: [
        ['Après une série de pertes financée par un backer, le premier gain sert à…', ['Effacer le makeup', 'Être partagé tout de suite'], 0, 'Le makeup se rembourse avant tout partage.'],
      ] },
      business: { quiz: [
        ['Les revenus de coaching poker…', ['Se déclarent comme toute activité', 'N\'ont pas à être déclarés'], 0, 'C\'est un revenu d\'activité.'],
      ] },
      fiscal: { quiz: [
        ['Gains de jeu d\'un joueur récréatif en France ?', ['En principe non imposés', 'Toujours imposés en BNC'], 0, 'L\'imposition vise le joueur dont le poker est l\'activité habituelle et lucrative.'],
      ] },
      integrite: { quiz: [
        ['Échanger ses cartes par message avec un ami à la même table en ligne ?', ['Collusion, interdite', 'Toléré'], 0, 'Fermeture de compte et confiscation possibles.'],
        ['Consulter un solveur entre deux mains, tables ouvertes ?', ['Interdit (aide en temps réel)', 'Autorisé'], 0, 'Note la main, étudie après.'],
      ] },
      longevite: { quiz: [
        ['Signal d\'alerte le plus grave ?', ['Jouer de l\'argent nécessaire à la vie courante', 'Perdre une session'], 0, 'C\'est le signe d\'un jeu problématique : parles-en, l\'interdiction volontaire existe.'],
        ['Une routine durable comprend…', ['Pauses, sport, sommeil, jours sans poker', 'Jouer chaque jour le plus longtemps possible'], 0, 'La qualité de décision dépend de la récupération.'],
      ] },
      progression: { quiz: [
        ['Quel indicateur montre ta progression le plus tôt ?', ['La qualité de tes décisions (spots, revues)', 'Le résultat du mois'], 0, 'Les résultats sont trop bruités à court terme.'],
        ['Condition pour monter de limite ?', ['Bankroll suffisante pour la limite visée et winrate positif sur un échantillon solide', 'Une série de gains'], 0, 'Deux critères chiffrés.'],
      ] },
    };
    for (const [id, x] of Object.entries(more)) K.extend(id, x);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = register; else register(root.Course);
})(typeof window !== 'undefined' ? window : globalThis);
