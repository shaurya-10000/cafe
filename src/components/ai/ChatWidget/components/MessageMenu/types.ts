import type { LucideIcon } from "lucide-react";

export interface MessageMenuAction {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly onSelect: () => void;
}

export interface MenuPlacement {
  /** Open below the trigger ("down") or above it ("up"). */
  readonly vertical: "up" | "down";
  /** Align the menu's left edge ("start") or right edge ("end") to the trigger. */
  readonly horizontal: "start" | "end";
}
