// Checks Continue with Google without touching Google or the live Supabase project: the two network calls the button
// depends on are answered here. /auth/v1/settings is faked to say whether the Google provider is on and whether new
// people may sign up; the trip to /auth/v1/authorize is stopped and its address is read.
// Run: NODE_PATH=<node_modules with playwright> node qa/google-signin.js [baseUrl]   (add ENGINE=webkit for Safari's engine)
const pw = require('playwright'); const ENGINE = process.env.ENGINE || 'chromium';
const BASE = (process.argv[2] || 'http://127.0.0.1:8766').replace(/\/$/, ''), APP = BASE + '/app';
const issues = []; const same = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) issues.push(`${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); };
(async () => {
  const browser = await pw[ENGINE].launch();
  const open = async (settings, path) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); const seen = { authorize: null, errors: [] };
    page.on('pageerror', e => seen.errors.push(e.message));
    await page.route('**/auth/v1/settings', r => settings ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(settings) }) : r.abort());
    await page.route('**/auth/v1/authorize**', r => { seen.authorize = r.request().url(); r.abort(); });
    await page.addInitScript(() => localStorage.setItem('ct-welcomed', '1'));
    await page.goto(APP + (path || '/?s=signin'), { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
    return { page, seen, ctx };
  };
  const look = page => page.evaluate(() => ({ screen: App.current(), google: !!document.getElementById('siGoogle'), hint: (document.querySelector('#siGoogle + .hint') || {}).innerText || '', email: !!document.getElementById('siEmail'), err: (document.getElementById('siErr') || {}).innerText || '' }));

  // 1. Google off in Supabase, which is how the project is today: the sign-in screen is as it was
  let t = await open({ external: { email: true, google: false }, disable_signup: false });
  same('Google off', await look(t.page), { screen: 'signin', google: false, hint: '', email: true, err: '' }); await t.ctx.close();
  // 2. the settings call fails (offline): no button, no error
  t = await open(null); same('settings unreachable', await look(t.page), { screen: 'signin', google: false, hint: '', email: true, err: '' }); same('settings unreachable, page errors', t.seen.errors, []); await t.ctx.close();
  // 3. Google on, sign-ups open: the button, the words for a new person, and the trip to Google
  t = await open({ external: { email: true, google: true }, disable_signup: false });
  same('Google on, sign-ups open', await look(t.page), { screen: 'signin', google: true, hint: 'New here? This also makes your account.', email: true, err: '' });
  await t.page.click('#siGoogle'); await t.page.waitForTimeout(900);
  const u = t.seen.authorize ? new URL(t.seen.authorize) : null;
  same('the trip to Google', u && { provider: u.searchParams.get('provider'), back: u.searchParams.get('redirect_to'), pkce: !!u.searchParams.get('code_challenge') }, { provider: 'google', back: BASE + '/?auth=signin', pkce: true });
  await t.page.screenshot({ path: require('path').join(__dirname, 'shots-plain', 'google-signin.png') }).catch(() => {});
  await t.ctx.close();
  // 4. the job list card says anyone can sign in
  t = await open({ external: { email: true, google: true }, disable_signup: false }, '/?s=projects');
  same('job list card, sign-ups open', await t.page.evaluate(() => document.getElementById('cloudPromo').innerText.replace(/\s+/g, ' ')), 'Your jobs are saved on this phone No sign-in needed. To see them on another phone too, sign in with Google. Sign in I have a code');
  // the account button on the job list stays when the sync status repaints (it vanished in versions 19 and 20)
  same('account button after a status repaint', await t.page.evaluate(() => { Cloud.paintStatus(); return getComputedStyle(document.getElementById('cloudBtn')).display !== 'none'; }), true);
  await t.ctx.close();
  // 5. Google on, sign-ups closed: the button, with the words for someone the company already added
  t = await open({ external: { email: true, google: true }, disable_signup: true });
  same('Google on, sign-ups closed', await look(t.page), { screen: 'signin', google: true, hint: 'Works when your company has already added your Google address.', email: true, err: '' }); await t.ctx.close();
  t = await open({ external: { email: true, google: true }, disable_signup: true }, '/?s=projects');
  same('job list card, sign-ups closed', await t.page.evaluate(() => document.getElementById('cloudPromo').innerText.replace(/\s+/g, ' ')), 'Your jobs are saved on this phone No sign-in needed. To see them on another phone too, sign in with an account from your company. I have an account I have a code'); await t.ctx.close();
  // 6. coming back from Google with an error: the sign-in screen says why, and the address is clean
  t = await open({ external: { email: true, google: true }, disable_signup: true }, '/?auth=signin&error=access_denied&error_description=Signups+not+allowed+for+this+instance');
  same('back from Google, no account', await look(t.page), { screen: 'signin', google: true, hint: 'Works when your company has already added your Google address.', email: true, err: 'No CostTooling account uses that Google address yet. Ask your company for a code, then try again.' });
  same('back from Google, address', await t.page.evaluate(() => location.search), ''); await t.ctx.close();
  t = await open({ external: { email: true, google: true }, disable_signup: false }, '/?auth=signin&error=server_error&error_description=Unable+to+exchange+external+code');
  same('back from Google, other error', (await look(t.page)).err, 'Google sign-in did not finish. Try again, or sign in with your email.'); await t.ctx.close();
  // 7. coming back with a sign-in code, as from Google or an emailed link: the app must still hold the code when Supabase
  //    trades it for a session. Version 21 wiped it from the address first, and people came back signed out.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); let traded = null;
    await page.route('**/auth/v1/settings', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ external: { email: true, google: true }, disable_signup: false }) }));
    await page.route('**/auth/v1/token**', r => { traded = { url: r.request().url(), body: r.request().postData() || '' }; r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'fake code' }) }); });
    await page.goto(APP + '/?s=projects', { waitUntil: 'networkidle' });
    // the code verifier Supabase left on the phone before the trip out; its key carries the project's name, read from cloud.js
    await page.evaluate(async () => { localStorage.setItem('ct-welcomed', '1'); const src = await (await fetch('../js/cloud.js')).text(); const ref = /https:\/\/([a-z0-9]+)\.supabase\.co/.exec(src)[1]; localStorage.setItem('sb-' + ref + '-auth-token-code-verifier', '"fake-verifier-for-the-check"'); });
    await page.goto(APP + '/?auth=signin&code=fake-code-for-the-check', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    // Over https the service worker is in control and the trade is not seen from here, so the request itself is checked only on a local server.
    if (/^http:/.test(BASE)) same('a sign-in code is traded for a session', traded && { pkce: /grant_type=pkce/.test(traded.url), code: /fake-code-for-the-check/.test(traded.body) }, { pkce: true, code: true });
    same('after a code that fails', await page.evaluate(() => ({ screen: App.current(), err: (document.getElementById('siErr') || {}).innerText || '', address: location.search })), { screen: 'signin', err: 'That sign-in did not finish. Try again.', address: '' });
    await ctx.close();
  }
  console.log('engine:', ENGINE, 'issues:', issues.length); issues.forEach(i => console.log('  !', i));
  await browser.close(); process.exit(issues.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
