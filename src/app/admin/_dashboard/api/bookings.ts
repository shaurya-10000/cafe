import { logFetchError } from "../lib/log";
import { normalizeBooking } from "../lib/normalize";
import type { BookingRow, SupabaseClientLike } from "../types";

const BOOKING_COLUMNS =
  "id, created_at, user_name, user_email, booking_date, booking_time, party_size, status, special_requests, business_locations(name)";

/** Newest first. Returns `null` on failure so callers keep their current data. */
export async function fetchBookings(
  supabase: SupabaseClientLike,
): Promise<BookingRow[] | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    logFetchError("bookings", error);
    return null;
  }

  return (data ?? [])
    .map(normalizeBooking)
    .filter((booking): booking is BookingRow => booking !== null);
}
