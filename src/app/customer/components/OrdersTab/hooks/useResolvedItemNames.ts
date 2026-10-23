"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { useSupabaseClient } from "@/utils/supabase/client";

import { EMPTY_LOOKUP, mergeLookup, resolveItemName } from "../lib/itemNames";
import { collectItemIds } from "../lib/orders";
import type {
  CatalogNameRow,
  ItemNameLookup,
  ItemNameResolver,
  OrderRow,
} from "../types";

/** Live catalog names for every item line across `orders`. */
export function useResolvedItemNames(
  orders: readonly OrderRow[],
): ItemNameResolver {
  const supabase = useSupabaseClient();
  const isMountedRef = useIsMountedRef();

  const [lookup, setLookup] = useState<ItemNameLookup>(EMPTY_LOOKUP);

  // The effect below must read the *latest* resolved set without depending
  // on it: depending on it would re-run the effect on every resolution and
  // issue a redundant fetch. Declared before the effect so it runs first.
  const lookupRef = useRef(lookup);
  useEffect(() => {
    lookupRef.current = lookup;
  });

  const allItemIds = useMemo(() => collectItemIds(orders), [orders]);

  useEffect(() => {
    const missingIds = allItemIds.filter(
      (id) => !lookupRef.current.resolved.has(id),
    );
    if (missingIds.length === 0) return;

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("catalog_items_public")
        .select("id, name")
        .in("id", missingIds);

      if (cancelled || !isMountedRef.current) return;

      if (error) {
        console.error(
          "[OrdersTab] catalog lookup failed",
          { requestedIds: missingIds.length, code: error.code },
          error,
        );
      }

      const rows = error ? null : ((data ?? null) as CatalogNameRow[] | null);
      setLookup((prev) => mergeLookup(prev, missingIds, rows));
    })();

    return () => {
      cancelled = true;
    };
  }, [allItemIds, supabase, isMountedRef]);

  return useCallback(
    (line) => resolveItemName(line, lookup),
    [lookup],
  );
}