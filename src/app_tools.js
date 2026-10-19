// Outils ajoutés : Calculs (MDF, géométrique, SPR, cotes implicites, rake), Bloqueurs (effet de tes cartes sur une range),
// PKO (valeur d'une prime et range de call avec et sans prime).
(function () {
  const X = window.__S52;
  const { E, C, SV, B, $, esc, fr, pct, render, grid169, cardsHTML, TOOLVIEWS, TOOLS, ACT, ONCHANGE } = X;
  const num = (v) => +String(v).replace(',', '.').replace(/\s/g, '');
  TOOLS.push(['maths', 'Calculs'], ['bloq', 'Bloqueurs'], ['pko', 'PKO']);

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
})();
