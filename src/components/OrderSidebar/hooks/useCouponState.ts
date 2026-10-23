import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import type { AppliedCoupon } from "@/components/GamesAndRewards";

import { COUPON_INVALIDATED_MESSAGE } from "../constants";

export interface UseCouponStateResult {
  appliedCoupon: AppliedCoupon | null;
  discountAmount: number;
  displayTotal: number;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
}

interface AppliedState {
  coupon: AppliedCoupon;
  /** The subtotal the discount was computed for. */
  subtotal: number;
}

/**
 * Tracks the applied coupon and drops it as soon as the cart subtotal changes
 * (the discount was computed for a specific subtotal).
 */
export function useCouponState(subtotal: number): UseCouponStateResult {
  const [applied, setApplied] = useState<AppliedState | null>(null);
  const [invalidations, setInvalidations] = useState(0);

  // The subtotal moved under an applied coupon: drop it. Adjusted during render
  // (guarded, so it settles after one pass) instead of from an effect.
  if (applied !== null && applied.subtotal !== subtotal) {
    setApplied(null);
    setInvalidations((count) => count + 1);
  }

  // The toast is a side effect, so it stays in an effect, but it only reads
  // state; it never sets any.
  useEffect(() => {
    if (invalidations > 0) toast.error(COUPON_INVALIDATED_MESSAGE);
  }, [invalidations]);

  const appliedCoupon =
    applied !== null && applied.subtotal === subtotal ? applied.coupon : null;

  const applyCoupon = useCallback(
    (coupon: AppliedCoupon) => {
      setApplied({ coupon, subtotal });
    },
    [subtotal],
  );

  const removeCoupon = useCallback(() => {
    setApplied(null);
  }, []);

  return {
    appliedCoupon,
    discountAmount: appliedCoupon?.discountAmount ?? 0,
    displayTotal: appliedCoupon?.finalTotal ?? subtotal,
    applyCoupon,
    removeCoupon,
  };
}