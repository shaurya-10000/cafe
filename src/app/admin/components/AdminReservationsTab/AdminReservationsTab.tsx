"use client";

import { useMemo } from "react";

import { BookingCard } from "./components/BookingCard";
import { BookingSkeletons } from "./components/BookingSkeletons";
import { EmptyBookings } from "./components/EmptyBookings";
import { ReservationsErrorState } from "./components/ReservationsErrorState";
import { ReservationsHeader } from "./components/ReservationsHeader";
import { useAiReservationActions } from "./hooks/useAiReservationActions";
import { useBookingStatusUpdate } from "./hooks/useBookingStatusUpdate";
import { normalizeAdminBooking } from "./lib/normalize";
import { countByStatus } from "./lib/status";
import type { AdminReservationsTabProps } from "./types";

export function AdminReservationsTab({
  bookings,
  onRefresh,
  isLoading = false,
  error = null,
}: AdminReservationsTabProps) {
  const { updatingId, updateStatus } = useBookingStatusUpdate(onRefresh);

  // AI concierge: "confirm the 7pm booking", "reject booking X".
  useAiReservationActions({ bookings, updateStatus });

  const displayBookings = useMemo(
    () => bookings.map(normalizeAdminBooking),
    [bookings],
  );

  const pendingCount = useMemo(
    () => countByStatus(bookings, "pending"),
    [bookings],
  );

  if (error) {
    return <ReservationsErrorState message={error} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <ReservationsHeader pendingCount={pendingCount} />

      {isLoading ? (
        <BookingSkeletons />
      ) : displayBookings.length === 0 ? (
        <EmptyBookings />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isUpdating={updatingId === booking.id}
              onAction={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
