import type { SupabaseClientLike } from "../types";

export interface CatalogName {
  id: string;
  name: string;
}

/** Returns `null` on failure; callers still mark the ids as attempted. */
export async function fetchCatalogNames(
  supabase: SupabaseClientLike,
  ids: readonly string[],
): Promise<CatalogName[] | null> {
  const { data, error } = await supabase
    .from("admin_catalog_items")
    .select("id, name")
    .in("id", [...ids]);

  if (error) {
    console.error(
      "[OrdersTab] catalog lookup failed",
      { requestedIds: ids.length, code: error.code },
      error,
    );
    return null;
  }

  return (data ?? []) as CatalogName[];
}
