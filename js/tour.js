/* Tour — "Show me around": walks a first-timer through the real app over the sample job.
   A dark mask with one bright hole moves from stop to stop; a card at the edge says what the hole shows.
   Tap the mask, swipe, or press Next to move on. Nothing the tour does changes the user's data. */
const Tour = (() => {
  const $ = id => document.getElementById(id);
  let stops = [], i = 0, on = false, pid = null, root, hole, card, raf, swipeX = null;

  // ---------- the stops ----------
  const sampleOrFirst = () => { const S = App.state(); const s = S.projects.find(p => p.sample); return (s || S.projects[0] || {}).id || null; };
  function build() {
    const cloud = window.Cloud && Cloud.enabled() && !Cloud.signedIn();
    const list = [
      { title: 'Your jobs', text: 'Each card is one job. This one is a sample to practise on. Tap a card to open it.',
        go: () => App.go('projects'), target: () => document.querySelector('#projectsBody .card.sample') || document.querySelector('#projectsBody .card.tap') },
      { title: 'Four numbers', text: 'How far along, days left, cost so far and what is left to spend. The line items feed them.',
        go: () => App.openProject(pid), target: () => document.querySelector('#homeBody .kpis') },
      { title: 'Add a photo', text: 'Tap Add photo while you are on the site. Take a picture or pick one you were texted.',
        go: () => App.go('home'), target: () => document.querySelector('#homeBody .actions .btn') },
      { title: 'The site log', text: 'Every photo lands here by day. Each one keeps its note, the weather and who was on site.',
        go: () => { App.filterLog('all'); App.go('log'); }, target: () => $('logBody'), block: 'start', cap: 0.5 },
      { title: 'Update progress', text: 'Drag a slider when work gets done, or tap a percent. Every number on every screen follows.',
        go: () => { App.setMode('items'); App.go('sov'); }, target: () => document.querySelector('#sovBody [data-item]') || document.querySelector('#sovBody .empty') },
      { title: 'The cover page', text: 'A picture to text the owner. Pick up to four photos and a headline, then save or share it.',
        go: () => App.go('cover'), target: () => document.querySelector('[data-s=cover] .cover-wrap'), cap: 0.5 },
      { title: 'The report', text: 'The same numbers on one page. Hand it to an owner, a lender or an inspector.',
        go: () => App.go('report'), target: () => $('reportPreview'), block: 'start', cap: 0.5 },
      { title: 'Send it', text: 'Tap the share button. Text it, save it, print it or email it.',
        go: () => { if (App.current() !== 'report') App.go('report'); }, target: () => $('topAct'), pad: 8 },
      cloud && { title: 'Your jobs on every phone', text: 'Sign in and every job and photo follows you. Your team sees them too. Not ready? This phone still works on its own.',
        go: () => App.go('projects'), target: () => $('cloudPromo'), block: 'start' },
      { title: "That's the whole app", text: 'Try it on the sample job. Nothing you do there matters. The yellow bulb takes your ideas and questions.',
        go: () => App.go('projects'), target: null, done: true },
    ];
    return list.filter(Boolean);
  }

  // ---------- the overlay ----------
  function mount() {
    if (root) return;
    root = document.createElement('div'); root.id = 'tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Show me around');
    root.innerHTML = '<div id="tourHole"></div><div id="tourCard"><button class="x" id="tourX" aria-label="Close the tour">' + UI.ic('x', 18) + '</button><div class="dots" id="tourDots"></div><h4 id="tourTitle"></h4><p id="tourText"></p><div class="btns" id="tourBtns"></div></div>';
    document.querySelector('.app').appendChild(root);
    hole = $('tourHole'); card = $('tourCard');
    root.addEventListener('click', e => { if (!card.contains(e.target)) next(); });
    card.addEventListener('click', e => e.stopPropagation());
    $('tourX').addEventListener('click', e => { e.stopPropagation(); end(); });
    root.addEventListener('touchstart', e => { swipeX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', e => { if (swipeX == null) return; const dx = e.changedTouches[0].clientX - swipeX; swipeX = null; if (dx < -50) next(); else if (dx > 50) back(); }, { passive: true });
    window.addEventListener('resize', () => { if (on) place(); });
  }
  const onKey = e => { if (!on) return; if (e.key === 'Escape') end(); else if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') back(); };

  function show() {
    const s = stops[i];
    if (!s) return end();
    s.go();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const t = s.target && s.target();
      if (s.target && !t) { // nothing to point at on this device: skip the stop
        stops.splice(i, 1); if (i >= stops.length) i = stops.length - 1; return show();
      }
      if (t) t.scrollIntoView({ block: s.block || 'center', inline: 'nearest' });
      $('tourTitle').textContent = s.title; $('tourText').textContent = s.text;
      $('tourDots').innerHTML = stops.map((_, k) => `<i class="${k === i ? 'on' : k < i ? 'past' : ''}"></i>`).join('');
      const last = i === stops.length - 1;
      $('tourBtns').innerHTML = s.done
        ? `<button class="btn" id="tourTry">${UI.ic('check')}Try the sample job</button><button class="btn q" id="tourNew">${UI.ic('plus')}Start my own job</button>`
        : `<button class="btn q" id="tourBack" ${i === 0 ? 'disabled' : ''}>${UI.ic('chevl')}Back</button><button class="btn" id="tourNext">${last ? 'Done' : 'Next'}${UI.ic('chevr')}</button>`;
      if (s.done) { $('tourTry').onclick = () => { end(); App.openProject(pid); }; $('tourNew').onclick = () => { end(); App.newProject(); }; }
      else { $('tourBack').onclick = back; $('tourNext').onclick = next; }
      root.classList.toggle('done', !!s.done);
      place();
      clearTimeout(raf); raf = setTimeout(place, 380); // once more after images and fonts settle
    }));
  }

  /** Put the hole over the target and the card in the larger free space. */
  function place() {
    const s = stops[i]; if (!s || !on) return;
    const app = document.querySelector('.app').getBoundingClientRect(), topBar = document.querySelector('.top').getBoundingClientRect();
    const t = s.target && s.target();
    if (!t) { hole.style.cssText = `left:${app.width / 2}px;top:${app.height / 2}px;width:0;height:0;border-radius:0`; card.style.top = ''; card.style.bottom = ''; card.classList.add('mid'); return; }
    card.classList.remove('mid');
    const pad = s.pad ?? 6, scroller = t.closest('.screen'), r = t.getBoundingClientRect();
    let top = r.top, bottom = r.bottom;
    if (scroller) { const sr = scroller.getBoundingClientRect(); top = Math.max(top, sr.top); bottom = Math.min(bottom, sr.bottom); }
    if (s.cap) bottom = Math.min(bottom, top + app.height * s.cap);
    const x = r.left - app.left - pad, y = top - app.top - pad, w = r.width + pad * 2, h = Math.max(0, bottom - top) + pad * 2;
    hole.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${Math.min(16, pad + 10)}px`;
    const spaceAbove = y - (topBar.bottom - app.top), spaceBelow = app.height - (y + h);
    const ch = card.offsetHeight + 28;
    if (spaceBelow >= ch || spaceBelow >= spaceAbove) { card.style.top = ''; card.style.bottom = ''; card.classList.remove('up'); }
    else { card.classList.add('up'); card.style.top = (topBar.bottom - app.top + 14) + 'px'; card.style.bottom = 'auto'; }
  }

  // ---------- controls ----------
  function start() {
    mount();
    if (!App.state().projects.length) App.restoreSample();
    pid = sampleOrFirst(); if (!pid) return App.toast('Add a project first');
    stops = build(); i = 0; on = true;
    App.closeSheet(); DB.set('ct-welcomed', 1);
    document.documentElement.classList.add('touring'); root.classList.add('show'); document.addEventListener('keydown', onKey);
    show();
  }
  function next() { if (!on) return; if (i >= stops.length - 1) return end(); i++; show(); }
  function back() { if (!on || i === 0) return; i--; show(); }
  function end() {
    if (!on) return; on = false; clearTimeout(raf);
    root.classList.remove('show', 'done'); document.documentElement.classList.remove('touring'); document.removeEventListener('keydown', onKey);
    DB.set('ct-toured', 1);
  }
  return { start, next, back, end, active: () => on };
})();
