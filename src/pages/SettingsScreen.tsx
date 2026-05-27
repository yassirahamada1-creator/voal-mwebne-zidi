import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import {
  ChevronRight,
  FileText,
  ShieldCheck,
  Scale,
  Palette,
  FileBadge,
  BookOpen,
  Monitor,
  Sun,
  Moon,
  Type,
  Contrast,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { bi, biStr } from "@/lib/bilingual";
import { credits } from "@/config/credits";
import { notifyA11yChanged } from "@/components/AccessibilityApplier";
import { useFont, type AppFont } from "@/contexts/FontContext";
import { toast } from "@/components/ui/sonner";

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                            */
/* -------------------------------------------------------------------------- */

const Row = ({
  icon: Icon,
  fr,
  shi,
  trailing,
}: {
  icon: LucideIcon;
  fr: string;
  shi: string;
  trailing: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3.5 min-h-[56px]">
    <div className="flex items-center gap-3 min-w-0">
      <div className="rounded-lg bg-secondary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-secondary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{fr}</p>
        <p className="text-[11px] leading-tight text-muted-foreground opacity-80 truncate mt-0.5">
          {shi}
        </p>
      </div>
    </div>
    <div className="shrink-0">{trailing}</div>
  </div>
);

const LinkRow = ({
  to,
  icon,
  fr,
  shi,
}: {
  to: string;
  icon: LucideIcon;
  fr: string;
  shi: string;
}) => (
  <Link
    to={to}
    className="block hover:bg-accent/40 transition-colors"
    aria-label={biStr(fr, shi)}
  >
    <Row
      icon={icon}
      fr={fr}
      shi={shi}
      trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
    />
  </Link>
);

const Section = ({
  value,
  icon: Icon,
  fr,
  shi,
  children,
}: {
  value: string;
  icon: LucideIcon;
  fr: string;
  shi: string;
  children: React.ReactNode;
}) => (
  <AccordionItem
    value={value}
    className="card-cultural border-l-2 border-l-secondary/60"
  >
    <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-accent/30 [&[data-state=open]]:bg-accent/20 pattern-comorian">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="rounded-lg gradient-gold p-2 shrink-0 shadow-sm">
          <Icon className="h-4 w-4 text-secondary-foreground" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold leading-tight truncate">{fr}</p>
          <p className="text-[11px] leading-tight text-muted-foreground opacity-80 truncate mt-0.5">
            {shi}
          </p>
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent className="pb-0">
      <div className="border-t border-border">{children}</div>
    </AccordionContent>
  </AccordionItem>
);

/* -------------------------------------------------------------------------- */
/*  Apparence : thème + taille + contraste + police                            */
/* -------------------------------------------------------------------------- */

type ThemePref = "auto" | "light" | "dark";
type TextSize = 0 | 1 | 2;

const A11Y_STORAGE = "vdl_accessibility_settings_v1";
const THEME_STORAGE = "vdl_theme";

const loadA11y = (): { textSize: TextSize; highContrast: boolean } => {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE);
    if (!raw) return { textSize: 1, highContrast: false };
    const p = JSON.parse(raw);
    const t = typeof p.textSize === "number" ? Math.min(2, Math.max(0, p.textSize)) : 1;
    return { textSize: t as TextSize, highContrast: !!p.highContrast };
  } catch {
    return { textSize: 1, highContrast: false };
  }
};

const saveA11y = (next: { textSize: TextSize; highContrast: boolean }) => {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE);
    const prev = raw ? JSON.parse(raw) : {};
    localStorage.setItem(A11Y_STORAGE, JSON.stringify({ ...prev, ...next }));
  } catch {}
  notifyA11yChanged();
};

