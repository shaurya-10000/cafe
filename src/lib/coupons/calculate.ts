import type { Coupon, CouponStatus } from "@/app/admin/actions/couponActions";

export function deriveCouponStatus(coupon: Coupon): CouponStatus {
  if (!coupon.is_active) return "disabled";
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return "scheduled";
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return "expired";
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) return "used_up";
  return "active";
}
