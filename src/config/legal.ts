/**
 * Legal content: open-source licences, terms of use and privacy policy.
 * Edit these strings to update the corresponding screens.
 */

export type LibraryLicense = {
  name: string;
  license: string;
  url: string;
};

export const openSourceLibraries: LibraryLicense[] = [
  { name: "React", license: "MIT", url: "https://github.com/facebook/react/blob/main/LICENSE" },
  { name: "React DOM", license: "MIT", url: "https://github.com/facebook/react/blob/main/LICENSE" },
  { name: "React Router", license: "MIT", url: "https://github.com/remix-run/react-router/blob/main/LICENSE.md" },
  { name: "Vite", license: "MIT", url: "https://github.com/vitejs/vite/blob/main/LICENSE" },
  { name: "TypeScript", license: "Apache-2.0", url: "https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt" },
  { name: "Tailwind CSS", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE" },
  { name: "shadcn/ui", license: "MIT", url: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md" },
  { name: "Radix UI", license: "MIT", url: "https://github.com/radix-ui/primitives/blob/main/LICENSE" },
  { name: "Lucide Icons", license: "ISC", url: "https://github.com/lucide-icons/lucide/blob/main/LICENSE" },
  { name: "TanStack Query", license: "MIT", url: "https://github.com/TanStack/query/blob/main/LICENSE" },
  { name: "Supabase JS", license: "MIT", url: "https://github.com/supabase/supabase-js/blob/main/LICENSE" },
  { name: "Sonner", license: "MIT", url: "https://github.com/emilkowalski/sonner/blob/main/LICENSE.md" },
  { name: "class-variance-authority", license: "Apache-2.0", url: "https://github.com/joe-bell/cva/blob/main/LICENSE" },
  { name: "clsx", license: "MIT", url: "https://github.com/lukeed/clsx/blob/master/license" },
  { name: "tailwind-merge", license: "MIT", url: "https://github.com/dcastil/tailwind-merge/blob/main/LICENSE.md" },
  { name: "Zod", license: "MIT", url: "https://github.com/colinhacks/zod/blob/main/LICENSE" },
];

export const termsOfUse = {
  fr: {
    title: "Conditions Générales d'Utilisation",
    updatedAt: "Mises à jour : 2026",
    sections: [
      {
        heading: "1. Objet",
        body: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application « Voix de la Lune », dédiée à la valorisation du patrimoine culturel des femmes comoriennes. L'application est mise à disposition gratuitement, à des fins éducatives et culturelles.",
      },
      {
        heading: "2. Accès au service",
        body: "L'application est accessible librement, sans création de compte ni collecte de données personnelles. Une connexion Internet est requise lors du premier téléchargement des contenus ; l'application fonctionne ensuite hors-ligne.",
      },
      {
        heading: "3. Propriété intellectuelle",
        body: "Les contenus (textes, images, sons, vidéos) sont protégés par le droit d'auteur et restent la propriété de leurs ayants droit. Toute reproduction, diffusion ou exploitation commerciale sans autorisation est interdite. Un usage personnel, pédagogique et non commercial est autorisé.",
      },
      {
        heading: "4. Comportement de l'utilisateur",
        body: "L'utilisateur s'engage à utiliser l'application dans le respect des lois en vigueur et à ne pas tenter de porter atteinte à son intégrité technique ou aux contenus diffusés.",
      },
      {
        heading: "5. Responsabilité",
        body: "L'éditeur met tout en œuvre pour assurer la fiabilité des informations diffusées mais ne peut être tenu responsable d'éventuelles erreurs, omissions ou indisponibilités du service.",
      },
      {
        heading: "6. Modifications",
        body: "Les présentes CGU peuvent évoluer. La version en vigueur est celle accessible dans l'application à la date de consultation.",
      },
      {
        heading: "7. Contact",
        body: "Pour toute question relative à ces conditions, vous pouvez contacter l'équipe via les coordonnées indiquées dans la section Crédits.",
      },
    ],
  },
  shi: {
    title: "Mashariti ya Jumla ya Matumizi",
    updatedAt: "Yamesasishwa: 2026",
    sections: [
      {
        heading: "1. Madhumuni",
        body: "Mashariti haya yanasimamia matumizi ya programu « Voix de la Lune », inayolenga kuhifadhi urithi wa kitamaduni wa wanawake wa Komori. Programu inapatikana bure kwa malengo ya elimu na utamaduni.",
      },
      {
        heading: "2. Upatikanaji",
        body: "Programu inapatikana bila kujisajili na bila kukusanya taarifa za kibinafsi. Mtandao unahitajika tu wakati wa kupakua kwanza; baada ya hapo programu inafanya kazi bila mtandao.",
      },
      {
        heading: "3. Haki miliki",
        body: "Maudhui yote yanalindwa na sheria ya hakimiliki na ni mali ya wamiliki wake. Matumizi ya kibinafsi na ya elimu yanaruhusiwa; matumizi ya kibiashara yamekatazwa bila idhini.",
      },
      {
        heading: "4. Tabia ya mtumiaji",
        body: "Mtumiaji anatakiwa kuheshimu sheria zilizopo na kutotumia programu kwa njia inayoweza kudhuru.",
      },
      {
        heading: "5. Wajibu",
        body: "Mhariri hawezi kuwajibika kwa makosa, mapungufu au kukosekana kwa huduma.",
      },
      {
        heading: "6. Mabadiliko",
        body: "Mashariti haya yanaweza kubadilika. Toleo halali ni lile linalopatikana kwenye programu.",
      },
      {
        heading: "7. Mawasiliano",
        body: "Kwa maswali yoyote, tafadhali wasiliana nasi kupitia taarifa zilizopo katika sehemu ya Mikopo.",
      },
    ],
  },
};

export const privacyPolicy = {
  fr: {
    title: "Politique de Confidentialité",
    updatedAt: "Mise à jour : 2026",
    sections: [
      {
        heading: "1. Engagement de confidentialité",
        body: "« Voix de la Lune » a été conçue dans le respect strict de la vie privée. L'application ne collecte aucune donnée personnelle identifiante.",
      },
      {
        heading: "2. Aucune donnée personnelle collectée",
        body: "Nous ne demandons ni nom, ni adresse e-mail, ni numéro de téléphone, ni géolocalisation. Aucun compte utilisateur n'est requis pour utiliser l'application.",
      },
      {
        heading: "3. Données techniques",
        body: "Seules les préférences locales (mode sombre, accessibilité, contenus téléchargés) sont stockées sur votre appareil afin d'améliorer votre expérience. Ces données ne sont jamais transmises à un serveur tiers.",
      },
      {
        heading: "4. Cookies et traceurs",
        body: "L'application n'utilise pas de cookies publicitaires ni d'outils de suivi (analytics, traceurs tiers).",
      },
      {
        heading: "5. Téléchargements de contenus",
        body: "Les médias (audio, vidéo, images) sont téléchargés depuis nos serveurs pour permettre une lecture hors-ligne. Aucun identifiant utilisateur n'est associé à ces téléchargements.",
      },
      {
        heading: "6. Vos droits",
        body: "Comme aucune donnée personnelle n'est collectée, il n'y a pas de demande d'accès, de rectification ou de suppression à effectuer. Vous pouvez à tout moment supprimer les contenus téléchargés depuis les paramètres de l'application.",
      },
      {
        heading: "7. Contact",
        body: "Pour toute question relative à la confidentialité, contactez-nous via les coordonnées indiquées dans la section Crédits.",
      },
    ],
  },
  shi: {
    title: "Sera ya Faragha",
    updatedAt: "Imesasishwa: 2026",
    sections: [
      {
        heading: "1. Ahadi yetu",
        body: "« Voix de la Lune » imeundwa kwa kuheshimu kabisa faragha. Programu haikusanyi taarifa zozote za kibinafsi.",
      },
      {
        heading: "2. Hakuna taarifa za kibinafsi",
        body: "Hatuombi jina, barua pepe, nambari ya simu wala mahali. Hakuna akaunti inayohitajika.",
      },
      {
        heading: "3. Taarifa za kiufundi",
        body: "Mipangilio yako (hali ya giza, ufikivu, upakuaji) huhifadhiwa kwenye kifaa chako tu, kamwe haitumwi kwenye seva.",
      },
      {
        heading: "4. Vidakuzi na vifuatiliaji",
        body: "Programu haitumii vidakuzi vya matangazo wala vifuatiliaji.",
      },
      {
        heading: "5. Upakuaji wa maudhui",
        body: "Maudhui hupakuliwa kwa ajili ya matumizi bila mtandao. Hakuna kitambulisho cha mtumiaji kinachoambatanishwa.",
      },
      {
        heading: "6. Haki zako",
        body: "Kwa kuwa hakuna taarifa za kibinafsi zinazokusanywa, hakuna ombi la ufikiaji au ufutaji linalohitajika. Unaweza kufuta upakuaji wakati wowote kupitia mipangilio.",
      },
      {
        heading: "7. Mawasiliano",
        body: "Kwa maswali yoyote, wasiliana nasi kupitia sehemu ya Mikopo.",
      },
    ],
  },
};
