// Mesure des profils Champions : statistiques réelles de chaque bot (tête-à-tête et table à 6), mesurées par l'analyseur
// d'historiques sur des mains simulées, et résultat d'un héros « régulier » contre lui (bb/100). Écrit src/champ_stats.js.
// Usage : node tools/measure_champions.js [mains par format] [profil1,profil2…]
const E = require('../src/engine.js'), H = require('../src/hh.js'), T = require('../src/table.js'), fs = require('fs'), path = require('path');
const N = +(process.argv[2] || 3000), ONLY = process.argv[3] ? process.argv[3].split(',') : null, NHU = +(process.env.NHU || N), OUTF = process.env.OUTF || '';
const ids = Object.keys(T.PROFILES).filter((k) => (T.PROFILES[k].like || ['reg', 'station', 'nit', 'maniaque'].includes(k)) && !T.PROFILES[k].external && !['action', 'prolive'].includes(k) && (!ONLY || ONLY.includes(k)));
function run(prof, lineup, seed, N) {
  const tb = new T.Table({ random: E.rng(seed), lineup }); tb.players.forEach((p, i) => { if (i) p.name = 'P' + i + '_' + p.profile; });
  const parts = []; let net0 = 0;
  for (let h = 1; h <= N; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 400) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } if (h % 300 === 0 || h === N) { parts.push(tb.exportHH()); tb.history = []; } }
  const a = H.analyze(parts.join('\n\n')), o = a.opponents.find((x) => x.name.endsWith('_' + prof) && x.name === 'P1_' + prof);
  const r = (x, n) => (n ? +(x / n).toFixed(3) : null);
  return { n: o.hands, vpip: r(o.vpip, o.hands), pfr: r(o.pfr, o.hands), three: r(o.three, o.threeOpp), n3: o.threeOpp, cbet: r(o.cbet, o.cbetOpp), nc: o.cbetOpp, ftc: r(o.ftc, o.ftcOpp), nf: o.ftcOpp,
    wtsd: r(o.sd, o.sawFlop), af: o.calls ? +(o.aggr / o.calls).toFixed(2) : null, hero: +((a.me.netBB / a.me.hands) * 100).toFixed(1), heroHands: a.me.hands };
}
const out = {}; const t0 = Date.now();
for (const [i, id] of ids.entries()) {
  out[id] = { hu: run(id, [id], 101 + i, NHU), six: run(id, [id, 'reg', 'station', 'reg', 'nit'], 501 + i, N) };
  console.log(id.padEnd(20), 'HU', JSON.stringify(out[id].hu), '\n', ' '.repeat(19), '6 ', JSON.stringify(out[id].six), Math.round((Date.now() - t0) / 1000) + ' s');
}
const F = path.join(__dirname, '../src/champ_stats.js'); let prev = {};
try { prev = require(F).stats || {}; } catch (e) {}
if (OUTF) { fs.writeFileSync(OUTF, JSON.stringify(out)); process.exit(0); }
const D = { built: new Date().toISOString().slice(0, 10), hands: N, handsHU: NHU, stats: { ...prev, ...out } };
fs.writeFileSync(F, `// Généré par tools/measure_champions.js : statistiques mesurées de chaque profil Champions (${NHU} mains en tête-à-tête, ${N} à la table à 6), et résultat d'un héros régulier contre lui.\n(function (root) { const D = ${JSON.stringify(D)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.ChampStats = D; })(typeof window !== 'undefined' ? window : globalThis);\n`);
