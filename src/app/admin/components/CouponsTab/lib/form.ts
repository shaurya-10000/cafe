import type { Coupon, CouponFormData } from "@/app/admin/actions/couponActions";

/**
 * A fresh "new coupon" form, built when the dialog opens (not at import
 * time, which would freeze the default start time for the whole session).
 *
 * `starts_at` / `expires_at` are `yyyy-MM-ddTHH:mm` strings. The server
 * parses them with `new Date(...)`, i.e. as UTC wall-clock time, so the
 * client slices UTC ISO strings the same way to stay consistent.
 */
export function createEmptyForm(): CouponFormData {
  return {
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: null,
    usage_limit: null,
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: null,
    is_active: true,
  };
}

export function couponToFormData(coupon: Coupon): CouponFormData {
  return {
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    min_order_amount: Number(coupon.min_order_amount),
    max_discount_amount:
      coupon.max_discount_amount != null
        ? Number(coupon.max_discount_amount)
        : null,
    usage_limit: coupon.usage_limit != null ? Number(coupon.usage_limit) : null,
    starts_at: coupon.starts_at.slice(0, 16),
    expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : null,
    is_active: coupon.is_active,
  };
}
