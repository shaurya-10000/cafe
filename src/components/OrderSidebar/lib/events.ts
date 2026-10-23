import { EVENTS } from "../constants";

export function dispatchCouponInputApply(code: string): void {
  window.dispatchEvent(
    new CustomEvent(EVENTS.COUPON_INPUT_APPLY, { detail: { code } }),
  );
}
