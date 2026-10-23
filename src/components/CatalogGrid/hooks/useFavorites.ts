import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import { addFavorite, removeFavorite } from "../api/favorites";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseFavoritesOptions {
  userId: string | null | undefined;
  favoriteIds: string[];
  setFavoriteIds: Dispatch<SetStateAction<string[]>>;
}

export interface UseFavoritesResult {
  pendingFavoriteIds: ReadonlySet<string>;
  toggleFavorite: (id: string) => Promise<void>;
}

export function useFavorites({
  userId,
  favoriteIds,
  setFavoriteIds,
}: UseFavoritesOptions): UseFavoritesResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();
  const favoriteIdsRef = useLatestRef(favoriteIds);

  /** Authoritative in-flight guard; state below only drives rendering. */
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const toggleFavorite = useCallback(
    async (id: string): Promise<void> => {
      if (pendingRef.current.has(id)) return;

      const wasFavorited = favoriteIdsRef.current.includes(id);

      // Optimistic update.
      setFavoriteIds((prev) =>
        wasFavorited
          ? prev.filter((favoriteId) => favoriteId !== id)
          : prev.includes(id)
            ? prev
            : [...prev, id],
      );

      // Guests keep favorites locally only.
      if (!userId) return;

      pendingRef.current.add(id);
      setPendingFavoriteIds(new Set(pendingRef.current));

      try {
        if (wasFavorited) {
          await removeFavorite(supabase, userId, id);
        } else {
          await addFavorite(supabase, userId, id);
        }
      } catch (error) {
        console.error("[CatalogGrid] favorite toggle failed", error);

        if (!isMounted()) return;

        // Roll back the optimistic update.
        setFavoriteIds((prev) =>
          wasFavorited
            ? prev.includes(id)
              ? prev
              : [...prev, id]
            : prev.filter((favoriteId) => favoriteId !== id),
        );
      } finally {
        pendingRef.current.delete(id);

        if (isMounted()) {
          setPendingFavoriteIds(new Set(pendingRef.current));
        }
      }
    },
    [favoriteIdsRef, isMounted, setFavoriteIds, supabase, userId],
  );

  return { pendingFavoriteIds, toggleFavorite };
}
