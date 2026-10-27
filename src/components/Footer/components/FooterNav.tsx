import type { FooterNavColumn } from "../types";
import { FooterLink } from "./links/FooterLink";

interface FooterNavProps {
  readonly columns: readonly FooterNavColumn[];
}

export function FooterNav({ columns }: FooterNavProps) {
  return (
    <nav
      aria-label="Footer navigation"
      className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3"
    >
      {columns.map((column) => (
        <div key={column.heading}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cafe-fg/70">
            {column.heading}
          </h3>

          <ul className="mt-5 space-y-3.5">
            {column.links.map((link) => (
              <li key={`${column.heading}-${link.label}-${link.href}`}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
