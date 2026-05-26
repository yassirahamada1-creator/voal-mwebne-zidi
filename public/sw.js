// Service worker cache-first pour permettre l'ouverture hors-ligne.
// Précache l'app shell au install ; en runtime : cache d'abord, réseau ensuite.
const CACHE = "vdl-shell-v2";
const SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Bypass complet pour les modules Vite dev, HMR, sourcemaps et toute URL versionnée (?v=…).
  // Sinon le SW sert des chunks obsolètes pointant vers d'anciennes instances de React.
  const isDevAsset =
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/@react-refresh") ||
    url.pathname.startsWith("/@id/") ||
    url.pathname.startsWith("/@fs/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.endsWith(".map") ||
    url.searchParams.has("v") ||
    url.searchParams.has("t") ||
    url.searchParams.has("import");
  if (isDevAsset) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
