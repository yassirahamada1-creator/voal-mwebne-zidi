/**
 * Pilotage centralisé du style de la status bar (Capacitor / web).
 *
 * Modes :
 * - `light`  : icônes BLANCHES (fond sombre / coloré derrière la barre).
 * - `dark`   : icônes NOIRES   (fond clair derrière la barre).
 * - `hidden` : la barre est masquée (fullscreen vidéo).
 * - `auto`   : suit le thème (sombre → blanc, clair → noir).
 *
 * Une couleur de fond optionnelle peut être fournie (utile sur Android
 * pour les builds où l'overlay n'est pas actif, ou par cohérence visuelle).
 */
export type StatusBarMode = "light" | "dark" | "hidden" | "auto";

export type StatusBarRequest = {
  mode: StatusBarMode;
  /** Couleur de fond hex (ex. "#000000"). Ignorée en mode "hidden". */
  backgroundColor?: string;
};

export const STATUS_BAR_EVENT = "vdl-status-bar-style";

/**
 * Notifie le pilote global (main.tsx) du style demandé. Sans effet hors
 * navigateur (SSR) ou si le plugin Capacitor est indisponible.
 */
export const setStatusBarStyle = (
  mode: StatusBarMode,
  backgroundColor?: string,
) => {
  try {
    const detail: StatusBarRequest = { mode, backgroundColor };
    window.dispatchEvent(new CustomEvent(STATUS_BAR_EVENT, { detail }));
  } catch {
    /* noop */
  }
};
