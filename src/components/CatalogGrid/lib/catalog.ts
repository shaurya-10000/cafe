import { CATEGORIES, MAX_CARD_GALLERY_IMAGES } from "../constants";
import type { Category } from "../types";

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}

export function normalizeMedia(media: unknown): string[] {
  if (!Array.isArray(media)) return [];

  return media
    .filter(
      (entry): entry is string => typeof entry === "string" && entry.length > 0,
    )
    .slice(0, MAX_CARD_GALLERY_IMAGES);
}

/** Builds the formatter once per currency instead of once per call. */
export function createPriceFormatter(
  currency: string,
): (value: number) => string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    });

    return (value) => formatter.format(value);
  } catch {
    return (value) => `${currency} ${value.toFixed(2)}`;
  }
}
