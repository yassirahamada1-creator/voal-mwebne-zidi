// Refonte mode hors ligne — version simple
// Un seul module qui gère :
//  • IndexedDB (couche maison, pas de dépendance) avec stores : modules, contents, quiz, gallery, translations, meta
//  • Cache Storage `vdl-offline-v1` pour tous les médias (images, audio, vidéo, miniatures, covers)
// L'app fait un sync complet idempotent au lancement quand il y a du réseau.
// Hors ligne, les listes lisent depuis IDB et masquent ce qui n'a pas son média en cache.

import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "vdl-offline";
const DB_VERSION = 1;
const CACHE_NAME = "vdl-offline-v1";

export type StoreName =
  | "modules"
  | "contents"
  | "quiz"
  | "gallery"
  | "translations"
  | "meta";

const STORES: { name: StoreName; key: string }[] = [
  { name: "modules", key: "id" },
  { name: "contents", key: "id" },
  { name: "quiz", key: "id" },
  { name: "gallery", key: "id" },
  { name: "translations", key: "key" },
  { name: "meta", key: "k" },
];

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
  } catch {/* ignore */}
}

// ---------- Cache Storage (médias) ----------

async function getCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try { return await caches.open(CACHE_NAME); } catch { return null; }
}

export async function hasMedia(url?: string | null): Promise<boolean> {
  if (!url) return false;
  const c = await getCache();
  if (!c) return false;
  const hit = await c.match(url);
  return !!hit;
}

/** Renvoie un blob: URL si présent en cache, sinon l'URL distante. */
export async function resolveMedia(url?: string | null): Promise<{ url: string | null; offline: boolean }> {
  if (!url) return { url: null, offline: false };
  const c = await getCache();
  if (!c) return { url, offline: false };
  try {
    const hit = await c.match(url);
    if (hit) {
      const blob = await hit.blob();
      return { url: URL.createObjectURL(blob), offline: true };
    }
  } catch {/* ignore */}
  return { url, offline: false };
}

/** Émis dès qu'une URL est ajoutée ou retirée du cache hors-ligne. */
export const CACHE_CHANGED_EVENT = "vdl-cache-changed";
function emitCacheChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CACHE_CHANGED_EVENT));
  }
}

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

