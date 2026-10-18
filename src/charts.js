// Ranges préflop — Hold'em No Limit 6-max, 100 bb, en ligne.
// Point de départ standard inspiré des charts publics : pas une sortie de solveur. Contre des fish, on élargit (voir cours).
(function (root) {
  // Premier à entrer dans le coup (RFI).
  const RFI = {
    UTG: { label: 'UTG (sous le pistolet)', size: '2,5 bb', range: '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo' },
    HJ: { label: 'HJ (hijack)', size: '2,5 bb', range: '22+, A2s+, K8s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, ATo+, KJo+, QJo' },
    CO: { label: 'CO (cutoff)', size: '2,5 bb', range: '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, KTo+, QTo+, JTo' },
    BTN: { label: 'BTN (bouton)', size: '2,5 bb', range: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o' },
    SB: { label: 'SB (petite blinde)', size: '3 bb', range: '22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A2o+, K9o+, Q9o+, J9o+, T9o' },
  };
  const POS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
  const SEATS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  // Face à une ouverture (personne d'autre n'est entré) : FACING[ouvreur][héros] = { threebet, call }.
  // En position : 3-bet ou call. Petite blinde : surtout 3-bet ou fold. Grosse blinde : défense large en call.
  const EP3 = 'QQ+, AKs, AKo';
  const FACING = {
    UTG: {
      HJ: { threebet: EP3, call: 'JJ-99, AQs, AJs, KQs' },
      CO: { threebet: EP3, call: 'JJ-88, AQs, AJs, KQs, QJs, JTs' },
      BTN: { threebet: EP3 + ', A5s', call: 'JJ-66, AQs-ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo' },
      SB: { threebet: 'JJ+, AKs, AKo, AQs', call: '' },
      BB: { threebet: EP3, call: 'JJ-22, AQs-A2s, KTs+, QTs+, J9s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, AQo-AJo, KQo' },
    },
    HJ: {
      CO: { threebet: 'QQ+, AK, A5s', call: 'JJ-77, AQs-ATs, KQs, KJs, QJs, JTs, T9s' },
      BTN: { threebet: 'QQ+, AK, AQs, A5s-A4s', call: 'JJ-55, AJs-A9s, KQs-KTs, QJs, QTs, JTs, T9s, 98s, 87s, AQo, KQo' },
      SB: { threebet: 'TT+, AQ+, AJs, KQs, A5s', call: '' },
      BB: { threebet: 'QQ+, AK, A5s', call: 'JJ-22, AQs-A2s, K9s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, AQo-ATo, KJo+, QJo' },
    },
    CO: {
      BTN: { threebet: 'JJ+, AQ+, A5s-A4s, KQs, 76s', call: 'TT-22, AJs-A6s, KJs-K9s, QJs, QTs, JTs, J9s, T9s, 98s, 87s, AJo, KQo' },
      SB: { threebet: 'TT+, AJ+, KQ, A5s-A3s, KJs, QJs', call: '' },
      BB: { threebet: 'JJ+, AQ+, A5s-A4s', call: 'TT-22, AJs-A2s, K7s+, Q8s+, J8s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, AJo-A8o, KTo+, QTo+, JTo' },
    },
    BTN: {
      SB: { threebet: '99+, AT+, KJ+, A5s-A2s, KTs, QJs, QTs, JTs', call: '' },
      BB: { threebet: 'TT+, AJ+, KQ, A5s-A2s, K9s', call: '99-22, ATs-A6s, K2s+, Q5s+, J7s+, T7s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, ATo-A2o, KJo-K8o, Q9o+, J9o+, T9o, 98o' },
    },
    SB: {
      BB: { threebet: '99+, AT+, KJ+, A5s-A2s, K9s, Q9s, J9s, T9s', call: '88-22, A9s-A6s, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A9o-A2o, KTo-K5o, Q8o+, J8o+, T8o+, 97o+, 87o' },
    },
  };
  // Décision de référence face à une ouverture : le 3-bet est prioritaire sur le call.
  const cache = {};
  function facingAction(opener, hero, hand) {
    const f = FACING[opener]?.[hero]; if (!f) return null;
    const k = opener + hero, E = root.Engine || require('./engine.js');
    const c = cache[k] || (cache[k] = { t: E.parseRange(f.threebet), c: f.call ? E.parseRange(f.call) : new Set() });
    return c.t.has(hand) ? '3bet' : c.c.has(hand) ? 'call' : 'fold';
  }
  const api = { RFI, POS, SEATS, FACING, facingAction };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Charts = api;
})(typeof window !== 'undefined' ? window : globalThis);
