import { useI18n } from "@/contexts/I18nContext";
import {
  Accessibility,
  ChevronRight,
  FileText,
  ShieldCheck,
  Scale,
  Palette,
  FileBadge,
  BookOpen,
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
      <div className="border-t border-border divide-y divide-border">
        {children}
      </div>
    </AccordionContent>
  </AccordionItem>
);

/* -------------------------------------------------------------------------- */
/*  Screen                                                                     */
/* -------------------------------------------------------------------------- */

const SettingsScreen = () => {
  useI18n();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden gradient-hero pattern-stars px-4 pt-7 pb-6 text-primary-foreground border-b border-primary-foreground/15">
        <div className="relative z-10">
          {bi("Paramètres", "Mpangilio", "title")}
        </div>
        <div className="divider-comorian mt-3" />
      </header>

      <div className="px-4 mt-5">
        <Accordion
          type="multiple"
          defaultValue={[]}
          className="space-y-3"
        >
          <Section value="appearance" icon={Palette} fr="Apparence" shi="Mwonekano">
            <LinkRow
              to="/accessibility"
              icon={Accessibility}
              fr="Accessibilité"
              shi="Ufikivu"
            />
          </Section>


          <Section
            value="legal"
            icon={FileBadge}
            fr="À propos & légal"
            shi="Kuhusu na sheria"
          >
            <LinkRow
              to="/foreword"
              icon={BookOpen}
              fr="Avant-propos"
              shi="Utangulizi"
            />
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
          </Section>

        </Accordion>

        {/* Partenaires — toujours visible, non repliable */}
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
