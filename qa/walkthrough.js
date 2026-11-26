// Drives the live app (at /app/) as an iPhone and screenshots every step into qa/shots.
// Run: NODE_PATH=<path to node_modules with playwright> node qa/walkthrough.js [baseUrl]
// Written for version 19 (the plain-words pass): five tabs (Home, Photos, Parts, Bill, Send), Help on every screen,
// a job opens on four steps, parts are marked with words, the bill has its own tab, Send holds the owner update.
const pw = require('playwright'); const ENGINE = process.env.ENGINE || 'chromium'; const chromium = pw[ENGINE];
const fs = require('fs'), path = require('path');
const BASE = (process.argv[2] || 'https://costtooling.com').replace(/\/$/, ''), APP = BASE + '/app';
const OUT = path.join(__dirname, ENGINE === 'chromium' ? 'shots' : 'shots-' + ENGINE); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const issues = [], consoleErrors = [], notes = [];
// Words the plain-words pass took off every screen. Each screenshot's screen is read for them (text, labels and placeholders).
const OLD_WORDS = [/\bline items?\b/i, /\bentr(?:y|ies)\b/i, /\blogs?\b/i, /\bprogress\b/i, /\bcover pages?\b/i, /\breports?\b/i, /\bprojects?\b/i, /\bin place\b/i, /\bearned value\b/i];
let n = 0;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', acceptDownloads: true });
  // Is an element really on screen? WebKit still gives boxes to what sits inside a closed <details>, so a closed fold is checked by hand.
  await ctx.addInitScript(() => { window.__vis = e => { if (!e || !e.getClientRects().length || getComputedStyle(e).visibility !== 'visible') return false; for (let d = e.parentElement && e.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) { const sum = d.querySelector(':scope > summary'); if (!d.open && !(sum && sum.contains(e))) return false; } return true; }; });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  // ---------- helpers ----------
  const seenOld = new Set();
  /** Read everything drawn inside the app for a word the plain-words pass removed. Each line is reported once. */
  const scan = async (where, opts = {}) => {
    const lines = await page.evaluate(() => { const app = document.querySelector('.app'); if (!app) return []; const shown = e => e.getClientRects().length && getComputedStyle(e).visibility === 'visible'; return app.innerText.split('\n').concat([...app.querySelectorAll('[aria-label],[placeholder],[title]')].filter(shown).flatMap(e => ['aria-label', 'placeholder', 'title'].map(a => e.getAttribute(a)).filter(Boolean))); });
    let found = 0; for (const raw of lines) { const line = raw.trim(); for (const re of OLD_WORDS) { const m = line.match(re); if (!m) continue; found++; if (!seenOld.has(line) && !opts.dry) { seenOld.add(line); issues.push(`old word "${m[0]}" on ${where}: "${line.slice(0, 140)}"`); } } }
    return found;
  };
  const shot = async (name, opts = {}) => { n++; const f = `${String(n).padStart(2, '0')}-${name}.png`; await page.waitForTimeout(opts.wait ?? 500); await page.screenshot({ path: path.join(OUT, f) }); console.log('shot', f); if (!opts.noScan) await scan(f); };
  const scrollBottom = async () => page.evaluate(() => { const s = document.querySelector('.screen.on'); s.scrollTop = s.scrollHeight; });
  const scrollTop = async () => page.evaluate(() => { document.querySelector('.screen.on').scrollTop = 0; });
  const tap = async (sel, nth = 0) => { const loc = sel.startsWith('text=') ? page.locator('.sheet.show, .screen.on, .top').getByText(sel.slice(5), { exact: false }).filter({ visible: true }) : page.locator(sel).filter({ visible: true }); await loc.nth(nth).click(); await page.waitForTimeout(350); };
  const byText = (txt) => `text=${txt}`;
  /** Tap the button on the open screen whose whole name is these words (so "Save" is not "Save it to my photos"). */
  const press = async name => { await page.locator('.screen.on').getByRole('button', { name, exact: true }).filter({ visible: true }).first().click(); await page.waitForTimeout(350); };
  const waitDl = () => page.waitForEvent('download', { timeout: ENGINE === 'chromium' ? 30000 : 4000 }).catch(() => null);
  const jpeg = async (label, w = 1600, h = 1200) => Buffer.from((await page.evaluate(([label, w, h]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fa7c9'); gr.addColorStop(1, '#d9cbb0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#8d6a40'; for (let i = 0; i < 10; i++) g.fillRect(100 + i * 150, h * 0.35, 30, h * 0.55); g.fillStyle = '#161617'; g.font = 'bold 72px sans-serif'; g.fillText(label, 120, 200); return c.toDataURL('image/jpeg', 0.9); }, [label, w, h])).split(',')[1], 'base64');
  const need = (where, txt, list) => { for (const t of list) if (!txt.includes(t)) issues.push(`${where} is missing "${t}"`); };
  const not = (where, txt, list) => { for (const t of list) if (txt.includes(t)) issues.push(`${where} should not say "${t}"`); };
  const same = (where, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) issues.push(`${where}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); };
  const text = sel => page.locator(sel).innerText();
  const shown = sel => page.evaluate(s => __vis(document.querySelector(s)), sel);
  /** Which screen is open, and which tab is lit ('' when none is). */
  const at = async (where, screen, tab) => { const got = await page.evaluate(() => ({ s: (document.querySelector('.screen.on') || { dataset: {} }).dataset.s, t: [...document.querySelectorAll('.tabs button.on')].map(b => b.dataset.t).join() })); if (got.s !== screen || got.t !== tab) issues.push(`${where}: opened screen "${got.s}" with tab "${got.t}" lit, expected screen "${screen}" with tab "${tab}"`); };
  const top = () => page.evaluate(() => ({ ttl: document.getElementById('ttl').textContent, back: document.getElementById('backLbl').textContent }));
  const toast = () => page.evaluate(() => { const t = document.getElementById('toast'); return t.classList.contains('show') ? t.textContent : ''; });
  /** Help is on every screen: it opens its sheet, and Close puts it away. */
  const helped = [];
  const help = async where => { await page.locator('#helpBtn').click(); await page.waitForTimeout(350); if (await page.locator('#helpSheet.show').count()) helped.push(where); else issues.push('Help did not open on ' + where); await page.locator('#helpSheet > .btn').click(); await page.waitForTimeout(350); if (await page.locator('.sheet.show').count()) issues.push('Close did not put the Help sheet away on ' + where); };
  const openHelpMore = async () => { await page.locator('#helpBtn').click(); await page.waitForTimeout(350); await page.locator('#helpSheet details.more summary').click(); await page.waitForTimeout(300); };
  const sampleItem = name => page.evaluate(name => { const i = App.state().projects.find(x => x.id === 'sample').items.find(i => i.n === name); return i && { id: i.id, pct: i.pct, billed: i.billed, has: 'billed' in i }; }, name);
  const diskPct = name => page.evaluate(name => JSON.parse(localStorage.getItem('ct-data-v2')).projects.find(x => x.id === 'sample').items.find(i => i.n === name).pct, name);
  /** What a part's screen shows: the five words, the one that is lit (with its exact percent), and the sentence about the bill. */
  const partScreen = () => page.evaluate(() => { const name = b => b.childNodes[0].textContent + (b.querySelector('small') ? ' ' + b.querySelector('small').textContent : ''); return { words: [...document.querySelectorAll('#words button.w')].map(b => b.childNodes[0].textContent).join(), on: [...document.querySelectorAll('#words button.w.on')].map(name).join(), pressed: [...document.querySelectorAll('#words button.w[aria-pressed=true]')].length, exactHidden: document.getElementById('exactRow').hidden, exact: document.getElementById('exactIn').value, note: document.getElementById('partNote').innerText.trim(), fold: !!document.getElementById('costFold'), foldOpen: !!(document.getElementById('costFold') || {}).open }; });
  const word = async idx => { await page.locator('#words button.w').nth(idx).click(); await page.waitForTimeout(250); };
  const WORDS = 'Not started,Just started,About half,Nearly done,Done';

  // ---------- fresh start: the welcome card, the job list ----------
  await page.goto(APP + '/?for=Diane', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await DB.clearPhotos(); localStorage.clear(); });
  await page.goto(APP + '/?for=Diane', { waitUntil: 'networkidle' });
  await shot('welcome', { wait: 900 });
  need('welcome card', await text('#welcomeSheet'), ['Hi Diane, welcome to CostTooling', 'Walk the job and take photos.', 'Mark what you saw, part by part.', 'Send the owner one page.', 'Show me around', "Let's go"]);
  same('welcome card numbered lines', await page.locator('#welcomeSheet ol li').count(), 3);
  await tap(byText("Let's go")); await shot('jobs'); await at('job list', 'projects', '');
  const jobs = await page.evaluate(() => { const body = document.getElementById('projectsBody'), promo = document.getElementById('cloudPromo'), add = [...body.querySelectorAll('.btn')].find(b => b.textContent.includes('Start a new job')); return { cards: body.querySelectorAll('button.card.tap.job').length, tiles: body.querySelectorAll('.kpi, .kpis, .stat, .stats').length, add: !!add, promoWanted: !!(window.Cloud && Cloud.enabled()), promo: !!promo, promoBelow: !!(promo && add && (add.compareDocumentPosition(promo) & Node.DOCUMENT_POSITION_FOLLOWING)), topAct: !!document.getElementById('topAct'), tabs: [...document.querySelectorAll('.tabs button')].map(b => b.dataset.t + ':' + b.textContent.trim()).join(), ranges: document.querySelectorAll('input[type=range]').length }; });
  same('job list', { cards: jobs.cards, tiles: jobs.tiles, add: jobs.add, topAct: jobs.topAct, ranges: jobs.ranges }, { cards: 1, tiles: 0, add: true, topAct: false, ranges: 0 });
  same('tabs', jobs.tabs, 'home:Home,log:Photos,sov:Parts,bill:Bill,send:Send');
  if (jobs.promoWanted && !(jobs.promo && jobs.promoBelow)) issues.push('the cloud card is not below the job list: ' + JSON.stringify(jobs));
  need('job list', await text('#projectsBody'), ['Tap a job to open it.', 'A sample job to practise on', 'About a third of the work is done.', 'The bill says more than you saw.', 'Start a new job']);
  // the reader of old words is itself checked once: an old button name and an old label, put on the screen and taken off again
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'qaOld'; d.innerHTML = '<button>Save entry</button><input placeholder="Add a line item">'; document.getElementById('projectsBody').appendChild(d); });
  same('the reader of old words finds planted ones', await scan('self-check', { dry: true }), 2); await page.evaluate(() => document.getElementById('qaOld').remove()); same('the reader of old words on a clean job list', await scan('self-check', { dry: true }), 0);
  await help('job list');

  // ---------- the sample job's home: one sentence, the bill warning, four steps ----------
  await tap('#projectsBody button.card.tap.job'); await shot('home-top'); await at('sample job home', 'home', 'home');
  // the sample job has a bill that runs ahead of the work: the numbers the landing page shows
  const homeTxt = await text('#homeBody');
  need('sample home', homeTxt, ['About a third of the work is done.', 'The contractor has billed $3,420 more than you saw.', 'See which part', 'Take photos', '8 so far. The last one was today.', 'Mark what you saw', '7 of 10 parts started.', 'Type in the bill', 'Last typed', 'Send the owner one page', 'Photos and numbers, ready to text.', 'Latest photos', 'The numbers', 'Change this job’s name or dates']);
  not('sample home', homeTxt, ['cost so far', 'to finish', 'Check before you pay', '36%']); // the numbers are folded away, and the cost numbers moved to Parts
  same('sample home layout', await page.evaluate(() => ({ check: (c => c && c.tagName + '.' + c.className)(document.getElementById('checkCard')), say: document.querySelectorAll('#homeBody .say').length, steps: document.querySelectorAll('#homeBody .steps button.step').length, numbersOpen: document.getElementById('numbers').open, strip: document.querySelectorAll('#homeBody .strip .ph').length })), { check: 'BUTTON.notice', say: 1, steps: 4, numbersOpen: false, strip: 8 });
  await help('job home');
  // the warning opens the part billed ahead: Framing, marked nearly done (85%) with the bill at 100%
  await tap('#checkCard'); await shot('part-billed-ahead'); await at('the bill warning', 'item', 'sov');
  same('billed part top bar', await top(), { ttl: 'Framing', back: 'Home' });
  same('billed part', await partScreen(), { words: WORDS, on: 'Nearly done 85%', pressed: 1, exactHidden: true, exact: '85', note: 'The bill says this part is finished. You marked it nearly done (85%). That is $3,420 more than you saw.', fold: true, foldOpen: false });
  need('billed part', await text('#itemBody'), ['How far along is it?', 'Type an exact percent', 'The bill says', 'Photos and notes', 'Add a photo of Framing', 'Costs', 'Change the name, budget or dates', 'Delete this part']);
  same('billed part bill boxes', await page.evaluate(() => [document.querySelector('[data-billrow] [data-k=pct]').value, document.querySelector('[data-billrow] [data-k=amt]').value]), ['100%', '$22,800']);
  await page.locator('.screen.on [data-billrow]').scrollIntoViewIfNeeded(); await shot('part-billed-ahead-bill');
  await help('a part');
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from the billed part', 'home', 'home');
  // The numbers: folded on home, one tap away
  await tap('#numbers summary'); await page.locator('#numbers').scrollIntoViewIfNeeded(); await shot('home-numbers');
  need('The numbers on sample home', await text('#numbers'), ['36%', 'of the work is done', '38%', 'is what the bill says', '$3,420', 'billed more than you saw', '1 part to check', 'days left', 'See the schedule']);
  same('The numbers tiles', await page.locator('#numbers .kpis .kpi').count(), 4);
  await scrollBottom(); await shot('home-bottom');
  // the four steps go where they say
  await scrollTop();
  await tap('#homeBody .steps button.step', 0); await at('step 1, Take photos', 'entryform', 'log'); same('step 1 title', (await top()).ttl, 'Add a photo');
  await press('Cancel'); await page.waitForTimeout(300); await at('Cancel from step 1', 'home', 'home');
  await tap('#homeBody .steps button.step', 1); await at('step 2, Mark what you saw', 'sov', 'sov'); if (!(await shown('#modeItems button.card.part'))) issues.push('step 2 did not show the list of parts');
  await tap('.tabs button[data-t=home]');
  await tap('#homeBody .steps button.step', 2); await at('step 3, Type in the bill', 'bill', 'bill'); await shot('bill-sample');
  need('sample bill total', await text('#billTotal'), ['The whole bill', 'You saw 36% done', '$3,420 billed more than you saw', '38%']);
  need('sample bill, Framing', await page.locator('#billCard .billline').nth(2).innerText(), ['Framing', 'You saw: nearly done · 85%', 'The bill says more than you saw, by $3,420.']);
  same('sample bill, Framing box', await page.locator('#billCard .billline input').nth(2).inputValue(), '100%');
  await tap('.tabs button[data-t=home]');
  await tap('#homeBody .steps button.step', 3); await at('step 4, Send the owner one page', 'report', 'send');
  same('Send top bar', await top(), { ttl: 'Send', back: 'Home' });
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from Send', 'home', 'home');
  // See the schedule, under The numbers
  await tap('#numbers summary'); await press('See the schedule'); await at('See the schedule', 'sov', 'sov'); await shot('schedule-from-home');
  same('See the schedule', await page.evaluate(() => ({ gantt: __vis(document.getElementById('modeGantt')), on: document.querySelector('#modeSeg button.on').dataset.m })), { gantt: true, on: 'gantt' });
  // Not a check, a note for the report: after the schedule was looked at, does step 2 still open on the list of parts?
  await tap('.tabs button[data-t=home]'); await tap('#homeBody .steps button.step', 1);
  if (!(await shown('#modeItems button.card.part'))) issues.push('after "See the schedule", home step 2 "Mark what you saw" opened on the Schedule, not the list of parts');
  await tap('#modeSeg button[data-m=items]'); if (!(await shown('#modeItems button.card.part'))) issues.push('Parts in the switch did not bring the list of parts back');

  // ---------- Photos ----------
  await tap('.tabs button[data-t=log]'); await shot('photos-top'); await at('Photos tab', 'log', 'log');
  const pick = () => page.evaluate(() => { const s = document.getElementById('logPick'); return { value: s.value, values: [...s.options].map(o => o.value), labels: [...s.options].map(o => o.text) }; });
  const photosShown = () => page.evaluate(() => { const vis = e => e.style.display !== 'none'; return { photos: [...document.querySelectorAll('#logBody .entry')].filter(vis).length, parts: [...new Set([...document.querySelectorAll('#logBody .entry')].filter(vis).map(e => e.dataset.item))].join(), days: [...document.querySelectorAll('#logBody .day')].filter(vis).map(d => d.querySelector('.dayN').textContent), empty: document.getElementById('logEmpty').style.display !== 'none' ? document.getElementById('logEmpty').innerText.replace(/\s+/g, ' ').trim() : '' }; });
  const p0 = await pick(); same('Photos part list starts on', p0.value, 'all'); same('Photos part list length', p0.values.length, 11); // every part, and no "No part picked" while every photo has a part
  need('Photos part list', p0.labels.join(' | '), ['Every part (8)', 'Demolition (0)', 'Foundation repair (2)', 'Framing (4)', 'Roofing (2)', 'Exterior & site (0)']); not('Photos part list', p0.labels.join(' | '), ['No part picked']);
  same('Photos by day', await photosShown(), { photos: 8, parts: (await Promise.all(['Roofing', 'Framing', 'Foundation repair'].map(sampleItem))).map(i => i.id).join(), days: ['2 photos', '1 photo', '1 photo', '1 photo', '1 photo', '1 photo', '1 photo'], empty: '' });
  same('Add a photo button', (await text('#logAdd')).trim(), 'Add a photo');
  not('Photos tab', await text('#logBody'), ['No line item']);
  await help('Photos');
  await scrollBottom(); await shot('photos-bottom'); await scrollTop();

  // ---------- a new photo: three things asked, the rest under More details ----------
  await tap('#logAdd'); await shot('photo-form-empty'); await at('Add a photo', 'entryform', 'log');
  same('new photo form', await page.evaluate(() => ({ ttl: document.getElementById('ttl').textContent, head: document.querySelector('#entryBody h3').childNodes[0].textContent.trim(), moreOpen: document.getElementById('efMore').open, more: document.querySelector('#efMore summary').textContent.trim(), tempShown: __vis(document.getElementById('efTemp')), part: document.getElementById('efItem').value, first: document.getElementById('efItem').options[0].text, weather: document.querySelectorAll('#efWx button.on').length, save: document.querySelector('#entryBody .btn').textContent.trim(), bulb: __vis(document.getElementById('fab')) })), { ttl: 'Add a photo', head: 'Add a photo', moreOpen: false, more: 'More details', tempShown: false, part: '', first: 'Pick a part…', weather: 0, save: 'Save', bulb: false });
  await help('the photo form');
  await page.locator('#fileCam').setInputFiles({ name: 'cam.jpg', mimeType: 'image/jpeg', buffer: await jpeg('CAMERA SHOT') });
  await page.waitForTimeout(900);
  await page.locator('#fileGal').setInputFiles([{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: await jpeg('ROLL 1', 1200, 1600) }, { name: 'b.jpg', mimeType: 'image/jpeg', buffer: await jpeg('ROLL 2') }]);
  await page.waitForTimeout(1200); await shot('photo-form-3-photos');
  await page.fill('#efNote', 'Shingles started on the north slope; crew of three, done by Thursday if the rain holds off.');
  await page.selectOption('#efItem', { label: 'Roofing' });
  // More details: weather, temperature, people and the date. A new photo has no weather picked.
  await tap('#efMore summary'); await shot('photo-form-more-details');
  same('More details opened', await page.evaluate(() => ({ open: document.getElementById('efMore').open, shown: ['efWx', 'efTemp', 'efCrew', 'efDate'].filter(id => __vis(document.getElementById(id))).join(), weather: document.querySelectorAll('#efWx button.on').length, date: document.getElementById('efDate').value === Data.iso(Data.today()) })), { open: true, shown: 'efWx,efTemp,efCrew,efDate', weather: 0, date: true });
  await tap('#efWx button', 2); await page.fill('#efTemp', '64'); await page.fill('#efCrew', '3');
  same('weather picked', await page.evaluate(() => [...document.querySelectorAll('#efWx button.on')].map(b => b.textContent).join()), 'Rain');
  await scrollBottom(); await shot('photo-form-filled');
  await press('Save'); await shot('part-after-save'); await at('Save a photo of Roofing', 'item', 'sov');
  if (!/^Saved under Roofing · Day \d+$/.test(await toast())) issues.push('saving a photo said: "' + await toast() + '"');
  same('saved photo', await page.evaluate(() => { const p = App.state().projects.find(x => x.id === 'sample'), e = p.entries[p.entries.length - 1]; return { part: (p.items.find(i => i.id === e.itemId) || {}).n, wx: e.wx, temp: String(e.temp), crew: String(e.crew), photos: e.photos.length, outlined: document.querySelectorAll('#itemBody .entry.new').length }; }), { part: 'Roofing', wx: 'rain', temp: '64', crew: '3', photos: 3, outlined: 1 });
  await tap('.screen.on .entry'); await shot('photo-detail', { wait: 1200 }); await at('open a photo', 'photo', 'log'); await tap('.strip .ph', 1); await shot('photo-detail-2nd', { wait: 1000 });
  need('photo screen', await text('#photoBody'), ['Move it to another part', 'Change this photo', 'Use it in the picture to text', 'Delete these 3 photos', 'Roofing', 'part of the job · about half · 60%', 'Weather and people', 'Place']);
  await help('a photo');
  await press('Change this photo'); await shot('photo-form-edit-prefilled'); await at('Change this photo', 'entryform', 'log');
  same('photo form, changing', await page.evaluate(() => ({ ttl: document.getElementById('ttl').textContent, head: document.querySelector('#entryBody h3').childNodes[0].textContent.trim(), moreOpen: document.getElementById('efMore').open, temp: document.getElementById('efTemp').value, part: document.getElementById('efItem').selectedOptions[0].text, weather: [...document.querySelectorAll('#efWx button.on')].map(b => b.textContent).join() })), { ttl: 'Change this photo', head: 'Change this photo', moreOpen: true, temp: '64', part: 'Roofing', weather: 'Rain' });
  await press('Cancel'); await page.waitForTimeout(400); await at('Cancel a change', 'photo', 'log');
  // move the photos to another part from the photo screen: the first tappable row is Demolition
  await press('Move it to another part'); await shot('move-sheet');
  need('move sheet', await text('#moveSheet'), ['Move it to another part', 'Everything here', 'Just this photo', 'All 3 photos and the note from', 'here now', 'No part', 'kept under Photos only']);
  await tap('#moveList .row.tap', 0); await page.waitForTimeout(400);
  const movedTo = await page.evaluate(() => { const p = App.state().projects.find(x => x.id === 'sample'); const e = p.entries[p.entries.length - 1]; return (p.items.find(i => i.id === e.itemId) || {}).n; }); if (movedTo !== 'Demolition') issues.push('move went to ' + movedTo); same('move toast', await toast(), 'Moved to Demolition'); await shot('photo-after-move');
  // Just this photo: one photo leaves on its own, to No part; the note and the other two stay
  await press('Move it to another part'); await tap('#moveMode button[data-m=photo]'); await shot('move-sheet-one-photo');
  need('move sheet, one photo', await text('#moveHint'), ['Just this photo moves. The note and the other photos stay here.']);
  await page.locator('#moveList .row.tap').last().click(); await page.waitForTimeout(500); await shot('photo-moved-alone');
  same('one photo moved to No part', await page.evaluate(() => { const es = App.state().projects.find(x => x.id === 'sample').entries, a = es[es.length - 2], b = es[es.length - 1]; return { total: es.length, stayed: a.photos.length, note: !!a.note, moved: b.photos.length, part: b.itemId, movedNote: b.note }; }), { total: 10, stayed: 2, note: true, moved: 1, part: '', movedNote: '' });
  same('one photo toast', await toast(), 'Photo moved to No part'); need('photo with no part', await text('#photoBody'), ['Delete this photo', 'No note']);
  // the picture to text (the old Cover page): reached from a photo here, and from Send further down
  await press('Use it in the picture to text'); await shot('picture-after-use', { wait: 1500 }); await at('Use it in the picture to text', 'cover', 'send');
  same('picture top bar', await top(), { ttl: 'A picture to text', back: 'Send' });
  need('picture to text', await text('#coverBody'), ['Send this picture', 'Save it to my photos', 'One picture you can text to the owner.', 'tap to pick up to 4', 'How many photos', 'Words at the top', 'Numbers', 'From this job', 'Type my own', 'A note at the bottom']);
  same('picture: how many photos', await page.evaluate(() => [...document.querySelectorAll('#coverLayoutSeg button')].map(b => b.dataset.l + ':' + b.textContent).join()), 'hero:One,split:Three,grid:Four');
  same('picture: the photo is picked', await page.evaluate(() => { const p = App.state().projects.find(x => x.id === 'sample'); return [p.cover.picked.length, document.querySelectorAll('#coverGrid .ph.sel').length]; }), [1, 1]);
  await help('the picture to text');
  await scrollBottom(); await shot('picture-controls');
  await tap('#coverLayoutSeg button[data-l=split]'); await scrollTop(); await shot('picture-three', { wait: 1500 });
  await tap('#coverLayoutSeg button[data-l=grid]'); await scrollTop(); await shot('picture-four', { wait: 1500 });
  same('picture: Four is stored', await page.evaluate(() => App.state().projects.find(x => x.id === 'sample').cover.layout), 'grid');
  await tap(byText('Type my own')); await scrollBottom(); await shot('picture-own-numbers-controls'); if (!(await shown('#cvPct'))) issues.push('Type my own did not show the number boxes'); await scrollTop(); await shot('picture-own-numbers', { wait: 1200 });
  await tap(byText('From this job')); if (await shown('#cvPct')) issues.push('From this job left the number boxes up'); await scrollTop();
  const dl = waitDl(); await tap(byText('Save it to my photos')); const d = await dl; if (d) await d.saveAs(path.join(OUT, '_cover-download.jpg')); else if (ENGINE === 'chromium') issues.push('cover download did not happen'); await shot('picture-saved-toast');
  await page.evaluate(() => App.closeSheet()); await press('Send this picture'); await shot('picture-share-sheet'); same('picture share title', await text('#shareTitle'), 'Send this picture'); await page.locator('#shareSheet > .btn').click(); await page.waitForTimeout(350);
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from the picture', 'report', 'send');

  // ---------- Parts: a list of doors, no sliders; words on each part ----------
  await tap('.tabs button[data-t=sov]'); await shot('parts-top'); await at('Parts tab', 'sov', 'sov');
  same('Parts list', await page.evaluate(() => ({ seg: [...document.querySelectorAll('#modeSeg button')].map(b => b.dataset.m + ':' + b.textContent).join(), parts: document.querySelectorAll('#modeItems button.card.part[data-item]').length, ranges: document.querySelectorAll('input[type=range]').length, quick: document.querySelectorAll('#sovBody .quick, #sovBody .pcts, #sovBody [data-pct]').length, ttl: document.getElementById('ttl').textContent })), { seg: 'items:Parts,gantt:Schedule', parts: 10, ranges: 0, quick: 0, ttl: 'Parts of the job' });
  need('Parts list', await text('#modeItems'), ['Tap a part. Then tap the words that fit what you saw.', 'Add a part']);
  need('Parts list, Framing', await page.locator('#modeItems button.card.part').nth(2).innerText(), ['Framing', 'Nearly done · 85%', '4 photos', 'The bill says 100%']);
  need('Parts numbers, job with a bill', await text('#sovSummary'), ['The numbers', 'The whole job', '10 parts', '$170,400', 'What you saw done', '(36%)', 'What the bill says', '(38%)', 'Billed more than you saw', '$3,420']);
  await help('Parts');
  // Roofing is at 60%, which reads as About half. Tapping the word it already reads as changes nothing.
  await tap('#modeItems button.card.part', 3); await at('open Roofing', 'item', 'sov'); same('Roofing top bar', await top(), { ttl: 'Roofing', back: 'Parts' });
  same('Roofing words', (({ words, on, exactHidden }) => ({ words, on, exactHidden }))(await partScreen()), { words: WORDS, on: 'About half 60%', exactHidden: true });
  await word(2); same('tapping the word it already reads as', (await sampleItem('Roofing')).pct, 60);
  // each word stores its percent: 0, 10, 50, 90, 100
  for (const [idx, w, pct] of [[0, 'Not started', 0], [1, 'Just started', 10], [2, 'About half', 50], [4, 'Done', 100], [3, 'Nearly done', 90]]) {
    await word(idx); const got = { pct: (await sampleItem('Roofing')).pct, disk: await diskPct('Roofing'), on: (await partScreen()).on, toast: await toast() };
    same('word "' + w + '"', got, { pct, disk: pct, on: w + (pct > 0 && pct < 100 ? ' ' + pct + '%' : ''), toast: 'Saved: ' + w.toLowerCase() });
  }
  await shot('part-words');
  // an exact percent, for anyone who wants it; then the word it reads as leaves it alone
  await tap('#exactBtn'); if (!(await shown('#exactIn'))) issues.push('Type an exact percent did not show its box');
  const exact = async v => { await page.fill('#exactIn', v); await page.locator('#exactIn').blur(); await page.waitForTimeout(300); return { pct: (await sampleItem('Roofing')).pct, disk: await diskPct('Roofing'), box: await page.inputValue('#exactIn'), on: (await partScreen()).on }; };
  same('exact percent 80', await exact('80'), { pct: 80, disk: 80, box: '80', on: 'Nearly done 80%' }); same('exact percent toast', await toast(), 'Saved: 80% done'); await shot('part-exact-80');
  await word(3); same('the word after an exact percent', (await sampleItem('Roofing')).pct, 80);
  same('exact percent, not a number', await exact('junk'), { pct: 80, disk: 80, box: '80', on: 'Nearly done 80%' }); same('exact percent, not a number, toast', await toast(), 'Type a number from 0 to 100');
  same('exact percent, over 100', await exact('150'), { pct: 80, disk: 80, box: '80', on: 'Nearly done 80%' });
  same('exact percent with a percent sign', await exact('80%'), { pct: 80, disk: 80, box: '80', on: 'Nearly done 80%' });
  // the bill has Roofing at 60%, so at 80% seen the bill is under the work
  same('Roofing bill sentence', (await partScreen()).note, 'The bill says less than you saw. Nothing to check.');
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from Roofing', 'sov', 'sov'); await shot('parts-after-words');
  need('Parts list, Roofing', await page.locator('#modeItems button.card.part').nth(3).innerText(), ['Roofing', 'Nearly done · 80%']);
  await scrollBottom(); await shot('parts-bottom'); await scrollTop();
  await tap(byText('Schedule')); await shot('schedule'); need('schedule', await text('#modeGantt'), ['Schedule', 'When it will finish', 'The plan says', 'At this pace', 'Days used']);

  // ---------- Bill: its own tab. One percent per part. Roofing is at 80% seen; billing it at 85% puts it $825 ahead, beside Framing's $3,420 ----------
  await tap('.tabs button[data-t=bill]'); await shot('bill-top'); await at('Bill tab', 'bill', 'bill'); same('Bill top bar', await top(), { ttl: 'The bill', back: 'Home' });
  same('Bill tab layout', await page.evaluate(() => ({ how: __vis(document.getElementById('billHow')), pic: document.querySelectorAll('#billHow .billpic .ring').length, lines: document.querySelectorAll('#billCard .billline[data-bill] input').length, total: !!document.getElementById('billTotal') })), { how: true, pic: 1, lines: 10, total: true });
  need('Bill tab', await text('#billBody'), ['Find this on the contractor’s bill', 'Look for the column marked %', 'What the bill says', 'Leave a part empty until the contractor bills for it.', 'The whole bill', 'When a new bill comes, type over the old numbers.']);
  await help('Bill');
  await scrollBottom(); await shot('bill-bottom'); await page.locator('#billCard').scrollIntoViewIfNeeded();
  const billIn = n => page.locator('#billCard .billline input').nth(n);
  await billIn(3).fill('85'); await billIn(3).blur(); await page.waitForTimeout(300); await shot('bill-roofing-ahead');
  const k1 = await page.evaluate(() => { const k = Data.calc(App.state().projects.find(x => x.id === 'sample')); return { ahead: Math.round(k.billedAhead), names: k.aheadItems.map(i => i.n).join(), shown: document.querySelectorAll('#billCard .billline')[3].innerText, total: document.getElementById('billTotal').innerText }; });
  if (k1.ahead !== 4245 || k1.names !== 'Framing,Roofing' || !k1.shown.includes('The bill says more than you saw, by $825.') || !k1.total.includes('$4,245 billed more than you saw')) issues.push('bill list: ' + JSON.stringify(k1));
  await billIn(3).fill('junk'); await billIn(3).blur(); await page.waitForTimeout(300); if (await billIn(3).inputValue() !== '85%') issues.push('a bad billed figure was kept: ' + await billIn(3).inputValue()); same('bad billed figure toast', await toast(), 'Type a number, like 50 or 11,400');
  await billIn(3).fill('120'); await billIn(3).blur(); await page.waitForTimeout(300); same('a bill over 100%', [await billIn(3).inputValue(), (await sampleItem('Roofing')).billed, await toast()], ['100%', 100, 'The bill cannot be more than 100%']);
  await billIn(3).fill('80%'); await billIn(3).blur(); await page.waitForTimeout(300);
  need('Roofing billed at what was seen', await page.locator('#billCard .billline').nth(3).innerText(), ['You saw: nearly done · 80%']); not('Roofing billed at what was seen', await page.locator('#billCard .billline').nth(3).innerText(), ['more than you saw']);
  // the Parts tab remembers Schedule from before; Parts in the switch brings the list back
  await tap('.tabs button[data-t=sov]'); await tap('#modeSeg button[data-m=items]'); await shot('parts-after-bill');
  await tap('#modeItems button.card.part', 2); await shot('part-top'); await at('open Framing', 'item', 'sov');
  // on the part: an amount fills in the percent, an empty box means not billed yet
  await page.locator('.screen.on [data-billrow]').scrollIntoViewIfNeeded();
  await page.fill('[data-billrow] [data-k=amt]', '11,400'); await page.locator('[data-billrow] [data-k=amt]').blur(); await page.waitForTimeout(300); await shot('part-bill-by-amount');
  if ((await sampleItem('Framing')).billed !== 50 || await page.inputValue('[data-billrow] [data-k=pct]') !== '50%') issues.push('amount did not fill in the percent: ' + JSON.stringify(await sampleItem('Framing')));
  same('bill under the work', (await partScreen()).note, 'The bill says less than you saw. Nothing to check.');
  await page.fill('[data-billrow] [data-k=pct]', ''); await page.locator('[data-billrow] [data-k=pct]').blur(); await page.waitForTimeout(300); await shot('part-bill-cleared');
  if ((await sampleItem('Framing')).has) issues.push('clearing the billed figure left it on the part'); same('no bill, no sentence', (await partScreen()).note, '');
  await page.fill('[data-billrow] [data-k=pct]', '100'); await page.locator('[data-billrow] [data-k=pct]').blur(); await page.waitForTimeout(300);
  same('bill back at 100%', (await partScreen()).note, 'The bill says this part is finished. You marked it nearly done (85%). That is $3,420 more than you saw.');
  // in a job with a bill the costs are folded at the bottom
  if (await page.locator('#cfDesc').isVisible()) issues.push('costs are not folded in a job with a bill');
  await tap('#costFold summary'); await scrollBottom(); await shot('part-costs-open');
  await page.fill('#cfDesc', 'Nails & hangers'); await page.fill('#cfAmt', '245'); await tap(byText('Add cost')); await scrollBottom(); await shot('part-after-cost');
  need('costs after adding one', await text('#itemCosts'), ['Nails & hangers', '$245', '$19,145']); need('costs total', await text('#costTotal'), ['$19,145 total']);
  await press('Change the name, budget or dates'); await shot('part-edit-form'); await at('change a part', 'itemform', 'sov'); same('part form title', (await top()).ttl, 'Change this part'); await help('the part form');
  await page.fill('#ifName', 'Framing (edited)'); await press('Save'); await shot('part-renamed'); await at('save a part', 'item', 'sov'); same('renamed part', (await top()).ttl, 'Framing (edited)');
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from Framing', 'sov', 'sov');
  await press('Add a part'); await shot('part-new-form'); await at('Add a part', 'itemform', 'sov'); same('new part form', [(await top()).ttl, (await text('#itemformBody .btn')).trim()], ['New part', 'Add this part']);
  await page.fill('#ifName', 'Landscaping'); await page.fill('#ifBudget', '4200'); await press('Add this part'); await at('Add this part', 'sov', 'sov'); await scrollBottom(); await shot('parts-new-part');
  need('the new part on the list', await page.locator('#modeItems button.card.part').last().innerText(), ['Landscaping', 'Not started · no photos yet']); need('Parts numbers with the new part', await text('#sovSummary'), ['11 parts', '$174,600']);

  // ---------- Send: the owner update ----------
  await tap('.tabs button[data-t=send]'); await shot('send-top', { wait: 900 }); await at('Send tab', 'report', 'send');
  const repTxt = await text('#reportPreview'); need('owner update', repTxt, ['Owner update · ', ' · for Hernandez', 'done', 'billed', 'billed ahead', 'days left', '$3,420', 'Framing (edited) is billed at 100%. On site it is 85%.', 'Summary.', 'Part of the job', 'Budget', 'Done', 'Billed', 'Latest photos']);
  same('owner update table head', await page.evaluate(() => [...document.querySelectorAll('#reportPreview table.sov tr')[0].cells].map(c => c.textContent).join(' | ')), 'Part of the job | Budget | Done | Billed');
  same('owner update numbers', await page.evaluate(() => [...document.querySelectorAll('#reportPreview .num4 span')].map(s => s.textContent).join(' | ')), 'done | billed | billed ahead | days left');
  need('Send screen', await text('#reportBody'), ['This is the page the owner gets. Look it over, then send it.', 'Send it to the owner', 'Print it', 'Make a picture to text instead']); same('Send button', (await text('#sendBtn')).trim(), 'Send it to the owner');
  await scrollBottom(); await shot('send-bottom'); await scrollTop();
  await tap('#sendBtn'); await shot('share-sheet');
  same('share sheet', await page.evaluate(() => [document.getElementById('shareTitle').textContent, ...[...document.querySelectorAll('#shareSheet .hrow b')].map(b => b.textContent)]), ['Send the owner update', 'Text it or send it', 'Save it as a picture', 'Print it', 'Email the numbers']);
  const dl2 = waitDl(); await tap(byText('Save it as a picture')); const d2 = await dl2; if (d2) await d2.saveAs(path.join(OUT, '_report-download.jpg')); else if (ENGINE === 'chromium') issues.push('owner update download did not happen'); await shot('send-saved');
  await page.evaluate(() => App.closeSheet());
  // Make a picture to text instead: the old Cover page, under Send; Back returns to Send
  await scrollBottom(); await tap('#toCover'); await shot('picture-from-send', { wait: 1200 }); await at('Make a picture to text instead', 'cover', 'send'); same('picture from Send top bar', await top(), { ttl: 'A picture to text', back: 'Send' });
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from the picture to Send', 'report', 'send');

  // ---------- Help: on every screen. Its rows: the tour, the guide, ideas; under More: about, back up, start over ----------
  await page.locator('#helpBtn').click(); await page.waitForTimeout(350); await shot('help-sheet'); helped.push('Send');
  same('Help rows', await page.evaluate(() => ({ rows: [...document.querySelectorAll('#helpSheet .hrow b')].map(b => b.textContent).join(' | '), shown: [...document.querySelectorAll('#helpSheet .hrow b')].filter(__vis).map(b => b.textContent).join(' | '), moreOpen: document.querySelector('#helpSheet details.more').open, more: document.querySelector('#helpSheet details.more summary').textContent.trim() })), { rows: 'Show me around | How do I… | Tell us what is confusing | About CostTooling | Back up my data | Start over', shown: 'Show me around | How do I… | Tell us what is confusing', moreOpen: false, more: 'More' });
  await page.locator('#helpSheet details.more summary').click(); await page.waitForTimeout(300); await shot('help-sheet-more');
  same('Help rows under More', await page.evaluate(() => [...document.querySelectorAll('#helpSheet details.more .hrow b')].filter(__vis).map(b => b.textContent).join(' | ')), 'About CostTooling | Back up my data | Start over');
  // How do I… is a link to the guide
  const guideUrl = await page.evaluate(() => (document.querySelector('#helpSheet a.hrow') || {}).href || ''); if (!/\/guide\/$/.test(guideUrl)) issues.push('How do I… goes to ' + guideUrl); else { const r = await page.request.get(guideUrl); if (!r.ok()) issues.push('How do I… link answers ' + r.status() + ': ' + guideUrl); }
  // About CostTooling opens the welcome card
  await page.locator('#helpSheet .hrow', { hasText: 'About CostTooling' }).click(); await page.waitForTimeout(400); await shot('help-about'); if (!(await page.locator('#welcomeSheet.show').count())) issues.push('About CostTooling did not open the welcome card'); await page.locator('#welcomeGo').click(); await page.waitForTimeout(350);
  // Show me around starts the tour
  await page.locator('#helpBtn').click(); await page.waitForTimeout(350); await page.locator('#helpSheet .hrow', { hasText: 'Show me around' }).click(); await page.waitForTimeout(900);
  same('Show me around from Help', await page.evaluate(() => ({ on: Tour.active(), title: document.getElementById('tourTitle').textContent, sheet: document.querySelectorAll('.sheet.show').length })), { on: true, title: 'Your jobs', sheet: 0 });
  await page.locator('#tourX').click(); await page.waitForTimeout(300); await page.evaluate(() => { App.openProject('sample'); App.go('report'); }); await page.waitForTimeout(300);
  // Tell us what is confusing opens the ideas sheet, which names the screen. The sheet no longer carries the tour, back up and start over links.
  await page.locator('#helpBtn').click(); await page.waitForTimeout(350); await page.locator('#helpSheet .hrow', { hasText: 'Tell us what is confusing' }).click(); await page.waitForTimeout(400);
  if (!(await page.locator('#ideaSheet.show').count())) issues.push('Tell us what is confusing did not open the ideas sheet'); same('ideas sheet names the screen', await text('#ideaScreen'), 'Send');
  not('ideas sheet', await text('#ideaSheet'), ['Show me around', 'Back up my data', 'Start over']); same('ideas sheet foot links', await page.locator('#ideaSheet .foot, #ideaSheet a').count(), 0);
  await page.evaluate(() => App.closeSheet()); await page.waitForTimeout(300);
  // ideas, from the bulb
  await tap('#fab'); await page.fill('#ideaText', 'Let me text the picture straight to the owner'); await tap(byText('Must have')); await tap(byText('Save idea')); await shot('ideas-saved');
  same('idea saved', await page.evaluate(() => ({ list: document.querySelectorAll('#ideaList .row').length, badge: document.getElementById('fabN').textContent, kept: (JSON.parse(localStorage.getItem('ct-ideas')) || []).map(i => i.screen + ' · ' + i.imp).join() })), { list: 1, badge: '1', kept: 'Send · must have' });
  await page.locator('#sheetBg').click({ position: { x: 12, y: 12 } }); await page.waitForTimeout(400);

  // ---------- a new job from a list of parts → empty states ----------
  await page.locator('#back').click(); await page.waitForTimeout(300); await page.locator('#back').click(); await page.waitForTimeout(300); await at('Back to the job list', 'projects', '');
  await press('Start a new job'); await shot('job-form-empty'); await at('Start a new job', 'projform', ''); same('job form', [(await top()).ttl, await page.locator('#projformBody > .btn').count()], ['New job', 1]); await help('the job form');
  await page.fill('#pfName', 'Cedar Ridge garage'); await page.fill('#pfClient', 'Okafor'); await page.fill('#pfAddr', '77 Cedar Ridge Rd'); await page.fill('#pfContract', '48000'); await tap(byText('New garage / ADU'));
  await scrollBottom(); await shot('job-form-filled'); await press('Create this job'); await shot('new-job-home'); await at('Create this job', 'home', 'home');
  // a job with no bill: no warning card, nothing about a bill beyond step 3, and no cost numbers on home (they are on Parts)
  const plain = async where => { const h = await page.evaluate(() => { const num = document.getElementById('numbers'), was = num.open; num.open = true; const r = { txt: document.getElementById('homeBody').innerText, card: !!document.getElementById('checkCard'), notices: document.querySelectorAll('#homeBody .notice').length, tiles: [...document.querySelectorAll('#numbers .kpi span')].map(s => s.textContent).join(' | '), warn: document.querySelectorAll('#homeBody .warn, #homeBody .aheadTxt').length }; num.open = was; return r; }); if (h.card || h.notices || h.warn || h.tiles !== 'of the work is done | days left' || /billed|bill says|cost so far|to finish/i.test(h.txt) || !h.txt.includes('Type in the bill') || !h.txt.includes('Nothing typed in yet.')) issues.push(where + ': a job with no bill shows bill or cost words on its home: ' + JSON.stringify({ card: h.card, notices: h.notices, warn: h.warn, tiles: h.tiles })); };
  /** The Parts tab of a job with no bill: the builder's cost numbers, which used to be on home. */
  const plainParts = async (where, figures = []) => { const t = await text('#sovSummary'); need(where + ': Parts numbers', t, ['The whole job', 'Work done so far', 'Cost so far', 'Cost to finish', ...figures]); not(where + ': Parts numbers', t, ['What the bill says', 'What you saw done', 'Billed more than you saw']); if (await page.locator('#modeItems .aheadTxt').count()) issues.push(where + ': a part is marked as billed ahead'); };
  await plain('new job'); need('new job home', await text('#homeBody'), ['No work is marked done yet.', 'None yet. Start here.', '0 of 8 parts started.', 'No photos yet. Tap Take photos to add the first one.']);
  await tap('.tabs button[data-t=log]'); await shot('new-job-photos-empty'); need('new job Photos', await text('#logBody'), ['Add a photo', 'Show photos of', 'No photos yet.', 'Add the first photo']);
  await tap('.tabs button[data-t=send]'); await shot('new-job-send', { wait: 900 }); need('new job owner update', await text('#reportPreview'), ['Cedar Ridge garage', 'done', 'cost so far', 'to finish', 'days left', 'Part of the job', 'Cost']); not('new job owner update', await text('#reportPreview'), ['billed', 'Billed']);
  await tap('#toCover'); await shot('new-job-picture-empty', { wait: 1000 }); await at('new job picture', 'cover', 'send'); need('new job picture', await text('#coverBody'), ['No photos yet. Add some and they show up here.']);
  await tap('.tabs button[data-t=sov]'); await shot('new-job-parts'); await plainParts('new job', ['8 parts', '$0 (0%)', '$0']);
  const newTotal = await page.evaluate(() => Data.calc(App.state().projects[0]).total); if (newTotal !== 48000) notes.push('a new job typed in at a total price of $48,000 (New garage / ADU) gets parts that add up to $' + newTotal.toLocaleString() + ': each part is rounded to the nearest $100'); await scrollBottom(); await shot('new-job-parts-numbers');
  await tap('#modeItems button.card.part', 0); await shot('new-job-part'); await scrollBottom(); await shot('new-job-part-bottom');
  same('new job part', await partScreen(), { words: WORDS, on: 'Not started', pressed: 1, exactHidden: true, exact: '0', note: '', fold: false, foldOpen: false });
  if (!(await page.locator('#cfDesc').isVisible())) issues.push('a part in a job with no bill has its costs folded'); need('new job part', await text('#itemBody'), ['The bill says', 'from the contractor’s bill', 'No costs typed in yet.', '$0 total']);
  await page.locator('#back').click(); await page.waitForTimeout(400);
  // typing its first bill turns the home screen over: the warning card and the bill tiles appear
  await tap('.tabs button[data-t=bill]'); await shot('new-job-bill-empty'); same('new job bill is empty', await page.evaluate(() => [...document.querySelectorAll('#billCard .billline input')].map(i => i.value).join('')), '');
  await page.locator('#billCard .billline input').nth(0).fill('25'); await page.locator('#billCard .billline input').nth(0).blur(); await page.waitForTimeout(300); await shot('new-job-bill-first');
  need('new job bill total', await text('#billTotal'), ['You saw 0% done', '$1,200 billed more than you saw']);
  await tap('.tabs button[data-t=home]'); await shot('new-job-home-billed');
  const flipped = await page.evaluate(() => { const num = document.getElementById('numbers'); num.open = true; const r = { txt: document.getElementById('homeBody').innerText, card: (c => c && c.innerText.replace(/\s+/g, ' ').trim())(document.getElementById('checkCard')) }; num.open = false; return r; });
  if (flipped.card !== 'The contractor has billed $1,200 more than you saw. See which part' || !flipped.txt.includes('is what the bill says') || !flipped.txt.includes('billed more than you saw') || !flipped.txt.includes('Last typed today.') || flipped.txt.includes('cost so far')) issues.push('the first bill did not change the home screen: ' + JSON.stringify(flipped.card));
  await tap('.tabs button[data-t=sov]'); need('new job Parts numbers after a bill', await text('#sovSummary'), ['What you saw done', 'What the bill says', 'Billed more than you saw', '$1,200']); need('new job billed part on the list', await page.locator('#modeItems button.card.part').nth(0).innerText(), ['The bill says 25%']);
  await tap('.tabs button[data-t=home]'); await tap('#checkCard'); await at('new job bill warning', 'item', 'sov'); same('new job billed part', (({ note, fold, foldOpen }) => ({ note, fold, foldOpen }))(await partScreen()), { note: 'The bill says this part is 25% done. You marked it not started. That is $1,200 more than you saw.', fold: true, foldOpen: false });
  // change the job, then delete it
  await tap('.tabs button[data-t=home]'); await scrollBottom(); await press('Change this job’s name or dates'); await scrollBottom(); await shot('job-edit-form'); await at('change a job', 'projform', '');
  same('job form, changing', await page.evaluate(() => [document.getElementById('ttl').textContent, ...[...document.querySelectorAll('#projformBody > .btn')].map(b => b.textContent.trim())]), ['Change this job', 'Save', 'Delete this job']);
  await page.fill('#pfName', 'Cedar Ridge garage and shed'); await press('Save'); await at('save a job', 'home', 'home'); same('renamed job', [(await top()).ttl, await toast()], ['Cedar Ridge garage and shed', 'Saved']);
  await scrollBottom(); await press('Change this job’s name or dates'); await scrollBottom();
  await press('Delete this job'); await shot('delete-confirm'); same('delete a job asks', await text('#confirmTitle'), 'Delete this job?'); await tap('#confirmBtn'); await shot('jobs-after-delete'); await at('delete a job', 'projects', '');
  same('jobs after delete', await page.evaluate(() => App.state().projects.map(p => p.id).join()), 'sample');
  // long name + blank list of parts edge case
  await press('Start a new job'); await page.fill('#pfName', 'A very long job name that keeps going to test truncation in the header'); await tap(byText('Blank')); await press('Create this job'); await shot('blank-job-home');
  need('blank job home', await text('#homeBody'), ['This job has no parts yet.', 'No parts yet. Add them here.', 'Nothing typed in yet.']); await plain('blank job');
  await tap('#homeBody .steps button.step', 0); await shot('blank-job-photo-form'); need('blank job photo form', await text('#entryBody'), ['This job has no parts yet. Add them on the Parts tab, then pick one here.']); await press('Cancel'); await page.waitForTimeout(300);
  await tap('.tabs button[data-t=sov]'); await shot('blank-job-parts'); need('blank job Parts', await text('#sovBody'), ['This job has no parts yet.', 'Add a part']);
  await tap('.tabs button[data-t=bill]'); await shot('blank-job-bill'); need('blank job Bill', await text('#billBody'), ['This job has no parts yet.', 'Add them on the Parts tab, then type the bill here.']);
  await tap('.tabs button[data-t=send]'); await shot('blank-job-send'); need('blank job Send', await text('#reportPreview'), ['This job has no parts with a budget yet. Add them on the Parts tab and this page fills itself in.']);

  // ---- Wave 3 coverage ----
  await page.goto(APP + '/?s=projects', { waitUntil: 'networkidle' }); await page.evaluate(() => { App.openProject('sample'); App.go('log'); }); await page.waitForTimeout(400);
  // Show photos of: one part, the photos with no part, a part with none yet, then every part again
  const ids = { framing: (await sampleItem('Framing (edited)')).id, land: (await sampleItem('Landscaping')).id };
  const p1 = await pick(); need('Photos part list after the run so far', p1.labels.join(' | '), ['Every part (11)', 'Demolition (2)', 'Framing (edited) (4)', 'Roofing (2)', 'Landscaping (0)', 'No part picked (1)']); same('Photos part list ends with', p1.values.slice(-2), [ids.land, 'none']);
  await page.selectOption('#logPick', ids.framing); await page.waitForTimeout(300); await shot('photos-one-part');
  same('photos of Framing', await photosShown(), { photos: 4, parts: ids.framing, days: ['1 photo', '1 photo', '1 photo', '1 photo'], empty: '' });
  // Add a photo, while one part is showing, starts on that part
  await tap('#logAdd'); same('Add a photo while Framing is showing', await page.evaluate(() => document.getElementById('efItem').selectedOptions[0].text), 'Framing (edited)'); await press('Cancel'); await page.waitForTimeout(300); await at('Cancel back to Photos', 'log', 'log'); same('the part showing is kept', (await pick()).value, ids.framing);
  await page.selectOption('#logPick', 'none'); await page.waitForTimeout(300); await shot('photos-no-part'); same('photos with no part', await photosShown(), { photos: 1, parts: '', days: ['1 photo'], empty: '' }); need('photos with no part', await page.locator('#logBody .entry').filter({ visible: true }).first().innerText(), ['No part picked']);
  await page.selectOption('#logPick', ids.land); await page.waitForTimeout(300); await shot('photos-empty-part'); same('photos of a part with none', await photosShown(), { photos: 0, parts: '', days: [], empty: 'No photos of Landscaping yet. Add a photo of Landscaping' });
  await tap('#logEmptyBtn'); await at('Add a photo of Landscaping', 'entryform', 'log'); same('Add a photo of Landscaping starts on it', await page.evaluate(() => document.getElementById('efItem').selectedOptions[0].text), 'Landscaping'); await press('Cancel'); await page.waitForTimeout(300);
  await page.selectOption('#logPick', 'all'); await page.waitForTimeout(300); const shownAll = await photosShown(); if (shownAll.photos !== 10 || shownAll.empty) issues.push('Every part did not bring every photo back: ' + JSON.stringify(shownAll)); same('today on Photos', shownAll.days[0], '5 photos');
  // change a note and save
  await page.locator('#logBody .entry').filter({ visible: true }).first().click(); await page.waitForTimeout(400); await press('Change this photo'); await page.fill('#efNote', 'Edited note after save'); await press('Save'); await page.waitForTimeout(400);
  const edited = await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').entries.some(e => e.note === 'Edited note after save')); if (!edited) issues.push('changing a note did not save'); await shot('photos-after-edit'); await at('save a photo with no part', 'log', 'log');
  // a note with no photo, dated yesterday under More details: its day reads "note only". Then delete it.
  await tap('#logAdd'); await page.fill('#efNote', 'Inspector is due Friday'); await tap('#efMore summary'); await page.fill('#efDate', await page.evaluate(() => Data.iso(Data.addDays(Data.today(), -1)))); await press('Save'); await page.waitForTimeout(300); await at('save a note', 'log', 'log'); same('note toast', await toast(), 'Saved under Photos. No part picked.');
  same('a day with only a note', await page.evaluate(() => { const h = document.querySelector(`#logBody .day[data-day="${Data.iso(Data.addDays(Data.today(), -1))}"]`); return h && h.querySelector('.dayN').textContent; }), 'note only'); await page.locator('#logBody .entry.nophoto').scrollIntoViewIfNeeded(); await shot('photos-note-only');
  await tap('#logBody .entry.nophoto'); await shot('note-detail'); await at('open a note', 'photo', 'log'); need('note screen', await text('#photoBody'), ['Inspector is due Friday', 'Move it to another part', 'Change this note', 'Delete this note']); not('note screen', await text('#photoBody'), ['Use it in the picture to text', 'Delete this photo']);
  await press('Delete this note'); await shot('delete-note-confirm'); same('delete a note asks', await text('#confirmTitle'), 'Delete this note?'); await tap('#confirmBtn'); await at('delete a note', 'log', 'log'); same('note deleted', [await toast(), await page.locator('#logBody .entry.nophoto').count()], ['Deleted', 0]);
  // delete the photo with no part: the list of parts on Photos drops "No part picked"
  await scrollTop(); await page.locator('#logBody .entry').filter({ visible: true }).first().click(); await page.waitForTimeout(400); await press('Delete this photo'); await shot('delete-photo-confirm'); same('delete a photo asks', await text('#confirmTitle'), 'Delete this photo?'); await tap('#confirmBtn'); await at('delete a photo', 'log', 'log');
  same('photo deleted', await page.evaluate(() => ({ left: App.state().projects.find(p => p.id === 'sample').entries.length, none: [...document.getElementById('logPick').options].some(o => o.value === 'none'), picked: App.state().projects.find(p => p.id === 'sample').cover.picked.length })), { left: 9, none: false, picked: 0 });
  // delete a part: Landscaping goes, and Back lands on Parts
  await tap('.tabs button[data-t=sov]'); await tap('#modeSeg button[data-m=items]'); await page.locator('#modeItems button.card.part').last().click(); await page.waitForTimeout(400); same('part to delete', (await top()).ttl, 'Landscaping'); await scrollBottom();
  await press('Delete this part'); await shot('delete-part-confirm'); same('delete a part asks', await text('#confirmTitle'), 'Delete this part?'); need('delete a part says', await text('#confirmText'), ['"Landscaping" and its costs will be removed. Its photos stay under Photos.']); await tap('#confirmBtn'); await at('delete a part', 'sov', 'sov'); same('part deleted', [await toast(), await page.locator('#modeItems button.card.part').count()], ['Part deleted', 10]);
  // new photo: add two, remove one, cancel -> nothing saved, photo records cleaned
  const before = await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').entries.length);
  await page.evaluate(() => App.go('log')); await page.waitForTimeout(300); await tap('#logAdd'); await page.locator('#fileGal').setInputFiles([{ name: 'x.jpg', mimeType: 'image/jpeg', buffer: await jpeg('X') }, { name: 'y.jpg', mimeType: 'image/jpeg', buffer: await jpeg('Y') }]); await page.waitForTimeout(1500);
  await page.locator('#pendGrid .x').first().click(); await page.waitForTimeout(300); await shot('photo-form-removed-one'); const left = await page.locator('#pendGrid .ph[data-ph]').count(); if (left !== 1) issues.push('remove photo left ' + left);
  await press('Cancel'); await page.waitForTimeout(500); const after = await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').entries.length); if (after !== before) issues.push('cancel saved a photo');
  // draft restore after a reload mid-photo (iOS reloads the tab after the camera)
  await page.evaluate(() => App.go('log')); await page.waitForTimeout(300); await tap('#logAdd'); await page.fill('#efNote', 'Draft before reload'); await page.locator('#fileGal').setInputFiles({ name: 'd.jpg', mimeType: 'image/jpeg', buffer: await jpeg('DRAFT') });
  // wait for the import itself, not a fixed time: on a busy machine it can pass 1.5 s, and a reload mid-import loses the photo
  await page.waitForFunction(() => document.querySelectorAll('#pendGrid .ph[data-ph]').length === 1 && !document.querySelector('#entryBody .btn').disabled, null, { timeout: 15000 }).catch(() => issues.push('draft photo never finished importing')); await page.waitForTimeout(400);
  console.log('pre-reload session:', JSON.stringify(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ct-session') || 'null'); return s && { cur: s.cur, note: s.form && s.form.note, photos: s.form && s.form.photos, grid: document.querySelectorAll('#pendGrid .ph[data-ph]').length, hint: document.getElementById('pendHint').textContent, importingBtnDisabled: document.querySelector('#entryBody .btn').disabled, log: JSON.parse(localStorage.getItem('ct-log') || '[]').slice(-3) }; })));
  await page.goto(APP + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(800); await shot('draft-restored');
  const restored = await page.evaluate(() => (document.querySelector('[data-s=entryform]').classList.contains('on')) && document.getElementById('efNote').value === 'Draft before reload' && document.querySelectorAll('#pendGrid .ph[data-ph]').length === 1); if (!restored) issues.push('draft not restored after reload'); same('draft restored toast', await toast(), 'Picked up where you left off');
  await press('Cancel'); await page.waitForTimeout(400);
  // backup export: under Help, More
  await openHelpMore(); const dl3 = waitDl(); await page.locator('#helpSheet .hrow', { hasText: 'Back up my data' }).click(); const d3 = await dl3; if (d3) { const bp = path.join(OUT, '_backup.json'); await d3.saveAs(bp); try { JSON.parse(fs.readFileSync(bp, 'utf8')); } catch (e) { issues.push('backup is not valid JSON'); } } else if (ENGINE === 'chromium') issues.push('backup download did not happen');
  console.log('backup:', d3 ? 'downloaded ' + d3.suggestedFilename() : 'no download event', '· toast:', JSON.stringify(await toast())); if (!/^Backup (saved|shared) \(photos not included yet\)$/.test(await toast())) issues.push('Back up my data said: "' + await toast() + '"'); if (await page.locator('.sheet.show').count()) issues.push('Back up my data left the Help sheet up'); await page.evaluate(() => App.closeSheet());
  // many photos: performance
  await page.evaluate(() => { const p = App.state().projects.find(x => x.id === 'sample'); for (let i = 0; i < 50; i++) p.entries.push({ id: 'perf' + i, d: Data.iso(Data.addDays(Data.today(), -i % 20)), time: '9:00 AM', ts: Date.now() - i, itemId: p.items[i % p.items.length].id, note: 'Performance photo ' + i, wx: 'sun', temp: 70, crew: 3, photos: [{ seed: i, kind: ['roof', 'walls', 'frame', 'slab'][i % 4], wx: 'sun' }] }); DB.save(App.state()); });
  const time = s => page.evaluate(s => { const t0 = performance.now(); App.go(s); return Math.round(performance.now() - t0); }, s);
  const tLog = await time('log'), tHome = await time('home'), tCover = await time('cover'), tParts = await time('sov'), tBill = await time('bill'), tSend = await time('report'); const nEntries = await page.evaluate(() => App.state().projects.find(x => x.id === 'sample').entries.length);
  console.log(`perf with ${nEntries} photos and notes: photos ${tLog}ms home ${tHome}ms picture ${tCover}ms parts ${tParts}ms bill ${tBill}ms send ${tSend}ms`); if (tLog > 300) issues.push('Photos render slow: ' + tLog + 'ms'); if (Math.max(tHome, tParts, tBill) > 300) issues.push('a tab renders slow: home ' + tHome + 'ms parts ' + tParts + 'ms bill ' + tBill + 'ms');
  await page.goto(APP + '/?s=log', { waitUntil: 'networkidle' }); await shot('photos-' + nEntries); await at('link ?s=log', 'log', 'log'); same('every photo is on Photos', (await photosShown()).photos, nEntries);

  // ---------- old links still open the right screen, with the right tab lit ----------
  const link = async (q, screen, tab) => { await page.goto(APP + '/' + q, { waitUntil: 'networkidle' }); await page.waitForTimeout(400); await at('link ' + q, screen, tab); };
  await link('?s=cover', 'cover', 'send'); await shot('link-cover', { wait: 900 }); same('link ?s=cover top bar', await top(), { ttl: 'A picture to text', back: 'Send' });
  await page.locator('#back').click(); await page.waitForTimeout(400); await at('Back from link ?s=cover', 'report', 'send');
  await link('?s=report', 'report', 'send'); await shot('link-report', { wait: 900 }); same('link ?s=report top bar', await top(), { ttl: 'Send', back: 'Home' }); if (!(await shown('#sendBtn'))) issues.push('link ?s=report has no Send it to the owner button');
  await link('?s=sov&m=bill', 'bill', 'bill'); await shot('link-sov-bill'); same('link ?s=sov&m=bill top bar', await top(), { ttl: 'The bill', back: 'Home' }); if (!(await shown('#billCard'))) issues.push('link ?s=sov&m=bill does not show the bill');
  await link('?s=sov&m=gantt', 'sov', 'sov'); same('link ?s=sov&m=gantt', await page.evaluate(() => ({ gantt: __vis(document.getElementById('modeGantt')), on: document.querySelector('#modeSeg button.on').dataset.m })), { gantt: true, on: 'gantt' });
  await link('?s=sov', 'sov', 'sov'); if (!(await shown('#modeItems button.card.part'))) issues.push('link ?s=sov does not show the list of parts');
  await link('?s=bill', 'bill', 'bill'); await link('?s=home', 'home', 'home'); await link('?s=item', 'item', 'sov'); await link('?s=photo', 'photo', 'log'); await link('?job=sample&s=home', 'home', 'home');
  // a phone that was left on the old Bill switch of the Parts tab comes back on the Bill tab
  await page.goto(BASE + '/icons/icon.svg'); await page.evaluate(() => localStorage.setItem('ct-session', JSON.stringify({ cur: 'sov', mode: 'bill', at: Date.now() })));
  await page.goto(APP + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(400); await at('a session left on Parts > Bill', 'bill', 'bill');

  // a phone from before bills existed: its job is untouched and draws with no bill; its stored sample gets the bill, once
  const oldJob = await page.evaluate(() => {
    const S = JSON.parse(localStorage.getItem('ct-data-v2')); S.projects.forEach(p => p.items.forEach(i => { delete i.billed; delete i.billedAt; }));
    const d = n => Data.iso(Data.addDays(Data.today(), n));
    const job = { id: 'old1', name: 'Job from before bills', client: 'Okafor', addr: '', start: d(-20), finish: d(40), items: [{ id: 'oi1', n: 'Slab', b: 10000, pct: 50, s: d(-20), e: d(0), costs: [{ id: 'oc1', desc: 'Concrete', amt: 6000, date: d(-10) }] }, { id: 'oi2', n: 'Framing', b: 20000, pct: 0, s: d(0), e: d(30), costs: [] }], entries: [], cover: { picked: [], layout: 'hero', head: '', note: '', numMode: 'auto', manual: {} } };
    S.projects.push(job); S.cur = 'old1'; localStorage.setItem('ct-data-v2', JSON.stringify(S)); localStorage.removeItem('ct-sample-bill'); localStorage.removeItem('ct-session'); return JSON.stringify(job);
  });
  await page.goto(APP + '/?s=home', { waitUntil: 'networkidle' }); await shot('old-job-home'); await plain('old job'); need('old job home', await text('#homeBody'), ['A little of the work is done.', '1 of 2 parts started.']);
  await tap('#numbers summary'); await shot('old-job-home-numbers'); need('old job numbers', await text('#numbers'), ['17%', 'of the work is done', 'days left']);
  await page.evaluate(() => App.go('sov')); await shot('old-job-parts'); await plainParts('old job', ['2 parts', '$30,000', '$5,000 (17%)', '$6,000', '$26,000']);
  await tap('#modeItems button.card.part', 0); await shot('old-job-part'); await scrollBottom(); await shot('old-job-part-bottom');
  same('old job part', await partScreen(), { words: WORDS, on: 'About half 50%', pressed: 1, exactHidden: true, exact: '50', note: '', fold: false, foldOpen: false });
  if (!(await page.locator('#cfDesc').isVisible())) issues.push('old job: the costs on a part are folded'); need('old job part', await text('#itemBody'), ['Concrete', '$6,000 total', 'from the contractor’s bill']);
  await page.evaluate(() => App.go('bill')); await shot('old-job-bill'); same('old job bill is empty', await page.evaluate(() => [...document.querySelectorAll('#billCard .billline input')].map(i => i.value).join('')), '');
  await page.evaluate(() => App.go('report')); await shot('old-job-send', { wait: 900 }); const oldRep = await text('#reportPreview'); need('old job owner update', oldRep, ['cost so far', 'to finish', 'Part of the job', 'Cost', 'Costs are $1,000 more than the value of the work done.']); not('old job owner update', oldRep, ['billed', 'Billed']);
  const oldAfter = await page.evaluate(() => ({ mem: JSON.stringify(App.state().projects.find(p => p.id === 'old1')), disk: JSON.stringify(JSON.parse(localStorage.getItem('ct-data-v2')).projects.find(p => p.id === 'old1')), sample: App.state().projects.find(p => p.id === 'sample').items.filter(i => 'billed' in i).length, flag: localStorage.getItem('ct-sample-bill') }));
  if (oldAfter.mem !== oldJob || oldAfter.disk !== oldJob) issues.push('old job: its data was rewritten'); if (oldAfter.sample !== 6 || !oldAfter.flag) issues.push('stored sample did not get its bill: ' + oldAfter.sample); // 6 of the 7 billed parts: the bill goes on by name, and this run renamed Framing
  await page.evaluate(() => { const S = JSON.parse(localStorage.getItem('ct-data-v2')); S.projects.find(p => p.id === 'sample').items.forEach(i => { delete i.billed; delete i.billedAt; }); localStorage.setItem('ct-data-v2', JSON.stringify(S)); });
  await page.goto(APP + '/?s=projects', { waitUntil: 'networkidle' }); if (await page.evaluate(() => App.state().projects.find(p => p.id === 'sample').items.some(i => 'billed' in i))) issues.push('the sample bill came back after it was cleared');
  // start over: under Help, More
  await openHelpMore(); await page.locator('#helpSheet .hrow', { hasText: 'Start over' }).click(); await page.waitForTimeout(400); await shot('start-over-confirm'); same('start over asks', await text('#confirmTitle'), 'Start over?');
  await tap('#confirmBtn'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800); await shot('after-start-over');
  const fresh = await page.evaluate(() => App.state().projects.length === 1 && App.state().projects[0].id === 'sample' && App.state().projects[0].entries.length === 8 && !localStorage.getItem('ct-ideas')); if (!fresh) issues.push('start over did not reset');

  // ---------- the tour over the sample job: every stop is there, in order, and finds its target ----------
  const walkTour = async shots => { const stops = []; for (let s = 0; s < 20; s++) { const t = await page.locator('#tourTitle').innerText(); const hole = await page.evaluate(() => { const r = document.getElementById('tourHole').getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }); stops.push(t); const last = await page.locator('#tourTry').count(); if (!last && /^0x|x0$/.test(hole)) issues.push('tour stop "' + t + '" points at nothing'); if (shots) { await shot('tour-' + t.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, ''), { wait: 600 }); } if (last) break; await page.locator('#tourNext').click(); await page.waitForTimeout(500); } return stops; };
  await page.goto(APP + '/?tour=1', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
  const cloudStop = await page.evaluate(() => !!(window.Cloud && Cloud.enabled() && !Cloud.signedIn()));
  const want = ['Your jobs', 'How the job is going', 'Check before you pay', 'Four steps', 'Photos', 'Photos of one part', 'Mark what you saw', 'Type in the bill', 'The owner update', 'Send it', ...(cloudStop ? ['Your jobs on every phone'] : []), "That's the whole app"];
  const stops = await walkTour(true); same('tour stops', stops.join(' > '), want.join(' > '));
  need('tour end card', await text('#tourCard'), ['Try the sample job', 'Start my own job', 'The Help button is at the top of every screen.']);
  await page.locator('#tourX').click(); await page.waitForTimeout(300); if (await page.evaluate(() => Tour.active())) issues.push('the tour did not close');
  // a first job with no bill skips the stop about the bill. The sample's bill is taken off for this, then put back.
  const hadBill = await page.evaluate(() => { const p = App.state().projects.find(x => x.id === 'sample'), had = p.items.map(i => 'billed' in i ? [i.billed, i.billedAt] : null); p.items.forEach(i => { delete i.billed; delete i.billedAt; }); Tour.start(); return had; }); await page.waitForTimeout(900);
  same('tour stops, job with no bill', (await walkTour(false)).join(' > '), want.filter(t => t !== 'Check before you pay').join(' > ')); await page.locator('#tourX').click(); await page.waitForTimeout(300);
  await page.evaluate(had => { const p = App.state().projects.find(x => x.id === 'sample'); p.items.forEach((i, x) => { if (had[x]) { i.billed = had[x][0]; i.billedAt = had[x][1]; } }); DB.save(App.state()); }, hadBill);

  // desktop + storyboard
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(APP + '/?s=home', { waitUntil: 'networkidle' }); await shot('desktop-shell', { wait: 1200 }); await at('desktop', 'home', 'home'); need('desktop home', await text('#homeBody'), ['About a third of the work is done.', 'The contractor has billed $3,420 more than you saw.']); await help('desktop');
  await page.goto(BASE + '/mockups/', { waitUntil: 'networkidle' }); await shot('storyboard', { wait: 800, noScan: true });
  fs.writeFileSync(path.join(OUT, '_console.txt'), consoleErrors.join('\n') || '(no console errors)');
  console.log('screens:', n, '· Help opened on:', helped.join(', '));
  notes.forEach(t => console.log('note:', t));
  console.log('engine:', ENGINE, 'console errors:', consoleErrors.length); consoleErrors.forEach(e => console.log('  -', e)); console.log('issues:', issues.length); issues.forEach(i => console.log('  !', i));
  await browser.close();
})().catch(e => { console.error('FAILED at step', n, e); process.exit(1); });
