import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOfflineAvailability } from "@/hooks/useOfflineAvailability";
import { useI18n } from "@/contexts/I18nContext";

interface Props {
  className?: string;
}

const NetworkBadge = ({ className = "shadow-md" }: Props) => {
  const { lang } = useI18n();
  const { online } = useOfflineAvailability();

  const label = online ? (lang === "fr" ? "En ligne" : "Mtandaoni") : lang === "fr" ? "Hors ligne" : "Bila neti";

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
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success" : "bg-destructive"} animate-pulse`} />
      {label}
    </span>
  );
};

export default NetworkBadge;
