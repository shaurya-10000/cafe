import { useCallback, useRef, useState } from "react";

import { useClerk } from "@clerk/nextjs";

import { HOME_PATH } from "../constants";
import { useIsMounted } from "./useIsMounted";

export interface UseAdminSignOutResult {
  isSigningOut: boolean;
  signOut: () => Promise<void>;
}

export function useAdminSignOut(): UseAdminSignOutResult {
  const { signOut: clerkSignOut } = useClerk();
  const isMounted = useIsMounted();

  /** Authoritative guard; state below only drives rendering. */
  const inFlightRef = useRef(false);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsSigningOut(true);

    try {
      await clerkSignOut({ redirectUrl: HOME_PATH });
    } catch (error) {
      console.error("[admin] sign-out failed", error);

      inFlightRef.current = false;

      if (isMounted()) setIsSigningOut(false);
    }
  }, [clerkSignOut, isMounted]);

  return { isSigningOut, signOut };
}
