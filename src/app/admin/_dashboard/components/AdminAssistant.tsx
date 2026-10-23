import { memo } from "react";

import ChatWidget from "@/components/ai/ChatWidget";

import { ADMIN_SUGGESTED_PROMPTS, ASSISTANT_CONFIG } from "../constants";

interface AdminAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAssistant = memo(function AdminAssistant({
  isOpen,
  onClose,
}: AdminAssistantProps) {
  return (
    <ChatWidget
      {...ASSISTANT_CONFIG}
      isOpen={isOpen}
      onClose={onClose}
      suggestedPrompts={ADMIN_SUGGESTED_PROMPTS}
    />
  );
});
