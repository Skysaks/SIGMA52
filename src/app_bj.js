// Espace Blackjack de SIGMA 52 : séance du jour, cours, stratégie exacte selon les règles, entraîneur noté en EV,
// exercices de comptage Hi-Lo, table d'entraînement complète, simulation de bankroll et journal de séances.
// Tout s'utilise hors table. Moteur : src/bj_engine.js ; données précalculées : src/bj_data.js ; cours : src/bj_course.js.
(function () {
  const X = window.__S52, BJ = window.BJ, D = window.BJDATA, K = window.BJCourse, FS = window.FSRS, CT = window.BJCounts;
  if (!X || !BJ || !D || !K || !CT) return;
  const { $, esc, fr, eur, pct, today, addDays, state, Store, render, go, head, cardHTML, backHTML, VIEWS, AFTER, ACT, ONCHANGE, ONINPUT, ONKEY, TABS, GROUPS, drawLines } = X;
  const TB = [['bj', 'Séance BJ'], ['bjcours', 'Cours BJ'], ['bjstrat', 'Stratégie'], ['bjentr', 'Entraîneur'], ['bjcompte', 'Comptage'], ['bjsys', 'Systèmes'], ['bjtable', 'Table BJ'], ['bjbank', 'Bankroll BJ'], ['bjsim', 'Simulateur'], ['bjadv', 'Techniques'], ['bjmaths', 'Maths BJ'], ['bjjournal', 'Journal BJ']];
  TABS.push(...TB);
  GROUPS.push(['blackjack', 'Blackjack', TB.map((t) => t[0])]);
  if (X.ICON) X.ICON.blackjack = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="10" height="14" rx="2"/><rect x="10.5" y="3" width="10" height="14" rx="2"/><path d="M13.5 8.5h3.5l-2.2 5.5"/></svg>';
  const tabNow = X.getTab;

  // ---------- Petits outils ----------
  const rnd = Math.random, ri = (n) => Math.floor(rnd() * n), pick = (a) => a[ri(a.length)];
  const sgnP = (x, d = 2) => (x < 0 ? '−' : '+') + fr(Math.abs(x * 100), d) + ' %';
  const pc = (x, d = 1) => fr(x * 100, d) + ' %';
  const tcS = (t) => (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t);
  const UPN = (u) => (u === 1 ? 'As' : String(u));
  const ACTFR = K.ACTFR, NAMEC = { stand: 'Rester', hit: 'Tirer', double: 'Doubler', split: 'Séparer', surrender: 'Abandonner' };
  const KEYS = { stand: 's', hit: 't', double: 'd', split: 'p', surrender: 'a' };
  const ACTCOL = { S: 'var(--sunk)', H: 'color-mix(in srgb, var(--bad) 22%, var(--surface))', D: 'color-mix(in srgb, var(--good) 30%, var(--surface))', P: 'color-mix(in srgb, var(--accent) 30%, var(--surface))', R: 'color-mix(in srgb, var(--gold) 35%, var(--surface))' };
  // Cartes : entiers 0..51 du moteur poker (rang c >> 2 : 0 = 2 … 12 = As ; couleur c & 3).
  const val = (c) => { const r = c >> 2; return r <= 7 ? r + 2 : r <= 11 ? 10 : 1; };
  const cardOfVal = (v) => ((v === 1 ? 12 : v === 10 ? 8 + ri(4) : v - 2) << 2) | ri(4);
  const handOf = (cs) => { let s = 0, a = false; for (const c of cs) { const v = val(c); s += v; if (v === 1) a = true; } return { sum: s, ace: a, t: BJ.hv(s, a), soft: BJ.isSoft(s, a) }; };
  const isBJ = (cs) => cs.length === 2 && handOf(cs).t === 21;
  const cardsRow = (cs, sm) => `<div class="cards">${cs.map((c) => cardHTML(c, sm)).join('')}</div>`;
  const totalTxt = (cs) => { const h = handOf(cs); return h.soft && h.t < 21 ? `${h.t - 10} / ${h.t}` : String(h.t); };
  const rowLabel = K.rowLabel;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- État ----------
  function P() {
    const p = state.progress; if (!p.bj) p.bj = {};
    const b = p.bj;
    b.rk ??= 'europe'; b.cells ??= {}; b.review ??= []; b.quiz ??= {}; b.hist ??= [];
    b.count ??= {}; for (const k of ['flash', 'deck', 'tc', 'tray', 'ramp', 'round', 'ins', 'tags']) b.count[k] ??= { ok: 0, n: 0, best: null, last: [] };
    b.ramp ??= [1, 1, 2, 4, 6, 8, 10]; b.bank ??= { unit: 10, bankroll: 5000, hph: 70, pen: 0.75, others: 2, hands: 300000, indices: true };
    b.sessions ??= []; b.daily ??= { date: '', n: 0, ok: 0 }; b.tbl ??= { hands: 0, dec: 0, err: 0, evl: 0, cnt: 0, cntOk: 0, bets: 0, betOk: 0 };
    b.opts ??= { timer: 0 }; b.sys ??= 'hilo'; if (!CT.byId[b.sys]) b.sys = 'hilo';
    return b;
  }
  const save = () => Store.save('progress');

  // ---------- Jeu de règles courant ----------
  // Le double est-il permis sur la ligne (mains de deux cartes) avec ces règles ?
  const canDouble = (rowId, rules) => {
    if (rules.double === 'any') return true;
    if (rowId[0] === 's' || rowId === 'p1') return false;
    const t = rowId[0] === 'p' ? 2 * +rowId.slice(1) : +rowId.slice(1);
    return rules.double === '9-11' ? t >= 9 && t <= 11 : t >= 10 && t <= 11;
  };
  const validDev = (d, rules) => {
    if ((d.act === 'surrender' || d.basic === 'surrender') && !(rules.surrender && rules.peek)) return false;
    if ((d.act === 'double' || d.basic === 'double') && !canDouble(d.row, rules)) return false;
    return true;
  };
  function nearPreset(r) { if (!r.peek) return 'europe'; if (r.bj < 1.5) return 'sixcinq'; if (r.decks <= 2) return 'deux'; return r.h17 ? 'h17' : 'strip'; }
  function game() {
    const b = P();
    if (b.rk === 'custom' && b.custom) {
      const near = nearPreset(b.custom.rules), N = D.presets[near];
      return { key: 'custom', label: 'Règles personnalisées', note: `Indices et avantage par true count repris du jeu le plus proche (« ${N.label} »).`, rules: b.custom.rules, table: b.custom.table, edge: b.custom.edge, indices: N.indices.filter((d) => validDev(d, b.custom.rules)), insurance: N.insurance, edgeByTC: N.edgeByTC, near };
    }
    const k = D.presets[b.rk] ? b.rk : 'europe';
    return { key: k, ...D.presets[k] };
  }
  // ---------- Système de comptage courant ----------
  const sysOf = () => CT.byId[P().sys] || CT.byId.hilo;
  const countKey = (G) => (G.rules.peek ? 'strip' : 'europe');
  const sysData = (G, S) => D.counts?.[countKey(G)]?.systems?.[S.id];
  // Indices prudents (demi-Kelly) à la place des indices EV max, si choisis et calculés pour ce jeu.
  function raOverlay(G) {
    const A = D.adv?.[G.key];
    if (P().idxMode !== 'ra' || !A) return { ...G, idxMode: 'ev' };
    const ra = (d) => A.ra.find((x) => x.row === d.row && x.up === d.up && x.act === d.act && x.basic === d.basic);
    return { ...G, idxMode: 'ra', indices: G.indices.map((d) => { const r = ra(d); return r ? { ...d, index: r.index, exact: r.exact } : d; }) };
  }
  // Jeu + système : indices, assurance et échelle du système quand il est équilibré et calculé ; sinon ceux du Hi-Lo.
  function gameS() {
    const G = game(), S = sysOf(), C = sysData(G, S);
    if (S.id === 'hilo' || !S.balanced || !C || !C.indices) return { ...raOverlay(G), sys: S, scale: S.id === 'hilo' ? 1 : C?.scale || 1, tags: undefined, idxSys: 'Hi-Lo', sysNote: S.id === 'hilo' ? '' : S.balanced ? '' : `${S.name} est déséquilibré : il se joue au running count. Les indices et la rampe affichés ici sont ceux du Hi-Lo.` };
    return { ...G, sys: S, scale: C.scale, tags: S.t, idxSys: S.name, indices: C.indices.filter((d) => validDev(d, G.rules)), insurance: C.insurance, edgeByTC: C.edgeByTC, sysNote: `Indices et assurance ${S.name} calculés pour « ${D.presets[countKey(G)].label} » (unité du système : TC ${S.name}).` };
  }
  const tagOf = (S, c) => CT.tagOfCard(S, c);
  // Avantage interpolé à un true count donné (table edgeByTC du jeu ou du système).
  const advAt = (tcs, tc) => { if (tc <= tcs[0][0]) return tcs[0][1]; for (let k = 1; k < tcs.length; k++) if (tc <= tcs[k][0]) { const [a, ea] = tcs[k - 1], [b, eb] = tcs[k]; return ea + (eb - ea) * (tc - a) / (b - a); } return tcs[tcs.length - 1][1]; };
  const tagTxt = (x) => (x === 0 ? '0' : (x > 0 ? '+' : '−') + fr(Math.abs(x), x % 1 ? 1 : 0));
  function recommend(G, rowId, up, avail, tc) {
    const cell = G.table[rowId]?.[up];
    let order = cell ? cell.o.slice() : ['hit', 'stand'];
    if (tc !== null && tc !== undefined) for (const d of G.indices) if (d.row === rowId && d.up === up) {
      const on = d.dir > 0 ? tc >= d.index : tc < d.index;
      if (on) order = [d.act].concat(order.filter((x) => x !== d.act));
    }
    for (const k of order) if (avail[k]) return k;
    return avail.hit ? 'hit' : 'stand';
  }
  // Ligne du tableau pour une main (cartes UI). canSplit : la paire peut encore être séparée.
  function rowOf(cs, canSplit) {
    const h = handOf(cs);
    if (cs.length === 2 && val(cs[0]) === val(cs[1]) && canSplit) return 'p' + val(cs[0]);
    if (h.soft) return h.t >= 21 ? null : h.t === 12 ? 'soft12' : 's' + (h.t - 11);
    return 'h' + Math.max(5, Math.min(19, h.t));
  }
  const ins = (G) => G.insurance.index;
  const ruleTxt = (r) => [`${r.decks} jeu${r.decks > 1 ? 'x' : ''}`, r.h17 ? 'croupier tire soft 17' : 'croupier reste sur soft 17', r.peek ? 'carte cachée vérifiée (peek)' : (r.obo ? 'sans carte cachée, mise initiale seule perdue' : 'sans carte cachée, toutes mises perdues'), r.double === 'any' ? 'double sur toute main' : 'double sur ' + r.double.replace('-', ' à '), r.das ? 'double après split' : 'pas de double après split', r.maxHands >= 4 ? 'jusqu\'à 4 mains' : r.maxHands === 3 ? 'jusqu\'à 3 mains' : 'un seul split', r.rsa ? 're-split des as' : '', r.surrender && r.peek ? 'abandon' : 'pas d\'abandon', r.bj === 1.5 ? 'blackjack 3:2' : 'blackjack 6:5'].filter(Boolean).join(' · ');

  // ---------- Révisions espacées ----------
  const dueBJ = () => P().review.filter((r) => r.due <= today());
  function reviewGrade(key, spot, g) {
    const b = P(), idx = b.review.findIndex((r) => r.key === key), now = Date.now(), R = +state.settings.retention || 0.9, ymdOf = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    if (idx < 0) { if (g > 1) return; const f = FS ? FS.init(1, now) : null; b.review.push({ key, spot, f, due: f ? ymdOf(FS.dueAt(f, R)) : addDays(1) }); if (b.review.length > 300) b.review.shift(); return; }
    const r = b.review[idx];
    if (!FS) { r.due = addDays(g > 1 ? 7 : 1); return; }
    r.f = FS.review(r.f || FS.init(1, now), g, now); r.due = ymdOf(FS.dueAt(r.f, R));
    if (g > 1 && r.f.s > 365) b.review.splice(idx, 1);
  }

  // ---------- Maîtrise de la stratégie ----------
  const cellKey = (row, up) => row + '|' + up;
  const allCells = () => BJ.ROWS.flatMap((r) => BJ.UPS.map((u) => cellKey(r.id, u)));
  function mastery() {
    const b = P(), cells = allCells(), seen = cells.filter((k) => b.cells[k]?.n).length, mast = cells.filter((k) => (b.cells[k]?.st || 0) >= 3).length;
    const h = b.hist.slice(-200), acc = h.length ? h.reduce((a, x) => a + x, 0) / h.length : null;
    return { cells: cells.length, seen, mast, acc, n: h.length, done: mast === cells.length && h.length >= 200 && acc >= 0.98 };
  }
  function recordCell(row, up, ok) {
    const b = P(), c = (b.cells[cellKey(row, up)] ||= { n: 0, ok: 0, st: 0 });
    c.n++; if (ok) { c.ok++; c.st++; } else c.st = 0;
    b.hist.push(ok ? 1 : 0); if (b.hist.length > 400) b.hist.splice(0, b.hist.length - 400);
    const d = b.daily.date === today() ? b.daily : (b.daily = { date: today(), n: 0, ok: 0 }); d.n++; if (ok) d.ok++;
  }
  // Étapes de progression : chaque seuil est un critère d'entraînement fixé par SIGMA 52.
  function ladder() {
    const b = P(), m = mastery(), c = b.count, t = b.tbl;
    const lastOk = (k, n) => c[k].last.length >= n && c[k].last.slice(-n).every((x) => x);
    const deckOk = c.deck.last.slice(-3).length === 3 && c.deck.last.slice(-3).every((x) => x && x.ok && x.s <= 30);
    const quizOk = K.MODULES.filter((mm) => (b.quiz[mm.id] || 0) >= 0.8).length;
    const devAcc = (() => { const h = b.devHist || []; return h.length >= 50 ? h.slice(-50).reduce((a, x) => a + x, 0) / 50 : null; })();
    return [
      { t: 'Stratégie de base à 100 %', d: `${m.mast}/${m.cells} cases réussies 3 fois de suite · ${m.acc === null ? '—' : pc(m.acc)} sur les ${m.n} dernières (objectif 98 % sur 200)`, ok: m.done, go: 'bjentr' },
      { t: 'Running count rapide et juste', d: 'Paquet chrono : trois fois de suite juste en 30 s ou moins', ok: deckOk, go: 'bjcompte' },
      { t: 'True count et paquets restants', d: `Conversion et bac à défausse : 10 réponses justes de suite dans chaque exercice`, ok: lastOk('tc', 10) && lastOk('tray', 10), go: 'bjcompte' },
      { t: 'Déviations', d: devAcc === null ? 'Entraîneur, mode Indices : 50 décisions minimum' : `${pc(devAcc)} sur les 50 dernières décisions d'indices (objectif 95 %)`, ok: devAcc !== null && devAcc >= 0.95, go: 'bjentr' },
      { t: 'Table complète', d: `${t.hands} mains jouées · ${t.dec ? pc(1 - t.err / t.dec) : '—'} de décisions justes · comptes justes ${t.cnt ? pc(t.cntOk / t.cnt) : '—'} (objectif : 500 mains, 99 % et 95 %)`, ok: t.hands >= 500 && t.dec && 1 - t.err / t.dec >= 0.99 && t.cnt >= 10 && t.cntOk / t.cnt >= 0.95, go: 'bjtable' },
      { t: 'Cours et plan de mise', d: `${quizOk}/${K.MODULES.length} modules validés · simulation de bankroll ${b.lastSim ? 'faite' : 'à faire'}`, ok: quizOk === K.MODULES.length && !!b.lastSim, go: 'bjbank' },
    ];
  }

  // =====================================================================
  // Séance du jour
  // =====================================================================
  VIEWS.bj = () => {
    const b = P(), G = game(), m = mastery(), due = dueBJ().length, d = b.daily.date === today() ? b.daily : { n: 0, ok: 0 };
    const nextMod = K.MODULES.find((mm) => !((b.quiz[mm.id] || 0) >= 0.8)), L = ladder(), step = L.findIndex((x) => !x.ok);
    const bestDeck = b.count.deck.best;
    return `<section style="display:grid;gap:8px"><span class="eyebrow">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · blackjack</span>
      <h1>Ta séance blackjack</h1><p class="lead">Révisions, 30 décisions, un paquet compté au chrono, un module. Le jeu choisi : <strong>${esc(G.label)}</strong>, avantage de la maison ${pc(G.edge, 2)} en stratégie de base.</p></section>
    <div class="warnbox"><strong>Hors table, toujours.</strong> Au casino, rien d'autre que ta tête : ni téléphone, ni carte imprimée, ni SIGMA 52. Une aide extérieure à la table est le motif d'exclusion le plus net. En France, le blackjack en ligne n'est pas une offre agréée par l'ANJ.</div>
    <div class="stats">
      <div class="stat hero"><span>Stratégie de base</span><b>${m.acc === null ? '—' : pc(m.acc)}</b><span>${m.mast}/${m.cells} cases maîtrisées</span></div>
      <div class="stat"><span>Révisions dues</span><b>${due}</b><span>${b.review.length} erreurs suivies</span></div>
      <div class="stat"><span>Paquet chrono</span><b>${bestDeck ? fr(bestDeck, 1) + ' s' : '—'}</b><span>meilleur temps juste</span></div>
      <div class="stat"><span>Cours blackjack</span><b>${K.MODULES.filter((mm) => (b.quiz[mm.id] || 0) >= 0.8).length}/${K.MODULES.length}</b><span>modules à 80 %</span></div>
    </div>
    <div class="grid3">
      <section class="panel"><span class="eyebrow">1 · Révisions</span><h2>${due ? due + ' erreur' + (due > 1 ? 's' : '') + ' à revoir' : 'Rien à revoir'}</h2><p class="note">Chaque erreur de l'Entraîneur et des quiz revient à intervalle croissant jusqu'à ce que tu la réussisses.</p>
        <div class="row"><button class="btn${due ? ' primary' : ''}" data-act="bjgo" data-to="bjentr" data-mode="review" ${due ? '' : 'disabled'}>Réviser</button></div></section>
      <section class="panel"><span class="eyebrow">2 · Entraînement</span><h2>${d.n >= 30 ? 'Fait : ' + d.ok + '/' + d.n : d.n + '/30 décisions'}</h2><div class="meter"><i style="width:${Math.min(100, d.n / 30 * 100)}%"></i></div>
        <p class="note">${step <= 0 ? 'Mode faiblesses : les cases où tu te trompes reviennent plus souvent.' : step >= 3 ? 'Mode mixte : stratégie de base et indices.' : 'Puis un paquet chrono dans Comptage.'}</p>
        <div class="row"><button class="btn primary" data-act="bjgo" data-to="bjentr" data-mode="${step >= 3 ? 'mix' : 'weak'}">${d.n ? 'Continuer' : 'Commencer'}</button><button class="btn" data-act="bjgo" data-to="bjcompte" data-drill="deck">Paquet chrono</button></div></section>
      <section class="panel"><span class="eyebrow">3 · Cours</span><h2>${nextMod ? esc(nextMod.title) : 'Cours validé'}</h2><p class="note">${nextMod ? nextMod.minutes + ' min de lecture, puis le quiz.' : 'Relis les modules liés à tes erreurs.'}</p>
        <div class="row"><button class="btn" data-act="bjmod" data-id="${nextMod ? nextMod.id : K.MODULES[0].id}">${nextMod ? 'Lire' : 'Revoir'}</button></div></section>
    </div>
    <section class="panel"><span class="eyebrow">Progression</span><h2>Six étapes avant la première séance réelle</h2>
      <div class="tsteps">${L.map((x, i) => `<div class="tstep${x.ok ? ' done' : ''}"><span class="tn">${x.ok ? '✓' : i + 1}</span><span class="tl"><strong>${esc(x.t)}</strong><br><span class="note">${esc(x.d)}</span></span>${!x.ok && i === step ? `<button class="btn small primary" data-tab="${x.go}">Y aller</button>` : ''}</div>`).join('')}</div>
      <p class="note">Seuils fixés par SIGMA 52 pour l'entraînement. Ils mesurent ta précision, pas ta capacité à gagner : la variance du jeu réel reste entière.</p></section>
    <section class="panel"><span class="eyebrow">Avant d'aller au casino</span><h2>Checklist</h2>
      ${['J\'ai lu la pancarte de la table et entré ses règles dans Stratégie.', 'J\'ai fait 30 décisions sans erreur et un paquet chrono juste aujourd\'hui.', 'Mon capital de séance et ma rampe de mises sont fixés à l\'avance.', 'Je suis reposé, sans alcool, sans perte récente qui me travaille.', 'Je sais quoi faire si je perds le compte : mise minimum jusqu\'au mélange.', 'Aucun appareil ni aide écrite ne sortira de ma poche pendant le jeu.']
        .map((t, i) => `<label class="check"><input type="checkbox" data-bjck="${i}"><span>${t}</span></label>`).join('')}
      <p id="bjckDone" class="pill good" hidden>Prêt. Ferme SIGMA 52 ; une seule chose à faire : décisions justes, compte juste, mise juste.</p></section>`;
  };
  ONCHANGE.push((t) => { if (t.dataset.bjck !== undefined) { const all = [...document.querySelectorAll('[data-bjck]')]; const el = $('#bjckDone'); if (el) el.hidden = !all.every((x) => x.checked); return true; } });
  ACT.bjgo = (t) => { if (t.dataset.mode) { tr.mode = t.dataset.mode; tr.spot = null; } if (t.dataset.drill) { cd.drill = t.dataset.drill; cdReset(); } go(t.dataset.to); };

  // =====================================================================
  // Cours
  // =====================================================================
  let openMod = null, qAns = {};
  const CX = { D, BJ, CT, Shuffle: window.BJShuffle };
  VIEWS.bjcours = () => {
    const b = P();
    if (openMod) {
      const m = K.MODULES.find((x) => x.id === openMod), i = K.MODULES.indexOf(m), nxt = K.MODULES[i + 1];
      const done = Object.keys(qAns).length === m.quiz.length, right = m.quiz.filter((q, k) => qAns[k] === q.ok).length;
      let secs = '';
      for (const [h, f] of m.sections) { let html; try { html = f(CX); } catch (e) { html = '<p class="note">Contenu indisponible.</p>'; } secs += `<section><h2>${h}</h2><div class="prose tw">${html}</div></section>`; }
      const quiz = m.quiz.map((q, qi) => { const a = qAns[qi]; return `<div class="panel" style="gap:10px"><p><strong>${qi + 1}.</strong> ${esc(q.q)}</p><div class="opts">${q.opts.map((o, oi) => `<button class="opt${a !== undefined && oi === q.ok ? ' ok' : ''}${a === oi && oi !== q.ok ? ' ko' : ''}" data-act="bjq" data-q="${qi}" data-i="${oi}" ${a !== undefined ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>${a !== undefined ? `<div class="verdict ${a === q.ok ? 'good' : 'bad'}"><b>${a === q.ok ? 'Juste.' : 'Non : ' + esc(q.opts[q.ok]) + '.'}</b><span>${esc(q.why)}</span></div>` : ''}</div>`; }).join('');
      return `<div class="row"><button class="btn small" data-act="bjclose">← Tous les modules</button><span class="eyebrow">Module ${i + 1} sur ${K.MODULES.length} · ${m.minutes} min</span></div>
      <article class="panel prose"><h1>${esc(m.title)}</h1><div class="warnbox"><strong>À la fin de ce module, tu sauras :</strong><ul>${m.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>${secs}
        <div class="grid2"><section class="panel" style="background:var(--bad-bg);border-color:transparent"><h3>Erreurs fréquentes</h3><ul>${m.mistakes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="panel" style="background:var(--good-bg);border-color:transparent"><h3>À retenir</h3><ul>${m.keys.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section></div></article>
      <section style="display:grid;gap:10px"><div class="row" style="justify-content:space-between"><h2>Quiz du module</h2>${b.quiz[m.id] !== undefined ? `<span class="pill ${(b.quiz[m.id] || 0) >= 0.8 ? 'good' : ''}">Meilleur score : ${pct(b.quiz[m.id])}</span>` : ''}</div>${quiz}
        ${done ? `<div class="verdict ${right / m.quiz.length >= 0.8 ? 'good' : 'bad'}"><b>${right}/${m.quiz.length} · ${right / m.quiz.length >= 0.8 ? 'Module validé.' : 'Seuil : 80 %. Relis puis recommence.'}</b>${right < m.quiz.length ? '<span>Tes erreurs reviennent dans les Révisions.</span>' : ''}</div><div class="row"><button class="btn" data-act="bjqreset">Recommencer</button></div>` : ''}</section>
      <div class="row">${nxt ? `<button class="btn primary" data-act="bjmod" data-id="${nxt.id}">Module suivant →</button>` : ''}<button class="btn" data-tab="bjentr">Entraîneur</button><button class="btn" data-tab="bjcompte">Comptage</button></div>`;
    }
    const nM = K.MODULES.filter((m) => (b.quiz[m.id] || 0) >= 0.8).length, mins = K.MODULES.reduce((a, m) => a + m.minutes, 0);
    return head('Cours de blackjack', `${K.MODULES.length} modules en ${K.PARTS.length} parties : règles, stratégie, comptage, 14 systèmes, argent, mathématiques et techniques avancées. Lecture ≈ ${fr(mins / 60, 1)} h ; les chiffres viennent du moteur exact de SIGMA 52, pas de citations recopiées.`) +
      `<div class="stats"><div class="stat hero"><span>Modules validés</span><b>${nM}/${K.MODULES.length}</b><span>quiz à 80 % ou plus</span></div><div class="stat"><span>Jeu de référence</span><b style="font-size:16px">${esc(game().label)}</b><span>modifiable dans Stratégie</span></div></div>
      ${(K.PARTS || ['']).map((part) => { const ms = K.MODULES.filter((m) => !part || m.part === part); if (!ms.length) return ''; return `<section style="display:grid;gap:8px">${part ? `<div><span class="eyebrow">${esc(part)}</span><h2>${esc(part)} · ${ms.filter((m) => (b.quiz[m.id] || 0) >= 0.8).length}/${ms.length}</h2></div>` : ''}<div class="modlist">${ms.map((m) => { const i = K.MODULES.indexOf(m); const sc = b.quiz[m.id], ok = (sc || 0) >= 0.8; return `<button class="mod${ok ? ' done' : ''}" data-act="bjmod" data-id="${m.id}"><span class="n">${ok ? '✓' : String(i + 1).padStart(2, '0')}</span><span><h3>${esc(m.title)}</h3><span class="note">${m.sections.map((x) => x[0]).join(' · ')}</span></span><span class="note mono" style="text-align:right">${m.minutes} min${sc !== undefined ? '<br>quiz ' + pct(sc) : ''}</span></button>`; }).join('')}</div></section>`; }).join('')}`;
  };
  ACT.bjmod = (t) => { openMod = t.dataset.id; qAns = {}; if (tabNow() !== 'bjcours') go('bjcours'); else { render(); window.scrollTo(0, 0); } };
  ACT.bjclose = () => { openMod = null; render(); };
  ACT.bjqreset = () => { qAns = {}; render(); };
  ACT.bjq = (t) => {
    const m = K.MODULES.find((x) => x.id === openMod), qi = +t.dataset.q, i = +t.dataset.i, b = P();
    if (qAns[qi] !== undefined) return; qAns[qi] = i;
    const q = m.quiz[qi];
    if (q.ok !== i) reviewGrade('quiz:' + m.id + ':' + qi, { kind: 'quiz', mod: m.id, qi }, 1);
    else if (b.review.some((r) => r.key === 'quiz:' + m.id + ':' + qi)) reviewGrade('quiz:' + m.id + ':' + qi, null, 3);
    if (Object.keys(qAns).length === m.quiz.length) { const sc = m.quiz.filter((qq, k) => qAns[k] === qq.ok).length / m.quiz.length; b.quiz[m.id] = Math.max(b.quiz[m.id] || 0, sc); }
    save(); render();
  };

  // =====================================================================
  // Stratégie et règles
  // =====================================================================
  let cellSel = null, cust = null, custRun = null;
  const custDefault = () => Object.assign({}, game().rules);
  function chart(G, kind, devTC) {
    const rows = BJ.ROWS.filter((r) => r.kind === kind);
    const devs = new Set(G.indices.map((d) => cellKey(d.row, d.up)));
    return `<div class="tw"><table class="t bjchart"><thead><tr><th>${kind === 'hard' ? 'Dur' : kind === 'soft' ? 'Souple' : 'Paire'}</th>${BJ.UPS.map((u) => `<th class="n">${UPN(u)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td><strong>${esc(r.label === '19' ? '19+' : r.label)}</strong></td>${BJ.UPS.map((u) => { const c = G.table[r.id][u], code = devTC !== undefined ? codeAtTC(G, r.id, u, devTC) : c.c, k = cellKey(r.id, u); return `<td class="bjc${cellSel === k ? ' sel' : ''}${devs.has(k) ? ' dev' : ''}" style="background:${ACTCOL[code[0]]}" data-act="bjcell" data-k="${k}" title="${esc(rowLabel(r.id))} contre ${UPN(u)}">${code}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function codeAtTC(G, row, up, tc) {
    const cell = G.table[row][up], avail = { stand: true, hit: true, double: cell.ev.double !== undefined, split: cell.ev.split !== undefined, surrender: cell.ev.surrender !== undefined };
    const a = recommend(G, row, up, avail, tc), base = cell.o.find((k) => avail[k]);
    if (a === base) return cell.c;
    return { stand: 'S', hit: 'H', double: 'D', split: 'P', surrender: 'R' }[a] + '*';
  }
  let stratTC = null;
  VIEWS.bjstrat = () => {
    const b = P(), G = gameS(), cs = cellSel && cellSel.split('|');
    let detail = '';
    if (cs) {
      const [row, up] = [cs[0], +cs[1]], c = G.table[row][up], evs = Object.entries(c.ev).sort((x, y) => y[1] - x[1]), best = evs[0][1];
      const devs = G.indices.filter((d) => d.row === row && d.up === up);
      detail = `<section class="panel"><span class="eyebrow">Case choisie</span><h2>${esc(rowLabel(row))} contre ${UPN(up)}</h2>
        <div class="tw"><table class="t bjt"><thead><tr><th>Action</th><th class="n">EV (en mise)</th><th class="n">Écart avec la meilleure</th></tr></thead><tbody>${evs.map(([k, v]) => `<tr><td>${NAMEC[k]}</td><td class="n">${sgnP(v)}</td><td class="n">${v === best ? '—' : sgnP(v - best)}</td></tr>`).join('')}</tbody></table></div>
        <p class="note">EV moyenne des mains de deux cartes qui forment cette ligne, sabot complet. ${G.rules.peek ? 'Avec peek : sachant que le croupier n\'a pas blackjack.' : 'Sans carte cachée : le blackjack du croupier est compté dans l\'EV.'}</p>
        ${devs.length ? `<p><strong>Indice :</strong> ${devs.map((d) => `${ACTFR[d.act]} si TC ${d.dir > 0 ? '≥' : '<'} ${tcS(d.index)} (calcul exact ${fr(d.exact, 2)})`).join(' ; ')}.</p>` : ''}</section>`;
    }
    const custForm = cust ? `<section class="panel"><h2>Règles personnalisées</h2><div class="form">
        <label class="f">Jeux de cartes<select data-bjr="decks">${[1, 2, 4, 5, 6, 8].map((n) => `<option ${cust.decks === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="f">Soft 17<select data-bjr="h17"><option value="0" ${!cust.h17 ? 'selected' : ''}>Le croupier reste</option><option value="1" ${cust.h17 ? 'selected' : ''}>Le croupier tire</option></select></label>
        <label class="f">Carte cachée<select data-bjr="peek"><option value="peek" ${cust.peek ? 'selected' : ''}>Oui (peek)</option><option value="enhc" ${!cust.peek && !cust.obo ? 'selected' : ''}>Non, toutes mises perdues</option><option value="obo" ${!cust.peek && cust.obo ? 'selected' : ''}>Non, mise initiale seule</option></select></label>
        <label class="f">Double<select data-bjr="double">${[['any', 'Toute main'], ['9-11', '9, 10, 11'], ['10-11', '10, 11']].map(([v, l]) => `<option value="${v}" ${cust.double === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="f">Double après split<select data-bjr="das"><option value="1" ${cust.das ? 'selected' : ''}>Oui</option><option value="0" ${!cust.das ? 'selected' : ''}>Non</option></select></label>
        <label class="f">Mains max après split<select data-bjr="maxHands">${[2, 3, 4].map((n) => `<option ${cust.maxHands === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="f">Re-split des as<select data-bjr="rsa"><option value="0" ${!cust.rsa ? 'selected' : ''}>Non</option><option value="1" ${cust.rsa ? 'selected' : ''}>Oui</option></select></label>
        <label class="f">Abandon<select data-bjr="surrender"><option value="0" ${!cust.surrender ? 'selected' : ''}>Non</option><option value="1" ${cust.surrender ? 'selected' : ''}>Oui (tardif)</option></select></label>
        <label class="f">Blackjack payé<select data-bjr="bj"><option value="1.5" ${cust.bj === 1.5 ? 'selected' : ''}>3:2</option><option value="1.2" ${cust.bj !== 1.5 ? 'selected' : ''}>6:5</option></select></label></div>
      <div class="row"><button class="btn primary" data-act="bjcalc" ${custRun ? 'disabled' : ''}>${custRun ? `Calcul… ${custRun.done}/${custRun.total} lignes` : 'Calculer la stratégie exacte'}</button><button class="btn" data-act="bjcustcancel">Fermer</button><span class="note">Calcul exact dans ton navigateur, 10 à 40 secondes.</span></div>
      ${custRun ? `<div class="meter"><i style="width:${custRun.done / custRun.total * 100}%"></i></div>` : ''}${!cust.peek && cust.surrender ? '<p class="note">L\'abandon n\'est pas modélisé sans carte cachée : il est ignoré.</p>' : ''}</section>` : '';
    return head('Stratégie et règles', 'La stratégie de base exacte pour les règles de ta table, l\'EV de chaque action, les indices Hi-Lo et le coût de chaque règle.') +
      `<section class="panel"><span class="eyebrow">Jeu de règles</span><div class="row">${Object.entries(D.presets).map(([k, p]) => `<button class="chip" aria-pressed="${b.rk === k}" data-act="bjrk" data-k="${k}">${esc(p.label)}</button>`).join('')}${b.custom ? `<button class="chip" aria-pressed="${b.rk === 'custom'}" data-act="bjrk" data-k="custom">Personnalisé</button>` : ''}<button class="btn small" data-act="bjcust">Entrer les règles de ma table</button></div>
        <p class="note">${esc(ruleTxt(G.rules))}</p>${G.note ? `<p class="note">${esc(G.note)}</p>` : ''}
        <div class="stats"><div class="stat hero"><span>Avantage de la maison</span><b>${pc(G.edge, 2)}</b><span>stratégie de base, calcul exact</span></div><div class="stat"><span>Indice d'assurance · ${esc(G.idxSys)}</span><b>TC ${tcS(ins(G))}</b><span>seuil exact ${fr(G.insurance.exact, 2)}</span></div><div class="stat"><span>Avantage au TC ${esc(G.idxSys)} +${3 * Math.max(1, Math.round(G.scale || 1))}</span><b>${sgnP(advAt(G.edgeByTC, 3 * Math.max(1, Math.round(G.scale || 1))))}</b><span>jeu optimal, sabot moyen</span></div></div>
        <p class="note">Système de comptage : <strong>${esc(G.sys.name)}</strong> (à changer dans Systèmes). ${esc(G.sysNote || '')}</p></section>
      ${custForm}
      <section class="panel"><div class="row" style="justify-content:space-between"><h2>Tableau de stratégie</h2><div class="row"><label class="note">Afficher pour un true count ${esc(G.idxSys)} <select data-bjstc><option value="">— stratégie de base —</option>${(G.scale >= 1.5 ? [-6, -4, -2, 0, 2, 4, 6, 8, 10, 12] : [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]).map((t) => `<option value="${t}" ${stratTC === t ? 'selected' : ''}>${tcS(t)}</option>`).join('')}</select></label><button class="btn small" data-act="bjprint">Version imprimable</button></div></div>
        <p class="note"><span class="dot" style="background:${ACTCOL.H}"></span>H tirer <span class="dot" style="background:${ACTCOL.S}"></span>S rester <span class="dot" style="background:${ACTCOL.D}"></span>Dh/Ds doubler, sinon tirer/rester <span class="dot" style="background:${ACTCOL.P}"></span>P séparer <span class="dot" style="background:${ACTCOL.R}"></span>Rh/Rs/Rp abandonner, sinon tirer/rester/séparer. Case soulignée : un indice existe. ${stratTC !== null ? 'Astérisque : décision changée par un indice à ce true count.' : ''} Clique une case pour l'EV de chaque action.</p>
        <div class="bjcharts">${chart(G, 'hard', stratTC ?? undefined)}${chart(G, 'soft', stratTC ?? undefined)}${chart(G, 'pair', stratTC ?? undefined)}</div></section>
      ${detail}
      <div class="grid2"><section class="panel"><h2>Indices ${esc(G.idxSys)} de ce jeu</h2>${indexTbl(G)}<p class="note">Calcul SIGMA 52 : sabot moyen au true count donné, à mi-sabot, EV exacte des deux actions ; l'indice est le TC où elles s'égalisent, arrondi. Les tables publiées peuvent différer d'un point.</p></section>
        <section class="panel"><h2>Ce que coûte chaque règle</h2><div class="tw"><table class="t bjt"><tbody>${D.ruleCosts.rows.map(([l, d]) => `<tr><td>${esc(l)}</td><td class="n" style="color:var(${d > 0 ? '--bad' : '--good'})">${sgnP(d)}</td></tr>`).join('')}</tbody></table></div><p class="note">Par rapport à « ${esc(D.ruleCosts.base)} » (${pc(D.ruleCosts.baseEdge, 2)}). Positif : la règle coûte au joueur.</p></section></div>
      <section class="panel"><h2>Avantage du joueur par true count ${esc(G.idxSys)}</h2><div class="tw"><table class="t bjt"><thead><tr><th>TC</th>${G.edgeByTC.map(([t]) => `<th class="n">${tcS(t)}</th>`).join('')}</tr></thead><tbody><tr><td>Avantage</td>${G.edgeByTC.map(([, e]) => `<td class="n" style="color:var(${e > 0 ? '--good' : '--bad'})">${sgnP(e, 1)}</td>`).join('')}</tr></tbody></table></div><p class="note">Composition moyenne à chaque TC, jeu optimal selon la composition, assurance prise quand elle est rentable. Sert à construire la rampe dans Bankroll.</p></section>`;
  };
  function indexTbl(G) {
    const L = G.indices.slice().sort((a, b) => (a.set === b.set ? 0 : a.set === 'I18' ? -1 : b.set === 'I18' ? 1 : a.set === 'Fab4' ? -1 : 1));
    const A = G.idxSys === 'Hi-Lo' ? D.adv?.[G.key] : null, base = (d) => D.presets[G.key]?.indices.find((x) => x.row === d.row && x.up === d.up && x.act === d.act && x.basic === d.basic);
    const f = (L2, d) => L2 && L2.find((x) => x.row === d.row && x.up === d.up && x.act === d.act && x.basic === d.basic);
    const q = (x) => (x === undefined || x === null ? '—' : tcS(x));
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Main</th><th>Contre</th><th>Base</th><th>Déviation</th><th>Quand</th>${A ? '<th class="n">EV max</th><th class="n">Prudent</th><th class="n">Simulation</th>' : ''}<th>Série</th></tr></thead><tbody><tr><td>Assurance</td><td>As</td><td>non</td><td><strong>prendre</strong></td><td class="mono">TC ≥ ${tcS(ins(G))}</td>${A ? '<td class="n">—</td><td class="n">—</td><td class="n">—</td>' : ''}<td>I18</td></tr>${L.map((d) => { const b = base(d), r = A && f(A.ra, d), sm = A && f(A.sim, d); return `<tr><td>${esc(rowLabel(d.row))}</td><td>${UPN(d.up)}</td><td>${ACTFR[d.basic]}</td><td><strong>${ACTFR[d.act]}</strong></td><td class="mono">TC ${d.dir > 0 ? '≥' : '<'} ${tcS(d.index)}</td>${A ? `<td class="n">${b ? fr(b.exact, 1) : '—'}</td><td class="n">${r ? fr(r.exact, 1) : '—'}</td><td class="n">${sm ? fr(sm.exact, 1) + ' ± ' + fr(1.96 * sm.se, 1) : '—'}</td>` : ''}<td>${d.set === 'plus' ? '+' : d.set}</td></tr>`; }).join('')}</tbody></table></div>
      ${A ? `<p class="note"><strong>EV max</strong> : TC où les deux actions ont la même espérance (sabot moyen). <strong>Prudent</strong> : pour un joueur qui mise un demi-Kelly, l'action la plus risquée doit en plus compenser son surcroît de variance (ΔEV > ½ × avantage(TC) ÷ 1,33 × ΔVariance ÷ 2) : les doubles et splits sortent plus tard, les « rester » un peu plus tôt. <strong>Simulation</strong> : sabots réels épuisés au hasard, EV exacte sur chaque composition, régression autour de l'indice ; intervalle à 95 %. Un « — » : pas de croisement dans la plage −8 à +10.</p>
      <div class="row"><span class="note">Indices utilisés dans l'Entraîneur et la Table :</span><button class="chip" aria-pressed="${G.idxMode !== 'ra'}" data-act="bjidx" data-m="ev">EV max</button><button class="chip" aria-pressed="${G.idxMode === 'ra'}" data-act="bjidx" data-m="ra">Prudents (demi-Kelly)</button></div>` : ''}`;
  }
  ACT.bjidx = (t) => { P().idxMode = t.dataset.m; tbl = null; save(); render(); };
  ACT.bjrk = (t) => { P().rk = t.dataset.k; cellSel = null; tbl = null; save(); render(); };
  ACT.bjcell = (t) => { cellSel = cellSel === t.dataset.k ? null : t.dataset.k; render(); };
  ACT.bjcust = () => { cust = custDefault(); render(); };
  ACT.bjcustcancel = () => { cust = null; custRun = null; render(); };
  ONCHANGE.push((t) => {
    if (t.dataset.bjstc !== undefined) { stratTC = t.value === '' ? null : +t.value; render(); return true; }
    if (t.dataset.bjr && cust) {
      const k = t.dataset.bjr, v = t.value;
      if (k === 'peek') { cust.peek = v === 'peek'; cust.obo = v === 'obo'; }
      else if (k === 'double') cust.double = v;
      else if (['h17', 'das', 'rsa', 'surrender'].includes(k)) cust[k] = v === '1';
      else cust[k] = +v;
      render(); return true;
    }
  });
  ACT.bjcalc = () => {
    if (custRun) return;
    const rules = BJ.R(Object.assign({}, cust, { surrender: cust.surrender && cust.peek })), calc = BJ.Calc(rules), base = BJ.shoeOf(rules.decks), rows = BJ.ROWS.slice(), table = {};
    custRun = { done: 0, total: rows.length }; render();
    const step = () => {
      const row = rows[custRun.done]; table[row.id] = {};
      for (const up of BJ.UPS) { const ev = BJ.rowEV(calc, base, row, up), d = BJ.decide(ev); table[row.id][up] = { c: d.code, o: d.order, ev: Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, Math.round(v * 1e4) / 1e4])) }; }
      custRun.done++;
      if (custRun.done < rows.length) { if (tabNow() === 'bjstrat') render(); setTimeout(step, 0); return; }
      const strat = { calc, table: Object.fromEntries(Object.entries(table).map(([r, o]) => [r, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))])) };
      const edge = BJ.houseEdge(rules, { strat });
      const b = P(); b.custom = { rules, table, edge: Math.round(edge * 1e4) / 1e4 }; b.rk = 'custom'; save();
      custRun = null; cust = null; tbl = null; render();
    };
    setTimeout(step, 30);
  };
  ACT.bjprint = () => {
    const G = game(), w = window.open('', '_blank'); if (!w) return;
    const tbl2 = (kind) => { const rows = BJ.ROWS.filter((r) => r.kind === kind); return `<table><tr><th></th>${BJ.UPS.map((u) => `<th>${UPN(u)}</th>`).join('')}</tr>${rows.map((r) => `<tr><th>${r.label}</th>${BJ.UPS.map((u) => { const c = G.table[r.id][u].c; return `<td class="${c[0]}">${c}</td>`; }).join('')}</tr>`).join('')}</table>`; };
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Stratégie de base · ${esc(G.label)}</title><style>body{font:12px system-ui,sans-serif;margin:16px}h1{font-size:16px}table{border-collapse:collapse;margin:0 0 12px}td,th{border:1px solid #999;padding:2px 6px;text-align:center}.H{background:#f6d5d5}.S{background:#eee}.D{background:#d3ecd3}.P{background:#e8d0db}.R{background:#f3e3b6}.wrap{display:flex;gap:16px;flex-wrap:wrap}</style><h1>Stratégie de base · ${esc(G.label)}</h1><p>${esc(ruleTxt(G.rules))}. Avantage de la maison : ${pc(G.edge, 2)}. H tirer, S rester, Dh/Ds doubler sinon tirer/rester, P séparer, Rh/Rs/Rp abandonner sinon tirer/rester/séparer.</p><div class="wrap">${tbl2('hard')}${tbl2('soft')}${tbl2('pair')}</div><p>SIGMA 52 · pour l'entraînement hors table.</p><script>print()<\/script>`);
    w.document.close();
  };

  // =====================================================================
  // Entraîneur : décisions notées en EV
  // =====================================================================
  const tr = { mode: 'weak', block: 'hard', spot: null, ans: null, n: 0, ok: 0, t0: 0, tInt: null };
  const MODES = [['weak', 'Faiblesses'], ['all', 'Toutes les mains'], ['block', 'Par bloc'], ['dev', 'Indices'], ['mix', 'Mixte'], ['review', 'Révisions']];
  const BLOCKS = [['hard', 'Mains dures'], ['soft', 'Mains souples'], ['pair', 'Paires'], ['surr', 'Abandon']];
  function cardsForRow(rowId) {
    const row = BJ.ROWS.find((r) => r.id === rowId), combos = BJ.combosOf(row), [a, b] = pick(combos);
    return shuffle([cardOfVal(a), cardOfVal(b)]);
  }
  function randomUp() { const r = ri(13); return r >= 9 ? 10 : r === 0 ? 1 : r + 1; }
  function randomHand() {
    for (;;) { const a = randomUp(), b = randomUp(); if ((a === 1 && b === 10) || (a === 10 && b === 1)) continue; return shuffle([cardOfVal(a), cardOfVal(b)]); }
  }
  function spotFor(row, up, tc, kind) { return { kind: kind || (tc === null || tc === undefined ? 'base' : 'dev'), row, up, cards: cardsForRow(row), upCard: cardOfVal(up), tc: tc ?? null }; }
  function newSpot() {
    const b = P(), G = gameS(); tr.ans = null;
    let mode = tr.mode;
    if (mode === 'review') { const due = dueBJ().filter((r) => r.spot && r.spot.kind !== 'quiz'); const q = dueBJ().find((r) => r.spot?.kind === 'quiz'); if (!due.length && !q) { tr.mode = 'weak'; return newSpot(); }
      if (!due.length && q) { tr.spot = { kind: 'quiz', key: q.key, mod: q.spot.mod, qi: q.spot.qi }; return; }
      const it = due[0], s = it.spot; tr.spot = s.kind === 'ins' ? { kind: 'ins', tc: s.tc, upCard: cardOfVal(1), cards: randomHand(), key: it.key } : { ...spotFor(s.row, s.up, s.tc, s.kind), key: it.key }; return; }
    if (mode === 'mix') mode = rnd() < 0.7 ? 'weak' : 'dev';
    if (mode === 'dev') {
      if (rnd() < 0.15) { const i = ins(G), tc = i + ri(5) - 2; tr.spot = { kind: 'ins', tc, upCard: cardOfVal(1), cards: randomHand() }; return; }
      const devs = G.indices; if (!devs.length) { tr.mode = 'weak'; return newSpot(); }
      const d = pick(devs), tc = d.index + ri(5) - 2;
      tr.spot = spotFor(d.row, d.up, tc, 'dev'); return;
    }
    if (mode === 'block') {
      let rows = BJ.ROWS.filter((r) => r.kind === tr.block);
      if (tr.block === 'surr') { rows = BJ.ROWS.filter((r) => ['h14', 'h15', 'h16', 'h17', 'p8'].includes(r.id)); }
      const row = pick(rows).id, up = tr.block === 'surr' ? pick([8, 9, 10, 1]) : pick(BJ.UPS);
      tr.spot = spotFor(row, up, null); return;
    }
    if (mode === 'weak') {
      // Pondération : cases jamais vues ou ratées plus souvent ; les cases faciles (17+ dur, 5-8 dur) moins souvent.
      const cells = allCells().map((k) => { const c = b.cells[k], [row] = k.split('|'); const easy = /^h(5|6|7|8|17|18|19)$/.test(row) || row === 's9' || row === 'p10' ? 0.25 : 1; const w = (!c ? 2 : c.st >= 3 ? 0.15 : 1 + (c.n - c.ok) / Math.max(1, c.n) * 3) * easy; return [k, w]; });
      let tot = cells.reduce((a, x) => a + x[1], 0), r = rnd() * tot, k = cells[0][0];
      for (const [kk, w] of cells) { r -= w; if (r <= 0) { k = kk; break; } }
      const [row, up] = k.split('|'); tr.spot = spotFor(row, +up, null); return;
    }
    // Toutes les mains : distribution réelle.
    const cs = randomHand(), up = randomUp(), row = rowOf(cs, true);
    if (!row || row === 'soft12') return newSpot();
    tr.spot = { kind: 'base', row, up, cards: cs, upCard: cardOfVal(up), tc: null };
  }
  function availOf(G, row, up) { const ev = G.table[row][up].ev; return { stand: true, hit: true, double: ev.double !== undefined, split: ev.split !== undefined, surrender: ev.surrender !== undefined }; }
  function evAtTC(G, row, up, tc) {
    const s = BJ.shoeAtTC(Math.max(1, G.rules.decks / 2), tc, G.tags), calc = BJ.Calc(G.rules, s, true);
    return BJ.rowEV(calc, s, BJ.ROWS.find((r) => r.id === row), up);
  }
  function answer(a) {
    const s = tr.spot, G = gameS(), b = P(); if (!s || tr.ans) return;
    if (tr.tInt) { clearInterval(tr.tInt); tr.tInt = null; }
    if (s.kind === 'ins') {
      const right = s.tc >= ins(G) ? 'yes' : 'no', ok = a === right;
      tr.ans = { a, right, ok }; tr.n++; if (ok) tr.ok++;
      const c = b.count.ins; c.n++; if (ok) c.ok++; c.last.push(ok ? 1 : 0); if (c.last.length > 50) c.last.shift();
      (b.devHist ||= []).push(ok ? 1 : 0); if (b.devHist.length > 200) b.devHist.shift();
      reviewGrade(s.key || 'ins:' + s.tc, { kind: 'ins', tc: s.tc }, ok ? 3 : 1);
      save(); render(); return;
    }
    const avail = availOf(G, s.row, s.up), right = recommend(G, s.row, s.up, avail, s.tc), ok = a === right;
    let ev = G.table[s.row][s.up].ev; if (s.tc !== null) { try { ev = evAtTC(G, s.row, s.up, s.tc); } catch (e) { /* EV moyenne */ } }
    const loss = Math.max(0, (ev[right] ?? 0) - (ev[a] ?? -1));
    tr.ans = { a, right, ok, ev, loss, dt: tr.t0 ? (Date.now() - tr.t0) / 1000 : null }; tr.n++; if (ok) tr.ok++;
    if (s.tc === null) recordCell(s.row, s.up, ok);
    else { (b.devHist ||= []).push(ok ? 1 : 0); if (b.devHist.length > 200) b.devHist.shift(); const d = b.daily.date === today() ? b.daily : (b.daily = { date: today(), n: 0, ok: 0 }); d.n++; if (ok) d.ok++; }
    const key = s.key || (s.tc === null ? 'bs:' + cellKey(s.row, s.up) : 'dev:' + cellKey(s.row, s.up) + ':' + s.tc);
    reviewGrade(key, { kind: s.tc === null ? 'base' : 'dev', row: s.row, up: s.up, tc: s.tc }, ok ? 3 : 1);
    save(); render();
  }
  function why(G, s, right) {
    const ds = G.indices.filter((x) => x.row === s.row && x.up === s.up);
    if (s.tc !== null && ds.length) {
      const txt = ds.map((d) => `${ACTFR[d.act]} si TC ${d.dir > 0 ? '≥' : '<'} ${tcS(d.index)}`).join(' ; '), on = ds.some((d) => (d.dir > 0 ? s.tc >= d.index : s.tc < d.index));
      return `Indice${ds.length > 1 ? 's' : ''} : ${txt}. Ici TC ${tcS(s.tc)} : ${on ? 'la déviation s\'applique, ' + ACTFR[right] : 'on garde la stratégie de base, ' + ACTFR[right]}.`;
    }
    const r = s.row, u = s.up, weak = u >= 2 && u <= 6;
    if (right === 'split') return r === 'p8' ? '16 est le pire total : deux mains partant de 8 perdent moins.' : r === 'p1' ? 'Deux mains qui partent d\'un as valent bien plus que soft 12.' : weak ? 'Contre un croupier faible, deux mains rapportent plus qu\'une.' : 'Séparer donne la meilleure EV dans ce cas.';
    if (right === 'double') return r[0] === 's' ? 'Main souple : une carte ne peut pas la crever, et le croupier est faible. On met plus d\'argent quand on est favori.' : 'Total fort au départ : une carte de 10 donne une excellente main ; on double la mise quand on est favori.';
    if (right === 'surrender') return 'La main perd plus de la moitié du temps : récupérer la moitié de la mise coûte moins cher.';
    if (right === 'stand') return weak ? 'Le croupier crève souvent avec cette carte : inutile de risquer de crever toi-même.' : 'Ton total bat le plus souvent la main finale du croupier.';
    return weak ? 'Total trop faible pour rester, même contre une carte faible.' : 'Contre cette carte, le croupier finit souvent à 17 ou plus : rester perd plus que tirer.';
  }
  VIEWS.bjentr = () => {
    const b = P(), G = gameS(), m = mastery();
    if (!tr.spot) newSpot();
    const s = tr.spot;
    let body = '';
    if (s.kind === 'quiz') {
      const mod = K.MODULES.find((x) => x.id === s.mod), q = mod.quiz[s.qi], a = tr.ans;
      body = `<section class="panel"><span class="eyebrow">Révision · ${esc(mod.title)}</span><p>${esc(q.q)}</p><div class="opts">${q.opts.map((o, oi) => `<button class="opt${a && oi === q.ok ? ' ok' : ''}${a && a.a === oi && oi !== q.ok ? ' ko' : ''}" data-act="bjrq" data-i="${oi}" ${a ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>${a ? `<div class="verdict ${a.ok ? 'good' : 'bad'}"><b>${a.ok ? 'Juste.' : 'Non.'}</b><span>${esc(q.why)}</span></div><div class="row"><button class="btn primary" data-act="bjnext">Suivante (Entrée)</button></div>` : ''}</section>`;
    } else if (s.kind === 'ins') {
      const a = tr.ans;
      body = `<section class="panel bjspot"><div class="row" style="justify-content:space-between"><span class="eyebrow">Assurance</span><span class="pill acc">True count ${esc(G.idxSys)} ${tcS(s.tc)}</span></div>
        <div class="bjfelt"><div><span class="note">Croupier</span>${cardsRow([s.upCard])}</div><div><span class="note">Toi · ${totalTxt(s.cards)}</span>${cardsRow(s.cards)}</div></div>
        <div class="row">${a ? '' : '<button class="btn primary" data-act="bjins" data-v="yes">Prendre l\'assurance (O)</button><button class="btn" data-act="bjins" data-v="no">Refuser (N)</button>'}</div>
        ${a ? `<div class="verdict ${a.ok ? 'good' : 'bad'}"><b>${a.ok ? 'Juste.' : 'Erreur.'} ${a.right === 'yes' ? 'Assurance rentable' : 'Assurance perdante'} à TC ${esc(G.idxSys)} ${tcS(s.tc)}.</b><span>Indice d'assurance de ce jeu : TC ≥ ${tcS(ins(G))} (seuil exact ${fr(G.insurance.exact, 2)}). En dessous, moins d'un tiers des cartes restantes valent 10.</span></div><div class="row"><button class="btn primary" data-act="bjnext">Suivante (Entrée)</button></div>` : ''}</section>`;
    } else {
      const a = tr.ans, avail = availOf(G, s.row, s.up);
      const btns = ['hit', 'stand', 'double', 'split', 'surrender'].filter((k) => avail[k]).map((k) => `<button class="btn${a && k === a.right ? ' primary' : ''}" data-act="bjans" data-a="${k}" ${a ? 'disabled' : ''}>${NAMEC[k]} <kbd>${KEYS[k].toUpperCase()}</kbd></button>`).join('');
      let verdict = '';
      if (a) {
        const evs = Object.entries(a.ev).filter(([k]) => avail[k]).sort((x, y) => y[1] - x[1]);
        verdict = `<div class="verdict ${a.ok ? 'good' : 'bad'}"><b>${a.ok ? 'Juste' : 'Erreur : ' + ACTFR[a.right]}${a.ok ? '' : ` · coût ${fr(a.loss * 100, 2)} % de la mise`}${a.dt !== null && b.opts.timer ? ` · ${fr(a.dt, 1)} s` : ''}</b><span>${esc(why(G, s, a.right))}</span></div>
          <div class="tw"><table class="t bjt"><thead><tr><th>Action</th><th class="n">EV</th></tr></thead><tbody>${evs.map(([k, v]) => `<tr${k === a.a ? ' style="font-weight:600"' : ''}><td>${NAMEC[k]}${k === a.right ? ' ✓' : ''}</td><td class="n">${sgnP(v)}</td></tr>`).join('')}</tbody></table></div>
          <p class="note">${s.tc === null ? 'EV moyenne de la ligne, sabot complet (' + esc(G.label) + ').' : 'EV au TC ' + tcS(s.tc) + ' (sabot moyen à mi-sabot).'}</p>
          <div class="row"><button class="btn primary" data-act="bjnext">Suivante (Entrée)</button><button class="btn small" data-act="bjcell" data-k="${cellKey(s.row, s.up)}" data-tab="bjstrat">Voir la case</button></div>`;
      }
      body = `<section class="panel bjspot"><div class="row" style="justify-content:space-between"><span class="eyebrow">${s.tc === null ? 'Stratégie de base' : 'Indices ' + esc(G.idxSys)} · ${esc(G.label)}</span>${s.tc !== null ? `<span class="pill acc">True count ${esc(G.idxSys)} ${tcS(s.tc)}</span>` : ''}${b.opts.timer && !a ? `<span class="pill" id="bjtimer">${b.opts.timer} s</span>` : ''}</div>
        <div class="bjfelt"><div><span class="note">Croupier</span><div class="cards">${cardHTML(s.upCard)}${G.rules.peek ? backHTML() : ''}</div></div><div><span class="note">Toi · ${totalTxt(s.cards)}</span>${cardsRow(s.cards)}</div></div>
        <div class="row">${btns}</div>${verdict}</section>`;
    }
    const tbls = ['hard', 'soft', 'pair'].map((kind) => { const rows = BJ.ROWS.filter((r) => r.kind === kind); return `<table class="t bjchart bjheat"><thead><tr><th></th>${BJ.UPS.map((u) => `<th class="n">${UPN(u)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td>${BJ.UPS.map((u) => { const c = b.cells[cellKey(r.id, u)]; const col = !c ? 'var(--sunk)' : c.st >= 3 ? 'color-mix(in srgb, var(--good) 45%, var(--surface))' : c.ok / c.n >= 0.8 ? 'color-mix(in srgb, var(--gold) 35%, var(--surface))' : 'color-mix(in srgb, var(--bad) 40%, var(--surface))'; return `<td style="background:${col}" title="${c ? c.ok + '/' + c.n : 'jamais vue'}"></td>`; }).join('')}</tr>`).join('')}</tbody></table>`; }).join('');
    return head('Entraîneur', 'Chaque décision est notée contre la stratégie exacte de tes règles, avec l\'EV de chaque action. Raccourcis : T tirer, S rester, D doubler, P séparer, A abandonner, Entrée pour la suivante.') +
      `<div class="row">${MODES.map(([k, l]) => `<button class="chip" aria-pressed="${tr.mode === k}" data-act="bjmode" data-m="${k}">${l}${k === 'review' && dueBJ().length ? ' · ' + dueBJ().length : ''}</button>`).join('')}</div>
      ${tr.mode === 'block' ? `<div class="row">${BLOCKS.map(([k, l]) => `<button class="chip" aria-pressed="${tr.block === k}" data-act="bjblock" data-b="${k}">${l}</button>`).join('')}</div>` : ''}
      ${(tr.mode === 'dev' || tr.mode === 'mix') && G.sysNote ? `<p class="note">${esc(G.sysNote)}</p>` : ''}
      <div class="row"><label class="note">Chrono par décision <select data-bjtimer>${[0, 2, 3, 5].map((n) => `<option value="${n}" ${b.opts.timer === n ? 'selected' : ''}>${n ? n + ' s' : 'aucun'}</option>`).join('')}</select></label><span class="note">Session : ${tr.ok}/${tr.n}</span></div>
      ${body}
      <section class="panel"><div class="row" style="justify-content:space-between"><h2>Ta maîtrise case par case</h2><span class="note">${m.mast}/${m.cells} cases réussies 3 fois de suite · ${m.acc === null ? '—' : pc(m.acc)} sur les ${m.n} dernières</span></div>
        <div class="bjheats">${tbls}</div><p class="note"><span class="dot" style="background:color-mix(in srgb, var(--good) 45%, var(--surface))"></span>maîtrisée <span class="dot" style="background:color-mix(in srgb, var(--gold) 35%, var(--surface))"></span>80 % et plus <span class="dot" style="background:color-mix(in srgb, var(--bad) 40%, var(--surface))"></span>à travailler <span class="dot" style="background:var(--sunk)"></span>jamais vue</p></section>`;
  };
  AFTER.bjentr = () => {
    const b = P(), s = tr.spot;
    if (tr.tInt) { clearInterval(tr.tInt); tr.tInt = null; }
    if (!s || tr.ans || s.kind === 'quiz' || s.kind === 'ins') return;
    tr.t0 = Date.now();
    if (!b.opts.timer) return;
    const end = tr.t0 + b.opts.timer * 1000;
    tr.tInt = setInterval(() => {
      if (tabNow() !== 'bjentr' || tr.ans) { clearInterval(tr.tInt); tr.tInt = null; return; }
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000)), el = $('#bjtimer'); if (el) el.textContent = left + ' s';
      if (left <= 0) { clearInterval(tr.tInt); tr.tInt = null; answer('__timeout'); }
    }, 200);
  };
  ACT.bjans = (t) => answer(t.dataset.a);
  ACT.bjins = (t) => answer(t.dataset.v);
  ACT.bjnext = () => { newSpot(); render(); };
  ACT.bjmode = (t) => { tr.mode = t.dataset.m; newSpot(); render(); };
  ACT.bjblock = (t) => { tr.block = t.dataset.b; newSpot(); render(); };
  ACT.bjrq = (t) => {
    const s = tr.spot, mod = K.MODULES.find((x) => x.id === s.mod), q = mod.quiz[s.qi], ok = +t.dataset.i === q.ok;
    tr.ans = { a: +t.dataset.i, ok }; reviewGrade(s.key, null, ok ? 3 : 1); save(); render();
  };
  ONCHANGE.push((t) => { if (t.dataset.bjtimer !== undefined) { P().opts.timer = +t.value; save(); render(); return true; } });

  // =====================================================================
  // Comptage (tous les systèmes)
  // =====================================================================
  const cd = { drill: 'deck', st: 'idle', cards: [], i: 0, rc: 0, t0: 0, t1: 0, res: null, speed: 700, nCards: 20, group: 1, iv: null, q: null, show: 3, tg: null };
  const DRILLS = [['tags', 'Valeurs du système'], ['deck', 'Paquet chrono'], ['flash', 'Défilement'], ['round', 'Tour de table'], ['tc', 'True count'], ['tray', 'Bac à défausse'], ['ramp', 'Rampe de mises']];
  const tg = (c) => tagOf(sysOf(), c);
  const sysValues = (S) => [...new Set(Array.from({ length: 52 }, (_, c) => tagOf(S, c)))].sort((a, b) => b - a);
  const fullDeck = (S) => Array.from({ length: 52 }, (_, c) => tagOf(S, c)).reduce((a, b) => a + b, 0);
  const sysLine = (S) => { const groups = {}; for (const [v, l] of [[1, 'A'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [7, '7'], [8, '8'], [9, '9'], [10, '10']]) { const x = S.red7 && v === 7 ? 'r7' : S.t[v]; (groups[x] ||= []).push(l); } return Object.entries(groups).map(([x, ls]) => `${ls.join(', ')} : ${x === 'r7' ? '7 rouge +1, 7 noir 0' : tagTxt(+x)}`).join(' · '); };
  function deck52() { return shuffle([...Array(52).keys()]); }
  function cdReset() { if (cd.iv) { clearInterval(cd.iv); cd.iv = null; } cd.st = 'idle'; cd.res = null; cd.q = null; cd.cards = []; cd.i = 0; }
  const parseNum = (v) => { const x = parseFloat(String(v).trim().replace('−', '-').replace('+', '').replace(',', '.')); return Number.isFinite(x) ? x : NaN; };
  function cdQuestion() {
    const G = game(), b = P(), S = sysOf();
    if (cd.drill === 'tc') { const decks = G.rules.decks, left = Math.max(0.5, Math.round((0.5 + rnd() * (decks - 1)) * 2) / 2), sc = Math.max(1, Math.round(sysData(G, S)?.scale || 1)), tc0 = (ri(13) - 4) * sc, rc = Math.round(tc0 * left + (rnd() - 0.5) * left * sc); cd.q = { rc, left, ans: Math.trunc(rc / left) }; }
    if (cd.drill === 'tray') { const decks = G.rules.decks, out = Math.round((0.5 + rnd() * (decks - 1)) * 2) / 2; cd.q = { decks, out, left: decks - out, jitter: (rnd() - 0.5) * 0.12 }; }
    if (cd.drill === 'ramp') { const tc = ri(10) - 3; cd.q = { tc, ans: rampUnits(b.ramp, tc) }; }
    if (cd.drill === 'tags') { const c = ri(52); cd.q = { c, ans: tg(c), t0: Date.now() }; }
    cd.st = 'ask'; cd.res = null;
  }
  function cdStart() {
    cdReset();
    if (['tc', 'tray', 'ramp', 'tags'].includes(cd.drill)) return cdQuestion();
    if (cd.drill === 'deck') { cd.cards = deck52(); cd.i = 0; cd.st = 'run'; cd.t0 = 0; return; }
    if (cd.drill === 'flash') {
      cd.cards = deck52().slice(0, cd.nCards); cd.i = 0; cd.st = 'run';
      cd.iv = setInterval(() => { cd.i = Math.min(cd.cards.length, cd.i + cd.group); if (cd.i >= cd.cards.length) { clearInterval(cd.iv); cd.iv = null; setTimeout(() => { cd.st = 'ask'; render(); }, cd.speed); } if (tabNow() === 'bjcompte') render(); else { clearInterval(cd.iv); cd.iv = null; } }, cd.speed);
      return;
    }
    if (cd.drill === 'round') {
      const d = deck52(); let k = 0; const hands = [], n = 3 + ri(4);
      for (let i = 0; i < n; i++) { const h = [d[k++], d[k++]]; while (handOf(h).t < 13 && rnd() < 0.7) h.push(d[k++]); hands.push(h); }
      const dealer = [d[k++], d[k++]]; while (handOf(dealer).t < 17) dealer.push(d[k++]);
      cd.cards = { hands, dealer }; cd.st = 'run';
      cd.iv = setTimeout(() => { cd.iv = null; cd.st = 'ask'; if (tabNow() === 'bjcompte') render(); }, cd.show * 1000);
    }
  }
  function rampUnits(ramp, tc) { return tc <= 0 ? ramp[0] : ramp[Math.min(6, tc)]; }
  function cdRecord(k, ok, extra) { const c = P().count[k] ||= { ok: 0, n: 0, best: null, last: [] }; c.n++; if (ok) c.ok++; c.last.push(extra || (ok ? 1 : 0)); if (c.last.length > 50) c.last.shift(); save(); }
  const sysSelect = () => { const S = sysOf(); return `<label class="note">Système <select data-bjsys>${CT.SYSTEMS.map((x) => `<option value="${x.id}" ${x.id === S.id ? 'selected' : ''}>${esc(x.name)}${x.balanced ? '' : ' (déséquilibré)'}</option>`).join('')}</select></label>`; };
  VIEWS.bjcompte = () => {
    const b = P(), S = sysOf(), c = b.count[cd.drill] || { ok: 0, n: 0 }, vals = sysValues(S), btnVals = (act) => vals.map((v) => `<button class="btn" data-act="${act}" data-v="${v}">${tagTxt(v)}</button>`).join('');
    let body = '';
    if (cd.drill === 'tags') {
      if (cd.st === 'idle') body = `<p>Une carte s'affiche : donne sa valeur dans le système ${esc(S.name)}, le plus vite possible. Objectif : 50 de suite sans erreur, moins d'une seconde chacune.</p><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else { const q = cd.q; body = `<div class="bjbig">${cardHTML(q.c)}</div>${cd.st === 'ask' ? `<div class="row">${btnVals('bjtag')}</div>` : `<div class="verdict bad"><b>Faux : ${tagTxt(q.ans)}</b><span>${esc(sysLine(S))}</span></div><div class="row"><button class="btn primary" data-act="bjcdq">Suivante (Entrée)</button></div>`}${cd.tg ? `<p class="note">Série : ${cd.tg.streak} · temps moyen ${fr(cd.tg.ms / Math.max(1, cd.tg.n) / 1000, 2)} s</p>` : ''}`; }
    } else if (cd.drill === 'deck') {
      if (cd.st === 'idle') body = `<p>51 cartes défilent quand tu appuies sur <kbd>Espace</kbd> (ou le bouton). Tiens le running count ${esc(S.name)}. À la fin, donne la valeur de la 52e carte, cachée : un paquet complet vaut ${tagTxt(fullDeck(S))} dans ce système, donc ton compte final l'indique. Le chrono part à la première carte.</p><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else if (cd.st === 'run') { const c0 = cd.cards[cd.i]; body = `<div class="row" style="justify-content:space-between"><span class="note">Carte ${cd.i + 1}/51</span><span class="mono" id="bjclock">${cd.t0 ? fr((Date.now() - cd.t0) / 1000, 1) + ' s' : '0,0 s'}</span></div><div class="bjbig">${cardHTML(c0)}</div><div class="row"><button class="btn primary" data-act="bjflip">Carte suivante (Espace)</button></div>`; }
      else if (cd.st === 'ask') body = `<p>Temps : <strong>${fr((cd.t1 - cd.t0) / 1000, 1)} s</strong>. Valeur ${esc(S.name)} de la dernière carte :</p><div class="row">${btnVals('bjlast')}</div>`;
      else if (cd.st === 'done') body = `<div class="verdict ${cd.res.ok ? 'good' : 'bad'}"><b>${cd.res.ok ? 'Juste' : 'Faux'} · ${fr(cd.res.s, 1)} s</b><span>La dernière carte : ${cardHTML(cd.cards[51], true)} (${tagTxt(cd.res.last)}). Running count après 51 cartes : ${tagTxt(cd.res.rc)} ; paquet complet : ${tagTxt(fullDeck(S))}.</span></div><div class="row"><button class="btn primary" data-act="bjcd">Recommencer</button></div>`;
    } else if (cd.drill === 'flash') {
      if (cd.st === 'idle') body = `<p>Les cartes défilent seules. Donne le running count ${esc(S.name)} à la fin.</p><div class="form"><label class="f">Cartes<select data-bjcd="nCards">${[10, 20, 30, 52].map((n) => `<option ${cd.nCards === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="f">Vitesse<select data-bjcd="speed">${[[1200, 'Lente'], [700, 'Moyenne'], [450, 'Rapide'], [300, 'Casino']].map(([v, l]) => `<option value="${v}" ${cd.speed === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="f">Cartes à la fois<select data-bjcd="group">${[1, 2, 3].map((n) => `<option ${cd.group === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else if (cd.st === 'run') body = `<div class="bjbig">${cd.cards.slice(Math.max(0, cd.i - cd.group), cd.i).map((x) => cardHTML(x)).join('')}</div><p class="note">${cd.i}/${cd.cards.length}</p>`;
      else if (cd.st === 'ask') body = `<form id="bjrcf" class="row"><label class="f">Running count<input name="rc" inputmode="decimal" autocomplete="off" autofocus></label><button class="btn primary">Valider</button></form>`;
      else body = `<div class="verdict ${cd.res.ok ? 'good' : 'bad'}"><b>${cd.res.ok ? 'Juste' : 'Faux'} : ${tagTxt(cd.res.rc)}</b><span>Tu as répondu ${esc(cd.res.got)}. ${cd.cards.map((x) => `${cardHTML(x, true)}`).join('')}</span></div><div class="row"><button class="btn primary" data-act="bjcd">Recommencer</button></div>`;
    } else if (cd.drill === 'round') {
      if (cd.st === 'idle') body = `<p>Un tour de table complet s'affiche quelques secondes : plusieurs mains et celle du croupier. Donne le compte ${esc(S.name)} de ce tour.</p><div class="form"><label class="f">Durée d'affichage<select data-bjcd="show">${[2, 3, 4, 6].map((n) => `<option value="${n}" ${cd.show === n ? 'selected' : ''}>${n} s</option>`).join('')}</select></label></div><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else if (cd.st === 'run') body = `<div class="bjround"><div><span class="note">Croupier</span>${cardsRow(cd.cards.dealer, true)}</div>${cd.cards.hands.map((h, i) => `<div><span class="note">Joueur ${i + 1}</span>${cardsRow(h, true)}</div>`).join('')}</div>`;
      else if (cd.st === 'ask') body = `<form id="bjrcf" class="row"><label class="f">Compte du tour<input name="rc" inputmode="decimal" autocomplete="off" autofocus></label><button class="btn primary">Valider</button></form>`;
      else body = `<div class="verdict ${cd.res.ok ? 'good' : 'bad'}"><b>${cd.res.ok ? 'Juste' : 'Faux'} : ${tagTxt(cd.res.rc)}</b><span>Tu as répondu ${esc(cd.res.got)}.</span></div><div class="bjround"><div><span class="note">Croupier</span>${cardsRow(cd.cards.dealer, true)}</div>${cd.cards.hands.map((h, i) => `<div><span class="note">Joueur ${i + 1}</span>${cardsRow(h, true)}</div>`).join('')}</div><div class="row"><button class="btn primary" data-act="bjcd">Recommencer</button></div>`;
    } else if (cd.drill === 'tc') {
      if (!S.balanced) body = `<p class="note">${esc(S.name)} est un compte déséquilibré : il se joue au running count, sans conversion. Choisis un système équilibré pour cet exercice.</p>`;
      else if (cd.st === 'idle') body = `<p>Running count et paquets restants : donne le true count ${esc(S.name)}, tronqué vers zéro (+2,8 → +2 ; −1,5 → −1).</p><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else body = `<div class="stats"><div class="stat"><span>Running count</span><b>${tcS(cd.q.rc)}</b></div><div class="stat"><span>Paquets restants</span><b>${fr(cd.q.left, 1)}</b></div></div>${cd.st === 'ask' ? `<form id="bjtcf" class="row"><label class="f">True count<input name="tc" inputmode="numeric" autocomplete="off" autofocus></label><button class="btn primary">Valider</button></form>` : `<div class="verdict ${cd.res.ok ? 'good' : 'bad'}"><b>${cd.res.ok ? 'Juste' : 'Faux'} : TC ${tcS(cd.q.ans)}</b><span>${tcS(cd.q.rc)} ÷ ${fr(cd.q.left, 1)} = ${fr(cd.q.rc / cd.q.left, 2)}, tronqué vers zéro.</span></div><div class="row"><button class="btn primary" data-act="bjcdq">Suivante (Entrée)</button></div>`}`;
    } else if (cd.drill === 'tray') {
      if (cd.st === 'idle') body = `<p>Le bac à défausse montre les cartes jouées. Estime les paquets restants dans le sabot, au demi-paquet près.</p><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else { const q = cd.q, H = 180, h = Math.max(4, (q.out + q.jitter) / q.decks * H);
        body = `<div class="row" style="align-items:flex-end;gap:24px"><svg viewBox="0 0 90 ${H + 20}" width="90" height="${H + 20}" role="img" aria-label="Bac à défausse"><rect x="10" y="10" width="70" height="${H}" rx="4" fill="none" stroke="var(--line)" stroke-width="2"/>${Array.from({ length: Math.round(h / 3) }, (_, i) => `<rect x="14" y="${10 + H - (i + 1) * 3}" width="62" height="2.2" fill="${i % 2 ? '#e9e2e4' : '#f6f1f2'}" stroke="#cfc3c7" stroke-width=".3"/>`).join('')}</svg>
          <div class="note">Sabot de ${q.decks} jeux · bac plein = ${q.decks} paquets.</div></div>
          ${cd.st === 'ask' ? `<div class="row">${Array.from({ length: q.decks * 2 - 1 }, (_, i) => (i + 1) / 2).map((v) => `<button class="btn small" data-act="bjtray" data-v="${v}">${fr(v, 1)}</button>`).join('')}</div><p class="note">Paquets restants ?</p>` : `<div class="verdict ${cd.res.ok ? 'good' : 'bad'}"><b>${cd.res.ok ? 'Juste' : 'Faux'} : ${fr(q.left, 1)} paquets restants</b><span>${fr(q.out, 1)} paquets en défausse sur ${q.decks}. Tu as répondu ${fr(cd.res.got, 1)}.</span></div><div class="row"><button class="btn primary" data-act="bjcdq">Suivante (Entrée)</button></div>`}`; }
    } else if (cd.drill === 'ramp') {
      if (cd.st === 'idle') body = `<p>Un true count s'affiche : donne ta mise en unités selon ta rampe (définie dans Bankroll, en TC Hi-Lo : ${b.ramp.map((u, i) => (i === 0 ? 'TC ≤ 0' : i === 6 ? 'TC ≥ +6' : 'TC ' + tcS(i)) + ' → ' + u).join(' · ')}).</p><div class="row"><button class="btn primary" data-act="bjcd">Commencer</button></div>`;
      else { const opts = [...new Set(b.ramp)].sort((x, y) => x - y);
        body = `<div class="stats"><div class="stat hero"><span>True count</span><b>${tcS(cd.q.tc)}</b></div></div>${cd.st === 'ask' ? `<div class="row">${opts.map((u) => `<button class="btn" data-act="bjramp" data-v="${u}">${u} unité${u > 1 ? 's' : ''}</button>`).join('')}</div>` : `<div class="verdict ${cd.res.ok ? 'good' : 'bad'}"><b>${cd.res.ok ? 'Juste' : 'Faux'} : ${cd.q.ans} unité${cd.q.ans > 1 ? 's' : ''}</b></div><div class="row"><button class="btn primary" data-act="bjcdq">Suivante (Entrée)</button></div>`}`; }
    }
    const st = DRILLS.map(([k, l]) => { const s = b.count[k] || { n: 0, ok: 0 }; return `<div class="stat"><span>${l}</span><b>${s.n ? pc(s.ok / s.n, 0) : '—'}</b><span>${s.n} essais${k === 'deck' && s.best ? ' · record ' + fr(s.best, 1) + ' s' : ''}</span></div>`; }).join('');
    return head('Comptage', `Système actuel : <strong>${esc(S.name)}</strong> — ${esc(sysLine(S))}. ${S.balanced ? 'Équilibré : running count ÷ paquets restants = true count.' : 'Déséquilibré : départ ' + tagTxt(CT.irc(S, game().rules.decks)) + ' en sabot de ' + game().rules.decks + ', joué au running count.'}`) +
      `<div class="row">${sysSelect()}<button class="btn small" data-tab="bjsys">Comparer les systèmes</button></div>
      <div class="row">${DRILLS.map(([k, l]) => `<button class="chip" aria-pressed="${cd.drill === k}" data-act="bjdrill" data-d="${k}">${l}</button>`).join('')}</div>
      <section class="panel"><span class="eyebrow">${esc(DRILLS.find((x) => x[0] === cd.drill)[1])} · ${esc(S.name)} · ${c.n ? c.ok + '/' + c.n + ' justes' : 'premier essai'}</span>${body}</section>
      <div class="stats">${st}</div>`;
  };
  AFTER.bjcompte = () => { const f = $('#bjrcf input, #bjtcf input'); if (f) f.focus(); if (cd.drill === 'deck' && cd.st === 'run' && cd.t0) { const tick = () => { const el = $('#bjclock'); if (!el || cd.st !== 'run') return; el.textContent = fr((Date.now() - cd.t0) / 1000, 1) + ' s'; requestAnimationFrame(tick); }; requestAnimationFrame(tick); } };
  ACT.bjdrill = (t) => { cd.drill = t.dataset.d; cdReset(); render(); };
  ACT.bjcd = () => { cd.tg = cd.drill === 'tags' ? { n: 0, ms: 0, streak: 0 } : cd.tg; cdStart(); render(); };
  ACT.bjcdq = () => { cdQuestion(); render(); };
  ONCHANGE.push((t) => { if (t.dataset.bjsys !== undefined) { P().sys = t.value; cdReset(); tbl = null; save(); render(); return true; } });
  ACT.bjtag = (t) => {
    const v = +t.dataset.v, q = cd.q, ok = Math.abs(v - q.ans) < 1e-9, ms = Date.now() - q.t0;
    cd.tg ||= { n: 0, ms: 0, streak: 0 }; cd.tg.n++; cd.tg.ms += ms; cd.tg.streak = ok ? cd.tg.streak + 1 : 0;
    cdRecord('tags', ok);
    if (ok) { cdQuestion(); render(); } else { cd.st = 'done'; render(); }
  };
  ACT.bjflip = () => {
    if (cd.st !== 'run' || cd.drill !== 'deck') return;
    if (!cd.t0) cd.t0 = Date.now();
    cd.i++;
    if (cd.i >= 51) { cd.t1 = Date.now(); cd.st = 'ask'; }
    render();
  };
  ACT.bjlast = (t) => {
    const S = sysOf(), rc = cd.cards.slice(0, 51).reduce((a, x) => a + tg(x), 0), last = tg(cd.cards[51]), ok = Math.abs(+t.dataset.v - last) < 1e-9, s = (cd.t1 - cd.t0) / 1000, b = P();
    cd.res = { ok, s, rc, last }; cd.st = 'done';
    if (ok && S.id === 'hilo' && (!b.count.deck.best || s < b.count.deck.best)) b.count.deck.best = Math.round(s * 10) / 10;
    cdRecord('deck', ok, { ok, s: Math.round(s * 10) / 10, sys: S.id }); render();
  };
  ACT.bjtray = (t) => { const v = +t.dataset.v, ok = Math.abs(v - cd.q.left) < 0.01; cd.res = { ok, got: v }; cd.st = 'done'; cdRecord('tray', ok); render(); };
  ACT.bjramp = (t) => { const v = +t.dataset.v, ok = v === cd.q.ans; cd.res = { ok }; cd.st = 'done'; cdRecord('ramp', ok); render(); };
  ONCHANGE.push((t) => { if (t.dataset.bjcd) { cd[t.dataset.bjcd] = +t.value; render(); return true; } });
  document.addEventListener('submit', (e) => {
    const id = e.target.id; if (id !== 'bjrcf' && id !== 'bjtcf' && id !== 'bjtrc') return;
    e.preventDefault();
    const v = String(new FormData(e.target).get(id === 'bjtcf' ? 'tc' : 'rc') || '').trim(), n = parseNum(v);
    if (id === 'bjtrc') return tblCountAnswer(n);
    if (id === 'bjtcf') { const ok = n === cd.q.ans; cd.res = { ok, got: v }; cd.st = 'done'; cdRecord('tc', ok); return render(); }
    const cards = cd.drill === 'round' ? [...cd.cards.dealer, ...cd.cards.hands.flat()] : cd.cards, rc = cards.reduce((a, x) => a + tg(x), 0), ok = Math.abs(n - rc) < 1e-9;
    cd.res = { ok, rc, got: v || '(vide)' }; cd.st = 'done'; cdRecord(cd.drill, ok); render();
  });
  // =====================================================================
  // Table d'entraînement
  // =====================================================================
  let tbl = null;
  function tblNew() {
    const G = gameS(), r = G.rules, b = P();
    const t = { rules: r, G, sys: G.sys, bal: G.sys.balanced, n: r.decks, shoe: [], pos: 0, cut: 0, rc: 0, others: b.tblOpts?.others ?? 2, pen: b.tblOpts?.pen ?? 0.75, mode: b.tblOpts?.mode || 'train', showCount: false, phase: 'bet', hands: [], cur: 0, dealer: [], holeUp: false, oth: [], bet: 1, msgs: [], fb: [], sess: { hands: 0, net: 0, dec: 0, err: 0, evl: 0, cnt: 0, cntOk: 0, bets: 0, betOk: 0, shoes: 0, cats: {}, betLog: [] }, ask: null, shuffleNote: false };
    tblShuffle(t); return t;
  }
  const catAdd = (t, c, ok) => { const q = (t.sess.cats[c] ||= [0, 0]); q[0]++; if (!ok) q[1]++; };
  // Visibilité de la rampe : corrélation entre la mise et le true count sur la séance (indicateur, pas une probabilité).
  function betCorr(L) { const n = L.length; if (n < 20) return null; let mx = 0, my = 0; for (const [x, y] of L) { mx += x; my += y; } mx /= n; my /= n; let c = 0, vx = 0, vy = 0; for (const [x, y] of L) { c += (x - mx) * (y - my); vx += (x - mx) ** 2; vy += (y - my) ** 2; } return vx && vy ? c / Math.sqrt(vx * vy) : 0; }
  function tblShuffle(t) { t.shoe = []; for (let d = 0; d < t.n; d++) t.shoe.push(...deck52()); shuffle(t.shoe); t.pos = 0; t.rc = CT.irc(t.sys, t.n); t.cut = Math.floor(t.shoe.length * t.pen); t.sess.shoes++; t.shuffleNote = true; }
  const decksLeft = (t) => Math.max(0.5, (t.shoe.length - t.pos) / 52);
  // True count dans l'unité du système (équilibré) ; tcHL : équivalent Hi-Lo pour la rampe (÷ échelle du système).
  const tcOf = (t) => Math.trunc(t.rc / decksLeft(t));
  const tcHL = (t) => Math.trunc(t.rc / decksLeft(t) / (t.G.scale || 1));
  function tDraw(t, seen = true) { const c = t.shoe[t.pos++]; if (seen) t.rc += tagOf(t.sys, c); return c; }
  const reveal = (t, c) => { t.rc += tagOf(t.sys, c); };
  // Composition inconnue du joueur (sabot restant + carte cachée), au format du moteur.
  function compOf(t) { const s = new Array(11).fill(0); for (let i = t.pos; i < t.shoe.length; i++) s[val(t.shoe[i])]++; if (t.rules.peek && !t.holeUp && t.dealer[1] !== undefined) s[val(t.dealer[1])]++; return s; }
  function tblDeal() {
    const t = tbl, b = P(); t.fb = []; t.msgs = [];
    if (t.pos >= t.cut) tblShuffle(t);
    // Mise : comparée à la rampe au TC avant la donne.
    const tc = tcHL(t), want = rampUnits(b.ramp, tc);
    t.sess.betLog.push([t.bal ? t.rc / decksLeft(t) : 0, t.bet]); if (t.sess.betLog.length > 2000) t.sess.betLog.shift();
    if (t.bal) {
      t.sess.bets++; b.tbl.bets++; const betOk = t.bet === want; if (betOk) { t.sess.betOk++; b.tbl.betOk++; } catAdd(t, 'Mises', betOk);
      if (!betOk) t.fb.push({ bad: true, txt: `Mise : ${t.bet} unité${t.bet > 1 ? 's' : ''} ; ta rampe dit ${want} à TC ${t.G.scale > 1.01 ? 'Hi-Lo équivalent ' : ''}${tcS(tc)}.` });
    }
    t.betTC = tc;
    t.oth = []; for (let i = 0; i < t.others; i++) t.oth.push({ cards: [] });
    t.nsp = t.spots || 1; t.hands = Array.from({ length: t.nsp }, (_, k) => ({ cards: [], bet: t.bet, done: false, split: false, spot: k })); t.cur = 0; t.dealer = []; t.holeUp = false;
    for (let round = 0; round < 2; round++) {
      for (const o of t.oth) o.cards.push(tDraw(t));
      for (const h of t.hands) h.cards.push(tDraw(t));
      if (round === 0) t.dealer.push(tDraw(t)); else if (t.rules.peek) t.dealer.push(tDraw(t, false));
    }
    t.phase = 'play'; t.insTaken = null;
    const up = val(t.dealer[0]);
    if (up === 1) { t.phase = 'ins'; return; }
    tblAfterIns();
  }
  function tblAfterIns() {
    const t = tbl, up = val(t.dealer[0]);
    if (t.rules.peek && (up === 1 || up === 10) && isBJ(t.dealer)) { t.holeUp = true; reveal(t, t.dealer[1]); for (const o of t.oth) void o; return tblSettle(); }
    for (const h of t.hands) if (isBJ(h.cards)) h.done = true;
    // Les autres joueurs (assis avant toi) jouent la stratégie de base.
    for (const o of t.oth) { while (!isBJ(o.cards)) { const h = handOf(o.cards); const row = rowOf(o.cards, false), a = row && row !== 'soft12' && t.G.table[row] ? recommend(t.G, row, up, { stand: true, hit: true, double: o.cards.length === 2 && t.G.table[row][up].ev.double !== undefined, split: false, surrender: false }, null) : h.t < 17 ? 'hit' : 'stand'; if (h.t >= 21 || a === 'stand' || a === 'surrender') break; o.cards.push(tDraw(t)); if (a === 'double') break; } }
    while (t.cur < t.hands.length && t.hands[t.cur].done) t.cur++;
    t.phase = t.cur >= t.hands.length ? 'dealer' : 'play';
    if (t.phase === 'dealer') tblDealer();
    else tblMaybeAskCount();
  }
  function tblMaybeAskCount() { const t = tbl; if (t.mode !== 'free' && rnd() < 0.12) t.ask = { at: 'play' }; }
  function availFor(t, h) {
    const cs = h.cards, two = cs.length === 2, hh = handOf(cs), r = t.rules, nH = t.hands.filter((x) => x.spot === h.spot).length;
    const pair = two && val(cs[0]) === val(cs[1]), canSplit = pair && nH < r.maxHands && (val(cs[0]) !== 1 || !h.split || r.rsa);
    const dOk = two && (r.double === 'any' || (!hh.soft && (r.double === '9-11' ? hh.t >= 9 && hh.t <= 11 : hh.t >= 10 && hh.t <= 11))) && (!h.split || r.das);
    return { stand: true, hit: !(h.aces && !r.hsa), double: dOk && !(h.aces && !r.hsa), split: canSplit, surrender: two && !h.split && r.surrender && r.peek };
  }
  function tblRecommend(t, h) {
    const up = val(t.dealer[0]), avail = availFor(t, h), row = rowOf(h.cards, avail.split), tc = t.bal ? tcOf(t) : null;
    if (row === 'soft12') return { act: 'hit', avail, row, tc };
    if (!row || !t.G.table[row]) return { act: handOf(h.cards).t >= 17 ? 'stand' : 'hit', avail, row, tc };
    return { act: recommend(t.G, row, up, avail, tc), avail, row, tc };
  }
  function exactEV(t, h, avail) {
    try {
      const comp = compOf(t), up = val(t.dealer[0]), calc = BJ.Calc(t.rules, comp, true), cs = h.cards.map(val), hh = handOf(h.cards);
      let ev;
      if (cs.length === 2) ev = calc.actions(comp, up, cs[0], cs[1]);
      else { const lost = t.rules.peek ? 0 : 1, n = calc.node(comp, up, hh.sum, hh.ace, lost); ev = { stand: n.stand, hit: n.hit }; }
      return Object.fromEntries(Object.entries(ev).filter(([k]) => avail[k]));
    } catch (e) { return null; }
  }
  function tblAct(a) {
    const t = tbl, b = P(); if (t.phase !== 'play' || t.ask) return;
    const h = t.hands[t.cur], rec = tblRecommend(t, h);
    if (!rec.avail[a]) return;
    const ok = a === rec.act, ev = exactEV(t, h, rec.avail), loss = ev && ev[rec.act] !== undefined && ev[a] !== undefined ? Math.max(0, ev[rec.act] - ev[a]) : 0;
    t.sess.dec++; b.tbl.dec++;
    if (!ok) { t.sess.err++; b.tbl.err++; t.sess.evl += loss * h.bet; b.tbl.evl += loss * h.bet; }
    { const basicAct = rec.row && t.G.table[rec.row] ? recommend(t.G, rec.row, val(t.dealer[0]), rec.avail, null) : rec.act; catAdd(t, rec.act !== basicAct || (rec.tc !== null && a !== rec.act && a === basicAct) ? 'Indices' : !rec.row || rec.row[0] === 'h' || rec.row === 'soft12' ? 'Mains dures' : rec.row[0] === 's' ? 'Mains souples' : 'Paires', ok); }
    const devTxt = rec.row && t.G.indices.find((d) => d.row === rec.row && d.up === val(t.dealer[0])) ? ` (TC ${tcS(rec.tc)})` : '';
    t.fb.push({ bad: !ok, txt: `${ok ? '✓' : '✗'} ${totalTxt(h.cards)} contre ${UPN(val(t.dealer[0]))} : ${ACTFR[a]}${ok ? '' : ` — juste : ${ACTFR[rec.act]}${devTxt}${loss ? `, coût ${fr(loss * 100, 1)} % de la mise` : ''}`}` });
    if (!ok && rec.row && rec.row !== 'soft12' && t.G.table[rec.row] && rec.act === recommend(t.G, rec.row, val(t.dealer[0]), rec.avail, null) && h.cards.length === 2) reviewGrade('bs:' + cellKey(rec.row, val(t.dealer[0])), { kind: 'base', row: rec.row, up: val(t.dealer[0]), tc: null }, 1);
    if (a === 'stand') h.done = true;
    else if (a === 'hit') { h.cards.push(tDraw(t)); if (handOf(h.cards).t >= 21) h.done = true; }
    else if (a === 'double') { h.bet *= 2; h.cards.push(tDraw(t)); h.done = true; h.doubled = true; }
    else if (a === 'surrender') { h.surr = true; h.done = true; }
    else if (a === 'split') {
      const c2 = h.cards.pop(), aces = val(c2) === 1;
      h.split = true; h.aces = aces; h.cards.push(tDraw(t));
      t.hands.splice(t.cur + 1, 0, { cards: [c2, tDraw(t)], bet: h.bet, done: false, split: true, aces, spot: h.spot });
      if (aces && !t.rules.hsa) { h.done = true; t.hands[t.cur + 1].done = true; }
    }
    if (handOf(h.cards).t >= 21) h.done = true;
    while (t.cur < t.hands.length && t.hands[t.cur].done) t.cur++;
    if (t.cur >= t.hands.length) tblDealer();
    else if (handOf(t.hands[t.cur].cards).t >= 21) { t.hands[t.cur].done = true; tblAct2(); }
    save(); render();
  }
  function tblAct2() { const t = tbl; while (t.cur < t.hands.length && t.hands[t.cur].done) t.cur++; if (t.cur >= t.hands.length) tblDealer(); }
  function tblDealer() {
    const t = tbl;
    t.phase = 'dealer';
    if (t.rules.peek) { t.holeUp = true; reveal(t, t.dealer[1]); } else { t.dealer.push(tDraw(t)); t.holeUp = true; }
    const live = t.hands.some((h) => !h.surr && handOf(h.cards).t <= 21) || t.oth.some((o) => handOf(o.cards).t <= 21);
    const dBJ = isBJ(t.dealer);
    if (!dBJ && live && !(t.hands.every((h) => isBJ(h.cards) && !h.split) && !t.oth.length)) {
      for (;;) { const h = handOf(t.dealer); if (h.t > 17 || (h.t === 17 && !(t.rules.h17 && h.soft))) break; t.dealer.push(tDraw(t)); }
    }
    tblSettle();
  }
  function tblSettle() {
    const t = tbl, b = P(), d = handOf(t.dealer), dBJ = isBJ(t.dealer);
    if (!t.holeUp) { t.holeUp = true; if (t.rules.peek) reveal(t, t.dealer[1]); }
    let net = 0, obo = null;
    if (t.insTaken) net += (dBJ ? t.bet : -t.bet / 2) * (t.nsp || 1);
    for (const h of t.hands) {
      const hh = handOf(h.cards), nat = isBJ(h.cards) && !h.split;
      if (h.surr) { net -= h.bet / 2; continue; }
      if (nat) { net += dBJ ? 0 : t.rules.bj * h.bet; continue; }
      if (hh.t > 21) { net -= h.bet; continue; }
      if (dBJ) { if (!t.rules.peek && t.rules.obo) { obo ||= {}; if (!obo[h.spot]) { net -= t.bet; obo[h.spot] = 1; } } else net -= h.bet; continue; }
      if (d.t > 21 || hh.t > d.t) net += h.bet; else if (hh.t < d.t) net -= h.bet;
    }
    t.last = net; t.sess.net += net; t.sess.hands++; b.tbl.hands++;
    t.phase = 'done';
    if (t.mode !== 'free' && rnd() < 0.15) t.ask = { at: 'end' };
    save();
  }
  function tblCountAnswer(n) {
    const t = tbl, b = P(); if (!t || !t.ask) return;
    const ok = Math.abs(n - t.rc) < 1e-9; catAdd(t, 'Compte', ok); t.sess.cnt++; b.tbl.cnt++; if (ok) { t.sess.cntOk++; b.tbl.cntOk++; }
    t.fb.push({ bad: !ok, txt: ok ? `✓ Running count juste : ${tagTxt(t.rc)}.` : `✗ Running count : ${tagTxt(t.rc)} (tu as dit ${Number.isFinite(n) ? tagTxt(n) : '—'}).` });
    t.ask = null; save(); render();
  }
  VIEWS.bjtable = () => {
    const b = P(), G = game();
    if (!tbl || tbl.G.label !== G.label || tbl.G.edge !== G.edge || tbl.sys.id !== sysOf().id) tbl = tblNew();
    const t = tbl, up = t.dealer[0], s = t.sess;
    const dealerCards = t.dealer.length ? `<div class="cards">${cardHTML(t.dealer[0])}${t.dealer.length > 1 ? (t.holeUp ? t.dealer.slice(1).map((c) => cardHTML(c)).join('') : backHTML()) : (t.phase !== 'bet' && t.rules.peek ? backHTML() : '')}</div>` : '';
    const showT = t.mode === 'train', tc = tcOf(t), out = t.pos / 52;
    let ctrl = '';
    if (t.ask) ctrl = `<form id="bjtrc" class="row"><label class="f">Contrôle : running count ?<input name="rc" inputmode="numeric" autocomplete="off" autofocus></label><button class="btn primary">Valider</button></form>`;
    else if (t.phase === 'bet' || t.phase === 'done') {
      const opts = [...new Set([1, 2, 3, 4, 5, 6, 8, 10, 12, ...b.ramp])].sort((x, y) => x - y);
      ctrl = `${t.phase === 'done' ? `<div class="verdict ${t.last > 0 ? 'good' : t.last < 0 ? 'bad' : ''}"><b>${t.last > 0 ? 'Gagné' : t.last < 0 ? 'Perdu' : 'Égalité'} : ${t.last > 0 ? '+' : ''}${fr(t.last, 1)} unité${Math.abs(t.last) > 1 ? 's' : ''}</b></div>` : ''}
        ${t.pos >= t.cut ? '<p class="pill warn">Carte de coupe atteinte : mélange à la prochaine donne.</p>' : ''}
        <div class="row"><span class="note">Mise :</span>${opts.map((u) => `<button class="chip" aria-pressed="${t.bet === u}" data-act="bjbet" data-v="${u}">${u}</button>`).join('')}<span class="note">Mains :</span>${[1, 2].map((n) => `<button class="chip" aria-pressed="${(t.spots || 1) === n}" data-act="bjspots" data-v="${n}">${n}</button>`).join('')}</div>
        <div class="row"><button class="btn primary" data-act="bjdeal">Distribuer (Entrée)</button></div>`;
    } else if (t.phase === 'ins') ctrl = `<p>Le croupier montre un as. ${isBJ(t.hands[0].cards) ? 'Even money (assurance) ?' : 'Assurance ?'}</p><div class="row"><button class="btn" data-act="bjtins" data-v="1">Prendre (O)</button><button class="btn" data-act="bjtins" data-v="0">Refuser (N)</button></div>`;
    else if (t.phase === 'play') { const h = t.hands[t.cur], av = availFor(t, h); ctrl = `<div class="row">${['hit', 'stand', 'double', 'split', 'surrender'].filter((k) => av[k]).map((k) => `<button class="btn" data-act="bjtact" data-a="${k}">${NAMEC[k]} <kbd>${KEYS[k].toUpperCase()}</kbd></button>`).join('')}</div>`; }
    const fb = (showT || t.phase === 'bet' || t.phase === 'done') && t.fb.length ? `<div class="bjfb">${t.fb.filter((f) => showT || t.phase === 'done').map((f) => `<div class="${f.bad ? 'bad' : 'good'}">${esc(f.txt)}</div>`).join('')}</div>` : '';
    return head('Table d\'entraînement', 'Un sabot réel, des joueurs qui jouent avant toi, le croupier, la carte de coupe. Tu mises selon ta rampe, tu comptes, tu décides. Chaque décision est notée contre la stratégie de base et les indices au TC du moment.') +
      `<section class="panel"><div class="row"><label class="note">Mode <select data-bjto="mode"><option value="train" ${t.mode === 'train' ? 'selected' : ''}>Entraînement (correction immédiate)</option><option value="exam" ${t.mode === 'exam' ? 'selected' : ''}>Examen (correction en fin de main)</option><option value="free" ${t.mode === 'free' ? 'selected' : ''}>Libre (sans contrôle de compte)</option></select></label>
        <label class="note">Autres joueurs <select data-bjto="others">${[0, 1, 2, 3, 4, 5].map((n) => `<option ${t.others === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="note">Pénétration <select data-bjto="pen">${[0.6, 0.67, 0.75, 0.83].map((p) => `<option value="${p}" ${Math.abs(t.pen - p) < 0.001 ? 'selected' : ''}>${Math.round(p * 100)} %</option>`).join('')}</select></label>
        <button class="btn small" data-act="bjshowc">${t.showCount ? 'Masquer le compte' : 'Afficher le compte'}</button><button class="btn small" data-act="bjtreset">Nouveau sabot</button></div>
        <p class="note">${esc(G.label)} · ${esc(ruleTxt(t.rules))} · compte ${esc(t.sys.name)}${t.bal ? '' : ' : rampe et indices non notés (compte déséquilibré), stratégie de base et contrôles de compte notés'}.</p><div class="row">${sysSelect()}</div></section>
      <section class="panel bjtable">
        <div class="row" style="justify-content:space-between"><span class="note">Sabot : ${fr(out, 1)} paquet${out >= 2 ? 's' : ''} joué${out >= 2 ? 's' : ''} sur ${t.n}${t.showCount ? ` · RC ${tagTxt(t.rc)}${t.bal ? ' · TC ' + tcS(tc) : ''}` : ''}</span><span class="note">${t.shuffleNote && t.pos < 20 ? 'Sabot mélangé : compte à ' + tagTxt(CT.irc(t.sys, t.n)) + '.' : ''}</span></div>
        <div class="bjdealer"><span class="note">Croupier${t.holeUp && t.dealer.length ? ' · ' + totalTxt(t.dealer) : ''}</span>${dealerCards}</div>
        ${t.oth.length ? `<div class="bjround">${t.oth.map((o, i) => `<div><span class="note">Joueur ${i + 1} · ${totalTxt(o.cards)}</span>${cardsRow(o.cards, true)}</div>`).join('')}</div>` : ''}
        <div class="bjhands">${t.hands.map((h, i) => h.cards.length ? `<div class="bjhand${t.phase === 'play' && i === t.cur ? ' on' : ''}"><span class="note">Toi${t.hands.length > 1 ? ' · main ' + (i + 1) : ''} · ${totalTxt(h.cards)} · ${h.bet} u${h.surr ? ' · abandon' : ''}</span>${cardsRow(h.cards)}</div>` : '').join('')}</div>
        ${ctrl}${fb}</section>
      <div class="stats"><div class="stat hero"><span>Séance</span><b>${s.net >= 0 ? '+' : ''}${fr(s.net, 1)} u</b><span>${s.hands} mains · ${s.shoes} sabot${s.shoes > 1 ? 's' : ''}</span></div>
        <div class="stat"><span>Décisions justes</span><b>${s.dec ? pc(1 - s.err / s.dec) : '—'}</b><span>${s.err} erreur${s.err > 1 ? 's' : ''} · EV perdue ${fr(s.evl, 2)} u</span></div>
        <div class="stat"><span>Mises selon la rampe</span><b>${s.bets ? pc(s.betOk / s.bets) : '—'}</b><span>${s.bets} mises</span></div>
        <div class="stat"><span>Contrôles de compte</span><b>${s.cnt ? s.cntOk + '/' + s.cnt : '—'}</b><span>total : ${b.tbl.cnt ? pc(b.tbl.cntOk / b.tbl.cnt) : '—'}</span></div></div>
      ${(() => { const cats = Object.entries(s.cats), r = betCorr(s.betLog), spread = s.betLog.length ? Math.max(...s.betLog.map((x) => x[1])) / Math.max(1, Math.min(...s.betLog.map((x) => x[1]))) : 1; return cats.length || r !== null ? `<div class="grid2"><section class="panel"><h2>Erreurs par type</h2><div class="tw"><table class="t bjt"><thead><tr><th>Type</th><th class="n">Décisions</th><th class="n">Erreurs</th><th class="n">Justesse</th></tr></thead><tbody>${cats.sort((a, b2) => b2[1][1] / b2[1][0] - a[1][1] / a[1][0]).map(([c, [n, e]]) => `<tr><td>${esc(c)}</td><td class="n">${n}</td><td class="n">${e}</td><td class="n" style="color:var(${e / n > 0.02 ? '--bad' : '--good'})">${pc(1 - e / n, 0)}</td></tr>`).join('')}</tbody></table></div><p class="note">Le type le plus faible en premier : c'est lui à revoir dans l'Entraîneur ou le Comptage.</p></section>
        <section class="panel"><h2>Visibilité de ta rampe</h2>${r === null ? '<p class="note">Au moins 20 mains pour mesurer.</p>' : `<div class="stats"><div class="stat ${r > 0.8 ? 'hero' : ''}"><span>Corrélation mise / true count</span><b>${fr(r, 2)}</b><span>écart joué 1-${fr(spread, 0)}</span></div></div><p class="note">${r > 0.8 ? 'Ta mise suit le compte de très près : c\'est exactement ce que cherche un surveillant. Couverture possible : sauts de mise plus progressifs, mise parfois laissée après une victoire, retour au minimum avec retard.' : r > 0.5 ? 'Corrélation nette, mais moins mécanique. Chaque point de corrélation en moins coûte un peu d\'espérance : la simulation de Bankroll le chiffre.' : 'Mise peu liée au compte : discrète, mais tu laisses une grande part de l\'avantage sur la table.'}</p><p class="note">Indicateur SIGMA 52 : corrélation de Pearson entre ta mise et le true count exact au moment de miser. Les seuils sont indicatifs ; aucun outil ne mesure la probabilité réelle d'être repéré.</p>`}</section></div>` : ''; })()}
      <p class="note">Le résultat en unités dépend surtout de la chance sur quelques centaines de mains. Ce qui se juge ici : décisions, compte, mises.</p>`;
  };
  AFTER.bjtable = () => { const f = $('#bjtrc input'); if (f) f.focus(); };
  ACT.bjbet = (t) => { tbl.bet = +t.dataset.v; render(); };
  ACT.bjspots = (t) => { tbl.spots = +t.dataset.v; render(); };
  ACT.bjdeal = () => { if (!tbl || tbl.ask || (tbl.phase !== 'bet' && tbl.phase !== 'done')) return; tbl.shuffleNote = false; tblDeal(); render(); };
  ACT.bjtins = (t) => {
    const T = tbl, b = P(); if (T.phase !== 'ins') return;
    const take = t.dataset.v === '1', want = T.bal ? tcOf(T) >= ins(T.G) : take, ok = take === want;
    T.insTaken = take; T.sess.dec++; b.tbl.dec++; if (!ok) { T.sess.err++; b.tbl.err++; } if (T.bal) catAdd(T, 'Assurance', ok);
    T.fb.push({ bad: !ok, txt: T.bal ? `${ok ? '✓' : '✗'} Assurance ${take ? 'prise' : 'refusée'} à TC ${tcS(tcOf(T))} (indice ${esc(T.G.idxSys)} : TC ≥ ${tcS(ins(T.G))}).` : `Assurance ${take ? 'prise' : 'refusée'} (non notée avec un compte déséquilibré).` });
    T.phase = 'play'; tblAfterIns(); save(); render();
  };
  ACT.bjtact = (t) => tblAct(t.dataset.a);
  ACT.bjshowc = () => { tbl.showCount = !tbl.showCount; render(); };
  ACT.bjtreset = () => { tbl = tblNew(); render(); };
  ONCHANGE.push((t) => {
    if (!t.dataset.bjto) return;
    const b = P(); b.tblOpts ||= {}; const k = t.dataset.bjto; b.tblOpts[k] = k === 'mode' ? t.value : +t.value; save();
    if (k === 'mode') tbl.mode = t.value; else { tbl = tblNew(); }
    render(); return true;
  });

  // =====================================================================
  // Bankroll et simulation
  // =====================================================================
  let simRun = null, simRes = null;
  VIEWS.bjbank = () => {
    const b = P(), G = game(), k = b.bank, R = simRes || b.lastSim;
    const kelly = (frac) => b.ramp.map((_, i) => { const tc = i === 0 ? 0 : i, e = (G.edgeByTC.find((x) => x[0] === tc) || [0, 0])[1]; return Math.max(1, Math.round(frac * k.bankroll * Math.max(0, e) / 1.33 / k.unit)); });
    const kh = kelly(0.5);
    let out = '';
    if (R) {
      const evh = R.mean * R.hph * R.unit, sdh = R.sd * Math.sqrt(R.hph) * R.unit, n0 = R.mean > 0 ? (R.sd / R.mean) ** 2 : null, ror = BJ.riskOfRuin(R.mean, R.sd, R.bankroll / R.unit);
      out = `<div class="stats"><div class="stat hero"><span>Espérance par heure</span><b>${eur(evh)}</b><span>${fr(R.mean * 100, 2)} u / 100 mains · ${fr(R.hph, 0)} mains/h</span></div>
        <div class="stat"><span>Écart-type par heure</span><b>${eur(sdh)}</b><span>${fr(R.sd * 10, 1)} u / 100 mains</span></div>
        <div class="stat"><span>Avantage simulé</span><b>${sgnP(R.edge, 2)}</b><span>gain ÷ total misé · mise moyenne ${fr(R.avgBet, 2)} u</span></div>
        <div class="stat"><span>N0</span><b>${n0 ? Math.round(n0).toLocaleString('fr-FR') : '∞'}</b><span>${n0 ? '≈ ' + Math.round(n0 / R.hph).toLocaleString('fr-FR') + ' h avant que l\'EV égale 1 écart-type' : 'espérance négative'}</span></div>
        <div class="stat"><span>DI · SCORE</span><b>${fr(1e4 * R.mean / R.sd, 1)}</b><span>SCORE ${fr(1e6 * R.mean * R.mean / (R.sd * R.sd), 1)} (gain / 100 mains à Kelly, bankroll de 10 000)</span></div>
        <div class="stat"><span>Risque de ruine</span><b>${pc(ror, 1)}</b><span>bankroll de ${eur(R.bankroll)} (${fr(R.bankroll / R.unit, 0)} u), formule de diffusion</span></div></div>
        <section class="panel"><h2>30 trajectoires de 100 heures</h2><canvas id="bjsimc" height="240" aria-label="Trajectoires de bankroll simulées"></canvas><p class="note">Chaque trajectoire tire 100 heures au hasard selon l'espérance et l'écart-type mesurés. Ligne rouge : bankroll à zéro.</p></section>
        <section class="panel"><h2>Fréquence des true counts</h2><div class="tw"><table class="t bjt"><thead><tr><th>TC</th>${R.tcs.map(([t]) => `<th class="n">${t <= -4 ? '≤ −4' : t >= 8 ? '≥ +8' : tcS(t)}</th>`).join('')}</tr></thead><tbody><tr><td>Mains</td>${R.tcs.map(([, f]) => `<td class="n">${pc(f, 1)}</td>`).join('')}</tr></tbody></table></div><p class="note">${fr(R.hands, 0)} mains simulées · ${esc(R.label)} · pénétration ${Math.round(R.pen * 100)} % · ${R.others} autre${R.others > 1 ? 's' : ''} joueur${R.others > 1 ? 's' : ''} · indices ${R.indices ? 'appliqués' : 'non appliqués'}.</p></section>`;
    }
    return head('Bankroll et simulation', 'Ta rampe de mises jouée sur des centaines de milliers de mains avec la stratégie et les indices de ton jeu : espérance, écart-type, N0, risque de ruine.') +
      `<section class="panel"><h2>Rampe de mises (unités)</h2><div class="form">${b.ramp.map((u, i) => `<label class="f">${i === 0 ? 'TC ≤ 0' : i === 6 ? 'TC ≥ +6' : 'TC ' + tcS(i)}<input data-bjramp="${i}" value="${u}" inputmode="numeric"></label>`).join('')}</div>
        <div class="row"><button class="btn small" data-act="bjkelly">Appliquer le demi-Kelly : ${kh.join(' · ')}</button><span class="note">Demi-Kelly : mise ≈ ½ × bankroll × avantage(TC) ÷ 1,33, en unités. Variance par main ≈ 1,33 (mesurée par la simulation).</span></div></section>
      <section class="panel"><h2>Paramètres</h2><div class="form">
        <label class="f">Unité (€)<input data-bjbank="unit" value="${k.unit}" inputmode="decimal"></label><label class="f">Bankroll (€)<input data-bjbank="bankroll" value="${k.bankroll}" inputmode="decimal"></label>
        <label class="f">Mains par heure<input data-bjbank="hph" value="${k.hph}" inputmode="numeric"></label>
        <label class="f">Pénétration<select data-bjbank="pen">${[0.6, 0.67, 0.75, 0.83].map((p) => `<option value="${p}" ${Math.abs(k.pen - p) < 0.001 ? 'selected' : ''}>${Math.round(p * 100)} %</option>`).join('')}</select></label>
        <label class="f">Autres joueurs<select data-bjbank="others">${[0, 1, 2, 3, 4, 5].map((n) => `<option ${k.others === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="f">Mains simulées<select data-bjbank="hands">${[100000, 300000, 1000000].map((n) => `<option value="${n}" ${k.hands === n ? 'selected' : ''}>${n.toLocaleString('fr-FR')}</option>`).join('')}</select></label>
        <label class="f">Indices<select data-bjbank="indices"><option value="1" ${k.indices ? 'selected' : ''}>Appliqués</option><option value="0" ${!k.indices ? 'selected' : ''}>Stratégie de base seule</option></select></label></div>
        <div class="row"><button class="btn primary" data-act="bjsim" ${simRun ? 'disabled' : ''}>${simRun ? `Simulation… ${Math.round(simRun.done / simRun.total * 100)} %` : 'Lancer la simulation'}</button><span class="note">${esc(G.label)}</span></div>
        ${simRun ? `<div class="meter"><i style="width:${simRun.done / simRun.total * 100}%"></i></div>` : ''}</section>
      ${out}
      ${optPanel()}
      <p class="note">Simulation SIGMA 52 : sabot mélangé, carte de coupe, stratégie du tableau, indices au true count tronqué, assurance à l'indice. Le moteur exact et la simulation donnent le même avantage à environ 0,05 point près (effet de la carte de coupe et des mains de plus de deux cartes jouées au tableau). Elle ne modélise pas les contre-mesures du casino.</p>`;
  };
  // ---------- Optimiseur de rampe (mise Kelly par true count sous contraintes, deux mains, wonging, ruine sur une durée) ----------
  let optRun = null;
  const PHI2 = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), q = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - q : q; };
  // Probabilité de toucher −B avant T heures (mouvement brownien avec dérive μ, écart-type σ par heure).
  const tripRoR = (mu, sd, B, T) => { if (sd <= 0 || T <= 0) return 0; const s = sd * Math.sqrt(T); return Math.min(1, PHI2((-B - mu * T) / s) + Math.exp(Math.max(-700, Math.min(700, -2 * mu * B / (sd * sd)))) * PHI2((-B + mu * T) / s)); };
  // Lignes par true count à partir de compteurs [mains, somme, somme des carrés]. Petites simulations : avantage lissé par une droite
  // pondérée ; grandes simulations (≥ 50 M de mains) : valeurs mesurées telles quelles, avec leur erreur type.
  function smoothHi(rows) { const H = rows.filter((r) => r.tc >= 1); let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; for (const r of H) { const w = r.n / r.v; sw += w; sx += w * r.tc; sy += w * r.raw; sxx += w * r.tc * r.tc; sxy += w * r.tc * r.raw; } if (H.length >= 3) { const b1 = (sw * sxy - sx * sy) / (sw * sxx - sx * sx), b0 = (sy - b1 * sx) / sw; for (const r of rows) if (r.tc >= 2) r.mu = b0 + b1 * r.tc; } return rows; }
  function bucketRows(B, hands, smooth) {
    const agg = {}; for (const [tc, [n, sm, s2]] of Object.entries(B || {})) { const k = Math.max(-6, Math.min(10, +tc)), q = (agg[k] ||= [0, 0, 0]); q[0] += n; q[1] += sm; q[2] += s2; }
    const rows = Object.entries(agg).filter(([, q]) => q[0] > 50).map(([tc, [n, sm, s2]]) => { const mu = sm / n, v = Math.max(0.3, s2 / n - mu * mu); return { tc: +tc, f: n / hands, raw: mu, mu, v, n, se: Math.sqrt(v / n) }; }).sort((a, b) => a.tc - b.tc);
    // smooth = 'hi' : les TC ≥ +2 (rares, bruités) suivent la droite ajustée sur les TC ≥ +1 ; les autres gardent leur mesure.
    if (smooth === 'hi') return smoothHi(rows);
    if (smooth) { let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; for (const r of rows) { const w = r.n / r.v; sw += w; sx += w * r.tc; sy += w * r.raw; sxx += w * r.tc * r.tc; sxy += w * r.tc * r.raw; } const b1 = (sw * sxy - sx * sy) / (sw * sxx - sx * sx), b0 = (sy - b1 * sx) / sw; for (const r of rows) r.mu = b0 + b1 * r.tc; }
    return rows;
  }
  const optBuckets = (d) => bucketRows(d.buckets, d.hands, d.hands < 5e7);
  // Mises optimales : à chaque TC, une ou deux mains, mise de Kelly fractionnaire bornée [1, écart]. rows2 : tours à deux mains
  // (résultat total pour 1 unité par main). Choix de l'option qui maximise la croissance m·x − V·x²/(2·B).
  function optimize(rows, rows2, o, Bu) {
    return rows.map((r) => {
      if (o.entry !== null && r.tc < o.entry) return { n: 0, b: 0 };
      if (r.mu <= 0) return { n: 1, b: 1 };
      const opts = [{ n: 1, m: r.mu, V: r.v + r.mu * r.mu - r.mu * r.mu }];
      const r2 = rows2 && rows2.find((x) => x.tc === r.tc);
      if (r2 && o.two) opts.push({ n: 2, m: r2.raw, V: r2.v });
      let best = null;
      for (const q of opts) { const x = Math.max(1, Math.min(o.spread, Math.round(o.frac * Bu * q.m / q.V))), g = q.m * x - q.V * x * x / (2 * Bu); if (!best || g > best.g) best = { n: q.n, b: x, g }; }
      return best;
    });
  }
  function optEval(rows, rows2, bets, H, unit, Bu, T) {
    let m = 0, e2 = 0, F = 0, wsum = 0;
    rows.forEach((r, i) => { const { n, b } = bets[i]; if (!b) return; F += r.f; const r2 = n === 2 && rows2 ? rows2.find((x) => x.tc === r.tc) : null; const M = r2 ? r2.raw : r.mu, V = r2 ? r2.v : r.v; m += r.f * b * M; e2 += r.f * b * b * (V + M * M); wsum += r.f * b * n; });
    const s2 = Math.max(1e-9, e2 - m * m), sd = Math.sqrt(s2), di = 1e4 * m / sd;
    return { m, sd, F, avgBet: F ? wsum / F : 0, evh: H * m * unit, sdh: Math.sqrt(H * s2) * unit, di, score: di * di / 100, n0: m > 0 ? s2 / (m * m) : null, ror: BJ.riskOfRuin(m, sd, Bu), trip: tripRoR(H * m, Math.sqrt(H * s2), Bu, T), loseT: PHI2(-(H * m * T) / Math.sqrt(H * s2 * T)) };
  }
  // Données de référence (tools/bj_bigsim.js) pour le jeu courant : Hi-Lo, pénétration la plus proche.
  function refJob(pen, sys = 'hilo', spots = 1, cover = 'none') {
    const G = game(), key = countKey(G), J = D.big?.jobs; if (!J) return null;
    const pens = [0.67, 0.75, 0.83], p = pens.reduce((a, x) => (Math.abs(x - pen) < Math.abs(a - pen) ? x : a), 0.75);
    return J[`${key}|${sys}|${spots === 2 || sys !== 'hilo' || cover !== 'none' ? 0.75 : p}|${spots}|${cover}`] || null;
  }
  function optData() {
    const b = P(), o = b.opt;
    if (o.src === 'ref') { const j = refJob(b.bank.pen); if (j) { const j2 = refJob(0.75, 'hilo', 2); return { rows: bucketRows(j.b1, j.hands, false), rows2: j2 ? bucketRows(j2.b2, j2.hands, false) : null, hands: j.hands, label: D.presets[j.key].label, pen: j.pen, others: 2, idx: 'ev', ref: true }; } }
    const d = b.optData; if (!d) return null;
    return { rows: optBuckets(d), rows2: null, hands: d.hands, label: d.label, pen: d.pen, others: d.others, idx: d.idx, ref: false };
  }
  function optPanel() {
    const b = P(), k = b.bank, o = (b.opt ||= { spread: 12, frac: 0.5, wong: 'none', hours: 100 }), Bu = k.bankroll / k.unit;
    o.src ??= D.big ? 'ref' : 'mesure'; o.two ??= false;
    const d = optData();
    let res = '';
    if (d) {
      const rows = d.rows, entry = o.wong === 'none' ? null : +o.wong;
      const optB = optimize(rows, d.rows2, { ...o, entry }, Bu), mine = rows.map((r) => ({ n: 1, b: rampUnits(b.ramp, r.tc) }));
      const A = optEval(rows, d.rows2, optB, k.hph, k.unit, Bu, o.hours), M = optEval(rows, null, mine, k.hph, k.unit, Bu, o.hours);
      const line = (l, f) => `<tr><td>${l}</td><td class="n">${f(A)}</td><td class="n">${f(M)}</td></tr>`;
      res = `<div class="tw"><table class="t bjt"><thead><tr><th>TC</th>${rows.map((r) => `<th class="n">${r.tc <= -6 ? '≤ −6' : r.tc >= 10 ? '≥ +10' : tcS(r.tc)}</th>`).join('')}</tr></thead><tbody>
          <tr><td>Mains</td>${rows.map((r) => `<td class="n">${pc(r.f, 1)}</td>`).join('')}</tr>
          <tr><td>Avantage ${d.ref ? 'mesuré' : 'lissé'}</td>${rows.map((r) => `<td class="n" style="color:var(${r.mu > 0 ? '--good' : '--bad'})">${sgnP(r.mu, 2)}</td>`).join('')}</tr>
          ${d.ref ? `<tr><td>± 95 %</td>${rows.map((r) => `<td class="n">${fr(1.96 * r.se * 100, 2)}</td>`).join('')}</tr>` : ''}
          <tr><td>Variance</td>${rows.map((r) => `<td class="n">${fr(r.v, 2)}</td>`).join('')}</tr>
          <tr><td><strong>Mise optimale</strong></td>${optB.map((x) => `<td class="n"><strong>${x.b ? (x.n === 2 ? '2 × ' : '') + x.b : '—'}</strong></td>`).join('')}</tr>
          <tr><td>Ta rampe</td>${mine.map((x) => `<td class="n">${x.b}</td>`).join('')}</tr></tbody></table></div>
        <div class="tw"><table class="t bjt"><thead><tr><th></th><th class="n">Rampe optimale</th><th class="n">Ta rampe</th></tr></thead><tbody>
          ${line('Espérance par heure', (x) => eur(x.evh))}${line('Écart-type par heure', (x) => eur(x.sdh))}${line('Mise moyenne par tour joué', (x) => fr(x.avgBet, 2) + ' u')}${line('Tours joués', (x) => pc(x.F, 0))}
          ${line('DI · SCORE', (x) => fr(x.di, 1) + ' · ' + fr(x.score, 1))}${line('N0', (x) => (x.n0 ? Math.round(x.n0).toLocaleString('fr-FR') + ' tours' : '∞'))}
          ${line('Risque de ruine (sans fin)', (x) => pc(x.ror, 1))}${line(`Ruine en ${o.hours} h`, (x) => pc(x.trip, 1))}${line(`Perdant après ${o.hours} h`, (x) => pc(x.loseT, 0))}</tbody></table></div>
        <div class="row"><button class="btn small" data-act="bjoptapply">Copier la rampe optimale dans ma rampe</button></div>
        <p class="note">${d.ref ? `Simulation de référence : ${(d.hands / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} M de mains à mise fixe, ${esc(d.label)}, pénétration ${Math.round(d.pen * 100)} %, 2 autres joueurs, Hi-Lo avec indices.` : `Mesuré sur ${(d.hands / 1e6).toFixed(1)} M de mains à mise fixe (${esc(d.label)}, pénétration ${Math.round(d.pen * 100)} %, ${d.others} autres joueurs, indices ${d.idx === 'ra' ? 'prudents' : 'EV max'}), avantage lissé par une droite pondérée.`} Mise optimale = ${fr(o.frac, 2)} × bankroll × avantage(TC) ÷ variance(TC), bornée entre 1 et ${o.spread} unités ; « 2 × » : deux mains, quand la croissance de Kelly est meilleure ainsi (la covariance des deux mains est mesurée). Ruine sur une durée : mouvement brownien avec dérive, ${fmtH(k.hph)} tours observés par heure.</p>`;
    }
    return `<section class="panel"><span class="eyebrow">Avancé</span><h2>Optimiseur de rampe</h2><p class="note">Avantage et variance réels à chaque true count, puis la meilleure mise par TC pour ta bankroll, ton écart maximal et ta fraction de Kelly. Options : deux mains aux comptes élevés, wonging (ne jouer qu'à partir d'un TC d'entrée).</p>
      <div class="form"><label class="f">Données<select data-bjopt="src"><option value="ref" ${o.src === 'ref' ? 'selected' : ''} ${D.big ? '' : 'disabled'}>Simulation de référence (milliards de mains)</option><option value="mesure" ${o.src === 'mesure' ? 'selected' : ''}>Mesure dans le navigateur</option></select></label>
        <label class="f">Écart maximal (1 à …)<select data-bjopt="spread">${[4, 6, 8, 12, 16, 20].map((n) => `<option value="${n}" ${o.spread === n ? 'selected' : ''}>1-${n}</option>`).join('')}</select></label>
        <label class="f">Fraction de Kelly<select data-bjopt="frac">${[0.25, 0.33, 0.5, 0.75, 1].map((n) => `<option value="${n}" ${o.frac === n ? 'selected' : ''}>${fr(n, 2)}</option>`).join('')}</select></label>
        <label class="f">Deux mains<select data-bjopt="two"><option value="0" ${!o.two ? 'selected' : ''}>Non</option><option value="1" ${o.two ? 'selected' : ''}>Quand c'est meilleur</option></select></label>
        <label class="f">Wonging<select data-bjopt="wong"><option value="none" ${o.wong === 'none' ? 'selected' : ''}>Non (jouer tout le sabot)</option>${[0, 1, 2, 3].map((x) => `<option value="${x}" ${o.wong === String(x) ? 'selected' : ''}>Entrer à TC ≥ ${tcS(x)}</option>`).join('')}</select></label>
        <label class="f">Durée (heures)<select data-bjopt="hours">${[10, 50, 100, 300, 1000].map((n) => `<option value="${n}" ${o.hours === n ? 'selected' : ''}>${n} h</option>`).join('')}</select></label></div>
      ${o.src === 'mesure' ? `<div class="row"><button class="btn${b.optData ? '' : ' primary'}" data-act="bjoptrun" ${optRun ? 'disabled' : ''}>${optRun ? 'Mesure… ' + Math.round(optRun.done / optRun.total * 100) + ' %' : b.optData ? 'Remesurer' : 'Mesurer le jeu'}</button><span class="note">Jeu, pénétration et nombre de joueurs des paramètres ci-dessus.</span></div>${optRun ? `<div class="meter"><i style="width:${optRun.done / optRun.total * 100}%"></i></div>` : ''}` : (o.two && !refJob(0.75, 'hilo', 2) ? '<p class="note">Pas de simulation à deux mains pour ce jeu.</p>' : '')}
      ${d ? res : `<p class="note">${o.src === 'ref' ? 'Pas de simulation de référence pour ce jeu (référence : jeux européen et Strip). Passe en mesure dans le navigateur.' : 'Lance la mesure.'}</p>`}</section>`;
  }
  const fmtH = (x) => fr(x, 0);
  ONCHANGE.push((t) => { if (t.dataset.bjopt) { const o = P().opt, k2 = t.dataset.bjopt; o[k2] = k2 === 'wong' || k2 === 'src' ? t.value : k2 === 'two' ? t.value === '1' : +t.value; save(); render(); return true; } });
  ACT.bjoptapply = () => {
    const b = P(), d = optData(); if (!d) return; const o = b.opt, Bu = b.bank.bankroll / b.bank.unit, opt = optimize(d.rows, null, { ...o, entry: null }, Bu);
    b.ramp = b.ramp.map((_, i) => { const j = d.rows.findIndex((x) => x.tc === i); return j < 0 ? (i === 0 ? 1 : b.ramp[i]) : Math.max(1, opt[j].b); });
    save(); render();
  };
  ACT.bjoptrun = () => {
    if (optRun) return;
    const b = P(), G = raOverlay(game()), k = b.bank, total = 1200000, acc = { hands: 0, buckets: {} };
    optRun = { done: 0, total }; render();
    runWorkers({ rules: G.rules, table: G.table, devs: G.indices, ins: ins(G), pen: k.pen, others: k.others, spots: 1, sys: 'hilo' }, total, (r) => {
      acc.hands += r.hands; for (const [tc, q] of Object.entries(r.buckets || {})) { const a = (acc.buckets[tc] ||= [0, 0, 0]); a[0] += q[0]; a[1] += q[1]; a[2] += q[2]; }
      optRun.done = acc.hands; if (tabNow() === 'bjbank') render();
    }, () => { b.optData = { ...acc, label: G.label, pen: k.pen, others: k.others, idx: G.idxMode, date: today() }; optRun = null; save(); render(); });
  };
  // ---------- Simulation sur tous les cœurs (Web Workers) ----------
  // Le moteur, les systèmes et les données sont intégrés à la page en texte (script #bjsrc) : chaque worker les charge, puis simule
  // des blocs de mains et renvoie ses compteurs par true count. Sans worker (fichier ouvert dans un contexte restreint) : sur place.
  let WSRC = null;
  const WSHIM = `;onmessage=function(e){var j=e.data,BJ=self.BJ,CT=self.BJCounts,S=CT.byId[j.sys]||CT.byId.hilo;var table={};for(var row in j.table){table[row]={};for(var u in j.table[row])table[row][u]={order:j.table[row][u].o};}var tag=j.sys==='hilo'?undefined:function(c){return CT.tagOfCard(S,((c%13)<<2)|(Math.floor(c/13)%4));};var r=BJ.simulate({rules:j.rules,table:table,devs:j.devs||[],useIndices:(j.devs&&j.devs.length>0)||j.ins!=null,insIndex:j.ins,ramp:function(){return 1;},hands:j.hands,seed:j.seed,pen:j.pen,others:j.others,buckets:true,noRes:true,cardTag:tag,imb:S.imb,spots:function(){return j.spots||1;},wongIn:j.wongIn==null?null:j.wongIn,bucketDiv:j.bdiv||1});postMessage({buckets:r.buckets,buckets2:r.buckets2,hands:r.hands,rounds:r.rounds});};`;
  function runWorkers(job, total, onChunk, onDone) {
    const CH = 250000, n = Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 2))), blocks = Math.ceil(total / CH);
    let sent = 0, back = 0, url = null;
    try { if (!WSRC) WSRC = document.getElementById('bjsrc')?.textContent || ''; if (WSRC && typeof Worker !== 'undefined') url = URL.createObjectURL(new Blob([WSRC + WSHIM], { type: 'text/javascript' })); } catch (e) { url = null; }
    if (!url) {
      const step = () => { const S = CT.byId[job.sys] || CT.byId.hilo, table = Object.fromEntries(Object.entries(job.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))])); const r = BJ.simulate({ rules: job.rules, table, devs: job.devs || [], useIndices: (job.devs || []).length > 0 || job.ins != null, insIndex: job.ins, ramp: () => 1, hands: CH, seed: 1 + Math.floor(rnd() * 1e9), pen: job.pen, others: job.others, buckets: true, noRes: true, cardTag: job.sys === 'hilo' ? undefined : (c) => CT.tagOfCard(S, ((c % 13) << 2) | (Math.floor(c / 13) % 4)), imb: S.imb, spots: () => job.spots || 1, wongIn: job.wongIn ?? null }); onChunk(r); back++; if (back < blocks) setTimeout(step, 0); else onDone(); };
      return setTimeout(step, 0);
    }
    const ws = [];
    const feed = (w) => { if (sent >= blocks) { w.terminate(); return; } sent++; w.postMessage({ ...job, hands: CH, seed: (Date.now() ^ (sent * 2654435761)) >>> 0 }); };
    for (let i = 0; i < n; i++) { const w = new Worker(url); ws.push(w); w.onmessage = (e) => { onChunk(e.data); back++; if (back >= blocks) { ws.forEach((x) => x.terminate()); URL.revokeObjectURL(url); onDone(); } else feed(w); }; w.onerror = () => { w.terminate(); }; feed(w); }
  }
  AFTER.bjbank = () => {
    const R = simRes || P().lastSim, cv = $('#bjsimc'); if (!R || !cv) return;
    const evh = R.mean * R.hph * R.unit, sdh = R.sd * Math.sqrt(R.hph) * R.unit, gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
    const paths = []; for (let p = 0; p < 30; p++) { const pts = [R.bankroll]; let x = R.bankroll; for (let h = 0; h < 100; h++) { x += evh + sdh * gauss(); pts.push(x); } paths.push({ pts, color: '--accent', alpha: 0.35, width: 1.2 }); }
    paths.push({ pts: Array.from({ length: 101 }, (_, h) => R.bankroll + evh * h), color: '--ink', width: 2 });
    drawLines(cv, paths, { zero: false, floor: 0, fmt: (x) => fr(x / 1000, 1) + ' k€', xlabel: '100 h' });
  };
  ONCHANGE.push((t) => {
    if (t.dataset.bjramp !== undefined) { const v = Math.max(1, Math.round(+String(t.value).replace(',', '.') || 1)); P().ramp[+t.dataset.bjramp] = v; save(); render(); return true; }
    if (t.dataset.bjbank) { const k = t.dataset.bjbank, v = +String(t.value).replace(',', '.').replace(/\s/g, ''); P().bank[k] = k === 'indices' ? v === 1 : (Number.isFinite(v) ? v : P().bank[k]); save(); render(); return true; }
  });
  ACT.bjkelly = () => { const b = P(), G = game(), k = b.bank; b.ramp = b.ramp.map((_, i) => { const e = (G.edgeByTC.find((x) => x[0] === i) || [0, 0])[1]; return Math.max(1, Math.round(0.5 * k.bankroll * Math.max(0, e) / 1.33 / k.unit)); }); save(); render(); };
  ACT.bjsim = () => {
    if (simRun) return;
    const b = P(), G = raOverlay(game()), k = b.bank, chunk = 25000, total = Math.max(chunk, k.hands);
    const devs = G.indices, ramp = b.ramp.slice(), insIdx = ins(G);
    const acc = { hands: 0, units: 0, bet: 0, s2: 0, tc: {} };
    simRun = { done: 0, total }; render();
    const step = () => {
      const r = BJ.simulate({ rules: G.rules, table: Object.fromEntries(Object.entries(G.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))])), devs, useIndices: k.indices, insIndex: k.indices ? insIdx : null, ramp: (tc) => rampUnits(ramp, tc), hands: chunk, seed: 1 + Math.floor(rnd() * 1e9), pen: k.pen, others: k.others });
      acc.hands += r.hands; acc.units += r.units; acc.bet += r.avgBet * r.hands; for (let i = 0; i < r.res.length; i++) acc.s2 += r.res[i] * r.res[i];
      for (const [tc, n] of Object.entries(r.tcHist)) { const kk = Math.max(-4, Math.min(8, +tc)); acc.tc[kk] = (acc.tc[kk] || 0) + n; }
      simRun.done = acc.hands;
      if (acc.hands < total) { if (tabNow() === 'bjbank') render(); setTimeout(step, 0); return; }
      const mean = acc.units / acc.hands, sd = Math.sqrt(acc.s2 / acc.hands - mean * mean);
      simRes = { mean, sd, edge: acc.units / acc.bet, avgBet: acc.bet / acc.hands, hands: acc.hands, hph: k.hph, unit: k.unit, bankroll: k.bankroll, pen: k.pen, others: k.others, indices: k.indices, label: G.label, tcs: Object.entries(acc.tc).map(([t, n]) => [+t, n / acc.hands]).sort((x, y) => x[0] - y[0]), date: today() };
      b.lastSim = simRes; simRun = null; save(); render();
    };
    setTimeout(step, 30);
  };

  // =====================================================================
  // Systèmes de comptage : comparaison, fiche, compte personnalisé
  // =====================================================================
  let sysKey = null, cust2 = null, custRes = null, custRun2 = null;
  const RK = [['A', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6], ['7', 7], ['8', 8], ['9', 9], ['10', 10]];
  const scoreOf = (m) => 1e6 * m.mu * m.mu / (m.sd * m.sd);
  function devTable(idx, insur, name) {
    const L = (idx || []).slice().sort((a, b) => (a.set === b.set ? 0 : a.set === 'I18' ? -1 : b.set === 'I18' ? 1 : a.set === 'Fab4' ? -1 : 1));
    return `<div class="tw"><table class="t bjt"><thead><tr><th>Main</th><th>Contre</th><th>Base</th><th>Déviation</th><th>Quand (TC ${esc(name)})</th></tr></thead><tbody>${insur && insur.index !== null ? `<tr><td>Assurance</td><td>As</td><td>non</td><td><strong>prendre</strong></td><td class="mono">≥ ${tcS(insur.index)}</td></tr>` : ''}${L.map((d) => `<tr><td>${esc(rowLabel(d.row))}</td><td>${UPN(d.up)}</td><td>${ACTFR[d.basic]}</td><td><strong>${ACTFR[d.act]}</strong></td><td class="mono">${d.dir > 0 ? '≥' : '<'} ${tcS(d.index)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  VIEWS.bjsys = () => {
    const G = game(), S = sysOf(), key = sysKey || countKey(G), C = D.counts?.[key];
    if (!C) return head('Systèmes de comptage', '') + '<p class="note">Données de comparaison absentes : relance tools/build_bj.js systems.</p>';
    const r = C.systems[S.id], ref = C.systems.hilo.sim, E = C.eor;
    const rows = CT.SYSTEMS.map((x) => [x, C.systems[x.id]]).sort((a, b) => b[1].sim.mu - a[1].sim.mu);
    const hi = C.systems.hiloIdx?.sim;
    const tagsRow = (t, red7) => RK.map(([l, v]) => `<td class="n">${red7 && v === 7 ? '+1 r / 0 n' : tagTxt(t[v])}</td>`).join('');
    if (!cust2) cust2 = S.t.slice();
    const ct = cust2, cBC = CT.bc(ct, E.eor), cIC = CT.ic(ct), cPE = CT.pe(ct, E.dec), cImb = CT.imbalance(ct), cLvl = CT.level(ct);
    return head('Systèmes de comptage', `${CT.SYSTEMS.length} systèmes, leurs valeurs, leurs corrélations et une simulation à rampe identique, pour « ${esc(D.presets[key].label)} ». Le système choisi ici est celui des exercices de Comptage, de l'Entraîneur (indices) et de la Table.`) +
      `<div class="row"><span class="note">Jeu de comparaison :</span>${['europe', 'strip'].map((k) => `<button class="chip" aria-pressed="${key === k}" data-act="bjsyskey" data-k="${k}">${esc(D.presets[k].label)}</button>`).join('')}</div>
      <section class="panel"><span class="eyebrow">Système choisi</span><h2>${esc(S.name)}</h2><p class="note">${esc(S.who ? S.who + ' · ' : '')}${esc(S.note)}</p>
        <div class="tw"><table class="t bjt"><thead><tr>${RK.map(([l]) => `<th class="n">${l}</th>`).join('')}</tr></thead><tbody><tr>${tagsRow(S.t, S.red7)}</tr></tbody></table></div>
        <div class="stats"><div class="stat hero"><span>Corrélation de mise (BC)</span><b>${fr(r.bc, 2)}</b><span>${r.bcAce ? 'avec as à part : ' + fr(r.bcAce, 2) : 'Hi-Lo : ' + fr(C.systems.hilo.bc, 2)}</span></div>
          <div class="stat"><span>Assurance (IC)</span><b>${fr(r.ic, 2)}</b><span>Hi-Lo : ${fr(C.systems.hilo.ic, 2)}</span></div>
          <div class="stat"><span>Efficacité de jeu*</span><b>${fr(r.pe, 2)}</b><span>Hi-Lo : ${fr(C.systems.hilo.pe, 2)}</span></div>
          <div class="stat"><span>Gain simulé</span><b>${fr(r.sim.mu * 100, 2)} u</b><span>/ 100 mains · SCORE ${fr(scoreOf(r.sim) / scoreOf(ref) * 100, 0)} (Hi-Lo = 100)</span></div>
          <div class="stat"><span>Niveau · équilibre</span><b>${S.level}</b><span>${S.balanced ? 'équilibré' : 'déséquilibré, départ ' + tagTxt(CT.irc(S, G.rules.decks)) + ' en ' + G.rules.decks + ' jeux'}</span></div></div>
        ${r.indices ? `<h3>Indices ${esc(S.name)} (Illustrious 18 et Fab 4)</h3>${devTable(r.indices, r.insurance, S.name)}<p class="note">Calcul SIGMA 52 avec le modèle de composition propre au système (espérance conditionnelle du sabot sachant le compte), à mi-sabot. Indices dans l'unité du système.</p>` : `<p class="note">${S.balanced ? 'Ce compte ne sert qu\'à miser ou à l\'assurance : pas d\'indices calculés.' : 'Compte déséquilibré : ses auteurs donnent des indices exprimés en running count ; SIGMA 52 ne les calcule pas.'}</p>`}</section>
      <section class="panel"><h2>Comparaison</h2><div class="tw"><table class="t bjt"><thead><tr><th>Système</th><th class="n">Niveau</th><th>Équilibré</th><th class="n">BC</th><th class="n">BC as à part</th><th class="n">IC</th><th class="n">Eff. jeu*</th><th class="n">Gain / 100</th><th class="n">ÉT / 100</th><th class="n">SCORE</th><th></th></tr></thead><tbody>
        ${rows.map(([x, v]) => `<tr${x.id === S.id ? ' style="font-weight:600"' : ''}><td>${esc(x.name)}</td><td class="n">${x.level}</td><td>${x.balanced ? 'oui' : 'non'}</td><td class="n">${fr(v.bc, 2)}</td><td class="n">${v.bcAce ? fr(v.bcAce, 2) : '—'}</td><td class="n">${fr(v.ic, 2)}</td><td class="n">${fr(v.pe, 2)}</td><td class="n">${fr(v.sim.mu * 100, 2)} u</td><td class="n">${fr(v.sim.sd * 10, 1)}</td><td class="n">${v.sim.mu > 0 ? fr(scoreOf(v.sim) / scoreOf(ref) * 100, 0) : '—'}</td><td>${x.id === S.id ? '<span class="pill acc">choisi</span>' : `<button class="btn small" data-act="bjsetsys" data-s="${x.id}">Choisir</button>`}</td></tr>`).join('')}
        ${hi ? `<tr><td>Hi-Lo + indices et assurance</td><td class="n">1</td><td>oui</td><td class="n">—</td><td class="n">—</td><td class="n">—</td><td class="n">—</td><td class="n">${fr(hi.mu * 100, 2)} u</td><td class="n">${fr(hi.sd * 10, 1)}</td><td class="n">${fr(scoreOf(hi) / scoreOf(ref) * 100, 0)}</td><td></td></tr>` : ''}</tbody></table></div>
        <p class="note">BC, IC : corrélations avec les effets de retrait du moteur (un paquet). *Efficacité de jeu : définition SIGMA 52 (moyenne des |corrélations| avec l'effet de retrait de chaque décision d'indice), pas la PE pondérée publiée par Griffin. Simulation : ${(ref.hands / 1e6).toFixed(0)} M de mains par système, pénétration 75 %, 2 autres joueurs, même rampe pour tous (1 unité par 0,1 point d'avantage estimé, de 1 à 12), stratégie de base sans indices ; comptes déséquilibrés convertis idéalement (plafond). SCORE : Hi-Lo = 100. Écarts de quelques points = bruit de simulation.</p></section>
      <section class="panel"><h2>Inventer un compte</h2><p class="note">Donne une valeur à chaque rang : corrélations calculées immédiatement, puis simulation à la même rampe que la comparaison.</p>
        <div class="form bjf">${RK.map(([l, v]) => `<label class="f">${l}<input data-bjct="${v}" value="${String(ct[v]).replace('.', ',')}" inputmode="decimal"></label>`).join('')}</div>
        <div class="stats"><div class="stat"><span>BC</span><b>${fr(cBC, 3)}</b></div><div class="stat"><span>IC</span><b>${fr(cIC, 3)}</b></div><div class="stat"><span>Eff. jeu*</span><b>${fr(cPE, 3)}</b></div><div class="stat"><span>Niveau · déséquilibre</span><b>${cLvl}</b><span>${cImb ? (cImb > 0 ? '+' : '') + fr(cImb, 1) + ' par paquet' : 'équilibré'}</span></div></div>
        <div class="row"><button class="btn primary" data-act="bjctsim" ${custRun2 ? 'disabled' : ''}>${custRun2 ? 'Calcul… ' + custRun2.txt : 'Simuler ce compte'}</button>${CT.SYSTEMS.map((x) => `<button class="btn small" data-act="bjctload" data-s="${x.id}">${esc(x.name)}</button>`).join('')}</div>
        ${custRes ? `<div class="verdict"><b>Gain simulé : ${fr(custRes.mu * 100, 2)} u / 100 mains, écart-type ${fr(custRes.sd * 10, 1)} u, SCORE ${fr(scoreOf(custRes) / scoreOf(ref) * 100, 0)} (Hi-Lo = 100).</b><span>${(custRes.hands / 1e6).toFixed(1)} M de mains, valeurs ${RK.map(([l, v]) => l + ' ' + tagTxt(custRes.t[v])).join(', ')}.</span></div>` : ''}</section>`;
  };
  ACT.bjsyskey = (t) => { sysKey = t.dataset.k; render(); };
  ACT.bjsetsys = (t) => { P().sys = t.dataset.s; cust2 = null; tbl = null; cdReset(); save(); render(); };
  ACT.bjctload = (t) => { cust2 = CT.byId[t.dataset.s].t.slice(); if (CT.byId[t.dataset.s].red7) cust2[7] = 0.5; custRes = null; render(); };
  ONCHANGE.push((t) => { if (t.dataset.bjct !== undefined) { const v = parseNum(t.value); if (Number.isFinite(v)) { cust2[+t.dataset.bjct] = Math.max(-20, Math.min(20, v)); custRes = null; } render(); return true; } });
  ACT.bjctsim = () => {
    if (custRun2) return;
    const G = game(), key = sysKey || countKey(G), P0 = D.presets[key], rules = P0.rules, t = cust2.slice(), dl = Math.max(1, rules.decks / 2);
    let sc = 0, hb = 0, m = 0; for (let r = 1; r <= 10; r++) m += CT.W[r] * t[r]; m /= 52; for (let r = 1; r <= 10; r++) { sc += CT.W[r] * (t[r] - m) ** 2; hb += CT.W[r] * BJ.HILO[r] ** 2; }
    const step = Math.max(1, Math.round(Math.sqrt(sc / hb))), tcs = [], ks = []; for (let k = -4; k <= 8; k++) ks.push(k * step);
    const table = Object.fromEntries(Object.entries(P0.table).map(([row, o]) => [row, Object.fromEntries(Object.entries(o).map(([u, c]) => [u, { order: c.o }]))]));
    const imb = CT.imbalance(t), acc = { u: 0, n: 0, s2: 0 }, chunks = 6;
    custRun2 = { txt: 'avantage par true count' }; render();
    const stepEdge = () => {
      const tc = ks[tcs.length], sh = BJ.shoeAtTC(dl, tc, t), st2 = BJ.strategy(rules, { shoe: sh, fast: true });
      let e = -BJ.houseEdge(rules, { strat: st2, shoe: sh, optimal: true }); const ins2 = BJ.insuranceEV(sh); if (ins2 > 0) e += (sh[1] / BJ.total(sh)) * ins2;
      tcs.push([tc, e]); custRun2.txt = `avantage par true count ${tcs.length}/${ks.length}`; if (tabNow() === 'bjsys') render();
      if (tcs.length < ks.length) return setTimeout(stepEdge, 0);
      setTimeout(stepSim, 0);
    };
    let done = 0;
    const stepSim = () => {
      const r = BJ.simulate({ rules, table, hands: 250000, seed: 9000 + done, pen: 0.75, others: 2, ramp: (tc) => Math.max(1, Math.min(12, Math.round(advAt(tcs, tc) * 1000))), rampRaw: true, cardTag: (c) => { const rr = c % 13, v = rr === 12 ? 1 : rr >= 8 ? 10 : rr + 2; return t[v]; }, imb });
      acc.u += r.units; acc.n += r.hands; for (let i = 0; i < r.res.length; i++) acc.s2 += r.res[i] * r.res[i];
      done++; custRun2.txt = `simulation ${done}/${chunks}`; if (tabNow() === 'bjsys') render();
      if (done < chunks) return setTimeout(stepSim, 0);
      const mu = acc.u / acc.n; custRes = { mu, sd: Math.sqrt(acc.s2 / acc.n - mu * mu), hands: acc.n, t }; custRun2 = null; render();
    };
    setTimeout(stepEdge, 30);
  };

  // =====================================================================
  // Maths : calculateurs
  // =====================================================================
  const mt = { up: 6, cond: true, out: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], exact: null, mu: 1, sd: 1.15, B: 1000, c: 0.5, N: 10000 };
  const PHI = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), q = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - q : q; };
  VIEWS.bjmaths = () => {
    const G = game(), r = G.rules, key = countKey(G), C = D.counts?.[key];
    // Croupier
    const calc = BJ.Calc(Object.assign({}, r, { peek: mt.cond && r.peek }), null, true), s0 = BJ.shoeOf(r.decks), s1 = s0.slice(); s1[mt.up] -= 1;
    const dd = calc.dealerDist(s1, mt.up);
    // Composition
    const shoe = s0.map((x, i) => (i ? Math.max(0, x - (mt.out[i] || 0)) : 0)), nOut = mt.out.reduce((a, b) => a + b, 0), nLeft = BJ.total(shoe);
    const rcHL = mt.out.reduce((a, n, i) => a + n * (BJ.HILO[i] || 0), 0), tcHLv = rcHL / Math.max(0.25, nLeft / 52);
    const lin = C ? CT.linearEdge(-G.edge, C.eor.eor, shoe, s0) : null, insEV = BJ.insuranceEV(shoe);
    // Kelly et ruine
    const mu = mt.mu / 100, v = mt.sd * mt.sd, fstar = mu / v, g = mt.c * (2 - mt.c) * mu * mu / (2 * v), ror = BJ.riskOfRuin(mu, mt.sd, mt.B), half = Math.pow(0.5, 2 / mt.c - 1), n0 = mu > 0 ? v / (mu * mu) : null, di = 1e4 * mu / mt.sd;
    const win = PHI(mu * Math.sqrt(mt.N) / mt.sd);
    const num = (k, val2, step2) => `<input data-bjmt="${k}" value="${String(val2).replace('.', ',')}" inputmode="decimal" ${step2 ? '' : ''}>`;
    return head('Maths du blackjack', 'Les calculs du cours, avec tes chiffres : croupier, composition du sabot, effets de retrait, Kelly, ruine, variance.') +
      `<div class="grid2"><section class="panel"><h2>Croupier</h2><div class="form"><label class="f">Carte visible<select data-bjmt="up">${BJ.UPS.map((u) => `<option value="${u}" ${mt.up === u ? 'selected' : ''}>${UPN(u)}</option>`).join('')}</select></label>${r.peek ? `<label class="f">Blackjack<select data-bjmt="cond"><option value="1" ${mt.cond ? 'selected' : ''}>exclu (peek)</option><option value="0" ${!mt.cond ? 'selected' : ''}>inclus</option></select></label>` : ''}</div>
        <div class="tw"><table class="t bjt"><thead><tr><th class="n">17</th><th class="n">18</th><th class="n">19</th><th class="n">20</th><th class="n">21</th><th class="n">Crève</th><th class="n">BJ</th></tr></thead><tbody><tr>${dd.map((p) => `<td class="n">${pc(p, 2)}</td>`).join('')}</tr></tbody></table></div>
        <p class="note">Calcul exact, ${esc(G.label)} (${r.decks} jeux, ${r.h17 ? 'tire' : 'reste sur'} soft 17), sabot complet moins la carte visible.</p></section>
      <section class="panel"><h2>Probabilité d'être gagnant</h2><div class="form"><label class="f">Avantage (% de la mise)${num('mu', mt.mu)}</label><label class="f">Écart-type par main${num('sd', mt.sd)}</label><label class="f">Mains${num('N', mt.N)}</label></div>
        <div class="stats"><div class="stat hero"><span>P(gagnant)</span><b>${pc(win, 1)}</b><span>Φ(μ√N ÷ σ)</span></div><div class="stat"><span>Espérance</span><b>${fr(mu * mt.N, 1)} u</b></div><div class="stat"><span>Écart-type</span><b>${fr(mt.sd * Math.sqrt(mt.N), 1)} u</b></div></div></section></div>
      <section class="panel"><h2>Composition du sabot et avantage</h2><p class="note">Cartes sorties depuis le mélange (${esc(G.label)}, ${r.decks} jeux). L'avantage exact recalcule la stratégie optimale pour ce qui reste ; l'estimation linéaire n'utilise que les effets de retrait.</p>
        <div class="form bjf">${RK.map(([l, i]) => `<label class="f">${l} sortis<input data-bjout="${i}" value="${mt.out[i] || 0}" inputmode="numeric"></label>`).join('')}</div>
        <div class="stats"><div class="stat"><span>Cartes sorties</span><b>${nOut}</b><span>${fr(nLeft / 52, 2)} paquets restants</span></div><div class="stat"><span>Hi-Lo</span><b>RC ${tcS(rcHL)}</b><span>TC ${fr(tcHLv, 2)}</span></div>
          <div class="stat"><span>Estimation linéaire</span><b>${lin === null ? '—' : sgnP(lin)}</b><span>avantage de départ ${sgnP(-G.edge)} + effets de retrait</span></div>
          <div class="stat hero"><span>Avantage exact</span><b>${mt.exact === null ? '—' : sgnP(mt.exact)}</b><span>${mt.exact === null ? 'clique « Calculer »' : 'jeu optimal, composition exacte'}</span></div>
          <div class="stat"><span>Assurance</span><b>${sgnP(insEV)}</b><span>EV par mise initiale · 10 : ${pc(shoe[10] / nLeft, 1)}</span></div></div>
        <div class="row"><button class="btn primary" data-act="bjmtexact">Calculer l'avantage exact</button><button class="btn small" data-act="bjmtrand">Tirer un demi-sabot au hasard</button><button class="btn small" data-act="bjmtzero">Remettre à zéro</button></div></section>
      ${C ? `<section class="panel"><h2>Effets de retrait</h2><div class="tw"><table class="t bjt"><thead><tr><th></th>${RK.map(([l]) => `<th class="n">${l}</th>`).join('')}</tr></thead><tbody><tr><td>EOR</td>${RK.map(([, i]) => `<td class="n" style="color:var(${C.eor.eor[i] > 0 ? '--good' : '--bad'})">${sgnP(C.eor.eor[i], 2)}</td>`).join('')}</tr><tr><td>Hi-Lo</td>${RK.map(([, i]) => `<td class="n">${tagTxt(BJ.HILO[i])}</td>`).join('')}</tr></tbody></table></div><p class="note">Retrait d'une carte d'un paquet de 52, règles « ${esc(D.presets[key].label)} » sur un paquet, jeu optimal. Avantage du paquet complet ${sgnP(C.eor.edge0)}.</p></section>` : ''}
      <section class="panel"><h2>Kelly, ruine, N0, DI, SCORE</h2><div class="form"><label class="f">Avantage (% de la mise)${num('mu', mt.mu)}</label><label class="f">Écart-type par main${num('sd', mt.sd)}</label><label class="f">Bankroll (unités)${num('B', mt.B)}</label><label class="f">Fraction de Kelly${num('c', mt.c)}</label></div>
        <div class="stats"><div class="stat hero"><span>Mise Kelly</span><b>${pc(fstar, 2)}</b><span>de la bankroll (μ ÷ σ²) · à ${fr(mt.c, 2)} Kelly : ${fr(mt.c * fstar * mt.B, 1)} u</span></div>
          <div class="stat"><span>Croissance</span><b>${pc(g, 4)}</b><span>par main (${pc(mt.c * (2 - mt.c), 0)} de Kelly)</span></div>
          <div class="stat"><span>P(bankroll ÷ 2 un jour)</span><b>${pc(Math.min(1, half), 1)}</b><span>x^(2/c − 1), mises proportionnelles</span></div>
          <div class="stat"><span>Risque de ruine</span><b>${pc(ror, 2)}</b><span>mise fixe 1 u : exp(−2μB/σ²)</span></div>
          <div class="stat"><span>N0</span><b>${n0 ? Math.round(n0).toLocaleString('fr-FR') : '∞'}</b><span>mains (σ²/μ²)</span></div>
          <div class="stat"><span>DI · SCORE</span><b>${fr(di, 1)}</b><span>SCORE ${fr(di * di / 100, 1)}</span></div></div></section>`;
  };
  ONCHANGE.push((t) => {
    if (t.dataset.bjmt) { const k = t.dataset.bjmt; if (k === 'up') mt.up = +t.value; else if (k === 'cond') mt.cond = t.value === '1'; else { const v = parseNum(t.value); if (Number.isFinite(v)) mt[k] = k === 'N' || k === 'B' ? Math.max(1, Math.round(v)) : k === 'c' ? Math.max(0.05, Math.min(2, v)) : k === 'sd' ? Math.max(0.1, v) : v; } render(); return true; }
    if (t.dataset.bjout !== undefined) { const G = game(), i = +t.dataset.bjout, max = (i === 10 ? 16 : 4) * G.rules.decks; mt.out[i] = Math.max(0, Math.min(max, Math.round(parseNum(t.value) || 0))); mt.exact = null; render(); return true; }
  });
  ACT.bjmtzero = () => { mt.out = new Array(11).fill(0); mt.exact = null; render(); };
  ACT.bjmtrand = () => { const G = game(), d = []; for (let k = 0; k < G.rules.decks; k++) d.push(...deck52()); shuffle(d); mt.out = new Array(11).fill(0); for (let i = 0; i < Math.floor(d.length / 2); i++) mt.out[val(d[i])]++; mt.exact = null; render(); };
  ACT.bjmtexact = () => {
    const G = game(), r = G.rules, s0 = BJ.shoeOf(r.decks), shoe = s0.map((x, i) => (i ? Math.max(0, x - (mt.out[i] || 0)) : 0));
    if (BJ.total(shoe) < 20) { mt.exact = null; return render(); }
    const st = BJ.strategy(r, { shoe, fast: true }); mt.exact = -BJ.houseEdge(r, { strat: st, shoe, optimal: true }); render();
  };

  // =====================================================================
  // Techniques avancées : suivi de mélange, séquençage des as, carte cachée, plusieurs mains, équipe, couverture
  // =====================================================================
  const SH = window.BJShuffle;
  const tq = { proc: 'zone2rs', seg: 52, K: 104, res: null, ace: null, map: null, game: null, score: { n: 0, user: 0, best: 0, rand: 0 }, cust: { piles: 2, grab: 26, riffles: 2, strip: 1, passes: 1 } };
  const procOf = () => (tq.proc === 'custom' ? { label: 'Procédure personnalisée', passes: Array.from({ length: tq.cust.passes }, () => ({ piles: tq.cust.piles, grab: tq.cust.grab, sd: Math.max(2, tq.cust.grab / 7), ops: [...Array(tq.cust.riffles).fill('riffle').flatMap((x, i, a) => (tq.cust.strip && i === 0 && a.length > 1 ? [x, 'strip'] : [x]))] })) } : SH.PROCS[tq.proc]);
  function heat(v, lo, hi) { const x = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); return `color-mix(in srgb, var(--accent) ${Math.round(x * 85)}%, var(--sunk))`; }
  function stackSVG(arr, tags, opts = {}) {
    const n = arr.length, W = 640, H = 40, w = W / n;
    const col = (t) => (t > 0 ? '#3c9a63' : t < 0 ? '#b23656' : '#c9bfc2');
    return `<svg viewBox="0 0 ${W} ${H + 16}" width="100%" role="img" aria-label="${esc(opts.label || 'Pile')}">${arr.map((c, i) => `<rect x="${(i * w).toFixed(2)}" y="0" width="${Math.max(0.6, w).toFixed(2)}" height="${H}" fill="${col(tags[c])}"/>`).join('')}${(opts.marks || []).map((m) => `<rect x="${(m.at * w).toFixed(1)}" y="0" width="${(m.len * w).toFixed(1)}" height="${H}" fill="none" stroke="${m.color}" stroke-width="2"/><text x="${(m.at * w + 2).toFixed(1)}" y="${H + 12}" font-size="10" fill="${m.color}">${esc(m.label)}</text>`).join('')}</svg>`;
  }
  function newTrackGame() {
    const proc = procOf(), rnd2 = SH.rng(1 + Math.floor(rnd() * 1e9)), tags = BJ.HILO, { stack, out, unplayed, n } = SH.dealAndShuffle(6, 0.75, proc, rnd2, tags);
    let um = 0; for (let i = 0; i < unplayed; i++) um += tags[stack[i]]; um /= Math.max(1, unplayed);
    const seg = tq.seg, S = Math.ceil(n / seg), segRC = [], segAvg = [];
    for (let s = 0; s < S; s++) { let a = 0, c = 0, known = 0; for (let i = s * seg; i < Math.min(n, (s + 1) * seg); i++) { a += i < unplayed ? um : tags[stack[i]]; c++; known += tags[stack[i]]; } segAvg.push(a / c); segRC.push(Math.round(a)); }
    const M = tq.map && tq.map.seg === seg && tq.map.proc === tq.proc ? tq.map.M : SH.shuffleMap(proc, n, seg, 250, 3);
    tq.map = { M, seg, proc: tq.proc };
    const pr = SH.predict(M, segAvg), zK = Math.round(tq.K / seg);
    let best = 0, bestV = Infinity; for (let z = 0; z < S; z++) { let v = 0; for (let q = 0; q < zK; q++) v += pr[(z + q) % S]; if (v < bestV) { bestV = v; best = z; } }
    tq.game = { stack, out, unplayed, n, S, segRC, segAvg, pr, best, rand: Math.floor(rnd() * S), pick: null };
  }
  const tcFirst = (out, z, seg, K) => { let s = 0; for (let i = 0; i < K; i++) s += BJ.HILO[out[(z * seg + i) % out.length]]; return -s / (K / 52); };
  VIEWS.bjadv = () => {
    const G = game(), key = countKey(G), T = D.tech, proc = procOf();
    const tr0 = tq.res;
    const pr = (x, d = 2) => (x === undefined || x === null ? '—' : fr(x, d));
    // Suivi : jeu interactif
    let gameHtml = '';
    if (tq.game) {
      const g = tq.game, seg = tq.seg, zK = Math.round(tq.K / seg);
      gameHtml = `<h3>1. La défausse avant le mélange</h3><p class="note">Running count Hi-Lo de chaque segment de ${seg} cartes (dessus de la pile à gauche). Les ${g.unplayed} premières cartes ne sont pas jouées : tu ne connais que leur total.</p>
        <div class="bjsegs">${g.segRC.map((r, s) => `<span style="background:${heat(-g.segAvg[s], -0.25, 0.25)}">${s * seg < g.unplayed ? '?' : tcS(r)}</span>`).join('')}</div>
        <h3>2. Où couper ?</h3><p class="note">Le nouveau sabot commence là où tu coupes. Choisis la zone de départ : les ${tq.K} cartes suivantes seront jouées en premier.</p>
        <div class="bjsegs">${Array.from({ length: g.S }, (_, z) => `<button class="${g.pick === z ? 'on' : ''}" data-act="bjtrkpick" data-z="${z}" ${g.pick !== null ? 'disabled' : ''}>${z + 1}</button>`).join('')}</div>
        ${g.pick !== null ? (() => { const u = tcFirst(g.out, g.pick, seg, tq.K), bst = tcFirst(g.out, g.best, seg, tq.K), rd = tcFirst(g.out, g.rand, seg, tq.K); return `<h3>3. Le sabot réel</h3>${stackSVG(g.out, BJ.HILO, { label: 'Sabot après mélange', marks: [{ at: g.pick * seg, len: tq.K, color: 'var(--ink)', label: 'toi' }, { at: g.best * seg, len: tq.K, color: '#c9a227', label: 'SIGMA' }] })}<p class="note">Vert : cartes basses (+1) ; bordeaux : cartes hautes (−1). Les ${tq.K} premières cartes après ta coupe ont un true count de <strong>${fr(u, 1)}</strong> ; coupe de SIGMA 52 : ${fr(bst, 1)} ; coupe au hasard : ${fr(rd, 1)}.</p><div class="row"><button class="btn primary" data-act="bjtrknew">Sabot suivant</button></div>`; })() : ''}
        ${tq.score.n ? `<p class="note">Ta moyenne sur ${tq.score.n} sabots : TC ${fr(tq.score.user / tq.score.n, 2)} · SIGMA ${fr(tq.score.best / tq.score.n, 2)} · hasard ${fr(tq.score.rand / tq.score.n, 2)}.</p>` : ''}`;
    }
    // Carte de mélange
    let mapHtml = '';
    if (tq.map && tq.map.proc === tq.proc && tq.map.seg === tq.seg) { const M = tq.map.M; mapHtml = `<h3>Carte de mélange</h3><div class="bjmap" style="grid-template-columns:repeat(${M.length},1fr)">${M.map((row) => Array.from(row, (p) => `<i style="background:${heat(p, 0, 0.6)}" title="${pc(p, 0)}"></i>`).join('')).join('')}</div><p class="note">Ligne : zone du nouveau sabot (du dessus vers le bas) ; colonne : segment d'origine. Une diagonale nette = mélange suivable.</p>`; }
    const hole = T?.hole?.[key], first = T?.first?.[key];
    const big = D.big?.jobs || {}, j1 = big[`${key}|hilo|0.75|1|none`], j2 = big[`${key}|hilo|0.75|2|none`];
    const scoreOpt = (rows, spread) => { let bestDI = -Infinity; for (let sc = 0.5; sc <= 400; sc *= 1.15) { const bets = rows.map((r) => ({ n: 1, b: r.mu <= 0 ? 1 : Math.max(1, Math.min(spread, Math.round(sc * r.mu / r.v))) })); const e = optEval(rows, null, bets, 100, 1, 1e6, 1); if (e.di > bestDI) bestDI = e.di; } return bestDI * bestDI / 100; };
    let multi = '<p class="note">Simulation de référence à deux mains absente pour ce jeu.</p>';
    if (j1 && j2) {
      const r1 = bucketRows(j1.b1, j1.hands, false), r2 = bucketRows(j2.b2, j2.hands, false);
      multi = `<div class="tw"><table class="t bjt"><thead><tr><th>TC</th>${r1.filter((r) => r.tc >= -2 && r.tc <= 8).map((r) => `<th class="n">${tcS(r.tc)}</th>`).join('')}</tr></thead><tbody>
        <tr><td>Variance, 1 main</td>${r1.filter((r) => r.tc >= -2 && r.tc <= 8).map((r) => `<td class="n">${fr(r.v, 2)}</td>`).join('')}</tr>
        <tr><td>Variance, 2 mains (total)</td>${r1.filter((r) => r.tc >= -2 && r.tc <= 8).map((r) => { const q = r2.find((x) => x.tc === r.tc); return `<td class="n">${q ? fr(q.v, 2) : '—'}</td>`; }).join('')}</tr>
        <tr><td>Corrélation des 2 mains</td>${r1.filter((r) => r.tc >= -2 && r.tc <= 8).map((r) => { const q = r2.find((x) => x.tc === r.tc); return `<td class="n">${q ? fr((q.v - 2 * r.v) / (2 * r.v), 2) : '—'}</td>`; }).join('')}</tr></tbody></table></div>
        <p class="note">Deux mains jouées contre le même croupier sont corrélées (environ ${fr(((r2.find((x) => x.tc === 0)?.v ?? 2.6) - 2 * (r1.find((x) => x.tc === 0)?.v ?? 1.3)) / (2 * (r1.find((x) => x.tc === 0)?.v ?? 1.3)), 2)}) : deux mains de m unités risquent moins qu'une main de 2m. À compte élevé, jouer deux mains permet de miser plus sans dépasser le risque voulu ; l'optimiseur de Bankroll choisit une ou deux mains à chaque TC. Mesuré sur ${((j1.hands + j2.hands) / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} M de mains.</p>`;
    }
    // Équipe
    let team = '';
    if (j1) {
      const rows = bucketRows(j1.b1, j1.hands, false), e = tq.team || (tq.team = { spotters: 3, entry: 2, bet: 10, hph: 80 });
      const hot = rows.filter((r) => r.tc >= e.entry), f = hot.reduce((a, r) => a + r.f, 0), mu = f ? hot.reduce((a, r) => a + r.f * r.mu, 0) / f : 0, v = f ? hot.reduce((a, r) => a + r.f * (r.v + r.mu * r.mu), 0) / f - mu * mu : 1;
      const pAny = 1 - Math.pow(1 - f, e.spotters), bpRounds = e.hph * Math.min(1, e.spotters * f, pAny * 1.0 + 0), spotEV = e.spotters * e.hph * rows.reduce((a, r) => a + r.f * r.mu, 0);
      const bpEV = bpRounds * e.bet * mu, sd = Math.sqrt(bpRounds * e.bet * e.bet * v + e.spotters * e.hph * 1.33);
      team = `<div class="form"><label class="f">Compteurs (tables)<input data-bjteam="spotters" value="${e.spotters}" inputmode="numeric"></label><label class="f">TC d'appel<input data-bjteam="entry" value="${e.entry}" inputmode="numeric"></label><label class="f">Mise du gros joueur (u)<input data-bjteam="bet" value="${e.bet}" inputmode="numeric"></label><label class="f">Tours par heure et table<input data-bjteam="hph" value="${e.hph}" inputmode="numeric"></label></div>
        <div class="stats"><div class="stat"><span>Part des tours à TC ≥ ${tcS(e.entry)}</span><b>${pc(f, 1)}</b><span>par table</span></div><div class="stat"><span>Avantage moyen du gros joueur</span><b>${sgnP(mu, 2)}</b></div><div class="stat"><span>Tours joués par le gros joueur</span><b>${fr(bpRounds, 0)} / h</b><span>une table chaude à la fois</span></div><div class="stat hero"><span>Espérance de l'équipe</span><b>${fr(bpEV + spotEV, 1)} u / h</b><span>écart-type ≈ ${fr(sd, 0)} u / h</span></div></div>
        <p class="note">Les compteurs misent le minimum en permanence (espérance ${fr(spotEV, 1)} u / h) ; le gros joueur ne joue qu'aux tables appelées. Modèle simplifié : au plus une table chaude à la fois, sans temps de déplacement. Mesures : simulation de référence ${esc(D.presets[key].label)}.</p>`;
    }
    // Couverture
    let cover = '';
    if (j1) {
      const sc = (j) => (j ? scoreOpt(bucketRows(j.b1, j.hands, 'hi'), 12) : null), base2 = sc(j1), rowsC = [['Tous les indices et l\'assurance', base2], ['Sans séparer les 10', sc(big[`${key}|hilo|0.75|1|no1010`])], ['Sans assurance', sc(big[`${key}|hilo|0.75|1|noins`])], ['Stratégie de base et assurance (aucun autre indice)', sc(big[`${key}|hilo|0.75|1|basic`])]];
      cover = `<div class="tw"><table class="t bjt"><thead><tr><th>Jeu</th><th class="n">SCORE (rampe optimale 1-12)</th><th class="n">Perte</th></tr></thead><tbody>${rowsC.map(([l, s2]) => `<tr><td>${l}</td><td class="n">${s2 === null ? '—' : fr(s2, 1)}</td><td class="n">${s2 === null || base2 === null ? '—' : pc(1 - s2 / base2, 0)}</td></tr>`).join('')}</tbody></table></div><p class="note">SCORE : gain pour 100 mains avec 10 000 de bankroll en misant Kelly, ici avec la meilleure rampe 1-12. Simulations de référence (Hi-Lo, ${esc(D.presets[key].label)}, pénétration 75 %).</p>`;
    }
    const aceTbl = T?.aceseq ? `<div class="tw"><table class="t bjt"><thead><tr><th>Procédure</th><th class="n">As en +1</th><th class="n">+2</th><th class="n">+3</th><th class="n">Un as en +1 (tous)</th></tr></thead><tbody>${Object.entries(T.aceseq).map(([k, a]) => `<tr><td>${esc(SH.PROCS[k]?.label || k)}</td><td class="n">${pc(a.p[0], 1)}</td><td class="n">${pc(a.p[1], 1)}</td><td class="n">${pc(a.p[2], 1)}</td><td class="n">${pc(a.pAny[0], 1)}</td></tr>`).join('')}</tbody></table></div>` : '';
    const trackTbl = T?.track ? `<div class="tw"><table class="t bjt"><thead><tr><th>Procédure</th><th class="n">TC du début (suivi)</th><th class="n">TC (hasard)</th><th class="n">P(TC ≥ +2), suivi</th><th class="n">P(TC ≥ +2), hasard</th><th class="n">Corrélation prédit / réel</th></tr></thead><tbody>${Object.entries(T.track).map(([k, x]) => { const y = x[tq.seg] || x[52]; return `<tr><td>${esc(SH.PROCS[k]?.label || k)}</td><td class="n">${(y.tcTrack >= 0.05 ? '+' : '') + fr(y.tcTrack, 1)}</td><td class="n">${fr(y.tcRand, 1)}</td><td class="n">${pc(y.pHi, 0)}</td><td class="n">${pc(y.pHiRand ?? 0, 0)}</td><td class="n">${fr(y.corr, 2)}</td></tr>`; }).join('')}</tbody></table></div><p class="note">3 000 sabots par procédure, sabot de 6 jeux à 75 %, segments de ${tq.seg} cartes, ${tq.K} premières cartes mesurées.</p>` : '';
    return head('Techniques avancées', 'Ce que font les joueurs d\'avantage au-delà du comptage, simulé et chiffré : suivi de mélange, séquençage des as, carte cachée vue, plusieurs mains, jeu en équipe, coût de la couverture. Pour comprendre et s\'entraîner ; au casino, seule ta tête.') +
      `<div class="warnbox"><strong>Cadre.</strong> Le suivi de mélange et le séquençage des as utilisent l'information visible : ce sont des techniques d'observation, que le casino peut contrer ou sanctionner d'une exclusion. Voir une carte cachée exposée par maladresse a un statut juridique qui dépend du pays et des moyens ; tout appareil, complice dans le personnel ou marquage de cartes est une fraude. SIGMA 52 ne fournit que des simulations.</div>
      <section class="panel"><span class="eyebrow">Suivi de mélange</span><h2>Mélange, carte de mélange, coupe</h2>
        <div class="form"><label class="f">Procédure<select data-bjtrk="proc">${Object.entries(SH.PROCS).map(([k, p]) => `<option value="${k}" ${tq.proc === k ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}<option value="custom" ${tq.proc === 'custom' ? 'selected' : ''}>Personnalisée…</option></select></label>
          <label class="f">Segments suivis<select data-bjtrk="seg"><option value="52" ${tq.seg === 52 ? 'selected' : ''}>1 paquet (52)</option><option value="26" ${tq.seg === 26 ? 'selected' : ''}>½ paquet (26)</option></select></label>
          <label class="f">Cartes jouées en tête<select data-bjtrk="K"><option value="52" ${tq.K === 52 ? 'selected' : ''}>1 paquet</option><option value="104" ${tq.K === 104 ? 'selected' : ''}>2 paquets</option></select></label></div>
        ${tq.proc === 'custom' ? `<div class="form"><label class="f">Piles<select data-bjtrkc="piles">${[2, 3, 4].map((n) => `<option ${tq.cust.piles === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="f">Poignée (cartes)<select data-bjtrkc="grab">${[13, 26, 39, 52, 78].map((n) => `<option ${tq.cust.grab === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="f">Riffles<select data-bjtrkc="riffles">${[1, 2, 3, 4].map((n) => `<option ${tq.cust.riffles === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="f">Strip<select data-bjtrkc="strip"><option value="1" ${tq.cust.strip ? 'selected' : ''}>Oui</option><option value="0" ${!tq.cust.strip ? 'selected' : ''}>Non</option></select></label><label class="f">Passes<select data-bjtrkc="passes">${[1, 2, 3].map((n) => `<option ${tq.cust.passes === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>` : `<p class="note">${esc(proc.note || '')}</p>`}
        <div class="row"><button class="btn primary" data-act="bjtrkstudy">Étudier cette procédure</button><button class="btn" data-act="bjtrknew">Entraînement : couper un sabot</button></div>
        ${tr0 ? `<div class="stats"><div class="stat hero"><span>TC des ${tq.K} premières cartes, coupe suivie</span><b>${tcS(Math.round(tr0.tcTrack * 100) / 100)}</b><span>hasard : ${fr(tr0.tcRand, 2)} · meilleur possible : ${fr(tr0.tcOracle, 2)}</span></div><div class="stat"><span>P(TC ≥ +2)</span><b>${pc(tr0.pHi, 0)}</b><span>hasard : ${pc(tr0.pHiRand, 0)}</span></div><div class="stat"><span>Corrélation prédit / réel</span><b>${fr(tr0.corr, 2)}</b><span>0 : rien à suivre ; 1 : parfait</span></div><div class="stat"><span>Avantage estimé sur ce début</span><b>${sgnP(advAt(G.edgeByTC, tr0.tcTrack), 1)}</b><span>au lieu de ${sgnP(advAt(G.edgeByTC, 0), 1)}</span></div></div><p class="note">${tr0.trials} sabots simulés. Avantage estimé à partir de l'avantage par true count du jeu (${esc(G.label)}).</p>` : ''}
        ${mapHtml}${gameHtml}
        <h3>Toutes les procédures</h3>${trackTbl}
        <p class="note">Modèle de SIGMA 52 : riffle de Gilbert-Shannon-Reeds, strip par paquets de 5 à 12, poignées de taille gaussienne. Un vrai croupier a ses habitudes : observe la procédure de ta table et reproduis-la en « Personnalisée ». C'est le principe des logiciels de suivi : cartographier un mélange réel, puis en déduire où couper.</p></section>
      <section class="panel"><span class="eyebrow">Séquençage des as</span><h2>La carte clé avant chaque as</h2><p>On retient la carte vue juste avant un as. Après un mélange imparfait, quand la carte clé réapparaît, l'as a des chances de la suivre de près. Probabilité que l'as suivi tombe 1, 2 ou 3 cartes après sa carte clé :</p>${aceTbl}
        ${first ? `<p>Ce que vaut un as en première carte (calcul exact, ${esc(D.presets[key].label)}) : espérance de la main <strong>${sgnP(first[1], 1)}</strong>, contre ${sgnP(-G.edge, 2)} en moyenne. Un 10 en première carte : ${sgnP(first[10], 1)} ; un 6 : ${sgnP(first[6], 1)}.</p>` : ''}
        <p class="note">Pour en profiter, il faut que l'as tombe sur ta main : savoir combien de cartes sortiront avant (nombre de joueurs, cartes brûlées) et parfois jouer une ou deux mains de plus pour « prendre » la bonne carte. Le moindre mélange supplémentaire détruit la séquence (voir « deux passes »).</p></section>
      <section class="panel"><span class="eyebrow">Carte cachée</span><h2>Ce que vaut l'information sur la carte du croupier</h2>
        ${hole ? `<div class="stats"><div class="stat"><span>Aucune information</span><b>${sgnP(hole.none, 2)}</b><span>jeu optimal selon la composition</span></div><div class="stat"><span>« 10 ou pas 10 »</span><b>${sgnP(hole.ten, 2)}</b></div><div class="stat"><span>Petite, moyenne ou haute</span><b>${sgnP(hole.three, 2)}</b><span>2-6, 7-9, 10-As</span></div><div class="stat hero"><span>Carte exacte</span><b>${sgnP(hole.full, 2)}</b></div></div><p class="note">Calcul exact SIGMA 52, ${esc(D.presets[key].label)} : à chaque niveau d'information, toutes les décisions (y compris après un tirage) tiennent compte de ce que tu sais. C'est la mesure de ce que vaut un croupier qui expose sa carte, ou un signe involontaire au moment du peek.</p>` : '<p class="note">Données absentes.</p>'}</section>
      <section class="panel"><span class="eyebrow">Plusieurs mains</span><h2>Deux mains aux comptes élevés</h2>${multi}</section>
      <section class="panel"><span class="eyebrow">Équipe</span><h2>Compteurs et gros joueur</h2>${team || '<p class="note">Données absentes.</p>'}</section>
      <section class="panel"><span class="eyebrow">Couverture</span><h2>Ce que coûte chaque renoncement</h2>${cover || '<p class="note">Données absentes.</p>'}</section>`;
  };
  ONCHANGE.push((t) => {
    if (t.dataset.bjtrk) { const k2 = t.dataset.bjtrk; tq[k2] = k2 === 'proc' ? t.value : +t.value; tq.res = null; tq.game = null; render(); return true; }
    if (t.dataset.bjtrkc) { tq.cust[t.dataset.bjtrkc] = +t.value; tq.res = null; tq.game = null; tq.map = null; render(); return true; }
    if (t.dataset.bjteam) { const v = parseNum(t.value); if (Number.isFinite(v)) tq.team[t.dataset.bjteam] = Math.max(t.dataset.bjteam === 'entry' ? -3 : 1, Math.round(v)); render(); return true; }
  });
  ACT.bjtrkstudy = () => { const proc = procOf(); tq.res = SH.trackingStudy({ procObj: proc, seg: tq.seg, K: tq.K, trials: 1000, seed: 1 + Math.floor(rnd() * 1e6) }); tq.map = { M: SH.shuffleMap(proc, 312, tq.seg, 250, 3), seg: tq.seg, proc: tq.proc }; render(); };
  ACT.bjtrknew = () => { newTrackGame(); render(); };
  ACT.bjtrkpick = (t) => { const g = tq.game; if (!g || g.pick !== null) return; g.pick = +t.dataset.z; const s = tq.seg; tq.score.n++; tq.score.user += tcFirst(g.out, g.pick, s, tq.K); tq.score.best += tcFirst(g.out, g.best, s, tq.K); tq.score.rand += tcFirst(g.out, g.rand, s, tq.K); render(); };

  // =====================================================================
  // Simulateur (simulations de référence et simulation personnalisée sur tous les cœurs)
  // =====================================================================
  const sm = { key: null, cfg: { sys: 'hilo', pen: 0.75, others: 2, spots: 1, idx: 'ev', wong: 'none', hands: 20e6 }, run: null, res: null };
  // Incertitude du SCORE : 24 tirages de l'avantage mesuré de chaque TC dans son erreur type (graine fixe), même lissage, écart-type des SCORE.
  function scoreErr(rows, spread) {
    let a = 12345; const g = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return (a + 1) / 0x80000001; }, nrm = () => Math.sqrt(-2 * Math.log(g())) * Math.cos(2 * Math.PI * g());
    const sm2 = rows.some((r) => r.mu !== r.raw), xs = [];
    for (let k = 0; k < 24; k++) { const rs = rows.map((r) => { const x = r.raw + nrm() * r.se; return { ...r, raw: x, mu: x }; }); if (sm2) smoothHi(rs); xs.push(scoreOf2(rs, spread).score); }
    const m = xs.reduce((u, v) => u + v, 0) / xs.length; return Math.sqrt(xs.reduce((u, v) => u + (v - m) ** 2, 0) / (xs.length - 1));
  }
  function scoreOf2(rows, spread) { let best = { di: -Infinity }; for (let sc = 0.5; sc <= 400; sc *= 1.15) { const bets = rows.map((r) => ({ n: 1, b: r.mu <= 0 ? 1 : Math.max(1, Math.min(spread, Math.round(sc * r.mu / r.v))) })); const e = optEval(rows, null, bets, 100, 1, 1e6, 1); if (e.di > best.di) best = e; } return best; }
  VIEWS.bjsim = () => {
    const G = game(), key = sm.key || countKey(G), J = D.big?.jobs || {}, tot = Object.values(J).reduce((a, j) => a + j.hands, 0);
    const row = (id, label) => { const j = J[id]; if (!j) return ''; const rows = bucketRows(j.b1, j.hands, 'hi'), all = rows.reduce((a, r) => a + r.f * r.raw, 0), se = Math.sqrt(rows.reduce((a, r) => a + r.f * (r.v + r.raw * r.raw), 0) / j.hands); const s8 = scoreOf2(rows, 8), s12 = scoreOf2(rows, 12), s16 = scoreOf2(rows, 16), e12 = scoreErr(rows, 12); return `<tr><td>${label}</td><td class="n">${(j.hands / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} M</td><td class="n">${sgnP(all, 3)} ± ${fr(1.96 * se * 100, 3)}</td><td class="n">${fr(s8.score, 1)}</td><td class="n">${fr(s12.score, 1)}<span class="note"> ± ${fr(e12, 1)}</span></td><td class="n">${fr(s16.score, 1)}</td><td class="n">${s12.n0 ? Math.round(s12.n0).toLocaleString('fr-FR') : '—'}</td></tr>`; };
    let custom = '';
    if (sm.res) { const r = sm.res, rows = bucketRows(r.b1, r.hands, r.hands < 5e7), s12 = scoreOf2(rows, 12), all = rows.reduce((a, x) => a + x.f * x.raw, 0);
      custom = `<div class="stats"><div class="stat hero"><span>Tours simulés</span><b>${(r.hands / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M</b><span>${fr(r.rate / 1e6, 2)} M mains / s sur ${r.cores} cœur${r.cores > 1 ? 's' : ''}</span></div><div class="stat"><span>Avantage à mise fixe</span><b>${sgnP(all, 3)}</b></div><div class="stat"><span>SCORE, rampe optimale 1-12</span><b>${fr(s12.score, 1)}</b><span>N0 ${s12.n0 ? Math.round(s12.n0).toLocaleString('fr-FR') : '—'} mains</span></div></div>
        <div class="tw"><table class="t bjt"><thead><tr><th>${r.sys && r.sys !== 'hilo' ? 'TC équiv. Hi-Lo' : 'TC'}</th>${rows.map((x) => `<th class="n">${x.tc <= -6 ? '≤ −6' : x.tc >= 10 ? '≥ +10' : tcS(x.tc)}</th>`).join('')}</tr></thead><tbody><tr><td>Mains</td>${rows.map((x) => `<td class="n">${pc(x.f, 1)}</td>`).join('')}</tr><tr><td>Avantage</td>${rows.map((x) => `<td class="n" style="color:var(${x.raw > 0 ? '--good' : '--bad'})">${sgnP(x.raw, 2)}</td>`).join('')}</tr><tr><td>± 95 %</td>${rows.map((x) => `<td class="n">${fr(1.96 * x.se * 100, 2)}</td>`).join('')}</tr><tr><td>Variance</td>${rows.map((x) => `<td class="n">${fr(x.v, 2)}</td>`).join('')}</tr></tbody></table></div>`; }
    const c = sm.cfg, S0 = CT.byId[c.sys];
    return head('Simulateur', `Simulations de référence de SIGMA 52 : ${(tot / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} milliard${tot >= 2e9 ? 's' : ''} de mains (Hi-Lo à trois pénétrations, 14 systèmes, deux mains, couverture), et ta propre simulation sur tous les cœurs de ton appareil.`) +
      `<div class="row"><span class="note">Jeu :</span>${['europe', 'strip'].map((k) => `<button class="chip" aria-pressed="${key === k}" data-act="bjsmkey" data-k="${k}">${esc(D.presets[k].label)}</button>`).join('')}</div>
      <section class="panel"><h2>Hi-Lo selon la pénétration</h2><div class="tw"><table class="t bjt"><thead><tr><th>Configuration</th><th class="n">Mains</th><th class="n">Avantage, mise fixe</th><th class="n">SCORE 1-8</th><th class="n">SCORE 1-12</th><th class="n">SCORE 1-16</th><th class="n">N0 (1-12)</th></tr></thead><tbody>
        ${[0.67, 0.75, 0.83].map((p) => row(`${key}|hilo|${p}|1|none`, `Pénétration ${Math.round(p * 100)} %`)).join('')}
        ${row(`${key}|hilo|0.75|1|basic`, 'Stratégie de base et assurance, 75 %')}${row(`${key}|hilo|0.75|1|noins`, 'Sans assurance, 75 %')}${row(`${key}|hilo|0.75|1|no1010`, 'Sans séparer les 10, 75 %')}</tbody></table></div>
        <p class="note">Avantage à mise fixe avec indices (intervalle à 95 %). SCORE : gain pour 100 mains avec 10 000 de bankroll en misant Kelly, avec la meilleure rampe possible dans l'écart donné ; avantage des TC ≥ +2 lissé par une droite ajustée sur les TC ≥ +1 (les comptes rares sont bruités). 2 autres joueurs à la table. Dans un jeu marginal (SCORE de quelques unités), un écart de 0,01 point d'avantage aux TC élevés change beaucoup le SCORE : les comparaisons y sont fragiles.</p></section>
      <section class="panel"><h2>Systèmes de comptage (pénétration 75 %)</h2><div class="tw"><table class="t bjt"><thead><tr><th>Système</th><th class="n">Mains</th><th class="n">Avantage, mise fixe</th><th class="n">SCORE 1-8</th><th class="n">SCORE 1-12</th><th class="n">SCORE 1-16</th><th class="n">N0 (1-12)</th></tr></thead><tbody>
        ${CT.SYSTEMS.map((x) => row(x.id === 'hilo' ? `${key}|hilo|0.75|1|none` : `${key}|${x.id}|0.75|1|none`, esc(x.name) + (x.balanced ? '' : ' *'))).join('')}</tbody></table></div>
        <p class="note">Chaque système joue ses propres indices calculés (systèmes équilibrés) ; statistiques rangées par true count équivalent Hi-Lo (TC du système ÷ son échelle) pour une résolution égale ; rampe optimale propre à chaque système. * Déséquilibré, converti idéalement en compte équilibré (plafond).</p></section>
      <section class="panel"><h2>Ta simulation</h2><div class="form">
        <label class="f">Système<select data-bjsm="sys">${CT.SYSTEMS.map((x) => `<option value="${x.id}" ${c.sys === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        <label class="f">Pénétration<select data-bjsm="pen">${[0.6, 0.67, 0.75, 0.8, 0.83, 0.87].map((p) => `<option value="${p}" ${Math.abs(c.pen - p) < 0.001 ? 'selected' : ''}>${Math.round(p * 100)} %</option>`).join('')}</select></label>
        <label class="f">Autres joueurs<select data-bjsm="others">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<option ${c.others === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="f">Mains jouées<select data-bjsm="spots"><option value="1" ${c.spots === 1 ? 'selected' : ''}>1</option><option value="2" ${c.spots === 2 ? 'selected' : ''}>2</option></select></label>
        <label class="f">Indices<select data-bjsm="idx"><option value="ev" ${c.idx === 'ev' ? 'selected' : ''}>EV max</option><option value="ra" ${c.idx === 'ra' ? 'selected' : ''}>Prudents</option><option value="none" ${c.idx === 'none' ? 'selected' : ''}>Aucun</option></select></label>
        <label class="f">Wonging<select data-bjsm="wong"><option value="none" ${c.wong === 'none' ? 'selected' : ''}>Non</option>${[0, 1, 2].map((x) => `<option value="${x}" ${c.wong === String(x) ? 'selected' : ''}>Entrer à TC ≥ ${tcS(x)}</option>`).join('')}</select></label>
        <label class="f">Tours à simuler<select data-bjsm="hands">${[5e6, 20e6, 50e6, 100e6, 250e6].map((n) => `<option value="${n}" ${c.hands === n ? 'selected' : ''}>${(n / 1e6).toLocaleString('fr-FR')} M</option>`).join('')}</select></label></div>
        <div class="row"><button class="btn primary" data-act="bjsmrun" ${sm.run ? 'disabled' : ''}>${sm.run ? `Simulation… ${Math.round(sm.run.done / sm.run.total * 100)} % · ${fr(sm.run.rate / 1e6, 2)} M/s` : 'Lancer'}</button><span class="note">${esc(G.label)} · ${navigator.hardwareConcurrency || 2} cœurs · ${S0.balanced ? 'indices du système' : 'compte déséquilibré : stratégie de base'}.</span></div>
        ${sm.run ? `<div class="meter"><i style="width:${sm.run.done / sm.run.total * 100}%"></i></div>` : ''}${custom}</section>`;
  };
  ACT.bjsmkey = (t) => { sm.key = t.dataset.k; render(); };
  ONCHANGE.push((t) => { if (t.dataset.bjsm) { const k2 = t.dataset.bjsm; sm.cfg[k2] = ['sys', 'idx', 'wong'].includes(k2) ? t.value : +t.value; render(); return true; } });
  ACT.bjsmrun = () => {
    if (sm.run) return;
    const c = sm.cfg, G = game(), S = CT.byId[c.sys], C = sysData(G, S);
    let devs = [], insI = null;
    if (c.idx !== 'none') { if (c.sys === 'hilo') { const g2 = c.idx === 'ra' ? (() => { const o = P().idxMode; P().idxMode = 'ra'; const x = raOverlay(G); P().idxMode = o; return x; })() : G; devs = g2.indices; insI = ins(G); } else if (S.balanced && C?.indices) { devs = C.indices.filter((d) => validDev(d, G.rules)); insI = C.insurance?.index ?? null; } }
    const acc = { hands: 0, b1: {}, b2: {} }, t0 = Date.now();
    sm.run = { done: 0, total: c.hands, rate: 0 }; sm.res = null; render();
    runWorkers({ rules: G.rules, table: G.table, devs, ins: insI, pen: c.pen, others: c.others, spots: c.spots, sys: c.sys, wongIn: c.wong === 'none' ? null : +c.wong, bdiv: c.sys === 'hilo' ? 1 : (C?.scale || 1) }, c.hands, (r) => {
      acc.hands += r.hands; for (const [B, src] of [[acc.b1, r.buckets], [acc.b2, r.buckets2]]) for (const [tc, q] of Object.entries(src || {})) { const a = (B[tc] ||= [0, 0, 0]); a[0] += q[0]; a[1] += q[1]; a[2] += q[2]; }
      sm.run.done = acc.hands; sm.run.rate = acc.hands / Math.max(0.001, (Date.now() - t0) / 1000); if (tabNow() === 'bjsim') render();
    }, () => { sm.res = { sys: c.sys, b1: c.spots === 2 ? acc.b2 : acc.b1, hands: acc.hands, rate: acc.hands / Math.max(0.001, (Date.now() - t0) / 1000), cores: navigator.hardwareConcurrency || 1 }; sm.run = null; render(); });
  };

  // =====================================================================
  // Journal
  // =====================================================================
  let jMsg = '';
  const ATT = ['Aucune', 'Regards du chef de table', 'Remarque', 'Mise limitée ou mélange anticipé', 'Prié de ne plus jouer'];
  VIEWS.bjjournal = () => {
    const b = P(), ss = b.sessions.slice().sort((x, y) => y.date.localeCompare(x.date)), tot = ss.reduce((a, s) => a + s.result, 0), hrs = ss.reduce((a, s) => a + s.hours, 0);
    const L = b.lastSim, exp = L ? L.mean * L.hph * L.unit * hrs : null, sdT = L ? L.sd * Math.sqrt(L.hph * hrs) * L.unit : null;
    return head('Journal blackjack', 'Chaque séance réelle : durée, unité, résultat, compte maximal, signes d\'attention. Comparé à l\'espérance de ta dernière simulation.') +
      `<div class="stats"><div class="stat hero"><span>Résultat total</span><b>${eur(tot)}</b><span>${ss.length} séance${ss.length > 1 ? 's' : ''} · ${fr(hrs, 1)} h</span></div>
        <div class="stat"><span>Par heure</span><b>${hrs ? eur(tot / hrs) : '—'}</b><span>réel</span></div>
        <div class="stat"><span>Attendu</span><b>${exp !== null && hrs ? eur(exp) : '—'}</b><span>${sdT ? '± ' + eur(sdT) + ' (1 écart-type)' : 'lance une simulation dans Bankroll'}</span></div>
        <div class="stat"><span>Écart à l'espérance</span><b>${exp !== null && hrs && sdT ? fr((tot - exp) / sdT, 1) + ' σ' : '—'}</b><span>entre −2 et +2 : variance normale</span></div></div>
      <section class="panel"><h2>Nouvelle séance</h2><form id="bjjf" class="form">
        <label class="f">Date<input type="date" name="date" value="${today()}" required></label><label class="f">Casino<input name="casino" maxlength="40"></label>
        <label class="f">Durée (h)<input name="hours" inputmode="decimal" required></label><label class="f">Unité (€)<input name="unit" inputmode="decimal" value="${b.bank.unit}"></label>
        <label class="f">Résultat (€)<input name="result" inputmode="decimal" required placeholder="−120 ou 85"></label><label class="f">TC maximal vu<input name="tcmax" inputmode="numeric"></label>
        <label class="f">Attention du casino<select name="att">${ATT.map((a, i) => `<option value="${i}">${a}</option>`).join('')}</select></label><label class="f">Règles de la table<input name="rules" maxlength="80" placeholder="6 jeux, S17, sans carte cachée…"></label>
        <label class="f" style="grid-column:1/-1">Notes (erreurs, compte perdu, fatigue)<input name="notes" maxlength="200"></label>
        <div class="row" style="grid-column:1/-1"><button class="btn primary">Enregistrer</button></div></form>${jMsg ? `<p class="note">${jMsg}</p>` : ''}</section>
      ${ss.length ? `<section class="panel"><h2>Séances</h2><div class="tw"><table class="t bjt"><thead><tr><th>Date</th><th>Casino</th><th class="n">Heures</th><th class="n">Résultat</th><th class="n">TC max</th><th>Attention</th><th>Notes</th><th></th></tr></thead><tbody>${ss.map((s) => `<tr><td>${esc(s.date)}</td><td>${esc(s.casino)}</td><td class="n">${fr(s.hours, 1)}</td><td class="n" style="color:var(${s.result >= 0 ? '--good' : '--bad'})">${eur(s.result)}</td><td class="n">${s.tcmax === null ? '—' : tcS(s.tcmax)}</td><td>${esc(ATT[s.att])}</td><td>${esc(s.notes)}</td><td><button class="btn small" data-act="bjjdel" data-id="${s.id}">Suppr.</button></td></tr>`).join('')}</tbody></table></div>
        ${ss.some((s) => s.att >= 3) ? '<p class="warnbox">Le casino a déjà réagi au moins une fois : espace tes visites, adoucis la rampe et change d\'établissement.</p>' : ''}</section>` : '<p class="note">Aucune séance enregistrée.</p>'}`;
  };
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'bjjf') return; e.preventDefault();
    const f = new FormData(e.target), num = (k) => +String(f.get(k) || '').replace(/\s/g, '').replace(',', '.').replace('−', '-');
    const s = { id: 'b' + Date.now().toString(36), date: f.get('date'), casino: String(f.get('casino') || '').slice(0, 40), hours: num('hours'), unit: num('unit') || 0, result: num('result'), tcmax: String(f.get('tcmax') || '').trim() === '' ? null : Math.round(num('tcmax')), att: +f.get('att') || 0, rules: String(f.get('rules') || '').slice(0, 80), notes: String(f.get('notes') || '').slice(0, 200) };
    if (!Number.isFinite(s.result) || !Number.isFinite(s.hours) || s.hours <= 0) { jMsg = 'Durée ou résultat illisible : écris par exemple 2,5 et −120.'; return render(); }
    P().sessions.push(s); save(); jMsg = s.att >= 3 ? '<strong>Séance enregistrée.</strong> Le casino a réagi : change d\'établissement et revois ta rampe.' : 'Séance enregistrée.'; render();
  });
  ACT.bjjdel = (t) => { const b = P(); b.sessions = b.sessions.filter((s) => s.id !== t.dataset.id); save(); render(); };

  // ---------- Clavier ----------
  ONKEY.push((e, tab) => {
    if (e.target.closest('input,select,textarea')) return;
    const k = e.key.toLowerCase();
    if (tab === 'bjentr') {
      if (tr.ans && k === 'enter') { e.preventDefault(); ACT.bjnext(); return true; }
      if (!tr.ans && tr.spot?.kind === 'ins') { if (k === 'o') { answer('yes'); return true; } if (k === 'n') { answer('no'); return true; } }
      if (!tr.ans && tr.spot && tr.spot.kind !== 'quiz' && tr.spot.kind !== 'ins') { const a = Object.keys(KEYS).find((x) => KEYS[x] === k); if (a) { const av = availOf(game(), tr.spot.row, tr.spot.up); if (av[a]) { answer(a); return true; } } }
    }
    if (tab === 'bjcompte') {
      if (cd.drill === 'deck' && cd.st === 'run' && (k === ' ' || k === 'enter')) { e.preventDefault(); ACT.bjflip(); return true; }
      if (cd.st === 'done' && k === 'enter' && ['tc', 'tray', 'ramp'].includes(cd.drill)) { e.preventDefault(); cdQuestion(); render(); return true; }
    }
    if (tab === 'bjtable' && tbl && !tbl.ask) {
      if ((tbl.phase === 'bet' || tbl.phase === 'done') && k === 'enter') { e.preventDefault(); ACT.bjdeal(); return true; }
      if (tbl.phase === 'ins' && (k === 'o' || k === 'n')) { ACT.bjtins({ dataset: { v: k === 'o' ? '1' : '0' } }); return true; }
      if (tbl.phase === 'play') { const a = Object.keys(KEYS).find((x) => KEYS[x] === k); if (a) { tblAct(a); return true; } }
    }
  });

  // Lien direct vers un onglet blackjack (#bjtable…) : l'onglet n'existait pas au chargement du routeur.
  const h0 = (location.hash || '').slice(1);
  if (TB.some(([k]) => k === h0)) setTimeout(() => go(h0), 0);
  X.BJAPP = { P, game, gameS, sysOf, tagOf, tcOf: (t) => tcOf(t), recommend, rowOf, handOf, val, availFor, tblNew, mastery, ladder, newSpot: () => { newSpot(); return tr.spot; }, answer, tr, cd, getTbl: () => tbl, setTbl: (x) => { tbl = x; }, tblDeal: () => tblDeal(), tblAct, rampUnits, sm, tq };
})();
