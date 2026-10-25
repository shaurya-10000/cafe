import { DATE_LOCALE } from "../constants";

export function formatCouponDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `now` until `iso`, rounded up; null for an invalid date. */
export function daysUntil(iso: string, now: number = Date.now()): number | null {
  const target = new Date(iso).getTime();

  if (Number.isNaN(target)) return null;

  return Math.ceil((target - now) / DAY_MS);
}