import { useI18n } from "@/contexts/I18nContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Trash2,
  Video,
  Headphones,
  FileText,
  Image as ImageIcon,
  Search,
  X,
  
} from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { bi, biStr } from "@/lib/bilingual";
import { matchesAllTokens } from "@/lib/utils";
import SearchSuggestions from "@/components/SearchSuggestions";
import OfflineLock from "@/components/OfflineLock";
import OfflineImage from "@/components/OfflineImage";
import { getFallbackThumbnail } from "@/lib/contentThumbnails";

const typeIcons = {
  video: Video,
  audio: Headphones,
  text: FileText,
  image: ImageIcon,
  pdf: FileText,
};

const FavoritesScreen = () => {
  const { lang } = useI18n();
  const { favorites, removeFavorite } = useFavorites();
  const [favQuery, setFavQuery] = useState("");
  const [showFavSuggest, setShowFavSuggest] = useState(false);
  const navigate = useNavigate();

  const filteredFavorites = useMemo(() => {
    const list = favorites.filter((f) =>
      matchesAllTokens([f.titleFr, f.titleShi, f.type], favQuery),
    );
    // Tri par défaut : les plus récents en premier.
    return [...list].sort((a, b) => b.addedAt - a.addedAt);
  }, [favorites, favQuery]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <h1 className="font-display text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {biStr("Mes favoris", "Pendwa zangu")}
            </h1>
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
              {favorites.length}
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={favQuery}
            onChange={(e) => setFavQuery(e.target.value)}
            onFocus={() => setShowFavSuggest(true)}
            onBlur={() => setTimeout(() => setShowFavSuggest(false), 150)}
            placeholder={biStr("Rechercher un favori…", "Tafuta pendwa…")}
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          {favQuery && (
            <button
              type="button"
              onClick={() => setFavQuery("")}
              aria-label={biStr("Effacer", "Futa")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <SearchSuggestions
            query={favQuery}
            open={showFavSuggest}
            emptyLabel={lang === "fr" ? "Aucun favori" : "Hakuna pendwa"}
            items={favorites.map((f) => {
              const Icon = (typeIcons as any)[f.type] || FileText;
              return {
                id: f.id,
                label: lang === "fr" ? f.titleFr : f.titleShi,
                sub: f.type,
                searchable: [f.titleFr, f.titleShi],
                icon: <Icon className="h-4 w-4 text-secondary" />,
                onPick: () => {
                  setShowFavSuggest(false);
                  setFavQuery("");
                  navigate(`/media/${f.id}`);
                },
              };
            })}
          />
        </div>



        {favorites.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-10 w-10" />}
            title={biStr("Aucun favori", "Hakuna pendwa")}
            hint={biStr(
              "Touchez le cœur sur un contenu pour l'ajouter ici.",
              "Bonyeza moyo kwenye yaliyomo kuongeza."
            )}
          />
        ) : filteredFavorites.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {biStr("Aucun résultat.", "Hakuna matokeo.")}
          </p>
        ) : (
          <ul className="space-y-2.5 list-none p-0">
            {filteredFavorites.map((f) => {
              const Icon = typeIcons[f.type] || FileText;
              const title = lang === "fr" ? f.titleFr : f.titleShi;
              const typeLabel = biStr(
                f.type === "video"
                  ? "Vidéo"
                  : f.type === "audio"
                    ? "Audio"
                    : f.type === "text"
                      ? "Récit"
                      : f.type === "image"
                        ? "Image"
                        : "PDF",
                f.type === "video"
                  ? "Vidio"
                  : f.type === "audio"
                    ? "Sauti"
                    : f.type === "text"
                      ? "Hadithi"
                      : f.type === "image"
                        ? "Picha"
                        : "PDF",
              );
              return (
                <OfflineLock key={f.id} urls={[f.mediaUrl, f.thumbnailUrl]}>
                <li
                  className="card-cultural card-cultural-interactive group flex items-center gap-3 p-3"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/media/${f.id}`)}
                    aria-label={title}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left active:scale-[0.99] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-lg cursor-pointer"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/10 overflow-hidden">
                      {f.thumbnailUrl ? (
                        <OfflineImage
                          src={f.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={getFallbackThumbnail(f.type)}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {typeLabel}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeFavorite(f.id);
                      toast.success(biStr("Retiré des favoris", "Imeondolewa"));
                    }}
                    aria-label={biStr("Retirer des favoris", "Ondoa kwenye pendwa")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
                </OfflineLock>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-muted-foreground/40 mb-3">{icon}</div>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground max-w-xs">{hint}</p>
    <Link
      to="/home"
      className="mt-4 rounded-full bg-secondary px-5 py-2 text-xs font-semibold text-secondary-foreground"
    >
      {bi("Accueil", "Nyumbani")}
    </Link>
  </div>
);

export default FavoritesScreen;
