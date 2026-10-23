import type { LucideIcon } from "lucide-react";
import type {
  ColorPalette,
  useCafeTheme,
} from "@/utils/providers/theme-provider";

export type { ColorPalette };

/** Derived from the provider so it can never drift from what setMode accepts. */
export type ThemeMode = Parameters<ReturnType<typeof useCafeTheme>["setMode"]>[0];

export interface ModeOption {
  readonly value: ThemeMode;
  readonly name: string;
  readonly icon: LucideIcon;
  readonly description: string;
}

export interface PaletteOption {
  readonly id: ColorPalette;
  readonly name: string;
  readonly accent: string;
  readonly bgLight: string;
  readonly bgDark: string;
  readonly description: string;
}
