"use client";

import {
  BookingCard,
  CancelErrorBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "./components";
import { useBookingCancellation, useCancelBookingEvent } from "./hooks";
import { normalizeBookingDisplay } from "./lib/display";
import { LIST_CLASS, LIST_ROOT_CLASS } from "./styles";
import type { BookingsTabProps } from "./types";

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

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;
  if (bookings.length === 0) return <EmptyState />;

  return (
    <div className={LIST_ROOT_CLASS}>
      {cancelError && <CancelErrorBanner message={cancelError} />}

      <ul className={LIST_CLASS}>
        {bookings.map((raw, index) => {
          const booking = normalizeBookingDisplay(raw, `booking-${index}`);

          return (
            <BookingCard
              key={booking.id || index}
              booking={booking}
              isCancelling={cancellingIds.has(booking.id)}
              onRequestCancel={requestCancel}
            />
          );
        })}
      </ul>
    </div>
  );
}