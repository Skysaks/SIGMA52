// Import GGPoker : node test/gg.test.js
const H = require('../src/hh.js'), E = require('../src/engine.js'), assert = require('assert');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const CASH = `Poker Hand #RC1234567890: Hold'em No Limit ($0.02/$0.05) - 2026/05/10 12:34:56
Table 'RushAndCash123456' 6-max Seat #1 is the button
Seat 1: 4f6a1b2c ($5.12 in chips)
Seat 2: 9b8c7d6e ($4.80 in chips)
Seat 3: Hero ($5 in chips)
Seat 4: 8a9d0e1f ($6.73 in chips)
9b8c7d6e: posts small blind $0.02
Hero: posts big blind $0.05
*** HOLE CARDS ***
Dealt to 4f6a1b2c 
Dealt to 9b8c7d6e 
Dealt to Hero [Ah Kd]
Dealt to 8a9d0e1f 
8a9d0e1f: raises $0.10 to $0.15
4f6a1b2c: folds
9b8c7d6e: folds
Hero: raises $0.40 to $0.55
8a9d0e1f: calls $0.40
*** FLOP *** [7d 2s Jc]
Hero: bets $0.40
8a9d0e1f: calls $0.40
*** TURN *** [7d 2s Jc] [Ks]
Hero: bets $1.10
8a9d0e1f: folds
Uncalled bet ($1.10) returned to Hero
*** SHOWDOWN ***
Hero collected $1.86 from pot
*** SUMMARY ***
Total pot $1.92 | Rake $0.06 | Jackpot $0 | Bingo $0 | Fortune $0 | Tax $0
Board [7d 2s Jc Ks]
Seat 3: Hero (big blind) won ($1.86)`;
const RIT = `Poker Hand #RC1234567891: Hold'em No Limit ($0.05/$0.10) - 2026/05/10 12:40:00
Table 'RushAndCash123457' 6-max Seat #4 is the button
Seat 1: Hero ($10 in chips)
Seat 4: a1b2c3d4 ($10 in chips)
Seat 5: e5f6a7b8 ($10 in chips)
Seat 6: c9d0e1f2 ($10 in chips)
e5f6a7b8: posts small blind $0.05
c9d0e1f2: posts big blind $0.10
*** HOLE CARDS ***
Dealt to Hero [Qs Qh]
Hero: raises $0.15 to $0.25
a1b2c3d4: raises $9.75 to $10 and is all-in
e5f6a7b8: folds
c9d0e1f2: folds
Hero: calls $9.75 and is all-in
Hero: shows [Qs Qh]
a1b2c3d4: shows [Ac Kd]
*** FIRST FLOP *** [2c 7h 9d]
*** FIRST TURN *** [2c 7h 9d] [3s]
*** FIRST RIVER *** [2c 7h 9d 3s] [4h]
*** SECOND FLOP *** [Ah 5c 8s]
*** SECOND TURN *** [Ah 5c 8s] [Td]
*** SECOND RIVER *** [Ah 5c 8s Td] [6d]
*** SHOWDOWN ***
Hero collected $9.94 from pot
a1b2c3d4 collected $9.94 from pot
*** SUMMARY ***
Total pot $20.15 | Rake $0.27 | Jackpot $0 | Bingo $0 | Fortune $0 | Tax $0`;
const MTT = `Poker Hand #TM5555555555: Tournament #222222222, Bounty Hunters Special $10.80 Hold'em No Limit - Level10(150/300(40)) - 2026/05/11 20:00:00
Table '12' 8-max Seat #2 is the button
Seat 1: Hero (4,250 in chips)
Seat 2: 1a2b3c4d (12,000 in chips)
Seat 3: 5e6f7a8b (8,300 in chips)
Hero: posts the ante 40
1a2b3c4d: posts the ante 40
5e6f7a8b: posts the ante 40
5e6f7a8b: posts small blind 150
Hero: posts big blind 300
*** HOLE CARDS ***
Dealt to Hero [Ts Th]
1a2b3c4d: raises 300 to 600
5e6f7a8b: folds
Hero: raises 3,610 to 4,210 and is all-in
1a2b3c4d: folds
Uncalled bet (3,610) returned to Hero
*** SHOWDOWN ***
Hero collected 1,470 from pot
*** SUMMARY ***
Total pot 1,470 | Rake 0 | Jackpot 0 | Bingo 0 | Fortune 0 | Tax 0`;
const all = [CASH, RIT, MTT].join('\n\n');
t('découpage et site GGPoker', () => { const L = H.split(all); assert.strictEqual(L.length, 3); L.forEach((x) => assert.strictEqual(H.parseHand(x).site, 'GGPoker')); });
t('main cash : blindes, héros, cartes, board, actions, net', () => {
  const h = H.parseHand(CASH); assert(h.bb === 0.05 && h.sb === 0.02 && h.hero === 'Hero' && E.cardStr(h.heroCards[0]) === 'Ah');
  assert.strictEqual(h.board.length, 4); assert(h.actions.some((a) => a.p === 'Hero' && a.type === 'raises' && Math.abs(a.to - 0.55) < 1e-9));
  const a = H.analyzeHand(h); assert(Math.abs(a.net.Hero - (1.86 - 0.95)) < 1e-6, a.net.Hero);
});
t('run it twice : premier board gardé, deux encaissements', () => {
  const h = H.parseHand(RIT); assert(h.rit && h.board.length === 5 && E.cardStr(h.board[0]) === '2c'); assert(Math.abs(h.collected.Hero - 9.94) < 1e-9);
});
t('tournoi GGPoker : niveau, blindes, antes, montants avec séparateur de milliers', () => {
  const h = H.parseHand(MTT); assert(h.tournament && h.sb === 150 && h.bb === 300, JSON.stringify([h.sb, h.bb]));
  assert.strictEqual(h.seats[0].stack, 4250); assert(h.actions.some((a) => a.type === 'raises' && a.allin && a.to === 4210));
});
t('analyse complète sur les trois mains', () => { const r = H.analyze(all); assert(r.hero === 'Hero' && r.hands === 3 && r.sites.includes('GGPoker')); });
console.log(n + ' tests réussis');
