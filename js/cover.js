/* Cover + report renderers (canvas) and sharing. */
const Render = (() => {
  const F = '-apple-system, Helvetica, Arial, sans-serif';
  const txt = (g, s, x, y, font, color, align, max) => { g.font = font; g.fillStyle = color; g.textAlign = align || 'left'; g.fillText(String(s), x, y, max); g.textAlign = 'left'; };
  const wrap = (g, s, x, y, w, lh, font, color, maxLines) => { g.font = font; g.fillStyle = color; const words = String(s || '').split(/\s+/); let line = '', n = 0; for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > w && line) { g.fillText(line, x, y); y += lh; line = wd; if (++n >= (maxLines || 99) - 1) { break; } } else line = t; } if (line) g.fillText(line, x, y); return y + lh; };
  const coverPhoto = (g, img, x, y, w, h, label) => {
    if (!img) { g.fillStyle = '#e2dfd6'; g.fillRect(x, y, w, h); txt(g, 'No photo', x + w / 2, y + h / 2, '600 28px ' + F, '#9a978e', 'center'); return; }
    const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight; const s = Math.max(w / iw, h / ih); const sw = w / s, sh = h / s;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h); g.restore();
    if (label) { g.font = '600 22px ' + F; const tw = g.measureText(label).width + 24; g.fillStyle = 'rgba(22,22,23,.72)'; g.fillRect(x, y + h - 44, tw, 44); txt(g, label, x + 12, y + h - 14, '600 22px ' + F, '#fff'); }
  };

  let coverSeq = 0, coverReady = Promise.resolve(), coverBlob = null;
  function cover(c, p, k, sel) { const t = ++coverSeq; coverBlob = null; coverReady = coverInner(c, p, k, sel, t).then(() => { if (t === coverSeq) return new Promise(r => c.toBlob(b => { if (t === coverSeq) coverBlob = b; r(); }, 'image/jpeg', 0.92)); }).catch(e => console.warn('cover render', e)); return coverReady; }
  async function coverInner(c, p, k, sel, t) {
    const imgs = await Promise.all(sel.map(s => s ? Photos.drawable(s.ph) : null));
    if (t !== coverSeq) return;
    const g = c.getContext('2d'), W = c.width, H = c.height; const cv = p.cover;
    g.fillStyle = '#f6f5f1'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#161617'; g.fillRect(0, 0, W, 220);
    g.fillStyle = '#e8c547'; g.fillRect(60, 56, 58, 58); txt(g, 'CT', 89, 95, '900 26px ' + F, '#161617', 'center');
    txt(g, 'PROGRESS UPDATE', 140, 72, '700 24px ' + F, '#e8c547');
    txt(g, p.name || 'Untitled project', 140, 120, '700 44px ' + F, '#fff', 'left', W - 200);
    txt(g, [cv.date || Data.mdy(Data.iso(Data.today())), p.client, p.addr].filter(Boolean).join('  ·  '), 60, 185, '400 28px ' + F, '#b9b7af', 'left', W - 120);
    const area = { x: 60, y: 250, w: W - 120, h: 710 }, gap = 16;
    const lbl = s => s ? Data.md(s.e.d) + (s.item ? ' · ' + s.item : '') : '';
    const L = cv.layout || 'hero';
    if (L === 'hero') coverPhoto(g, imgs[0], area.x, area.y, area.w, area.h, lbl(sel[0]));
    else if (L === 'grid') { const w = (area.w - gap) / 2, h = (area.h - gap) / 2; [0, 1, 2, 3].forEach(i => coverPhoto(g, imgs[i], area.x + (i % 2) * (w + gap), area.y + Math.floor(i / 2) * (h + gap), w, h, lbl(sel[i]))); }
    else { const w = (area.w - gap) * 0.62, w2 = area.w - gap - w, h = (area.h - gap) / 2; coverPhoto(g, imgs[0], area.x, area.y, w, area.h, lbl(sel[0])); coverPhoto(g, imgs[1], area.x + w + gap, area.y, w2, h, lbl(sel[1])); coverPhoto(g, imgs[2], area.x + w + gap, area.y + h + gap, w2, h, lbl(sel[2])); }
    const nums = cv.numMode === 'manual' ? [[(cv.manual.pct ?? 0) + '%', 'complete'], [Data.fmt$(cv.manual.toGo || 0), 'to finish'], [cv.manual.days ?? 0, 'days left'], [(cv.date || '').split(',')[0] || Data.md(Data.iso(Data.today())), 'as of']]
                                         : [[Math.round(k.pct * 100) + '%', 'complete'], [Data.fmt$(k.cost), 'cost so far'], [Data.fmt$(k.toGo), 'to finish'], [k.daysLeft, 'days left']];
    const by = 990; g.fillStyle = '#fff'; g.fillRect(60, by, W - 120, 180); g.strokeStyle = '#e2dfd6'; g.lineWidth = 3; g.strokeRect(60, by, W - 120, 180);
    nums.forEach(([v, l], i) => { const cx = 60 + (W - 120) / 8 + i * (W - 120) / 4; if (i) { g.fillStyle = '#e2dfd6'; g.fillRect(60 + i * (W - 120) / 4, by + 30, 2, 120); } txt(g, v, cx, by + 88, '800 50px ' + F, '#161617', 'center', (W - 120) / 4 - 24); txt(g, l.toUpperCase(), cx, by + 135, '600 20px ' + F, '#6b6a66', 'center'); });
    txt(g, cv.head || '', 60, 1240, '700 40px ' + F, '#161617', 'left', W - 120);
    txt(g, cv.note || '', 60, 1288, '400 26px ' + F, '#6b6a66', 'left', W - 120);
    g.fillStyle = '#e8c547'; g.fillRect(0, H - 12, W, 12);
  }

  async function report(c, p, k, photos) {
    const imgs = await Promise.all(photos.slice(0, 3).map(s => Photos.drawable(s.ph)));
    const W = 1080, H = 4000; const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const g = tmp.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#161617'; g.fillRect(0, 0, W, 16);
    g.fillStyle = '#161617'; g.fillRect(60, 60, 64, 64); txt(g, 'CT', 92, 103, '900 26px ' + F, '#e8c547', 'center');
    txt(g, p.name || 'Untitled project', 150, 92, '700 40px ' + F, '#161617', 'left', W - 210);
    txt(g, 'Progress report · ' + Data.mdy(Data.iso(Data.today())) + (p.client ? ' · for ' + p.client : ''), 150, 128, '400 24px ' + F, '#6b6a66', 'left', W - 210);
    const nums = [[Math.round(k.pct * 100) + '%', 'complete'], [Data.fmtK(k.cost), 'cost so far'], [Data.fmtK(k.toGo), 'to finish'], [k.daysLeft, 'days left']];
    nums.forEach(([v, l], i) => { const x = 60 + i * 245, y = 180; g.fillStyle = '#f6f5f1'; g.fillRect(x, y, 225, 130); txt(g, v, x + 112, y + 72, '800 44px ' + F, '#161617', 'center', 200); txt(g, l.toUpperCase(), x + 112, y + 108, '600 18px ' + F, '#6b6a66', 'center'); });
    let y = 370;
    const summary = !k.total ? `${p.cover?.head ? p.cover.head + '. ' : ''}No line items yet. Add budgets on the Progress screen and this report fills itself in.` : `${p.cover?.head ? p.cover.head + '. ' : ''}${k.ahead ? 'Work is ahead of the calendar' : 'Work is behind the calendar'} (${Math.round(k.pct * 100)}% done with ${Math.round(k.schedPct * 100)}% of the schedule used). Costs are ${k.cost > k.earned ? 'running ' + Data.fmt$(k.cost - k.earned) + ' over earned value' : 'tracking ' + Data.fmt$(k.earned - k.cost) + ' under earned value'}.${k.pct > 0 ? ' At the current pace the job finishes ' + Data.md(Data.iso(k.paceFinish)) + '.' : ''}`;
    y = wrap(g, summary, 60, y, W - 120, 36, '400 26px ' + F, '#161617', 5) + 10;
    const cols = [60, 620, 760, 1020];
    g.fillStyle = '#161617'; g.fillRect(60, y, W - 120, 2); y += 36;
    txt(g, 'Line item', cols[0], y, '700 24px ' + F, '#161617'); txt(g, 'Budget', cols[1], y, '700 24px ' + F, '#161617', 'right'); txt(g, '%', cols[2], y, '700 24px ' + F, '#161617', 'right'); txt(g, 'Cost', cols[3], y, '700 24px ' + F, '#161617', 'right'); y += 14;
    (p.items || []).forEach(i => { y += 46; g.fillStyle = '#e2dfd6'; g.fillRect(60, y - 32, W - 120, 1); txt(g, i.n, cols[0], y, '400 24px ' + F, '#161617', 'left', 520); txt(g, Data.fmt$(i.b), cols[1], y, '400 24px ' + F, '#161617', 'right'); txt(g, (i.pct || 0) + '%', cols[2], y, '400 24px ' + F, '#161617', 'right'); txt(g, Data.fmt$(Data.itemCost(i)), cols[3], y, '400 24px ' + F, '#161617', 'right'); });
    y += 50; g.fillStyle = '#161617'; g.fillRect(60, y - 36, W - 120, 2);
    txt(g, 'Total', cols[0], y, '700 24px ' + F, '#161617'); txt(g, Data.fmt$(k.total), cols[1], y, '700 24px ' + F, '#161617', 'right'); txt(g, Math.round(k.pct * 100) + '%', cols[2], y, '700 24px ' + F, '#161617', 'right'); txt(g, Data.fmt$(k.cost), cols[3], y, '700 24px ' + F, '#161617', 'right');
    if (photos.length) { y += 60; txt(g, 'Recent photos', 60, y, '700 26px ' + F, '#161617'); y += 20; imgs.forEach((im, i) => coverPhoto(g, im, 60 + i * 330, y, 300, 300, Data.md(photos[i].e.d))); y += 320; }
    y += 50; if (p.cover?.note) y = wrap(g, p.cover.note, 60, y, W - 120, 32, '400 24px ' + F, '#6b6a66', 3);
    const endY = Math.ceil(y + 40); c.width = W; c.height = endY; const out = c.getContext('2d'); out.drawImage(tmp, 0, 0, W, endY, 0, 0, W, endY); out.fillStyle = '#e8c547'; out.fillRect(0, endY - 12, W, 12);
  }

  let sharing = false;
  /** Share a ready Blob inside the user's gesture. Returns shared | cancelled | downloaded | blocked. */
  async function shareBlob(blob, name, title) {
    if (!blob) return 'empty'; if (sharing) return 'busy'; sharing = true;
    try {
      const file = new File([blob], name, { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; if (e.name === 'NotAllowedError') return 'blocked'; console.warn('share failed', e); } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return 'downloaded';
    } finally { sharing = false; }
  }
  const canvasBlob = c => new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
  return { cover, report, shareBlob, canvasBlob, ready: () => coverReady, coverBlob: () => coverBlob };
})();
