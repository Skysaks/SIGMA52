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
    const tab = async (t) => { await p.click(`[data-tab=${t}]`); await p.waitForTimeout(80); };
    await over('jour'); await shot('jour');
    // Spots : 12 réponses du jour, chaque type, puis les révisions générées par les erreurs.
    await p.click('[data-act=daily]');
    for (let i = 0; i < 12; i++) { await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await p.click('[data-act=next]'); }
    for (const m of ['rfi', 'odds', 'tirage', 'pushfold', 'outs', 'meilleure', 'situations']) { await p.click(`[data-mode=${m}]`); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await over('spots-' + m); if (m === 'pushfold') await shot('spots-pushfold'); }
    const prog = await p.evaluate(() => JSON.parse(localStorage.getItem('sigma52.progress')));
    if (prog.daily.done !== 10) errs.push(name + ' compteur du jour ' + prog.daily.done);
    if (!prog.review.length) errs.push(name + ' aucune erreur en révision');
    // Les révisions sont dues demain : on avance la date des éléments pour tester le mode.
    await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('sigma52.progress')); pr.review.forEach((r) => (r.due = '2000-01-01')); localStorage.setItem('sigma52.progress', JSON.stringify(pr)); });
    await p.reload(); await p.waitForTimeout(300); await tab('jour'); await p.click('[data-act=review]'); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await over('revision');
    // Cours.
    await tab('cours'); const n = await p.locator('.mod').count();
    if (n !== 35) errs.push(name + ' modules ' + n);
    for (let i = 0; i < n; i++) {
      await p.locator('.mod').nth(i).click(); await over('module ' + i);
      const nq = await p.locator('[data-act=qans][data-i="0"]').count();
      for (let q = 0; q < nq; q++) await p.click(`[data-act=qans][data-q="${q}"][data-i="${(q + i) % 2}"]`);
      if (!(await p.locator('text=/\\d+\\/\\d+ · /').count())) errs.push(name + ' score de quiz absent module ' + i);
      if (i === 5) await shot('module-maths');
      await p.click('[data-act=closemod]');
    }
    await p.click('[data-act=gloss]'); await over('lexique'); await shot('cours');
    // Table : 15 mains jouées aux boutons.
    await tab('table'); await shot('table');
    for (let h = 0; h < 15; h++) {
      let g = 0;
      while (!(await p.locator('[data-act=nexthand]').count()) && g++ < 40) {
        const raise = await p.locator('[data-act=hraise]').count();
        if (raise && g === 1 && h % 3 === 0) await p.locator('[data-act=hraise]').first().click(); else await p.click('[data-act=hcall]');
      }
      if (h === 2) await shot('table-debrief');
      await over('table'); await p.click('[data-act=nexthand]');
    }
    await p.click('#showprof'); await p.click('#showhelp'); await over('table-aide');
    await p.click('[data-act=tb2an]'); await over('analyse-table');
    if (!(await p.locator('text=Mains de la table').count())) errs.push(name + ' export table → analyse');
    // Outils.
    await tab('outils');
    for (let i = 0; i < 5; i++) await p.click(`[data-act=eqex][data-i="${i}"]`);
    await p.click('[data-act=eqex][data-i="1"]');
    const outs = await p.locator('.felt .eyebrow').textContent();
    if (!/: 15 sur 45/.test(outs)) errs.push(name + ' outs ' + outs);
    await p.click('[data-act=eqex][data-i="3"]');
    if (!(await p.locator('text=Matrice préflop').count())) errs.push(name + ' matrice préflop absente');
    await over('equite'); await shot('equite');
    await p.click('[data-t=board]'); for (const bd of ['9h8h7c', 'As5s5d', 'Ah9s4d6c']) { await p.click(`[data-b="${bd}"]`); await over('board ' + bd); } await shot('board');
    await p.click('[data-t=pushfold]');
    const push = await p.locator('.stat.hero b').textContent();
    if (!/58,4/.test(push)) errs.push(name + ' Nash 10 bb ' + push);
    await p.click('[data-h=A2o]'); if (!/A2o : tapis toujours/.test(await p.locator('#pfdetail').textContent())) errs.push(name + ' détail A2o');
    await p.click('[data-m=icm]'); await p.click('[data-act=pfpreset][data-v="100"]');
    const icmPush = await p.locator('.stat.hero b').textContent(); await over('icm'); await shot('icm');
    await p.click('[data-act=pfpreset][data-v="65, 35"]'); const icm2 = await p.locator('.stat.hero b').textContent();
    console.log(`  ${name} ICM : gagnant-prend-tout ${icmPush}, 65/35 ${icm2}`);
    await p.click('[data-t=ranges]'); await p.click('[data-p=UTG]'); await p.click('[data-h=AKo]'); await p.click('[data-act=r2bd]'); await over('ranges→board');
    // Analyse : exemple simulé.
    await tab('analyse'); await p.click('[data-act=ansample]'); await p.waitForSelector('text=Exemple simulé');
    await p.locator('[data-act=opp]').first().click(); await over('analyse'); await shot('analyse');
    // Journal.
    await tab('journal');
    await p.fill('#sbank', '250'); await p.press('#sbank', 'Tab');
    await p.fill('#jstake', 'NL5'); await p.fill('#jres', '−16,50'); await p.fill('#jhands', '700'); await p.fill('#jmin', '75');
    await p.click('#jform [type=submit]');
    if (!/Stop-loss/.test(await p.locator('[role=alert]').textContent())) errs.push(name + ' stop-loss absent');
    await p.fill('#jres', '7'); await p.fill('#jhands', '900'); await p.click('#jform [type=submit]');
    if (!/240,50/.test(await p.locator('.stat b').first().textContent())) errs.push(name + ' bankroll');
    await over('journal'); await shot('journal');
    await tab('jour'); await over('jour-fin'); await shot('jour-fin');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERREURS\n' + errs.join('\n') : 'UI ok : 0 erreur, 0 débordement');
  process.exit(errs.length ? 1 : 0);
})();
