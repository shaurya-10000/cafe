import { ChevronLeft, Menu } from "lucide-react";

import { DASHBOARD_NAV_ID } from "../constants";
import { BACK_BUTTON_CLASS, HEADER_CLASS, MENU_BUTTON_CLASS } from "../styles";
import type { DashboardTab } from "../types";

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  isSidebarOpen: boolean;
  onOpenMenu: () => void;
  onBackToCafe: () => void;
}

export function DashboardHeader({
  activeTab,
  isSidebarOpen,
  onOpenMenu,
  onBackToCafe,
}: DashboardHeaderProps) {
  return (
    <header className={HEADER_CLASS}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          aria-expanded={isSidebarOpen}
          aria-controls={DASHBOARD_NAV_ID}
          className={MENU_BUTTON_CLASS}
        >
          <Menu size={20} strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
            Customer Portal
          </span>
          <span className="text-[10px] font-bold uppercase text-gray-500">
            {activeTab} node active
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onBackToCafe}
        className={BACK_BUTTON_CLASS}
      >
        <ChevronLeft
          size={14}
          aria-hidden="true"
          className="transition-transform group-hover:-translate-x-0.5"
        />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Back to Cafe
        </span>
      </button>
    </header>
  );
}