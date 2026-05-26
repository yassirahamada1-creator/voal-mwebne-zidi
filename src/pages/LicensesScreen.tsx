import { Link } from "react-router-dom";
import { ChevronLeft, ExternalLink, Package, Heart } from "lucide-react";
import { bi, biStr } from "@/lib/bilingual";
import { openSourceLibraries } from "@/config/legal";

const licenseColor = (license: string) => {
  switch (license) {
    case "MIT":
      return "bg-success/10 text-success border-success/20";
    case "Apache-2.0":
      return "bg-info/10 text-info border-info/20";
    case "ISC":
      return "bg-accent/10 text-accent border-accent/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const LicensesScreen = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 pt-6 pb-2 flex items-center gap-3">
        <Link
          to="/settings"
          aria-label={biStr("Retour", "Rudi")}
          className="p-1 -ml-1 rounded-md hover:bg-accent/40"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        {bi("Licences", "Leseni", "title")}
      </header>

      <div className="px-4 mt-4 space-y-5">
        {/* Hero card */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/15 via-card to-primary/10 p-5 shadow-sm">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-secondary/20 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-3">
            <div className="rounded-xl bg-secondary/15 p-2.5 shrink-0">
              <Heart className="h-5 w-5 text-secondary" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold leading-snug">
                Construit avec amour, propulsé par l'open source.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Cette application repose sur des bibliothèques libres maintenues par une communauté généreuse. Merci à toutes celles et ceux qui les rendent possibles.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground opacity-80 pt-1">
                Programu hii imejengwa kwa maktaba huria. Tunawashukuru waandishi na wachangiaji wao wote.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-cultural p-4">
            <div className="text-2xl font-bold tracking-tight">{openSourceLibraries.length}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
              Bibliothèques
            </div>
          </div>
          <div className="card-cultural p-4">
            <div className="text-2xl font-bold tracking-tight">
              {new Set(openSourceLibraries.map((l) => l.license)).size}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
              Licences
            </div>
          </div>
        </div>

        {/* Library cards */}
        <div className="grid grid-cols-1 gap-2.5">
          {openSourceLibraries.map((lib) => (
            <a
              key={lib.name}
              href={lib.url}
              target="_blank"
              rel="noreferrer noopener"
              className="card-cultural card-cultural-interactive group flex items-center gap-3 p-3.5"
            >
              <div className="rounded-lg bg-muted/60 p-2 shrink-0 group-hover:bg-secondary/15 transition-colors">
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate">{lib.name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <span
                  className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider rounded-md px-1.5 py-0.5 border ${licenseColor(
                    lib.license,
                  )}`}
                >
                  {lib.license}
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          {biStr(
            "Cliquez sur une bibliothèque pour consulter sa licence complète.",
            "Bofya maktaba kuona leseni kamili.",
          )}
        </p>
      </div>
    </div>
  );
};

export default LicensesScreen;
