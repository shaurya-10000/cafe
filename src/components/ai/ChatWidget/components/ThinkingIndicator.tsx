import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThinkingIndicator({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 pl-10",
        "font-mono text-xs text-cafe-fg/50",
        !reducedMotion && "animate-pulse",
      )}
    >
      <Sparkles size={12} className="text-cafe-accent" aria-hidden="true" />
      <span>Thinking&hellip;</span>
    </div>
  );
}