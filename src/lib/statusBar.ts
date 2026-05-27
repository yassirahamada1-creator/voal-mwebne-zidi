/**
 * Pilotage centralisé du style de la status bar (Capacitor / web).
 *
 * - `light` : icônes BLANCHES (à utiliser quand le fond sous la status bar
 *   est sombre ou coloré → ex. ScreenHeader avec dégradé foreground).
 * - `dark`  : icônes NOIRES (à utiliser quand le fond est blanc / clair).
 * - `auto`  : suit le thème (sombre = blanc, clair = noir).
 */
export type StatusBarMode = "light" | "dark" | "auto";

export const STATUS_BAR_EVENT = "vdl-status-bar-style";

export const setStatusBarStyle = (mode: StatusBarMode) => {
  try {
    window.dispatchEvent(new CustomEvent(STATUS_BAR_EVENT, { detail: mode }));
  } catch {}
};
