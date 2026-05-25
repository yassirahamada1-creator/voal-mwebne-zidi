import { memo } from "react";
import { cn } from "@/lib/utils";

export type PatternVariant = "zellij" | "henna" | "weave";
export type PatternIntensity = "subtle" | "medium" | "strong";

const intensityMap: Record<PatternIntensity, number> = {
  subtle: 0.05,
  medium: 0.1,
  strong: 0.18,
};

interface DecorativePatternProps {
  variant?: PatternVariant;
  intensity?: PatternIntensity;
  className?: string;
  /** Couleur du motif (token CSS sans hsl()), ex: "var(--gold)" */
  colorVar?: string;
}

/**
 * Motifs décoratifs inspirés du patrimoine comorien.
 * - zellij : étoile à 8 branches (architecture shirazie / portes Mutsamudu)
 * - henna  : volutes florales fines (motifs henné)
 * - weave  : tressage chevrons (textile salouva)
 *
 * Rendu en SVG inline, offline-first, opacité basse pour préserver la lisibilité.
 */
function DecorativePatternBase({
  variant = "zellij",
  intensity = "subtle",
  className,
  colorVar = "var(--gold)",
}: DecorativePatternProps) {
  const opacity = intensityMap[intensity];
  const id = `pat-${variant}-${Math.random().toString(36).slice(2, 8)}`;
  const stroke = `hsl(${colorVar})`;

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {variant === "zellij" && (
          <pattern id={id} x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={stroke} strokeWidth="1" opacity={opacity}>
              {/* Étoile 8 branches */}
              <path d="M28 6 L34 22 L50 28 L34 34 L28 50 L22 34 L6 28 L22 22 Z" />
              <circle cx="28" cy="28" r="3" />
              <path d="M28 0 L28 12 M28 44 L28 56 M0 28 L12 28 M44 28 L56 28" />
            </g>
          </pattern>
        )}
        {variant === "henna" && (
          <pattern id={id} x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} strokeLinecap="round">
              {/* Volutes florales henné */}
              <path d="M24 8 C 30 14, 30 22, 24 24 C 18 22, 18 14, 24 8 Z" />
              <path d="M24 24 C 30 26, 30 34, 24 40 C 18 34, 18 26, 24 24 Z" />
              <path d="M8 24 C 14 18, 22 18, 24 24 C 22 30, 14 30, 8 24 Z" />
              <path d="M24 24 C 26 18, 34 18, 40 24 C 34 30, 26 30, 24 24 Z" />
              <circle cx="24" cy="24" r="1.5" fill={stroke} />
            </g>
          </pattern>
        )}
        {variant === "weave" && (
          <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={stroke} strokeWidth="1.2" opacity={opacity}>
              {/* Chevrons tressés */}
              <path d="M0 10 L10 0 L20 10 L10 20 Z" />
              <path d="M0 0 L20 20 M20 0 L0 20" strokeWidth="0.6" />
            </g>
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export const DecorativePattern = memo(DecorativePatternBase);
