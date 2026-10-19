// Onglet Table live : pour les parties amicales où tous les joueurs sont d'accord (jetons, sans argent).
// Décision éclair (main, board, situation -> action), mode discret, minuteur de blindes, préparation de la partie.
(function () {
  const X = window.__S52, L = window.Live;
  const { E, $, esc, fr, pct, render, head, VIEWS, ACT, ONCHANGE, ONKEY, cardHTML } = X;
  const ls = { get: (k, d) => { try { const v = localStorage.getItem('sigma52.live.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('sigma52.live.' + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } } };
  const lv = {
    sub: 'decision', consent: ls.get('consent', false), discret: false,
    cards: [null, null, null, null, null, null, null], slot: 0, rank: null,
    pos: 'BTN', nOpp: 1, type: 'normal', pre: 'open', limpers: 1, raiseBB: 3, callers: 1, vpre: 'call', raised: false,
    bb: ls.get('bb', 100), pot: '', toCall: '', stack: '', res: null, ms: 0,
    st: ls.get('st', { stack: 10000, players: 6, hours: 3, levelMin: 15, smallChip: 25 }), levels: null,
    ch: ls.get('ch', { stack: 10000, players: 6, denoms: [25, 100, 500, 1000, '', ''], counts: ['', '', '', '', '', ''] }), places: 6,
    timer: { i: 0, left: null, running: false, last: 0 }, wake: null,
  };
  lv.levels = L.structure(lv.st);
  const POS = L.POSITIONS, RK = 'AKQJT98765432'.split(''), SU = [['s', '♠'], ['h', '♥'], ['d', '♦'], ['c', '♣']];
  const hero = () => lv.cards.slice(0, 2).filter((c) => c !== null);
  const boardRaw = () => lv.cards.slice(2).filter((c) => c !== null);
  const num = (v) => +String(v).replace(',', '.').replace(/\s/g, '') || 0;

  function compute() {
    const h = hero(); lv.res = null;
    if (h.length !== 2) return;
    const b = boardRaw(); if (b.length && b.length < 3) return;
    const t0 = performance.now();
    try {
      lv.res = L.decide({ hero: h, board: b, pos: lv.pos, nOpp: lv.nOpp, type: lv.type, pre: lv.pre, limpers: lv.limpers, raiseBB: lv.raiseBB, callers: lv.callers,
        stackBB: lv.stack ? num(lv.stack) / Math.max(1, num(lv.bb)) : 100, live: true, pot: num(lv.pot), toCall: num(lv.toCall), stack: num(lv.stack), vpre: lv.vpre, raised: lv.raised });
    } catch (e) { lv.res = { action: '?', tone: 'warn', lines: [e.message] }; }
    lv.ms = performance.now() - t0;
  }

  // ---------------- Vue ----------------
  const SUBS = [['decision', 'Décision éclair'], ['timer', 'Minuteur de blindes'], ['prep', 'Préparer la partie']];
  VIEWS.live = () => {
    if (!lv.consent) return head('Table live', 'Pour tes parties amicales.') + `<section class="panel"><h2>Avant d'utiliser la Table live</h2>
      <p>Cet outil aide à décider pendant une <strong>partie amicale où tous les joueurs savent qu'il est utilisé et sont d'accord</strong> (jetons, sans argent, ou outil partagé par toute la table).</p>
      <p>Il est <strong>interdit</strong> au casino, en club et en ligne : c'est de l'aide en temps réel, sanctionnée par exclusion, fermeture de compte et confiscation des gains.</p>
      <div class="row"><button class="btn primary" data-act="lvok">Partie amicale, tout le monde est d'accord</button></div></section>`;
    return (lv.discret ? '' : head('Table live', 'Parties amicales, joueurs d\'accord. Une décision en quelques touches, un minuteur de blindes et de quoi préparer la partie.') +
      `<div class="subtabs" role="tablist">${SUBS.map(([k, l]) => `<button class="chip" aria-pressed="${lv.sub === k}" data-act="lvsub" data-s="${k}">${l}</button>`).join('')}</div>`) +
      (lv.sub === 'decision' ? decisionHTML() : lv.sub === 'timer' ? timerHTML() : prepHTML());
  };
  ACT.lvok = () => { lv.consent = true; ls.set('consent', true); render(); };
  ACT.lvsub = (t) => { lv.sub = t.dataset.s; render(); };

  function slotHTML(i, label) {
    const c = lv.cards[i];
    return `<button class="lslot${lv.slot === i ? ' on' : ''}${c !== null ? ' full' : ''}" data-act="lvslot" data-i="${i}" aria-label="${label}${c !== null ? ' : ' + E.cardStr(c) : ''}">${c !== null ? cardHTML(c, true) : `<span>${label}</span>`}</button>`;
  }
  function resultHTML() {
    const r = lv.res;
    if (!r) {
      const hn = hero().length, bn = boardRaw().length;
      return `<div class="lres idle"><b>${hn < 2 ? 'Entre ta main' : bn && bn < 3 ? 'Complète le flop' : '…'}</b><span>${hn < 2 ? 'Touche une valeur puis une couleur, deux fois.' : 'Trois cartes de flop, puis turn et river.'}</span></div>`;
    }
    const bar = r.eq !== undefined ? `<div class="leq"><i style="width:${Math.round(r.eq * 100)}%"></i>${r.need ? `<em style="left:${Math.round(r.need * 100)}%"></em>` : ''}</div><span class="note mono">Équité ${pct(r.eq, 0)}${r.need ? ` · requise ${pct(r.need, 0)}` : ''}${r.spr ? ` · SPR ${fr(r.spr, 1)}` : ''}</span>` : '';
    return `<div class="lres ${r.tone}" role="status" aria-live="polite"><b>${esc(r.action)}${r.size ? ` <small>${esc(r.size)}</small>` : ''}</b>${bar}
      ${lv.discret ? '' : `<ul>${r.lines.slice(0, 4).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`}<span class="note">${r.hand || ''}${r.cat ? ' · ' + esc(r.cat) : ''} · ${fr(lv.ms, 0)} ms</span></div>`;
  }
  function pickerHTML() {
    const used = new Set(lv.cards.filter((c) => c !== null));
    const ranks = RK.map((r) => `<button class="lrk${lv.rank === r ? ' on' : ''}" data-act="lvrank" data-r="${r}">${r === 'T' ? '10' : r}</button>`).join('');
    const suits = SU.map(([s, sym]) => { const c = lv.rank ? E.card(lv.rank + s) : null, dis = c !== null && used.has(c); return `<button class="lsu ${s}" data-act="lvsuit" data-s="${s}" ${!lv.rank || dis ? 'disabled' : ''}>${sym}</button>`; }).join('');
    return `<div class="lpick"><div class="lranks">${ranks}</div><div class="lsuits">${suits}</div></div>`;
  }
  const chips = (key, opts, act = 'lvset') => opts.map(([v, l]) => `<button class="chip" aria-pressed="${String(lv[key]) === String(v)}" data-act="${act}" data-k="${key}" data-v="${v}">${l}</button>`).join('');
  function decisionHTML() {
    compute();
    const post = boardRaw().length >= 3;
    const situation = post ? `
      <div class="lgrid"><label class="f">Pot (jetons)<input inputmode="decimal" data-lv="pot" value="${esc(lv.pot)}" placeholder="0"></label>
        <label class="f">À payer<input inputmode="decimal" data-lv="toCall" value="${esc(lv.toCall)}" placeholder="0 = personne n'a misé"></label>
        <label class="f">Ton tapis<input inputmode="decimal" data-lv="stack" value="${esc(lv.stack)}" placeholder="facultatif"></label></div>
      <div class="row"><span class="note">Mise adverse :</span>${[0, 0.33, 0.5, 0.66, 1].map((f) => `<button class="chip" data-act="lvbet" data-f="${f}">${f ? (f === 1 ? 'pot' : Math.round(f * 100) + ' %') : 'aucune'}</button>`).join('')}</div>
      <div class="row"><span class="note">Avant le flop, il a :</span>${chips('vpre', [['call', 'payé'], ['raise', 'relancé'], ['limp', 'limpé']])}<label class="check"><input type="checkbox" data-act="lvraised" ${lv.raised ? 'checked' : ''}><span>Sa mise est une relance</span></label></div>`
      : `<div class="row"><span class="note">Ta position :</span>${chips('pos', POS.map((p) => [p, p]))}</div>
      <div class="row"><span class="note">Avant toi :</span>${chips('pre', [['open', 'personne'], ['limp', 'limp(s)'], ['raise', 'une relance'], ['raisecall', 'relance + call'], ['threebet', '3-bet sur ma relance']])}</div>
      ${lv.pre === 'limp' ? `<div class="row"><span class="note">Limpers :</span>${chips('limpers', [[1, '1'], [2, '2'], [3, '3+']])}</div>` : ''}
      ${['raise', 'raisecall', 'threebet'].includes(lv.pre) ? `<div class="row"><span class="note">Relance à :</span>${chips('raiseBB', (lv.pre === 'threebet' ? [[8, '8 BB'], [10, '10 BB'], [12, '12 BB'], [15, '15 BB']] : [[2.5, '2,5 BB'], [3, '3 BB'], [4, '4 BB'], [5, '5 BB'], [7, '7 BB']]))}</div>` : ''}
      ${lv.pre === 'raisecall' ? `<div class="row"><span class="note">Callers :</span>${chips('callers', [[1, '1'], [2, '2'], [3, '3+']])}</div>` : ''}
      <div class="lgrid"><label class="f">Ton tapis (jetons)<input inputmode="decimal" data-lv="stack" value="${esc(lv.stack)}" placeholder="facultatif"></label><label class="f">Grosse blinde (jetons)<input inputmode="decimal" data-lv="bb" value="${esc(lv.bb)}"></label></div>`;
    const common = `<div class="row"><span class="note">Adversaires dans le coup :</span>${chips('nOpp', [[1, '1'], [2, '2'], [3, '3'], [4, '4+']])}</div>
      <div class="row"><span class="note">Type :</span>${chips('type', Object.entries(L.TYPES).map(([k, t]) => [k, t.label]))}</div>`;
    return `<section class="panel live${lv.discret ? ' discret' : ''}">
      ${resultHTML()}
      <div class="lslots"><div><span class="note">Ta main</span><div class="row">${slotHTML(0, 'Main')}${slotHTML(1, 'Main')}</div></div>
        <div><span class="note">Board</span><div class="row">${slotHTML(2, 'Flop')}${slotHTML(3, 'Flop')}${slotHTML(4, 'Flop')}${slotHTML(5, 'Turn')}${slotHTML(6, 'River')}</div></div></div>
      ${pickerHTML()}
      ${lv.discret ? '' : situation + common}
      <div class="row"><button class="btn primary" data-act="lvnew">Nouvelle main</button><button class="btn" data-act="lvnext">Main suivante (position +1)</button>
        <button class="btn" data-act="lvdiscret">${lv.discret ? 'Quitter le mode discret' : 'Mode discret'}</button>${'wakeLock' in navigator ? `<button class="btn" data-act="lvwake">${lv.wake ? 'Écran : reste allumé' : 'Garder l\'écran allumé'}</button>` : ''}</div>
      ${lv.discret ? '<p class="note">Mode discret : écran sombre, gros boutons, seule la décision s\'affiche. Les réglages de situation restent ceux choisis avant.</p>' : '<p class="note">Estimation rapide : charts et matrice préflop, puis équité contre une range estimée selon le type d\'adversaire et son action. Pour l\'étude détaillée, utilise le Solveur après la partie.</p>'}
    </section>`;
  }
  // ---------------- Actions décision ----------------
  const nextEmpty = () => { const i = lv.cards.findIndex((c) => c === null); return i < 0 ? 6 : i; };
  ACT.lvslot = (t) => { const i = +t.dataset.i; if (lv.cards[i] !== null) { lv.cards[i] = null; } lv.slot = i; lv.rank = null; render(); };
  ACT.lvrank = (t) => { lv.rank = t.dataset.r; render(); };
  ACT.lvsuit = (t) => {
    if (!lv.rank) return; const c = E.card(lv.rank + t.dataset.s); if (lv.cards.includes(c)) return;
    lv.cards[lv.slot] = c; lv.rank = null; lv.slot = nextEmpty(); render();
  };
  ACT.lvset = (t) => { const k = t.dataset.k, v = t.dataset.v; lv[k] = isNaN(+v) ? v : +v; render(); };
  ACT.lvbet = (t) => { if (!num(lv.pot)) lv.pot = '100'; lv.toCall = String(Math.round(num(lv.pot) * +t.dataset.f)); render(); };
  ACT.lvraised = (t) => { lv.raised = t.checked; render(); };
  ACT.lvnew = () => { lv.cards = lv.cards.map(() => null); lv.slot = 0; lv.rank = null; lv.pot = ''; lv.toCall = ''; lv.pre = 'open'; lv.raised = false; render(); };
  ACT.lvnext = () => { const i = POS.indexOf(lv.pos); lv.pos = POS[(i - 1 + POS.length) % POS.length]; ACT.lvnew(); };
  ACT.lvdiscret = () => { lv.discret = !lv.discret; document.body.classList.toggle('discret-on', lv.discret); render(); };
  ACT.lvwake = async () => { try { if (lv.wake) { await lv.wake.release(); lv.wake = null; } else { lv.wake = await navigator.wakeLock.request('screen'); lv.wake.addEventListener?.('release', () => { lv.wake = null; }); } } catch (e) { lv.wake = null; } render(); };
  ONCHANGE.push((t) => { if (t.dataset.lv) { lv[t.dataset.lv] = t.value; if (t.dataset.lv === 'bb') ls.set('bb', t.value); render(); return true; } });
  // Clavier : saisie « Ah », « Kd »… ; Entrée = nouvelle main ; Retour arrière = efface la dernière carte.
  ONKEY.push((e, tab) => {
    if (tab !== 'live' || lv.sub !== 'decision' || !lv.consent) return;
    const k = e.key;
    if (/^[2-9tjqka]$/i.test(k)) { lv.rank = k.toUpperCase(); render(); return true; }
    if (/^[shdc]$/i.test(k) && lv.rank) { ACT.lvsuit({ dataset: { s: k.toLowerCase() } }); return true; }
    if (k === 'Backspace') { const last = lv.cards.map((c, i) => [c, i]).filter(([c]) => c !== null).pop(); if (last) { lv.cards[last[1]] = null; lv.slot = last[1]; render(); } return true; }
    if (k === 'Enter') { ACT.lvnew(); return true; }
  });

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
      <p class="note">Bip au changement de niveau. Structure modifiable dans « Préparer la partie ».</p></section>`;
  }
  function beep() { try { const A = window.AudioContext || window.webkitAudioContext, a = new A(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.2, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.8); o.start(); o.stop(a.currentTime + 0.8); } catch (e) { /* son indisponible */ } }
  setInterval(() => {
    const T = lv.timer; if (!T.running) return;
    const now = performance.now(), dt = (now - T.last) / 1000; T.last = now; T.left -= dt;
    if (T.left <= 0) { if (T.i < lv.levels.length - 1) { T.i++; T.left = lvl(T.i).min * 60; } else { T.left = 0; T.running = false; } beep(); if (X.getTab() === 'live' && lv.sub === 'timer') render(); return; }
    const el = document.getElementById('lclock'); if (el) el.textContent = mmss(T.left);
  }, 250);
  ACT.lvtgo = () => { const T = lv.timer; T.running = !T.running; T.last = performance.now(); render(); };
  ACT.lvtnext = () => { const T = lv.timer; T.i = Math.min(lv.levels.length - 1, T.i + 1); T.left = lvl(T.i).min * 60; render(); };
  ACT.lvtprev = () => { const T = lv.timer; T.i = Math.max(0, T.i - 1); T.left = lvl(T.i).min * 60; render(); };
  ACT.lvtplus = () => { lv.timer.left += 60; render(); };
  ACT.lvtfull = () => { const el = document.getElementById('ltimer'); try { (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); } catch (e) { /* plein écran refusé */ } };

  // ---------------- Préparer la partie ----------------
  function prepHTML() {
    const s = lv.st, c = lv.ch;
    const res = L.chips({ stack: +c.stack, players: +c.players, denoms: c.denoms.map((x) => +x).filter((x, i) => x > 0 || false), counts: c.counts.filter((_, i) => +c.denoms[i] > 0) });
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
  ACT.lvuse = () => { lv.timer = { i: 0, left: lv.levels[0].min * 60, running: false, last: 0 }; lv.sub = 'timer'; render(); };
  X.liveState = lv;
})();
