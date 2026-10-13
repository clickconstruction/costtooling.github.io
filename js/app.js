/* App — state, navigation, and every action the screens call. */
const App = (() => {
  const FEEDBACK_EMAIL = 'will@clickplumbing.com';
  const $ = id => document.getElementById(id);
  const Q = new URLSearchParams(location.search);
  let S = DB.load();
  if (!S || !Array.isArray(S.projects)) S = { projects: [Data.sampleProject()], cur: 'sample' };
  S.projects.forEach(p => { p.cover ||= { picked: [], layout: 'hero', head: '', note: '', numMode: 'auto', manual: {} }; p.cover.manual ||= {}; p.items ||= []; p.entries ||= []; });
  const save = () => DB.save(S);
  const P = () => S.projects.find(p => p.id === S.cur) || S.projects[0];
  let cur = 'projects', mode = 'items', logFilter = 'all', form = null, tpl = 'remodel', editProj = null, editItem = null, photoCtx = { entryId: null, idx: 0 }, shareKind = 'report';
  const pendingMap = {};

  // ---------- navigation ----------
  const PARENT = { projects: null, projform: 'projects', home: 'projects', log: 'home', entryform: 'log', photo: 'log', cover: 'home', sov: 'home', item: 'sov', itemform: 'sov', report: 'home' };
  const TABOF = { log: 'log', entryform: 'log', photo: 'log', cover: 'cover', sov: 'sov', item: 'sov', itemform: 'sov', report: 'report', home: 'home' };
  const SCREEN_NAMES = { projects: 'Projects', projform: 'Project form', home: 'Project home', log: 'Site log', entryform: 'New entry', photo: 'Photo', cover: 'Cover page', sov: 'Progress', item: 'Line item', itemform: 'Line item form', report: 'Report' };
  function titles(s) { const p = P(); const sub = p ? (p.name || 'Untitled project') : ''; return { projects: ['Projects', 'CostTooling'], projform: [editProj && editProj.id ? 'Edit project' : 'New project', editProj && editProj.id ? sub : 'Set up in a minute'], home: [sub, [p && p.client, p && p.finish && 'due ' + Data.md(p.finish)].filter(Boolean).join(' · ') || 'Project'], log: ['Site log', sub], entryform: [form && form.id ? 'Edit entry' : 'New entry', sub], photo: ['Photo', sub], cover: ['Cover page', sub], sov: ['Progress', sub], item: ['Line item', sub], itemform: [editItem && editItem.id ? 'Edit line item' : 'New line item', sub], report: ['Report', sub] }[s]; }
  const TOPACT = { log: ['plus', () => newEntry()], sov: ['plus', () => newItem()], home: ['edit', () => editProject()], item: ['edit', () => editItemForm()], report: ['share', () => openShare('report')], cover: ['share', () => openShare('cover')] };
  function render(s) {
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
    else if (s === 'report') UI.report(p, k);
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
    document.querySelector('.screen.on').scrollTop = 0; closeSheet();
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
  function cam() { $('fileCam').click(); } function gal() { $('fileGal').click(); }
  async function filesPicked(input) {
    const files = [...input.files]; input.value = ''; if (!files.length) return;
    $('pendHint').textContent = 'Importing ' + files.length + ' photo' + (files.length > 1 ? 's' : '') + '…';
    for (const f of files) { try { const id = await Photos.importFile(f); form.photos.push({ id }); form.added.push(id); pendingMap[id] = { id }; } catch (e) { console.warn(e); toast("Couldn't read that photo"); } }
    captureForm(); refresh();
  }
  $('fileCam').onchange = e => filesPicked(e.target); $('fileGal').onchange = e => filesPicked(e.target);
  const pendingPhoto = key => pendingMap[key] || null;
  function captureForm() { if (!form || cur !== 'entryform') return; const v = id => ($(id) || {}).value ?? ''; form.note = v('efNote'); form.itemId = v('efItem'); form.temp = v('efTemp'); form.crew = v('efCrew'); form.d = v('efDate') || form.d; }
  function setWx(w) { captureForm(); form.wx = form.wx === w ? '' : w; refresh(); }
  async function removeFormPhoto(i) { captureForm(); const ph = form.photos.splice(i, 1)[0]; if (ph && ph.id && form.added.includes(ph.id)) { await Photos.remove(ph.id); form.added = form.added.filter(x => x !== ph.id); } refresh(); }
  function saveEntry() {
    captureForm(); const p = P();
    if (!form.photos.length && !form.note.trim()) return toast('Add a photo or a note first');
    const rec = { id: form.id || Data.uid('e'), d: form.d, time: form.time || Data.nowTime(), ts: form.ts || Date.now(), itemId: form.itemId, wx: form.wx, temp: form.temp, crew: form.crew, note: form.note.trim(), photos: form.photos };
    const idx = p.entries.findIndex(x => x.id === rec.id); if (idx >= 0) p.entries[idx] = rec; else p.entries.push(rec);
    save(); const wasNew = !form.id; form = null; toast(wasNew ? 'Saved to the log' : 'Entry updated'); go('log');
  }
  async function cancelEntry() { if (form) for (const id of form.added) await Photos.remove(id); form = null; go(photoCtx.entryId && P().entries.some(e => e.id === photoCtx.entryId) ? 'photo' : 'log'); }
  function deleteEntry(id) { const p = P(), e = p.entries.find(x => x.id === id); if (!e) return; confirm('Delete this entry?', 'The photo' + (e.photos.length > 1 ? 's' : '') + ' and note will be removed from this phone.', async () => { for (const ph of e.photos) if (ph.id) await Photos.remove(ph.id); p.entries = p.entries.filter(x => x.id !== id); p.cover.picked = p.cover.picked.filter(k => !e.photos.some(ph => Data.photoKey(ph) === k)); save(); toast('Entry deleted'); go('log'); }); }
  function openPhoto(entryId, key) { const e = P().entries.find(x => x.id === entryId); if (!e) return; photoCtx.entryId = entryId; photoCtx.idx = Math.max(0, e.photos.findIndex(ph => Data.photoKey(ph) === key)); go('photo'); }
  function photoIdx(i) { photoCtx.idx = i; refresh(); }
  function usePhotoOnCover() { const p = P(), e = p.entries.find(x => x.id === photoCtx.entryId); const key = Data.photoKey(e.photos[photoCtx.idx]); if (!p.cover.picked.includes(key)) p.cover.picked = [key, ...p.cover.picked].slice(0, 4); save(); go('cover'); toast('Added to the cover page'); }
  function filterLog(f) { logFilter = f; refresh(); }

  // ---------- cover ----------
  function coverPick(key) { const cv = P().cover; if (cv.picked.includes(key)) cv.picked = cv.picked.filter(k => k !== key); else if (cv.picked.length < 4) cv.picked.push(key); else cv.picked = [...cv.picked.slice(1), key]; save(); refresh(); }
  function coverLayout(l) { P().cover.layout = l; save(); refresh(); }
  function coverNum(m) { P().cover.numMode = m; save(); refresh(); }
  let coverTimer; const redrawCover = () => { clearTimeout(coverTimer); coverTimer = setTimeout(() => { const p = P(); Render.cover($('cover'), p, Data.calc(p), UI.cover(p, Data.calc(p)).slice(0)); restoreFocus(); }, 300); };
  let focusId; function restoreFocus() {}
  function coverField(f, v) { P().cover[f] = v; save(); clearTimeout(coverTimer); coverTimer = setTimeout(() => { const p = P(), k = Data.calc(p); const sel = UI.coverSelection(p); Render.cover($('cover'), p, k, sel); }, 250); }
  function coverManual(f, v) { P().cover.manual[f] = v; coverField('numMode', 'manual'); }
  async function saveCover() { const r = await Render.shareCanvas($('cover'), 'costtooling-cover.jpg', 'Progress update'); if (r !== 'cancelled') toast(r === 'shared' ? 'Shared' : 'Cover page saved'); }

  // ---------- line items ----------
  function setPct(id, v, el, commit) { const i = P().items.find(x => x.id === id); if (!i) return; i.pct = +v; const lbl = el.parentElement.querySelector('.r b'); if (lbl) lbl.textContent = i.pct + '%'; if (commit) { save(); refresh(); } }
  function setMode(m) { mode = m; if (cur === 'sov') refresh(); }
  function openItem(id) { photoCtx.itemId = id; go('item'); }
  function newItem() { editItem = {}; go('itemform'); }
  function editItemForm() { editItem = Object.assign({}, P().items.find(x => x.id === photoCtx.itemId)); go('itemform'); }
  function saveItem() { const v = id => ($(id) || {}).value || ''; const n = v('ifName').trim(); if (!n) { $('ifName').focus(); return toast('Give the line item a name'); } const p = P(); if (editItem.id) { Object.assign(p.items.find(x => x.id === editItem.id), { n, b: +v('ifBudget') || 0, s: v('ifStart'), e: v('ifEnd') }); save(); toast('Saved'); return go('item'); } const i = { id: Data.uid('i'), n, b: +v('ifBudget') || 0, pct: 0, s: v('ifStart'), e: v('ifEnd'), costs: [] }; p.items.push(i); save(); toast('Line item added'); go('sov'); }
  function deleteItem(id) { const p = P(), i = p.items.find(x => x.id === id); confirm('Delete this line item?', `"${i.n}" and its logged costs will be removed. Photos tagged to it stay in the log.`, () => { p.items = p.items.filter(x => x.id !== id); p.entries.forEach(e => { if (e.itemId === id) e.itemId = ''; }); save(); toast('Line item deleted'); go('sov'); }); }
  function addCost(itemId) { const i = P().items.find(x => x.id === itemId); const desc = $('cfDesc').value.trim(), amt = +$('cfAmt').value; if (!desc || !amt) return toast('Add what it was and how much'); i.costs.push({ id: Data.uid('c'), desc, amt, date: $('cfDate').value }); save(); toast('Cost added'); refresh(); }
  function deleteCost(itemId, costId) { const i = P().items.find(x => x.id === itemId); i.costs = i.costs.filter(c => c.id !== costId); save(); refresh(); }

  // ---------- sharing ----------
  function openShare(kind) { shareKind = kind; $('shareTitle').textContent = kind === 'cover' ? 'Share cover page' : 'Share report'; showSheet('shareSheet'); }
  async function shareDo(action, kind) {
    kind = kind || shareKind; closeSheet(); const p = P(), k = Data.calc(p);
    let canvas = $('cover'), name = 'costtooling-cover.jpg';
    if (kind === 'report') { canvas = $('reportCanvas'); name = 'costtooling-report.jpg'; toast('Building the report…'); await Render.report(canvas, p, k, UI.sortedEntries(p).flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 3)); }
    if (action === 'share') { const r = await Render.shareCanvas(canvas, name, kind === 'cover' ? 'Progress update' : 'Progress report'); if (r !== 'cancelled') toast(r === 'shared' ? 'Shared' : 'Saved'); }
    else if (action === 'save') { const a = document.createElement('a'); a.href = canvas.toDataURL('image/jpeg', 0.92); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Saved'); }
    else if (action === 'print') { const area = $('printArea'); area.innerHTML = `<img src="${canvas.toDataURL('image/jpeg', 0.92)}" style="width:100%">`; area.hidden = false; setTimeout(() => { window.print(); setTimeout(() => { area.hidden = true; area.innerHTML = ''; }, 1000); }, 50); }
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
  function openIdeas() { $('ideaScreen').textContent = SCREEN_NAMES[cur] || cur; renderIdeas(); showSheet('ideaSheet'); setTimeout(() => $('ideaText').focus(), 250); }
  function saveIdea() { const t = $('ideaText').value.trim(); if (!t) return $('ideaText').focus(); const list = ideas(); list.push({ text: t, screen: SCREEN_NAMES[cur] || cur, imp: { nice: 'nice to have', want: "I'd use this", must: 'must have' }[ideaImp], when: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }); DB.set('ct-ideas', list); $('ideaText').value = ''; renderIdeas(); toast('Saved. Keep going!'); }
  function sendIdeas() { const list = ideas(); if (!list.length) return toast('No ideas saved yet'); const who = Q.get('for') || DB.get('ct-for') || ''; const body = `Ideas for CostTooling${who ? ' from ' + who : ''}\n\n` + list.map((i, n) => `${n + 1}. [${i.screen} · ${i.imp}] ${i.text}`).join('\n') + `\n\n(sent from the app, ${/iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'desktop'})`; location.href = 'mailto:' + FEEDBACK_EMAIL + '?subject=' + encodeURIComponent('CostTooling ideas' + (who ? ' from ' + who : '')) + '&body=' + encodeURIComponent(body); }
  $('ideaImp').onclick = e => { if (!e.target.dataset.i) return; ideaImp = e.target.dataset.i; [...$('ideaImp').children].forEach(b => b.classList.toggle('on', b === e.target)); };
  function openWelcome() { const who = Q.get('for') || DB.get('ct-for'); if (who) { DB.set('ct-for', who); $('welcomeTitle').textContent = 'Hi ' + who + ', welcome to CostTooling'; } showSheet('welcomeSheet'); DB.set('ct-welcomed', 1); }
  function exportData() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = 'costtooling-backup-' + Data.iso(Data.today()) + '.json'; document.body.appendChild(a); a.click(); a.remove(); closeSheet(); toast('Backup saved (photos not included yet)'); }
  function resetAll() { confirm('Start over?', 'This removes every project, photo and idea from this phone and brings back the sample job.', async () => { await DB.clearPhotos(); DB.del(DB.KEY); DB.del('ct-ideas'); location.href = location.pathname; }); }

  // ---------- boot ----------
  document.querySelectorAll('[data-ic]').forEach(e => { const w = document.createElement('span'); w.innerHTML = UI.ic(e.dataset.ic, +(e.dataset.size || 18)); e.replaceWith(w.firstChild); });
  const s0 = Q.get('s'); go(s0 && PARENT.hasOwnProperty(s0) && s0 !== 'entryform' && s0 !== 'itemform' && s0 !== 'projform' ? s0 : 'projects');
  if (Q.get('new')) newEntry(); if (Q.get('s') === 'projform') newProject(); if (Q.get('s') === 'itemform') newItem(); if (Q.get('m') === 'gantt') { setMode('gantt'); } if (Q.get('layout')) coverLayout(Q.get('layout'));
  renderIdeas(); if (!DB.get('ct-welcomed') || Q.get('welcome')) setTimeout(openWelcome, 400);
  if (Q.get('ideas')) setTimeout(openIdeas, 300); if (Q.get('sheet')) setTimeout(() => openShare(Q.get('sheet')), 300);
  if (Q.get('s') === 'photo' && P() && P().entries[0]) openPhoto(P().entries[0].id);
  if (Q.get('s') === 'item' && P() && P().items[2]) openItem(P().items[2].id);

  return { go, openProject, newProject, editProject, pickTemplate, saveProject, deleteProject, restoreSample, newEntry, editEntry, cam, gal, setWx, removeFormPhoto, saveEntry, cancelEntry, deleteEntry, openPhoto, photoIdx, usePhotoOnCover, filterLog, pendingPhoto, coverPick, coverLayout, coverNum, coverField, coverManual, saveCover, setPct, setMode, openItem, newItem, saveItem, deleteItem, addCost, deleteCost, openShare, shareDo, closeSheet, openIdeas, saveIdea, sendIdeas, openWelcome, exportData, resetAll, state: () => S, filesPicked };
})();
