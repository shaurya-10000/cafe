import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/utils/supabase/server";

import { ROLE_ADMIN } from "./adminAccess";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AdminContextResult =
  | { ok: true; supabase: SupabaseServerClient; actorId: string }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "forbidden" }
  | {
      ok: false;
      reason: "lookup_failed";
      userId: string;
      code?: string;
      cause: unknown;
    };

/**
 * Resolves the signed-in Clerk user and confirms they are an admin per
 * `public.profiles.role`, returning the caller's RLS-bound Supabase client.
 *
 * This is a fast-fail UX layer, NOT the security boundary: the `*_admin_write`
 * RLS policies (`is_admin_v2()`) enforce the real rule at the database
 * regardless of what this does. Checking here just gives a non-admin a clear
 * message instead of a mutation that silently affects zero rows. It reads the
 * caller's OWN profile row, which profiles RLS already permits.
 *
 * Never logs anything itself: callers decide what is safe to log (a non-admin
 * probing an endpoint should not find their `userId` echoed into logs).
 */
export async function resolveAdminContext(): Promise<AdminContextResult> {
  const { userId } = await auth();

  if (!userId) return { ok: false, reason: "unauthenticated" };

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      reason: "lookup_failed",
      userId,
      code: error.code,
      cause: error,
    };
  }

  if (profile?.role !== ROLE_ADMIN) return { ok: false, reason: "forbidden" };

  return { ok: true, supabase, actorId: userId };
}
