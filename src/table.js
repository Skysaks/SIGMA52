// Table d'entraînement : 6-max cash, toi contre 5 bots aux profils réels (fish passif, maniaque, nit, régulier).
// Moteur de main complet (blindes, relances minimales, tapis, pots annexes) + historique au format Winamax pour l'import.
(function (root) {
  const E = root.Engine || require('./engine.js');
  const Solver = root.Solver || require('./solver.js');

  const PROFILES = {
    station: { label: 'Fish passif', vpip: 0.56, pfr: 0.06, cont: 0.95, three: 0.15, callF: 0.55, value: 0.55, bluff: 0.03, raise: 0.9, size: [0.33, 0.5] },
    maniaque: { label: 'Maniaque', vpip: 0.55, pfr: 0.4, cont: 0.6, three: 0.5, callF: 0.75, value: 0.9, bluff: 0.4, raise: 0.72, size: [0.8, 1.2] },
    nit: { label: 'Nit', vpip: 0.13, pfr: 0.11, cont: 0.45, three: 0.25, callF: 1.35, value: 0.7, bluff: 0.02, raise: 0.9, size: [0.5, 0.66] },
    reg: { label: 'Régulier', vpip: 0.25, pfr: 0.22, cont: 0.6, three: 0.3, callF: 1.0, value: 0.75, bluff: 0.18, raise: 0.85, size: [0.5, 0.75] },
    // Styles d'entraînement inspirés de descriptions publiques de joueurs connus (voir champions.js) : paramètres choisis par SIGMA 52,
    // pas la stratégie réelle des joueurs. like = profil de base utilisé par le coach pour estimer les ranges.
    ivey: { label: 'Style Ivey', like: 'reg', vpip: 0.31, pfr: 0.26, cont: 0.72, three: 0.45, callF: 0.95, value: 0.85, bluff: 0.3, raise: 0.8, size: [0.6, 1.0], over: 0.25, raiseBluff: 0.07, adapt: 1, disc: 0.11, cbet: 0.72 },
    negreanu: { label: 'Style Negreanu', like: 'reg', vpip: 0.33, pfr: 0.24, cont: 0.82, three: 0.25, callF: 1.05, value: 0.78, bluff: 0.22, raise: 0.88, size: [0.25, 0.4], sizeLate: [0.4, 0.6], open: 2.2, flat: 1.45, bigFold: 0.08, adapt: 0.5, cbet: 0.8 },
    hellmuth: { label: 'Style Hellmuth', like: 'reg', vpip: 0.23, pfr: 0.18, cont: 0.6, three: 0.3, callF: 1.12, value: 0.82, bluff: 0.12, raise: 0.88, size: [0.5, 0.75], adapt: 1.4, cbet: 0.55 },
    chidwick: { label: 'Style Chidwick', like: 'reg', vpip: 0.25, pfr: 0.22, cont: 0.62, three: 0.35, callF: 1.0, value: 0.75, bluff: 0.2, raise: 0.82, size: [0.33, 0.75], over: 0.15, xr: 0.16, cbet: 0.62 },
    mizrachi: { label: 'Style Mizrachi', like: 'maniaque', vpip: 0.42, pfr: 0.32, cont: 0.72, three: 0.4, callF: 0.9, value: 0.9, bluff: 0.32, raise: 0.78, size: [0.6, 1.0], over: 0.35, jam: 0.06, disc: 0.08, cbet: 0.8 },
    antonius: { label: 'Style Antonius', like: 'reg', vpip: 0.3, pfr: 0.27, cont: 0.72, three: 0.45, callF: 0.95, value: 0.85, bluff: 0.33, raise: 0.8, size: [0.66, 1.0], over: 0.25, adapt: 1, cbet: 0.78 },
    action: { label: 'Joueur d\'action live', like: 'station', vpip: 0.5, pfr: 0.2, cont: 0.85, three: 0.25, callF: 0.75, value: 0.7, bluff: 0.15, raise: 0.85, size: [0.5, 1.0], open: 4, loose: 1, cbet: 0.45 },
    prolive: { label: 'Pro de cash live', like: 'reg', vpip: 0.27, pfr: 0.22, cont: 0.62, three: 0.33, callF: 1.0, value: 0.8, bluff: 0.16, raise: 0.85, size: [0.5, 0.9], open: 3.5, adapt: 0.8, cbet: 0.62 },
  };
  // Paramètres hérités des quatre profils d'origine (comportement inchangé pour eux).
  const kindOf = (pr, name) => pr.like || name;
  const NAMES = { station: ['Gégé31', 'Mimi_Lol', 'TontonFlop', 'ChanceuxDu82'], maniaque: ['AllinKevin', 'Turbo_Raz'], nit: ['Roc_Solide', 'PapyNit'], reg: ['GrindZ', 'Reg_6max'],
    ivey: ['Style Ivey'], negreanu: ['Style Negreanu'], hellmuth: ['Style Hellmuth'], chidwick: ['Style Chidwick'], mizrachi: ['Style Mizrachi'], antonius: ['Style Antonius'],
    action: ['Whale_Vegas', 'Straddle_Sam', 'Lucky_Lou'], prolive: ['Pro_Live', 'Reg_Bike'] };

  // Rang préflop : percentile combo-pondéré de l'équité contre une main aléatoire (0 = meilleure main).
  let PCT = null;
  function preflopPct() {
    if (PCT) return PCT;
    const all = new Array(169).fill(1), w = Solver.W;
    const eqs = E.ALL169.map((h, i) => [i, Solver.eqVsRange(i, all)]).sort((a, b) => b[1] - a[1]);
    PCT = new Array(169); let cum = 0;
    for (const [i] of eqs) { PCT[i] = (cum + w[i] / 2) / 1326; cum += w[i]; }
    return PCT;
  }
  const handPct = (cards) => preflopPct()[E.ALL169.indexOf(E.abstractOf(cards[0], cards[1]))];

  function strength(cards, board, nOpp, r, sims = 250) {
    const used = new Set([...cards, ...board]); let eq = 0;
    for (let s = 0; s < sims; s++) {
      const u = new Set(used), draw = () => { let c; do { c = (r() * 52) | 0; } while (u.has(c)); u.add(c); return c; };
      const opp = []; for (let k = 0; k < nOpp; k++) opp.push([draw(), draw()]);
      const full = board.slice(); while (full.length < 5) full.push(draw());
      const me = E.evaluate([...cards, ...full]); let best = true, tie = 1;
      for (const o of opp) { const v = E.evaluate([...o, ...full]); if (v > me) { best = false; break; } if (v === me) tie++; }
      if (best) eq += 1 / tie;
    }
    return eq / sims;
  }

  class Table {
    constructor(opts = {}) {
      this.r = opts.random || Math.random;
      // Options : lineup (profils des bots), stack (tapis de départ), sb/bb, rebuy (recave en cash), levels + handsPerLevel (tournoi).
      this.levels = opts.levels || null; this.handsPerLevel = opts.handsPerLevel || 6;
      [this.sb, this.bb] = this.levels ? this.levels[0] : [opts.sb ?? 0.05, opts.bb ?? 0.1];
      this.rebuy = opts.rebuy !== false; this.startStack = opts.stack ?? 10; this.handNo = 0; this.unit = opts.unit ?? '€';
      const lineup = opts.lineup || ['station', 'reg', 'maniaque', 'station', 'nit'];
      const used = {};
      this.players = [{ name: 'Toi', hero: true, stack: this.startStack, profile: null }]
        .concat(lineup.map((p) => { used[p] = (used[p] || 0) + 1; return { name: NAMES[p][(used[p] - 1) % NAMES[p].length], profile: p, stack: this.startStack }; }));
      this.n = this.players.length; this.busted = [];
      // Ce que les bots « lecteurs » observent de toi : mises adverses affrontées après le flop et couchers.
      this.heroObs = { faced: 0, folds: 0, calls: 0, hands: 0, vpip: 0 };
      this.button = (this.r() * this.n) | 0; this.log = []; this.history = []; this.session = { hands: 0, net: 0 };
    }
    get pot() { return this.players.reduce((a, p) => a + p.total, 0); }
    // Sièges actifs (non éliminés) dans l'ordre, à partir du siège suivant `from`.
    seatOrder(from) { const o = []; for (let k = 1; k <= this.n; k++) { const i = (from + k) % this.n; if (!this.players[i].out) o.push(i); } return o; }
    active() { return this.players.filter((p) => !p.out); }
    newHand() {
      this.handNo++;
      if (this.rebuy) {
        // Recave à 100 bb sous 40 bb ; au-delà de 250 bb, le joueur quitte la table et un nouveau s'assoit à 100 bb.
        for (const p of this.players) { if (p.stack < this.startStack * 0.4 || p.stack > this.startStack * 2.5) p.stack = this.startStack; }
      } else if (this.levels) [this.sb, this.bb] = this.levels[Math.min(this.levels.length - 1, Math.floor((this.handNo - 1) / this.handsPerLevel))];
      this.button = this.seatOrder(this.button)[0];
      const deck = [...Array(52).keys()]; for (let i = 51; i > 0; i--) { const j = (this.r() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
      this.deck = deck; this.board = []; this.street = 'pre'; this.done = false; this.notes = []; this.seq = [];
      this.players.forEach((p) => Object.assign(p, { cards: p.out ? [] : [deck.pop(), deck.pop()], inHand: !p.out, allin: false, put: 0, total: 0, start: p.stack, acts: [] }));
      const order = this.seatOrder(this.button);
      // Tête-à-tête : le bouton est la petite blinde.
      const [sbi, bbi] = order.length === 2 ? [this.button, order[0]] : [order[0], order[1]];
      this.sbi = sbi; this.bbi = bbi;
      this.lines = [`Winamax Poker - CashGame - HandId: #${900000 + this.handNo}-1-${Date.now()} - Holdem no limit (0.05€/0.10€) - ${new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/')} UTC`,
        `Table: 'SIGMA Entraînement' ${this.n}-max (real money) Seat #${this.button + 1} is the button`,
        ...this.players.map((p, i) => (p.out ? null : `Seat ${i + 1}: ${p.name} (${p.stack.toFixed(2)}€)`)).filter(Boolean), '*** ANTE/BLINDS ***'];
      this.post(sbi, this.sb, 'small blind'); this.post(bbi, this.bb, 'big blind');
      this.lines.push(`Dealt to Toi [${this.players[0].cards.map(E.cardStr).join(' ')}]`, '*** PRE-FLOP *** ');
      this.cur = this.bb; this.minRaise = this.bb; this.raises = 1; this.acted = new Set(); this.toAct = (bbi + 1) % this.n; this.lastAggr = bbi;
      this.skipToNext(true);
    }
    post(i, amt, label) { const p = this.players[i]; const a = Math.min(amt, p.stack); p.stack -= a; p.put += a; p.total += a; if (p.stack <= 1e-9) p.allin = true; this.lines.push(`${p.name} posts ${label} ${a.toFixed(2)}€`); }
    alive() { return this.players.filter((p) => p.inHand); }
    canAct(i) { const p = this.players[i]; return p.inHand && !p.allin && p.stack > 1e-9; }
    roundOver() {
      const act = this.players.map((p, i) => i).filter((i) => this.canAct(i));
      if (this.alive().length <= 1) return true;
      return act.every((i) => this.acted.has(i) && this.players[i].put >= this.cur - 1e-9) || act.length === 0 || (act.length === 1 && this.players[act[0]].put >= this.cur - 1e-9 && this.acted.has(act[0]));
    }
    skipToNext(first) {
      if (!first) this.toAct = (this.toAct + 1) % this.n;
      for (let k = 0; k < this.n && !this.canAct(this.toAct); k++) this.toAct = (this.toAct + 1) % this.n;
    }
    legal() {
      const p = this.players[this.toAct], toCall = Math.min(this.cur - p.put, p.stack);
      const minTo = Math.min(this.cur + this.minRaise, p.put + p.stack);
      return { toCall, canCheck: toCall <= 1e-9, minTo, maxTo: p.put + p.stack, pot: this.pot, stack: p.stack };
    }
    act(type, to = 0) {
      const i = this.toAct, p = this.players[i], L = this.legal(), pot0 = this.pot;
      if (type === 'raise' && L.maxTo <= this.cur + 1e-9) type = 'call'; // tapis insuffisant pour relancer : c'est un call
      const rec = { street: this.street, type, toCall: L.toCall, pot: pot0 };
      if (i === 0 && this.street !== 'pre' && L.toCall > 1e-9) { this.heroObs.faced++; if (type === 'fold') this.heroObs.folds++; else if (type === 'call') this.heroObs.calls++; }
      if (i === 0 && this.street === 'pre' && (type === 'call' || type === 'raise') && !p.acts.some((a) => a.street === 'pre' && (a.final === 'call' || a.final === 'raise'))) this.heroObs.vpip++;
      if (type === 'fold') { if (L.canCheck) type = 'check'; else { p.inHand = false; this.lines.push(`${p.name} folds`); } }
      if (type === 'check') this.lines.push(`${p.name} checks`);
      if (type === 'call') { const a = L.toCall; p.stack -= a; p.put += a; p.total += a; if (p.stack <= 1e-9) p.allin = true; this.lines.push(`${p.name} calls ${a.toFixed(2)}€${p.allin ? ' and is all-in' : ''}`); }
      if (type === 'raise') {
        to = Math.max(L.minTo, Math.min(to, L.maxTo)); to = Math.round(to * 100) / 100;
        const add = to - p.put, wasBet = this.cur <= 1e-9;
        if (to - this.cur >= this.minRaise - 1e-9) this.minRaise = to - this.cur;
        p.stack -= add; p.put = to; p.total += add; if (p.stack <= 1e-9) p.allin = true;
        this.lines.push(wasBet ? `${p.name} bets ${add.toFixed(2)}€${p.allin ? ' and is all-in' : ''}` : `${p.name} raises ${(to - this.cur).toFixed(2)}€ to ${to.toFixed(2)}€${p.allin ? ' and is all-in' : ''}`);
        if (to > this.cur) { this.cur = to; this.acted = new Set(); this.raises++; this.lastAggr = i; }
        rec.size = add / Math.max(pot0, 1e-9);
      }
      rec.final = p.inHand ? type : 'fold';
      p.acts.push(rec); this.seq.push({ i, street: rec.street, final: rec.final });
      this.acted.add(i);
      if (this.roundOver()) this.nextStreet(); else this.skipToNext();
    }
    nextStreet() {
      if (this.alive().length <= 1) return this.finish();
      this.players.forEach((p) => (p.put = 0)); this.cur = 0; this.minRaise = this.bb; this.acted = new Set(); this.raises = 0;
      const canStill = this.players.filter((p) => p.inHand && !p.allin).length;
      const deal = (n) => { for (let k = 0; k < n; k++) this.board.push(this.deck.pop()); };
      if (this.street === 'pre') { this.street = 'flop'; deal(3); this.lines.push(`*** FLOP *** [${this.board.map(E.cardStr).join(' ')}]`); }
      else if (this.street === 'flop') { this.street = 'turn'; deal(1); this.lines.push(`*** TURN *** [${this.board.slice(0, 3).map(E.cardStr).join(' ')}] [${E.cardStr(this.board[3])}]`); }
      else if (this.street === 'turn') { this.street = 'river'; deal(1); this.lines.push(`*** RIVER *** [${this.board.slice(0, 4).map(E.cardStr).join(' ')}] [${E.cardStr(this.board[4])}]`); }
      else return this.finish();
      if (canStill <= 1) return this.nextStreet();
      this.toAct = this.button; this.skipToNext();
    }
    finish() {
      this.done = true; const alive = this.alive();
      // Pot non suivi : la part de la plus grosse mise que personne n'a égalée revient à son auteur.
      const totals = this.players.map((p) => p.total), sorted = [...new Set(totals)].sort((a, b) => a - b);
      const win = new Array(this.n).fill(0);
      if (alive.length === 1) { const w = this.players.indexOf(alive[0]); win[w] = this.pot; }
      else {
        while (this.board.length < 5) this.board.push(this.deck.pop());
        this.lines.push('*** SHOW DOWN ***');
        alive.forEach((p) => this.lines.push(`${p.name} shows [${p.cards.map(E.cardStr).join(' ')}] (${E.categoryName(E.evaluate([...p.cards, ...this.board]))})`));
        let prev = 0;
        for (const lvl of sorted) {
          if (lvl <= prev) continue;
          const contrib = this.players.reduce((a, p) => a + Math.min(Math.max(p.total - prev, 0), lvl - prev), 0);
          const elig = this.players.map((p, i) => i).filter((i) => this.players[i].inHand && this.players[i].total >= lvl - 1e-9);
          if (elig.length) {
            const vals = elig.map((i) => E.evaluate([...this.players[i].cards, ...this.board])), best = Math.max(...vals);
            const ws = elig.filter((_, k) => vals[k] === best), c = Math.round(contrib * 100), q = Math.floor(c / ws.length);
            ws.forEach((i, k) => (win[i] += (q + (k === 0 ? c - q * ws.length : 0)) / 100)); // partage au centime, reste au premier
          } else { const top = this.players.map((p, i) => i).filter((i) => this.players[i].total >= lvl - 1e-9); top.forEach((i) => (win[i] += contrib / top.length)); }
          win.forEach((w, i) => (win[i] = Math.round(w * 100) / 100));
          prev = lvl;
        }
      }
      win.forEach((w, i) => { if (w > 0) { this.players[i].stack += w; this.lines.push(`${this.players[i].name} collected ${w.toFixed(2)}€ from pot`); } });
      this.lines.push('*** SUMMARY ***', `Total pot ${this.pot.toFixed(2)}€ | No rake`, `Board: [${this.board.map(E.cardStr).join(' ')}]`);
      this.result = this.players.map((p) => ({ name: p.name, profile: p.profile, cards: p.cards, net: p.stack - p.start, showed: p.inHand && alive.length > 1 }));
      const heroNet = this.players[0].stack - this.players[0].start;
      this.session.hands++; this.session.net += heroNet / this.bb; this.heroObs.hands++;
      if (!this.rebuy) {
        // Tournoi : les joueurs sans jetons sont éliminés ; la partie s'arrête quand il en reste un, ou quand le héros sort.
        const out = this.players.filter((p) => !p.out && p.stack <= 1e-9);
        const left = this.active().length - out.length;
        out.forEach((p) => { p.out = true; this.busted.push({ name: p.name, place: left + 1, hero: !!p.hero }); });
        if (left <= 1 || this.players[0].out) { this.over = true; this.place = this.players[0].out ? this.busted.find((b) => b.hero).place : 1; }
      }
      this.history.push(this.lines.join('\n'));
      if (this.history.length > 300) this.history.shift();
      this.notes = coach(this);
    }
    // Décision d'un bot. Les quatre profils d'origine gardent exactement leur logique ; les styles ajoutent des paramètres
    // (taille d'ouverture, overbets, check-raises, lecture de tes tendances).
    // Facteur de lecture : les styles « lecteurs » bluffent plus si tu couches trop face aux mises, moins si tu paies trop.
    readFactor(pr) {
      const o = this.heroObs; if (!pr.adapt || o.faced < 12) return 1;
      const f = o.folds / o.faced, k = Math.max(0.4, Math.min(2.2, f / 0.45));
      return 1 + (k - 1) * Math.min(1, pr.adapt);
    }
    botAct() {
      const i = this.toAct, p = this.players[i], pr = PROFILES[p.profile], L = this.legal(), r = this.r, kind = kindOf(pr, p.profile);
      if (this.street === 'pre') {
        // Les styles élargissent leurs ranges à court effectif (3 joueurs et moins) ; les profils d'origine restent inchangés.
        const wid = pr.like ? ({ 2: 2.3, 3: 1.5, 4: 1.2 }[this.active().length] || 1) : 1;
        const pct = handPct(p.cards) / wid, facing = this.raises; // 1 = seulement la BB
        const S = this.effStack(i) / this.bb;
        if (S <= 15) return this.shortStackAct(i, pct, S);
        if (facing <= 1) {
          if (pct < pr.pfr) return this.act('raise', this.bb * (pr.open ?? (kind === 'maniaque' ? 3.5 : 2.5)) + this.bb * this.limpers());
          if (pct < pr.vpip && (kind === 'station' || pr.loose || pct < pr.pfr * (pr.flat ?? 1.3))) return this.act(L.canCheck ? 'check' : 'call');
          return this.act(L.canCheck ? 'check' : 'fold');
        }
        if (facing === 2) {
          if (pct < pr.vpip * pr.cont * pr.three) return this.act('raise', this.cur * 3);
          if (pct < pr.vpip * pr.cont || (L.toCall <= this.bb && pct < pr.vpip)) return this.act('call');
          return this.act('fold');
        }
        if (pct < (pr.jam ?? (kind === 'maniaque' ? 0.07 : 0.025))) return this.act('raise', L.maxTo);
        if (pct < pr.vpip * pr.cont * 0.35 || (kind === 'station' && pct < 0.12)) return this.act('call');
        return this.act('fold');
      }
      const s = strength(p.cards, this.board, this.alive().length - 1, r);
      const late = this.street !== 'flop', rf = this.readFactor(pr);
      const band = late && pr.sizeLate ? pr.sizeLate : pr.size;
      const size = () => L.pot * (band[0] + r() * (band[1] - band[0]));
      const over = () => L.pot * (1.2 + r() * 0.5);
      if (L.canCheck) {
        if (s > 0.62 && r() < pr.value) return this.act('raise', pr.over && late && s > 0.78 && r() < pr.over ? over() : size());
        if (s < 0.35 && r() < Math.min(0.9, pr.bluff * rf)) return this.act('raise', pr.over && late && r() < pr.over ? over() : size());
        // Continuation bet des styles : le relanceur préflop mise souvent le flop, quelle que soit sa main.
        if (pr.cbet && this.street === 'flop' && this.seq.filter((x) => x.street === 'pre' && x.final === 'raise').pop()?.i === i && r() < pr.cbet * Math.min(1.3, rf)) return this.act('raise', size());
        return this.act('check');
      }
      // Face à une mise, l'équité contre des mains au hasard surestime la main : on la décote selon l'agressivité déjà vue.
      const bets = this.seq.filter((x) => x.street === this.street && x.final === 'raise').length;
      const disc = pr.disc ?? (kind === 'maniaque' ? 0.05 : 0.13);
      const big = L.toCall > 0.75 * (L.pot - L.toCall) ? (pr.bigFold || 0) : 0;
      const sAdj = kind === 'station' && !pr.like ? s : s - disc * bets - (this.street === 'river' ? 0.05 : 0) - big;
      const need = L.toCall / (L.pot + L.toCall);
      if (sAdj > pr.raise && r() < 0.6) return this.act('raise', this.cur + Math.max(this.minRaise, L.pot * 0.8));
      // Check-raise sur flop (style GTO moderne) : petite relance avec des mains fortes ou des tirages.
      if (pr.xr && this.street === 'flop' && bets === 1 && (s > 0.55 || s < 0.32) && r() < pr.xr) return this.act('raise', this.cur * 3);
      if ((kind === 'maniaque' && !pr.like) && s < 0.3 && r() < 0.12) return this.act('raise', this.cur * 2.5);
      if (pr.raiseBluff && s < 0.3 && r() < pr.raiseBluff * rf) return this.act('raise', this.cur * 2.6);
      if (sAdj > need * pr.callF || ((kind === 'station' && !pr.like) && s > 0.3 && r() < 0.7) || (pr.loose && s > 0.33 && r() < 0.45)) return this.act('call');
      return this.act('fold');
    }
    // Tapis effectif d'un joueur : son tapis total face au plus gros tapis adverse encore en jeu.
    effStack(i) { const me = this.players[i].stack + this.players[i].put; const opp = Math.max(0, ...this.players.filter((p, k) => k !== i && p.inHand).map((p) => p.stack + p.put)); return Math.min(me, opp); }
    // Seuils tapis/couché d'un bot : équilibre de Nash tête-à-tête, resserré à plus de 2 joueurs, ajusté au profil.
    pfThresholds(i, S) {
      const p = this.players[i], sol = nash(Math.max(1, Math.min(25, Math.round(S * 2) / 2))), n = this.active().length;
      const k = n <= 2 ? 1 : n === 3 ? 0.75 : 0.55;
      const pr = PROFILES[p.profile], adj = { station: [0.8, 1.4], maniaque: [1.35, 1.25], nit: [0.6, 0.6], reg: [1, 1] }[kindOf(pr, p.profile)] || [1, 1];
      return { push: Math.min(1, sol.pushPct * k * adj[0]), call: Math.min(1, sol.callPct * (n <= 2 ? 1 : 0.85) * adj[1]) };
    }
    shortStackAct(i, pct, S) {
      const L = this.legal(), th = this.pfThresholds(i, S);
      if (this.raises <= 1) {
        if (pct < th.push) return this.act('raise', L.maxTo);
        return this.act(L.canCheck ? 'check' : 'fold');
      }
      if (pct < th.call) return this.act(L.maxTo > this.cur && pct < th.call * 0.6 ? 'raise' : 'call', L.maxTo);
      return this.act('fold');
    }
    limpers() { return this.players.filter((p) => p.inHand && p.total === this.bb && p.acts.some((a) => a.street === 'pre' && a.final === 'call')).length; }
    // Avance jusqu'au tour du héros ou la fin de la main.
    runBots() { let n = 0; while (!this.done && this.toAct !== 0 && n++ < 200) this.botAct(); if (!this.done && !this.canAct(0)) { while (!this.done && n++ < 400) { if (this.toAct === 0) this.act('check'); else this.botAct(); } } }
    // Fait jouer le héros par un profil de bot (pour générer des historiques d'exemple).
    autoHero(profile = 'reg') { const p = this.players[0]; p.profile = profile; this.botAct(); p.profile = null; }
    heroHelp() {
      const p = this.players[0], L = this.legal();
      const s = this.street === 'pre' ? Solver.eqVsRange(E.ALL169.indexOf(E.abstractOf(p.cards[0], p.cards[1])), new Array(169).fill(1)) : strength(p.cards, this.board, this.alive().length - 1, this.r, 1500);
      return { eqRandom: s, need: L.toCall > 0 ? L.toCall / (L.pot + L.toCall) : 0, toCall: L.toCall, pot: L.pot };
    }
    exportHH() { return this.history.join('\n\n\n'); }
  }

  // Débrief : règles d'exploitation appliquées à la main jouée.
  function coach(t) {
    const out = [], hero = t.players[0], acts = hero.acts, res = t.result;
    const first = acts.find((a) => a.street === 'pre'), hc = E.abstractOf(hero.cards[0], hero.cards[1]);
    const k0 = t.seq.findIndex((x) => x.i === 0 && x.street === 'pre');
    const firstIn = k0 >= 0 && t.seq.slice(0, k0).every((x) => x.street !== 'pre' || x.final === 'fold' || x.final === 'check');
    const pos = posName(t, 0), chart = root.Charts || require('./charts.js');
    if (first && firstIn && chart.RFI[pos]) {
      const inR = E.parseRange(chart.RFI[pos].range).has(hc);
      if (first.final === 'call') out.push({ k: 'bad', t: `Limp avec ${hc} en ${pos} : relance ou couche-toi quand tu entres en premier.` });
      else if (first.final === 'raise' && !inR) out.push({ k: 'warn', t: `Ouverture avec ${hc} en ${pos} : hors de la range standard. Acceptable seulement si des fish sont aux blindes.` });
      else if (first.final === 'fold' && inR) out.push({ k: 'warn', t: `Fold de ${hc} en ${pos} : cette main fait partie de la range d'ouverture.` });
      else if (first.final === 'raise') out.push({ k: 'good', t: `Ouverture de ${hc} en ${pos} : dans la range.` });
    }
    for (const a of acts.filter((x) => x.street !== 'pre')) {
      const caller = t.players.find((p, i) => i > 0 && p.profile === 'station' && p.acts.some((b) => b.street === a.street && b.final === 'call'));
      if (a.final === 'raise' && caller) {
        const v = E.evaluate([...hero.cards, ...t.board.slice(0, { flop: 3, turn: 4, river: 5 }[a.street])]);
        if (E.category(v) === 0) out.push({ k: 'bad', t: `Bluff ${a.street === 'river' ? 'à la river' : 'au ' + a.street} contre ${caller.name}, fish passif : il paie. Contre lui, ne mise qu'avec de la valeur.` });
        else if (E.category(v) >= 1 && a.size < 0.45) out.push({ k: 'warn', t: `Value bet de ${Math.round(a.size * 100)} % du pot contre ${caller.name} : il paie aussi une mise de 75-100 %. Tu laisses de la valeur.` });
      }
      if (a.final === 'call' && a.street === 'river') {
        const bettor = t.players.find((p, i) => i > 0 && ['nit', 'station'].includes(p.profile) && p.acts.some((b) => b.street === 'river' && b.final === 'raise'));
        if (bettor && res[0].net < 0) out.push({ k: 'warn', t: `Call river contre ${bettor.name} (${PROFILES[bettor.profile].label}) : ses grosses mises river sont presque toujours de la valeur.` });
      }
      if (a.final === 'fold' && a.toCall > 0) {
        const need = a.toCall / (a.pot + a.toCall), b = t.board.slice(0, { flop: 3, turn: 4, river: 5 }[a.street]);
        const aggr = t.players.find((p, i) => i > 0 && p.profile === 'maniaque' && p.acts.some((x) => x.street === a.street && x.final === 'raise'));
        if (aggr && E.category(E.evaluate([...hero.cards, ...b])) >= 1 && need < 0.35) out.push({ k: 'warn', t: `Fold d'une paire contre ${aggr.name}, maniaque, avec seulement ${Math.round(need * 100)} % d'équité requise : il bluffe trop pour ce fold.` });
      }
    }
    const reveal = res.map((r, i) => ({ ...r, i })).filter((r) => r.i > 0 && t.players[r.i].acts.some((a) => a.final !== 'fold' || a.street !== 'pre'));
    return { advice: out, reveal, net: res[0].net / t.bb };
  }

  // Nom de position selon les sièges actifs : BTN, SB, BB, puis CO, HJ, UTG en remontant depuis le bouton.
  function posName(t, i) {
    const act = [t.button, ...t.seatOrder(t.button).filter((k) => k !== t.button)], k = act.indexOf(i), n = act.length;
    if (k < 0) return '—';
    if (n === 2) return k === 0 ? 'BTN' : 'BB';
    if (k <= 2) return ['BTN', 'SB', 'BB'][k];
    return ['UTG', 'HJ', 'CO'][3 - (n - k)] || 'UTG';
  }
  const nashCache = {};
  const nash = (S) => nashCache[S] || (nashCache[S] = Solver.solveChip(S));

  const api = { Table, PROFILES, NAMES, kindOf, handPct, strength, preflopPct, posName };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TableSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
