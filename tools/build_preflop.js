// Solveur préflop 6-max simplifié (CFR+ vectorisé sur les 169 classes, six joueurs, tapis égaux).
// Arbre : ouverture (ou tapis aux faibles profondeurs) du premier joueur qui entre ; chaque joueur suivant se couche, paie,
// 3-bet ou fait tapis ; après un call, les joueurs suivants peuvent squeezer ; pas de pot à plusieurs (simplification) ;
// l'ouvreur répond au 3-bet (couché, call, 4-bet ou tapis), puis 5-bet tapis aux grosses profondeurs.
// Valeur d'un pot payé sans tapis : pot × équité réalisée (en position 100 %, hors de position 72 % en pot simple, 82 % en pot 3-bet,
// 90 % au-delà, modulée par la jouabilité de la main ; normalisée pour que les deux parts fassent le pot). Tapis payé : équité pure. Blocages exacts à l'abattage.
// Usage : node tools/build_preflop.js [itérations]   -> src/preflop_data.js
const E = require('../src/engine.js'), SV = require('../src/solver.js'), fs = require('fs'), path = require('path');
const POS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
let ITER = +(process.argv[2]) || 600;
// Jeu courant : Hold'em (169 classes) par défaut ; useGame() le remplace (PLO : classes regroupées en paquets).
let N = 169, EQ = SV.EQ, W = SV.W, TOT = 1326;
let prior = Float64Array.from(W, (w) => w / TOT);
// CNTw(i,j) = part des paires de combos (i,j) compatibles : conditionnement par les cartes bloquées.
let CW = new Float64Array(N * N); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) CW[i * N + j] = SV.CNT[i * N + j] / (W[i] * W[j]);
const postOrder = (p) => (p === 4 ? 0 : p === 5 ? 1 : p + 2); // SB, BB, UTG, HJ, CO, BTN
// Jouabilité (réalisation d'équité relative) par classe : paires et mains assorties connectées réalisent mieux,
// les mains dépareillées et les gros-petits dépareillés moins. Hypothèse de modèle, pas une mesure.
let PLAY = E.ALL169.map((h) => {
  const R = '23456789TJQKA', a = R.indexOf(h[0]), b = R.indexOf(h[1]);
  if (a === b) return 1.05;
  const gap = a - b - 1, suited = h[2] === 's';
  let p = 1 + (suited ? 0.06 : -0.07) + (gap === 0 ? 0.05 : gap === 1 ? 0.025 : gap === 2 ? 0 : -0.06) + (b >= 8 ? 0.04 : 0);
  if (!suited && a >= 10 && b <= 4) p -= 0.06;
  return p;
});
const shareCache = new Map();
function useGame(g) { N = g.N; EQ = g.EQ; W = g.W; TOT = g.TOT; prior = Float64Array.from(W, (w) => w / TOT); CW = g.CW || new Float64Array(N * N).fill(1); PLAY = g.PLAY; shareCache.clear(); }
function shareMat(ra, rb) { // part du pot de a contre b (réalisation ra, rb, modulée par la jouabilité), multipliée par CW
  const k = ra + ':' + rb; if (shareCache.has(k)) return shareCache.get(k);
  const A = new Float64Array(N * N), allin = ra === 'x';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const e = EQ[i * N + j];
    let s = e;
    if (!allin) { const x = e * ra * PLAY[i], y = (1 - e) * rb * PLAY[j]; s = x + y > 0 ? x / (x + y) : 0.5; }
    A[i * N + j] = s * CW[i * N + j];
  }
  shareCache.set(k, A); return A;
}

