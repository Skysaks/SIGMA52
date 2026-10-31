// Test navigateur de la vague 8 : NODE_PATH=$(npm root -g) node test/ui_wave8.test.js — 1280 px clair et 390 px sombre.
// Situations étendues du Solveur (pots 4-bet, autres profondeurs, tournoi) : présentes dans la liste, ranges pondérées chargées,
// bibliothèque immédiate sur un flop 4-bet déjà résolu, solve d'une river dans une situation à 40 bb.
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
    const has = async (sel) => (await p.locator(sel).count()) > 0;
    await p.evaluate(() => window.__S52.go('solveur')); await p.waitForTimeout(150);
    const groups = await p.locator('[data-svf=scen] optgroup').evaluateAll((g) => g.map((x) => x.label));
    for (const t of ['Pot 4-bet', 'Pot simple · 40 bb', 'Pot 3-bet · 150 bb', 'Pot simple · tournoi 40 bb avec ante']) if (!groups.includes(t)) errs.push(name + ' groupe absent : ' + t);
    // Pot 4-bet BTN contre BB sur un flop de la bibliothèque.
    await p.selectOption('[data-svf=scen]', '4bp-BTN-BB'); await p.waitForTimeout(100);
    if (!(await has('text=/Ranges pondérées du solveur préflop/'))) errs.push(name + ' note des ranges absente');
    await p.fill('[data-svf=board]', 'As8s2h'); await p.press('[data-svf=board]', 'Tab'); await p.waitForTimeout(150);
    if (!(await has('text=Bibliothèque : réponse immédiate'))) errs.push(name + ' bibliothèque 4-bet absente');
    await over('4bp');
    // Situation à 40 bb : solve d'une river.
    await p.selectOption('[data-svf=scen]', 'srp-BTN-BB-40'); await p.waitForTimeout(100);
    await p.fill('[data-svf=board]', 'Ks7d2c5h9s'); await p.press('[data-svf=board]', 'Tab');
    await p.click('[data-act=svgo]');
    await p.waitForSelector('[data-act=svplay]', { timeout: 120000 }).catch(() => errs.push(name + ' solve 40 bb sans résultat'));
    const st = await p.evaluate(() => [window.__S52.SOLVER?.SCEN?.length]); if (st[0] && st[0] < 30) errs.push(name + ' scénarios : ' + st[0]);
    await over('40bb');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('ui vague 8 ok (1280 clair, 390 sombre)');
})();
