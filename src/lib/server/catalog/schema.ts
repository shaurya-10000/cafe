import { z } from "zod";

import { CATALOG_CATEGORIES, CATALOG_NAME_MAX_LENGTH } from "@/types/catalog";

/**
 * The single source of truth for what a valid catalog item looks like at the
 * application layer. The DB constraints (name length, numeric_price > 0,
 * service duration required, media is a jsonb array) remain the
 * authoritative boundary; this schema fails fast with a clean message so the
 * admin never sees a raw Postgres error string.
 */
export const catalogItemInputSchema = z
  .object({
    name: z.string().trim().min(1).max(CATALOG_NAME_MAX_LENGTH),
    numeric_price: z
      .number()
      .positive()
      .finite()
      // Stripe stores amounts in minor units as integers. Reject sub-cent
      // precision up-front so the DB and Stripe never disagree about the
      // price. The `1e-9` epsilon is well below the smallest representable
      // difference for a 2-decimal number that went through a JS float.
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9,
        "Price cannot have more than 2 decimal places.",
      ),
    category: z.enum(CATALOG_CATEGORIES),
    description: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .transform((value) => (value === "" ? null : value)),
    item_type: z.enum(["product", "service"]),
    duration_minutes: z.number().int().positive().nullable(),
    media: z
      .array(z.string().url())
      .min(1, "At least one image is required."),
    is_popular: z.boolean(),
    is_active: z.boolean(),
    rating: z.number().min(0).max(5).nullable(),
  })
  .refine(
    (value) =>
      value.item_type === "service"
        ? value.duration_minutes !== null
        : value.duration_minutes === null,
    {
      message:
        "duration_minutes is required for services and must be empty for products.",
      path: ["duration_minutes"],
    },
  );

export type CatalogItemInput = z.infer<typeof catalogItemInputSchema>;

/**
 * Row shape passed to the DB.
 *
 * Deliberately omits `price`: trg_catalog_price_display derives it from
 * numeric_price on every insert/update, so writing it here would be
 * overwritten anyway. Also omits stripe_product_id / stripe_price_id, which
 * are set by the Stripe sync step, not by the caller.
 */
export function toRow(parsed: CatalogItemInput) {
  return {
    name: parsed.name,
    numeric_price: parsed.numeric_price,
    category: parsed.category,
    description: parsed.description,
    item_type: parsed.item_type,
    duration_minutes: parsed.duration_minutes,
    media: parsed.media,
    is_popular: parsed.is_popular,
    is_active: parsed.is_active,
    rating: parsed.rating,
  };
}
