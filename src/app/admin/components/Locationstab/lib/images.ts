import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "../constants";

/** Returns an error message, or `null` when the file is acceptable. */
export function validateLocationImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Please choose a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Images must be 5MB or smaller.";
  }

  return null;
}
