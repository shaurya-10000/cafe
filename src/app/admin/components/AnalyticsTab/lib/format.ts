import type { CurrencyFormatter } from "../types";

/**
 * Builds a currency formatter once per currency.
 *
 * `business_settings.currency` is only constrained to 3 characters at the DB
 * layer, not validated against real ISO 4217 codes: a garbage value
 * shouldn't crash the dashboard, just degrade.
 */
export function createCurrencyFormatter(currency: string): CurrencyFormatter {
  let formatter: Intl.NumberFormat | null;

  try {
    formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  } catch {
    formatter = null;
  }

  return (value) => {
    const safe = Number.isFinite(value) ? value : 0;

    return formatter ? formatter.format(safe) : `${currency} ${safe.toFixed(2)}`;
  };
}

let countFormatter: Intl.NumberFormat | null = null;

export function formatCount(value: number): string {
  countFormatter ??= new Intl.NumberFormat();

  return countFormatter.format(Number.isFinite(value) ? value : 0);
}

let chartDateFormatter: Intl.DateTimeFormat | null = null;

export function formatChartDate(value: unknown): string {
  if (typeof value !== "string") return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  chartDateFormatter ??= new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  return chartDateFormatter.format(date);
}

/**
 * Recharts' Tooltip `formatter` prop is generically typed as
 * `(value: TValue, ...) => ...` where `TValue` defaults to
 * `number | string | Array<number | string>`. Annotating the callback
 * parameter as a narrower `number` fights that generic (a classic
 * contravariance mismatch), and depending on the exact recharts/TypeScript
 * version in play, the mismatch either resolves via inference or surfaces
 * as a hard type error. The formatters therefore take no explicit parameter
 * type and coerce defensively through this helper.
 */
export function toChartNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(value) && value.length > 0) {
    return toChartNumber(value[0]);
  }

  return 0;
}
