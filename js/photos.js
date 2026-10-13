/* Photos — import (downscale) real photos, draw sample ones, and hand out image URLs. */
const Photos = (() => {
  const THUMB = 360, FULL = 1600;
  const urls = {};      // id -> { thumb, full } object URLs
  const pending = {};   // id -> promise

  async function decode(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {} }
    return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
  }
  function fit(src, max, cover) {
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
    const c = document.createElement('canvas');
    if (cover) { c.width = c.height = max; const s = Math.max(max / w, max / h); const sw = w * s, sh = h * s; c.getContext('2d').drawImage(src, (max - sw) / 2, (max - sh) / 2, sw, sh); }
    else { const s = Math.min(1, max / Math.max(w, h)); c.width = Math.round(w * s); c.height = Math.round(h * s); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); }
    return c;
  }
  const toBlob = (c, q) => new Promise(r => c.toBlob(r, 'image/jpeg', q));
  async function importFile(file) {
    const bmp = await decode(file);
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const tc = fit(bmp, THUMB, true), fc = fit(bmp, FULL, false); const w = bmp.width, h = bmp.height; if (bmp.close) bmp.close();
    const thumb = await toBlob(tc, 0.82), full = await toBlob(fc, 0.86); tc.width = tc.height = fc.width = fc.height = 0;
    if (!thumb || !full) throw new Error('Could not process the photo (out of image memory)');
    await DB.putPhoto({ id, thumb, full, w, h, added: Date.now() });
    urls[id] = { thumb: URL.createObjectURL(thumb), full: URL.createObjectURL(full) };
    return id;
  }
  async function load(id) {
    if (urls[id]) return urls[id];
    if (!pending[id]) pending[id] = DB.getPhoto(id).then(rec => { if (!rec || !rec.thumb || !rec.full) return null; urls[id] = { thumb: URL.createObjectURL(rec.thumb), full: URL.createObjectURL(rec.full) }; return urls[id]; }).catch(e => { delete pending[id]; console.warn('photo load failed', e); return null; });
    return pending[id];
  }
  async function remove(id) { await DB.delPhoto(id); const u = urls[id]; if (u) { try { URL.revokeObjectURL(u.thumb); URL.revokeObjectURL(u.full); } catch (e) {} } delete urls[id]; delete pending[id]; delete decoded[id]; }

  // ----- sample photos: drawn, not stored -----
  const rnd = seed => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const sampleCache = {}, sampleUrl = {};
  const skey = (ph, size) => ph.seed + '-' + ph.kind + '-' + ph.wx + '-' + size;
  function sample(ph, size) { const key = skey(ph, size); if (!sampleCache[key]) sampleCache[key] = drawSample(ph, size); return sampleCache[key]; }
  function sampleSrc(ph, size) { const key = skey(ph, size); if (!sampleUrl[key]) sampleUrl[key] = sample(ph, size).toDataURL('image/jpeg', 0.85); return sampleUrl[key]; }
  function drawSample(p, S) {
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); const r = rnd(p.seed);
    const sky = { sun: ['#8fb2cf', '#e4ecf1'], cloud: ['#a3aab0', '#d9dcde'], rain: ['#7b8389', '#b1b7bc'], wind: ['#9db6c8', '#dde6ec'] }[p.wx] || ['#8fb2cf', '#e4ecf1'];
    let gr = g.createLinearGradient(0, 0, 0, S * 0.7); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    if (p.wx !== 'sun') { g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(S * (0.1 + i * 0.28), S * (0.12 + r() * 0.15), S * 0.18, S * 0.06, 0, 0, 7); g.fill(); } }
    gr = g.createLinearGradient(0, S * 0.68, 0, S); gr.addColorStop(0, '#9a8c78'); gr.addColorStop(1, '#6f6253'); g.fillStyle = gr; g.fillRect(0, S * 0.68, S, S * 0.32);
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = S * 0.004; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, S * (0.72 + i * 0.05)); g.lineTo(S, S * (0.70 + i * 0.055)); g.stroke(); }
    const wood = '#b58a57', wood2 = '#8d6a40', osb = '#c9a970', conc = '#9b9a95';
    if (p.kind === 'frame' || p.kind === 'walls') {
      const n = 7 + Math.floor(r() * 4), x0 = S * 0.08, w = S * 0.84, y0 = S * 0.28, h = S * 0.42;
      if (p.kind === 'walls') { g.fillStyle = osb; for (let i = 0; i < 3; i++) { if (r() > 0.35) g.fillRect(x0 + i * w / 3 + S * 0.01, y0, w / 3 - S * 0.02, h); } }
      g.fillStyle = wood; for (let i = 0; i <= n; i++) { const x = x0 + i * (w / n); g.fillRect(x - S * 0.012, y0, S * 0.024, h); }
      g.fillRect(x0 - S * 0.012, y0 - S * 0.03, w + S * 0.024, S * 0.03); g.fillRect(x0 - S * 0.012, y0 + h, w + S * 0.024, S * 0.03);
      g.fillStyle = wood2; if (p.kind === 'frame') { g.save(); g.translate(x0 + w * 0.5, y0 + h * 0.5); g.rotate(-0.45); g.fillRect(-w * 0.45, -S * 0.01, w * 0.9, S * 0.02); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i <= n; i++) { g.fillRect(x0 + i * (w / n) + S * 0.012, y0, S * 0.006, h); }
    } else if (p.kind === 'roof') {
      const x0 = S * 0.06, w = S * 0.88, base = S * 0.7, peak = S * 0.22;
      g.fillStyle = osb; g.beginPath(); g.moveTo(x0, base); g.lineTo(x0 + w / 2, peak); g.lineTo(x0 + w, base); g.closePath(); g.fill();
      g.strokeStyle = wood2; g.lineWidth = S * 0.016; const n = 9; for (let i = 0; i <= n; i++) { const t = i / n; const bx = x0 + t * w; const topy = peak + Math.abs(t - 0.5) * 2 * (base - peak); g.beginPath(); g.moveTo(bx, base); g.lineTo(bx, topy); g.stroke(); }
      g.beginPath(); g.moveTo(x0, base); g.lineTo(x0 + w / 2, peak); g.lineTo(x0 + w, base); g.stroke();
      g.fillStyle = wood; g.fillRect(x0, base - S * 0.02, w, S * 0.035);
      if (r() > 0.5) { g.fillStyle = 'rgba(40,40,45,.55)'; g.fillRect(x0 + w * 0.55, peak + S * 0.09, w * 0.3, S * 0.14); }
    } else {
      g.fillStyle = conc; g.fillRect(S * 0.06, S * 0.5, S * 0.88, S * 0.22);
      g.fillStyle = wood2; g.fillRect(S * 0.04, S * 0.48, S * 0.92, S * 0.035); g.fillRect(S * 0.04, S * 0.70, S * 0.92, S * 0.035);
      g.strokeStyle = '#5c5a55'; g.lineWidth = S * 0.008; for (let i = 0; i < 7; i++) { const x = S * (0.12 + i * 0.12); g.beginPath(); g.moveTo(x, S * 0.52); g.lineTo(x, S * 0.7); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(S * 0.06, S * 0.5, S * 0.88, S * 0.03);
    }
    if (p.wx === 'sun') { gr = g.createRadialGradient(S * 0.85, S * 0.1, 0, S * 0.85, S * 0.1, S * 0.5); gr.addColorStop(0, 'rgba(255,245,200,.55)'); gr.addColorStop(1, 'rgba(255,245,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
    gr = g.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  }

  /** Element for a photo ref ({id} real or {seed,kind,wx} sample). Real ones fill in asynchronously. */
  function el(ph, size) {
    const img = document.createElement('img'); img.alt = ''; img.decoding = 'async';
    if (ph.seed != null) { img.src = sampleSrc(ph, size === 'full' ? 800 : 256); return img; }
    const u = urls[ph.id];
    if (u) { img.src = size === 'full' ? u.full : u.thumb; return img; }
    img.classList.add('pending');
    load(ph.id).then(u2 => { if (u2) { img.onload = () => img.classList.remove('pending'); img.src = size === 'full' ? u2.full : u2.thumb; } else img.classList.add('missing'); }).catch(() => img.classList.add('missing'));
    return img;
  }
  /** Drawable (canvas or decoded Image) for canvas renderers; cached per photo. */
  const decoded = {};
  async function drawable(ph) {
    if (ph.seed != null) return sample(ph, 800);
    if (decoded[ph.id]) return decoded[ph.id];
    const u = await load(ph.id); if (!u) return null;
    const img = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = u.full; });
    if (img) decoded[ph.id] = img; return img;
  }
  return { importFile, load, remove, el, drawable, sample };
})();
