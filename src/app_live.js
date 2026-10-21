// Onglet Table live v2 : pour les parties amicales où tous les joueurs sont d'accord (jetons, sans argent).
// Décision éclair (hold'em, Omaha, bomb pot ; tables de 2 à 10 ; straddle, ante, tournoi ICM), EV de chaque option, range adverse,
// joueurs de la table (stats et type automatique), soirée (journal des décisions, export, renvoi au solveur), entraînement chronométré,
// mode discret et vibration, minuteur de blindes lié à la décision, préparation de la partie.
(function () {
  const X = window.__S52, L = window.Live, PF = window.Postflop;
  const { E, C, $, esc, fr, pct, render, head, VIEWS, ACT, ONCHANGE, ONKEY, cardHTML, grid169 } = X;
  const ls = { get: (k, d) => { try { const v = localStorage.getItem('sigma52.live.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('sigma52.live.' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } } };
  const cfg0 = { game: 'nlh', players: 6, straddle: false, ante: false, icm: false, input: window.innerWidth > 720 ? 'grid' : 'rs', vibrate: false, linkTimer: true };
  const lv = {
    sub: 'decision', consent: ls.get('consent', false), discret: false,
    cfg: { ...cfg0, ...ls.get('cfg', {}) }, showCfg: false,
    cards: Array(10).fill(null), slot: 0, rank: null,
    pos: 'BTN', nOpp: 1, type: 'normal', pre: 'open', limpers: 1, raiseBB: 3, callers: 1, vpre: 'call', raised: false, ip: null,
    hist: { flop: '', turn: '' }, villain: null,
    bb: ls.get('bb', 100), pot: '', toCall: '', stack: '', res: null, ms: 0, showRange: false,
    players: ls.get('players', []), log: ls.get('log', []),
    st: ls.get('st', { stack: 10000, players: 6, hours: 3, levelMin: 15, smallChip: 25 }), levels: null,
    ch: ls.get('ch', { stack: 10000, players: 6, denoms: [25, 100, 500, 1000, '', ''], counts: ['', '', '', '', '', ''] }), places: 6,
    timer: { i: 0, left: null, running: false, last: 0, used: false }, wake: null,
    drill: null, drillBest: ls.get('drillBest', 0),
  };
  lv.levels = L.structure(lv.st);
  const RK = 'AKQJT98765432'.split(''), SU = [['s', '♠'], ['h', '♥'], ['d', '♦'], ['c', '♣']];
  const saveCfg = () => ls.set('cfg', lv.cfg);
  const nHole = () => ({ plo: 4, plo8: 4, plo5: 5 }[lv.cfg.game] || 2);
  const hero = () => lv.cards.slice(0, nHole()).filter((c) => c !== null);
  const boardRaw = () => lv.cards.slice(nHole(), nHole() + 5).filter((c) => c !== null);
  const num = (v) => +String(v).replace(',', '.').replace(/\s/g, '') || 0;
  const POSL = () => L.positions(lv.cfg.players);
  const bbNow = () => (lv.cfg.linkTimer && lv.timer.used ? lvl(lv.timer.i).bb : num(lv.bb) || 1);
  const STREET = (b) => ['', '', '', 'flop', 'turn', 'river'][b];
  // Historique adverse des rues passées : codes -> actions du modèle
  const HIST = { x: ['Check, check', [{ a: 'check' }]], b: ['Il mise, je paie', [{ a: 'bet', size: 0.6 }]], c: ['Je mise, il paie', [{ a: 'call', size: 0.6 }]], xc: ['Il check, je mise, il paie', [{ a: 'check' }, { a: 'call', size: 0.6 }]], r: ['Il relance, je paie', [{ a: 'raise', size: 0.6 }]] };
  function history() {
    const b = boardRaw().length, out = [];
    for (const st of ['flop', 'turn']) { if ((st === 'flop' && b >= 4) || (st === 'turn' && b >= 5)) { const h = HIST[lv.hist[st]]; if (h) h[1].forEach((x) => out.push({ street: st, ...x })); } }
    return out;
  }
  function icmInput() {
    if (!lv.cfg.icm) return null;
    const me = num(lv.stack), others = lv.players.filter((p) => p.on !== false && num(p.stack) > 0).map((p) => num(p.stack));
    if (!me || others.length < 2) return null;
    const vi = lv.villain !== null && lv.players[lv.villain] && num(lv.players[lv.villain].stack) ? 1 + lv.players.filter((p) => p.on !== false && num(p.stack) > 0).indexOf(lv.players[lv.villain]) : 1;
    return { stacks: [me, ...others], payouts: L.payouts(others.length + 1), villain: Math.max(1, vi) };
  }
  function compute() {
    const h = hero(); lv.res = null;
    if (h.length !== nHole()) return;
    const b = boardRaw(); if (b.length && b.length < 3) return;
    const t0 = performance.now();
    try {
      const bb = bbNow();
      lv.res = L.decide({ game: lv.cfg.game, hero: h, board: b, players: lv.cfg.players, pos: lv.pos, nOpp: lv.nOpp, type: lv.type, pre: lv.pre, limpers: lv.limpers, raiseBB: lv.raiseBB, callers: lv.callers,
        straddle: lv.cfg.straddle, ante: lv.cfg.ante, stackBB: lv.stack ? num(lv.stack) / Math.max(1e-9, bb) : 100, live: true, pot: num(lv.pot), toCall: num(lv.toCall), stack: num(lv.stack),
        vpre: lv.vpre, raised: lv.raised, ip: lv.ip === null ? undefined : lv.ip, history: history(), icm: icmInput() });
    } catch (e) { lv.res = { action: '?', tone: 'warn', lines: [e.message] }; }
    lv.ms = performance.now() - t0;
    if (lv.res && lv.cfg.vibrate && navigator.vibrate && lv.res.action !== lv.lastVib) { lv.lastVib = lv.res.action; navigator.vibrate({ COUCHE: [400], CHECK: [80], SUIS: [80], MISE: [80, 120, 80], RELANCE: [80, 120, 80], TAPIS: [80, 100, 80, 100, 80] }[lv.res.action] || 0); }
  }

  // ---------------- Vue ----------------
  const SUBS = [['decision', 'Décision éclair'], ['table', 'Joueurs'], ['soiree', 'Soirée'], ['drill', 'Entraînement'], ['timer', 'Minuteur'], ['prep', 'Préparer']];
  VIEWS.live = () => {
    if (!lv.consent) return head('Table live', 'Pour tes parties amicales.') + `<section class="panel"><h2>Avant d'utiliser la Table live</h2>
      <p>Cet outil aide à décider pendant une <strong>partie amicale où tous les joueurs savent qu'il est utilisé et sont d'accord</strong> (jetons, sans argent, ou outil partagé par toute la table).</p>
      <p>Il est <strong>interdit</strong> au casino, en club et en ligne : c'est de l'aide en temps réel, sanctionnée par exclusion, fermeture de compte et confiscation des gains.</p>
      <div class="row"><button class="btn primary" data-act="lvok">Partie amicale, tout le monde est d'accord</button></div></section>`;
    return (lv.discret ? '' : head('Table live', 'Parties amicales, joueurs d\'accord. Décision en quelques touches avec EV de chaque option, range adverse, joueurs de la table, soirée, entraînement, minuteur.') +
      `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${lv.sub === k}" data-act="lvsub" data-s="${k}">${l}</button>`).join('')}</div>`) +
      ({ decision: decisionHTML, table: playersHTML, soiree: soireeHTML, drill: drillHTML, timer: timerHTML, prep: prepHTML }[lv.sub] || decisionHTML)();
  };
  ACT.lvok = () => { lv.consent = true; ls.set('consent', true); render(); };
  ACT.lvsub = (t) => { lv.sub = t.dataset.s; render(); };

  function slotHTML(i, label) {
    const c = lv.cards[i];
    return `<button class="lslot${lv.slot === i ? ' on' : ''}${c !== null ? ' full' : ''}" data-act="lvslot" data-i="${i}" aria-label="${label}${c !== null ? ' : ' + E.cardStr(c) : ''}">${c !== null ? cardHTML(c, true) : `<span>${label}</span>`}</button>`;
  }
  const evTxt = (v, unit) => (unit === 'jetons' ? (v >= 0 ? '+' : '−') + fr(Math.abs(v), 1) : (v >= 0 ? '+' : '−') + fr(Math.abs(v), 1) + ' %');
  function resultHTML() {
    const r = lv.res;
    if (!r) {
      const hn = hero().length, bn = boardRaw().length;
      return `<div class="lres idle"><b>${hn < nHole() ? 'Entre ta main' : bn && bn < 3 ? 'Complète le flop' : '…'}</b><span>${hn < nHole() ? (lv.cfg.input === 'grid' ? 'Touche tes cartes dans la grille.' : 'Touche une valeur puis une couleur.') : 'Trois cartes de flop, puis turn et river.'}</span></div>`;
    }
    const bar = r.eq !== undefined && r.eq !== null ? `<div class="leq"><i style="width:${Math.round(r.eq * 100)}%"></i>${r.need ? `<em style="left:${Math.round(r.need * 100)}%"></em>` : ''}</div><span class="note mono">Équité ${pct(r.eq, 0)}${r.need ? ` · requise ${pct(r.need, 0)}` : ''}${r.spr ? ` · SPR ${fr(r.spr, 1)}` : ''}${r.combos ? ` · ${r.combos} combos` : ''}</span>` : '';
    const opts = !lv.discret && r.options && r.options.length > 1 ? `<div class="lopts">${r.options.slice(0, 6).map((o, i) => `<span class="lopt${o.act === r.action && (o.size === r.size || i === 0) ? ' best' : ''}"><b>${esc(o.k)}</b><i>${evTxt(o.ev, r.evUnit || 'jetons')}</i>${o.fold !== undefined ? `<small>couche ${pct(o.fold, 0)}</small>` : ''}</span>`).join('')}</div><span class="note">EV estimée sur la rue en cours (${r.evUnit === '% du pot' ? 'en % du pot' : 'en jetons'}), modèle une rue.</span>` : '';
    return `<div class="lres ${r.tone}" role="status" aria-live="polite"><b>${esc(r.action)}${r.size ? ` <small>${esc(r.size)}</small>` : ''}</b>${bar}${opts}
      ${lv.discret ? '' : `<ul>${(r.lines || []).slice(0, 6).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`}<span class="note">${esc(r.hand || '')}${r.cat ? ' · ' + esc(r.cat) : ''} · ${fr(lv.ms, 0)} ms</span></div>`;
  }
  function rangeHTML() {
    const r = lv.res; if (!r || !r.grid || lv.discret) return '';
    if (!lv.showRange) return `<div class="row"><button class="btn small" data-act="lvrange">Voir sa range estimée et ce qui te bat</button></div>`;
    const beats = (r.beats || []).map((b) => `<tr><td>${esc(b.label)}</td><td class="n mono">${pct(b.p, 0)}</td><td class="n mono">${b.eq === null ? '–' : pct(b.eq, 0)}</td><td>${b.eq === null ? '' : b.eq < 0.35 ? '<span class="pill bad">il te bat</span>' : b.eq > 0.65 ? '<span class="pill good">tu bats</span>' : '<span class="pill">partagé</span>'}</td></tr>`).join('');
    return `<div class="lrange"><div><span class="eyebrow">Sa range estimée (poids)</span>${grid169((h, i) => { const w = r.grid[i]; return `<span class="rc${w > 0.02 ? ' on' : ''}" style="${w > 0.02 ? `background:color-mix(in srgb, var(--accent) ${Math.round(15 + 85 * w)}%, var(--sunk))` : ''}" title="${h} : ${Math.round(w * 100)} %">${h}</span>`; })}</div>
      <div><span class="eyebrow">Ce qu'il a, et ton équité contre</span><div class="tw"><table class="t"><thead><tr><th>Catégorie</th><th class="n">Part</th><th class="n">Ton équité</th><th></th></tr></thead><tbody>${beats}</tbody></table></div>
      <div class="row"><button class="btn small" data-act="lvrange">Masquer</button><button class="btn small" data-act="lvsolve">Étudier ce spot au solveur</button></div></div></div>`;
  }
  function pickerHTML() {
    const used = new Set(lv.cards.filter((c) => c !== null));
    if (lv.cfg.input === 'grid') {
      const sdx = (r) => lv.cfg.game === 'sd' && '2345'.includes(r);
      return `<div class="lg52">${SU.map(([s, sym]) => RK.map((r) => { const c = E.card(r + s), u = used.has(c) || sdx(r); return `<button class="lg52c ${s}" data-act="lvpick" data-c="${c}" ${u ? 'disabled' : ''} aria-label="${r}${sym}">${r === 'T' ? '10' : r}<i>${sym}</i></button>`; }).join('')).join('')}</div>`;
    }
    const ranks = RK.map((r) => `<button class="lrk${lv.rank === r ? ' on' : ''}" data-act="lvrank" data-r="${r}" ${lv.cfg.game === 'sd' && '2345'.includes(r) ? 'disabled' : ''}>${r === 'T' ? '10' : r}</button>`).join('');
    const suits = SU.map(([s, sym]) => { const c = lv.rank ? E.card(lv.rank + s) : null, dis = c !== null && used.has(c); return `<button class="lsu ${s}" data-act="lvsuit" data-s="${s}" ${!lv.rank || dis ? 'disabled' : ''}>${sym}</button>`; }).join('');
    return `<div class="lpick"><div class="lranks">${ranks}</div><div class="lsuits">${suits}</div></div>`;
  }
  const chips = (key, opts, act = 'lvset') => opts.map(([v, l]) => `<button class="chip" aria-pressed="${String(lv[key]) === String(v)}" data-act="${act}" data-k="${key}" data-v="${v}">${l}</button>`).join('');
  const cchips = (key, opts) => opts.map(([v, l]) => `<button class="chip" aria-pressed="${String(lv.cfg[key]) === String(v)}" data-act="lvcfg" data-k="${key}" data-v="${v}">${l}</button>`).join('');
  function cfgHTML() {
    const c = lv.cfg, sum = `${{ nlh: 'Hold\'em', plo: 'Omaha PLO', plo5: 'Omaha 5 cartes', plo8: 'Omaha Hi-Lo', sd: 'Short Deck', bomb: 'Bomb pot' }[c.game]} · ${c.players} joueurs${c.straddle ? ' · straddle' : ''}${c.ante ? ' · ante' : ''}${c.icm ? ' · tournoi ICM' : ''} · BB ${fr(bbNow(), 0)}${lv.cfg.linkTimer && lv.timer.used ? ' (minuteur)' : ''}`;
    if (!lv.showCfg) return `<div class="row lcfgsum"><span class="note">${esc(sum)}</span><button class="btn small" data-act="lvcfgopen">Réglages de la partie</button></div>`;
    return `<div class="lcfg"><div class="row"><span class="note">Jeu :</span>${cchips('game', [['nlh', 'Hold\'em'], ['plo', 'Omaha PLO'], ['plo5', 'Omaha 5 cartes'], ['plo8', 'Omaha Hi-Lo'], ['sd', 'Short Deck'], ['bomb', 'Bomb pot']])}</div>
      <div class="row"><span class="note">Joueurs à la table :</span>${cchips('players', [2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [n, String(n)]))}</div>
      <div class="row"><label class="check"><input type="checkbox" data-act="lvcfgb" data-k="straddle" ${c.straddle ? 'checked' : ''}><span>Straddle</span></label><label class="check"><input type="checkbox" data-act="lvcfgb" data-k="ante" ${c.ante ? 'checked' : ''}><span>Ante de grosse blinde</span></label><label class="check"><input type="checkbox" data-act="lvcfgb" data-k="icm" ${c.icm ? 'checked' : ''}><span>Tournoi : tenir compte de l'ICM (tapis de l'onglet Joueurs)</span></label></div>
      <div class="row"><span class="note">Saisie des cartes :</span>${cchips('input', [['grid', 'Grille 52 cartes (1 touche)'], ['rs', 'Valeur puis couleur']])}<label class="check"><input type="checkbox" data-act="lvcfgb" data-k="vibrate" ${c.vibrate ? 'checked' : ''}><span>Vibrer la décision</span></label><label class="check"><input type="checkbox" data-act="lvcfgb" data-k="linkTimer" ${c.linkTimer ? 'checked' : ''}><span>Grosse blinde = niveau du minuteur</span></label></div>
      <div class="lgrid"><label class="f">Grosse blinde (jetons)<input inputmode="decimal" data-lv="bb" value="${esc(lv.bb)}"></label></div>
      ${c.vibrate ? '<p class="note">Vibrations : 1 courte = check ou suis ; 3 = mise ou relance ; 5 = tapis ; 1 longue = couche.</p>' : ''}
      <div class="row"><button class="btn small" data-act="lvcfgopen">Fermer les réglages</button></div></div>`;
  }
  function villainChips() {
    const act = lv.players.map((p, i) => [p, i]).filter(([p]) => p.on !== false);
    if (!act.length) return '';
    return `<div class="row"><span class="note">Adversaire :</span>${act.map(([p, i]) => `<button class="chip" aria-pressed="${lv.villain === i}" data-act="lvvil" data-i="${i}">${esc(p.name)} <small>${esc(L.TYPES[typeOf(p)]?.label.split(' ')[0] || '')}</small></button>`).join('')}</div>`;
  }
  function decisionHTML() {
    compute();
    const b = boardRaw().length, post = b >= 3, plo = ['plo', 'plo5', 'plo8'].includes(lv.cfg.game), bomb = lv.cfg.game === 'bomb', st = STREET(b);
    const toCallTxt = num(lv.toCall) > 0;
    const pastRows = ['flop', 'turn'].filter((s) => (s === 'flop' && b >= 4) || (s === 'turn' && b >= 5)).map((s) => `<div class="row"><span class="note">${s === 'flop' ? 'Au flop' : 'Au turn'} :</span>${Object.entries(HIST).map(([k, [l]]) => `<button class="chip" aria-pressed="${lv.hist[s] === k}" data-act="lvhist" data-s="${s}" data-v="${k}">${l}</button>`).join('')}</div>`).join('');
    const situation = post ? `
      <div class="lgrid"><label class="f">Pot avant sa mise<input inputmode="decimal" data-lv="pot" value="${esc(lv.pot)}" placeholder="facultatif"></label>
        <label class="f">Sa mise (à payer)<input inputmode="decimal" data-lv="toCall" value="${esc(lv.toCall)}" placeholder="0 = pas de mise"></label>
        <label class="f">Ton tapis restant<input inputmode="decimal" data-lv="stack" value="${esc(lv.stack)}" placeholder="facultatif"></label></div>
      <div class="row"><span class="note">${st === 'flop' ? 'Au flop' : st === 'turn' ? 'Au turn' : 'À la river'}, il :</span>${[[0, 'check / rien'], [0.33, 'mise 1/3'], [0.5, '1/2'], [0.66, '2/3'], [1, 'pot'], [1.5, 'overbet']].map(([f, l]) => `<button class="chip" aria-pressed="${f ? Math.abs(num(lv.toCall) / Math.max(1e-9, num(lv.pot) || 100) - f) < 0.02 && toCallTxt : !toCallTxt}" data-act="lvbet" data-f="${f}">${l}</button>`).join('')}<label class="check"><input type="checkbox" data-act="lvraised" ${lv.raised ? 'checked' : ''}><span>C'est une relance sur ma mise</span></label></div>
      ${pastRows}
      <div class="row"><span class="note">Avant le flop, il a :</span>${bomb ? '<span class="pill">bomb pot : toutes les mains</span>' : chips('vpre', [['call', 'payé ma relance'], ['raise', 'relancé'], ['limp', 'limpé'], ['threebet', '3-betté'], ['call3', 'payé mon 3-bet']])}</div>
      <div class="row"><span class="note">Après le flop, tu es :</span>${[['', 'auto'], ['1', 'en position'], ['0', 'hors de position']].map(([v, l]) => `<button class="chip" aria-pressed="${(lv.ip === null ? '' : lv.ip ? '1' : '0') === v}" data-act="lvip" data-v="${v}">${l}</button>`).join('')}</div>`
      : bomb ? '<p class="note">Bomb pot : tout le monde met la mise de départ, pas de préflop. Saisis ta main puis le flop.</p>'
      : `<div class="row"><span class="note">Ta position :</span>${chips('pos', POSL().map((p) => [p, p]))}</div>
      <div class="row"><span class="note">Avant toi :</span>${chips('pre', [['open', 'personne'], ['limp', 'limp(s)'], ['raise', 'une relance'], ['raisecall', 'relance + call'], ['threebet', '3-bet sur ma relance']])}</div>
      ${lv.pre === 'limp' ? `<div class="row"><span class="note">Limpers :</span>${chips('limpers', [[1, '1'], [2, '2'], [3, '3+']])}</div>` : ''}
      ${['raise', 'raisecall', 'threebet'].includes(lv.pre) ? `<div class="row"><span class="note">Relance à :</span>${chips('raiseBB', (lv.pre === 'threebet' ? [[8, '8 BB'], [10, '10 BB'], [12, '12 BB'], [15, '15 BB']] : [[2.5, '2,5 BB'], [3, '3 BB'], [4, '4 BB'], [5, '5 BB'], [7, '7 BB'], [10, '10 BB']]))}</div>` : ''}
      ${lv.pre === 'raisecall' ? `<div class="row"><span class="note">Callers :</span>${chips('callers', [[1, '1'], [2, '2'], [3, '3+']])}</div>` : ''}
      <div class="lgrid"><label class="f">Ton tapis (jetons)<input inputmode="decimal" data-lv="stack" value="${esc(lv.stack)}" placeholder="facultatif"></label></div>`;
    const common = `${villainChips()}<div class="row"><span class="note">Adversaires dans le coup :</span>${chips('nOpp', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5+']])}</div>
      <div class="row"><span class="note">Type :</span>${chips('type', Object.entries(L.TYPES).map(([k, t]) => [k, t.label]))}</div>`;
    const holes = Array.from({ length: nHole() }, (_, i) => slotHTML(i, 'Main')).join(''), bs = nHole();
    return `<section class="panel live${lv.discret ? ' discret' : ''}">
      ${lv.discret ? '' : cfgHTML()}
      ${resultHTML()}
      <div class="lslots"><div><span class="note">Ta main${plo ? ` (${nHole()} cartes)` : ''}</span><div class="row">${holes}</div></div>
        <div><span class="note">Board</span><div class="row">${slotHTML(bs, 'Flop')}${slotHTML(bs + 1, 'Flop')}${slotHTML(bs + 2, 'Flop')}${slotHTML(bs + 3, 'Turn')}${slotHTML(bs + 4, 'River')}</div></div></div>
      ${pickerHTML()}
      ${lv.discret ? '' : situation + common}
      ${rangeHTML()}
      <div class="row"><button class="btn primary" data-act="lvnew">Nouvelle main</button><button class="btn" data-act="lvnext">Main suivante (position +1)</button>
        <button class="btn" data-act="lvdiscret">${lv.discret ? 'Quitter le mode discret' : 'Mode discret'}</button>${'wakeLock' in navigator ? `<button class="btn" data-act="lvwake">${lv.wake ? 'Écran : reste allumé' : 'Garder l\'écran allumé'}</button>` : ''}</div>
      ${lv.discret ? '<p class="note">Mode discret : écran sombre, seule la décision s\'affiche. Les réglages de situation restent ceux choisis avant.</p>' : `<p class="note">${['plo', 'plo5', 'plo8', 'sd'].includes(lv.cfg.game) ? 'Variante : rang exact de la main de départ (PLO, Short Deck) ou estimé (Omaha 5, Hi-Lo), range adverse filtrée par ses actions, équité Monte-Carlo.' : 'Modèle : range adverse apprise sur des mains simulées de chaque type, mise à jour rue par rue selon ses actions ; équité exacte au turn et à la river ; EV de chaque option sur la rue en cours.'} Clavier : valeur + couleur (a s), Retour pour effacer, Entrée pour une nouvelle main.</p>`}
    </section>`;
  }
  // ---------------- Actions décision ----------------
  const nextEmpty = () => { const i = lv.cards.slice(0, nHole() + 5).findIndex((c) => c === null); return i < 0 ? nHole() + 4 : i; };
  function place(c) { if (lv.cards.includes(c) || (lv.cfg.game === 'sd' && (c >> 2) < 4)) return; const i = lv.cards[lv.slot] === null && lv.slot < nHole() + 5 ? lv.slot : nextEmpty(); lv.cards[i] = c; lv.rank = null; lv.slot = nextEmpty(); render(); }
  ACT.lvslot = (t) => { const i = +t.dataset.i; if (lv.cards[i] !== null) lv.cards[i] = null; lv.slot = i; lv.rank = null; render(); };
  ACT.lvrank = (t) => { lv.rank = t.dataset.r; render(); };
  ACT.lvsuit = (t) => { if (!lv.rank) return; place(E.card(lv.rank + t.dataset.s)); };
  ACT.lvpick = (t) => place(+t.dataset.c);
  ACT.lvset = (t) => { const k = t.dataset.k, v = t.dataset.v; lv[k] = isNaN(+v) ? v : +v; render(); };
  ACT.lvcfg = (t) => { const k = t.dataset.k, v = t.dataset.v; lv.cfg[k] = isNaN(+v) ? v : +v; if (k === 'game') { lv.cards = Array(10).fill(null); lv.slot = 0; } if (k === 'players' && !POSL().includes(lv.pos)) lv.pos = 'BTN'; if (k === 'players' && !POSL().includes(lv.pos)) lv.pos = POSL()[0]; saveCfg(); render(); };
  ACT.lvcfgb = (t) => { lv.cfg[t.dataset.k] = t.checked; saveCfg(); render(); };
  ACT.lvcfgopen = () => { lv.showCfg = !lv.showCfg; render(); };
  ACT.lvbet = (t) => { const f = +t.dataset.f; if (!f) { lv.toCall = ''; lv.raised = false; } else { if (!num(lv.pot)) lv.pot = '100'; lv.toCall = String(Math.round(num(lv.pot) * f)); } render(); };
  ACT.lvraised = (t) => { lv.raised = t.checked; render(); };
  ACT.lvhist = (t) => { lv.hist[t.dataset.s] = lv.hist[t.dataset.s] === t.dataset.v ? '' : t.dataset.v; render(); };
  ACT.lvip = (t) => { lv.ip = t.dataset.v === '' ? null : t.dataset.v === '1'; render(); };
  ACT.lvrange = () => { lv.showRange = !lv.showRange; render(); };
  ACT.lvvil = (t) => { const i = +t.dataset.i; lv.villain = lv.villain === i ? null : i; if (lv.villain !== null) lv.type = typeOf(lv.players[i]); render(); };
  function logHand() {
    const r = lv.res, h = hero(); if (!r || h.length !== nHole()) return;
    lv.log.unshift({ t: Date.now(), g: lv.cfg.game, h: h.map(E.cardStr).join(''), b: boardRaw().map(E.cardStr).join(''), pos: lv.pos, a: r.action, s: r.size || '', eq: r.eq ?? null, st: r.street, type: lv.type, n: lv.nOpp, vpre: lv.vpre, pot: num(lv.pot), call: num(lv.toCall), ip: r.ip ?? null, hist: history() });
    if (lv.log.length > 400) lv.log.length = 400; ls.set('log', lv.log);
  }
  ACT.lvnew = () => { logHand(); lv.players.forEach((p) => { if (p.on !== false) p.hands = (p.hands || 0) + 1; }); if (lv.players.length) ls.set('players', lv.players);
    lv.cards = Array(10).fill(null); lv.slot = 0; lv.rank = null; lv.pot = ''; lv.toCall = ''; lv.pre = 'open'; lv.raised = false; lv.hist = { flop: '', turn: '' }; lv.ip = null; lv.showRange = false; lv.lastVib = null; render(); };
  ACT.lvnext = () => { const P = POSL(), i = P.indexOf(lv.pos); lv.pos = P[(i + 1) % P.length]; ACT.lvnew(); };
  ACT.lvdiscret = () => { lv.discret = !lv.discret; document.body.classList.toggle('discret-on', lv.discret); render(); };
  ACT.lvwake = async () => { try { if (lv.wake) { await lv.wake.release(); lv.wake = null; } else { lv.wake = await navigator.wakeLock.request('screen'); lv.wake.addEventListener?.('release', () => { lv.wake = null; }); } } catch (e) { lv.wake = null; } render(); };
  ONCHANGE.push((t) => { if (t.dataset.lv) { lv[t.dataset.lv] = t.value; if (t.dataset.lv === 'bb') ls.set('bb', t.value); render(); return true; } });
  // Clavier : « a s » = as de pique… ; Entrée = nouvelle main ; Retour arrière = efface la dernière carte.
  ONKEY.push((e, tab) => {
    if (tab !== 'live' || !lv.consent) return;
    if (lv.sub === 'drill') { const k = e.key; if (lv.drill && !lv.drill.done && /^[1-5]$/.test(k)) { ACT.lvdans({ dataset: { i: +k - 1 } }); return true; } if (k === 'Enter' && lv.drill && lv.drill.done) { ACT.lvdnext(); return true; } return; }
    if (lv.sub !== 'decision') return;
    const k = e.key;
    if (/^[2-9tjqka]$/i.test(k)) { lv.rank = k.toUpperCase(); render(); return true; }
    if (/^[shdc]$/i.test(k) && lv.rank) { place(E.card(lv.rank + k.toLowerCase())); return true; }
    if (k === 'Backspace') { const last = lv.cards.map((c, i) => [c, i]).filter(([c]) => c !== null).pop(); if (last) { lv.cards[last[1]] = null; lv.slot = last[1]; render(); } return true; }
    if (k === 'Enter') { ACT.lvnew(); return true; }
  });
  // Étudier le spot au solveur : ranges estimées (la sienne : modèle ; la tienne : ouverture de ta position), à vérifier.
  ACT.lvsolve = () => {
    const h = hero(), b = boardRaw(); if (!X.solverLoad || h.length !== 2 || b.length < 3) return;
    const vr = L.villainRange({ type: lv.type, vpre: lv.vpre, history: history() }, b, [...b]);
    const vtxt = PF.rangeText(vr.map((r) => [r.c[0], r.c[1], Math.min(1, r.w / Math.max(...vr.map((x) => x.w)))]));
    const key = { UTG: 'UTG', 'UTG+1': 'UTG', 'UTG+2': 'UTG', MP: 'UTG', LJ: 'UTG', HJ: 'HJ', CO: 'CO', BTN: 'BTN', SB: 'SB', BB: 'BTN' }[lv.pos] || 'BTN';
    const hr = lv.vpre === 'raise' || lv.vpre === 'threebet' ? (C.FACING.CO?.BTN?.call || C.RFI.BTN.range) : C.RFI[key].range;
    const ip = lv.res?.ip ?? ['BTN', 'CO'].includes(lv.pos), pot = num(lv.pot) || 10, stack = num(lv.stack) || pot * 10;
    X.solverLoad({ names: ip ? ['Lui', 'Toi'] : ['Toi', 'Lui'], ranges: ip ? [vtxt, hr] : [hr, vtxt], board: b.map(E.cardStr).join(''), pot, stack, hero: h.map(E.cardStr).join(''),
      note: 'Spot envoyé depuis la Table live : sa range vient du modèle (type ' + L.TYPES[lv.type].label.toLowerCase() + '), la tienne est une range d\'ouverture standard. Ajuste-les avant de résoudre.' });
  };

  // ---------------- Joueurs de la table ----------------
  function typeOf(p) {
    if (p.force) return p.force;
    const n = p.hands || 0; if (n < 8) return 'normal';
    const v = (p.vpip || 0) / n, r = (p.pfr || 0) / n;
    if (v >= 0.45 && r / Math.max(v, 1e-9) < 0.35) return 'fish';
    if (v >= 0.4 && r >= 0.25) return 'maniaque';
    if (v >= 0.28 && r >= 0.16) return 'large';
    if (v <= 0.18) return 'serre';
    if (v >= 0.4) return 'fish';
    return 'normal';
  }
  function playersHTML() {
    const rows = lv.players.map((p, i) => {
      const n = p.hands || 0;
      return `<div class="lpc${p.on === false ? ' off' : ''}"><div class="lpc1"><input class="lin lname" data-lpn="${i}" value="${esc(p.name)}" aria-label="Nom"><input class="lin" data-lps="${i}" value="${esc(p.stack || '')}" inputmode="numeric" placeholder="tapis" aria-label="Tapis">
        <span class="mono note">${n} mains · VPIP ${n ? pct((p.vpip || 0) / n, 0) : '–'} · PFR ${n ? pct((p.pfr || 0) / n, 0) : '–'}</span>
        <select data-lpt="${i}" aria-label="Type"><option value="">Auto : ${esc(L.TYPES[typeOf({ ...p, force: '' })].label)}${n < 8 ? ' (peu de mains)' : ''}</option>${Object.entries(L.TYPES).map(([k, x]) => `<option value="${k}"${p.force === k ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>
        <div class="lpc2"><button class="btn small" data-act="lpv" data-i="${i}" title="Il est entré dans le pot (paie ou relance)">Joue</button><button class="btn small" data-act="lpr" data-i="${i}" title="Il a relancé préflop">Relance</button><button class="btn small" data-act="lpon" data-i="${i}">${p.on === false ? 'Revient' : 'Absent'}</button><button class="btn small" data-act="lpdel" data-i="${i}" aria-label="Supprimer">✕</button>
        <input class="lin lnote" data-lpo="${i}" value="${esc(p.note || '')}" placeholder="Notes : tells, mains montrées, tendances" aria-label="Notes sur ${esc(p.name)}"></div></div>`;
    }).join('');
    return `<section class="panel"><h2>Joueurs de la table</h2>
      <p class="note">Pendant la partie : touche « Joue » quand un joueur entre dans le pot et « Relance » quand il relance avant le flop (une fois par main). « Nouvelle main » compte une main pour chaque joueur présent. Le type se déduit après 8 mains : VPIP (entrées dans le pot) et PFR (relances).</p>
      ${lv.players.length ? `<div class="lplayers">${rows}</div>` : '<p>Aucun joueur pour l\'instant.</p>'}
      <div class="row"><button class="btn primary" data-act="lpadd">Ajouter un joueur</button>${lv.players.length ? '<button class="btn" data-act="lpreset">Remettre les stats à zéro</button>' : ''}</div>
      <p class="note">Repères : VPIP 15 à 20 % = serré ; 25 à 30 % = normal ; plus de 40 % avec peu de relances = fish ; plus de 40 % avec beaucoup de relances = maniaque. Les tapis servent au mode tournoi ICM.</p></section>`;
  }
  const savePl = () => ls.set('players', lv.players);
  ACT.lpadd = () => { lv.players.push({ name: 'Joueur ' + (lv.players.length + 1), stack: '', hands: 0, vpip: 0, pfr: 0, note: '', force: '' }); savePl(); render(); };
  ACT.lpv = (t) => { const p = lv.players[+t.dataset.i]; p.vpip = (p.vpip || 0) + 1; if ((p.hands || 0) < p.vpip) p.hands = p.vpip; savePl(); render(); };
  ACT.lpr = (t) => { const p = lv.players[+t.dataset.i]; p.pfr = (p.pfr || 0) + 1; if ((p.vpip || 0) < p.pfr) p.vpip = p.pfr; if ((p.hands || 0) < p.vpip) p.hands = p.vpip; savePl(); render(); };
  ACT.lpon = (t) => { const p = lv.players[+t.dataset.i]; p.on = p.on === false; savePl(); render(); };
  ACT.lpdel = (t) => { lv.players.splice(+t.dataset.i, 1); lv.villain = null; savePl(); render(); };
  ACT.lpreset = () => { lv.players.forEach((p) => { p.hands = 0; p.vpip = 0; p.pfr = 0; }); savePl(); render(); };
  ONCHANGE.push((t) => {
    const d = t.dataset;
    if (d.lpn !== undefined) { lv.players[+d.lpn].name = t.value || 'Joueur'; savePl(); render(); return true; }
    if (d.lps !== undefined) { lv.players[+d.lps].stack = t.value; savePl(); return true; }
    if (d.lpo !== undefined) { lv.players[+d.lpo].note = t.value; savePl(); return true; }
    if (d.lpt !== undefined) { lv.players[+d.lpt].force = t.value; savePl(); render(); return true; }
  });

  // ---------------- Soirée : journal des décisions ----------------
  function soireeHTML() {
    const lg = lv.log, by = {}; lg.forEach((x) => (by[x.a] = (by[x.a] || 0) + 1));
    const rows = lg.slice(0, 60).map((x, i) => `<tr><td class="mono">${new Date(x.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td><td class="mono">${esc(x.h)}${x.b ? ' · ' + esc(x.b) : ''}</td><td>${esc(x.pos)}</td><td><b>${esc(x.a)}</b> ${esc(x.s)}</td><td class="n mono">${x.eq === null ? '–' : pct(x.eq, 0)}</td><td>${x.b && x.b.length >= 6 && (!x.g || x.g === 'nlh' || x.g === 'bomb') ? `<button class="btn small" data-act="lvlogsolve" data-i="${i}">Solveur</button>` : ''}</td></tr>`).join('');
    return `<section class="panel"><h2>Soirée</h2><p class="note">Chaque main validée par « Nouvelle main » est notée ici (400 au plus, sur cet appareil). Après la partie, revois les spots serrés et envoie-les au solveur.</p>
      <div class="stats"><div class="stat hero"><span>Décisions notées</span><b>${lg.length}</b><span>${Object.entries(by).map(([a, n]) => `${a.toLowerCase()} ${n}`).join(' · ') || '—'}</span></div>
      <div class="stat"><span>Postflop</span><b>${lg.filter((x) => x.b).length}</b><span>dont ${lg.filter((x) => x.b && x.eq !== null && x.eq > 0.4 && x.eq < 0.6).length} à équité serrée (40 à 60 %)</span></div></div>
      ${lg.length ? `<div class="tw"><table class="t"><thead><tr><th>Heure</th><th>Main · board</th><th>Pos.</th><th>Conseil</th><th class="n">Équité</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
      <div class="row">${lg.length ? '<button class="btn" data-act="lvlogcsv">Exporter (CSV)</button><button class="btn" data-act="lvlogclr">Effacer la soirée</button>' : ''}</div></section>`;
  }
  ACT.lvlogclr = () => { lv.log = []; ls.set('log', []); render(); };
  ACT.lvlogcsv = async () => {
    const head = 'heure;jeu;main;board;position;conseil;taille;equite;type;adversaires\n';
    const body = lv.log.map((x) => [new Date(x.t).toISOString(), x.g, x.h, x.b, x.pos, x.a, x.s, x.eq === null ? '' : x.eq.toFixed(3), x.type, x.n].join(';')).join('\n');
    const data = head + body, filename = 'sigma52-soiree-' + new Date().toISOString().slice(0, 10) + '.csv';
    try { const d = window.claude && (await window.claude.use('downloads')); if (d) { await d.save({ filename, data }); return; } } catch (e) { if (e && e.code === 'declined') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'text/csv' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  };
  ACT.lvlogsolve = (t) => {
    const x = lv.log[+t.dataset.i]; if (!x) return;
    const keep = { cards: lv.cards.slice(), type: lv.type, vpre: lv.vpre, pos: lv.pos, pot: lv.pot, toCall: lv.toCall, stack: lv.stack, hist: lv.hist, res: lv.res };
    const hc = E.parseCards(x.h), bc = E.parseCards(x.b);
    lv.cards = Array(10).fill(null); hc.forEach((c, i) => (lv.cards[i] = c)); bc.forEach((c, i) => (lv.cards[2 + i] = c));
    lv.type = x.type; lv.vpre = x.vpre; lv.pos = x.pos; lv.pot = String(x.pot || ''); lv.res = { ip: x.ip };
    ACT.lvsolve(); Object.assign(lv, keep);
  };

  // ---------------- Entraînement chronométré ----------------
  const DRILL_T = 8;
  function rndCards(n, avoid = []) { const out = []; while (out.length < n) { const c = Math.floor(Math.random() * 52); if (!out.includes(c) && !avoid.includes(c)) out.push(c); } return out; }
  function newSpot() {
    for (let k = 0; k < 30; k++) {
      const h = rndCards(2), post = Math.random() < 0.55, P = L.positions(6), pos = P[Math.floor(Math.random() * 5)];
      const type = Object.keys(L.TYPES)[Math.floor(Math.random() * 5)];
      if (!post) {
        const pre = ['open', 'open', 'raise', 'limp'][Math.floor(Math.random() * 4)], o = { hero: h, board: [], players: 6, pos, type, pre, raiseBB: 3, limpers: 1, live: true };
        const r = L.decide(o); if (!r) continue;
        const opts = ['COUCHE', pre === 'open' ? null : pre === 'limp' ? 'SUIS' : 'SUIS', 'RELANCE'].filter(Boolean);
        if (!opts.includes(r.action)) continue;
        return { o, r, opts, desc: `${pos} · ${pre === 'open' ? 'personne n\'a ouvert' : pre === 'raise' ? 'relance à 3 BB devant toi' : '1 limper devant toi'} · adversaires ${L.TYPES[type].label.toLowerCase()}` };
      }
      const bl = [3, 4, 5][Math.floor(Math.random() * 3)], b = rndCards(bl, h), facing = Math.random() < 0.5, f = [0.33, 0.5, 0.75, 1][Math.floor(Math.random() * 4)];
      const o = { hero: h, board: b, players: 6, pos, type, vpre: 'call', pot: 100, toCall: facing ? Math.round(100 * f) : 0, stack: 1000, nOpp: 1, runouts: 50 };
      const r = L.decide(o); if (!r) continue;
      const opts = facing ? ['COUCHE', 'SUIS', 'RELANCE'] : ['CHECK', 'MISE'];
      const act = r.action === 'TAPIS' ? (facing ? 'RELANCE' : 'MISE') : r.action; if (!opts.includes(act)) continue;
      r.drillAct = act;
      return { o, r, opts, desc: `${['', '', '', 'Flop', 'Turn', 'River'][bl]} · ${facing ? `il mise ${Math.round(f * 100)} % du pot` : 'à toi de parler, pas de mise'} · adversaire ${L.TYPES[type].label.toLowerCase()} qui a payé ta relance` };
    }
    return null;
  }
  function drillHTML() {
    const d = lv.drill;
    if (!d) return `<section class="panel"><h2>Entraînement éclair</h2><p>Des spots tirés au hasard, ${DRILL_T} secondes pour répondre, corrigés par le moteur de la Table live. Le but : décider comme lui sans le regarder. Touches 1 à 3 pour répondre, Entrée pour continuer.</p>
      <div class="stats"><div class="stat hero"><span>Meilleure série</span><b>${lv.drillBest}</b><span>bonnes réponses d'affilée</span></div></div>
      <div class="row"><button class="btn primary" data-act="lvdstart">Commencer</button></div></section>`;
    const s = d.spot, r = s.r, act = r.drillAct || r.action, left = Math.max(0, DRILL_T - (performance.now() - d.t0) / 1000);
    const alt = r.close && r.options ? r.options.find((o) => o.act !== r.action)?.act : null;
    return `<section class="panel live"><div class="row" style="justify-content:space-between"><span class="pill acc">Série ${d.streak} · ${d.ok}/${d.n}</span>${d.done ? '' : `<span class="pill" id="ldtime">${Math.ceil(left)} s</span>`}</div>
      <p class="eyebrow">${esc(s.desc)}</p>
      <div class="felt"><div class="row" style="justify-content:center;gap:14px">${s.o.board.length ? s.o.board.map((c) => cardHTML(c)).join('') : '<span class="note" style="color:var(--on-felt)">Préflop</span>'}<span style="width:12px"></span>${s.o.hero.map((c) => cardHTML(c)).join('')}</div></div>
      <div class="row ldopts">${s.opts.map((a, i) => `<button class="btn${d.done ? (a === act ? ' primary' : '') : ''}" data-act="lvdans" data-i="${i}" ${d.done ? 'disabled' : ''}>${i + 1}. ${a === 'MISE' ? 'MISE (taille du moteur)' : a}</button>`).join('')}</div>
      ${d.done ? `<div class="verdict ${d.last === 'ok' ? 'good' : d.last === 'alt' ? 'warn' : 'bad'}"><p><strong>${d.last === 'ok' ? 'Juste.' : d.last === 'alt' ? 'Acceptable : décision serrée.' : d.last === 'time' ? 'Trop lent.' : 'Le moteur choisit autre chose.'}</strong> Moteur : <b>${esc(r.action)}${r.size ? ' ' + esc(r.size) : ''}</b>${alt ? ` (proche : ${esc(alt.toLowerCase())})` : ''}.</p>
        <ul>${(r.lines || []).slice(0, 4).map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div><div class="row"><button class="btn primary" data-act="lvdnext">Suivant <span style="opacity:.7">Entrée</span></button><button class="btn" data-act="lvdstop">Arrêter</button></div>` : ''}</section>`;
  }
  ACT.lvdstart = () => { lv.drill = { n: 0, ok: 0, streak: 0, spot: newSpot(), t0: performance.now(), done: false }; render(); };
  ACT.lvdnext = () => { const d = lv.drill; d.spot = newSpot(); d.t0 = performance.now(); d.done = false; d.last = null; render(); };
  ACT.lvdstop = () => { lv.drill = null; render(); };
  ACT.lvdans = (t) => {
    const d = lv.drill; if (!d || d.done) return;
    const s = d.spot, a = s.opts[+t.dataset.i], act = s.r.drillAct || s.r.action, alt = s.r.close && s.r.options ? s.r.options.find((o) => o.act !== s.r.action)?.act : null;
    const late = (performance.now() - d.t0) / 1000 > DRILL_T, ok = !late && (a === act || (alt && a === (alt === 'TAPIS' ? 'RELANCE' : alt)));
    d.n++; d.done = true; d.last = late ? 'time' : a === act ? 'ok' : ok ? 'alt' : 'bad';
    if (ok) { d.ok++; d.streak++; if (d.streak > lv.drillBest) { lv.drillBest = d.streak; ls.set('drillBest', d.streak); } } else d.streak = 0;
    render();
  };
  setInterval(() => { const d = lv.drill; if (!d || d.done || lv.sub !== 'drill' || X.getTab() !== 'live') return; const left = DRILL_T - (performance.now() - d.t0) / 1000, el = document.getElementById('ldtime'); if (el) el.textContent = Math.max(0, Math.ceil(left)) + ' s'; if (left <= 0) ACT.lvdans({ dataset: { i: -1 } }); }, 250);

  // ---------------- Minuteur de blindes ----------------
  const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
  function lvl(i) { return lv.levels[Math.min(i, lv.levels.length - 1)]; }
  function timerHTML() {
    const T = lv.timer, c = lvl(T.i), n = lvl(T.i + 1); if (T.left === null) T.left = c.min * 60;
    return `<section class="panel ltimer" id="ltimer"><span class="eyebrow">Niveau ${c.n} sur ${lv.levels.length}</span>
      <div class="lblinds">${fr(c.sb, 0)} / ${fr(c.bb, 0)}${c.ante ? `<small>ante ${fr(c.ante, 0)}</small>` : ''}</div>
      <div class="lclock" id="lclock">${mmss(T.left)}</div>
      <p class="note">Ensuite : ${fr(n.sb, 0)} / ${fr(n.bb, 0)}${n.ante ? ` · ante ${fr(n.ante, 0)}` : ''}</p>
      <div class="row" style="justify-content:center"><button class="btn" data-act="lvtprev" aria-label="Niveau précédent">⏮</button><button class="btn primary" data-act="lvtgo">${T.running ? 'Pause' : 'Démarrer'}</button><button class="btn" data-act="lvtnext" aria-label="Niveau suivant">⏭</button><button class="btn" data-act="lvtplus">+1 min</button><button class="btn" data-act="lvtfull">Plein écran</button></div>
      <p class="note">Bip au changement de niveau. Une fois démarré, la Décision éclair prend la grosse blinde du niveau en cours. Structure modifiable dans « Préparer ».</p></section>`;
  }
  function beep() { try { const A = window.AudioContext || window.webkitAudioContext, a = new A(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.2, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.8); o.start(); o.stop(a.currentTime + 0.8); } catch (e) { /* son indisponible */ } }
  setInterval(() => {
    const T = lv.timer; if (!T.running) return;
    const now = performance.now(), dt = (now - T.last) / 1000; T.last = now; T.left -= dt;
    if (T.left <= 0) { if (T.i < lv.levels.length - 1) { T.i++; T.left = lvl(T.i).min * 60; } else { T.left = 0; T.running = false; } beep(); if (X.getTab() === 'live' && lv.sub === 'timer') render(); return; }
    const el = document.getElementById('lclock'); if (el) el.textContent = mmss(T.left);
  }, 250);
  ACT.lvtgo = () => { const T = lv.timer; T.running = !T.running; T.used = true; T.last = performance.now(); render(); };
  ACT.lvtnext = () => { const T = lv.timer; T.i = Math.min(lv.levels.length - 1, T.i + 1); T.left = lvl(T.i).min * 60; render(); };
  ACT.lvtprev = () => { const T = lv.timer; T.i = Math.max(0, T.i - 1); T.left = lvl(T.i).min * 60; render(); };
  ACT.lvtplus = () => { lv.timer.left += 60; render(); };
  ACT.lvtfull = () => { const el = document.getElementById('ltimer'); try { (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); } catch (e) { /* plein écran refusé */ } };

  // ---------------- Préparer la partie ----------------
  function prepHTML() {
    const s = lv.st, c = lv.ch;
    const res = L.chips({ stack: +c.stack, players: +c.players, denoms: c.denoms.map((x) => +x).filter((x) => x > 0), counts: c.counts.filter((_, i) => +c.denoms[i] > 0) });
    const pay = L.payouts(+lv.places);
    return `<section class="panel"><h2>Structure du tournoi maison</h2>
      <div class="lgrid"><label class="f">Tapis de départ<input data-lst="stack" value="${esc(s.stack)}" inputmode="numeric"></label><label class="f">Joueurs<input data-lst="players" value="${esc(s.players)}" inputmode="numeric"></label>
        <label class="f">Durée visée (heures)<input data-lst="hours" value="${esc(s.hours)}" inputmode="decimal"></label><label class="f">Minutes par niveau<input data-lst="levelMin" value="${esc(s.levelMin)}" inputmode="numeric"></label><label class="f">Plus petit jeton<input data-lst="smallChip" value="${esc(s.smallChip)}" inputmode="numeric"></label></div>
      <div class="tw"><table class="t"><thead><tr><th>Niveau</th><th class="n">Petite</th><th class="n">Grosse</th><th class="n">Ante (BB)</th><th class="n">Minutes</th></tr></thead><tbody>${lv.levels.map((l) => `<tr><td>${l.n}</td><td class="n">${fr(l.sb, 0)}</td><td class="n">${fr(l.bb, 0)}</td><td class="n">${l.ante ? fr(l.ante, 0) : '–'}</td><td class="n">${l.min}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Départ à 100 grosses blindes, fin vers un quinzième des jetons en jeu par grosse blinde. Ante de grosse blinde à partir du niveau 4 : un seul joueur la paie pour toute la table.</p>
      <div class="row"><button class="btn primary" data-act="lvuse">Utiliser au minuteur</button></div></section>
      <section class="panel"><h2>Jetons par joueur</h2>
      <div class="lgrid"><label class="f">Tapis de départ<input data-lch="stack" value="${esc(c.stack)}" inputmode="numeric"></label><label class="f">Joueurs<input data-lch="players" value="${esc(c.players)}" inputmode="numeric"></label></div>
      <div class="tw"><table class="t"><thead><tr><th>Valeur</th><th>Stock (facultatif)</th></tr></thead><tbody>${c.denoms.map((d, i) => `<tr><td><input class="mono lin" data-lchd="${i}" value="${esc(d)}" inputmode="numeric" aria-label="Valeur ${i + 1}"></td><td><input class="mono lin" data-lchc="${i}" value="${esc(c.counts[i])}" inputmode="numeric" aria-label="Stock ${i + 1}"></td></tr>`).join('')}</tbody></table></div>
      <div class="tw"><table class="t"><thead><tr><th class="n">Valeur</th><th class="n">Par joueur</th><th class="n">Montant</th><th class="n">Total nécessaire</th></tr></thead><tbody>${res.rows.map((r) => `<tr><td class="n">${fr(r.value, 0)}</td><td class="n">${r.count}</td><td class="n">${fr(r.total, 0)}</td><td class="n">${r.need}${r.have !== null && r.need > r.have ? ` <span class="pill bad">stock ${r.have}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
      ${res.short ? `<p class="note"><b>Stock insuffisant</b> : il manque ${fr(res.rest, 0)} par joueur${res.stockTotal ? ` (stock total ${fr(res.stockTotal, 0)} pour ${fr(+c.stack * +c.players, 0)} nécessaires)` : ''}. Baisse le tapis de départ ou le nombre de joueurs.</p>` : res.rest ? `<p class="note">Reste ${fr(res.rest, 0)} non distribuable avec ces valeurs.</p>` : ''}</section>
      <section class="panel"><h2>Places (points ou lots)</h2><div class="row"><label class="f">Joueurs<input data-lv="places" value="${esc(lv.places)}" inputmode="numeric"></label></div>
      <p>${pay.map((p, i) => `<strong>${i + 1}<sup>${i ? 'e' : 'er'}</sup></strong> ${p} %`).join(' · ')}</p>
      <p class="note">Pour un accord en fin de partie selon les tapis, utilise l'outil Deal ICM.</p></section>`;
  }
  ONCHANGE.push((t) => {
    if (t.dataset.lst) { lv.st[t.dataset.lst] = +t.value || lv.st[t.dataset.lst]; ls.set('st', lv.st); lv.levels = L.structure(lv.st); render(); return true; }
    if (t.dataset.lch) { lv.ch[t.dataset.lch] = +t.value || lv.ch[t.dataset.lch]; ls.set('ch', lv.ch); render(); return true; }
    if (t.dataset.lchd !== undefined) { lv.ch.denoms[+t.dataset.lchd] = t.value; ls.set('ch', lv.ch); render(); return true; }
    if (t.dataset.lchc !== undefined) { lv.ch.counts[+t.dataset.lchc] = t.value; ls.set('ch', lv.ch); render(); return true; }
  });
  ACT.lvuse = () => { lv.timer = { i: 0, left: lv.levels[0].min * 60, running: false, last: 0, used: false }; lv.sub = 'timer'; render(); };
  X.liveState = lv;
  // Préchauffe : tables préflop calculées hors du premier clic.
  setTimeout(() => { try { L.decide({ hero: [48, 44], board: [], pos: 'BTN', pre: 'open' }); } catch (e) { /* ignoré */ } }, 1500);
})();
