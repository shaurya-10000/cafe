import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, UserCheck, X } from "lucide-react";
import { useLatestRef } from "../hooks/useLatestRef";
import { getScaleFadeMotion } from "../lib/motion";

interface GuestSignUpModalProps {
  readonly titleId: string;
  readonly reducedMotion: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function GuestSignUpModal({
  titleId,
  reducedMotion,
  onClose,
  onConfirm,
}: GuestSignUpModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useLatestRef(onClose);

  // Move focus into the dialog, close on Escape, and hand focus back to
  // whatever opened it.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [onCloseRef]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 outline-none backdrop-blur-sm"
    >
      <motion.div
        {...getScaleFadeMotion(reducedMotion)}
        className="relative w-full max-w-md space-y-6 rounded-[35px] border border-[#EAE9E4] bg-[#FAF9F6] p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-zinc-400 transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:hover:text-zinc-100"
          aria-label="Close"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cafe-accent/10 text-cafe-accent">
          <UserCheck size={28} aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cafe-accent">
            Authentication Required
          </span>
          <h3
            id={titleId}
            className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Unlock Your Coupon
          </h3>
          <p className="text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
            Join our Coffee Ritual membership or log in to claim your welcome
            coupon and save it directly to your profile.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <motion.button
            whileHover={reducedMotion ? undefined : { scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            type="button"
            onClick={onConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-zinc-900 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-black"
          >
            Sign Up / Log In <ArrowRight size={16} aria-hidden="true" />
          </motion.button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:hover:text-zinc-300"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </div>
  );
}
