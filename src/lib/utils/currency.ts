export function normalizeCurrency(raw: unknown): string {
  return typeof raw === "string" && /^[A-Za-z]{3}$/.test(raw.trim())
    ? raw.trim().toUpperCase()
    : "USD";
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "USD",
): string {
  const code = normalizeCurrency(currency);
  const value = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}