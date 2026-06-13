import { Heart } from "lucide-react";
import { useFavorites, FavoriteItem } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

interface Props {
  item: Omit<FavoriteItem, "addedAt"> & { thumbnailUrl?: string };
  /** @deprecated Conservé pour compat — plus aucun téléchargement manuel. */
  showDownload?: boolean;
  /** Compact icon-only buttons (used in cards). Default: true */
  compact?: boolean;
  /** @deprecated Conservé pour compat. */
  extraUrls?: (string | null | undefined)[];
}

/**
 * Actions sur un contenu : favori uniquement.
 *
 * Les téléchargements manuels ont été retirés : photos, audios et textes
 * sont embarqués dans le bundle de l'application et disponibles hors ligne
 * dès l'installation. Les vidéos restent en streaming (connexion requise).
 */
export default function ContentActions({ item, compact = true }: Props) {
  const { lang } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(item.id);

  const onFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const added = toggleFavorite(item);
    toast.success(
      added
        ? lang === "fr" ? "Ajouté aux favoris" : "Imeongezwa kwa pendwa"
        : lang === "fr" ? "Retiré des favoris" : "Imeondolewa kwa pendwa",
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onFav}
          aria-label={lang === "fr" ? "Favori" : "Pendwa"}
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            fav
              ? "bg-terracotta/15 text-terracotta"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={onFav}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold ${
          fav
            ? "bg-terracotta/15 text-terracotta border-2 border-terracotta/40"
            : "bg-card border-2 border-border text-foreground"
        }`}
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        {fav
          ? lang === "fr" ? "Favori" : "Pendwa"
          : lang === "fr" ? "Ajouter" : "Ongeza"}
      </button>
    </div>
  );
}
