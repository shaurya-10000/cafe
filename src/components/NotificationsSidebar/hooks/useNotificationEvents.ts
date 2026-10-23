import { useEffect } from "react";
import {
  DISABLE_PUSH,
  ENABLE_PUSH,
  MUTE_ALL_NOTIFICATIONS,
  MUTE_NOTIFICATION_TYPE,
  UNMUTE_ALL_NOTIFICATIONS,
  UNMUTE_NOTIFICATION_TYPE,
  listenCafeEvent,
} from "@/lib/core/events";
import type { PushState } from "../types";
import { useLatestRef } from "./useLatestRef";

interface Options {
  readonly notificationsMuted: boolean;
  readonly mutedTypes: readonly string[];
  readonly pushState: PushState;
  readonly toggleNotificationsMuted: () => unknown;
  readonly toggleTypeMuted: (type: string) => unknown;
  readonly togglePush: () => unknown;
}

type TypeEvent = { type?: unknown };

/**
 * ChatWidget dispatches these when the assistant proposes a notification-
 * related action. Each handler is idempotent: muting when already muted,
 * unmuting when already unmuted, etc. are no-ops.
 *
 * OPEN_NOTIFICATIONS is deliberately not handled here. The sidebar's open
 * state is owned by the parent (header.tsx, or the dashboard's "route home
 * then let the header open it" handshake); this component only reflects that
 * state. A listener here would create a second, competing owner of it.
 */
export function useNotificationEvents({
  notificationsMuted,
  mutedTypes,
  pushState,
  toggleNotificationsMuted,
  toggleTypeMuted,
  togglePush,
}: Options): void {
  // Current values live in refs so the listeners below don't re-attach on
  // every state change.
  const mutedRef = useLatestRef(notificationsMuted);
  const mutedTypesRef = useLatestRef(mutedTypes);
  const pushStateRef = useLatestRef(pushState);

  useEffect(() => {
    const removers = [
      listenCafeEvent(MUTE_ALL_NOTIFICATIONS, () => {
        if (!mutedRef.current) void toggleNotificationsMuted();
      }),

      listenCafeEvent(UNMUTE_ALL_NOTIFICATIONS, () => {
        if (mutedRef.current) void toggleNotificationsMuted();
      }),

      listenCafeEvent<TypeEvent>(MUTE_NOTIFICATION_TYPE, (event) => {
        const type = event.detail?.type;
        if (typeof type !== "string") return;
        if (!mutedTypesRef.current.includes(type)) void toggleTypeMuted(type);
      }),

      listenCafeEvent<TypeEvent>(UNMUTE_NOTIFICATION_TYPE, (event) => {
        const type = event.detail?.type;
        if (typeof type !== "string") return;
        if (mutedTypesRef.current.includes(type)) void toggleTypeMuted(type);
      }),

      listenCafeEvent(ENABLE_PUSH, () => {
        if (pushStateRef.current !== "subscribed") void togglePush();
      }),

      listenCafeEvent(DISABLE_PUSH, () => {
        if (pushStateRef.current === "subscribed") void togglePush();
      }),
    ];

    return () => {
      for (const remove of removers) remove();
    };
  }, [
    toggleNotificationsMuted,
    toggleTypeMuted,
    togglePush,
    mutedRef,
    mutedTypesRef,
    pushStateRef,
  ]);
}
