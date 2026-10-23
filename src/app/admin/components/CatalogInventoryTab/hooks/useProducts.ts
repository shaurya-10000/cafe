import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { CatalogItem } from "@/types/catalog";
import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchProducts } from "../api/products";
import { LOAD_ERROR_MESSAGE, REALTIME_CHANNEL } from "../constants";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

/** Collapses bursts of change events (e.g. insert + Stripe-id update). */
const REFETCH_DEBOUNCE_MS = 300;

interface UseProductsOptions {
  onLoadError: (message: string) => void;
}

export interface UseProductsResult {
  products: CatalogItem[];
  setProducts: Dispatch<SetStateAction<CatalogItem[]>>;
  loading: boolean;
}

/**
 * Loads the catalog from admin_catalog_items, then keeps it live.
 *
 * Browser roles hold no SELECT on catalog_items (migration 0023), so a
 * realtime payload for that table carries no usable row data. Change events
 * are therefore only a signal: on any event the list is refetched from the
 * admin view, which is the single source of truth.
 */
export function useProducts({ onLoadError }: UseProductsOptions): UseProductsResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();
  const onLoadErrorRef = useLatestRef(onLoadError);

  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);

      const rows = await fetchProducts(supabase);

      if (cancelled || !isMounted()) return;

      if (rows === null) {
        onLoadErrorRef.current(LOAD_ERROR_MESSAGE);
      } else {
        setProducts(rows);
      }

      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isMounted, onLoadErrorRef, supabase]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refetch = async (): Promise<void> => {
      const rows = await fetchProducts(supabase);

      // A failed background refresh keeps the current list on screen.
      if (rows === null || !isMounted()) return;

      setProducts(rows);
    };

    const channel = supabase
      .channel(REALTIME_CHANNEL)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "catalog_items" },
        () => {
          if (timer) clearTimeout(timer);

          timer = setTimeout(() => {
            timer = null;
            void refetch();
          }, REFETCH_DEBOUNCE_MS);
        },
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);

      void supabase.removeChannel(channel);
    };
  }, [isMounted, supabase]);

  return { products, setProducts, loading };
}