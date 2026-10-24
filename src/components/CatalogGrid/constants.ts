import { CATALOG_CATEGORIES } from "@/types/catalog";

import type { SortOption } from "./types";

export const CATEGORIES = ["All", ...CATALOG_CATEGORIES] as const;

export const SORT_OPTIONS: readonly SortOption[] = [
  "popular",
  "price-low",
  "price-high",
];

export const SORT_LABELS: Record<SortOption, string> = {
  popular: "Most Popular",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
};

export const DEFAULT_SORT: SortOption = "popular";
export const DEFAULT_CURRENCY = "USD";

export const MENU_SECTION_DOM_ID = "menu-section";

export const ITEMS_PER_PAGE = 6;

/** Gallery images kept per card (the first N entries of `media`). */
export const MAX_CARD_GALLERY_IMAGES = 5;

export const ADD_TO_CART_CONFIRM_MS = 1200;
export const HIGHLIGHT_DURATION_MS = 2500;
export const IMAGE_DRAG_THRESHOLD_PX = 40;

/**
 * Background refresh cadence while the tab is visible.
 *
 * The storefront reads `catalog_items_public` (a view), and Supabase Realtime
 * cannot stream view changes. Guests have no SELECT on `catalog_items`, and
 * customers have no RLS policy on it either, so a `postgres_changes`
 * subscription on that table would never deliver rows to them. Polling plus
 * refetch-on-focus keeps the menu fresh without widening database access.
 */
export const CATALOG_REFRESH_INTERVAL_MS = 60_000;

/**
 * Columns read from `catalog_items_public`. Stock counts, Stripe ids and
 * `is_active` are deliberately absent: the view already filters to active
 * rows and exposes a derived `in_stock` flag instead.
 */
export const CATALOG_PUBLIC_COLUMNS = [
  "id",
  "name",
  "price",
  "numeric_price",
  "description",
  "category",
  "item_type",
  "duration_minutes",
  "media",
  "is_popular",
  "rating",
  "requires_resource",
  "in_stock",
  "created_at",
].join(", ");

export const LOAD_ERROR_MESSAGE =
  "We couldn't load the menu right now. Please try again shortly.";

export const EVENT_PREFILL_MENU = "cafe_prefill_menu";
export const EVENT_ADD_TO_CART = "cafe_add_to_cart";

export const FULL_MENU_PATH = "/menu";
export const MENU_PDF_HREF = "/images/cafe-menu.pdf";
export const MENU_PDF_FILENAME = "cafe-menu.pdf";
export const MENU_PDF_SIZE_LABEL = "587 KB";
