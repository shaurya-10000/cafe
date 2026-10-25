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
    <span aria-hidden="true" className="flex flex-col items-center gap-[2.5px]">
      <span className="h-[2.5px] w-[2.5px] rounded-full bg-current" />
      <span className="h-[2.5px] w-[2.5px] rounded-full bg-current" />
      <span className="h-[2.5px] w-[2.5px] rounded-full bg-current" />
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
          "relative flex h-7 w-7 items-center justify-center rounded-full",
          // Invisible, larger hit area: small to look at, still easy to tap.
          "before:absolute before:-inset-2 before:content-[''''] ",
          "transition-colors hover:bg-cafe-fg/5 hover:text-cafe-fg",
          isOpen ? "bg-cafe-fg/5 text-cafe-fg" : "text-cafe-fg/40",
          FOCUS_RING,
        )}
      >
        {confirmed ? (
          <Check size={12} className="text-emerald-500" aria-hidden="true" />
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
            "absolute z-20 w-32 rounded-xl p-1",
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
