/**
 * Builds a price formatter once per currency. An unknown currency code makes
 * Intl.NumberFormat throw, so fall back to a plain "CODE 0.00" string.
 */
export function createPriceFormatter(
  currency: string,
): (value: number) => string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    });
    return (value) => formatter.format(value);
  } catch {
    return (value) => `${currency} ${value.toFixed(2)}`;
  }
}

const DIVISIONS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> =
  [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

let relativeFormatter: Intl.RelativeTimeFormat | null = null;

/** "3 days ago", "last month", ... or "" for an unparseable date. */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  relativeFormatter ??= new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);

  for (const [unit, secondsInUnit] of DIVISIONS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return relativeFormatter.format(
        Math.round(diffSeconds / secondsInUnit),
        unit,
      );
    }
  }

  return relativeFormatter.format(diffSeconds, "second");
}
