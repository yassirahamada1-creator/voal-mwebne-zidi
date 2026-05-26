import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Lang = "fr" | "shi";

/**
 * Arborescence complète des textes affichés dans l'application.
 * Toute chaîne visible doit être référencée ici et consommée via `useI18n()`,
 * ce qui permet à l'admin de l'éditer depuis le dashboard Traductions.
 */
const defaultTranslations = {
  fr: {
    splash: {
      appTitle: "Voix de la Lune",
      appSubtitle: "Femmes, Savoirs et Héritages des Comores",
      appTagline:
        "Ce projet est soutenu par la Commission de l'océan Indien dans le cadre de son projet de développement des Industries Culturelles et Créatives en Indianocéanie, financé par l'Agence française de développement",
      selectLanguage: "Choisissez votre langue",
      french: "Français",
      shikomori: "Shikomori",
    },
    nav: {
      home: "Accueil",
      learn: "Apprendre",
      favorites: "Favoris",
      downloads: "Téléchargements",
      settings: "Paramètres",
      back: "Retour",
    },
    pages: {
      home: {
        banner: "Découvrez l'héritage culturel des femmes comoriennes",
        searchPlaceholder: "Rechercher un thème, un récit…",
        noResults: "Aucun résultat.",
        noModules: "Aucun module disponible.",
        themeLabel: "Thème",
      },
      pedagogical: {
        title: "Espace Pédagogique",
        quizzesSection: "Quiz Interactifs",
        startCta: "Commencer",
      },
      downloads: {
        title: "Téléchargements",
        subtitle: "File des téléchargements en cours",
        empty: "Aucun téléchargement en cours",
        emptyHint:
          "Lancez un téléchargement depuis la fiche d'un contenu pour le suivre ici.",
      },
      favorites: {
        title: "Mes favoris",
        searchPlaceholder: "Rechercher un favori…",
        empty: "Aucun favori",
        emptyHint: "Touchez le cœur sur un contenu pour l'ajouter ici.",
        noResults: "Aucun résultat.",
        removed: "Retiré des favoris",
      },
      settings: {
        title: "Paramètres",
      },
      foreword: {
        title: "Avant-propos",
      },
      licenses: {
        title: "Licences",
      },
      quiz: {
        finishedTitle: "Félicitations !",
        scoreLabel: "Score",
        good: "Vous maîtrisez bien le patrimoine comorien !",
        keepLearning: "Continuez à apprendre !",
        retry: "Réessayer",
        share: "Partager",
        correct: "Correct !",
        incorrect: "Incorrect",
        nextQuestion: "Question Suivante",
        noQuestions: "Aucune question disponible.",
        swipeBack: "Glissez depuis le bord gauche pour revenir.",
      },
    },
  },
  shi: {
    splash: {
      appTitle: "Sauti ya Mwezi",
      appSubtitle: "Wanawake, Maarifa na Urithi wa Komori",
      appTagline:
        "Mradi huu unaungwa mkono na Tume ya Bahari Hindi katika kipindi cha mradi wake wa maendeleo ya Viwanda vya Utamaduni na Ubunifu katika Indianocéanie, ukiwa na ufadhili wa Shirika la Maendeleo la Ufaransa",
      selectLanguage: "Tsagulani lugha yenu",
      french: "Kifaransa",
      shikomori: "Shikomori",
    },
    nav: {
      home: "Nyumbani",
      learn: "Fundza",
      favorites: "Vipendwa",
      downloads: "Upakuaji",
      settings: "Mpangilio",
      back: "Rudi",
    },
    pages: {
      home: {
        banner: "Gunduani urithi wa kitamaduni wa wanawake wa Kikomori",
        searchPlaceholder: "Tafuta mada, hadithi…",
        noResults: "Hakuna matokeo.",
        noModules: "Hakuna moduli.",
        themeLabel: "Mada",
      },
      pedagogical: {
        title: "Nafasi ya Kufundisha",
        quizzesSection: "Maswali",
        startCta: "Anza",
      },
      downloads: {
        title: "Upakuaji",
        subtitle: "Foleni ya upakuaji unaoendelea",
        empty: "Hakuna upakuaji unaoendelea",
        emptyHint:
          "Anza upakuaji kutoka kwa ukurasa wa maudhui ili kuufuata hapa.",
      },
      favorites: {
        title: "Pendwa zangu",
        searchPlaceholder: "Tafuta pendwa…",
        empty: "Hakuna pendwa",
        emptyHint: "Bonyeza moyo kwenye yaliyomo kuongeza.",
        noResults: "Hakuna matokeo.",
        removed: "Imeondolewa",
      },
      settings: {
        title: "Mpangilio",
      },
      foreword: {
        title: "Utangulizi",
      },
      licenses: {
        title: "Leseni",
      },
      quiz: {
        finishedTitle: "Hongera!",
        scoreLabel: "Alama",
        good: "Unajua vizuri urithi wa Kikomori!",
        keepLearning: "Endelea kujifunza!",
        retry: "Jaribu tena",
        share: "Shiriki",
        correct: "Sahihi!",
        incorrect: "Si sahihi",
        nextQuestion: "Swali Lifuatalo",
        noQuestions: "Hakuna maswali.",
        swipeBack: "Telezesha kutoka ukingoni wa kushoto kurudi.",
      },
    },
  },
};

