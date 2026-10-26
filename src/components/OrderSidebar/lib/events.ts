import { toast } from "sonner";

import { COUPON_APPLY_EVENT } from "@/components/GamesAndRewards/coupon/constants";

const RETRY_INTERVAL_MS = 50;
const MAX_ATTEMPTS = 20;

/**
 * One delivery attempt. The coupon input calls `preventDefault()` when it
 * takes the code, which makes `dispatchEvent` return false.
 */
function tryDeliver(code: string): boolean {
  const event = new CustomEvent(COUPON_APPLY_EVENT, {
    detail: { code },
    cancelable: true,
  });
  return !window.dispatchEvent(event);
}

/**
 * Hands a coupon code to the cart's coupon input. The input only exists once
 * the cart is open and holds items, and its listener attaches a moment after
 * it mounts, so delivery retries briefly instead of firing once and hoping.
 * If nobody takes the code, the user is told why.
 */
export function dispatchCouponInputApply(code: string): void {
  let attempts = 0;

  const attempt = (): void => {
    if (tryDeliver(code)) return;

    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      toast.error(
        "Couldn't apply that coupon. Add an item to your cart, then try again.",
      );
      return;
    }

    window.setTimeout(attempt, RETRY_INTERVAL_MS);
  };

  attempt();
}
