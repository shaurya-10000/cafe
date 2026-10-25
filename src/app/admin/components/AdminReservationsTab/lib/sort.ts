import type { AdminBookingStatus, RawAdminBooking } from "../types";
import { normalizeAdminStatus } from "./status";

const STATUS_ORDER: Record<AdminBookingStatus, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
};

function whenKey(booking: RawAdminBooking): string {
  return `${booking.booking_date ?? ""} ${booking.booking_time ?? ""}`;
}

/**
 * Needs-attention first: pending, then confirmed (soonest first), then the
 * finished ones (most recent first).
 */
export function compareBookings(
  left: RawAdminBooking,
  right: RawAdminBooking,
): number {
  const leftStatus = normalizeAdminStatus(left.status);
  const rightStatus = normalizeAdminStatus(right.status);

  if (leftStatus !== rightStatus) {
    return STATUS_ORDER[leftStatus] - STATUS_ORDER[rightStatus];
  }

  const leftKey = whenKey(left);
  const rightKey = whenKey(right);

  if (leftKey === rightKey) return 0;

  const order = leftKey < rightKey ? -1 : 1;
  const isFinished = leftStatus === "completed" || leftStatus === "cancelled";

  return isFinished ? -order : order;
}