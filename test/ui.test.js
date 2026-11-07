// Test navigateur : NODE_PATH=$(npm root -g) node test/ui.test.js — bureau 1280 px clair, téléphone 390 px sombre.
const { chromium } = require('playwright');
const path = require('path');
const SHOTS = process.env.SHOTS || '';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errs = [];
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme, acceptDownloads: true });
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_PROXY/.test(m.text()) && errs.push(name + ' console ' + m.text()));
    await p.goto('file://' + path.resolve(__dirname, '../sigma52.html'));
    await p.waitForTimeout(300);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const shot = async (t) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-${t}.png`, fullPage: true }); };
    const tab = async (t) => { await p.evaluate((x) => window.__S52.go(x), t); await p.waitForTimeout(60); };
    const has = async (sel) => (await p.locator(sel).count()) > 0;

    // Aujourd'hui + programme
    if (!(await has('text=Programme · semaine 1 sur 17'))) errs.push(name + ' programme absent');
    await p.click('[data-act=weeks]'); await over('jour'); await shot('jour');
    await p.click('[data-act=plango] >> nth=0'); await p.waitForTimeout(60); await tab('jour');

    // Spots (dont le nouveau type) + révisions
    await tab('spots');
    for (let i = 0; i < 12; i++) { await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await p.click('[data-act=next]'); }
    for (const m of ['rfi', 'vsopen', 'odds', 'tirage', 'pushfold', 'outs', 'meilleure', 'situations', 'mdf', 'combos', 'bounty']) { await p.click(`[data-mode=${m}]`); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict'); await over('spots-' + m); }
    const prog = await p.evaluate(() => JSON.parse(localStorage.getItem('sigma52.progress')));
    if (Object.values(prog.stats).reduce((a, x) => a + x.n, 0) < 12) errs.push(name + ' réponses non comptées');
    await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('sigma52.progress')); pr.review.forEach((r) => (r.due = '2000-01-01')); localStorage.setItem('sigma52.progress', JSON.stringify(pr)); });
    await p.reload(); await p.waitForTimeout(300); await tab('jour'); await p.click('[data-act=review]'); await p.click('[data-act=ans]'); await p.waitForSelector('.verdict');

    // Cours : quelques modules et leurs quiz
    await tab('cours');
    const window_MODS = await p.evaluate(() => window.Course.MODULES.length);
    if ((await p.locator('.mod').count()) !== window_MODS) errs.push(name + ' modules ' + (await p.locator('.mod').count()));
    for (let i = 0; i < window_MODS; i++) { await p.locator('.mod').nth(i).click(); await over('module ' + i); await p.click('[data-act=closemod]'); }
    for (const i of [0, 5, 20, 30, 38, 91]) {
      await p.locator('.mod').nth(i).click(); await over('module ' + i);
      const nq = await p.locator('[data-act=qans][data-i="0"]').count();
      for (let q = 0; q < nq; q++) await p.click(`[data-act=qans][data-q="${q}"][data-i="0"]`);
      await p.click('[data-act=closemod]');
    }

    // Révision espacée : force un module maîtrisé et ses questions à échéance
    await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('sigma52.progress')); pr.quiz = pr.quiz || {}; pr.quiz.positions = 1; pr.srs = { 'positions#0': { b: 0, due: '2000-01-01' }, 'positions#1': { b: 1, due: '2000-01-01' } }; localStorage.setItem('sigma52.progress', JSON.stringify(pr)); });
    await p.reload(); await p.waitForTimeout(300); await tab('cours');
    if (!(await has('[data-act=srsstart]'))) errs.push(name + ' SRS : panneau absent');
    else { await p.click('[data-act=srsstart] >> nth=0'); await p.click('[data-act=srsans][data-i="0"]'); await over('srs'); await shot('srs'); await p.click('[data-act=srsnext]'); await p.click('[data-act=srsans][data-i="1"]'); await p.click('[data-act=srsnext]'); if (!(await has('text=Révision des notions terminée'))) errs.push(name + ' SRS : fin absente'); await p.click('[data-act=srsend]'); }

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

    // Solveur : river exacte, navigation, ta main ; turn puis re-résolution exacte d'une river
    await tab('solveur');
    await p.fill('[data-svf=board]', 'Ks7d2c9h4s'); await p.press('[data-svf=board]', 'Tab'); await p.waitForTimeout(100);
    await p.fill('[data-svf=hero]', 'AhKc'); await p.press('[data-svf=hero]', 'Tab');
    if (await has('[data-svf=rakePct]')) { await p.fill('[data-svf=rakePct]', '5'); await p.press('[data-svf=rakePct]', 'Tab'); } else errs.push(name + ' solveur : champ rake');
    await over('solveur-prep'); await shot('solveur-prep');
    await p.click('[data-act=svgo]'); await p.waitForSelector('[data-act=svact]', { timeout: 60000 });
    if (!(await has('text=Ta main'))) errs.push(name + ' solveur : ta main absente');
    await p.locator('[data-act=svact]').first().click(); await p.waitForSelector('[data-act=svact]');
    await p.locator('.rc.sv:not(.off)').first().click(); await p.waitForSelector('table.combos');
    await over('solveur-river'); await shot('solveur-river');
    await p.click('[data-act=svpath][data-k="0"]');
    await p.locator('details.panel summary').first().click();
    await p.fill('[data-svf=board]', 'Ks7d2c9h'); await p.press('[data-svf=board]', 'Tab'); await p.waitForTimeout(100);
    await p.click('[data-act=svpreset][data-v=fast]'); await p.click('[data-act=svgo]'); await p.waitForSelector('[data-act=svact]', { timeout: 120000 });
    await p.locator('[data-act=svact]').first().click(); await p.waitForSelector('[data-act=svact]');
    await p.locator('[data-act=svact]').first().click(); await p.waitForSelector('[data-act=svcard]');
    await over('solveur-cartes'); await p.locator('[data-act=svcard]').first().click(); await p.waitForSelector('[data-act=svresolve]');
    await p.click('[data-act=svresolve]'); await p.waitForSelector('[data-act=svact]', { timeout: 60000 });
    if (!(await has('text=Ranges reprises du solve précédent'))) errs.push(name + ' re-résolution sans note');
    await over('solveur-resolve');
    // Entraîneur
    await p.click('[data-act=svsub][data-s=train]'); await p.click('[data-act=trnew]'); await p.waitForSelector('[data-act=trans]', { timeout: 60000 });
    await p.locator('[data-act=trans]').first().click(); await p.waitForSelector('.verdict');
    await over('entraineur'); await shot('entraineur');
    await p.click('[data-act=tropen]'); await p.waitForSelector('[data-act=svact],[data-act=svcard]');
    const trn = await p.evaluate(() => JSON.parse(localStorage.getItem('sigma52.progress')).trainer.n);
    if (trn !== 1) errs.push(name + ' compteur entraîneur ' + trn);
    await p.click('[data-act=svsub][data-s=help]'); await over('solveur-aide');
    await p.click('[data-act=svsub][data-s=agg]'); if (!(await has('text=Rapport agrégé'))) errs.push(name + ' rapport agrégé'); await p.click('[data-act=aggroup][data-v=suits]'); await over('agg'); await shot('agg');
    for (const sc of ['3bp-BTN-BB', 'srp-UTG-BB', 'srp-BTN-BB']) { if (!(await has(`[data-act=agsc][data-v="${sc}"]`))) { errs.push(name + ' rapport agrégé : scénario ' + sc); continue; } await p.click(`[data-act=agsc][data-v="${sc}"]`); await over('agg-' + sc); } await shot('agg-3bp');
    await p.locator('[data-act=agload]').first().click(); if (!(await has('[data-act=svgo]'))) errs.push(name + ' agrégé : chargement du flop');

    // Champions : briefing, session de 25 mains en tête-à-tête, rapport ; défi mystère ; classement
    await tab('champions'); await p.click('[data-act=chsel][data-id=predateur]'); await p.waitForSelector('.brief');
    if (!(await has('text=Comment le reconnaître'))) errs.push(name + ' briefing sans « Comment le reconnaître »');
    if (/Ivey|Negreanu|Hellmuth|Dwan|inspiré de/.test(await p.locator('main').innerText())) errs.push(name + ' nom de joueur dans Champions');
    await over('champions'); await shot('champions');
    await p.click('[data-act=chtarget][data-v="25"]'); await p.click('[data-act=chplay]');
    let cg = 0;
    while (!(await has('text=Rapport d\'adaptation')) && cg++ < 300) {
      if (await has('[data-act=hcall]')) await p.click('[data-act=hcall]'); else if (await has('[data-act=cashnext]')) await p.click('[data-act=cashnext]'); else break;
    }
    if (!(await has('text=Rapport d\'adaptation'))) errs.push(name + ' rapport champion absent');
    await over('champion-rapport');
    // Champions v12 : filtres, parcours, nouveaux styles
    await tab('champions'); await p.click('[data-act=chsub][data-s=styles]'); await p.click('[data-act=chlvl][data-v="Moyen"]');
    if ((await p.locator('.champ').count()) < 4) errs.push(name + ' filtre niveau'); await p.click('[data-act=chlvl][data-v=all]'); await p.click('[data-act=chfam][data-v="Serré"]');
    if ((await p.locator('.champ').count()) < 4) errs.push(name + ' filtre famille'); await p.click('[data-act=chfam][data-v=all]');
    if ((await p.locator('.champ').count()) !== 28) errs.push(name + ' champions : ' + (await p.locator('.champ').count()));
    for (const id of ['volcan', 'specialiste_hu', 'volume']) { await p.click(`[data-act=chsel][data-id=${id}]`); await p.waitForSelector('.brief'); await over('champion-' + id); }
    await shot('champions-v12');
    await tab('champions'); await p.click('[data-act=chsub][data-s=mystery]'); await p.click('[data-act=chmyst]');
    cg = 0; while (!(await has('[data-act=chguess]')) && cg++ < 400) { if (await has('[data-act=hcall]')) await p.click('[data-act=hcall]'); else if (await has('[data-act=cashnext]')) await p.click('[data-act=cashnext]'); else break; }
    if (!(await has('[data-act=chguess]'))) errs.push(name + ' défi mystère sans choix final');
    else { await p.locator('[data-act=chguess]').first().click(); if (!(await has('text=C\'était'))) errs.push(name + ' défi mystère sans révélation'); }
    await tab('champions'); await p.click('[data-act=chsub][data-s=atlas]'); if ((await p.locator('[data-act=chsort]').count()) < 4) errs.push(name + ' atlas : tri'); await p.locator('[data-act=chsort]').nth(1).click(); await over('atlas'); await shot('atlas');
    await p.click('[data-act=chsub][data-s=reco]'); await p.click('[data-act=chrecon][data-v="300"]'); await p.click('[data-act=chreco]');
    if ((await p.locator('[data-act=chrecoans]').count()) !== 4) errs.push(name + ' reconnaître : 4 options'); else { await p.locator('[data-act=chrecoans]').first().click(); if (!(await has('text=Voir le briefing'))) errs.push(name + ' reconnaître : correction'); }
    await over('reconnaitre'); await shot('reconnaitre');
    // Champions : nouveaux styles et types de partie (cash court, Sit & Go)
    await tab('champions'); await p.click('[data-act=chsub][data-s=styles]'); await p.click('[data-act=chsel][data-id=ultra_lag]'); await over('champion-ultra_lag');
    await p.click('[data-act=chsub][data-s=formats]'); for (const f of ['short', 'deep', 'home', 'hu', 'sng6', 'ft', 'expresso', 'cash100']) { await p.click(`[data-act=fmsel][data-id=${f}]`); await over('format-' + f); }
    await p.click('[data-act=fmsel][data-id=short]'); await p.click('[data-act=fmarch][data-v=classiques]'); await p.click('[data-act=fmplay]'); await p.waitForTimeout(80);
    if ((await p.evaluate(() => window.__S52.getTab())) !== 'sim') errs.push(name + ' format cash non lancé');
    await tab('champions'); await p.click('[data-act=fmsel][data-id=sng6]'); await p.click('[data-act=fmmode][data-v=free]'); await p.click('[data-act=fmplay]'); await p.waitForTimeout(80);
    if (!(await has('text=le Sit & Go'))) errs.push(name + ' Sit & Go non lancé');
    cg = 0; while (!(await has('[data-act=xpnew]')) && cg++ < 400) { if (await has('[data-act=hcall]')) await p.click('[data-act=hcall]'); else if (await has('[data-act=xpnext]')) await p.click('[data-act=xpnext]'); else break; }
    if (!(await has('[data-act=xpnew]'))) errs.push(name + ' Sit & Go sans fin'); await over('sng-fin'); await shot('sng');
    // Table live : consentement, saisie, mode discret, minuteur, préparation
    await tab('live'); if (await has('[data-act=lvok]')) await p.click('[data-act=lvok]');
    for (const k of ['a', 's', 'k', 'h']) await p.keyboard.press(k);
    if (!/RELANCE/.test(await p.locator('.lres b').first().innerText())) errs.push(name + ' live : AKo ne relance pas');
    for (const k of ['t', 'h', '7', 'h', '2', 'c']) await p.keyboard.press(k);
    await p.click('[data-act=lvbet][data-f="0.5"]').catch(() => {}); await over('live'); await shot('live');
    await p.click('[data-act=lvdiscret]'); if (!(await p.evaluate(() => document.body.classList.contains('discret-on')))) errs.push(name + ' mode discret'); await over('live-discret'); await shot('live-discret'); await p.click('[data-act=lvdiscret]');
    await p.click('[data-act=lvsub][data-s=timer]'); await p.click('[data-act=lvtgo]'); await p.waitForTimeout(1100); await p.click('[data-act=lvtgo]'); await over('live-timer'); await shot('live-timer');
    await p.click('[data-act=lvsub][data-s=prep]'); await over('live-prep'); await shot('live-prep');
    // Table live v2 : réglages, grille 52 cartes, range, joueurs, soirée, entraînement, Omaha, envoi au solveur
    await p.click('[data-act=lvsub][data-s=decision]'); await p.click('[data-act=lvcfgopen]'); await p.click('[data-act=lvcfg][data-k=input][data-v=grid]'); await p.click('[data-act=lvcfg][data-k=players][data-v="9"]');
    await p.click('[data-act=lvnew]'); for (const c of [48, 45, 35, 23, 2]) await p.click(`[data-act=lvpick][data-c="${c}"]`);
    if (!(await has('.lopt'))) errs.push(name + ' live v2 : options EV absentes'); await p.click('[data-act=lvrange]'); if (!(await has('.lrange .rgrid'))) errs.push(name + ' live v2 : range absente');
    await over('live-v2'); await shot('live-v2');
    await p.click('[data-act=lvsolve]'); await p.waitForTimeout(80); if ((await p.evaluate(() => window.__S52.getTab())) !== 'solveur') errs.push(name + ' live v2 : envoi au solveur');
    await tab('live'); await p.click('[data-act=lvnew]');
    await p.click('[data-act=lvsub][data-s=table]'); await p.click('[data-act=lpadd]'); await p.click('[data-act=lpadd]'); await p.click('[data-act=lpv][data-i="0"]'); await p.click('[data-act=lpr][data-i="0"]'); await over('live-joueurs'); await shot('live-joueurs');
    await p.click('[data-act=lvsub][data-s=soiree]'); if (!(await has('text=Décisions notées'))) errs.push(name + ' live v2 : soirée'); await over('live-soiree');
    await p.click('[data-act=lvsub][data-s=drill]'); await p.click('[data-act=lvdstart]'); await p.click('[data-act=lvdans][data-i="0"]'); if (!(await has('.verdict'))) errs.push(name + ' live v2 : entraînement'); await over('live-drill'); await shot('live-drill');
    // v14 : la Table live apprend un joueur (réactions, abattage)
    await p.click('[data-act=lvsub][data-s=decision]'); await p.click('[data-act=lvnew]'); for (const c of [48, 45, 35, 23, 2]) await p.click(`[data-act=lvpick][data-c="${c}"]`);
    await p.click('[data-act=lvvil][data-i="0"]');
    if (!(await has('[data-act=lplf]'))) errs.push(name + ' live v14 : apprentissage absent');
    else { await p.click('[data-act=lplf][data-k="0"]'); await p.fill('[data-lv=shown]', '4d3c'); await p.press('[data-lv=shown]', 'Tab'); await p.click('[data-act=lvsd]'); if (!(await has('text=Profil appris'))) errs.push(name + ' live v14 : profil appris'); await over('live-learn'); await shot('live-learn'); }
    await p.click('[data-act=lvvil][data-i="0"]');
    if (await has('[data-act=lvnext2]')) { await p.click('[data-act=lvnext2]'); if (!(await has('.lnext'))) errs.push(name + ' live v14 : cartes à venir'); await over('live-next'); await shot('live-next'); await p.click('[data-act=lvnext2]'); } else errs.push(name + ' live v14 : bouton cartes à venir');
    await p.click('[data-act=lvsub][data-s=decision]'); await p.click('[data-act=lvcfgopen]').catch(() => {}); if (!(await has('[data-act=lvcfg][data-k=game][data-v=plo]'))) await p.click('[data-act=lvcfgopen]');
    await p.click('[data-act=lvcfg][data-k=game][data-v=plo]'); for (const c of [51, 47, 50, 46]) await p.click(`[data-act=lvpick][data-c="${c}"]`);
    if (!/RELANCE|SUIS|COUCHE/.test(await p.locator('.lres b').first().innerText())) errs.push(name + ' live v2 : Omaha'); await over('live-plo');
    await p.click('[data-act=lvcfg][data-k=game][data-v=sd]'); await p.click('[data-act=lvcfg][data-k=input][data-v=grid]'); for (const c of [48, 44]) await p.click(`[data-act=lvpick][data-c="${c}"]`);
    if (!/RELANCE|COUCHE/.test(await p.locator('.lres b').first().innerText())) errs.push(name + ' live : Short Deck'); await over('live-sd');
    await p.click('[data-act=lvcfg][data-k=game][data-v=nlh]'); await p.click('[data-act=lvcfg][data-k=input][data-v=rs]');
    // Parcours : choix, test de niveau complet ; profil ; atlas ; variantes
    await tab('jour'); if (await has('[data-act=trsel][data-id=salaire]')) await p.click('[data-act=trsel][data-id=salaire] >> nth=0');
    await tab('parcours'); if (!(await has('.tsteps'))) errs.push(name + ' parcours : étapes absentes'); await over('parcours'); await shot('parcours');
    await p.click('[data-act=plstart]'); for (let q = 0; q < 24; q++) { await p.click('[data-act=plans][data-i="0"]'); await p.click('[data-act=plnext]'); }
    if (!(await has('text=Test terminé'))) errs.push(name + ' test de niveau'); await p.click('[data-act=plsave]'); await over('parcours-test');
    await tab('jour'); if (!(await has('.nextstep'))) errs.push(name + ' prochaine étape absente'); await over('jour-parcours'); await shot('jour-parcours');
    // Examen de niveau complet
    await tab('parcours'); await p.click('[data-act=exstart][data-l="1"]');
    for (let q = 0; q < 20; q++) { await p.click('[data-act=exans][data-i="0"]'); await p.click('[data-act=exnext]'); }
    if (!(await has('text=Examen terminé'))) errs.push(name + ' examen'); await over('examen'); await shot('examen'); await p.click('[data-act=exend]');
    if (!(await has('text=meilleur'))) errs.push(name + ' examen non enregistré');
    await tab('cours'); if (!(await has('[data-act=exstart]'))) errs.push(name + ' examens absents des cours');
    await tab('profil'); if (!(await has('text=Score SIGMA'))) errs.push(name + ' profil'); await over('profil'); await shot('profil');
    const [bk] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-act=dataexp]')]); if (!bk) errs.push(name + ' export des données');
    await p.evaluate(() => { window.__S52.setTool('atlas'); window.__S52.go('outils'); }); await p.click('[data-act=atset][data-k=pre][data-v=raise]'); await p.locator('[data-act=atsel]').first().click(); await over('atlas'); await shot('atlas');
    await p.click('[data-act=atset][data-k=game][data-v=sd]'); await over('atlas-sd');
    await p.click('[data-t=variantes]'); for (const g of ['sd', 'plo5', 'plo8', 'stud', 'razz', 'nlh']) { await p.click(`[data-act=vagame][data-v=${g}]`); await p.click('[data-act=varun]'); if (!(await has('text=Rafle le pot'))) errs.push(name + ' variantes ' + g); } await over('variantes');
    // Recherche globale et thème
    await p.keyboard.press('Control+k'); await p.keyboard.type('défense minimale'); await p.waitForTimeout(80); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    if ((await p.evaluate(() => window.__S52.getTab())) !== 'cours') errs.push(name + ' recherche globale');
    await p.click('[data-act=theme]'); await p.click('[data-act=theme]'); await p.click('[data-act=theme]');
    await p.keyboard.press('?'); if (!(await has('text=Raccourcis clavier'))) errs.push(name + ' aide clavier'); await p.keyboard.press('Escape');
    // Navigation par espaces (barre du bas sur mobile)
    await p.locator('[data-group=etudier]:visible').first().click(); await p.waitForTimeout(60);
    if (!['solveur', 'analyse', 'outils'].includes(await p.evaluate(() => window.__S52.getTab()))) errs.push(name + ' navigation par espace');
    // Studio : tous les modèles, formats, export image et vidéo
    await tab('studio');
    for (const tpl of ['main', 'quiz', 'lecon', 'solveur', 'champion', 'bilan', 'range', 'equite', 'outs', 'texture', 'legende', 'chiffre', 'mythe', 'libre']) { await p.click(`[data-act=sttpl][data-v=${tpl}]`); await p.waitForTimeout(120); await over('studio-' + tpl); }
    for (const f of ['post', 'portrait', 'yt', 'pin', 'short']) { await p.click(`[data-act=stfmt][data-v=${f}]`); await p.waitForTimeout(80); await over('studio-' + f); }
    await p.click('[data-act=stdom][data-v=bj]'); await p.waitForTimeout(120);
    for (const tpl of ['bjstrat', 'bjquiz', 'bjcount', 'bjtc', 'bjindice', 'bjsys', 'bjgraph', 'bjlecon', 'bjshuffle']) { await p.click(`[data-act=sttpl][data-v=${tpl}]`); await p.waitForTimeout(100); await over('studio-' + tpl); }
    await p.click('[data-act=stnext]'); await p.waitForTimeout(80);
    const stErr = await p.evaluate(() => window.__stErr || []); if (stErr.length) errs.push(name + ' studio : ' + stErr.slice(0, 3).join(' | '));
    await p.click('[data-act=stdom][data-v=poker]'); await p.waitForTimeout(120);
    await p.click('[data-act=sttpl][data-v=quiz]'); await shot('studio');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-act=stpng]')]);
    if (!dl) errs.push(name + ' studio : pas d\'image téléchargée');
    const [dv] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }).catch(() => null), p.click('[data-act=stvid]')]);
    if (!dv) errs.push(name + ' studio : pas de vidéo');

    // Outils : équité, board, push/fold, nouveaux outils
    await tab('outils'); await p.click('[data-t=equite]');
    await p.click('[data-act=eqex][data-i="1"]');
    if (!/: 15 sur 45/.test(await p.locator('.felt .eyebrow').textContent())) errs.push(name + ' outs');
    await p.click('[data-t=pushfold]');
    if (!/58,4/.test(await p.locator('.stat.hero b').textContent())) errs.push(name + ' Nash 10 bb');
    await p.click('[data-t=dist]'); await p.click('[data-act=dscalc]'); await p.waitForSelector('#dscanvas');
    await over('distribution'); await shot('distribution');
    await p.click('[data-t=deal]'); if (!(await has('text=Répartition proposée'))) errs.push(name + ' deal ICM'); await over('deal');
    await p.click('[data-t=memo]'); await over('memo');
    await p.click('[data-t=maths]'); if (!(await has('text=Équité requise pour payer'))) errs.push(name + ' outil calculs'); await over('maths');
    await p.click('[data-t=bloq]'); if (!(await has('text=Combos adverses'))) errs.push(name + ' outil bloqueurs'); await over('bloq');
    await p.click('[data-t=pko]'); if (!(await has('text=Range de call avec la prime'))) errs.push(name + ' outil PKO'); await over('pko'); await shot('pko');
    await p.click('[data-t=omaha]'); await p.click('[data-act=omex][data-v=a]'); if (!(await has('text=double assortie'))) errs.push(name + ' outil Omaha'); await over('omaha'); await shot('omaha');
    await p.click('[data-t=probas]'); if (!(await has('text=Règle des 2 et 4'))) errs.push(name + ' outil probabilités'); await over('probas');
    await p.click('[data-t=partie]'); await over('partie');

    // Analyse : exemple simulé, rejouer un gros pot
    await tab('analyse'); await p.click('[data-act=ansub][data-s=import]'); await p.click('[data-act=ansample]'); await p.waitForSelector('text=Exemple simulé');
    if (!(await has('text=C-bet flop'))) errs.push(name + ' stat c-bet absente');
    await p.locator('details summary').first().click().catch(() => {});
    await p.locator('[data-act=rppot]').first().click();
    if (!(await has('[data-act=rpgo]'))) errs.push(name + ' replayer depuis analyse');
    await over('analyse-replay');
    for (let k = 0; k < 12; k++) await p.keyboard.press('ArrowRight');
    await p.click('[data-act=rp2solver]'); await p.waitForTimeout(150);
    if (!(await has('text=Main importée')) && !(await has('text=deux joueurs'))) errs.push(name + ' import replayer vers solveur');
    await over('replay-solveur'); await shot('replay-solveur');

    // Journal
    await tab('journal');
    await p.fill('#sbank', '250'); await p.press('#sbank', 'Tab');
    await p.fill('#jres', '−16,50'); await p.fill('#jhands', '700'); await p.click('#jform [type=submit]');
    if (!/Stop-loss/.test(await p.locator('[role=alert]').textContent())) errs.push(name + ' stop-loss');
    await over('journal');
    // v15 : Carrière, Mental, Elo et ligue, conseiller par main, indice de chance
    await tab('carriere'); for (const [k, v] of [['expenses', '1200'], ['savings', '8000'], ['target', '1500']]) { await p.fill(`#pf_${k}`, v); await p.press(`#pf_${k}`, 'Tab'); }
    if (!(await has('text=Le plus court chemin')) || !(await has('#carc'))) errs.push(name + ' carrière'); await over('carriere'); await shot('carriere');
    await tab('mental'); for (const k of ['sleep', 'energy', 'calm', 'focus']) await p.click(`[data-act=cisel][data-k=${k}][data-v="4"]`);
    if (!(await has('text=Feu vert'))) errs.push(name + ' check-in'); await p.click('[data-act=cisave]'); await p.click('[data-act=trigtog][data-id=badbeat]');
    if (!(await has('details[data-fid=badbeat]'))) errs.push(name + ' carte de tilt'); await over('mental'); await shot('mental');
    await tab('journal'); if ((await p.locator('#jtrig option').count()) !== 2) errs.push(name + ' déclencheur du journal');
    await tab('profil'); if (!(await has('text=Ligue de la semaine')) || !(await has('text=Classement Elo'))) errs.push(name + ' ligue / Elo');
    const lg = await p.evaluate(() => JSON.parse(localStorage.getItem('sigma52.progress')).league); if (!(lg.xp > 100)) errs.push(name + ' XP de la ligue ' + lg.xp);
    await tab('sim'); await p.click('[data-act=simsub][data-s=table]'); if (await has('[data-act=cashstop]')) await p.click('[data-act=cashstop]'); if (await has('[data-act=cashnew]')) await p.click('[data-act=cashnew]');
    if (await has('[data-act=prepm][data-v=live]')) { await p.click('[data-act=prepm][data-v=live]'); await p.click('[data-act=cashstart]'); }
    for (let g2 = 0; g2 < 60 && !(await has('[data-act=rangeadv]')); g2++) { if (await has('[data-act=hcall]')) await p.click('[data-act=hcall]'); else if (await has('[data-act=cashnext]')) await p.click('[data-act=cashnext]'); else break; }
    if (await has('[data-act=rangeadv]')) { await p.click('[data-act=rangeadv]'); if ((await p.locator('.rc.sv').count()) !== 169) errs.push(name + ' conseiller par main'); await over('conseiller'); await shot('conseiller'); } else errs.push(name + ' conseiller absent');
    await tab('analyse'); await p.click('[data-act=ansub][data-s=import]').catch(() => {}); await p.click('[data-act=ansample]'); await p.waitForTimeout(800);
    if (!(await has('text=Indice de chance')) || !(await has('#evc'))) errs.push(name + ' indice de chance'); await over('chance'); await shot('chance');
    // v16 : mains notées (quiz instantanés + main complète), revue EV, tapis ou couché
    await tab('sim'); await p.click('[data-act=simsub][data-s=practice]');
    await p.click('[data-act=qzstart]'); for (let q = 0; q < 3; q++) { await p.click('[data-act=qzans] >> nth=0'); if (!(await has('text=Écart'))) errs.push(name + ' quiz : correction absente'); await p.click('[data-act=qznext]'); }
    await over('quiz'); await shot('quiz'); await p.click('[data-act=qzend]');
    await p.click('[data-act=prstart]'); await p.waitForSelector('[data-act=prchoose]', { timeout: 120000 }).catch(() => errs.push(name + ' main notée : pas de décision'));
    if (await has('[data-act=prchoose]')) { await p.locator('[data-act=prchoose]').first().click(); await p.waitForSelector('text=Ta dernière décision', { timeout: 60000 }).catch(() => errs.push(name + ' main notée : pas de correction')); await over('practice'); await shot('practice'); }
    await p.click('[data-act=prend]');
    await tab('analyse'); await p.click('[data-act=ansub][data-s=import]').catch(() => {}); await p.click('[data-act=ansample]'); await p.waitForTimeout(600);
    await p.click('[data-act=ansub][data-s=review]'); await p.click('[data-act=rvn][data-v="5"]'); await p.click('[data-act=rvstart]');
    await p.waitForSelector('text=/[1-5]\\/5 mains/', { timeout: 120000 }).catch(() => errs.push(name + ' revue EV : aucune main calculée'));
    if (await has('[data-act=rvstop]')) await p.click('[data-act=rvstop]');
    await p.evaluate(() => { const T = window.TableSim, L = [[10, 20], [15, 30], [20, 40], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200]], parts = [];
      for (let g = 0; g < 8; g++) { const tb = new T.Table({ lineup: ['reg', 'station'], stack: 500, rebuy: false, levels: L, handsPerLevel: 6 }); for (let h = 0; h < 80 && !tb.over; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } } parts.push(tb.exportHH()); }
      window.__S52.runAnalysis(parts.join('\n\n\n'), 'table'); window.__S52.setAnSub('review'); window.__S52.go('analyse'); });
    if (!(await has('text=Tapis ou couché · tournois'))) errs.push(name + ' tapis ou couché'); await over('revue'); await shot('revue');
    // v17 : solveur (préflop, node locking, rapport à la demande, à trois, PLO), Spin, légendes, tournoi 100 joueurs, vidéo de module
    await tab('solveur'); await p.click('[data-act=svsub][data-s=preflop]'); await p.locator('[data-act=pflcell]').first().click(); await p.click('[data-act=pffmt][data-v=mtt]'); await over('preflop'); await shot('preflop');
    await p.click('[data-act=svsub][data-s=agg]'); if (await has('[data-act=odn]')) { await p.locator('[data-act=odn]').first().click(); await p.click('[data-act=odgo]'); await p.waitForTimeout(4000); if (await has('[data-act=odstop]')) await p.click('[data-act=odstop]'); await p.waitForTimeout(500); await over('agg-demande'); } else errs.push(name + ' rapport à la demande absent');
    await p.click('[data-act=svsub][data-s=solve]'); if (await has('[data-act=svreset]')) await p.click('[data-act=svreset]');
    await p.fill('[data-svf=board]', 'Ks7d2c5h9s'); await p.press('[data-svf=board]', 'Tab'); await p.click('[data-act=svgo]'); await p.waitForSelector('[data-act=lkedit]', { timeout: 60000 });
    await p.click('[data-act=lkedit]'); await p.locator('[data-act=lkpreset]').first().click(); await p.click('[data-act=lkgo]'); await p.waitForSelector('text=Exploitation chiffrée', { timeout: 60000 }).catch(() => errs.push(name + ' node locking sans résultat')); await over('lock'); await shot('lock');
    await p.click('[data-act=svsub][data-s=three]'); await p.fill('[data-thf=board]', 'Ks7d2c5h9s'); await p.press('[data-thf=board]', 'Tab'); await p.click('[data-act=mxgo][data-k=three]');
    await p.waitForSelector('[data-act=mxact]', { timeout: 60000 }); if ((await p.locator('.stats.svs .stat').count()) !== 3) errs.push(name + ' à trois : 3 joueurs attendus');
    await p.click('[data-act=mxquiz]'); await p.click('[data-act=mxans] >> nth=0'); await over('trois'); await shot('trois');
    await p.click('[data-act=svsub][data-s=plo]'); await p.fill('[data-plf=board]', 'Ks7d2c5h9s'); await p.press('[data-plf=board]', 'Tab'); await p.fill('[data-plf=hero]', 'AsAhJdTd'); await p.press('[data-plf=hero]', 'Tab');
    await p.click('[data-act=mxgo][data-k=plo]'); await p.waitForSelector('[data-act=mxact]', { timeout: 60000 }); if (!(await has('text=Ta main'))) errs.push(name + ' PLO : ta main');
    await p.click('[data-act=mxquiz]'); await p.click('[data-act=mxans] >> nth=0'); if (!(await has('text=Score PLO'))) errs.push(name + ' PLO : entraîneur'); await p.locator('[data-act=mxfilter]').first().click(); await over('plo'); await shot('plo');
    await tab('sim'); await p.click('[data-act=simsub][data-s=expresso]'); if (await has('[data-act=xpquit]')) await p.click('[data-act=xpquit]'); if (await has('[data-act=xpnew]')) await p.click('[data-act=xpnew]'); if (!(await has('[data-spn=p1]'))) errs.push(name + ' Spin : simulateur de variance'); if (await has('[data-act=xpstart]')) await p.click('[data-act=xpstart]'); await p.waitForTimeout(150); await over('spin'); await shot('spin');
    await tab('sim'); await p.click('[data-act=simsub][data-s=legends]'); await p.locator('[data-act=lgopen]').first().click(); await p.locator('[data-act=lgans]').first().click(); if (!(await has('text=Le choix réel'))) errs.push(name + ' légendes'); await over('legende'); await shot('legende');
    await tab('sim'); await p.click('[data-act=simsub][data-s=mtt]'); await p.click('[data-act=mtstart]'); await p.waitForTimeout(150); if (await has('[data-act=mtauto]')) { await p.click('[data-act=mtauto]'); await p.waitForTimeout(800); } else errs.push(name + ' tournoi : pas de jeu auto'); await over('mtt'); await shot('mtt');
    await tab('cours'); if (await has('[data-act=closemod]')) await p.click('[data-act=closemod]'); await p.locator('.mod').first().click(); if (!(await has('[data-act=stmodvid]'))) errs.push(name + ' vidéo du module absente'); await p.click('[data-act=closemod]');
    await tab('jour'); await over('jour-fin'); await shot('jour-fin');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERREURS\n' + errs.join('\n') : 'UI ok : 0 erreur, 0 débordement');
  process.exit(errs.length ? 1 : 0);
})();
