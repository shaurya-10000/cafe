import type { ReactNode, RefObject } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cx } from "../lib/cx";
import { getBackdropMotion, getDialogMotion } from "../lib/motion";
import { FOCUS_RING } from "../styles";

interface ModalFrameProps {
  readonly titleId: string;
  readonly dialogRef: RefObject<HTMLDivElement | null>;
  readonly reducedMotion: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** Backdrop + dialog shell. Focus and scroll behaviour live in the parent. */
export function ModalFrame({
  titleId,
  dialogRef,
  reducedMotion,
  onClose,
  children,
}: ModalFrameProps) {
  return (
    <motion.div
      {...getBackdropMotion(reducedMotion)}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        {...getDialogMotion(reducedMotion)}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-[2.5rem] border border-[#EAE9E4] bg-[#FAF9F6] shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cx(
            "absolute right-5 top-5 z-20 rounded-full bg-white/90 p-2.5 text-zinc-700 shadow-lg backdrop-blur-md transition-transform hover:scale-105 dark:bg-black/60 dark:text-zinc-200",
            FOCUS_RING,
          )}
        >
          <X size={18} aria-hidden="true" />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}
