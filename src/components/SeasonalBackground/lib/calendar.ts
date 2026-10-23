import type { DateBoundary, MonthDay, Season } from "../types";

export function getLocalDateParts(
  timeZone: string,
  now: Date = new Date(),
): { month: number; day: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);

    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);

    return Number.isInteger(month) && Number.isInteger(day)
      ? { month, day }
      : null;
  } catch {
    return null;
  }
}

export function dateInRange(
  month: number,
  day: number,
  start: MonthDay,
  end: MonthDay,
): boolean {
  const value = month * 100 + day;

  return (
    value >= start.month * 100 + start.day &&
    value <= end.month * 100 + end.day
  );
}

function findSeason(
  month: number,
  day: number,
  boundaries: readonly DateBoundary[],
): Season {
  return (
    boundaries.find((boundary) =>
      dateInRange(month, day, boundary.start, boundary.end),
    )?.season ?? "default"
  );
}

export function getCalendarSeason(
  timeZone: string,
  boundaries: readonly DateBoundary[],
  onInvalidTimeZone?: (timeZone: string) => void,
  now: Date = new Date(),
): Season {
  const resolved = getLocalDateParts(timeZone, now);

  if (!resolved) {
    onInvalidTimeZone?.(timeZone);

    return findSeason(now.getMonth() + 1, now.getDate(), boundaries);
  }

  return findSeason(resolved.month, resolved.day, boundaries);
}

export function getBoundariesKey(boundaries: readonly DateBoundary[]): string {
  return boundaries
    .map(
      ({ season, start, end }) =>
        `${season}:${start.month}-${start.day}:${end.month}-${end.day}`,
    )
    .join("|");
}