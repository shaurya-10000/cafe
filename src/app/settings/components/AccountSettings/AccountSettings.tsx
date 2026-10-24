"use client";

import { useUser } from "@clerk/nextjs";
import { AccountLoading } from "./components/AccountLoading";
import { ProfileTab } from "./components/ProfileTab";

/**
 * Tab transitions are owned by the parent (SettingsContent keys its panel on
 * the active tab), so this component renders its view without wrapping
 * animation of its own.
 */
export default function AccountSettings() {
  const { isLoaded } = useUser();

  if (!isLoaded) return <AccountLoading />;

  return (
    <div className="w-full">
      <ProfileTab />
    </div>
  );
}
