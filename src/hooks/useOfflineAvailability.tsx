// Provider qui maintient un index synchrone des URLs disponibles dans le cache hors-ligne.
// Se met à jour automatiquement à chaque mutation du cache (sync, download, remove, clear)
// via l'événement `vdl-cache-changed` émis par offlineStore.
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CACHE_CHANGED_EVENT, listCachedUrls } from "@/lib/offlineStore";

interface OfflineAvailabilityCtx {
  online: boolean;
  /** True si l'URL est en cache local. */
  isAvailable: (url?: string | null) => boolean;
  /** True si on est hors ligne ET l'URL n'est pas en cache. */
  isLocked: (url?: string | null) => boolean;
  /** Force un rafraîchissement de l'index (rare). */
  refresh: () => Promise<void>;
}

const Ctx = createContext<OfflineAvailabilityCtx | null>(null);

export const OfflineAvailabilityProvider = ({ children }: { children: ReactNode }) => {
  const [urls, setUrls] = useState<Set<string>>(new Set());
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const refresh = useCallback(async () => {
    const list = await listCachedUrls();
    setUrls(new Set(list));
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => { refresh(); };
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener(CACHE_CHANGED_EVENT, onChange);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);

    // Capacitor Network : navigator.onLine n'est pas fiable dans la WebView Android.
    let removeNetListener: (() => void) | undefined;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        setOnline(status.connected);
        const handle = await Network.addListener("networkStatusChange", (s) => {
          setOnline(s.connected);
        });
        removeNetListener = () => { handle.remove(); };
      } catch {
        /* plugin non disponible (web) */
      }
    })();

    return () => {
      window.removeEventListener(CACHE_CHANGED_EVENT, onChange);
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
      if (removeNetListener) removeNetListener();
    };
  }, [refresh]);

  const value = useMemo<OfflineAvailabilityCtx>(() => ({
    online,
    isAvailable: (url) => !!url && urls.has(url),
    isLocked: (url) => !online && !!url && !urls.has(url),
    refresh,
  }), [online, urls, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useOfflineAvailability = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOfflineAvailability must be used within OfflineAvailabilityProvider");
  return c;
};

/** Helper pratique pour un élément donné. `urls` peut contenir media+thumbnail. */
export function useOfflineLock(urls: (string | null | undefined)[]) {
  const { online, isAvailable } = useOfflineAvailability();
  const list = urls.filter(Boolean) as string[];
  // Si pas d'URL média : jamais verrouillé (texte par exemple).
  if (list.length === 0) return { locked: false, available: true, online };
  const allCached = list.every((u) => isAvailable(u));
  return { locked: !online && !allCached, available: allCached, online };
}
