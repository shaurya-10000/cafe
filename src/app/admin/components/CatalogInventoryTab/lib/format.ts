import { formatCurrency } from "@/lib/utils/currency";
import type { CatalogItem } from "@/types/catalog";

/** "Category • $4.50" (localized by business currency) plus " • 30 min" for services. */
export function formatProductMeta(
  product: CatalogItem,
  currency: string = "USD",
): string {
  const price = formatCurrency(Number(product.numeric_price || 0), currency);

  const duration =
    product.item_type === "service" && product.duration_minutes
      ? ` \u2022 ${product.duration_minutes} min`
      : "";

  return `${product.category} \u2022 ${price}${duration}`;
}