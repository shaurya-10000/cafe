import type { CatalogItem } from "@/types/catalog";
import { toMinorUnits } from "@/lib/server/admin/money";
import { stripe } from "@/lib/server/admin/stripe";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import type { CatalogItemInput } from "./schema";

interface StripeRefs {
  stripe_product_id: string;
  stripe_price_id: string;
}

export interface ExistingStripeState {
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  numeric_price: number;
}

interface SyncArgs {
  existing: ExistingStripeState | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  numericPrice: number;
  currency: string;
}

/**
 * Creates or updates the Stripe product/price for a catalog item.
 *
 * Update path specifics:
 *  - Stripe products support in-place update of name/description/images, so
 *    those are just written.
 *  - Stripe *prices* are immutable. A price change means creating a new
 *    price and archiving the old one. Archiving is best-effort: a failure
 *    there doesn't block the update, since the new price is already live
 *    and the old one being active in the dashboard a few minutes longer is
 *    cosmetic, not a correctness issue.
 *
 * Returns the ids to persist on the catalog_items row.
 */
async function syncStripeForItem({
  existing,
  name,
  description,
  imageUrl,
  numericPrice,
  currency,
}: SyncArgs): Promise<StripeRefs> {
  const productFields = {
    name,
    description: description ?? undefined,
    images: imageUrl ? [imageUrl] : [],
  };

  // Create path.
  if (!existing || !existing.stripe_product_id) {
    const product = await stripe.products.create(productFields);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: toMinorUnits(numericPrice),
      currency,
    });

    return { stripe_product_id: product.id, stripe_price_id: price.id };
  }

  // Update path.
  await stripe.products.update(existing.stripe_product_id, productFields);

  const priceChanged =
    !existing.stripe_price_id ||
    toMinorUnits(existing.numeric_price) !== toMinorUnits(numericPrice);

  if (!priceChanged) {
    return {
      stripe_product_id: existing.stripe_product_id,
      stripe_price_id: existing.stripe_price_id!,
    };
  }

  const newPrice = await stripe.prices.create({
    product: existing.stripe_product_id,
    unit_amount: toMinorUnits(numericPrice),
    currency,
  });

  if (existing.stripe_price_id) {
    try {
      await stripe.prices.update(existing.stripe_price_id, { active: false });
    } catch (archiveErr) {
      console.error(
        "[catalogActions] failed to archive superseded Stripe price",
        { oldPriceId: existing.stripe_price_id },
        archiveErr,
      );
    }
  }

  return {
    stripe_product_id: existing.stripe_product_id,
    stripe_price_id: newPrice.id,
  };
}

interface SyncAndPersistArgs {
  itemId: string;
  existing: ExistingStripeState | null;
  parsed: CatalogItemInput;
  currency: string;
  /** Logged (with the item id and name) if the Stripe side fails. */
  failureMessage: string;
}

/**
 * Best-effort Stripe sync. The catalog row is already saved when this runs,
 * so a Stripe failure must not make the item unusable: it returns `null`
 * and the admin can save again to retry the Stripe side. On success the ids
 * are persisted through the service-role client and the fresh row returned.
 */
export async function syncAndPersistStripe({
  itemId,
  existing,
  parsed,
  currency,
  failureMessage,
}: SyncAndPersistArgs): Promise<CatalogItem | null> {
  try {
    const refs = await syncStripeForItem({
      existing,
      name: parsed.name,
      description: parsed.description,
      imageUrl: parsed.media[0] ?? null,
      numericPrice: parsed.numeric_price,
      currency,
    });

    const { data: finalRow, error } = await supabaseAdmin
      .from("catalog_items")
      .update(refs)
      .eq("id", itemId)
      .select("*")
      .single();

    if (error) throw error;

    return finalRow as CatalogItem;
  } catch (stripeErr) {
    console.error(
      failureMessage,
      { itemId, name: parsed.name },
      stripeErr,
    );

    return null;
  }
}
