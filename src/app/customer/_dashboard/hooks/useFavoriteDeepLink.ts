"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ADD_FAVORITE_PARAM, REMOVE_FAVORITE_PARAM } from "../constants";
import { hrefWithoutParam } from "../lib/url";
import type { DashboardSupabaseClient, MountedRef } from "../types";

interface UseFavoriteDeepLinkOptions {
  supabase: DashboardSupabaseClient;
  userId: string | undefined;
  isMountedRef: MountedRef;
  /** Reloads the favorites list after the change. */
  refresh: () => Promise<void>;
}

type Operation =
  | { kind: "add"; itemId: string; param: typeof ADD_FAVORITE_PARAM }
  | { kind: "remove"; itemId: string; param: typeof REMOVE_FAVORITE_PARAM };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * AI-driven favorites change: ChatWidget routes to
 * /customer?tab=favorites&addFavorite=<id> (or &removeFavorite=<id>). Once the
 * user is known, this saves or removes the favorite with the same upsert the
 * menu's heart button uses, refreshes the list, and clears the param so a
 * reload can't repeat it. Adding an existing favorite is harmless: the upsert
 * never creates a second row.
 */
export function useFavoriteDeepLink({
  supabase,
  userId,
  isMountedRef,
  refresh,
}: UseFavoriteDeepLinkOptions): void {
  const router = useRouter();
  const searchParams = useSearchParams();

  const addId = searchParams.get(ADD_FAVORITE_PARAM);
  const removeId = searchParams.get(REMOVE_FAVORITE_PARAM);

  // Guards against running twice (React StrictMode, or the param still being
  // in the URL while the request is in flight).
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const operation: Operation | null = addId
      ? { kind: "add", itemId: addId, param: ADD_FAVORITE_PARAM }
      : removeId
        ? { kind: "remove", itemId: removeId, param: REMOVE_FAVORITE_PARAM }
        : null;

    if (!operation) {
      handledRef.current = null;
      return;
    }
    if (!userId) return; // Still resolving who the user is.

    const key = `${operation.kind}:${operation.itemId}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    void (async () => {
      let failed = false;

      if (!UUID_PATTERN.test(operation.itemId)) {
        failed = true;
      } else if (operation.kind === "add") {
        const { error } = await supabase
          .from("favorites")
          .upsert(
            { user_id: userId, item_id: operation.itemId },
            { onConflict: "user_id,item_id" },
          );
        if (error) {
          console.error("[dashboard] AI favorite add failed", error);
          failed = true;
        }
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("item_id", operation.itemId);
        if (error) {
          console.error("[dashboard] AI favorite removal failed", error);
          failed = true;
        }
      }

      if (!isMountedRef.current) return;

      if (failed) {
        toast.error("Couldn't update your favorites. Please try again.");
      } else {
        await refresh();
        toast.success(
          operation.kind === "add"
            ? "Saved to your favorites"
            : "Removed from your favorites",
        );
      }

      router.replace(hrefWithoutParam(searchParams.toString(), operation.param), {
        scroll: false,
      });
    })();
  }, [addId, removeId, userId, supabase, isMountedRef, refresh, router, searchParams]);
}