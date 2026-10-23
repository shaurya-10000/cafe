import { DATE_REGEX, TIME_REGEX } from "../constants";

/**
 * Browser-local date as `yyyy-mm-dd`.
 *
 * Deliberately avoids `toISOString()`, which performs UTC conversion and can
 * return yesterday's date for users east of UTC late at night.
 */
export function getTodayDateString(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) return "";

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Strictly parse `yyyy-mm-dd` + `HH:mm` as a browser-local `Date`.
 *
 * Invalid calendar values like `2026-02-31` are rejected rather than
 * silently normalised by `new Date(...)`.
 *
 * @remarks
 * This is a *client-local* check. The server's `set_booking_timestamp()`
 * resolves the same wall-clock fields against the **location's** timezone
 * column. For a customer and a location in different timezones, the two can
 * disagree by the offset between them. The server always wins: this is a
 * fast first-pass filter only, and never a hard gate on submission.
 */
export function parseLocalDateTime(date: string, time: string): Date | null {
  if (!DATE_REGEX.test(date) || !TIME_REGEX.test(time)) return null;

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hours = Number(time.slice(0, 2));
  const minutes = Number(time.slice(3, 5));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  const candidate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (Number.isNaN(candidate.getTime())) return null;

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day ||
    candidate.getHours() !== hours ||
    candidate.getMinutes() !== minutes
  ) {
    return null;
  }

  return candidate;
}

export function isPastDateTime(
  date: string,
  time: string,
  now: Date = new Date(),
): boolean {
  const candidate = parseLocalDateTime(date, time);

  if (!candidate || Number.isNaN(now.getTime())) return false;

  return candidate.getTime() < now.getTime();
}
