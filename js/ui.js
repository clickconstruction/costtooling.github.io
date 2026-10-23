/* UI — renders each screen from the current project. All handlers call into App. */
const UI = (() => {
  const ICONS = {
    home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    camera:'<path d="M4 8h3.2l1.6-2.5h6.4L16.8 8H20v11H4z"/><circle cx="12" cy="13" r="3.3"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5.5-5.5L7 19"/>',
    percent:'<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.6"/><circle cx="17" cy="17" r="2.6"/>',
    file:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
    chevl:'<path d="M15 5l-7 7 7 7"/>', chevr:'<path d="M9 5l7 7-7 7"/>',
    share:'<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v8h14v-8"/>',
    download:'<path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M5 20h14"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cloud:'<path d="M7 17a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 17z"/>',
    rain:'<path d="M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 15z"/><path d="M9 18v3M13 18v3M17 18v3"/>',
    wind:'<path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 13h14a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 18h7a2 2 0 1 1-2 2"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M17.5 13.6a6.5 6.5 0 0 1 4 6.4"/>',
    edit:'<path d="M4 20l4.5-1L19 8.5l-3.5-3.5L5 15.5z"/><path d="M13 7.5l3.5 3.5"/>',
    check:'<path d="M5 12l5 5 9-10"/>',
    dollar:'<path d="M12 3v18"/><path d="M16.5 7.5c-.4-1.5-1.8-2.5-3.5-2.5h-2a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6h-2.5c-1.7 0-3.1-1-3.5-2.5"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    flag:'<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
    trash:'<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 8l9 6 9-6"/>',
    pin:'<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    bulb:'<path d="M9 18h6"/><path d="M10 21h4"/><path d="M8.3 14.2A6 6 0 1 1 15.7 14.2c-.7.7-1.2 1.6-1.2 2.8H9.5c0-1.2-.5-2.1-1.2-2.8z"/>',
    send:'<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    folder:'<path d="M3 7h6l2 2h10v11H3z"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    key:'<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9"/><path d="M16 6l3 3"/><path d="M13 9l2 2"/>',
    logout:'<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>',
    move:'<path d="M3 6h6l2 2h10v12H3z"/><path d="M9 13h7"/><path d="M13 10l3 3-3 3"/>',
    hardhat:'<path d="M4 16a8 8 0 0 1 16 0"/><path d="M2 16h20v3H2z"/><path d="M10 7.5V13M14 7.5V13"/>',
  };
  const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { fmt$, md, wd } = Data;
  const WX = { sun: 'Sunny', cloud: 'Overcast', rain: 'Rain', wind: 'Windy' };
  const itemOf = (p, id) => (p.items || []).find(i => i.id === id);
  const itemName = (p, id) => (itemOf(p, id) || {}).n || '';
  const condChips = e => { const out = []; if (e.wx) out.push(`<span class="chip">${ic(e.wx, 13)}${e.temp !== '' && e.temp != null ? esc(e.temp) + '°' : WX[e.wx]}</span>`); if (e.crew) out.push(`<span class="chip">${ic('users', 13)}${esc(e.crew)} on site</span>`); return out.join(''); };
  const sortedEntries = p => (p.entries || []).slice().sort((a, b) => (b.d + (b.ts || 0)).localeCompare(a.d + (a.ts || 0)) || (b.ts || 0) - (a.ts || 0));
  const photoPh = (ph, key, extra, attrs) => `<div class="ph ${extra || ''}" data-ph="${esc(key)}" ${attrs || ''}></div>`;
  const statusChips = i => { const over = i.pct > 0 && Data.itemCost(i) > Data.itemEarned(i); return (i.pct === 100 ? '<span class="chip g">' + ic('check', 13) + 'complete</span>' : i.pct > 0 ? '<span class="chip a">in progress</span>' : '<span class="chip">not started</span>') + (over ? '<span class="chip r">' + ic('trend', 13) + 'running over</span>' : ''); };
  const slider = i => `<input type="range" min="0" max="100" step="5" value="${i.pct || 0}" style="--v:${i.pct || 0}%" oninput="App.setPct('${i.id}', this.value, false)" onchange="App.setPct('${i.id}', this.value, true)"><div class="quick">${[0, 25, 50, 75, 100].map(v => `<button class="${(i.pct || 0) === v ? 'on' : ''}" data-v="${v}" onclick="App.quickPct('${i.id}', ${v})">${v}%</button>`).join('')}</div>`;

  /** Fill photo placeholders with real elements. */
  function hydrate(root, p, extra) {
    const map = {}; Data.allPhotos(p).forEach(({ ph }) => { map[Data.photoKey(ph)] = ph; }); (extra || []).forEach(ph => { map[Data.photoKey(ph)] = ph; });
    root.querySelectorAll('[data-ph]').forEach(el => { const ph = map[el.dataset.ph]; if (!ph) return; el.prepend(Photos.el(ph, el.dataset.size || 'thumb')); });
  }

  function gantt(p, mini) {
    const items = (p.items || []).filter(i => i.s && i.e); if (!items.length) return '';
    const T = Data.today(), start = Data.parse(p.start), finish = Data.parse(p.finish);
    const L = mini ? 4 : 118, R = mini ? 336 : 312, Tp = mini ? 14 : 22, rowH = mini ? 4.2 : 24;
    const x = dt => L + (R - L) * Math.min(1, Math.max(0, (dt - start) / Math.max(1, finish - start)));
    let s = '';
    for (let m = new Date(start.getFullYear(), start.getMonth() + 1, 1); m < finish; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) s += `<line x1="${x(m)}" y1="${Tp - 6}" x2="${x(m)}" y2="${Tp + rowH * items.length}" stroke="#e2dfd6"/><text x="${x(m) + 3}" y="${Tp - 8}" font-size="9" fill="#6b6a66">${m.toLocaleDateString('en-US', { month: 'short' })}</text>`;
    items.forEach((i, r) => { const y = Tp + r * rowH, s0 = Data.parse(i.s), e0 = Data.parse(i.e); const late = i.pct < 100 && e0 < T; const col = i.pct === 100 ? '#2f7d4f' : late ? '#b3261e' : i.pct > 0 ? '#e8c547' : '#d9d6cc';
      if (!mini) s += `<text x="${L - 6}" y="${y + 14}" font-size="10" text-anchor="end" fill="#161617">${esc(i.n.length > 20 ? i.n.slice(0, 19) + '…' : i.n)}</text>`;
      const bh = mini ? 3 : 14, by = mini ? y : y + 4;
      s += `<rect x="${x(s0)}" y="${by}" width="${Math.max(2, x(e0) - x(s0))}" height="${bh}" rx="${mini ? 1 : 3}" fill="#d9d6cc"/>`;
      if (i.pct > 0) s += `<rect x="${x(s0)}" y="${by}" width="${Math.max(2, (x(e0) - x(s0)) * i.pct / 100)}" height="${bh}" rx="${mini ? 1 : 3}" fill="${col}"/>`;
      if (!mini) s += `<text x="${x(e0) + 4}" y="${y + 15}" font-size="9" fill="#6b6a66">${i.pct || 0}%</text>`; });
    if (T >= start && T <= finish) s += `<line x1="${x(T)}" y1="${Tp - 4}" x2="${x(T)}" y2="${Tp + rowH * items.length}" stroke="#161617" stroke-width="1.5" stroke-dasharray="3 2"/><text x="${x(T) - 2}" y="${Tp + rowH * items.length + 12}" font-size="9" text-anchor="end" fill="#161617" font-weight="700">today</text>`;
    return `<svg class="gantt" viewBox="0 0 340 ${Tp + rowH * items.length + 18}">${s}</svg>`;
  }

  // ---------- screens ----------
  function projects(S) {
    const list = S.projects.map(p => ({ p, k: Data.calc(p) }));
    const active = list.filter(o => o.k.pct < 1).length, toGo = list.reduce((a, o) => a + o.k.toGo, 0);
    const html = (window.Cloud ? Cloud.promoHtml() : '') + `<div class="stat2"><div><b>${list.length}</b><span>project${list.length === 1 ? '' : 's'}</span></div><div><b>${active}</b><span>active</span></div><div><b>${Data.fmtK(toGo)}</b><span>to finish, all</span></div></div>` +
      (list.length ? list.map(({ p, k }) => `<div class="card tap ${p.sample ? 'sample' : ''}" onclick="App.openProject('${p.id}')">
        <h3>${esc(p.name || 'Untitled project')} <small>${p.sample ? 'Sample job' : esc(p.client || '')}</small></h3>
        <div class="row" style="border:0;padding:0 0 8px"><div class="l"><small>${p.start ? 'Started ' + md(p.start) : ''}${p.finish ? ' · due ' + md(p.finish) : ''}</small></div><div class="r"><b>${Math.round(k.pct * 100)}%</b></div></div>
        <div class="bar"><i style="width:${Math.round(k.pct * 100)}%"></i></div>
        <div class="hint">${k.total ? fmt$(k.toGo) + ' to finish · ' + k.daysLeft + ' days' : 'No line items yet'}</div></div>`).join('')
      : `<div class="empty">${ic('folder', 36)}No projects yet.</div>`) +
      `<button class="btn q" onclick="App.newProject()">${ic('plus')}New project</button>` +
      (S.projects.some(p => p.sample) ? '' : `<p class="hint" style="text-align:center"><a class="lnk" onclick="App.restoreSample()">Bring back the sample job</a></p>`);
    projectsBody.innerHTML = html;
  }

  function projform(p, tpl) {
    const isNew = !p.id; const T = Data.iso(Data.today());
    projformBody.innerHTML = `<div class="card">
      <label>Project name</label><input class="in" id="pfName" value="${esc(p.name || '')}" placeholder="e.g. Oak St — porch rebuild">
      <label>Client</label><input class="in" id="pfClient" value="${esc(p.client || '')}" placeholder="Who is this for?">
      <label>Address</label><input class="in" id="pfAddr" value="${esc(p.addr || '')}" placeholder="Site address">
      <div class="in2"><div><label>Start</label><input class="in" type="date" id="pfStart" value="${esc(p.start || T)}"></div><div><label>Finish</label><input class="in" type="date" id="pfFinish" value="${esc(p.finish || Data.iso(Data.addDays(Data.today(), 60)))}"></div></div>
      ${isNew ? `<label>Contract amount <span style="font-weight:400">· splits across the template</span></label><input class="in" type="number" inputmode="decimal" id="pfContract" placeholder="$">` : ''}
    </div>` + (isNew ? `<div class="card"><h3>Start from a template <small>line items you can edit</small></h3><div class="tpl">${Object.entries(Data.TEMPLATES).map(([k, t]) => `<div class="${k === tpl ? 'on' : ''}" onclick="App.pickTemplate('${k}')"><b>${esc(t.name)}</b><span>${esc(t.note)}</span></div>`).join('')}</div></div>` : '') +
      `<button class="btn" onclick="App.saveProject()">${ic('check')}${isNew ? 'Create project' : 'Save changes'}</button>` +
      (isNew ? '' : `<button class="btn danger" style="margin-top:10px" onclick="App.deleteProject()">${ic('trash')}Delete this project</button>`);
  }

  function home(p, k) {
    const inProg = (p.items || []).filter(i => i.pct > 0 && i.pct < 100);
    const latest = sortedEntries(p).flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 8);
    homeBody.innerHTML = `<div class="kpis">
      <div class="kpi">${ic('trend')}<b>${Math.round(k.pct * 100)}%</b><span>complete (earned value)</span><em>${Math.round(k.schedPct * 100)}% of schedule used · ${k.total ? (k.ahead ? 'ahead' : 'behind') : 'no budget yet'}</em></div>
      <div class="kpi">${ic('clock')}<b>${k.daysLeft}</b><span>days to finish</span><em>planned finish ${p.finish ? md(p.finish) : '—'}</em></div>
      <div class="kpi light">${ic('dollar')}<b>${fmt$(k.cost)}</b><span>cost so far</span><em>${fmt$(k.earned)} earned · ${k.cost > k.earned ? fmt$(k.cost - k.earned) + ' over' : fmt$(k.earned - k.cost) + ' under'}</em></div>
      <div class="kpi light">${ic('flag')}<b>${fmt$(k.toGo)}</b><span>to finish (forecast)</span><em>of ${fmt$(k.total)} contract</em></div></div>
      <div class="actions">
        <button class="btn" onclick="App.newEntry()">${ic('camera')}Add photo</button>
        <button class="btn" onclick="App.go('cover')">${ic('image')}Cover page</button>
        <button class="btn q" onclick="App.go('sov')">${ic('percent')}Update progress</button>
        <button class="btn q" onclick="App.openShare('report')">${ic('share')}Share report</button></div>
      <div class="card"><h3>Latest photos <small class="lnk" onclick="App.go('log')">see log ›</small></h3>${latest.length ? `<div class="strip">${latest.map(({ ph, e }) => photoPh(ph, Data.photoKey(ph), '', `onclick="App.openPhoto('${e.id}','${Data.photoKey(ph)}')"`)).join('')}</div>` : `<p class="hint" style="margin:0">No photos yet. Tap Add photo to start the log.</p>`}</div>
      <div class="card"><h3>In progress now <small class="lnk" onclick="App.go('sov')">all items ›</small></h3>${inProg.length ? inProg.map(i => `<div class="row tap" onclick="App.openItem('${i.id}')"><div class="l"><b>${esc(i.n)}</b><small>${fmt$(Data.itemCost(i))} of ${fmt$(i.b)}${i.e ? ' · due ' + md(i.e) : ''}</small><div class="mini"><i style="width:${i.pct}%"></i></div></div><div class="r"><b>${i.pct}%</b></div><span class="chev">${ic('chevr', 16)}</span></div>`).join('') : `<p class="hint" style="margin:0">${(p.items || []).length ? 'Nothing started yet. Drag a slider on Progress.' : 'No line items yet. Add some on Progress.'}</p>`}</div>
      ${(p.items || []).length ? `<div class="card tap" onclick="App.openGantt()"><h3>Schedule <small>${k.total && k.pct > 0 ? 'finishes ' + md(Data.iso(k.paceFinish)) + ' at this pace' : ''}</small></h3>${gantt(p, true)}</div>` : ''}`;
    hydrate(homeBody, p);
  }

  /** A log day header: the job day when the date is on or after the start, then the date. */
  const dayLabel = (p, d) => { const n = Data.jobDay(p, d); return (n ? 'Day ' + n + ' · ' : '') + wd(d); };
  /** Is an entry under a log filter? 'all' takes every entry, 'none' the untagged ones, anything else is a line item id. */
  const inFilter = (itemId, filter) => filter === 'all' || (filter === 'none' ? !itemId : itemId === filter);
  function log(p, filter) {
    const items = p.items || [], every = p.entries || [];
    const count = id => every.filter(e => (e.itemId || '') === id).length;
    const untagged = count('');
    // Every line item gets a chip with its entry count, so a new item is visible here before its first photo.
    const chip = (id, name, n) => `<span class="chip ${filter === id ? 'on' : ''}${n ? '' : ' z'}" data-filter="${id}" data-name="${esc(name)}" onclick="App.filterLog('${id}')">${esc(name)}<b class="n">${n}</b></span>`;
    let html = `<div class="chips wrap" id="logChips">${chip('all', 'All', every.length)}${items.map(i => chip(i.id, i.n, count(i.id))).join('')}${untagged && items.length ? chip('none', 'No line item', untagged) : ''}</div>`;
    html += `<div class="empty" id="logEmpty" style="display:none">${ic('camera', 36)}<span id="logEmptyText"></span><br><button class="btn sm" id="logEmptyBtn" style="margin-top:12px"></button></div>`;
    const all = sortedEntries(p); let lastDay = '';
    all.forEach(e => {
      const show = inFilter(e.itemId, filter);
      if (e.d !== lastDay) { lastDay = e.d; const n = all.filter(x => x.d === e.d).length; html += `<div class="day" data-day="${e.d}"><span>${dayLabel(p, e.d)}</span><span class="dayN">${n} entr${n > 1 ? 'ies' : 'y'}</span></div>`; }
      const ph = e.photos[0];
      html += `<div class="entry ${ph ? '' : 'nophoto'}" data-day="${e.d}" data-item="${esc(e.itemId || '')}" style="display:${show ? '' : 'none'}" onclick="App.openPhoto('${e.id}')">${ph ? photoPh(ph, Data.photoKey(ph), '', e.photos.length > 1 ? `data-n="${e.photos.length}"` : '') : ''}<div>${e.itemId ? `<span class="chip k">${esc(itemName(p, e.itemId))}</span>` : '<span class="chip z">No line item</span>'}<span class="chip" style="border:0;padding-left:2px">${esc(e.time || '')}</span><p>${esc(e.note) || '<i style="color:var(--muted)">No note</i>'}</p>${condChips(e)}</div></div>`;
    });
    logBody.innerHTML = html; hydrate(logBody, p);
    logBody.querySelectorAll('.ph[data-n]').forEach(el => { const b = document.createElement('span'); b.className = 'n'; b.textContent = '+' + (el.dataset.n - 1); el.appendChild(b); });
    applyLogFilter(filter);
  }
  /** Show/hide entries and day headers in place. */
  function applyLogFilter(filter) {
    logBody.querySelectorAll('#logChips .chip').forEach(c => c.classList.toggle('on', c.dataset.filter === filter));
    let visible = 0; const perDay = {};
    logBody.querySelectorAll('.entry').forEach(e => { const show = inFilter(e.dataset.item, filter); e.style.display = show ? '' : 'none'; if (show) { visible++; perDay[e.dataset.day] = (perDay[e.dataset.day] || 0) + 1; } });
    logBody.querySelectorAll('.day').forEach(h => { const n = perDay[h.dataset.day] || 0; h.style.display = n ? '' : 'none'; h.querySelector('.dayN').textContent = n + ' entr' + (n > 1 ? 'ies' : 'y'); });
    const empty = document.getElementById('logEmpty'); if (!empty) return;
    empty.style.display = visible ? 'none' : '';
    if (visible) return;
    // A line item with no photos yet offers one that is already tagged to it.
    const chip = logBody.querySelector(`#logChips .chip[data-filter="${filter}"]`), name = chip ? chip.dataset.name : '';
    const item = filter !== 'all' && filter !== 'none' ? filter : '';
    document.getElementById('logEmptyText').textContent = item ? `No photos for ${name} yet.` : 'No entries yet.';
    const btn = document.getElementById('logEmptyBtn'); btn.innerHTML = ic('camera') + (item ? `Add a photo to ${esc(name)}` : 'Add the first photo'); btn.onclick = () => App.newEntry(item);
  }

  function entryform(p, f) {
    const items = p.items || [];
    entryBody.innerHTML = `<div class="card">
      <h3>${f.id ? 'Edit entry' : 'New entry'} <small>${wd(f.d)}${f.time ? ' · ' + esc(f.time) : ''}</small></h3>
      <div class="pend" id="pendGrid">${entryPhotosHtml(f)}</div>
      <p class="hint" style="margin:0 0 6px" id="pendHint">Take a photo, or pick ones you were texted.</p>
      <label>Line item</label>${items.length
        ? `<select class="in${f.itemId ? '' : ' pick'}" id="efItem" onchange="this.classList.toggle('pick', !this.value)"><option value="">Pick a line item…</option>${items.map(i => `<option value="${i.id}" ${i.id === f.itemId ? 'selected' : ''}>${esc(i.n)}</option>`).join('')}</select>`
        : `<p class="hint" style="margin:0 0 4px">No line items yet. Add them on the Progress tab, then tag photos to them here.</p>`}
      <label>Note</label><textarea class="in" id="efNote" placeholder="What happened today?">${esc(f.note)}</textarea>
      <label>Conditions</label>
      <div class="seg" id="efWx">${['sun', 'cloud', 'rain', 'wind'].map(w => `<button class="${f.wx === w ? 'on' : ''}" onclick="App.setWx('${w}')">${ic(w, 15)}${WX[w]}</button>`).join('')}</div>
      <div class="in3" style="margin-top:8px"><div><label>Temp °F</label><input class="in" type="number" inputmode="numeric" id="efTemp" value="${esc(f.temp)}" placeholder="—"></div><div><label>On site</label><input class="in" type="number" inputmode="numeric" id="efCrew" value="${esc(f.crew)}" placeholder="—"></div><div><label>Date</label><input class="in" type="date" id="efDate" value="${esc(f.d)}"></div></div>
    </div>
    <div style="display:flex;gap:8px"><button class="btn" onclick="App.saveEntry()">${ic('check')}Save entry</button><button class="btn q" style="width:auto" onclick="App.cancelEntry()">Cancel</button></div>`;
    hydrate(entryBody, p, f.photos);
  }

  const entryPhotosHtml = f => f.photos.map((ph, i) => `<div class="ph" data-ph="${esc(Data.photoKey(ph))}"><button class="x" aria-label="Remove photo" onclick="event.stopPropagation(); App.removeFormPhoto(${i})"><i>${ic('x', 12)}</i></button></div>`).join('') + `<div class="ph add cam" onclick="App.cam()">${ic('camera', 26)}Camera</div><div class="ph add gal" onclick="App.gal()">${ic('image', 24)}Photos</div>`;
  function entryPhotos(p, f) { const g = document.getElementById('pendGrid'); if (!g) return; g.innerHTML = entryPhotosHtml(f); hydrate(g, p, f.photos); }

  function photo(p, e, idx) {
    const ph = e.photos[idx], it = itemOf(p, e.itemId);
    photoBody.innerHTML = `${ph ? `<div class="photo-big" id="photoBig" data-ph="${esc(Data.photoKey(ph))}" data-size="full"><div class="stamp">${wd(e.d)}${e.time ? ' · ' + esc(e.time) : ''}</div></div>` : ''}
      ${e.photos.length > 1 ? `<div class="strip" id="photoStrip" style="margin-bottom:12px">${e.photos.map((q, i) => photoPh(q, Data.photoKey(q), i === idx ? 'sel' : '', `data-idx="${i}" onclick="App.photoIdx(${i})"`)).join('')}</div>` : ''}
      <div class="card"><p style="margin:0 0 8px;font-size:15px">${esc(e.note) || '<i style="color:var(--muted)">No note</i>'}</p>
        ${it ? `<div class="row tap" onclick="App.openItem('${it.id}')"><div class="l"><b>${esc(it.n)}</b><small>line item · ${it.pct || 0}% complete</small></div><span class="chev">${ic('chevr', 16)}</span></div>` : ''}
        ${e.wx || e.crew ? `<div class="row" style="border:0"><div class="l"><small>Conditions</small><div>${condChips(e)}</div></div></div>` : ''}
        ${p.addr ? `<div class="row" style="border:0;padding-top:0"><div class="l"><small>Location</small><div><span class="chip">${ic('pin', 13)}${esc(p.addr)}</span></div></div></div>` : ''}</div>
      <div class="actions"><button class="btn" onclick="App.openMove()">${ic('move')}Move to…</button><button class="btn q" onclick="App.editEntry('${e.id}')">${ic('edit')}Edit</button></div>
      ${ph ? `<button class="btn q" style="margin-bottom:12px" onclick="App.usePhotoOnCover()">${ic('image')}Use on cover</button>` : ''}
      <button class="btn danger" onclick="App.deleteEntry('${e.id}')">${ic('trash')}Delete entry</button>`;
    hydrate(photoBody, p);
  }
  function photoSwap(p, e, idx) {
    const big = document.getElementById('photoBig'); if (!big) return; const ph = e.photos[idx]; if (!ph) return;
    big.querySelectorAll('img, canvas').forEach(n => n.remove()); big.dataset.ph = Data.photoKey(ph); big.prepend(Photos.el(ph, 'full'));
    document.querySelectorAll('#photoStrip .ph').forEach(el => el.classList.toggle('sel', +el.dataset.idx === idx));
  }

  const allPhotosSorted = p => Data.allPhotos(p).sort((a, b) => (b.e.d + (b.e.ts || 0)).localeCompare(a.e.d + (a.e.ts || 0)));
  function coverSelection(p) {
    const cv = p.cover, all = allPhotosSorted(p); const picked = cv.picked.filter(key => all.some(a => Data.photoKey(a.ph) === key));
    const need = { hero: 1, grid: 4, split: 3 }[cv.layout] || 4;
    const keys = picked.slice(0, need); all.forEach(a => { const k = Data.photoKey(a.ph); if (keys.length < need && !keys.includes(k)) keys.push(k); });
    return keys.map(key => { const a = all.find(x => Data.photoKey(x.ph) === key); return a ? { ph: a.ph, e: a.e, item: itemName(p, a.e.itemId) } : null; });
  }
  function cover(p, k) {
    const cv = p.cover, all = allPhotosSorted(p);
    const picked = cv.picked.filter(key => all.some(a => Data.photoKey(a.ph) === key));
    coverBody.innerHTML = `<div class="actions" style="margin-bottom:4px"><button class="btn" onclick="App.saveCover()">${ic('download')}Save to Photos</button><button class="btn q" onclick="App.openShare('cover')">${ic('share')}Share</button></div>
      <p class="hint">Saves a 1080×1350 image. On a phone the share sheet lands it in the camera roll, a text or an email.</p>
      <div class="card" style="margin-top:12px"><h3>Photos <small>tap to pick up to 4</small></h3>${all.length ? `<div class="grid3" id="coverGrid">${all.map(({ ph, e }) => photoPh(ph, Data.photoKey(ph), picked.includes(Data.photoKey(ph)) ? 'sel' : '', `onclick="App.coverPick('${Data.photoKey(ph)}')"`)).join('')}</div>` : `<p class="hint" style="margin:0">No photos yet. Add some in the log and they show up here.</p>`}</div>
      <div class="card" id="coverCtl">${coverCtlHtml(cv)}</div>`;
    hydrate(coverBody, p);
    return coverSelection(p);
  }
  const coverCtlHtml = cv => `<label>Layout</label><div class="seg" id="coverLayoutSeg">${[['hero', 'One big'], ['grid', '2 × 2'], ['split', 'Big + 2']].map(([l, n]) => `<button class="${cv.layout === l ? 'on' : ''}" data-l="${l}" onclick="App.coverLayout('${l}')">${n}</button>`).join('')}</div>
        <label>Headline</label><input class="in" value="${esc(cv.head)}" oninput="App.coverField('head', this.value)">
        <label>Date on cover</label><input class="in" value="${esc(cv.date || Data.mdy(Data.iso(Data.today())))}" oninput="App.coverField('date', this.value)">
        <label>Numbers shown</label><div class="seg"><button class="${cv.numMode !== 'manual' ? 'on' : ''}" onclick="App.coverNum('auto')">From progress</button><button class="${cv.numMode === 'manual' ? 'on' : ''}" onclick="App.coverNum('manual')">Type my own</button></div>
        ${cv.numMode === 'manual' ? `<div class="in2"><div><label>% complete</label><input class="in" type="number" inputmode="numeric" value="${esc(cv.manual.pct)}" oninput="App.coverManual('pct', this.value)"></div><div><label>Days to finish</label><input class="in" type="number" inputmode="numeric" value="${esc(cv.manual.days)}" oninput="App.coverManual('days', this.value)"></div></div><label>$ to finish</label><input class="in" type="number" inputmode="decimal" value="${esc(cv.manual.toGo)}" oninput="App.coverManual('toGo', this.value)">` : ''}
        <label>Note at the bottom</label><input class="in" value="${esc(cv.note)}" oninput="App.coverField('note', this.value)">`;
  function coverCtl(cv) { const c = document.getElementById('coverCtl'); if (c) c.innerHTML = coverCtlHtml(cv); }

  const sovSummaryHtml = (p, k) => { const n = (p.items || []).length; return `<div class="row" style="border:0;padding:0"><div class="l"><b>Contract</b><small>${n} line item${n === 1 ? '' : 's'}</small></div><div class="r"><b>${fmt$(k.total)}</b></div></div><div class="row" style="border:0;padding:4px 0 0"><div class="l"><small>Earned to date</small></div><div class="r">${fmt$(k.earned)} (${Math.round(k.pct * 100)}%)</div></div><div class="row" style="border:0;padding:4px 0 0"><div class="l"><small>Cost to date</small></div><div class="r">${fmt$(k.cost)}</div></div>`; };
  const ganttHtml = (p, k) => { const items = p.items || []; const diff = Math.round((k.paceFinish - Data.parse(p.finish)) / Data.DAY); return `<div class="card"><h3>Schedule <small>${p.start ? md(p.start) + ' → ' + md(p.finish) : ''}</small></h3>${items.length ? gantt(p, false) : '<p class="hint" style="margin:0">Add line items with dates to see a schedule.</p>'}<div class="legend"><span><i style="background:#d9d6cc"></i>planned</span><span><i style="background:var(--green)"></i>done</span><span><i style="background:var(--yellow)"></i>in progress</span><span><i style="background:var(--red)"></i>behind</span></div></div>
        <div class="card"><h3>Finish forecast</h3><div class="row"><div class="l"><b>Planned finish</b></div><div class="r">${p.finish ? md(p.finish) : '—'}</div></div><div class="row"><div class="l"><b>At current pace</b><small>${k.pct > 0 ? (diff > 0 ? diff + ' days late' : diff < 0 ? Math.abs(diff) + ' days early' : 'on time') : 'no progress logged yet'}</small></div><div class="r">${k.pct > 0 ? md(Data.iso(k.paceFinish)) : '—'}</div></div><div class="row"><div class="l"><b>Schedule used</b><small>calendar days elapsed</small></div><div class="r">${Math.round(k.schedPct * 100)}% · ${Math.round(k.elapsed)} of ${Math.round(k.span)} days</div></div></div>`; };
  function sov(p, k, mode) {
    const items = p.items || [];
    let html = `<div class="seg big" id="modeSeg"><button class="${mode === 'items' ? 'on' : ''}" data-m="items" onclick="App.setMode('items')">Line items</button><button class="${mode === 'gantt' ? 'on' : ''}" data-m="gantt" onclick="App.setMode('gantt')">Schedule</button></div>`;
    html += `<div id="modeItems" style="display:${mode === 'items' ? '' : 'none'}"><div class="card" id="sovSummary">${sovSummaryHtml(p, k)}</div>`;
    html += items.length ? `<p class="hint" style="margin:0 0 10px">Drag a slider or tap a percent. Every number on every screen follows. Tap a name for costs and photos.</p>` : `<div class="empty">${ic('percent', 36)}No line items yet.<br><button class="btn sm" style="margin-top:12px" onclick="App.newItem()">${ic('plus')}Add a line item</button></div>`;
    html += items.map(i => `<div class="card" style="padding:12px 14px 10px" data-item="${i.id}">
        <div class="row tap" style="border:0;padding:0" onclick="App.openItem('${i.id}')"><div class="l"><b>${esc(i.n)}</b><small>${i.s ? md(i.s) + ' – ' + md(i.e) + ' · ' : ''}budget ${fmt$(i.b)}</small></div><div class="r"><b class="pctLbl">${i.pct || 0}%</b><small>${fmt$(Data.itemCost(i))} spent</small></div><span class="chev">${ic('chevr', 16)}</span></div>
        ${slider(i)}
        <div class="status">${statusChips(i)}</div></div>`).join('');
    if (items.length) html += `<button class="btn q" onclick="App.newItem()">${ic('plus')}Add a line item</button>`;
    html += `</div><div id="modeGantt" style="display:${mode === 'gantt' ? '' : 'none'}">${ganttHtml(p, k)}</div>`;
    sovBody.innerHTML = html;
  }
  function sovSummary(p, k) { const c = document.getElementById('sovSummary'); if (c) c.innerHTML = sovSummaryHtml(p, k); const g = document.getElementById('modeGantt'); if (g) g.innerHTML = ganttHtml(p, k); }
  /** Update one item's slider card (on Progress or Line item screen) in place. */
  function itemSlider(i) {
    document.querySelectorAll(`[data-item="${i.id}"]`).forEach(card => {
      const lbl = card.querySelector('.pctLbl'); if (lbl) lbl.textContent = (i.pct || 0) + '%';
      const r = card.querySelector('input[type=range]'); if (r) { if (+r.value !== i.pct) r.value = i.pct; r.style.setProperty('--v', (i.pct || 0) + '%'); }
      card.querySelectorAll('.quick button').forEach(b => b.classList.toggle('on', +b.dataset.v === (i.pct || 0)));
      const st = card.querySelector('.status'); if (st) st.innerHTML = statusChips(i);
    });
  }

  const itemKpisHtml = i => { const earned = Data.itemEarned(i), cost = Data.itemCost(i), over = i.pct > 0 && cost > earned; return `<div class="kpi">${ic('percent')}<b>${i.pct || 0}%</b><span>complete</span><em>${i.s ? md(i.s) + ' – ' + md(i.e) : 'no dates'}</em></div><div class="kpi light">${ic('dollar')}<b>${fmt$(cost)}</b><span>cost so far</span><em>${over ? fmt$(cost - earned) + ' over earned' : fmt$(earned - cost) + ' under earned'}</em></div>`; };
  const itemCostsHtml = i => { const cost = Data.itemCost(i); return `<h3>Costs <small>${fmt$(cost)} total</small></h3>
        <div id="costRows">${(i.costs || []).map(c => `<div class="row"><div class="l"><b>${esc(c.desc)}</b><small>${c.date ? md(c.date) : ''}</small></div><div class="r">${fmt$(c.amt)}</div><button class="del" aria-label="Remove cost" onclick="App.deleteCost('${i.id}','${c.id}')">${ic('x', 16)}</button></div>`).join('') || '<p class="hint" style="margin:0 0 8px">No costs logged yet.</p>'}
        ${(i.costs || []).length ? `<div class="row" style="border:0"><div class="l"><b>Total</b></div><div class="r"><b>${fmt$(cost)}</b></div></div>` : ''}</div>
        <div style="border-top:1px solid var(--line);padding-top:10px;margin-top:6px"><div class="in2"><div><label>What</label><input class="in" id="cfDesc" placeholder="e.g. Lumber"></div><div><label>Amount</label><input class="in" type="number" inputmode="decimal" id="cfAmt" placeholder="$"></div></div><label>Date</label><input class="in" type="date" id="cfDate" value="${Data.iso(Data.today())}"><button class="btn q sm" style="margin-top:10px" onclick="App.addCost('${i.id}')">${ic('plus')}Add cost</button></div>`; };
  /** The Move to… sheet: every line item with its photo count and status; the entry's own line item is marked, not tappable. */
  function moveSheet(p, e, mode) {
    const items = p.items || [], n = e.photos.length, one = mode === 'photo' && n > 1;
    const count = id => (p.entries || []).filter(x => x.itemId === id).reduce((a, x) => a + x.photos.length, 0);
    const status = i => i.pct === 100 ? 'complete' : i.pct > 0 ? i.pct + '%' : 'not started';
    const what = n > 1 ? n + ' photos' : n ? 'The photo' : 'The note', andNote = n && e.note ? ' and the note' : '';
    document.getElementById('moveHint').textContent = one ? `Just this photo moves, as its own entry on ${wd(e.d)}. The note and the other photo${n > 2 ? 's' : ''} stay here.` : `${what}${andNote} from ${wd(e.d)} ${n > 1 || andNote ? 'go' : 'goes'} with it.`;
    const seg = document.getElementById('moveMode'); seg.style.display = n > 1 ? '' : 'none'; seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    const row = (id, name, sub) => id === (e.itemId || '') ? `<div class="row"><div class="l"><b>${esc(name)}</b><small>${sub}</small></div><span class="chip k">${ic('check', 13)}here now</span></div>` : `<div class="row tap" onclick="App.moveEntry('${id}')"><div class="l"><b>${esc(name)}</b><small>${sub}</small></div><span class="chev">${ic('chevr', 16)}</span></div>`;
    document.getElementById('moveList').innerHTML = items.map(i => { const c = count(i.id); return row(i.id, i.n, (c ? c + ' photo' + (c > 1 ? 's' : '') : 'no photos') + ' · ' + status(i)); }).join('') + row('', 'No line item', 'untagged, in the log only');
  }

  /** A line item as a folder: its entries grouped by day, Day 1 being its first, newest day first like the log. flashId outlines an entry once. */
  function item(p, i, flashId) {
    const earned = Data.itemEarned(i);
    const es = sortedEntries(p).filter(e => e.itemId === i.id), days = Data.itemDays(p, i.id), nPhotos = es.reduce((a, e) => a + e.photos.length, 0);
    let diary = '', lastDay = '';
    es.forEach(e => {
      if (e.d !== lastDay) { lastDay = e.d; diary += `<div class="day"><span>Day ${days.indexOf(e.d) + 1} · ${wd(e.d)}</span><a class="lnk" onclick="App.newEntry('${i.id}', '${e.d}')">+ Add to this day</a></div>`; }
      const ph = e.photos[0];
      diary += `<div class="entry ${ph ? '' : 'nophoto'}${e.id === flashId ? ' new' : ''}" onclick="App.openPhoto('${e.id}')">${ph ? photoPh(ph, Data.photoKey(ph), '', e.photos.length > 1 ? `data-n="${e.photos.length}"` : '') : ''}<div><span class="chip" style="border:0;padding-left:2px">${esc(e.time || '')}</span><p>${esc(e.note) || '<i style="color:var(--muted)">No note</i>'}</p>${condChips(e)}</div></div>`;
    });
    itemBody.innerHTML = `<div class="kpis" id="itemKpis">${itemKpisHtml(i)}</div>
      <div class="card"><h3>Photos and notes <small>${days.length ? `${days.length} day${days.length > 1 ? 's' : ''} · ${nPhotos} photo${nPhotos === 1 ? '' : 's'}` : 'none yet'}</small></h3>
        <button class="btn" onclick="App.newEntry('${i.id}')">${ic('camera')}Add a photo to ${esc(i.n)}</button>
        ${es.length ? diary : `<p class="hint" style="margin:10px 0 0">No photos for ${esc(i.n)} yet. The first one starts Day 1.</p>`}</div>
      <div class="card" data-item="${i.id}"><div class="row" style="border:0;padding:0 0 4px"><div class="l"><b>Progress</b><small>budget ${fmt$(i.b)} · earned <span class="earnedLbl">${fmt$(earned)}</span></small></div><div class="r"><b class="pctLbl">${i.pct || 0}%</b></div></div>${slider(i)}<div class="status">${statusChips(i)}</div></div>
      <div class="card" id="itemCosts">${itemCostsHtml(i)}</div>
      <button class="btn danger" onclick="App.deleteItem('${i.id}')">${ic('trash')}Delete line item</button>`;
    hydrate(itemBody, p);
    itemBody.querySelectorAll('.ph[data-n]').forEach(el => { const b = document.createElement('span'); b.className = 'n'; b.textContent = '+' + (el.dataset.n - 1); el.appendChild(b); });
  }
  function itemKpis(i) { const k = document.getElementById('itemKpis'); if (k) k.innerHTML = itemKpisHtml(i); const e = document.querySelector('[data-item] .earnedLbl'); if (e) e.textContent = fmt$(Data.itemEarned(i)); }
  function itemCosts(i) { const c = document.getElementById('itemCosts'); if (c) c.innerHTML = itemCostsHtml(i); }

  function itemform(p, i) {
    itemformBody.innerHTML = `<div class="card">
      <label>Name</label><input class="in" id="ifName" value="${esc(i.n || '')}" placeholder="e.g. Framing">
      <label>Budget</label><input class="in" type="number" inputmode="decimal" id="ifBudget" value="${esc(i.b || '')}" placeholder="$">
      <div class="in2"><div><label>Start</label><input class="in" type="date" id="ifStart" value="${esc(i.s || p.start || '')}"></div><div><label>Finish</label><input class="in" type="date" id="ifEnd" value="${esc(i.e || p.finish || '')}"></div></div></div>
      <button class="btn" onclick="App.saveItem()">${ic('check')}${i.id ? 'Save changes' : 'Add line item'}</button>`;
  }

  function report(p, k) {
    const items = p.items || [], pics = sortedEntries(p).flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 3);
    const html = `<div class="report" id="reportPreview"><div class="hd"><div class="mark">CT</div><div><h4>${esc(p.name || 'Untitled project')}</h4><div class="meta">Progress report · ${Data.mdy(Data.iso(Data.today()))}${p.client ? ' · for ' + esc(p.client) : ''}</div></div></div>
      <div class="num4"><div><b>${Math.round(k.pct * 100)}%</b><span>complete</span></div><div><b>${Data.fmtK(k.cost)}</b><span>cost so far</span></div><div><b>${Data.fmtK(k.toGo)}</b><span>to finish</span></div><div><b>${k.daysLeft}</b><span>days left</span></div></div>
      <p><b>Summary.</b> ${p.cover.head ? esc(p.cover.head) + '. ' : ''}${!k.total ? 'No line items yet. Add budgets on the Progress screen and this report fills itself in.' : `${k.ahead ? 'Work is ahead of the calendar' : 'Work is behind the calendar'} (${Math.round(k.pct * 100)}% done with ${Math.round(k.schedPct * 100)}% of the schedule used). Costs are ${k.cost > k.earned ? 'running ' + fmt$(k.cost - k.earned) + ' over earned value' : 'tracking ' + fmt$(k.earned - k.cost) + ' under earned value'}.${k.pct > 0 ? ' At the current pace the job finishes ' + md(Data.iso(k.paceFinish)) + '.' : ''}`}</p>
      <table class="sov"><tr><td><b>Line item</b></td><td class="n"><b>Budget</b></td><td class="n"><b>%</b></td><td class="n"><b>Cost</b></td></tr>${items.map(i => `<tr><td>${esc(i.n)}</td><td class="n">${fmt$(i.b)}</td><td class="n">${i.pct || 0}%</td><td class="n">${fmt$(Data.itemCost(i))}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="n">${fmt$(k.total)}</td><td class="n">${Math.round(k.pct * 100)}%</td><td class="n">${fmt$(k.cost)}</td></tr></table>
      ${pics.length ? `<p style="margin-top:12px"><b>Recent photos</b></p><div class="grid3">${pics.map(({ ph }) => photoPh(ph, Data.photoKey(ph))).join('')}</div>` : ''}
      ${p.cover.note ? `<p>${esc(p.cover.note)}</p>` : ''}</div>
      <div class="actions" style="margin-top:12px"><button class="btn" onclick="App.openShare('report')">${ic('share')}Share</button><button class="btn q" onclick="App.shareDo('print','report')">${ic('file')}Print / PDF</button></div>
      <p class="hint">Same numbers as the dashboard, laid out as one page to hand to an owner, a lender or an inspector.</p>`;
    reportBody.innerHTML = html; hydrate(reportBody, p); return pics;
  }

  return { ic, esc, hydrate, coverSelection, projects, projform, home, log, applyLogFilter, entryform, entryPhotos, photo, photoSwap, moveSheet, cover, coverCtl, sov, sovSummary, itemSlider, item, itemKpis, itemCosts, itemform, report, sortedEntries, itemName };
})();
