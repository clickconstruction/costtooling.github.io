// End-to-end cloud test: sign in as a test user, create a company, make a
// project with a photo, confirm it syncs, open the Team screen and mint codes,
// then sign in from a second fresh browser and confirm the project and photo
// arrive. Run: E2E_EMAIL=... E2E_PASSWORD=... node qa/cloud-e2e.js [baseUrl]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8766';
const EMAIL = process.env.E2E_EMAIL, PASSWORD = process.env.E2E_PASSWORD;
const OUT = path.join(__dirname, 'shots-cloud'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const issues = [], errors = []; let n = 0;
const shot = async (page, name) => { n++; await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `${String(n).padStart(2, '0')}-${name}.png`) }); };
const waitStatus = (page, want, ms = 15000) => page.waitForFunction(w => Cloud.state().status === w, want, { timeout: ms }).catch(() => page.evaluate(() => Cloud.state().status).then(st => issues.push('status never became ' + want + ' (is ' + st + ')')));
const jpeg = async (page, label) => Buffer.from((await page.evaluate((label) => { const c = document.createElement('canvas'); c.width = 1400; c.height = 1000; const g = c.getContext('2d'); g.fillStyle = '#6a8fb5'; g.fillRect(0, 0, 1400, 1000); g.fillStyle = '#8d6a40'; for (let i = 0; i < 9; i++) g.fillRect(100 + i * 140, 350, 28, 500); g.fillStyle = '#fff'; g.font = 'bold 80px sans-serif'; g.fillText(label, 100, 180); return c.toDataURL('image/jpeg', 0.9); }, label)).split(',')[1], 'base64');

