import type { CatalogItem } from "@/types/catalog";

export type CatalogActionResult =
  | { ok: true; item: CatalogItem }
  | { ok: false; error: string };

export type DeleteCatalogItemResult =
  | { ok: true; media: string[] }
  | { ok: false; error: string };
