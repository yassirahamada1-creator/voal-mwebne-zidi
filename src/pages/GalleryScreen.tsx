/**
 * GalleryScreen — page principale du module "Galerie".
 * Affiche la liste des sujets (type 'gallery_subject') du module 'galerie'.
 * Vignette = première photo (type='image' avec parent_id=sujet.id).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Images, ChevronRight, Search, X } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { useContents } from "@/hooks/useBackendData";
import { BilingualText, biStr } from "@/lib/bilingual";
import OfflineImage from "@/components/OfflineImage";

const GalleryScreen = () => {
  const navigate = useNavigate();
  const { data: contents, loading } = useContents("galerie");

  const [query, setQuery] = useState("");

  const subjects = useMemo(() => {
    const subs = contents.filter((c) => c.type === "gallery_subject");
    const photosBySubject = new Map<string, typeof contents>();
    for (const c of contents) {
      if (c.type !== "image" || !c.parent_id) continue;
      const arr = photosBySubject.get(c.parent_id) ?? [];
      arr.push(c);
      photosBySubject.set(c.parent_id, arr);
    }
    return subs.map((s) => {
      const photos = photosBySubject.get(s.id) ?? [];
      const cover = photos[0];
      return {
        id: s.id,
        titleFr: s.title_fr,
        titleShk: s.title_shk,
        cover: cover?.thumbnail_url || cover?.media_url || null,
        count: photos.length,
      };
    });
  }, [contents]);

  const visibleSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = subjects;
    if (q) {
      list = list.filter(
        (s) =>
          s.titleFr.toLowerCase().includes(q) ||
          s.titleShk.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => a.titleFr.localeCompare(b.titleFr, "fr"));
    return list;
  }, [subjects, query]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background">
      <ScreenHeader
        icon={Images}
        labelFr="Galerie"
        labelShi="Galeri"
        titleFr="Photos d'archive du CNDRS"
        titleShi="Picha za hazina za CNDRS"
      />

      <div className="px-4 mt-2 pb-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={biStr("Rechercher un sujet…", "Tafuta mada…")}
            aria-label={biStr("Rechercher dans la galerie", "Tafuta katika galeri")}
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={biStr("Effacer la recherche", "Futa utafutaji")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      </div>

      <div className="px-4 mt-2 space-y-3">

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-cultural h-40 animate-pulse" />
            ))}
          </div>
        ) : visibleSubjects.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {query.trim()
              ? biStr("Aucun résultat.", "Hakuna matokeo.")
              : biStr("Aucun sujet pour le moment.", "Hakuna mada bado.")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {visibleSubjects.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate(`/gallery/${s.id}`)}
                aria-label={biStr(`Ouvrir ${s.titleFr}`, `Fungua ${s.titleShk}`)}
                className="card-cultural card-cultural-interactive group flex flex-col text-left animate-fade-up overflow-hidden p-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  {s.cover ? (
                    <OfflineImage
                      src={s.cover}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Images className="h-10 w-10 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <BilingualText
                    as="h3"
                    fr={s.titleFr}
                    shi={s.titleShk}
                    variant="label"
                    className="font-display text-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.count} {biStr(s.count > 1 ? "photos" : "photo", "picha")}
                  </p>
                </div>
                <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-primary-foreground/80 drop-shadow" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryScreen;
