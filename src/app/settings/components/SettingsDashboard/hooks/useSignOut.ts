import { useCallback, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useIsMounted } from "../../../hooks/useIsMounted";
import {
  SIGN_OUT_ERROR_MESSAGE,
  SIGN_OUT_REDIRECT_URL,
} from "../constants";

export function useSignOut() {
  const { signOut } = useClerk();
  const isMounted = useIsMounted();
  const inFlightRef = useRef(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsSigningOut(true);
    setError(null);

    try {
      await signOut({ redirectUrl: SIGN_OUT_REDIRECT_URL });
      // On success Clerk navigates away: stay "signing out" until it does.
    } catch (caught) {
      // Clerk's signOut rejects on network failure; without surfacing it the
      // button would silently do nothing.
      console.error("[SettingsDashboard] sign-out failed", caught);
      inFlightRef.current = false;
      if (isMounted()) {
        setIsSigningOut(false);
        setError(SIGN_OUT_ERROR_MESSAGE);
      }
    }
  }, [signOut, isMounted]);

  return { signOut: handleSignOut, isSigningOut, error };
}
