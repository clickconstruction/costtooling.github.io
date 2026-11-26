/* CostTooling service worker: cache-first for the app's files, network-first for the two pages so updates land.
   The app lives at ./app/ and the landing page at ./ (the site's front page). Both are cached: a home-screen app
   installed before the app moved still opens ./, and the landing page passes it on to ./app/. */
const VERSION = 'ct-v19';
const APP = './app/', FRONT = './';
const SHELL = [FRONT, APP, './css/app.css?v=19', './js/db.js?v=19', './js/photos.js?v=19', './js/data.js?v=19', './js/cover.js?v=19', './js/ui.js?v=19', './js/cloud.js?v=19', './js/tour.js?v=19', './js/app.js?v=19', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url); if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isPage) {
    // Only the app and the front page are cached pages. Other pages on this site
    // (the guide, for one) go straight to the network and never overwrite them.
    const dir = url.pathname.replace(/index\.html$/, '');
    const key = dir === new URL(APP, self.location).pathname ? APP : dir === new URL(FRONT, self.location).pathname ? FRONT : null;
    if (!key) { e.respondWith(fetch(e.request)); return; }
    e.respondWith(fetch(e.request).then(r => { if (r.ok && !r.redirected) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key, copy)); } return r; }).catch(() => caches.match(key))); return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
