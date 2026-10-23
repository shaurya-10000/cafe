"use client";

import { useUser } from "@clerk/nextjs";
import { AccountLoading } from "./components/AccountLoading";
import { ProfileTab } from "./components/ProfileTab";
import { SecurityTab } from "./components/SecurityTab";
import type { AccountSettingsProps } from "./types";

/**
 * Tab transitions are owned by the parent (SettingsContent keys its panel on
 * the active tab), so this component renders its view without wrapping
 * animation of its own.
 */
export default function AccountSettings({
  activeTab = "profile",
}: AccountSettingsProps) {
  const { isLoaded } = useUser();

  if (!isLoaded) return <AccountLoading />;

  return (
    <div className="w-full">
      {activeTab === "security" ? <SecurityTab /> : <ProfileTab />}
    </div>
  );
}
