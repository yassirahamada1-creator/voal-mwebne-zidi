// Provider global du mode hors ligne.
// Au montage : si en ligne, lance un sync complet (silencieux si une sync précédente existe déjà).
// Expose status / progress / lastSync / online + resync() manuel.
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  syncAll,
  getLastSync,
  clearAllOffline,
  type SyncResult,
} from "@/lib/offlineStore";
import { hydrateFromSnapshot } from "@/lib/contentSnapshot";

export type SyncStatus = "idle" | "syncing" | "ready" | "error";

interface OfflineSyncCtx {
  online: boolean;
  status: SyncStatus;
  progress: number;          // 0..1
  done: number;
  total: number;
  lastSync: number | null;
  lastResult: SyncResult | null;
  /** True tant qu'aucune sync n'a jamais été terminée. */
  firstRun: boolean;
  resync: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const Ctx = createContext<OfflineSyncCtx | null>(null);

export const OfflineSyncProvider = ({ children }: { children: ReactNode }) => {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const inflight = useRef<Promise<void> | null>(null);
  const everSynced = useRef<boolean>(false);

  // online/offline
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

  // Hydrate IndexedDB depuis le snapshot bundlé au premier lancement.
  // Permet de consulter textes, photos et audios IMMÉDIATEMENT après
  // installation, sans aucune connexion réseau. Puis restore lastSync.
  useEffect(() => {
    (async () => {
      await hydrateFromSnapshot();
      const v = await getLastSync();
      setLastSync(v);
      if (v !== null) everSynced.current = true;
    })();
  }, []);

  const run = useCallback(async () => {
    if (inflight.current) return inflight.current;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const wasFirstRun = !everSynced.current;
    setStatus("syncing");
    setProgress(0); setDone(0); setTotal(0);
    const p = (async () => {
      try {
        const r = await syncAll({
          onProgress: ({ done, total, pct }) => {
            setDone(done); setTotal(total); setProgress(pct);
          },
        });
        setStatus("ready");
        setLastSync(Date.now());
        setLastResult(r);
        setDone(r.done); setTotal(r.total); setProgress(1);
        everSynced.current = true;

        // Toast discret seulement pour les re-syncs en arrière-plan
        if (!wasFirstRun) {
          const nouveau = r.addedContents + r.addedGallery;
          if (nouveau > 0) {
            toast.success(
              `${nouveau} ${nouveau > 1 ? "nouveaux contenus" : "nouveau contenu"} • Maudhui mapya`,
            );
          }
          if (r.failed > 0) {
            toast.warning(
              `${r.failed} ${r.failed > 1 ? "fichiers non téléchargés" : "fichier non téléchargé"} • Faili hazikupakuliwa`,
            );
          }
        }
      } catch {
        setStatus("error");
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = p;
    return p;
  }, []);

  // Sync automatique :
  //  - au tout premier démarrage (jamais synchronisé) si en ligne,
  //  - à chaque reconnexion (online false → true),
  //  - et à CHAQUE lancement en arrière-plan (debouncé : on saute si une
  //    sync a réussi il y a moins de 30 s, pour éviter le double-fetch
  //    sur hot reload / navigation rapide). Cela garantit que tout
  //    contenu nouvellement publié est rapatrié et indexé localement
  //    sans attente perceptible — l'UI reste hydratée depuis l'IDB.
  const wasOnlineRef = useRef<boolean>(online);
  const firstMountRef = useRef<boolean>(true);
  useEffect(() => {
    const came = !wasOnlineRef.current && online;
    wasOnlineRef.current = online;
    if (came) { run(); return; }
    if (firstMountRef.current) {
      firstMountRef.current = false;
      if (!online) return;
      const delay = !everSynced.current ? 600 : 1200;
      setTimeout(() => {
        const recent = lastSync && Date.now() - lastSync < 30_000;
        if (!recent) run();
      }, delay);
    }
  }, [online, run, lastSync]);


  const resync = useCallback(async () => { await run(); }, [run]);
  const clearCache = useCallback(async () => {
    await clearAllOffline();
    setLastSync(null);
    setLastResult(null);
    everSynced.current = false;
    setStatus("idle"); setProgress(0); setDone(0); setTotal(0);
  }, []);

  const value: OfflineSyncCtx = {
    online,
    status,
    progress,
    done,
    total,
    lastSync,
    lastResult,
    firstRun: lastSync === null,
    resync,
    clearCache,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useOfflineSync = (): OfflineSyncCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOfflineSync must be used within OfflineSyncProvider");
  return c;
};
