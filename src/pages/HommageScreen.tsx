import { useEffect, useState } from "react";
import {
  Flower2,
  GraduationCap,
  Briefcase,
  Sparkles,
  Users,
  MessageCircle,
  Heart,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { idbGet } from "@/lib/offlineStore";
import naichaPhoto from "@/assets/naicha.jpeg";

type HommageData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  photo_url: string | null;
  photo_caption: string;
  display_name: string;
  birth_date: string;
  parcours: string;
  engagement: string;
  talents: string;
  liens: string;
  derniers_mots: string;
  derniers_mots_note: string;
  famille_retient: string;
  hommage_global: string;
  invocation_ar: string;
  invocation_translit: string;
  invocation_fr: string;
  footer_note: string;
  is_visible?: boolean;
};

const Paragraphs = ({ text }: { text: string }) => (
  <>
    {text
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((p, i) => (
        <p key={i} className={i > 0 ? "mt-2" : ""}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
  </>
);

const InfoBlock = ({
  icon: Icon,
  label,
  children,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-2xl p-4 sm:p-5 border ${
      highlight
        ? "bg-[#f3effa] border-[#c9b8e0] dark:bg-[#2a2340] dark:border-[#5a4a80]"
        : "bg-white/70 border-[#e8e0d4] dark:bg-[#1e2535] dark:border-[#3a4050]"
    }`}
  >
    <div className="flex items-center gap-2.5 mb-2.5">
      <div
        className={`rounded-full p-1.5 ${
          highlight
            ? "bg-[#d4c5e8] text-[#6b5290] dark:bg-[#4a3a68] dark:text-[#c9b8e0]"
            : "bg-[#f0ebe0] text-[#9a8a6a] dark:bg-[#2a3345] dark:text-[#b8a888]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7a6a8a] dark:text-[#b8a8d0]">
        {label}
      </h3>
    </div>
    <div className="text-[15px] leading-relaxed text-[#4a4050] dark:text-[#c8c0d8]">
      {children}
    </div>
  </div>
);

const Divider = () => (
  <div className="flex items-center justify-center gap-3 my-6" aria-hidden="true">
    <span className="h-px w-12 sm:w-16 bg-[#d4c5a0]" />
    <span className="text-[#c9a84c] text-xs">◆</span>
    <span className="h-px w-12 sm:w-16 bg-[#d4c5a0]" />
  </div>
);

const HommageScreen = () => {
  const [data, setData] = useState<HommageData | null>(null);

  useEffect(() => {
    let active = true;

    idbGet<{ k: string; v: HommageData }>("meta", "hommage").then((row) => {
      if (active && row?.v) setData((prev) => prev ?? row.v);
    });

    const fetchData = () =>
      supabase
        .from("hommage_content")
        .select("*")
        .eq("slug" as never, "main")
        .maybeSingle()
        .then(({ data: d }) => {
          if (active && d) setData(d as unknown as HommageData);
        });

    fetchData();

    const channel = supabase
      .channel("hommage_content_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hommage_content" },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const FALLBACK = {
    parcours:
      "Après avoir obtenu son baccalauréat, Naicha a poursuivi ses études supérieures à l'ISPC — l'Institut Supérieur Polytechnique des Comores — où elle a suivi une formation de deux ans dans le domaine du tourisme, de 2020 à 2022. Elle s'y est distinguée par sa curiosité et sa soif d'apprendre.",
    engagement:
      "Depuis 2024, Naicha exerçait en tant qu'assistante en ophtalmologie, un métier qu'elle assumait avec dévouement et humanité. Auparavant, elle avait effectué un stage à la Mairie de Foumbouni au service des archives, en janvier et février 2023, y laissant le souvenir d'une jeune femme sérieuse et appliquée.",
    talents:
      "Au-delà de ses études et de son travail, Naicha possédait un talent précieux : la confection de kandou, ces pièces de textile traditionnel qui témoignent de la richesse du savoir-faire comorien transmis de génération en génération.",
    liens:
      "Naicha entretenait des liens forts avec ses camarades de l'ISPC et faisait partie d'un chama à Toirab sous le nom d'ISPC, un groupe de solidarité où l'entraide et la fraternité étaient au cœur de chaque rencontre.",
    derniers_mots:
      "« Elle a dit qu'elle allait récupérer son ordinateur à Dzahadjou Mbadjini. »",
    derniers_mots_note:
      "Ces mots simples, prononcés avant son départ, restent gravés dans la mémoire de ses proches.",
    famille_retient:
      "Sa gentillesse, son honnêteté et son grand cœur. Naicha laisse derrière elle l'image d'une jeune femme généreuse, droite et profondément humaine, dont la disparition brutale endeuille tous ceux qui l'ont connue.",
    hommage_global:
      "À Naicha, et à toutes les femmes victimes de féminicide à travers le monde. Elles avaient des rêves, des sourires, des familles qui les aimaient. Elles méritaient de vivre. Leur mémoire ne sera jamais oubliée. Non à la violence faite aux femmes. Ensemble, brisons le silence.",
  };

  const v = data;
  const photo = v?.photo_url || naichaPhoto;
  const text = (k: keyof typeof FALLBACK) =>
    (v?.[k] && String(v[k]).trim()) || FALLBACK[k];

  if (v && v.is_visible === false) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center bg-[#faf6f0] dark:bg-[#121820]">
        <p className="text-sm text-[#7a6a5a] dark:text-[#a8a0b0]">
          Cette page n'est pas disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24 bg-[#faf6f0] dark:bg-[#121820]">
      {/* ── En-tête ── */}
      <header
        className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
        style={{
          background:
            "linear-gradient(160deg, #8a7bb3 0%, #9a8ac8 40%, #b8a0d0 100%)",
          paddingTop:
            "calc(var(--status-bar-height, env(safe-area-inset-top, 24px)) + 1.5rem)",
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1.5px, transparent 1.6px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.12) 1.5px, transparent 1.6px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm mb-4 ring-1 ring-white/30">
            <Flower2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
            {v?.title || "Hommage à Naicha"}
          </h1>
          <p className="text-sm text-white/80 mt-1.5 font-medium">
            {v?.subtitle || "En mémoire d'une vie trop tôt éteinte"}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e8d5a0] to-transparent opacity-70" />
      </header>

      {/* ── Photo ── */}
      <div className="px-6 -mt-4 relative z-10">
        <div className="mx-auto max-w-[220px]">
          <div className="rounded-2xl border-2 border-[#d4c5a0] dark:border-[#4a5060] bg-[#f0ebe0] dark:bg-[#1a2230] shadow-lg overflow-hidden aspect-[3/4]">
            <img
              src={photo}
              alt={`Portrait de ${v?.display_name || "Naicha Mmadi Abdou"}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-center text-xs text-[#9a8a7a] dark:text-[#8a8a98] mt-2 italic">
            {v?.photo_caption || "Naicha Mmadi Abdou"}
          </p>
        </div>
      </div>

      {/* ── Corps ── */}
      <article className="px-5 sm:px-6 pt-6 pb-8 space-y-5">
        <div className="text-center space-y-1.5">
          <h2 className="font-display text-lg font-bold text-[#4a3550] dark:text-[#d8c8e8]">
            {v?.display_name || "Naicha Mmadi Abdou"}
          </h2>
          <div className="inline-flex items-center gap-2 text-sm text-[#7a6a5a] dark:text-[#a8a0b0] bg-white/60 dark:bg-[#1e2535]/60 rounded-full px-4 py-1.5 border border-[#e0d8c8] dark:border-[#3a4050]">
            <CalendarDays className="h-3.5 w-3.5 text-[#c9a84c]" />
            <span>{v?.birth_date || "3 juillet 2002"}</span>
          </div>
        </div>

        <Divider />

        <div className="space-y-4">
          <InfoBlock icon={GraduationCap} label="Parcours">
            <Paragraphs text={text("parcours")} />
          </InfoBlock>

          <InfoBlock icon={Briefcase} label="Son engagement professionnel">
            <Paragraphs text={text("engagement")} />
          </InfoBlock>

          <InfoBlock icon={Sparkles} label="Talents & savoir-faire">
            <Paragraphs text={text("talents")} />
          </InfoBlock>

          <InfoBlock icon={Users} label="Ses liens">
            <Paragraphs text={text("liens")} />
          </InfoBlock>

          <InfoBlock icon={MessageCircle} label="Ses derniers mots" highlight>
            <div className="italic">
              <Paragraphs text={text("derniers_mots")} />
            </div>
            <div className="text-sm mt-2 text-[#6b5290] dark:text-[#b8a8d0]">
              <Paragraphs text={text("derniers_mots_note")} />
            </div>
          </InfoBlock>

          <InfoBlock icon={Heart} label="Ce que la famille retient d'elle" highlight>
            <Paragraphs text={text("famille_retient")} />
          </InfoBlock>
        </div>

        <Divider />

        {/* ── Hommage à toutes les victimes ── */}
        <section
          className="-mx-5 sm:-mx-6 px-5 sm:px-6 py-10 text-center"
          style={{
            background:
              "linear-gradient(160deg, #7a6ba8 0%, #8a7bb8 50%, #9a8bc8 100%)",
          }}
        >
          <div className="max-w-lg mx-auto flex flex-col items-center gap-4">
            <div className="rounded-full bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/25">
              <Heart className="h-7 w-7 text-white" fill="white" />
            </div>
            <div className="text-[15px] sm:text-base leading-[1.8] text-white/95 font-medium">
              <Paragraphs text={text("hommage_global")} />
            </div>
          </div>
        </section>

        <Divider />

        {/* ── Invocation finale ── */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-block rounded-2xl bg-[#f8f4ee] dark:bg-[#1e2535] border border-[#e0d8c8] dark:border-[#3a4050] px-6 py-5 shadow-sm">
            <p
              className="text-xl sm:text-2xl font-bold text-[#4a3550] dark:text-[#d8c8e8] leading-relaxed"
              dir="rtl"
              style={{ fontFamily: "'Amiri', 'Scheherazade New', serif" }}
            >
              {v?.invocation_ar || "اللهم ارحمهن"}
            </p>
            <div className="h-px w-16 mx-auto my-3 bg-[#d4c5a0]" />
            <p className="text-sm font-medium text-[#7a6a5a] dark:text-[#a8a0b0]">
              {v?.invocation_translit || "Allah ya rahamhunna"}
            </p>
            <p className="text-sm text-[#9a8a7a] dark:text-[#a8a0b0] italic mt-1">
              {v?.invocation_fr || "Que Allah leur accorde Sa miséricorde"}
            </p>
          </div>
          <p className="text-[11px] text-[#b8a8a0] dark:text-[#6a6a80] pt-3">
            {v?.footer_note || "Contre les violences faites aux femmes — N'oublions jamais."}
          </p>
        </div>
      </article>
    </div>
  );
};

export default HommageScreen;
