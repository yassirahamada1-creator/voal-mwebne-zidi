import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize a string for accent/case-insensitive comparison.
 * Removes diacritics, collapses whitespace, lowercases.
 */
export function normalizeText(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True if `haystack` contains `needle` ignoring case and accents.
 * Empty needle returns true.
 */
export function fuzzyIncludes(haystack: string | null | undefined, needle: string): boolean {
  const n = normalizeText(needle);
  if (!n) return true;
  return normalizeText(haystack).includes(n);
}

/**
 * Match each whitespace-separated token in `query` independently against any of `fields`.
 * All tokens must match somewhere; ignores case and accents.
 */
export function matchesAllTokens(fields: Array<string | null | undefined>, query: string): boolean {
  const tokens = normalizeText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const normFields = fields.map((f) => normalizeText(f));
  return tokens.every((tok) => normFields.some((f) => f.includes(tok)));
}

