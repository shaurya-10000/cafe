"use client";

import type { ReactNode } from "react";

import { AppProvider } from "@/utils/providers/AppContext";
import { ThemeProvider } from "@/utils/providers/theme-provider";

interface ProvidersProps {
  children: ReactNode;
}

/** Global provider stack. Order matters: AppProvider wraps ThemeProvider. */
export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AppProvider>
  );
}