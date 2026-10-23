import type { ChatSession } from "@/components/ai/types";

export interface ChatSidebarProps {
  readonly sessions: readonly ChatSession[];
  readonly activeChatId: string | null;
  readonly editingChatId: string | null;
  readonly editingTitle: string;
  readonly onSelectChat: (id: string) => void;
  readonly onChangeTitle: (title: string) => void;
  readonly onCommitRename: () => void;
  readonly onCancelRename: () => void;
  readonly onOpenMenu: (
    id: string,
    anchorRect: DOMRect,
    trigger: HTMLButtonElement,
  ) => void;
}