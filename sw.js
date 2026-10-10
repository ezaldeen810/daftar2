// الدفتر — service worker: يشغّل التطبيق حتى بدون نت، ويجيب آخر نسخة من الكود إذا النت موجود
const CACHE = 'dafter-local-1';
const CORE = ['./', './index.html', './manifest.json', './icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('dafter-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await Promise.race([fetch(req), timeout(4000)]);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const c = await caches.open(CACHE); // نبحث بملفاتنا بس، مو بملفات التطبيق الثاني
      return (await c.match(req)) || (await c.match('./index.html')) || Response.error();
    }
  })());
});
