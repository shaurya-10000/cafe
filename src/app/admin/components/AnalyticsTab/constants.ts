import type { ChartTheme, MetricColor, TimeRange } from "./types";

export const DEFAULT_CURRENCY = "USD";

/** Shown when there is no top/least item (an em-dash, not "N/A"). */
export const EMPTY_VALUE_LABEL = "\u2014";

export const TIME_RANGES: readonly TimeRange[] = ["7d", "30d", "90d", "all"];

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  all: "All",
};

export const CHART_ACCENT = "var(--accent)";

function createTheme(colors: {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}): ChartTheme {
  return {
    gridColor: colors.grid,
    axisColor: colors.axis,
    tooltipLabelColor: colors.tooltipText,
    tooltipContentStyle: {
      backgroundColor: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: "12px",
    },
  };
}

export const LIGHT_CHART_THEME: ChartTheme = createTheme({
  grid: "#e4e4e7",
  axis: "#71717a",
  tooltipBg: "#fff",
  tooltipBorder: "#e4e4e7",
  tooltipText: "#18181b",
});

export const DARK_CHART_THEME: ChartTheme = createTheme({
  grid: "#1f1f1f",
  axis: "#4b5563",
  tooltipBg: "#000",
  tooltipBorder: "#222",
  tooltipText: "#e4e4e7",
});

export const METRIC_COLOR_CLASSES: Record<MetricColor, string> = {
  blue: "text-cafe-accent bg-cafe-accent/10 border-cafe-accent/20",
  purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  red: "text-red-500 bg-red-500/10 border-red-500/20",
};
