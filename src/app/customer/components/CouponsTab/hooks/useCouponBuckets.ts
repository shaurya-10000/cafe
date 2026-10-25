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
 * Single pass: "active" coupons vs. everything else (the archive). Active
 * ones are listed soonest-to-expire first so the urgent ones are on top.
 */
export function useCouponBuckets(coupons: readonly Coupon[]): CouponBuckets {
  return useMemo(() => {
    const buckets: CouponBuckets = { active: [], archived: [] };

    for (const coupon of coupons) {
      if (deriveCouponStatus(coupon) === "active") {
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
  }, [coupons]);
}