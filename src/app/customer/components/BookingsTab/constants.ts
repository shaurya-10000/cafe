import type { BookingStatus } from "./types";

export const BOOKING_STEPS = ["pending", "confirmed", "completed"] as const;

export const VALID_STATUSES: ReadonlySet<string> = new Set<BookingStatus>([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

/**
 * Statuses from which a customer may still cancel. Once a booking is
 * completed or already cancelled, cancellation is a no-op.
 */
export const CANCELLABLE_STATUSES: ReadonlySet<BookingStatus> =
  new Set<BookingStatus>(["pending", "confirmed"]);

export const CANCEL_ERROR_TIMEOUT_MS = 5_000;

export const SIGN_IN_AGAIN_MESSAGE =
  "Please sign in again to cancel this booking.";
export const CANCEL_FAILED_MESSAGE =
  "Couldn't cancel that booking. Please try again.";

export const NO_DATE_LABEL = "No Date";
export const NO_TIME_LABEL = "No Time";

export const SKELETON_KEYS = [0, 1, 2] as const;

export const PROGRESS_SPRING = {
  type: "spring",
  stiffness: 50,
  damping: 15,
} as const;