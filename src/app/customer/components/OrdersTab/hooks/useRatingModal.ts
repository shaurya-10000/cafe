"use client";

import { useCallback, useState } from "react";

import type { OrderRow } from "../types";

interface UseRatingModalOptions {
  orders: readonly OrderRow[];
  externalRatingOrderId?: string;
  onExternalRatingClosed?: () => void;
}

/**
 * Owns which order's RateOrderModal is open. Opened either by the tab's own
 * "Rate" button or externally via `?rateOrder=` (handed down as
 * `externalRatingOrderId`).
 *
 * External ids are only honored if the order is in the loaded list. The
 * parent forces view="past" for ?rateOrder=, but the order itself could be
 * non-completed (the modal can't render meaningfully then) or simply not
 * ours; the parent's fetch is scoped by RLS, so an id that isn't in `orders`
 * is not ours, deleted, or stale.
 *
 * `orders` is only consulted when the external id *changes* (and on first
 * render), never on later refetches, so a realtime refresh can't re-open a
 * modal the user already closed while the external id was still set. The
 * external id is applied by adjusting state during render, guarded by the
 * previously seen value, rather than from an effect.
 */
export function useRatingModal({
  orders,
  externalRatingOrderId,
  onExternalRatingClosed,
}: UseRatingModalOptions) {
  const hasOrder = (orderId: string | undefined): orderId is string =>
    !!orderId && orders.some((order) => order.id === orderId);

  const [ratingOrderId, setRatingOrderId] = useState<string | null>(() =>
    hasOrder(externalRatingOrderId) ? externalRatingOrderId : null,
  );

  const [seenExternalId, setSeenExternalId] = useState(externalRatingOrderId);
  if (seenExternalId !== externalRatingOrderId) {
    setSeenExternalId(externalRatingOrderId);

    if (hasOrder(externalRatingOrderId)) {
      setRatingOrderId(externalRatingOrderId);
    }
  }

  const openRating = useCallback((orderId: string) => {
    setRatingOrderId(orderId);
  }, []);

  const closeRating = useCallback(() => {
    const wasExternal =
      externalRatingOrderId && ratingOrderId === externalRatingOrderId;

    setRatingOrderId(null);

    if (wasExternal) {
      onExternalRatingClosed?.();
    }
  }, [externalRatingOrderId, ratingOrderId, onExternalRatingClosed]);

  return { ratingOrderId, openRating, closeRating };
}