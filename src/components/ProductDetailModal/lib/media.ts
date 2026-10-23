import type { CatalogItem } from "@/types/catalog";

/** Defensive: media comes from JSON and is not guaranteed to be an array. */
export function getMediaList(item: Pick<CatalogItem, "media">) {
  return Array.isArray(item.media) ? item.media : [];
}
