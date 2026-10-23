"use client";

import { memo } from "react";

import { SessionRow } from "./components";
import { HEADING_ID } from "./constants";
import { useSessionKeyboard } from "./hooks";
import {
  ASIDE_CLASS,
  HEADING_CLASS,
  LIST_CLASS,
  SCROLL_AREA_CLASS,
} from "./styles";
import type { ChatSidebarProps } from "./types";

/**
 * Chat history sidebar.
 *
 * The session list is a `listbox` of `option`s rather than a plain list or a
 * stack of buttons: the active chat is a *selection*, and the listbox role
 * is what gives it an `aria-selected` announcement ("item 3 of 5, selected")
 * and the arrow-key interaction pattern screen-reader users already know.
 * Key handling lives in `useSessionKeyboard`; rename behavior in
 * `RenameInput`.
 *
 * The `sidebar-scroll` class (hidden scrollbar) is defined by the widget
 * that hosts this sidebar.
 */
const ChatSidebar = memo(function ChatSidebar({
  sessions,
  activeChatId,
  editingChatId,
  editingTitle,
  onSelectChat,
  onChangeTitle,
  onCommitRename,
  onCancelRename,
  onOpenMenu,
}: ChatSidebarProps) {
  const handleRowKeyDown = useSessionKeyboard({ sessions, onOpenMenu });

  return (
    <aside className={ASIDE_CLASS}>
      <div className={SCROLL_AREA_CLASS}>
        <span id={HEADING_ID} className={HEADING_CLASS}>
          History
        </span>

        <ul
          role="listbox"
          aria-labelledby={HEADING_ID}
          data-chat-session-list
          className={LIST_CLASS}
        >
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isActive={activeChatId === session.id}
              isEditing={editingChatId === session.id}
              editingTitle={editingTitle}
              onSelect={onSelectChat}
              onChangeTitle={onChangeTitle}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onOpenMenu={onOpenMenu}
              onRowKeyDown={handleRowKeyDown}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
});

ChatSidebar.displayName = "ChatSidebar";

export default ChatSidebar;