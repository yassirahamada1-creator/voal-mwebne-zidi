import { useEffect } from "react";
import { setStatusBarStyle, type StatusBarMode } from "@/lib/statusBar";

/**
 * Hook réutilisable : applique un style de status bar pendant que
 * le composant est monté, puis revient à `auto` au démontage.
 *
 * Utilisation :
 *   useStatusBar("light");                 // fond sombre, icônes blanches
 *   useStatusBar("dark");                  // fond clair, icônes noires
 *   useStatusBar("light", "#000000");      // fond noir explicite
 *   useStatusBar(fullscreen ? "hidden" : "light", "#000000");
 *
 * Les erreurs liées à l'absence du plugin Capacitor sont gérées
 * silencieusement (web ou environnement non natif).
 */
export const useStatusBar = (
  mode: StatusBarMode,
  backgroundColor?: string,
) => {
  useEffect(() => {
    setStatusBarStyle(mode, backgroundColor);
    return () => setStatusBarStyle("auto");
  }, [mode, backgroundColor]);
};

export default useStatusBar;
