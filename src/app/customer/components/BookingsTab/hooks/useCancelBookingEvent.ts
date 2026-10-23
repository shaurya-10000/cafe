"use client";

import { useEffect } from "react";

import { CANCEL_BOOKING, listenCafeEvent } from "@/lib/core/events";

/**
 * AI-driven cancel: ChatWidget routes to /customer?tab=bookings&
 * cancelBooking=<id>, the customer dashboard turns that into this event once
 * the bookings tab has mounted, and this listener performs the cancel.
 *
 * No confirm() here: the AI flow already confirmed with the user before
 * dispatching (the action is in DESTRUCTIVE_ACTIONS and gated behind a
 * Proceed button on the chat side). Re-confirming would be double-prompting.
 */
export function useCancelBookingEvent(
  performCancel: (bookingId: string) => Promise<boolean>,
): void {
  useEffect(() => {
    const remove = listenCafeEvent<{ bookingId?: unknown }>(
      CANCEL_BOOKING,
      (event) => {
        const bookingId = event.detail?.bookingId;

        if (typeof bookingId !== "string" || bookingId.length === 0) {
          console.warn(
            "[BookingsTab] cancel event received with no bookingId; ignoring",
          );
          return;
        }

        void performCancel(bookingId);
      },
    );

    return remove;
  }, [performCancel]);
}