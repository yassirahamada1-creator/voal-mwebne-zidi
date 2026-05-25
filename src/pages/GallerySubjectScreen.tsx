/**
 * GallerySubjectScreen — grille des photos d'un sujet de la Galerie.
 * Cliquer agrandit en plein écran (lightbox YARL), comme PhotoStrip.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Images } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";

import ScreenHeader from "@/components/ScreenHeader";
import OfflineImage from "@/components/OfflineImage";
import { useContents } from "@/hooks/useBackendData";
import { biStr } from "@/lib/bilingual";
import { resolveMedia } from "@/lib/offlineStore";

const GallerySubjectScreen = () => {
  const { subjectId } = useParams();
  const { data: contents, loading } = useContents("galerie");
  const [openIndex, setOpenIndex] = useState(-1);
  const [resolvedSrcs, setResolvedSrcs] = useState<Record<string, string>>({});

  const subject = useMemo(
    () => contents.find((c) => c.id === subjectId && c.type === "gallery_subject"),
    [contents, subjectId],
  );

  const photos = useMemo(
    () =>
      contents.filter(
        (c) => c.type === "image" && c.parent_id === subjectId && c.media_url,
      ),
    [contents, subjectId],
  );

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const entries: [string, string][] = [];
      for (const p of photos) {
        if (!p.media_url) continue;
        const r = await resolveMedia(p.media_url);
        if (cancelled) break;
        if (r.url) {
          entries.push([p.media_url, r.url]);
          if (r.offline) created.push(r.url);
        }
      }
      if (!cancelled) setResolvedSrcs(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  const slides = photos.map((p) => {
    const fr = p.title_fr?.trim();
    const shi = p.title_shk?.trim();
    const caption = [fr, shi].filter(Boolean).join(" / ");
    const src = (p.media_url && resolvedSrcs[p.media_url]) || p.media_url || "";
    return {
      src,
      alt: caption || "",
      title: caption || undefined,
      download: { url: p.media_url!, filename: `${p.id}.jpg` },
    };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <ScreenHeader
        icon={Images}
        labelFr="Galerie"
        labelShi="Galeri"
        titleFr={subject?.title_fr}
        titleShi={subject?.title_shk}
      />

      <div className="px-4 mt-2">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {biStr("Aucune photo dans ce sujet.", "Hakuna picha katika mada hii.")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p, i) => {
              const fr = p.title_fr?.trim();
              const shi = p.title_shk?.trim();
              const hasTitle = !!(fr || shi);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  aria-label={biStr(
                    fr ? `Ouvrir « ${fr} »` : `Ouvrir photo ${i + 1} sur ${photos.length}`,
                    shi ? `Fungua « ${shi} »` : `Fungua picha ${i + 1} kati ya ${photos.length}`,
                  )}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-secondary/30 bg-muted shadow-md ring-1 ring-secondary/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <OfflineImage
                    src={p.thumbnail_url || p.media_url || ""}
                    alt={biStr(fr, shi)}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Voile dégradé pour la lisibilité du titre */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                  />
                  {hasTitle && (
                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                      {fr && (
                        <p className="font-display text-sm font-semibold leading-tight text-white drop-shadow-md line-clamp-2">
                          {fr}
                        </p>
                      )}
                      {shi && (
                        <p className="mt-0.5 text-xs leading-snug text-white/85 drop-shadow line-clamp-1">
                          {shi}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Lightbox
        open={openIndex >= 0}
        index={Math.max(0, openIndex)}
        close={() => setOpenIndex(-1)}
        slides={slides}
        plugins={[Counter, Zoom, Captions, Thumbnails, Fullscreen]}
        toolbar={{
          buttons: ["close"],
        }}
        counter={{ container: { style: { top: "unset", bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" } } }}
        zoom={{ maxZoomPixelRatio: 5, scrollToZoom: true }}
        captions={{ descriptionTextAlign: "center", showToggle: true }}
        thumbnails={{
          position: "bottom",
          width: 96,
          height: 64,
          gap: 8,
          border: 1,
          borderRadius: 8,
          padding: 4,
          imageFit: "cover",
        }}
        carousel={{ finite: true, preload: 2 }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.92)" },
          icon: { color: "hsl(40 80% 65%)" },
          thumbnailsContainer: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          thumbnail: { backgroundColor: "transparent", borderColor: "hsl(40 80% 65% / 0.4)" },
        }}
        animation={{ fade: 250, swipe: 300 }}
      />
    </div>
  );
};

export default GallerySubjectScreen;
