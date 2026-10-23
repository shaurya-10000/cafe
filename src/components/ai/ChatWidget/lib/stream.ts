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

/** Validates a chat response and returns its readable body, or throws. */
export async function ensureStreamResponse(
  res: Response,
): Promise<ReadableStream<Uint8Array>> {
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(bodyText.trim() || `Request failed: ${res.status}`);
  }

  if (!res.body) {
    throw new Error("No readable stream returned.");
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (
    !contentType.includes("text/") &&
    !contentType.includes("application/json")
  ) {
    throw new Error("Unsupported response content type.");
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