import type { CatalogItem } from "@/types/catalog";
import { getBusinessCurrency } from "@/lib/server/admin/currency";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import { NOT_AUTHORIZED, isCallerAdmin } from "./guard";
import { catalogItemInputSchema, toRow, type CatalogItemInput } from "./schema";
import { revalidateCatalog, toErrorResult } from "./results";
import { syncAndPersistStripe } from "./stripeSync";
import type { CatalogActionResult } from "./types";

const FAILURE = "Couldn't create this item.";

export async function createItem(
  input: CatalogItemInput,
): Promise<CatalogActionResult> {
  let parsed: CatalogItemInput;

  try {
    parsed = catalogItemInputSchema.parse(input);
  } catch (err) {
    return toErrorResult(err, FAILURE);
  }

  try {
    if (!(await isCallerAdmin())) return { ok: false, error: NOT_AUTHORIZED };

    const currency = await getBusinessCurrency();

    const { data: created, error } = await supabaseAdmin
      .from("catalog_items")
      .insert(toRow(parsed))
      .select("*")
      .single();

    if (error) throw error;

    const createdItem = created as CatalogItem;

    const synced = await syncAndPersistStripe({
      itemId: createdItem.id,
      existing: null,
      parsed,
      currency,
      failureMessage:
        "[catalogActions] Stripe sync failed for new item - item created without Stripe ids",
    });

    revalidateCatalog();

    return { ok: true, item: synced ?? createdItem };
  } catch (err) {
    console.error("[createItem] failed:", err);
    return toErrorResult(err, FAILURE);
  }
}