import type { Message } from "@/components/ai/types";

/** Text of the most recent user message, or null if there isn't one. */
export function findLastUserText(
  messages: readonly Message[] | undefined,
): string | null {
  if (!messages) return null;

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message?.role === "user") return message.text;
  }

  return null;
}
