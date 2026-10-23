import { authorizeCouponAdmin } from "./auth";
import { isUniqueViolation, toCouponRow, validateCouponInput } from "./validation";
import type { Coupon, CouponActionResult, CouponFormData } from "./types";

export async function listAllCoupons(): Promise<Coupon[] | null> {
  const access = await authorizeCouponAdmin();

  if (!access.ok) {
    console.error("[couponActions] getAllAdminCoupons rejected", {
      reason: access.error,
    });

    return null;
  }

  const { data, error } = await access.supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[couponActions] getAllAdminCoupons failed",
      { code: error.code },
      error,
    );

    return null;
  }

  return data as Coupon[];
}

export async function insertCoupon(
  form: CouponFormData,
): Promise<CouponActionResult> {
  const access = await authorizeCouponAdmin();

  if (!access.ok) return { success: false, error: access.error };

  const validationError = validateCouponInput(form);

  if (validationError) return { success: false, error: validationError };

  const { error } = await access.supabase.from("coupons").insert(toCouponRow(form));

  if (error) {
    console.error(
      "[couponActions] createCoupon failed",
      { code: error.code, couponCode: form.code },
      error,
    );

    if (isUniqueViolation(error)) {
      return { success: false, error: "A coupon with this code already exists." };
    }

    return { success: false, error: "Failed to create coupon." };
  }

  return { success: true };
}

export async function updateCouponById(
  id: string,
  form: CouponFormData,
): Promise<CouponActionResult> {
  const access = await authorizeCouponAdmin();

  if (!access.ok) return { success: false, error: access.error };

  const validationError = validateCouponInput(form);

  if (validationError) return { success: false, error: validationError };

  const { data, error } = await access.supabase
    .from("coupons")
    .update(toCouponRow(form))
    .eq("id", id)
    .select("id");

  if (error) {
    console.error(
      "[couponActions] updateCoupon failed",
      { couponId: id, code: error.code },
      error,
    );

    if (isUniqueViolation(error)) {
      return { success: false, error: "A coupon with this code already exists." };
    }

    return { success: false, error: "Failed to update coupon." };
  }

  // RLS filters rows it won't let you touch rather than throwing: an empty
  // result means the coupon didn't exist (the permission case is already
  // caught by the admin gate, but this also guards a stale id).
  if (!data || data.length === 0) return { success: false, error: "Coupon not found." };

  return { success: true };
}

interface SetActiveOptions {
  /** Logged on failure, with the coupon id. */
  logLabel: string;
  /** User-facing message when the update fails. */
  failureMessage: string;
  /** Include the requested state in the failure log (toggle only). */
  logIsActive?: boolean;
}

async function setCouponActive(
  id: string,
  isActive: boolean,
  { logLabel, failureMessage, logIsActive }: SetActiveOptions,
): Promise<CouponActionResult> {
  const access = await authorizeCouponAdmin();

  if (!access.ok) return { success: false, error: access.error };

  const { data, error } = await access.supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error(
      logLabel,
      logIsActive
        ? { couponId: id, isActive, code: error.code }
        : { couponId: id, code: error.code },
      error,
    );

    return { success: false, error: failureMessage };
  }

  if (!data || data.length === 0) return { success: false, error: "Coupon not found." };

  return { success: true };
}

export function toggleCouponActive(
  id: string,
  isActive: boolean,
): Promise<CouponActionResult> {
  return setCouponActive(id, isActive, {
    logLabel: "[couponActions] toggleCoupon failed",
    failureMessage: "Failed to update coupon status.",
    logIsActive: true,
  });
}

/**
 * Soft-delete: the coupons table has no deleted_at column, so this simply
 * disables the coupon, identical in effect to toggling it off. Kept as its
 * own action so the confirmation copy and intent stay distinct from a
 * routine pause/resume.
 */
export function softDeleteCoupon(id: string): Promise<CouponActionResult> {
  return setCouponActive(id, false, {
    logLabel: "[couponActions] deleteCoupon failed",
    failureMessage: "Failed to delete coupon.",
  });
}
