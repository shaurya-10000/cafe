"use client";

import { useCallback, useState } from "react";

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

interface Snapshot {
  readonly cooldownSeconds: number;
  readonly loading: boolean;
  readonly resetKey: string | null;
  readonly isOpen: boolean;
  readonly isOffered: boolean;
}

/**
 * Offers a "Retry now" once a rate-limit cooldown has finished. The offer
 * stays up until the user acts: sends something (loading starts), switches
 * chats, closes the widget, or retries.
 *
 * The state follows its inputs, so it is adjusted during render by comparing
 * with the previous values (React's documented pattern for this) rather than
 * in effects, which would add a render pass for every change.
 */
export function useRetryAfterCooldown({
  cooldownSeconds,
  loading,
  resetKey,
  isOpen,
}: UseRetryAfterCooldownOptions) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    cooldownSeconds,
    loading,
    resetKey,
    isOpen,
    isOffered: false,
  });

  const changed =
    snapshot.cooldownSeconds !== cooldownSeconds ||
    snapshot.loading !== loading ||
    snapshot.resetKey !== resetKey ||
    snapshot.isOpen !== isOpen;

  if (changed) {
    const cooldownEnded = snapshot.cooldownSeconds > 0 && cooldownSeconds === 0;
    const userSent = loading && !snapshot.loading;
    const contextChanged =
      snapshot.resetKey !== resetKey || snapshot.isOpen !== isOpen;

    let isOffered = snapshot.isOffered;
    if (cooldownEnded) isOffered = true;
    if (cooldownSeconds > 0 || userSent || contextChanged) isOffered = false;

    setSnapshot({ cooldownSeconds, loading, resetKey, isOpen, isOffered });
  }

  const dismiss = useCallback(() => {
    setSnapshot((previous) =>
      previous.isOffered ? { ...previous, isOffered: false } : previous,
    );
  }, []);

  return { offerRetry: snapshot.isOffered, dismissRetryOffer: dismiss };
}
