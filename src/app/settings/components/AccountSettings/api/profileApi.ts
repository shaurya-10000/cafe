import { parseProfileRow } from "../lib/parsers";
import type { Profile, ProfileUpdateResult, SupabaseClient } from "../types";

/**
 * Clerk is the identity source of truth (name, email, avatar). The `profiles`
 * row is a copy maintained by the Clerk webhook (public.process_clerk_webhook,
 * service_role only: `revoke insert, delete on public.profiles from anon,
 * authenticated`). Two consequences for this module:
 *
 *  1. Avatars: no storage bucket a customer can write to exists (the only one,
 *     "catalog-media", is admin-only), so "change photo" hands off to Clerk's
 *     account UI rather than faking an upload here.
 *  2. Rows are only ever INSERTed by the webhook, so a brand-new user's row may
 *     not exist yet. `.update()` on a missing row succeeds with ZERO rows and
 *     no error, so that case is detected and reported explicitly.
 */

/** Throws the raw Supabase error on failure. */
export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return parseProfileRow(data);
}

/** Throws the raw Supabase error on failure. */
export async function updateProfileName(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
): Promise<ProfileUpdateResult> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId)
    .select("full_name")
    .maybeSingle();

  if (error) throw error;
  if (!data) return { status: "missing" };

  const saved = (data as { full_name?: unknown }).full_name;
  return {
    status: "updated",
    fullName: typeof saved === "string" ? saved : fullName,
  };
}
