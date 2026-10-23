import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings",
};

/**
 * Server-side auth gate for every route under `/settings`.
 *
 * Runs on the server before any client component in the tree mounts, so an
 * unauthenticated visitor never sees a frame of settings chrome before the
 * redirect. A client-side `useUser()` check would always race the first paint.
 *
 * `redirect()` throws NEXT_REDIRECT, which Next.js catches at the framework
 * boundary, so it must not be called inside a try/catch that swallows it.
 *
 * Clerk reads the post-sign-in return location from the `redirect_url` query
 * parameter. Any other name (this used to say `redirect_to`) is ignored and
 * the user lands on the default page instead of back here.
 */
export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=%2Fsettings");
  }

  return <>{children}</>;
}
