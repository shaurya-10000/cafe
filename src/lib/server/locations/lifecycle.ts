import { withAdmin } from "./auth";
import { revalidateLocationPaths } from "./paths";
import { UUID_SCHEMA } from "./schema";
import type { ActionResult } from "./types";

// This schema has no archived_at, so "archive" and "restore" are both just
// the is_active flag flip.
export function setActive(id: string, isActive: boolean): Promise<ActionResult> {
  return withAdmin<object>(async (supabase) => {
    const idResult = UUID_SCHEMA.safeParse(id);

    if (!idResult.success) {
      return { success: false, error: "Invalid location ID." };
    }

    const { error } = await supabase
      .from("business_locations")
      .update({ is_active: isActive })
      .eq("id", idResult.data);

    if (error) {
      console.error(
        "[locationActions] active-flag update failed",
        { locationId: idResult.data, isActive, code: error.code },
        error,
      );

      return {
        success: false,
        error: `Unable to ${isActive ? "reactivate" : "deactivate"} this location.`,
      };
    }

    revalidateLocationPaths();

    return { success: true };
  });
}

/**
 * Permanent, destructive delete. `bookings.location_id` references this table
 * `on delete restrict`, so deleting a location with any booking history fails
 * at the database level (Postgres 23503): surfaced as a friendly message.
 */
export function removeLocation(id: string): Promise<ActionResult> {
  return withAdmin<object>(async (supabase) => {
    const idResult = UUID_SCHEMA.safeParse(id);

    if (!idResult.success) {
      return { success: false, error: "Invalid location ID." };
    }

    const { error } = await supabase
      .from("business_locations")
      .delete()
      .eq("id", idResult.data);

    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          error:
            "This location has bookings on record and can't be permanently " +
            "deleted. Deactivate it instead.",
        };
      }

      console.error(
        "[locationActions] location delete failed",
        { locationId: idResult.data, code: error.code },
        error,
      );

      return { success: false, error: "Unable to delete this location." };
    }

    revalidateLocationPaths();

    return { success: true };
  });
}