type Translations = typeof defaultTranslations.fr;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  tFr: Translations;
  tShi: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

const PREVIEW_STORAGE_KEY = "i18n_preview_overrides";
const PREVIEW_EVENT = "i18n-preview-changed";

// Apply DB overrides ("appTitle" or "pages.home.banner") onto the default tree.
function applyOverrides(base: Translations, rows: { key: string; value: string }[]): Translations {
  const out: any = JSON.parse(JSON.stringify(base));
  for (const { key, value } of rows) {
    if (!key || value == null) continue;
    const parts = key.split(".");
    let cursor: any = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cursor[parts[i]] !== "object" || cursor[parts[i]] === null) {
        cursor[parts[i]] = {};
      }
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return out as Translations;
}

type PreviewMap = Record<string, { value_fr?: string; value_shk?: string }>;

function readPreview(): PreviewMap {
  try {
    return JSON.parse(localStorage.getItem(PREVIEW_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Set a single preview override (called from admin). */
export function setPreviewTranslation(
  key: string,
  value_fr: string | undefined,
  value_shk: string | undefined,
) {
  const map = readPreview();
  if (value_fr === undefined && value_shk === undefined) {
    delete map[key];
  } else {
    map[key] = { value_fr, value_shk };
  }
  localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(PREVIEW_EVENT));
}

/** Clear all preview overrides. */
export function clearPreviewTranslations() {
  localStorage.removeItem(PREVIEW_STORAGE_KEY);
  window.dispatchEvent(new Event(PREVIEW_EVENT));
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("fr");
  const [overrides, setOverrides] = useState<{
    fr: { key: string; value: string }[];
    shi: { key: string; value: string }[];
  }>({ fr: [], shi: [] });
  const [preview, setPreview] = useState<PreviewMap>(() =>
    typeof window !== "undefined" ? readPreview() : {},
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("translations")
        .select("key,value_fr,value_shk");
      if (cancelled || !data) return;
      setOverrides({
        fr: data.map((r: any) => ({ key: r.key, value: r.value_fr })),
        shi: data.map((r: any) => ({ key: r.key, value: r.value_shk })),
      });
    };
    load();

    const channel = supabase
      .channel("translations-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "translations" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen for preview changes (same tab + cross-tab).
  useEffect(() => {
    const refresh = () => setPreview(readPreview());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREVIEW_STORAGE_KEY) refresh();
    };
    window.addEventListener(PREVIEW_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PREVIEW_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Merge DB overrides with preview (preview wins) — for a given language.
  const buildMerged = (l: Lang) => {
    const field = (l === "fr" ? "value_fr" : "value_shk") as "value_fr" | "value_shk";
    return [
      ...overrides[l],
      ...Object.entries(preview)
        .filter(([, v]) => v[field] !== undefined)
        .map(([key, v]) => ({ key, value: v[field] as string })),
    ];
  };

  const tFr = applyOverrides(defaultTranslations.fr, buildMerged("fr"));
  const tShi = applyOverrides(defaultTranslations.shi, buildMerged("shi"));
  const t = lang === "fr" ? tFr : tShi;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tFr, tShi }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
