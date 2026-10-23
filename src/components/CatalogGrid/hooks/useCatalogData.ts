import { useCallback, useEffect, useRef, useState } from "react";

import type { CatalogItem } from "@/types/catalog";
import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchCatalogSnapshot } from "../api/catalog";
import { fetchFavoriteIds } from "../api/favorites";
import {
  CATALOG_REFRESH_INTERVAL_MS,
  DEFAULT_CURRENCY,
  LOAD_ERROR_MESSAGE,
} from "../constants";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseCatalogDataOptions {
  userId: string | null | undefined;
  onFavoritesLoaded: (ids: string[]) => void;
}

interface RefreshOptions {
  /** Background refresh: no loading state, errors are only logged. */
  silent?: boolean;
}

export interface UseCatalogDataResult {
  items: CatalogItem[];
  currency: string;
  loading: boolean;
  loadError: string | null;
  isRetrying: boolean;
  retry: () => Promise<void>;
}

export function useCatalogData({
  userId,
  onFavoritesLoaded,
}: UseCatalogDataOptions): UseCatalogDataResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();
  const onFavoritesLoadedRef = useLatestRef(onFavoritesLoaded);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  /** Orders responses: only the newest request may write state. */
  const latestRequestRef = useRef(0);
  /** The user-visible (non-silent) request currently owning `loading`. */
  const blockingRequestRef = useRef<number | null>(null);

  const refresh = useCallback(
    async (options: RefreshOptions = {}): Promise<void> => {
      const silent = options.silent ?? false;

      // A background refresh must never supersede a visible load; doing so
      // would drop its response and leave the skeleton on screen.
      if (silent && blockingRequestRef.current !== null) return;

      const requestId = ++latestRequestRef.current;
      const isStale = (): boolean =>
        latestRequestRef.current !== requestId || !isMounted();

      if (!silent) {
        blockingRequestRef.current = requestId;
        setLoading(true);
        setLoadError(null);
      }

      try {
        const snapshot = await fetchCatalogSnapshot(supabase);

        if (isStale()) return;

        if (snapshot.catalogError) {
          if (silent) {
            console.error(
              "[CatalogGrid] background refresh failed",
              snapshot.catalogError,
            );
          } else {
            setLoadError(LOAD_ERROR_MESSAGE);
          }
        } else if (snapshot.items) {
          setItems(snapshot.items);
        }

        if (snapshot.currency) {
          setCurrency(snapshot.currency);
        }

        if (userId) {
          const favoriteIds = await fetchFavoriteIds(supabase, userId);

          if (isStale()) return;

          if (favoriteIds) {
            onFavoritesLoadedRef.current(favoriteIds);
          }
        }
      } catch (error) {
        if (isStale()) return;

        console.error("[CatalogGrid] fetch failed", error);

        if (!silent) {
          setLoadError(LOAD_ERROR_MESSAGE);
        }
      } finally {
        if (!silent && blockingRequestRef.current === requestId) {
          blockingRequestRef.current = null;

          if (isMounted()) setLoading(false);
        }
      }
    },
    [isMounted, onFavoritesLoadedRef, supabase, userId],
  );

  // Initial load (and reload when the signed-in user changes).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while the tab is visible.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void refresh({ silent: true });
    }, CATALOG_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  // Refetch when the window regains focus.
  useEffect(() => {
    const handleFocus = (): void => {
      void refresh({ silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  const retry = useCallback(async (): Promise<void> => {
    setIsRetrying(true);

    try {
      await refresh();
    } finally {
      if (isMounted()) setIsRetrying(false);
    }
  }, [isMounted, refresh]);

  return { items, currency, loading, loadError, isRetrying, retry };
}
