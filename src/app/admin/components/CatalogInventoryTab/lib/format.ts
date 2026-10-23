import { PRICE_PREFIX } from "../constants";
import type { CatalogItem } from "@/types/catalog";

/** "Category \u2022 $4.50" plus " \u2022 30 min" for services. */
export function formatProductMeta(product: CatalogItem): string {
  const price = Number(product.numeric_price || 0).toFixed(2);

  const duration =
    product.item_type === "service" && product.duration_minutes
      ? ` \u2022 ${product.duration_minutes} min`
      : "";

  return `${product.category} \u2022 ${PRICE_PREFIX}${price}${duration}`;
}