function buildTree(cfg) {
  const S = cfg.stack, nodes = [], terms = [];
  const ante = [0, 0, 0, 0, 0, cfg.ante || 0];
  const mk = (n) => { n.id = nodes.length + terms.length; (n.t === 'act' ? nodes : terms).push(n); return n; };
  const potOf = (inv) => inv.reduce((a, b) => a + b, 0) + ante.reduce((a, b) => a + b, 0);
  const fold = (inv, w) => mk({ t: 'fold', w, inv: inv.slice() });
  function show(inv, a, b, allin, level) {
    const ip = postOrder(a) > postOrder(b) ? a : b, RO = cfg.ro || [0.72, 0.82, 0.9], ro = level >= 3 ? RO[2] : level === 2 ? RO[1] : RO[0];
    const [ra, rb] = allin ? ['x', 'x'] : [a === ip ? 1 : ro, b === ip ? 1 : ro];
    return mk({ t: 'show', a, b, inv: inv.slice(), pot: potOf(inv), A: shareMat(ra, rb), B: shareMat(rb, ra), allin });
  }
  const act = (p, key, label, acts) => mk({ t: 'act', p, key, label, acts });
  // Pot à trois : réalisation selon l'ordre de parole après le flop (dernier 100 %, milieu 85 %, premier 70 %).
  function show3(inv, a, b, c) {
    const pl = [a, b, c], ord = pl.slice().sort((x, y) => postOrder(x) - postOrder(y)), re = (p) => [0.7, 0.85, 1][ord.indexOf(p)];
    const M = {}; for (const u of pl) for (const q of pl) if (u !== q) M[u + ':' + q] = shareMat(re(u), re(q));
    return mk({ t: 'show3', pl, inv: inv.slice(), pot: potOf(inv), M });
  }
  const put = (inv, p, to) => { const x = inv.slice(); x[p] = Math.min(S, to); return x; };
  const toAllin = (to) => to >= cfg.shoveAt * S;
  // Face à un tapis : se coucher ou payer.
  function vsShove(inv, p, sh, key, label, level, onFold) {
    return act(p, key, label, [{ k: 'f', l: 'Se coucher', ch: onFold() }, { k: 'c', l: 'Payer', ch: show(put(inv, p, S), sh, p, true, level) }]);
  }
  function rfi(k, inv) {
    if (k === 5) return fold(inv, 5);
    const acts = [{ k: 'f', l: 'Se coucher', ch: rfi(k + 1, inv) }];
    const o = k === 4 ? cfg.openSB : cfg.open;
    if (!cfg.shoveOnly) acts.push({ k: 'r', l: `Relancer ${String(o).replace('.', ',')} bb`, ch: responders(k, k + 1, put(inv, k, o), o) });
    if (cfg.shoveOnly || S <= cfg.openShoveMax) acts.push({ k: 'a', l: 'Tapis', ch: responders(k, k + 1, put(inv, k, S), S) });
    if (k === 4 && !cfg.shoveOnly && cfg.limp !== false) acts.push({ k: 'c', l: 'Compléter (limp)', ch: limped(put(inv, 4, 1)) });
    return act(k, `rfi:${POS[k]}`, `${POS[k]} : premier à entrer`, acts);
  }
  // Limp de la petite blinde : la grosse blinde check ou relance (isolation) ; la petite blinde se couche, paie ou sur-relance.
  function limped(inv) {
    const iso = cfg.iso || 3.5, isoAll = toAllin(iso);
    const vsIso = (inv2) => {
      const to3 = cfg.threeOOP * iso, acts = [{ k: 'f', l: 'Se coucher', ch: fold(inv2, 5) }, { k: 'c', l: 'Payer', ch: show(put(inv2, 4, iso), 4, 5, false, 1) }];
      if (toAllin(to3) || S <= cfg.threeShoveMax) acts.push({ k: 'a', l: 'Tapis', ch: vsShove(put(inv2, 4, S), 5, 4, 'lpa:SB', 'BB face au tapis de SB après son limp', 2, () => fold(put(inv2, 4, S), 4)) });
      else acts.push({ k: 'r', l: `Sur-relancer ${String(+to3.toFixed(1)).replace('.', ',')} bb`, ch: vs3(5, 4, put(inv2, 4, to3), to3) });
      return act(4, 'lpr:SB', 'SB (a limpé) face à la relance de BB', acts);
    };
    const acts = [{ k: 'x', l: 'Check', ch: show(inv, 4, 5, false, 1) }];
    if (isoAll || S <= cfg.openShoveMax) acts.push({ k: 'a', l: 'Tapis', ch: vsShove(put(inv, 5, S), 4, 5, 'lps:SB', 'SB (a limpé) face au tapis de BB', 1, () => fold(put(inv, 5, S), 5)) });
    else acts.push({ k: 'r', l: `Relancer ${String(iso).replace('.', ',')} bb`, ch: vsIso(put(inv, 5, iso)) });
    return act(5, 'lp:SB', 'BB face au limp de SB', acts);
  }
  function responders(o, q, inv, to) {
    if (q > 5) return fold(inv, o);
    const allin = to >= S, nxt = () => responders(o, q + 1, inv, to);
    if (allin) return vsShove(inv, q, o, `vsh:${POS[o]}:${POS[q]}`, `${POS[q]} face au tapis de ${POS[o]}`, 1, nxt);
    const blind = q >= 4, to3 = (blind ? cfg.threeOOP : cfg.threeIP) * to;
    const acts = [{ k: 'f', l: 'Se coucher', ch: nxt() }, { k: 'c', l: 'Payer', ch: afterCall(o, q, put(inv, q, to), to, q + 1) }];
    if (toAllin(to3) || S <= cfg.threeShoveMax) acts.push({ k: 'a', l: 'Tapis', ch: vsShove(put(inv, q, S), o, q, `v3a:${POS[o]}:${POS[q]}`, `${POS[o]} face au 3-bet tapis de ${POS[q]}`, 2, () => fold(put(inv, q, S), q)) });
    else acts.push({ k: 'r', l: `3-bet ${String(+to3.toFixed(1)).replace('.', ',')} bb`, ch: vs3(o, q, put(inv, q, to3), to3) });
    return act(q, `vo:${POS[o]}:${POS[q]}`, `${POS[q]} face à l'ouverture de ${POS[o]}`, acts);
  }
  // Après un call : les joueurs suivants peuvent squeezer (pas de call multiway, simplification).
  function afterCall(o, c, inv, to, q) {
    if (q > 5) return show(inv, o, c, false, 1);
    const sq = ((q >= 4 ? cfg.threeOOP : cfg.threeIP) + 1) * to, shove = toAllin(sq) || S <= cfg.threeShoveMax, sqTo = shove ? S : sq, inv2 = put(inv, q, sqTo);
    const lab = shove ? 'Tapis (squeeze)' : `Squeeze ${String(+sq.toFixed(1)).replace('.', ',')} bb`;
    // Réponse du joueur qui a payé, une fois l'ouvreur couché.
    const cResp = (inv3) => act(c, `sqc:${POS[o]}:${POS[c]}:${POS[q]}`, `${POS[c]} (a payé) face au squeeze de ${POS[q]}`, shove
      ? [{ k: 'f', l: 'Se coucher', ch: fold(inv3, q) }, { k: 'c', l: 'Payer', ch: show(put(inv3, c, S), c, q, true, 2) }]
      : [{ k: 'f', l: 'Se coucher', ch: fold(inv3, q) }, { k: 'c', l: 'Payer', ch: show(put(inv3, c, sqTo), c, q, false, 2) },
         { k: 'a', l: 'Tapis', ch: vsShove(put(inv3, c, S), q, c, `sqa:${POS[o]}:${POS[c]}:${POS[q]}`, `${POS[q]} face au tapis de ${POS[c]} après son squeeze`, 3, () => fold(put(inv3, c, S), c)) }]);
    const oActs = [{ k: 'f', l: 'Se coucher', ch: cResp(inv2) }];
    if (shove) oActs.push({ k: 'c', l: 'Payer', ch: show(put(inv2, o, S), o, q, true, 2) });
    else { const inv4 = put(inv2, o, S); oActs.push({ k: 'a', l: 'Tapis', ch: act(q, `sqo:${POS[o]}:${POS[c]}:${POS[q]}`, `${POS[q]} face au tapis de ${POS[o]} après son squeeze`, [{ k: 'f', l: 'Se coucher', ch: fold(inv4, o) }, { k: 'c', l: 'Payer', ch: show(put(inv4, q, S), o, q, true, 3) }]) }); }
    const oNode = act(o, `sqv:${POS[o]}:${POS[c]}:${POS[q]}`, `${POS[o]} face au squeeze de ${POS[q]} (après le call de ${POS[c]})`, oActs);
    const qActs = [{ k: 'f', l: 'Se coucher', ch: afterCall(o, c, inv, to, q + 1) }];
    // Grosse blinde : peut aussi payer et jouer à trois (elle ferme l'action).
    if (q === 5 && to < S && cfg.multiway !== false) qActs.push({ k: 'c', l: 'Payer (pot à trois)', ch: show3(put(inv, 5, to), o, c, 5) });
    qActs.push({ k: shove ? 'a' : 'r', l: lab, ch: oNode });
    return act(q, `sq:${POS[o]}:${POS[c]}:${POS[q]}`, `${POS[q]} face à l'ouverture de ${POS[o]} et au call de ${POS[c]}`, qActs);
  }
  function vs3(o, q, inv, to3) {
    const to4 = cfg.four * to3;
    const acts = [{ k: 'f', l: 'Se coucher', ch: fold(inv, q) }, { k: 'c', l: 'Payer', ch: show(put(inv, o, to3), o, q, false, 2) }];
    if (toAllin(to4)) acts.push({ k: 'a', l: 'Tapis', ch: vsShove(put(inv, o, S), q, o, `v4a:${POS[o]}:${POS[q]}`, `${POS[q]} face au 4-bet tapis de ${POS[o]}`, 3, () => fold(put(inv, o, S), o)) });
    else {
      const inv4 = put(inv, o, to4);
      acts.push({ k: 'r', l: `4-bet ${String(+to4.toFixed(1)).replace('.', ',')} bb`, ch: act(q, `v4:${POS[o]}:${POS[q]}`, `${POS[q]} face au 4-bet de ${POS[o]}`, [
        { k: 'f', l: 'Se coucher', ch: fold(inv4, o) }, { k: 'c', l: 'Payer', ch: show(put(inv4, q, to4), o, q, false, 3) },
        { k: 'a', l: 'Tapis', ch: vsShove(put(inv4, q, S), o, q, `v5:${POS[o]}:${POS[q]}`, `${POS[o]} face au 5-bet tapis de ${POS[q]}`, 3, () => fold(put(inv4, q, S), q)) }]) });
    }
    return act(o, `v3:${POS[o]}:${POS[q]}`, `${POS[o]} face au 3-bet de ${POS[q]}`, acts);
  }
  const inv0 = [0, 0, 0, 0, 0.5, 1];
  const root = rfi(0, inv0);
  for (const n of nodes) { n.reg = n.acts.map(() => new Float64Array(N)); n.sum = n.acts.map(() => new Float64Array(N)); }
  return { root, nodes, terms, ante, S };
}

