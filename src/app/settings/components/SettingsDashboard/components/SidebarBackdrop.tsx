import { AnimatePresence, motion } from "framer-motion";
import { getBackdropMotion } from "../lib/motion";

interface SidebarBackdropProps {
  readonly isOpen: boolean;
  readonly reducedMotion: boolean;
  readonly onClose: () => void;
}

export function SidebarBackdrop({
  isOpen,
  reducedMotion,
  onClose,
}: SidebarBackdropProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          {...getBackdropMotion(reducedMotion)}
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        />
      )}
    </AnimatePresence>
  );
}
