import { useTheme } from "next-themes";

import { DARK_CHART_THEME, LIGHT_CHART_THEME } from "../constants";
import type { ChartTheme } from "../types";
import { useHasMounted } from "./useHasMounted";

/**
 * next-themes can't know the client's stored preference during SSR, so
 * `resolvedTheme` is `undefined` on the very first render. Gating on
 * `mounted` avoids the charts briefly rendering with the wrong palette
 * before the real theme resolves.
 */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const mounted = useHasMounted();

  return mounted && resolvedTheme === "dark"
    ? DARK_CHART_THEME
    : LIGHT_CHART_THEME;
}
