// Coach de la table d'entraînement : avant chaque décision du héros, estime la range de chaque adversaire
// (profil + actions de la main), calcule l'équité contre ces ranges, compare aux cotes et recommande une action.
// La table est un simulateur : cette aide n'existe que là, jamais pendant une vraie partie.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const C = root.Charts || require('./charts.js');
  const B = root.Board || require('./board.js');
  const TS = root.TableSim || require('./table.js');
  const SV = root.Solver || require('./solver.js');

  const CATS = {
    rfi: 'Ouvertures (premier à entrer)', iso: 'Isolation des limpers', pfdef: 'Face aux relances préflop',
    odds: 'Calls et folds selon les cotes', value: 'Value bets', nobluff: 'Pas de bluff contre les fish', bluff: 'Bluffs ciblés',
    pushfold: 'Tapis ou couché',
  };
  const STREET_N = { flop: 3, turn: 4, river: 5 };
  const pctOf = (h) => TS.preflopPct()[E.ALL169.indexOf(h)];
  const fmtP = (x) => (x * 100).toFixed(1).replace('.', ',') + ' %';

  // Intervalle de percentile préflop [lo, hi[ joué par un bot selon son profil, son action et le nombre de relances devant lui.
  // Reprend exactement la logique de décision des bots (table.js).
  function preflopInterval(pr, profile, final, level, cheapCall) {
    if (final === 'raise') {
      if (level <= 1) return [0, pr.pfr];
      if (level === 2) return [0, pr.vpip * pr.cont * pr.three];
      return [0, profile === 'maniaque' ? 0.07 : 0.025];
    }
    if (final === 'call') {
      if (level <= 1) return [pr.pfr, profile === 'station' ? pr.vpip : Math.min(pr.vpip, pr.pfr * 1.3)];
      if (level === 2) return [pr.vpip * pr.cont * pr.three, cheapCall ? pr.vpip : pr.vpip * pr.cont];
      return [profile === 'maniaque' ? 0.07 : 0.025, Math.max(pr.vpip * pr.cont * 0.35, profile === 'station' ? 0.12 : 0)];
    }
    return [0, 1]; // check de la grosse blinde : toutes les mains
  }

  // Range estimée d'un adversaire, en combinaisons, compte tenu des cartes connues du héros.
  // Repères tête-à-tête à 100 bb (approximatifs) : le bouton ouvre très large, la grosse blinde défend large.
  const HU = {
    open: '22+, A2+, K2+, Q2+, J2s+, J4o+, T2s+, T6o+, 93s+, 96o+, 84s+, 86o+, 73s+, 75o+, 63s+, 65o, 52s+, 54o, 42s+, 32s',
    three: '99+, ATs+, KJs+, A5s-A3s, AJo+, KQo, K7s, Q8s, J8s, T8s, 97s, 86s',
    call: '22-88, A2s-A9s, K2s-KTs, Q2s-QJs, J2s-JTs, T4s-T9s, 94s-98s, 84s-87s, 74s-76s, 63s-65s, 52s-54s, 42s-43s, 32s, A2o-ATo, K2o-KJo, Q5o-QJo, J7o-JTo, T7o-T9o, 97o-98o, 86o-87o, 76o, 65o',
  };
  // Profil de base d'un joueur (les styles « champions » sont estimés comme leur profil le plus proche).
  const K = (p) => (TS.kindOf ? TS.kindOf(TS.PROFILES[p.profile], p.profile) : p.profile);
  function villainRange(t, vi) {
    const p = t.players[vi], pr = TS.PROFILES[p.profile];
    const dead = [...t.players[0].cards, ...t.board];
    let lo = 0, hi = 1, level = 1;
    for (const s of t.seq) {
      if (s.street !== 'pre') break;
      if (s.i === vi) {
        const [a, b] = preflopInterval(pr, K(p), s.final, level, false);
        if (s.final !== 'fold') { lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); }
      }
      if (s.final === 'raise') level++;
    }
    if (hi <= lo) hi = Math.min(1, lo + 0.03);
    const hands = E.ALL169.filter((h) => { const x = pctOf(h); return x >= lo && x < hi; });
    let combos = E.rangeCombos(new Set(hands), dead);
    // Postflop : on retire ce qu'il n'aurait pas joué ainsi.
    for (const street of ['flop', 'turn', 'river']) {
      const acts = t.seq.filter((s) => s.i === vi && s.street === street);
      if (!acts.length || t.board.length < STREET_N[street]) continue;
      const bd = t.board.slice(0, STREET_N[street]), last = acts[acts.length - 1].final;
      const keep = (c) => {
        const k = B.classify(c, bd), pair = k.made <= 11, draw = k.draws.length > 0;
        if (last === 'raise') return K(p) === 'maniaque' ? true : K(p) === 'station' ? k.made <= 10 : pair || draw;
        if (last === 'call') return K(p) === 'station' ? pair || draw || (c[0] >> 2) >= 11 || (c[1] >> 2) >= 11 : K(p) === 'maniaque' ? true : pair || draw;
        return true;
      };
      const f = combos.filter(keep);
      if (f.length >= 3) combos = f;
    }
    return { combos, lo, hi, pct: hands.reduce((a, h) => a + E.combos(h).length, 0) / 1326 };
  }

  function describeRange(r) {
    const byClass = new Map();
    for (const c of r.combos) { const h = E.abstractOf(c[0], c[1]); byClass.set(h, (byClass.get(h) || 0) + 1); }
    const top = [...byClass.entries()].sort((a, b) => pctOf(a[0]) - pctOf(b[0])).map(([h]) => h);
    return top.length > 14 ? top.slice(0, 10).join(' ') + ' … ' + top.slice(-3).join(' ') : top.join(' ');
  }

  const inRange = (str, h) => E.parseRange(str).has(h);

  function advise(t, opts = {}) {
    const hero = t.players[0], L = t.legal(), pos = TS.posName(t, 0), hand = E.abstractOf(hero.cards[0], hero.cards[1]);
    const villains = t.players.map((p, i) => i).filter((i) => i > 0 && t.players[i].inHand);
    const ranges = villains.map((vi) => ({ vi, name: t.players[vi].name, profile: K(t.players[vi]), real: t.players[vi].profile, ...villainRange(t, vi) }));
    const stationIn = ranges.some((r) => r.profile === 'station');
    const why = [], cats = [];
    let rec = L.canCheck ? 'check' : 'fold', to = 0, eq = null;
    const need = L.toCall > 0 ? L.toCall / (L.pot + L.toCall) : 0;
    const preSeq = t.seq.filter((s) => s.street === 'pre');
    const raisesBefore = preSeq.filter((s) => s.final === 'raise').length;
    const limpers = preSeq.filter((s) => s.final === 'call').length;
    const heroActedPre = preSeq.some((s) => s.i === 0);

    const hu = t.active().length === 2;
    if (t.street === 'pre') {
      if (raisesBefore === 0 && limpers === 0 && !heroActedPre && pos !== 'BB') {
        cats.push('rfi');
        const R = hu ? HU.open : C.RFI[pos].range, inR = E.parseRange(R).has(hand);
        rec = inR ? 'raise' : 'fold'; to = t.bb * (hu ? 2.5 : pos === 'SB' ? 3 : 2.5);
        why.push(hu ? `Tête-à-tête au bouton : ${hand} est ${inR ? 'dans' : 'hors de'} la range d'ouverture de référence (${E.rangePct(E.parseRange(R)).toFixed(0)} % des mains) : on relance très large à deux.` : `Premier à entrer en ${pos} : ${hand} est ${inR ? 'dans' : 'hors de'} la range d'ouverture (${E.rangePct(E.parseRange(R)).toFixed(0)} % des mains).`);
        if (!inR && ranges.some((r) => (r.vi === t.sbi || r.vi === t.bbi) && r.profile === 'station') && pctOf(hand) < 0.6) why.push('Une calling station est aux blindes : élargir légèrement est défendable, mais la référence reste le fold.');
      } else if (raisesBefore === 0 && limpers > 0) {
        cats.push('iso');
        const lim = preSeq.filter((s) => s.final === 'call').map((s) => t.players[s.i]);
        const vsFish = lim.some((p) => K(p) === 'station');
        const thr = pos === 'BB' ? 0.12 : vsFish ? 0.3 : 0.2, good = pctOf(hand) < thr;
        rec = good ? 'raise' : L.canCheck ? 'check' : 'fold'; to = t.bb * (3.5 + limpers + (vsFish ? 1 : 0));
        why.push(`${limpers} limper${limpers > 1 ? 's' : ''} devant toi${vsFish ? ', dont un fish passif' : ''}. ${good ? `${hand} est assez fort pour isoler : relance à ${(to / t.bb).toFixed(1).replace('.', ',')} bb (3,5 bb + 1 par limper${vsFish ? ' + 1 contre un fish' : ''}).` : `${hand} est trop faible pour isoler${L.canCheck ? ' : check gratuit' : ' : fold'}.`}`);
        if (good) why.push('Objectif : jouer le coup seul contre lui, en position si possible, avec la meilleure range.');
      } else if (raisesBefore === 1) {
        cats.push('pfdef');
        const openIdx = preSeq.find((s) => s.final === 'raise').i, opener = t.players[openIdx], oPos = TS.posName(t, openIdx);
        const callers = preSeq.filter((s, k) => s.final === 'call' && k > preSeq.findIndex((x) => x.final === 'raise')).length;
        let act = callers === 0 ? (hu && pos === 'BB' ? (inRange(HU.three, hand) ? '3bet' : inRange(HU.call, hand) ? 'call' : 'fold') : C.facingAction(oPos, pos, hand)) : null;
        if (hu && pos === 'BB' && callers === 0) why.push('Tête-à-tête en grosse blinde : la défense est très large (référence approximative à 100 bb).');
        if (!act) act = inRange('QQ+, AK', hand) ? '3bet' : inRange('JJ-22, AQs-ATs, KQs, QJs, JTs, T9s, 98s', hand) && (pos === 'BTN' || pos === 'BB' || pos === 'CO') ? 'call' : 'fold';
        if (K(opener) === 'station' && act === '3bet' && !inRange('TT+, AQ+, KQs', hand)) { act = pos === 'SB' ? 'fold' : 'call'; why.push(`Contre ${opener.name}, fish passif, pas de 3-bet bluff : il paie. ${hand} devient un ${act === 'call' ? 'call' : 'fold'}.`); }
        if (K(opener) === 'station' && act === 'fold' && inRange('99+, AJ+, KQ', hand)) { act = '3bet'; why.push(`Contre un fish qui ouvre large et paie, ${hand} se 3-bette pour la valeur.`); }
        rec = act === '3bet' ? 'raise' : act === 'call' ? 'call' : (L.canCheck ? 'check' : 'fold');
        const ip = !['SB', 'BB'].includes(pos);
        to = t.cur * (ip ? 3 : 4) + t.cur * callers;
        why.push(`${opener.name} (${oPos}) a ouvert${callers ? `, ${callers} joueur${callers > 1 ? 's ont' : ' a'} suivi` : ''}. Référence pour ${hand} en ${pos} : ${act === '3bet' ? `3-bet à ${(to / t.bb).toFixed(1).replace('.', ',')} bb (${ip ? '3' : '4'} × l'ouverture${callers ? ' + 1 par caller' : ''})` : act === 'call' ? 'call' : 'fold'}.`);
      } else {
        cats.push('pfdef');
        const lastR = [...preSeq].reverse().find((s) => s.final === 'raise'), agg = t.players[lastR.i];
        const four = raisesBefore >= 3;
        const valueR = K(agg) === 'maniaque' ? (four ? 'JJ+, AQ+' : 'TT+, AQ+') : four ? 'QQ+, AK' : 'QQ+, AK';
        const callR = four ? '' : K(agg) === 'nit' ? 'JJ-TT, AQs' : 'JJ-88, AQs, AJs, KQs, JTs, T9s';
        if (inRange(valueR, hand)) { rec = 'raise'; to = four ? L.maxTo : t.cur * 2.3; }
        else if (callR && inRange(callR, hand)) rec = 'call';
        else rec = 'fold';
        why.push(`${agg.name} (${TS.PROFILES[agg.profile].label}) a ${four ? '4-betté' : 'sur-relancé'}. ${rec === 'raise' ? `${hand} est assez fort pour ${four ? 'aller à tapis' : '4-better (≈ 2,3 × la relance)'}.` : rec === 'call' ? `${hand} se paie, de préférence en position.` : `${hand} ne tient pas face à cette range.`}`);
        if (K(agg) === 'nit') why.push('Un nit ne sur-relance qu\'avec le haut de sa range : resserre-toi.');
      }
      // Équité préflop contre les ranges estimées (indicative).
      if (ranges.length) eq = E.equity([{ hand: hero.cards }, ...ranges.map((r) => ({ combos: r.combos }))], [], { iterations: opts.iterations || 2500 }).equity[0];
    } else {
      eq = E.equity([{ hand: hero.cards }, ...ranges.map((r) => ({ combos: r.combos }))], t.board, { iterations: opts.iterations || 3000 }).equity[0];
      const k = B.classify(hero.cards, t.board), multi = ranges.length > 1, river = t.street === 'river';
      const drawNote = k.draws.length ? ` Tirage : ${k.draws.map((d) => B.DRAWS[d].toLowerCase()).join(', ')}.` : '';
      why.push(`Ta main : ${B.MADE[k.made].toLowerCase()}.${drawNote} Équité contre ${multi ? 'les ranges estimées' : 'la range estimée'} : ${fmtP(eq)}.`);
      if (L.toCall > 0) {
        cats.push('odds');
        const implied = k.draws.length && stationIn && !river ? 0.04 : 0;
        const bettor = [...t.seq].reverse().find((s) => s.street === t.street && s.final === 'raise');
        const bp = bettor ? t.players[bettor.i] : null;
        if (eq > (multi ? 0.75 : 0.7)) { rec = 'raise'; to = t.cur + Math.max(t.minRaise, L.pot * 0.8); why.push(`Il te faut ${fmtP(need)} pour suivre et tu en as ${fmtP(eq)} : relance pour la valeur.`); }
        else if (eq + implied >= need) { rec = 'call'; why.push(`Cotes : ${fmtP(need)} requis, ${fmtP(eq)} d'équité${implied ? ' plus des gains implicites contre un fish qui paiera ton tirage' : ''} : call rentable.`); }
        else { rec = 'fold'; why.push(`Cotes : ${fmtP(need)} requis, seulement ${fmtP(eq)} d'équité : le call perd de l'argent.`); }
        if (bp && ['station', 'nit'].includes(K(bp)) && (river || t.street === 'turn')) why.push(`${bp.name} (${TS.PROFILES[bp.profile].label}) mise ou relance tard : chez ce profil, c'est presque toujours de la valeur. Sa range a été resserrée en conséquence.`);
        if (bp && K(bp) === 'maniaque') why.push(`${bp.name} est un maniaque : sa range de mise contient beaucoup de bluffs, d'où une équité plus haute qu'on ne le croit.`);
      } else {
        const valueThr = river ? 0.62 : multi ? 0.65 : 0.6;
        if (eq > valueThr) {
          cats.push('value'); rec = 'raise';
          const frac = stationIn ? 0.8 : river ? 0.66 : 0.5; to = Math.max(L.minTo, L.pot * frac);
          why.push(`Avec ${fmtP(eq)} d'équité, mise pour la valeur : environ ${Math.round(frac * 100)} % du pot${stationIn ? ', car une calling station paie les grosses mises avec pire' : ''}.`);
        } else if (stationIn && eq < 0.45) {
          cats.push('nobluff'); rec = 'check';
          why.push('Une calling station est dans le coup : un bluff n\'a presque aucune chance de la faire coucher. Check.');
        } else if (!multi && eq < 0.4 && t.street === 'flop' && ranges.every((r) => ['nit', 'reg'].includes(r.profile)) && t.seq.some((s) => s.street === 'pre' && s.i === 0 && s.final === 'raise')) {
          cats.push('bluff'); rec = 'raise'; to = Math.max(L.minTo, L.pot * 0.33);
          why.push(`Tu as l'initiative contre un ${TS.PROFILES[ranges[0].real].label.toLowerCase()} qui rate souvent le flop : petit continuation bet (≈ 33 % du pot).`);
        } else { rec = 'check'; why.push('Main moyenne ou faible sans bonne raison de miser : check.'); }
      }
    }
    return { pos, hand, rec, to, eq, need, toCall: L.toCall, pot: L.pot, cats, why, ranges: ranges.map((r) => ({ name: r.name, profile: r.profile, label: TS.PROFILES[r.real].label, n: r.combos.length, pct: r.pct, desc: describeRange(r) })) };
  }


  // Tapis courts (Expresso, fins de tournoi) : tapis ou couché.
  // Tête-à-tête SB contre BB : équilibre de Nash exact (solveur). À 3 joueurs : estimation contre les seuils connus des bots.
  const freqBelow = (thr) => E.ALL169.map((h) => (pctOf(h) < thr ? 1 : 0));
  function pushFoldAdvice(t) {
    if (t.street !== 'pre') return null;
    const hero = t.players[0], L = t.legal(), S = t.effStack(0) / t.bb;
    if (S > 15) return null;
    const hand = E.abstractOf(hero.cards[0], hero.cards[1]), hi = SV.idx(hand), pos = TS.posName(t, 0);
    const act = t.active().length, why = [], fmtBb = (x) => (x / t.bb).toFixed(1).replace('.', ',') + ' bb';
    const nashS = Math.max(1, Math.min(25, Math.round(S * 2) / 2)), sol = SV.solveChip(nashS);
    const aggr = [...t.seq].reverse().find((x) => x.street === 'pre' && x.final === 'raise');
    let rec, ev = null, eq = null, need = L.toCall > 0 ? L.toCall / (L.pot + L.toCall) : 0;
    if (!aggr) {
      if (act === 2 && t.sbi === 0) {
        ev = sol.evPush[hi]; rec = ev > 0 ? 'raise' : (L.canCheck ? 'check' : 'fold');
        why.push(`Tête-à-tête, ${fmtBb(t.effStack(0))} effectifs : la SB pousse ${fmtP(sol.pushPct)} des mains à l'équilibre. Pousser ${hand} vaut ${ev >= 0 ? '+' : '−'}${Math.abs(ev).toFixed(2).replace('.', ',')} bb par rapport à se coucher.`);
      } else {
        // Estimation : chaque adversaire restant paie selon son seuil ; au plus un caller.
        const behind = t.seatOrder(0).filter((k) => k !== 0 && t.players[k].inHand);
        let pAllFold = 1, evCall = 0; const E0 = t.effStack(0), pot = L.pot;
        for (const k of behind) {
          const th = t.pfThresholds(k, Math.min(25, t.effStack(k) / t.bb)), f = th.call;
          const e = SV.eqVsRange(hi, freqBelow(f));
          evCall += pAllFold * f * (e * (pot + 2 * E0) - E0);
          pAllFold *= 1 - f;
        }
        ev = (pAllFold * pot + evCall) / t.bb; rec = ev > 0 ? 'raise' : (L.canCheck ? 'check' : 'fold');
        why.push(`${act} joueurs, ${fmtBb(t.effStack(0))} effectifs en ${pos}. Les adversaires se couchent tous ${fmtP(pAllFold)} du temps d'après leur profil. Pousser ${hand} vaut environ ${ev >= 0 ? '+' : '−'}${Math.abs(ev).toFixed(2).replace('.', ',')} bb (estimation).`);
      }
    } else {
      const pk = aggr.i, th = t.pfThresholds(pk, Math.min(25, t.effStack(pk) / t.bb));
      if (act === 2 && pk === t.sbi) {
        ev = sol.evCall[hi]; rec = ev > 0 ? 'call' : 'fold'; eq = SV.eqVsRange(hi, sol.push);
        why.push(`Tête-à-tête : la SB pousse ${fmtP(sol.pushPct)} des mains à l'équilibre, la BB paie ${fmtP(sol.callPct)}. Payer avec ${hand} vaut ${ev >= 0 ? '+' : '−'}${Math.abs(ev).toFixed(2).replace('.', ',')} bb par rapport à se coucher.`);
      } else {
        eq = SV.eqVsRange(hi, freqBelow(th.push)); rec = eq >= need ? 'call' : 'fold';
        why.push(`${t.players[pk].name} (${TS.PROFILES[t.players[pk].profile].label}) pousse environ ${fmtP(th.push)} des mains à cette profondeur. Ton équité contre cette range : ${fmtP(eq)} ; il t'en faut ${fmtP(need)}.`);
      }
      if (K(t.players[pk]) === 'maniaque') why.push('Un maniaque pousse plus large que l\'équilibre : paie un peu plus large.');
      if (K(t.players[pk]) === 'nit') why.push('Un nit pousse plus serré que l\'équilibre : paie plus serré.');
    }
    why.push('Expresso : le gagnant prend tout, donc les jetons valent leur poids en argent ; l\'équilibre en jetons s\'applique.');
    return { pos, hand, rec, to: L.maxTo, eq, need, ev, toCall: L.toCall, pot: L.pot, cats: ['pushfold'], why, ranges: [] };
  }

  // Note une action du héros par rapport à la recommandation.
  function grade(adv, act, to, t) {
    const norm = (a) => (a === 'check' ? 'check' : a);
    let ok = norm(act) === norm(adv.rec) || (adv.rec === 'fold' && act === 'check');
    let note = '';
    if (ok && act === 'raise' && adv.cats.includes('value') && adv.to && to < adv.to * 0.7) { ok = false; note = 'Bonne idée de miser, mais trop petit : contre ce profil, la valeur se prend avec une mise plus grosse.'; }
    return { ok, note };
  }

  const ACT_FR = { fold: 'se coucher', check: 'parole', call: 'suivre', raise: 'miser / relancer' };
  const api = { CATS, ACT_FR, villainRange, advise, grade, describeRange, preflopInterval, pushFoldAdvice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Coach = api;
})(typeof window !== 'undefined' ? window : globalThis);
