// Şantiye Defteri çevrimdışı önbelleği.
// Sayfa: önce internetten (yeni sürüm gelsin), yoksa önbellekten. Kod ve yazı tipleri: önbellekten.
// Supabase istekleri önbelleğe karışmaz.
const CACHE = 'santiye-defteri-v2';
// Yayın derlemesi bu listeyi o sürümün bütün dosyalarıyla doldurur. Yeni sürüm kurulurken hepsi
// önceden indirilir; eski önbellek ancak yenisi tamamlanınca silinir. (Önceden yalnız sayfa iskeleti
// kaydediliyordu; güncellemeden sonra kod dosyaları önbellekte olmadığı için internetsiz açılmıyordu.)
const FILES = ["./","./a4-NO5GZBIE.js","./apple-touch-icon.png","./chunk-MNKAFE6W.js","./chunk-NPHWT2XV.js","./chunk-RJA75TS5.js","./chunk-RZPNBXP7.js","./chunk-WCIIC3BJ.js","./icon-192.png","./icon-512.png","./icon-maskable.png","./idb-5B7SCVZW.js","./inter-400.woff","./inter-500.woff","./inter-600.woff","./inter-700.woff","./inter-800.woff","./inter-900.woff","./logo.png","./main-CGDRLQMX.css","./main-NL57KHXZ.js","./manifest.webmanifest","./pdf-F2EJJWDZ.js","./pdf.worker-6.2.108.min.mjs","./push-CWUZI35C.js","./reportPdf-E45ZNP2X.js"];

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
  // Kök uygulama, deneme kanalının (/beta/) isteklerine karışmaz; onun kendi önbelleği var.
  const scope = new URL(self.registration.scope).pathname;
  if (same && !scope.endsWith('/beta/') && url.pathname.startsWith(scope + 'beta/')) return;
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

// Bildirim (Web Push): sunucudan gelen başlık/metni gösterir; dokununca uygulamayı açar.
self.addEventListener('push', (e) => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch { m = { title: 'EA Şantiye Defteri', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(m.title || 'EA Şantiye Defteri', {
    body: m.body || '', tag: m.tag, icon: './icon-192.png', badge: './icon-192.png', data: { url: m.url || './' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  // Göreli adres ('./#/…', './?is=…') servis çalışanının kapsamına göre mutlak yapılır (alt klasördeki kanallar da çalışır).
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find((x) => x.url.startsWith(self.registration.scope));
    if (!c) { await self.clients.openWindow(url); return; }
    try { await c.focus(); } catch { /* yok say */ }
    // Açık uygulamaya haber ver (sayfayı yenilemeden gider); ayrıca adres farklıysa doğrudan yönlendir.
    try { c.postMessage({ type: 'nav', url }); } catch { /* yok say */ }
    if (c.url !== url && typeof c.navigate === 'function') { try { await c.navigate(url); } catch { /* mesaj yeterli */ } }
  })());
});
