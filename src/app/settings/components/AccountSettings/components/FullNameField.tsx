import { useId } from "react";
import { FULL_NAME_MAX_LENGTH } from "../constants";

interface FullNameFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled: boolean;
  readonly isValid: boolean;
  readonly showBlankError: boolean;
}

export function FullNameField({
  value,
  onChange,
  disabled,
  isValid,
  showBlankError,
}: FullNameFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"
      >
        Full Name
      </label>

      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={FULL_NAME_MAX_LENGTH}
        disabled={disabled}
        aria-invalid={!isValid}
        aria-describedby={showBlankError ? errorId : undefined}
        autoComplete="name"
        className="w-full rounded-2xl border border-zinc-200 bg-[#FAF9F6] px-6 py-4 text-sm font-bold text-zinc-900 outline-none transition-all focus:ring-2 focus:ring-cafe-accent disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />

      {showBlankError && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-400">
          Name can&apos;t be blank.
        </p>
      )}
    </div>
  );
}
