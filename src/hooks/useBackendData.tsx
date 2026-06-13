import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { idbBulkPut, idbGetAll, resolveMedia, cacheMediaUrls, hasMedia } from "@/lib/offlineStore";

export interface ModuleRow {
  id: string;
  slug: string;
  name_fr: string;
  name_shk: string;
  description_fr: string | null;
  description_shk: string | null;
  cover_image_url: string | null;
  order_index: number;
  is_active: boolean;
}

export interface ContentRow {
  id: string;
  title_fr: string;
  title_shk: string;
  description_fr: string | null;
  description_shk: string | null;
  type: string;
  module_slug: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  is_published: boolean;
  created_at: string;
  parent_id?: string | null;
}

export interface GalleryRow {
  id: string;
  caption_fr: string | null;
  caption_shk: string | null;
  image_url: string;
  module_slug: string | null;
  order_index: number;
  is_published: boolean;
}

export interface QuizRow {
  id: string;
  question_fr: string;
  question_shk: string;
  option_a_fr: string;
  option_a_shk: string;
  option_b_fr: string;
  option_b_shk: string;
  option_c_fr: string | null;
  option_c_shk: string | null;
  option_d_fr: string | null;
  option_d_shk: string | null;
  correct_index: number;
  explanation_fr: string | null;
  explanation_shk: string | null;
  module_slug: string | null;
  order_index: number;
  is_published: boolean;
}

const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine);

type CacheEntry<T> = { data: T[]; ts: number };
const listCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000;
const singleContentCache = new Map<string, { data: ContentRow; ts: number }>();
const singleContentInflight = new Map<string, Promise<ContentRow | null>>();

async function withRetry<T>(fn: () => Promise<T>, delayMs = 350): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    await new Promise((r) => setTimeout(r, delayMs));
    return await fn();
  }
}

function findContentInListCache(id: string): ContentRow | null {
  for (const entry of listCache.values()) {
    const found = (entry.data as any[]).find?.((r) => r?.id === id);
    if (found && found.title_fr !== undefined) return found as ContentRow;
  }
  return null;
}

function extractMediaUrls(rows: any[]): string[] {
  const urls = new Set<string>();
  for (const r of rows ?? []) {
    for (const k of ["thumbnail_url", "cover_image_url", "image_url", "media_url"]) {
      const v = r?.[k];
      if (typeof v === "string" && /^https?:\/\//.test(v)) urls.add(v);
    }
  }
  return Array.from(urls);
}

async function autoCacheMissingMedia(rows: any[]) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const urls = extractMediaUrls(rows);
  if (!urls.length) return;
  const missing: string[] = [];
  for (const u of urls) {
    if (/\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(u)) continue;
    const ok = await hasMedia(u);
    if (!ok) missing.push(u);
  }
  if (missing.length) {
    void cacheMediaUrls(missing);
  }
}

