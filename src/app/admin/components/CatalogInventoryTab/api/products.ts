import type { CatalogItem } from "@/types/catalog";

import type { SupabaseClientLike } from "../types";

/** Newest first. Returns `null` on failure. */
export async function fetchProducts(
  supabase: SupabaseClientLike,
): Promise<CatalogItem[] | null> {
  const { data, error } = await supabase
    .from("admin_catalog_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[CatalogInventoryTab] initial load failed",
      { code: error.code },
      error,
    );
    return null;
  }

  return (data ?? []) as CatalogItem[];
}
