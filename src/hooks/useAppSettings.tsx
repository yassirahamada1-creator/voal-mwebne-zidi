import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";

const ECON_KEY = "vdl_economy_mode";
const WIFI_KEY = "vdl_wifi_only";

type Ctx = {
  economyMode: boolean;
  setEconomyMode: (v: boolean) => void;
  wifiOnly: boolean;
  setWifiOnly: (v: boolean) => void;
};

const AppSettingsContext = createContext<Ctx | null>(null);

const readBool = (k: string, fallback = false) => {
  try {
    const v = localStorage.getItem(k);
    if (v === null) return fallback;
    return v === "1";
  } catch {
    return fallback;
  }
};

export const isEconomyMode = () => readBool(ECON_KEY);
export const isWifiOnly = () => readBool(WIFI_KEY);

/**
 * Detects if the current connection is a non-WiFi mobile/cellular link.
 * Uses the experimental Network Information API. When the API is unavailable,
 * we assume WiFi (returns false) so downloads aren't blocked unexpectedly.
 */
export const isOnCellular = (): boolean => {
  try {
    const conn: any =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (!conn) return false;
    const type = conn.type as string | undefined;
    if (type) return ["cellular", "wimax"].includes(type);
    // Fallback: use effectiveType heuristic.
    const eff = conn.effectiveType as string | undefined;
    return eff === "2g" || eff === "3g";
  } catch {
    return false;
  }
};

/** Subscribe to connection changes; returns unsubscribe. */
export const onConnectionChange = (cb: () => void) => {
  const conn: any =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  if (conn?.addEventListener) {
    conn.addEventListener("change", cb);
    return () => conn.removeEventListener("change", cb);
  }
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [economyMode, setEconomyModeState] = useState<boolean>(() =>
    typeof window !== "undefined" ? readBool(ECON_KEY) : false,
  );
  const [wifiOnly, setWifiOnlyState] = useState<boolean>(() =>
    typeof window !== "undefined" ? readBool(WIFI_KEY) : false,
  );

  // S'assure que la classe `dark` n'est jamais appliquée et nettoie une
  // ancienne préférence éventuellement stockée par une version précédente.
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try { localStorage.removeItem("vdl_dark_mode"); } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ECON_KEY, economyMode ? "1" : "0");
    } catch {}
  }, [economyMode]);

  useEffect(() => {
    try {
      localStorage.setItem(WIFI_KEY, wifiOnly ? "1" : "0");
    } catch {}
  }, [wifiOnly]);

  const setEconomyMode = useCallback((v: boolean) => setEconomyModeState(v), []);
  const setWifiOnly = useCallback((v: boolean) => setWifiOnlyState(v), []);

  const value = useMemo<Ctx>(
    () => ({ economyMode, setEconomyMode, wifiOnly, setWifiOnly }),
    [economyMode, wifiOnly, setEconomyMode, setWifiOnly],
  );


  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
};

/**
 * Transforms a media URL when economy mode is enabled.
 * For videos, appends a ?quality=480p hint so backends supporting on-the-fly
 * transcoding can serve a lighter version. Falls back to original URL otherwise.
 */
export const applyEconomyToUrl = (
  url: string,
  type: "video" | "audio" | "text" | "image" | "pdf",
  override?: boolean,
) => {
  if (!url) return url;
  const econ = override ?? isEconomyMode();
  if (!econ) return url;
  if (type !== "video") return url;
  try {
    const u = new URL(url, window.location.origin);
    u.searchParams.set("quality", "480p");
    return u.toString();
  } catch {
    return url;
  }
};
