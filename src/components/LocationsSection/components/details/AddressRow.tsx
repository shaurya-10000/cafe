import { useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, MapPin } from "lucide-react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { cx } from "../../lib/cx";
import { getIconSwapMotion } from "../../lib/motion";
import { FIELD_VALUE_CLASSES, FOCUS_RING_CLASSES } from "../../styles";
import { FieldLabel, InfoRow } from "./InfoRow";

interface AddressRowProps {
  address: string;
}

export function AddressRow({ address }: AddressRowProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { status, copy } = useCopyToClipboard();
  const copied = status === "copied";
  const iconMotion = getIconSwapMotion(shouldReduceMotion);

  const handleCopy = useCallback(() => {
    void copy(address);
  }, [copy, address]);

  return (
    <InfoRow icon={MapPin}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <FieldLabel>Location</FieldLabel>

          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Address copied" : "Copy address"}
            className={cx(
              "relative rounded p-1 text-zinc-400 transition-colors hover:text-cafe-accent",
              FOCUS_RING_CLASSES,
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span key="check" {...iconMotion}>
                  <Check
                    size={12}
                    className="text-green-500"
                    aria-hidden="true"
                  />
                </motion.span>
              ) : (
                <motion.span key="copy" {...iconMotion}>
                  <Copy size={12} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <p className={cx("break-words", FIELD_VALUE_CLASSES)}>{address}</p>

        <p role="status" aria-live="polite" className="sr-only">
          {copied
            ? "Address copied to clipboard."
            : status === "error"
              ? "Unable to copy address."
              : ""}
        </p>
      </div>
    </InfoRow>
  );
}
