(() => {
  'use strict';
  const prefix = 'washoku-lesson-';
  let ready;
  function initialize() {
    if (!('serviceWorker' in navigator) || !('caches' in window) || !window.isSecureContext) return Promise.reject(new Error('Offline downloads require HTTPS.'));
    ready ||= navigator.serviceWorker.register('sw.js').then(() => Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Offline setup did not complete.')), 30000))
    ])).catch(error => { ready = null; throw error; });
    return ready;
  }
  const url = path => new URL(path.split('#')[0], document.baseURI).href;
  async function saved(id) {
    const names = (await caches.keys()).filter(name => name.startsWith(prefix + id + '--'));
    for (const name of names) {
      const cache = await caches.open(name);
      if (await cache.match(url('offline-saved/' + id))) return name;
    }
    return null;
  }
  function assets(value, result) {
    if (typeof value === 'string' && /^(assets|data)\//.test(value)) result.add(url(value));
    else if (Array.isArray(value)) value.forEach(v => assets(v, result));
    else if (value && typeof value === 'object') Object.values(value).forEach(v => assets(v, result));
  }
  async function download(lesson, progress) {
    await initialize();
    const old = await saved(lesson.id);
    const name = prefix + lesson.id + '--' + Date.now();
    const cache = await caches.open(name);
    try {
      const files = [...(lesson.files || [lesson.file])];
      if (lesson.gameMode) files.push('data/word-explosion-examples.json');
      const paths = new Set();
      assets(lesson, paths);
      for (const file of files) {
        const response = await fetch(file, { cache: 'reload' });
        if (!response.ok) throw new Error('Could not download lesson content.');
        await cache.put(url(file), response.clone());
        paths.delete(url(file));
        if (file.endsWith('.json')) assets(await response.json(), paths);
      }
      const audio = window.lessonAudioFiles?.[lesson.id] || (lesson.id === 'taste-words' ? window.tasteAudioFiles : lesson.gameMode ? window.gameAudioFiles : null);
      Object.values(audio || {}).forEach(path => paths.add(url(path)));
      if (lesson.gameMode) {
        paths.add(url('assets/cat-03.svg'));
        paths.add(url('audio/effects/money-cat-correct.wav'));
      }
      let completed = 0;
      const queue = [...paths];
      progress(0, queue.length);
      const results = await Promise.allSettled(Array.from({length: Math.min(4, queue.length)}, async () => {
        while (queue.length) {
          const path = queue.shift();
          const response = await fetch(path, {cache: 'reload'});
          if (!response.ok) throw new Error('A lesson file could not be downloaded.');
          await cache.put(path, response);
          progress(++completed, paths.size);
        }
      }));
      const failure = results.find(result => result.status === "rejected");
      if (failure) throw failure.reason;
      await cache.put(url('offline-saved/' + lesson.id), new Response(JSON.stringify({title: lesson.title, saved: Date.now()})));
      if (old) await caches.delete(old);
      navigator.storage?.persist?.().catch(() => {});
    } catch (error) {
      // Allow all active workers to finish before removing a partial download.
      await caches.delete(name);
      throw error;
    }
  }
  function addControls(container, lesson) {
    const row = document.createElement('div');
    row.className = 'offline-controls';
    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/></svg>';
    button.title = 'Download for offline';
    button.setAttribute('aria-label', 'Download ' + lesson.title + ' for offline');
    row.append(button, status);
    container.append(row);
    let busy = false;
    async function refresh() {
      const downloaded = await saved(lesson.id);
      status.textContent = downloaded ? 'Available offline' : '';
      button.classList.toggle('is-downloaded', Boolean(downloaded));
      button.title = downloaded ? 'Available offline · Remove download' : 'Download for offline';
      button.setAttribute('aria-label', (downloaded ? 'Remove offline download: ' : 'Download for offline: ') + lesson.title);
    }
    if (!('caches' in window) || !window.isSecureContext) { status.textContent = 'Offline downloads require HTTPS'; button.disabled = true; return; }
    refresh().catch(() => { status.textContent = 'Offline storage unavailable'; button.disabled = true; });
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true; button.disabled = true;
      try {
        const name = await saved(lesson.id);
        if (name) {
          await caches.delete(name);
        } else {
          status.textContent = 'Preparing download… Keep the app open.';
          await download(lesson, (done, total) => { status.textContent = `Downloading ${done}/${total} · Keep the app open`; });
        }
        await refresh();
      } catch (error) {
        status.textContent = error.name === 'QuotaExceededError' ? 'Not enough storage. Remove a download and retry.' : 'Download failed. Check your connection and retry.';
      } finally { busy = false; button.disabled = false; }
    });
  }
  window.WashokuOffline = { initialize, addControls };
  initialize().catch(() => {});
})();
