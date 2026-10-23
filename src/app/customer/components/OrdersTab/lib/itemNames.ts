import type {
  CatalogNameRow,
  ItemNameLookup,
  OrderItemLine,
} from "../types";

export const EMPTY_LOOKUP: ItemNameLookup = {
  names: new Map(),
  resolved: new Set(),
};

/**
 * Folds a catalog lookup result into the cache. Requested ids are marked
 * resolved even when the query failed (`rows` is null): a failed lookup
 * should surface as "Item unavailable", not retry forever in a tight loop.
 */
export function mergeLookup(
  prev: ItemNameLookup,
  requestedIds: readonly string[],
  rows: readonly CatalogNameRow[] | null,
): ItemNameLookup {
  const resolved = new Set(prev.resolved);
  for (const id of requestedIds) resolved.add(id);

  if (!rows) {
    return { names: prev.names, resolved };
  }

  const names = new Map(prev.names);
  for (const row of rows) names.set(row.id, row.name);

  return { names, resolved };
}

/**
 * orders.items only guarantees {item_id, quantity}, so names are resolved
 * live from catalog_items rather than trusting `item.name`.
 */
export function resolveItemName(
  line: OrderItemLine,
  lookup: ItemNameLookup,
): string {
  const liveName = line?.item_id ? lookup.names.get(line.item_id) : undefined;
  if (liveName !== undefined) return liveName;

  // Legacy `name` field, if it survived on the row.
  if (line?.name) return line.name;

  // Requested but not returned: the item was deleted from the catalog.
  if (line?.item_id && lookup.resolved.has(line.item_id)) {
    return "Item unavailable";
  }

  return "Loading…";
}