// Şantiye Defteri çevrimdışı önbelleği.
// Sayfa: önce internetten (yeni sürüm gelsin), yoksa önbellekten. Kod ve yazı tipleri: önbellekten.
// Supabase istekleri önbelleğe karışmaz.
const CACHE = 'santiye-defteri-PJRXXH2I';
// Yayın derlemesi bu listeyi o sürümün bütün dosyalarıyla doldurur. Yeni sürüm kurulurken hepsi
// önceden indirilir; eski önbellek ancak yenisi tamamlanınca silinir. (Önceden yalnız sayfa iskeleti
// kaydediliyordu; güncellemeden sonra kod dosyaları önbellekte olmadığı için internetsiz açılmıyordu.)
const FILES = ["./","./a4-T24GLQT3.js","./apple-touch-icon.png","./chunk-KYXYIWGW.js","./chunk-X4HY7A4J.js","./icon-192.png","./icon-512.png","./icon-maskable.png","./inter-400.woff","./inter-500.woff","./inter-600.woff","./inter-700.woff","./inter-800.woff","./inter-900.woff","./main-DM4ICOPM.css","./main-PJRXXH2I.js","./manifest.webmanifest","./pdf-GIGTALR4.js","./pdf.worker-6.2.108.min.mjs","./reportPdf-A4F4B4OB.js"];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const font = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put('./', copy));
      return r;
    }).catch(async () => (await caches.match('./')) || (await caches.match('./index.html')) || Response.error()));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
