import {
  resolveAdminContext,
  type SupabaseServerClient,
} from "@/lib/server/admin/adminContext";

import type { ActionResult } from "./types";

const UNAUTHORIZED_RESULT: ActionResult<never> = {
  success: false,
  error: "You are not authorized to perform this action.",
};

/**
 * Runs `run` with the caller's RLS-bound client if (and only if) they are an
 * admin; otherwise returns a generic "not authorized" result. Any failure
 * (not signed in, not an admin, a lookup error, or a thrown error) gets the
 * same answer and logs nothing, so a non-admin probing these endpoints learns
 * nothing and no identity is echoed into logs.
 *
 * Authorization is a pre-check for a clean error: the locations_admin_write
 * RLS policy still rejects the write at the database if this were wrong.
 */
export async function withAdmin<T extends object = object>(
  run: (supabase: SupabaseServerClient) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let ctx: Awaited<ReturnType<typeof resolveAdminContext>>;

  try {
    ctx = await resolveAdminContext();
  } catch {
    return UNAUTHORIZED_RESULT;
  }

  if (!ctx.ok) return UNAUTHORIZED_RESULT;

  return run(ctx.supabase);
}
