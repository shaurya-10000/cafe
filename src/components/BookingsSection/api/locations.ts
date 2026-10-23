import type { Location, SupabaseClientLike } from "../types";

export async function fetchActiveLocations(
  supabase: SupabaseClientLike,
): Promise<Location[]> {
  const { data, error } = await supabase
    .from("business_locations")
    .select("id, name")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Location[];
}

/** Re-verifies a location is still active immediately before insert. */
export async function verifyLocationActive(
  supabase: SupabaseClientLike,
  locationId: string,
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from("business_locations")
    .select("id, name")
    .eq("id", locationId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;

  return (data as { id: string; name: string } | null) ?? null;
}
