const VERSION = 'exam-map-v2';
const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/assets/hero-observatory-640.webp', '/assets/hero-observatory-960.webp', '/assets/icon-192.png', '/assets/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // Discover Vite's hashed entry files from the deployed HTML so the first
    // offline launch has the complete app, not only an HTML shell.
    const response = await fetch('/');
    const html = await response.clone().text();
    await cache.put('/', response);
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/index-[^"]+)"/g)].map((match) => match[1]);
    if (builtAssets.length) await cache.addAll(builtAssets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(request, copy)); return response;
    }).catch(async () => (await caches.match(request, { ignoreVary: true })) || (await caches.match('/', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true })));
    return;
  }
  event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(VERSION).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
