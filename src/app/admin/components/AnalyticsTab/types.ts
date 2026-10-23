import type { CSSProperties } from "react";

export type TimeRange = "7d" | "30d" | "90d" | "all";

/**
 * One point on the revenue trend chart.
 *
 * `total_amount` is a plain `number`: the caller (the admin dashboard)
 * coerces NUMERIC columns to a JS number before handing them to this
 * component, so the chart never has to reason about `string | number` at
 * render time. Extra upstream fields are allowed through via the index
 * signature so callers can carry `id`, `status`, `order_type`, etc. on the
 * same object without narrowing this prop.
 */
export interface AnalyticsChartPoint {
  created_at: string;
  total_amount: number;
  [key: string]: unknown;
}

/**
 * Structured breakdown of orders by fulfilment type x payment method.
 * Consumed by the pie chart via `pieData`; kept here so a caller can
 * construct a pie without re-deriving the labels/colors.
 */
export interface FilteredAnalyticsSplit {
  deliveryOnline: number;
  deliveryInPerson: number;
  pickupOnline: number;
  pickupInPerson: number;
  scheduledOnline: number;
  scheduledInPerson: number;
}

/**
 * Metrics handed to `AnalyticsTab`.
 *
 * `filtered` is what the chart needs, `revenue`/`count`/`topItem`/
 * `leastItem` are what the metric cards need, and `split` is an optional
 * convenience the caller can include. The `pieData` prop remains the single
 * source of truth for the pie itself.
 *
 * `topItem` and `leastItem` are `string | null` because the caller cannot
 * always name an item (empty window, or an order with no line items):
 * `null` renders as an em-dash in the metric card rather than the literal
 * string "N/A", which is a display concern, not a data concern.
 */
export interface FilteredAnalyticsData {
  filtered: AnalyticsChartPoint[];
  revenue: number;
  count: number;
  topItem: string | null;
  leastItem: string | null;
  split?: FilteredAnalyticsSplit;
}

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsTabProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filteredAnalyticsData: FilteredAnalyticsData;
  pieData: PieDatum[];
  onOpenAssistant?: () => void;
  /**
   * ISO 4217 code, e.g. "USD" / "INR" / "EUR". Matches
   * business_settings.currency; defaults to "USD" only as a last resort if
   * the caller hasn't wired that value through yet.
   */
  currency?: string;
}

export type MetricColor = "blue" | "purple" | "orange" | "red";

export type CurrencyFormatter = (value: number) => string;

export interface ChartTheme {
  gridColor: string;
  axisColor: string;
  tooltipLabelColor: string;
  tooltipContentStyle: CSSProperties;
}
