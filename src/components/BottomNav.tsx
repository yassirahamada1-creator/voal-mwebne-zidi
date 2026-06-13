import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Chrome as Home, BookOpen, Settings, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";

const buildItems = (tFr: any, tShi: any) => [
  { to: "/home",        icon: Home,      fr: tFr.nav.home,        shi: tShi.nav.home,        prefetch: () => import("@/pages/HomeScreen") },
  { to: "/pedagogical", icon: BookOpen,  fr: tFr.nav.learn,       shi: tShi.nav.learn,       prefetch: () => import("@/pages/PedagogicalScreen") },
  { to: "/favorites",   icon: Heart,     fr: tFr.nav.favorites,   shi: tShi.nav.favorites,   prefetch: () => import("@/pages/FavoritesScreen") },
  { to: "/settings",    icon: Settings,  fr: tFr.nav.settings,    shi: tShi.nav.settings,    prefetch: () => import("@/pages/SettingsScreen") },
];

type Item = ReturnType<typeof buildItems>[0];

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };

const NavItem = memo(({ item }: { item: Item }) => {
  const handlePrefetch = useCallback(() => {
    item.prefetch().catch(() => {});
  }, [item]);

  return (
    <NavLink
      to={item.to}
      aria-label={`${item.fr} · ${item.shi}`}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="group relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
    >
      {({ isActive }) => (
        <>
          {/* Indicateur actif animé style WhatsApp : petite pillule au-dessus
              de l'icône qui glisse d'un onglet à l'autre via layoutId. */}
          {isActive && (
            <motion.span
              layoutId="tab-indicator"
              transition={SPRING}
              className="absolute top-0 h-[3px] w-7 rounded-full bg-secondary"
              aria-hidden="true"
            />
          )}
          <motion.span
            animate={{
              scale: isActive ? 1.15 : 1,
              opacity: isActive ? 1 : 0.5,
            }}
            transition={SPRING}
            className={`flex h-7 items-center justify-center rounded-full ${
              isActive
                ? "text-secondary"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
            style={{ willChange: "transform" }}
          >
            <item.icon
              className={`h-[18px] w-[18px] ${
                isActive ? "stroke-[2.4]" : "stroke-2"
              }`}
            />
          </motion.span>
          <span className="flex flex-col items-center leading-none">
            <span
              className={`text-[9.5px] leading-none ${
                isActive ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.fr}
            </span>
            <span
              className={`mt-0.5 text-[8.5px] leading-none ${
                isActive ? "text-foreground/70" : "text-muted-foreground/70"
              }`}
            >
              {item.shi}
            </span>
          </span>
        </>
      )}
    </NavLink>
  );
});
NavItem.displayName = "NavItem";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { tFr, tShi } = useI18n();
  const items = useMemo(() => buildItems(tFr, tShi), [tFr, tShi]);

  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const accum = useRef(0);
  const ticking = useRef(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    lastY.current = window.scrollY || 0;
    const SHOW_THRESHOLD = 8;
    const HIDE_THRESHOLD = 16;
    const TOP_OFFSET = 80;

    const update = () => {
      ticking.current = false;
      const y = window.scrollY || 0;
      const delta = y - lastY.current;
      lastY.current = y;

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
  }, [pathname]);

  // Cacher la bottom bar sur les sous-pages (détail), comme WhatsApp.
  const isTabRoute = useMemo(
    () => items.some((it) => pathname === it.to || pathname.startsWith(it.to + "/")),
    [items, pathname],
  );

  if (pathname === "/" || pathname.startsWith("/splash")) return null;
  if (!isTabRoute) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-1/2 w-full max-w-md h-16 z-50 border-t border-border"
      style={{
        transform: `translate3d(-50%, ${hidden ? "100%" : "0"}, 0)`,
        transition: "transform 220ms cubic-bezier(0.25,0.46,0.45,0.94)",
        willChange: "transform",
        backfaceVisibility: "hidden",
        background: "hsl(var(--background) / 0.78)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div className="flex items-center justify-around gap-0.5 px-1.5 py-1">
        {items.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
};

export default memo(BottomNav);
