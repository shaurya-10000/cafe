import {
  DATE_REGEX,
  EMAIL_REGEX,
  HARD_MAX_PARTY_SIZE,
  MAX_PARTY_SIZE,
  MIN_PARTY_SIZE,
  SPECIAL_REQUESTS_MAX_LENGTH,
  TIME_REGEX,
} from "../constants";
import type { BookingFormData, FormErrors } from "../types";
import { isPastDateTime } from "./dates";
import { isValidPartySize } from "./partySize";

/**
 * Form-level validation. `maxPartySize` is threaded in so the business
 * setting can widen or narrow the bound without a code change.
 */
export function validateBookingForm(
  data: BookingFormData,
  now: Date = new Date(),
  maxPartySize: number = MAX_PARTY_SIZE,
): FormErrors {
  const errors: FormErrors = {};

  const locationId = data.locationId.trim();
  const date = data.date.trim();
  const time = data.time.trim();
  const partySize = data.partySize.trim();
  const email = data.email.trim();

  if (!locationId) {
    errors.locationId = "Please select a location.";
  }

  if (!date) {
    errors.date = "Please choose a date.";
  } else if (!DATE_REGEX.test(date)) {
    errors.date = "Please choose a valid date.";
  }

  if (!time) {
    errors.time = "Please choose a time.";
  } else if (!TIME_REGEX.test(time)) {
    errors.time = "Please choose a valid time.";
  }

  if (!errors.date && !errors.time && isPastDateTime(date, time, now)) {
    errors.time = "Please choose a future date and time.";
  }

  if (!partySize) {
    errors.partySize = "Enter your party size.";
  } else if (!isValidPartySize(partySize, maxPartySize)) {
    errors.partySize = `Party size must be between ${MIN_PARTY_SIZE} and ${Math.min(
      maxPartySize,
      HARD_MAX_PARTY_SIZE,
    )}.`;
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (data.specialRequests.length > SPECIAL_REQUESTS_MAX_LENGTH) {
    errors.specialRequests = `Keep requests under ${SPECIAL_REQUESTS_MAX_LENGTH} characters.`;
  }

  return errors;
}

export function hasFormErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(Boolean);
}
