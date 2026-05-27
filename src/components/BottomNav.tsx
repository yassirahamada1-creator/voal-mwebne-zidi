import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, Download, Settings, Heart } from "lucide-react";
import { BilingualText } from "@/lib/bilingual";
import { useI18n } from "@/contexts/I18nContext";

// Préchargement par intention : seulement le chunk JS de la cible (les données
// sont gérées par le sync hors ligne global, plus besoin de prefetch séparé).
const buildItems = (tFr: any, tShi: any) => [
  { to: "/home",        icon: Home,      fr: tFr.nav.home,        shi: tShi.nav.home,        prefetch: () => import("@/pages/HomeScreen") },
  { to: "/pedagogical", icon: BookOpen,  fr: tFr.nav.learn,       shi: tShi.nav.learn,       prefetch: () => import("@/pages/PedagogicalScreen") },
  { to: "/favorites",   icon: Heart,     fr: tFr.nav.favorites,   shi: tShi.nav.favorites,   prefetch: () => import("@/pages/FavoritesScreen") },
  { to: "/downloads",   icon: Download,  fr: tFr.nav.downloads,   shi: tShi.nav.downloads,   prefetch: () => import("@/pages/DownloadsScreen") },
  { to: "/settings",    icon: Settings,  fr: tFr.nav.settings,    shi: tShi.nav.settings,    prefetch: () => import("@/pages/SettingsScreen") },
];

const BottomNav = () => {
  const location = useLocation();
  const { tFr, tShi } = useI18n();
  const items = useMemo(() => buildItems(tFr, tShi), [tFr, tShi]);
  const handlePrefetch = useCallback((p: () => Promise<unknown>) => {
    p().catch(() => {});
  }, []);

  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const accum = useRef(0);
  const ticking = useRef(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Respecte prefers-reduced-motion : on n'anime pas le masquage.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    lastY.current = window.scrollY || 0;

    const SHOW_THRESHOLD = 8;   // px cumulés vers le haut pour réafficher
    const HIDE_THRESHOLD = 16;  // px cumulés vers le bas pour masquer
    const TOP_OFFSET = 80;      // ne pas masquer trop près du haut

    const update = () => {
      ticking.current = false;
      const y = window.scrollY || 0;
      const delta = y - lastY.current;
      lastY.current = y;

      // Réinitialise l'accumulateur si on change de direction
      if ((delta > 0 && accum.current < 0) || (delta < 0 && accum.current > 0)) {
        accum.current = 0;
      }
      accum.current += delta;

      if (accum.current > HIDE_THRESHOLD && y > TOP_OFFSET) {
        setHidden(true);
        accum.current = 0;
      } else if (accum.current < -SHOW_THRESHOLD || y <= TOP_OFFSET) {
        setHidden(false);
        accum.current = 0;
      }
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafId.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    setHidden(false);
    accum.current = 0;
    lastY.current = window.scrollY || 0;
  }, [location.pathname]);

  if (location.pathname === "/" || location.pathname.startsWith("/splash")) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className={`fixed bottom-0 left-1/2 w-full max-w-md z-50 bg-background border-t border-border transition-transform duration-300 ease-out motion-reduce:transition-none`}
      style={{
        transform: `translate3d(-50%, ${hidden ? "100%" : "0"}, 0)`,
        willChange: "transform",
        backfaceVisibility: "hidden",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div className="flex items-center justify-around gap-0.5 px-1.5 py-1">
        {items.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={`${item.fr} · ${item.shi}`}
              onMouseEnter={() => handlePrefetch(item.prefetch)}
              onFocus={() => handlePrefetch(item.prefetch)}
              onTouchStart={() => handlePrefetch(item.prefetch)}
              className="group relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span
                className={`flex h-7 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-secondary text-secondary-foreground px-2.5"
                    : "text-muted-foreground group-hover:text-foreground px-1"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] transition-all ${isActive ? "stroke-[2.4]" : "stroke-2"}`} />
              </span>
              <span className="flex flex-col items-center leading-none">
                <span
                  className={`text-[9.5px] leading-none transition-colors ${
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.fr}
                </span>
                <span
                  className={`mt-0.5 text-[8.5px] leading-none transition-colors ${
                    isActive ? "text-foreground/70" : "text-muted-foreground/70"
                  }`}
                >
                  {item.shi}
                </span>
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default memo(BottomNav);
