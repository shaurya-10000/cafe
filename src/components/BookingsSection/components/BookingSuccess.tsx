import { useEffect, useRef } from "react";

import { motion } from "framer-motion";

import { CheckCircle2 } from "lucide-react";

import { COPY } from "../constants";
import { successVariants } from "../motion";
import type { ConfirmedSnapshot } from "../types";

interface BookingSuccessProps {
  motionEnabled: boolean;
  snapshot: ConfirmedSnapshot | null;
  onModify: () => void;
}

export function BookingSuccess({
  motionEnabled,
  snapshot,
  onModify,
}: BookingSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation as soon as it is on screen.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      headingRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      variants={motionEnabled ? successVariants : undefined}
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "visible" : undefined}
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center space-y-8 py-10 text-center"
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full bg-cafe-accent/10 text-cafe-accent"
        aria-hidden="true"
      >
        <CheckCircle2 size={56} />
      </div>

      <div className="space-y-2">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 focus:outline-none dark:text-zinc-100"
        >
          {COPY.successTitle}
        </h3>

        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {snapshot?.locationName} &bull; {snapshot?.date} at {snapshot?.time}
        </p>

        <p className="text-[10px] uppercase tracking-wider text-zinc-400">
          We&apos;ll send a confirmation to {snapshot?.email}
        </p>
      </div>

      <button
        type="button"
        onClick={onModify}
        className="rounded-full border border-[#EAE9E4] px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:border-zinc-800 dark:hover:bg-zinc-100 dark:hover:text-black"
      >
        {COPY.successRetry}
      </button>
    </motion.div>
  );
}
