import type { FAQFilter } from "../types";

export function createId(prefix: string, baseId: string, value: string): string {
  return `${prefix}-${baseId}-${value}`;
}

/**
 * All DOM ids for one section instance. Row panels use their own prefix so an
 * entry whose id happens to be "content" can never collide with the tabpanel.
 */
export function createFaqIds(baseId: string) {
  return {
    defaultSection: createId("faq-section", baseId, "root"),
    heading: createId("faq-heading", baseId, "heading"),
    tablist: createId("faq-tablist", baseId, "filters"),
    panel: createId("faq-panel", baseId, "content"),
    tab: (filter: FAQFilter) => createId("faq-tab", baseId, filter),
    rowButton: (entryId: string) => createId("faq-btn", baseId, entryId),
    rowPanel: (entryId: string) => createId("faq-row-panel", baseId, entryId),
  };
}

export type FaqIds = ReturnType<typeof createFaqIds>;
