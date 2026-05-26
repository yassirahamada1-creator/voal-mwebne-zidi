import { Heart, Download, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useFavorites, FavoriteItem } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { useContentDownload } from "@/hooks/useContentDownload";
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


interface Props {
  item: Omit<FavoriteItem, "addedAt"> & { thumbnailUrl?: string };
  /** Affiche le bouton de téléchargement individuel quand un média est disponible. */
  showDownload?: boolean;
  /** Compact icon-only buttons (used in cards). Default: true */
  compact?: boolean;
  /** URLs additionnelles à télécharger en même temps (ex: récit, témoignage, photos liées). */
  extraUrls?: (string | null | undefined)[];
}

/**
 * Actions sur un contenu : favori + téléchargement hors-ligne (par contenu).
 * Le téléchargement complet de tout reste possible depuis l'écran Hors ligne.
 */
export default function ContentActions({ item, showDownload = false, compact = true, extraUrls = [] }: Props) {
  const { lang } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(item.id);

  const urls = [item.mediaUrl, item.thumbnailUrl, ...extraUrls].filter(Boolean) as string[];
  const enableDownload = showDownload && urls.length > 0;
  const { cached, downloading, progress, download, remove } = useContentDownload(urls, {
    id: item.id,
    titleFr: item.titleFr,
    titleShi: item.titleShi,
    thumbnailUrl: item.thumbnailUrl ?? (item.type === "image" ? item.mediaUrl : undefined),
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const onDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (cached) {
      setConfirmOpen(true);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error(lang === "fr" ? "Aucune connexion réseau" : "Hakuna mtandao");
      return;
    }
    await download();
    toast.success(
      lang === "fr"
        ? "Téléchargement ajouté à la file"
        : "Upakuaji umeongezwa kwenye foleni",
    );
  };

  const confirmRemove = async () => {
    await remove();
    setConfirmOpen(false);
    toast.success(lang === "fr" ? "Téléchargement supprimé" : "Upakuaji umefutwa");
  };

  const removeDialog = (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {lang === "fr" ? "Supprimer ce téléchargement ?" : "Futa upakuaji huu?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {lang === "fr"
              ? "Le contenu ne sera plus disponible hors ligne. Vous pourrez le retélécharger plus tard."
              : "Maudhui hayatapatikana bila mtandao. Unaweza kuyapakua tena baadaye."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {lang === "fr" ? "Annuler" : "Ghairi"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); void confirmRemove(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {lang === "fr" ? "Supprimer" : "Futa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );


  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {enableDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            aria-label={
              cached
                ? lang === "fr" ? "Supprimer du téléchargement" : "Futa upakuaji"
                : lang === "fr" ? "Télécharger hors ligne" : "Pakua bila mtandao"
            }
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-60 ${
              cached
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {downloading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : cached
              ? <CheckCircle2 className="h-4 w-4" />
              : <Download className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={onFav}
          aria-label={lang === "fr" ? "Favori" : "Pendwa"}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 ${
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
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
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
      {enableDownload && (
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
            cached
              ? "bg-success/15 text-success border-2 border-success/40"
              : "bg-card border-2 border-border text-foreground"
          }`}
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {lang === "fr" ? "Téléchargement…" : "Inapakua…"}
              <span className="tabular-nums opacity-70">
                {Math.round(progress * 100)}%
              </span>
            </>
          ) : cached ? (
            <>
              <Trash2 className="h-4 w-4" />
              {lang === "fr" ? "Hors ligne — Supprimer" : "Bila mtandao — Futa"}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {lang === "fr" ? "Télécharger" : "Pakua"}
            </>
          )}
        </button>
      )}
    </div>
  );
}
