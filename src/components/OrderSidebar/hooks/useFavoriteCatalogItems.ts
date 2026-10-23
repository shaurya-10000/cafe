import { useEffect, useMemo, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import type { FavoriteCatalogItem } from "../types";

interface UseFavoriteCatalogItemsOptions {
  enabled: boolean;
  favoriteIds: readonly string[];
}

const NO_ITEMS: FavoriteCatalogItem[] = [];

/** Resolves favorite ids to catalog rows (name + price) for quick-add chips. */
export function useFavoriteCatalogItems({
  enabled,
  favoriteIds,
}: UseFavoriteCatalogItemsOptions): FavoriteCatalogItem[] {
  const supabase = useSupabaseClient();

  const [items, setItems] = useState<FavoriteCatalogItem[]>([]);

  // Stable identity for the id set: parents often pass a new array literal on
  // every render, which would otherwise refetch each time.
  const idsKey = useMemo(
    () => JSON.stringify([...favoriteIds].sort()),
    [favoriteIds],
  );

  useEffect(() => {
    const ids = JSON.parse(idsKey) as string[];

    if (!enabled || ids.length === 0) return;

    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from("catalog_items_public")
          .select("id, name, numeric_price")
          .in("id", ids)
          .eq("item_type", "product");

        if (cancelled) return;

        if (error) {
          console.error("[OrderSidebar] favorite items fetch failed", error);
          return;
        }

        setItems((data as FavoriteCatalogItem[] | null) ?? []);
      } catch (error) {
        if (cancelled) return;

        console.error("[OrderSidebar] favorite items fetch failed", error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, idsKey, supabase]);

  // Nothing to show (and nothing fetched) while disabled or without ids.
  return enabled && idsKey !== "[]" ? items : NO_ITEMS;
}
