import type { CatalogItem } from "@/types/catalog";

import type { PrefillMenuDetail, RequestedItem } from "../types";

/** Normalizes the two supported payload shapes into one list. */
export function getRequestedItems(detail: PrefillMenuDetail): RequestedItem[] {
  if (Array.isArray(detail.itemsToAdd)) {
    return detail.itemsToAdd;
  }

  if (detail.itemToAdd) {
    return [
      {
        itemId: detail.itemToAdd.id,
        itemName: detail.itemToAdd.name,
        quantity: detail.itemToAdd.quantity,
      },
    ];
  }

  return [];
}

function normalizeId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function findRequestedItem(
  items: readonly CatalogItem[],
  requested: RequestedItem,
): CatalogItem | undefined {
  const requestedId = normalizeId(requested.itemId);

  const requestedName =
    typeof requested.itemName === "string"
      ? requested.itemName.trim().toLowerCase()
      : undefined;

  return items.find((item) => {
    if (requestedId && item.id === requestedId) return true;
    if (requestedName && item.name.toLowerCase() === requestedName) return true;
    return false;
  });
}
