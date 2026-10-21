// Outils ajoutés : Atlas préflop (toutes les mains de départ, toutes les situations, décision du moteur de la Table live)
// et Variantes (équité hold'em, Short Deck, Omaha 4 et 5 cartes, Omaha Hi-Lo).
(function () {
  const X = window.__S52, L = window.Live, V = window.Variants;
  const { E, esc, fr, pct, render, grid169, cardsHTML, TOOLVIEWS, TOOLS, ACT, ONCHANGE } = X;
  TOOLS.push(['atlas', 'Atlas préflop'], ['variantes', 'Variantes']);

  // ---------------- Atlas préflop ----------------
  const at = { game: 'nlh', players: 6, pos: 'BTN', pre: 'open', raiseBB: 3, type: 'normal', stack: 100, ante: false, straddle: false, sel: null };
  const COL = { RELANCE: '#A3283A', TAPIS: '#5C1424', SUIS: '#D08A4A', CHECK: '#6B8E5A', COUCHE: 'var(--sunk)' };
  const sample = (h) => { const r1 = E.RANKS.indexOf(h[0]), r2 = E.RANKS.indexOf(h[1]); return h.length === 2 ? [r1 * 4, r2 * 4 + 1] : h[2] === 's' ? [r1 * 4 + 2, r2 * 4 + 2] : [r1 * 4 + 2, r2 * 4 + 3]; };
  function atlasRun() {
    const out = {}, cnt = {}, w = (h) => (h.length === 2 ? 6 : h[2] === 's' ? 4 : 12);
    const hands = at.game === 'sd' ? E.ALL169.filter((h) => E.RANKS.indexOf(h[0]) >= 4 && E.RANKS.indexOf(h[1]) >= 4) : E.ALL169;
    for (const h of hands) {
      const o = { game: at.game === 'sd' ? 'sd' : 'nlh', hero: sample(h), board: [], players: at.players, pos: at.pos, pre: at.pre, raiseBB: at.raiseBB, limpers: 1, callers: 1, type: at.type, stackBB: at.stack, ante: at.ante, straddle: at.straddle, live: true, iterations: 300 };
      let r = null; try { r = L.decide(o); } catch (e) { r = null; }
      const a = r ? r.action : '?'; out[h] = r; cnt[a] = (cnt[a] || 0) + w(h);
    }
    const tot = hands.reduce((s, h) => s + w(h), 0);
    return { out, cnt, tot, hands };
  }
  let atCache = null, atKey = '';
  TOOLVIEWS.atlas = () => {
    const key = JSON.stringify({ ...at, sel: null });
    if (key !== atKey) { atCache = atlasRun(); atKey = key; }
    const { out, cnt, tot } = atCache, P = L.positions(at.players);
    if (!P.includes(at.pos)) at.pos = P.includes('BTN') ? 'BTN' : P[0];
    const chip = (k, opts) => opts.map(([v, l]) => `<button class="chip" aria-pressed="${String(at[k]) === String(v)}" data-act="atset" data-k="${k}" data-v="${v}">${l}</button>`).join('');
    const sdOnly = at.game === 'sd';
    const grid = grid169((h) => { const r = out[h]; if (!r) return `<span class="rc off">${h}</span>`; const c = COL[r.action] || 'var(--sunk)'; return `<button class="rc" data-act="atsel" data-h="${h}" style="background:${c};color:${r.action === 'COUCHE' ? 'var(--muted)' : '#fff'}" title="${h} : ${esc(r.action)} ${esc(r.size || '')}">${h}</button>`; });
    const sel = at.sel && out[at.sel];
    return `<section class="panel"><h2>Atlas préflop</h2><p class="note">Toutes les mains de départ dans la situation choisie, avec la décision du moteur de la Table live. Change un réglage : la grille se recalcule.</p>
      <div class="row"><span class="note">Jeu :</span>${chip('game', [['nlh', 'Hold\'em'], ['sd', 'Short Deck']])}</div>
      <div class="row"><span class="note">Joueurs :</span>${chip('players', [2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [n, n]))}</div>
      <div class="row"><span class="note">Position :</span>${chip('pos', P.map((p) => [p, p]))}</div>
      <div class="row"><span class="note">Situation :</span>${chip('pre', [['open', 'Personne n\'a ouvert'], ['limp', '1 limper'], ['raise', 'Face à une relance'], ['raisecall', 'Relance + call'], ['threebet', '3-bet sur ma relance']])}</div>
      ${['raise', 'raisecall'].includes(at.pre) ? `<div class="row"><span class="note">Relance à :</span>${chip('raiseBB', [[2.5, '2,5 BB'], [3, '3 BB'], [4, '4 BB'], [6, '6 BB']])}</div>` : at.pre === 'threebet' ? `<div class="row"><span class="note">3-bet à :</span>${chip('raiseBB', [[8, '8 BB'], [10, '10 BB'], [12, '12 BB']])}</div>` : ''}
      <div class="row"><span class="note">Adversaires :</span>${chip('type', Object.entries(L.TYPES).map(([k, t]) => [k, t.label]))}</div>
      <div class="row"><span class="note">Tapis :</span>${chip('stack', [[100, '100 bb'], [40, '40 bb'], [20, '20 bb'], [12, '12 bb'], [8, '8 bb']])}${sdOnly ? '' : `<label class="check"><input type="checkbox" data-act="atb" data-k="ante" ${at.ante ? 'checked' : ''}><span>Ante</span></label><label class="check"><input type="checkbox" data-act="atb" data-k="straddle" ${at.straddle ? 'checked' : ''}><span>Straddle</span></label>`}</div>
      <div class="atlas">${grid}<div><div class="stats">${Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([a, n]) => `<div class="stat"><span><i class="dot" style="background:${COL[a] || 'var(--sunk)'}"></i>${esc(a)}</span><b>${pct(n / tot, 0)}</b><span>des mains</span></div>`).join('')}</div>
        ${sel ? `<div class="lres ${sel.tone}"><b>${esc(at.sel)} : ${esc(sel.action)}${sel.size ? ` <small>${esc(sel.size)}</small>` : ''}</b><ul>${(sel.lines || []).slice(0, 4).map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : '<p class="note">Touche une main pour lire l\'explication.</p>'}</div></div>
      ${sdOnly ? '<p class="note">Short Deck : seules les cartes de 6 à l\'as existent ; les autres cases sont grisées.</p>' : ''}</section>`;
  };
  ACT.atset = (t) => { const k = t.dataset.k, v = t.dataset.v; at[k] = isNaN(+v) ? v : +v; if (k === 'pre') at.raiseBB = v === 'threebet' ? 10 : 3; at.sel = null; render(); };
  ACT.atb = (t) => { at[t.dataset.k] = t.checked; render(); };
  ACT.atsel = (t) => { at.sel = t.dataset.h; render(); };

  // ---------------- Variantes : équité ----------------
  const va = { game: 'sd', h: ['AsKs', 'QdQc', '', ''], board: '', res: null };
  const EX = { nlh: ['AsKs', 'QdQc'], sd: ['AsKs', 'QdQc'], plo: ['AsAhKsKh', 'JdTd9c8c'], plo5: ['AsAhKsKhQd', 'JdTd9c8c7h'], plo8: ['As2s3hKh', 'KdKcQdQc'], stud: ['AsAhKc', 'KsKdQc'], razz: ['As2d3c', '7s8d9c'] };
  const STUD = { stud: 'Stud à 7 cartes', razz: 'Razz' };
  ONCHANGE.push((t) => { if (t.dataset.va !== undefined) { const k = t.dataset.va; if (k === 'board') va.board = t.value; else va.h[+k] = t.value; va.res = null; render(); return true; } });
  ACT.vagame = (t) => { va.game = t.dataset.v; va.h = [...EX[va.game], '', '']; va.board = ''; va.res = null; render(); };
  ACT.varun = () => {
    if (STUD[va.game]) {
      try {
        const known = va.h.map((x) => x.trim()).filter(Boolean).map((x) => E.parseCards(x)), dead = E.parseCards(va.board);
        if (known.length < 2) throw new Error('Saisis au moins deux joueurs.');
        if (known.some((k) => k.length < 1 || k.length > 7)) throw new Error('Chaque joueur a de 1 à 7 cartes connues.');
        const all = [...dead, ...known.flat()]; if (new Set(all).size !== all.length) throw new Error('Une carte apparaît deux fois.');
        const t0 = performance.now(), r = V.equityStud(va.game, known, dead, { iterations: 8000 });
        va.res = { hands: known, board: [], r: { ...r, scoop: r.equity.map(() => NaN), exact: false }, ms: Math.round(performance.now() - t0), stud: true };
      } catch (e) { va.res = { err: e.message }; }
      return render();
    }
    try {
      const G = V.GAMES[va.game], deck = new Set(V.deckOf(va.game));
      const hands = va.h.map((x) => x.trim()).filter((x, i) => x || i < 2).map((x) => (x === '' ? null : E.parseCards(x)));
      const board = E.parseCards(va.board);
      if (hands.some((h) => h && h.length !== G.hole)) throw new Error(`${G.label} : chaque main fait ${G.hole} cartes (laisse vide pour une main aléatoire).`);
      if (![0, 3, 4, 5].includes(board.length)) throw new Error('Le board fait 0, 3, 4 ou 5 cartes.');
      const all = [...board, ...hands.flat().filter((c) => c !== null && c !== undefined)];
      if (new Set(all).size !== all.length) throw new Error('Une carte apparaît deux fois.');
      if (all.some((c) => !deck.has(c))) throw new Error('Short Deck : pas de 2, 3, 4 ni 5.');
      const t0 = performance.now(), r = V.equity(va.game, hands, board, { iterations: va.game === 'plo5' || va.game === 'plo8' ? 4000 : 8000 });
      va.res = { hands, board, r, ms: Math.round(performance.now() - t0) };
    } catch (e) { va.res = { err: e.message }; }
    render();
  };
  TOOLVIEWS.variantes = () => {
    X.markSeen?.('variantes');
    const G = V.GAMES[va.game] || { label: STUD[va.game] }, r = va.res;
    let out = '<p class="note">Saisis au moins deux mains, ou laisse un champ vide pour une main aléatoire, puis Calculer.</p>';
    if (r?.err) out = `<p class="pill bad" style="white-space:normal">${esc(r.err)}</p>`;
    else if (r) out = `${r.board.length ? `<div class="felt"><div class="row" style="justify-content:center">${cardsHTML(r.board)}</div></div>` : ''}<div class="tw"><table class="t"><thead><tr><th>Main</th><th class="n">Équité</th><th class="n">Rafle le pot</th></tr></thead><tbody>${r.hands.map((h, i) => `<tr><td>${h ? cardsHTML(h, true) : '<span class="note">aléatoire</span>'}</td><td class="n mono"><b>${pct(r.r.equity[i], 1)}</b></td><td class="n mono">${isNaN(r.r.scoop[i]) ? '–' : pct(r.r.scoop[i], 1)}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">${r.r.exact ? 'Calcul exact' : `${fr(r.r.samples, 0)} tirages (Monte-Carlo)`} · ${r.ms} ms.${va.game === 'plo8' ? ' Hi-Lo : l\'équité compte les moitiés et les quarts de pot.' : ''}</p>`;
    const rules = { nlh: '2 cartes, toutes les combinaisons avec le board.', sd: '36 cartes (6 à As). La couleur bat le full, le brelan bat la suite, A-6-7-8-9 est une suite.', plo: '4 cartes : exactement 2 de la main et 3 du board.', plo5: '5 cartes : exactement 2 de la main et 3 du board.', plo8: '4 cartes. La moitié du pot va à la meilleure basse 8 or better (5 rangs différents de 8 ou moins, as bas), avec 2 cartes de la main et 3 du board.', stud: '7 cartes par joueur, pas de board : saisis les cartes connues de chaque joueur (cachées si tu les connais, et visibles), et les cartes visibles des joueurs couchés comme cartes mortes. Meilleure main haute de 5 cartes.', razz: 'Stud à 7 cartes joué pour la main la plus basse : as bas, suites et couleurs ignorées, les paires sont mauvaises. Saisis les cartes connues et les cartes mortes.' }[va.game];
    return `<section class="panel"><h2>Équité des variantes</h2>
      <div class="row"><span class="note">Jeu :</span>${Object.entries(V.GAMES).map(([k, g]) => [k, g.label]).concat(Object.entries(STUD)).map(([k, l]) => `<button class="chip" aria-pressed="${va.game === k}" data-act="vagame" data-v="${k}">${esc(l)}</button>`).join('')}</div>
      <p class="note">${esc(rules)}</p>
      <div class="form">${va.h.map((x, i) => `<label class="f">Main ${i + 1}${i > 1 ? ' (facultatif)' : ''}<input data-va="${i}" value="${esc(x)}" spellcheck="false" placeholder="${i < 2 ? 'vide = aléatoire' : 'vide = absent'}"></label>`).join('')}<label class="f">${STUD[va.game] ? 'Cartes mortes (vues chez les joueurs couchés)' : 'Board (0, 3, 4 ou 5 cartes)'}<input data-va="board" value="${esc(va.board)}" spellcheck="false"></label></div>
      <div class="row"><button class="btn primary" data-act="varun">Calculer</button></div>${out}
      <p class="note">Modules Avancé « Short Deck, Omaha 5 cartes, Omaha Hi-Lo » et « Stud et Razz ».</p></section>`;
  };
})();
