import { useI18n } from "@/contexts/I18nContext";
import { useNavigate } from "react-router-dom";
import { Search, Music, Leaf, UtensilsCrossed, Mic2, Shirt, Users, BookOpen, X, ChevronRight, Video, Headphones, FileText, Image as ImageIcon, Images, HelpCircle } from "lucide-react";
import NetworkBadge from "@/components/NetworkBadge";
import { DecorativePattern } from "@/components/DecorativePattern";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useModules, useContents, useGallery, useQuizQuestions } from "@/hooks/useBackendData";
import { BilingualText, biStr } from "@/lib/bilingual";
import { matchesAllTokens, normalizeText } from "@/lib/utils";
import headerArt from "@/assets/logos/moon-voix.png";
import danceImage from "@/assets/module-dance.png";
import medicineImage from "@/assets/module-medicine.png";
import cookingImage from "@/assets/module-cooking.png";
import poetryImage from "@/assets/module-poetry.png";
import clothingImage from "@/assets/module-clothing.png";
import transmissionImage from "@/assets/module-transmission.png";

const BLOCKED_SLUGS = new Set(["grand-mariage"]);

const slugStyles: Record<string, { icon?: any; image?: string; gradient: string }> = {
  "danses-traditionnelles": { image: danceImage, gradient: "from-gold to-secondary" },
  "medecine-traditionnelle": { image: medicineImage, gradient: "from-cat-medicine-from to-cat-medicine-to" },
  "savoirs-culinaires": { image: cookingImage, gradient: "from-cat-cooking-from to-cat-cooking-to" },
  "poesie-chantee": { image: poetryImage, gradient: "from-deep-blue to-primary" },
  "habillement-traditionnel": { image: clothingImage, gradient: "from-cat-clothing-from to-cat-clothing-to" },
  "transmission-intergenerationnelle": { image: transmissionImage, gradient: "from-gold to-terracotta" },
  "galerie": { icon: Images, gradient: "from-secondary to-gold" },
};

