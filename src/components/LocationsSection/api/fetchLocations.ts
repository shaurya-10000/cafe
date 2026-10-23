import type { useSupabaseClient } from "@/utils/supabase/client";
import { SUPABASE_LOCATION_SELECT } from "../constants";
import { normalizeLocationRows } from "../lib/normalize";
import type { BusinessLocation } from "../types";

type SupabaseClient = ReturnType<typeof useSupabaseClient>;

/**
 * Loads storefront locations. RLS enforces "active only" for non-admin
 * sessions. Throws the raw Supabase error so callers can classify it.
 */
export async function fetchLocations(
  supabase: SupabaseClient,
): Promise<BusinessLocation[]> {
  const { data, error } = await supabase
    .from("business_locations")
    .select(SUPABASE_LOCATION_SELECT)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return normalizeLocationRows(data);
}
