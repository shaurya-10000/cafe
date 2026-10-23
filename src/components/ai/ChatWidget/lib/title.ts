import { MAX_GENERATED_TITLE_LENGTH } from "../constants";
import { buildRequestHeaders } from "./request";

interface FetchChatTitleOptions {
  endpoint: string;
  firstMessage: string;
  clientRequestId: string;
  signal: AbortSignal;
}

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