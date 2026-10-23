"use client";

import Header from "@/components/Header";
import SeasonalBackground from "@/components/SeasonalBackground";

import { MainContent, Providers } from "./components";
import { useLayoutChrome } from "./hooks";
import type { ClientLayoutWrapperProps } from "./types";

/**
 * Global client shell: providers, route-aware chrome (Header and
 * SeasonalBackground), and the main content region.
 *
 * Which chrome is hidden per route is configured in `./constants`.
 */
export default function ClientLayoutWrapper({
  children,
}: ClientLayoutWrapperProps) {
  const { hideHeader, hideSeasonalBackground } = useLayoutChrome();

  return (
    <Providers>
      {!hideSeasonalBackground && <SeasonalBackground />}

      {!hideHeader && <Header />}

      <MainContent hideHeader={hideHeader}>{children}</MainContent>
    </Providers>
  );
}