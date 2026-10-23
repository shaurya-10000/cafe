import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { HISTORY_SIDEBAR_ID, HISTORY_SIDEBAR_WIDTH_PX } from "../constants";

interface HistoryPanelProps {
  isOpen: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}

/** Animated slide-in container for the chat history sidebar. */
export function HistoryPanel({
  isOpen,
  reducedMotion,
  children,
}: HistoryPanelProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id={HISTORY_SIDEBAR_ID}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: HISTORY_SIDEBAR_WIDTH_PX, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="h-full shrink-0 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}