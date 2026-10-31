// Studio : crée des visuels et des vidéos courtes à partir de tes contenus SIGMA 52 (main jouée, quiz, leçon, solveur,
// champion, bilan) aux formats Short 9:16, post 1:1, portrait 4:5 et YouTube 16:9. Joueurs anonymisés par position.
(function () {
  const X = window.__S52, K = window.Course, S = window.Spots, CH = window.Champions, PF = window.Postflop;
  const { E, HH, $, esc, fr, pct, state, render, head, VIEWS, ACT, ONCHANGE, ONINPUT } = X;
  const FORMATS = { short: { w: 1080, h: 1920, l: 'Short / Reel 9:16', safeT: 220, safeB: 400 }, portrait: { w: 1080, h: 1350, l: 'Portrait 4:5', safeT: 90, safeB: 120 }, post: { w: 1080, h: 1080, l: 'Post 1:1', safeT: 80, safeB: 110 }, yt: { w: 1920, h: 1080, l: 'YouTube 16:9', safeT: 80, safeB: 100 } };
  const THEMES = {
    bordeaux: { bg: ['#2A0711', '#6E1A2D'], ink: '#F7E9EC', muted: 'rgba(247,233,236,.72)', acc: '#C9A227', panel: 'rgba(0,0,0,.28)', felt: ['#7A1F33', '#3A0B16'] },
    nuit: { bg: ['#0B0709', '#1C1115'], ink: '#F4E9EC', muted: 'rgba(244,233,236,.68)', acc: '#E25A7B', panel: 'rgba(255,255,255,.06)', felt: ['#2C1820', '#120A0D'] },
    creme: { bg: ['#F7F2F3', '#EADFE2'], ink: '#1B1014', muted: 'rgba(27,16,20,.66)', acc: '#8C1D36', panel: 'rgba(140,29,54,.08)', felt: ['#7A1F33', '#3A0B16'] },
  };
  const TPL = [['main', 'Main jouée'], ['quiz', 'Quiz'], ['lecon', 'Leçon'], ['solveur', 'Solveur'], ['champion', 'Champion'], ['bilan', 'Bilan']];
  const MENTION = 'Jouer comporte des risques : endettement, dépendance… Appelez le 09 74 75 13 13 (appel non surtaxé). Interdit aux moins de 18 ans.';
  const st = { tpl: 'main', fmt: 'short', theme: 'bordeaux', hook: '', handle: '', mention: true, frame: 0, handSrc: '', quiz: null, quizType: 'mix', mod: 'mdf', champ: 'predateur', rec: null, msg: '' };

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
    g.fillStyle = T.muted; g.font = `500 26px ${FM}`; g.fillText(st.handle ? st.handle : 'SIGMA 52 · labo poker', pad + 100, y);
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
    quiz(g, F, T, k) {
      if (!st.quiz) newQuiz();
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
      const m = K.MODULES.find((x) => x.id === st.mod) || K.MODULES[0], pad = F.w > F.h ? 90 : 70, land = F.w > F.h;
      const keys = m.keys.slice(0, 5), q = (m.quiz || [])[0], n = keys.length + (q ? 2 : 0) + 2, a = Math.min(1, p * 3), ease = 1 - Math.pow(1 - a, 3);
      const kick = `Leçon · niveau ${m.level} · ${K.LEVELS[m.level - 1].title}`;
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
        const ans = k === keys.length + 2;
        let y = header(g, F, T, kick, ans ? 'La réponse' : 'À toi');
        y = text(g, pretty(q.q), pad, y + 40, { size: land ? 34 : 40, color: T.ink, maxW: F.w - pad * 2, lh: 1.3, maxLines: 4 }) + 20;
        q.opts.forEach((o, i) => { const good = ans && i === q.ok, h = land ? 64 : 84; rr(g, pad, y, F.w - pad * 2, h, 16); g.fillStyle = good ? T.acc : T.panel; g.fill(); text(g, `${'ABCD'[i]}  ${o}`, pad + 26, y + h * 0.64, { size: land ? 28 : 33, weight: 600, color: good ? (st.theme === 'creme' ? '#fff' : '#2B1608') : T.ink, maxW: F.w - pad * 2 - 52, maxLines: 1 }); y += h + 14; });
        if (ans) text(g, pretty(q.why), pad, y + 30, { size: land ? 26 : 30, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: land ? 3 : 5 });
      } else {
        let y = header(g, F, T, kick, 'À retenir');
        y = text(g, keys[0] || m.title, pad, y + 50, { size: land ? 40 : 46, weight: 600, color: T.ink, maxW: F.w - pad * 2, lh: 1.25, maxLines: 4 });
        text(g, 'Le module complet, ses exercices et 30 spots corrigés sont dans SIGMA 52.', pad, y + 70, { size: land ? 28 : 32, color: T.muted, maxW: F.w - pad * 2, lh: 1.3, maxLines: 3 });
      }
      g.restore(); footer(g, F, T); return n;
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
  function emptyFrame(g, F, T, t, d) { const pad = 70; header(g, F, T, 'Studio', t); text(g, d, pad, F.h / 2, { size: 38, color: T.muted, maxW: F.w - pad * 2, lh: 1.3 }); footer(g, F, T); return 1; }
  function draw(canvas, k, p = 1) {
    const F = FORMATS[st.fmt], T = THEMES[st.theme]; if (canvas.width !== F.w) canvas.width = F.w; if (canvas.height !== F.h) canvas.height = F.h;
    const g = canvas.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; frame(g, F, T);
    return FRAMES[st.tpl](g, F, T, k ?? st.frame, p) || 1;
  }

  // ---------------- Légende ----------------
  function caption() {
    const tags = '#poker #pokerfrancais #strategiepoker #sigma52';
    const m = st.mention ? '\n\n' + MENTION : '';
    if (st.tpl === 'quiz') { if (!st.quiz) newQuiz(); return `${st.hook || 'Tu fais quoi ?'} Réponse en commentaire 👇\n\n${pretty(st.quiz.prompt)}\n\n${tags}${m}`; }
    if (st.tpl === 'lecon') { const md = K.MODULES.find((x) => x.id === st.mod); return `${st.hook || md.title}\n\n${md.keys.map((k) => '• ' + k).join('\n')}\n\n${tags}${m}`; }
    if (st.tpl === 'champion') { const s = CH.STYLES.find((x) => x.id === st.champ); return `${st.hook || s.name} : comment s'adapter à ce profil d'adversaire.\n\n${s.adapt.map((a) => '• ' + a).join('\n')}\n\nProfil d'entraînement construit par SIGMA 52 : un archétype, pas un joueur réel.\n\n${tags}${m}`; }
    if (st.tpl === 'solveur') return `${st.hook || 'Ce que fait l\'équilibre ici'} : la stratégie GTO, main par main.\n\n${tags} #gto${m}`;
    if (st.tpl === 'bilan') return `${st.hook || 'Mon suivi poker'} : le résultat se juge sur le volume, pas sur une session.\n\n${tags}${m}`;
    return `${st.hook || 'Comment tu joues cette main ?'} Dis-moi en commentaire ce que tu fais à chaque rue.\n\n${tags}${m}`;
  }

  // ---------------- Vue ----------------
  VIEWS.studio = () => {
    const srcs = handSources();
    if (st.tpl === 'main' && !srcs.some((x) => x[0] === st.handSrc) && srcs.length) st.handSrc = srcs[0][0];
    const ctl = {
      main: srcs.length ? `<label class="f">Main<select data-st="handSrc">${srcs.map(([k, l]) => `<option value="${esc(k)}"${k === st.handSrc ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : '<p class="note">Aucune main disponible : ouvre une main dans le replayer, joue au simulateur ou sauvegarde des mains dans ta bibliothèque.</p>',
      quiz: `<label class="f">Type de question<select data-st="quizType"><option value="mix">Au hasard</option>${Object.entries(S.TYPES).map(([k, l]) => `<option value="${k}"${st.quizType === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label><button class="btn small" data-act="stquiz">Nouvelle question</button>`,
      lecon: `<label class="f">Module<select data-st="mod">${K.MODULES.map((m) => `<option value="${m.id}"${st.mod === m.id ? ' selected' : ''}>${m.level} · ${esc(m.title)}</option>`).join('')}</select></label>`,
      solveur: '<p class="note">Utilise le nœud ouvert dans l\'onglet Solveur.</p><button class="btn small" data-tab="solveur">Ouvrir le solveur</button>',
      champion: `<label class="f">Style<select data-st="champ">${CH.STYLES.map((s) => `<option value="${s.id}"${st.champ === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>`,
      bilan: '<p class="note">Courbe et chiffres du Journal.</p>',
    }[st.tpl];
    return head('Studio', 'Transforme une main, un quiz, une leçon ou un spot du solveur en visuel ou en vidéo courte. Les adversaires sont anonymisés par position.') +
      `<div class="studio">
        <section class="panel st-side">
          <span class="eyebrow">Modèle</span><div class="row">${TPL.map(([k, l]) => `<button class="chip" aria-pressed="${st.tpl === k}" data-act="sttpl" data-v="${k}">${l}</button>`).join('')}</div>
          ${ctl}
          <span class="eyebrow">Format</span><div class="row">${Object.entries(FORMATS).map(([k, f]) => `<button class="chip" aria-pressed="${st.fmt === k}" data-act="stfmt" data-v="${k}">${f.l}</button>`).join('')}</div>
          <span class="eyebrow">Ambiance</span><div class="row">${[['bordeaux', 'Bordeaux'], ['nuit', 'Nuit'], ['creme', 'Crème']].map(([k, l]) => `<button class="chip" aria-pressed="${st.theme === k}" data-act="sttheme" data-v="${k}">${l}</button>`).join('')}</div>
          <label class="f">Accroche (titre)<input data-st="hook" value="${esc(st.hook)}" placeholder="Laisse vide pour le titre par défaut" maxlength="90"></label>
          <label class="f">Signature<input data-st="handle" value="${esc(st.handle)}" placeholder="@ton_compte" maxlength="40"></label>
          <label class="check"><input type="checkbox" data-act="stmention" ${st.mention ? 'checked' : ''}><span>Message de prévention et mention 18+</span></label>
          <p class="note">Un contenu qui fait la promotion d'un opérateur de jeu doit porter un message de mise en garde : garde-le activé et vérifie le texte en vigueur avant toute publication commerciale.</p>
        </section>
        <section class="panel st-main">
          <div class="st-stage"><canvas id="stc" aria-label="Aperçu du visuel"></canvas></div>
          <div class="row" id="stframes"></div>
          <div class="row"><button class="btn primary" data-act="stpng">Télécharger l'image</button><button class="btn" data-act="stall">Toutes les images (.zip)</button><button class="btn" data-act="stvid">Vidéo${st.tpl === 'main' || st.tpl === 'quiz' ? ' (diaporama)' : ''}</button></div>
          ${st.msg ? `<p class="note">${esc(st.msg)}</p>` : ''}
          <label class="f">Légende<textarea id="stcap" rows="6" readonly>${esc(caption())}</textarea></label>
          <div class="row"><button class="btn small" data-act="stcopy">Copier la légende</button></div>
        </section></div>`;
  };
  X.AFTER.studio = () => {
    const cv = $('#stc'); if (!cv) return;
    const fit = () => {
      const stage = cv.parentElement, F = FORMATS[st.fmt]; if (!stage) return;
      const w = stage.clientWidth - 24, h = stage.clientHeight - 24, k = Math.min(w / F.w, h / F.h);
      cv.style.width = Math.floor(F.w * k) + 'px'; cv.style.height = Math.floor(F.h * k) + 'px';
    };
    const draw0 = () => {
      const n = draw(cv); if (st.frame >= n) { st.frame = n - 1; draw(cv); } fit();
      const fr0 = $('#stframes'); if (fr0) fr0.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<button class="chip" aria-pressed="${st.frame === i}" data-act="stframe" data-v="${i}">${st.tpl === 'quiz' ? ['Question', 'Réponse'][i] : st.tpl === 'lecon' ? (i === 0 ? 'Titre' : i === n - 1 ? 'Fin' : String(i)) : (handFrames((handSources().find((x) => x[0] === st.handSrc) || handSources()[0])?.[2] || '')?.frames[i]?.label || i + 1)}</button>`).join('') : '';
    };
    if (document.fonts?.ready) document.fonts.ready.then(draw0); else draw0();
    draw0();
  };
  // Depuis un module du cours : ouvre le Studio sur la leçon animée de ce module.
  X.studioLesson = (id) => { st.tpl = 'lecon'; st.mod = id; st.frame = 0; st.msg = 'Leçon animée prête : choisis le format, puis « Vidéo ».'; X.go('studio'); };
  ACT.stmodvid = (t) => X.studioLesson(t.dataset.id);
  ACT.sttpl = (t) => { st.tpl = t.dataset.v; st.frame = 0; st.msg = ''; render(); };
  ACT.stfmt = (t) => { st.fmt = t.dataset.v; render(); };
  ACT.sttheme = (t) => { st.theme = t.dataset.v; render(); };
  ACT.stframe = (t) => { st.frame = +t.dataset.v; render(); };
  ACT.stquiz = () => { newQuiz(); render(); };
  ACT.stmention = (t) => { st.mention = t.checked; render(); };
  ACT.stcopy = async () => { const v = caption(); try { await navigator.clipboard.writeText(v); st.msg = 'Légende copiée.'; } catch (e) { const ta = $('#stcap'); ta?.select(); st.msg = 'Sélectionne la légende et copie-la (Ctrl+C).'; } render(); };
  ONCHANGE.push((t) => { if (t.dataset.st) { st[t.dataset.st] = t.value; if (t.dataset.st === 'quizType') newQuiz(); if (t.dataset.st === 'handSrc') st.frame = 0; render(); return true; } });
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
  // Archive ZIP sans compression (les PNG sont déjà compressés) : une seule confirmation pour toutes les images.
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) { // files : [{ name, data: Uint8Array }]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm); off += 30 + nm.length + f.data.length;
    }
    const csize = central.reduce((a, x) => a + x.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }
  const pngOf = (c) => new Promise((res) => c.toBlob((b) => b ? b.arrayBuffer().then((a) => res(new Uint8Array(a))) : res(null), 'image/png'));
  ACT.stpng = () => { const cv = $('#stc'); draw(cv); cv.toBlob((b) => b && download(b, fname(st.frame) + '.png'), 'image/png'); };
  ACT.stall = async () => {
    const off = document.createElement('canvas'), n = draw(off, 0), files = [];
    for (let k = 0; k < n; k++) { const c = document.createElement('canvas'); draw(c, k); const d = await pngOf(c); if (d) files.push({ name: fname(k) + '.png', data: d }); }
    if (files.length === 1) return download(new Blob([files[0].data], { type: 'image/png' }), files[0].name);
    download(zip(files), fname() + '.zip');
  };
  // Vidéo : enregistre le canvas (MediaRecorder) en enchaînant les images avec un fondu ; 2,4 s par image.
  ACT.stvid = () => {
    if (st.rec) return;
    const cv = $('#stc'); if (!cv?.captureStream || typeof MediaRecorder === 'undefined') { st.msg = 'Ce navigateur ne permet pas l\'enregistrement vidéo. Utilise les images.'; render(); return; }
    const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    const n = draw(cv, 0), imgs = [];
    for (let k = 0; k < n; k++) { const c = document.createElement('canvas'); draw(c, k); imgs.push(c); }
    if (n === 1) imgs.push(imgs[0]);
    const stream = cv.captureStream(30), rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 6e6 } : undefined), chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => { const ext = (rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'; download(new Blob(chunks, { type: rec.mimeType || 'video/webm' }), fname() + '.' + ext); st.rec = null; st.msg = `Vidéo prête (${ext.toUpperCase()}, ${fr(imgs.length * per / 1000, 1)} s).`; render(); };
    const anim = st.tpl === 'lecon', buf = document.createElement('canvas'), per = anim ? 3200 : 2400;
    const g = cv.getContext('2d'), fade = 450, t0 = performance.now(), total = imgs.length * per;
    st.rec = rec; st.msg = 'Enregistrement en cours…'; $('#stframes').insertAdjacentHTML('afterend', '<p class="note" id="strec">Enregistrement en cours…</p>');
    rec.start(200);
    const step = (now) => {
      const t = now - t0; if (t >= total) { rec.stop(); return; }
      const i = Math.floor(t / per), local = t - i * per;
      g.globalAlpha = 1;
      if (anim) { draw(buf, i, Math.min(1, local / per)); g.drawImage(buf, 0, 0); } else g.drawImage(imgs[i], 0, 0);
      if (local < fade && i > 0) { g.globalAlpha = 1 - local / fade; g.drawImage(imgs[i - 1], 0, 0); g.globalAlpha = 1; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
})();
