// Studio : crée des visuels, des carrousels et des vidéos courtes poker et blackjack à partir des contenus et des calculs de
// SIGMA 52 (mains, quiz, leçons, solveur, ranges, équités, outs, textures, mains de légende, chiffres, mythes ; stratégie de
// base, décisions, défis de comptage, true count, indices, systèmes, graphiques, suivi de mélange), aux formats Short 9:16,
// portrait 4:5, post 1:1, épingle 2:3 et YouTube 16:9. Lots, semaine de contenu, script de voix off et sous-titres .srt.
// Joueurs anonymisés par position.
(function () {
  const X = window.__S52, K = window.Course, S = window.Spots, CH = window.Champions, PF = window.Postflop;
  const { E, HH, $, esc, fr, pct, state, render, head, VIEWS, ACT, ONCHANGE, ONINPUT } = X;
  const FORMATS = { short: { w: 1080, h: 1920, l: 'Short / Reel 9:16', safeT: 220, safeB: 400 }, portrait: { w: 1080, h: 1350, l: 'Portrait 4:5', safeT: 90, safeB: 120 }, post: { w: 1080, h: 1080, l: 'Post 1:1', safeT: 80, safeB: 110 }, yt: { w: 1920, h: 1080, l: 'YouTube 16:9', safeT: 80, safeB: 100 }, pin: { w: 1000, h: 1500, l: 'Épingle 2:3', safeT: 90, safeB: 130 } };
  const THEMES = {
    bordeaux: { bg: ['#2A0711', '#6E1A2D'], ink: '#F7E9EC', muted: 'rgba(247,233,236,.72)', acc: '#C9A227', panel: 'rgba(0,0,0,.28)', felt: ['#7A1F33', '#3A0B16'] },
    nuit: { bg: ['#0B0709', '#1C1115'], ink: '#F4E9EC', muted: 'rgba(244,233,236,.68)', acc: '#E25A7B', panel: 'rgba(255,255,255,.06)', felt: ['#2C1820', '#120A0D'] },
    feutre: { bg: ['#05251A', '#0E4A31'], ink: '#F2EFE6', muted: 'rgba(242,239,230,.72)', acc: '#D4AF37', panel: 'rgba(0,0,0,.26)', felt: ['#14603F', '#08311F'] },
    ardoise: { bg: ['#14171C', '#262B33'], ink: '#EEF1F4', muted: 'rgba(238,241,244,.68)', acc: '#4FB3BF', panel: 'rgba(255,255,255,.07)', felt: ['#2B4A5C', '#16252E'] },
    creme: { bg: ['#F7F2F3', '#EADFE2'], ink: '#1B1014', muted: 'rgba(27,16,20,.66)', acc: '#8C1D36', panel: 'rgba(140,29,54,.08)', felt: ['#7A1F33', '#3A0B16'] },
  };
  const MENTION = 'Jouer comporte des risques : endettement, dépendance… Appelez le 09 74 75 13 13 (appel non surtaxé). Interdit aux moins de 18 ans.';
  const st = { dom: 'poker', tpl: 'main', fmt: 'short', theme: 'bordeaux', hook: '', handle: '', cta: '', endCard: false, guides: false, mention: true, frame: 0, handSrc: '', quiz: null, quizType: 'mix', mod: 'mdf', champ: 'predateur', rec: null, msg: '', p: {}, batchN: 10, busy: null, img: 'png' };
  let REC = false; // vrai pendant l'enregistrement vidéo : comptes à rebours et animations

  // ---------------- Sources ----------------
  function handSources() {
    const out = [];
    const rp = X.getReplay?.(); if (rp) out.push(['replay', 'Main ouverte dans le replayer', rp.raw]);
    const g = X.getCash?.(); if (g?.tb?.history?.length) out.push(['sim', 'Dernière main du simulateur', g.tb.history[g.tb.history.length - 1]]);
    state.library.hands.slice(0, 30).forEach((m) => out.push(['lib:' + m.id, `Bibliothèque · ${m.date} · ${m.cards || '?'} · ${m.net >= 0 ? '+' : ''}${fr(m.net, 1)} bb`, m.raw]));
    return out;
  }
  const SIGN = { s: '♠', h: '♥', d: '♦', c: '♣' }, RED = { h: '#C8202F', d: '#1D5FD1', c: '#17803F', s: '#1B1014' };
  function handFrames(raw) {
    const h = HH.parseHand(raw); if (!h.seats.length) return null;
    const pos = HH.positions(h), bb = h.bb || 1, who = (p) => (p === h.hero ? 'Moi (' + (pos[p] || '?') + ')' : pos[p] || 'Adversaire');
    const f = (x) => fr(x / bb, x / bb >= 10 ? 0 : 1);
    const streets = ['pre', 'flop', 'turn', 'river'], N = { pre: 0, flop: 3, turn: 4, river: 5 }, frames = [];
    let put = 0, streetPut = {}, cur = 'pre';
    const by = { pre: [], flop: [], turn: [], river: [] };
    for (const a of h.actions) {
      if (a.street !== cur) { cur = a.street; streetPut = {}; }
      if (a.type === 'post') { put += a.amt; if (a.kind !== 'ante') streetPut[a.p] = (streetPut[a.p] || 0) + a.amt; continue; }
      let add = 0, t = '';
      if (a.type === 'folds') t = `${who(a.p)} se couche`;
      else if (a.type === 'checks') t = `${who(a.p)} checke`;
      else if (a.type === 'calls') { add = a.amt; t = `${who(a.p)} suit ${f(a.amt)} bb`; }
      else if (a.type === 'bets') { add = a.amt; t = `${who(a.p)} mise ${f(a.amt)} bb`; }
      else if (a.type === 'raises') { const to = a.to || a.amt; add = to - (streetPut[a.p] || 0); t = `${who(a.p)} relance à ${f(to)} bb`; }
      if (a.allin) t += ' (tapis)';
      streetPut[a.p] = (streetPut[a.p] || 0) + add; put += add;
      if (by[a.street]) by[a.street].push({ t, pot: put });
    }
    for (const s of streets) {
      if (s !== 'pre' && h.board.length < N[s]) break;
      const last = by[s][by[s].length - 1];
      frames.push({ label: { pre: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River' }[s], board: h.board.slice(0, N[s]), lines: by[s].map((x) => x.t), pot: (last ? last.pot : put) / bb });
    }
    const won = Object.entries(h.collected).map(([p, v]) => `${who(p)} remporte ${f(v)} bb`);
    const shown = Object.entries(h.shown).filter(([p]) => p !== h.hero).map(([p, c]) => ({ who: who(p), cards: c }));
    frames.push({ label: 'Résultat', board: h.board.slice(), lines: won.length ? won : ['Fin de la main'], pot: put / bb, shown, result: true });
    return { frames, hero: h.heroCards, heroPos: pos[h.hero] || '', stakes: `${h.sb}/${h.bb}`, site: h.site };
  }
  const pretty = (t) => String(t).replace(/<[^>]+>/g, '').replace(/\b([2-9TJQKA])([shdc])\b/g, (m, r, su) => (r === 'T' ? '10' : r) + SIGN[su]);
  function newQuiz() {
    const r = Math.random; let q, k = 0;
    do q = st.quizType === 'mix' ? S.mix(r) : S.GEN[st.quizType](r); while ((!q || q.opts.length > 4) && k++ < 20);
    st.quiz = q; st.frame = 0;
  }

  // ---------------- Dessin ----------------
  const FD = '"Unbounded", "Arial Black", sans-serif', FB = '"IBM Plex Sans", system-ui, sans-serif', FM = '"IBM Plex Mono", ui-monospace, monospace';
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function wrap(g, text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  function text(g, s, x, y, o = {}) {
    g.font = `${o.weight || 500} ${o.size || 40}px ${o.font || FB}`; g.fillStyle = o.color || '#fff'; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    const lines = o.maxW ? wrap(g, s, o.maxW) : [String(s)], lh = (o.size || 40) * (o.lh || 1.25);
    const lim = o.maxLines ? lines.slice(0, o.maxLines) : lines;
    lim.forEach((l, i) => g.fillText(i === lim.length - 1 && lines.length > lim.length ? l.replace(/.{0,2}$/, '…') : l, x, y + i * lh));
    return y + lim.length * lh;
  }
  function cardAt(g, c, x, y, w) {
    const h = w * 1.4, r = E.RANKS[c >> 2].replace('T', '10'), su = E.SUITS[c & 3];
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = w * 0.12; g.shadowOffsetY = w * 0.04;
    rr(g, x, y, w, h, w * 0.12); g.fillStyle = '#FFFDFB'; g.fill(); g.restore();
    g.fillStyle = RED[su]; g.textAlign = 'center'; g.font = `600 ${w * 0.5}px ${FM}`; g.fillText(r, x + w / 2, y + h * 0.5);
    g.font = `${w * 0.42}px ${FB}`; g.fillText(SIGN[su], x + w / 2, y + h * 0.86);
  }
  function cardsRow(g, cards, cx, y, w, gap) { const tw = cards.length * w + (cards.length - 1) * gap; cards.forEach((c, i) => cardAt(g, c, cx - tw / 2 + i * (w + gap), y, w)); return y + w * 1.4; }
  function frame(g, F, T) {
    const gr = g.createLinearGradient(0, 0, F.w * 0.3, F.h); gr.addColorStop(0, T.bg[0]); gr.addColorStop(1, T.bg[1]);
    g.fillStyle = gr; g.fillRect(0, 0, F.w, F.h);
    // Filigrane σ en fond
    g.save(); g.globalAlpha = 0.05; g.fillStyle = T.ink; g.font = `800 ${F.w * 0.9}px ${FD}`; g.textAlign = 'center'; g.fillText('σ', F.w * 0.78, F.h * 0.62); g.restore();
  }
  function header(g, F, T, kicker, title) {
    const pad = F.w > F.h ? 90 : 70, top = F.safeT;
    g.fillStyle = T.acc; g.font = `600 ${F.w > F.h ? 30 : 32}px ${FM}`; g.textAlign = 'left'; g.fillText(kicker.toUpperCase(), pad, top);
    const y = text(g, title, pad, top + (F.w > F.h ? 70 : 84), { font: FD, weight: 700, size: F.w > F.h ? 62 : 66, color: T.ink, maxW: F.w - pad * 2, lh: 1.12, maxLines: 3 });
    return y + 10;
  }
  function footer(g, F, T) {
    const pad = F.w > F.h ? 90 : 70, y = F.h - F.safeB + 50;
    g.fillStyle = T.ink; g.font = `800 34px ${FD}`; g.textAlign = 'left'; g.fillText('σ52', pad, y);
    g.fillStyle = T.muted; g.font = `500 26px ${FM}`; g.fillText(st.handle ? st.handle : st.dom === 'bj' ? 'SIGMA 52 · labo blackjack' : 'SIGMA 52 · labo poker', pad + 100, y);
    if (st.mention) text(g, MENTION, pad, y + 46, { size: 22, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
  }
  const FRAMES = {
    main(g, F, T, k) {
      const src = handSources().find((x) => x[0] === st.handSrc) || handSources()[0];
      if (!src) return emptyFrame(g, F, T, 'Aucune main', 'Ouvre une main dans le replayer, joue au simulateur ou sauvegarde une main dans ta bibliothèque.');
      const H = handFrames(src[2]); if (!H) return emptyFrame(g, F, T, 'Main illisible', '');
      const fr_ = H.frames[Math.min(k, H.frames.length - 1)], pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      let y = header(g, F, T, `${fr_.label} · pot ${fr(fr_.pot, 1)} bb`, st.hook || 'Comment tu joues cette main ?');
      // Tapis
      const fx = pad, fw = land ? F.w * 0.55 : F.w - pad * 2, fy = y + 20, fh = land ? F.h - fy - F.safeB - 40 : Math.min(620, F.h * 0.34);
      const fg = g.createRadialGradient(fx + fw / 2, fy + fh * 0.35, 20, fx + fw / 2, fy + fh / 2, fw * 0.7); fg.addColorStop(0, T.felt[0]); fg.addColorStop(1, T.felt[1]);
      rr(g, fx, fy, fw, fh, fh * 0.45); g.fillStyle = fg; g.fill(); g.strokeStyle = 'rgba(201,162,39,.55)'; g.lineWidth = 4; g.stroke();
      const cw = Math.min(118, fw / 6.6);
      if (fr_.board.length) cardsRow(g, fr_.board, fx + fw / 2, fy + fh * 0.16, cw, cw * 0.14);
      else text(g, 'Préflop', fx + fw / 2, fy + fh * 0.36, { align: 'center', size: 44, font: FD, weight: 700, color: 'rgba(247,233,236,.6)' });
      if (H.hero) { text(g, `Moi${H.heroPos ? ' · ' + H.heroPos : ''}`, fx + fw / 2, fy + fh * 0.66, { align: 'center', size: 30, color: '#F7E9EC', font: FM, weight: 600 }); cardsRow(g, H.hero, fx + fw / 2, fy + fh * 0.7, cw * 0.82, cw * 0.12); }
      // Actions
      let ay = land ? fy : fy + fh + 50; const ax = land ? fx + fw + 60 : pad, aw = land ? F.w - ax - pad : F.w - pad * 2;
      const lines = fr_.lines.slice(-(land ? 9 : 8));
      for (const l of lines) { rr(g, ax, ay, aw, land ? 64 : 70, 16); g.fillStyle = T.panel; g.fill(); text(g, l, ax + 24, ay + (land ? 43 : 47), { size: land ? 30 : 34, color: T.ink, maxW: aw - 40, maxLines: 1 }); ay += land ? 76 : 84; }
      if (fr_.result && fr_.shown?.length) for (const s of fr_.shown.slice(0, 2)) { text(g, s.who + ' montre', ax, ay + 40, { size: 30, color: T.muted }); cardsRow(g, s.cards, ax + 170 + 60, ay + 60, 70, 10); ay += 170; }
      footer(g, F, T); return H.frames.length;
    },
    quiz(g, F, T, k, p) {
      if (!st.quiz) newQuiz(); if (!k) countdown(g, F, T, p);
      const q = st.quiz, pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      let y = header(g, F, T, k ? 'Réponse' : 'Quiz poker', st.hook || (k ? 'La bonne décision' : 'Tu fais quoi ?'));
      const plain = pretty(q.prompt);
      y = text(g, plain, pad, y + 40, { size: land ? 36 : 40, color: T.ink, maxW: F.w - pad * 2, lh: 1.32, maxLines: 6 });
      const cards = q.hands ? [] : q.cards || [], board = q.board || [];
      if (q.hands) {
        y += 20; if (board.length) { cardsRow(g, board, F.w / 2, y, land ? 90 : 110, 14); y += (land ? 90 : 110) * 1.4 + 30; }
        const cw = land ? 76 : 92;
        [['Toi', q.hands[0]], ['Lui', q.hands[1]]].forEach(([l, hc], i) => { const cx = F.w / 2 + (i ? 1 : -1) * F.w * 0.2; text(g, l, cx, y + 30, { align: 'center', size: 30, font: FM, weight: 600, color: T.muted }); cardsRow(g, hc, cx, y + 46, cw, 10); });
        y += 46 + cw * 1.4 + 10;
      }
      if (cards.length || (board.length && !q.hands)) { y += 20; if (board.length) { cardsRow(g, board, F.w / 2, y, land ? 90 : 110, 14); y += (land ? 90 : 110) * 1.4 + 24; } if (cards.length) { cardsRow(g, cards, F.w / 2, y, land ? 80 : 96, 12); y += (land ? 80 : 96) * 1.4 + 20; } }
      y += 20;
      q.opts.forEach((o, i) => {
        const good = k && i === q.ok, h = land ? 70 : 92;
        rr(g, pad, y, F.w - pad * 2, h, 18); g.fillStyle = good ? T.acc : T.panel; g.fill();
        text(g, `${'ABCD'[i]}  ${o}`, pad + 30, y + h * 0.64, { size: land ? 32 : 38, weight: 600, color: good ? (st.theme === 'creme' ? '#fff' : '#2B1608') : T.ink, maxW: F.w - pad * 2 - 60, maxLines: 1 });
        y += h + 16;
      });
      if (k) text(g, pretty(q.why), pad, y + 40, { size: land ? 28 : 32, color: T.muted, maxW: F.w - pad * 2, lh: 1.32, maxLines: land ? 3 : 6 });
      footer(g, F, T); return 2;
    },
    // Leçon animée : titre, une image par notion clé, question du quiz, réponse, conclusion. p = avancement de l'animation (0 à 1).
    lecon(g, F, T, k = 0, p = 1) {
      const m = K.MODULES.find((x) => x.id === st.mod) || K.MODULES[0];
      return lessonFrame(g, F, T, k, p, m, `Leçon · niveau ${m.level} · ${K.LEVELS[m.level - 1].title}`, 'Le module complet, ses exercices et 30 spots corrigés sont dans SIGMA 52.');
    },
    solveur(g, F, T) {
      const sv = X.solverState, info = sv?.info;
      if (!info || info.node.t !== PF.ACT) return emptyFrame(g, F, T, 'Rien à montrer', 'Résous un spot dans l\'onglet Solveur et place-toi sur une décision.');
      const gm = sv.game, node = info.node, p = node.p, n = gm.N[p], A = node.acts.length, pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      const cols = ['#5B7EA6', '#3C9A63', '#D9768E', '#B23656', '#851A33', '#3A0814'];
      const cls = node.acts.map((a) => (a.k === 'f' ? 0 : a.k === 'x' || a.k === 'c' ? 1 : a.k === 'a' ? 5 : 2));
      let bi = 2; node.acts.forEach((a, i) => { if (a.k === 'b' || a.k === 'r') { cls[i] = Math.min(4, bi++); } });
      let y = header(g, F, T, `Solveur · ${sv.names[p]} parle · pot ${fr(info.pot, 1)} bb`, st.hook || 'Ce que fait l\'équilibre ici');
      cardsRow(g, info.board, land ? pad + 220 : F.w / 2, y + 10, land ? 70 : 84, 10); y += (land ? 70 : 84) * 1.4 + 40;
      const agg = new Map();
      for (let i = 0; i < n; i++) { const hc = E.abstractOf(gm.hands[p][i][0], gm.hands[p][i][1]); let x = agg.get(hc); if (!x) agg.set(hc, x = { m: 0, f: new Array(A).fill(0) }); const w = info.reach[p][i]; x.m += w; for (let a = 0; a < A; a++) x.f[a] += w * info.strategy[a * n + i]; }
      const size = land ? Math.min(F.h - y - F.safeB - 20, 700) : F.w - pad * 2, cs = size / 13, gx = land ? pad : pad;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
        const h = E.handName(r, c), x = agg.get(h), X0 = gx + c * cs, Y0 = y + r * cs;
        rr(g, X0 + 1, Y0 + 1, cs - 2, cs - 2, 4); g.fillStyle = 'rgba(255,255,255,.06)'; g.fill();
        if (x && x.m > 1e-6) { let off = 0; g.save(); rr(g, X0 + 1, Y0 + 1, cs - 2, cs - 2, 4); g.clip(); for (let a = 0; a < A; a++) { const wv = (x.f[a] / x.m) * (cs - 2); g.fillStyle = cols[cls[a]]; g.fillRect(X0 + 1 + off, Y0 + 1, wv, cs - 2); off += wv; } g.restore(); }
        g.fillStyle = 'rgba(255,255,255,.88)'; g.font = `600 ${cs * 0.3}px ${FM}`; g.textAlign = 'center'; g.fillText(h, X0 + cs / 2, Y0 + cs * 0.6);
      }
      let ly = land ? y : y + size + 40; const lx = land ? gx + size + 60 : pad;
      node.acts.forEach((_, a) => { rr(g, lx, ly, 34, 34, 6); g.fillStyle = cols[cls[a]]; g.fill(); text(g, `${gm.label(node, a)} · ${pct(info.freq[a], 0)}`, lx + 50, ly + 28, { size: land ? 30 : 32, color: T.ink }); ly += 54; });
      footer(g, F, T); return 1;
    },
    champion(g, F, T) {
      const s = CH.STYLES.find((x) => x.id === st.champ) || CH.STYLES[0], pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      let y = header(g, F, T, `Profil d'adversaire · ${s.family}`, st.hook || s.name);
      y = text(g, s.tagline, pad, y + 30, { size: land ? 34 : 40, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 }) + 20;
      text(g, 'COMMENT LE BATTRE', pad, y + 20, { size: 28, color: T.acc, font: FM, weight: 600 }); y += 50;
      for (const a of s.adapt.slice(0, land ? 3 : 4)) { rr(g, pad, y, F.w - pad * 2, land ? 90 : 128, 18); g.fillStyle = T.panel; g.fill(); text(g, a, pad + 26, y + 50, { size: land ? 30 : 34, color: T.ink, maxW: F.w - pad * 2 - 52, lh: 1.25, maxLines: 2 }); y += (land ? 90 : 128) + 16; }
      if (s.stats) { y += 20; const M = s.stats.six, P = (v) => Math.round((v || 0) * 100); const keys = [['VPIP', P(M.vpip)], ['PFR', P(M.pfr)], ['3-bet', P(M.three)], ['C-bet', P(M.cbet)]]; const bw = (F.w - pad * 2 - 30 * 3) / 4;
        keys.forEach(([l, v], i) => { const x = pad + i * (bw + 30); text(g, v + ' %', x, y + 50, { size: 50, font: FM, weight: 600, color: T.ink }); text(g, l, x, y + 92, { size: 26, color: T.muted, font: FM }); }); }
      text(g, 'Profil d\'entraînement SIGMA 52 (archétype), statistiques mesurées sur le bot à 6 joueurs.', pad, F.h - F.safeB - 20, { size: 22, color: T.muted, maxW: F.w - pad * 2, maxLines: 2 });
      footer(g, F, T); return 1;
    },
    bilan(g, F, T) {
      const ss = state.journal.sessions.slice().sort((a, b) => a.date.localeCompare(b.date)), pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      if (!ss.length) return emptyFrame(g, F, T, 'Pas encore de session', 'Saisis tes sessions dans le Journal.');
      const tot = ss.reduce((a, s) => a + s.result, 0), hands = ss.reduce((a, s) => a + (s.hands || 0), 0);
      let y = header(g, F, T, `Bilan · ${ss.length} session${ss.length > 1 ? 's' : ''}`, st.hook || 'Mon suivi poker');
      const stats = [['Résultat', (tot >= 0 ? '+' : '−') + fr(Math.abs(tot), 0) + ' €'], ['Mains', fr(hands, 0)], ['Sessions', String(ss.length)]];
      const bw = (F.w - pad * 2 - 40) / 3; stats.forEach(([l, v], i) => { const x = pad + i * (bw + 20); rr(g, x, y + 20, bw, 150, 18); g.fillStyle = T.panel; g.fill(); text(g, v, x + 24, y + 100, { size: 46, font: FM, weight: 600, color: T.ink, maxW: bw - 40, maxLines: 1 }); text(g, l, x + 24, y + 145, { size: 26, color: T.muted }); });
      y += 220;
      let c = 0; const pts = ss.map((s) => (c += s.result)); const mn = Math.min(0, ...pts), mx = Math.max(0, ...pts), ch = land ? F.h - y - F.safeB - 30 : Math.min(600, F.h - y - F.safeB - 60), cw = F.w - pad * 2;
      g.strokeStyle = T.muted; g.lineWidth = 2; g.setLineDash([8, 8]); const zy = y + ch - ((0 - mn) / Math.max(1e-9, mx - mn)) * ch; g.beginPath(); g.moveTo(pad, zy); g.lineTo(pad + cw, zy); g.stroke(); g.setLineDash([]);
      g.strokeStyle = T.acc; g.lineWidth = 6; g.beginPath(); pts.forEach((v, i) => { const x = pad + (pts.length === 1 ? cw : (i / (pts.length - 1)) * cw), yy = y + ch - ((v - mn) / Math.max(1e-9, mx - mn)) * ch; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
      footer(g, F, T); return 1;
    },
  };
  // Leçon animée (poker ou blackjack) : titre, une image par notion clé, question, réponse, conclusion. p = avancement (0 à 1).
  function lessonFrame(g, F, T, k = 0, p = 1, m, kick, endNote) {
      const pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      const keys = m.keys.slice(0, 5), q = (m.quiz || [])[0], n = keys.length + (q ? 2 : 0) + 2, a = Math.min(1, p * 3), ease = 1 - Math.pow(1 - a, 3);
      g.save(); g.globalAlpha = 0.25 + 0.75 * ease; g.translate(0, (1 - ease) * 40);
      if (k === 0) {
        let y = header(g, F, T, kick, st.hook || m.title);
        y = text(g, `${m.minutes} min · ${keys.length} notions clés${q ? ' · une question pour finir' : ''}`, pad, y + 40, { size: land ? 34 : 40, color: T.muted, maxW: F.w - pad * 2 });
        keys.forEach((kx, i) => { g.fillStyle = T.acc; g.beginPath(); g.arc(pad + 14, y + 56 + i * (land ? 56 : 70), 9, 0, Math.PI * 2); g.fill(); text(g, kx, pad + 44, y + 66 + i * (land ? 56 : 70), { size: land ? 26 : 30, color: T.ink, maxW: F.w - pad * 2 - 44, maxLines: 1 }); });
      } else if (k <= keys.length) {
        let y = header(g, F, T, `${kick} · notion ${k}/${keys.length}`, m.title);
        g.fillStyle = T.acc; g.font = `800 ${land ? 120 : 150}px ${FD}`; g.textAlign = 'left'; g.fillText(String(k), pad, y + (land ? 130 : 170));
        text(g, keys[k - 1], pad, y + (land ? 220 : 290), { size: land ? 46 : 54, weight: 600, color: T.ink, maxW: F.w - pad * 2, lh: 1.25, maxLines: land ? 4 : 7 });
        rr(g, pad, F.h - F.safeB - 70, F.w - pad * 2, 10, 5); g.fillStyle = T.panel; g.fill(); rr(g, pad, F.h - F.safeB - 70, (F.w - pad * 2) * (k / keys.length) * Math.min(1, 0.6 + 0.4 * p), 10, 5); g.fillStyle = T.acc; g.fill();
      } else if (q && k <= keys.length + 2) {
        const ans = k === keys.length + 2; if (!ans) countdown(g, F, T, p);
        let y = header(g, F, T, kick, ans ? 'La réponse' : 'À toi');
        y = text(g, pretty(q.q), pad, y + 40, { size: land ? 34 : 40, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 4 }) + 20;
        q.opts.forEach((o, i) => { const good = ans && i === q.ok, h = land ? 64 : 84; rr(g, pad, y, F.w - pad * 2, h, 16); g.fillStyle = good ? T.acc : T.panel; g.fill(); text(g, `${'ABCD'[i]}  ${o}`, pad + 26, y + h * 0.64, { size: land ? 28 : 33, weight: 600, color: good ? (st.theme === 'creme' ? '#fff' : '#2B1608') : T.ink, maxW: F.w - pad * 2 - 52, maxLines: 1 }); y += h + 14; });
        if (ans) text(g, pretty(q.why), pad, y + 30, { size: land ? 26 : 30, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: land ? 3 : 5 });
      } else {
        let y = header(g, F, T, kick, 'À retenir');
        y = text(g, keys[0] || m.title, pad, y + 50, { size: land ? 40 : 46, weight: 600, color: T.ink, maxW: F.w - pad * 2, lh: 1.25, maxLines: 4 });
        text(g, endNote, pad, y + 70, { size: land ? 28 : 32, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
      }
      g.restore(); footer(g, F, T); return n;
  }

  function emptyFrame(g, F, T, t, d) { const pad = 70; header(g, F, T, 'Studio', t); text(g, d, pad, F.h / 2, { size: 38, color: T.muted, maxW: F.w - pad * 2, lh: 1.3 }); footer(g, F, T); return 1; }

  // =====================================================================
  // Outils communs aux nouveaux modèles
  // =====================================================================
  const LY = (F) => ({ pad: F.w > F.h ? 90 : 70, land: F.w > F.h });
  const pc = (x, d = 1) => fr(x * 100, d) + ' %';
  const spc = (x, d = 1) => (x >= 0 ? '+' : '−') + fr(Math.abs(x * 100), d) + ' %';
  const sgn = (x, d = 0) => (x > 0 ? '+' : x < 0 ? '−' : '') + fr(Math.abs(x), d);
  function mrng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const PR = (id, def) => { const o = st.p[id] || (st.p[id] = {}); for (const k in def || {}) if (o[k] === undefined) o[k] = def[k]; return o; };
  const comb = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; };
  const onAcc = () => (st.theme === 'creme' ? '#fff' : '#2B1608');
  // Compte à rebours (vidéo seulement) en haut à droite des images « question ».
  function countdown(g, F, T, p) {
    if (!REC || p === undefined) return; const x = F.w - (F.w > F.h ? 140 : 120), y = F.safeT - 12, r = 44;
    g.save(); g.lineWidth = 10; g.strokeStyle = T.panel; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = T.acc; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, 1 - p)); g.stroke();
    text(g, String(Math.max(1, Math.ceil((1 - p) * 3))), x, y + 15, { align: 'center', size: 42, font: FD, weight: 700, color: T.ink }); g.restore();
  }
  // Barres horizontales : items [{ l, v, s, c }] ; valeurs signées acceptées (axe zéro tracé).
  function hbars(g, F, T, items, x, y, w, h, o = {}) {
    const n = Math.max(1, items.length), rowH = Math.min(o.maxRow || 100, h / n), lw = o.labelW ?? w * 0.34, vw = o.valW ?? w * 0.2, bw = w - lw - vw;
    const vals = items.map((i) => i.v), mp = Math.max(0, ...vals), mn = Math.max(0, ...vals.map((v) => -v)), sc = bw / Math.max(1e-12, mp + mn), z = x + lw + mn * sc;
    const fs = Math.min(o.fs || 34, rowH * 0.42);
    items.forEach((it, i) => {
      const yy = y + i * rowH, bh = rowH * 0.6, len = Math.abs(it.v) * sc;
      text(g, it.l, x, yy + rowH / 2 + fs * 0.36, { size: fs, color: it.hi ? T.ink : T.ink, weight: it.hi ? 700 : 500, maxW: lw - 14, maxLines: 1 });
      rr(g, it.v >= 0 ? z : z - len, yy + (rowH - bh) / 2, Math.max(3, len), bh, Math.min(10, bh / 3)); g.fillStyle = it.c || T.acc; g.fill();
      text(g, it.s, x + lw + bw + 14, yy + rowH / 2 + fs * 0.36, { size: fs, font: FM, weight: 600, color: T.ink, maxW: vw - 14, maxLines: 1 });
    });
    if (mn > 0) { g.strokeStyle = T.muted; g.lineWidth = 2; g.beginPath(); g.moveTo(z, y - 6); g.lineTo(z, y + n * rowH + 6); g.stroke(); }
    return y + n * rowH;
  }
  function note(g, F, T, s) { const { pad } = LY(F); text(g, s, pad, F.h - F.safeB - 18, { size: 22, color: T.muted, maxW: F.w - pad * 2, lh: 1.25, maxLines: 2 }); }
  function bigPanel(g, F, T, y, s, o = {}) { const { pad, land } = LY(F), h = o.h || (land ? 120 : 150); rr(g, pad, y, F.w - pad * 2, h, 22); g.fillStyle = o.fill || T.panel; g.fill(); text(g, s, pad + 34, y + h * 0.62, { size: o.size || (land ? 44 : 50), font: o.font || FD, weight: 700, color: o.color || T.ink, maxW: F.w - pad * 2 - 68, maxLines: 1 }); return y + h; }
  function options(g, F, T, y, opts, good, o = {}) {
    const { pad, land } = LY(F), h = o.h || (land ? 68 : 88);
    opts.forEach((op, i) => { const ok = good === i; rr(g, pad, y, F.w - pad * 2, h, 18); g.fillStyle = ok ? T.acc : T.panel; g.fill(); text(g, `${'ABCDE'[i]}  ${op}`, pad + 28, y + h * 0.64, { size: land ? 30 : 36, weight: 600, color: ok ? onAcc() : T.ink, maxW: F.w - pad * 2 - 56, maxLines: 1 }); y += h + 14; });
    return y;
  }

  // =====================================================================
  // Blackjack : accès au moteur et aux données
  // =====================================================================
  const BJm = () => window.BJ, BD = () => window.BJDATA || {}, BC = () => window.BJCourse, CTm = () => window.BJCounts, SHm = () => window.BJShuffle, BA = () => X.BJAPP;
  const UPN = (u) => (u === 1 ? 'As' : String(u));
  const ROWL = (id) => (BC()?.rowLabel ? BC().rowLabel(id) : id);
  const AFR = { stand: 'Rester', hit: 'Tirer', double: 'Doubler', split: 'Séparer', surrender: 'Abandonner' };
  const ACOL = { S: '#5B7EA6', H: '#D9768E', D: '#3C9A63', P: '#C9A227', R: '#8E6BC2' };
  const bjCard = (rank, rnd) => ((rank === 1 ? 12 : rank === 10 ? 8 + Math.floor(rnd() * 4) : rank - 2) << 2) | Math.floor(rnd() * 4);
  const rankOfE = (c) => { const r = c >> 2; return r === 12 ? 1 : r >= 8 ? 10 : r + 2; };
  const presetSel = (id, v) => `<label class="f">Règles<select data-sp="${id}.key">${Object.entries(BD().presets || {}).map(([k, p]) => `<option value="${k}"${v === k ? ' selected' : ''}>${esc(p.label)}</option>`).join('')}</select></label>`;
  const sel = (id, field, opts, v, label) => `<label class="f">${label}<select data-sp="${id}.${field}">${opts.map(([k, l]) => `<option value="${esc(String(k))}"${String(v) === String(k) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const itemSel = (id, list, i, label) => sel(id, 'i', list.map((l, k) => [k, l]), i, label);

  // =====================================================================
  // Données de contenu : chiffres et mythes
  // =====================================================================
  function factsPoker() {
    const out = [], tot = comb(50, 3);
    out.push({ n: pc(3 / 51), t: 'Paire servie', d: 'Une main de départ sur 17 est une paire : 3 cartes sur 51 complètent la première.' });
    out.push({ n: pc(1 / 221, 2), t: 'Une paire d\'as', d: '6 combinaisons sur 1 326 : une main sur 221.' });
    out.push({ n: pc(12 / 51), t: 'Deux cartes assorties', d: 'Moins d\'une main sur quatre. Et assorties ne veut pas dire jouables.' });
    out.push({ n: pc(1 - comb(48, 3) / tot), t: 'Toucher un brelan au flop avec une paire', d: 'Environ une fois sur 8,5 : la base des cotes implicites des petites paires.' });
    out.push({ n: pc(comb(11, 3) / tot, 2), t: 'Flopper une couleur avec deux cartes assorties', d: 'Moins d\'une fois sur cent. Le flop couleur reste un tirage la plupart du temps.' });
    out.push({ n: pc(1 - comb(44, 3) / tot), t: 'Au moins une paire au flop sans paire servie', d: 'Deux fois sur trois, tu rates le flop.' });
    out.push({ n: pc(1 - (38 / 47) * (37 / 46)), t: 'Tirage couleur du flop à la river', d: '9 outs, deux cartes à venir. Règle du 4 : 36 %, proche du vrai chiffre.' });
    out.push({ n: pc(1 - (39 / 47) * (38 / 46)), t: 'Tirage quinte par les deux bouts', d: '8 outs du flop à la river.' });
    out.push({ n: pc(1 - (43 / 47) * (42 / 46)), t: 'Quinte ventrale', d: '4 outs du flop à la river : rarement assez sans cotes implicites.' });
    out.push({ n: pc(9 / 46), t: 'Tirage couleur sur une carte', d: 'De la turn à la river : 9 outs sur 46 cartes inconnues. Règle du 2 : 18 %.' });
    out.push({ n: pc(1 / 3), t: 'Cote pour payer une mise du pot', d: 'Payer 1 pour un pot final de 3 : il faut gagner au moins une fois sur trois.' });
    out.push({ n: pc(0.5 / 2), t: 'Cote pour payer une demi-mise du pot', d: 'Payer 0,5 pour un pot final de 2 : 25 % d\'équité suffisent.' });
    out.push({ n: pc(1 - Math.pow(1 - 6 / 1225, 8), 1), t: 'Tu as les rois : un adversaire a les as', d: 'À une table de 9 : probabilité qu\'au moins un des 8 autres joueurs ait une paire d\'as (approximation par joueurs indépendants).' });
    return out;
  }
  function factsBJ() {
    const out = [], D = BD(), BJ = BJm();
    out.push({ n: pc(2 * (24 / 312) * (96 / 311), 2), t: 'Recevoir un blackjack (6 jeux)', d: 'Un peu moins d\'une main sur 21. Payé 3:2, il vaut 1,5 mise ; payé 6:5, seulement 1,2.' });
    if (D.presets) {
      const e = (k) => D.presets[k].edge;
      out.push({ n: spc(-e('strip'), 2), t: 'Avantage du joueur, stratégie de base parfaite', d: `${D.presets.strip.label} : la meilleure stratégie sans compter perd encore ${pc(e('strip'), 2)} des mises.` });
      out.push({ n: spc(-e('europe'), 2), t: 'Le jeu européen sans carte cachée', d: `${D.presets.europe.label} : toutes les mises perdues contre un blackjack du croupier, double limité.` });
      const c65 = D.ruleCosts?.rows?.find((r) => /6:5/.test(r[0])); if (c65) out.push({ n: '+' + fr(c65[1] * 100, 2) + ' pt', t: 'Le coût du blackjack payé 6:5', d: 'Cette seule règle coûte plus que tout ce que la stratégie de base peut gagner. À fuir.' });
      const T = D.presets.strip.edgeByTC; if (T) { const a = T.find((x) => x[0] === 1), b = T.find((x) => x[0] === 4); if (a && b) out.push({ n: '≈ ' + spc((b[1] - a[1]) / 3, 1), t: 'Avantage gagné par point de true count', d: `Hi-Lo, ${D.presets.strip.label} : de ${spc(a[1])} à TC +1 jusqu'à ${spc(b[1])} à TC +4.` }); }
      out.push({ n: '+' + fr(D.presets.strip.insurance.index, 0), t: 'True count Hi-Lo où l\'assurance devient rentable', d: 'Il faut plus d\'un tiers de 10 dans le reste du sabot. En dessous, l\'assurance est un pari perdant.' });
    }
    out.push({ n: spc(2 * (96 / 311) - (215 / 311), 1), t: 'Espérance de l\'assurance sans compter (6 jeux)', d: '96 dix sur 311 cartes : le pari 2 contre 1 perd en moyenne 7 % de ce qu\'il engage.' });
    if (BJ && D.presets) {
      try { const c = BJ.Calc(D.presets.strip.rules), s = BJ.shoeOf(6); for (const u of [6, 2, 10, 1]) { const x = s.slice(); x[u]--; const b = c.dealerDist(x, u)[5]; out.push({ n: pc(b), t: `Le croupier crève avec ${u === 1 ? 'un as' : 'un ' + u} visible`, d: u === 6 ? 'La pire carte pour le croupier : d\'où rester sur 12 à 16 contre 4, 5 et 6.' : u === 10 ? 'Contre un 10 visible, le croupier crève rarement : 16 doit tirer (ou abandonner).' : u === 1 ? 'Avec un as visible (sans blackjack), le croupier fait presque toujours une main.' : 'Contre un 2, rester sur 12 est une erreur : tirer.' }); } } catch (e) { /* moteur indisponible */ }
    }
    out.push({ n: pc((4 * 24 - 1 + 96 - 2) / 309), t: 'Crever en tirant sur 16 (10-6)', d: 'Contre un 10 du croupier, tirer reste pourtant un peu meilleur que rester.' });
    if (D.tech?.first) out.push({ n: spc(D.tech.first.strip[1], 0), t: 'Espérance d\'une main qui commence par un as', d: 'Calcul exact : un as en première carte vaut une demi-mise. C\'est tout l\'intérêt du séquençage des as.' });
    if (D.tech?.hole) out.push({ n: spc(D.tech.hole.strip.full, 1), t: 'Avantage en connaissant la carte cachée', d: 'Calcul exact SIGMA 52. Voir la carte par accident n\'est pas tricher partout ; un appareil ou un complice, si.' });
    const hs = BA()?.big?.('strip|hilo|0.75|1|none'); if (hs && hs.n0) out.push({ n: fr(hs.n0, 0), t: 'Mains pour que le talent dépasse la chance', d: 'N0 du Hi-Lo, sabot de 6 à 75 %, rampe optimale 1-12 (simulation de référence). Des dizaines d\'heures de jeu.' });
    return out;
  }
  const MYTHS = {
    poker: [
      { m: 'Le bluff est le cœur du poker.', r: 'L\'essentiel des gains vient des mises de valeur contre des mains moins bonnes.', d: 'Le bluff équilibre une stratégie. Contre la plupart des joueurs amateurs, miser ses bonnes mains plus gros rapporte davantage.' },
      { m: 'Une bonne session prouve qu\'on joue bien.', r: 'Une session ne prouve rien : la variance domine sur quelques milliers de mains.', d: 'Juge tes décisions, pas tes résultats. Le résultat ne se lit que sur des dizaines de milliers de mains.' },
      { m: 'Les as gagnent presque toujours.', r: 'Contre une seule main, les as gagnent environ 4 fois sur 5. Contre plusieurs, beaucoup moins.', d: 'Paire d\'as contre paire de rois : environ 82 %. D\'où la relance préflop pour réduire le nombre d\'adversaires.' },
      { m: 'Un tirage couleur au flop, c\'est du 50/50.', r: '35 % jusqu\'à la river, 19,6 % pour la seule turn.', d: 'Règle du 4 au flop (deux cartes à venir), règle du 2 à la turn.' },
      { m: 'Payer pour voir est toujours une erreur.', r: 'Payer est juste quand ton équité dépasse la cote du pot.', d: 'Une mise du pot demande 33 % d\'équité ; une demi-mise, 25 %.' },
      { m: 'La stratégie GTO gagne le plus contre tout le monde.', r: 'Le GTO ne perd contre personne ; l\'exploitation gagne plus contre les joueurs faibles.', d: 'Le GTO est la base. On s\'en écarte, avec mesure, contre les erreurs répétées d\'un adversaire.' },
      { m: 'Les cartes assorties sont deux fois plus fortes.', r: 'Être assorti ajoute seulement 2 à 3 points d\'équité.', d: 'Un mauvais assorti reste une mauvaise main : K-4 assorti ne s\'ouvre pas de toutes les positions.' },
      { m: 'Il faut récupérer ses pertes dans la soirée.', r: 'Chaque main est indépendante : le tilt coûte plus que la variance.', d: 'Fixe une limite de pertes et une durée avant de t\'asseoir.' },
    ],
    bj: [
      { m: 'Compter les cartes est illégal.', r: 'Compter de tête est légal en France ; le casino peut refuser un joueur.', d: 'Tout appareil, complice dans le personnel ou marquage de cartes est en revanche une fraude.' },
      { m: 'Il faut une mémoire photographique.', r: 'Le Hi-Lo ne retient qu\'un seul nombre : +1, 0 ou −1 par carte.', d: 'La difficulté est la vitesse et la discrétion, pas la mémoire.' },
      { m: 'L\'assurance protège une bonne main.', r: 'L\'assurance est un pari séparé sur le 10 caché : perdant sans compter.', d: 'Sans compte, elle perd environ 7 % de la somme engagée. Hi-Lo : elle devient rentable vers TC +3.' },
      { m: 'Un mauvais joueur fait perdre la table.', r: 'Ses choix changent tes cartes, pas leur distribution moyenne.', d: 'Il te prend autant de bonnes cartes que de mauvaises : ton espérance ne change pas.' },
      { m: 'La Martingale finit toujours par gagner.', r: 'Aucune progression de mises ne change l\'espérance.', d: 'Beaucoup de petits gains, puis une perte énorme au plafond de la table ou au bout du capital.' },
      { m: 'Il faut supposer un 10 sous la carte du croupier.', r: 'La stratégie de base vient du calcul exact de toutes les cartes possibles.', d: 'Supposer un 10 donne de mauvaises décisions, par exemple sur 12 contre 2 ou 3.' },
      { m: 'Le compteur gagne à chaque séance.', r: 'Un compteur a environ 1 % d\'avantage : il perd souvent sur une séance.', d: 'Il faut des dizaines de milliers de mains pour que le talent dépasse la chance (N0).' },
      { m: 'Les mises annexes sont de bonnes affaires.', r: 'Leur avantage de la maison est en général bien plus élevé que celui du jeu principal.', d: 'Paires, 21+3 et autres : à éviter sauf cas de comptage très spécifiques.' },
      { m: 'Après une série de petites cartes, un 10 est dû.', r: 'Les cartes n\'ont pas de mémoire au-delà de ce que le compte mesure.', d: 'C\'est justement ce que mesure le true count : rien de plus.' },
    ],
  };

  // =====================================================================
  // Modèles
  // =====================================================================
  const TP = {};
  const add = (o) => { TP[o.id] = o; };
  const curMain = () => handSources().find((x) => x[0] === st.handSrc) || handSources()[0];

  // ---------- Poker : modèles existants ----------
  add({ id: 'main', dom: 'poker', grp: 'Tes données', l: 'Main jouée', draw: FRAMES.main,
    ctl() { const srcs = handSources(); return srcs.length ? `<label class="f">Main<select data-st="handSrc">${srcs.map(([k, l]) => `<option value="${esc(k)}"${k === st.handSrc ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : '<p class="note">Aucune main disponible : ouvre une main dans le replayer, joue au simulateur ou sauvegarde des mains dans ta bibliothèque.</p>'; },
    names(n) { const H = curMain() && handFrames(curMain()[2]); return Array.from({ length: n }, (_, i) => H?.frames[i]?.label || String(i + 1)); },
    cap: () => `${st.hook || 'Comment tu joues cette main ?'} Dis-moi en commentaire ce que tu fais à chaque rue.`,
    say() { const H = curMain() && handFrames(curMain()[2]); return H ? H.frames.map((f) => `${f.label}. ${f.lines.slice(-3).join('. ')}.`) : []; },
    dur: () => 2800 });
  add({ id: 'quiz', dom: 'poker', grp: 'Quiz', l: 'Quiz', draw: FRAMES.quiz, names: () => ['Question', 'Réponse'], reroll: () => newQuiz(),
    ctl: () => `<label class="f">Type de question<select data-st="quizType"><option value="mix">Au hasard</option>${Object.entries(S.TYPES).map(([k, l]) => `<option value="${k}"${st.quizType === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`,
    cap() { if (!st.quiz) newQuiz(); return `${st.hook || 'Tu fais quoi ?'} Réponse en commentaire 👇\n\n${pretty(st.quiz.prompt)}`; },
    say() { if (!st.quiz) newQuiz(); const q = st.quiz; return [`${pretty(q.prompt)} ${q.opts.map((o, i) => 'ABCD'[i] + ' : ' + o).join('. ')}.`, `Réponse ${'ABCD'[q.ok]} : ${q.opts[q.ok]}. ${pretty(q.why)}`]; },
    dur: (k) => (k ? 4200 : 4000) });
  add({ id: 'lecon', dom: 'poker', grp: 'Apprendre', l: 'Leçon', draw: FRAMES.lecon, anim: true,
    items: () => K.MODULES.length, pick: (i) => { st.mod = K.MODULES[i % K.MODULES.length].id; }, cur: () => Math.max(0, K.MODULES.findIndex((m) => m.id === st.mod)),
    ctl: () => `<label class="f">Module<select data-st="mod">${K.MODULES.map((m) => `<option value="${m.id}"${st.mod === m.id ? ' selected' : ''}>${m.level} · ${esc(m.title)}</option>`).join('')}</select></label>`,
    names: (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 'Titre' : i === n - 1 ? 'Fin' : String(i))),
    cap() { const md = K.MODULES.find((x) => x.id === st.mod) || K.MODULES[0]; return `${st.hook || md.title}\n\n${md.keys.map((k) => '• ' + k).join('\n')}`; },
    say() { const m = K.MODULES.find((x) => x.id === st.mod) || K.MODULES[0]; return lessonSay(m); }, dur: () => 3400 });
  add({ id: 'solveur', dom: 'poker', grp: 'Tes données', l: 'Solveur', draw: FRAMES.solveur,
    ctl: () => '<p class="note">Utilise le nœud ouvert dans l\'onglet Solveur.</p><button class="btn small" data-tab="solveur">Ouvrir le solveur</button>',
    cap: () => `${st.hook || 'Ce que fait l\'équilibre ici'} : la stratégie GTO, main par main. #gto`, say: () => ['Voici ce que fait l\'équilibre dans ce spot, main par main.'] });
  add({ id: 'champion', dom: 'poker', grp: 'Apprendre', l: 'Profil d\'adversaire', draw: FRAMES.champion,
    items: () => CH.STYLES.length, pick: (i) => { st.champ = CH.STYLES[i % CH.STYLES.length].id; }, cur: () => Math.max(0, CH.STYLES.findIndex((s) => s.id === st.champ)),
    ctl: () => `<label class="f">Style<select data-st="champ">${CH.STYLES.map((s) => `<option value="${s.id}"${st.champ === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>`,
    cap() { const s = CH.STYLES.find((x) => x.id === st.champ) || CH.STYLES[0]; return `${st.hook || s.name} : comment s'adapter à ce profil d'adversaire.\n\n${s.adapt.map((a) => '• ' + a).join('\n')}\n\nProfil d'entraînement construit par SIGMA 52 : un archétype, pas un joueur réel.`; },
    say() { const s = CH.STYLES.find((x) => x.id === st.champ) || CH.STYLES[0]; return [`${s.name}. ${s.tagline} Pour le battre : ${s.adapt.slice(0, 3).join(' ')}`]; } });
  add({ id: 'bilan', dom: 'poker', grp: 'Tes données', l: 'Bilan', draw: FRAMES.bilan, ctl: () => '<p class="note">Courbe et chiffres du Journal.</p>',
    cap: () => `${st.hook || 'Mon suivi poker'} : le résultat se juge sur le volume, pas sur une session.`, say: () => ['Mon suivi : le résultat se juge sur le volume, pas sur une session.'] });

  function lessonSay(m) { const keys = m.keys.slice(0, 5), q = (m.quiz || [])[0]; return [`${m.title}. ${keys.length} notions clés.`, ...keys, ...(q ? [`${q.q} ${q.opts.map((o, i) => 'ABCD'[i] + ' : ' + o).join('. ')}.`, `Réponse ${'ABCD'[q.ok]} : ${q.opts[q.ok]}. ${q.why}`] : []), `À retenir : ${keys[0] || m.title}.`]; }

  // ---------- Poker : range préflop ----------
  const RANGE_ITEMS = () => { const C = window.Charts; if (!C) return []; const out = C.POS.map((p) => ({ mode: 'rfi', pos: p, l: 'Ouverture · ' + p })); for (const o of Object.keys(C.FACING)) for (const h of Object.keys(C.FACING[o])) out.push({ mode: 'face', op: o, hero: h, l: `${h} face à une ouverture ${o}` }); return out; };
  const W169 = (h) => (h.length === 2 ? 6 : h[2] === 's' ? 4 : 12);
  function rangeInfo() {
    const C = window.Charts, it = RANGE_ITEMS()[PR('range', { i: 0 }).i] || RANGE_ITEMS()[0];
    if (it.mode === 'rfi') { const set = E.parseRange(C.RFI[it.pos].range); return { it, cls: (h) => (set.has(h) ? 2 : 0), title: `Ouvrir depuis ${it.pos}`, kick: `Range préflop · ${C.RFI[it.pos].label} · relance ${C.RFI[it.pos].size}`, leg: [[2, 'Relance']], pct: E.rangePct(set) / 100, str: C.RFI[it.pos].range };
    }
    const f = C.FACING[it.op][it.hero], cls = (h) => { const a = C.facingAction(it.op, it.hero, h); return a === '3bet' ? 2 : a === 'call' ? 1 : 0; };
    let t3 = 0, tc = 0; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) { const h = E.handName(i, j), c = cls(h); if (c === 2) t3 += W169(h); if (c === 1) tc += W169(h); }
    return { it, cls, title: `${it.hero} face à ${it.op}`, kick: 'Range préflop · réponse à une ouverture', leg: [[2, `3-bet ${pc(t3 / 1326, 0)}`], [1, `Payer ${pc(tc / 1326, 0)}`]], pct: (t3 + tc) / 1326, str: `3-bet : ${f.threebet}${f.call ? '\nPayer : ' + f.call : ''}` };
  }
  add({ id: 'range', dom: 'poker', grp: 'Apprendre', l: 'Range préflop',
    items: () => RANGE_ITEMS().length, pick: (i) => { PR('range').i = i % RANGE_ITEMS().length; }, cur: () => PR('range', { i: 0 }).i,
    ctl: () => itemSel('range', RANGE_ITEMS().map((x) => x.l), PR('range', { i: 0 }).i, 'Situation'),
    draw(g, F, T) {
      const R = rangeInfo(), { pad, land } = LY(F), COLS = { 0: T.panel, 1: '#3C9A63', 2: T.acc };
      let y = header(g, F, T, R.kick, st.hook || R.title);
      const size = land ? Math.min(F.h - y - F.safeB - 90, 760) : Math.min(F.w - pad * 2, F.h - y - F.safeB - 360), cs = size / 13, gx = land ? pad : (F.w - size) / 2;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
        const h = E.handName(r, c), k = R.cls(h), X0 = gx + c * cs, Y0 = y + 20 + r * cs;
        rr(g, X0 + 1, Y0 + 1, cs - 2, cs - 2, 5); g.fillStyle = COLS[k]; g.fill();
        g.fillStyle = k === 2 ? onAcc() : k ? '#fff' : T.muted; g.font = `600 ${cs * 0.3}px ${FM}`; g.textAlign = 'center'; g.fillText(h, X0 + cs / 2, Y0 + cs * 0.6);
      }
      let ly = land ? y + 40 : y + 20 + size + 50; const lx = land ? gx + size + 70 : pad;
      text(g, pc(R.pct, 0), lx, ly + 70, { size: land ? 110 : 96, font: FD, weight: 800, color: T.acc }); text(g, 'des mains jouées', lx, ly + 120, { size: 32, color: T.muted }); ly += land ? 180 : 160;
      R.leg.forEach(([k, l]) => { rr(g, lx, ly, 34, 34, 6); g.fillStyle = COLS[k]; g.fill(); text(g, l, lx + 50, ly + 28, { size: 32, color: T.ink }); ly += 52; });
      note(g, F, T, 'Ranges de départ SIGMA 52, 6-max, 100 bb, en ligne : point de départ standard, pas une sortie de solveur.');
      footer(g, F, T); return 1;
    },
    cap() { const R = rangeInfo(); return `${st.hook || R.title} : ${pc(R.pct, 0)} des mains.\n\n${R.str}\n\nRange de départ 6-max 100 bb : à adapter à la table.`; },
    say() { const R = rangeInfo(); return [`${R.title} : on joue environ ${pc(R.pct, 0)} des mains. ${R.leg.map((x) => x[1]).join(', ')}.`]; } });

  // ---------- Poker : équité ----------
  const MATCH = [['AsKd', 'QhQc'], ['AhKh', '2c2d'], ['AsAd', 'KhKc'], ['AhQd', 'AcJs'], ['7c7d', 'AsKs'], ['JhTh', 'AsKd'], ['KsQs', 'AhAc'], ['AdKc', 'AhQh'], ['8s8d', 'AhKc'], ['9h8h', 'AsAc'], ['AhJs', 'KdQc'], ['TsTd', '9c9h'], ['5h4h', 'AdKs'], ['KhKd', 'AsQs'], ['AcTc', 'KdKs']];
  const EQC = {};
  function eqOf(a, b, board) {
    const key = a + '|' + b + '|' + board; if (EQC[key]) return EQC[key];
    const A = E.parseCards(a), B = E.parseCards(b), Bo = E.parseCards(board || '');
    if (A.length !== 2 || B.length !== 2 || new Set([...A, ...B, ...Bo]).size !== 4 + Bo.length) return null;
    const r = E.equity([{ hand: A }, { hand: B }], Bo, { iterations: 120000, random: E.rng(7) });
    return (EQC[key] = { A, B, Bo, eq: r.equity, win: r.win, tie: r.tie[0], exact: r.exact });
  }
  function eqKind(A, B) {
    const r = (c) => c >> 2, pa = r(A[0]) === r(A[1]), pb = r(B[0]) === r(B[1]), sh = A.some((x) => B.some((y) => r(x) === r(y)));
    if (pa && pb) return 'Paire contre paire plus petite : environ 80/20.';
    if (pa !== pb) { const P_ = pa ? A : B, O = pa ? B : A; const over = O.filter((c) => r(c) > r(P_[0])).length; return over === 2 ? 'Paire contre deux cartes plus hautes : le fameux « pile ou face », à peine à l\'avantage de la paire.' : over === 1 ? 'Paire contre une carte plus haute : la paire garde environ 70 %.' : 'Paire contre deux cartes plus basses : la paire est très favorite.'; }
    if (sh) return 'Domination : une carte en commun, le kicker décide le plus souvent.';
    return 'Deux mains non paires sans carte commune : les deux cartes hautes mènent, sans écraser.';
  }
  add({ id: 'equite', dom: 'poker', grp: 'Quiz', l: 'Équité', names: () => ['Question', 'Réponse'],
    items: () => MATCH.length, pick: (i) => { const o = PR('equite'); o.i = i % MATCH.length; o.a = MATCH[o.i][0]; o.b = MATCH[o.i][1]; o.board = ''; }, cur: () => PR('equite', { i: 0 }).i,
    ctl() { const o = PR('equite', { i: 0, a: MATCH[0][0], b: MATCH[0][1], board: '' }); return `<div class="form"><label class="f">Main 1<input data-sp="equite.a" value="${esc(o.a)}" placeholder="AsKd"></label><label class="f">Main 2<input data-sp="equite.b" value="${esc(o.b)}" placeholder="QhQc"></label><label class="f">Board (optionnel)<input data-sp="equite.board" value="${esc(o.board)}" placeholder="Kh7h2c"></label></div>`; },
    draw(g, F, T, k, p) {
      const o = PR('equite', { i: 0, a: MATCH[0][0], b: MATCH[0][1], board: '' }), R = eqOf(o.a, o.b, o.board), { pad, land } = LY(F);
      if (!R) return emptyFrame(g, F, T, 'Mains invalides', 'Écris deux mains de deux cartes (ex. AsKd et QhQc), sans carte en double.');
      let y = header(g, F, T, k ? 'Équité · réponse' : 'Équité · quiz', st.hook || (k ? 'Le verdict' : 'Qui gagne le plus souvent ?')); if (!k) countdown(g, F, T, p);
      if (R.Bo.length) { cardsRow(g, R.Bo, F.w / 2, y + 20, land ? 90 : 110, 14); y += (land ? 90 : 110) * 1.4 + 40; }
      const cw = land ? 110 : 130, cx = [F.w / 2 - F.w * 0.22, F.w / 2 + F.w * 0.22];
      [R.A, R.B].forEach((h, i) => { text(g, `Main ${i + 1}`, cx[i], y + 34, { align: 'center', size: 30, font: FM, weight: 600, color: T.muted }); cardsRow(g, h, cx[i], y + 54, cw, 12); });
      text(g, 'contre', F.w / 2, y + 54 + cw * 0.8, { align: 'center', size: 34, font: FD, weight: 700, color: T.acc });
      y += 54 + cw * 1.4 + 50;
      if (k) {
        y = hbars(g, F, T, [{ l: 'Main 1', v: R.eq[0], s: pc(R.eq[0]), c: R.eq[0] >= R.eq[1] ? T.acc : T.muted }, { l: 'Main 2', v: R.eq[1], s: pc(R.eq[1]), c: R.eq[1] > R.eq[0] ? T.acc : T.muted }], pad, y, F.w - pad * 2, land ? 180 : 220, { labelW: 220 });
        text(g, `Égalité : ${pc(R.tie)}. ${eqKind(R.A, R.B)}`, pad, y + 50, { size: land ? 30 : 34, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 4 });
        note(g, F, T, R.exact ? 'Calcul exact (toutes les cartes à venir).' : 'Calcul SIGMA 52 : 120 000 tirages, précision ± 0,3 point.');
      } else text(g, 'Main 1, main 2, ou presque égal ?', pad, y + 20, { size: land ? 36 : 42, color: T.ink, maxW: F.w - pad * 2 });
      footer(g, F, T); return 2;
    },
    cap() { const o = PR('equite'), R = eqOf(o.a, o.b, o.board); return R ? `${st.hook || 'Qui gagne le plus souvent ?'} ${o.a} contre ${o.b}${o.board ? ' sur ' + o.board : ''}. Réponse en commentaire 👇\n\nRéponse : ${pc(R.eq[0])} contre ${pc(R.eq[1])}. ${eqKind(R.A, R.B)}` : ''; },
    say() { const o = PR('equite'), R = eqOf(o.a, o.b, o.board); return R ? [`${pretty(o.a.replace(/(..)(..)/, '$1 $2'))} contre ${pretty(o.b.replace(/(..)(..)/, '$1 $2'))}. Qui gagne le plus souvent ?`, `Main 1 : ${pc(R.eq[0])}. Main 2 : ${pc(R.eq[1])}. ${eqKind(R.A, R.B)}`] : []; },
    dur: (k) => (k ? 4500 : 3800) });

  // ---------- Poker : outs ----------
  const OUTC = {};
  function outsGen(seed) {
    if (OUTC[seed]) return OUTC[seed];
    const rnd = mrng(seed * 7919 + 11);
    for (let t = 0; t < 600; t++) {
      const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
      const hero = d.slice(0, 2), vill = d.slice(2, 4), board = d.slice(4, 7);
      if (E.evaluate([...vill, ...board]) <= E.evaluate([...hero, ...board])) continue;
      const o = E.outs(hero, vill, board); if (o.length < 4 || o.length > 15) continue;
      const r = E.equity([{ hand: hero }, { hand: vill }], board);
      return (OUTC[seed] = { hero, vill, board, outs: o, turn: o.length / 45, river: r.equity[0] });
    }
    return null;
  }
  add({ id: 'outs', dom: 'poker', grp: 'Quiz', l: 'Outs et cotes', names: () => ['Question', 'Réponse'], reroll() { PR('outs', { seed: 1 }).seed++; },
    ctl: () => '<p class="note">Situation tirée au hasard : tu es derrière au flop, combien de cartes te font passer devant ?</p>',
    draw(g, F, T, k, p) {
      const R = outsGen(PR('outs', { seed: 1 }).seed), { pad, land } = LY(F); if (!R) return emptyFrame(g, F, T, 'Pas de situation', 'Tire une autre situation.');
      let y = header(g, F, T, k ? 'Outs · réponse' : 'Outs · quiz', st.hook || (k ? `${R.outs.length} outs` : 'Combien d\'outs ?')); if (!k) countdown(g, F, T, p);
      const cw = land ? 92 : 112; cardsRow(g, R.board, F.w / 2, y + 20, cw, 14); y += cw * 1.4 + 50;
      const hw = land ? 84 : 100, cx = [F.w / 2 - F.w * 0.22, F.w / 2 + F.w * 0.22];
      [['Toi', R.hero], ['Adversaire', R.vill]].forEach(([l, h], i) => { text(g, l, cx[i], y + 30, { align: 'center', size: 30, font: FM, weight: 600, color: T.muted }); cardsRow(g, h, cx[i], y + 46, hw, 10); });
      y += 46 + hw * 1.4 + 40;
      if (k) {
        const sw = land ? 50 : 62; let x = pad, yy = y; for (const c of R.outs) { if (x + sw > F.w - pad) { x = pad; yy += sw * 1.4 + 10; } cardAt(g, c, x, yy, sw); x += sw + 8; }
        y = yy + sw * 1.4 + 40;
        y = hbars(g, F, T, [{ l: 'À la turn', v: R.turn, s: pc(R.turn), c: T.acc }, { l: 'Jusqu\'à la river', v: R.river, s: pc(R.river), c: T.acc }], pad, y, F.w - pad * 2, land ? 150 : 190, { labelW: land ? 320 : 360 });
        text(g, `Règle du 4 : ${R.outs.length} × 4 ≈ ${R.outs.length * 4} %. Équité à la river : partage compris.`, pad, y + 40, { size: land ? 28 : 32, color: T.muted, maxW: F.w - pad * 2, maxLines: 2 });
      } else text(g, 'Les cartes qui te font passer devant à la turn.', pad, y + 10, { size: land ? 34 : 40, color: T.ink, maxW: F.w - pad * 2 });
      footer(g, F, T); return 2;
    },
    cap() { const R = outsGen(PR('outs', { seed: 1 }).seed); return R ? `${st.hook || 'Combien d\'outs ?'} Réponse en commentaire 👇\n\nRéponse : ${R.outs.length} outs, ${pc(R.turn)} à la turn, ${pc(R.river)} d'équité jusqu'à la river.` : ''; },
    say() { const R = outsGen(PR('outs', { seed: 1 }).seed); return R ? ['Tu es derrière au flop. Combien de cartes te font passer devant ?', `${R.outs.length} outs : ${pc(R.turn)} à la turn, ${pc(R.river)} jusqu'à la river.`] : []; },
    dur: (k) => (k ? 4500 : 3800) });

  // ---------- Poker : texture de flop ----------
  const TXC = {};
  function texGen(seed) {
    if (TXC[seed]) return TXC[seed];
    const rnd = mrng(seed * 104729 + 3), d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    const board = d.slice(0, 3).sort((a, b) => b - a), C = window.Charts, BO = window.Board;
    const r = E.equity([{ combos: E.rangeCombos(C.RFI.BTN.range, board) }, { combos: E.rangeCombos(C.FACING.BTN.BB.call, board) }], board, { iterations: 30000, random: E.rng(seed) });
    return (TXC[seed] = { board, tags: BO ? BO.texture(board) : [], eq: r.equity });
  }
  add({ id: 'texture', dom: 'poker', grp: 'Quiz', l: 'Texture de flop', names: () => ['Question', 'Réponse'], reroll() { PR('texture', { seed: 1 }).seed++; },
    ctl: () => '<p class="note">Flop au hasard : ouverture au bouton, la grosse blinde paie. Qui a l\'avantage de range ?</p>',
    draw(g, F, T, k, p) {
      const R = texGen(PR('texture', { seed: 1 }).seed), { pad, land } = LY(F);
      let y = header(g, F, T, k ? 'Texture · réponse' : 'Texture · quiz', st.hook || (k ? (R.eq[0] > R.eq[1] ? 'Avantage à l\'ouvreur' : 'Avantage à la grosse blinde') : 'À qui profite ce flop ?')); if (!k) countdown(g, F, T, p);
      const cw = land ? 120 : 150; cardsRow(g, R.board, F.w / 2, y + 30, cw, 18); y += cw * 1.4 + 70;
      text(g, R.tags.join(' · '), F.w / 2, y, { align: 'center', size: land ? 34 : 40, font: FM, weight: 600, color: T.acc, maxW: F.w - pad * 2 }); y += 60;
      if (k) {
        y = hbars(g, F, T, [{ l: 'Ouvreur (BTN)', v: R.eq[0], s: pc(R.eq[0]), c: R.eq[0] >= R.eq[1] ? T.acc : T.muted }, { l: 'Défense (BB)', v: R.eq[1], s: pc(R.eq[1]), c: R.eq[1] > R.eq[0] ? T.acc : T.muted }], pad, y, F.w - pad * 2, land ? 170 : 210, { labelW: land ? 340 : 360 });
        text(g, R.eq[0] > 0.55 ? 'Flop qui favorise l\'ouvreur : il peut miser souvent et petit (c-bet de range).' : R.eq[0] < 0.5 ? 'Flop qui favorise la défense : l\'ouvreur mise moins souvent et check davantage.' : 'Flop assez neutre : mises plus sélectives, tailles plus grandes avec les mains fortes.', pad, y + 40, { size: land ? 30 : 34, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
        note(g, F, T, 'Équité de range contre range (30 000 tirages), ranges de départ SIGMA 52 : ce n\'est pas l\'EV, mais le bon point de départ.');
      } else text(g, 'BTN ouvre, BB paie. Qui a l\'avantage de range ?', pad, y, { size: land ? 34 : 40, color: T.ink, maxW: F.w - pad * 2, maxLines: 2 });
      footer(g, F, T); return 2;
    },
    cap() { const R = texGen(PR('texture', { seed: 1 }).seed); return `${st.hook || 'À qui profite ce flop ?'} Bouton contre grosse blinde. Réponse en commentaire 👇\n\nRéponse : ouvreur ${pc(R.eq[0])}, défense ${pc(R.eq[1])} (${R.tags.join(', ')}).`; },
    say() { const R = texGen(PR('texture', { seed: 1 }).seed); return [`Flop ${R.tags.join(', ')}. Le bouton ouvre, la grosse blinde paie. À qui profite ce flop ?`, `Ouvreur ${pc(R.eq[0])}, défense ${pc(R.eq[1])}.`]; },
    dur: (k) => (k ? 4500 : 3800) });

  // ---------- Poker : main de légende ----------
  const LGs = () => window.Legends?.LEGENDS || [];
  const lgOf = () => LGs()[PR('legende', { i: 0 }).i % Math.max(1, LGs().length)];
  add({ id: 'legende', dom: 'poker', grp: 'Apprendre', l: 'Main de légende', names: () => ['Histoire', 'Décision', 'Ce qui s\'est passé', 'Leçon'],
    items: () => LGs().length, pick: (i) => { PR('legende').i = i % LGs().length; }, cur: () => PR('legende', { i: 0 }).i,
    ctl: () => itemSel('legende', LGs().map((x) => x.title), PR('legende', { i: 0 }).i, 'Main'),
    draw(g, F, T, k, p) {
      const L = lgOf(), { pad, land } = LY(F); if (!L) return emptyFrame(g, F, T, 'Indisponible', '');
      const hc = E.parseCards(L.heroCards), bd = E.parseCards(L.board), run = E.parseCards(L.runout || ''), vc = E.parseCards(L.vill[0].cards);
      if (k === 0) { let y = header(g, F, T, 'Main de légende · ' + L.event, st.hook || L.title); for (const s of L.story) { rr(g, pad, y + 20, F.w - pad * 2, land ? 100 : 130, 18); g.fillStyle = T.panel; g.fill(); text(g, s, pad + 26, y + 70, { size: land ? 30 : 34, color: T.ink, maxW: F.w - pad * 2 - 52, lh: 1.25, maxLines: 2 }); y += (land ? 100 : 130) + 16; } }
      else if (k === 1) {
        let y = header(g, F, T, 'Main de légende · à toi', 'Que fais-tu ?'); countdown(g, F, T, p);
        const cw = land ? 90 : 110; cardsRow(g, bd, F.w / 2, y + 20, cw, 14); y += cw * 1.4 + 50;
        text(g, L.hero.split(' ').slice(-1)[0], F.w / 2, y, { align: 'center', size: 30, font: FM, color: T.muted }); cardsRow(g, hc, F.w / 2, y + 16, cw * 0.9, 12); y += cw * 0.9 * 1.4 + 50;
        y = options(g, F, T, y, L.options.map((o) => o[1]), -1);
      } else if (k === 2) {
        let y = header(g, F, T, 'Main de légende · le coup réel', L.title);
        const cw = land ? 80 : 96; cardsRow(g, [...bd, ...run], F.w / 2, y + 20, cw, 12); y += cw * 1.4 + 50;
        const cx = [F.w / 2 - F.w * 0.22, F.w / 2 + F.w * 0.22];
        [[L.hero, hc], [L.vill[0].name, vc]].forEach(([n, h], i) => { text(g, n, cx[i], y + 30, { align: 'center', size: 28, font: FM, weight: 600, color: T.muted, maxW: F.w * 0.4, maxLines: 1 }); cardsRow(g, h, cx[i], y + 46, land ? 70 : 84, 8); });
        y += 46 + (land ? 70 : 84) * 1.4 + 40;
        y = text(g, L.proText, pad, y, { size: land ? 32 : 38, weight: 600, color: T.ink, maxW: F.w - pad * 2, lh: 1.28, maxLines: 4 }) + 10;
        text(g, L.outcome, pad, y + 20, { size: land ? 28 : 32, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 4 });
      } else {
        let y = header(g, F, T, 'Main de légende · la leçon', 'À retenir');
        y = text(g, L.lesson, pad, y + 40, { size: land ? 34 : 40, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: land ? 7 : 12 });
        note(g, F, T, `${L.reconstructed || ''} Source : ${String(L.src || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}.`);
      }
      footer(g, F, T); return 4;
    },
    cap() { const L = lgOf(); return L ? `${st.hook || L.title} (${L.event}).\n\n${L.story.join(' ')}\n\nTu aurais fait quoi ? 👇\n\n${L.lesson}` : ''; },
    say() { const L = lgOf(); return L ? [`${L.title}. ${L.event}. ${L.story.join(' ')}`, `À ta place, que fais-tu ? ${L.options.map((o) => o[1]).join(', ')} ?`, `${L.proText} ${L.outcome}`, L.lesson] : []; },
    dur: (k) => [5200, 4000, 5200, 5600][k] || 4000 });

  // ---------- Commun : chiffre clé, mythe, carrousel libre ----------
  const facts = () => (st.dom === 'bj' ? factsBJ() : factsPoker());
  const curFact = () => { const L = facts(); return L[PR('chiffre_' + st.dom, { i: 0 }).i % L.length]; };
  add({ id: 'chiffre', dom: 'both', grp: 'Apprendre', l: 'Chiffre clé',
    items: () => facts().length, pick: (i) => { PR('chiffre_' + st.dom).i = i % facts().length; }, cur: () => PR('chiffre_' + st.dom, { i: 0 }).i,
    ctl: () => itemSel('chiffre_' + st.dom, facts().map((f) => f.t), PR('chiffre_' + st.dom, { i: 0 }).i, 'Chiffre'),
    draw(g, F, T, k, p) {
      const f = curFact(), { pad, land } = LY(F), a = p === undefined ? 1 : Math.min(1, p * 2.5), ease = 1 - Math.pow(1 - a, 3);
      header(g, F, T, st.dom === 'bj' ? 'Le chiffre blackjack' : 'Le chiffre poker', st.hook || f.t);
      g.save(); g.globalAlpha = 0.2 + 0.8 * ease; const cy = F.h * (land ? 0.6 : 0.52);
      text(g, f.n, F.w / 2, cy, { align: 'center', size: Math.min(land ? 220 : 200, (F.w - pad * 2) / Math.max(3, f.n.length) * 1.7), font: FD, weight: 800, color: T.acc });
      text(g, f.d, F.w / 2, cy + (land ? 110 : 140), { align: 'center', size: land ? 34 : 40, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 5 }); g.restore();
      footer(g, F, T); return 1;
    },
    cap() { const f = curFact(); return `${st.hook || f.t} : ${f.n}.\n\n${f.d}`; }, say() { const f = curFact(); return [`${f.t} : ${f.n}. ${f.d}`]; }, anim: true, dur: () => 4200 });
  const curMyth = () => { const L = MYTHS[st.dom === 'bj' ? 'bj' : 'poker']; return L[PR('mythe_' + st.dom, { i: 0 }).i % L.length]; };
  add({ id: 'mythe', dom: 'both', grp: 'Apprendre', l: 'Mythe ou réalité', names: () => ['Mythe', 'Réalité'],
    items: () => MYTHS[st.dom === 'bj' ? 'bj' : 'poker'].length, pick: (i) => { PR('mythe_' + st.dom).i = i % MYTHS[st.dom === 'bj' ? 'bj' : 'poker'].length; }, cur: () => PR('mythe_' + st.dom, { i: 0 }).i,
    ctl: () => itemSel('mythe_' + st.dom, MYTHS[st.dom === 'bj' ? 'bj' : 'poker'].map((f) => f.m), PR('mythe_' + st.dom, { i: 0 }).i, 'Idée reçue'),
    draw(g, F, T, k, p) {
      const m = curMyth(), { pad, land } = LY(F);
      if (!k) { header(g, F, T, 'Mythe ou réalité ?', st.hook || 'Vrai ou faux ?'); countdown(g, F, T, p); text(g, `« ${m.m} »`, pad, F.h * (land ? 0.5 : 0.45), { size: land ? 58 : 64, font: FD, weight: 700, color: T.ink, maxW: F.w - pad * 2, lh: 1.18, maxLines: 5 }); }
      else { let y = header(g, F, T, 'Mythe ou réalité ?', 'Faux.'); y = text(g, m.r, pad, y + 50, { size: land ? 44 : 50, weight: 700, color: T.acc, maxW: F.w - pad * 2, lh: 1.22, maxLines: 4 }); text(g, m.d, pad, y + 40, { size: land ? 32 : 38, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 6 }); }
      footer(g, F, T); return 2;
    },
    cap() { const m = curMyth(); return `${st.hook || 'Mythe ou réalité'} : « ${m.m} »\n\nFaux. ${m.r} ${m.d}`; }, say() { const m = curMyth(); return [`Vrai ou faux : ${m.m}`, `Faux. ${m.r} ${m.d}`]; }, dur: (k) => (k ? 5200 : 3600) });
  const LIBRE = { poker: { kick: '', title: 'Trois erreurs à éviter', body: 'Jouer trop de mains hors position\nPayer sans les cotes du pot\nChanger de plan après une mauvaise session' }, bj: { kick: '', title: 'Trois erreurs du débutant', body: 'Prendre l\'assurance | Sans compter, c\'est un pari perdant\nRester sur 12 contre 2 | Il faut tirer\nJouer une table qui paie 6:5 | La règle coûte plus de 1,3 point' } };
  const libreSlides = () => { const o = PR('libre_' + st.dom, LIBRE[st.dom === 'bj' ? 'bj' : 'poker']); return { o, lines: String(o.body || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12) }; };
  add({ id: 'libre', dom: 'both', grp: 'Libre', l: 'Carrousel libre',
    ctl() { const { o } = libreSlides(); return `<label class="f">Surtitre<input data-sp="libre_${st.dom}.kick" value="${esc(o.kick)}" placeholder="Ex. Stratégie" maxlength="40"></label><label class="f">Titre<input data-sp="libre_${st.dom}.title" value="${esc(o.title)}" maxlength="90"></label><label class="f">Une diapositive par ligne (« Titre | texte » possible)<textarea data-sp="libre_${st.dom}.body" rows="6">${esc(o.body)}</textarea></label>`; },
    names: (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 'Titre' : String(i))),
    draw(g, F, T, k, p) {
      const { o, lines } = libreSlides(), { pad, land } = LY(F), n = lines.length + 1, kick = o.kick || (st.dom === 'bj' ? 'Blackjack' : 'Poker');
      const a = p === undefined ? 1 : Math.min(1, p * 3), ease = 1 - Math.pow(1 - a, 3); g.save(); g.globalAlpha = 0.25 + 0.75 * ease; g.translate(0, (1 - ease) * 40);
      if (k === 0) { let y = header(g, F, T, kick, st.hook || o.title); lines.forEach((l, i) => { g.fillStyle = T.acc; g.beginPath(); g.arc(pad + 14, y + 56 + i * (land ? 56 : 70), 9, 0, Math.PI * 2); g.fill(); text(g, l.split('|')[0].trim(), pad + 44, y + 66 + i * (land ? 56 : 70), { size: land ? 28 : 32, color: T.ink, maxW: F.w - pad * 2 - 44, maxLines: 1 }); }); }
      else { const [t1, t2] = lines[k - 1].split('|').map((x) => x.trim()); let y = header(g, F, T, `${kick} · ${k}/${lines.length}`, o.title); g.fillStyle = T.acc; g.font = `800 ${land ? 120 : 150}px ${FD}`; g.textAlign = 'left'; g.fillText(String(k), pad, y + (land ? 130 : 170)); y = text(g, t1, pad, y + (land ? 220 : 290), { size: land ? 46 : 54, weight: 700, color: T.ink, maxW: F.w - pad * 2, lh: 1.22, maxLines: 4 }); if (t2) text(g, t2, pad, y + 30, { size: land ? 32 : 38, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 6 }); }
      g.restore(); footer(g, F, T); return n;
    },
    cap() { const { o, lines } = libreSlides(); return `${st.hook || o.title}\n\n${lines.map((l) => '• ' + l.replace('|', ':')).join('\n')}`; }, say() { const { o, lines } = libreSlides(); return [o.title, ...lines.map((l) => l.replace('|', '.'))]; }, anim: true, dur: () => 3200 });

  // ---------- Blackjack : stratégie de base ----------
  const BJROWS = { hard: ['h8', 'h9', 'h10', 'h11', 'h12', 'h13', 'h14', 'h15', 'h16', 'h17'], soft: ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'], pair: ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p1'] };
  const BJRL = (id) => (id === 'h8' ? '≤ 8' : id === 'h17' ? '17 +' : id[0] === 'h' ? id.slice(1) : ROWL(id));
  const CODEL = { H: 'H', S: 'S', Dh: 'D', Ds: 'Ds', P: 'P', Rh: 'R', Rs: 'Rs', Rp: 'Rp' };
  add({ id: 'bjstrat', dom: 'bj', grp: 'Apprendre', l: 'Stratégie de base', names: () => ['Totaux durs', 'Mains souples', 'Paires'],
    items: () => Object.keys(BD().presets || {}).length, pick: (i) => { PR('bjstrat').key = Object.keys(BD().presets)[i % Object.keys(BD().presets).length]; }, cur: () => Math.max(0, Object.keys(BD().presets || {}).indexOf(PR('bjstrat', { key: 'europe' }).key)),
    ctl: () => presetSel('bjstrat', PR('bjstrat', { key: 'europe' }).key),
    draw(g, F, T, k) {
      const o = PR('bjstrat', { key: 'europe' }), Pz = BD().presets?.[o.key]; if (!Pz) return emptyFrame(g, F, T, 'Données absentes', '');
      const kind = ['hard', 'soft', 'pair'][Math.min(2, k)], rows = BJROWS[kind], { pad, land } = LY(F);
      let y = header(g, F, T, `Stratégie de base · ${Pz.label}`, st.hook || ['Totaux durs', 'Mains souples (avec un as)', 'Paires'][Math.min(2, k)]);
      const availH = F.h - F.safeB - 150 - y, cols = 11, cw = Math.min((F.w - pad * 2) / cols, availH / (rows.length + 1)), gx = (F.w - cw * cols) / 2;
      ['', ...BJm().UPS].forEach((u, c) => { if (c) text(g, UPN(u), gx + c * cw + cw / 2, y + cw * 0.62, { align: 'center', size: cw * 0.36, font: FM, weight: 700, color: T.muted }); });
      text(g, 'Croupier →', gx, y - 4, { size: Math.min(26, cw * 0.3), font: FM, color: T.muted });
      rows.forEach((r, i) => {
        const yy = y + (i + 1) * cw; text(g, BJRL(r), gx + cw / 2, yy + cw * 0.62, { align: 'center', size: cw * 0.32, font: FM, weight: 700, color: T.ink });
        BJm().UPS.forEach((u, c) => { const code = Pz.table[r]?.[u]?.c || 'H', X0 = gx + (c + 1) * cw; rr(g, X0 + 2, yy + 2, cw - 4, cw - 4, 6); g.fillStyle = ACOL[code[0]]; g.fill(); text(g, CODEL[code] || code, X0 + cw / 2, yy + cw * 0.62, { align: 'center', size: cw * 0.34, font: FM, weight: 700, color: '#fff' }); });
      });
      const ly = y + (rows.length + 1) * cw + 30, items = [['H', 'tirer'], ['S', 'rester'], ['D', 'doubler (sinon tirer)'], ['Ds', 'doubler (sinon rester)'], ['P', 'séparer'], ['R', 'abandonner (sinon tirer)']];
      let lx = pad, lyy = ly; for (const [c, l] of items) { const w = 60 + l.length * (land ? 13 : 15); if (lx + w > F.w - pad) { lx = pad; lyy += 46; } rr(g, lx, lyy, 30, 30, 6); g.fillStyle = ACOL[c[0]]; g.fill(); text(g, `${c} ${l}`, lx + 40, lyy + 24, { size: land ? 22 : 24, color: T.ink }); lx += w; }
      footer(g, F, T); return 3;
    },
    cap() { const Pz = BD().presets?.[PR('bjstrat', { key: 'europe' }).key]; return `${st.hook || 'La stratégie de base'} : ${Pz?.label}. Enregistre-la 📌\n\nAvantage de la maison avec un jeu parfait : ${pc(Pz?.edge || 0, 2)}. Calcul exact SIGMA 52 pour ces règles.\n\n${Pz?.note || ''}`; },
    say() { const Pz = BD().presets?.[PR('bjstrat', { key: 'europe' }).key]; return [`La stratégie de base, ${Pz?.label}. D'abord les totaux durs.`, 'Les mains souples, avec un as compté 11.', `Les paires. Avec cette stratégie, la maison ne garde que ${pc(Pz?.edge || 0, 2)}.`]; },
    dur: () => 4500 });

  // ---------- Blackjack : quiz de décision ----------
  const BQC = {};
  function bjqGen(key, seed) {
    const id = key + '|' + seed; if (BQC[id]) return BQC[id];
    const Pz = BD().presets[key], rnd = mrng(seed * 6007 + 17), cells = [];
    for (const r of Object.keys(Pz.table)) { if (/^h(5|6|7|18|19)$/.test(r)) continue; for (const u of BJm().UPS) { const ev = Pz.table[r][u].ev, v = Object.values(ev).sort((a, b) => b - a); cells.push({ r, u, w: 1 / (v[0] - v[1] + 0.03) }); } }
    let x = rnd() * cells.reduce((a, c) => a + c.w, 0), c = cells[0]; for (const q of cells) { x -= q.w; if (x <= 0) { c = q; break; } }
    let cards;
    if (c.r[0] === 'p') { const v = +c.r.slice(1); cards = [v, v]; } else if (c.r[0] === 's') cards = [1, +c.r.slice(1)];
    else { const t = +c.r.slice(1), opts = []; for (let a = 2; a <= 10; a++) { const b = t - a; if (b >= 2 && b <= 10 && b !== a && a < b + 1) opts.push([a, b]); } cards = opts.length ? opts[Math.floor(rnd() * opts.length)] : [t - 10, 10]; }
    const ev = Pz.table[c.r][c.u].ev, acts = ['hit', 'stand', 'double', 'split', 'surrender'].filter((a) => ev[a] !== undefined), best = acts.reduce((a, b) => (ev[b] > ev[a] ? b : a));
    return (BQC[id] = { ...c, Pz, cards: cards.map((r) => bjCard(r, rnd)), up: bjCard(c.u, rnd), ev, acts, best, code: Pz.table[c.r][c.u].c });
  }
  const bjq = () => { const o = PR('bjquiz', { key: 'europe', seed: 1 }); return bjqGen(o.key, o.seed); };
  add({ id: 'bjquiz', dom: 'bj', grp: 'Quiz', l: 'Quiz de décision', names: () => ['Question', 'Réponse'], reroll() { PR('bjquiz', { key: 'europe', seed: 1 }).seed++; },
    ctl: () => presetSel('bjquiz', PR('bjquiz', { key: 'europe', seed: 1 }).key) + '<p class="note">Les cases tirées en priorité sont celles où les deux meilleures actions sont proches.</p>',
    draw(g, F, T, k, p) {
      const Q = bjq(), { pad, land } = LY(F);
      let y = header(g, F, T, k ? `Blackjack · réponse` : `Blackjack · ${Q.Pz.label}`, st.hook || (k ? `${AFR[Q.best]} !` : 'Tu fais quoi ?')); if (!k) countdown(g, F, T, p);
      const cw = land ? 104 : 128;
      text(g, 'Croupier', F.w / 2, y + 30, { align: 'center', size: 30, font: FM, weight: 600, color: T.muted }); cardsRow(g, [Q.up], F.w / 2, y + 46, cw, 0); y += 46 + cw * 1.4 + 40;
      text(g, `Toi · ${ROWL(Q.r)}`, F.w / 2, y + 10, { align: 'center', size: 30, font: FM, weight: 600, color: T.muted }); cardsRow(g, Q.cards, F.w / 2, y + 26, cw, 14); y += 26 + cw * 1.4 + 40;
      if (!k) options(g, F, T, y, Q.acts.map((a) => AFR[a]), -1);
      else {
        const items = Q.acts.slice().sort((a, b) => Q.ev[b] - Q.ev[a]).map((a) => ({ l: AFR[a], v: Q.ev[a], s: spc(Q.ev[a]), c: a === Q.best ? T.acc : T.muted }));
        y = hbars(g, F, T, items, pad, y, F.w - pad * 2, Math.min(items.length * (land ? 66 : 84), F.h - F.safeB - y - 90), { labelW: land ? 260 : 300 });
        text(g, (Q.code === 'Dh' ? 'Doubler si c\'est permis, sinon tirer. ' : Q.code === 'Ds' ? 'Doubler si c\'est permis, sinon rester. ' : Q.code[0] === 'R' ? 'Abandonner si c\'est permis. ' : '') + 'Espérance de chaque action pour une mise de 1 (calcul exact, sabot complet).', pad, y + 36, { size: land ? 26 : 30, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
      }
      footer(g, F, T); return 2;
    },
    cap() { const Q = bjq(); return `${st.hook || 'Tu fais quoi ?'} ${ROWL(Q.r)} contre ${UPN(Q.u)} du croupier (${Q.Pz.label}). Réponse en commentaire 👇\n\nRéponse : ${AFR[Q.best].toLowerCase()} (${spc(Q.ev[Q.best])} par mise), contre ${Q.acts.filter((a) => a !== Q.best).map((a) => `${AFR[a].toLowerCase()} ${spc(Q.ev[a])}`).join(', ')}.`; },
    say() { const Q = bjq(); return [`${ROWL(Q.r)} contre ${UPN(Q.u)}. Tu fais quoi ?`, `${AFR[Q.best]}. Espérance ${spc(Q.ev[Q.best])}, contre ${Q.acts.filter((a) => a !== Q.best).map((a) => `${AFR[a].toLowerCase()} ${spc(Q.ev[a])}`).join(', ')}.`]; },
    dur: (k) => (k ? 4600 : 3600) });

  // ---------- Blackjack : défi de comptage ----------
  const BCC = {};
  function bjcGen(o) {
    const id = [o.sys, o.n, o.seed].join('|'); if (BCC[id]) return BCC[id];
    const rnd = mrng(o.seed * 4421 + 5), Sy = CTm().byId[o.sys] || CTm().byId.hilo, cards = [];
    const shoe = []; for (let d = 0; d < 6; d++) for (let c = 0; c < 52; c++) shoe.push(c);
    for (let i = 0; i < o.n; i++) { const j = Math.floor(rnd() * shoe.length); cards.push(shoe.splice(j, 1)[0]); }
    const tags = cards.map((c) => CTm().tagOfCard(Sy, c)), rc = tags.reduce((a, b) => a + b, 0);
    return (BCC[id] = { Sy, cards, tags, rc });
  }
  const bjcO = () => PR('bjcount', { sys: 'hilo', n: 12, ms: 900, seed: 1 });
  add({ id: 'bjcount', dom: 'bj', grp: 'Quiz', l: 'Défi de comptage', reroll() { bjcO().seed++; },
    ctl() { const o = bjcO(); return `<div class="form">${sel('bjcount', 'sys', (CTm()?.SYSTEMS || []).map((s) => [s.id, s.name]), o.sys, 'Système')}${sel('bjcount', 'n', [[8, '8 cartes'], [12, '12 cartes'], [16, '16 cartes'], [20, '20 cartes']], o.n, 'Cartes')}${sel('bjcount', 'ms', [[1200, 'Lent (1,2 s)'], [900, 'Normal (0,9 s)'], [600, 'Rapide (0,6 s)'], [400, 'Expert (0,4 s)']], o.ms, 'Vitesse (vidéo)')}</div>`; },
    names: (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 'Titre' : i === n - 2 ? 'Question' : i === n - 1 ? 'Réponse' : String(i))),
    draw(g, F, T, k, p) {
      const o = bjcO(), R = bjcGen({ ...o, n: +o.n, seed: +o.seed }), n = R.cards.length, { pad, land } = LY(F), N = n + 3;
      if (k === 0) { header(g, F, T, `Défi de comptage · ${R.Sy.name}`, st.hook || `Compte ces ${n} cartes`); text(g, `Valeurs ${R.Sy.name} : ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (r === 1 ? 'A' : r) + ' ' + sgn(R.Sy.t[r], R.Sy.t[r] % 1 ? 1 : 0)).join(' · ')}${R.Sy.red7 ? ' (7 rouge +1, 7 noir 0)' : ''}`, pad, F.h * 0.5, { size: land ? 34 : 38, font: FM, color: T.ink, maxW: F.w - pad * 2, lh: 1.4, maxLines: 6 }); text(g, 'Prêt ?', pad, F.h * 0.5 + (land ? 200 : 300), { size: 60, font: FD, weight: 800, color: T.acc }); }
      else if (k <= n) {
        header(g, F, T, `Défi de comptage · ${R.Sy.name} · ${k}/${n}`, st.hook || `Compte ces ${n} cartes`);
        const cw = land ? 300 : 420, a = p === undefined ? 1 : Math.min(1, p * 5), sc = 0.85 + 0.15 * (1 - Math.pow(1 - a, 3));
        g.save(); g.translate(F.w / 2, F.h * 0.52); g.scale(sc, sc); cardAt(g, R.cards[k - 1], -cw / 2, -cw * 0.7, cw); g.restore();
        rr(g, pad, F.h - F.safeB - 70, F.w - pad * 2, 10, 5); g.fillStyle = T.panel; g.fill(); rr(g, pad, F.h - F.safeB - 70, (F.w - pad * 2) * (k / n), 10, 5); g.fillStyle = T.acc; g.fill();
      } else if (k === n + 1) { header(g, F, T, `Défi de comptage · ${R.Sy.name}`, 'Quel est le running count ?'); countdown(g, F, T, p); text(g, '?', F.w / 2, F.h * 0.58, { align: 'center', size: 300, font: FD, weight: 800, color: T.acc }); text(g, 'Réponds en commentaire avant la réponse.', F.w / 2, F.h * 0.58 + 120, { align: 'center', size: 34, color: T.muted, maxW: F.w - pad * 2 }); }
      else {
        let y = header(g, F, T, `Défi de comptage · ${R.Sy.name} · réponse`, `Running count : ${sgn(R.rc, R.rc % 1 ? 1 : 0)}`);
        const per = land ? 10 : 5, cw = Math.min((F.w - pad * 2) / per - 14, land ? 110 : 150), gap = ((F.w - pad * 2) - per * cw) / Math.max(1, per - 1);
        R.cards.forEach((c, i) => { const x = pad + (i % per) * (cw + gap), yy = y + 20 + Math.floor(i / per) * (cw * 1.4 + 60); cardAt(g, c, x, yy, cw); const t = R.tags[i]; text(g, sgn(t, t % 1 ? 1 : 0) || '0', x + cw / 2, yy + cw * 1.4 + 40, { align: 'center', size: 32, font: FM, weight: 700, color: t > 0 ? '#3C9A63' : t < 0 ? '#D9768E' : T.muted }); });
      }
      footer(g, F, T); return N;
    },
    cap() { const o = bjcO(), R = bjcGen({ ...o, n: +o.n, seed: +o.seed }); return `${st.hook || 'Défi de comptage'} : ${R.cards.length} cartes, système ${R.Sy.name}. Ton running count en commentaire 👇\n\nRéponse : ${sgn(R.rc, R.rc % 1 ? 1 : 0)}.\n\nCompter de tête est légal ; le casino peut refuser un joueur. Entraînement hors table.`; },
    say() { const o = bjcO(), R = bjcGen({ ...o, n: +o.n, seed: +o.seed }); return [`Compte ces ${R.cards.length} cartes avec le ${R.Sy.name}.`, ...R.cards.map(() => ''), 'Quel est le running count ?', `Le running count est ${sgn(R.rc, R.rc % 1 ? 1 : 0)}.`]; },
    dur: (k, n) => (k === 0 ? 2600 : k <= n - 3 ? +bjcO().ms : k === n - 2 ? 3500 : 5200), anim: true });

  // ---------- Blackjack : true count ----------
  const bjtO = () => PR('bjtc', { seed: 1 });
  function bjtGen(seed) { const rnd = mrng(seed * 271 + 9), left = 1 + Math.floor(rnd() * 10) / 2; let rc = 0; while (Math.abs(rc) < 2) rc = Math.round((rnd() * 2 - 0.6) * 4 * left); return { left, rc, tc: rc / left }; }
  add({ id: 'bjtc', dom: 'bj', grp: 'Quiz', l: 'True count', names: () => ['Question', 'Réponse'], reroll() { bjtO().seed++; },
    ctl: () => '<p class="note">Sabot de 6 jeux : running count et défausse tirés au hasard. Conversion Hi-Lo.</p>',
    draw(g, F, T, k, p) {
      const R = bjtGen(bjtO().seed), { pad, land } = LY(F), tcT = Math.trunc(R.tc);
      let y = header(g, F, T, k ? 'True count · réponse' : 'True count · quiz', st.hook || (k ? `True count ${sgn(tcT)}` : 'Quel est le true count ?')); if (!k) countdown(g, F, T, p);
      text(g, `Running count ${sgn(R.rc)}`, pad, y + 60, { size: land ? 56 : 64, font: FD, weight: 800, color: T.acc }); y += 110;
      const tw = land ? 260 : 300, th = land ? 420 : 520, tx = land ? pad : (F.w - tw) / 2, ty = y + 10, played = 6 - R.left;
      rr(g, tx, ty, tw, th, 18); g.strokeStyle = T.muted; g.lineWidth = 4; g.stroke();
      const fh = th * (played / 6); rr(g, tx + 8, ty + th - fh - 0, tw - 16, Math.max(0, fh - 8), 10); g.fillStyle = T.acc; g.fill();
      for (let d = 1; d < 6; d++) { g.strokeStyle = T.panel; g.lineWidth = 2; g.beginPath(); g.moveTo(tx + 6, ty + th - th * d / 6); g.lineTo(tx + tw - 6, ty + th - th * d / 6); g.stroke(); }
      const ix = land ? tx + tw + 60 : pad, iy = land ? ty + 60 : ty + th + 70;
      text(g, `Défausse : ${fr(played, 1)} paquet${played > 1 ? 's' : ''} joué${played > 1 ? 's' : ''} sur 6`, ix, iy, { size: land ? 34 : 38, color: T.ink, maxW: F.w - ix - pad });
      if (k) {
        const Dp = BD().presets?.strip?.edgeByTC, e = Dp?.find((x) => x[0] === Math.max(-4, Math.min(8, tcT)));
        let y2 = text(g, `${sgn(R.rc)} ÷ ${fr(R.left, 1)} paquets restants = ${sgn(R.tc, 2)}`, ix, iy + 70, { size: land ? 38 : 42, font: FM, weight: 600, color: T.acc, maxW: F.w - ix - pad, maxLines: 2 });
        y2 = text(g, `True count ${sgn(tcT)} (arrondi vers zéro).`, ix, y2 + 20, { size: land ? 34 : 38, color: T.ink, maxW: F.w - ix - pad, maxLines: 2 });
        if (e) text(g, `Avantage Hi-Lo à ce compte (6 jeux Strip) : ${spc(e[1])}.`, ix, y2 + 20, { size: land ? 30 : 34, color: T.muted, maxW: F.w - ix - pad, maxLines: 2 });
      } else text(g, 'Paquets restants = 6 − défausse. Divise.', ix, iy + 70, { size: land ? 32 : 36, color: T.muted, maxW: F.w - ix - pad, maxLines: 2 });
      footer(g, F, T); return 2;
    },
    cap() { const R = bjtGen(bjtO().seed); return `${st.hook || 'Quel est le true count ?'} Running count ${sgn(R.rc)}, ${fr(6 - R.left, 1)} paquets dans la défausse (sabot de 6). Réponse en commentaire 👇\n\nRéponse : ${sgn(R.rc)} ÷ ${fr(R.left, 1)} = ${sgn(R.tc, 2)}, soit TC ${sgn(Math.trunc(R.tc))}.`; },
    say() { const R = bjtGen(bjtO().seed); return [`Running count ${sgn(R.rc)}, ${fr(6 - R.left, 1)} paquets dans la défausse. Quel est le true count ?`, `${sgn(R.rc)} divisé par ${fr(R.left, 1)} paquets restants : true count ${sgn(Math.trunc(R.tc))}.`]; },
    dur: (k) => (k ? 4600 : 3800) });

  // ---------- Blackjack : indices ----------
  const idxList = (key) => { const Pz = BD().presets?.[key]; if (!Pz) return []; return [{ ins: true, index: Pz.insurance.index, exact: Pz.insurance.exact, set: 'I18' }, ...Pz.indices]; };
  const idxCur = () => { const o = PR('bjindice', { key: 'strip', i: 0 }), L = idxList(o.key); return { o, d: L[o.i % Math.max(1, L.length)], L }; };
  const idxQ = (d) => (d.ins ? 'Assurance : à partir de quel true count la prendre ?' : `${ROWL(d.row)} contre ${UPN(d.up)} : quand ${AFR[d.act].toLowerCase()} au lieu de ${AFR[d.basic].toLowerCase()} ?`);
  const idxA = (d) => (d.ins ? `TC ≥ ${sgn(d.index)}` : `${AFR[d.act]} si TC ${d.dir > 0 ? '≥' : '<'} ${sgn(d.index)}`);
  add({ id: 'bjindice', dom: 'bj', grp: 'Quiz', l: 'Indice', names: () => ['Question', 'Réponse'],
    items: () => idxCur().L.length, pick: (i) => { PR('bjindice', { key: 'strip', i: 0 }).i = i % Math.max(1, idxCur().L.length); }, cur: () => PR('bjindice', { key: 'strip', i: 0 }).i,
    ctl() { const { o, L } = idxCur(); return presetSel('bjindice', o.key) + itemSel('bjindice', L.map((d) => (d.ins ? 'Assurance' : `${ROWL(d.row)} contre ${UPN(d.up)} (${d.set})`)), o.i, 'Indice'); },
    draw(g, F, T, k, p) {
      const { o, d } = idxCur(), { pad, land } = LY(F); if (!d) return emptyFrame(g, F, T, 'Données absentes', '');
      const Pz = BD().presets[o.key], setL = d.set === 'I18' ? 'Illustrious 18' : d.set === 'F4' || d.set === 'fab4' ? 'Fab 4' : 'Indices Hi-Lo';
      let y = header(g, F, T, `${setL} · ${Pz.label}`, st.hook || (k ? idxA(d) : 'L\'indice à connaître')); if (!k) countdown(g, F, T, p);
      y = text(g, idxQ(d), pad, y + 50, { size: land ? 44 : 52, font: FD, weight: 700, color: T.ink, maxW: F.w - pad * 2, lh: 1.2, maxLines: 4 }) + 30;
      if (k) {
        y = bigPanel(g, F, T, y, idxA(d), { fill: T.acc, color: onAcc() }) + 40;
        y = text(g, d.ins ? 'L\'assurance paie 2 contre 1 : elle devient rentable quand plus d\'un tiers des cartes restantes sont des 10.' : `Stratégie de base : ${AFR[d.basic].toLowerCase()}. Le compte change la composition du sabot, donc la meilleure décision.`, pad, y, { size: land ? 32 : 36, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 4 }) + 10;
        text(g, `Seuil exact calculé par SIGMA 52 : ${sgn(d.exact, 2)} (true count Hi-Lo, arrondi vers zéro).`, pad, y + 20, { size: land ? 26 : 30, color: T.muted, maxW: F.w - pad * 2, maxLines: 2 });
      } else text(g, 'Système Hi-Lo, true count.', pad, y, { size: land ? 30 : 34, color: T.muted });
      footer(g, F, T); return 2;
    },
    cap() { const { d } = idxCur(); return d ? `${st.hook || idxQ(d)} Réponse en commentaire 👇\n\nRéponse : ${idxA(d)} (Hi-Lo, seuil exact ${sgn(d.exact, 2)}).` : ''; }, say() { const { d } = idxCur(); return d ? [idxQ(d), `${idxA(d)}.`] : []; }, dur: (k) => (k ? 4600 : 3800) });

  // ---------- Blackjack : système de comptage ----------
  const SYS = () => CTm()?.SYSTEMS || [];
  add({ id: 'bjsys', dom: 'bj', grp: 'Apprendre', l: 'Système de comptage',
    items: () => SYS().length, pick: (i) => { PR('bjsys').i = i % SYS().length; }, cur: () => PR('bjsys', { i: 0 }).i,
    ctl: () => itemSel('bjsys', SYS().map((s) => s.name), PR('bjsys', { i: 0 }).i, 'Système'),
    draw(g, F, T) {
      const Sy = SYS()[PR('bjsys', { i: 0 }).i % SYS().length], { pad, land } = LY(F), C = BD().counts?.strip?.systems?.[Sy.id], B = BA()?.big?.(`strip|${Sy.id}|0.75|1|none`);
      let y = header(g, F, T, `Système de comptage · niveau ${Sy.level} · ${Sy.balanced ? 'équilibré' : 'déséquilibré'}`, st.hook || Sy.name);
      const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1], per = land ? 10 : 5, cw = Math.min((F.w - pad * 2) / per - 16, land ? 120 : 150), gap = ((F.w - pad * 2) - per * cw) / Math.max(1, per - 1), rnd = mrng(3);
      ranks.forEach((r, i) => { const x = pad + (i % per) * (cw + gap), yy = y + 30 + Math.floor(i / per) * (cw * 1.4 + 70), t = Sy.t[r]; cardAt(g, bjCard(r, rnd), x, yy, cw); text(g, Sy.red7 && r === 7 ? '+1 r / 0' : (sgn(t, t % 1 ? 1 : 0) || '0'), x + cw / 2, yy + cw * 1.4 + 46, { align: 'center', size: Sy.red7 && r === 7 ? 26 : 38, font: FM, weight: 700, color: t > 0 ? '#3C9A63' : t < 0 ? '#D9768E' : T.muted }); });
      y += 30 + Math.ceil(10 / per) * (cw * 1.4 + 70) + 20;
      const stats = [['Corrélation de mise', C ? fr(C.bc, 2) : '—'], ['Efficacité d\'assurance', C ? fr(C.ic, 2) : '—'], ['SCORE (1-12)', B ? fr(B.score, 1) : '—']], bw = (F.w - pad * 2 - 40) / 3;
      stats.forEach(([l, v], i) => { const x = pad + i * (bw + 20); rr(g, x, y, bw, 150, 18); g.fillStyle = T.panel; g.fill(); text(g, v, x + 24, y + 78, { size: 50, font: FM, weight: 600, color: T.ink, maxW: bw - 40, maxLines: 1 }); text(g, l, x + 24, y + 124, { size: land ? 22 : 24, color: T.muted, maxW: bw - 40, maxLines: 1 }); });
      text(g, Sy.note || Sy.who || '', pad, y + 210, { size: land ? 28 : 32, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
      note(g, F, T, 'BC, IC : calcul SIGMA 52, sabot de 6. SCORE : simulation de référence, 6 jeux Strip, pénétration 75 %, rampe optimale 1-12.');
      footer(g, F, T); return 1;
    },
    cap() { const Sy = SYS()[PR('bjsys', { i: 0 }).i % SYS().length], C = BD().counts?.strip?.systems?.[Sy.id], B = BA()?.big?.(`strip|${Sy.id}|0.75|1|none`); return `${st.hook || Sy.name} : les valeurs à apprendre.\n\n${[2, 3, 4, 5, 6, 7, 8, 9, 10, 1].map((r) => `${r === 1 ? 'As' : r} : ${sgn(Sy.t[r], Sy.t[r] % 1 ? 1 : 0) || '0'}`).join(' · ')}\n\n${C ? `Corrélation de mise ${fr(C.bc, 2)}, efficacité d'assurance ${fr(C.ic, 2)}. ` : ''}${B ? `SCORE ${fr(B.score, 1)} (6 jeux, 75 %, rampe 1-12).` : ''}`; },
    say() { const Sy = SYS()[PR('bjsys', { i: 0 }).i % SYS().length]; return [`${Sy.name}, système de niveau ${Sy.level}, ${Sy.balanced ? 'équilibré' : 'déséquilibré'}. ${Sy.note || ''}`]; } });

  // ---------- Blackjack : graphiques ----------
  const CHARTS = [['edge', 'Avantage par true count'], ['rules', 'Coût des règles'], ['bust', 'Le croupier crève, par carte visible'], ['systems', 'SCORE des 14 systèmes'], ['pen', 'Effet de la pénétration'], ['hole', 'Valeur de la carte cachée'], ['track', 'Suivi de mélange selon la procédure'], ['first', 'Espérance selon la première carte']];
  function chartData(id, key) {
    const D = BD(), Pz = D.presets?.[key];
    if (id === 'edge' && Pz) return { kick: `Hi-Lo · ${Pz.label}`, title: 'Ton avantage selon le true count', items: Pz.edgeByTC.filter((x) => x[0] >= -3 && x[0] <= 6).map(([t, e]) => ({ l: 'TC ' + sgn(t), v: e, s: spc(e, 2), c: e > 0 ? '#3C9A63' : '#D9768E' })), note: 'Calcul exact sur le sabot moyen à chaque true count, stratégie de base et indices.' };
    if (id === 'rules' && D.ruleCosts) return { kick: `Règles · base ${D.ruleCosts.base}`, title: 'Ce que coûte chaque règle', items: D.ruleCosts.rows.slice().sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v: -v, s: (v > 0 ? '−' : '+') + fr(Math.abs(v * 100), 2) + ' pt', c: v > 0 ? '#D9768E' : '#3C9A63' })), note: 'Variation de l\'avantage du joueur, calcul exact SIGMA 52. Négatif : la règle te coûte.', labelW: 0.5 };
    if (id === 'bust' && Pz) { const c = BJm().Calc(Pz.rules), s = BJm().shoeOf(Pz.rules.decks || 6); return { kick: `Croupier · ${Pz.label}`, title: 'Probabilité que le croupier crève', items: BJm().UPS.map((u) => { const x = s.slice(); x[u]--; const b = c.dealerDist(x, u)[5]; return { l: UPN(u), v: b, s: pc(b), c: b > 0.35 ? '#3C9A63' : T0().acc }; }), note: Pz.rules.peek ? 'Avec vérification du blackjack (carte cachée) : croupier sans blackjack.' : 'Jeu sans carte cachée.', labelW: 0.18 }; }
    if (id === 'systems') { const r = SYS().map((s) => ({ s, b: BA()?.big?.(`strip|${s.id}|0.75|1|none`) })).filter((x) => x.b).sort((a, b) => b.b.score - a.b.score); return r.length ? { kick: 'Simulation · 6 jeux Strip · 75 %', title: 'Quel système gagne le plus ?', items: r.map((x) => ({ l: x.s.name, v: x.b.score, s: fr(x.b.score, 1), c: x.s.id === 'hilo' ? T0().acc : '#5B7EA6' })), note: 'SCORE : gain pour 100 mains avec 10 000 de bankroll, rampe optimale 1-12. Simulations de référence SIGMA 52 (100 à 300 M de mains par système).', labelW: 0.42 } : null; }
    if (id === 'pen') { const it = []; for (const k of ['europe', 'strip']) for (const p of [0.67, 0.75, 0.83]) { const b = BA()?.big?.(`${k}|hilo|${p}|1|none`); if (b) it.push({ l: `${k === 'europe' ? 'Europe' : 'Strip'} ${Math.round(p * 100)} %`, v: b.score, s: fr(b.score, 1), c: k === 'strip' ? T0().acc : '#5B7EA6' }); } return it.length ? { kick: 'Simulation · Hi-Lo · rampe 1-12', title: 'La pénétration change tout', items: it, note: 'SCORE Hi-Lo selon la part du sabot distribuée avant le mélange. Simulations de référence SIGMA 52.', labelW: 0.36 } : null; }
    if (id === 'hole' && D.tech?.hole?.[key]) { const H = D.tech.hole[key]; return { kick: `Carte cachée · ${Pz.label}`, title: 'Ce que vaut l\'information', items: [['Aucune', H.none], ['10 ou pas', H.ten], ['Petite, moyenne, haute', H.three], ['Carte exacte', H.full]].map(([l, v]) => ({ l, v, s: spc(v, 1), c: v > 0 ? '#3C9A63' : '#D9768E' })), note: 'Calcul exact : toutes les décisions réoptimisées selon l\'information. Appareil ou complice : fraude.', labelW: 0.42 }; }
    if (id === 'track' && D.tech?.track) { const SH = SHm(); return { kick: 'Suivi de mélange · 6 jeux · 75 %', title: 'Quel mélange se suit ?', items: Object.entries(D.tech.track).map(([k, x]) => ({ l: SH?.PROCS[k]?.label || k, v: x[52].tcTrack, s: 'TC ' + sgn(x[52].tcTrack, 1), c: x[52].tcTrack > 1 ? '#3C9A63' : T0().muted })), note: 'True count des 2 premiers paquets après une coupe suivie (3 000 sabots par procédure). Au hasard : 0.', labelW: 0.5 }; }
    if (id === 'first' && D.tech?.first?.[key]) { const f = D.tech.first[key]; return { kick: `Première carte · ${Pz.label}`, title: 'Ta main selon ta première carte', items: [1, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((r) => ({ l: r === 1 ? 'As' : String(r), v: f[r], s: spc(f[r], 0), c: f[r] > 0 ? '#3C9A63' : '#D9768E' })), note: 'Espérance exacte de la main selon sa première carte : l\'as vaut une demi-mise.', labelW: 0.18 }; }
    return null;
  }
  let T0 = () => THEMES[st.theme];
  const grO = () => PR('bjgraph', { i: 0, key: 'strip' });
  add({ id: 'bjgraph', dom: 'bj', grp: 'Apprendre', l: 'Graphique',
    items: () => CHARTS.length, pick: (i) => { grO().i = i % CHARTS.length; }, cur: () => grO().i,
    ctl: () => itemSel('bjgraph', CHARTS.map((c) => c[1]), grO().i, 'Graphique') + presetSel('bjgraph', grO().key),
    draw(g, F, T) {
      const o = grO(), C = chartData(CHARTS[o.i % CHARTS.length][0], o.key), { pad, land } = LY(F);
      if (!C) return emptyFrame(g, F, T, 'Données absentes', 'Ce graphique demande les données de référence pour ces règles (jeux européen et Strip).');
      const y = header(g, F, T, C.kick, st.hook || C.title), h = F.h - F.safeB - 70 - y - 30;
      hbars(g, F, T, C.items, pad, y + 30, F.w - pad * 2, h, { labelW: (F.w - pad * 2) * (C.labelW || 0.3), maxRow: land ? 80 : 96 });
      note(g, F, T, C.note); footer(g, F, T); return 1;
    },
    cap() { const o = grO(), C = chartData(CHARTS[o.i % CHARTS.length][0], o.key); return C ? `${st.hook || C.title}\n\n${C.items.map((x) => `• ${x.l} : ${x.s}`).join('\n')}\n\n${C.note}` : ''; },
    say() { const o = grO(), C = chartData(CHARTS[o.i % CHARTS.length][0], o.key); return C ? [`${C.title}. ${C.items.slice(0, 4).map((x) => `${x.l} : ${x.s}`).join(', ')}.`] : []; }, dur: () => 4800 });

  // ---------- Blackjack : leçon ----------
  const BMs = () => BC()?.MODULES || [];
  const bjm = () => BMs()[PR('bjlecon', { i: 0 }).i % Math.max(1, BMs().length)];
  add({ id: 'bjlecon', dom: 'bj', grp: 'Apprendre', l: 'Leçon', anim: true,
    items: () => BMs().length, pick: (i) => { PR('bjlecon').i = i % BMs().length; }, cur: () => PR('bjlecon', { i: 0 }).i,
    ctl: () => itemSel('bjlecon', BMs().map((m) => `${m.part} · ${m.title}`), PR('bjlecon', { i: 0 }).i, 'Module'),
    names: (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 'Titre' : i === n - 1 ? 'Fin' : String(i))),
    draw(g, F, T, k = 0, p = 1) { const m = bjm(); if (!m) return emptyFrame(g, F, T, 'Indisponible', ''); return lessonFrame(g, F, T, k, p ?? 1, m, `Leçon blackjack · ${m.part}`, 'Le module complet, ses exercices et le calcul exact sont dans SIGMA 52.'); },
    cap() { const m = bjm(); return m ? `${st.hook || m.title}\n\n${m.keys.map((k) => '• ' + k).join('\n')}` : ''; }, say() { const m = bjm(); return m ? lessonSay(m) : []; }, dur: () => 3400 });

  // ---------- Blackjack : suivi de mélange ----------
  const SHC = {};
  function shufGen(proc, seed) {
    const id = proc + '|' + seed; if (SHC[id]) return SHC[id];
    const SH = SHm(), r = SH.dealAndShuffle(6, 0.75, SH.PROCS[proc], SH.rng(seed * 31 + 7), BJm().HILO), K = 104, n = r.out.length;
    let best = 0, bs = Infinity; for (let s = 0; s + K <= n; s += 13) { let t = 0; for (let i = 0; i < K; i++) t += BJm().HILO[r.out[s + i]]; if (t < bs) { bs = t; best = s; } }
    return (SHC[id] = { ...r, best, tc: -bs / 2 });
  }
  const shO = () => PR('bjshuffle', { proc: 'zone2rs', seed: 1 });
  add({ id: 'bjshuffle', dom: 'bj', grp: 'Apprendre', l: 'Suivi de mélange', reroll() { shO().seed++; },
    ctl: () => sel('bjshuffle', 'proc', Object.entries(SHm()?.PROCS || {}).map(([k, p]) => [k, p.label]), shO().proc, 'Procédure'),
    draw(g, F, T) {
      const o = shO(), R = shufGen(o.proc, o.seed), { pad, land } = LY(F), SH = SHm(), HL = BJm().HILO;
      let y = header(g, F, T, `Suivi de mélange · ${SH.PROCS[o.proc].label}`, st.hook || 'Un mélange laisse des traces');
      const strip = (arr, yy, h, label, mark) => {
        text(g, label, pad, yy - 14, { size: land ? 28 : 30, font: FM, weight: 600, color: T.muted }); const w = (F.w - pad * 2) / arr.length;
        arr.forEach((r, i) => { const t = HL[r]; g.fillStyle = t > 0 ? '#3C9A63' : t < 0 ? '#B23656' : 'rgba(201,191,194,.55)'; g.fillRect(pad + i * w, yy, Math.max(0.8, w), h); });
        if (mark) { g.strokeStyle = T.acc; g.lineWidth = 6; g.strokeRect(pad + mark[0] * w, yy - 4, mark[1] * w, h + 8); }
        return yy + h;
      };
      const h = land ? 120 : 170; y = strip(R.stack, y + 60, h, 'Défausse avant le mélange (cartes non jouées en haut)') + 90;
      y = strip(R.out, y, h, 'Sabot après le mélange', [R.best, 104]) + 50;
      const T52 = BD().tech?.track?.[o.proc]?.[52];
      y = text(g, `Vert : petites cartes (+1). Bordeaux : 10 et as (−1). Encadré : les 2 paquets les plus riches en cartes hautes, true count ${sgn(R.tc, 1)}.`, pad, y, { size: land ? 28 : 32, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 4 });
      if (T52) text(g, `Sur 3 000 sabots, une coupe suivie donne en moyenne TC ${sgn(T52.tcTrack, 1)} au début du sabot (corrélation prédit / réel ${fr(T52.corr, 2)}).`, pad, y + 30, { size: land ? 26 : 30, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
      note(g, F, T, 'Modèle SIGMA 52 : riffle de Gilbert-Shannon-Reeds, strip, poignées. Technique d\'observation : le casino peut l\'interdire.');
      footer(g, F, T); return 1;
    },
    cap() { const o = shO(), T52 = BD().tech?.track?.[o.proc]?.[52]; return `${st.hook || 'Un mélange laisse des traces'} (${SHm().PROCS[o.proc].label}).\n\nLes 10 et les as d'une même poignée restent souvent ensemble après le mélange.${T52 ? ` Sur 3 000 sabots simulés, une coupe suivie place en moyenne un début de sabot à TC ${sgn(T52.tcTrack, 1)}.` : ''}\n\nSimulation SIGMA 52, entraînement hors table.`; },
    say() { return ['Un mélange manuel ne mélange pas tout. Les cartes d\'une même poignée restent proches, et celui qui a compté la défausse sait où sont les zones riches.']; }, dur: () => 5200 });

  // ---------- Blackjack : bilan ----------
  add({ id: 'bjbilan', dom: 'bj', grp: 'Tes données', l: 'Bilan', ctl: () => '<p class="note">Courbe et chiffres du Journal BJ.</p>',
    draw(g, F, T) {
      const ss = (BA()?.P?.().sessions || []).slice().sort((a, b) => a.date.localeCompare(b.date)), { pad, land } = LY(F);
      if (!ss.length) return emptyFrame(g, F, T, 'Pas encore de séance', 'Saisis tes séances dans le Journal BJ.');
      const tot = ss.reduce((a, s) => a + s.result, 0), hrs = ss.reduce((a, s) => a + s.hours, 0);
      let y = header(g, F, T, `Bilan blackjack · ${ss.length} séance${ss.length > 1 ? 's' : ''}`, st.hook || 'Mon suivi blackjack');
      const stats = [['Résultat', (tot >= 0 ? '+' : '−') + fr(Math.abs(tot), 0) + ' €'], ['Heures', fr(hrs, 1)], ['Par heure', hrs ? (tot >= 0 ? '+' : '−') + fr(Math.abs(tot / hrs), 0) + ' €' : '—']];
      const bw = (F.w - pad * 2 - 40) / 3; stats.forEach(([l, v], i) => { const x = pad + i * (bw + 20); rr(g, x, y + 20, bw, 150, 18); g.fillStyle = T.panel; g.fill(); text(g, v, x + 24, y + 100, { size: 46, font: FM, weight: 600, color: T.ink, maxW: bw - 40, maxLines: 1 }); text(g, l, x + 24, y + 145, { size: 26, color: T.muted }); });
      y += 220; let c = 0; const pts = ss.map((s) => (c += s.result)), mn = Math.min(0, ...pts), mx = Math.max(0, ...pts), ch = land ? F.h - y - F.safeB - 30 : Math.min(600, F.h - y - F.safeB - 60), cw = F.w - pad * 2;
      g.strokeStyle = T.muted; g.lineWidth = 2; g.setLineDash([8, 8]); const zy = y + ch - ((0 - mn) / Math.max(1e-9, mx - mn)) * ch; g.beginPath(); g.moveTo(pad, zy); g.lineTo(pad + cw, zy); g.stroke(); g.setLineDash([]);
      g.strokeStyle = T.acc; g.lineWidth = 6; g.beginPath(); pts.forEach((v, i) => { const x = pad + (pts.length === 1 ? cw : (i / (pts.length - 1)) * cw), yy = y + ch - ((v - mn) / Math.max(1e-9, mx - mn)) * ch; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
      footer(g, F, T); return 1;
    },
    cap: () => `${st.hook || 'Mon suivi blackjack'} : un avantage de 1 % se lit sur des centaines d'heures, pas sur une séance.`, say: () => ['Mon suivi blackjack : l\'avantage se lit sur des centaines d\'heures.'] });

  // =====================================================================
  // Rendu, légendes, script
  // =====================================================================
  const tpOf = () => TP[st.tpl] || TP.main;
  const DOMS = { poker: 'Poker', bj: 'Blackjack' };
  const forDom = (d) => Object.values(TP).filter((t) => t.dom === d || t.dom === 'both');
  const TAGS = { poker: '#poker #pokerfrancais #strategiepoker #sigma52', bj: '#blackjack #strategiedebase #comptagedescartes #sigma52' };
  function endFrame(g, F, T) {
    const { pad, land } = LY(F);
    g.fillStyle = T.acc; g.font = `800 ${land ? 200 : 240}px ${FD}`; g.textAlign = 'center'; g.fillText('σ52', F.w / 2, F.h * 0.44);
    text(g, st.handle || 'SIGMA 52', F.w / 2, F.h * 0.44 + 110, { align: 'center', size: land ? 56 : 64, font: FD, weight: 700, color: T.ink, maxW: F.w - pad * 2 });
    text(g, st.cta || (st.dom === 'bj' ? 'Abonne-toi pour progresser au blackjack' : 'Abonne-toi pour progresser au poker'), F.w / 2, F.h * 0.44 + 190, { align: 'center', size: land ? 34 : 40, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
    if (st.mention) text(g, MENTION, pad, F.h - F.safeB + 50, { size: 22, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
  }
  function draw(canvas, k, p) {
    const F = FORMATS[st.fmt], T = THEMES[st.theme]; if (canvas.width !== F.w) canvas.width = F.w; if (canvas.height !== F.h) canvas.height = F.h;
    const g = canvas.getContext('2d'), kk = k ?? st.frame, tp = tpOf(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; frame(g, F, T);
    let n = 1; try { n = tp.draw(g, F, T, kk, p) || 1; } catch (e) { (window.__stErr ||= []).push(st.tpl + ' ' + kk + ' : ' + (e && e.message)); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; frame(g, F, T); emptyFrame(g, F, T, 'Contenu indisponible', String(e && e.message || e)); n = 1; }
    if (st.endCard) { if (kk >= n) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; frame(g, F, T); endFrame(g, F, T); } return n + 1; }
    return n;
  }
  const countFrames = () => { const c = document.createElement('canvas'); return draw(c, 0); };
  const durOf = (k, n) => { const tp = tpOf(), nT = st.endCard ? n - 1 : n; if (st.endCard && k === n - 1) return 2600; return tp.dur ? tp.dur(k, nT) : tp.anim ? 3200 : 2600; };
  const frameNames = (n) => { const tp = tpOf(), nT = st.endCard ? n - 1 : n; const a = tp.names ? tp.names(nT) : Array.from({ length: nT }, (_, i) => String(i + 1)); return st.endCard ? [...a, 'Fin'] : a; };
  function caption() {
    let c = ''; try { c = tpOf().cap ? tpOf().cap() : ''; } catch (e) { c = ''; }
    return `${c}${st.cta ? '\n\n' + st.cta : ''}\n\n${TAGS[st.dom === 'bj' ? 'bj' : 'poker']}${st.mention ? '\n\n' + MENTION : ''}`;
  }
  function script() { let s = []; try { s = tpOf().say ? tpOf().say() : []; } catch (e) { s = []; } if (st.endCard) s = [...s, st.cta || 'Abonne-toi pour la suite.']; return s; }
  const tcode = (ms) => { const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, x = Math.floor(ms % 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(x).padStart(3, '0')}`; };
  function srt() { const n = countFrames(), say = script(); let t = 0, out = '', idx = 1; for (let k = 0; k < n; k++) { const d = durOf(k, n), line = say[k]; if (line) out += `${idx++}\n${tcode(t)} --> ${tcode(t + d)}\n${line}\n\n`; t += d; } return out; }

  // =====================================================================
  // Vue
  // =====================================================================
  function view() {
    const tp = tpOf(), list = forDom(st.dom), groups = [...new Set(list.map((t) => t.grp))];
    if (st.tpl === 'main') { const srcs = handSources(); if (!srcs.some((x) => x[0] === st.handSrc) && srcs.length) st.handSrc = srcs[0][0]; }
    const nav = tp.items ? `<div class="row"><button class="btn small" data-act="stprev">← Précédent</button><button class="btn small" data-act="stnext">Suivant →</button><span class="note">${(tp.cur ? tp.cur() : 0) + 1} / ${tp.items()}</span></div>` : tp.reroll ? '<div class="row"><button class="btn small" data-act="stnext">Nouveau tirage</button></div>' : '';
    let say = ''; try { say = script().map((s, i) => (s ? `${i + 1}. ${s}` : '')).filter(Boolean).join('\n'); } catch (e) { say = ''; }
    return head(st.dom === 'bj' ? 'Studio blackjack' : 'Studio', 'Visuels, carrousels et vidéos courtes à partir des contenus et des calculs de SIGMA 52 : poker et blackjack. Lots prêts à publier, semaine de contenu, légende, script de voix off et sous-titres.') +
      `<div class="studio">
        <section class="panel st-side">
          <div class="row">${Object.entries(DOMS).map(([k, l]) => `<button class="chip" aria-pressed="${st.dom === k}" data-act="stdom" data-v="${k}">${l}</button>`).join('')}</div>
          ${groups.map((gname) => `<span class="eyebrow">${esc(gname)}</span><div class="row">${list.filter((t) => t.grp === gname).map((t) => `<button class="chip" aria-pressed="${st.tpl === t.id}" data-act="sttpl" data-v="${t.id}">${esc(t.l)}</button>`).join('')}</div>`).join('')}
          ${tp.ctl ? tp.ctl() : ''}${nav}
          <span class="eyebrow">Format</span><div class="row">${Object.entries(FORMATS).map(([k, f]) => `<button class="chip" aria-pressed="${st.fmt === k}" data-act="stfmt" data-v="${k}">${f.l}</button>`).join('')}</div>
          <span class="eyebrow">Ambiance</span><div class="row">${[['bordeaux', 'Bordeaux'], ['nuit', 'Nuit'], ['creme', 'Crème'], ['feutre', 'Feutre'], ['ardoise', 'Ardoise']].map(([k, l]) => `<button class="chip" aria-pressed="${st.theme === k}" data-act="sttheme" data-v="${k}">${l}</button>`).join('')}</div>
          <label class="f">Accroche (titre)<input data-st="hook" value="${esc(st.hook)}" placeholder="Laisse vide pour le titre par défaut" maxlength="90"></label>
          <label class="f">Signature<input data-st="handle" value="${esc(st.handle)}" placeholder="@ton_compte" maxlength="40"></label>
          <label class="f">Appel à l'action<input data-st="cta" value="${esc(st.cta)}" placeholder="Abonne-toi pour la suite" maxlength="80"></label>
          <label class="check"><input type="checkbox" data-act="stend" ${st.endCard ? 'checked' : ''}><span>Image de fin (signature et appel à l'action)</span></label>
          <label class="check"><input type="checkbox" data-act="stguides" ${st.guides ? 'checked' : ''}><span>Afficher les zones masquées par l'application (aperçu seulement)</span></label>
          <label class="check"><input type="checkbox" data-act="stmention" ${st.mention ? 'checked' : ''}><span>Message de prévention et mention 18+</span></label>
          <p class="note">Un contenu qui fait la promotion d'un opérateur de jeu doit porter un message de mise en garde : garde-le activé et vérifie le texte en vigueur avant toute publication commerciale.</p>
        </section>
        <section class="panel st-main">
          <div class="st-stage"><canvas id="stc" aria-label="Aperçu du visuel"></canvas></div>
          <div class="row" id="stframes"></div>
          <div class="row"><button class="btn primary" data-act="stpng">Télécharger l'image</button><button class="btn" data-act="stall">Toutes les images (.zip)</button><button class="btn" data-act="stvid">Vidéo</button><button class="btn" data-act="stsrt">Sous-titres (.srt)</button></div>
          <div class="form"><label class="f">Fichier image<select data-st="img"><option value="png"${st.img === 'png' ? ' selected' : ''}>PNG</option><option value="jpg"${st.img === 'jpg' ? ' selected' : ''}>JPEG (plus léger)</option></select></label><label class="f">Taille du lot<select data-st="batchN">${[5, 10, 20, 30].map((n) => `<option value="${n}"${+st.batchN === n ? ' selected' : ''}>${n} contenus</option>`).join('')}</select></label></div>
          <div class="row"><button class="btn" data-act="stbatch" ${tp.items || tp.reroll ? '' : 'disabled'}>Lot de ce modèle (.zip)</button><button class="btn" data-act="stweek">Semaine de contenu ${DOMS[st.dom].toLowerCase()} (.zip)</button></div>
          ${st.busy ? `<div class="meter"><i style="width:${Math.round(st.busy.done / Math.max(1, st.busy.total) * 100)}%"></i></div><p class="note">${esc(st.busy.label)} ${st.busy.done}/${st.busy.total}</p>` : ''}
          ${st.msg ? `<p class="note" id="stmsg">${esc(st.msg)}</p>` : ''}
          <label class="f">Légende<textarea id="stcap" rows="7" readonly>${esc(caption())}</textarea></label>
          <div class="row"><button class="btn small" data-act="stcopy">Copier la légende</button></div>
          <label class="f">Script de voix off<textarea id="stsay" rows="5" readonly>${esc(say)}</textarea></label>
          <div class="row"><button class="btn small" data-act="stcopysay">Copier le script</button></div>
        </section></div>`;
  }
  VIEWS.studio = () => { if (!forDom(st.dom).includes(tpOf())) st.tpl = forDom(st.dom)[0].id; return view(); };
  VIEWS.bjstudio = () => { if (st.dom !== 'bj') { st.dom = 'bj'; if (st.theme === 'bordeaux') st.theme = 'feutre'; if (!forDom('bj').includes(tpOf())) { st.tpl = 'bjquiz'; st.frame = 0; } } return view(); };
  function guides(cv) { const F = FORMATS[st.fmt], g = cv.getContext('2d'); g.save(); g.fillStyle = 'rgba(226,90,123,.22)'; g.fillRect(0, 0, F.w, F.safeT - 60); g.fillRect(0, F.h - F.safeB + 10, F.w, F.safeB - 10); if (st.fmt === 'short') g.fillRect(F.w - 150, F.safeT, 150, F.h - F.safeT - F.safeB); g.restore(); }
  const after = () => {
    const cv = $('#stc'); if (!cv) return;
    const fit = () => { const stage = cv.parentElement, F = FORMATS[st.fmt]; if (!stage) return; const w = stage.clientWidth - 24, h = stage.clientHeight - 24, k = Math.min(w / F.w, h / F.h); cv.style.width = Math.floor(F.w * k) + 'px'; cv.style.height = Math.floor(F.h * k) + 'px'; };
    const draw0 = () => {
      if (st.rec) return; const n = draw(cv); if (st.frame >= n) { st.frame = n - 1; draw(cv); } if (st.guides) guides(cv); fit();
      const fr0 = $('#stframes'), names = frameNames(n); if (fr0) fr0.innerHTML = n > 1 ? names.map((l, i) => `<button class="chip" aria-pressed="${st.frame === i}" data-act="stframe" data-v="${i}">${esc(l || String(i + 1))}</button>`).join('') : '';
    };
    if (document.fonts?.ready) document.fonts.ready.then(draw0); draw0();
  };
  X.AFTER.studio = after; X.AFTER.bjstudio = after;
  const inBJ = () => X.getTab?.() === 'bjstudio';
  // Depuis un module du cours : ouvre le Studio sur la leçon animée de ce module.
  X.studioLesson = (id) => { st.dom = 'poker'; st.tpl = 'lecon'; st.mod = id; st.frame = 0; st.msg = 'Leçon animée prête : choisis le format, puis « Vidéo ».'; X.go('studio'); };
  X.studioBJLesson = (id) => { const i = BMs().findIndex((m) => m.id === id); st.dom = 'bj'; st.tpl = 'bjlecon'; PR('bjlecon').i = Math.max(0, i); st.frame = 0; st.msg = 'Leçon animée prête : choisis le format, puis « Vidéo ».'; X.go('bjstudio'); };
  ACT.stmodvid = (t) => X.studioLesson(t.dataset.id);
  ACT.stbjmod = (t) => X.studioBJLesson(t.dataset.id);
  ACT.stdom = (t) => { const d = t.dataset.v; if (d === st.dom) return; st.dom = d; st.tpl = forDom(d)[0].id; if (d === 'bj' && st.theme === 'bordeaux') st.theme = 'feutre'; if (d === 'poker' && st.theme === 'feutre') st.theme = 'bordeaux'; st.frame = 0; st.msg = ''; if (d === 'poker' && inBJ()) X.go('studio'); else render(); };
  ACT.sttpl = (t) => { st.tpl = t.dataset.v; st.frame = 0; st.msg = ''; render(); };
  ACT.stfmt = (t) => { st.fmt = t.dataset.v; render(); };
  ACT.sttheme = (t) => { st.theme = t.dataset.v; render(); };
  ACT.stframe = (t) => { st.frame = +t.dataset.v; render(); };
  ACT.stquiz = () => { newQuiz(); render(); };
  ACT.stmention = (t) => { st.mention = t.checked; render(); };
  ACT.stend = (t) => { st.endCard = t.checked; render(); };
  ACT.stguides = (t) => { st.guides = t.checked; render(); };
  const step = (dir) => { const tp = tpOf(); if (tp.items) tp.pick((((tp.cur ? tp.cur() : 0) + dir) % tp.items() + tp.items()) % tp.items()); else if (tp.reroll) tp.reroll(); st.frame = 0; };
  ACT.stnext = () => { step(1); render(); };
  ACT.stprev = () => { step(-1); render(); };
  const copy = async (v, okMsg, sel) => { try { await navigator.clipboard.writeText(v); st.msg = okMsg; } catch (e) { $(sel)?.select(); st.msg = 'Sélectionne le texte et copie-le (Ctrl+C).'; } render(); };
  ACT.stcopy = () => copy(caption(), 'Légende copiée.', '#stcap');
  ACT.stcopysay = () => copy(script().filter(Boolean).join('\n'), 'Script copié.', '#stsay');
  ONCHANGE.push((t) => {
    if (t.dataset.st) { const k = t.dataset.st; st[k] = k === 'batchN' ? +t.value : t.value; if (k === 'quizType') newQuiz(); if (k === 'handSrc') st.frame = 0; render(); return true; }
    if (t.dataset.sp) { const [id, f] = t.dataset.sp.split('.'); PR(id)[f] = ['i', 'n', 'ms', 'seed'].includes(f) ? +t.value : t.value; st.frame = 0; render(); return true; }
  });

  // =====================================================================
  // Exports : image, zip, lot, semaine, sous-titres, vidéo
  // =====================================================================
  const fname = (k) => `sigma52-${st.tpl}-${st.fmt}${k !== undefined ? '-' + (k + 1) : ''}`;
  // Téléchargement : dans claude.ai, la capacité « downloads » (le spectateur confirme) ; sinon un lien classique (fichier local).
  async function download(blob, name) {
    let dl = null;
    try { dl = window.claude?.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); st.msg = 'Fichier enregistré : ' + name; }
      catch (e) { st.msg = e?.code === 'declined' ? 'Enregistrement annulé.' : e?.code === 'rate_limited' ? 'Une demande est déjà ouverte : réessaie dans un instant.' : 'Enregistrement indisponible dans cette vue.'; }
      render(); return;
    }
    const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  // Archive ZIP sans compression (les PNG sont déjà compressés) : une seule confirmation pour tous les fichiers.
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) { // files : [{ name, data: Uint8Array }]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const D0 = new Date(), dtime = (D0.getHours() << 11) | (D0.getMinutes() << 5) | (D0.getSeconds() >> 1), ddate = ((D0.getFullYear() - 1980) << 9) | ((D0.getMonth() + 1) << 5) | D0.getDate();
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dtime, true); h.setUint16(12, ddate, true); h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, dtime, true); c.setUint16(14, ddate, true); c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm); off += 30 + nm.length + f.data.length;
    }
    const csize = central.reduce((a, x) => a + x.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }
  const IMG = () => (st.img === 'jpg' ? ['image/jpeg', 'jpg', 0.92] : ['image/png', 'png']);
  const pngOf = (c) => new Promise((res) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => res(new Uint8Array(a))) : res(null)), IMG()[0], IMG()[2]));
  const txt = (s) => new TextEncoder().encode(s);
  const tick = () => new Promise((r) => setTimeout(r, 0));
  ACT.stpng = () => { const cv = $('#stc'); draw(cv); cv.toBlob((b) => b && download(b, fname(st.frame) + '.' + IMG()[1]), IMG()[0], IMG()[2]); if (st.guides) setTimeout(() => guides(cv), 0); };
  // Toutes les images de l'élément courant, avec sa légende et son script, dans un dossier.
  async function itemFiles(prefix, files) {
    const n = countFrames(), c = document.createElement('canvas');
    for (let k = 0; k < n; k++) { draw(c, k); const d = await pngOf(c); if (d) files.push({ name: `${prefix}${String(k + 1).padStart(2, '0')}.${IMG()[1]}`, data: d }); }
    const say = script().filter(Boolean);
    files.push({ name: `${prefix}legende.txt`, data: txt(caption() + (say.length ? '\n\n— Script de voix off —\n' + say.join('\n') : '')) });
    const s = srt(); if (s) files.push({ name: `${prefix}sous-titres.srt`, data: txt(s) });
    return n;
  }
  ACT.stall = async () => {
    const n = countFrames();
    if (n === 1) { const c = document.createElement('canvas'); draw(c, 0); const d = await pngOf(c); return download(new Blob([d], { type: IMG()[0] }), fname(0) + '.' + IMG()[1]); }
    const files = []; await itemFiles(fname() + '-', files); download(zip(files), fname() + '.zip');
  };
  ACT.stsrt = () => { const s = srt(); if (!s) { st.msg = 'Pas de script pour ce modèle.'; render(); return; } download(new Blob([s], { type: 'application/x-subrip' }), fname() + '.srt'); };
  const snapshot = () => JSON.stringify({ tpl: st.tpl, dom: st.dom, p: st.p, mod: st.mod, champ: st.champ, quiz: st.quiz, frame: st.frame });
  const restore = (s) => { const o = JSON.parse(s); Object.assign(st, o); };
  async function produce(plan, label, zipName) {
    if (st.busy) return; const snap = snapshot(), files = [], index = [];
    st.busy = { done: 0, total: plan.length, label }; render();
    try {
      for (let i = 0; i < plan.length; i++) {
        const it = plan[i]; st.dom = it.dom; st.tpl = it.tpl; it.set(); st.frame = 0;
        const folder = it.folder + '/'; const n = await itemFiles(folder, files);
        index.push(`${it.folder} · ${TP[it.tpl].l} · ${n} image${n > 1 ? 's' : ''}\n${caption()}\n`);
        st.busy.done = i + 1; const m = $('#view .meter i'); if (m) m.style.width = Math.round((i + 1) / plan.length * 100) + '%'; await tick();
      }
      files.push({ name: 'plan.txt', data: txt(`${label} — SIGMA 52\n${'='.repeat(40)}\n\n` + index.join('\n' + '-'.repeat(40) + '\n\n')) });
    } finally { restore(snap); st.busy = null; }
    st.msg = `${plan.length} contenus, ${files.length} fichiers.`; render(); download(zip(files), zipName);
  }
  ACT.stbatch = () => {
    const tp = tpOf(), N = +st.batchN || 10, start = tp.cur ? tp.cur() : 0, seed0 = Math.floor(Math.random() * 1e6), plan = [];
    for (let i = 0; i < N; i++) plan.push({ dom: st.dom, tpl: tp.id, folder: String(i + 1).padStart(2, '0') + '-' + tp.id, set: () => { if (tp.items) tp.pick(start + i); else if (tp.id === 'quiz') newQuiz(); else { const key = { outs: 'outs', texture: 'texture', bjquiz: 'bjquiz', bjcount: 'bjcount', bjtc: 'bjtc', bjshuffle: 'bjshuffle' }[tp.id]; if (key) PR(key).seed = seed0 + i * 13; } } });
    produce(plan, `Lot · ${tp.l}`, `sigma52-lot-${tp.id}-${st.fmt}.zip`);
  };
  const WEEK = { poker: ['quiz', 'chiffre', 'equite', 'lecon', 'outs', 'mythe', 'range', 'legende', 'quiz', 'texture', 'chiffre', 'lecon', 'equite', 'mythe'], bj: ['bjquiz', 'chiffre', 'bjcount', 'bjlecon', 'bjindice', 'mythe', 'bjstrat', 'bjgraph', 'bjquiz', 'bjtc', 'chiffre', 'bjsys', 'bjshuffle', 'mythe'] };
  const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  ACT.stweek = () => {
    const dom = st.dom, seed0 = Math.floor(Math.random() * 1e6), used = {}, plan = [];
    WEEK[dom].forEach((id, i) => {
      const tp = TP[id], c = (used[id] = (used[id] || 0) + 1), off = Math.floor(seed0 % 97);
      plan.push({ dom, tpl: id, folder: `J${Math.floor(i / 2) + 1}-${JOURS[Math.floor(i / 2)]}-${i % 2 ? 'soir' : 'midi'}-${id}`, set: () => { st.dom = dom; if (tp.items) tp.pick(off + c * 3); else if (id === 'quiz') newQuiz(); else PR(id).seed = seed0 + i * 17; } });
    });
    produce(plan, `Semaine de contenu ${DOMS[dom].toLowerCase()}`, `sigma52-semaine-${dom}-${st.fmt}.zip`);
  };
  // Vidéo : enregistre le canvas (MediaRecorder). Chaque image a sa durée ; animations et comptes à rebours dessinés en continu, fondu entre images.
  ACT.stvid = () => {
    if (st.rec) return;
    const cv = $('#stc'); if (!cv?.captureStream || typeof MediaRecorder === 'undefined') { st.msg = 'Ce navigateur ne permet pas l\'enregistrement vidéo. Utilise les images.'; render(); return; }
    const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    let n = draw(cv, 0); const durs = Array.from({ length: n }, (_, k) => durOf(k, n)); if (n === 1) { durs[0] = Math.max(durs[0], 4000); }
    const starts = []; let acc = 0; for (const d of durs) { starts.push(acc); acc += d; } const total = acc;
    const stream = cv.captureStream(30), rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 6e6 } : undefined), chunks = [];
    const buf = document.createElement('canvas'), prev = document.createElement('canvas'), g = cv.getContext('2d'), fade = 380, t0 = performance.now();
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => { REC = false; const ext = (rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'; download(new Blob(chunks, { type: rec.mimeType || 'video/webm' }), fname() + '.' + ext); st.rec = null; st.msg = `Vidéo prête (${ext.toUpperCase()}, ${fr(total / 1000, 1)} s). Sous-titres : bouton « Sous-titres (.srt) ».`; render(); };
    st.rec = rec; REC = true; $('#stframes')?.insertAdjacentHTML('afterend', '<p class="note" id="strec">Enregistrement en cours…</p>');
    rec.start(200); let cur = -1;
    const stepF = (now) => {
      const t = now - t0; if (t >= total) { rec.stop(); return; }
      let i = 0; while (i < n - 1 && t >= starts[i + 1]) i++;
      if (i !== cur) { if (cur >= 0) { draw(prev, cur, 1); } cur = i; }
      const local = t - starts[i]; draw(buf, i, Math.min(1, local / durs[i]));
      g.globalAlpha = 1; g.drawImage(buf, 0, 0);
      if (local < fade && i > 0) { g.globalAlpha = 1 - local / fade; g.drawImage(prev, 0, 0); g.globalAlpha = 1; }
      requestAnimationFrame(stepF);
    };
    requestAnimationFrame(stepF);
  };
  X.Studio = { TP, st, draw, caption, script, srt, countFrames };
})();
