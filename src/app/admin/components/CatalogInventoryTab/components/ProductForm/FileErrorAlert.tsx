import { memo } from "react";

import { AlertCircle } from "lucide-react";

interface FileErrorAlertProps {
  message: string;
}

export const FileErrorAlert = memo(function FileErrorAlert({
  message,
}: FileErrorAlertProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-[10px] font-bold text-red-500">
      <AlertCircle size={14} aria-hidden="true" />

      {message}
    </div>
  );
});
