import { memo, useCallback, type MouseEvent } from "react";

import { Bell } from "lucide-react";

import { cn } from "../lib/cn";
import { FOCUS_RING, ICON_BUTTON_BASE, MIN_TOUCH_TARGET } from "../styles";
import { CountBadge } from "./CountBadge";

interface NotificationsButtonProps {
  unreadCount: number;
  onOpen: (trigger: HTMLElement) => void;
}

export const NotificationsButton = memo(function NotificationsButton({
  unreadCount,
  onOpen,
}: NotificationsButtonProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onOpen(event.currentTarget);
    },
    [onOpen],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        unreadCount > 0
          ? `Open notifications, ${unreadCount} unread`
          : "Open notifications"
      }
      className={cn(ICON_BUTTON_BASE, MIN_TOUCH_TARGET, "p-3", FOCUS_RING)}
    >
      <Bell size={20} strokeWidth={2.5} aria-hidden="true" />

      <CountBadge count={unreadCount} />
    </button>
  );
});
