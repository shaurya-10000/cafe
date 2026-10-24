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
        // Floating panel: inset from the screen edges with rounded corners.
        "fixed bottom-3 left-3 top-3 z-[70] flex w-72 max-w-[calc(100vw-1.5rem)] flex-col",
        "rounded-[2rem] border p-5",
        // Matte surface: solid fills, no blur, soft diffuse shadow.
        "border-zinc-200 bg-zinc-50 shadow-2xl shadow-black/10",
        "dark:border-white/[0.06] dark:bg-zinc-900 dark:shadow-black/50",
        "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
        isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
      )}
    >
      <div className="mb-6 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-accent">
            <span className="text-xs font-bold uppercase text-cafe-accent-fg">
              C
            </span>
          </div>
          <span className="text-base font-bold uppercase italic tracking-tighter text-zinc-900 dark:text-zinc-100">
            Cafe
          </span>
        </div>

        <button
          type="button"
          aria-label="Close menu"
          tabIndex={tabIndex}
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
        Settings
      </p>

      <nav
        className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto"
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
                "relative flex items-center gap-3 rounded-2xl px-4 py-3",
                "text-[11px] font-black uppercase tracking-widest",
                "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-inset",
                isActive
                  ? "bg-zinc-200/70 text-zinc-900 dark:bg-white/[0.07] dark:text-white"
                  : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:hover:bg-white/[0.04] dark:hover:text-white",
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-cafe-accent"
                />
              )}
              <Icon
                size={16}
                aria-hidden="true"
                className={isActive ? "text-cafe-accent" : undefined}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-white/[0.06]">
        <button
          type="button"
          tabIndex={tabIndex}
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset disabled:opacity-50"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign Out
        </button>

        {signOutError && (
          <p
            role="alert"
            className="mt-3 px-4 text-[11px] font-bold text-red-500"
          >
            {signOutError}
          </p>
        )}
      </div>
    </aside>
  );
}
