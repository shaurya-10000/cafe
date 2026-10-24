"use client";

import { Check } from "lucide-react";

import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

import { MenuItem } from "./MenuItem";
import type { MessageMenuAction } from "./types";
import { useMessageMenu } from "./useMessageMenu";

interface MessageMenuProps {
  readonly actions: readonly MessageMenuAction[];
  /** Swaps the dots for a check, e.g. right after copying. */
  readonly confirmed?: boolean;
  readonly className?: string;
}

function Dots() {
  return (
    <span aria-hidden="true" className="flex items-center gap-[3px]">
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
    </span>
  );
}

/** A three-dots button that opens a small menu of actions for one message. */
export function MessageMenu({
  actions,
  confirmed = false,
  className,
}: MessageMenuProps) {
  const {
    isOpen,
    placement,
    menuId,
    triggerRef,
    menuRef,
    toggle,
    select,
    handleMenuKeyDown,
  } = useMessageMenu(actions.length);

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Message options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full sm:h-8 sm:w-8",
          "transition-colors hover:bg-cafe-fg/5 hover:text-cafe-fg",
          isOpen ? "bg-cafe-fg/5 text-cafe-fg" : "text-cafe-fg/40",
          FOCUS_RING,
        )}
      >
        {confirmed ? (
          <Check size={14} className="text-emerald-500" aria-hidden="true" />
        ) : (
          <Dots />
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Message options"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute z-20 w-44 rounded-xl p-1",
            "border border-cafe-border bg-cafe-bg shadow-xl",
            placement.vertical === "down" ? "top-full mt-1" : "bottom-full mb-1",
            placement.horizontal === "start" ? "left-0" : "right-0",
          )}
        >
          {actions.map((action) => (
            <MenuItem key={action.id} action={action} onSelect={select} />
          ))}
        </div>
      )}
    </div>
  );
}
