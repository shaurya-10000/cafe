import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import type { CatalogItemInput } from "@/app/admin/actions/catalogActions";
import type { CatalogItem } from "@/types/catalog";

import type { CatalogCategory, ToggleField } from "../types";

export function filterProducts(
  products: readonly CatalogItem[],
  searchTerm: string,
): CatalogItem[] {
  const query = searchTerm.trim().toLowerCase();

  if (!query) return [...products];

  return products.filter((product) => product.name.toLowerCase().includes(query));
}

/** Applies one realtime change to the list, keeping newest-first order. */
export function applyProductChange(
  previous: CatalogItem[],
  payload: RealtimePostgresChangesPayload<CatalogItem>,
): CatalogItem[] {
  if (payload.eventType === "DELETE") {
    const oldId = (payload.old as Partial<CatalogItem>)?.id;

    return previous.filter((product) => product.id !== oldId);
  }

  const row = payload.new as CatalogItem;

  if (!row) return previous;

  const withoutRow = previous.filter((product) => product.id !== row.id);

  return payload.eventType === "INSERT"
    ? [row, ...withoutRow]
    : withoutRow
        .concat(row)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
}

/** The editable fields of an existing item, with optional overrides. */
export function buildItemInput(
  item: CatalogItem,
  overrides: Partial<CatalogItemInput> = {},
): CatalogItemInput {
  return {
    name: item.name,
    numeric_price: item.numeric_price,
    category: item.category as CatalogCategory,
    description: item.description,
    item_type: item.item_type,
    duration_minutes: item.duration_minutes,
    media: item.media,
    is_popular: item.is_popular,
    is_active: item.is_active,
    rating: item.rating,
    ...overrides,
  };
}

export function toggledPatch(
  field: ToggleField,
  value: boolean,
): Partial<Pick<CatalogItem, ToggleField>> {
  return field === "is_active" ? { is_active: value } : { is_popular: value };
}
