import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type AppFont =
  | "defaut"
  | "hyperlegible"
  | "lisible"
  | "dyslexique"
  | "ojuju"
  | "space-grotesk"
  | "sora"
  | "outfit";

const FONT_KEY = "vdl_app_font";

const FONT_FAMILY: Record<AppFont, string> = {
  defaut: "'Inter', system-ui, sans-serif",
  hyperlegible: "'Atkinson Hyperlegible', system-ui, sans-serif",
  lisible: "'Lexie Readable', system-ui, sans-serif",
  dyslexique: "'OpenDyslexic', 'Comic Sans MS', system-ui, sans-serif",
  ojuju: "'Ojuju', system-ui, sans-serif",
  "space-grotesk": "'Space Grotesk', system-ui, sans-serif",
  sora: "'Sora', system-ui, sans-serif",
  outfit: "'Outfit', system-ui, sans-serif",
};

export const FONT_LABELS: Record<AppFont, string> = {
  defaut: "Inter (par défaut)",
  hyperlegible: "Atkinson Hyperlegible",
  lisible: "Lexie Readable",
  dyslexique: "OpenDyslexic",
  ojuju: "Ojuju",
  "space-grotesk": "Space Grotesk",
  sora: "Sora",
  outfit: "Outfit",
};

type Ctx = {
  font: AppFont;
  setFont: (f: AppFont) => void;
};

const FontContext = createContext<Ctx | null>(null);

const readFont = (): AppFont => {
  try {
    const v = localStorage.getItem(FONT_KEY);
    if (v && v in FONT_FAMILY) return v as AppFont;
  } catch {}
  return "defaut";
};

export const FontProvider = ({ children }: { children: ReactNode }) => {
  const [font, setFontState] = useState<AppFont>(() =>
    typeof window !== "undefined" ? readFont() : "defaut",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--app-font", FONT_FAMILY[font]);
    root.style.fontFamily = FONT_FAMILY[font];
    document.body.style.fontFamily = FONT_FAMILY[font];
    try {
      localStorage.setItem(FONT_KEY, font);
    } catch {}
  }, [font]);

  const setFont = useCallback((f: AppFont) => setFontState(f), []);

  return <FontContext.Provider value={{ font, setFont }}>{children}</FontContext.Provider>;
};

export const useFont = () => {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFont must be used within FontProvider");
  return ctx;
};
