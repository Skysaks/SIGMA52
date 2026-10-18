// Tests du moteur : node test/engine.test.js
const E = require('../src/engine.js');
const assert = require('assert');
const C = (s) => E.parseCards(s);
const v = (s) => E.evaluate(C(s));
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('catégories', () => {
  assert.strictEqual(E.categoryName(v('AsKsQsJsTs2d3c')), 'Quinte flush');
  assert.strictEqual(E.categoryName(v('9h9d9s9c2d3c4h')), 'Carré');
  assert.strictEqual(E.categoryName(v('9h9d9sKcKd3c4h')), 'Full');
  assert.strictEqual(E.categoryName(v('2h7h9hJhKh3c4d')), 'Couleur');
  assert.strictEqual(E.categoryName(v('As2d3c4h5s9dKc')), 'Suite');
  assert.strictEqual(E.categoryName(v('7h7d7sKc2d3c9h')), 'Brelan');
  assert.strictEqual(E.categoryName(v('7h7dKsKc2d3c9h')), 'Double paire');
  assert.strictEqual(E.categoryName(v('7h7dKsQc2d3c9h')), 'Paire');
  assert.strictEqual(E.categoryName(v('7h8dKsQc2d3c9h')), 'Hauteur');
});
t('ordre et kickers', () => {
  assert(v('As2d3c4h5s9dKc') < v('2s3d4c5h6s9dKc'), 'roue < suite au 6');
  assert(v('AhKd7c7s2h3d9c') > v('AhQd7c7s2h3d9c'), 'kicker roi > dame');
  assert.strictEqual(v('AhKdQcJs9h2d3c'), v('AsKcQdJh9c2h3s'), 'égalité stricte');
  assert(v('9h9d9sKcKdQcQh') > v('9h9d9s8c8dQcJh'), 'full : deux brelans / paires');
  assert(v('KhKdKs9c9d9h2c') > v('QhQdQsAcAd9h2c'), 'full aux rois > full aux dames');
  assert(v('Ah2h3h4h5h') < v('2h3h4h5h6h'), 'quinte flush roue < au 6');
});
t('ranges', () => {
  assert.strictEqual(E.parseRange('22+').size, 13);
  assert.strictEqual(E.rangeCombos('22+').length, 78);
  assert.strictEqual(E.rangeCombos('A2s+').length, 48);
  assert.deepStrictEqual([...E.parseRange('KTs+')].sort(), ['KJs', 'KQs', 'KTs']);
  assert.deepStrictEqual([...E.parseRange('76s-54s')].sort(), ['54s', '65s', '76s']);
  assert.strictEqual(E.rangeCombos('AK').length, 16);
  assert.deepStrictEqual([...E.parseRange('AQs-ATs')].sort(), ['AJs', 'AQs', 'ATs']);
  assert.deepStrictEqual([...E.parseRange('jj-99, kqo')].sort(), ['99', 'JJ', 'KQo', 'TT']);
  assert.strictEqual(E.rangeCombos('random').length, 1326);
  assert.strictEqual(E.abstractOf(E.card('Kd'), E.card('Ad')), 'AKs');
  assert.strictEqual(E.abstractOf(E.card('Kd'), E.card('Ac')), 'AKo');
});
// Valeur exacte (énumération des 1 712 304 boards) : 81,255 % sans couleur commune.
t('équité préflop AsAh vs KdKc ≈ 81,3 %', () => {
  const r = E.equity([{ hand: C('AsAh') }, { hand: C('KdKc') }], [], { iterations: 200000, random: E.rng(7) });
  assert(Math.abs(r.equity[0] - 0.8126) < 0.005, r.equity[0]);
});
t('équité préflop 22 vs AKo ≈ 52 %', () => {
  const r = E.equity([{ hand: C('2s2h') }, { hand: C('AdKc') }], [], { iterations: 200000, random: E.rng(3) });
  assert(Math.abs(r.equity[0] - 0.527) < 0.01, r.equity[0]);
});
t('outs et équité exacte au turn : 15 outs sur 44', () => {
  const hero = C('AhKh'), vil = C('QcQs'), board = C('2h7hJd3c');
  assert.strictEqual(E.outs(hero, vil, board).length, 15);
  const r = E.equity([{ hand: hero }, { hand: vil }], board);
  assert(r.exact && Math.abs(r.equity[0] - 15 / 44) < 1e-9);
});
t('équité main vs range (AA vs random ≈ 85 %)', () => {
  const r = E.equity([{ hand: C('AsAd') }, { combos: E.rangeCombos('random') }], [], { iterations: 100000, random: E.rng(11) });
  assert(Math.abs(r.equity[0] - 0.852) < 0.008, r.equity[0]);
});

