import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { CatalogItem } from "@/types/catalog";

import { DEFAULT_SORT, ITEMS_PER_PAGE } from "../constants";
import { filterAndSortItems } from "../lib/filters";
import type { Category, SortOption } from "../types";

export interface UseMenuFiltersResult {
  activeCategory: Category;
  setActiveCategory: Dispatch<SetStateAction<Category>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  sortBy: SortOption;
  setSortBy: Dispatch<SetStateAction<SortOption>>;
  processedItems: CatalogItem[];
  displayedItems: CatalogItem[];
  visibleCount: number;
  hasMore: boolean;
  showMore: () => void;
  /** Grows the page so the item at `index` is rendered. */
  revealIndex: (index: number) => void;
}

export function useMenuFilters(
  items: readonly CatalogItem[],
): UseMenuFiltersResult {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>(DEFAULT_SORT);

  // The page size resets whenever the category or search changes. Tagging the
  // count with the filter it belongs to makes that reset a derivation rather
  // than an effect that sets state.
  const pageKey = `${activeCategory}\u0000${searchQuery}`;
  const [page, setPage] = useState({ key: pageKey, count: ITEMS_PER_PAGE });
  const visibleCount = page.key === pageKey ? page.count : ITEMS_PER_PAGE;

  const processedItems = useMemo(
    () => filterAndSortItems(items, activeCategory, searchQuery, sortBy),
    [items, activeCategory, searchQuery, sortBy],
  );

  const displayedItems = useMemo(
    () => processedItems.slice(0, visibleCount),
    [processedItems, visibleCount],
  );

  const hasMore = visibleCount < processedItems.length;

  const showMore = useCallback(() => {
    setPage((prev) => ({
      key: pageKey,
      count: (prev.key === pageKey ? prev.count : ITEMS_PER_PAGE) + ITEMS_PER_PAGE,
    }));
  }, [pageKey]);

  const revealIndex = useCallback(
    (index: number) => {
      setPage((prev) => ({
        key: pageKey,
        count: Math.max(
          prev.key === pageKey ? prev.count : ITEMS_PER_PAGE,
          Math.ceil((index + 1) / ITEMS_PER_PAGE) * ITEMS_PER_PAGE,
        ),
      }));
    },
    [pageKey],
  );

  return {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    processedItems,
    displayedItems,
    visibleCount,
    hasMore,
    showMore,
    revealIndex,
  };
}