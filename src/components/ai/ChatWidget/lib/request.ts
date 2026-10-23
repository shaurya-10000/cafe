import { CLIENT_REQUEST_ID_HEADER } from "@/lib/ai/constants";

export function createClientRequestId(requestId: number): string {
  return `chat-${requestId}-${Date.now().toString(36)}`;
}

export function buildRequestHeaders(clientRequestId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    [CLIENT_REQUEST_ID_HEADER]: clientRequestId,
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function warnDev(label: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(label, error);
  }
}

export function errorDev(label: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(label, error);
  }
}