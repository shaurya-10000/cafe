import { toMinorUnits } from "@/lib/server/admin/money";
import { SITE_URL } from "@/lib/server/admin/siteUrl";
import { stripe } from "@/lib/server/admin/stripe";

import type { CreatedOrder } from "./order";
import type { PricedLine } from "./pricing";

interface StripeSessionArgs {
  order: CreatedOrder;
  lines: readonly PricedLine[];
  currency: string;
  couponCode: string | undefined;
}

/**
 * Creates the hosted Stripe Checkout session for an online order and returns
 * its URL. The order's discount (computed by the DB) is mirrored as a
 * one-time Stripe coupon so the customer is charged the same total.
 */
export async function createStripeCheckoutUrl({
  order,
  lines,
  currency,
  couponCode,
}: StripeSessionArgs): Promise<string> {
  let stripeCouponId: string | undefined;

  if (order.discount_amount > 0) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: toMinorUnits(order.discount_amount),
      currency,
      duration: "once",
      name: couponCode
        ? `Coupon: ${couponCode.trim().toUpperCase()}`
        : "Discount",
    });

    stripeCouponId = stripeCoupon.id;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lines.map((line) => ({
      price_data: {
        currency,
        product_data: { name: line.name },
        unit_amount: line.unitAmountMinor,
      },
      quantity: line.quantity,
    })),
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    mode: "payment",
    success_url: `${SITE_URL}/success?id=${order.id}`,
    cancel_url: `${SITE_URL}/success?id=${order.id}&cancelled=1`,

    client_reference_id: order.id,
    metadata: { order_id: order.id },
    payment_intent_data: { metadata: { order_id: order.id } },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  return session.url;
}
