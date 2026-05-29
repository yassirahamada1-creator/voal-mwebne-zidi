import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import moonLogo from "@/assets/logos/moon-voix.png";
import logoCndrs from "@/assets/logos/cndrs-updated.png";
import logoUnionComores from "@/assets/logos/union-comores.jpg";
import logoAfricanUnion from "@/assets/logos/cap-afrique.png";
import logoPartners from "@/assets/logos/coi-icc-france-afd-updated.png";

type LogoItem = { src: string; alt: string; wide?: boolean };
type LogoCell = LogoItem;

const partnerLogos: LogoCell[] = [
  { src: logoUnionComores, alt: "Union des Comores" },
  { src: logoPartners, alt: "COI · ICC · France · AFD", wide: true },
  { src: logoAfricanUnion, alt: "Cap d'Afrique" },
  { src: logoCndrs, alt: "CNDRS" },
];

const MIN_SPLASH_MS = 3000;
// Plafond de sécurité si les polices tardent à charger (ex. réseau lent).
// Hors-ligne / mode avion : `document.fonts.ready` se résout immédiatement.
const MAX_SPLASH_MS = 60000;


const waitForFonts = (): Promise<void> => {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return Promise.resolve();
  }
  // document.fonts.ready se résout quand toutes les @font-face en cours sont prêtes
  return (document as any).fonts.ready.then(() => undefined).catch(() => undefined);
};

