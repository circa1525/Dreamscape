const CACHE='dreamscape-v1';
const CORE=['./','index.html','styles.css','app.js','audio-engine.js','mix-worker.js','storage.js','stories.js','manifest.webmanifest','assets/narration.json',...['cabin','ocean','garden','train','desert','icon'].map(n=>`assets/${n}.svg`),'assets/icon-192.png','assets/icon-512.png',...['rain','ocean','wind','forest'].map(n=>`assets/${n}.mp3`)];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{for(const path of CORE){const response=await fetch(path);if(!response.ok||response.redirected||new URL(response.url).origin!==self.location.origin)throw new Error('App assets require a successful sign-in.');await cache.put(path,response);}}));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('range'))return;
 // Cache only known app files. Authentication redirects and sign-in pages stay uncached.
 const key=CORE.find(p=>new URL(p,self.registration.scope).href===url.href);if(!key)return;
 event.respondWith(fetch(request).then(async response=>{if(response.ok&&!response.redirected&&new URL(response.url).origin===self.location.origin){const cache=await caches.open(CACHE);cache.put(request,response.clone());}return response;}).catch(()=>caches.match(request)));
});
