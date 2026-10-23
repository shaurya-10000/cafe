export function reportHeaderIssue(
  event: string,
  context?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  const safeContext = context ?? {};

  if (process.env.NODE_ENV === "production") {
    window.__reportError?.(`header:${event}`, safeContext);
    return;
  }

  console.warn(`[header] ${event}`, safeContext);
}
