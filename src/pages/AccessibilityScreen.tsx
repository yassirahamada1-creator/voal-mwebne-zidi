import { useEffect, useMemo, useState } from "react";

import { Type, BookOpen } from "lucide-react";
import { matchesAllTokens } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { notifyA11yChanged } from "@/components/AccessibilityApplier";
import { useI18n } from "@/contexts/I18nContext";
import { useFont, FONT_LABELS, type AppFont } from "@/contexts/FontContext";

const STORAGE_KEY = "vdl_accessibility_settings_v1";

type TextSize = 0 | 1 | 2 | 3;

type Settings = {
  textSize: TextSize;
  dyslexicFont: boolean;
};

const DEFAULTS: Settings = {
  textSize: 1,
  dyslexicFont: false,
};

const TEXT_SIZE_LABELS_FR = ["Petit", "Normal", "Grand", "Très grand"];
const TEXT_SIZE_LABELS_SHI = ["Ndzdogo", "Kawaida", "Nkubwa", "Nkubwa sana"];

const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      textSize: (parsed.textSize ?? DEFAULTS.textSize) as TextSize,
      dyslexicFont: !!parsed.dyslexicFont,
    };
  } catch {
    return DEFAULTS;
  }
};

const AccessibilityScreen = () => {
  const { lang } = useI18n();
  const fr = lang === "fr";
  const TEXT_SIZE_LABELS = fr ? TEXT_SIZE_LABELS_FR : TEXT_SIZE_LABELS_SHI;
  const { font, setFont } = useFont();

  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const search = "";
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
    notifyA11yChanged();
  }, [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const reset = () => {
    setSettings(DEFAULTS);
    setFont("defaut");
    setResetOpen(false);
    toast.success(
      fr ? "Paramètres réinitialisés" : "Mipangilio imerejeshwa",
      {
        description: fr
          ? "Taille du texte : Normal • Police : Inter (par défaut)"
          : "Ukubwa wa maandishi: Kawaida • Fonti: Inter (chaguo-msingi)",
      },
    );
  };

  const matches = (text: string) => matchesAllTokens([text], search);

  const sections = useMemo(
    () => ({
      display: matches(
        fr
          ? "Affichage Lecture Taille texte police dyslexique"
          : "Onyesho Usomaji Ukubwa wa maandishi fonti dyslexia",
      ),
    }),
    [search, fr],
  );

  return (
    <div
      className="min-h-screen pb-28"
      style={{ backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
    >
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
              {fr ? "Accessibilité" : "Ufikivu"}
            </h1>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {fr
                ? "Personnalisez votre expérience d'apprentissage"
                : "Boresha matumizi yako ya kujifunza"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            aria-label={
              fr
                ? "Réinitialiser les paramètres d'accessibilité"
                : "Rejesha mipangilio ya ufikivu"
            }
            className="h-9 px-3 text-xs font-medium rounded-full border min-w-[44px]"
            style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}
          >
            {fr ? "Réinitialiser" : "Rejesha"}
          </button>
        </div>

      </header>

      <main className="px-4 py-4 space-y-4 max-w-[480px] mx-auto">
        <Accordion type="multiple" defaultValue={["display"]} className="space-y-4">
          {sections.display && (
            <AccordionItem
              value="display"
              className="card-cultural border-0 px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-start gap-3 text-left">
                  <span aria-hidden className="text-xl leading-none">👁️</span>
                  <div>
                    <div className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
                      {fr ? "Affichage & Lecture" : "Onyesho na Usomaji"}
                    </div>
                    <div className="text-xs font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {fr
                        ? "Taille du texte et police"
                        : "Ukubwa wa maandishi na fonti"}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
                      <Type className="h-4 w-4" aria-hidden />{" "}
                      {fr ? "Taille du texte" : "Ukubwa wa maandishi"}
                    </label>
                    <span className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                      {TEXT_SIZE_LABELS[settings.textSize]}
                    </span>
                  </div>
                  <Slider
                    value={[settings.textSize]}
                    min={0}
                    max={3}
                    step={1}
                    onValueChange={([v]) => update("textSize", v as TextSize)}
                    aria-label={fr ? "Taille du texte" : "Ukubwa wa maandishi"}
                  />
                  <div className="flex justify-between text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {TEXT_SIZE_LABELS.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
                    <BookOpen className="h-4 w-4" aria-hidden />
                    {fr ? "Police de texte" : "Fonti ya maandishi"}
                  </label>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {fr
                      ? "Choisissez une police adaptée à vos besoins"
                      : "Chagua fonti inayofaa mahitaji yako"}
                  </p>
                  <div className="-mx-4 px-4 overflow-x-auto">
                    <div className="flex gap-3 pb-2 snap-x snap-mandatory">
                      {([
                        { key: "defaut", name: "Inter", sub: fr ? "Par défaut" : "Chaguo-msingi", family: "'Inter', sans-serif" },
                        { key: "ojuju", name: "Ojuju", sub: fr ? "Moderne" : "Ya kisasa", family: "'Ojuju', sans-serif" },
                        { key: "space-grotesk", name: "Space Grotesk", sub: fr ? "Géométrique" : "Kijiometri", family: "'Space Grotesk', sans-serif" },
                        { key: "sora", name: "Sora", sub: fr ? "Épurée" : "Safi", family: "'Sora', sans-serif" },
                        { key: "outfit", name: "Outfit", sub: fr ? "Élégante" : "Maridadi", family: "'Outfit', sans-serif" },
                        { key: "dyslexique", name: "OpenDyslexic", sub: fr ? "Dyslexie" : "Dyslexia", family: "'OpenDyslexic', sans-serif" },
                        { key: "hyperlegible", name: "Atkinson", sub: fr ? "Malvoyants" : "Wenye uoni hafifu", family: "'Atkinson Hyperlegible', sans-serif" },
                        { key: "lisible", name: "Lexie Readable", sub: fr ? "Lecture facile" : "Usomaji rahisi", family: "'Lexie Readable', sans-serif" },
                      ] as { key: AppFont; name: string; sub: string; family: string }[]).map((opt) => {
                        const active = font === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setFont(opt.key);
                              toast.success(
                                fr ? `Police ${opt.name} appliquée ✓` : `Fonti ${opt.name} imetumika ✓`,
                              );
                            }}
                            aria-pressed={active}
                            className={`relative flex-shrink-0 w-32 snap-start rounded-2xl border-2 p-3 text-center transition ${
                              active ? "border-primary bg-primary/10" : "border-border bg-card"
                            }`}
                          >
                            {active && (
                              <span
                                aria-hidden
                                className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground"
                                style={{ backgroundColor: "hsl(var(--primary))" }}
                              >
                                ✓
                              </span>
                            )}
                            <div
                              className="text-sm font-semibold truncate"
                              style={{ color: "hsl(var(--foreground))", fontFamily: opt.family }}
                            >
                              {opt.name}
                            </div>
                            <div
                              className="text-lg my-1"
                              style={{ color: "hsl(var(--foreground))", fontFamily: opt.family }}
                            >
                              Aa Bb Cc
                            </div>
                            <div className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {opt.sub}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
        <div className="pt-2 space-y-3">
          <p className="text-center text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {fr
              ? "Ces paramètres sont sauvegardés automatiquement"
              : "Mipangilio hii huhifadhiwa kiotomatiki"}
          </p>
          <p className="text-center text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            {fr ? "Accessibilité v1.0 — Conforme WCAG AA" : "Ufikivu v1.0 — WCAG AA"}
          </p>
        </div>
      </main>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)] rounded-lg sm:max-w-[calc(28rem-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fr ? "Réinitialiser les paramètres ?" : "Rejesha mipangilio?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {fr
                ? "Toutes vos préférences d'accessibilité seront restaurées aux valeurs par défaut."
                : "Mipangilio yote ya ufikivu itarejeshwa kwa thamani za awali."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Ghairi"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={reset}
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              {fr ? "Réinitialiser" : "Rejesha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccessibilityScreen;
