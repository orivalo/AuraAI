const CACHE_NAME = "aura-ai-v3";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Install: pre-cache static assets (GET, http/https only)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch: only handle GET + http/https; skip navigation (let browser handle redirects)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Do not intercept navigations to avoid redirect issues
  if (request.mode === "navigate") {
    return;
  }

  if (
    request.method !== "GET" ||
    request.url.startsWith("chrome-extension://") ||
    !request.url.startsWith("http")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (
          !response ||
          response.status !== 200 ||
          response.type !== "basic"
        ) {
          return response;
        }
        const respClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, respClone);
        });
        return response;
      });
    })
  );
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return null;
        })
      )
    )
  );
});

