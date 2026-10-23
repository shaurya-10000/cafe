import { RENAME_INPUT_CLASS, RENAME_WRAPPER_CLASS } from "../styles";

interface RenameInputProps {
  sessionTitle: string;
  value: string;
  onChange: (title: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

/**
 * Inline rename field.
 *
 *   Enter    commit
 *   Escape   cancel
 *   Tab      commit, then focus moves on naturally
 *   blur     cancel: clicking away abandons the edit (the Finder / VS Code /
 *            Linear convention), so an accidental click can't silently save
 *
 * Tab does NOT preventDefault: `onCommit` unmounts this input synchronously,
 * so React removes it before the browser dispatches blur, and the blur
 * handler never fires for the Tab case (no double-commit).
 */
export function RenameInput({
  sessionTitle,
  value,
  onChange,
  onCommit,
  onCancel,
}: RenameInputProps) {
  return (
    <div className={RENAME_WRAPPER_CLASS}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          } else if (event.key === "Tab") {
            onCommit();
          }
        }}
        onBlur={onCancel}
        autoFocus
        aria-label={`Rename ${sessionTitle}`}
        className={RENAME_INPUT_CLASS}
      />
    </div>
  );
}