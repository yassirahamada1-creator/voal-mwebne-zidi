import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setNavDirection } from "@/lib/navDirection";

// Ordre des onglets identique à la BottomNav, avec leur loader dynamique
// pour permettre un préchargement ciblé des voisins.
const TAB_LOADERS: Record<string, () => Promise<unknown>> = {
  "/home": () => import("@/pages/HomeScreen"),
  "/pedagogical": () => import("@/pages/PedagogicalScreen"),
  "/favorites": () => import("@/pages/FavoritesScreen"),
  "/settings": () => import("@/pages/SettingsScreen"),
};
const TABS = Object.keys(TAB_LOADERS);

// Onglets déjà préchargés pendant la session — évite les imports répétés.
const preloaded = new Set<string>();
const preloadTab = (path: string) => {
  if (preloaded.has(path)) return;
  const loader = TAB_LOADERS[path];
  if (!loader) return;
  preloaded.add(path);
  loader().catch(() => preloaded.delete(path));
};

const SWIPE_THRESHOLD = 60; // px minimum horizontal
const VERTICAL_TOLERANCE = 60; // px max vertical pour considérer un swipe horizontal
const EDGE_IGNORE = 20; // ignorer les swipes depuis le bord (back gesture iOS/Android)
const MAX_DURATION = 600; // ms

/**
 * Permet de naviguer entre les onglets principaux (Accueil → Apprendre →
 * Favoris → Téléchargements → Paramètres) par un swipe horizontal,
 * façon WhatsApp. Actif uniquement sur les routes des onglets.
 */
const SwipeNavigator = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const startX = useRef(0);
  const startY = useRef(0);
  const startT = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    const idx = TABS.indexOf(pathname);
    if (idx === -1) return;

    // Préchargement agressif mais respectueux : on charge les onglets dans
    // un rayon de ±2 autour de l'onglet courant, en cascade (le plus proche
    // d'abord) pour garantir un swipe instantané même en offline.
    //
    // Garde-fous pour limiter l'impact CPU / RAM :
    //  - requestIdleCallback : ne s'exécute que quand le thread principal
    //    est libre (jamais pendant un scroll ou une animation).
    //  - Throttling séquentiel : un seul import à la fois, espacé, pour
    //    éviter un pic de parse JS qui ferait jankter l'UI.
    //  - Respect de Save-Data et connexions lentes (2g/slow-2g) : on se
    //    limite alors aux voisins immédiats (±1) pour économiser data/RAM.
    //  - Pas de rechargement si l'onglet est déjà préchargé (Set global).
    const nav: any = typeof navigator !== "undefined" ? (navigator as any) : null;
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    const saveData = !!conn?.saveData;
    const slow = conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    const radius = saveData || slow ? 1 : 2;

    // Construit la liste ordonnée par proximité : [idx-1, idx+1, idx-2, idx+2]
    const queue: string[] = [];
    for (let d = 1; d <= radius; d++) {
      if (idx - d >= 0) queue.push(TABS[idx - d]);
      if (idx + d < TABS.length) queue.push(TABS[idx + d]);
    }

    let cancelled = false;
    const ric: any = (window as any).requestIdleCallback;
    const cic: any = (window as any).cancelIdleCallback;
    const handles: any[] = [];

    const schedule = (cb: () => void, delay = 0) => {
      if (typeof ric === "function") {
        const h = ric(() => { if (!cancelled) cb(); }, { timeout: 2000 });
        handles.push(["ric", h]);
      } else {
        const h = window.setTimeout(() => { if (!cancelled) cb(); }, 200 + delay);
        handles.push(["to", h]);
      }
    };

    // Charge en cascade : on n'enchaîne sur le suivant qu'une fois le
    // précédent résolu, pour étaler le coût parse/compile JS dans le temps.
    const runNext = (i: number) => {
      if (cancelled || i >= queue.length) return;
      schedule(() => {
        const path = queue[i];
        const loader = TAB_LOADERS[path];
        if (!loader) return runNext(i + 1);
        if (preloaded.has(path)) return runNext(i + 1);
        preloaded.add(path);
        loader()
          .catch(() => preloaded.delete(path))
          .finally(() => runNext(i + 1));
      });
    };
    runNext(0);

    return () => {
      cancelled = true;
      for (const [kind, h] of handles) {
        if (kind === "ric" && typeof cic === "function") cic(h);
        else if (kind === "to") clearTimeout(h);
      }
    };
  }, [pathname]);

  useEffect(() => {
    const idx = TABS.indexOf(pathname);
    if (idx === -1) return; // pas un onglet principal

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        active.current = false;
        return;
      }
      const t = e.touches[0];
      // Ignorer le swipe depuis les bords (réservé au geste back système)
      if (t.clientX < EDGE_IGNORE || t.clientX > window.innerWidth - EDGE_IGNORE) {
        active.current = false;
        return;
      }
      // Ne pas intercepter si on touche un élément qui scroll horizontalement
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-no-swipe-nav], input, textarea, [contenteditable='true'], video, .embla, [data-radix-scroll-area-viewport]")) {
        active.current = false;
        return;
      }
      startX.current = t.clientX;
      startY.current = t.clientY;
      startT.current = Date.now();
      active.current = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active.current) return;
      active.current = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dt = Date.now() - startT.current;
      if (dt > MAX_DURATION) return;
      if (Math.abs(dy) > VERTICAL_TOLERANCE) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

      const current = TABS.indexOf(pathname);
      if (current === -1) return;
      if (dx < 0 && current < TABS.length - 1) {
        const next = TABS[current + 1];
        setNavDirection("forward", next);
        navigate(next);
      } else if (dx > 0 && current > 0) {
        const next = TABS[current - 1];
        setNavDirection("backward", next);
        navigate(next);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pathname, navigate]);

  return null;
};

export default SwipeNavigator;
