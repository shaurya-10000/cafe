import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { updateProfileName } from "../api/profileApi";
import { MESSAGES } from "../constants";
import { isValidName, normalizeName, splitFullName } from "../lib/name";
import type { Banner, ClerkUser, Profile } from "../types";

interface Options {
  readonly user: ClerkUser | null;
  readonly profile: Profile | null;
  readonly profileLoading: boolean;
  readonly patchProfile: (patch: Partial<Profile>) => void;
}

export function useProfileForm({
  user,
  profile,
  profileLoading,
  patchProfile,
}: Options) {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();
  const savingRef = useRef(false);
  const seededForRef = useRef<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);

  const userId = user?.id ?? null;
  const clerkName = user?.fullName ?? "";
  const mirrorName = profile?.full_name ?? "";

  // Seed the input once per user. Clerk is the live source of truth for the
  // name; the Supabase copy is only a fallback for the moment before it syncs.
  // Seeding once (not on every Clerk refresh) means unsaved edits survive.
  useEffect(() => {
    if (!userId || profileLoading || seededForRef.current === userId) return;
    seededForRef.current = userId;
    setFullName(clerkName || mirrorName);
  }, [userId, profileLoading, clerkName, mirrorName]);

  const normalizedName = normalizeName(fullName);
  const originalName = normalizeName(clerkName || mirrorName);
  const isNameValid = isValidName(normalizedName);
  const isDirty = normalizedName !== originalName;
  const showBlankError = fullName.length > 0 && normalizedName.length === 0;

  const save = useCallback(async () => {
    if (!user || !isNameValid || savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setBanner(null);

    try {
      // 1. Clerk first: it is the source of truth. If it fails we stop, so the
      //    Supabase mirror never drifts ahead of the real identity.
      try {
        await user.update(splitFullName(normalizedName));
      } catch (error) {
        console.error(
          "[AccountSettings] Clerk profile update failed",
          { userId: user.id },
          error,
        );
        if (isMounted()) {
          setBanner({ type: "error", message: MESSAGES.clerkFailed });
        }
        return;
      }

      // 2. Mirror the change for the rest of the app.
      try {
        const result = await updateProfileName(supabase, user.id, normalizedName);
        if (!isMounted()) return;

        setFullName(normalizedName);

        if (result.status === "missing") {
          // Not a real failure: the name is already changed in Clerk and the
          // webhook-created row will pick it up shortly.
          setBanner({ type: "success", message: MESSAGES.savedPending });
          return;
        }

        patchProfile({ full_name: result.fullName });
        setBanner({ type: "success", message: MESSAGES.saved });
      } catch (error) {
        console.error(
          "[AccountSettings] profile save failed",
          { userId: user.id, code: (error as { code?: string } | null)?.code },
          error,
        );
        if (isMounted()) {
          setBanner({ type: "error", message: MESSAGES.mirrorFailed });
        }
      }
    } finally {
      savingRef.current = false;
      if (isMounted()) setSaving(false);
    }
  }, [user, isNameValid, normalizedName, supabase, patchProfile, isMounted]);

  const dismissBanner = useCallback(() => setBanner(null), []);

  return {
    fullName,
    setFullName,
    normalizedName,
    isNameValid,
    isDirty,
    showBlankError,
    saving,
    banner,
    dismissBanner,
    save,
  };
}
