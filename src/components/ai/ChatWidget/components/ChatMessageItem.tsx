import { memo, useCallback, useMemo } from "react";
import { Copy, RotateCcw } from "lucide-react";

import type { Message } from "@/components/ai/types";
import { cn } from "@/lib/utils";
import type { ActionPayload } from "@/types/action";

import { ActionCard } from "./ActionCard";
import { BotAvatar } from "./BotAvatar";
import { MarkdownMessage } from "./MarkdownMessage";
import { MessageMenu, type MessageMenuAction } from "./MessageMenu";
import { MessageToolbar } from "./MessageToolbar";

interface ChatMessageItemProps {
  readonly message: Message;
  readonly accentGradientClassName: string;
  readonly isSpeaking: boolean;
  readonly isCopied: boolean;
  /** True only for the latest user message, and only while retrying is possible. */
  readonly canRetry: boolean;
  readonly onCopy: (messageId: string, text: string) => void;
  readonly onSpeak: (messageId: string, text: string) => void;
  readonly onRetry: (text: string) => void;
  readonly onExecuteAction: (action: ActionPayload) => void;
}

export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  accentGradientClassName,
  isSpeaking,
  isCopied,
  canRetry,
  onCopy,
  onSpeak,
  onRetry,
  onExecuteAction,
}: ChatMessageItemProps) {
  const { id, text, action } = message;
  const isUser = message.role === "user";

  const handleCopy = useCallback(() => onCopy(id, text), [id, text, onCopy]);
  const handleSpeak = useCallback(() => onSpeak(id, text), [id, text, onSpeak]);
  const handleRetry = useCallback(() => onRetry(text), [text, onRetry]);
  const handleExecute = useCallback(() => {
    if (action) onExecuteAction(action);
  }, [action, onExecuteAction]);

  // Only the user's own prompts get the dots menu; replies keep the toolbar.
  const promptActions = useMemo<readonly MessageMenuAction[]>(() => {
    if (!isUser || !text) return [];

    const items: MessageMenuAction[] = [
      { id: "copy", label: "Copy", icon: Copy, onSelect: handleCopy },
    ];
    if (canRetry) {
      items.push({
        id: "retry",
        label: "Retry",
        icon: RotateCcw,
        onSelect: handleRetry,
      });
    }
    return items;
  }, [isUser, text, canRetry, handleCopy, handleRetry]);

  // An assistant bubble with nothing in it yet (stream not started) renders nothing.
  if (!text && !action && !isUser) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 sm:gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <BotAvatar className="mt-0.5" />}

      {promptActions.length > 0 && (
        <MessageMenu
          actions={promptActions}
          confirmed={isCopied}
          className="mt-0.5"
        />
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
