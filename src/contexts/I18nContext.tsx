import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Lang = "fr" | "shi";

const defaultTranslations = {
  fr: {
    appTitle: "Voix de la Lune",
    appSubtitle: "Femmes, Savoirs et Héritages des Comores",
    appTagline:
      "Ce projet est soutenu par la Commission de l'océan Indien dans le cadre de son projet de développement des Industries Culturelles et Créatives en Indianocéanie, financé par l'Agence française de développement",
    selectLanguage: "Choisissez votre langue",
    french: "Français",
    shikomori: "Shikomori",
    home: "Accueil",
    explore: "Explorer",
    learn: "Apprendre",
    settings: "Paramètres",
    search: "Rechercher...",
    offlineReady: "Prêt hors-ligne",
    discoverHeritage: "Découvrez l'héritage culturel des femmes comoriennes",
    categories: {
      danses: "Danses Traditionnelles",
      medecine: "Médecine Traditionnelle",
      cuisine: "Savoirs Culinaires",
      poesie: "Poésie Chantée",
      tenues: "Tenues Traditionnelles",
      transmission: "Transmission Intergénérationnelle",
    },
    categoryDescs: {
      danses: "Danses sacrées et festives des Comores",
      medecine: "Plantes médicinales et pratiques ancestrales",
      cuisine: "Recettes et traditions culinaires",
      poesie: "Chants et poèmes de la tradition orale",
      tenues: "Vêtements et parures traditionnels",
      transmission: "Savoirs transmis de génération en génération",
    },
    all: "Tout",
    video: "Vidéo",
    audio: "Audio",
    text: "Texte",
    gallery: "Galerie",
    galleryTitle: "Galerie Multimédia",
    pedagogical: "Espace Pédagogique",
    quizzes: "Quiz Interactifs",
    pdfSheets: "Fiches Pédagogiques",
    schoolActivities: "Activités Scolaires",
    startQuiz: "Commencer le Quiz",
    nextQuestion: "Question Suivante",
    score: "Score",
    congratulations: "Félicitations !",
    tryAgain: "Réessayer",
    shareScore: "Partager le score",
    language: "Langue",
    offlineContent: "Contenu hors-ligne",
    storageUsage: "Utilisation du stockage",
    version: "Version",
    credits: "Crédits",
    downloadAll: "Tout télécharger",
    deleteAll: "Supprimer tout",
    back: "Retour",
    relatedContent: "Contenu similaire",
    downloadPdf: "Télécharger la fiche PDF",
    questionOf: "Question {current} sur {total}",
    correct: "Correct !",
    incorrect: "Incorrect",
    encouragement: "Vous maîtrisez bien le patrimoine comorien !",
    keepLearning: "Continuez à apprendre !",
  },
  shi: {
    appTitle: "Sauti ya Mwezi",
    appSubtitle: "Wanawake, Maarifa na Urithi wa Komori",
    appTagline:
      "Mradi huu unaungwa mkono na Tume ya Bahari Hindi katika kipindi cha mradi wake wa maendeleo ya Viwanda vya Utamaduni na Ubunifu katika Indianocéanie, ukiwa na ufadhili wa Shirika la Maendeleo la Ufaransa",
    selectLanguage: "Tsagulani lugha yenu",
    french: "Kifaransa",
    shikomori: "Shikomori",
    home: "Nyumbani",
    explore: "Gundua",
    learn: "Fundza",
    settings: "Mpangilio",
    search: "Tafuta...",
    offlineReady: "Tayari bila mtandao",
    discoverHeritage: "Gunduani urithi wa kitamaduni wa wanawake wa Kikomori",
    categories: {
      danses: "Ngoma za Jadi",
      medecine: "Dawa ya Jadi",
      cuisine: "Maarifa ya Kupika",
      poesie: "Mashairi ya Kuimba",
      tenues: "Mavazi ya Jadi",
      transmission: "Uhifadhi wa Vizazi",
    },
    categoryDescs: {
      danses: "Ngoma takatifu na za sherehe",
      medecine: "Mimea ya dawa na mila za zamani",
      cuisine: "Mapishi na mila ya kupika",
      poesie: "Nyimbo na mashairi ya jadi",
      tenues: "Nguo na mapambo ya jadi",
      transmission: "Maarifa yanayopitishwa kizazi hadi kizazi",
    },
    all: "Zote",
    video: "Video",
    audio: "Sauti",
    text: "Maandishi",
    gallery: "Picha",
    galleryTitle: "Picha na Media",
    pedagogical: "Nafasi ya Kufundisha",
    quizzes: "Maswali",
    pdfSheets: "Karatasi za Kufundisha",
    schoolActivities: "Shughuli za Shule",
    startQuiz: "Anza Maswali",
    nextQuestion: "Swali Lifuatalo",
    score: "Alama",
    congratulations: "Hongera!",
    tryAgain: "Jaribu tena",
    shareScore: "Shiriki alama",
    language: "Lugha",
    offlineContent: "Maudhui bila mtandao",
    storageUsage: "Matumizi ya hifadhi",
    version: "Toleo",
    credits: "Mikopo",
    downloadAll: "Pakua zote",
    deleteAll: "Futa zote",
    back: "Rudi",
    relatedContent: "Maudhui yanayohusiana",
    downloadPdf: "Pakua karatasi ya PDF",
    questionOf: "Swali {current} kati ya {total}",
    correct: "Sahihi!",
    incorrect: "Si sahihi",
    encouragement: "Unajua vizuri urithi wa Kikomori!",
    keepLearning: "Endelea kujifunza!",
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

// Apply DB overrides ("appTitle" or "categories.grandMariage") onto the default tree.
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
