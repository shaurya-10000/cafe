import type { OrderView } from "./types";

export const DEFAULT_CURRENCY = "USD";

export const STATUS_STEPS = [
  "incoming",
  "preparing",
  "ready",
  "completed",
] as const;

export const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  "incoming",
  "pending",
  "approved",
  "preparing",
  "ready",
]);

export const PAST_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "declined",
  "refunded",
]);

/**
 * Fulfilment statuses offered by the in-row status menu. Kept beside the
 * constants above so a new status added to STATUS_STEPS cannot silently
 * become clickable without a deliberate change here.
 */
export const SELECTABLE_STATUSES: readonly string[] = [
  ...STATUS_STEPS,
  "declined",
];

export const DECLINED_STATUS = "declined";

/**
 * Delay before the AI-driven listeners run. The chat widget routes the
 * browser to /admin?tab=orders before dispatching, and the parent's
 * handlers must run against a mounted tab. 400ms is comfortable on a warm
 * client and imperceptible to the user.
 */
export const AI_ACTION_SETTLE_MS = 400;

export const VIEW_SUBTITLES: Record<OrderView, string> = {
  active: "Live Fulfillment",
  advanced: "Future Bookings",
  past: "History",
};

export const ITEM_PLACEHOLDERS = {
  loading: "Loading\u2026",
  unavailable: "Item unavailable",
  unknown: "Unknown item",
} as const;
