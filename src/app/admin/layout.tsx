import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/server/admin/adminAccess";

/**
 * Admin layout: server-side auth AND authorization gate.
 *
 * Authorization contract (shared with the admin server actions through
 * `getAdminAccess`, and matching `is_admin_v2()` in supabase.sql):
 *   `public.profiles.role = 'admin'` for the caller's Clerk `sub`.
 *
 * Clerk publicMetadata / sessionClaims are deliberately NOT consulted.
 *
 * `redirect()` works by throwing a special NEXT_REDIRECT error that Next.js
 * catches at the framework boundary, so it must be called outside any
 * try/catch that could swallow it. Every redirect below is therefore at the
 * top level of the function body.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_to=/admin");
  }

  const access = await getAdminAccess(userId);

  // Fail closed on any lookup failure (network error, missing table, ...).
  //
  // The log line is deliberate: without it, a transient Supabase outage
  // would look identical to "you are not an admin", with every signed-in
  // user bounced to /dashboard and no way to tell a permissions problem
  // from an infrastructure one.
  if (access.status === "error") {
    console.error(
      "[admin/layout] profile lookup failed - failing closed",
      { userId, code: access.code },
      access.cause,
    );

    redirect("/dashboard");
  }

  if (access.status !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
