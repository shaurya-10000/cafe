import { MENU_ITEMS } from "../constants";
import type { SettingsTab } from "../types";

const TAB_IDS: ReadonlySet<string> = new Set(MENU_ITEMS.map((item) => item.id));

/** The settings tab a `?tab=` value names, or null when it isn't a real one. */
export function parseSettingsTab(value: string | null): SettingsTab | null {
  const normalized = value?.trim().toLowerCase();

  return normalized && TAB_IDS.has(normalized)
    ? (normalized as SettingsTab)
    : null;
}
