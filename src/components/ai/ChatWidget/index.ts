export { default } from "./ChatWidget";
export { default as ChatWidget } from "./ChatWidget";

// Re-exported so existing `import { Message, ... } from ".../ChatWidget"`
// call sites keep working.
export type { ChatWidgetProps, Message, SuggestedPrompt } from "./types";