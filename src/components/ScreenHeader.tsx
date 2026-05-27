/**
 * ScreenHeader — en-tête harmonisé pour les écrans (Récit, Témoignage,
 * Galerie, Quiz, etc.).
 */
import { useEffect } from "react";
import { type LucideIcon } from "lucide-react";
import { biStr } from "@/lib/bilingual";
import { DecorativePattern } from "@/components/DecorativePattern";
import { setStatusBarStyle } from "@/lib/statusBar";


export type ScreenHeaderProps = {
  icon: LucideIcon;
  labelFr: string;
  labelShi: string;
  titleFr?: string;
  titleShi?: string;
  posterUrl?: string | null;
  /** @deprecated Le retour se fait via le geste swipe global. */
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
};

const ScreenHeader = ({
  icon: Icon,
  labelFr,
  labelShi,
  titleFr,
  titleShi,
  posterUrl,
  right,
  className = "",
}: ScreenHeaderProps) => {
  // Le fond du header est sombre/coloré → icônes blanches de la status bar.
  useEffect(() => {
    setStatusBarStyle("light");
    return () => setStatusBarStyle("auto");
  }, []);
  return (
    <header
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        paddingTop: "var(--status-bar-height, env(safe-area-inset-top, 24px))",
        minHeight: "calc(var(--status-bar-height, env(safe-area-inset-top, 24px)) + 8rem)",
      }}
    >
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-secondary/40" />
      <DecorativePattern variant="zellij" intensity="subtle" colorVar="var(--gold)" />
      {/* Filet doré décoratif en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-70" />

      {/* Slot droit éventuel (ex. compteur de questions) */}
      {right && (
        <div className="absolute top-0 right-0 z-10 p-3 sm:p-4"
          style={{ paddingTop: "calc(var(--status-bar-height, env(safe-area-inset-top, 24px)) + 0.75rem)" }}
        >
          <div className="text-primary-foreground/90 text-sm font-semibold">
            {right}
          </div>
        </div>
      )}

      {/* Centre : titre du module uniquement */}
      <div className="relative h-32 sm:h-36 w-full flex items-center justify-center px-14 text-center">
        <h1
          className="font-display text-lg sm:text-2xl font-bold text-primary-foreground leading-tight line-clamp-2"
          aria-label={biStr(titleFr ?? labelFr, titleShi ?? labelShi)}
        >
          {biStr(titleFr ?? labelFr, titleShi ?? labelShi)}
        </h1>
      </div>
    </header>
  );
};

export default ScreenHeader;
