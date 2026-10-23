import { withAdmin } from "./auth";
import { revalidateLocationPaths } from "./paths";
import { UUID_SCHEMA } from "./schema";
import type { ActionResult } from "./types";

const REORDER_FAILED = "Unable to reorder locations right now.";

// The actual swap happens in ONE Postgres statement via the
// swap_location_display_order() RPC (see supabase_location_reorder_rpc.sql)
// so the two rows' display_order values change atomically. Two independent
// .update() calls could leave both rows with the same display_order if the
// second request failed after the first succeeded.
export function moveLocation(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return withAdmin<object>(async (supabase) => {
    const idResult = UUID_SCHEMA.safeParse(id);

    if (!idResult.success) {
      return { success: false, error: "Invalid location ID." };
    }

    const { data: current, error: currentError } = await supabase
      .from("business_locations")
      .select("id, display_order")
      .eq("id", idResult.data)
      .single();

    if (currentError || !current) {
      return { success: false, error: "Location not found." };
    }

    const { data: neighbor, error: neighborError } = await supabase
      .from("business_locations")
      .select("id, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: direction === "down" })
      .gt("display_order", direction === "down" ? current.display_order : -1)
      .lt(
        "display_order",
        direction === "up" ? current.display_order : Number.MAX_SAFE_INTEGER,
      )
      .limit(1)
      .maybeSingle();

    if (neighborError) {
      console.error(
        "[locationActions] reorder neighbor lookup failed",
        { locationId: idResult.data, direction, code: neighborError.code },
        neighborError,
      );

      return { success: false, error: REORDER_FAILED };
    }

    // Already at the top/bottom.
    if (!neighbor) return { success: true };

    const { error: swapError } = await supabase.rpc("swap_location_display_order", {
      p_location_id_a: current.id,
      p_location_id_b: neighbor.id,
    });

    if (swapError) {
      console.error(
        "[locationActions] reorder swap failed",
        {
          locationId: current.id,
          neighborId: neighbor.id,
          direction,
          code: swapError.code,
        },
        swapError,
      );

      return { success: false, error: REORDER_FAILED };
    }

    revalidateLocationPaths();

    return { success: true };
  });
}
