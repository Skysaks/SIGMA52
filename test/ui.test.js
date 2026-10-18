// Test navigateur : NODE_PATH=$(npm root -g) node test/ui.test.js — bureau 1280 px clair, téléphone 390 px sombre.
const { chromium } = require('playwright');
const path = require('path');
const SHOTS = process.env.SHOTS || '';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errs = [];
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme });
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_PROXY/.test(m.text()) && errs.push(name + ' console ' + m.text()));
    await p.goto('file://' + path.resolve(__dirname, '../sigma52.html'));
    await p.waitForTimeout(300);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const shot = async (t) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-${t}.png`, fullPage: true }); };
    const tab = async (t) => { await p.click(`[data-tab=${t}]`); await p.waitForTimeout(60); };
    const has = async (sel) => (await p.locator(sel).count()) > 0;

    // Aujourd'hui + programme
    if (!(await has('text=Programme · semaine 1 sur 12'))) errs.push(name + ' programme absent');
    await p.click('[data-act=weeks]'); await over('jour'); await shot('jour');
    await p.click('[data-act=plango] >> nth=0'); await p.waitForTimeout(60); await tab('jour');

    // Spots (dont le nouveau type) + révisions
    await p.click('[data-act=daily]');
    for (let i = 0; i < 12; i++) { await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await p.click('[data-act=next]'); }
    for (const m of ['rfi', 'vsopen', 'odds', 'tirage', 'pushfold', 'outs', 'meilleure', 'situations']) { await p.click(`[data-mode=${m}]`); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await over('spots-' + m); }
    const prog = await p.evaluate(() => JSON.parse(localStorage.getItem('sigma52.progress')));
    if (prog.daily.done !== 10) errs.push(name + ' compteur du jour ' + prog.daily.done);
    await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('sigma52.progress')); pr.review.forEach((r) => (r.due = '2000-01-01')); localStorage.setItem('sigma52.progress', JSON.stringify(pr)); });
    await p.reload(); await p.waitForTimeout(300); await tab('jour'); await p.click('[data-act=review]'); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict');

    // Cours : quelques modules et leurs quiz
    await tab('cours');
    if ((await p.locator('.mod').count()) !== 35) errs.push(name + ' modules');
    for (const i of [0, 5, 20, 34]) {
      await p.locator('.mod').nth(i).click(); await over('module ' + i);
      const nq = await p.locator('[data-act=qans][data-i="0"]').count();
      for (let q = 0; q < nq; q++) await p.click(`[data-act=qans][data-q="${q}"][data-i="0"]`);
      await p.click('[data-act=closemod]');
    }

    // Simulateur : préparation, session de 25 mains avec coach en direct, bilan
    await tab('sim'); await over('sim-prep'); await shot('sim-prep');
    await p.click('[data-act=prept][data-v="25"]'); await p.click('[data-act=prepo][data-v="iso"]'); await p.click('[data-act=cashstart]');
    let coachSeen = 0, guard = 0;
    while (!(await has('text=Bilan de session')) && guard++ < 400) {
      if (await has('[data-act=hcall]')) {
        if (await has('.coach')) coachSeen++;
        if (coachSeen === 3) await shot('sim-coach');
        if (guard % 4 === 0 && (await has('[data-act=hraise]'))) await p.locator('[data-act=hraise]').first().click(); else await p.click('[data-act=hcall]');
      } else if (await has('[data-act=cashnext]')) { await over('sim-debrief'); await p.click('[data-act=cashnext]'); }
      else break;
    }
    if (!(await has('text=Bilan de session'))) errs.push(name + ' bilan de session absent');
    if (!coachSeen) errs.push(name + ' coach jamais affiché');
    await over('bilan'); await shot('sim-bilan');
    await p.click('[data-act=libtable]'); await p.click('[data-act=rptable]');
    if (!(await has('[data-act=rpgo]'))) errs.push(name + ' replayer non ouvert');
    for (let k = 0; k < 6; k++) await p.keyboard.press('ArrowRight');
    await over('replayer'); await shot('replayer');
    await p.click('[data-act=ansub][data-s=library]');
    if (!(await has('[data-act=librep]'))) errs.push(name + ' bibliothèque vide');
    await p.locator('[data-act=libtag]').first().click(); await p.locator('[data-act=libdel]').first().click(); await p.locator('[data-act=libdelok]').first().click();
    await over('bibliotheque');

    // Mains guidées : toutes, en choisissant la première option
    await tab('sim'); await p.click('[data-act=simsub][data-s=guided]');
    const ng = await p.locator('[data-act=gdopen]').count();
    if (ng !== 13) errs.push(name + ' mains guidées ' + ng);
    for (let g = 0; g < ng; g++) {
      await p.locator('[data-act=gdopen]').nth(g).click();
      let k = 0; while ((await has('[data-act=gdans]:not([disabled])')) && k++ < 8) { await p.locator('[data-act=gdans]').first().click(); await over('guided ' + g); if (g === 1 && k === 3) await shot('guided'); await p.click('[data-act=gdnext]'); }
      if (!(await has('text=Fin de la main'))) errs.push(name + ' main guidée ' + g + ' non terminée');
      await p.click('[data-act=gdclose]');
    }

    // Expresso : une partie complète
    await p.click('[data-act=simsub][data-s=expresso]'); await p.click('[data-act=xpstart]');
    let xg = 0;
    while (!(await has('[data-act=xpnew]')) && xg++ < 600) {
      if (await has('[data-act=hcall]')) { if (await has('[data-act=hraise]')) await p.locator('[data-act=hraise]').last().click(); else await p.click('[data-act=hcall]'); }
      else if (await has('[data-act=xpnext]')) await p.click('[data-act=xpnext]');
      else break;
      if (xg === 2) { await over('expresso'); await shot('expresso'); }
    }
    if (!(await has('[data-act=xpnew]'))) errs.push(name + ' partie Expresso non terminée');
    const xps = await p.evaluate(() => JSON.parse(localStorage.getItem('sigma52.progress')).expresso.games);
    if (xps !== 1) errs.push(name + ' compteur Expresso ' + xps);

    // Outils : équité, board, push/fold, nouveaux outils
    await tab('outils');
    await p.click('[data-act=eqex][data-i="1"]');
    if (!/: 15 sur 45/.test(await p.locator('.felt .eyebrow').textContent())) errs.push(name + ' outs');
    await p.click('[data-t=pushfold]');
    if (!/58,4/.test(await p.locator('.stat.hero b').textContent())) errs.push(name + ' Nash 10 bb');
    await p.click('[data-t=dist]'); await p.click('[data-act=dscalc]'); await p.waitForSelector('#dscanvas');
    await over('distribution'); await shot('distribution');
    await p.click('[data-t=deal]'); if (!(await has('text=Répartition proposée'))) errs.push(name + ' deal ICM'); await over('deal');
    await p.click('[data-t=memo]'); await over('memo');

    // Analyse : exemple simulé, rejouer un gros pot
    await tab('analyse'); await p.click('[data-act=ansub][data-s=import]'); await p.click('[data-act=ansample]'); await p.waitForSelector('text=Exemple simulé');
    if (!(await has('text=C-bet flop'))) errs.push(name + ' stat c-bet absente');
    await p.locator('details summary').first().click().catch(() => {});
    await p.locator('[data-act=rppot]').first().click();
    if (!(await has('[data-act=rpgo]'))) errs.push(name + ' replayer depuis analyse');
    await over('analyse-replay');

    // Journal
    await tab('journal');
    await p.fill('#sbank', '250'); await p.press('#sbank', 'Tab');
    await p.fill('#jres', '−16,50'); await p.fill('#jhands', '700'); await p.click('#jform [type=submit]');
    if (!/Stop-loss/.test(await p.locator('[role=alert]').textContent())) errs.push(name + ' stop-loss');
    await over('journal');
    await tab('jour'); await over('jour-fin'); await shot('jour-fin');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERREURS\n' + errs.join('\n') : 'UI ok : 0 erreur, 0 débordement');
  process.exit(errs.length ? 1 : 0);
})();
