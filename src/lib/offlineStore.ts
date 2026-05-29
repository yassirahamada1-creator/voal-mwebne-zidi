import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "vdl-offline";
const DB_VERSION = 1;
const CACHE_NAME = "vdl-offline-v1";

export type StoreName = "modules" | "contents" | "quiz" | "gallery" | "translations" | "meta";

const STORES: { name: StoreName; key: string }[] = [
  { name: "modules", key: "id" },
  { name: "contents", key: "id" },
  { name: "quiz", key: "id" },
  { name: "gallery", key: "id" },
  { name: "translations", key: "key" },
  { name: "meta", key: "k" },
];

// ─── IndexedDB ───────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("no idb"));
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) {
        if (!db.objectStoreNames.contains(s.name)) {
          db.createObjectStore(s.name, { keyPath: s.key });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store: StoreName, mode: IDBTransactionMode) {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

export async function idbGetAll<T = any>(store: StoreName): Promise<T[]> {
  try {
    const os = await tx(store, "readonly");
    return await new Promise<T[]>((res, rej) => {
      const r = os.getAll();
      r.onsuccess = () => res((r.result as T[]) ?? []);
      r.onerror = () => rej(r.error);
    });
  } catch {
    return [];
  }
}

export async function idbGet<T = any>(store: StoreName, key: string): Promise<T | null> {
  try {
    const os = await tx(store, "readonly");
    return await new Promise<T | null>((res, rej) => {
      const r = os.get(key);
      r.onsuccess = () => res((r.result as T) ?? null);
      r.onerror = () => rej(r.error);
    });
  } catch {
    return null;
  }
}

async function idbBulkPut(store: StoreName, rows: any[]) {
  if (!rows?.length) return;
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const t = db.transaction(store, "readwrite");
      const os = t.objectStore(store);
      for (const row of rows) os.put(row);
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  } catch {
    /* ignore */
  }
}

async function idbClear(store: StoreName) {
  try {
    const db = await openDB();
    await new Promise<void>((res) => {
      const t = db.transaction(store, "readwrite");
      t.objectStore(store).clear();
      t.oncomplete = () => res();
      t.onerror = () => res();
    });
  } catch {
    /* ignore */
  }
}

// ─── Cache Storage (médias) ──────────────────────────────────────────────────

async function getCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function hasMedia(url?: string | null): Promise<boolean> {
  if (!url) return false;
  const c = await getCache();
  if (!c) return false;
  const hit = await c.match(url);
  return !!hit;
}

export async function hasAllMedia(urls: (string | null | undefined)[]): Promise<boolean> {
  const list = urls.filter((u): u is string => !!u);
  if (list.length === 0) return false;
  const c = await getCache();
  if (!c) return false;
  for (const u of list) {
    const hit = await c.match(u);
    if (!hit) return false;
  }
  return true;
}

/** Renvoie un blob: URL si présent en cache, sinon l'URL distante. */
export async function resolveMedia(url?: string | null): Promise<{ url: string | null; offline: boolean }> {
  if (!url) return { url: null, offline: false };
  const c = await getCache();
  if (!c) return { url, offline: false };
  try {
    const cached = await c.match(url);
    if (cached) {
      const blob = await cached.blob();
      return { url: URL.createObjectURL(blob), offline: true };
    }
  } catch {
    /* ignore */
  }
  return { url, offline: false };
}

/** Supprime des URLs du cache hors-ligne. */
export async function removeMediaUrls(urls: (string | null | undefined)[]): Promise<void> {
  const c = await getCache();
  if (!c) return;
  let any = false;
  for (const u of urls) {
    if (!u) continue;
    try {
      const r = await c.delete(u);
      if (r) any = true;
    } catch {
      /* ignore */
    }
  }
  if (any) emitCacheChanged();
}

/** Liste toutes les URLs actuellement en cache hors-ligne. */
export async function listCachedUrls(): Promise<string[]> {
  const c = await getCache();
  if (!c) return [];
  try {
    const reqs = await c.keys();
    return reqs.map((r) => r.url);
  } catch {
    return [];
  }
}

/** Télécharge et met en cache une URL. Retourne true si succès. */
async function fetchAndCache(url: string, signal?: AbortSignal): Promise<boolean> {
  const c = await getCache();
  if (!c) return false;
  try {
    const existing = await c.match(url);
    if (existing) return true;
    const res = await fetch(url, { mode: "cors", signal });
    if (!res.ok) return false;
    await c.put(url, res.clone());
    return true;
  } catch {
    return false;
  }
}

/** Télécharge plusieurs URLs dans le cache hors-ligne. */
export async function cacheMediaUrls(
  urls: (string | null | undefined)[],
  opts?: {
    onProgress?: (done: number, total: number) => void;
    signal?: AbortSignal;
  },
): Promise<{ ok: number; failed: number }> {
  const list = urls.filter((u): u is string => !!u && /^https?:\/\//.test(u));
  const total = list.length;
  let done = 0;
  let ok = 0;
  let failed = 0;
  opts?.onProgress?.(done, total);
  for (const url of list) {
    if (opts?.signal?.aborted) break;
    const r = await fetchAndCache(url, opts?.signal);
    if (r) ok++;
    else failed++;
    done++;
    opts?.onProgress?.(done, total);
  }
  if (ok > 0) emitCacheChanged();
  return { ok, failed };
}

// ─── Événement cacheChanged ──────────────────────────────────────────────────

export const CACHE_CHANGED_EVENT = "vdl-cache-changed";

export function onCacheChanged(cb: () => void): () => void {
  window.addEventListener(CACHE_CHANGED_EVENT, cb);
  return () => window.removeEventListener(CACHE_CHANGED_EVENT, cb);
}

function emitCacheChanged() {
  try {
    window.dispatchEvent(new Event(CACHE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

// ─── Types Sync ──────────────────────────────────────────────────────────────

export type SyncProgress = {
  done: number;
  total: number;
  pct: number;
};

export type SyncResult = {
  ok: boolean;
  done: number;
  total: number;
  failed: number;
  failedUrls: string[];
  addedContents: number;
  addedGallery: number;
};

// ─── Sync complet ────────────────────────────────────────────────────────────

export async function syncAll(opts?: {
  onProgress?: (p: SyncProgress) => void;
  signal?: AbortSignal;
}): Promise<SyncResult> {
  const onProgress = opts?.onProgress ?? (() => {});
  const signal = opts?.signal;

  // ── 1. Snapshot IDB pour détecter les nouveautés ──────────────────────────
  const [prevContents, prevGallery] = await Promise.all([
    idbGetAll<{ id: string }>("contents"),
    idbGetAll<{ id: string }>("gallery"),
  ]);
  const prevContentIds = new Set(prevContents.map((c) => c.id));
  const prevGalleryIds = new Set(prevGallery.map((g) => g.id));

  // ── 2. Fetch Supabase ─────────────────────────────────────────────────────
  const [
    { data: modulesData },
    { data: contentsData },
    { data: quizData },
    { data: galleryData },
    { data: translationsData },
  ] = await Promise.all([
    supabase.from("modules").select("*").eq("is_active", true).order("order_index"),
    supabase.from("contents").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("quiz_questions").select("*").eq("is_published", true).order("order_index"),
    supabase.from("gallery_items").select("*").eq("is_published", true).order("order_index"),
    supabase.from("translations").select("*").order("key"),
  ]);

  const modules = (modulesData ?? []) as any[];
  const contents = (contentsData ?? []) as any[];
  const quiz = (quizData ?? []) as any[];
  const gallery = (galleryData ?? []) as any[];
  const translations = (translationsData ?? []) as any[];

  // ── 3. Persist IDB (clear + put pour supprimer les entrées supprimées) ────
  await Promise.all([
    idbClear("modules").then(() => idbBulkPut("modules", modules)),
    idbClear("contents").then(() => idbBulkPut("contents", contents)),
    idbClear("quiz").then(() => idbBulkPut("quiz", quiz)),
    idbClear("gallery").then(() => idbBulkPut("gallery", gallery)),
    idbClear("translations").then(() =>
      idbBulkPut(
        "translations",
        translations.map((t: any) => ({ key: t.key, ...t })),
      ),
    ),
  ]);

  const wasFirstRun = prevContents.length === 0 && prevGallery.length === 0;
  const addedContents = wasFirstRun ? 0 : contents.filter((c) => !prevContentIds.has(c.id)).length;
  const addedGallery = wasFirstRun ? 0 : gallery.filter((g) => !prevGalleryIds.has(g.id)).length;

  // ── 4. Collecte URLs média ────────────────────────────────────────────────
  const urls = new Set<string>();
  const add = (u?: string | null) => {
    if (u && /^https?:\/\//.test(u)) urls.add(u);
  };

  for (const m of modules) add(m.cover_image_url);
  for (const c of contents) {
    add(c.thumbnail_url);
    add(c.cover_image_url);
    // Vidéos : on ne précharge pas le fichier lourd, seulement la vignette
    if (c.type !== "video") add(c.media_url);
  }
  for (const g of gallery) {
    add(g.image_url);
    add(g.thumbnail_url);
  }
  for (const q of quiz) add(q.image_url);

  // ── 5. Téléchargement concurrent ──────────────────────────────────────────
  const list = Array.from(urls);
  const total = list.length;
  let done = 0;
  let aborted = false;
  const failedUrls: string[] = [];

  onProgress({ done, total, pct: total ? 0 : 1 });

  const CONCURRENCY = 4;
  let idx = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () =>
    (async () => {
      while (idx < list.length && !aborted) {
        if (signal?.aborted) {
          aborted = true;
          break;
        }
        const url = list[idx++];
        const ok = await fetchAndCache(url, signal);
        if (!ok) failedUrls.push(url);
        done++;
        onProgress({ done, total, pct: total ? done / total : 1 });
      }
    })(),
  );
  await Promise.all(workers);

  await idbBulkPut("meta", [
    { k: "lastSync", v: Date.now() },
    { k: "lastFailed", v: failedUrls.length },
  ]);

  emitCacheChanged();

  return {
    ok: !aborted,
    done,
    total,
    failed: failedUrls.length,
    failedUrls,
    addedContents,
    addedGallery,
  };
}

// ─── Préchargement miniatures uniquement ─────────────────────────────────────

export async function preloadThumbnails(opts?: {
  onProgress?: (p: SyncProgress) => void;
  signal?: AbortSignal;
}): Promise<{ ok: number; failed: number; total: number }> {
  const onProgress = opts?.onProgress ?? (() => {});
  const signal = opts?.signal;

  let modules: any[] = [];
  let contents: any[] = [];
  let gallery: any[] = [];

  const online = typeof navigator === "undefined" || navigator.onLine;
  if (online) {
    const [m, c, g] = await Promise.all([
      supabase.from("modules").select("id,cover_image_url").eq("is_active", true),
      supabase.from("contents").select("id,thumbnail_url,type,media_url").eq("is_published", true),
      supabase.from("gallery_items").select("id,image_url").eq("is_published", true),
    ]);
    modules = m.data ?? [];
    contents = c.data ?? [];
    gallery = g.data ?? [];
  } else {
    [modules, contents, gallery] = await Promise.all([
      idbGetAll("modules"),
      idbGetAll("contents"),
      idbGetAll("gallery"),
    ]);
  }

  const urls = new Set<string>();
  const add = (u?: string | null) => {
    if (u && /^https?:\/\//.test(u)) urls.add(u);
  };

  for (const m of modules) add(m.cover_image_url);
  for (const c of contents) {
    add(c.thumbnail_url);
    if (c.type === "image") add(c.media_url);
  }
  for (const g of gallery) add(g.image_url);

  const list = Array.from(urls);
  const total = list.length;
  let done = 0;
  let ok = 0;
  let failed = 0;
  let aborted = false;

  onProgress({ done, total, pct: total ? 0 : 1 });

  const CONCURRENCY = 4;
  let idx = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () =>
    (async () => {
      while (idx < list.length && !aborted) {
        if (signal?.aborted) {
          aborted = true;
          break;
        }
        const url = list[idx++];
        const r = await fetchAndCache(url, signal);
        if (r) ok++;
        else failed++;
        done++;
        onProgress({ done, total, pct: total ? done / total : 1 });
      }
    })(),
  );
  await Promise.all(workers);

  if (ok > 0) emitCacheChanged();
  return { ok, failed, total };
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

export async function getLastSync(): Promise<number | null> {
  const row = await idbGet<{ k: string; v: number }>("meta", "lastSync");
  return row?.v ?? null;
}

export async function clearAllOffline(): Promise<void> {
  await Promise.all(STORES.map((s) => idbClear(s.name)));
  if (typeof caches !== "undefined") {
    try {
      await caches.delete(CACHE_NAME);
    } catch {
      /* ignore */
    }
  }
  emitCacheChanged();
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
