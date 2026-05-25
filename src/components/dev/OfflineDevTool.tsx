/**
 * OfflineDevTool — panneau flottant (DEV uniquement) pour basculer
 * l'application en mode "hors-ligne simulé" sans toucher aux DevTools du
 * navigateur. Idéal pour valider rapidement les écrans offline-first.
 *
 * Mécanisme :
 *  - force `navigator.onLine` à `false`
 *  - dispatche les events `online` / `offline` pour réveiller les hooks
 *    (`useOfflineSync`, etc.)
 *  - intercepte `window.fetch` et `XMLHttpRequest` pour simuler une coupure
 *    réseau réaliste (TypeError "Failed to fetch" comme un vrai offline)
 *  - persiste l'état dans `sessionStorage` pour survivre au HMR
 */
import { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, X, Bug } from "lucide-react";

const STORAGE_KEY = "vdl:dev:offline";

type Mode = "online" | "offline";

let originalOnLineDescriptor: PropertyDescriptor | undefined;
let originalFetch: typeof window.fetch | null = null;
let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
let installed = false;

function installOfflineSimulation() {
  if (installed) return;
  installed = true;

  // Override navigator.onLine
  originalOnLineDescriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(navigator),
    "onLine",
  );
  try {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
  } catch {
    /* certains navigateurs refusent — on continue */
  }

  // Intercept fetch
  originalFetch = window.fetch.bind(window);
  window.fetch = ((..._args: Parameters<typeof fetch>) => {
    return Promise.reject(
      new TypeError("Failed to fetch (simulated offline by OfflineDevTool)"),
    );
  }) as typeof window.fetch;

  // Intercept XHR
  originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args: any[]) {
    // @ts-ignore préserver la signature
    originalXhrOpen!.apply(this, args);
    this.addEventListener("loadstart", () => {
      try {
        this.abort();
      } catch {
        /* noop */
      }
    });
  } as typeof XMLHttpRequest.prototype.open;

  window.dispatchEvent(new Event("offline"));
}

function uninstallOfflineSimulation() {
  if (!installed) return;
  installed = false;

  // L'override a été posé en propriété d'instance ; il faut la supprimer
  // pour que l'accès retombe sur le getter natif du prototype.
  try {
    delete (navigator as any).onLine;
  } catch {
    /* noop */
  }
  originalOnLineDescriptor = undefined;

  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  if (originalXhrOpen) {
    XMLHttpRequest.prototype.open = originalXhrOpen;
    originalXhrOpen = null;
  }

  window.dispatchEvent(new Event("online"));
}

const OfflineDevTool = () => {
  // Toujours démarrer "online" au chargement de la page : on ne veut pas
  // qu'un mode offline simulé persiste entre les rafraîchissements et
  // bloque l'application (fetch Supabase rejetés → "Contenu introuvable").
  const [mode, setMode] = useState<Mode>("online");
  const [open, setOpen] = useState(true);

  // Nettoyage défensif : si une ancienne version avait laissé une clé
  // de session active, on la purge au montage.
  useEffect(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    uninstallOfflineSimulation();
  }, []);

  useEffect(() => {
    if (mode === "offline") {
      installOfflineSimulation();
    } else {
      uninstallOfflineSimulation();
    }
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((m) => (m === "offline" ? "online" : "offline"));
  }, []);

  const offline = mode === "offline";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'outil dev offline"
        className="fixed bottom-24 right-3 z-[9999] inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/80 text-background shadow-lg backdrop-blur hover:bg-foreground opacity-0"
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-24 right-3 z-[9999] flex items-center gap-2 rounded-full px-2 py-1.5 shadow-xl backdrop-blur ring-1 ${
        offline
          ? "bg-destructive/95 text-destructive-foreground ring-destructive-foreground/20"
          : "bg-foreground/90 text-background ring-background/10"
      }`}
      role="region"
      aria-label="Outil dev — mode hors-ligne"
    >
      <button
        type="button"
        onClick={toggle}
        aria-pressed={offline}
        aria-label={offline ? "Repasser en ligne" : "Simuler le mode hors-ligne"}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide hover:bg-background/10"
      >
        {offline ? (
          <>
            <WifiOff className="h-3.5 w-3.5" /> Offline
          </>
        ) : (
          <>
            <Wifi className="h-3.5 w-3.5" /> Online
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Masquer l'outil dev"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-background/10"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default OfflineDevTool;
