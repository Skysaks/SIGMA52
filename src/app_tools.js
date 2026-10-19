// Outils ajoutés : Calculs (MDF, géométrique, SPR, cotes implicites, rake), Bloqueurs (effet de tes cartes sur une range),
// PKO (valeur d'une prime et range de call avec et sans prime).
(function () {
  const X = window.__S52;
  const { E, C, SV, B, $, esc, fr, pct, render, grid169, cardsHTML, TOOLVIEWS, TOOLS, ACT, ONCHANGE } = X;
  const num = (v) => +String(v).replace(',', '.').replace(/\s/g, '');
  TOOLS.push(['maths', 'Calculs'], ['bloq', 'Bloqueurs'], ['pko', 'PKO'], ['omaha', 'Omaha'], ['probas', 'Probabilités'], ['partie', 'Partie maison']);

  // ---------------- Calculs ----------------
  const mt = { P: '100', B: '75', gP: '20', gS: '50', gN: '2', sP: '6', sS: '97', iP: '30', iC: '10', iE: '0.2', rPots: '25', rRake: '0.5', rWr: '6' };
  ONCHANGE.push((t) => { if (t.dataset.mt) { mt[t.dataset.mt] = t.value; render(); return true; } });
  const inp = (k, label, w = '') => `<label class="f"${w}>${label}<input inputmode="decimal" data-mt="${k}" value="${esc(mt[k])}"></label>`;
  TOOLVIEWS.maths = () => {
    const P = num(mt.P), Bt = num(mt.B), ok1 = P > 0 && Bt > 0;
    const geoP = num(mt.gP), geoS = num(mt.gS), n = Math.max(1, Math.min(4, Math.round(num(mt.gN)))), f = geoP > 0 && geoS > 0 ? (Math.pow(1 + 2 * geoS / geoP, 1 / n) - 1) / 2 : NaN;
    let geoRows = ''; if (isFinite(f)) { let pot = geoP; for (let k = 1; k <= n; k++) { const b = pot * f; geoRows += `<tr><td>Rue ${k}</td><td class="n mono">${fr(b, 1)} bb</td><td class="n mono">${fr(pot + 2 * b, 1)} bb</td></tr>`; pot += 2 * b; } }
    const spr = num(mt.sS) / num(mt.sP);
    const iP = num(mt.iP), iC = num(mt.iC), iE = num(mt.iE) > 1 ? num(mt.iE) / 100 : num(mt.iE), impl = iC / iE - iP - iC;
    const rLoss = num(mt.rPots) * num(mt.rRake);
    return `<section class="panel"><h2>Mise, défense et bluffs</h2><div class="form">${inp('P', 'Pot (avant la mise)')}${inp('B', 'Mise')}</div>
      ${ok1 ? `<div class="stats"><div class="stat hero"><span>Équité requise pour payer</span><b>${pct(Bt / (P + 2 * Bt), 1)}</b><span>B ÷ (P + 2B)</span></div>
        <div class="stat"><span>Défense minimale (MDF)</span><b>${pct(P / (P + Bt), 1)}</b><span>P ÷ (P + B)</span></div>
        <div class="stat"><span>Alpha (bluff pur rentable si couchers ≥)</span><b>${pct(Bt / (P + Bt), 1)}</b><span>B ÷ (P + B)</span></div>
        <div class="stat"><span>River équilibrée</span><b>${fr((P + Bt) / Bt, 2)} : 1</b><span>valeur : bluff, soit ${pct(Bt / (P + 2 * Bt), 1)} de bluffs</span></div></div>` : '<p class="note">Saisis un pot et une mise positifs.</p>'}
      <p class="note">Module Élite « Défense minimale ». La MDF protège contre un bluffeur parfait ; contre une population qui sous-bluffe, couche davantage.</p></section>
      <section class="panel"><h2>Taille géométrique</h2><p class="note">Mise identique (en % du pot) à chaque rue pour être à tapis à la dernière.</p><div class="form">${inp('gP', 'Pot actuel')}${inp('gS', 'Tapis effectif')}${inp('gN', 'Nombre de rues (1 à 4)')}</div>
      ${isFinite(f) ? `<p><strong>${fr(f * 100, 0)} % du pot</strong> à chaque rue.</p><div class="tw"><table class="t"><thead><tr><th>Rue</th><th class="n">Mise</th><th class="n">Pot après call</th></tr></thead><tbody>${geoRows}</tbody></table></div>` : ''}</section>
      <section class="panel"><h2>SPR</h2><div class="form">${inp('sP', 'Pot au flop')}${inp('sS', 'Tapis effectif derrière')}</div>
      ${isFinite(spr) && spr > 0 ? `<p>SPR = <strong>${fr(spr, 1)}</strong>. ${spr < 2 ? 'Très bas : top paire et surpaires vont à tapis.' : spr < 6 ? 'Bas : top paire bon kicker et surpaires peuvent s\'engager.' : spr < 15 ? 'Moyen : deux paires et mieux pour un tapis, surpaires selon l\'adversaire.' : 'Élevé : réserve le tapis aux brelans et mieux ; top paire contrôle le pot.'}</p>` : ''}</section>
      <section class="panel"><h2>Cotes implicites</h2><p class="note">Combien tu dois gagner en plus, en moyenne, quand tu touches, pour que le call soit rentable.</p><div class="form">${inp('iP', 'Pot (mise adverse comprise)')}${inp('iC', 'Mise à payer')}${inp('iE', 'Équité (0,2 ou 20 %)')}</div>
      ${iE > 0 && iC > 0 ? `<p>${impl <= 0 ? `<strong>Call rentable directement</strong> : les cotes du pot suffisent (il te faut ${pct(iC / (iP + iC), 1)} d'équité).` : `Il faut gagner en moyenne <strong>${fr(impl, 1)}</strong> de plus quand tu touches. Vérifie que les tapis et l'adversaire le permettent.`}</p>` : ''}</section>
      <section class="panel"><h2>Coût du rake</h2><div class="form">${inp('rPots', 'Pots gagnés par 100 mains')}${inp('rRake', 'Rake moyen par pot gagné (bb)')}${inp('rWr', 'Winrate avant rake (bb/100)')}</div>
      ${isFinite(rLoss) ? `<p>Le rake te coûte <strong>${fr(rLoss, 1)} bb/100</strong> ; winrate après rake : <strong>${fr(num(mt.rWr) - rLoss, 1)} bb/100</strong>. Ajoute ton rakeback éventuel. En live, utilise le prélèvement réel par pot et le pourboire.</p>` : ''}</section>`;
  };

  // ---------------- Bloqueurs ----------------
  const bq = { range: C.FACING.BTN.BB.call + ', ' + C.FACING.BTN.BB.threebet, board: 'Ah9h4c', hero: 'Kh5d', err: '' };
  ONCHANGE.push((t) => { if (t.dataset.bq) { bq[t.dataset.bq] = t.value; render(); return true; } });
  TOOLVIEWS.bloq = () => {
    let out = '';
    try {
      const board = E.parseCards(bq.board), hero = E.parseCards(bq.hero);
      if (board.length < 3 || board.length > 5) throw new Error('Le board fait 3 à 5 cartes.');
      if (hero.length !== 2) throw new Error('Ta main fait 2 cartes.');
      if (new Set([...board, ...hero]).size !== board.length + 2) throw new Error('Une carte apparaît deux fois.');
      const set = E.parseRange(bq.range), a = B.analyze(set, board), b = B.analyze(set, board, hero);
      const rows = B.MADE.map((l, k) => [l, a.made[k], b.made[k]]).filter((x) => x[1]).map(([l, x, y]) => `<tr><td>${l}</td><td class="n mono">${x}</td><td class="n mono">${y}</td><td class="n mono">${y - x ? (y - x) : '·'}</td><td class="n mono">${pct(y / b.total, 1)}</td></tr>`).join('');
      const drows = B.DRAWS.map((l, k) => [l, a.draws[k], b.draws[k]]).filter((x) => x[1]).map(([l, x, y]) => `<tr><td>${l}</td><td class="n mono">${x}</td><td class="n mono">${y}</td><td class="n mono">${y - x ? (y - x) : '·'}</td><td class="n mono">${pct(y / b.total, 1)}</td></tr>`).join('');
      out = `<div class="felt"><div class="row" style="justify-content:center;gap:16px">${cardsHTML(board)}<span>Ta main</span>${cardsHTML(hero, true)}</div></div>
        <div class="stats"><div class="stat hero"><span>Combos adverses</span><b>${b.total}</b><span>${a.total} sans tes cartes (${a.total - b.total} bloqués)</span></div></div>
        <div class="tw"><table class="t"><thead><tr><th>Catégorie</th><th class="n">Sans tes cartes</th><th class="n">Avec</th><th class="n">Écart</th><th class="n">Part</th></tr></thead><tbody>${rows}</tbody></table></div>
        ${drows ? `<h3>Tirages</h3><div class="tw"><table class="t"><thead><tr><th>Tirage</th><th class="n">Sans</th><th class="n">Avec</th><th class="n">Écart</th><th class="n">Part</th></tr></thead><tbody>${drows}</tbody></table></div>` : ''}
        <p class="note">Bon bluff : tes cartes retirent des combos qui paient (paires, mains faites) et laissent ceux qui couchent (tirages ratés, rien). Bon bluff-catcher : l'inverse, elles retirent de la valeur et laissent les bluffs.</p>`;
    } catch (e) { out = `<p class="pill bad" style="white-space:normal">${esc(e.message)}</p>`; }
    return `<section class="panel"><p class="note">Effet de tes deux cartes sur la range adverse : combos retirés par catégorie. Module Élite « Combinatoire et bloqueurs ».</p>
      <div class="form"><label class="f" style="grid-column:1/-1">Range adverse<input data-bq="range" value="${esc(bq.range)}" spellcheck="false"></label><label class="f">Board<input data-bq="board" value="${esc(bq.board)}" spellcheck="false"></label><label class="f">Ta main<input data-bq="hero" value="${esc(bq.hero)}" spellcheck="false"></label></div></section>
      <section class="panel">${out}</section>`;
  };

  // ---------------- PKO ----------------
  const pk = { S0: '10000', share: '50', field: '50', mult: '1', bb: '200', shove: '2800', range: '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 98s, A7o+, KTo+, QJo' };
  ONCHANGE.push((t) => { if (t.dataset.pk) { pk[t.dataset.pk] = t.value; render(); return true; } });
  ACT.pkcell = (t) => { const d = $('#pkdetail'); if (d) d.textContent = t.title; };
  TOOLVIEWS.pko = () => {
    const S0 = num(pk.S0), share = num(pk.share) / 100, f = Math.max(0.001, Math.min(1, num(pk.field) / 100)), m = num(pk.mult), bb = num(pk.bb), shove = num(pk.shove);
    const prime = S0 * share / (1 + Math.sqrt(f)) * m; // modèle pratique : 25 % du tapis de départ au début (part prime 50 %), tend vers 50 %
    const dead = bb * 0.5 + bb, call = Math.max(0, shove - bb), need = call / (call + shove + dead + prime), needNo = call / (call + shove + dead);
    let grid = '', err = '';
    try {
      const set = E.parseRange(pk.range), fq = SV.setToFreq(set);
      const eq = E.ALL169.map((h, i) => SV.eqVsRange(i, fq));
      const nCall = (th) => E.ALL169.reduce((a, h, i) => a + (eq[i] >= th ? E.combos(h).length : 0), 0) / 1326 * 100;
      grid = `<div class="stats"><div class="stat hero"><span>Range de call avec la prime</span><b>${fr(nCall(need), 0)} %</b><span>des mains (équité ≥ ${pct(need, 1)})</span></div><div class="stat"><span>Sans la prime</span><b>${fr(nCall(needNo), 0)} %</b><span>équité ≥ ${pct(needNo, 1)}</span></div></div>
        ${grid169((h, i) => { const e = eq[i], c = e >= needNo ? 'var(--act-x)' : e >= need ? 'var(--act-b2)' : ''; return `<button class="rc${c ? ' sv' : ''}" data-act="pkcell" title="${h} : ${pct(e, 1)} d'équité contre sa range" ${c ? `style="background:${c}"` : ''}>${h}</button>`; })}
        <div class="legend"><span><i style="background:var(--act-x)"></i>Call même sans prime</span><span><i style="background:var(--act-b2)"></i>Call grâce à la prime</span></div><p class="note" id="pkdetail">Touche une case pour voir son équité.</p>`;
    } catch (e) { err = e.message; }
    return `<section class="panel"><p class="note">Valeur en jetons de la prime encaissée immédiatement (modèle pratique publié par PokerListings : environ 25 % du tapis de départ en début de PKO standard, jusqu'à 50 % en fin de tournoi), puis équité requise pour payer un tapis d'un joueur que tu couvres. Module Élite « Tournois avancés ».</p>
      <div class="form"><label class="f">Tapis de départ<input data-pk="S0" value="${esc(pk.S0)}" inputmode="numeric"></label><label class="f">Part du buy-in en primes (%)<input data-pk="share" value="${esc(pk.share)}" inputmode="numeric"></label>
      <label class="f">Joueurs restants (% du champ)<input data-pk="field" value="${esc(pk.field)}" inputmode="decimal"></label><label class="f">Sa prime ÷ prime moyenne<input data-pk="mult" value="${esc(pk.mult)}" inputmode="decimal"></label>
      <label class="f">Grosse blinde (ante de BB égale)<input data-pk="bb" value="${esc(pk.bb)}" inputmode="numeric"></label><label class="f">Son tapis poussé<input data-pk="shove" value="${esc(pk.shove)}" inputmode="numeric"></label>
      <label class="f" style="grid-column:1/-1">Sa range de tapis<input data-pk="range" value="${esc(pk.range)}" spellcheck="false"></label></div></section>
      <section class="panel"><div class="stats"><div class="stat hero"><span>Prime encaissable</span><b>${fr(prime, 0)}</b><span>jetons (${fr(prime / S0 * 100, 1)} % du tapis de départ)</span></div>
        <div class="stat"><span>Équité requise avec prime</span><b>${pct(need, 1)}</b><span>${fr(call, 0)} à payer</span></div><div class="stat"><span>Sans prime</span><b>${pct(needNo, 1)}</b><span>calcul en jetons classique</span></div></div>
        ${err ? `<p class="pill bad">${esc(err)}</p>` : grid}<p class="note">Tu es en grosse blinde et tu couvres le tapis adverse. Calcul en jetons : sur la bulle ou en table finale, ajoute la prime de risque ICM.</p></section>`;
  };
  // ---------------- Omaha (PLO) ----------------
  const om = { h: ['AsAhKsKh', 'JdTd9c8c', '', ''], board: '', res: null, pot: '10', call: '0' };
  ONCHANGE.push((t) => { if (t.dataset.om !== undefined) { const k = t.dataset.om; if (k === 'board' || k === 'pot' || k === 'call') om[k] = t.value; else om.h[+k] = t.value; om.res = null; render(); return true; } });
  ACT.omrun = () => {
    try {
      const hands = om.h.map((x) => x.trim()).filter((x, i) => x || i < 2).map((x) => (x === '' || /^(\?|x|aléatoire|random)$/i.test(x) ? null : E.parseCards(x)));
      const board = E.parseCards(om.board);
      if (hands.some((h) => h && h.length !== 4)) throw new Error('Chaque main d\'Omaha fait 4 cartes (ou laisse vide pour une main aléatoire).');
      if (![0, 3, 4, 5].includes(board.length)) throw new Error('Le board fait 0, 3, 4 ou 5 cartes.');
      const all = [...board, ...hands.flat().filter((c) => c !== null && c !== undefined)];
      if (new Set(all).size !== all.length) throw new Error('Une carte apparaît deux fois.');
      const t0 = performance.now(), r = window.Omaha.equity(hands, board, { iterations: 8000 });
      om.res = { hands, board, r, ms: Math.round(performance.now() - t0) };
    } catch (e) { om.res = { err: e.message }; }
    render();
  };
  ACT.omex = (t) => { const ex = { a: ['AsAhKsKh', 'JdTd9c8c', '', '', ''], b: ['AsAd7c2h', 'JhTh9c8c', '', '', ''], c: ['KsKd4c2h', 'AhQh8c3s', '', '', 'Kh7h2s'], d: ['AsKsJhTh', '', '', '', ''] }[t.dataset.v]; om.h = ex.slice(0, 4); om.board = ex[4]; ACT.omrun(); };
  const omHand = (h) => `<span class="omh mono">${h.map((c) => { const k = E.cardStr(c); return `<b>${k[0] === 'T' ? '10' : k[0]}</b><i class="su-${k[1]}">${E.SUIT_SYM[k[1]]}</i>`; }).join('')}</span>`;
  TOOLVIEWS.omaha = () => {
    const O = window.Omaha, r = om.res;
    let out = '<p class="note">Saisis au moins deux mains (4 cartes chacune, ex. AsAhKsKh) ou laisse un champ vide pour une main aléatoire, puis Calculer.</p>';
    if (r?.err) out = `<p class="pill bad" style="white-space:normal">${esc(r.err)}</p>`;
    else if (r) out = `${r.board.length ? `<div class="felt"><div class="row" style="justify-content:center">${cardsHTML(r.board)}</div></div>` : ''}<div class="tw"><table class="t"><thead><tr><th>Main</th><th>Profil</th><th class="n">Équité</th><th class="n">Gagne</th><th class="n">Partage</th></tr></thead><tbody>${r.hands.map((h, i) => `<tr><td>${h ? omHand(h) : '<span class="note">aléatoire</span>'}</td><td class="note">${h ? esc(O.describe(h).tags.join(', ')) : ''}</td><td class="n mono"><b>${pct(r.r.equity[i], 1)}</b></td><td class="n mono">${pct(r.r.win[i], 1)}</td><td class="n mono">${pct(r.r.tie[i], 1)}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">${r.r.exact ? 'Calcul exact' : `${fr(r.r.samples, 0)} tirages (Monte-Carlo, ± 1 point environ)`} · ${r.ms} ms. Règle d'Omaha : exactement 2 cartes de ta main et 3 du board.</p>`;
    const potN = num(om.pot), callN = num(om.call), pr = O.potRaise(potN, callN);
    return `<section class="panel"><h2>Équité Omaha (PLO)</h2>
      <div class="form">${om.h.map((x, i) => `<label class="f">Main ${i + 1}${i > 1 ? ' (facultatif)' : ''}<input data-om="${i}" value="${esc(x)}" spellcheck="false" placeholder="${i < 2 ? 'vide = aléatoire' : 'vide = absent'}"></label>`).join('')}<label class="f">Board (0, 3, 4 ou 5 cartes)<input data-om="board" value="${esc(om.board)}" spellcheck="false"></label></div>
      <div class="row"><button class="btn primary" data-act="omrun">Calculer</button><span class="note">Exemples :</span><button class="btn small" data-act="omex" data-v="a">AAKK ds contre JT98 ds</button><button class="btn small" data-act="omex" data-v="b">AA sèche contre JT98</button><button class="btn small" data-act="omex" data-v="c">Brelan contre tirage max</button><button class="btn small" data-act="omex" data-v="d">KQJT contre aléatoire</button></div>
      ${out}</section>
      <section class="panel"><h2>Relance maximale (pot-limit)</h2><div class="form"><label class="f">Pot (mises de la rue comprises)<input inputmode="decimal" data-om="pot" value="${esc(om.pot)}"></label><label class="f">À payer<input inputmode="decimal" data-om="call" value="${esc(om.call)}"></label></div>
      ${isFinite(pr) && potN > 0 ? `<p>${callN > 0 ? `Relance maximale : <strong>${fr(pr, 1)}</strong> au total sur cette rue. Méthode du croupier : tu suis (${fr(callN, 1)}), le pot devient ${fr(potN + callN, 1)}, tu relances de ce montant.` : `Mise maximale : <strong>${fr(pr, 1)}</strong>, la taille du pot.`}</p>` : ''}
      <p class="note">Module Avancé « Omaha pot-limit : les bases ».</p></section>`;
  };

  // ---------------- Probabilités de référence ----------------
  // Valeurs exactes (combinatoire) ou mesurées sur 200 000 tirages par le moteur SIGMA 52 (marquées ≈).
  const PROBAS = [
    ['Préflop', [['Recevoir une paire', '5,9 %', '3 ÷ 51'], ['Recevoir une paire donnée (ex. AA)', '0,45 %', '1 fois sur 221'], ['Recevoir deux cartes assorties', '23,5 %', '12 ÷ 51'], ['Recevoir AK (assorti ou non)', '1,2 %', '16 ÷ 1 326'], ['Tu as KK : un adversaire précis a AA', '0,49 %', '6 ÷ 1 225 ; ≈ 3,9 % qu\'un des 8 adversaires l\'ait']]],
    ['Flop', [['Paire en main → brelan ou mieux au flop', '11,8 %', '1 fois sur 8,5'], ['Deux cartes différentes → au moins une paire avec une des deux', '32,4 %', '1 − C(44,3) ÷ C(50,3)'], ['Mains assorties → couleur faite au flop', '0,84 %', ''], ['Mains assorties → tirage couleur au flop', '10,9 %', ''], ['Mains assorties → couleur à la river', '6,4 %', 'en voyant les 5 cartes']]],
    ['Tirages (du flop)', [['Tirage couleur, 9 outs', '35,0 %', 'turn + river ; 19,1 % sur une carte'], ['Suite deux bouts, 8 outs', '31,5 %', '17,0 % sur une carte'], ['Ventrale, 4 outs', '16,5 %', '8,5 % sur une carte'], ['Couleur + deux bouts, 15 outs', '54,1 %', '31,9 % sur une carte'], ['Deux overcards, 6 outs', '24,1 %', '12,8 % sur une carte']]],
    ['Board final (5 cartes)', [['Trois cartes ou plus d\'une même couleur (couleur possible)', '37,1 %', ''], ['Au moins une paire sur le board', '49,3 %', '']]],
    ['Affrontements préflop (≈)', [['AA contre KK', '82 %', ''], ['KK contre AKo', '70 %', ''], ['QQ contre AKo', '57 %', 'le « coin flip »'], ['22 contre AKo', '53 %', ''], ['AKo contre AQo', '74 %', 'main dominée'], ['AKo contre 72o', '67 %', ''], ['JTs contre AA', '22 %', '']]],
  ];
  TOOLVIEWS.probas = () => `<section class="panel"><h2>Probabilités à connaître</h2><p class="note">Le minimum à savoir par cœur pour décider vite. Valeurs exactes, sauf les affrontements (≈, mesurés sur 200 000 tirages).</p>
    ${PROBAS.map(([h, rows]) => `<h3>${h}</h3><div class="tw"><table class="t"><tbody>${rows.map(([a, b, c]) => `<tr><td>${a}</td><td class="n mono"><b>${b}</b></td><td class="note">${c}</td></tr>`).join('')}</tbody></table></div>`).join('')}
    <div class="warnbox"><strong>Règle des 2 et 4</strong> : outs × 4 ≈ % de toucher du flop à la river (si tu vois les deux cartes), outs × 2 ≈ % pour une seule carte. Au-delà de 8 outs sur deux cartes, retire (outs − 8) pour corriger : 15 outs → 60 − 7 = 53 %.</div></section>`;

  // ---------------- Partie maison : structure, jetons, places ----------------
  TOOLVIEWS.partie = () => `<section class="panel"><h2>Organiser une partie entre amis</h2><p>Structure des blindes, répartition des jetons selon ton stock et répartition des places sont dans <strong>Jouer › Table live › Préparer la partie</strong>, avec le minuteur de blindes plein écran.</p><div class="row"><button class="btn primary" data-act="golivprep">Ouvrir la préparation</button></div></section>`;
  ACT.golivprep = () => { if (X.liveState) X.liveState.sub = 'prep'; X.go('live'); };
})();
