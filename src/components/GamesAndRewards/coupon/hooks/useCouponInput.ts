import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMounted } from "../../hooks/useIsMounted";
import { validateCouponCode } from "../api/validateCouponCode";
import { COUPON_APPLY_EVENT, COUPON_CHECK_ERROR_MESSAGE } from "../constants";
import type { AppliedCoupon } from "../types";

interface Options {
  readonly subtotal: number;
  readonly onApply: (coupon: AppliedCoupon) => void;
  readonly onRemove: () => void;
}

export function useCouponInput({ subtotal, onApply, onRemove }: Options) {
  const isMounted = useIsMounted();
  const inFlightRef = useRef(false);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCode = useCallback(
    async (rawCode: string) => {
      const trimmed = rawCode.trim().toUpperCase();
      if (!trimmed || inFlightRef.current) return;

      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await validateCouponCode(trimmed, subtotal);
        if (!isMounted()) return;

        if (!result.valid) {
          setError(result.error);
          return;
        }

        onApply({
          couponId: result.couponId,
          code: result.code,
          discountAmount: result.discountAmount,
          finalTotal: result.finalTotal,
        });
        setCode("");
      } catch (unknownError) {
        console.error("[CouponInput] validateCoupon failed", unknownError);
        if (isMounted()) setError(COUPON_CHECK_ERROR_MESSAGE);
      } finally {
        inFlightRef.current = false;
        if (isMounted()) setLoading(false);
      }
    },
    [subtotal, onApply, isMounted],
  );

  const changeCode = useCallback((value: string) => {
    setCode(value.toUpperCase());
    setError((current) => (current ? null : current));
  }, []);

  const submit = useCallback(() => {
    void applyCode(code);
  }, [applyCode, code]);

  const remove = useCallback(() => {
    onRemove();
    setError(null);
  }, [onRemove]);

  /* ---- AI concierge ------------------------------------------------------ */

  useEffect(() => {
    const handler = (event: Event) => {
      const fromEvent = (event as CustomEvent<{ code?: unknown }>).detail?.code;
      if (typeof fromEvent !== "string") return;

      const trimmed = fromEvent.trim().toUpperCase();
      if (!trimmed) return;

      // Tell the sender the code was taken (it retries until someone does).
      event.preventDefault();

      
// Fill the visible input so the user sees what is being applied, then
      // run the actual validation.
      setCode(trimmed);
      void applyCode(trimmed);
    };

    window.addEventListener(COUPON_APPLY_EVENT, handler);
    return () => window.removeEventListener(COUPON_APPLY_EVENT, handler);
  }, [applyCode]);

  return { code, loading, error, changeCode, submit, remove };
}
