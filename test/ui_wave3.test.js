// Test navigateur de la vague 3 : NODE_PATH=$(npm root -g) node test/ui_wave3.test.js
// Les fonctions partagées de la page publiée (db, room, user) sont simulées : base en mémoire, salle par BroadcastChannel entre deux onglets.
const { chromium } = require('playwright');
const path = require('path');
const SHOTS = process.env.SHOTS || '';
const MOCK = (peer) => `(() => {
  const PEER = ${JSON.stringify(peer)};
  // ---- db en mémoire, partagée entre onglets par BroadcastChannel ----
  const store = {}; const subs = []; const bc = new BroadcastChannel('mockdb');
  const fire = () => subs.forEach((s) => s());
  bc.onmessage = (e) => { const m = e.data; if (m.op === 'set') store[m.path] = m.v; if (m.op === 'del') delete store[m.path]; fire(); };
  const write = (p, v) => { if (v === undefined) delete store[p]; else store[p] = v; bc.postMessage(v === undefined ? { op: 'del', path: p } : { op: 'set', path: p, v }); fire(); };
  const snapDoc = (p) => ({ id: p.split('/').pop(), exists: p in store, data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined), metadata: {} });
  const query = (col, ord, lim) => ({
    orderBy: (f, d) => query(col, [f, d], lim), limit: (n) => query(col, ord, n), where: () => query(col, ord, lim),
    get: async () => run(),
    onSnapshot(next) { const s = () => next(run()); subs.push(s); setTimeout(s, 0); return () => {}; },
  });
  function run() {
    let docs = Object.keys(store).filter((k) => k.startsWith(colName + '/') && k.split('/').length === colName.split('/').length + 1).map(snapDoc);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
  }
  let colName = '';
  const collection = (c) => { const q = query(c); const wrap = (fn) => (...a) => { colName = c; return fn(...a); };
    return { path: c, orderBy: (f, d) => { const qq = query(c, [f, d]); return { limit: (n) => ({ onSnapshot: (next) => { const s = () => { colName = c; const r = run(); r.docs.sort((x, y) => (y.data()?.[f] || 0) - (x.data()?.[f] || 0)); r.docs = r.docs.slice(0, n); next(r); }; subs.push(s); setTimeout(s, 0); return () => {}; } }) }; },
      onSnapshot: wrap((next) => { const s = () => { colName = c; next(run()); }; subs.push(s); setTimeout(s, 0); return () => {}; }),
      doc: (id) => doc(c + '/' + id), add: async (v) => { const id = Math.random().toString(36).slice(2, 10); write(c + '/' + id, v); return doc(c + '/' + id); } }; };
  const doc = (p) => ({ id: p.split('/').pop(), path: p, get: async () => snapDoc(p), set: async (v) => write(p, JSON.parse(JSON.stringify(v))), update: async (v) => write(p, { ...(store[p] || {}), ...v }), delete: async () => write(p, undefined), onSnapshot(next) { const s = () => next(snapDoc(p)); subs.push(s); setTimeout(s, 0); return () => {}; } });
  const db = { collection, doc: (p) => doc(p) };
  const user = { id: async () => 'u-' + PEER, me: async () => ({ id: 'u-' + PEER, name: PEER }), profiles: async (ids) => Object.fromEntries([].concat(ids).map((i) => [i, { id: i, name: 'Ami ' + i.slice(2) }])), isOwner: async () => true, canEdit: async () => true };
  // ---- salle temps réel ----
  const room = { async join(name) {
    const ch = new BroadcastChannel('room-' + name), H = {}, PH = [], peers = new Map(); let pres = {};
    const me = (p) => ({ peer: p, by: 'u-' + p, isMe: p === PEER, sameTab: p === PEER, kind: 'viewer', guest: false });
    const snap = () => [...peers.entries()].map(([p, pr]) => ({ ...me(p), presence: pr, updatedAt: Date.now() }));
    const fireP = (j, l, u) => { const ps = snap(); PH.forEach((h) => h({ peers: ps, joined: j.map((x) => ps.find((y) => y.peer === x)).filter(Boolean), left: l.map((x) => ({ peer: x })), updated: u.map((x) => ps.find((y) => y.peer === x)).filter(Boolean) })); };
    ch.onmessage = (e) => { const m = e.data;
      if (m.k === 'emit') (H[m.topic] || []).forEach((h) => h({ ...me(m.peer), topic: m.topic, data: m.data }));
      else if (m.k === 'pres') { const nw = !peers.has(m.peer); peers.set(m.peer, m.presence); fireP(nw ? [m.peer] : [], [], nw ? [] : [m.peer]); if (m.ask) ch.postMessage({ k: 'pres', peer: PEER, presence: pres }); }
      else if (m.k === 'leave') { peers.delete(m.peer); fireP([], [m.peer], []); } };
    peers.set(PEER, pres);
    return { name, async emit(topic, data) { ch.postMessage({ k: 'emit', topic, data, peer: PEER }); (H[topic] || []).forEach((h) => h({ ...me(PEER), topic, data })); },
      on(t, h) { (H[t] = H[t] || []).push(h); return () => {}; },
      async presence(patch) { pres = { ...pres, ...patch }; peers.set(PEER, pres); ch.postMessage({ k: 'pres', peer: PEER, presence: pres, ask: true }); fireP([], [], [PEER]); },
      peers: () => snap(), onPeers(h) { PH.push(h); setTimeout(() => fireP([...peers.keys()], [], []), 0); return () => {}; }, connected: () => true, onConnection: () => () => {}, async leave() { ch.postMessage({ k: 'leave', peer: PEER }); ch.close(); } };
  } };
  const caps = { db, user, room };
  window.claude = { use: async (n) => caps[n] || null };
})();`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errs = [];
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: scheme });
    const mk = async (peer) => { const p = await ctx.newPage(); await p.addInitScript(MOCK(peer)); p.on('pageerror', (e) => errs.push(`${name}/${peer} ${e.message}`)); p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_/.test(m.text()) && errs.push(`${name}/${peer} console ${m.text()}`)); await p.goto('file://' + path.resolve(__dirname, '../sigma52.html')); await p.waitForTimeout(300); return p; };
    const p = await mk('alice');
    const over = async (pg, t) => { const [sw, iw] = await pg.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const shot = async (pg, t) => { if (SHOTS) await pg.screenshot({ path: `${SHOTS}/w3-${name}-${t}.png`, fullPage: true }); };
    const tab = async (pg, t) => { await pg.evaluate((x) => window.__S52.go(x), t); await pg.waitForTimeout(80); };
    const has = async (pg, sel) => (await pg.locator(sel).count()) > 0;

    // #9 charts à débloquer, #11 défi du jour, spot de la semaine
    await tab(p, 'defis');
    for (let i = 0; i < 4; i++) { await p.locator('[data-act=chans]').first().click(); await p.click('[data-act=chnext]'); }
    for (let i = 0; i < 5; i++) await p.locator('[data-act=dyans]').first().click();
    if (!(await has(p, 'text=/\\d\\/5 aujourd/'))) errs.push(name + ' défi du jour : pas de score');
    await p.locator('[data-act=wkans]').first().click(); if (!(await has(p, 'text=Meilleure EV'))) errs.push(name + ' spot de la semaine');
    await over(p, 'defis'); await shot(p, 'defis');
    // #4 comparateur
    await tab(p, 'solveur'); await p.click('[data-act=svsub][data-s=preflop]'); await p.locator('[data-act=pfcmp][data-v=pos]').first().click();
    if ((await p.locator('[data-act=pfpick]').count()) < 4) errs.push(name + ' comparateur : grilles');
    await p.fill('[data-pfhl]', 'A5s'); await p.press('[data-pfhl]', 'Tab'); await over(p, 'comparateur'); await shot(p, 'comparateur');
    await p.locator('[data-act=pfcmp][data-v=depth]').first().click(); await over(p, 'comparateur-prof'); await p.locator('[data-act=pfpick]').first().click();
    // #10 et #15 : coach sur erreur, straddle, ante, bomb pot
    await tab(p, 'sim'); await p.click('[data-act=simsub][data-s=table]');
    if (await has(p, '[data-act=cashnew]')) await p.click('[data-act=cashnew]');
    if (await has(p, '[data-act=cashstop]')) { await p.click('[data-act=cashstop]'); }
    await p.click('[data-act=prepm][data-v=errors]'); await p.click('[data-act=prepx]'); await p.click('[data-act=prepa][data-v="0.1"]'); await p.click('[data-act=prepb][data-v="5"]');
    await p.click('[data-act=cashstart]'); let bomb = false;
    for (let i = 0; i < 40; i++) {
      if (await has(p, '[data-act=stoperrok]')) await p.click('[data-act=stoperrok]');
      if (await has(p, 'text=Bomb pot')) bomb = true;
      if (await has(p, '[data-act=hfold]')) await p.click('[data-act=hfold]'); else if (await has(p, '[data-act=hcall]')) await p.click('[data-act=hcall]'); else if (await has(p, '[data-act=cashnext]')) await p.click('[data-act=cashnext]'); else break;
    }
    if (!bomb) errs.push(name + ' bomb pot jamais vu'); await over(p, 'sim-live'); await shot(p, 'sim-live');
    // Mains notées en mode « seulement en cas d'erreur »
    await p.click('[data-act=simsub][data-s=practice]'); if (await has(p, '[data-act=prquiet][data-v="1"]')) await p.click('[data-act=prquiet][data-v="1"]'); else errs.push(name + ' mains notées : option erreurs');
    // #19, #21 : population et carte des fuites
    await p.evaluate(() => { const T = window.TableSim, parts = []; const tb = new T.Table({}); for (let h = 1; h <= 600; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } if (h % 300 === 0) parts.push(tb.exportHH()); } window.__S52.runAnalysis(parts.join('\n\n\n'), 'table'); window.__S52.setAnSub('leaks'); window.__S52.go('analyse'); });
    await p.waitForTimeout(200);
    if (!(await has(p, 'text=Carte de chaleur des fuites')) || !(await has(p, 'text=Analyse de population'))) errs.push(name + ' population / fuites'); await over(p, 'fuites'); await shot(p, 'fuites');
    // #25, #26 : routine et check-in après session
    await tab(p, 'mental'); await p.fill('[data-rtf=stop]', '60'); await p.press('[data-rtf=stop]', 'Tab'); await p.click('[data-act=rtstart]');
    await p.fill('[data-rtf=cur]', '-70'); await p.press('[data-rtf=cur]', 'Tab'); if (!(await has(p, 'text=Stop-loss atteint'))) errs.push(name + ' routine : stop-loss');
    await p.click('[data-act=rtbreath]'); await p.waitForTimeout(1200); await p.click('[data-act=rtbreathstop]'); await p.locator('[data-act=rtend]').first().click();
    for (const [k, v] of [['focus', 4], ['tilt', 1], ['fatigue', 3]]) await p.click(`[data-act=postset][data-k=${k}][data-v="${v}"]`);
    await p.click('[data-act=poststop][data-v="1"]'); await p.click('[data-act=postsave]'); await over(p, 'mental'); await shot(p, 'mental');
    // #29, #31 : staking et festival
    await tab(p, 'carriere'); await p.fill('[data-skf=result]', '800'); await p.press('[data-skf=result]', 'Tab'); if (!(await has(p, 'text=profit à partager'))) errs.push(name + ' staking : partage');
    await p.click('[data-act=sknew]'); await p.fill('[data-skr="0"]', '-300'); await p.press('[data-skr="0"]', 'Tab'); await p.click('[data-act=skadd][data-i="0"]');
    await p.fill('[data-fsf=nname]', 'Main Event'); await p.press('[data-fsf=nname]', 'Tab'); await p.fill('[data-fsf=nbi]', '1100'); await p.press('[data-fsf=nbi]', 'Tab'); await p.click('[data-act=fsadd]');
    await p.locator('[data-act=fscheck]').first().check(); await over(p, 'carriere'); await shot(p, 'carriere');
    // #30 : session live
    await tab(p, 'journal'); await p.click('[data-act=lsstart]'); await p.fill('[data-lsf=amt]', '200'); await p.press('[data-lsf=amt]', 'Tab'); await p.click('[data-act=lstx][data-k=buy]');
    await p.fill('[data-lsf=amt]', '10'); await p.press('[data-lsf=amt]', 'Tab'); await p.click('[data-act=lstx][data-k=tip]');
    await p.fill('[data-lsf=amt]', '340'); await p.press('[data-lsf=amt]', 'Tab'); await p.click('[data-act=lstx][data-k=out]'); await p.click('[data-act=lsend]');
    const n0 = await p.evaluate(() => window.__S52.state.journal.sessions.length); await p.click('[data-act=lssave]');
    const last = await p.evaluate(() => window.__S52.state.journal.sessions.slice(-1)[0]);
    if ((await p.evaluate(() => window.__S52.state.journal.sessions.length)) !== n0 + 1 || last.result !== 130) errs.push(name + ' session live : ' + JSON.stringify(last));
    await over(p, 'journal');
    // #33, #35 : classement partagé, groupe d'étude
    await tab(p, 'amis'); await p.click('[data-act=amsub][data-s=ligue]'); await p.waitForTimeout(150); await p.click('[data-act=shpub]'); await p.waitForTimeout(150);
    if (!(await has(p, 'td:has-text("Toi")'))) errs.push(name + ' classement : publication');
    await p.click('[data-act=amsub][data-s=groupe]'); await p.click('[data-act=stopen]'); await p.fill('[data-stf=hero]', 'AhQd'); await p.press('[data-stf=hero]', 'Tab'); await p.fill('[data-stf=board]', 'Qs7d2c'); await p.press('[data-stf=board]', 'Tab');
    await p.click('[data-act=stsend]'); await p.waitForTimeout(150); await p.locator('[data-act=stvote]').nth(1).click(); await p.waitForTimeout(300);
    if (!(await has(p, 'text=Moteur :'))) errs.push(name + ' groupe d\'étude : verdict'); await over(p, 'groupe'); await shot(p, 'groupe');
    // #17 : partie en ligne à deux onglets
    await p.click('[data-act=amsub][data-s=jeu]'); await p.fill('[data-ngf=nick]', 'Alice'); await p.press('[data-ngf=nick]', 'Tab'); await p.click('[data-act=ngcreate]'); await p.waitForTimeout(600);
    const code = await p.evaluate(() => document.querySelector('.eyebrow')?.textContent.match(/Table (\w+)/)?.[1] || [...document.querySelectorAll('strong.mono')].map((x) => x.textContent)[0]);
    const q = await mk('bob'); await tab(q, 'amis');
    await q.fill('[data-ngf=nick]', 'Bob'); await q.press('[data-ngf=nick]', 'Tab'); await q.fill('[data-ngf=code]', code || ''); await q.press('[data-ngf=code]', 'Tab'); await q.click('[data-act=ngjoin]'); await q.waitForTimeout(800);
    await p.waitForSelector('[data-act=ngdeal]', { timeout: 5000 }).catch(() => errs.push(name + ' partie en ligne : le 2e joueur ne s\'assoit pas'));
    if (await has(p, '[data-act=ngdeal]')) {
      await p.click('[data-act=ngdeal]'); await q.waitForTimeout(500);
      const myCards = await q.locator('.stat:has-text("(toi)") .cd:not(.back)').count(); if (myCards !== 2) errs.push(name + ' partie en ligne : cartes du 2e joueur ' + myCards);
      for (let k = 0; k < 12; k++) {
        const pg = (await has(p, '[data-act=ngcall]')) ? p : (await has(q, '[data-act=ngcall]')) ? q : null; if (!pg) break;
        await pg.click('[data-act=ngcall]'); await p.waitForTimeout(250);
      }
      const done = await p.evaluate(() => /remporte/.test(document.body.textContent)); if (!done) errs.push(name + ' partie en ligne : main non terminée');
      const chips = await p.evaluate(() => [...document.querySelectorAll('.stats .stat b')].map((x) => +x.textContent.replace(/\s/g, '').replace(',', '.')).reduce((a, b) => a + b, 0)); if (Math.abs(chips - 400) > 0.01) errs.push(name + ' partie en ligne : jetons ' + chips);
      await over(p, 'en-ligne'); await over(q, 'en-ligne-2'); await shot(p, 'en-ligne'); await shot(q, 'en-ligne-2');
    }
    await ctx.close();
  }
  await b.close();
  console.log(errs.length ? 'ERREURS\n' + errs.join('\n') : 'UI vague 3 ok : 0 erreur, 0 débordement');
  process.exit(errs.length ? 1 : 0);
})();
