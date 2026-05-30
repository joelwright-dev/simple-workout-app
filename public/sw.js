/* Groundwork service worker — app shell + exercise image caching for offline
 * use mid-session. Hand-rolled (no Workbox) to keep the build dependency-free.
 *
 * Strategy:
 *  - jsDelivr exercise stills  -> cache-first (they never change; keep them).
 *  - same-origin GET (pages, JS/CSS chunks, icons) -> stale-while-revalidate
 *    so anything viewed while online is available offline afterwards.
 */

const VERSION = "v1";
const SHELL_CACHE = `groundwork-shell-${VERSION}`;
const IMAGE_CACHE = `groundwork-images-${VERSION}`;

const PRECACHE = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== IMAGE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Exercise stills from jsDelivr: cache-first, persist forever.
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Same-origin: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached) return cached;

  const res = await network;
  if (res) return res;

  // Last resort for navigations: serve the cached app shell.
  if (request.mode === "navigate") {
    const shell = await cache.match("/");
    if (shell) return shell;
  }
  return Response.error();
}
