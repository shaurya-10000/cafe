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
        "z-10 flex shrink-0 items-center justify-between",
        "border-b border-cafe-border bg-cafe-bg p-6",
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close chat history" : "Open chat history"}
          aria-expanded={isSidebarOpen}
          aria-controls={HISTORY_SIDEBAR_ID}
          className={cn(
            "-ml-2 rounded-full p-2",
            "text-cafe-fg/60 transition-colors",
            "hover:bg-cafe-fg/5 hover:text-cafe-fg",
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
            "rounded-xl p-2 text-white shadow-xl",
          )}
        >
          <Sparkles size={20} />
        </span>

        <h2
          id={headingId}
          className={cn(
            "max-w-[200px] truncate text-xl font-black italic uppercase",
            "tracking-tighter text-cafe-fg",
          )}
        >
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5",
            "text-[10px] font-black uppercase tracking-widest",
            "text-cafe-accent transition-colors",
            "hover:bg-cafe-accent/10",
            FOCUS_RING,
          )}
        >
          <Plus size={14} aria-hidden="true" />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className={cn(
            "rounded-full p-2 transition-colors",
            "text-cafe-fg",
            "hover:bg-cafe-fg/5",
            FOCUS_RING,
          )}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}