import { memo } from "react";

import type { UseSignOutResult } from "../hooks/useSignOut";
import type { AccessState, MinimalUser } from "../types";
import { CartButton } from "./CartButton";
import { DashboardLink } from "./DashboardLink";
import { NotificationsButton } from "./NotificationsButton";
import { OrderNowButton } from "./OrderNowButton";
import { SignInLink } from "./SignInLink";
import { UserMenu } from "./UserMenu";

interface HeaderActionsProps {
  user: MinimalUser | null;
  displayName: string;
  userInitial: string;
  access: AccessState;
  signOut: UseSignOutResult;
  cartCount: number;
  unreadCount: number;
  isDashboard: boolean;
  prefersReducedMotion: boolean;
  onOpenNotifications: (trigger: HTMLElement) => void;
  onCartClick: () => void;
  onOrderClick: () => void;
  onRetryAccess: () => void;
}

export const HeaderActions = memo(function HeaderActions({
  user,
  displayName,
  userInitial,
  access,
  signOut,
  cartCount,
  unreadCount,
  isDashboard,
  prefersReducedMotion,
  onOpenNotifications,
  onCartClick,
  onOrderClick,
  onRetryAccess,
}: HeaderActionsProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-4">
      {user && (
        <>
          <NotificationsButton
            unreadCount={unreadCount}
            onOpen={onOpenNotifications}
          />

          <DashboardLink access={access} isDashboard={isDashboard} />

          <CartButton
            cartCount={cartCount}
            prefersReducedMotion={prefersReducedMotion}
            onClick={onCartClick}
          />
        </>
      )}

      <OrderNowButton onClick={onOrderClick} />

      {user ? (
        <UserMenu
          user={user}
          displayName={displayName}
          userInitial={userInitial}
          access={access}
          signOut={signOut}
          prefersReducedMotion={prefersReducedMotion}
          onRetryAccess={onRetryAccess}
        />
      ) : (
        <SignInLink />
      )}
    </div>
  );
});
