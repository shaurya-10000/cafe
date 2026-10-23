import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPushSubscriptionState,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/utils/media/push";
import type { PushState, SupabaseClient } from "../types";
import { useIsMounted } from "./useIsMounted";

interface Options {
  readonly supabase: SupabaseClient;
  readonly userId: string;
  readonly isOpen: boolean;
}

export function usePushSubscription({ supabase, userId, isOpen }: Options) {
  const isMounted = useIsMounted();
  const busyRef = useRef(false);

  const [pushState, setPushState] = useState<PushState>("unsubscribed");
  const [isLoading, setIsLoading] = useState(false);

  // Refresh whenever the drawer opens: the permission can change in browser
  // settings while it is closed.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    getPushSubscriptionState()
      .then((state) => {
        if (!cancelled) setPushState(state);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn("[NotificationsSidebar] push state lookup failed", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const togglePush = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsLoading(true);

    try {
      if (pushState === "subscribed") {
        await unsubscribeFromPush(supabase);
        if (isMounted()) setPushState("unsubscribed");
      } else {
        const ok = await subscribeToPush(supabase, userId);
        const nextState: PushState = ok
          ? "subscribed"
          : await getPushSubscriptionState();
        if (isMounted()) setPushState(nextState);
      }
    } catch (error) {
      console.error("[NotificationsSidebar] failed to toggle push", error);
      try {
        const fallback = await getPushSubscriptionState();
        if (isMounted()) setPushState(fallback);
      } catch (fallbackError) {
        console.warn(
          "[NotificationsSidebar] push state recovery failed",
          fallbackError,
        );
      }
    } finally {
      busyRef.current = false;
      if (isMounted()) setIsLoading(false);
    }
  }, [pushState, userId, supabase, isMounted]);

  return { pushState, isLoading, togglePush };
}
