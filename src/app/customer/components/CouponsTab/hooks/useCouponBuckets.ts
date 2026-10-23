"use client";

import { useMemo } from "react";

import { deriveCouponStatus } from "@/lib/coupons/calculate";

import type { Coupon, CouponBuckets } from "../types";

/** Single pass: "active" coupons vs. everything else (the archive). */
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

    return buckets;
  }, [coupons]);
}