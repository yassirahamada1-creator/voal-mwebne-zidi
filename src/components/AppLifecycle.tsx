import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * Suspend la connexion Realtime Supabase quand l'app native passe en arrière-plan
 * pour économiser batterie & data, et la rétablit à la reprise.
 * Les channels déjà souscrits (traductions, contenus) se ré-abonnent automatiquement.
 *
 * Aucun effet sur le web — les onglets en arrière-plan n'ont pas de hook équivalent
 * fiable, le navigateur gère lui-même la suspension réseau.
 */
const AppLifecycle = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    let remove: (() => void) | null = null;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        if (cancelled) return;
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          try {
            if (isActive) {
              supabase.realtime.connect();
            } else {
              supabase.realtime.disconnect();
            }
          } catch {
            // ignore
          }
        });
        remove = () => {
          try {
            handle.remove();
          } catch {
            // ignore
          }
        };
      } catch {
        // @capacitor/app indisponible : on n'instrumente rien
      }
    })();

    return () => {
      cancelled = true;
      if (remove) remove();
    };
  }, []);

  return null;
};

export default AppLifecycle;
