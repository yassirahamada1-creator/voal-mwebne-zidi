/**
 * SwipeBackGesture — navigation retour par geste swipe (style iOS).
 *
 * - Détecte un swipe horizontal initié près du bord gauche (≤ 28px) et
 *   d'amplitude ≥ 80px (et ≥ 1.6× le déplacement vertical).
 * - Fonctionne aussi à la souris (pointer events) pour le desktop.
 * - Fournit un retour visuel : un voile latéral qui suit le doigt.
 * - Désactivé sur les routes racines (splash / home) ou quand l'historique
 *   est vide.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

// Sur plateforme native (iOS / Android via Capacitor), on laisse l'OS gérer
// le geste swipe-back natif depuis les bords (iOS WKWebView +
// allowsBackForwardNavigationGestures, Android navigation par gestes /
// bouton hardware géré par NativeBackHandler).
const IS_NATIVE = typeof window !== "undefined" && Capacitor?.isNativePlatform?.();

const EDGE_PX = 28;
const TRIGGER_PX = 80;
const MAX_PEEK_PX = 120;

const SwipeBackGesture = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const trackingRef = useRef<boolean>(false);
  const [dx, setDx] = useState<number>(0);

  const enabled =
    !IS_NATIVE &&
    pathname !== "/" &&
    !pathname.startsWith("/splash") &&
    pathname !== "/home" &&
    !pathname.startsWith("/dashboard");

  useEffect(() => {
    if (!enabled) return;

    const onStart = (clientX: number, clientY: number) => {
      if (clientX > EDGE_PX) return;
      startXRef.current = clientX;
      startYRef.current = clientY;
      trackingRef.current = true;
    };

    const onMove = (clientX: number, clientY: number, e?: Event) => {
      if (!trackingRef.current || startXRef.current == null || startYRef.current == null) return;
      const deltaX = clientX - startXRef.current;
      const deltaY = Math.abs(clientY - startYRef.current);
      if (deltaX <= 0) {
        setDx(0);
        return;
      }
      // Si scroll vertical dominant, on abandonne pour ne pas perturber.
      if (deltaY > deltaX && deltaY > 16) {
        trackingRef.current = false;
        startXRef.current = null;
        setDx(0);
        return;
      }
      e?.preventDefault?.();
      setDx(Math.min(deltaX, MAX_PEEK_PX));
    };

    const onEnd = () => {
      if (!trackingRef.current) return;
      const final = dxRef.current;
      trackingRef.current = false;
      startXRef.current = null;
      startYRef.current = null;
      setDx(0);
      if (final >= TRIGGER_PX) {
        navigate(-1);
      }
    };

    // Touch
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onStart(t.clientX, t.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onMove(t.clientX, t.clientY, e);
    };
    const handleTouchEnd = () => onEnd();

    // Pointer (souris/trackpad desktop)
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.buttons !== 1) return;
      onStart(e.clientX, e.clientY);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!trackingRef.current) return;
      onMove(e.clientX, e.clientY);
    };
    const handlePointerUp = () => onEnd();

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [enabled, navigate]);

  // Garde la dernière valeur de dx accessible dans onEnd sans recréer l'effet.
  const dxRef = useRef(0);
  useEffect(() => {
    dxRef.current = dx;
  }, [dx]);

  if (!enabled) return null;

  const progress = Math.min(dx / TRIGGER_PX, 1);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-0 z-[60] transition-[width,opacity] duration-75 ease-out"
      style={{
        width: dx,
        opacity: progress,
        background:
          "linear-gradient(to right, hsl(var(--secondary) / 0.35), hsl(var(--secondary) / 0))",
        boxShadow:
          progress >= 1 ? "inset -2px 0 0 0 hsl(var(--secondary))" : undefined,
      }}
    />
  );
};

export default SwipeBackGesture;
