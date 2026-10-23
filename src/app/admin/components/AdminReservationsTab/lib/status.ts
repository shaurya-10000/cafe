import {
  ACTION_TARGET_STATUS,
  ALLOWED_TRANSITIONS,
  VALID_STATUSES,
} from "../constants";
import type {
  AdminBookingStatus,
  BookingAction,
  RawAdminBooking,
} from "../types";

export function normalizeAdminStatus(
  status?: string | null,
): AdminBookingStatus {
  return status && VALID_STATUSES.has(status)
    ? (status as AdminBookingStatus)
    : "pending";
}

export function isValidTransition(
  current: AdminBookingStatus,
  next: AdminBookingStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

export function getAvailableActions(status: AdminBookingStatus): BookingAction[] {
  switch (status) {
    case "pending":
      return ["confirm", "reject"];
    case "confirmed":
      return ["complete"];
    default:
      return [];
  }
}

export function getActionTargetStatus(action: BookingAction): AdminBookingStatus {
  return ACTION_TARGET_STATUS[action];
}

export function getStatusBadgeStyle(status: AdminBookingStatus): string {
  switch (status) {
    case "confirmed":
      return "bg-green-500/20 text-green-400";
    case "cancelled":
      return "bg-red-500/20 text-red-400";
    case "completed":
      return "bg-cafe-fg/10 text-gray-400";
    default:
      return "bg-blue-500/20 text-blue-400";
  }
}

export function countByStatus(
  bookings: readonly RawAdminBooking[],
  status: AdminBookingStatus,
): number {
  return bookings.filter((booking) => normalizeAdminStatus(booking.status) === status)
    .length;
}
