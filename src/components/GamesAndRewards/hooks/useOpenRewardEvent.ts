import { useEffect } from "react";
import { OPEN_REWARD_EVENT, REWARD_SECTION_ID } from "../constants";

interface Options {
  readonly isLoggedIn: boolean;
  readonly reducedMotion: boolean;
  /** Called when a guest is sent here and needs to sign in first. */
  readonly onRequireAuth: () => void;
}

/** AI concierge: scroll the rewards into view, prompt guests to sign in. */
export function useOpenRewardEvent({
  isLoggedIn,
  reducedMotion,
  onRequireAuth,
}: Options): void {
  useEffect(() => {
    const handler = () => {
      document.getElementById(REWARD_SECTION_ID)?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
      });
      if (!isLoggedIn) onRequireAuth();
    };

    window.addEventListener(OPEN_REWARD_EVENT, handler);
    return () => window.removeEventListener(OPEN_REWARD_EVENT, handler);
  }, [isLoggedIn, reducedMotion, onRequireAuth]);
}
