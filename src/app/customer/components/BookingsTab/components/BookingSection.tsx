import type { ReactNode } from "react";

import { LIST_CLASS } from "../styles";

interface BookingSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

export function BookingSection({ title, count, children }: BookingSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
        {title}
        <span className="rounded-full bg-cafe-fg/5 px-2 py-0.5 text-[9px]">
          {count}
        </span>
      </h3>

      <ul className={LIST_CLASS}>{children}</ul>
    </section>
  );
}