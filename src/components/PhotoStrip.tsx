/**
 * PhotoStrip — strip horizontal de miniatures + lightbox YARL en plein écran.
 *
 * Règle métier : les photos n'apparaissent jamais seules dans le feed ; elles
 * sont toujours liées à une vidéo parente (parent_id) et affichées sous celle-ci.
 *
 * Design : palette terreuse/dorée (cohérente avec l'app), miniatures arrondies
 * avec ombre légère, totalement responsive, accessible au clavier.
 */
import { useEffect, useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
// ArrowLeft retiré : plus de bouton "Retour" manuel dans la lightbox.
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";
import OfflineImage from "@/components/OfflineImage";
import { biStr } from "@/lib/bilingual";
import { resolveMedia } from "@/lib/offlineStore";

export type PhotoStripItem = {
  id: string;
  url: string;
  thumbUrl?: string | null;
  titleFr?: string | null;
  titleShi?: string | null;
};

export type PhotoStripProps = {
  photos: PhotoStripItem[];
  className?: string;
};

const PhotoStrip = ({ photos, className = "" }: PhotoStripProps) => {
  const [openIndex, setOpenIndex] = useState<number>(-1);
  // Animation "swipe-back" simulée lors du clic sur le bouton retour.
  const [peek, setPeek] = useState<number>(0);
  const peekTimer = useRef<number | null>(null);
  // Map URL distante → URL résolue (blob: si en cache, sinon URL distante).
  const [resolvedSrcs, setResolvedSrcs] = useState<Record<string, string>>({});

  const animatedClose = () => {
    if (peekTimer.current) window.clearTimeout(peekTimer.current);
    // Reproduit le voile latéral du SwipeBackGesture (style iOS).
    setPeek(0);
    requestAnimationFrame(() => setPeek(140));
    peekTimer.current = window.setTimeout(() => {
      setOpenIndex(-1);
      setPeek(0);
    }, 220);
  };

  useEffect(() => () => {
    if (peekTimer.current) window.clearTimeout(peekTimer.current);
  }, []);

  // Pré-résout les URLs des photos via le cache offline pour que la lightbox
  // fonctionne aussi hors ligne (pas seulement les miniatures).
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const entries: [string, string][] = [];
      for (const p of photos) {
        if (!p.url) continue;
        const r = await resolveMedia(p.url);
        if (cancelled) break;
        if (r.url) {
          entries.push([p.url, r.url]);
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

  // Déduplication : on garde la première occurrence par id, sinon par URL.
  const seen = new Set<string>();
  const uniquePhotos = photos.filter((p) => {
    const key = p.id || p.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniquePhotos.length === 0) return null;

  const slides = uniquePhotos.map((p) => {
    const fr = p.titleFr?.trim();
    const shi = p.titleShi?.trim();
    const caption = [fr, shi].filter(Boolean).join(" / ");
    const src = resolvedSrcs[p.url] ?? p.url;
    return {
      src,
      alt: caption || "",
      title: caption || undefined,
      description: shi && fr ? shi : undefined,
      download: { url: p.url, filename: `${p.id}.jpg` },
    };
  });

  return (
    <>
      <div
        role="list"
        aria-label={biStr("Photos liées", "Picha zinazohusiana")}
        className={`flex gap-2 overflow-x-auto overflow-y-hidden pb-1 -mx-1 px-1 max-w-full snap-x scroll-smooth overscroll-x-contain touch-pan-x ${className}`}
        style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
      >
        {uniquePhotos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            onClick={() => setOpenIndex(i)}
            aria-label={biStr(
              `Ouvrir photo ${i + 1} sur ${uniquePhotos.length}`,
              `Fungua picha ${i + 1} kati ya ${uniquePhotos.length}`,
            )}
            className="relative flex-shrink-0 snap-start h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl border border-secondary/30 bg-muted shadow-md ring-1 ring-secondary/10 transition-transform duration-200 hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <OfflineImage
              src={p.thumbUrl || p.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {/* Indicateur "+N" sur la dernière vignette si beaucoup de photos */}
            {uniquePhotos.length > 4 && i === 3 && (
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-primary-foreground text-sm font-bold backdrop-blur-[1px]">
                +{uniquePhotos.length - 4}
              </span>
            )}
          </button>
        ))}
      </div>

      <Lightbox
        open={openIndex >= 0}
        index={Math.max(0, openIndex)}
        close={animatedClose}
        slides={slides}
        plugins={[Counter, Zoom, Captions, Thumbnails, Fullscreen]}
        toolbar={{
          buttons: ["close"],
        }}
        counter={{ container: { style: { top: "unset", bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" } } }}
        zoom={{
          maxZoomPixelRatio: 5,
          zoomInMultiplier: 2,
          scrollToZoom: true,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          doubleTapDelay: 250,
          doubleClickDelay: 250,
          doubleClickMaxStops: 3,
        }}
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
          button: { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" },
          thumbnailsContainer: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          thumbnail: { backgroundColor: "transparent", borderColor: "hsl(40 80% 65% / 0.4)" },
        }}
        animation={{ fade: 250, swipe: 300 }}
      />

      {/* Voile latéral simulant le swipe-back iOS lors du retour. */}
      {peek > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-y-0 left-0 z-[100] transition-[width,opacity] duration-200 ease-out"
          style={{
            width: peek,
            opacity: Math.min(peek / 80, 1),
            background:
              "linear-gradient(to right, hsl(var(--secondary) / 0.45), hsl(var(--secondary) / 0))",
          }}
        />
      )}
    </>
  );
};

export default PhotoStrip;
