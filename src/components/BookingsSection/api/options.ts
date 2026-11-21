import type {
  ResourceOption,
  ServiceOption,
  SupabaseClientLike,
} from "../types";

export async function fetchActiveServices(
  supabase: SupabaseClientLike,
): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from("catalog_items_public")
    .select("id, name, duration_minutes, numeric_price")
    .eq("item_type", "service")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ServiceOption[];
}

export async function fetchActiveResources(
  supabase: SupabaseClientLike,
): Promise<ResourceOption[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("id, name, location_id")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ResourceOption[];
}