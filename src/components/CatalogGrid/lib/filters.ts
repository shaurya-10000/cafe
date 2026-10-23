import type { CatalogItem } from "@/types/catalog";

import type { Category, SortOption } from "../types";

export function filterAndSortItems(
  items: readonly CatalogItem[],
  category: Category,
  query: string,
  sortBy: SortOption,
): CatalogItem[] {
  const needle = query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const matchesSearch =
      needle.length === 0 || item.name.toLowerCase().includes(needle);

    return matchesCategory && matchesSearch;
  });

  switch (sortBy) {
    case "price-low":
      return filtered.sort((a, b) => a.numeric_price - b.numeric_price);

    case "price-high":
      return filtered.sort((a, b) => b.numeric_price - a.numeric_price);

    case "popular":
    default:
      return filtered.sort(
        (a, b) => Number(b.is_popular) - Number(a.is_popular),
      );
  }
}
