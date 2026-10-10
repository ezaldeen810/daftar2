// الدفتر — service worker: يشغّل التطبيق حتى بدون نت، ويجيب آخر نسخة من الكود إذا النت موجود
const CACHE = 'daftar2-v1';
const CORE = ['./', './index.html', './config.js', './manifest.json', './icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('daftar2-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // مكتبة Firebase: ثابتة لكل إصدار، فنحفظها مرة وحدة حتى يشتغل التطبيق بدون نت
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await Promise.race([fetch(req), timeout(4000)]);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
    }
  })());
});
