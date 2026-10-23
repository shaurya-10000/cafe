"use client";

import { useReducedMotion } from "framer-motion";
import { useCafeTheme } from "@/utils/providers/theme-provider";
import { ModeSection } from "./components/ModeSection";
import { PaletteSection } from "./components/PaletteSection";
import { ReduceMotionNotice } from "./components/ReduceMotionNotice";

export default function ThemeSettings() {
  const { mode, setMode, colorPalette, setColorPalette, mounted } =
    useCafeTheme();
  const reducedMotion = useReducedMotion() ?? false;

  // Before the provider has synced with the DOM, `mode` is undefined and any
  // selected state would mismatch what the anti-flash script already applied.
  // Rendering nothing is correct; the provider flips `mounted` almost at once.
  if (!mounted) return null;

  return (
    <div className="w-full space-y-12">
      <div>
        <h2 className="text-4xl font-black uppercase leading-none tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-5xl">
          Appearance{" "}
          <span className="font-serif lowercase italic text-cafe-accent">
            Settings
          </span>
        </h2>
        <p className="mt-4 font-medium text-zinc-500 dark:text-zinc-400">
          Customize how the Cafe ecosystem looks and feels on your device.
        </p>
      </div>

      <ModeSection
        mode={mode}
        onChange={setMode}
        reducedMotion={reducedMotion}
      />

      <PaletteSection
        palette={colorPalette}
        onChange={setColorPalette}
        reducedMotion={reducedMotion}
      />

      <ReduceMotionNotice />
    </div>
  );
}
