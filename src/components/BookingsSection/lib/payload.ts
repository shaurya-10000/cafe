import { SPECIAL_REQUESTS_MAX_LENGTH } from "../constants";
import type {
  BookingFormData,
  BookingInsertPayload,
  BookingUser,
} from "../types";

/**
 * Payload contract:
 *   - `user_id` MUST equal `requesting_user_id()` per the
 *     `bookings_insert_own` RLS policy. The DB rejects any mismatch.
 *   - `status` is deliberately omitted: `enforce_booking_rules()` forces
 *     `pending` for untrusted callers regardless.
 *   - `booking_at`, `booking_range` are derived by
 *     `set_booking_timestamp()` from `booking_date`/`booking_time` and the
 *     location's timezone. Never send them.
 */
export function buildBookingPayload(
  user: BookingUser,
  values: BookingFormData,
): BookingInsertPayload {
  return {
    user_id: user.id,
    user_name:
      user.fullName?.trim() ||
      user.username?.trim() ||
      user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      "Guest",
    user_email: values.email.trim(),
    booking_date: values.date,
    booking_time: values.time,
    party_size: Number(values.partySize),
    location_id: values.locationId,
    special_requests:
      values.specialRequests.trim().slice(0, SPECIAL_REQUESTS_MAX_LENGTH) ||
      null,
  };
}
