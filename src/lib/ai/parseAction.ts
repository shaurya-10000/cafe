import { z } from "zod";
import { ActionPayloadSchema, type ActionPayload } from "@/types/action";

const TAG_OPEN = "[ACTION_DATA:";

interface TagSpan {
  /** Index of the `[` that opens the tag. */
  readonly start: number;
  /** Index just past the tag's last character. */
  readonly end: number;
  readonly json: string;
}

interface ScanResult {
  readonly spans: readonly TagSpan[];
  /** Start of a tag still streaming in (its JSON object isn't closed yet), or -1. */
  readonly unterminatedAt: number;
}

/**
 * Index just past the `}` that closes the object starting at `from`, or -1
 * if it isn't closed yet. Aware of strings and escapes, so braces and
 * brackets inside values (or nested arrays like `"items":[...]`) can't end
 * the object early.
 */
function findObjectEnd(text: string, from: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = from; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }

  return -1;
}

function skipWhitespace(text: string, from: number): number {
  let i = from;
  while (i < text.length && /\s/.test(text[i] ?? "")) i++;
  return i;
}

function scanTags(text: string): ScanResult {
  const spans: TagSpan[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf(TAG_OPEN, cursor);
    if (start === -1) break;

    const jsonStart = skipWhitespace(text, start + TAG_OPEN.length);
    if (jsonStart >= text.length) return { spans, unterminatedAt: start };

    if (text[jsonStart] !== "{") {
      cursor = start + TAG_OPEN.length;
      continue;
    }

    const jsonEnd = findObjectEnd(text, jsonStart);
    if (jsonEnd === -1) return { spans, unterminatedAt: start };

    // Consume the closing `]` (or the end of text, if it hasn't streamed in
    // yet) so a stray bracket never leaks into the visible message.
    const next = skipWhitespace(text, jsonEnd);
    let end = jsonEnd;
    if (next >= text.length) end = text.length;
    else if (text[next] === "]") end = next + 1;

    spans.push({ start, end, json: text.slice(jsonStart, jsonEnd) });
    cursor = end;
  }

  return { spans, unterminatedAt: -1 };
}

/**
 * Splits a model reply into display text and an optional action.
 * The last tag that parses and passes schema validation wins.
 */
export function parseActionPayload(text: string): {
  cleanText: string;
  action?: ActionPayload;
} {
  const { spans, unterminatedAt } = scanTags(text);

  if (spans.length === 0 && unterminatedAt === -1) {
    return { cleanText: text.trim() };
  }

  let action: ActionPayload | undefined;

  for (let i = spans.length - 1; i >= 0; i--) {
    const span = spans[i];
    if (!span) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(span.json);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[chat/parseAction] JSON parse failed", error);
      }
      continue;
    }

    const result = ActionPayloadSchema.safeParse(parsed);
    if (result.success) {
      action = result.data;
      break;
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[chat/parseAction] Action payload failed schema validation",
        result.error.flatten(),
      );
    }
  }

  let visible = "";
  let position = 0;
  for (const span of spans) {
    visible += text.slice(position, span.start);
    position = span.end;
  }
  visible += text.slice(position, unterminatedAt === -1 ? undefined : unterminatedAt);

  const cleanText = visible
    .replace(/^\s*```json\s*/i, "")
    .replace(/```json\s*\n?\s*$/i, "")
    .trim();

  return { cleanText, action };
}

export { ActionPayloadSchema };
export type { ActionPayload };
export { z };
