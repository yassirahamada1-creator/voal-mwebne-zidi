// Normalisation des textes affichés.
// - Décode les entités HTML (&amp;, &lt;, &eacute;, &#233;…)
// - Décode les séquences URL (%20, %C3%A9) issues de copies depuis un PDF
// - Convertit les balises HTML structurelles en sauts de ligne
//   (<br>, </p>, </div>, </li>) pour conserver paragraphes / alinéas
// - Retire les balises HTML restantes
// - Normalise les caractères spéciaux Word (guillemets, tirets, ellipses,
//   espaces insécables) pour qu'ils s'affichent correctement
// - Préserve les espaces d'indentation et les sauts de ligne (whitespace-pre-wrap)

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  agrave: "à",
  acirc: "â",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  euml: "ë",
  iuml: "ï",
  icirc: "î",
  ocirc: "ô",
  ouml: "ö",
  ugrave: "ù",
  ucirc: "û",
  uuml: "ü",
  ccedil: "ç",
  Agrave: "À",
  Acirc: "Â",
  Eacute: "É",
  Egrave: "È",
  Ecirc: "Ê",
  Euml: "Ë",
  Iuml: "Ï",
  Icirc: "Î",
  Ocirc: "Ô",
  Ouml: "Ö",
  Ugrave: "Ù",
  Ucirc: "Û",
  Uuml: "Ü",
  Ccedil: "Ç",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const n = parseInt(code.slice(2), 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    }
    if (code.startsWith("#")) {
      const n = parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    }
    return NAMED_ENTITIES[code] ?? _;
  });
}

/**
 * Nettoie un texte (potentiellement collé depuis Word/PDF ou contenant
 * du HTML) pour un affichage propre avec `whitespace-pre-wrap`.
 */
export function normalizeDisplayText(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);

  // Décode les séquences URL issues d'un PDF
  if (/%[0-9A-Fa-f]{2}/.test(s)) {
    try { s = decodeURIComponent(s); } catch { /* on garde la version originale */ }
  }

  // Décode les entités HTML (deux passes : ex. &amp;eacute; → é)
  s = decodeEntities(decodeEntities(s));

  // Convertit les balises de saut en \n
  s = s
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|blockquote)\s*>/gi, "\n")
    .replace(/<\s*(p|div|li|h[1-6]|tr|blockquote)[^>]*>/gi, "")
    // Préserve une indentation visuelle pour les listes
    .replace(/<\s*li[^>]*>/gi, "• ")
    // Retire les autres balises HTML restantes
    .replace(/<\/?[a-zA-Z][^>]*>/g, "");

  // Normalise les caractères Word
  s = s
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...");

  // Limite les sauts de ligne consécutifs à 2 (paragraphe)
  s = s.replace(/\n{3,}/g, "\n\n");

  // Trim léger (préserve l'indentation interne)
  return s.replace(/^[ \t\n]+|[ \t\n]+$/g, "");
}
