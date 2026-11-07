// Compresse un fichier de données (src/*.js qui exporte un objet JSON) en stub paresseux : DEFLATE brut niveau 9, base64.
// Usage : node tools/pack_data.js src/flop_library.js → écrit le stub sur la sortie standard. Appelé par build.sh.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const f = path.resolve(process.argv[2]), src = fs.readFileSync(f, 'utf8');
const m = src.match(/root\.(\w+)\s*=\s*\w+;/); if (!m) throw new Error('nom global introuvable : ' + f);
const json = JSON.stringify(require(f)), raw = Buffer.from(json, 'utf8');
const z = zlib.deflateRawSync(raw, { level: 9, memLevel: 9 });
if (zlib.inflateRawSync(z).toString('utf8') !== json) throw new Error('aller-retour incorrect : ' + f);
process.stdout.write(`// ${path.basename(f)} compressé par tools/pack_data.js (${raw.length} → ${z.length} octets).\n__S52lazy(${JSON.stringify(m[1])}, "${z.toString('base64')}", ${raw.length});\n`);