const AppearanceContent = ({ fr }: { fr: boolean }) => {
  const { font, setFont } = useFont();
  const [theme, setTheme] = useState<ThemePref>(() => {
    try {
      return (localStorage.getItem(THEME_STORAGE) as ThemePref) || "auto";
    } catch {
      return "auto";
    }
  });
  const [a11y, setA11y] = useState(() => loadA11y());

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE, theme);
    } catch {}
    const w = window as unknown as { __vdlApplyTheme?: () => void };
    if (typeof w.__vdlApplyTheme === "function") w.__vdlApplyTheme();
  }, [theme]);

  useEffect(() => {
    saveA11y(a11y);
  }, [a11y]);

  const themeOpts: { key: ThemePref; icon: LucideIcon; fr: string; shi: string }[] = [
    { key: "auto", icon: Monitor, fr: "Automatique", shi: "Otomatiki" },
    { key: "light", icon: Sun, fr: "Clair", shi: "Mwangaza" },
    { key: "dark", icon: Moon, fr: "Sombre", shi: "Giza" },
  ];

  const sizes: { key: TextSize; fr: string; shi: string }[] = [
    { key: 0, fr: "Petit", shi: "Ndogo" },
    { key: 1, fr: "Normal", shi: "Kawaida" },
    { key: 2, fr: "Grand", shi: "Kubwa" },
  ];

  const contrasts: { key: boolean; fr: string; shi: string }[] = [
    { key: false, fr: "Normal", shi: "Kawaida" },
    { key: true, fr: "Élevé", shi: "Juu" },
  ];

  const fonts: { key: AppFont; name: string; family: string }[] = [
    { key: "defaut", name: "Inter", family: "'Inter', sans-serif" },
    { key: "ojuju", name: "Ojuju", family: "'Ojuju', sans-serif" },
    { key: "space-grotesk", name: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
    { key: "sora", name: "Sora", family: "'Sora', sans-serif" },
    { key: "outfit", name: "Outfit", family: "'Outfit', sans-serif" },
    { key: "dyslexique", name: "OpenDyslexic", family: "'OpenDyslexic', sans-serif" },
    { key: "hyperlegible", name: "Atkinson", family: "'Atkinson Hyperlegible', sans-serif" },
    { key: "lisible", name: "Lexie Readable", family: "'Lexie Readable', sans-serif" },
  ];

  return (
    <div className="p-4 space-y-5 transition-colors duration-200">
      {/* Thème */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Palette className="h-3.5 w-3.5" aria-hidden /> {fr ? "Thème" : "Mtindo"}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {themeOpts.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTheme(opt.key)}
                aria-pressed={active}
                className={`min-h-[64px] rounded-xl border-2 p-2 flex flex-col items-center justify-center gap-1 transition-colors duration-200 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="text-[11px] font-medium leading-tight text-center">
                  {fr ? opt.fr : opt.shi}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Taille de police */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Type className="h-3.5 w-3.5" aria-hidden />{" "}
          {fr ? "Taille de police" : "Ukubwa wa maandishi"}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => {
            const active = a11y.textSize === s.key;
            const scale = s.key === 0 ? "text-xs" : s.key === 1 ? "text-sm" : "text-base";
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setA11y((p) => ({ ...p, textSize: s.key }))}
                aria-pressed={active}
                className={`min-h-[56px] rounded-xl border-2 p-2 transition-colors duration-200 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <div className={`font-semibold ${scale}`}>Aa</div>
                <div className="text-[11px] mt-0.5">{fr ? s.fr : s.shi}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Contraste */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Contrast className="h-3.5 w-3.5" aria-hidden /> {fr ? "Contraste" : "Tofauti"}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {contrasts.map((c) => {
            const active = a11y.highContrast === c.key;
            return (
              <button
                key={String(c.key)}
                type="button"
                onClick={() => setA11y((p) => ({ ...p, highContrast: c.key }))}
                aria-pressed={active}
                className={`min-h-[48px] rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {fr ? c.fr : c.shi}
              </button>
            );
          })}
        </div>
      </section>

      {/* Police de texte */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />{" "}
          {fr ? "Police de texte" : "Fonti ya maandishi"}
        </h3>
        <div className="-mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1 pb-2 snap-x snap-mandatory">
            {fonts.map((opt) => {
              const active = font === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setFont(opt.key);
                    toast.success(
                      fr ? `Police ${opt.name} ✓` : `Fonti ${opt.name} ✓`,
                    );
                  }}
                  aria-pressed={active}
                  className={`flex-shrink-0 w-28 snap-start rounded-xl border-2 p-2.5 text-center transition-colors duration-200 ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div
                    className="text-xs font-semibold truncate text-foreground"
                    style={{ fontFamily: opt.family }}
                  >
                    {opt.name}
                  </div>
                  <div
                    className="text-base my-0.5 text-foreground"
                    style={{ fontFamily: opt.family }}
                  >
                    Aa Bb
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Screen                                                                     */
/* -------------------------------------------------------------------------- */

const SettingsScreen = () => {
  const { lang, tFr, tShi } = useI18n();
  const fr = lang === "fr";

  return (
    <div className="min-h-screen bg-background pb-24 transition-colors duration-200">
      <header
        className="sticky top-0 z-30 gradient-hero pattern-stars px-4 pb-6 text-primary-foreground border-b border-primary-foreground/15"
        style={{ paddingTop: "calc(var(--status-bar-height, env(safe-area-inset-top, 24px)) + 1rem)" }}
      >
        <div className="relative z-10">
          {bi(tFr.pages.settings.title, tShi.pages.settings.title, "title")}
        </div>
        <div className="divider-comorian mt-3" />
      </header>

      <div className="px-4 mt-5">
        <Accordion type="multiple" defaultValue={[]} className="space-y-3">
          <Section value="appearance" icon={Palette} fr="Apparence" shi="Mwonekano">
            <AppearanceContent fr={fr} />
          </Section>

          <Section
            value="legal"
            icon={FileBadge}
            fr="À propos & légal"
            shi="Kuhusu na sheria"
          >
            <div className="divide-y divide-border">
              <LinkRow to="/foreword" icon={BookOpen} fr="Avant-propos" shi="Utangulizi" />
              <LinkRow to="/licenses" icon={Scale} fr="Licences" shi="Leseni" />
              <LinkRow
                to="/terms"
                icon={FileText}
                fr="Conditions d'utilisation"
                shi="Mashariti ya matumizi"
              />
              <LinkRow
                to="/privacy"
                icon={ShieldCheck}
                fr="Confidentialité"
                shi="Faragha"
              />
            </div>
          </Section>
        </Accordion>

        {/* Partenaires */}
        <section className="card-cultural mt-3 border-l-2 border-l-accent/60 p-5 pattern-salouva">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4 text-center">
            {bi(credits.supportLabel.fr, credits.supportLabel.shi, "caption")}
          </div>
          {(() => {
            const others = credits.logos.filter((c) => !c.hidden);
            const wide = others.find((c) => c.wide);
            const small = others.filter((c) => !c.wide);
            const frame =
              "flex items-center justify-center overflow-hidden rounded-lg bg-card p-2 border border-border shadow-sm";
            return (
              <div className="flex flex-col items-center gap-4">
                {wide && (
                  <a
                    href={wide.href || "https://kiltir.org/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!confirm(biStr("Vous allez être redirigé vers un site externe. Continuer ?", "Utaenda kwenye tovuti nyingine. Endelea ?"))) {
                        e.preventDefault();
                      }
                    }}
                    className={`${frame} h-20 w-full max-w-xs cursor-pointer transition-transform hover:scale-[1.02]`}
                  >
                    <img src={wide.src} alt={wide.alt} loading="lazy" className="h-full w-full object-contain" />
                  </a>
                )}
                <div className="flex w-full items-center justify-center gap-3">
                  {small.map((cell) => (
                    <a
                      key={cell.alt}
                      href={cell.href || "https://kiltir.org/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!confirm(biStr("Vous allez être redirigé vers un site externe. Continuer ?", "Utaenda kwenye tovuti nyingine. Endelea ?"))) {
                          e.preventDefault();
                        }
                      }}
                      className={`${frame} h-20 w-20 cursor-pointer transition-transform hover:scale-[1.02]`}
                    >
                      <img src={cell.src} alt={cell.alt} loading="lazy" className="h-full w-full object-contain" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>

        <p className="text-center text-[11px] text-muted-foreground pt-5">
          {biStr("Version", "Toleo")} 1.0.0
        </p>
      </div>
    </div>
  );
};

export default SettingsScreen;
