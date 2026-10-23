import type { SupabaseClient } from "@supabase/supabase-js";
import { parseActionPayload } from "./parseAction";

export type ChatAssistantType = "customer" | "admin";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readChatId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { chatId?: unknown }).chatId;
  if (typeof raw !== "string" || !UUID_PATTERN.test(raw)) return null;
  return raw.toLowerCase();
}

export async function findOwnedChat(client: SupabaseClient, params: { readonly chatId: string; readonly userId: string; readonly assistantType: ChatAssistantType; }): Promise<boolean> {
  const { data, error } = await client.from("chats").select("id").eq("id", params.chatId).eq("user_id", params.userId).eq("assistant_type", params.assistantType).maybeSingle();
  if (error) { console.error("[chat] ownership check failed", { code: error.code, message: error.message }); return false; }
  return data !== null;
}

export async function persistAssistantMessage(client: SupabaseClient, params: { readonly chatId: string; readonly rawText: string }): Promise<boolean> {
  try {
    const { cleanText, action } = parseActionPayload(params.rawText);
    const content = cleanText.trim();
    if (!content && !action) return false;

    const { error: insertError } = await client.from("chat_messages").insert({ chat_id: params.chatId, role: "assistant", content, action: action ?? null });
    if (insertError) { console.error("[chat] assistant message insert failed", { code: insertError.code, message: insertError.message }); return false; }

    const { error: touchError } = await client.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", params.chatId);
    if (touchError) console.error("[chat] chat touch failed", { code: touchError.code, message: touchError.message });
    return true;
  } catch (error) { console.error("[chat] assistant message persistence threw", error); return false; }
}
