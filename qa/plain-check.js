// For the plain-words pass (mockups/owner-side/plain-words.md): opens each main screen of the sample job at iPhone size
// and lists the text smaller than 14 px and the tap targets smaller than 48 px. It changes nothing and fails nothing:
// it prints a table, and writes the detail and a screenshot of each screen to qa/shots-plain/ (git-ignored).
// Run against a local server: NODE_PATH=<node_modules with playwright> node qa/plain-check.js http://127.0.0.1:8766
// Add ENGINE=webkit to use Safari's engine instead of Chromium.
const pw = require('playwright'); const fs = require('fs'), path = require('path');
const BASE = (process.argv[2] || 'http://127.0.0.1:8766').replace(/\/$/, ''), APP = BASE + '/app';
const MIN_TEXT = 14, MIN_TAP = 48;
const OUT = path.join(__dirname, 'shots-plain'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const SCREENS = [
  ['Job list', 's=projects'], ['Welcome card', 's=projects&welcome=1'], ['Job home', 's=home'], ['Photos', 's=log'], ['Add a photo', 's=log&new=1'],
  ['Photo', 's=photo'], ['Picture to text', 's=cover'], ['Parts', 's=sov'], ['Schedule', 's=sov&m=gantt'], ['Bill', 's=bill'], ['Part', 's=item'],
  ['Send', 's=report'], ['Share sheet', 's=report&sheet=report'], ['Help sheet', 's=home&help=1'], ['Bulb sheet', 's=home&ideas=1'],
];

// Runs in the page. With a sheet open, only the sheet counts; otherwise the screen, the top bar, the tabs and the bulb.
function measure([minText, minTap]) {
  const scope = document.querySelector('.sheet.show') ? '.sheet.show' : '.screen.on, .top, #tabs:not(.hide), #fab:not(.hide)';
  const live = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); if (cs.visibility !== 'visible' || +cs.opacity === 0) return false; return !!el.closest(scope); };
  const label = el => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.value || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48);
  const text = [];
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('script, style')) return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    if (!own || !live(el)) return;
    const px = parseFloat(getComputedStyle(el).fontSize); if (px < minText) text.push({ px, text: own.slice(0, 48) });
  });
  const taps = [];
  document.querySelectorAll('button, a, input, select, textarea, summary, [onclick]').forEach(el => {
    if (!live(el) || el.disabled) return;
    const r = el.getBoundingClientRect(); if (r.height < minTap || r.width < minTap) taps.push({ h: Math.round(r.height), w: Math.round(r.width), what: label(el) });
  });
  return { text, taps };
}

(async () => {
  const browser = await pw[process.env.ENGINE || 'chromium'].launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(APP + '/?s=projects', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await DB.clearPhotos(); localStorage.clear(); localStorage.setItem('ct-welcomed', '1'); });
  const rows = [], detail = {}, sizes = {};
  for (const [name, q] of SCREENS) {
    await page.goto(APP + '/?job=sample&' + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(900);
    const m = await page.evaluate(measure, [MIN_TEXT, MIN_TAP]); detail[name] = m;
    await page.screenshot({ path: path.join(OUT, name.replace(/\W+/g, '-').toLowerCase() + '.png') });
    m.text.forEach(t => { sizes[t.px] ||= new Set(); if (sizes[t.px].size < 4) sizes[t.px].add(t.text); });
    const px = m.text.map(t => t.px), h = m.taps.map(t => t.h);
    rows.push({ screen: name, 'text under 14px': m.text.length, 'smallest text': px.length ? Math.min(...px) + 'px' : '-', 'targets under 48px': m.taps.length, 'smallest target': h.length ? Math.min(...h) + 'px' : '-' });
  }
  console.table(rows);
  console.log('Text sizes under ' + MIN_TEXT + 'px, with examples:');
  Object.keys(sizes).map(Number).sort((a, b) => a - b).forEach(px => console.log('  ' + px + 'px: ' + [...sizes[px]].map(s => JSON.stringify(s)).join(', ')));
  fs.writeFileSync(path.join(OUT, 'plain-check.json'), JSON.stringify(detail, null, 2));
  console.log('Detail and screenshots in', OUT, errors.length ? '\nPage errors: ' + errors.join(' | ') : '');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
