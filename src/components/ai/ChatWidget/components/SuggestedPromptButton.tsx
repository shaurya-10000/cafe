import { memo, useCallback } from "react";

import type { SuggestedPrompt } from "@/components/ai/types";
import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

interface SuggestedPromptButtonProps {
  readonly prompt: SuggestedPrompt;
  readonly disabled: boolean;
  readonly onSelect: (text: string) => void;
}

export const SuggestedPromptButton = memo(function SuggestedPromptButton({
  prompt,
  disabled,
  onSelect,
}: SuggestedPromptButtonProps) {
  const Icon = prompt.icon;

  const handleClick = useCallback(() => {
    onSelect(prompt.prompt);
  }, [prompt.prompt, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "group flex items-center gap-3 rounded-2xl",
        "border border-cafe-border bg-cafe-card p-3",
        "text-left shadow-sm transition",
        "hover:border-cafe-accent",
        "disabled:opacity-40",
        "motion-reduce:transition-none",
        FOCUS_RING,
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center",
          "rounded-xl bg-cafe-accent/10 text-cafe-accent",
          "transition group-hover:bg-cafe-accent group-hover:text-cafe-accent-fg",
          "motion-reduce:transition-none",
        )}
      >
        <Icon size={16} aria-hidden="true" />
      </span>

      <span className="text-xs font-bold uppercase tracking-wider text-cafe-fg group-hover:text-cafe-accent">
        {prompt.label}
      </span>
    </button>
  );
});