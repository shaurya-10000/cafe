import { CheckCircle2, Copy } from "lucide-react";

import { COPY_BUTTON_CLASS } from "../styles";

interface CopyButtonProps {
  code: string;
  justCopied: boolean;
  onCopy: () => void;
}

export function CopyButton({ code, justCopied, onCopy }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={
        justCopied ? `Coupon code ${code} copied` : `Copy coupon code ${code}`
      }
      className={COPY_BUTTON_CLASS}
    >
      {justCopied ? (
        <>
          <CheckCircle2 size={12} aria-hidden="true" /> Copied!
        </>
      ) : (
        <>
          <Copy size={12} aria-hidden="true" /> Copy Code
        </>
      )}
    </button>
  );
}