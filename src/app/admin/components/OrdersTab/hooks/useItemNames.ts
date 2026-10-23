import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchCatalogNames } from "../api/catalogNames";
import { collectItemIds, resolveItemName } from "../lib/items";
import type { OrderItemLine, OrderRow } from "../types";
import { useIsMounted } from "./useIsMounted";

export interface UseItemNamesResult {
  resolveItemName: (line: OrderItemLine) => string;
}

/**
 * Lazily resolves catalog names for every item referenced by the orders.
 * Every requested id is marked resolved whether or not the lookup succeeds,
 * so a genuinely deleted catalog item is not re-queried on every render.
 */
export function useItemNames(orders: readonly OrderRow[]): UseItemNamesResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const [namesById, setNamesById] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [resolvedIds, setResolvedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  /** Mirrors `resolvedIds` so the effect can read it without depending on it. */
  const resolvedRef = useRef<Set<string>>(new Set());
  /** Only the newest request may write state. */
  const latestRequestRef = useRef(0);

  // Stable identity for the id set: orders refetch often, ids rarely change.
  const idsKey = useMemo(() => JSON.stringify(collectItemIds(orders)), [orders]);

  useEffect(() => {
    const ids = JSON.parse(idsKey) as string[];
    const missingIds = ids.filter((id) => !resolvedRef.current.has(id));

    if (missingIds.length === 0) return;

    const requestId = ++latestRequestRef.current;
    let cancelled = false;

    const load = async (): Promise<void> => {
      const rows = await fetchCatalogNames(supabase, missingIds);

      if (cancelled || !isMounted()) return;
      if (requestId !== latestRequestRef.current) return;

      for (const id of missingIds) resolvedRef.current.add(id);
      setResolvedIds(new Set(resolvedRef.current));

      if (rows) {
        setNamesById((previous) => {
          const next = new Map(previous);

          for (const row of rows) next.set(row.id, row.name);

          return next;
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [idsKey, isMounted, supabase]);

  const resolve = useCallback(
    (line: OrderItemLine) => resolveItemName(line, namesById, resolvedIds),
    [namesById, resolvedIds],
  );

  return { resolveItemName: resolve };
}
