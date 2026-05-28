import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import ContentActions from "@/components/ContentActions";
import { Search, Video, X } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useMemo, useState } from "react";
import { useContents, useModules } from "@/hooks/useBackendData";
import { bi, biStr, BilingualText } from "@/lib/bilingual";
import { matchesAllTokens } from "@/lib/utils";
import SearchSuggestions from "@/components/SearchSuggestions";
import OfflineLock from "@/components/OfflineLock";
import OfflineImage from "@/components/OfflineImage";
import PhotoStrip, { type PhotoStripItem } from "@/components/PhotoStrip";
import { useI18n } from "@/contexts/I18nContext";
import { getFallbackThumbnail } from "@/lib/contentThumbnails";

const BLOCKED_SLUGS = new Set(["grand-mariage"]);

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

  const matchesQuery = (c: typeof contents[number]) =>
    matchesAllTokens(
      [c.title_fr, c.title_shk, c.description_fr, c.description_shk],
      query,
    );

  const videos = useMemo(
    () => contents.filter((c) => c.type === "video" && matchesQuery(c)),
    [contents, query]
  );


  // Pour chaque vidéo, on calcule les URLs des contenus liés (récit, témoignage,
  // photo) à empaqueter dans son téléchargement.
  // Lien prioritaire : parent_id === video.id. À défaut (aucun enfant déclaré),
  // on retombe sur tous les non-vidéos du même module.
  const relatedUrlsByVideoId = useMemo(() => {
    const nonVideos = contents.filter((c) => c.type !== "video");
    const moduleFallback: (string | null | undefined)[] = [];
    for (const c of nonVideos) {
      moduleFallback.push(c.media_url, c.thumbnail_url);
    }
    const map = new Map<string, (string | null | undefined)[]>();
    for (const v of contents) {
      if (v.type !== "video") continue;
      const children = nonVideos.filter((c) => c.parent_id === v.id);
      if (children.length > 0) {
        const urls: (string | null | undefined)[] = [];
        for (const c of children) urls.push(c.media_url, c.thumbnail_url);
        map.set(v.id, urls);
      } else {
        map.set(v.id, moduleFallback);
      }
    }
    return map;
  }, [contents]);

  // Photos liées à chaque vidéo (parent_id), pour le strip horizontal sous la vidéo.
  const photosByVideoId = useMemo(() => {
    const map = new Map<string, PhotoStripItem[]>();
    for (const c of contents) {
      if (c.type !== "image" || !c.parent_id || !c.media_url) continue;
      const arr = map.get(c.parent_id) ?? [];
      arr.push({
        id: c.id,
        url: c.media_url,
        thumbUrl: c.thumbnail_url,
        titleFr: c.title_fr,
        titleShi: c.title_shk,
      });
      map.set(c.parent_id, arr);
    }
    return map;
  }, [contents]);


  // Redirige si on tombe sur un module supprimé (après les hooks pour respecter rules-of-hooks)
  if (categoryKey && BLOCKED_SLUGS.has(categoryKey)) {
    return <Navigate to="/home" replace />;
  }

  const formatDuration = (s: number | null) => {
    if (!s) return "";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background" style={{ paddingTop: "var(--status-bar-height, env(safe-area-inset-top, 24px))" }}>
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
            items={contents.map((c) => ({
              id: c.id,
              label: lang === "fr" ? c.title_fr : c.title_shk,
              sub: c.type,
              searchable: [c.title_fr, c.title_shk, c.description_fr, c.description_shk],
              onPick: () => {
                setShowSuggest(false);
                setQuery("");
                navigate(`/media/${c.id}`, { state: { fromPath: location.pathname } });
              },
            }))}
          />
        </div>
      </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 px-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground shadow-sm">
          <Video className="h-3.5 w-3.5" />
          {t.pages.category.videoBadge}
        </span>
      </div>

      <div className="mt-4 px-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card-cultural h-28 animate-pulse" />
          ))
        ) : videos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {t.pages.category.emptyVideos}
          </p>
        ) : (
          videos.map((item, i) => (
            <OfflineLock
              key={item.id}
              urls={[item.media_url, item.thumbnail_url]}
            >
            <div
              className="card-cultural card-cultural-interactive animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex w-full items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => navigate(`/media/${item.id}`, { state: { fromPath: location.pathname } })}
                  className="flex flex-1 items-center gap-3 text-left active:scale-[0.98] transition-transform min-w-0"
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
                  showDownload={!!item.media_url}
                  extraUrls={relatedUrlsByVideoId.get(item.id) ?? []}
                />
              </div>
            </div>
            </OfflineLock>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryScreen;
