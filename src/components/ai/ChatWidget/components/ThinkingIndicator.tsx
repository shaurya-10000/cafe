import { cn } from "@/lib/utils";

import { BotAvatar } from "./BotAvatar";

export function ThinkingIndicator({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 sm:gap-3",
        !reducedMotion && "animate-pulse",
      )}
    >
      <BotAvatar />
      <span className="font-mono text-xs text-cafe-fg/50">Thinking&hellip;</span>
    </div>
  );
}
