import { memo } from "react";

import Link from "next/link";

import { ChevronLeft, Menu } from "lucide-react";

import { HOME_PATH, SIDEBAR_ID, TAB_LABELS } from "../constants";
import type { AdminTab } from "../types";

interface AdminHeaderProps {
  activeTab: AdminTab;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

export const AdminHeader = memo(function AdminHeader({
  activeTab,
  isSidebarOpen,
  onOpenSidebar,
}: AdminHeaderProps) {
  return (
    <header className="z-10 flex h-24 shrink-0 items-center justify-between border-b border-cafe-border bg-cafe-bg/80 px-6 backdrop-blur-xl md:px-12">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={isSidebarOpen}
          aria-controls={SIDEBAR_ID}
          onClick={onOpenSidebar}
          className="rounded-2xl border border-cafe-border bg-cafe-fg/5 p-3 text-cafe-fg transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
        >
          <Menu size={20} strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cafe-accent">
            Control Center
          </span>

          <span className="text-[10px] font-bold uppercase text-gray-500">
            {TAB_LABELS[activeTab]} module active
          </span>
        </div>
      </div>

      <Link
        href={HOME_PATH}
        prefetch={false}
        className="group flex items-center gap-2 rounded-full bg-cafe-fg px-6 py-2.5 text-cafe-bg shadow-xl shadow-cafe-fg/5 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2"
      >
        <ChevronLeft
          size={14}
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-0.5"
        />

        <span className="text-[10px] font-black uppercase tracking-widest">
          Exit Dashboard
        </span>
      </Link>
    </header>
  );
});