const HomeScreen = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { data: modules, loading } = useModules();
  const { data: allContents } = useContents();
  const { data: galleryItems } = useGallery();
  const { data: quizItems } = useQuizQuestions();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();

  // Garde anti-modules supprimés (ex: grand-mariage)
  const safeModules = useMemo(
    () => modules.filter((m) => !BLOCKED_SLUGS.has(m.slug)),
    [modules]
  );

  // Slugs des modules dont au moins un contenu correspond à la recherche
  const matchingContentSlugs = useMemo(() => {
    const q = query.trim();
    if (!q) return new Set<string>();
    const set = new Set<string>();
    for (const c of allContents) {
      if (!c.module_slug || BLOCKED_SLUGS.has(c.module_slug)) continue;
      const fields = [c.title_fr, c.title_shk, c.description_fr, c.description_shk];
      if (matchesAllTokens(fields, q)) set.add(c.module_slug);
    }
    return set;
  }, [allContents, query]);

  const filteredModules = useMemo(() => {
    const q = query.trim();
    if (!q) return safeModules;
    return safeModules.filter((m) => {
      const fields = [m.name_fr, m.name_shk, m.description_fr, m.description_shk, m.slug];
      return matchesAllTokens(fields, q) || matchingContentSlugs.has(m.slug);
    });
  }, [safeModules, query, matchingContentSlugs]);

  // Suggestions (top-N) for the search dropdown — accent/case insensitive
  type Suggestion =
    | { kind: "module"; id: string; slug: string; label: string }
    | { kind: "content"; id: string; label: string; sub: string; type: string }
    | { kind: "gallery"; id: string; label: string; sub: string }
    | { kind: "quiz"; id: string; label: string; sub: string };

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim();
    if (q.length < 1) return [];
    const nq = normalizeText(q);

    const scored: Array<Suggestion & { score: number }> = [];

    const scoreFor = (text: string) => {
      const n = normalizeText(text);
      if (!n) return -1;
      if (n === nq) return 100;
      if (n.startsWith(nq)) return 80;
      if (n.includes(` ${nq}`)) return 60;
      if (n.includes(nq)) return 40;
      return matchesAllTokens([text], q) ? 20 : -1;
    };

    for (const m of safeModules) {
      const label = lang === "fr" ? m.name_fr : m.name_shk;
      const candidates = [m.name_fr, m.name_shk, m.description_fr ?? "", m.description_shk ?? ""];
      const best = Math.max(-1, ...candidates.map(scoreFor));
      if (best > 0) scored.push({ kind: "module", id: m.id, slug: m.slug, label, score: best });
    }

    for (const c of allContents) {
      if (c.module_slug && BLOCKED_SLUGS.has(c.module_slug)) continue;
      const label = lang === "fr" ? c.title_fr : c.title_shk;
      const candidates = [c.title_fr, c.title_shk, c.description_fr ?? "", c.description_shk ?? ""];
      const best = Math.max(-1, ...candidates.map(scoreFor));
      if (best > 0) {
        const mod = safeModules.find((m) => m.slug === c.module_slug);
        const sub = mod ? (lang === "fr" ? mod.name_fr : mod.name_shk) : c.type;
        scored.push({ kind: "content", id: c.id, label, sub, type: c.type, score: best });
      }
    }

    for (const g of galleryItems ?? []) {
      if (g.module_slug && BLOCKED_SLUGS.has(g.module_slug)) continue;
      const label = (lang === "fr" ? g.caption_fr : g.caption_shk) || g.caption_fr || g.caption_shk || "";
      if (!label) continue;
      const best = Math.max(-1, ...[g.caption_fr ?? "", g.caption_shk ?? ""].map(scoreFor));
      if (best > 0) {
        scored.push({
          kind: "gallery",
          id: g.id,
          label,
          sub: biStr("Galerie", "Picha"),
          score: best,
        });
      }
    }

    for (const qz of quizItems ?? []) {
      const label = lang === "fr" ? qz.question_fr : qz.question_shk;
      const candidates = [qz.question_fr, qz.question_shk];
      const best = Math.max(-1, ...candidates.map(scoreFor));
      if (best > 0) {
        scored.push({
          kind: "quiz",
          id: qz.id,
          label,
          sub: biStr("Quiz", "Maswali"),
          score: best,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map(({ score, ...rest }) => rest as Suggestion);
  }, [query, safeModules, allContents, galleryItems, quizItems, lang]);

  // Reset keyboard cursor when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, showSuggestions]);

  const pickSuggestion = (s: Suggestion) => {
    setShowSuggestions(false);
    setQuery("");
    if (s.kind === "module") {
      navigate(s.slug === "galerie" ? "/gallery" : `/category/${s.slug}`);
    } else if (s.kind === "content") {
      navigate(`/media/${s.id}`);
    } else if (s.kind === "gallery") {
      navigate("/gallery");
    } else {
      navigate("/quiz");
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setShowSuggestions(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        pickSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(suggestions.length - 1);
    }
  };

  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header (sticky) */}
<header
className="gradient-hero sticky top-0 z-30 px-4 pt-4 pb-6 border-b border-primary-foreground/15">
  {/* Motif zellij comorien en filigrane */}
  <DecorativePattern variant="zellij" intensity="subtle" colorVar="var(--gold)" />
  {/* Decorative glows (clipped to header) */}
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
    <div className="absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
  </div>

  <div className="relative z-10">
    {/* Top row: brand artwork + status */}
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="animate-moon-rise relative shrink-0">
        <div className="absolute inset-0 rounded-full bg-gold/25 blur-xl scale-125" />
        <img
          src={headerArt}
          alt={lang === "fr" ? "Voix de la Lune" : "Sauti ya Mwezi"}
          className="relative h-14 w-14 object-contain sm:h-16 sm:w-16 rounded-xl shadow-md border-0 opacity-100 border-amber-500 bg-[#2a4b2e]"
        />
      </div>
      <NetworkBadge />
    </div>

    {/* Search bar */}
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={onSearchKeyDown}
        placeholder={biStr("Rechercher un thème, un récit…", "Tafuta mada, hadithi…")}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions && suggestions.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 && showSuggestions ? optionId(activeIndex) : undefined
        }
        aria-label={biStr("Rechercher dans l'application", "Tafuta katika programu")}
        className="h-12 w-full rounded-2xl border border-background/30 bg-background/95 pl-11 pr-11 text-sm text-foreground shadow-2xl ring-1 ring-foreground/5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(""); setShowSuggestions(false); }}
          aria-label={biStr("Effacer la recherche", "Futa utafutaji")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          <ul id={listboxId} role="listbox" aria-label={biStr("Suggestions", "Mapendekezo")}>
            {suggestions.map((s, i) => {
              const Icon =
                s.kind === "module"
                  ? (slugStyles[s.slug]?.icon ?? BookOpen)
                  : s.kind === "gallery"
                  ? ImageIcon
                  : s.kind === "quiz"
                  ? HelpCircle
                  : s.type === "video"
                  ? Video
                  : s.type === "audio"
                  ? Headphones
                  : s.type === "image"
                  ? ImageIcon
                  : FileText;
              const isActive = i === activeIndex;
              return (
                <li key={`${s.kind}-${s.id}-${i}`}>
                  <button
                    id={optionId(i)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pickSuggestion(s)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition focus:outline-none ${
                      isActive ? "bg-accent" : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-popover-foreground">{s.label}</p>
                      <p className="break-words text-xs text-muted-foreground">
                        {s.kind === "module" ? biStr("Thème", "Mada") : s.sub}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  </div>
</header>
      <div>
      {/* Banner */}
      <div className="mt-5 px-3 sm:mt-6 sm:px-4">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/5 p-4 shadow-md sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/15 blur-2xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-gold via-secondary to-terracotta" />
          <div className="relative flex items-start gap-2.5 pl-2 sm:gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-secondary sm:h-9 sm:w-9">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <BilingualText
                as="p"
                fr="Découvrez l'héritage culturel des femmes comoriennes"
                shi="Gunduani urithi wa kitamaduni wa wanawake wa Kikomori"
                variant="body"
                className="font-display text-[13px] leading-snug text-foreground hyphens-auto [text-wrap:balance] sm:text-[15px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offline branch supprimé : useContents() filtre déjà hors ligne */}

      {/* Category Grid (online) */}
      {(
      <div ref={sectionRef} className="mt-8 px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-cultural h-32 animate-pulse" />
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {query
              ? lang === "fr" ? "Aucun résultat." : "Hakuna matokeo."
              : lang === "fr" ? "Aucun module disponible." : "Hakuna moduli."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredModules.map((mod, i) => {
              const style = slugStyles[mod.slug] ?? { icon: BookOpen, gradient: "from-primary to-secondary" };
              const Icon = style.icon ?? BookOpen;
              const nameFr = mod.name_fr;
              const nameShk = mod.name_shk;
              const descFr = mod.description_fr;
              const descShk = mod.description_shk;
              return (
                <button
                  key={mod.id}
                  onClick={() => navigate(mod.slug === "galerie" ? "/gallery" : `/category/${mod.slug}`)}

                  aria-label={lang === "fr" ? `Ouvrir ${nameFr}` : `Fungua ${nameShk}`}
                  className="card-cultural card-cultural-interactive group flex flex-col p-4 text-left animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {style.image ? (
                    <div className="mb-3 h-12 w-12 overflow-hidden rounded-xl shadow-md ring-1 ring-background/40 transition-transform duration-300 group-hover:scale-110">
                      <img src={style.image} alt="" className="h-full w-full object-cover" loading="lazy" width={48} height={48} />
                    </div>
                  ) : (
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${style.gradient} shadow-md ring-1 ring-background/40 transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2} />
                    </div>
                  )}
                  <BilingualText
                    as="h3"
                    fr={nameFr}
                    shi={nameShk}
                    variant="label"
                    className="font-display text-foreground"
                  />
                  {(descFr || descShk) && (
                    <BilingualText
                      as="p"
                      fr={descFr}
                      shi={descShk}
                      variant="caption"
                      className="mt-2 line-clamp-2 text-muted-foreground"
                    />
                  )}
                  <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:right-2.5 group-hover:text-primary" />
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}
      </div>
    </div>
  );
};

export default HomeScreen;
