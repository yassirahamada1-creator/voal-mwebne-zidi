import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { STATUS_BAR_EVENT, type StatusBarMode, type StatusBarRequest } from "./lib/statusBar";
import { prewarmStaticAssets } from "./lib/prewarmAssets";
import { sweepExpiredVideos } from "./lib/videoStorage";

// Précharge en arrière-plan tous les logos / illustrations bundlés
// pour qu'aucun écran ne flashe sur le premier affichage.
prewarmStaticAssets();

// Balaye les vidéos téléchargées expirées (TTL 5j ou 3j sans visionnage)
// et toaste un avertissement J-1. Tourne au lancement puis toutes les 6 h.
const runSweep = () => { void sweepExpiredVideos(); };
const idle = (cb: () => void) =>
  ((window as any).requestIdleCallback ?? ((c: () => void) => setTimeout(c, 1500)))(cb);
idle(runSweep);
setInterval(runSweep, 6 * 60 * 60 * 1000);

// Demande un stockage persistant pour éviter que la WebView Android
// n'évince IndexedDB (vidéos hors-ligne) et Cache API (images) sous
// pression mémoire. Sans cela, les téléchargements peuvent "disparaître"
// après fermeture de l'app.
(async () => {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      const already = await navigator.storage.persisted?.();
      if (!already) await navigator.storage.persist();
    }
  } catch {
    /* noop */
  }
})();

(async () => {
  let currentMode: StatusBarMode = "auto";
  let currentBg: string | undefined;
  let applyStyle: () => Promise<void> = async () => {};
  let applyVisibility: () => Promise<void> = async () => {};
  let applyBackground: () => Promise<void> = async () => {};

  // Toujours brancher l'écoute du mode (utile aussi côté web pour mettre à
  // jour la meta theme-color quand un écran demande "light" ou "dark").
  const updateThemeColor = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const isDarkTheme = document.documentElement.classList.contains("dark");
    if (currentBg) {
      meta.setAttribute("content", currentBg);
      return;
    }
    if (currentMode === "light") meta.setAttribute("content", "#1a3a5c");
    else if (currentMode === "dark") meta.setAttribute("content", "#ffffff");
    else if (currentMode === "hidden") meta.setAttribute("content", "#000000");
    else meta.setAttribute("content", isDarkTheme ? "#0f1923" : "#2d6a4f");
  };

  window.addEventListener(STATUS_BAR_EVENT, (e: Event) => {
    const detail = (e as CustomEvent).detail as
      | StatusBarMode
      | StatusBarRequest
      | undefined;
    if (!detail) return;
    const next: StatusBarRequest =
      typeof detail === "string" ? { mode: detail } : detail;
    if (
      next.mode !== "light" &&
      next.mode !== "dark" &&
      next.mode !== "hidden" &&
      next.mode !== "auto"
    ) return;
    currentMode = next.mode;
    currentBg = next.backgroundColor;
    updateThemeColor();
    applyVisibility();
    applyStyle();
    applyBackground();
  });

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: "#00000000" });

    let hidden = false;
    applyVisibility = async () => {
      try {
        if (currentMode === "hidden" && !hidden) {
          await StatusBar.hide();
          hidden = true;
        } else if (currentMode !== "hidden" && hidden) {
          await StatusBar.show();
          hidden = false;
        }
      } catch {
        /* noop */
      }
    };

    applyStyle = async () => {
      if (currentMode === "hidden") return;
      let style: typeof Style[keyof typeof Style];
      if (currentMode === "light") {
        style = Style.Dark; // icônes blanches
      } else if (currentMode === "dark") {
        style = Style.Light; // icônes noires
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        style = isDark ? Style.Dark : Style.Light;
      }
      try {
        await StatusBar.setStyle({ style });
      } catch {
        /* noop */
      }
    };

    applyBackground = async () => {
      if (currentMode === "hidden") return;
      // Overlay reste transparent en permanence ; on n'écrit la couleur
      // que si elle est explicitement fournie (cohérence Android sans overlay).
      if (!currentBg) return;
      try {
        await StatusBar.setBackgroundColor({ color: currentBg });
      } catch {
        /* noop */
      }
    };

    await applyVisibility();
    await applyStyle();
    await applyBackground();

    const mo = new MutationObserver(() => applyStyle());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Injecter la hauteur réelle de la status bar comme variable CSS
    const info = await StatusBar.getInfo();
    const h = (info as any).height ?? 24;
    document.documentElement.style.setProperty("--status-bar-height", `${h}px`);
  } catch {
    /* noop : web ou plugin indisponible */
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
