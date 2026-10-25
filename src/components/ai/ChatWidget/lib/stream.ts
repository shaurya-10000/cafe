import { parseActionPayload } from "@/lib/ai/parseAction";
import type { ActionPayload } from "@/types/action";

export interface StreamResult {
  text: string;
  action: ActionPayload | undefined;
}

interface ReadHandlers {
  /** True once a newer request superseded this one. */
  isStale: () => boolean;
  onProgress: (text: string, action: ActionPayload | undefined) => void;
}

/**
 * An error whose message is safe to show the user as-is. Anything else that
 * is thrown while sending (network failures, parser errors) is replaced with
 * a generic connect-failed message instead of leaking browser or JSON text.
 */
export class ChatRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatRequestError";
  }
}

const MAX_ERROR_MESSAGE_LENGTH = 300;
const MESSAGE_KEYS = ["error", "message", "detail"] as const;

/** First human-readable string in a JSON error body, e.g. `{"error":"..."}`. */
function pickMessage(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of MESSAGE_KEYS) {
      const found = pickMessage(record[key]);
      if (found) return found;
    }
  }

  return null;
}

function messageForStatus(status: number): string {
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You don't have access to do that.";
  if (status === 413) {
    return "That message is too long. Please shorten it and try again.";
  }
  if (status === 429) {
    return "Too many requests right now. Please wait a moment and try again.";
  }
  if (status >= 500) {
    return "The assistant ran into a problem. Please try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * The readable message from a failed response, or "" when there isn't one.
 * Plain text is used as-is; JSON bodies are unwrapped to their message;
 * HTML error pages and unusable JSON yield "" so callers fall back to a
 * friendly line.
 */
export async function readErrorBody(res: Response): Promise<string> {
  const raw = (await res.text().catch(() => "")).trim();
  if (!raw) return "";

  const contentType = res.headers.get("Content-Type") ?? "";

  if (contentType.includes("text/html") || raw.startsWith("<")) return "";

  if (
    contentType.includes("application/json") ||
    raw.startsWith("{") ||
    raw.startsWith("[")
  ) {
    try {
      const message = pickMessage(JSON.parse(raw) as unknown);
      return message ? message.slice(0, MAX_ERROR_MESSAGE_LENGTH) : "";
    } catch {
      return "";
    }
  }

  return raw.slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

/** Validates a chat response and returns its readable body, or throws. */
export async function ensureStreamResponse(
  res: Response,
): Promise<ReadableStream<Uint8Array>> {
  if (!res.ok) {
    const message = await readErrorBody(res);
    throw new ChatRequestError(message || messageForStatus(res.status));
  }

  if (!res.body) {
    throw new ChatRequestError(
      "The assistant sent an empty response. Please try again.",
    );
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (
    !contentType.includes("text/") &&
    !contentType.includes("application/json")
  ) {
    throw new ChatRequestError(
      "The assistant sent an unreadable response. Please try again.",
    );
  }

  return res.body;
}

/**
 * Reads the streamed assistant reply, reporting the progressively cleaned
 * text (action markers stripped). Resolves `null` if the request went stale
 * mid-stream (the reader is cancelled).
 */
export async function readChatStream(
  body: ReadableStream<Uint8Array>,
  { isStale, onProgress }: ReadHandlers,
): Promise<StreamResult | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let accumulatedText = "";
  let accumulatedAction: ActionPayload | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (isStale()) {
      await reader.cancel();
      return null;
    }

    accumulatedText += decoder.decode(value, { stream: true });

    const { cleanText, action } = parseActionPayload(accumulatedText);
    if (action) accumulatedAction = action;

    onProgress(cleanText, accumulatedAction);
  }

  accumulatedText += decoder.decode();

  return {
    text: parseActionPayload(accumulatedText).cleanText,
    action: accumulatedAction,
  };
}
