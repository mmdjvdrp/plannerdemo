// sw.js
const CACHE_NAME = "planner-cache-v9"; 
const assetsToCache = [
  "/",
  "/index.html",
  "/login.html",
  "/css/style.css",
  "/manifest.json",
  "/js/supabase.js",
  "/js/storage.js",
  "/js/helpers.js",
  "/js/render.js",
  "/js/planner.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), 
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache); 
            }
          })
        );
      })
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && event.request.url.startsWith("https://cdn.jsdelivr.net/")) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
