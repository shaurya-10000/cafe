import type { MoneyFormatter } from "../types";

/**
 * Builds a money formatter once per currency.
 *
 * Accepts `string` for tolerance at the boundary (a caller might still hand
 * a raw NUMERIC through) but the row type declares `number | null`, so in
 * practice this always sees a number.
 *
 * Falls back to a plain "<CUR> 0.00" output if the currency code is not a
 * valid ISO 4217 code (business_settings.currency is only length-checked at
 * the DB layer, not ISO-validated).
 */
export function createMoneyFormatter(currency: string): MoneyFormatter {
  let formatter: Intl.NumberFormat | null;

  try {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  } catch {
    formatter = null;
  }

  return (value) => {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : 0;

    const safe = Number.isFinite(numeric) ? numeric : 0;

    return formatter ? formatter.format(safe) : `${currency} ${safe.toFixed(2)}`;
  };
}
