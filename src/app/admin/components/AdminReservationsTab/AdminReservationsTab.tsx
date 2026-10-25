"use client";

import { useCallback, useMemo, useState } from "react";

import { BookingCard } from "./components/BookingCard";
import { BookingSkeletons } from "./components/BookingSkeletons";
import { EmptyBookings } from "./components/EmptyBookings";
import { ReservationsErrorState } from "./components/ReservationsErrorState";
import { ReservationsHeader } from "./components/ReservationsHeader";
import { StatusFilter } from "./components/StatusFilter";
import type { StatusFilterValue } from "./components/StatusFilter";
import { useAiReservationActions } from "./hooks/useAiReservationActions";
import { useBookingStatusUpdate } from "./hooks/useBookingStatusUpdate";
import { normalizeAdminBooking } from "./lib/normalize";
import { compareBookings } from "./lib/sort";
import { countByStatus, normalizeAdminStatus } from "./lib/status";
import type {
  AdminBookingStatus,
  AdminReservationsTabProps,
  BookingAction,
} from "./types";

export function AdminReservationsTab({
  bookings,
  onRefresh,
  isLoading = false,
  error = null,
}: AdminReservationsTabProps) {
  const { updatingId, updateStatus } = useBookingStatusUpdate(onRefresh);

  // AI concierge: "confirm the 7pm booking", "reject booking X".
  useAiReservationActions({ bookings, updateStatus });

  const [filter, setFilter] = useState<StatusFilterValue>("all");

  const counts = useMemo<Record<StatusFilterValue, number>>(
    () => ({
      all: bookings.length,
      pending: countByStatus(bookings, "pending"),
      confirmed: countByStatus(bookings, "confirmed"),
      completed: countByStatus(bookings, "completed"),
      cancelled: countByStatus(bookings, "cancelled"),
    }),
    [bookings],
  );

  const displayBookings = useMemo(() => {
    const sorted = [...bookings].sort(compareBookings);
    const visible =
      filter === "all"
        ? sorted
        : sorted.filter(
            (booking) => normalizeAdminStatus(booking.status) === filter,
          );

    return visible.map(normalizeAdminBooking);
  }, [bookings, filter]);

  // Rejecting cancels the guest's booking, so ask first. The AI path has
  // already been confirmed in the chat and calls updateStatus directly.
  const handleAction = useCallback(
    (
      id: string,
      currentStatus: AdminBookingStatus,
      action: BookingAction,
    ): void | Promise<void> => {
      if (
        action === "reject" &&
        !window.confirm(
          "Reject this booking? The guest will see it as cancelled.",
        )
      ) {
        return;
      }

      return updateStatus(id, currentStatus, action);
    },
    [updateStatus],
  );

  if (error) {
    return <ReservationsErrorState message={error} />;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 pb-20 sm:space-y-6">
      <ReservationsHeader pendingCount={counts.pending} />

      <StatusFilter value={filter} onChange={setFilter} counts={counts} />

      {isLoading ? (
        <BookingSkeletons />
      ) : displayBookings.length === 0 ? (
        <EmptyBookings
          message={
            filter === "all" ? undefined : `No ${filter} bookings`
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isUpdating={updatingId === booking.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}