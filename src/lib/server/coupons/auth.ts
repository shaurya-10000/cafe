import {
  resolveAdminContext,
  type SupabaseServerClient,
} from "@/lib/server/admin/adminContext";

export type CouponAdminAuth =
  | { ok: true; supabase: SupabaseServerClient }
  | { ok: false; error: string };

/** Admin gate for the coupon actions; maps each failure to a user-safe message. */
export async function authorizeCouponAdmin(): Promise<CouponAdminAuth> {
  const ctx = await resolveAdminContext();

  if (ctx.ok) return { ok: true, supabase: ctx.supabase };

  switch (ctx.reason) {
    case "unauthenticated":
      return { ok: false, error: "Not authenticated." };

    case "lookup_failed":
      console.error(
        "[couponActions] requireAdmin: profile lookup failed",
        { userId: ctx.userId, code: ctx.code },
        ctx.cause,
      );

      return { ok: false, error: "Could not verify permissions." };

    default:
      return { ok: false, error: "Admin access required." };
  }
}
