// Drives the live app as an iPhone and screenshots every step into qa/shots.
// Run: NODE_PATH=<path to node_modules with playwright> node qa/walkthrough.js [baseUrl]
const pw = require('playwright'); const ENGINE = process.env.ENGINE || 'chromium'; const chromium = pw[ENGINE];
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'https://costtooling.com';
const OUT = path.join(__dirname, ENGINE === 'chromium' ? 'shots' : 'shots-' + ENGINE); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const issues = [], consoleErrors = [];
let n = 0;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  const shot = async (name, opts = {}) => { n++; const f = `${String(n).padStart(2, '0')}-${name}.png`; await page.waitForTimeout(opts.wait ?? 500); await page.screenshot({ path: path.join(OUT, f) }); console.log('shot', f); };
  const scrollBottom = async () => page.evaluate(() => { const s = document.querySelector('.screen.on'); s.scrollTop = s.scrollHeight; });
  const scrollTop = async () => page.evaluate(() => { document.querySelector('.screen.on').scrollTop = 0; });
  const scope = () => page.locator('.sheet.show, .screen.on, .top').filter({ visible: true });
  const tap = async (sel, nth = 0) => { const loc = sel.startsWith('text=') ? page.locator('.sheet.show, .screen.on, .top').getByText(sel.slice(5), { exact: false }).filter({ visible: true }) : page.locator(sel).filter({ visible: true }); await loc.nth(nth).click(); await page.waitForTimeout(350); };
  const byText = (txt) => `text=${txt}`;
  const waitDl = () => page.waitForEvent('download', { timeout: ENGINE === 'chromium' ? 30000 : 4000 }).catch(() => null);
  const setRange = async (idx, v) => page.evaluate(([i, v]) => { const r = document.querySelectorAll('.screen.on input[type=range]')[i]; r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }, [idx, v]);
  const jpeg = async (label, w = 1600, h = 1200) => Buffer.from((await page.evaluate(([label, w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fa7c9'); gr.addColorStop(1, '#d9cbb0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#8d6a40'; for (let i = 0; i < 10; i++) g.fillRect(100 + i * 150, h * 0.35, 30, h * 0.55); g.fillStyle = '#161617'; g.font = 'bold 72px sans-serif'; g.fillText(label, 120, 200); return c.toDataURL('image/jpeg', 0.9); }, [label, w, h])).split(',')[1], 'base64');

  // fresh start
  await page.goto(BASE + '/?for=Diane', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await DB.clearPhotos(); localStorage.clear(); });
  await page.goto(BASE + '/?for=Diane', { waitUntil: 'networkidle' });
  await shot('welcome', { wait: 900 });
  await tap(byText("Let's go")); await shot('projects');
  await tap('.card.tap'); await shot('home-top'); await scrollBottom(); await shot('home-bottom');
  await tap('.tabs button[data-t=log]'); await shot('log-top'); await scrollBottom(); await shot('log-bottom');
  // new entry with two photos
  await tap('#topAct'); await shot('entry-empty');
  await page.locator('#fileCam').setInputFiles({ name: 'cam.jpg', mimeType: 'image/jpeg', buffer: await jpeg('CAMERA SHOT') });
  await page.waitForTimeout(900);
  await page.locator('#fileGal').setInputFiles([{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: await jpeg('ROLL 1', 1200, 1600) }, { name: 'b.jpg', mimeType: 'image/jpeg', buffer: await jpeg('ROLL 2') }]);
  await page.waitForTimeout(1200); await shot('entry-3-photos');
  await page.fill('#efNote', 'Shingles started on the north slope; crew of three, done by Thursday if the rain holds off.');
  await page.selectOption('#efItem', { label: 'Roofing' });
  await tap('#efWx button', 2); await page.fill('#efTemp', '64'); await page.fill('#efCrew', '3');
  await scrollBottom(); await shot('entry-filled');
  await tap(byText('Save entry')); await shot('log-after-save');
  await tap('.entry'); await shot('photo-detail', { wait: 1200 }); await tap('.strip .ph', 1); await shot('photo-detail-2nd', { wait: 1000 });
  await tap(byText('Edit')); await shot('entry-edit-prefilled'); await tap(byText('Cancel'));
  await page.waitForTimeout(400); await tap(byText('Use on cover')); await shot('cover-after-use', { wait: 1500 });
  await scrollBottom(); await shot('cover-controls');
  await tap(byText('2 × 2')); await scrollTop(); await shot('cover-grid', { wait: 1500 });
  await tap(byText('Type my own')); await scrollBottom(); await shot('cover-manual-controls'); await scrollTop(); await shot('cover-manual', { wait: 1200 });
  await tap(byText('From progress')); await scrollTop();
  const dl = waitDl(); await tap(byText('Save to Photos')); const d = await dl; if (d) await d.saveAs(path.join(OUT, '_cover-download.jpg')); else if (ENGINE === 'chromium') issues.push('cover download did not happen'); await shot('cover-saved-toast');
  // progress
  await tap('.tabs button[data-t=sov]'); await shot('progress-top'); await setRange(3, 80); await page.waitForTimeout(400); await shot('progress-slider-80');
  await scrollBottom(); await shot('progress-bottom');
  await tap(byText('Schedule')); await shot('schedule'); await tap(byText('Line items'));
  await page.locator('.screen.on .row.tap').nth(2).click(); await page.waitForTimeout(400); await shot('item-top');
  await page.fill('#cfDesc', 'Nails & hangers'); await page.fill('#cfAmt', '245'); await tap(byText('Add cost')); await scrollBottom(); await shot('item-after-cost');
  await tap('#topAct'); await shot('item-edit-form'); await page.fill('#ifName', 'Framing (edited)'); await tap(byText('Save changes')); await shot('item-renamed');
  await page.locator('#back').click(); await page.waitForTimeout(400); await tap('#topAct'); await shot('item-new-form');
  await page.fill('#ifName', 'Landscaping'); await page.fill('#ifBudget', '4200'); await tap(byText('Add line item')); await scrollBottom(); await shot('progress-new-item');
  // report
  await tap('.tabs button[data-t=report]'); await shot('report-top', { wait: 900 }); await scrollBottom(); await shot('report-bottom');
  await tap(byText('Share')); await shot('share-sheet');
  const dl2 = waitDl(); await tap(byText('Save image')); const d2 = await dl2; if (d2) await d2.saveAs(path.join(OUT, '_report-download.jpg')); else if (ENGINE === 'chromium') issues.push('report download did not happen'); await shot('report-saved');
  // ideas
  await tap('#fab'); await page.fill('#ideaText', 'Let me text the cover page straight to the owner'); await tap(byText('Must have')); await tap(byText('Save idea')); await shot('ideas-saved');
  await page.locator('#sheetBg').click(); await page.waitForTimeout(400);
  // new project with blank template → empty states
  await page.locator('#back').click(); await page.waitForTimeout(300); await page.locator('#back').click(); await page.waitForTimeout(300);
  await tap(byText('New project')); await shot('project-form-empty');
  await page.fill('#pfName', 'Cedar Ridge garage'); await page.fill('#pfClient', 'Okafor'); await page.fill('#pfAddr', '77 Cedar Ridge Rd'); await page.fill('#pfContract', '48000'); await tap(byText('New garage / ADU'));
  await scrollBottom(); await shot('project-form-filled'); await tap(byText('Create project')); await shot('new-project-home');
  await tap('.tabs button[data-t=log]'); await shot('new-project-log-empty');
  await tap('.tabs button[data-t=cover]'); await shot('new-project-cover-empty', { wait: 1000 });
  await tap('.tabs button[data-t=sov]'); await shot('new-project-progress');
  await tap('.tabs button[data-t=home]'); await tap('#topAct'); await scrollBottom(); await shot('project-edit-form');
  await tap(byText('Delete this project')); await shot('delete-confirm'); await tap('#confirmBtn'); await shot('projects-after-delete');
  // long name + blank template edge case
  await tap(byText('New project')); await page.fill('#pfName', 'A very long project name that keeps going to test truncation in the header'); await tap(byText('Blank')); await tap(byText('Create project')); await shot('blank-project-home');
  await tap('.tabs button[data-t=sov]'); await shot('blank-project-progress'); await tap('.tabs button[data-t=report]'); await shot('blank-project-report');
  // ---- Wave 3 coverage ----
  await page.goto(BASE + '/?s=projects', { waitUntil: 'networkidle' }); await page.evaluate(() => { App.openProject('sample'); App.go('log'); }); await page.waitForTimeout(400);
  await tap('#logChips .chip', 1); await shot('log-filter-one'); const shown = await page.evaluate(() => [...document.querySelectorAll('#logBody .entry')].filter(e => e.style.display !== 'none').length); if (!shown) issues.push('log filter hid everything'); await tap('#logChips .chip', 0);
  // edit an entry and save
  await page.locator('#logBody .entry').filter({ visible: true }).first().click(); await page.waitForTimeout(400); await tap(byText('Edit')); await page.fill('#efNote', 'Edited note after save'); await tap(byText('Save entry')); await page.waitForTimeout(400);
  const edited = await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').entries.some(e => e.note === 'Edited note after save')); if (!edited) issues.push('edit entry did not save'); await shot('log-after-edit');
  // new entry: add two photos, remove one, cancel -> nothing saved, photo records cleaned
  const before = await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').entries.length);
  await tap('#topAct'); await page.locator('#fileGal').setInputFiles([{ name: 'x.jpg', mimeType: 'image/jpeg', buffer: await jpeg('X') }, { name: 'y.jpg', mimeType: 'image/jpeg', buffer: await jpeg('Y') }]); await page.waitForTimeout(1500);
  await page.locator('#pendGrid .x').first().click(); await page.waitForTimeout(300); await shot('entry-removed-one'); const left = await page.locator('#pendGrid .ph[data-ph]').count(); if (left !== 1) issues.push('remove photo left ' + left);
  await tap(byText('Cancel')); await page.waitForTimeout(500); const after = await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').entries.length); if (after !== before) issues.push('cancel saved an entry');
  // draft restore after a reload mid-entry (iOS reloads the tab after the camera)
  await page.evaluate(() => App.go('log')); await page.waitForTimeout(300); await tap('#topAct'); await page.fill('#efNote', 'Draft before reload'); await page.locator('#fileGal').setInputFiles({ name: 'd.jpg', mimeType: 'image/jpeg', buffer: await jpeg('DRAFT') }); await page.waitForTimeout(1500);
  console.log('pre-reload session:', JSON.stringify(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ct-session') || 'null'); return s && { cur: s.cur, note: s.form && s.form.note, photos: s.form && s.form.photos, grid: document.querySelectorAll('#pendGrid .ph[data-ph]').length, hint: document.getElementById('pendHint').textContent, importingBtnDisabled: document.querySelector('#entryBody .btn').disabled, log: JSON.parse(localStorage.getItem('ct-log') || '[]').slice(-3) }; })));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(800); await shot('draft-restored');
  const restored = await page.evaluate(() => (document.querySelector('[data-s=entryform]').classList.contains('on')) && document.getElementById('efNote').value === 'Draft before reload' && document.querySelectorAll('#pendGrid .ph[data-ph]').length === 1); if (!restored) issues.push('draft not restored after reload');
  await tap(byText('Cancel')); await page.waitForTimeout(400);
  // backup export
  await tap('#fab'); const dl3 = waitDl(); await tap(byText('Back up my data')); const d3 = await dl3; if (d3) { const bp = path.join(OUT, '_backup.json'); await d3.saveAs(bp); try { JSON.parse(fs.readFileSync(bp, 'utf8')); } catch (e) { issues.push('backup is not valid JSON'); } } else if (ENGINE === 'chromium') issues.push('backup download did not happen'); await page.evaluate(() => App.closeSheet());
  // 50 entries performance
  await page.evaluate(() => { const p = App.state().projects.find(x => x.id === 'sample'); for (let i = 0; i < 50; i++) p.entries.push({ id: 'perf' + i, d: Data.iso(Data.addDays(Data.today(), -i % 20)), time: '9:00 AM', ts: Date.now() - i, itemId: p.items[i % p.items.length].id, note: 'Performance entry ' + i, wx: 'sun', temp: 70, crew: 3, photos: [{ seed: i, kind: ['roof', 'walls', 'frame', 'slab'][i % 4], wx: 'sun' }] }); DB.save(App.state()); });
  const tLog = await page.evaluate(() => { const t0 = performance.now(); App.go('log'); return Math.round(performance.now() - t0); }); const tHome = await page.evaluate(() => { const t0 = performance.now(); App.go('home'); return Math.round(performance.now() - t0); }); const tCover = await page.evaluate(() => { const t0 = performance.now(); App.go('cover'); return Math.round(performance.now() - t0); });
  console.log(`perf with 58 entries: log ${tLog}ms home ${tHome}ms cover ${tCover}ms`); if (tLog > 300) issues.push('log render slow: ' + tLog + 'ms'); await page.goto(BASE + '/?s=log', { waitUntil: 'networkidle' }); await shot('log-58-entries');
  // start over
  await tap('#fab'); await tap(byText('Start over')); await shot('start-over-confirm'); await tap('#confirmBtn'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800); await shot('after-start-over');
  const fresh = await page.evaluate(() => App.state().projects.length === 1 && App.state().projects[0].id === 'sample' && App.state().projects[0].entries.length === 8); if (!fresh) issues.push('start over did not reset');
  // desktop + storyboard
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(BASE + '/?s=home', { waitUntil: 'networkidle' }); await shot('desktop-shell', { wait: 1200 });
  await page.goto(BASE + '/mockups/', { waitUntil: 'networkidle' }); await shot('storyboard', { wait: 800 });
  fs.writeFileSync(path.join(OUT, '_console.txt'), consoleErrors.join('\n') || '(no console errors)');
  console.log('engine:', ENGINE, 'console errors:', consoleErrors.length); consoleErrors.forEach(e => console.log('  -', e)); console.log('issues:', issues.length); issues.forEach(i => console.log('  !', i));
  await browser.close();
})().catch(e => { console.error('FAILED at step', n, e); process.exit(1); });
