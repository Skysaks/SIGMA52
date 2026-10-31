// Outils (v22) : Cartes du turn (équité exacte de deux ranges pour chaque turn), Dessine la range (mémorisation active des charts,
// note pondérée par les combos), Tournoi : re-entry et add-on (coût et EV attendus d'un tournoi à plusieurs entrées).
(function () {
  const X = window.__S52, R = window.Runout;
  const { E, C, esc, fr, pct, render, grid169, state, Store, TOOLVIEWS, TOOLS, ACT, ONCHANGE } = X;
  TOOLS.push(['runout', 'Cartes du turn'], ['dessin', 'Dessine la range'], ['reentry', 'Re-entry et add-on']);
  const suitCol = (c) => ((c & 3) === 0 ? 'var(--ink)' : `var(--s-${E.SUITS[c & 3]})`), sym = (c) => E.SUIT_SYM[E.SUITS[c & 3]];
  const cs = (c) => E.cardStr(c);
  const prog = () => (state.progress.tools3 ||= { dessin: {} });

  // ================= Cartes du turn =================
  const PRE = [['BTN', 'BB', 'Bouton contre grosse blinde'], ['CO', 'BB', 'Cutoff contre grosse blinde'], ['UTG', 'BB', 'UTG contre grosse blinde'], ['SB', 'BB', 'Petite blinde contre grosse blinde'], ['CO', 'BTN', 'Cutoff contre bouton']];
  const ro = { a: C.RFI.BTN.range, b: C.FACING.BTN.BB.call, flop: '9h8h6c', res: null, err: '', run: 0, done: 0, total: 0, labels: ['Ouverture BTN', 'Défense BB'] };
  const famOf = (flop, c) => R.turnFamily(flop, c);
  function familyRows(flop, turns) {
    const fam = {};
    for (const t of turns) for (const k of famOf(flop, t.card)) { const f = (fam[k] ||= { n: 0, eq: 0, na: 0, nb: 0 }); f.n++; f.eq += t.eqA; f.na += t.nutsA; f.nb += t.nutsB; }
    return Object.entries(fam).sort((x, y) => y[1].eq / y[1].n - x[1].eq / x[1].n);
  }
  TOOLVIEWS.runout = () => {
    const r = ro.res;
    let out = '';
    if (r) {
      const flop = r.flop, d = (t) => t.eqA - r.flopEq, by = r.turns.slice().sort((x, y) => y.eqA - x.eqA);
      const max = Math.max(0.02, ...r.turns.map((t) => Math.abs(d(t))));
      const cell = (t) => { const v = d(t), a = Math.round(Math.min(1, Math.abs(v) / max) * 70); return `<div class="rocell" style="background:color-mix(in srgb, var(${v >= 0 ? '--accent' : '--bad'}) ${a}%, transparent)" title="${cs(t.card)} : ${pct(t.eqA, 1)}"><b style="color:${suitCol(t.card)}">${E.RANKS[t.card >> 2]}${sym(t.card)}</b><span class="mono">${v >= 0 ? '+' : '−'}${fr(Math.abs(v) * 100, 1)}</span></div>`; };
      const rows = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((rk) => `<div class="rorow"><span class="mono note">${E.RANKS[rk]}</span>${[0, 1, 2, 3].map((s) => { const t = r.turns.find((x) => x.card === rk * 4 + s); return t ? cell(t) : '<div class="rocell off"></div>'; }).join('')}</div>`).join('');
      const fam = familyRows(flop, r.turns);
      out = `<div class="stats"><div class="stat hero"><span>Équité au flop · ${esc(ro.labels[0])}</span><b>${pct(r.flopEq, 1)}</b><span>exacte, ${r.turns[0].nA} contre ${r.turns[0].nB} combos</span></div>
        <div class="stat"><span>Meilleur turn pour A</span><b>${cs(by[0].card)}</b><span>${pct(by[0].eqA, 1)}</span></div><div class="stat"><span>Meilleur turn pour B</span><b>${cs(by[by.length - 1].card)}</b><span>A tombe à ${pct(by[by.length - 1].eqA, 1)}</span></div>
        <div class="stat"><span>Écart entre turns</span><b>${fr((by[0].eqA - by[by.length - 1].eqA) * 100, 1)} pts</b><span>${by[0].eqA - by[by.length - 1].eqA < 0.03 ? 'board statique' : by[0].eqA - by[by.length - 1].eqA < 0.06 ? 'board intermédiaire' : 'board dynamique'}</span></div></div>
        <div class="grid2"><section class="panel"><h2>Chaque turn</h2><p class="note">Variation de l'équité de A par rapport au flop, en points : positive, le turn aide A ; négative, il aide B. Plus la teinte est forte, plus l'écart est grand.</p><div class="rogrid">${rows}</div></section>
        <section class="panel"><h2>Par famille de cartes</h2><div class="tw"><table class="t"><thead><tr><th>Famille</th><th class="n">Turns</th><th class="n">Équité A</th><th class="n">Nuts A</th><th class="n">Nuts B</th></tr></thead><tbody>${fam.map(([k, f]) => `<tr><td>${esc(k)}</td><td class="n">${f.n}</td><td class="n">${pct(f.eq / f.n, 1)}</td><td class="n">${pct(f.na / f.n, 0)}</td><td class="n">${pct(f.nb / f.n, 0)}</td></tr>`).join('')}</tbody></table></div>
        <p class="note">Nuts : part des combos de la range au-dessus de 80 % d'équité sur ce turn. Le joueur dont la part de nuts monte peut miser gros ; celui dont l'équité baisse checke plus souvent.</p>
        <h3>Les cinq meilleurs et les cinq pires turns pour A</h3><p class="mono">${by.slice(0, 5).map((t) => cs(t.card) + ' ' + pct(t.eqA, 1)).join(' · ')}</p><p class="mono">${by.slice(-5).reverse().map((t) => cs(t.card) + ' ' + pct(t.eqA, 1)).join(' · ')}</p></section></div>`;
    }
    const busy = ro.run && !r;
    return `<section class="panel"><p class="note">Pour un flop et deux ranges, l'équité exacte de chaque carte du turn (toutes les rivers énumérées) : quelles cartes changent l'avantage, et de combien. C'est la base du choix entre continuer à miser et checker au turn.</p>
      <div class="row">${PRE.map(([a, b, l]) => `<button class="btn small" data-act="ropre" data-a="${a}" data-b="${b}">${esc(l)}</button>`).join('')}</div>
      <div class="form"><label class="f" style="grid-column:1/-1">Range A<input data-ro="a" value="${esc(ro.a)}" spellcheck="false"></label><label class="f" style="grid-column:1/-1">Range B<input data-ro="b" value="${esc(ro.b)}" spellcheck="false"></label><label class="f">Flop (3 cartes)<input id="roflop" data-ro="flop" value="${esc(ro.flop)}" spellcheck="false"></label></div>
      <div class="row"><button class="btn primary" data-act="rogo" ${busy ? 'disabled' : ''}>${busy ? `Calcul… ${ro.done}/${ro.total}` : 'Calculer les 49 turns'}</button><span class="note">Calcul exact, quelques secondes.</span></div>
      ${ro.err ? `<p class="pill bad" style="white-space:normal">${esc(ro.err)}</p>` : ''}${busy ? `<div class="meter"><i style="width:${ro.total ? (ro.done / ro.total) * 100 : 0}%"></i></div>` : ''}</section>${out}`;
  };
  ACT.ropre = (t) => {
    const a = t.dataset.a, b = t.dataset.b, f = C.FACING[a][b];
    ro.a = C.RFI[a].range; ro.b = f.call || f.threebet; ro.labels = ['Ouverture ' + a, (f.call ? 'Call ' : '3-bet ') + b]; ro.res = null; render();
  };
  ACT.rogo = async () => {
    try {
      const flop = E.parseCards(ro.flop); if (flop.length !== 3) throw new Error('Le flop fait 3 cartes, par exemple 9h8h6c.');
      if (new Set(flop).size !== 3) throw new Error('Une carte apparaît deux fois.');
      const A = E.parseRange(ro.a), B = E.parseRange(ro.b); if (!A.size || !B.size) throw new Error('Une des deux ranges est vide.');
      ro.err = ''; ro.res = null; const id = ++ro.run; ro.done = 0; ro.total = 49; render();
      let last = 0;
      const res = await R.turnReport(A, B, flop, (k, n) => { if (id !== ro.run) return; ro.done = k; ro.total = n; const now = Date.now(); if (now - last > 250) { last = now; render(); } });
      if (id !== ro.run) return; ro.res = { ...res, flop }; ro.run = 0; render();
    } catch (e) { ro.err = e.message; ro.res = null; ro.run = 0; render(); }
  };
  ONCHANGE.push((t) => { if (t.dataset.ro) { ro[t.dataset.ro] = t.value; if (t.dataset.ro !== 'flop') ro.labels = ['Range A', 'Range B']; return true; } });

  // ================= Dessine la range =================
  const SITS = [...C.POS.map((p) => ({ k: 'rfi-' + p, t: 'Ouverture ' + p, range: () => C.RFI[p].range }))];
  for (const o of Object.keys(C.FACING)) for (const h of Object.keys(C.FACING[o])) { const f = C.FACING[o][h]; SITS.push({ k: `vs-${o}-${h}`, t: `${h} contre une ouverture ${o} : mains jouées (3-bet ou call)`, range: () => [f.threebet, f.call].filter(Boolean).join(', ') }); }
  const dz = { k: 'rfi-CO', paint: new Set(), done: null };
  const cnt = (set) => [...set].reduce((n, h) => n + E.combos(h).length, 0);
  function score(target, paint) {
    const inter = new Set([...paint].filter((h) => target.has(h))), miss = new Set([...target].filter((h) => !paint.has(h))), extra = new Set([...paint].filter((h) => !target.has(h)));
    const u = cnt(target) + cnt(extra);
    return { inter, miss, extra, pct: u ? cnt(inter) / u : 1, missC: cnt(miss), extraC: cnt(extra) };
  }
  TOOLVIEWS.dessin = () => {
    const s = SITS.find((x) => x.k === dz.k), target = E.parseRange(s.range()), best = prog().dessin[dz.k];
    const sc = dz.done;
    const cell = (h) => {
      if (!sc) return `<button class="rc${dz.paint.has(h) ? ' on' : ''}" data-act="dzcell" data-h="${h}" aria-pressed="${dz.paint.has(h)}" aria-label="${h}">${h}</button>`;
      const k = sc.inter.has(h) ? ' on' : sc.miss.has(h) ? ' dzmiss' : sc.extra.has(h) ? ' dzextra' : '';
      return `<span class="rc${k}" aria-label="${h}${sc.miss.has(h) ? ' oubliée' : sc.extra.has(h) ? ' en trop' : ''}">${h}</span>`;
    };
    return `<section class="panel"><p class="note">Mémorisation active : colorie de mémoire les mains de la chart, puis compare. La note compte les combos (une paire en vaut 6, une main assortie 4, une dépareillée 12) : oublier A-Q dépareillé coûte plus qu'oublier 7-6 assorti.</p>
      <label class="f">Situation<select data-dz="k">${SITS.map((x) => `<option value="${x.k}"${x.k === dz.k ? ' selected' : ''}>${esc(x.t)}${prog().dessin[x.k] != null ? ' · meilleur ' + pct(prog().dessin[x.k], 0) : ''}</option>`).join('')}</select></label>
      <div class="row" style="justify-content:space-between"><h2>${esc(s.t)}</h2><span class="mono">${sc ? `Note ${pct(sc.pct, 0)}` : `${fr(E.rangePct(dz.paint), 1)} % colorié`}${best != null ? ` · meilleur ${pct(best, 0)}` : ''}</span></div>
      ${grid169(cell)}
      ${sc ? `<div class="legend"><span><i style="background:var(--accent)"></i>juste</span><span><i class="dzk dzmiss"></i>oubliée (${sc.missC} combos)</span><span><i class="dzk dzextra"></i>en trop (${sc.extraC} combos)</span></div>
        <div class="advice"><div class="${sc.pct >= 0.9 ? 'good' : sc.pct >= 0.75 ? '' : 'bad'}">${sc.pct >= 0.95 ? 'Chart maîtrisée : passe à la situation suivante ou refais-la dans trois jours.' : sc.pct >= 0.85 ? 'Presque : relis les cases oubliées et en trop, puis refais.' : 'Pas encore : regarde la chart dans Outils › Ranges ou Atlas, puis refais demain. La répétition espacée fixe mieux qu\'une longue séance.'}</div></div>
        <div class="row"><button class="btn primary" data-act="dzagain">Recommencer</button><button class="btn" data-act="dznext">Situation suivante</button></div>`
        : `<div class="row"><button class="btn primary" data-act="dzcheck">Comparer à la chart</button><button class="btn" data-act="dzclear">Effacer</button></div>`}
      <p class="note">Charts de référence de SIGMA 52 (6-max, 100 bb, en ligne), celles de Outils › Ranges et des exercices Spots.</p></section>`;
  };
  ACT.dzcell = (t) => { const h = t.dataset.h; dz.paint.has(h) ? dz.paint.delete(h) : dz.paint.add(h); render(); };
  ACT.dzclear = () => { dz.paint = new Set(); render(); };
  ACT.dzcheck = () => {
    const s = SITS.find((x) => x.k === dz.k); dz.done = score(E.parseRange(s.range()), dz.paint);
    const p = prog(); p.dessin[dz.k] = Math.max(p.dessin[dz.k] ?? 0, dz.done.pct); Store.save('progress'); render();
  };
  ACT.dzagain = () => { dz.paint = new Set(); dz.done = null; render(); };
  ACT.dznext = () => { const i = SITS.findIndex((x) => x.k === dz.k); dz.k = SITS[(i + 1) % SITS.length].k; dz.paint = new Set(); dz.done = null; render(); };
  ONCHANGE.push((t) => { if (t.dataset.dz === 'k') { dz.k = t.value; dz.paint = new Set(); dz.done = null; render(); return true; } });
  X.dessinScore = score;

  // ================= Re-entry et add-on =================
  const re = { buyin: 20, rake: 2, roi: 15, bust: 40, max: 3, stack: 20000, addp: 20, adds: 30000 };
  TOOLVIEWS.reentry = () => {
    const cost = re.buyin + re.rake, roi = re.roi / 100, p = Math.min(0.99, Math.max(0, re.bust / 100));
    const rows = []; for (let k = 1; k <= Math.max(1, Math.min(10, re.max | 0)); k++) { let e = 0; for (let i = 0; i < k; i++) e += Math.pow(p, i); rows.push({ k, e, spend: e * cost, ev: e * cost * roi }); }
    const ratio = re.stack > 0 && re.buyin > 0 && re.addp > 0 ? (re.adds / re.addp) / (re.stack / re.buyin) : 0;
    return `<section class="panel"><p class="note">Un tournoi à re-entry se juge par entrée : si ton ROI par entrée est positif, chaque nouvelle entrée a la même espérance que la première, mais elle multiplie la mise engagée et la variance. Le vrai plafond est ta bankroll, pas l'orgueil.</p>
      <div class="form"><label class="f">Buy-in (€, hors rake)<input type="number" min="0" step="0.5" data-re="buyin" value="${re.buyin}"></label><label class="f">Rake (€)<input type="number" min="0" step="0.1" data-re="rake" value="${re.rake}"></label>
      <label class="f">Ton ROI par entrée (%)<input type="number" step="1" data-re="roi" value="${re.roi}"></label><label class="f">Risque de sortir avant la fin des inscriptions (%)<input type="number" min="0" max="99" step="1" data-re="bust" value="${re.bust}"></label>
      <label class="f">Entrées maximum que tu t'autorises<input type="number" min="1" max="10" step="1" data-re="max" value="${re.max}"></label></div></section>
      <section class="panel"><h2>Ce que coûte et rapporte ta règle</h2><div class="tw"><table class="t"><thead><tr><th>Entrées max</th><th class="n">Entrées en moyenne</th><th class="n">Dépense moyenne</th><th class="n">Gain attendu</th></tr></thead><tbody>${rows.map((x) => `<tr${x.k === (re.max | 0) ? ' style="font-weight:700"' : ''}><td>${x.k}</td><td class="n">${fr(x.e, 2)}</td><td class="n">${fr(x.spend, 2)} €</td><td class="n" style="color:var(${x.ev >= 0 ? '--good' : '--bad'})">${x.ev >= 0 ? '+' : '−'}${fr(Math.abs(x.ev), 2)} €</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Entrées en moyenne = 1 + p + p² + … (p = risque de sortir avant la fin des inscriptions). Gain attendu = dépense × ROI. Hypothèse : le ROI d'une nouvelle entrée est le même que celui de la première ; en pratique, une entrée tardive avec un tapis court rapporte souvent un peu moins, et une entrée sous le coup du tilt beaucoup moins.</p>
      <p>Bankroll : compte la <strong>dépense maximale</strong> (${fr((re.max | 0) * cost, 2)} €) comme le buy-in réel de ce tournoi dans ta règle de bankroll (voir le module Bankroll avancée).</p></section>
      <section class="panel"><h2>Add-on : les jetons sont-ils moins chers ?</h2><div class="form"><label class="f">Tapis de départ<input type="number" min="0" data-re="stack" value="${re.stack}"></label><label class="f">Prix de l'add-on (€)<input type="number" min="0" step="0.5" data-re="addp" value="${re.addp}"></label><label class="f">Jetons de l'add-on<input type="number" min="0" data-re="adds" value="${re.adds}"></label></div>
      <p>Jetons par euro : inscription <b>${fr(re.buyin > 0 ? re.stack / re.buyin : 0, 0)}</b>, add-on <b>${fr(re.addp > 0 ? re.adds / re.addp : 0, 0)}</b>, soit un rapport de <b>${fr(ratio, 2)}</b>.</p>
      <div class="advice"><div class="${ratio >= 1 && roi > -0.2 ? 'good' : ''}">${ratio >= 1 ? 'L\'add-on te vend les jetons moins cher que l\'inscription (ou au même prix) : prends-le dès que tu es gagnant dans ce tournoi, surtout avec un tapis court ou moyen. Avec un très gros tapis, un jeton supplémentaire vaut un peu moins (ICM), mais le prix reste en général bon.' : 'L\'add-on vend les jetons plus cher que l\'inscription : il ne se justifie qu\'avec un ROI élevé et un tapis court, où chaque jeton compte davantage.'}</div></div></section>`;
  };
  ONCHANGE.push((t) => { if (t.dataset.re) { const v = parseFloat(String(t.value).replace(',', '.')); re[t.dataset.re] = Number.isFinite(v) ? v : 0; render(); return true; } });
})();
