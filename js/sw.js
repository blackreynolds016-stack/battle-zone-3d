// Service worker de EGO ZNE: red primero (siempre recibes la versión nueva) y copia local de respaldo para jugar sin conexión.
const CACHE='egozne-v4';
const CORE=['./','./index.html','./css/style.css','./js/main.js','./js/player.js','./js/world.js','./js/controls.js','./js/effects.js','./js/lobby.js','./js/terrain.js','./js/mapdata.js','./js/textures.js','./ui/icons.png','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 const sameOrigin=u.origin===location.origin,isThree=u.hostname==='cdn.jsdelivr.net'&&u.pathname.indexOf('/npm/three@')===0;
 if(!sameOrigin&&!isThree)return;
 if(isThree){ // Three.js no cambia (versión fija): primero la copia local
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(n=>{const c=n.clone();caches.open(CACHE).then(ch=>ch.put(r,c));return n})));return}
 e.respondWith(fetch(r).then(n=>{if(n&&n.ok){const c=n.clone();caches.open(CACHE).then(ch=>ch.put(r,c))}return n}).catch(()=>caches.match(r).then(h=>h||caches.match('./index.html'))));
});
