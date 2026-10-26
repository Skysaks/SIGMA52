// Test navigateur de la vague 5 : NODE_PATH=$(npm root -g) node test/ui_wave5.test.js — 1280 px clair et 390 px sombre.
// Débuter (programme, carnet, capital), drills « profils », série des Défis, import .zip et résumés de tournoi, stratégie jouable,
// rapport agrégé PLO, copie hors ligne, étude en direct (sans salle : message), main de légende Cada–Moon.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const { execFileSync } = require('child_process');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const errs = [];
  // Archive PokerCraft factice : une main GGPoker et un résumé de tournoi.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's52z-')), zip = path.join(tmp, 'pokercraft.zip');
  const hand = fs.readFileSync(path.resolve(__dirname, 'gg.test.js'), 'utf8').match(/Poker Hand #[\s\S]*?(?=`)/);
  execFileSync('python3', ['-c', `import zipfile,sys
z=zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED)
z.writestr('Holdem/GG20260912.txt', sys.argv[2])
z.writestr('Tournaments/summary.txt', "Tournament #271234567, $5.40 Bounty Hunters, Hold'em No Limit\\nBuy-in: $2.5+$0.4+$2.5\\n512 Players\\nTournament started 2026/09/12 18:00:00\\nYou finished the tournament in 37th place.\\nYou received a total of $12.35.\\n")
z.close()`, zip, hand ? hand[0] : '']);
  for (const [name, vp, scheme] of [['desk', { width: 1280, height: 900 }, 'light'], ['mob', { width: 390, height: 844 }, 'dark']]) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme, acceptDownloads: true });
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text()) && errs.push(name + ' console ' + m.text()));
    await p.goto('file://' + path.resolve(__dirname, '../sigma52.html')); await p.waitForTimeout(300);
    const over = async (t) => { const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (sw > iw + 1) errs.push(`${name} ${t} débordement ${sw}>${iw}`); };
    const tab = async (t) => { await p.evaluate((x) => window.__S52.go(x), t); await p.waitForTimeout(80); };
    const has = async (sel) => (await p.locator(sel).count()) > 0;
    const need = async (sel, msg) => { if (!(await has(sel))) errs.push(`${name} ${msg}`); };

    // Débuter : toutes les sous-sections s'affichent sans débordement.
    await tab('debuter');
    for (const s of ['start', 'prog', 'carnet', 'capital', 'maths', 'bilan', 'res']) { await p.click(`[data-act=dbsub][data-v=${s}]`); await p.waitForTimeout(60); await over('debuter-' + s); }
    await need('[data-act=offline]', 'bouton hors ligne absent de Débuter');

    // Drill « même main, quatre adversaires ».
    await p.evaluate(() => window.__S52.setSpotMode('profils')); await tab('spots'); await p.waitForTimeout(100);
    await need('text=/Même main, quatre adversaires/', 'drill profils absent');
    if (await has('[data-act=spconf][data-v="70"]')) await p.click('[data-act=spconf][data-v="70"]');
    await p.locator('[data-act=ans]').first().click(); await p.waitForSelector('.verdict', { timeout: 15000 }).catch(() => errs.push(name + ' profils sans correction'));
    await need('text=/Même main contre chaque profil/', 'comparaison des profils absente'); await over('profils');

    // Défis : série.
    await tab('defis'); await p.click('[data-act=stkgo]'); await p.waitForTimeout(80);
    for (let k = 0; k < 30 && (await has('[data-act=stkans]')); k++) { await p.locator('[data-act=stkans]').last().click(); await p.waitForTimeout(40); }
    await need('text=/Série terminée à/', 'série sans fin'); await over('serie');

    // Analyse : archive .zip PokerCraft avec résumé de tournoi, ajout au Journal.
    await tab('analyse'); await p.setInputFiles('#anfile', zip); await p.waitForTimeout(400);
    await need('text=/1 tournoi reconnu/', 'résumé de tournoi non lu'); await p.click('[data-act=ansumimp]'); await need('text=/ajouté au Journal/', 'tournoi non ajouté');
    const jn = await p.evaluate(() => window.__S52.state.journal.sessions.filter((x) => x.tid).length); if (jn !== 1) errs.push(name + ' journal : ' + jn + ' tournoi(s)');
    await over('analyse-zip');

    // Solveur : stratégie jouable (river).
    await tab('solveur'); await p.fill('[data-svf=board]', 'Ks7d2c5h9s'); await p.press('[data-svf=board]', 'Tab');
    await p.click('[data-act=svgo]'); await p.waitForSelector('[data-act=svplay]', { timeout: 90000 });
    await need('text=Une action par catégorie', 'fiche jouable absente');
    await p.click('[data-act=svplay]'); await p.waitForSelector('text=/Coût de la fiche pour/', { timeout: 120000 }).catch(() => errs.push(name + ' coût de la fiche absent'));
    await over('jouable');

    // Rapport agrégé PLO : un flop au moins, puis arrêt (bureau seulement, pour la durée).
    if (name === 'desk') {
      await p.click('[data-act=svsub][data-s=plo]'); await p.click('[data-act=paggo]');
      await p.waitForSelector('text=/1\\/14 flops|2\\/14 flops/', { timeout: 60000 }).catch(() => errs.push(name + ' rapport PLO sans premier flop'));
      if (await has('[data-act=paggstop]')) await p.click('[data-act=paggstop]');
      await need('text=Par texture', 'rapport PLO : table des textures absente'); await over('plo-agg');
    }

    // Copie hors ligne : téléchargement d'un HTML autonome qui démarre.
    await tab('profil');
    if (await has('[data-act=offline]')) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('[data-act=offline]')]);
      const f = path.join(tmp, name + '-offline.html'); await dl.saveAs(f);
      const html = fs.readFileSync(f, 'utf8'); if (html.length < 4e6 || !/data-s52/.test(html)) errs.push(name + ' copie hors ligne incomplète ' + html.length);
      const q = await b.newPage({ viewport: vp }); const qe = []; q.on('pageerror', (e) => qe.push(e.message));
      await q.goto('file://' + f); await q.waitForTimeout(500);
      if (!(await q.locator('#view .panel, #view section').count())) errs.push(name + ' copie hors ligne : vue vide'); if (qe.length) errs.push(name + ' copie hors ligne : ' + qe[0]); await q.close();
    } else errs.push(name + ' bouton hors ligne absent du profil');

    // Entre amis : étude en direct, hors claude.ai → message clair.
    await tab('amis'); await p.click('[data-act=amsub][data-s=direct]'); await p.fill('[data-ldf=nick]', 'Flo'); await p.press('[data-ldf=nick]', 'Tab');
    await p.click('[data-act=ldcreate]'); await p.waitForTimeout(150); await need('text=/Salle en temps réel indisponible/', 'étude en direct : pas de message hors claude.ai'); await over('direct');

    // Main de légende Cada–Moon.
    await tab('sim'); await p.evaluate(() => { window.__S52.setSimSub('legends'); window.__S52.render(); }); await p.click('[data-act=lgopen][data-id=moon09]');
    await p.locator('[data-act=lgans]').last().click(); await need('text=/Ce qui s\'est passé/', 'légende Cada–Moon sans correction'); await over('legende');
    await p.close();
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('ui vague 5 ok (1280 clair, 390 sombre)');
})();
