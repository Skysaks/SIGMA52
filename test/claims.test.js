// Chiffres du cours recalculés à chaque test : node test/claims.test.js
// Chaque affirmation chiffrée importante du cours est recalculée par le moteur ; le test échoue si un changement de ranges,
// de moteur ou de texte rend le cours faux (valeur recalculée hors tolérance, ou texte du cours qui ne contient plus la valeur).
const fs = require('fs'), path = require('path'), assert = require('assert');
const E = require('../src/engine.js'), C = require('../src/charts.js'), SV = require('../src/solver.js'), R = require('../src/runout.js');
require('../src/champ_stats.js'); const CS = globalThis.ChampStats || require('../src/champ_stats.js');
const pc = E.parseCards, src = (f) => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
// Équité exacte main contre range (moyenne par combo) : énumération complète, y compris préflop (1,7 million de boards par combo).
const pre = (a, b) => { const known = new Set([...a, ...b]), deck = []; for (let c = 0; c < 52; c++) if (!known.has(c)) deck.push(c); const ha = [a[0], a[1], 0, 0, 0, 0, 0], hb = [b[0], b[1], 0, 0, 0, 0, 0], n = deck.length; let s = 0, t = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) for (let l = k + 1; l < n; l++) for (let m = l + 1; m < n; m++) { ha[2] = hb[2] = deck[i]; ha[3] = hb[3] = deck[j]; ha[4] = hb[4] = deck[k]; ha[5] = hb[5] = deck[l]; ha[6] = hb[6] = deck[m]; const x = E.evaluate(ha), y = E.evaluate(hb); s += x > y ? 1 : x === y ? 0.5 : 0; t++; }
  return s / t; };
