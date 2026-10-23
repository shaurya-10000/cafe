import { Monitor, Moon, Sun } from "lucide-react";
import type { ModeOption } from "../types";

export const MODE_OPTIONS: readonly ModeOption[] = [
  {
    name: "Light",
    value: "light",
    icon: Sun,
    description: "Classic high-contrast look",
  },
  {
    name: "Dark",
    value: "dark",
    icon: Moon,
    description: "Easy on the eyes for night",
  },
  {
    name: "System",
    value: "system",
    icon: Monitor,
    description: "Follows device preferences",
  },
];

export const MODE_VALUES = MODE_OPTIONS.map((option) => option.value);
