import { memo, useCallback } from "react";
import { Bot } from "lucide-react";

import type { Message } from "@/components/ai/types";
import { cn } from "@/lib/utils";
import type { ActionPayload } from "@/types/action";

import { ActionCard } from "./ActionCard";
import { MarkdownMessage } from "./MarkdownMessage";
import { MessageToolbar } from "./MessageToolbar";

interface ChatMessageItemProps {
  readonly message: Message;
  readonly accentGradientClassName: string;
  readonly isSpeaking: boolean;
  readonly isCopied: boolean;
  readonly onCopy: (messageId: string, text: string) => void;
  readonly onSpeak: (messageId: string, text: string) => void;
  readonly onExecuteAction: (action: ActionPayload) => void;
}

export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  accentGradientClassName,
  isSpeaking,
  isCopied,
  onCopy,
  onSpeak,
  onExecuteAction,
}: ChatMessageItemProps) {
  const { id, text, action } = message;
  const isUser = message.role === "user";

  const handleCopy = useCallback(() => onCopy(id, text), [id, text, onCopy]);
  const handleSpeak = useCallback(() => onSpeak(id, text), [id, text, onSpeak]);
  const handleExecute = useCallback(() => {
    if (action) onExecuteAction(action);
  }, [action, onExecuteAction]);

  // An assistant bubble with nothing in it yet (stream not started) renders nothing.
  if (!text && !action && !isUser) return null;

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cafe-accent/20 bg-cafe-accent/10 text-cafe-accent">
          <Bot size={14} aria-hidden="true" />
        </div>
      )}

      <div className="group relative min-w-0 max-w-[88%] space-y-2 sm:max-w-[85%]">
        <div
          className={cn(
            "break-words p-3 text-[13px] leading-relaxed sm:p-4 sm:text-xs",
            isUser
              ? cn(
                  accentGradientClassName,
                  "rounded-2xl rounded-tr-none font-medium text-white shadow-md",
                )
              : cn(
                  "rounded-2xl rounded-tl-none border border-cafe-border",
                  "bg-cafe-card text-cafe-fg shadow-sm",
                ),
          )}
        >
          <MarkdownMessage text={text} />
        </div>

        {!isUser && action && (
          <ActionCard
            action={action}
            accentGradientClassName={accentGradientClassName}
            onExecute={handleExecute}
          />
        )}

        {!isUser && text && (
          <MessageToolbar
            isCopied={isCopied}
            isSpeaking={isSpeaking}
            onCopy={handleCopy}
            onSpeak={handleSpeak}
          />
        )}
      </div>
    </div>
  );
});
