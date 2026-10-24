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
  endRef: RefObject<HTMLDivElement | null>;
  onSelectPrompt: (text: string) => void;
  onCopy: (messageId: string, text: string) => void;
  onSpeak: (messageId: string, text: string) => void;
  onExecuteAction: (action: ActionPayload) => void;
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
  endRef,
  onSelectPrompt,
  onCopy,
  onSpeak,
  onExecuteAction,
}: MessageListProps) {
  const isEmpty = !messages || messages.length === 0;

  return (
    <div
      className={cn(
        "sidebar-scroll min-h-0 flex-1 space-y-3 overflow-y-auto",
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
          onCopy={onCopy}
          onSpeak={onSpeak}
          onExecuteAction={onExecuteAction}
        />
      ))}

      {loading && <ThinkingIndicator reducedMotion={reducedMotion} />}

      <div ref={endRef} />
    </div>
  );
}
