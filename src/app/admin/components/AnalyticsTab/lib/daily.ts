import type { AnalyticsChartPoint, TimeRange } from "../types";

/** Calendar days each range covers; null means "from the first order". */
export const WINDOW_DAYS: Record<TimeRange, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

const MIN_SPAN_DAYS = 7;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * One point per local calendar day, oldest first, with empty days at zero, so
 * a handful of orders still draws a readable line instead of a lone dot.
 * Never drops an order: the range always starts on or before the earliest one.
 */
export function buildDailySeries(
  points: readonly AnalyticsChartPoint[],
  windowDays: number | null,
  now: Date = new Date(),
): AnalyticsChartPoint[] {
  const totals = new Map<number, number>();
  let earliest: number | null = null;

  for (const point of points) {
    const date = new Date(point.created_at);

    if (Number.isNaN(date.getTime())) continue;

    const day = startOfDay(date).getTime();

    totals.set(
      day,
      (totals.get(day) ?? 0) +
        (Number.isFinite(point.total_amount) ? point.total_amount : 0),
    );

    if (earliest === null || day < earliest) earliest = day;
  }

  const today = startOfDay(now);
  const span = windowDays ?? MIN_SPAN_DAYS - 1;

  let start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - span);

  if (earliest !== null && earliest < start.getTime()) {
    start = new Date(earliest);
  }

  const series: AnalyticsChartPoint[] = [];

  for (let offset = 0; ; offset += 1) {
    const cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + offset,
    );

    if (cursor.getTime() > today.getTime()) break;

    series.push({
      created_at: cursor.toISOString(),
      total_amount: totals.get(cursor.getTime()) ?? 0,
    });
  }

  return series;
}
