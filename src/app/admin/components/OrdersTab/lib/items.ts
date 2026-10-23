import { ITEM_PLACEHOLDERS } from "../constants";
import type { OrderItemLine, OrderRow } from "../types";

/** Sorted, de-duplicated catalog ids referenced by the given orders. */
export function collectItemIds(orders: readonly OrderRow[]): string[] {
  const ids = new Set<string>();

  for (const order of orders) {
    for (const line of order.items ?? []) {
      if (line?.item_id) ids.add(line.item_id);
    }
  }

  return Array.from(ids).sort();
}

function legacyName(line: OrderItemLine): string | undefined {
  return line.name?.trim() || line.product_name?.trim() || undefined;
}

/**
 * Resolves the display name of an order line.
 *
 * `orders.items` only guarantees `{ item_id, quantity }`. Names are resolved
 * live from `catalog_items`, so a rename shows immediately and a deleted
 * item shows a clear placeholder instead of a stale snapshot.
 */
export function resolveItemName(
  line: OrderItemLine,
  namesById: ReadonlyMap<string, string>,
  resolvedIds: ReadonlySet<string>,
): string {
  if (line?.item_id) {
    const live = namesById.get(line.item_id);

    if (live) return live;

    // Resolved but not found: prefer a legacy stored name if this row
    // carries one, else show the placeholder.
    if (resolvedIds.has(line.item_id)) {
      return legacyName(line) ?? ITEM_PLACEHOLDERS.unavailable;
    }

    return ITEM_PLACEHOLDERS.loading;
  }

  // No item_id at all (very old rows): fall back to a stored name.
  return legacyName(line) ?? ITEM_PLACEHOLDERS.unknown;
}
