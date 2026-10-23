/**
 * Server actions in `admin/actions.ts` report business failures as
 * `{ success: false, error }` instead of throwing. Returns that error
 * message, or `null` when the result is not a failure.
 */
export function getActionFailure(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;

  const candidate = result as { success?: unknown; error?: unknown };

  if (candidate.success !== false) return null;

  return typeof candidate.error === "string" && candidate.error
    ? candidate.error
    : "Something went wrong.";
}
