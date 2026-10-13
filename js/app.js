/* App — state, navigation, and every action the screens call. */
const App = (() => {
  const FEEDBACK_EMAIL = 'will@clickplumbing.com';
  const $ = id => document.getElementById(id);
  const Q = new URLSearchParams(location.search);
  let S = DB.load();
  if (!S || !Array.isArray(S.projects)) S = { projects: [Data.sampleProject()], cur: 'sample' };
  S.projects.forEach(p => { p.cover ||= { picked: [], layout: 'hero', head: '', note: '', numMode: 'auto', manual: {} }; p.cover.manual ||= {}; p.items ||= []; p.entries ||= []; });
  const save = () => { const ok = DB.save(S); if (!ok) toast('Could not save: storage is full'); return ok; };
  const P = () => S.projects.find(p => p.id === S.cur) || S.projects[0];
  let cur = 'projects', mode = 'items', logFilter = 'all', form = null, tpl = 'remodel', editProj = null, editItem = null, photoCtx = { entryId: null, idx: 0 }, shareKind = 'report';
  const pendingMap = {};
  let importing = 0;
  // ---------- session (draft + screen) persistence: iOS reloads the tab after the camera ----------
  const persistSession = () => DB.set('ct-session', { cur, form, editProj, editItem, photoCtx, mode, logFilter, at: Date.now() });
  window.addEventListener('pagehide', persistSession); document.addEventListener('visibilitychange', () => { if (document.hidden) persistSession(); });

  // ---------- navigation ----------
  const PARENT = { projects: null, projform: 'projects', home: 'projects', log: 'home', entryform: 'log', photo: 'log', cover: 'home', sov: 'home', item: 'sov', itemform: 'sov', report: 'home' };
  const TABOF = { log: 'log', entryform: 'log', photo: 'log', cover: 'cover', sov: 'sov', item: 'sov', itemform: 'sov', report: 'report', home: 'home' };
  const SCREEN_NAMES = { projects: 'Projects', projform: 'Project form', home: 'Project home', log: 'Site log', entryform: 'New entry', photo: 'Photo', cover: 'Cover page', sov: 'Progress', item: 'Line item', itemform: 'Line item form', report: 'Report' };
  function titles(s) { const p = P(); const sub = p ? (p.name || 'Untitled project') : ''; return { projects: ['Projects', 'CostTooling'], projform: [editProj && editProj.id ? 'Edit project' : 'New project', editProj && editProj.id ? sub : 'Set up in a minute'], home: [sub, [p && p.client, p && p.finish && 'due ' + Data.md(p.finish)].filter(Boolean).join(' · ') || 'Project'], log: ['Site log', sub], entryform: [form && form.id ? 'Edit entry' : 'New entry', sub], photo: ['Photo', sub], cover: ['Cover page', sub], sov: ['Progress', sub], item: ['Line item', sub], itemform: [editItem && editItem.id ? 'Edit line item' : 'New line item', sub], report: ['Report', sub] }[s]; }
  const TOPACT = { log: ['plus', () => newEntry()], sov: ['plus', () => newItem()], home: ['edit', () => editProject()], item: ['edit', () => editItemForm()], report: ['share', () => openShare('report')], cover: ['share', () => openShare('cover')] };
  function render(s) {
    const t0 = performance.now(); try { renderInner(s); } finally { lastRender = Math.round(performance.now() - t0); if (lastRender > 50) logLine('slow render ' + s + ' ' + lastRender + 'ms'); }
  }
  function renderInner(s) {
    const p = P(), k = p ? Data.calc(p) : null;
    if (s === 'projects') UI.projects(S);
    else if (s === 'projform') UI.projform(editProj || {}, tpl);
    else if (s === 'home') UI.home(p, k);
    else if (s === 'log') UI.log(p, logFilter);
    else if (s === 'entryform') UI.entryform(p, form);
    else if (s === 'photo') { const e = p.entries.find(x => x.id === photoCtx.entryId); if (!e) return go('log'); UI.photo(p, e, Math.min(photoCtx.idx, Math.max(0, e.photos.length - 1))); }
    else if (s === 'cover') { const sel = UI.cover(p, k); Render.cover($('cover'), p, k, sel); }
    else if (s === 'sov') UI.sov(p, k, mode);
    else if (s === 'item') { const i = p.items.find(x => x.id === photoCtx.itemId); if (!i) return go('sov'); UI.item(p, i); }
    else if (s === 'itemform') UI.itemform(p, editItem || {});
    else if (s === 'report') { UI.report(p, k); buildReport(); }
  }
  function go(s) {
    if (s !== 'projects' && !P()) s = 'projects';
    cur = s; render(s);
    document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.dataset.s === s));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === TABOF[s]));
    $('tabs').classList.toggle('hide', s === 'projects' || s === 'projform');
    $('fab').classList.toggle('hide', s === 'entryform' || s === 'itemform' || s === 'projform');
    const t = titles(s); $('ttl').textContent = t[0]; $('sub').textContent = t[1];
    $('back').classList.toggle('show', s !== 'projects'); $('mark').style.display = s === 'projects' ? '' : 'none';
    const ta = TOPACT[s]; $('topAct').style.display = ta ? '' : 'none'; if (ta) { $('topAct').innerHTML = UI.ic(ta[0], 18); $('topAct').onclick = ta[1]; }
    document.querySelector('.screen.on').scrollTop = 0; closeSheet(); persistSession();
  }
  const refresh = () => render(cur);
  $('back').onclick = () => { if (cur === 'entryform') return cancelEntry(); go(PARENT[cur] || 'projects'); };

  // ---------- projects ----------
  function openProject(id) { S.cur = id; save(); go('home'); }
  function newProject() { editProj = { start: Data.iso(Data.today()), finish: Data.iso(Data.addDays(Data.today(), 60)) }; tpl = 'remodel'; go('projform'); }
  function editProject() { editProj = Object.assign({}, P()); go('projform'); }
  function pickTemplate(k) { tpl = k; document.querySelectorAll('.tpl div').forEach(d => d.classList.toggle('on', d.textContent.startsWith(Data.TEMPLATES[k].name))); }
  function saveProject() {
    const v = id => ($(id) || {}).value || '';
    const name = v('pfName').trim(); if (!name) { $('pfName').focus(); return toast('Give the project a name'); }
    if (editProj.id) { const p = P(); Object.assign(p, { name, client: v('pfClient').trim(), addr: v('pfAddr').trim(), start: v('pfStart'), finish: v('pfFinish') }); save(); toast('Saved'); return go('home'); }
    const p = { id: Data.uid('pr'), name, client: v('pfClient').trim(), addr: v('pfAddr').trim(), start: v('pfStart'), finish: v('pfFinish'), items: Data.itemsFromTemplate(tpl, v('pfStart'), v('pfFinish'), +v('pfContract') || 0), entries: [], cover: { picked: [], layout: 'hero', head: '', note: '', numMode: 'auto', manual: {} } };
    S.projects.unshift(p); S.cur = p.id; save(); toast('Project created'); go('home');
  }
  function deleteProject() { const p = P(); confirm('Delete this project?', `"${p.name}" and its ${p.entries.length} log entr${p.entries.length === 1 ? 'y' : 'ies'} will be removed from this phone.`, async () => { for (const e of p.entries) for (const ph of e.photos) if (ph.id) await Photos.remove(ph.id); S.projects = S.projects.filter(x => x.id !== p.id); S.cur = S.projects[0] ? S.projects[0].id : null; save(); toast('Project deleted'); go('projects'); }); }
  function restoreSample() { S.projects.push(Data.sampleProject()); save(); toast('Sample job is back'); refresh(); }

  // ---------- log entries ----------
  function newEntry() { form = { id: null, d: Data.iso(Data.today()), time: Data.nowTime(), itemId: '', wx: 'sun', temp: '', crew: '', note: '', photos: [], added: [] }; go('entryform'); }
  function editEntry(id) { const e = P().entries.find(x => x.id === id); if (!e) return; form = Object.assign({ added: [] }, JSON.parse(JSON.stringify(e))); go('entryform'); }
  function cam() { captureForm(); persistSession(); $('pendHint').textContent = 'Preparing…'; $('fileCam').click(); } function gal() { captureForm(); persistSession(); $('pendHint').textContent = 'Preparing…'; $('fileGal').click(); }
  async function filesPicked(input) {
    const files = [...input.files]; input.value = ''; const hint = $('pendHint');
    if (!files.length) { if (hint) hint.textContent = 'Take a photo, or pick ones you were texted.'; return; }
    if (!form) form = { id: null, d: Data.iso(Data.today()), time: Data.nowTime(), itemId: '', wx: 'sun', temp: '', crew: '', note: '', photos: [], added: [] };
    importing += files.length; setFormBusy(true); let n = 0;
    for (const f of files) {
      n++; if (hint) hint.textContent = 'Importing ' + n + ' of ' + files.length + '…';
      await new Promise(r => setTimeout(r, 0)); // one photo per macrotask so the UI breathes and memory frees
      try { const id = await Photos.importFile(f); if (!form) break; form.photos.push({ id }); form.added.push(id); pendingMap[id] = { id }; UI.entryPhotos(P(), form); persistSession(); }
      catch (e) { console.warn(e); logLine('import: ' + (e && e.message)); toast("Couldn't read that photo" + (e && /memory/i.test(e.message) ? ' (too large)' : '')); }
      importing--;
    }
    importing = Math.max(0, importing); setFormBusy(false); captureForm(); if (hint) hint.textContent = 'Take a photo, or pick ones you were texted.';
  }
  function setFormBusy(b) { document.querySelectorAll('#entryBody .btn').forEach(x => { x.disabled = b; }); }
  $('fileCam').onchange = e => filesPicked(e.target); $('fileGal').onchange = e => filesPicked(e.target);
  const pendingPhoto = key => pendingMap[key] || null;
  document.getElementById('entryBody').addEventListener('input', () => { captureForm(); clearTimeout(captureForm._t); captureForm._t = setTimeout(persistSession, 300); });
  function captureForm() { if (!form || cur !== 'entryform') return; const v = id => ($(id) || {}).value ?? ''; form.note = v('efNote'); form.itemId = v('efItem'); form.temp = v('efTemp'); form.crew = v('efCrew'); form.d = v('efDate') || form.d; }
  function setWx(w) { captureForm(); form.wx = form.wx === w ? '' : w; document.querySelectorAll('#efWx button').forEach((b, i) => b.classList.toggle('on', ['sun', 'cloud', 'rain', 'wind'][i] === form.wx)); }
  async function removeFormPhoto(i) { captureForm(); const ph = form.photos.splice(i, 1)[0]; if (ph && ph.id && form.added.includes(ph.id)) { await Photos.remove(ph.id); form.added = form.added.filter(x => x !== ph.id); } UI.entryPhotos(P(), form); }
  function saveEntry() {
    if (importing) return toast('Still importing photos…'); captureForm(); const p = P();
    if (!form.photos.length && !form.note.trim()) return toast('Add a photo or a note first');
    const rec = { id: form.id || Data.uid('e'), d: form.d, time: form.time || Data.nowTime(), ts: form.ts || Date.now(), itemId: form.itemId, wx: form.wx, temp: form.temp, crew: form.crew, note: form.note.trim(), photos: form.photos };
    const idx = p.entries.findIndex(x => x.id === rec.id); if (idx >= 0) p.entries[idx] = rec; else p.entries.push(rec);
    save(); const wasNew = !form.id; form = null; persistSession(); toast(wasNew ? 'Saved to the log' : 'Entry updated'); go('log');
  }
  async function cancelEntry() { if (importing) return toast('Still importing photos…'); if (form) for (const id of form.added) await Photos.remove(id); form = null; persistSession(); go(photoCtx.entryId && P().entries.some(e => e.id === photoCtx.entryId) ? 'photo' : 'log'); }
  function deleteEntry(id) { const p = P(), e = p.entries.find(x => x.id === id); if (!e) return; confirm('Delete this entry?', 'The photo' + (e.photos.length > 1 ? 's' : '') + ' and note will be removed from this phone.', async () => { for (const ph of e.photos) if (ph.id) await Photos.remove(ph.id); p.entries = p.entries.filter(x => x.id !== id); p.cover.picked = p.cover.picked.filter(k => !e.photos.some(ph => Data.photoKey(ph) === k)); save(); toast('Entry deleted'); go('log'); }); }
  function openPhoto(entryId, key) { const e = P().entries.find(x => x.id === entryId); if (!e) return; photoCtx.entryId = entryId; photoCtx.idx = Math.max(0, e.photos.findIndex(ph => Data.photoKey(ph) === key)); go('photo'); }
  function photoIdx(i) { photoCtx.idx = i; const e = P().entries.find(x => x.id === photoCtx.entryId); if (e) UI.photoSwap(P(), e, i); }
  function usePhotoOnCover() { const p = P(), e = p.entries.find(x => x.id === photoCtx.entryId); const key = Data.photoKey(e.photos[photoCtx.idx]); if (!p.cover.picked.includes(key)) p.cover.picked = [key, ...p.cover.picked].slice(0, 4); save(); go('cover'); toast('Added to the cover page'); }
  function filterLog(f) { logFilter = f; UI.applyLogFilter(f); }

  // ---------- cover ----------
  const drawCover = () => { const p = P(); return Render.cover($('cover'), p, Data.calc(p), UI.coverSelection(p)); };
  function coverPick(key) { const cv = P().cover; if (cv.picked.includes(key)) cv.picked = cv.picked.filter(k => k !== key); else if (cv.picked.length < 4) cv.picked.push(key); else cv.picked = [...cv.picked.slice(1), key]; save(); document.querySelectorAll('#coverGrid .ph').forEach(el => el.classList.toggle('sel', cv.picked.includes(el.dataset.ph))); drawCover(); }
  function coverLayout(l) { P().cover.layout = l; save(); document.querySelectorAll('#coverLayoutSeg button').forEach(b => b.classList.toggle('on', b.dataset.l === l)); drawCover(); }
  function coverNum(m) { P().cover.numMode = m; save(); UI.coverCtl(P().cover); drawCover(); }
  let coverTimer;
  function coverField(f, v) { P().cover[f] = v; save(); clearTimeout(coverTimer); coverTimer = setTimeout(drawCover, 250); }
  function coverManual(f, v) { P().cover.manual[f] = v; P().cover.numMode = 'manual'; coverField('numMode', 'manual'); }
  function shareResult(r, what) { if (r === 'shared') toast('Shared'); else if (r === 'downloaded') toast(what + ' saved'); else if (r === 'blocked') toast('Tap again to open the share sheet'); else if (r === 'empty') toast('Nothing to share yet'); }
  async function saveCover() { const b = Render.coverBlob(); if (b) return shareResult(await Render.shareBlob(b, 'costtooling-cover.jpg', 'Progress update'), 'Cover page'); toast('Finishing the cover…'); await Render.ready(); const b2 = Render.coverBlob(); if (b2) shareResult(await Render.shareBlob(b2, 'costtooling-cover.jpg', 'Progress update'), 'Cover page'); }
  let reportBlob = null, reportBuilding = null;
  function buildReport() { const p = P(), k = Data.calc(p); reportBlob = null; reportBuilding = Render.report($('reportCanvas'), p, k, UI.sortedEntries(p).flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 3)).then(() => Render.canvasBlob($('reportCanvas'))).then(b => { reportBlob = b; return b; }).catch(e => { console.warn('report', e); return null; }); return reportBuilding; }

  // ---------- line items ----------
  function setPct(id, v, commit) { const p = P(), i = p.items.find(x => x.id === id); if (!i) return; i.pct = +v; UI.itemSlider(i); if (cur === 'item') UI.itemKpis(i); if (commit) { save(); if (cur === 'sov') UI.sovSummary(p, Data.calc(p)); } }
  function quickPct(id, v) { setPct(id, v, true); }
  function setMode(m) { mode = m; const mi = $('modeItems'), mg = $('modeGantt'); if (mi && mg) { mi.style.display = m === 'items' ? '' : 'none'; mg.style.display = m === 'gantt' ? '' : 'none'; document.querySelectorAll('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); } }
  function openGantt() { mode = 'gantt'; go('sov'); }
  function openItem(id) { photoCtx.itemId = id; go('item'); }
  function newItem() { editItem = {}; go('itemform'); }
  function editItemForm() { editItem = Object.assign({}, P().items.find(x => x.id === photoCtx.itemId)); go('itemform'); }
  function saveItem() { const v = id => ($(id) || {}).value || ''; const n = v('ifName').trim(); if (!n) { $('ifName').focus(); return toast('Give the line item a name'); } const p = P(); if (editItem.id) { Object.assign(p.items.find(x => x.id === editItem.id), { n, b: +v('ifBudget') || 0, s: v('ifStart'), e: v('ifEnd') }); save(); toast('Saved'); return go('item'); } const i = { id: Data.uid('i'), n, b: +v('ifBudget') || 0, pct: 0, s: v('ifStart'), e: v('ifEnd'), costs: [] }; p.items.push(i); save(); toast('Line item added'); go('sov'); }
  function deleteItem(id) { const p = P(), i = p.items.find(x => x.id === id); confirm('Delete this line item?', `"${i.n}" and its logged costs will be removed. Photos tagged to it stay in the log.`, () => { p.items = p.items.filter(x => x.id !== id); p.entries.forEach(e => { if (e.itemId === id) e.itemId = ''; }); save(); toast('Line item deleted'); go('sov'); }); }
  function addCost(itemId) { const i = P().items.find(x => x.id === itemId); const desc = $('cfDesc').value.trim(), amt = +$('cfAmt').value; if (!desc || !amt) return toast('Add what it was and how much'); i.costs.push({ id: Data.uid('c'), desc, amt, date: $('cfDate').value }); save(); toast('Cost added'); UI.itemCosts(i); UI.itemKpis(i); UI.itemSlider(i); }
  function deleteCost(itemId, costId) { const i = P().items.find(x => x.id === itemId); const c = (i.costs || []).find(x => x.id === costId); if (!c) return; confirm('Remove this cost?', `"${c.desc}" for ${Data.fmt$(c.amt)} will be removed.`, () => { i.costs = i.costs.filter(x => x.id !== costId); save(); UI.itemCosts(i); UI.itemKpis(i); UI.itemSlider(i); toast('Cost removed'); }); }

  // ---------- sharing ----------
  function openShare(kind) { shareKind = kind; $('shareTitle').textContent = kind === 'cover' ? 'Share cover page' : 'Share report'; showSheet('shareSheet'); }
  async function shareDo(action, kind) {
    kind = kind || shareKind; closeSheet(); const p = P(), k = Data.calc(p);
    const name = kind === 'cover' ? 'costtooling-cover.jpg' : 'costtooling-report.jpg', title = kind === 'cover' ? 'Progress update' : 'Progress report', what = kind === 'cover' ? 'Cover page' : 'Report';
    const getBlob = () => kind === 'cover' ? Render.coverBlob() : reportBlob;
    if (action === 'share' || action === 'save') {
      let b = getBlob();
      if (!b) { toast('Building the ' + what.toLowerCase() + '…'); if (kind === 'cover') { await Render.ready(); } else { await (reportBuilding || buildReport()); } b = getBlob(); if (!b) return toast('Could not build the ' + what.toLowerCase()); }
      if (action === 'save' && !(navigator.canShare && navigator.canShare({ files: [new File([b], name, { type: 'image/jpeg' })] }))) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return toast(what + ' saved'); }
      return shareResult(await Render.shareBlob(b, name, title), what);
    }
    if (action === 'print') {
      let b = getBlob(); if (!b) { if (kind === 'cover') await Render.ready(); else await (reportBuilding || buildReport()); b = getBlob(); } if (!b) return toast('Nothing to print yet');
      const area = $('printArea'); const img = new Image(); img.src = URL.createObjectURL(b); area.innerHTML = ''; area.appendChild(img); area.hidden = false;
      const done = () => { area.hidden = true; URL.revokeObjectURL(img.src); area.innerHTML = ''; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done);
      try { await img.decode(); } catch (e) {} window.print(); setTimeout(done, 60000);
    }
    else if (action === 'mail') { const body = `${p.name}\nProgress ${Data.mdy(Data.iso(Data.today()))}\n\n${Math.round(k.pct * 100)}% complete · ${Data.fmt$(k.cost)} cost so far · ${Data.fmt$(k.toGo)} to finish · ${k.daysLeft} days left\n\n${p.items.map(i => `${i.n}: ${i.pct || 0}% of ${Data.fmt$(i.b)}, ${Data.fmt$(Data.itemCost(i))} spent`).join('\n')}\n\n${p.cover.note || ''}\n\n(Attach the saved image for the full page.)`; location.href = 'mailto:?subject=' + encodeURIComponent('Progress: ' + p.name) + '&body=' + encodeURIComponent(body); }
  }

  // ---------- sheets, toast, confirm ----------
  function showSheet(id) { closeSheet(); $('sheetBg').classList.add('show'); $(id).classList.add('show'); }
  function closeSheet() { $('sheetBg').classList.remove('show'); document.querySelectorAll('.sheet').forEach(s => s.classList.remove('show')); }
  function confirm(title, text, fn) { $('confirmTitle').textContent = title; $('confirmText').textContent = text; $('confirmBtn').onclick = () => { closeSheet(); fn(); }; showSheet('confirmSheet'); }
  let tt; function toast(m) { const t = $('toast'); t.innerHTML = UI.ic('check', 16) + '<span>' + UI.esc(m) + '</span>'; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800); }

  // ---------- ideas ----------
  let ideaImp = 'want';
  const ideas = () => DB.get('ct-ideas') || [];
  function renderIdeas() { const list = ideas(); $('fabN').textContent = list.length; $('fabN').classList.toggle('show', list.length > 0); $('ideaList').innerHTML = list.slice().reverse().map(i => `<div class="row"><div class="l"><b>${UI.esc(i.text)}</b><small>${UI.esc(i.screen)} · ${UI.esc(i.imp)} · ${UI.esc(i.when)}</small></div></div>`).join(''); }
  function openIdeas() { $('ideaScreen').textContent = SCREEN_NAMES[cur] || cur; renderIdeas(); showSheet('ideaSheet'); }
  function saveIdea() { const t = $('ideaText').value.trim(); if (!t) return $('ideaText').focus(); const list = ideas(); list.push({ text: t, screen: SCREEN_NAMES[cur] || cur, imp: { nice: 'nice to have', want: "I'd use this", must: 'must have' }[ideaImp], when: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }); DB.set('ct-ideas', list); $('ideaText').value = ''; renderIdeas(); toast('Saved. Keep going!'); }
  function sendIdeas() { const list = ideas(); if (!list.length) return toast('No ideas saved yet'); const who = Q.get('for') || DB.get('ct-for') || ''; const body = `Ideas for CostTooling${who ? ' from ' + who : ''}\n\n` + list.map((i, n) => `${n + 1}. [${i.screen} · ${i.imp}] ${i.text}`).join('\n') + `\n\n(sent from the app, ${/iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'desktop'})` + ((DB.get('ct-log') || []).length ? '\n\nDiagnostics:\n' + (DB.get('ct-log') || []).slice(-20).join('\n') : ''); location.href = 'mailto:' + FEEDBACK_EMAIL + '?subject=' + encodeURIComponent('CostTooling ideas' + (who ? ' from ' + who : '')) + '&body=' + encodeURIComponent(body); }
  $('ideaImp').onclick = e => { if (!e.target.dataset.i) return; ideaImp = e.target.dataset.i; [...$('ideaImp').children].forEach(b => b.classList.toggle('on', b === e.target)); };
  function openWelcome() { const who = Q.get('for') || DB.get('ct-for'); if (who) { DB.set('ct-for', who); $('welcomeTitle').textContent = 'Hi ' + who + ', welcome to CostTooling'; } showSheet('welcomeSheet'); DB.set('ct-welcomed', 1); }
  async function exportData() { closeSheet(); const name = 'costtooling-backup-' + Data.iso(Data.today()) + '.json'; const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }); const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'CostTooling backup' }); return toast('Backup shared (photos not included yet)'); } catch (e) { if (e.name === 'AbortError') return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); toast('Backup saved (photos not included yet)'); }
  function resetAll() { confirm('Start over?', 'This removes every project, photo and idea from this phone and brings back the sample job.', async () => { await DB.clearPhotos(); DB.del(DB.KEY); DB.del('ct-ideas'); location.href = location.pathname; }); }

  // ---------- diagnostics ----------
  const LOG = 'ct-log'; const logLine = m => { const l = DB.get(LOG) || []; l.push(new Date().toISOString().slice(11, 19) + ' ' + m); DB.set(LOG, l.slice(-50)); };
  window.addEventListener('error', e => { logLine('error: ' + (e.message || e.type) + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); toast('Something went wrong'); });
  window.addEventListener('unhandledrejection', e => { logLine('rejection: ' + (e.reason && (e.reason.message || e.reason))); toast('Something went wrong'); });
  document.addEventListener('touchstart', () => {}, { passive: true }); // lets iOS apply :active styles
  if (window.visualViewport) { const vv = window.visualViewport; const onVV = () => { const kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); document.documentElement.style.setProperty('--kb', kb + 'px'); if (kb === 0 && scrollY) window.scrollTo(0, 0); }; vv.addEventListener('resize', onVV); vv.addEventListener('scroll', onVV); }
  document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) window.scrollTo(0, 0); }, 50));
  const DEBUG = Q.get('debug');
  if (DEBUG) {
    const box = document.createElement('pre'); box.id = 'dbg'; box.style.cssText = 'position:fixed;left:4px;top:4px;z-index:9999;background:rgba(0,0,0,.75);color:#0f0;font:10px/1.3 Menlo,monospace;padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre;max-width:60vw;overflow:hidden';
    document.body.appendChild(box);
    const probe = document.createElement('div'); probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)'; document.body.appendChild(probe);
    const tick = () => { const vv = window.visualViewport; const app = document.querySelector('.app').getBoundingClientRect(); const cs = getComputedStyle(probe); const ae = document.activeElement; const log = DB.get(LOG) || [];
      box.textContent = [`inner ${innerWidth}x${innerHeight} vv ${vv ? Math.round(vv.width) + 'x' + Math.round(vv.height) + ' top' + Math.round(vv.offsetTop) : '-'}`, `html ${document.documentElement.clientHeight} scrollY ${Math.round(scrollY)}`, `app ${Math.round(app.top)}..${Math.round(app.bottom)} h${Math.round(app.height)}`, `safe t${cs.paddingTop} b${cs.paddingBottom}`, `focus ${ae && ae.tagName}${ae && ae.id ? '#' + ae.id : ''} screen ${cur}`, `render ${lastRender}ms`, ...log.slice(-3)].join('\n'); };
    setInterval(tick, 500);
  }
  let lastRender = 0;
  // ---------- boot ----------
  document.querySelectorAll('[data-ic]').forEach(e => { const w = document.createElement('span'); w.innerHTML = UI.ic(e.dataset.ic, +(e.dataset.size || 18)); e.replaceWith(w.firstChild); });
  const sess = Q.get('s') || Q.get('new') || Q.get('welcome') ? null : DB.get('ct-session');
  if (sess && sess.at && Date.now() - sess.at < 6 * 3600e3 && P()) {
    if (sess.photoCtx) photoCtx = Object.assign(photoCtx, sess.photoCtx); if (sess.mode) mode = sess.mode; if (sess.logFilter) logFilter = sess.logFilter;
    if (sess.form) { form = sess.form; form.added ||= []; form.photos ||= []; go('entryform'); toast('Picked up where you left off'); }
    else if (sess.editItem) { editItem = sess.editItem; go('itemform'); }
    else if (sess.editProj) { editProj = sess.editProj; go('projform'); }
    else if (sess.cur && PARENT.hasOwnProperty(sess.cur) && sess.cur !== 'entryform') go(sess.cur);
    else go('projects');
  } else { const s0 = Q.get('s'); go(s0 && PARENT.hasOwnProperty(s0) && s0 !== 'entryform' && s0 !== 'itemform' && s0 !== 'projform' ? s0 : 'projects'); }
  setTimeout(async () => { try { const ids = await Photos.listIds(); const used = new Set(); S.projects.forEach(p => p.entries.forEach(e => e.photos.forEach(ph => ph.id && used.add(ph.id)))); if (form) form.photos.forEach(ph => ph.id && used.add(ph.id)); const orphans = (ids || []).filter(id => !used.has(id)); for (const id of orphans) await Photos.remove(id); if (orphans.length) logLine('cleaned ' + orphans.length + ' orphan photo(s)'); } catch (e) { logLine('cleanup: ' + (e && e.message)); } }, 3000);
  if (Q.get('new')) newEntry(); if (Q.get('s') === 'projform') newProject(); if (Q.get('s') === 'itemform') newItem(); if (Q.get('m') === 'gantt') { setMode('gantt'); } if (Q.get('layout')) coverLayout(Q.get('layout'));
  renderIdeas(); if (!DB.get('ct-welcomed') || Q.get('welcome')) setTimeout(openWelcome, 400);
  if (Q.get('ideas')) setTimeout(openIdeas, 300); if (Q.get('sheet')) setTimeout(() => openShare(Q.get('sheet')), 300);
  if (Q.get('s') === 'photo' && P() && P().entries[0]) openPhoto(P().entries[0].id);
  if (Q.get('s') === 'item' && P() && P().items[2]) openItem(P().items[2].id);

  return { go, openGantt, quickPct, openProject, newProject, editProject, pickTemplate, saveProject, deleteProject, restoreSample, newEntry, editEntry, cam, gal, setWx, removeFormPhoto, saveEntry, cancelEntry, deleteEntry, openPhoto, photoIdx, usePhotoOnCover, filterLog, pendingPhoto, coverPick, coverLayout, coverNum, coverField, coverManual, saveCover, setPct, setMode, openItem, newItem, saveItem, deleteItem, addCost, deleteCost, openShare, shareDo, closeSheet, openIdeas, saveIdea, sendIdeas, openWelcome, exportData, resetAll, state: () => S, filesPicked };
})();
