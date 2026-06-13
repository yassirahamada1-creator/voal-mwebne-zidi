/**
 * Configuration centralisée du style de la status bar par route.
 *
 * Ajouter une nouvelle page = ajouter une entrée ici. Le
 * `StatusBarController` monté dans `App.tsx` applique automatiquement
 * le bon style à chaque navigation, sans qu'il soit nécessaire
 * d'appeler `useStatusBar` dans chaque écran.
 *
 * Conventions :
 * - `light` : fond sombre/coloré derrière la barre (icônes BLANCHES).
 * - `dark`  : fond clair derrière la barre (icônes NOIRES).
 * - `hidden`: barre masquée (réservé aux flux fullscreen, géré côté page).
 *
 * Le premier pattern qui matche l'emporte. Le pattern `*` capture toute
 * route inconnue (fallback 404, etc.).
 */
import type { StatusBarMode } from "@/lib/statusBar";

export type StatusBarRouteConfig = {
  /** Pattern react-router (ex. "/home", "/media/:mediaId", "*"). */
  pattern: string;
  mode: StatusBarMode;
  backgroundColor?: string;
};

export const STATUS_BAR_DEFAULT: { mode: StatusBarMode; backgroundColor?: string } = {
  mode: "auto",
};

export const STATUS_BAR_ROUTES: StatusBarRouteConfig[] = [
  // Lecteur média : status bar noire (icônes blanches). La page gère en plus
  // le mode `hidden` dynamiquement lors du passage en plein écran vidéo.
  { pattern: "/media/:mediaId", mode: "light", backgroundColor: "#000000" },

  // Catégorie : status bar noire (icônes blanches)
  { pattern: "/category/:categoryKey", mode: "light", backgroundColor: "#000000" },

  // Splash + écrans à fond sombre/coloré (icônes blanches)
  { pattern: "/",            mode: "light" },
  { pattern: "/splash",      mode: "light" },
  { pattern: "/home",        mode: "light" },
  
  { pattern: "/pedagogical", mode: "light" },
  { pattern: "/settings",    mode: "light" },
  { pattern: "/foreword",    mode: "light", backgroundColor: "#1A3A5C" },
  { pattern: "/hommage",     mode: "light", backgroundColor: "#8a7bb3" },

  // Écrans avec hero header sombre (ScreenHeader) → icônes blanches
  { pattern: "/gallery",               mode: "light" },
  { pattern: "/gallery/:subjectId",    mode: "light" },
  { pattern: "/quiz",                  mode: "light" },


  // Pages à fond clair → icônes noires
  { pattern: "/favorites",     mode: "dark" },
  { pattern: "/licenses",      mode: "dark" },
  { pattern: "/terms",         mode: "dark" },
  { pattern: "/privacy",       mode: "dark" },
  { pattern: "/dev/cors-test", mode: "dark" },

  // Fallback (404 et routes inconnues)
  { pattern: "*", mode: "dark" },
];