/** Télécharge plusieurs URLs dans le cache hors-ligne (téléchargement individuel par contenu). */
export async function cacheMediaUrls(
  urls: (string | null | undefined)[],
  opts?: { onProgress?: (done: number, total: number) => void; signal?: AbortSignal },
): Promise<{ ok: number; failed: number }> {
  const list = urls.filter((u): u is string => !!u && /^https?:\/\//.test(u));
  const total = list.length;
  let done = 0; let ok = 0; let failed = 0;
  opts?.onProgress?.(done, total);
  for (const url of list) {
    if (opts?.signal?.aborted) break;
    const r = await fetchAndCache(url, opts?.signal);
    if (r) ok++; else failed++;
    done++;
    opts?.onProgress?.(done, total);
  }
  if (ok > 0) emitCacheChanged();
  return { ok, failed };
}

/** Supprime des URLs du cache hors-ligne. */
export async function removeMediaUrls(urls: (string | null | undefined)[]): Promise<void> {
  const c = await getCache();
  if (!c) return;
  let any = false;
  for (const u of urls) {
    if (!u) continue;
    try { const r = await c.delete(u); if (r) any = true; } catch {/* ignore */}
  }
  if (any) emitCacheChanged();
}

/** Vrai si toutes les URLs (non vides) sont en cache. */
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

// ---------- Sync ----------

export type SyncProgress = {
  status: "idle" | "syncing" | "ready" | "error";
  done: number;
  total: number;
  pct: number;
  lastSync: number | null;
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

export async function syncAll(opts?: {
  onProgress?: (p: { done: number; total: number; pct: number }) => void;
  signal?: AbortSignal;
}): Promise<SyncResult> {
  const onProgress = opts?.onProgress ?? (() => {});
  const signal = opts?.signal;

  // 0) Snapshot des IDs actuels (pour détecter les nouveautés)
  const [prevContents, prevGallery] = await Promise.all([
    idbGetAll<{ id: string }>("contents"),
    idbGetAll<{ id: string }>("gallery"),
  ]);
  const prevContentIds = new Set(prevContents.map((c) => c.id));
  const prevGalleryIds = new Set(prevGallery.map((g) => g.id));

  // 1) Métadonnées Supabase (en parallèle)
  const [modulesRes, contentsRes, quizRes, galleryRes, translationsRes] = await Promise.all([
    supabase.from("modules").select("*").eq("is_active", true).order("order_index"),
    supabase.from("contents").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("quiz_questions").select("*").eq("is_published", true).order("order_index"),
    supabase.from("gallery_items").select("*").eq("is_published", true).order("order_index"),
    supabase.from("translations").select("*").order("key"),
  ]);

  const modules = (modulesRes.data ?? []) as any[];
  const contents = (contentsRes.data ?? []) as any[];
  const quiz = (quizRes.data ?? []) as any[];
  const gallery = (galleryRes.data ?? []) as any[];
  const translations = (translationsRes.data ?? []) as any[];

  // Remplace par les versions fraîches : on clear puis put.
  await Promise.all([
    idbClear("modules").then(() => idbBulkPut("modules", modules)),
    idbClear("contents").then(() => idbBulkPut("contents", contents)),
    idbClear("quiz").then(() => idbBulkPut("quiz", quiz)),
    idbClear("gallery").then(() => idbBulkPut("gallery", gallery)),
    idbClear("translations").then(() => idbBulkPut("translations", translations)),
  ]);

  // Comptage des nouveautés (uniquement si on avait déjà une base — sinon 1ère sync)
  const wasFirstRun = prevContents.length === 0 && prevGallery.length === 0;
  const addedContents = wasFirstRun ? 0 : contents.filter((c) => !prevContentIds.has(c.id)).length;
  const addedGallery = wasFirstRun ? 0 : gallery.filter((g) => !prevGalleryIds.has(g.id)).length;

  // 2) Liste des médias à mettre en cache
  // Règle : on télécharge tout (couvertures, vignettes, audio, images, galerie)
  // SAUF le media_url des vidéos, qui restent à télécharger manuellement.
  const urls = new Set<string>();
  const add = (u?: string | null) => { if (u && /^https?:\/\//.test(u)) urls.add(u); };
  for (const m of modules) add(m.cover_image_url);
  for (const c of contents) {
    add(c.thumbnail_url);
    if (c.type !== "video") add(c.media_url);
  }
  for (const g of gallery) add(g.image_url);

  const all = Array.from(urls);
  const total = all.length;
  let done = 0;
  const failedUrls: string[] = [];
  onProgress({ done, total, pct: total ? 0 : 1 });

  // 3) Téléchargement parallèle borné (4 simultanés)
  const CONCURRENCY = 4;
  let idx = 0;
  let aborted = false;
  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () =>
    (async () => {
      while (idx < all.length && !aborted) {
        if (signal?.aborted) { aborted = true; break; }
        const url = all[idx++];
        const ok = await fetchAndCache(url, signal);
        if (!ok) failedUrls.push(url);
        done++;
        onProgress({ done, total, pct: total ? done / total : 1 });
      }
    })(),
  );
  await Promise.all(workers);

  const lastSync = Date.now();
  await idbBulkPut("meta", [
    { k: "lastSync", v: lastSync },
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

/**
 * Précharge uniquement les miniatures (couvertures de modules, vignettes de contenus,
 * images de la galerie) pour garantir l'affichage hors-ligne sans télécharger les médias lourds.
 * Lit d'abord depuis Supabase si en ligne, sinon retombe sur les listes IDB déjà connues.
 */
export async function preloadThumbnails(opts?: {
  onProgress?: (p: { done: number; total: number; pct: number }) => void;
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
  const add = (u?: string | null) => { if (u && /^https?:\/\//.test(u)) urls.add(u); };
  for (const m of modules) add(m.cover_image_url);
  for (const c of contents) {
    add(c.thumbnail_url);
    // Pour les images de la grille catégorie, l'aperçu utilise media_url comme miniature.
    if (c.type === "image") add(c.media_url);
  }
  for (const g of gallery) add(g.image_url);

  const list = Array.from(urls);
  const total = list.length;
  let done = 0; let ok = 0; let failed = 0;
  onProgress({ done, total, pct: total ? 0 : 1 });

  const CONCURRENCY = 4;
  let idx = 0; let aborted = false;
  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () =>
    (async () => {
      while (idx < list.length && !aborted) {
        if (signal?.aborted) { aborted = true; break; }
        const url = list[idx++];
        const r = await fetchAndCache(url, signal);
        if (r) ok++; else failed++;
        done++;
        onProgress({ done, total, pct: total ? done / total : 1 });
      }
    })(),
  );
  await Promise.all(workers);

  if (ok > 0) emitCacheChanged();
  return { ok, failed, total };
}

export async function getLastSync(): Promise<number | null> {
  const row = await idbGet<{ k: string; v: number }>("meta", "lastSync");
  return row?.v ?? null;
}

export async function clearAllOffline(): Promise<void> {
  // Vide IDB + Cache Storage
  await Promise.all(STORES.map((s) => idbClear(s.name)));
  if (typeof caches !== "undefined") {
    try { await caches.delete(CACHE_NAME); } catch {/* ignore */}
  }
  emitCacheChanged();
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  } catch { return null; }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
