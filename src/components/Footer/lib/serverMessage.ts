import { MAX_SERVER_MESSAGE_LENGTH } from "../constants";

/**
 * Server-provided text is untrusted: strip control characters, collapse
 * whitespace and reject anything empty or suspiciously long.
 */
export function sanitiseServerMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const withoutControlCharacters = value.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    "",
  );

  const trimmed = withoutControlCharacters.trim().replace(/\s+/g, " ");

  if (!trimmed || trimmed.length > MAX_SERVER_MESSAGE_LENGTH) return null;
  return trimmed;
}

function fromRecord(record: Record<string, unknown>): string | null {
  return (
    sanitiseServerMessage(record.message) ??
    sanitiseServerMessage(record.error) ??
    sanitiseServerMessage(record.detail)
  );
}

function collectFromErrorsArray(value: unknown): string | null {
  if (!Array.isArray(value)) return null;

  for (const entry of value) {
    if (typeof entry === "string") {
      const message = sanitiseServerMessage(entry);
      if (message) return message;
      continue;
    }

    if (entry && typeof entry === "object") {
      const message = fromRecord(entry as Record<string, unknown>);
      if (message) return message;
    }
  }

  return null;
}

/** Best-effort extraction of a human-readable message from an error response. */
export async function extractErrorMessage(
  response: Response,
): Promise<string | null> {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return sanitiseServerMessage(await response.text());
    }

    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return null;

    const record = body as Record<string, unknown>;

    const direct =
      sanitiseServerMessage(record.error) ??
      sanitiseServerMessage(record.message) ??
      sanitiseServerMessage(record.detail);
    if (direct) return direct;

    if (record.error && typeof record.error === "object") {
      const nested = record.error as Record<string, unknown>;
      const nestedMessage =
        sanitiseServerMessage(nested.message) ??
        sanitiseServerMessage(nested.detail);
      if (nestedMessage) return nestedMessage;
    }

    return collectFromErrorsArray(record.errors);
  } catch {
    return null;
  }
}
