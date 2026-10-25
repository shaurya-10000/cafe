import type { ChangeEvent, KeyboardEvent } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";

import { MAX_MESSAGE_LENGTH } from "@/lib/ai/constants";
import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

interface ComposerProps {
  inputId: string;
  input: string;
  loading: boolean;
  canSend: boolean;
  cooldownSeconds: number;
  hasPendingAction: boolean;
  slotHint: string | null;
  /** True once a rate-limit cooldown has ended and the last prompt can be re-sent. */
  showRetryNow: boolean;
  reducedMotion: boolean;
  accentGradientClassName: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onRetryNow: () => void;
  onCancelPending: () => void;
}

export function Composer({
  inputId,
  input,
  loading,
  canSend,
  cooldownSeconds,
  hasPendingAction,
  slotHint,
  showRetryNow,
  reducedMotion,
  accentGradientClassName,
  onChange,
  onKeyDown,
  onSend,
  onRetryNow,
  onCancelPending,
}: ComposerProps) {
  const hasText = input.trim().length > 0;
  const sendEnabled = hasText && !loading && canSend;

  const placeholder =
    cooldownSeconds > 0
      ? "PLEASE WAIT\u2026"
      : hasPendingAction
        ? "TYPE YOUR ANSWER\u2026"
        : "TYPE A MESSAGE\u2026";

  return (
    <div
      className={cn(
        "z-30 shrink-0 border-t border-cafe-border bg-cafe-bg",
        "shadow-[0_-10px_40px_rgba(0,0,0,0.02)]",
        // Mobile: compact, and clear of the home indicator.
        "px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "sm:p-6",
      )}
    >
      {cooldownSeconds > 0 && (
        <p
          role="status"
          aria-live="polite"
          className="mb-2 text-center text-[10px] font-black uppercase tracking-widest text-red-500"
        >
          Rate limit reached &mdash; try again in {cooldownSeconds}s
        </p>
      )}

      {cooldownSeconds === 0 && showRetryNow && (
        <div className="mb-2 flex justify-center">
          <button
            type="button"
            onClick={onRetryNow}
            className={cn(
              "flex min-h-10 items-center gap-1.5 rounded-full px-4 py-1.5",
              "text-[10px] font-black uppercase tracking-widest",
              "bg-cafe-accent/10 text-cafe-accent transition-colors",
              "hover:bg-cafe-accent/20",
              FOCUS_RING,
            )}
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Retry now</span>
          </button>
        </div>
      )}

      {slotHint && (
        <p
          role="status"
          aria-live="polite"
          className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-cafe-accent"
        >
          {slotHint}
        </p>
      )}

      <div
        className={cn(
          "relative flex items-center rounded-2xl",
          "border border-cafe-border bg-cafe-card",
          "shadow-sm transition",
          "focus-within:border-cafe-accent",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Type a message
        </label>

        <input
          id={inputId}
          type="text"
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={!canSend || loading}
          maxLength={MAX_MESSAGE_LENGTH}
          autoComplete="off"
          enterKeyHint="send"
          aria-label="Type a message"
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-4 py-3.5 text-cafe-fg",
            // 16px on mobile prevents iOS Safari's focus-zoom.
            "text-base sm:text-xs",
            "placeholder:text-cafe-fg/30 focus:outline-none",
            "disabled:opacity-50",
          )}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!sendEnabled}
          aria-label="Send message"
          className={cn(
            "mr-2 flex h-11 w-11 shrink-0 items-center justify-center sm:h-9 sm:w-9",
            "rounded-xl transition",
            sendEnabled
              ? cn(
                  accentGradientClassName,
                  "text-white shadow-md hover:scale-105",
                )
              : "bg-cafe-fg/5 text-cafe-fg/30",
            "disabled:cursor-not-allowed",
            "motion-reduce:transition-none motion-reduce:hover:scale-100",
            FOCUS_RING,
          )}
        >
          {loading ? (
            <Loader2
              size={16}
              className={cn(!reducedMotion && "animate-spin")}
              aria-hidden="true"
            />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {hasPendingAction && (
        <button
          type="button"
          onClick={onCancelPending}
          className={cn(
            "mt-2 min-h-10 text-[10px] font-black uppercase tracking-widest",
            "text-cafe-fg/40 hover:text-cafe-fg/70",
            FOCUS_RING,
          )}
        >
          Cancel pending request
        </button>
      )}
    </div>
  );
}
