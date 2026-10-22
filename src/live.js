// Moteur de la Table live v2 (parties amicales consenties) : une décision en quelques dizaines de millisecondes.
// Préflop : charts 6-max étendues aux tables de 2 à 10 joueurs, straddle et ante, push/fold de Nash (et ICM en tournoi),
//   équité contre la range apprise de l'adversaire (matrice tête-à-tête, table multiway précalculée).
// Après le flop : range adverse pondérée main par main (modèle appris sur des mains simulées : ce que chaque type fait
//   avec chaque catégorie de main, rue par rue), équité exacte au turn et à la river, échantillonnée au flop,
//   EV estimée de chaque option (couche, suis, check, mises de 33 % à l'overbet, relance, tapis) sur la rue en cours.
// Omaha pot-limit et bomb pot : estimations simplifiées. Ce n'est pas un solve : c'est un modèle d'exploitation rapide.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const C = root.Charts || require('./charts.js');
  const SV = root.Solver || require('./solver.js');
  const TS = root.TableSim || require('./table.js');
  const B = root.Board || require('./board.js');
  const O = root.Omaha || (typeof require !== 'undefined' ? require('./omaha.js') : null);
  const MODEL = root.LiveModel || (typeof require !== 'undefined' ? (() => { try { return require('./live_model.js'); } catch (e) { return null; } })() : null);
  const MULTI = root.LiveMulti || (typeof require !== 'undefined' ? (() => { try { return require('./live_multi.js'); } catch (e) { return null; } })() : null);

  // Types d'adversaires. raise / call : part des mains (repli si le modèle appris est absent).
  const TYPES = {
    serre: { label: 'Serré', raise: 0.07, call: 0.16, keep: 'strong', bot: 'nit' },
    normal: { label: 'Normal', raise: 0.16, call: 0.3, keep: 'pair', bot: 'reg' },
    large: { label: 'Large', raise: 0.28, call: 0.45, keep: 'pair', bot: 'mizrachi' },
    fish: { label: 'Fish (paie tout)', raise: 0.1, call: 0.6, keep: 'any', bot: 'station' },
    maniaque: { label: 'Maniaque', raise: 0.45, call: 0.65, keep: 'wide', bot: 'maniaque' },
  };
  // Positions selon le nombre de joueurs à la table (ordre de parole préflop).
  const POS_BY_N = {
    2: ['BTN', 'BB'], 3: ['BTN', 'SB', 'BB'], 4: ['CO', 'BTN', 'SB', 'BB'], 5: ['HJ', 'CO', 'BTN', 'SB', 'BB'], 6: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'], 8: ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    9: ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'], 10: ['UTG', 'UTG+1', 'UTG+2', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  };
  const POSITIONS = POS_BY_N[7];
  const positions = (n) => POS_BY_N[Math.max(2, Math.min(10, n || 6))];
  const fmt = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString('fr-FR');
  const pctS = (x) => Math.round(x * 100) + ' %';
  const STREET_NAMES = ['', '', '', 'flop', 'turn', 'river'];

  let PCT = null;
  const pctArr = () => (PCT = PCT || TS.preflopPct());
  const pctOf = (h) => pctArr()[E.ALL169.indexOf(h)];
  const topSet = (x) => new Set(E.ALL169.filter((h, i) => pctArr()[i] < x));
  const topFreq = (x) => pctArr().map((p) => (p < x ? 1 : 0));

  // ---------------- Ranges préflop apprises ----------------
  // Poids (0 à 1) de chaque main selon l'action préflop de l'adversaire : ranges des charts SIGMA 52 adaptées au type.
  // (Le modèle appris sert après le flop ; avant le flop, les bots simulés classent les mains sur un seul axe, ce qui
  // donnerait des ranges peu humaines : pas de petites paires ni d'assorties connectées.)
  // vpre : raise (il a ouvert), call (il a payé ton ouverture), limp, threebet (il a 3-betté), call3 (il a payé ton 3-bet),
  // fourbet, bomb ou random (toutes les mains).
  const RG = (str) => { const R = E.parseRange(str); return E.ALL169.map((h) => (R.has(h) ? 1 : 0)); };
  const OR = (...a) => a[0].map((_, i) => Math.max(...a.map((x) => x[i])));
  const PRE_TXT = {
    raise: { serre: () => RG(C.RFI.UTG.range), normal: () => RG(C.RFI.CO.range), large: () => RG(C.RFI.BTN.range), fish: () => OR(topFreq(0.12), RG('22+, A2s+')), maniaque: () => topFreq(0.5) },
    call: { serre: () => RG(C.FACING.UTG.BB.call), normal: () => RG(C.FACING.CO.BB.call), large: () => RG(C.FACING.BTN.BB.call), fish: () => OR(RG(C.FACING.SB.BB.call), topFreq(0.55)), maniaque: () => OR(topFreq(0.6), RG(C.FACING.BTN.BB.call)) },
    threebet: { serre: () => RG('QQ+, AK'), normal: () => RG(C.FACING.CO.BTN.threebet), large: () => RG(C.FACING.BTN.BB.threebet), fish: () => RG('QQ+, AK'), maniaque: () => topFreq(0.18) },
    call3: { serre: () => RG('QQ-TT, AK, AQs'), normal: () => RG('JJ-77, AQs-ATs, KQs, KJs, QJs, JTs, AQo, AJo, KQo'), large: () => RG('JJ-55, AQs-A8s, KQs-KTs, QJs, JTs, T9s, 98s, AQo-ATo, KQo'), fish: () => topFreq(0.35), maniaque: () => topFreq(0.3) },
    fourbet: { serre: () => RG('KK+'), normal: () => RG('QQ+, AK'), large: () => RG('JJ+, AK, A5s'), fish: () => RG('KK+'), maniaque: () => topFreq(0.08) },
  };
  const PRE_CACHE = {};
  function preWeights(type, vpre) {
    const T = TYPES[type] ? type : 'normal';
    if (vpre === 'bomb' || vpre === 'random') return new Array(169).fill(1);
    if (vpre === 'limp') { const Tt = TYPES[T], a = topFreq(Math.min(0.85, Tt.call + 0.15)), s2 = topFreq(Math.min(0.06, Tt.raise)); return a.map((x, i) => (x && !s2[i] ? 1 : 0)); }
    const key = PRE_TXT[vpre] ? vpre : 'call', ck = key + '|' + T;
    return (PRE_CACHE[ck] = PRE_CACHE[ck] || PRE_TXT[key][T]()).slice();
  }
  // Compatibilité v1 : ensemble des mains d'une range préflop (seuil à 50 % du poids maximal).
  function preRange(type, act) { const w = preWeights(type, act); return new Set(E.ALL169.filter((h, i) => w[i] >= 0.5)); }

  // ---------------- Catégories de force (identiques au modèle appris) ----------------
  const BUCKETS = ['Monstre (suite ou mieux)', 'Brelan ou deux paires', 'Top paire ou overpair', 'Paire moyenne', 'Petite paire', 'Gros tirage', 'Petit tirage', 'Rien'];
  function bucket(cards, board) {
    const k = B.classify(cards, board), m = k.made;
    if (m <= 4) return 0; if (m <= 7) return 1; if (m <= 9) return 2; if (m === 10) return 3; if (m === 11) return 4;
    if (board.length < 5 && k.draws.some((d) => d <= 1)) return 5; if (board.length < 5 && k.draws.length) return 6; return 7;
  }
  const sizeClass = (f) => (f < 0.45 ? 0 : f < 0.85 ? 1 : 2);
  // Repli sans modèle : probabilités grossières par catégorie.
  const FALLBACK = {
    bet: [[0.35, 0.2, 0.25, 0.2], [0.35, 0.2, 0.25, 0.2], [0.45, 0.25, 0.2, 0.1], [0.7, 0.2, 0.08, 0.02], [0.8, 0.15, 0.04, 0.01], [0.55, 0.2, 0.15, 0.1], [0.75, 0.15, 0.07, 0.03], [0.75, 0.15, 0.07, 0.03]],
    face: [[0.02, 0.5, 0.48], [0.05, 0.65, 0.3], [0.15, 0.78, 0.07], [0.4, 0.57, 0.03], [0.55, 0.43, 0.02], [0.35, 0.55, 0.1], [0.7, 0.27, 0.03], [0.85, 0.13, 0.02]],
  };
  // P(action observée | catégorie) pour un type, une rue, une situation.
  // ctx (facultatif) : { mw: pot à plusieurs, ip: l'adversaire est en position } -> table fine du modèle v2 si assez d'observations.
  // Agressivité de référence (mises et relances ÷ calls après le flop) de chaque type, pour personnaliser avec l'AF observé.
  const AF_REF = { serre: 1.5, normal: 2, large: 2.5, fish: 0.7, maniaque: 4, action: 1.5 };
  function likelihood(type, street, facing, sc, b, ctx) {
    let q = likelihood0(type, street, facing, sc, b, ctx);
    if (ctx && ctx.af > 0) {
      const f = Math.max(0.4, Math.min(2.5, ctx.af / (AF_REF[type] || 2)));
      q = facing ? [q[0], q[1] / Math.sqrt(f), q[2] * f] : [q[0], q[1] * f, q[2] * f, q[3] * f];
    }
    if (ctx && ctx.pl) q = personal(type, facing, b, q, ctx.pl);
    const t = q.reduce((x, y) => x + y, 0); return q.map((x) => x / t);
  }
  // ---------------- Apprentissage d'un vrai joueur (v14) ----------------
  // pl = { face: [couchers, calls, relances] face à tes mises, bets: [mises vues à l'abattage, dont « rien »],
  //        calls: [calls vus à l'abattage, dont mains faibles] }. Estimation bayésienne : ses fréquences observées,
  // tirées vers celles de son type (référence apprise sur les bots) par un a priori de quelques observations.
  const REF_DEFAULT = { bluff: 0.25, weakCall: 0.3, fold: 0.4 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function personal(type, facing, b, q, pl) {
    const R = MODEL?.ref?.[type] || REF_DEFAULT; q = q.slice();
    if (facing) {
      const f = pl.face || [0, 0, 0], n = f[0] + f[1] + f[2];
      if (n >= 3 && R.fold > 0) { const fh = (f[0] + 12 * R.fold) / (n + 12); q[0] *= clamp(fh / R.fold, 0.4, 2.5); }
      const c = pl.calls || [0, 0];
      if (c[0] >= 1 && (b === 4 || b === 7) && R.weakCall > 0) { const wh = (c[1] + 8 * R.weakCall) / (c[0] + 8); q[1] *= clamp(wh / R.weakCall, 0.3, 3); }
    } else {
      const k = pl.bets || [0, 0];
      if (k[0] >= 1 && R.bluff > 0 && (b === 7 || b === 5 || b === 6)) { const bh = (k[1] + 8 * R.bluff) / (k[0] + 8), r = clamp(bh / R.bluff, 0.3, 3), m = b === 7 ? r : Math.sqrt(r); q[1] *= m; q[2] *= m; q[3] *= m; }
    }
    return q;
  }
  // Ce que l'abattage d'un joueur apprend : pour chacune de ses actions de la main, la catégorie de la main montrée.
  function learnShowdown(pl, shown, board, hist) {
    pl = pl || {}; pl.bets = pl.bets || [0, 0]; pl.calls = pl.calls || [0, 0]; pl.sd = (pl.sd || 0) + 1;
    for (const x of hist || []) {
      const len = STREET_NAMES.indexOf(x.street); if (len < 3 || len > board.length) continue;
      const bk = bucket(shown, board.slice(0, len));
      if (x.a === 'bet' || x.a === 'raise') { pl.bets[0]++; if (bk === 7) pl.bets[1]++; }
      else if (x.a === 'call') { pl.calls[0]++; if (bk === 4 || bk === 7) pl.calls[1]++; }
    }
    return pl;
  }
  // Texture du board (identique à l'entraînement) : 0 sec, 1 connecté, 2 pairé, 3 trois cartes d'une couleur.
  function texture(board) {
    const suits = [0, 0, 0, 0], ranks = new Set(); let paired = false;
    for (const c of board) { suits[c & 3]++; const r = c >> 2; if (ranks.has(r)) paired = true; ranks.add(r); }
    if (Math.max(...suits) >= 3) return 3; if (paired) return 2;
    const rs = [...ranks].concat(ranks.has(12) ? [-1] : []);
    for (let lo = -1; lo <= 8; lo++) if (rs.filter((r) => r >= lo && r <= lo + 4).length >= 3) return 1;
    return 0;
  }
  // v14 : table fine par texture (lots entraînés avec la texture du board), mélangée à la table v2 selon le nombre d'observations.
  function likelihood0(type, street, facing, sc, b, ctx) {
    const base = likelihood00(type, street, facing, sc, b, ctx), M3 = MODEL?.post3?.[type];
    if (!M3 || !ctx || ctx.tex === undefined || ctx.mw === undefined || ctx.ip === undefined) return base;
    const leaf = M3[street]?.[facing]?.[facing ? sc : 0]?.[ctx.mw ? 1 : 0]?.[ctx.ip ? 1 : 0]?.[ctx.tex]?.[b];
    if (!leaf || leaf[0] < 20) return base;
    const n = leaf[0], K = facing && sc === 2 ? 150 : 60;
    return base.map((x, i) => (n * (leaf[i + 1] / 1000) + K * x) / (n + K));
  }
  function likelihood00(type, street, facing, sc, b, ctx) {
    const M = MODEL?.post?.[type], M2 = MODEL?.post2?.[type];
    const prior = facing ? FALLBACK.face[b] : FALLBACK.bet[b];
    if (M2 && ctx && ctx.mw !== undefined && ctx.ip !== undefined) {
      const c2 = M2[street][facing][facing ? sc : 0][ctx.mw ? 1 : 0][ctx.ip ? 1 : 0][b];
      if (c2 && c2.n >= 40) { const k = (c2.n >= 150 ? 0.8 : 0.7) * (facing && sc === 2 ? 0.6 : 1); return c2.p.map((x, i) => k * x + (1 - k) * prior[i]); }
    }
    if (M) {
      let c = M[street][facing][facing ? sc : 0][b];
      // Peu d'observations pour cette taille : on prend la taille voisine la mieux renseignée.
      if (facing && c.n < 30) { const alt = [sc === 2 ? 1 : 1 - sc, sc === 2 ? 0 : 2].map((j) => M[street][1][j][b]).find((x) => x.n >= 30); if (alt) c = alt; }
      const k = (c.n >= 30 ? 0.75 : c.n >= 8 ? 0.5 : 0.2) * (facing && sc === 2 ? 0.6 : 1); return c.p.map((x, i) => k * x + (1 - k) * prior[i]);
    }
    return prior;
  }
  // Index d'action : sans mise -> 0 check, 1..3 mise petite/moyenne/grosse ; face à une mise -> 0 couche, 1 suit, 2 relance.
  function actIndex(h) {
    if (h.a === 'check') return { facing: 0, sc: 0, a: 0 };
    if (h.a === 'bet') return { facing: 0, sc: 0, a: 1 + sizeClass(h.size ?? 0.6) };
    if (h.a === 'call') return { facing: 1, sc: sizeClass(h.size ?? 0.6), a: 1 };
    if (h.a === 'raise') return { facing: 1, sc: sizeClass(h.size ?? 0.6), a: 2 };
    return null;
  }

  // ---------------- Range adverse pondérée ----------------
  // history : [{ street: 'flop'|'turn'|'river', a: 'check'|'bet'|'call'|'raise', size }] (actions de l'adversaire, dans l'ordre).
  function villainRange(o, board, dead) {
    const type = o.type || 'normal', pw = preWeights(type, o.vpre || 'call'), deadSet = new Set(dead);
    const list = [];
    for (let a = 0; a < 52; a++) {
      if (deadSet.has(a)) continue;
      for (let b = a + 1; b < 52; b++) {
        if (deadSet.has(b)) continue;
        const h = E.ALL169.indexOf(E.abstractOf(a, b)); let w = pw[h];
        if (w <= 0.002) continue;
        list.push({ c: [a, b], h, w });
      }
    }
    const hist = (o.history || []).filter((x) => x && x.street && STREET_NAMES.indexOf(x.street) <= board.length && STREET_NAMES.indexOf(x.street) >= 3);
    for (const x of hist) {
      const ai = actIndex(x); if (!ai) continue;
      const len = STREET_NAMES.indexOf(x.street), bd = board.slice(0, len), si = len - 3;
      const cx = o.ctx ? { ...o.ctx, tex: texture(bd) } : o.ctx;
      for (const r of list) { if (r.w <= 0) continue; r.w *= Math.max(0.001, likelihood(type, si, ai.facing, ai.sc, bucket(r.c, bd), cx)[ai.a]); }
    }
    let tot = list.reduce((s, r) => s + r.w, 0);
    if (!(tot > 0)) { list.forEach((r) => (r.w = 1)); tot = list.length; }
    const mx = Math.max(...list.map((r) => r.w));
    const kept = list.filter((r) => r.w >= mx * 0.003); const t2 = kept.reduce((s, r) => s + r.w, 0);
    kept.forEach((r) => (r.w /= t2));
    return kept;
  }

  // ---------------- Équité main par main (tirages communs) ----------------
  function seededRand(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function equityVec(hero, board, range, opts = {}) {
    const used = new Uint8Array(52); hero.forEach((c) => (used[c] = 1)); board.forEach((c) => (used[c] = 1));
    const deck = []; for (let c = 0; c < 52; c++) if (!used[c]) deck.push(c);
    const need = 5 - board.length, runs = [];
    if (need === 0) runs.push([]);
    else if (need === 1) deck.forEach((c) => runs.push([c]));
    else { const R = opts.random || seededRand(board.reduce((a, c) => a * 53 + c + 1, 7) ^ (hero[0] * 61 + hero[1])), n = opts.runouts || 70; for (let i = 0; i < n; i++) { const a = Math.floor(R() * deck.length); let b; do b = Math.floor(R() * deck.length); while (b === a); runs.push([deck[a], deck[b]]); } }
    const base = board.length + 2, seven = new Array(7), v7 = new Array(7);
    for (let k = 0; k < board.length; k++) { seven[k + 2] = board[k]; v7[k + 2] = board[k]; }
    seven[0] = hero[0]; seven[1] = hero[1];
    const heroV = runs.map((r) => { for (let k = 0; k < r.length; k++) seven[base + k] = r[k]; return E.evaluate(seven); });
    const out = new Float64Array(range.length);
    for (let i = 0; i < range.length; i++) {
      const x = range[i].c[0], y = range[i].c[1]; let s = 0, n = 0; v7[0] = x; v7[1] = y;
      for (let j = 0; j < runs.length; j++) {
        const r = runs[j];
        if (r.length && (r[0] === x || r[0] === y || (r.length > 1 && (r[1] === x || r[1] === y)))) continue;
        for (let k = 0; k < r.length; k++) v7[base + k] = r[k];
        const v = E.evaluate(v7), hv = heroV[j];
        s += hv > v ? 1 : hv === v ? 0.5 : 0; n++;
      }
      out[i] = n ? s / n : 0.5;
    }
    return out;
  }
  // Équité contre plusieurs adversaires (même range pondérée), Monte-Carlo.
  function equityMulti(hero, board, range, n, iters = 1000, rand = Math.random) {
    const cum = new Float64Array(range.length); let t = 0; for (let i = 0; i < range.length; i++) { t += range[i].w; cum[i] = t; }
    const pick = () => { const u = rand() * t; let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; } return range[lo].c; };
    const used = new Uint8Array(52), seven = new Array(7), opp = []; let eq = 0, done = 0;
    for (let it = 0; it < iters; it++) {
      used.fill(0); hero.forEach((c) => (used[c] = 1)); board.forEach((c) => (used[c] = 1)); opp.length = 0; let ok = true;
      for (let j = 0; j < n; j++) { let c, tries = 0; do c = pick(); while ((used[c[0]] || used[c[1]]) && ++tries < 30); if (tries >= 30) { ok = false; break; } used[c[0]] = used[c[1]] = 1; opp.push(c); }
      if (!ok) continue;
      for (let k = 0; k < board.length; k++) seven[k + 2] = board[k];
      for (let k = board.length; k < 5; k++) { let c; do c = Math.floor(rand() * 52); while (used[c]); used[c] = 1; seven[k + 2] = c; }
      seven[0] = hero[0]; seven[1] = hero[1]; const mine = E.evaluate(seven); let best = true, ties = 1;
      for (const c of opp) { seven[0] = c[0]; seven[1] = c[1]; const v = E.evaluate(seven); if (v > mine) { best = false; break; } if (v === mine) ties++; }
      if (best) eq += 1 / ties; done++;
    }
    return done ? eq / done : 0.5;
  }

  const outsOf = (k) => { const d = k.draws; if (d.includes(0) && d.includes(1)) return 15; if (d.includes(0) && d.includes(2)) return 12; if (d.includes(0)) return 9; if (d.includes(1)) return 8; if (d.includes(2)) return 4; if (d.includes(3)) return 6; return 0; };
  // Équité préflop multiway précalculée : main contre k adversaires (top x chacun), interpolée.
  function multiEq(h, k, x) {
    if (!MULTI || k < 2) return null;
    const hi = E.ALL169.indexOf(h), K = MULTI.KS, XS = MULTI.XS, kk = Math.min(K[K.length - 1], Math.max(2, Math.round(k))), ki = K.indexOf(kk);
    const xx = Math.max(XS[0], Math.min(1, x)); let j = XS.findIndex((v) => v >= xx); if (j <= 0) j = Math.max(1, j);
    const a = XS[j - 1], b = XS[j], va = MULTI.data[(hi * K.length + ki) * XS.length + j - 1], vb = MULTI.data[(hi * K.length + ki) * XS.length + j];
    return (va + ((vb - va) * (xx - a)) / (b - a)) / 1000;
  }
  // ICM : équité requise pour payer un tapis (stacks en jetons, héros = 0, adversaire = vi).
  function icmNeed(icm, risk, vi = 1) {
    const st = icm.stacks.map(Number), pay = icm.payouts.map(Number);
    const after = (f) => { const s = st.slice(); f(s); return SV.icm(s.map((x) => Math.max(0, x)), pay)[0]; };
    const r = Math.min(risk, st[0], st[vi]);
    const evF = SV.icm(st, pay)[0], evW = after((s) => { s[0] += r; s[vi] -= r; }), evL = after((s) => { s[0] -= r; s[vi] += r; });
    return { need: (evF - evL) / Math.max(1e-9, evW - evL), bf: (evF - evL) / Math.max(1e-9, evW - evF) };
  }

  // ---------------- Préflop (hold'em) ----------------
  const CHART_BY_BEHIND = ['BB', 'SB', 'BTN', 'CO', 'HJ', 'UTG'];
  const EARLY = { 6: 0.13, 7: 0.115, 8: 0.1, 9: 0.09 };
  const BLUFF3 = E.parseRange('A5s-A2s, K9s, QTs, J9s, T8s, 97s, 86s, 76s');
  function seatInfo(o) {
    const N = Math.max(2, Math.min(10, o.players || 6)), L = positions(N);
    let pos = o.pos; if (!L.includes(pos)) pos = pos === 'MP' && L.includes('LJ') ? 'LJ' : L.includes(pos) ? pos : (['SB', 'BB', 'BTN', 'CO', 'HJ'].find((p) => p === pos && L.includes(p)) || L[0]);
    const idx = L.indexOf(pos), behind = N - 1 - idx;
    return { N, L, pos, idx, behind, ip: pos === 'BTN' || (pos === 'CO' && behind >= 2), blind: pos === 'SB' || pos === 'BB' };
  }
  function preflop(o) {
    const [c1, c2] = o.hero, h = E.abstractOf(c1, c2), pct = pctOf(h), hi = E.ALL169.indexOf(h), T = TYPES[o.type] || TYPES.normal;
    const S = seatInfo(o), pos = S.pos, stack = o.stackBB || 100, lines = [];
    const dead = 1.5 + (o.ante ? 1 : 0) + (o.straddle ? 2 : 0), widen = 1 + 0.35 * (dead / 1.5 - 1);
    const t0 = Date.now(), res = (action, size, tone, extra = {}) => ({ street: 'pre', hand: h, action, size, tone, lines, pos, ms: Date.now() - t0, ...extra });
    // ---- Tapis court : tapis ou couché (ICM si tournoi) ----
    if (stack <= 15 && (o.pre === 'open' || o.pre === 'raise' || o.pre === 'limp')) {
      const sol = SV.solveChip(Math.max(1, Math.min(25, Math.round(stack * 2) / 2)));
      if (o.pre !== 'raise') {
        const k = S.behind <= 1 ? 1 : S.behind === 2 ? 0.75 : S.behind === 3 ? 0.6 : S.behind === 4 ? 0.5 : S.behind === 5 ? 0.45 : 0.35;
        let thr = sol.pushPct * k * (o.pre === 'limp' ? 1.15 : 1) * (o.ante ? 1.15 : 1);
        if (o.icm && o.icm.stacks?.length > 2) {
          const others = o.icm.stacks.slice(1).map(Number).sort((a, b) => a - b), med = others[Math.floor(others.length / 2)], vi = o.icm.stacks.map(Number).indexOf(med);
          const r = icmNeed(o.icm, Math.min(+o.icm.stacks[0], med), vi > 0 ? vi : 1);
          if (r.bf > 1.05) { const f = Math.max(0.5, Math.min(1, 1.1 / r.bf)); thr *= f; lines.push(`ICM : facteur de bulle ${fmt(r.bf, 2)} face à un tapis moyen. Range de tapis resserrée (ajustement approximatif).`); }
        }
        const push = pct < thr;
        lines.push(`${fmt(stack)} bb : tapis ou couché. Référence : environ ${pctS(thr)} des mains depuis ta position (${S.behind} joueur${S.behind > 1 ? 's' : ''} derrière).`);
        return res(push ? 'TAPIS' : pos === 'BB' ? 'CHECK' : 'COUCHE', push ? 'tout' : '', push ? 'good' : 'bad', { eq: null });
      }
      const sw = topFreq(Math.min(0.95, sol.pushPct * (o.type === 'serre' ? 0.6 : o.type === 'maniaque' ? 1.4 : o.type === 'large' ? 1.2 : 1)));
      const eq = SV.eqVsRange(hi, sw);
      let need = (stack - (pos === 'BB' ? 1 : pos === 'SB' ? 0.5 : 0)) / (2 * stack + (pos === 'BB' || pos === 'SB' ? 0.5 : 1.5));
      if (o.icm && o.icm.stacks?.length > 2) { const r = icmNeed(o.icm, +o.icm.stacks[0], o.icm.villain || 1); lines.push(`ICM : il te faut ${pctS(r.need)} au lieu de ${pctS(need)} en jetons (facteur de bulle ${fmt(r.bf, 2)}).`); need = r.need; }
      lines.push(`Contre un tapis ${T.label.toLowerCase()} : ton équité ${pctS(eq)}, il en faut ${pctS(need)}.`);
      return res(eq >= need ? 'SUIS' : 'COUCHE', '', eq >= need ? 'good' : 'bad', { eq, need, options: [{ k: 'Couche', ev: 0 }, { k: 'Suis', ev: eq * (2 * stack + 1.5) - stack }] });
    }
    // ---- Premier à entrer ----
    if (o.pre === 'open') {
      if (pos === 'BB') { lines.push('Tout le monde s\'est couché : tu remportes les blindes.'); return res('CHECK', '', 'good'); }
      let inR, ref;
      if (S.N === 2) { ref = 0.78; inR = pct < ref * widen; }
      else if (S.behind >= 6) { ref = EARLY[S.behind] || 0.09; inR = pct < ref * widen; }
      else { const key = CHART_BY_BEHIND[S.behind], R = E.parseRange(C.RFI[key].range); ref = E.rangePct(R) / 100; inR = R.has(h) || (widen > 1 && pct < ref * widen); }
      const adj = o.type === 'serre' ? 1.15 : o.type === 'maniaque' ? 0.85 : 1;
      if (!inR && adj > 1 && pct < ref * widen * adj && S.behind <= 3) { inR = true; lines.push('Les joueurs derrière sont serrés : vol élargi.'); }
      if (inR && adj < 1 && pct > ref * widen * adj && pct > 0.15) { inR = false; lines.push('Les joueurs derrière sont maniaques : ouverture resserrée, ils 3-bettent trop.'); }
      let size = S.N === 2 ? 2.2 : pos === 'SB' ? 3 : 2.5; if (o.live) size += 0.5; if (o.type === 'fish') size += 1; if (o.straddle) size *= 2; if (o.ante) size += 0.25;
      lines.push(`${h} ${inR ? 'est dans' : 'est hors de'} ta range d'ouverture (${pos}, ${S.N} joueurs : ≈ ${pctS(ref * widen)} des mains${widen > 1 ? ', élargie par ' + (o.straddle ? 'le straddle' : 'l\'ante') : ''}).`);
      if (inR) lines.push(o.type === 'fish' ? 'Des joueurs qui paient trop derrière : relance plus gros, tu seras payé.' : 'Relance, ne limpe pas : tu prends l\'initiative.');
      return res(inR ? 'RELANCE' : 'COUCHE', inR ? fmt(size) + ' BB' : '', inR ? 'good' : 'bad');
    }
    // ---- Limpers devant ----
    if (o.pre === 'limp') {
      const k = Math.max(1, o.limpers || 1), thr = (S.blind ? 0.12 : (o.type === 'fish' ? 0.3 : 0.2) + (S.ip ? 0.04 : 0)) * widen;
      const size = (4 + k + (o.type === 'fish' ? 1 : 0)) * (o.straddle ? 2 : 1);
      const eqM = multiEq(h, k + 1, Math.min(1, T.call + 0.2)), eqS = eqM !== null ? ` Équité contre ${k} limper${k > 1 ? 's' : ''} et la grosse blinde : ${pctS(eqM)} (part équitable ${pctS(1 / (k + 2))}).` : '';
      if (pct < thr) { lines.push(`${k} limper${k > 1 ? 's' : ''} : ${h} est assez fort pour isoler. Relance à ${fmt(size)} BB (4 + 1 par limper${o.type === 'fish' ? ' + 1 contre un fish' : ''}).${eqS}`); return res('RELANCE', fmt(size) + ' BB', 'good', { eq: eqM }); }
      const spec = h[0] === h[1] || (h[2] === 's' && (Math.abs(E.RANKS.indexOf(h[0]) - E.RANKS.indexOf(h[1])) <= 2 || h[0] === 'A'));
      if (pos === 'BB') { lines.push('Grosse blinde : check gratuit, ne gonfle pas le pot avec une main moyenne.' + eqS); return res('CHECK', '', 'warn', { eq: eqM }); }
      if (spec && pct < 0.5 && stack >= 60) { lines.push(`${h} joue bien à plusieurs avec des tapis profonds (brelan, couleur, suite) : suis.${eqS}`); return res('SUIS', (o.straddle ? 2 : 1) + ' BB', 'warn', { eq: eqM }); }
      lines.push(`${h} ne vaut ni une isolation ni un limp derrière.${eqS}`); return res('COUCHE', '', 'bad', { eq: eqM });
    }
    // ---- Face à une relance (avec ou sans callers) ou à un 3-bet ----
    const R = Math.max(2, o.raiseBB || 3), callers = o.pre === 'raisecall' ? Math.max(1, o.callers || 1) : 0;
    const posted = pos === 'BB' ? 1 : pos === 'SB' ? 0.5 : 0, heroOpen = o.pre === 'threebet' ? Math.min(R - 0.5, o.openBB || 3) : 0;
    const toCall = o.pre === 'threebet' ? R - heroOpen : R - posted;
    const pot = (o.pre === 'threebet' ? 1.5 + heroOpen + R - (S.blind ? posted : 0) : 1.5 + R * (1 + callers)) + (o.ante ? 1 : 0);
    // Position de l'ouvreur connue : range d'ouverture de sa position et réponse des charts SIGMA 52 comme base.
    const SIX = { UTG: 'UTG', 'UTG+1': 'UTG', 'UTG+2': 'UTG', MP: 'UTG', LJ: 'UTG', HJ: 'HJ', CO: 'CO', BTN: 'BTN', SB: 'SB', BB: 'BB' };
    const oPos = o.openPos && o.pre !== 'threebet' ? SIX[o.openPos] : null, hPos = SIX[pos];
    const chart = oPos && C.FACING[oPos] && C.FACING[oPos][hPos] ? C.FACING[oPos][hPos] : null;
    let w = oPos && C.RFI[oPos] ? RG(C.RFI[oPos].range) : preWeights(o.type, o.pre === 'threebet' ? 'threebet' : 'raise');
    if (oPos && o.type === 'serre') w = w.map((x, i) => x * (pctArr()[i] < 0.12 ? 1 : 0.3)); else if (oPos && ['large', 'maniaque', 'fish'].includes(o.type)) w = w.map((x, i) => Math.max(x, pctArr()[i] < (o.type === 'maniaque' ? 0.5 : 0.35) ? 1 : 0));
    // Grosse relance d'un joueur normal ou serré : range plus forte.
    if (R / (o.straddle ? 2 : 1) >= 4.5 && !['fish', 'maniaque'].includes(o.type)) w = w.map((x, i) => x * (pctArr()[i] < 0.08 ? 1 : 0.45));
    const eqHU = SV.eqVsRange(hi, w);
    const eqM = callers ? multiEq(h, 1 + callers, Math.min(1, (T.raise + callers * T.call) / (1 + callers))) : null;
    const eq = eqM ?? eqHU, real = S.ip ? 0.95 : S.blind ? 0.82 : 0.88, need = toCall / (pot + toCall);
    const evCall = (eq * real * (pot + toCall) - toCall);
    const options = [{ k: 'Couche', ev: 0 }, { k: 'Suis', ev: evCall }];
    if (o.pre === 'threebet') {
      const four = E.parseRange(o.type === 'serre' ? 'KK+' : o.type === 'maniaque' ? 'TT+, AQ+' : 'QQ+, AK').has(h);
      if (four) { lines.push(`Contre un 3-bet ${T.label.toLowerCase()}, ${h} est assez fort pour 4-bet (≈ 2,3 × sa relance) ou tapis si les tapis sont courts.`); return res('RELANCE', fmt(R * 2.3) + ' BB', 'good', { eq, need, options }); }
      const ok = eq * real >= need && (h[0] === h[1] || h[2] === 's' || pct < 0.06) && stack >= 40;
      lines.push(`Ton équité contre sa range de 3-bet : ${pctS(eq)} (réalisée ≈ ${pctS(eq * real)}), il en faut ${pctS(need)}.`);
      return res(ok ? 'SUIS' : 'COUCHE', ok ? fmt(toCall) + ' BB' : '', ok ? 'warn' : 'bad', { eq, need, options });
    }
    if (chart && !callers) {
      const three = E.parseRange(chart.threebet).has(h), call = E.parseRange(chart.call).has(h);
      const loose = ['fish', 'large', 'maniaque'].includes(o.type), tight = o.type === 'serre';
      lines.push(`Chart SIGMA 52, ${oPos} ouvre et tu es ${hPos} : ${three ? '3-bet' : call ? 'call' : 'hors range'}. Ton équité contre sa range d'ouverture${tight ? ' resserrée (joueur serré)' : loose ? ' élargie (joueur large)' : ''} : ${pctS(eq)}.`);
      if (three && !(tight && !E.parseRange('QQ+, AK').has(h))) { const size = (S.ip ? 3 : 4) * R; lines.push(`3-bet à ${fmt(size)} BB.`); return res('RELANCE', fmt(size) + ' BB', 'good', { eq, need, options }); }
      if (call || (three && tight) || (loose && eq * real >= need)) { lines.push(call || three ? 'Call : main qui joue bien après le flop, sans dominer assez sa range pour 3-better.' : 'Hors chart, mais contre un ouvreur large ton équité couvre la cote.'); return res('SUIS', fmt(toCall) + ' BB', 'warn', { eq, need, options }); }
      lines.push(`Couche : cette main perd de l'argent contre sa range d'ouverture${S.ip ? '' : ', surtout hors de position'}.`);
      return res('COUCHE', '', 'bad', { eq, need, options });
    }
    const valueT = callers ? Math.max(0.42, 1 / (callers + 2) + 0.12) : 0.58;
    if (eq >= valueT || E.parseRange('QQ+, AK').has(h)) {
      const size = (S.ip ? 3 : 4) * R + R * callers;
      lines.push(`Ton équité contre ${callers ? 'la relance et ' + callers + ' caller' + (callers > 1 ? 's' : '') : 'sa range'} (${T.label.toLowerCase()}) : ${pctS(eq)}. ${callers ? 'Squeeze' : '3-bet'} pour la valeur à ${fmt(size)} BB.`);
      return res('RELANCE', fmt(size) + ' BB', 'good', { eq, need, options });
    }
    const implied = stack / R >= 20 && (h[0] === h[1] || h[2] === 's') ? (callers ? 0.08 : 0.06) : 0;
    const go = eq * real + implied >= need;
    if (!go && !callers && S.ip && BLUFF3.has(h) && ['normal', 'large', 'maniaque'].includes(o.type) && stack >= 50) {
      lines.push(`${h} est un bon 3-bet bluff en position : il bloque ses meilleures mains (as ou rois) et joue bien si payé. Contre un ouvreur ${T.label.toLowerCase()}, environ une fois sur deux.`);
      return res('RELANCE', fmt(3 * R) + ' BB', 'warn', { eq, need, options });
    }
    lines.push(`Ton équité ${callers ? 'à ' + (callers + 2) + ' joueurs' : 'contre sa range'} : ${pctS(eq)}${implied ? ' + cotes implicites (tapis profonds, main qui peut toucher fort)' : ''} ; il en faut ${pctS(need)}${S.ip ? ', tu es en position' : S.blind ? ', hors de position' : ''}.`);
    if (o.type === 'fish' && go) lines.push('Contre un fish, prévois de miser gros pour la valeur quand tu touches.');
    return res(go ? 'SUIS' : 'COUCHE', go ? fmt(toCall) + ' BB' : '', go ? 'warn' : 'bad', { eq, need, options });
  }

  // ---------------- Après le flop (hold'em, bomb pot) ----------------
  function postflop(o) {
    const t0 = Date.now();
    const hero = o.hero, board = o.board, type = TYPES[o.type] ? o.type : 'normal', T = TYPES[type], n = Math.max(1, Math.min(6, o.nOpp || 1)), lines = [];
    const street = STREET_NAMES[board.length], si = board.length - 3, toCome = 5 - board.length;
    const k = B.classify(hero, board), cat = B.MADE[k.made] + (k.draws.length ? ' + ' + k.draws.map((d) => B.DRAWS[d].toLowerCase()).join(', ') : '');
    const realPot = +o.pot > 0, toCall = Math.max(0, +o.toCall || 0);
    const P0 = realPot ? +o.pot : toCall > 0 ? toCall / 0.6 : 100;
    const stack = +o.stack > 0 ? +o.stack : P0 * 25, spr = stack / P0;
    const ip = o.ip ?? ['BTN', 'CO'].includes(o.pos);
    // Historique : ajoute la mise en cours si elle n'y est pas déjà.
    const hist = (o.history || []).slice();
    const last = hist[hist.length - 1];
    if (toCall > 0 && !(last && last.street === street && (last.a === 'bet' || last.a === 'raise'))) hist.push({ street, a: o.raised ? 'raise' : 'bet', size: toCall / P0 });
    const ctx = { mw: n > 1 ? 1 : 0, ip: ip ? 0 : 1, af: o.af || 0, tex: texture(board), pl: o.pl || null };
    const range = villainRange({ ...o, type, history: hist, ctx }, board, [...hero, ...board]);
    const vb = range.map((r) => bucket(r.c, board));
    const eqv = equityVec(hero, board, range, { random: o.random, runouts: o.runouts });
    const eqHU = range.reduce((s, r, i) => s + r.w * eqv[i], 0);
    const eq = n === 1 ? eqHU : equityMulti(hero, board, range, n, o.iterations || 1000, o.random || Math.random);
    const rho = toCome === 0 ? 1 : ip ? (toCome === 2 ? 0.92 : 0.96) : (toCome === 2 ? 0.82 : 0.9);
    const outs = outsOf(k);
    // Réponses adverses (modèle) à une mise de taille f (part du pot avant la mise) : fold / call / raise par combo.
    // Interpolation entre les trois classes de taille (centres 33 %, 66 %, 100 %) ; au-delà du pot, chaque tranche de 100 %
    // ajoute jusqu'à 25 % de couchers chez les mains moyennes (élasticité, plafonnée à 40 %).
    const LK = [0, 1, 2].map((sc) => BUCKETS.map((_, b) => likelihood(type, si, 1, sc, b, ctx)));
    const respB = (f, b) => {
      const cs = [0.33, 0.66, 1], p = (sc) => LK[sc][b];
      let q;
      if (f <= cs[0]) q = p(0); else if (f >= cs[2]) q = p(2).slice();
      else { const j = f < cs[1] ? 0 : 1, t = (f - cs[j]) / (cs[j + 1] - cs[j]); q = p(j).map((x, k) => x + (p(j + 1)[k] - x) * t); }
      if (f > 1) { const e = Math.min(0.4, 0.25 * (f - 1)) * (b >= 2 ? 1 : 0.3); const pf = q[0] + (1 - q[0]) * e, sc = (1 - pf) / Math.max(1e-9, 1 - q[0]); q = [pf, q[1] * sc, q[2] * sc]; }
      return q;
    };
    const resp = (f) => range.map((r, i) => respB(f, vb[i]));
    const evBet = (Bt) => {
      const pr = resp(Bt / P0); let ev = 0, pfAll = 0;
      for (let i = 0; i < range.length; i++) {
        const [pf, pc, pr3] = pr[i], e = eqv[i], w = range[i].w; pfAll += w * pf;
        const callV = (Bt >= stack ? 1 : rho) * e * (P0 + 2 * Bt) - Bt;
        const R3 = Math.min(stack, 3 * Bt), raiseV = Math.max(-Bt, (R3 >= stack ? 1 : rho) * e * (P0 + 2 * R3) - R3);
        ev += w * (pf * P0 + pc * callV + pr3 * raiseV);
      }
      if (n > 1) { const PF = Math.pow(pfAll, n); ev = PF * P0 + (1 - PF) * (rho * eq * (P0 + 2 * Bt) - Bt); }
      return { ev, fold: n > 1 ? Math.pow(pfAll, n) : pfAll };
    };
    const options = [];
    const sizeTxt = (amt) => (realPot ? `${fmt(amt, 0)} (${Math.round((amt / P0) * 100)} % du pot)` : `${Math.round((amt / P0) * 100)} % du pot`);
    if (toCall <= 0) {
      // Check : en position, la rue s'arrête ; hors de position, l'adversaire peut miser (≈ 60 % du pot) et tu choisis alors
      // de payer ou de te coucher selon ton équité contre sa range de mise.
      let evCheck = rho * eq * P0, pBetV = 0;
      if (!ip && n === 1 && toCome >= 0) {
        const Bv = 0.6 * P0, pb = range.map((r, i) => { const q = likelihood(type, si, 0, 0, vb[i], { ...ctx, ip: 1 }); return q[1] + q[2] + q[3]; });
        let wb = 0, eb = 0; range.forEach((r, i) => { wb += r.w * pb[i]; eb += r.w * pb[i] * eqv[i]; }); pBetV = wb;
        const eqB = wb > 0 ? eb / wb : 0, callOk = (toCome ? rho : 1) * eqB * (P0 + 2 * Bv) - Bv > 0;
        evCheck = 0; range.forEach((r, i) => { const e = eqv[i]; evCheck += r.w * ((1 - pb[i]) * rho * e * P0 + pb[i] * (callOk ? (toCome ? rho : 1) * e * (P0 + 2 * Bv) - Bv : 0)); });
      }
      options.push({ k: 'Check', act: 'CHECK', size: '', ev: evCheck, betAfter: pBetV });
      const polar = eq >= 0.75 || eq <= 0.3; // l'overbet se réserve aux ranges polarisées (très fort ou bluff)
      for (const f of n > 1 || !polar ? [0.33, 0.5, 0.75] : [0.33, 0.5, 0.75, 1.25]) { const Bt = Math.min(stack, f * P0); if (Bt >= stack && f > 0.33) continue; const r = evBet(Bt); options.push({ k: `Mise ${Math.round(f * 100)} %`, act: Bt >= stack ? 'TAPIS' : 'MISE', size: Bt >= stack ? 'tout' : sizeTxt(Bt), ev: r.ev, fold: r.fold, f, amt: Bt }); }
      if (stack <= 2.5 * P0) { const r = evBet(stack); options.push({ k: 'Tapis', act: 'TAPIS', size: 'tout', ev: r.ev, fold: r.fold, amt: stack }); }
    } else {
      const B2 = toCall, potAfter = P0 + 2 * B2, need = B2 / potAfter;
      options.push({ k: 'Couche', act: 'COUCHE', size: '', ev: 0 });
      options.push({ k: 'Suis', act: 'SUIS', size: realPot ? fmt(B2, 0) : '', ev: (B2 >= stack ? 1 : rho) * eq * (P0 + 2 * B2) - B2 });
      const raiseTo = (R) => {
        const add = R - B2, f = add / potAfter, pr = resp(f); let ev = 0, pfAll = 0;
        for (let i = 0; i < range.length; i++) {
          const [pf, pc, pr3] = pr[i], e = eqv[i], w = range[i].w; pfAll += w * pf;
          const callV = (R >= stack ? 1 : rho) * e * (P0 + 2 * R) - R, shoveV = e > 0.5 ? e * (P0 + 2 * stack) - stack : -R;
          ev += w * (pf * (P0 + B2) + pc * callV + pr3 * (R >= stack ? callV : shoveV));
        }
        if (n > 1) { const PF = Math.pow(pfAll, n); ev = PF * (P0 + B2) + (1 - PF) * (rho * eq * (P0 + 2 * R) - R); }
        return { ev, fold: n > 1 ? Math.pow(pfAll, n) : pfAll };
      };
      if (stack > B2) {
        const R1 = Math.min(stack, 3 * B2 + 0.0 * P0); const r1 = raiseTo(R1);
        options.push({ k: R1 >= stack ? 'Tapis' : 'Relance ×3', act: R1 >= stack ? 'TAPIS' : 'RELANCE', size: R1 >= stack ? 'tout' : (realPot ? 'à ' + fmt(R1, 0) : '×3'), ev: r1.ev, fold: r1.fold, amt: R1 });
        if (R1 < stack && stack <= 3 * potAfter) { const r2 = raiseTo(stack); options.push({ k: 'Tapis', act: 'TAPIS', size: 'tout', ev: r2.ev, fold: r2.fold, amt: stack }); }
      }
      lines.push(`À payer ${realPot ? fmt(B2, 0) + ' pour un pot final de ' + fmt(potAfter, 0) : Math.round((B2 / P0) * 100) + ' % du pot'} : il te faut ${pctS(need)} d'équité${rho < 1 ? ` (réalisation ≈ ${pctS(rho)}${ip ? ', en position' : ', hors de position'})` : ''}.`);
    }
    options.sort((a, b) => b.ev - a.ev);
    let best = options[0];
    // Multiway : pas de bluff si l'équité est sous la part équitable, sauf gain net.
    if (n > 1 && (best.act === 'MISE' || best.act === 'RELANCE') && eq < 1 / (n + 1) && best.ev - (options.find((x) => x.act === 'CHECK' || x.act === 'COUCHE' || x.act === 'SUIS')?.ev ?? 0) < 0.05 * P0) best = options.find((x) => x.act === 'CHECK' || x.act === 'SUIS' || x.act === 'COUCHE') || best;
    const second = options.find((x) => x !== best);
    const close = second && Math.abs(best.ev - second.ev) < 0.03 * P0;
    // Ce qui te bat : catégories de sa range, poids et ton équité contre chacune.
    const byB = BUCKETS.map((l) => ({ l, w: 0, e: 0 }));
    range.forEach((r, i) => { byB[vb[i]].w += r.w; byB[vb[i]].e += r.w * eqv[i]; });
    const beats = byB.map((x) => ({ label: x.l, p: x.w, eq: x.w > 0 ? x.e / x.w : null })).filter((x) => x.p >= 0.02);
    const ahead = range.reduce((s, r, i) => s + r.w * (eqv[i] < 0.5 ? 1 : 0), 0);
    const grid = new Array(169).fill(0); range.forEach((r) => (grid[r.h] += r.w)); const gm = Math.max(...grid) || 1; for (let i = 0; i < 169; i++) grid[i] /= gm;
    // Explications
    lines.unshift(`${cat}. Équité contre ${n > 1 ? n + ' adversaires' : 'sa range'} (${T.label.toLowerCase()}${hist.length ? ', après ses actions' : ''}) : ${pctS(eq)}.`);
    if (n === 1) lines.push(`Il a mieux que toi ${pctS(ahead)} du temps${beats.filter((b) => b.eq !== null && b.eq < 0.5).length ? ' : ' + beats.filter((b) => b.eq < 0.5).map((b) => `${b.label.toLowerCase()} ${pctS(b.p)}`).join(', ') : ''}.`);
    if (outs && toCome) lines.push(`${outs} outs : ≈ ${pctS(Math.min(1, (outs * (toCome === 2 ? 4 : 2)) / 100))} de toucher ${toCome === 2 ? 'd\'ici la river' : 'à la prochaine carte'}.`);
    const tex = B.texture(board); lines.push(`Board ${tex.join(', ')}${toCome ? '' : ''} · SPR ${fmt(spr)}.`);
    const why = best.fold !== undefined ? ` Il se couche ≈ ${pctS(best.fold)} du temps face à cette taille.` : '';
    if (best.act === 'MISE' || best.act === 'RELANCE' || best.act === 'TAPIS') lines.push(`${best.k} : meilleure EV estimée (${second ? '+' + fmt(best.ev - second.ev, realPot ? 1 : 1) + (realPot ? '' : ' % du pot') + ' par rapport à « ' + second.k.toLowerCase() + ' »' : ''}).${why}`);
    else if (best.act === 'SUIS') lines.push(`Payer rapporte plus que relancer ou se coucher.${outs >= 8 && toCome ? ' Tes outs et la position justifient de voir la suite.' : ''}`);
    else if (best.act === 'CHECK') lines.push(n > 1 ? 'À plusieurs, check : trop de joueurs pour qu\'une mise passe.' : 'Check : aucune mise ne rapporte plus (trop de mains meilleures paient, les moins bonnes se couchent).' + (best.betAfter ? ` Après ton check, il mise ≈ ${pctS(best.betAfter)} du temps : décide à l'avance si tu paieras.` : ''));
    else lines.push(T.keep === 'strong' || hist.some((x) => x.a === 'raise') ? 'Ses actions montrent une main forte chez ce profil : couche sans regret.' : 'Ton équité ne couvre pas la cote : couche.');
    if (close) lines.push(`Décision serrée : « ${second.k.toLowerCase()} » est presque aussi bon.`);
    // Taille effective de sa range (combos « pleins » équivalents) : montre combien ses actions l'ont resserrée.
    const sw = range.reduce((a, r) => a + r.w, 0), sw2 = range.reduce((a, r) => a + r.w * r.w, 0), effN = sw2 > 0 ? (sw * sw) / sw2 : range.length;
    // Plan sur les rues suivantes (v14) : taille géométrique pour finir à tapis à la river avec une main de valeur,
    // contrôle du pot avec une main moyenne, abandon prévu avec un bluff sans équité.
    let plan = null;
    if (toCome >= 0 && n === 1) {
      const streets = toCome + 1, potNow = toCall > 0 ? P0 + 2 * toCall : P0, stk = Math.max(0, stack - (toCall > 0 && best.act === 'SUIS' ? toCall : 0));
      const geo = stk > 0 ? (Math.pow(1 + (2 * stk) / potNow, 1 / streets) - 1) / 2 : 0;
      if (eq >= 0.7 && stk > 0) plan = { kind: 'valeur', geo, text: streets > 1 ? `Plan valeur : environ ${Math.round(geo * 100)} % du pot à chaque rue (${streets} rues) met ton tapis au milieu à la river.` : `Plan valeur : à la river, la mise qui engage tout le tapis fait ${Math.round(geo * 100)} % du pot.` };
      else if (eq >= 0.45 && eq < 0.7) plan = { kind: 'controle', text: 'Plan : contrôle du pot. Une mise de valeur fine ou un check, puis paie une mise raisonnable et couche face à une grosse relance d\'un joueur passif.' };
      else if ((best.act === 'MISE' || best.act === 'RELANCE') && eq < 0.35) plan = { kind: 'bluff', text: toCome ? `Plan bluff : ${outs ? `si tu touches un de tes ${outs} outs, continue pour la valeur ; sinon ` : ''}abandonne au turn sauf carte qui améliore ta range.` : 'Plan bluff : une seule balle, n\'y reviens pas s\'il paie.' };
    }
    if (plan) lines.push(plan.text);
    if (o.pl && (o.pl.sd || (o.pl.face && o.pl.face.reduce((a, b) => a + b, 0) >= 3))) lines.push(`Profil appris sur ce joueur : ${o.pl.sd ? o.pl.sd + ' abattage' + (o.pl.sd > 1 ? 's' : '') : ''}${o.pl.sd && o.pl.face ? ', ' : ''}${o.pl.face ? (o.pl.face.reduce((a, b) => a + b, 0)) + ' réactions à tes mises' : ''} pris en compte.`);
    const evScale = realPot ? 1 : 100 / P0;
    const tone = best.act === 'COUCHE' ? 'bad' : close || best.act === 'CHECK' ? 'warn' : best.ev > 0 ? 'good' : 'warn';
    return { street, hand: E.abstractOf(hero[0], hero[1]), cat, action: best.act, size: best.size, amount: best.amt, tone, eq, need: toCall > 0 ? toCall / (P0 + 2 * toCall) : 0, outs, spr, lines,
      options: options.map((x) => ({ k: x.k, act: x.act, size: x.size, ev: x.ev * evScale, fold: x.fold })), evUnit: realPot ? 'jetons' : '% du pot', beats, grid, combos: range.length, effCombos: Math.round(effN), plan, tex: ctx.tex, ip, ms: Date.now() - t0, close: !!close };
  }

  // ---------------- Omaha pot-limit ----------------
  // Score rapide d'une main de départ PLO (paires hautes, couleurs, connexion, pénalités) pour estimer des ranges.
  function ploScore(h) {
    const r = h.map((c) => c >> 2), s = h.map((c) => c & 3), cnt = {}, bySuit = [0, 0, 0, 0];
    r.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1)); s.forEach((x) => bySuit[x]++);
    let sc = 0;
    for (const [rk, n] of Object.entries(cnt)) { if (n === 2) sc += (+rk + 2) * 1.6; if (n >= 3) sc -= 8; }
    for (let su = 0; su < 4; su++) if (bySuit[su] === 2) { const hi = Math.max(...h.filter((c) => (c & 3) === su).map((c) => c >> 2)); sc += 2.5 + (hi === 12 ? 5 : hi === 11 ? 2.5 : hi >= 9 ? 1 : 0); } else if (bySuit[su] >= 3) sc -= 2.5;
    const u = [...new Set(r)].sort((a, b) => b - a);
    for (let i = 0; i + 1 < u.length; i++) { const g = u[i] - u[i + 1]; if (g <= 3) sc += (4 - g) * 1.3; }
    if (u.length === 4 && u[0] - u[3] <= 4) sc += 3;
    sc += r.filter((x) => x >= 8).length * 1.2;
    for (const x of u) if (cnt[x] === 1 && u.every((y) => y === x || Math.abs(y - x) > 4) && !h.some((c, i) => (c >> 2) === x && bySuit[s[i]] === 2)) sc -= 3;
    return sc;
  }
  let PLOQ = null;
  function ploQuantile(q) { // score au-dessus duquel se trouvent q % des mains
    if (!PLOQ) { const R = seededRand(99), v = []; for (let i = 0; i < 6000; i++) { const d = new Set(); while (d.size < 4) d.add(Math.floor(R() * 52)); v.push(ploScore([...d])); } PLOQ = v.sort((a, b) => b - a); }
    return PLOQ[Math.min(PLOQ.length - 1, Math.max(0, Math.floor(q * PLOQ.length)))];
  }
  const ploPct = (h) => { ploQuantile(0.5); const sc = ploScore(h); let lo = 0; while (lo < PLOQ.length && PLOQ[lo] > sc) lo++; return lo / PLOQ.length; };
  // Filtre d'action rapide : paire ou mieux (2 + 3), tirage couleur ; deux paires ou mieux.
  function ploHas(h, board, level) {
    const br = board.map((c) => c >> 2), hr = h.map((c) => c >> 2), bs = [0, 0, 0, 0]; board.forEach((c) => bs[c & 3]++);
    const boardPaired = new Set(br).size < br.length, hits = new Set(hr.filter((x) => br.includes(x))), pocket = hr.some((x, i) => hr.indexOf(x) !== i);
    const fd = board.length < 5 && [0, 1, 2, 3].some((su) => bs[su] >= 2 && h.filter((c) => (c & 3) === su).length >= 2);
    const madeFlush = [0, 1, 2, 3].some((su) => bs[su] >= 3 && h.filter((c) => (c & 3) === su).length >= 2);
    const pair = hits.size > 0 || pocket || boardPaired, twoPair = hits.size >= 2 || [...hits].some((x) => hr.filter((y) => y === x).length >= 2) || (boardPaired && hits.size >= 1) || madeFlush;
    if (level === 2) return twoPair || (fd && h.some((c) => (c >> 2) === 12 && bs[c & 3] >= 2));
    return pair || fd || madeFlush;
  }
  // ---------------- Variantes : PLO, Omaha 5 cartes, Omaha Hi-Lo, Short Deck ----------------
  const VV = root.Variants || (typeof require !== 'undefined' ? (() => { try { return require('./variants.js'); } catch (e) { return null; } })() : null);
  const VD = root.VariantsData || (typeof require !== 'undefined' ? (() => { try { return require('./variants_data.js'); } catch (e) { return null; } })() : null);
  const VQ = root.VariantsQ || (typeof require !== 'undefined' ? (() => { try { return require('./variants_q.js'); } catch (e) { return null; } })() : null);
  // PLO : rang exact de la main parmi les 270 725 mains (16 432 classes), d'après la table précalculée.
  let PLO_PCT = null;
  function ploTable(h) {
    if (!VD || !VV) return null;
    const { keys, eq, w } = VD.plo;
    if (!PLO_PCT) { const idx = keys.map((_, i) => i).sort((x, y) => eq[y] - eq[x]), tot = w.reduce((x, y) => x + y, 0); PLO_PCT = new Float32Array(keys.length); let cum = 0; for (const i of idx) { PLO_PCT[i] = (cum + w[i] / 2) / tot; cum += w[i]; } }
    const k = VV.canon(h); let lo = 0, hi = keys.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (keys[m] < k) lo = m + 1; else hi = m; }
    return keys[lo] === k ? { pct: PLO_PCT[lo], eq: eq[lo] / 1000 } : null;
  }
  // Short Deck : 81 mains, équité contre 1, 2, 3 mains aléatoires et rang pondéré par le nombre de combinaisons.
  let SD_TAB = null;
  function sdTable(name) {
    if (!VD) return null;
    if (!SD_TAB) { SD_TAB = {}; const rows = VD.sd.map(([nm, e1, e2, e3]) => ({ nm, e: [e1 / 1000, e2 / 1000, e3 / 1000], w: nm.length === 2 ? 6 : nm[2] === 's' ? 4 : 12 })).sort((x, y) => y.e[0] - x.e[0]); let cum = 0; for (const r of rows) { r.pct = (cum + r.w / 2) / 630; cum += r.w; SD_TAB[r.nm] = r; } }
    return SD_TAB[name] || null;
  }
  // Score rapide (sert à bâtir les ranges adverses en Omaha 5 cartes et Hi-Lo)
  const OCAL = root.OmahaCalib || (typeof require !== 'undefined' ? (() => { try { return require('./omaha_calib.js'); } catch (e) { return null; } })() : null);
  function vScore(h, game) {
    // Score calibré par régression sur l'équité (Omaha 5 et Hi-Lo) ; repli heuristique sinon.
    if (OCAL && OCAL[game]) { const f = OCAL.feats(h, game); return f.reduce((a, x, i) => a + x * OCAL[game].w[i], 0); }
    let sc = ploScore(h);
    if (game === 'plo8') { const r = new Set(h.map((c) => c >> 2)); if (r.has(12) && r.has(0)) sc += 7; else if (r.has(12) && r.has(1)) sc += 4; sc += [0, 1, 2, 3].filter((x) => r.has(x)).length * 1.2; }
    return sc;
  }
  const VSQ = {};
  function vScoreQuantile(game, q) {
    if (!VSQ[game]) { const R = seededRand(77), d = VV.deckOf(game), nH = VV.GAMES[game].hole, v = []; for (let i = 0; i < 5000; i++) { const h = new Set(); while (h.size < nH) h.add(d[Math.floor(R() * d.length)]); v.push(vScore([...h], game)); } VSQ[game] = v.sort((a, b) => b - a); }
    const L = VSQ[game]; return L[Math.min(L.length - 1, Math.max(0, Math.floor(q * L.length)))];
  }
  function quantilePct(q, eq) { let i = 0; while (i < q.length && q[i] / 1000 > eq) i++; return i / (q.length - 1); }
  // Rang préflop de la main du héros pour chaque variante
  function heroPct(game, hero, R) {
    if (game === 'plo') { const t = ploTable(hero); if (t) return { pct: t.pct, eq: t.eq, exact: true }; return { pct: ploPct(hero), eq: null }; }
    if (game === 'sd') { const t = sdTable(E.abstractOf(hero[0], hero[1])); return t ? { pct: t.pct, eq: t.e[0], exact: true } : { pct: 0.5, eq: null }; }
    const e = VV.equity(game, [hero, null], [], { iterations: 400, random: R }).equity[0], q = game === 'plo5' ? VD?.plo5q : VQ?.plo8q;
    return { pct: q ? quantilePct(q, e) : 0.5, eq: e };
  }
  // Acceptation d'une main adverse dans sa range préflop (top « width »)
  function rangeAccept(game, width) {
    if (width >= 1) return () => true;
    if (game === 'plo' && VD) return (h) => { const t = ploTable(h); return t ? t.pct <= width : ploScore(h) >= ploQuantile(width); };
    if (game === 'sd' && VD) return (h) => { const t = sdTable(E.abstractOf(h[0], h[1])); return t ? t.pct <= width : true; };
    const thr = vScoreQuantile(game, width); return (h) => vScore(h, game) >= thr;
  }
  const GNAME = { plo: 'PLO', plo5: 'Omaha 5 cartes', plo8: 'Omaha Hi-Lo', sd: 'Short Deck' };
  function variantDecide(o, game) {
    if (!VV) return null;
    const G = VV.GAMES[game], t0 = Date.now(), hero = o.hero, board = o.board || [], n = Math.max(1, Math.min(5, o.nOpp || 1)), lines = [], T = TYPES[o.type] || TYPES.normal;
    const omaha = game !== 'sd', R = o.random || seededRand(hero.reduce((a, c) => a * 53 + c, 11) + board.length);
    const D = omaha && O ? O.describe(hero.slice(0, 4)) : null, HP = heroPct(game, hero, R);
    const width = o.pre === 'raise' || o.pre === 'threebet' || o.vpre === 'raise' ? Math.min(1, T.raise * (omaha ? 1.8 : 1.4)) : o.vpre === 'bomb' ? 1 : Math.min(1, T.call * (omaha ? 1.3 : 1.2));
    const accept = rangeAccept(game, width), toCall = Math.max(0, +o.toCall || 0), realPot = +o.pot > 0;
    const used = new Set([...hero, ...board]), deck = VV.deckOf(game).filter((c) => !used.has(c));
    const level = board.length >= 3 && toCall > 0 ? (o.raised ? 2 : 1) : 0, pool = [];
    for (let tries = 0; tries < 25000 && pool.length < 300; tries++) {
      const h = []; while (h.length < G.hole) { const c = deck[Math.floor(R() * deck.length)]; if (!h.includes(c)) h.push(c); }
      if (!accept(h)) continue; if (level && !ploHas(h, board, level)) continue; pool.push(h);
    }
    let eq = 0.5, it = 0, sum = 0;
    if (pool.length) {
      const iters = o.iterations || (omaha ? (board.length === 5 ? 500 : 700) : 1500);
      for (let k = 0; k < iters; k++) {
        const opp = [], u = new Set(used); let ok = true;
        for (let j = 0; j < n; j++) { let h, m = 0; do h = pool[Math.floor(R() * pool.length)]; while (h.some((c) => u.has(c)) && ++m < 20); if (m >= 20) { ok = false; break; } h.forEach((c) => u.add(c)); opp.push(h); }
        if (!ok) continue;
        const bd = board.slice(); while (bd.length < 5) { const c = deck[Math.floor(R() * deck.length)]; if (!u.has(c)) { u.add(c); bd.push(c); } }
        sum += VV.shares(G, [hero, ...opp], bd)[0]; it++;
      }
      eq = it ? sum / it : 0.5;
    }
    const tags = game === 'sd' ? 'Short Deck · top ' + pctS(Math.max(0.01, HP.pct)) : D ? D.tags.join(', ') : '';
    const res = (action, size, tone, extra = {}) => ({ game, street: board.length ? STREET_NAMES[board.length] : 'pre', hand: game === 'sd' ? E.abstractOf(hero[0], hero[1]) : hero.map(E.cardStr).join(''), cat: tags, action, size, tone, eq, lines, ms: Date.now() - t0, ...extra });
    const raiseTxt = (pot, call) => (omaha ? 'pot (' + fmt(O ? O.potRaise(pot, call) : pot + 2 * call, 1) + ' BB)' : fmt(3 * Math.max(call, 1), 1) + ' BB');
    if (!board.length) {
      const S = seatInfo(o);
      lines.push(`${GNAME[game]} : ta main est dans le top ${pctS(Math.max(0.01, HP.pct))} des mains${HP.exact ? ' (classement exact précalculé)' : ' (équité contre une main aléatoire : ' + pctS(HP.eq || 0) + ')'}.`);
      if (o.pre === 'open') {
        const openPct = S.N === 2 ? (omaha ? 0.75 : 0.8) : (omaha ? [1, 0.6, 0.45, 0.3, 0.22, 0.17, 0.14, 0.12, 0.1, 0.09] : [1, 0.55, 0.45, 0.32, 0.25, 0.2, 0.17, 0.15, 0.13, 0.12])[Math.min(9, S.behind)];
        const go = HP.pct <= openPct && S.pos !== 'BB';
        lines.push(`Ouverture depuis ${S.pos} : environ ${pctS(openPct)} des mains.`);
        return res(go ? 'RELANCE' : S.pos === 'BB' ? 'CHECK' : 'COUCHE', go ? (omaha ? 'pot (3,5 BB)' : fmt(o.live ? 3 : 2.5) + ' BB') : '', go ? 'good' : 'bad', { pct: HP.pct });
      }
      const Rb = Math.max(2, o.raiseBB || 3.5), pot = 1.5 + Rb * (1 + (o.callers || 0)), call = Rb - (S.pos === 'BB' ? 1 : S.pos === 'SB' ? 0.5 : 0), need = call / (pot + call);
      lines.push(`Équité estimée contre ${n > 1 ? n + ' adversaires' : 'sa range'} : ${pctS(eq)} ; il en faut ${pctS(need)}${S.ip ? ', tu es en position' : ''}.`);
      if (eq >= (n === 1 ? (omaha ? 0.57 : 0.6) : 0.45) && HP.pct < 0.06) return res('RELANCE', raiseTxt(pot, call), 'good');
      const go = eq * (S.ip ? 0.92 : 0.82) >= need && HP.pct < (omaha ? 0.45 : 0.5);
      return res(go ? 'SUIS' : 'COUCHE', go ? fmt(call) + ' BB' : '', go ? 'warn' : 'bad');
    }
    const P0 = realPot ? +o.pot : toCall > 0 ? toCall / 0.7 : 100, potMax = toCall > 0 ? (O ? O.potRaise(P0 + toCall, toCall) : P0 + 3 * toCall) : P0;
    const sizeTxt = (amt) => (realPot ? `${fmt(amt, 0)} (${Math.round((amt / P0) * 100)} % du pot)` : `${Math.round((amt / P0) * 100)} % du pot`);
    const made = omaha ? E.CAT_FR[E.category(G.hi(hero, board))] : G.cat(G.hi(hero, board));
    lines.push(`Main : ${made}${game === 'plo8' && G.lo(hero, board.length === 5 ? board : board) >= 0 ? ' + main basse' : ''}. Équité estimée contre ${n > 1 ? n + ' adversaires' : 'sa range'} : ${pctS(eq)} (${pool.length} mains adverses compatibles, ${it} tirages).`);
    lines.push(omaha ? (game === 'plo8' ? 'Hi-Lo : vise le scoop ; une basse seule risque le partage en quatre.' : 'Rappel : 2 cartes de ta main + 3 du board. Joue les nuts et les tirages aux nuts.') : 'Short Deck : la couleur bat le full, le brelan bat la suite.');
    if (toCall > 0) {
      const need = toCall / (P0 + 2 * toCall);
      lines.push(`À payer ${realPot ? fmt(toCall, 0) : Math.round((toCall / P0) * 100) + ' % du pot'} : il te faut ${pctS(need)}.`);
      if (eq >= Math.max(n === 1 ? 0.62 : 0.5, need + 0.15)) return res('RELANCE', omaha ? 'pot (' + (realPot ? 'à ' + fmt(potMax, 0) : 'max') + ')' : realPot ? 'à ' + fmt(3 * toCall, 0) : '×3', 'good', { need });
      const go = eq * (board.length === 5 ? 1 : 0.88) >= need;
      return res(go ? 'SUIS' : 'COUCHE', go && realPot ? fmt(toCall, 0) : '', go ? 'warn' : 'bad', { need });
    }
    if (eq >= 1 / (n + 1) + (n === 1 ? 0.12 : 0.2)) return res('MISE', sizeTxt(P0 * (n > 1 ? (omaha ? 1 : 0.75) : 0.66)), 'good');
    if (n === 1 && eq >= 0.4 && board.length < 5) return res('MISE', sizeTxt(P0 * 0.6), 'warn', { lines: lines.concat('Gros tirage : semi-bluff.') });
    return res('CHECK', '', 'warn');
  }
  const ploDecide = (o) => variantDecide(o, 'plo');

  // ---------------- Point d'entrée ----------------
  function decide(o) {
    const game = o.game || 'nlh';
    if (['plo', 'plo5', 'plo8', 'sd'].includes(game)) {
      const nH = game === 'plo5' ? 5 : game === 'sd' ? 2 : 4;
      if (!o.hero || o.hero.length !== nH || new Set(o.hero).size !== nH) return null; if (o.board && o.board.length && o.board.length < 3) return null;
      if (game === 'sd' && [...o.hero, ...(o.board || [])].some((c) => (c >> 2) < 4)) return { action: '?', tone: 'warn', lines: ['Short Deck : pas de 2, 3, 4 ni 5 dans le jeu.'], hand: '' };
      return variantDecide(o, game);
    }
    if (!o.hero || o.hero.length !== 2 || o.hero[0] === o.hero[1]) return null;
    if (game === 'bomb') { if (!o.board || o.board.length < 3) return { street: 'pre', action: 'ATTENDS', size: 'le flop', tone: 'idle', lines: ['Bomb pot : pas de préflop. Saisis le flop.'], hand: E.abstractOf(o.hero[0], o.hero[1]) }; return postflop({ ...o, vpre: 'bomb', nOpp: o.nOpp || Math.max(1, (o.players || 6) - 1) }); }
    if (!o.board || o.board.length === 0) return preflop(o);
    if (o.board.length < 3) return null;
    return postflop(o);
  }


  // ---------------- Adaptateur pour la table simulée : n'importe quel siège peut jouer avec ce moteur ----------------
  const BOT_TYPE = { nit: 'serre', reg: 'normal', station: 'fish', maniaque: 'maniaque', mizrachi: 'large', action: 'action', prolive: 'normal', sigma: 'normal' };
  const ORDER6 = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
  function fromTable(tb, i, fast = true) {
    const L0 = tb.legal(), me = tb.players[i], bb = tb.bb, pos = TS.posName(tb, i);
    const opps = tb.players.map((p, k) => [p, k]).filter(([p, k]) => k !== i && p.inHand && !p.out);
    const aggr = [...tb.seq].reverse().find((x) => x.final === 'raise' && x.i !== i);
    const vi = aggr && tb.players[aggr.i].inHand ? aggr.i : opps.length ? opps[0][1] : (i + 1) % tb.n;
    const vp = tb.players[vi], vt = vp.hero ? 'normal' : BOT_TYPE[vp.profile] || BOT_TYPE[TS.kindOf(TS.PROFILES[vp.profile] || {}, vp.profile)] || 'normal';
    const o = { hero: me.cards, board: tb.board.slice(), players: tb.active().length, pos, nOpp: Math.max(1, opps.length), type: vt, stackBB: tb.effStack(i) / bb };
    if (fast) { o.runouts = 40; o.iterations = 500; }
    if (tb.street === 'pre') {
      const pre = tb.seq.filter((x) => x.street === 'pre'), before = pre.filter((x) => x.i !== i), raises = before.filter((x) => x.final === 'raise').length, heroRaised = pre.some((x) => x.i === i && x.final === 'raise');
      const calls = before.filter((x) => x.final === 'call').length;
      if (heroRaised) { o.pre = 'threebet'; o.raiseBB = tb.cur / bb; o.openBB = me.put / bb; }
      else if (raises === 0) { o.pre = calls ? 'limp' : 'open'; o.limpers = calls; }
      else { const lastR = before.map((x, k) => [x, k]).filter(([x]) => x.final === 'raise').pop()[1]; const after = before.slice(lastR + 1).filter((x) => x.final === 'call').length; o.pre = after ? 'raisecall' : 'raise'; o.callers = after; o.raiseBB = tb.cur / bb; }
      return o;
    }
    const vpre = vp.acts.filter((a) => a.street === 'pre' && (a.final === 'raise' || a.final === 'call')), vRaised = vpre.some((a) => a.final === 'raise'), heroPreRaise = me.acts.some((a) => a.street === 'pre' && a.final === 'raise');
    o.vpre = vRaised ? (heroPreRaise ? 'threebet' : 'raise') : vpre.length ? (heroPreRaise ? 'call' : 'limp') : 'call';
    o.pot = (L0.pot - L0.toCall) / bb; o.toCall = L0.toCall / bb; o.stack = me.stack / bb;
    o.ip = ORDER6.indexOf(pos) > ORDER6.indexOf(TS.posName(tb, vi));
    o.raised = L0.toCall > 0 && me.put > 0;
    const hist = [];
    for (const a of vp.acts) {
      if (a.street === 'pre' || a.street === tb.street) continue;
      if (a.final === 'check') hist.push({ street: a.street, a: 'check' });
      else if (a.final === 'call') hist.push({ street: a.street, a: 'call', size: a.toCall / Math.max(1e-9, a.pot - a.toCall) });
      else if (a.final === 'raise') hist.push({ street: a.street, a: a.toCall > 0 ? 'raise' : 'bet', size: a.size });
    }
    o.history = hist;
    return o;
  }
  // Joue l'action conseillée sur la table. Retourne true si une action a été jouée.
  function actTable(tb, i) {
    const L0 = tb.legal(), bb = tb.bb; let r = null;
    try { r = decide(fromTable(tb, i)); } catch (e) { r = null; }
    if (!r || !r.action || r.action === '?') return false;
    const a = r.action;
    if (a === 'COUCHE' || a === 'CHECK') tb.act(L0.canCheck ? 'check' : 'fold');
    else if (a === 'SUIS') tb.act(L0.canCheck ? 'check' : 'call');
    else if (a === 'TAPIS') tb.act('raise', L0.maxTo);
    else if (tb.street === 'pre') { const x = parseFloat(String(r.size).replace(',', '.')); tb.act('raise', (isFinite(x) ? x : 3) * bb); }
    else { const amt = (r.amount || 0) * bb; tb.act('raise', L0.toCall > 0 ? tb.cur + Math.max(amt - L0.toCall, tb.minRaise) : Math.max(amt, bb)); }
    return true;
  }
  if (TS && TS.setExternal) TS.setExternal(actTable);

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

  const api = { texture, learnShowdown, personal, TYPES, POSITIONS, POS_BY_N, positions, BUCKETS, decide, preflop, postflop, preRange, preWeights, villainRange, equityVec, bucket, likelihood, ploScore, ploPct, structure, chips, payouts, variantDecide, ploTable, sdTable, vScore, fromTable, actTable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Live = api;
})(typeof window !== 'undefined' ? window : globalThis);
