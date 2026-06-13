import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { setStatusBarStyle } from "@/lib/statusBar";
import {
  STATUS_BAR_DEFAULT,
  STATUS_BAR_ROUTES,
} from "@/config/statusBar";

/**
 * Pilote global de la status bar : résout la configuration depuis
 * `src/config/statusBar.ts` à chaque changement de route et applique
 * automatiquement le mode + couleur de fond. Évite d'avoir à appeler
 * `useStatusBar` dans chaque page.
 *
 * À monter une seule fois, à l'intérieur du `BrowserRouter`.
 */
const StatusBarController = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = STATUS_BAR_ROUTES.find((r) =>
      matchPath({ path: r.pattern, end: true }, pathname),
    );
    const cfg = match ?? STATUS_BAR_DEFAULT;
    setStatusBarStyle(cfg.mode, cfg.backgroundColor);
  }, [pathname]);

  return null;
};

export default StatusBarController;
