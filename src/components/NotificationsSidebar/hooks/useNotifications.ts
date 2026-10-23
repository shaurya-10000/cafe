import { useCallback, useEffect, useState } from "react";
import {
  deleteNotificationById,
  fetchNotifications,
} from "../api/notificationsApi";
import { DELETE_ERROR_MESSAGE } from "../constants";
import { appendIncomingNotification, restoreNotification } from "../lib/list";
import type {
  LatestNotification,
  NotificationRow,
  SupabaseClient,
} from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface Options {
  readonly supabase: SupabaseClient;
  readonly userId: string;
  /** Most recent realtime notification from AppContext. */
  readonly latestNotification: LatestNotification;
  /** Called when an unread notification is deleted. */
  readonly onUnreadRemoved: () => void;
}

export function useNotifications({
  supabase,
  userId,
  latestNotification,
  onUnreadRemoved,
}: Options) {
  const isMounted = useIsMounted();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  // Which user the notifications were last fetched for; "loading" is derived.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [seenLatestId, setSeenLatestId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const notificationsRef = useLatestRef(notifications);

  /* ---- Initial fetch ---------------------------------------------------- */

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    fetchNotifications(supabase, userId)
      .then((rows) => {
        if (!cancelled) setNotifications(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error("[NotificationsSidebar] fetch failed", error);
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  const isLoading = loadedFor !== userId;

  /* ---- Realtime append -------------------------------------------------- */
  // Adjusting state while rendering (guarded by the id we have already seen)
  // is the supported way to react to a changed prop without an effect.

  if (
    latestNotification &&
    latestNotification.user_id === userId &&
    latestNotification.id !== seenLatestId
  ) {
    const incoming = latestNotification as NotificationRow;
    setSeenLatestId(incoming.id);
    setNotifications((prev) => appendIncomingNotification(prev, incoming));
  }

  /* ---- Delete (optimistic with per-row rollback) ------------------------ */

  const deleteNotification = useCallback(
    async (id: string) => {
      setDeleteError(null);

      // Resolve the row from current state, not a snapshot of the whole
      // array: with two rapid deletes, rolling back the second from a stale
      // snapshot would resurrect the first deleted row.
      const target = notificationsRef.current.find((n) => n.id === id);
      if (!target) return;

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      try {
        await deleteNotificationById(supabase, id);
      } catch (error) {
        console.error("[NotificationsSidebar] delete failed", error);
        if (!isMounted()) return;
        setNotifications((prev) => restoreNotification(prev, target));
        setDeleteError(DELETE_ERROR_MESSAGE);
        return;
      }

      if (!isMounted()) return;
      if (!target.is_read) onUnreadRemoved();
    },
    [supabase, onUnreadRemoved, isMounted, notificationsRef],
  );

  const dismissDeleteError = useCallback(() => setDeleteError(null), []);

  return {
    notifications,
    isLoading,
    deleteError,
    deleteNotification,
    dismissDeleteError,
  };
}