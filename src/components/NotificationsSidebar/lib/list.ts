import { MAX_NOTIFICATIONS, NOTIFICATION_DEDUPE_WINDOW_MS } from "../constants";
import type { NotificationRow } from "../types";

function timeOf(row: NotificationRow): number {
  return new Date(row.created_at).getTime();
}

/**
 * Secondary dedupe: a push and a realtime event can deliver the same
 * underlying row with timestamp skew. Same (title, message) inside a small
 * window counts as the same notification.
 */
function isNearDuplicate(
  list: readonly NotificationRow[],
  incoming: NotificationRow,
): boolean {
  const incomingTime = timeOf(incoming);
  if (Number.isNaN(incomingTime)) return false;

  return list.some((existing) => {
    if (existing.title !== incoming.title) return false;
    if (existing.message !== incoming.message) return false;
    const existingTime = timeOf(existing);
    if (Number.isNaN(existingTime)) return false;
    return (
      Math.abs(existingTime - incomingTime) < NOTIFICATION_DEDUPE_WINDOW_MS
    );
  });
}

/**
 * Prepends a realtime notification unless it is already present (same id,
 * e.g. after a rapid open/close/open or a focus refresh) or is a near
 * duplicate. Returns the same array reference when nothing changes.
 */
export function appendIncomingNotification(
  list: NotificationRow[],
  incoming: NotificationRow,
): NotificationRow[] {
  if (list.some((n) => n.id === incoming.id)) return list;
  if (isNearDuplicate(list, incoming)) return list;
  return [incoming, ...list].slice(0, MAX_NOTIFICATIONS);
}

/**
 * Puts a row back after a failed optimistic delete, restoring its position
 * relative to whatever is in the list now.
 */
export function restoreNotification(
  list: NotificationRow[],
  row: NotificationRow,
): NotificationRow[] {
  if (list.some((n) => n.id === row.id)) return list;
  return [...list, row]
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, MAX_NOTIFICATIONS);
}
