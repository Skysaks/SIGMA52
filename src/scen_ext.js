// Scénarios étendus du Solveur et de la bibliothèque : pots 4-bet, pot limpé de la petite blinde, autres profondeurs (cash 40, 60
// et 150 bb) et tournoi avec ante (40 bb). Ranges pondérées tirées du solveur préflop (src/preflop_data.js, tools/build_preflop.js) :
// chaque joueur arrive au flop avec la fréquence de chaque main sur toute la ligne (ouvrir × payer le 3-bet, etc.).
// Écartés : pot limpé SB contre BB (la grosse blinde ne mise jamais après le check : résultat suspect, coût élevé), 4-bet SB contre BB (0,6 % des mains pour la SB) et SB contre BB en tournoi (défense BB à 86 %) : lignes trop extrêmes
// du solveur préflop simplifié pour une étude utile après le flop.
// Les 16 scénarios de base (100 bb, charts de référence) restent définis dans le Solveur et tools/build_aggregate.js.
(function (root) {
  const E = root.Engine || (typeof require !== 'undefined' ? require('./engine.js') : null);
  const ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
  // [type, ouvreur, autre joueur, configuration préflop, priorité]
  const DEFS = [
    ['4bp', 'BTN', 'BB', 'cash100', 1], ['4bp', 'CO', 'BTN', 'cash100', 1], ['4bp', 'BTN', 'SB', 'cash100', 1],
    ['srp', 'BTN', 'BB', 'cash40', 2], ['3bp', 'BTN', 'BB', 'cash40', 2], ['srp', 'CO', 'BB', 'cash40', 2], ['srp', 'SB', 'BB', 'cash40', 2],
    ['srp', 'BTN', 'BB', 'cash60', 2], ['3bp', 'BTN', 'BB', 'cash60', 2],
    ['srp', 'BTN', 'BB', 'cash150', 2], ['3bp', 'BTN', 'BB', 'cash150', 2], ['srp', 'CO', 'BB', 'cash150', 2], ['3bp', 'CO', 'BTN', 'cash150', 2], ['4bp', 'BTN', 'BB', 'cash150', 2],
    ['srp', 'BTN', 'BB', 'mtt40', 3], ['srp', 'CO', 'BB', 'mtt40', 3], ['3bp', 'BTN', 'BB', 'mtt40', 3]
  ];
  const TYPE = { srp: 'Pot simple', '3bp': 'Pot 3-bet', '4bp': 'Pot 4-bet', limp: 'Pot limpé' };
  const num = (l) => { const m = String(l).match(/([\d]+(?:,\d+)?)\s*bb/); return m ? +m[1].replace(',', '.') : null; };
  function line(D, cfg, key, k) {
    const n = cfg.nodes.find((x) => x.key === key); if (!n) return null;
    const a = n.acts.findIndex((x) => x.k === k); if (a < 0) return null;
    return { f: Array.from(n.f[a], (ch) => D.alph.indexOf(ch) / 63), size: num(n.acts[a].l) };
  }
  const mul = (a, b) => a.map((x, i) => x * b[i]);
  // Range pondérée lisible par le Solveur (postflop.parseWeighted) ; les mains sous 2 % sont retirées.
  const wtext = (arr) => E.ALL169.map((h, i) => [h, arr[i]]).filter(([, w]) => w >= 0.02).map(([h, w]) => (w >= 0.98 ? h : `${h}:${w.toFixed(2)}`)).join(', ');
  const pct = (arr) => E.ALL169.reduce((s, h, i) => s + arr[i] * E.combos(h).length, 0) / 1326;
  const depthTag = (cfg) => (cfg.id === 'cash100' ? '' : cfg.fmt === 'mtt' ? '-t' + cfg.stack : '-' + cfg.stack);
  const depthLabel = (cfg) => (cfg.fmt === 'mtt' ? `tournoi ${cfg.stack} bb avec ante` : `${cfg.stack} bb`);

  function build(D) {
    const out = [];
    if (!D || !D.configs) return out;
    for (const [kind, x, y, cid, prio] of DEFS) {
      const cfg = D.configs.find((c) => c.id === cid); if (!cfg) continue;
      const S = cfg.stack, ante = cfg.ante || 0, inH = [x, y], dead = (inH.includes('SB') ? 0 : 0.5) + (inH.includes('BB') ? 0 : 1) + ante;
      let ra, rb, pot, stack, agg, note;
      if (kind === 'limp') {
        const l = line(D, cfg, 'rfi:SB', 'c'), c = line(D, cfg, 'lp:SB', 'x'); if (!l || !c) continue;
        ra = l.f; rb = c.f; pot = 2 + ante; stack = S - 1; agg = 'BB'; note = 'la petite blinde complète, la grosse blinde checke';
      } else {
        const op = line(D, cfg, 'rfi:' + x, 'r'); if (!op) continue;
        const o = op.size || cfg.open;
        if (kind === 'srp') {
          const c = line(D, cfg, `vo:${x}:${y}`, 'c'); if (!c) continue;
          ra = op.f; rb = c.f; pot = 2 * o + dead; stack = S - o; agg = x; note = `${x} ouvre à ${o} bb, ${y} paie`;
        } else {
          const t3 = line(D, cfg, `vo:${x}:${y}`, 'r'); if (!t3 || !t3.size) continue;
          if (kind === '3bp') {
            const c = line(D, cfg, `v3:${x}:${y}`, 'c'); if (!c) continue;
            ra = mul(op.f, c.f); rb = t3.f; pot = 2 * t3.size + dead; stack = S - t3.size; agg = y; note = `${y} 3-bet à ${t3.size} bb, ${x} paie`;
          } else {
            const t4 = line(D, cfg, `v3:${x}:${y}`, 'r'), c = line(D, cfg, `v4:${x}:${y}`, 'c'); if (!t4 || !t4.size || !c) continue;
            ra = mul(op.f, t4.f); rb = mul(t3.f, c.f); pot = 2 * t4.size + dead; stack = S - t4.size; agg = x; note = `${y} 3-bet à ${t3.size} bb, ${x} 4-bet à ${t4.size} bb, ${y} paie`;
          }
        }
      }
      if (stack <= 0 || pct(ra) < 0.002 || pct(rb) < 0.002) continue;
      const id = `${kind}-${x}-${y}${depthTag(cfg)}`;
      out.push({ id, kind, label: `${TYPE[kind]} · ${x} contre ${y} · ${depthLabel(cfg)}`, type: `${TYPE[kind]}${cfg.id === 'cash100' ? '' : ' · ' + depthLabel(cfg)}`, a: x, b: y, agg,
        ra: wtext(ra), rb: wtext(rb), pot: +pot.toFixed(2), stack: +stack.toFixed(2), cfg: cid, prio, note, ext: true,
        spot: `${TYPE[kind]}, ${x} contre ${y}, ${depthLabel(cfg)}`, pctA: pct(ra), pctB: pct(rb) });
    }
    return out;
  }
  // Rôles pour la bibliothèque : qui parle en premier (OOP), l'agresseur, le joueur étudié.
  function roles(sc) {
    const xOOP = ORDER.indexOf(sc.a) < ORDER.indexOf(sc.b), [oN, oR, iN, iR] = xOOP ? [sc.a, sc.ra, sc.b, sc.rb] : [sc.b, sc.rb, sc.a, sc.ra];
    const aggOOP = sc.agg === oN;
    return { oN, oR, iN, iR, actor: aggOOP ? 'oop' : 'ip', resp: aggOOP ? iN : oN, title: aggOOP ? `que fait ${sc.agg} (agresseur, hors de position) au flop ?` : `que fait ${sc.agg} quand ${oN} check ?` };
  }
  const api = { build, roles, DEFS, TYPE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ScenExt = api;
})(typeof window !== 'undefined' ? window : globalThis);
