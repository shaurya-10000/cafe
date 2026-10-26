"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { useSupabaseClient } from "@/utils/supabase/client";

import type { FavoriteItem } from "../types";

/** cart_items.quantity is constrained to 1..100 in the database. */
const MAX_QUANTITY = 100;
const ADDED_FEEDBACK_MS = 1_800;

function without(previous: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(previous);
  next.delete(id);
  return next;
}

/**
 * Adds one of a favorite to the signed-in user's cart (public.cart_items, the
 * same table the menu writes to). The header cart count follows through the
 * existing realtime subscription.
 */
export function useAddToCart() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;
  const isMountedRef = useIsMountedRef();

  const [addingIds, setAddingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [addedIds, setAddedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const inFlightRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const add = useCallback(
    async (item: FavoriteItem): Promise<void> => {
      if (!userId) {
        toast.error("Please sign in again to add items to your order.");
        return;
      }

      if (inFlightRef.current.has(item.id)) return;
      inFlightRef.current.add(item.id);

      setAddingIds((previous) => new Set(previous).add(item.id));

      try {
        const { data: existing, error: readError } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", userId)
          .eq("item_id", item.id)
          .maybeSingle();

        if (readError) throw readError;

        const current =
          typeof existing?.quantity === "number" ? existing.quantity : 0;
        const next = Math.min(current + 1, MAX_QUANTITY);

        if (next === current) {
          toast.info(`You already have the maximum of ${item.name}.`);
          return;
        }

        const { error: writeError } = await supabase.from("cart_items").upsert(
          { user_id: userId, item_id: item.id, quantity: next },
          { onConflict: "user_id,item_id" },
        );

        if (writeError) throw writeError;

        toast.success(`${item.name} added to your order.`);

        if (!isMountedRef.current) return;

        setAddedIds((previous) => new Set(previous).add(item.id));

        const existingTimer = timersRef.current.get(item.id);
        if (existingTimer !== undefined) clearTimeout(existingTimer);

        timersRef.current.set(
          item.id,
          setTimeout(() => {
            timersRef.current.delete(item.id);

            if (!isMountedRef.current) return;

            setAddedIds((previous) => without(previous, item.id));
          }, ADDED_FEEDBACK_MS),
        );
      } catch (error) {
        console.error("[FavoritesTab] add to cart failed", { itemId: item.id }, error);
        toast.error("Couldn\u2019t add that to your order. Please try again.");
      } finally {
        inFlightRef.current.delete(item.id);

        if (isMountedRef.current) {
          setAddingIds((previous) => without(previous, item.id));
        }
      }
    },
    [isMountedRef, supabase, userId],
  );

  return { addingIds, addedIds, add };
}