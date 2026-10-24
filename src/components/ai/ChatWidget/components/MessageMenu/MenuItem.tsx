import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

import type { MessageMenuAction } from "./types";

interface MenuItemProps {
  readonly action: MessageMenuAction;
  readonly onSelect: (action: MessageMenuAction) => void;
}

export function MenuItem({ action, onSelect }: MenuItemProps) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={() => onSelect(action)}
      className={cn(
        "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left",
        "text-[11px] font-black uppercase tracking-widest text-cafe-fg/70",
        "transition-colors hover:bg-cafe-fg/5 hover:text-cafe-fg",
        "focus-visible:bg-cafe-fg/5 focus-visible:text-cafe-fg",
        FOCUS_RING,
      )}
    >
      <Icon size={14} aria-hidden="true" />
      <span>{action.label}</span>
    </button>
  );
}
