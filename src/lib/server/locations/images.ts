import { z } from "zod";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  IMAGE_BUCKET,
  IMAGE_PATH_PREFIX,
  MAX_IMAGE_BYTES,
} from "./constants";
import { withAdmin } from "./auth";
import type { ActionResult } from "./types";

/**
 * Runtime availability check for crypto.randomUUID(). Available in Node 19+
 * and every browser this app targets, but a missing global would surface as
 * a cryptic "crypto.randomUUID is not a function" mid-upload.
 */
const hasRandomUUID =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";

// Uploads into the pre-existing "catalog-media" bucket under a locations/
// prefix. storage.objects RLS (catalog_media_admin_insert) independently
// requires is_admin_v2(), so the server-side check here is defense-in-depth,
// not the real boundary.

export function uploadImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return withAdmin<{ url: string }>(async (supabase) => {
    if (!hasRandomUUID) {
      return {
        success: false,
        error: "Server runtime is missing crypto.randomUUID \u2014 can't upload.",
      };
    }

    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "No image file was provided." };
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return {
        success: false,
        error: "Please upload a JPEG, PNG, or WebP image.",
      };
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return { success: false, error: "Images must be 5MB or smaller." };
    }

    const extension = ALLOWED_IMAGE_EXTENSIONS[file.type] ?? "jpg";
    const path = `${IMAGE_PATH_PREFIX}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error(
        "[locationActions] image upload failed",
        { bucket: IMAGE_BUCKET, path, contentType: file.type, size: file.size },
        uploadError,
      );

      return {
        success: false,
        error: "Unable to upload the image. Please try again.",
      };
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

    return { success: true, url: data.publicUrl };
  });
}

/**
 * Deletes a previously-uploaded location image from storage. Best-effort: a
 * failure just leaves an orphaned, unreferenced object in the bucket rather
 * than blocking the caller's actual intent.
 */
export function deleteImage(imageUrl: string): Promise<ActionResult> {
  return withAdmin<object>(async (supabase) => {
    const parsed = z.string().url().max(2048).safeParse(imageUrl);

    if (!parsed.success) return { success: false, error: "Invalid image URL." };

    // Only ever delete objects this app itself uploaded under locations/.
    const marker = `/${IMAGE_BUCKET}/${IMAGE_PATH_PREFIX}/`;
    const markerIndex = parsed.data.indexOf(marker);

    // Not one of ours: nothing to do.
    if (markerIndex === -1) return { success: true };

    const path = parsed.data.slice(markerIndex + `/${IMAGE_BUCKET}/`.length);

    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);

    if (error) {
      console.error(
        "[locationActions] image delete failed",
        { bucket: IMAGE_BUCKET, path },
        error,
      );

      return {
        success: false,
        error: "Unable to remove the image. Please try again.",
      };
    }

    return { success: true };
  });
}
