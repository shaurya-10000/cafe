import type { ClaimedRewardRow, Coupon } from "../types";
import { parseDisplayDiscount } from "./discount";

/**
 * Maps a claimed game reward to a Coupon for display.
 *
 * A claim with an unparseable discount tag is still shown: 0 is a safe
 * display value that doesn't imply a real discount is being applied. Actual
 * redemption is handled by the coupon/discount system, not by the type/value
 * inferred here.
 */
export function claimToCoupon(claim: ClaimedRewardRow): Coupon {
  const { type, value } = parseDisplayDiscount(claim.discount_value) ?? {
    type: "fixed" as const,
    value: 0,
  };

  return {
    id: claim.id,
    code: claim.promo_code,
    discount_type: type,
    discount_value: value,
    min_order_amount: 0,
    max_discount_amount: null,
    usage_limit: null,
    used_count: 0,
    starts_at: claim.claimed_at,
    // Claimed rewards don't expire and are always usable once claimed: the
    // terms were snapshotted at claim time by claim_game_reward(), so this
    // stays honored even if the admin later edits or pauses the live game.
    expires_at: null,
    is_active: true,
    created_at: claim.claimed_at,
    updated_at: claim.claimed_at,
  };
}

/**
 * Appends claimed-reward coupons to the real ones, skipping any whose code
 * already exists. Set-based lookup keeps this O(n).
 */
export function mergeCoupons(
  realCoupons: readonly Coupon[],
  rewardCoupons: readonly Coupon[],
): Coupon[] {
  const merged = [...realCoupons];
  const existingCodes = new Set(merged.map((coupon) => coupon.code));

  for (const reward of rewardCoupons) {
    if (existingCodes.has(reward.code)) continue;
    merged.push(reward);
    existingCodes.add(reward.code);
  }

  return merged;
}