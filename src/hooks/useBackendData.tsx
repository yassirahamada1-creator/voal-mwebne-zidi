import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { idbGetAll, resolveMedia } from "@/lib/offlineStore";

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

const isOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

// ─── Module-level cache ───────────────────────────────────────────────────────
type CacheEntry<T> = { data: T[]; ts: number };
const listCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// ─────────────────────────────────────────────────────────────────────────────

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
  const { storeName, channelKey, table, filter, fetchOnline, filterOffline, sort } = opts;

  const cached = listCache.get(channelKey);
  const isFresh = !!cached && Date.now() - cached.ts < CACHE_TTL;

  const [data, setData] = useState<T[]>(isFresh ? cached!.data : []);
  const [loading, setLoading] = useState(!isFresh);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let fallbackTimer: number | null = null;
    let hasFreshData = false;

    const hydrateOffline = async () => {
      const all = await idbGetAll<T>(storeName);
      if (cancelled || hasFreshData) return;
      const filtered = filterOffline ? filterOffline(all) : all;
      setData([...filtered].sort(sort));
      setLoading(false);
    };

    const loadOnline = async () => {
      try {
        const rows = await fetchOnline();
        if (cancelled) return;
        hasFreshData = true;
        listCache.set(channelKey, { data: rows, ts: Date.now() });
        if (fallbackTimer) { window.clearTimeout(fallbackTimer); fallbackTimer = null; }
        setData(rows);
        setLoading(false);
      } catch {
        // réseau KO → laisser le repli IDB
      }
    };

    const subscribeRealtime = () => {
      if (channel) return;
      const params: any = { event: "*", schema: "public", table };
      if (filter) params.filter = filter;
      channel = supabase.channel(channelKey).on("postgres_changes", params, loadOnline).subscribe();
    };

    const teardownRealtime = () => {
      if (channel) { supabase.removeChannel(channel); channel = null; }
    };

    const onOnline = () => { loadOnline(); subscribeRealtime(); };
    const onOffline = () => {
      teardownRealtime();
      if (data.length === 0 && !hasFreshData) hydrateOffline();
    };

    if (isOnline()) {
      // Si cache frais, on refetch silencieusement sans passer loading=true
      if (!isFresh) setLoading(true);
      loadOnline();
      fallbackTimer = window.setTimeout(() => {
        if (!cancelled && !hasFreshData) hydrateOffline();
      }, 1200);
      subscribeRealtime();
    } else {
      hydrateOffline();
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      teardownRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, opts.deps ?? []);

  return { data, loading };
}

// ---------- Modules ----------
export const useModules = () =>
  useReconciledList<ModuleRow>({
    storeName: "modules",
    channelKey: "modules-live",
    table: "modules",
    fetchOnline: async () => {
      const { data } = await supabase
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      return (data ?? []) as ModuleRow[];
    },
    sort: (a, b) => a.order_index - b.order_index,
  });

// ---------- Contents ----------
export const useContents = (moduleSlug?: string) =>
  useReconciledList<ContentRow>({
    storeName: "contents",
    channelKey: `contents-live-${moduleSlug ?? "all"}`,
    table: "contents",
    fetchOnline: async () => {
      let q = supabase.from("contents").select("*").eq("is_published", true);
      if (moduleSlug) q = q.eq("module_slug", moduleSlug);
      const { data } = await q.order("created_at", { ascending: false });
      return (data ?? []) as ContentRow[];
    },
    filterOffline: (rows) =>
      moduleSlug ? rows.filter((c) => c.module_slug === moduleSlug) : rows,
    sort: (a, b) => (b.created_at || "").localeCompare(a.created_at || ""),
    deps: [moduleSlug],
  });

// ---------- Single content ----------
export const useContent = (id?: string) => {
  const [data, setData] = useState<ContentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;

    let networkResolved = false;
    const hydrateOffline = async () => {
      const all = await idbGetAll<ContentRow>("contents");
      const found = all.find((c) => c.id === id) ?? null;
      if (cancelled || networkResolved) return;
      if (found) setData(found);
      if (found || !isOnline()) setLoading(false);
    };
    const loadOnline = () => {
      supabase.from("contents").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (cancelled) return;
        networkResolved = true;
        setData(data as ContentRow | null);
        setLoading(false);
      });
    };
    hydrateOffline();
    if (isOnline()) loadOnline();
    const onOnline = () => loadOnline();
    window.addEventListener("online", onOnline);
    const ch = isOnline()
      ? supabase
          .channel(`content-live-${id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "contents", filter: `id=eq.${id}` }, loadOnline)
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

// ---------- Gallery ----------
export const useGallery = () =>
  useReconciledList<GalleryRow>({
    storeName: "gallery",
    channelKey: "gallery-live",
    table: "gallery_items",
    fetchOnline: async () => {
      const { data } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("is_published", true)
        .order("order_index");
      return (data ?? []) as GalleryRow[];
    },
    sort: (a, b) => a.order_index - b.order_index,
  });

// ---------- Quiz ----------
export const useQuizQuestions = (moduleSlug?: string) =>
  useReconciledList<QuizRow>({
    storeName: "quiz",
    channelKey: `quiz-live-${moduleSlug ?? "all"}`,
    table: "quiz_questions",
    fetchOnline: async () => {
      let q = supabase.from("quiz_questions").select("*").eq("is_published", true);
      if (moduleSlug) q = q.eq("module_slug", moduleSlug);
      const { data } = await q.order("order_index");
      return (data ?? []) as QuizRow[];
    },
    filterOffline: (rows) =>
      moduleSlug ? rows.filter((r) => r.module_slug === moduleSlug) : rows,
    sort: (a, b) => a.order_index - b.order_index,
    deps: [moduleSlug],
  });

// ---------- Media URL hook (cache-first) ----------
export function useOfflineMediaUrl(remoteUrl?: string | null): {
  url: string | null;
  isOffline: boolean;
} {
  const [resolved, setResolved] = useState<{ url: string | null; isOffline: boolean }>(
    { url: remoteUrl ?? null, isOffline: false },
  );

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
