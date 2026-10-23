/**
 * Renamed from ReservationsTab: the underlying table is `bookings`
 * (booking_date / booking_time / party_size), not reservations.
 */
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type StatusIconKind = "check" | "x" | "clock";

/**
 * Shape this tab accepts from the caller: `bookings` columns as the primary
 * keys, with legacy fallbacks kept for tolerance. `business_locations` is the
 * embed key Supabase returns for `*, business_locations(name)`; optional, and
 * gracefully omitted from the card when absent.
 */
export interface RawBookingLike {
  id?: string | null;
  status?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  party_size?: number | null;
  special_requests?: string | null;
  business_locations?: { name?: string | null } | null;
  // Legacy fallbacks; not real columns on `bookings`.
  reservation_date?: string | null;
  reservation_time?: string | null;
  guests?: number | null;
}

/**
 * Public alias for the row shape this tab accepts. The internal name is kept
 * because the tab tolerates both current and legacy field shapes; the
 * dashboard types its state with the alias.
 */
export type BookingRow = RawBookingLike;

export interface DisplayBooking {
  id: string;
  status: BookingStatus;
  dateLabel: string;
  timeLabel: string;
  partySize: number;
  specialRequests: string | null;
  locationName: string | null;
}

export interface BookingsTabProps {
  bookings: RawBookingLike[];
  /** Set while the parent is fetching data; shows skeleton cards. */
  isLoading?: boolean;
  /** Set when the parent's fetch failed; shows an error state instead of the list. */
  error?: string | null;
  /**
   * Called after a successful cancel so the parent can refetch. Optional
   * because the parent's Realtime subscription on `bookings` usually picks
   * the change up on its own, but calling it makes the UI settle faster and
   * covers Realtime being disabled or misconfigured.
   */
  onRefresh?: () => void | Promise<void>;
}