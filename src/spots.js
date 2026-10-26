// Générateur de spots d'entraînement. Chaque spot : { type, title, prompt, cards?, board?, opts, ok (index ou liste), why }.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const Charts = root.Charts || require('./charts.js');
  const Course = root.Course || require('./course.js');
  const Solver = root.Solver || require('./solver.js');

  const TYPES = {
    rfi: 'Ouverture', vsopen: 'Face à une ouverture', odds: 'Cotes du pot', tirage: 'Tirage au turn', pushfold: 'Tapis ou couché', outs: 'Compter les outs', meilleure: 'Meilleure main', situations: 'Situations',
    mdf: 'MDF et ratios', combos: 'Combos et bloqueurs', bounty: 'Primes PKO', profils: 'Même main, quatre adversaires',
  };
  const pick = (a, r) => a[(r() * a.length) | 0];
  const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + ' %';
  const eur = (x) => x.toFixed(2).replace('.', ',') + ' €';
  function deal(n, r, exclude = []) {
    const used = new Set(exclude), out = [];
    while (out.length < n) { const c = (r() * 52) | 0; if (!used.has(c)) { used.add(c); out.push(c); } }
    return out;
  }

  // Ouverture : position + main -> ouvrir ou passer, selon les ranges RFI.
  function rfi(r) {
    const pos = pick(Charts.POS, r), set = E.parseRange(Charts.RFI[pos].range);
    // Moitié des mains tirées près de la frontière de la range (là où on se trompe), moitié au hasard.
    let cards, h;
    for (let i = 0; i < 40; i++) {
      cards = deal(2, r); h = E.abstractOf(cards[0], cards[1]);
      if (r() < 0.5) break;
      const ri = E.RANKS.indexOf(h[0]), rj = E.RANKS.indexOf(h[1]);
      const neighbours = [[ri, rj - 1], [ri, rj + 1], [ri - 1, rj]].filter(([a, b]) => a >= 0 && b >= 0 && a <= 12 && b <= 12 && a !== b)
        .map(([a, b]) => E.RANKS[Math.max(a, b)] + E.RANKS[Math.min(a, b)] + (h[2] || ''));
      if (neighbours.some((x) => set.has(x) !== set.has(h))) break;
    }
    const open = set.has(h);
    return {
      type: 'rfi', title: 'Ouverture · ' + Charts.RFI[pos].label,
      prompt: `Tout le monde a passé jusqu'à toi. Tu es <strong>${pos}</strong> avec <strong>${h}</strong>.`,
      cards, opts: [`Ouvrir à ${Charts.RFI[pos].size}`, 'Se coucher'], ok: open ? 0 : 1,
      why: `${h} est ${open ? '' : 'hors de '}la range d'ouverture ${pos} (${E.rangePct(set).toFixed(0)} % des mains). ` +
        (open ? 'Relance, ne limpe jamais en premier.' : 'Trop de joueurs parlent après toi pour cette main, ou elle est dominée trop souvent.'),
    };
  }

  // Face à une ouverture : 3-bet, call ou fold selon les charts.
  function vsopen(r) {
    const pairs = []; for (const o in Charts.FACING) for (const h in Charts.FACING[o]) pairs.push([o, h]);
    const [o, h] = pick(pairs, r), f = Charts.FACING[o][h];
    const zone = E.parseRange(f.threebet + (f.call ? ', ' + f.call : ''));
    let cards, hand;
    for (let k = 0; k < 40; k++) {
      cards = deal(2, r); hand = E.abstractOf(cards[0], cards[1]);
      if (r() < 0.35) break;
      const ri = E.RANKS.indexOf(hand[0]), rj = E.RANKS.indexOf(hand[1]);
      const nb = [[ri, rj - 1], [ri, rj + 1], [ri - 1, rj]].filter(([a, b]) => a >= 0 && b >= 0 && a <= 12 && b <= 12 && a !== b).map(([a, b]) => E.RANKS[Math.max(a, b)] + E.RANKS[Math.min(a, b)] + (hand[2] || ''));
      if (zone.has(hand) || nb.some((x) => zone.has(x))) break;
    }
    const act = Charts.facingAction(o, h, hand), opts = ['3-bet', 'Payer', 'Se coucher'], ok = { '3bet': 0, call: 1, fold: 2 }[act];
    const ip = !['SB', 'BB'].includes(h);
    return {
      type: 'vsopen', title: `Face à une ouverture · ${o} ouvre, tu es ${h}`,
      prompt: `Un régulier ouvre à 2,5 bb depuis le <strong>${o}</strong>, tout le monde se couche jusqu'à toi. Tu es <strong>${h}</strong> avec <strong>${hand}</strong>.`,
      cards, opts, ok,
      why: `Référence ${o} contre ${h} : 3-bet ${E.rangePct(E.parseRange(f.threebet)).toFixed(1).replace('.', ',')} % des mains, call ${f.call ? E.rangePct(E.parseRange(f.call)).toFixed(1).replace('.', ',') : '0'} %. ${hand} : ${act === '3bet' ? '3-bet' : act === 'call' ? 'call' : 'fold'}. ` +
        (h === 'SB' ? 'En petite blinde, on joue 3-bet ou fold : un call laisse la BB entrer à bas prix et tu joues hors de position.' : h === 'BB' ? 'En grosse blinde, tu as déjà 1 bb dans le pot : la défense est large, surtout contre les ouvertures tardives.' : ip ? 'En position, les mains jouables postflop se paient ; le haut de range et quelques bloqueurs se 3-bettent.' : '') +
        (o === 'UTG' ? ' Une ouverture UTG est la plus forte : serre-toi.' : ''),
    };
  }

  // Cotes du pot : quelle équité faut-il pour suivre ?
  function odds(r) {
    const pot = pick([0.6, 0.8, 1, 1.2, 1.5, 2, 2.4, 3, 4, 5], r), f = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2], r);
    const bet = Math.round(pot * f * 100) / 100, need = bet / (pot + 2 * bet);
    const wrong = [bet / (pot + bet), bet / pot, need * 0.6].filter((x) => Math.abs(x - need) > 0.02 && x < 1);
    const opts = [need, ...wrong.slice(0, 2)].sort(() => r() - 0.5);
    return {
      type: 'odds', title: 'Cotes du pot',
      prompt: `Pot de <strong>${eur(pot)}</strong>. L'adversaire mise <strong>${eur(bet)}</strong>. Quelle équité te faut-il au minimum pour suivre ?`,
      opts: opts.map(pct), ok: opts.indexOf(need),
      ev: null,
      why: `Tu paies ${eur(bet)} pour un pot final de ${eur(pot + 2 * bet)} : ${eur(bet)} ÷ ${eur(pot + 2 * bet)} = ${pct(need)}. Erreur classique : diviser par le pot avant ta mise (${pct(bet / (pot + bet))}).`,
    };
  }

  // Tirage au turn : équité exacte contre une range « paire ou mieux » vs cotes du pot.
  function villainRange(board) {
    const base = E.category(E.evaluate(board)), out = [];
    for (const h of E.ALL169) for (const c of E.combos(h)) {
      if (board.includes(c[0]) || board.includes(c[1])) continue;
      if (E.category(E.evaluate([...c, ...board])) > base) out.push(c);
    }
    return out;
  }
  function exactVsRange(hero, range, board) {
    let eq = 0, n = 0;
    const dead = new Set([...hero, ...board]);
    for (const v of range) {
      if (dead.has(v[0]) || dead.has(v[1])) continue;
      for (let c = 0; c < 52; c++) {
        if (dead.has(c) || c === v[0] || c === v[1]) continue;
        const b = [...board, c], a = E.evaluate([...hero, ...b]), d = E.evaluate([...v, ...b]);
        eq += a > d ? 1 : a === d ? 0.5 : 0; n++;
      }
    }
    return eq / n;
  }
  function drawKind(hero, board) {
    const all = [...hero, ...board], kinds = [];
    for (let s = 0; s < 4; s++) if (all.filter((c) => (c & 3) === s).length === 4 && hero.some((c) => (c & 3) === s)) kinds.push('tirage couleur');
    const m = all.reduce((acc, c) => acc | (1 << (c >> 2)), 0);
    const hasStraight = (x) => { for (let hi = 12; hi >= 4; hi--) if (((x >> (hi - 4)) & 31) === 31) return true; return (x & 0b1000000001111) === 0b1000000001111; };
    let st = 0;
    if (!hasStraight(m)) for (let rank = 0; rank < 13; rank++) if (!(m & (1 << rank)) && hasStraight(m | (1 << rank))) st++;
    if (st >= 2) kinds.push('suite par les deux bouts'); else if (st === 1) kinds.push('suite ventrale');
    return kinds;
  }
  function tirage(r) {
    for (let tries = 0; tries < 400; tries++) {
      const board = deal(4, r);
      if (new Set(board.map((c) => c >> 2)).size < 4) continue;
      const hero = deal(2, r, board);
      if (E.category(E.evaluate([...hero, ...board])) !== 0) continue;
      const kinds = drawKind(hero, board);
      if (!kinds.length) continue;
      const range = villainRange([...board]).filter((c) => !hero.includes(c[0]) && !hero.includes(c[1]));
      const eq = exactVsRange(hero, range, board);
      const pot = pick([1, 1.5, 2, 3, 4], r), f = pick([0.33, 0.5, 0.66, 0.75, 1], r);
      const bet = Math.round(pot * f * 100) / 100, need = bet / (pot + 2 * bet);
      if (Math.abs(eq - need) < 0.03) continue;
      const call = eq > need;
      return {
        type: 'tirage', title: 'Tirage au turn · une carte à venir',
        prompt: `Turn. Tu as un ${kinds.join(' + ')}. Pot de <strong>${eur(pot)}</strong>, l'adversaire mise <strong>${eur(bet)}</strong>. Suppose qu'il a toujours au moins une paire avec une de ses cartes. Tu ne gagneras rien de plus à la river si tu touches.`,
        cards: hero, board, opts: ['Suivre', 'Se coucher'], ok: call ? 0 : 1,
        why: `Ton équité exacte à la river contre cette range (${range.length} combinaisons) : ${pct(eq)}. Équité requise : ${pct(need)}. ` +
          (call ? 'Le call est rentable même sans gains implicites.' : 'Sans gains implicites, le call perd de l\'argent. Contre un fish qui paiera ta couleur à la river, la marge se réduit : c\'est le rôle des cotes implicites.'),
        meta: { eq, need }, ev: { call: eq * (pot + bet) - (1 - eq) * bet, unit: '€' },
      };
    }
    return odds(r);
  }


  // Tapis ou couché : équilibre de Nash tête-à-tête (SB contre BB), en jetons. Noté en perte d'EV.
  const nashCache = {};
  const nash = (S) => nashCache[S] || (nashCache[S] = Solver.solveChip(S));
  function pushfold(r) {
    const S = pick([3, 4, 5, 6, 7, 8, 10, 12, 15, 18, 20], r), sol = nash(S), sb = r() < 0.6;
    let cards, i, freq;
    for (let k = 0; k < 30; k++) {
      cards = deal(2, r); i = E.ALL169.indexOf(E.abstractOf(cards[0], cards[1])); freq = sb ? sol.push[i] : sol.call[i];
      const ev = Math.abs(sb ? sol.evPush[i] : sol.evCall[i]);
      if (freq > 0.05 && freq < 0.95) continue; // mains mixtes : pas de bonne réponse unique
      if (ev < 0.6 || r() < 0.3) break; // privilégie les décisions serrées
    }
    const h = E.ALL169[i], ev = sb ? sol.evPush[i] : sol.evCall[i], yes = freq >= 0.5;
    return {
      type: 'pushfold', title: `Tapis ou couché · ${S} bb · tête-à-tête`,
      prompt: sb ? `Tout le monde s'est couché. Tu es <strong>petite blinde</strong> avec <strong>${h}</strong>, tapis effectif <strong>${S} bb</strong>. Tapis ou couché ?`
        : `La petite blinde fait tapis (${S} bb effectifs). Tu es <strong>grosse blinde</strong> avec <strong>${h}</strong>. Tu paies ?`,
      cards, opts: sb ? ['Tapis', 'Se coucher'] : ['Payer', 'Se coucher'], ok: yes ? 0 : 1,
      why: `Équilibre de Nash à ${S} bb : la SB pousse ${pct(sol.pushPct)} des mains, la BB paie ${pct(sol.callPct)}. ` +
        `${h} : ${sb ? 'pousser' : 'payer'} ${ev >= 0 ? 'rapporte' : 'coûte'} ${Math.abs(ev).toFixed(2).replace('.', ',')} bb de plus que se coucher. ` +
        'Valable en Expresso (le gagnant prend tout, donc les jetons valent leur poids en argent) et en cash ; en tournoi près de l\'argent, l\'ICM resserre.',
      ev: { diff: ev, unit: 'bb' },
    };
  }

  // Compter les outs : main du héros et de l'adversaire visibles, flop ou turn.
  function outsSpot(r) {
    for (let k = 0; k < 300; k++) {
      const n = r() < 0.6 ? 3 : 4, board = deal(n, r), hero = deal(2, r, board), vil = deal(2, r, [...board, ...hero]);
      if (E.evaluate([...hero, ...board]) >= E.evaluate([...vil, ...board])) continue;
      const o = E.outs(hero, vil, board).length;
      if (o < 3 || o > 21) continue;
      const opts = [...new Set([o, o + 2, o - 2, o + 4].filter((x) => x > 0))].slice(0, 4).sort((a, b) => a - b);
      const left = 52 - 4 - n;
      return {
        type: 'outs', title: n === 3 ? 'Outs au flop' : 'Outs au turn',
        prompt: `Tu es derrière. Combien de cartes te font passer devant à la ${n === 3 ? 'turn' : 'river'} ? (Les cartes de l'adversaire sont connues.)`,
        cards: hero, board, vil, opts: opts.map(String), ok: opts.indexOf(o),
        why: `${o} outs sur ${left} cartes inconnues : ${pct(o / left)} à la prochaine carte` + (n === 3 ? `, ${pct(1 - ((left - o) * (left - o - 1)) / (left * (left - 1)))} d'ici la river si tu vois les deux cartes.` : '.') + ' Règle du 2 et 4 : ' + (o * 2) + ' % ' + (n === 3 ? 'puis ' + (o * 4) + ' %.' : '.'),
      };
    }
    return odds(r);
  }

  // Meilleure main : 3 mains, un board, qui gagne ?
  function meilleure(r) {
    const board = deal(5, r), hands = [deal(2, r, board)];
    hands.push(deal(2, r, [...board, ...hands[0]])); hands.push(deal(2, r, [...board, ...hands[0], ...hands[1]]));
    const vals = hands.map((h) => E.evaluate([...h, ...board])), best = Math.max(...vals);
    const win = vals.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0);
    const opts = ['Joueur 1', 'Joueur 2', 'Joueur 3', 'Partage'];
    return {
      type: 'meilleure', title: 'Meilleure main', prompt: 'Qui gagne le pot à l\'abattage ?',
      board, hands, opts, ok: win.length > 1 ? 3 : win[0],
      why: vals.map((v, i) => `Joueur ${i + 1} : ${E.categoryName(v)}`).join(' · ') + (win.length > 1 ? ' → égalité exacte, partage.' : ` → le joueur ${win[0] + 1} gagne.`),
    };
  }

  function situation(r, cat) {
    const pool = Course.SITUATIONS.filter((s) => !cat || s.cat === cat), s = pick(pool, r);
    return { type: 'situations', title: 'Situation · ' + s.cat, prompt: s.q, opts: s.opts, ok: s.ok, why: s.why, sid: s.id };
  }


  // MDF, équité requise, part de bluffs : formules du module Élite « Défense minimale ».
  const fmtp = (x) => (Math.round(x * 1000) / 10).toString().replace('.', ',') + ' %';
  // Trois options triées dont la bonne réponse occupe une position tirée au hasard. Distracteurs : erreurs de formule
  // typiques (bad) en priorité, complétées par des valeurs voisines. gap = écart minimal, step = pas des valeurs voisines.
  function place(r, good, bad, gap, step, min = 0, max = Infinity) {
    const R = gap >= 1 ? Math.round : (x) => x;
    const k = (r() * 3) | 0, lo = [], hi = [];
    const ok = (x, arr) => x >= min && x <= max && Math.abs(x - good) >= gap && arr.every((y) => Math.abs(y - x) >= gap);
    for (const b of bad.slice().sort(() => r() - 0.5)) { if (b < good && lo.length < k && ok(b, lo)) lo.push(b); else if (b > good && hi.length < 2 - k && ok(b, hi)) hi.push(b); }
    for (let i = 1; lo.length < k && i < 40; i++) { const x = R(good - step * (i + r())); if (ok(x, lo)) lo.push(x); }
    for (let i = 1; hi.length < 3 - lo.length - 1 && i < 60; i++) { const x = R(good + step * (i + r())); if (ok(x, hi)) hi.push(x); } // borne basse atteinte : on complète vers le haut
    const vals = [...lo, good, ...hi].sort((a, b) => a - b);
    return { vals, ok: vals.indexOf(good) };
  }
  const threeOpts = (r, good, bad) => { const p = place(r, good, bad, 0.02, 0.06, 0.01, 0.99); return { opts: p.vals.map(fmtp), ok: p.ok }; };
  function mdf(r) {
    const P = pick([20, 30, 40, 50, 60, 80, 100, 120, 150, 200], r), f = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2], r), B = Math.round(P * f);
    const alpha = B / (P + B), md = P / (P + B), need = B / (P + 2 * B), kind = pick(['need', 'mdf', 'bluff', 'ratio'], r);
    const head = `River. Pot de <strong>${P} bb</strong>, mise de <strong>${B} bb</strong> (${Math.round(B / P * 100)} % du pot).`;
    if (kind === 'ratio') {
      const v = pick([6, 8, 9, 10, 12, 14, 15, 18, 20], r), bl = Math.round(v * need / (1 - need));
      const pl = place(r, bl, [Math.round(v * alpha / (1 - alpha)), Math.round(v / 2), v], 1, 1, 0);
      return { type: 'mdf', title: 'Construire une range de mise river', prompt: `${head} Tu as <strong>${v} combos de valeur</strong> dans ta range de mise. Combien de bluffs pour être équilibré ?`, opts: pl.vals.map((x) => String(Math.round(x))), ok: pl.ok,
        why: `Part de bluffs à l'équilibre = B ÷ (P + 2B) = ${B} ÷ ${P + 2 * B} = ${fmtp(need)}. Bluffs = valeur × part ÷ (1 − part) = ${v} × ${fmtp(need)} ÷ ${fmtp(1 - need)} ≈ ${bl}.` };
    }
    const lowWrong = B / (2 * (P + B)); // erreur fréquente : diviser la mise par le pot total puis par deux
    const q = { need: ['Équité requise pour payer ?', need, r() < 0.5 ? [alpha, lowWrong] : [alpha, B / (P + 3 * B)], `B ÷ (P + 2B) = ${B} ÷ ${P + 2 * B} = ${fmtp(need)}.`],
      mdf: ['Défense minimale (MDF) de ta range ?', md, [alpha, 1 - need], `P ÷ (P + B) = ${P} ÷ ${P + B} = ${fmtp(md)}.`],
      bluff: ['Part de bluffs d\'une range de mise équilibrée ?', need, r() < 0.5 ? [alpha, lowWrong] : [alpha, B / (P + 3 * B)], `À la river, la part de bluffs équilibrée égale l'équité requise du défenseur : B ÷ (P + 2B) = ${fmtp(need)}.`] }[kind];
    const o = threeOpts(r, q[1], q[2]);
    return { type: 'mdf', title: 'MDF et cotes', prompt: `${head} ${q[0]}`, opts: o.opts, ok: o.ok, why: q[3] };
  }

  // Combos et bloqueurs : compter les combinaisons d'une main en tenant compte du board et de tes cartes.
  function combos(r) {
    for (let k = 0; k < 60; k++) {
      const board = deal(3, r), hero = deal(2, r, board), dead = [...board, ...hero];
      const pool = [...board, ...hero].map((c) => c >> 2);
      const a = pick(pool, r), b = r() < 0.35 ? a : pick([...pool, (r() * 13) | 0], r);
      const hi = Math.max(a, b), lo = Math.min(a, b);
      const suited = hi !== lo && r() < 0.25;
      const h = E.RANKS[hi] + E.RANKS[lo] + (hi === lo ? '' : suited ? 's' : '');
      const all = hi === lo ? E.combos(h) : suited ? E.combos(h) : E.combos(h + 's').concat(E.combos(h + 'o'));
      const n = all.filter(([x, y]) => !dead.includes(x) && !dead.includes(y)).length;
      const nb = all.filter(([x, y]) => !board.includes(x) && !board.includes(y)).length;
      const full = all.length;
      if (n === nb && n === full) continue; // aucun effet de carte : peu instructif
      const pl = place(r, n, [nb, full], 1, 1, 0), cand = pl.vals.map((x) => Math.round(x));
      const label = hi === lo ? `de paire de ${E.RANKS[hi].replace('T', '10')} (${h})` : `de ${h}${suited ? '' : ' (assorties et dépareillées)'}`;
      return { type: 'combos', title: 'Compter les combos', prompt: `Board <strong>${board.map(E.cardStr).join(' ')}</strong>. Tu tiens <strong>${hero.map(E.cardStr).join(' ')}</strong>. Combien de combos ${label} ton adversaire peut-il avoir ?`,
        cards: hero, board, opts: cand.map(String), ok: pl.ok,
        why: `${full} combos au départ, ${nb} après les cartes du board, ${n} après tes propres cartes. ${hi === lo ? 'Paire : cartes restantes du rang, prises deux à deux (4 → 6, 3 → 3, 2 → 1).' : suited ? 'Assortie : une combinaison par couleur où les deux cartes sont encore disponibles.' : 'Non appariée : cartes restantes du premier rang × cartes restantes du second.'}` };
    }
    return mdf(r);
  }

  // PKO : prime ajoutée au pot pour un call à tapis contre un joueur couvert.
  function bounty(r) {
    const S0 = 10000, bb = pick([100, 200, 300, 400], r), shove = bb * pick([6, 8, 10, 12, 15], r);
    const stage = pick([[0.25, 'début de tournoi'], [0.3, 'milieu de tournoi'], [0.4, 'fin de tournoi']], r);
    const mult = pick([1, 1, 1.5, 2], r), prime = Math.round(S0 * stage[0] * mult / 50) * 50;
    const dead = Math.round(bb * 1.5 + bb), call = shove - bb, need = call / (call + shove + dead + prime), needNo = call / (call + shove + dead);
    const o = threeOpts(r, need, [needNo, call / (call + shove + dead + 2 * prime)]);
    return { type: 'bounty', title: 'PKO : la prime dans les cotes',
      prompt: `PKO, tapis de départ ${S0.toLocaleString('fr-FR')}, ${stage[1]}. Blindes ${bb / 2}/${bb} avec ante de grosse blinde (${bb}). Le bouton pousse <strong>${shove.toLocaleString('fr-FR')}</strong> ; tu es BB et tu le couvres. Sa prime encaissable vaut environ <strong>${prime.toLocaleString('fr-FR')} jetons</strong>${mult > 1 ? ' (sa prime a grossi)' : ''}. Équité requise pour payer ?`,
      opts: o.opts, ok: o.ok,
      why: `Ne compte que la part encaissée de la prime, pas la prime entière. À payer : ${call.toLocaleString('fr-FR')}. À gagner : son tapis ${shove.toLocaleString('fr-FR')} + blindes et ante ${dead.toLocaleString('fr-FR')} + prime ${prime.toLocaleString('fr-FR')}. Équité requise = ${call.toLocaleString('fr-FR')} ÷ ${(call + shove + dead + prime).toLocaleString('fr-FR')} = ${fmtp(need)} (sans la prime : ${fmtp(needNo)}).` };
  }

  // Même main, quatre adversaires : la bonne décision change avec le profil. EV en bb selon des hypothèses de population
  // affichées dans la correction (part de bluffs, taux de fold, taux de call) : des ordres de grandeur, pas des mesures.
  // k : part de son range de check qui paie une mise ; w : ta part de gains quand il paie ; ef : ton équité contre les mains qui se couchent.
  const PROFS = { station: { l: 'une calling station', bl: 0.08, fe: 0.12, k: 0.85, w: 0.7, ef: 0.9 }, nit: { l: 'un nit', bl: 0.05, fe: 0.6, k: 0.25, w: 0.25, ef: 0.95 }, reg: { l: 'un régulier', bl: 0.3, fe: 0.45, k: 0.45, w: 0.5, ef: 0.85 }, maniaque: { l: 'un maniaque', bl: 0.55, fe: 0.3, k: 0.55, w: 0.6, ef: 0.8, induce: 0.45 } };
  const PNAME = { station: 'Station', nit: 'Nit', reg: 'Régulier', maniaque: 'Maniaque' };
  function profils(r) {
    const P = pick([8, 10, 12, 16, 20, 24], r), kind = pick(['catch', 'bluff', 'thin'], r), who = pick(Object.keys(PROFS), r), fb = (x) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2).replace('.', ',') + ' bb';
    let opts, evs, prompt, model, need;
    if (kind === 'catch') {
      const B = P; need = B / (P + 2 * B);
      evs = (pr) => [pr.bl * (P + B) - (1 - pr.bl) * B, 0]; opts = ['Payer', 'Se coucher'];
      prompt = `River, pot de <strong>${P} bb</strong>. Tu as une paire moyenne qui ne bat que des bluffs. <strong>${PROFS[who].l[0].toUpperCase() + PROFS[who].l.slice(1)}</strong> mise le pot (${B} bb).`;
      model = (pr) => `bluffs ${Math.round(pr.bl * 100)} % de ses mises`;
    } else if (kind === 'bluff') {
      const B = Math.round(P * 0.75 * 10) / 10; need = B / (P + B);
      evs = (pr) => [pr.fe * P - (1 - pr.fe) * B, 0]; opts = ['Miser 75 % du pot', 'Checker'];
      prompt = `River, pot de <strong>${P} bb</strong>, tirage raté : ta main ne gagne jamais à l'abattage. <strong>${PROFS[who].l[0].toUpperCase() + PROFS[who].l.slice(1)}</strong> checke vers toi.`;
      model = (pr) => `se couche ${Math.round(pr.fe * 100)} % du temps face à 75 %`;
    } else {
      const B = P / 2; need = null;
      // Gain de la mise sur le check : les mains meilleures qui se couchent + la valeur quand il paie − les bluffs qu'on n'induit plus.
      evs = (pr) => [(1 - pr.k) * (1 - pr.ef) * P + pr.k * B * (2 * pr.w - 1) - (pr.induce || 0) * B * 0.9, 0];
      opts = ['Miser 50 % pour la valeur', 'Checker'];
      prompt = `River, pot de <strong>${P} bb</strong>. Tu as la deuxième paire, bon kicker. <strong>${PROFS[who].l[0].toUpperCase() + PROFS[who].l.slice(1)}</strong> checke vers toi.`;
      model = (pr) => `paie ${Math.round(pr.k * 100)} % et tu gagnes ${Math.round(pr.w * 100)} % quand il paie${pr.induce ? `, bluffe ${Math.round(pr.induce * 100)} % du temps si tu checkes` : ''}`;
    }
    const all = Object.entries(PROFS).map(([k, pr]) => { const e = evs(pr); return { k, best: e[0] > e[1] ? 0 : 1, gap: Math.abs(e[0] - e[1]), e }; });
    const me = all.find((x) => x.k === who), ok = me.best;
    const rows = all.map((x) => `${PNAME[x.k]} : ${opts[x.best].toLowerCase()} (${kind === 'thin' ? 'miser rapporte ' + fb(x.e[0]) + ' par rapport au check' : opts[0].toLowerCase() + ' ' + fb(x.e[0]) + ', ' + opts[1].toLowerCase() + ' 0'})`).join(' ; ');
    const same = all.find((x) => x.k === 'reg'), cost = me.best !== same.best ? me.gap : 0;
    return { type: 'profils', title: `Même main, quatre adversaires · ${PNAME[who]}`, prompt, opts, ok, ev: null,
      why: `${need !== null ? `Il te faut ${pct(need)} de réussite. ` : ''}Hypothèse pour ${PROFS[who].l} : ${model(PROFS[who])}. Même main contre chaque profil — ${rows}. ${cost > 0 ? `Jouer ici comme contre un régulier coûterait ${cost.toFixed(2).replace('.', ',')} bb.` : 'Ici, le même choix que contre un régulier convient.'} Profils et pourcentages : ordres de grandeur de population, à ajuster avec tes propres observations (onglet Analyse).` };
  }
  const GEN = { rfi, vsopen, odds, tirage, pushfold, outs: outsSpot, meilleure, situations: situation, mdf, combos, bounty, profils };
  // Mix : favorise les types les moins réussis (stats = { type: { ok, n } }).
  function mix(r, stats = {}) {
    const types = Object.keys(GEN), w = types.map((t) => { const s = stats[t] || { ok: 0, n: 0 }; return 1.5 - (s.ok + 1) / (s.n + 2); });
    let x = r() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < types.length; i++) { x -= w[i]; if (x <= 0) return GEN[types[i]](r); }
    return GEN[types[0]](r);
  }

  const api = { TYPES, GEN, mix, villainRange, exactVsRange, drawKind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Spots = api;
})(typeof window !== 'undefined' ? window : globalThis);
