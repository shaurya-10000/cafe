export const DEFAULT_ACCENT_GRADIENT =
  "bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#A67C00]";

/**
 * Fallback cooldown applied when a 503 response has no usable `Retry-After`
 * header. Shorter than the rate-limit fallback because a transient upstream
 * overload typically clears faster than a full rate-limit window.
 */
export const UPSTREAM_503_FALLBACK_RETRY_AFTER_SECONDS = 5;

/**
 * sessionStorage key prefix for the pending slot-fill state. Scoped per
 * storageKey so the customer and admin widgets never share pending contexts.
 */
export const PENDING_ACTION_STORAGE_PREFIX = "cafe_pending_action:";

export const HISTORY_SIDEBAR_ID = "chat-history-sidebar";
export const HISTORY_SIDEBAR_WIDTH_PX = 220;

export const MAX_GENERATED_TITLE_LENGTH = 120;

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const MENU_GAP_PX = 6;
export const MENU_VIEWPORT_PADDING_PX = 8;
export const MENU_Z_INDEX = 10010;

export const DIALOG_SPRING = {
  type: "spring",
  damping: 30,
  stiffness: 300,
} as const;

export const MESSAGES = {
  rateLimited: "Rate limit reached. Please wait before sending more messages.",
  overloaded:
    "The assistant is temporarily overloaded. Please try again in a few seconds.",
  connectFailed: "Unable to connect right now. Please try again.",
  slotRetry: "Something went wrong \u2014 could you try that request again?",
} as const;