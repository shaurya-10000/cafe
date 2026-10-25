"use client";

import { useMemo } from "react";

import {
  BookingCard,
  BookingSection,
  CancelErrorBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "./components";
import { useBookingCancellation, useCancelBookingEvent } from "./hooks";
import { normalizeBookingDisplay } from "./lib/display";
import { groupBookings } from "./lib/group";
import { LIST_ROOT_CLASS } from "./styles";
import type { BookingsTabProps, DisplayBooking } from "./types";

/**
 * Customer bookings list with cancel (button + AI-driven event). The parent
 * owns fetching; this tab owns presentation and the cancel flow.
 */
export function BookingsTab({
  bookings,
  isLoading = false,
  error = null,
  onRefresh,
}: BookingsTabProps) {
  const { cancellingIds, cancelError, performCancel, requestCancel } =
    useBookingCancellation({ bookings, onRefresh });

  useCancelBookingEvent(performCancel);

  const { upcoming, past } = useMemo(
    () =>
      groupBookings(
        bookings.map((raw, index) => ({
          raw,
          booking: normalizeBookingDisplay(raw, `booking-${index}`),
        })),
      ),
    [bookings],
  );

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;
  if (bookings.length === 0) return <EmptyState />;

  const renderCards = (items: DisplayBooking[]) =>
    items.map((booking, index) => (
      <BookingCard
        key={booking.id || index}
        booking={booking}
        isCancelling={cancellingIds.has(booking.id)}
        onRequestCancel={requestCancel}
      />
    ));

  return (
    <div className={LIST_ROOT_CLASS}>
      {cancelError && <CancelErrorBanner message={cancelError} />}

      {upcoming.length > 0 && (
        <BookingSection title="Upcoming" count={upcoming.length}>
          {renderCards(upcoming)}
        </BookingSection>
      )}

      {past.length > 0 && (
        <BookingSection title="Past" count={past.length}>
          {renderCards(past)}
        </BookingSection>
      )}
    </div>
  );
}