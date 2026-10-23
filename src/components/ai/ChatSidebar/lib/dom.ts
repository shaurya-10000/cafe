/**
 * Scoped DOM lookups. A ref map threaded through every row would defeat the
 * memoization on the rows for no benefit: the sidebar holds a handful of
 * rows, so a scoped query is cheap and simpler to reason about.
 *
 * `CSS.escape` guards against ids containing characters that would break
 * the attribute selector. Ids are uuids in practice, but the escape is free
 * insurance if the storage layer ever changes.
 */
export function findSessionButton(
  container: Element,
  sessionId: string,
): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(
    `[data-session-id="${CSS.escape(sessionId)}"]`,
  );
}

export function findMenuTrigger(
  container: Element,
  sessionId: string,
): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(
    `[data-session-menu-trigger="${CSS.escape(sessionId)}"]`,
  );
}