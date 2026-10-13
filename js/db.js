/* DB — on-device persistence. Photos (blobs) live in IndexedDB; everything else is one JSON blob in localStorage. */
const DB = (() => {
  const KEY = 'ct-data-v2';
  let idb = null;
  const open = () => idb ? Promise.resolve(idb) : new Promise((res, rej) => {
    const r = indexedDB.open('ct-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
    r.onsuccess = () => { idb = r.result; res(idb); };
    r.onerror = () => rej(r.error);
  });
  const tx = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('photos', mode); const s = t.objectStore('photos'); let out; const q = fn(s); if (q) q.onsuccess = () => { out = q.result; }; t.oncomplete = () => res(out); t.onerror = () => rej(t.error); }); };
  return {
    putPhoto: rec => tx('readwrite', s => { s.put(rec); }),
    getPhoto: id => tx('readonly', s => s.get(id)),
    delPhoto: id => tx('readwrite', s => { s.delete(id); }),
    clearPhotos: () => tx('readwrite', s => { s.clear(); }),
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn('save failed', e); } },
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    KEY,
  };
})();
