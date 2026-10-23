import type { CheckoutFormValues } from "./types";

export const EVENTS = {
  PREFILL_CHECKOUT: "cafe_prefill_checkout",
  APPLY_COUPON: "cafe_apply_coupon",
  /** Consumed by `CouponInput` once the cart view is mounted. */
  COUPON_INPUT_APPLY: "cafe_coupon_input_apply",
} as const;

export const DEFAULT_CURRENCY = "USD";
export const PRICE_LOCALE = "en-US";

/** Delay before resetting to the cart view, so the exit animation can finish. */
export const VIEW_SWAP_RESET_MS = 300;

export const EMPTY_FAVORITE_IDS: string[] = [];

export const INITIAL_FORM_VALUES: CheckoutFormValues = {
  customerName: "",
  phone: "",
  address: "",
  orderType: "delivery",
  paymentMethod: "online",
};

export const CHECKOUT_ERROR_FALLBACK = "An error occurred during checkout.";
export const CHECKOUT_FAILURE_MESSAGE =
  "Failed to process transaction. Please try again.";
export const COUPON_INVALIDATED_MESSAGE =
  "Your cart changed \u2014 please reapply your promo code.";
