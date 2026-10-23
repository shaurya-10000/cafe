import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/core/rateLimit";
import { startAiRequest } from "@/lib/ai/aiLogger";

/* -------------------------------------------------------------------------- */
/* Env                                                                        */
/* -------------------------------------------------------------------------- */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_FIRST_MESSAGE_LENGTH = 2_000;
const FALLBACK_TITLE = "New Conversation";
const MAX_TITLE_LENGTH = 120;
const UPSTREAM_TOTAL_TIMEOUT_MS = 8_000;
const CLIENT_REQUEST_ID_HEADER = "x-cafe-request-id";
const CLIENT_REQUEST_ID_MAX_LENGTH = 128;
const UPSTREAM_MAX_ATTEMPTS = 2;
const UPSTREAM_RETRY_BASE_DELAY_MS = 400;
const UPSTREAM_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 503]);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function readClientRequestId(req: Request): string | undefined {
  const raw = req.headers.get(CLIENT_REQUEST_ID_HEADER);
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, CLIENT_REQUEST_ID_MAX_LENGTH);
}

function getUpstreamStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybeStatus = (err as { status?: unknown }).status;
  if (typeof maybeStatus === "number" && Number.isFinite(maybeStatus)) {
    return maybeStatus;
  }
  const maybeNested = (err as { error?: { code?: unknown } }).error;
  if (
    maybeNested &&
    typeof maybeNested === "object" &&
    typeof maybeNested.code === "number" &&
    Number.isFinite(maybeNested.code)
  ) {
    return maybeNested.code;
  }
  return undefined;
}

function isRetryableUpstreamError(err: unknown): boolean {
  const status = getUpstreamStatus(err);
  return status !== undefined && UPSTREAM_RETRYABLE_STATUSES.has(status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withUpstreamRetry<T>(
  fn: () => Promise<T>,
  deadline: number,
  maxAttempts: number = UPSTREAM_MAX_ATTEMPTS,
  baseDelayMs: number = UPSTREAM_RETRY_BASE_DELAY_MS,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt || !isRetryableUpstreamError(err)) {
        throw err;
      }
      const backoff = baseDelayMs * 2 ** attempt;
      if (Date.now() + backoff > deadline) {
        throw err;
      }
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function sanitizeTitle(raw: string): string {
  if (!raw) return "";
  const withoutPrefix = raw.replace(/^\s*title\s*[:\-–—]\s*/i, "");
  const withoutQuotes = withoutPrefix
    .replace(/^["'`\u2018\u2019\u201C\u201D]+/, "")
    .replace(/["'`\u2018\u2019\u201C\u201D]+$/, "");
  const singleLine = withoutQuotes.replace(/\s+/g, " ").trim();
  return singleLine.slice(0, MAX_TITLE_LENGTH);
}

function logEarlyExit(
  logUserId: string,
  outcome:
    | "unauthenticated"
    | "rate_limited"
    | "validation_error"
    | "upstream_error",
  clientRequestId: string | undefined,
): void {
  startAiRequest({
    surface: "title",
    userId: logUserId,
    model: GEMINI_MODEL,
    requestId: clientRequestId,
  }).finish({
    promptChars: 0,
    responseChars: 0,
    outcome,
  });
}

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const clientRequestId = readClientRequestId(req);

    const { userId } = await auth();

    if (!userId) {
      logEarlyExit("unauthenticated", "unauthenticated", clientRequestId);
      return NextResponse.json({ title: FALLBACK_TITLE }, { status: 401 });
    }

    const rl = checkRateLimit(`title:${userId}`);
    if (!rl.allowed) {
      logEarlyExit(userId, "rate_limited", clientRequestId);
      return NextResponse.json(
        { title: FALLBACK_TITLE },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        },
      );
    }

    let body: { firstMessage?: unknown };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      logEarlyExit(userId, "validation_error", clientRequestId);
      return NextResponse.json({ title: FALLBACK_TITLE }, { status: 400 });
    }

    const firstMessage = body?.firstMessage;

    if (typeof firstMessage !== "string" || firstMessage.trim().length === 0) {
      logEarlyExit(userId, "validation_error", clientRequestId);
      return NextResponse.json({ title: FALLBACK_TITLE }, { status: 400 });
    }

    if (!ai) {
      logEarlyExit(userId, "upstream_error", clientRequestId);
      return NextResponse.json({ title: FALLBACK_TITLE });
    }

    const truncated = firstMessage.slice(0, MAX_FIRST_MESSAGE_LENGTH);
    const prompt = buildTitlePrompt(truncated);

    const aiLog = startAiRequest({
      surface: "title",
      userId,
      model: GEMINI_MODEL,
      requestId: clientRequestId,
    });

    const deadline = Date.now() + UPSTREAM_TOTAL_TIMEOUT_MS;

    try {
      const response = await withUpstreamRetry(
        () =>
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: { temperature: 0.5 },
          }),
        deadline,
      );

      const raw = response.text?.trim() ?? "";
      const title = sanitizeTitle(raw) || FALLBACK_TITLE;

      aiLog.finish({
        promptChars: prompt.length,
        responseChars: raw.length,
        outcome: "ok",
      });

      return NextResponse.json({ title });
    } catch (err) {
      const isUpstreamUnavailable = isRetryableUpstreamError(err);

      if (isUpstreamUnavailable) {
        console.error(
          "[title] upstream 503/429 after retries",
          { requestId: clientRequestId },
          err,
        );
      } else {
        console.error(
          "[title] generation failed",
          { requestId: clientRequestId },
          err,
        );
      }

      aiLog.finish({
        promptChars: prompt.length,
        responseChars: 0,
        outcome: "upstream_error",
      });

      return NextResponse.json({ title: FALLBACK_TITLE });
    }
  } catch (err) {
    console.error(
      "[title] outer handler threw",
      { requestId: readClientRequestId(req) },
      err,
    );
    return NextResponse.json({ title: FALLBACK_TITLE });
  }
}

function buildTitlePrompt(firstMessage: string): string {
  return `Generate a short title for a chat, based on the user's first message.

RULES:
- Length: 2 to 4 words. No more, no fewer.
- Casing: Title Case (capitalize the first letter of each word, except "and", "or", "the", "a", "an", "of", "in", "on", "at", "to").
- Voice: describe the TOPIC, not the action. A title answers "what is this chat about?" — not "what did the user do?"
- No quotes, no punctuation, no trailing period, no emoji.
- Never use any of these words: Chat, Conversation, User, Message, Assistant, Request, Query, Inquiry, Help, Support.
- If the message is a greeting, a thank-you, or otherwise has no topic, return: ${FALLBACK_TITLE}

EXAMPLES:

  Message: "add two lattes and a croissant to my cart"
  Title: Two Lattes Croissant

  Message: "can I book a table for four on Friday at 7pm?"
  Title: Friday Table Booking

  Message: "what are your opening hours on weekends?"
  Title: Weekend Opening Hours

  Message: "show me today's revenue from the analytics tab"
  Title: Today's Revenue Report

  Message: "hi"
  Title: ${FALLBACK_TITLE}

  Message: "thanks!"
  Title: ${FALLBACK_TITLE}

User Message: "${firstMessage}"

Return ONLY the title. No explanation, no quotes, no prefix like "Title:".`;
}
