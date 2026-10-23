import { createClient as createServerSupabase } from "@/utils/supabase/server";

export const NOT_AUTHORIZED = "You don't have permission to do that.";

/**
 * True only when the signed-in caller is an admin. Evaluated by the database
 * (is_admin_v2) with the caller's own Clerk token, so it can't be spoofed
 * from the client. Browser roles hold no SELECT on catalog_items (migration
 * 0023), so catalog writes run with the service role *after* this passes.
 * Server-only.
 */
export async function isCallerAdmin(): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("is_admin_v2");
  if (error) throw error;
  return data === true;
}