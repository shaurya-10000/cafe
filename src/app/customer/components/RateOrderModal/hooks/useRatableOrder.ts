"use client";

import { useEffect, useMemo, useState } from "react";

import type { MountedRef } from "@/hooks/useIsMountedRef";

import { NOT_RATABLE_REASONS } from "../constants";
import {
  buildLineItems,
  extractItemIds,
  extractReviewedIds,
  getNotRatableReason,
} from "../lib/order";
import type {
  CatalogNameRow,
  LoadState,
  ModalSupabaseClient,
  ReviewedRow,
} from "../types";

interface UseRatableOrderOptions {
  supabase: ModalSupabaseClient;
  userId: string | undefined;
  orderId: string;
  isMountedRef: MountedRef;
}

/**
 * Loads the order, resolves live catalog names and the user's existing
 * reviews, and exposes the items that can still be rated.
 *
 * Schema notes:
 * - orders.items only guarantees {item_id, quantity}; names come from
 *   catalog_items, never from the stored order.
 * - Reviews require orders.status = 'completed' (trg_validate_review).
 * - unique(user_id, order_id, catalog_item_id): already-reviewed items are
 *   excluded from the form rather than left to fail on insert.
 */
export function useRatableOrder({
  supabase,
  userId,
  orderId,
  isMountedRef,
}: UseRatableOrderOptions) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [alreadyReviewed, setAlreadyReviewed] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, status, items")
        .eq("id", orderId)
        .single();

      if (cancelled || !isMountedRef.current) return;

      if (orderError || !order) {
        setLoadState({ status: "not-found" });
        return;
      }

      if (order.status !== "completed") {
        setLoadState({
          status: "not-ratable",
          reason: getNotRatableReason(order.status),
        });
        return;
      }

      const itemIds = extractItemIds(order.items);

      if (itemIds.length === 0) {
        setLoadState({
          status: "not-ratable",
          reason: NOT_RATABLE_REASONS.noItems,
        });
        return;
      }

      const [{ data: catalogRows }, reviewsResult] = await Promise.all([
        supabase.from("catalog_items_public").select("id, name").in("id", itemIds),
        userId
          ? supabase
              .from("reviews")
              .select("catalog_item_id")
              .eq("order_id", orderId)
              .eq("user_id", userId)
          : Promise.resolve({ data: [] as ReviewedRow[] }),
      ]);

      if (cancelled || !isMountedRef.current) return;

      const items = buildLineItems(
        itemIds,
        (catalogRows ?? []) as CatalogNameRow[],
      );

      if (items.length === 0) {
        setLoadState({
          status: "not-ratable",
          reason: NOT_RATABLE_REASONS.itemsUnavailable,
        });
        return;
      }

      setAlreadyReviewed(
        extractReviewedIds((reviewsResult.data ?? []) as ReviewedRow[]),
      );
      setLoadState({ status: "ready", items });
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, supabase, userId, isMountedRef]);

  const ratableItems = useMemo(() => {
    if (loadState.status !== "ready") return [];
    return loadState.items.filter(
      (item) => !alreadyReviewed.has(item.catalogItemId),
    );
  }, [loadState, alreadyReviewed]);

  return { loadState, ratableItems };
}