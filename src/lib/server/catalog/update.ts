import type { CatalogItem } from "@/types/catalog";
import { getBusinessCurrency } from "@/lib/server/admin/currency";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import { NOT_AUTHORIZED, isCallerAdmin } from "./guard";
import { catalogItemInputSchema, toRow, type CatalogItemInput } from "./schema";
import { revalidateCatalog, toErrorResult } from "./results";
import { syncAndPersistStripe } from "./stripeSync";
import type { CatalogActionResult } from "./types";

const FAILURE = "Couldn't update this item.";

export async function updateItem(
  id: string,
  input: CatalogItemInput,
): Promise<CatalogActionResult> {
  let parsed: CatalogItemInput;

  try {
    parsed = catalogItemInputSchema.parse(input);
  } catch (err) {
    return toErrorResult(err, FAILURE);
  }

  try {
    // Admin gate first: nothing below runs for a non-admin caller.
    if (!(await isCallerAdmin())) return { ok: false, error: NOT_AUTHORIZED };

    // Current Stripe ids + price decide whether a new Stripe price is needed.
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("catalog_items")
      .select("stripe_product_id, stripe_price_id, numeric_price")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[updateItem] failed to load current item:", fetchError);
      return { ok: false, error: "Couldn't load the current item." };
    }

    if (!existing) return { ok: false, error: "Item not found." };

    const currency = await getBusinessCurrency();

    const { data: updated, error } = await supabaseAdmin
      .from("catalog_items")
      .update(toRow(parsed))
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    const synced = await syncAndPersistStripe({
      itemId: id,
      existing: {
        stripe_product_id: existing.stripe_product_id ?? null,
        stripe_price_id: existing.stripe_price_id ?? null,
        numeric_price: Number(existing.numeric_price),
      },
      parsed,
      currency,
      failureMessage:
        "[catalogActions] Stripe sync failed for updated item - DB row updated, Stripe ids may be stale",
    });

    revalidateCatalog();

    return { ok: true, item: synced ?? (updated as CatalogItem) };
  } catch (err) {
    console.error("[updateItem] failed:", err);
    return toErrorResult(err, FAILURE);
  }
}