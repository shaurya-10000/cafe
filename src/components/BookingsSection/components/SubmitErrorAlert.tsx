import { memo } from "react";

import { AlertCircle } from "lucide-react";

interface SubmitErrorAlertProps {
  message: string;
}

export const SubmitErrorAlert = memo(function SubmitErrorAlert({
  message,
}: SubmitErrorAlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-red-600 dark:text-red-400"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />

      <p className="text-xs font-bold">{message}</p>
    </div>
  );
});
