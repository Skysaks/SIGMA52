// Moteur de la Table live (parties amicales, joueurs informés) : une décision en moins d'une seconde à partir de ta main,
// du board, de ta position, du nombre et du type d'adversaires, du pot et de la mise à payer.
// Préflop : charts et équité de la matrice préflop contre la range estimée. Après le flop : Monte-Carlo contre la range estimée,
// filtrée par l'action de l'adversaire sur la rue. C'est une estimation rapide, pas un solve.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const C = root.Charts || require('./charts.js');
  const SV = root.Solver || require('./solver.js');
  const TS = root.TableSim || require('./table.js');
  const B = root.Board || require('./board.js');

  // Types d'adversaires : part des mains avec lesquelles il relance / paie avant le flop, et ce qu'il garde face à une mise.
  const TYPES = {
    serre: { label: 'Serré', raise: 0.07, call: 0.16, keep: 'strong' },
    normal: { label: 'Normal', raise: 0.16, call: 0.3, keep: 'pair' },
    large: { label: 'Large', raise: 0.28, call: 0.45, keep: 'pair' },
    fish: { label: 'Fish (paie tout)', raise: 0.1, call: 0.6, keep: 'any' },
    maniaque: { label: 'Maniaque', raise: 0.45, call: 0.65, keep: 'wide' },
  };
  const POSITIONS = ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const chartPos = (p) => (p === 'MP' ? 'UTG' : p);
  const fmt = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString('fr-FR');
  const pctS = (x) => Math.round(x * 100) + ' %';

  let PCT = null;
  const pctOf = (h) => { PCT = PCT || TS.preflopPct(); return PCT[E.ALL169.indexOf(h)]; };
  function topSet(x) { PCT = PCT || TS.preflopPct(); return new Set(E.ALL169.filter((h, i) => PCT[i] < x)); }
  const freqOf = (set) => E.ALL169.map((h) => (set.has(h) ? 1 : 0));

  // Range d'un adversaire après le préflop selon son action ('raise' | 'call' | 'limp').
  function preRange(type, act) {
    const T = TYPES[type] || TYPES.normal;
    if (act === 'raise') return topSet(T.raise);
    if (act === 'limp') { const all = topSet(Math.min(0.85, T.call + 0.15)), strong = topSet(Math.min(0.06, T.raise)); return new Set([...all].filter((h) => !strong.has(h))); }
    return topSet(T.call);
  }
  // Filtre postflop : ce qu'il garde quand il mise ou relance sur cette rue.
  function keepOnBet(type, combos, board, raised) {
    const T = TYPES[type] || TYPES.normal;
    return combos.filter((c) => {
      const k = B.classify(c, board), pair = k.made <= 11, strongMade = k.made <= 9, draw = k.draws.length > 0 && k.draws[0] !== 3;
      if (T.keep === 'wide') return raised ? pair || draw || k.made <= 11 : true;
      if (T.keep === 'any') return raised ? k.made <= 10 : pair || draw || k.draws.includes(3);
      if (T.keep === 'strong') return raised ? k.made <= 7 : strongMade || (draw && k.draws[0] === 0);
      return raised ? k.made <= 8 || (draw && k.draws[0] <= 1) : pair || draw;
    });
  }
  const outsOf = (k) => { const d = k.draws; if (d.includes(0) && d.includes(1)) return 15; if (d.includes(0) && d.includes(2)) return 12; if (d.includes(0)) return 9; if (d.includes(1)) return 8; if (d.includes(2)) return 4; if (d.includes(3)) return 6; return 0; };

  // ---------------- Préflop ----------------
  function preflop(o) {
    const [c1, c2] = o.hero, h = E.abstractOf(c1, c2), pct = pctOf(h), hi = E.ALL169.indexOf(h), pos = o.pos, T = TYPES[o.type] || TYPES.normal;
    const ip = ['CO', 'BTN'].includes(pos), blind = pos === 'SB' || pos === 'BB', stack = o.stackBB || 100, lines = [];
    const res = (action, size, tone, extra = {}) => ({ street: 'pre', hand: h, action, size, tone, lines, ...extra });
    // Tapis court : tapis ou couché.
    if (stack <= 15 && (o.pre === 'open' || o.pre === 'raise')) {
      const sol = SV.solveChip(Math.max(1, Math.min(25, Math.round(stack * 2) / 2)));
      if (o.pre === 'open') {
        const left = { UTG: 6, MP: 5, HJ: 4, CO: 3, BTN: 2, SB: 1, BB: 0 }[pos] ?? 3, k = left <= 1 ? 1 : left === 2 ? 0.75 : left === 3 ? 0.6 : 0.45;
        const push = pct < sol.pushPct * k;
        lines.push(`${fmt(stack)} bb : jeu tapis ou couché. Référence : environ ${pctS(sol.pushPct * k)} des mains depuis ta position.`);
        return res(push ? 'TAPIS' : pos === 'BB' ? 'CHECK' : 'COUCHE', push ? 'tout' : '', push ? 'good' : 'bad');
      }
      const shover = topSet(Math.min(0.9, sol.pushPct * (o.type === 'serre' ? 0.6 : o.type === 'maniaque' ? 1.4 : 1))), eq = SV.eqVsRange(hi, freqOf(shover));
      const need = (stack - (pos === 'BB' ? 1 : pos === 'SB' ? 0.5 : 0)) / (2 * stack + (pos === 'BB' || pos === 'SB' ? 0.5 : 1.5));
      lines.push(`Contre un tapis ${T.label.toLowerCase()} : ton équité ${pctS(eq)}, il en faut ${pctS(need)}.`);
      return res(eq >= need ? 'SUIS' : 'COUCHE', '', eq >= need ? 'good' : 'bad', { eq, need });
    }
    if (o.pre === 'open') {
      if (pos === 'BB') { lines.push('Tout le monde s\'est couché : tu remportes les blindes.'); return res('CHECK', '', 'good'); }
      const R = E.parseRange(C.RFI[chartPos(pos)].range), inR = R.has(h);
      const size = pos === 'SB' ? 3 : 2.5 + (o.live ? 0.5 : 0);
      lines.push(`${h} ${inR ? 'est dans' : 'est hors de'} la range d'ouverture ${pos} (${Math.round(E.rangePct(R))} % des mains).`);
      if (inR) lines.push('Relance, ne limpe pas : tu prends l\'initiative.');
      return res(inR ? 'RELANCE' : 'COUCHE', inR ? fmt(size) + ' BB' : '', inR ? 'good' : 'bad');
    }
    if (o.pre === 'limp') {
      const k = Math.max(1, o.limpers || 1), thr = blind ? 0.12 : (o.type === 'fish' ? 0.3 : 0.2) + (ip ? 0.04 : 0);
      const size = 4 + k + (o.type === 'fish' ? 1 : 0);
      if (pct < thr) { lines.push(`${k} limper${k > 1 ? 's' : ''} : ${h} est assez fort pour isoler. Relance à ${size} BB (4 + 1 par limper${o.type === 'fish' ? ' + 1 contre un fish' : ''}).`); return res('RELANCE', size + ' BB', 'good'); }
      const spec = h[0] === h[1] || (h[2] === 's' && (Math.abs(E.RANKS.indexOf(h[0]) - E.RANKS.indexOf(h[1])) <= 2 || h[0] === 'A'));
      if (pos === 'BB') { lines.push('Grosse blinde : check gratuit, ne gonfle pas le pot avec une main moyenne.'); return res('CHECK', '', 'warn'); }
      if (spec && k >= 1 && pct < 0.5 && stack >= 60) { lines.push(`${h} joue bien à plusieurs avec des tapis profonds (brelan, couleur, suite) : suis pour 1 BB.`); return res('SUIS', '1 BB', 'warn'); }
      lines.push(`${h} ne vaut ni une isolation ni un limp derrière.`); return res('COUCHE', '', 'bad');
    }
    // Face à une relance (avec ou sans callers) ou à un 3-bet.
    const R = Math.max(2, o.raiseBB || 3), callers = o.pre === 'raisecall' ? Math.max(1, o.callers || 1) : 0;
    const posted = pos === 'BB' ? 1 : pos === 'SB' ? 0.5 : 0, heroOpen = o.pre === 'threebet' ? Math.min(R - 0.5, o.openBB || 3) : 0;
    const toCall = o.pre === 'threebet' ? R - heroOpen : R - posted;
    const pot = o.pre === 'threebet' ? 1.5 + heroOpen + R - (pos === 'BB' || pos === 'SB' ? posted : 0) : 1.5 + R * (1 + callers);
    const vr = o.pre === 'threebet' ? topSet(Math.max(0.03, T.raise * 0.4)) : topSet(T.raise);
    const eq = SV.eqVsRange(hi, freqOf(vr)), real = ip ? 0.95 : blind ? 0.82 : 0.88, need = toCall / (pot + toCall);
    const multi = callers > 0 ? 0.92 : 1;
    if (o.pre === 'threebet') {
      const four = E.parseRange(o.type === 'serre' ? 'KK+' : o.type === 'maniaque' ? 'TT+, AQ+' : 'QQ+, AK').has(h);
      if (four) { lines.push(`Contre un 3-bet ${T.label.toLowerCase()}, ${h} est assez fort pour 4-bet (≈ 2,3 × sa relance) ou tapis si les tapis sont courts.`); return res('RELANCE', fmt(R * 2.3) + ' BB', 'good', { eq, need }); }
      const ok = eq * real >= need && (h[0] === h[1] || h[2] === 's' || pct < 0.06);
      lines.push(`Ton équité contre sa range de 3-bet : ${pctS(eq)} (réalisée ≈ ${pctS(eq * real)}), il en faut ${pctS(need)}.`);
      return res(ok ? 'SUIS' : 'COUCHE', ok ? fmt(toCall) + ' BB' : '', ok ? 'warn' : 'bad', { eq, need });
    }
    const valueT = callers ? 0.6 : 0.58;
    if (eq >= valueT || E.parseRange('QQ+, AK').has(h)) {
      const size = (ip ? 3 : 4) * R + R * callers;
      lines.push(`Ton équité contre sa range (${T.label.toLowerCase()}) : ${pctS(eq)}. ${callers ? 'Squeeze' : '3-bet'} pour la valeur à ${fmt(size)} BB.`);
      return res('RELANCE', fmt(size) + ' BB', 'good', { eq, need });
    }
    const implied = stack / R >= 20 && (h[0] === h[1] || h[2] === 's') ? 0.06 : 0;
    const go = eq * real * multi + implied >= need;
    lines.push(`Ton équité contre sa range : ${pctS(eq)}${implied ? ' + cotes implicites (tapis profonds, main qui peut toucher fort)' : ''} ; il en faut ${pctS(need)}${ip ? ', tu es en position' : blind ? ', hors de position' : ''}.`);
    if (o.type === 'fish' && go) lines.push('Contre un fish, prévois de miser gros pour la valeur quand tu touches.');
    return res(go ? 'SUIS' : 'COUCHE', go ? fmt(toCall) + ' BB' : '', go ? 'warn' : 'bad', { eq, need });
  }

  // ---------------- Après le flop ----------------
  function postflop(o) {
    const hero = o.hero, board = o.board, T = TYPES[o.type] || TYPES.normal, n = Math.max(1, Math.min(5, o.nOpp || 1)), lines = [];
    const k = B.classify(hero, board), cat = B.MADE[k.made] + (k.draws.length ? ' + ' + k.draws.map((d) => B.DRAWS[d].toLowerCase()).join(', ') : '');
    const pot = Math.max(0.01, +o.pot || 0), toCall = Math.max(0, +o.toCall || 0), stack = +o.stack || 0;
    const dead = [...hero, ...board];
    let villain = E.rangeCombos(preRange(o.type, o.vpre || 'call'), dead);
    if (toCall > 0) { const kept = keepOnBet(o.type, villain, board, !!o.raised); if (kept.length >= 3) villain = kept; }
    if (!villain.length) villain = E.rangeCombos('random', dead);
    const players = [{ hand: hero }, ...Array.from({ length: n }, () => ({ combos: villain }))];
    const r = E.equity(players, board, { iterations: o.iterations || (n === 1 ? 2500 : 1500), random: o.random });
    const eq = r.equity[0], need = toCall > 0 ? toCall / (pot + toCall) : 0, spr = stack && pot ? stack / pot : null;
    const outs = outsOf(k), toCome = 5 - board.length;
    const res = (action, size, tone) => ({ street: ['', '', '', 'flop', 'turn', 'river'][board.length], hand: E.abstractOf(hero[0], hero[1]), cat, action, size, tone, eq, need, outs, spr, lines });
    lines.push(`${cat}. Équité contre ${n > 1 ? n + ' adversaires' : 'sa range'} (${T.label.toLowerCase()}) : ${pctS(eq)}.`);
    if (outs && toCome) lines.push(`${outs} outs : ≈ ${pctS(Math.min(1, outs * (toCome === 2 ? 4 : 2) / 100))} de toucher ${toCome === 2 ? 'd\'ici la river' : 'à la prochaine carte'} (règle des 2 et 4).`);
    if (toCall <= 0) {
      const real = +o.pot > 0, bet = (f) => (real ? fmt(pot * f, 0) + ' (' + Math.round(f * 100) + ' % du pot)' : Math.round(f * 100) + ' % du pot');
      if (eq >= 1 / (n + 1) + (n === 1 ? 0.08 : 0.17)) {
        const f = o.type === 'fish' ? 0.75 : n > 1 ? 0.66 : 0.6;
        lines.push(k.made === 12 ? 'Rien encore, mais tu es devant sa range et il rate souvent ce board : mise, tu gardes des cartes pour t\'améliorer.' : o.type === 'fish' ? 'Il paie trop : mise gros pour la valeur.' : 'Tu es devant sa range : mise pour la valeur.');
        if (spr !== null && spr <= 2 && eq > 0.65) { lines.push(`SPR ${fmt(spr)} : prépare-toi à mettre le tapis.`); }
        return res('MISE', bet(f), 'good');
      }
      if (outs >= 8 && n === 1 && toCome > 0 && !['fish'].includes(o.type)) { lines.push('Gros tirage : un semi-bluff gagne s\'il se couche ou si tu touches.'); return res('MISE', bet(0.5), 'warn'); }
      if (o.type === 'serre' && n === 1 && eq < 0.35 && board.length === 3) { lines.push('Un joueur serré rate souvent le flop : petite mise pour prendre le pot.'); return res('MISE', bet(0.33), 'warn'); }
      lines.push(n > 1 ? 'À plusieurs, pas de bluff : check.' : o.type === 'fish' ? 'Pas de bluff contre un fish : check.' : 'Main moyenne ou faible : check, contrôle le pot.');
      return res('CHECK', '', 'warn');
    }
    lines.push(`À payer ${fmt(toCall, 0)} pour un pot de ${fmt(pot + toCall, 0)} : il te faut ${pctS(need)} d'équité.`);
    if (eq >= Math.max(n === 1 ? 0.68 : n === 2 ? 0.55 : 0.48, need + 0.12)) {
      const to = toCall + (pot + toCall) * 0.8;
      if (spr !== null && stack <= (pot + toCall) * 1.2) return res('TAPIS', 'tout', 'good');
      lines.push('Tu es nettement devant : relance pour la valeur.');
      return res('RELANCE', '≈ ' + fmt(to, 0), 'good');
    }
    const implied = outs >= 8 && toCome > 0 && stack > pot * 2 && o.type !== 'serre' ? 0.04 : 0;
    if (eq + implied >= need) { if (implied && eq < need) lines.push('Juste en dessous de la cote, mais les tapis profonds paient ton tirage : suis.'); return res('SUIS', fmt(toCall, 0), eq >= need + 0.1 ? 'good' : 'warn'); }
    if (o.type === 'serre' || o.raised) lines.push('Sa mise est forte chez ce profil : couche sans regret.');
    return res('COUCHE', '', 'bad');
  }

  function decide(o) {
    if (!o.hero || o.hero.length !== 2 || o.hero[0] === o.hero[1]) return null;
    if (!o.board || o.board.length === 0) return preflop(o);
    if (o.board.length < 3) return null;
    return postflop(o);
  }

  // Structure de tournoi maison : grosses blindes tirées d'une suite classique (100, 150, 200, 300, 400, 500, 600, 800, 1 000…),
  // de 1 % du tapis de départ jusqu'à environ un quinzième des jetons en jeu ; ante de grosse blinde à partir du niveau 4.
  function structure({ stack = 10000, players = 6, hours = 3, levelMin = 15, smallChip = 25 } = {}) {
    const nLevels = Math.max(6, Math.round((hours * 60) / levelMin) + 2);
    const base = [1, 1.5, 2, 3, 4, 5, 6, 8], seq = [];
    for (let e = -1; e < 9; e++) for (const b of base) { const v = b * Math.pow(10, e) * 100; if (v >= smallChip * 2 && v % smallChip === 0) seq.push(v); }
    const startBB = Math.max(smallChip * 2, Math.round(stack / 100 / smallChip) * smallChip), target = (stack * players) / 15;
    let i0 = seq.findIndex((v) => v >= startBB); if (i0 < 0) i0 = 0;
    let i1 = seq.findIndex((v) => v >= target); if (i1 < 0) i1 = seq.length - 1;
    const idx = Array.from({ length: nLevels }, (_, k) => Math.round(i0 + ((i1 - i0) * k) / (nLevels - 1)));
    const out = []; let prev = 0;
    for (const j of idx) { const bb = Math.max(seq[j], prev ? seq[Math.min(seq.length - 1, seq.indexOf(prev) + 1)] : 0); prev = bb; out.push({ n: out.length + 1, sb: Math.max(smallChip, Math.round(bb / 2 / smallChip) * smallChip), bb, ante: out.length >= 3 ? bb : 0, min: levelMin }); }
    return out;
  }
  // Jetons par joueur à partir des valeurs disponibles : environ 10 % du tapis en petite valeur, 30 % en deuxième, le reste en grosses.
  function chips({ stack = 10000, players = 6, denoms = [25, 100, 500, 1000], counts = [] } = {}) {
    const has = (x) => x !== undefined && x !== null && x !== '';
    const pairs = denoms.map((v, i) => [+v, counts[i]]).filter(([v]) => v > 0).sort((a, b) => a[0] - b[0]);
    const d = pairs.map((x) => x[0]), avail = pairs.map((x) => x[1]), cap = avail.map((x) => (has(x) ? Math.floor(+x / players) : Infinity));
    const shares = d.length === 1 ? [1] : d.length === 2 ? [0.3, 0.7] : d.length === 3 ? [0.1, 0.3, 0.6] : [0.06, 0.24, 0.3, 0.4].concat(Array(Math.max(0, d.length - 4)).fill(0)).slice(0, d.length);
    let left = stack; const per = d.map(() => 0);
    // 1) petites valeurs d'abord (pour rendre la monnaie), dans la limite du stock
    for (let i = 0; i < d.length - 1; i++) {
      let n = Math.max(i === 0 ? 8 : 4, Math.round((stack * shares[i]) / d[i]));
      n = Math.max(0, Math.min(n, cap[i], Math.floor(left / d[i]))); per[i] = n; left -= n * d[i];
    }
    // 2) le reste en partant des grosses valeurs, toujours dans la limite du stock
    for (let i = d.length - 1; i >= 0 && left > 0; i--) { const add = Math.max(0, Math.min(Math.floor(left / d[i]), cap[i] - per[i])); per[i] += add; left -= add * d[i]; }
    const short = left >= d[0] || (d.length && left > 0 && per.every((x, i) => x >= cap[i]));
    return { rows: d.map((v, i) => ({ value: v, count: per[i], total: v * per[i], need: per[i] * players, have: has(avail[i]) ? +avail[i] : null })), rest: left, short, stockTotal: avail.every(has) ? d.reduce((a, v, i) => a + v * +avail[i], 0) : null };
  }
  // Répartition des places (points, lots) selon le nombre de joueurs.
  function payouts(n) {
    if (n <= 3) return [100];
    if (n <= 5) return [70, 30];
    if (n <= 9) return [50, 30, 20];
    if (n <= 15) return [45, 27, 18, 10];
    return [40, 25, 16, 11, 8];
  }

  const api = { TYPES, POSITIONS, decide, preflop, postflop, preRange, structure, chips, payouts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Live = api;
})(typeof window !== 'undefined' ? window : globalThis);
