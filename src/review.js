// Revue des historiques : chasseur d'erreurs tapis ou couché (tournois, 20 bb ou moins) et classement des fuites postflop.
// Tapis ou couché : en tête-à-tête SB contre BB, équilibre de Nash exact ; à plusieurs, estimation (chaque joueur derrière
// paie avec la range de call de Nash à son tapis effectif ; la range d'un joueur qui pousse se resserre avec le nombre de joueurs derrière lui).
(function (root) {
  const E = root.Engine || require('./engine.js');
  const SV = root.Solver || require('./solver.js');
  const TS = root.TableSim || require('./table.js');
  const HH = root.HH || require('./hh.js');
  const cache = new Map();
  const nash = (S, a = 0) => { const k = Math.max(1, Math.min(25, Math.round(S * 2) / 2)), aa = Math.round(a * 20) / 20, key = k + ':' + aa; if (!cache.has(key)) cache.set(key, SV.solveChip(k, aa)); return cache.get(key); };
  // Range des meilleures mains (ordre de force préflop) couvrant une part f des combinaisons.
  function topRange(f) {
    const pp = TS.preflopPct(); return E.ALL169.map((h, i) => (pp[i] < f ? 1 : 0));
  }
  const ALLIN_FRAC = 0.9;
  function pushFoldSpot(h) {
    if (!h.tournament || !h.hero || !h.heroCards || !(h.bb > 0)) return null;
    const pos = HH.positions(h), bb = h.bb, stack = {}; h.seats.forEach((s) => (stack[s.name] = s.stack));
    const pre = h.actions.filter((a) => a.street === 'pre');
    let pot = 0; const put = {}; h.seats.forEach((s) => (put[s.name] = 0));
    const acts = [];
    for (const a of pre) {
      if (a.type === 'post') { pot += a.amt; if (a.kind !== 'ante') put[a.p] += a.amt; else stack[a.p] -= a.amt; continue; }
      acts.push(a);
    }
    const anteBB = pre.filter((a) => a.type === 'post' && a.kind === 'ante').reduce((x, a) => x + a.amt, 0) / Math.max(1, h.seats.length) / bb;
    const hi = acts.findIndex((a) => a.p === h.hero); if (hi < 0) return null;
    const before = acts.slice(0, hi), act = acts[hi], left = (n) => (stack[n] - put[n]) / bb;
    const heroS = (stack[h.hero]) / bb; // tapis en début de main (après ante), blinde comprise
    if (heroS > 20.5) return null;
    const hand = E.abstractOf(h.heroCards[0], h.heroCards[1]), i = SV.idx(hand), isSB = (n) => pos[n] === 'SB' || (h.seats.length === 2 && pos[n] === 'BTN');
    // Joueurs qui parlent après le héros (ils n'ont pas encore agi).
    const actedBefore = new Set(before.map((a) => a.p)), behind = h.seats.map((s) => s.name).filter((n) => n !== h.hero && !actedBefore.has(n) && acts.some((a) => a.p === n) && acts.findIndex((a) => a.p === n) > hi);
    const raises = before.filter((a) => a.type === 'raises' || a.type === 'bets'), calls = before.filter((a) => a.type === 'calls');
    const heroLeft = left(h.hero), potBB = pot / bb;
    const heroAllin = act.allin || (act.type === 'raises' && (act.to || 0) >= ALLIN_FRAC * stack[h.hero]);
    // Cas 1 : personne n'est entré, le héros pousse ou se couche.
    if (!raises.length && !calls.length) {
      if (!(heroAllin || act.type === 'folds')) return null;
      // Joueur déjà à tapis avec sa blinde : il « paie » toujours, avec n'importe quelle main.
      const forced = h.seats.map((s) => s.name).filter((n) => n !== h.hero && !behind.includes(n) && !actedBefore.has(n) && put[n] > 0 && stack[n] - put[n] <= 1e-9);
      const effBehind = behind.map((n) => Math.min(heroS, stack[n] / bb));
      if (!behind.length && !forced.length) return null;
      let ev, how;
      if (!forced.length && behind.length === 1 && isSB(h.hero) && pos[behind[0]] === 'BB') { ev = nash(effBehind[0], anteBB).evPush[i]; how = 'Nash exact (tête-à-tête SB contre BB)'; }
      else {
        let pAll = 1, evc = 0;
        behind.forEach((n, k) => {
          const S = effBehind[k], sol = nash(S), f = sol.callPct, e = SV.eqVsRange(i, sol.call), risk = Math.min(heroLeft, (stack[n] - put[n]) / bb);
          // Gain si payé : équité × pot final − mise engagée (en bb).
          evc += pAll * f * (e * (potBB + 2 * risk) - risk); pAll *= 1 - f;
        });
        // Les joueurs déjà à tapis par leur blinde sont toujours là : leur équité joue contre une main au hasard.
        if (forced.length) { const any = E.ALL169.map(() => 1), e = SV.eqVsRange(i, any), match = Math.max(0, Math.max(...forced.map((n) => put[n])) - put[h.hero]) / bb; ev = pAll * (e * (potBB + match) - match) + evc; }
        else ev = pAll * potBB + evc;
        how = `estimation : ${behind.length + forced.length} joueur${behind.length + forced.length > 1 ? 's' : ''} derrière${forced.length ? ' (dont un déjà à tapis avec sa blinde)' : ''}, chacun paie avec la range de Nash à son tapis`;
        // EV relative à se coucher : se coucher abandonne la blinde déjà posée, comptée dans le pot ; on mesure le gain par rapport à 0.
      }
      const evs = { push: ev, fold: 0 }, chosen = heroAllin ? 'push' : 'fold', best = ev > 0 ? 'push' : 'fold';
      return { id: h.id, kind: 'open', pos: pos[h.hero] || '?', S: heroS, hand, chosen, best, evs, loss: Math.max(0, evs[best] - evs[chosen]), how, behind: behind.length, raw: h.raw };
    }
    // Cas 2 : un seul joueur a poussé (personne n'a payé), le héros paie ou se couche.
    if (raises.length === 1 && !calls.length && !before.some((a) => a.type === 'raises' && a.p === h.hero)) {
      const sh = raises[0].p, shTo = raises[0].to || raises[0].amt;
      const shoverAllin = raises[0].allin || shTo >= ALLIN_FRAC * stack[sh]; if (!shoverAllin) return null;
      if (!['calls', 'folds'].includes(act.type) && !heroAllin) return null;
      const S = Math.min(heroS, stack[sh] / bb); if (S > 20.5) return null;
      const behindShover = h.seats.map((s) => s.name).filter((n) => n !== sh && acts.findIndex((a) => a.p === n) > acts.indexOf(raises[0])).length;
      const sol = nash(S), f = behindShover <= 1 ? sol.pushPct : sol.pushPct / Math.sqrt(behindShover);
      const range = behindShover <= 1 && isSB(sh) ? sol.push : topRange(f), e = SV.eqVsRange(i, range);
      const toCall = Math.min(stack[h.hero], shTo) - put[h.hero], potNow = (pot - put[sh] + Math.min(shTo, stack[h.hero])) / bb;
      // Pot effectif : blindes et antes + mise du pousseur plafonnée au tapis du héros (l'excédent lui revient).
      const callBB = toCall / bb, evCall = e * (potNow + callBB) - callBB;
      const evs = { call: evCall, fold: 0 }, chosen = act.type === 'folds' ? 'fold' : 'call', best = evCall > 0 ? 'call' : 'fold';
      return { id: h.id, kind: 'call', pos: pos[h.hero] || '?', vs: pos[sh] || '?', S, hand, chosen, best, evs, loss: Math.max(0, evs[best] - evs[chosen]), eq: e, need: callBB / (potNow + callBB), rangePct: f, how: behindShover <= 1 && isSB(sh) ? 'Nash exact (tête-à-tête)' : `estimation : range de poussée ≈ ${Math.round(f * 100)} % des mains (${behindShover} joueurs derrière lui)`, raw: h.raw };
    }
    return null;
  }
  function pushFoldReview(text) {
    const hands = HH.split(text).map(HH.parseHand).filter((h) => h.seats.length >= 2 && h.bb > 0);
    const spots = hands.map(pushFoldSpot).filter(Boolean);
    const errs = spots.filter((s) => s.loss > 0.05).sort((a, b) => b.loss - a.loss);
    return { tournamentHands: hands.filter((h) => h.tournament).length, spots, errs, lossBB: errs.reduce((a, s) => a + s.loss, 0) };
  }

  // Classement des écarts postflop (revue EV) : chaque décision notée est rangée dans une famille de fuite.
  const PASSIVE = ['x', 'c'], AGGR = ['b', 'r', 'a'];
  function leakFamily(chosenK, bestK, facing) {
    if (chosenK === 'f' && bestK !== 'f') return 'Couché alors qu\'il fallait continuer';
    if (chosenK === 'c' && bestK === 'f') return 'Payé alors qu\'il fallait se coucher';
    if (PASSIVE.includes(chosenK) && AGGR.includes(bestK)) return facing ? 'Trop passif face à une mise (relance manquée)' : 'Trop passif (mise manquée)';
    if (AGGR.includes(chosenK) && !AGGR.includes(bestK)) return facing ? 'Relance de trop' : 'Mise de trop (bluff ou valeur trop fine)';
    if (AGGR.includes(chosenK) && AGGR.includes(bestK)) return 'Mauvaise taille de mise';
    return 'Autre';
  }
  const api = { pushFoldSpot, pushFoldReview, leakFamily, topRange };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Review = api;
})(typeof window !== 'undefined' ? window : globalThis);
