"use client";

import { useMemo } from "react";

import { deriveCouponStatus } from "@/lib/coupons/calculate";

import type { Coupon, CouponBuckets } from "../types";

function expiryKey(coupon: Coupon): number {
  if (!coupon.expires_at) return Number.POSITIVE_INFINITY;

  const time = new Date(coupon.expires_at).getTime();

  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

/**
 * Single pass: coupons this customer can use now vs. everything else (the
 * archive). A coupon that is live in general but that this customer can no
 * longer redeem (for example, already used) goes to the archive too. Active
 * ones are listed soonest-to-expire first.
 */
export function useCouponBuckets(
  coupons: readonly Coupon[],
  unavailableCodes: ReadonlySet<string>,
): CouponBuckets {
  return useMemo(() => {
    const buckets: CouponBuckets = { active: [], archived: [] };

    for (const coupon of coupons) {
      const isUsable =
        deriveCouponStatus(coupon) === "active" &&
        !unavailableCodes.has(coupon.code.toUpperCase());

      if (isUsable) {
        buckets.active.push(coupon);
      } else {
        buckets.archived.push(coupon);
      }
    }

    buckets.active.sort((left, right) => {
      const leftKey = expiryKey(left);
      const rightKey = expiryKey(right);

      return leftKey === rightKey ? 0 : leftKey < rightKey ? -1 : 1;
    });

    return buckets;
  }, [coupons, unavailableCodes]);
}