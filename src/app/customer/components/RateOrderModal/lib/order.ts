import { NOT_RATABLE_REASONS } from "../constants";
import type { CatalogNameRow, OrderLineItem, ReviewedRow } from "../types";

/**
 * orders.items is only guaranteed to contain {item_id, quantity} objects;
 * pull out the unique, non-empty item ids.
 */
export function extractItemIds(items: unknown): string[] {
  const lines = (Array.isArray(items) ? items : []) as {
    item_id?: string;
  }[];

  return Array.from(
    new Set(
      lines
        .map((line) => line.item_id)
        .filter((id): id is string => typeof id === "string" && !!id),
    ),
  );
}

export function getNotRatableReason(status: string): string {
  return status === "declined" || status === "refunded"
    ? NOT_RATABLE_REASONS.cancelled
    : NOT_RATABLE_REASONS.notCompleted;
}

/**
 * A catalog item can be hard-deleted after the order was placed (the order's
 * own jsonb snapshot has no such protection). A line with no resolvable name
 * has no valid catalog_item_id to attach a review to, so it is excluded
 * rather than shown as a row that can never submit.
 */
export function buildLineItems(
  itemIds: readonly string[],
  catalogRows: readonly CatalogNameRow[],
): OrderLineItem[] {
  const nameById = new Map(catalogRows.map((row) => [row.id, row.name]));

  return itemIds
    .filter((id) => nameById.has(id))
    .map((id) => ({ catalogItemId: id, name: nameById.get(id) as string }));
}

export function extractReviewedIds(rows: readonly ReviewedRow[]): Set<string> {
  return new Set(
    rows
      .map((row) => row.catalog_item_id)
      .filter((id): id is string => typeof id === "string" && !!id),
  );
}