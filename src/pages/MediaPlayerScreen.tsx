import { useI18n } from "@/contexts/I18nContext";
import { useNavigate, useParams } from "react-router-dom";
import ContentActions from "@/components/ContentActions";
import { Headphones, FileText, Image as ImageIcon, BookOpen, Mic, CloudDownload, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useContent, useContents } from "@/hooks/useBackendData";
import { bi, biStr, BilingualText } from "@/lib/bilingual";
import NativeVideo from "@/components/NativeVideo";
import { buildSimpleVtt, type VideoSubtitle } from "@/lib/vtt";
import HowlerAudioPlayer from "@/components/HowlerAudioPlayer";
import { useOfflineMediaUrl } from "@/hooks/useBackendData";
import OfflineLock from "@/components/OfflineLock";
import OfflineImage from "@/components/OfflineImage";
import PhotoStrip from "@/components/PhotoStrip";
import { getFallbackThumbnail } from "@/lib/contentThumbnails";

const RELATED_TYPES = [
  { type: "text",  key: "tabStory",     icon: BookOpen },
  { type: "audio", key: "tabTestimony", icon: Mic },
  { type: "image", key: "tabPhoto",     icon: ImageIcon },
] as const;

const MediaPlayerScreen = () => {
  const { t, tFr, tShi, lang } = useI18n();
  const navigate = useNavigate();
  const { mediaId } = useParams();
  const { data: content, loading } = useContent(mediaId);
  const moduleSlug = content?.module_slug ?? undefined;
  const { data: siblings } = useContents(moduleSlug);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const relatedByType = useMemo(() => {
    const map: Record<string, typeof siblings> = { text: [], audio: [], image: [] };
    for (const c of siblings) {
      if (c.id === mediaId) continue;
      if (map[c.type]) map[c.type].push(c);
    }
    return map;
  }, [siblings, mediaId]);

  const availableTabs = RELATED_TYPES;
  const firstWithItems = RELATED_TYPES.find((t) => (relatedByType[t.type]?.length ?? 0) > 0)?.type ?? RELATED_TYPES[0].type;
  const currentTab = activeTab ?? firstWithItems;
  const currentItems = currentTab ? relatedByType[currentTab] ?? [] : [];

  useEffect(() => {
    const urls = new Set<string>();
    for (const list of Object.values(relatedByType)) {
      for (const it of list ?? []) {
        if (it.thumbnail_url) urls.add(it.thumbnail_url);
      }
    }
    const imgs: HTMLImageElement[] = [];
    urls.forEach((u) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = u;
      imgs.push(img);
    });
    return () => {
      imgs.forEach((i) => (i.src = ""));
    };
  }, [relatedByType]);

  const titleStr = content ? biStr(content.title_fr, content.title_shk) : "";
  const description = content ? bi(content.description_fr, content.description_shk) : null;

  const youtubeId = useMemo(() => {
    if (!content?.media_url) return null;
    const m = content.media_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }, [content?.media_url]);

  const subtitles: VideoSubtitle[] = useMemo(() => {
    const list: VideoSubtitle[] = [];
    if (content?.description_fr) {
      list.push({
        src: buildSimpleVtt(content.description_fr),
        srclang: "fr",
        label: content?.title_fr || "Français",
        default: lang === "fr",
      });
    }
    if (content?.description_shk) {
      list.push({
        src: buildSimpleVtt(content.description_shk),
        srclang: "zdj",
        label: content?.title_shk || "Shikomori",
        default: lang !== "fr",
      });
    }
    return list;
  }, [content?.description_fr, content?.description_shk, lang]);

  const { url: playableUrl, isOffline } = useOfflineMediaUrl(content?.media_url ?? null);
  const { url: posterUrl } = useOfflineMediaUrl(content?.thumbnail_url ?? null);

  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const blockedOffline = !online && !isOffline && content?.type !== "text";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t.pages.media.notFound}
        </p>
        <p className="mt-3 text-xs text-muted-foreground/80">
          {t.pages.media.swipeBack}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background pb-20"
      style={{ paddingTop: "var(--status-bar-height, env(safe-area-inset-top, 24px))" }}
    >

      <div className="relative w-full bg-foreground/90">
        {blockedOffline ? (
          <div className="aspect-video w-full flex flex-col items-center justify-center gap-3 px-6 text-center bg-foreground/95 text-primary-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/90 shadow-lg">
              <WifiOff className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold">
              {t.pages.media.offlineTitle}
            </p>
            <p className="text-xs opacity-80 max-w-xs">
              {t.pages.media.offlineHint}
            </p>
          </div>
        ) : content.type === "video" && youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
            title={titleStr}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video bg-media-letterbox"
          />
        ) : content.type === "video" && playableUrl ? (
          <div className="mx-auto w-full max-w-[min(100%,calc(70vh*16/9))] bg-media-letterbox">
            <NativeVideo
              src={playableUrl}
              poster={posterUrl ?? undefined}
              ariaLabel={titleStr}
              className="w-full"
            />
          </div>
        ) : content.type === "image" && playableUrl ? (
          <img src={playableUrl} alt={titleStr} className="w-full max-h-[60vh] object-contain bg-media-letterbox" />
        ) : content.type === "audio" && playableUrl ? (
          <div className="relative h-32 sm:h-36 w-full overflow-hidden">
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-secondary/40" />
            <div className="relative h-full w-full flex items-center justify-center gap-3 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/95 shadow-lg ring-1 ring-secondary-foreground/10">
                <Headphones className="h-6 w-6 text-secondary-foreground" />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground/85">
                {t.pages.media.tabTestimony}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative h-32 sm:h-36 w-full overflow-hidden">
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-secondary/40" />
            <div className="relative h-full w-full flex items-center justify-center gap-3 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/95 shadow-lg ring-1 ring-secondary-foreground/10">
                {content.type === "text" ? (
                  <FileText className="h-6 w-6 text-secondary-foreground" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-secondary-foreground" />
                )}
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground/85">
                {content.type === "text"
                  ? t.pages.media.tabStory
                  : t.pages.media.tabPhoto}
              </span>
            </div>
          </div>
        )}
      </div>

      {!blockedOffline && content.type === "audio" && playableUrl && (
        <div className="px-4 pt-4">
          <HowlerAudioPlayer
            src={playableUrl}
            format={content.media_url?.match(/\.([a-z0-9]+)(?:\?|#|$)/i)?.[1]?.toLowerCase()}
            ariaLabel={titleStr}
          />
        </div>
      )}

      <div className="px-4 pt-4">
        {content.type === "text" || content.type === "image" ? (
          (() => {
            const hasFr = !!content.description_fr;
            const hasShk = !!content.description_shk;
            const bilingual = hasFr && hasShk;
            if (!hasFr && !hasShk) return null;
            if (!bilingual) {
              const single = hasFr ? content.description_fr! : content.description_shk!;
              return (
                <p
                  lang={hasShk ? "zdj" : "fr"}
                  className="mt-4 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap"
                >
                  {single}
                </p>
              );
            }
            return (
              <div className="mt-4 space-y-6">
                <section aria-label="Texte en français">
                  <header className="mb-2 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-5 w-7 items-center justify-center rounded-sm bg-primary text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm"
                    >
                      FR
                    </span>
                    <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                      {content.title_fr || (
                        <span className="italic text-muted-foreground/80">
                          {tFr.pages.media.titleUnavailable}
                        </span>
                      )}
                    </h2>
                    <span className="ml-2 h-px flex-1 bg-gradient-to-r from-gold/60 via-terracotta/40 to-transparent" />
                  </header>
                  {!content.title_fr && (
                    <p className="mb-2 text-xs text-muted-foreground/60 italic">
                      {tFr.pages.media.noTitleFr}
                    </p>
                  )}
                  <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {content.description_fr}
                  </p>
                </section>

                <div
                  aria-hidden="true"
                  className="relative my-2 flex items-center justify-center"
                >
                  <span className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                  <span className="absolute flex items-center gap-1.5 bg-background px-3">
                    <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
                    <span className="h-1 w-1 rounded-full bg-terracotta/70" />
                    <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
                  </span>
                </div>

                <section aria-label="Matini kwa Shikomori" lang="zdj">
                  <header className="mb-2 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-5 w-7 items-center justify-center rounded-sm bg-secondary text-[10px] font-bold uppercase tracking-wider text-secondary-foreground shadow-sm"
                    >
                      SHI
                    </span>
                    <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                      {content.title_shk || (
                        <span className="italic text-muted-foreground/80">
                          {tShi.pages.media.titleUnavailable}
                        </span>
                      )}
                    </h2>
                    <span className="ml-2 h-px flex-1 bg-gradient-to-r from-terracotta/60 via-gold/40 to-transparent" />
                  </header>
                  {!content.title_shk && (
                    <p className="mb-2 text-xs text-muted-foreground/60 italic">
                      {tFr.pages.media.noTitleShk}
                    </p>
                  )}
                  <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {content.description_shk}
                  </p>
                </section>
              </div>
            );
          })()
        ) : (
          description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          )
        )}

        <div className="mt-4">
          <ContentActions
            item={{
              id: content.id,
              type: content.type as any,
              titleFr: content.title_fr,
              titleShi: content.title_shk,
              source: "media",
              moduleSlug: content.module_slug ?? undefined,
              mediaUrl: content.media_url ?? undefined,
              thumbnailUrl: content.thumbnail_url ?? undefined,
            }}
            showDownload={!!content.media_url}
            compact={false}
            extraUrls={
              content.type === "video"
                ? Object.values(relatedByType).flat().flatMap((it) => [it.media_url, it.thumbnail_url])
                : []
            }
          />
        </div>

        {content.type === "video" && (
          <section className="mt-6" aria-labelledby="related-heading">
            <h2 id="related-heading" className="sr-only">
              {t.pages.media.relatedHeading}
            </h2>
            <div
              role="tablist"
              aria-label={t.pages.media.tabsAria}
              className="grid grid-cols-3 gap-2"
            >
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const active = currentTab === tab.type;
                const count = relatedByType[tab.type]?.length ?? 0;
                const empty = count === 0;
                return (
                  <button
                    key={tab.type}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`related-panel-${tab.type}`}
                    aria-disabled={empty}
                    id={`related-tab-${tab.type}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => { if (!empty) setActiveTab(tab.type); }}
                    className={`inline-flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      active
                        ? "bg-secondary text-secondary-foreground shadow-sm"
                        : empty
                        ? "bg-muted/40 text-muted-foreground/60 border border-border/60 cursor-not-allowed"
                        : "bg-card text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-0.5" aria-hidden="true" />
                    <span className="truncate max-w-full">{tFr.pages.media[tab.key]}</span>
                    <span className="opacity-70 truncate max-w-full">/ {tShi.pages.media[tab.key]}</span>
                  </button>
                );
              })}
            </div>

            <ul
              role="tabpanel"
              id={`related-panel-${currentTab}`}
              aria-labelledby={`related-tab-${currentTab}`}
              className="mt-3 space-y-2 list-none p-0"
            >
              {currentItems.length === 0 && (
                <li className="text-center text-sm text-muted-foreground py-6">
                  {t.pages.media.noRelated}
                </li>
              )}
              {currentItems.map((it) => {
                const titleStr = biStr(it.title_fr, it.title_shk);
                return (
                  <OfflineLock key={it.id} urls={[it.media_url, it.thumbnail_url]}>
                    <li className="card-cultural card-cultural-interactive flex items-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/media/${it.id}`)}
                        aria-label={titleStr}
                        className="flex flex-1 min-w-0 items-center gap-3 text-left active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg cursor-pointer"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                          {it.thumbnail_url || (it.type === "image" && it.media_url) ? (
                            <OfflineImage
                              src={it.thumbnail_url || (it.type === "image" ? it.media_url : undefined) as string}
                              alt=""
                              loading="eager"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={getFallbackThumbnail(it.type)}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <BilingualText
                            as="h4"
                            fr={it.title_fr}
                            shi={it.title_shk}
                            variant="label"
                            className="text-foreground"
                          />
                        </div>
                      </button>
                      <ContentActions
                        item={{
                          id: it.id,
                          type: it.type as any,
                          titleFr: it.title_fr,
                          titleShi: it.title_shk,
                          source: "category",
                          moduleSlug: it.module_slug ?? undefined,
                          mediaUrl: it.media_url ?? undefined,
                          thumbnailUrl: it.thumbnail_url ?? undefined,
                        }}
                        showDownload={!!it.media_url && it.type !== "image"}
                      />
                    </li>
                  </OfflineLock>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default MediaPlayerScreen;
