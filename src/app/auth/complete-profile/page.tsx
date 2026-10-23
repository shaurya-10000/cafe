import { redirect } from "next/navigation";

/**
 * Legacy route. The "complete your profile" step was removed (Clerk's sign-up
 * already collects what we need and the Clerk webhook creates the `profiles`
 * row), but old bookmarks and emails may still point here, so it sends them
 * home with a temporary (307) redirect instead of a 404.
 *
 * To retire it for good: remove any internal references, add a permanent
 * redirect via `redirects()` in next.config, then delete this file.
 *
 * `redirect()` throws NEXT_REDIRECT, so it must not sit inside a try/catch.
 */
export default function CompleteProfilePage(): never {
  redirect("/");
}
