import { type ElementType, type ReactNode } from "react";

/**
 * Reusable bilingual display: Shikomori on top, French underneath, with
 * consistent sizing, spacing and opacity across the app.
 */
export type BilingualVariant =
  | "title"
  | "subtitle"
  | "body"
  | "caption"
  | "label"
  | "nav";

const VARIANTS: Record<
  BilingualVariant,
  { primary: string; secondary: string; gap: string }
> = {
  title:    { primary: "text-xl font-bold leading-tight",      secondary: "text-xl font-bold leading-tight opacity-80",      gap: "mt-1" },
  subtitle: { primary: "text-base font-semibold leading-snug", secondary: "text-base font-semibold leading-snug opacity-80", gap: "mt-0.5" },
  body:     { primary: "text-sm leading-snug",                 secondary: "text-sm leading-snug opacity-80",                 gap: "mt-1" },
  caption:  { primary: "text-xs leading-snug",                 secondary: "text-xs leading-snug opacity-75",                 gap: "mt-0.5" },
  label:    { primary: "text-sm font-semibold leading-tight",  secondary: "text-sm font-semibold leading-tight opacity-75",  gap: "mt-0.5" },
  nav:      { primary: "text-[10px] font-semibold leading-none", secondary: "text-[10px] font-semibold leading-none opacity-70", gap: "mt-0.5" },
};

interface BilingualTextProps {
  /** French text (rendered second, smaller, faded). */
  fr?: string | null;
  /** Shikomori text (rendered first, primary). */
  shi?: string | null;
  /** Visual variant — picks default font size, weight, opacity, gap. */
  variant?: BilingualVariant;
  /** HTML element to render (default span). */
  as?: ElementType;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Override classes for the primary (Shikomori) line. */
  primaryClassName?: string;
  /** Override classes for the secondary (French) line. */
  secondaryClassName?: string;
}

export const BilingualText = ({
  fr,
  shi,
  variant = "body",
  as: Tag = "span",
  className = "",
  primaryClassName = "",
  secondaryClassName = "",
}: BilingualTextProps): ReactNode => {
  const f = (fr ?? "").trim();
  const s = (shi ?? "").trim();
  const v = VARIANTS[variant];

  if (!f && !s) return null;
  if (!f || !s) {
    return (
      <Tag className={`${v.primary} ${className}`}>
        {s || f}
      </Tag>
    );
  }
  return (
    <Tag className={`block ${className}`}>
      <span className={`block ${v.primary} ${primaryClassName}`}>{f}</span>
      <span className={`block ${v.gap} ${v.secondary} ${secondaryClassName}`}>{s}</span>
    </Tag>
  );
};

/** Bilingual JSX (Shikomori on top, French below). Convenience wrapper. */
export const bi = (
  fr?: string | null,
  shi?: string | null,
  variant: BilingualVariant = "body",
): ReactNode => <BilingualText fr={fr} shi={shi} variant={variant} />;

/** Bilingual string for places that need a plain string (placeholders, alt, toasts). */
export const biStr = (fr?: string | null, shi?: string | null): string => {
  const a = (fr ?? "").trim();
  const b = (shi ?? "").trim();
  if (a && b) return `${a} / ${b}`;
  return a || b;
};
