"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseRetryAfterCooldownOptions {
  /** Seconds left on the current rate-limit cooldown (0 when there is none). */
  readonly cooldownSeconds: number;
  /** A request is in flight; sending anything ends the offer. */
  readonly loading: boolean;
  /** Changes when the user switches chats; the offer doesn't carry over. */
  readonly resetKey: string | null;
  /** Closing the widget ends the offer. */
  readonly isOpen: boolean;
}

/**
 * Offers a "Retry now" once a rate-limit cooldown has finished. The offer
 * stays up until the user acts: sends something (loading starts), switches
 * chats, closes the widget, or retries.
 */
export function useRetryAfterCooldown({
  cooldownSeconds,
  loading,
  resetKey,
  isOpen,
}: UseRetryAfterCooldownOptions) {
  const [isOffered, setIsOffered] = useState(false);
  const wasCoolingRef = useRef(false);

  // A cooldown that has just ended is the moment to offer the retry.
  useEffect(() => {
    if (cooldownSeconds > 0) {
      wasCoolingRef.current = true;
      return;
    }
    if (wasCoolingRef.current) {
      wasCoolingRef.current = false;
      setIsOffered(true);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    if (loading) setIsOffered(false);
  }, [loading]);

  useEffect(() => {
    wasCoolingRef.current = false;
    setIsOffered(false);
  }, [resetKey, isOpen]);

  const dismiss = useCallback(() => setIsOffered(false), []);

  return { offerRetry: isOffered, dismissRetryOffer: dismiss };
}
