import { ShoppingBag, X } from "lucide-react";

import {
  DASHBOARD_NAV_ID,
  NAV_ITEMS,
} from "../constants";
import {
  BRAND_ICON_WRAPPER_CLASS,
  BRAND_NAME_CLASS,
  OVERLAY_CLASS,
  SIDEBAR_CLOSE_CLASS,
  buildSidebarClassName,
} from "../styles";
import type { DashboardTab, NavCounts } from "../types";
import { NavItem } from "./NavItem";

interface SidebarProps {
  isOpen: boolean;
  activeTab: DashboardTab;
  counts: NavCounts;
  onClose: () => void;
  onSelectTab: (tab: DashboardTab) => void;
}

export function Sidebar({
  isOpen,
  activeTab,
  counts,
  onClose,
  onSelectTab,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          aria-hidden="true"
          className={OVERLAY_CLASS}
        />
      )}

      <aside
        id={DASHBOARD_NAV_ID}
        aria-label="Dashboard navigation"
        aria-hidden={!isOpen}
        className={buildSidebarClassName(isOpen)}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={BRAND_ICON_WRAPPER_CLASS}>
              <ShoppingBag
                size={18}
                className="text-cafe-bg"
                aria-hidden="true"
              />
            </div>
            <span className={BRAND_NAME_CLASS}>Cafe</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={SIDEBAR_CLOSE_CLASS}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Dashboard sections"
          className="flex flex-1 flex-col gap-2"
        >
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              count={counts[item.id] ?? 0}
              focusable={isOpen}
              onSelect={() => onSelectTab(item.id)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}