"use server";

import { createItem } from "@/lib/server/catalog/create";
import { deleteItem } from "@/lib/server/catalog/delete";
import type { CatalogItemInput as CatalogItemInputShape } from "@/lib/server/catalog/schema";
import type {
  CatalogActionResult as CatalogActionResultShape,
  DeleteCatalogItemResult as DeleteCatalogItemResultShape,
} from "@/lib/server/catalog/types";
import { updateItem } from "@/lib/server/catalog/update";

// Type-only exports are erased at compile time, so client components can
// `import type` them without pulling any server code into the bundle.
export type CatalogItemInput = CatalogItemInputShape;
export type CatalogActionResult = CatalogActionResultShape;
export type DeleteCatalogItemResult = DeleteCatalogItemResultShape;

export async function createCatalogItem(
  input: CatalogItemInput,
): Promise<CatalogActionResult> {
  return createItem(input);
}

export async function updateCatalogItem(
  id: string,
  input: CatalogItemInput,
): Promise<CatalogActionResult> {
  return updateItem(id, input);
}

export async function deleteCatalogItem(
  id: string,
): Promise<DeleteCatalogItemResult> {
  return deleteItem(id);
}
