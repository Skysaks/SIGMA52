// Vague 4, apprentissage : plan du jour piloté par les faiblesses (entrelacé), version 5 minutes, contrôle de rétention,
// calibration de la confiance, Elo appris par catégorie d'exercice, carte des compétences, bilan hebdomadaire de qualité de décision,
// explication notée par Claude (fonction « sample » de la page publiée), quiz de mains et charts dans la révision espacée.
(function () {
  const X = window.__S52, E = window.Engine, S = window.Spots, PR = window.Pro;
  const { $, esc, fr, pct, today, state, Store, render, go, VIEWS, ACT } = X;
  const W = () => state.progress.w4 || (state.progress.w4 = {});
  const save = () => Store.save('progress');
  const SPOT = () => window.__S52_spot;
  const STREET = { 3: 'flop', 4: 'turn', 5: 'river' };
  const use = async (n) => { try { return window.claude?.use ? await window.claude.use(n) : null; } catch (e) { return null; } };

  // ---------------- Journal quotidien (bilan hebdomadaire) ----------------
  function day() { const w = W(), d = today(); w.days = w.days || {}; return w.days[d] || (w.days[d] = { sp: [0, 0], dec: [0, 0, 0], ev: [0, 0, 0], cal: [0, 0] }); }
  X.logDay = (kind, o = {}) => {
    const D = day();
    if (kind === 'spot') { D.sp[0]++; if (o.ok) D.sp[1]++; }
    if (kind === 'dec') { D.dec[0]++; if (o.ok) D.dec[1]++; if (o.sev === 'grave') D.dec[2]++; }
    if (kind === 'ev') { D.ev[0]++; D.ev[1] += o.lossPct || 0; if (o.g >= 3) D.ev[2]++; }
    const w = W(), keys = Object.keys(w.days).sort(); while (keys.length > 120) delete w.days[keys.shift()];
  };

  // ---------------- Elo appris par catégorie d'exercice ----------------
  const catOf = (spot) => spot.type + '|' + ((spot.title || '').split(' · ')[1] || '');
  const irt = () => { const w = W(); return w.irt || (w.irt = {}); };
  X.itemDiff = (spot) => { const c = irt()[catOf(spot)]; return c ? c.r : PR?.SPOT_D?.[spot.type] ?? 1200; };
  function irtUpdate(spot, ok) {
    const T = irt(), k = catOf(spot), c = T[k] || (T[k] = { r: PR?.SPOT_D?.[spot.type] ?? 1200, n: 0 });
    const u = state.progress.elo?.r ?? 1000, exp = 1 / (1 + Math.pow(10, (c.r - u) / 400)), K = Math.max(8, 40 / Math.sqrt(1 + c.n));
    c.r += K * (exp - (ok ? 1 : 0)); c.n++;
  }

  // ---------------- Après chaque réponse (Spots, plan, révisions, contrôle) ----------------
  X.onAnswer = (spot, ok, m) => {
    const w = W();
    X.logDay('spot', { ok });
    irtUpdate(spot, ok);
    if (m.conf) { w.calib = w.calib || {}; const c = w.calib[m.conf] || (w.calib[m.conf] = [0, 0]); c[0]++; if (ok) c[1]++; day().cal[0]++; if (ok) day().cal[1]++; }
    // Réponses justes gardées pour le contrôle de rétention (hors révisions, hors contrôle).
    if (ok && !m.review && !plan?.ret && spot.type !== 'situations') { w.recall = (w.recall || []).filter((r) => r.k !== spot.sid + spot.prompt); w.recall.push({ k: spot.sid + spot.prompt, spot: JSON.parse(JSON.stringify(spot)), d: today() }); if (w.recall.length > 300) w.recall.shift(); }
    if (plan && plan.cur) { plan.done++; if (ok) plan.ok++; if (plan.ret) { w.ret = w.ret || []; w.ret.push({ d: today(), age: plan.cur.age, ok: ok ? 1 : 0 }); if (w.ret.length > 600) w.ret.shift(); } }
    if (m.expl && m.choice >= 0) gradeExpl(spot, m.choice, m.expl);
    save();
  };
  X.onQuiz = (mod, qi, ok) => { X.logDay('spot', { ok }); };

  // ---------------- Convertisseurs vers le format « spot » (lecteur commun) ----------------
  const bestOf = (q) => q.e.reduce((b, x, i) => (x > q.e[b] + 1e-9 || (Math.abs(x - q.e[b]) <= 1e-9 && q.f[i] > q.f[b]) ? i : b), 0);
  function hqSpot(i) {
    const B = window.HandQuiz || [], q = B[i]; if (!q) return null;
    const board = E.parseCards(q.b), best = bestOf(q);
    return { type: 'handquiz', sid: 'hq' + i, title: 'Quiz de main · ' + STREET[board.length], prompt: `${esc(q.s)}. Tu es <strong>${esc(q.n[q.p])}</strong>, pot ${fr(q.pot, 1)} bb, tapis ${fr(q.st, 1)} bb. ${q.l ? esc(q.l) + '.' : 'Premier à parler au flop.'} Que joues-tu ?`,
      cards: E.parseCards(q.h), board, opts: q.o.slice(), ok: best,
      why: `Solveur avec ta main exacte : ${q.o.map((o, k) => `${o} ${Math.round(q.f[k] * 100)} % (EV ${fr(q.e[k], 2)} bb)`).join(' · ')}. Une action jouée au moins 25 % du temps reste correcte (stratégie mixte).` };
  }
  X.hqSpot = hqSpot;
  // Erreurs des quiz de mains et des charts : elles entrent dans la révision espacée.
  X.reviewMiss = (spot) => { if (spot && SPOT()) { SPOT().reviewGrade('x:' + spot.sid + ':' + spot.prompt, spot, 1); save(); } };

  // ---------------- Échelle d'erreur commune : Parfait / Correct / Erreur / Gaffe ----------------
  // En % du pot perdu (seuils des mains notées) ; préflop en bb ; décision sans EV : juste = Correct, petite erreur = Erreur, grave = Gaffe.
  const SC = { L: ['Parfait', 'Correct', 'Erreur', 'Gaffe'], C: ['good', 'acc', 'warn', 'bad'] };
  SC.pct = (lossPct, freq = 0) => (lossPct < 0.005 || freq >= 0.25 ? 0 : lossPct < 0.02 ? 1 : lossPct < 0.06 ? 2 : 3);
  SC.bb = (lossBB) => (lossBB <= 0.05 ? 0 : lossBB <= 0.3 ? 1 : lossBB <= 1 ? 2 : 3);
  SC.sev = (ok, sev) => (ok ? 1 : sev === 'grave' ? 3 : 2);
  SC.badge = (g, extra = '') => `<span class="pill ${SC.C[g]}">${SC.L[g]}${extra ? ' · ' + extra : ''}</span>`;
  SC.legend = '<p class="note">Échelle commune : <strong>Parfait</strong> (meilleure action ou perte sous 0,5 % du pot), <strong>Correct</strong> (sous 2 %), <strong>Erreur</strong> (2 à 6 %), <strong>Gaffe</strong> (plus de 6 % du pot ; préflop : plus de 1 bb).</p>';
  X.SCALE = SC;
  // Journal des erreurs coûteuses (toutes sources) : les plus chères de la semaine reviennent dans le bilan et le plan du jour.
  X.logMistake = (m) => {
    if (!m || !(m.lossBB > 0)) return;
    const w = W(); w.mist = w.mist || [];
    w.mist.push({ d: today(), src: m.src, label: String(m.label || '').slice(0, 140), lossBB: Math.round(m.lossBB * 100) / 100, lossPct: m.lossPct ?? null, g: m.g ?? null, go: m.go || null, spot: m.spot || null });
    if (w.mist.length > 300) w.mist.splice(0, w.mist.length - 300);
    if (m.spot) X.reviewMiss(m.spot);
    save();
  };
  const topMist = (days = 7, n = 3) => (W().mist || []).filter((x) => ageDays(x.d) < days).sort((a, b) => b.lossBB - a.lossBB).slice(0, n);
  X.topMist = topMist;
  ACT.mistgo = (t) => {
    const m = topMist(7, 3)[+t.dataset.i]; if (!m) return;
    if (m.spot && SPOT()) { plan = { queue: [{ spot: m.spot, src: 'Erreur chère de la semaine' }], done: 0, ok: 0, n: 1, cur: null, ret: false, label: 'Erreur de la semaine' }; SPOT().start('plan'); return go('spots'); }
    go(m.go || 'sim');
  };

  // ---------------- Faiblesses et plan du jour ----------------
  const COACH2TYPE = { rfi: 'rfi', iso: 'rfi', pfdef: 'vsopen', odds: 'odds', value: 'handquiz', nobluff: 'handquiz', bluff: 'handquiz', pushfold: 'pushfold' };
  function leaks() {
    const a = X.getAnRes?.(), w = W();
    if (a && a.hands && a.me) {
      const me = a.me, r = (x, n) => (n >= 8 ? x / n : null);
      w.lastLeaks = { hands: a.hands, date: today(), loose: a.leaks?.tooLoose?.length || 0, tight: a.leaks?.tooTight?.length || 0, limps: a.leaks?.limps?.length || 0, three: r(me.three, me.threeOpp), ftc: r(me.ftc, me.ftcOpp), wtsd: r(me.sd, me.sawFlop), cbet: r(me.cbet, me.cbetOpp) };
    }
    return w.lastLeaks || null;
  }
  function weaknesses() {
    const out = [], p = state.progress, add = (type, why, wt) => out.push({ type, why, wt });
    for (const t of Object.keys(S.TYPES)) { const h = p.hist?.[t] || []; if (h.length >= 5) { const m = h.reduce((a, b) => a + b, 0) / h.length; if (m < 0.8) add(t, `${S.TYPES[t]} : ${Math.round(m * 100)} % de réussite récente`, 1.2 * (1 - m) + 0.1); } }
    for (const [c, x] of Object.entries(p.coach || {})) if (x.n >= 5 && x.ok / x.n < 0.75 && COACH2TYPE[c]) add(COACH2TYPE[c], `Simulateur : ${Math.round((x.ok / x.n) * 100)} % de décisions justes (${c})`, 1 - x.ok / x.n);
    const L = leaks();
    if (L) {
      if (L.loose + L.tight + L.limps >= 3) add('rfi', `Tes mains importées : ${L.loose} ouvertures hors range, ${L.tight} oublis, ${L.limps} limps`, 0.6);
      if (L.three !== null && L.three < 0.05) add('vsopen', `Tu 3-bettes ${Math.round(L.three * 100)} % (repère 6 à 10 %)`, 0.5);
      if (L.ftc !== null && L.ftc > 0.55) add('mdf', `Tu te couches ${Math.round(L.ftc * 100)} % face aux c-bets (repère 35 à 48 %)`, 0.55);
      if (L.wtsd !== null && L.wtsd > 0.34) add('odds', `Tu vas à l'abattage ${Math.round(L.wtsd * 100)} % (repère 26 à 33 %)`, 0.4);
    }
    const P = p.practice; if (P && P.n >= 10 && P.loss / P.n > 0.04) add('handquiz', `Mains notées : ${fr((P.loss / P.n) * 100, 1)} % du pot perdus par décision`, 0.6);
    if (!out.length) ['rfi', 'odds', 'vsopen', 'handquiz'].forEach((t, i) => add(t, 'Pas encore assez de données : on consolide la base (ouvertures, cotes, défense, mains)', 0.3 - i * 0.02));
    return out.sort((a, b) => b.wt - a.wt);
  }
  let plan = null; // { queue, done, ok, n, cur, ret, label }
  function makeItem(type, why) {
    if (type === 'handquiz') { const B = window.HandQuiz || []; if (!B.length) return null; const s = hqSpot(Math.floor(Math.random() * B.length)); return s ? { spot: s, src: why } : null; }
    if (type === 'chart') { const s = X.chartSpot?.(); return s ? { spot: s, src: why } : null; }
    if (!S.GEN[type]) return null;
    return { spot: S.GEN[type](Math.random), src: why };
  }
  function buildPlan(n) {
    const items = [], p = state.progress;
    const isReal = (r) => String(r.spot?.sid || '').startsWith('real:');
    const due = p.review.filter((r) => r.due <= today()).sort((a, b) => isReal(b) - isReal(a)).slice(0, n >= 10 ? 4 : 2);
    for (const r of due) items.push({ spot: r.spot, review: r, src: isReal(r) ? 'Ta vraie main : erreur à rejouer' : 'Révision due (mémoire FSRS)' });
    for (const m of topMist(7, n >= 10 ? 2 : 1)) if (m.spot && !items.some((x) => x.spot?.prompt === m.spot.prompt)) items.push({ spot: m.spot, src: `Erreur chère de la semaine (−${fr(m.lossBB, 2)} bb)` });
    const weak = weaknesses(), slots = n - items.length - (n >= 10 ? 3 : 1);
    for (let k = 0; k < slots; k++) { const w = weak[k % Math.min(weak.length, 3)]; const it = makeItem(w.type, w.why); if (it) items.push(it); }
    if (n >= 10) { items.push(makeItem('handquiz', 'Quiz de main : postflop contre le solveur')); items.push(makeItem('handquiz', 'Quiz de main : postflop contre le solveur')); }
    const ch = makeItem('chart', 'Chart en cours de déblocage'); items.push(ch || makeItem('rfi', 'Ouvertures'));
    // Entrelacement : jamais deux exercices du même type à la suite quand c'est évitable.
    const pool = items.filter(Boolean), out = [];
    while (pool.length) { const last = out[out.length - 1]?.spot.type; let i = pool.findIndex((x) => x.spot.type !== last); if (i < 0) i = 0; out.push(pool.splice(i, 1)[0]); }
    return out.slice(0, n);
  }
  // Séance « mes vraies erreurs » : les décisions de tes mains réelles en révision, les plus urgentes d'abord.
  X.startRealPlan = () => {
    const L = (X.realDue?.() || []).slice(0, 10); if (!L.length) return;
    plan = { queue: L.map((r) => ({ spot: r.spot, review: r, src: 'Ta vraie main' })), done: 0, ok: 0, n: L.length, cur: null, ret: false, label: 'Mes vraies erreurs' };
    SPOT().start('plan'); go('spots');
  };
  ACT.realdrill = () => X.startRealPlan();
  function startPlan(n, label) { plan = { queue: buildPlan(n), done: 0, ok: 0, n: 0, cur: null, ret: false, label }; plan.n = plan.queue.length; SPOT().start('plan'); go('spots'); }
  X.planNext = () => { if (!plan) return null; plan.cur = plan.queue.shift() || null; if (!plan.cur) { finishPlan(); return null; } return plan.cur; };
  function finishPlan() { const w = W(); if (plan) { if (plan.warm) { w.warm = { d: today(), ok: plan.ok, n: plan.done, green: plan.done >= 5 && plan.ok >= 4 }; } if (plan.ret) w.retLast = today(); else if (!plan.warm) { w.plans = w.plans || []; w.plans.push({ d: today(), n: plan.done, ok: plan.ok }); if (w.plans.length > 60) w.plans.shift(); } w.lastPlanRes = { label: plan.label, n: plan.done, ok: plan.ok, d: today(), show: true }; plan = null; save(); } }
  X.planBanner = (mode) => {
    if (mode !== 'plan' || !plan) { const r = W().lastPlanRes; return r && r.d === today() && r.show ? (r.show = false, `<p class="pill good">${esc(r.label)} terminé : ${r.ok}/${r.n}</p>`) : ''; }
    const c = plan.cur;
    return `<div class="row" style="justify-content:space-between"><span class="pill acc">${esc(plan.label)} · ${Math.min(plan.done + 1, plan.n)}/${plan.n}</span><span class="note">${c ? esc(c.src || '') : ''}</span><button class="btn small" data-act="planstop">Arrêter</button></div>`;
  };
  // Échauffement de 2 minutes avant une session : 5 spots tirés de tes fuites ; feu vert à 4/5.
  function startWarm() { plan = { queue: buildPlan(5).slice(0, 5), done: 0, ok: 0, n: 0, cur: null, ret: false, warm: true, label: 'Échauffement avant session' }; plan.n = plan.queue.length; const tr = state.settings.train || (state.settings.train = { conf: false, timer: 0, explain: false }); plan.prevTimer = tr.timer; SPOT().start('plan'); go('spots'); }
  ACT.warmstart = () => startWarm();
  X.warmHTML = () => {
    const w = W().warm, todayW = w && w.d === today();
    return `<section class="panel"><span class="eyebrow">Échauffement avant session · 2 minutes</span><p>Cinq spots tirés de tes fuites actuelles. <strong>Feu vert à 4/5</strong> ; en dessous, la session commence par 10 minutes de révision, ou n'a pas lieu.</p>
      ${todayW ? `<div class="advice"><div class="${w.green ? 'good' : 'bad'}">${w.green ? `Feu vert : ${w.ok}/${w.n}.` : `Pas de feu vert : ${w.ok}/${w.n}. Révise les spots ratés avant de jouer, ou reporte la session.`}</div></div>` : ''}
      <div class="row"><button class="btn ${todayW ? '' : 'primary'}" data-act="warmstart">${todayW ? 'Refaire l\'échauffement' : 'Lancer l\'échauffement'}</button></div></section>`;
  };
  ACT.planstart = (t) => startPlan(+t.dataset.n || 10, +t.dataset.n === 5 ? 'Version 5 minutes' : 'Plan du jour');
  ACT.planstop = () => { finishPlan(); SPOT().start('mix'); render(); };

  // ---------------- Contrôle de rétention mensuel ----------------
  const ageDays = (d) => Math.round((Date.parse(today()) - Date.parse(d)) / 864e5);
  function retEligible() { return (W().recall || []).filter((r) => ageDays(r.d) >= 21); }
  function retDue() { const w = W(); return retEligible().length >= 8 && (!w.retLast || ageDays(w.retLast) >= 30); }
  ACT.retstart = () => {
    const el = retEligible().sort(() => Math.random() - 0.5).slice(0, 10);
    plan = { queue: el.map((r) => ({ spot: r.spot, src: `Contrôle de rétention : réussi il y a ${ageDays(r.d)} jours`, age: ageDays(r.d) })), done: 0, ok: 0, n: el.length, cur: null, ret: true, label: 'Contrôle de rétention' };
    SPOT().start('plan'); go('spots');
  };
  function retHTML() {
    const R = W().ret || []; if (!R.length) return '';
    const B = [[21, 45, '21 à 45 jours'], [45, 90, '45 à 90 jours'], [90, 9999, 'plus de 90 jours']].map(([a, b, l]) => { const x = R.filter((r) => r.age >= a && r.age < b); return [l, x.length, x.length ? x.reduce((s, r) => s + r.ok, 0) / x.length : null]; });
    return `<div class="tw"><table class="t"><thead><tr><th>Réussi il y a</th><th class="n">Contrôles</th><th class="n">Encore juste</th></tr></thead><tbody>${B.map(([l, n, v]) => `<tr><td>${l}</td><td class="n">${n}</td><td class="n mono">${v === null ? '–' : pct(v, 0)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  // ---------------- Calibration et compétences ----------------
  function calibHTML() {
    const C = W().calib || {}; const rows = [50, 70, 90].filter((v) => C[v]?.[0]);
    if (!rows.length) return '<p class="note">Active « Confiance avant de répondre » dans Spots : la calibration apparaît après quelques réponses.</p>';
    const over = C[90] && C[90][0] >= 10 && C[90][1] / C[90][0] < 0.78;
    return `<div class="tw"><table class="t"><thead><tr><th>Confiance annoncée</th><th class="n">Réponses</th><th class="n">Justes en vrai</th><th>Lecture</th></tr></thead><tbody>${rows.map((v) => { const [n, ok] = C[v], r = ok / n, d = r - v / 100; return `<tr><td>${v} %</td><td class="n">${n}</td><td class="n mono">${pct(r, 0)}</td><td class="note">${n < 10 ? 'trop peu de réponses' : Math.abs(d) <= 0.08 ? 'bien calibré' : d < 0 ? 'excès de confiance' : 'tu sous-estimes ton niveau'}</td></tr>`; }).join('')}</tbody></table></div>${over ? '<p class="pill bad" style="white-space:normal">Excès de confiance : quand tu es « sûr à 90 % », tu as raison moins de 78 % du temps. Ralentis sur ces spots-là et vérifie le chiffre qui décide.</p>' : ''}`;
  }
  const CONCEPTS = [
    ['Préflop', [['Ouvertures', 'rfi'], ['Face à une ouverture', 'vsopen'], ['Tapis ou couché', 'pushfold'], ['Charts débloquées', 'charts']]],
    ['Maths', [['Cotes du pot', 'odds'], ['Outs', 'outs'], ['Tirages', 'tirage'], ['MDF et ratios', 'mdf'], ['Combos et bloqueurs', 'combos'], ['Primes PKO', 'bounty']]],
    ['Après le flop', [['Quiz de mains (solveur)', 'handquiz'], ['Mains notées (EV)', 'practice'], ['Valeur contre les fish', 'c:value'], ['Bluff au bon moment', 'c:bluff'], ['Meilleure main', 'meilleure']]],
    ['Jugement', [['Situations', 'situations'], ['Défense préflop au simulateur', 'c:pfdef'], ['Isolation', 'c:iso']]],
  ];
  function conceptVal(k) {
    const p = state.progress;
    if (k === 'charts') { const C = state.progress.w3?.charts; if (!C) return null; return { v: Math.min(1, C.lvl / 12), n: Object.values(C.hist || {}).reduce((a, h) => a + h.length, 0), txt: `${C.lvl} charts maîtrisées` }; }
    if (k === 'practice') { const P = p.practice; if (!P || !P.n) return null; const l = P.loss / P.n; return { v: Math.max(0, 1 - l / 0.08), n: P.n, txt: `${fr(l * 100, 1)} % du pot perdus` }; }
    if (k.startsWith('c:')) { const x = p.coach?.[k.slice(2)]; if (!x || !x.n) return null; return { v: x.ok / x.n, n: x.n }; }
    const h = p.hist?.[k] || []; if (!h.length) return null; return { v: h.reduce((a, b) => a + b, 0) / h.length, n: (p.stats?.[k]?.n) || h.length };
  }
  function mapHTML() {
    return `<section class="panel"><span class="eyebrow">Carte des compétences</span><h2>Où tu en es, concept par concept</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px">${CONCEPTS.map(([g, L]) => `<div><h3 style="margin:0 0 6px">${g}</h3>${L.map(([l, k]) => { const c = conceptVal(k); const v = c ? c.v : 0; return `<div class="typerow"><span>${l}</span><div class="meter"><i style="width:${Math.round(v * 100)}%;background:var(${!c ? '--line' : v >= 0.8 ? '--good' : v >= 0.6 ? '--warn' : '--bad'})"></i></div><span class="note mono" style="min-width:64px;text-align:right">${c ? (c.txt || pct(v, 0)) + ` · ${c.n}` : '—'}</span></div>`; }).join('')}</div>`).join('')}</div>
      <p class="note">Barre = réussite récente (30 dernières réponses par type) ou, pour les mains notées, EV perdue ramenée sur 8 % du pot. Le nombre = réponses prises en compte : sous 20, la mesure est fragile.</p>
      <h3>Révision espacée (FSRS)</h3><div class="row"><span class="note">Rétention cible :</span>${[0.85, 0.9, 0.95].map((v) => `<button class="chip" aria-pressed="${(+state.settings.retention || 0.9) === v}" data-act="retset" data-v="${v}">${Math.round(v * 100)} %</button>`).join('')}<span class="note">${state.progress.review.length} éléments suivis. Plus haut = moins d'oublis, plus de révisions par jour.</span></div>
      <h3>Difficulté réelle des exercices (Elo appris)</h3>${irtHTML()}
      <h3>Calibration de ta confiance</h3>${calibHTML()}
      <h3>Contrôle de rétention</h3>${retHTML() || '<p class="note">Un contrôle surprise est proposé tous les 30 jours sur des exercices réussis il y a au moins 21 jours.</p>'}${retDue() ? '<div class="row"><button class="btn primary" data-act="retstart">Faire le contrôle de rétention (10 exercices)</button></div>' : ''}</section>`;
  }
  function irtHTML() {
    const T = Object.entries(irt()).filter(([, c]) => c.n >= 5).sort((a, b) => b[1].r - a[1].r);
    if (!T.length) return '<p class="note">Les difficultés s\'apprennent au fil de tes réponses (5 réponses minimum par catégorie).</p>';
    const show = [...T.slice(0, 5), ...(T.length > 8 ? T.slice(-3) : [])];
    return `<div class="tw"><table class="t"><thead><tr><th>Catégorie</th><th class="n">Difficulté</th><th class="n">Réponses</th></tr></thead><tbody>${show.map(([k, c]) => { const [t, sub] = k.split('|'); return `<tr><td>${esc(S.TYPES[t] || (t === 'handquiz' ? 'Quiz de main' : t === 'chart' ? 'Charts' : t))}${sub ? ' · ' + esc(sub) : ''}</td><td class="n mono">${Math.round(c.r)}</td><td class="n">${c.n}</td></tr>`; }).join('')}</tbody></table></div><p class="note">Ton Elo progresse davantage quand tu réussis une catégorie difficile ; la difficulté de chaque catégorie se corrige à chaque réponse.</p>`;
  }

  // ---------------- Bilan hebdomadaire de qualité de décision ----------------
  function weekAgg(from, to) {
    const D = W().days || {}, a = { sp: [0, 0], dec: [0, 0, 0], ev: [0, 0, 0], cal: [0, 0] };
    for (const [d, x] of Object.entries(D)) { const age = ageDays(d); if (age < from || age >= to) continue; for (const k of Object.keys(a)) x[k].forEach((v, i) => (a[k][i] += v)); }
    return a;
  }
  function bilanHTML() {
    const A = weekAgg(0, 7), B = weekAgg(7, 14);
    if (!A.sp[0] && !A.dec[0] && !A.ev[0]) return '';
    const cell = (lab, cur, prev, f, better) => `<div class="stat"><span>${lab}</span><b>${cur === null ? '—' : f(cur)}</b><span>${prev === null || cur === null ? 'semaine précédente : —' : `${(better ? cur >= prev : cur <= prev) ? 'mieux' : 'moins bien'} que la semaine d'avant (${f(prev)})`}</span></div>`;
    const r = (x, n) => (n ? x / n : null);
    return `<section class="panel"><span class="eyebrow">Ta semaine · qualité de décision</span><h2>On juge les décisions, pas les résultats</h2><div class="stats">
      ${cell('EV perdue par décision', r(A.ev[1], A.ev[0]), r(B.ev[1], B.ev[0]), (v) => fr(v * 100, 2) + ' % du pot', false)}
      ${cell('Erreurs graves', r(A.dec[2] + A.ev[2], A.dec[0] + A.ev[0]), r(B.dec[2] + B.ev[2], B.dec[0] + B.ev[0]), (v) => pct(v, 0), false)}
      ${cell('Spots justes', r(A.sp[1], A.sp[0]), r(B.sp[1], B.sp[0]), (v) => pct(v, 0), true)}
      ${cell('Décisions justes au simulateur', r(A.dec[1], A.dec[0]), r(B.dec[1], B.dec[0]), (v) => pct(v, 0), true)}</div>
      <p class="note">${A.sp[0] + A.dec[0] + A.ev[0]} décisions cette semaine. Le résultat en jetons ou en euros n'apparaît pas ici exprès : sur une semaine, c'est surtout de la variance.</p>
      ${(() => { const T = topMist(7, 3); return T.length ? `<h3>Tes 3 erreurs les plus chères de la semaine</h3><div class="tw"><table class="t"><tbody>${T.map((m, i) => `<tr><td>${m.g !== null && m.g !== undefined ? SC.badge(m.g) : ''}</td><td>${esc(m.src)} · ${esc(m.label)}</td><td class="n mono">−${fr(m.lossBB, 2)} bb</td><td><button class="btn small" data-act="mistgo" data-i="${i}">${m.spot ? 'Rejouer' : 'Y retourner'}</button></td></tr>`).join('')}</tbody></table></div><p class="note">Celles qui ont un exercice associé passent aussi en révision FSRS et dans le plan du jour.</p>` : ''; })()}</section>`;
  }

  // ---------------- Explication notée par Claude ----------------
  const expl = new Map(); // clé du spot -> { st: 'wait'|'done'|'self', note, txt }
  const keyOf = (spot) => spot.sid + '|' + spot.prompt;
  async function gradeExpl(spot, choice, text) {
    const k = keyOf(spot);
    // Relecture par Claude seulement si tu l'as activée : chaque appel consomme un message de ton quota.
    if (!state.settings.train?.claude) { expl.set(k, { st: 'self', text }); render(); return; }
    expl.set(k, { st: 'wait', text }); render();
    const sample = await use('sample');
    if (!sample) { expl.set(k, { st: 'self', text }); render(); return; }
    const plain = (h) => String(h).replace(/<[^>]+>/g, '');
    const prompt = `Tu corriges l'exercice de poker d'un élève francophone. Exercice : ${plain(spot.prompt)}${spot.cards ? ' Main : ' + spot.cards.map(E.cardStr).join(' ') + '.' : ''}${spot.board ? ' Board : ' + spot.board.map(E.cardStr).join(' ') + '.' : ''} Options : ${spot.opts.map((o, i) => `${i + 1}) ${o}`).join(' ; ')}. Bonne réponse (moteur) : ${spot.opts[spot.ok]}. Explication du moteur : ${plain(spot.why)}\nRéponse de l'élève : ${spot.opts[choice]}. Son explication : « ${text.slice(0, 400)} »\nNote son raisonnement de 0 à 3 (3 = bonne raison et chiffre juste ; 2 = bonne raison, chiffre absent ou approximatif ; 1 = raison partielle ou confuse ; 0 = raison fausse), indépendamment de la réponse choisie. Réponds uniquement en JSON : {"note": entier, "commentaire": "deux phrases maximum, en français, concrètes, sans flatterie"}.`;
    try {
      const r = await sample.json(prompt, { modelTier: 'quick' });
      const note = Math.max(0, Math.min(3, Math.round(+r.note || 0)));
      expl.set(k, { st: 'done', note, txt: String(r.commentaire || '').slice(0, 400), text });
      const w = W(); w.expl = w.expl || [0, 0]; w.expl[0]++; w.expl[1] += note; save();
    } catch (e) { expl.set(k, { st: e && e.code === 'not_granted' ? 'self' : 'err', text }); }
    render();
  }
  X.explHTML = (spot) => {
    const x = expl.get(keyOf(spot)); if (!x) return '';
    if (x.st === 'wait') return '<p class="note">Claude relit ton explication…</p>';
    if (x.st === 'done') return `<div class="advice"><div class="${x.note >= 2 ? 'good' : x.note === 1 ? 'warn' : 'bad'}"><strong>Ton raisonnement : ${x.note}/3.</strong> ${esc(x.txt)}</div></div>`;
    const sr = x.self;
    return `<div class="advice"><div><strong>Compare ton explication à celle du moteur.</strong> « ${esc(x.text)} »</div>${sr === undefined ? `<div class="row"><span class="note">Ton raisonnement était :</span>${['faux', 'partiel', 'juste mais sans chiffre', 'juste et chiffré'].map((l, i) => `<button class="chip" data-act="explself" data-v="${i}">${l}</button>`).join('')}</div>` : `<div class="note">Auto-évaluation : ${sr}/3.</div>`}${x.st === 'err' ? '<div class="note">Correction automatique indisponible pour le moment.</div>' : ''}</div>`;
  };
  ACT.retset = (t) => { state.settings.retention = +t.dataset.v; Store.save('settings'); render(); };
  ACT.explself = (t) => { const s = SPOT()?.spot; if (!s) return; const x = expl.get(keyOf(s)); if (x) { x.self = +t.dataset.v; const w = W(); w.expl = w.expl || [0, 0]; w.expl[0]++; w.expl[1] += x.self; save(); } render(); };

  // ---------------- Aujourd'hui et Profil ----------------
  function planCard() {
    const weak = weaknesses().slice(0, 3), due = state.progress.review.filter((r) => r.due <= today()).length, P = W().plans || [], last = P[P.length - 1];
    const mobile = typeof innerWidth !== 'undefined' && innerWidth < 700;
    return `<section class="panel" style="border-color:var(--accent)"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Plan du jour</span><h2>${mobile ? '5 minutes, une décision à la fois' : '10 exercices choisis pour toi, mélangés'}</h2></div><span class="row">${mobile ? '<button class="btn primary" data-act="planstart" data-n="5">5 minutes</button><button class="btn" data-act="planstart" data-n="10">Plan complet</button>' : '<button class="btn primary" data-act="planstart" data-n="10">Lancer le plan</button><button class="btn" data-act="planstart" data-n="5">Version 5 minutes</button>'}</span></div>
      <ul class="note" style="margin:0;padding-left:1.2em">${due ? `<li>${due} révision${due > 1 ? 's' : ''} due${due > 1 ? 's' : ''} (FSRS)</li>` : ''}${[...new Set(weak.map((w) => w.why))].map((why) => `<li>${esc(why)}</li>`).join('')}</ul>
      ${last && last.d === today() ? `<p class="pill good">Fait aujourd'hui : ${last.ok}/${last.n}</p>` : ''}<div class="row"><button class="btn small" data-act="warmstart">Échauffement avant session (2 min)</button>${W().warm?.d === today() ? `<span class="pill ${W().warm.green ? 'good' : 'bad'}">${W().warm.green ? 'feu vert' : 'pas de feu vert'} ${W().warm.ok}/${W().warm.n}</span>` : ''}</div>${retDue() ? '<div class="row"><button class="btn small" data-act="retstart">Contrôle de rétention du mois (10 exercices)</button></div>' : ''}</section>`;
  }
  const baseJour = VIEWS.jour;
  VIEWS.jour = () => {
    const html = baseJour(), card = planCard() + bilanHTML();
    const mobile = typeof innerWidth !== 'undefined' && innerWidth < 700;
    if (mobile) { const i = html.indexOf('</section>'); if (i >= 0) return html.slice(0, i + 10) + card + html.slice(i + 10); }
    return html.includes('<div class="warnbox"><strong>Fair-play.</strong>') ? html.replace('<div class="warnbox"><strong>Fair-play.</strong>', card + '<div class="warnbox"><strong>Fair-play.</strong>') : card + html;
  };
  const baseMental = VIEWS.mental;
  if (baseMental) VIEWS.mental = () => { const h = baseMental(), i = h.indexOf('<section'); return i >= 0 ? h.slice(0, i) + X.warmHTML() + h.slice(i) : h + X.warmHTML(); };
  const baseProfil = VIEWS.profil;
  VIEWS.profil = () => baseProfil() + mapHTML();
})();
