const VERSION="2026.11.11-3";
const CACHE="academia-"+VERSION;
const FILES=["./","index.html","cloud.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png",
 "vendor/firebase/firebase-app-compat.js","vendor/firebase/firebase-auth-compat.js","vendor/firebase/firebase-firestore-compat.js"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("academia-")&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const u=new URL(e.request.url); if(u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); } return r; })
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))));
});
