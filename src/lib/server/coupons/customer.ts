import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/utils/supabase/server";

import { calculateCouponPreview } from "./preview";
import type { Coupon, ValidateCouponResult } from "./types";

/**
 * coupons_select_redeemable RLS already restricts this to active coupons
 * within their start/expiry window and under their usage limit. This just
 * runs the plain query through the caller's own authenticated client and
 * lets that policy do the filtering, rather than reimplementing the same
 * logic in JS where it could drift out of sync with the actual policy.
 */
export async function listCustomerCoupons(): Promise<Coupon[]> {
  const { userId } = await auth();

  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[couponActions] getCustomerCoupons failed",
      { userId, code: error.code },
      error,
    );

    return [];
  }

  return (data ?? []) as Coupon[];
}

/**
 * Customer-facing preview only. Deliberately does NOT require admin: it is
 * called by ordinary signed-in customers from the cart.
 */
export async function previewCoupon(
  rawCode: string,
  subtotal: number,
): Promise<ValidateCouponResult> {
  const { userId } = await auth();

  if (!userId) {
    return { valid: false, error: "Please sign in to apply a coupon." };
  }

  // Mirrors normalize_coupon_code's own upper(btrim(...)) so a lookup by
  // "  save10 " matches the row stored as "SAVE10".
  const code = rawCode.trim().toUpperCase();

  if (!code) return { valid: false, error: "Enter a coupon code." };

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { valid: false, error: "Your cart is empty." };
  }

  const supabase = await createClient();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, min_order_amount, max_discount_amount",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error(
      "[couponActions] validateCoupon lookup failed",
      { userId, code: error.code },
      error,
    );

    return { valid: false, error: "Couldn't validate that code. Please try again." };
  }

  // coupons_select_redeemable RLS already limits what a non-admin can even
  // see here, so a miss means the code is wrong or currently ineligible; both
  // get the same message so this cannot be used to enumerate valid codes.
  if (!coupon) return { valid: false, error: "Invalid or expired coupon code." };

  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      error: `This code requires a minimum order of $${Number(
        coupon.min_order_amount,
      ).toFixed(2)}.`,
    };
  }

  const { discountAmount, finalTotal } = calculateCouponPreview(coupon, subtotal);

  // `couponId` is what gets attached to the order at checkout
  // (orders.coupon_id): the trigger looks the coupon up by this id and
  // recomputes/enforces the discount server-side regardless of this preview.
  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    discountAmount,
    finalTotal,
  };
}
