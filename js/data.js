/* Data — the project model, the sample job, templates, and the numbers every screen shares. */
const Data = (() => {
  const DAY = 864e5;
  const uid = p => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const iso = dt => { const d = new Date(dt); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const parse = s => { const [y, m, d] = (s || '').split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const addDays = (dt, n) => new Date(dt.getTime() + n * DAY);
  const md = s => parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mdy = s => parse(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const wd = s => parse(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmt$ = n => (n < 0 ? '-' : '') + '$' + Math.round(Math.abs(n || 0)).toLocaleString();
  const fmtK = n => '$' + (Math.abs(n) >= 1000 ? Math.round(n / 1000) + 'k' : Math.round(n));
  const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const TEMPLATES = {
    remodel: { name: 'Residential remodel', note: '10 items · demo → finishes', items: [['Demolition', 5, 0, 7], ['Foundation repair', 8, 6, 22], ['Framing', 13, 16, 39], ['Roofing', 10, 30, 44], ['Plumbing rough-in', 7, 35, 51], ['Electrical rough-in', 7, 37, 53], ['HVAC', 9, 42, 58], ['Insulation & drywall', 11, 56, 74], ['Interior finishes', 18, 70, 98], ['Exterior & site', 11, 77, 102]] },
    garage: { name: 'New garage / ADU', note: '8 items · slab → siding', items: [['Site prep & footings', 10, 0, 10], ['Slab', 12, 8, 18], ['Framing', 20, 16, 34], ['Roofing', 12, 30, 40], ['Electrical', 9, 36, 48], ['Windows & doors', 10, 40, 50], ['Siding & trim', 15, 46, 62], ['Finish & cleanup', 12, 58, 70]] },
    kitchen: { name: 'Kitchen + bath', note: '7 items', items: [['Demolition', 8, 0, 4], ['Plumbing', 14, 3, 12], ['Electrical', 12, 5, 14], ['Drywall & paint', 12, 12, 22], ['Cabinets & counters', 28, 20, 34], ['Tile & flooring', 16, 24, 38], ['Fixtures & finish', 10, 34, 42]] },
    blank: { name: 'Blank', note: 'add your own', items: [] },
  };

  function itemsFromTemplate(key, start, finish, contract) {
    const t = TEMPLATES[key]; if (!t || !t.items.length) return [];
    const span = Math.max(7, Math.round((parse(finish) - parse(start)) / DAY)); const last = t.items[t.items.length - 1][3] || 1;
    const wsum = t.items.reduce((a, i) => a + i[1], 0);
    return t.items.map(([n, w, s, e]) => ({ id: uid('i'), n, b: contract ? Math.round(contract * w / wsum / 100) * 100 : 0, pct: 0, s: iso(addDays(parse(start), Math.round(s / last * span))), e: iso(addDays(parse(start), Math.round(e / last * span))), costs: [] }));
  }

  function sampleProject() {
    const T = today(), start = addDays(T, -34), finish = addDays(T, 68);
    const d = n => iso(addDays(start, n));
    const items = [
      ['Demolition', 8500, 100, 0, 7, [['Haul-away dumpster', 1, 1450], ['Labor (3 days)', 4, 4200], ['Permit & disposal', 7, 2470]]],
      ['Foundation repair', 14200, 100, 6, 22, [['Pier & beam sub', 14, 9800], ['Concrete', 18, 3250], ['Engineer letter', 22, 2000]]],
      ['Framing', 22800, 85, 16, 39, [['Lumber package', 16, 11400], ['Framing crew wk1', 25, 4100], ['Framing crew wk2', 32, 3400]]],
      ['Roofing', 16500, 60, 30, 44, [['Trusses', 30, 6900], ['Decking & underlayment', 33, 2300]]],
      ['Plumbing rough-in', 12400, 40, 35, 51, [['Plumber deposit', 34, 4800]]],
      ['Electrical rough-in', 11900, 30, 37, 53, [['Electrician deposit', 34, 3100]]],
      ['HVAC', 15600, 10, 42, 58, [['Equipment deposit', 31, 1200]]],
      ['Insulation & drywall', 18300, 0, 56, 74, []],
      ['Interior finishes', 31200, 0, 70, 98, []],
      ['Exterior & site', 19000, 0, 77, 102, []],
    ].map(([n, b, pct, s, e, costs]) => ({ id: uid('i'), n, b, pct, s: d(s), e: d(e), costs: costs.map(([desc, day, amt]) => ({ id: uid('c'), desc, date: d(day), amt })) }));
    const byName = n => items.find(i => i.n === n).id;
    const entries = [
      [0, '2:41 PM', 'Roofing', 'roof', 'sun', 71, 4, 'North slope decked, underlayment on. Shingles Tue.', 3],
      [0, '9:05 AM', 'Framing', 'walls', 'sun', 71, 4, 'Last interior walls plumbed and braced.', 7],
      [-2, '11:30 AM', 'Roofing', 'roof', 'cloud', 66, 5, 'Trusses set, all 14. Crane out by noon.', 2],
      [-3, '4:10 PM', 'Framing', 'walls', 'sun', 69, 3, 'Second-floor subfloor glued and screwed.', 5],
      [-5, '1:15 PM', 'Framing', 'frame', 'rain', 58, 3, 'Exterior walls stood, sheathing started. Rain pushed start to 10am.', 9],
      [-9, '3:50 PM', 'Framing', 'frame', 'sun', 74, 4, 'Sill plates down, first floor deck.', 4],
      [-13, '10:20 AM', 'Foundation repair', 'slab', 'sun', 77, 2, 'Pier pour complete, forms stripped.', 1],
      [-20, '8:45 AM', 'Foundation repair', 'slab', 'cloud', 72, 2, 'Underpinning excavated, inspector passed.', 6],
    ].map(([off, time, item, kind, wx, temp, crew, note, seed]) => ({ id: uid('e'), d: iso(addDays(T, off)), time, itemId: byName(item), note, wx, temp, crew, photos: [{ seed, kind, wx }] }));
    return { id: 'sample', sample: true, name: 'Maple St Duplex — Unit B remodel', client: 'Hernandez', addr: '1418 Maple St, Unit B', start: iso(start), finish: iso(finish), items, entries, cover: { picked: [], layout: 'hero', head: 'Framing done, roof going on', note: 'Roofing crew back Tue. Plumbing rough-in starts Wed.', numMode: 'auto', manual: { pct: 52, toGo: 81000, days: 68 } } };
  }

  function calc(p) {
    const T = today(); const items = p.items || [];
    const total = items.reduce((a, i) => a + (+i.b || 0), 0);
    const earned = items.reduce((a, i) => a + (+i.b || 0) * (i.pct || 0) / 100, 0);
    const cost = items.reduce((a, i) => a + itemCost(i), 0);
    const toGo = items.reduce((a, i) => { const b = +i.b || 0, c = itemCost(i); const rem = b * (1 - (i.pct || 0) / 100); const ratio = i.pct > 0 ? Math.max(1, c / (b * i.pct / 100 || 1)) : 1; return a + rem * ratio; }, 0);
    const pct = total ? earned / total : 0;
    const start = parse(p.start), finish = parse(p.finish);
    const span = Math.max(1, (finish - start) / DAY), elapsed = Math.min(span, Math.max(0, (T - start) / DAY));
    const daysLeft = Math.round((finish - T) / DAY);
    const pace = pct > 0 ? elapsed / pct : span;
    const paceFinish = addDays(start, pace);
    return { total, earned, cost, toGo, pct, span, elapsed, daysLeft, paceFinish, schedPct: elapsed / span, ahead: pct >= elapsed / span };
  }
  const itemCost = i => (i.costs || []).reduce((a, c) => a + (+c.amt || 0), 0);
  const itemEarned = i => (+i.b || 0) * (i.pct || 0) / 100;
  const allPhotos = p => (p.entries || []).flatMap(e => (e.photos || []).map(ph => ({ ph, e })));
  const photoKey = ph => ph.id || ('s' + ph.seed);
  /** The distinct dates a line item has entries on, earliest first: the first of them is its Day 1. */
  const itemDays = (p, itemId) => [...new Set((p.entries || []).filter(e => e.itemId === itemId).map(e => e.d))].sort();
  const itemDay = (p, itemId, d) => itemDays(p, itemId).indexOf(d) + 1;
  /** Which day of the job a date is, the start date being Day 1; 0 when the job has no start or the date is before it. */
  const jobDay = (p, d) => { if (!p.start || !d) return 0; const n = Math.round((parse(d) - parse(p.start)) / DAY) + 1; return n >= 1 ? n : 0; };

  return { DAY, uid, iso, parse, today, addDays, md, mdy, wd, fmt$, fmtK, nowTime, TEMPLATES, itemsFromTemplate, sampleProject, calc, itemCost, itemEarned, allPhotos, photoKey, itemDays, itemDay, jobDay };
})();
