// Whole-app service worker — installability and offline reading apply to
// all of HeangOS, not just Finance (AGENTS.md: "Do not make Finance a
// separate PWA"). Scope is deliberately modest per the PWA phase: app-shell
// precache + read-only recent data via cache fallback. Mutations are never
// intercepted, cached, or queued — an offline write simply fails with a
// normal network error, exactly as it would with no service worker at all.
const CACHE_NAME = "heangos-v1";

const PRECACHE_URLS = [
  "/today",
  "/tasks",
  "/goals",
  "/habits",
  "/finance",
  "/learning",
  "/login",
  "/icons/icon-192",
  "/icons/icon-512",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never touch a mutation — no offline write queue exists, so a POST/PUT/
  // PATCH/DELETE must always hit the real network (and fail normally if
  // there isn't one). Only GET is ever cached.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes: network-first, falling back to the last cached response —
  // this is the "read-only recent cached data" offline behavior.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Pages and static assets: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    )
  );
});
