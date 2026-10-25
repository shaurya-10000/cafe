/** Short currency labels for chart axes, e.g. $1.2K. */
export function createCompactCurrencyFormatter(
  currency: string,
): (value: number) => string {
  let formatter: Intl.NumberFormat | null;

  try {
    formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
  } catch {
    formatter = null;
  }

  return (value) => {
    const safe = Number.isFinite(value) ? value : 0;

    return formatter ? formatter.format(safe) : String(Math.round(safe));
  };
}
