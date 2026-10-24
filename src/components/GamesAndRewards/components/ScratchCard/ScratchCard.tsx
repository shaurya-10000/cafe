"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { CLAIM_START_GRACE_MS } from "./constants";
import { useScratchCanvas } from "./hooks/useScratchCanvas";
import type { ScratchMode } from "./types";

interface ScratchCardProps {
  readonly mode: ScratchMode;
  /** True while the claim request triggered by `onReveal` is in flight. */
  readonly isClaiming: boolean;
  readonly onReveal: () => void;
  readonly onLockedPress: () => void;
  /** Accessible alternative for people who can't (or don't want to) scratch. */
  readonly fallbackLabel: string;
  /** The prize face that sits underneath the foil. */
  readonly children: ReactNode;
}

const CURSOR_BY_MODE: Record<ScratchMode, string> = {
  ready: "cursor-crosshair",
  locked: "cursor-pointer",
  disabled: "cursor-not-allowed opacity-70",
};

export const ScratchCard = memo(function ScratchCard({
  mode,
  isClaiming,
  onReveal,
  onLockedPress,
  fallbackLabel,
  children,
}: ScratchCardProps) {
  const { canvasRef, revealed, reveal, reset, handlers } = useScratchCanvas({
    mode,
    onReveal,
    onLockedPress,
  });

  /*
   * If the claim fails (or never starts) the card is still mounted once the
   * request settles, so put the foil back and let the user try again. On
   * success the parent swaps this view out, so this never fires.
   */
  const sawClaiming = useRef(false);
  useEffect(() => {
    if (!revealed) {
      sawClaiming.current = false;
      return;
    }
    if (isClaiming) {
      sawClaiming.current = true;
      return;
    }
    if (sawClaiming.current) {
      sawClaiming.current = false;
      reset();
      return;
    }
    const timer = window.setTimeout(reset, CLAIM_START_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [revealed, isClaiming, reset]);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-64 w-full max-w-xl sm:h-80 select-none overflow-hidden rounded-3xl border border-cafe-accent/30 bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
          {children}
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          {...handlers}
          className={cn(
            "absolute inset-0 h-full w-full touch-none",
            "transition-opacity duration-500 motion-reduce:transition-none",
            revealed ? "pointer-events-none opacity-0" : CURSOR_BY_MODE[mode],
          )}
        />
      </div>

      <button
        type="button"
        onClick={reveal}
        disabled={mode === "disabled" || revealed}
        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 underline underline-offset-4 transition-colors hover:text-cafe-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:hover:text-zinc-500 dark:text-zinc-400"
      >
        {fallbackLabel}
      </button>
    </div>
  );
});