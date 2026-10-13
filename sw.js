/* CostTooling service worker: cache-first for the app shell, network-first for index.html so updates land. */
const VERSION = 'ct-v10';
const SHELL = ['./', './index.html', './css/app.css?v=10', './js/db.js?v=10', './js/photos.js?v=10', './js/data.js?v=10', './js/cover.js?v=10', './js/ui.js?v=10', './js/cloud.js?v=10', './js/app.js?v=10', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url); if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isPage) {
    // Only the app's own root is the cached shell. Other pages on this site
    // (the guide, for one) go straight to the network and never overwrite it.
    const appRoot = new URL('./', self.location).pathname;
    const isApp = url.origin === self.location.origin && url.pathname.replace(/index\.html$/, '') === appRoot;
    if (!isApp) { e.respondWith(fetch(e.request)); return; }
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html'))); return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
