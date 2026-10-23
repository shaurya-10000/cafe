import type { BookingInsertPayload, SupabaseClientLike } from "../types";

/** Inserts a booking; returns the PostgREST error (or `null` on success). */
export async function insertBooking(
  supabase: SupabaseClientLike,
  payload: BookingInsertPayload,
) {
  const { error } = await supabase.from("bookings").insert([payload]);

  return error;
}
