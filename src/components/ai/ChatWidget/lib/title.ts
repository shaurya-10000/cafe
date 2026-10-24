import { MAX_GENERATED_TITLE_LENGTH } from "../constants";
import { buildRequestHeaders } from "./request";

interface FetchChatTitleOptions {
  endpoint: string;
  firstMessage: string;
  clientRequestId: string;
  signal: AbortSignal;
}

/** What the title route returns when it has nothing real to say. */
const SERVER_PLACEHOLDER = "new conversation";

const FALLBACK_MAX_WORDS = 4;

/** Messages with no topic of their own; they keep the default title. */
const NO_TOPIC_PATTERN =
  /^(hi+|hello|hey|yo|thanks?|thank you|thx|ok(ay)?|test)[\s!.,?]*$/i;

/** Lower-cased in Title Case unless they start the title. */
const SMALL_WORDS: ReadonlySet<string> = new Set([
  "a",
  "an",
  "and",
  "or",
  "the",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
]);

/** A short generated title for a new chat, or null if none came back. */
export async function fetchChatTitle({
  endpoint,
  firstMessage,
  clientRequestId,
  signal,
}: FetchChatTitleOptions): Promise<string | null> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: buildRequestHeaders(clientRequestId),
    body: JSON.stringify({ firstMessage }),
    signal,
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { title?: string };
  const title = data.title?.trim().slice(0, MAX_GENERATED_TITLE_LENGTH);

  return title ? title : null;
}

/**
 * A title built from the first few words of the message. Used when the
 * server can't supply one: signed-out users (the route requires auth),
 * rate limits, or upstream failures. Returns null for messages with no topic.
 */
export function deriveFallbackTitle(message: string): string | null {
  const cleaned = message
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || NO_TOPIC_PATTERN.test(cleaned)) return null;

  const title = cleaned
    .split(" ")
    .slice(0, FALLBACK_MAX_WORDS)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .slice(0, MAX_GENERATED_TITLE_LENGTH)
    .trim();

  return title || null;
}

/**
 * The title for a new chat: the server's if it produced a real one,
 * otherwise a local fallback. Aborts still propagate to the caller.
 */
export async function resolveChatTitle(
  options: FetchChatTitleOptions,
): Promise<string | null> {
  let generated: string | null = null;

  try {
    generated = await fetchChatTitle(options);
  } catch (error) {
    if (options.signal.aborted) throw error;
    // Network failure: fall through to the local title.
  }

  if (generated && generated.toLowerCase() !== SERVER_PLACEHOLDER) {
    return generated;
  }

  return deriveFallbackTitle(options.firstMessage);
}
