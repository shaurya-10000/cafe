import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";

import { getBusinessCurrency } from "@/lib/server/admin/currency";
import { errorMessage } from "@/lib/server/admin/errors";

import type { ProcessCheckoutInput, ProcessCheckoutResult } from "../types";
import { resolveCouponId } from "./coupon";
import { insertOrder } from "./order";
import { priceCartItems } from "./pricing";
import { createStripeCheckoutUrl } from "./stripeSession";
import { validateCheckoutInput } from "./validate";

function fail(error: string): ProcessCheckoutResult {
  return { success: false, error };
}

/**
 * Places an order. Online payments return a Stripe Checkout URL; in-person
 * payments return the new order id.
 *
 * Steps: authenticate -> validate input -> price the cart from the catalog
 * -> resolve the coupon -> insert the order (DB computes totals) -> for
 * online payments, create the Stripe session.
 */
export async function processCheckout(
  data: ProcessCheckoutInput,
): Promise<ProcessCheckoutResult> {
  const { userId } = await auth();

  if (!userId) {
    return fail("Authentication required to place an order. Please sign in.");
  }

  const invalid = validateCheckoutInput(data);

  if (invalid) return fail(invalid);

  try {
    const currency = await getBusinessCurrency();
    const lines = await priceCartItems(data.cartItems);

    const coupon = await resolveCouponId(data.couponCode);

    if (!coupon.ok) return fail(coupon.error);

    const inserted = await insertOrder({
      userId,
      input: data,
      lines,
      couponId: coupon.couponId,
    });

    if (!inserted.ok) return fail(inserted.error);

    if (data.paymentMethod === "online") {
      const url = await createStripeCheckoutUrl({
        order: inserted.order,
        lines,
        currency,
        couponCode: data.couponCode,
      });

      return { url };
    }

    revalidatePath("/admin");

    return { success: true, orderId: inserted.order.id };
  } catch (err) {
    console.error(
      "[adminActions] checkout failed",
      {
        userId,
        itemCount: data.cartItems?.length ?? 0,
        paymentMethod: data.paymentMethod,
      },
      err,
    );

    return fail(errorMessage(err));
  }
}
