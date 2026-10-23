import { useEffect } from "react";

import { toast } from "sonner";

import {
  ADMIN_UPDATE_RESERVATION_STATUS,
  listenCafeEvent,
} from "@/lib/core/events";

import {
  AI_ACTION_SETTLE_MS,
  STATUS_TO_ACTION,
  VALID_STATUSES,
} from "../constants";
import { normalizeAdminStatus } from "../lib/status";
import type {
  AdminBookingStatus,
  BookingAction,
  RawAdminBooking,
} from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseAiReservationActionsOptions {
  bookings: readonly RawAdminBooking[];
  updateStatus: (
    id: string,
    currentStatus: AdminBookingStatus,
    action: BookingAction,
  ) => Promise<void>;
}

/**
 * ChatWidget dispatches this when an admin confirms the AI's
 * UPDATE_RESERVATION_STATUS action. The listener forwards to the same
 * `updateStatus` used by the tab's own buttons, keeping that hook the single
 * source of truth for what a status change looks like.
 *
 * Two differences from a normal button click:
 *   1. The AI sends the target STATUS ("confirmed"), not the ACTION
 *      ("confirm"); it is translated back through `STATUS_TO_ACTION`.
 *   2. A short delay lets ChatWidget's router.push to
 *      /admin?tab=reservations settle before the handler runs, so the tab
 *      isn't mid-mount when the update fires.
 *
 * `bookings` is read through a ref so the listener is registered once and
 * never rebinds on a refetch: a status change in flight can never see its
 * target vanish from a stale closure.
 */
export function useAiReservationActions({
  bookings,
  updateStatus,
}: UseAiReservationActionsOptions): void {
  const isMounted = useIsMounted();
  const bookingsRef = useLatestRef(bookings);

  useEffect(() => {
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const removeListener = listenCafeEvent<{
      bookingId?: unknown;
      status?: unknown;
    }>(ADMIN_UPDATE_RESERVATION_STATUS, (event) => {
      const { bookingId, status } = event.detail ?? {};

      if (typeof bookingId !== "string" || typeof status !== "string") return;
      if (!VALID_STATUSES.has(status)) return;

      const timer = setTimeout(() => {
        pendingTimers.delete(timer);

        if (!isMounted()) return;

        const targetBooking = bookingsRef.current.find(
          (booking) => booking.id === bookingId,
        );

        if (!targetBooking) {
          toast.error("That booking was not found. It may have been removed.");
          return;
        }

        const action = STATUS_TO_ACTION[status as AdminBookingStatus];

        if (!action) {
          toast.error("That status change isn't supported from the chat.");
          return;
        }

        // A status that is not a valid transition from the current state is
        // rejected by `updateStatus` itself; no need to duplicate the check.
        void updateStatus(
          targetBooking.id,
          normalizeAdminStatus(targetBooking.status),
          action,
        );
      }, AI_ACTION_SETTLE_MS);

      pendingTimers.add(timer);
    });

    return () => {
      removeListener();

      for (const timer of pendingTimers) clearTimeout(timer);
      pendingTimers.clear();
    };
  }, [bookingsRef, isMounted, updateStatus]);
}
