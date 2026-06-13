import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import HomeScreen from "@/pages/HomeScreen";

const PedagogicalScreen = lazy(() => import("@/pages/PedagogicalScreen"));
const FavoritesScreen = lazy(() => import("@/pages/FavoritesScreen"));
const SettingsScreen = lazy(() => import("@/pages/SettingsScreen"));

export const TAB_PATHS = [
  "/home",
  "/pedagogical",
  "/favorites",
  "/settings",
] as const;

type TabPath = (typeof TAB_PATHS)[number];

const PageFallback = () => <div className="min-h-[40vh]" aria-hidden="true" />;

const PAGES: { path: TabPath; node: React.ReactNode }[] = [
  { path: "/home", node: <HomeScreen /> },
  { path: "/pedagogical", node: <Suspense fallback={<PageFallback />}><PedagogicalScreen /></Suspense> },
  { path: "/favorites", node: <Suspense fallback={<PageFallback />}><FavoritesScreen /></Suspense> },
  { path: "/settings", node: <Suspense fallback={<PageFallback />}><SettingsScreen /></Suspense> },
];

const HORIZONTAL_MIN = 50; // px minimum
const ANGLE_RATIO = 1.5;   // |dx|/|dy| pour considérer horizontal
const SWIPE_THRESHOLD = 60; // px requis pour valider un changement d'onglet

type Props = { activePath: TabPath };

const TabSwiper = ({ activePath }: Props) => {
  const navigate = useNavigate();
  const activeIndex = Math.max(0, TAB_PATHS.indexOf(activePath as TabPath));

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragDx, setDragDx] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Refs internes pour la détection bas-niveau
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const lockedRef = useRef<null | "h" | "v">(null); // axe verrouillé
  const trackingRef = useRef(false);
  const widthRef = useRef(0);

  useEffect(() => {
    const update = () => {
      widthRef.current = containerRef.current?.clientWidth ?? window.innerWidth;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      const next = activeIndex + dir;
      if (next < 0 || next >= TAB_PATHS.length) return;
      navigate(TAB_PATHS[next]);
    },
    [activeIndex, navigate],
  );

  const resetGesture = useCallback(() => {
    trackingRef.current = false;
    lockedRef.current = null;
    setIsSwiping(false);
    setDragDx(0);
  }, []);

  const finishGesture = useCallback(
    (dx: number, elapsed: number) => {
      const w = widthRef.current || 1;
      const absRatio = Math.abs(dx) / w;
      const velocity = Math.abs(dx) / Math.max(1, elapsed); // px/ms
      if (
        Math.abs(dx) > SWIPE_THRESHOLD &&
        (absRatio > 0.15 || velocity > 0.4)
      ) {
        if (dx < 0) goTo(1);
        else goTo(-1);
      }
      resetGesture();
    },
    [goTo, resetGesture],
  );

  // ── Touch events (mobile) ──────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startXRef.current = t.clientX;
      startYRef.current = t.clientY;
      startTimeRef.current = Date.now();
      trackingRef.current = true;
      lockedRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!trackingRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startXRef.current;
      const dy = t.clientY - startYRef.current;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (lockedRef.current === null) {
        // En-dessous des seuils → on ne décide pas encore
        if (adx < 10 && ady < 10) return;
        const ratio = ady === 0 ? Infinity : adx / ady;
        if (adx > HORIZONTAL_MIN && ratio > ANGLE_RATIO) {
          lockedRef.current = "h";
          setIsSwiping(true);
        } else if (ady > adx) {
          // Scroll vertical → on lâche complètement
          lockedRef.current = "v";
          trackingRef.current = false;
          return;
        } else {
          // diagonal / pas assez clair → laisser scroller, ne pas bloquer
          return;
        }
      }

      if (lockedRef.current === "h") {
        // Bloquer le scroll natif uniquement quand horizontal confirmé
        if (e.cancelable) e.preventDefault();
        let nextDx = dx;
        if (
          (activeIndex === 0 && nextDx > 0) ||
          (activeIndex === TAB_PATHS.length - 1 && nextDx < 0)
        ) {
          nextDx = nextDx * 0.25;
        }
        setDragDx(nextDx);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!trackingRef.current && lockedRef.current !== "h") {
        resetGesture();
        return;
      }
      if (lockedRef.current === "h") {
        const t = e.changedTouches[0];
        const dx = t.clientX - startXRef.current;
        finishGesture(dx, Date.now() - startTimeRef.current);
      } else {
        resetGesture();
      }
    };

    const onTouchCancel = () => resetGesture();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [activeIndex, finishGesture, resetGesture]);

  // ── Mouse events (desktop) ─────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      // Ignore clics droits / molette
      if (e.button !== 0) return;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startTimeRef.current = Date.now();
      trackingRef.current = true;
      lockedRef.current = null;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!trackingRef.current) return;
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (lockedRef.current === null) {
        if (adx < 10 && ady < 10) return;
        const ratio = ady === 0 ? Infinity : adx / ady;
        if (adx > HORIZONTAL_MIN && ratio > ANGLE_RATIO) {
          lockedRef.current = "h";
          setIsSwiping(true);
        } else if (ady > adx) {
          lockedRef.current = "v";
          trackingRef.current = false;
          return;
        } else {
          return;
        }
      }

      if (lockedRef.current === "h") {
        let nextDx = dx;
        if (
          (activeIndex === 0 && nextDx > 0) ||
          (activeIndex === TAB_PATHS.length - 1 && nextDx < 0)
        ) {
          nextDx = nextDx * 0.25;
        }
        setDragDx(nextDx);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (lockedRef.current === "h") {
        const dx = e.clientX - startXRef.current;
        finishGesture(dx, Date.now() - startTimeRef.current);
      } else {
        resetGesture();
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [activeIndex, finishGesture, resetGesture]);

  const baseTranslatePct = -(activeIndex * (100 / PAGES.length));
  const w = widthRef.current || 1;
  const dragPct = (dragDx / (w * PAGES.length)) * 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1 overflow-hidden"
      style={{ touchAction: "pan-y" }}
    >
      <div
        style={{
          display: "flex",
          width: `${PAGES.length * 100}%`,
          height: "100%",
          transform: `translate3d(calc(${baseTranslatePct}% + ${dragPct}%), 0, 0)`,
          transition: isSwiping ? "none" : "transform 0.3s ease",
          willChange: "transform",
        }}
      >
        {PAGES.map((p) => (
          <div
            key={p.path}
            className="overflow-y-auto overscroll-contain pb-16"
            style={{ width: `${100 / PAGES.length}%`, height: "100%" }}
          >
            {p.node}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TabSwiper);
