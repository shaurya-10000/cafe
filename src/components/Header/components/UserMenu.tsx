import { useCallback, useEffect, useId, useRef, useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import { AlertCircle, LogOut, Settings } from "lucide-react";

import { SETTINGS_PATH, Z_HEADER_MENU } from "../constants";
import { useDismissable } from "../hooks/useDismissable";
import type { UseSignOutResult } from "../hooks/useSignOut";
import { cn } from "../lib/cn";
import { handleMenuKeyDown } from "../lib/menuNavigation";
import { getDashboardLabel } from "../lib/routing";
import { FOCUS_RING } from "../styles";
import type { AccessState, MinimalUser } from "../types";
import { Avatar } from "./Avatar";

interface UserMenuProps {
  user: MinimalUser;
  displayName: string;
  userInitial: string;
  access: AccessState;
  signOut: UseSignOutResult;
  prefersReducedMotion: boolean;
  onRetryAccess: () => void;
}

export function UserMenu({
  user,
  displayName,
  userInitial,
  access,
  signOut,
  prefersReducedMotion,
  onRetryAccess,
}: UserMenuProps) {
  const { isAdmin, isLoading, isError } = access;
  const { isSigningOut, signOutError, signOut: onSignOut } = signOut;

  const menuId = useId();

  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);

    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useDismissable({
    enabled: open,
    containerRef,
    onDismiss: close,
    onEscape: closeAndRestoreFocus,
  });

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      firstItemRef.current?.focus();
    });
  }, [open]);

  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={`Open account menu for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center",
          "overflow-hidden rounded-2xl",
          "bg-cafe-accent text-sm font-black uppercase",
          "text-cafe-accent-fg shadow-lg",
          FOCUS_RING,
        )}
      >
        <Avatar
          imageUrl={user.imageUrl}
          initial={userInitial}
          alt={`${displayName}'s avatar`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label="Account menu"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.14 }}
            onKeyDown={handleMenuKeyDown}
            style={{ zIndex: Z_HEADER_MENU }}
            className={cn(
              "absolute right-0 top-full mt-3 w-64",
              "origin-top-right overflow-hidden rounded-2xl",
              "border border-cafe-border",
              "bg-cafe-card shadow-2xl",
              "backdrop-blur-3xl",
            )}
          >
            <div
              role="none"
              className="border-b border-cafe-border px-4 py-3"
            >
              <p className="truncate text-xs font-bold text-cafe-fg">
                {displayName}
              </p>

              {email && (
                <p className="mt-0.5 truncate text-[10px] text-cafe-fg/60">
                  {email}
                </p>
              )}

              {isLoading && (
                <p
                  role="status"
                  className="mt-1 text-[9px] font-bold uppercase tracking-widest text-cafe-fg/50"
                >
                  Verifying access&hellip;
                </p>
              )}

              {isError && (
                <button
                  type="button"
                  role="menuitem"
                  data-menu-item="true"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onRetryAccess();
                  }}
                  className={cn(
                    "mt-1 rounded-md text-left",
                    "text-[9px] font-bold uppercase tracking-widest",
                    "text-cafe-accent underline-offset-2",
                    "hover:underline",
                    FOCUS_RING,
                  )}
                >
                  Couldn&apos;t verify access &middot; Retry
                </button>
              )}

              {isAdmin && (
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-cafe-accent">
                  {getDashboardLabel(isAdmin)}
                </p>
              )}
            </div>

            <div className="p-2">
              <Link
                ref={firstItemRef}
                href={SETTINGS_PATH}
                role="menuitem"
                data-menu-item="true"
                onClick={close}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl",
                  "px-4 py-3",
                  "text-[11px] font-bold uppercase tracking-wider",
                  "text-cafe-fg/70",
                  "transition-colors duration-200",
                  "hover:bg-cafe-fg/5 hover:text-cafe-fg",
                  FOCUS_RING,
                )}
              >
                <Settings size={14} aria-hidden="true" />
                Cafe Settings
              </Link>

              <button
                type="button"
                role="menuitem"
                data-menu-item="true"
                onClick={onSignOut}
                disabled={isSigningOut}
                aria-disabled={isSigningOut}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl",
                  "px-4 py-3 text-left",
                  "text-[11px] font-bold uppercase tracking-wider",
                  "text-red-500",
                  "transition-colors duration-200",
                  "hover:bg-red-500/10",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  FOCUS_RING,
                )}
              >
                <LogOut size={14} aria-hidden="true" />

                <span aria-live="polite">
                  {isSigningOut ? "Signing Out\u2026" : "Sign Out"}
                </span>
              </button>

              {signOutError && (
                <p
                  role="alert"
                  className={cn(
                    "mt-1 flex items-start gap-1.5 rounded-xl",
                    "px-4 py-2",
                    "text-[10px] font-semibold leading-snug",
                    "text-red-500",
                  )}
                >
                  <AlertCircle
                    size={12}
                    className="mt-[1px] shrink-0"
                    aria-hidden="true"
                  />

                  {signOutError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
