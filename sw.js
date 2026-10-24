const SHELL = 'washoku-shell-v425';
// Keep previously downloaded pages working after the source-file reorganization.
const LEGACY_PATHS = {
  'app.js': 'js/app.js',
  'offline.js': 'js/offline.js',
  'search.js': 'js/ui/search.js',
  'japanese-speech.js': 'js/audio/japanese-speech.js',
  'vocabulary-cards.js': 'js/cards/vocabulary-cards.js',
  'styles.css': 'css/styles.css',
  'word explosion.txt': 'data/word-explosion.txt',
  'families-of-doom.js': 'js/games/families-of-doom.js',
  'kanahachi.js': 'js/games/kanahachi-core.js',
  'js/games/kanahachi.js': 'js/games/kanahachi-core.js',
  'money-cat.js': 'js/games/money-cat.js',
  'money-cat-audio-check.js': 'js/games/money-cat-audio-check.js',
  'word-explosion.js': 'js/games/word-explosion.js',
  'word-explosion-2.js': 'js/games/word-explosion-2.js',
  'taste-audio-manifest.js': 'js/audio/taste-audio-manifest.js',
  'word-explosion-audio-manifest.js': 'js/audio/word-explosion-audio-manifest.js',
  'game-audio-manifest.js': 'js/audio/game-audio-manifest.js',
  'lesson-audio-manifest.js': 'js/audio/lesson-audio-manifest.js',
  'zukan-audio-manifest.js': 'js/audio/zukan-audio-manifest.js',
  'tts-sample.html': 'tools/tts-sample.html',
  'tts-quality-check.html': 'tools/tts-quality-check.html'
};
const FILES = ["data/fermentation-notes/amazake-questions.json", "data/fermentation-notes/amazake-questions-source.txt", "data/fermentation-notes/amazake.json", "data/fermentation-notes/amazake-source.txt", "assets/amazake.png", "data/fermentation-notes/koji.json", "data/fermentation-notes/koji-source.txt", "assets/houshi.png", "data/fermentation-notes/basics-2026.json", "data/fermentation-notes/2026-basics-source.txt", "assets/category-stories.svg", "data/stories-cards.json", "assets/knife_anatomy2.SVG", "./", "js/app.js", "assets/appicon-512-v2.png", "assets/appicon.svg", "assets/cat-03.svg", "assets/money-cat-card.svg", "audio/effects/money-cat-correct.wav", "audio/effects/money-cat-wrong.wav", "data/catalog.json", "data/topic-vocabulary-cards.json", "data/household-finance-cards.json", "data/cooking-reference-cards.json", "data/marin-audio-trials.json", "data/marin-audio-originals.json", "js/audio/game-audio-manifest.js", "index.html", "js/games/kanahachi-core.js", "assets/bee.svg", "assets/bee-full.svg", "assets/flashcard.svg", "js/audio/japanese-speech.js", "js/audio/lesson-audio-manifest.js", "manifest.json", "js/games/money-cat.js", "js/games/money-cat-audio-check.js", "js/offline.js", "js/ui/search.js", "css/styles.css", "js/audio/taste-audio-manifest.js", "js/games/word-explosion-2.js", "js/cards/vocabulary-cards.js", "js/games/families-of-doom.js", "js/games/word-explosion.js", "js/audio/zukan-audio-manifest.js"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll([
    ...FILES, 'js/games/kanahachi-dictionary.js', 'data/dictionaries/kanahachi-jmdict.json',
    'docs/licenses/jmdict.md', 'docs/licenses/CC-BY-SA-4.0.txt',
    'js/audio/word-explosion-audio-manifest.js', 'data/word-explosion.txt',
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
  const requestURL = new URL(request.url);
  const scope = new URL(self.registration.scope);
  const relativePath = requestURL.pathname.startsWith(scope.pathname)
    ? decodeURIComponent(requestURL.pathname.slice(scope.pathname.length)) : '';
  if (Object.prototype.hasOwnProperty.call(LEGACY_PATHS, relativePath)) {
    const destination = new URL(LEGACY_PATHS[relativePath], scope);
    destination.search = requestURL.search;
    event.respondWith(Promise.resolve(Response.redirect(destination.href, 302)));
    return;
  }
  event.respondWith((async () => {
    // Navigations and app code use current online content with an offline fallback.
    const isAudio = /\.(mp3|wav)$/.test(new URL(request.url).pathname);
    const isBee = /\/assets\/bee(?:-full)?\.svg$/.test(new URL(request.url).pathname);
    if (!isAudio && (isBee || !new URL(request.url).pathname.includes('/assets/'))) {
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
