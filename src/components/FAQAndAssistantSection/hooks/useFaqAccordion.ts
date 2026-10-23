import { useCallback, useMemo, useState } from "react";
import { buildCategoryCounts, isValidCategory } from "../lib/categories";
import type {
  FAQCategory,
  FAQCategoryMeta,
  FAQEntry,
  FAQFilter,
} from "../types";

interface Options {
  readonly entries: readonly FAQEntry[];
  readonly categoryOrder: readonly FAQCategory[];
  readonly categoryMeta: Readonly<Record<FAQCategory, FAQCategoryMeta>>;
}

/** Filter + single-open accordion state, with self-healing on data changes. */
export function useFaqAccordion({
  entries,
  categoryOrder,
  categoryMeta,
}: Options) {
  const [openId, setOpenId] = useState<string | null>(entries[0]?.id ?? null);
  const [requestedFilter, setActiveFilter] = useState<FAQFilter>("all");

  // Drop unknown keys (and keys with no metadata) instead of crashing.
  const categories = useMemo(
    () =>
      categoryOrder.filter(
        (category) =>
          isValidCategory(category) && categoryMeta[category] !== undefined,
      ),
    [categoryOrder, categoryMeta],
  );

  // Keep the active filter valid if the supplied category list shrinks. Derived
  // rather than corrected from an effect, so there is never an invalid render.
  const activeFilter: FAQFilter =
    requestedFilter !== "all" && !categories.includes(requestedFilter)
      ? "all"
      : requestedFilter;

  // Same for the open row if the entries change underneath it.
  const effectiveOpenId =
    openId !== null && !entries.some((entry) => entry.id === openId)
      ? (entries[0]?.id ?? null)
      : openId;

  const filteredEntries = useMemo(
    () =>
      activeFilter === "all"
        ? entries
        : entries.filter((entry) => entry.category === activeFilter),
    [activeFilter, entries],
  );

  const categoryCounts = useMemo(() => buildCategoryCounts(entries), [entries]);

  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  const changeFilter = useCallback((filter: FAQFilter) => {
    setActiveFilter(filter);
    setOpenId(null);
  }, []);

  return {
    categories,
    categoryCounts,
    activeFilter,
    openId: effectiveOpenId,
    filteredEntries,
    toggle,
    changeFilter,
  };
}