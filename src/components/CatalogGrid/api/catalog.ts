import type { CatalogItem } from "@/types/catalog";

import { CATALOG_PUBLIC_COLUMNS } from "../constants";
import type { SupabaseClient } from "../types";

export interface CatalogSnapshot {
  items: CatalogItem[] | null;
  currency: string | null;
  catalogError: unknown;
}

export async function fetchCatalogSnapshot(
  supabase: SupabaseClient,
): Promise<CatalogSnapshot> {
  const [catalogResult, settingsResult] = await Promise.all([
    supabase
      .from("catalog_items_public")
      .select(CATALOG_PUBLIC_COLUMNS)
      .eq("item_type", "product")
      .order("created_at", { ascending: false }),
    supabase.from("business_public_settings").select("currency").maybeSingle(),
  ]);

  return {
    items: catalogResult.error
      ? null
      : ((catalogResult.data as unknown as CatalogItem[] | null) ?? null),
    catalogError: catalogResult.error,
    currency: settingsResult.data?.currency ?? null,
  };
}
