// Simulateur › Mains de légende : décider à la place du joueur, puis comparer au choix réel et au moteur.
(function () {
  const X = window.__S52, E = window.Engine, LG = window.Legends;
  const { esc, fr, pct, state, Store, render, cardHTML, backHTML, ACT } = X;
  const prog = () => state.progress.legends || (state.progress.legends = {});
  let cur = null; // { id, choice, an }
  const money = (v, unit) => (unit === 'pot' ? `${fr(v, 0)} (unités de pot)` : `${Math.round(v).toLocaleString('fr-FR')} ${unit === '$' ? '$' : 'jetons'}`);
  const cardsOf = (s, sm) => `<div class="cards">${E.parseCards(s).map((c) => cardHTML(c, sm)).join('')}</div>`;
  function listHTML() {
    const P = prog();
    return `<p class="lead">Des coups célèbres et documentés, arrêtés au moment de la décision clé. Décide à la place du joueur, puis compare : son choix réel, et ce qu'en dit le moteur (équité, cote du pot, ICM).</p>
      <div class="modlist">${LG.LEGENDS.map((l) => { const r = P[l.id]; return `<button class="mod${r ? ' done' : ''}" data-act="lgopen" data-id="${l.id}"><span class="n">${r ? '✓' : l.game === 'plo' ? 'PLO' : 'NL'}</span><span><h3>${esc(l.title)}</h3><span class="note">${esc(l.event)} · à la place de ${esc(l.hero)}</span></span><span class="note mono" style="text-align:right">${r ? (r.same ? 'comme le pro' : 'autre choix') + (r.eng === null ? '' : r.eng ? ' · moteur ✓' : ' · moteur ✗') : ''}</span></button>`; }).join('')}</div>`;
  }
  function verdict(l, an, choice) {
    if (l.type === 'bluff') return null;
    const best = an.best; if (!best) return null;
    return best === 'fold' ? choice === 'fold' : choice !== 'fold';
  }
  function engineHTML(l, an) {
    const rows = [];
    if (an.eqActual !== undefined) rows.push(`Équité de ${esc(l.hero)} contre ${l.vill.length > 1 ? 'les mains réelles' : 'la main réelle'} : <strong>${pct(an.eqActual, 1)}</strong>.`);
    if (an.eqRange !== undefined) rows.push(`Contre une range plausible (${an.rangeCombos} combinaisons) : <strong>${pct(an.eqRange, 1)}</strong>. <span class="note">${esc(l.rangeNote || '')}</span>`);
    if (an.need !== undefined) rows.push(`Cote du pot : payer ${money(l.toCall, l.unit)} pour un pot final de ${money(l.pot + l.toCall, l.unit)} demande <strong>${pct(an.need, 1)}</strong> d'équité.`);
    if (an.evCall !== undefined && l.type !== 'icm') rows.push(`EV de payer contre la range : <strong>${an.evCall >= 0 ? '+' : '−'}${money(Math.abs(an.evCall), l.unit)}</strong> → le moteur ${an.best === 'call' ? 'continue' : 'se couche'}.`);
    if (l.type === 'bluff') rows.push(`Checker : la main gagne l'abattage ${pct(an.showdown, 0)} du temps contre cette range. Tapis : il doit se coucher plus de <strong>${pct(an.foldNeeded, 0)}</strong> du temps pour être rentable ; une mise de la moitié du pot exige ${pct(an.foldNeededHalf, 0)} de folds.`);
    if (l.type === 'icm') rows.push(`En jetons, payer ${an.eq3 >= an.need ? 'gagne' : 'perd'} (il faut ${pct(an.need, 0)} d'équité, il a ${pct(an.eq3, 0)} contre les deux mains). En dollars (ICM, 903 turn-river) : se coucher vaut <strong>${(an.icmFold / 1e6).toFixed(2).replace('.', ',')} M$</strong>, payer <strong>${(an.icmCall / 1e6).toFixed(2).replace('.', ',')} M$</strong> → le moteur ${an.best === 'call' ? 'paie' : 'se couche'}.`);
    return `<div class="advice">${rows.map((r) => `<div>${r}</div>`).join('')}</div>`;
  }
  function legendHTML(l) {
    const P = prog(), an = cur.an, ch = cur.choice;
    const vill = l.vill.map((v) => `<div style="display:grid;gap:4px;justify-items:center"><span class="note">${esc(v.name)}</span>${ch === null ? `<div class="cards">${backHTML(true).repeat(l.game === 'plo' ? 4 : 2)}</div>` : cardsOf(v.cards, true)}</div>`).join('');
    const ok = ch !== null ? verdict(l, an, l.options[ch][0]) : null;
    return `<div class="row"><button class="btn small" data-act="lgclose">← Toutes les mains de légende</button><span class="eyebrow">${esc(l.event)}</span></div>
      <section class="panel"><h2>${esc(l.title)}</h2><ol class="note" style="margin:0;padding-left:1.3em;display:grid;gap:4px">${l.story.map((s) => `<li style="color:var(--ink)">${esc(s)}</li>`).join('')}</ol>
        ${l.reconstructed ? `<p class="note">${esc(l.reconstructed)}</p>` : ''}${l.stackNote ? `<p class="note">${esc(l.stackNote)}</p>` : ''}</section>
      <div class="felt" style="display:grid;gap:12px;justify-items:center;padding:16px;border-radius:14px">
        <div class="row" style="gap:28px;justify-content:center"><div style="display:grid;gap:4px;justify-items:center"><span class="note">${esc(l.hero)} (toi)</span>${cardsOf(l.heroCards, true)}</div>${vill}</div>
        <div class="row" style="gap:16px;justify-content:center;align-items:center">${cardsOf(l.board)}<span class="pot" style="font:700 15px var(--f-display)">Pot ${money(l.pot, l.unit)}${l.toCall ? ` · à payer ${money(l.toCall, l.unit)}` : ''}</span></div></div>
      <section class="panel">${ch === null ? `<h2>À ta place : que fais-tu ?</h2><div class="opts">${l.options.map(([, lab], i) => `<button class="opt" data-act="lgans" data-i="${i}">${esc(lab)}</button>`).join('')}</div>`
        : `<div class="row" style="justify-content:space-between"><h2>Tu as choisi : ${esc(l.options[ch][1])}</h2><span class="pill ${ch === l.pro ? 'good' : ''}">${ch === l.pro ? 'Comme ' + esc(l.hero) : esc(l.hero) + ' a choisi : ' + esc(l.options[l.pro][1])}</span></div>
          <p><strong>Le choix réel.</strong> ${esc(l.proText)}</p><p><strong>Le moteur.</strong>${ok === null ? '' : ` <span class="pill ${ok ? 'good' : 'bad'}">${ok ? 'ta décision va dans son sens' : 'ta décision va contre lui'}</span>`}</p>${engineHTML(l, an)}
          <p><strong>Ce qui s'est passé.</strong> ${esc(l.outcome)}${l.riverNote ? ` <span class="note">${esc(l.riverNote)}</span>` : ''}</p>
          <div class="advice"><div class="good"><strong>Leçon :</strong> ${esc(l.lesson)}</div></div>
          <p class="note">Source : <a href="${l.src}" target="_blank" rel="noopener">${esc(new URL(l.src).hostname.replace('www.', ''))}</a>. Range adverse : hypothèse du moteur, pas une information publiée.</p>
          <div class="row"><button class="btn" data-act="lgopen" data-id="${l.id}">Rejouer</button><button class="btn primary" data-act="lgnext">Main de légende suivante</button></div>`}</section>`;
  }
  X.legendsHTML = () => { if (!LG) return ''; const l = cur && LG.LEGENDS.find((x) => x.id === cur.id); return l ? legendHTML(l) : listHTML(); };
  ACT.lgopen = (t) => { const l = LG.LEGENDS.find((x) => x.id === t.dataset.id); cur = { id: l.id, choice: null, an: LG.analyze(l) }; render(); window.scrollTo(0, 0); };
  ACT.lgclose = () => { cur = null; render(); };
  ACT.lgans = (t) => {
    const l = LG.LEGENDS.find((x) => x.id === cur.id); cur.choice = +t.dataset.i;
    const ok = verdict(l, cur.an, l.options[cur.choice][0]); prog()[l.id] = { c: cur.choice, same: cur.choice === l.pro, eng: ok };
    X.award?.('decision', { cats: ['odds'], ok: ok !== false }, true); Store.save('progress'); render();
  };
  ACT.lgnext = () => { const i = LG.LEGENDS.findIndex((x) => x.id === cur.id), l = LG.LEGENDS[(i + 1) % LG.LEGENDS.length]; cur = { id: l.id, choice: null, an: LG.analyze(l) }; render(); window.scrollTo(0, 0); };
})();
