// Ranges d'ouverture (RFI, premier à entrer dans le coup) — Hold'em No Limit 6-max, 100 bb, en ligne.
// Point de départ standard inspiré des charts publics : pas une sortie de solveur. Contre des fish, on élargit (voir cours).
(function (root) {
  const RFI = {
    UTG: { label: 'UTG (sous le pistolet)', size: '2,5 bb', range: '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo' },
    HJ: { label: 'HJ (hijack)', size: '2,5 bb', range: '22+, A2s+, K8s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, ATo+, KJo+, QJo' },
    CO: { label: 'CO (cutoff)', size: '2,5 bb', range: '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, KTo+, QTo+, JTo' },
    BTN: { label: 'BTN (bouton)', size: '2,5 bb', range: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o' },
    SB: { label: 'SB (petite blinde)', size: '3 bb', range: '22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A2o+, K9o+, Q9o+, J9o+, T9o' },
  };
  const POS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
  const api = { RFI, POS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Charts = api;
})(typeof window !== 'undefined' ? window : globalThis);
