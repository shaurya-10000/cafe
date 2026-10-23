import type { FavoriteItem } from "../types";

/** PostgREST code for "no rows"; also covers a not-yet-migrated schema. */
export function isMissingFavoritesTable(error: {
  code?: string;
  message: string;
}): boolean {
  return (
    error.code === "PGRST116" ||
    error.message.includes('relation "favorites" does not exist')
  );
}

export function mapFavoriteRows(
  rows: ReadonlyArray<{ catalog_items: unknown }>,
): FavoriteItem[] {
  return rows
    .filter((row) => row.catalog_items !== null)
    .map((row) => row.catalog_items as FavoriteItem);
}