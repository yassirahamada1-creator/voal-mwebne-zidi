// Précharge en mémoire image-decode les logos bundlés (splash + header +
// crédits). Une fois décodés ils restent en cache navigateur — aucun flash
// au prochain affichage. Coût négligeable (<200 Ko).
import moonLogo from "@/assets/logos/moon-voix.jpg";
import logoCndrs from "@/assets/logos/cndrs-updated.png";
import logoUnionComores from "@/assets/logos/union-comores.jpg";
import logoAfricanUnion from "@/assets/logos/african-union.jpg";
import logoPartners from "@/assets/logos/coi-icc-france-afd-updated.png";
import naichaPhoto from "@/assets/naicha.jpeg";

const STATIC_ASSETS = [
  moonLogo,
  logoCndrs,
  logoUnionComores,
  logoAfricanUnion,
  logoPartners,
  naichaPhoto,
];

export function prewarmStaticAssets() {
  if (typeof window === "undefined") return;
  const run = () => {
    for (const src of STATIC_ASSETS) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      // decode() pour forcer la mise en cache image-decode (silencieux)
      (img as any).decode?.().catch(() => {});
    }
  };
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === "function") ric(run, { timeout: 1500 });
  else setTimeout(run, 300);
}
