// Calculs sans interface pour la carrière et la progression : simulateur de carrière sur 12 mois, critères de passage pro,
// classement Elo, ligue hebdomadaire, indice de chance, check-in avant session, carte de tilt (données par défaut).
(function (root) {
  // ---------- Hasard reproductible ----------
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  // Fonction de répartition de la loi normale (Abramowitz et Stegun 26.2.17, erreur < 7,5e-8).
  function normCdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989422804014327 * Math.exp(-z * z / 2);
    const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z >= 0 ? 1 - p : p;
  }
  const quant = (sorted, q) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))] : 0;

  // ---------- Limites ----------
  const STAKES = [['NL2', 0.02], ['NL5', 0.05], ['NL10', 0.1], ['NL25', 0.25], ['NL50', 0.5], ['NL100', 1], ['NL200', 2], ['NL500', 5]];
  const stakeIndex = (name) => Math.max(0, STAKES.findIndex(([n]) => n === String(name || '').toUpperCase()));

  // ---------- Simulateur de carrière ----------
  // Chaque mois : 4 blocs de mains (gain ~ loi normale de moyenne winrate × mains et d'écart-type σ × √(mains/100)),
  // montée de limite dès que la bankroll couvre `rule` caves de la limite suivante, descente sous `down` caves de la limite jouée,
  // le winrate baisse de `drop` bb/100 par limite au-dessus de la limite de départ (adversaires plus forts),
  // puis retrait des dépenses du mois. Ruine : bankroll sous 10 caves de NL2 (20 €), la carrière s'arrête.
  function careerSim(o) {
    const P = { bank: 1000, stake: 2, wr: 5, sd: 90, hoursMonth: 80, handsHour: 200, months: 12, rule: 40, down: 25, drop: 1.5, expenses: 0, target: 0, paths: 2000, seed: 7, ...o };
    const r = rng(P.seed), handsMonth = Math.max(0, P.hoursMonth * P.handsHour), step = handsMonth / 4, ruinAt = 10 * 100 * STAKES[0][1];
    const fan = Array.from({ length: P.months + 1 }, () => []), finals = [], incomes = [], stakesEnd = new Array(STAKES.length).fill(0);
    let ruined = 0, hitTarget = 0, losingMonths = 0, covered = 0, peakStake = 0;
    for (let p = 0; p < P.paths; p++) {
      let b = P.bank, k = Math.min(STAKES.length - 1, Math.max(0, P.stake)), dead = false, inc = 0, lm = 0, cov = 0, top = k;
      fan[0].push(b);
      for (let m = 1; m <= P.months; m++) {
        if (dead) { fan[m].push(0); continue; }
        const start = b;
        for (let s = 0; s < 4 && step > 0; s++) {
          const wr = P.wr - P.drop * Math.max(0, k - P.stake) + 0.5 * P.drop * Math.max(0, P.stake - k);
          b += (wr * step / 100 + P.sd * Math.sqrt(step / 100) * gauss(r)) * STAKES[k][1];
          if (k < STAKES.length - 1 && b >= P.rule * 100 * STAKES[k + 1][1]) k++;
          else if (k > 0 && b < P.down * 100 * STAKES[k][1]) k--;
          top = Math.max(top, k);
        }
        const won = b - start; inc += won; if (won < 0) lm++;
        b -= P.expenses;
        if (b < ruinAt) { dead = true; fan[m].push(Math.max(0, b)); continue; }
        cov++; fan[m].push(b);
      }
      if (dead) ruined++; else stakesEnd[k]++;
      if (cov === P.months) covered++;
      finals.push(dead ? 0 : b); incomes.push(inc / P.months); losingMonths += lm; peakStake += top;
      if (!dead && inc / P.months >= P.target) hitTarget++;
    }
    const sortN = (a) => a.slice().sort((x, y) => x - y);
    const fs = sortN(finals), is = sortN(incomes);
    return {
      params: P, handsMonth,
      pRuin: ruined / P.paths, pTarget: hitTarget / P.paths, pCovered: covered / P.paths,
      final: { p10: quant(fs, 0.1), p50: quant(fs, 0.5), p90: quant(fs, 0.9) },
      income: { p10: quant(is, 0.1), p50: quant(is, 0.5), p90: quant(is, 0.9), mean: is.reduce((a, x) => a + x, 0) / is.length },
      losingMonths: losingMonths / P.paths, peakStake: peakStake / P.paths,
      stakesEnd: stakesEnd.map((n) => n / P.paths),
      fan: fan.map((col) => { const s = sortN(col); return [0.1, 0.25, 0.5, 0.75, 0.9].map((q) => quant(s, q)); }),
    };
  }
  // Risque de ruine (formule de diffusion) : exp(−2 × winrate × bankroll en bb ÷ σ²), winrate et σ en bb/100.
  const riskOfRuin = (wr, sd, bankBB) => (wr <= 0 ? 1 : Math.exp(-2 * wr * bankBB / (sd * sd)));

  // ---------- Critères de passage pro ----------
  // Repères courants, pas des lois : à adapter à ta situation. Chaque critère : ok, proche, non ou à renseigner.
  function proCriteria(d) {
    const out = [], add = (k, label, st, val, need, tip, critical) => out.push({ k, label, st, val, need, tip, critical: !!critical });
    const lvl = (v, ok, near, higherIsBetter = true) => (v === null || v === undefined || Number.isNaN(v) ? 'na' : higherIsBetter ? (v >= ok ? 'ok' : v >= near ? 'near' : 'no') : (v <= ok ? 'ok' : v <= near ? 'near' : 'no'));
    const bb = d.bbValue || null, hasWr = d.wr !== null && d.wr !== undefined && d.hands > 0;
    add('volume', 'Échantillon de mains', lvl(d.hands || 0, 50000, 20000), d.hands || 0, '50 000 mains cash', 'Sous 50 000 mains, l\'intervalle de confiance du winrate reste trop large pour décider.', false);
    add('proof', 'Winrate prouvé', hasWr ? (d.wr - d.ci > 0 ? 'ok' : d.wr > 0 ? 'near' : 'no') : 'na', hasWr ? d.wr - d.ci : null, 'borne basse de l\'intervalle à 95 % au-dessus de 0', 'Tant que l\'intervalle contient 0, tes résultats peuvent venir de la chance.', true);
    const hourly = hasWr && bb ? d.wr / 100 * (d.handsHour || 0) * bb : null, needH = d.target && d.hoursMonth ? d.target / d.hoursMonth : null;
    add('hourly', 'Gain horaire attendu', hourly === null || needH === null ? 'na' : lvl(hourly, needH, needH * 0.6), hourly, needH === null ? 'objectif de revenu et heures à renseigner' : `${needH.toFixed(2).replace('.', ',')} €/h pour ton objectif`, 'Winrate × mains par heure × valeur de la grosse blinde. Monte de limite ou de volume si tu es en dessous.', false);
    const caves = bb ? d.bank / (100 * bb) : null;
    add('caves', 'Bankroll en caves', lvl(caves, 50, 30), caves, '50 caves de ta limite', 'Un joueur qui vit du poker ne peut pas redéposer : il lui faut plus que les 40 caves d\'un amateur.', true);
    const ror = hasWr && bb ? riskOfRuin(d.wr, d.sd || 90, d.bank / bb) : null;
    add('ror', 'Risque de ruine', ror === null ? 'na' : lvl(ror, 0.01, 0.05, false), ror, '1 % au plus', 'Calculé avec ton winrate, ton écart-type et ta bankroll en bb, sans retraits.', false);
    const months = d.expenses > 0 ? (d.savings || 0) / d.expenses : null;
    add('fund', 'Fonds de vie hors bankroll', lvl(months, 6, 3), months, '6 mois de dépenses', 'Les dépenses ne doivent jamais être prélevées pendant un downswing : c\'est ce qui ruine les nouveaux pros.', true);
    add('hours', 'Heures jouées et notées', lvl(d.hours || 0, 500, 200), d.hours || 0, '500 heures', 'Le volume dit si tu tiens le rythme d\'un temps plein, pas seulement si tu gagnes.', false);
    const recent = (d.sessions || []).slice(-30), tiltShare = recent.length >= 10 ? recent.filter((s) => (s.tilt || 0) >= 2).length / recent.length : null;
    add('tilt', 'Discipline (sessions en tilt net ou fort)', lvl(tiltShare, 0.1, 0.2, false), tiltShare, '10 % des 30 dernières sessions au plus', 'Le tilt coûte plus que n\'importe quelle fuite technique. Voir l\'onglet Mental.', false);
    add('study', 'Formation (examens de niveau validés)', lvl(d.exams || 0, 4, 2), d.exams || 0, 'niveaux 1 à 4', 'Les examens des niveaux 1 à 4 couvrent ce qu\'un régulier gagnant doit maîtriser.', false);
    const sim = d.sim;
    add('sim', 'Simulation sur 12 mois', !sim ? 'na' : sim.pRuin <= 0.05 && sim.pTarget >= 0.5 ? 'ok' : sim.pRuin <= 0.15 ? 'near' : 'no', sim ? sim.pRuin : null, 'ruine ≤ 5 % et objectif atteint une fois sur deux', 'Avec tes chiffres, dépenses retirées chaque mois.', true);
    const ok = out.filter((c) => c.st === 'ok').length, critNo = out.some((c) => c.critical && (c.st === 'no' || c.st === 'na'));
    const verdict = ok === out.length ? 'ready' : ok >= 7 && !critNo ? 'close' : 'not';
    return { list: out, ok, n: out.length, verdict };
  }

  // ---------- Elo ----------
  // Difficulté fixe par type d'exercice : à l'équilibre, ton Elo vaut d + 400 × log10(réussite ÷ échec).
  const SPOT_D = { rfi: 1000, vsopen: 1150, odds: 1100, tirage: 1150, pushfold: 1250, outs: 1050, meilleure: 1200, situations: 1300, mdf: 1250, combos: 1350, bounty: 1400 };
  const DEC_D = { rfi: 1050, iso: 1150, pfdef: 1200, odds: 1200, value: 1250, nobluff: 1150, bluff: 1300, pushfold: 1250 };
  const LEVEL_BONUS = { Facile: 0, Moyen: 50, Difficile: 150, 'Très difficile': 300 };
  const ELO_TITLES = [[0, 'Débutant'], [1000, 'Amateur'], [1200, 'Régulier'], [1400, 'Fort'], [1600, 'Expert'], [1800, 'Élite']];
  const eloTitle = (r) => ELO_TITLES.filter(([x]) => r >= x).pop()[1];
  const expected = (r, d) => 1 / (1 + Math.pow(10, (d - r) / 400));
  function eloUpdate(E, d, score, day) {
    E.r = E.r ?? 1000; E.n = E.n || 0;
    const K = E.n < 30 ? 40 : E.n < 200 ? 24 : 16, delta = K * (score - expected(E.r, d));
    E.r = Math.round((E.r + delta) * 10) / 10; E.n++; E.best = Math.max(E.best || 0, E.r);
    if (day) { E.hist = E.hist || []; const last = E.hist[E.hist.length - 1]; if (last && last[0] === day) last[1] = E.r; else E.hist.push([day, E.r]); if (E.hist.length > 120) E.hist.shift(); }
    return delta;
  }

  // ---------- Ligue hebdomadaire ----------
  const DIVS = ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant'], DIV_MED = [250, 450, 700, 1000, 1400], PROMOTE = 5, DEMOTE = 5, SIZE = 20;
  const XP = { spot: 10, spotOk: 5, decision: 4, decisionOk: 2, hand: 1, module: 40, exam: 120, champ: 30, solve: 15, trainer: 8, srs: 3 };
  const RIVALS = ['Léa', 'Malik', 'Inès', 'Hugo', 'Sacha', 'Nora', 'Yanis', 'Camille', 'Théo', 'Jade', 'Rayan', 'Manon', 'Elias', 'Zoé', 'Adam', 'Lina', 'Noah', 'Chloé', 'Sami', 'Louise', 'Ilyes', 'Margaux', 'Nathan', 'Anaïs'];
  // Semaine ISO « 2026-W43 » et fraction écoulée depuis lundi 0 h (heure locale).
  function weekKey(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
    return `${y}-W${String(w).padStart(2, '0')}`;
  }
  function weekFrac(d = new Date()) { const day = (d.getDay() + 6) % 7; return Math.min(1, (day * 24 + d.getHours() + d.getMinutes() / 60) / 168); }
  // Rivaux simulés (pas de vrais joueurs) : XP finale tirée autour de la médiane de la division, révélée au fil de la semaine.
  function rivals(week, div) {
    const r = rng(hash(week + ':' + div)), names = RIVALS.slice();
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    return names.slice(0, SIZE - 1).map((name) => ({ name, final: Math.round(DIV_MED[div] * Math.exp(0.55 * gauss(r))), curve: 0.7 + 0.6 * r() }));
  }
  function standings(L, now = new Date(), frac = weekFrac(now)) {
    const rows = rivals(L.week, L.div).map((x) => ({ name: x.name, xp: Math.round(x.final * Math.pow(frac, x.curve)) }));
    rows.push({ name: 'Toi', xp: L.xp || 0, me: true });
    rows.sort((a, b) => b.xp - a.xp || (a.me ? -1 : b.me ? 1 : 0));
    return rows.map((x, i) => ({ ...x, rank: i + 1 }));
  }
  // Clôture de la semaine stockée si une nouvelle semaine a commencé : montée (5 premiers), descente (5 derniers).
  function leagueRoll(L, now = new Date()) {
    const wk = weekKey(now);
    if (!L.week) { L.week = wk; L.div = L.div || 0; L.xp = 0; L.hist = L.hist || []; return null; }
    if (L.week === wk) return null;
    const rank = standings(L, now, 1).find((x) => x.me).rank, from = L.div;
    let move = 0;
    if (rank <= PROMOTE && L.div < DIVS.length - 1) move = 1; else if (rank > SIZE - DEMOTE && L.div > 0) move = -1;
    L.hist = L.hist || []; L.hist.push({ week: L.week, div: from, rank, xp: L.xp || 0, move }); if (L.hist.length > 52) L.hist.shift();
    L.div = from + move; L.week = wk; L.xp = 0;
    return { rank, move, from, to: L.div };
  }
  const MEDALS = [[7, 'Bronze'], [30, 'Argent'], [100, 'Or']];
  const medalOf = (streak) => { const got = MEDALS.filter(([n]) => streak >= n).pop(), next = MEDALS.find(([n]) => streak < n); return { got: got ? got[1] : null, next: next ? { name: next[1], need: next[0], left: next[0] - streak } : null }; };

  // ---------- Indice de chance ----------
  // Trois mesures indépendantes, chacune en écart-types (z) et en percentile :
  // tapis (gain réel moins équité × pot), mains premium reçues (QQ+, AK : 34 combinaisons sur 1 326), sets floppés avec une paire servie (≈ 11,8 %).
  const P_PREM = 34 / 1326, P_SET = 1 - (48 * 47 * 46) / (50 * 49 * 48);
  function luck(me) {
    const out = {};
    const al = me.allins || [];
    if (al.length) {
      let l = 0, v = 0; for (const a of al) { const pot = a.pot / a.bb; l += a.luck / a.bb; v += a.eq * (1 - a.eq) * pot * pot; }
      const sd = Math.sqrt(v); out.allin = { n: al.length, bb: l, sd, z: sd ? l / sd : 0 }; out.allin.pct = normCdf(out.allin.z);
    }
    const bin = (k, n, p) => { if (!n) return null; const sd = Math.sqrt(n * p * (1 - p)), z = (k - n * p) / sd; return { n, k, exp: n * p, z, pct: normCdf(z) }; };
    if (me.dealt) out.prem = bin(me.dealt.prem, me.dealt.n, P_PREM);
    if (me.sets) out.sets = bin(me.sets.hit, me.sets.n, P_SET);
    const zs = ['allin', 'prem', 'sets'].map((k) => out[k]).filter(Boolean);
    // Indice global : moyenne pondérée des z (le tapis compte double, c'est lui qui pèse sur le résultat).
    if (zs.length) { const w = (k) => (k === 'allin' ? 2 : 1); let sw = 0, sz = 0; for (const k of ['allin', 'prem', 'sets']) if (out[k]) { sw += w(k) * w(k); sz += w(k) * out[k].z; } out.z = sz / Math.sqrt(sw); out.pct = normCdf(out.z); }
    return out;
  }

  // ---------- Check-in avant session ----------
  // Quatre réponses de 1 à 5 (sommeil, énergie, calme, concentration) et l'état des dernières sessions.
  function checkin(a, sessions = [], todayStr = '') {
    const score = ['sleep', 'energy', 'calm', 'focus'].reduce((s, k) => s + (+a[k] || 0), 0), reasons = [];
    let level = score >= 16 ? 'go' : score >= 12 ? 'short' : 'stop';
    if (['sleep', 'energy', 'calm', 'focus'].some((k) => (+a[k] || 0) <= 1)) { level = 'stop'; reasons.push('Une réponse à 1 sur 5 suffit à rendre la session perdante d\'avance.'); }
    const last = sessions.slice().sort((x, y) => (x.date || '').localeCompare(y.date || '')).slice(-3);
    const lastOne = last[last.length - 1];
    if (lastOne && lastOne.date === todayStr && (lastOne.tilt || 0) >= 2) { level = 'stop'; reasons.push('Tu as noté du tilt sur une session aujourd\'hui.'); }
    if (last.length === 3 && last.every((s) => s.result < 0) && level === 'go') { level = 'short'; reasons.push('Trois sessions perdantes de suite : session courte, stop-loss à 2 caves.'); }
    if (a.money && level === 'go') { level = 'short'; reasons.push('Tu as besoin de gagner aujourd\'hui : c\'est la pression qui fait forcer les spots.'); }
    return { score, level, reasons };
  }

  // ---------- Carte de tilt : déclencheurs et fiches de correction par défaut ----------
  // Fiche en 5 étapes inspirée de la méthode de Jared Tendler (The Mental Game of Poker) : le problème,
  // pourquoi il est logique de le ressentir, pourquoi c'est faux, la correction, la logique qui la prouve.
  const TRIGGERS = [
    { id: 'badbeat', label: 'Bad beat ou cooler', fiche: ['« Je ne mérite pas de perdre ce coup, ce n\'est pas juste. »', 'Tu avais l\'avantage : perdre un pot que tu dominais fait mal.', 'Le résultat d\'un coup ne dit rien de ta décision. Avec 80 % d\'équité à tapis, tu as gagné 0,8 pot en espérance, quoi que dise la river.', '« J\'ai pris l\'EV. La river ne change pas la qualité de ma décision. »', 'Sur 100 tapis à 80 %, tu en perds 20 : c\'est dans le calcul. Les perdre est la condition pour gagner les 80 autres.'] },
    { id: 'downswing', label: 'Série de pertes', fiche: ['« Je n\'arrive plus à gagner, quelque chose ne va pas. »', 'Plusieurs sessions perdantes de suite entament la confiance.', 'Avec un écart-type de 90 bb/100, un joueur qui gagne vraiment 5 bb/100 finit perdant sur 10 000 mains environ 3 fois sur 10.', '« Je juge mon jeu sur mes décisions, pas sur la courbe. »', 'Le simulateur de variance du Journal montre des joueurs gagnants sous zéro pendant des dizaines de milliers de mains.'] },
    { id: 'joueur', label: 'Un adversaire qui m\'agace ou me cible', fiche: ['« Il me cherche, je vais lui montrer. »', 'L\'ego réagit quand on se sent provoqué ou visé.', 'Jouer pour battre une personne remplace « quelle action rapporte le plus ? » par « comment avoir raison ? ».', '« Je joue contre sa range, pas contre lui. »', 'Un joueur trop agressif s\'exploite en le laissant bluffer et en payant plus large, pas en relançant léger par fierté.'] },
    { id: 'erreur', label: 'Ma propre erreur', fiche: ['« Comment j\'ai pu faire ça, je suis nul. »', 'Tu veux progresser : une erreur frustre parce que tu sais que tu pouvais mieux faire.', 'S\'en vouloir pendant la session ajoute des erreurs. Une erreur est une donnée pour l\'étude, pas un verdict.', '« Je la note, je la travaille après la session. »', 'Une erreur notée dans la bibliothèque devient un spot d\'étude : c\'est comme ça que le niveau monte.'] },
    { id: 'gros', label: 'Perte d\'un gros pot', fiche: ['« Je dois récupérer ça tout de suite. »', 'Une perte d\'une cave ou plus donne envie de revenir immédiatement à l\'équilibre.', 'Chaque main est indépendante : la suivante n\'a aucun lien avec le pot perdu. Chercher à se refaire pousse à jouer des mains et des limites qu\'on ne jouerait pas.', '« Le pot est perdu. Mon stop-loss décide, pas mon envie. »', 'Ton Journal applique le stop-loss à 3 caves : les sessions où tu l\'as dépassé disent ce que coûte la poursuite.'] },
    { id: 'fatigue', label: 'Session longue, fatigue', fiche: ['« Encore quelques mains, je vais finir sur une bonne note. »', 'L\'envie de finir sur un gain est naturelle.', 'La fatigue dégrade les décisions avant qu\'on la sente. Finir sur une bonne note n\'a aucune valeur : seule l\'EV compte.', '« Ma session a une durée fixée, je m\'arrête à l\'heure. »', 'Compare dans ton Journal tes résultats horaires des sessions longues et des sessions courtes.'] },
    { id: 'ennui', label: 'Ennui, mains mortes', fiche: ['« Il ne se passe rien, je vais jouer celle-là pour m\'occuper. »', 'Attendre sans action est pénible.', 'Les mains jouées par ennui sont les mains marginales : celles qui perdent.', '« Le fold est une action rentable. »', 'Ta range d\'ouverture est calculée : chaque main en dehors perd de l\'argent, ennui ou pas.'] },
    { id: 'argent', label: 'Pression de l\'argent', fiche: ['« Il faut que je gagne aujourd\'hui. »', 'Le loyer, un objectif ou une dette rendent le résultat important.', 'Le résultat d\'une session est surtout de la variance. Jouer pour un montant pousse à forcer les spots et à monter de limite.', '« Mon objectif du jour, c\'est le taux de bonnes décisions. »', 'La règle de bankroll et le fonds de vie (onglet Carrière) existent pour que l\'argent d\'une session ne compte pas.'] },
    { id: 'euphorie', label: 'Après une grosse victoire', fiche: ['« Je suis en feu, je peux tout jouer. »', 'La réussite donne confiance.', 'La chance récente ne change pas ton avantage. L\'excès de confiance élargit les ranges et fait monter de limite trop tôt.', '« Même jeu, mêmes ranges, même limite. »', 'Le tilt de victoire existe : relis tes notes des sessions qui ont suivi tes plus gros gains.'] },
  ];
  const ZONES = [
    { id: 'leger', label: 'Léger', signs: 'Je soupire, je repense au coup précédent.', resp: 'Respiration carrée (4 s par temps), puis je relis ma phrase de correction.' },
    { id: 'net', label: 'Net', signs: 'Je joue plus vite, j\'ai envie de relancer pour me venger.', resp: 'Pause de 5 minutes loin de l\'écran, puis check-in : sommeil, calme, concentration.' },
    { id: 'fort', label: 'Fort', signs: 'Je veux me refaire, j\'envisage de monter de limite ou d\'ajouter des tables.', resp: 'Fin de session immédiate, sans négociation.' },
  ];
  const FICHE_STEPS = ['Le problème : ce que je pense ou dis', 'Pourquoi c\'est logique de le ressentir', 'Pourquoi c\'est faux', 'La correction : la phrase à me dire', 'La logique qui la prouve'];

  // ---------- Spin & Go (Expresso) ----------
  // Table de multiplicateurs de l'Expresso à 5 € publiée par CardPlayer France (fréquences sur 10 millions de parties).
  // Au-delà de ×20, le prix est partagé entre les trois joueurs (80 / 12 / 8 %) ; sinon le vainqueur prend tout.
  const SPIN = { buyin: 5, rows: [[200000, 2], [1000, 100], [100, 2000], [50, 10000], [10, 150000], [5, 400000], [4, 825000], [3, 2674204], [2, 5938694]], total: 1e7 };
  function spinDraw(r = Math.random) { let x = r() * SPIN.total; for (const [m, f] of SPIN.rows) { x -= f; if (x <= 0) return m; } return 2; }
  function spinPrize(mult, place) { const pool = mult * SPIN.buyin; if (mult > 20) return pool * ([0, 0.8, 0.12, 0.08][place] || 0); return place === 1 ? pool : 0; }
  const spinRake = () => { let paid = 0; for (const [m, f] of SPIN.rows) paid += f * m * SPIN.buyin; return 1 - paid / SPIN.total / (3 * SPIN.buyin); };
  // Variance : N parties avec des probabilités de finir 1er / 2e données ; ROI médian, déciles, part de sessions gagnantes.
  function spinSim(p1, p2, n, paths = 2000, seed = 3) {
    const r = rng(seed), out = [];
    for (let k = 0; k < paths; k++) { let won = 0; for (let g = 0; g < n; g++) { const m = spinDraw(r), u = r(), place = u < p1 ? 1 : u < p1 + p2 ? 2 : 3; won += spinPrize(m, place); } out.push(won / (n * SPIN.buyin) - 1); }
    out.sort((a, b) => a - b);
    const q = (x) => out[Math.min(out.length - 1, Math.round(x * (out.length - 1)))];
    return { p10: q(0.1), p50: q(0.5), p90: q(0.9), mean: out.reduce((a, b) => a + b, 0) / out.length, pWin: out.filter((x) => x > 0).length / out.length };
  }

  const api = { SPIN, spinDraw, spinPrize, spinRake, spinSim, rng, normCdf, STAKES, stakeIndex, careerSim, riskOfRuin, proCriteria, SPOT_D, DEC_D, LEVEL_BONUS, eloTitle, expected, eloUpdate, DIVS, XP, weekKey, weekFrac, rivals, standings, leagueRoll, PROMOTE, DEMOTE, SIZE, MEDALS, medalOf, luck, P_PREM, P_SET, checkin, TRIGGERS, ZONES, FICHE_STEPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Pro = api;
})(typeof window !== 'undefined' ? window : globalThis);
