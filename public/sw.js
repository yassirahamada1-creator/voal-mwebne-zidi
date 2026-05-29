// Service Worker — vdl-shell-v5 + vdl-offline-v1
// v5 : app shell + polices CDN + médias Supabase (Cache First)

const SHELL_CACHE = "vdl-shell-v5";
const MEDIA_CACHE = "vdl-offline-v1";

const SHELL = ["/", "/index.html", "/manifest.json"];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "fonts.cdnfonts.com"];

const MEDIA_HOSTS = ["gatpaniieoesfboixtco.supabase.co"];

const MEDIA_EXT = /\.(mp4|mp3|webm|ogg|wav|jpg|jpeg|png|webp|gif|svg|avif)(\?|$)/i;

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const KEEP = [SHELL_CACHE, MEDIA_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ── 1. Bypass assets dev Vite ────────────────────────────────────────────
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

  // ── 2. Médias distants — Cache First ─────────────────────────────────────
  const isMedia = MEDIA_HOSTS.includes(url.hostname) || MEDIA_EXT.test(url.pathname);

  if (isMedia) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(MEDIA_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) {
            cache.put(req, res.clone()).catch(() => undefined);
          }
          return res;
        } catch {
          return new Response("Media unavailable offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })(),
    );
    return;
  }

  // ── 3. Polices CDN — Cache First, accepte opaque ─────────────────────────
  const isFontAsset = FONT_HOSTS.includes(url.hostname);

  if (isFontAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const fontOk = res.type === "opaque" || res.ok;
            if (fontOk) {
              const copy = res.clone();
              caches
                .open(SHELL_CACHE)
                .then((c) => c.put(req, copy))
                .catch(() => undefined);
            }
            return res;
          })
          .catch(() => undefined);
      }),
    );
    return;
  }

  // ── 4. App shell — Cache First avec fallback réseau ──────────────────────
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (!res) return res;
          const ok = res.status === 200 && res.type === "basic";
          if (ok) {
            const copy = res.clone();
            caches
              .open(SHELL_CACHE)
              .then((c) => c.put(req, copy))
              .catch(() => undefined);
          }
          return res;
        })
        .catch(() => {
          if (req.mode === "navigate") return caches.match("/index.html");
          return undefined;
        });
    }),
  );
});