function useReconciledList<T>(opts: {
  storeName: "modules" | "contents" | "quiz" | "gallery";
  channelKey: string;
  table: "modules" | "contents" | "quiz_questions" | "gallery_items";
  filter?: string;
  fetchOnline: () => Promise<T[]>;
  filterOffline?: (rows: T[]) => T[];
  sort: (a: T, b: T) => number;
  deps?: any[];
}) {
  const { storeName, channelKey, table, fetchOnline, filterOffline, sort } = opts;
  const cached = listCache.get(channelKey);
  const [data, setData] = useState<T[]>(cached?.data ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;

    const applyAndCache = (rows: T[]) => {
      const sorted = [...rows].sort(sort);
      listCache.set(channelKey, { data: sorted, ts: Date.now() });
      if (storeName === "contents") {
        const now = Date.now();
        for (const r of sorted as any[]) {
          if (r?.id) singleContentCache.set(r.id, { data: r as ContentRow, ts: now });
        }
      }
      if (!cancelled) {
        setData(sorted);
        setLoading(false);
      }
    };

    const loadOffline = async (): Promise<boolean> => {
      const all = await idbGetAll<T>(storeName);
      const filtered = filterOffline ? filterOffline(all) : all;
      if (filtered.length > 0) {
        applyAndCache(filtered);
        return true;
      }
      return false;
    };

    const loadOnline = async () => {
      try {
        const rows = await withRetry(() => fetchOnline());
        applyAndCache(rows);
        try {
          await idbBulkPut(storeName, rows as any[]);
        } catch {
          /* ignore */
        }
        void autoCacheMissingMedia(rows as any[]);
      } catch {
        const had = await loadOffline();
        if (!had && !cancelled) setLoading(false);
      }
    };

    loadOffline();
    if (isOnline()) {
      loadOnline();
    } else if (!cached) {
      loadOffline().then((had) => {
        if (!had && !cancelled) setLoading(false);
      });
    }

    const onOnline = () => loadOnline();
    window.addEventListener("online", onOnline);

    const channelName = channelKey + "-realtime-" + Date.now();
    const ch = isOnline()
      ? supabase
          .channel(channelName)
          .on("postgres_changes", { event: "*", schema: "public", table }, loadOnline)
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      if (ch) supabase.removeChannel(ch);
    };
  }, [...(opts.deps ?? [])]);

  return { data, loading };
}

export const useModules = () =>
  useReconciledList<ModuleRow>({
    storeName: "modules",
    channelKey: "modules-live",
    table: "modules",
    fetchOnline: async () => {
      const { data } = await supabase.from("modules").select("*").eq("is_active", true).order("order_index");
      return (data ?? []) as ModuleRow[];
    },
    sort: (a, b) => a.order_index - b.order_index,
  });

export const useContents = (moduleSlug?: string) =>
  useReconciledList<ContentRow>({
    storeName: "contents",
    channelKey: "contents-live-" + (moduleSlug ?? "all"),
    table: "contents",
    fetchOnline: async () => {
      let q = supabase.from("contents").select("*").eq("is_published", true);
      if (moduleSlug) q = q.eq("module_slug", moduleSlug);
      const { data } = await q.order("created_at", { ascending: false });
      return (data ?? []) as ContentRow[];
    },
    filterOffline: (rows) => (moduleSlug ? rows.filter((c) => c.module_slug === moduleSlug) : rows),
    sort: (a, b) => (b.created_at || "").localeCompare(a.created_at || ""),
    deps: [moduleSlug],
  });

export const useContentsByParent = (parentId?: string) =>
  useReconciledList<ContentRow>({
    storeName: "contents",
    channelKey: "contents-parent-" + (parentId ?? "none"),
    table: "contents",
    fetchOnline: async () => {
      if (!parentId) return [];
      const { data } = await supabase
        .from("contents")
        .select("*")
        .eq("is_published", true)
        .eq("parent_id", parentId)
        .order("created_at", { ascending: false });
      return (data ?? []) as ContentRow[];
    },
    filterOffline: (rows) => (parentId ? rows.filter((c) => c.parent_id === parentId) : []),
    sort: (a, b) => (b.created_at || "").localeCompare(a.created_at || ""),
    deps: [parentId],
  });

async function fetchSingleContent(id: string): Promise<ContentRow | null> {
  if (singleContentInflight.has(id)) return singleContentInflight.get(id)!;
  const p = (async () => {
    try {
      const row = await withRetry(async () => {
        const { data, error } = await supabase.from("contents").select("*").eq("id", id).single();
        if (error) throw error;
        return data as ContentRow;
      });
      if (row) singleContentCache.set(id, { data: row, ts: Date.now() });
      return row;
    } catch {
      const all = await idbGetAll<ContentRow>("contents");
      const found = all.find((c) => c.id === id) ?? null;
      if (found) singleContentCache.set(id, { data: found, ts: Date.now() });
      return found;
    } finally {
      singleContentInflight.delete(id);
    }
  })();
  singleContentInflight.set(id, p);
  return p;
}

export function prefetchContent(id?: string | null) {
  if (!id) return;
  const cached = singleContentCache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return;
  if (findContentInListCache(id)) return;
  if (!isOnline()) return;
  void fetchSingleContent(id);
}