const SplashScreen = () => {
  const { t, tFr, tShi, lang } = useI18n();
  const navigate = useNavigate();
  const offline = useOfflineSync();
  const [phase, setPhase] = useState<"select" | "leaving">("select");

  // Empêche tout scroll global pendant l'écran splash (iOS + Android)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyTouch: body.style.touchAction,
    };
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.touchAction = "none";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      body.style.position = prev.bodyPosition;
      body.style.width = prev.bodyWidth;
      body.style.height = prev.bodyHeight;
      body.style.touchAction = prev.bodyTouch;
    };
  }, []);


  // Navigation : on attend (polices prêtes + durée mini), puis si c'est le 1er
  // lancement et qu'on est en ligne, on bloque jusqu'à la fin de la 1ère
  // synchro hors-ligne (modules + contenus + miniatures + audio + images).
  // Plafond dur de 2 min en sécurité. Hors ligne : on démarre immédiatement.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const isPreview =
        params.get("preview") === "1" ||
        params.get("splash") === "preview" ||
        params.has("snapshot") ||
        window.location.pathname.startsWith("/splash");
      if (isPreview) return () => {};
    } catch {}

    const minDelay = new Promise<void>((r) => setTimeout(r, MIN_SPLASH_MS));
    const maxDelay = new Promise<void>((r) => setTimeout(r, MAX_SPLASH_MS));
    Promise.race([
      Promise.all([waitForFonts(), minDelay]).then(() => undefined),
      maxDelay,
    ]).then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const skipSplash = () => {
    setPhase("leaving");
    setTimeout(() => navigate("/home", { replace: true }), 600);
  };

  useEffect(() => {
    if (!ready) return;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let navTimer: ReturnType<typeof setTimeout> | undefined;
    let hardTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const go = () => {
      if (cancelled) return;
      leaveTimer = setTimeout(() => setPhase("leaving"), 0);
      navTimer = setTimeout(() => navigate("/home", { replace: true }), 600);
    };

    // Sync se fait en arrière-plan : on n'attend plus la fin de la 1ère synchro.
    go();

    return () => {
      cancelled = true;
      if (leaveTimer) clearTimeout(leaveTimer);
      if (navTimer) clearTimeout(navTimer);
      if (hardTimer) clearTimeout(hardTimer);
    };
  }, [ready, navigate]);

  return (
    <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-screen flex-col items-center justify-between gradient-hero overflow-hidden overscroll-none touch-none px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-8 sm:pt-10 sm:pb-8">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 pattern-geometric opacity-20 bg-[#54e8a8]" />

      {/* ZONE HAUTE — Logo + Nom + Sous-titre */}
      <div
        className={`relative z-10 flex flex-col items-center transition-all duration-700 px-0 ${
          phase === "leaving" ? "opacity-0 -translate-y-8" : ""
        }`}
      >
        <div className="animate-moon-rise relative mb-2 sm:mb-4">
          <div className="absolute inset-0 rounded-full bg-gold/25 blur-2xl scale-150 px-0" />
          <img
            src={moonLogo}
            alt="Voix de la Lune"
            className="relative h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 object-contain rounded-2xl shadow-xl px-0 mx-2 bg-[#165050]"
          />
        </div>

        <h1
          className="animate-fade-up text-center font-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground"
          style={{ animationDelay: "0.2s", animationFillMode: "both", lineHeight: "1.1" }}
        >
          {t.splash.appTitle}
        </h1>
        <p
          className="animate-fade-up mt-1.5 sm:mt-3 max-w-[320px] text-center sm:text-[11px] md:text-xs font-semibold uppercase not-italic tracking-[0.2em] leading-snug text-orange-300 text-xs"
          style={{ animationDelay: "0.5s", animationFillMode: "both" }}
        >
          {t.splash.appSubtitle}
        </p>
      </div>

      {/* ZONE MILIEU — Texte bilingue */}
      <div
        className={`relative z-10 flex flex-col items-center px-2 transition-all duration-700 ${
          phase === "leaving" ? "opacity-0" : "animate-fade-up"
        }`}
        style={{ animationDelay: "0.9s", animationFillMode: "both" }}
      >
        <div className="mx-auto w-full max-w-[340px] sm:max-w-[460px] md:max-w-[560px] text-center">
          <p className="font-sans sm:text-[17px] md:text-lg font-normal leading-[1.45] sm:leading-[1.55] text-primary-foreground text-base">
            {tFr.splash.appTagline}
          </p>

          {/* Séparateur orné ────── ◆ ────── */}
          <div
            aria-hidden="true"
            className="my-2 sm:my-4 flex items-center justify-center gap-3"
          >
            <span className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-gold/70" />
            <span className="text-gold/80 text-[10px] leading-none">◆</span>
            <span className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-gold/70" />
          </div>

          <p className="font-sans sm:text-[15px] md:text-base font-extralight italic leading-[1.45] sm:leading-[1.55] text-primary-foreground/75 text-sm">
            {tShi.splash.appTagline}
          </p>
        </div>
      </div>

      {/* ZONE BASSE — Logos partenaires */}
      <div
        className={`relative z-10 mb-2 sm:mb-6 flex w-full max-w-md sm:max-w-lg md:max-w-xl flex-col items-center gap-2 transition-all duration-500 ${
          phase === "leaving" ? "opacity-0 translate-y-4" : "animate-fade-up"
        }`}
        style={{ animationDelay: "1.6s", animationFillMode: "both" }}
      >
        <span aria-hidden="true" className="mb-1 inline-block h-px w-20 bg-primary-foreground/20" />

        {/* La 1ère synchro se fait silencieusement en arrière-plan */}


        {(() => {
          const wide = partnerLogos[1];
          const bottom = partnerLogos.slice(2);
          const frame =
            "overflow-hidden rounded-xl bg-white p-0.5 shadow-md ring-1 ring-white/30 h-20 sm:h-28 md:h-32";
          const wideFrame = `${frame} flex items-center justify-center w-full max-w-[340px] sm:max-w-[440px] md:max-w-[520px]`;
          const cellFrame = `${frame} w-36 sm:w-44 md:w-52 flex items-center justify-start`;
          return (
            <div className="w-full flex-col gap-3 sm:gap-4 flex items-center justify-start px-0 mx-0">
              {wide && (
                <div className={wideFrame}>
                  <img src={wide.src} alt={wide.alt} className="h-full w-full object-contain m-0 p-2 py-0 px-0 mx-0" />
                </div>
              )}
              <div className="flex w-full max-w-[340px] sm:max-w-[440px] md:max-w-[520px] items-stretch justify-center gap-3 sm:gap-4 mx-0 px-[85px]">
                {bottom.map((cell) => (
                  <div key={cell.alt} className={cellFrame}>
                    <img src={cell.src} alt={cell.alt} className="h-full w-full object-contain m-0 p-2 py-0 mx-0 px-px" />
                  </div>
                ))}
              </div>
            </div>

          );
        })()}
      </div>
    </div>
  );
};

export default SplashScreen;