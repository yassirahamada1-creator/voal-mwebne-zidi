import { Download } from "lucide-react";
import { ReactNode } from "react";
import { useOfflineAvailability } from "@/hooks/useOfflineAvailability";
import { useI18n } from "@/contexts/I18nContext";

interface Props {
  /** URLs à vérifier (média + miniature). */
  urls: (string | null | undefined)[];
  children: ReactNode;
  /** Classes appliquées au wrapper. */
  className?: string;
  /** Affiche l'icône 📥 par-dessus si verrouillé. Default true. */
  showBadge?: boolean;
  /**
   * Si true, le contenu est flouté tant qu'il n'est PAS en cache local,
   * même si l'utilisateur est en ligne (cas des vidéos non téléchargées).
   * Si false (défaut), seul l'état hors-ligne verrouille.
   */
  requireCached?: boolean;
}

/**
 * Wrapper visuel : applique flou + désactive les interactions sur les contenus
 * NON disponibles hors ligne (mode offline + URL absente du cache), ou — si
 * `requireCached` est activé — tant que le contenu n'a pas été téléchargé.
 */
const OfflineLock = ({ urls, children, className = "", showBadge = true, requireCached = false }: Props) => {
  const { lang } = useI18n();
  const { online, isAvailable } = useOfflineAvailability();
  const list = urls.filter(Boolean) as string[];
  const allCached = list.length === 0 ? true : list.every((u) => isAvailable(u));
  const locked = list.length > 0 && !allCached && (requireCached || !online);

  if (!locked) return <>{children}</>;

  const hint = lang === "fr"
    ? "Indisponible hors ligne — à télécharger"
    : "Haipatikani bila mtandao — pakua";

  return (
    <div
      className={`relative ${className}`}
      aria-disabled="true"
      title={hint}
    >
      <div
        className="pointer-events-none select-none blur-[2px] opacity-60 transition-all"
        aria-hidden="true"
      >
        {children}
      </div>
      {showBadge && (
        <span
          aria-label={hint}
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/85 text-background shadow-md ring-1 ring-background/40 backdrop-blur"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
      {/* Capture les clics pour empêcher la navigation. */}
      <span
        className="absolute inset-0 z-20 cursor-not-allowed"
        onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
        aria-hidden="true"
      />
    </div>
  );
};

export default OfflineLock;
