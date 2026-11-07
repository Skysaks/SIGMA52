// Test navigateur de la vague 9 : NODE_PATH=$(npm root -g) node test/ui_wave9.test.js — 1280 px clair et 390 px sombre.
// Données compressées décodées au premier accès ; carte « Ta boucle » ; revue EV de mains « réelles » → historique,
// vraies erreurs en révision, séance « Mes vraies erreurs ».
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
    // Données compressées : propriétés paresseuses, contenu décodé correct.
    const d = await p.evaluate(() => ({ lazy: !!Object.getOwnPropertyDescriptor(window, 'FlopLibrary').get, sc: window.FlopLibrary.scenarios.length, hq: window.HandQuiz.length, bj: !!window.BJDATA.presets, lm: !!window.LiveModel }));
    if (!d.lazy || d.sc < 16 || d.hq < 500 || !d.bj || !d.lm) errs.push(name + ' données compressées : ' + JSON.stringify(d));
    // Carte de la boucle, état vide.
    await p.evaluate(() => window.__S52.go('jour')); await p.waitForTimeout(150);
    if (!(await has('.panel.loop'))) errs.push(name + ' carte boucle absente');
    if (!(await has('text=Joue une session'))) errs.push(name + ' prochaine action initiale');
    const home = await p.evaluate(() => { const m = document.querySelector('main').innerHTML; return { loopFirst: m.indexOf('panel loop') < m.indexOf('warnbox') && m.indexOf('panel loop') > m.indexOf('<h1'), dup: m.includes('2 · Entraînement du jour'), league: m.includes(' XP</span>'), studioNav: [...document.querySelectorAll('[data-tab=studio]')].length }; });
    if (!home.loopFirst) errs.push(name + ' boucle pas en tête'); if (home.dup) errs.push(name + ' entraînement du jour en double'); if (home.league) errs.push(name + ' ligue affichée par défaut'); if (home.studioNav) errs.push(name + ' Studio encore dans le menu');
    await over('boucle vide');
    // Mains « réelles » (simulées, importées comme réelles) puis revue EV.
    await p.evaluate(() => { const T = window.TableSim, tb = new T.Table({ lineup: ['reg', 'station', 'maniaque', 'nit', 'reg'] }), parts = [];
      for (let h = 0; h < 260; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('station'); } }
      parts.push(tb.exportHH()); window.__S52.runAnalysis(parts.join('\n\n\n'), 'real'); window.__S52.go('jour'); });
    await p.waitForTimeout(200);
    // Revue automatique lancée par l'import : on la laisse calculer quelques mains puis on l'arrête.
    if (!(await p.evaluate(() => window.__S52.rvState().running))) errs.push(name + ' revue automatique non lancée');
    await p.evaluate(() => window.__S52.go('jour')); if (!(await has('text=/Revue EV en cours/'))) errs.push(name + ' boucle : revue en cours');
    await p.click('[data-act=loopreview]');
    await p.waitForFunction(() => window.__S52.rvState().done >= 4, null, { timeout: 240000 }).catch(() => errs.push(name + ' revue automatique : pas de main calculée'));
    if (await has('[data-act=rvstop]')) await p.click('[data-act=rvstop]');
    await p.waitForFunction(() => (window.__S52.state.progress.evHist || []).length > 0, null, { timeout: 120000 }).catch(() => errs.push(name + ' revue EV non terminée'));
    await p.waitForTimeout(200);
    if (!(await has('text=Évolution sur tes vraies mains'))) errs.push(name + ' évolution absente');
    await over('revue'); 
    const nReal = await p.evaluate(() => window.__S52.realDue().length);
    if (nReal) {
      if (!(await has('text=Tes vraies erreurs'))) errs.push(name + ' encart vraies erreurs');
      await p.evaluate(() => { window.__S52.state.progress.review.forEach((r) => { r.due = '2000-01-01'; }); window.__S52.go('jour'); });
      if (!(await has('text=/Rejoue tes \\d+ vraie/'))) errs.push(name + ' prochaine action vraies erreurs');
      await p.click('.panel.loop [data-act=realdrill]'); await p.waitForTimeout(200);
      if (!(await has('text=Ta vraie main'))) errs.push(name + ' spot de vraie main absent');
      await p.locator('[data-act=ans]').first().click(); await p.waitForTimeout(100);
      if (!(await has('text=Tu avais joué'))) errs.push(name + ' correction de vraie main');
      await over('vraie main');
    } else console.log(name + ' : aucune erreur > 2 % du pot sur cet échantillon (contrôle du spot sauté)');
    // Règle de montée de limite (Carrière) : une session NL10 et 500 € de bankroll → rester (bankroll sous 40 caves de NL25).
    await p.evaluate(() => { const X = window.__S52; X.state.settings.bankroll0 = 500; X.state.journal.sessions.push({ id: 't1', date: X.today(), format: 'Cash', stake: 'NL10', result: 5, hands: 600, minutes: 60 }); X.go('carriere'); });
    await p.waitForTimeout(150);
    if (!(await has('text=Limite : monter, rester, descendre')) || !(await has('text=Rester à NL10'))) errs.push(name + ' règle de montée de limite');
    await over('carriere');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('ui vague 9 ok (1280 clair, 390 sombre)');
})();