const exact = (h, r, bd) => { const dead = [...pc(h), ...pc(bd)], cs = E.rangeCombos(E.parseRange(r), dead); let s = 0; for (const c of cs) s += bd ? E.equity([{ hand: pc(h) }, { hand: c }], pc(bd)).equity[0] : pre(pc(h), c); return s / cs.length; };
const hv = (a, b, bd) => E.equity([{ hand: pc(a) }, { hand: pc(b) }], pc(bd || '')).equity[0];
const share = (sol, k) => { let w = 0, t = 0, i = 0; for (let a = 0; a < 13; a++) for (let b = 0; b < 13; b++) { const n = a === b ? 6 : b > a ? 4 : 12; w += sol[k][i++] * n; t += n; } return w / t; };
const pctFr = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + ' %';
let n = 0;
async function claim(name, value, expected, tol, file, text) {
  const v = await value();
  assert(Math.abs(v - expected) <= tol, `${name} : recalculé ${v.toFixed(4)}, le cours dit ${expected}`);
  for (const t of [].concat(text)) assert(src(file).includes(t), `${name} : « ${t} » introuvable dans ${file}`);
  n++; console.log('ok', name, '→', v.toFixed(4));
}
(async () => {
  await claim('K♥J♥ sur K♦7♣2♠ contre la défense BB face au CO', () => exact('KhJh', C.FACING.CO.BB.call, 'Kd7c2s'), 0.830, 0.0006, 'course_more.js', '<strong>83,0 %</strong>');
  await claim('JJ sur A♠8♦3♣ contre TT+, AQ+, AJs, KQs', () => exact('JcJd', 'TT+,AQ+,AJs,KQs', 'As8d3c'), 0.236, 0.0006, 'course_more.js', '<strong>23,6 %</strong>');
  await claim('AK contre QQ+, AKs', () => exact('AhKd', 'QQ+,AKs', ''), 0.332, 0.0006, 'course_360.js', '33,2 %');
  await claim('AK contre QQ+, AK', () => exact('AhKd', 'QQ+,AK', ''), 0.388, 0.0006, 'course_360.js', '38,8 %');
  await claim('AK contre JJ+, AK, A5s, A4s', () => exact('AhKd', 'JJ+,AK,A5s,A4s', ''), 0.450, 0.0006, 'course_360.js', '45,0 %');
  await claim('88 contre A♥9♥ sur 9♣8♥4♥', () => hv('8s8d', 'Ah9h', '9c8h4h'), 0.702, 0.0006, 'course_more.js', '70,2 %');
  await claim('A♥5♥ contre K♠Q♦ sur K♥8♥2♣', () => hv('Ah5h', 'KsQd', 'Kh8h2c'), 0.459, 0.0006, 'course_more.js', '<strong>45,9 %</strong>');
  // Matchs préflop du niveau 1 : moyenne exacte sur toutes les combinaisons de couleurs (isomorphisme des couleurs).
  const canon = (a, b) => { const m = {}; let k = 0; const f = (c) => { if (!((c & 3) in m)) m[c & 3] = k++; return (c >> 2) * 4 + m[c & 3]; }; return [...[...a].sort((x, y) => y - x).map(f), ...[...b].sort((x, y) => y - x).map(f)].join(','); };
  const memo = new Map(), cls = (x, y) => { let s = 0, n = 0; for (const a of E.combos(x)) for (const b of E.combos(y)) { if (a.includes(b[0]) || a.includes(b[1])) continue; const k = canon(a, b); if (!memo.has(k)) memo.set(k, pre(a, b)); s += memo.get(k); n++; } return s / n; };
  for (const [x, y, v, txt, tol] of [['QQ', 'AKo', 0.57, '57 % / 43 %', 0.005], ['JJ', '55', 0.80, '80 % / 20 %', 0.006], ['AKo', 'AQo', 0.74, '74 % / 26 %', 0.005], ['AKo', '87s', 0.588, '58,8 % / 41,2 %', 0.0006], ['22', 'AKo', 0.53, '53 % / 47 %', 0.005], ['AA', '72o', 0.88, '88 % / 12 %', 0.005]])
    await claim(`${x} contre ${y} préflop`, () => cls(x, y), v, tol, 'course_l1.js', txt);
  await claim('AKs contre 77 préflop', () => cls('AKs', '77'), 0.477, 0.0006, 'course_deep2.js', 'AKs 47,7 %, 77 52,3 %');
  for (const [S, push, call] of [[5, '71,6 %', '62,1 %'], [10, '58,4 %', '37,4 %'], [15, '45,7 %', '28,6 %'], [20, '40,3 %', '21,7 %']]) {
    const sol = SV.solveChip(S, 0);
    await claim(`Push/fold HU ${S} bb : la SB pousse`, () => share(sol, 'push'), +push.replace(',', '.').replace(' %', '') / 100, 0.0005, 'course_l3.js', `<tr><td>${S} bb</td><td>${push}</td><td>${call}</td></tr>`);
    await claim(`Push/fold HU ${S} bb : la BB paie`, () => share(sol, 'call'), +call.replace(',', '.').replace(' %', '') / 100, 0.0005, 'course_l3.js', [call]);
  }
  await claim('ICM 5 000 / 3 000 / 2 000, prix 50/30/20 : le chip leader', () => SV.icm([5000, 3000, 2000], [50, 30, 20])[0] / 100, 0.384, 0.0006, 'course_deep3.js', '38,4');
  const A = E.parseRange(C.RFI.BTN.range), B = E.parseRange(C.FACING.BTN.BB.call);
  const k72 = await R.turnReport(A, B, pc('Ks7d2c'), null, { yield: false }), n96 = await R.turnReport(A, B, pc('9h8h6c'), null, { yield: false });
  await claim('Bouton contre BB sur K♠7♦2♣ (flop)', () => k72.flopEq, 0.527, 0.0006, 'course_v22.js', '52,7 %');
  await claim('Bouton contre BB sur 9♥8♥6♣ (flop)', () => n96.flopEq, 0.499, 0.0006, 'course_v22.js', '<strong>49,9 %</strong>');
  const turn = (r, c) => r.turns.find((t) => t.card === pc(c)[0]);
  await claim('9♥8♥6♣, turn 7♣ : équité du bouton', () => turn(n96, '7c').eqA, 0.473, 0.0006, 'course_v22.js', '47,3 %');
  await claim('9♥8♥6♣, turn 10♣ : équité du bouton', () => turn(n96, 'Tc').eqA, 0.480, 0.0006, 'course_v22.js', '48,0 %');
  await claim('9♥8♥6♣, turn dame ♣ : équité du bouton', () => turn(n96, 'Qc').eqA, 0.509, 0.0006, 'course_v22.js', '50,9 %');
  await claim('9♥8♥6♣, turn as ♣ : équité du bouton', () => turn(n96, 'Ac').eqA, 0.521, 0.0006, 'course_v22.js', '52,1 %');
  // Champions : résultats mesurés cités dans le cours (bb/100 du héros régulier, arrondis).
  for (const [id, v] of [['presseur_hu', -23], ['predateur', -13], ['equilibre', -10], ['small_ball', -7], ['ultra_lag', 13]]) {
    await claim(`Champions : héros régulier contre ${id}`, () => CS.stats[id].hu.hero, v, 0.75, 'course_champions.js', (v < 0 ? '−' : '+') + Math.abs(v));
  }
  console.log(n + ' chiffres du cours vérifiés');
})().catch((e) => { console.error(e.message); process.exit(1); });
