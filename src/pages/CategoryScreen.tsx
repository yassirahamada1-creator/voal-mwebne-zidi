import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import ContentActions from "@/components/ContentActions";
import { Search, Video, X } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { useContents, useModules } from "@/hooks/useBackendData";
import { BilingualText } from "@/lib/bilingual";
import { matchesAllTokens } from "@/lib/utils";
import SearchSuggestions from "@/components/SearchSuggestions";

import OfflineImage from "@/components/OfflineImage";
import PhotoStrip, { type PhotoStripItem } from "@/components/PhotoStrip";
import { useI18n } from "@/contexts/I18nContext";
import { getFallbackThumbnail } from "@/lib/contentThumbnails";

const BLOCKED_SLUGS = new Set(["grand-mariage"]);

const formatDuration = (s: number | null) => {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// ─── VideoCard isolée pour éviter les re-renders sur frappe dans la search ───
type Content = ReturnType<typeof useContents>["data"][number];

interface VideoCardProps {
  item: Content;
  index: number;
  categoryKey: string;
  extraUrls: (string | null | undefined)[];
  onNavigate: (id: string) => void;
}

const VideoCard = memo(({ item, index, categoryKey, extraUrls, onNavigate }: VideoCardProps) => (
  <div className="card-cultural card-cultural-interactive">
    <div className="flex w-full items-center gap-3 p-3">
      <button
        type="button"
        onClick={() => onNavigate(item.id)}
        className="flex flex-1 items-center gap-3 text-left min-w-0"
      >
        <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
          {item.thumbnail_url ? (
            <OfflineImage src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <img src={getFallbackThumbnail(item.type)} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <BilingualText
            as="h3"
            fr={item.title_fr}
            shi={item.title_shk}
            variant="label"
            className="text-foreground"
          />
          {item.duration ? (
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {formatDuration(item.duration)}
            </span>
          ) : null}
        </div>
      </button>
      <ContentActions
        item={{
          id: item.id,
          type: item.type as any,
          titleFr: item.title_fr,
          titleShi: item.title_shk,
          source: "category",
          moduleSlug: categoryKey,
          mediaUrl: item.media_url ?? undefined,
          thumbnailUrl: item.thumbnail_url ?? undefined,
        }}
        showDownload={false}
        extraUrls={extraUrls}
      />
    </div>
  </div>
));

// ─── Composant principal ──────────────────────────────────────────────────────
const CategoryScreen = () => {
  const { categoryKey } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);

  const { lang, t, tFr, tShi } = useI18n();

  const { data: modules } = useModules();
  const module = modules.find((m) => m.slug === categoryKey);

  const { data: contents, loading } = useContents(categoryKey);

  // Synchronise le theme-color natif avec le bg-background du thème actif
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;

    const isDark = document.documentElement.classList.contains("dark");
    const color = isDark ? "#0f1923" : "#faf8f4";
    const prev = meta.getAttribute("content") ?? color;

    meta.setAttribute("content", color);
    return () => {
      meta.setAttribute("content", prev);
    };
  }, []);

  // Redirige si module supprimé — avant tout rendu conditionnel mais après les hooks
  if (categoryKey && BLOCKED_SLUGS.has(categoryKey)) {
    return <Navigate to="/home" replace />;
  }

  const videos = useMemo(
    () =>
      contents.filter(
        (c) =>
          c.type === "video" &&
          matchesAllTokens(
            [c.title_fr, c.title_shk, c.description_fr, c.description_shk],
            query,
          ),
      ),
    [contents, query],
  );

  const relatedUrlsByVideoId = useMemo(() => {
    const nonVideos = contents.filter((c) => c.type !== "video");
    const moduleFallback: (string | null | undefined)[] = [];
    for (const c of nonVideos) moduleFallback.push(c.media_url, c.thumbnail_url);

    const map = new Map<string, (string | null | undefined)[]>();
    for (const v of contents) {
      if (v.type !== "video") continue;
      const children = nonVideos.filter((c) => c.parent_id === v.id);
      map.set(v.id, children.length > 0
        ? children.flatMap((c) => [c.media_url, c.thumbnail_url])
        : moduleFallback,
      );
    }
    return map;
  }, [contents]);

  // Stable pour éviter re-render de chaque VideoCard à la frappe
  const handleNavigate = useCallback(
    (id: string) => navigate(`/media/${id}`, { state: { fromPath: location.pathname } }),
    [navigate, location.pathname],
  );

  const suggestionItems = useMemo(
    () =>
      contents.map((c) => ({
        id: c.id,
        label: lang === "fr" ? c.title_fr : c.title_shk,
        sub: c.type,
        searchable: [c.title_fr, c.title_shk, c.description_fr, c.description_shk],
        onPick: () => {
          setShowSuggest(false);
          setQuery("");
          navigate(`/media/${c.id}`, { state: { fromPath: location.pathname } });
        },
      })),
    [contents, lang, navigate, location.pathname],
  );

  return (
    <main className="min-h-dvh bg-background pb-20">
      {/* Header sticky */}
      <div
        className="sticky top-0 z-30 bg-background"
        style={{ paddingTop: "var(--status-bar-height, env(safe-area-inset-top, 24px))" }}
      >
        <ScreenHeader
          icon={Video}
          labelFr={tFr.pages.category.galleryLabel}
          labelShi={tShi.pages.category.galleryLabel}
          titleFr={module?.name_fr}
          titleShi={module?.name_shk}
        />

        <div className="px-4 -mt-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder={t.pages.category.searchPlaceholder}
              className="w-full rounded-xl bg-card py-2.5 pl-10 pr-9 text-sm shadow-md border border-border focus:outline-none focus:ring-2 focus:ring-gold"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <SearchSuggestions
              query={query}
              open={showSuggest}
              emptyLabel={t.pages.category.suggestionsEmpty}
              items={suggestionItems}
            />
          </div>
        </div>
      </div>

      {/* Badge */}
      <div className="mt-4 flex flex-wrap gap-2 px-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground shadow-sm">
          <Video className="h-3.5 w-3.5" />
          {t.pages.category.videoBadge}
        </span>
      </div>

      {/* Liste */}
      <div className="mt-4 px-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card-cultural h-28 opacity-0" aria-hidden="true" />
          ))
        ) : videos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {t.pages.category.emptyVideos}
          </p>
        ) : (
          videos.map((item, i) => (
            <VideoCard
              key={item.id}
              item={item}
              index={i}
              categoryKey={categoryKey ?? ""}
              extraUrls={relatedUrlsByVideoId.get(item.id) ?? []}
              onNavigate={handleNavigate}
            />
          ))
        )}
      </div>
    </main>
  );
};

export default CategoryScreen;
