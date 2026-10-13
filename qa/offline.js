// Loads the live site once, goes offline, reloads: the service worker must serve the app. Run: node qa/offline.js [baseUrl]
const { chromium } = require('playwright'); const BASE = process.argv[2] || 'https://costtooling.com';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.goto(BASE + '/?s=projects', { waitUntil: 'networkidle' });
  const reg = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, active: !!r.active }; });
  await page.waitForTimeout(2500);
  const cached = await page.evaluate(async () => { const keys = await caches.keys(); const c = await caches.open(keys[0]); return { keys, n: (await c.keys()).length }; });
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
  const ok = await page.evaluate(() => typeof App === 'object' && App.state().projects.length >= 1 && document.querySelector('.screen.on').dataset.s === 'projects');
  console.log(JSON.stringify({ reg, cached, offlineLoads: ok })); await b.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error('offline test failed:', e.message); process.exit(1); });
