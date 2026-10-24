import { memo, useCallback, useMemo } from "react";
import { Copy, RotateCcw, Volume2 } from "lucide-react";

import type { Message } from "@/components/ai/types";
import { cn } from "@/lib/utils";
import type { ActionPayload } from "@/types/action";

import { ActionCard } from "./ActionCard";
import { BotAvatar } from "./BotAvatar";
import { MarkdownMessage } from "./MarkdownMessage";
import { MessageMenu, type MessageMenuAction } from "./MessageMenu";

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

  const menuActions = useMemo<readonly MessageMenuAction[]>(() => {
    if (!text) return [];

    const items: MessageMenuAction[] = [
      { id: "copy", label: "Copy", icon: Copy, onSelect: handleCopy },
    ];

    if (isUser) {
      if (canRetry) {
        items.push({ id: "retry", label: "Retry", icon: RotateCcw, onSelect: handleRetry });
      }
    } else {
      items.push({
        id: "speak",
        label: isSpeaking ? "Stop listening" : "Listen",
        icon: Volume2,
        onSelect: handleSpeak,
      });
    }

    return items;
  }, [text, isUser, canRetry, isSpeaking, handleCopy, handleSpeak, handleRetry]);

  // An assistant bubble with nothing in it yet (stream not started) renders nothing.
  if (!text && !action && !isUser) return null;

  const menu =
    menuActions.length > 0 ? (
      <MessageMenu actions={menuActions} confirmed={isCopied} className="mt-0.5" />
    ) : null;

  return (
    <div
      className={cn(
        "group flex items-start gap-2 sm:gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <BotAvatar className="mt-0.5" />}

      {isUser && menu}

      <div className="relative min-w-0 max-w-[88%] space-y-2 sm:max-w-[85%]">
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
      </div>

      {!isUser && menu}
    </div>
  );
});