function solve(cfg) {
  const T = buildTree(cfg), { ante } = T;
  const tmp = () => new Float64Array(N);
  const mass = (r) => { let s = 0; for (let i = 0; i < N; i++) s += r[i]; return s; };
  let evalMode = false;
  function strat(n, out) { // regret matching (CFR+ : regrets positifs) ; en évaluation : stratégie moyenne
    const A = n.acts.length;
    if (evalMode) { for (let i = 0; i < N; i++) { let s = 0; for (let a = 0; a < A; a++) s += n.sum[a][i]; for (let a = 0; a < A; a++) out[a][i] = s > 0 ? n.sum[a][i] / s : 1 / A; } return out; }
    for (let i = 0; i < N; i++) { let s = 0; for (let a = 0; a < A; a++) s += n.reg[a][i]; for (let a = 0; a < A; a++) out[a][i] = s > 0 ? n.reg[a][i] / s : 1 / A; }
    return out;
  }
  let t = 0;
  function cfv(n, u, R) {
    const v = tmp();
    if (n.t === 'fold') {
      let m = 1; for (let q = 0; q < 6; q++) if (q !== u) m *= mass(R[q]);
      const pay = (n.w === u ? n.inv.reduce((a, b) => a + b, 0) + ante.reduce((a, b) => a + b, 0) : 0) - n.inv[u] - ante[u];
      v.fill(pay * m); return v;
    }
    if (n.t === 'show') {
      let m = 1; for (let q = 0; q < 6; q++) if (q !== n.a && q !== n.b && q !== u) m *= mass(R[q]);
      if (u !== n.a && u !== n.b) { v.fill((-n.inv[u] - ante[u]) * m * mass(R[n.a]) * mass(R[n.b])); return v; }
      const o = u === n.a ? n.b : n.a, M = u === n.a ? n.A : n.B, ro = R[o], c = n.inv[u] + ante[u];
      for (let i = 0; i < N; i++) { let s = 0, w = 0; const b = i * N; for (let j = 0; j < N; j++) { const r = ro[j]; if (r) { s += M[b + j] * r; w += CW[b + j] * r; } } v[i] = (n.pot * s - c * w) * m; }
      return v;
    }
    if (n.t === 'show3') return show3Val(n, u, R);
    const A = n.acts.length, sg = strat(n, n.acts.map(() => tmp()));
    if (n.p === u) {
      const vals = n.acts.map((a) => cfv(a.ch, u, R));
      for (let i = 0; i < N; i++) { let s = 0; for (let a = 0; a < A; a++) s += sg[a][i] * vals[a][i]; v[i] = s; }
      if (evalMode) { // EV de chaque action en bb, conditionnée à l'arrivée au nœud (masse des ranges adverses, blocages compris dans les abattages)
        let Z = 1; for (let q = 0; q < 6; q++) if (q !== u) Z *= mass(R[q]);
        n.ev = vals.map((x) => Float64Array.from(x, (y) => (Z > 1e-12 ? y / Z : 0)));
        return v;
      }
      for (let a = 0; a < A; a++) for (let i = 0; i < N; i++) { const r = n.reg[a][i] + vals[a][i] - v[i]; n.reg[a][i] = r > 0 ? r : 0; n.sum[a][i] += t * R[u][i] * sg[a][i]; }
      return v;
    }
    for (let a = 0; a < A; a++) {
      const R2 = R.slice(), rp = tmp(); for (let i = 0; i < N; i++) rp[i] = R[n.p][i] * sg[a][i]; R2[n.p] = rp;
      const c = cfv(n.acts[a].ch, u, R2); for (let i = 0; i < N; i++) v[i] += c[i];
    }
    return v;
  }
  // Pot à trois (approximation à champ moyen) : part de i ∝ équité de i contre la range de q × équité contre la range de r ;
  // le facteur κ rend la somme des parts espérées égale à 1 (le pot est conservé en moyenne). Blocages : produit des compatibilités par paire.
  function show3Val(n, u, R) {
    const v = tmp(), pl = n.pl; let m = 1; for (let q = 0; q < 6; q++) if (!pl.includes(q) && q !== u) m *= mass(R[q]);
    if (!pl.includes(u)) { v.fill((-n.inv[u] - ante[u]) * m * mass(R[pl[0]]) * mass(R[pl[1]]) * mass(R[pl[2]])); return v; }
    const part = (p) => { // pour le joueur p : produit des équités et masse compatible, par classe
      const [q, r] = pl.filter((x) => x !== p), Aq = n.M[p + ':' + q], Ar = n.M[p + ':' + r], prod = tmp(), w = tmp();
      for (let i = 0; i < N; i++) { const b = i * N; let sq = 0, mq = 0, sr = 0, mr = 0; for (let j = 0; j < N; j++) { const x = R[q][j], y = R[r][j]; if (x) { sq += Aq[b + j] * x; mq += CW[b + j] * x; } if (y) { sr += Ar[b + j] * y; mr += CW[b + j] * y; } } w[i] = mq * mr; prod[i] = mq > 0 && mr > 0 ? (sq / mq) * (sr / mr) : 0; }
      return { prod, w };
    };
    const P = {}; let tot = 0; for (const p of pl) { P[p] = part(p); let s = 0, d = 0; for (let i = 0; i < N; i++) { s += R[p][i] * P[p].prod[i] * P[p].w[i]; d += R[p][i] * P[p].w[i]; } tot += d > 0 ? s / d : 1 / 3; }
    const k = tot > 0 ? 1 / tot : 1, c = n.inv[u] + ante[u], me = P[u];
    for (let i = 0; i < N; i++) v[i] = (n.pot * k * me.prod[i] - c) * me.w[i] * m;
    return v;
  }
  const R0 = Array.from({ length: 6 }, () => prior.slice());
  for (t = 1; t <= ITER; t++) for (let u = 0; u < 6; u++) cfv(T.root, u, R0);
  evalMode = true; for (let u = 0; u < 6; u++) cfv(T.root, u, R0); evalMode = false;
  return T;
}
// Fréquences moyennes d'un nœud (par classe) et part globale de chaque action (pondérée par la fréquence d'arrivée).
const avgOf = (n) => { const A = n.acts.length, out = n.acts.map(() => new Float64Array(N)); for (let i = 0; i < N; i++) { let s = 0; for (let a = 0; a < A; a++) s += n.sum[a][i]; for (let a = 0; a < A; a++) out[a][i] = s > 0 ? n.sum[a][i] / s : 1 / A; } return out; };
const ALPH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'; // 64 niveaux
const enc = (f) => Array.from(f, (x) => ALPH[Math.round(Math.max(0, Math.min(1, x)) * 63)]).join('');
// Perte d'EV (bb) de chaque action face à la meilleure, par classe : échelle racine carrée jusqu'à 10 bb (précision fine près de 0).
const LOSS_MAX = 10, encLoss = (l) => Array.from(l, (x) => ALPH[Math.round(Math.sqrt(Math.max(0, Math.min(LOSS_MAX, x)) / LOSS_MAX) * 63)]).join('');
function lossOf(n) { if (!n.ev) return null; const A = n.acts.length, out = n.acts.map(() => new Float64Array(N)); for (let i = 0; i < N; i++) { let b = -Infinity; for (let a = 0; a < A; a++) b = Math.max(b, n.ev[a][i]); for (let a = 0; a < A; a++) out[a][i] = b - n.ev[a][i]; } return out.map(encLoss); }

