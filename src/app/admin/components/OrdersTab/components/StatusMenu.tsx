import { memo, useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { Check, MoreVertical } from "lucide-react";

import { DECLINED_STATUS, SELECTABLE_STATUSES } from "../constants";
import { cx } from "../lib/cx";

interface StatusMenuProps {
  orderId: string;
  currentStatus: string;
  isOpen: boolean;
  reducedMotion: boolean;
  onToggle: (orderId: string) => void;
  onClose: () => void;
  onSelect: (orderId: string, status: string) => void;
}

export const StatusMenu = memo(function StatusMenu({
  orderId,
  currentStatus,
  isOpen,
  reducedMotion,
  onToggle,
  onClose,
  onSelect,
}: StatusMenuProps) {
  const menuId = `order-status-menu-${orderId}`;

  // Escape closes the open menu.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(orderId)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="flex items-center gap-3 rounded-2xl bg-cafe-fg px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-cafe-bg shadow-2xl transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Status <MoreVertical size={16} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <>
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[110]"
              onClick={onClose}
            />

            <motion.div
              id={menuId}
              role="menu"
              aria-label="Update order status"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, scale: 0.95 }
              }
              transition={{ duration: reducedMotion ? 0 : 0.15 }}
              className="absolute right-0 top-full z-[120] mt-4 flex w-56 flex-col gap-1 overflow-hidden rounded-[2rem] border border-cafe-border bg-cafe-card p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-3xl dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)]"
            >
              {SELECTABLE_STATUSES.map((status) => {
                const isCurrent = currentStatus === status;
                const isDestructive = status === DECLINED_STATUS;

                return (
                  <button
                    key={status}
                    type="button"
                    role="menuitem"
                    onClick={() => onSelect(orderId, status)}
                    className={cx(
                      "flex items-center justify-between rounded-2xl px-5 py-3 text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2",
                      isCurrent
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 focus-visible:ring-blue-500"
                        : isDestructive
                          ? "text-red-500 hover:bg-red-500/10 focus-visible:ring-red-500"
                          : "text-gray-500 hover:bg-cafe-fg/5 hover:text-cafe-fg focus-visible:ring-blue-500",
                    )}
                  >
                    <span>{isDestructive ? "Decline Order" : status}</span>

                    {isCurrent && <Check size={14} aria-hidden="true" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