// Contrôle croisé : l'évaluateur rapide doit donner exactement la même valeur qu'un évaluateur naïf (meilleure combinaison de 5 parmi 7).
function five(cs){ const r=cs.map(c=>c>>2).sort((a,b)=>b-a), s=cs.map(c=>c&3);
 const fl=s.every(x=>x===s[0]); const cnt={}; r.forEach(x=>cnt[x]=(cnt[x]||0)+1);
 const groups=Object.entries(cnt).map(([k,v])=>[v,+k]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
 const uniq=[...new Set(r)]; let st=-1;
 if(uniq.length===5){ if(uniq[0]-uniq[4]===4) st=uniq[0]; else if(uniq.join()==='12,3,2,1,0') st=3; }
 let cat, ks;
 if(st>=0&&fl){cat=8;ks=[st];} else if(groups[0][0]===4){cat=7;ks=[groups[0][1],groups[1][1]];}
 else if(groups[0][0]===3&&groups[1][0]===2){cat=6;ks=[groups[0][1],groups[1][1]];}
 else if(fl){cat=5;ks=r;} else if(st>=0){cat=4;ks=[st];}
 else if(groups[0][0]===3){cat=3;ks=groups.map(g=>g[1]);}
 else if(groups[0][0]===2&&groups[1][0]===2){cat=2;ks=groups.map(g=>g[1]);}
 else if(groups[0][0]===2){cat=1;ks=groups.map(g=>g[1]);} else {cat=0;ks=r;}
 let v=cat; for(let i=0;i<5;i++) v=v*16+(ks[i]??0); return v; }
function best(c){ let b=-1; for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){ const f=c.filter((_,k)=>k!==i&&k!==j); b=Math.max(b,five(f)); } return b; }
t('évaluateur = référence naïve sur 50 000 mains aléatoires', () => {
  const R = E.rng(5);
  for (let i = 0; i < 50000; i++) { const used = new Set(), c = []; while (c.length < 7) { const x = (R() * 52) | 0; if (!used.has(x)) { used.add(x); c.push(x); } }
    assert.strictEqual(E.evaluate(c), best(c), c.map(E.cardStr).join(' ')); }
});

// Contenu : chiffres du cours recalculés.
const Course = require('../src/course.js'), Charts = require('../src/charts.js');
t('fréquences 7 cartes du cours (Monte-Carlo 400 000 mains)', () => {
  const R = E.rng(9), cnt = new Array(9).fill(0), N = 400000;
  for (let i = 0; i < N; i++) { const used = new Set(), c = []; while (c.length < 7) { const x = (R() * 52) | 0; if (!used.has(x)) { used.add(x); c.push(x); } } cnt[E.category(E.evaluate(c))]++; }
  const exp = [17.4, 43.8, 23.5, 4.83, 4.62, 3.03, 2.60, 0.168, 0.031];
  cnt.forEach((k, i) => assert(Math.abs(k / N * 100 - exp[i]) < 0.25, `${E.CAT_FR[i]} ${k / N * 100}`));
});
t('outs du cours (probabilités exactes)', () => {
  const one = (o) => o / 47 * 100, two = (o) => (1 - (47 - o) * (46 - o) / (47 * 46)) * 100;
  [[9, 19.1, 35.0], [8, 17.0, 31.5], [15, 31.9, 54.1], [4, 8.5, 16.5], [6, 12.8, 24.1]].forEach(([o, a, b]) => {
    assert(Math.abs(one(o) - a) < 0.06 && Math.abs(two(o) - b) < 0.06, o); });
});
t('situations bien formées', () => {
  assert(Course.SITUATIONS.length >= 35);
  Course.SITUATIONS.forEach((s) => assert(s.ok >= 0 && s.ok < s.opts.length && s.why, s.q));
});
t('ranges RFI lisibles et croissantes', () => {
  let prev = 0; Charts.POS.slice(0, 4).forEach((p) => { const pct = E.rangePct(E.parseRange(Charts.RFI[p].range)); assert(pct > prev, p); prev = pct; console.log('   ', p, pct.toFixed(1) + ' %'); });
  console.log('    SB', E.rangePct(E.parseRange(Charts.RFI.SB.range)).toFixed(1) + ' %');
});
console.log(n, 'tests passés au total');
