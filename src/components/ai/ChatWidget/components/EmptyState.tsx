import { Sparkles } from "lucide-react";

import type { SuggestedPrompt } from "@/components/ai/types";
import { cn } from "@/lib/utils";

import { SuggestedPromptButton } from "./SuggestedPromptButton";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  prompts: readonly SuggestedPrompt[];
  accentGradientClassName: string;
  promptsDisabled: boolean;
  onSelectPrompt: (text: string) => void;
}

export function EmptyState({
  title,
  subtitle,
  prompts,
  accentGradientClassName,
  promptsDisabled,
  onSelectPrompt,
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      <span
        aria-hidden="true"
        className={cn(
          accentGradientClassName,
          "mb-4 flex h-12 w-12 items-center justify-center",
          "rounded-2xl text-white shadow-xl",
        )}
      >
        <Sparkles size={24} />
      </span>

      <h3
        className={cn(
          "mb-1 text-lg font-black italic uppercase",
          "tracking-tight text-cafe-fg",
        )}
      >
        {title}
      </h3>

      <p className="mb-6 max-w-xs text-xs font-medium text-cafe-fg/50">
        {subtitle}
      </p>

      <div className="grid w-full max-w-sm grid-cols-1 gap-2.5">
        {prompts.map((prompt) => (
          <SuggestedPromptButton
            key={prompt.label}
            prompt={prompt}
            disabled={promptsDisabled}
            onSelect={onSelectPrompt}
          />
        ))}
      </div>
    </div>
  );
}