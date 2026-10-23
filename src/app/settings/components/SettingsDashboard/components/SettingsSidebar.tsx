import type { RefObject } from "react";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem, SettingsTab } from "../types";

interface SettingsSidebarProps {
  readonly id: string;
  readonly drawerRef: RefObject<HTMLElement | null>;
  readonly isOpen: boolean;
  readonly items: readonly MenuItem[];
  readonly activeTab: SettingsTab;
  readonly onSelectTab: (tab: SettingsTab) => void;
  readonly onClose: () => void;
  readonly onSignOut: () => void;
  readonly isSigningOut: boolean;
  readonly signOutError: string | null;
}

export function SettingsSidebar({
  id,
  drawerRef,
  isOpen,
  items,
  activeTab,
  onSelectTab,
  onClose,
  onSignOut,
  isSigningOut,
  signOutError,
}: SettingsSidebarProps) {
  // While closed the drawer stays mounted (for the slide transition), so its
  // controls are parked out of the tab order instead of unmounted.
  const tabIndex = isOpen ? 0 : -1;

  return (
    <aside
      ref={drawerRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Settings navigation"
      aria-hidden={!isOpen}
      tabIndex={-1}
      className={cn(
        "fixed left-0 top-0 z-[70] flex h-full w-72 shrink-0 flex-col",
        "border-r border-cafe-border bg-cafe-card p-8 backdrop-blur-xl",
        "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-accent">
            <span className="text-xs font-bold uppercase text-cafe-accent-fg">
              C
            </span>
          </div>
          <span className="text-lg font-bold uppercase italic tracking-tighter">
            Cafe
          </span>
        </div>

        <button
          type="button"
          aria-label="Close menu"
          tabIndex={tabIndex}
          onClick={onClose}
          className="text-zinc-500 transition-transform duration-300 hover:rotate-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <nav
        className="custom-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto"
        aria-label="Settings sections"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              tabIndex={tabIndex}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-5 py-3.5",
                "text-[11px] font-black uppercase tracking-widest",
                "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-inset",
                isActive
                  ? "bg-cafe-accent text-cafe-accent-fg shadow-lg shadow-cafe-accent/20"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-cafe-border pt-6">
        <button
          type="button"
          tabIndex={tabIndex}
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset disabled:opacity-50"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign Out
        </button>

        {signOutError && (
          <p
            role="alert"
            className="mt-3 px-5 text-[11px] font-bold text-red-500"
          >
            {signOutError}
          </p>
        )}
      </div>
    </aside>
  );
}
