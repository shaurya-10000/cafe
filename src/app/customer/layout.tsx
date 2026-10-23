import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Server-side auth gate for every route under `/customer`.
 *
 * This runs on the server *before* any client component in the dashboard
 * tree mounts, so an unauthenticated visitor never sees a frame of the
 * dashboard chrome (sidebar, loading spinners, empty-state cards) before
 * the redirect fires. That's the reason this is a server layout and not
 * a client-side `useUser()` check in `DashboardPage` — the client check
 * would always race the first paint.
 *
 * `redirect()` from `next/navigation` works by throwing a special
 * `NEXT_REDIRECT` error that Next.js catches at the framework boundary.
 * It must therefore be called outside any `try`/`catch` that swallows
 * the error — otherwise the redirect silently becomes a no-op and the
 * visitor sees the dashboard UI.
 *
 * The `redirect_url` query param is what Clerk's `<SignIn />` reads to
 * send the user back here after a successful sign-in. It's URL-encoded
 * by Clerk at read time; we only need to emit it as a plain string here.
 * If you ever change the destination route, verify the param name
 * against your Clerk version's docs — it has been `redirect_url` in
 * older versions and in current ones.
 *
 * Note: this layout is a *middleware-grade* auth check, not an
 * authorization check. It confirms a user is signed in; it says nothing
 * about whether that user is an admin. Admin-only routes are protected
 * separately (see /admin/layout.tsx), which must do its own role check
 * against `profiles.role`.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=%2Fcustomer");
  }

  return <>{children}</>;
}