import type { Coupon, CouponStatus } from "@/app/admin/actions/couponActions";

export type { Coupon, CouponStatus };

/** Row shape of public.user_claimed_rewards (a snapshot taken at claim time). */
export interface ClaimedRewardRow {
  id: string;
  promo_code: string;
  title: string;
  discount_value: string;
  claimed_at: string;
}

export interface DisplayDiscount {
  type: "percentage" | "fixed";
  value: number;
}

export type CouponVariant = "active" | "archived";

export interface CouponBuckets {
  active: Coupon[];
  archived: Coupon[];
}