import { type CatalogItem, CATALOG_NAME_MAX_LENGTH } from "./types";

export function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Record<keyof CatalogItem, unknown>>;

  return (
    typeof item.id === "string" && item.id.length > 0 &&
    typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= CATALOG_NAME_MAX_LENGTH &&
    typeof item.price === "string" &&
    typeof item.numeric_price === "number" && Number.isFinite(item.numeric_price) && item.numeric_price > 0 &&
    (item.description === null || typeof item.description === "string") &&
    typeof item.category === "string" &&
    (item.item_type === "product" || item.item_type === "service") &&
    (item.duration_minutes === null || (typeof item.duration_minutes === "number" && Number.isFinite(item.duration_minutes) && item.duration_minutes > 0)) &&
    Array.isArray(item.media) && item.media.every((entry) => typeof entry === "string") &&
    typeof item.is_popular === "boolean" &&
    typeof item.is_active === "boolean" &&
    (item.rating === null || (typeof item.rating === "number" && Number.isFinite(item.rating) && item.rating >= 0 && item.rating <= 5)) &&
    typeof item.created_at === "string" &&
    typeof item.updated_at === "string" &&
    (item.item_type === "service" ? item.duration_minutes !== null : item.duration_minutes === null)
  );
}
