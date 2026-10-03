// Run with JavaScriptCore, supplying offline.js as offlineSource.
(async () => {
  const assert = (v,m) => { if(!v) throw new Error(m); };
  const stores = new Map(), fetched = [];
  let fail = '';
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name,new Map());
      const store = stores.get(name);
      return {match: async key => store.get(key), put: async (key,response) => store.set(key,response)};
    }
  };
  class URL { constructor(path,base) { this.href = /^https:/.test(path) ? path : base + path; } }
  class Response {
    constructor(body) { this.body=body; this.ok=true; }
    clone() { return new Response(this.body); }
  }
  const host = {isSecureContext:true,caches};
  const navigator = {serviceWorker:{register: async()=>({}),ready:Promise.resolve({})}};
  const fetch = async path => {
    fetched.push(path);
    if (path === fail) throw new Error('Network failure');
    return new Response('content');
  };
  const source = offlineSource.replace('window.WashokuOffline = { initialize, addControls };','window.WashokuOffline = { initialize, addControls, download, saved };');
  new Function('window','navigator','document','caches','fetch','URL','Response','setTimeout',source)(host,navigator,{baseURI:'https://test/'},caches,fetch,URL,Response,()=>{});
  const lesson = {id:'zukan',title:'図鑑',files:['favorites.html','zukan-audio-manifest.js'],illustrations:['assets/page.png'],audioFiles:{a:'audio/zukan/marin-a.mp3',b:'audio/zukan/marin-a.mp3',c:'audio/zukan/marin-b.mp3'}};
  await host.WashokuOffline.download(lesson,()=>{});
  const saved = await host.WashokuOffline.saved('zukan');
  assert(saved, 'Download marked complete');
  const store=stores.get(saved);
  ['favorites.html','zukan-audio-manifest.js','assets/page.png','audio/zukan/marin-a.mp3','audio/zukan/marin-b.mp3','offline-saved/zukan'].forEach(path=>assert(store.has('https://test/'+path),'Cached '+path));
  assert(fetched.filter(p=>p.endsWith('marin-a.mp3')).length===1,'Shared readings downloaded once');
  fail='https://test/audio/zukan/fail.mp3';
  let rejected=false;
  try { await host.WashokuOffline.download({...lesson,id:'zukan-failure',audioFiles:{a:'audio/zukan/fail.mp3'}},()=>{}); } catch (_) { rejected=true; }
  assert(rejected && !(await host.WashokuOffline.saved('zukan-failure')),'Failed download is not marked saved');
  assert(!(await caches.keys()).some(name=>name.startsWith('washoku-lesson-zukan-failure--')),'Partial download removed');
  assert(await host.WashokuOffline.saved('zukan'),'Other complete download preserved');
  await caches.delete(saved);
  assert(!(await host.WashokuOffline.saved('zukan')),'Remove download clears availability');
  window.offlineTestResult='PASS: 図鑑 page, illustrations and Marin audio caching, deduplication, failed-download cleanup, and removal.';
})().catch(error=>{window.offlineTestResult='FAIL: '+error.message;});
