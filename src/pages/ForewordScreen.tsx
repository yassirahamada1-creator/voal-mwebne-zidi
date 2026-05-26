import { biStr } from "@/lib/bilingual";

const HighlightedText = ({ text }: { text: string }) => {
  const parts = text.split(/(Voix de Lune)/g);
  return (
    <>
      {parts.map((part, i) =>
        part === "Voix de Lune" ? (
          <strong key={i} style={{ color: "#C9A84C" }} className="font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const paragraphs = [
  "Voix de Lune : Femmes, Savoirs et Héritage des Comores est un projet ICC (Industries Culturelles et Créatives) dédié à la valorisation du patrimoine culturel immatériel des Comores à travers la mémoire, les savoirs et les pratiques transmis par les femmes comoriennes de génération en génération.",
  "À travers une approche culturelle, sociale, éducative et pédagogique, ce projet met en lumière le rôle essentiel des femmes dans la préservation de l'identité comorienne. Les traditions orales, les chants, les contes, les savoir-faire artisanaux, les pratiques culinaires, les connaissances médicinales, les rites sociaux et les expressions artistiques constituent un héritage précieux qu'il devient nécessaire de sauvegarder, transmettre et promouvoir auprès des jeunes générations.",
  "L'application mobile Voix de Lune se veut un espace vivant de mémoire et de transmission. Elle offre un accès moderne et interactif à des contenus culturels authentiques, favorisant l'apprentissage, le dialogue intergénérationnel et la reconnaissance du patrimoine féminin comorien. En associant innovation numérique et héritage culturel, le projet contribue à renforcer le lien social, la valorisation des femmes et la protection de la diversité culturelle des Comores.",
  "Voix de Lune porte ainsi une ambition forte : faire entendre les voix des femmes comoriennes, gardiennes des savoirs et de la mémoire collective, afin que leur héritage continue d'inspirer les générations présentes et futures.",
];

const ForewordScreen = () => {
  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: "#1A3A5C", color: "#FAF7F0" }}
    >
      <header className="flex items-center gap-2 px-4 pt-6 pb-2">
        <Link
          to="/settings"
          aria-label={biStr("Retour", "Rudi")}
          className="-ml-1 inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      </header>

      <article className="px-6 pt-4">
        <h1
          className="text-center font-serif text-3xl sm:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif", color: "#FAF7F0" }}
        >
          Avant-propos
        </h1>

        <div
          className="my-5 flex items-center justify-center gap-3"
          aria-hidden="true"
          style={{ color: "#C9A84C" }}
        >
          <span className="h-px w-16 sm:w-20" style={{ backgroundColor: "#C9A84C" }} />
          <span className="text-base">◆</span>
          <span className="h-px w-16 sm:w-20" style={{ backgroundColor: "#C9A84C" }} />
        </div>

        <div
          className="space-y-5 font-sans"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#FAF7F0",
          }}
        >
          {paragraphs.map((p, i) => (
            <p key={i}>
              <HighlightedText text={p} />
            </p>
          ))}
        </div>
      </article>
    </div>
  );
};

export default ForewordScreen;
