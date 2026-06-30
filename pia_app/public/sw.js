// Service worker for the Station Ops PWA.
// Provides installability and a small app-shell offline fallback. Auth- and
// data-bearing requests are always served network-first so we never show stale
// finance/leave data; only same-origin GET navigations get an offline fallback.

const CACHE = "station-ops-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET navigations. Everything else (API calls,
  // Supabase, POST, cross-origin) goes straight to the network untouched.
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL)),
  );
});

// --- Web Push -------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Station Ops", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Station Ops";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { link: data.link || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if one is open, else open a new one.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
