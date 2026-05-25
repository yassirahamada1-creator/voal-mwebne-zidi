import { useEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

/**
 * Bandeau discret affiché en haut quand l'utilisateur est hors ligne.
 * Disparaît automatiquement à la reconnexion.
 */
const OfflineBanner = () => {
  const { lang } = useI18n();
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [show, setShow] = useState(!online);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const onUp = () => {
      setOnline(true);
      // Petit délai avant de masquer pour laisser le toast "rétablie" apparaître.
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setShow(false), 200);
    };
    const onDown = () => {
      setOnline(false);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      setShow(true);
    };
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        online
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/95 px-3.5 py-1.5 text-[11px] font-semibold text-destructive-foreground shadow-lg ring-1 ring-destructive-foreground/10 backdrop-blur-md">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive-foreground/60 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive-foreground" />
        </span>
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="leading-none">
          {lang === "fr"
            ? "Hors ligne — Contenu limité"
            : "Bila mtandao — Maudhui machache"}
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
