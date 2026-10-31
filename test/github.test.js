// Tests des situations étendues et du planificateur GitHub : node test/github.test.js
const assert = require('assert'), { execFileSync } = require('child_process'), path = require('path');
const SX = require('../src/scen_ext.js'), PF = require('../src/postflop.js'), D = require('../src/preflop_data.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
t('situations étendues : ranges pondérées valides, pots et tapis cohérents', () => {
  const L = SX.build(D); assert(L.length >= 15, L.length);
  for (const s of L) { assert(PF.parseWeighted(s.ra).length > 10 && PF.parseWeighted(s.rb).length > 10, s.id); assert(s.pot > 0 && s.stack > 0, s.id); }
  const f = L.find((x) => x.id === '4bp-BTN-BB'); assert.strictEqual(f.pot, 44.5); assert.strictEqual(f.stack, 78);
  assert(L.find((x) => x.id === 'srp-BTN-BB-150').stack === 147.5);
});
t('planificateur : budget respecté, paliers dans l\'ordre', () => {
  const out = execFileSync('node', [path.join(__dirname, '../tools/plan_queue.js'), '--dry', '--json']).toString().trim().split('\n').pop();
  const P = JSON.parse(out); assert(P.left >= 0, 'budget dépassé'); assert(P.budget <= 700);
  for (const m of P.matrix) assert(m.n >= 1 && m.k < m.n && m.nf >= 91, JSON.stringify(m));
});
console.log(n, 'tests passés');
