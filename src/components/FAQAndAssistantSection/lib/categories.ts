import { ALL_FAQ_CATEGORIES } from "../constants";
import type { FAQCategory, FAQEntry } from "../types";

/**
 * Guards externally supplied `categoryOrder` arrays that might contain stale
 * or misspelled keys, which would otherwise make `categoryMeta[category]`
 * undefined at render time and crash the section.
 */
export function isValidCategory(value: unknown): value is FAQCategory {
  return (
    typeof value === "string" &&
    (ALL_FAQ_CATEGORIES as readonly string[]).includes(value)
  );
}

export function buildCategoryCounts(
  entries: readonly FAQEntry[],
): Record<FAQCategory, number> {
  const counts: Record<FAQCategory, number> = {
    dining: 0,
    orders: 0,
    reservations: 0,
    visit: 0,
  };

  for (const entry of entries) {
    if (isValidCategory(entry.category)) counts[entry.category] += 1;
  }

  return counts;
}

export function formatCount(count: number): string {
  return String(count).padStart(2, "0");
}
