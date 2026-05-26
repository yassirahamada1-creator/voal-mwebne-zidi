/**
 * GlobalBackButton — bouton retour flottant (top-left) affiché sur tous les
 * écrans secondaires.
 *
 * Refonte : au lieu d'utiliser `navigate(-1)` (qui dépend de l'historique du
 * navigateur et peut renvoyer hors de l'app, ou vers le splash), on calcule
 * une **route parente logique** selon le chemin courant. L'animation "peek"
 * reproduit visuellement le geste swipe-back iOS avant la navigation.
 *
 * Masqué sur les écrans racines (splash / home / pedagogical / favorites /
 * downloads / settings / dashboard).
 */
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { biStr } from "@/lib/bilingual";

const ROOT_ROUTES = new Set([
  "/",
  "/home",
  "/pedagogical",
  "/favorites",
  "/downloads",
  "/settings",
]);

const SETTINGS_CHILDREN = new Set([
  "/licenses",
  "/terms",
  "/privacy",
]);

/**
 * Calcule la route parente logique pour le chemin courant.
 * - `/category/:k`            -> `/home`
 * - `/media/:id`              -> `state.fromPath` ou `/home`
 * - `/quiz`                   -> `/pedagogical`
 * - `/accessibility|licenses|terms|privacy` -> `/settings`
 * - sinon                     -> `/home`
 */
const resolveParent = (pathname: string, state: unknown): string => {
  const fromPath =
    state && typeof state === "object" && "fromPath" in (state as any)
      ? String((state as any).fromPath || "")
      : "";

  if (pathname.startsWith("/media/")) {
    return fromPath && fromPath !== pathname ? fromPath : "/home";
  }
  if (pathname.startsWith("/category/")) return "/home";
  if (pathname === "/quiz") return "/pedagogical";
  if (SETTINGS_CHILDREN.has(pathname)) return "/settings";
  return "/home";
};

const GlobalBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  const enabled =
    !ROOT_ROUTES.has(pathname) &&
    !pathname.startsWith("/splash") &&
    !pathname.startsWith("/dashboard");

  const parent = useMemo(
    () => resolveParent(pathname, location.state),
    [pathname, location.state],
  );

  if (!enabled) return null;

  const handleBack = () => {
    // Préfère l'historique réel du navigateur ; fallback sur la route parente
    // logique si on a atterri directement sur cette page (pas d'historique).
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(parent);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={biStr("Retour", "Rudi")}
      className="fixed z-[55] inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg ring-1 ring-border backdrop-blur-md transition active:scale-95 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        left: "calc(env(safe-area-inset-left, 0px) + 12px)",
      }}
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

export default GlobalBackButton;
