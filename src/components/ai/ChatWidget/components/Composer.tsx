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
  showRetry: boolean;
  reducedMotion: boolean;
  accentGradientClassName: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onRetry: () => void;
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
  showRetry,
  reducedMotion,
  accentGradientClassName,
  onChange,
  onKeyDown,
  onSend,
  onRetry,
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
        "z-30 shrink-0 border-t border-cafe-border",
        "bg-cafe-bg p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]",
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

      {slotHint && (
        <p
          role="status"
          aria-live="polite"
          className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-cafe-accent"
        >
          {slotHint}
        </p>
      )}

      {showRetry && !hasText && !hasPendingAction && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mb-2 flex items-center gap-1.5 rounded-full px-3 py-1.5",
            "text-[10px] font-black uppercase tracking-widest",
            "text-cafe-accent hover:bg-cafe-accent/10",
            FOCUS_RING,
          )}
        >
          <RotateCcw size={12} aria-hidden="true" />
          <span>Retry last message</span>
        </button>
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
          aria-label="Type a message"
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent px-4 py-3.5 text-xs text-cafe-fg",
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
            "mr-2 flex h-9 w-9 shrink-0 items-center justify-center",
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
              size={14}
              className={cn(!reducedMotion && "animate-spin")}
              aria-hidden="true"
            />
          ) : (
            <Send size={14} aria-hidden="true" />
          )}
        </button>
      </div>

      {hasPendingAction && (
        <button
          type="button"
          onClick={onCancelPending}
          className={cn(
            "mt-2 text-[10px] font-black uppercase tracking-widest",
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