export function prefetchContentsByParent(parentId?: string | null) {
  if (!parentId || !isOnline()) return;
  const key = "contents-parent-" + parentId;
  const cached = listCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return;
  void (async () => {
    try {
      const rows = await withRetry(async () => {
        const { data, error } = await supabase
          .from("contents")
          .select("*")
          .eq("is_published", true)
          .eq("parent_id", parentId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as ContentRow[];
      });
      listCache.set(key, { data: rows, ts: Date.now() });
      const now = Date.now();
      for (const r of rows) singleContentCache.set(r.id, { data: r, ts: now });
    } catch {
      /* ignore */
    }
  })();
}

export const useContent = (id?: string) => {
  const seed = id ? (singleContentCache.get(id)?.data ?? findContentInListCache(id)) : null;
  const [data, setData] = useState<ContentRow | null>(seed ?? null);
  const [loading, setLoading] = useState(!seed && !!id);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    const initial = singleContentCache.get(id)?.data ?? findContentInListCache(id);
    if (initial) {
      setData(initial);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const loadOnline = async () => {
      const row = await fetchSingleContent(id);
      if (!cancelled) {
        setData(row);
        setLoading(false);
      }
    };

    const loadOffline = async () => {
      const all = await idbGetAll<ContentRow>("contents");
      const found = all.find((c) => c.id === id) ?? null;
      if (found) singleContentCache.set(id, { data: found, ts: Date.now() });
      if (!cancelled) {
        setData(found);
        setLoading(false);
      }
    };

    if (isOnline()) loadOnline();
    else if (!initial) loadOffline();

    const onOnline = () => loadOnline();
    window.addEventListener("online", onOnline);

    const channelName = "content-live-" + id + "-" + Date.now();
    const ch = isOnline()
      ? supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "contents", filter: "id=eq." + id },
            loadOnline,
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      if (ch) supabase.removeChannel(ch);
    };
  }, [id]);

  return { data, loading };
};

export const useGallery = () =>
  useReconciledList<GalleryRow>({
    storeName: "gallery",
    channelKey: "gallery-live",
    table: "gallery_items",
    fetchOnline: async () => {
      const { data } = await supabase.from("gallery_items").select("*").eq("is_published", true).order("order_index");
      return (data ?? []) as GalleryRow[];
    },
    sort: (a, b) => a.order_index - b.order_index,
  });

export const useQuizQuestions = (moduleSlug?: string) =>
  useReconciledList<QuizRow>({
    storeName: "quiz",
    channelKey: "quiz-live-" + (moduleSlug ?? "all"),
    table: "quiz_questions",
    fetchOnline: async () => {
      let q = supabase.from("quiz_questions").select("*").eq("is_published", true);
      if (moduleSlug) q = q.eq("module_slug", moduleSlug);
      const { data } = await q.order("order_index");
      return (data ?? []) as QuizRow[];
    },
    filterOffline: (rows) => (moduleSlug ? rows.filter((r) => r.module_slug === moduleSlug) : rows),
    sort: (a, b) => a.order_index - b.order_index,
    deps: [moduleSlug],
  });

export function useOfflineMediaUrl(remoteUrl?: string | null): {
  url: string | null;
  isOffline: boolean;
} {
  const [resolved, setResolved] = useState<{ url: string | null; isOffline: boolean }>({
    url: remoteUrl ?? null,
    isOffline: false,
  });

  useEffect(() => {
    let cancelled = false;
    let createdBlobUrl: string | null = null;

    if (!remoteUrl) {
      setResolved({ url: null, isOffline: false });
      return;
    }
    setResolved({ url: remoteUrl, isOffline: false });

    (async () => {
      const r = await resolveMedia(remoteUrl);
      if (cancelled) return;
      if (r.offline && r.url) {
        createdBlobUrl = r.url;
        setResolved({ url: r.url, isOffline: true });
      }
    })();

    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [remoteUrl]);

  return resolved;
}
