import type { SupabaseLikeError } from "../types";

/**
 * Map a Postgres/PostgREST error into user-facing copy.
 *
 * The database raises errors through several distinct paths, so a bare
 * SQLSTATE switch is not enough:
 *
 *   - `23505`: the `uq_booking_user_slot` partial unique index fires when
 *     the same user double-books a slot at one location.
 *   - `23514`: **overloaded**. The capacity trigger raises with an explicit
 *     `errcode='23514'`; the booking-cap trigger (max active bookings per
 *     user) also raises `23514`; and `expire_unpaid_orders`/coupon paths use
 *     it too. We disambiguate on the message text.
 *   - `23503`: FK violation on `location_id` -> `business_locations`.
 *   - `42501`: RLS denied (the insert policy requires
 *     `user_id = requesting_user_id()`).
 *   - `P0001`: plain `raise exception '...'` from every other trigger in the
 *     chain. Those messages are written for customers and surfaced verbatim.
 */
export function mapSupabaseErrorToMessage(
  error: SupabaseLikeError | null | undefined,
): string {
  if (!error) return "Something went wrong. Please try again.";

  switch (error.code) {
    case "23505":
      return "You already have a booking at that location for that date and time.";

    case "23514": {
      const message = error.message ?? "";

      if (/upcoming bookings/i.test(message)) {
        return message;
      }

      if (/capacity|fully booked/i.test(message)) {
        return "That time slot is fully booked \u2014 please choose another time.";
      }

      return "That booking isn't available right now \u2014 please adjust and try again.";
    }

    case "23503":
      return "That location is no longer available. Please pick another.";

    case "22007":
    case "22008":
      return "That date or time isn't valid \u2014 please reselect them.";

    case "42501":
      return "You don't have permission to make this booking.";

    default: {
      const message = error.message?.trim();

      return message && message.length <= 160
        ? message
        : "Failed to secure your booking. Please try again.";
    }
  }
}
