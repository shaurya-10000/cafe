"use client";

import { useCallback, useRef, useState } from "react";

import { useIsMountedRef } from "@/hooks/useIsMountedRef";

/**
 * Wraps the caller's async `onRemove` with per-item pending state.
 *
 * In-flight ids live in a ref as well as state: the ref makes the
 * double-click guard synchronous and independent of render timing, while
 * the state drives the spinner.
 */
export function useRemoveFavorite(
  onRemove: (id: string) => void | Promise<void>,
) {
  const isMountedRef = useIsMountedRef();

  const [removingIds, setRemovingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const inFlightRef = useRef<Set<string>>(new Set());

  const remove = useCallback(
    async (id: string) => {
      if (inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);

      setRemovingIds((prev) => new Set(prev).add(id));

      try {
        await onRemove(id);
      } catch (error) {
        // `onRemove` is a caller-supplied async handler; a rejection is a
        // real failure the caller owns, but the spinner must still clear so
        // the row isn't stuck. Swallowing silently would make "I clicked
        // remove and nothing happened" impossible to debug.
        console.error("[FavoritesTab] remove failed", { itemId: id }, error);
      } finally {
        // Always clear the per-item spinner, even if `onRemove` threw.
        inFlightRef.current.delete(id);

        if (isMountedRef.current) {
          setRemovingIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }
    },
    [onRemove, isMountedRef],
  );

  return { removingIds, remove };
}