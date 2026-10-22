// Confort d'utilisation : recherche globale (Ctrl+K ou /), thème clair/sombre/auto, aide des raccourcis (?).
(function () {
  const X = window.__S52, K = window.Course, S = window.Spots, CH = window.Champions;
  const { $, esc, render, ACT, TOOLS } = X;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ---------------- Thème ----------------
  const THEMES = ['auto', 'light', 'dark'], TLABEL = { auto: 'Thème automatique', light: 'Thème clair', dark: 'Thème sombre' };
  const TICON = {
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15a7.5 7.5 0 0 0 0-15z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
  };
  let theme = 'auto';
  try { theme = localStorage.getItem('sigma52.theme') || 'auto'; } catch (e) { /* stockage indisponible */ }
  function applyTheme() {
    if (theme === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
    const b = $('#themeBtn'); if (b) { b.innerHTML = TICON[theme]; b.setAttribute('aria-label', TLABEL[theme] + ' (changer)'); b.title = TLABEL[theme]; }
  }
  ACT.theme = () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; try { localStorage.setItem('sigma52.theme', theme); } catch (e) { /* ignoré */ } applyTheme(); X.AFTER[X.getTab()]?.(); };
  applyTheme();

  // ---------------- Recherche globale ----------------
  function entries() {
    const out = [];
    const tabDesc = { jour: 'Programme, révisions, spots du jour', parcours: 'Objectif, test de niveau, chemin le plus court', profil: 'Score SIGMA, Elo, ligue de la semaine, médailles, badges, sauvegarde des données', cours: '92 modules, 6 niveaux, examens de niveau, lexique de 100 termes', spots: 'Exercices corrigés', sim: 'Table avec coach, mains guidées, Expresso', champions: '27 styles inspirés de joueurs connus, parcours des champions', live: 'Décision éclair avec EV, range adverse, joueurs, soirée, entraînement, minuteur (parties amicales)', solveur: 'Équilibre postflop, rapport agrégé, entraîneur river', analyse: 'Historiques, replayer, bibliothèque', outils: 'Équité, board, push/fold, calculs', journal: 'Sessions, bankroll, variance', carriere: 'Critères de passage pro, simulateur de carrière sur 12 mois', mental: 'Check-in avant session, carte de tilt, fiches de correction, coût du tilt', studio: 'Images et vidéos à partir de tes mains' };
    X.TABS.forEach(([k, l]) => out.push({ kind: 'Onglet', title: l, desc: tabDesc[k] || '', run: () => X.go(k) }));
    K.MODULES.forEach((m) => out.push({ kind: 'Module', title: m.title, desc: `Niveau ${m.level} · ${K.LEVELS[m.level - 1].title} · ${m.minutes} min`, extra: m.sections.map((s) => s[0]).join(' '), run: () => { X.setOpenMod(m.id); X.go('cours'); } }));
    Object.entries(S.TYPES).forEach(([k, l]) => out.push({ kind: 'Exercice', title: l, desc: 'Spots corrigés', run: () => { X.setSpotMode(k); X.go('spots'); } }));
    TOOLS.forEach(([k, l]) => out.push({ kind: 'Outil', title: l, desc: 'Onglet Outils', run: () => { X.setTool(k); X.go('outils'); } }));
    if (CH) CH.STYLES.forEach((s) => out.push({ kind: 'Champion', title: s.name, desc: 'Inspiré de ' + s.inspired, extra: s.inspired, run: () => { X.champSelect?.(s.id); X.go('champions'); } }));
    K.GLOSSARY.forEach(([t, d]) => out.push({ kind: 'Lexique', title: t, desc: d, run: () => { X.go('cours'); } }));
    out.push({ kind: 'Action', title: 'Résoudre une river au hasard', desc: 'Solveur exact, en une seconde', run: () => { const sv = X.solverState; const d = [...Array(52).keys()].sort(() => Math.random() - 0.5); sv.sub = 'solve'; sv.board = d.slice(0, 5).map(window.Engine.cardStr).join(''); sv.game = null; X.go('solveur'); } });
    out.push({ kind: 'Action', title: 'Entraîneur river', desc: 'Décisions notées en perte d\'EV', run: () => { X.solverState.sub = 'train'; X.go('solveur'); } });
    out.push({ kind: 'Action', title: 'Défi mystère', desc: 'Identifier un style en 60 mains', run: () => ACT.chmyst?.() });
    out.push({ kind: 'Action', title: 'Test de niveau', desc: '24 questions pour savoir où commencer', run: () => ACT.plstart?.() });
    for (const L of (window.Course?.LEVELS || [])) out.push({ kind: 'Action', title: 'Examen niveau ' + L.n + ' : ' + L.title, desc: '20 questions, validé à 80 %', run: () => ACT.exstart?.({ dataset: { l: L.n } }) });
    out.push({ kind: 'Action', title: 'Exporter mes données', desc: 'Sauvegarde JSON de toute ta progression', run: () => ACT.dataexp?.() });
    out.push({ kind: 'Action', title: 'Changer de thème', desc: 'Automatique, clair, sombre', run: () => ACT.theme() });
    out.push({ kind: 'Action', title: 'Raccourcis clavier', desc: 'Toutes les touches', run: () => setTimeout(help, 10) });
    return out;
  }
  let pal = null; // { q, sel, list }
  function score(e, q) {
    if (!q) return e.kind === 'Onglet' ? 3 : e.kind === 'Action' ? 2 : 0;
    const t = norm(e.title), d = norm(e.desc + ' ' + (e.extra || ''));
    if (t.startsWith(q)) return 10; if (t.includes(q)) return 7;
    const words = q.split(/\s+/).filter(Boolean);
    if (words.every((w) => t.includes(w))) return 6; if (words.every((w) => (t + ' ' + d).includes(w))) return 3;
    return 0;
  }
  function results() {
    const q = norm(pal.q.trim()), all = entries().map((e) => ({ e, s: score(e, q) })).filter((x) => x.s > 0);
    all.sort((a, b) => b.s - a.s); return all.slice(0, 40).map((x) => x.e);
  }
  function drawPalette() {
    const box = $('#cmdk'); if (!pal) { box.hidden = true; box.innerHTML = ''; return; }
    pal.list = results(); pal.sel = Math.min(pal.sel, Math.max(0, pal.list.length - 1));
    const ul = pal.list.length ? pal.list.map((e, i) => `<li><button data-pi="${i}" aria-selected="${i === pal.sel}"><span class="k">${esc(e.kind)}</span><span>${esc(e.title)}<span class="d">${esc(e.desc)}</span></span></button></li>`).join('') : '<li class="note" style="padding:12px">Aucun résultat.</li>';
    if (box.hidden || !box.querySelector('input')) {
      box.hidden = false;
      box.innerHTML = `<div class="box" role="dialog" aria-label="Recherche"><input id="cmdkq" placeholder="Module, outil, exercice, terme, champion…" autocomplete="off" spellcheck="false" aria-label="Rechercher"><ul id="cmdkl" role="listbox"></ul><div class="foot"><span>↑ ↓ pour choisir</span><span>Entrée pour ouvrir</span><span>Échap pour fermer</span></div></div>`;
      const inp = $('#cmdkq'); inp.value = pal.q; inp.focus();
      inp.addEventListener('input', () => { pal.q = inp.value; pal.sel = 0; drawPalette(); });
    }
    $('#cmdkl').innerHTML = ul;
    $('#cmdkl [aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function openPalette() { pal = { q: '', sel: 0, list: [] }; drawPalette(); }
  function closePalette() { pal = null; drawPalette(); }
  function runSel(i) { const e = pal?.list[i]; closePalette(); if (e) e.run(); }
  ACT.cmdk = () => openPalette();
  document.addEventListener('click', (e) => {
    if (!pal) return;
    const b = e.target.closest('[data-pi]'); if (b) { e.stopPropagation(); runSel(+b.dataset.pi); return; }
    if (e.target.id === 'cmdk') closePalette();
  }, true);

  // ---------------- Aide des raccourcis ----------------
  function help() {
    pal = null; const box = $('#cmdk'); box.hidden = false;
    const rows = [['Ctrl K ou /', 'Recherche globale'], ['?', 'Cette aide'], ['Échap', 'Fermer'], ['Spots : 1 à 4', 'Répondre'], ['Spots : Entrée', 'Spot suivant'], ['Simulateur : F / C', 'Se coucher / parole ou suivre'], ['Simulateur : Entrée', 'Main suivante'], ['Replayer : ← →', 'Étape précédente / suivante'], ['Entraîneur : 1 à 5, Entrée', 'Répondre, spot suivant'], ['Test de niveau : 1 à 4, Entrée', 'Répondre, question suivante'], ['Table live : a s, k h…', 'Saisir une carte (valeur puis couleur)'], ['Table live : Retour, Entrée', 'Effacer la dernière carte, nouvelle main'], ['Entraînement éclair : 1 à 3, Entrée', 'Répondre, spot suivant']];
    box.innerHTML = `<div class="box" role="dialog" aria-label="Raccourcis clavier"><div style="padding:16px 18px"><h2>Raccourcis clavier</h2></div><ul>${rows.map(([k, d]) => `<li><div style="display:grid;grid-template-columns:180px 1fr;gap:10px;padding:8px 12px"><span class="mono">${k}</span><span>${d}</span></div></li>`).join('')}</ul><div class="foot"><button class="btn small" data-act="closehelp">Fermer</button></div></div>`;
  }
  ACT.closehelp = () => { $('#cmdk').hidden = true; $('#cmdk').innerHTML = ''; };
  const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  document.addEventListener('keydown', (e) => {
    const open = !$('#cmdk').hidden;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopPropagation(); pal ? closePalette() : openPalette(); return; }
    if (open) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); pal ? closePalette() : ACT.closehelp(); return; }
      if (!pal) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); pal.sel = Math.min(pal.list.length - 1, pal.sel + 1); drawPalette(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); pal.sel = Math.max(0, pal.sel - 1); drawPalette(); }
      else if (e.key === 'Enter') { e.preventDefault(); runSel(pal.sel); }
      return;
    }
    if (typing(e.target)) return;
    if (e.key === '/') { e.preventDefault(); e.stopPropagation(); openPalette(); }
    else if (e.key === '?') { e.preventDefault(); e.stopPropagation(); help(); }
  }, true);
})();
