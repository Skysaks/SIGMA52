// Cours › Carte 360 : chaque domaine du poker, ses modules (maîtrisés ou non), ses entraînements et ses outils, sur une seule vue.
// Tout module du catalogue appartient à un domaine ; un module non classé apparaît dans « Autres » (le test le signale).
(function () {
  const X = window.__S52, K = window.Course;
  const { esc, pct, state, VIEWS, ACT } = X;
  const D360 = [
    { k: 'cadre', t: 'Règles, cadre, jeu responsable', mods: ['cadre', 'regles', 'mains', 'notation', 'responsable', 'online', 'sprint'], go: [['Débuter', 'tab:debuter']] },
    { k: 'pre', t: 'Préflop', mods: ['positions', 'preflop', 'preflop2', 'tailles', 'blindes', 'squeeze', 'ante_straddle', 'pots3bet', 'construire', 'pots4bet'], go: [['Spots : ouverture', 'spots:rfi'], ['Spots : face à une ouverture', 'spots:vsopen'], ['Ranges', 'tool:ranges'], ['Dessine la range', 'tool:dessin'], ['Solveur préflop', 'solver:preflop']] },
    { k: 'post', t: 'Après le flop', mods: ['postflop', 'sizing', 'petitesmises', 'textures', 'tirages', 'protection', 'turnriver', 'turncard', 'caller_ip', 'face_xr', 'oopplay', 'bvb_post', 'avantage', 'barrels', 'polaris', 'overbets', 'bluffcatch'], go: [['Spots : situations', 'spots:situations'], ['Cartes du turn', 'tool:runout'], ['Solveur', 'solver:solve'], ['Entraîneur', 'solver:train']] },
    { k: 'maths', t: 'Maths et théorie', mods: ['maths', 'probas', 'maths2', 'ev', 'theorie', 'ranges', 'realisation', 'mdf', 'bloqueurs', 'bayes', 'jouets', 'solveurs'], go: [['Spots : cotes', 'spots:odds'], ['Spots : MDF', 'spots:mdf'], ['Spots : combos', 'spots:combos'], ['Équité', 'tool:equite']] },
    { k: 'lect', t: 'Lecture et exploitation', mods: ['adversaires', 'fish', 'lecture', 'exploitpop', 'hud', 'styles', 'regs', 'champions', 'etudes'], go: [['Spots : profils', 'spots:profils'], ['Analyse de tes mains', 'tab:analyse'], ['Champions', 'tab:champions']] },
    { k: 'fmt', t: 'Formats, tables et structures', mods: ['formats', 'online2', 'rapide', 'selection', 'shorthanded', 'multiway', 'multiway_post', 'hu', 'profondeur', 'deep', 'rake'], go: [['Simulateur', 'tab:sim']] },
    { k: 'mtt', t: 'Tournois', mods: ['icm', 'mtt', 'expresso', 'tapiscourts', 'satellites', 'reentry', 'icm2', 'hu_final'], go: [['Spots : push-fold', 'spots:pushfold'], ['Re-entry et add-on', 'tool:reentry'], ['Spots : primes PKO', 'spots:bounty'], ['Push/Fold & ICM', 'tool:pushfold']] },
    { k: 'var', t: 'Variantes', mods: ['omaha', 'plo2', 'variantes2', 'shortdeck2', 'stud', 'limit', 'tirage_jeux'], go: [['Solveur PLO', 'solver:plo']] },
    { k: 'live', t: 'Tables physiques', mods: ['live', 'live_debut', 'live_regles', 'live_strat', 'live_tells', 'live_table', 'live_mtt', 'eclair', 'home', 'notes_live'], go: [['Table live', 'tab:live']] },
    { k: 'mental', t: 'Mental et méthode', mods: ['mental', 'tilt2', 'discipline', 'decision', 'biais', 'variance', 'perf', 'etude', 'analyste', 'loisir'], go: [['Mental', 'tab:mental'], ['Carnet de décisions', 'tab:debuter']] },
    { k: 'metier', t: 'Bankroll, métier et marché', mods: ['bankroll', 'bankroll2', 'economie', 'salaire', 'carriere', 'staking', 'business', 'fiscal', 'marche', 'integrite', 'longevite', 'progression', 'histoire'], go: [['Journal', 'tab:journal'], ['Carrière', 'tab:carriere']] },
  ];
  const mastered = (id) => (state.progress.quiz?.[id] ?? 0) >= 0.8;
  X.D360 = D360;
  let open = null;
  function mapHTML() {
    const byId = new Map(K.MODULES.map((m) => [m.id, m])), placed = new Set(D360.flatMap((d) => d.mods));
    const others = K.MODULES.filter((m) => !placed.has(m.id)).map((m) => m.id);
    const doms = others.length ? [...D360, { k: 'autres', t: 'Autres', mods: others, go: [] }] : D360;
    const rows = doms.map((d) => {
      const ms = d.mods.filter((id) => byId.has(id)), done = ms.filter(mastered).length, r = ms.length ? done / ms.length : 0;
      const body = open === d.k ? `<div class="m360">${ms.map((id) => { const m = byId.get(id); return `<button class="chip" data-act="openmod" data-id="${id}" aria-pressed="${mastered(id)}">${mastered(id) ? '✓ ' : ''}N${m.level} · ${esc(m.title)}</button>`; }).join('')}</div>
        ${d.go.length ? `<div class="row"><span class="note">S'entraîner et appliquer :</span>${d.go.map(([l, v]) => `<button class="btn small" data-act="c360go" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>` : ''}` : '';
      return `<div class="d360"><button class="d360h" data-act="c360" data-k="${d.k}" aria-expanded="${open === d.k}"><span>${esc(d.t)}</span><span class="meter" aria-hidden="true"><i style="width:${Math.round(r * 100)}%"></i></span><span class="mono note">${done}/${ms.length}</span></button>${body}</div>`;
    }).join('');
    const tot = K.MODULES.length, done = K.MODULES.filter((m) => mastered(m.id)).length;
    return `<section class="panel"><span class="eyebrow">Carte 360 · ${done}/${tot} modules maîtrisés</span><h2>Tout le poker, domaine par domaine</h2>
      <p class="note">Onze domaines couvrent l'ensemble du jeu, du cadre légal au métier. Ouvre un domaine pour voir ses modules (✓ = quiz réussi à 80 %) et les entraînements qui le travaillent. Le domaine le moins avancé est souvent le plus rentable à travailler.</p>
      <div class="l360">${rows}</div></section>`;
  }
  ACT.c360 = (t) => { open = open === t.dataset.k ? null : t.dataset.k; X.render(); };
  ACT.c360go = (t) => {
    const [kind, a] = t.dataset.v.split(':');
    if (kind === 'spots') { X.setSpotMode(a); return X.go('spots'); }
    if (kind === 'tool') { X.setTool(a); return X.go('outils'); }
    if (kind === 'solver') { if (X.solverState) X.solverState.sub = a; return X.go('solveur'); }
    X.go(a);
  };
  const base = VIEWS.cours;
  VIEWS.cours = () => {
    const html = base();
    if (html.indexOf('data-act="closemod"') >= 0 || html.indexOf('data-act="srs') >= 0 && html.indexOf('class="mod') < 0) return html;
    const at = html.indexOf('<div class="warnbox"><strong>Combien de temps');
    return at >= 0 ? html.slice(0, at) + mapHTML() + html.slice(at) : html + mapHTML();
  };
  X.map360HTML = mapHTML;
})();
