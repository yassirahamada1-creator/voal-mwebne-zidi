// Service worker cache-first pour permettre l'ouverture hors-ligne.
// Précache l'app shell au install ; en runtime : cache d'abord, réseau ensuite.
// v4 : cache aussi les polices Google + cdnfonts (responses CORS/opaques)
//      pour un rendu visuel fidèle hors-ligne.
const CACHE = "vdl-shell-v4";
const SHELL = ["/", "/index.html", "/manifest.json"];

// Hôtes de polices à mettre en cache (réponses CORS, parfois opaques).
const FONT_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "fonts.cdnfonts.com",
];

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

  const isFontAsset = FONT_HOSTS.includes(url.hostname);

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (!res) return res;
          // Same-origin : on garde la règle stricte (status 200, type basic).
          // Polices CDN : on accepte les réponses CORS ET opaques (type "opaque",
          // status 0) car les .woff2 de gstatic sont souvent servis sans CORS.
          const sameOriginOk = res.status === 200 && res.type === "basic";
          const fontOk = isFontAsset && (res.type === "opaque" || res.ok);
          if (sameOriginOk || fontOk) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => {
          // Pour une navigation HTML hors-ligne, on retombe sur l'app shell.
          if (req.mode === "navigate") return caches.match("/index.html");
          return undefined;
        });
    })
  );
});
