import { memo } from "react";

import { motion } from "framer-motion";

import { ArrowRight, Loader2, LogIn } from "lucide-react";

import { COPY } from "../constants";

interface SubmitButtonProps {
  isSubmitting: boolean;
  disabled: boolean;
  isAuthBlocked: boolean;
  motionEnabled: boolean;
}

export const SubmitButton = memo(function SubmitButton({
  isSubmitting,
  disabled,
  isAuthBlocked,
  motionEnabled,
}: SubmitButtonProps) {
  const interactive = motionEnabled && !disabled;

  const label = isSubmitting
    ? COPY.submitBusy
    : isAuthBlocked
      ? COPY.submitAuth
      : COPY.submitIdle;

  return (
    <motion.button
      whileHover={interactive ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      type="submit"
      disabled={disabled}
      aria-disabled={disabled}
      className="mt-6 flex w-full items-center justify-between rounded-[30px] bg-zinc-900 p-8 text-[10px] font-black uppercase tracking-[0.4em] text-white shadow-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
    >
      <span className="flex items-center gap-2">
        {isSubmitting && (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        )}

        {label}
      </span>

      {isAuthBlocked ? (
        <LogIn size={18} aria-hidden="true" />
      ) : (
        <ArrowRight size={18} aria-hidden="true" />
      )}
    </motion.button>
  );
});
