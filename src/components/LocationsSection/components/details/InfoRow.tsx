import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../../lib/cx";
import { CARD_CLASSES, FIELD_LABEL_CLASSES } from "../../styles";

interface InfoRowProps {
  icon: LucideIcon;
  children: ReactNode;
}

/** Icon tile + content, shared by the address, hours and phone rows. */
export function InfoRow({ icon: Icon, children }: InfoRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div aria-hidden="true" className={cx(CARD_CLASSES, "rounded-2xl p-3")}>
        <Icon className="text-cafe-accent" size={20} />
      </div>
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <p className={FIELD_LABEL_CLASSES}>{children}</p>;
}
