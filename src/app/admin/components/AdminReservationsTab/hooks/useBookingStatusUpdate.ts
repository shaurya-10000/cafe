import { useCallback, useRef, useState } from "react";

import { toast } from "sonner";

import { useSupabaseClient } from "@/utils/supabase/client";

import { updateBookingStatus } from "../api/bookings";
import { mapAdminUpdateError } from "../lib/errors";
import { getActionTargetStatus, isValidTransition } from "../lib/status";
import type {
  AdminBookingStatus,
  BookingAction,
  SupabaseLikeError,
} from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

export interface UseBookingStatusUpdateResult {
  /** Id of the booking whose update is in flight, if any. */
  updatingId: string | null;
  updateStatus: (
    id: string,
    currentStatus: AdminBookingStatus,
    action: BookingAction,
  ) => Promise<void>;
}

/**
 * The single place a booking status change is validated, sent and reported,
 * whether it came from a button click or from the AI concierge.
 */
export function useBookingStatusUpdate(
  onRefresh: () => void,
): UseBookingStatusUpdateResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();
  const onRefreshRef = useLatestRef(onRefresh);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /** Authoritative per-booking guard; state only drives rendering. */
  const inFlightRef = useRef<Set<string>>(new Set());

  const updateStatus = useCallback(
    async (
      id: string,
      currentStatus: AdminBookingStatus,
      action: BookingAction,
    ): Promise<void> => {
      const nextStatus = getActionTargetStatus(action);

      if (!isValidTransition(currentStatus, nextStatus)) {
        toast.error("That action is no longer available for this booking.");
        onRefreshRef.current();
        return;
      }

      if (inFlightRef.current.has(id)) return;

      inFlightRef.current.add(id);
      setUpdatingId(id);

      try {
        const { updated } = await updateBookingStatus(
          supabase,
          id,
          currentStatus,
          nextStatus,
        );

        if (!isMounted()) return;

        if (updated) {
          toast.success(`Booking marked as ${nextStatus}.`);
        } else {
          toast.error("This booking was already updated elsewhere. Refreshing\u2026");
        }
      } catch (error) {
        if (!isMounted()) return;

        console.error(
          "[AdminReservationsTab] status update failed",
          { bookingId: id, currentStatus, nextStatus },
          error,
        );

        toast.error(mapAdminUpdateError(error as SupabaseLikeError));
      } finally {
        inFlightRef.current.delete(id);

        if (isMounted()) setUpdatingId(null);

        onRefreshRef.current();
      }
    },
    [isMounted, onRefreshRef, supabase],
  );

  return { updatingId, updateStatus };
}
