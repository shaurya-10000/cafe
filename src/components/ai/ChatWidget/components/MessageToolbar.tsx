import { Check, Copy, Volume2 } from "lucide-react";

import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

interface MessageToolbarProps {
  isCopied: boolean;
  isSpeaking: boolean;
  onCopy: () => void;
  onSpeak: () => void;
}

export function MessageToolbar({
  isCopied,
  isSpeaking,
  onCopy,
  onSpeak,
}: MessageToolbarProps) {
  return (
    <div className="mt-1 flex items-center gap-1 text-cafe-fg/40 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={onCopy}
        aria-label={isCopied ? "Copied" : "Copy response"}
        className={cn(
          "rounded p-1 hover:bg-cafe-fg/5 hover:text-cafe-fg",
          FOCUS_RING,
        )}
      >
        {isCopied ? (
          <Check size={12} className="text-emerald-500" aria-hidden="true" />
        ) : (
          <Copy size={12} aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={onSpeak}
        aria-label={isSpeaking ? "Stop speaking" : "Listen to response"}
        aria-pressed={isSpeaking}
        className={cn(
          "rounded p-1 hover:bg-cafe-fg/5 hover:text-cafe-fg",
          FOCUS_RING,
        )}
      >
        <Volume2
          size={12}
          aria-hidden="true"
          className={cn(isSpeaking && "animate-pulse text-cafe-accent")}
        />
      </button>
    </div>
  );
}