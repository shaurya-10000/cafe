import {
  deleteLocationImage,
  uploadLocationImage,
  type ActionResult,
} from "@/app/admin/actions/LocationActions";

/** Uploads an image; a thrown error (network) becomes a normal failure result. */
export async function uploadImage(
  file: File,
): Promise<ActionResult<{ url: string }>> {
  const formData = new FormData();
  formData.set("image", file);

  try {
    return await uploadLocationImage(formData);
  } catch (error) {
    console.error("[LocationsTab] image upload threw", error);

    return { success: false, error: "Upload failed. Please try again." };
  }
}

/**
 * Best-effort cleanup of a storage object. Never throws, never blocks the
 * UI: an orphaned file is harmless and unreferenced.
 */
export async function deleteImageBestEffort(url: string): Promise<void> {
  try {
    await deleteLocationImage(url);
  } catch (error) {
    console.error("[LocationsTab] image cleanup threw", { url }, error);
  }
}
