/* Service worker — WAC Docs (Victor Reis, WAC Engenharia)
   Estratégia: o index.html vem sempre da rede quando há internet
   (= atualização automática para todos) e do cache quando offline. */
const CACHE='wac-docs-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;      // Gemini/API passam direto
  if(req.mode==='navigate'||url.pathname.endsWith('index.html')||url.pathname.endsWith('/')){
    // rede primeiro (pega a versão nova), cache como reserva offline
    e.respondWith(
      fetch(req).then(r=>{
        const copia=r.clone();
        caches.open(CACHE).then(c=>c.put(req,copia));
        return r;
      }).catch(()=>caches.match(req))
    );
  } else {
    // ícones/manifest: cache primeiro
    e.respondWith(
      caches.match(req).then(hit=>hit||fetch(req).then(r=>{
        const copia=r.clone();
        caches.open(CACHE).then(c=>c.put(req,copia));
        return r;
      }))
    );
  }
});
