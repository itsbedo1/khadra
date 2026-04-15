// ══════════════════════════════════════
// خضرة | Khadra Fresh — Service Worker
// ══════════════════════════════════════

const CACHE_NAME = 'khadra-v1';

// الملفات اللي تتحفظ للاستخدام بدون إنترنت
const STATIC_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap'
];

// ── Install ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE).catch(err => {
        console.warn('Cache install partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API — دايماً من الشبكة (بيانات حية)
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Google Fonts — من الشبكة أولاً ثم الكاش
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // باقي الملفات — الكاش أولاً ثم الشبكة
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // صفحة offline لو ما كان إنترنت
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── Push Notifications (مستقبلاً) ──
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'خضرة', body: 'إشعار جديد' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'خضرة 🌿', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || './'));
});
