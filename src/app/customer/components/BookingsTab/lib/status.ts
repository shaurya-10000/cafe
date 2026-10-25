import {
  BOOKING_STEPS,
  CANCELLABLE_STATUSES,
  VALID_STATUSES,
} from "../constants";
import type { BookingStatus, StatusIconKind } from "../types";

export function normalizeStatus(status?: string | null): BookingStatus {
  return status && VALID_STATUSES.has(status)
    ? (status as BookingStatus)
    : "pending";
}

function stepIndex(status: BookingStatus): number {
  return BOOKING_STEPS.indexOf(status as (typeof BOOKING_STEPS)[number]);
}

/** Progress-bar fill width as a percentage string, e.g. "50%". */
export function getProgressWidth(status: BookingStatus): string {
  if (status === "cancelled") return "0%";
  const index = stepIndex(status);
  if (index === -1) return "0%";
  return `${(index / (BOOKING_STEPS.length - 1)) * 100}%`;
}

/** Whether a step (by index into BOOKING_STEPS) should render as "reached". */
export function isStepActive(status: BookingStatus, index: number): boolean {
  return stepIndex(status) >= index;
}

export function getStatusBadgeStyle(status: BookingStatus): string {
  switch (status) {
    case "confirmed":
      return "bg-green-600 text-white border-transparent";
    case "completed":
      return "bg-cafe-fg/5 border-cafe-border text-gray-500";
    case "cancelled":
      return "bg-red-600 text-white border-transparent";
    default:
      return "bg-blue-600/10 border-blue-500/20 text-blue-400";
  }
}

export function getStatusIconWrapperStyle(status: BookingStatus): string {
  switch (status) {
    case "confirmed":
      return "bg-green-500/10 border-green-500/20 text-green-500";
    case "completed":
      return "bg-cafe-fg/5 border-cafe-border text-gray-500";
    case "cancelled":
      return "bg-red-500/10 border-red-500/20 text-red-500";
    default:
      return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  }
}

export function getStatusIconKind(status: BookingStatus): StatusIconKind {
  if (status === "completed") return "check";
  if (status === "cancelled") return "x";
  return "clock";
}

/** Whether this booking is still cancellable by the customer. */
export function isCancellable(status: BookingStatus): boolean {
  return CANCELLABLE_STATUSES.has(status);
}