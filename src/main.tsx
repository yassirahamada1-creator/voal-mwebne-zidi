import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { STATUS_BAR_EVENT, type StatusBarMode } from "./lib/statusBar";

(async () => {
  let currentMode: StatusBarMode = "auto";
  let applyStyle: () => Promise<void> = async () => {};

  // Toujours brancher l'écoute du mode (utile aussi côté web pour mettre à
  // jour la meta theme-color quand un écran demande "light" ou "dark").
  const updateThemeColor = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const isDarkTheme = document.documentElement.classList.contains("dark");
    // Couleur de la status bar (overlay transparent : seule la meta change)
    if (currentMode === "light") meta.setAttribute("content", "#1a3a5c"); // fond sombre
    else if (currentMode === "dark") meta.setAttribute("content", "#ffffff");
    else meta.setAttribute("content", isDarkTheme ? "#0f1923" : "#2d6a4f");
  };

  window.addEventListener(STATUS_BAR_EVENT, (e: Event) => {
    const detail = (e as CustomEvent).detail as StatusBarMode | undefined;
    if (detail === "light" || detail === "dark" || detail === "auto") {
      currentMode = detail;
      updateThemeColor();
      applyStyle();
    }
  });

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: "#00000000" });

    applyStyle = async () => {
      let style: typeof Style[keyof typeof Style];
      if (currentMode === "light") {
        // Fond sombre → icônes blanches (Capacitor: Style.Dark)
        style = Style.Dark;
      } else if (currentMode === "dark") {
        // Fond clair → icônes noires
        style = Style.Light;
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        style = isDark ? Style.Dark : Style.Light;
      }
      await StatusBar.setStyle({ style });
    };

    await applyStyle();
    const mo = new MutationObserver(applyStyle);
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
