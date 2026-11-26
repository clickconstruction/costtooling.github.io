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
    alert:'<path d="M12 3.5l9.5 17h-19z"/><path d="M12 10v5M12 17.8v.4"/>',
    bill:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  };
  const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { fmt$, md, wd } = Data;
  const WX = { sun: 'Sunny', cloud: 'Cloudy', rain: 'Rain', wind: 'Windy' };
  const itemOf = (p, id) => (p.items || []).find(i => i.id === id);
  const itemName = (p, id) => (itemOf(p, id) || {}).n || '';
  const condChips = e => { const out = []; if (e.wx) out.push(`<span class="chip">${ic(e.wx, 14)}${e.temp !== '' && e.temp != null ? esc(e.temp) + '°' : WX[e.wx]}</span>`); if (e.crew) out.push(`<span class="chip">${ic('users', 14)}${esc(e.crew)} on site</span>`); return out.join(''); };
  const sortedEntries = p => (p.entries || []).slice().sort((a, b) => (b.d + (b.ts || 0)).localeCompare(a.d + (a.ts || 0)) || (b.ts || 0) - (a.ts || 0));
  const photoPh = (ph, key, extra, attrs) => `<div class="ph ${extra || ''}" data-ph="${esc(key)}" ${attrs || ''}></div>`;
  // ---------- plain words: one name per thing, on every screen ----------
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  /** "today", "yesterday" or "on Nov 21". */
  const when = d => { const n = Math.round((Data.today() - Data.parse(d)) / Data.DAY); return n === 0 ? 'today' : n === 1 ? 'yesterday' : 'on ' + md(d); };
  const pctOf = i => +i.pct || 0;
  /** How far along a part is, in words, with the exact percent when it is between the ends: "Nearly done · 85%". */
  const wordPct = i => { const v = pctOf(i); return Data.word(v) + (v > 0 && v < 100 ? ' · ' + v + '%' : ''); };
  const photoCount = (p, itemId) => (p.entries || []).filter(e => (e.itemId || '') === itemId).reduce((a, e) => a + e.photos.length, 0);
  /** How much of the whole job is done, 0 to 1: by budget, or by a plain average when no part has a budget. */
  const doneFrac = (p, k) => { const items = p.items || []; return k.total ? k.pct : items.length ? items.reduce((a, i) => a + pctOf(i), 0) / items.length / 100 : 0; };

  /** Fill photo placeholders with real elements. */
  function hydrate(root, p, extra) {
    const map = {}; Data.allPhotos(p).forEach(({ ph }) => { map[Data.photoKey(ph)] = ph; }); (extra || []).forEach(ph => { map[Data.photoKey(ph)] = ph; });
    root.querySelectorAll('[data-ph]').forEach(el => { const ph = map[el.dataset.ph]; if (!ph) return; el.prepend(Photos.el(ph, el.dataset.size || 'thumb')); });
  }

  /** The schedule. The full one puts each part's name on its own line above its bar, so the words stay large on a phone. */
  function gantt(p, mini) {
    const items = (p.items || []).filter(i => i.s && i.e); if (!items.length) return '';
    const T = Data.today(), start = Data.parse(p.start), finish = Data.parse(p.finish);
    const L = 4, R = 336, Tp = mini ? 22 : 28, rowH = mini ? 4.2 : 46;
    const x = dt => L + (R - L) * Math.min(1, Math.max(0, (dt - start) / Math.max(1, finish - start)));
    let s = '';
    for (let m = new Date(start.getFullYear(), start.getMonth() + 1, 1); m < finish; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) s += `<line x1="${x(m)}" y1="${Tp - 6}" x2="${x(m)}" y2="${Tp + rowH * items.length}" stroke="#e2dfd6"/><text x="${x(m) + 3}" y="${Tp - 9}" font-size="15" fill="#57564f">${m.toLocaleDateString('en-US', { month: 'short' })}</text>`;
    items.forEach((i, r) => { const y = Tp + r * rowH, s0 = Data.parse(i.s), e0 = Data.parse(i.e); const late = i.pct < 100 && e0 < T; const col = i.pct === 100 ? '#2f7d4f' : late ? '#b3261e' : i.pct > 0 ? '#e8c547' : '#d9d6cc';
      if (!mini) s += `<text x="${L}" y="${y + 18}" font-size="15" fill="#161617" stroke="#fff" stroke-width="4" paint-order="stroke">${esc(i.n.length > 24 ? i.n.slice(0, 23) + '…' : i.n)}</text><text x="${R}" y="${y + 18}" font-size="15" text-anchor="end" fill="#57564f" stroke="#fff" stroke-width="4" paint-order="stroke">${esc(Data.word(i.pct))}</text>`;
      const bh = mini ? 3 : 12, by = mini ? y : y + 26;
      s += `<rect x="${x(s0)}" y="${by}" width="${Math.max(2, x(e0) - x(s0))}" height="${bh}" rx="${mini ? 1 : 3}" fill="#d9d6cc"/>`;
      if (i.pct > 0) s += `<rect x="${x(s0)}" y="${by}" width="${Math.max(2, (x(e0) - x(s0)) * i.pct / 100)}" height="${bh}" rx="${mini ? 1 : 3}" fill="${col}"/>`; });
    const end = Tp + rowH * items.length;
    if (T >= start && T <= finish) s += `<line x1="${x(T)}" y1="${Tp - 4}" x2="${x(T)}" y2="${end}" stroke="#161617" stroke-width="1.5" stroke-dasharray="3 2"/><text x="${Math.max(44, x(T) - 2)}" y="${end + 17}" font-size="15" text-anchor="end" fill="#161617" font-weight="700">today</text>`;
    return `<svg class="gantt" viewBox="0 0 340 ${end + 24}" role="img" aria-label="Schedule">${s}</svg>`;
  }

  // ---------- screens ----------
  /** The job list: the jobs first, then a new job, then saving to the cloud. */
  function projects(S) {
    const list = S.projects.map(p => ({ p, k: Data.calc(p) }));
    const html = (list.length ? `<p class="lead">Tap a job to open it.</p>` + list.map(({ p, k }) => { const frac = doneFrac(p, k); return `<button class="card tap job ${p.sample ? 'sample' : ''}" onclick="App.openProject('${p.id}')">
        <b class="name">${esc(p.name || 'Untitled job')}</b>
        <small>${p.sample ? 'A sample job to practise on' : esc(p.client || '')}</small>
        <span class="bar"><i style="width:${Math.round(frac * 100)}%"></i></span>
        <small>${!(p.items || []).length ? 'No parts yet.' : Data.doneSentence(frac)}${k.hasBill && k.aheadItems.length ? ' <span class="aheadTxt">The bill says more than you saw.</span>' : ''}</small></button>`; }).join('')
      : `<div class="empty">${ic('folder', 36)}No jobs yet.</div>`) +
      `<button class="btn q" onclick="App.newProject()">${ic('plus')}Start a new job</button>` +
      (S.projects.some(p => p.sample) ? '' : `<button class="btn q" style="margin-top:10px" onclick="App.restoreSample()">Bring back the sample job</button>`) +
      (window.Cloud ? `<div style="margin-top:14px">${Cloud.promoHtml()}</div>` : '');
    projectsBody.innerHTML = html;
  }

  function projform(p, tpl) {
    const isNew = !p.id; const T = Data.iso(Data.today());
    // On an iPhone in Safari, a real job should wait until the app is on the Home Screen: say so where real jobs start.
    const install = isNew && App.needsInstall() ? `<div class="notice flat" style="margin:0 0 12px"><b style="margin:0 0 4px">First, put CostTooling on your Home Screen</b>1. Tap the Share button at the bottom of Safari. 2. Tap Add to Home Screen. 3. Open CostTooling from that new picture, then start your job there. Safari can clear a website’s saved work after a few weeks; from the Home Screen your jobs stay put.</div>` : '';
    projformBody.innerHTML = install + `<div class="card">
      <label for="pfName">Name of the job</label><input class="in" id="pfName" value="${esc(p.name || '')}" placeholder="e.g. Oak St porch">
      <label for="pfClient">Who is paying for it?</label><input class="in" id="pfClient" value="${esc(p.client || '')}" placeholder="The owner’s name, or yours">
      <label for="pfAddr">Address</label><input class="in" id="pfAddr" value="${esc(p.addr || '')}" placeholder="Where the job is">
      <div class="in2"><div><label for="pfStart">Start</label><input class="in" type="date" id="pfStart" value="${esc(p.start || T)}"></div><div><label for="pfFinish">Finish</label><input class="in" type="date" id="pfFinish" value="${esc(p.finish || Data.iso(Data.addDays(Data.today(), 60)))}"></div></div>
      ${isNew ? `<label for="pfContract">Total price of the job, if you know it</label><input class="in" type="number" inputmode="decimal" id="pfContract" placeholder="$"><p class="hint">We share it out across the parts as a first guess. Change each part’s budget to match the contractor’s bill.</p>` : ''}
    </div>` + (isNew ? `<div class="card"><h3>Start with a list of parts</h3><p class="hint" style="margin:-4px 0 10px">You can change them later.</p><div class="tpl">${Object.entries(Data.TEMPLATES).map(([k, t]) => `<div class="${k === tpl ? 'on' : ''}" onclick="App.pickTemplate('${k}')"><b>${esc(t.name)}</b><span>${esc(t.note)}</span></div>`).join('')}</div></div>` : '') +
      `<button class="btn" onclick="App.saveProject()">${ic('check')}${isNew ? 'Create this job' : 'Save'}</button>` +
      (isNew ? '' : `<button class="btn danger" style="margin-top:10px" onclick="App.deleteProject()">${ic('trash')}Delete this job</button>`);
  }

  /** A job's first screen: one sentence on how it is going, the bill warning in words, then four steps in the order of a site visit. */
  function home(p, k) {
    const items = p.items || [], sorted = sortedEntries(p), nPhotos = Data.allPhotos(p).length;
    const latest = sorted.flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 8);
    const lastPhoto = sorted.find(e => e.photos.length), started = items.filter(i => pctOf(i) > 0).length;
    const n = k.aheadItems.length, billedAt = items.map(i => (Data.hasBill(i) && i.billedAt) || '').sort().pop();
    const frac = doneFrac(p, k);
    const notice = !n ? '' : `<button class="notice" id="checkCard" onclick="${n === 1 ? `App.openItem('${k.aheadItems[0].id}')` : `App.go('bill')`}">${k.total && k.billedAhead > 0 ? `The contractor has billed ${fmt$(k.billedAhead)} more than you saw.` : `The contractor has billed more than you saw on ${plural(n, 'part')}.`}<b>${n === 1 ? 'See which part' : 'See which parts'}${ic('chevr', 18)}</b></button>`;
    const step = (num, title, sub, act) => `<button class="step" onclick="${act}"><i>${num}</i><span><b>${title}</b><small>${sub}</small></span>${ic('chevr', 20)}</button>`;
    const day = k.dated ? `Day ${Math.max(1, Math.round(k.elapsed))} of ${Math.round(k.span)}` : 'no dates yet';
    // The numbers are one tap away. The builder's cost numbers are not here: they are on the Parts tab.
    const tiles = `<div class="kpi">${ic('trend')}<b>${Math.round(frac * 100)}%</b><span>of the work is done</span><em>${day}</em></div>` +
      (k.hasBill ? `<div class="kpi light">${ic('bill')}<b>${k.total ? Math.round(k.billedPct * 100) + '%' : '—'}</b><span>is what the bill says</span><em>${k.total ? fmt$(k.billed) + ' of ' + fmt$(k.total) : 'no budgets yet'}</em></div>
      <div class="kpi ${n ? 'warn' : 'light'}">${ic(n ? 'alert' : 'check')}<b>${k.billedAhead > 0 || !n ? fmt$(k.billedAhead) : n}</b><span>${k.billedAhead > 0 || !n ? 'billed more than you saw' : 'part' + (n === 1 ? '' : 's') + ' billed more than you saw'}</span><em>${n ? plural(n, 'part') + ' to check' : 'nothing to check'}</em></div>` : '') +
      `<div class="kpi light">${ic('clock')}<b>${k.daysLeft ?? '—'}</b><span>days left</span><em>${k.dated ? 'due ' + md(p.finish) : 'no dates yet'}</em></div>`;
    homeBody.innerHTML = `<div class="say">${!items.length ? 'This job has no parts yet.' : Data.doneSentence(frac)}</div>${notice}
      <div class="steps">
        ${step(1, 'Take photos', nPhotos ? `${nPhotos} so far. The last one was ${when(lastPhoto.d)}.` : 'None yet. Start here.', 'App.newEntry()')}
        ${step(2, 'Mark what you saw', items.length ? `${started} of ${plural(items.length, 'part')} started.` : 'No parts yet. Add them here.', "App.go('sov')")}
        ${step(3, 'Type in the bill', billedAt ? `Last typed ${when(billedAt)}.` : 'Nothing typed in yet.', "App.go('bill')")}
        ${step(4, 'Send the owner one page', 'Photos and numbers, ready to text.', "App.go('report')")}
      </div>
      <div class="card"><h3>Latest photos</h3>${latest.length ? `<div class="strip">${latest.map(({ ph, e }) => photoPh(ph, Data.photoKey(ph), '', `onclick="App.openPhoto('${e.id}','${Data.photoKey(ph)}')"`)).join('')}</div>` : `<p class="hint" style="margin:0">No photos yet. Tap Take photos to add the first one.</p>`}</div>
      <details class="card fold" id="numbers"><summary><h3>The numbers</h3>${ic('chevr', 18)}</summary><div class="foldBody"><div class="kpis">${tiles}</div>${items.length ? `<button class="btn q" onclick="App.openGantt()">${ic('calendar')}See the schedule</button>` : ''}</div></details>
      <button class="btn q" onclick="App.editProject()">${ic('edit')}Change this job’s name or dates</button>`;
    hydrate(homeBody, p);
  }

  /** A day header on the Photos tab: the job day when the date is on or after the start, then the date. */
  const dayLabel = (p, d) => { const n = Data.jobDay(p, d); return (n ? 'Day ' + n + ' · ' : '') + wd(d); };
  const dayCount = n => n ? plural(n, 'photo') : 'note only';
  /** Is a photo under the Photos tab's filter? 'all' takes every one, 'none' the ones with no part, anything else is a part's id. */
  const inFilter = (itemId, filter) => filter === 'all' || (filter === 'none' ? !itemId : itemId === filter);
  function log(p, filter) {
    const items = p.items || [], every = p.entries || [];
    // Every part is in the list with its photo count, so a new part is visible here before its first photo.
    const opt = (id, name, n) => `<option value="${id}" data-name="${esc(name)}" ${filter === id ? 'selected' : ''}>${esc(name)} (${n})</option>`;
    let html = `<button class="btn" id="logAdd" onclick="App.newEntry()">${ic('camera')}Add a photo</button>` +
      (items.length ? `<label for="logPick" style="margin-top:12px">Show photos of</label><select class="in" id="logPick" onchange="App.filterLog(this.value)">${opt('all', 'Every part', Data.allPhotos(p).length)}${items.map(i => opt(i.id, i.n, photoCount(p, i.id))).join('')}${every.some(e => !e.itemId) ? opt('none', 'No part picked', photoCount(p, '')) : ''}</select>` : '');
    html += `<div class="empty" id="logEmpty" style="display:none">${ic('camera', 36)}<span id="logEmptyText"></span><br><button class="btn sm" id="logEmptyBtn" style="margin-top:12px"></button></div>`;
    const all = sortedEntries(p); let lastDay = '';
    all.forEach(e => {
      const show = inFilter(e.itemId, filter);
      if (e.d !== lastDay) { lastDay = e.d; html += `<div class="day" data-day="${e.d}"><span>${dayLabel(p, e.d)}</span><span class="dayN"></span></div>`; }
      const ph = e.photos[0];
      html += `<div class="entry ${ph ? '' : 'nophoto'}" data-day="${e.d}" data-item="${esc(e.itemId || '')}" data-photos="${e.photos.length}" style="display:${show ? '' : 'none'}" onclick="App.openPhoto('${e.id}')">${ph ? photoPh(ph, Data.photoKey(ph), '', e.photos.length > 1 ? `data-n="${e.photos.length}"` : '') : ''}<div>${e.itemId ? `<span class="chip k">${esc(itemName(p, e.itemId))}</span>` : '<span class="chip z">No part picked</span>'}<span class="time">${esc(e.time || '')}</span><p>${esc(e.note) || '<i style="color:var(--muted)">No note</i>'}</p>${condChips(e)}</div></div>`;
    });
    logBody.innerHTML = html; hydrate(logBody, p);
    logBody.querySelectorAll('.ph[data-n]').forEach(el => { const b = document.createElement('span'); b.className = 'n'; b.textContent = '+' + (el.dataset.n - 1); el.appendChild(b); });
    applyLogFilter(filter);
  }
  /** Show and hide photos and day headers in place. */
  function applyLogFilter(filter) {
    const pick = document.getElementById('logPick'); if (pick && pick.value !== filter) pick.value = filter;
    let visible = 0; const perDay = {}, shown = {};
    logBody.querySelectorAll('.entry').forEach(e => { const show = inFilter(e.dataset.item, filter); e.style.display = show ? '' : 'none'; if (show) { visible++; shown[e.dataset.day] = 1; perDay[e.dataset.day] = (perDay[e.dataset.day] || 0) + (+e.dataset.photos || 0); } });
    logBody.querySelectorAll('.day').forEach(h => { h.style.display = shown[h.dataset.day] ? '' : 'none'; h.querySelector('.dayN').textContent = dayCount(perDay[h.dataset.day] || 0); });
    const empty = document.getElementById('logEmpty'); if (!empty) return;
    empty.style.display = visible ? 'none' : '';
    if (visible) return;
    // A part with no photos yet offers one that already belongs to it.
    const o = pick && pick.selectedOptions[0], item = filter !== 'all' && filter !== 'none' ? filter : '', name = item && o ? o.dataset.name : '';
    document.getElementById('logEmptyText').textContent = item ? `No photos of ${name} yet.` : 'No photos yet.';
    const btn = document.getElementById('logEmptyBtn'); btn.innerHTML = ic('camera') + (item ? `Add a photo of ${esc(name)}` : 'Add the first photo'); btn.onclick = () => App.newEntry(item);
  }

  /** Saving a photo asks three things: the photo, which part, and a note. The weather, the people on site and the date fold under More details. */
  function entryform(p, f) {
    const items = p.items || [], more = !!(f.wx || (f.temp !== '' && f.temp != null) || f.crew);
    entryBody.innerHTML = `<div class="card">
      <h3>${f.id ? (f.photos.length ? 'Change this photo' : 'Change this note') : 'Add a photo'} <small>${wd(f.d)}${f.time ? ' · ' + esc(f.time) : ''}</small></h3>
      <div class="pend" id="pendGrid">${entryPhotosHtml(f)}</div>
      <p class="hint" style="margin:0 0 6px" id="pendHint">Take a photo, or pick ones you were texted.</p>
      <label for="efItem">Which part of the job is it?</label>${items.length
        ? `<select class="in${f.itemId ? '' : ' pick'}" id="efItem" onchange="this.classList.toggle('pick', !this.value)"><option value="">Pick a part…</option>${items.map(i => `<option value="${i.id}" ${i.id === f.itemId ? 'selected' : ''}>${esc(i.n)}</option>`).join('')}</select>`
        : `<p class="hint" style="margin:0 0 4px">This job has no parts yet. Add them on the Parts tab, then pick one here.</p>`}
      <label for="efNote">A note, if you like</label><textarea class="in" id="efNote" placeholder="What does the photo show?">${esc(f.note)}</textarea>
      <details class="more" id="efMore" ${more ? 'open' : ''}><summary>More details${ic('chevr', 18)}</summary>
        <label>Weather</label>
        <div class="seg" id="efWx">${['sun', 'cloud', 'rain', 'wind'].map(w => `<button class="${f.wx === w ? 'on' : ''}" onclick="App.setWx('${w}')">${ic(w, 16)}${WX[w]}</button>`).join('')}</div>
        <div class="in2" style="margin-top:8px"><div><label for="efTemp">Temperature °F</label><input class="in" type="number" inputmode="numeric" id="efTemp" value="${esc(f.temp)}" placeholder="—"></div><div><label for="efCrew">People on site</label><input class="in" type="number" inputmode="numeric" id="efCrew" value="${esc(f.crew)}" placeholder="—"></div></div>
        <label for="efDate">Date</label><input class="in" type="date" id="efDate" value="${esc(f.d)}">
      </details>
    </div>
    <div class="stack"><button class="btn" onclick="App.saveEntry()">${ic('check')}Save</button>
      <div style="display:flex;gap:8px">${f.id ? '' : `<button class="btn q" onclick="App.saveEntry(true)">${ic('camera')}Save and add another</button>`}<button class="btn q" style="${f.id ? '' : 'width:auto'}" onclick="App.cancelEntry()">Cancel</button></div></div>`;
    hydrate(entryBody, p, f.photos);
  }

  const entryPhotosHtml = f => f.photos.map((ph, i) => `<div class="ph" data-ph="${esc(Data.photoKey(ph))}"><button class="x" aria-label="Remove this photo" onclick="event.stopPropagation(); App.removeFormPhoto(${i})"><i>${ic('x', 14)}</i></button></div>`).join('') + `<div class="ph add cam" role="button" onclick="App.cam()">${ic('camera', 26)}Take a photo</div><div class="ph add gal" role="button" onclick="App.gal()">${ic('image', 24)}Pick photos</div>`;
  function entryPhotos(p, f) { const g = document.getElementById('pendGrid'); if (!g) return; g.innerHTML = entryPhotosHtml(f); hydrate(g, p, f.photos); }

  function photo(p, e, idx) {
    const ph = e.photos[idx], it = itemOf(p, e.itemId), n = e.photos.length;
    photoBody.innerHTML = `${ph ? `<div class="photo-big" id="photoBig" data-ph="${esc(Data.photoKey(ph))}" data-size="full"><div class="stamp">${wd(e.d)}${e.time ? ' · ' + esc(e.time) : ''}</div></div>` : ''}
      ${n > 1 ? `<div class="strip" id="photoStrip" style="margin-bottom:12px">${e.photos.map((q, i) => photoPh(q, Data.photoKey(q), i === idx ? 'sel' : '', `data-idx="${i}" onclick="App.photoIdx(${i})"`)).join('')}</div>` : ''}
      <div class="card"><p style="margin:0 0 8px;font-size:17px">${esc(e.note) || '<i style="color:var(--muted)">No note</i>'}</p>
        ${it ? `<div class="row tap" onclick="App.openItem('${it.id}')"><div class="l"><b>${esc(it.n)}</b><small>part of the job · ${wordPct(it).toLowerCase()}</small></div><span class="chev">${ic('chevr', 18)}</span></div>` : ''}
        ${e.wx || e.crew ? `<div class="row" style="border:0"><div class="l"><small>Weather and people</small><div>${condChips(e)}</div></div></div>` : ''}
        ${p.addr ? `<div class="row" style="border:0;padding-top:0"><div class="l"><small>Place</small><div><span class="chip">${ic('pin', 14)}${esc(p.addr)}</span></div></div></div>` : ''}</div>
      <div class="stack"><button class="btn" onclick="App.openMove()">${ic('move')}Move it to another part</button>
        <button class="btn q" onclick="App.editEntry('${e.id}')">${ic('edit')}${n ? 'Change this photo' : 'Change this note'}</button>
        ${ph ? `<button class="btn q" onclick="App.usePhotoOnCover()">${ic('image')}Use it in the picture to text</button>` : ''}
        <button class="btn danger" onclick="App.deleteEntry('${e.id}')">${ic('trash')}${n > 1 ? `Delete these ${n} photos` : n ? 'Delete this photo' : 'Delete this note'}</button></div>`;
    hydrate(photoBody, p);
  }
  function photoSwap(p, e, idx) {
    const big = document.getElementById('photoBig'); if (!big) return; const ph = e.photos[idx]; if (!ph) return;
    big.querySelectorAll('img, canvas').forEach(n => n.remove()); big.dataset.ph = Data.photoKey(ph); big.prepend(Photos.el(ph, 'full'));
    document.querySelectorAll('#photoStrip .ph').forEach(el => el.classList.toggle('sel', +el.dataset.idx === idx));
  }

  // ---------- a picture to text: one image with up to four photos, reached from Send ----------
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
    coverBody.innerHTML = `<div class="stack"><button class="btn" onclick="App.openShare('cover')">${ic('send')}Send this picture</button><button class="btn q" onclick="App.saveCover()">${ic('download')}Save it to my photos</button></div>
      <p class="hint">One picture you can text to the owner.</p>
      <div class="card" style="margin-top:12px"><h3>Photos <small>tap to pick up to 4</small></h3>${all.length ? `<div class="grid3" id="coverGrid">${all.map(({ ph, e }) => photoPh(ph, Data.photoKey(ph), picked.includes(Data.photoKey(ph)) ? 'sel' : '', `onclick="App.coverPick('${Data.photoKey(ph)}')"`)).join('')}</div>` : `<p class="hint" style="margin:0">No photos yet. Add some and they show up here.</p>`}</div>
      <div class="card" id="coverCtl">${coverCtlHtml(cv)}</div>`;
    hydrate(coverBody, p);
    return coverSelection(p);
  }
  const coverCtlHtml = cv => `<label>How many photos</label><div class="seg" id="coverLayoutSeg">${[['hero', 'One'], ['split', 'Three'], ['grid', 'Four']].map(([l, n]) => `<button class="${cv.layout === l ? 'on' : ''}" data-l="${l}" onclick="App.coverLayout('${l}')">${n}</button>`).join('')}</div>
        <label for="cvHead">Words at the top</label><input class="in" id="cvHead" value="${esc(cv.head)}" oninput="App.coverField('head', this.value)">
        <label for="cvDate">Date</label><input class="in" id="cvDate" value="${esc(cv.date || Data.mdy(Data.iso(Data.today())))}" oninput="App.coverField('date', this.value)">
        <label>Numbers</label><div class="seg"><button class="${cv.numMode !== 'manual' ? 'on' : ''}" onclick="App.coverNum('auto')">From this job</button><button class="${cv.numMode === 'manual' ? 'on' : ''}" onclick="App.coverNum('manual')">Type my own</button></div>
        ${cv.numMode === 'manual' ? `<div class="in2"><div><label for="cvPct">% done</label><input class="in" id="cvPct" type="number" inputmode="numeric" value="${esc(cv.manual.pct)}" oninput="App.coverManual('pct', this.value)"></div><div><label for="cvDays">Days left</label><input class="in" id="cvDays" type="number" inputmode="numeric" value="${esc(cv.manual.days)}" oninput="App.coverManual('days', this.value)"></div></div><label for="cvToGo">$ to finish</label><input class="in" id="cvToGo" type="number" inputmode="decimal" value="${esc(cv.manual.toGo)}" oninput="App.coverManual('toGo', this.value)">` : ''}
        <label for="cvNote">A note at the bottom</label><input class="in" id="cvNote" value="${esc(cv.note)}" oninput="App.coverField('note', this.value)">`;
  function coverCtl(cv) { const c = document.getElementById('coverCtl'); if (c) c.innerHTML = coverCtlHtml(cv); }

  // ---------- Parts: the list of parts, each a door to its own screen; the builder's numbers sit under the list ----------
  const sumRow = (label, val, cls) => `<div class="row" style="border:0;padding:6px 0 0"><div class="l"><small${cls ? ` class="${cls}"` : ''}>${label}</small></div><div class="r${cls ? ' ' + cls : ''}">${val}</div></div>`;
  const sovSummaryHtml = (p, k) => { const n = (p.items || []).length, pc = Math.round(k.pct * 100); return `<h3>The numbers</h3><div class="row" style="border:0;padding:0"><div class="l"><b>The whole job</b><small>${plural(n, 'part')}</small></div><div class="r"><b>${fmt$(k.total)}</b></div></div>` + (k.hasBill
    ? sumRow('What you saw done', `${fmt$(k.earned)} (${pc}%)`) + sumRow('What the bill says', `${fmt$(k.billed)} (${Math.round(k.billedPct * 100)}%)`) + (k.aheadItems.length ? sumRow('Billed more than you saw, part by part', k.billedAhead > 0 ? fmt$(k.billedAhead) : plural(k.aheadItems.length, 'part'), 'aheadTxt') : '')
    : sumRow('Work done so far', `${fmt$(k.earned)} (${pc}%)`) + sumRow('Cost so far', fmt$(k.cost)) + sumRow('Cost to finish', fmt$(k.toGo))); };
  const partRowHtml = (p, i) => { const c = photoCount(p, i.id); return `<button class="card tap part" data-item="${i.id}" onclick="App.openItem('${i.id}')"><span class="l"><b>${esc(i.n)}</b><small>${wordPct(i)} · ${c ? plural(c, 'photo') : 'no photos yet'}</small>${Data.billState(i) === 'ahead' ? `<small class="aheadTxt">The bill says ${Data.fmtPct(Data.itemBilledPct(i))}</small>` : ''}<span class="mini"><i style="width:${pctOf(i)}%"></i></span></span>${ic('chevr', 20)}</button>`; };
  const sovItemsHtml = (p, k) => { const items = p.items || []; return items.length
    ? `<p class="lead">Tap a part. Then tap the words that fit what you saw.</p>` + items.map(i => partRowHtml(p, i)).join('') + `<button class="btn q" onclick="App.newItem()">${ic('plus')}Add a part</button><div class="card" id="sovSummary" style="margin-top:12px">${sovSummaryHtml(p, k)}</div>`
    : `<div class="empty">${ic('folder', 36)}This job has no parts yet.<br><button class="btn sm" style="margin-top:12px" onclick="App.newItem()">${ic('plus')}Add a part</button></div>`; };
  const ganttHtml = (p, k) => { const items = p.items || []; const diff = Math.round((k.paceFinish - Data.parse(p.finish)) / Data.DAY); return `<div class="card"><h3>Schedule <small>${p.start ? md(p.start) + ' to ' + md(p.finish) : ''}</small></h3>${items.length ? gantt(p, false) : '<p class="hint" style="margin:0">Add parts with dates to see a schedule.</p>'}<div class="legend"><span><i style="background:#d9d6cc"></i>planned</span><span><i style="background:var(--green)"></i>done</span><span><i style="background:var(--yellow)"></i>started</span><span><i style="background:var(--red)"></i>late</span></div></div>
        <div class="card"><h3>When it will finish</h3><div class="row"><div class="l"><b>The plan says</b></div><div class="r">${p.finish ? md(p.finish) : '—'}</div></div><div class="row"><div class="l"><b>At this pace</b><small>${k.dated && k.pct > 0 ? (diff > 0 ? diff + ' days late' : diff < 0 ? Math.abs(diff) + ' days early' : 'on time') : 'nothing marked done yet'}</small></div><div class="r">${k.dated && k.pct > 0 ? md(Data.iso(k.paceFinish)) : '—'}</div></div><div class="row"><div class="l"><b>Days used</b></div><div class="r">${Math.round(k.elapsed)} of ${Math.round(k.span)}</div></div></div>`; };
  function sov(p, k, mode) {
    const show = m => `style="display:${mode === m ? '' : 'none'}"`;
    sovBody.innerHTML = `<div class="seg big" id="modeSeg">${[['items', 'Parts'], ['gantt', 'Schedule']].map(([m, n]) => `<button class="${mode === m ? 'on' : ''}" data-m="${m}" onclick="App.setMode('${m}')">${n}</button>`).join('')}</div>
      <div id="modeItems" ${show('items')}>${sovItemsHtml(p, k)}</div><div id="modeGantt" ${show('gantt')}>${ganttHtml(p, k)}</div>`;
  }

  // ---------- Bill: where to find the number on the contractor's bill, then one percent per part ----------
  const billVal = i => Data.hasBill(i) ? Data.fmtPct(Data.itemBilledPct(i)) : '';
  const billAmt = i => Data.hasBill(i) && (+i.b || 0) ? fmt$(Data.itemBilled(i)) : '';
  const billSubHtml = i => `You saw: ${wordPct(i).toLowerCase()}` + (Data.billState(i) === 'ahead' ? `<span class="aheadTxt">The bill says more than you saw${(+i.b || 0) ? ', by ' + fmt$(Data.itemAhead(i)) : ''}.</span>` : '');
  const billTotalHtml = k => `<div class="l"><b>The whole bill</b><small>You saw ${Math.round(k.pct * 100)}% done${k.aheadItems.length ? `<span class="aheadTxt">${k.billedAhead > 0 ? fmt$(k.billedAhead) : plural(k.aheadItems.length, 'part')} billed more than you saw</span>` : ''}</small></div><div class="r"><b>${k.total ? Math.round(k.billedPct * 100) + '%' : '—'}</b><small>${fmt$(k.billed)} of ${fmt$(k.total)}</small></div>`;
  /** A drawing of a contractor's bill with the column to copy ringed. Most bills follow the AIA G703 form. */
  const billPicHtml = `<div class="billpic" role="img" aria-label="A sample bill. The column marked percent is ringed."><div class="bp h"><span>Item</span><span>Total completed and stored to date</span><span>% (G ÷ C)</span></div><div class="bp"><span>Framing</span><span>$22,800</span><span>100%</span></div><div class="bp"><span>Roofing</span><span>$9,900</span><span>60%</span></div><i class="ring"></i></div>`;
  function bill(p, k) {
    const items = p.items || [];
    billBody.innerHTML = items.length ? `<div class="card" id="billHow"><h3>Find this on the contractor’s bill</h3>${billPicHtml}
        <p class="cap">Look for the column marked <b>%</b>. On most bills it is called “% (G ÷ C)” and sits beside “total completed and stored to date”. Copy that number for each part.</p>
        <p class="hint">That number also counts materials that are on site but not put in yet. So the bill can say a little more than you saw.</p></div>
      <div class="card" id="billCard"><h3>What the bill says</h3>
        <p class="cap">Type the percent or the dollars the bill shows for each part. Either one works: the other fills itself in.</p>
        <p class="hint" style="margin:0 0 4px">These are the totals so far, not this month’s amount. When a new bill comes, type over the old numbers. Leave a part empty until the contractor bills for it.</p>
        ${items.map(i => `<div class="billline" data-bill="${i.id}"><div class="l"><b>${esc(i.n)}</b><small class="billSub">${billSubHtml(i)}</small></div>${billPairHtml(i)}</div>`).join('')}
        <div class="row billtot" id="billTotal">${billTotalHtml(k)}</div></div>`
      : `<div class="empty">${ic('bill', 36)}This job has no parts yet.<br>Add them on the Parts tab, then type the bill here.</div>`;
  }

  // ---------- one part: how far along it is in words, what the bill says, its photos by day, its costs ----------
  const wordsHtml = i => { const v = pctOf(i), x = Data.wordIdx(v); return Data.WORDS.map((w, n) => `<button class="w${n === x ? ' on' : ''}" aria-pressed="${n === x}" onclick="App.setWord('${i.id}', ${n})">${w[0]}${n === x && v > 0 && v < 100 ? `<small>${v}%</small>` : ''}</button>`).join(''); };
  /** What to make of the bill against what was seen, in a sentence. Nothing until the part is billed. */
  const partNoteHtml = i => { const st = Data.billState(i), v = pctOf(i), b = Data.itemBilledPct(i);
    if (st === 'none') return '';
    if (st === 'ahead') return `<div class="notice flat">The bill says this part is ${b >= 100 ? 'finished' : Data.fmtPct(b) + ' done'}. You marked it ${Data.word(v).toLowerCase()}${v > 0 && v < 100 ? ' (' + v + '%)' : ''}.${(+i.b || 0) ? ' That is ' + fmt$(Data.itemAhead(i)) + ' more than you saw.' : ''}<span class="todo">Ask the contractor about it before you pay. It may be materials that are on site but not put in yet.</span></div>`;
    return `<p class="hint ok">${st === 'match' ? 'The bill matches what you saw.' : 'The bill says less than you saw. Nothing to check.'}</p>`; };
  const billNoteHtml = i => Data.hasBill(i) ? 'typed in' + (i.billedAt ? ' ' + when(i.billedAt) : '') : 'from the contractor’s bill';
  /** What the bill says, beside the words: a percent or an amount, whichever the bill shows. Each fills in the other. */
  /** The two boxes for what the bill says: a percent, or dollars. Each has its word, and each fills in the other. */
  const billPairHtml = i => { const b = +i.b || 0; return `<div class="pair"><label>Percent<input class="in" type="text" inputmode="decimal" autocomplete="off" data-k="pct" aria-label="Percent the bill says for ${esc(i.n)}" placeholder="%" value="${billVal(i)}" onchange="App.setBilled('${i.id}', 'pct', this.value)"></label><label>or dollars<input class="in amt" type="text" inputmode="decimal" autocomplete="off" data-k="amt" aria-label="Dollars the bill says for ${esc(i.n)}" placeholder="${b ? '$' : 'no budget yet'}" value="${billAmt(i)}" ${b ? '' : 'disabled'} onchange="App.setBilled('${i.id}', 'amt', this.value)"></label></div>`; };
  const billRowHtml = i => `<div class="billrow" data-billrow="${i.id}"><div class="l"><b>The bill says</b><small class="billNote">${billNoteHtml(i)}</small></div>${billPairHtml(i)}</div>`;
  const itemCostsHtml = i => { const cost = Data.itemCost(i); return `<div id="costRows">${(i.costs || []).map(c => `<div class="row"><div class="l"><b>${esc(c.desc)}</b><small>${c.date ? md(c.date) : ''}</small></div><div class="r">${fmt$(c.amt)}</div><button class="del" aria-label="Remove this cost" onclick="App.deleteCost('${i.id}','${c.id}')">${ic('x', 18)}</button></div>`).join('') || '<p class="hint" style="margin:0 0 8px">No costs typed in yet.</p>'}
        ${(i.costs || []).length ? `<div class="row" style="border:0"><div class="l"><b>Total</b></div><div class="r"><b>${fmt$(cost)}</b></div></div>` : ''}</div>
        <div style="border-top:1px solid var(--line);padding-top:10px;margin-top:6px"><div class="in2"><div><label for="cfDesc">What it was</label><input class="in" id="cfDesc" placeholder="e.g. Lumber"></div><div><label for="cfAmt">How much</label><input class="in" type="number" inputmode="decimal" id="cfAmt" placeholder="$"></div></div><label for="cfDate">Date</label><input class="in" type="date" id="cfDate" value="${Data.iso(Data.today())}"><button class="btn q sm" style="margin-top:10px" onclick="App.addCost('${i.id}')">${ic('plus')}Add cost</button></div>`; };
  /** Costs are what a builder spent. In a job with a bill they fold to one row at the bottom; in any other job the card is open, as it always was. */
  const costsCardHtml = (i, fold) => { const head = `Costs <small id="costTotal">${fmt$(Data.itemCost(i))} total</small>`; return fold ? `<details class="card fold" id="costFold"><summary><h3>${head}</h3>${ic('chevr', 18)}</summary><div id="itemCosts">${itemCostsHtml(i)}</div></details>` : `<div class="card"><h3>${head}</h3><div id="itemCosts">${itemCostsHtml(i)}</div></div>`; };
  /** The Move sheet: every part with its photo count and how far along it is; the part the photo is in now is marked, not tappable. */
  function moveSheet(p, e, mode) {
    const items = p.items || [], n = e.photos.length, one = mode === 'photo' && n > 1;
    const what = n > 1 ? 'All ' + n + ' photos' : n ? 'The photo' : 'The note', andNote = n && e.note ? ' and the note' : '';
    document.getElementById('moveHint').textContent = one ? `Just this photo moves. The note and the other photo${n > 2 ? 's' : ''} stay here.` : `${what}${andNote} from ${wd(e.d)} will move.`;
    const seg = document.getElementById('moveMode'); seg.style.display = n > 1 ? '' : 'none'; seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    const row = (id, name, sub) => id === (e.itemId || '') ? `<div class="row"><div class="l"><b>${esc(name)}</b><small>${sub}</small></div><span class="chip k">${ic('check', 14)}here now</span></div>` : `<div class="row tap" onclick="App.moveEntry('${id}')"><div class="l"><b>${esc(name)}</b><small>${sub}</small></div><span class="chev">${ic('chevr', 18)}</span></div>`;
    document.getElementById('moveList').innerHTML = items.map(i => { const c = photoCount(p, i.id); return row(i.id, i.n, (c ? plural(c, 'photo') : 'no photos yet') + ' · ' + wordPct(i).toLowerCase()); }).join('') + row('', 'No part', 'kept under Photos only');
  }

  /** One part of the job. First how far along it is, in words; then what the bill says; then its photos by day, Day 1 being its first, newest day first. flashId outlines a photo once. */
  function item(p, i, flashId) {
    const fold = (p.items || []).some(Data.hasBill);
    const es = sortedEntries(p).filter(e => e.itemId === i.id), days = Data.itemDays(p, i.id), nPhotos = es.reduce((a, e) => a + e.photos.length, 0);
    let diary = '', lastDay = '';
    es.forEach(e => {
      if (e.d !== lastDay) { lastDay = e.d; diary += `<div class="day"><span>Day ${days.indexOf(e.d) + 1} · ${wd(e.d)}</span><button class="lnk" onclick="App.newEntry('${i.id}', '${e.d}')">+ Add to this day</button></div>`; }
      const ph = e.photos[0];
      diary += `<div class="entry ${ph ? '' : 'nophoto'}${e.id === flashId ? ' new' : ''}" onclick="App.openPhoto('${e.id}')">${ph ? photoPh(ph, Data.photoKey(ph), '', e.photos.length > 1 ? `data-n="${e.photos.length}"` : '') : ''}<div><span class="time">${esc(e.time || '')}</span><p>${esc(e.note) || '<i style="color:var(--muted)">No note</i>'}</p>${condChips(e)}</div></div>`;
    });
    itemBody.innerHTML = `<div class="card" data-item="${i.id}"><h2 class="q">How far along is it?</h2>
        <div class="words" id="words">${wordsHtml(i)}</div>
        <button class="exact" id="exactBtn" onclick="App.toggleExact()">Type an exact percent</button>
        <div id="exactRow" hidden><label for="exactIn">Percent done, from 0 to 100</label><input class="in" id="exactIn" type="text" inputmode="numeric" autocomplete="off" value="${pctOf(i)}" onchange="App.setExact('${i.id}', this.value)"></div>
        ${billRowHtml(i)}<div id="partNote">${partNoteHtml(i)}</div></div>
      <div class="card"><h3>Photos and notes <small>${days.length ? `${plural(days.length, 'day')} · ${nPhotos ? plural(nPhotos, 'photo') : 'notes only'}` : 'none yet'}</small></h3>
        <button class="btn" onclick="App.newEntry('${i.id}')">${ic('camera')}Add a photo of ${esc(i.n)}</button>
        ${es.length ? diary : `<p class="hint" style="margin:10px 0 0">No photos of ${esc(i.n)} yet. The first one starts Day 1.</p>`}</div>
      ${costsCardHtml(i, fold)}
      <div class="stack"><button class="btn q" onclick="App.editItem()">${ic('edit')}Change the name, budget or dates</button>
        <button class="btn danger" onclick="App.deleteItem('${i.id}')">${ic('trash')}Delete this part</button></div>`;
    hydrate(itemBody, p);
    itemBody.querySelectorAll('.ph[data-n]').forEach(el => { const b = document.createElement('span'); b.className = 'n'; b.textContent = '+' + (el.dataset.n - 1); el.appendChild(b); });
  }
  /** After a part's percent changed: redraw its words, the exact percent and the sentence about the bill, in place. */
  function itemProgress(i) {
    const card = itemBody.querySelector(`[data-item="${i.id}"]`); if (!card) return;
    card.querySelector('#words').innerHTML = wordsHtml(i);
    const ex = card.querySelector('#exactIn'); if (ex && document.activeElement !== ex) ex.value = pctOf(i);
    card.querySelector('#partNote').innerHTML = partNoteHtml(i);
  }
  /** Update every place one part's billed figure shows, in place: no field is redrawn, so the one being typed in keeps its focus. */
  function itemBill(i, k) {
    document.querySelectorAll(`[data-billrow="${i.id}"]`).forEach(row => { row.querySelector('[data-k=pct]').value = billVal(i); row.querySelector('[data-k=amt]').value = billAmt(i); row.querySelector('.billNote').innerHTML = billNoteHtml(i); });
    document.querySelectorAll(`[data-bill="${i.id}"]`).forEach(row => { row.querySelector('[data-k=pct]').value = billVal(i); row.querySelector('[data-k=amt]').value = billAmt(i); row.querySelector('.billSub').innerHTML = billSubHtml(i); });
    const note = itemBody.querySelector(`[data-item="${i.id}"] #partNote`); if (note) note.innerHTML = partNoteHtml(i);
    const tot = document.getElementById('billTotal'); if (tot && k) tot.innerHTML = billTotalHtml(k);
  }
  function itemCosts(i) { const c = document.getElementById('itemCosts'); if (c) c.innerHTML = itemCostsHtml(i); const t = document.getElementById('costTotal'); if (t) t.textContent = fmt$(Data.itemCost(i)) + ' total'; }

  function itemform(p, i) {
    itemformBody.innerHTML = `<div class="card">
      <label for="ifName">Name of the part</label><input class="in" id="ifName" value="${esc(i.n || '')}" placeholder="e.g. Framing">
      <label for="ifBudget">Budget, if you know it</label><input class="in" type="number" inputmode="decimal" id="ifBudget" value="${esc(i.b || '')}" placeholder="$">
      <div class="in2"><div><label for="ifStart">Start</label><input class="in" type="date" id="ifStart" value="${esc(i.s || p.start || '')}"></div><div><label for="ifEnd">Finish</label><input class="in" type="date" id="ifEnd" value="${esc(i.e || p.finish || '')}"></div></div></div>
      <button class="btn" onclick="App.saveItem()">${ic('check')}${i.id ? 'Save' : 'Add this part'}</button>`;
  }

  /** Send: the owner update, the one page the owner reads. It keeps its numbers; only the words around it are the assistant's. */
  function reportPageHtml(p, k) {
    const basis = Data.basisLine(p, k, DB.get('ct-me') || '');
    const items = p.items || [], pics = sortedEntries(p).flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 3);
    const bill = k.hasBill, calendar = Data.calendarSentence(k);
    const pace = k.dated && k.pct > 0 ? ' At this pace the job finishes ' + md(Data.iso(k.paceFinish)) + '.' : '';
    // With a bill, the page leads with what was billed against what is done and names each part billed ahead. Without one it keeps the builder's numbers.
    const nums = bill ? Data.billNums(k).map(([v, l], x) => `<div${x === 2 && k.aheadItems.length ? ' class="warn"' : ''}><b>${v}</b><span>${l}</span></div>`).join('')
      : `<div><b>${Math.round(k.pct * 100)}%</b><span>done</span></div><div><b>${Data.fmtK(k.cost)}</b><span>cost so far</span></div><div><b>${Data.fmtK(k.toGo)}</b><span>to finish</span></div><div><b>${k.daysLeft ?? '—'}</b><span>days left</span></div>`;
    const summary = !k.total && !bill ? 'This job has no parts with a budget yet. Add them on the Parts tab and this page fills itself in.'
      : bill ? `${calendar}${esc(Data.billSentence(k))}${pace}`
      : `${calendar}${Data.costSentence(k)}${pace}`;
    const flags = bill ? k.aheadItems.slice(0, 4).map(i => `<div class="flagline">${ic('alert', 16)}<b>${esc(Data.aheadLine(i))}</b></div>`).join('') + (k.aheadItems.length > 4 ? `<p class="aheadTxt">And ${k.aheadItems.length - 4} more billed ahead, marked below.</p>` : '') : '';
    const table = bill
      ? `<tr><td><b>Part of the job</b></td><td class="n"><b>Budget</b></td><td class="n"><b>Done</b></td><td class="n"><b>Billed</b></td></tr>${items.map(i => `<tr><td>${esc(i.n)}</td><td class="n">${fmt$(i.b)}</td><td class="n">${i.pct || 0}%</td><td class="n${Data.billState(i) === 'ahead' ? ' aheadTxt' : ''}">${Data.hasBill(i) ? Data.fmtPct(Data.itemBilledPct(i)) : '—'}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="n">${fmt$(k.total)}</td><td class="n">${Math.round(k.pct * 100)}%</td><td class="n">${k.total ? Math.round(k.billedPct * 100) + '%' : '—'}</td></tr>`
      : `<tr><td><b>Part of the job</b></td><td class="n"><b>Budget</b></td><td class="n"><b>Done</b></td><td class="n"><b>Cost</b></td></tr>${items.map(i => `<tr><td>${esc(i.n)}</td><td class="n">${fmt$(i.b)}</td><td class="n">${i.pct || 0}%</td><td class="n">${fmt$(Data.itemCost(i))}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="n">${fmt$(k.total)}</td><td class="n">${Math.round(k.pct * 100)}%</td><td class="n">${fmt$(k.cost)}</td></tr>`;
    return `<div class="hd"><div class="mark">CT</div><div><h4>${esc(p.name || 'Untitled job')}</h4><div class="meta">${p.sample ? '<b class="sampleTag">Sample job</b> · ' : ''}Owner update · ${Data.mdy(Data.iso(Data.today()))}${p.client ? ' · for ' + esc(p.client) : ''}</div></div></div>
      <div class="num4">${nums}</div>
      ${flags}
      <p><b>Summary.</b> ${p.cover.head ? esc(p.cover.head) + '. ' : ''}${summary}</p>
      <table class="sov">${table}</table>
      ${pics.length ? `<p style="margin-top:12px"><b>Latest photos</b></p><div class="grid3">${pics.map(({ ph }) => photoPh(ph, Data.photoKey(ph))).join('')}</div>` : ''}
      ${p.cover.note ? `<p>${esc(p.cover.note)}</p>` : ''}
      ${basis ? `<p class="basis">${esc(basis)}</p>` : ''}`;
  }
  /** Redraw only the page, after the note or the name changed: the boxes above it keep their focus. */
  function reportPreview(p, k) { const el = document.getElementById('reportPreview'); if (!el) return; el.innerHTML = reportPageHtml(p, k); hydrate(el, p); }
  function report(p, k) {
    const pics = sortedEntries(p).flatMap(e => e.photos.map(ph => ({ ph, e }))).slice(0, 3);
    reportBody.innerHTML = `<p class="lead">This is the page the owner gets. Look it over, then send it. Nothing goes until you pick how.</p>
      <button class="btn" id="sendBtn" onclick="App.openShare('report')">${ic('send')}Choose how to send it</button>
      <div class="report" id="reportPreview" style="margin-top:12px">${reportPageHtml(p, k)}</div>
      <div class="card" style="margin-top:12px"><h3>Add your own words</h3>
        <label for="rpNote">A note to the owner, at the bottom of the page</label><textarea class="in" id="rpNote" style="min-height:72px" placeholder="e.g. Roofers are back Tuesday." onchange="App.setNote(this.value)">${esc(p.cover.note)}</textarea>
        <label for="rpMe">Your name, so the owner knows who looked</label><input class="in" id="rpMe" autocomplete="name" value="${esc(DB.get('ct-me') || '')}" onchange="App.setMe(this.value)"></div>
      <div class="stack" style="margin-top:12px"><button class="btn q" onclick="App.shareDo('print','report')">${ic('file')}Print it</button><button class="btn q" id="toCover" onclick="App.go('cover')">${ic('image')}Make a picture to text instead</button></div>`;
    hydrate(reportBody, p); return pics;
  }

  return { ic, esc, hydrate, coverSelection, projects, projform, home, log, applyLogFilter, entryform, entryPhotos, photo, photoSwap, moveSheet, cover, coverCtl, sov, bill, itemBill, item, itemProgress, itemCosts, itemform, report, reportPreview, sortedEntries, itemName };
})();
