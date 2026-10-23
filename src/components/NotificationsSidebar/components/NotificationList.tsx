import { AnimatePresence } from "framer-motion";
import type { NotificationRow } from "../types";
import { NotificationsEmpty, NotificationsLoading } from "./ListStates";
import { NotificationCard } from "./NotificationCard";

interface NotificationListProps {
  readonly notifications: readonly NotificationRow[];
  readonly isLoading: boolean;
  readonly reducedMotion: boolean;
  readonly onOpen: (notification: NotificationRow) => void;
  readonly onDelete: (id: string) => void;
  readonly onRate: (orderId: string) => void;
}

export function NotificationList({
  notifications,
  isLoading,
  reducedMotion,
  onOpen,
  onDelete,
  onRate,
}: NotificationListProps) {
  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
      {isLoading ? (
        <NotificationsLoading />
      ) : notifications.length === 0 ? (
        <NotificationsEmpty />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                reducedMotion={reducedMotion}
                onOpen={onOpen}
                onDelete={onDelete}
                onRate={onRate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
