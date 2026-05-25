import { useI18n } from "@/contexts/I18nContext";

const LanguageSwitcher = () => {
  const { lang, setLang, t } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "fr" ? "shi" : "fr")}
      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-95"
    >
      <span className="text-sm">🌍</span>
      <span>{lang === "fr" ? "SHI" : "FR"}</span>
    </button>
  );
};

export default LanguageSwitcher;
