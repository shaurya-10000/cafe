import type {
  AdminBookingStatus,
  SupabaseClientLike,
} from "../types";

/**
 * Compare-and-swap on the current status: if another admin already changed
 * this row, nothing matches and `updated` is `false` instead of silently
 * overwriting their update. Throws the PostgREST error on failure.
 */
export async function updateBookingStatus(
  supabase: SupabaseClientLike,
  id: string,
  currentStatus: AdminBookingStatus,
  nextStatus: AdminBookingStatus,
): Promise<{ updated: boolean }> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("status", currentStatus)
    .select("id");

  if (error) throw error;

  return { updated: Boolean(data && data.length > 0) };
}
