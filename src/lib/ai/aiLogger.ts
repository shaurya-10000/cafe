import { createHash, randomUUID } from "crypto";

export type AiSurface = "customer" | "admin" | "title";
export type AiOutcome = "ok" | "stream_error" | "rate_limited" | "upstream_error" | "unauthenticated" | "validation_error";

export interface AiRequestLog {
  requestId: string;
  surface: AiSurface;
  userId: string;
  model: string;
  promptChars: number;
  responseChars: number;
  latencyMs: number;
  actionType?: string;
  outcome: AiOutcome;
  at: string;
}

export interface AiRequestContext {
  surface: AiSurface;
  userId: string;
  model: string;
  requestId?: string;
}

export interface AiFinishPayload {
  promptChars: number;
  responseChars: number;
  actionType?: string;
  outcome: AiOutcome;
}

export type AiLogSink = (line: AiRequestLog) => void;

function isLoggingEnabled(): boolean {
  return process.env.AI_LOG === "1";
}

const MAX_REQUEST_ID_LENGTH = 128;
const REQUEST_ID_ALLOWED_CHARS = /[^A-Za-z0-9_.:-]/g;

export function hashGuestIdentifier(ip: string | null | undefined): string {
  const salt = process.env.AI_LOG_IP_SALT ?? "ai-log-default-salt";
  const input = `${salt}:${ip ?? "unknown"}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}

export function newAiRequestId(): string {
  return `ai-${randomUUID().slice(0, 8)}`;
}

function sanitizeRequestId(raw: string | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const stripped = raw.trim().replace(REQUEST_ID_ALLOWED_CHARS, "");
  if (!stripped) return undefined;
  return stripped.slice(0, MAX_REQUEST_ID_LENGTH);
}

function defaultSink(line: AiRequestLog): void {
  try {
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify({ tag: "ai_request", ...line }));
    } else {
      console.log("[ai_request]", line);
    }
  } catch {}
}

let currentSink: AiLogSink = defaultSink;

export function setAiLogSink(sink: AiLogSink | null): AiLogSink {
  const previous = currentSink;
  currentSink = sink === null ? defaultSink : sink;
  return previous;
}

export function getAiLogSink(): AiLogSink {
  return currentSink;
}

function emit(line: AiRequestLog): void {
  if (!isLoggingEnabled()) return;
  try {
    currentSink(line);
  } catch {}
}

export interface AiRequestHandle {
  requestId: string;
  finish: (payload?: Partial<AiFinishPayload>) => void;
}

export function startAiRequest(ctx: AiRequestContext): AiRequestHandle {
  const requestId = sanitizeRequestId(ctx.requestId) ?? newAiRequestId();
  const startedAt = Date.now();
  let emitted = false;

  return {
    requestId,
    finish(payload) {
      if (emitted) return;
      emitted = true;

      const line: AiRequestLog = {
        requestId,
        surface: ctx.surface,
        userId: ctx.userId,
        model: ctx.model,
        promptChars: payload?.promptChars ?? 0,
        responseChars: payload?.responseChars ?? 0,
        latencyMs: Date.now() - startedAt,
        actionType: payload?.actionType,
        outcome: payload?.outcome ?? "upstream_error",
        at: new Date().toISOString(),
      };

      emit(line);
    },
  };
}

export function extractActionTypeForLog(text: string): string | undefined {
  const match = /\[ACTION_DATA:([\s\S]*?)\]/.exec(text);
  if (!match) return undefined;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    if (parsed && typeof parsed === "object" && "type" in parsed && typeof (parsed as { type: unknown }).type === "string") {
      return (parsed as { type: string }).type;
    }
  } catch {}
  return undefined;
}
