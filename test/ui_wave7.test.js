// Test navigateur de la vague 7 : NODE_PATH=$(npm root -g) node test/ui_wave7.test.js — 1280 px clair et 390 px sombre.
// Les 9 modules v22 (lecture et quiz), Cartes du turn (calcul exact des 49 turns), Dessine la range (note et correction),
// Re-entry et add-on, tous les modules classés dans la Carte 360.
const { chromium } = require('playwright');
const path = require('path');
const NEW = ['petitesmises', 'face_xr', 'bvb_post', 'ante_straddle', 'protection', 'reentry', 'tirage_jeux', 'turncard', 'jouets'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errs = [];
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme });
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text()) && errs.push(name + ' console ' + m.text()));
    await p.goto('file://' + path.resolve(__dirname, '../sigma52.html')); await p.waitForTimeout(300);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const has = async (sel) => (await p.locator(sel).count()) > 0;
    const tool = async (k) => { await p.evaluate((x) => { window.__S52.setTool(x); window.__S52.go('outils'); }, k); await p.waitForTimeout(80); };

    // Modules v22.
    for (const id of NEW) {
      await p.evaluate((x) => { window.__S52.setOpenMod(x); window.__S52.go('cours'); }, id); await p.waitForTimeout(60);
      if (!(await has('[data-act=closemod]'))) { errs.push(name + ' module ' + id + ' ne s\'ouvre pas'); continue; }
      const nq = await p.locator('.opts').count(); if (nq < 5) errs.push(name + ' module ' + id + ' : ' + nq + ' questions');
      if ((await p.locator('details.exo').count()) < 3) errs.push(name + ' module ' + id + ' : moins de 3 exercices');
      for (let q = 0; q < nq; q++) await p.locator('.opts').nth(q).locator('.opt').first().click();
      if (!(await has('.verdict'))) errs.push(name + ' module ' + id + ' : pas de correction');
      await over('module ' + id);
    }
    // Carte 360 : aucun module hors domaine.
    await p.evaluate(() => { window.__S52.setOpenMod(null); window.__S52.go('cours'); }); await p.waitForTimeout(80);
    if (await has('.d360h:has-text("Autres")')) errs.push(name + ' carte 360 : modules non classés');

    // Cartes du turn : calcul exact, grille des 49 turns, familles.
    await tool('runout');
    await p.click('[data-act=ropre][data-a=BTN][data-b=BB]'); await p.fill('#roflop', '9h8h6c'); await p.press('#roflop', 'Tab');
    await p.click('[data-act=rogo]');
    await p.waitForSelector('text=Par famille de cartes', { timeout: 60000 }).catch(() => errs.push(name + ' cartes du turn : pas de résultat'));
    const cells = await p.locator('.rocell:not(.off)').count(); if (cells !== 49) errs.push(name + ' cartes du turn : ' + cells + ' turns');
    const flopEq = await p.locator('.stat.hero b').first().textContent(); if (!/49,9/.test(flopEq || '')) errs.push(name + ' cartes du turn : équité flop ' + flopEq);
    await over('runout');

    // Dessine la range : colorier quelques mains, comparer, corriger.
    await tool('dessin');
    for (const h of ['AA', 'KK', 'AKs', '72o']) await p.click(`[data-act=dzcell][data-h="${h}"]`);
    await p.click('[data-act=dzcheck]'); await p.waitForTimeout(60);
    if (!(await has('.rc.dzmiss')) || !(await has('.rc.dzextra'))) errs.push(name + ' dessin : correction incomplète');
    if (!(await has('text=/Note \\d+ %/'))) errs.push(name + ' dessin : pas de note');
    const best = await p.evaluate(() => window.__S52.state.progress.tools3?.dessin?.['rfi-CO']); if (!(best > 0 && best < 1)) errs.push(name + ' dessin : meilleur score non enregistré ' + best);
    await over('dessin');
    await p.click('[data-act=dznext]'); await p.waitForTimeout(40); await over('dessin-suivant');

    // Re-entry et add-on.
    await tool('reentry');
    if (!(await has('text=1,56'))) errs.push(name + ' re-entry : 1,56 entrée attendue');
    if (!(await has('text=/\\+5,15 €/'))) errs.push(name + ' re-entry : gain attendu absent');
    if (!(await has('text=/rapport de 1,5/'))) errs.push(name + ' re-entry : rapport add-on absent');
    await over('reentry');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('ui vague 7 ok (1280 clair, 390 sombre)');
})();
