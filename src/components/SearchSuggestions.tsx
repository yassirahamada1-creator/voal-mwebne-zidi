import { ReactNode, useMemo } from "react";
import { normalizeText, matchesAllTokens } from "@/lib/utils";

export type SuggestionItem = {
  id: string;
  /** Primary label rendered (already in current language). */
  label: string;
  /** Optional sublabel (e.g. theme name). */
  sub?: string;
  /** Free-form list of fields to score against the query (FR + Shi titles, descriptions...). */
  searchable: Array<string | null | undefined>;
  /** Optional icon rendered on the left. */
  icon?: ReactNode;
  /** Called when the user picks this suggestion. */
  onPick: () => void;
};

interface Props {
  query: string;
  open: boolean;
  items: SuggestionItem[];
  emptyLabel?: string;
  /** Max suggestions shown. */
  limit?: number;
}

/**
 * Reusable accent/case-insensitive suggestions dropdown for search inputs.
 * Render it as a sibling of an `<input>` inside a `relative` wrapper.
 */
export const SearchSuggestions = ({
  query,
  open,
  items,
  emptyLabel,
  limit = 8,
}: Props) => {
  const ranked = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const nq = normalizeText(q);
    const score = (text: string | null | undefined) => {
      const n = normalizeText(text);
      if (!n) return -1;
      if (n === nq) return 100;
      if (n.startsWith(nq)) return 80;
      if (n.includes(` ${nq}`)) return 60;
      if (n.includes(nq)) return 40;
      return matchesAllTokens([text], q) ? 20 : -1;
    };
    return items
      .map((it) => ({
        it,
        score: Math.max(-1, ...it.searchable.map(score)),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.it);
  }, [items, query, limit]);

  if (!open || !query.trim()) return null;

  return (
    <div
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
    >
      {ranked.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          {emptyLabel ?? "Aucune suggestion"}
        </p>
      ) : (
        <ul className="py-1 divide-y divide-border">
          {ranked.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={s.onPick}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-popover-foreground hover:bg-accent"
              >
                {s.icon && (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/15">
                    {s.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-words text-popover-foreground">{s.label}</p>
                  {s.sub && (
                    <p className="text-xs break-words text-muted-foreground">{s.sub}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchSuggestions;
