// Import d'historiques de mains (Winamax, PokerStars, GGPoker et ses skins) : parsing, statistiques, fuites préflop, EV des all-in, profils adversaires.
// Uniquement des mains que tu as jouées, analysées après la session.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const Charts = root.Charts || require('./charts.js');

  const num = (s) => +String(s).replace(/[€$£\s]|EUR|USD/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  const AMT = '[€$£]?[\\d.,]+[€$£]?';
  const ACT = new RegExp(`^(.+?):? (folds|checks|calls|bets|raises)(?: (${AMT}))?(?: to (${AMT}))?(.*all-in.*)?$`);

  function split(text) {
    return text.replace(/\r/g, '').replace(/^﻿/, '').split(/\n(?=(?:Winamax Poker |PokerStars (?:Hand|Zoom Hand|Game) |Poker Hand #))/).map((s) => s.trim()).filter((s) => /^(Winamax Poker|PokerStars|Poker Hand #)/.test(s));
  }

  function parseHand(txt) {
    const L = txt.split('\n').map((l) => l.trim()).filter(Boolean);
    const site = /^Winamax/.test(L[0]) ? 'Winamax' : /^Poker Hand #/.test(L[0]) ? 'GGPoker' : 'PokerStars';
    const h = { site, raw: txt, id: (L[0].match(/(?:HandId: #|Hand #)([\w-]+)/) || [])[1] || '', tournament: /Tournament|Tournoi/i.test(L[0]),
      seats: [], button: 0, hero: null, heroCards: null, actions: [], board: [], shown: {}, collected: {}, returned: {}, posts: {}, rake: 0, sb: 0, bb: 0 };
    const bl = [...L[0].matchAll(/\(([^()]*\/[^()]*)\)/g)].pop();
    if (bl) { const p = bl[1].split('/').map(num).filter((x) => !isNaN(x)); h.bb = p[p.length - 1]; h.sb = p[p.length - 2]; }
    // GGPoker tournoi : « Level10(150/300(40)) » (blindes et ante imbriqués).
    const lv = L[0].match(/Level\s*\d+\s*\(([\d.,]+)\/([\d.,]+)(?:\(([\d.,]+)\))?\)/); if (lv) { h.sb = num(lv[1]); h.bb = num(lv[2]); }
    const date = L[0].match(/(\d{4})[/-](\d{2})[/-](\d{2})/); h.date = date ? `${date[1]}-${date[2]}-${date[3]}` : '';
    const btn = txt.match(/Seat #(\d+) is the button/); h.button = btn ? +btn[1] : 0;
    let street = 'pre', summary = false;
    for (const l of L.slice(1)) {
      if (/^\*\*\* SUMMARY/.test(l)) { summary = true; continue; }
      const st = l.match(/^\*\*\* (FIRST |SECOND |THIRD )?(PRE-FLOP|HOLE CARDS|FLOP|TURN|RIVER|SHOW ?DOWN)/);
      if (st) {
        street = { 'PRE-FLOP': 'pre', 'HOLE CARDS': 'pre', FLOP: 'flop', TURN: 'turn', RIVER: 'river' }[st[2]] || 'sd';
        const cards = [...l.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]).join(' ');
        // Run it twice (GGPoker) : on garde le premier board, le second ne sert qu'au partage du pot.
        if (st[1] && st[1] !== 'FIRST ') { h.rit = true; continue; }
        if (street !== 'pre' && street !== 'sd') h.board = E.parseCards(cards);
        continue;
      }
      if (summary) { const tp = l.match(/Rake (\S+)/); if (tp) h.rake = num(tp[1]); continue; }
      let m;
      if ((m = l.match(/^Seat (\d+): (.+?) \((?:[€$£]?)([\d.,]+)[€$£]?(?: in chips)?[^)]*\)( is sitting out| out of hand)?/)) && street === 'pre' && !h.actions.length) {
        if (num(m[3]) > 0 && !m[4]) h.seats.push({ seat: +m[1], name: m[2], stack: num(m[3]) }); continue;
      }
      if ((m = l.match(/^Dealt to (.+?) \[([^\]]+)\]/))) { if (!h.hero) { h.hero = m[1]; h.heroCards = E.parseCards(m[2]); } continue; }
      if ((m = l.match(/^(.+?):? posts (small blind|big blind|ante|the ante|small & big blinds|straddle) (\S+)/))) {
        const kind = /small &/.test(m[2]) ? 'both' : /small/.test(m[2]) ? 'sb' : /big/.test(m[2]) ? 'bb' : /straddle/.test(m[2]) ? 'straddle' : 'ante';
        h.actions.push({ street: 'pre', p: m[1], type: 'post', kind, amt: num(m[3]) }); continue;
      }
      if ((m = l.match(/^Uncalled bet \((\S+)\) returned to (.+)$/))) { h.returned[m[2]] = (h.returned[m[2]] || 0) + num(m[1]); continue; }
      if ((m = l.match(/^(.+?) collected (\S+) from (?:side |main )?pot/))) { h.collected[m[1]] = (h.collected[m[1]] || 0) + num(m[2]); continue; }
      if ((m = l.match(/^(.+?):? shows \[([^\]]+)\]/))) { h.shown[m[1]] = E.parseCards(m[2]); continue; }
      if ((m = l.match(ACT))) {
        h.actions.push({ street, p: m[1], type: m[2], amt: m[3] ? num(m[3]) : 0, to: m[4] ? num(m[4]) : 0, allin: !!m[5] });
      }
    }
    return h;
  }

  // Positions : ordre de parole à partir du joueur qui suit le bouton.
  function positions(h) {
    const seats = h.seats.slice().sort((a, b) => a.seat - b.seat), n = seats.length, pos = {};
    if (n < 2) return pos;
    const sbP = h.actions.find((a) => a.type === 'post' && a.kind === 'sb')?.p, bbP = h.actions.find((a) => a.type === 'post' && a.kind === 'bb')?.p;
    let bi = seats.findIndex((s) => s.seat >= h.button); if (bi < 0) bi = 0; if (seats[bi].seat !== h.button) bi = (bi - 1 + n) % n;
    const order = []; for (let k = 1; k <= n; k++) order.push(seats[(bi + k) % n].name); // SB en premier normalement, bouton en dernier
    if (n === 2) { pos[order[1]] = 'BTN'; pos[order[0]] = 'BB'; if (sbP) pos[sbP] = 'BTN'; if (bbP) pos[bbP] = 'BB'; return pos; }
    const rest = order.filter((p) => p !== sbP && p !== bbP);
    if (sbP) pos[sbP] = 'SB'; if (bbP) pos[bbP] = 'BB';
    const tail = ['BTN', 'CO', 'HJ', 'LJ', 'UTG+2', 'UTG+1', 'UTG'];
    rest.reverse().forEach((p, k) => { pos[p] = k < tail.length - 1 ? tail[k] : 'UTG'; });
    if (rest.length && pos[rest[rest.length - 1]] !== 'BTN') pos[rest[rest.length - 1]] = rest.length >= 4 ? 'UTG' : pos[rest[rest.length - 1]];
    return pos;
  }

  // Analyse d'une main : contributions, net par joueur, faits préflop et postflop.
  function analyzeHand(h) {
    const players = h.seats.map((s) => s.name), put = {}, facts = {};
    players.forEach((p) => { put[p] = 0; facts[p] = { vpip: false, pfr: false, threeOpp: false, three: false, sawFlop: false, folded: false, aggr: 0, calls: 0, sd: false, won: false, cbetOpp: false, cbet: false, ftcOpp: false, ftc: false, f3Opp: false, f3: false, rvFace: 0, rvRaise: 0, rvFold: 0, last: 'pre' }; });
    let opener = null, threeBet = false;
    let streetPut = {}, cur = 'pre', raises = 0;
    const pos = positions(h);
    let firstIn = null, heroActed = false, voluntary = false;
    for (const a of h.actions) {
      if (!(a.p in put)) continue;
      if (a.street !== cur) { cur = a.street; streetPut = {}; }
      const f = facts[a.p];
      if (a.type === 'post') { put[a.p] += a.amt; if (a.kind !== 'ante') streetPut[a.p] = (streetPut[a.p] || 0) + (a.kind === 'both' ? a.amt : a.amt); continue; }
      f.last = cur;
      // Rivière : réaction face à une mise (relance, couché).
      if (cur === 'river') { const top = Math.max(0, ...Object.values(streetPut)); if (top > (streetPut[a.p] || 0) + 1e-9) { f.rvFace++; if (a.type === 'raises') f.rvRaise++; if (a.type === 'folds') f.rvFold++; } }
      if (cur === 'pre') {
        // Fold face au 3-bet : l'ouvreur, quand une relance suit la sienne, se couche-t-il ?
        if (a.p === opener && threeBet && !facts[opener].f3Opp) { facts[opener].f3Opp = true; if (a.type === 'folds') facts[opener].f3 = true; }
        if (a.type === 'raises' || a.type === 'bets') { if (raises === 0) opener = a.p; else if (raises === 1) threeBet = true; }
        if (a.p === h.hero && !heroActed) { heroActed = true; if (!voluntary) firstIn = { pos: pos[a.p], action: a.type }; }
        if (raises === 1 && a.type !== 'post') { f.threeOpp = true; if (a.type === 'raises') f.three = true; }
        if (a.type === 'calls' || a.type === 'raises' || a.type === 'bets') { f.vpip = true; voluntary = true; }
        if (a.type === 'raises' || a.type === 'bets') { f.pfr = true; raises++; }
      } else {
        if (a.type === 'bets' || a.type === 'raises') f.aggr++;
        if (a.type === 'calls') f.calls++;
      }
      if (a.type === 'folds') f.folded = true;
      let add = 0;
      if (a.type === 'calls' || a.type === 'bets') add = a.amt;
      else if (a.type === 'raises') add = (a.to || a.amt) - (streetPut[a.p] || 0);
      put[a.p] += add; streetPut[a.p] = (streetPut[a.p] || 0) + add;
    }
    // Continuation bet : le dernier relanceur préflop mise-t-il le flop quand personne n'a misé avant lui ?
    const preR = h.actions.filter((x) => x.street === 'pre' && x.type === 'raises'), pfrP = preR.length ? preR[preR.length - 1].p : null;
    if (pfrP && facts[pfrP]) {
      let betSeen = false, cbetDone = false; const responded = new Set();
      for (const x of h.actions.filter((y) => y.street === 'flop')) {
        if (x.p === pfrP && !betSeen && !facts[pfrP].cbetOpp) { facts[pfrP].cbetOpp = true; if (x.type === 'bets') { facts[pfrP].cbet = true; cbetDone = true; } }
        else if (cbetDone && x.p !== pfrP && !responded.has(x.p) && facts[x.p]) { responded.add(x.p); facts[x.p].ftcOpp = true; if (x.type === 'folds') facts[x.p].ftc = true; }
        if (x.type === 'bets' || x.type === 'raises') betSeen = true;
        if (x.p === pfrP && x.type !== 'bets' && x.type !== 'checks') break;
      }
    }
    const flopSeen = h.board.length >= 3, hadSD = Object.keys(h.shown).length > 0;
    for (const p of players) {
      const f = facts[p];
      f.sawFlop = flopSeen && !h.actions.some((a) => a.p === p && a.type === 'folds' && a.street === 'pre');
      f.sd = hadSD && !f.folded && f.sawFlop; f.won = (h.collected[p] || 0) > 0;
    }
    const net = {}; players.forEach((p) => (net[p] = (h.collected[p] || 0) + (h.returned[p] || 0) - put[p]));
    return { put, net, facts, pos, firstIn };
  }

  // EV des all-in : quand le héros est à tapis avant la river contre un seul adversaire dont les cartes sont montrées.
  function allinLuck(h, a) {
    if (!h.hero || !h.heroCards) return null;
    const allinIdx = h.actions.findIndex((x) => x.allin && x.street !== 'river');
    if (allinIdx < 0) return null;
    const alive = h.seats.map((s) => s.name).filter((p) => !h.actions.some((x) => x.p === p && x.type === 'folds'));
    if (alive.length !== 2 || !alive.includes(h.hero)) return null;
    const vil = alive.find((p) => p !== h.hero); if (!h.shown[vil]) return null;
    const st = h.actions[allinIdx].street, nb = { pre: 0, flop: 3, turn: 4 }[st];
    // Le all-in est « fermé » à la rue du dernier tapis : on prend le board connu à ce moment.
    const lastSt = h.actions.filter((x) => x.street !== 'sd' && x.type !== 'post').pop()?.street || st;
    const known = h.board.slice(0, { pre: 0, flop: 3, turn: 4, river: 5 }[lastSt] ?? nb);
    if (known.length === 5) return null;
    const r = E.equity([{ hand: h.heroCards }, { hand: h.shown[vil] }], known, { iterations: 20000 });
    const pot = Object.values(a.put).reduce((x, y) => x + y, 0) - (h.rake || 0) - Object.values(h.returned).reduce((x, y) => x + y, 0);
    const got = h.collected[h.hero] || 0;
    return { eq: r.equity[0], pot, got, luck: got - r.equity[0] * pot, vil, street: lastSt };
  }

  function profileOf(s) {
    if (s.hands < 15) return { key: 'inconnu', label: 'Échantillon trop petit' };
    const v = s.vpip / s.hands * 100, p = s.pfr / s.hands * 100, af = s.calls ? s.aggr / s.calls : s.aggr;
    if (v >= 40 && p <= 14) return { key: 'station', label: 'Fish passif (calling station)' };
    if (v >= 40 && p >= 28) return { key: 'maniaque', label: 'Maniaque' };
    if (v <= 16) return { key: 'nit', label: 'Nit (roc)' };
    if (v >= 17 && v <= 30 && p >= 13 && v - p <= 9) return { key: 'reg', label: 'Régulier solide' };
    if (v > 30) return { key: 'recreatif', label: af < 1 ? 'Récréatif passif' : 'Récréatif agressif' };
    return { key: 'serre', label: 'Serré-passif' };
  }
  const EXPLOIT = {
    station: ['Mise ta valeur gros (70-100 % du pot), même la deuxième paire.', 'Zéro bluff : il ne se couche pas.', 'Ses grosses mises à la turn ou à la river sont de la valeur : couche tes mains moyennes.', 'Isole-le préflop et assieds-toi à sa gauche.'],
    maniaque: ['Laisse-le bluffer : check tes mains fortes, paie plus large.', 'Ne bluffe pas contre lui.', '4-bet plus fin pour la valeur (TT+, AQ+).', 'Réduis tes tables : la variance monte.'],
    nit: ['Vole ses blindes en permanence.', 'Couche tout ce qui n\'est pas premium contre ses relances.', 'Pas de value fine : il ne paie pas.'],
    reg: ['Évite les gros pots sans main nette.', 'Choisis d\'autres tables si possible.', 'Défends tes blindes selon les ranges standard.'],
    recreatif: ['Value bet plus large que contre un régulier.', 'Moins de bluffs multi-rues.', 'Isole ses limps.'],
    serre: ['Vole plus souvent ses blindes.', 'Respecte ses relances postflop.'],
    inconnu: ['Attends au moins 15 mains avant de conclure.'],
  };

  const CHART_POS = { UTG: 'UTG', 'UTG+1': 'UTG', 'UTG+2': 'UTG', LJ: 'UTG', HJ: 'HJ', CO: 'CO', BTN: 'BTN', SB: 'SB' };

  // Analyse complète d'un texte d'historiques.
  function analyze(text) {
    const hands = split(text).map(parseHand).filter((h) => h.seats.length >= 2 && h.bb > 0);
    const heroCount = {}; hands.forEach((h) => h.hero && (heroCount[h.hero] = (heroCount[h.hero] || 0) + 1));
    const hero = Object.entries(heroCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const opp = {}, pool = { hands: 0, vpip: 0, pfr: 0, threeOpp: 0, three: 0, f3Opp: 0, f3: 0, sawFlop: 0, sd: 0, wsd: 0, aggr: 0, calls: 0, cbetOpp: 0, cbet: 0, ftcOpp: 0, ftc: 0, rvFace: 0, rvRaise: 0, rvFold: 0 }, heat = {}, me = { hands: 0, net: 0, netBB: 0, vpip: 0, pfr: 0, threeOpp: 0, three: 0, sawFlop: 0, sd: 0, wsd: 0, aggr: 0, calls: 0, cbetOpp: 0, cbet: 0, ftcOpp: 0, ftc: 0, byPos: {}, luck: 0, allins: [], rake: 0, dealt: { n: 0, prem: 0 }, sets: { n: 0, hit: 0 }, curve: [] };
    const leaks = { tooLoose: [], tooTight: [], limps: [] }, pots = [];
    for (const h of hands) {
      const a = analyzeHand(h);
      for (const [p, f] of Object.entries(a.facts)) {
        const tgt = p === hero ? me : (opp[p] = opp[p] || { name: p, hands: 0, vpip: 0, pfr: 0, threeOpp: 0, three: 0, sawFlop: 0, sd: 0, wsd: 0, aggr: 0, calls: 0, cbetOpp: 0, cbet: 0, ftcOpp: 0, ftc: 0, net: 0 });
        tgt.hands++; if (f.vpip) tgt.vpip++; if (f.pfr) tgt.pfr++; if (f.threeOpp) tgt.threeOpp++; if (f.three) tgt.three++;
        if (f.sawFlop) tgt.sawFlop++; if (f.sd) { tgt.sd++; if (f.won) tgt.wsd++; } tgt.aggr += f.aggr; tgt.calls += f.calls;
        if (f.cbetOpp) tgt.cbetOpp++; if (f.cbet) tgt.cbet++; if (f.ftcOpp) tgt.ftcOpp++; if (f.ftc) tgt.ftc++;
        if (p !== hero) {
          tgt.net += a.net[p] / h.bb;
          pool.hands++; for (const k of ['vpip', 'pfr', 'threeOpp', 'three', 'f3Opp', 'f3', 'sawFlop', 'cbetOpp', 'cbet', 'ftcOpp', 'ftc']) if (f[k]) pool[k]++;
          if (f.sd) { pool.sd++; if (f.won) pool.wsd++; } pool.aggr += f.aggr; pool.calls += f.calls; pool.rvFace += f.rvFace; pool.rvRaise += f.rvRaise; pool.rvFold += f.rvFold;
        }
      }
      if (hero && a.net[hero] !== undefined) {
        const nbb = a.net[hero] / h.bb; me.net += a.net[hero]; me.netBB += nbb;
        const ps = a.pos[hero] || '?'; const bp = me.byPos[ps] = me.byPos[ps] || { hands: 0, bb: 0 }; bp.hands++; bp.bb += nbb;
        // Carte des fuites : où se décide le résultat de la main (dernière rue où tu as agi, ou l'abattage).
        const fh = a.facts[hero], st = fh?.sd ? 'sd' : fh?.last || 'pre', hp = heat[ps] = heat[ps] || {}, hc = hp[st] = hp[st] || { n: 0, bb: 0 }; hc.n++; hc.bb += nbb;
        pots.push({ id: h.id, bb: nbb, eur: a.net[hero], hand: h });
        const fi = a.firstIn;
        if (fi && h.heroCards && CHART_POS[fi.pos] && !h.tournament) {
          const hc = E.abstractOf(h.heroCards[0], h.heroCards[1]), inR = E.parseRange(Charts.RFI[CHART_POS[fi.pos]].range).has(hc);
          const rec = { id: h.id, pos: fi.pos, hand: hc };
          if (fi.action === 'calls') leaks.limps.push(rec);
          else if (fi.action === 'raises' && !inR) leaks.tooLoose.push(rec);
          else if (fi.action === 'folds' && inR) leaks.tooTight.push(rec);
        }
        const L = allinLuck(h, a);
        if (L) { me.luck += L.luck; me.allins.push({ id: h.id, ...L, bb: h.bb }); }
        // Indice de chance : cartes reçues, sets floppés, courbe réelle et courbe ajustée de la chance aux tapis.
        if (h.heroCards) {
          const [c1, c2] = h.heroCards, r1 = c1 >> 2, r2 = c2 >> 2;
          me.dealt.n++; if ((r1 === r2 && r1 >= 10) || (Math.min(r1, r2) === 11 && Math.max(r1, r2) === 12)) me.dealt.prem++;
          if (r1 === r2 && a.facts[hero]?.sawFlop && h.board.length >= 3) { me.sets.n++; if (h.board.slice(0, 3).some((c) => c >> 2 === r1)) me.sets.hit++; }
        }
        const prev = me.curve[me.curve.length - 1] || [0, 0];
        me.curve.push([prev[0] + nbb, prev[1] + nbb - (L ? L.luck / h.bb : 0)]);
      }
    }
    pots.sort((x, y) => Math.abs(y.bb) - Math.abs(x.bb));
    const opponents = Object.values(opp).sort((a, b) => b.hands - a.hands).map((o) => ({ ...o, profile: profileOf(o) }));
    return { hands: hands.length, hero, me, opponents, pool, heat, leaks, pots: pots.slice(0, 10), sites: [...new Set(hands.map((h) => h.site))], from: hands[0]?.date, to: hands[hands.length - 1]?.date };
  }


  // Replayer : liste des états d'une main, action par action (pot, tapis, board visible, texte), avec équités quand les cartes sont connues.
  function replay(h) {
    const stacks = {}, put = {}, known = {};
    h.seats.forEach((s) => { stacks[s.name] = s.stack; put[s.name] = 0; });
    if (h.hero && h.heroCards) known[h.hero] = h.heroCards;
    Object.entries(h.shown).forEach(([p, c]) => (known[p] = c));
    const N = { pre: 0, flop: 3, turn: 4, river: 5, sd: 5 }, steps = [], folded = new Set();
    let street = 'pre', streetPut = {};
    const snap = (text, who) => {
      const board = h.board.slice(0, N[street]), alive = h.seats.map((s) => s.name).filter((p) => !folded.has(p));
      let eq = null; const withCards = alive.filter((p) => known[p]);
      if (withCards.length >= 2 && withCards.length === alive.length && board.length < 5) {
        const r = E.equity(withCards.map((p) => ({ hand: known[p] })), board, { iterations: 6000 });
        eq = Object.fromEntries(withCards.map((p, k) => [p, r.equity[k]]));
      }
      steps.push({ street, text, who, board, pot: Object.values(put).reduce((a, b) => a + b, 0), stacks: { ...stacks }, alive, eq });
    };
    snap('Début de la main', null);
    for (const a of h.actions) {
      if (!(a.p in put)) continue;
      if (a.street !== street) { street = a.street; streetPut = {}; }
      let add = 0, txt = '';
      if (a.type === 'post') { add = a.amt; txt = `${a.p} poste ${a.kind === 'sb' ? 'la petite blinde' : a.kind === 'bb' ? 'la grosse blinde' : a.kind === 'straddle' ? 'le straddle' : 'l\'ante'} (${a.amt})`; streetPut[a.p] = (streetPut[a.p] || 0) + (a.kind === 'ante' ? 0 : a.amt); }
      else if (a.type === 'folds') { folded.add(a.p); txt = `${a.p} se couche`; }
      else if (a.type === 'checks') txt = `${a.p} checke`;
      else if (a.type === 'calls') { add = a.amt; txt = `${a.p} suit ${a.amt}`; }
      else if (a.type === 'bets') { add = a.amt; txt = `${a.p} mise ${a.amt}`; }
      else if (a.type === 'raises') { const to = a.to || a.amt; add = to - (streetPut[a.p] || 0); txt = `${a.p} relance à ${to}`; }
      if (a.type !== 'post' && add) streetPut[a.p] = (streetPut[a.p] || 0) + add;
      if (a.allin) txt += ' (tapis)';
      put[a.p] += add; stacks[a.p] -= add;
      snap(txt, a.p);
    }
    if (h.board.length > N[street]) { street = 'river'; snap('Board complet', null); }
    Object.entries(h.returned).forEach(([p, v]) => { put[p] -= v; stacks[p] += v; });
    Object.entries(h.collected).forEach(([p, v]) => { stacks[p] += v; });
    street = 'sd'; snap(Object.entries(h.collected).map(([p, v]) => `${p} remporte ${Math.round(v * 100) / 100}`).join(' · ') || 'Fin de la main', null);
    return { steps, known, seats: h.seats.map((s) => s.name), hero: h.hero };
  }

  const api = { split, parseHand, positions, analyzeHand, allinLuck, analyze, profileOf, EXPLOIT, replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HH = api;
})(typeof window !== 'undefined' ? window : globalThis);
