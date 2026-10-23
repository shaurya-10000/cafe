import type { KeyboardEvent, RefObject } from "react";
import { Edit2, Pin, Trash2 } from "lucide-react";

import type { ChatSession } from "@/components/ai/types";
import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";

import { MENU_Z_INDEX } from "../constants";
import type { MenuPosition } from "../types";

interface SessionMenuProps {
  session: ChatSession;
  /** Null until measured; the menu stays hidden (but laid out) meanwhile. */
  position: MenuPosition | null;
  menuRef: RefObject<HTMLDivElement | null>;
  registerItem: (index: number) => (el: HTMLButtonElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onTogglePin: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ITEM_CLASS = cn(
  "flex w-full items-center gap-2 px-3 py-2 text-left",
  "text-[11px] font-medium",
  FOCUS_RING,
);

export function SessionMenu({
  session,
  position,
  menuRef,
  registerItem,
  onKeyDown,
  onTogglePin,
  onRename,
  onDelete,
}: SessionMenuProps) {
  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        zIndex: MENU_Z_INDEX,
        visibility: position ? "visible" : "hidden",
      }}
      className={cn(
        "min-w-[160px] overflow-hidden rounded-xl",
        "border border-cafe-border bg-cafe-bg shadow-2xl",
      )}
    >
      <button
        ref={registerItem(0)}
        type="button"
        role="menuitem"
        onClick={onTogglePin}
        className={cn(ITEM_CLASS, "text-cafe-fg hover:bg-cafe-fg/5")}
      >
        <Pin
          size={12}
          className={cn(session.isPinned && "fill-cafe-accent text-cafe-accent")}
          aria-hidden="true"
        />
        {session.isPinned ? "Unpin" : "Pin"}
      </button>

      <button
        ref={registerItem(1)}
        type="button"
        role="menuitem"
        onClick={onRename}
        className={cn(ITEM_CLASS, "text-cafe-fg hover:bg-cafe-fg/5")}
      >
        <Edit2 size={12} aria-hidden="true" />
        Rename
      </button>

      <button
        ref={registerItem(2)}
        type="button"
        role="menuitem"
        onClick={onDelete}
        className={cn(ITEM_CLASS, "text-red-500 hover:bg-red-500/10")}
      >
        <Trash2 size={12} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}