import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

export type CouponLookup =
  | { ok: true; couponId: string | null }
  | { ok: false; error: string };

/**
 * Resolves a coupon code to its id. The coupon is NOT validated here: the
 * `validate_order_integrity` trigger decides on insert whether it is still
 * usable (active, in date, under its limits).
 */
export async function resolveCouponId(
  couponCode: string | undefined,
): Promise<CouponLookup> {
  if (!couponCode) return { ok: true, couponId: null };

  const code = couponCode.trim().toUpperCase();

  const { data: couponRow, error } = await supabaseAdmin
    .from("coupons")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error(
      "[adminActions] coupon lookup failed",
      { code: error.code },
      error,
    );

    throw new Error("Couldn't verify the coupon. Please try again.");
  }

  if (!couponRow) {
    return { ok: false, error: "Invalid or expired coupon code." };
  }

  return { ok: true, couponId: String(couponRow.id) };
}
