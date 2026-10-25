// Mains complètes notées en perte d'EV (Simulateur › Mains notées) : un spot préflop connu, puis flop, turn et river
// contre un adversaire qui joue la stratégie du solveur avec ses vraies cartes. Chaque décision est notée en EV perdue.
// Le flop est résolu dans un fil séparé pendant que tu joues la main précédente ; la river est re-résolue exactement.
(function () {
  const X = window.__S52, E = window.Engine, PF = window.Postflop, POOL = window.PFPool;
  const { $, esc, fr, pct, sgn, state, Store, render, cardHTML, backHTML, ACT, ONKEY } = X;
  const SV = () => X.SOLVER;
  const prog = () => state.progress.practice || (state.progress.practice = { hands: 0, n: 0, good: 0, loss: 0, lossBB: 0, hist: [] });
  const GRADE = [['Meilleure', 'good'], ['Correcte', 'good'], ['Inexacte', ''], ['Erreur', 'bad']];
  const gradeOf = (lossPct, freq) => (lossPct < 0.005 || freq >= 0.25 ? 0 : lossPct < 0.02 ? 1 : lossPct < 0.06 ? 2 : 3);
  const RIVER = { bet: '33 75 150', raise: '60 a' };
  const setup = { scen: 'srp-BTN-BB', seat: 'rand', target: 10, depth: 'fast', quiet: false };
  let ses = null, qz = null;
  const BANK = () => window.HandQuiz || [];

  // ---------- Donne : combos tirés selon les poids des ranges, board de 5 cartes ----------
  function pickWeighted(list, avoid) {
    const ok = list.filter(([a, b]) => !avoid.has(a) && !avoid.has(b)); let tot = 0; ok.forEach((x) => (tot += x[2]));
    let r = Math.random() * tot; for (const x of ok) { r -= x[2]; if (r <= 0) return [x[0], x[1]]; } return ok.length ? [ok[0][0], ok[0][1]] : null;
  }
  function deal() {
    const S = SV(), sc = S.SCEN.find((x) => x.id === setup.scen) || S.SCEN[0], [o, i] = S.seatsOf(sc);
    const names = [o[0], i[0]], ranges = [o[1], i[1]], agg = sc.agg === o[0] ? 0 : 1;
    const heroP = setup.seat === 'rand' ? (Math.random() < 0.5 ? 0 : 1) : setup.seat === sc.a ? names.indexOf(sc.a) : names.indexOf(sc.b);
    const W = ranges.map((r) => PF.parseWeighted(r, []));
    const hero = pickWeighted(W[heroP], new Set()), vil = pickWeighted(W[1 - heroP], new Set(hero));
    const used = new Set([...hero, ...vil]), deck = []; for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
    for (let k = deck.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [deck[k], deck[j]] = [deck[j], deck[k]]; }
    const board = deck.slice(0, 5);
    const P = S.PRESETS[setup.depth];
    const cfg = { board: board.slice(0, 3), pot: sc.pot, stack: sc.stack, ranges, sizes: S.presetSizes(setup.depth, agg, 3), maxRaises: P.maxRaises, sample: S.SAMPLES.fast, include: board.slice(3) };
    const h = { sc, names, heroP, agg, hero, vil, board, cfg, path: [], log: [], decisions: [], stage: 'solving', prog: null, base: [0, 0], pot0: sc.pot, stack0: sc.stack };
    h.job = POOL.solve(cfg, { pct: setup.depth === 'fast' ? 1 : 0.8, maxMs: 30000, onProgress: (j) => { h.prog = j.ex; if (ses && ses.cur === h) paintProgress(); } });
    h.job.ready.then(() => { h.ctx = { job: h.job, path: [], idx: idxOf(h.job, h) }; if (ses && ses.cur === h) advance(h); }, (e) => { h.stage = 'error'; h.err = e.message; if (ses && ses.cur === h) render(); });
    return h;
  }
  const same = (x, a, b) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a);
  function idxOf(job, h) { return [0, 1].map((p) => { const c = p === h.heroP ? h.hero : h.vil; return job.hands[p].findIndex((x) => same(x, c[0], c[1])); }); }
  function paintProgress() { const el = $('#prprog'); if (el && ses?.cur) el.textContent = progressText(ses.cur); }
  const progressText = (h) => `Résolution du flop dans un fil séparé${h.prog != null ? ` · exploitabilité ${fr(h.prog, 2)} % du pot` : ''}…`;

  // ---------- Déroulé : l'adversaire joue sa stratégie, les cartes tombent, on s'arrête à chaque décision du héros ----------
  const combosArg = (h) => ({ [h.heroP]: h.ctx.idx[h.heroP], [1 - h.heroP]: h.ctx.idx[1 - h.heroP] });
  async function advance(h) {
    try {
      for (let guard = 0; guard < 60; guard++) {
        const n = await h.ctx.job.node(h.ctx.path, combosArg(h));
        h.node = n;
        if (n.t === 'chance') {
          const c = h.board[n.board.length];
          if (!n.cards.includes(c)) throw new Error('Carte absente de l\'arbre');
          // River : re-résolution exacte avec plus de tailles, à partir des ranges qui arrivent ici.
          if (n.board.length === 4 && setup.river !== false) { await resolveRiver(h, n); continue; }
          h.ctx.path.push(c); h.log.push({ street: n.board.length + 1, card: c }); continue;
        }
        if (n.t === 'act' && n.p === h.heroP) { h.stage = 'play'; render(); return; }
        if (n.t === 'act') {
          const st = n.combo[1 - h.heroP]?.strat || n.freq; let r = Math.random(), a = 0;
          for (; a < st.length - 1; a++) { r -= st[a]; if (r <= 0) break; }
          h.log.push({ who: 1 - h.heroP, label: n.acts[a].label, street: n.street }); h.ctx.path.push(a); continue;
        }
        return finish(h, n);
      }
    } catch (e) { h.stage = 'error'; h.err = e.message; render(); }
  }
  async function resolveRiver(h, n) {
    h.stage = 'river'; render();
    const rg = await h.ctx.job.ranges(h.ctx.path), river = h.board.slice(0, 5);
    // Les cartes réelles restent dans les ranges, même si la ligne jouée était rare à l'équilibre.
    [h.hero, h.vil].forEach((c, k) => { const p = k === 0 ? h.heroP : 1 - h.heroP; if (!rg[p].some((x) => same(x, c[0], c[1]))) rg[p].push([c[0], c[1], 1e-3]); });
    const cfg = { board: river, pot: n.pot, stack: h.stack0 - n.C[0], ranges: rg.map((l) => l.filter(([a, b]) => !river.includes(a) && !river.includes(b))), sizes: { flop: [{ bet: '', raise: '' }, { bet: '', raise: '' }], turn: [{ bet: '', raise: '' }, { bet: '', raise: '' }], river: [RIVER, RIVER] }, maxRaises: 2 };
    h.base = n.C.slice(); h.log.push({ street: 5, card: h.board[4] });
    if (cfg.stack <= 1e-6) { h.ctx.path.push(h.board[4]); return; }
    const job = POOL.solve(cfg, { pct: 0.3, maxMs: 9000 });
    await job.ready;
    const old = h.ctx.job; h.ctx = { job, path: [] }; h.ctx.idx = idxOf(job, h); h.rivJob = job;
    if (old !== h.job) old.free();
  }
  function finish(h, n) {
    const C = [h.base[0] + n.C[0], h.base[1] + n.C[1]], hp = h.heroP;
    let net, txt;
    // Résultat de la main entière (mise préflop comprise) : gain = pot préflop + mises adverses − ta mise préflop.
    const pre = 100 - h.stack0;
    if (n.t === 'fold') { net = (n.winner === hp ? h.pot0 + C[1 - hp] : -C[hp]) - pre; txt = n.winner === hp ? 'L\'adversaire se couche.' : 'Tu te couches.'; }
    else {
      const b = h.board.slice(0, 5), vh = E.evaluate([...h.hero, ...b]), vv = E.evaluate([...h.vil, ...b]);
      net = (vh > vv ? h.pot0 + C[1 - hp] : vh < vv ? -C[hp] : h.pot0 / 2) - pre; txt = `Abattage : ${vh > vv ? 'tu gagnes' : vh < vv ? 'tu perds' : 'partage'} (${E.categoryName ? E.categoryName(vh) : ''} contre ${E.categoryName ? E.categoryName(vv) : ''}).`;
    }
    h.result = { net, txt }; h.stage = 'done';
    const P = prog(); P.hands++; ses.done++; ses.net += net; Store.save('progress');
    render();
  }
  function choose(a) {
    const h = ses?.cur; if (!h || h.stage !== 'play' || !h.node || h.node.t !== 'act') return;
    const n = h.node, c = n.combo[h.heroP]; if (!c) return;
    const best = Math.max(...c.ev), loss = Math.max(0, best - c.ev[a]), lossPct = loss / n.pot, g = gradeOf(lossPct, c.strat[a]);
    h.decisions.push({ street: n.street, board: n.board, acts: n.acts, chosen: a, strat: c.strat, ev: c.ev, best: c.ev.indexOf(best), loss, lossPct, g, pot: n.pot });
    const P = prog(); P.n++; if (g <= 1) P.good++; P.loss += lossPct; P.lossBB += loss; P.hist = [...(P.hist || []), Math.round(lossPct * 1000) / 1000].slice(-100);
    ses.n++; ses.lossBB += loss; ses.lossPct += lossPct; if (g <= 1) ses.good++; ses.gc = ses.gc || [0, 0, 0, 0]; ses.gc[g]++;
    X.award?.('decision', { cats: ['value'], ok: g <= 1 }, true); X.award?.('trainer', null, true);
    Store.save('progress');
    h.log.push({ who: h.heroP, label: n.acts[a].label, street: n.street, g });
    h.ctx.path.push(a); h.stage = 'wait'; render(); advance(h);
  }

  // ---------- Session ----------
  function startSession() {
    if (ses) endSession(true);
    ses = { n: 0, good: 0, lossBB: 0, lossPct: 0, done: 0, net: 0, target: setup.target };
    ses.cur = deal(); ses.next = setup.target === 1 ? null : deal();
    render();
  }
  function nextHand() {
    if (!ses) return;
    if (ses.target && ses.done >= ses.target) { ses.over = true; render(); return; }
    freeHand(ses.cur);
    ses.cur = ses.next || deal(); ses.next = ses.target && ses.done + 1 >= ses.target ? null : deal();
    if (ses.cur.ctx && ses.cur.stage === 'solving') advance(ses.cur);
    render();
  }
  function freeHand(h) { if (!h) return; try { h.job.free(); h.rivJob?.free(); } catch (e) { /* déjà libéré */ } }
  function endSession(silent) { if (!ses) return; freeHand(ses.cur); freeHand(ses.next); ses = null; if (!silent) render(); }

  // ---------- Rendu ----------
  const STREET = { 3: 'Flop', 4: 'Turn', 5: 'River' };
  const cardTxt = (c) => `<strong>${E.RANKS[c >> 2].replace('T', '10')}${E.SUIT_SYM[E.SUITS[c & 3]]}</strong>`;
  function decisionHTML(d) {
    const rows = d.acts.map((a, i) => `<tr${i === d.chosen ? ' style="font-weight:700"' : ''}><td>${esc(a.label)}${i === d.chosen ? ' ← toi' : ''}${i === d.best ? ' ★' : ''}</td><td class="n mono">${pct(d.strat[i])}</td><td class="n mono">${fr(d.ev[i], 2)}</td><td class="n mono">${i === d.best ? '—' : '−' + fr(d.ev[d.best] - d.ev[i], 2)}</td></tr>`).join('');
    return `<div class="tw"><table class="t"><thead><tr><th>Action</th><th class="n">Solveur</th><th class="n">EV (bb)</th><th class="n">Écart</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function logHTML(h) {
    const nm = (p) => (p === h.heroP ? 'Toi' : esc(h.names[p]));
    return h.log.map((l) => (l.card !== undefined ? `<span class="note">${STREET[l.street]} ${cardTxt(l.card)}</span>` : `<span>${nm(l.who)} : ${esc(l.label)}${l.g !== undefined ? ` <span class="pill ${GRADE[l.g][1]}">${GRADE[l.g][0]}</span>` : ''}</span>`)).join(' · ');
  }
  function tableHTML(h) {
    const n = h.node, shown = n ? n.board.length : 3, C = n && n.C ? [h.base[0] + n.C[0], h.base[1] + n.C[1]] : [0, 0];
    const pot = n ? n.pot : h.pot0;
    const seat = (p) => `<div style="display:grid;gap:4px;justify-items:center"><span class="note">${esc(h.names[p])}${p === h.heroP ? ' (toi)' : ''}${p === h.agg ? ' · agresseur' : ''}</span><div class="cards">${p === h.heroP || h.stage === 'done' ? (p === h.heroP ? h.hero : h.vil).map((c) => cardHTML(c, true)).join('') : backHTML(true) + backHTML(true)}</div><span class="mono note">tapis ${fr(h.stack0 - C[p], 1)} bb</span></div>`;
    return `<div class="felt" style="display:grid;gap:12px;justify-items:center;padding:16px;border-radius:14px">
      <div class="row" style="gap:28px;justify-content:center">${seat(0)}${seat(1)}</div>
      <div class="row" style="gap:16px;justify-content:center;align-items:center"><div class="cards">${h.board.slice(0, Math.max(3, shown)).map((c) => cardHTML(c)).join('')}</div><span class="pot" style="font:700 15px var(--f-display)">Pot ${fr(pot, 1)} bb</span></div></div>`;
  }
  // ---------- Quiz instantanés : spots déjà résolus hors ligne, sans attente ----------
  // Meilleure action : EV la plus haute, à égalité (EV arrondies) celle que le solveur joue le plus.
  const bestOf = (q) => q.e.reduce((b, x, i) => (x > q.e[b] + 1e-9 || (Math.abs(x - q.e[b]) <= 1e-9 && q.f[i] > q.f[b]) ? i : b), 0);
  function newQuiz() { const B = BANK(); if (!B.length) return; let k; do { k = Math.floor(Math.random() * B.length); } while (B.length > 1 && qz && qz.k === k); qz = { k, q: B[k], a: null, n: qz?.n || 0, good: qz?.good || 0, loss: qz?.loss || 0 }; }
  function answerQuiz(a) {
    if (!qz || qz.a !== null) return; const q = qz.q, best = Math.max(...q.e), loss = Math.max(0, best - q.e[a]), lossPct = loss / q.pot, g = gradeOf(lossPct, q.f[a]);
    qz.a = a; qz.g = g; qz.lossBB = loss; qz.lossPct = lossPct; qz.n++; if (g <= 1) qz.good++; qz.loss += lossPct;
    const P = prog(); P.n++; if (g <= 1) P.good++; P.loss += lossPct; P.lossBB += loss; P.hist = [...(P.hist || []), Math.round(lossPct * 1000) / 1000].slice(-100); P.quiz = (P.quiz || 0) + 1;
    X.award?.('decision', { cats: ['value'], ok: g <= 1 }, true); Store.save('progress'); render();
  }
  function quizHTML() {
    const q = qz.q, cards = E.parseCards(q.b), hc = E.parseCards(q.h), best = bestOf(q);
    const seat = (p) => `<div style="display:grid;gap:4px;justify-items:center"><span class="note">${esc(q.n[p])}${p === q.p ? ' (toi)' : ''}</span><div class="cards">${p === q.p ? hc.map((c) => cardHTML(c, true)).join('') : backHTML(true) + backHTML(true)}</div></div>`;
    const table = qz.a === null ? '' : `<div class="tw"><table class="t"><thead><tr><th>Action</th><th class="n">Solveur</th><th class="n">EV (bb)</th><th class="n">Écart</th></tr></thead><tbody>${q.o.map((l, i) => `<tr${i === qz.a ? ' style="font-weight:700"' : ''}><td>${esc(l)}${i === qz.a ? ' ← toi' : ''}${i === best ? ' ★' : ''}</td><td class="n mono">${pct(q.f[i])}</td><td class="n mono">${fr(q.e[i], 2)}</td><td class="n mono">${i === best ? '—' : '−' + fr(q.e[best] - q.e[i], 2)}</td></tr>`).join('')}</tbody></table></div>`;
    return `<div class="row" style="justify-content:space-between"><span class="pill acc">Quiz ${qz.n + (qz.a === null ? 1 : 0)} · banque de ${BANK().length}</span><span class="note mono">${qz.n ? `${pct(qz.good / qz.n)} justes · EV perdue ${fr(qz.loss / qz.n * 100, 2)} % du pot` : ''}</span><button class="btn small" data-act="qzend">Terminer</button></div>
      <div class="felt" style="display:grid;gap:12px;justify-items:center;padding:16px;border-radius:14px"><div class="row" style="gap:28px;justify-content:center">${seat(0)}${seat(1)}</div>
        <div class="row" style="gap:16px;justify-content:center;align-items:center"><div class="cards">${cards.map((c) => cardHTML(c)).join('')}</div><span class="pot" style="font:700 15px var(--f-display)">Pot ${fr(q.pot, 1)} bb</span></div></div>
      <section class="panel"><span class="eyebrow">${esc(q.s)} · ${STREET[cards.length]} · tapis ${fr(q.st, 1)} bb</span><p>${q.l ? esc(q.l) : 'Premier à parler au flop.'}</p>
        ${qz.a === null ? `<h2>Que joues-tu ?</h2><div class="actions">${q.o.map((l, i) => `<button class="btn" data-act="qzans" data-i="${i}">${esc(l)} <span class="note">${i + 1}</span></button>`).join('')}</div>`
          : `<div class="row" style="justify-content:space-between"><h2>${GRADE[qz.g][0]}</h2><span class="pill ${GRADE[qz.g][1]}">−${fr(qz.lossBB, 2)} bb (${fr(qz.lossPct * 100, 1)} % du pot)</span></div>${table}<div class="row"><button class="btn primary" data-act="qznext">Quiz suivant <span class="note">Entrée</span></button></div>`}</section>`;
  }
  ACT.qzstart = () => { qz = null; newQuiz(); render(); };
  ACT.qzans = (t) => answerQuiz(+t.dataset.i);
  ACT.qznext = () => { newQuiz(); render(); };
  ACT.qzend = () => { qz = null; render(); };

  X.practiceHTML = () => {
    const P = prog(), S = SV();
    if (qz) return quizHTML();
    if (!S || !POOL) return '<section class="panel"><p>Le solveur n\'est pas chargé.</p></section>';
    const statsHTML = `<div class="stats"><div class="stat hero"><span>Décisions notées</span><b>${P.n}</b><span>${P.hands} mains jouées</span></div>
      <div class="stat"><span>Meilleures ou correctes</span><b>${P.n ? pct(P.good / P.n) : '—'}</b><span>repère d'un bon régulier : 80 %</span></div>
      <div class="stat"><span>EV perdue moyenne</span><b>${P.n ? fr(P.loss / P.n * 100, 2) + ' %' : '—'}</b><span>du pot par décision${P.hist?.length >= 20 ? ` · 20 dernières : ${fr(P.hist.slice(-20).reduce((a, b) => a + b, 0) / 20 * 100, 2)} %` : ''}</span></div></div>`;
    if (!ses) {
      const sc = S.SCEN.find((x) => x.id === setup.scen) || S.SCEN[0];
      return `<section class="panel"><span class="eyebrow">Mains complètes notées en perte d'EV</span><h2>Joue le flop, le turn et la river contre le solveur</h2>
        <p class="note">L'adversaire joue la stratégie d'équilibre avec ses vraies cartes. Après chaque décision, tu vois ce que le solveur fait avec ta main et l'EV perdue. Flop résolu en arrière-plan (la main suivante se calcule pendant que tu joues), river re-résolue exactement avec trois tailles et le tapis.</p>
        <label class="f">Spot préflop<select id="prscen" data-prs="scen">${['Pot simple', 'Pot 3-bet'].map((t) => `<optgroup label="${t}">${S.SCEN.filter((x) => x.type === t).map((x) => `<option value="${x.id}"${x.id === setup.scen ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <div class="row"><span class="note">Tu joues :</span>${[['rand', 'Au hasard'], [sc.a, sc.a], [sc.b, sc.b]].map(([k, l]) => `<button class="chip" aria-pressed="${setup.seat === k}" data-act="prseat" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Mains :</span>${[[10, '10'], [25, '25'], [0, 'Illimité']].map(([k, l]) => `<button class="chip" aria-pressed="${setup.target === k}" data-act="prtarget" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Arbre du flop :</span>${[['fast', 'Rapide (1 taille)'], ['std', 'Standard (2 tailles, plus lent)']].map(([k, l]) => `<button class="chip" aria-pressed="${setup.depth === k}" data-act="prdepth" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><span class="note">Corrections :</span><button class="chip" aria-pressed="${!setup.quiet}" data-act="prquiet" data-v="0">Après chaque décision</button><button class="chip" aria-pressed="${setup.quiet}" data-act="prquiet" data-v="1">Seulement en cas d'erreur (les décisions justes ne s'arrêtent pas)</button></div>
        <div class="row"><button class="btn primary" data-act="prstart">Lancer</button>${BANK().length ? `<button class="btn" data-act="qzstart">Quiz instantanés (${BANK().length} spots déjà résolus)</button>` : ''}<span class="note">Calcul : ${POOL.mode() === 'worker' ? `${POOL.workers()} fil${POOL.workers() > 1 ? 's' : ''} séparé${POOL.workers() > 1 ? 's' : ''}` : 'fil principal (ce navigateur refuse les fils séparés : l\'interface peut ralentir pendant le calcul)'}</span></div></section>${statsHTML}
        <p class="note">Simplifications : turn joué avec une seule taille (75 % du pot, comme dans l'arbre du flop), ranges préflop issues des tableaux de référence, flop approché sur un échantillon de turns et de rivers qui contient toujours le vrai board.</p>`;
    }
    const h = ses.cur;
    let body = '';
    if (ses.over) body = `<section class="panel" style="border-color:var(--accent)"><span class="eyebrow">Session terminée</span><h2>${ses.n} décisions · ${ses.n ? pct(ses.good / ses.n) : '—'} meilleures ou correctes · EV perdue ${fr(ses.lossBB, 2)} bb</h2>
      ${ses.gc ? `<p><strong style="color:var(--bad)">${ses.gc[3]} erreur${ses.gc[3] > 1 ? 's' : ''} grave${ses.gc[3] > 1 ? 's' : ''}</strong> (plus de 6 % du pot perdus) · <strong>${ses.gc[2]} moyenne${ses.gc[2] > 1 ? 's' : ''}</strong> (2 à 6 %) · ${ses.gc[1]} imprécision${ses.gc[1] > 1 ? 's' : ''} (moins de 2 %) · ${ses.gc[0]} meilleure${ses.gc[0] > 1 ? 's' : ''} action${ses.gc[0] > 1 ? 's' : ''}.</p>` : ''}
      <p class="note">EV perdue moyenne : ${ses.n ? fr(ses.lossPct / ses.n * 100, 2) : '—'} % du pot par décision. Résultat réel des mains : ${sgn(ses.net, 1)} bb (variance : juge la session sur l'EV perdue).</p>
      <div class="row"><button class="btn primary" data-act="prstart">Nouvelle session</button><button class="btn" data-act="prend">Changer de spot</button></div></section>`;
    else if (h.stage === 'solving' || h.stage === 'river' || h.stage === 'wait') body = `${tableHTML(h)}<section class="panel"><p class="note" id="prprog">${h.stage === 'river' ? 'Re-résolution exacte de la river…' : h.stage === 'wait' ? 'L\'adversaire réfléchit…' : progressText(h)}</p><div class="pbar"><i style="width:${h.stage === 'solving' ? 35 : 80}%"></i></div></section>`;
    else if (h.stage === 'error') body = `<section class="panel"><p class="pill bad" style="white-space:normal">${esc(h.err)}</p><div class="row"><button class="btn" data-act="prnext">Main suivante</button></div></section>`;
    else {
      const n = h.node, last = h.decisions[h.decisions.length - 1];
      body = tableHTML(h) + `<section class="panel"><span class="eyebrow">${STREET[n.board.length] || ''} · ${esc(h.sc.label)}</span><p>${logHTML(h) || 'Début du flop.'}</p>
        ${h.stage === 'play' ? `<div class="actions">${n.acts.map((a, i) => `<button class="btn${i === 0 ? '' : ''}" data-act="prchoose" data-i="${i}">${esc(a.label)} <span class="note">${i + 1}</span></button>`).join('')}</div>` : ''}
        ${h.stage === 'done' ? `<h3>${esc(h.result.txt)} ${sgn(h.result.net, 1)} bb</h3><p class="note">EV perdue sur la main : ${fr(h.decisions.reduce((a, d) => a + d.loss, 0), 2)} bb sur ${h.decisions.length} décision${h.decisions.length > 1 ? 's' : ''}.</p><div class="row"><button class="btn primary" data-act="prnext">${ses.target && ses.done >= ses.target ? 'Voir le bilan' : 'Main suivante'} <span class="note">Entrée</span></button></div>` : ''}</section>
        ${last && (!setup.quiet || last.g >= 2) ? `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">Ta dernière décision · ${STREET[last.street]}</span><span class="pill ${GRADE[last.g][1]}">${GRADE[last.g][0]} · −${fr(last.loss, 2)} bb (${fr(last.lossPct * 100, 1)} % du pot)</span></div>${decisionHTML(last)}
          <p class="note">« Solveur » : fréquence de chaque action avec ta main exacte. Une action jouée au moins 25 % du temps par le solveur compte comme meilleure (stratégie mixte). Écart : EV perdue par rapport à la meilleure action, en bb.</p></section>` : ''}`;
    }
    return `<div class="row" style="justify-content:space-between"><span class="pill acc">Main ${Math.min(ses.done + (h.stage === 'done' ? 0 : 1), ses.target || Infinity)}${ses.target ? '/' + ses.target : ''}</span><span class="note mono">${ses.n} décision${ses.n > 1 ? 's' : ''} · ${ses.n ? pct(ses.good / ses.n) : '—'} justes · −${fr(ses.lossBB, 2)} bb</span><button class="btn small" data-act="prend">Terminer</button></div>${body}${statsHTML}`;
  };
  ACT.prstart = () => startSession();
  ACT.prend = () => endSession();
  ACT.prnext = () => nextHand();
  ACT.prchoose = (t) => choose(+t.dataset.i);
  ACT.prquiet = (t) => { setup.quiet = t.dataset.v === '1'; render(); };
  ACT.prseat = (t) => { setup.seat = t.dataset.v; render(); };
  ACT.prtarget = (t) => { setup.target = +t.dataset.v; render(); };
  ACT.prdepth = (t) => { setup.depth = t.dataset.v; render(); };
  X.ONCHANGE.push((t) => { if (t.dataset.prs === 'scen') { setup.scen = t.value; setup.seat = 'rand'; render(); return true; } });
  ONKEY.push((e, tab) => {
    if (tab !== 'sim' || X.getSimSub?.() !== 'practice') return;
    if (qz) { if (qz.a === null && /^[1-9]$/.test(e.key) && +e.key <= qz.q.o.length) { answerQuiz(+e.key - 1); return true; } if (qz.a !== null && e.key === 'Enter') { newQuiz(); render(); return true; } return; }
    if (!ses) return;
    const h = ses.cur;
    if (h.stage === 'play' && /^[1-9]$/.test(e.key) && +e.key <= (h.node?.acts?.length || 0)) { choose(+e.key - 1); return true; }
    if (h.stage === 'done' && e.key === 'Enter') { nextHand(); return true; }
  });
  X.practiceTest = { deal: () => ses?.cur, setup };
})();
