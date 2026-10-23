import { extractErrorMessage } from "../lib/serverMessage";

export type SubscribeResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string | null };

interface SubscribeParams {
  readonly endpoint: string;
  readonly email: string;
  readonly signal: AbortSignal;
}

/**
 * POSTs the email. Resolves with a result for any HTTP response; rejects only
 * on network failure or abort so callers can tell the two apart.
 */
export async function subscribeToNewsletter({
  endpoint,
  email,
  signal,
}: SubscribeParams): Promise<SubscribeResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    signal,
  });

  if (!response.ok) {
    return { ok: false, message: await extractErrorMessage(response) };
  }

  return { ok: true };
}
