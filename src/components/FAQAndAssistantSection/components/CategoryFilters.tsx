import { useCallback, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { getNextIndex } from "../lib/keyboard";
import type { FaqIds } from "../lib/ids";
import type {
  FAQCategory,
  FAQCategoryMeta,
  FAQFilter,
} from "../types";
import { FilterChip } from "./FilterChip";

interface CategoryFiltersProps {
  readonly ids: FaqIds;
  readonly categories: readonly FAQCategory[];
  readonly categoryMeta: Readonly<Record<FAQCategory, FAQCategoryMeta>>;
  readonly counts: Readonly<Record<FAQCategory, number>>;
  readonly totalCount: number;
  readonly activeFilter: FAQFilter;
  readonly onChange: (filter: FAQFilter) => void;
}

export function CategoryFilters({
  ids,
  categories,
  categoryMeta,
  counts,
  totalCount,
  activeFilter,
  onChange,
}: CategoryFiltersProps) {
  const chipRefs = useRef<Map<FAQFilter, HTMLButtonElement>>(new Map());

  const filters = useMemo<readonly FAQFilter[]>(
    () => ["all", ...categories],
    [categories],
  );

  const registerChip = useCallback(
    (filter: FAQFilter) => (node: HTMLButtonElement | null) => {
      if (node) chipRefs.current.set(filter, node);
      else chipRefs.current.delete(filter);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = filters.indexOf(activeFilter);
      if (currentIndex === -1) return;

      const nextIndex = getNextIndex(
        event.key,
        currentIndex,
        filters.length,
        "horizontal",
      );
      if (nextIndex === null) return;

      event.preventDefault();

      const nextFilter = filters[nextIndex];
      if (nextFilter === undefined) return;

      onChange(nextFilter);
      chipRefs.current.get(nextFilter)?.focus();
    },
    [filters, activeFilter, onChange],
  );

  return (
    <div
      id={ids.tablist}
      role="tablist"
      aria-label="Filter questions by category"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        "mb-10 flex flex-wrap items-center gap-2",
        "border-b border-cafe-border pb-6",
      )}
    >
      <FilterChip
        id={ids.tab("all")}
        panelId={ids.panel}
        label="All"
        count={totalCount}
        active={activeFilter === "all"}
        onClick={() => onChange("all")}
        buttonRef={registerChip("all")}
      />

      {categories.map((category) => (
        <FilterChip
          key={category}
          id={ids.tab(category)}
          panelId={ids.panel}
          label={categoryMeta[category].label}
          count={counts[category]}
          active={activeFilter === category}
          onClick={() => onChange(category)}
          buttonRef={registerChip(category)}
        />
      ))}
    </div>
  );
}
