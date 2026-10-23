import { CATALOG_MEDIA_BUCKET } from "@/types/catalog";

import { extractStoragePath } from "../lib/storage";
import type { SupabaseClientLike } from "../types";

// Uploads stay client-side (Supabase Storage RLS already restricts writes on
// the catalog-media bucket to is_admin_v2(), so there's no security reason
// to proxy bytes through a server action; it would just add latency). The DB
// row write goes through catalogActions.ts instead of a direct client call,
// for the validation/revalidation reasons noted there.

/** Uploads one image and returns its public URL. Throws on failure. */
export async function uploadCatalogFile(
  supabase: SupabaseClientLike,
  file: File,
): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(CATALOG_MEDIA_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Best-effort removal of storage objects by public URL.
 *
 * Non-fatal: the DB write this cleanup follows already succeeded, so an
 * orphaned file in Storage is a cheap housekeeping problem, not a
 * data-integrity one. A failure is logged, never thrown.
 */
export async function deleteStorageObjects(
  supabase: SupabaseClientLike,
  urls: readonly string[],
): Promise<void> {
  const paths = urls
    .map(extractStoragePath)
    .filter((path): path is string => path !== null);

  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .remove(paths);

  if (error) {
    console.error(
      "[CatalogInventoryTab] storage cleanup failed",
      { bucket: CATALOG_MEDIA_BUCKET, count: paths.length },
      error,
    );
  }
}
