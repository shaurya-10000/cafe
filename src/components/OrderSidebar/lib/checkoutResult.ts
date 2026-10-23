import { toast } from "sonner";

import type { processCheckout } from "@/app/admin/actions";

import { CHECKOUT_ERROR_FALLBACK } from "../constants";

export type CheckoutResult = Awaited<ReturnType<typeof processCheckout>>;

/**
 * ProcessCheckoutResult is a 3-arm union:
 *   { success: true; orderId: string }  - in-person, order placed
 *   { success: false; error: string }   - failure
 *   { url: string }                     - online, Stripe Checkout
 *
 * The online arm has NO `success` discriminant, so it is narrowed by
 * elimination: after handling both `success` arms, the only remaining shape
 * is `{ url: string }`.
 */
export function handleCheckoutResult(result: CheckoutResult): void {
  if ("success" in result) {
    if (result.success) {
      window.location.href = `/success?id=${result.orderId}`;
      return;
    }

    toast.error(result.error || CHECKOUT_ERROR_FALLBACK);
    return;
  }

  // Online payment: redirect to the Stripe-hosted checkout.
  window.location.href = result.url;
}
