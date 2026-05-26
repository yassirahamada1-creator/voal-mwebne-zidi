import { useI18n } from "@/contexts/I18nContext";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { useModules } from "@/hooks/useBackendData";
import { bi, biStr } from "@/lib/bilingual";

const slugEmojis: Record<string, string> = {
  "danses-traditionnelles": "💃",
  "medecine-traditionnelle": "🌿",
  "savoirs-culinaires": "🍲",
  "poesie-chantee": "🎶",
  "habillement-traditionnel": "👗",
  "transmission-intergenerationnelle": "👵",
};

const PedagogicalScreen = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { data: modules, loading } = useModules();
  void t;
  void lang;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 relative overflow-hidden gradient-hero pattern-stars px-4 pt-5 pb-6 text-primary-foreground border-b border-primary-foreground/15">
        <div className="relative z-10">
          {bi("Espace Pédagogique", "Nafasi ya Kufundisha", "title")}
        </div>
        <div className="divider-comorian mt-3" />
      </header>

      <div className="px-4 mt-4 space-y-6">
        {/* Quizzes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-lg font-semibold text-foreground">{bi("Quiz Interactifs", "Maswali")}</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card-cultural h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {modules.map((mod, i) => {
                const name = bi(mod.name_fr, mod.name_shk);
                return (
                  <button
                    key={mod.id}
                    onClick={() => navigate(`/quiz?moduleSlug=${encodeURIComponent(mod.slug)}`)}
                    aria-label={biStr(`Quiz ${mod.name_fr}`, `Maswali ${mod.name_shk}`)}
                    className="card-cultural card-cultural-interactive flex flex-col items-center gap-2 p-4 animate-fade-up min-h-[44px]"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span className="text-2xl" aria-hidden="true">{slugEmojis[mod.slug] ?? "📚"}</span>
                    <span className="text-xs font-semibold text-foreground text-center leading-tight">{name}</span>
                    <span className="text-[10px] text-secondary font-semibold text-center leading-tight">
                      <span className="block whitespace-nowrap">Commencer →</span>
                      <span className="block whitespace-nowrap opacity-80">Anza →</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>


      </div>
    </div>
  );
};

export default PedagogicalScreen;

