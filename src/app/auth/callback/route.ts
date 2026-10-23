import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSafeRedirectPath } from "./safeRedirect";

/**
 * Post-auth landing route. `redirect_url` is attacker-controllable, so it goes
 * through getSafeRedirectPath (see safeRedirect.ts for the threat model).
 *
 * `redirect()` throws NEXT_REDIRECT, which Next.js catches at the framework
 * boundary, so it must not be called inside a try/catch that swallows it.
 * A route file may only export HTTP handlers, which is why the logic lives in
 * its own module.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  redirect(getSafeRedirectPath(searchParams.get("redirect_url"), origin));
}
