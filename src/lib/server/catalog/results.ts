import { revalidatePath } from "next/cache";

import { z } from "zod";

import type { CatalogActionResult } from "./types";

export function toErrorResult(
  err: unknown,
  fallback: string,
): CatalogActionResult {
  if (err instanceof z.ZodError) {
    return { ok: false, error: err.issues[0]?.message ?? fallback };
  }

  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/admin");
}
