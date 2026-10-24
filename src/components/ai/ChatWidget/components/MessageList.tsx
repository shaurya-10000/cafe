import type { RefObject } from "react";

import type { Message, SuggestedPrompt } from "@/components/ai/types";
import { cn } from "@/lib/utils";
import type { ActionPayload } from "@/types/action";

import { ChatMessageItem } from "./ChatMessageItem";
import { EmptyState } from "./EmptyState";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface MessageListProps {
  messages: readonly Message[] | undefined;
  loading: boolean;
  reducedMotion: boolean;
  accentGradientClassName: string;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  suggestedPrompts: readonly SuggestedPrompt[];
  promptsDisabled: boolean;
  speakingMessageId: string | null;
  copiedMessageId: string | null;
  /** Whether re-sending the latest user message is currently allowed. */
  retryEnabled: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  onSelectPrompt: (text: string) => void;
  onCopy: (messageId: string, text: string) => void;
  onSpeak: (messageId: string, text: string) => void;
  onRetry: (text: string) => void;
  onExecuteAction: (action: ActionPayload) => void;
}

function findLastUserMessageId(
  messages: readonly Message[] | undefined,
): string | null {
  if (!messages) return null;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message?.role === "user") return message.id;
  }
  return null;
}

export function MessageList({
  messages,
  loading,
  reducedMotion,
  accentGradientClassName,
  emptyStateTitle,
  emptyStateSubtitle,
  suggestedPrompts,
  promptsDisabled,
  speakingMessageId,
  copiedMessageId,
  retryEnabled,
  endRef,
  onSelectPrompt,
  onCopy,
  onSpeak,
  onRetry,
  onExecuteAction,
}: MessageListProps) {
  const isEmpty = !messages || messages.length === 0;
  const lastUserMessageId = findLastUserMessageId(messages);

  return (
    <div
      // Message menus look for this attribute to stay inside the scroll area.
      data-message-scroll=""
      className={cn(
        "min-h-0 flex-1 space-y-3 overflow-y-auto text-cafe-fg",
        "[scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,currentColor_30%,transparent)_transparent]",
        // Keep scroll gestures inside the chat instead of the page behind it.
        "overscroll-contain",
        "p-3 sm:space-y-4 sm:p-6",
      )}
    >
      {isEmpty && (
        <EmptyState
          title={emptyStateTitle}
          subtitle={emptyStateSubtitle}
          prompts={suggestedPrompts}
          accentGradientClassName={accentGradientClassName}
          promptsDisabled={promptsDisabled}
          onSelectPrompt={onSelectPrompt}
        />
      )}

      {messages?.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          accentGradientClassName={accentGradientClassName}
          isSpeaking={speakingMessageId === message.id}
          isCopied={copiedMessageId === message.id}
          canRetry={retryEnabled && message.id === lastUserMessageId}
          onCopy={onCopy}
          onSpeak={onSpeak}
          onRetry={onRetry}
          onExecuteAction={onExecuteAction}
        />
      ))}

      {loading && <ThinkingIndicator reducedMotion={reducedMotion} />}

      <div ref={endRef} />
    </div>
  );
}
