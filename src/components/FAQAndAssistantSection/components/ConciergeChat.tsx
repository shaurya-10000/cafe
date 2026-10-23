import { useMemo } from "react";
import ChatWidget from "../../ai/ChatWidget";
import { CHAT_CONFIG } from "../constants";
import type { SuggestedPrompt } from "../types";

interface ConciergeChatProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly suggestedPrompts: readonly SuggestedPrompt[];
}

export function ConciergeChat({
  isOpen,
  onClose,
  suggestedPrompts,
}: ConciergeChatProps) {
  // ChatWidget may declare `suggestedPrompts` as a mutable array. Copy once
  // per identity change (not once per render) so memoization inside
  // ChatWidget is not defeated.
  const prompts = useMemo(() => [...suggestedPrompts], [suggestedPrompts]);

  return (
    <ChatWidget
      {...CHAT_CONFIG}
      isOpen={isOpen}
      onClose={onClose}
      suggestedPrompts={prompts}
    />
  );
}
