import type { ChatRow, ChatSession } from "@/components/ai/types";

export function mapChatRow(row: ChatRow): ChatSession {
  // Messages arrive newest-first (so the per-chat limit keeps the latest
  // ones); the UI wants oldest-first.
  const messages = [...(row.chat_messages ?? [])].reverse().map((message) => ({
    id: message.id,
    role: message.role,
    text: message.content,
    action: message.action ?? undefined,
    createdAt: message.created_at,
  }));

  return {
    id: row.id,
    title: row.title,
    isPinned: row.is_pinned,
    updatedAt: new Date(row.updated_at).getTime(),
    messages,
  };
}