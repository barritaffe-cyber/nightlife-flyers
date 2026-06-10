const CACHE_VERSION = "nf-pwa-2026-06-10-01";
const STATIC_CACHE = `${CACHE_VERSION}:static`;
const RUNTIME_CACHE = `${CACHE_VERSION}:runtime`;

const PRECACHE_URLS = [
  "/site.webmanifest",
  "/branding/nf-logo.png",
  "/branding/nf-logo-192.png",
  "/branding/nf-logo-512.png",
  "/branding/nf-maskable-512.png",
  "/apple-touch-icon.png",
];

const CACHEABLE_PREFIXES = [
  "/_next/static/",
  "/branding/",
  "/samples/",
  "/mobile-assets/",
  "/template-previews/",
  "/template-assets/",
  "/templates/",
  "/scene-assets/",
  "/design-elements/",
  "/flares/",
  "/clouds/",
  "/textures/",
  "/texture-assets/",
  "/cinematic-refs/",
  "/fonts/",
  "/landing/",
];

const NEVER_CACHE_PREFIXES = [
  "/api/",
  "/auth/",
  "/billing/",
  "/profile",
  "/admin",
];

const CACHEABLE_EXTENSIONS = new Set([
  "avif",
  "css",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "js",
  "json",
  "mp4",
  "otf",
  "png",
  "svg",
  "ttf",
  "webm",
  "webmanifest",
  "webp",
  "woff",
  "woff2",
]);

function getExtension(pathname) {
  const segment = pathname.split("/").pop() || "";
  const dot = segment.lastIndexOf(".");
  return dot >= 0 ? segment.slice(dot + 1).toLowerCase() : "";
}

function shouldNeverCache(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function shouldRuntimeCache(pathname) {
  if (shouldNeverCache(pathname)) return false;
  if (CACHEABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return CACHEABLE_EXTENSIONS.has(getExtension(pathname));
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
        trimCache(cacheName, 220).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("nf-pwa-") && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") return;
  if (shouldNeverCache(url.pathname)) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (shouldRuntimeCache(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
