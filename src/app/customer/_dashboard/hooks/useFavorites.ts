"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FAVORITES_ERROR_MESSAGE,
  FAVORITES_SELECT,
  FAV_ERROR_TIMEOUT_MS,
} from "../constants";
import { isMissingFavoritesTable, mapFavoriteRows } from "../lib/favorites";
import type {
  DashboardSupabaseClient,
  FavoriteItem,
  MountedRef,
} from "../types";
import { useFavoriteDeepLink } from "./useFavoriteDeepLink";

interface UseFavoritesOptions {
  supabase: DashboardSupabaseClient;
  userId: string | undefined;
  isMountedRef: MountedRef;
}

export function useFavorites({
  supabase,
  userId,
  isMountedRef,
}: UseFavoritesOptions) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // Auto-dismiss the error banner.
  useEffect(() => {
    if (!favError) return;

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      setFavError(null);
    }, FAV_ERROR_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [favError, isMountedRef]);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;

    setFavLoading(true);

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(FAVORITES_SELECT)
        .eq("user_id", userId);

      if (error) {
        if (isMissingFavoritesTable(error)) {
          if (isMountedRef.current) setFavorites([]);
          return;
        }
        throw error;
      }

      if (!isMountedRef.current) return;
      if (data) setFavorites(mapFavoriteRows(data));
    } catch (err) {
      console.error("[dashboard] favorites fetch failed", err);
      if (isMountedRef.current) setFavorites([]);
    } finally {
      if (isMountedRef.current) setFavLoading(false);
    }
  }, [supabase, userId, isMountedRef]);

  /**
   * Resolves (never rejects) so FavoritesTab always clears its per-row
   * spinner; failures surface through `favError`.
   */
  const removeFavorite = useCallback(
    async (itemId: string) => {
      if (!userId) return;

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", itemId);

      if (!isMountedRef.current) return;

      if (error) {
        console.error("[dashboard] favorite removal failed", error);
        setFavError(FAVORITES_ERROR_MESSAGE);
        return;
      }

      setFavorites((prev) => prev.filter((item) => item.id !== itemId));
    },
    [supabase, userId, isMountedRef],
  );

  // AI concierge deep link: /customer?tab=favorites&addFavorite=<id>
  useFavoriteDeepLink({ supabase, userId, isMountedRef, refresh: fetchFavorites });

  return { favorites, favLoading, favError, fetchFavorites, removeFavorite };
}