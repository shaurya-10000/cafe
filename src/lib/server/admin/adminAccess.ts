import { supabaseAdmin } from "./supabaseAdmin";

export const ROLE_ADMIN = "admin";

export type AdminAccess =
  | { status: "admin" }
  | { status: "forbidden" }
  | { status: "error"; code?: string; cause: unknown };

/**
 * Authorization contract, shared by the admin layout and the admin server
 * actions (and matching `is_admin_v2()` in supabase.sql):
 *   `public.profiles.role = 'admin'` for the caller's Clerk `sub`.
 *
 * Clerk publicMetadata / sessionClaims are deliberately NOT consulted.
 *
 * Fails closed: a lookup error is reported as `error`, never as admin, but
 * stays distinguishable from `forbidden` so an outage is not mistaken for
 * "you are not an admin".
 */
export async function getAdminAccess(userId: string): Promise<AdminAccess> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { status: "error", code: error.code, cause: error };

  return profile?.role === ROLE_ADMIN
    ? { status: "admin" }
    : { status: "forbidden" };
}
