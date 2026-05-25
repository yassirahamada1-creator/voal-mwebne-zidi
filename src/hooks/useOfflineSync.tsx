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
import { listJobs, QUEUE_CHANGED_EVENT } from "@/lib/downloadQueue";

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

  // restore lastSync
  useEffect(() => {
    getLastSync().then((v) => {
      setLastSync(v);
      if (v !== null) everSynced.current = true;
    });
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

  // Sync automatique : au tout premier démarrage (jamais synchronisé) si en ligne,
  // puis à chaque reconnexion (online false → true).
  const wasOnlineRef = useRef<boolean>(online);
  const firstMountRef = useRef<boolean>(true);
  useEffect(() => {
    const came = !wasOnlineRef.current && online;
    wasOnlineRef.current = online;
    if (came) { run(); return; }
    if (firstMountRef.current) {
      firstMountRef.current = false;
      // Démarrage initial : si jamais synchronisé et en ligne, on lance la synchro
      // complète (tout sauf les vidéos) pour rendre l'app utilisable hors ligne.
      if (online && !everSynced.current) {
        // petit délai pour laisser l'UI s'afficher d'abord
        setTimeout(() => { if (!everSynced.current) run(); }, 600);
      }
    }
  }, [online, run]);

  // Auto-sync à la fin d'un téléchargement : quand la file passe d'occupée
  // (au moins un job actif) à entièrement terminée, on relance une resync
  // (debouncée) pour rafraîchir le catalogue local.
  const queueBusyRef = useRef<boolean>(false);
  const autoSyncTimer = useRef<number | null>(null);
  useEffect(() => {
    const check = () => {
      const jobs = listJobs();
      const busy = jobs.some(
        (j) => j.status === "downloading" || j.status === "queued",
      );
      const hasDone = jobs.some((j) => j.status === "done");
      // Transition occupé → libre, et au moins un job terminé : on resync.
      if (queueBusyRef.current && !busy && hasDone) {
        if (autoSyncTimer.current) window.clearTimeout(autoSyncTimer.current);
        autoSyncTimer.current = window.setTimeout(() => {
          if (typeof navigator === "undefined" || navigator.onLine) {
            run();
          }
        }, 800);
      }
      queueBusyRef.current = busy;
    };
    check();
    window.addEventListener(QUEUE_CHANGED_EVENT, check);
    return () => {
      window.removeEventListener(QUEUE_CHANGED_EVENT, check);
      if (autoSyncTimer.current) window.clearTimeout(autoSyncTimer.current);
    };
  }, [run]);

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
