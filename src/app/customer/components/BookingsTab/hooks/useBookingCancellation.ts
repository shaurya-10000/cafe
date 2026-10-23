"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { useSupabaseClient } from "@/utils/supabase/client";

import {
  CANCEL_ERROR_TIMEOUT_MS,
  CANCEL_FAILED_MESSAGE,
  SIGN_IN_AGAIN_MESSAGE,
} from "../constants";
import { isCancellable, normalizeStatus } from "../lib/status";
import type { DisplayBooking, RawBookingLike } from "../types";

interface UseBookingCancellationOptions {
  bookings: readonly RawBookingLike[];
  onRefresh?: () => void | Promise<void>;
}

/**
 * The single code path that can cancel a booking: the card's Cancel button
 * (after a confirm) and the AI-driven CANCEL_BOOKING event both end up in
 * `performCancel`.
 */
export function useBookingCancellation({
  bookings,
  onRefresh,
}: UseBookingCancellationOptions) {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;
  const isMountedRef = useIsMountedRef();

  // Ids currently mid-cancel. Keyed by booking id so multiple cancels
  // (AI-driven or human) can be in flight without stepping on each other.
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Snapshot of `bookings` for the event listener. The listener is
  // registered once and must not re-register every time `bookings` changes:
  // a Realtime refetch mid-confirm would otherwise tear down and rebuild it.
  const bookingsRef = useRef(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  const performCancel = useCallback(
    async (bookingId: string): Promise<boolean> => {
      if (!userId) {
        setCancelError(SIGN_IN_AGAIN_MESSAGE);
        return false;
      }

      // The event may reference a booking that was cancelled in another tab
      // since this one rendered; check current status before updating.
      const raw = bookingsRef.current.find((b) => b.id === bookingId);
      if (!raw) {
        // Not this user's, deleted, or a stale id. RLS would reject a blind
        // update anyway; failing quietly here is cleaner.
        return false;
      }

      if (!isCancellable(normalizeStatus(raw.status))) {
        // Already completed or cancelled: a no-op, not a failure.
        return true;
      }

      setCancellingIds((prev) => new Set(prev).add(bookingId));
      setCancelError(null);

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (!isMountedRef.current) return false;

      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });

      if (updateError) {
        console.error(
          "[BookingsTab] cancel failed",
          { bookingId, code: updateError.code },
          updateError,
        );
        setCancelError(CANCEL_FAILED_MESSAGE);
        return false;
      }

      // Realtime usually refetches on its own, but asking explicitly makes
      // the change land immediately and covers setups where it is off.
      await onRefresh?.();
      return true;
    },
    [supabase, userId, onRefresh, isMountedRef],
  );

  const requestCancel = useCallback(
    (booking: DisplayBooking) => {
      const confirmed =
        typeof window !== "undefined" &&
        window.confirm(
          `Cancel your booking for ${booking.dateLabel} at ${booking.timeLabel}? This can't be undone.`,
        );
      if (!confirmed) return;
      void performCancel(booking.id);
    },
    [performCancel],
  );

  // Auto-dismiss cancel errors, same pattern as the dashboard's favorites banner.
  useEffect(() => {
    if (!cancelError) return;

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      setCancelError(null);
    }, CANCEL_ERROR_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [cancelError, isMountedRef]);

  return { cancellingIds, cancelError, performCancel, requestCancel };
}