import { CATALOG_MAX_GALLERY_IMAGES, CATALOG_MAX_UPLOAD_MB } from "@/types/catalog";

import type { GalleryValidation } from "../types";

const MAX_UPLOAD_BYTES = CATALOG_MAX_UPLOAD_MB * 1024 * 1024;

/** Returns an error message, or `null` when the file is acceptable. */
export function validateMainFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Background must be an image file.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `Background image must be under ${CATALOG_MAX_UPLOAD_MB}MB.`;
  }

  return null;
}

export function validateGalleryFiles(
  files: readonly File[],
  existingCount: number,
): GalleryValidation {
  const remainingSlots = Math.max(0, CATALOG_MAX_GALLERY_IMAGES - existingCount);

  if (remainingSlots === 0) {
    return {
      ok: false,
      error: `Gallery is full (max ${CATALOG_MAX_GALLERY_IMAGES}). Remove an existing image first.`,
    };
  }

  const capped = files.slice(0, remainingSlots);

  const badType = capped.find((file) => !file.type.startsWith("image/"));

  if (badType) {
    return { ok: false, error: `"${badType.name}" is not an image.` };
  }

  const oversized = capped.find((file) => file.size > MAX_UPLOAD_BYTES);

  if (oversized) {
    return {
      ok: false,
      error: `"${oversized.name}" exceeds the ${CATALOG_MAX_UPLOAD_MB}MB limit.`,
    };
  }

  return { ok: true, files: capped };
}
