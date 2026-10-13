/* DB — on-device persistence. Photos (blobs) live in IndexedDB; everything else is one JSON blob in localStorage. */
const DB = (() => {
  const KEY = 'ct-data-v2';
  let idb = null;
  const open = () => idb ? Promise.resolve(idb) : new Promise((res, rej) => {
    const r = indexedDB.open('ct-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
    r.onsuccess = () => { idb = r.result; idb.onclose = () => { idb = null; }; idb.onversionchange = () => { idb.close(); idb = null; }; res(idb); };
    r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('IndexedDB blocked'));
  });
  const run = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => { let t; try { t = d.transaction('photos', mode); } catch (e) { idb = null; return rej(e); } const s = t.objectStore('photos'); let out; const q = fn(s); if (q) q.onsuccess = () => { out = q.result; }; t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('IndexedDB aborted (storage full?)')); }); };
  // Safari drops the connection after the app sits in the background; retry once with a fresh one.
  const tx = async (mode, fn) => { try { return await run(mode, fn); } catch (e) { const n = e && e.name; if (n === 'InvalidStateError' || n === 'UnknownError' || n === 'TransactionInactiveError' || /closing|lost/i.test(String(e && e.message))) { idb = null; return run(mode, fn); } throw e; } };
  return {
    putPhoto: rec => tx('readwrite', s => { s.put(rec); }),
    getPhoto: id => tx('readonly', s => s.get(id)),
    delPhoto: id => tx('readwrite', s => { s.delete(id); }),
    allPhotoIds: () => tx('readonly', s => s.getAllKeys()),
    clearPhotos: () => tx('readwrite', s => { s.clear(); }),
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { console.warn('save failed', e); return false; } },
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    KEY,
  };
})();
