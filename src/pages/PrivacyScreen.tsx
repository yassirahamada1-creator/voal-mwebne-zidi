import { bi } from "@/lib/bilingual";
import { privacyPolicy } from "@/config/legal";

const PrivacyScreen = () => {
  const fr = privacyPolicy.fr;
  const shi = privacyPolicy.shi;
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 pt-6 pb-2">
        {bi(fr.title, shi.title, "title")}
      </header>

      <div className="px-4 mt-2 space-y-4">
        <p className="text-[11px] text-muted-foreground">
          {fr.updatedAt} · {shi.updatedAt}
        </p>

        {fr.sections.map((section, i) => (
          <section key={i} className="card-cultural p-4 space-y-2">
            <h2 className="text-base font-semibold">{section.heading}</h2>
            <p className="text-sm leading-relaxed">{section.body}</p>
            <h3 className="text-sm font-semibold pt-2 opacity-80">{shi.sections[i]?.heading}</h3>
            <p className="text-sm leading-relaxed opacity-80">{shi.sections[i]?.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PrivacyScreen;
