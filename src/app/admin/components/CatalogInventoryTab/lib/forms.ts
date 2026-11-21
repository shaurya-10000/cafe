import { CATALOG_CATEGORIES, CATALOG_NAME_MAX_LENGTH } from "@/types/catalog";

import type {
  CatalogCategory,
  FormParseResult,
  ItemType,
} from "../types";

interface ParseOptions {
  itemType: ItemType;
  /** A new item was submitted without a background image. */
  missingRequiredImage: boolean;
}

/**
 * Reads and validates the item form.
 *
 * Client-side validation mirrors the DB constraints (and the zod schema in
 * catalogActions.ts) so users get an immediate, readable message instead of
 * a raw Postgres error or a round trip to find out.
 */
export function parseCatalogForm(
  form: FormData,
  { itemType, missingRequiredImage }: ParseOptions,
): FormParseResult {
  const name = String(form.get("name") || "").trim();
  const numericPrice = Number(String(form.get("price") || ""));
  const category = String(form.get("category") || CATALOG_CATEGORIES[0]);
  const description = String(form.get("description") || "").trim() || null;
  const isPopular = form.get("is_popular") === "on";
  const isActive = form.get("is_active") === "on";
  const durationRaw = form.get("duration_minutes");
  const ratingRaw = form.get("rating");
  const trackStock = form.get("track_stock") === "on";
  const stockQuantityRaw = form.get("stock_quantity");

  if (!name || name.length > CATALOG_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Name is required and must be under ${CATALOG_NAME_MAX_LENGTH} characters.`,
    };
  }

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return { ok: false, error: "Price must be a number greater than 0." };
  }

  if (missingRequiredImage) {
    return { ok: false, error: "A background image is required for new items." };
  }

  let durationMinutes: number | null = null;

  if (itemType === "service") {
    const duration = Number(durationRaw);

    if (!Number.isFinite(duration) || duration <= 0) {
      return {
        ok: false,
        error: "Services require a duration greater than 0 minutes.",
      };
    }

    durationMinutes = Math.round(duration);
  }

  let rating: number | null = null;

  if (ratingRaw !== null && String(ratingRaw).trim() !== "") {
    const parsed = Number(ratingRaw);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
      return { ok: false, error: "Rating must be between 0 and 5." };
    }

    rating = parsed;
  }
  let stockQuantity = 0;

  if (trackStock) {
    const parsedStock = Number(stockQuantityRaw ?? 0);

    if (!Number.isFinite(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      return {
        ok: false,
        error: "Stock quantity must be a whole number of 0 or more.",
      };
    }

    stockQuantity = parsedStock;
  }

  return {    ok: true,
    values: {
      name,
      numericPrice,
      category: category as CatalogCategory,
      description,
      isPopular,
      isActive,
      durationMinutes,
      rating,
      trackStock,
      stockQuantity,
    },
  };
}
