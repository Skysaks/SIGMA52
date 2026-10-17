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
  };
  const NAMES = { station: ['Gégé31', 'Mimi_Lol', 'TontonFlop', 'ChanceuxDu82'], maniaque: ['AllinKevin', 'Turbo_Raz'], nit: ['Roc_Solide', 'PapyNit'], reg: ['GrindZ', 'Reg_6max'] };

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
      this.sb = 0.05; this.bb = 0.1; this.handNo = 0;
      const lineup = opts.lineup || ['station', 'reg', 'maniaque', 'station', 'nit'];
      const used = {};
      this.players = [{ name: 'Toi', hero: true, stack: 10, profile: null }]
        .concat(lineup.map((p) => { used[p] = (used[p] || 0) + 1; return { name: NAMES[p][(used[p] - 1) % NAMES[p].length], profile: p, stack: 10 }; }));
      this.button = (this.r() * 6) | 0; this.log = []; this.history = []; this.session = { hands: 0, net: 0 };
    }
    get pot() { return this.players.reduce((a, p) => a + p.total, 0); }
    seatOrder(from) { const o = []; for (let k = 1; k <= 6; k++) o.push((from + k) % 6); return o; }
    newHand() {
      this.handNo++;
      // Recave à 100 bb sous 40 bb ; au-delà de 250 bb, le joueur quitte la table et un nouveau s'assoit à 100 bb.
      for (const p of this.players) { if (p.stack < this.bb * 40 || p.stack > this.bb * 250) p.stack = 10; }
      this.button = (this.button + 1) % 6;
      const deck = [...Array(52).keys()]; for (let i = 51; i > 0; i--) { const j = (this.r() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
      this.deck = deck; this.board = []; this.street = 'pre'; this.done = false; this.notes = []; this.seq = [];
      this.players.forEach((p) => Object.assign(p, { cards: [deck.pop(), deck.pop()], inHand: true, allin: false, put: 0, total: 0, start: p.stack, acts: [] }));
      const [sbi, bbi] = this.seatOrder(this.button);
      this.sbi = sbi; this.bbi = bbi;
      this.lines = [`Winamax Poker - CashGame - HandId: #${900000 + this.handNo}-1-${Date.now()} - Holdem no limit (0.05€/0.10€) - ${new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/')} UTC`,
        `Table: 'SIGMA Entraînement' 6-max (real money) Seat #${this.button + 1} is the button`,
        ...this.players.map((p, i) => `Seat ${i + 1}: ${p.name} (${p.stack.toFixed(2)}€)`), '*** ANTE/BLINDS ***'];
      this.post(sbi, this.sb, 'small blind'); this.post(bbi, this.bb, 'big blind');
      this.lines.push(`Dealt to Toi [${this.players[0].cards.map(E.cardStr).join(' ')}]`, '*** PRE-FLOP *** ');
      this.cur = this.bb; this.minRaise = this.bb; this.raises = 1; this.acted = new Set(); this.toAct = (bbi + 1) % 6; this.lastAggr = bbi;
      this.skipToNext(true);
    }
    post(i, amt, label) { const p = this.players[i]; const a = Math.min(amt, p.stack); p.stack -= a; p.put += a; p.total += a; this.lines.push(`${p.name} posts ${label} ${a.toFixed(2)}€`); }
    alive() { return this.players.filter((p) => p.inHand); }
    canAct(i) { const p = this.players[i]; return p.inHand && !p.allin; }
    roundOver() {
      const act = this.players.map((p, i) => i).filter((i) => this.canAct(i));
      if (this.alive().length <= 1) return true;
      return act.every((i) => this.acted.has(i) && this.players[i].put >= this.cur - 1e-9) || act.length === 0 || (act.length === 1 && this.players[act[0]].put >= this.cur - 1e-9 && this.acted.has(act[0]));
    }
    skipToNext(first) {
      if (!first) this.toAct = (this.toAct + 1) % 6;
      for (let k = 0; k < 6 && !this.canAct(this.toAct); k++) this.toAct = (this.toAct + 1) % 6;
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
      const win = new Array(6).fill(0);
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
      this.session.hands++; this.session.net += heroNet / this.bb;
      this.history.push(this.lines.join('\n'));
      if (this.history.length > 300) this.history.shift();
      this.notes = coach(this);
    }
    // Décision d'un bot.
    botAct() {
      const i = this.toAct, p = this.players[i], pr = PROFILES[p.profile], L = this.legal(), r = this.r;
      if (this.street === 'pre') {
        const pct = handPct(p.cards), facing = this.raises; // 1 = seulement la BB
        if (facing <= 1) {
          if (pct < pr.pfr) return this.act('raise', this.bb * (p.profile === 'maniaque' ? 3.5 : 2.5) + this.bb * this.limpers());
          if (pct < pr.vpip && (p.profile === 'station' || pct < pr.pfr * 1.3)) return this.act(L.canCheck ? 'check' : 'call');
          return this.act(L.canCheck ? 'check' : 'fold');
        }
        if (facing === 2) {
          if (pct < pr.vpip * pr.cont * pr.three) return this.act('raise', this.cur * 3);
          if (pct < pr.vpip * pr.cont || (L.toCall <= this.bb && pct < pr.vpip)) return this.act('call');
          return this.act('fold');
        }
        if (pct < (p.profile === 'maniaque' ? 0.07 : 0.025)) return this.act('raise', L.maxTo);
        if (pct < pr.vpip * pr.cont * 0.35 || (p.profile === 'station' && pct < 0.12)) return this.act('call');
        return this.act('fold');
      }
      const s = strength(p.cards, this.board, this.alive().length - 1, r);
      const size = () => L.pot * (pr.size[0] + r() * (pr.size[1] - pr.size[0]));
      if (L.canCheck) {
        if (s > 0.62 && r() < pr.value) return this.act('raise', size());
        if (s < 0.35 && r() < pr.bluff) return this.act('raise', size());
        return this.act('check');
      }
      // Face à une mise, l'équité contre des mains au hasard surestime la main : on la décote selon l'agressivité déjà vue.
      const bets = this.seq.filter((x) => x.street === this.street && x.final === 'raise').length;
      const sAdj = p.profile === 'station' ? s : s - (p.profile === 'maniaque' ? 0.05 : 0.13) * bets - (this.street === 'river' ? 0.05 : 0);
      const need = L.toCall / (L.pot + L.toCall);
      if (sAdj > pr.raise && r() < 0.6) return this.act('raise', this.cur + Math.max(this.minRaise, L.pot * 0.8));
      if (p.profile === 'maniaque' && s < 0.3 && r() < 0.12) return this.act('raise', this.cur * 2.5);
      if (sAdj > need * pr.callF || (p.profile === 'station' && s > 0.3 && r() < 0.7)) return this.act('call');
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
    if (first && firstIn && pos !== 'BB') {
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

  function posName(t, i) { return ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'][(i - t.button + 6) % 6]; }

  const api = { Table, PROFILES, handPct, strength, preflopPct, posName };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TableSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
