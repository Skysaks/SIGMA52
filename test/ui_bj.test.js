// Test navigateur de l'espace Blackjack : NODE_PATH=$(npm root -g) node test/ui_bj.test.js — 1280 px clair et 390 px sombre.
// Parcourt les 8 onglets, joue des décisions dans l'Entraîneur, les exercices de comptage, des mains à la Table,
// une simulation de bankroll courte, le journal, et vérifie l'absence d'erreur et de débordement horizontal.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : '/usr/bin/google-chrome' }).catch(() => chromium.launch());
  const errs = [], shots = process.env.SHOTS;
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme });
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text()) && errs.push(name + ' console ' + m.text()));
    await p.goto('file://' + path.resolve(__dirname, '../sigma52.html')); await p.waitForTimeout(400);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const shot = async (t) => { if (shots) await p.screenshot({ path: path.join(shots, `${name}-${t}.png`), fullPage: false }); };
    const go = async (t) => { await p.evaluate((x) => window.__S52.go(x), t); await p.waitForTimeout(120); };
    // Espace présent dans la navigation.
    if (!(await p.locator('[data-group=blackjack]').count())) errs.push(name + ' espace Blackjack absent');
    for (const t of ['bj', 'bjcours', 'bjstrat', 'bjentr', 'bjcompte', 'bjsys', 'bjtable', 'bjbank', 'bjsim', 'bjadv', 'bjmaths', 'bjjournal']) {
      await go(t); const h = await p.locator('#view h1').first().textContent().catch(() => '');
      if (!h) errs.push(name + ' ' + t + ' sans titre'); await over(t); await shot(t);
    }
    // Cours : chaque module s'ouvre et son contenu calculé s'affiche.
    await go('bjcours');
    const mods = await p.evaluate(() => window.BJCourse.MODULES.map((m) => m.id));
    for (const id of mods) {
      await p.evaluate((x) => { const b = document.createElement('button'); b.dataset.act = 'bjmod'; b.dataset.id = x; document.body.append(b); b.click(); b.remove(); }, id);
      await p.waitForTimeout(40);
      const txt = await p.locator('#view').innerText();
      if (/Contenu indisponible|undefined|NaN/.test(txt)) errs.push(name + ' module ' + id + ' : contenu cassé');
      await over('module ' + id);
    }
    await p.click('[data-act=bjq][data-q="0"][data-i="0"]'); await p.waitForTimeout(50);
    // Stratégie : case, true count, règles personnalisées (2 jeux, rapide).
    await go('bjstrat');
    await p.click('td[data-k="h16|10"]'); await p.waitForTimeout(60);
    if (!(await p.locator('text=Case choisie').count())) errs.push(name + ' détail de case absent');
    await p.selectOption('[data-bjstc]', '4'); await p.waitForTimeout(80);
    if (!(await p.locator('td.bjc', { hasText: '*' }).count())) errs.push(name + ' aucune déviation affichée à TC +4');
    await p.selectOption('[data-bjstc]', ''); await shot('strat-detail');
    if (name === 'desk') {
      await p.click('[data-act=bjcust]'); await p.waitForTimeout(60);
      await p.selectOption('[data-bjr=decks]', '1'); await p.selectOption('[data-bjr=peek]', 'peek'); await p.waitForTimeout(40);
      await p.click('[data-act=bjcalc]');
      await p.waitForSelector('[data-act=bjrk][data-k=custom][aria-pressed=true]', { timeout: 120000 }).catch(() => errs.push('calcul personnalisé non terminé'));
      const edge = await p.evaluate(() => window.__S52.state.progress.bj.custom?.edge);
      if (!(edge < 0.005 && edge > -0.01)) errs.push('avantage 1 jeu personnalisé incohérent : ' + edge);
      await p.click('[data-act=bjrk][data-k=europe]'); await p.waitForTimeout(60);
    }
    // Entraîneur : 40 décisions au clavier (réponse juste = celle du moteur ; puis une fausse).
    await go('bjentr');
    for (const m of ['weak', 'dev', 'block', 'all']) {
      await p.click(`[data-act=bjmode][data-m=${m}]`); await p.waitForTimeout(40);
      for (let i = 0; i < 10; i++) {
        const btn = p.locator('[data-act=bjans]:not([disabled]), [data-act=bjins]').first();
        if (!(await btn.count())) { errs.push(name + ' entraîneur ' + m + ' sans bouton'); break; }
        await btn.click(); await p.waitForTimeout(30);
        if (!(await p.locator('.verdict').count())) errs.push(name + ' entraîneur sans verdict');
        await p.keyboard.press('Enter'); await p.waitForTimeout(30);
      }
    }
    await over('entraineur'); await shot('entr');
    const st = await p.evaluate(() => { const b = window.__S52.state.progress.bj; return { n: b.hist.length, rev: b.review.length }; });
    if (st.n < 10) errs.push(name + ' décisions non enregistrées ' + st.n);
    // Comptage : paquet chrono complet, conversion TC, bac, rampe.
    await go('bjcompte');
    await p.click('[data-act=bjdrill][data-d=deck]'); await p.click('[data-act=bjcd]');
    for (let i = 0; i < 51; i++) await p.keyboard.press('Space');
    const rc = await p.evaluate(() => { const X = window.__S52.BJAPP.cd; return X.cards.slice(0, 51).reduce((a, c) => a + window.BJ.HILO[window.__S52.BJAPP.val(c)], 0); });
    await p.click(`[data-act=bjlast][data-v="${-rc}"]`); await p.waitForTimeout(40);
    if (!(await p.locator('.verdict.good').count())) errs.push(name + ' paquet chrono : bonne réponse refusée');
    for (const d of ['tc', 'tray', 'ramp']) {
      await p.click(`[data-act=bjdrill][data-d=${d}]`); await p.click('[data-act=bjcd]'); await p.waitForTimeout(30);
      if (d === 'tc') { const a = await p.evaluate(() => window.__S52.BJAPP.cd.q.ans); await p.fill('#bjtcf input', String(a)); await p.press('#bjtcf input', 'Enter'); }
      if (d === 'tray') { const a = await p.evaluate(() => window.__S52.BJAPP.cd.q.left); await p.click(`[data-act=bjtray][data-v="${a}"]`); }
      if (d === 'ramp') { const a = await p.evaluate(() => window.__S52.BJAPP.cd.q.ans); await p.click(`[data-act=bjramp][data-v="${a}"]`); }
      await p.waitForTimeout(40);
      if (!(await p.locator('.verdict.good').count())) errs.push(name + ' exercice ' + d + ' : bonne réponse refusée');
    }
    await p.click('[data-act=bjdrill][data-d=round]'); await p.click('[data-act=bjcd]'); await shot('round');
    await over('comptage');
    // Table : 25 mains en jouant la décision recommandée, en répondant juste aux contrôles de compte.
    await go('bjtable');
    for (let h = 0; h < 25; h++) {
      for (let guard = 0; guard < 20; guard++) {
        const ph = await p.evaluate(() => { const t = window.__S52.BJAPP.getTbl(); return t.ask ? 'ask' : t.phase; });
        if (ph === 'ask') { const rc2 = await p.evaluate(() => window.__S52.BJAPP.getTbl().rc); await p.fill('#bjtrc input', String(rc2)); await p.press('#bjtrc input', 'Enter'); continue; }
        if (ph === 'bet' || ph === 'done') { if (guard) break; await p.keyboard.press('Enter'); continue; }
        if (ph === 'ins') { const take = await p.evaluate(() => { const A = window.__S52.BJAPP, t = A.getTbl(); return t.bal && A.tcOf(t) >= t.G.insurance.index; }); await p.click(`[data-act=bjtins][data-v="${take ? 1 : 0}"]`); continue; }
        if (ph === 'play') { const a = await p.evaluate(() => { const A = window.__S52.BJAPP, t = A.getTbl(); const h2 = t.hands[t.cur], av = A.availFor(t, h2); const row = A.rowOf(h2.cards, av.split); const G = t.G, up = A.val(t.dealer[0]); if (row === 'soft12' || !G.table[row]) return 'hit'; return A.recommend(G, row, up, av, Math.trunc(t.rc / Math.max(0.5, (t.shoe.length - t.pos) / 52))); }); await p.click(`[data-act=bjtact][data-a=${a}]`); continue; }
        break;
      }
    }
    await over('table'); await shot('table');
    if (!(await p.locator('text=Erreurs par type').count())) errs.push(name + ' table : bilan par type absent');
    if (!(await p.locator('text=Visibilité de ta rampe').count())) errs.push(name + ' table : visibilité absente');
    const ts = await p.evaluate(() => window.__S52.BJAPP.getTbl().sess);
    if (ts.hands < 20) errs.push(name + ' table : ' + ts.hands + ' mains seulement');
    if (ts.err) errs.push(name + ' table : ' + ts.err + ' erreurs en jouant la recommandation');
    if (ts.cnt && ts.cntOk !== ts.cnt) errs.push(name + ' table : contrôle de compte faux');
    // Systèmes : choisir Zen, valeurs, paquet chrono et table avec Zen ; puis Maths.
    await go('bjsys');
    await p.click('[data-act=bjsetsys][data-s=zen]'); await p.waitForTimeout(60);
    if ((await p.evaluate(() => window.__S52.state.progress.bj.sys)) !== 'zen') errs.push(name + ' choix du système Zen');
    await over('systemes'); await shot('systemes');
    await go('bjcompte');
    await p.click('[data-act=bjdrill][data-d=tags]'); await p.click('[data-act=bjcd]');
    for (let i = 0; i < 15; i++) { const a = await p.evaluate(() => window.__S52.BJAPP.cd.q.ans); await p.click(`[data-act=bjtag][data-v="${a}"]`); await p.waitForTimeout(15); }
    if ((await p.evaluate(() => window.__S52.BJAPP.cd.tg.streak)) < 15) errs.push(name + ' valeurs Zen : série cassée');
    await p.click('[data-act=bjdrill][data-d=deck]'); await p.click('[data-act=bjcd]');
    for (let i = 0; i < 51; i++) await p.keyboard.press('Space');
    const lz = await p.evaluate(() => { const A = window.__S52.BJAPP; return A.tagOf(A.sysOf(), A.cd.cards[51]); });
    await p.click(`[data-act=bjlast][data-v="${lz}"]`); await p.waitForTimeout(40);
    if (!(await p.locator('.verdict.good').count())) errs.push(name + ' paquet chrono Zen refusé');
    await go('bjtable'); await p.click('[data-act=bjspots][data-v="2"]').catch(() => p.evaluate(() => { window.__S52.BJAPP.getTbl().spots = 2; }));
    let saw2 = false;
    for (let h = 0; h < 12; h++) {
      saw2 = saw2 || (await p.evaluate(() => window.__S52.BJAPP.getTbl().hands.some((x) => x.spot === 1)));
      for (let guard = 0; guard < 20; guard++) {
        const ph = await p.evaluate(() => { const t = window.__S52.BJAPP.getTbl(); return t.ask ? 'ask' : t.phase; });
        if (ph === 'ask') { const rc2 = await p.evaluate(() => window.__S52.BJAPP.getTbl().rc); await p.fill('#bjtrc input', String(rc2)); await p.press('#bjtrc input', 'Enter'); continue; }
        if (ph === 'bet' || ph === 'done') { if (guard) break; await p.keyboard.press('Enter'); continue; }
        if (ph === 'ins') { const take = await p.evaluate(() => { const A = window.__S52.BJAPP, t = A.getTbl(); return t.bal && A.tcOf(t) >= t.G.insurance.index; }); await p.click(`[data-act=bjtins][data-v="${take ? 1 : 0}"]`); continue; }
        if (ph === 'play') { const a = await p.evaluate(() => { const A = window.__S52.BJAPP, t = A.getTbl(); const h2 = t.hands[t.cur], av = A.availFor(t, h2); const row = A.rowOf(h2.cards, av.split); const up = A.val(t.dealer[0]); if (row === 'soft12' || !t.G.table[row]) return 'hit'; return A.recommend(t.G, row, up, av, A.tcOf(t)); }); await p.click(`[data-act=bjtact][data-a=${a}]`); continue; }
        break;
      }
    }
    const zs = await p.evaluate(() => window.__S52.BJAPP.getTbl().sess);
    if (zs.err) errs.push(name + ' table Zen : ' + zs.err + ' erreurs en jouant la recommandation');
    if (!saw2) errs.push(name + ' table : deuxième main jamais distribuée');
    await over('table 2 mains'); await shot('table2');
    // Techniques : étude de suivi, partie de coupe, calculateur d'équipe.
    await go('bjadv'); await p.click('[data-act=bjtrkstudy]'); await p.waitForTimeout(200);
    const tr = await p.evaluate(() => window.__S52.BJAPP.tq.res);
    if (!tr || !(tr.corr > 0.3)) errs.push(name + ' suivi de mélange : corrélation ' + (tr && tr.corr));
    await p.click('[data-act=bjtrknew]'); await p.waitForTimeout(80); await p.locator('[data-act=bjtrkpick]').first().click(); await p.waitForTimeout(60);
    if ((await p.evaluate(() => window.__S52.BJAPP.tq.score.n)) !== 1) errs.push(name + ' coupe : choix non compté');
    const tx = await p.locator('#view').innerText(); if (/NaN|undefined/.test(tx)) errs.push(name + ' techniques : valeur cassée');
    await over('techniques'); await shot('techniques');
    // Simulateur : petite simulation en travailleurs, deux mains.
    await go('bjsim'); await p.evaluate(() => { const c = window.__S52.BJAPP.sm.cfg; c.hands = 400000; c.spots = 2; });
    await p.click('[data-act=bjsmrun]');
    await p.waitForFunction(() => window.__S52.BJAPP.sm.res, null, { timeout: 180000 }).catch(() => errs.push(name + ' simulateur sans résultat'));
    const sr = await p.evaluate(() => window.__S52.BJAPP.sm.res);
    if (!sr || sr.hands < 400000) errs.push(name + ' simulateur : ' + (sr && sr.hands) + ' tours');
    const sx = await p.locator('#view').innerText(); if (/NaN|undefined/.test(sx)) errs.push(name + ' simulateur : valeur cassée');
    await over('simulateur'); await shot('simulateur');
    if (zs.cnt && zs.cntOk !== zs.cnt) errs.push(name + ' table Zen : contrôle de compte faux');
    await go('bjmaths');
    await p.click('[data-act=bjmtrand]'); await p.click('[data-act=bjmtexact]'); await p.waitForTimeout(100);
    const ex = await p.evaluate(() => document.querySelector('#view').innerText.includes('jeu optimal, composition exacte'));
    if (!ex) errs.push(name + ' maths : avantage exact absent');
    await over('maths'); await shot('maths');
    if (name === 'desk') {
      await go('bjsys'); await p.click('[data-act=bjctsim]');
      await p.waitForSelector('text=/Gain simulé :/', { timeout: 120000 }).catch(() => errs.push('compte personnalisé : simulation sans résultat'));
    }
    await p.evaluate(() => { window.__S52.state.progress.bj.sys = 'hilo'; });
    // Bankroll : simulation courte.
    await go('bjbank');
    await p.selectOption('[data-bjbank=hands]', '100000'); await p.click('[data-act=bjsim]');
    await p.waitForSelector('#bjsimc', { timeout: 120000 }).catch(() => errs.push(name + ' simulation sans résultat'));
    await p.waitForTimeout(150); await over('bank'); await shot('bank');
    const sim = await p.evaluate(() => window.__S52.state.progress.bj.lastSim);
    if (!sim || !(sim.sd > 2 && sim.sd < 6)) errs.push(name + ' simulation : écart-type incohérent ' + (sim && sim.sd));
    // Optimiseur de rampe, indices prudents, bilan de la table.
    if (await p.locator('[data-bjopt=src] option[value=ref]:not([disabled])').count()) {
      await p.selectOption('[data-bjopt=src]', 'ref'); await p.waitForTimeout(150);
      if (!(await p.locator('text=Mise optimale').count())) errs.push(name + ' optimiseur : référence sans résultat');
      await p.selectOption('[data-bjopt=two]', '1'); await p.waitForTimeout(150);
      if (!(await p.locator('text=Mise optimale').count())) errs.push(name + ' optimiseur deux mains sans résultat');
      const ot = await p.locator('#view').innerText(); if (/NaN|undefined/.test(ot)) errs.push(name + ' optimiseur : valeur cassée');
      await over('optimiseur ref'); await shot('optim-ref');
      await p.selectOption('[data-bjopt=two]', '0'); await p.selectOption('[data-bjopt=src]', 'mesure'); await p.waitForTimeout(80);
    }
    await p.click('[data-act=bjoptrun]');
    await p.waitForSelector('text=Mise optimale', { timeout: 120000 }).catch(() => errs.push(name + ' optimiseur sans résultat'));
    await p.selectOption('[data-bjopt=wong]', '1'); await p.waitForTimeout(80);
    if (!(await p.locator('text=/Ruine en 100 h/').count())) errs.push(name + ' optimiseur : ruine sur une durée absente');
    await over('optimiseur'); await shot('optim');
    await go('bjstrat'); await p.click('[data-act=bjidx][data-m=ra]'); await p.waitForTimeout(60);
    if ((await p.evaluate(() => window.__S52.BJAPP.gameS().idxMode)) !== 'ra') errs.push(name + ' indices prudents non appliqués');
    await p.click('[data-act=bjidx][data-m=ev]');
    // Journal.
    await go('bjjournal');
    await p.fill('[name=hours]', '2,5'); await p.fill('[name=result]', '−120'); await p.click('#bjjf button');
    await p.waitForTimeout(60);
    if (!(await p.locator('text=Séance enregistrée').count())) errs.push(name + ' journal : séance non enregistrée');
    await over('journal'); await shot('journal');
    await go('bj'); await shot('bj2');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('ok ui blackjack');
})();
