import {
  DEFAULT_GUEST_NAME,
  NO_EMAIL_LABEL,
  NO_TIME_LABEL,
} from "../constants";

export function formatGuestName(name?: string | null): string {
  const trimmed = name?.trim();

  return trimmed ? trimmed : DEFAULT_GUEST_NAME;
}

export function formatGuestEmail(email?: string | null): string {
  const trimmed = email?.trim();

  return trimmed ? trimmed : NO_EMAIL_LABEL;
}

/**
 * Postgres returns booking_time as a `time` column, which serializes to
 * "HH:MM:SS" over PostgREST. The rest of the app renders it as "HH12:MI AM".
 * This formats the same way so a booking looks identical wherever it appears.
 */
export function formatBookingTime(raw?: string | null): string {
  if (!raw) return NO_TIME_LABEL;

  const trimmed = raw.trim();

  if (!trimmed) return NO_TIME_LABEL;

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);

  if (!match) return trimmed;

  const hours24 = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours24) || hours24 < 0 || hours24 > 23) return trimmed;
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 59) return trimmed;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMinutes = String(minutes).padStart(2, "0");

  return `${hours12}:${paddedMinutes} ${period}`;
}
