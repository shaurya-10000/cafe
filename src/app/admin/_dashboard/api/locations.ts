import type { AdminLocation } from "@/app/admin/components/Locationstab";

import { logFetchError } from "../lib/log";
import { normalizeLocation } from "../lib/normalize";
import type { SupabaseClientLike } from "../types";

const LOCATION_COLUMNS =
  "id, name, address, latitude, longitude, phone, timezone, hours_weekday, hours_weekend, image_url, max_capacity, default_booking_duration_minutes, display_order, is_active";

/** Display order. Returns `null` on failure so callers keep their current data. */
export async function fetchLocations(
  supabase: SupabaseClientLike,
): Promise<AdminLocation[] | null> {
  const { data, error } = await supabase
    .from("business_locations")
    .select(LOCATION_COLUMNS)
    .order("display_order", { ascending: true });

  if (error) {
    logFetchError("locations", error);
    return null;
  }

  return (data ?? [])
    .map(normalizeLocation)
    .filter((location): location is AdminLocation => location !== null);
}
