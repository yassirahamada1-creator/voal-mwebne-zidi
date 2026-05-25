import { useEffect } from "react";

const STORAGE_KEY = "vdl_accessibility_settings_v1";
export const A11Y_EVENT = "vdl-a11y-changed";

type Settings = {
  textSize?: 0 | 1 | 2 | 3;
  dyslexicFont?: boolean;
};

const SCALE = [0.9, 1, 1.15, 1.3];

const REMOVED_KEYS = [
  "highContrast",
  "reduceMotion",
  "immersiveReading",
  "captions",
  "captionSize",
  "captionBg",
  "autoTranscription",
  "audioDescription",
  "audioSpeed",
  "activeProfile",
] as const;

/**
 * Migrate legacy accessibility settings stored in localStorage by stripping
 * any removed keys (highContrast, reduceMotion, immersiveReading, ...).
 * Runs once per page load; no-op when nothing to clean.
 */
export const migrateStoredSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) ?? {};
    let changed = false;
    for (const k of REMOVED_KEYS) {
      if (k in parsed) {
        delete parsed[k];
        changed = true;
      }
    }
    const clean: Settings = {
      textSize: parsed.textSize,
      dyslexicFont: !!parsed.dyslexicFont,
    };
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return {};
  }
};

const apply = () => {
  const s = migrateStoredSettings();
  const root = document.documentElement;
  const scale = SCALE[s.textSize ?? 1] ?? 1;
  root.style.setProperty("--a11y-font-scale", String(scale));
  root.classList.toggle("a11y-dyslexic", !!s.dyslexicFont);
  // Ensure removed features are not lingering from older settings
  root.classList.remove("a11y-high-contrast", "a11y-reduce-motion", "a11y-immersive");
};

export const notifyA11yChanged = () => {
  try {
    window.dispatchEvent(new Event(A11Y_EVENT));
  } catch {}
};

export const AccessibilityApplier = () => {
  useEffect(() => {
    apply();
    const onChange = () => apply();
    window.addEventListener(A11Y_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(A11Y_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return null;
};
