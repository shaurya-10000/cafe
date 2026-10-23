"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useHasMounted } from "@/hooks/useHasMounted";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { SET_THEME_MODE, SET_COLOR_PALETTE, listenCafeEvent } from "@/lib/core/events";

export type ColorPalette = "espresso" | "emerald" | "rosewood" | "champagne";
export type ThemeMode = "light" | "dark" | "system";

interface CafeThemeContextType {
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
  mode: string | undefined;
  setMode: (mode: ThemeMode) => void;
  mounted: boolean;
}

const CafeThemeContext = createContext<CafeThemeContextType | undefined>(undefined);

export const PALETTE_STORAGE_KEY = "cafe-color-palette" as const;
export const DEFAULT_PALETTE: ColorPalette = "espresso";
export const VALID_PALETTES = ["espresso", "emerald", "rosewood", "champagne"] as const satisfies readonly ColorPalette[];
const VALID_MODES: readonly ThemeMode[] = ["light", "dark", "system"] as const;

function assertPaletteListMatchesLayout(): void {
  if (typeof window !== "undefined") return;
  try {
    // Dev-only server check. It must stay a lazy require() so it never enters
    // the client bundle, which is why the import-style rule is disabled here.
    /* eslint-disable @typescript-eslint/no-require-imports */
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    /* eslint-enable @typescript-eslint/no-require-imports */
    const layoutPath = path.resolve(process.cwd(), "app", "layout.tsx");
    if (!fs.existsSync(layoutPath)) return;
    const source = fs.readFileSync(layoutPath, "utf8");
    const match = source.match(/var v=(\[[^\]]*\])/);
    if (!match) return;
    const parsed: unknown = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) return;
    const layoutPalettes = parsed.filter((p): p is string => typeof p === "string");
    const here = [...VALID_PALETTES];
    const sameLength = layoutPalettes.length === here.length;
    const sameValues = sameLength && layoutPalettes.every((p, i) => p === here[i]);
    if (!sameValues) throw new Error(`[theme-provider] Palette drift detected.\n Update BOTH places so the anti-flash script and the runtime palette list agree, then reload.`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[theme-provider] Palette drift detected")) throw err;
  }
}
assertPaletteListMatchesLayout();

function isValidPalette(value: unknown): value is ColorPalette {
  return typeof value === "string" && (VALID_PALETTES as readonly string[]).includes(value);
}

function isValidMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (VALID_MODES as readonly string[]).includes(value);
}

function readStoredPalette(): ColorPalette {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  try {
    const saved = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return isValidPalette(saved) ? saved : DEFAULT_PALETTE;
  } catch { return DEFAULT_PALETTE; }
}

// The palette lives in localStorage, so it is modelled as an external store:
// React reads it with useSyncExternalStore (server snapshot = default, client
// snapshot = stored value) rather than copying it into state from an effect.
const paletteListeners = new Set<() => void>();
let inMemoryPalette: ColorPalette | null = null;

function subscribePalette(listener: () => void): () => void {
  paletteListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    paletteListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getPaletteSnapshot(): ColorPalette {
  return inMemoryPalette ?? readStoredPalette();
}

function getServerPaletteSnapshot(): ColorPalette {
  return DEFAULT_PALETTE;
}

function publishPalette(palette: ColorPalette): void {
  inMemoryPalette = palette;
  paletteListeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeBridge>{children}</ThemeBridge>
    </NextThemesProvider>
  );
}

function ThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme();
  const mounted = useHasMounted();
  const colorPalette = useSyncExternalStore(subscribePalette, getPaletteSnapshot, getServerPaletteSnapshot);

  const setColorPalette = useCallback((palette: ColorPalette) => {
    if (!isValidPalette(palette)) return;
    publishPalette(palette);
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-color-theme", palette);
    try { window.localStorage.setItem(PALETTE_STORAGE_KEY, palette); } catch {}
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    if (!isValidMode(mode)) return;
    setTheme(mode);
  }, [setTheme]);

  useEffect(() => {
    if (!mounted) return;
    const removeModeListener = listenCafeEvent<{ mode?: unknown }>(SET_THEME_MODE, (event) => {
      if (isValidMode(event.detail?.mode)) setMode(event.detail.mode);
    });
    const removePaletteListener = listenCafeEvent<{ palette?: unknown }>(SET_COLOR_PALETTE, (event) => {
      if (isValidPalette(event.detail?.palette)) setColorPalette(event.detail.palette);
    });
    return () => { removeModeListener(); removePaletteListener(); };
  }, [mounted, setMode, setColorPalette]);

  const contextValue = useMemo<CafeThemeContextType>(() => ({
    colorPalette,
    setColorPalette,
    mode: mounted ? theme : undefined,
    setMode,
    mounted,
  }), [colorPalette, setColorPalette, mounted, theme, setMode]);

  return <CafeThemeContext.Provider value={contextValue}>{children}</CafeThemeContext.Provider>;
}

export function useCafeTheme(): CafeThemeContextType {
  const context = useContext(CafeThemeContext);
  if (!context) throw new Error("useCafeTheme must be used within a <ThemeProvider>.");
  return context;
}
