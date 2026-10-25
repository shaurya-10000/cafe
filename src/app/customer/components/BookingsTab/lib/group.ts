import type { DisplayBooking, RawBookingLike } from "../types";
import { isCancellable } from "./status";

export interface BookingItem {
  raw: RawBookingLike;
  booking: DisplayBooking;
}

export interface BookingGroups {
  upcoming: DisplayBooking[];
  past: DisplayBooking[];
}

function whenKey(raw: RawBookingLike): string {
  return `${raw.booking_date || raw.reservation_date || ""} ${
    raw.booking_time || raw.reservation_time || ""
  }`;
}

/**
 * Live bookings (pending, confirmed) soonest first; finished ones
 * (completed, cancelled) most recent first.
 */
export function groupBookings(items: readonly BookingItem[]): BookingGroups {
  const upcoming: BookingItem[] = [];
  const past: BookingItem[] = [];

  for (const item of items) {
    (isCancellable(item.booking.status) ? upcoming : past).push(item);
  }

  const ascending = (left: BookingItem, right: BookingItem) => {
    const leftKey = whenKey(left.raw);
    const rightKey = whenKey(right.raw);

    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  };

  upcoming.sort(ascending);
  past.sort((left, right) => ascending(right, left));

  return {
    upcoming: upcoming.map((item) => item.booking),
    past: past.map((item) => item.booking),
  };
}