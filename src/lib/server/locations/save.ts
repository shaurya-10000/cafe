import { withAdmin } from "./auth";
import { revalidateLocationPaths } from "./paths";
import { parseLocationForm, toLocationRow } from "./schema";
import type { ActionResult } from "./types";

const SAVE_FAILED = "Unable to save the location. Please try again.";

export function saveLocation(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin<{ id: string }>(async (supabase) => {
    const parsed = parseLocationForm(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload = toLocationRow(parsed.data);

    if (parsed.data.id) {
      const { data, error } = await supabase
        .from("business_locations")
        .update(payload)
        .eq("id", parsed.data.id)
        .select("id")
        .single();

      if (error || !data) {
        console.error(
          "[locationActions] location update failed",
          { locationId: parsed.data.id, code: error?.code },
          error,
        );

        return { success: false, error: SAVE_FAILED };
      }

      revalidateLocationPaths();

      return { success: true, id: data.id as string };
    }

    // New locations join at the end of the display order. Two concurrent
    // creates could race on this read-then-write and compute the same
    // `nextDisplayOrder`, but the visible consequence is only two rows
    // sharing a display_order: they still sort deterministically by
    // (display_order, created_at) in the UI and the admin can reorder to fix
    // it. Not worth a transaction.
    const { data: maxOrderRow } = await supabase
      .from("business_locations")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextDisplayOrder = (maxOrderRow?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("business_locations")
      .insert({ ...payload, display_order: nextDisplayOrder })
      .select("id")
      .single();

    if (error || !data) {
      console.error(
        "[locationActions] location create failed",
        { code: error?.code },
        error,
      );

      return { success: false, error: SAVE_FAILED };
    }

    revalidateLocationPaths();

    return { success: true, id: data.id as string };
  });
}
