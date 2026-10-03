const SHELL = 'washoku-shell-v10';
const FILES = ["./", "app.js", "assets/appicon-512-v2.png", "assets/appicon.svg", "assets/cat-03.svg", "assets/money-cat-card.svg", "audio/effects/money-cat-correct.wav", "audio/effects/money-cat-wrong.wav", "data/catalog.json", "game-audio-manifest.js", "index.html", "japanese-speech.js", "lesson-audio-manifest.js", "manifest.json", "money-cat.js", "offline.js", "search.js", "styles.css", "taste-audio-manifest.js", "word-explosion-2.js", "word-explosion.js", "zukan-audio-manifest.js"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll([
    ...FILES, 'word-explosion-audio-manifest.js', 'word explosion.txt',
    'data/word-explosion-examples.json'
  ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('washoku-shell-') && name !== SHELL).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
async function cached(request) {
  const names = await caches.keys();
  for (const name of names.filter(name => name.startsWith('washoku-lesson-')).reverse()) {
    const cache = await caches.open(name);
    // Partial downloads must never be served as saved lessons.
    const id = name.slice('washoku-lesson-'.length).split('--')[0];
    if (!(await cache.match(new URL('offline-saved/' + id, self.registration.scope).href))) continue;
    const response = await cache.match(request, {ignoreVary: true});
    if (response) return response;
  }
  const cache = await caches.open(SHELL);
  return cache.match(request, {ignoreSearch: true});
}
async function ranged(response, range) {
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return new Response(null, {status: 416, headers: {'Content-Range': 'bytes */' + bytes.byteLength}});
  const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end || start >= bytes.byteLength) return new Response(null, {status: 416, headers: {'Content-Range': 'bytes */' + bytes.byteLength}});
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), {status: 206, headers});
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    // Navigations and app code use current online content with an offline fallback.
    const isAudio = /\.(mp3|wav)$/.test(new URL(request.url).pathname);
    if (!isAudio && !new URL(request.url).pathname.includes('/assets/')) {
      try { const response = await fetch(request); if (response.ok) return response; } catch (_) {}
    }
    const response = await cached(new Request(request.url));
    if (response) return request.headers.has('Range') ? ranged(response, request.headers.get('Range')) : response;
    try { return await fetch(request); } catch (_) {
      if (request.mode === 'navigate') {
        const cache = await caches.open(SHELL);
        const fallback = await cache.match(new URL('index.html', self.registration.scope).href);
        if (fallback) return fallback;
      }
      return new Response('This content has not been downloaded for offline use.', {status: 503});
    }
  })());
});
