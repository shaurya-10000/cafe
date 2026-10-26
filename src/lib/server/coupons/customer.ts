import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/utils/supabase/server";

import type { Coupon, ValidateCouponResult } from "./types";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Placeholder for fields list_my_redeemable_coupons() does not return. */
const UNKNOWN_DATE = "1970-01-01T00:00:00.000Z";

/** validate_coupon_code raises this when a customer tries too many codes. */
const RATE_LIMIT_CODE = "23514";

interface RedeemableRow {
  id: string;
  code: string;
  discount_type: Coupon["discount_type"];
  discount_value: number | string;
  min_order_amount: number | string;
  max_discount_amount: number | string | null;
  expires_at: string | null;
}

/**
 * Customers cannot read the coupons table directly (only admins can), so the
 * list comes from list_my_redeemable_coupons(): the coupons this customer can
 * still use right now, honoring the per-customer limit.
 */
export async function listCustomerCoupons(): Promise<Coupon[]> {
  const { userId } = await auth();

  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("list_my_redeemable_coupons");

  if (error) {
    console.error(
      "[couponActions] getCustomerCoupons failed",
      { userId, code: error.code },
      error,
    );

    return [];
  }

  return ((data ?? []) as RedeemableRow[]).map(
    (row): Coupon => ({
      id: String(row.id),
      code: row.code,
      discount_type: row.discount_type,
      discount_value: Number(row.discount_value),
      min_order_amount: Number(row.min_order_amount),
      max_discount_amount:
        row.max_discount_amount === null ? null : Number(row.max_discount_amount),
      usage_limit: null,
      used_count: 0,
      starts_at: UNKNOWN_DATE,
      expires_at: row.expires_at,
      is_active: true,
      created_at: UNKNOWN_DATE,
      updated_at: UNKNOWN_DATE,
    }),
  );
}

/**
 * validate_coupon_code() returns no row when a code cannot be used. Work out
 * the most helpful reason from the list of coupons this customer can redeem.
 */
async function explainRejection(
  supabase: ServerClient,
  code: string,
  subtotal: number,
): Promise<string> {
  const { data } = await supabase.rpc("list_my_redeemable_coupons");

  const match = ((data ?? []) as RedeemableRow[]).find(
    (row) => row.code === code,
  );

  if (match && subtotal < Number(match.min_order_amount)) {
    return `This code requires a minimum order of $${Number(
      match.min_order_amount,
    ).toFixed(2)}.`;
  }

  return "This coupon is invalid, expired or already used.";
}

/**
 * Customer-facing preview only. Deliberately does NOT require admin: it is
 * called by ordinary signed-in customers from the cart. The order trigger
 * still recomputes and enforces the discount when the order is placed.
 */
export async function previewCoupon(
  rawCode: string,
  subtotal: number,
): Promise<ValidateCouponResult> {
  const { userId } = await auth();

  if (!userId) {
    return { valid: false, error: "Please sign in to apply a coupon." };
  }

  // Mirrors normalize_coupon_code's own upper(btrim(...)).
  const code = rawCode.trim().toUpperCase();

  if (!code) return { valid: false, error: "Enter a coupon code." };

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { valid: false, error: "Your cart is empty." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("validate_coupon_code", {
    p_code: code,
    p_subtotal: subtotal,
  });

  if (error) {
    console.error(
      "[couponActions] validateCoupon failed",
      { userId, code: error.code },
      error,
    );

    return {
      valid: false,
      error:
        error.code === RATE_LIMIT_CODE
          ? error.message
          : "Couldn't validate that code. Please try again.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return {
      valid: false,
      error: await explainRejection(supabase, code, subtotal),
    };
  }

  const discountAmount = Number(row.discount_amount);

  if (!Number.isFinite(discountAmount)) {
    return { valid: false, error: "Couldn't validate that code. Please try again." };
  }

  return {
    valid: true,
    couponId: String(row.coupon_id),
    code,
    discountAmount,
    finalTotal: Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100),
  };
}