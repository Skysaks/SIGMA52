// Vague 3 : Défis (charts à débloquer, défi du jour commun, spot de la semaine), Analyse › Population et fuites,
// Mental (check-in après session relié aux résultats, routine de session guidée), Carrière (staking, festival), Journal (session live).
(function () {
  const X = window.__S52, E = window.Engine, S = window.Spots, C = window.Charts, PR = window.Pro;
  const { $, esc, fr, eur, sgn, pct, today, state, Store, render, head, cardHTML, VIEWS, ACT, ONCHANGE, TABS, GROUPS } = X;
  const W = () => state.progress.w3 || (state.progress.w3 = {});
  const save = () => Store.save('progress');
  const num = (v) => +String(v ?? '').replace(/\s/g, '').replace(',', '.').replace('−', '-') || 0;
  TABS.push(['defis', 'Défis'], ['amis', 'Entre amis']);
  GROUPS.find((g) => g[0] === 'apprendre')[2].push('defis');
  GROUPS.find((g) => g[0] === 'jouer')[2].push('amis');
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // =================== Défis ===================
  // ---- #9 Charts à débloquer : chaque range maîtrisée (23 justes sur les 25 dernières) ouvre la suivante ----
  const LEVELS = [...C.POS.map((p) => ({ id: 'rfi:' + p, kind: 'rfi', pos: p, label: `Ouverture ${p}` })),
    ...Object.entries(C.FACING).flatMap(([o, by]) => Object.keys(by).map((h) => ({ id: `vo:${o}:${h}`, kind: 'vo', o, h, label: `${h} face à l'ouverture ${o}` })))];
  const NEED = 25, OKN = 23;
  const cg = () => { const w = W(); return w.charts || (w.charts = { lvl: 0, hist: {} }); };
  let chq = null; // question en cours { L, cards, h, ok (index), opts, a }
  function chartSet(L) {
    if (L.kind === 'rfi') { const set = E.parseRange(C.RFI[L.pos].range); return { opts: ['Ouvrir', 'Se coucher'], ans: (h) => (set.has(h) ? 0 : 1), size: E.rangePct(set) }; }
    const f = C.FACING[L.o][L.h], t3 = E.parseRange(f.threebet), ca = f.call ? E.parseRange(f.call) : new Set();
    return { opts: ['Sur-relancer (3-bet)', 'Payer', 'Se coucher'], ans: (h) => (t3.has(h) ? 0 : ca.has(h) ? 1 : 2), size: E.rangePct(new Set([...t3, ...ca])) };
  }
  function newChartQ(i) {
    const L = LEVELS[i], cs = chartSet(L), r = Math.random;
    // Moitié des mains près de la frontière de la range, moitié au hasard.
    let cards, h;
    for (let k = 0; k < 40; k++) {
      const d = [...Array(52).keys()]; const a = d.splice(Math.floor(r() * 52), 1)[0], b = d[Math.floor(r() * 51)]; cards = [a, b]; h = E.abstractOf(a, b);
      if (r() < 0.5) break;
      const ri = E.RANKS.indexOf(h[0]), rj = E.RANKS.indexOf(h[1]);
      const nb = [[ri, rj - 1], [ri, rj + 1], [ri - 1, rj]].filter(([x, y]) => x >= 0 && y >= 0 && x <= 12 && y <= 12 && x !== y).map(([x, y]) => E.RANKS[Math.max(x, y)] + E.RANKS[Math.min(x, y)] + (h[2] || ''));
      if (nb.some((x) => cs.ans(x) !== cs.ans(h))) break;
    }
    chq = { i, L, cs, cards, h, a: null };
  }
  function chartsHTML() {
    const P = cg(), unlocked = Math.min(P.lvl, LEVELS.length - 1);
    if (!chq || chq.i > unlocked) newChartQ(unlocked);
    const q = chq, hist = P.hist[q.L.id] || [], last = hist.slice(-NEED), okN = last.filter(Boolean).length;
    const list = LEVELS.map((L, i) => { const hh = (P.hist[L.id] || []).slice(-NEED), done = i < P.lvl || (hh.length >= NEED && hh.filter(Boolean).length >= OKN); return `<button class="chip" ${i > unlocked ? 'disabled' : ''} aria-pressed="${i === q.i}" data-act="chlev" data-i="${i}">${done ? '✓ ' : i > unlocked ? '🔒 ' : ''}${esc(L.label)}</button>`; }).join('');
    const ok = q.a !== null && q.a === q.cs.ans(q.h);
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Charts à débloquer · ${P.lvl}/${LEVELS.length} maîtrisées</span><h2>${esc(q.L.label)}</h2></div><span class="note mono">${okN}/${last.length} justes sur les ${NEED} dernières · il en faut ${OKN}/${NEED}</span></div>
      <div class="pbar" aria-hidden="true"><i style="width:${Math.round(Math.min(1, last.length / NEED) * (okN / Math.max(1, last.length)) * 100)}%"></i></div>
      <p style="font-size:17px">${q.L.kind === 'rfi' ? `Tout le monde a passé jusqu'à toi. Tu es <strong>${q.L.pos}</strong>.` : `<strong>${q.L.o}</strong> ouvre, tu es <strong>${q.L.h}</strong>.`} Ta main :</p>
      <div class="felt" style="display:flex;justify-content:center;padding:12px;border-radius:12px"><div class="cards">${q.cards.map((c) => cardHTML(c)).join('')}</div></div>
      <div class="opts">${q.cs.opts.map((o, i) => `<button class="opt${q.a !== null && i === q.cs.ans(q.h) ? ' ok' : ''}${q.a === i && !ok ? ' ko' : ''}" data-act="chans" data-i="${i}" ${q.a !== null ? 'disabled' : ''}><span class="mono note">${i + 1}</span> ${o}</button>`).join('')}</div>
      ${q.a !== null ? `<div class="verdict ${ok ? 'good' : 'bad'}"><b>${ok ? 'Juste.' : 'Non : ' + q.cs.opts[q.cs.ans(q.h)] + '.'}</b><span>${q.h} ${q.cs.ans(q.h) === q.cs.opts.length - 1 ? 'est hors de' : 'fait partie de'} la range « ${esc(q.L.label)} » (${fr(q.cs.size, 0)} % des mains jouées).</span></div><div class="row"><button class="btn primary" data-act="chnext">Main suivante <span class="note">Entrée</span></button></div>` : ''}
      ${P.justUnlocked ? `<p class="pill good">Débloqué : ${esc(LEVELS[P.lvl]?.label || 'toutes les charts sont maîtrisées')}</p>` : ''}
      <div class="row" style="margin-top:8px">${list}</div>
      <p class="note">Une chart est maîtrisée avec ${OKN} bonnes réponses sur les ${NEED} dernières ; la suivante s'ouvre alors. Les mains proches de la frontière de la range reviennent plus souvent : ce sont celles qu'on rate.</p></section>`;
  }
  ACT.chans = (t) => {
    const q = chq; if (!q || q.a !== null) return; q.a = +t.dataset.i;
    const P = cg(), ok = q.a === q.cs.ans(q.h), h = P.hist[q.L.id] || (P.hist[q.L.id] = []); h.push(ok ? 1 : 0); if (h.length > 60) h.shift();
    P.justUnlocked = false;
    const last = h.slice(-NEED); if (q.i === P.lvl && last.length >= NEED && last.filter(Boolean).length >= OKN && P.lvl < LEVELS.length) { P.lvl++; P.justUnlocked = true; X.award?.('spot', { type: 'rfi', ok: true }, true); }
    X.award?.('spot', { type: q.L.kind === 'rfi' ? 'rfi' : 'vsopen', ok }, true); save(); render();
  };
  ACT.chnext = () => { const P = cg(); newChartQ(Math.min(P.justUnlocked ? P.lvl : chq.i, LEVELS.length - 1)); P.justUnlocked = false; render(); };
  ACT.chlev = (t) => { newChartQ(+t.dataset.i); render(); };

  // ---- #11 Défi du jour commun (mêmes spots pour tout le monde, tirés de la date) et spot de la semaine ----
  const DAILY_TYPES = ['rfi', 'vsopen', 'odds', 'pushfold', 'mdf'];
  const dailySpots = (d) => { const R = E.rng(hashStr('sigma52-' + d)); return DAILY_TYPES.map((t) => S.GEN[t](R)); };
  let dcache = null;
  const dget = () => { const d = today(); if (!dcache || dcache.d !== d) dcache = { d, spots: dailySpots(d) }; return dcache; };
  const dprog = () => { const w = W(), d = today(); if (!w.daily || w.daily.d !== d) w.daily = { d, a: [] }; return w.daily; };
  function weekSpot() {
    const B = window.HandQuiz || []; if (!B.length) return null;
    const wk = PR.weekKey(new Date()), cand = B.map((q, i) => [q, i]).filter(([q]) => Math.max(...q.f) < 0.85 && q.o.length >= 2);
    const pool = cand.length ? cand : B.map((q, i) => [q, i]), [q, i] = pool[hashStr(wk) % pool.length];
    return { q, i, wk };
  }
  async function pushShared(patch) { const SH = X.shared; if (!SH?.db || !SH.uid) return; try { const { id, ...mine } = SH.weekly.find((r) => r.id === SH.uid) || {}; void id; await SH.db.doc('weekly/' + SH.uid).set({ ...mine, ...patch }); } catch (e) { /* hors ligne */ } }
  function dailyHTML() {
    const D = dget(), P = dprog(), i = P.a.length, SH = X.shared, done = i >= D.spots.length;
    let body;
    if (!done) {
      const s = D.spots[i];
      body = `<p class="note">Spot ${i + 1}/${D.spots.length} · ${esc(s.title)}</p><p style="font-size:17px">${s.prompt}</p>${s.cards ? `<div class="cards">${s.cards.map((c) => cardHTML(c, true)).join('')}</div>` : ''}${s.board ? `<div class="cards">${s.board.map((c) => cardHTML(c, true)).join('')}</div>` : ''}
        <div class="opts">${s.opts.map((o, k) => `<button class="opt" data-act="dyans" data-i="${k}"><span class="mono note">${k + 1}</span> ${esc(o)}</button>`).join('')}</div>`;
    } else {
      const ok = P.a.filter((x, k) => x === D.spots[k].ok).length;
      body = `<h3>${ok}/${D.spots.length} aujourd'hui</h3><div class="tw"><table class="t"><tbody>${D.spots.map((s, k) => `<tr><td>${esc(s.title)}</td><td>${P.a[k] === s.ok ? '✓' : '✗ ' + esc(s.opts[s.ok])}</td><td class="note">${esc(s.why).slice(0, 160)}${s.why.length > 160 ? '…' : ''}</td></tr>`).join('')}</tbody></table></div>`;
    }
    const friends = SH?.weekly?.filter((r) => r.day === D.d && r.dok !== undefined).sort((a, b) => b.dok - a.dok) || [];
    return `<section class="panel"><span class="eyebrow">Défi du jour commun · ${D.d.split('-').reverse().join('/')}</span><h2>Les mêmes 5 spots pour tout le monde aujourd'hui</h2>${body}
      ${friends.length ? `<p class="note">Entre amis aujourd'hui : ${friends.map((r) => `${esc(X.sharedName(r.id))} ${r.dok}/5`).join(' · ')}</p>` : '<p class="note">Les spots sont tirés de la date : tes amis ont les mêmes. Avec la page publiée, les scores du jour s\'affichent ici.</p>'}</section>`;
  }
  ACT.dyans = (t) => {
    const D = dget(), P = dprog(); if (P.a.length >= D.spots.length) return;
    const k = +t.dataset.i, s = D.spots[P.a.length]; P.a.push(k); X.award?.('spot', { type: s.type, ok: k === s.ok }, true); save();
    if (P.a.length === D.spots.length) pushShared({ day: D.d, dok: P.a.filter((x, j) => x === D.spots[j].ok).length });
    render();
  };
  function weekHTML() {
    const W0 = weekSpot(); if (!W0) return '';
    const { q, wk } = W0, P = W(), mine = P.week && P.week.wk === wk ? P.week.a : null, cards = E.parseCards(q.b), SH = X.shared;
    const votes = SH?.weekly?.filter((r) => r.wk === wk && r.wa !== undefined) || [], cnt = q.o.map((_, i) => votes.filter((r) => r.wa === i).length);
    const best = q.e.reduce((b, x, i) => (x > q.e[b] ? i : b), 0);
    return `<section class="panel"><span class="eyebrow">Spot de la semaine · ${esc(wk)}</span><h2>${esc(q.s)} · tu es ${esc(q.n[q.p])}</h2>
      <div class="row" style="gap:16px;align-items:center"><span class="cards">${E.parseCards(q.h).map((c) => cardHTML(c)).join('')}</span><span class="cards">${cards.map((c) => cardHTML(c, true)).join('')}</span><span class="mono note">pot ${fr(q.pot, 1)} bb · tapis ${fr(q.st, 1)} bb</span></div>
      <p>${q.l ? esc(q.l) : 'Premier à parler au flop.'}</p>
      <div class="opts">${q.o.map((o, i) => `<button class="opt${mine === i ? ' ok' : ''}" data-act="wkans" data-i="${i}" ${mine !== null ? 'disabled' : ''}>${esc(o)}${mine !== null ? ` · solveur ${pct(q.f[i], 0)} · EV ${fr(q.e[i], 2)} bb${votes.length ? ` · ${cnt[i]} vote${cnt[i] > 1 ? 's' : ''}` : ''}` : ''}</button>`).join('')}</div>
      ${mine !== null ? `<p class="note">Meilleure EV : ${esc(q.o[best])}. Un spot choisi pour sa stratégie mixte : aucune action n'est jouée plus de 85 % du temps, l'écart d'EV entre les options est souvent petit. À discuter avec ton groupe d'étude.</p>` : '<p class="note">Même spot pour tout le monde cette semaine. Réponds, puis compare au solveur et aux votes de tes amis.</p>'}</section>`;
  }
  ACT.wkans = (t) => { const W0 = weekSpot(), i = +t.dataset.i; W().week = { wk: W0.wk, a: i }; save(); pushShared({ wk: W0.wk, wa: i }); render(); };
  X.onWeekly = () => {};
  VIEWS.defis = () => { X.initShared?.(); return head('Défis', 'Des formats courts pour revenir chaque jour : débloquer les charts une à une, le défi du jour (le même pour tous) et le spot de la semaine.') + chartsHTML() + dailyHTML() + weekHTML(); };
  X.ONKEY.push((e, tab) => {
    if (tab !== 'defis' || !chq) return;
    if (chq.a === null && /^[1-3]$/.test(e.key) && +e.key <= chq.cs.opts.length) { ACT.chans({ dataset: { i: +e.key - 1 } }); return true; }
    if (chq.a !== null && e.key === 'Enter') { ACT.chnext(); return true; }
  });

  // =================== Analyse › Population et fuites (#19, #21) ===================
  const POS_ORDER = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const STR = [['pre', 'Préflop'], ['flop', 'Flop'], ['turn', 'Turn'], ['river', 'River'], ['sd', 'Abattage']];
  // Repères d'équilibre approximatifs (6 joueurs, 100 bb, joueurs solides) : fourchettes, pas des valeurs exactes.
  const REF = [
    ['VPIP', (p) => [p.vpip, p.hands], [0.22, 0.28], 'Joue trop de mains : isole-le plus large et paie moins ses relances préflop, il les fait avec des mains faibles.', 'Joue serré : vole ses blindes, respecte ses relances.'],
    ['PFR', (p) => [p.pfr, p.hands], [0.17, 0.23], 'Relance beaucoup : 3-bette-le plus large pour la valeur, paie moins ses 3-bets légers en position.', 'Relance peu : ses relances sont fortes ; ses limps et calls cachent des mains moyennes.'],
    ['3-bet', (p) => [p.three, p.threeOpp], [0.06, 0.1], 'Sur-relance beaucoup : 4-bet pour la valeur plus large, ouvre moins de mains faibles devant lui.', 'Sur-relance peu : ouvre plus large, couche les mains moyennes face à ses 3-bets.'],
    ['Fold face au 3-bet', (p) => [p.f3, p.f3Opp], [0.42, 0.55], 'Abandonne trop souvent après avoir ouvert : 3-bette en bluff (A5s, K9s, mains assorties).', 'Paie trop les 3-bets : 3-bette plus pour la valeur, moins en bluff.'],
    ['C-bet flop', (p) => [p.cbet, p.cbetOpp], [0.45, 0.6], 'Mise trop souvent le flop : défends plus large et check-relance plus (bluffs avec tirages).', 'Mise trop peu : ses c-bets sont forts, couche les mains marginales ; mise toi-même quand il checke.'],
    ['Fold face au c-bet', (p) => [p.ftc, p.ftcOpp], [0.35, 0.48], 'Se couche trop face aux c-bets : mise souvent et petit le flop, même sans main.', 'Paie trop : mise pour la valeur, réduis les bluffs flop.'],
    ['Va à l\'abattage', (p) => [p.sd, p.sawFlop], [0.26, 0.33], 'Va trop souvent à l\'abattage : bluffe moins, mise plus gros pour la valeur.', 'Abandonne avant l\'abattage : bluffe plus au turn et à la river.'],
    ['Relance river face à une mise', (p) => [p.rvRaise, p.rvFace], [0.06, 0.12], 'Relance souvent la river : vérifie si ce sont des bluffs ; en général, ce n\'en est pas assez.', 'Relance très peu la river : une relance river de ce joueur = presque toujours le haut de sa range. Couche les bluff-catchers.'],
    ['Fold river face à une mise', (p) => [p.rvFold, p.rvFace], [0.35, 0.5], 'Se couche trop à la river : bluffe plus la river, surtout en grosse taille.', 'Paie trop à la river : ne bluffe plus la river, mise fin pour la valeur.'],
  ];
  function leaksHTML() {
    const a = X.getAnRes?.();
    if (!a || !a.hands) return '<section class="panel"><p>Importe d\'abord des historiques (onglet « Import et statistiques ») : la population et la carte des fuites se calculent dessus.</p></section>';
    const H = a.heat || {}, me = a.me, pos = Object.keys(H).sort((x, y) => (POS_ORDER.indexOf(x) + 99 * (POS_ORDER.indexOf(x) < 0)) - (POS_ORDER.indexOf(y) + 99 * (POS_ORDER.indexOf(y) < 0)));
    const val = (c) => (c ? (c.bb / me.hands) * 100 : 0), mx = Math.max(1e-9, ...pos.flatMap((p) => STR.map(([k]) => Math.abs(val(H[p][k])))));
    let worst = null; for (const p of pos) for (const [k, l] of STR) { const c = H[p][k]; if (c && c.n >= 5 && (!worst || val(c) < worst.v)) worst = { p, l, v: val(c), n: c.n }; }
    const cell = (c) => { if (!c) return '<td class="n note">–</td>'; const v = val(c), f = Math.abs(v) / mx; return `<td class="n mono" style="background:color-mix(in srgb, var(${v >= 0 ? '--good' : '--bad'}) ${Math.round(8 + 60 * f)}%, transparent)" title="${c.n} mains, ${fr(c.bb, 1)} bb">${sgn(v, 1)}<br><span class="note">${c.n}</span></td>`; };
    const heat = `<section class="panel"><span class="eyebrow">Carte de chaleur des fuites</span><h2>Où tu gagnes et où tu perds : position × rue où la main se termine pour toi</h2>
      <div class="tw"><table class="t"><thead><tr><th>Position</th>${STR.map(([, l]) => `<th class="n">${l}</th>`).join('')}<th class="n">Total</th></tr></thead><tbody>${pos.map((p) => { const tot = STR.reduce((s, [k]) => s + (H[p][k]?.bb || 0), 0); return `<tr><td><strong>${esc(p)}</strong></td>${STR.map(([k]) => cell(H[p][k])).join('')}<td class="n mono">${sgn((tot / me.hands) * 100, 1)}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="note">Chaque case : bb/100 mains qu'elle apporte à ton résultat total (sous le chiffre : nombre de mains). Lecture : « Préflop » = les mains que tu abandonnes avant le flop (les blindes y perdent forcément) ; « River » = celles que tu abandonnes à la river ; « Abattage » = celles qui y vont.${worst ? ` <strong>Plus grosse fuite visible : ${esc(worst.p)}, ${worst.l.toLowerCase()} (${sgn(worst.v, 1)} bb/100 sur ${worst.n} mains).</strong>` : ''} Sous 5 000 mains, la variance domine : regarde les tendances, pas une case isolée.</p></section>`;
    const P = a.pool || {}, rows = REF.map(([lab, get, [lo, hi], hiTxt, loTxt]) => {
      const [x, n] = get(P), v = n ? x / n : null, k = v === null ? null : v > hi ? 'hi' : v < lo ? 'lo' : 'ok', small = n < 50;
      const ex = k === 'hi' ? hiTxt : k === 'lo' ? loTxt : '';
      return `<tr><td><strong>${lab}</strong></td><td class="n mono">${v === null ? '–' : pct(v, 0)}<br><span class="note">${n} occ.</span></td><td class="n mono">${pct(lo, 0)} à ${pct(hi, 0)}</td><td>${k === null ? '' : k === 'ok' ? '<span class="pill">dans la norme</span>' : `<span class="pill ${small ? '' : 'bad'}">${k === 'hi' ? 'au-dessus' : 'en dessous'}</span>`}</td></tr>${ex ? `<tr><td colspan="4" class="note" style="border-top:0;padding-top:0">→ ${esc(ex)}${small ? ' (échantillon faible : à confirmer)' : ''}</td></tr>` : ''}`;
    }).join('');
    const pop = `<section class="panel"><span class="eyebrow">Analyse de population</span><h2>Tes adversaires, tous ensemble, comparés à un jeu équilibré</h2>
      <p class="note">${(P.hands || 0).toLocaleString('fr-FR')} mains-joueurs adverses (${a.opponents.length} adversaires). Les exploits de population sont ceux qui rapportent contre tout le monde à ta limite, même contre un inconnu.</p>
      <div class="tw"><table class="t"><thead><tr><th>Statistique</th><th class="n">Population</th><th class="n">Repère</th><th>Écart et exploit</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">Repères : fourchettes approximatives d'un jeu solide à 6 joueurs et 100 bb (solveurs et bases de mains publiques), pas des valeurs exactes. Tes historiques de la table d'entraînement mesurent les bots, pas une vraie population.</p></section>`;
    return heat + pop;
  }
  X.leaksHTML = leaksHTML;

  // =================== Mental : check-in après session (#25) et routine guidée (#26) ===================
  const mental = () => { const m = state.mental; m.post = m.post || []; m.checkins = m.checkins || []; return m; };
  const post = { focus: 0, tilt: -1, fatigue: 0, stop: null, result: '' };
  const lvl = (x) => (x <= 2 ? 'bas (1-2)' : x === 3 ? 'moyen (3)' : 'haut (4-5)');
  function linkHTML() {
    const m = mental(), ss = state.journal.sessions;
    const byDate = {}; ss.forEach((s) => { (byDate[s.date] = byDate[s.date] || []).push(s); });
    const rows = [];
    for (const [k, l] of [['sleep', 'Sommeil'], ['energy', 'Énergie'], ['calm', 'Calme'], ['focus', 'Concentration']]) {
      const g = {}; for (const c of m.checkins) { const list = byDate[c.date]; if (!list || !c[k]) continue; const key = lvl(c[k]); const x = g[key] || (g[key] = { n: 0, r: 0 }); for (const s of list) { x.n++; x.r += s.result; } }
      for (const key of ['bas (1-2)', 'moyen (3)', 'haut (4-5)']) if (g[key]) rows.push([l + ' avant', key, g[key]]);
    }
    const gt = {}; for (const p of m.post) { const key = ['aucun', 'léger', 'moyen', 'fort'][p.tilt] || '?'; const x = gt['Tilt ressenti ' + key] || (gt['Tilt ressenti ' + key] = { n: 0, r: 0 }); x.n++; x.r += +p.result || 0; }
    const gs = {}; for (const p of m.post) { if (p.stop === null) continue; const key = p.stop ? 'Stop-loss respecté' : 'Stop-loss dépassé'; const x = gs[key] || (gs[key] = { n: 0, r: 0 }); x.n++; x.r += +p.result || 0; }
    for (const [k, x] of [...Object.entries(gt), ...Object.entries(gs)]) rows.push([k, '', x]);
    if (!rows.length) return '<p class="note">Les liens apparaissent dès que des check-ins (avant ou après) tombent les jours où une session est notée au Journal.</p>';
    return `<div class="tw"><table class="t"><thead><tr><th>Facteur</th><th>Niveau</th><th class="n">Sessions</th><th class="n">Résultat moyen</th></tr></thead><tbody>${rows.map(([f, l, x]) => `<tr><td>${esc(f)}</td><td>${esc(l)}</td><td class="n">${x.n}</td><td class="n mono" style="color:var(${x.r >= 0 ? '--good' : '--bad'})">${eur(x.r / x.n)}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Une moyenne sur moins de 10 sessions est surtout de la variance. Le signal fiable : un écart qui se maintient quand les sessions s'accumulent (par exemple, résultats nettement plus bas les jours de sommeil bas).</p>`;
  }
  function postHTML() {
    const m = mental(), done = post.focus > 0 && post.tilt >= 0 && post.fatigue > 0 && post.stop !== null;
    const lastS = state.journal.sessions.filter((s) => s.date === today()).pop();
    const scale = (k, labels) => `<div class="row">${labels.map((l, i) => `<button class="chip" aria-pressed="${post[k] === (k === 'tilt' ? i : i + 1)}" data-act="postset" data-k="${k}" data-v="${k === 'tilt' ? i : i + 1}">${l}</button>`).join('')}</div>`;
    return `<section class="panel"><span class="eyebrow">Check-in après session</span><h2>Deux minutes, juste après avoir quitté la table</h2>
      <p class="note">Concentration pendant la session</p>${scale('focus', ['1 dispersé', '2', '3', '4', '5 totale'])}
      <p class="note">Tilt ressenti</p>${scale('tilt', ['Aucun', 'Léger', 'Moyen', 'Fort'])}
      <p class="note">Fatigue en fin de session</p>${scale('fatigue', ['1 frais', '2', '3', '4', '5 épuisé'])}
      <p class="note">Stop-loss et durée prévue respectés ?</p><div class="row"><button class="chip" aria-pressed="${post.stop === true}" data-act="poststop" data-v="1">Oui</button><button class="chip" aria-pressed="${post.stop === false}" data-act="poststop" data-v="0">Non</button></div>
      <label class="f" style="max-width:260px">Résultat de la session (€)<input data-postf="result" inputmode="decimal" value="${esc(post.result || (lastS ? String(lastS.result) : ''))}"></label>
      <div class="row"><button class="btn primary" data-act="postsave" ${done ? '' : 'disabled'}>Enregistrer</button>${m.post.length ? `<span class="note">${m.post.length} check-in${m.post.length > 1 ? 's' : ''} après session enregistrés.</span>` : ''}</div>
      <h3>Ce qui est relié à tes résultats</h3>${linkHTML()}</section>`;
  }
  ACT.postset = (t) => { post[t.dataset.k] = +t.dataset.v; render(); };
  ACT.poststop = (t) => { post.stop = t.dataset.v === '1'; render(); };
  ACT.postsave = () => {
    const m = mental(), lastS = state.journal.sessions.filter((s) => s.date === today()).pop();
    m.post.push({ date: today(), focus: post.focus, tilt: post.tilt, fatigue: post.fatigue, stop: post.stop, result: post.result !== '' ? num(post.result) : lastS ? lastS.result : 0 });
    if (m.post.length > 400) m.post.shift();
    Object.assign(post, { focus: 0, tilt: -1, fatigue: 0, stop: null, result: '' }); Store.save('mental'); render();
  };
  ONCHANGE.push((t) => { if (t.dataset.postf) { post[t.dataset.postf] = t.value; return true; } });

  // Routine de session : chrono, pauses toutes les 50 minutes, rappel de stop-loss, respiration guidée.
  const rt = { on: false, t0: 0, pauses: 0, every: 50, stop: '', cur: '', breath: 0, timer: null, paused: false };
  const mm = (ms) => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h ? h + ' h ' : ''}${String(m).padStart(2, '0')} min ${String(s % 60).padStart(2, '0')} s`; };
  function tick() {
    if (!rt.on) return;
    const el = $('#rtclock'), now = Date.now(), dur = now - rt.t0, next = rt.t0 + (rt.pauses + 1) * rt.every * 60000;
    if (el) el.textContent = mm(dur);
    const np = $('#rtnext'); if (np) np.textContent = next > now ? mm(next - now) : 'maintenant';
    if (next <= now && !rt.paused) { rt.paused = true; render(); }
    if (rt.breath) { const left = rt.breath - now, b = $('#rtbreath'); if (left <= 0) { rt.breath = 0; render(); } else if (b) { const ph = Math.floor((120000 - left) / 5000) % 2; b.textContent = ph ? 'Expire… (5 s)' : 'Inspire… (5 s)'; b.parentElement.style.transform = `scale(${ph ? 0.75 : 1.15})`; } }
  }
  function routineHTML() {
    const stop = num(rt.stop), cur = num(rt.cur), hit = rt.stop !== '' && rt.cur !== '' && cur <= -Math.abs(stop);
    if (!rt.on) return `<section class="panel"><span class="eyebrow">Routine de session guidée</span><h2>Lance-la au début de la session, elle tient la discipline à ta place</h2>
      <p>Chrono, pause de 10 minutes toutes les ${rt.every} minutes, rappel de ton stop-loss, et une respiration guidée de 2 minutes avant de commencer ou après un gros pot perdu.</p>
      <div class="form"><label class="f">Pause toutes les … minutes<input data-rtf="every" inputmode="numeric" value="${rt.every}"></label><label class="f">Stop-loss de la session (€)<input data-rtf="stop" inputmode="decimal" value="${esc(rt.stop)}" placeholder="ex. 60"></label></div>
      <div class="row"><button class="btn primary" data-act="rtstart">Commencer la session</button><button class="btn" data-act="rtbreath">Respiration 2 min</button></div>${rt.breath ? breathHTML() : ''}</section>`;
    return `<section class="panel" style="border-color:var(--accent)"><span class="eyebrow">Session en cours</span><h2 id="rtclock" class="mono">${mm(Date.now() - rt.t0)}</h2>
      <p class="note">Prochaine pause dans <span id="rtnext" class="mono">…</span> · ${rt.pauses} pause${rt.pauses > 1 ? 's' : ''} faite${rt.pauses > 1 ? 's' : ''}</p>
      ${rt.paused ? `<div class="warnbox"><strong>Pause de 10 minutes.</strong> Lève-toi, bois de l'eau, regarde loin, ne regarde pas tes résultats. Avant de revenir : es-tu toujours calme et concentré ? Sinon, la session s'arrête ici.<div class="row"><button class="btn primary" data-act="rtpause">Pause faite, je reprends</button><button class="btn" data-act="rtend">J'arrête</button></div></div>` : ''}
      <div class="form"><label class="f">Résultat actuel (€, négatif si tu perds)<input data-rtf="cur" inputmode="decimal" value="${esc(rt.cur)}"></label><label class="f">Stop-loss (€)<input data-rtf="stop" inputmode="decimal" value="${esc(rt.stop)}"></label></div>
      ${hit ? '<div class="warnbox" style="border-color:var(--bad)"><strong>Stop-loss atteint.</strong> Fin de la session, maintenant. Aucune « dernière main ». Note la session au Journal, puis fais le check-in après session.</div>' : rt.stop !== '' && rt.cur !== '' && cur <= -Math.abs(stop) * 0.7 ? '<p class="pill bad">Tu approches du stop-loss : décide maintenant de ce que tu feras s\'il tombe.</p>' : ''}
      <div class="row"><button class="btn" data-act="rtbreath">Respiration 2 min</button><button class="btn" data-act="rtend">Terminer la session</button></div>${rt.breath ? breathHTML() : ''}</section>`;
  }
  const breathHTML = () => `<div style="display:grid;justify-items:center;gap:10px;padding:16px"><div style="width:140px;height:140px;border-radius:50%;background:color-mix(in srgb, var(--accent) 35%, var(--sunk));display:grid;place-items:center;transition:transform 5s ease-in-out"><span id="rtbreath" style="font:600 15px var(--f-display)">Inspire… (5 s)</span></div><p class="note">Cohérence cardiaque : 6 respirations par minute, pendant 2 minutes. Ventre qui se gonfle à l'inspiration.</p><button class="btn small" data-act="rtbreathstop">Arrêter</button></div>`;
  function ensureTimer() { if (!rt.timer) rt.timer = setInterval(tick, 1000); }
  ACT.rtstart = () => { Object.assign(rt, { on: true, t0: Date.now(), pauses: 0, paused: false, cur: '' }); ensureTimer(); render(); };
  ACT.rtpause = () => { rt.pauses++; rt.paused = false; render(); };
  ACT.rtend = () => { const mins = Math.round((Date.now() - rt.t0) / 60000); rt.on = false; rt.paused = false; if (rt.cur !== '') post.result = rt.cur; W().lastRoutine = { date: today(), mins }; save(); render(); setTimeout(() => $('[data-act=postsave]')?.scrollIntoView({ block: 'center' }), 50); };
  ACT.rtbreath = () => { rt.breath = Date.now() + 120000; ensureTimer(); render(); };
  ACT.rtbreathstop = () => { rt.breath = 0; render(); };
  ONCHANGE.push((t) => { if (t.dataset.rtf) { const k = t.dataset.rtf; rt[k] = k === 'every' ? Math.max(15, Math.min(120, num(t.value) || 50)) : t.value; render(); return true; } });
  const baseMental = VIEWS.mental;
  VIEWS.mental = () => baseMental() + routineHTML() + postHTML();

  // =================== Carrière : staking (#29) et festival (#31) ===================
  const sk = { bi: '1000', markup: '1.2', sold: '50', roi: '15', split: '50', makeup: '0', result: '' };
  const contracts = () => { const w = W(); return w.stakes || (w.stakes = []); };
  function stakingHTML() {
    const bi = num(sk.bi), mk = num(sk.markup) || 1, sold = Math.min(100, Math.max(0, num(sk.sold))) / 100, roi = num(sk.roi) / 100, split = Math.min(100, Math.max(0, num(sk.split))) / 100;
    const price1 = (bi / 100) * mk, raised = bi * sold * mk, own = bi * (1 - sold), evBacker = sold * bi * (1 + roi) - raised, evPlayer = (1 - sold) * bi * (1 + roi) - own + (raised - sold * bi);
    const fair = 1 + roi;
    const C0 = contracts();
    const list = C0.map((c, i) => `<tr><td>${esc(c.name)}</td><td class="n mono">${fr(c.split * 100, 0)} %</td><td class="n mono" style="color:var(${c.makeup < 0 ? '--bad' : '--good'})">${eur(c.makeup)}</td><td class="n mono">${eur(c.paidPlayer)}</td><td class="n mono">${eur(c.paidBacker)}</td><td><input data-skr="${i}" inputmode="decimal" placeholder="résultat" style="width:7em" aria-label="Résultat de session pour ${esc(c.name)}"> <button class="btn small" data-act="skadd" data-i="${i}">Ajouter</button> <button class="btn small" data-act="skdel" data-i="${i}">Supprimer</button></td></tr>`).join('');
    return `<section class="panel"><span class="eyebrow">Staking : calculateur et suivi</span><h2>Vendre des parts ou jouer sous contrat de makeup</h2>
      <h3>Vente de parts (tournoi)</h3>
      <div class="form"><label class="f">Buy-in (€)<input data-skf="bi" inputmode="decimal" value="${esc(sk.bi)}"></label><label class="f">Markup (ex. 1,2)<input data-skf="markup" inputmode="decimal" value="${esc(sk.markup)}"></label><label class="f">Part vendue (%)<input data-skf="sold" inputmode="decimal" value="${esc(sk.sold)}"></label><label class="f">ROI estimé (%)<input data-skf="roi" inputmode="decimal" value="${esc(sk.roi)}"></label></div>
      <div class="stats"><div class="stat"><span>Prix de 1 %</span><b>${eur(price1)}</b><span>buy-in ÷ 100 × markup</span></div><div class="stat"><span>Tu lèves</span><b>${eur(raised)}</b><span>tu paies toi-même ${eur(own)}</span></div><div class="stat"><span>EV des backers</span><b style="color:var(${evBacker >= 0 ? '--good' : '--bad'})">${eur(evBacker)}</b><span>avec ton ROI estimé</span></div><div class="stat hero"><span>Ton EV</span><b>${eur(evPlayer)}</b><span>part gardée + markup encaissé</span></div></div>
      <p class="note">Markup juste ≈ 1 + ROI attendu (ici ${fr(fair, 2)}). Au-delà, les backers perdent de l'argent en moyenne ; en dessous, tu leur donnes de l'EV. Le markup rémunère ton avantage, pas ta variance : un ROI estimé sur moins de 500 tournois est très incertain.</p>
      <h3>Contrat de makeup (cash ou tournois)</h3>
      <div class="form"><label class="f">Partage des profits pour toi (%)<input data-skf="split" inputmode="decimal" value="${esc(sk.split)}"></label><label class="f">Makeup actuel (€, négatif = dette)<input data-skf="makeup" inputmode="decimal" value="${esc(sk.makeup)}"></label><label class="f">Résultat d'une session (€)<input data-skf="result" inputmode="decimal" value="${esc(sk.result)}" placeholder="ex. 800"></label></div>
      ${sk.result !== '' ? (() => { const m0 = num(sk.makeup), r = num(sk.result), tot = m0 + r; return tot <= 0 ? `<p>Makeup après la session : <strong style="color:var(--bad)">${eur(tot)}</strong>. Rien à partager : tu dois d'abord effacer la dette.</p>` : `<p>Makeup effacé, profit à partager ${eur(tot)} : <strong>${eur(tot * split)} pour toi</strong>, ${eur(tot * (1 - split))} pour le backer ; le makeup repart à 0.</p>`; })() : ''}
      <div class="row"><input data-skf="newname" placeholder="Nom du contrat (backer, période)" value="${esc(sk.newname || '')}" style="min-width:220px"><button class="btn" data-act="sknew">Suivre ce contrat</button></div>
      ${C0.length ? `<div class="tw"><table class="t"><thead><tr><th>Contrat</th><th class="n">Ta part</th><th class="n">Makeup</th><th class="n">Reçu (toi)</th><th class="n">Reçu (backer)</th><th></th></tr></thead><tbody>${list}</tbody></table></div>` : ''}
      <p class="note">Pas de place de marché : un calculateur pour négocier un accord clair et un suivi des comptes. Mets tout contrat par écrit (durée, makeup à la fin, limites autorisées, fréquence des partages).</p></section>`;
  }
  ONCHANGE.push((t) => { if (t.dataset.skf) { sk[t.dataset.skf] = t.value; render(); return true; } if (t.dataset.skr !== undefined) { sk['r' + t.dataset.skr] = t.value; return true; } });
  ACT.sknew = () => { const n = (sk.newname || '').trim() || 'Contrat ' + (contracts().length + 1); contracts().push({ name: n.slice(0, 40), split: Math.min(1, Math.max(0, num(sk.split) / 100)), makeup: num(sk.makeup), paidPlayer: 0, paidBacker: 0, log: [] }); sk.newname = ''; save(); render(); };
  ACT.skadd = (t) => {
    const i = +t.dataset.i, c = contracts()[i], r = num(sk['r' + i] ?? $(`[data-skr="${i}"]`)?.value); if (!c || !r) return;
    const tot = c.makeup + r;
    if (tot <= 0) c.makeup = tot; else { c.paidPlayer += tot * c.split; c.paidBacker += tot * (1 - c.split); c.makeup = 0; }
    c.log.push({ d: today(), r }); sk['r' + i] = ''; save(); render();
  };
  ACT.skdel = (t) => { contracts().splice(+t.dataset.i, 1); save(); render(); };

  const fest = () => { const w = W(); return w.fest || (w.fest = { name: '', events: [], travel: '', nights: '', hotel: '', days: '', food: '', other: '', rate: '1', check: {} }); };
  const CHECK = ['Pièce d\'identité valide (exigée à l\'entrée des casinos)', 'Passeport et visa si hors Union européenne', 'Hôtel réservé près de la salle', 'Pré-inscription aux tournois et horaires vérifiés', 'Structure des tournois lue (niveaux, tapis, re-entrées)', 'Budget maximum et stop-loss du festival écrits', 'Moyens de paiement, plafonds de carte, devises', 'Assurance voyage', 'Fiscalité des gains dans le pays (à vérifier avant)', 'Sommeil et repas planifiés entre les jours de jeu', 'Casque, chargeur, tenue chaude (salles climatisées)'];
  function festivalHTML() {
    const F = fest(), rate = num(F.rate) || 1, buy = F.events.reduce((a, e) => a + num(e.bi) * (1 + num(e.re || 0)), 0) * rate;
    const costs = (num(F.travel) + num(F.nights) * num(F.hotel) + num(F.days) * num(F.food) + num(F.other)), total = buy + costs;
    const bank = X.journalStats().bank, share = bank > 0 ? buy / bank : null, roiNeed = buy > 0 ? costs / buy : null;
    return `<section class="panel"><span class="eyebrow">Préparation de festival</span><h2>${esc(F.name || 'Ton prochain festival')} : budget, programme, check-list</h2>
      <div class="form"><label class="f">Festival<input data-fsf="name" value="${esc(F.name)}" placeholder="ex. étape d'un circuit à l'étranger"></label><label class="f">Taux de change (1 unité = … €)<input data-fsf="rate" inputmode="decimal" value="${esc(F.rate)}"></label></div>
      <h3>Programme</h3>
      ${F.events.length ? `<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Tournoi</th><th class="n">Buy-in</th><th class="n">Re-entrées prévues</th><th></th></tr></thead><tbody>${F.events.map((e, i) => `<tr><td class="mono">${esc(e.date)}</td><td>${esc(e.name)}</td><td class="n mono">${fr(num(e.bi), 0)}</td><td class="n mono">${num(e.re || 0)}</td><td><button class="btn small" data-act="fsdel" data-i="${i}">Retirer</button></td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="row"><input type="date" data-fsf="ndate" value="${esc(F.ndate || '')}" aria-label="Date du tournoi"><input data-fsf="nname" placeholder="Tournoi" value="${esc(F.nname || '')}" style="min-width:160px"><input data-fsf="nbi" inputmode="decimal" placeholder="Buy-in" value="${esc(F.nbi || '')}" style="width:7em"><input data-fsf="nre" inputmode="numeric" placeholder="Re-entrées" value="${esc(F.nre || '')}" style="width:7em"><button class="btn" data-act="fsadd">Ajouter</button></div>
      <h3>Frais (en €)</h3>
      <div class="form"><label class="f">Transport aller-retour<input data-fsf="travel" inputmode="decimal" value="${esc(F.travel)}"></label><label class="f">Nuits × prix par nuit<span class="row" style="gap:6px"><input data-fsf="nights" inputmode="numeric" value="${esc(F.nights)}" style="width:5em" aria-label="Nuits"><input data-fsf="hotel" inputmode="decimal" value="${esc(F.hotel)}" style="width:7em" aria-label="Prix par nuit"></span></label><label class="f">Jours × repas par jour<span class="row" style="gap:6px"><input data-fsf="days" inputmode="numeric" value="${esc(F.days)}" style="width:5em" aria-label="Jours"><input data-fsf="food" inputmode="decimal" value="${esc(F.food)}" style="width:7em" aria-label="Repas par jour"></span></label><label class="f">Divers (pourboires, transports sur place)<input data-fsf="other" inputmode="decimal" value="${esc(F.other)}"></label></div>
      <div class="stats"><div class="stat"><span>Buy-ins</span><b>${eur(buy)}</b><span>re-entrées comprises</span></div><div class="stat"><span>Frais</span><b>${eur(costs)}</b><span>voyage et séjour</span></div><div class="stat hero"><span>Budget total</span><b>${eur(total)}</b><span>${share !== null ? `${pct(share, 1)} de ta bankroll en buy-ins` : 'bankroll inconnue'}</span></div><div class="stat"><span>ROI pour couvrir les frais</span><b>${roiNeed !== null ? pct(roiNeed, 0) : '—'}</b><span>sur les buy-ins</span></div></div>
      ${share !== null && share > 0.2 ? '<p class="pill bad" style="white-space:normal">Plus de 20 % de ta bankroll en buy-ins sur un seul festival : risque élevé. Réduis le programme ou vends des parts (calculateur ci-dessus).</p>' : ''}
      ${roiNeed !== null && roiNeed > 0.3 ? '<p class="note">Il faut un ROI de plus de 30 % juste pour rembourser les frais : très peu de joueurs l\'atteignent. Un festival à l\'étranger se justifie surtout par le volume de tournois joués.</p>' : ''}
      <h3>Check-list</h3><div style="display:grid;gap:6px">${CHECK.map((c, i) => `<label class="check"><input type="checkbox" data-act="fscheck" data-i="${i}" ${F.check[i] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div></section>`;
  }
  ONCHANGE.push((t) => { if (t.dataset.fsf) { fest()[t.dataset.fsf] = t.value; save(); render(); return true; } });
  ACT.fsadd = () => { const F = fest(); if (!F.nname && !F.nbi) return; F.events.push({ date: F.ndate || '', name: (F.nname || 'Tournoi').slice(0, 60), bi: F.nbi || '0', re: F.nre || '0' }); F.events.sort((a, b) => String(a.date).localeCompare(String(b.date))); F.nname = F.nbi = F.nre = ''; save(); render(); };
  ACT.fsdel = (t) => { fest().events.splice(+t.dataset.i, 1); save(); render(); };
  ACT.fscheck = (t) => { const F = fest(); F.check[t.dataset.i] = t.checked; save(); };
  const baseCarriere = VIEWS.carriere;
  VIEWS.carriere = () => baseCarriere() + stakingHTML() + festivalHTML();

  // =================== Journal : suivi de session live (#30) ===================
  const CUR = [['EUR', '€', 1], ['USD', '$', 0.92], ['GBP', '£', 1.17], ['CHF', 'CHF', 1.05], ['CZK', 'Kč', 0.04], ['AUTRE', '', 1]];
  const lv = () => { const w = W(); return w.liveSes || null; };
  function liveHTML() {
    const L = lv();
    if (!L) return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Session live</span><h2>Suivre une session en salle ou en club</h2></div><button class="btn primary" data-act="lsstart">Démarrer une session live</button></div><p class="note">Chrono, achats et recaves, pourboires, devise et taux de change ; à la fin, la session part au Journal (en €) et s'exporte en CSV.</p></section>`;
    const cur = CUR.find((c) => c[0] === L.cur) || CUR[0], sym = cur[1] || L.cur, rate = num(L.rate) || 1;
    const buy = L.tx.filter((x) => x.k === 'buy').reduce((a, x) => a + x.v, 0), tips = L.tx.filter((x) => x.k === 'tip').reduce((a, x) => a + x.v, 0), out = L.tx.filter((x) => x.k === 'out').reduce((a, x) => a + x.v, 0);
    const end = L.end || Date.now(), mins = Math.round((end - L.t0) / 60000), res = out - buy - tips;
    return `<section class="panel" style="border-color:var(--accent)"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Session live${L.end ? ' terminée' : ' en cours'} · ${esc(L.place || 'salle')}</span><h2 class="mono" id="lsclock">${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}</h2></div><span class="row">${L.end ? '' : '<button class="btn" data-act="lsend">Fin de session</button>'}<button class="btn small" data-act="lscsv">Exporter CSV</button></span></div>
      <div class="form"><label class="f">Lieu<input data-lsf="place" value="${esc(L.place || '')}" placeholder="Casino, club, partie"></label><label class="f">Jeu et limite<input data-lsf="stake" value="${esc(L.stake || '')}" placeholder="NL 1/2"></label>
        <label class="f">Devise<select data-lsf="cur">${CUR.map(([k]) => `<option${k === L.cur ? ' selected' : ''}>${k}</option>`).join('')}</select></label><label class="f">1 ${esc(L.cur)} = … €<input data-lsf="rate" inputmode="decimal" value="${esc(L.rate)}"></label></div>
      <div class="row"><input data-lsf="amt" inputmode="decimal" placeholder="Montant" value="${esc(L.amt || '')}" style="width:8em" aria-label="Montant"><button class="btn" data-act="lstx" data-k="buy">Achat / recave</button><button class="btn" data-act="lstx" data-k="tip">Pourboire</button><button class="btn" data-act="lstx" data-k="out">Je sors avec</button></div>
      ${L.tx.length ? `<div class="tw"><table class="t"><tbody>${L.tx.map((x, i) => `<tr><td class="mono">${new Date(x.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td><td>${{ buy: 'Achat / recave', tip: 'Pourboire', out: 'Sortie' }[x.k]}</td><td class="n mono">${fr(x.v, 2)} ${esc(sym)}</td><td><button class="btn small" data-act="lsundo" data-i="${i}">Annuler</button></td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="stats"><div class="stat"><span>Investi</span><b>${fr(buy, 0)} ${esc(sym)}</b><span>${L.tx.filter((x) => x.k === 'buy').length} achat(s)</span></div><div class="stat"><span>Pourboires</span><b>${fr(tips, 0)} ${esc(sym)}</b><span>à déduire du gain</span></div><div class="stat hero"><span>Résultat</span><b style="color:var(${res >= 0 ? '--good' : '--bad'})">${out ? sgn(res, 0) + ' ' + esc(sym) : '—'}</b><span>${out ? `${eur(res * rate)} · ${eur(mins ? (res * rate) / mins * 60 : 0)}/h` : 'renseigne ta sortie'}</span></div></div>
      ${L.end ? `<div class="row"><button class="btn primary" data-act="lssave" ${out ? '' : 'disabled'}>Enregistrer au Journal (${eur(res * rate)})</button><button class="btn" data-act="lsdrop">Abandonner</button></div>` : ''}</section>`;
  }
  const lsTimer = setInterval(() => { const L = lv(), el = $('#lsclock'); if (L && !L.end && el) { const m = Math.round((Date.now() - L.t0) / 60000); el.textContent = `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; } }, 30000); void lsTimer;
  ACT.lsstart = () => { W().liveSes = { t0: Date.now(), cur: 'EUR', rate: '1', place: '', stake: '', tx: [] }; save(); render(); };
  ACT.lstx = (t) => { const L = lv(), v = Math.abs(num(L.amt)); if (!v) return; L.tx.push({ t: Date.now(), k: t.dataset.k, v }); L.amt = ''; save(); render(); };
  ACT.lsundo = (t) => { lv().tx.splice(+t.dataset.i, 1); save(); render(); };
  ACT.lsend = () => { lv().end = Date.now(); save(); render(); };
  ACT.lsdrop = () => { W().liveSes = null; save(); render(); };
  ACT.lssave = () => {
    const L = lv(), rate = num(L.rate) || 1, buy = L.tx.filter((x) => x.k === 'buy').reduce((a, x) => a + x.v, 0), tips = L.tx.filter((x) => x.k === 'tip').reduce((a, x) => a + x.v, 0), out = L.tx.filter((x) => x.k === 'out').reduce((a, x) => a + x.v, 0);
    const d = new Date(L.t0), date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    state.journal.sessions.push({ id: 's' + Date.now().toString(36), date, room: ('Live ' + (L.place || '')).trim().slice(0, 40), format: 'Cash', stake: String(L.stake || 'LIVE').toUpperCase().replace(/\s/g, ''), result: Math.round((out - buy - tips) * rate * 100) / 100, hands: 0, minutes: Math.round(((L.end || Date.now()) - L.t0) / 60000), tilt: 0, trigger: '', note: `Live ${L.cur} (taux ${L.rate}), pourboires ${fr(tips, 2)}` });
    Store.save('journal'); W().liveSes = null; save(); render();
  };
  ACT.lscsv = async () => {
    const L = lv(); if (!L) return;
    const rows = [['heure', 'type', 'montant', 'devise', 'montant_eur'], ...L.tx.map((x) => [new Date(x.t).toISOString(), x.k, x.v, L.cur, Math.round(x.v * (num(L.rate) || 1) * 100) / 100])];
    const data = rows.map((r) => r.join(';')).join('\n'), filename = `session-live-${new Date(L.t0).toISOString().slice(0, 10)}.csv`;
    try { const d = window.claude?.use ? await window.claude.use('downloads') : null; if (d) { await d.save({ filename, data }); return; } } catch (e) { if (e && e.code === 'declined') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'text/csv' })); a.download = filename; a.click();
  };
  ONCHANGE.push((t) => { if (t.dataset.lsf) { const L = lv(); if (!L) return true; L[t.dataset.lsf] = t.value; if (t.dataset.lsf === 'cur') { const c = CUR.find((x) => x[0] === t.value); if (c && c[0] !== 'AUTRE') L.rate = String(c[2]); } save(); render(); return true; } });
  const baseJournal = VIEWS.journal;
  VIEWS.journal = () => { const h = baseJournal(), i = h.indexOf('<div class="stats">'); return i >= 0 ? h.slice(0, i) + liveHTML() + h.slice(i) : h + liveHTML(); };
})();
