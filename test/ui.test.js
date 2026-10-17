// Test navigateur : node test/ui.test.js (Playwright). Bureau 1280 px et téléphone 390 px, thème clair et sombre.
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
    await p.goto('file://' + path.resolve(__dirname, '../nuts.html'));
    await p.waitForTimeout(300);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const shot = async (t) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-${t}.png`, fullPage: true }); };
    await over('jour'); await shot('jour');
    // Spots : 12 réponses en mix, puis chaque type.
    await p.click('[data-act=daily]');
    for (let i = 0; i < 12; i++) { await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await p.click('[data-act=next]'); }
    for (const m of ['rfi', 'odds', 'tirage', 'meilleure', 'situations']) { await p.click(`[data-mode=${m}]`); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await over('spots-' + m); }
    await shot('spots');
    const daily = await p.evaluate(() => JSON.parse(localStorage.getItem('nuts.progress')).daily.done);
    if (daily !== 10) errs.push(name + ' compteur du jour ' + daily);
    // Cours : ouvrir chaque module.
    await p.click('[data-tab=cours]');
    const n = await p.locator('.mod').count();
    for (let i = 0; i < n; i++) { await p.locator('.mod').nth(i).click(); await over('module ' + i); if (i === 4) await shot('module-maths'); await p.click('[data-act=readmod]'); await p.click('[data-act=closemod]'); }
    // Équité : exemples + saisie invalide.
    await p.click('[data-tab=equite]');
    for (let i = 0; i < 4; i++) { await p.click(`[data-act=eqex][data-i="${i}"]`); }
    await p.click('[data-act=eqex][data-i="1"]');
    const outs = await p.locator('.felt .eyebrow').textContent();
    if (!/Outs du joueur 1 à la prochaine carte : 15 sur 45/.test(outs)) errs.push(name + ' outs ' + outs);
    await shot('equite');
    await p.fill('#eqp1', 'AhKh'); await p.click('[data-act=calc]');
    if (!(await p.locator('.pill.bad').count())) errs.push(name + ' doublon non détecté');
    await over('equite');
    // Ranges : bascule d'une case, envoi vers l'équité.
    await p.click('[data-tab=ranges]'); await p.click('[data-p=UTG]'); await p.click('[data-h=AKo]'); await over('ranges'); await shot('ranges');
    await p.click('[data-act=r2eq]'); await p.click('[data-act=calc]');
    // Journal : bankroll, sessions, stop-loss, suppression.
    await p.click('[data-tab=journal]');
    await p.fill('#sbank', '250'); await p.press('#sbank', 'Tab');
    await p.fill('#jstake', 'NL5'); await p.fill('#jres', '−16,50'); await p.fill('#jhands', '700'); await p.fill('#jmin', '75');
    await p.click('#jform [type=submit]');
    const alert = await p.locator('[role=alert]').textContent();
    if (!/Stop-loss/.test(alert)) errs.push(name + ' stop-loss absent : ' + alert);
    await p.fill('#jres', '7'); await p.fill('#jhands', '900'); await p.click('#jform [type=submit]');
    const bank = await p.locator('.stat b').first().textContent();
    if (!/240,50/.test(bank)) errs.push(name + ' bankroll ' + bank);
    await over('journal'); await shot('journal');
    await p.click('[data-act=del]'); await p.click('[data-act=delok]');
    if ((await p.locator('tbody tr').count()) !== 1) errs.push(name + ' suppression');
    await p.click('[data-act=resim]');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERREURS\n' + errs.join('\n') : 'UI ok : 0 erreur, 0 débordement');
  process.exit(errs.length ? 1 : 0);
})();
