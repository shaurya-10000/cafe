import type { CouponFormData } from "./types";

// The database enforces its own constraints too (coupons_percentage_limit,
// coupons_date_order, normalize_coupon_code's non-empty check, the unique
// index on code). This validates the same rules up front purely so the admin
// gets an immediate, specific message instead of a raw constraint violation.

/** Returns the first validation error, or `null` when the form is valid. */
export function validateCouponInput(form: CouponFormData): string | null {
  if (!form.code.trim()) return "Code is required.";

  if (!Number.isFinite(form.discount_value) || form.discount_value <= 0) {
    return "Discount value must be greater than 0.";
  }

  if (form.discount_type === "percentage" && form.discount_value > 100) {
    return "Percentage discount cannot exceed 100.";
  }

  if (form.min_order_amount < 0) {
    return "Minimum order amount cannot be negative.";
  }

  if (form.max_discount_amount !== null && form.max_discount_amount <= 0) {
    return "Max discount must be greater than 0.";
  }

  if (form.usage_limit !== null && form.usage_limit <= 0) {
    return "Usage limit must be greater than 0.";
  }

  if (Number.isNaN(new Date(form.starts_at).getTime())) {
    return "Start date is invalid.";
  }

  if (form.expires_at) {
    const expires = new Date(form.expires_at);

    if (Number.isNaN(expires.getTime())) return "Expiry date is invalid.";

    if (expires <= new Date(form.starts_at)) {
      return "Expiry must be after the start date.";
    }
  }

  return null;
}

export function toCouponRow(form: CouponFormData) {
  return {
    // The DB's normalize_coupon_code trigger also uppercases/trims on insert
    // or update of `code`. This is harmless duplication, not load-bearing,
    // kept so the admin sees the normalized value without waiting on a refetch.
    code: form.code.trim().toUpperCase(),
    discount_type: form.discount_type,
    discount_value: form.discount_value,
    min_order_amount: form.min_order_amount,
    max_discount_amount: form.max_discount_amount,
    usage_limit: form.usage_limit,
    starts_at: new Date(form.starts_at).toISOString(),
    expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    is_active: form.is_active,
  };
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
