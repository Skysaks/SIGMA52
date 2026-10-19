// Équité préflop multiway : chaque main (169) contre k adversaires (2 à 5) qui ont chacun le top X % des mains.
// Monte-Carlo, écrit src/live_multi.js. Usage : node tools/build_multi.js [tirages par case]
const E = require('../src/engine.js'), TS = require('../src/table.js'), fs = require('fs'), path = require('path');
const IT = +(process.argv[2] || 2500), XS = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 1], KS = [2, 3, 4, 5];
const PCT = TS.preflopPct(), R = E.rng(2026);
const comboList = (x) => E.ALL169.filter((h, i) => PCT[i] < x + 1e-9).flatMap((h) => E.combos(h));
const lists = XS.map((x) => comboList(x === 1 ? 1.01 : x));
const data = new Int16Array(169 * KS.length * XS.length);
const t0 = Date.now(), used = new Uint8Array(52), seven = new Array(7);
for (let hi = 0; hi < 169; hi++) {
  const hc = E.combos(E.ALL169[hi]);
  for (let ki = 0; ki < KS.length; ki++) for (let xi = 0; xi < XS.length; xi++) {
    const k = KS[ki], L = lists[xi]; let eq = 0, done = 0;
    for (let it = 0; it < IT; it++) {
      used.fill(0); const h = hc[Math.floor(R() * hc.length)]; used[h[0]] = used[h[1]] = 1;
      const opp = []; let ok = true;
      for (let j = 0; j < k; j++) { let tries = 0, c; do { c = L[Math.floor(R() * L.length)]; } while ((used[c[0]] || used[c[1]]) && ++tries < 50); if (tries >= 50) { ok = false; break; } used[c[0]] = used[c[1]] = 1; opp.push(c); }
      if (!ok) continue;
      const bd = []; while (bd.length < 5) { const c = Math.floor(R() * 52); if (!used[c]) { used[c] = 1; bd.push(c); } }
      for (let q = 0; q < 5; q++) seven[q + 2] = bd[q];
      seven[0] = h[0]; seven[1] = h[1]; const mine = E.evaluate(seven); let best = mine, cnt = 1, beat = false;
      for (const o of opp) { seven[0] = o[0]; seven[1] = o[1]; const v = E.evaluate(seven); if (v > best) { beat = true; break; } if (v === mine) cnt++; }
      if (!beat) eq += 1 / cnt; done++;
    }
    data[(hi * KS.length + ki) * XS.length + xi] = Math.round((eq / done) * 1000);
  }
  if (hi % 20 === 0) console.log(hi, E.ALL169[hi], Math.round((Date.now() - t0) / 1000) + ' s');
}
fs.writeFileSync(path.join(__dirname, '../src/live_multi.js'), `// Généré par tools/build_multi.js (${IT} tirages par case) : équité ×1000 de chaque main contre k adversaires (top X % chacun).\n(function (root) { const M = { XS: ${JSON.stringify(XS)}, KS: ${JSON.stringify(KS)}, it: ${IT}, data: ${JSON.stringify([...data])} };\n  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.LiveMulti = M; })(typeof window !== 'undefined' ? window : globalThis);\n`);
console.log('ok', Math.round((Date.now() - t0) / 1000) + ' s');
