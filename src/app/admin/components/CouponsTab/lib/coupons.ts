import type { Coupon } from "@/app/admin/actions/couponActions";
import { deriveCouponStatus } from "@/lib/coupons/calculate";

export function splitCoupons(coupons: readonly Coupon[]): {
  active: Coupon[];
  inactive: Coupon[];
} {
  const active: Coupon[] = [];
  const inactive: Coupon[] = [];

  for (const coupon of coupons) {
    (coupon.is_active ? active : inactive).push(coupon);
  }

  return { active, inactive };
}

/** Coupons that can be redeemed right now (not scheduled, expired, or used up). */
export function countRedeemable(coupons: readonly Coupon[]): number {
  return coupons.filter((coupon) => deriveCouponStatus(coupon) === "active")
    .length;
}
