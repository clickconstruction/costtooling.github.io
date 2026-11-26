// Captures the "Your first day" photos for /guide/: a full phone screenshot per step plus a zoom crop of the button the step names.
// The steps follow a site visit on the sample job: welcome, job list, the job's four steps, a photo and its part, the words on a part, the bill, the owner update, sign in.
// Run against a local server: NODE_PATH=<node_modules with playwright> ENGINE=webkit node qa/guide-shots.js http://127.0.0.1:8766
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
  const open = async (q, wait = 1000) => { await page.goto(`${BASE}/app/?shot=1&${q}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(wait); };
  // sel is one selector or locator, or a list of them: the zoom crop then takes in all of them (a label and its box, say).
  // pad is the margin around the crop; pass a small one where a neighbour sits closer than 12 px.
  const shot = async (name, sel, pad = PAD) => {
    const els = (Array.isArray(sel) ? sel : sel ? [sel] : []).map(s => typeof s === 'string' ? page.locator(s).first() : s);
    // Centre the target in its screen, clear of the tab bar and the bulb. Sheets do not scroll, so their buttons stay put.
    if (els.length) { await els[0].evaluate(e => { if (e.closest('.screen')) e.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(250); }
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    if (els.length) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const el of els) { const b = await el.boundingBox(); if (!b) throw new Error('no box for ' + name); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
      const x = Math.max(0, x0 - pad), y = Math.max(0, y0 - pad);
      await page.screenshot({ path: path.join(OUT, `${name}-zoom.png`), clip: { x, y, width: Math.min(W - x, x1 - x0 + 2 * pad), height: Math.min(H - y, y1 - y0 + 2 * pad) } });
    }
    console.log('shot', name);
  };
  // The sample job's Framing: the part the guide photographs, marks and reads the bill for.
  const framing = () => page.evaluate(() => App.state().projects.find(p => p.sample).items.find(i => i.n === 'Framing').id);

  // 1. first open: the welcome card and its two buttons
  await open('s=projects', 1200); await shot('fd-01-welcome', '#welcomeBtns');
  await page.evaluate(() => localStorage.setItem('ct-welcomed', '1'));
  // 2. the job list: tap the sample job
  await open('s=projects'); await shot('fd-02-projects', '#projectsBody button.card.tap.job', 6);
  // 3. the job's first screen: four steps, the first is Take photos
  await open('s=home'); await shot('fd-03-home', '#homeBody .steps .step', 6);
  // 4. Add a photo, opened the way the reader opens it: the Take a photo and Pick photos tiles
  await page.click('#homeBody .steps .step'); await page.waitForSelector('#pendGrid'); await page.waitForTimeout(400);
  await shot('fd-04-camera', ['#pendGrid .ph.add.cam', '#pendGrid .ph.add.gal', '#pendHint']);
  // 5. the same form with a photo in it: Which part of the job is it?
  //    The photo is one of the sample job's drawn photos, handed to the app's own Pick photos input.
  const jpeg = await page.evaluate(() => Photos.sample({ seed: 8, kind: 'frame', wx: 'sun' }, 800).toDataURL('image/jpeg', 0.85));
  await page.setInputFiles('#fileGal', { name: 'framing.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(jpeg.split(',')[1], 'base64') });
  await page.waitForSelector('#pendGrid .ph:not(.add) img, #pendGrid .ph:not(.add) canvas'); await page.waitForTimeout(600);
  await shot('fd-05-part', ['label[for="efItem"]', '#efItem']);
  // 6. the part picked and a note typed: Save
  await page.selectOption('#efItem', await framing()); await page.fill('#efNote', 'Kitchen wall is framed.'); await page.locator('#efNote').blur();
  await shot('fd-05-save', ['button[onclick="App.saveEntry()"]', 'button[onclick="App.cancelEntry()"]']);
  await page.click('button[onclick="App.cancelEntry()"]'); await page.waitForTimeout(300); // leave the sample job as it was
  // 7. Parts: the list of parts, tap one
  await open('s=sov'); await shot('fd-06a-parts', `button.card.part[data-item="${await framing()}"]`, 6);
  // 8. one part: How far along is it? The crop is the last three of the five word buttons, so the words stay large in the guide.
  await page.click(`button.card.part[data-item="${await framing()}"]`); await page.waitForSelector('#words'); await page.waitForTimeout(500);
  await shot('fd-06-progress', ['#words .w:nth-child(3)', '#words .w:nth-child(5)'], 5);
  // 9. Bill: the drawn sample bill with the % column ringed
  await open('s=bill'); await shot('fd-06b-bill', '#billHow .billpic');
  // 10. Bill: the percent box beside a part
  await shot('fd-06c-bill-type', `#billCard .billline[data-bill="${await framing()}"]`, 4);
  // 11. Send: Send it to the owner, above the owner update
  await open('s=report'); await shot('fd-07-report', '#sendBtn');
  // 12. the share sheet: its first row, Text it or send it
  await page.click('#sendBtn'); await page.waitForTimeout(500); await shot('fd-08-share', '#shareSheet .hrow', 6);
  // 13. the job list again: Sign in and I have a code, on the card below the jobs
  await open('s=projects'); await shot('fd-09-signin', ['#cloudPromo .btn', '#cloudPromo .btn.q'], 8);
  await browser.close();
  console.log('engine:', ENGINE, 'errors:', errors.length); errors.forEach(e => console.log('  -', e));
  process.exit(errors.length ? 1 : 0);
})();
