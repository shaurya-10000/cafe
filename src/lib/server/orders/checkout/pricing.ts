import { toMinorUnits } from "@/lib/server/admin/money";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import type { CheckoutCartItem } from "../types";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;

export interface PricedLine {
  item_id: string;
  name: string;
  quantity: number;
  /** Authoritative unit price from the catalog, in minor units. */
  unitAmountMinor: number;
}

/** Whole number in [1, 100], or `null` if the value is not a finite number. */
export function normalizeQuantity(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  return Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, Math.floor(value)));
}

/**
 * Resolves every cart line against the live catalog. Prices always come from
 * the database, never from the client; the client only supplies ids and
 * quantities. Throws if an item is inactive/missing or a quantity is invalid.
 */
export async function priceCartItems(
  cartItems: readonly CheckoutCartItem[],
): Promise<PricedLine[]> {
  const itemIds = cartItems.map((item) => item.id);

  const { data: catalogRows, error } = await supabaseAdmin
    .from("catalog_items")
    .select("id, name, numeric_price")
    .eq("is_active", true)
    .in("id", itemIds);

  if (error || !catalogRows) throw new Error("Failed to fetch catalog items.");

  const rowsById = new Map(catalogRows.map((row) => [String(row.id), row]));

  return cartItems.map((cartItem) => {
    const row = rowsById.get(cartItem.id);

    if (!row) throw new Error(`Item ${cartItem.id} is no longer available.`);

    const quantity = normalizeQuantity(cartItem.quantity);

    if (quantity === null) throw new Error(`Invalid quantity for ${row.name}.`);

    return {
      item_id: String(row.id),
      name: String(row.name),
      quantity,
      unitAmountMinor: toMinorUnits(Number(row.numeric_price)),
    };
  });
}
