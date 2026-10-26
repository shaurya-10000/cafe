import type { CouponStatus } from "./types";

export const STATUS_LABEL: Record<CouponStatus, string> = {
  active: "Available",
  scheduled: "Coming Soon",
  expired: "Expired",
  disabled: "Unavailable",
  used_up: "Sold Out",
};

/** Shown for a coupon that is still live but this customer can no longer redeem. */
export const USED_LABEL = "Used";

/**
 * How long the "Copied!" confirmation stays visible after a successful copy.
 * A named constant so the timeout and the button's wording can never drift.
 */
export const COPY_FEEDBACK_MS = 2_000;

export const DATE_LOCALE = "en-US";