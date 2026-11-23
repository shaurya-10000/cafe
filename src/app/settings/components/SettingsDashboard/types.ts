import type { LucideIcon } from "lucide-react";

export type SettingsTab = "profile" | "orders" | "appearance" | "regional";

export interface MenuItem {
  readonly id: SettingsTab;
  readonly label: string;
  readonly icon: LucideIcon;
}
