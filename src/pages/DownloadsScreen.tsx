import { Download } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { BilingualText } from "@/lib/bilingual";
import DownloadQueue from "@/components/DownloadQueue";
import { useDownloadQueue } from "@/hooks/useDownloadQueue";

const DownloadsScreen = () => {
  const { lang } = useI18n();
  const jobs = useDownloadQueue();
  void lang;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header
        className="sticky top-0 z-30 gradient-hero pattern-stars relative overflow-hidden px-4 pb-3 border-b border-primary-foreground/15"
        style={{ paddingTop: "calc(var(--status-bar-height, env(safe-area-inset-top, 24px)) + 0.75rem)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/15 ring-1 ring-background/25 backdrop-blur">
            <Download className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <BilingualText
              as="h1"
              fr="Téléchargements"
              shi="Upakuaji"
              variant="caption"
              className="font-display text-base font-bold leading-tight text-primary-foreground"
            />
            <BilingualText
              as="p"
              fr="File des téléchargements en cours"
              shi="Foleni ya upakuaji unaoendelea"
              variant="caption"
              className="text-[11px] leading-tight text-primary-foreground/80"
            />
          </div>
        </div>
      </header>

      <div className="mt-4 px-4">

        {jobs.length === 0 ? (
          <section className="card-cultural border-dashed bg-card/50 p-8 text-center">
            <Download className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {lang === "fr" ? "Aucun téléchargement en cours" : "Hakuna upakuaji unaoendelea"}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {lang === "fr"
                ? "Lancez un téléchargement depuis la fiche d'un contenu pour le suivre ici."
                : "Anza upakuaji kutoka kwa ukurasa wa maudhui ili kuufuata hapa."}
            </p>
          </section>
        ) : (
          <DownloadQueue />
        )}
      </div>
    </div>
  );
};

export default DownloadsScreen;
