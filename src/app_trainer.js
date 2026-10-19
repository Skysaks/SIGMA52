// Entraîneur solveur : décisions river tirées de mains complètes (flop et turn joués selon l'équilibre, ranges qui en découlent),
// résolues à la volée par le solveur exact de river, notées en perte d'EV.
(function () {
  const X = window.__S52, PF = window.Postflop, TS = window.TrainerSpots;
  const { E, $, esc, fr, pct, state, Store, render, cardHTML, cardsHTML, ACT } = X;
  const tr = { spot: null, si: -1, g: null, path: [], node: null, info: null, p: 0, hi: -1, ans: null, busy: false, err: '' };
  const SIZES = { river: [{ bet: [33, 75, 125], raise: ['a'] }, { bet: [33, 75, 125], raise: ['a'] }] };
  const pickW = (items, w) => { let t = w.reduce((a, b) => a + b, 0), x = Math.random() * t; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; };

  function newSpot() {
    if (!TS || !TS.SPOTS.length) { tr.err = 'Aucun spot disponible.'; render(); return; }
    let si; do si = Math.floor(Math.random() * TS.SPOTS.length); while (TS.SPOTS.length > 1 && si === tr.si);
    tr.si = si; tr.spot = TS.SPOTS[si]; tr.ans = null; tr.busy = true; tr.err = ''; render();
    const sp = tr.spot;
    setTimeout(() => {
      try {
        tr.g = PF.create({ board: sp.board, pot: sp.pot, stack: sp.stack, ranges: [TS.decode(sp.r[0]), TS.decode(sp.r[1])], sizes: SIZES, maxRaises: 1 });
        let ex = 100; for (let k = 0; k < 30 && ex > 0.3; k++) { tr.g.iterate(20); ex = tr.g.exploitability().pct; }
        choose(); tr.busy = false; render();
      } catch (e) { tr.busy = false; tr.err = e.message; render(); }
    }, 20);
  }
  // Choisit un nœud de décision (premier à parler, après check, face à une mise) puis un combo instructif de la range qui y arrive.
  function choose() {
    const g = tr.g; let path = [];
    const depth = pickW([0, 1, 2], [0.4, 0.35, 0.25]);
    for (let d = 0; d < depth; d++) {
      const r = g.info(path), node = r.node; if (node.t !== PF.ACT) break;
      const ok = node.acts.map((_, i) => i).filter((i) => node.acts[i].k !== 'f' && node.acts[i].k !== 'c');
      if (!ok.length) break;
      const nx = pickW(ok, ok.map((i) => r.freq[i] + 0.02));
      const child = node.ch[nx]; if (child.t !== PF.ACT) break;
      path = [...path, nx];
    }
    const info = g.info(path), node = info.node, p = node.p, n = g.N[p];
    // Combo : pondéré par la reach, avec un bonus pour les mains où les actions ont des EV éloignées.
    const idx = [], w = [];
    for (let i = 0; i < n; i++) {
      const m = info.reach[p][i]; if (m < 1e-4) continue;
      const evs = info.actEv.map((v) => v[i]).filter(isFinite), spread = Math.max(...evs) - Math.min(...evs);
      idx.push(i); w.push(m * (0.25 + Math.min(1, spread / (0.05 * info.pot))));
    }
    tr.path = path; tr.info = info; tr.node = node; tr.p = p; tr.hi = pickW(idx, w);
  }
  function answer(a) {
    const info = tr.info, node = tr.node, p = tr.p, i = tr.hi, n = tr.g.N[p];
    const evs = info.actEv.map((v) => v[i]), best = Math.max(...evs), loss = best - evs[a], lossPct = loss / info.pot;
    const freq = info.strategy[a * n + i];
    const grade = lossPct < 0.005 || freq >= 0.25 ? 'Meilleure' : lossPct < 0.02 ? 'Correcte' : lossPct < 0.06 ? 'Inexacte' : 'Erreur';
    tr.ans = { a, loss, lossPct, freq, grade, best: evs.indexOf(best) };
    const T = state.progress.trainer || (state.progress.trainer = { n: 0, ok: 0, loss: 0, hist: [] });
    T.n++; if (grade === 'Meilleure' || grade === 'Correcte') T.ok++; T.loss += lossPct;
    T.hist = [...(T.hist || []), Math.round(lossPct * 1000) / 1000].slice(-50);
    Store.save('progress'); render();
  }
  const nm = (p) => esc(tr.spot.names[p]);
  function lineText() {
    const g = tr.g; let node = g.root; const out = [];
    for (const x of tr.path) { out.push(`${nm(node.p)} ${esc(g.label(node, x).toLowerCase())}`); node = node.ch[x]; }
    return out.join(', ');
  }
  X.trainerHTML = () => {
    const T = state.progress.trainer || { n: 0, ok: 0, loss: 0, hist: [] };
    const stats = `<div class="stats"><div class="stat hero"><span>Décisions notées</span><b>${T.n}</b><span>${T.n ? pct(T.ok / T.n) + ' meilleures ou correctes' : 'pas encore de décision'}</span></div>
      <div class="stat"><span>Perte moyenne</span><b>${T.n ? fr(T.loss / T.n * 100, 2) + ' %' : '–'}</b><span>du pot par décision</span></div>
      <div class="stat"><span>50 dernières</span><b>${T.hist?.length ? fr(T.hist.reduce((a, b) => a + b, 0) / T.hist.length * 100, 2) + ' %' : '–'}</b><span>perte moyenne récente</span></div></div>`;
    const intro = `<section class="panel"><p>Des décisions de river tirées de mains complètes : le flop et le turn ont été joués selon l'équilibre, puis la river est résolue exactement. Choisis ton action ; la note dépend de la perte d'EV par rapport à la meilleure action, en % du pot.</p>
      <p class="note">${TS ? TS.SPOTS.length : 0} situations (pots simples et pots 3-bet, 6-max, 100 bb). Barème : meilleure (perte &lt; 0,5 % du pot ou action jouée ≥ 25 % par le solveur), correcte (&lt; 2 %), inexacte (&lt; 6 %), erreur au-delà.</p>
      <div class="row"><button class="btn primary" data-act="trnew" ${tr.busy ? 'disabled' : ''}>${tr.spot ? 'Spot suivant' : 'Commencer'}</button><span class="note">Touche Entrée pour le spot suivant</span></div>
      ${tr.err ? `<p class="pill bad" style="white-space:normal">${esc(tr.err)}</p>` : ''}</section>`;
    if (tr.busy) return stats + intro + '<section class="panel"><p>Calcul de l\'équilibre de la river…</p><div class="pbar"><i style="width:60%"></i></div></section>';
    if (!tr.spot || !tr.info) return stats + intro;
    const sp = tr.spot, g = tr.g, info = tr.info, node = tr.node, p = tr.p, i = tr.hi, n = g.N[p], hand = g.hands[p][i];
    const board = E.parseCards(sp.board);
    const head = `<section class="panel"><span class="eyebrow">${esc(sp.sc)} · tu es ${nm(p)} (${p ? 'en position' : 'hors de position'})</span>
      <p class="note">${esc(sp.line)} · River ${cardHTML(board[4], true)}${tr.path.length ? ' : ' + lineText() : ''}</p>
      <div class="felt"><div class="row" style="justify-content:center;gap:16px">${cardsHTML(board)}</div>
      <div class="row" style="justify-content:center;gap:18px"><span>Ta main</span>${cardsHTML(hand.slice(0, 2))}<span class="mono">Pot ${fr(info.pot, 1)} bb · tapis ${fr(g.S - Math.max(node.C[0], node.C[1]), 1)} bb</span></div></div>
      <div class="row">${node.acts.map((_, a) => `<button class="btn${tr.ans && tr.ans.a === a ? ' primary' : ''}" data-act="trans" data-a="${a}" ${tr.ans ? 'disabled' : ''}>${esc(g.label(node, a))}</button>`).join('')}</div>`;
    if (!tr.ans) return stats + intro + head + '</section>';
    const A = tr.ans, evs = info.actEv.map((v) => v[i]);
    const cls = A.grade === 'Meilleure' ? 'good' : A.grade === 'Correcte' ? 'good' : 'bad';
    const res = `<div class="verdict ${cls}"><strong>${A.grade}.</strong> ${A.loss < 1e-6 ? 'Meilleure EV.' : `Perte ${fr(A.loss, 2)} bb, soit ${fr(A.lossPct * 100, 2)} % du pot.`}</div>
      <div class="advice">${node.acts.map((_, a) => `<div class="${a === A.best ? 'good' : evs[A.best] - evs[a] > 0.02 * info.pot ? 'bad' : 'warn'}"><strong>${esc(g.label(node, a))}</strong> · solveur ${pct(info.strategy[a * n + i], 0)} · EV ${fr(evs[a], 2)} bb</div>`).join('')}</div>
      <p class="note">Équité de ta main contre la range qui arrive ici : ${pct(info.eq[p][i], 1)}. Range adverse : ${fr(info.reach[1 - p].reduce((x, y) => x + y, 0), 1)} combos pondérés.</p>
      <div class="row"><button class="btn primary" data-act="trnew">Spot suivant</button><button class="btn" data-act="tropen">Explorer dans le solveur</button></div>`;
    return stats + intro + head + res + '</section>';
  };
  ACT.trnew = () => newSpot();
  ACT.trans = (t) => { if (!tr.ans) answer(+t.dataset.a); };
  ACT.tropen = () => {
    const sv = X.solverState, sp = tr.spot; if (!sv) return;
    sv.sub = 'solve'; sv.scen = 'custom'; sv.agg = sp.agg; sv.names = sp.names.slice(); sv.board = sp.board; sv.pot = sp.pot; sv.stack = sp.stack;
    sv.r = [PF.rangeText(TS.decode(sp.r[0])), PF.rangeText(TS.decode(sp.r[1]))];
    sv.sizes = { flop: [{ bet: '', raise: '' }, { bet: '', raise: '' }], turn: [{ bet: '', raise: '' }, { bet: '', raise: '' }], river: SIZES.river.map((x) => ({ bet: x.bet.join(' '), raise: x.raise.join(' ') })) };
    sv.sizesCustom = true; sv.maxRaises = 1; sv.include = null; sv.hero = tr.g.hands[tr.p][tr.hi].slice(0, 2).map(E.cardStr).join(''); sv.heroCombo = tr.g.hands[tr.p][tr.hi].slice(0, 2);
    sv.note = `Spot de l'entraîneur : ${sp.sc}. ${sp.line}.`;
    sv.game = tr.g; sv.running = false; sv.path = tr.path.slice(); sv.ex = tr.g.exploitability(); sv.info = tr.g.info(sv.path); sv.cell = null; sv.elapsed = 0;
    X.go('solveur');
  };
  X.ONKEY.push((e, tab) => {
    if (tab !== 'solveur' || X.solverState?.sub !== 'train') return;
    if (e.key === 'Enter' && !tr.busy && (tr.ans || !tr.spot)) { newSpot(); return true; }
    if (/^[1-5]$/.test(e.key) && tr.info && !tr.ans && +e.key <= tr.node.acts.length) { answer(+e.key - 1); return true; }
  });
})();
