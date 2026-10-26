// Test navigateur de la vague 4 : NODE_PATH=$(npm root -g) node test/ui_wave4.test.js — 1280 px clair et 390 px sombre.
// Plan du jour (5 minutes), confiance, explication, carte de compétences, bibliothèque de flops, profils, simplification, ICM, PLO (ranges du solveur, verrou), préflop (limp, coût EV).
const { chromium } = require('playwright');
const path = require('path');
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
    const need = async (sel, msg) => { if (!(await has(sel))) errs.push(`${name} ${msg}`); };

    // Plan du jour : version 5 minutes (en tête sur mobile), confiance et explication.
    await tab('jour'); await need('text=Plan du jour', 'plan du jour absent'); await over('jour');
    await tab('spots'); await p.click('[data-act=trconf]'); await p.click('[data-act=trexpl]'); await tab('jour');
    await p.click('[data-act=planstart][data-n="5"]'); await p.waitForTimeout(150);
    for (let k = 0; k < 5; k++) {
      if (await has('[data-act=spconf][data-v="70"]')) await p.click('[data-act=spconf][data-v="70"]');
      if (!(await has('[data-act=ans]'))) break;
      await p.locator('[data-act=ans]').first().click();
      if (await has('#spexpl')) { await p.fill('#spexpl', 'Il me faut 25 % et j\'ai environ 35 % avec 9 outs.'); await p.click('[data-act=explok]'); }
      await p.waitForSelector('.verdict', { timeout: 15000 }).catch(() => errs.push(name + ' plan : pas de correction'));
      if (await has('[data-act=explself]')) await p.locator('[data-act=explself]').first().click();
      await over('plan-' + k);
      if (await has('[data-act=next]')) await p.click('[data-act=next]'); else break;
    }
    await tab('profil'); await need('text=Révision espacée (FSRS)', 'FSRS absent du profil'); await p.click('[data-act=retset][data-v="0.95"]'); await over('profil');

    // Solveur : bibliothèque, profils, simplification, ICM.
    await tab('solveur');
    const lb = await p.evaluate(() => window.FlopLibrary?.scenarios?.[0]?.flops?.[0]?.b || '');
    if (lb) { await p.fill('[data-svf=board]', lb); await p.press('[data-svf=board]', 'Tab'); await p.waitForTimeout(100); await need('text=Bibliothèque : réponse immédiate', 'bibliothèque absente'); await over('bibliotheque'); }
    await p.fill('[data-svf=board]', 'Ks7d2c5h9s'); await p.press('[data-svf=board]', 'Tab');
    await p.click('[data-act=svgo]'); await p.waitForSelector('[data-act=svprof]', { timeout: 90000 });
    await p.click('[data-act=svprof][data-p="0"][data-v=station]'); await p.waitForSelector('text=/gagne [+−]/', { timeout: 90000 }).catch(() => errs.push(name + ' profil sans résultat'));
    await over('profil-solveur');
    if (await has('[data-act=svsimp]')) { await p.locator('[data-act=svsimp]').first().click(); await p.waitForSelector('text=/aucun coût mesurable|coût [0-9]/', { timeout: 120000 }).catch(() => errs.push(name + ' simplification sans résultat')); }
    else errs.push(name + ' simplification absente');
    await p.click('[data-act=svsetup]').catch(() => {}); await p.waitForTimeout(80);
    await p.click('[data-act=svicm][data-v="1"]'); await p.fill('[data-svf=icmOthers]', '5 5'); await p.press('[data-svf=icmOthers]', 'Tab');
    await p.fill('[data-svf=stack]', '20'); await p.press('[data-svf=stack]', 'Tab');
    await p.click('[data-act=svgo]'); await p.waitForSelector('text=/bb ICM/', { timeout: 90000 }).catch(() => errs.push(name + ' ICM sans résultat'));
    await over('icm');

    // Préflop : limp de SB et coût EV d'une main.
    await p.click('[data-act=svsub][data-s=preflop]'); await p.selectOption('[data-pfsel]', 'lp:SB').catch(() => errs.push(name + ' nœud limp absent'));
    await p.locator('[data-act=pflcell]').first().click(); await need('text=Coût de chaque action', 'coût EV préflop absent'); await over('preflop-limp');

    // PLO : ranges du solveur préflop, river, verrou.
    await p.click('[data-act=svsub][data-s=plo]'); await need('text=Solveur préflop PLO', 'ranges PLO du solveur absentes');
    await p.fill('[data-plf=board]', 'Ks7d2c5h9s'); await p.press('[data-plf=board]', 'Tab');
    await p.click('[data-act=mxgo][data-k=plo]'); await p.waitForSelector('[data-act=pllock]', { timeout: 90000 }).catch(() => errs.push(name + ' PLO : verrou absent'));
    if (await has('[data-act=pllock]')) { await p.locator('[data-act=pllock][data-m=never]').first().click(); await p.waitForSelector('text=/gagne [+−]/', { timeout: 90000 }).catch(() => errs.push(name + ' PLO : verrou sans résultat')); }
    await over('plo-verrou');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('UI vague 4 ok : 0 erreur, 0 débordement');
})();
