export type CatalogItemType = "product" | "service";

export interface CatalogItem {
  id: string;
  name: string;
  price: string;
  numeric_price: number;
  description: string | null;
  category: string;
  item_type: CatalogItemType;
  duration_minutes: number | null;
  media: string[];
  is_popular: boolean;
  is_active: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export const CATALOG_CATEGORIES = ["Coffee", "Signature", "Pastry", "Cold"] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];
export const CATALOG_NAME_MAX_LENGTH = 160;
export const CATALOG_MEDIA_BUCKET = "catalog-media";
export const CATALOG_MAX_GALLERY_IMAGES = 4;
export const CATALOG_MAX_UPLOAD_MB = 5;

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
