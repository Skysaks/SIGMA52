// Test navigateur de la vague 6 : NODE_PATH=$(npm root -g) node test/ui_wave6.test.js — 1280 px clair et 390 px sombre.
// Carte 360 du Cours (tous les domaines, tous les modules classés), les 13 nouveaux modules (lecture et quiz), liens d'entraînement.
const { chromium } = require('playwright');
const path = require('path');
const NEW = ['rapide', 'selection', 'squeeze', 'realisation', 'caller_ip', 'multiway_post', 'shorthanded', 'pots4bet', 'overbets', 'construire', 'regs', 'bayes', 'rake'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errs = [];
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme });
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text()) && errs.push(name + ' console ' + m.text()));
    await p.goto('file://' + path.resolve(__dirname, '../sigma52.html')); await p.waitForTimeout(300);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const tab = async (t) => { await p.evaluate((x) => window.__S52.go(x), t); await p.waitForTimeout(80); };
    const has = async (sel) => (await p.locator(sel).count()) > 0;

    // Carte 360 : tous les modules classés, chaque domaine s'ouvre.
    await tab('cours');
    if (!(await has('text=Tout le poker, domaine par domaine'))) errs.push(name + ' carte 360 absente');
    if (await has('.d360h:has-text("Autres")')) errs.push(name + ' carte 360 : modules non classés');
    const nd = await p.locator('[data-act=c360]').count(); if (nd !== 11) errs.push(name + ' carte 360 : ' + nd + ' domaines');
    let chips = 0;
    for (let i = 0; i < nd; i++) { await p.locator('[data-act=c360]').nth(i).click(); await p.waitForTimeout(40); chips += await p.locator('.m360 [data-act=openmod]').count(); await over('domaine ' + i); }
    const nm = await p.evaluate(() => window.Course.MODULES.length); if (chips !== nm) errs.push(`${name} carte 360 : ${chips} modules affichés sur ${nm}`);
    // Lien d'entraînement depuis un domaine.
    await p.locator('[data-act=c360]').nth(3).click(); await p.locator('[data-act=c360go]').first().click(); await p.waitForTimeout(100);
    if ((await p.evaluate(() => window.__S52.getTab())) !== 'spots') errs.push(name + ' lien d\'entraînement : pas d\'arrivée sur les spots');

    // Les 13 nouveaux modules : lecture, exercices, quiz complet.
    for (const id of NEW) {
      await p.evaluate((x) => { window.__S52.setOpenMod(x); window.__S52.go('cours'); }, id); await p.waitForTimeout(60);
      if (!(await has('[data-act=closemod]'))) { errs.push(name + ' module ' + id + ' ne s\'ouvre pas'); continue; }
      const nq = await p.locator('.opts').count(); if (nq < 5) errs.push(name + ' module ' + id + ' : ' + nq + ' questions');
      for (let q = 0; q < nq; q++) await p.locator('.opts').nth(q).locator('.opt').first().click();
      if (!(await has('.verdict'))) errs.push(name + ' module ' + id + ' : pas de correction');
      await over('module ' + id);
    }
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('ui vague 6 ok (1280 clair, 390 sombre)');
})();
