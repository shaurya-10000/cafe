"use server";

import { deleteImage, uploadImage } from "@/lib/server/locations/images";
import { setActive, removeLocation } from "@/lib/server/locations/lifecycle";
import { moveLocation } from "@/lib/server/locations/reorder";
import { saveLocation } from "@/lib/server/locations/save";
import type { ActionResult as ActionResultShape } from "@/lib/server/locations/types";

// Type-only export: erased at compile time (see couponActions.ts).
export type ActionResult<T = object> = ActionResultShape<T>;

export async function uploadLocationImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return uploadImage(formData);
}

/** Best-effort: a failure leaves an orphaned, unreferenced object. */
export async function deleteLocationImage(
  imageUrl: string,
): Promise<ActionResult> {
  return deleteImage(imageUrl);
}

export async function createOrUpdateLocation(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return saveLocation(formData);
}

export async function setLocationActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  return setActive(id, isActive);
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  return removeLocation(id);
}

export async function reorderLocation(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return moveLocation(id, direction);
}