(async () => {
  if (!EMAIL || !PASSWORD) throw new Error('set E2E_EMAIL and E2E_PASSWORD');
  const browser = await chromium.launch();
  const mk = async () => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const page = await ctx.newPage(); page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); return { ctx, page }; };

  // ---- phone A: sign in, create company, add a project with a photo ----
  const A = await mk();
  await A.page.goto(BASE + '/?s=projects', { waitUntil: 'networkidle' });
  await A.page.evaluate(() => { localStorage.setItem('ct-welcomed', '1'); });
  await A.page.goto(BASE + '/?s=signin', { waitUntil: 'networkidle' });
  await shot(A.page, 'signin');
  await A.page.fill('#siEmail', EMAIL); await A.page.fill('#siPwd', PASSWORD); await A.page.click('#siBtn');
  await A.page.waitForFunction(() => document.querySelector('.screen.on').dataset.s === 'company' || document.querySelector('.screen.on').dataset.s === 'projects', null, { timeout: 20000 });
  await shot(A.page, 'after-signin');
  const screen = await A.page.evaluate(() => document.querySelector('.screen.on').dataset.s);
  if (screen === 'company') {
    await A.page.fill('#coName', 'E2E Builders'); await A.page.click('#coBtn');
    await A.page.waitForFunction(() => document.querySelector('.screen.on').dataset.s === 'projects', null, { timeout: 20000 });
  }
  await shot(A.page, 'projects-signed-in');
  const st = await A.page.evaluate(() => Cloud.state());
  if (!st.companyId) issues.push('no company after sign-in');
  console.log('company', st.companyId, 'memberships', st.memberships.map(m => m.name + ':' + m.role).join(','));

  // new project with a photo entry
  await A.page.evaluate(() => { App.newProject(); document.getElementById('pfName').value = 'E2E Garage'; document.getElementById('pfClient').value = 'Test Client'; document.getElementById('pfContract').value = '12000'; App.pickTemplate('garage'); App.saveProject(); });
  await A.page.evaluate(() => App.newEntry());
  await A.page.locator('#fileGal').setInputFiles({ name: 'e2e.jpg', mimeType: 'image/jpeg', buffer: await jpeg(A.page, 'E2E PHOTO') });
  await A.page.waitForTimeout(1500);
  await A.page.fill('#efNote', 'Synced from phone A');
  await A.page.evaluate(() => App.saveEntry());
  await waitStatus(A.page, 'synced', 30000);
  await A.page.waitForTimeout(1500); await waitStatus(A.page, 'synced', 20000);
  await shot(A.page, 'log-after-sync');
  const syncA = await A.page.evaluate(() => ({ status: Cloud.state().status, detail: Cloud.state().detail, projects: App.state().projects.filter(p => !p.sample).map(p => ({ id: p.id, name: p.name, companyId: p.companyId, photos: p.entries.flatMap(e => e.photos.map(ph => ph.id)) })) }));
  console.log('phone A sync:', JSON.stringify(syncA));
  const proj = syncA.projects[0]; if (!proj || !proj.companyId) issues.push('project not tagged with company');

  // team screen: code-only invite + join code
  await A.page.evaluate(() => App.go('team'));
  await A.page.waitForSelector('#tmBtn', { timeout: 15000 }); await shot(A.page, 'team');
  await A.page.click('#tmBtn'); await A.page.waitForFunction(() => /Code .* created/.test(document.getElementById('tmMsg')?.textContent || ''), null, { timeout: 15000 }).catch(async () => issues.push('code-only invite failed: ' + await A.page.evaluate(() => document.getElementById('tmMsg')?.textContent)));
  const inviteCode = await A.page.evaluate(() => (document.getElementById('tmMsg').textContent.match(/Code ([A-Z0-9]{4}-[A-Z0-9]{4})/) || [])[1]);
  console.log('invite code', inviteCode);
  await A.page.evaluate(() => Cloud.ui.rotateJoin()); await A.page.waitForSelector('.codebox', { timeout: 15000 }).catch(() => issues.push('join code not shown'));
  const joinCode = await A.page.evaluate(() => (document.querySelector('.codebox') || {}).textContent);
  console.log('join code', joinCode); await shot(A.page, 'team-with-codes');

  // ---- phone B: fresh browser; check the invite code while signed out, then sign in and pull ----
  const B = await mk();
  await B.page.goto(BASE + '/?s=join', { waitUntil: 'networkidle' });
  await B.page.evaluate(() => { localStorage.setItem('ct-welcomed', '1'); });
  await B.page.fill('#jnCode', inviteCode || 'ZZZZ-9999');
  await B.page.waitForFunction(() => (document.getElementById('jnCheck')?.textContent || '').includes('E2E Builders') || (document.getElementById('jnErr')?.textContent || '').length > 0, null, { timeout: 15000 });
  const check = await B.page.evaluate(() => ({ ok: document.getElementById('jnCheck').textContent, err: document.getElementById('jnErr').textContent }));
  console.log('phone B code check:', JSON.stringify(check)); if (!check.ok.includes('E2E Builders')) issues.push('invite code check failed: ' + check.err);
  await shot(B.page, 'join-check');
  await B.page.goto(BASE + '/?s=signin', { waitUntil: 'networkidle' });
  await B.page.fill('#siEmail', EMAIL); await B.page.fill('#siPwd', PASSWORD); await B.page.click('#siBtn');
  await B.page.waitForFunction(() => document.querySelector('.screen.on').dataset.s === 'projects', null, { timeout: 20000 });
  await B.page.waitForFunction(() => App.state().projects.some(p => p.name === 'E2E Garage'), null, { timeout: 20000 }).catch(() => issues.push('project did not arrive on phone B'));
  await shot(B.page, 'phone-b-projects');
  await B.page.evaluate(() => { const p = App.state().projects.find(x => x.name === 'E2E Garage'); if (p) { App.openProject(p.id); App.go('log'); } });
  await B.page.waitForFunction(() => { const img = document.querySelector('#logBody .entry img'); return img && img.complete && img.naturalWidth > 0; }, null, { timeout: 30000 }).catch(() => issues.push('photo did not load on phone B'));
  await shot(B.page, 'phone-b-log-photo');
  const noteB = await B.page.evaluate(() => (document.querySelector('#logBody .entry p') || {}).textContent); if (!/Synced from phone A/.test(noteB || '')) issues.push('note mismatch on phone B: ' + noteB);

  // sign out both
  await A.page.evaluate(() => Cloud.ui.signOut()); await A.page.click('#confirmBtn').catch(() => {}); await A.page.waitForTimeout(800);
  await shot(A.page, 'phone-a-signed-out');
  await browser.close();
  fs.writeFileSync(path.join(OUT, '_console.txt'), errors.join('\n') || '(no console errors)');
  console.log('console errors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  -', e));
  console.log('issues:', issues.length); issues.forEach(i => console.log('  !', i));
  process.exit(issues.length ? 1 : 0);
})().catch(e => { console.error('FAILED at step', n, e.message); process.exit(1); });
