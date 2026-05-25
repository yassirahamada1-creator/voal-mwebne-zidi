import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOfflineAvailability } from "@/hooks/useOfflineAvailability";
import { useI18n } from "@/contexts/I18nContext";

interface Props { className?: string; }

/**
 * Badge bilingue de statut réseau. Taille/police constantes, sans icône wifi.
 * Affiche un sous-libellé "Synchronisation…" pendant un sync actif.
 */
const NetworkBadge = ({ className = "shadow-md" }: Props) => {
  const { lang } = useI18n();
  const { status, progress } = useOfflineSync();
  const { online } = useOfflineAvailability();
  const syncing = status === "syncing";

  const label = online
    ? lang === "fr" ? "En ligne" : "Mtandaoni"
    : lang === "fr" ? "Hors ligne" : "Bila neti";

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold leading-none backdrop-blur transition ${
        online
          ? "border-success/40 bg-success/20 text-success-foreground"
          : "border-destructive/40 bg-destructive/25 text-destructive-foreground"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? "bg-success" : "bg-destructive"
        } animate-pulse`}
      />
      {label}
      {syncing && online && (
        <span className="opacity-90 tabular-nums">
          · {Math.round(progress * 100)}%
        </span>
      )}
    </span>
  );
};

export default NetworkBadge;
