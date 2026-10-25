const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Postgres returns booking_time as a `time` column, which serializes to
 * "HH:MM:SS" over PostgREST. Shown everywhere as "7:30 PM".
 */
export function formatBookingTime(
  raw?: string | null,
  fallback = "No Time",
): string {
  if (!raw) return fallback;

  const trimmed = raw.trim();

  if (!trimmed) return fallback;

  const match = TIME_PATTERN.exec(trimmed);

  if (!match) return trimmed;

  const hours24 = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours24) || hours24 < 0 || hours24 > 23) return trimmed;
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 59) return trimmed;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * "2026-10-25" -> "Sun, Oct 25" (year added only when it is not this year).
 * Parsed by hand so the date never shifts with the viewer's timezone.
 */
export function formatBookingDate(
  raw?: string | null,
  fallback = "No Date",
  now: Date = new Date(),
): string {
  if (!raw) return fallback;

  const trimmed = raw.trim();

  if (!trimmed) return fallback;

  const match = DATE_PATTERN.exec(trimmed);

  if (!match) return trimmed;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime()) || date.getMonth() !== month - 1) {
    return trimmed;
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  if (year !== now.getFullYear()) options.year = "numeric";

  return new Intl.DateTimeFormat("en-US", options).format(date);
}