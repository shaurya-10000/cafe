import { cn } from "@/lib/utils";

import { FOCUS_RING } from "../styles";

export const ASIDE_CLASS = cn(
  "flex h-full w-[min(220px,80vw)] shrink-0 flex-col overflow-hidden",
  "border-r border-cafe-border bg-cafe-bg shadow-xl sm:bg-cafe-fg/[0.03] sm:shadow-none",
);

export const SCROLL_AREA_CLASS =
  "flex-1 space-y-1 overflow-y-auto p-3 text-cafe-fg [scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,currentColor_30%,transparent)_transparent]";

export const HEADING_CLASS =
  "block px-2 py-1 text-[9px] font-black uppercase tracking-widest text-cafe-fg/40";

export const LIST_CLASS = "m-0 list-none space-y-1 p-0";

export function buildRowClass(isActive: boolean): string {
  return cn(
    "group relative flex items-center justify-between",
    "rounded-xl text-xs transition",
    isActive
      ? "border border-cafe-accent/30 bg-cafe-accent/15 font-medium text-cafe-fg"
      : "text-cafe-fg/60 hover:bg-cafe-fg/5",
  );
}

export const RENAME_WRAPPER_CLASS =
  "flex min-w-0 flex-1 items-center gap-2 px-3 py-2";

export const RENAME_INPUT_CLASS = cn(
  "w-full rounded border border-cafe-accent bg-cafe-bg",
  "px-1.5 py-0.5 text-xs text-cafe-fg",
  "focus:outline-none",
  FOCUS_RING,
);

export const SELECT_BUTTON_CLASS = cn(
  "flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left",
  "rounded-xl",
  FOCUS_RING,
);

export const MENU_TRIGGER_CLASS = cn(
  "mr-1 rounded p-2 text-cafe-fg/40 opacity-100 transition sm:p-1 sm:opacity-0",
  "group-hover:opacity-100 focus-visible:opacity-100",
  "hover:bg-cafe-fg/10 hover:text-cafe-fg",
  FOCUS_RING,
);