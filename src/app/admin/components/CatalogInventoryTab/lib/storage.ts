import { CATALOG_MEDIA_BUCKET } from "@/types/catalog";

/**
 * Supabase public URLs look like:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * Returns the object path inside the catalog bucket, or `null` if the URL
 * does not belong to it.
 */
export function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${CATALOG_MEDIA_BUCKET}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(publicUrl.slice(index + marker.length));
}
