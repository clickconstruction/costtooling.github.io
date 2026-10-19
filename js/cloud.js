/* Cloud — accounts, team and sync for CostTooling, hosted on the charity-tooling
 * Supabase project (shared sign-in, CostTooling's own ct_ tables).
 *
 * Local-first: everything works signed out. Signed in, each non-sample project
 * is pushed as one JSON row (ct_projects) and its photos go to the private
 * ct-photos bucket. Pull merges the company's projects into the device.
 * Conflicts: a project changed on this device since its last sync wins.
 */
const Cloud = (() => {
  const SUPABASE_URL = 'https://cjwybuhogxyayjnuxpem.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_mY04D4GZBph7ss23Hh_FNg_t34i1uZr'; // publishable key: safe to ship, RLS enforces access
  const BUCKET = 'ct-photos';
  const SCREENS = ['signin', 'join', 'forgot', 'setpass', 'company', 'account', 'team'];
  const $ = id => document.getElementById(id);
  const esc = s => UI.esc(s), ic = (n, s) => UI.ic(n, s);
  const REASONS = { 'not-found': 'That code is not valid. Check it with whoever gave it to you.', used: 'That code has already been used. Ask for a new one.', expired: 'That code has expired. Ask for a new one.', revoked: 'That code was cancelled. Ask for the current one.', 'email-mismatch': 'That code was sent to a different email address.', 'too-many-attempts': 'Too many tries. Wait a minute and try again.', 'invalid-email': 'Enter a valid email address.' };

  let sb = null, session = null, user = null, profile = null, memberships = [], companyId = DB.get('ct-company') || null;
  let status = 'off', detail = '', authIntent = null, pushTimer = null, pushing = false, pulling = false;
  const sync = Object.assign({ synced: {}, uploaded: {}, deleted: [] }, DB.get('ct-sync') || {});
  const saveSync = () => DB.set('ct-sync', sync);

  try {
    if (window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  } catch (e) { console.warn('cloud unavailable', e); }
  const enabled = () => !!sb;
  const signedIn = () => !!session;
  const company = () => memberships.find(m => m.company_id === companyId) || null;
  const isAdmin = () => { const m = company(); return !!(m && m.role === 'admin') || !!(profile && profile.is_super_admin); };
  const setStatus = (s, d) => { status = s; detail = d || ''; paintStatus(); };

  // ---------- boot ----------
  async function init() {
    const q = new URLSearchParams(location.search); authIntent = q.get('auth');
    if (q.get('auth') || q.get('code')) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
    if (!enabled()) { setStatus('off'); return; }
    setStatus('out');
    const { data } = await sb.auth.getSession(); session = data.session; user = session ? session.user : null;
    sb.auth.onAuthStateChange((event, s) => {
      session = s; user = s ? s.user : null;
      if (event === 'PASSWORD_RECOVERY') { authIntent = 'reset'; afterSignIn(); }
      else if (event === 'SIGNED_IN') afterSignIn();
      else if (event === 'SIGNED_OUT') { profile = null; memberships = []; setStatus('out'); paintStatus(); }
    });
    if (session) afterSignIn(); else if (authIntent === 'welcome' || authIntent === 'reset') { /* link failed to establish a session */ App.go('signin'); App.toast('That link has expired. Sign in or ask for a new one.'); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && signedIn()) { pull().then(push); } });
    window.addEventListener('online', () => { if (signedIn()) push(); });
    if (q.get('s') === 'signin' || q.get('s') === 'join') App.go(q.get('s'));
  }
  async function afterSignIn() {
    try {
      const [{ data: p }, { data: ms }] = await Promise.all([
        sb.from('profiles').select('id, email, full_name, is_super_admin, must_change_password').eq('id', user.id).maybeSingle(),
        sb.from('ct_company_members').select('company_id, role, deactivated_at, ct_companies(name)').eq('user_id', user.id),
      ]);
      profile = p || { id: user.id, email: user.email };
      memberships = (ms || []).filter(m => !m.deactivated_at).map(m => ({ company_id: m.company_id, role: m.role, name: (m.ct_companies && m.ct_companies.name) || 'Company' }));
      if (!memberships.some(m => m.company_id === companyId)) companyId = memberships[0] ? memberships[0].company_id : null;
      DB.set('ct-company', companyId);
    } catch (e) { console.warn('profile load', e); profile = { id: user.id, email: user.email }; }
    if (profile.must_change_password || authIntent === 'welcome' || authIntent === 'reset') { const intent = authIntent; authIntent = null; App.go('setpass'); if (intent === 'welcome') App.toast('Welcome! Choose a password to finish.'); return; }
    if (!companyId) { App.go('company'); return; }
    await pull(); await push();
    if (App.current() === 'signin' || App.current() === 'join') App.go('projects');
  }

  // ---------- auth actions ----------
  async function signInPassword(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Wrong email or password.' : error.message);
  }
  async function sendMagicLink(email) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname + '?auth=signin' } });
    if (error) throw new Error(/rate/i.test(error.message) ? 'Too many requests. Try again in a few minutes.' : error.message);
  }
  async function forgot(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + '?auth=reset' });
    if (error && /rate/i.test(error.message)) throw new Error('Too many requests. Try again in a few minutes.');
  }
  async function setPassword(pwd) {
    const { error } = await sb.auth.updateUser({ password: pwd }); if (error) throw error;
    await sb.from('profiles').update({ must_change_password: false }).eq('id', user.id); if (profile) profile.must_change_password = false;
  }
  async function signOut() { await sb.auth.signOut(); session = null; user = null; profile = null; memberships = []; setStatus('out'); App.go('projects'); }
  async function fn(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body: Object.assign({ app: 'ct' }, body) });
    if (error) { let msg = error.message; try { const ctx = error.context && (await error.context.json()); if (ctx && (ctx.error || ctx.reason)) msg = ctx.error || ctx.reason; } catch (e) {} throw new Error(msg); }
    if (data && data.error) throw new Error(data.error);
    return data;
  }
  const checkCode = code => fn('join-with-code', { action: 'check', code });
  const joinWithCode = (code, email) => fn('join-with-code', { action: 'join', code, email });
  async function createCompany(name) { const { data, error } = await sb.rpc('ct_create_company', { p_name: name }); if (error) throw error; await afterSignIn(); return data; }
  function switchCompany(id) { companyId = id; DB.set('ct-company', id); pull().then(push); App.go('projects'); }

  // ---------- sync ----------
  const hash = p => { const s = JSON.stringify(p); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + ':' + s.length; };
  const syncable = p => !p.sample && (!p.companyId || p.companyId === companyId);
  function schedulePush() { if (!signedIn() || !companyId) return; clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); }
  async function push() {
    if (!signedIn() || !companyId || pushing) return; pushing = true;
    const S = App.state();
    try {
      const dirty = S.projects.filter(p => syncable(p) && hash(p) !== sync.synced[p.id]);
      if (dirty.length || sync.deleted.length) setStatus('syncing');
      for (const p of dirty) {
        p.companyId = companyId;
        // Hash and snapshot before the network call: if the user edits the
        // project while the upsert is in flight, the edit stays dirty and goes
        // up on the next push instead of being marked synced by mistake.
        const h = hash(p), snapshot = JSON.parse(JSON.stringify(p));
        const { error } = await sb.from('ct_projects').upsert({ id: p.id, company_id: companyId, name: snapshot.name || null, data: snapshot, updated_at: new Date().toISOString(), updated_by: user.id, deleted_at: null });
        if (error) throw error;
        sync.synced[p.id] = h; saveSync();
      }
      if (dirty.length) DB.save(S);
      for (const id of sync.deleted.slice()) { const { error } = await sb.from('ct_projects').update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id); if (error && !/0 rows/.test(error.message)) throw error; sync.deleted = sync.deleted.filter(x => x !== id); saveSync(); }
      await uploadPhotos(S);
      setStatus('synced', 'Saved to the cloud ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    } catch (e) { console.warn('push', e); setStatus('error', navigator.onLine ? (e.message || 'Could not save to the cloud') : 'Offline. Will save when back online.'); }
    finally { pushing = false; }
    // Anything edited while we were pushing goes up on the next tick.
    if (signedIn() && companyId && (App.state().projects.some(p => syncable(p) && hash(p) !== sync.synced[p.id]) || sync.deleted.length)) schedulePush();
  }
  async function uploadPhotos(S) {
    const ids = []; S.projects.filter(syncable).forEach(p => p.entries.forEach(e => e.photos.forEach(ph => { if (ph.id && !sync.uploaded[ph.id]) ids.push(ph.id); })));
    for (const id of ids) {
      const rec = await DB.getPhoto(id); if (!rec) { sync.uploaded[id] = true; continue; }
      const asBlob = v => v instanceof Blob ? v : new Blob([v], { type: 'image/jpeg' });
      for (const [kind, blob] of [['thumb', asBlob(rec.thumb)], ['full', asBlob(rec.full)]]) {
        const { error } = await sb.storage.from(BUCKET).upload(`${companyId}/${id}-${kind}.jpg`, blob, { upsert: true, contentType: 'image/jpeg' });
        if (error && !/already exists/i.test(error.message)) throw error;
      }
      sync.uploaded[id] = true; saveSync();
    }
  }
  async function pull() {
    if (!signedIn() || !companyId || pulling) return; pulling = true;
    const S = App.state();
    try {
      const { data: rows, error } = await sb.from('ct_projects').select('id, data, updated_at, deleted_at').eq('company_id', companyId);
      if (error) throw error;
      let changed = false;
      for (const r of rows || []) {
        const local = S.projects.find(p => p.id === r.id);
        const localClean = local && sync.synced[r.id] === hash(local);
        if (r.deleted_at) { if (local && localClean) { S.projects = S.projects.filter(p => p.id !== r.id); delete sync.synced[r.id]; changed = true; } continue; }
        const remote = Object.assign({}, r.data, { id: r.id, companyId }); const rh = hash(remote);
        if (!local) { S.projects.push(remote); sync.synced[r.id] = rh; changed = true; }
        else if (localClean && rh !== sync.synced[r.id]) { Object.keys(local).forEach(k => delete local[k]); Object.assign(local, remote); sync.synced[r.id] = rh; changed = true; }
      }
      if (changed) { if (!S.projects.some(p => p.id === S.cur)) S.cur = S.projects[0] ? S.projects[0].id : null; DB.save(S); saveSync(); App.refreshAfterSync(); }
      setStatus('synced', 'Up to date');
    } catch (e) { console.warn('pull', e); setStatus('error', navigator.onLine ? (e.message || 'Could not load from the cloud') : 'Offline'); }
    finally { pulling = false; }
  }
  function deleteProject(id) { if (!signedIn() || !companyId) return; if (!sync.deleted.includes(id)) sync.deleted.push(id); delete sync.synced[id]; saveSync(); schedulePush(); }
  async function fetchPhoto(id) {
    if (!signedIn() || !companyId) return null;
    try {
      const get = async kind => { const { data, error } = await sb.storage.from(BUCKET).download(`${companyId}/${id}-${kind}.jpg`); if (error) throw error; return data; };
      const [thumb, full] = await Promise.all([get('thumb'), get('full')]);
      await DB.putPhoto({ id, thumb: await thumb.arrayBuffer(), full: await full.arrayBuffer(), w: 0, h: 0, added: Date.now() });
      sync.uploaded[id] = true; saveSync();
      return { thumb, full };
    } catch (e) { return null; }
  }

  // ---------- status button ----------
  function paintStatus() {
    const b = $('cloudBtn'); if (!b) return;
    b.style.display = enabled() ? '' : 'none';
    const dot = { off: '', out: '#b8b6ad', syncing: 'var(--yellow)', synced: 'var(--green)', error: 'var(--red)' }[status] || '';
    b.innerHTML = ic('cloud', 18) + (dot ? `<i class="dot" style="background:${dot}"></i>` : '');
    b.title = status === 'out' ? 'Sign in to save to the cloud' : detail;
    const el = $('accountStatus'); if (el) el.textContent = detail || (status === 'out' ? 'Not signed in' : '');
  }
  function onStatusTap() { App.go(signedIn() ? 'account' : 'signin'); }

  // ---------- screens ----------
  const shell = (title, sub, inner) => `<div class="auth"><div class="mark big">CT</div><h2>${esc(title)}</h2>${sub ? `<p class="hint" style="margin:0 0 14px">${sub}</p>` : ''}${inner}</div>`;
  const err = id => `<p class="hint err" id="${id}"></p>`;
  const showErr = (id, m) => { const e = $(id); if (e) e.textContent = m || ''; };
  const busy = (btn, on, label) => { if (!btn) return; btn.disabled = on; if (label) btn.textContent = label; };

  function render(s) {
    const body = $('cloudBody_' + s); if (!body) return;
    if (!enabled()) { body.innerHTML = shell('Cloud unavailable', 'Could not load the sign-in library. Check your connection and reload.', `<button class="btn q" onclick="App.go('projects')">Back</button>`); return; }
    if (s === 'signin') body.innerHTML = shell('Sign in to CostTooling', 'Your jobs and photos save to the cloud and follow you to any device.', `
      <div class="card"><label>Email</label><input class="in" id="siEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com">
      <label>Password</label><input class="in" id="siPwd" type="password" autocomplete="current-password">
      ${err('siErr')}
      <button class="btn" id="siBtn" onclick="Cloud.ui.signIn()">${ic('check')}Sign in</button>
      <button class="btn q" id="siLink" style="margin-top:8px" onclick="Cloud.ui.magic()">${ic('mail')}Email me a sign-in link</button>
      <div class="row" style="border:0;padding:12px 0 0;font-size:13px"><a class="lnk" onclick="App.go('forgot')">Forgot password?</a><a class="lnk" onclick="App.go('join')">Have an invite code?</a></div></div>
      <p class="hint" style="text-align:center">Not ready? <a class="lnk" onclick="App.go('projects')">Keep working on this phone only</a></p>`);
    else if (s === 'join') body.innerHTML = shell('Join your company', 'You need a code from whoever runs your company in CostTooling.', `
      <div class="card"><label>Invite code</label><input class="in code" id="jnCode" placeholder="ABCD-1234" autocapitalize="characters" autocorrect="off" spellcheck="false" oninput="Cloud.ui.codeInput(this)">
      <p class="hint ok" id="jnCheck"></p>${err('jnErr')}
      <label>Email</label><input class="in" id="jnEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com">
      <button class="btn" id="jnBtn" onclick="Cloud.ui.join()" disabled>${ic('check')}Continue</button>
      <p class="hint" style="margin-top:10px">We'll email you a link to finish and choose a password.</p></div>
      <p class="hint" style="text-align:center"><a class="lnk" onclick="App.go('signin')">Already have an account? Sign in</a></p>`);
    else if (s === 'forgot') body.innerHTML = shell('Reset your password', "We'll email you a link.", `
      <div class="card"><label>Email</label><input class="in" id="fpEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com">${err('fpErr')}
      <button class="btn" id="fpBtn" onclick="Cloud.ui.forgot()">${ic('send')}Send reset link</button></div>
      <p class="hint" style="text-align:center"><a class="lnk" onclick="App.go('signin')">Back to sign in</a></p>`);
    else if (s === 'setpass') { const forced = profile && profile.must_change_password; body.innerHTML = shell('Choose a password', forced ? 'You signed in with a temporary password or link. Pick your own to continue.' : 'At least 10 characters. A short phrase works well.', `
      <div class="card"><label>New password</label><input class="in" id="spPwd" type="password" autocomplete="new-password"><label>Confirm</label><input class="in" id="spPwd2" type="password" autocomplete="new-password">${err('spErr')}
      <button class="btn" id="spBtn" onclick="Cloud.ui.setPassword()">${ic('check')}Save and continue</button>
      ${forced ? '' : `<button class="btn q" style="margin-top:8px" onclick="Cloud.ui.skipPassword()">Skip for now</button>`}</div>`); }
    else if (s === 'company') body.innerHTML = shell('Your company', 'Jobs belong to a company so your team can share them.', `
      <div class="card"><h3>Start a company</h3><label>Company name</label><input class="in" id="coName" placeholder="e.g. Hernandez Builders">${err('coErr')}<button class="btn" id="coBtn" onclick="Cloud.ui.createCompany()">${ic('plus')}Create company</button></div>
      <div class="card"><h3>Or join one</h3><p class="hint" style="margin:0 0 10px">Got an invite code from your company? Use it to join.</p><button class="btn q" onclick="App.go('join')">${ic('key')}Join with a code</button></div>
      <p class="hint" style="text-align:center"><a class="lnk" onclick="Cloud.ui.signOut()">Sign out</a></p>`);
    else if (s === 'account') { const co = company(); body.innerHTML = `
      <div class="card"><div class="row" style="border:0;padding:0"><div class="l"><b>${esc((profile && profile.full_name) || (user && user.email) || '')}</b><small>${esc((user && user.email) || '')}</small></div><span class="chip ${status === 'synced' ? 'g' : status === 'error' ? 'r' : ''}">${status === 'syncing' ? 'syncing' : status === 'synced' ? 'synced' : status === 'error' ? 'problem' : 'signed in'}</span></div>
        <p class="hint" id="accountStatus" style="margin:6px 0 0">${esc(detail)}</p></div>
      <div class="card"><h3>Company</h3>${memberships.length ? memberships.map(m => `<div class="row tap" onclick="Cloud.ui.switchCompany('${m.company_id}')"><div class="l"><b>${esc(m.name)}</b><small>${m.role === 'admin' ? 'admin' : 'member'}</small></div>${m.company_id === companyId ? '<span class="chip g">current</span>' : ''}</div>`).join('') : '<p class="hint" style="margin:0">No company yet.</p>'}
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">${co && isAdmin() ? `<button class="btn sm" onclick="App.go('team')">${ic('users')}Team</button>` : ''}<button class="btn q sm" onclick="App.go('company')">${ic('plus')}New or join</button></div></div>
      <div class="card"><h3>Your name</h3><div style="display:flex;gap:8px"><input class="in" id="acName" value="${esc((profile && profile.full_name) || '')}" placeholder="Shown to your team"><button class="btn sm" onclick="Cloud.ui.saveName()">Save</button></div></div>
      <div class="actions"><button class="btn q" onclick="Cloud.ui.syncNow()">${ic('refresh')}Sync now</button><button class="btn q" onclick="App.go('setpass')">${ic('key')}Change password</button></div>
      <button class="btn danger" onclick="Cloud.ui.signOut()">${ic('logout')}Sign out</button>
      <p class="hint">Signing out keeps a copy of your jobs on this phone.</p>`; }
    else if (s === 'team') renderTeam(body);
  }

  async function renderTeam(body, msg = '') {
    const co = company(); if (!co || !isAdmin()) { body.innerHTML = `<div class="empty">${ic('users', 36)}Only company admins can manage the team.</div>`; return; }
    body.innerHTML = `<div class="card"><h3>${esc(co.name)} <small>loading…</small></h3></div>`;
    const [{ data: members, error: mErr }, { data: invites }, { data: jc }] = await Promise.all([
      sb.rpc('ct_list_members', { c_id: companyId }),
      sb.from('ct_invitations').select('id, email, role, code, expires_at').eq('company_id', companyId).is('accepted_at', null).order('created_at', { ascending: false }),
      sb.from('ct_join_codes').select('id, code, role, max_uses, uses, expires_at').eq('company_id', companyId).is('revoked_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (mErr) { body.innerHTML = `<div class="card"><p class="hint err">${esc(mErr.message)}</p></div>`; return; }
    const me = user.id; const now = Date.now();
    const roleChip = m => m.deactivated_at ? '<span class="chip">inactive</span>' : m.role === 'admin' ? '<span class="chip k">admin</span>' : '<span class="chip">member</span>';
    body.innerHTML = `
      <div class="card"><h3>Members <small>${(members || []).filter(m => !m.deactivated_at).length} active</small></h3>
        ${(members || []).map(m => `<div class="row" style="align-items:flex-start;flex-wrap:wrap"><div class="l" style="flex:1 1 60%"><b>${esc(m.full_name || m.email || m.user_id)}${m.user_id === me ? ' (you)' : ''}</b><small>${esc(m.email || '')}${m.deactivated_at ? ' · deactivated' : m.accepted_at ? ' · joined ' + Data.md(m.accepted_at.slice(0, 10)) : ' · invited'}${m.must_change_password ? ' · must set a password' : ''}</small></div>${roleChip(m)}
          ${m.user_id !== me ? `<div class="teamActions" style="flex-basis:100%;display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${m.deactivated_at ? `<button class="btn q sm" onclick="Cloud.ui.setActive('${m.user_id}', true)">Reactivate</button>` : `<button class="btn q sm" onclick="Cloud.ui.reset('${m.user_id}','magic_link',this)">Sign-in link</button><button class="btn q sm" onclick="Cloud.ui.reset('${m.user_id}','temp_password',this)">Temporary password</button><button class="btn q sm" onclick="Cloud.ui.setRole('${m.user_id}','${m.role === 'admin' ? 'member' : 'admin'}')">${m.role === 'admin' ? 'Make member' : 'Make admin'}</button><button class="btn danger sm" onclick="Cloud.ui.setActive('${m.user_id}', false)">Deactivate</button>`}
          </div><div class="hint" id="reset_${m.user_id}" style="flex-basis:100%"></div>` : ''}</div>`).join('') || '<p class="hint" style="margin:0">Just you so far.</p>'}</div>
      <div class="card"><h3>Invite someone</h3><p class="hint" style="margin:0 0 8px">With an email we send the invite. Leave it blank for a one-time code to read out.</p>
        <input class="in" id="tmEmail" type="email" placeholder="person@example.com (optional)"><div class="in2" style="margin-top:8px"><select class="in" id="tmRole"><option value="member">Member</option><option value="admin">Admin</option></select><button class="btn" id="tmBtn" onclick="Cloud.ui.invite()">${ic('send')}Invite</button></div><p class="hint" id="tmMsg">${msg}</p></div>
      ${(invites || []).length ? `<div class="card"><h3>Pending invites</h3>${invites.map(i => `<div class="row"><div class="l"><b>${esc(i.email || 'Code only')}</b><small>${i.role} · ${new Date(i.expires_at).getTime() < now ? 'expired' : 'expires ' + Data.md(i.expires_at.slice(0, 10))}</small></div>${i.code ? `<span class="chip" style="font-family:var(--mono,monospace)">${i.code}</span>` : ''}<button class="del" aria-label="Revoke" onclick="Cloud.ui.revoke('${i.id}')">${ic('x', 16)}</button></div>`).join('')}</div>` : ''}
      <div class="card"><h3>Team join code <small>up to 25 people, 30 days</small></h3>
        ${jc ? `<div class="codebox">${esc(jc.code)}</div><p class="hint" style="margin:0 0 8px">Joins as ${jc.role} · ${Math.max(0, jc.max_uses - jc.uses)} of ${jc.max_uses} uses left · ${new Date(jc.expires_at).getTime() < now ? 'expired' : 'expires ' + Data.md(jc.expires_at.slice(0, 10))}</p>` : '<p class="hint" style="margin:0 0 8px">No active code.</p>'}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn q sm" onclick="Cloud.ui.rotateJoin()">${jc ? 'Regenerate' : 'Create join code'}</button>${jc ? `<button class="btn danger sm" onclick="Cloud.ui.stopJoin('${jc.id}')">Stop</button>` : ''}</div>
        <p class="hint">People use codes at costtooling.com → Have an invite code. Regenerating stops the old code at once.</p></div>`;
  }

  // ---------- UI handlers ----------
  const ui = {
    async signIn() { const b = $('siBtn'); showErr('siErr'); busy(b, true, 'Signing in…'); try { await signInPassword($('siEmail').value.trim().toLowerCase(), $('siPwd').value); } catch (e) { showErr('siErr', e.message); } finally { busy(b, false, 'Sign in'); } },
    async magic() { const b = $('siLink'); const email = $('siEmail').value.trim().toLowerCase(); if (!email) return showErr('siErr', 'Enter your email first.'); showErr('siErr'); busy(b, true, 'Sending…'); try { await sendMagicLink(email); App.toast('Check your email for the link'); } catch (e) { showErr('siErr', e.message); } finally { busy(b, false, 'Email me a sign-in link'); } },
    async forgot() { const b = $('fpBtn'); const email = $('fpEmail').value.trim().toLowerCase(); if (!email) return showErr('fpErr', 'Enter your email.'); busy(b, true, 'Sending…'); try { await forgot(email); $('cloudBody_forgot').innerHTML = shell('Check your email', `If there is an account for <b>${esc(email)}</b>, a reset link is on its way. It works for one hour.`, `<button class="btn q" onclick="App.go('signin')">Back to sign in</button>`); } catch (e) { showErr('fpErr', e.message); busy(b, false, 'Send reset link'); } },
    async setPassword() { const b = $('spBtn'); const p1 = $('spPwd').value, p2 = $('spPwd2').value; if (p1.length < 10) return showErr('spErr', 'Use at least 10 characters.'); if (p1 !== p2) return showErr('spErr', 'Passwords do not match.'); busy(b, true, 'Saving…'); try { await setPassword(p1); App.toast('Password saved'); if (!companyId) App.go('company'); else { await pull(); App.go('projects'); } } catch (e) { showErr('spErr', e.message); busy(b, false, 'Save and continue'); } },
    skipPassword() { if (!companyId) App.go('company'); else App.go('projects'); },
    codeInput(el) { const v = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.+)$/, '$1-$2').slice(0, 9); el.value = v; $('jnCheck').textContent = ''; showErr('jnErr'); $('jnBtn').disabled = true; clearTimeout(ui._t); if (v.length < 9) return; ui._t = setTimeout(async () => { try { const r = await checkCode(v); if (r.ok) { $('jnCheck').textContent = `You'll join ${r.name} as ${r.role === 'admin' ? 'an admin' : 'a member'}.`; $('jnBtn').disabled = false; } else showErr('jnErr', REASONS[r.reason] || 'That code is not valid.'); } catch (e) { showErr('jnErr', e.message); } }, 350); },
    async join() { const b = $('jnBtn'); const code = $('jnCode').value, email = $('jnEmail').value.trim().toLowerCase(); if (!email) return showErr('jnErr', 'Enter your email.'); busy(b, true, 'Joining…'); try { const r = await joinWithCode(code, email); if (!r.ok) throw new Error(REASONS[r.reason] || 'Could not join.'); if (r.existing) { if (signedIn()) { await afterSignIn(); App.toast(`You're in ${r.name}`); App.go('projects'); } else { $('cloudBody_join').innerHTML = shell("You're in", `Your account now belongs to <b>${esc(r.name)}</b>. Sign in to continue.`, `<button class="btn" onclick="App.go('signin')">${ic('check')}Sign in</button>`); } } else { $('cloudBody_join').innerHTML = shell('Check your email', `We sent a link to <b>${esc(email)}</b>. Tap it to finish joining <b>${esc(r.name)}</b> and choose a password.`, `<p class="hint">Nothing after a few minutes? Check spam, or ask for the invite to be sent again.</p>`); } } catch (e) { showErr('jnErr', e.message); busy(b, false, 'Continue'); } },
    async createCompany() { const b = $('coBtn'); const name = $('coName').value.trim(); if (!name) return showErr('coErr', 'Give the company a name.'); busy(b, true, 'Creating…'); try { await createCompany(name); App.toast('Company created'); App.go('projects'); } catch (e) { showErr('coErr', e.message); busy(b, false, 'Create company'); } },
    switchCompany(id) { if (id !== companyId) switchCompany(id); },
    async saveName() { const name = $('acName').value.trim(); const { error } = await sb.from('profiles').update({ full_name: name }).eq('id', user.id); if (error) return App.toast(error.message); if (profile) profile.full_name = name; App.toast('Saved'); },
    async syncNow() { App.toast('Syncing…'); await pull(); await push(); App.toast(status === 'error' ? detail : 'Up to date'); render('account'); },
    signOut() { App.confirm('Sign out?', 'Your jobs stay on this phone. Sign back in any time to keep syncing.', () => signOut()); },
    async invite() { const b = $('tmBtn'); const email = $('tmEmail').value.trim().toLowerCase(), role = $('tmRole').value; busy(b, true, 'Working…'); try { let msg; if (email) { const r = await fn('invite-user', { email, company_id: companyId, role }); msg = `Invited ${esc(email)}.${r.code ? ` If the email doesn't arrive, give them code <b style="font-family:var(--mono,monospace)">${esc(r.code)}</b>.` : ''}`; } else { const { data, error } = await sb.rpc('ct_create_invite_code', { c_id: companyId, p_role: role, p_email: null }); if (error) throw error; const row = Array.isArray(data) ? data[0] : data; msg = `Code <b style="font-family:var(--mono,monospace)">${esc(row.code)}</b> created. Anyone with it can join once; it expires in 7 days.`; } $('tmEmail').value = ''; await renderTeam($('cloudBody_team'), msg); } catch (e) { $('tmMsg').textContent = e.message; } finally { busy(b, false, 'Invite'); } },
    async revoke(id) { await sb.from('ct_invitations').delete().eq('id', id); renderTeam($('cloudBody_team')); },
    async rotateJoin() { const { error } = await sb.rpc('ct_rotate_join_code', { c_id: companyId, p_role: 'member', p_max_uses: 25, p_days: 30 }); if (error) return App.toast(error.message); renderTeam($('cloudBody_team')); },
    async stopJoin(id) { await sb.from('ct_join_codes').update({ revoked_at: new Date().toISOString() }).eq('id', id); renderTeam($('cloudBody_team')); },
    async setRole(userId, role) { const { error } = await sb.from('ct_company_members').update({ role }).eq('company_id', companyId).eq('user_id', userId); if (error) return App.toast(error.message); renderTeam($('cloudBody_team')); },
    setActive(userId, active) { const go = async () => { const { error } = await sb.from('ct_company_members').update({ deactivated_at: active ? null : new Date().toISOString() }).eq('company_id', companyId).eq('user_id', userId); if (error) return App.toast(error.message); renderTeam($('cloudBody_team')); }; if (active) go(); else App.confirm('Deactivate this member?', 'They lose access to the company. Their jobs and photos stay.', go); },
    async reset(userId, method, btn) { const out = $('reset_' + userId); busy(btn, true); try { const r = await fn('admin-reset', { user_id: userId, company_id: companyId, method }); if (method === 'magic_link') out.innerHTML = `Text or read this to them (works once, 60 min): <span style="word-break:break-all;font-family:var(--mono,monospace)">${esc(r.link)}</span> <a class="lnk" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(r.link)}').then(()=>App.toast('Copied'))">Copy</a>`; else out.innerHTML = `Temporary password: <b style="font-family:var(--mono,monospace)">${esc(r.password)}</b>. Works for one sign-in, then they choose their own.`; } catch (e) { out.textContent = e.message; } finally { busy(btn, false); } },
  };

  // Projects-screen card when signed out.
  function promoHtml() {
    if (!enabled()) return '';
    if (signedIn()) return companyId ? '' : `<div class="card" id="cloudPromo" style="border-color:var(--yellow)"><h3>Finish setting up</h3><p class="hint" style="margin:0 0 10px">Your jobs aren't saving to the cloud yet. Start a company or join one with a code.</p><button class="btn sm" onclick="App.go('company')">${ic('users')}Set up my company</button></div>`;
    return `<div class="card" id="cloudPromo" style="border-color:var(--yellow)"><h3>Save your jobs to the cloud</h3><p class="hint" style="margin:0 0 10px">Sign in and every job and photo follows you to any phone, and your team can see them too.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="App.go('signin')">${ic('cloud')}Sign in</button><button class="btn q sm" onclick="App.go('join')">${ic('key')}I have a code</button></div></div>`;
  }

  return { init, render, ui, SCREENS, promoHtml, schedulePush, push, pull, deleteProject, fetchPhoto, onStatusTap, paintStatus, signedIn, enabled, state: () => ({ status, detail, companyId, memberships, user }) };
})();

window.Cloud = Cloud;
