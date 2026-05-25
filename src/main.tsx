import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#2d6a4f" });
    await StatusBar.setStyle({ style: Style.Light });

    // Injecter la hauteur réelle de la status bar comme variable CSS
    const info = await StatusBar.getInfo();
    const h = (info as any).height ?? 24;
    document.documentElement.style.setProperty("--status-bar-height", `${h}px`);
  } catch {
    /* noop : web ou plugin indisponible */
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
