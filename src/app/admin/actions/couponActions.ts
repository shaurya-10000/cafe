"use server";

import {
  insertCoupon,
  listAllCoupons,
  softDeleteCoupon,
  toggleCouponActive,
  updateCouponById,
} from "@/lib/server/coupons/admin";
import { listCustomerCoupons, previewCoupon } from "@/lib/server/coupons/customer";
import type {
  Coupon as CouponShape,
  CouponActionResult,
  CouponFormData as CouponFormDataShape,
  CouponStatus as CouponStatusShape,
  DiscountType as DiscountTypeShape,
  ValidateCouponResult as ValidateCouponResultShape,
} from "@/lib/server/coupons/types";

// Type-only exports are erased at compile time, so importing these into a
// client component via `import type` never pulls any server code into the
// client bundle.
export type DiscountType = DiscountTypeShape;
export type CouponStatus = CouponStatusShape;
export type Coupon = CouponShape;
export type CouponFormData = CouponFormDataShape;
export type ValidateCouponResult = ValidateCouponResultShape;

// Customer-facing -----------------------------------------------------------

export async function getCustomerCoupons(): Promise<Coupon[]> {
  return listCustomerCoupons();
}

/** Preview only: the order trigger computes the real discount. Not admin-gated. */
export async function validateCoupon(
  rawCode: string,
  subtotal: number,
): Promise<ValidateCouponResult> {
  return previewCoupon(rawCode, subtotal);
}

// Admin-facing --------------------------------------------------------------

export async function getAllAdminCoupons(): Promise<Coupon[] | null> {
  return listAllCoupons();
}

export async function createCoupon(
  form: CouponFormData,
): Promise<CouponActionResult> {
  return insertCoupon(form);
}

export async function updateCoupon(
  id: string,
  form: CouponFormData,
): Promise<CouponActionResult> {
  return updateCouponById(id, form);
}

export async function toggleCoupon(
  id: string,
  isActive: boolean,
): Promise<CouponActionResult> {
  return toggleCouponActive(id, isActive);
}

/** Soft-delete: disables the coupon (there is no deleted_at column). */
export async function deleteCoupon(id: string): Promise<CouponActionResult> {
  return softDeleteCoupon(id);
}
