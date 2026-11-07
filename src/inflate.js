// Décompresseur DEFLATE brut (RFC 1951), synchrone, sans dépendance : décode les données embarquées compressées par build.sh.
// Adapté de l'algorithme de tiny-inflate (licence MIT). root.__S52inflate(base64) → texte UTF-8.
(function (root) {
  if (root.__S52inflate) return;
  function Tree() { this.t = new Uint16Array(16); this.s = new Uint16Array(288); }
  const sltree = new Tree(), sdtree = new Tree(), lb = new Uint8Array(30), lbase = new Uint16Array(30), db = new Uint8Array(30), dbase = new Uint16Array(30);
  const clcidx = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], lengths = new Uint8Array(320), offs = new Uint16Array(16);
  function bits(b, base, delta, first) { let i, s; for (i = 0; i < delta; i++) b[i] = 0; for (i = 0; i < 30 - delta; i++) b[i + delta] = (i / delta) | 0; for (s = first, i = 0; i < 30; i++) { base[i] = s; s += 1 << b[i]; } }
  function fixed(lt, dt) { let i; for (i = 0; i < 7; i++) lt.t[i] = 0; lt.t[7] = 24; lt.t[8] = 152; lt.t[9] = 112; for (i = 0; i < 24; i++) lt.s[i] = 256 + i; for (i = 0; i < 144; i++) lt.s[24 + i] = i; for (i = 0; i < 8; i++) lt.s[168 + i] = 280 + i; for (i = 0; i < 112; i++) lt.s[176 + i] = 144 + i; for (i = 0; i < 5; i++) dt.t[i] = 0; dt.t[5] = 32; for (i = 0; i < 32; i++) dt.s[i] = i; }
  function build(t, len, off, num) { let i, sum; for (i = 0; i < 16; i++) t.t[i] = 0; for (i = 0; i < num; i++) t.t[len[off + i]]++; t.t[0] = 0; for (sum = 0, i = 0; i < 16; i++) { offs[i] = sum; sum += t.t[i]; } for (i = 0; i < num; i++) if (len[off + i]) t.s[offs[len[off + i]]++] = i; }
  bits(lb, lbase, 4, 3); bits(db, dbase, 2, 1); lb[28] = 0; lbase[28] = 258; fixed(sltree, sdtree);
  function inflateRaw(src, cap) {
    const d = { src, i: 0, tag: 0, bc: 0, out: new Uint8Array(cap || src.length * 6), o: 0, lt: new Tree(), dt: new Tree() };
    const grow = (n) => { if (d.o + n <= d.out.length) return; const b = new Uint8Array(Math.max(d.out.length * 2, d.o + n)); b.set(d.out); d.out = b; };
    const bit = () => { if (!d.bc--) { d.tag = d.src[d.i++]; d.bc = 7; } const b = d.tag & 1; d.tag >>>= 1; return b; };
    const rb = (n, base) => { if (!n) return base; while (d.bc < 24) { d.tag |= (d.src[d.i++] || 0) << d.bc; d.bc += 8; } const v = d.tag & (0xffff >>> (16 - n)); d.tag >>>= n; d.bc -= n; return v + base; };
    const sym = (t) => { while (d.bc < 24) { d.tag |= (d.src[d.i++] || 0) << d.bc; d.bc += 8; } let sum = 0, cur = 0, len = 0, tag = d.tag; do { cur = 2 * cur + (tag & 1); tag >>>= 1; ++len; sum += t.t[len]; cur -= t.t[len]; } while (cur >= 0); d.tag = tag; d.bc -= len; return t.s[sum + cur]; };
    function dyn() {
      const hlit = rb(5, 257), hdist = rb(5, 1), hclen = rb(4, 4); let i, num, length;
      for (i = 0; i < 19; i++) lengths[i] = 0; for (i = 0; i < hclen; i++) lengths[clcidx[i]] = rb(3, 0);
      const ct = new Tree(); build(ct, lengths, 0, 19);
      for (num = 0; num < hlit + hdist;) {
        const s = sym(ct);
        if (s === 16) { const prev = lengths[num - 1]; for (length = rb(2, 3); length; --length) lengths[num++] = prev; }
        else if (s === 17) { for (length = rb(3, 3); length; --length) lengths[num++] = 0; }
        else if (s === 18) { for (length = rb(7, 11); length; --length) lengths[num++] = 0; }
        else lengths[num++] = s;
      }
      build(d.lt, lengths, 0, hlit); build(d.dt, lengths, hlit, hdist);
    }
    function block(lt, dt) {
      for (;;) {
        const s = sym(lt);
        if (s === 256) return;
        if (s < 256) { grow(1); d.out[d.o++] = s; continue; }
        const k = s - 257, len = rb(lb[k], lbase[k]), ds = sym(dt), off = d.o - rb(db[ds], dbase[ds]);
        grow(len); for (let i = off; i < off + len; i++) d.out[d.o++] = d.out[i];
      }
    }
    function stored() {
      while (d.bc > 8) { d.i--; d.bc -= 8; }
      const len = d.src[d.i] | (d.src[d.i + 1] << 8); d.i += 4; grow(len);
      for (let i = 0; i < len; i++) d.out[d.o++] = d.src[d.i++];
      d.bc = 0; d.tag = 0;
    }
    let fin;
    do { fin = bit(); const type = rb(2, 0); if (type === 0) stored(); else if (type === 1) block(sltree, sdtree); else if (type === 2) { dyn(); block(d.lt, d.dt); } else throw new Error('données compressées invalides'); } while (!fin);
    return d.out.subarray(0, d.o);
  }
  function b64(s) { if (typeof atob === 'function') { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; } return new Uint8Array(Buffer.from(s, 'base64')); }
  root.__S52inflate = (s, n) => { const u = inflateRaw(b64(s), n); return typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(u) : Buffer.from(u).toString('utf8'); };
  // Donnée compressée exposée en propriété paresseuse : décodée au premier accès seulement.
  root.__S52lazy = (name, s, n) => { let v; Object.defineProperty(root, name, { configurable: true, enumerable: true, get() { if (v === undefined) { v = JSON.parse(root.__S52inflate(s, n)); s = null; } return v; }, set(x) { v = x; } }); };
  if (typeof module !== 'undefined' && module.exports) module.exports = { inflate: root.__S52inflate };
})(typeof window !== 'undefined' ? window : globalThis);
