// NutriSG Service Worker v1
// Handles: offline caching + meal reminder notifications

const CACHE_NAME = "nutrisg-v1";
const STATIC_ASSETS = ["/", "/index.html"];

// ── Install: cache static assets ─────────────────────────────────────────────
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fallback to network ──────────────────────────────
self.addEventListener("fetch", e => {
  // Only cache GET requests for same origin
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        // Cache successful responses
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached); // offline fallback
      return cached || network;
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});

// ── Periodic alarm check (via message from app) ───────────────────────────────
self.addEventListener("message", e => {
  if (e.data?.type === "CHECK_REMINDERS") {
    const schedule = e.data.schedule;
    if (!schedule?.enabled) return;

    const now   = new Date();
    const hhmm  = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

    const meals = [
      { time: schedule.breakfast, label:"Breakfast", emoji:"🌅" },
      { time: schedule.lunch,     label:"Lunch",     emoji:"☀️" },
      { time: schedule.dinner,    label:"Dinner",    emoji:"🌙" },
    ];

    meals.forEach(m => {
      if (m.time === hhmm) {
        self.registration.showNotification(`${m.emoji} Time to log ${m.label}!`, {
          body: "Don't forget to track your meal in NutriSG.",
          icon: "/icon.jpeg",
          badge: "/icon.jpeg",
          tag: `nutrisg-${m.label.toLowerCase()}`,
          renotify: false,
        });
      }
    });
  }
});
