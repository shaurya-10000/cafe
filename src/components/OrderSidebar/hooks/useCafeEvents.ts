import { useEffect } from "react";

import { EVENTS } from "../constants";
import type { CheckoutPrefillDetail } from "../types";
import { useLatestRef } from "./useLatestRef";

interface UseCafeEventsOptions {
  onPrefillCheckout: (detail: CheckoutPrefillDetail | undefined) => void;
  onApplyCoupon: (code: string) => void;
}

/** Bridges the Cafe assistant's window events to sidebar actions. */
export function useCafeEvents({
  onPrefillCheckout,
  onApplyCoupon,
}: UseCafeEventsOptions): void {
  const onPrefillCheckoutRef = useLatestRef(onPrefillCheckout);
  const onApplyCouponRef = useLatestRef(onApplyCoupon);

  useEffect(() => {
    const handlePrefillCheckout = (event: Event): void => {
      const detail = (event as CustomEvent<CheckoutPrefillDetail | undefined>)
        .detail;

      onPrefillCheckoutRef.current(detail ?? undefined);
    };

    const handleApplyCoupon = (event: Event): void => {
      const code = (event as CustomEvent<{ code?: unknown }>).detail?.code;

      if (typeof code !== "string" || !code.trim()) return;

      onApplyCouponRef.current(code.trim().toUpperCase());
    };

    window.addEventListener(EVENTS.PREFILL_CHECKOUT, handlePrefillCheckout);
    window.addEventListener(EVENTS.APPLY_COUPON, handleApplyCoupon);

    return () => {
      window.removeEventListener(
        EVENTS.PREFILL_CHECKOUT,
        handlePrefillCheckout,
      );
      window.removeEventListener(EVENTS.APPLY_COUPON, handleApplyCoupon);
    };
  }, [onApplyCouponRef, onPrefillCheckoutRef]);
}
