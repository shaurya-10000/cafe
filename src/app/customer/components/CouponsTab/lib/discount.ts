import type { Coupon, DisplayDiscount } from "../types";

/**
 * game_rewards.discount_value (and its snapshot on user_claimed_rewards) is a
 * free-text display tag (e.g. "20%" or "$5"), not a typed discount. This
 * infers the closest Coupon-shaped type/value for display purposes only; it
 * never feeds back into redemption.
 *
 * Returns null when the raw string has no numeric component, so the caller
 * decides how to render an unparseable tag rather than silently showing "0%".
 */
export function parseDisplayDiscount(raw: string): DisplayDiscount | null {
  const numeric = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return null;

  return raw.includes("%")
    ? { type: "percentage", value: numeric }
    : { type: "fixed", value: numeric };
}

/**
 * A coupon's face value for display, e.g. "20% OFF" or "$5 OFF". Shared by
 * the active and archived cards so they can never disagree about how a $5
 * coupon renders.
 */
export function formatDiscountLabel(coupon: Coupon): string {
  return coupon.discount_type === "percentage"
    ? `${coupon.discount_value}% OFF`
    : `$${coupon.discount_value} OFF`;
}