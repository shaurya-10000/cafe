import { z } from "zod";
import { ActionPayloadSchema, type ActionPayload } from "@/types/action";

export function parseActionPayload(text: string): { cleanText: string; action?: ActionPayload } {
  const matches = [...text.matchAll(/\[ACTION_DATA:([\s\S]*?)\]/g)];
  if (matches.length === 0) return { cleanText: text.trim() };

  let action: ActionPayload | undefined;

  for (let i = matches.length - 1; i >= 0; i--) {
    const raw = matches[i]?.[1];
    if (!raw) continue;

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("[chat/parseAction] JSON parse failed", error);
      continue;
    }

    const result = ActionPayloadSchema.safeParse(parsed);
    if (result.success) { action = result.data; break; }
    if (process.env.NODE_ENV !== "production") console.warn("[chat/parseAction] Action payload failed schema validation", result.error.flatten());
  }

  const cleanText = text.replace(/\[ACTION_DATA:[\s\S]*?\]/g, "").replace(/^\s*```json\s*/i, "").replace(/```json\s*\n?\s*$/i, "").trim();
  return { cleanText, action };
}

export { ActionPayloadSchema };
export type { ActionPayload };
export { z };
