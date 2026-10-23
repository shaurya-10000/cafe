// Field names match the real public.coupons table exactly (see supabase.sql).

export type DiscountType = "percentage" | "fixed";

export type CouponStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "disabled"
  | "used_up";

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponFormData {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface CouponActionResult {
  success: boolean;
  error?: string;
}

export type ValidateCouponResult =
  | {
      valid: true;
      couponId: string;
      code: string;
      discountAmount: number;
      finalTotal: number;
    }
  | { valid: false; error: string };
