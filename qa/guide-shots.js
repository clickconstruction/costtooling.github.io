// Captures the "Your first day" photos for /guide/: a full phone screenshot per step plus a zoom crop of the button the step names.
// Run against a local server: NODE_PATH=<node_modules with playwright> ENGINE=webkit node qa/guide-shots.js http://127.0.0.1:8765
const pw = require('playwright'); const ENGINE = process.env.ENGINE || 'webkit';
const path = require('path');
const BASE = (process.argv[2] || 'https://costtooling.com').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'guide');
const W = 390, H = 844, PAD = 12;
(async () => {
  const browser = await pw[ENGINE].launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const open = async (q, wait = 1000) => { await page.goto(`${BASE}/?shot=1&${q}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(wait); };
  const shot = async (name, sel) => {
    const el = sel ? (typeof sel === 'string' ? page.locator(sel).first() : sel) : null;
    if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(200); }
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    if (el) {
      const b = await el.boundingBox(); if (!b) throw new Error('no box for ' + name);
      const x = Math.max(0, b.x - PAD), y = Math.max(0, b.y - PAD);
      await page.screenshot({ path: path.join(OUT, `${name}-zoom.png`), clip: { x, y, width: Math.min(W - x, b.width + 2 * PAD), height: Math.min(H - y, b.height + 2 * PAD) } });
    }
    console.log('shot', name);
  };
  // 1. first open: the welcome card and its two buttons
  await open('s=projects', 1200); await shot('fd-01-welcome', '#welcomeBtns');
  await page.evaluate(() => localStorage.setItem('ct-welcomed', '1'));
  // 2. the job list: tap the job
  await open('s=projects'); await shot('fd-02-projects', '[onclick^="App.openProject("]');
  // 3. home: Add photo
  await open('s=home'); await shot('fd-03-home', '#homeBody .actions .btn');
  // 4. new entry: Camera / Photos tiles
  await open('s=log&new=1'); await shot('fd-04-camera', '#pendGrid');
  // 5. same screen: Save entry
  await shot('fd-05-save', 'button[onclick="App.saveEntry()"]');
  // 6. progress: the first slider card
  await open('s=sov'); await shot('fd-06-progress', '#modeItems .card[data-item]');
  // 7. report: the share button in the top bar
  await open('s=report'); await shot('fd-07-report', '#topAct');
  // 8. the share sheet
  await page.evaluate(() => App.openShare('report')); await page.waitForTimeout(500); await shot('fd-08-share', '#shareSheet .opts');
  // 9. job list again: the Sign in card
  await open('s=projects'); await shot('fd-09-signin', page.locator('#projectsBody .card', { hasText: 'Save your jobs to the cloud' }));
  await browser.close();
  console.log('engine:', ENGINE, 'errors:', errors.length); errors.forEach(e => console.log('  -', e));
  process.exit(errors.length ? 1 : 0);
})();
