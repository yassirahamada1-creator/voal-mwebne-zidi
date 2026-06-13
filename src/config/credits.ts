import logoCndrs from "@/assets/logos/cndrs-updated.png";
import logoUnionComores from "@/assets/logos/union-comores.jpg";
import logoAfricanUnion from "@/assets/logos/african-union.jpg";
import logoPartners from "@/assets/logos/coi-icc-france-afd-updated.png";

export type CreditLogo = {
  src: string;
  alt: string;
  /** Caption displayed under the logo. */
  name?: string;
  wide?: boolean;
  /** External link for this logo. */
  href?: string;
  /** When true, this logo is excluded from the "Avec le soutien de" grid. */
  hidden?: boolean;
};

/**
 * Centralised credits configuration.
 * Edit the strings (FR / Shikomori) and the logos list to update the
 * credits section across the app.
 */
export const credits = {
  /** Main credit paragraphs — each entry becomes its own paragraph. */
  paragraphs: [
    {
      fr: "Projet régional de développement des Industries Culturelles et Créatives (ICC) en Indianocéanie",
      shi: "Mradi wa kikanda wa maendeleo ya Viwanda vya Utamaduni na Ubunifu (ICC) katika Indianocéanie",
    },
    {
      fr: "« Soutien aux œuvres numériques, Cycle 2 »",
      shi: "« Msaada kwa kazi za kidijitali, Mzunguko wa 2 »",
    },
  ],
  /** Heading above the partner logos. */
  supportLabel: {
    fr: "Avec le soutien de",
    shi: "Kwa msaada wa",
  },
  /** Partner logos shown under "Avec le soutien de". */
  logos: [
    { src: logoUnionComores, alt: "Union des Comores", hidden: true },
    { src: logoPartners, alt: "COI · ICC · AFD", name: "COI · ICC · AFD", wide: true, href: "https://kiltir.org/" },
    { src: logoAfricanUnion, alt: "Cap d'Afrique", name: "CAP D'FRIQUE", href: "https://www.facebook.com/share/1B5wLr7Zst/" },
    { src: logoCndrs, alt: "CNDRS", name: "CNDRS", href: "https://www.facebook.com/share/1B4kAtVQvK/" },
  ] as CreditLogo[],
  /** Copyright line shown at the bottom of the credits section. */
  copyright: {
    fr: "© 2026 By.OUSS. Tous droits réservés.",
    shi: "© 2026 By.OUSS. Haki zote zimehifadhiwa.",
  },
};
