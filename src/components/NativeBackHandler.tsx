/**
 * NativeBackHandler — gère le bouton retour matériel Android et le geste
 * "back" natif (swipe depuis le bord, capté par Android) via Capacitor.
 *
 * Sur iOS, le geste swipe-back du WKWebView est activé dans capacitor.config.ts
 * (`allowsBackForwardNavigationGestures: true`) — rien à intercepter ici, le
 * système gère lui-même `history.back()`.
 *
 * Comportement (par ordre de priorité) :
 *  1. Un modal/dialog/sheet/dropdown Radix est ouvert  → on le ferme.
 *  2. Un élément est en plein écran (Fullscreen API)   → on sort du plein écran.
 *  3. On est sur une route racine (/, /home, /pedagogical, /favorites,
 *     /downloads, /settings, /dashboard)              → confirmation de sortie,
 *     puis App.exitApp().
 *  4. Sinon                                            → navigate(-1).
 *
 * Inactif en environnement purement web (non-Capacitor) : le bouton retour
 * du navigateur fonctionne déjà nativement.
 */
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useI18n } from "@/contexts/I18nContext";

const ROOT_ROUTES = new Set([
  "/",
  "/splash",
  "/home",
  "/pedagogical",
  "/favorites",
  "/downloads",
  "/settings",
  "/dashboard",
]);

/** Ferme le dernier overlay ouvert (Radix Dialog/Sheet/Menu/Popover, YARL lightbox). */
const closeTopRadixOverlay = (): boolean => {
  if (typeof document === "undefined") return false;
  // 1) YARL (yet-another-react-lightbox) — détection prioritaire, plein écran photo.
  const yarl = document.querySelector<HTMLElement>(".yarl__root, .yarl__portal");
  if (yarl) {
    // YARL écoute Escape au niveau document.
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    return true;
  }
  // 2) Radix overlays (Dialog / AlertDialog / Sheet / Drawer / DropdownMenu / Popover).
  const selectors = [
    '[role="dialog"][data-state="open"]',
    '[role="alertdialog"][data-state="open"]',
    '[data-radix-popper-content-wrapper] [data-state="open"]',
    '[data-state="open"][role="menu"]',
  ];
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(selectors.join(",")),
  );
  if (candidates.length === 0) return false;
  const top = candidates[candidates.length - 1];
  top.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  return true;
};

/** Sort du plein écran si actif. */
const exitFullscreenIfAny = (): boolean => {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => void;
  };
  const fs = doc.fullscreenElement || doc.webkitFullscreenElement;
  if (!fs) return false;
  try {
    if (doc.exitFullscreen) doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    return true;
  } catch {
    return false;
  }
};

const NativeBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useI18n();
  const pathnameRef = useRef(location.pathname);
  useEffect(() => { pathnameRef.current = location.pathname; }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor?.isNativePlatform?.()) return;

    let detach: (() => void) | undefined;
    let active = true;

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (!active) return;

      // 1) Overlay ouvert → on le ferme.
      if (closeTopRadixOverlay()) return;

      // 2) Plein écran → on en sort.
      if (exitFullscreenIfAny()) return;

      const path = pathnameRef.current;

      // 3) Route racine → confirmation de sortie.
      if (ROOT_ROUTES.has(path)) {
        const msg = lang === "fr"
          ? "Quitter l'application ?"
          : "Toka kwenye programu?";
        if (window.confirm(msg)) {
          CapacitorApp.exitApp();
        }
        return;
      }

      // 4) Retour normal.
      if (canGoBack) {
        navigate(-1);
      } else {
        navigate("/home", { replace: true });
      }
    }).then((handle) => {
      detach = () => handle.remove();
    });

    return () => {
      active = false;
      detach?.();
    };
  }, [navigate, lang]);

  return null;
};

export default NativeBackHandler;
