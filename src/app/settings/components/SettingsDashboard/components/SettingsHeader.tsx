import type { RefObject } from "react";
import Link from "next/link";
import { ChevronLeft, Menu } from "lucide-react";

interface SettingsHeaderProps {
  readonly sidebarId: string;
  readonly isSidebarOpen: boolean;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly activeTabLabel: string;
  readonly onOpenSidebar: () => void;
}

export function SettingsHeader({
  sidebarId,
  isSidebarOpen,
  triggerRef,
  activeTabLabel,
  onOpenSidebar,
}: SettingsHeaderProps) {
  return (
    <header className="z-10 flex h-24 shrink-0 items-center justify-between border-b border-cafe-border bg-cafe-bg px-6 md:px-12">
      <div className="flex items-center gap-4">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={isSidebarOpen}
          aria-controls={sidebarId}
          onClick={onOpenSidebar}
          className="rounded-2xl border border-cafe-border bg-zinc-100 p-3 text-zinc-900 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:bg-white/5 dark:text-zinc-100"
        >
          <Menu size={20} strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cafe-accent">
            Settings Console
          </span>
          <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
            {activeTabLabel} instance
          </span>
        </div>
      </div>

      <Link
        href="/"
        className="group flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-white shadow-xl shadow-zinc-900/10 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-black"
      >
        <ChevronLeft
          size={14}
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-0.5"
        />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Back to Cafe
        </span>
      </Link>
    </header>
  );
}
