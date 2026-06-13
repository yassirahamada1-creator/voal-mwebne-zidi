// Mémorise la direction du dernier swipe entre onglets pour que l'AppShell
// puisse appliquer l'animation slide correspondante (gauche/droite).
// Implémentation volontairement minimaliste (module-scope) pour éviter
// un context React supplémentaire qui forcerait des re-renders globaux.

export type NavDirection = "forward" | "backward" | "none";

let lastDirection: NavDirection = "none";
let lastPath: string | null = null;

export const setNavDirection = (dir: NavDirection, path: string) => {
  lastDirection = dir;
  lastPath = path;
};

/**
 * Renvoie la direction de la dernière transition initiée par un swipe,
 * uniquement si elle correspond à la route demandée. Sinon "none".
 * La valeur est consommée une seule fois.
 */
export const consumeNavDirection = (currentPath: string): NavDirection => {
  if (lastPath !== currentPath) return "none";
  const dir = lastDirection;
  lastDirection = "none";
  lastPath = null;
  return dir;
};
