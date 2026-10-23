import type { ChatSession } from "@/components/ai/types";

/** Pinned first, then most recently updated. */
export function sortSessions(
  sessions: readonly ChatSession[],
): ChatSession[] {
  return [...sessions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}