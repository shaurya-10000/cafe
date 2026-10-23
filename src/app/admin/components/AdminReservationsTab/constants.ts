import type { AdminBookingStatus, BookingAction } from "./types";

export const VALID_STATUSES: ReadonlySet<string> = new Set<AdminBookingStatus>([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const ALLOWED_TRANSITIONS: Record<
  AdminBookingStatus,
  readonly AdminBookingStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed"],
  completed: [],
  cancelled: [],
};

export const ACTION_TARGET_STATUS: Record<BookingAction, AdminBookingStatus> = {
  confirm: "confirmed",
  reject: "cancelled",
  complete: "completed",
};

/**
 * Inverse of `ACTION_TARGET_STATUS`. The AI sends the target STATUS
 * ("confirmed"), not the ACTION ("confirm"); "pending" has no action because
 * nothing can transition back to it.
 */
export const STATUS_TO_ACTION: Partial<
  Record<AdminBookingStatus, BookingAction>
> = {
  confirmed: "confirm",
  cancelled: "reject",
  completed: "complete",
};

export const ACTION_LABELS: Record<BookingAction, string> = {
  confirm: "Confirm Booking",
  reject: "Reject",
  complete: "Complete Visit",
};

/**
 * Delay before the AI-driven status change fires, in milliseconds.
 *
 * The chat widget does a `router.push("/admin?tab=reservations")` when the
 * admin confirms an AI-proposed mutation. That navigation has to settle
 * (this tab mounts, its `bookings` prop populates) before we can look up the
 * target booking and issue the update. 400ms is enough on a warm client; on
 * a cold one the booking lookup will simply miss and surface a clear
 * "booking was not found" toast instead of silently doing nothing.
 */
export const AI_ACTION_SETTLE_MS = 400;

export const SKELETON_CARD_COUNT = 4;

export const NO_DATE_LABEL = "No Date";
export const NO_TIME_LABEL = "No Time";
export const DEFAULT_GUEST_NAME = "Guest";
export const NO_EMAIL_LABEL = "No email on file";
