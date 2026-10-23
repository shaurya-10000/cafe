import { forwardRef } from "react";
import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCardMotion } from "../lib/motion";
import { CLICKABLE_TYPES, getTypeIcon } from "../notificationTypes";
import type { NotificationRow } from "../types";

interface NotificationCardProps {
  readonly notification: NotificationRow;
  readonly reducedMotion: boolean;
  readonly onOpen: (notification: NotificationRow) => void;
  readonly onDelete: (id: string) => void;
  readonly onRate: (orderId: string) => void;
}

/**
 * forwardRef is required: the parent list uses AnimatePresence
 * mode="popLayout", which measures each direct child's DOM node.
 */
export const NotificationCard = forwardRef<
  HTMLDivElement,
  NotificationCardProps
>(function NotificationCard(
  { notification, reducedMotion, onOpen, onDelete, onRate },
  ref,
) {
  const isClickable = CLICKABLE_TYPES.has(notification.type);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    // Only react when the card itself has focus; otherwise a nested
    // button's Enter/Space would bubble up and re-trigger this handler.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onOpen(notification);
  };

  return (
    <motion.div
      ref={ref}
      layout
      {...getCardMotion(reducedMotion)}
      onClick={isClickable ? () => onOpen(notification) : undefined}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-zinc-100 bg-zinc-50/50 p-6 transition-all hover:border-cafe-accent/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
        "dark:border-white/5 dark:bg-white/5",
        isClickable && "cursor-pointer",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-zinc-100 p-2 text-zinc-400 transition-colors group-hover:text-cafe-accent dark:bg-white/5">
            {getTypeIcon(notification.type)}
          </div>
          <span className="text-[11px] font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
            {notification.title}
          </span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(notification.id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Delete notification: ${notification.title}`}
          title="Delete Notification"
          className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      <p className="pr-6 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {notification.message}
      </p>

      {notification.type === "review_prompt" && notification.order_id && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (notification.order_id) onRate(notification.order_id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-[10px] font-black uppercase text-white transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:bg-white dark:text-black"
        >
          <Star size={12} fill="currentColor" aria-hidden="true" />
          Rate Experience
        </button>
      )}
    </motion.div>
  );
});
