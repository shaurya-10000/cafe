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

export interface MenuFilterData { category?: string; maxPrice?: number; dietary?: string[]; search?: string; }

export type CatalogAction =
  | { type: "FILTER_MENU"; label: string; data?: MenuFilterData }
  | { type: "OPEN_DIRECTIONS"; label: string; data?: Record<string, never> }
  | { type: "OPEN_CONTACT"; label: string; data?: Record<string, never> };
