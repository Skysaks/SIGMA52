// Tests carrière, Elo, ligue, chance, check-in : node test/pro.test.js
const P = require('../src/pro.js'), E = require('../src/engine.js'), H = require('../src/hh.js'), T = require('../src/table.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('loi normale : valeurs de référence', () => {
  assert(Math.abs(P.normCdf(0) - 0.5) < 1e-7 && Math.abs(P.normCdf(1.96) - 0.975) < 1e-4 && Math.abs(P.normCdf(-1) - 0.1587) < 1e-4);
});
t('simulateur de carrière : sans variance, gain exact et montée de limite', () => {
  const r = P.careerSim({ bank: 2000, stake: 2, wr: 10, sd: 0.0001, hoursMonth: 100, handsHour: 100, months: 1, drop: 0, expenses: 0, paths: 10, rule: 40 });
  // 4 blocs de 250 bb : NL10 (+25 €), montée NL25 (+62,5 €), montée NL50 à 2 087,5 € (≥ 40 caves de NL50), puis 2 blocs à NL50 (+125 € chacun).
  assert(Math.abs(r.final.p50 - (2000 + 25 + 62.5 + 125 + 125)) < 1, r.final.p50);
  assert(r.pRuin === 0 && r.stakesEnd[4] === 1);
});
t('simulateur de carrière : perdant + retraits = ruine fréquente ; gagnant bien financé = rare', () => {
  const bad = P.careerSim({ bank: 300, stake: 1, wr: -2, sd: 90, hoursMonth: 80, handsHour: 200, expenses: 100, paths: 600 });
  const good = P.careerSim({ bank: 5000, stake: 3, wr: 6, sd: 90, hoursMonth: 120, handsHour: 300, expenses: 300, target: 300, paths: 600 });
  assert(bad.pRuin > 0.9, bad.pRuin); assert(good.pRuin < 0.05, good.pRuin); assert(good.pTarget > 0.5, good.pTarget);
  assert(good.fan.length === 13 && good.fan.every((q) => q[0] <= q[2] && q[2] <= q[4]));
  console.log(`    gagnant : ruine ${(good.pRuin * 100).toFixed(1)} %, objectif ${(good.pTarget * 100).toFixed(0)} %, revenu médian ${good.income.p50.toFixed(0)} €/mois, ${good.losingMonths.toFixed(1)} mois perdants`);
});
t('risque de ruine : formule', () => {
  assert(Math.abs(P.riskOfRuin(5, 90, 4000) - Math.exp(-2 * 5 * 4000 / 8100)) < 1e-12 && P.riskOfRuin(-1, 90, 1e6) === 1);
});
t('critères de passage pro : profil prêt et profil débutant', () => {
  const sim = { pRuin: 0.01, pTarget: 0.7 };
  const ready = P.proCriteria({ hands: 120000, wr: 6, ci: 3, sd: 90, bank: 6000, bbValue: 1, handsHour: 300, hoursMonth: 120, target: 1800, expenses: 1500, savings: 12000, hours: 600, sessions: Array.from({ length: 30 }, () => ({ tilt: 0 })), exams: 6, sim });
  assert.strictEqual(ready.verdict, 'ready', JSON.stringify(ready.list.filter((c) => c.st !== 'ok')));
  const novice = P.proCriteria({ hands: 3000, wr: 12, ci: 32, sd: 90, bank: 200, bbValue: 0.05, handsHour: 100, hoursMonth: 40, target: 1500, expenses: 1500, savings: 0, hours: 30, sessions: [], exams: 1, sim: null });
  assert.strictEqual(novice.verdict, 'not');
  assert.strictEqual(novice.list.find((c) => c.k === 'proof').st, 'near');
});
t('Elo : converge vers d + 400 log10(p ÷ (1 − p))', () => {
  const R = P.rng(3), Eo = { r: 1000, n: 0 };
  for (let i = 0; i < 6000; i++) P.eloUpdate(Eo, 1200, R() < 0.8 ? 1 : 0);
  const target = 1200 + 400 * Math.log10(4);
  assert(Math.abs(Eo.r - target) < 60, Eo.r + ' vs ' + target);
});
t('ligue : semaine ISO, rivaux stables, montée et descente', () => {
  assert.strictEqual(P.weekKey(new Date(2026, 9, 23)), '2026-W43');
  assert.strictEqual(P.weekKey(new Date(2027, 0, 1)), '2026-W53');
  assert.deepStrictEqual(P.rivals('2026-W43', 1), P.rivals('2026-W43', 1));
  const L = { week: '2026-W42', div: 1, xp: 99999 }, r = P.leagueRoll(L, new Date(2026, 9, 23));
  assert(r.rank === 1 && r.move === 1 && L.div === 2 && L.week === '2026-W43' && L.xp === 0);
  const L2 = { week: '2026-W42', div: 2, xp: 0 }, r2 = P.leagueRoll(L2, new Date(2026, 9, 23));
  assert(r2.move === -1 && L2.div === 1);
  const L3 = { week: '2026-W43', div: 0, xp: 0 }; assert(P.leagueRoll(L3, new Date(2026, 9, 23)) === null);
  const st = P.standings({ week: '2026-W43', div: 0, xp: 50 }, new Date(2026, 9, 23));
  assert(st.length === P.SIZE && st.filter((x) => x.me).length === 1);
});
t('médailles de série', () => {
  assert.deepStrictEqual(P.medalOf(0).next, { name: 'Bronze', need: 7, left: 7 });
  assert(P.medalOf(31).got === 'Argent' && P.medalOf(31).next.name === 'Or' && P.medalOf(150).next === null);
});
t('indice de chance : fréquences théoriques retrouvées sur les mains simulées', () => {
  const R = E.rng(21), tb = new T.Table({ random: R });
  const parts = []; // l'historique de la table garde les 300 dernières mains : export par tranches
  for (let h = 1; h <= 3000; h++) { tb.newHand(); let k = 0; while (!tb.done && k++ < 300) { tb.runBots(); if (!tb.done) tb.autoHero('reg'); } if (h % 300 === 0) parts.push(tb.exportHH()); }
  const a = H.analyze(parts.join('\n\n')), L = P.luck(a.me);
  assert(a.me.hands >= 2900 && a.me.dealt.n === a.me.hands && a.me.curve.length === a.me.hands, a.me.hands);
  assert(Math.abs(L.prem.z) < 4 && (!L.sets || Math.abs(L.sets.z) < 4), JSON.stringify(L));
  const last = a.me.curve[a.me.curve.length - 1];
  assert(Math.abs(last[0] - a.me.netBB) < 1e-6);
  console.log(`    premium ${a.me.dealt.prem}/${a.me.dealt.n} (attendu ${(a.me.dealt.n * P.P_PREM).toFixed(0)}), sets ${a.me.sets.hit}/${a.me.sets.n}, ${L.allin ? L.allin.n + ' tapis, z ' + L.allin.z.toFixed(2) : 'aucun tapis'}, indice global ${L.z.toFixed(2)}`);
});
t('check-in : feu vert, session courte, pas de session', () => {
  assert.strictEqual(P.checkin({ sleep: 5, energy: 4, calm: 4, focus: 4 }).level, 'go');
  assert.strictEqual(P.checkin({ sleep: 3, energy: 3, calm: 4, focus: 3 }).level, 'short');
  assert.strictEqual(P.checkin({ sleep: 5, energy: 5, calm: 1, focus: 5 }).level, 'stop');
  assert.strictEqual(P.checkin({ sleep: 5, energy: 5, calm: 5, focus: 5 }, [{ date: '2026-10-23', tilt: 2, result: -5 }], '2026-10-23').level, 'stop');
  assert.strictEqual(P.checkin({ sleep: 5, energy: 5, calm: 5, focus: 5, money: true }).level, 'short');
});
t('carte de tilt : 9 déclencheurs, fiches complètes', () => {
  assert(P.TRIGGERS.length === 9 && P.TRIGGERS.every((x) => x.fiche.length === 5 && x.fiche.every((s) => s.length > 10)) && P.ZONES.length === 3);
});
t('Spin & Go : table publiée (10 millions), rake 7 %, partage au-delà de ×20, seuil de rentabilité', () => {
  assert.strictEqual(P.SPIN.rows.reduce((a, r) => a + r[1], 0), 1e7);
  assert(Math.abs(P.spinRake() - 0.07) < 0.001, P.spinRake());
  assert(P.spinPrize(2, 1) === 10 && P.spinPrize(2, 2) === 0 && P.spinPrize(100, 1) === 400 && P.spinPrize(100, 3) === 40);
  const be = 1 / (3 * (1 - P.spinRake())), lo = P.spinSim(be - 0.05, 0.33, 300, 400), hi = P.spinSim(be + 0.05, 0.33, 300, 400);
  assert(lo.p50 < 0 && hi.p50 > 0 && hi.pWin > lo.pWin);
});
console.log(n + ' tests réussis');
