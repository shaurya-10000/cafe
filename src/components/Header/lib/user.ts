import { ROLE_ADMIN } from "../constants";
import type { MinimalUser } from "../types";

/**
 * Supabase's persisted profile role is the authorization authority.
 * Client-controlled Clerk metadata is intentionally ignored.
 */
export function resolveIsAdmin(role: string | null | undefined): boolean {
  return role === ROLE_ADMIN;
}

export function getUserDisplayName(user: MinimalUser | null | undefined): string {
  if (!user) return "Account";

  return (
    user.fullName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.trim() ||
    "Account"
  );
}

export function getUserInitial(user: MinimalUser | null | undefined): string {
  const source =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress;

  return source?.trim()?.charAt(0).toUpperCase() || "U";
}
