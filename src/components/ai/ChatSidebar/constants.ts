export const HEADING_ID = "chat-history-heading";

/**
 * Selector for the `data-chat-session-list` attribute on the <ul>. Keyboard
 * handlers scope their DOM queries to it, so a second sidebar on the page
 * could never steal focus.
 */
export const SESSION_LIST_SELECTOR = "[data-chat-session-list]";