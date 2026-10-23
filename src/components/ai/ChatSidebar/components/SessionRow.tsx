import { memo } from "react";
import type { KeyboardEvent } from "react";
import { MessageSquare, MoreVertical, Pin } from "lucide-react";

import type { ChatSession } from "@/components/ai/types";

import {
  MENU_TRIGGER_CLASS,
  SELECT_BUTTON_CLASS,
  buildRowClass,
} from "../styles";
import { RenameInput } from "./RenameInput";

interface SessionRowProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  onSelect: (id: string) => void;
  onChangeTitle: (title: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onOpenMenu: (
    id: string,
    anchorRect: DOMRect,
    trigger: HTMLButtonElement,
  ) => void;
  onRowKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    sessionId: string,
  ) => void;
}

export const SessionRow = memo(function SessionRow({
  session,
  isActive,
  isEditing,
  editingTitle,
  onSelect,
  onChangeTitle,
  onCommitRename,
  onCancelRename,
  onOpenMenu,
  onRowKeyDown,
}: SessionRowProps) {
  return (
    <li className={buildRowClass(isActive)}>
      {isEditing ? (
        <RenameInput
          sessionTitle={session.title}
          value={editingTitle}
          onChange={onChangeTitle}
          onCommit={onCommitRename}
          onCancel={onCancelRename}
        />
      ) : (
        <button
          type="button"
          onClick={() => onSelect(session.id)}
          onKeyDown={(event) => onRowKeyDown(event, session.id)}
          role="option"
          aria-selected={isActive}
          data-session-id={session.id}
          className={SELECT_BUTTON_CLASS}
        >
          {session.isPinned ? (
            <Pin
              size={12}
              className="shrink-0 fill-cafe-accent text-cafe-accent"
              aria-hidden="true"
            />
          ) : (
            <MessageSquare
              size={12}
              className="shrink-0 text-cafe-fg/40"
              aria-hidden="true"
            />
          )}
          <span className="truncate">{session.title}</span>
        </button>
      )}

      {!isEditing && (
        <button
          type="button"
          aria-label={`Chat actions for ${session.title}`}
          aria-haspopup="menu"
          data-session-menu-trigger={session.id}
          onClick={(event) => {
            event.stopPropagation();
            const trigger = event.currentTarget;
            onOpenMenu(session.id, trigger.getBoundingClientRect(), trigger);
          }}
          className={MENU_TRIGGER_CLASS}
        >
          <MoreVertical size={13} aria-hidden="true" />
        </button>
      )}
    </li>
  );
});