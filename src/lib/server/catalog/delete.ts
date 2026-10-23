import { getPostgresCode } from "@/lib/server/admin/errors";
import { stripe } from "@/lib/server/admin/stripe";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import { NOT_AUTHORIZED, isCallerAdmin } from "./guard";
import { revalidateCatalog } from "./results";
import type { DeleteCatalogItemResult } from "./types";

export async function deleteItem(id: string): Promise<DeleteCatalogItemResult> {
  try {
    if (!(await isCallerAdmin())) return { ok: false, error: NOT_AUTHORIZED };

    // Read the media list and Stripe id first. Media is returned to the
    // caller so it can clean up Storage objects: this action deliberately
    // doesn't touch Storage itself, since the browser client already holds
    // admin-scoped storage RLS access and knows whether a URL is still
    // referenced elsewhere. The Stripe product is archived best-effort.
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("catalog_items")
      .select("media, stripe_product_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabaseAdmin
      .from("catalog_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Best-effort Stripe archive. The Supabase delete is what controls
    // purchasability in this app; a failed archive leaves the product
    // visible in the Stripe dashboard, which is cosmetic.
    if (existing?.stripe_product_id) {
      try {
        await stripe.products.update(existing.stripe_product_id, {
          active: false,
        });
      } catch (stripeErr) {
        console.error(
          "[catalogActions] failed to archive Stripe product after delete",
          { itemId: id, stripeProductId: existing.stripe_product_id },
          stripeErr,
        );
      }
    }

    revalidateCatalog();

    return { ok: true, media: (existing?.media ?? []) as string[] };
  } catch (err) {
    // reviews.catalog_item_id and bookings.catalog_item_id are ON DELETE
    // RESTRICT, so 23503 (foreign key violation) is the expected failure for
    // an item with order/booking/review history. A code check is stable
    // across locales and Postgres versions; the message text is not.
    if (getPostgresCode(err) === "23503") {
      return {
        ok: false,
        error:
          "Couldn't delete this item \u2014 it's still referenced by existing " +
          "orders, bookings, or reviews. Mark it inactive instead.",
      };
    }

    console.error("[deleteItem] failed:", err);

    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Couldn't delete this item. Please try again.",
    };
  }
}