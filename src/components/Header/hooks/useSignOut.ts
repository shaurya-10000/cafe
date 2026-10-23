import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useClerk } from "@clerk/nextjs";

import { HOME_PATH, SIGN_OUT_ERROR_TIMEOUT_MS } from "../constants";
import { reportHeaderIssue } from "../lib/observability";
import { useTimedState } from "./useTimedState";

export interface UseSignOutResult {
  isSigningOut: boolean;
  signOutError: string | null;
  signOut: () => void;
}

export function useSignOut(onBeforeSignOut?: () => void): UseSignOutResult {
  const { signOut: clerkSignOut } = useClerk();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const [signOutError, setSignOutError] = useTimedState<string>(
    SIGN_OUT_ERROR_TIMEOUT_MS,
  );

  /**
   * State drives rendering; the ref is the authoritative concurrency guard so
   * two synchronous calls cannot start two sign-outs before React commits.
   */
  const signingOutRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const signOut = useCallback(() => {
    if (signingOutRef.current) return;

    signingOutRef.current = true;

    setIsSigningOut(true);
    setSignOutError(null);

    onBeforeSignOut?.();

    const performSignOut = async (): Promise<void> => {
      try {
        await clerkSignOut({ redirectUrl: HOME_PATH });
      } catch (error) {
        reportHeaderIssue("sign_out_failed", {
          name: error instanceof Error ? error.name : "unknown",
        });

        if (!isMountedRef.current) return;

        signingOutRef.current = false;
        setIsSigningOut(false);

        setSignOutError("Sign out failed. Please try again.");
      }
    };

    void performSignOut();
  }, [clerkSignOut, onBeforeSignOut, setSignOutError]);

  return useMemo(
    () => ({ isSigningOut, signOutError, signOut }),
    [isSigningOut, signOutError, signOut],
  );
}
