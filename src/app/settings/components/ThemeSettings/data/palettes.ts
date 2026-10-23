import type { PaletteOption } from "../types";

export const COLOR_PALETTES: readonly PaletteOption[] = [
  {
    id: "espresso",
    name: "Velvet Espresso",
    accent: "#C4A484",
    bgLight: "#FAF9F6",
    bgDark: "#12100E",
    description: "Signature oat milk background with warm gold tones",
  },
  {
    id: "emerald",
    name: "Emerald Reserve",
    accent: "#2D5A27",
    bgLight: "#F4F6F4",
    bgDark: "#0B130B",
    description: "Deep forest green highlights over sage mist",
  },
  {
    id: "rosewood",
    name: "Rosewood & Brass",
    accent: "#9E4747",
    bgLight: "#FAF5F5",
    bgDark: "#1A0F0F",
    description: "Vintage burgundy hues on soft blush linen",
  },
  {
    id: "champagne",
    name: "Noir Champagne",
    accent: "#D4AF37",
    bgLight: "#F8F8F8",
    bgDark: "#050505",
    description: "Metallic gold accents with deep studio blacks",
  },
];

export const PALETTE_IDS = COLOR_PALETTES.map((palette) => palette.id);
