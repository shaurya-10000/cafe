import { DEFAULT_EMPTY_ANNOUNCEMENT, MAX_DISPLAY_COUNT } from "../constants";
import type {
  AnnouncementFormatters,
  CartFABLabels,
  ResolvedLabels,
} from "../types";

export function formatBadgeCount(
  count: number,
  custom?: CartFABLabels["formatBadgeCount"],
): string {
  if (custom) return custom(count);
  return count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(count);
}

function defaultUpdateAnnouncement(
  count: number,
  singular: string,
  plural: string,
): string {
  return `Cart updated: ${count} ${count === 1 ? singular : plural}`;
}

export function resolveAnnouncementFormatters(
  labels: CartFABLabels | undefined,
  resolved: ResolvedLabels,
): AnnouncementFormatters {
  return {
    update:
      labels?.formatUpdateAnnouncement ??
      ((count: number) =>
        defaultUpdateAnnouncement(
          count,
          resolved.itemSingular,
          resolved.itemPlural,
        )),
    empty: labels?.formatEmptyAnnouncement ?? (() => DEFAULT_EMPTY_ANNOUNCEMENT),
  };
}