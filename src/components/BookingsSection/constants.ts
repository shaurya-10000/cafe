import type { BookingFormData, BusinessSettings } from "./types";

export const SECTION_ID = "bookings";

/**
 * Fallback party-size bounds. The live upper bound is read from
 * `business_public_settings.max_party_size` (an anonymous-readable view), so a
 * business that raised its cap from the default 20 to 50 will accept 50-cover
 * bookings. `MAX_PARTY_SIZE` is used only until that fetch resolves and as a
 * hard ceiling if the view returns something absurd.
 */
export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 20;
export const HARD_MAX_PARTY_SIZE = 100;

export const SPECIAL_REQUESTS_MAX_LENGTH = 500;

export const LOCATIONS_RETRY_DELAY_MS = 1200;

export const EVENTS = {
  /** Fired by the AI concierge to prefill the booking form. */
  PREFILL_BOOKING: "cafe_prefill_booking",
  /** Fired by this component when a signed-out user tries to book. */
  REQUIRE_SIGNIN: "cafe_require_signin",
} as const;

/** @deprecated use `EVENTS.PREFILL_BOOKING`. */
export const PREFILL_EVENT_NAME = EVENTS.PREFILL_BOOKING;

/**
 * Client-side UX validation only. `bookings.user_email` has no DB-level
 * format CHECK, and notification text is generated server-side, so this
 * regex is deliberately permissive: a false positive here is worse than a
 * false negative (the server will accept anything it can store).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const DEFAULT_BOOKING_FORM_DATA: Readonly<BookingFormData> =
  Object.freeze({
    date: "",
    time: "",
    partySize: "2",
    email: "",
    locationId: "",
    specialRequests: "",
  });

export const DEFAULT_BUSINESS_SETTINGS: Readonly<BusinessSettings> =
  Object.freeze({
    maxPartySize: MAX_PARTY_SIZE,
    businessName: null,
  });

export const COPY = {
  heading: "Book your ritual",
  subheading:
    "From private corners to communal tables. Secure your spot at any of our locations.",
  submitIdle: "Confirm booking",
  submitAuth: "Sign in to book",
  submitBusy: "Securing your table\u2026",
  successTitle: "Table secured.",
  successRetry: "Modify booking",
} as const;
