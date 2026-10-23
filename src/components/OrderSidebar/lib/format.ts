import { PRICE_LOCALE } from "../constants";

/** Builds the formatter once per currency instead of once per call. */
export function createPriceFormatter(
  currency: string,
): (value: number) => string {
  try {
    const formatter = new Intl.NumberFormat(PRICE_LOCALE, {
      style: "currency",
      currency,
    });

    return (value) => formatter.format(value);
  } catch {
    return (value) => `${currency} ${value.toFixed(2)}`;
  }
}
