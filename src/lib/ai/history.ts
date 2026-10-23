import type { Message } from "@/components/ai/types";
import { HISTORY_MAX_MESSAGES, HISTORY_MAX_TOTAL_CHARS } from "./constants";

export function historyPayload(messages: readonly Message[]) {
  const filtered = messages.filter((m) => m.text.trim().length > 0);
  const trimmedByCount = filtered.length > HISTORY_MAX_MESSAGES ? filtered.slice(filtered.length - HISTORY_MAX_MESSAGES) : filtered;

  let total = trimmedByCount.reduce((sum, m) => sum + m.text.length, 0);
  let start = 0;
  while (start < trimmedByCount.length - 1 && total > HISTORY_MAX_TOTAL_CHARS) {
    total -= trimmedByCount[start].text.length;
    start += 1;
  }

  return trimmedByCount.slice(start).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.text }],
  }));
}
