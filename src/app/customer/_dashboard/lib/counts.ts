import { INACTIVE_BOOKING_STATUSES, PAST_ORDER_STATUSES } from "../constants";
import type { BookingRow, OrderRow } from "../types";

export function countCurrentOrders(orders: readonly OrderRow[]): number {
  return orders.filter((o) => !PAST_ORDER_STATUSES.includes(o.status)).length;
}

export function countActiveBookings(bookings: readonly BookingRow[]): number {
  return bookings.filter((b) => {
    const status = b.status ?? "";
    return !INACTIVE_BOOKING_STATUSES.includes(status);
  }).length;
}