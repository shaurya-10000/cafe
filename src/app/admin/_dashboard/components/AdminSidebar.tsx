import { memo } from "react";

import { LogOut, Package, Sparkles, X } from "lucide-react";

import { NAV_ITEMS, SIDEBAR_ID, SIDEBAR_TITLE_ID } from "../constants";
import { cx } from "../lib/cx";
import type { AdminTab } from "../types";

interface AdminSidebarProps {
  isOpen: boolean;
  activeTab: AdminTab;
  isSigningOut: boolean;
  onClose: () => void;
  onSelectTab: (tab: AdminTab) => void;
  onOpenAssistant: () => void;
  onSignOut: () => void;
}

export const AdminSidebar = memo(function AdminSidebar({
  isOpen,
  activeTab,
  isSigningOut,
  onClose,
  onSelectTab,
  onOpenAssistant,
  onSignOut,
}: AdminSidebarProps) {
  // Off-screen controls must not be reachable with the keyboard.
  const tabIndex = isOpen ? 0 : -1;

  return (
    <aside
      id={SIDEBAR_ID}
      role="dialog"
      aria-modal={isOpen}
      aria-labelledby={SIDEBAR_TITLE_ID}
      aria-hidden={!isOpen}
      className={cx(
        "fixed left-0 top-0 z-[70] flex h-full w-72 shrink-0 flex-col",
        "border-r border-cafe-border bg-cafe-card p-8 backdrop-blur-xl",
        "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
      )}
    >
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-accent shadow-lg shadow-cafe-accent/20">
            <Package size={18} className="text-cafe-accent-fg" aria-hidden="true" />
          </div>

          <span
            id={SIDEBAR_TITLE_ID}
            className="text-xl font-bold uppercase italic tracking-tighter text-cafe-fg"
          >
            Cafe Admin
          </span>
        </div>

        <button
          type="button"
          aria-label="Close menu"
          tabIndex={tabIndex}
          className="text-gray-500 transition-transform duration-300 hover:rotate-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2" aria-label="Admin sections">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              tabIndex={tabIndex}
              onClick={() => onSelectTab(id)}
              className={cx(
                "flex items-center gap-3 rounded-2xl px-5 py-4",
                "text-[11px] font-black uppercase tracking-widest transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-inset",
                isActive
                  ? "bg-cafe-accent text-cafe-accent-fg shadow-lg shadow-cafe-accent/20"
                  : "text-gray-500 hover:bg-cafe-fg/5 hover:text-cafe-fg",
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        tabIndex={tabIndex}
        onClick={onOpenAssistant}
        className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-cafe-accent to-cafe-accent/80 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-cafe-accent-fg shadow-lg shadow-cafe-accent/20 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-inset"
      >
        <Sparkles size={16} aria-hidden="true" /> Admin Assistant
      </button>

      <button
        type="button"
        tabIndex={tabIndex}
        onClick={onSignOut}
        disabled={isSigningOut}
        aria-busy={isSigningOut}
        className="mt-2 flex items-center gap-3 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset"
      >
        <LogOut size={16} aria-hidden="true" />
        {isSigningOut ? "Signing Out\u2026" : "Sign Out"}
      </button>
    </aside>
  );
});
