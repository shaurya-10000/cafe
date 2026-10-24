import { Plus, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";

import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

import { HISTORY_SIDEBAR_ID } from "../constants";

interface WidgetHeaderProps {
  title: string;
  headingId: string;
  accentGradientClassName: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onClose: () => void;
}

/** Shared 40px square hit area for icon-only header buttons. */
const ICON_BUTTON = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
  "transition-colors",
);

export function WidgetHeader({
  title,
  headingId,
  accentGradientClassName,
  isSidebarOpen,
  onToggleSidebar,
  onNewChat,
  onClose,
}: WidgetHeaderProps) {
  return (
    <header
      className={cn(
        "z-10 flex shrink-0 items-center justify-between gap-2",
        "border-b border-cafe-border bg-cafe-bg",
        // Mobile: compact, and clear of notches / status bars.
        "px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
        "sm:p-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close chat history" : "Open chat history"}
          aria-expanded={isSidebarOpen}
          aria-controls={HISTORY_SIDEBAR_ID}
          className={cn(
            ICON_BUTTON,
            "text-cafe-fg/60 hover:bg-cafe-fg/5 hover:text-cafe-fg",
            FOCUS_RING,
          )}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} aria-hidden="true" />
          ) : (
            <PanelLeftOpen size={20} aria-hidden="true" />
          )}
        </button>

        <span
          aria-hidden="true"
          className={cn(
            accentGradientClassName,
            "hidden shrink-0 rounded-xl p-2 text-white shadow-xl sm:inline-flex",
          )}
        >
          <Sparkles size={20} />
        </span>

        <h2
          id={headingId}
          className={cn(
            "min-w-0 flex-1 truncate text-base font-black italic uppercase",
            "tracking-tighter text-cafe-fg sm:text-xl",
          )}
        >
          {title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          className={cn(
            "flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full",
            "px-2.5 sm:px-3",
            "text-[10px] font-black uppercase tracking-widest",
            "text-cafe-accent transition-colors hover:bg-cafe-accent/10",
            FOCUS_RING,
          )}
        >
          <Plus size={18} aria-hidden="true" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className={cn(
            ICON_BUTTON,
            "text-cafe-fg hover:bg-cafe-fg/5",
            FOCUS_RING,
          )}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
