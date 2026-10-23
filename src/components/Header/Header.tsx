"use client";

import { useMemo } from "react";

import { useHasMounted } from "@/hooks/useHasMounted";

import { usePathname } from "next/navigation";

import { useReducedMotion, useScroll, useTransform } from "framer-motion";

import { useUser } from "@clerk/nextjs";

import NotificationsSidebar from "@/components/NotificationsSidebar";
import { useApp } from "@/utils/providers/AppContext";

import { HeaderActions } from "./components/HeaderActions";
import { HeaderBackground } from "./components/HeaderBackground";
import { HeaderBrand } from "./components/HeaderBrand";
import { HeaderSkeleton } from "./components/HeaderSkeleton";
import { Z_HEADER } from "./constants";
import { useAdminRole } from "./hooks/useAdminRole";
import { useHeaderNavigation } from "./hooks/useHeaderNavigation";
import { useNotificationsSidebar } from "./hooks/useNotificationsSidebar";
import { useSignOut } from "./hooks/useSignOut";
import { cn } from "./lib/cn";
import { isDashboardArea } from "./lib/routing";
import { getUserDisplayName, getUserInitial } from "./lib/user";
import {
  HEADER_SHELL,
  NAV_RADIUS_DASHBOARD,
  NAV_RADIUS_DEFAULT,
  NAV_SHELL_BASE,
} from "./styles";
import type { MinimalUser } from "./types";

export default function Header() {
  const { user, isLoaded } = useUser();

  const { cartCount, setCartOpen, unreadCount, markAllNotificationsRead } =
    useApp();

  const pathname = usePathname();

  const prefersReducedMotion = useReducedMotion() === true;

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const backgroundOpacity = prefersReducedMotion ? null : scrollOpacity;

  // Avoid hydration mismatches: render the skeleton until the client mounts.
  const mounted = useHasMounted();

  const userId = user?.id;

  const { access, retry: retryAccess } = useAdminRole(userId);

  const notifications = useNotificationsSidebar({
    userId,
    pathname,
    unreadCount,
    markAllRead: markAllNotificationsRead,
  });

  const { onOrderClick, onCartClick } = useHeaderNavigation({
    pathname,
    prefersReducedMotion,
    setCartOpen,
  });

  const signOut = useSignOut(notifications.dismiss);

  const minimalUser = useMemo<MinimalUser | null>(() => {
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      primaryEmailAddress: user.primaryEmailAddress
        ? { emailAddress: user.primaryEmailAddress.emailAddress }
        : null,
    };
  }, [user]);

  if (!mounted || !isLoaded) {
    return <HeaderSkeleton />;
  }

  const isDashboard = isDashboardArea(pathname);
  const navRadius = isDashboard ? NAV_RADIUS_DASHBOARD : NAV_RADIUS_DEFAULT;

  return (
    <header
      className={HEADER_SHELL}
      style={{
        zIndex: Z_HEADER,
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <HeaderBackground opacity={backgroundOpacity} />

      <nav
        aria-label="Primary navigation"
        className={cn(NAV_SHELL_BASE, navRadius)}
      >
        <HeaderBrand />

        <HeaderActions
          user={minimalUser}
          displayName={getUserDisplayName(minimalUser)}
          userInitial={getUserInitial(minimalUser)}
          access={access}
          signOut={signOut}
          cartCount={cartCount}
          unreadCount={unreadCount}
          isDashboard={isDashboard}
          prefersReducedMotion={prefersReducedMotion}
          onOpenNotifications={notifications.open}
          onCartClick={onCartClick}
          onOrderClick={onOrderClick}
          onRetryAccess={retryAccess}
        />
      </nav>

      <NotificationsSidebar
        isOpen={notifications.isOpen}
        onClose={notifications.close}
        userId={user?.id ?? ""}
        isAdmin={access.isAdmin}
      />
    </header>
  );
}