const CONFIGS = [
  { id: 'cash40', fmt: 'cash', label: 'Cash 40 bb', stack: 40, open: 2.5, openSB: 3, threeIP: 3, threeOOP: 4, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
  { id: 'cash60', fmt: 'cash', label: 'Cash 60 bb', stack: 60, open: 2.5, openSB: 3, threeIP: 3, threeOOP: 4, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
  { id: 'cash100', fmt: 'cash', label: 'Cash 100 bb', stack: 100, open: 2.5, openSB: 3, threeIP: 3, threeOOP: 4, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
  { id: 'cash150', fmt: 'cash', label: 'Cash 150 bb', stack: 150, open: 2.5, openSB: 3, threeIP: 3, threeOOP: 4, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
  { id: 'mtt10', fmt: 'mtt', label: 'Tournoi 10 bb', stack: 10, ante: 1, shoveOnly: true, open: 10, openSB: 10, threeIP: 3, threeOOP: 3, four: 2.2, shoveAt: 0, openShoveMax: 10, threeShoveMax: 10 },
  { id: 'mtt15', fmt: 'mtt', label: 'Tournoi 15 bb', stack: 15, ante: 1, open: 2, openSB: 2.5, threeIP: 3, threeOOP: 3.5, four: 2.2, shoveAt: 0.45, openShoveMax: 15, threeShoveMax: 15 },
  { id: 'mtt20', fmt: 'mtt', label: 'Tournoi 20 bb', stack: 20, ante: 1, open: 2.1, openSB: 2.5, threeIP: 3, threeOOP: 3.5, four: 2.2, shoveAt: 0.45, openShoveMax: 20, threeShoveMax: 20 },
  { id: 'mtt25', fmt: 'mtt', label: 'Tournoi 25 bb', stack: 25, ante: 1, open: 2.1, openSB: 2.5, threeIP: 3, threeOOP: 3.5, four: 2.2, shoveAt: 0.45, openShoveMax: 20, threeShoveMax: 25 },
  { id: 'mtt30', fmt: 'mtt', label: 'Tournoi 30 bb', stack: 30, ante: 1, open: 2.2, openSB: 2.5, threeIP: 3, threeOOP: 3.5, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 30 },
  { id: 'mtt40', fmt: 'mtt', label: 'Tournoi 40 bb', stack: 40, ante: 1, open: 2.2, openSB: 2.5, threeIP: 3, threeOOP: 3.5, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
  { id: 'mtt60', fmt: 'mtt', label: 'Tournoi 60 bb', stack: 60, ante: 1, open: 2.2, openSB: 2.5, threeIP: 3, threeOOP: 3.5, four: 2.2, shoveAt: 0.45, openShoveMax: 0, threeShoveMax: 0 },
];
module.exports = { buildTree, solve, avgOf, lossOf, CONFIGS, POS, useGame, enc, ALPH, LOSS_MAX, setIter: (n) => { ITER = n; } };
if (require.main === module) {
  const only = process.argv[3] ? process.argv[3].split(',') : null, out = [];
  const prev = fs.existsSync(path.join(__dirname, 'data/preflop.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'data/preflop.json'), 'utf8')) : [];
  for (const cfg of CONFIGS) {
    if (only && !only.includes(cfg.id)) { const p = prev.find((x) => x.id === cfg.id); if (p) out.push(p); continue; }
    const t0 = Date.now(), T = solve(cfg);
    const nodes = T.nodes.map((n) => { const av = avgOf(n), L = lossOf(n); return { key: n.key, label: n.label, p: POS[n.p], acts: n.acts.map((a) => ({ k: a.k, l: a.l })), f: av.map(enc), ...(L ? { l: L } : {}) }; });
    const rfi = nodes.filter((n) => n.key.startsWith('rfi:')).map((n) => { const f = n.f.map((s) => [...s].map((c) => ALPH.indexOf(c) / 63)); const open = f.slice(1).reduce((acc, arr) => acc + arr.reduce((s, x, i) => s + x * W[i], 0), 0) / 1326; return `${n.p} ${(open * 100).toFixed(1)} %`; });
    console.log(cfg.id, nodes.length, 'nœuds', T.terms.length, 'issues', Math.round((Date.now() - t0) / 1000) + ' s', 'ouvertures :', rfi.join(' · '));
    out.push({ id: cfg.id, fmt: cfg.fmt, label: cfg.label, stack: cfg.stack, ante: cfg.ante || 0, open: cfg.open, nodes });
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true }); fs.writeFileSync(path.join(__dirname, 'data/preflop.json'), JSON.stringify(out));
  }
  fs.writeFileSync(path.join(__dirname, '../src/preflop_data.js'), `// Généré par tools/build_preflop.js (${ITER} itérations CFR+ par configuration). Ne pas éditer à la main.\n(function (root) { const D = ${JSON.stringify({ alph: ALPH, lossMax: LOSS_MAX, configs: out })};\n  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.PreflopData = D; })(typeof window !== 'undefined' ? window : globalThis);\n`);
  console.log('src/preflop_data.js écrit');
}
