// Jouer › Entre amis : parties en ligne en jetons sans valeur (salle en temps réel de la page publiée),
// classement partagé et ligue d'amis, groupe d'étude (mains partagées, votes, verdict du moteur).
// Données partagées : base de la page (db) ; temps réel : salle (room). Sans ces fonctions (fichier ouvert hors claude.ai), l'onglet l'explique.
(function () {
  const X = window.__S52, E = window.Engine, NG = window.NetGame, PF = window.Postflop, PR = window.Pro;
  const { $, esc, fr, pct, state, render, head, cardHTML, backHTML, VIEWS, ACT, ONCHANGE, ONINPUT } = X;
  const use = async (name) => { try { return window.claude?.use ? await window.claude.use(name) : null; } catch (e) { return null; } };

  // ---------------- Accès partagé (db + identité) ----------------
  const SH = { tried: false, db: null, user: null, uid: null, board: [], study: [], votes: {}, myVotes: {}, weekly: [], names: {}, err: '' };
  X.shared = SH;
  let subs = false;
  // Les mises à jour partagées n'affichent qu'aux onglets qui les montrent (évite d'effacer une saisie en cours ailleurs).
  const rr = () => { if (['amis', 'defis'].includes(X.getTab())) render(); };
  async function initShared() {
    if (SH.tried) return; SH.tried = true;
    SH.db = await use('db'); SH.user = await use('user');
    if (!SH.db || !SH.user) { rr(); return; }
    try { SH.uid = await SH.user.id(); } catch (e) { SH.uid = null; }
    if (!SH.uid || subs) { rr(); return; }
    subs = true;
    const err = (e) => { SH.err = e?.message || String(e); rr(); };
    SH.db.collection('board').onSnapshot((s) => { SH.board = s.docs.map((d) => ({ id: d.id, ...d.data() })); names(SH.board.map((r) => r.id)); rr(); }, err);
    SH.db.collection('study').orderBy('at', 'desc').limit(40).onSnapshot((s) => { SH.study = s.docs.map((d) => ({ id: d.id, ...d.data() })); names(SH.study.map((r) => r.by)); rr(); }, err);
    SH.db.collection('votes').onSnapshot((s) => { SH.votes = {}; for (const d of s.docs) { SH.votes[d.id] = d.data() || {}; if (d.id === SH.uid) SH.myVotes = { ...(d.data() || {}) }; } rr(); }, err);
    SH.db.collection('weekly').onSnapshot((s) => { SH.weekly = s.docs.map((d) => ({ id: d.id, ...d.data() })); names(SH.weekly.map((r) => r.id)); X.onWeekly?.(); rr(); }, err);
    rr();
  }
  async function names(ids) {
    const miss = [...new Set(ids)].filter((i) => i && !(i in SH.names)); if (!miss.length || !SH.user) return;
    try { const ps = await SH.user.profiles(miss); for (const i of miss) SH.names[i] = ps[i]?.name || ''; rr(); } catch (e) { /* noms indisponibles */ }
  }
  const nameOf = (id) => (id === SH.uid ? 'Toi' : SH.names[id] || 'Un ami');
  X.sharedName = nameOf; X.initShared = initShared;
  const offline = () => `<section class="panel"><h2>Fonction partagée indisponible ici</h2><p>Les classements, le groupe d'étude et les parties en ligne passent par la page publiée sur claude.ai, connecté à ton compte. Ouvre SIGMA 52 depuis son lien et partage-le avec tes amis.</p></section>`;

  // ---------------- Classement partagé et ligue d'amis ----------------
  function myStats() {
    const p = state.progress, L = p.league || {}, e = p.elo || { r: 1000, n: 0 }, sc = X.sigmaScore ? X.sigmaScore() : null;
    const exams = Object.values(p.exams || {}).filter((x) => x && (x.passed || x.best >= 16)).length;
    return { elo: Math.round(e.r || 1000), eloN: e.n || 0, score: sc ? Math.round(sc.total ?? sc.score ?? 0) : 0, week: L.week || (PR ? PR.weekKey(new Date()) : ''), xp: L.xp || 0, streak: X.streak ? X.streak() : p.streak || 0, exams, hands: (p.tableHands || 0) + (p.practice?.hands || 0), at: Date.now() };
  }
  async function publish() { if (!SH.db || !SH.uid) return; try { await SH.db.doc('board/' + SH.uid).set(myStats()); state.progress.sharePub = true; X.Store.save('progress'); } catch (e) { SH.err = e.message; } render(); }
  X.sharedPublish = () => { if (state.progress.sharePub && SH.db && SH.uid) publish(); };
  let bsort = 'elo';
  function boardHTML() {
    const wk = PR ? PR.weekKey(new Date()) : '';
    const rows = SH.board.slice().sort((a, b) => (bsort === 'xp' ? (b.week === wk ? b.xp : 0) - (a.week === wk ? a.xp : 0) : (b[bsort] || 0) - (a[bsort] || 0)));
    const me = SH.board.find((r) => r.id === SH.uid);
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Classement partagé · ligue d'amis</span><h2>${rows.length} joueur${rows.length > 1 ? 's' : ''} sur cette page</h2></div>
        <button class="btn${me ? '' : ' primary'}" data-act="shpub">${me ? 'Mettre à jour mes chiffres' : 'Publier mes chiffres'}</button></div>
      <p class="note">Tout le monde voit les chiffres publiés ici : Elo, Score SIGMA, XP de la semaine (ligue d'amis), série, examens réussis, mains jouées. Rien n'est publié sans ce bouton ; ensuite, tes chiffres se mettent à jour quand tu ouvres l'onglet.</p>
      <div class="row"><span class="note">Trier par :</span>${[['elo', 'Elo'], ['xp', 'XP de la semaine'], ['score', 'Score SIGMA'], ['streak', 'Série'], ['exams', 'Examens']].map(([k, l]) => `<button class="chip" aria-pressed="${bsort === k}" data-act="shsort" data-v="${k}">${l}</button>`).join('')}</div>
      ${rows.length ? `<div class="tw"><table class="t"><thead><tr><th class="n">#</th><th>Joueur</th><th class="n">Elo</th><th class="n">XP semaine</th><th class="n">Score</th><th class="n">Série</th><th class="n">Examens</th><th class="n">Mains</th></tr></thead><tbody>${rows.map((r, i) => `<tr${r.id === SH.uid ? ' style="font-weight:600"' : ''}><td class="n">${i + 1}</td><td>${esc(nameOf(r.id))}</td><td class="n mono">${r.elo ?? '–'}</td><td class="n mono">${r.week === wk ? r.xp : 0}</td><td class="n mono">${r.score ?? '–'}</td><td class="n mono">${r.streak ?? 0} j</td><td class="n mono">${r.exams ?? 0}/6</td><td class="n mono">${(r.hands || 0).toLocaleString('fr-FR')}</td></tr>`).join('')}</tbody></table></div>` : '<p>Personne n\'a encore publié. Sois le premier, puis partage le lien de la page avec tes amis.</p>'}
      <p class="note">Ligue d'amis : classement de l'XP gagnée cette semaine (${esc(wk)}), remis à zéro chaque lundi comme ta ligue.</p></section>`;
  }
  ACT.shpub = () => publish();
  ACT.shsort = (t) => { bsort = t.dataset.v; render(); };

  // ---------------- Groupe d'étude ----------------
  const st = { hero: '', board: '', pot: '10', toCall: '5', range: 'TT+, AQ+, KQs, 98s, 87s', note: '', open: false, msg: '' };
  const verdicts = new Map();
  function verdict(h) {
    if (verdicts.has(h.id)) return verdicts.get(h.id);
    let v = null;
    try {
      const hero = E.parseCards(h.hero), board = E.parseCards(h.board || ''), combos = PF.parseWeighted(h.range, [...hero, ...board]).filter(([a, b]) => !hero.includes(a) && !hero.includes(b));
      const r = E.equity([{ hand: hero }, { combos }], board, { iterations: 12000 }), eq = r.equity[0], pot = +h.pot, call = +h.toCall;
      if (call > 0) { const need = call / (pot + call); v = { eq, need, best: eq >= need ? 1 : 0, txt: `Équité ${pct(eq, 1)} contre la range, cote requise ${pct(need, 1)} → ${eq >= need ? 'payer au minimum' : 'se coucher'}${eq > 0.65 ? ' ; relancer pour la valeur se discute' : ''}.` }; }
      else v = { eq, need: 0, best: eq > 0.6 ? 1 : 0, txt: `Équité ${pct(eq, 1)} contre la range → ${eq > 0.6 ? 'miser pour la valeur' : 'checker (pas assez de valeur, bluff à juger selon l\'adversaire)'}.` };
    } catch (e) { v = { err: e.message }; }
    verdicts.set(h.id, v); return v;
  }
  const optsOf = (h) => (+h.toCall > 0 ? ['Se coucher', 'Payer', 'Relancer'] : ['Checker', 'Miser']);
  function studyHTML() {
    const form = st.open ? `<div class="form">
        <label class="f">Tes cartes<input data-stf="hero" value="${esc(st.hero)}" placeholder="AhQd" spellcheck="false" autocomplete="off"></label>
        <label class="f">Board (0 à 5 cartes)<input data-stf="board" value="${esc(st.board)}" placeholder="Qs7d2c" spellcheck="false" autocomplete="off"></label>
        <label class="f">Pot avant la mise adverse<input data-stf="pot" inputmode="decimal" value="${esc(st.pot)}"></label>
        <label class="f">À payer (0 = personne n'a misé)<input data-stf="toCall" inputmode="decimal" value="${esc(st.toCall)}"></label>
        <label class="f" style="grid-column:1/-1">Range estimée de l'adversaire<input class="mono" data-stf="range" value="${esc(st.range)}" spellcheck="false"></label>
        <label class="f" style="grid-column:1/-1">Contexte (positions, profil, actions)<input data-stf="note" value="${esc(st.note)}" maxlength="240"></label></div>
      <div class="row"><button class="btn primary" data-act="stsend">Partager au groupe</button><button class="btn" data-act="stopen">Annuler</button>${st.msg ? `<span class="note" style="color:var(--bad)">${esc(st.msg)}</span>` : ''}</div>` : '<div class="row"><button class="btn primary" data-act="stopen">Partager une main</button></div>';
    const list = SH.study.map((h) => {
      const mine = SH.myVotes[h.id], all = Object.values(SH.votes).map((v) => v[h.id]).filter((x) => x !== undefined), O = optsOf(h);
      const cnt = O.map((_, i) => all.filter((x) => x === i).length), v = mine !== undefined ? verdict(h) : null;
      return `<section class="panel"><div class="row" style="justify-content:space-between"><span class="eyebrow">${esc(nameOf(h.by))} · ${new Date(h.at).toLocaleDateString('fr-FR')}</span>${h.by === SH.uid ? `<button class="btn small" data-act="stdel" data-id="${esc(h.id)}">Retirer</button>` : ''}</div>
        <div class="row" style="gap:16px;align-items:center"><span class="cards">${E.parseCards(h.hero).map((c) => cardHTML(c, true)).join('')}</span>${h.board ? `<span class="cards">${E.parseCards(h.board).map((c) => cardHTML(c, true)).join('')}</span>` : '<span class="note">préflop</span>'}<span class="mono note">pot ${fr(+h.pot, 1)}${+h.toCall > 0 ? ` · à payer ${fr(+h.toCall, 1)}` : ''}</span></div>
        ${h.note ? `<p>${esc(h.note)}</p>` : ''}<p class="note">Range adverse : <span class="mono">${esc(h.range)}</span></p>
        <div class="opts">${O.map((o, i) => `<button class="opt${mine === i ? ' ok' : ''}" data-act="stvote" data-id="${esc(h.id)}" data-i="${i}">${o}${mine !== undefined ? ` · ${cnt[i]} vote${cnt[i] > 1 ? 's' : ''}` : ''}</button>`).join('')}</div>
        ${v ? (v.err ? `<p class="note">Moteur : ${esc(v.err)}</p>` : `<div class="advice"><div class="${(O.length === 3 ? (mine >= 1 ? 1 : 0) : mine) === v.best ? 'good' : 'warn'}"><strong>Moteur :</strong> ${esc(v.txt)}</div></div>`) : '<p class="note">Vote pour voir les votes du groupe et le verdict du moteur.</p>'}</section>`;
    }).join('');
    return `<section class="panel"><span class="eyebrow">Groupe d'étude</span><h2>Une main, un vote, puis le moteur</h2><p class="note">Chacun partage une décision difficile ; le groupe vote avant de voir les votes des autres et le verdict du moteur (équité contre la range annoncée et cote du pot : un repère, pas un solveur complet).</p>${form}</section>${list || '<p class="note">Aucune main partagée pour l\'instant.</p>'}`;
  }
  ACT.stopen = () => { st.open = !st.open; st.msg = ''; render(); };
  ACT.stsend = async () => {
    try {
      const hero = E.parseCards(st.hero), board = E.parseCards(st.board || '');
      if (hero.length !== 2 || hero[0] === hero[1]) throw new Error('Tes cartes : deux cartes, par exemple AhQd.');
      if (board.length > 5 || ![0, 3, 4, 5].includes(board.length) || new Set([...hero, ...board]).size !== hero.length + board.length) throw new Error('Board : 0, 3, 4 ou 5 cartes, sans doublon.');
      PF.parseWeighted(st.range, [...hero, ...board]);
      if (!(+st.pot > 0) || !(+st.toCall >= 0)) throw new Error('Pot et mise : des nombres positifs.');
      await SH.db.collection('study').add({ by: SH.uid, at: Date.now(), hero: st.hero.trim(), board: st.board.trim(), pot: +String(st.pot).replace(',', '.'), toCall: +String(st.toCall).replace(',', '.'), range: st.range.trim().slice(0, 300), note: st.note.trim().slice(0, 240) });
      st.open = false; st.msg = ''; st.hero = ''; st.board = '';
    } catch (e) { st.msg = e.message; }
    render();
  };
  ACT.stvote = async (t) => { const id = t.dataset.id, i = +t.dataset.i; SH.myVotes = { ...SH.myVotes, [id]: i }; render(); try { await SH.db.doc('votes/' + SH.uid).set(SH.myVotes); } catch (e) { SH.err = e.message; render(); } };
  ACT.stdel = async (t) => { try { await SH.db.doc('study/' + t.dataset.id).delete(); } catch (e) { SH.err = e.message; render(); } };
  ONCHANGE.push((t) => { if (t.dataset.stf) { st[t.dataset.stf] = t.value; return true; } });

  // ---------------- Parties en ligne (jetons sans valeur) ----------------
  const ng = { phase: 'lobby', code: '', nick: '', stack: 200, sb: 1, bb: 2, room: null, host: false, me: null, G: null, view: null, cards: null, err: '', peers: [], raise: null, keys: null, peerKeys: new Map(), hostPeer: null };
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function keys() {
    if (ng.keys) return ng.keys;
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    ng.keys = { kp, pub: b64(await crypto.subtle.exportKey('raw', kp.publicKey)) }; return ng.keys;
  }
  async function shared(pubB64) {
    if (ng.peerKeys.has(pubB64)) return ng.peerKeys.get(pubB64);
    const pk = await crypto.subtle.importKey('raw', unb64(pubB64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const k = await crypto.subtle.deriveKey({ name: 'ECDH', public: pk }, (await keys()).kp.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    ng.peerKeys.set(pubB64, k); return k;
  }
  async function seal(pubB64, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)), ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await shared(pubB64), new TextEncoder().encode(JSON.stringify(obj))); return [b64(iv), b64(ct)]; }
  async function open(pubB64, [iv, ct]) { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await shared(pubB64), unb64(ct)); return JSON.parse(new TextDecoder().decode(pt)); }
  const rand = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
  const peerOf = (id) => ng.peers.find((p) => p.peer === id);

  async function enter(asHost) {
    ng.err = '';
    const room = await use('room');
    if (!room) { ng.err = 'Salle en temps réel indisponible : ouvre la page publiée sur claude.ai (les amis doivent y avoir un accès Contributeur ou plus).'; return render(); }
    const code = (asHost ? Math.random().toString(36).slice(2, 7) : ng.code).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { ng.err = 'Code de table : 4 à 6 caractères.'; return render(); }
    if (!ng.nick.trim()) { ng.err = 'Choisis un pseudo.'; return render(); }
    try {
      const k = await keys();
      ng.room = await room.join('s52t-' + code); ng.code = code; ng.host = asHost; ng.phase = 'table';
      ng.room.on('state', (m) => { if (ng.host || m.peer !== ng.hostPeer || !m.data) return; ng.view = m.data; if (ng.cards && ng.cards.h !== ng.view.h) ng.cards = null; render(); });
      ng.room.on('cards', async (m) => {
        if (ng.host || m.peer !== ng.hostPeer || !m.data?.e) return;
        const mine = m.data.e[ng.me]; if (!mine) return;
        const hp = peerOf(ng.hostPeer)?.presence?.pub; if (!hp) return;
        try { ng.cards = await open(hp, mine); render(); } catch (e) { /* message d'un autre hôte */ }
      });
      ng.room.on('act', (m) => { if (ng.host && m.data) hostAct(m.peer, m.data); });
      ng.room.on('hello', (m) => { if (ng.host) hostSync(m.peer); });
      ng.room.onPeers((ch) => {
        ng.peers = ch.peers.slice(); ng.me = ng.peers.find((p) => p.isMe)?.peer || ng.me;
        const h = ng.peers.find((p) => p.presence?.host && !p.isMe); if (!ng.host) { const prev = ng.hostPeer; ng.hostPeer = h ? h.peer : null; if (h && h.peer !== prev) ng.room.emit('hello', {}).catch(() => {}); }
        if (ng.host) hostPeers(ch);
        render();
      });
      await ng.room.presence({ nick: ng.nick.trim().slice(0, 20), pub: k.pub, host: asHost || null, v: 1 });
      if (asHost) { ng.G = NG.create({ sb: ng.sb, bb: ng.bb }); setTimeout(() => { ng.me = ng.room.peers().find((p) => p.isMe)?.peer; if (ng.me) { NG.sit(ng.G, 0, ng.me, ng.nick.trim(), ng.stack); hostBroadcast(); } render(); }, 300); }
    } catch (e) { ng.err = e.message || String(e); ng.phase = 'lobby'; }
    render();
  }
  // ---- côté hôte ----
  function hostPeers(ch) {
    const G = ng.G; if (!G) return;
    for (const p of ch.joined) {
      if (p.isMe || !p.presence?.nick) continue;
      // Reconnexion : même pseudo qu'un siège resté vacant.
      const back = G.seats.findIndex((s) => s && s.away && s.name === p.presence.nick);
      if (back >= 0) { G.seats[back].id = p.peer; G.seats[back].away = false; }
      else if (!G.seats.some((s) => s && s.id === p.peer)) { let i = G.seats.findIndex((s) => !s); if (i < 0) i = G.seats.length; if (i < 9) NG.sit(G, i, p.peer, p.presence.nick, ng.stack); }
    }
    for (const p of ch.updated) { const s = G.seats.find((x) => x && x.id === p.peer); if (s && p.presence?.nick) s.name = String(p.presence.nick).slice(0, 20); }
    for (const p of ch.left) { const i = G.seats.findIndex((s) => s && s.id === p.peer); if (i >= 0) { G.seats[i].away = true; if (!G.done && G.toAct === i) { try { NG.act(G, i, 'fold'); } catch (e) { /* déjà fini */ } } } }
    hostBroadcast(true);
  }
  async function hostBroadcast(withCards) {
    const G = ng.G; if (!G || !ng.room) return;
    const pv = NG.publicView(G); pv.s = pv.s.map((s, i) => (s && G.seats[i].away ? [...s, 1] : s));
    ng.view = pv; ng.cards = !G.done || G.show ? (G.seats.find((s) => s && s.id === ng.me)?.cards?.length ? { h: G.handNo, c: G.seats.find((s) => s && s.id === ng.me).cards } : null) : ng.cards;
    try { await ng.room.emit('state', pv); } catch (e) { ng.err = e.message; }
    if (withCards && G.handNo) await sendCards();
    render();
  }
  async function sendCards(only) {
    const G = ng.G, e = {};
    for (const s of G.seats) {
      if (!s || !s.cards.length || s.id === ng.me || (only && s.id !== only)) continue;
      const pub = peerOf(s.id)?.presence?.pub; if (!pub) continue;
      e[s.id] = await seal(pub, { h: G.handNo, c: s.cards });
    }
    if (Object.keys(e).length) try { await ng.room.emit('cards', { h: G.handNo, e }); } catch (er) { ng.err = er.message; }
  }
  function hostSync(peer) { hostBroadcast(false); if (ng.G?.handNo) sendCards(peer); }
  function hostAct(peer, d) {
    const G = ng.G; if (!G || G.done) return;
    const i = G.seats.findIndex((s) => s && s.id === peer);
    if (i < 0 || i !== G.toAct || d.h !== G.handNo || d.q !== G.seq) return;
    try { NG.act(G, i, d.t, d.to); } catch (e) { return; }
    hostBroadcast(false);
  }
  // ---- actions locales ----
  function myAct(type, to) {
    const v = ng.view; if (!v || v.d) return;
    if (ng.host) { const G = ng.G, i = G.seats.findIndex((s) => s && s.id === ng.me); if (i !== G.toAct) return; try { NG.act(G, i, type, to); } catch (e) { ng.err = e.message; } hostBroadcast(false); return; }
    ng.room.emit('act', { h: v.h, q: v.q, t: type, to }).catch((e) => { ng.err = e.message; render(); });
  }
  ACT.ngcreate = () => enter(true);
  ACT.ngjoin = () => enter(false);
  ACT.ngdeal = () => { const G = ng.G; if (!G) return; try { NG.startHand(G, rand); ng.raise = null; } catch (e) { ng.err = e.message; } hostBroadcast(true); };
  ACT.ngfold = () => myAct('fold'); ACT.ngcall = () => { const L = legalMine(); myAct(L && L.canCheck ? 'check' : 'call'); };
  ACT.ngraise = (t) => myAct('raise', +(t.dataset.to || $('#ngrto')?.value || 0));
  ACT.ngrebuy = (t) => { const G = ng.G, s = G?.seats[+t.dataset.i]; if (!s || !G.done) return; s.stack = Math.round((s.stack + ng.stack) * 100) / 100; hostBroadcast(false); };
  ACT.ngkick = (t) => { const G = ng.G; if (!G || !G.done) return; NG.leave(G, +t.dataset.i); hostBroadcast(false); };
  ACT.ngleave = async () => { try { await ng.room?.leave(); } catch (e) { /* déjà parti */ } Object.assign(ng, { phase: 'lobby', room: null, host: false, G: null, view: null, cards: null, hostPeer: null, peers: [] }); render(); };
  ONCHANGE.push((t) => { if (t.dataset.ngf) { const k = t.dataset.ngf; ng[k] = ['stack', 'sb', 'bb'].includes(k) ? Math.max(0.01, +String(t.value).replace(',', '.') || 0) : t.value; render(); return true; } });
  function legalMine() {
    const v = ng.view; if (!v || v.d || v.ta < 0) return null; const s = v.s[v.ta]; if (!s || s[0] !== ng.me) return null;
    const [, , stack, put] = s, toCall = Math.min(v.cur - put, stack), maxTo = put + stack;
    return { toCall, canCheck: toCall <= 1e-9, minTo: Math.min(v.cur + v.mr, maxTo), maxTo, canRaise: maxTo > v.cur + 1e-9, pot: v.pot };
  }
  function tableHTML() {
    const v = ng.view, L = legalMine(), seats = v ? v.s : [];
    const seatHTML = (s, i) => {
      if (!s) return '';
      const [id, name, stack, put, inHand, allin, , away] = s, me = id === ng.me, show = v.sh?.find((x) => x.i === i);
      const cards = show ? show.cards.map((c) => cardHTML(c, true)).join('') : me && ng.cards && ng.cards.h === v.h && inHand ? ng.cards.c.map((c) => cardHTML(c, true)).join('') : inHand && !v.d ? backHTML(true).repeat(2) : '';
      return `<div class="stat${v.ta === i ? ' hero' : ''}"${inHand || v.d ? '' : ' style="opacity:.5"'}><span>${esc(name)}${me ? ' (toi)' : ''}${v.btn === i ? ' · D' : ''}${away ? ' · absent' : ''}</span><b>${fr(stack, stack % 1 ? 2 : 0)}</b><span>${put > 0 ? `mise ${fr(put, put % 1 ? 2 : 0)}` : allin ? 'tapis' : '&nbsp;'}${v.r && v.r[i] ? ` · ${v.r[i] > 0 ? '+' : '−'}${fr(Math.abs(v.r[i]), 1)}` : ''}</span><div class="cards">${cards}</div>${show ? `<span class="note">${esc(show.cat)}</span>` : ''}${ng.host && v.d ? `<span class="row" style="gap:4px">${stack <= 0 ? `<button class="btn small" data-act="ngrebuy" data-i="${i}">Recave</button>` : ''}${!me ? `<button class="btn small" data-act="ngkick" data-i="${i}">Retirer</button>` : ''}</span>` : ''}</div>`;
    };
    const act = L ? `<section class="panel"><span class="eyebrow">À toi</span><div class="row actrow"><button class="btn" data-act="ngfold"${L.canCheck ? ' disabled' : ''}>Se coucher</button><button class="btn" data-act="ngcall">${L.canCheck ? 'Checker' : `Suivre ${fr(L.toCall, L.toCall % 1 ? 2 : 0)}`}</button>
        ${L.canRaise ? [0.5, 1].map((f) => { const to = Math.min(L.maxTo, Math.max(L.minTo, Math.round(v.cur + f * (v.pot + L.toCall)))); return `<button class="btn" data-act="ngraise" data-to="${to}">${f === 1 ? 'Pot' : '½ pot'} (${fr(to, 0)})</button>`; }).join('') + `<button class="btn" data-act="ngraise" data-to="${L.maxTo}">Tapis</button><input id="ngrto" type="number" min="${L.minTo}" max="${L.maxTo}" step="1" value="${Math.round(L.minTo)}" style="width:6em" aria-label="Montant de la relance"><button class="btn primary" data-act="ngraise">${v.cur > 0 ? 'Relancer' : 'Miser'}</button>` : ''}</div></section>` : '';
    const seated = seats.filter(Boolean).length, canDeal = ng.host && (!v || v.d) && seats.filter((s) => s && s[2] > 0 && !s[7]).length >= 2;
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Table ${esc(ng.code)} · jetons sans valeur</span><h2>${v ? (v.h ? `Main ${v.h}` : 'En attente des joueurs') : 'Connexion…'}</h2></div><span class="row">${canDeal ? '<button class="btn primary" data-act="ngdeal">Distribuer</button>' : ''}<button class="btn small" data-act="ngleave">Quitter</button></span></div>
        <p class="note">${ng.host ? `Tu es l'hôte : donne le code <strong class="mono">${esc(ng.code)}</strong> à tes amis. Blindes ${fr(ng.sb, 2)}/${fr(ng.bb, 2)}, tapis de départ ${fr(ng.stack, 0)}.` : ng.hostPeer ? 'Connecté à l\'hôte.' : 'L\'hôte n\'est pas (ou plus) connecté.'} ${seated} joueur${seated > 1 ? 's' : ''} assis.</p>
        ${v ? `<div class="felt" style="display:grid;gap:10px;justify-items:center;padding:14px;border-radius:14px"><div class="cards">${v.b.map((c) => cardHTML(c)).join('') || '<span class="note" style="color:#fff">préflop</span>'}</div><span class="pot" style="font:700 15px var(--f-display)">Pot ${fr(v.pot, v.pot % 1 ? 2 : 0)}</span></div>
        <div class="stats" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${seats.map(seatHTML).join('')}</div>
        <div class="note mono">${(v.lg || []).map(esc).join(' · ')}</div>` : ''}</section>${act}${ng.err ? `<p class="pill bad" style="white-space:normal">${esc(ng.err)}</p>` : ''}`;
  }
  function lobbyHTML() {
    return `<section class="panel"><span class="eyebrow">Parties en ligne entre amis</span><h2>Une table privée, en jetons sans valeur</h2>
      <p>Pour jouer à distance avec tes amis : aucune mise d'argent, aucun lien avec une room. Chaque joueur ouvre cette page (partagée en accès Contributeur ou plus) et entre le même code.</p>
      <div class="form"><label class="f">Pseudo<input data-ngf="nick" value="${esc(ng.nick)}" maxlength="20" autocomplete="nickname"></label><label class="f">Code de table (pour rejoindre)<input data-ngf="code" value="${esc(ng.code)}" maxlength="6" spellcheck="false" autocomplete="off" placeholder="K7Q2M"></label>
        <label class="f">Tapis de départ (hôte)<input data-ngf="stack" inputmode="decimal" value="${ng.stack}"></label><label class="f">Petite / grosse blinde (hôte)<span class="row" style="gap:6px"><input data-ngf="sb" inputmode="decimal" value="${ng.sb}" style="width:5em" aria-label="Petite blinde"><input data-ngf="bb" inputmode="decimal" value="${ng.bb}" style="width:5em" aria-label="Grosse blinde"></span></label></div>
      <div class="row"><button class="btn primary" data-act="ngcreate">Créer une table</button><button class="btn" data-act="ngjoin">Rejoindre avec le code</button></div>
      ${ng.err ? `<p class="pill bad" style="white-space:normal">${esc(ng.err)}</p>` : ''}
      <p class="note">Comment c'est fait : l'appareil de l'hôte bat les cartes et arbitre ; chaque joueur reçoit ses deux cartes chiffrées pour lui seul (clé échangée à la connexion). L'appareil de l'hôte connaît donc tout le paquet : pour une partie sans soupçon, l'hôte peut être un appareil qui ne joue pas. Si l'hôte quitte la page, la partie s'arrête.</p></section>`;
  }

  // ---------------- Étude en direct : une salle, un animateur, le même spot pour tous, votes cachés puis révélés ----------------
  const ld = { phase: 'lobby', code: '', nick: '', room: null, host: false, peers: [], spot: null, votes: {}, mine: null, reveal: false, log: [], err: '', note: '', solver: null };
  const ldPeer = (id) => ld.peers.find((p) => p.peer === id);
  const ldName = (id) => ldPeer(id)?.presence?.nick || 'Anonyme';
  const ldEmit = (data) => ld.room?.emit('study', data).catch((e) => { ld.err = e.message; render(); });
  function ldSpot(type, seed) { const g = window.Spots?.GEN[type]; return g ? g(E.rng(seed)) : null; }
  async function ldEnter(asHost) {
    ld.err = '';
    const room = await use('room');
    if (!room) { ld.err = 'Salle en temps réel indisponible : ouvre la page publiée sur claude.ai (les amis doivent y avoir un accès Contributeur ou plus).'; return render(); }
    const code = (asHost ? Math.random().toString(36).slice(2, 7) : ld.code).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { ld.err = 'Code de salle : 4 à 6 caractères.'; return render(); }
    if (!ld.nick.trim()) { ld.err = 'Choisis un pseudo.'; return render(); }
    try {
      ld.room = await room.join('s52s-' + code); ld.code = code; ld.host = asHost; ld.phase = 'room';
      ld.room.on('study', (m) => {
        const d = m.data || {}, fromHost = ldPeer(m.peer)?.presence?.host;
        if (d.t === 'quiz' && fromHost) { ld.spot = { id: d.id, type: d.type, seed: d.seed, s: ldSpot(d.type, d.seed) }; ld.votes = {}; ld.mine = null; ld.reveal = false; ld.solver = null; }
        else if (d.t === 'solver' && fromHost) { ld.solver = d; ld.spot = null; }
        else if (d.t === 'vote' && ld.spot && d.id === ld.spot.id && Number.isInteger(d.a)) ld.votes[m.peer] = d.a;
        else if (d.t === 'reveal' && fromHost && ld.spot && d.id === ld.spot.id) ld.reveal = true;
        else if (d.t === 'note' && typeof d.txt === 'string') { ld.log.push({ who: ldName(m.peer), txt: d.txt.slice(0, 200) }); if (ld.log.length > 40) ld.log.shift(); }
        else if (d.t === 'hello' && ld.host) ldSync();
        render();
      });
      ld.room.onPeers((ch) => { ld.peers = ch?.peers || ld.room.peers(); render(); });
      await ld.room.presence({ nick: ld.nick.trim().slice(0, 20), host: asHost || null });
      ld.peers = ld.room.peers();
      if (!asHost) setTimeout(() => ldEmit({ t: 'hello' }), 400);
    } catch (e) { ld.err = e.message; ld.phase = 'lobby'; ld.room = null; }
    render();
  }
  function ldSync() { if (ld.spot) ldEmit({ t: 'quiz', id: ld.spot.id, type: ld.spot.type, seed: ld.spot.seed }); else if (ld.solver) ldEmit(ld.solver); }
  ACT.ldcreate = () => ldEnter(true);
  ACT.ldjoin = () => ldEnter(false);
  ACT.ldleave = async () => { try { await ld.room?.leave(); } catch (e) { /* déjà parti */ } Object.assign(ld, { phase: 'lobby', room: null, host: false, peers: [], spot: null, votes: {}, mine: null, reveal: false, solver: null }); render(); };
  ACT.ldquiz = (t) => {
    const type = t.dataset.v === 'mix' ? Object.keys(window.Spots.GEN)[(Math.random() * Object.keys(window.Spots.GEN).length) | 0] : t.dataset.v, seed = (Math.random() * 1e9) | 0, id = Date.now().toString(36);
    ld.spot = { id, type, seed, s: ldSpot(type, seed) }; ld.votes = {}; ld.mine = null; ld.reveal = false; ld.solver = null; ldEmit({ t: 'quiz', id, type, seed }); render();
  };
  ACT.ldvote = (t) => { if (!ld.spot || ld.mine !== null) return; ld.mine = +t.dataset.i; const me = ld.room.peers().find((p) => p.isMe)?.peer; if (me) ld.votes[me] = ld.mine; ldEmit({ t: 'vote', id: ld.spot.id, a: ld.mine }); render(); };
  ACT.ldreveal = () => { if (!ld.spot) return; ld.reveal = true; ldEmit({ t: 'reveal', id: ld.spot.id }); render(); };
  ACT.ldsolver = () => {
    const sv = X.solverState; if (!sv || !sv.board) { ld.err = 'Prépare d\'abord un spot dans le Solveur.'; return render(); }
    const d = { t: 'solver', board: sv.board, names: sv.names.slice(), ranges: sv.r.slice(), pot: sv.pot, stack: sv.stack, note: (sv.note || '').slice(0, 200) };
    if (JSON.stringify(d).length > 3800) { ld.err = 'Ranges trop longues pour la salle (4 Ko par message) : simplifie-les.'; return render(); }
    ld.solver = d; ld.spot = null; ldEmit(d); render();
  };
  ACT.ldopen = () => { const d = ld.solver; if (d) X.solverLoad({ board: d.board, names: d.names, ranges: d.ranges, pot: d.pot, stack: d.stack, note: 'Spot partagé en étude en direct' + (d.note ? ' : ' + d.note : '') + '. Lance la résolution.' }); };
  ACT.ldnote = () => { const txt = ld.note.trim().slice(0, 200); if (!txt) return; ld.log.push({ who: ld.nick.trim() || 'Moi', txt }); if (ld.log.length > 40) ld.log.shift(); ld.note = ''; ldEmit({ t: 'note', txt }); render(); };
  ONCHANGE.push((t) => { if (t.dataset.ldf) { ld[t.dataset.ldf] = t.value; return true; } });
  ONINPUT.push((t) => { if (t.dataset.ldf) { ld[t.dataset.ldf] = t.value; return true; } });
  function liveStudyHTML() {
    if (ld.phase !== 'room') return `<section class="panel"><span class="eyebrow">Étude en direct</span><h2>Étudier ensemble, en même temps</h2>
      <p>Un animateur choisit un spot ; chacun répond sans voir les autres ; l'animateur révèle les votes et la correction. Il peut aussi partager le spot de son solveur : chacun l'ouvre dans le sien. Rien n'est enregistré, rien ne touche une room ni l'argent : à faire hors de toute session de jeu.</p>
      <div class="form"><label class="f">Pseudo<input data-ldf="nick" value="${esc(ld.nick)}" maxlength="20" autocomplete="nickname"></label><label class="f">Code de salle (pour rejoindre)<input data-ldf="code" value="${esc(ld.code)}" maxlength="6" spellcheck="false" autocomplete="off" placeholder="K7Q2M"></label></div>
      <div class="row"><button class="btn primary" data-act="ldcreate">Animer une salle</button><button class="btn" data-act="ldjoin">Rejoindre avec le code</button></div>
      ${ld.err ? `<div class="advice"><div class="bad">${esc(ld.err)}</div></div>` : ''}</section>`;
    const who = ld.peers.map((p) => `${esc(p.presence?.nick || 'Anonyme')}${p.presence?.host ? ' (animateur)' : ''}${p.isMe ? ' · toi' : ''}`).join(' · ');
    const host = ld.host ? `<div class="row"><span class="note">Nouveau spot :</span>${[['mix', 'Au hasard'], ['rfi', 'Ouverture'], ['vsopen', 'Face à une ouverture'], ['odds', 'Cotes'], ['mdf', 'MDF'], ['profils', 'Profils'], ['pushfold', 'Push-fold']].filter(([k]) => k === 'mix' || window.Spots?.GEN[k]).map(([k, l]) => `<button class="chip" data-act="ldquiz" data-v="${k}">${l}</button>`).join('')}<button class="btn small" data-act="ldsolver">Partager mon spot du Solveur</button></div>` : '';
    let main = '<p class="note">En attente du premier spot de l\'animateur.</p>';
    if (ld.spot && ld.spot.s) {
      const s = ld.spot.s, n = Object.keys(ld.votes).length, cnt = s.opts.map((_, i) => Object.values(ld.votes).filter((v) => v === i).length);
      main = `<p class="note">${esc(s.title)}</p><p style="font-size:17px">${s.prompt}</p>${s.cards ? `<div class="cards">${s.cards.map((c) => cardHTML(c, true)).join('')}</div>` : ''}${s.board ? `<div class="cards">${s.board.map((c) => cardHTML(c, true)).join('')}</div>` : ''}
        <div class="opts">${s.opts.map((o, i) => `<button class="opt${ld.reveal && i === s.ok ? ' ok' : ''}${ld.mine === i ? ' sel' : ''}" data-act="ldvote" data-i="${i}" ${ld.mine !== null ? 'disabled' : ''}>${esc(o)}${ld.reveal ? ` · ${cnt[i]} vote${cnt[i] > 1 ? 's' : ''}` : ''}</button>`).join('')}</div>
        <p class="note">${n} réponse${n > 1 ? 's' : ''} sur ${ld.peers.length} participant${ld.peers.length > 1 ? 's' : ''}.${ld.mine !== null && !ld.reveal ? ' Ta réponse est envoyée ; attends la révélation.' : ''}</p>
        ${ld.reveal ? `<div class="verdict ${ld.mine === s.ok ? 'good' : 'bad'}"><b>Réponse : ${esc(s.opts[s.ok])}.</b><span>${esc(s.why)}</span></div>` : ld.host ? '<div class="row"><button class="btn primary" data-act="ldreveal">Révéler les votes et la correction</button></div>' : ''}`;
    } else if (ld.solver) {
      const d = ld.solver;
      main = `<p>Spot du Solveur partagé : board <strong class="mono">${esc(d.board)}</strong>, ${esc(d.names.join(' contre '))}, pot ${fr(d.pot, 1)} bb, tapis ${fr(d.stack, 1)} bb.</p><div class="row"><button class="btn primary" data-act="ldopen">Ouvrir dans mon Solveur</button></div><p class="note">Chacun résout sur son appareil ; discutez des fréquences dans les notes ci-dessous.</p>`;
    }
    return `<section class="panel"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Salle ${esc(ld.code)}${ld.host ? ' · tu animes' : ''}</span><h2>Étude en direct</h2></div><button class="btn small" data-act="ldleave">Quitter</button></div>
      <p class="note">${ld.host ? `Donne le code <strong class="mono">${esc(ld.code)}</strong> à tes amis. ` : ''}Présents : ${who || '…'}</p>${host}${main}</section>
      <section class="panel"><span class="eyebrow">Notes de la salle</span>${ld.log.length ? `<div class="note" style="display:grid;gap:4px">${ld.log.slice(-15).map((x) => `<span><strong>${esc(x.who)}</strong> : ${esc(x.txt)}</span>`).join('')}</div>` : '<p class="note">Aucune note. Elles ne sont pas enregistrées : elles disparaissent en quittant.</p>'}
        <div class="row"><input data-ldf="note" value="${esc(ld.note)}" maxlength="200" placeholder="Une remarque sur le spot" style="flex:1;min-width:0" aria-label="Note"><button class="btn small" data-act="ldnote">Envoyer</button></div>
        ${ld.err ? `<div class="advice"><div class="bad">${esc(ld.err)}</div></div>` : ''}</section>`;
  }

  // ---------------- Vue ----------------
  let sub = 'jeu';
  VIEWS.amis = () => {
    initShared();
    if (SH.db && SH.uid && state.progress.sharePub && !SH.autoPub) { SH.autoPub = true; publish(); }
    const tabs = `<div class="subtabs" role="tablist">${[['jeu', 'Partie en ligne'], ['direct', 'Étude en direct'], ['ligue', 'Classement et ligue'], ['groupe', 'Groupe d\'étude']].map(([k, l]) => `<button class="chip" aria-pressed="${sub === k}" data-act="amsub" data-s="${k}">${l}</button>`).join('')}</div>`;
    const sharedOk = SH.db && SH.uid;
    const body = sub === 'jeu' ? (ng.phase === 'table' ? tableHTML() : lobbyHTML()) : sub === 'direct' ? liveStudyHTML() : !SH.tried ? '<p class="note">Connexion…</p>' : !sharedOk ? offline() : sub === 'ligue' ? boardHTML() : studyHTML();
    return head('Entre amis', 'Jouer ensemble à distance en jetons sans valeur, se comparer, étudier des mains à plusieurs. Rien ici ne touche à l\'argent ni à une room.') + tabs + body + (SH.err ? `<p class="note" style="color:var(--bad)">${esc(SH.err)}</p>` : '');
  };
  ACT.amsub = (t) => { sub = t.dataset.s; render(); };
})();
