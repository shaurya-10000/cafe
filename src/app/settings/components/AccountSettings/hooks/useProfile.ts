import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import { fetchProfile } from "../api/profileApi";
import type { Profile } from "../types";

interface ProfileResult {
  /** The user this result belongs to; a result for another user is ignored. */
  userId: string;
  profile: Profile | null;
}

const EMPTY_PROFILE: Profile = {
  full_name: null,
  avatar_url: null,
  email: null,
};

/**
 * Loads the Supabase profile mirror. Keyed on the user id (not the Clerk user
 * object, whose identity changes on refresh) so a background refresh never
 * triggers a refetch.
 *
 * `loading` is derived (no user -> not loading; a result for a different user
 * -> loading), so no state is set synchronously inside the effect.
 */
export function useProfile(userId: string | null) {
  const supabase = useSupabaseClient();
  const [result, setResult] = useState<ProfileResult | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    fetchProfile(supabase, userId)
      .then((profile) => {
        if (!cancelled) setResult({ userId, profile });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[AccountSettings] profile load failed", { userId }, error);
        setResult({ userId, profile: null });
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const current = userId !== null && result?.userId === userId ? result : null;

  const patchProfile = useCallback(
    (patch: Partial<Profile>) => {
      setResult((previous) =>
        previous && previous.userId === userId
          ? {
              ...previous,
              profile: { ...(previous.profile ?? EMPTY_PROFILE), ...patch },
            }
          : previous,
      );
    },
    [userId],
  );

  return {
    profile: current?.profile ?? null,
    loading: userId !== null && current === null,
    patchProfile,
  };
}