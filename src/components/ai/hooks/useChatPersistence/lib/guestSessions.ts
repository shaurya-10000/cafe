import type { ActionPayload } from "@/types/action";
import type { ChatSession, Message } from "@/components/ai/types";

import {
  MAX_GUEST_CHATS,
  MAX_GUEST_MESSAGES_PER_CHAT,
  MAX_TITLE_LENGTH,
  NEW_CHAT_TITLE,
} from "../constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGuestMessage(raw: unknown): Message | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (raw.role !== "user" && raw.role !== "assistant") return null;
  if (typeof raw.text !== "string") return null;

  const action =
    isRecord(raw.action) && typeof raw.action.type === "string"
      ? (raw.action as unknown as ActionPayload)
      : undefined;

  return {
    id: raw.id,
    role: raw.role,
    text: raw.text,
    action,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

/**
 * localStorage is user-editable and survives deploys, so whatever shape an
 * older build wrote must never be trusted. Anything malformed is dropped
 * rather than allowed to crash the render.
 */
export function parseGuestSessions(raw: unknown): ChatSession[] {
  if (!Array.isArray(raw)) return [];

  const sessions: ChatSession[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    if (typeof entry.id !== "string" || !entry.id || seen.has(entry.id)) {
      continue;
    }
    if (!Array.isArray(entry.messages)) continue;

    const messages: Message[] = [];
    for (const candidate of entry.messages) {
      const parsed = parseGuestMessage(candidate);
      if (parsed) messages.push(parsed);
    }

    seen.add(entry.id);
    sessions.push({
      id: entry.id,
      title:
        typeof entry.title === "string" && entry.title.trim()
          ? entry.title.slice(0, MAX_TITLE_LENGTH)
          : NEW_CHAT_TITLE,
      isPinned: entry.isPinned === true,
      messages: messages.slice(-MAX_GUEST_MESSAGES_PER_CHAT),
      updatedAt:
        typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt)
          ? entry.updatedAt
          : Date.now(),
    });

    if (sessions.length >= MAX_GUEST_CHATS) break;
  }

  return sessions;
}

export function serializeGuestSessions(
  sessions: readonly ChatSession[],
): ChatSession[] {
  return sessions.slice(0, MAX_GUEST_CHATS).map((session) => ({
    ...session,
    messages: session.messages.slice(-MAX_GUEST_MESSAGES_PER_CHAT),
  }));
}