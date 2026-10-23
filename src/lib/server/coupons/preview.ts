interface PreviewCoupon {
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
}

/**
 * Customer-facing discount preview. NOT the authoritative calculation: that
 * happens inside the order-creation trigger in supabase.sql, which looks the
 * coupon up by id at insert time and computes discount_amount/total_amount
 * itself. This exists so the cart can show a discount and running total
 * before checkout. It mirrors that trigger exactly (percentage vs fixed, the
 * max_discount_amount cap, and the least(discount, subtotal) floor) so the
 * preview and the real charge never disagree.
 */
export function calculateCouponPreview(
  coupon: PreviewCoupon,
  subtotal: number,
): { discountAmount: number; finalTotal: number } {
  let discountAmount =
    coupon.discount_type === "percentage"
      ? Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100
      : Number(coupon.discount_value);

  if (coupon.max_discount_amount !== null && coupon.max_discount_amount !== undefined) {
    discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
  }

  // Matches `discount := least(discount, subtotal)` in the order trigger: a
  // fixed-amount coupon larger than the cart never produces a negative total.
  discountAmount = Math.min(discountAmount, subtotal);

  const finalTotal = Math.round((subtotal - discountAmount) * 100) / 100;

  return { discountAmount, finalTotal };
}
