// Copie d'archive hors ligne : SIGMA52-hors-ligne.html = sigma52.html + polices intégrées (base64, licence OFL), aucune ressource externe.
// Usage : node tools/build_offline.js (appelé par build.sh). S'ouvre en double-cliquant, sans connexion ni compte.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), F = path.join(__dirname, 'fonts');
let html = fs.readFileSync(path.join(root, 'sigma52.html'), 'utf8');
const faces = [['Unbounded', 'unbounded', [500, 700, 800]], ['IBM Plex Mono', 'ibm-plex-mono', [400, 600]], ['IBM Plex Sans', 'ibm-plex-sans', [400, 500, 600]]]
  .flatMap(([fam, file, ws]) => ws.map((w) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(F, `${file}-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2')}`));
const before = html.length;
html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, `<style>${faces.join('')}</style>`);
if (html.length === before || /fonts\.googleapis/.test(html)) throw new Error('liens de polices introuvables dans sigma52.html');
if (/<script[^>]+src=|<link[^>]+href="http/.test(html)) throw new Error('ressource externe restante');
fs.writeFileSync(path.join(root, 'SIGMA52-hors-ligne.html'), html);
console.log('SIGMA52-hors-ligne.html', Buffer.byteLength(html), 'octets');
